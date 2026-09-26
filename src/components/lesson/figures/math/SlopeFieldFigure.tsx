"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, useDrag, clamp, f2, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A first-order differential equation y′ = F(t, y) gives a slope at every point
// of the plane; the short grey segments draw them (a slope field). The solution
// through the draggable starting point y(0) follows the segments (green,
// computed very accurately). Euler's method (amber) walks the same field in
// straight steps of length h, using the slope at the start of each step. Dashed
// lines are equilibria, where F = 0. With y′ = −0.8y and h above 2/0.8 = 2.5,
// Euler overshoots further every step and blows up although the true solution
// decays: the numerical stability limit.

type Key = "decay" | "growth" | "logistic" | "cooling" | "forced";
const EQS: Record<Key, { label: string; F: (t: number, y: number) => number; eq: number[] }> = {
  decay: { label: "y′ = −0.8y", F: (_, y) => -0.8 * y, eq: [0] },
  growth: { label: "y′ = 0.4y", F: (_, y) => 0.4 * y, eq: [0] },
  logistic: { label: "y′ = 0.9y(1 − y/3)", F: (_, y) => 0.9 * y * (1 - y / 3), eq: [0, 3] },
  cooling: { label: "y′ = −0.5(y − 1)", F: (_, y) => -0.5 * (y - 1), eq: [1] },
  forced: { label: "y′ = t − y", F: (t, y) => t - y, eq: [] },
};
const W = 560, H = 300, T1 = 8;
const s3 = (v: number) => (Number.isFinite(v) && Math.abs(v) < 1e5 ? f2(v, 3) : "∞").replace("-", "−");

/** Accurate solution by small Runge–Kutta steps (the figure's reference curve). */
function solve(F: (t: number, y: number) => number, y0: number) {
  const h = 0.02, out: [number, number][] = [[0, y0]];
  let y = y0;
  for (let t = 0; t < T1 - 1e-9; t += h) {
    const k1 = F(t, y), k2 = F(t + h / 2, y + (h / 2) * k1), k3 = F(t + h / 2, y + (h / 2) * k2), k4 = F(t + h, y + h * k3);
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    out.push([t + h, y]);
    if (Math.abs(y) > 1e3) break;
  }
  return out;
}
function euler(F: (t: number, y: number) => number, y0: number, h: number) {
  const out: [number, number][] = [[0, y0]];
  let y = y0;
  for (let t = 0; t < T1 - 1e-9 && Math.abs(y) < 1e3; t += h) { y += h * F(t, y); out.push([t + h, y]); }
  return out;
}

/** Short segments with the prescribed slope on a grid of points. */
function slopeField(pr: Plot, F: (t: number, y: number) => number) {
  let d = "";
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 12; j++) {
    const tt = (T1 * i) / 20, yy = -2 + (6 * j) / 12, m = F(tt, yy);
    const dx = pr.sx, dy = -m * pr.sy, l = Math.hypot(dx, dy), L = 8;
    const cx = pr.X(tt), cy = pr.Y(yy);
    d += `M${(cx - (dx / l) * L).toFixed(1)},${(cy - (dy / l) * L).toFixed(1)}L${(cx + (dx / l) * L).toFixed(1)},${(cy + (dy / l) * L).toFixed(1)}`;
  }
  return d;
}

export function SlopeFieldFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("decay");
  const [y0, setY0] = useState(3);
  const [h, setH] = useState(1);
  const [showEuler, setShowEuler] = useState(true);

  const pr = plot({ W, H, x0: -0.4, x1: T1 + 0.2, y0: -2.3, y1: 4.3 });
  const eq = EQS[key];
  const drag = useDrag<"y0">(q => { setY0(clamp(pr.inv(q).y, -2, 4)); return "y0"; }, (_, q) => setY0(clamp(pr.inv(q).y, -2, 4)));

  const field = slopeField(pr, eq.F);
  const sol = solve(eq.F, y0), eu = euler(eq.F, y0, h);
  const path = (p: [number, number][]) => "M" + p.map(([a, b]) => `${pr.X(a).toFixed(1)},${pr.Y(clamp(b, -50, 50)).toFixed(1)}`).join("L");
  const last = eu[eu.length - 1], ref = sol[Math.min(sol.length - 1, Math.round(last[0] / 0.02))];

  return (
    <Figure
      title={tx(t, "figSlope_title", "Slope field and Euler's method")}
      head={<Btn active={showEuler} onClick={() => setShowEuler(v => !v)}>{tx(t, "figSlope_euler", "Euler steps")}</Btn>}
      controls={<>
        <Row>{(Object.keys(EQS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => setKey(k)}>{EQS[k].label}</Btn>)}</Row>
        <Slider label={tx(t, "figSlope_h", "step h")} value={h} min={0.1} max={3} step={0.05} onChange={setH} />
        <Row>
          <Readout>{`y(0) = ${s3(y0)}`}</Readout>
          <Readout color={C.green}>{`${tx(t, "figSlope_true", "solution")} y(${f2(last[0], 2)}) = ${s3(ref[1])}`}</Readout>
          {showEuler && <Readout color={C.amber}>{`Euler = ${s3(last[1])}`}</Readout>}
        </Row>
      </>}
      note={<>
        {tx(t, "figSlope_note", "Every grey segment has the slope the equation prescribes at that point, so a solution is a curve that runs along the segments everywhere. Different starting values give different curves of one family; dashed lines are equilibria, constant solutions. Euler's method follows the slope at the start of each step in a straight line: small h tracks the curve, large h drifts away. Try y′ = −0.8y with h above 2.5: each step overshoots zero by more than the last, and the method explodes although the true solution decays.")}{" "}
        <span data-mouse-only>{tx(t, "figSlope_drag", "Click or drag to set the starting value.")}</span>
        <span data-touch-only>{tx(t, "figSlope_dragTouch", "Tap or drag to set the starting value.")}</span>
      </>}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair">
        <Grid p={pr} step={1} labels major={1} />
        <path d={field} stroke={C.muted} strokeWidth={1.1} opacity={0.6} strokeLinecap="round" />
        {eq.eq.map(e => <line key={e} x1={pr.X(0)} x2={W} y1={pr.Y(e)} y2={pr.Y(e)} stroke={C.purple} strokeWidth={1.3} strokeDasharray="6 5" />)}
        <path d={path(sol)} fill="none" stroke={C.green} strokeWidth={2.4} />
        {showEuler && <>
          <path d={path(eu)} fill="none" stroke={C.amber} strokeWidth={1.8} />
          {eu.map(([a, b], i) => Math.abs(b) < 50 && <circle key={i} cx={pr.X(a)} cy={pr.Y(b)} r={3} fill={C.amber} />)}
        </>}
        <Handle x={pr.X(0)} y={pr.Y(y0)} color={C.green} active={drag.dragging === "y0"} />
        <T x={W - 12} y={pr.Y(0) - 6} color={C.axis} anchor="end">t</T>
      </svg>
    </Figure>
  );
}
