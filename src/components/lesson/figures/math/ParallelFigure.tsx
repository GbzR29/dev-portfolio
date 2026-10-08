"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T, Handle, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Two lines crossed by a third line, the transversal. Each crossing makes four
// angles, eight in all. The mode picks a pair and colours it: vertical
// (opposite at one crossing), corresponding (same position at both
// crossings), alternate interior (between the lines, on opposite sides of the
// transversal) or co-interior (between the lines, same side). Drag the
// handle to turn the transversal. The tilt slider rotates the lower line:
// only while the two lines are parallel (tilt 0°) do the corresponding and
// alternate angles stay equal and the co-interior ones add to 180°.
// The lab: each pair in turn, breaking the rules by tilting, and using the
// co-interior test to make the lines parallel again.

type Mode = "vertical" | "corresponding" | "alternate" | "cointerior";
const W = 560, H = 280;
const P1: Pt = { x: 280, y: 95 }, M2: Pt = { x: 280, y: 195 };
const rad = (d: number) => (d * Math.PI) / 180;
const unit = (d: number): Pt => ({ x: Math.cos(rad(d)), y: -Math.sin(rad(d)) });
const at = (p: Pt, d: number, r: number): Pt => ({ x: p.x + unit(d).x * r, y: p.y + unit(d).y * r });
const long = (p: Pt, d: number) => { const a = at(p, d, -500), b = at(p, d, 500); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; };

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

/** Both crossings and their eight angles, from the transversal's direction and the lower line's tilt. */
function crossings(phi: number, tilt: number) {
  // Bottom crossing: transversal P1 + s·u(phi) meets the lower line M2 + r·u(tilt)
  const u = unit(phi), v = unit(tilt);
  const den = u.x * v.y - u.y * v.x;
  const s = ((M2.x - P1.x) * v.y - (M2.y - P1.y) * v.x) / den;
  const P2: Pt = { x: P1.x + u.x * s, y: P1.y + u.y * s };
  // The four angles at each crossing, as [start, end] directions
  const angles = [0, tilt].map(a => [[a, phi], [phi, a + 180], [a + 180, phi + 180], [phi + 180, a + 360]] as [number, number][]);
  const size = (k: number, i: number) => Math.round(angles[k][i][1] - angles[k][i][0]);
  return { P2, angles, size };
}

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function ParallelStage({ mode, phi, tilt, setPhi, t }: { mode: Mode; phi: number; tilt: number; setPhi: (v: number) => void; t?: TrackTranslations }) {
  const { P2, angles, size } = crossings(phi, tilt);
  const hnd = at(P1, phi, 70);
  const drag = useDrag<"h">(
    q => nearest(q, [["h", hnd]], 22),
    (_, q) => {
      const d = (Math.atan2(P1.y - q.y, q.x - P1.x) * 180) / Math.PI;
      // A point below the line gives the same transversal, pointing the other way
      setPhi(clamp(Math.round(d < 0 ? d + 180 : d), 20, 160));
    });
  const pairs = PAIRS[mode];

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {pairs.map(([k, i], j) => {
        const p = k === 0 ? P1 : P2, [d0, d1] = angles[k][i];
        return <path key={j} d={wedge(p, d0, d1, 30)} fill={j ? C.pink : C.sky} fillOpacity={0.3} stroke={j ? C.pink : C.sky} strokeWidth={1.4} />;
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
  );
}

export function ParallelFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("corresponding");
  const [phi, setPhi] = useState(60);
  const [tilt, setTilt] = useState(0);
  const lab = useLab("math-parallel");
  const set = (m: Mode, p: number, tl: number) => { setMode(m); setPhi(p); setTilt(tl); };

  const { size } = crossings(phi, tilt);
  const [x, y] = PAIRS[mode].map(([k, i]) => size(k, i));
  const relation = mode === "cointerior"
    ? `${x}° + ${y}° = ${x + y}°${x + y === 180 ? " ✓" : ""}`
    : `${x}° ${x === y ? "=" : "≠"} ${y}°`;
  const rule = mode === "vertical" ? tx(t, "figPar_rVert", "vertical angles are always equal")
    : mode === "cointerior" ? tx(t, "figPar_rCo", "co-interior angles add to 180° only when the lines are parallel")
      : tx(t, "figPar_rEq", "equal only when the lines are parallel");

  const stage = <ParallelStage mode={mode} phi={phi} tilt={tilt} setPhi={setPhi} t={t} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["vertical", tx(t, "figPar_mVert", "vertical")],
    ["corresponding", tx(t, "figPar_mCorr", "corresponding")],
    ["alternate", tx(t, "figPar_mAlt", "alternate")],
    ["cointerior", tx(t, "figPar_mCo", "co-interior")],
  ] as const} />;
  const controls = <>
    <Slider label={tx(t, "figPar_tilt", "tilt lower line")} value={tilt} min={-20} max={20} step={1} onChange={setTilt} fmt={v => `${v}°`} width="w-28" />
    <Row>
      <Readout color={tilt === 0 ? C.green : C.amber}>{tilt === 0 ? tx(t, "figPar_isPar", "lines parallel") : tx(t, "figPar_notPar", "lines not parallel")}</Readout>
      <Readout>{relation}</Readout>
      <Readout color={C.muted}>{rule}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figParL1_t", "Opposite at one crossing"),
      body: <>
        <p>{tx(t, "figParL1_b1", "The blue and pink wedges face each other across the top crossing: vertical angles.")}</p>
        <p>{tx(t, "figParL1_b2", "Drag the orange handle to turn the transversal. The two numbers move together.")}</p>
      </>,
      goal: { text: tx(t, "figParL1_g", "Make both vertical angles 120°."), done: mode === "vertical" && x === 120 },
      setup: () => set("vertical", 60, 0),
    },
    {
      title: tx(t, "figParL2_t", "Break the copy"),
      body: <>
        <p>{tx(t, "figParL2_b1", "Corresponding angles sit in the same place at the two crossings. While the lines are parallel the bottom crossing is a copy of the top one, so they are equal.")}</p>
        <p>{tx(t, "figParL2_b2", "Tilt the lower line and watch the pair.")}</p>
      </>,
      goal: { text: tx(t, "figParL2_g", "Make the corresponding angles unequal."), done: mode === "corresponding" && x !== y },
      setup: () => set("corresponding", 60, 0),
    },
    {
      title: tx(t, "figParL3_t", "Quick check"),
      body: <p>{tx(t, "figParL3_b", "Line 1 and line 2 are parallel.")}</p>,
      quiz: {
        q: tx(t, "figParL3_q", "An alternate interior angle is 70°. What is its partner?"),
        options: ["70°", "110°", "20°", "180°"],
        answer: 0,
        why: tx(t, "figParL3_w", "With parallel lines, alternate interior angles are equal: 70°. 110° would be its co-interior partner."),
      },
    },
    {
      title: tx(t, "figParL4_t", "Make them parallel"),
      body: <>
        <p>{tx(t, "figParL4_b1", "The lower line is tilted. You may not look at the slider: use only the co-interior pair.")}</p>
        <p>{tx(t, "figParL4_b2", "Move the tilt until the two co-interior angles add to exactly 180°. The rule works backwards: then the lines are parallel.")}</p>
      </>,
      goal: { text: tx(t, "figParL4_g", "Co-interior angles that add to 180°."), done: mode === "cointerior" && x + y === 180 },
      setup: () => set("cointerior", 70, 12),
    },
    {
      title: tx(t, "figParL5_t", "Quick check"),
      body: <p>{tx(t, "figParL5_b", "Line 1 and line 2 are parallel.")}</p>,
      quiz: {
        q: tx(t, "figParL5_q", "One co-interior angle is 65°. What is the other?"),
        options: ["115°", "65°", "25°", "295°"],
        answer: 0,
        why: tx(t, "figParL5_w", "Co-interior angles are supplementary: 180° − 65° = 115°."),
      },
    },
    {
      title: tx(t, "figParL6_t", "Set it from one angle"),
      body: <p>{tx(t, "figParL6_b", "With parallel lines one angle fixes all eight. Turn the transversal so the alternate angles are 50°, and read off the other six.")}</p>,
      goal: { text: tx(t, "figParL6_g", "Parallel lines, alternate angles of 50°."), done: mode === "alternate" && tilt === 0 && x === 50 },
      hint: tx(t, "figParL6_h", "The transversal must lean more to the right. Every angle is then 50° or 130°."),
      setup: () => set("alternate", 90, 0),
    },
    {
      title: tx(t, "figParL7_t", "Quick check"),
      body: <p>{tx(t, "figParL7_b", "Now the other way round: the angles tell you about the lines.")}</p>,
      quiz: {
        q: tx(t, "figParL7_q", "Two co-interior angles measure 100° and 85°. Are the lines parallel?"),
        options: [tx(t, "figParL7_o1", "no: they add to 185°"), tx(t, "figParL7_o2", "yes: both are under 180°"), tx(t, "figParL7_o3", "yes: vertical angles are always equal"), tx(t, "figParL7_o4", "you cannot tell")],
        answer: 0,
        why: tx(t, "figParL7_w", "Parallel lines would make them add to exactly 180°. They add to 185°, so the lines are not parallel; they meet on the side where the angles are smaller."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "broken", tone: "warn", when: tilt !== 0 && mode !== "vertical",
      title: tx(t, "figParI1_t", "The rule broke"),
      body: fill(tx(t, "figParI1_b", "The lower line is tilted by {tl}°, so the bottom crossing is no longer a copy of the top one. The pair now reads {rel}: off by exactly the tilt."), { tl: tilt, rel: relation }),
    },
    {
      id: "vert", tone: "ok", when: tilt !== 0 && mode === "vertical",
      title: tx(t, "figParI2_t", "Still equal"),
      body: tx(t, "figParI2_b", "Vertical angles never depend on the other line: both lie at the same crossing, and each fills a straight line with the angle between them."),
    },
    {
      id: "perp", tone: "info", when: phi === 90 && tilt === 0,
      title: tx(t, "figParI3_t", "Perpendicular"),
      body: tx(t, "figParI3_b", "The transversal is at right angles to both lines, so all eight angles are 90°: every rule holds at once."),
    },
  ];

  const title = tx(t, "figPar_title", "Two lines and a transversal");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figPar_note", "Drag the orange handle to turn the transversal and pick a pair of angles above. Every crossing makes two pairs of equal vertical angles, whatever the lines do. The other three relations link the two crossings, and they hold only while the lines are parallel: tilt the lower line and the corresponding and alternate angles stop being equal, while the co-interior pair stops adding to 180°. That is also how you test whether two lines are parallel.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figParR1", "Vertical angles are equal for any two crossing lines."),
          tx(t, "figParR2", "With parallel lines, corresponding and alternate angles are equal and co-interior angles add to 180°."),
          tx(t, "figParR3", "The rules work backwards: equal corresponding angles, or co-interior angles adding to 180°, prove the lines parallel."),
        ]}
      />
    </>
  );
}
