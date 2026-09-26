"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Btn, C, T, Handle, Vec, plot, Grid, useDrag, nearest, clamp, type Pt, type Plot } from "@/components/lesson/kit/figure";
import { type M2, I2, apply, mul, rot, n2, F_SHAPE } from "./mat2";

// ── What this figure shows ────────────────────────────────────────────────────
// columns — a 2 × 2 matrix is fully described by where it sends the two unit
//           steps: its first column is the new (1, 0), its second the new
//           (0, 1). Drag their tips; the whole grid, the letter F and the
//           vector v = (2, 1) follow, because every point is x·column 1 +
//           y·column 2.
// compose — two matrices applied one after the other. Rotating then shearing
//           is not the same as shearing then rotating: matrix products depend
//           on order.

type Mode = "columns" | "compose";
const W = 560, H = 300;
const V: Pt = { x: 2, y: 1 };
const PRESETS: [string, string, M2][] = [
  ["id", "identity", I2],
  ["rot", "rotate 30°", rot(30)],
  ["scale", "scale", [1.5, 0, 0, 0.75]],
  ["shear", "shear", [1, 1, 0, 1]],
  ["flip", "mirror", [-1, 0, 0, 1]],
  ["proj", "flatten", [1, 0, 0, 0]],
];
const SHEAR: M2 = [1, 1, 0, 1], TURN: M2 = rot(90);

const poly = (p: Plot, pts: Pt[]) => pts.map(q => `${p.X(q.x).toFixed(1)},${p.Y(q.y).toFixed(1)}`).join(" ");
const S = (p: Plot, q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });

/** The integer grid after the matrix: lines x = k and y = k mapped through m. */
function WarpedGrid({ p, m, color }: { p: Plot; m: M2; color: string }) {
  const L: React.ReactNode[] = [];
  for (let k = -8; k <= 8; k++) {
    const a = apply(m, { x: k, y: -8 }), b = apply(m, { x: k, y: 8 });
    const c = apply(m, { x: -8, y: k }), d = apply(m, { x: 8, y: k });
    L.push(<line key={`v${k}`} x1={p.X(a.x)} y1={p.Y(a.y)} x2={p.X(b.x)} y2={p.Y(b.y)} stroke={color} strokeWidth={k === 0 ? 1.4 : 0.7} opacity={k === 0 ? 0.8 : 0.4} />);
    L.push(<line key={`h${k}`} x1={p.X(c.x)} y1={p.Y(c.y)} x2={p.X(d.x)} y2={p.Y(d.y)} stroke={color} strokeWidth={k === 0 ? 1.4 : 0.7} opacity={k === 0 ? 0.8 : 0.4} />);
  }
  return <g pointerEvents="none">{L}</g>;
}

function MatrixReadout({ m, name }: { m: M2; name: string }) {
  return <Readout>{`${name} = [ ${n2(m[0])}  ${n2(m[1])} ; ${n2(m[2])}  ${n2(m[3])} ]`}</Readout>;
}

export function MatrixFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("columns");
  const [m, setM] = useState<M2>([1, 0.5, 0.25, 1]);
  const [shearFirst, setShearFirst] = useState(false);

  const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const i1 = { x: m[0], y: m[2] }, j1 = { x: m[1], y: m[3] };
  const snap = (v: number, lim: number) => clamp(Math.round(v * 4) / 4, -lim, lim);
  const drag = useDrag<"i" | "j">(
    q => (mode === "columns" ? nearest(q, [["i", S(pr, i1)], ["j", S(pr, j1)]], 18) : null),
    (id, q) => {
      const w = pr.inv(q), x = snap(w.x, 3), y = snap(w.y, 2.5);
      setM(cur => (id === "i" ? [x, cur[1], y, cur[3]] : [cur[0], x, cur[2], y]));
    });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "columns") {
    const v1 = apply(m, V), step = { x: V.x * i1.x, y: V.x * i1.y };
    svg = <>
      <Grid p={pr} step={1} />
      <WarpedGrid p={pr} m={m} color={C.sky} />
      <polygon points={poly(pr, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
      <polygon points={poly(pr, F_SHAPE.map(q => apply(m, q)))} fill={C.amber} fillOpacity={0.3} stroke={C.amber} strokeWidth={1.6} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, step)} color={C.red} w={1.6} dash="4 3" opacity={0.7} />
      <Vec a={S(pr, step)} b={S(pr, v1)} color={C.green} w={1.6} dash="4 3" opacity={0.7} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, v1)} color={C.purple} w={2.2} />
      <T x={pr.X(v1.x) + 8} y={pr.Y(v1.y) - 6} size={10} color={C.purple} bold>{`Av = (${n2(v1.x)}, ${n2(v1.y)})`}</T>
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, i1)} color={C.red} w={3} />
      <Vec a={S(pr, { x: 0, y: 0 })} b={S(pr, j1)} color={C.green} w={3} />
      <Handle x={pr.X(i1.x)} y={pr.Y(i1.y)} color={C.red} active={drag.dragging === "i"} />
      <Handle x={pr.X(j1.x)} y={pr.Y(j1.y)} color={C.green} active={drag.dragging === "j"} />
    </>;
    controls = <>
      <Row>{PRESETS.map(([k, label, pm]) =>
        <Btn key={k} onClick={() => setM(pm)}>{tx(t, `figMat_p_${k}`, label)}</Btn>)}</Row>
      <Row>
        <MatrixReadout m={m} name="A" />
        <Readout color={C.red}>{`A(1, 0) = (${n2(i1.x)}, ${n2(i1.y)})`}</Readout>
        <Readout color={C.green}>{`A(0, 1) = (${n2(j1.x)}, ${n2(j1.y)})`}</Readout>
        <Readout color={C.purple}>{`A(2, 1) = 2·(${n2(i1.x)}, ${n2(i1.y)}) + 1·(${n2(j1.x)}, ${n2(j1.y)})`}</Readout>
      </Row>
    </>;
    note = tx(t, "figMat_noteC", "Drag the red and green tips. They are the matrix's two columns: where the unit step right (1, 0) and the unit step up (0, 1) end up. Everything else follows from them. The blue grid is the old square grid after the matrix, the amber F is the grey F after the matrix, and the purple vector is v = (2, 1) after the matrix: 2 red steps plus 1 green step (dashed). Try the presets, and notice that grid lines stay straight, parallel and evenly spaced, and the origin never moves.");
  } else {
    const pl = plot({ W: W / 2, H, x0: -3.2, x1: 3.2, y0: -2.6, y1: 4.26 });
    const first = shearFirst ? SHEAR : TURN, second = shearFirst ? TURN : SHEAR;
    const mid = F_SHAPE.map(q => apply(first, q));
    const end = F_SHAPE.map(q => apply(second, apply(first, q)));
    const other = F_SHAPE.map(q => apply(first, apply(second, q)));
    const prod = mul(second, first);
    const panel = (dx: number, title: string, body: React.ReactNode) =>
      <g transform={`translate(${dx},0)`}>
        <Grid p={pl} step={1} labels={false} />
        {body}
        <T x={8} y={16} size={10} color={C.fg} bold>{title}</T>
      </g>;
    svg = <>
      {panel(0, tx(t, "figMat_steps", "one step at a time"), <>
        <polygon points={poly(pl, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
        <polygon points={poly(pl, mid)} fill={C.sky} fillOpacity={0.2} stroke={C.sky} strokeWidth={1.2} />
        <polygon points={poly(pl, end)} fill={C.amber} fillOpacity={0.35} stroke={C.amber} strokeWidth={1.6} />
      </>)}
      <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke={C.axis} strokeWidth={1} />
      {panel(W / 2, tx(t, "figMat_swapped", "the other order"), <>
        <polygon points={poly(pl, F_SHAPE)} fill={C.muted} fillOpacity={0.12} stroke={C.muted} strokeWidth={1} strokeDasharray="3 3" />
        <polygon points={poly(pl, end)} fill="none" stroke={C.amber} strokeWidth={1} strokeDasharray="4 3" />
        <polygon points={poly(pl, other)} fill={C.pink} fillOpacity={0.35} stroke={C.pink} strokeWidth={1.6} />
      </>)}
    </>;
    controls = <>
      <Row>
        <Btn active={!shearFirst} onClick={() => setShearFirst(false)}>{tx(t, "figMat_turnFirst", "turn, then shear")}</Btn>
        <Btn active={shearFirst} onClick={() => setShearFirst(true)}>{tx(t, "figMat_shearFirst", "shear, then turn")}</Btn>
      </Row>
      <Row>
        <MatrixReadout m={TURN} name="R" />
        <MatrixReadout m={SHEAR} name="S" />
        <Readout color={C.amber}>{`${shearFirst ? "R·S" : "S·R"} = [ ${n2(prod[0])}  ${n2(prod[1])} ; ${n2(prod[2])}  ${n2(prod[3])} ]`}</Readout>
        <Readout color={C.pink}>{(() => { const o = mul(first, second); return `${shearFirst ? "S·R" : "R·S"} = [ ${n2(o[0])}  ${n2(o[1])} ; ${n2(o[2])}  ${n2(o[3])} ]`; })()}</Readout>
      </Row>
    </>;
    note = tx(t, "figMat_noteM", "R turns a quarter turn, S shears (it slides each point sideways by its height). Left: the grey F, after the first matrix (blue), then after the second (amber). Right: the same two matrices in the other order (pink), with the amber result dashed for comparison. They differ, and so do the two products in the readouts. The product written first is applied last: S·R means R first, then S, because (S·R)v = S(Rv).");
  }

  return (
    <Figure
      title={tx(t, "figMat_title", "A matrix moves the whole plane")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["columns", tx(t, "figMat_mCols", "columns")],
        ["compose", tx(t, "figMat_mComp", "order matters")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
