"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A system of two linear equations as two lines. Each line is set by dragging
// two points; its equation a·x + b·y = e is computed from them. The solution
// of the system is the point on both lines. Cramer's rule gives it directly,
// and its denominator (the determinant ad − bc) is zero exactly when the
// lines are parallel: then there is no solution, or, if they coincide,
// infinitely many.

type Id = "p1" | "p2" | "q1" | "q2";
type Pts = Record<Id, Pt>;

const PRESETS: { key: string; pts: Pts }[] = [
  { key: "cross", pts: { p1: { x: -5, y: -2 }, p2: { x: 4, y: 2.5 }, q1: { x: -4, y: 3 }, q2: { x: 5, y: -2 } } },
  { key: "parallel", pts: { p1: { x: -5, y: -2 }, p2: { x: 3, y: 2 }, q1: { x: -5, y: 0 }, q2: { x: 3, y: 4 } } },
  { key: "same", pts: { p1: { x: -4, y: -2 }, p2: { x: 0, y: 0 }, q1: { x: 2, y: 1 }, q2: { x: 6, y: 3 } } },
];

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

export function LinesFigure({ t }: { t?: TrackTranslations }) {
  const [pts, setPts] = useState<Pts>(PRESETS[0].pts);
  const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
  const V = (q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });

  const drag = useDrag<Id>(
    q => nearest(q, (Object.keys(pts) as Id[]).map(k => [k, V(pts[k])] as [Id, Pt]), 18),
    (id, q) => {
      const w = p.inv(q);
      const s = { x: clamp(Math.round(w.x * 2) / 2, -6.5, 6.5), y: clamp(Math.round(w.y * 2) / 2, -3.5, 3.5) };
      setPts(old => {
        const other = id === "p1" ? old.p2 : id === "p2" ? old.p1 : id === "q1" ? old.q2 : old.q1;
        return s.x === other.x && s.y === other.y ? old : { ...old, [id]: s };
      });
    });

  const L1 = lineOf(pts.p1, pts.p2), L2 = lineOf(pts.q1, pts.q2);
  // Lesson notation: a x + b y = e, c x + d y = f
  const { a, b, e } = L1, c = L2.a, d = L2.b, f = L2.e;
  const det = a * d - b * c;
  const scale = Math.max(Math.hypot(a, b) * Math.hypot(c, d), 1e-9);
  const parallel = Math.abs(det) / scale < 1e-9;
  const same = parallel && Math.abs(a * f - e * c) + Math.abs(b * f - e * d) < 1e-6 * scale * Math.max(1, Math.abs(e), Math.abs(f));
  const X = parallel ? NaN : (e * d - b * f) / det, Y = parallel ? NaN : (a * f - e * c) / det;
  const inView = !parallel && X > p.x0 && X < p.x1 && Y > p.y0 && Y < p.y1;

  const far = (u: Pt, v: Pt) => {
    const dx = v.x - u.x, dy = v.y - u.y, k = 40 / Math.hypot(dx, dy);
    return { a: V({ x: u.x - dx * k, y: u.y - dy * k }), b: V({ x: u.x + dx * k, y: u.y + dy * k }) };
  };
  const s1 = far(pts.p1, pts.p2), s2 = far(pts.q1, pts.q2);
  const verdict = same ? tx(t, "figLines_same", "same line: infinitely many solutions")
    : parallel ? tx(t, "figLines_parallel", "parallel: no solution")
      : `${tx(t, "figLines_one", "one solution:")} (${n(X)}, ${n(Y)})`;

  return (
    <Figure
      title={tx(t, "figLines_title", "Two equations, two lines")}
      head={<>{PRESETS.map(pr => (
        <Btn key={pr.key} onClick={() => setPts(pr.pts)}>
          {pr.key === "cross" ? tx(t, "figLines_pCross", "crossing") : pr.key === "parallel" ? tx(t, "figLines_pParallel", "parallel") : tx(t, "figLines_pSame", "same line")}
        </Btn>
      ))}</>}
      controls={<>
        <Row>
          <Readout color={C.sky}>{eqText(a, b, e)}</Readout>
          <Readout color={C.pink}>{eqText(c, d, f)}</Readout>
        </Row>
        <Row>
          <Readout>{`ad − bc = ${paren(a)}·${paren(d)} − ${paren(b)}·${paren(c)} = ${n(det)}`}</Readout>
          <Readout color={same ? C.amber : parallel ? C.red : C.green}>{verdict}</Readout>
        </Row>
      </>}
      note={tx(t, "figLines_note", "Drag the four points to move the two lines. Every point on the blue line satisfies the first equation, every point on the pink line the second; the green dot, on both, is the one (x, y) that satisfies both at once. Make the lines parallel and the determinant ad − bc becomes 0: they never meet, so there is no solution. Put them on top of each other and every point is shared: infinitely many solutions.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        <line x1={s1.a.x} y1={s1.a.y} x2={s1.b.x} y2={s1.b.y} stroke={C.sky} strokeWidth={2.2} />
        <line x1={s2.a.x} y1={s2.a.y} x2={s2.b.x} y2={s2.b.y} stroke={same ? C.amber : C.pink} strokeWidth={2.2} strokeDasharray={same ? "7 5" : undefined} />
        {inView && <>
          <line x1={p.X(X)} x2={p.X(X)} y1={p.Y(Y)} y2={p.Y(0)} stroke={C.green} strokeDasharray="3 3" />
          <line x1={p.X(0)} x2={p.X(X)} y1={p.Y(Y)} y2={p.Y(Y)} stroke={C.green} strokeDasharray="3 3" />
          <circle cx={p.X(X)} cy={p.Y(Y)} r={6} fill={C.green} />
          <T x={p.X(X) + 10} y={p.Y(Y) - 10} size={10} color={C.green} bold>{`(${n(X)}, ${n(Y)})`}</T>
        </>}
        {!parallel && !inView && <T x={p.W - 10} y={16} size={9.5} anchor="end" color={C.green}>{tx(t, "figLines_off", "the crossing is off the grid")}</T>}
        {(["p1", "p2"] as Id[]).map(k => <Handle key={k} {...V(pts[k])} color={C.sky} active={drag.dragging === k} />)}
        {(["q1", "q2"] as Id[]).map(k => <Handle key={k} {...V(pts[k])} color={C.pink} active={drag.dragging === k} />)}
      </svg>
    </Figure>
  );
}
