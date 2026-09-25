"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T, Vec, Handle, plot, Grid, useDrag, nearest, f2, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The 2D cross product u × v = uₓv_y − u_yvₓ: a single number, the signed area
// of the parallelogram spanned by u and v. Positive when v is counter-clockwise
// from u (to its left), negative when clockwise.
//   side     — which side of the line A→B is P on? sign of (B − A) × (P − A)
//   triangle — the winding of A, B, C (CCW or CW), its area (half the cross),
//              and "is P inside?": the same sign for all three edges

type Mode = "side" | "tri";
const cr = (u: Pt, v: Pt) => u.x * v.y - u.y * v.x;
const sub = (a: Pt, b: Pt) => ({ x: a.x - b.x, y: a.y - b.y });

export function Cross2DFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("side");
  const [A, setA] = useState<Pt>({ x: -3, y: -1.5 });
  const [B, setB] = useState<Pt>({ x: 2.5, y: 0.8 });
  const [Cc, setC] = useState<Pt>({ x: -1, y: 2.2 });
  const [P, setP] = useState<Pt>({ x: 0.3, y: 1.5 });
  const p = plot({ W: 560, H: 300, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
  const S = (v: Pt) => ({ x: p.X(v.x), y: p.Y(v.y) });
  const pts: [string, Pt][] = mode === "side" ? [["A", A], ["B", B], ["P", P]] : [["A", A], ["B", B], ["C", Cc], ["P", P]];
  const drag = useDrag<string>(q => nearest(q, pts.map(([id, v]) => [id, S(v)] as [string, Pt]), 16), (id, q) => {
    const w = p.inv(q), v = { x: Math.max(-5.4, Math.min(5.4, w.x)), y: Math.max(-2.9, Math.min(2.9, w.y)) };
    ({ A: setA, B: setB, C: setC, P: setP } as Record<string, (v: Pt) => void>)[id](v);
  });

  const ab = sub(B, A), ap = sub(P, A);
  const side = cr(ab, ap);
  const e1 = cr(sub(B, A), sub(P, A)), e2 = cr(sub(Cc, B), sub(P, B)), e3 = cr(sub(A, Cc), sub(P, Cc));
  const area2 = cr(sub(B, A), sub(Cc, A));
  const inside = (e1 >= 0 && e2 >= 0 && e3 >= 0) || (e1 <= 0 && e2 <= 0 && e3 <= 0);
  const col = (v: number) => (v > 0 ? C.green : v < 0 ? C.red : C.muted);

  return (
    <Figure
      title={tx(t, "figCross2_title", "The 2D cross product: left, right and winding")}
      head={<Choice value={mode} onChange={setMode} options={[["side", tx(t, "figCross2_side", "which side?")], ["tri", tx(t, "figCross2_tri", "triangle")]] as const} />}
      controls={<Row>
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
      </Row>}
      note={mode === "side"
        ? tx(t, "figCross2_noteSide", "Drag A, B and P. The number (B − A) × (P − A) is the signed area of the parallelogram built on the two arrows from A. Walking from A to B, it is positive when P is on your left, negative on your right and zero exactly on the line. Games use this constantly: is the target left or right of me (to turn toward it), which side of a wall is the player on, has a car crossed the finish line (the sign changed between two frames)?")
        : tx(t, "figCross2_noteTri", "Drag the corners. The sign of (B − A) × (C − A) tells the winding: positive when A → B → C turns counter-clockwise, which is exactly how OpenGL decides whether a triangle faces the camera (after projection). Half its absolute value is the triangle's area. Move P: it is inside when it is on the same side of all three edges, walked in order, so the three edge tests share a sign. That is the core of how a GPU rasteriser decides which pixels a triangle covers.")}
    >
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
        {pts.map(([id, v]) => (
          <g key={id}>
            <Handle x={S(v).x} y={S(v).y} color={id === "P" ? (mode === "tri" ? (inside ? C.green : C.red) : col(side)) : C.fg} r={5} />
            <T x={S(v).x + 9} y={S(v).y - 7} size={11} bold color={C.fg}>{id}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
