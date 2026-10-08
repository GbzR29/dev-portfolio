"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, useDrag, nearest, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// parts  — the named pieces of a circle: centre, radius, diameter, a chord
//          between two draggable points, the arc between them and the tangent
//          at one of them (always perpendicular to the radius).
// sector — a slice of angle θ: its arc is θ/360 of the circumference and its
//          area θ/360 of the disc.
// thales — any point on a circle seen from the two ends of a diameter makes
//          a right angle.
// The lab: the longest chord, a quarter slice, a slice of area exactly π, and
// the right angle in a semicircle.

type Mode = "parts" | "sector" | "thales";
type Id = "P" | "Q" | "T";
const W = 560, H = 300;
const p = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const R = 2.4;
const DEG = 180 / Math.PI;
const O: Pt = { x: 0, y: 0 };
const n2 = (v: number) => (+v.toFixed(2)).toString();
const on = (a: number, r = R): Pt => ({ x: r * Math.cos(a), y: r * Math.sin(a) });
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
const chordOf = (aP: number, aQ: number) => Math.hypot(on(aP).x - on(aQ).x, on(aP).y - on(aQ).y);

/** SVG arc path along the circle of radius r from angle a0 to a1 (counter-clockwise). */
function arcPath(a0: number, a1: number, r = R) {
  let d = "";
  for (let i = 0; i <= 64; i++) { const q = on(a0 + ((a1 - a0) * i) / 64, r); d += `${i ? "L" : "M"}${X(q)},${Y(q)}`; }
  return d;
}

/** The angle APB at P = on(aT), seen from the ends of the horizontal diameter. */
function thalesAngle(aT: number) {
  const A = on(Math.PI), B = on(0), P = on(aT);
  const v1 = { x: A.x - P.x, y: A.y - P.y }, v2 = { x: B.x - P.x, y: B.y - P.y };
  return Math.acos((v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y))) * DEG;
}

// ── The drawings ──────────────────────────────────────────────────────────────

function PartsDrawing({ aP, aQ, dragging, t }: { aP: number; aQ: number; dragging: Id | null; t?: TrackTranslations }) {
  const P = on(aP), Q = on(aQ);
  const u = { x: -Math.sin(aP), y: Math.cos(aP) };             // along the tangent at P
  const span = ((aQ - aP) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  return <>
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
    <Handle x={X(P)} y={Y(P)} color={C.green} active={dragging === "P"} />
    <Handle x={X(Q)} y={Y(Q)} color={C.pink} active={dragging === "Q"} />
  </>;
}

function SectorDrawing({ theta, rad }: { theta: number; rad: number }) {
  const a1 = theta / DEG;
  return <>
    <circle cx={X(O)} cy={Y(O)} r={rad * p.sx} fill="none" stroke={C.muted} strokeWidth={1.2} strokeDasharray="4 3" />
    <path d={`M${X(O)},${Y(O)}` + arcPath(0, a1, rad).replace(/^M/, "L") + "Z"} fill={C.sky} fillOpacity={0.3} stroke={C.sky} strokeWidth={1.4} strokeLinejoin="round" />
    <path d={arcPath(0, a1, rad)} fill="none" stroke={C.amber} strokeWidth={4.5} strokeLinecap="round" />
    <path d={arcPath(0, a1, 0.45)} fill="none" stroke={C.fg} strokeWidth={1.2} />
    <T x={X(on(a1 / 2, 0.75))} y={Y(on(a1 / 2, 0.75)) + 4} size={10} anchor="middle" color={C.fg} bold>{`${Math.round(theta)}°`}</T>
    <T x={X({ x: rad / 2, y: 0 })} y={Y(O) + 14} size={10} anchor="middle" color={C.green} bold>r</T>
  </>;
}

function ThalesDrawing({ aT, dragging }: { aT: number; dragging: Id | null }) {
  const A = on(Math.PI), B = on(0), P = on(aT);
  const v1 = { x: A.x - P.x, y: A.y - P.y }, v2 = { x: B.x - P.x, y: B.y - P.y };
  const s = 0.28, l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
  const m1 = { x: P.x + (v1.x / l1) * s, y: P.y + (v1.y / l1) * s }, m2 = { x: P.x + (v2.x / l2) * s, y: P.y + (v2.y / l2) * s };
  return <>
    <circle cx={X(O)} cy={Y(O)} r={R * p.sx} fill="none" stroke={C.fg} strokeWidth={1.6} />
    <line x1={X(O)} y1={Y(O)} x2={X(P)} y2={Y(P)} stroke={C.green} strokeWidth={1.2} strokeDasharray="4 3" />
    <polygon points={[A, B, P].map(q => `${X(q)},${Y(q)}`).join(" ")} fill={C.amber} fillOpacity={0.2} stroke={C.amber} strokeWidth={2} strokeLinejoin="round" />
    <path d={`M${X(m1)},${Y(m1)} L${p.X(m1.x + m2.x - P.x)},${p.Y(m1.y + m2.y - P.y)} L${X(m2)},${Y(m2)}`} fill="none" stroke={C.fg} strokeWidth={1.2} />
    <circle cx={X(O)} cy={Y(O)} r={3} fill={C.fg} />
    <T x={X(A) - 8} y={Y(A) + 4} size={11} anchor="end" color={C.fg} bold>A</T>
    <T x={X(B) + 8} y={Y(B) + 4} size={11} color={C.fg} bold>B</T>
    <T x={X(O)} y={Y(O) + 15} size={10} anchor="middle" color={C.fg} bold>O</T>
    <Handle x={X(P)} y={Y(P)} color={C.pink} active={dragging === "T"} />
    <T x={X(P) + (P.x >= 0 ? 10 : -10)} y={Y(P) + (P.y >= 0 ? -8 : 16)} size={11} anchor={P.x >= 0 ? "start" : "end"} color={C.pink} bold>P</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function CircleStage({ mode, aP, aQ, aT, setAP, setAQ, setAT, theta, rad, t }: {
  mode: Mode; aP: number; aQ: number; aT: number; setAP: (v: number) => void; setAQ: (v: number) => void;
  setAT: (f: (v: number) => number) => void; theta: number; rad: number; t?: TrackTranslations;
}) {
  const drag = useDrag<Id>(
    q => mode === "parts" ? nearest(q, [["P", { x: X(on(aP)), y: Y(on(aP)) }], ["Q", { x: X(on(aQ)), y: Y(on(aQ)) }]], 20)
      : mode === "thales" ? nearest(q, [["T", { x: X(on(aT)), y: Y(on(aT)) }]], 20) : null,
    (id, q) => {
      const w = p.inv(q), a = Math.atan2(w.y, w.x);
      if (id === "P") setAP(a); else if (id === "Q") setAQ(a); else setAT(o => (Math.abs(a) < 0.08 || Math.abs(a) > Math.PI - 0.08 ? o : a));
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "parts" ? <PartsDrawing aP={aP} aQ={aQ} dragging={drag.dragging} t={t} />
        : mode === "sector" ? <SectorDrawing theta={theta} rad={rad} />
          : <ThalesDrawing aT={aT} dragging={drag.dragging} />}
    </svg>
  );
}

export function CircleFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("parts");
  const [aP, setAP] = useState(0.4), [aQ, setAQ] = useState(2.3);
  const [theta, setTheta] = useState(120), [rad, setRad] = useState(2);
  const [aT, setAT] = useState(1.2);
  const lab = useLab("math-circle");

  const chord = chordOf(aP, aQ);
  const frac = theta / 360;
  const ang = thalesAngle(aT);
  const stage = <CircleStage mode={mode} aP={aP} aQ={aQ} aT={aT} setAP={setAP} setAQ={setAQ} setAT={setAT} theta={theta} rad={rad} t={t} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["parts", tx(t, "figCir_mParts", "parts")],
    ["sector", tx(t, "figCir_mSector", "sector")],
    ["thales", tx(t, "figCir_mThales", "angle in a semicircle")],
  ] as const} />;

  const controls = mode === "parts" ? <Row>
    <Readout color={C.green}>{`r = ${n2(R)}`}</Readout>
    <Readout color={C.purple}>{`d = 2r = ${n2(2 * R)}`}</Readout>
    <Readout color={C.pink}>{`${tx(t, "figCir_chord", "chord")} = ${n2(chord)} ≤ d`}</Readout>
    <Readout color={C.sky}>{tx(t, "figCir_perp", "tangent ⊥ radius: 90°")}</Readout>
  </Row> : mode === "sector" ? <>
    <Sliders>
      <Slider label={tx(t, "figCir_theta", "angle θ")} value={theta} min={5} max={360} step={5} onChange={setTheta} fmt={v => `${v}°`} />
      <Slider label={tx(t, "figCir_r", "radius r")} value={rad} min={0.5} max={2.8} step={0.1} onChange={setRad} fmt={n2} />
    </Sliders>
    <Row>
      <Readout>{`θ/360 = ${n2(frac)}`}</Readout>
      <Readout color={C.amber}>{`${tx(t, "figCir_arcLen", "arc")} = ${n2(frac)} · 2π · ${n2(rad)} = ${n2(frac * 2 * Math.PI * rad)}`}</Readout>
      <Readout color={C.sky}>{`${tx(t, "figCir_secArea", "sector")} = ${n2(frac)} · π · ${n2(rad)}² = ${n2(frac * Math.PI * rad * rad)}`}</Readout>
    </Row>
  </> : <Row>
    <Readout color={C.pink}>{`∠APB = ${ang.toFixed(1)}°`}</Readout>
    <Readout color={C.green}>{`OA = OB = OP = r`}</Readout>
  </Row>;
  const note = mode === "parts"
    ? tx(t, "figCir_noteP", "Drag the green and pink points around the circle. The radius goes from the centre O to the circle; the diameter crosses the whole circle through O and is two radii. A chord joins any two points of the circle; it is never longer than the diameter, and it equals the diameter only when it passes through O. The arc is the piece of the circle between the two points. The tangent touches the circle at one point only, and it always meets the radius there at a right angle.")
    : mode === "sector"
      ? tx(t, "figCir_noteS", "A sector is a slice cut by two radii. Its angle θ is some fraction of the full 360°, and the sector takes that same fraction of everything: θ/360 of the circumference for its arc, θ/360 of the area for itself. At 90° it is a quarter; at 180°, half; at 360°, the whole circle.")
      : tx(t, "figCir_noteT", "AB is a diameter. Drag P anywhere on the circle: the angle at P stays 90°. The reason is in the dashed radius OP. It cuts the big triangle into two isosceles triangles (OA = OP and OB = OP, all radii), whose base angles are equal. Call them x and y. The big triangle's angles are x, y and x + y at P, which add up to 180°, so 2x + 2y = 180° and the angle at P, x + y, is 90°.");

  // ── Lab ──
  const fullChord = Math.abs(chord - 2 * R) < 0.03;
  const secArea = frac * rad * rad;              // sector area divided by π
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figCirL1_t", "The longest chord"),
      body: <>
        <p>{tx(t, "figCirL1_b1", "The pink chord joins the two points you can drag. Its length is in the readout, next to the diameter, d = 2r.")}</p>
        <p>{tx(t, "figCirL1_b2", "Make the chord as long as it can possibly be.")}</p>
      </>,
      goal: { text: tx(t, "figCirL1_g", "Chord = diameter."), done: mode === "parts" && fullChord },
      hint: tx(t, "figCirL1_h", "Put the two points exactly opposite each other, so that the chord passes through O."),
      setup: () => { setMode("parts"); setAP(0.4); setAQ(2.3); },
    },
    {
      title: tx(t, "figCirL2_t", "Quick check"),
      body: <p>{tx(t, "figCirL2_b", "The blue tangent touches the circle at the green point only.")}</p>,
      quiz: {
        q: tx(t, "figCirL2_q", "What angle does the tangent make with the radius at that point?"),
        options: ["90°", "45°", tx(t, "figCirL2_o3", "it depends on the point"), "180°"],
        answer: 0,
        why: tx(t, "figCirL2_w", "Always 90°. Drag the green point anywhere: the little square stays. That is why a wheel rolling on flat ground has its spoke to the ground point vertical."),
      },
    },
    {
      title: tx(t, "figCirL3_t", "A quarter slice"),
      body: <p>{tx(t, "figCirL3_b", "A sector takes θ/360 of everything: of the circumference for its arc, of the area for itself. Make a sector that is exactly a quarter of the circle.")}</p>,
      goal: { text: tx(t, "figCirL3_g", "θ/360 = 0.25."), done: mode === "sector" && theta === 90 },
      setup: () => { setMode("sector"); setTheta(30); setRad(2); },
    },
    {
      title: tx(t, "figCirL4_t", "An area of exactly π"),
      body: <>
        <p>{tx(t, "figCirL4_b1", "The sector's area is θ/360 · π · r². Make it exactly π, but not with the whole circle of radius 1.")}</p>
      </>,
      goal: { text: tx(t, "figCirL4_g", "Sector area = π, with θ < 360°."), done: mode === "sector" && theta < 360 && Math.abs(secArea - 1) < 1e-6 },
      hint: tx(t, "figCirL4_h", "You need θ/360 · r² = 1. A quarter (θ = 90°) needs r² = 4."),
    },
    {
      title: tx(t, "figCirL5_t", "Quick check"),
      body: <p>{tx(t, "figCirL5_b", "A circle of radius 6, and a slice of 60°.")}</p>,
      quiz: {
        q: tx(t, "figCirL5_q", "How long is the slice's arc?"),
        options: ["2π ≈ 6.28", "6π ≈ 18.8", "π ≈ 3.14", "12π ≈ 37.7"],
        answer: 0,
        why: tx(t, "figCirL5_w", "60/360 = 1/6 of the circumference 2π · 6 = 12π, so 12π / 6 = 2π."),
      },
    },
    {
      title: tx(t, "figCirL6_t", "Always a right angle"),
      body: <p>{tx(t, "figCirL6_b", "AB is a diameter. Drag P all the way round to the lower half of the circle and keep an eye on the angle at P.")}</p>,
      goal: { text: tx(t, "figCirL6_g", "Put P below the diameter."), done: mode === "thales" && aT < 0 },
      setup: () => { setMode("thales"); setAT(1.2); },
    },
    {
      title: tx(t, "figCirL7_t", "Quick check"),
      body: <p>{tx(t, "figCirL7_b", "A triangle has one side along a diameter and its third corner on the circle. One of its angles is 35°, at an end of the diameter.")}</p>,
      quiz: {
        q: tx(t, "figCirL7_q", "What is the angle at the other end of the diameter?"),
        options: ["55°", "35°", "90°", "145°"],
        answer: 0,
        why: tx(t, "figCirL7_w", "The corner on the circle is 90°, so the other two share 90°: 90° − 35° = 55°."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "diam", tone: "ok", when: mode === "parts" && fullChord,
      title: tx(t, "figCirI1_t", "A diameter"),
      body: tx(t, "figCirI1_b", "The chord passes through the centre, so it is a diameter: two radii in a line, the longest chord there is."),
    },
    {
      id: "half", tone: "info", when: mode === "sector" && (theta === 180 || theta === 360),
      title: tx(t, "figCirI2_t", "A simple fraction"),
      body: fill(tx(t, "figCirI2_b", "θ/360 = {f}: the sector is {what} of the circle, so its area is {f} · π · r²."), { f: n2(frac), what: theta === 180 ? tx(t, "figCirI2_half", "half") : tx(t, "figCirI2_all", "all") }),
    },
    {
      id: "thales", tone: "info", when: mode === "thales",
      title: tx(t, "figCirI3_t", "Why 90°"),
      body: fill(tx(t, "figCirI3_b", "The angle at P is {a}°. OP splits the triangle into two isosceles triangles with base angles x and y; then x + y + (x + y) = 180°, so x + y = 90°."), { a: ang.toFixed(1) }),
    },
  ];

  const title = tx(t, "figCir_title", "Parts of a circle");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figCirR1", "A diameter is two radii and the longest chord; a tangent meets the radius at 90°."),
          tx(t, "figCirR2", "A sector of angle θ takes θ/360 of the circumference and θ/360 of the area."),
          tx(t, "figCirR3", "The angle in a semicircle is always a right angle."),
        ]}
      />
    </>
  );
}
