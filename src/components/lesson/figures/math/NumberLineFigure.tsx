"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Vec, Handle, plot, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The number line as the picture behind the four sign rules.
// add      — a + b is "start at a, move b steps"; a negative b moves left, which
//            is why a − b and a + (−b) are the same move. Drag a and the tip.
// multiply — a × b stretches the arrow 0→a by |b|; a negative b also flips it
//            to the other side of 0, which is where "minus times minus is
//            plus" comes from (two flips).
// distance — |a − b| is the distance between two points, never negative;
//            |a| is the distance from a to 0.
// The lab walks through the three modes with goals and quick questions.

type Mode = "add" | "mul" | "dist";
const snap = (v: number) => clamp(Math.round(v * 2) / 2, -10, 10);
const n = (v: number) => (Object.is(v, -0) ? 0 : v).toString().replace("-", "−");
const paren = (v: number) => (v < 0 ? `(${n(v)})` : n(v));
const P = plot({ W: 560, H: 150, x0: -10.8, x1: 10.8, y0: 0, y1: 1 });
const LY = 100;                                     // y of the number line

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function NumberLineStage({ mode, a, b, k, setA, setB, t }: {
  mode: Mode; a: number; b: number; k: number;
  setA: (v: number) => void; setB: (v: number) => void; t?: TrackTranslations;
}) {
  const p = P;
  const tip = mode === "add" ? a + b : b;           // second handle: the sum's tip, or point b
  const drag = useDrag<"a" | "b">(
    q => nearest(q, mode === "mul" ? [["a", { x: p.X(a), y: 62 }]] : [["a", { x: p.X(a), y: LY }], ["b", { x: p.X(tip), y: mode === "add" ? 62 : LY }]], 22),
    (id, q) => {
      const v = snap(p.inv(q).x);
      if (id === "a") setA(v);
      else if (mode === "add") setB(clamp(v - a, -20, 20));
      else setB(v);
    });

  const ticks = Array.from({ length: 21 }, (_, i) => i - 10);
  const col = (v: number) => (v >= 0 ? C.green : C.red);
  const prod = a * k;
  const X = (v: number) => p.X(clamp(v, -10.6, 10.6));

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
      <line x1={p.X(-10.6)} x2={p.X(10.6)} y1={LY} y2={LY} stroke={C.axis} strokeWidth={1.4} />
      {ticks.map(v => (
        <g key={v}>
          <line x1={p.X(v)} x2={p.X(v)} y1={LY - (v === 0 ? 7 : 4)} y2={LY + (v === 0 ? 7 : 4)} stroke={v === 0 ? C.fg : C.axis} strokeWidth={v === 0 ? 1.6 : 1} />
          <T x={p.X(v)} y={LY + 18} size={8.5} anchor="middle" color={v === 0 ? C.fg : C.axis}>{n(v)}</T>
        </g>
      ))}
      <T x={p.X(-10.4)} y={LY + 36} size={8.5} color={C.red}>{tx(t, "figNL_neg", "← negative")}</T>
      <T x={p.X(10.4)} y={LY + 36} size={8.5} anchor="end" color={C.green}>{tx(t, "figNL_pos", "positive →")}</T>

      {mode === "add" && <>
        <line x1={p.X(a)} x2={p.X(a)} y1={62} y2={LY} stroke={C.sky} strokeDasharray="3 3" />
        <line x1={X(a + b)} x2={X(a + b)} y1={62} y2={LY} stroke={col(b)} strokeDasharray="3 3" />
        <Vec a={{ x: p.X(a), y: 62 }} b={{ x: X(a + b), y: 62 }} color={col(b)} w={2.4} />
        <T x={(p.X(a) + X(a + b)) / 2} y={52} size={10} anchor="middle" color={col(b)} bold>{b >= 0 ? `+${n(b)}` : n(b)}</T>
        <circle cx={X(a + b)} cy={LY} r={5} fill={col(b)} />
        <Handle x={p.X(a)} y={LY} color={C.sky} active={drag.dragging === "a"} />
        <Handle x={X(a + b)} y={62} color={col(b)} r={4.5} active={drag.dragging === "b"} />
        <T x={p.X(a) + 9} y={LY - 10} size={9} color={C.sky}>a</T>
      </>}

      {mode === "mul" && <>
        <Vec a={{ x: p.X(0), y: 62 }} b={{ x: p.X(a), y: 62 }} color={C.sky} w={2.4} />
        <Vec a={{ x: p.X(0), y: 84 }} b={{ x: X(prod), y: 84 }} color={C.amber} w={3} />
        <T x={p.X(a)} y={50} size={9} anchor="middle" color={C.sky}>a</T>
        <T x={X(prod)} y={LY - 22} size={9} anchor={prod < 0 ? "end" : "start"} color={C.amber}>{`  a × b = ${n(prod)}  `}</T>
        {Math.abs(prod) > 10.6 && <T x={X(prod)} y={LY - 34} size={8} anchor="middle" color={C.amber}>{tx(t, "figNL_off", "(off the line)")}</T>}
        <Handle x={p.X(a)} y={62} color={C.sky} active={drag.dragging === "a"} />
      </>}

      {mode === "dist" && <>
        <line x1={p.X(Math.min(a, b))} x2={p.X(Math.max(a, b))} y1={60} y2={60} stroke={C.amber} strokeWidth={2} />
        <line x1={p.X(a)} x2={p.X(a)} y1={54} y2={LY} stroke={C.amber} strokeDasharray="3 3" />
        <line x1={p.X(b)} x2={p.X(b)} y1={54} y2={LY} stroke={C.amber} strokeDasharray="3 3" />
        <T x={p.X((a + b) / 2)} y={50} size={10} anchor="middle" color={C.amber} bold>{n(Math.abs(a - b))}</T>
        <line x1={p.X(0)} x2={p.X(a)} y1={LY + 46} y2={LY + 46} stroke={C.sky} strokeWidth={1.6} opacity={0.7} />
        <T x={p.X(a / 2)} y={LY + 42} size={8} anchor="middle" color={C.sky}>{`|a|`}</T>
        <Handle x={p.X(a)} y={LY} color={C.sky} active={drag.dragging === "a"} />
        <Handle x={p.X(b)} y={LY} color={C.purple} active={drag.dragging === "b"} />
        <T x={p.X(a) + 9} y={LY - 10} size={9} color={C.sky}>a</T>
        <T x={p.X(b) + 9} y={LY - 10} size={9} color={C.purple}>b</T>
      </>}
    </svg>
  );
}

// ── The figure and its lab ────────────────────────────────────────────────────

export function NumberLineFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("add");
  const [a, setA] = useState(3);
  const [b, setB] = useState(-5);
  const [k, setK] = useState(-2);
  const lab = useLab("math-number-line");
  const prod = a * k;
  const col = (v: number) => (v >= 0 ? C.green : C.red);
  const set = (m: Mode, na: number, nb: number, nk = k) => { setMode(m); setA(na); setB(nb); setK(nk); };

  const stage = <NumberLineStage mode={mode} a={a} b={b} k={k} setA={setA} setB={setB} t={t} />;
  const modeChoice = (
    <Choice value={mode} onChange={setMode} options={[["add", tx(t, "figNL_add", "add / subtract")], ["mul", tx(t, "figNL_mul", "multiply")], ["dist", tx(t, "figNL_dist", "distance")]] as const} />
  );
  const controls = <>
    {mode === "mul" && <Slider label={tx(t, "figNL_factor", "factor b")} value={k} min={-3} max={3} step={0.5} onChange={setK} fmt={n} />}
    <Row>
      {mode === "add" && <>
        <Readout>{n(a)} + {paren(b)} = {n(a + b)}</Readout>
        <Readout color={col(b)}>{b < 0 ? `${n(a)} − ${n(-b)} = ${n(a + b)}` : `${n(a + b)} − ${n(b)} = ${n(a)}`}</Readout>
      </>}
      {mode === "mul" && <>
        <Readout>{paren(a)} × {paren(k)} = {n(prod)}</Readout>
        <Readout color={k < 0 ? C.red : C.green}>{k < 0 ? tx(t, "figNL_flip", "negative factor: flipped to the other side of 0") : k === 0 ? tx(t, "figNL_zero", "factor 0: squashed onto 0") : tx(t, "figNL_same", "positive factor: same side of 0")}</Readout>
      </>}
      {mode === "dist" && <>
        <Readout color={C.amber}>|{n(a)} − {paren(b)}| = |{n(a - b)}| = {n(Math.abs(a - b))}</Readout>
        <Readout color={C.sky}>|{n(a)}| = {n(Math.abs(a))}</Readout>
        <Readout color={C.purple}>|{n(b)}| = {n(Math.abs(b))}</Readout>
      </>}
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figNLL1_t", "Adding is a walk"),
      body: <>
        <p>{tx(t, "figNLL1_b1", "The blue point is where you start, a = 3. The arrow is the number you add: it walks right when the number is positive and left when it is negative.")}</p>
        <p>{tx(t, "figNLL1_b2", "Drag the arrow's tip to land on −2. Which number did you add?")}</p>
      </>,
      goal: { text: tx(t, "figNLL1_g", "Starting at 3, land on −2."), done: mode === "add" && a === 3 && a + b === -2 },
      hint: tx(t, "figNLL1_h", "From 3, walk 3 steps left to reach 0, then 2 more."),
      setup: () => set("add", 3, 2),
    },
    {
      title: tx(t, "figNLL2_t", "Subtracting a negative"),
      body: <>
        <p>{tx(t, "figNLL2_b1", "You just added −5, and the second readout shows the same move as 3 − 5. Subtracting a number is adding its opposite.")}</p>
        <p>{tx(t, "figNLL2_b2", "So what is 3 − (−4)? It is 3 + 4. Show it on the line.")}</p>
      </>,
      goal: { text: tx(t, "figNLL2_g", "Starting at 3, add +4 and land on 7."), done: mode === "add" && a === 3 && b === 4 },
      setup: () => set("add", 3, -5),
    },
    {
      title: tx(t, "figNLL3_t", "Quick check"),
      body: <p>{tx(t, "figNLL3_b", "Different signs: subtract the sizes, keep the sign of the bigger one.")}</p>,
      quiz: {
        q: tx(t, "figNLL3_q", "What is −8 + 5?"),
        options: ["−3", "3", "−13", "13"],
        answer: 0,
        why: tx(t, "figNLL3_w", "8 − 5 = 3, and −8 has the bigger size, so the result is −3. On the line: start at −8, walk 5 to the right."),
      },
    },
    {
      title: tx(t, "figNLL4_t", "Multiplying stretches"),
      body: <>
        <p>{tx(t, "figNLL4_b1", "Now the blue arrow goes from 0 to a, and the amber arrow is a × b. A factor above 1 stretches it, a factor between 0 and 1 shrinks it.")}</p>
        <p>{tx(t, "figNLL4_b2", "Move the factor b below zero and watch the amber arrow.")}</p>
      </>,
      goal: { text: tx(t, "figNLL4_g", "With a positive a, make the product negative."), done: mode === "mul" && a > 0 && prod < 0 },
      setup: () => set("mul", 3, b, 2),
    },
    {
      title: tx(t, "figNLL5_t", "Two flips"),
      body: <>
        <p>{tx(t, "figNLL5_b1", "A negative factor flips the arrow to the other side of 0. What happens if a is already negative?")}</p>
        <p>{tx(t, "figNLL5_b2", "Drag a to the left of 0 and keep b negative.")}</p>
      </>,
      goal: { text: tx(t, "figNLL5_g", "Make a negative and b negative: the product lands on the positive side."), done: mode === "mul" && a < 0 && k < 0 },
      hint: tx(t, "figNLL5_h", "Drag the blue arrow's tip past 0 to the left."),
      setup: () => set("mul", 3, b, -2),
    },
    {
      title: tx(t, "figNLL6_t", "Quick check"),
      body: <p>{tx(t, "figNLL6_b", "Count the flips.")}</p>,
      quiz: {
        q: tx(t, "figNLL6_q", "What is (−2) × 3 × (−5) × (−1)?"),
        options: ["−30", "30", "−10", "10"],
        answer: 0,
        why: tx(t, "figNLL6_w", "Three minus signs mean three flips, an odd number, so the result is negative. The sizes multiply: 2 × 3 × 5 × 1 = 30."),
      },
    },
    {
      title: tx(t, "figNLL7_t", "Distance never goes negative"),
      body: <>
        <p>{tx(t, "figNLL7_b1", "Two points now: a (blue) and b (purple). The amber bracket is their distance |a − b|.")}</p>
        <p>{tx(t, "figNLL7_b2", "Put them on opposite sides of 0, exactly 7 apart.")}</p>
      </>,
      goal: { text: tx(t, "figNLL7_g", "One point left of 0, one right of 0, distance 7."), done: mode === "dist" && a * b < 0 && Math.abs(a - b) === 7 },
      hint: tx(t, "figNLL7_h", "For example −3 and 4: |−3 − 4| = |−7| = 7."),
      setup: () => set("dist", 2, 5),
    },
    {
      title: tx(t, "figNLL8_t", "Quick check"),
      body: <p>{tx(t, "figNLL8_b", "Absolute value is a distance; it does not split over a subtraction.")}</p>,
      quiz: {
        q: tx(t, "figNLL8_q", "|−3 − 2| equals:"),
        options: ["5", "1", "−5", "−1"],
        answer: 0,
        why: tx(t, "figNLL8_w", "−3 − 2 = −5 and |−5| = 5: the points −3 and 2 are 5 apart. |−3| − |2| = 1 is a different number."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "left", tone: "info", when: mode === "add" && b < 0,
      title: tx(t, "figNLI1_t", "Adding a negative walks left"),
      body: fill(tx(t, "figNLI1_b", "{a} + ({b}) and {a} − {nb} are the same walk: {nb} steps to the left, ending at {s}."), { a: n(a), b: n(b), nb: n(-b), s: n(a + b) }),
    },
    {
      id: "cross0", tone: "info", when: mode === "add" && a > 0 && a + b < 0,
      title: tx(t, "figNLI2_t", "Crossing zero"),
      body: fill(tx(t, "figNLI2_b", "The first {a} steps bring you to 0, and the remaining {r} take you below it. That is the rule for different signs: subtract the sizes, keep the sign of the bigger one."), { a: n(a), r: n(-(a + b)) }),
    },
    {
      id: "flip2", tone: "ok", when: mode === "mul" && a < 0 && k < 0,
      title: tx(t, "figNLI3_t", "Two flips cancel"),
      body: fill(tx(t, "figNLI3_b", "a = {a} is already on the negative side; the factor {k} flips it back. ({a}) × ({k}) = {p}, positive."), { a: n(a), k: n(k), p: n(prod) }),
    },
    {
      id: "zero", tone: "warn", when: mode === "mul" && k === 0,
      title: tx(t, "figNLI4_t", "Anything times 0 is 0"),
      body: tx(t, "figNLI4_b", "Stretching by 0 squashes the arrow onto 0, whatever a is. That is also why dividing by 0 cannot be undone: every a would give the same 0."),
    },
    {
      id: "apart", tone: "info", when: mode === "dist" && a * b < 0,
      title: tx(t, "figNLI5_t", "Opposite sides: the sizes add"),
      body: fill(tx(t, "figNLI5_b", "With 0 between them, the distance is |a| + |b| = {x} + {y} = {d}."), { x: n(Math.abs(a)), y: n(Math.abs(b)), d: n(Math.abs(a - b)) }),
    },
    {
      id: "same", tone: "info", when: mode === "dist" && a * b > 0,
      title: tx(t, "figNLI6_t", "Same side: the sizes subtract"),
      body: fill(tx(t, "figNLI6_b", "Both points are on the same side of 0, so the distance is the bigger size minus the smaller: {d}."), { d: n(Math.abs(a - b)) }),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figNL_title", "The number line")}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={mode === "add"
          ? tx(t, "figNL_noteAdd", "Drag the blue point to choose where you start (a) and the arrow's tip to choose where you land. Adding a positive number moves right, adding a negative number moves left. Subtracting b is the same move as adding its opposite −b, so 3 − 5 and 3 + (−5) land on the same point, −2.")
          : mode === "mul"
            ? tx(t, "figNL_noteMul", "The blue arrow goes from 0 to a; drag its tip. Multiplying by b stretches it |b| times (b = 0.5 halves it). A negative b also flips it through 0 to the other side. Flip twice and you are back where you started, which is why a negative times a negative is positive.")
            : tx(t, "figNL_noteDist", "Drag both points. The amber bracket is the distance between them, |a − b|. Swapping the points changes the sign of a − b but not the distance, so |a − b| = |b − a|. The absolute value |x| is the distance from x to 0: the sign is thrown away, the size is kept.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t}
        title={tx(t, "figNL_title", "The number line")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figNLR1", "Adding is a walk along the line: right for a positive number, left for a negative one."),
          tx(t, "figNLR2", "Subtracting is adding the opposite, so 3 − (−4) = 3 + 4 = 7."),
          tx(t, "figNLR3", "Multiplying stretches; a negative factor also flips through 0, and two flips cancel."),
          tx(t, "figNLR4", "|a − b| is the distance between a and b: never negative, and not |a| − |b|."),
        ]}
      />
    </>
  );
}
