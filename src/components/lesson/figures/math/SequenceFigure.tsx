"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Btn, Row, Readout, Slider, Sliders, C, T, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The first terms of an arithmetic sequence (add d each step) or a geometric
// one (multiply by r each step) as bars, with the running sum S_n as an
// optional amber line. Arithmetic terms grow by a constant step, so the bars
// rise like a ramp; geometric terms grow (or shrink) by a constant factor.
// With |r| < 1 the sums level off toward a₁ / (1 − r).
// The Transport builds the sequence one term at a time; the lab walks through
// both kinds, a convergent series and a divergent one.

type Mode = "arith" | "geo";
const N = 12;
const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : Math.abs(v) >= 1e5 ? v.toExponential(1) : +v.toFixed(3)).toString().replace("-", "−");
const near = (u: number, w: number) => Math.abs(u - w) < 1e-6;

export function SequenceFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("arith");
  const [a1, setA1] = useState(1);
  const [d, setD] = useState(2);
  const [r, setR] = useState(0.5);
  const [sums, setSums] = useState(true);
  const [k, setK] = useState(N);                    // terms shown so far
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("math-sequences");
  const vis = useVisible<HTMLDivElement>();

  useEffect(() => {
    if (!playing || !(vis.on || lab.open)) return;
    if (k >= N) { setPlaying(false); return; }
    const id = setTimeout(() => setK(k + 1), scaledMs(450, speed));
    return () => clearTimeout(id);
  }, [playing, k, speed, vis.on, lab.open]);

  const pick = (m: Mode) => { setMode(m); setPlaying(false); setK(N); };
  const terms = Array.from({ length: N }, (_, i) => (mode === "arith" ? a1 + i * d : a1 * r ** i));
  const partial = terms.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);
  const shown = sums ? [...terms, ...partial] : terms;
  const top = Math.max(1, ...shown), bot = Math.min(0, ...shown);

  const W = 560, H = 250, L = 36, R = 16, TOP = 14, BOT = 26;
  const bw = (W - L - R) / N;
  const Y = (v: number) => TOP + ((top - v) / (top - bot)) * (H - TOP - BOT);
  const limit = mode === "geo" && Math.abs(r) < 1 ? a1 / (1 - r) : NaN;

  const nth = mode === "arith" ? `aₙ = ${n(a1)} + (n − 1)·${n(d)}` : `aₙ = ${n(a1)} · ${n(r)}ⁿ⁻¹`;
  const S = partial[N - 1];
  const sumText = mode === "arith"
    ? `S₁₂ = 12·(${n(terms[0])} + ${n(terms[N - 1])})/2 = ${n(S)}`
    : Math.abs(r - 1) < 1e-9 ? `S₁₂ = 12·${n(a1)} = ${n(S)}` : `S₁₂ = ${n(a1)}·(1 − ${n(r)}¹²)/(1 − ${n(r)}) = ${n(S)}`;

  const stage = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1.2} />
        <T x={L - 6} y={Y(top) + 4} size={8.5} anchor="end" color={C.axis}>{n(top)}</T>
        {bot < 0 && <T x={L - 6} y={Y(bot) + 4} size={8.5} anchor="end" color={C.axis}>{n(bot)}</T>}
        {Number.isFinite(limit) && sums && <>
          <line x1={L} x2={W - R} y1={Y(limit)} y2={Y(limit)} stroke={C.green} strokeDasharray="5 4" />
          <T x={W - R} y={Y(limit) - 5} size={9} anchor="end" color={C.green}>{`${tx(t, "figSeq_limit", "limit")} ${n(limit)}`}</T>
        </>}
        {terms.map((v, i) => {
          const x = L + i * bw + bw * 0.18, y = Math.min(Y(v), Y(0)), h = Math.abs(Y(v) - Y(0));
          return (
            <g key={i} opacity={i < k ? 1 : 0.12} style={{ transition: "opacity 0.3s ease" }}>
              <rect x={x} y={y} width={bw * 0.64} height={Math.max(h, 0.5)} rx={2} fill={v >= 0 ? C.sky : C.red} fillOpacity={0.5} stroke={v >= 0 ? C.sky : C.red} />
              <T x={x + bw * 0.32} y={H - 8} size={8.5} anchor="middle" color={C.muted}>{i + 1}</T>
            </g>
          );
        })}
        {sums && k > 0 && <>
          <polyline points={partial.slice(0, k).map((s, i) => `${L + (i + 0.5) * bw},${Y(s)}`).join(" ")} fill="none" stroke={C.amber} strokeWidth={2} />
          {partial.slice(0, k).map((s, i) => <circle key={i} cx={L + (i + 0.5) * bw} cy={Y(s)} r={3} fill={C.amber} />)}
        </>}
      </svg>
      <Transport t={t} speed playing={playing}
        onPlay={() => { if (playing) { setPlaying(false); return; } if (k >= N) setK(1); setPlaying(true); }}
        playLabel={tx(t, "figSeq_play", "add the terms one by one")}
        onStep={k < N ? () => { setPlaying(false); setK(k + 1); } : undefined}
        onBack={k > 1 ? () => { setPlaying(false); setK(k - 1); } : undefined}
        onReset={() => { setPlaying(false); setK(1); }}
        readout={`S${String(k).split("").map(c => "₀₁₂₃₄₅₆₇₈₉"[+c]).join("")} = ${n(partial[k - 1])}`} />
    </div>
  );

  const head = <>
    <Choice value={mode} onChange={pick} options={[["arith", tx(t, "figSeq_arith", "arithmetic")], ["geo", tx(t, "figSeq_geo", "geometric")]] as const} />
    <Btn active={sums} onClick={() => setSums(v => !v)}>{tx(t, "figSeq_sums", "running sum")}</Btn>
  </>;
  const controls = <>
    <Sliders>
      <Slider label="a₁" value={a1} min={-3} max={5} step={0.5} onChange={setA1} fmt={n} />
      {mode === "arith"
        ? <Slider label="d" value={d} min={-2} max={3} step={0.5} onChange={setD} fmt={n} />
        : <Slider label="r" value={r} min={-1.2} max={1.4} step={0.05} onChange={setR} fmt={n} />}
    </Sliders>
    <Row>
      <Readout color={C.sky}>{nth}</Readout>
      <Readout color={C.amber}>{sumText}</Readout>
      {Number.isFinite(limit) && <Readout color={C.green}>{`S∞ = ${n(a1)}/(1 − ${n(r)}) = ${n(limit)}`}</Readout>}
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSeqL1_t", "Odd numbers, one by one"),
      body: <>
        <p>{tx(t, "figSeqL1_b1", "a₁ = 1 and d = 2 give 1, 3, 5, 7, …: the odd numbers. The amber line is the running total.")}</p>
        <p>{tx(t, "figSeqL1_b2", "Play it and read the totals: 1, 4, 9, 16… Do you recognise them?")}</p>
      </>,
      goal: { text: tx(t, "figSeqL1_g", "Add all 12 terms."), done: mode === "arith" && a1 === 1 && d === 2 && k === N },
      focus: "play",
      setup: () => { pick("arith"); setA1(1); setD(2); setSums(true); setK(1); },
    },
    {
      title: tx(t, "figSeqL2_t", "Quick check"),
      body: <p>{tx(t, "figSeqL2_b", "From the first term to the n-th there are n − 1 steps.")}</p>,
      quiz: {
        q: tx(t, "figSeqL2_q", "5, 8, 11, 14, … What is the 10th term?"),
        options: ["32", "35", "30", "50"],
        answer: 0,
        why: tx(t, "figSeqL2_w", "a₁ = 5, d = 3, and 9 steps: 5 + 9 · 3 = 32. Using 10 steps instead of 9 gives the classic wrong answer 35."),
      },
    },
    {
      title: tx(t, "figSeqL3_t", "Going down"),
      body: <p>{tx(t, "figSeqL3_b", "Make d negative and start high, so that the terms cross zero. Watch the running total turn round.")}</p>,
      goal: { text: tx(t, "figSeqL3_g", "A falling sequence that goes below 0."), done: mode === "arith" && d < 0 && terms.some(v => v < 0) },
      setup: () => { pick("arith"); setA1(1); setD(1); },
    },
    {
      title: tx(t, "figSeqL4_t", "Halving forever"),
      body: <p>{tx(t, "figSeqL4_b", "Geometric now: a₁ = 1, r = 0.5 gives 1, ½, ¼, … Play it and watch the total creep towards the green line.")}</p>,
      goal: { text: tx(t, "figSeqL4_g", "Add all 12 terms of 1, ½, ¼, …"), done: mode === "geo" && a1 === 1 && near(r, 0.5) && k === N },
      focus: "play",
      setup: () => { pick("geo"); setA1(1); setR(0.5); setSums(true); setK(1); },
    },
    {
      title: tx(t, "figSeqL5_t", "Quick check"),
      body: <p>{tx(t, "figSeqL5_b", "Use a/(1 − r).")}</p>,
      quiz: {
        q: "1 + ⅓ + ⅑ + … = ?",
        options: ["1.5", "∞", "1.33", "3"],
        answer: 0,
        why: tx(t, "figSeqL5_w", "a = 1 and r = ⅓, so the sum is 1/(1 − ⅓) = 1/(⅔) = 1.5."),
      },
    },
    {
      title: tx(t, "figSeqL6_t", "Break it: r above 1"),
      body: <p>{tx(t, "figSeqL6_b", "Drag r above 1. What happens to the green limit line?")}</p>,
      goal: { text: tx(t, "figSeqL6_g", "Make r bigger than 1."), done: mode === "geo" && r > 1 + 1e-6 },
      setup: () => { pick("geo"); setA1(1); setR(0.8); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "squares", tone: "ok", when: mode === "arith" && a1 === 1 && d === 2 && k >= 3,
      title: tx(t, "figSeqI1_t", "Square numbers"),
      body: fill(tx(t, "figSeqI1_b", "The sum of the first {k} odd numbers is {s} = {k}². With the formula: {k} · (1 + {l})/2 = {s}."), { k, s: n(partial[k - 1]), l: n(terms[k - 1]) }),
    },
    {
      id: "conv", tone: "ok", when: mode === "geo" && Math.abs(r) < 1 && sums,
      title: tx(t, "figSeqI2_t", "The sum levels off"),
      body: fill(tx(t, "figSeqI2_b", "|r| < 1, so each term is a fixed fraction of the one before and rⁿ shrinks to 0. The totals approach a₁/(1 − r) = {lim} but never pass it."), { lim: n(limit) }),
    },
    {
      id: "div", tone: "warn", when: mode === "geo" && Math.abs(r) >= 1,
      title: tx(t, "figSeqI3_t", "No limit"),
      body: tx(t, "figSeqI3_b", "With |r| ≥ 1 the terms never shrink, so the total grows without end (or swings back and forth): the series diverges and a₁/(1 − r) means nothing."),
    },
    {
      id: "alt", tone: "info", when: mode === "geo" && r < 0,
      title: tx(t, "figSeqI4_t", "Alternating signs"),
      body: tx(t, "figSeqI4_b", "A negative ratio flips the sign at every step: the bars go up, down, up… and the total zig-zags around its limit."),
    },
  ];

  const title = tx(t, "figSeq_title", "Sequences and their sums");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{head}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={mode === "arith"
          ? tx(t, "figSeq_noteArith", "Each bar is one term; each is d more than the one before, so the tops lie on a straight line. The amber line is the running total a₁ + a₂ + … + aₙ. It curves upward because every new term is bigger than the last (for d > 0), and its value after 12 terms is 12 times the average of the first and last term.")
          : tx(t, "figSeq_noteGeo", "Each bar is r times the one before. With r > 1 the bars explode; with 0 < r < 1 they shrink toward zero and the running total levels off at the green limit a₁/(1 − r); with a negative r the bars alternate in sign. Try r = 0.5 with a₁ = 1: the sums approach 2, the classic 1 + ½ + ¼ + … = 2.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{head}</Row>{controls}</>}
        recap={[
          tx(t, "figSeqR1", "Arithmetic: add d each step, aₙ = a₁ + (n − 1)d; the sum is n times the average of the first and last term."),
          tx(t, "figSeqR2", "Geometric: multiply by r each step, aₙ = a₁rⁿ⁻¹."),
          tx(t, "figSeqR3", "With |r| < 1 the infinite sum is a₁/(1 − r); with |r| ≥ 1 there is no finite sum."),
        ]}
      />
    </>
  );
}
