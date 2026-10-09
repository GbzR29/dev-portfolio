"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Choice, C, T, plot, fnPath, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { normPdf } from "./distMath";

// ── What this figure shows ────────────────────────────────────────────────────
// "Sample means": pick a population (its shape is drawn small at the top),
// draw many samples of size n and plot the histogram of their means. Whatever
// the population's shape, the histogram approaches the normal curve with mean
// μ and standard deviation σ/√n (purple): the central limit theorem, and the
// square-root law for the spread of averages. The Transport draws the means,
// about 15% more at each step; the newest one is the orange mark.
// "Confidence intervals": samples of size n from a population with μ = 50 and
// σ = 10; each sample gives the interval x̄ ± z·σ/√n, drawn as a line. Lines
// that miss μ are red. About the chosen confidence level of them catch it.
// The Transport draws one sample, so one interval, per step, up to 100.
// The lab: the population copied, averages turn into a bell, σ/√n, two peaks,
// intervals catching μ, the price of 99% confidence.

type Mode = "clt" | "ci";
type Pop = "uniform" | "die" | "skewed" | "twoPeaks";
const W = 560, H = 270, TOP = 64, BIN = 0.05, MAX_MEANS = 20000, MAX_CI = 100;

const gauss = () => { const u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const POPS: Record<Pop, { mu: number; sd: number; draw: () => number; pdf?: (x: number) => number }> = {
  uniform: { mu: 5, sd: 10 / Math.sqrt(12), draw: () => 10 * Math.random(), pdf: x => (x >= 0 && x <= 10 ? 0.1 : 0) },
  die: { mu: 3.5, sd: Math.sqrt(35 / 12), draw: () => 1 + Math.floor(6 * Math.random()) },
  skewed: { mu: 2, sd: 2, draw: () => -2 * Math.log(1 - Math.random()), pdf: x => (x >= 0 ? 0.5 * Math.exp(-x / 2) : 0) },
  twoPeaks: { mu: 5, sd: Math.sqrt(0.49 + 9), draw: () => (Math.random() < 0.5 ? 2 : 8) + 0.7 * gauss(), pdf: x => 0.5 * normPdf(x, 2, 0.7) + 0.5 * normPdf(x, 8, 0.7) },
};
const LEVELS: [string, number][] = [["80%", 1.2816], ["90%", 1.6449], ["95%", 1.96], ["99%", 2.5758]];
const CI_MU = 50, CI_SD = 10;

function sampleMean(draw: () => number, n: number) { let s = 0; for (let i = 0; i < n; i++) s += draw(); return s / n; }
function manyMeans(draw: () => number, n: number, k: number) { const out: number[] = []; for (let j = 0; j < k; j++) out.push(sampleMean(draw, n)); return out; }

/** Mean and sample standard deviation of the means drawn so far. */
function spread(xs: number[]) {
  const mean = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const sd = xs.length > 1 ? Math.sqrt(xs.reduce((a, v) => a + (v - mean) ** 2, 0) / (xs.length - 1)) : 0;
  return { mean, sd };
}

// ── The drawing ───────────────────────────────────────────────────────────────

function MeansStage({ pop, n, means, t }: { pop: Pop; n: number; means: number[]; t?: TrackTranslations }) {
  const P = POPS[pop], se = P.sd / Math.sqrt(n);
  // Bins about a third of the standard error wide. Die averages are multiples of 1/n, so their
  // bins are whole multiples of 1/n centred on those values; otherwise some bins would catch two
  // possible averages and their neighbours none.
  const bin = pop === "die" ? Math.ceil((se / 3) * n) / n : Math.max(BIN, se / 3);
  const origin = pop === "die" ? -bin / 2 : 0;
  const bins = new Array(Math.ceil((10.5 - origin) / bin)).fill(0);
  means.forEach(v => { const i = Math.floor((v - origin) / bin); if (i >= 0 && i < bins.length) bins[i]++; });
  const hMax = Math.max(normPdf(P.mu, P.mu, se), ...bins.map(c => c / ((means.length || 1) * bin)));
  const pm = plot({ W, H: H - TOP - 18, x0: -0.3, x1: 10.3, y0: 0, y1: hMax * 1.15 });
  const pp = plot({ W, H: TOP - 12, x0: -0.3, x1: 10.3, y0: 0, y1: pop === "twoPeaks" ? 0.32 : pop === "skewed" ? 0.55 : 0.2 });
  const last = means.length ? means[means.length - 1] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <T x={8} y={12} color={C.muted}>{tx(t, "figSamp_popLbl", "population")}</T>
      {P.pdf
        ? <path d={fnPath(pp, P.pdf, -0.3, 10.3, 300)} transform="translate(0 6)" fill="none" stroke={C.muted} strokeWidth={1.5} />
        : [1, 2, 3, 4, 5, 6].map(k => <rect key={k} x={pp.X(k - 0.2)} y={6 + pp.Y(1 / 6)} width={0.4 * pp.sx} height={pp.Y(0) - pp.Y(1 / 6)} fill={C.muted} opacity={0.5} />)}
      <g transform={`translate(0 ${TOP})`}>
        {bins.map((c, i) => c > 0 && <rect key={i} x={pm.X(origin + i * bin)} y={pm.Y(c / (means.length * bin))} width={Math.max(0.5, bin * pm.sx - 0.5)}
          height={pm.Y(0) - pm.Y(c / (means.length * bin))} fill={C.blue} opacity={0.55} />)}
        <path d={fnPath(pm, x => normPdf(x, P.mu, se), -0.3, 10.3, 400)} fill="none" stroke={C.purple} strokeWidth={1.8} />
        <line x1={0} x2={W} y1={pm.Y(0)} y2={pm.Y(0)} stroke={C.axis} strokeWidth={1.2} />
        {[0, 2, 4, 6, 8, 10].map(v => <T key={v} x={pm.X(v)} y={pm.Y(0) + 12} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
        <line x1={pm.X(P.mu)} x2={pm.X(P.mu)} y1={0} y2={pm.Y(0)} stroke={C.blue} strokeWidth={1.2} strokeDasharray="5 4" />
        {last !== null && <path d={`M${pm.X(last)},${pm.Y(0) - 1}l-5,-9h10z`} fill={C.orange} />}
        <T x={8} y={12} color={C.blue}>{tx(t, "figSamp_meansLbl", "histogram of sample means x̄")}</T>
      </g>
    </svg>
  );
}

function IntervalStage({ ci, half }: { ci: number[]; half: number }) {
  const pc = plot({ W, H, x0: 30, x1: 70, y0: 0, y1: 1 });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {ci.map((m, i) => {
        const y = 10 + i * ((H - 30) / MAX_CI), miss = Math.abs(m - CI_MU) > half, newest = i === ci.length - 1;
        return <g key={i}>
          <line x1={pc.X(m - half)} x2={pc.X(m + half)} y1={y} y2={y} stroke={miss ? C.red : C.green} strokeWidth={newest ? 2.8 : 1.6} opacity={newest ? 1 : 0.85} />
          <circle cx={pc.X(m)} cy={y} r={newest ? 2.4 : 1.4} fill={miss ? C.red : C.fg} />
        </g>;
      })}
      <line x1={pc.X(CI_MU)} x2={pc.X(CI_MU)} y1={0} y2={H - 16} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
      {[30, 40, 50, 60, 70].map(v => <T key={v} x={pc.X(v)} y={H - 4} anchor={v === 30 ? "start" : v === 70 ? "end" : "middle"} color={C.axis} size={8.5}>{v}</T>)}
      <T x={pc.X(CI_MU) + 4} y={H - 18} color={C.blue} bold>{"μ = 50"}</T>
    </svg>
  );
}

export function SamplingFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setModeRaw] = useState<Mode>("clt");
  const [pop, setPopRaw] = useState<Pop>("skewed");
  const [n, setNRaw] = useState(5);
  const [means, setMeans] = useState<number[]>([]);
  const [ci, setCi] = useState<number[]>([]);
  const [level, setLevel] = useState("95%");
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-sampling");
  const vis = useVisible<HTMLDivElement>();

  const setMode = (m: Mode) => { setPlaying(false); setModeRaw(m); setMeans([]); setCi([]); };
  const setPop = (p: Pop) => { setPlaying(false); setPopRaw(p); setMeans([]); };
  const setN = (v: number) => { setNRaw(v); setMeans([]); setCi([]); };
  /** A lab step's starting state. */
  const go = (m: Mode, p: Pop, nn: number, lv = "95%") => { setPlaying(false); setModeRaw(m); setPopRaw(p); setNRaw(nn); setLevel(lv); setMeans([]); setCi([]); };

  const P = POPS[pop], se = P.sd / Math.sqrt(n);
  const z = LEVELS.find(l => l[0] === level)![1], half = (z * CI_SD) / Math.sqrt(n);
  const hits = ci.filter(m => Math.abs(m - CI_MU) <= half).length;
  const { mean: mMean, sd: mSd } = spread(means), nm = means.length;

  // One step: about 15% more sample means, or one more interval.
  const advance = () => {
    if (mode === "clt") {
      if (means.length >= MAX_MEANS) return false;
      setMeans([...means, ...manyMeans(P.draw, n, Math.max(1, Math.round(means.length * 0.15)))]);
    } else {
      if (ci.length >= MAX_CI) return false;
      setCi([...ci, sampleMean(() => CI_MU + CI_SD * gauss(), n)]);
    }
    return true;
  };
  const full = mode === "clt" ? means.length >= MAX_MEANS : ci.length >= MAX_CI;
  const clear = () => { setMeans([]); setCi([]); };
  const acc = useRef(0);                              // time since the last step while playing
  useFrame(playing && (vis.on || lab.open), dt => {
    acc.current += dt;
    if (acc.current > (mode === "clt" ? 0.1 : 0.12)) { acc.current = 0; if (!advance()) setPlaying(false); }
  });

  const view = (
    <div>
      {mode === "clt" ? <MeansStage pop={pop} n={n} means={means} t={t} /> : <IntervalStage ci={ci} half={half} />}
      <Transport t={t} playing={playing}
        onPlay={() => { if (full) clear(); setPlaying(v => !v); }}
        playLabel={mode === "clt" ? tx(t, "figSamp_keepMeans", "keep drawing samples") : tx(t, "figSamp_keepCi", "keep drawing intervals")}
        onStep={() => { setPlaying(false); advance(); }}
        onReset={() => { setPlaying(false); clear(); }}
        readout={mode === "clt"
          ? (means.length ? `${means.length} x̄ · ${tx(t, "figSamp_last", "last")} ${f2(means[means.length - 1])}` : tx(t, "figSamp_none", "no samples yet"))
          : (ci.length ? `${hits}/${ci.length} ${tx(t, "figSamp_catch", "catch μ")}` : tx(t, "figSamp_none", "no samples yet"))} />
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["clt", tx(t, "figSamp_clt", "sample means")],
    ["ci", tx(t, "figSamp_ci", "confidence intervals")],
  ]} />;
  const controls = <>
    {mode === "clt" && <Row><Choice value={pop} onChange={setPop} options={[
      ["uniform", tx(t, "figSamp_uniform", "uniform")],
      ["die", tx(t, "figSamp_die", "die")],
      ["skewed", tx(t, "figSamp_skewed", "skewed")],
      ["twoPeaks", tx(t, "figSamp_twoPeaks", "two peaks")],
    ]} /></Row>}
    {mode === "ci" && <Row><Choice value={level} onChange={setLevel} options={LEVELS.map(l => [l[0], l[0]] as const)} /></Row>}
    <Slider label={tx(t, "figSamp_n", "sample size n")} value={n} min={1} max={60} step={1} onChange={setN} fmt={v => String(v)} />
    <Row>
      {mode === "clt" ? <>
        <Readout color={C.blue}>{`μ = ${f2(P.mu)}  ${tx(t, "figSamp_avgMeans", "mean of x̄")} = ${nm ? f2(mMean) : "–"}`}</Readout>
        <Readout color={C.purple}>{`σ/√n = ${f2(P.sd)}/√${n} = ${f2(se)}  ${tx(t, "figSamp_sdMeans", "SD of x̄")} = ${nm > 1 ? f2(mSd) : "–"}`}</Readout>
      </> : <>
        <Readout color={C.blue}>{`x̄ ± ${f2(z)} · 10/√${n} = x̄ ± ${f2(half)}`}</Readout>
        <Readout color={C.green}>{`${tx(t, "figSamp_hits", "catch μ = 50")}: ${hits}/${ci.length}${ci.length ? ` = ${f2((100 * hits) / ci.length, 0)}%` : ""}`}</Readout>
      </>}
    </Row>
  </>;
  const note = mode === "clt"
    ? tx(t, "figSamp_noteClt2", "Press ▶ to draw samples; each one adds its mean x̄ to the histogram (the newest is the orange mark). With n = 1 the histogram of means is just the population. Raise n and it narrows by the factor √n and turns into a bell, even for the skewed and two-peaked populations. The purple curve is the normal with mean μ and standard deviation σ/√n that the central limit theorem predicts.")
    : tx(t, "figSamp_noteCi2", "Press ▶ to draw samples; each one gives its own interval. μ = 50 is fixed. At 95% about 5 lines in 100 miss (red). A higher level makes every interval wider; a larger n makes them all narrower, by the factor √n.");

  // ── Lab ──
  const clt = mode === "clt";
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSampL1_t", "A sample of one"),
      body: <>
        <p>{tx(t, "figSampL1_b1", "The population at the top is skewed: most values are small, a few are large. Its mean is μ = 2 and its standard deviation σ = 2.")}</p>
        <p>{tx(t, "figSampL1_b2", "With n = 1 each sample is a single value, so its \"mean\" is that value. Press ▶ and compare the histogram with the population.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL1_g", "At least 500 samples of size 1 (now {k})."), { k: nm }), done: clt && pop === "skewed" && n === 1 && nm >= 500 },
      focus: "play",
      setup: () => go("clt", "skewed", 1),
    },
    {
      title: tx(t, "figSampL2_t", "Average a few"),
      body: <>
        <p>{tx(t, "figSampL2_b1", "Now each sample has n values and the histogram collects their averages. Changing n starts a new histogram.")}</p>
        <p>{tx(t, "figSampL2_b2", "Raise n to 30 or more, then draw. What happens to the long right tail?")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL2_g", "n ≥ 30 and at least 1000 sample means (now n = {n}, {k} means)."), { n, k: nm }), done: clt && pop === "skewed" && n >= 30 && nm >= 1000 },
      hint: tx(t, "figSampL2_h", "The averages pile up around μ = 2 in a symmetric bell: a large value in a sample is balanced by the many small ones next to it."),
      setup: () => go("clt", "skewed", 1),
    },
    {
      title: tx(t, "figSampL3_t", "The square-root law"),
      body: <>
        <p>{tx(t, "figSampL3_b1", "The spread of x̄ is the standard error σ/√n. Here σ = 2.")}</p>
        <p>{tx(t, "figSampL3_b2", "Find the n that makes the standard error exactly 0.5, then draw to check it against the measured SD of x̄.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL3_g", "σ/√n = 0.5 and at least 1000 means (now σ/√n = {s}, measured {m})."), { s: f2(se), m: nm > 1 ? f2(mSd) : "–" }), done: clt && pop === "skewed" && n === 16 && nm >= 1000 },
      hint: tx(t, "figSampL3_h", "2/√n = 0.5 means √n = 4, so n = 16. Four times as precise as one value needs sixteen values."),
      setup: () => go("clt", "skewed", 4),
    },
    {
      title: tx(t, "figSampL4_t", "Quick check"),
      body: <p>{tx(t, "figSampL4_b", "A poll of 400 people has a standard error of 2.5 percentage points.")}</p>,
      quiz: {
        q: tx(t, "figSampL4_q", "How many people are needed to halve it to 1.25 points?"),
        options: ["800", "1600", "200", "565"],
        answer: 1,
        why: tx(t, "figSampL4_w", "The standard error is σ/√n. Halving it needs √n twice as large, so n four times as large: 4 · 400 = 1600."),
      },
    },
    {
      title: tx(t, "figSampL5_t", "Even two peaks"),
      body: <>
        <p>{tx(t, "figSampL5_b1", "This population has two humps, at 2 and 8, and almost nothing at its mean 5.")}</p>
        <p>{tx(t, "figSampL5_b2", "Try n = 2 first: an average of two values can be low-low, low-high or high-high. Then raise n until the averages form one bell.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL5_g", "n ≥ 10 and at least 1000 means (now n = {n}, {k} means)."), { n, k: nm }), done: clt && pop === "twoPeaks" && n >= 10 && nm >= 1000 },
      hint: tx(t, "figSampL5_h", "At n = 2 there are three humps, at 2, 5 and 8. By n = 10 the mixture of highs and lows is so even that one bell centred on 5 remains."),
      setup: () => go("clt", "twoPeaks", 1),
    },
    {
      title: tx(t, "figSampL6_t", "Intervals that catch μ"),
      body: <>
        <p>{tx(t, "figSampL6_b1", "Now the population has μ = 50 and σ = 10. Each sample of n = 10 gives x̄ and the 95% interval x̄ ± 1.96 · 10/√10.")}</p>
        <p>{tx(t, "figSampL6_b2", "Draw 100 samples. μ never moves; the intervals do. How many of them catch it?")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL6_g", "100 intervals (now {k}, {h} catch μ)."), { k: ci.length, h: hits }), done: mode === "ci" && level === "95%" && ci.length >= MAX_CI },
      focus: "play",
      setup: () => go("ci", "skewed", 10),
    },
    {
      title: tx(t, "figSampL7_t", "The price of 99%"),
      body: <>
        <p>{tx(t, "figSampL7_b1", "Switch to 99%: every interval stretches, because z* grows from 1.96 to 2.576.")}</p>
        <p>{tx(t, "figSampL7_b2", "Keep 99% confidence but bring the margin of error down to 4 or less by sampling more.")}</p>
      </>,
      goal: { text: fill(tx(t, "figSampL7_g", "99% with a margin of at most 4 (now {l}, margin {e})."), { l: level, e: f2(half) }), done: mode === "ci" && level === "99%" && half <= 4 },
      hint: tx(t, "figSampL7_h", "2.576 · 10/√n ≤ 4 means √n ≥ 6.44, so n ≥ 42. At 95% the same margin needs only n = 25."),
      setup: () => go("ci", "skewed", 10),
    },
    {
      title: tx(t, "figSampL8_t", "Quick check"),
      body: <p>{tx(t, "figSampL8_b", "50 bolts give the 95% interval 10.06 to 10.34 mm for the mean length μ.")}</p>,
      quiz: {
        q: tx(t, "figSampL8_q", "Which statement is right?"),
        options: [
          tx(t, "figSampL8_o1", "There is a 95% chance that μ lies between 10.06 and 10.34."),
          tx(t, "figSampL8_o2", "95% of intervals made this way contain μ."),
          tx(t, "figSampL8_o3", "95% of the bolts are between 10.06 and 10.34 mm."),
          tx(t, "figSampL8_o4", "The next sample's x̄ will be in this interval with probability 0.95."),
        ],
        answer: 1,
        why: tx(t, "figSampL8_w", "μ is a fixed number, so this interval either contains it or not. The 95% belongs to the method, as the 100 lines showed. The interval is about the mean, not about single bolts."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "copy", tone: "info", when: clt && n === 1 && nm >= 200,
      title: tx(t, "figSampI1_t", "The histogram copies the population"),
      body: tx(t, "figSampI1_b", "A sample of one value has that value as its mean, so the means are just draws from the population, with the same shape and the same spread σ."),
    },
    {
      id: "lean", tone: "warn", when: clt && pop === "skewed" && n >= 2 && n < 10 && nm >= 500,
      title: tx(t, "figSampI2_t", "Still leaning right"),
      body: fill(tx(t, "figSampI2_b", "With n = {n} the averages are narrower but still lopsided: for a strongly skewed population the bell needs about 30 values."), { n }),
    },
    {
      id: "humps", tone: "info", when: clt && pop === "twoPeaks" && n === 2 && nm >= 500,
      title: tx(t, "figSampI3_t", "Three humps"),
      body: tx(t, "figSampI3_b", "Two lows average near 2, two highs near 8, and one of each near 5, which happens half the time. That is why the middle hump is the tallest."),
    },
    {
      id: "sdMatch", tone: "ok", when: clt && n > 1 && nm >= 1000 && Math.abs(mSd - se) < 0.05 * se,
      title: tx(t, "figSampI4_t", "σ/√n, measured"),
      body: fill(tx(t, "figSampI4_b", "The {k} means have a standard deviation of {m}, against σ/√n = {s} from the formula."), { k: nm, m: f2(mSd, 3), s: f2(se, 3) }),
    },
    {
      id: "rate", tone: "ok", when: mode === "ci" && ci.length >= MAX_CI,
      title: tx(t, "figSampI5_t", "The method's success rate"),
      body: fill(tx(t, "figSampI5_b", "{h} of the 100 intervals caught μ, close to the promised {l}. Draw again and the count changes a little: the level is a long-run rate."), { h: hits, l: level }),
    },
    {
      id: "low", tone: "warn", when: mode === "ci" && level === "80%" && ci.length >= 30,
      title: tx(t, "figSampI6_t", "Narrow, but often wrong"),
      body: tx(t, "figSampI6_b", "At 80% the intervals are short, but one in five misses μ. Confidence and precision pull in opposite directions; only a larger n improves both."),
    },
  ];

  const title = tx(t, "figSamp_title", "Sampling: averages and confidence intervals");
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
          tx(t, "figSampR1", "With n = 1 the sample means are the population; averaging narrows and smooths them."),
          tx(t, "figSampR2", "The spread of x̄ is σ/√n: four times the data for twice the precision."),
          tx(t, "figSampR3", "Whatever the population's shape, averages of enough values form a normal bell (the central limit theorem)."),
          tx(t, "figSampR4", "A 95% interval comes from a method that catches μ in 95% of samples; any single interval either does or does not."),
          tx(t, "figSampR5", "Higher confidence widens the interval; a larger n narrows it."),
        ]}
      />
    </>
  );
}
