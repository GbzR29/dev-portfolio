"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, cross, norm, sub, type Vec3 } from "../gl";
import { GLView, useAnimationTime, type Look } from "../GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// The three textbook geometry-shader effects: explode (move each triangle along
// its face normal), shrink (pull each triangle toward its centroid), normal
// visualisation (emit a line per vertex or per face), plus a single-pass
// wireframe drawn with barycentric coordinates.
//
// WebGL2 has no geometry stage, so the per-triangle values a GS would compute
// (face normal, centroid, barycentric corner) are baked into the vertex buffer
// on the CPU, and the vertex shader does the rest. The maths is identical.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aFaceN;
layout(location = 3) in vec3 aCentroid;
layout(location = 4) in vec3 aBary;
uniform mat4 uView, uProjection;
uniform float uExplode, uShrink;
out vec3 vNormal; out vec3 vBary; out vec3 vWorld;
void main() {
  vec3 p = mix(aPos, aCentroid, uShrink);          // shrink toward the centroid
  p += aFaceN * uExplode;                          // explode along the face normal
  vWorld = p; vNormal = aNormal; vBary = aBary;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vNormal; in vec3 vBary; in vec3 vWorld;
uniform vec3 uCam;
uniform float uWire, uWireOnly, uWidth;
out vec4 FragColor;
void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 L = normalize(vec3(0.5, 0.8, 0.4)), V = normalize(uCam - vWorld), H = normalize(L + V);
  vec3 base = gl_FrontFacing ? vec3(0.3, 0.55, 0.95) : vec3(0.95, 0.45, 0.3);
  vec3 c = base * (0.25 + 0.75 * max(dot(N, L), 0.0)) + pow(max(dot(N, H), 0.0), 48.0) * 0.4;
  // Distance to the nearest edge in pixels: barycentric / its screen-space rate of change
  vec3 d = vBary / fwidth(vBary);
  float edge = 1.0 - smoothstep(uWidth - 0.75, uWidth + 0.75, min(d.x, min(d.y, d.z)));
  if (uWireOnly > 0.5) { if (edge < 0.02) discard; c = vec3(0.95); }
  else if (uWire > 0.5) c = mix(c, vec3(0.06, 0.07, 0.1), edge);
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const LINE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aDir;
layout(location = 2) in vec3 aFaceN;
layout(location = 3) in vec3 aCentroid;
layout(location = 4) in float aEnd;
uniform mat4 uView, uProjection;
uniform float uExplode, uShrink, uLen;
void main() {
  vec3 p = mix(aPos, aCentroid, uShrink) + aFaceN * uExplode + aDir * uLen * aEnd;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const LINE_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 FragColor;
void main() { FragColor = vec4(uColor, 1.0); }`;

type Tri = [Vec3, Vec3, Vec3];
type MeshData = { tris: Tri[]; normals: [Vec3, Vec3, Vec3][] };

function icosphere(sub_: number): MeshData {
  const tt = (1 + Math.sqrt(5)) / 2;
  let v: Vec3[] = [[-1, tt, 0], [1, tt, 0], [-1, -tt, 0], [1, -tt, 0], [0, -1, tt], [0, 1, tt], [0, -1, -tt], [0, 1, -tt], [tt, 0, -1], [tt, 0, 1], [-tt, 0, -1], [-tt, 0, 1]].map(p => norm(p as Vec3));
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < sub_; s++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!cache.has(key)) { const p = v[a], q = v[b]; v = [...v, norm([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2])]; cache.set(key, v.length - 1); }
      return cache.get(key)!;
    };
    f = f.flatMap(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]; });
  }
  const tris = f.map(([a, b, c]) => [v[a], v[b], v[c]].map(p => [p[0] * 0.8, p[1] * 0.8, p[2] * 0.8] as Vec3) as Tri);
  return { tris, normals: f.map(([a, b, c]) => [v[a], v[b], v[c]]) };
}

function torus(R = 0.62, r = 0.26, segs = 30, rings = 14): MeshData {
  const P = (i: number, j: number): Vec3 => {
    const u = (i / segs) * Math.PI * 2, w = (j / rings) * Math.PI * 2;
    return [(R + r * Math.cos(w)) * Math.cos(u), r * Math.sin(w), (R + r * Math.cos(w)) * Math.sin(u)];
  };
  const Nn = (i: number, j: number): Vec3 => {
    const u = (i / segs) * Math.PI * 2, w = (j / rings) * Math.PI * 2;
    return [Math.cos(w) * Math.cos(u), Math.sin(w), Math.cos(w) * Math.sin(u)];
  };
  const tris: Tri[] = [], normals: [Vec3, Vec3, Vec3][] = [];
  for (let i = 0; i < segs; i++) for (let j = 0; j < rings; j++) {
    const q: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
    for (const [a, b, c] of [[0, 2, 1], [0, 3, 2]]) {
      tris.push([P(...q[a]), P(...q[b]), P(...q[c])]);
      normals.push([Nn(...q[a]), Nn(...q[b]), Nn(...q[c])]);
    }
  }
  return { tris, normals };
}

function cube(): MeshData {
  const tris: Tri[] = [], normals: [Vec3, Vec3, Vec3][] = [];
  const faces: [Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [0, 0, -1], [0, 1, 0]], [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const n = 3;                                              // 3×3 quads per face: something to explode
  for (const [N, U, V] of faces) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    const c = (x: number, y: number): Vec3 => {
      const s = (x / n) * 2 - 1, tt = (y / n) * 2 - 1;
      return [(N[0] + U[0] * s + V[0] * tt) * 0.55, (N[1] + U[1] * s + V[1] * tt) * 0.55, (N[2] + U[2] * s + V[2] * tt) * 0.55];
    };
    tris.push([c(a, b), c(a + 1, b), c(a + 1, b + 1)], [c(a, b), c(a + 1, b + 1), c(a, b + 1)]);
    normals.push([N, N, N], [N, N, N]);
  }
  return { tris, normals };
}

/** What the geometry shader would compute per triangle, baked per vertex. */
function build(gl: WebGL2RenderingContext, m: MeshData) {
  const tri: number[] = [], vLines: number[] = [], fLines: number[] = [];
  const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  m.tris.forEach((tr, ti) => {
    const fn = norm(cross(sub(tr[1], tr[0]), sub(tr[2], tr[0])));   // face normal: (b − a) × (c − a)
    const ce: Vec3 = [0, 1, 2].map(k => (tr[0][k] + tr[1][k] + tr[2][k]) / 3) as Vec3;
    tr.forEach((p, k) => {
      tri.push(...p, ...m.normals[ti][k], ...fn, ...ce, ...bary[k]);
      vLines.push(...p, ...m.normals[ti][k], ...fn, ...ce, 0, ...p, ...m.normals[ti][k], ...fn, ...ce, 1);
    });
    fLines.push(...ce, ...fn, ...fn, ...ce, 0, ...ce, ...fn, ...fn, ...ce, 1);
  });
  const vao = (data: number[], sizes: number[]) => {
    const a = gl.createVertexArray()!;
    gl.bindVertexArray(a);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const stride = sizes.reduce((s, x) => s + x, 0) * 4;
    let off = 0;
    sizes.forEach((sz, i) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, sz, gl.FLOAT, false, stride, off); off += sz * 4; });
    return { vao: a, count: data.length / sizes.reduce((s, x) => s + x, 0) };
  };
  return { tri: vao(tri, [3, 3, 3, 3, 3]), vLines: vao(vLines, [3, 3, 3, 3, 1]), fLines: vao(fLines, [3, 3, 3, 3, 1]), triCount: m.tris.length };
}

const SHAPES = ["icosphere", "torus", "cube"] as const;
type Built = ReturnType<typeof build>;
type Res = { prog: WebGLProgram; lines: WebGLProgram; meshes: Built[] };

export function GsEffectsFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.5, pitch: -0.35, fov: 0.9 });
  const [shape, setShape] = useState(0);
  const [explode, setExplode] = useState(0.18);
  const [shrink, setShrink] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [normals, setNormals] = useState<"off" | "vertex" | "face">("face");
  const [len, setLen] = useState(0.15);
  const [wire, setWire] = useState<"off" | "overlay" | "only">("off");
  const [wWidth, setWWidth] = useState(1.2);
  const time = useAnimationTime(animate);
  const ex = animate ? explode * (0.5 - 0.5 * Math.cos(time * 1.6)) : explode;

  const init = (gl: WebGL2RenderingContext): Res => ({
    prog: compileProgram(gl, VS, FS), lines: compileProgram(gl, LINE_VS, LINE_FS),
    meshes: [build(gl, icosphere(2)), build(gl, torus()), build(gl, cube())],
  });

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const cam: Vec3 = [-f[0] * 3.2, -f[1] * 3.2, -f[2] * 3.2];
    const V = mat4.lookAt(cam, [0, 0, 0], [0, 1, 0]);
    const P = mat4.perspective(look.fov, size.aspect, 0.05, 30);
    const m = r.meshes[shape];

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.07, 0.08, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    gl.uniform3fv(u("uCam"), cam);
    gl.uniform1f(u("uExplode"), ex);
    gl.uniform1f(u("uShrink"), shrink);
    gl.uniform1f(u("uWire"), wire === "overlay" ? 1 : 0);
    gl.uniform1f(u("uWireOnly"), wire === "only" ? 1 : 0);
    gl.uniform1f(u("uWidth"), wWidth * Math.min(2, window.devicePixelRatio || 1));
    gl.bindVertexArray(m.tri.vao);
    gl.drawArrays(gl.TRIANGLES, 0, m.tri.count);

    if (normals !== "off") {
      const L = normals === "vertex" ? m.vLines : m.fLines;
      gl.useProgram(r.lines);
      const l = (n: string) => gl.getUniformLocation(r.lines, n);
      gl.uniformMatrix4fv(l("uView"), false, V);
      gl.uniformMatrix4fv(l("uProjection"), false, P);
      gl.uniform1f(l("uExplode"), ex);
      gl.uniform1f(l("uShrink"), shrink);
      gl.uniform1f(l("uLen"), len);
      gl.uniform3fv(l("uColor"), normals === "vertex" ? [0.98, 0.75, 0.15] : [0.35, 0.95, 0.5]);
      gl.bindVertexArray(L.vao);
      gl.drawArrays(gl.LINES, 0, L.count);
    }
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const tris = [320, 840, 108][shape];
  const emitted = tris * 3 + (normals === "vertex" ? tris * 6 : normals === "face" ? tris * 2 : 0);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figGsFx_title", "Explode, Shrink, Normals, Wireframe")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={setLook} fovRange={[0.4, 1.4]}
          frame={[look, shape, ex, shrink, normals, len, wire, wWidth]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/80 bg-black/40 rounded px-2 py-1 pointer-events-none">
          {tris} {tx(t, "figGsFx_triIn", "triangles in")} · {emitted} {tx(t, "figGsFx_vertOut", "vertices emitted")}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">mesh</span>
          {SHAPES.map((s, i) => <button key={s} className={btn(shape === i)} onClick={() => setShape(i)}>{s}</button>)}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">normals</span>
          {(["off", "vertex", "face"] as const).map(n => <button key={n} className={btn(normals === n)} onClick={() => setNormals(n)}>{n}</button>)}
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20 ml-3">wireframe</span>
          {(["off", "overlay", "only"] as const).map(n => <button key={n} className={btn(wire === n)} onClick={() => setWire(n)}>{n}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["explode", explode, setExplode, 0, 0.6, 0.01], ["shrink", shrink, setShrink, 0, 0.9, 0.01], ["normal len", len, setLen, 0.03, 0.4, 0.01], ["wire px", wWidth, setWWidth, 0.5, 3, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
          <input type="checkbox" checked={animate} onChange={e => setAnimate(e.target.checked)} className="accent-[var(--primary)]" />
          {tx(t, "figGsFx_animate", "animate explode (magnitude = max · (1 − cos t)/2)")}
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figGsFx_note", "Explode needs the face normal, so every vertex of a triangle moves the same way. That is information only a stage that sees the whole triangle has. Vertex normals on the torus fan out smoothly; face normals sit at the centroids. Inside faces show orange when explode opens the mesh up. WebGL has no geometry stage, so this figure bakes the per-triangle values into the vertex buffer; the maths is the same.")}
        </p>
      </div>
    </figure>
  );
}
