"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, norm, cross, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { uploadMesh, planePNUT, trs, type Mesh } from "../../kit/gl/glx";
import { LIT_VS, LIT_FS, SUN } from "../post/scene";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A complete CPU particle system, the way the chapter builds it:
//   • a fixed-size pool; dead particles are swapped with the last live one,
//     so the live ones are always the first `alive` entries
//   • an emission accumulator that spawns fractional rates correctly
//   • semi-implicit Euler with gravity and exponential drag
//   • colour and size taken from curves over normalised age t = age / life
//   • one instanced draw per frame: 4 strip vertices × N instances, each
//     instance a camera-facing quad built in the vertex shader
//   • additive, alpha or premultiplied blending, optional back-to-front sort
// "overdraw" replaces the colour with a constant added once per fragment:
// the brighter a pixel, the more particle fragments were shaded there.

const VS = `#version 300 es
layout(location = 0) in vec3 iPos;
layout(location = 1) in float iSize;
layout(location = 2) in vec4 iColor;
layout(location = 3) in float iRot;
uniform mat4 uView, uProjection;
uniform vec3 uRight, uUp;
out vec2 vUV; out vec4 vColor;
void main() {
  // Strip corners from the vertex index: (−1,−1) (1,−1) (−1,1) (1,1)
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  float cs = cos(iRot), sn = sin(iRot);
  vec2 rc = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
  vec3 world = iPos + (uRight * rc.x + uUp * rc.y) * iSize * 0.5;
  vUV = c * 0.5 + 0.5; vColor = iColor;
  gl_Position = uProjection * uView * vec4(world, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vColor;
uniform int uMode;            // 0 additive, 1 alpha, 2 premultiplied, 3 overdraw
uniform float uQuads;
out vec4 FragColor;
void main() {
  float r = length(vUV * 2.0 - 1.0);
  float a = 1.0 - smoothstep(0.0, 1.0, r);
  a *= a;                                                       // soft round sprite
  vec2 e = min(vUV, 1.0 - vUV);
  float edge = uQuads > 0.5 ? 1.0 - smoothstep(0.0, 0.03, min(e.x, e.y)) : 0.0;
  if (uMode == 3) { FragColor = vec4(vec3(0.07, 0.035, 0.015) + edge * 0.2, 1.0); return; }
  float alpha = vColor.a * a;
  if (uMode == 0) FragColor = vec4(vColor.rgb * alpha + edge * 0.35, 1.0);                 // ONE, ONE
  else if (uMode == 1) FragColor = vec4(mix(vColor.rgb, vec3(1.0), edge), max(alpha, edge * 0.6)); // SRC_ALPHA, 1−SRC_ALPHA
  else FragColor = vec4(vColor.rgb * alpha + edge * 0.35, alpha);                        // ONE, 1−SRC_ALPHA
}`;

type Key = [number, number, number, number, number];   // t, r, g, b, a
type Preset = {
  rate: number; life: [number, number]; speed: [number, number]; spread: number; disc: number;
  gravity: number; drag: number; size: [number, number]; ramp: Key[]; blend: number; bounce: number; shade: number; spin: number;
};
const PRESETS: Record<string, Preset> = {
  fire: { rate: 240, life: [0.8, 1.4], speed: [1.0, 2.0], spread: 0.35, disc: 0.35, gravity: 1.4, drag: 1.3, size: [0.6, 0.12], blend: 0, bounce: 0, shade: 0, spin: 1,
    ramp: [[0, 1, 0.85, 0.45, 0], [0.08, 1, 0.7, 0.28, 0.5], [0.45, 1, 0.32, 0.06, 0.32], [1, 0.3, 0.05, 0.02, 0]] },
  smoke: { rate: 55, life: [3, 4.5], speed: [0.6, 1.0], spread: 0.25, disc: 0.25, gravity: 0.35, drag: 0.5, size: [0.5, 2.2], blend: 1, bounce: 0, shade: 0.45, spin: 0.6,
    ramp: [[0, 0.35, 0.33, 0.32, 0], [0.12, 0.35, 0.33, 0.32, 0.7], [0.6, 0.55, 0.54, 0.53, 0.45], [1, 0.75, 0.75, 0.75, 0]] },
  fountain: { rate: 420, life: [2.2, 2.8], speed: [5.0, 5.6], spread: 0.16, disc: 0.05, gravity: -9.8, drag: 0.1, size: [0.13, 0.08], blend: 2, bounce: 0.35, shade: 0, spin: 0,
    ramp: [[0, 0.7, 0.9, 1, 0.9], [0.7, 0.35, 0.6, 1, 0.7], [1, 0.3, 0.5, 0.9, 0]] },
  sparks: { rate: 260, life: [0.6, 1.3], speed: [3, 6.5], spread: 0.9, disc: 0.02, gravity: -9.8, drag: 0.7, size: [0.08, 0.04], blend: 0, bounce: 0.45, shade: 0, spin: 0,
    ramp: [[0, 1, 1, 0.85, 1], [0.35, 1, 0.75, 0.3, 1], [1, 0.9, 0.25, 0.05, 0]] },
};
const BLENDS = ["additive", "alpha", "premultiplied", "overdraw"] as const;
const CAP = 4000;

function ramp(keys: Key[], t: number): [number, number, number, number] {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], k = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0] || 1)));
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k, a[4] + (b[4] - a[4]) * k];
}

type Pool = {
  p: Float32Array; v: Float32Array; age: Float32Array; life: Float32Array; shade: Float32Array; rot: Float32Array; spin: Float32Array;
  alive: number; acc: number; last: number; preset: string;
};
const newPool = (preset: string, now: number): Pool => ({
  p: new Float32Array(CAP * 3), v: new Float32Array(CAP * 3), age: new Float32Array(CAP), life: new Float32Array(CAP),
  shade: new Float32Array(CAP), rot: new Float32Array(CAP), spin: new Float32Array(CAP), alive: 0, acc: 0, last: now, preset,
});

type Res = { prog: WebGLProgram; lit: WebGLProgram; floor: Mesh; vao: WebGLVertexArrayObject; vbo: WebGLBuffer; inst: Float32Array; pool: Pool | null };

export function ParticlesFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.4, pitch: -0.22, fov: 0.9 });
  const [preset, setPreset] = useState("fire");
  const [blend, setBlend] = useState(0);
  const [sort, setSort] = useState(false);
  const [quads, setQuads] = useState(false);
  const [rateK, setRateK] = useState(1);
  const [gravK, setGravK] = useState(1);
  const [dragK, setDragK] = useState(1);
  const [sizeK, setSizeK] = useState(1);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ alive: 0, sortMs: 0 });
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(!paused && vis.on);

  const choose = (name: string) => { setPreset(name); setBlend(PRESETS[name].blend); setSort(PRESETS[name].blend === 1); };

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!, vbo = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, CAP * 9 * 4, gl.STREAM_DRAW);
    const S = 36;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, S, 16);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 32);
    [0, 1, 2, 3].forEach(i => gl.vertexAttribDivisor(i, 1));          // advance once per instance, not per vertex
    return {
      prog: compileProgram(gl, VS, FS), lit: compileProgram(gl, LIT_VS, LIT_FS), floor: uploadMesh(gl, planePNUT(6)),
      vao, vbo, inst: new Float32Array(CAP * 9), pool: null,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const P = PRESETS[preset];
    if (!r.pool || r.pool.preset !== preset) r.pool = newPool(preset, time);
    const pool = r.pool;
    const dt = Math.min(0.05, Math.max(0, time - pool.last));
    pool.last = time;

    // ── Emit: carry the fractional part so 55.5 particles/s really averages 55.5 ──
    pool.acc += P.rate * rateK * dt;
    let spawn = Math.floor(pool.acc);
    pool.acc -= spawn;
    while (spawn-- > 0 && pool.alive < CAP) {
      const i = pool.alive++;
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * P.disc;
      pool.p.set([Math.cos(a) * rr, 0.05, Math.sin(a) * rr], i * 3);
      // Direction: up, tilted by a random angle inside the spread cone
      const th = Math.random() * P.spread, ph = Math.random() * Math.PI * 2;
      const sp = P.speed[0] + Math.random() * (P.speed[1] - P.speed[0]);
      pool.v.set([Math.sin(th) * Math.cos(ph) * sp, Math.cos(th) * sp, Math.sin(th) * Math.sin(ph) * sp], i * 3);
      pool.age[i] = 0;
      pool.life[i] = P.life[0] + Math.random() * (P.life[1] - P.life[0]);
      pool.shade[i] = 1 - Math.random() * P.shade;
      pool.rot[i] = Math.random() * Math.PI * 2;
      pool.spin[i] = (Math.random() - 0.5) * 2 * P.spin;
    }

    // ── Update: semi-implicit Euler, exponential drag, swap-remove the dead ──
    const g = P.gravity * gravK, damp = Math.exp(-P.drag * dragK * dt);
    for (let i = 0; i < pool.alive;) {
      pool.age[i] += dt;
      if (pool.age[i] >= pool.life[i]) {
        const last = --pool.alive;                                     // move the last live particle into this slot
        pool.p.copyWithin(i * 3, last * 3, last * 3 + 3); pool.v.copyWithin(i * 3, last * 3, last * 3 + 3);
        pool.age[i] = pool.age[last]; pool.life[i] = pool.life[last]; pool.shade[i] = pool.shade[last];
        pool.rot[i] = pool.rot[last]; pool.spin[i] = pool.spin[last];
        continue;                                                      // re-examine slot i
      }
      const k = i * 3;
      pool.v[k + 1] += g * dt;
      pool.v[k] *= damp; pool.v[k + 1] *= damp; pool.v[k + 2] *= damp;
      pool.p[k] += pool.v[k] * dt; pool.p[k + 1] += pool.v[k + 1] * dt; pool.p[k + 2] += pool.v[k + 2] * dt;
      if (P.bounce > 0 && pool.p[k + 1] < 0) { pool.p[k + 1] = 0; pool.v[k + 1] *= -P.bounce; pool.v[k] *= 0.8; pool.v[k + 2] *= 0.8; }
      pool.rot[i] += pool.spin[i] * dt;
      i++;
    }

    // ── Camera ──
    const f = forwardFrom(look.yaw, look.pitch), target: Vec3 = [0, 1.1, 0];
    const cam: Vec3 = [target[0] - f[0] * 5.2, Math.max(0.2, target[1] - f[1] * 5.2), target[2] - f[2] * 5.2];
    const V = mat4.lookAt(cam, target, [0, 1, 0]);
    const Pm = mat4.perspective(look.fov, size.aspect, 0.05, 60);
    const fwd = norm([target[0] - cam[0], target[1] - cam[1], target[2] - cam[2]]);
    const right = norm(cross(fwd, [0, 1, 0])), up = cross(right, fwd);

    // ── Order: back to front by view depth, only when asked ──
    const order = Array.from({ length: pool.alive }, (_, i) => i);
    let sortMs = 0;
    if (sort) {
      const t0 = performance.now();
      const depth = new Float32Array(pool.alive);
      for (let i = 0; i < pool.alive; i++) depth[i] = (pool.p[i * 3] - cam[0]) * fwd[0] + (pool.p[i * 3 + 1] - cam[1]) * fwd[1] + (pool.p[i * 3 + 2] - cam[2]) * fwd[2];
      order.sort((a, b) => depth[b] - depth[a]);
      sortMs = performance.now() - t0;
    }
    // ── Fill the instance buffer: pos, size, rgba, rotation ──
    order.forEach((i, n) => {
      const tt = pool.age[i] / pool.life[i];
      const c = ramp(P.ramp, tt), s = pool.shade[i];
      const sz = (P.size[0] + (P.size[1] - P.size[0]) * tt) * sizeK;
      r.inst.set([pool.p[i * 3], pool.p[i * 3 + 1], pool.p[i * 3 + 2], sz, c[0] * s, c[1] * s, c[2] * s, c[3], pool.rot[i]], n * 9);
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, CAP * 9 * 4, gl.STREAM_DRAW);       // orphan: fresh storage, no wait on the GPU
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.inst, 0, pool.alive * 9);

    // ── Floor ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    const dark = blend === 3;
    gl.clearColor(dark ? 0 : 0.09, dark ? 0 : 0.1, dark ? 0 : 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    if (!dark) {
      gl.useProgram(r.lit);
      const l = (n: string) => gl.getUniformLocation(r.lit, n);
      gl.uniformMatrix4fv(l("uView"), false, V);
      gl.uniformMatrix4fv(l("uProjection"), false, Pm);
      gl.uniformMatrix4fv(l("uModel"), false, trs([0, 0, 0], [12, 1, 12]));
      gl.uniform3fv(l("uColor"), [0.13, 0.135, 0.15]);
      gl.uniform3fv(l("uCam"), cam);
      gl.uniform3fv(l("uSun"), SUN);
      gl.uniform1f(l("uGrid"), 1);
      gl.bindVertexArray(r.floor.vao);
      gl.drawArrays(gl.TRIANGLES, 0, r.floor.count);
    }

    // ── Particles: depth test on (the floor hides them), depth writes off (they never hide each other) ──
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, Pm);
    gl.uniform3fv(u("uRight"), right);
    gl.uniform3fv(u("uUp"), up);
    gl.uniform1i(u("uMode"), blend);
    gl.uniform1f(u("uQuads"), quads ? 1 : 0);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    if (blend === 0 || blend === 3) gl.blendFunc(gl.ONE, gl.ONE);
    else if (blend === 1) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(r.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, pool.alive);
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    if (Math.abs(stats.alive - pool.alive) > 3 || Math.abs(stats.sortMs - sortMs) > 0.05) setStats({ alive: pool.alive, sortMs });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const note = blend === 3
    ? tx(t, "figPart_overdrawNote", "Overdraw view: each particle fragment adds a little light. White means dozens of layers of transparent quads on the same pixel. Big, soft smoke sprites are cheap to simulate but fill the screen many times over; this is the real cost of particles, and why engines render them at half resolution.")
    : blend === 1 && !sort
      ? tx(t, "figPart_unsortedNote", "Alpha blending without sorting: the draw order is the pool order, which swap-remove keeps shuffling. Dark puffs that are behind get drawn on top of lighter ones in front, and the smoke flickers as the order changes. Tick sort to fix it.")
      : blend === 0
        ? tx(t, "figPart_addNote", "Additive blending only adds light, and addition does not care about order, so no sort is needed. Perfect for fire, sparks and magic, and useless for smoke, which has to darken what is behind it.")
        : tx(t, "figPart_note", "Premultiplied alpha stores colour already multiplied by alpha, and blends with ONE, ONE_MINUS_SRC_ALPHA. With alpha = 1 it behaves like normal blending, with alpha = 0 like pure addition, so fire and smoke can share one draw call and one blend state.");

  return (
    <FigureShell ref={vis.ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPart_title", "A Particle System — Pool, Simulation, Instanced Billboards")}
        </span>
        <div className="flex gap-1.5 flex-wrap">{Object.keys(PRESETS).map(p => <button key={p} className={btn(preset === p)} onClick={() => choose(p)}>{p}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-1.3, Math.min(0.1, l.pitch)) })} fovRange={[0.4, 1.4]}
          frame={[look, time, preset, blend, sort, quads, rateK, gravK, dragK, sizeK]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none leading-relaxed">
          <div>{stats.alive} / {CAP} {tx(t, "figPart_alive", "alive")} · 1 {tx(t, "figPart_draw", "draw call")}</div>
          <div>{((stats.alive * 36) / 1024).toFixed(1)} KB {tx(t, "figPart_upload", "uploaded / frame")}{sort ? ` · sort ${stats.sortMs.toFixed(2)} ms` : ""}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">blend</span>
          {BLENDS.map((b, i) => <button key={b} className={btn(blend === i)} onClick={() => setBlend(i)}>{b}</button>)}
          <button className={`${btn(paused)} ml-auto`} onClick={() => setPaused(p => !p)}>{paused ? "▶ play" : "❚❚ pause"}</button>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["rate ×", rateK, setRateK, 0, 4, 0.1], ["gravity ×", gravK, setGravK, -1, 2, 0.1], ["drag ×", dragK, setDragK, 0, 4, 0.1], ["size ×", sizeK, setSizeK, 0.2, 3, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={sort} onChange={e => setSort(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figPart_sort", "sort back to front")}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={quads} onChange={e => setQuads(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figPart_quads", "show quad outlines")}</label>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>
      </div>
    </FigureShell>
  );
}
