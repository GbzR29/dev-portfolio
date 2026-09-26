"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, Handle, plot, Grid, fnPath, useDrag, clamp, f2, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// shape    — the curve is green where f′ > 0 (rising) and red where f′ < 0
//            (falling). Circles mark critical points (f′ = 0), labelled by the
//            sign of f″; purple diamonds mark inflection points, where the
//            bending changes direction. x³ has f′(0) = 0 without a peak.
// optimize — a pen against a wall with 20 m of fence for the other three
//            sides. Area A(w) = w(20 − 2w); the best width is where the
//            graph's tangent is flat, A′(w) = 20 − 4w = 0.
// newton   — Newton's method: from a guess, follow the tangent down to the
//            x-axis and use that crossing as the next guess. Drag the start;
//            each press adds one step. The last function shows a start that
//            cycles forever.

type Mode = "shape" | "optimize" | "newton";
type Fn = { key: string; label: string; f: (x: number) => number; d: (x: number) => number; d2: (x: number) => number; view: [number, number, number, number] };

const W = 560, H = 290;
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
const n4 = (v: number, d = 4) => (Number.isFinite(v) ? f2(v, d) : "—").replace("-", "−");

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

/** The curve split into pieces coloured by the sign of f′. */
function signedCurve(p: Plot, fn: Fn) {
  const cuts = [p.x0, ...signChanges(fn.d, p.x0, p.x1), p.x1];
  return cuts.slice(1).map((b, i) => {
    const a = cuts[i], up = fn.d((a + b) / 2) > 0;
    return <path key={i} d={fnPath(p, fn.f, a, b)} fill="none" stroke={up ? C.green : C.red} strokeWidth={2.6} />;
  });
}

export function ExtremaFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("shape");
  const [sk, setSk] = useState("quartic");
  const [a, setA] = useState(1);
  const [w, setW] = useState(3);
  const [nk, setNk] = useState("sqrt2");
  const [iters, setIters] = useState<number[]>([3]);

  const fn = mode === "newton" ? NEWTON.find(e => e.key === nk)! : SHAPES.find(e => e.key === sk)!;
  const [x0, x1, y0, y1] = fn.view;
  const pr = plot({ W, H, x0, x1, y0, y1 });
  const drag = useDrag<"a">(
    p => { const x = +clamp(pr.inv(p).x, x0 + 0.05, x1 - 0.05).toFixed(2); if (mode === "newton") setIters([x]); else setA(x); return "a"; },
    (_, p) => { const x = +clamp(pr.inv(p).x, x0 + 0.05, x1 - 0.05).toFixed(2); if (mode === "newton") setIters([x]); else setA(x); });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "shape") {
    const crit = signChanges(fn.d, x0, x1).concat(fn.key === "cube" ? [0] : []);
    const infl = signChanges(fn.d2, x0, x1);
    const d1 = fn.d(a), d2 = fn.d2(a), fa = fn.f(a);
    const kind = (x: number) => {
      const s = fn.d2(x);
      return Math.abs(s) < 1e-6 ? tx(t, "figExt_neither", "flat, not a peak") : s < 0 ? tx(t, "figExt_max", "max") : tx(t, "figExt_min", "min");
    };
    svg = <>
      <Grid p={pr} step={1} />
      {signedCurve(pr, fn)}
      <line x1={pr.X(a - 0.6)} y1={pr.Y(fa - 0.6 * d1)} x2={pr.X(a + 0.6)} y2={pr.Y(fa + 0.6 * d1)} stroke={C.fg} strokeWidth={1.4} />
      {infl.map((x, i) => {
        const X = pr.X(x), Y = pr.Y(fn.f(x));
        return <polygon key={`i${i}`} points={`${X},${Y - 6} ${X + 6},${Y} ${X},${Y + 6} ${X - 6},${Y}`} fill={C.purple} />;
      })}
      {crit.map((x, i) => <g key={`c${i}`}>
        <circle cx={pr.X(x)} cy={pr.Y(fn.f(x))} r={5} fill={C.bg} stroke={C.amber} strokeWidth={2} />
        <T x={pr.X(x)} y={pr.Y(fn.f(x)) + (fn.d2(x) < 0 ? -10 : 18)} color={C.amber} anchor="middle" bold>{kind(x)}</T>
      </g>)}
      <Handle x={pr.X(a)} y={pr.Y(fa)} color={C.sky} active={drag.dragging === "a"} />
    </>;
    controls = <>
      <Row>{SHAPES.map(e => <Btn key={e.key} active={sk === e.key} onClick={() => setSk(e.key)}>{e.label}</Btn>)}</Row>
      <Row>
        <Readout>{`x = ${n4(a, 2)}`}</Readout>
        <Readout color={d1 > 0 ? C.green : d1 < 0 ? C.red : C.amber}>{`f′ = ${n4(d1, 3)}  ${d1 > 0 ? tx(t, "figExt_rising", "rising") : d1 < 0 ? tx(t, "figExt_falling", "falling") : tx(t, "figExt_flat", "flat")}`}</Readout>
        <Readout color={C.purple}>{`f″ = ${n4(d2, 3)}  ${d2 > 0 ? tx(t, "figExt_cup", "bends up ∪") : d2 < 0 ? tx(t, "figExt_cap", "bends down ∩") : tx(t, "figExt_straight", "not bending")}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteS", "Drag the point along the curve. Green pieces rise (f′ > 0), red pieces fall (f′ < 0); between them the tangent is flat (amber circles). The second derivative says which way the curve bends: where f″ < 0 it bends down like ∩ and a flat spot is a peak (max); where f″ > 0 it bends up like ∪ and a flat spot is a valley (min). Purple diamonds mark where the bending switches. Try x³: its tangent is flat at 0, but the curve keeps rising on both sides, so f′ = 0 alone does not guarantee a peak.");
  } else if (mode === "optimize") {
    const L = 20, len = L - 2 * w, A = w * len, dA = L - 4 * w;
    const s = 10, ox = 30, oy = 40;                            // pen drawing: 10 px per metre
    const gp = plot({ W: 280, H: 230, x0: -0.6, x1: 10.6, y0: -6, y1: 60 });
    const Ap = (x: number) => x * (L - 2 * x);
    svg = <>
      <line x1={ox - 10} x2={ox + L * s + 10} y1={oy} y2={oy} stroke={C.fg} strokeWidth={4} />
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
    controls = <>
      <Slider label={tx(t, "figExt_width", "width w")} value={w} min={0.5} max={9.5} step={0.1} onChange={setW} width="w-16" />
      <Row>
        <Readout color={C.green}>{`A = w·(20 − 2w) = ${n4(A, 2)} m²`}</Readout>
        <Readout color={Math.abs(dA) < 0.5 ? C.green : C.purple}>{`A′(w) = 20 − 4w = ${n4(dA, 2)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteO", "The fence covers two widths w and one length 20 − 2w, so the area is A(w) = w(20 − 2w). Too narrow and the pen is a thin strip; too wide and the length collapses. The graph on the right shows A for every w, with its tangent at your w. While A′ > 0 widening helps; once A′ < 0 it hurts; the best pen is where the tangent is flat: 20 − 4w = 0, so w = 5 m, a 10 m length, and 50 m².");
  } else {
    const xs = iters, last = xs[xs.length - 1];
    const step = () => {
      const d = fn.d(last);
      if (Math.abs(d) < 1e-9 || !Number.isFinite(last)) return;
      setIters(s => [...s.slice(-30), last - fn.f(last) / d]);
    };
    svg = <>
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
      <Handle x={pr.X(xs[0])} y={pr.Y(0)} color={C.sky} active={drag.dragging === "a"} />
      <circle cx={pr.X(last)} cy={pr.Y(fn.f(last))} r={4} fill={C.green} />
    </>;
    controls = <>
      <Row>{NEWTON.map(e => <Btn key={e.key} active={nk === e.key} onClick={() => { setNk(e.key); setIters([e.key === "cycle" ? 0 : e.key === "cos" ? 2.5 : 3]); }}>{e.label}</Btn>)}</Row>
      <Row>
        <Btn active onClick={step}>{tx(t, "figExt_step", "one Newton step")}</Btn>
        <Btn onClick={() => setIters([xs[0]])}>{tx(t, "figExt_reset", "reset")}</Btn>
        <Readout color={C.muted}>{`x₀ = ${n4(xs[0], 2)}`}</Readout>
        {xs.slice(1).slice(-4).map((x, i, arr) =>
          <Readout key={i} color={C.amber}>{`x${String(xs.length - arr.length + i).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d])} = ${n4(x, 10)}`}</Readout>)}
        <Readout color={C.green}>{`f(x) = ${n4(fn.f(last), 10)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figExt_noteN", "Drag the blue start x₀ along the axis, then press the button. Each step replaces the curve by its tangent line at the current guess and jumps to where that line hits zero: x − f(x)/f′(x). Near a root the number of correct digits roughly doubles per step: for x² − 2 from x₀ = 3 you have √2 to ten digits after five steps. Starting where the tangent is flat throws the guess far away, and on x³ − 2x + 2 the start 0 jumps to 1 and back to 0 forever.");
  }

  return (
    <Figure
      title={tx(t, "figExt_title", "What the derivative tells you")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["shape", tx(t, "figExt_mS", "shape")],
        ["optimize", tx(t, "figExt_mO", "optimize")],
        ["newton", tx(t, "figExt_mN", "Newton's method")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...(mode === "optimize" ? {} : drag.handlers)} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
