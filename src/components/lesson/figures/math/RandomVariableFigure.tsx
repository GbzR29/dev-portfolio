"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Choice, C, T, plot, fnPath, useDrag, useFrame, useVisible, clamp, f2, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Top: how a random variable X spreads its probability. A discrete X (sum of
// two dice, heads in n coin flips) has a probability mass function: a bar of
// height P(X = x) at each possible value. A continuous X has a density f: no
// single value has any probability, and P(a ≤ X ≤ b) is the area under f
// between a and b. Bottom: the cumulative distribution function
// F(x) = P(X ≤ x), a staircase for discrete X and a smooth rise for continuous
// X. The blue range [a, b] (drag its ends) is shaded on top, and its
// probability appears on the bottom as the rise F(b) − F(a). The Transport
// draws real values of X, 200 at a time; their relative frequencies (amber)
// approach the bars or the density.
// The lab: one bar, a range as a rise of F, coin flips, a continuous point has
// probability 0, a density above 1, samples approaching the density.

type Mode = "dice" | "coins" | "cont";
type Dens = "uniform" | "ramp" | "exp";
const DENS: Record<Dens, { label: string; f: (x: number) => number; F: (x: number) => number; draw: (u: number) => number; top: number }> = {
  uniform: { label: "f = 1/4 on [0, 4]", f: x => (x >= 0 && x <= 4 ? 0.25 : 0), F: x => clamp(x / 4, 0, 1), draw: u => 4 * u, top: 0.25 },
  ramp: { label: "f = x/8 on [0, 4]", f: x => (x >= 0 && x <= 4 ? x / 8 : 0), F: x => clamp(x, 0, 4) ** 2 / 16, draw: u => 4 * Math.sqrt(u), top: 0.5 },
  exp: { label: "f = e^(−x), x ≥ 0", f: x => (x >= 0 ? Math.exp(-x) : 0), F: x => (x <= 0 ? 0 : 1 - Math.exp(-x)), draw: u => -Math.log(1 - u), top: 1 },
};
const W = 560, H1 = 180, H2 = 104, GAP = 22, H = H1 + GAP + H2 + 4, BIN = 0.25, MAX_SAMPLES = 20000, BATCH = 200;

const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };

/** The possible values and their probabilities for the discrete modes. */
function pmf(mode: Mode, n: number): [number, number][] {
  if (mode === "dice") return Array.from({ length: 11 }, (_, i) => [i + 2, (6 - Math.abs(i - 5)) / 36]);
  return Array.from({ length: n + 1 }, (_, k) => [k, choose(n, k) / 2 ** n]);
}

function sample(mode: Mode, n: number, dens: Dens) {
  const r = Math.random;
  if (mode === "dice") return Math.floor(r() * 6) + Math.floor(r() * 6) + 2;
  if (mode === "coins") { let h = 0; for (let i = 0; i < n; i++) if (r() < 0.5) h++; return h; }
  return DENS[dens].draw(r());
}

/** Plots, the pmf or density, the chosen range and its probability. */
function model(mode: Mode, n: number, dens: Dens, ab: [number, number]) {
  const cont = mode === "cont", D = DENS[dens];
  const x0 = mode === "dice" ? 0.5 : mode === "coins" ? -1 : -0.5, x1 = mode === "dice" ? 13 : mode === "coins" ? n + 1 : 5.5;
  const probs = cont ? [] : pmf(mode, n);
  const top = cont ? D.top : Math.max(...probs.map(p => p[1]));
  const pTop = plot({ W, H: H1, x0, x1, y0: -top * 0.08, y1: top * 1.2 });
  const pCdf = plot({ W, H: H2, x0, x1, y0: -0.08, y1: 1.32 });
  // The chosen range: whole numbers for discrete X, any reals for continuous X.
  const lo = cont ? Math.min(...ab) : Math.round(Math.min(...ab)), hi = cont ? Math.max(...ab) : Math.round(Math.max(...ab));
  const F = (x: number) => (cont ? D.F(x) : probs.reduce((s, [v, p]) => (v <= x + 1e-9 ? s + p : s), 0));
  const Flo = cont ? F(lo) : F(lo - 1), prob = F(hi) - Flo;
  return { cont, D, x0, x1, probs, pTop, pCdf, lo, hi, F, Flo, prob };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function RvStage({ mode, n, dens, ab, setAB, samples }: {
  mode: Mode; n: number; dens: Dens; ab: [number, number]; setAB: (f: (v: [number, number]) => [number, number]) => void; samples: number[];
}) {
  const { cont, D, x0, x1, probs, pTop, pCdf, lo, hi, F, Flo } = model(mode, n, dens, ab);
  const drag = useDrag<0 | 1>(
    q => (q.y > H1 ? null : Math.abs(pTop.X(ab[0]) - q.x) < Math.abs(pTop.X(ab[1]) - q.x) ? 0 : 1),
    (i, q) => setAB(v => { const w: [number, number] = [...v]; w[i] = clamp(pTop.inv(q).x, x0 + 0.3, x1 - 0.3); return w; }),
  );
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ew-resize">
      <Axes p={pTop} ticks={cont ? [0, 1, 2, 3, 4, 5] : probs.map(p => p[0])} />
      {cont ? <>
        <path d={shade(pTop, D.f, lo, hi)} fill={C.blue} fillOpacity={0.3} />
        <path d={fnPath(pTop, D.f, 0.0001, x1, 400)} fill="none" stroke={C.blue} strokeWidth={2.2} />
        <path d={fnPath(pTop, D.f, x0, -0.0001, 2)} fill="none" stroke={C.blue} strokeWidth={2.2} />
        {samples.length > 0 && <path d={histogram(pTop, samples, x1)} fill="none" stroke={C.amber} strokeWidth={1.6} />}
      </> : probs.map(([v, p]) => {
        const on = v >= lo && v <= hi, freq = samples.filter(s => s === v).length / (samples.length || 1);
        return <g key={v}>
          <rect x={pTop.X(v - 0.3)} y={pTop.Y(p)} width={0.6 * pTop.sx} height={pTop.Y(0) - pTop.Y(p)} fill={on ? C.blue : C.muted} opacity={on ? 0.8 : 0.35} rx={2} />
          {samples.length > 0 && <line x1={pTop.X(v - 0.38)} x2={pTop.X(v + 0.38)} y1={pTop.Y(freq)} y2={pTop.Y(freq)} stroke={C.amber} strokeWidth={2.2} />}
        </g>;
      })}
      {[lo, hi].map((v, i) => <g key={i}>
        <line x1={pTop.X(v)} x2={pTop.X(v)} y1={4} y2={pTop.Y(0)} stroke={C.blue} strokeWidth={1.2} strokeDasharray="4 4" />
        <T x={pTop.X(v) + (i ? 4 : -4)} y={14} anchor={i ? "start" : "end"} color={C.blue} bold>{i ? "b" : "a"}</T>
      </g>)}
      <T x={8} y={14} color={C.axis}>{cont ? "f(x)" : "P(X = x)"}</T>

      <g transform={`translate(0 ${H1 + GAP})`}>
        <Axes p={pCdf} ticks={[]} yTicks={[0, 0.5, 1]} />
        <path d={cont ? fnPath(pCdf, D.F, x0, x1, 400) : stairs(pCdf, probs)} fill="none" stroke={C.green} strokeWidth={2} />
        {[Flo, F(hi)].map((v, i) => <line key={i} x1={0} x2={W} y1={pCdf.Y(v)} y2={pCdf.Y(v)} stroke={C.blue} strokeWidth={1} strokeDasharray="4 4" />)}
        <line x1={pCdf.X(hi) + 10} x2={pCdf.X(hi) + 10} y1={pCdf.Y(Flo)} y2={pCdf.Y(F(hi))} stroke={C.blue} strokeWidth={3} />
        <T x={30} y={12} color={C.axis}>{"F(x) = P(X ≤ x)"}</T>
      </g>
    </svg>
  );
}

export function RandomVariableFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setModeRaw] = useState<Mode>("dice");
  const [n, setNRaw] = useState(4);
  const [dens, setDensRaw] = useState<Dens>("ramp");
  const [ab, setAB] = useState<[number, number]>([5, 8]);
  const [samples, setSamples] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-rv");
  const vis = useVisible<HTMLDivElement>();

  const setMode = (m: Mode) => { setModeRaw(m); setSamples([]); setPlaying(false); setAB(m === "dice" ? [5, 8] : m === "coins" ? [1, 2] : [1, 2]); };
  const setDens = (d: Dens) => { setDensRaw(d); setSamples([]); };
  const setN = (v: number) => { setNRaw(v); setSamples([]); };
  const { cont, lo, hi, prob } = model(mode, n, dens, ab);

  const addSamples = () => {
    if (samples.length >= MAX_SAMPLES) return false;
    setSamples([...samples, ...Array.from({ length: BATCH }, () => sample(mode, n, dens))]);
    return true;
  };
  const acc = useRef(0);                              // time since the last batch while playing
  useFrame(playing && (vis.on || lab.open), dt => {
    acc.current += dt;
    if (acc.current > 0.08) { acc.current = 0; if (!addSamples()) setPlaying(false); }
  });
  const stop = () => setPlaying(false);
  const inRange = samples.filter(v => v >= lo - 1e-9 && v <= hi + 1e-9).length;
  const ns = samples.length, freq = ns ? inRange / ns : NaN;

  const view = (
    <div>
      <RvStage mode={mode} n={n} dens={dens} ab={ab} setAB={setAB} samples={samples} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (ns >= MAX_SAMPLES) setSamples([]); setPlaying(p => !p); }}
        playLabel={tx(t, "figRv_keepSampling", "keep drawing values of X")}
        onStep={() => { stop(); addSamples(); }}
        onReset={() => { stop(); setSamples([]); }}
        readout={fill(tx(t, "figRv_nSamples", "{n} values"), { n: ns })} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["dice", tx(t, "figRv_dice", "sum of two dice")],
    ["coins", tx(t, "figRv_coins", "heads in n flips")],
    ["cont", tx(t, "figRv_cont", "continuous")],
  ]} />;
  const controls = <>
    {mode === "coins" && <Slider label={tx(t, "figRv_n", "flips n")} value={n} min={1} max={12} step={1} onChange={setN} fmt={v => String(v)} />}
    {cont && <Row><Choice value={dens} onChange={setDens} options={(Object.keys(DENS) as Dens[]).map(k => [k, DENS[k].label] as const)} /></Row>}
    <Row>
      <Readout color={C.blue}>{cont
        ? `P(${f2(lo)} ≤ X ≤ ${f2(hi)}) = F(${f2(hi)}) − F(${f2(lo)}) = ${f2(prob, 3)}`
        : `P(${lo} ≤ X ≤ ${hi}) = F(${hi}) − F(${lo - 1}) = ${f2(prob, 3)}`}</Readout>
      {ns > 0 && <Readout color={C.amber}>{`${tx(t, "figRv_freq", "sampled")}: ${inRange}/${ns} = ${f2(freq, 3)}`}</Readout>}
    </Row>
  </>;
  const note = <>
    {tx(t, "figRv_note2", "For a discrete variable each bar is a probability and the bars add up to 1; F climbs in steps, one step per bar. For a continuous variable the curve is a density: probability is area under it, the total area is 1, and F rises smoothly. Either way the probability of a range is the rise of F across it. A density can be higher than 1 (it is probability per unit), but an area never exceeds 1. Press ▶ to draw real values of X: their frequencies (amber) close in on the bars or the curve.")}{" "}
    <span data-mouse-only>{tx(t, "figRv_drag", "Drag in the top plot to move a and b.")}</span>
    <span data-touch-only>{tx(t, "figRv_dragTouch", "Drag in the top plot to move a and b.")}</span>
  </>;

  // ── Lab ──
  const p3 = f2(prob, 3);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRvL1_t", "One value"),
      body: <>
        <p>{tx(t, "figRvL1_b1", "S is the sum of two dice. Each bar is P(S = s), and the bars add up to 1. The blue range [a, b] is the event a ≤ S ≤ b.")}</p>
        <p>{tx(t, "figRvL1_b2", "Squeeze the range onto the single value 7.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRvL1_g", "a = b = 7 (now {lo} to {hi}, P = {p})."), { lo, hi, p: p3 }), done: mode === "dice" && lo === 7 && hi === 7 },
      hint: tx(t, "figRvL1_h", "Drag a and b towards each other until both sit on 7. P(S = 7) = 6/36 ≈ 0.167."),
      setup: () => { stop(); setMode("dice"); },
    },
    {
      title: tx(t, "figRvL2_t", "A range is a rise of F"),
      body: <>
        <p>{tx(t, "figRvL2_b1", "The green staircase is F(x) = P(S ≤ x). The blue bar on its right is the probability of the range: F(b) − F(a − 1).")}</p>
        <p>{tx(t, "figRvL2_b2", "Find a range of at most four values that holds at least half the probability.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRvL2_g", "P ≥ 0.5 with b − a ≤ 3 (now {lo} to {hi}, P = {p})."), { lo, hi, p: p3 }), done: mode === "dice" && prob >= 0.5 - 1e-9 && hi - lo <= 3 },
      hint: tx(t, "figRvL2_h", "Put the range around the tallest bars: 5 to 8 holds 20/36."),
      setup: () => { stop(); setMode("dice"); setAB([2, 3]); },
    },
    {
      title: tx(t, "figRvL3_t", "Coin flips"),
      body: <>
        <p>{tx(t, "figRvL3_b1", "H = the number of heads in n fair flips. P(H = k) = C(n, k)/2ⁿ: the row of Pascal's triangle divided by 2ⁿ.")}</p>
        <p>{tx(t, "figRvL3_b2", "Switch to coin flips and set n = 10.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRvL3_g", "Heads in 10 flips (now n = {n})."), { n }), done: mode === "coins" && n === 10 },
      setup: () => { stop(); setMode("dice"); },
    },
    {
      title: tx(t, "figRvL4_t", "Quick check"),
      body: <p>{tx(t, "figRvL4_b", "Look at the middle bar for n = 10.")}</p>,
      quiz: {
        q: tx(t, "figRvL4_q", "In 10 fair flips, what is P(exactly 5 heads)?"),
        options: ["252/1024 ≈ 0.25", "1/2", "5/10", "1/1024"],
        answer: 0,
        why: tx(t, "figRvL4_w", "C(10, 5) = 252 of the 2¹⁰ = 1024 equally likely sequences have exactly 5 heads. Half the flips being heads is the most likely result, but it still happens only about a quarter of the time."),
      },
    },
    {
      title: tx(t, "figRvL5_t", "A single point"),
      body: <>
        <p>{tx(t, "figRvL5_b1", "A continuous X can take any value. Its probability is area under the density f.")}</p>
        <p>{tx(t, "figRvL5_b2", "Choose continuous and squeeze a and b very close together. What is left of the area?")}</p>
      </>,
      goal: { text: fill(tx(t, "figRvL5_g", "Continuous, b − a < 0.05 (now P = {p})."), { p: f2(prob, 4) }), done: cont && hi - lo < 0.05 },
      hint: tx(t, "figRvL5_h", "The area of a sliver is about f(x) times its width, and the width goes to 0."),
      setup: () => { stop(); setMode("cont"); setDensRaw("ramp"); },
    },
    {
      title: tx(t, "figRvL6_t", "Quick check"),
      body: <p>{tx(t, "figRvL6_b", "A density is probability per unit length, not a probability.")}</p>,
      quiz: {
        q: tx(t, "figRvL6_q", "X is uniform on [0, 0.5]. What is the height of its density?"),
        options: ["2", "0.5", "1", tx(t, "figRvL6_o4", "impossible: a density cannot exceed 1")],
        answer: 0,
        why: tx(t, "figRvL6_w", "The rectangle has width 0.5 and area 1, so its height is 1/0.5 = 2. Only areas, which are probabilities, have to stay at most 1."),
      },
    },
    {
      title: tx(t, "figRvL7_t", "Real values"),
      body: <>
        <p>{tx(t, "figRvL7_b1", "With f = x/8 on [0, 4], values near 4 are four times as likely per unit as values near 1.")}</p>
        <p>{tx(t, "figRvL7_b2", "Press ▶ and draw thousands of values. The amber histogram, scaled so its area is 1, settles onto the density.")}</p>
      </>,
      goal: { text: fill(tx(t, "figRvL7_g", "At least 5000 values from f = x/8 (now {n})."), { n: ns }), done: cont && dens === "ramp" && ns >= 5000 },
      focus: "play",
      setup: () => { stop(); setMode("cont"); setDensRaw("ramp"); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "sliver", tone: "info", when: cont && hi - lo < 0.1,
      title: tx(t, "figRvI1_t", "Area of a sliver"),
      body: fill(tx(t, "figRvI1_b", "The range is only {w} wide, so its area is about f(x) × {w} = {p}. As the width shrinks to 0, so does the probability: P(X = x) = 0 for a continuous X."), { w: f2(hi - lo, 3), p: f2(prob, 4) }),
    },
    {
      id: "all", tone: "ok", when: prob > 0.999,
      title: tx(t, "figRvI2_t", "Everything"),
      body: tx(t, "figRvI2_b", "The range covers all the possible values: the total probability is 1."),
    },
    {
      id: "match", tone: "ok", when: ns >= 2000 && Math.abs(freq - prob) < 0.02,
      title: tx(t, "figRvI3_t", "Frequency meets probability"),
      body: fill(tx(t, "figRvI3_b", "{k} of {n} values fell in the range: {f}, against the probability {p}."), { k: inRange, n: ns, f: f2(freq, 3), p: p3 }),
    },
    {
      id: "few", tone: "warn", when: ns > 0 && ns <= 400 && !cont,
      title: tx(t, "figRvI4_t", "Still noisy"),
      body: tx(t, "figRvI4_b", "A few hundred values give amber marks that scatter around the bars. Keep drawing and they line up."),
    },
  ];

  const title = tx(t, "figRv_title", "Distribution and CDF of a random variable");
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
          tx(t, "figRvR1", "A discrete X has a bar P(X = x) at each value; the bars add up to 1."),
          tx(t, "figRvR2", "F(x) = P(X ≤ x), and the probability of a range is the rise of F across it."),
          tx(t, "figRvR3", "A continuous X has a density: probability is area, so a single point has probability 0."),
          tx(t, "figRvR4", "A density can exceed 1; drawn values fill out its shape as they pile up."),
        ]}
      />
    </>
  );
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function Axes({ p, ticks, yTicks = [] }: { p: Plot; ticks: number[]; yTicks?: number[] }) {
  return <g pointerEvents="none">
    <line x1={0} x2={p.W} y1={p.Y(0)} y2={p.Y(0)} stroke={C.axis} strokeWidth={1.2} />
    {ticks.map(v => <T key={v} x={p.X(v)} y={p.Y(0) + 11} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
    {yTicks.map(v => <g key={v}>
      <line x1={0} x2={p.W} y1={p.Y(v)} y2={p.Y(v)} stroke={C.grid} strokeWidth={0.6} />
      <T x={4} y={p.Y(v) - 3} color={C.axis} size={8.5}>{v}</T>
    </g>)}
  </g>;
}

/** Closed region under f between a and b. */
function shade(p: Plot, f: (x: number) => number, a: number, b: number) {
  let d = `M${p.X(a).toFixed(1)},${p.Y(0).toFixed(1)}`;
  for (let i = 0; i <= 120; i++) { const x = a + ((b - a) * i) / 120; d += `L${p.X(x).toFixed(1)},${p.Y(f(x)).toFixed(1)}`; }
  return d + `L${p.X(b).toFixed(1)},${p.Y(0).toFixed(1)}Z`;
}

/** Relative-frequency histogram scaled to a density (count / (N · bin width)). */
function histogram(p: Plot, xs: number[], x1: number) {
  const bins = new Array(Math.ceil(x1 / BIN)).fill(0);
  for (const v of xs) { const i = Math.floor(v / BIN); if (i >= 0 && i < bins.length) bins[i]++; }
  let d = `M${p.X(0).toFixed(1)},${p.Y(0).toFixed(1)}`;
  bins.forEach((c, i) => { const y = p.Y(c / (xs.length * BIN)).toFixed(1); d += `L${p.X(i * BIN).toFixed(1)},${y}L${p.X((i + 1) * BIN).toFixed(1)},${y}`; });
  return d;
}

/** The staircase F for a discrete variable: flat between values, a jump at each. */
function stairs(p: Plot, probs: [number, number][]) {
  let acc = 0, d = `M0,${p.Y(0).toFixed(1)}`;
  for (const [v, pr] of probs) { d += `L${p.X(v).toFixed(1)},${p.Y(acc).toFixed(1)}`; acc += pr; d += `M${p.X(v).toFixed(1)},${p.Y(acc).toFixed(1)}`; }
  return d + `L${p.W},${p.Y(acc).toFixed(1)}`;
}
