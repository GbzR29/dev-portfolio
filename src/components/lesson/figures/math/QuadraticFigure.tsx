"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A parabola y = ax² + bx + c with its vertex, axis of symmetry and roots.
// The discriminant Δ = b² − 4ac decides how many times it crosses y = 0:
// two roots (Δ > 0), one touching root (Δ = 0) or none (Δ < 0). The quadratic
// formula places the roots at the vertex's x ± √Δ / (2a).
// The lab lifts the parabola off the axis, finds the touching point, turns it
// over and breaks it with a = 0.

const P = plot({ W: 560, H: 280, x0: -7, x1: 7, y0: -5, y1: 5 });

export function QuadraticFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState(0.5);
  const [b, setB] = useState(-1);
  const [c, setC] = useState(-2);
  const lab = useLab("math-quadratic");
  const disc = b * b - 4 * a * c;
  const aOk = Math.abs(a) > 1e-6;
  const vx = aOk ? -b / (2 * a) : 0, vy = a * vx * vx + b * vx + c;
  const roots = !aOk ? (Math.abs(b) > 1e-6 ? [-c / b] : []) : disc > 1e-9 ? [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)] : Math.abs(disc) <= 1e-9 ? [vx] : [];
  const col = disc > 1e-9 ? C.green : Math.abs(disc) <= 1e-9 ? C.amber : C.red;
  const set = (na: number, nb: number, nc: number) => { setA(na); setB(nb); setC(nc); };

  const stage = (
    <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      <Grid p={P} step={1} />
      {aOk && <line x1={P.X(vx)} x2={P.X(vx)} y1={0} y2={P.H} stroke={C.purple} strokeDasharray="4 4" opacity={0.6} />}
      <path d={fnPath(P, x => a * x * x + b * x + c, P.x0, P.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
      {aOk && <circle cx={P.X(vx)} cy={P.Y(vy)} r={5} fill={C.purple} />}
      {roots.length === 2 && aOk && (
        <g>
          <line x1={P.X(roots[0])} x2={P.X(roots[1])} y1={P.Y(0) + 16} y2={P.Y(0) + 16} stroke={C.green} strokeWidth={1.2} />
          <T x={P.X(vx)} y={P.Y(0) + 28} size={9} anchor="middle" color={C.green}>{`√Δ / |a| = ${f2(Math.sqrt(disc) / Math.abs(a))}`}</T>
        </g>
      )}
      {roots.map((r, i) => <circle key={i} cx={P.X(r)} cy={P.Y(0)} r={5.5} fill={col} stroke="var(--code-bg)" strokeWidth={1.5} />)}
    </svg>
  );

  const controls = <>
    <Sliders>
      <Slider label="a" value={a} min={-2} max={2} step={0.05} onChange={setA} />
      <Slider label="b" value={b} min={-5} max={5} step={0.1} onChange={setB} />
      <Slider label="c" value={c} min={-5} max={5} step={0.1} onChange={setC} />
    </Sliders>
    <Row>
      <Readout>y = {f2(a)}x² {b < 0 ? "−" : "+"} {f2(Math.abs(b))}x {c < 0 ? "−" : "+"} {f2(Math.abs(c))}</Readout>
      <Readout color={col}>Δ = b² − 4ac = {f2(disc)}</Readout>
      {aOk && <Readout color={C.purple}>{tx(t, "figQuad_vertex", "vertex")} ({f2(vx)}, {f2(vy)})</Readout>}
      <Readout color={col}>{roots.length === 0 ? tx(t, "figQuad_none", "no real roots") : `x = ${roots.map(r => f2(r)).join(", ")}`}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figQuadL1_t", "Lift it off the axis"),
      body: <>
        <p>{tx(t, "figQuadL1_b1", "The parabola crosses the x axis twice: two roots, and Δ = b² − 4ac is positive.")}</p>
        <p>{tx(t, "figQuadL1_b2", "c moves the whole curve up and down. Raise it until it no longer touches the axis.")}</p>
      </>,
      goal: { text: tx(t, "figQuadL1_g", "No real roots."), done: disc < -1e-9 },
      setup: () => set(0.5, -1, -2),
    },
    {
      title: tx(t, "figQuadL2_t", "Just touching"),
      body: <p>{tx(t, "figQuadL2_b", "Somewhere between two roots and none, the curve only touches the axis at its vertex. Find that exact c: Δ must be 0.")}</p>,
      goal: { text: tx(t, "figQuadL2_g", "Δ = 0."), done: Math.abs(disc) <= 1e-9 && aOk },
      hint: tx(t, "figQuadL2_h", "With a = 0.5 and b = −1, Δ = 1 − 2c. That is 0 when c = 0.5."),
      setup: () => set(0.5, -1, 1),
    },
    {
      title: tx(t, "figQuadL3_t", "Quick check"),
      body: <p>{tx(t, "figQuadL3_b", "Compute the discriminant before solving anything.")}</p>,
      quiz: {
        q: tx(t, "figQuadL3_q", "How many real roots has x² − 4x + 4 = 0?"),
        options: [tx(t, "figQuadL3_o1", "one"), tx(t, "figQuadL3_o2", "two"), tx(t, "figQuadL3_o3", "none"), tx(t, "figQuadL3_o4", "four")],
        answer: 0,
        why: tx(t, "figQuadL3_w", "Δ = (−4)² − 4·1·4 = 16 − 16 = 0: one root, x = 2. Indeed x² − 4x + 4 = (x − 2)²."),
      },
    },
    {
      title: tx(t, "figQuadL4_t", "A hill"),
      body: <p>{tx(t, "figQuadL4_b", "Make a negative: the parabola opens downwards. Then adjust c so that the hill crosses the axis twice.")}</p>,
      goal: { text: tx(t, "figQuadL4_g", "a < 0 and two roots."), done: a < -1e-6 && disc > 1e-9 },
      setup: () => set(0.5, 0, 1),
    },
    {
      title: tx(t, "figQuadL5_t", "Break it: a = 0"),
      body: <p>{tx(t, "figQuadL5_b", "Drag a to exactly 0. What happens to the curve, and to the formula x = (−b ± √Δ)/(2a)?")}</p>,
      goal: { text: tx(t, "figQuadL5_g", "Set a = 0."), done: !aOk },
      setup: () => set(1, 2, -1),
    },
    {
      title: tx(t, "figQuadL6_t", "Quick check"),
      body: <p>{tx(t, "figQuadL6_b", "The roots sit symmetrically around the vertex.")}</p>,
      quiz: {
        q: tx(t, "figQuadL6_q", "A parabola has roots 1 and 5. Where is its vertex's x?"),
        options: ["3", "6", "2", "5"],
        answer: 0,
        why: tx(t, "figQuadL6_w", "The axis of symmetry is halfway between the roots: (1 + 5)/2 = 3. In the formula, the roots are −b/(2a) ± √Δ/(2a), centred on −b/(2a)."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "lin", tone: "warn", when: !aOk,
      title: tx(t, "figQuadI1_t", "Not a quadratic any more"),
      body: tx(t, "figQuadI1_b", "With a = 0 the x² term is gone and the curve is a straight line, bx + c, with one root −c/b. The quadratic formula would divide by 2a = 0: it only works when a ≠ 0."),
    },
    {
      id: "none", tone: "warn", when: aOk && disc < -1e-9,
      title: tx(t, "figQuadI2_t", "√ of a negative"),
      body: fill(tx(t, "figQuadI2_b", "Δ = {d} is negative, so √Δ is not a real number: the parabola never meets the axis. (The Complex Numbers chapter gives these roots a meaning.)"), { d: f2(disc) }),
    },
    {
      id: "touch", tone: "ok", when: aOk && Math.abs(disc) <= 1e-9,
      title: tx(t, "figQuadI3_t", "The two roots merge"),
      body: fill(tx(t, "figQuadI3_b", "Δ = 0, so ±√Δ adds nothing: both roots equal −b/(2a) = {v}. The vertex sits exactly on the axis."), { v: f2(vx) }),
    },
    {
      id: "two", tone: "info", when: aOk && disc > 1e-9,
      title: tx(t, "figQuadI4_t", "Symmetric around the vertex"),
      body: fill(tx(t, "figQuadI4_b", "Both roots are √Δ/(2|a|) = {s} away from the vertex at x = {v}: one on each side."), { s: f2(Math.sqrt(disc) / (2 * Math.abs(a))), v: f2(vx) }),
    },
  ];

  const title = tx(t, "figQuad_title", "Quadratics, the discriminant and the roots");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<LabButton lab={lab} t={t} />}
        controls={controls}
        note={tx(t, "figQuad_note", "a sets how wide the parabola is and whether it opens up (a > 0) or down (a < 0). The vertex, the turning point, sits at x = −b/(2a). The roots are where the curve meets the x axis; they sit symmetrically around the vertex, √Δ/(2a) to each side. Slide c up until the curve lifts off the axis: at the exact moment Δ reaches 0 the two roots merge into one, and beyond it they would need the square root of a negative number, so there are none. Ray tracing asks this exact question for a ray and a sphere: two roots mean the ray enters and leaves, one means it grazes, none means it misses.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={controls}
        recap={[
          tx(t, "figQuadR1", "Δ = b² − 4ac counts the roots: positive two, zero one, negative none."),
          tx(t, "figQuadR2", "The roots sit symmetrically around the vertex x = −b/(2a), √Δ/(2|a|) to each side."),
          tx(t, "figQuadR3", "a > 0 opens upwards, a < 0 downwards; with a = 0 it is a line and the formula does not apply."),
        ]}
      />
    </>
  );
}
