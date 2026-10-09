"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, plot, fnPath, useDrag, useFrame, useVisible, clamp, f2, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { binomPmf, normPdf, Phi, poisPmf } from "./distMath";

// ── What this figure shows ────────────────────────────────────────────────────
// The common named distributions with their parameters on sliders. Discrete
// ones (binomial, geometric, Poisson) are bars P(X = k); continuous ones
// (exponential, normal) are density curves. The blue line is the mean and the
// amber band is mean ± one standard deviation, both from the formulas in the
// chapter. Drag the green line to shade P(X ≤ x). For the binomial, "compare"
// overlays the normal curve with the same mean and variance and the Poisson
// with the same mean: the normal fits when np(1 − p) is large, the Poisson
// when n is large and p small. The Transport draws real values of X, more at
// each step; their frequencies (orange) settle on the bars or the curve.
// The lab: guessing a quiz, the bell, Poisson as a limit, waiting for a 6,
// sampling, the 97.5% point of the normal, the median wait, memorylessness.

type Dist = "binom" | "geom" | "pois" | "exp" | "norm";
type Params = { dist: Dist; n: number; p: number; lam: number; mu: number; sd: number };
type Samples = { key: string; n: number; sum: number; counts: number[] };
const W = 560, H = 230, BINS = 48, MAX_DRAWS = 50000;
const START: Params = { dist: "binom", n: 20, p: 0.3, lam: 3, mu: 0, sd: 1 };
const DEFAULT_CUT: Record<Dist, number> = { binom: 6, geom: 3, pois: 3, exp: 1, norm: 1 };

const paramKey = (P: Params) => `${P.dist}|${P.n}|${P.p}|${P.lam}|${P.mu}|${P.sd}`;

// ── The model: pmf or density, mean, variance, CDF and the plot window ────────

function model(P: Params) {
  const { dist, n, p, lam, mu, sd } = P;
  const discrete = dist === "binom" || dist === "geom" || dist === "pois";
  // Mean and variance from the closed-form formulas.
  const [mean, vr] =
    dist === "binom" ? [n * p, n * p * (1 - p)] :
    dist === "geom" ? [1 / p, (1 - p) / (p * p)] :
    dist === "pois" ? [lam, lam] :
    dist === "exp" ? [1 / lam, 1 / (lam * lam)] : [mu, sd * sd];
  const s = Math.sqrt(vr);

  const kMax = dist === "binom" ? n : dist === "geom" ? Math.min(40, Math.ceil(mean + 4 * s) + 1) : Math.ceil(lam + 4 * Math.sqrt(lam)) + 2;
  const pmf = (k: number) => dist === "binom" ? binomPmf(k, n, p) : dist === "geom" ? (k >= 1 ? (1 - p) ** (k - 1) * p : 0) : poisPmf(k, lam);
  const dens = (x: number) => dist === "exp" ? (x >= 0 ? lam * Math.exp(-lam * x) : 0) : normPdf(x, mu, sd);
  const bars = discrete ? Array.from({ length: kMax + 1 }, (_, k) => [k, pmf(k)] as const) : [];
  const cdf = (x: number) => discrete
    ? bars.reduce((acc, [k, pk]) => acc + (k <= x + 1e-9 ? pk : 0), 0)
    : dist === "exp" ? (x <= 0 ? 0 : 1 - Math.exp(-lam * x)) : Phi((x - mu) / sd);

  const [x0, x1] = discrete ? [-0.8, kMax + 0.8] : dist === "exp" ? [-0.3, Math.max(4, 5 / lam)] : [-6, 6];
  const top = discrete ? Math.max(...bars.map(b => b[1])) : dist === "exp" ? lam : normPdf(mu, mu, sd);
  const ticks = discrete ? bars.filter(([k]) => kMax <= 20 || k % 5 === 0).map(b => b[0]) : dist === "exp" ? [0, 1, 2, 3, 4, 5, 6, 8, 10].filter(v => v < x1) : [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  return { discrete, mean, vr, s, kMax, dens, bars, cdf, x0, x1, top, ticks };
}
type Model = ReturnType<typeof model>;

/** The cut as the figure uses it: a whole k for bars, a point inside the window for curves. */
const cutOf = (m: Model, cut: number) => m.discrete ? Math.floor(clamp(cut, 0, m.kMax)) : clamp(cut, m.x0, m.x1);

/** The largest gap between Binomial(n, p) and Poisson(np), over all k. */
function poissonGap(n: number, p: number) {
  let gap = 0;
  for (let k = 0; k <= n; k++) gap = Math.max(gap, Math.abs(binomPmf(k, n, p) - poisPmf(k, n * p)));
  return gap;
}

// ── Sampling: real values of X and their frequencies ──────────────────────────

/** One value of X: counting successes, waiting, Knuth's Poisson, inverse CDF, Box–Muller. */
function sampleOne(P: Params) {
  const u = Math.random();
  switch (P.dist) {
    case "binom": { let k = 0; for (let i = 0; i < P.n; i++) if (Math.random() < P.p) k++; return k; }
    case "geom": { let k = 1; while (Math.random() >= P.p) k++; return k; }
    case "pois": { const L = Math.exp(-P.lam); let k = 0, prod = Math.random(); while (prod > L) { k++; prod *= Math.random(); } return k; }
    case "exp": return -Math.log(1 - u) / P.lam;
    default: return P.mu + P.sd * Math.sqrt(-2 * Math.log(1 - u)) * Math.cos(2 * Math.PI * Math.random());
  }
}

/** Adds k values of X to the sample; bars count each k, curves use BINS equal bins. */
function addSamples(P: Params, m: Model, S: Samples, k: number): Samples {
  const counts = [...S.counts];
  let sum = S.sum;
  for (let j = 0; j < k; j++) {
    const x = sampleOne(P);
    sum += x;
    const b = m.discrete ? x : Math.floor(((x - m.x0) / (m.x1 - m.x0)) * BINS);
    if (b >= 0 && b < counts.length) counts[b]++;
  }
  return { key: S.key, n: S.n + k, sum, counts };
}

const emptySamples = (P: Params, m: Model): Samples =>
  ({ key: paramKey(P), n: 0, sum: 0, counts: new Array(m.discrete ? m.kMax + 1 : BINS).fill(0) });

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function DistStage({ P, m, cut, onCut, compare, S, t }: {
  P: Params; m: Model; cut: number; onCut: (x: number) => void; compare: boolean; S: Samples; t?: TrackTranslations;
}) {
  const { discrete, mean, s, x0, x1 } = m;
  const pl = plot({ W, H: H - 24, x0, x1, y0: 0, y1: m.top * 1.2 });
  const c = cutOf(m, cut);
  const drag = useDrag<1>(() => 1, (_, q) => onCut(pl.inv(q).x));
  const yTop = (v: number) => Math.max(4, pl.Y(v));               // keeps a tall sample bar inside the plot

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ew-resize">
      <rect x={pl.X(mean - s)} y={0} width={Math.max(0, pl.X(mean + s) - pl.X(mean - s))} height={pl.Y(0)} fill={C.amber} opacity={0.1} />
      <line x1={0} x2={W} y1={pl.Y(0)} y2={pl.Y(0)} stroke={C.axis} strokeWidth={1.2} />
      {m.ticks.map(v => <T key={v} x={pl.X(v)} y={pl.Y(0) + 13} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
      {discrete ? m.bars.map(([k, pk]) => (
        <rect key={k} x={pl.X(k - 0.35)} y={pl.Y(pk)} width={0.7 * pl.sx} height={pl.Y(0) - pl.Y(pk)} rx={1.5}
          fill={k <= c ? C.green : C.blue} opacity={k <= c ? 0.75 : 0.55} />
      )) : <>
        <path d={shadeUnder(pl, m.dens, x0, c)} fill={C.green} opacity={0.3} />
        <path d={fnPath(pl, m.dens, x0, x1, 400)} fill="none" stroke={C.blue} strokeWidth={2.2} />
      </>}
      {P.dist === "binom" && compare && <>
        <path d={fnPath(pl, x => normPdf(x, mean, Math.max(s, 1e-3)), x0, x1, 300)} fill="none" stroke={C.purple} strokeWidth={1.8} />
        {m.bars.map(([k]) => <circle key={k} cx={pl.X(k)} cy={pl.Y(poisPmf(k, mean))} r={2.6} fill={C.pink} />)}
        <T x={W - 8} y={14} anchor="end" color={C.purple}>{tx(t, "figDist_normLbl", "normal, same μ and σ")}</T>
        <T x={W - 8} y={28} anchor="end" color={C.pink}>{tx(t, "figDist_poisLbl", "• Poisson, λ = np")}</T>
      </>}
      {/* the frequencies of the values drawn so far */}
      {S.n > 0 && <g pointerEvents="none">
        {discrete
          ? S.counts.map((cnt, k) => cnt > 0 && <line key={k} x1={pl.X(k - 0.42)} x2={pl.X(k + 0.42)} y1={yTop(cnt / S.n)} y2={yTop(cnt / S.n)} stroke={C.orange} strokeWidth={2.6} strokeLinecap="round" />)
          : <path d={histPath(pl, S, x0, x1, yTop)} fill="none" stroke={C.orange} strokeWidth={1.8} />}
      </g>}
      <line x1={pl.X(mean)} x2={pl.X(mean)} y1={8} y2={pl.Y(0)} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
      <T x={pl.X(mean) + 4} y={16} color={C.blue} bold>{"E[X]"}</T>
      <line x1={pl.X(discrete ? c + 0.5 : c)} x2={pl.X(discrete ? c + 0.5 : c)} y1={0} y2={pl.Y(0)} stroke={C.green} strokeWidth={1.5} />
    </svg>
  );
}

export function DistributionFigure({ t }: { t?: TrackTranslations }) {
  const [P, setP] = useState<Params>(START);
  const [cut, setCut] = useState(DEFAULT_CUT.binom);
  const [compare, setCompare] = useState(false);
  const [samples, setSamples] = useState<Samples | null>(null);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-distributions");
  const vis = useVisible<HTMLDivElement>();

  const m = model(P);
  // A sample belongs to the parameters it was drawn with; any change starts a fresh one.
  const S = samples && samples.key === paramKey(P) ? samples : emptySamples(P, m);
  const set = (patch: Partial<Params>) => setP(old => ({ ...old, ...patch }));
  const setDist = (d: Dist) => { set({ dist: d }); setCut(DEFAULT_CUT[d]); };
  /** A lab step's starting state. */
  const go = (patch: Partial<Params>, c: number, cmp = false) => { setPlaying(false); setP({ ...START, ...patch }); setCut(c); setCompare(cmp); setSamples(null); };

  // Each step draws about 15% more values than there are so far.
  const addDraws = () => {
    if (S.n >= MAX_DRAWS) return false;
    setSamples(addSamples(P, m, S, Math.max(1, Math.round(S.n * 0.15))));
    return true;
  };
  const acc = useRef(0);                              // time since the last step while playing
  useFrame(playing && (vis.on || lab.open), dt => {
    acc.current += dt;
    if (acc.current > 0.1) { acc.current = 0; if (!addDraws()) setPlaying(false); }
  });

  const { discrete, mean, vr, s } = m;
  const c = cutOf(m, cut);
  const below = m.cdf(c);
  const avg = S.n ? S.sum / S.n : null;

  const view = (
    <div>
      <DistStage P={P} m={m} cut={cut} onCut={setCut} compare={compare} S={S} t={t} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (S.n >= MAX_DRAWS) setSamples(null); setPlaying(v => !v); }}
        playLabel={tx(t, "figDist_keepDrawing", "keep drawing values of X")}
        onStep={() => { setPlaying(false); addDraws(); }}
        onReset={() => { setPlaying(false); setSamples(null); }}
        readout={avg === null
          ? tx(t, "figDist_none", "no values drawn yet")
          : `n = ${S.n} · x̄ = ${f2(avg, 3)}`} />
    </div>
  );
  const distChoice = <Choice value={P.dist} onChange={setDist} options={[
    ["binom", tx(t, "figDist_binom", "binomial")],
    ["geom", tx(t, "figDist_geom", "geometric")],
    ["pois", tx(t, "figDist_pois", "Poisson")],
    ["exp", tx(t, "figDist_exp", "exponential")],
    ["norm", tx(t, "figDist_norm", "normal")],
  ]} />;
  const formula =
    P.dist === "binom" ? `E = np = ${f2(mean)}   Var = np(1 − p) = ${f2(vr)}` :
    P.dist === "geom" ? `E = 1/p = ${f2(mean)}   Var = (1 − p)/p² = ${f2(vr)}` :
    P.dist === "pois" ? `E = λ = ${f2(mean)}   Var = λ = ${f2(vr)}` :
    P.dist === "exp" ? `E = 1/λ = ${f2(mean)}   Var = 1/λ² = ${f2(vr)}` : `E = μ = ${f2(mean)}   Var = σ² = ${f2(vr)}`;
  const sliders = <>
    {P.dist === "binom" && <Slider label={tx(t, "figDist_n", "trials n")} value={P.n} min={1} max={60} step={1} onChange={v => set({ n: v })} fmt={v => String(v)} />}
    {(P.dist === "binom" || P.dist === "geom") && <Slider label={tx(t, "figDist_p", "success p")} value={P.p} min={0.02} max={0.98} step={0.01} onChange={v => set({ p: v })} fmt={v => f2(v)} />}
    {(P.dist === "pois" || P.dist === "exp") && <Slider label={P.dist === "pois" ? tx(t, "figDist_lam", "mean count λ") : tx(t, "figDist_rate", "rate λ")} value={P.lam} min={0.2} max={P.dist === "pois" ? 15 : 4} step={0.1} onChange={v => set({ lam: v })} fmt={v => f2(v, 1)} />}
    {P.dist === "norm" && <>
      <Slider label={tx(t, "figDist_mu", "mean μ")} value={P.mu} min={-3} max={3} step={0.1} onChange={v => set({ mu: v })} fmt={v => f2(v, 1)} />
      <Slider label={tx(t, "figDist_sd", "st. dev. σ")} value={P.sd} min={0.3} max={2.5} step={0.05} onChange={v => set({ sd: v })} fmt={v => f2(v)} />
    </>}
    {P.dist === "binom" && <Row><Btn active={compare} onClick={() => setCompare(v => !v)}>{tx(t, "figDist_compare", "compare: normal + Poisson")}</Btn></Row>}
  </>;
  const readouts = <Row>
    <Readout color={C.blue}>{formula}</Readout>
    <Readout color={C.amber}>{`σ = ${f2(s)}`}</Readout>
    <Readout color={C.green}>{discrete ? `P(X ≤ ${c}) = ${f2(below, 4)}` : `P(X ≤ ${f2(c)}) = ${f2(below, 4)}`}</Readout>
  </Row>;
  const cutSlider = <Slider label={tx(t, "figDist_cut", "cut x")} value={discrete ? c : cut} min={discrete ? 0 : m.x0} max={discrete ? m.kMax : m.x1}
    step={discrete ? 1 : 0.01} onChange={setCut} fmt={v => discrete ? String(v) : f2(v)} />;
  const note = <>
    {tx(t, "figDist_note2", "Watch how the parameters move the mean (blue) and the spread (amber band, mean ± σ). The binomial becomes a symmetric bell as n grows unless p is near 0 or 1; the geometric and exponential always lean right, with their highest point at the start; the Poisson's mean and variance are the same number. Press ▶ to draw real values of X: their frequencies (orange) settle on the bars or the curve.")}{" "}
    <span data-mouse-only>{tx(t, "figDist_drag", "Drag in the plot to move the green cut.")}</span>
    <span data-touch-only>{tx(t, "figDist_dragTouch", "Drag in the plot to move the green cut.")}</span>
  </>;

  // ── Lab ──
  const is = (d: Dist) => P.dist === d;
  const np = P.n * P.p, npq = np * (1 - P.p);
  const gap = is("binom") ? poissonGap(P.n, P.p) : 1;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDistL1_t", "Guessing a quiz"),
      body: <>
        <p>{tx(t, "figDistL1_b1", "10 questions, 4 options each, every answer a guess: the number right is Binomial(10, 1/4). Passing needs 5 or more.")}</p>
        <p>{tx(t, "figDistL1_b2", "The green part is P(K ≤ cut). Move the cut so that what is left over, 1 minus the green, is the chance of passing.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL1_g", "Cut at 4, so P(K ≥ 5) = 1 − P(K ≤ 4) (now P(K ≤ {c}) = {v})."), { c, v: f2(below, 3) }), done: is("binom") && P.n === 10 && Math.abs(P.p - 0.25) < 0.005 && c === 4 },
      hint: tx(t, "figDistL1_h", "Drag the green line until the last green bar is k = 4. P(K ≤ 4) ≈ 0.922, so guessing passes with probability about 0.078."),
      setup: () => go({ n: 10, p: 0.25 }, 2),
    },
    {
      title: tx(t, "figDistL2_t", "The binomial becomes a bell"),
      body: <>
        <p>{tx(t, "figDistL2_b1", "The purple curve is the normal with the same mean np and variance np(1 − p). With n = 10 and p = 0.1 the bars lean to the left and the curve fits badly.")}</p>
        <p>{tx(t, "figDistL2_b2", "Change n and p until the bars sit under the bell.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL2_g", "np(1 − p) ≥ 10 (now {v})."), { v: f2(npq, 2) }), done: is("binom") && compare && npq >= 10 },
      hint: tx(t, "figDistL2_h", "The variance np(1 − p) is largest for p near 0.5. With p = 0.5 it is n/4, so n ≥ 40 is enough."),
      setup: () => go({ n: 10, p: 0.1 }, 1, true),
    },
    {
      title: tx(t, "figDistL3_t", "Poisson as a limit"),
      body: <>
        <p>{tx(t, "figDistL3_b1", "The pink dots are the Poisson with the same mean, λ = np. The chapter derived it as the binomial with many trials, each one rarely a success.")}</p>
        <p>{tx(t, "figDistL3_b2", "Keep the mean np near 3, but use many trials, so p becomes small. Watch the dots land on the bars.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL3_g", "n ≥ 50 with np between 2.8 and 3.2 (now n = {n}, np = {np}; largest gap {g})."), { n: P.n, np: f2(np, 2), g: f2(gap, 3) }), done: is("binom") && compare && P.n >= 50 && Math.abs(np - 3) <= 0.2 },
      hint: tx(t, "figDistL3_h", "p = 3/n: n = 50 with p = 0.06, or n = 60 with p = 0.05. The largest gap between bars and dots drops below 0.01."),
      setup: () => go({ n: 10, p: 0.3 }, 3, true),
    },
    {
      title: tx(t, "figDistL4_t", "Quick check"),
      body: <p>{tx(t, "figDistL4_b", "A help line gets on average 3 calls per hour, at random moments.")}</p>,
      quiz: {
        q: tx(t, "figDistL4_q", "Which Poisson describes the number of calls in 2 hours?"),
        options: ["Poisson(3)", "Poisson(6)", "Poisson(1.5)", "Poisson(9)"],
        answer: 1,
        why: tx(t, "figDistL4_w", "λ is the mean count for the period you actually look at. Two hours at 3 per hour give 6 calls on average, so λ = 6."),
      },
    },
    {
      title: tx(t, "figDistL5_t", "Waiting for a 6"),
      body: <>
        <p>{tx(t, "figDistL5_b1", "Roll a die until the first 6. The number of rolls is geometric with p = 1/6 ≈ 0.17.")}</p>
        <p>{tx(t, "figDistL5_b2", "Set p and find the chance that a 6 has come within 10 rolls.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL5_g", "p = 0.17 and the cut at 10 (now p = {p}, P(N ≤ {c}) = {v})."), { p: f2(P.p, 2), c, v: f2(below, 3) }), done: is("geom") && Math.abs(P.p - 0.17) < 0.005 && c === 10 },
      hint: tx(t, "figDistL5_h", "P(N ≤ 10) = 1 − 0.83¹⁰ ≈ 0.84. So in about 16% of games there is still no 6 after 10 rolls."),
      setup: () => go({ dist: "geom", p: 0.5 }, 3),
    },
    {
      title: tx(t, "figDistL6_t", "Roll it for real"),
      body: <>
        <p>{tx(t, "figDistL6_b1", "Now draw real games. Each value is the number of rolls one game needed; the orange marks are how often each number came up.")}</p>
        <p>{tx(t, "figDistL6_b2", "Step through a few with ⏭, then press ▶. Where does the average x̄ go?")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL6_g", "At least 2000 games (now {n}, x̄ = {a})."), { n: S.n, a: avg === null ? "–" : f2(avg, 2) }), done: is("geom") && S.n >= 2000 },
      focus: "play",
      setup: () => go({ dist: "geom", p: 0.17 }, 10),
    },
    {
      title: tx(t, "figDistL7_t", "The 97.5% point of the bell"),
      body: <>
        <p>{tx(t, "figDistL7_b1", "The standard normal, μ = 0 and σ = 1. The green area is Φ(x) = P(Z ≤ x).")}</p>
        <p>{tx(t, "figDistL7_b2", "Move the cut until 97.5% is green. Then 2.5% is left on each side of ±x, and 95% lies between.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL7_g", "P(Z ≤ x) between 0.973 and 0.977 (now x = {x}, {v})."), { x: f2(c, 2), v: f2(below, 4) }), done: is("norm") && Math.abs(P.mu) < 0.01 && Math.abs(P.sd - 1) < 0.01 &&Math.abs(below - 0.975) <= 0.002 },
      hint: tx(t, "figDistL7_h", "Just short of 2: x ≈ 1.96. That is where the \"95% within about 2σ\" rule comes from."),
      setup: () => go({ dist: "norm" }, 0),
    },
    {
      title: tx(t, "figDistL8_t", "The median wait"),
      body: <>
        <p>{tx(t, "figDistL8_b1", "The time until the next call is exponential with rate λ calls per hour. Its mean is 1/λ.")}</p>
        <p>{tx(t, "figDistL8_b2", "Set λ = 3 and find the median wait: the time with half of the area to its left.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDistL8_g", "λ = 3 and P(T ≤ t) = 0.5 (now λ = {l}, t = {x}, {v})."), { l: f2(P.lam, 1), x: f2(c, 2), v: f2(below, 3) }), done: is("exp") && Math.abs(P.lam - 3) < 0.05 && Math.abs(below - 0.5) <= 0.01 },
      hint: tx(t, "figDistL8_h", "t = ln 2 / 3 ≈ 0.23 h, about 14 minutes, while the mean is 1/3 h = 20 minutes: a few long waits pull the mean up."),
      setup: () => go({ dist: "exp", lam: 1 }, 1),
    },
    {
      title: tx(t, "figDistL9_t", "Quick check"),
      body: <p>{tx(t, "figDistL9_b", "A lamp's life is exponential with a mean of 1000 hours. It has already worked for 500 hours.")}</p>,
      quiz: {
        q: tx(t, "figDistL9_q", "What is the chance it lasts at least 1000 more hours?"),
        options: ["e⁻¹ ≈ 0.37", "e⁻¹·⁵ ≈ 0.22", "e⁻⁰·⁵ ≈ 0.61", "0.5"],
        answer: 0,
        why: tx(t, "figDistL9_w", "The exponential is memoryless: having lasted 500 hours changes nothing, so the answer is the same as for a new lamp, P(T > 1000) = e^(−1000/1000) = e⁻¹."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "poorFit", tone: "warn", when: is("binom") && compare && npq < 5,
      title: tx(t, "figDistI1_t", "The bell does not fit yet"),
      body: fill(tx(t, "figDistI1_b", "np(1 − p) = {v} is small: the bars lean to one side and the symmetric bell misses them. The normal approximation needs np(1 − p) of about 10 or more."), { v: f2(npq, 2) }),
    },
    {
      id: "poisFit", tone: "ok", when: is("binom") && compare && P.n >= 40 && P.p <= 0.08,
      title: tx(t, "figDistI2_t", "Binomial ≈ Poisson"),
      body: fill(tx(t, "figDistI2_b", "Many trials with a small p: the Poisson with λ = np = {np} matches every bar to within {g}."), { np: f2(np, 2), g: f2(gap, 3) }),
    },
    {
      id: "poisVar", tone: "info", when: is("pois"),
      title: tx(t, "figDistI3_t", "Mean and variance agree"),
      body: fill(tx(t, "figDistI3_b", "For the Poisson both are λ = {l}, so σ = √λ = {s}: the more events you expect, the wider the spread in absolute terms, but the narrower relative to the mean."), { l: f2(P.lam, 1), s: f2(s, 2) }),
    },
    {
      id: "median", tone: "info", when: is("exp") && Math.abs(below - 0.5) <= 0.02,
      title: tx(t, "figDistI4_t", "Median below the mean"),
      body: fill(tx(t, "figDistI4_b", "Half the waits are shorter than {x}, yet the mean is {m}: the long right tail pulls the mean up. The median is ln 2/λ, about 0.69 of the mean."), { x: f2(c, 2), m: f2(mean, 2) }),
    },
    {
      id: "settled", tone: "ok", when: avg !== null && S.n >= 2000 && Math.abs(avg - mean) < 0.05 * Math.max(1, s),
      title: tx(t, "figDistI5_t", "The sample matches the formula"),
      body: fill(tx(t, "figDistI5_b", "After {n} values the average is {a}, close to E[X] = {m}, and the orange frequencies sit on the shape the formula predicts."), { n: S.n, a: f2(avg ?? 0, 3), m: f2(mean, 3) }),
    },
  ];

  const title = tx(t, "figDist_title", "The common distributions");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{distChoice}<LabButton lab={lab} t={t} /></>}
        controls={<>{sliders}{readouts}</>}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{distChoice}</Row>{sliders}{cutSlider}{readouts}</>}
        recap={[
          tx(t, "figDistR1", "Binomial: successes in n independent trials; it turns into a bell when np(1 − p) is large."),
          tx(t, "figDistR2", "Poisson: the binomial with many trials and a small p, λ = np; mean and variance are both λ."),
          tx(t, "figDistR3", "Geometric and exponential: waiting times; they lean right, and having waited changes nothing."),
          tx(t, "figDistR4", "Normal: 95% lies within 1.96σ of the mean; any normal is read from Φ after z = (x − μ)/σ."),
          tx(t, "figDistR5", "Drawing many values of X reproduces the shape: a distribution is a long-run frequency."),
        ]}
      />
    </>
  );
}

/** Closed region under f from a to b. */
function shadeUnder(p: Plot, f: (x: number) => number, a: number, b: number) {
  if (b <= a) return "";
  let d = `M${p.X(a).toFixed(1)},${p.Y(0).toFixed(1)}`;
  for (let i = 0; i <= 160; i++) { const x = a + ((b - a) * i) / 160; d += `L${p.X(x).toFixed(1)},${p.Y(f(x)).toFixed(1)}`; }
  return d + `L${p.X(b).toFixed(1)},${p.Y(0).toFixed(1)}Z`;
}

/** Outline of the sample histogram, scaled to a density so it sits on the curve. */
function histPath(p: Plot, S: Samples, x0: number, x1: number, yTop: (v: number) => number) {
  const bw = (x1 - x0) / BINS;
  let d = `M${p.X(x0).toFixed(1)},${p.Y(0).toFixed(1)}`;
  S.counts.forEach((cnt, b) => {
    const y = yTop(cnt / (S.n * bw)).toFixed(1);
    d += `L${p.X(x0 + b * bw).toFixed(1)},${y}L${p.X(x0 + (b + 1) * bw).toFixed(1)},${y}`;
  });
  return d + `L${p.X(x1).toFixed(1)},${p.Y(0).toFixed(1)}`;
}
