"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// The shoelace formula for the area of any polygon from its corner
// coordinates. Each edge Pᵢ → Pᵢ₊₁ contributes xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ, which is
// twice the signed area of the triangle (origin, Pᵢ, Pᵢ₊₁): positive (green)
// when that triangle turns anticlockwise, negative (red) when it turns
// clockwise. Half the sum is the polygon's signed area: the parts outside
// the polygon cancel. Its sign tells which way the corners go round.

const p = plot({ W: 560, H: 300, x0: -7, x1: 7, y0: -3.75, y1: 3.75 });
const START: Pt[] = [{ x: -4, y: -2 }, { x: 3, y: -3 }, { x: 5, y: 1 }, { x: 1, y: 3 }, { x: -3, y: 2 }];
const V = (q: Pt) => ({ x: p.X(q.x), y: p.Y(q.y) });
const sgn = (v: number) => (v < 0 ? `− ${-v}` : `+ ${v}`);
const m = (v: number) => String(v).replace("-", "−");

export function ShoelaceFigure({ t }: { t?: TrackTranslations }) {
  const [P, setP] = useState<Pt[]>(START);
  const [fan, setFan] = useState(false);

  const drag = useDrag<number>(
    q => nearest(q, P.map((v, i) => [i, V(v)] as [number, Pt]), 18),
    (i, q) => {
      const w = p.inv(q);
      const s = { x: clamp(Math.round(w.x), -6, 6), y: clamp(Math.round(w.y), -3, 3) };
      setP(o => o.some((v, j) => j !== i && v.x === s.x && v.y === s.y) ? o : o.map((v, j) => (j === i ? s : v)));
    });

  const terms = P.map((a, i) => { const b = P[(i + 1) % P.length]; return a.x * b.y - b.x * a.y; });
  const sum = terms.reduce((a, b) => a + b, 0);
  const area = sum / 2;
  const turn = sum > 0 ? tx(t, "figShoe_ccw", "anticlockwise (positive)") : sum < 0 ? tx(t, "figShoe_cw", "clockwise (negative)") : tx(t, "figShoe_zero", "zero: flat or crossed");

  return (
    <Figure
      title={tx(t, "figShoe_title", "The shoelace formula")}
      head={<>
        <Btn active={fan} onClick={() => setFan(f => !f)}>{tx(t, "figShoe_fan", "triangles from origin")}</Btn>
        <Btn onClick={() => setP(o => [...o].reverse())}>{tx(t, "figShoe_rev", "reverse order")}</Btn>
        <Btn onClick={() => setP(START)}>{tx(t, "figShoe_reset", "reset")}</Btn>
      </>}
      controls={<>
        <Row>
          <Readout>{`Σ = ${terms.map((v, i) => (i ? sgn(v) : String(v).replace("-", "−"))).join(" ")} = ${String(sum).replace("-", "−")}`}</Readout>
        </Row>
        <Row>
          <Readout color={sum >= 0 ? C.green : C.red}>{`${tx(t, "figShoe_signed", "signed area")} = Σ / 2 = ${String(area).replace("-", "−")}`}</Readout>
          <Readout color={C.sky}>{`${tx(t, "figShoe_area", "area")} = ${Math.abs(area)}`}</Readout>
          <Readout>{`${tx(t, "figShoe_order", "order")}: ${turn}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figShoe_note", "Drag the corners, numbered in order. The readout lists one term xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ per edge; half their sum is the area. Turn on the triangles from the origin: each term is twice the signed area of one of them, green when it turns anticlockwise and red when it turns clockwise, and the overlapping green and red parts outside the polygon cancel. Reverse the order and only the sign flips. Drag one corner across an edge so the outline crosses itself and the formula stops giving a meaningful area.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        {fan && P.map((a, i) => {
          const b = P[(i + 1) % P.length], A = V(a), B = V(b), O = V({ x: 0, y: 0 });
          const col = terms[i] >= 0 ? C.green : C.red;
          return <polygon key={i} points={`${O.x},${O.y} ${A.x},${A.y} ${B.x},${B.y}`} fill={col} fillOpacity={0.14} stroke={col} strokeOpacity={0.6} strokeDasharray="3 3" />;
        })}
        <polygon points={P.map(q => `${V(q).x},${V(q).y}`).join(" ")} fill={C.sky} fillOpacity={fan ? 0.08 : 0.2} stroke={C.sky} strokeWidth={2.2} strokeLinejoin="round" />
        {P.map((a, i) => {
          const b = P[(i + 1) % P.length], A = V(a), B = V(b);
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, ang = Math.atan2(B.y - A.y, B.x - A.x);
          const hx = mx - 8 * Math.cos(ang), hy = my - 8 * Math.sin(ang);
          return <polygon key={i} fill={C.sky} points={`${mx + 6 * Math.cos(ang)},${my + 6 * Math.sin(ang)} ${hx - 5 * Math.sin(ang)},${hy + 5 * Math.cos(ang)} ${hx + 5 * Math.sin(ang)},${hy - 5 * Math.cos(ang)}`} />;
        })}
        {P.map((q, i) => <g key={i}>
          <Handle {...V(q)} color={C.orange} active={drag.dragging === i} />
          <T x={V(q).x + 9} y={V(q).y - 9} size={10} color={C.fg} bold>{`P${i + 1} (${m(q.x)}, ${m(q.y)})`}</T>
        </g>)}
      </svg>
    </Figure>
  );
}
