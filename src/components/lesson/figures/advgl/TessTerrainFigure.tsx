"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { tessQuad, type Spacing } from "./tessellator";

// ── What this figure shows ────────────────────────────────────────────────────
// Terrain tessellation with a camera-dependent level of detail. The ground is
// an 8×8 grid of quad patches. For every patch, a "TCS" picks tessellation
// levels from how big things look on screen; the tessellator (CPU model, same
// as the domain figure) generates the pattern; a "TES" places each vertex on
// the heightfield and computes its normal by finite differences.
//
// Level per edge → neighbours agree on every shared edge → no cracks.
// Level per patch → a shared edge can get two different vertex counts, the
// displaced T-junctions do not line up, and the sky shows through the seams.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aBary;
layout(location = 3) in float aLevel;
uniform mat4 uView, uProjection;
out vec3 vNormal; out vec3 vBary; out float vLevel; out vec3 vWorld;
void main() {
  vNormal = aNormal; vBary = aBary; vLevel = aLevel; vWorld = aPos;
  gl_Position = uProjection * uView * vec4(aPos, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vNormal; in vec3 vBary; in float vLevel; in vec3 vWorld;
uniform float uWire, uHeat, uMaxLevel;
out vec4 FragColor;
vec3 heat(float x) { return clamp(vec3(1.5 - abs(4.0 * x - 3.0), 1.5 - abs(4.0 * x - 2.0), 1.5 - abs(4.0 * x - 1.0)), 0.0, 1.0); }
void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(0.4, 0.8, 0.3));
  float slope = 1.0 - N.y;
  vec3 ground = mix(vec3(0.33, 0.55, 0.25), vec3(0.5, 0.45, 0.38), smoothstep(0.15, 0.4, slope));
  ground = mix(ground, vec3(0.92), smoothstep(1.6, 2.2, vWorld.y));
  vec3 albedo = uHeat > 0.5 ? heat(clamp(log2(vLevel) / log2(uMaxLevel), 0.0, 1.0)) : ground;
  vec3 c = albedo * (0.3 + 0.8 * max(dot(N, L), 0.0));
  if (uWire > 0.5) {
    vec3 d = vBary / fwidth(vBary);
    float e = 1.0 - smoothstep(0.4, 1.3, min(d.x, min(d.y, d.z)));
    c = mix(c, vec3(0.03), e * 0.75);
  }
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;

const GRID = 8, SIZE = 16, PATCH = SIZE / GRID, X0 = -SIZE / 2;

/** The heightfield the "TES" samples (a heightmap texture in a real renderer). */
function height(x: number, z: number) {
  return 0.9 * Math.sin(0.55 * x) * Math.cos(0.45 * z)
    + 0.35 * Math.sin(1.7 * x + 0.3) * Math.sin(1.3 * z)
    + 1.3 * Math.exp(-((x - 2) ** 2 + (z + 1.5) ** 2) / 3)
    + 0.12 * Math.sin(4.1 * x) * Math.sin(3.7 * z);
}

type Res = { prog: WebGLProgram; vao: WebGLVertexArrayObject; vbo: WebGLBuffer; buf: Float32Array; count: number };
const MODES = ["per edge", "per patch"] as const;

export function TessTerrainFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: -0.35, pitch: -0.42, fov: 0.95 });
  const [mode, setMode] = useState<(typeof MODES)[number]>("per edge");
  const [target, setTarget] = useState(12);
  const [maxLevel, setMaxLevel] = useState(24);
  const [hScale, setHScale] = useState(1.2);
  const [spacing, setSpacing] = useState<Spacing>("fractional_even_spacing");
  const [wire, setWire] = useState(true);
  const [heat, setHeat] = useState(false);
  const [cull, setCull] = useState(true);
  const [stats, setStats] = useState({ patches: 0, culled: 0, tris: 0 });

  const init = (gl: WebGL2RenderingContext): Res => {
    const vao = gl.createVertexArray()!, vbo = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const S = 40;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 36);
    return { prog: compileProgram(gl, VS, FS), vao, vbo, buf: new Float32Array(10 * 3 * 20000), count: 0 };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const target3: Vec3 = [0, 0.6, 0];
    const cam: Vec3 = [target3[0] - f[0] * 11, Math.max(0.8, target3[1] - f[1] * 11), target3[2] - f[2] * 11];
    const V = mat4.lookAt(cam, target3, [0, 1, 0]);
    const P = mat4.perspective(look.fov, size.aspect, 0.1, 100);
    const pxPerUnitAt1 = size.h / 2 / Math.tan(look.fov / 2);   // pixels covered by 1 unit at distance 1

    const dist = (p: Vec3) => Math.hypot(p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]);
    // "TCS" metric: the on-screen diameter of a sphere around the edge, divided by the target size.
    // It depends only on the edge's two endpoints, so both patches sharing it compute the same level.
    const levelFor = (a: Vec3, b: Vec3) => {
      const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const px = (len / Math.max(0.1, dist(mid))) * pxPerUnitAt1;
      return Math.min(maxLevel, Math.max(1, px / target));
    };
    const Y = (x: number, z: number) => height(x, z) * hScale;
    const corner = (x: number, z: number): Vec3 => [x, Y(x, z), z];

    // Frustum test on the patch's bounding sphere, in view space (what a TCS would do before setting levels to 0)
    const tanY = Math.tan(look.fov / 2), tanX = tanY * size.aspect;
    const visible = (c: Vec3, rad: number) => {
      const vx = V[0] * c[0] + V[4] * c[1] + V[8] * c[2] + V[12];
      const vy = V[1] * c[0] + V[5] * c[1] + V[9] * c[2] + V[13];
      const vz = -(V[2] * c[0] + V[6] * c[1] + V[10] * c[2] + V[14]);
      if (vz < -rad) return false;
      const sx = rad * Math.hypot(1, tanX), sy = rad * Math.hypot(1, tanY);
      return Math.abs(vx) <= vz * tanX + sx && Math.abs(vy) <= vz * tanY + sy;
    };

    let n = 0, culled = 0, drawn = 0;
    const push = (x: number, z: number, bary: Vec3, level: number) => {
      if (n + 10 > r.buf.length) { const nb = new Float32Array(r.buf.length * 2); nb.set(r.buf); r.buf = nb; }
      const e = 0.05;
      const nx = Y(x - e, z) - Y(x + e, z), nz = Y(x, z - e) - Y(x, z + e), ny = 2 * e;   // central differences
      const l = Math.hypot(nx, ny, nz);
      r.buf.set([x, Y(x, z), z, nx / l, ny / l, nz / l, ...bary, level], n);
      n += 10;
    };
    const bary: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      const x0 = X0 + i * PATCH, z0 = X0 + j * PATCH, x1 = x0 + PATCH, z1 = z0 + PATCH;
      const c00 = corner(x0, z0), c10 = corner(x1, z0), c11 = corner(x1, z1), c01 = corner(x0, z1);
      const center: Vec3 = [(x0 + x1) / 2, Y((x0 + x1) / 2, (z0 + z1) / 2), (z0 + z1) / 2];
      if (cull && !visible(center, PATCH * 0.75 + 1.6 * hScale)) { culled++; continue; }
      let outer: [number, number, number, number], inner: [number, number];
      if (mode === "per edge") {
        // outer[0] u=0 (x0 edge), outer[1] v=0 (z0 edge), outer[2] u=1 (x1 edge), outer[3] v=1 (z1 edge)
        outer = [levelFor(c00, c01), levelFor(c00, c10), levelFor(c10, c11), levelFor(c01, c11)];
        inner = [Math.max(outer[1], outer[3]), Math.max(outer[0], outer[2])];
      } else {
        const l = levelFor([x0, center[1], (z0 + z1) / 2], [x1, center[1], (z0 + z1) / 2]);
        outer = [l, l, l, l]; inner = [l, l];
      }
      const avg = (outer[0] + outer[1] + outer[2] + outer[3]) / 4;
      const { tris } = tessQuad(inner, outer, spacing);
      drawn++;
      for (const tr of tris) tr.forEach((p, k) => push(x0 + p[0] * PATCH, z0 + p[1] * PATCH, bary[k], avg));
    }
    r.count = n / 10;

    gl.bindBuffer(gl.ARRAY_BUFFER, r.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, r.buf.subarray(0, n), gl.STREAM_DRAW);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.62, 0.74, 0.88, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(r.prog);
    const u = (s: string) => gl.getUniformLocation(r.prog, s);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    gl.uniform1f(u("uWire"), wire ? 1 : 0);
    gl.uniform1f(u("uHeat"), heat ? 1 : 0);
    gl.uniform1f(u("uMaxLevel"), Math.max(2, maxLevel));
    gl.bindVertexArray(r.vao);
    gl.drawArrays(gl.TRIANGLES, 0, r.count);

    const s = { patches: drawn, culled, tris: r.count / 3 };
    if (s.patches !== stats.patches || s.culled !== stats.culled || s.tris !== stats.tris) setStats(s);
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figTessTer_title", "Terrain LOD — Tessellation Levels from Screen Size")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.min(-0.08, l.pitch) })} fovRange={[0.35, 1.3]}
          frame={[look, mode, target, maxLevel, hScale, spacing, wire, heat, cull]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none leading-relaxed">
          <div>{stats.patches} {tx(t, "figTessTer_patches", "patches drawn")} · {stats.culled} {tx(t, "figTessTer_culled", "culled")}</div>
          <div>{stats.tris.toLocaleString()} {tx(t, "figTessTer_tris", "triangles")}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figTessTer_levels", "levels")}</span>
          {MODES.map(m => <button key={m} className={btn(mode === m)} onClick={() => setMode(m)}>{m}</button>)}
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-3">spacing</span>
          {(["equal_spacing", "fractional_even_spacing"] as Spacing[]).map(s => <button key={s} className={btn(spacing === s)} onClick={() => setSpacing(s)}>{s.replace("_spacing", "")}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["target px", target, setTarget, 4, 60, 1], ["max level", maxLevel, setMaxLevel, 1, 32, 1], ["height", hScale, setHScale, 0, 2.5, 0.05]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          {([["wireframe", wire, setWire], ["colour by level", heat, setHeat], ["frustum-cull patches (level 0)", cull, setCull]] as const).map(([lbl, v, set]) => (
            <label key={lbl} className="flex items-center gap-1.5"><input type="checkbox" checked={v} onChange={e => set(e.target.checked)} className="accent-[var(--primary)]" />{lbl}</label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {mode === "per patch"
            ? tx(t, "figTessTer_patchNote", "One level per patch, from its centre. Where two neighbours pick different levels their shared edge gets different vertex counts; after displacement the extra vertices on one side do not lie on the other side's straight edge, and thin cracks of sky appear along patch borders (easiest to see with wireframe off and the camera low).")
            : tx(t, "figTessTer_edgeNote", "Each outer level comes only from its own edge (a sphere around the edge, projected to pixels), so both patches that share an edge compute exactly the same level and the seams stay closed. Inner levels take the max of the matching outer levels. Zoom in: triangles stay about the target size on screen, near or far.")}
        </p>
      </div>
    </figure>
  );
}
