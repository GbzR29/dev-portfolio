"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T, Vec, Handle, plot, Grid, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// The 2D cross product u × v = uₓv_y − u_yvₓ: a single number, the signed area
// of the parallelogram spanned by u and v. Positive when v is counter-clockwise
// from u (to its left), negative when clockwise.
//   side     — which side of the line A→B is P on? sign of (B − A) × (P − A)
//   triangle — the winding of A, B, C (CCW or CW), its area (half the cross),
//              and "is P inside?": the same sign for all three edges
// The lab: right of the line, on the line, a clockwise triangle, P inside,
// then a flat triangle.

type Mode = "side" | "tri";
type Pts = { A: Pt; B: Pt; C: Pt; P: Pt };
const cr = (u: Pt, v: Pt) => u.x * v.y - u.y * v.x;
const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y });
const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
const col = (v: number) => (v > 0 ? C.green : v < 0 ? C.red : C.muted);

/** The side test, the winding and the three edge tests. */
function tests({ A, B, C: Cc, P }: Pts) {
  const side = cr(sub(B, A), sub(P, A));
  const e1 = side, e2 = cr(sub(Cc, B), sub(P, B)), e3 = cr(sub(A, Cc), sub(P, Cc));
  const area2 = cr(sub(B, A), sub(Cc, A));
  const inside = (e1 >= 0 && e2 >= 0 && e3 >= 0) || (e1 <= 0 && e2 <= 0 && e3 <= 0);
  return { side, e1, e2, e3, area2, inside };
}

// ── The drawing ───────────────────────────────────────────────────────────────

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function Cross2DStage({ mode, pts, move, t }: { mode: Mode; pts: Pts; move: (id: keyof Pts, v: Pt) => void; t?: TrackTranslations }) {
  const { A, B, C: Cc, P } = pts;
  const list: [keyof Pts, Pt][] = mode === "side" ? [["A", A], ["B", B], ["P", P]] : [["A", A], ["B", B], ["C", Cc], ["P", P]];
  const drag = useDrag<keyof Pts>(q => nearest(q, list.map(([id, v]) => [id, S(v)] as [keyof Pts, Pt]), 16), (id, q) => {
    const w = p.inv(q);
    move(id, { x: Math.max(-5.4, Math.min(5.4, Math.round(w.x * 10) / 10)), y: Math.max(-2.9, Math.min(2.9, Math.round(w.y * 10) / 10)) });
  });
  const { side, area2, inside } = tests(pts);
  const ab = sub(B, A), ap = sub(P, A);

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto cursor-grab">
      {mode === "side" && (() => {
        // shade the left half-plane of the line A→B
        const d = { x: ab.x / (Math.hypot(ab.x, ab.y) || 1), y: ab.y / (Math.hypot(ab.x, ab.y) || 1) }, n = { x: -d.y, y: d.x }, big = 30;
        const poly = [
          { x: A.x - d.x * big, y: A.y - d.y * big }, { x: A.x + d.x * big, y: A.y + d.y * big },
          { x: A.x + d.x * big + n.x * big, y: A.y + d.y * big + n.y * big }, { x: A.x - d.x * big + n.x * big, y: A.y - d.y * big + n.y * big },
        ].map(S);
        return <polygon points={poly.map(q => `${q.x},${q.y}`).join(" ")} fill={C.green} opacity={0.07} />;
      })()}
      <Grid p={p} step={1} />
      {mode === "side" ? <>
        <line x1={S({ x: A.x - ab.x * 5, y: A.y - ab.y * 5 }).x} y1={S({ x: A.x - ab.x * 5, y: A.y - ab.y * 5 }).y} x2={S({ x: A.x + ab.x * 5, y: A.y + ab.y * 5 }).x} y2={S({ x: A.x + ab.x * 5, y: A.y + ab.y * 5 }).y} stroke={C.muted} strokeDasharray="4 4" opacity={0.6} />
        <polygon points={[A, B, { x: B.x + ap.x, y: B.y + ap.y }, P].map(S).map(q => `${q.x},${q.y}`).join(" ")} fill={col(side)} fillOpacity={0.16} stroke={col(side)} strokeOpacity={0.4} />
        <Vec a={S(A)} b={S(B)} color={C.sky} w={2.4} />
        <Vec a={S(A)} b={S(P)} color={C.amber} w={2.4} />
        <T x={p.X(-5.4)} y={14} size={9} color={C.green}>{tx(t, "figCross2_leftSide", "green side: left of A→B (positive)")}</T>
      </> : <>
        <polygon points={[A, B, Cc].map(S).map(q => `${q.x},${q.y}`).join(" ")} fill={col(area2)} fillOpacity={0.14} stroke={col(area2)} strokeWidth={2} />
        {[[A, B], [B, Cc], [Cc, A]].map(([u, v], i) => {
          const m = S({ x: u.x + (v.x - u.x) * 0.55, y: u.y + (v.y - u.y) * 0.55 }), e = S({ x: u.x + (v.x - u.x) * 0.6, y: u.y + (v.y - u.y) * 0.6 });
          return <Vec key={i} a={m} b={e} color={col(area2)} w={2} head={8} />;
        })}
      </>}
      {list.map(([id, v]) => (
        <g key={id}>
          <Handle x={S(v).x} y={S(v).y} color={id === "P" ? (mode === "tri" ? (inside ? C.green : C.red) : col(side)) : C.fg} r={5} active={drag.dragging === id} />
          <T x={S(v).x + 9} y={S(v).y - 7} size={11} bold color={C.fg}>{id}</T>
        </g>
      ))}
    </svg>
  );
}

export function Cross2DFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("side");
  const [pts, setPts] = useState<Pts>({ A: { x: -3, y: -1.5 }, B: { x: 2.5, y: 0.8 }, C: { x: -1, y: 2.2 }, P: { x: 0.3, y: 1.5 } });
  const lab = useLab("math-cross2d");
  const move = (id: keyof Pts, v: Pt) => setPts(s => ({ ...s, [id]: v }));
  const { side, e1, e2, e3, area2, inside } = tests(pts);

  const view = <Cross2DStage mode={mode} pts={pts} move={move} t={t} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[["side", tx(t, "figCross2_side", "which side?")], ["tri", tx(t, "figCross2_tri", "triangle")]] as const} />;
  const controls = <Row>
    {mode === "side" ? <>
      <Readout>(B − A) × (P − A) = {f2(side)}</Readout>
      <Readout color={col(side)}>{side > 0 ? tx(t, "figCross2_left", "P is left of A→B") : side < 0 ? tx(t, "figCross2_right", "P is right of A→B") : tx(t, "figCross2_on", "P is on the line")}</Readout>
      <Readout color={C.purple}>{tx(t, "figCross2_area", "parallelogram area")} = {f2(Math.abs(side))}</Readout>
    </> : <>
      <Readout color={col(area2)}>{area2 > 0 ? tx(t, "figCross2_ccw", "counter-clockwise") : area2 < 0 ? tx(t, "figCross2_cw", "clockwise") : tx(t, "figCross2_deg", "degenerate")}</Readout>
      <Readout color={C.purple}>{tx(t, "figCross2_triArea", "triangle area")} = ½|(B−A)×(C−A)| = {f2(Math.abs(area2) / 2)}</Readout>
      <Readout>{tx(t, "figCross2_edges", "edge tests")}: <span style={{ color: col(e1) }}>{f2(e1, 1)}</span> · <span style={{ color: col(e2) }}>{f2(e2, 1)}</span> · <span style={{ color: col(e3) }}>{f2(e3, 1)}</span></Readout>
      <Readout color={inside ? C.green : C.red}>{inside ? tx(t, "figCross2_in", "P inside") : tx(t, "figCross2_out", "P outside")}</Readout>
    </>}
  </Row>;
  const note = mode === "side"
    ? tx(t, "figCross2_noteSide2", "Drag A, B and P. The number (B − A) × (P − A) is the signed area of the parallelogram built on the two arrows from A. Walking from A to B, it is positive when P is on your left, negative on your right and zero exactly on the line. That one sign answers many questions: is the buoy left or right of my heading, which side of a fence is the sheep on, has the runner crossed the finish line (the sign changed between two moments)?")
    : tx(t, "figCross2_noteTri", "Drag the corners. The sign of (B − A) × (C − A) tells the winding: positive when A → B → C turns counter-clockwise, negative when it turns clockwise. Half its absolute value is the triangle's area. Move P: it is inside when it is on the same side of all three edges, walked in order, so the three edge tests share a sign.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCross2L1_t", "Left or right?"),
      body: <>
        <p>{tx(t, "figCross2L1_b1", "Walk from A to B. P starts on your left, in the green half, and the number is positive.")}</p>
        <p>{tx(t, "figCross2L1_b2", "Drag P to your right.")}</p>
      </>,
      goal: { text: tx(t, "figCross2L1_g", "(B − A) × (P − A) < 0."), done: mode === "side" && side < 0 },
      setup: () => { setMode("side"); setPts(s => ({ ...s, A: { x: -3, y: -1 }, B: { x: 3, y: 1 }, P: { x: -1, y: 1.5 } })); },
    },
    {
      title: tx(t, "figCross2L2_t", "Right on the line"),
      body: <>
        <p>{tx(t, "figCross2L2_b1", "Between the two sides the number passes through zero.")}</p>
        <p>{tx(t, "figCross2L2_b2", "Put P exactly on the dashed line.")}</p>
      </>,
      goal: { text: tx(t, "figCross2L2_g", "(B − A) × (P − A) = 0."), done: mode === "side" && Math.abs(side) < 0.005 },
      hint: tx(t, "figCross2L2_h", "The line through (−3, −1) and (3, 1) rises 1 for every 3 across: (0, 0) and (1.5, 0.5) are on it."),
    },
    {
      title: tx(t, "figCross2L3_t", "Quick check"),
      body: <p>{tx(t, "figCross2L3_b", "A = (0, 0), B = (4, 1) and P = (1, 3).")}</p>,
      quiz: {
        q: tx(t, "figCross2L3_q", "Which side of A → B is P on?"),
        options: [tx(t, "figCross2L3_o1", "left: (4, 1) × (1, 3) = 11"), tx(t, "figCross2L3_o2", "right: (4, 1) × (1, 3) = −11"), tx(t, "figCross2L3_o3", "left: (4, 1) × (1, 3) = 7"), tx(t, "figCross2L3_o4", "on the line")],
        answer: 0,
        why: tx(t, "figCross2L3_w", "aₓb_y − a_ybₓ = 4 · 3 − 1 · 1 = 11 > 0, so P is to the left. 7 is the dot product, 4 · 1 + 1 · 3."),
      },
    },
    {
      title: tx(t, "figCross2L4_t", "Turn the other way"),
      body: <>
        <p>{tx(t, "figCross2L4_b1", "A → B → C now turns counter-clockwise, and the triangle is green.")}</p>
        <p>{tx(t, "figCross2L4_b2", "Move one corner so the same order turns clockwise.")}</p>
      </>,
      goal: { text: tx(t, "figCross2L4_g", "(B − A) × (C − A) < 0."), done: mode === "tri" && area2 < 0 },
      hint: tx(t, "figCross2L4_h", "Drag C across the line A → B, to its right."),
      setup: () => { setMode("tri"); setPts({ A: { x: -3, y: -1.5 }, B: { x: 2.5, y: 0.8 }, C: { x: -1, y: 2.2 }, P: { x: 3.5, y: 2 } }); },
    },
    {
      title: tx(t, "figCross2L5_t", "Inside or out?"),
      body: <>
        <p>{tx(t, "figCross2L5_b1", "Each edge, walked in order, has its own side test. P is inside when all three agree.")}</p>
        <p>{tx(t, "figCross2L5_b2", "Bring P into the triangle and watch the three numbers.")}</p>
      </>,
      goal: { text: tx(t, "figCross2L5_g", "P inside: all three tests share a sign."), done: mode === "tri" && inside && Math.abs(area2) > 0.1 },
      setup: () => { setMode("tri"); setPts({ A: { x: -3, y: -1.5 }, B: { x: 2.5, y: 0.8 }, C: { x: -1, y: 2.2 }, P: { x: 3.5, y: 2 } }); },
    },
    {
      title: tx(t, "figCross2L6_t", "Quick check"),
      body: <p>{tx(t, "figCross2L6_b", "A = (0, 0), B = (4, 0), C = (0, 3).")}</p>,
      quiz: {
        q: tx(t, "figCross2L6_q", "What is the triangle's area?"),
        options: ["6", "12", "7", "3.5"],
        answer: 0,
        why: tx(t, "figCross2L6_w", "(B − A) × (C − A) = (4, 0) × (0, 3) = 4 · 3 − 0 · 0 = 12, the parallelogram. The triangle is half of it: 6. And 12 > 0, so A → B → C runs counter-clockwise."),
      },
    },
    {
      title: tx(t, "figCross2L7_t", "A flat triangle"),
      body: <p>{tx(t, "figCross2L7_b", "Line the three corners up on one straight line.")}</p>,
      goal: { text: tx(t, "figCross2L7_g", "(B − A) × (C − A) = 0."), done: mode === "tri" && Math.abs(area2) < 0.005 },
      hint: tx(t, "figCross2L7_h", "Put C on the line through A and B, for example halfway between them."),
    },
  ];

  const insights: Insight[] = [
    {
      id: "on", tone: "ok", when: mode === "side" && Math.abs(side) < 0.005,
      title: tx(t, "figCross2I1_t", "On the line"),
      body: tx(t, "figCross2I1_b", "B − A and P − A are parallel, so the parallelogram on them is flat and the cross product is 0. This is the collinearity test."),
    },
    {
      id: "cw", tone: "info", when: mode === "tri" && area2 < -0.005,
      title: tx(t, "figCross2I2_t", "Clockwise"),
      body: fill(tx(t, "figCross2I2_b", "(B − A) × (C − A) = {v}. The area is still {a}: only the sign changed, because the corners are now visited in the other order."), { v: f2(area2), a: f2(Math.abs(area2) / 2) }),
    },
    {
      id: "flat", tone: "warn", when: mode === "tri" && Math.abs(area2) < 0.005,
      title: tx(t, "figCross2I3_t", "Degenerate"),
      body: tx(t, "figCross2I3_b", "The three corners are on one line: zero area and no winding. The inside test breaks down too, since there is no inside."),
    },
    {
      id: "inside", tone: "ok", when: mode === "tri" && inside && Math.abs(area2) > 0.1,
      title: tx(t, "figCross2I4_t", "Three agreeing tests"),
      body: fill(tx(t, "figCross2I4_b", "{e1}, {e2} and {e3} all have the same sign as the winding: P is on the inner side of every edge."), { e1: f2(e1, 1), e2: f2(e2, 1), e3: f2(e3, 1) }),
    },
  ];

  const title = tx(t, "figCross2_title", "The 2D cross product: left, right and winding");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figCross2R1", "aₓb_y − a_ybₓ is the signed area of the parallelogram on a and b."),
          tx(t, "figCross2R2", "The sign of (B − A) × (P − A): left (+), right (−) or on the line (0)."),
          tx(t, "figCross2R3", "The sign of (B − A) × (C − A) is the winding; half its size is the triangle's area."),
          tx(t, "figCross2R4", "P is inside when all three edge tests share a sign."),
        ]}
      />
    </>
  );
}
