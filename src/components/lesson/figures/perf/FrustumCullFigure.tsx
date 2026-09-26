"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A level seen from above: round trees and rotated buildings, and the camera's
// view frustum (near, far, left, right planes). Each object is tested with a
// cheap bounding volume against the planes:
//   sphere: outside if  n·c + d < −r   for any plane
//   AABB:   outside if  n·p⁺ + d < 0  for any plane (p⁺ = corner furthest along n)
// The result is compared with an exact polygon test to show false positives
// (drawn but actually invisible). A loose grid tests whole cells first: cells
// outside skip every object inside them, cells fully inside accept all.

const W = 560, H = 380, WX = 100, WZ = 68, SC = W / WX;
type Obj = { kind: "tree" | "house"; x: number; z: number; r: number; w: number; h: number; a: number };
type V2 = [number, number];

const OBJECTS: Obj[] = (() => {
  let s = 11;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const out: Obj[] = [];
  for (let i = 0; i < 70; i++) { const r = 0.8 + rnd() * 1.3; out.push({ kind: "tree", x: 3 + rnd() * 94, z: 3 + rnd() * 62, r, w: r, h: r, a: 0 }); }
  for (let i = 0; i < 26; i++) {
    const w = 2 + rnd() * 5, h = 2 + rnd() * 4, a = rnd() * Math.PI;
    out.push({ kind: "house", x: 5 + rnd() * 90, z: 5 + rnd() * 58, r: Math.hypot(w, h) / 2, w, h, a });
  }
  return out;
})();

const corners = (o: Obj): V2[] => {
  const c = Math.cos(o.a), s = Math.sin(o.a), hw = o.w / 2, hh = o.h / 2;
  return ([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as V2[]).map(([u, v]) => [o.x + u * c - v * s, o.z + u * s + v * c]);
};
const aabbOf = (o: Obj): [V2, V2] => {
  if (o.kind === "tree") return [[o.x - o.r, o.z - o.r], [o.x + o.r, o.z + o.r]];
  const cs = corners(o);
  return [[Math.min(...cs.map(p => p[0])), Math.min(...cs.map(p => p[1]))], [Math.max(...cs.map(p => p[0])), Math.max(...cs.map(p => p[1]))]];
};

type Plane = { n: V2; d: number };   // inside when n·p + d ≥ 0

function sphereOut(planes: Plane[], c: V2, r: number) { return planes.some(p => p.n[0] * c[0] + p.n[1] * c[1] + p.d < -r); }
/** −1 outside, 0 intersecting, 1 fully inside. */
function aabbClass(planes: Plane[], [lo, hi]: [V2, V2]) {
  let inside = true;
  for (const p of planes) {
    const px: V2 = [p.n[0] >= 0 ? hi[0] : lo[0], p.n[1] >= 0 ? hi[1] : lo[1]];   // p-vertex
    const nx: V2 = [p.n[0] >= 0 ? lo[0] : hi[0], p.n[1] >= 0 ? lo[1] : hi[1]];   // n-vertex
    if (p.n[0] * px[0] + p.n[1] * px[1] + p.d < 0) return -1;
    if (p.n[0] * nx[0] + p.n[1] * nx[1] + p.d < 0) inside = false;
  }
  return inside ? 1 : 0;
}

/** Exact overlap of an object with the (convex) frustum polygon. */
function exact(o: Obj, poly: V2[], planes: Plane[]) {
  if (o.kind === "tree") {
    const inside = planes.every(p => p.n[0] * o.x + p.n[1] * o.z + p.d >= 0);
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ex = b[0] - a[0], ez = b[1] - a[1];
      const k = Math.max(0, Math.min(1, ((o.x - a[0]) * ex + (o.z - a[1]) * ez) / (ex * ex + ez * ez)));
      best = Math.min(best, Math.hypot(o.x - a[0] - ex * k, o.z - a[1] - ez * k));
    }
    return inside || best <= o.r;
  }
  const q = corners(o);
  for (const shape of [poly, q]) for (let i = 0; i < shape.length; i++) {           // separating axis test
    const a = shape[i], b = shape[(i + 1) % shape.length];
    const ax: V2 = [-(b[1] - a[1]), b[0] - a[0]];
    const pr = (pts: V2[]) => pts.map(p => p[0] * ax[0] + p[1] * ax[1]);
    const A = pr(poly), B = pr(q);
    if (Math.max(...A) < Math.min(...B) || Math.max(...B) < Math.min(...A)) return false;
  }
  return true;
}

const GRID_X = 5, GRID_Z = 4;

export function FrustumCullFigure({ t }: { t?: TrackTranslations }) {
  const [cam, setCam] = useState<V2>([22, 50]);
  const [heading, setHeading] = useState(-0.55);
  const [fov, setFov] = useState(70);
  const [far, setFar] = useState(45);
  const [bv, setBv] = useState<"sphere" | "AABB">("sphere");
  const [grid, setGrid] = useState(false);
  const [dragCam, setDragCam] = useState(false);

  const dir: V2 = [Math.cos(heading), Math.sin(heading)];
  const right: V2 = [-dir[1], dir[0]];
  const tn = Math.tan((fov / 2) * Math.PI / 180), near = 1.5;
  const P = (d: number, s: number): V2 => [cam[0] + dir[0] * d + right[0] * s * d * tn, cam[1] + dir[1] * d + right[1] * s * d * tn];
  const poly: V2[] = [P(near, -1), P(far, -1), P(far, 1), P(near, 1)];
  const planeThrough = (a: V2, b: V2, inside: V2): Plane => {
    let n: V2 = [-(b[1] - a[1]), b[0] - a[0]];
    const l = Math.hypot(n[0], n[1]); n = [n[0] / l, n[1] / l];
    let d = -(n[0] * a[0] + n[1] * a[1]);
    if (n[0] * inside[0] + n[1] * inside[1] + d < 0) { n = [-n[0], -n[1]]; d = -d; }
    return { n, d };
  };
  const mid = P((near + far) / 2, 0);
  const planes = [planeThrough(poly[0], poly[1], mid), planeThrough(poly[1], poly[2], mid), planeThrough(poly[2], poly[3], mid), planeThrough(poly[3], poly[0], mid)];

  // Loose grid: each object belongs to the cell of its centre; cell bounds grow by the largest radius
  const maxR = Math.max(...OBJECTS.map(o => o.r));
  const cw = WX / GRID_X, ch = WZ / GRID_Z;
  const cellOf = (o: Obj) => Math.min(GRID_X - 1, Math.floor(o.x / cw)) + GRID_X * Math.min(GRID_Z - 1, Math.floor(o.z / ch));
  const cellClass = Array.from({ length: GRID_X * GRID_Z }, (_, i) => {
    const cx = i % GRID_X, cz = Math.floor(i / GRID_X);
    return aabbClass(planes, [[cx * cw - maxR, cz * ch - maxR], [(cx + 1) * cw + maxR, (cz + 1) * ch + maxR]]);
  });

  let tests = grid ? GRID_X * GRID_Z : 0, drawn = 0, falsePos = 0;
  const status = OBJECTS.map(o => {
    const real = exact(o, poly, planes);
    let pass: boolean;
    const cc = grid ? cellClass[cellOf(o)] : 0;
    if (cc === -1) pass = false;
    else if (cc === 1) pass = true;
    else {
      tests++;
      pass = bv === "sphere" ? !sphereOut(planes, [o.x, o.z], o.r) : aabbClass(planes, aabbOf(o)) >= 0;
    }
    if (pass) { drawn++; if (!real) falsePos++; }
    return { pass, real };
  });

  const toWorld = (e: React.PointerEvent<SVGSVGElement>): V2 => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * WX, ((e.clientY - r.top) / r.height) * WZ];
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!e.buttons) return;
    const p = toWorld(e);
    if (dragCam) setCam([Math.max(1, Math.min(WX - 1, p[0])), Math.max(1, Math.min(WZ - 1, p[1]))]);
    else setHeading(Math.atan2(p[1] - cam[1], p[0] - cam[0]));
  };

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const S = (v: number) => v * SC;
  const colorOf = (s: { pass: boolean; real: boolean }) => s.pass ? (s.real ? "#22c55e" : "#f59e0b") : "var(--code-muted)";

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFrCull_title", "Frustum Culling from Above")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figFrCull_hint", "drag to aim · drag the camera to move it")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none cursor-crosshair" role="img" aria-label="Frustum culling"
          onPointerDown={e => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); const p = toWorld(e); if (Math.hypot(p[0] - cam[0], p[1] - cam[1]) < 3) setDragCam(true); else setHeading(Math.atan2(p[1] - cam[1], p[0] - cam[0])); }}
          onPointerMove={onMove} onPointerUp={() => setDragCam(false)}>
          {grid && cellClass.map((c, i) => (
            <rect key={i} x={S((i % GRID_X) * cw)} y={S(Math.floor(i / GRID_X) * ch)} width={S(cw)} height={S(ch)}
              fill={c === 1 ? "#22c55e" : c === -1 ? "#ef4444" : "transparent"} fillOpacity={0.07} stroke="var(--code-border)" strokeDasharray="3 3" />
          ))}
          <polygon points={poly.map(p => `${S(p[0])},${S(p[1])}`).join(" ")} fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={1.4} />
          {OBJECTS.map((o, i) => {
            const st = status[i], col = colorOf(st);
            const [lo, hi] = aabbOf(o);
            return (
              <g key={i} opacity={st.pass ? 1 : 0.45}>
                {bv === "sphere" && o.kind === "house" && <circle cx={S(o.x)} cy={S(o.z)} r={S(o.r)} fill="none" stroke={col} strokeWidth={0.6} strokeDasharray="2 2" />}
                {bv === "AABB" && <rect x={S(lo[0])} y={S(lo[1])} width={S(hi[0] - lo[0])} height={S(hi[1] - lo[1])} fill="none" stroke={col} strokeWidth={0.6} strokeDasharray="2 2" />}
                {o.kind === "tree"
                  ? <circle cx={S(o.x)} cy={S(o.z)} r={S(o.r)} fill={col} fillOpacity={0.55} stroke={col} />
                  : <polygon points={corners(o).map(p => `${S(p[0])},${S(p[1])}`).join(" ")} fill={col} fillOpacity={0.55} stroke={col} />}
              </g>
            );
          })}
          <circle cx={S(cam[0])} cy={S(cam[1])} r={7} fill="#3b82f6" stroke="white" strokeWidth={1.5} style={{ cursor: "move" }} />
          <Label x={S(cam[0]) + 10} y={S(cam[1]) + 16} size={8} color="#3b82f6" bold>camera</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{tx(t, "figFrCull_bv", "bounds")}</span>
            <button className={btn(bv === "sphere")} onClick={() => setBv("sphere")}>sphere</button>
            <button className={btn(bv === "AABB")} onClick={() => setBv("AABB")}>AABB</button>
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-3">
              <input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figFrCull_grid", "test grid cells first")}
            </label>
          </div>
          {([["fov", fov, setFov, 20, 120, 1, "°"], ["far", far, setFar, 10, 90, 1, ""]] as const).map(([label, v, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}{unit}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {grid
              ? tx(t, "figFrCull_gridNote", "With the grid, whole cells are tested first. Red cells are rejected with one test for everything inside, green cells are fully inside and accepted without testing their objects. Only the cells the frustum edges cross need per-object tests. The cells are loose, grown by the largest object radius, so an object that sticks out of its cell is never lost.")
              : tx(t, "figFrCull_note", "Green: drawn and visible. Grey: culled. Amber: false positives, where the bounding volume touched the frustum but the object itself does not. Spheres are the cheapest test and rotation-proof, but loose around long buildings. Near the frustum corners even a perfect sphere passes the plane tests while lying outside. Both errors are safe: an extra object costs a draw, a missing one is a bug.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[190px]">
          <div>{tx(t, "figFrCull_objects", "objects")}: {OBJECTS.length}</div>
          <div>{tx(t, "figFrCull_tests", "volume tests")}: <span className="text-[var(--primary)]">{tests}</span></div>
          <div><span className="text-[#22c55e]">{tx(t, "figFrCull_drawn", "drawn")}</span>: {drawn}</div>
          <div>{tx(t, "figFrCull_culled", "culled")}: {OBJECTS.length - drawn}</div>
          <div><span className="text-[#f59e0b]">{tx(t, "figFrCull_fp", "false positives")}</span>: {falsePos}</div>
        </div>
      </div>
    </FigureShell>
  );
}
