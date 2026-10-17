"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, plot, Grid } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The idea behind the Euler–Lagrange equation. A curve y joins two fixed
// points (blue). A bump η, zero at both ends, is added with a size ε: the
// amber curve is y + εη. On the right, J(y + εη) is plotted against ε, an
// ordinary function of one number. If y is the best curve, every bump makes
// J worse, so ε = 0 is the bottom of that graph and the slope there is 0.
// For any other curve some bump has a non-zero slope, and "take the best ε"
// moves y downhill. Two functionals: length ∫ √(1 + y′²) dx (best curve: the
// straight line) and ∫ (½ y′² + 4y) dx (best curve: the parabola y″ = 4).
// Break it: a bump that does not vanish at the end moves the end point, and
// then even the best curve has a non-zero slope (the boundary term).

type Fn = "length" | "sag";
type Start = "best" | "arc" | "wiggle";
const W = 560, H = 270, LW = 330, RW = 200, RX = 352;
const N = 160, B = 0.6;
const xs = Array.from({ length: N + 1 }, (_, i) => i / N);
const pl = plot({ W: LW, H, x0: -0.08, x1: 1.08, y0: -0.55, y1: 1.15 });
const E_MAX = 0.6;
const n4 = (v: number) => v.toFixed(4).replace("-", "−");

/** J[y] by the midpoint rule on the grid. */
function J(fn: Fn, y: number[]) {
  let s = 0;
  for (let i = 0; i < N; i++) {
    const d = (y[i + 1] - y[i]) * N, m = (y[i] + y[i + 1]) / 2;
    s += (fn === "length" ? Math.sqrt(1 + d * d) : 0.5 * d * d + 4 * m) / N;
  }
  return s;
}
/** The exact minimiser through (0, 0) and (1, B). */
const best = (fn: Fn) => xs.map(x => (fn === "length" ? B * x : 2 * x * x + (B - 2) * x));
const start = (fn: Fn, s: Start) => {
  const b = best(fn);
  return s === "best" ? b : s === "arc" ? b.map((v, i) => v + 0.38 * Math.sin(Math.PI * xs[i])) : b.map((v, i) => v + 0.18 * Math.sin(3 * Math.PI * xs[i]) - 0.12 * Math.sin(2 * Math.PI * xs[i]));
};
/** The bump: sin(kπx), zero at both ends; or, broken, a ramp that lifts the end. */
const bump = (k: number, free: boolean) => xs.map(x => (free ? Math.sin((Math.PI * x) / 2) : Math.sin(k * Math.PI * x)) * 0.5);
const shifted = (y: number[], eta: number[], e: number) => y.map((v, i) => v + e * eta[i]);

function Stage({ fn, y, eta, eps, t }: { fn: Fn; y: number[]; eta: number[]; eps: number; t?: TrackTranslations }) {
  const ys = shifted(y, eta, eps);
  const path = (v: number[]) => v.map((yy, i) => `${i ? "L" : "M"}${pl.X(xs[i]).toFixed(1)},${pl.Y(yy).toFixed(1)}`).join("");
  // J(ε) on the right
  const es = Array.from({ length: 61 }, (_, i) => -E_MAX + (2 * E_MAX * i) / 60);
  const js = es.map(e => J(fn, shifted(y, eta, e)));
  const lo = Math.min(...js), hi = Math.max(...js), pad = (hi - lo) * 0.12 + 1e-3;
  const pr = plot({ W: RW, H, x0: -E_MAX, x1: E_MAX, y0: lo - pad, y1: hi + pad });
  const j0 = J(fn, y), h = 1e-3, slope = (J(fn, shifted(y, eta, h)) - J(fn, shifted(y, eta, -h))) / (2 * h);
  const tan = (e: number) => j0 + slope * e;
  const jNow = J(fn, ys);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <Grid p={pl} step={0.25} labels={false} />
      <path d={path(eta.map(v => v * 0.25 - 0.42))} fill="none" stroke={C.purple} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.7} />
      <T x={pl.X(0.02)} y={pl.Y(-0.5)} size={9} color={C.purple}>{tx(t, "figVar_eta", "bump η")}</T>
      <path d={path(y)} fill="none" stroke={C.sky} strokeWidth={2.2} />
      <path d={path(ys)} fill="none" stroke={C.amber} strokeWidth={2} />
      <circle cx={pl.X(0)} cy={pl.Y(0)} r={5} fill={C.fg} />
      <circle cx={pl.X(1)} cy={pl.Y(B)} r={5} fill={C.fg} />
      {Math.abs(ys[N] - B) > 1e-6 && <circle cx={pl.X(1)} cy={pl.Y(ys[N])} r={5} fill="none" stroke={C.red} strokeWidth={2} />}
      <T x={pl.X(0) + 7} y={pl.Y(0) + 14} size={10} color={C.fg} bold>A</T>
      <T x={pl.X(1) - 14} y={pl.Y(B) - 8} size={10} color={C.fg} bold>B</T>
      <T x={8} y={16} size={10.5} color={C.sky} bold>y</T>
      <T x={30} y={16} size={10.5} color={C.amber} bold>y + εη</T>

      <g transform={`translate(${RX},0)`}>
        <rect x={0} y={0} width={RW} height={H} fill="none" stroke={C.grid} />
        <line x1={pr.X(0)} y1={0} x2={pr.X(0)} y2={H} stroke={C.axis} strokeWidth={1} />
        <path d={js.map((v, i) => `${i ? "L" : "M"}${pr.X(es[i]).toFixed(1)},${pr.Y(v).toFixed(1)}`).join("")} fill="none" stroke={C.green} strokeWidth={2} />
        <line x1={pr.X(-0.25)} y1={pr.Y(tan(-0.25))} x2={pr.X(0.25)} y2={pr.Y(tan(0.25))} stroke={Math.abs(slope) < 5e-3 ? C.green : C.red} strokeWidth={1.5} strokeDasharray="4 3" />
        <circle cx={pr.X(0)} cy={pr.Y(j0)} r={4} fill={C.sky} />
        <circle cx={pr.X(eps)} cy={pr.Y(jNow)} r={5} fill={C.amber} />
        <T x={6} y={16} size={10} color={C.green} bold>J(y + εη)</T>
        <T x={RW - 6} y={H - 6} size={10} anchor="end">ε</T>
      </g>
    </svg>
  );
}

export function VariationFigure({ t }: { t?: TrackTranslations }) {
  const [fn, setFnRaw] = useState<Fn>("length");
  const [y, setY] = useState<number[]>(() => start("length", "arc"));
  const [from, setFrom] = useState<Start>("arc");
  const [k, setK] = useState(1);
  const [eps, setEps] = useState(0.2);
  const [free, setFree] = useState(false);
  const [moves, setMoves] = useState(0);
  const lab = useLab("math-variations");

  const eta = bump(k, free);
  const j0 = J(fn, y), h = 1e-3;
  const slope = (J(fn, shifted(y, eta, h)) - J(fn, shifted(y, eta, -h))) / (2 * h);
  const jBest = J(fn, best(fn));
  // the slope for every fixed-end bump: all ≈ 0 only at the best curve
  const slopes = [1, 2, 3].map(q => { const e = bump(q, false); return (J(fn, shifted(y, e, h)) - J(fn, shifted(y, e, -h))) / (2 * h); });
  const stationary = slopes.every(s => Math.abs(s) < 5e-3);

  const reset = (f: Fn, s: Start) => { setFnRaw(f); setFrom(s); setY(start(f, s)); setEps(0.2); setMoves(0); };
  /** Line search: the ε in [−0.6, 0.6] with the smallest J, then make it the new curve. */
  const improve = () => {
    let bestE = 0, bestJ = j0;
    for (let i = 0; i <= 240; i++) { const e = -E_MAX + (2 * E_MAX * i) / 240, v = J(fn, shifted(y, eta, e)); if (v < bestJ) { bestJ = v; bestE = e; } }
    if (bestE !== 0) { setY(shifted(y, eta, bestE)); setMoves(m => m + 1); }
    setEps(0);
  };

  const view = <Stage fn={fn} y={y} eta={eta} eps={eps} t={t} />;
  const fnChoice = <Choice value={fn} onChange={f => reset(f, from)} options={[
    ["length", tx(t, "figVar_fLen", "length")],
    ["sag", tx(t, "figVar_fSag", "hanging string")],
  ] as const} />;
  const controls = <>
    <Row>
      <Btn active={from === "best"} onClick={() => reset(fn, "best")}>{tx(t, "figVar_sBest", "best curve")}</Btn>
      <Btn active={from === "arc"} onClick={() => reset(fn, "arc")}>{tx(t, "figVar_sArc", "an arc")}</Btn>
      <Btn active={from === "wiggle"} onClick={() => reset(fn, "wiggle")}>{tx(t, "figVar_sWig", "a wiggle")}</Btn>
    </Row>
    <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
      {[1, 2, 3].map(q => <Btn key={q} active={!free && k === q} onClick={() => { setK(q); setFree(false); }}>{`η = sin ${q === 1 ? "" : q}πx`}</Btn>)}
      <Btn active={free} onClick={() => setFree(v => !v)}>{tx(t, "figVar_break", "break it: free end")}</Btn>
    </div>
    <Row>
      <Slider label="ε" value={eps} min={-E_MAX} max={E_MAX} step={0.01} onChange={setEps} fmt={v => v.toFixed(2)} width="w-32" />
      <Btn onClick={improve}>{tx(t, "figVar_improve", "take the best ε")}</Btn>
    </Row>
    <Row>
      <Readout color={C.sky}>{fill(tx(t, "figVar_J", "J[y] = {j}"), { j: n4(j0) })}</Readout>
      <Readout color={Math.abs(slope) < 5e-3 ? C.green : C.red}>{fill(tx(t, "figVar_slope", "dJ/dε at 0 = {s}"), { s: n4(slope) })}</Readout>
      <Readout color={C.muted}>{fill(tx(t, "figVar_min", "smallest possible {j}"), { j: n4(jBest) })}</Readout>
    </Row>
  </>;
  const note = fn === "length"
    ? tx(t, "figVar_noteL", "J is the length of the curve from A to B. Pick a bump η, which is zero at both ends so A and B stay put, and slide ε: the amber curve is y + εη, and the green graph on the right is its length as a function of ε. For the straight line the green graph always has its bottom at ε = 0, with a flat tangent, whichever bump you choose. Start from an arc and the tangent is tilted: some ε shortens the curve. Press \"take the best ε\" with different bumps and the curve slides down to the line.")
    : tx(t, "figVar_noteS", "Now J = ∫ (½ y′² + 4y) dx: the first part grows when the curve is steep, like the stretch energy of a string, and the second when it is high, like the energy of its weight. The best curve is no longer straight: it sags into the parabola y = 2x² − 1.4x, the solution of the Euler–Lagrange equation y″ = 4. At that curve every bump again gives a flat tangent at ε = 0.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figVarL1_t", "Wiggle the best curve"),
      body: <>
        <p>{tx(t, "figVarL1_b1", "The blue curve is the straight line from A to B, the shortest path. Slide ε to bend it with the bump.")}</p>
        <p>{tx(t, "figVarL1_b2", "Try both directions and another bump. The length only ever grows: ε = 0 sits at the bottom of the green graph.")}</p>
      </>,
      goal: { text: tx(t, "figVarL1_g", "Bump sin 2πx with ε below −0.3."), done: fn === "length" && from === "best" && !free && k === 2 && eps < -0.3 },
      setup: () => { reset("length", "best"); setK(1); setFree(false); },
    },
    {
      title: tx(t, "figVarL2_t", "Quick check"),
      body: <p>{tx(t, "figVarL2_b", "J(y + εη) is an ordinary function of the number ε, and it is smallest at ε = 0.")}</p>,
      quiz: {
        q: tx(t, "figVarL2_q", "What must be true at ε = 0 for the best curve?"),
        options: ["dJ/dε = 0", "J = 0", "dJ/dε = 1", tx(t, "figVarL2_o4", "the bump must be zero")],
        answer: 0,
        why: tx(t, "figVarL2_w", "A smooth function has a flat tangent at its minimum, exactly as in the derivatives chapter. This must hold for every bump η."),
      },
    },
    {
      title: tx(t, "figVarL3_t", "Slide downhill"),
      body: <p>{tx(t, "figVarL3_b", "Start from the wiggle. Its tangent is tilted for some bumps. Choose a bump, press \"take the best ε\", change bump, and repeat until all three slopes are flat.")}</p>,
      goal: { text: tx(t, "figVarL3_g", "Length within 0.001 of the straight line."), done: fn === "length" && from === "wiggle" && j0 - jBest < 1e-3 && moves > 0 },
      setup: () => { reset("length", "wiggle"); setFree(false); },
    },
    {
      title: tx(t, "figVarL4_t", "A curved winner"),
      body: <p>{tx(t, "figVarL4_b", "Switch to the hanging string, J = ∫ (½ y′² + 4y) dx. Start from the arc and improve it until it is stationary for every bump.")}</p>,
      goal: { text: tx(t, "figVarL4_g", "Hanging string: all three slopes below 0.005."), done: fn === "sag" && stationary && !free },
      setup: () => { reset("sag", "arc"); setFree(false); },
    },
    {
      title: tx(t, "figVarL5_t", "Break it"),
      body: <p>{tx(t, "figVarL5_b", "Choose the best curve and turn on \"free end\". This bump does not vanish at B, so the amber curve ends somewhere else (the red ring). Now the slope at ε = 0 is not 0, even for the best curve: the curve was best only among curves that end at B.")}</p>,
      goal: { text: tx(t, "figVarL5_g", "Best curve, free end: a non-zero slope."), done: from === "best" && free && Math.abs(slope) > 0.05 },
      setup: () => { reset(fn, "best"); },
    },
    {
      title: tx(t, "figVarL6_t", "Quick check"),
      body: <p>{tx(t, "figVarL6_b", "For L(y, y′) = ½ y′² + 4y: ∂L/∂y = 4 and ∂L/∂y′ = y′. Euler–Lagrange says ∂L/∂y − d/dx (∂L/∂y′) = 0.")}</p>,
      quiz: {
        q: tx(t, "figVarL6_q", "Which equation does the best curve satisfy?"),
        options: ["y″ = 4", "y′ = 4", "y″ = −4", "y = 4"],
        answer: 0,
        why: tx(t, "figVarL6_w", "4 − y″ = 0, so y″ = 4: a parabola, y = 2x² + cx + d, with c and d fixed by A and B."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "ok", when: stationary && !free,
      title: tx(t, "figVarI1_t", "Stationary"),
      body: tx(t, "figVarI1_b", "Every bump gives slope 0 at ε = 0: this curve satisfies the Euler–Lagrange equation."),
    },
    {
      id: "free", tone: "warn", when: free,
      title: tx(t, "figVarI2_t", "The end moved"),
      body: tx(t, "figVarI2_b", "η(1) ≠ 0, so y + εη no longer ends at B. In the derivation, the boundary term [∂L/∂y′ · η] from integrating by parts no longer vanishes."),
    },
    {
      id: "moves", tone: "info", when: moves >= 3 && !stationary,
      title: tx(t, "figVarI3_t", "Change the bump"),
      body: tx(t, "figVarI3_b", "One bump can only fix one shape of error. If the slope for this bump is already 0, try another one."),
    },
  ];

  const title = tx(t, "figVar_title", "Varying a curve: why the best one is stationary");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{fnChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{fnChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figVarR1", "Add a bump εη that is zero at both ends; J(y + εη) is then an ordinary function of ε."),
          tx(t, "figVarR2", "At the best curve, dJ/dε = 0 at ε = 0 for every bump: the curve is stationary."),
          tx(t, "figVarR3", "That condition is the Euler–Lagrange equation; for length it gives a straight line, for ½ y′² + 4y the parabola y″ = 4."),
          tx(t, "figVarR4", "The ends must stay fixed (η = 0 there), or a boundary term appears."),
        ]}
      />
    </>
  );
}
