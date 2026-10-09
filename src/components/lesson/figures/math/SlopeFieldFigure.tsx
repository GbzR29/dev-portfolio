"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, useDrag, useFrame, useVisible, clamp, f2, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A first-order differential equation y′ = F(t, y) gives a slope at every point
// of the plane; the short grey segments draw them (a slope field). The solution
// through the draggable starting point y(0) follows the segments (green,
// computed very accurately). Euler's method (amber) walks the same field in
// straight steps of length h, using the slope at the start of each step; the
// Transport takes those steps one at a time. Dashed lines are equilibria,
// where F = 0. With y′ = −0.8y and h above 2/0.8 = 2.5, Euler overshoots
// further every step and blows up although the true solution decays: the
// numerical stability limit.
// The lab: walk a few steps, halve h and watch the error halve, break the
// stability limit, then start near an unstable equilibrium.

type Key = "decay" | "growth" | "logistic" | "cooling" | "forced";
const EQS: Record<Key, { label: string; F: (t: number, y: number) => number; eq: number[] }> = {
  decay: { label: "y′ = −0.8y", F: (_, y) => -0.8 * y, eq: [0] },
  growth: { label: "y′ = 0.4y", F: (_, y) => 0.4 * y, eq: [0] },
  logistic: { label: "y′ = 0.9y(1 − y/3)", F: (_, y) => 0.9 * y * (1 - y / 3), eq: [0, 3] },
  cooling: { label: "y′ = −0.5(y − 1)", F: (_, y) => -0.5 * (y - 1), eq: [1] },
  forced: { label: "y′ = t − y", F: (t, y) => t - y, eq: [] },
};
const W = 560, H = 300, T1 = 8, RK_H = 0.02;
const pr = plot({ W, H, x0: -0.4, x1: T1 + 0.2, y0: -2.3, y1: 4.3 });
const s3 = (v: number) => (Number.isFinite(v) && Math.abs(v) < 1e5 ? f2(v, 3) : "∞").replace("-", "−");

/** Accurate solution by small Runge–Kutta steps (the figure's reference curve). */
function solve(F: (t: number, y: number) => number, y0: number) {
  const h = RK_H, out: [number, number][] = [[0, y0]];
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
const at = (sol: [number, number][], tt: number) => sol[Math.min(sol.length - 1, Math.round(tt / RK_H))][1];

/** Short segments with the prescribed slope on a grid of points. */
function slopeField(p: Plot, F: (t: number, y: number) => number) {
  let d = "";
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 12; j++) {
    const tt = (T1 * i) / 20, yy = -2 + (6 * j) / 12, m = F(tt, yy);
    const dx = p.sx, dy = -m * p.sy, l = Math.hypot(dx, dy), L = 8;
    const cx = p.X(tt), cy = p.Y(yy);
    d += `M${(cx - (dx / l) * L).toFixed(1)},${(cy - (dy / l) * L).toFixed(1)}L${(cx + (dx / l) * L).toFixed(1)},${(cy + (dy / l) * L).toFixed(1)}`;
  }
  return d;
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The field, the solution and the Euler steps shown so far; owns the drag (it is mounted twice while the lab is open). */
function SlopeStage({ k, y0, h, shown, showEuler, setY0 }: {
  k: Key; y0: number; h: number; shown: number; showEuler: boolean; setY0: (v: number) => void;
}) {
  const eq = EQS[k];
  const drag = useDrag<"y0">(q => { setY0(clamp(pr.inv(q).y, -2, 4)); return "y0"; }, (_, q) => setY0(clamp(pr.inv(q).y, -2, 4)));
  const sol = solve(eq.F, y0), eu = euler(eq.F, y0, h).slice(0, shown + 1);
  const path = (p: [number, number][]) => "M" + p.map(([a, b]) => `${pr.X(a).toFixed(1)},${pr.Y(clamp(b, -50, 50)).toFixed(1)}`).join("L");
  const cur = eu[eu.length - 1];
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair">
      <Grid p={pr} step={1} labels major={1} />
      <path d={slopeField(pr, eq.F)} stroke={C.muted} strokeWidth={1.1} opacity={0.6} strokeLinecap="round" />
      {eq.eq.map(e => <line key={e} x1={pr.X(0)} x2={W} y1={pr.Y(e)} y2={pr.Y(e)} stroke={C.purple} strokeWidth={1.3} strokeDasharray="6 5" />)}
      <path d={path(sol)} fill="none" stroke={C.green} strokeWidth={2.4} />
      {showEuler && <>
        <path d={path(eu)} fill="none" stroke={C.amber} strokeWidth={1.8} />
        {eu.map(([a, b], i) => Math.abs(b) < 50 && <circle key={i} cx={pr.X(a)} cy={pr.Y(b)} r={3} fill={C.amber} />)}
        {/* the slope the next step will follow, from the current point */}
        {shown < euler(eq.F, y0, h).length - 1 && Math.abs(cur[1]) < 50 && (() => {
          const m = eq.F(cur[0], cur[1]), a = cur[0] + h;
          return <line x1={pr.X(cur[0])} y1={pr.Y(cur[1])} x2={pr.X(a)} y2={pr.Y(clamp(cur[1] + h * m, -50, 50))} stroke={C.amber} strokeWidth={1.4} strokeDasharray="3 3" />;
        })()}
      </>}
      <Handle x={pr.X(0)} y={pr.Y(y0)} color={C.green} active={drag.dragging === "y0"} />
      <T x={W - 12} y={pr.Y(0) - 6} color={C.axis} anchor="end">t</T>
    </svg>
  );
}

export function SlopeFieldFigure({ t }: { t?: TrackTranslations }) {
  const [key, setKey] = useState<Key>("decay");
  const [y0, setRawY0] = useState(3);
  const [h, setRawH] = useState(1);
  const [shown, setShown] = useState(99);              // how many Euler steps are drawn
  const [showEuler, setShowEuler] = useState(true);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                               // time since the last automatic step
  const lab = useLab("math-slope");
  const vis = useVisible<HTMLDivElement>();

  const eq = EQS[key];
  const sol = solve(eq.F, y0), eu = euler(eq.F, y0, h);
  const total = eu.length - 1;
  const n = Math.min(shown, total);
  useFrame(playing && (vis.on || lab.open), dt => {
    if (n >= total) { setPlaying(false); return; }
    acc.current += dt;
    if (acc.current > Math.max(0.15, 0.5 * h)) { acc.current = 0; setShown(n + 1); }
  });

  const stop = () => setPlaying(false);
  const setY0 = (v: number) => { stop(); setRawY0(v); setShown(99); };
  const setH = (v: number) => { stop(); setRawH(v); setShown(99); };
  const choose = (k: Key) => { setKey(k); stop(); setShown(99); };
  const sTo = (v: number) => { stop(); setShown(Math.max(0, Math.min(total, v))); };

  const cur = eu[n];
  const ref = at(sol, cur[0]);
  let maxErr = 0;
  for (const [a, b] of eu) maxErr = Math.max(maxErr, Math.abs(b - at(sol, a)));
  const last = eu[total];

  const view = (
    <div>
      <SlopeStage k={key} y0={y0} h={h} shown={n} showEuler={showEuler} setY0={setY0} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (n >= total) setShown(0); acc.current = 0; setShowEuler(true); setPlaying(p => !p); }}
        playLabel={tx(t, "figSlope_walk", "walk the Euler steps")}
        onStep={() => { setShowEuler(true); sTo(n + 1); }}
        onBack={() => sTo(n - 1)}
        onReset={() => sTo(0)}
        readout={`${tx(t, "figSlope_steps", "steps")}: ${n} / ${total}`} />
    </div>
  );
  const head = <Btn active={showEuler} onClick={() => setShowEuler(v => !v)}>{tx(t, "figSlope_euler", "Euler steps")}</Btn>;
  const controls = <>
    <Row>{(Object.keys(EQS) as Key[]).map(k => <Btn key={k} active={key === k} onClick={() => choose(k)}>{EQS[k].label}</Btn>)}</Row>
    <Slider label={tx(t, "figSlope_h", "step h")} value={h} min={0.1} max={3} step={0.05} onChange={setH} />
    <Row>
      <Readout>{`y(0) = ${s3(y0)}`}</Readout>
      <Readout color={C.green}>{`${tx(t, "figSlope_true", "solution")} y(${f2(cur[0], 2)}) = ${s3(ref)}`}</Readout>
      {showEuler && <Readout color={C.amber}>{`Euler = ${s3(cur[1])}`}</Readout>}
      {showEuler && <Readout color={maxErr < 0.05 ? C.green : C.red}>{`${tx(t, "figSlope_maxErr", "largest gap")} = ${s3(maxErr)}`}</Readout>}
    </Row>
  </>;
  const note = <>
    {tx(t, "figSlope_note2", "Every grey segment has the slope the equation prescribes at that point, so a solution is a curve that runs along the segments everywhere. Different starting values give different curves of one family; dashed lines are equilibria, constant solutions. Euler's method follows the slope at the start of each step in a straight line: press ⏭ to take one step (the dashed amber piece shows where the next one will go). Small h tracks the curve, large h drifts away. Try y′ = −0.8y with h above 2.5: each step overshoots zero by more than the last, and the method explodes although the true solution decays.")}{" "}
    <span data-mouse-only>{tx(t, "figSlope_drag", "Click or drag to set the starting value.")}</span>
    <span data-touch-only>{tx(t, "figSlope_dragTouch", "Tap or drag to set the starting value.")}</span>
  </>;

  // ── Lab ──
  const blowUp = key === "decay" && Math.abs(last[1]) > Math.abs(y0) && Math.abs(y0) > 0.05;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSlopeL1_t", "Follow the arrows"),
      body: <>
        <p>{tx(t, "figSlopeL1_b1", "y′ = −0.8y: the grey segments show the slope everywhere. The green curve is the true solution from y(0) = 3.")}</p>
        <p>{tx(t, "figSlopeL1_b2", "Euler's method reads the slope where it stands and walks straight for a time h. Take three steps.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSlopeL1_g", "3 Euler steps (now {n})."), { n }), done: key === "decay" && n >= 3 && showEuler },
      hint: tx(t, "figSlopeL1_h", "Each ⏭ is one step: y ← y + h · (−0.8y) = 0.2y with h = 1."),
      focus: "step",
      setup: () => { choose("decay"); setRawY0(3); setRawH(1); setShown(0); setShowEuler(true); },
    },
    {
      title: tx(t, "figSlopeL2_t", "Quick check"),
      body: <p>{tx(t, "figSlopeL2_b", "y′ = y, y(0) = 1, step h = 0.25.")}</p>,
      quiz: {
        q: tx(t, "figSlopeL2_q", "What is y after one Euler step?"),
        options: ["1.25", "1.284", "1.5", "0.25"],
        answer: 0,
        why: tx(t, "figSlopeL2_w", "y₁ = y₀ + h · F = 1 + 0.25 · 1 = 1.25. The true value e^0.25 ≈ 1.284 is a little higher, because the curve bends up while the step uses the slope at its start."),
      },
    },
    {
      title: tx(t, "figSlopeL3_t", "Halve the step"),
      body: <>
        <p>{tx(t, "figSlopeL3_b1", "On the logistic curve with h = 1, Euler's path strays up to 0.21 from the true one.")}</p>
        <p>{tx(t, "figSlopeL3_b2", "Shrink h until the largest gap is below 0.05. Watch how it changes each time h halves.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSlopeL3_g", "Largest gap < 0.05 (now {e})."), { e: s3(maxErr) }), done: key === "logistic" && showEuler && maxErr < 0.05 },
      hint: tx(t, "figSlopeL3_h", "h = 1 → 0.21, 0.5 → 0.10, 0.25 → 0.057: halving h halves the error. h = 0.2 does it."),
      setup: () => { choose("logistic"); setRawY0(0.5); setRawH(1); setShowEuler(true); },
    },
    {
      title: tx(t, "figSlopeL4_t", "Break the method"),
      body: <>
        <p>{tx(t, "figSlopeL4_b1", "For y′ = −0.8y each Euler step multiplies y by 1 − 0.8h. The true solution always decays.")}</p>
        <p>{tx(t, "figSlopeL4_b2", "Make the step so big that Euler's values grow instead.")}</p>
      </>,
      goal: { text: tx(t, "figSlopeL4_g", "Euler ends further from 0 than it started."), done: blowUp },
      hint: tx(t, "figSlopeL4_h", "|1 − 0.8h| > 1 needs h > 2.5."),
      setup: () => { choose("decay"); setRawY0(3); setRawH(1); setShowEuler(true); },
    },
    {
      title: tx(t, "figSlopeL5_t", "Quick check"),
      body: <p>{tx(t, "figSlopeL5_b", "Euler on y′ = −20y multiplies y by 1 − 20h each step.")}</p>,
      quiz: {
        q: tx(t, "figSlopeL5_q", "Below which step size h does it stay stable?"),
        options: ["0.1", "0.05", "0.5", "2"],
        answer: 0,
        why: tx(t, "figSlopeL5_w", "|1 − 20h| < 1 means 0 < h < 2/20 = 0.1. Below 0.05 the values also keep their sign, but stability only needs h < 0.1."),
      },
    },
    {
      title: tx(t, "figSlopeL6_t", "Leaving an equilibrium"),
      body: <>
        <p>{tx(t, "figSlopeL6_b1", "The logistic equation has two equilibria, y = 0 and y = 3 (dashed). One repels, one attracts.")}</p>
        <p>{tx(t, "figSlopeL6_b2", "Drag the start to just above 0, below 0.5, and see where the solution goes.")}</p>
      </>,
      goal: { text: tx(t, "figSlopeL6_g", "Logistic, 0 < y(0) < 0.5."), done: key === "logistic" && y0 > 0.02 && y0 < 0.5 },
      setup: () => { choose("logistic"); setRawY0(2); setRawH(0.25); setShowEuler(false); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "blow", tone: "warn", when: blowUp,
      title: tx(t, "figSlopeI1_t", "Numerically unstable"),
      body: fill(tx(t, "figSlopeI1_b", "Each step multiplies y by 1 − 0.8h = {r}, which is below −1: the values flip sign and grow, although the true solution decays to 0. The step must stay below 2/0.8 = 2.5."), { r: s3(1 - 0.8 * h) }),
    },
    {
      id: "flip", tone: "info", when: key === "decay" && h > 1.25 && h <= 2.5,
      title: tx(t, "figSlopeI2_t", "Zig-zag, but stable"),
      body: fill(tx(t, "figSlopeI2_b", "The ratio 1 − 0.8h = {r} is negative, so Euler's values flip sign every step; its size is below 1, so they still shrink toward 0."), { r: s3(1 - 0.8 * h) }),
    },
    {
      id: "close", tone: "ok", when: showEuler && maxErr < 0.05 && !blowUp,
      title: tx(t, "figSlopeI3_t", "Tracking the curve"),
      body: fill(tx(t, "figSlopeI3_b", "With h = {h} Euler never strays more than {e} from the true solution. Its error is proportional to h: halve the step, halve the gap."), { h: s3(h), e: s3(maxErr) }),
    },
    {
      id: "away", tone: "info", when: key === "logistic" && y0 > 0.02 && y0 < 0.5,
      title: tx(t, "figSlopeI4_t", "Unstable 0, stable 3"),
      body: tx(t, "figSlopeI4_b", "Just above 0 the slope is positive, so the solution moves away from 0 (F′(0) = 0.9 > 0, unstable) and levels off at the carrying capacity 3 (F′(3) = −0.9 < 0, stable)."),
    },
  ];

  const title = tx(t, "figSlope_title", "Slope field and Euler's method");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{head}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{head}</Row>{controls}</>}
        recap={[
          tx(t, "figSlopeR1", "A slope field draws y′ = F(t, y); every solution runs along its segments."),
          tx(t, "figSlopeR2", "Euler's method steps along the slope at the start of each step: yₙ₊₁ = yₙ + h F. Halving h halves its error."),
          tx(t, "figSlopeR3", "For decay y′ = −ky, Euler is stable only when h < 2/k."),
          tx(t, "figSlopeR4", "Equilibria where F = 0 attract or repel, depending on the sign of F′."),
        ]}
      />
    </>
  );
}
