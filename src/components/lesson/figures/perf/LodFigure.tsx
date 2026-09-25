"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { mat4, compileProgram, forwardFrom, norm, type Vec3 } from "../../kit/gl/gl";
import { GLView, useAnimationTime, type Look } from "../../kit/gl/GLView";
import { useVisible } from "../../kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A field of rocks, each available at four levels of detail (icospheres with
// 1280, 320, 80 and 20 triangles, displaced by the same noise so they describe
// the same shape). Every frame each rock's projected radius in pixels picks
// its level:  r_px = r / d · H / (2 tan(fov/2)).
//   hysteresis — switch down only below threshold·(1 − h), up only above
//                threshold·(1 + h), so a rock sitting on a boundary stops flickering
//   cross-fade — inside a band around each threshold both levels are drawn
//                with complementary dither masks (screen-door transparency),
//                so the switch dissolves instead of popping
// All rocks of one level are drawn with one instanced call.

const VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec4 iPosScale;
layout(location = 2) in vec2 iFade;          // x: coverage 0..1, y: which half of the dither (0/1)
layout(location = 3) in float iLod;
uniform mat4 uView, uProjection;
out vec3 vWorld; out float vLod; out vec2 vFade;
void main() {
  vec3 p = aPos * iPosScale.w + iPosScale.xyz;
  vWorld = p; vLod = iLod; vFade = iFade;
  gl_Position = uProjection * uView * vec4(p, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec3 vWorld; in float vLod; in vec2 vFade;
uniform float uTint;
out vec4 FragColor;
float bayer4(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  int i = q.x + q.y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[i]) + 0.5) / 16.0;
}
void main() {
  float b = bayer4(gl_FragCoord.xy);
  if (vFade.y < 0.5 ? b > vFade.x : b <= vFade.x) discard;         // complementary screen-door masks
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));           // flat shading shows the facets
  vec3 L = normalize(vec3(0.5, 0.8, 0.3));
  vec3 lodCol[4] = vec3[4](vec3(0.2, 0.8, 0.35), vec3(0.25, 0.55, 1.0), vec3(1.0, 0.75, 0.2), vec3(1.0, 0.3, 0.3));
  vec3 albedo = mix(vec3(0.62, 0.6, 0.57), lodCol[int(vLod + 0.5)], uTint);
  vec3 c = albedo * (0.25 + 0.75 * max(dot(N, L), 0.0));
  FragColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
}`;
const GROUND_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
uniform mat4 uView, uProjection;
out vec3 vWorld;
void main() { vWorld = aPos; gl_Position = uProjection * uView * vec4(aPos, 1.0); }`;
const GROUND_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
out vec4 FragColor;
void main() {
  vec2 g = abs(fract(vWorld.xz / 4.0) - 0.5);
  float line = step(0.48, max(g.x, g.y));
  FragColor = vec4(pow(vec3(0.2, 0.24, 0.2) * (1.0 - 0.25 * line), vec3(1.0 / 2.2)), 1.0);
}`;

/** Deterministic lumpy noise on the unit sphere — the same for every LOD. */
const lump = (d: Vec3) => 1 + 0.18 * Math.sin(3.1 * d[0] + 1.3) * Math.sin(2.7 * d[1] + 0.4) * Math.sin(3.3 * d[2] + 2.1) + 0.08 * Math.sin(7 * d[0] + 5 * d[2]);

function rock(sub: number): Float32Array {
  const tt = (1 + Math.sqrt(5)) / 2;
  let v: Vec3[] = [[-1, tt, 0], [1, tt, 0], [-1, -tt, 0], [1, -tt, 0], [0, -1, tt], [0, 1, tt], [0, -1, -tt], [0, 1, -tt], [tt, 0, -1], [tt, 0, 1], [-tt, 0, -1], [-tt, 0, 1]].map(p => norm(p as Vec3));
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < sub; s++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!cache.has(k)) { const p = v[a], q = v[b]; v = [...v, norm([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2])]; cache.set(k, v.length - 1); }
      return cache.get(k)!;
    };
    f = f.flatMap(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]; });
  }
  const out: number[] = [];
  for (const tri of f) for (const i of tri) { const d = v[i], k = lump(d); out.push(d[0] * k, d[1] * k * 0.8, d[2] * k); }
  return new Float32Array(out);
}

const LODS = [3, 2, 1, 0];                 // subdivision levels → 1280, 320, 80, 20 triangles
const TRIS = LODS.map(s => 20 * 4 ** s);
const THRESH = [48, 20, 8];                // px radius above which LOD 0, 1, 2 are used

type Rock = { p: Vec3; s: number; lod: number };
type Res = {
  rock: WebGLProgram; ground: WebGLProgram; meshes: { vbo: WebGLBuffer; count: number }[];
  vaos: WebGLVertexArrayObject[]; inst: WebGLBuffer[]; groundVao: WebGLVertexArrayObject; rocks: Rock[];
};

export function LodFigure({ t }: { t?: TrackTranslations }) {
  const [look, setLook] = useState<Look>({ yaw: 0.2, pitch: -0.28, fov: 0.9 });
  const [tint, setTint] = useState(true);
  const [bias, setBias] = useState(1);
  const [hyst, setHyst] = useState(0.15);
  const [fade, setFade] = useState(false);
  const [forceLod, setForceLod] = useState(-1);
  const [dolly, setDolly] = useState(false);
  const [stats, setStats] = useState({ tris: 0, all: 0, counts: [0, 0, 0, 0], switches: 0 });
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(dolly && vis.on);

  const init = (gl: WebGL2RenderingContext): Res => {
    const meshes = LODS.map(s => { const d = rock(s); const vbo = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return { vbo, count: d.length / 3 }; });
    const inst: WebGLBuffer[] = [], vaos: WebGLVertexArrayObject[] = [];
    // One VAO per LOD mesh × {main, fade-partner}: 8 in total
    for (let k = 0; k < 8; k++) {
      const vao = gl.createVertexArray()!, ib = gl.createBuffer()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, meshes[k % 4].vbo);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 0); gl.vertexAttribDivisor(1, 1);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 28, 16); gl.vertexAttribDivisor(2, 1);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 28, 24); gl.vertexAttribDivisor(3, 1);
      vaos.push(vao); inst.push(ib);
    }
    const groundVao = gl.createVertexArray()!;
    gl.bindVertexArray(groundVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-200, 0, -200, 200, 0, -200, 200, 0, 200, -200, 0, -200, 200, 0, 200, -200, 0, 200]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    let s = 3;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const rocks: Rock[] = Array.from({ length: 700 }, () => {
      const sc = 0.4 + rnd() * rnd() * 2.2;
      return { p: [(rnd() - 0.5) * 120, sc * 0.5, (rnd() - 0.5) * 120] as Vec3, s: sc, lod: 3 };
    });
    return { rock: compileProgram(gl, VS, FS), ground: compileProgram(gl, GROUND_VS, GROUND_FS), meshes, vaos, inst, groundVao, rocks };
  };

  const draw = (gl: WebGL2RenderingContext, r: Res, size: { w: number; h: number; aspect: number }) => {
    const f = forwardFrom(look.yaw, look.pitch);
    const dist = dolly ? 30 + 22 * Math.sin(time * 0.35) : 30;
    const target: Vec3 = [0, 0, 0];
    const cam: Vec3 = [-f[0] * dist, Math.max(1, -f[1] * dist), -f[2] * dist];
    const V = mat4.lookAt(cam, target, [0, 1, 0]);
    const P = mat4.perspective(look.fov, size.aspect, 0.1, 400);
    const pxPerUnit = size.h / (2 * Math.tan(look.fov / 2));

    // ── Select a level for every rock ──
    const groups: number[][] = [[], [], [], [], [], [], [], []];     // 0..3 main, 4..7 fade partners
    const counts = [0, 0, 0, 0];
    let tris = 0, switches = 0;
    const band = 0.18;
    for (const rk of r.rocks) {
      const d = Math.hypot(rk.p[0] - cam[0], rk.p[1] - cam[1], rk.p[2] - cam[2]);
      const px = (rk.s / d) * pxPerUnit * bias;
      let lod: number;
      if (forceLod >= 0) lod = forceLod;
      else {
        const ideal = px > THRESH[0] ? 0 : px > THRESH[1] ? 1 : px > THRESH[2] ? 2 : 3;
        lod = rk.lod;
        // Hysteresis: leave the current level only once past the threshold by a margin
        if (ideal < lod && px > THRESH[lod - 1] * (1 + hyst)) lod = ideal;
        else if (ideal > lod && px < THRESH[lod] * (1 - hyst)) lod = ideal;
      }
      if (lod !== rk.lod) switches++;
      rk.lod = lod;
      counts[lod]++;
      // Cross-fade band: near the threshold above/below the current level, blend with the neighbour
      let cov = 1, partner = -1;
      if (fade && forceLod < 0) {
        if (lod < 3) { const th = THRESH[lod], k = (px - th * (1 - band)) / (th * 2 * band); if (k < 1) { cov = Math.max(0, k); partner = lod + 1; } }
        if (partner < 0 && lod > 0) { const th = THRESH[lod - 1], k = (th * (1 + band) - px) / (th * 2 * band); if (k < 1) { cov = Math.max(0, k); partner = lod - 1; } }
      }
      groups[lod].push(rk.p[0], rk.p[1], rk.p[2], rk.s, cov, 0, lod);
      tris += TRIS[lod];
      if (partner >= 0 && cov < 1) { groups[4 + partner].push(rk.p[0], rk.p[1], rk.p[2], rk.s, cov, 1, partner); tris += TRIS[partner]; }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, size.w, size.h);
    gl.clearColor(0.55, 0.66, 0.8, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(r.ground);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.ground, "uView"), false, V);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.ground, "uProjection"), false, P);
    gl.bindVertexArray(r.groundVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.useProgram(r.rock);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.rock, "uView"), false, V);
    gl.uniformMatrix4fv(gl.getUniformLocation(r.rock, "uProjection"), false, P);
    gl.uniform1f(gl.getUniformLocation(r.rock, "uTint"), tint ? 0.75 : 0);
    groups.forEach((g, k) => {
      if (!g.length) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, r.inst[k]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g), gl.STREAM_DRAW);
      gl.bindVertexArray(r.vaos[k]);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, r.meshes[k % 4].count, g.length / 7);   // one call per level
    });

    const all = r.rocks.length * TRIS[0];
    if (tris !== stats.tris || switches !== stats.switches || counts.some((c, i) => c !== stats.counts[i])) setStats({ tris, all, counts, switches });
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const LOD_COLORS = ["#33cc59", "#408cff", "#ffbf33", "#ff4d4d"];

  return (
    <figure ref={vis.ref} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figLod_title", "Level of Detail by Screen Size")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figScene_hint", "drag to orbit · scroll to zoom")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 relative">
        <GLView<Res> orbit init={init} draw={draw} look={look} onLook={l => setLook({ ...l, pitch: Math.max(-1.4, Math.min(-0.05, l.pitch)) })} fovRange={[0.2, 1.4]}
          frame={[look, tint, bias, hyst, fade, forceLod, dolly ? time : 0]} aspect={16 / 9} />
        <div className="absolute top-3 left-3 font-mono text-[10.5px] text-white/90 bg-black/55 rounded px-2 py-1.5 pointer-events-none leading-relaxed">
          {stats.counts.map((c, i) => (
            <div key={i}><span style={{ color: LOD_COLORS[i] }}>■</span> LOD{i} ({TRIS[i]} tris): {c}</div>
          ))}
          <div className="mt-1">{stats.tris.toLocaleString()} {tx(t, "figLod_tris", "triangles")} · {stats.all ? ((stats.tris / stats.all) * 100).toFixed(1) : 0}% {tx(t, "figLod_ofAll", "of all-LOD0")}</div>
          <div>{tx(t, "figLod_switches", "switches this frame")}: {stats.switches}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figLod_force", "force")}</span>
          {[-1, 0, 1, 2, 3].map(l => <button key={l} className={btn(forceLod === l)} onClick={() => setForceLod(l)}>{l < 0 ? "auto" : `LOD${l}`}</button>)}
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["LOD bias", bias, setBias, 0.25, 4, 0.05], ["hysteresis", hyst, setHyst, 0, 0.5, 0.01]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-4 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
          {([["colour by level", tint, setTint], ["dithered cross-fade", fade, setFade], ["dolly the camera", dolly, setDolly]] as const).map(([lbl, v, set]) => (
            <label key={lbl} className="flex items-center gap-1.5"><input type="checkbox" checked={v} onChange={e => set(e.target.checked)} className="accent-[var(--primary)]" />{lbl}</label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figLod_note", "Turn the colours off and compare auto with LOD0: the difference is hard to see, yet auto draws a small fraction of the triangles. Distant rocks are a few pixels tall, and 1280 triangles there would be wasted, or worse: pixel-sized triangles shade inefficiently in 2×2 quads. Dolly the camera with hysteresis at 0 and watch the switch count and the popping; hysteresis cuts the flicker, and the dithered cross-fade dissolves one level into the next.")}
        </p>
      </div>
    </figure>
  );
}
