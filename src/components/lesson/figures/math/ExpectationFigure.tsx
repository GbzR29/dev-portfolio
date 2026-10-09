"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Choice, C, T, plot, useDrag, useFrame, useVisible, clamp, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A pmf on the values 0 … 8 drawn as weights on a see-saw. The mean
// E[X] = Σ x p(x) is the point where the board balances: the triangle under
// it is the fulcrum. The amber band is μ ± σ, one standard deviation each
// side: the variance is the p-weighted average of the squared distances
// (x − μ)², and σ is its square root. Drag any bar up or down; the
// probabilities are rescaled so they always add to 1. The Transport draws real
// values of X, more at each step; the green diamond x̄ is the average of all
// the values drawn so far, and it settles on μ: the long-run average.
// The lab: move the balance point, the long-run average, same mean with a
// different spread, a small far weight, a certain X with σ = 0.

const XS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const PRESETS: Record<string, number[]> = {
  die: [0, 1, 1, 1, 1, 1, 1, 0, 0],
  loaded: [0, 1, 1, 1, 1, 1, 5, 0, 0],
  split: [3, 1, 0, 0, 0, 0, 0, 1, 3],
  peak: [0, 0, 0, 1, 6, 1, 0, 0, 0],
};
type Preset = keyof typeof PRESETS;
type Draws = { n: number; sum: number };
const W = 560, H = 250, BASE = 190, MAX_DRAWS = 100000;

/** Probabilities, mean, E[X²], variance and σ of the weights. */
function stats(w: number[]) {
  const total = w.reduce((s, v) => s + v, 0) || 1;
  const p = w.map(v => v / total);
  const mu = XS.reduce((s, x, i) => s + x * p[i], 0);
  const ex2 = XS.reduce((s, x, i) => s + x * x * p[i], 0);
  const vr = Math.max(0, ex2 - mu * mu);
  return { p, mu, ex2, vr, sd: Math.sqrt(vr) };
}

/** Adds k values of X drawn from p (inverse CDF) to the running total. */
function draw(p: number[], d: Draws, k: number): Draws {
  let sum = d.sum;
  for (let j = 0; j < k; j++) {
    let u = Math.random(), i = 0;
    while (i < 8 && u >= p[i]) { u -= p[i]; i++; }
    sum += XS[i];
  }
  return { n: d.n + k, sum };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function ExpStage({ w, onEdit, avg }: { w: number[]; onEdit: (f: (old: number[]) => number[]) => void; avg: number | null }) {
  const { p, mu, sd } = stats(w);
  const top = Math.max(0.3, ...p) * 1.15;
  const pl = plot({ W, H: BASE, x0: -0.8, x1: 8.8, y0: 0, y1: top });

  const drag = useDrag<number>(
    q => { const i = Math.round(pl.inv(q).x); return i >= 0 && i <= 8 && q.y < BASE + 20 ? i : null; },
    (i, q) => {
      // Set bar i so that its new probability is the dragged height, keeping the others' ratios.
      const want = clamp(pl.inv(q).y, 0, 0.95);
      onEdit(old => {
        const rest = old.reduce((s, v, j) => (j === i ? s : s + v), 0);
        const next = [...old];
        next[i] = rest === 0 ? 1 : (want * rest) / (1 - want);
        return next;
      });
    },
  );

  const fx = pl.X(mu);
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-ns-resize">
      <rect x={pl.X(mu - sd)} y={8} width={Math.max(0, pl.X(mu + sd) - pl.X(mu - sd))} height={BASE - 8} fill={C.amber} opacity={0.12} />
      {XS.map((x, i) => {
        const y = pl.Y(p[i]);
        return <g key={x}>
          <rect x={pl.X(x - 0.32)} y={y} width={0.64 * pl.sx} height={BASE - y} fill={C.blue} opacity={0.75} rx={2} />
          {p[i] > 0.004 && <T x={pl.X(x)} y={y - 5} anchor="middle" color={C.blue} size={8.5}>{f2(p[i])}</T>}
          <T x={pl.X(x)} y={BASE + 30} anchor="middle" color={C.axis} size={9}>{x}</T>
        </g>;
      })}
      {/* the see-saw board and the fulcrum under the mean */}
      <rect x={pl.X(-0.5)} y={BASE} width={pl.X(8.5) - pl.X(-0.5)} height={5} fill={C.muted} opacity={0.6} rx={2} />
      <path d={`M${fx},${BASE + 5} L${fx - 11},${BASE + 22} L${fx + 11},${BASE + 22} Z`} fill={C.blue} />
      <T x={fx} y={BASE + 44} anchor="middle" color={C.blue} bold>{`μ = ${f2(mu)}`}</T>
      <T x={pl.X(mu + sd) + 4} y={20} color={C.amber}>{"μ + σ"}</T>
      <T x={pl.X(mu - sd) - 4} y={20} anchor="end" color={C.amber}>{"μ − σ"}</T>
      {/* the running average of the values drawn so far */}
      {avg !== null && <g pointerEvents="none">
        <path d={`M${pl.X(avg)},${BASE - 9} l7,7 l-7,7 l-7,-7 Z`} fill={C.green} stroke="white" strokeWidth={1} />
        <T x={pl.X(avg)} y={BASE - 14} anchor="middle" color={C.green} bold>{"x̄"}</T>
      </g>}
    </svg>
  );
}

export function ExpectationFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState<number[]>(PRESETS.die);
  const [preset, setPresetRaw] = useState<Preset | "">("die");
  const [draws, setDraws] = useState<Draws>({ n: 0, sum: 0 });
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-expectation");
  const vis = useVisible<HTMLDivElement>();

  const clearDraws = () => { setPlaying(false); setDraws({ n: 0, sum: 0 }); };
  const setPreset = (k: Preset) => { setPresetRaw(k); setW(PRESETS[k]); clearDraws(); };
  const onEdit = (f: (old: number[]) => number[]) => { setPresetRaw(""); setW(f); clearDraws(); };
  const { p, mu, ex2, vr, sd } = stats(w);

  // Each step draws about 15% more values than there are so far: 1, 1, 1, … then faster and faster.
  const addDraws = () => {
    if (draws.n >= MAX_DRAWS) return false;
    setDraws(draw(p, draws, Math.max(1, Math.round(draws.n * 0.15))));
    return true;
  };
  const acc = useRef(0);                              // time since the last step while playing
  useFrame(playing && (vis.on || lab.open), dt => {
    acc.current += dt;
    if (acc.current > 0.1) { acc.current = 0; if (!addDraws()) setPlaying(false); }
  });
  const avg = draws.n ? draws.sum / draws.n : null;

  const view = (
    <div>
      <ExpStage w={w} onEdit={onEdit} avg={avg} />
      <Transport t={t} playing={playing}
        onPlay={() => { if (draws.n >= MAX_DRAWS) setDraws({ n: 0, sum: 0 }); setPlaying(v => !v); }}
        playLabel={tx(t, "figExpv_keepDrawing", "keep drawing values of X")}
        onStep={() => { setPlaying(false); addDraws(); }}
        onReset={clearDraws}
        readout={avg === null
          ? tx(t, "figExpv_none", "no values drawn yet")
          : `n = ${draws.n} · x̄ = ${f2(avg, 3)}`} />
    </div>
  );
  const presetChoice = <Choice value={preset as Preset} onChange={setPreset} options={[
    ["die", tx(t, "figExp_die", "fair die")],
    ["loaded", tx(t, "figExp_loaded", "loaded die")],
    ["split", tx(t, "figExp_split", "two ends")],
    ["peak", tx(t, "figExp_peak", "narrow")],
  ]} />;
  const controls = <Row>
    <Readout color={C.blue}>{`E[X] = Σ x p(x) = ${f2(mu, 3)}`}</Readout>
    <Readout>{`E[X²] = ${f2(ex2, 3)}`}</Readout>
    <Readout color={C.amber}>{`Var = E[X²] − μ² = ${f2(vr, 3)}`}</Readout>
    <Readout color={C.amber}>{`σ = ${f2(sd, 3)}`}</Readout>
  </Row>;
  const note = <>
    {tx(t, "figExpv_note2", "Each bar is a weight p(x) sitting at position x. The board balances at the mean, so a heavy bar far from the rest drags the mean towards it. The standard deviation σ is a typical distance from the mean: \"two ends\" has a large σ even though its mean is central, while \"narrow\" has a small one. Press ▶ to draw real values of X: the green x̄, the average of all values so far, wanders at first and then settles on μ.")}{" "}
    <span data-mouse-only>{tx(t, "figExp_drag", "Drag a bar up or down to change its probability.")}</span>
    <span data-touch-only>{tx(t, "figExp_dragTouch", "Drag a bar up or down to change its probability.")}</span>
  </>;

  // ── Lab ──
  const mu2 = f2(mu, 2), sd2 = f2(sd, 2);
  const nonzero = XS.filter((_, i) => p[i] > 0.001);
  const gapToValue = Math.min(...nonzero.map(x => Math.abs(x - mu)));
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figExpvL1_t", "Move the balance point"),
      body: <>
        <p>{tx(t, "figExpvL1_b1", "A fair die: six equal weights at 1, …, 6. The board balances at their middle, μ = 3.5.")}</p>
        <p>{tx(t, "figExpvL1_b2", "Change the weights until the board balances at 5.")}</p>
      </>,
      goal: { text: fill(tx(t, "figExpvL1_g", "μ = 5 (now {m})."), { m: mu2 }), done: Math.abs(mu - 5) < 0.05 },
      hint: tx(t, "figExpvL1_h", "Raise the bars on the right (6, 7, 8) or lower the ones on the left. Weight far to the right pulls hardest."),
      setup: () => setPreset("die"),
    },
    {
      title: tx(t, "figExpvL2_t", "The long-run average"),
      body: <>
        <p>{tx(t, "figExpvL2_b1", "Now roll the fair die for real. The green x̄ is the average of all the rolls so far.")}</p>
        <p>{tx(t, "figExpvL2_b2", "Step through the first few rolls with ⏭, then press ▶. Where does x̄ end up?")}</p>
      </>,
      goal: { text: fill(tx(t, "figExpvL2_g", "At least 2000 rolls (now {n}, x̄ = {a})."), { n: draws.n, a: avg === null ? "–" : f2(avg, 3) }), done: preset === "die" && draws.n >= 2000 },
      focus: "play",
      setup: () => setPreset("die"),
    },
    {
      title: tx(t, "figExpvL3_t", "Quick check"),
      body: <p>{tx(t, "figExpvL3_b", "The average of many fair-die rolls settles on 3.5.")}</p>,
      quiz: {
        q: tx(t, "figExpvL3_q", "How often does a single roll of a fair die show 3.5?"),
        options: [tx(t, "figExpvL3_o1", "never"), "1/6", "1/2", tx(t, "figExpvL3_o4", "more often than any other value")],
        answer: 0,
        why: tx(t, "figExpvL3_w", "A die only shows whole numbers. The expected value is the long-run average, not a value you should expect to see: it need not be possible at all."),
      },
    },
    {
      title: tx(t, "figExpvL4_t", "Same mean, wider spread"),
      body: <>
        <p>{tx(t, "figExpvL4_b1", "\"Narrow\" puts almost all its weight on 4: μ = 4 and σ is small, so the amber band μ ± σ is thin.")}</p>
        <p>{tx(t, "figExpvL4_b2", "Keep the mean at 4 but make the typical distance from it at least 3.")}</p>
      </>,
      goal: { text: fill(tx(t, "figExpvL4_g", "μ = 4 and σ ≥ 3 (now μ = {m}, σ = {s})."), { m: mu2, s: sd2 }), done: Math.abs(mu - 4) < 0.1 && sd >= 3 },
      hint: tx(t, "figExpvL4_h", "Move the weight to the two ends equally: the board still balances at 4, but every weight is now far from it. The \"two ends\" preset does exactly that."),
      setup: () => setPreset("peak"),
    },
    {
      title: tx(t, "figExpvL5_t", "A small weight far away"),
      body: <>
        <p>{tx(t, "figExpvL5_b1", "Back to \"narrow\". A see-saw turns by weight times distance, so a light weight far out can move the balance point a lot.")}</p>
        <p>{tx(t, "figExpvL5_b2", "Raise only the bar at 8, but keep its probability at most 0.2, and push μ to 4.5 or more.")}</p>
      </>,
      goal: { text: fill(tx(t, "figExpvL5_g", "μ ≥ 4.5 with P(X = 8) ≤ 0.2 (now μ = {m}, P(X = 8) = {p})."), { m: mu2, p: f2(p[8], 2) }), done: mu >= 4.5 && p[8] <= 0.2 + 1e-9 && p[0] + p[1] + p[2] + p[6] + p[7] < 0.001 },
      hint: tx(t, "figExpvL5_h", "μ = 4 + 4 · P(X = 8) here, because each bit of probability moved to 8 sits 4 to the right of the old mean. So P(X = 8) between 0.125 and 0.2 works."),
      setup: () => setPreset("peak"),
    },
    {
      title: tx(t, "figExpvL6_t", "Quick check"),
      body: <p>{tx(t, "figExpvL6_b", "Imagine sliding every bar 2 to the right, so X becomes X + 2.")}</p>,
      quiz: {
        q: tx(t, "figExpvL6_q", "What happens to σ?"),
        options: [tx(t, "figExpvL6_o1", "it stays the same"), tx(t, "figExpvL6_o2", "it grows by 2"), tx(t, "figExpvL6_o3", "it doubles"), tx(t, "figExpvL6_o4", "it grows four times")],
        answer: 0,
        why: tx(t, "figExpvL6_w", "The mean also moves 2 to the right, so every distance x − μ stays the same. Shifting changes where the distribution sits, not how spread out it is: Var(X + b) = Var(X)."),
      },
    },
    {
      title: tx(t, "figExpvL7_t", "No spread at all"),
      body: <>
        <p>{tx(t, "figExpvL7_b1", "The variance is the average squared distance from μ. It is 0 only if every possible value sits exactly on μ.")}</p>
        <p>{tx(t, "figExpvL7_b2", "Make X certain: shrink the spread to σ = 0.")}</p>
      </>,
      goal: { text: fill(tx(t, "figExpvL7_g", "σ = 0 (now {s})."), { s: f2(sd, 3) }), done: sd < 0.005 },
      hint: tx(t, "figExpvL7_h", "Drag the bars at 3 and 5 down to 0, so all the weight sits on 4."),
      setup: () => setPreset("peak"),
    },
  ];

  const insights: Insight[] = [
    {
      id: "certain", tone: "ok", when: sd < 0.005,
      title: tx(t, "figExpvI1_t", "A certain value"),
      body: fill(tx(t, "figExpvI1_b", "All the weight is on {m}: every value equals the mean, so every squared distance is 0 and Var = 0."), { m: f2(mu, 0) }),
    },
    {
      id: "between", tone: "info", when: gapToValue > 0.3,
      title: tx(t, "figExpvI2_t", "A mean X never takes"),
      body: fill(tx(t, "figExpvI2_b", "μ = {m} lies between the possible values: X never equals its own mean."), { m: mu2 }),
    },
    {
      id: "settled", tone: "ok", when: avg !== null && draws.n >= 2000 && Math.abs(avg - mu) < 0.05,
      title: tx(t, "figExpvI3_t", "The average settles"),
      body: fill(tx(t, "figExpvI3_b", "After {n} values the average is {a}, within 0.05 of μ = {m}."), { n: draws.n, a: f2(avg ?? 0, 3), m: f2(mu, 3) }),
    },
    {
      id: "early", tone: "warn", when: avg !== null && draws.n <= 20 && Math.abs(avg - mu) > 0.5,
      title: tx(t, "figExpvI4_t", "Too few values"),
      body: fill(tx(t, "figExpvI4_b", "A handful of draws says little: x̄ = {a} is still far from μ = {m}. Keep going."), { a: f2(avg ?? 0, 2), m: mu2 }),
    },
  ];

  const title = tx(t, "figExpv_title", "The mean as a balance point");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{presetChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{presetChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figExpvR1", "E[X] = Σ x p(x) is the balance point: weight times distance cancels on the two sides."),
          tx(t, "figExpvR2", "It is the long-run average of many values, and it may be a value X never takes."),
          tx(t, "figExpvR3", "A small probability far away moves the mean a lot."),
          tx(t, "figExpvR4", "σ measures the spread around μ: the same mean can hide very different spreads, and σ = 0 only when X is certain."),
        ]}
      />
    </>
  );
}
