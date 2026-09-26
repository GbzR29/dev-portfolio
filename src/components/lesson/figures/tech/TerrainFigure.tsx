"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, type Vec3 } from "../../kit/gl/gl";
import { GLView, type Look } from "../../kit/gl/GLView";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A heightmap terrain split into 8×8 chunks. Every chunk has 4 meshes
// (vertex spacing 1, 2, 4, 8 cells) and picks one by its distance to the
// camera. Where neighbours use different levels their edges do not match and
// cracks open; skirts (strips hanging down from every chunk edge) hide them.
// The surface is textured procedurally by height and slope (splatting).

const SIZE = 256;             // heightmap cells per side (metres)
const CHUNKS = 8, CELLS = SIZE / CHUNKS, LODS = 4;

// Value noise + fBm on the CPU (the heightmap is data, like a texture)
function makeHeights(): Float32Array {
  const N = SIZE + 1, h = new Float32Array(N * N);
  const rnd = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = rnd(xi, yi), b = rnd(xi + 1, yi), c = rnd(xi, yi + 1), d = rnd(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let s = 0, amp = 1, f = 1 / 64;
    for (let o = 0; o < 6; o++) { s += amp * noise(i * f + 13.1 * o, j * f + 7.7 * o); amp *= 0.5; f *= 2; }
    const ridge = 1 - Math.abs(noise(i / 40 + 3.3, j / 40 + 9.1) * 2 - 1);             // sharp ridges
    h[j * N + i] = Math.pow(s / 1.97, 1.6) * 42 + ridge * ridge * 10 - 6;
  }
  return h;
}

type ChunkMesh = { vao: WebGLVertexArrayObject; count: number; skirtFirst: number };
type Res = { prog: WebGLProgram; meshes: ChunkMesh[][]; };      // [chunk][lod]

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
uniform mat4 uView, uProjection;
out vec3 vWorld; out vec3 vNormal;
void main() { vWorld = aPos; vNormal = aNormal; gl_Position = uProjection * uView * vec4(aPos, 1.0); }`;
const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal;
uniform vec3 uCam, uSun;
uniform float uLodTint, uGrid, uStep, uSplat;
uniform vec3 uTint;
out vec4 FragColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
void main() {
  vec3 n = normalize(vNormal);
  float slope = 1.0 - n.y;                          // 0 flat … 1 vertical
  float h = vWorld.y;
  float wobble = (vnoise(vWorld.xz * 0.15) - 0.5) * 4.0;   // breaks up the straight transition lines
  // Splat weights: each material has a rule, then they are normalised
  float sand  = smoothstep(1.5, 0.0, h + wobble * 0.3) * (1.0 - smoothstep(0.2, 0.4, slope));
  float rock  = smoothstep(0.28, 0.45, slope + wobble * 0.02);
  float snow  = smoothstep(26.0, 30.0, h + wobble) * (1.0 - smoothstep(0.35, 0.55, slope));
  float grass = max(1.0 - sand - rock - snow, 0.0);
  vec4 w = vec4(sand, grass, rock, snow);
  w /= max(w.x + w.y + w.z + w.w, 1e-4);
  float detail = 0.85 + 0.3 * vnoise(vWorld.xz * 2.5);
  vec3 alb = w.x * vec3(0.76, 0.7, 0.5) + w.y * mix(vec3(0.2, 0.36, 0.12), vec3(0.32, 0.42, 0.16), vnoise(vWorld.xz * 0.3))
           + w.z * vec3(0.38, 0.35, 0.32) + w.w * vec3(0.92, 0.94, 0.97);
  alb = mix(vec3(0.45), alb, uSplat) * detail;
  vec3 col = alb * (max(dot(n, uSun), 0.0) * vec3(1.0, 0.95, 0.85) + vec3(0.25, 0.3, 0.38) * (0.5 + 0.5 * n.y));
  col = mix(col, col * uTint, uLodTint);
  if (uGrid > 0.5) {                                  // the vertex grid of this chunk's level
    vec2 g = abs(fract(vWorld.xz / uStep + 0.5) - 0.5) * uStep;
    float line = 1.0 - smoothstep(0.0, fwidth(vWorld.x) * 1.2, min(g.x, g.y));
    col = mix(col, vec3(0.05), line * 0.7);
  }
  float fog = 1.0 - exp(-length(uCam - vWorld) / 650.0);
  col = mix(col, vec3(0.62, 0.7, 0.8), fog);
  FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

const LOD_TINT: Vec3[] = [[1.3, 0.7, 0.7], [0.8, 1.25, 0.75], [0.7, 0.85, 1.35], [1.25, 1.15, 0.6]];

export function TerrainFigure({ t }: { t?: TrackTranslations }) {
  const heights = useMemo(makeHeights, []);
  const [look, setLook] = useState<Look>({ yaw: 0.7, pitch: -0.45, fov: 1.0 });
  const [dist, setDist] = useState(115);
  const [lodDist, setLodDist] = useState(30);
  const [skirts, setSkirts] = useState(false);
  const [tint, setTint] = useState(true);
  const [grid, setGrid] = useState(false);
  const [splat, setSplat] = useState(true);
  const [stats, setStats] = useState({ tris: 0, full: 0 });

  const H = (i: number, j: number) => heights[Math.min(SIZE, Math.max(0, j)) * (SIZE + 1) + Math.min(SIZE, Math.max(0, i))];
  // Normal from central differences of the full-resolution heightmap
  const normalAt = (i: number, j: number): Vec3 => {
    const dx = (H(i + 1, j) - H(i - 1, j)) / 2, dz = (H(i, j + 1) - H(i, j - 1)) / 2;
    const l = Math.hypot(dx, 1, dz);
    return [-dx / l, 1 / l, -dz / l];
  };

  const init = (gl: WebGL2RenderingContext): Res => {
    const meshes: ChunkMesh[][] = [];
    for (let cz = 0; cz < CHUNKS; cz++) for (let cx = 0; cx < CHUNKS; cx++) {
      const lods: ChunkMesh[] = [];
      for (let lod = 0; lod < LODS; lod++) {
        const step = 1 << lod, n = CELLS / step;
        const v: number[] = [];
        const vert = (i: number, j: number, drop = 0) => {
          const gi = cx * CELLS + i, gj = cz * CELLS + j, nn = normalAt(gi, gj);
          v.push(gi - SIZE / 2, H(gi, gj) - drop, gj - SIZE / 2, ...nn);
        };
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          const a = [i * step, j * step], b = [(i + 1) * step, j * step], c = [i * step, (j + 1) * step], d = [(i + 1) * step, (j + 1) * step];
          vert(a[0], a[1]); vert(c[0], c[1]); vert(b[0], b[1]);
          vert(b[0], b[1]); vert(c[0], c[1]); vert(d[0], d[1]);
        }
        const skirtFirst = v.length / 6;
        // Skirts: a vertical strip hanging 4 m below each of the four edges
        const edge = (p: (k: number) => [number, number]) => {
          for (let k = 0; k < n; k++) {
            const [i0, j0] = p(k * step), [i1, j1] = p((k + 1) * step);
            vert(i0, j0); vert(i0, j0, 4); vert(i1, j1);
            vert(i1, j1); vert(i0, j0, 4); vert(i1, j1, 4);
          }
        };
        edge(k => [k, 0]); edge(k => [k, CELLS]); edge(k => [0, k]); edge(k => [CELLS, k]);
        const vao = gl.createVertexArray()!;
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
        lods.push({ vao, count: v.length / 6, skirtFirst });
      }
      meshes.push(lods);
    }
    return { prog: compileProgram(gl, VS, FS), meshes };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const cam: Vec3 = [-f[0] * dist, Math.max(H(SIZE / 2, SIZE / 2) + 5, -f[1] * dist + 10), -f[2] * dist];
    const V = mat4.lookAt(cam, [0, 10, 0], [0, 1, 0]);
    const P = mat4.perspective(look.fov, size.aspect, 0.5, 1200);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.62 ** (1 / 2.2), 0.7 ** (1 / 2.2), 0.8 ** (1 / 2.2), 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.useProgram(r.prog);
    const u = (n: string) => gl.getUniformLocation(r.prog, n);
    gl.uniformMatrix4fv(u("uView"), false, V);
    gl.uniformMatrix4fv(u("uProjection"), false, P);
    gl.uniform3fv(u("uCam"), cam);
    const s = [0.5, 0.6, 0.35], sl = Math.hypot(...s);
    gl.uniform3fv(u("uSun"), s.map(x => x / sl));
    gl.uniform1f(u("uLodTint"), tint ? 1 : 0);
    gl.uniform1f(u("uGrid"), grid ? 1 : 0);
    gl.uniform1f(u("uSplat"), splat ? 1 : 0);
    let tris = 0;
    for (let cz = 0; cz < CHUNKS; cz++) for (let cx = 0; cx < CHUNKS; cx++) {
      const centre: Vec3 = [(cx + 0.5) * CELLS - SIZE / 2, H((cx + 0.5) * CELLS, (cz + 0.5) * CELLS), (cz + 0.5) * CELLS - SIZE / 2];
      const d = Math.hypot(centre[0] - cam[0], centre[1] - cam[1], centre[2] - cam[2]);
      // LOD 0 inside lodDist, then one level coarser every time the distance doubles
      const lod = d < lodDist ? 0 : Math.min(LODS - 1, Math.floor(Math.log2(d / lodDist)) + 1);
      const m = r.meshes[cz * CHUNKS + cx][lod];
      gl.uniform3fv(u("uTint"), LOD_TINT[lod]);
      gl.uniform1f(u("uStep"), 1 << lod);
      gl.bindVertexArray(m.vao);
      // Skirts are drawn without culling: seen from either side they must cover the gap
      gl.drawArrays(gl.TRIANGLES, 0, m.skirtFirst);
      tris += m.skirtFirst / 3;
      if (skirts) { gl.disable(gl.CULL_FACE); gl.drawArrays(gl.TRIANGLES, m.skirtFirst, m.count - m.skirtFirst); gl.enable(gl.CULL_FACE); }
    }
    gl.disable(gl.CULL_FACE);
    const full = CHUNKS * CHUNKS * CELLS * CELLS * 2;
    if (tris !== stats.tris) setStats({ tris, full });
  };

  const onLook = (l: Look) => {
    if (l.fov !== look.fov) setDist(d => Math.max(40, Math.min(420, d * (l.fov > look.fov ? 1.08 : 0.93))));
    setLook({ ...l, fov: look.fov, pitch: Math.max(-1.3, Math.min(-0.05, l.pitch)) });
  };
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figTerr_title", "Terrain — Heightmap, Splatting and Chunk LOD")}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figTerr_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={onLook} frame={[look, dist, lodDist, skirts, tint, grid, splat]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10px] text-white/85 bg-black/45 rounded px-2 py-1 pointer-events-none">
          {stats.tris.toLocaleString()} {tx(t, "figTerr_tris", "triangles")} · {tx(t, "figTerr_vs", "full detail would be")} {stats.full.toLocaleString()}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <button className={btn(tint)} onClick={() => setTint(v => !v)}>{tint ? "✓ " : ""}{tx(t, "figTerr_tint", "colour by LOD")}</button>
          <button className={btn(grid)} onClick={() => setGrid(v => !v)}>{grid ? "✓ " : ""}{tx(t, "figTerr_grid", "vertex grid")}</button>
          <button className={btn(skirts)} onClick={() => setSkirts(v => !v)}>{skirts ? "✓ " : ""}{tx(t, "figTerr_skirts", "skirts")}</button>
          <button className={btn(splat)} onClick={() => setSplat(v => !v)}>{splat ? "✓ " : ""}{tx(t, "figTerr_splat", "texture splatting")}</button>
        </div>
        <label className="flex items-center gap-2 max-w-md">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-28">{tx(t, "figTerr_lodDist", "LOD distance")}</span>
          <input type="range" min={10} max={200} step={1} value={lodDist} onChange={e => setLodDist(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{lodDist} m</span>
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figTerr_note", "Red chunks use every heightmap sample, green every 2nd, blue every 4th and yellow every 8th. Each step down quarters the triangles. Zoom in and look along a border between two colours: the fine side has vertices the coarse side does not, so the surfaces disagree between them and slivers of sky show through. Tick skirts to hang a strip under every edge that fills those gaps.")}
        </p>
      </div>
    </FigureShell>
  );
}
