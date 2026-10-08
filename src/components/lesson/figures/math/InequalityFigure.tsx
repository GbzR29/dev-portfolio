"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The linear inequality a·x + b ? c (with ? one of < ≤ > ≥) and its solution
// set on the number line. Solving divides by a; when a is negative that flips
// the sign, and the shaded ray visibly jumps to the other side. The draggable
// test point shows the inequality's truth value for any single x, so the rule
// can be checked instead of memorised. The endpoint is a hollow circle for
// strict (< >) and a filled one for ≤ ≥.
// The lab: find a failing test point, flip the sign of a, include the
// boundary, and the a = 0 case.

type Op = "<" | "≤" | ">" | "≥";
const FLIP: Record<Op, Op> = { "<": ">", "≤": "≥", ">": "<", "≥": "≤" };
const n = (v: number) => (Object.is(v, -0) ? 0 : +v.toFixed(2)).toString().replace("-", "−");
const test = (l: number, op: Op, r: number) => op === "<" ? l < r : op === "≤" ? l <= r + 1e-9 : op === ">" ? l > r : l >= r - 1e-9;
const P = plot({ W: 560, H: 150, x0: -10.8, x1: 10.8, y0: 0, y1: 1 });
const LY = 92;
const TICKS = Array.from({ length: 21 }, (_, i) => i - 10);

/** Everything the drawing needs, worked out once from a, b, c, the symbol and the test x. */
function solveIneq(a: number, b: number, c: number, op: Op, x: number) {
  const a0 = a === 0;
  const bound = (c - b) / a;
  const solOp: Op = a < 0 ? FLIP[op] : op;
  const lhs = a * x + b;
  const right = solOp === ">" || solOp === "≥";
  const closed = solOp === "≤" || solOp === "≥";
  return { a0, bound, solOp, lhs, ok: test(lhs, op, c), right, closed, always: a0 && test(b, op, c) };
}
type Solved = ReturnType<typeof solveIneq>;

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function IneqStage({ s, op, c, x, setX, t }: { s: Solved; op: Op; c: number; x: number; setX: (v: number) => void; t?: TrackTranslations }) {
  const drag = useDrag<"x">(q => nearest(q, [["x", { x: P.X(x), y: LY - 34 }], ["x", { x: P.X(x), y: LY }]], 24),
    (_, q) => setX(clamp(Math.round(P.inv(q).x * 2) / 2, -10, 10)));
  const { a0, bound, solOp, lhs, ok, right, closed, always } = s;
  const B = clamp(bound, -10.6, 10.6);
  const full = <rect x={P.X(-10.6)} width={P.X(10.6) - P.X(-10.6)} y={LY - 7} height={14} rx={3} fill={C.amber} opacity={0.35} />;

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      {!a0 && Math.abs(bound) <= 12 && (
        <rect x={right ? P.X(B) : P.X(-10.6)} width={right ? P.X(10.6) - P.X(B) : P.X(B) - P.X(-10.6)}
          y={LY - 7} height={14} rx={3} fill={C.amber} opacity={0.35} />
      )}
      {!a0 && Math.abs(bound) > 12 && (bound > 0) !== right && full}
      {always && full}
      <line x1={P.X(-10.6)} x2={P.X(10.6)} y1={LY} y2={LY} stroke={C.axis} strokeWidth={1.4} />
      {TICKS.map(v => (
        <g key={v}>
          <line x1={P.X(v)} x2={P.X(v)} y1={LY - 4} y2={LY + 4} stroke={v === 0 ? C.fg : C.axis} strokeWidth={v === 0 ? 1.6 : 1} />
          <T x={P.X(v)} y={LY + 20} size={8.5} anchor="middle" color={v === 0 ? C.fg : C.axis}>{n(v)}</T>
        </g>
      ))}
      {!a0 && Math.abs(bound) <= 10.6 && <>
        <circle cx={P.X(bound)} cy={LY} r={6} fill={closed ? C.amber : "var(--code-bg)"} stroke={C.amber} strokeWidth={2.2} />
        <T x={P.X(bound)} y={LY + 38} size={9.5} anchor="middle" color={C.amber} bold>{`x ${solOp} ${n(bound)}`}</T>
      </>}
      {a0 && <T x={P.W / 2} y={LY + 42} size={10} anchor="middle" color={always ? C.green : C.red}>
        {always ? tx(t, "figIneq_always", "a = 0: true for every x") : tx(t, "figIneq_never", "a = 0: true for no x")}
      </T>}
      <line x1={P.X(x)} x2={P.X(x)} y1={LY - 34} y2={LY} stroke={ok ? C.green : C.red} strokeDasharray="3 3" />
      <T x={P.X(x)} y={LY - 44} size={9.5} anchor="middle" color={ok ? C.green : C.red} bold>{`${n(lhs)} ${op} ${n(c)} ${ok ? "✓" : "✗"}`}</T>
      <Handle x={P.X(x)} y={LY - 34} color={ok ? C.green : C.red} active={drag.dragging === "x"} />
    </svg>
  );
}

export function InequalityFigure({ t }: { t?: TrackTranslations }) {
  const [op, setOp] = useState<Op>("<");
  const [a, setA] = useState(-2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(7);
  const [x, setX] = useState(0);
  const lab = useLab("math-inequality");

  const s = solveIneq(a, b, c, op, x);
  const { a0, bound, solOp, lhs, ok, closed } = s;
  const interval = s.right ? `${closed ? "[" : "("}${n(bound)}, ∞)` : `(−∞, ${n(bound)}${closed ? "]" : ")"}`;
  const lhsText = `${a === 1 ? "" : a === -1 ? "−" : n(a)}x ${b < 0 ? "−" : "+"} ${n(Math.abs(b))}`;
  const set = (na: number, nb: number, nc: number, no: Op, nx: number) => { setA(na); setB(nb); setC(nc); setOp(no); setX(nx); };

  const stage = <IneqStage s={s} op={op} c={c} x={x} setX={setX} t={t} />;
  const opChoice = <Choice value={op} onChange={setOp} options={(["<", "≤", ">", "≥"] as const).map(o => [o, o] as const)} />;
  const controls = <>
    <Sliders>
      <Slider label="a" value={a} min={-3} max={3} step={0.5} onChange={setA} fmt={n} />
      <Slider label="b" value={b} min={-6} max={6} step={1} onChange={setB} fmt={n} />
      <Slider label="c" value={c} min={-8} max={8} step={1} onChange={setC} fmt={n} />
    </Sliders>
    <Row>
      <Readout>{lhsText} {op} {n(c)}</Readout>
      {!a0 && <>
        <Readout>{a === 1 ? "" : `${n(a)}x ${op} ${n(c - b)}  →  `}x {solOp} {n(bound)}</Readout>
        <Readout color={a < 0 ? C.red : C.muted}>{a < 0 ? `${tx(t, "figIneq_flipped", "÷ a negative number: the sign flips")} ${op} → ${solOp}` : tx(t, "figIneq_kept", "÷ a positive number: the sign stays")}</Readout>
        <Readout color={C.amber}>x ∈ {interval}</Readout>
      </>}
    </Row>
    <Readout color={ok ? C.green : C.red}>
      {`${tx(t, "figIneq_test", "test x =")} ${n(x)}: ${n(lhs)} ${op} ${n(c)} ${ok ? tx(t, "figIneq_true", "is true") : tx(t, "figIneq_false", "is false")}`}
    </Readout>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figIneqL1_t", "Catch a false value"),
      body: <>
        <p>{tx(t, "figIneqL1_b1", "The amber ray claims to hold every x with −2x + 1 < 7. The test point checks that claim for one x at a time: green is true, red is false.")}</p>
        <p>{tx(t, "figIneqL1_b2", "Drag the test point until the inequality is false.")}</p>
      </>,
      goal: { text: tx(t, "figIneqL1_g", "Find an x where −2x + 1 < 7 is false."), done: a === -2 && b === 1 && c === 7 && op === "<" && !ok },
      hint: tx(t, "figIneqL1_h", "Outside the amber ray, to the left of −3."),
      setup: () => set(-2, 1, 7, "<", 0),
    },
    {
      title: tx(t, "figIneqL2_t", "Quick check"),
      body: <p>{tx(t, "figIneqL2_b", "The last move divides both sides by −2.")}</p>,
      quiz: {
        q: "−2x < 6  ⟹  ?",
        options: ["x > −3", "x < −3", "x < 3", "x > 3"],
        answer: 0,
        why: tx(t, "figIneqL2_w", "Dividing by −2 mirrors the number line, so < turns into >: x > −3. Test x = 0: 0 < 6 is true, and 0 > −3 ✓."),
      },
    },
    {
      title: tx(t, "figIneqL3_t", "The mirror"),
      body: <p>{tx(t, "figIneqL3_b", "Slowly drag a from −2 up past 0 to a positive value. Watch which side the ray is on.")}</p>,
      goal: { text: tx(t, "figIneqL3_g", "Make a positive."), done: a > 0 },
      setup: () => set(-2, 1, 7, "<", 0),
    },
    {
      title: tx(t, "figIneqL4_t", "Include the boundary"),
      body: <>
        <p>{tx(t, "figIneqL4_b1", "2x < 4 is solved by x < 2, and the hollow circle says 2 itself is left out.")}</p>
        <p>{tx(t, "figIneqL4_b2", "Change the symbol so that x = 2 is a solution, then put the test point on 2.")}</p>
      </>,
      goal: { text: tx(t, "figIneqL4_g", "A filled circle, and the test point on it, green."), done: !a0 && closed && x === bound && ok },
      setup: () => set(2, 0, 4, "<", 0),
    },
    {
      title: tx(t, "figIneqL5_t", "Quick check"),
      body: <p>{tx(t, "figIneqL5_b", "Solve, then write the answer as an interval.")}</p>,
      quiz: {
        q: "3x − 5 ≥ 7",
        options: ["[4, ∞)", "(4, ∞)", "(−∞, 4]", "[−4, ∞)"],
        answer: 0,
        why: tx(t, "figIneqL5_w", "Add 5: 3x ≥ 12. Divide by 3 (positive, no flip): x ≥ 4. The ≥ includes 4, so the bracket is square: [4, ∞)."),
      },
    },
    {
      title: tx(t, "figIneqL6_t", "No x at all"),
      body: <p>{tx(t, "figIneqL6_b", "Drag a to 0. Then the x disappears and the inequality is about numbers only. Try b and c on both sides of each other.")}</p>,
      goal: { text: tx(t, "figIneqL6_g", "Set a = 0."), done: a0 },
      setup: () => set(1.5, 1, 4, "<", 0),
    },
    {
      title: tx(t, "figIneqL7_t", "Quick check"),
      body: <p>{tx(t, "figIneqL7_b", "Start from 2 < 5.")}</p>,
      quiz: {
        q: tx(t, "figIneqL7_q", "Which move turns 2 < 5 into a false statement unless you flip the symbol?"),
        options: [tx(t, "figIneqL7_o1", "multiply both sides by −3"), tx(t, "figIneqL7_o2", "subtract 10 from both sides"), tx(t, "figIneqL7_o3", "multiply both sides by 3"), tx(t, "figIneqL7_o4", "add −3 to both sides")],
        answer: 0,
        why: tx(t, "figIneqL7_w", "(−3)·2 = −6 and (−3)·5 = −15, and −6 > −15. Adding or subtracting anything, even a negative number, only slides the line and never flips."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flip", tone: "warn", when: !a0 && a < 0,
      title: tx(t, "figIneqI1_t", "The symbol flipped"),
      body: fill(tx(t, "figIneqI1_b", "The last move divides by a = {a}, a negative number. That mirrors the number line, so {op} became {sol} and the ray lies on the other side of {bd}."), { a: n(a), op, sol: solOp, bd: n(bound) }),
    },
    {
      id: "edge", tone: "info", when: !a0 && x === bound,
      title: tx(t, "figIneqI2_t", "On the boundary"),
      body: fill(tx(t, "figIneqI2_b", "At x = {x} both sides are equal: {l} = {c}. The boundary belongs to the answer only with ≤ or ≥, and then its circle is filled."), { x: n(x), l: n(lhs), c: n(c) }),
    },
    {
      id: "zero", tone: s.always ? "ok" : "warn", when: a0,
      title: tx(t, "figIneqI3_t", "No x left"),
      body: fill(s.always
        ? tx(t, "figIneqI3_yes", "With a = 0 the inequality reads {b} {op} {c}, which is true: so every x is a solution.")
        : tx(t, "figIneqI3_no", "With a = 0 the inequality reads {b} {op} {c}, which is false: so no x is a solution."), { b: n(b), op, c: n(c) }),
    },
  ];

  const title = tx(t, "figIneq_title", "Solving an inequality");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{opChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figIneq_note", "The amber ray is every x that makes the inequality true. Drag the test point along the line: it turns green inside the ray and red outside, so you can check the answer instead of trusting a rule. Now drag a below zero. Dividing by a negative number reverses the order of the number line (3 < 5 but −3 > −5), so the sign must flip, and the ray jumps to the other side of the boundary. A hollow endpoint means the boundary itself is excluded (< or >), a filled one that it is included (≤ or ≥). With a = 0 there is no x left: the statement is then either always true or never true.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{opChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figIneqR1", "The solution of a linear inequality is a ray; test one point on each side of the boundary to check it."),
          tx(t, "figIneqR2", "Multiplying or dividing by a negative number mirrors the line, so the symbol flips."),
          tx(t, "figIneqR3", "< and > leave the boundary out (hollow circle, round bracket); ≤ and ≥ keep it (filled, square)."),
        ]}
      />
    </>
  );
}
