"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T, Handle, useDrag, nearest, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// An angle as an amount of turn. One arm is fixed and points right; the other
// is dragged around the vertex. The coloured wedge is the turn from the fixed
// arm to the moving one, measured anticlockwise in degrees, with a protractor
// scale behind it. The readouts name the kind of angle and give its
// complement (what is missing to 90°), supplement (to 180°) and the reflex
// angle on the other side (to 360°).
// The lab: build each kind of angle, then use complement and supplement to
// find an angle from a condition.

const W = 560, H = 270, O: Pt = { x: 280, y: 140 }, R = 110;
const PRESETS = [30, 90, 135, 180, 270];
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

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

// ── The drawing (owns its drag: it is mounted twice while the lab is open) ────

function AngleStage({ a, setA, col, t }: { a: number; setA: (v: number) => void; col: string; t?: TrackTranslations }) {
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

  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* protractor scale */}
      <circle cx={O.x} cy={O.y} r={R} fill="none" stroke={C.grid} />
      {TICKS.map(d => {
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
  );
}

export function AngleFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState(50);
  const lab = useLab("math-angle");
  const [kind, col] = kindOf(a, t);

  const stage = <AngleStage a={a} setA={setA} col={col} t={t} />;
  const presets = <>{PRESETS.map(v => <Btn key={v} active={a === v} onClick={() => setA(v)}>{`${v}°`}</Btn>)}</>;
  const controls = <>
    <Row>
      <Readout color={col}>{`θ = ${a}°`}</Readout>
      <Readout color={col}>{kind}</Readout>
    </Row>
    <Row>
      <Readout color={a > 0 && a < 90 ? C.fg : C.muted}>{a > 0 && a < 90 ? `${tx(t, "figAng_comp", "complement")} 90° − ${a}° = ${90 - a}°` : `${tx(t, "figAng_comp", "complement")}: ${tx(t, "figAng_none", "none")}`}</Readout>
      <Readout color={a > 0 && a < 180 ? C.fg : C.muted}>{a > 0 && a < 180 ? `${tx(t, "figAng_supp", "supplement")} 180° − ${a}° = ${180 - a}°` : `${tx(t, "figAng_supp", "supplement")}: ${tx(t, "figAng_none", "none")}`}</Readout>
      <Readout>{`${tx(t, "figAng_rest", "rest of the turn")} 360° − ${a}° = ${360 - a}°`}</Readout>
    </Row>
  </>;

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figAngL1_t", "A quarter turn"),
      body: <>
        <p>{tx(t, "figAngL1_b1", "The white arm stays put. The orange arm turns around the vertex, anticlockwise, and the angle is how far it has turned.")}</p>
        <p>{tx(t, "figAngL1_b2", "Drag the orange point to make the corner of a square.")}</p>
      </>,
      goal: { text: tx(t, "figAngL1_g", "Make a right angle: θ = 90°."), done: a === 90 },
      hint: tx(t, "figAngL1_h", "Straight up from the vertex. The wedge turns into a small square when you get there."),
      setup: () => setA(30),
    },
    {
      title: tx(t, "figAngL2_t", "Quick check"),
      body: <p>{tx(t, "figAngL2_b", "Two angles that fill a right angle are complementary.")}</p>,
      quiz: {
        q: tx(t, "figAngL2_q", "What is the complement of 35°?"),
        options: ["55°", "145°", "325°", "65°"],
        answer: 0,
        why: tx(t, "figAngL2_w", "The complement is what is missing to 90°: 90° − 35° = 55°. 145° is the supplement (to 180°), and 325° the rest of the full turn."),
      },
    },
    {
      title: tx(t, "figAngL3_t", "A straight line"),
      body: <p>{tx(t, "figAngL3_b", "Keep turning, through the obtuse angles, until the two arms point in opposite directions.")}</p>,
      goal: { text: tx(t, "figAngL3_g", "Make a straight angle: θ = 180°."), done: a === 180 },
      setup: () => setA(120),
    },
    {
      title: tx(t, "figAngL4_t", "Past the line"),
      body: <>
        <p>{tx(t, "figAngL4_b1", "Turn further, below the white arm. Now the wedge covers more than half the turn: a reflex angle.")}</p>
        <p>{tx(t, "figAngL4_b2", "Look at the last readout: the small angle on the other side is 360° minus θ.")}</p>
      </>,
      goal: { text: tx(t, "figAngL4_g", "Make a reflex angle whose other side is 60°."), done: a === 300 },
      hint: tx(t, "figAngL4_h", "360° − θ = 60° means θ = 300°."),
      setup: () => setA(180),
    },
    {
      title: tx(t, "figAngL5_t", "Quick check"),
      body: <p>{tx(t, "figAngL5_b", "Two angles that fill a straight line are supplementary.")}</p>,
      quiz: {
        q: tx(t, "figAngL5_q", "An angle and its supplement are equal. How big is the angle?"),
        options: ["90°", "45°", "180°", "60°"],
        answer: 0,
        why: tx(t, "figAngL5_w", "θ + θ = 180°, so 2θ = 180° and θ = 90°. Two right angles side by side make a straight line."),
      },
    },
    {
      title: tx(t, "figAngL6_t", "Find it from a clue"),
      body: <>
        <p>{tx(t, "figAngL6_b1", "Clue: the supplement of the angle is three times the angle.")}</p>
        <p>{tx(t, "figAngL6_b2", "Write it as an equation, solve it, then make that angle. The readouts let you check the clue.")}</p>
      </>,
      goal: { text: tx(t, "figAngL6_g", "180° − θ = 3θ."), done: 180 - a === 3 * a },
      hint: tx(t, "figAngL6_h", "Add θ to both sides: 180° = 4θ, so θ = 45°."),
      setup: () => setA(30),
    },
    {
      title: tx(t, "figAngL7_t", "Quick check"),
      body: <p>{tx(t, "figAngL7_b", "A clock face is a full turn split into 12 hours.")}</p>,
      quiz: {
        q: tx(t, "figAngL7_q", "What angle do the hands make at exactly 4 o'clock?"),
        options: ["120°", "40°", "90°", "240°"],
        answer: 0,
        why: tx(t, "figAngL7_w", "Each hour is 360° ÷ 12 = 30°. From 12 to 4 there are 4 hours: 4 × 30° = 120°. 240° is the reflex angle on the other side."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "zero", tone: "info", when: a === 0,
      title: tx(t, "figAngI1_t", "No turn at all"),
      body: tx(t, "figAngI1_b", "The arms lie on top of each other: 0°. A full turn of 360° would end up in exactly the same place, which is why bearings stop just before 360°."),
    },
    {
      id: "nocomp", tone: "warn", when: a >= 90 && a < 180,
      title: tx(t, "figAngI2_t", "No complement"),
      body: fill(tx(t, "figAngI2_b", "{a}° already fills a right angle or more, so nothing positive is left to make 90°. Only acute angles have a complement. The supplement still works: 180° − {a}° = {s}°."), { a, s: 180 - a }),
    },
    {
      id: "reflex", tone: "info", when: a > 180,
      title: tx(t, "figAngI3_t", "Two angles, one picture"),
      body: fill(tx(t, "figAngI3_b", "The same two arms make {a}° one way round and {r}° the other way. When nobody says which, \"the angle\" usually means the smaller one, {r}°."), { a, r: 360 - a }),
    },
  ];

  const title = tx(t, "figAng_title", "An angle is an amount of turn");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{presets}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={tx(t, "figAng_note", "Drag the orange point around the vertex. The arm pointing right stays fixed; the angle is how far the other arm has turned from it, anticlockwise, on a scale where one full turn is 360°. Watch the name change as you cross 90° (right, marked with a small square), 180° (straight: the arms form one line) and on into reflex angles. The complement only exists for acute angles and the supplement only for angles below 180°.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={stage}
        controls={<><Row>{presets}</Row>{controls}</>}
        recap={[
          tx(t, "figAngR1", "An angle is an amount of turn: 90° is a quarter turn, 180° a half turn, 360° a full turn."),
          tx(t, "figAngR2", "Acute < 90° < obtuse < 180° < reflex < 360°."),
          tx(t, "figAngR3", "Complement: what is missing to 90°. Supplement: what is missing to 180°."),
          tx(t, "figAngR4", "A clue about an angle becomes an equation in θ, solved like any linear equation."),
        ]}
      />
    </>
  );
}
