"use client";

import { useId, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, pts } from "../kit/svg";
import { type V3, add, makeProjector, useOrbit, boxFaces, frontFacing, lightAmount } from "../kit/scene3d";
import { TexturedFace, FigureIcon, useProtoTextures, type ProtoName } from "../kit/protoTexture";

// ── What this figure shows ────────────────────────────────────────────────────
// The view frustum from the outside, next to what the camera actually sees.
// Everything is in view space: the eye at the origin looking down -Z, exactly
// what glm::perspective / glm::ortho expect. One point on the movable cube is
// traced through the near plane to its NDC position.

const VW = 560, VH = 320;          // outside view
const SW = 240;                    // camera view width (height follows aspect)
const CW = 240, CH = 118;          // depth chart
const REF_DIST = 6;                // ortho is sized to match perspective at this distance

type Proj = "persp" | "ortho";
type Obj = { id: string; c: V3; h: number; color: string; tex: ProtoName };

const COL_RAY  = "#ef4444";
const COL_NEAR = "rgba(59,130,246,0.18)";
const COL_FRUS = "rgba(59,130,246,0.75)";

type Settings = { proj: Proj; fov: number; near: number; far: number; aspect: number };

/** View-space point → NDC, for either projection. */
function toNDC(s: Settings, p: V3): V3 {
  const th = Math.tan((s.fov * Math.PI) / 360);
  const { near: n, far: f } = s;
  if (s.proj === "persp") {
    const w = -p[2];
    return [p[0] / (w * th * s.aspect), p[1] / (w * th), (f + n) / (f - n) - (2 * f * n) / ((f - n) * w)];
  }
  const h = th * REF_DIST;
  return [p[0] / (h * s.aspect), p[1] / h, (2 * (-p[2] - n)) / (f - n) - 1];
}

/** Half-size of the frustum cross-section at distance d. */
function halfAt(s: Settings, d: number): [number, number] {
  const th = Math.tan((s.fov * Math.PI) / 360);
  const h = s.proj === "persp" ? th * d : th * REF_DIST;
  return [h * s.aspect, h];
}

function cubeCorners(o: Obj): V3[] {
  const r: V3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1])
    r.push([o.c[0] + x * o.h, o.c[1] + y * o.h, o.c[2] + z * o.h]);
  return r;
}

type Status = "inside" | "partial" | "culled";
function classify(s: Settings, o: Obj): Status {
  const ndc = cubeCorners(o).map(p => toNDC(s, p));
  const inside = (v: V3) => v.every(c => Math.abs(c) <= 1);
  if (ndc.every(inside)) return "inside";
  for (let i = 0; i < 3; i++) {
    if (ndc.every(v => v[i] > 1) || ndc.every(v => v[i] < -1)) return "culled";
  }
  return "partial";
}

// ── Figure ────────────────────────────────────────────────────────────────────
export function FrustumFigure({ t }: { t?: TrackTranslations }) {
  const [s, setS] = useState<Settings>({ proj: "persp", fov: 50, near: 1, far: 10, aspect: 1.5 });
  const [bz, setBz] = useState(-6.5);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -1.05, pitch: 0.32, zoom: 1 });
  const textures = useProtoTextures();
  const uid = useId().replace(/:/g, "");

  const objects: Obj[] = [
    { id: "A", c: [-1.1, -0.35, -3.6], h: 0.45, color: "#22c55e", tex: "green" },
    { id: "B", c: [1.0, 0.45, bz], h: 0.6, color: "#a855f7", tex: "purple" },
    { id: "C", c: [3.9, 0.2, -5.2], h: 0.55, color: "#f59e0b", tex: "orange" },
    { id: "D", c: [-0.4, 0.2, -12.5], h: 0.7, color: "#06b6d4", tex: "blue" },
  ];
  const probe: V3 = [objects[1].c[0] - 0.6, objects[1].c[1] + 0.6, objects[1].c[2] + 0.6];

  // Centre the diagram on the middle of the frustum
  const P0 = makeProjector(orbit, VW / 2 + 30, VH / 2 + 6, 22, 30);
  const P = (p: V3) => P0(add(p, [0, 0, s.far / 2]));

  // Frustum corners
  const [nw, nh] = halfAt(s, s.near);
  const [fw, fh] = halfAt(s, s.far);
  const rect = (w: number, h: number, z: number): V3[] => [[-w, -h, z], [w, -h, z], [w, h, z], [-w, h, z]];
  const nearR = rect(nw, nh, -s.near), farR = rect(fw, fh, -s.far);

  // Shaded cubes for the outside view
  const status = Object.fromEntries(objects.map(o => [o.id, classify(s, o)])) as Record<string, Status>;
  // Culled objects keep every face (drawn as a dashed wireframe); the rest lose their back faces
  const faces = objects.flatMap(o => boxFaces(o.c, [o.h, o.h, o.h]).map(fc => {
    const sp = fc.pts.map(P);
    return { o, sp, quad: fc.pts, light: lightAmount(fc.normal), depth: sp.reduce((a, q) => a + q.depth, 0) / 4 };
  })).filter(f => status[f.o.id] === "culled" || frontFacing(f.sp))
    .sort((a, b) => b.depth - a.depth);

  // The probe's ray through the near plane
  const hit: V3 = s.proj === "persp"
    ? [probe[0] * (s.near / -probe[2]), probe[1] * (s.near / -probe[2]), -s.near]
    : [probe[0], probe[1], -s.near];
  const rayFrom: V3 = s.proj === "persp" ? [0, 0, 0] : [probe[0], probe[1], 0.6];
  const probeNDC = toNDC(s, probe);
  const probeStatus = probeNDC.every(c => Math.abs(c) <= 1);

  // ── Camera view (NDC → screen) ────────────────────────────────────────────
  const SH = Math.round(SW / s.aspect);
  const ns = (v: V3) => ({ x: ((v[0] + 1) / 2) * SW, y: ((1 - v[1]) / 2) * SH });
  const camFaces = objects
    .filter(o => status[o.id] !== "culled")
    .flatMap(o => boxFaces(o.c, [o.h, o.h, o.h]).map(fc => {
      const q = fc.pts.map(p => toNDC(s, p));
      return { o, sp: q.map(ns), quad: fc.pts, light: lightAmount(fc.normal), depth: q.reduce((a, v) => a + v[2], 0) / 4 };
    }))
    .filter(f => frontFacing(f.sp))
    .sort((a, b) => b.depth - a.depth);

  // ── Depth chart: z_ndc as a function of distance ──────────────────────────
  const dist = (d: number) => {
    const n = s.near, f = s.far;
    return s.proj === "persp" ? (f + n) / (f - n) - (2 * f * n) / ((f - n) * d) : (2 * (d - n)) / (f - n) - 1;
  };
  const cx = (d: number) => 26 + ((d - s.near) / (s.far - s.near)) * (CW - 36);
  const cy = (z: number) => 8 + ((1 - z) / 2) * (CH - 26);
  const curve = Array.from({ length: 61 }, (_, i) => {
    const d = s.near + ((s.far - s.near) * i) / 60;
    return `${cx(d).toFixed(1)},${cy(dist(d)).toFixed(1)}`;
  }).join(" ");
  const halfway = s.proj === "persp" ? (2 * s.far * s.near) / (s.far + s.near) : (s.near + s.far) / 2;
  const halfPct = Math.round(((halfway - s.near) / (s.far - s.near)) * 100);
  const probeDist = -probe[2];

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(o => ({ ...o, [k]: v }));
  const slider = (label: string, value: number, onChange: (n: number) => void, min: number, max: number, step: number, unit = "") => (
    <label className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[var(--text-muted)] w-16">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{value}{unit}</span>
    </label>
  );
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
      active ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;

  const eye = P([0, 0, 0]);
  const nearMid = P([nw * 1.05, nh * 1.05, -s.near]);
  const farMid  = P([fw, fh * 1.05, -s.far]);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFrus_title", "The View Frustum — Outside and Inside")}
        </span>
        <div className="flex gap-1.5">
          <button className={btn(s.proj === "persp")} onClick={() => set("proj", "persp")}>
            {tx(t, "figFrus_persp", "Perspective")}
          </button>
          <button className={btn(s.proj === "ortho")} onClick={() => set("proj", "ortho")}>
            {tx(t, "figFrus_ortho", "Orthographic")}
          </button>
        </div>
      </div>

      <div>
        {/* ── Outside view ── */}
        <div className="bg-[var(--code-bg)] border-b border-[var(--border)] relative">
          <svg ref={ref} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }} role="img" aria-label="View frustum seen from outside" {...handlers}>

            {/* Frustum: far plane, side edges, near plane */}
            <polygon points={pts(farR.map(P))} fill="rgba(59,130,246,0.05)" stroke={COL_FRUS} strokeWidth="1" />
            {farR.map((c, i) => {
              const from = s.proj === "persp" ? eye : P(nearR[i]);
              const to = P(c);
              return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={COL_FRUS} strokeWidth="1" />;
            })}

            {/* Objects, back to front; culled ones as dashed ghosts */}
            {faces.map((f, i) => {
              const st = status[f.o.id];
              if (st === "culled") {
                return <polygon key={i} points={pts(f.sp)} fill="none" stroke={COL_RAY} strokeWidth="1.1"
                  strokeDasharray="3 2" strokeLinejoin="round" />;
              }
              return (
                <TexturedFace key={i} id={`${uid}-o${i}`} quad={f.quad} project={P} name={f.o.tex} tex={textures?.[f.o.tex]} light={f.light}
                  stroke={st === "partial" ? "#f59e0b" : undefined} />
              );
            })}
            {objects.map(o => {
              const q = P([o.c[0], o.c[1] + o.h + 0.35, o.c[2]]);
              return <text key={o.id} x={q.x} y={q.y} fill={o.color} fontSize="10" fontFamily="monospace"
                fontWeight="bold" textAnchor="middle">{o.id}</text>;
            })}

            {/* Near plane, drawn over the geometry like a sheet of glass */}
            <polygon points={pts(nearR.map(P))} fill={COL_NEAR} stroke={COL_FRUS} strokeWidth="1.4" />

            {/* The probe ray: eye → near plane → point */}
            <line x1={P(rayFrom).x} y1={P(rayFrom).y} x2={P(probe).x} y2={P(probe).y}
              stroke={COL_RAY} strokeWidth="1.3" />
            <circle cx={P(hit).x} cy={P(hit).y} r={3} fill={COL_RAY} />
            <circle cx={P(probe).x} cy={P(probe).y} r={3.2} fill={COL_RAY} stroke="white" strokeWidth="0.8" />

            {/* Eye */}
            <FigureIcon name="eye" x={eye.x} y={eye.y} size={22}>
              <circle cx={eye.x} cy={eye.y} r={3.5} fill="var(--text-main)" />
            </FigureIcon>
            <Label x={eye.x + 6} y={eye.y + 14} color="var(--text-main)">eye (0,0,0)</Label>
            <Arrow a={eye} b={P([0, 0, -1.6])} color="var(--code-muted)" w={1} head={5} />
            <Label x={P([0, 0, -1.6]).x - 4} y={P([0, 0, -1.6]).y - 6} anchor="end">−Z</Label>

            <Label x={nearMid.x + 4} y={nearMid.y - 4} color={COL_FRUS}>{`near = ${s.near}`}</Label>
            <Label x={farMid.x + 4} y={farMid.y - 4} color={COL_FRUS}>{`far = ${s.far}`}</Label>
            <Label x={P(hit).x - 6} y={P(hit).y + 16} anchor="end" color={COL_RAY}>
              {s.proj === "persp" ? "on near plane" : "straight back"}
            </Label>
          </svg>
          <button onClick={reset}
            className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)]">
            {tx(t, "figCam_resetView", "reset view")}
          </button>
        </div>

        {/* ── Inside view + depth ── */}
        <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2 min-w-0">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
              {tx(t, "figFrus_camView", "What the camera sees (NDC)")}
            </p>
            <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-auto rounded border border-[var(--code-border)] bg-[var(--code-bg)]">
              <defs>
                <clipPath id="frus-ndc"><rect x={0} y={0} width={SW} height={SH} /></clipPath>
              </defs>
              <g clipPath="url(#frus-ndc)">
                <line x1={SW / 2} y1={0} x2={SW / 2} y2={SH} stroke="var(--code-line)" />
                <line x1={0} y1={SH / 2} x2={SW} y2={SH / 2} stroke="var(--code-line)" />
                {camFaces.map((f, i) => (
                  <TexturedFace key={i} id={`${uid}-c${i}`} quad={f.quad} project={q => ns(toNDC(s, q))} name={f.o.tex} tex={textures?.[f.o.tex]} light={f.light} />
                ))}
                {objects.filter(o => status[o.id] !== "culled").map(o => {
                  const q = ns(toNDC(s, [o.c[0], o.c[1] + o.h, o.c[2] + o.h]));
                  return <text key={o.id} x={q.x} y={q.y - 3} fill={o.color} fontSize="9" fontFamily="monospace"
                    fontWeight="bold" textAnchor="middle">{o.id}</text>;
                })}
                {probeStatus && (
                  <circle cx={ns(probeNDC).x} cy={ns(probeNDC).y} r={3} fill={COL_RAY} stroke="white" strokeWidth="0.8" />
                )}
              </g>
            </svg>
            <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              <span style={{ color: COL_RAY }}>●</span> NDC = ({probeNDC.map(v => v.toFixed(2)).join(", ")})
              {!probeStatus && <span style={{ color: COL_RAY }}> · {tx(t, "figFrus_clipped", "clipped")}</span>}
            </p>
            <p className="font-mono text-[10px] text-[var(--text-muted)]">
              {objects.map(o => (
                <span key={o.id} className="mr-2">
                  <span style={{ color: o.color }} className="font-bold">{o.id}</span>{" "}
                  {status[o.id] === "inside" ? "✓" : status[o.id] === "partial" ? tx(t, "figFrus_partial", "partly clipped") : tx(t, "figFrus_culled", "culled")}
                </span>
              ))}
            </p>
          </div>

          {/* Depth distribution */}
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
              {tx(t, "figFrus_depth", "Depth: z_ndc against distance")}
            </p>
            <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto">
              <line x1={26} y1={cy(1)} x2={CW - 10} y2={cy(1)} stroke="var(--code-line)" />
              <line x1={26} y1={cy(0)} x2={CW - 10} y2={cy(0)} stroke="var(--code-line)" strokeDasharray="2 3" />
              <line x1={26} y1={cy(-1)} x2={CW - 10} y2={cy(-1)} stroke="var(--code-line)" />
              <text x={22} y={cy(1) + 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">+1</text>
              <text x={22} y={cy(0) + 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">0</text>
              <text x={22} y={cy(-1) + 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">−1</text>
              <text x={26} y={CH - 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace">{`near ${s.near}`}</text>
              <text x={CW - 10} y={CH - 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">{`far ${s.far}`}</text>
              {/* Half the depth range is used up before this distance */}
              <rect x={cx(s.near)} y={cy(1)} width={cx(halfway) - cx(s.near)} height={cy(-1) - cy(1)}
                fill="var(--primary)" opacity={0.08} />
              <line x1={cx(halfway)} y1={cy(1)} x2={cx(halfway)} y2={cy(-1)} stroke="var(--primary)" strokeWidth="0.8" strokeDasharray="2 2" />
              <polyline points={curve} fill="none" stroke="var(--primary)" strokeWidth="1.8" />
              {probeDist >= s.near && probeDist <= s.far && (
                <circle cx={cx(probeDist)} cy={cy(dist(probeDist))} r={3} fill={COL_RAY} stroke="white" strokeWidth="0.8" />
              )}
            </svg>
            <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
              {s.proj === "persp"
                ? tx(t, "figFrus_depthPersp", "Half of all depth values are spent in the first {pct}% of the range (up to {d} units). Push near closer to 0 and watch it shrink — that is where z-fighting comes from.")
                    .replace("{pct}", String(halfPct)).replace("{d}", halfway.toFixed(2))
                : tx(t, "figFrus_depthOrtho", "Orthographic depth is linear: every unit of distance gets the same share of precision.")}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 md:px-5 py-4 border-t border-[var(--border)] grid gap-x-6 gap-y-1.5 md:grid-cols-2">
        {slider("fov", s.fov, v => set("fov", v), 20, 110, 1, "°")}
        {slider("aspect", s.aspect, v => set("aspect", v), 1, 2, 0.05)}
        {slider("near", s.near, v => set("near", Math.min(v, s.far - 1)), 0.1, 3, 0.1)}
        {slider("far", s.far, v => set("far", Math.max(v, s.near + 1)), 4, 16, 0.5)}
        {slider(tx(t, "figFrus_moveB", "B distance"), -bz, v => setBz(-v), 2, 15, 0.1)}
        <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed self-center">
          {s.proj === "persp"
            ? tx(t, "figFrus_notePersp", "Move B away: it shrinks, because x and y are divided by the distance.")
            : tx(t, "figFrus_noteOrtho", "Move B away: it keeps its size — nothing is divided by distance.")}
        </p>
      </div>
    </figure>
  );
}
