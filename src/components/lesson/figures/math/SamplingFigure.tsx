"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, plot, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// "Sample means": pick a population (its shape is drawn small at the top),
// draw many samples of size n and plot the histogram of their means. Whatever
// the population's shape, the histogram approaches the normal curve with mean
// μ and standard deviation σ/√n (purple): the central limit theorem, and the
// square-root law for the spread of averages.
// "Confidence intervals": samples of size n from a population with μ = 50 and
// σ = 10; each sample gives the interval x̄ ± z·σ/√n, drawn as a line. Lines
// that miss μ are red. About the chosen confidence level of them catch it.

type Mode = "clt" | "ci";
type Pop = "uniform" | "die" | "skewed" | "twoPeaks";
const W = 560, H = 270, TOP = 64, BIN = 0.05, MAX_MEANS = 20000;

const gauss = () => { const u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const normPdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

const POPS: Record<Pop, { mu: number; sd: number; draw: () => number; pdf?: (x: number) => number }> = {
  uniform: { mu: 5, sd: 10 / Math.sqrt(12), draw: () => 10 * Math.random(), pdf: x => (x >= 0 && x <= 10 ? 0.1 : 0) },
  die: { mu: 3.5, sd: Math.sqrt(35 / 12), draw: () => 1 + Math.floor(6 * Math.random()) },
  skewed: { mu: 2, sd: 2, draw: () => -2 * Math.log(1 - Math.random()), pdf: x => (x >= 0 ? 0.5 * Math.exp(-x / 2) : 0) },
  twoPeaks: { mu: 5, sd: Math.sqrt(0.49 + 9), draw: () => (Math.random() < 0.5 ? 2 : 8) + 0.7 * gauss(), pdf: x => 0.5 * normPdf(x, 2, 0.7) + 0.5 * normPdf(x, 8, 0.7) },
};
const LEVELS: [string, number][] = [["80%", 1.2816], ["90%", 1.6449], ["95%", 1.96], ["99%", 2.5758]];

function sampleMean(draw: () => number, n: number) { let s = 0; for (let i = 0; i < n; i++) s += draw(); return s / n; }
function manyMeans(draw: () => number, n: number, k: number) { const out: number[] = []; for (let j = 0; j < k; j++) out.push(sampleMean(draw, n)); return out; }

export function SamplingFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setModeRaw] = useState<Mode>("clt");
  const [pop, setPopRaw] = useState<Pop>("skewed");
  const [n, setNRaw] = useState(5);
  const [means, setMeans] = useState<number[]>([]);
  const [ci, setCi] = useState<number[]>([]);
  const [level, setLevel] = useState("95%");

  const setMode = (m: Mode) => { setModeRaw(m); setMeans([]); setCi([]); };
  const setPop = (p: Pop) => { setPopRaw(p); setMeans([]); };
  const setN = (v: number) => { setNRaw(v); setMeans([]); setCi([]); };

  const P = POPS[pop], se = P.sd / Math.sqrt(n);
  const add = (k: number) => setMeans(m => (m.length >= MAX_MEANS ? m : [...m, ...manyMeans(P.draw, n, k)]));
  const addCi = () => setCi(c => [...c, ...manyMeans(() => 50 + 10 * gauss(), n, 20)].slice(-100));

  // ── Sample-means view ──
  // Bins about a third of the standard error wide. Die averages are multiples of 1/n, so their
  // bins are whole multiples of 1/n centred on those values; otherwise some bins would catch two
  // possible averages and their neighbours none.
  const bin = pop === "die" ? Math.ceil((se / 3) * n) / n : Math.max(BIN, se / 3);
  const origin = pop === "die" ? -bin / 2 : 0;
  const bins = new Array(Math.ceil((10.5 - origin) / bin)).fill(0);
  means.forEach(v => { const i = Math.floor((v - origin) / bin); if (i >= 0 && i < bins.length) bins[i]++; });
  const hMax = Math.max(normPdf(P.mu, P.mu, se), ...bins.map(c => c / ((means.length || 1) * bin)));
  const pm = plot({ W, H: H - TOP - 18, x0: -0.3, x1: 10.3, y0: 0, y1: hMax * 1.15 });
  const mMean = means.length ? means.reduce((a, b) => a + b, 0) / means.length : 0;
  const mSd = means.length > 1 ? Math.sqrt(means.reduce((a, v) => a + (v - mMean) ** 2, 0) / (means.length - 1)) : 0;
  const pp = plot({ W, H: TOP - 12, x0: -0.3, x1: 10.3, y0: 0, y1: pop === "twoPeaks" ? 0.32 : pop === "skewed" ? 0.55 : 0.2 });

  // ── Confidence-interval view ──
  const z = LEVELS.find(l => l[0] === level)![1], half = (z * 10) / Math.sqrt(n);
  const pc = plot({ W, H, x0: 30, x1: 70, y0: 0, y1: 1 });
  const hits = ci.filter(m => Math.abs(m - 50) <= half).length;

  return (
    <Figure
      title={tx(t, "figSamp_title", "Sampling: averages and confidence intervals")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["clt", tx(t, "figSamp_clt", "sample means")],
        ["ci", tx(t, "figSamp_ci", "confidence intervals")],
      ]} />}
      controls={<>
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
            <Btn onClick={() => add(1)}>{tx(t, "figSamp_one", "1 sample")}</Btn>
            <Btn onClick={() => add(500)}>{tx(t, "figSamp_many", "500 samples")}</Btn>
            <Btn onClick={() => setMeans([])}>{tx(t, "figSamp_reset", "reset")}</Btn>
          </> : <>
            <Btn onClick={addCi}>{tx(t, "figSamp_twenty", "20 more samples")}</Btn>
            <Btn onClick={() => setCi([])}>{tx(t, "figSamp_reset", "reset")}</Btn>
          </>}
        </Row>
        <Row>
          {mode === "clt" ? <>
            <Readout>{`${tx(t, "figSamp_count", "means drawn")}: ${means.length}`}</Readout>
            <Readout color={C.blue}>{`μ = ${f2(P.mu)}  ${tx(t, "figSamp_avgMeans", "mean of x̄")} = ${f2(mMean)}`}</Readout>
            <Readout color={C.purple}>{`σ/√n = ${f2(P.sd)}/√${n} = ${f2(se)}  ${tx(t, "figSamp_sdMeans", "SD of x̄")} = ${f2(mSd)}`}</Readout>
          </> : <>
            <Readout color={C.blue}>{`x̄ ± ${f2(z)} · 10/√${n} = x̄ ± ${f2(half)}`}</Readout>
            <Readout color={C.green}>{`${tx(t, "figSamp_hits", "catch μ = 50")}: ${hits}/${ci.length}${ci.length ? ` = ${f2((100 * hits) / ci.length, 0)}%` : ""}`}</Readout>
          </>}
        </Row>
      </>}
      note={mode === "clt"
        ? tx(t, "figSamp_noteClt", "With n = 1 the histogram of means is just the population. Raise n and it narrows by the factor √n and turns into a bell, even for the skewed and two-peaked populations. The purple curve is the normal with mean μ and standard deviation σ/√n that the central limit theorem predicts.")
        : tx(t, "figSamp_noteCi", "Every sample gives a different interval; μ = 50 is fixed. At 95% about 5 lines in 100 miss (red). A higher level makes every interval wider; a larger n makes them all narrower, by the factor √n.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {mode === "clt" ? <>
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
            <T x={8} y={12} color={C.blue}>{tx(t, "figSamp_meansLbl", "histogram of sample means x̄")}</T>
          </g>
        </> : <>
          {ci.map((m, i) => {
            const y = 10 + i * ((H - 30) / 100), miss = Math.abs(m - 50) > half;
            return <g key={i}>
              <line x1={pc.X(m - half)} x2={pc.X(m + half)} y1={y} y2={y} stroke={miss ? C.red : C.green} strokeWidth={1.6} opacity={0.85} />
              <circle cx={pc.X(m)} cy={y} r={1.4} fill={miss ? C.red : C.fg} />
            </g>;
          })}
          <line x1={pc.X(50)} x2={pc.X(50)} y1={0} y2={H - 16} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
          {[30, 40, 50, 60, 70].map(v => <T key={v} x={pc.X(v)} y={H - 4} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
          <T x={pc.X(50) + 4} y={H - 18} color={C.blue} bold>{"μ = 50"}</T>
        </>}
      </svg>
    </Figure>
  );
}
