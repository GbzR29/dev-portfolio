"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, norm, cross, type Mat4, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";
import { ortho, cubePNUT, spherePNUT, planePNUT, makeDepthTarget, FULL_VS, type DepthTarget } from "../../kit/gl/glx";
import { splits } from "./CsmSplitFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// Real cascaded shadow maps over a long avenue of trees. Per frame:
//   1. split the camera frustum at z₀ < z₁ < … < z_N (practical split scheme)
//   2. for each slice, build an orthographic light frustum around it: a tight
//      box (sharpest, but its size and position change with every camera move),
//      or a bounding sphere whose centre is snapped to whole texels (stable)
//   3. render the scene's depth into that cascade's quarter of a 2×2 atlas
//   4. shade: pick the cascade from the view depth, offset along the normal by
//      that cascade's texel size, 3×3 PCF, optional blend across the seam
// The static scene is merged into one vertex buffer, so every pass is one draw.

const DEPTH_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uLightSpace;
void main() { gl_Position = uLightSpace * vec4(aPos, 1.0); }`;
const DEPTH_FS = `#version 300 es
precision highp float;
void main() {}`;

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColor;
layout(location = 3) in vec2 aUV;
uniform mat4 uView, uProjection;
out vec3 vWorld; out vec3 vNormal; out vec3 vColor; out vec2 vUV;
void main() {
  vWorld = aPos; vNormal = aNormal; vColor = aColor; vUV = aUV;
  gl_Position = uProjection * uView * vec4(aPos, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec3 vColor; in vec2 vUV;
uniform highp sampler2D uShadow;
uniform mat4 uLS[4];
uniform vec4 uSplit;         // far end of each cascade (view depth)
uniform vec4 uTexelWorld;    // world size of one texel, per cascade
uniform vec4 uBias;          // half a texel, in each cascade's depth units
uniform int uCount;
uniform vec3 uCam, uCamF, uSun;
uniform float uAtlasTexel, uDebug, uBlend;
out vec4 FragColor;

const vec3 DEBUG[4] = vec3[4](vec3(1.0, 0.3, 0.3), vec3(0.3, 1.0, 0.4), vec3(0.35, 0.55, 1.0), vec3(1.0, 0.8, 0.2));

float shadowIn(int i, vec3 N) {
  vec3 wp = vWorld + N * uTexelWorld[i] * 1.5;                 // normal offset: one and a half texels
  vec3 p = (uLS[i] * vec4(wp, 1.0)).xyz * 0.5 + 0.5;            // orthographic: w = 1
  if (p.z > 1.0) return 0.0;
  vec2 off = vec2(float(i % 2), float(i / 2)) * 0.5;
  vec2 uv = off + p.xy * 0.5;
  vec2 lo = off + uAtlasTexel, hi = off + 0.5 - uAtlasTexel;    // stay inside this cascade's quarter
  float s = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++)
    s += p.z - uBias[i] > texture(uShadow, clamp(uv + vec2(x, y) * uAtlasTexel, lo, hi)).r ? 1.0 : 0.0;
  return s / 9.0;
}

void main() {
  vec3 N = normalize(vNormal);
  float depth = dot(vWorld - uCam, uCamF);                       // view-space depth
  int ci = -1;
  for (int i = 0; i < 4; i++) if (i < uCount && ci < 0 && depth < uSplit[i]) ci = i;
  float shadow = 0.0;
  if (ci >= 0) {
    shadow = shadowIn(ci, N);
    if (uBlend > 0.5 && ci + 1 < uCount) {                       // fade into the next cascade over the last 10%
      float start = ci == 0 ? 0.0 : uSplit[ci - 1];
      float k = smoothstep(0.9, 1.0, (depth - start) / (uSplit[ci] - start));
      if (k > 0.0) shadow = mix(shadow, shadowIn(ci + 1, N), k);
    }
  }
  vec3 albedo = vColor;
  if (vUV.x >= 0.0) { vec2 g = abs(fract(vUV) - 0.5); albedo *= 1.0 - 0.18 * step(0.46, max(g.x, g.y)); }
  if (uDebug > 0.5 && ci >= 0) albedo = mix(albedo, DEBUG[ci], 0.45);
  float diff = max(dot(N, uSun), 0.0);
  vec3 amb = mix(vec3(0.16, 0.15, 0.13), vec3(0.2, 0.25, 0.34), N.y * 0.5 + 0.5);
  vec3 c = albedo * (amb + diff * (1.0 - shadow) * vec3(1.0, 0.94, 0.82));
  float fog = 1.0 - exp(-max(depth, 0.0) * 0.006);
  c = mix(c, vec3(0.62, 0.72, 0.85), fog);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const ATLAS_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform highp sampler2D uShadow;
out vec4 FragColor;
void main() {
  float d = texture(uShadow, vUV).r;
  vec2 g = abs(vUV - 0.5);
  float line = step(min(g.x, g.y), 0.004);
  FragColor = vec4(mix(vec3(pow(d, 1.5)), vec3(1.0, 0.6, 0.1), line), 1.0);
}`;

// ── The static scene, merged into one buffer ─────────────────────────────────
type Item = { mesh: "cube" | "sphere" | "plane"; p: Vec3; s: Vec3; rot?: number; color: Vec3; grid?: boolean };

function buildScene(): Item[] {
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const items: Item[] = [{ mesh: "plane", p: [0, 0, -120], s: [320, 1, 320], color: [0.55, 0.6, 0.5], grid: true }];
  for (let i = 0; i < 34; i++) for (const side of [-1, 1]) {
    const x = side * (3.4 + rnd() * 2.6), z = 3 - i * 4.2 - rnd() * 1.5, h = 2 + rnd() * 1.2, c = 1.5 + rnd() * 0.8;
    items.push({ mesh: "cube", p: [x, h / 2, z], s: [0.28, h, 0.28], color: [0.45, 0.32, 0.22] });
    items.push({ mesh: "sphere", p: [x, h + c * 0.3, z], s: [c, c * 1.15, c], color: [0.25 + rnd() * 0.1, 0.5 + rnd() * 0.15, 0.22] });
  }
  for (let z = 4; z > -30; z -= 0.7) items.push({ mesh: "cube", p: [-1.7, 0.45, z], s: [0.07, 0.9, 0.07], color: [0.85, 0.85, 0.8] });   // fence posts
  items.push({ mesh: "cube", p: [-1.7, 0.72, -13], s: [0.04, 0.05, 34], color: [0.85, 0.85, 0.8] });
  items.push({ mesh: "cube", p: [-1.7, 0.35, -13], s: [0.04, 0.05, 34], color: [0.85, 0.85, 0.8] });
  ([[1.3, -2, 0.8, 0.4], [1.9, -2.6, 0.6, 0.9], [1.5, -2.3, 0.5, 0.2], [0.9, -6, 1.1, 0.7]] as const).forEach(([x, z, s, r]) =>
    items.push({ mesh: "cube", p: [x, s / 2, z], s: [s, s, s], rot: r, color: [0.8, 0.55, 0.25] }));
  items.push({ mesh: "sphere", p: [0.4, 0.45, -3.5], s: [0.9, 0.9, 0.9], color: [0.9, 0.9, 0.92] });
  for (let i = 0; i < 26; i++) {
    const x = (rnd() - 0.5) * 70, z = -40 - rnd() * 170, h = 3 + rnd() * 8;
    if (Math.abs(x) < 8) continue;
    items.push({ mesh: "cube", p: [x, h / 2, z], s: [1.5 + rnd() * 2, h, 1.5 + rnd() * 2], rot: rnd() * 3, color: [0.7, 0.68, 0.72] });
  }
  return items;
}

function mergeScene(gl: WebGL2RenderingContext) {
  const src = { cube: cubePNUT(), sphere: spherePNUT(16, 24), plane: planePNUT(160) };
  const out: number[] = [];
  for (const it of buildScene()) {
    const d = src[it.mesh], c = Math.cos(it.rot ?? 0), sn = Math.sin(it.rot ?? 0);
    const R = (v: Vec3): Vec3 => [c * v[0] + sn * v[2], v[1], -sn * v[0] + c * v[2]];
    for (let i = 0; i < d.length; i += 11) {
      const p = R([d[i] * it.s[0], d[i + 1] * it.s[1], d[i + 2] * it.s[2]]);
      const n = norm(R([d[i + 3] / it.s[0], d[i + 4] / it.s[1], d[i + 5] / it.s[2]]));   // inverse-transpose of R·S
      out.push(p[0] + it.p[0], p[1] + it.p[1], p[2] + it.p[2], ...n, ...it.color, it.grid ? d[i + 6] : -1, it.grid ? d[i + 7] : -1);
    }
  }
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STATIC_DRAW);
  const S = 44;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, S, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, S, 36);
  return { vao, count: out.length / 11 };
}

// ── Cascade fitting ───────────────────────────────────────────────────────────
const xf = (m: Mat4, p: Vec3): Vec3 => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

function fitCascade(cam: Vec3, f: Vec3, r: Vec3, u: Vec3, tanX: number, tanY: number, zn: number, zf: number, sun: Vec3, S: number, stable: boolean) {
  const corners: Vec3[] = [];
  for (const d of [zn, zf]) for (const sx of [-1, 1]) for (const sy of [-1, 1])
    corners.push([0, 1, 2].map(k => cam[k] + f[k] * d + r[k] * sx * d * tanX + u[k] * sy * d * tanY) as Vec3);
  const up: Vec3 = Math.abs(sun[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
  const rot = mat4.lookAt([0, 0, 0], [-sun[0], -sun[1], -sun[2]], up);   // looks from the sun; no translation
  let minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number;
  if (stable) {
    const ctr = [0, 1, 2].map(k => corners.reduce((s, c) => s + c[k], 0) / 8) as Vec3;
    let rad = Math.max(...corners.map(c => Math.hypot(c[0] - ctr[0], c[1] - ctr[1], c[2] - ctr[2])));
    rad = Math.ceil(rad * 16) / 16;                                   // quantise so float noise does not change the size
    const cl = xf(rot, ctr), texel = (2 * rad) / S;
    const cx = Math.floor(cl[0] / texel) * texel, cy = Math.floor(cl[1] / texel) * texel;   // snap to whole texels
    [minX, maxX, minY, maxY, minZ, maxZ] = [cx - rad, cx + rad, cy - rad, cy + rad, cl[2] - rad, cl[2] + rad];
  } else {
    const lc = corners.map(c => xf(rot, c));
    minX = Math.min(...lc.map(p => p[0])); maxX = Math.max(...lc.map(p => p[0]));
    minY = Math.min(...lc.map(p => p[1])); maxY = Math.max(...lc.map(p => p[1]));
    minZ = Math.min(...lc.map(p => p[2])); maxZ = Math.max(...lc.map(p => p[2]));
  }
  const extra = 40;                                                   // reach casters between the slice and the sun
  const proj = ortho(minX, maxX, minY, maxY, -(maxZ + extra), -minZ);
  const texelWorld = Math.max(maxX - minX, maxY - minY) / S;
  return { ls: mat4.multiply(proj, rot), texelWorld, bias: (0.5 * texelWorld) / (maxZ + extra - minZ) * 2 };
}

type Res = {
  depth: WebGLProgram; main: WebGLProgram; atlas: WebGLProgram;
  scene: { vao: WebGLVertexArrayObject; count: number }; full: WebGLVertexArrayObject; target: DepthTarget | null;
};

export function CsmFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.12, pitch: -0.1, fov: 1.0 });
  const [count, setCount] = useState(4);
  const [lambda, setLambda] = useState(0.75);
  const [dist, setDist] = useState(120);
  const [res, setRes] = useState(512);
  const [stable, setStable] = useState(true);
  const [debug, setDebug] = useState(true);
  const [blend, setBlend] = useState(false);
  const [walk, setWalk] = useState(false);
  const [elev, setElev] = useState(32);
  const [showAtlas, setShowAtlas] = useState(true);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(walk && vis.on);

  const sun = norm([Math.cos((elev * Math.PI) / 180) * 0.55, Math.sin((elev * Math.PI) / 180), -Math.cos((elev * Math.PI) / 180) * 0.83]);

  const init = (gl: WebGL2RenderingContext): Res => ({
    depth: compileProgram(gl, DEPTH_VS, DEPTH_FS), main: compileProgram(gl, VS, FS), atlas: compileProgram(gl, FULL_VS, ATLAS_FS),
    scene: mergeScene(gl), full: gl.createVertexArray()!, target: null,
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    if (!r.target || r.target.size !== res * 2) {
      if (r.target) { gl.deleteTexture(r.target.tex); gl.deleteFramebuffer(r.target.fbo); }
      r.target = makeDepthTarget(gl, res * 2);
    }
    // Camera: fixed spot, or walking down the avenue with a slight sway
    const tw = walk ? time : 0;
    const cam: Vec3 = [Math.sin(tw * 0.4) * 0.6, 1.7, 5 - ((tw * 1.6) % 50)];
    const lk = { ...look, yaw: look.yaw + (walk ? Math.sin(tw * 0.3) * 0.15 : 0) };
    const f = forwardFrom(lk.yaw, lk.pitch), rt = norm(cross(f, [0, 1, 0])), up = cross(rt, f);
    const V = mat4.lookAt(cam, [cam[0] + f[0], cam[1] + f[1], cam[2] + f[2]], [0, 1, 0]);
    const P = mat4.perspective(lk.fov, size.aspect, 0.1, 400);
    const tanY = Math.tan(lk.fov / 2), tanX = tanY * size.aspect;

    const z = splits(0.3, dist, count, lambda);
    const cascades = z.slice(0, -1).map((zn, i) => fitCascade(cam, f, rt, up, tanX, tanY, zn, z[i + 1], sun, res, stable));

    // ── Shadow passes: one quarter of the atlas each ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, res * 2, res * 2);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);
    gl.useProgram(r.depth);
    gl.bindVertexArray(r.scene.vao);
    cascades.forEach((c, i) => {
      const ox = (i % 2) * res, oy = Math.floor(i / 2) * res;
      gl.viewport(ox, oy, res, res);
      gl.scissor(ox, oy, res, res);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.depth, "uLightSpace"), false, c.ls);
      gl.drawArrays(gl.TRIANGLES, 0, r.scene.count);
    });
    gl.disable(gl.SCISSOR_TEST);

    // ── Camera pass ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.62, 0.72, 0.85, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(r.main);
    const u = (n: string) => gl.getUniformLocation(r.main, n);
    const pad = (a: number[], v = 0) => [...a, v, v, v, v].slice(0, 4);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    const ls = new Float32Array(64);
    cascades.forEach((c, i) => ls.set(c.ls, i * 16));
    gl.uniformMatrix4fv(u("uLS"), false, ls);
    gl.uniform4fv(u("uSplit"), pad(z.slice(1), 1e9));
    gl.uniform4fv(u("uTexelWorld"), pad(cascades.map(c => c.texelWorld)));
    gl.uniform4fv(u("uBias"), pad(cascades.map(c => c.bias)));
    gl.uniform1i(u("uCount"), count);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform3fv(u("uCamF"), f);
    gl.uniform3fv(u("uSun"), sun);
    gl.uniform1f(u("uAtlasTexel"), 1 / (res * 2));
    gl.uniform1f(u("uDebug"), debug ? 1 : 0);
    gl.uniform1f(u("uBlend"), blend ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.target.tex);
    gl.uniform1i(u("uShadow"), 0);
    gl.bindVertexArray(r.scene.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.scene.count);

    // ── Atlas inset ──
    if (showAtlas) {
      const s = Math.round(Math.min(size.w, size.h) * 0.32);
      gl.disable(gl.DEPTH_TEST);
      gl.viewport(size.w - s - 8, 8, s, s);
      gl.useProgram(r.atlas);
      gl.uniform1i(gl.getUniformLocation(r.atlas, "uShadow"), 0);
      gl.bindVertexArray(r.full);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figCsm_title", "Cascaded Shadow Maps — Live")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figCsm_hint", "drag to look around · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <GLView<Res> init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-0.9, Math.min(0.35, l.pitch)) })} fovRange={[0.25, 1.4]}
          frame={[look, count, lambda, dist, res, stable, debug, blend, walk ? time : 0, elev, showAtlas]} aspect={16 / 9} />
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{tx(t, "figCsm_fit", "fit")}</span>
          <button className={btn(!stable)} onClick={() => setStable(false)}>tight box</button>
          <button className={btn(stable)} onClick={() => setStable(true)}>sphere + texel snap</button>
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-3">{tx(t, "figCsm_res", "map / cascade")}</span>
          {[256, 512, 1024].map(s => <button key={s} className={btn(res === s)} onClick={() => setRes(s)}>{s}²</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["cascades", count, setCount, 1, 4, 1], ["λ split", lambda, setLambda, 0, 1, 0.05], ["shadow dist", dist, setDist, 20, 220, 5], ["sun elevation", elev, setElev, 8, 85, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          {([["colour cascades", debug, setDebug], ["blend seams", blend, setBlend], ["walk (watch for shimmer)", walk, setWalk], ["show atlas", showAtlas, setShowAtlas]] as const).map(([lbl, v, set]) => (
            <label key={lbl} className="flex items-center gap-1.5"><input type="checkbox" checked={v} onChange={e => set(e.target.checked)} className="accent-[var(--primary)]" />{lbl}</label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {count === 1
            ? tx(t, "figCsm_oneNote", "One map for the whole shadow distance: the fence posts right next to you cast blurry, blocky smudges or vanish entirely, because each texel covers several centimetres of ground. Add cascades and watch the near shadows sharpen while the far ones stay the same.")
            : tx(t, "figCsm_note", "Each colour is one cascade; the inset shows the four depth maps in the atlas. Turn on walk with the tight box: shadow edges crawl and flicker as the box resizes and slides by fractions of a texel every frame. With the sphere fit snapped to texels the edges stay still. Blend seams hides the jump in sharpness where one cascade hands over to the next.")}
        </p>
      </div>
    </figure>
  );
}
