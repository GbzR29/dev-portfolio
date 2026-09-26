"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, plot, fnPath, useDrag, clamp, f2, type Plot } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Top: how a random variable X spreads its probability. A discrete X (sum of
// two dice, heads in n coin flips) has a probability mass function: a bar of
// height P(X = x) at each possible value. A continuous X has a density f: no
// single value has any probability, and P(a ≤ X ≤ b) is the area under f
// between a and b. Bottom: the cumulative distribution function
// F(x) = P(X ≤ x), a staircase for discrete X and a smooth rise for continuous
// X. The blue range [a, b] (drag its ends) is shaded on top, and its
// probability appears on the bottom as the rise F(b) − F(a). "Sample" draws
// real values of X; their relative frequencies (amber) approach the bars.

type Mode = "dice" | "coins" | "cont";
type Dens = "uniform" | "ramp" | "exp";
const DENS: Record<Dens, { label: string; f: (x: number) => number; F: (x: number) => number; draw: (u: number) => number; top: number }> = {
  uniform: { label: "f = 1/4 on [0, 4]", f: x => (x >= 0 && x <= 4 ? 0.25 : 0), F: x => clamp(x / 4, 0, 1), draw: u => 4 * u, top: 0.25 },
  ramp: { label: "f = x/8 on [0, 4]", f: x => (x >= 0 && x <= 4 ? x / 8 : 0), F: x => clamp(x, 0, 4) ** 2 / 16, draw: u => 4 * Math.sqrt(u), top: 0.5 },
  exp: { label: "f = e^(−x), x ≥ 0", f: x => (x >= 0 ? Math.exp(-x) : 0), F: x => (x <= 0 ? 0 : 1 - Math.exp(-x)), draw: u => -Math.log(1 - u), top: 1 },
};
const W = 560, H1 = 180, H2 = 104, GAP = 22, H = H1 + GAP + H2 + 4, BIN = 0.25, MAX_SAMPLES = 20000;

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

export function RandomVariableFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setModeRaw] = useState<Mode>("dice");
  const [n, setN] = useState(4);
  const [dens, setDensRaw] = useState<Dens>("ramp");
  const [ab, setAB] = useState<[number, number]>([5, 8]);
  const [samples, setSamples] = useState<number[]>([]);

  const setMode = (m: Mode) => { setModeRaw(m); setSamples([]); setAB(m === "dice" ? [5, 8] : m === "coins" ? [1, 2] : [1, 2]); };
  const setDens = (d: Dens) => { setDensRaw(d); setSamples([]); };
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

  const drag = useDrag<0 | 1>(
    q => (q.y > H1 ? null : Math.abs(pTop.X(ab[0]) - q.x) < Math.abs(pTop.X(ab[1]) - q.x) ? 0 : 1),
    (i, q) => setAB(v => { const w: [number, number] = [...v]; w[i] = clamp(pTop.inv(q).x, x0 + 0.3, x1 - 0.3); return w; }),
  );

  const addSamples = () => setSamples(s => (s.length >= MAX_SAMPLES ? s : [...s, ...Array.from({ length: 200 }, () => sample(mode, n, dens))]));
  const inRange = samples.filter(v => v >= lo - 1e-9 && v <= hi + 1e-9).length;

  return (
    <Figure
      title={tx(t, "figRv_title", "Distribution and CDF of a random variable")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["dice", tx(t, "figRv_dice", "sum of two dice")],
        ["coins", tx(t, "figRv_coins", "heads in n flips")],
        ["cont", tx(t, "figRv_cont", "continuous")],
      ]} />}
      controls={<>
        {mode === "coins" && <Slider label={tx(t, "figRv_n", "flips n")} value={n} min={1} max={12} step={1} onChange={setN} fmt={v => String(v)} />}
        {cont && <Row><Choice value={dens} onChange={setDens} options={(Object.keys(DENS) as Dens[]).map(k => [k, DENS[k].label] as const)} /></Row>}
        <Row>
          <Btn onClick={addSamples}>{tx(t, "figRv_sample", "sample ×200")}</Btn>
          <Btn onClick={() => setSamples([])}>{tx(t, "figRv_reset", "reset")}</Btn>
        </Row>
        <Row>
          <Readout color={C.blue}>{cont
            ? `P(${f2(lo)} ≤ X ≤ ${f2(hi)}) = F(${f2(hi)}) − F(${f2(lo)}) = ${f2(prob, 3)}`
            : `P(${lo} ≤ X ≤ ${hi}) = F(${hi}) − F(${lo - 1}) = ${f2(prob, 3)}`}</Readout>
          {samples.length > 0 && <Readout color={C.amber}>{`${tx(t, "figRv_freq", "sampled")}: ${inRange}/${samples.length} = ${f2(inRange / samples.length, 3)}`}</Readout>}
        </Row>
      </>}
      note={<>
        {tx(t, "figRv_note", "For a discrete variable each bar is a probability and the bars add up to 1; F climbs in steps, one step per bar. For a continuous variable the curve is a density: probability is area under it, the total area is 1, and F rises smoothly. Either way the probability of a range is the rise of F across it. A density can be higher than 1 (it is probability per unit), but an area never exceeds 1.")}{" "}
        <span data-mouse-only>{tx(t, "figRv_drag", "Drag in the top plot to move a and b.")}</span>
        <span data-touch-only>{tx(t, "figRv_dragTouch", "Drag in the top plot to move a and b.")}</span>
      </>}
    >
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
    </Figure>
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
