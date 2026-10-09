"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, useFrame, useVisible, clamp, f2, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// shape    — the curve is green where f′ > 0 (rising) and red where f′ < 0
//            (falling). Circles mark critical points (f′ = 0), labelled by the
//            sign of f″; purple diamonds mark inflection points, where the
//            bending changes direction. x³ has f′(0) = 0 without a peak. The
//            Transport sweeps the point across; ⏭ jumps to the next marked point.
// optimize — a pen against a wall with 20 m of fence for the other three
//            sides. Area A(w) = w(20 − 2w); the best width is where the
//            graph's tangent is flat, A′(w) = 20 − 4w = 0.
// newton   — Newton's method: from a guess, follow the tangent down to the
//            x-axis and use that crossing as the next guess. Drag the start;
//            each ⏭ adds one step. The last function shows a start that
//            cycles forever.
// The lab: a peak, a flat spot that is not one, an inflection, the best
// pen, then Newton converging and Newton cycling.

type Mode = "shape" | "optimize" | "newton";
type Fn = { key: string; label: string; f: (x: number) => number; d: (x: number) => number; d2: (x: number) => number; view: [number, number, number, number] };

const W = 560, H = 290, FENCE = 20;
const SHAPES: Fn[] = [
  { key: "cubic", label: "x³ − 3x", f: x => x ** 3 - 3 * x, d: x => 3 * x * x - 3, d2: x => 6 * x, view: [-2.6, 2.6, -3.5, 3.5] },
  { key: "quartic", label: "x⁴/4 − x³/3 − x²", f: x => x ** 4 / 4 - x ** 3 / 3 - x * x, d: x => x ** 3 - x * x - 2 * x, d2: x => 3 * x * x - 2 * x - 2, view: [-2, 3, -3.5, 2.5] },
  { key: "cube", label: "x³", f: x => x ** 3, d: x => 3 * x * x, d2: x => 6 * x, view: [-1.8, 1.8, -3.5, 3.5] },
];
const NEWTON: Fn[] = [
  { key: "sqrt2", label: "x² − 2", f: x => x * x - 2, d: x => 2 * x, d2: () => 2, view: [-0.5, 3.5, -3, 8] },
  { key: "cos", label: "cos x − x", f: x => Math.cos(x) - x, d: x => -Math.sin(x) - 1, d2: x => -Math.cos(x), view: [-1, 3, -3.5, 1.5] },
  { key: "cycle", label: "x³ − 2x + 2", f: x => x ** 3 - 2 * x + 2, d: x => 3 * x * x - 2, d2: x => 6 * x, view: [-2.5, 2, -3, 5] },
];
const START: Record<string, number> = { sqrt2: 3, cos: 2.5, cycle: 0 };
const n4 = (v: number, d = 4) => (Number.isFinite(v) ? f2(v, d) : "—").replace("-", "−");
const sub = (n: number) => String(n).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);
const shapeOf = (k: string) => SHAPES.find(e => e.key === k)!;
const newtonOf = (k: string) => NEWTON.find(e => e.key === k)!;

/** Where g changes sign on [a, b], refined by bisection. */
function signChanges(g: (x: number) => number, a: number, b: number) {
  const out: number[] = [], N = 400;
  let px = a, pv = g(a);
  for (let i = 1; i <= N; i++) {
    const x = a + ((b - a) * i) / N, v = g(x);
    if (pv === 0) out.push(px);
    else if (pv * v < 0) {
      let lo = px, hi = x;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; }
      out.push((lo + hi) / 2);
    }
    px = x; pv = v;
  }
  return out;
}
/** Critical points (f′ = 0, x³'s flat step included) and inflection points of a shape. */
const criticals = (fn: Fn) => signChanges(fn.d, fn.view[0], fn.view[1]).concat(fn.key === "cube" ? [0] : []);
const inflections = (fn: Fn) => signChanges(fn.d2, fn.view[0], fn.view[1]);
/** The marked points of a shape, left to right, rounded as the readout shows them. */
const marked = (fn: Fn) => [...criticals(fn), ...inflections(fn)].map(x => +x.toFixed(2)).sort((p, q) => p - q)
  .filter((x, i, arr) => i === 0 || x !== arr[i - 1]);
const newtonStep = (fn: Fn, x: number) => { const d = fn.d(x); return Math.abs(d) < 1e-9 ? x : x - fn.f(x) / d; };

/** The curve split into pieces coloured by the sign of f′. */
function signedCurve(p: Plot, fn: Fn) {
  const cuts = [p.x0, ...signChanges(fn.d, p.x0, p.x1), p.x1];
  return cuts.slice(1).map((b, i) => {
    const a = cuts[i], up = fn.d((a + b) / 2) > 0;
    return <path key={i} d={fnPath(p, fn.f, a, b)} fill="none" stroke={up ? C.green : C.red} strokeWidth={2.6} />;
  });
}

// ── The drawings ──────────────────────────────────────────────────────────────

function ShapeDrawing({ pr, fn, a, active, t }: { pr: Plot; fn: Fn; a: number; active: boolean; t?: TrackTranslations }) {
  const d1 = fn.d(a), fa = fn.f(a);
  const kind = (x: number) => {
    const s = fn.d2(x);
    return Math.abs(s) < 1e-6 ? tx(t, "figExt_neither", "flat, not a peak") : s < 0 ? tx(t, "figExt_max", "max") : tx(t, "figExt_min", "min");
  };
  return <>
    <Grid p={pr} step={1} />
    {signedCurve(pr, fn)}
    <line x1={pr.X(a - 0.6)} y1={pr.Y(fa - 0.6 * d1)} x2={pr.X(a + 0.6)} y2={pr.Y(fa + 0.6 * d1)} stroke={C.fg} strokeWidth={1.4} />
    {inflections(fn).map((x, i) => {
      const X = pr.X(x), Y = pr.Y(fn.f(x));
      return <polygon key={`i${i}`} points={`${X},${Y - 6} ${X + 6},${Y} ${X},${Y + 6} ${X - 6},${Y}`} fill={C.purple} />;
    })}
    {criticals(fn).map((x, i) => <g key={`c${i}`}>
      <circle cx={pr.X(x)} cy={pr.Y(fn.f(x))} r={5} fill={C.bg} stroke={C.amber} strokeWidth={2} />
      <T x={pr.X(x)} y={pr.Y(fn.f(x)) + (fn.d2(x) < 0 ? -10 : 18)} color={C.amber} anchor="middle" bold>{kind(x)}</T>
    </g>)}
    <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={active} />
  </>;
}

function PenDrawing({ w, t }: { w: number; t?: TrackTranslations }) {
  const len = FENCE - 2 * w, A = w * len, dA = FENCE - 4 * w;
  const s = 10, ox = 30, oy = 40;                            // pen drawing: 10 px per metre
  const gp = plot({ W: 280, H: 230, x0: -0.6, x1: 10.6, y0: -6, y1: 60 });
  const Ap = (x: number) => x * (FENCE - 2 * x);
  return <>
    <line x1={ox - 10} x2={ox + FENCE * s + 10} y1={oy} y2={oy} stroke={C.fg} strokeWidth={4} />
    <T x={ox} y={oy - 8} color={C.muted}>{tx(t, "figExt_wall", "wall (no fence needed)")}</T>
    <rect x={ox} y={oy} width={len * s} height={w * s} fill={C.green} fillOpacity={0.18} stroke={C.amber} strokeWidth={2.5} />
    <T x={ox + (len * s) / 2} y={oy + w * s + 14} color={C.amber} anchor="middle">{`${n4(len, 1)} m`}</T>
    <T x={ox + len * s + 6} y={oy + (w * s) / 2 + 3} color={C.amber}>{`w = ${n4(w, 1)} m`}</T>
    <T x={ox + (len * s) / 2} y={oy + (w * s) / 2 + 4} color={C.green} anchor="middle" bold>{`${n4(A, 1)} m²`}</T>
    <g transform="translate(265 30)">
      <line x1={gp.X(0)} x2={gp.X(10.5)} y1={gp.Y(0)} y2={gp.Y(0)} stroke={C.axis} strokeWidth={1.2} />
      <line x1={gp.X(0)} x2={gp.X(0)} y1={gp.Y(-5)} y2={gp.Y(59)} stroke={C.axis} strokeWidth={1.2} />
      {[5, 10].map(v => <T key={v} x={gp.X(v)} y={gp.Y(0) + 12} size={8.5} anchor="middle" color={C.axis}>{v}</T>)}
      {[25, 50].map(v => <g key={v}><line x1={gp.X(0)} x2={gp.X(10)} y1={gp.Y(v)} y2={gp.Y(v)} stroke={C.grid} />
        <T x={gp.X(0) - 4} y={gp.Y(v) + 3} size={8.5} anchor="end" color={C.axis}>{v}</T></g>)}
      <path d={fnPath(gp, Ap, 0, 10)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      <line x1={gp.X(w - 1.6)} y1={gp.Y(A - 1.6 * dA)} x2={gp.X(w + 1.6)} y2={gp.Y(A + 1.6 * dA)} stroke={Math.abs(dA) < 0.5 ? C.green : C.purple} strokeWidth={1.8} />
      <circle cx={gp.X(w)} cy={gp.Y(A)} r={4.5} fill={C.amber} />
      <T x={gp.X(10.4)} y={gp.Y(0) - 6} anchor="end" color={C.muted}>w</T>
      <T x={gp.X(0) + 6} y={gp.Y(58)} color={C.sky}>A(w)</T>
    </g>
  </>;
}

function NewtonDrawing({ pr, fn, xs, active }: { pr: Plot; fn: Fn; xs: number[]; active: boolean }) {
  const last = xs[xs.length - 1];
  return <>
    <Grid p={pr} step={1} />
    <path d={fnPath(pr, fn.f)} fill="none" stroke={C.sky} strokeWidth={2.2} />
    {xs.slice(0, -1).map((x, i) => {
      const nx = xs[i + 1], op = 0.35 + (0.65 * (i + 1)) / xs.length;
      return <g key={i} opacity={op}>
        <line x1={pr.X(x)} y1={pr.Y(0)} x2={pr.X(x)} y2={pr.Y(fn.f(x))} stroke={C.muted} strokeDasharray="3 3" />
        <line x1={pr.X(x)} y1={pr.Y(fn.f(x))} x2={pr.X(nx)} y2={pr.Y(0)} stroke={C.amber} strokeWidth={1.8} />
        <circle cx={pr.X(nx)} cy={pr.Y(0)} r={3} fill={C.amber} />
      </g>;
    })}
    <Handle x={pr.X(xs[0])} y={pr.Y(0)} color={C.sky} active={active} />
    <circle cx={pr.X(last)} cy={pr.Y(fn.f(last))} r={4} fill={C.green} />
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function ExtremaStage({ mode, fn, a, w, xs, onDrag, t }: {
  mode: Mode; fn: Fn; a: number; w: number; xs: number[]; onDrag: (x: number) => void; t?: TrackTranslations;
}) {
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const at = (p: { x: number; y: number }) => +clamp(pr.inv(p).x, x0 + 0.05, x1 - 0.05).toFixed(2);
  const drag = useDrag<"a">(p => { onDrag(at(p)); return "a"; }, (_, p) => onDrag(at(p)));
  const active = drag.dragging === "a";
  return (
    <svg ref={drag.ref} {...(mode === "optimize" ? {} : drag.handlers)} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "shape" ? <ShapeDrawing pr={pr} fn={fn} a={a} active={active} t={t} />
        : mode === "optimize" ? <PenDrawing w={w} t={t} /> : <NewtonDrawing pr={pr} fn={fn} xs={xs} active={active} />}
    </svg>
  );
}

export function ExtremaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("shape");
  const [sk, setSk] = useState("quartic");
  const [a, setA] = useState(1);
  const [w, setW] = useState(3);
  const [nk, setNk] = useState("sqrt2");
  const [xs, setXs] = useState<number[]>([3]);
  const [playing, setPlaying] = useState(false);
  const acc = useRef(0);                             // time since the last automatic Newton step
  const lab = useLab("math-extrema");
  const vis = useVisible<HTMLDivElement>();

  const fn = mode === "newton" ? newtonOf(nk) : shapeOf(sk);
  const [lo, hi] = [fn.view[0] + 0.05, fn.view[1] - 0.05];
  const last = xs[xs.length - 1];
  const converged = Math.abs(fn.f(last)) < 1e-12;
  useFrame(playing && (vis.on || lab.open), dt => {
    if (mode === "shape") {
      if (a >= hi) setPlaying(false);
      else setA(Math.min(hi, a + dt * 0.6));
    } else if (mode === "newton") {
      if (converged || xs.length > 12) { setPlaying(false); return; }
      acc.current += dt;
      if (acc.current > 0.8) { acc.current = 0; setXs(s => [...s, newtonStep(fn, s[s.length - 1])]); }
    }
  });

  const stop = () => setPlaying(false);
  const pick = (m: Mode) => { setMode(m); stop(); };
  const chooseShape = (k: string) => { setSk(k); stop(); };
  const chooseNewton = (k: string) => { setNk(k); setXs([START[k]]); stop(); };
  const onDrag = (x: number) => { stop(); if (mode === "newton") setXs([x]); else setA(x); };
  const ar = +a.toFixed(2);
  const pts = mode === "shape" ? marked(fn) : [];
  const jump = (dir: 1 | -1) => {
    stop();
    const next = dir > 0 ? pts.find(x => x > ar + 1e-9) : [...pts].reverse().find(x => x < ar - 1e-9);
    if (next !== undefined) setA(next);
  };

  const view = (
    <div>
      <ExtremaStage mode={mode} fn={fn} a={ar} w={w} xs={xs} onDrag={onDrag} t={t} />
      {mode === "shape" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (a >= hi) setA(lo); setPlaying(p => !p); }}
          playLabel={tx(t, "figExt_sweep", "sweep along the curve")}
          onStep={() => jump(1)}
          onBack={() => jump(-1)}
          onReset={() => { stop(); setA(lo); }}
          readout={`x = ${n4(ar, 2)}`} />
      )}
      {mode === "newton" && (
        <Transport t={t} playing={playing}
          onPlay={() => { acc.current = 0; setPlaying(p => !p); }}
          playLabel={tx(t, "figExt_run", "run Newton's method")}
          onStep={() => { stop(); setXs(s => [...s.slice(-30), newtonStep(fn, s[s.length - 1])]); }}
          onBack={() => { stop(); setXs(s => (s.length > 1 ? s.slice(0, -1) : s)); }}
          onReset={() => { stop(); setXs([xs[0]]); }}
          readout={`${tx(t, "figExt_steps", "steps")}: ${xs.length - 1}`} />
      )}
    </div>
  );

  let controls: React.ReactNode, note: string;
  const d1 = fn.d(ar), d2 = fn.d2(ar);
  const len = FENCE - 2 * w, A = w * len, dA = FENCE - 4 * w;
  if (mode === "shape") {
    controls = <>
      <Row>{SHAPES.map(e => <Btn key={e.key} active={sk === e.key} onClick={() => chooseShape(e.key)}>{e.label}</Btn>)}</Row>
      <Row>
        <Readout color={d1 > 0 ? C.green : d1 < 0 ? C.red : C.amber}>{`f′ = ${n4(d1, 3)}  ${d1 > 0 ? tx(t, "figExt_rising", "rising") : d1 < 0 ? tx(t, "figExt_falling", "falling") : tx(t, "figExt_flat", "flat")}`}</Readout>
        <Readout color={C.purple}>{`f″ = ${n4(d2, 3)}  ${d2 > 0 ? tx(t, "figExt_cup", "bends up ∪") : d2 < 0 ? tx(t, "figExt_cap", "bends down ∩") : tx(t, "figExt_straight", "not bending")}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteS2", "Drag the point along the curve, or press ⏭ to jump to the next marked point. Green pieces rise (f′ > 0), red pieces fall (f′ < 0); between them the tangent is flat (amber circles). The second derivative says which way the curve bends: where f″ < 0 it bends down like ∩ and a flat spot is a peak (max); where f″ > 0 it bends up like ∪ and a flat spot is a valley (min). Purple diamonds mark where the bending switches. Try x³: its tangent is flat at 0, but the curve keeps rising on both sides, so f′ = 0 alone does not guarantee a peak.");
  } else if (mode === "optimize") {
    controls = <>
      <Slider label={tx(t, "figExt_width", "width w")} value={w} min={0.5} max={9.5} step={0.1} onChange={setW} width="w-16" />
      <Row>
        <Readout color={C.green}>{`A = w·(20 − 2w) = ${n4(A, 2)} m²`}</Readout>
        <Readout color={Math.abs(dA) < 0.5 ? C.green : C.purple}>{`A′(w) = 20 − 4w = ${n4(dA, 2)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteO", "The fence covers two widths w and one length 20 − 2w, so the area is A(w) = w(20 − 2w). Too narrow and the pen is a thin strip; too wide and the length collapses. The graph on the right shows A for every w, with its tangent at your w. While A′ > 0 widening helps; once A′ < 0 it hurts; the best pen is where the tangent is flat: 20 − 4w = 0, so w = 5 m, a 10 m length, and 50 m².");
  } else {
    controls = <>
      <Row>{NEWTON.map(e => <Btn key={e.key} active={nk === e.key} onClick={() => chooseNewton(e.key)}>{e.label}</Btn>)}</Row>
      <Row>
        <Readout color={C.muted}>{`x₀ = ${n4(xs[0], 2)}`}</Readout>
        {xs.slice(1).slice(-4).map((x, i, arr) =>
          <Readout key={i} color={C.amber}>{`x${sub(xs.length - arr.length + i)} = ${n4(x, 10)}`}</Readout>)}
        <Readout color={C.green}>{`f(x) = ${n4(fn.f(last), 10)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteN2", "Drag the blue start x₀ along the axis, then press ⏭. Each step replaces the curve by its tangent line at the current guess and jumps to where that line hits zero: x − f(x)/f′(x). Near a root the number of correct digits roughly doubles per step: for x² − 2 from x₀ = 3 you have √2 to ten digits after five steps. Starting where the tangent is flat throws the guess far away, and on x³ − 2x + 2 the start 0 jumps to 1 and back to 0 forever.");
  }
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["shape", tx(t, "figExt_mS", "shape")],
    ["optimize", tx(t, "figExt_mO", "optimize")],
    ["newton", tx(t, "figExt_mN", "Newton's method")],
  ] as const} />;

  // ── Lab ──
  const shape = mode === "shape", opt = mode === "optimize", newton = mode === "newton";
  const flat = shape && Math.abs(d1) < 0.05;
  const cycling = newton && xs.length >= 3 && Math.abs(last - xs[xs.length - 3]) < 1e-9 && !converged;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figExtL1_t", "Find a peak"),
      body: <>
        <p>{tx(t, "figExtL1_b1", "Green: the curve rises (f′ > 0). Red: it falls (f′ < 0). A peak sits where green turns into red.")}</p>
        <p>{tx(t, "figExtL1_b2", "Put the point on the peak of this curve.")}</p>
      </>,
      goal: { text: tx(t, "figExtL1_g", "f′ = 0 and f″ < 0: a local max."), done: shape && sk === "quartic" && flat && d2 < 0 },
      hint: tx(t, "figExtL1_h", "⏭ jumps from one marked point to the next. The peak is at x = 0."),
      focus: "step",
      setup: () => { pick("shape"); setSk("quartic"); setA(-1.95); },
    },
    {
      title: tx(t, "figExtL2_t", "Quick check"),
      body: <p>{tx(t, "figExtL2_b", "At a critical point c, f′(c) = 0 and f″(c) = 3.")}</p>,
      quiz: {
        q: tx(t, "figExtL2_q", "What is at c?"),
        options: [tx(t, "figExtL2_o1", "a local minimum"), tx(t, "figExtL2_o2", "a local maximum"), tx(t, "figExtL2_o3", "an inflection point"), tx(t, "figExtL2_o4", "nothing can be said")],
        answer: 0,
        why: tx(t, "figExtL2_w", "f″ > 0 means the curve bends up like a cup ∪, and a flat spot at the bottom of a cup is a valley."),
      },
    },
    {
      title: tx(t, "figExtL3_t", "Flat, but no peak"),
      body: <>
        <p>{tx(t, "figExtL3_b1", "f′ = 0 is needed for a smooth peak or valley, but it is not enough.")}</p>
        <p>{tx(t, "figExtL3_b2", "Pick x³ and put the point where its tangent is flat.")}</p>
      </>,
      goal: { text: tx(t, "figExtL3_g", "x³ at x = 0."), done: shape && sk === "cube" && Math.abs(ar) < 0.03 },
    },
    {
      title: tx(t, "figExtL4_t", "Where the bending switches"),
      body: <>
        <p>{tx(t, "figExtL4_b1", "f″ says how the curve bends: ∪ where f″ > 0, ∩ where f″ < 0. Purple diamonds mark where it switches.")}</p>
        <p>{tx(t, "figExtL4_b2", "On x³ − 3x, find the inflection point.")}</p>
      </>,
      goal: { text: tx(t, "figExtL4_g", "x³ − 3x with f″ = 0."), done: shape && sk === "cubic" && Math.abs(d2) < 0.1 },
      hint: tx(t, "figExtL4_h", "f″ = 6x, so it is at x = 0, half-way between the max and the min."),
      setup: () => { pick("shape"); setSk("cubic"); setA(-2.5); },
    },
    {
      title: tx(t, "figExtL5_t", "The best pen"),
      body: <>
        <p>{tx(t, "figExtL5_b1", "20 m of fence for three sides of a pen against a wall. The area is A(w) = w(20 − 2w).")}</p>
        <p>{tx(t, "figExtL5_b2", "Choose the width that gives the largest area.")}</p>
      </>,
      goal: { text: fill(tx(t, "figExtL5_g", "A′(w) = 0 (now {d})."), { d: n4(dA, 2) }), done: opt && Math.abs(dA) < 0.05 },
      hint: tx(t, "figExtL5_h", "A′(w) = 20 − 4w is zero at w = 5."),
      setup: () => { pick("optimize"); setW(2); },
    },
    {
      title: tx(t, "figExtL6_t", "Quick check"),
      body: <p>{tx(t, "figExtL6_b", "Cut squares of side x from the corners of a 30 × 30 cm sheet and fold it into a box: V(x) = x(30 − 2x)², and V′ = (30 − 2x)(30 − 6x).")}</p>,
      quiz: {
        q: tx(t, "figExtL6_q", "Which x gives the largest box?"),
        options: ["5 cm", "15 cm", "7.5 cm", "10 cm"],
        answer: 0,
        why: tx(t, "figExtL6_w", "V′ = 0 at x = 15 and x = 5. At x = 15 there is no base left (V = 0); at x = 5, V = 5 · 20² = 2000 cm³, the maximum."),
      },
    },
    {
      title: tx(t, "figExtL7_t", "Newton converges"),
      body: <>
        <p>{tx(t, "figExtL7_b1", "To solve x² − 2 = 0, start at 3 and follow the tangent down to the axis. Repeat from there.")}</p>
        <p>{tx(t, "figExtL7_b2", "Step until f(x) is practically 0.")}</p>
      </>,
      goal: { text: tx(t, "figExtL7_g", "|f(x)| < 10⁻⁸."), done: newton && nk === "sqrt2" && Math.abs(fn.f(last)) < 1e-8 },
      hint: tx(t, "figExtL7_h", "Five steps. Watch how many digits of 1.41421356… are right after each one."),
      focus: "step",
      setup: () => { pick("newton"); chooseNewton("sqrt2"); },
    },
    {
      title: tx(t, "figExtL8_t", "Newton goes round in circles"),
      body: <>
        <p>{tx(t, "figExtL8_b1", "Newton's method needs a good start. Pick x³ − 2x + 2, start at 0, and take a few steps.")}</p>
      </>,
      goal: { text: tx(t, "figExtL8_g", "The guesses repeat."), done: cycling },
      setup: () => { pick("newton"); chooseNewton("sqrt2"); },
    },
    {
      title: tx(t, "figExtL9_t", "Quick check"),
      body: <p>{tx(t, "figExtL9_b", "f(x) = x² − 2, f′(x) = 2x, current guess x = 1.")}</p>,
      quiz: {
        q: tx(t, "figExtL9_q", "What is the next Newton guess?"),
        options: ["1.5", "2", "0.5", "1.414"],
        answer: 0,
        why: tx(t, "figExtL9_w", "x − f(x)/f′(x) = 1 − (1 − 2)/(2 · 1) = 1 + ½ = 1.5. One step is a guess, not the exact root."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "peak", tone: "ok", when: flat && d2 < -0.1,
      title: tx(t, "figExtI1_t", "A peak"),
      body: fill(tx(t, "figExtI1_b", "f′ = 0 and f″ = {d} < 0: the flat spot sits on a cap ∩, so it is a local maximum, f = {f}."), { d: n4(d2, 2), f: n4(fn.f(ar), 3) }),
    },
    {
      id: "valley", tone: "ok", when: flat && d2 > 0.1,
      title: tx(t, "figExtI2_t", "A valley"),
      body: fill(tx(t, "figExtI2_b", "f′ = 0 and f″ = {d} > 0: the flat spot sits in a cup ∪, so it is a local minimum, f = {f}."), { d: n4(d2, 2), f: n4(fn.f(ar), 3) }),
    },
    {
      id: "step", tone: "warn", when: shape && sk === "cube" && Math.abs(ar) < 0.03,
      title: tx(t, "figExtI3_t", "Flat, but still rising"),
      body: tx(t, "figExtI3_b", "f′(0) = 0, yet x³ rises on both sides: f′ does not change sign, so this is neither a max nor a min. And f″(0) = 0, so the second-derivative test says nothing here."),
    },
    {
      id: "infl", tone: "info", when: shape && !flat && Math.abs(d2) < 0.1,
      title: tx(t, "figExtI4_t", "Inflection"),
      body: tx(t, "figExtI4_b", "f″ ≈ 0 and changes sign here: the curve stops bending one way and starts bending the other. The tangent crosses the curve at this point."),
    },
    {
      id: "best", tone: "ok", when: opt && Math.abs(dA) < 0.05,
      title: tx(t, "figExtI5_t", "The best pen"),
      body: tx(t, "figExtI5_b", "w = 5 m, length 10 m, area 50 m². The tangent of A is flat: widening any further would lose more length than it gains width."),
    },
    {
      id: "wide", tone: "warn", when: opt && dA < -4,
      title: tx(t, "figExtI6_t", "Too wide"),
      body: fill(tx(t, "figExtI6_b", "A′(w) = {d} < 0: each extra metre of width costs 2 m of length, and the area shrinks. Make the pen narrower."), { d: n4(dA, 1) }),
    },
    {
      id: "conv", tone: "ok", when: newton && converged && xs.length > 1,
      title: tx(t, "figExtI7_t", "Converged"),
      body: fill(tx(t, "figExtI7_b", "After {n} steps f(x) is zero to twelve decimals: x = {x}. Near the root each step roughly doubled the number of correct digits."), { n: xs.length - 1, x: n4(last, 10) }),
    },
    {
      id: "cycle", tone: "warn", when: cycling,
      title: tx(t, "figExtI8_t", "A cycle"),
      body: tx(t, "figExtI8_b", "From 0 the tangent lands on 1, and from 1 it lands back on 0: Newton's method loops forever and never reaches the root near −1.77. A start closer to the root, such as −2, converges at once."),
    },
  ];

  const title = tx(t, "figExt_title", "What the derivative tells you");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figExtR1", "f′ > 0 rising, f′ < 0 falling; peaks and valleys sit where f′ = 0 and changes sign."),
          tx(t, "figExtR2", "f″ < 0 bends down ∩ (a flat spot is a max), f″ > 0 bends up ∪ (a min); inflection is where it switches."),
          tx(t, "figExtR3", "To optimise, write one function of one variable and solve f′ = 0, then check the ends."),
          tx(t, "figExtR4", "Newton's step x − f/f′ doubles the correct digits near a root, but a bad start can cycle or fly off."),
        ]}
      />
    </>
  );
}
