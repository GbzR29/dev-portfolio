"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, useDrag, nearest, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// parts  — the named pieces of a circle: centre, radius, diameter, a chord
//          between two draggable points, the arc between them and the tangent
//          at one of them (always perpendicular to the radius).
// sector — a slice of angle θ: its arc is θ/360 of the circumference and its
//          area θ/360 of the disc.
// thales — any point on a circle seen from the two ends of a diameter makes
//          a right angle.

type Mode = "parts" | "sector" | "thales";
const W = 560, H = 300;
const p = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const R = 2.4;
const DEG = 180 / Math.PI;
const n2 = (v: number) => (+v.toFixed(2)).toString();
const on = (a: number, r = R): Pt => ({ x: r * Math.cos(a), y: r * Math.sin(a) });
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);

/** SVG arc path along the circle of radius r from angle a0 to a1 (counter-clockwise). */
function arcPath(a0: number, a1: number, r = R) {
  let d = "";
  for (let i = 0; i <= 64; i++) { const q = on(a0 + ((a1 - a0) * i) / 64, r); d += `${i ? "L" : "M"}${X(q)},${Y(q)}`; }
  return d;
}

export function CircleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("parts");
  const [aP, setAP] = useState(0.4), [aQ, setAQ] = useState(2.3);
  const [theta, setTheta] = useState(120), [rad, setRad] = useState(2);
  const [aT, setAT] = useState(1.2);

  const drag = useDrag<"P" | "Q" | "T">(
    q => mode === "parts" ? nearest(q, [["P", { x: X(on(aP)), y: Y(on(aP)) }], ["Q", { x: X(on(aQ)), y: Y(on(aQ)) }]], 20)
      : mode === "thales" ? nearest(q, [["T", { x: X(on(aT)), y: Y(on(aT)) }]], 20) : null,
    (id, q) => {
      const w = p.inv(q), a = Math.atan2(w.y, w.x);
      if (id === "P") setAP(a); else if (id === "Q") setAQ(a); else setAT(Math.abs(a) < 0.08 || Math.abs(a) > Math.PI - 0.08 ? aT : a);
    });

  const O = { x: 0, y: 0 };
  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "parts") {
    const P = on(aP), Q = on(aQ);
    const u = { x: -Math.sin(aP), y: Math.cos(aP) };             // along the tangent at P
    const span = ((aQ - aP) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const chord = Math.hypot(P.x - Q.x, P.y - Q.y);
    svg = <>
      <circle cx={X(O)} cy={Y(O)} r={R * p.sx} fill={C.sky} fillOpacity={0.06} stroke={C.fg} strokeWidth={1.6} />
      <line x1={X(on(0))} y1={Y(on(0))} x2={X(on(Math.PI))} y2={Y(on(Math.PI))} stroke={C.purple} strokeWidth={1.6} strokeDasharray="5 3" />
      <T x={X(on(Math.PI)) + 6} y={Y(O) + 14} size={10} color={C.purple} bold>{tx(t, "figCir_diam", "diameter")}</T>
      <path d={arcPath(aP, aP + span)} fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
      <line x1={X(P)} y1={Y(P)} x2={X(Q)} y2={Y(Q)} stroke={C.pink} strokeWidth={2} />
      <line x1={X(O)} y1={Y(O)} x2={X(P)} y2={Y(P)} stroke={C.green} strokeWidth={2} />
      <line x1={p.X(P.x - u.x * 2)} y1={p.Y(P.y - u.y * 2)} x2={p.X(P.x + u.x * 2)} y2={p.Y(P.y + u.y * 2)} stroke={C.sky} strokeWidth={2} />
      <path d={`M${p.X(P.x - Math.cos(aP) * 0.3)},${p.Y(P.y - Math.sin(aP) * 0.3)} l${u.x * 0.3 * p.sx},${-u.y * 0.3 * p.sx} l${Math.cos(aP) * 0.3 * p.sx},${-Math.sin(aP) * 0.3 * p.sx}`} fill="none" stroke={C.fg} strokeWidth={1} />
      <circle cx={X(O)} cy={Y(O)} r={3} fill={C.fg} />
      <T x={X(O) - 5} y={Y(O) - 6} size={10} anchor="end" color={C.fg} bold>O</T>
      <T x={X({ x: P.x / 2, y: P.y / 2 }) + 6} y={Y({ x: P.x / 2, y: P.y / 2 })} size={10} color={C.green} bold>{tx(t, "figCir_radius", "radius")}</T>
      <T x={X({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 })} y={Y({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 }) + 14} size={10} anchor="middle" color={C.pink} bold>{tx(t, "figCir_chord", "chord")}</T>
      <T x={X(on(aP + span / 2, R + 0.35))} y={Y(on(aP + span / 2, R + 0.35)) + 4} size={10} anchor="middle" color={C.amber} bold>{tx(t, "figCir_arc", "arc")}</T>
      <T x={p.X(P.x - u.x * 1.6 + Math.cos(aP) * 0.3)} y={p.Y(P.y - u.y * 1.6 + Math.sin(aP) * 0.3)} size={10} anchor="middle" color={C.sky} bold>{tx(t, "figCir_tangent", "tangent")}</T>
      <Handle x={X(P)} y={Y(P)} color={C.green} active={drag.dragging === "P"} />
      <Handle x={X(Q)} y={Y(Q)} color={C.pink} active={drag.dragging === "Q"} />
    </>;
    controls = <Row>
      <Readout color={C.green}>{`r = ${n2(R)}`}</Readout>
      <Readout color={C.purple}>{`d = 2r = ${n2(2 * R)}`}</Readout>
      <Readout color={C.pink}>{`${tx(t, "figCir_chord", "chord")} = ${n2(chord)} ≤ d`}</Readout>
      <Readout color={C.sky}>{tx(t, "figCir_perp", "tangent ⊥ radius: 90°")}</Readout>
    </Row>;
    note = tx(t, "figCir_noteP", "Drag the green and pink points around the circle. The radius goes from the centre O to the circle; the diameter crosses the whole circle through O and is two radii. A chord joins any two points of the circle; it is never longer than the diameter, and it equals the diameter only when it passes through O. The arc is the piece of the circle between the two points. The tangent touches the circle at one point only, and it always meets the radius there at a right angle.");
  } else if (mode === "sector") {
    const a1 = (theta / DEG), frac = theta / 360;
    const ro = rad;
    svg = <>
      <circle cx={X(O)} cy={Y(O)} r={ro * p.sx} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />
      <path d={`M${X(O)},${Y(O)}` + arcPath(0, a1, ro).replace(/^M/, "L") + "Z"} fill={C.sky} fillOpacity={0.3} stroke={C.sky} strokeWidth={1.4} strokeLinejoin="round" />
      <path d={arcPath(0, a1, ro)} fill="none" stroke={C.amber} strokeWidth={4.5} strokeLinecap="round" />
      <path d={arcPath(0, a1, 0.45)} fill="none" stroke={C.fg} strokeWidth={1.2} />
      <T x={X(on(a1 / 2, 0.75))} y={Y(on(a1 / 2, 0.75)) + 4} size={10} anchor="middle" color={C.fg} bold>{`${Math.round(theta)}°`}</T>
      <T x={X({ x: ro / 2, y: 0 })} y={Y(O) + 14} size={10} anchor="middle" color={C.green} bold>r</T>
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figCir_theta", "angle θ")} value={theta} min={5} max={360} step={5} onChange={setTheta} fmt={v => `${v}°`} />
        <Slider label={tx(t, "figCir_r", "radius r")} value={rad} min={0.5} max={2.8} step={0.1} onChange={setRad} fmt={n2} />
      </Sliders>
      <Row>
        <Readout>{`θ/360 = ${n2(frac)}`}</Readout>
        <Readout color={C.amber}>{`${tx(t, "figCir_arcLen", "arc")} = ${n2(frac)} · 2π · ${n2(ro)} = ${n2(frac * 2 * Math.PI * ro)}`}</Readout>
        <Readout color={C.sky}>{`${tx(t, "figCir_secArea", "sector")} = ${n2(frac)} · π · ${n2(ro)}² = ${n2(frac * Math.PI * ro * ro)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figCir_noteS", "A sector is a slice cut by two radii. Its angle θ is some fraction of the full 360°, and the sector takes that same fraction of everything: θ/360 of the circumference for its arc, θ/360 of the area for itself. At 90° it is a quarter; at 180°, half; at 360°, the whole circle.");
  } else {
    const A = on(Math.PI), B = on(0), P = on(aT);
    const v1 = { x: A.x - P.x, y: A.y - P.y }, v2 = { x: B.x - P.x, y: B.y - P.y };
    const ang = Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))) * DEG;
    const s = 0.28, l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    const m1 = { x: P.x + (v1.x / l1) * s, y: P.y + (v1.y / l1) * s }, m2 = { x: P.x + (v2.x / l2) * s, y: P.y + (v2.y / l2) * s };
    svg = <>
      <circle cx={X(O)} cy={Y(O)} r={R * p.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
      <line x1={X(O)} y1={Y(O)} x2={X(P)} y2={Y(P)} stroke={C.green} strokeWidth={1.2} strokeDasharray="4 3" />
      <polygon points={[A, B, P].map(q => `${X(q)},${Y(q)}`).join(" ")} fill={C.amber} fillOpacity={0.2} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${X(m1)},${Y(m1)} L${p.X(m1.x + m2.x - P.x)},${p.Y(m1.y + m2.y - P.y)} L${X(m2)},${Y(m2)}`} fill="none" stroke={C.fg} strokeWidth={1.2} />
      <circle cx={X(O)} cy={Y(O)} r={3} fill={C.fg} />
      <T x={X(A) - 8} y={Y(A) + 4} size={11} anchor="end" color={C.fg} bold>A</T>
      <T x={X(B) + 8} y={Y(B) + 4} size={11} color={C.fg} bold>B</T>
      <T x={X(O)} y={Y(O) + 15} size={10} anchor="middle" color={C.fg} bold>O</T>
      <Handle x={X(P)} y={Y(P)} color={C.pink} active={drag.dragging === "T"} />
      <T x={X(P) + (P.x >= 0 ? 10 : -10)} y={Y(P) + (P.y >= 0 ? -8 : 16)} size={11} anchor={P.x >= 0 ? "start" : "end"} color={C.pink} bold>P</T>
    </>;
    controls = <Row>
      <Readout color={C.pink}>{`∠APB = ${ang.toFixed(1)}°`}</Readout>
      <Readout color={C.green}>{`OA = OB = OP = r`}</Readout>
    </Row>;
    note = tx(t, "figCir_noteT", "AB is a diameter. Drag P anywhere on the circle: the angle at P stays 90°. The reason is in the dashed radius OP. It cuts the big triangle into two isosceles triangles (OA = OP and OB = OP, all radii), whose base angles are equal. Call them x and y. The big triangle's angles are x, y and x + y at P, which add up to 180°, so 2x + 2y = 180° and the angle at P, x + y, is 90°.");
  }

  return (
    <Figure
      title={tx(t, "figCir_title", "Parts of a circle")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["parts", tx(t, "figCir_mParts", "parts")],
        ["sector", tx(t, "figCir_mSector", "sector")],
        ["thales", tx(t, "figCir_mThales", "angle in a semicircle")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
    </Figure>
  );
}
