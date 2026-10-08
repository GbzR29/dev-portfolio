"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Every graph transformation is one of four knobs in y = a·f(b·(x − c)) + d:
//   c shifts right, d shifts up, a stretches vertically (negative flips it),
//   b squeezes horizontally (negative mirrors it). The dashed curve is the
//   untouched f; the solid one is the transformed version.
// The lab turns the knobs one at a time, then asks for a target placement.

const BASES: Record<string, { f: (x: number) => number; label: string }> = {
  square: { f: x => x * x, label: "x²" },
  cube: { f: x => x * x * x, label: "x³" },
  abs: { f: x => Math.abs(x), label: "|x|" },
  sqrt: { f: x => (x >= 0 ? Math.sqrt(x) : NaN), label: "√x" },
  sin: { f: x => Math.sin(x), label: "sin x" },
  recip: { f: x => (Math.abs(x) < 1e-3 ? NaN : 1 / x), label: "1/x" },
  step: { f: x => (x < 0 ? 0 : 1), label: "step(x)" },
  smooth: { f: x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }, label: "smoothstep(x)" },
};
const P = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const near = (v: number, w: number) => Math.abs(v - w) < 1e-6;

export function FunctionFigure({ t }: { t?: TrackTranslations }) {
  const [base, setBase] = useState("square");
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(0);
  const lab = useLab("math-graph-moves");
  const f = BASES[base].f;
  const g = (x: number) => a * f(b * (x - c)) + d;
  const sgn = (v: number) => (v < 0 ? "−" : "+");
  const set = (nb: string, na: number, nbb: number, nc: number, nd: number) => { setBase(nb); setA(na); setB(nbb); setC(nc); setD(nd); };

  const stage = (
    <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      <Grid p={P} step={1} />
      <path d={fnPath(P, f, P.x0, P.x1, 600)} fill="none" stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 4" />
      <path d={fnPath(P, g, P.x0, P.x1, 600)} fill="none" stroke={C.pink} strokeWidth={2.4} />
      {/* the image of f's origin point (0, f(0)) */}
      {Number.isFinite(f(0)) && Math.abs(b) > 1e-6 && (
        <g>
          <circle cx={P.X(0)} cy={P.Y(f(0))} r={3.5} fill={C.muted} />
          <circle cx={P.X(c)} cy={P.Y(a * f(0) + d)} r={4.5} fill={C.pink} />
          <line x1={P.X(0)} y1={P.Y(f(0))} x2={P.X(c)} y2={P.Y(a * f(0) + d)} stroke={C.pink} strokeDasharray="2 3" opacity={0.6} />
        </g>
      )}
      <T x={8} y={14} size={9} color={C.muted}>{`- - f(x) = ${BASES[base].label}`}</T>
      <T x={8} y={27} size={9} color={C.pink}>{tx(t, "figFunc_trans", "—— transformed")}</T>
    </svg>
  );

  const controls = <>
    <Row>{Object.entries(BASES).map(([k, v]) => <Btn key={k} active={base === k} onClick={() => setBase(k)}>{v.label}</Btn>)}</Row>
    <Sliders>
      <Slider label={<span style={{ color: C.red }}>a · {tx(t, "figFunc_vert", "vertical")}</span>} value={a} min={-3} max={3} step={0.05} onChange={setA} width="w-28" />
      <Slider label={<span style={{ color: C.amber }}>b · {tx(t, "figFunc_horiz", "horizontal")}</span>} value={b} min={-3} max={3} step={0.05} onChange={setB} width="w-28" />
      <Slider label={<span style={{ color: C.green }}>c · {tx(t, "figFunc_shiftX", "shift x")}</span>} value={c} min={-5} max={5} step={0.1} onChange={setC} width="w-28" />
      <Slider label={<span style={{ color: C.sky }}>d · {tx(t, "figFunc_shiftY", "shift y")}</span>} value={d} min={-3} max={3} step={0.1} onChange={setD} width="w-28" />
    </Sliders>
    <Row>
      <Readout>y = {f2(a)} · {BASES[base].label.replace("x", `(${f2(b)}(x ${sgn(-c)} ${f2(Math.abs(c))}))`)} {sgn(d)} {f2(Math.abs(d))}</Readout>
      <Btn onClick={() => { setA(1); setB(1); setC(0); setD(0); }}>↻ reset</Btn>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figFuncL1_t", "Lift the curve"),
      body: <>
        <p>{tx(t, "figFuncL1_b1", "The dashed curve is f(x) = x². The pink one is the transformed curve; right now they are the same.")}</p>
        <p>{tx(t, "figFuncL1_b2", "d is added to every output. Move the whole parabola up by 2.")}</p>
      </>,
      goal: { text: tx(t, "figFuncL1_g", "d = 2."), done: base === "square" && near(d, 2) },
      setup: () => set("square", 1, 1, 0, 0),
    },
    {
      title: tx(t, "figFuncL2_t", "Slide it right"),
      body: <>
        <p>{tx(t, "figFuncL2_b1", "c changes the input: the formula reads f(x − c). Move the parabola 3 to the right and look at the formula in the readout.")}</p>
      </>,
      goal: { text: tx(t, "figFuncL2_g", "Vertex at x = 3."), done: base === "square" && near(c, 3) },
      hint: tx(t, "figFuncL2_h", "The pink dot is where f's lowest point went. Drag c until it sits above 3."),
      setup: () => set("square", 1, 1, 0, 0),
    },
    {
      title: tx(t, "figFuncL3_t", "Quick check"),
      body: <p>{tx(t, "figFuncL3_b", "Inside the function, the shift works in reverse.")}</p>,
      quiz: {
        q: tx(t, "figFuncL3_q", "y = (x + 2)² is the graph of x² moved…"),
        options: [tx(t, "figFuncL3_o1", "2 to the left"), tx(t, "figFuncL3_o2", "2 to the right"), tx(t, "figFuncL3_o3", "2 up"), tx(t, "figFuncL3_o4", "2 down")],
        answer: 0,
        why: tx(t, "figFuncL3_w", "(x + 2)² = (x − (−2))², so c = −2. The lowest point is where x + 2 = 0, at x = −2: two to the left."),
      },
    },
    {
      title: tx(t, "figFuncL4_t", "Upside down"),
      body: <p>{tx(t, "figFuncL4_b", "a multiplies every height. Pick √x and make a negative: every point goes to the other side of the x axis.")}</p>,
      goal: { text: tx(t, "figFuncL4_g", "√x with a negative a."), done: base === "sqrt" && a < 0 },
      setup: () => set("sqrt", 1, 1, 0, 0),
    },
    {
      title: tx(t, "figFuncL5_t", "Twice as fast"),
      body: <p>{tx(t, "figFuncL5_b", "b multiplies the input. Pick sin x and set b = 2: the wave goes through its cycle twice as fast, so each cycle is half as wide.")}</p>,
      goal: { text: tx(t, "figFuncL5_g", "sin x with b = 2."), done: base === "sin" && near(b, 2) },
      setup: () => set("sin", 1, 1, 0, 0),
    },
    {
      title: tx(t, "figFuncL6_t", "Break it: b = 0"),
      body: <p>{tx(t, "figFuncL6_b", "Now drag b all the way to 0. What can f still see?")}</p>,
      goal: { text: tx(t, "figFuncL6_g", "Set b = 0."), done: near(b, 0) },
      setup: () => set("sin", 1, 1, 0, 0.5),
    },
    {
      title: tx(t, "figFuncL7_t", "Place it yourself"),
      body: <p>{tx(t, "figFuncL7_b", "Put the vertex of the parabola at (2, 1), opening downwards. Use as many knobs as you need.")}</p>,
      goal: { text: tx(t, "figFuncL7_g", "Vertex at (2, 1), opening down."), done: base === "square" && near(c, 2) && near(d, 1) && a < 0 },
      hint: tx(t, "figFuncL7_h", "c moves it sideways, d up, and a negative a turns it over."),
      setup: () => set("square", 1, 1, 0, 0),
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "warn", when: near(b, 0),
      title: tx(t, "figFuncI1_t", "f only ever sees 0"),
      body: fill(tx(t, "figFuncI1_b", "With b = 0 the input to f is 0 · (x − c) = 0 for every x. The output is always a·f(0) + d, so the graph is the flat line y = {y}."), { y: f2(a * f(0) + d) }),
    },
    {
      id: "flip", tone: "info", when: a < 0,
      title: tx(t, "figFuncI2_t", "Flipped over the axis"),
      body: tx(t, "figFuncI2_b", "A negative a makes every positive height negative and the other way round: the graph is mirrored across the x axis."),
    },
    {
      id: "mirror", tone: "info", when: b < 0 && !near(b, 0),
      title: tx(t, "figFuncI3_t", "Mirrored left–right"),
      body: tx(t, "figFuncI3_b", "A negative b feeds f the opposite input: what f showed at x now appears at −x. For an even function like x² or |x| nothing visible changes."),
    },
    {
      id: "squeeze", tone: "info", when: Math.abs(b) > 1.05,
      title: tx(t, "figFuncI4_t", "Squeezed, not stretched"),
      body: fill(tx(t, "figFuncI4_b", "b = {b} feeds f numbers {b} times bigger, so everything happens {b} times sooner: the curve is {b} times narrower."), { b: f2(Math.abs(b)) }),
    },
    {
      id: "shift", tone: "ok", when: Math.abs(c) > 0.05 && near(b, 1),
      title: tx(t, "figFuncI5_t", "Why the minus sign"),
      body: fill(tx(t, "figFuncI5_b", "At x = {c} the input to f is {c} − {c} = 0, so the pink curve shows there what the dashed one shows at 0. Subtracting c moves the graph right by c."), { c: f2(c) }),
    },
  ];

  const title = tx(t, "figFunc_title", "Moving and stretching a graph");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={controls}
        note={tx(t, "figFunc_note", "Move one slider at a time. d and c move the whole curve, up and right; c appears with a minus sign because to see at x what f showed at 0, you need x − c = 0, that is x = c. a scales heights: a = 2 makes it twice as tall, a = −1 flips it upside down. b scales the input: b = 2 makes everything happen twice as fast, so the curve is squeezed to half its width, and b = −1 mirrors it left–right. The same four knobs appear everywhere: a wave's amplitude and frequency, remapping a range, positioning an easing curve.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={controls}
        recap={[
          tx(t, "figFuncR1", "Outside f, the knobs act as expected: d moves the graph up, a scales heights (negative flips it)."),
          tx(t, "figFuncR2", "Inside f, they act in reverse: f(x − c) moves right by c, f(bx) is b times narrower."),
          tx(t, "figFuncR3", "To place a curve, track one point: f's (0, f(0)) lands at (c, a·f(0) + d)."),
        ]}
      />
    </>
  );
}
