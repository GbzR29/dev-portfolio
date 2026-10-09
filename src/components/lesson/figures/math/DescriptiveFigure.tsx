"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, useDrag, clamp, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A small data set on a 0–100 scale, drawn three ways: a histogram (top, bin
// width on a slider), the raw values as dots (middle, draggable), and a box
// plot of the five-number summary (bottom). The blue line is the mean, the
// green line the median, the amber band mean ± s. Quartiles are the medians
// of the lower and upper halves (leaving out the middle value when n is
// odd), as in the chapter; dots beyond the 1.5·IQR fences are drawn red.
// The lab: drag a value to pull the mean but not the median, make an
// outlier, read the skewed set, hide two groups with wide bins.

const SETS: Record<string, number[]> = {
  scores: [52, 61, 64, 68, 70, 73, 75, 81, 95],
  skewed: [8, 10, 11, 12, 13, 14, 15, 17, 19, 22, 26, 33, 45, 70],
  bimodal: [18, 22, 24, 25, 27, 29, 30, 66, 69, 71, 72, 74, 77, 80],
};
type SetKey = keyof typeof SETS;
const W = 560, PAD = 24, HIST = 110, DOTS = 60, BOX = 56, H = HIST + DOTS + BOX + 24;
const X = (v: number) => PAD + (v / 100) * (W - 2 * PAD);
const V = (x: number) => ((x - PAD) / (W - 2 * PAD)) * 100;

function median(s: number[]) { const n = s.length, m = n >> 1; return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

/** Five-number summary with quartiles as medians of the halves (middle value left out when n is odd). */
function summary(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b), n = s.length, h = n >> 1;
  return { min: s[0], q1: median(s.slice(0, h)), med: median(s), q3: median(s.slice(n % 2 ? h + 1 : h)), max: s[n - 1] };
}

/** Everything the drawing and the readouts need. */
function stats(xs: number[]) {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const s = Math.sqrt(xs.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  const q = summary(xs), iqr = q.q3 - q.q1, lo = q.q1 - 1.5 * iqr, hi = q.q3 + 1.5 * iqr;
  const outliers = xs.filter(v => v < lo || v > hi);
  return { n, mean, s, q, iqr, lo, hi, outliers };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function DescriptiveStage({ xs, bin, onMove, t }: {
  xs: number[]; bin: number; onMove: (i: number, v: number) => void; t?: TrackTranslations;
}) {
  const { mean, s, q, lo, hi } = stats(xs);
  const inside = xs.filter(v => v >= lo && v <= hi);
  const wLo = Math.min(...inside), wHi = Math.max(...inside);

  // Histogram counts; the tallest bar sets the scale.
  const nb = Math.ceil(100 / bin), counts = new Array(nb).fill(0);
  xs.forEach(v => counts[Math.min(nb - 1, Math.floor(v / bin))]++);
  const cMax = Math.max(...counts);

  // Stack equal values in the dot plot so none hide behind another.
  const seen = new Map<number, number>();
  const dots = xs.map((v, i) => { const k = Math.round(v); const lvl = seen.get(k) ?? 0; seen.set(k, lvl + 1); return { v, i, lvl }; });

  const drag = useDrag<number>(
    p => {
      if (p.y < HIST || p.y > HIST + DOTS) return null;
      let best = -1, bd = 12;
      xs.forEach((v, i) => { const d = Math.abs(X(v) - p.x); if (d < bd) { bd = d; best = i; } });
      return best < 0 ? null : best;
    },
    (i, p) => onMove(i, Math.round(clamp(V(p.x), 0, 100))),
  );

  const yB = HIST + DOTS + 14, bh = 22;
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ew-resize">
      <rect x={X(mean - s)} y={4} width={Math.max(0, X(mean + s) - X(mean - s))} height={HIST + DOTS - 4} fill={C.amber} opacity={0.1} />
      {/* histogram */}
      {counts.map((c, i) => c > 0 && (
        <rect key={i} x={X(i * bin) + 0.5} y={HIST - 6 - (c / cMax) * (HIST - 24)} width={Math.max(0, X(Math.min(100, (i + 1) * bin)) - X(i * bin) - 1)}
          height={(c / cMax) * (HIST - 24)} fill={C.purple} opacity={0.45} />
      ))}
      <line x1={PAD} x2={W - PAD} y1={HIST - 6} y2={HIST - 6} stroke={C.axis} strokeWidth={1} />
      {/* dots */}
      <line x1={PAD} x2={W - PAD} y1={HIST + DOTS - 10} y2={HIST + DOTS - 10} stroke={C.axis} strokeWidth={1} />
      {[0, 20, 40, 60, 80, 100].map(v => <T key={v} x={X(v)} y={HIST + DOTS + 1} anchor="middle" color={C.axis} size={8.5}>{v}</T>)}
      {dots.map(d => <circle key={d.i} cx={X(d.v)} cy={HIST + DOTS - 17 - d.lvl * 9} r={4}
        fill={d.v < lo || d.v > hi ? C.red : C.fg} opacity={drag.dragging === d.i ? 1 : 0.75} />)}
      <line x1={X(mean)} x2={X(mean)} y1={8} y2={yB + bh + 4} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" />
      <T x={X(mean) + 4} y={16} color={C.blue} bold>{"x̄"}</T>
      <line x1={X(q.med)} x2={X(q.med)} y1={8} y2={HIST + DOTS - 10} stroke={C.green} strokeWidth={1.5} strokeDasharray="2 3" />
      <T x={X(q.med) - 4} y={28} anchor="end" color={C.green} bold>{tx(t, "figDesc_medLbl", "median")}</T>
      {/* box plot */}
      <line x1={X(wLo)} x2={X(q.q1)} y1={yB + bh / 2} y2={yB + bh / 2} stroke={C.fg} strokeWidth={1.2} />
      <line x1={X(q.q3)} x2={X(wHi)} y1={yB + bh / 2} y2={yB + bh / 2} stroke={C.fg} strokeWidth={1.2} />
      {[wLo, wHi].map((v, i) => <line key={i} x1={X(v)} x2={X(v)} y1={yB + 5} y2={yB + bh - 5} stroke={C.fg} strokeWidth={1.2} />)}
      <rect x={X(q.q1)} y={yB} width={Math.max(0, X(q.q3) - X(q.q1))} height={bh} fill={C.green} fillOpacity={0.15} stroke={C.green} strokeWidth={1.4} />
      <line x1={X(q.med)} x2={X(q.med)} y1={yB} y2={yB + bh} stroke={C.green} strokeWidth={2.4} />
      {xs.filter(v => v < lo || v > hi).map((v, i) => <circle key={i} cx={X(v)} cy={yB + bh / 2} r={3.5} fill="none" stroke={C.red} strokeWidth={1.5} />)}
      <T x={X(q.q1)} y={yB + bh + 13} anchor="middle" color={C.muted} size={8.5}>{"Q1"}</T>
      <T x={X(q.q3)} y={yB + bh + 13} anchor="middle" color={C.muted} size={8.5}>{"Q3"}</T>
    </svg>
  );
}

export function DescriptiveFigure({ t }: { t?: TrackTranslations }) {
  const [set, setSetRaw] = useState<SetKey | "">("scores");
  const [xs, setXs] = useState<number[]>(SETS.scores);
  const [bin, setBin] = useState(10);
  const lab = useLab("math-descriptive");
  const setSet = (k: SetKey) => { setSetRaw(k); setXs(SETS[k]); };
  const move = (i: number, v: number) => { setSetRaw(""); setXs(old => old.map((x, j) => (j === i ? v : x))); };

  const { n, mean, s, q, iqr, lo, hi, outliers } = stats(xs);
  const gap = mean - q.med;
  // Data within 5 of the mean: none means the mean sits in an empty gap.
  const nearMean = xs.filter(v => Math.abs(v - mean) <= 5).length;

  const view = <DescriptiveStage xs={xs} bin={bin} onMove={move} t={t} />;
  const setChoice = <Choice value={set as SetKey} onChange={setSet} options={[
    ["scores", tx(t, "figDesc_scores", "test scores")],
    ["skewed", tx(t, "figDesc_skewed", "skewed")],
    ["bimodal", tx(t, "figDesc_bimodal", "two groups")],
  ]} />;
  const controls = <>
    <Slider label={tx(t, "figDesc_bin", "bin width")} value={bin} min={2} max={25} step={1} onChange={setBin} fmt={v => String(v)} />
    <Row>
      <Btn onClick={() => { setSetRaw(""); setXs(v => [...v, 99]); }}>{tx(t, "figDesc_addHigh", "add a value at 99")}</Btn>
      <Btn onClick={() => { setSetRaw(""); setXs(v => (v.length > 3 ? v.slice(0, -1) : v)); }}>{tx(t, "figDesc_remove", "remove last")}</Btn>
    </Row>
    <Row>
      <Readout>{`n = ${n}`}</Readout>
      <Readout color={C.blue}>{`x̄ = ${f2(mean, 1)}`}</Readout>
      <Readout color={C.green}>{`${tx(t, "figDesc_median", "median")} = ${f2(q.med, 1)}`}</Readout>
      <Readout color={C.amber}>{`s = ${f2(s, 1)}`}</Readout>
      <Readout>{`Q1 = ${f2(q.q1, 1)}  Q3 = ${f2(q.q3, 1)}  IQR = ${f2(iqr, 1)}`}</Readout>
    </Row>
  </>;
  const note = <>
    {tx(t, "figDesc_note", "Drag one dot far to the right: the mean and s follow it, the median and the box barely move. That is what \"resistant\" means. In the skewed set the mean sits to the right of the median, pulled by the long tail. With two groups the mean lands in the gap where almost no data are, and the histogram, not the summary numbers, shows what is going on. Changing the bin width can hide or invent bumps.")}{" "}
    <span data-mouse-only>{tx(t, "figDesc_drag", "Drag the dots in the middle strip.")}</span>
    <span data-touch-only>{tx(t, "figDesc_dragTouch", "Drag the dots in the middle strip.")}</span>
  </>;

  // ── Lab ──
  const gapTxt = f2(Math.abs(gap), 1);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDescL1_t", "Pull the mean"),
      body: <>
        <p>{tx(t, "figDescL1_b1", "Nine test scores. The blue line is the mean x̄, the balance point; the green line is the median, the middle score once they are sorted.")}</p>
        <p>{tx(t, "figDescL1_b2", "Drag one score far away and watch which line follows it.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDescL1_g", "Mean and median at least 4 apart (now {d})."), { d: gapTxt }), done: Math.abs(gap) >= 4 },
      hint: tx(t, "figDescL1_h", "Drag the lowest score, 52, all the way to the left. The median stays at 70: the middle score is still the same one."),
      setup: () => setSet("scores"),
    },
    {
      title: tx(t, "figDescL2_t", "Quick check"),
      body: <p>{tx(t, "figDescL2_b", "The mean uses the size of every value; the median only uses their order.")}</p>,
      quiz: {
        q: tx(t, "figDescL2_q", "Nine people earn 10 and one earns 100. What are the mean and the median?"),
        options: [
          tx(t, "figDescL2_o1", "mean 19, median 10"),
          tx(t, "figDescL2_o2", "mean 10, median 10"),
          tx(t, "figDescL2_o3", "mean 19, median 19"),
          tx(t, "figDescL2_o4", "mean 55, median 10"),
        ],
        answer: 0,
        why: tx(t, "figDescL2_w", "Mean = (9 · 10 + 100)/10 = 190/10 = 19. Sorted, positions 5 and 6 are both 10, so the median is 10. 55 is the average of the smallest and largest value, which is not the mean."),
      },
    },
    {
      title: tx(t, "figDescL3_t", "Make an outlier"),
      body: <>
        <p>{tx(t, "figDescL3_b1", "The fences sit 1.5 IQR outside the box: Q1 − 1.5 · IQR on the left, Q3 + 1.5 · IQR on the right. A value beyond a fence is drawn red, as a separate dot past the whisker.")}</p>
        <p>{fill(tx(t, "figDescL3_b2", "Here the fences are {lo} and {hi}. Push one score past a fence."), { lo: f2(lo, 1), hi: f2(hi, 1) })}</p>
      </>,
      goal: { text: tx(t, "figDescL3_g", "At least one red dot."), done: outliers.length > 0 },
      hint: tx(t, "figDescL3_h", "The right fence is above 100, so go left: drag 52 below about 39."),
      setup: () => setSet("scores"),
    },
    {
      title: tx(t, "figDescL4_t", "A long tail"),
      body: <>
        <p>{tx(t, "figDescL4_b1", "Waiting times, incomes and house prices bunch up at small values and trail off to the right.")}</p>
        <p>{tx(t, "figDescL4_b2", "Pick the skewed set and compare the two lines.")}</p>
      </>,
      goal: { text: tx(t, "figDescL4_g", "The skewed set is shown."), done: set === "skewed" },
    },
    {
      title: tx(t, "figDescL5_t", "Quick check"),
      body: <p>{tx(t, "figDescL5_b", "In the skewed set the few large values pull the mean to the right of the median.")}</p>,
      quiz: {
        q: tx(t, "figDescL5_q", "In a country the mean monthly income is 3800 and the median is 2600. What shape is the income histogram?"),
        options: [
          tx(t, "figDescL5_o1", "skewed to the right"),
          tx(t, "figDescL5_o2", "skewed to the left"),
          tx(t, "figDescL5_o3", "symmetric"),
          tx(t, "figDescL5_o4", "you cannot say anything"),
        ],
        answer: 0,
        why: tx(t, "figDescL5_w", "The mean is well above the median, so a tail of large incomes pulls it up: skewed to the right. In a symmetric histogram they would be about equal; with a left tail the mean would be the smaller one."),
      },
    },
    {
      title: tx(t, "figDescL6_t", "Bins can hide things"),
      body: <>
        <p>{tx(t, "figDescL6_b1", "Two groups, one around 25 and one around 72. The mean lands in the empty gap between them, where nobody is.")}</p>
        <p>{tx(t, "figDescL6_b2", "Widen the bins until the histogram no longer shows the gap.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDescL6_g", "Two groups with bin width ≥ 24 (now {b})."), { b: bin }), done: set === "bimodal" && bin >= 24 },
      hint: tx(t, "figDescL6_h", "With width 24 a bin runs from 48 to 72 and catches both edges of the gap."),
      setup: () => { setSet("bimodal"); setBin(10); },
    },
    {
      title: tx(t, "figDescL7_t", "Quick check"),
      body: <p>{tx(t, "figDescL7_b", "Adding the same number to every value slides the whole picture sideways.")}</p>,
      quiz: {
        q: tx(t, "figDescL7_q", "Every test score gets 5 bonus points. What happens to s and the IQR?"),
        options: [
          tx(t, "figDescL7_o1", "both stay the same"),
          tx(t, "figDescL7_o2", "both grow by 5"),
          tx(t, "figDescL7_o3", "s grows by 5, the IQR stays"),
          tx(t, "figDescL7_o4", "both are multiplied by 5"),
        ],
        answer: 0,
        why: tx(t, "figDescL7_w", "Every value, the mean and the quartiles move by 5, so every deviation xᵢ − x̄ and the distance Q3 − Q1 stay as they were. Spread only changes when values are multiplied."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "pulled", tone: "info", when: set !== "bimodal" && Math.abs(gap) >= 4,
      title: tx(t, "figDescI1_t", "Mean pulled away"),
      body: fill(gap > 0
        ? tx(t, "figDescI1_r", "The mean is {d} to the right of the median: a few large values drag it, the median only cares about the middle of the order.")
        : tx(t, "figDescI1_l", "The mean is {d} to the left of the median: a few small values drag it, the median only cares about the middle of the order."), { d: gapTxt }),
    },
    {
      id: "outlier", tone: "warn", when: outliers.length > 0,
      title: tx(t, "figDescI2_t", "Possible outlier"),
      body: fill(tx(t, "figDescI2_b", "{v} lies beyond a fence ({lo} or {hi}). Check it before trusting the mean and s: it could be a typo or the most interesting value in the data."),
        { v: outliers.join(", "), lo: f2(lo, 1), hi: f2(hi, 1) }),
    },
    {
      id: "gap", tone: "warn", when: nearMean === 0,
      title: tx(t, "figDescI3_t", "Nobody is average"),
      body: fill(tx(t, "figDescI3_b", "No value lies within 5 of the mean {m}. The data are two groups, and one number for the centre describes neither of them, whether it is the mean or the median."), { m: f2(mean, 1) }),
    },
    {
      id: "fine", tone: "info", when: bin <= 3,
      title: tx(t, "figDescI4_t", "Bins too narrow"),
      body: tx(t, "figDescI4_b", "Almost every bar holds a single value, so the histogram is just the dots again, with random bumps. Wider bins show the shape."),
    },
    {
      id: "hidden", tone: "warn", when: set === "bimodal" && bin >= 24,
      title: tx(t, "figDescI5_t", "The gap is gone"),
      body: tx(t, "figDescI5_b", "With wide bins the two groups merge into one broad lump. The dots still show the gap: always try a few bin widths."),
    },
  ];

  const title = tx(t, "figDesc_title", "Centre, spread and the box plot");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{setChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{setChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figDescR1", "The mean follows every value; the median only depends on the order, so outliers barely move it."),
          tx(t, "figDescR2", "A tail of large values puts the mean to the right of the median."),
          tx(t, "figDescR3", "Values beyond Q1 − 1.5 IQR or Q3 + 1.5 IQR are possible outliers, drawn as separate dots."),
          tx(t, "figDescR4", "Bin width changes what a histogram shows: too narrow is noise, too wide hides groups."),
        ]}
      />
    </>
  );
}
