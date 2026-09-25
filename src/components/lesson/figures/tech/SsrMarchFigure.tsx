"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// Screen-space reflections in a side view. The camera (left) sees the scene
// through a fan of pixel rays; the depth buffer is the first thing each pixel
// ray hits (the bright outline). For one floor pixel, the reflected ray is
// marched in steps. At each step the point is projected back onto the screen
// and compared with the depth buffer there: in front → keep going; behind but
// within the thickness → hit (take that pixel's colour); behind by more → the
// ray passed behind an object, ignore. The true reflection (dashed) comes from
// tracing the actual scene, which SSR cannot see.

const W = 580, H = 280, S = 26, GY = 236;                   // world units → px, ground line
const CAM = { x: 0.6, y: 5.2 }, FOV0 = -62, FOV1 = -4, NPIX = 72;
type Rect = { x0: number; x1: number; y0: number; y1: number; col: string };
const SCENE: Rect[] = [
  { x0: 8.2, x1: 10.2, y0: 0, y1: 3.2, col: "#f59e0b" },
  { x0: 13, x1: 14.2, y0: 0, y1: 5.5, col: "#3b82f6" },
  { x0: 16.5, x1: 20.5, y0: 0, y1: 2.2, col: "#22c55e" },
];
const FLOOR_COL = "#94a3b8", SKY = "#1e293b";
const X = (x: number) => 14 + x * S, Y = (y: number) => GY - y * S;

/** Nearest intersection of a 2D ray with the scene (floor y = 0 and the boxes). */
function trace(o: { x: number; y: number }, d: { x: number; y: number }) {
  let best = Infinity, col = SKY;
  if (d.y < 0) { const tt = -o.y / d.y; if (tt > 1e-4) { best = tt; col = FLOOR_COL; } }
  for (const r of SCENE) {
    const tx0 = (r.x0 - o.x) / d.x, tx1 = (r.x1 - o.x) / d.x, ty0 = (r.y0 - o.y) / d.y, ty1 = (r.y1 - o.y) / d.y;
    const tin = Math.max(Math.min(tx0, tx1), Math.min(ty0, ty1)), tout = Math.min(Math.max(tx0, tx1), Math.max(ty0, ty1));
    if (tin <= tout && tin > 1e-4 && tin < best) { best = tin; col = r.col; }
  }
  return { t: best, col };
}
const angleOf = (p: { x: number; y: number }) => (Math.atan2(p.y - CAM.y, p.x - CAM.x) * 180) / Math.PI;
const pixelRay = (i: number) => { const a = ((FOV0 + ((i + 0.5) / NPIX) * (FOV1 - FOV0)) * Math.PI) / 180; return { x: Math.cos(a), y: Math.sin(a) }; };

type St = { p: { x: number; y: number }; state: "front" | "hit" | "behind" | "off" };

/** Builds the depth buffer, reflects the chosen floor pixel's view ray and marches it. */
function ssrMarch(px: number, step: number, maxSteps: number, thick: number, refine: boolean) {
  // The depth buffer: distance along every pixel ray to the first surface
  const depth = Array.from({ length: NPIX }, (_, i) => trace(CAM, pixelRay(i)));
  const dir = pixelRay(px);
  const hitFloor = depth[px];
  const P = { x: CAM.x + dir.x * hitFloor.t, y: CAM.y + dir.y * hitFloor.t };
  const R = { x: dir.x, y: -dir.y };                   // reflect about the floor normal (0, 1)
  const truth = trace({ x: P.x, y: P.y + 1e-3 }, R);

  // March
  const steps: St[] = [];
  let found: { col: string; p: { x: number; y: number } } | null = null;
  let tPrev = 0;
  for (let k = 1; k <= maxSteps; k++) {
    const tt = k * step, p = { x: P.x + R.x * tt, y: P.y + R.y * tt };
    const a = angleOf(p), pi = Math.floor(((a - FOV0) / (FOV1 - FOV0)) * NPIX);
    if (pi < 0 || pi >= NPIX) { steps.push({ p, state: "off" }); break; }        // left the screen: nothing to read
    const sampleDist = Math.hypot(p.x - CAM.x, p.y - CAM.y), stored = depth[pi].t;
    if (sampleDist > stored && sampleDist < stored + thick) {
      let hitP = p;
      if (refine) {                                                                // binary search between the last two steps
        let lo = tPrev, hi = tt;
        for (let b = 0; b < 6; b++) {
          const mid = (lo + hi) / 2, q = { x: P.x + R.x * mid, y: P.y + R.y * mid };
          const qi = Math.min(NPIX - 1, Math.max(0, Math.floor(((angleOf(q) - FOV0) / (FOV1 - FOV0)) * NPIX)));
          if (Math.hypot(q.x - CAM.x, q.y - CAM.y) > depth[qi].t) hi = mid; else lo = mid;
        }
        hitP = { x: P.x + R.x * hi, y: P.y + R.y * hi };
      }
      steps.push({ p: hitP, state: "hit" });
      found = { col: depth[pi].col, p: hitP };
      break;
    }
    steps.push({ p, state: sampleDist > stored ? "behind" : "front" });
    tPrev = tt;
  }
  return { depth, P, R, truth, steps, found };
}

export function SsrMarchFigure({ t }: { t?: TrackTranslations }) {
  const [px, setPx] = useState(30);                     // which floor pixel reflects
  const [step, setStep] = useState(0.6);
  const [maxSteps, setMaxSteps] = useState(24);
  const [thick, setThick] = useState(0.8);
  const [refine, setRefine] = useState(true);

  const { depth, P, R, truth, steps, found } = ssrMarch(px, step, maxSteps, thick, refine);
  const outline = depth.map((d, i) => { const r = pixelRay(i); return `${X(CAM.x + r.x * Math.min(d.t, 40))},${Y(CAM.y + r.y * Math.min(d.t, 40))}`; });
  const correct = found ? found.col === truth.col : truth.col === SKY;
  const stateCol = { front: "#22c55e", hit: "#ef4444", behind: "#64748b", off: "#a855f7" };

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSsrMarch_title", "Screen-Space Reflections — Marching the Depth Buffer")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="SSR march">
          <line x1={0} y1={Y(0)} x2={W} y2={Y(0)} stroke={FLOOR_COL} strokeWidth={2} />
          {SCENE.map((r, i) => <rect key={i} x={X(r.x0)} y={Y(r.y1)} width={(r.x1 - r.x0) * S} height={(r.y1 - r.y0) * S} fill={r.col} opacity={0.75} />)}
          {Array.from({ length: NPIX }, (_, i) => i % 4 === 0 && (
            <line key={i} x1={X(CAM.x)} y1={Y(CAM.y)} x2={X(CAM.x + pixelRay(i).x * Math.min(depth[i].t, 40))} y2={Y(CAM.y + pixelRay(i).y * Math.min(depth[i].t, 40))} stroke="var(--code-muted)" strokeWidth={0.4} opacity={0.35} />
          ))}
          <polyline points={outline.join(" ")} fill="none" stroke="white" strokeWidth={1.3} opacity={0.8} />
          <line x1={X(CAM.x)} y1={Y(CAM.y)} x2={X(P.x)} y2={Y(P.y)} stroke="#38bdf8" strokeWidth={1.4} />
          {Number.isFinite(truth.t) && <line x1={X(P.x)} y1={Y(P.y)} x2={X(P.x + R.x * truth.t)} y2={Y(P.y + R.y * truth.t)} stroke="white" strokeDasharray="4 3" opacity={0.6} />}
          <line x1={X(P.x)} y1={Y(P.y)} x2={X(P.x + R.x * maxSteps * step)} y2={Y(P.y + R.y * maxSteps * step)} stroke="#38bdf8" strokeWidth={0.6} opacity={0.5} />
          {steps.map((s, i) => <circle key={i} cx={X(s.p.x)} cy={Y(s.p.y)} r={s.state === "hit" ? 5 : 3} fill={stateCol[s.state]} />)}
          <circle cx={X(CAM.x)} cy={Y(CAM.y)} r={7} fill="#3b82f6" />
          <Label x={X(CAM.x) + 10} y={Y(CAM.y) - 6} size={8} color="#3b82f6" bold>camera</Label>
          <circle cx={X(P.x)} cy={Y(P.y)} r={4} fill="#38bdf8" />
          <Label x={X(P.x) - 6} y={Y(P.y) + 16} size={8} anchor="middle">reflective pixel</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["floor pixel", px, setPx, 8, NPIX - 20, 1], ["step size", step, setStep, 0.1, 2, 0.05], ["max steps", maxSteps, setMaxSteps, 2, 64, 1], ["thickness", thick, setThick, 0.05, 4, 0.05]] as const).map(([label, v, set, min, max, stp]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={stp} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={refine} onChange={e => setRefine(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSsrMarch_refine", "binary-search refinement on hit")}
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figSsrMarch_note", "Green steps are still in front of the depth buffer; grey ones went behind something by more than the thickness, so they are treated as passing behind it; red is the hit. Move the floor pixel so the true reflection (dashed) should show the back of the tall blue box or something above the screen. SSR only has what the camera saw, so it finds the wrong colour, or nothing (purple: the ray left the screen). Big steps skip thin objects, and a small thickness lets rays slip through them.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[190px] space-y-1.5">
          <div className="flex items-center gap-2"><span className="w-5 h-5 rounded" style={{ background: found?.col ?? SKY }} />SSR ({steps.length} {tx(t, "figSsrMarch_steps", "steps")})</div>
          <div className="flex items-center gap-2"><span className="w-5 h-5 rounded" style={{ background: truth.col }} />{tx(t, "figSsrMarch_truth", "true reflection")}</div>
          <div className={correct ? "text-[#22c55e]" : "text-red-400"}>{correct ? tx(t, "figSsrMarch_ok", "match") : tx(t, "figSsrMarch_bad", "wrong / missing")}</div>
        </div>
      </div>
    </figure>
  );
}
