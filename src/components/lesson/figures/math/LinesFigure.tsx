"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// A system of two linear equations as two lines. Each line is set by dragging
// two points; its equation a·x + b·y = e is computed from them. The solution
// of the system is the point on both lines. Cramer's rule gives it directly,
// and its denominator (the determinant ad − bc) is zero exactly when the
// lines are parallel: then there is no solution, or, if they coincide,
// infinitely many.
// The lab: place the crossing, then make the lines parallel and identical.

type Id = "p1" | "p2" | "q1" | "q2";
type Pts = Record<Id, Pt>;

const PRESETS: { key: string; pts: Pts }[] = [
  { key: "cross", pts: { p1: { x: -5, y: -2 }, p2: { x: 4, y: 2.5 }, q1: { x: -4, y: 3 }, q2: { x: 5, y: -2 } } },
  { key: "parallel", pts: { p1: { x: -5, y: -2 }, p2: { x: 3, y: 2 }, q1: { x: -5, y: 0 }, q2: { x: 3, y: 4 } } },
  { key: "same", pts: { p1: { x: -4, y: -2 }, p2: { x: 0, y: 0 }, q1: { x: 2, y: 1 }, q2: { x: 6, y: 3 } } },
];
const P = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const V = (q: Pt) => ({ x: P.X(q.x), y: P.Y(q.y) });

const n = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(2)).toString().replace("-", "−");

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const paren = (v: number) => (v < 0 ? `(${n(v)})` : n(v));

/** a·x + b·y = e through two points, scaled to the smallest whole numbers with a > 0. */
function lineOf(p: Pt, q: Pt) {
  // Points sit on a 0.5 grid, so 4·(a, b, e) are whole numbers.
  let a = Math.round(4 * (q.y - p.y)), b = Math.round(4 * (p.x - q.x));
  let e = Math.round(a * p.x + b * p.y);
  const g = gcd(gcd(a, b), e) || 1;
  const s = a < 0 || (a === 0 && b < 0) ? -1 : 1;
  a = (s * a) / g; b = (s * b) / g; e = (s * e) / g;
  return { a, b, e };
}

/** "2x − 3y = 1.5" */
function eqText(a: number, b: number, e: number) {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-9) parts.push(`${a === 1 ? "" : a === -1 ? "−" : n(a)}x`);
  if (Math.abs(b) > 1e-9) {
    const coef = Math.abs(b) === 1 ? "" : n(Math.abs(b));
    parts.push(parts.length ? `${b < 0 ? "− " : "+ "}${coef}y` : `${b < 0 ? "−" : ""}${coef}y`);
  }
  return `${parts.join(" ") || "0"} = ${n(e)}`;
}

/** Both lines, the determinant and the crossing (if any). */
function solveSystem(pts: Pts) {
  const L1 = lineOf(pts.p1, pts.p2), L2 = lineOf(pts.q1, pts.q2);
  // Lesson notation: a x + b y = e, c x + d y = f
  const { a, b, e } = L1, c = L2.a, d = L2.b, f = L2.e;
  const det = a * d - b * c;
  const scale = Math.max(Math.hypot(a, b) * Math.hypot(c, d), 1e-9);
  const parallel = Math.abs(det) / scale < 1e-9;
  const same = parallel && Math.abs(a * f - e * c) + Math.abs(b * f - e * d) < 1e-6 * scale * Math.max(1, Math.abs(e), Math.abs(f));
  const X = parallel ? NaN : (e * d - b * f) / det, Y = parallel ? NaN : (a * f - e * c) / det;
  const inView = !parallel && X > P.x0 && X < P.x1 && Y > P.y0 && Y < P.y1;
  // sine of the angle between the lines: near 0 = almost parallel
  return { a, b, c, d, e, f, det, sin: Math.abs(det) / scale, parallel, same, X, Y, inView };
}
type Solved = ReturnType<typeof solveSystem>;

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function LinesStage({ pts, setPts, s, t }: { pts: Pts; setPts: (f: (old: Pts) => Pts) => void; s: Solved; t?: TrackTranslations }) {
  const drag = useDrag<Id>(
    q => nearest(q, (Object.keys(pts) as Id[]).map(k => [k, V(pts[k])] as [Id, Pt]), 18),
    (id, q) => {
      const w = P.inv(q);
      const sn = { x: clamp(Math.round(w.x * 2) / 2, -6.5, 6.5), y: clamp(Math.round(w.y * 2) / 2, -3.5, 3.5) };
      setPts(old => {
        const other = id === "p1" ? old.p2 : id === "p2" ? old.p1 : id === "q1" ? old.q2 : old.q1;
        return sn.x === other.x && sn.y === other.y ? old : { ...old, [id]: sn };
      });
    });
  const far = (u: Pt, v: Pt) => {
    const dx = v.x - u.x, dy = v.y - u.y, k = 40 / Math.hypot(dx, dy);
    return { a: V({ x: u.x - dx * k, y: u.y - dy * k }), b: V({ x: u.x + dx * k, y: u.y + dy * k }) };
  };
  const s1 = far(pts.p1, pts.p2), s2 = far(pts.q1, pts.q2);
  const { X, Y, inView, parallel, same } = s;

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${P.W} ${P.H}`} className="w-full h-auto">
      <Grid p={P} step={1} />
      <line x1={s1.a.x} y1={s1.a.y} x2={s1.b.x} y2={s1.b.y} stroke={C.sky} strokeWidth={2.2} />
      <line x1={s2.a.x} y1={s2.a.y} x2={s2.b.x} y2={s2.b.y} stroke={same ? C.amber : C.pink} strokeWidth={2.2} strokeDasharray={same ? "7 5" : undefined} />
      {inView && <>
        <line x1={P.X(X)} x2={P.X(X)} y1={P.Y(Y)} y2={P.Y(0)} stroke={C.green} strokeDasharray="3 3" />
        <line x1={P.X(0)} x2={P.X(X)} y1={P.Y(Y)} y2={P.Y(Y)} stroke={C.green} strokeDasharray="3 3" />
        <circle cx={P.X(X)} cy={P.Y(Y)} r={6} fill={C.green} />
        <T x={P.X(X) + 10} y={P.Y(Y) - 10} size={10} color={C.green} bold>{`(${n(X)}, ${n(Y)})`}</T>
      </>}
      {!parallel && !inView && <T x={P.W - 10} y={16} size={9.5} anchor="end" color={C.green}>{tx(t, "figLines_off", "the crossing is off the grid")}</T>}
      {(["p1", "p2"] as Id[]).map(k => <Handle key={k} {...V(pts[k])} color={C.sky} active={drag.dragging === k} />)}
      {(["q1", "q2"] as Id[]).map(k => <Handle key={k} {...V(pts[k])} color={C.pink} active={drag.dragging === k} />)}
    </svg>
  );
}

export function LinesFigure({ t }: { t?: TrackTranslations }) {
  const [pts, setPts] = useState<Pts>(PRESETS[0].pts);
  const lab = useLab("math-lines");
  const s = solveSystem(pts);
  const { a, b, c, d, e, f, det, parallel, same, X, Y } = s;
  const near = (u: number, w: number) => Math.abs(u - w) < 1e-6;

  const verdict = same ? tx(t, "figLines_same", "same line: infinitely many solutions")
    : parallel ? tx(t, "figLines_parallel", "parallel: no solution")
      : `${tx(t, "figLines_one", "one solution:")} (${n(X)}, ${n(Y)})`;

  const stage = <LinesStage pts={pts} setPts={setPts} s={s} t={t} />;
  const presets = <>{PRESETS.map(pr => (
    <Btn key={pr.key} onClick={() => setPts(pr.pts)}>
      {pr.key === "cross" ? tx(t, "figLines_pCross", "crossing") : pr.key === "parallel" ? tx(t, "figLines_pParallel", "parallel") : tx(t, "figLines_pSame", "same line")}
    </Btn>
  ))}</>;
  const controls = <>
    <Row>
      <Readout color={C.sky}>{eqText(a, b, e)}</Readout>
      <Readout color={C.pink}>{eqText(c, d, f)}</Readout>
    </Row>
    <Row>
      <Readout>{`ad − bc = ${paren(a)}·${paren(d)} − ${paren(b)}·${paren(c)} = ${n(det)}`}</Readout>
      <Readout color={same ? C.amber : parallel ? C.red : C.green}>{verdict}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figLinesL1_t", "A point on both lines"),
      body: <>
        <p>{tx(t, "figLinesL1_b1", "Every point on the blue line satisfies the blue equation, every point on the pink line the pink one. The green dot is on both, so it satisfies both: it is the solution of the system.")}</p>
        <p>{tx(t, "figLinesL1_b2", "Drag the handles so that the solution is (2, 1).")}</p>
      </>,
      goal: { text: tx(t, "figLinesL1_g", "Solution (2, 1)."), done: !parallel && near(X, 2) && near(Y, 1) },
      hint: tx(t, "figLinesL1_h", "Put one blue handle and one pink handle on the grid point (2, 1)."),
      setup: () => setPts(PRESETS[0].pts),
    },
    {
      title: tx(t, "figLinesL2_t", "Quick check"),
      body: <p>{tx(t, "figLinesL2_b", "A solution must make both equations true.")}</p>,
      quiz: {
        q: tx(t, "figLinesL2_q", "Which pair solves x + y = 10 and x − y = 4?"),
        options: ["(7, 3)", "(3, 7)", "(6, 4)", "(10, 0)"],
        answer: 0,
        why: tx(t, "figLinesL2_w", "7 + 3 = 10 and 7 − 3 = 4. (3, 7) and (6, 4) satisfy only the first equation, (10, 0) neither."),
      },
    },
    {
      title: tx(t, "figLinesL3_t", "Lines that never meet"),
      body: <p>{tx(t, "figLinesL3_b", "Turn the pink line until it is parallel to the blue one, without putting it on top. Watch the determinant ad − bc.")}</p>,
      goal: { text: tx(t, "figLinesL3_g", "Two distinct parallel lines."), done: parallel && !same },
      hint: tx(t, "figLinesL3_h", "Parallel lines climb the same amount per step: copy the blue handles' offset (for example 2 right, 1 up) onto the pink handles."),
      setup: () => setPts(PRESETS[0].pts),
    },
    {
      title: tx(t, "figLinesL4_t", "Quick check"),
      body: <p>{tx(t, "figLinesL4_b", "Try eliminating x.")}</p>,
      quiz: {
        q: "x + y = 2,  2x + 2y = 9",
        options: [tx(t, "figLinesL4_o1", "no solution"), tx(t, "figLinesL4_o2", "exactly one solution"), tx(t, "figLinesL4_o3", "infinitely many solutions"), tx(t, "figLinesL4_o4", "only (0, 2)")],
        answer: 0,
        why: tx(t, "figLinesL4_w", "Twice the first equation says 2x + 2y = 4, the second says 2x + 2y = 9. Subtracting leaves 0 = 5: parallel lines, no solution."),
      },
    },
    {
      title: tx(t, "figLinesL5_t", "One line, two equations"),
      body: <p>{tx(t, "figLinesL5_b", "Now lay the pink line exactly on top of the blue one. Its two handles must both sit on the blue line.")}</p>,
      goal: { text: tx(t, "figLinesL5_g", "The same line twice."), done: same },
      setup: () => setPts(PRESETS[1].pts),
    },
    {
      title: tx(t, "figLinesL6_t", "Quick check"),
      body: <p>{tx(t, "figLinesL6_b", "The determinant decides whether there is exactly one solution.")}</p>,
      quiz: {
        q: tx(t, "figLinesL6_q", "ad − bc for 2x + 3y = 12, 5x − 2y = 11?"),
        options: ["−19", "11", "19", "0"],
        answer: 0,
        why: tx(t, "figLinesL6_w", "a = 2, b = 3, c = 5, d = −2: 2·(−2) − 3·5 = −4 − 15 = −19. Not 0, so exactly one solution, (3, 2)."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "par", tone: "warn", when: parallel && !same,
      title: tx(t, "figLinesI1_t", "Determinant 0, no crossing"),
      body: tx(t, "figLinesI1_b", "Same slope, different heights: no point is on both lines. ad − bc = 0, so Cramer's rule would divide by zero, and elimination ends in a false statement like 0 = 5."),
    },
    {
      id: "same", tone: "ok", when: same,
      title: tx(t, "figLinesI2_t", "Two names for one line"),
      body: tx(t, "figLinesI2_b", "One equation is a multiple of the other, so they say the same thing. Every point on the line solves both: infinitely many solutions, and elimination ends in 0 = 0."),
    },
    {
      id: "almost", tone: "info", when: !parallel && s.sin < 0.2,
      title: tx(t, "figLinesI3_t", "Almost parallel"),
      body: fill(tx(t, "figLinesI3_b", "The lines meet at a very shallow angle, so the crossing (here ({x}, {y})) jumps far for a tiny change in a handle. Such systems are fragile: small measuring errors give very different answers."), { x: n(X), y: n(Y) }),
    },
  ];

  const title = tx(t, "figLines_title", "Two equations, two lines");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{presets}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figLines_note", "Drag the four points to move the two lines. Every point on the blue line satisfies the first equation, every point on the pink line the second; the green dot, on both, is the one (x, y) that satisfies both at once. Make the lines parallel and the determinant ad − bc becomes 0: they never meet, so there is no solution. Put them on top of each other and every point is shared: infinitely many solutions.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{presets}</Row>{controls}</>}
        recap={[
          tx(t, "figLinesR1", "The solution of a system is the point on both lines: it satisfies both equations at once."),
          tx(t, "figLinesR2", "Parallel lines give no solution, the same line infinitely many; in both cases ad − bc = 0."),
          tx(t, "figLinesR3", "When ad − bc ≠ 0 there is exactly one solution, and Cramer's rule computes it."),
        ]}
      />
    </>
  );
}
