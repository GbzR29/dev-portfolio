"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, Vec, plot, Grid, useDrag, useFrame, useVisible, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// rotate — a point P = (x, y) is x steps along the x-axis plus y steps up.
//          Rotating by θ turns the two unit steps into (cos θ, sin θ) and
//          (−sin θ, cos θ); taking the same x and y steps along the turned
//          directions lands on the rotated point. That is the rotation formula.
//          The Transport turns θ.
// sum    — the point at angle α on the unit circle, rotated by β, is the point
//          at angle α + β. Writing the rotation out with the formula gives the
//          angle-sum identities for cos(α + β) and sin(α + β).
// The lab: quarter and half turns, a turn that keeps the length, then the
// angle-sum formulas and the double angle.

type Mode = "rotate" | "sum";
const W = 560, H = 300;
const DEG = Math.PI / 180;
const STEP = 15;                    // degrees per Transport step
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
const n3 = (v: number) => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3).replace("-", "−");
const pr = plot({ W, H, x0: -5.6, x1: 5.6, y0: -3, y1: 3 });
const pu = plot({ W, H, x0: -2.8, x1: 2.8, y0: -1.5, y1: 1.5 });
const O = (pl: typeof pr, v: Pt) => ({ x: pl.X(v.x), y: pl.Y(v.y) });
/** Wraps an angle in degrees into (−180, 180]. */
const wrap = (d: number) => { const w = ((d + 180) % 360 + 360) % 360 - 180; return w === -180 ? 180 : w; };
const rot = (P: Pt, th: number) => {
  const c = Math.cos(th * DEG), s = Math.sin(th * DEG);
  return { x: P.x * c - P.y * s, y: P.x * s + P.y * c };
};

// ── The drawings ──────────────────────────────────────────────────────────────

function RotateDrawing({ P, th, active }: { P: Pt; th: number; active: boolean }) {
  const c = Math.cos(th * DEG), s = Math.sin(th * DEG);
  const e1 = { x: c, y: s }, e2 = { x: -s, y: c };
  const mid = { x: P.x * e1.x, y: P.x * e1.y };
  const Pr = rot(P, th);
  return <>
    <Grid p={pr} step={1} />
    {/* the original point as x steps right, then y steps up */}
    <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, { x: P.x, y: 0 })} color={C.red} w={1.6} dash="4 3" opacity={0.6} />
    <Vec a={O(pr, { x: P.x, y: 0 })} b={O(pr, P)} color={C.green} w={1.6} dash="4 3" opacity={0.6} />
    {/* the turned unit steps and the same x, y steps along them */}
    <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, e1)} color={C.red} w={3} />
    <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, e2)} color={C.green} w={3} />
    <Vec a={O(pr, { x: 0, y: 0 })} b={O(pr, mid)} color={C.red} w={2} />
    <Vec a={O(pr, mid)} b={O(pr, Pr)} color={C.green} w={2} />
    <path d={`M${pr.X(0.8)},${pr.Y(0)} A${0.8 * pr.sx},${0.8 * pr.sy} 0 0 ${th >= 0 ? 0 : 1} ${pr.X(0.8 * c)},${pr.Y(0.8 * s)}`} fill="none" stroke={C.purple} strokeWidth={1.6} />
    <T x={pr.X(0.95 * Math.cos((th * DEG) / 2))} y={pr.Y(0.95 * Math.sin((th * DEG) / 2)) + 4} size={10} color={C.purple} bold>θ</T>
    <circle cx={pr.X(Pr.x)} cy={pr.Y(Pr.y)} r={6} fill={C.amber} />
    <T x={pr.X(Pr.x) + 9} y={pr.Y(Pr.y) - 7} size={10.5} color={C.amber} bold>{`P' (${n2(Pr.x)}, ${n2(Pr.y)})`}</T>
    <Handle x={pr.X(P.x)} y={pr.Y(P.y)} color={C.sky} active={active} />
    <T x={pr.X(P.x) + 9} y={pr.Y(P.y) + 15} size={10.5} color={C.sky} bold>{`P (${n2(P.x)}, ${n2(P.y)})`}</T>
  </>;
}

function SumDrawing({ al, be }: { al: number; be: number }) {
  const a = al * DEG, b = be * DEG;
  const Pa = { x: Math.cos(a), y: Math.sin(a) }, Pab = { x: Math.cos(a + b), y: Math.sin(a + b) };
  const e1 = { x: Math.cos(b), y: Math.sin(b) };            // the turned unit step right
  const mid = { x: Pa.x * e1.x, y: Pa.x * e1.y };
  const arc = (r0: number, a0: number, a1: number, col: string) =>
    <path d={`M${pu.X(r0 * Math.cos(a0))},${pu.Y(r0 * Math.sin(a0))} A${r0 * pu.sx},${r0 * pu.sy} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 0 : 1} ${pu.X(r0 * Math.cos(a1))},${pu.Y(r0 * Math.sin(a1))}`} fill="none" stroke={col} strokeWidth={2} />;
  return <>
    <Grid p={pu} step={0.5} labels={false} />
    <circle cx={pu.X(0)} cy={pu.Y(0)} r={pu.sx} fill="none" stroke={C.muted} strokeWidth={1.2} />
    {arc(0.3, 0, a, C.sky)}
    {arc(0.45, a, a + b, C.pink)}
    <line x1={pu.X(0)} y1={pu.Y(0)} x2={pu.X(Pa.x)} y2={pu.Y(Pa.y)} stroke={C.sky} strokeWidth={1.6} />
    <line x1={pu.X(0)} y1={pu.Y(0)} x2={pu.X(Pab.x)} y2={pu.Y(Pab.y)} stroke={C.amber} strokeWidth={1.6} />
    <Vec a={O(pu, { x: 0, y: 0 })} b={O(pu, mid)} color={C.red} w={2.2} />
    <Vec a={O(pu, mid)} b={O(pu, Pab)} color={C.green} w={2.2} />
    <circle cx={pu.X(Pa.x)} cy={pu.Y(Pa.y)} r={5} fill={C.sky} />
    <circle cx={pu.X(Pab.x)} cy={pu.Y(Pab.y)} r={6} fill={C.amber} />
    <T x={pu.X(Pa.x * 1.12)} y={pu.Y(Pa.y * 1.12) + 4} size={10} anchor="middle" color={C.sky} bold>α</T>
    <T x={pu.X(Pab.x * 1.14)} y={pu.Y(Pab.y * 1.14) + 4} size={10} anchor="middle" color={C.amber} bold>α + β</T>
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function RotStage({ mode, P, setP, th, al, be }: { mode: Mode; P: Pt; setP: (v: Pt) => void; th: number; al: number; be: number }) {
  const drag = useDrag<"P">(
    () => (mode === "rotate" ? "P" : null),
    (_, q) => { const w = pr.inv(q); setP({ x: clamp(Math.round(w.x * 2) / 2, -5, 5), y: clamp(Math.round(w.y * 2) / 2, -2.5, 2.5) }); });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "rotate" ? <RotateDrawing P={P} th={th} active={drag.dragging === "P"} /> : <SumDrawing al={al} be={be} />}
    </svg>
  );
}

export function RotationFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("rotate");
  const [P, setP] = useState<Pt>({ x: 3, y: 1 });
  const [rawTh, setTh] = useState(40);
  const [playing, setPlaying] = useState(false);
  const [al, setAl] = useState(30), [be, setBe] = useState(45);
  const lab = useLab("math-rotation");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && mode === "rotate" && (vis.on || lab.open), dt => setTh(d => wrap(d + dt * 40)));

  const th = Math.round(rawTh);
  const pick = (m: Mode) => { setMode(m); setPlaying(false); };
  const turnTo = (d: number) => { setPlaying(false); setTh(wrap(d)); };
  const c = Math.cos(th * DEG), s = Math.sin(th * DEG);
  const Pr = rot(P, th);
  const a = al * DEG, b = be * DEG;

  const view = (
    <div>
      <RotStage mode={mode} P={P} setP={setP} th={th} al={al} be={be} />
      {mode === "rotate" && (
        <Transport t={t} playing={playing}
          onPlay={() => setPlaying(p => !p)}
          playLabel={tx(t, "figRot_play", "turn")}
          onStep={() => turnTo((Math.floor(th / STEP) + 1) * STEP)}
          onBack={() => turnTo((Math.ceil(th / STEP) - 1) * STEP)}
          onReset={() => turnTo(0)}
          readout={`θ = ${th}°`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["rotate", tx(t, "figRot_mRot", "rotate a point")],
    ["sum", tx(t, "figRot_mSum", "angle sum")],
  ] as const} />;
  const controls = mode === "rotate" ? <>
    <Slider label={tx(t, "figRot_theta", "angle θ")} value={th} min={-180} max={180} step={1} onChange={turnTo} fmt={v => `${v}°`} width="w-16" />
    <Row>
      <Readout color={C.red}>{`x·(cos θ, sin θ) = ${n2(P.x)}·(${n3(c)}, ${n3(s)})`}</Readout>
      <Readout color={C.green}>{`y·(−sin θ, cos θ) = ${n2(P.y)}·(${n3(-s)}, ${n3(c)})`}</Readout>
      <Readout color={C.amber}>{`P' = (x cos θ − y sin θ, x sin θ + y cos θ) = (${n2(Pr.x)}, ${n2(Pr.y)})`}</Readout>
    </Row>
  </> : <>
    <Sliders>
      <Slider label="α" value={al} min={0} max={180} step={1} onChange={setAl} fmt={v => `${v}°`} width="w-6" />
      <Slider label="β" value={be} min={0} max={180} step={1} onChange={setBe} fmt={v => `${v}°`} width="w-6" />
    </Sliders>
    <Row>
      <Readout color={C.amber}>{`cos(α + β) = ${n3(Math.cos(a + b))}`}</Readout>
      <Readout>{`cos α cos β − sin α sin β = ${n3(Math.cos(a) * Math.cos(b) - Math.sin(a) * Math.sin(b))}`}</Readout>
    </Row>
    <Row>
      <Readout color={C.amber}>{`sin(α + β) = ${n3(Math.sin(a + b))}`}</Readout>
      <Readout>{`sin α cos β + cos α sin β = ${n3(Math.sin(a) * Math.cos(b) + Math.cos(a) * Math.sin(b))}`}</Readout>
    </Row>
  </>;
  const note = mode === "rotate"
    ? tx(t, "figRot_noteR2", "Drag P and turn θ with the slider or the play button. The faded arrows build P from the origin: x steps along the x-axis (red), then y steps up (green). Rotating the whole picture turns the unit step right, (1, 0), into (cos θ, sin θ), and the unit step up, (0, 1), into (−sin θ, cos θ), a quarter turn further. Taking the same x and y steps along the turned directions (solid arrows) ends exactly at the rotated point P'. Add the two steps coordinate by coordinate and you have the rotation formula.")
    : tx(t, "figRot_noteS", "The blue point sits at angle α, so it is (cos α, sin α). Rotate it by β and it lands at angle α + β (amber), which by definition is (cos(α + β), sin(α + β)). But the rotation formula says the same point is cos α steps along the turned x direction (red) plus sin α steps along the turned y direction (green). Both descriptions name one point, so their coordinates agree, and that is the pair of angle-sum formulas in the readouts.");

  // ── Lab ──
  const len = Math.hypot(P.x, P.y);
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figRotL1_t", "A quarter turn"),
      body: <>
        <p>{tx(t, "figRotL1_b1", "P = (3, 1). The red and green arrows are its x and y steps, taken along the turned directions.")}</p>
        <p>{tx(t, "figRotL1_b2", "Turn by exactly a quarter turn and read P'.")}</p>
      </>,
      goal: { text: tx(t, "figRotL1_g", "θ = 90°: P' = (−1, 3)."), done: mode === "rotate" && th === 90 },
      hint: tx(t, "figRotL1_h", "Six steps of 15° with ⏭."),
      focus: "step",
      setup: () => { pick("rotate"); setP({ x: 3, y: 1 }); setTh(0); },
    },
    {
      title: tx(t, "figRotL2_t", "Quick check"),
      body: <p>{tx(t, "figRotL2_b", "At 180° cos θ = −1 and sin θ = 0.")}</p>,
      quiz: {
        q: tx(t, "figRotL2_q", "Where does (3, 1) go after a half turn about the origin?"),
        options: ["(−3, −1)", "(−1, 3)", "(1, −3)", "(3, −1)"],
        answer: 0,
        why: tx(t, "figRotL2_w", "x' = 3 · (−1) − 1 · 0 = −3 and y' = 3 · 0 + 1 · (−1) = −1: a half turn negates both coordinates. (−1, 3) is the quarter turn."),
      },
    },
    {
      title: tx(t, "figRotL3_t", "Length is kept"),
      body: <>
        <p>{tx(t, "figRotL3_b1", "Rotation only turns: P' is always as far from the origin as P, here √10 ≈ 3.16.")}</p>
        <p>{tx(t, "figRotL3_b2", "Turn P until P' lies on the positive y-axis.")}</p>
      </>,
      goal: { text: tx(t, "figRotL3_g", "P' = (0, 3.16)."), done: mode === "rotate" && Math.abs(Pr.x) < 0.05 && Pr.y > 0 },
      hint: tx(t, "figRotL3_h", "P already sits at about 18° above the x-axis, so it needs 90° − 18° ≈ 72°. Fine-tune with the slider."),
      setup: () => { pick("rotate"); setP({ x: 3, y: 1 }); setTh(0); },
    },
    {
      title: tx(t, "figRotL4_t", "Adding angles"),
      body: <>
        <p>{tx(t, "figRotL4_b1", "The blue point at angle α, rotated by β, lands at angle α + β. The readouts compare cos(α + β) and sin(α + β) with the formulas.")}</p>
        <p>{tx(t, "figRotL4_b2", "Push α + β past 180°: the formulas must still agree, with negative values.")}</p>
      </>,
      goal: { text: tx(t, "figRotL4_g", "α + β > 180°."), done: mode === "sum" && al + be > 180 },
      setup: () => { pick("sum"); setAl(30); setBe(45); },
    },
    {
      title: tx(t, "figRotL5_t", "Quick check"),
      body: <p>{tx(t, "figRotL5_b", "sin 30° = 1/2 and cos 30° = √3/2.")}</p>,
      quiz: {
        q: tx(t, "figRotL5_q", "Using the sum formula, what is sin(30° + 30°)?"),
        options: ["√3/2", "1", "1/2", "√3"],
        answer: 0,
        why: tx(t, "figRotL5_w", "sin 30° cos 30° + cos 30° sin 30° = 2 · ½ · √3/2 = √3/2 = sin 60°. Adding the sines (½ + ½ = 1) is the classic mistake: sine is not linear."),
      },
    },
    {
      title: tx(t, "figRotL6_t", "The double angle"),
      body: <>
        <p>{tx(t, "figRotL6_b1", "When β = α the sum formulas become the double-angle formulas: sin 2α = 2 sin α cos α.")}</p>
        <p>{tx(t, "figRotL6_b2", "Set β equal to α (any angle from 10° up).")}</p>
      </>,
      goal: { text: tx(t, "figRotL6_g", "β = α ≥ 10°."), done: mode === "sum" && al === be && al >= 10 },
    },
    {
      title: tx(t, "figRotL7_t", "Quick check"),
      body: <p>{tx(t, "figRotL7_b", "15° = 45° − 30°, and the difference formula flips the middle sign: cos(α − β) = cos α cos β + sin α sin β.")}</p>,
      quiz: {
        q: tx(t, "figRotL7_q", "What is cos 15° exactly?"),
        options: ["(√6 + √2)/4", "(√6 − √2)/4", "√3/2 − √2/2", "1/4"],
        answer: 0,
        why: tx(t, "figRotL7_w", "(√2/2)(√3/2) + (√2/2)(1/2) = √6/4 + √2/4 ≈ 0.966. (√6 − √2)/4 is sin 15°."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "quarter", tone: "ok", when: mode === "rotate" && (th === 90 || th === -90),
      title: tx(t, "figRotI1_t", "The quarter-turn rule"),
      body: fill(tx(t, "figRotI1_b", "At {th}° the sines and cosines are 0 and ±1, so the formula collapses to the rule of the transformations chapter: (x, y) → {rule}."), { th, rule: th === 90 ? "(−y, x)" : "(y, −x)" }),
    },
    {
      id: "half", tone: "ok", when: mode === "rotate" && th === 180,
      title: tx(t, "figRotI2_t", "A half turn"),
      body: tx(t, "figRotI2_b", "cos 180° = −1, sin 180° = 0: (x, y) → (−x, −y). Every point goes to the opposite side of the origin."),
    },
    {
      id: "cw", tone: "info", when: mode === "rotate" && th < 0 && th !== -90,
      title: tx(t, "figRotI3_t", "Negative angle"),
      body: fill(tx(t, "figRotI3_b", "θ = {th}° turns clockwise. sin θ is negative, so the same formula works: no separate rule for the other direction. The length stays {len}."), { th, len: n2(len) }),
    },
    {
      id: "double", tone: "ok", when: mode === "sum" && al === be && al > 0,
      title: tx(t, "figRotI4_t", "Double angle"),
      body: fill(tx(t, "figRotI4_b", "β = α = {al}°: sin {two}° = 2 sin {al}° cos {al}° = {v}."), { al, two: 2 * al, v: n3(2 * Math.sin(a) * Math.cos(a)) }),
    },
    {
      id: "past", tone: "info", when: mode === "sum" && al + be > 180,
      title: tx(t, "figRotI5_t", "Still exact past 180°"),
      body: tx(t, "figRotI5_b", "The identities came from rotating a point, which works for any angles, so they hold in every quadrant. Here the amber point is below the x-axis and both sides of the sine formula are negative."),
    },
  ];

  const title = tx(t, "figRot_title", "Rotating by any angle");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figRotR1", "Rotation by θ turns (1, 0) into (cos θ, sin θ) and (0, 1) into (−sin θ, cos θ)."),
          tx(t, "figRotR2", "x' = x cos θ − y sin θ, y' = x sin θ + y cos θ; the distance from the origin never changes."),
          tx(t, "figRotR3", "Rotating the point at angle α by β gives the angle-sum formulas."),
          tx(t, "figRotR4", "With β = α they become sin 2α = 2 sin α cos α and cos 2α = cos² α − sin² α."),
        ]}
      />
    </>
  );
}
