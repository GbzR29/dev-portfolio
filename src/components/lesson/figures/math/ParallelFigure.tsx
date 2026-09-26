"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Two lines crossed by a third line, the transversal. Each crossing makes four
// angles, eight in all. The mode picks a pair and colours it: vertical
// (opposite at one crossing), corresponding (same position at both
// crossings), alternate interior (between the lines, on opposite sides of the
// transversal) or co-interior (between the lines, same side). Drag the
// handle to turn the transversal. The tilt slider rotates the lower line:
// only while the two lines are parallel (tilt 0°) do the corresponding and
// alternate angles stay equal and the co-interior ones add to 180°.

type Mode = "vertical" | "corresponding" | "alternate" | "cointerior";
const W = 560, H = 280;
const P1: Pt = { x: 280, y: 95 }, M2: Pt = { x: 280, y: 195 };
const rad = (d: number) => (d * Math.PI) / 180;
const unit = (d: number): Pt => ({ x: Math.cos(rad(d)), y: -Math.sin(rad(d)) });
const at = (p: Pt, d: number, r: number): Pt => ({ x: p.x + unit(d).x * r, y: p.y + unit(d).y * r });

/** Wedge at p from direction d0 to d1 (anticlockwise, d1 > d0). */
function wedge(p: Pt, d0: number, d1: number, r: number) {
  const a = at(p, d0, r), b = at(p, d1, r);
  return `M${p.x},${p.y} L${a.x},${a.y} A${r},${r} 0 ${d1 - d0 > 180 ? 1 : 0} 0 ${b.x},${b.y} Z`;
}

// Which angles each mode highlights: [crossing (0 top, 1 bottom), position].
// Positions go anticlockwise from the right-hand arm of the line:
// 0 above-right, 1 above-left, 2 below-left, 3 below-right.
const PAIRS: Record<Mode, [number, number][]> = {
  vertical: [[0, 0], [0, 2]],
  corresponding: [[0, 0], [1, 0]],
  alternate: [[0, 2], [1, 0]],
  cointerior: [[0, 3], [1, 0]],
};

export function ParallelFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("corresponding");
  const [phi, setPhi] = useState(60);
  const [tilt, setTilt] = useState(0);

  // Bottom crossing: transversal P1 + s·u(phi) meets the lower line M2 + r·u(tilt)
  const u = unit(phi), v = unit(tilt);
  const den = u.x * v.y - u.y * v.x;
  const s = ((M2.x - P1.x) * v.y - (M2.y - P1.y) * v.x) / den;
  const P2: Pt = { x: P1.x + u.x * s, y: P1.y + u.y * s };
  const hnd = at(P1, phi, 70);

  const drag = useDrag<"h">(
    q => nearest(q, [["h", hnd]], 22),
    (_, q) => {
      const d = (Math.atan2(P1.y - q.y, q.x - P1.x) * 180) / Math.PI;
      // A point below the line gives the same transversal, pointing the other way
      setPhi(clamp(Math.round(d < 0 ? d + 180 : d), 20, 160));
    });

  // The four angles at each crossing, as [start, end] directions
  const lineDir = [0, tilt];
  const angles = [0, 1].map(k => {
    const a = lineDir[k], b = phi;
    return [[a, b], [b, a + 180], [a + 180, b + 180], [b + 180, a + 360]] as [number, number][];
  });
  const size = (k: number, i: number) => Math.round(angles[k][i][1] - angles[k][i][0]);
  const pairs = PAIRS[mode];
  const [x, y] = pairs.map(([k, i]) => size(k, i));
  const colA = C.sky, colB = C.pink;

  const relation = mode === "cointerior"
    ? `${x}° + ${y}° = ${x + y}°${x + y === 180 ? " ✓" : ""}`
    : `${x}° ${x === y ? "=" : "≠"} ${y}°`;
  const rule = mode === "vertical" ? tx(t, "figPar_rVert", "vertical angles are always equal")
    : mode === "cointerior" ? tx(t, "figPar_rCo", "co-interior angles add to 180° only when the lines are parallel")
      : tx(t, "figPar_rEq", "equal only when the lines are parallel");

  const long = (p: Pt, d: number) => { const a = at(p, d, -500), b = at(p, d, 500); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; };

  return (
    <Figure
      title={tx(t, "figPar_title", "Two lines and a transversal")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["vertical", tx(t, "figPar_mVert", "vertical")],
        ["corresponding", tx(t, "figPar_mCorr", "corresponding")],
        ["alternate", tx(t, "figPar_mAlt", "alternate")],
        ["cointerior", tx(t, "figPar_mCo", "co-interior")],
      ] as const} />}
      controls={<>
        <Slider label={tx(t, "figPar_tilt", "tilt lower line")} value={tilt} min={-20} max={20} step={1} onChange={setTilt} fmt={v => `${v}°`} width="w-28" />
        <Row>
          <Readout color={tilt === 0 ? C.green : C.amber}>{tilt === 0 ? tx(t, "figPar_isPar", "lines parallel") : tx(t, "figPar_notPar", "lines not parallel")}</Readout>
          <Readout>{relation}</Readout>
          <Readout color={C.muted}>{rule}</Readout>
        </Row>
      </>}
      note={tx(t, "figPar_note", "Drag the orange handle to turn the transversal and pick a pair of angles above. Every crossing makes two pairs of equal vertical angles, whatever the lines do. The other three relations link the two crossings, and they hold only while the lines are parallel: tilt the lower line and the corresponding and alternate angles stop being equal, while the co-interior pair stops adding to 180°. That is also how you test whether two lines are parallel.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {pairs.map(([k, i], j) => {
          const p = k === 0 ? P1 : P2, [d0, d1] = angles[k][i];
          return <path key={j} d={wedge(p, d0, d1, 30)} fill={j ? colB : colA} fillOpacity={0.3} stroke={j ? colB : colA} strokeWidth={1.4} />;
        })}
        <line {...long(P1, 0)} stroke={C.fg} strokeWidth={2} />
        <line {...long(M2, tilt)} stroke={tilt === 0 ? C.fg : C.amber} strokeWidth={2} />
        <line {...long(P1, phi)} stroke={C.orange} strokeWidth={2} />
        {[0, 1].map(k => angles[k].map(([d0, d1], i) => {
          const q = at(k === 0 ? P1 : P2, (d0 + d1) / 2, 44);
          const on = pairs.some(([pk, pi]) => pk === k && pi === i);
          return <T key={`${k}${i}`} x={q.x} y={q.y + 3} size={on ? 10.5 : 9} anchor="middle" color={on ? C.fg : C.muted} bold={on}>{`${size(k, i)}°`}</T>;
        }))}
        <T x={20} y={P1.y - 8} size={9}>{tx(t, "figPar_l1", "line 1")}</T>
        <T x={20} y={at(M2, tilt, -260).y - 8} size={9}>{tx(t, "figPar_l2", "line 2")}</T>
        <Handle {...hnd} color={C.orange} active={drag.dragging === "h"} />
      </svg>
    </Figure>
  );
}
