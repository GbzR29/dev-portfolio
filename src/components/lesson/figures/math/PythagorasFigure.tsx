"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, plot, Grid, useDrag, nearest, clamp, lerp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// squares  — a right triangle with legs a and b (drag their ends) and a square
//            built on each side. The two small squares' areas always add up
//            to the big one's: a² + b² = c².
// proof    — a square of side a + b holding four copies of the triangle.
//            Arranged one way they leave a tilted square c² uncovered;
//            slid into another arrangement they leave a² and b². Same big
//            square, same four triangles, so the uncovered areas are equal.
// distance — two points on a grid; the horizontal and vertical steps between
//            them are the legs of a right triangle whose hypotenuse is the
//            straight-line distance.

type Mode = "squares" | "proof" | "distance";
const W = 560, H = 303;
const f1 = (v: number) => (+v.toFixed(2)).toString();
const sq = (v: number) => (+v.toFixed(2)).toString();
const m = (v: number) => String(v).replace("-", "−");
const paren = (v: number) => (v < 0 ? `(${m(v)})` : m(v));

export function PythagorasFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("squares");
  const [a, setA] = useState(4), [b, setB] = useState(3);
  const [k, setK] = useState(0);
  const [P, setP] = useState<Pt>({ x: -4, y: -2 }), [Q, setQ] = useState<Pt>({ x: 3, y: 2 });

  const ps = plot({ W, H, x0: -10, x1: 14, y0: -4.5, y1: 8.5 });
  const pd = plot({ W, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
  const c = Math.hypot(a, b);

  const drag = useDrag<"a" | "b" | "P" | "Q">(
    q => mode === "squares"
      ? nearest(q, [["a", { x: ps.X(a), y: ps.Y(0) }], ["b", { x: ps.X(0), y: ps.Y(b) }]], 20)
      : mode === "distance" ? nearest(q, [["P", { x: pd.X(P.x), y: pd.Y(P.y) }], ["Q", { x: pd.X(Q.x), y: pd.Y(Q.y) }]], 20) : null,
    (id, q) => {
      if (id === "a") setA(clamp(Math.round(ps.inv(q).x * 2) / 2, 0.5, 4));
      else if (id === "b") setB(clamp(Math.round(ps.inv(q).y * 2) / 2, 0.5, 4));
      else {
        const w = pd.inv(q), s = { x: clamp(Math.round(w.x), -6, 6), y: clamp(Math.round(w.y), -3, 3) };
        (id === "P" ? setP : setQ)(s);
      }
    });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "squares") {
    const V = (x: number, y: number) => `${ps.X(x)},${ps.Y(y)}`;
    // Square on the hypotenuse, outward (away from the right angle)
    const hyp = [V(a, 0), V(a + b, a), V(b, a + b), V(0, b)].join(" ");
    svg = <>
      <Grid p={ps} step={1} labels={false} />
      <polygon points={[V(0, 0), V(a, 0), V(a, -a), V(0, -a)].join(" ")} fill={C.sky} fillOpacity={0.25} stroke={C.sky} strokeWidth={1.5} />
      <polygon points={[V(0, 0), V(0, b), V(-b, b), V(-b, 0)].join(" ")} fill={C.pink} fillOpacity={0.25} stroke={C.pink} strokeWidth={1.5} />
      <polygon points={hyp} fill={C.amber} fillOpacity={0.22} stroke={C.amber} strokeWidth={1.5} />
      <polygon points={[V(0, 0), V(a, 0), V(0, b)].join(" ")} fill={C.fg} fillOpacity={0.12} stroke={C.fg} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${ps.X(0) + 10},${ps.Y(0)} v-10 h-10`} fill="none" stroke={C.fg} strokeWidth={1.2} />
      <T x={ps.X(a / 2)} y={ps.Y(-a / 2) + 4} size={11} anchor="middle" color={C.sky} bold>{`a² = ${sq(a * a)}`}</T>
      <T x={ps.X(-b / 2)} y={ps.Y(b / 2) + 4} size={11} anchor="middle" color={C.pink} bold>{`b² = ${sq(b * b)}`}</T>
      <T x={ps.X((a + b) / 2)} y={ps.Y((a + b) / 2) + 4} size={11} anchor="middle" color={C.amber} bold>{`c² = ${sq(c * c)}`}</T>
      <T x={ps.X(a / 2)} y={ps.Y(0) - 5} size={9.5} anchor="middle" color={C.fg}>{`a = ${f1(a)}`}</T>
      <T x={ps.X(0) + 5} y={ps.Y(b / 2)} size={9.5} color={C.fg}>{`b = ${f1(b)}`}</T>
      <Handle x={ps.X(a)} y={ps.Y(0)} color={C.sky} active={drag.dragging === "a"} />
      <Handle x={ps.X(0)} y={ps.Y(b)} color={C.pink} active={drag.dragging === "b"} />
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`a² = ${sq(a * a)}`}</Readout>
      <Readout color={C.pink}>{`b² = ${sq(b * b)}`}</Readout>
      <Readout color={C.amber}>{`a² + b² = ${sq(a * a + b * b)} = c²`}</Readout>
      <Readout color={C.green}>{`c = √${sq(a * a + b * b)} ≈ ${f1(c)}`}</Readout>
    </Row>;
    note = tx(t, "figPy_noteS", "Drag the blue and pink points to change the two legs of the right triangle. On each side stands a square; its area is that side's length squared. However you change the legs, the blue and pink areas add up exactly to the amber one. Try a = 4, b = 3: 16 + 9 = 25, so the hypotenuse is exactly 5.");
  } else if (mode === "proof") {
    const S = a + b, sc = 250 / S;
    const pp = plot({ W, H: 300, x0: S / 2 - W / (2 * sc), x1: S / 2 + W / (2 * sc), y0: S / 2 - 150 / sc, y1: S / 2 + 150 / sc });
    const V = (x: number, y: number) => `${pp.X(x)},${pp.Y(y)}`;
    // Four copies, each with its own slide from arrangement 1 to arrangement 2
    const tris: { pts: Pt[]; d: Pt; col: string }[] = [
      { pts: [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: 0, y: b }], d: { x: 0, y: a }, col: C.sky },
      { pts: [{ x: S, y: 0 }, { x: a, y: 0 }, { x: S, y: a }], d: { x: 0, y: 0 }, col: C.pink },
      { pts: [{ x: S, y: S }, { x: b, y: S }, { x: S, y: a }], d: { x: -b, y: 0 }, col: C.teal },
      { pts: [{ x: 0, y: S }, { x: b, y: S }, { x: 0, y: b }], d: { x: a, y: -b }, col: C.purple },
    ];
    svg = <>
      <rect x={pp.X(0)} y={pp.Y(S)} width={S * sc} height={S * sc} fill={C.amber} fillOpacity={0.14} stroke={C.fg} strokeWidth={2} />
      {k < 0.02 && <T x={pp.X(S / 2)} y={pp.Y(S / 2) + 4} size={13} anchor="middle" color={C.amber} bold>c²</T>}
      {k > 0.98 && <>
        <T x={pp.X(a / 2)} y={pp.Y(a / 2) + 4} size={13} anchor="middle" color={C.amber} bold>a²</T>
        <T x={pp.X(a + b / 2)} y={pp.Y(a + b / 2) + 4} size={13} anchor="middle" color={C.amber} bold>b²</T>
      </>}
      {tris.map((tr, i) => <polygon key={i} points={tr.pts.map(q => V(q.x + tr.d.x * k, q.y + tr.d.y * k)).join(" ")}
        fill={tr.col} fillOpacity={0.55} stroke={tr.col} strokeWidth={1.5} strokeLinejoin="round" />)}
      <T x={pp.X(a / 2)} y={pp.Y(0) + 14} size={9.5} anchor="middle" color={C.fg}>a</T>
      <T x={pp.X(a + b / 2)} y={pp.Y(0) + 14} size={9.5} anchor="middle" color={C.fg}>b</T>
      <T x={pp.X(0) - 8} y={pp.Y(lerp(b / 2, a / 2, k)) + 3} size={9.5} anchor="end" color={C.fg}>{k < 0.5 ? "b" : "a"}</T>
      <T x={pp.X(0) - 8} y={pp.Y(lerp(b + a / 2, a + b / 2, k)) + 3} size={9.5} anchor="end" color={C.fg}>{k < 0.5 ? "a" : "b"}</T>
    </>;
    controls = <>
      <Slider label={tx(t, "figPy_slide", "slide triangles")} value={k} min={0} max={1} step={0.01} onChange={setK} fmt={v => `${Math.round(v * 100)}%`} width="w-28" />
      <Row>
        <Readout>{`(a + b)² = ${sq(S * S)}`}</Readout>
        <Readout>{`4 · ab/2 = ${sq(2 * a * b)}`}</Readout>
        <Readout color={C.amber}>{k < 0.5 ? `c² = ${sq(S * S)} − ${sq(2 * a * b)} = ${sq(S * S - 2 * a * b)}` : `a² + b² = ${sq(a * a)} + ${sq(b * b)} = ${sq(a * a + b * b)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figPy_noteP", "The big square has side a + b and holds four copies of the right triangle. At the start they leave a tilted square in the middle whose side is the hypotenuse c, so the uncovered area is c². Slide them: nothing is added or removed, the four triangles only move, and at the end the uncovered area is two squares, a² and b². The same big square minus the same four triangles, so c² = a² + b². The legs used here are the ones set in the first mode.");
  } else {
    const dx = Q.x - P.x, dy = Q.y - P.y, d = Math.hypot(dx, dy);
    const X = pd.X, Y = pd.Y;
    svg = <>
      <Grid p={pd} step={1} />
      <line x1={X(P.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(P.y)} stroke={C.sky} strokeWidth={2.5} />
      <line x1={X(Q.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(Q.y)} stroke={C.pink} strokeWidth={2.5} />
      <line x1={X(P.x)} y1={Y(P.y)} x2={X(Q.x)} y2={Y(Q.y)} stroke={C.amber} strokeWidth={3} />
      {dx !== 0 && dy !== 0 && <path d={`M${X(Q.x) - Math.sign(dx) * 9},${Y(P.y)} v${-Math.sign(dy) * 9} h${Math.sign(dx) * 9}`} fill="none" stroke={C.fg} strokeWidth={1.1} />}
      <T x={(X(P.x) + X(Q.x)) / 2} y={Y(P.y) + (dy >= 0 ? 15 : -7)} size={10} anchor="middle" color={C.sky} bold>{`Δx = ${m(dx)}`}</T>
      <T x={X(Q.x) + (dx >= 0 ? 7 : -7)} y={(Y(P.y) + Y(Q.y)) / 2 + 3} size={10} anchor={dx >= 0 ? "start" : "end"} color={C.pink} bold>{`Δy = ${m(dy)}`}</T>
      <Handle x={X(P.x)} y={Y(P.y)} color={C.green} active={drag.dragging === "P"} />
      <Handle x={X(Q.x)} y={Y(Q.y)} color={C.orange} active={drag.dragging === "Q"} />
      <T x={X(P.x) - 8} y={Y(P.y) + (dy >= 0 ? 16 : -9)} size={9.5} anchor="end" color={C.green} bold>{`P (${m(P.x)}, ${m(P.y)})`}</T>
      <T x={X(Q.x) + 8} y={Y(Q.y) + (dy >= 0 ? -9 : 16)} size={9.5} color={C.orange} bold>{`Q (${m(Q.x)}, ${m(Q.y)})`}</T>
    </>;
    controls = <Row>
      <Readout color={C.sky}>{`Δx = ${m(Q.x)} − ${paren(P.x)} = ${m(dx)}`}</Readout>
      <Readout color={C.pink}>{`Δy = ${m(Q.y)} − ${paren(P.y)} = ${m(dy)}`}</Readout>
      <Readout color={C.amber}>{`d = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} ≈ ${f1(d)}`}</Readout>
    </Row>;
    note = tx(t, "figPy_noteD", "Drag P and Q. Going from P to Q you move Δx sideways and Δy up or down; those two moves are the legs of a right triangle, and the straight-line distance is its hypotenuse. The legs are squared, so their signs do not matter: moving left 3 counts the same as moving right 3.");
  }

  return (
    <Figure
      title={tx(t, "figPy_title", "The Pythagorean theorem")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["squares", tx(t, "figPy_mSquares", "squares")],
        ["proof", tx(t, "figPy_mProof", "proof")],
        ["distance", tx(t, "figPy_mDist", "distance")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${mode === "squares" ? H : 300}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
