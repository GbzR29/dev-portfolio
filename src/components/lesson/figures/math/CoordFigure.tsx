"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// midpoint — two draggable points, their midpoint and the point a fraction t
//            of the way from A to B (the same lerp as in the ratios chapter).
// perp     — a line through A and B with its rise/run step, and the same step
//            turned a quarter turn: (run, rise) → (−rise, run). The turned
//            step is perpendicular, so its slope is −run/rise and the product
//            of the two slopes is −1.
// circle   — a circle and a line y = mx + b. Substituting the line into the
//            circle's equation gives a quadratic; its discriminant says
//            whether they cross twice, touch once (tangent) or miss.
// The lab: centre a segment on the origin, find a three-quarter point, build
// a slope and its perpendicular, and make a line touch the circle.

type Mode = "midpoint" | "perp" | "circle";
type Id = "A" | "B" | "C";
const W = 560, H = 300;
const R = 2.5;
const p = plot({ W, H, x0: -7.467, x1: 7.467, y0: -4, y1: 4 });
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
/** " + 2" or " − 2": a term with its sign as the operator. */
const plus = (v: number) => (v < 0 ? ` − ${n2(-v)}` : ` + ${n2(v)}`);
const par = (v: number) => (v < 0 ? `(${n2(v)})` : n2(v));
const snap = (q: Pt): Pt => ({ x: clamp(Math.round(p.inv(q).x * 2) / 2, -7, 7), y: clamp(Math.round(p.inv(q).y * 2) / 2, -3.5, 3.5) });
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
/** A long segment through q with direction d, clipped by the SVG itself. */
const longLine = (q: Pt, d: Pt) => ({ x1: p.X(q.x - d.x * 40), y1: p.Y(q.y - d.y * 40), x2: p.X(q.x + d.x * 40), y2: p.Y(q.y + d.y * 40) });

/** The line y = mx + b against the circle of radius R about Ctr: the quadratic in x and its roots. */
function lineCircle(Ctr: Pt, m: number, b: number) {
  // (x − h)² + (y − k)² = R² with y = m x + b: a x² + b' x + c = 0
  const h = Ctr.x, k = Ctr.y, e = b - k;
  const qa = 1 + m * m, qb = 2 * (m * e - h), qc = h * h + e * e - R * R;
  const disc = qb * qb - 4 * qa * qc;
  const xs = disc > 1e-9 ? [(-qb - Math.sqrt(disc)) / (2 * qa), (-qb + Math.sqrt(disc)) / (2 * qa)] : Math.abs(disc) <= 1e-9 ? [-qb / (2 * qa)] : [];
  return { qa, qb, qc, disc, xs };
}

// ── The drawings ──────────────────────────────────────────────────────────────

const pointLabel = (q: Pt, name: string, col: string, dy = -9) =>
  <T x={X(q) + 8} y={Y(q) + dy} size={9.5} color={col} bold>{`${name} (${n2(q.x)}, ${n2(q.y)})`}</T>;

function MidpointDrawing({ A, B, f, dragging }: { A: Pt; B: Pt; f: number; dragging: Id | null }) {
  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const P = { x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) };
  return <>
    <Grid p={p} step={1} />
    <line x1={X(A)} y1={Y(A)} x2={X(B)} y2={Y(B)} stroke={C.fg} strokeWidth={2} />
    <line x1={X(A)} y1={Y(M)} x2={X(M)} y2={Y(M)} stroke={C.sky} strokeWidth={1} strokeDasharray="3 3" />
    <line x1={X(M)} y1={Y(A)} x2={X(M)} y2={Y(M)} stroke={C.sky} strokeWidth={1} strokeDasharray="3 3" />
    <circle cx={X(M)} cy={Y(M)} r={5} fill={C.amber} />
    <circle cx={X(P)} cy={Y(P)} r={4.5} fill={C.purple} />
    {pointLabel(M, "M", C.amber, 16)}
    <T x={X(P) - 8} y={Y(P) - 8} size={9.5} anchor="end" color={C.purple} bold>{`P (${n2(P.x)}, ${n2(P.y)})`}</T>
    <Handle x={X(A)} y={Y(A)} color={C.green} active={dragging === "A"} />
    <Handle x={X(B)} y={Y(B)} color={C.pink} active={dragging === "B"} />
    {pointLabel(A, "A", C.green, 16)}
    {pointLabel(B, "B", C.pink)}
  </>;
}

function PerpDrawing({ A, B, dragging }: { A: Pt; B: Pt; dragging: Id | null }) {
  const run = B.x - A.x, rise = B.y - A.y;
  const Q = { x: B.x - rise, y: B.y + run };            // B + the turned step
  return <>
    <Grid p={p} step={1} />
    <line {...longLine(A, { x: run, y: rise })} stroke={C.sky} strokeWidth={2} />
    <line {...longLine(B, { x: -rise, y: run })} stroke={C.amber} strokeWidth={2} />
    <path d={`M${X(A)},${Y(A)} L${p.X(B.x)},${Y(A)} L${X(B)},${Y(B)}`} fill={C.sky} fillOpacity={0.12} stroke={C.sky} strokeWidth={1.2} strokeDasharray="4 3" />
    <path d={`M${X(B)},${Y(B)} L${p.X(B.x)},${p.Y(B.y + run)} L${X(Q)},${Y(Q)}`} fill={C.amber} fillOpacity={0.12} stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" />
    <T x={p.X((A.x + B.x) / 2)} y={Y(A) + (rise >= 0 ? 14 : -6)} size={9.5} anchor="middle" color={C.sky}>{`run ${n2(run)}`}</T>
    <T x={p.X(B.x) + 6} y={p.Y((A.y + B.y) / 2)} size={9.5} color={C.sky}>{`rise ${n2(rise)}`}</T>
    <Handle x={X(A)} y={Y(A)} color={C.green} active={dragging === "A"} />
    <Handle x={X(B)} y={Y(B)} color={C.pink} active={dragging === "B"} />
  </>;
}

function CircleDrawing({ Ctr, m, b, dragging }: { Ctr: Pt; m: number; b: number; dragging: Id | null }) {
  const { xs } = lineCircle(Ctr, m, b);
  return <>
    <Grid p={p} step={1} />
    <circle cx={X(Ctr)} cy={Y(Ctr)} r={R * p.sx} fill={C.sky} fillOpacity={0.08} stroke={C.sky} strokeWidth={2} />
    <line {...longLine({ x: 0, y: b }, { x: 1, y: m })} stroke={C.amber} strokeWidth={2} />
    {xs.map((x, i) => <circle key={i} cx={p.X(x)} cy={p.Y(m * x + b)} r={5} fill={C.pink} />)}
    <Handle x={X(Ctr)} y={Y(Ctr)} color={C.sky} active={dragging === "C"} />
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function CoordStage({ mode, A, B, Ctr, setA, setB, setCtr, f, m, b }: {
  mode: Mode; A: Pt; B: Pt; Ctr: Pt; setA: (v: Pt) => void; setB: (v: Pt) => void; setCtr: (v: Pt) => void; f: number; m: number; b: number;
}) {
  const drag = useDrag<Id>(
    q => mode === "circle" ? nearest(q, [["C", { x: X(Ctr), y: Y(Ctr) }]], 20)
      : nearest(q, [["A", { x: X(A), y: Y(A) }], ["B", { x: X(B), y: Y(B) }]], 20),
    (id, q) => { if (id === "A") setA(snap(q)); else if (id === "B") setB(snap(q)); else setCtr(snap(q)); });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "midpoint" ? <MidpointDrawing A={A} B={B} f={f} dragging={drag.dragging} />
        : mode === "perp" ? <PerpDrawing A={A} B={B} dragging={drag.dragging} />
          : <CircleDrawing Ctr={Ctr} m={m} b={b} dragging={drag.dragging} />}
    </svg>
  );
}

export function CoordFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("midpoint");
  const [A, setA] = useState<Pt>({ x: -4, y: -2 }), [B, setB] = useState<Pt>({ x: 3, y: 2.5 });
  const [f, setF] = useState(0.25);
  const [m, setM] = useState(0.5), [b, setB0] = useState(1);
  const [Ctr, setCtr] = useState<Pt>({ x: 1, y: 0 });
  const lab = useLab("math-coordinates");

  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const P = { x: A.x + f * (B.x - A.x), y: A.y + f * (B.y - A.y) };
  const run = B.x - A.x, rise = B.y - A.y;
  const slope = run !== 0 ? rise / run : NaN, slopeP = rise !== 0 ? -run / rise : NaN;
  const lc = lineCircle(Ctr, m, b);
  const h = Ctr.x, k = Ctr.y;
  const verdict = lc.xs.length === 2 ? tx(t, "figCo_two", "2 crossings") : lc.xs.length === 1 ? tx(t, "figCo_one", "1 point: tangent") : tx(t, "figCo_none", "no crossing");

  const stage = <CoordStage mode={mode} A={A} B={B} Ctr={Ctr} setA={setA} setB={setB} setCtr={setCtr} f={f} m={m} b={b} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["midpoint", tx(t, "figCo_mMid", "midpoint")],
    ["perp", tx(t, "figCo_mPerp", "perpendicular")],
    ["circle", tx(t, "figCo_mCircle", "line & circle")],
  ] as const} />;

  const controls = mode === "midpoint" ? <>
    <Slider label={tx(t, "figCo_t", "fraction t")} value={f} min={0} max={1} step={0.05} onChange={setF} fmt={n2} width="w-20" />
    <Row>
      <Readout color={C.amber}>{`M = ((${n2(A.x)} + ${n2(B.x)})/2, (${n2(A.y)} + ${n2(B.y)})/2) = (${n2(M.x)}, ${n2(M.y)})`}</Readout>
      <Readout color={C.purple}>{`P = A + ${n2(f)}·(B − A) = (${n2(P.x)}, ${n2(P.y)})`}</Readout>
    </Row>
  </> : mode === "perp" ? <Row>
    <Readout color={C.sky}>{`m₁ = ${n2(rise)}/${par(run)} = ${Number.isFinite(slope) ? n2(slope) : "∞"}`}</Readout>
    <Readout color={C.amber}>{`m₂ = −${par(run)}/${par(rise)} = ${Number.isFinite(slopeP) ? n2(slopeP) : "∞"}`}</Readout>
    <Readout color={C.green}>{Number.isFinite(slope) && Number.isFinite(slopeP) && slope !== 0 ? `m₁ · m₂ = ${n2(slope * slopeP)}` : tx(t, "figCo_vert", "one line is vertical")}</Readout>
  </Row> : <>
    <Sliders>
      <Slider label={tx(t, "figCo_m", "slope m")} value={m} min={-3} max={3} step={0.1} onChange={setM} fmt={n2} />
      <Slider label={tx(t, "figCo_b", "intercept b")} value={b} min={-4} max={4} step={0.1} onChange={setB0} fmt={n2} />
    </Sliders>
    <Row>
      <Readout color={C.sky}>{`(x${plus(-h)})² + (y${plus(-k)})² = ${n2(R * R)}`}</Readout>
      <Readout color={C.amber}>{`y = ${n2(m)}x${plus(b)}`}</Readout>
      <Readout>{`${n2(lc.qa)}x²${plus(lc.qb)}x${plus(lc.qc)} = 0`}</Readout>
      <Readout color={C.pink}>{`Δ = ${n2(lc.disc)} → ${verdict}`}</Readout>
    </Row>
  </>;
  const note = mode === "midpoint"
    ? tx(t, "figCo_noteM", "Drag A and B. The midpoint M is the average of the two points, coordinate by coordinate: its x is halfway between the two x values, its y halfway between the two y values (the dashed lines). The purple point is a fraction t of the way from A to B; t = 0.5 is the midpoint, t = 0 is A and t = 1 is B.")
    : mode === "perp"
      ? tx(t, "figCo_noteP", "The blue line goes through A and B; its step from A to B is run across and rise up (the blue triangle). Turn that triangle a quarter turn about B and you get the amber one: its run is −rise and its rise is run. The turned step is at 90° to the first, so the amber line is perpendicular to the blue one. Its slope is run/(−rise), the negative reciprocal, and the two slopes multiply to −1.")
      : tx(t, "figCo_noteC", "Drag the centre and change the line. Putting y = mx + b into the circle's equation leaves one unknown, x, in a quadratic. Its discriminant Δ decides everything: positive, the line cuts the circle at two points; zero, it touches at exactly one (a tangent); negative, the line misses. This is the same test as a ray against a sphere in the quadratics chapter.");

  // ── Lab ──
  const near = (u: number, v: number) => Math.abs(u - v) < 1e-9;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCoL1_t", "Centre it"),
      body: <>
        <p>{tx(t, "figCoL1_b1", "The amber midpoint M is the average of A and B, one coordinate at a time.")}</p>
        <p>{tx(t, "figCoL1_b2", "Drag A and B so that M lands exactly on the origin, (0, 0).")}</p>
      </>,
      goal: { text: tx(t, "figCoL1_g", "M = (0, 0)."), done: mode === "midpoint" && M.x === 0 && M.y === 0 },
      hint: tx(t, "figCoL1_h", "Make B the mirror of A through the origin: if A = (−4, −2), put B at (4, 2)."),
      setup: () => { setMode("midpoint"); setA({ x: -4, y: -2 }); setB({ x: 3, y: 2.5 }); setF(0.25); },
    },
    {
      title: tx(t, "figCoL2_t", "Quick check"),
      body: <p>{tx(t, "figCoL2_b", "Average the x values, then the y values.")}</p>,
      quiz: {
        q: tx(t, "figCoL2_q", "What is the midpoint of (2, 5) and (8, −1)?"),
        options: ["(5, 2)", "(3, 3)", "(6, −6)", "(10, 4)"],
        answer: 0,
        why: tx(t, "figCoL2_w", "((2 + 8)/2, (5 + (−1))/2) = (5, 2). (6, −6) is the step from one to the other, B − A."),
      },
    },
    {
      title: tx(t, "figCoL3_t", "Three quarters of the way"),
      body: <p>{tx(t, "figCoL3_b", "The purple point P sits a fraction t of the way from A to B. Move it three quarters of the way along.")}</p>,
      goal: { text: tx(t, "figCoL3_g", "t = 0.75."), done: mode === "midpoint" && near(f, 0.75) },
    },
    {
      title: tx(t, "figCoL4_t", "A slope of 2"),
      body: <>
        <p>{tx(t, "figCoL4_b1", "The blue line rises by rise for every run across: its slope is rise / run. The amber line is the same step turned a quarter turn.")}</p>
        <p>{tx(t, "figCoL4_b2", "Drag A or B until the blue slope is exactly 2. Then read off the amber slope.")}</p>
      </>,
      goal: { text: tx(t, "figCoL4_g", "m₁ = 2."), done: mode === "perp" && run !== 0 && near(rise / run, 2) },
      hint: tx(t, "figCoL4_h", "1 across and 2 up, or 2 across and 4 up."),
      setup: () => { setMode("perp"); setA({ x: -2, y: -1 }); setB({ x: 2, y: 1 }); },
    },
    {
      title: tx(t, "figCoL5_t", "Quick check"),
      body: <p>{tx(t, "figCoL5_b", "Perpendicular slopes multiply to −1.")}</p>,
      quiz: {
        q: tx(t, "figCoL5_q", "A line has slope 2/3. What is the slope of a line perpendicular to it?"),
        options: ["−3/2", "3/2", "−2/3", "2/3"],
        answer: 0,
        why: tx(t, "figCoL5_w", "Flip the fraction and change its sign: −3/2. Check: (2/3) · (−3/2) = −1."),
      },
    },
    {
      title: tx(t, "figCoL6_t", "Just touching"),
      body: <>
        <p>{tx(t, "figCoL6_b1", "Substituting the line into the circle gives a quadratic in x. Its discriminant Δ counts the crossings.")}</p>
        <p>{tx(t, "figCoL6_b2", "Make the line touch the circle at exactly one point: Δ = 0.")}</p>
      </>,
      goal: { text: tx(t, "figCoL6_g", "A tangent: one crossing."), done: mode === "circle" && lc.xs.length === 1 },
      hint: tx(t, "figCoL6_h", "The easiest tangent is flat: slope m = 0, and b exactly 2.5 above (or below) the centre's height."),
      setup: () => { setMode("circle"); setCtr({ x: 1, y: 0 }); setM(0.5); setB0(1); },
    },
    {
      title: tx(t, "figCoL7_t", "Quick check"),
      body: <p>{tx(t, "figCoL7_b", "A game casts a ray at a ball and gets a negative discriminant.")}</p>,
      quiz: {
        q: tx(t, "figCoL7_q", "What does that mean?"),
        options: [tx(t, "figCoL7_o1", "the ray misses the ball"), tx(t, "figCoL7_o2", "the ray hits it twice"), tx(t, "figCoL7_o3", "the ray grazes it"), tx(t, "figCoL7_o4", "the ray starts inside")],
        answer: 0,
        why: tx(t, "figCoL7_w", "A negative Δ means the quadratic has no real solution: no x where the ray is on the ball. Zero would be a graze, positive two hits (in and out)."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "half", tone: "ok", when: mode === "midpoint" && near(f, 0.5),
      title: tx(t, "figCoI1_t", "t = 0.5 is the midpoint"),
      body: tx(t, "figCoI1_b", "Half of the way from A to B is the average of A and B: the purple point sits on top of M."),
    },
    {
      id: "vert", tone: "warn", when: mode === "perp" && (run === 0 || rise === 0),
      title: tx(t, "figCoI2_t", "A vertical line"),
      body: tx(t, "figCoI2_b", "One of the two lines is vertical: its run is 0, and dividing by 0 gives no slope. The lines are still perpendicular; only the rule m₁ · m₂ = −1 has nothing to multiply."),
    },
    {
      id: "tangent", tone: "ok", when: mode === "circle" && lc.xs.length === 1,
      title: tx(t, "figCoI3_t", "A tangent"),
      body: tx(t, "figCoI3_b", "Δ = 0: the quadratic has one double root, so the line touches the circle at one point. There it is perpendicular to the radius."),
    },
    {
      id: "miss", tone: "info", when: mode === "circle" && lc.xs.length === 0,
      title: tx(t, "figCoI4_t", "A miss"),
      body: fill(tx(t, "figCoI4_b", "Δ = {d} is negative: the quadratic has no real roots, so the line never meets the circle."), { d: n2(lc.disc) }),
    },
  ];

  const title = tx(t, "figCo_title", "Geometry with coordinates");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figCoR1", "The midpoint is the average of the coordinates; A + t(B − A) is the point a fraction t of the way."),
          tx(t, "figCoR2", "Perpendicular slopes are negative reciprocals: m₁ · m₂ = −1."),
          tx(t, "figCoR3", "A line meets a circle where a quadratic is zero: Δ > 0 two points, Δ = 0 a tangent, Δ < 0 none."),
        ]}
      />
    </>
  );
}
