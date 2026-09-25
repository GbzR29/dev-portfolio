"use client";

import { useState } from "react";
import { useVisible } from "../../kit/figure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { cubePNUT, ensureColorTarget, FULL_VS, drawFullscreen, type ColorTarget } from "../../kit/gl/glx";

// ── What this figure shows ────────────────────────────────────────────────────
// A real experiment, not a simulation. Every knob loads a different part of
// the machine:
//   objects + "draw per object" → CPU/driver cost (one uniform + one draw each)
//   objects + "instanced"       → the same geometry for one API call
//   fragment work               → ALU cost per pixel (a loop in the shader)
//   resolution scale            → number of pixels, i.e. everything per-pixel
//   fullscreen layers           → pure fill rate / bandwidth (blended quads)
// It measures the frame interval (requestAnimationFrame), the CPU time spent
// issuing GL calls, and — where the browser exposes it — GPU time from
// EXT_disjoint_timer_query_webgl2, read a few frames late so it never stalls.
// It only runs while it is on screen.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 4) in vec4 aOffset;        // instanced: x, z, phase, scale
uniform vec4 uOffset;                        // per-draw: the same data as a uniform
uniform bool uInstanced;
uniform mat4 uView, uProjection;
uniform float uTime;
out vec3 vNormal; out vec3 vWorld;
void main() {
  vec4 o = uInstanced ? aOffset : uOffset;
  float a = uTime * 0.8 + o.z;
  mat3 R = mat3(cos(a), 0.0, -sin(a), 0.0, 1.0, 0.0, sin(a), 0.0, cos(a));
  vec3 p = R * aPos * o.w + vec3(o.x, 0.5 * o.w, o.y);
  vNormal = R * aNormal; vWorld = p;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vNormal; in vec3 vWorld;
uniform int uIter;
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  float acc = 0.0;
  for (int i = 0; i < 400; i++) {                    // deliberate ALU work
    if (i >= uIter) break;
    acc += sin(acc * 1.3 + vWorld.x * float(i) * 0.01) * 0.001;
  }
  vec3 base = 0.5 + 0.5 * cos(vec3(0.0, 2.0, 4.0) + vWorld.x * 0.15 + vWorld.z * 0.1);
  vec3 c = base * (0.3 + 0.7 * max(dot(N, normalize(vec3(0.4, 0.8, 0.3))), 0.0)) + acc;
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const LAYER_FS = `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 FragColor;
void main() { FragColor = vec4(0.5, 0.6, 1.0, 0.02); }`;
const COPY_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTex;
out vec4 FragColor;
void main() { FragColor = texture(uTex, vUV); }`;

const MAX = 6400;

type Timer = { ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null; free: WebGLQuery[]; pending: WebGLQuery[] };
type Res = {
  prog: WebGLProgram; layer: WebGLProgram; copy: WebGLProgram;
  cube: WebGLVertexArrayObject; inst: WebGLVertexArrayObject; full: WebGLVertexArrayObject; count: number;
  offsets: Float32Array; target: ColorTarget | null; timer: Timer;
  last: number; frame: number; cpu: number; gpu: number; frameMs: number; frames: number;
};

/** Grid positions ordered in square rings from the centre, so the first N always form a centred block. */
function makeOffsets() {
  const side = Math.ceil(Math.sqrt(MAX)), cells: [number, number][] = [];
  for (let i = 0; i < side * side; i++) cells.push([(i % side) - side / 2 + 0.5, Math.floor(i / side) - side / 2 + 0.5]);
  cells.sort((a, b) => Math.max(Math.abs(a[0]), Math.abs(a[1])) - Math.max(Math.abs(b[0]), Math.abs(b[1])) || a[1] - b[1] || a[0] - b[0]);
  const out = new Float32Array(MAX * 4);
  for (let i = 0; i < MAX; i++) out.set([cells[i][0] * 1.4, cells[i][1] * 1.4, (i * 0.618) % 6.28, 0.55 + ((i * 37) % 10) * 0.03], i * 4);
  return out;
}

export function BottleneckLabFigure({ t }: { t?: TrackTranslations }) {
  const { ref, on: inView } = useVisible<HTMLElement>();
  const [look, setLook] = useState<Look>({ yaw: -0.5, pitch: -0.55, fov: 1.0 });
  const [count, setCount] = useState(1500);
  const [instanced, setInstanced] = useState(false);
  const [iter, setIter] = useState(0);
  const [scale, setScale] = useState(1);
  const [layers, setLayers] = useState(0);
  const [stats, setStats] = useState({ frameMs: 0, cpu: 0, gpu: -1, res: "" });
  const time = useAnimationTime(inView);

  const init = (gl: WebGL2RenderingContext): Res => {
    const mesh = cubePNUT();
    const cube = gl.createVertexArray()!, inst = gl.createVertexArray()!;
    const vbo = gl.createBuffer()!, ibo = gl.createBuffer()!;
    const offsets = makeOffsets();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ARRAY_BUFFER, offsets, gl.STATIC_DRAW);
    for (const [vao, withInst] of [[cube, false], [inst, true]] as const) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
      if (withInst) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ibo);
        gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16, 0);
        gl.vertexAttribDivisor(4, 1);
      }
    }
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as Timer["ext"];
    return {
      prog: compileProgram(gl, VS, FS), layer: compileProgram(gl, FULL_VS, LAYER_FS), copy: compileProgram(gl, FULL_VS, COPY_FS),
      cube, inst, full: gl.createVertexArray()!, count: mesh.length / 11, offsets, target: null,
      timer: { ext, free: ext ? [0, 1, 2, 3, 4].map(() => gl.createQuery()!) : [], pending: [] },
      last: performance.now(), frame: 0, cpu: 0, gpu: -1, frameMs: 0, frames: 0,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const now = performance.now();
    const dt = now - r.last;
    r.last = now;
    if (dt < 250) r.frameMs = r.frameMs ? r.frameMs * 0.9 + dt * 0.1 : dt;   // smoothed frame interval
    const c0 = performance.now();

    // Collect finished GPU timings (a few frames old: asking earlier would stall)
    const T = r.timer;
    if (T.ext) {
      const disjoint = gl.getParameter(T.ext.GPU_DISJOINT_EXT);
      while (T.pending.length && gl.getQueryParameter(T.pending[0], gl.QUERY_RESULT_AVAILABLE)) {
        const q = T.pending.shift()!;
        const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
        if (!disjoint) r.gpu = r.gpu < 0 ? ns / 1e6 : r.gpu * 0.9 + (ns / 1e6) * 0.1;
        T.free.push(q);
      }
    }
    const q = T.ext && T.free.length ? T.free.shift()! : null;
    if (q && T.ext) gl.beginQuery(T.ext.TIME_ELAPSED_EXT, q);

    const w = Math.max(1, Math.round(size.w * scale)), h = Math.max(1, Math.round(size.h * scale));
    r.target = ensureColorTarget(gl, r.target, w, h, { depth: true });
    gl.bindFramebuffer(gl.FRAMEBUFFER, r.target.fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.07, 0.08, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const f = forwardFrom(look.yaw, look.pitch);
    const dist = 10 + Math.sqrt(count) * 1.25;
    const cam: Vec3 = [-f[0] * dist, -f[1] * dist, -f[2] * dist];
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniformMatrix4fv(u("uView"), false, mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(u("uProjection"), false, mat4.perspective(look.fov, size.aspect, 0.5, 400));
    gl.uniform1f(u("uTime"), time);
    gl.uniform1i(u("uIter"), iter);
    if (instanced) {
      gl.uniform1i(u("uInstanced"), 1);
      gl.bindVertexArray(r.inst);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, r.count, count);           // one call for everything
    } else {
      gl.uniform1i(u("uInstanced"), 0);
      gl.bindVertexArray(r.cube);
      const uOff = u("uOffset");
      for (let i = 0; i < count; i++) {                                  // one uniform + one call per object
        gl.uniform4f(uOff, r.offsets[i * 4], r.offsets[i * 4 + 1], r.offsets[i * 4 + 2], r.offsets[i * 4 + 3]);
        gl.drawArrays(gl.TRIANGLES, 0, r.count);
      }
    }
    gl.disable(gl.CULL_FACE);

    if (layers > 0) {                                                    // pure fill: blended fullscreen triangles
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(r.layer);
      gl.bindVertexArray(r.full);
      for (let i = 0; i < layers; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.BLEND);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(r.copy);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, r.target.tex[0]);
    gl.uniform1i(gl.getUniformLocation(r.copy, "uTex"), 0);
    drawFullscreen(gl, r.full);

    if (q && T.ext) { gl.endQuery(T.ext.TIME_ELAPSED_EXT); T.pending.push(q); }
    const cpuMs = performance.now() - c0;
    r.cpu = r.cpu ? r.cpu * 0.9 + cpuMs * 0.1 : cpuMs;
    if (++r.frames % 12 === 0) setStats({ frameMs: r.frameMs, cpu: r.cpu, gpu: T.ext ? r.gpu : -2, res: `${w}×${h}` });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const fps = stats.frameMs ? 1000 / stats.frameMs : 0;

  return (
    <figure ref={ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBottle_title", "Bottleneck Lab — Load One Part at a Time")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.min(-0.15, l.pitch) })} fovRange={[0.4, 1.4]}
          frame={[time, look, count, instanced, iter, scale, layers]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10.5px] text-white/90 bg-black/55 rounded px-2 py-1.5 pointer-events-none leading-relaxed min-w-[210px]">
          <div>frame <b>{stats.frameMs.toFixed(2)} ms</b> ({fps.toFixed(0)} fps)</div>
          <div>{tx(t, "figBottle_cpu", "CPU issuing GL calls")}: <b>{stats.cpu.toFixed(2)} ms</b></div>
          <div>{tx(t, "figBottle_gpu", "GPU (timer query)")}: <b>{stats.gpu >= 0 ? `${stats.gpu.toFixed(2)} ms` : stats.gpu === -2 ? tx(t, "figBottle_noTimer", "not exposed by this browser") : "…"}</b></div>
          <div>{instanced ? 1 : count} draw call{instanced || count === 1 ? "" : "s"} · {stats.res}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">submission</span>
          <button className={btn(!instanced)} onClick={() => setInstanced(false)}>draw per object</button>
          <button className={btn(instanced)} onClick={() => setInstanced(true)}>instanced</button>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["objects", count, setCount, 1, MAX, 1], ["fragment work", iter, setIter, 0, 400, 5], ["resolution ×", scale, setScale, 0.25, 2, 0.05], ["fill layers", layers, setLayers, 0, 60, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figBottle_note", "Experiment like a profiler would. Raise the objects with draw per object until the frame time climbs, then switch to instanced: if it drops back, you were CPU bound on draw calls. Raise fragment work, then lower the resolution: if the frame time falls with the pixel count, you were fragment bound. Fill layers do almost no maths but read and write every pixel, which exposes bandwidth. While the frame stays pinned at 16.7 ms (or your screen's refresh), vsync hides everything, so push until it moves.")}
        </p>
      </div>
    </figure>
  );
}
