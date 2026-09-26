"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, useDrag, nearest, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// An angle as an amount of turn. One arm is fixed and points right; the other
// is dragged around the vertex. The coloured wedge is the turn from the fixed
// arm to the moving one, measured anticlockwise in degrees, with a protractor
// scale behind it. The readouts name the kind of angle and give its
// complement (what is missing to 90°), supplement (to 180°) and the reflex
// angle on the other side (to 360°).

const W = 560, H = 270, O: Pt = { x: 280, y: 140 }, R = 110;
const PRESETS = [30, 90, 135, 180, 270];

/** Direction of an angle in degrees, y up (SVG y grows down). */
const dir = (deg: number, r: number): Pt => ({ x: O.x + r * Math.cos((deg * Math.PI) / 180), y: O.y - r * Math.sin((deg * Math.PI) / 180) });

/** Pie wedge from 0° to `deg`, anticlockwise on screen. */
function wedge(deg: number, r: number) {
  if (deg <= 0) return "";
  const e = dir(Math.min(deg, 359.99), r);
  return `M${O.x},${O.y} L${O.x + r},${O.y} A${r},${r} 0 ${deg > 180 ? 1 : 0} 0 ${e.x},${e.y} Z`;
}

function kindOf(a: number, t?: TrackTranslations): [string, string] {
  if (a === 0) return [tx(t, "figAng_zero", "zero angle"), C.muted];
  if (a < 90) return [tx(t, "figAng_acute", "acute (less than 90°)"), C.green];
  if (a === 90) return [tx(t, "figAng_right", "right (exactly 90°)"), C.sky];
  if (a < 180) return [tx(t, "figAng_obtuse", "obtuse (between 90° and 180°)"), C.amber];
  if (a === 180) return [tx(t, "figAng_straight", "straight (exactly 180°)"), C.purple];
  return [tx(t, "figAng_reflex", "reflex (between 180° and 360°)"), C.pink];
}

export function AngleFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState(50);
  const P = dir(a, R);

  const drag = useDrag<"p">(
    q => nearest(q, [["p", P]], 22),
    (_, q) => {
      let d = (Math.atan2(O.y - q.y, q.x - O.x) * 180) / Math.PI;
      if (d < 0) d += 360;
      // Whole degrees, snapping onto multiples of 5 when close
      let v = Math.round(d) % 360;
      if (Math.abs(v - Math.round(v / 5) * 5) <= 1) v = (Math.round(v / 5) * 5) % 360;
      setA(v);
    });

  const [kind, col] = kindOf(a, t);
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <Figure
      title={tx(t, "figAng_title", "An angle is an amount of turn")}
      head={<>{PRESETS.map(v => <Btn key={v} active={a === v} onClick={() => setA(v)}>{`${v}°`}</Btn>)}</>}
      controls={<>
        <Row>
          <Readout color={col}>{`θ = ${a}°`}</Readout>
          <Readout color={col}>{kind}</Readout>
        </Row>
        <Row>
          <Readout color={a > 0 && a < 90 ? C.fg : C.muted}>{a > 0 && a < 90 ? `${tx(t, "figAng_comp", "complement")} 90° − ${a}° = ${90 - a}°` : `${tx(t, "figAng_comp", "complement")}: ${tx(t, "figAng_none", "none")}`}</Readout>
          <Readout color={a > 0 && a < 180 ? C.fg : C.muted}>{a > 0 && a < 180 ? `${tx(t, "figAng_supp", "supplement")} 180° − ${a}° = ${180 - a}°` : `${tx(t, "figAng_supp", "supplement")}: ${tx(t, "figAng_none", "none")}`}</Readout>
          <Readout>{`${tx(t, "figAng_rest", "rest of the turn")} 360° − ${a}° = ${360 - a}°`}</Readout>
        </Row>
      </>}
      note={tx(t, "figAng_note", "Drag the orange point around the vertex. The arm pointing right stays fixed; the angle is how far the other arm has turned from it, anticlockwise, on a scale where one full turn is 360°. Watch the name change as you cross 90° (right, marked with a small square), 180° (straight: the arms form one line) and on into reflex angles. The complement only exists for acute angles and the supplement only for angles below 180°.")}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* protractor scale */}
        <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={C.grid} />
        {ticks.map(d => {
          const i = dir(d, R - (d % 90 === 0 ? 10 : 5)), o = dir(d, R), l = dir(d, R + 13);
          return <g key={d}>
            <line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke={C.axis} strokeWidth={d % 90 === 0 ? 1.4 : 0.8} />
            {d % 30 === 0 && <T x={l.x} y={l.y + 3} size={8} anchor="middle" color={C.axis}>{`${d}°`}</T>}
          </g>;
        })}
        {a === 90
          ? <path d={`M${O.x + 18},${O.y} L${O.x + 18},${O.y - 18} L${O.x},${O.y - 18}`} fill={col} fillOpacity={0.2} stroke={col} strokeWidth={1.5} />
          : <path d={wedge(a, 44)} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={1.5} />}
        {a !== 0 && a !== 90 && (() => { const m = dir(a / 2, 58); return <T x={m.x} y={m.y + 3} size={11} anchor="middle" color={col} bold>{`${a}°`}</T>; })()}
        {a === 90 && <T x={O.x + 26} y={O.y - 24} size={11} color={col} bold>90°</T>}
        <line x1={O.x} y1={O.y} x2={O.x + R + 30} y2={O.y} stroke={C.fg} strokeWidth={2.4} strokeLinecap="round" />
        <line x1={O.x} y1={O.y} x2={dir(a, R + 30).x} y2={dir(a, R + 30).y} stroke={C.orange} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={O.x} cy={O.y} r={3.5} fill={C.fg} />
        <T x={O.x - 8} y={O.y + 16} size={9} anchor="end">{tx(t, "figAng_vertex", "vertex")}</T>
        <Handle {...P} color={C.orange} active={drag.dragging === "p"} />
      </svg>
    </Figure>
  );
}
