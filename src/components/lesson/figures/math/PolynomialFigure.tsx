"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, plot, Grid, fnPath, useDrag, nearest, clamp } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A polynomial built from its roots: p(x) = a(x − r₁)(x − r₂)…(x − rₙ).
// Drag the roots along the x axis; the curve always passes through zero at
// each of them. Where two roots meet (a double root) the curve touches the
// axis instead of crossing it. The expanded form shows the coefficients the
// factors multiply out to, and the leading coefficient a with the degree
// decides where the ends of the curve go.
// The lab: a root at 0, a double and a triple root, and the end behaviour.

type Deg = "1" | "2" | "3" | "4";
const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(2)).toString().replace("-", "−");
const SUP = ["", "", "²", "³", "⁴"];
const P = plot({ W: 560, H: 280, x0: -5.5, x1: 5.5, y0: -5.5, y1: 5.5 });

/** Coefficients (highest power first) of a·∏(x − r). */
function expand(a: number, roots: number[]) {
  let c = [a];
  for (const r of roots) {
    const next = new Array(c.length + 1).fill(0);
    c.forEach((v, i) => { next[i] += v; next[i + 1] -= v * r; });
    c = next;
  }
  return c;
}

function expandedText(c: number[]) {
  const deg = c.length - 1;
  const parts: string[] = [];
  c.forEach((v, i) => {
    const p = deg - i;
    if (Math.abs(v) < 1e-9) return;
    const abs = Math.abs(v);
    const coef = abs === 1 && p > 0 ? "" : n(abs);
    const body = `${coef}${p > 0 ? "x" : ""}${SUP[p] ?? ""}`;
    parts.push(parts.length ? `${v < 0 ? " − " : " + "}${body}` : `${v < 0 ? "−" : ""}${body}`);
  });
  return parts.join("") || "0";
}

/** How many times each root value appears. */
function multiplicities(roots: number[]) {
  const counts = new Map<number, number>();
  roots.forEach(r => counts.set(r, (counts.get(r) ?? 0) + 1));
  return counts;
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function PolyStage({ roots, a, setAll }: { roots: number[]; a: number; setAll: (f: (old: number[]) => number[]) => void }) {
  const drag = useDrag<number>(
    q => nearest(q, roots.map((r, i) => [i, { x: P.X(r), y: P.Y(0) }] as [number, { x: number; y: number }]), 20),
    (i, q) => setAll(old => old.map((r, j) => (j === i ? clamp(Math.round(P.inv(q).x * 4) / 4, -5, 5) : r))));
  const f = (x: number) => roots.reduce((acc, r) => acc * (x - r), a);
  const counts = multiplicities(roots);
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      <Grid p={P} step={1} />
      <path d={fnPath(P, f, P.x0, P.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      {roots.map((r, i) => <Handle key={i} x={P.X(r)} y={P.Y(0)} color={(counts.get(r) ?? 0) > 1 ? C.pink : C.amber} active={drag.dragging === i} />)}
      <T x={P.X(0) + 6} y={P.Y(clamp(f(0), P.y0, P.y1)) - 6} size={9} color={C.muted}>{`p(0) = ${n(f(0))}`}</T>
    </svg>
  );
}

export function PolynomialFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState<Deg>("3");
  const [all, setAll] = useState([-2.5, 0.5, 2.5, 4]);
  const [a, setA] = useState(0.5);
  const lab = useLab("math-polynomial");
  const roots = all.slice(0, Number(deg));

  const coef = expand(a, roots);
  const factored = `${a === 1 ? "" : n(a)}${roots.map(r => `(x ${r < 0 ? "+" : "−"} ${n(Math.abs(r))})`).join("")}`;
  const counts = multiplicities(roots);
  const maxMult = Math.max(...counts.values());
  const d = roots.length;
  const leftUp = (d % 2 === 0) === (a > 0);
  const rightUp = a > 0;
  const p0 = coef[coef.length - 1];
  const set = (nd: Deg, rs: number[], na: number) => { setDeg(nd); setAll(rs); setA(na); };

  const stage = <PolyStage roots={roots} a={a} setAll={setAll} />;
  const degChoice = <Choice value={deg} onChange={setDeg} options={[["1", tx(t, "figPoly_d1", "degree 1")], ["2", "2"], ["3", "3"], ["4", "4"]] as const} />;
  const controls = <>
    <Slider label={tx(t, "figPoly_lead", "leading a")} value={a} min={-1.5} max={1.5} step={0.05} onChange={v => setA(Math.abs(v) < 0.05 ? 0.05 : v)} fmt={n} />
    <Row>
      <Readout color={C.amber}>p(x) = {factored}</Readout>
      <Readout>= {expandedText(coef)}</Readout>
    </Row>
    <Row>
      <Readout color={C.muted}>{`${tx(t, "figPoly_ends", "ends:")} ${leftUp ? "↖" : "↙"} … ${rightUp ? "↗" : "↘"}`}</Readout>
      {[...counts].filter(([, k]) => k > 1).map(([r, k]) => (
        <Readout key={r} color={C.pink}>{`x = ${n(r)}: ${k === 2 ? tx(t, "figPoly_double", "double root, touches") : tx(t, "figPoly_multi", "root of multiplicity") + " " + k}`}</Readout>
      ))}
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPolyL1_t", "A root at the origin"),
      body: <>
        <p>{tx(t, "figPolyL1_b1", "Each amber handle is a root r: the factor (x − r) is 0 there, so the whole product is 0.")}</p>
        <p>{tx(t, "figPolyL1_b2", "Drag a root onto x = 0 and watch the constant term of the expanded form.")}</p>
      </>,
      goal: { text: tx(t, "figPolyL1_g", "A root at x = 0."), done: roots.includes(0) },
      setup: () => set("3", [-2.5, 0.5, 2.5, 4], 0.5),
    },
    {
      title: tx(t, "figPolyL2_t", "Touch, don't cross"),
      body: <p>{tx(t, "figPolyL2_b", "Drag two roots onto the same spot. Look closely at how the curve meets the axis there.")}</p>,
      goal: { text: tx(t, "figPolyL2_g", "A double root."), done: maxMult === 2 },
      setup: () => set("3", [-2.5, 0.5, 2.5, 4], 0.5),
    },
    {
      title: tx(t, "figPolyL3_t", "Quick check"),
      body: <p>{tx(t, "figPolyL3_b", "Think about the sign of a squared factor.")}</p>,
      quiz: {
        q: tx(t, "figPolyL3_q", "At x = 2, the graph of (x − 2)²(x + 1)…"),
        options: [tx(t, "figPolyL3_o1", "touches the axis and turns back"), tx(t, "figPolyL3_o2", "crosses the axis"), tx(t, "figPolyL3_o3", "does not reach the axis"), tx(t, "figPolyL3_o4", "has a gap")],
        answer: 0,
        why: tx(t, "figPolyL3_w", "(x − 2)² is never negative, so near x = 2 the sign of p does not change: the curve comes down to 0 and goes back up the same side."),
      },
    },
    {
      title: tx(t, "figPolyL4_t", "Three in one spot"),
      body: <p>{tx(t, "figPolyL4_b", "Stack all three roots of the cubic on one point. Does the curve touch or cross now?")}</p>,
      goal: { text: tx(t, "figPolyL4_g", "A triple root."), done: deg === "3" && maxMult === 3 },
      setup: () => set("3", [-2, 0, 2, 4], 0.5),
    },
    {
      title: tx(t, "figPolyL5_t", "Where the ends go"),
      body: <p>{tx(t, "figPolyL5_b", "Far from the origin only the leading term ax⁴ matters. Choose degree 4 and make both ends point down.")}</p>,
      goal: { text: tx(t, "figPolyL5_g", "Degree 4, both ends down."), done: deg === "4" && a < 0 },
      setup: () => set("3", [-3, -1, 1, 3], 0.5),
    },
    {
      title: tx(t, "figPolyL6_t", "Quick check"),
      body: <p>{tx(t, "figPolyL6_b", "Set x = 0 in the factored form.")}</p>,
      quiz: {
        q: tx(t, "figPolyL6_q", "What is the constant term of (x − 1)(x − 2)(x − 3)?"),
        options: ["−6", "6", "−1", "0"],
        answer: 0,
        why: tx(t, "figPolyL6_w", "The constant term is p(0) = (−1)(−2)(−3) = −6: the product of the roots with their signs flipped, times a."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "zero", tone: "info", when: roots.includes(0),
      title: tx(t, "figPolyI1_t", "Constant term 0"),
      body: tx(t, "figPolyI1_b", "A root at 0 makes the factor (x − 0) = x, so every term of the expanded form contains x and the constant term disappears: p(0) = 0."),
    },
    {
      id: "double", tone: "ok", when: maxMult === 2,
      title: tx(t, "figPolyI2_t", "A double root touches"),
      body: tx(t, "figPolyI2_b", "The squared factor (x − r)² is never negative, so p keeps its sign on both sides of r: the curve touches the axis and turns back."),
    },
    {
      id: "triple", tone: "ok", when: maxMult >= 3,
      title: tx(t, "figPolyI3_t", "A triple root crosses, flat"),
      body: tx(t, "figPolyI3_b", "(x − r)³ does change sign, like x³, so the curve crosses the axis, but it flattens out as it passes: odd multiplicity crosses, even multiplicity touches."),
    },
    {
      id: "const", tone: "info", when: !roots.includes(0),
      title: tx(t, "figPolyI4_t", "Where the curve meets the y axis"),
      body: fill(tx(t, "figPolyI4_b", "p(0) = {p}: the leading coefficient times every root with its sign flipped. It is the constant term of the expanded form."), { p: n(p0) }),
    },
  ];

  const title = tx(t, "figPoly_title", "A polynomial from its roots");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{degChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figPoly_note", "Each amber handle is a root: drag it along the axis and the curve follows, always passing through zero there, because one factor (x − r) becomes 0. Drag two roots onto the same spot: the curve now touches the axis and turns back instead of crossing it (a double root). Change the degree and the sign of a to see the ends: an even degree sends both ends the same way, an odd degree sends them opposite ways. The expanded form below the factored one is the same polynomial multiplied out.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{degChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figPolyR1", "Every root r gives a factor (x − r), and the curve passes through 0 there."),
          tx(t, "figPolyR2", "Odd multiplicity crosses the axis, even multiplicity touches it and turns back."),
          tx(t, "figPolyR3", "The leading term decides the ends: even degree same way, odd degree opposite ways."),
        ]}
      />
    </>
  );
}
