"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { type M2, apply, det, rot, n2, F_SHAPE } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// area — the unit square (area 1) becomes the parallelogram spanned by the
//        matrix's columns; its signed area is det = ad − bc. Blue: orientation
//        kept. Pink: flipped (the F reads backwards). Zero: squashed flat.
// bary — a point P in a triangle splits it into three smaller triangles. Each
//        one's share of the total signed area is P's weight for the opposite
//        corner; all three weights ≥ 0 exactly when P is inside. The dot at P
//        is the three corner colours mixed with those weights, as a GPU does.

type Mode = "area" | "bary";
type Key = "i" | "j" | "P" | "A" | "B" | "C";
const W = 560, H = 300;

const poly = (p: Plot, pts: Pt[]) => pts.map(q => `${p.X(q.x).toFixed(1)},${p.Y(q.y).toFixed(1)}`).join(" ");
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
/** Twice the signed area of triangle abc (positive when anticlockwise). */
const area2 = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);

export function DeterminantFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("area");
  const [m, setM] = useState<M2>([2, 0.5, 0.5, 1.25]);
  const [tri, setTri] = useState<Record<"A" | "B" | "C" | "P", Pt>>({
    A: { x: -3.5, y: -2 }, B: { x: 3.5, y: -1.5 }, C: { x: 0, y: 2.5 }, P: { x: 0.3, y: 0 },
  });

  const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const i1 = { x: m[0], y: m[2] }, j1 = { x: m[1], y: m[3] };
  const snap = (v: number, lim: number) => clamp(Math.round(v * 4) / 4, -lim, lim);
  const drag = useDrag<Key>(
    q => mode === "area"
      ? nearest<Key>(q, [["i", S(pr, i1)], ["j", S(pr, j1)]], 18)
      : nearest<Key>(q, (["P", "A", "B", "C"] as const).map(k => [k, S(pr, tri[k])] as [Key, Pt]), 18),
    (id, q) => {
      const w = pr.inv(q);
      if (id === "i" || id === "j") {
        const x = snap(w.x, 3), y = snap(w.y, 2.5);
        setM(cur => (id === "i" ? [x, cur[1], y, cur[3]] : [cur[0], x, cur[2], y]));
      } else {
        setTri(cur => ({ ...cur, [id]: { x: clamp(w.x, -5.3, 5.3), y: clamp(w.y, -2.8, 2.8) } }));
      }
    });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "area") {
    const d = det(m);
    const col = Math.abs(d) < 1e-6 ? C.muted : d > 0 ? C.sky : C.pink;
    const sq = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    const par = sq.map(q => apply(m, q));
    const small = F_SHAPE.map(q => ({ x: q.x * 0.35 + 0.3, y: q.y * 0.35 + 0.15 }));
    svg = <>
      <Grid p={pr} step={1} />
      <polygon points={poly(pr, sq)} fill={C.muted} fillOpacity={0.15} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(pr, par)} fill={col} fillOpacity={0.28} stroke={col} strokeWidth={1.6} />
      <polygon points={poly(pr, small.map(q => apply(m, q)))} fill={C.amber} fillOpacity={0.6} stroke={C.amber} strokeWidth={1} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
      <Handle x={pr.X(i1.x)} y={pr.Y(i1.y)} color={C.red} active={drag.dragging === "i"} />
      <Handle x={pr.X(j1.x)} y={pr.Y(j1.y)} color={C.green} active={drag.dragging === "j"} />
      <T x={pr.X(par[2].x) + 8} y={pr.Y(par[2].y) + (par[2].y >= 0 ? -8 : 16)} size={11} color={col} bold>{`det = ${n2(d)}`}</T>
    </>;
    controls = <>
      <Row>
        <Btn onClick={() => setM(rot(35))}>{tx(t, "figDet_pRot", "rotation")}</Btn>
        <Btn onClick={() => setM([1, 1, 0, 1])}>{tx(t, "figDet_pShear", "shear")}</Btn>
        <Btn onClick={() => setM([2, 0, 0, 1.5])}>{tx(t, "figDet_pScale", "scale 2 × 1.5")}</Btn>
        <Btn onClick={() => setM([0, 1, 1, 0])}>{tx(t, "figDet_pSwap", "swap x and y")}</Btn>
        <Btn onClick={() => setM([1, 2, 0.5, 1])}>{tx(t, "figDet_pFlat", "squash")}</Btn>
      </Row>
      <Row>
        <Readout>{`A = [ ${n2(m[0])}  ${n2(m[1])} ; ${n2(m[2])}  ${n2(m[3])} ]`}</Readout>
        <Readout color={col}>{`det A = ad − bc = ${n2(m[0])}·${n2(m[3])} − ${n2(m[1])}·${n2(m[2])} = ${n2(d)}`}</Readout>
        <Readout color={col}>{Math.abs(d) < 1e-6
          ? tx(t, "figDet_flat", "squashed onto a line: no area left")
          : d > 0 ? tx(t, "figDet_kept", "orientation kept") : tx(t, "figDet_flip", "orientation flipped")}</Readout>
      </Row>
    </>;
    note = tx(t, "figDet_noteA", "Drag the column tips. The dashed unit square has area 1; after the matrix it becomes the parallelogram spanned by the two columns, and its area is |det|. Every shape is scaled by the same factor, so the small F grows or shrinks just as much. Swing the green column past the red one and the determinant changes sign: the F now reads backwards (blue turns pink). Line the columns up and the determinant is 0: the plane collapses onto a line.");
  } else {
    const { A, B, C: Cc, P } = tri;
    const tot = area2(A, B, Cc) || 1e-9;
    const u = area2(P, B, Cc) / tot, v = area2(A, P, Cc) / tot, w = area2(A, B, P) / tot;
    const inside = u >= 0 && v >= 0 && w >= 0;
    const ch = (k: number) => Math.round(clamp(k, 0, 1) * 255);
    const mix = `rgb(${ch(u)},${ch(v)},${ch(w)})`;
    svg = <>
      <Grid p={pr} step={1} />
      <polygon points={poly(pr, [P, B, Cc])} fill={C.red} fillOpacity={0.22} stroke={C.red} strokeWidth={0.8} />
      <polygon points={poly(pr, [A, P, Cc])} fill={C.green} fillOpacity={0.22} stroke={C.green} strokeWidth={0.8} />
      <polygon points={poly(pr, [A, B, P])} fill={C.blue} fillOpacity={0.22} stroke={C.blue} strokeWidth={0.8} />
      <polygon points={poly(pr, [A, B, Cc])} fill="none" stroke={C.fg} strokeWidth={1.6} />
      {(["A", "B", "C"] as const).map((k, i) => {
        const col = [C.red, C.green, C.blue][i];
        return <g key={k}>
          <Handle x={pr.X(tri[k].x)} y={pr.Y(tri[k].y)} color={col} active={drag.dragging === k} />
          <T x={pr.X(tri[k].x) + 9} y={pr.Y(tri[k].y) - 7} size={11} color={col} bold>{k}</T>
        </g>;
      })}
      <circle cx={pr.X(P.x)} cy={pr.Y(P.y)} r={11} fill={mix} stroke={C.fg} strokeWidth={1.2} pointerEvents="none" />
      <T x={pr.X(P.x) + 14} y={pr.Y(P.y) + 4} size={11} color={C.fg} bold>P</T>
    </>;
    controls = <Row>
      <Readout color={C.red}>{`u = area(PBC)/area(ABC) = ${n2(u)}`}</Readout>
      <Readout color={C.green}>{`v = area(APC)/area(ABC) = ${n2(v)}`}</Readout>
      <Readout color={C.blue}>{`w = area(ABP)/area(ABC) = ${n2(w)}`}</Readout>
      <Readout>{`u + v + w = ${n2(u + v + w)}`}</Readout>
      <Readout color={inside ? C.green : C.pink}>{inside ? tx(t, "figDet_in", "all ≥ 0: P is inside") : tx(t, "figDet_out", "a weight < 0: P is outside")}</Readout>
    </Row>;
    note = tx(t, "figDet_noteB", "Drag P (and the corners). P cuts the triangle into three smaller ones, each opposite one corner. Its share of the whole area is P's weight for that corner: u for A (red), v for B (green), w for C (blue). The weights always add up to 1, and P = uA + vB + wC. Move P outside and one small triangle turns inside out, so its signed area and weight go negative. The circle at P is red, green and blue mixed in those amounts, which is exactly how a GPU blends the colours of a triangle's three corners.");
  }

  return (
    <Figure
      title={tx(t, "figDet_title", "What the determinant measures")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["area", tx(t, "figDet_mArea", "area scale")],
        ["bary", tx(t, "figDet_mBary", "barycentric")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
