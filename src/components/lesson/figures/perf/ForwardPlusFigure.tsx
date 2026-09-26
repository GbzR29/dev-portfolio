"use client";

import { useState } from "react";
import { useVisible } from "../../kit/figure";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { uploadMesh, cubePNUT, planePNUT, trs, type Mesh } from "../../kit/gl/glx";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Real tiled forward shading ("Forward+") with up to 1024 moving point lights.
// Every frame the CPU projects each light's bounding sphere to the screen and
// appends the light's index to every 16×16-pixel tile it may touch. The lists
// are uploaded as integer textures:
//   uHeader[tile] = (offset, count)   uList[offset + k] = light index
// and each fragment loops only over its own tile's lights. "all lights" loops
// over every light instead; "heat" colours pixels by how many they loop over.
// (A real engine builds the lists in a compute shader, and clusters them in
// depth too; the shading side is identical.)

const TILE = 16, MAXL = 1024, LIST_W = 4096;

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uModel, uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz; vNormal = mat3(uModel) * aNormal;
  gl_Position = uProjection * uView * w;
}`;
const FS = `#version 300 es
precision highp float;
precision highp int;
in vec3 vWorld; in vec3 vNormal;
uniform highp sampler2D uLights;        // 2 texels per light: (position, radius), (colour, 0)
uniform highp usampler2D uHeader;       // per tile: (offset, count)
uniform highp usampler2D uList;         // light indices, LIST_W per row
uniform int uMode, uCount;
uniform vec3 uAlbedo;
out vec4 FragColor;

vec3 lightAt(int i, vec3 P, vec3 N) {
  vec4 a = texelFetch(uLights, ivec2(2 * i, 0), 0), b = texelFetch(uLights, ivec2(2 * i + 1, 0), 0);
  vec3 L = a.xyz - P;
  float d2 = dot(L, L), r = a.w;
  float window = clamp(1.0 - (d2 * d2) / (r * r * r * r), 0.0, 1.0);   // smooth cut-off at the radius
  float att = window * window / (d2 + 1.0);                             // inverse-square falloff
  return b.rgb * att * max(dot(N, L * inversesqrt(d2)), 0.0);
}

vec3 heat(float x) { return clamp(vec3(1.5 - abs(4.0 * x - 3.0), 1.5 - abs(4.0 * x - 2.0), 1.5 - abs(4.0 * x - 1.0)), 0.0, 1.0); }

void main() {
  vec3 N = normalize(vNormal), P = vWorld;
  vec3 col = uAlbedo * 0.03;
  int looped = 0;
  if (uMode == 1) {                                         // every light, every pixel
    for (int i = 0; i < ${MAXL}; i++) { if (i >= uCount) break; col += uAlbedo * lightAt(i, P, N); }
    looped = uCount;
  } else {
    uvec4 h = texelFetch(uHeader, ivec2(gl_FragCoord.xy) / ${TILE}, 0);
    for (uint k = 0u; k < h.y; k++) {
      uint j = h.x + k;
      int idx = int(texelFetch(uList, ivec2(int(j % ${LIST_W}u), int(j / ${LIST_W}u)), 0).r);
      col += uAlbedo * lightAt(idx, P, N);
    }
    looped = int(h.y);
  }
  if (uMode == 2) col = mix(col * 0.3, heat(float(looped) / 48.0), 0.8);
  FragColor = vec4(pow(col / (1.0 + col), vec3(1.0 / 2.2)), 1.0);        // Reinhard + gamma
}`;
const PT_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
uniform mat4 uView, uProjection;
out vec3 vColor;
void main() { vColor = aColor; gl_Position = uProjection * uView * vec4(aPos, 1.0); gl_PointSize = 5.0; }`;
const PT_FS = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 FragColor;
void main() { FragColor = vec4(vColor, 1.0); }`;

type L = { cx: number; cz: number; y: number; orbit: number; speed: number; phase: number; col: Vec3 };
function makeLights(): L[] {
  let s = 11;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: MAXL }, () => {
    const h = rnd() * 6, c = [0, 2, 4].map(k => 0.5 + 0.5 * Math.cos(h + k)) as Vec3;
    return { cx: (rnd() * 2 - 1) * 17, cz: (rnd() * 2 - 1) * 17, y: 0.4 + rnd() * 1.4, orbit: 0.5 + rnd() * 2.5, speed: (rnd() - 0.5) * 1.4, phase: rnd() * 6.28, col: c.map(v => v * 2.2) as Vec3 };
  });
}
type Item = { model: Float32Array; mesh: "cube" | "plane" };
function makeScene(): Item[] {
  const items: Item[] = [{ model: trs([0, 0, 0], [40, 1, 40]), mesh: "plane" }];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const h = 1.2 + ((i * 7 + j * 13 + 49) % 5) * 0.6;
    items.push({ model: trs([i * 5, h / 2, j * 5], [1.2, h, 1.2], (i + j) * 0.4), mesh: "cube" });
  }
  return items;
}

type Res = {
  prog: WebGLProgram; pts: WebGLProgram; cube: Mesh; plane: Mesh; items: Item[]; lights: L[];
  lightTex: WebGLTexture; headerTex: WebGLTexture; listTex: WebGLTexture; ptVao: WebGLVertexArrayObject; ptVbo: WebGLBuffer;
  last: number; frameMs: number; cpuMs: number; frames: number;
};

export function ForwardPlusFigure({ t }: { t?: TrackTranslations }) {
  const { ref, on: inView } = useVisible<HTMLElement>();
  const [look, setLook] = useState<Look>({ yaw: -0.6, pitch: -0.62, fov: 0.95 });
  const [count, setCount] = useState(256);
  const [radius, setRadius] = useState(3.5);
  const [mode, setMode] = useState(0);
  const [points, setPoints] = useState(true);
  const [stats, setStats] = useState({ frameMs: 0, cpuMs: 0, avg: 0, entries: 0 });
  const time = useAnimationTime(inView);

  const init = (gl: WebGL2RenderingContext): Res => {
    const tex = () => { const tt = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tt);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); return tt; };
    const ptVao = gl.createVertexArray()!, ptVbo = gl.createBuffer()!;
    gl.bindVertexArray(ptVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, ptVbo);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    return {
      prog: compileProgram(gl, VS, FS), pts: compileProgram(gl, PT_VS, PT_FS),
      cube: uploadMesh(gl, cubePNUT()), plane: uploadMesh(gl, planePNUT(1)), items: makeScene(), lights: makeLights(),
      lightTex: tex(), headerTex: tex(), listTex: tex(), ptVao, ptVbo, last: performance.now(), frameMs: 0, cpuMs: 0, frames: 0,
    };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const now = performance.now(), dt = now - r.last;
    r.last = now;
    if (dt < 250) r.frameMs = r.frameMs ? r.frameMs * 0.9 + dt * 0.1 : dt;
    const c0 = performance.now();

    const f = forwardFrom(look.yaw, look.pitch);
    const cam: Vec3 = [-f[0] * 30, -f[1] * 30, -f[2] * 30];
    const V = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]), P = mat4.perspective(look.fov, size.aspect, 0.3, 150);

    // ── Light data ──
    const ldata = new Float32Array(MAXL * 8), pts = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const l = r.lights[i], a = l.phase + time * l.speed;
      const p: Vec3 = [l.cx + Math.cos(a) * l.orbit, l.y, l.cz + Math.sin(a) * l.orbit];
      ldata.set([p[0], p[1], p[2], radius, l.col[0], l.col[1], l.col[2], 0], i * 8);
      pts.set([...p, ...l.col.map(v => Math.min(1, v / 2)) as Vec3], i * 6);
    }

    // ── Tile binning on the CPU: projected sphere → tile rectangle ──
    const tilesX = Math.ceil(size.w / TILE), tilesY = Math.ceil(size.h / TILE), nT = tilesX * tilesY;
    const rects: number[][] = [];
    const counts = new Uint32Array(nT);
    for (let i = 0; i < count; i++) {
      const x = ldata[i * 8], y = ldata[i * 8 + 1], z = ldata[i * 8 + 2];
      const vx = V[0] * x + V[4] * y + V[8] * z + V[12], vy = V[1] * x + V[5] * y + V[9] * z + V[13];
      const depth = -(V[2] * x + V[6] * y + V[10] * z + V[14]);
      let x0 = 0, x1 = tilesX - 1, y0 = 0, y1 = tilesY - 1;
      if (depth < -radius) { rects.push([]); continue; }                   // entirely behind the camera
      if (depth > radius + 0.3) {                                         // camera outside the sphere: project it
        const k = radius / Math.sqrt(depth * depth - radius * radius);    // tangent of the sphere's half-angle
        const nx = (vx / depth) * P[0], ny = (vy / depth) * P[5], rx = k * P[0] * 1.15, ry = k * P[5] * 1.15;
        if (nx + rx < -1 || nx - rx > 1 || ny + ry < -1 || ny - ry > 1) { rects.push([]); continue; }   // off screen
        x0 = Math.max(0, Math.floor(((nx - rx) * 0.5 + 0.5) * size.w / TILE)); x1 = Math.min(tilesX - 1, Math.floor(((nx + rx) * 0.5 + 0.5) * size.w / TILE));
        y0 = Math.max(0, Math.floor(((ny - ry) * 0.5 + 0.5) * size.h / TILE)); y1 = Math.min(tilesY - 1, Math.floor(((ny + ry) * 0.5 + 0.5) * size.h / TILE));
      }
      rects.push([x0, x1, y0, y1]);
      for (let ty = y0; ty <= y1; ty++) for (let txi = x0; txi <= x1; txi++) counts[ty * tilesX + txi]++;
    }
    const header = new Uint32Array(nT * 4);
    let total = 0;
    for (let i = 0; i < nT; i++) { header[i * 4] = total; header[i * 4 + 1] = counts[i]; total += counts[i]; }
    const fill = new Uint32Array(nT), rows = Math.max(1, Math.ceil(total / LIST_W)), list = new Uint32Array(rows * LIST_W);
    rects.forEach((rc, i) => {
      if (!rc.length) return;
      for (let ty = rc[2]; ty <= rc[3]; ty++) for (let txi = rc[0]; txi <= rc[1]; txi++) {
        const tIdx = ty * tilesX + txi;
        list[header[tIdx * 4] + fill[tIdx]++] = i;
      }
    });
    gl.bindTexture(gl.TEXTURE_2D, r.lightTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MAXL * 2, 1, 0, gl.RGBA, gl.FLOAT, ldata);
    gl.bindTexture(gl.TEXTURE_2D, r.headerTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, tilesX, tilesY, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, header);
    gl.bindTexture(gl.TEXTURE_2D, r.listTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, LIST_W, rows, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, list);
    const cpu = performance.now() - c0;
    r.cpuMs = r.cpuMs ? r.cpuMs * 0.9 + cpu * 0.1 : cpu;

    // ── Draw ──
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.01, 0.012, 0.02, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    gl.uniform1i(u("uMode"), mode);
    gl.uniform1i(u("uCount"), count);
    [r.lightTex, r.headerTex, r.listTex].forEach((tt, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt); });
    gl.uniform1i(u("uLights"), 0); gl.uniform1i(u("uHeader"), 1); gl.uniform1i(u("uList"), 2);
    for (const it of r.items) {
      gl.uniformMatrix4fv(u("uModel"), false, it.model);
      gl.uniform3fv(u("uAlbedo"), it.mesh === "plane" ? [0.6, 0.6, 0.62] : [0.8, 0.78, 0.75]);
      const m = it.mesh === "plane" ? r.plane : r.cube;
      gl.bindVertexArray(m.vao);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    }
    if (points && mode !== 2) {
      gl.useProgram(r.pts);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.pts, "uView"), false, V);
      gl.uniformMatrix4fv(gl.getUniformLocation(r.pts, "uProjection"), false, P);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.ptVbo);
      gl.bufferData(gl.ARRAY_BUFFER, pts, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(r.ptVao);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    if (++r.frames % 15 === 0) setStats({ frameMs: r.frameMs, cpuMs: r.cpuMs, avg: total / nT, entries: total });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell ref={ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFwdPlus_title", "Forward+ — Hundreds of Lights, Per-Tile Lists")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-1.45, Math.min(-0.1, l.pitch)) })} fovRange={[0.4, 1.4]}
          frame={[time, look, count, radius, mode, points]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10.5px] text-white/90 bg-black/55 rounded px-2 py-1.5 pointer-events-none leading-relaxed">
          <div>frame {stats.frameMs.toFixed(1)} ms · CPU binning {stats.cpuMs.toFixed(2)} ms</div>
          <div>{mode === 1 ? `${count} lights / pixel` : `${stats.avg.toFixed(1)} lights / tile (avg) · ${stats.entries} list entries`}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">shading</span>
          {["per-tile lists", "all lights", "heat (lights / tile)"].map((m, i) => <button key={m} className={btn(mode === i)} onClick={() => setMode(i)}>{m}</button>)}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-3">
            <input type="checkbox" checked={points} onChange={e => setPoints(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figFwdPlus_points", "show light positions")}
          </label>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["lights", count, setCount, 16, MAXL, 16], ["light radius", radius, setRadius, 1, 10, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figFwdPlus_note", "Push the light count to 1024 and switch between per-tile lists and all lights: the image is identical, but the frame time is not. With lists, each pixel pays only for the handful of lights near it, so the cost follows light density, not light count. The heat view shows the lists: bright where many small lights overlap, dark far from any. Larger radii mean every light touches more tiles, and the lists grow fast.")}
        </p>
      </div>
    </FigureShell>
  );
}
