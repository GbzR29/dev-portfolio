"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Handle, plot, Grid, useDrag, nearest, clamp, type Pt } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// cosines — any triangle ABC with draggable corners. Dropping the height from
//           B onto side CA splits it into two right triangles; Pythagoras on
//           one of them gives c² = a² + b² − 2ab·cos C.
// sines   — the same triangle with its circumscribed circle: each side divided
//           by the sine of the opposite angle is the circle's diameter 2R.
// ssa     — two sides and an angle not between them: the circle of radius a
//           around C can cut the ray from A twice, once or never.
// ik      — a two-segment arm (upper arm, forearm) reaching for a draggable
//           target; the law of cosines gives the elbow and shoulder angles.
// The lab: the correction term at 90° and past it, the circumscribed circle,
// the ambiguous case, then the arm.

type Mode = "cosines" | "sines" | "ssa" | "ik";
type Id = "A" | "B" | "C" | "T";
const W = 560, H = 300;
const p = plot({ W, H, x0: -1.2, x1: 8.133, y0: -1, y1: 4 });
const DEG = 180 / Math.PI;
const SSA_B = 5.5;                                              // side b of the ambiguous case
const S = { x: 1, y: 0.5 };                                     // the arm's shoulder
const n2 = (v: number) => (+v.toFixed(2)).toString().replace("-", "−");
const X = (q: Pt) => p.X(q.x), Y = (q: Pt) => p.Y(q.y);
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
/** Interior angle at q between rays to a and b, in radians. */
const angleAt = (q: Pt, a: Pt, b: Pt) => {
  const ux = a.x - q.x, uy = a.y - q.y, vx = b.x - q.x, vy = b.y - q.y;
  return Math.acos(clamp((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1), -1, 1));
};
const tri = (q: Pt[], col: string, op = 0.14) =>
  <polygon points={q.map(v => `${X(v)},${Y(v)}`).join(" ")} fill={col} fillOpacity={op} stroke={col} strokeWidth={2} strokeLinejoin="round" />;

// ── The geometry ──────────────────────────────────────────────────────────────

/** Sides, angles, the foot D of the height from B, and the circumscribed circle. */
function triangleOf(A: Pt, B: Pt, Cp: Pt) {
  const a = dist(B, Cp), b = dist(Cp, A), c = dist(A, B);
  const aA = angleAt(A, B, Cp), aB = angleAt(B, A, Cp), aC = angleAt(Cp, A, B);
  const G = { x: (A.x + B.x + Cp.x) / 3, y: (A.y + B.y + Cp.y) / 3 };
  const ux = (A.x - Cp.x) / (b || 1), uy = (A.y - Cp.y) / (b || 1);
  const proj = (B.x - Cp.x) * ux + (B.y - Cp.y) * uy;
  const D = { x: Cp.x + ux * proj, y: Cp.y + uy * proj };
  const d2 = 2 * (A.x * (B.y - Cp.y) + B.x * (Cp.y - A.y) + Cp.x * (A.y - B.y));
  const sq = (v: Pt) => v.x * v.x + v.y * v.y;
  const O = Math.abs(d2) < 1e-9 ? G : {
    x: (sq(A) * (B.y - Cp.y) + sq(B) * (Cp.y - A.y) + sq(Cp) * (A.y - B.y)) / d2,
    y: (sq(A) * (Cp.x - B.x) + sq(B) * (A.x - Cp.x) + sq(Cp) * (B.x - A.x)) / d2,
  };
  const area = Math.abs(d2) / 4;
  return { a, b, c, aA, aB, aC, G, D, O, R: dist(O, A), area };
}

/** Where corner B can go: on the ray from A at angle alpha, at distance sa from C. */
function ssaOf(sa: number, alpha: number) {
  const b = SSA_B, al = alpha / DEG;
  const h = b * Math.sin(al);
  // Points on the ray t(cos α, sin α) at distance sa from C: t² − 2tb cos α + b² − a² = 0
  const disc = (b * Math.cos(al)) ** 2 - (b * b - sa * sa);
  const ts = disc < -1e-9 ? [] : [b * Math.cos(al) - Math.sqrt(Math.max(0, disc)), b * Math.cos(al) + Math.sqrt(Math.max(0, disc))]
    .filter((v, i, arr) => v > 1e-6 && (i === 0 || Math.abs(v - arr[0]) > 1e-6));
  return { h, al, Bs: ts.map(v => ({ x: v * Math.cos(al), y: v * Math.sin(al) })) };
}

/** The arm: elbow position and both joint angles for a target. */
function armOf(l1: number, l2: number, target: Pt) {
  const d0 = dist(S, target), reach = clamp(d0, Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  const base = Math.atan2(target.y - S.y, target.x - S.x);
  // Angle at the shoulder between the shoulder→target line and the upper arm
  const sh = Math.acos(clamp((l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach), -1, 1));
  const elbow = Math.acos(clamp((l1 * l1 + l2 * l2 - reach * reach) / (2 * l1 * l2), -1, 1));
  const E = { x: S.x + l1 * Math.cos(base + sh), y: S.y + l1 * Math.sin(base + sh) };
  const hand = { x: S.x + reach * Math.cos(base), y: S.y + reach * Math.sin(base) };
  return { d0, base, sh, elbow, E, hand, out: d0 > l1 + l2 };
}

// ── The drawings ──────────────────────────────────────────────────────────────

function LawsDrawing({ mode, A, B, Cp, dragging }: { mode: Mode; A: Pt; B: Pt; Cp: Pt; dragging: Id | null }) {
  const { a, b, c, G, D, O, R } = triangleOf(A, B, Cp);
  const mid = (u: Pt, v: Pt, lab: string, col: string) => {
    const m = { x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 }, dx = m.x - G.x, dy = m.y - G.y, l = Math.hypot(dx, dy) || 1;
    const nx = dx / l, ny = dy / l, anchor = nx > 0.35 ? "start" : nx < -0.35 ? "end" : "middle";
    return <T x={X(m) + nx * 10} y={Y(m) - ny * 12 + 4} size={10.5} anchor={anchor} color={col} bold>{lab}</T>;
  };
  const names = ([["A", A], ["B", B], ["C", Cp]] as [string, Pt][]).map(([n, v]) => {
    const dx = v.x - G.x, dy = v.y - G.y, l = Math.hypot(dx, dy) || 1;
    return <T key={n} x={X(v) + (dx / l) * 14} y={Y(v) - (dy / l) * 14 + 4} size={11} anchor="middle" color={C.fg} bold>{n}</T>;
  });
  const handles = (["A", "B", "C"] as const).map(k => { const v = k === "A" ? A : k === "B" ? B : Cp; return <Handle key={k} x={X(v)} y={Y(v)} color={C.pink} active={dragging === k} />; });
  if (mode === "cosines") return <>
    <Grid p={p} step={1} labels={false} />
    <line x1={X(Cp)} y1={Y(Cp)} x2={X(D)} y2={Y(D)} stroke={C.muted} strokeWidth={1} strokeDasharray="2 3" />
    {tri([A, B, Cp], C.sky)}
    <line x1={X(B)} y1={Y(B)} x2={X(D)} y2={Y(D)} stroke={C.purple} strokeWidth={1.6} strokeDasharray="5 3" />
    <circle cx={X(D)} cy={Y(D)} r={3.5} fill={C.purple} />
    <T x={X(D)} y={Y(D) + 15} size={10} anchor="middle" color={C.purple} bold>D</T>
    {mid(B, Cp, `a = ${n2(a)}`, C.red)}
    {mid(Cp, A, `b = ${n2(b)}`, C.green)}
    {mid(A, B, `c = ${n2(c)}`, C.amber)}
    {names}
    {handles}
  </>;
  return <>
    <Grid p={p} step={1} labels={false} />
    <circle cx={X(O)} cy={Y(O)} r={R * p.sx} fill="none" stroke={C.purple} strokeWidth={1.5} />
    <line x1={X(O)} y1={Y(O)} x2={X(A)} y2={Y(A)} stroke={C.purple} strokeWidth={1} strokeDasharray="3 3" />
    <circle cx={X(O)} cy={Y(O)} r={3} fill={C.purple} />
    {tri([A, B, Cp], C.sky)}
    {mid(B, Cp, "a", C.red)}
    {mid(Cp, A, "b", C.green)}
    {mid(A, B, "c", C.amber)}
    {names}
    {handles}
  </>;
}

function SsaDrawing({ sa, alpha }: { sa: number; alpha: number }) {
  const { al, Bs } = ssaOf(sa, alpha);
  const A0 = { x: 0, y: 0 }, C0 = { x: SSA_B, y: 0 };
  const ray = { x: 9 * Math.cos(al), y: 9 * Math.sin(al) };
  return <>
    <Grid p={p} step={1} labels={false} />
    <line x1={X(A0)} y1={Y(A0)} x2={X(ray)} y2={Y(ray)} stroke={C.muted} strokeWidth={1.2} strokeDasharray="5 3" />
    <circle cx={X(C0)} cy={Y(C0)} r={sa * p.sx} fill="none" stroke={C.red} strokeWidth={1.2} strokeDasharray="4 3" />
    {Bs.map((Bv, i) => <g key={i}>{tri([A0, Bv, C0], i === 0 ? C.amber : C.sky, 0.18)}
      <line x1={X(C0)} y1={Y(C0)} x2={X(Bv)} y2={Y(Bv)} stroke={C.red} strokeWidth={2.5} />
      <T x={X(Bv) - 6} y={Y(Bv) - 8} size={11} anchor="end" color={i === 0 ? C.amber : C.sky} bold>{`B${Bs.length > 1 ? (i ? "₂" : "₁") : ""}`}</T>
    </g>)}
    <line x1={X(A0)} y1={Y(A0)} x2={X(C0)} y2={Y(C0)} stroke={C.green} strokeWidth={3} />
    <T x={X(A0) - 10} y={Y(A0) + 4} size={11} anchor="end" color={C.fg} bold>A</T>
    <T x={X(C0) + 10} y={Y(C0) + 4} size={11} color={C.fg} bold>C</T>
    <T x={X({ x: SSA_B / 2, y: 0 })} y={Y(A0) + 15} size={10} anchor="middle" color={C.green} bold>{`b = ${SSA_B}`}</T>
  </>;
}

function ArmDrawing({ l1, l2, target, dragging }: { l1: number; l2: number; target: Pt; dragging: Id | null }) {
  const { E, hand, out } = armOf(l1, l2, target);
  return <>
    <Grid p={p} step={1} labels={false} />
    <circle cx={X(S)} cy={Y(S)} r={(l1 + l2) * p.sx} fill="none" stroke={C.muted} strokeWidth={1} strokeDasharray="4 4" />
    <line x1={X(S)} y1={Y(S)} x2={X(target)} y2={Y(target)} stroke={C.muted} strokeWidth={1} strokeDasharray="2 3" />
    <line x1={X(S)} y1={Y(S)} x2={X(E)} y2={Y(E)} stroke={C.sky} strokeWidth={8} strokeLinecap="round" />
    <line x1={X(E)} y1={Y(E)} x2={X(hand)} y2={Y(hand)} stroke={C.teal} strokeWidth={6} strokeLinecap="round" />
    <circle cx={X(S)} cy={Y(S)} r={7} fill={C.fg} />
    <circle cx={X(E)} cy={Y(E)} r={6} fill={C.fg} />
    <circle cx={X(hand)} cy={Y(hand)} r={5} fill={C.green} />
    <Handle x={X(target)} y={Y(target)} color={out ? C.red : C.amber} active={dragging === "T"} />
  </>;
}

/** The svg of the current mode; owns the drag (it is mounted twice while the lab is open). */
function TlStage({ mode, A, B, Cp, set, sa, alpha, l1, l2, target }: {
  mode: Mode; A: Pt; B: Pt; Cp: Pt; set: (id: Id, v: Pt) => void;
  sa: number; alpha: number; l1: number; l2: number; target: Pt;
}) {
  const drag = useDrag<Id>(
    q => mode === "ik" ? nearest(q, [["T", { x: X(target), y: Y(target) }]], 22)
      : mode === "ssa" ? null
        : nearest(q, [["A", { x: X(A), y: Y(A) }], ["B", { x: X(B), y: Y(B) }], ["C", { x: X(Cp), y: Y(Cp) }]], 20),
    (id, q) => {
      const w = p.inv(q);
      set(id, { x: clamp(w.x, -1, 7.9), y: clamp(w.y, -0.8, 3.8) });
    });
  return (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {mode === "cosines" || mode === "sines" ? <LawsDrawing mode={mode} A={A} B={B} Cp={Cp} dragging={drag.dragging} />
        : mode === "ssa" ? <SsaDrawing sa={sa} alpha={alpha} />
          : <ArmDrawing l1={l1} l2={l2} target={target} dragging={drag.dragging} />}
    </svg>
  );
}

const START = { A: { x: 0, y: 0 }, B: { x: 2.2, y: 3.2 }, C: { x: 6, y: 0 } };

export function TriangleLawFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("cosines");
  const [A, setA] = useState<Pt>(START.A), [B, setB] = useState<Pt>(START.B), [Cp, setCp] = useState<Pt>(START.C);
  const [sa, setSa] = useState(4), [alpha, setAlpha] = useState(35);
  const [l1, setL1] = useState(3), [l2, setL2] = useState(2.5);
  const [target, setTarget] = useState<Pt>({ x: 4, y: 2 });
  const lab = useLab("math-triangle-laws");
  const set = (id: Id, v: Pt) => (id === "A" ? setA : id === "B" ? setB : id === "C" ? setCp : setTarget)(v);
  const reset = () => { setA(START.A); setB(START.B); setCp(START.C); };

  const tr = triangleOf(A, B, Cp);
  const { a, b, c, aA, aB, aC } = tr;
  const cDeg = aC * DEG, corr = 2 * a * b * Math.cos(aC);
  const flat = tr.area < 0.4;
  const ssa = ssaOf(sa, alpha);
  const arm = armOf(l1, l2, target);

  const view = <TlStage mode={mode} A={A} B={B} Cp={Cp} set={set} sa={sa} alpha={alpha} l1={l1} l2={l2} target={target} />;
  const modeChoice = <Choice value={mode} onChange={setMode} options={[
    ["cosines", tx(t, "figTl_mCos", "law of cosines")],
    ["sines", tx(t, "figTl_mSin", "law of sines")],
    ["ssa", tx(t, "figTl_mSsa", "ambiguous case")],
    ["ik", tx(t, "figTl_mIk", "two-segment arm")],
  ] as const} />;
  const verdict = ssa.Bs.length === 2 ? tx(t, "figTl_two", "two triangles") : ssa.Bs.length === 1 ? tx(t, "figTl_one", "one triangle") : tx(t, "figTl_none", "no triangle");
  const controls = mode === "cosines" ? <Row>
    <Readout>{`C = ${cDeg.toFixed(1)}°`}</Readout>
    <Readout color={C.amber}>{`c² = ${n2(c * c)}`}</Readout>
    <Readout>{`a² + b² = ${n2(a * a + b * b)}`}</Readout>
    <Readout color={C.purple}>{`2ab·cos C = ${n2(corr)}`}</Readout>
    <Readout color={C.green}>{`a² + b² − 2ab·cos C = ${n2(a * a + b * b - corr)}`}</Readout>
  </Row> : mode === "sines" ? <Row>
    <Readout color={C.red}>{`a / sin A = ${n2(a)} / ${(Math.sin(aA)).toFixed(3)} = ${n2(a / Math.sin(aA))}`}</Readout>
    <Readout color={C.green}>{`b / sin B = ${n2(b / Math.sin(aB))}`}</Readout>
    <Readout color={C.amber}>{`c / sin C = ${n2(c / Math.sin(aC))}`}</Readout>
    <Readout color={C.purple}>{`2R = ${n2(2 * tr.R)}`}</Readout>
  </Row> : mode === "ssa" ? <>
    <Sliders>
      <Slider label={tx(t, "figTl_a", "side a")} value={sa} min={1} max={7} step={0.05} onChange={setSa} fmt={n2} />
      <Slider label={tx(t, "figTl_alpha", "angle A")} value={alpha} min={10} max={80} step={1} onChange={setAlpha} fmt={v => `${v}°`} />
    </Sliders>
    <Row>
      <Readout>{`b · sin A = ${n2(ssa.h)}`}</Readout>
      <Readout color={C.red}>{`a = ${n2(sa)}`}</Readout>
      <Readout color={C.pink}>{verdict}</Readout>
    </Row>
  </> : <>
    <Sliders>
      <Slider label={tx(t, "figTl_l1", "upper arm")} value={l1} min={1} max={4} step={0.1} onChange={setL1} fmt={n2} />
      <Slider label={tx(t, "figTl_l2", "forearm")} value={l2} min={1} max={4} step={0.1} onChange={setL2} fmt={n2} />
    </Sliders>
    <Row>
      <Readout>{`d = ${n2(arm.d0)}`}</Readout>
      <Readout color={C.sky}>{`${tx(t, "figTl_elbow", "elbow")} = acos((l₁² + l₂² − d²)/(2l₁l₂)) = ${(arm.elbow * DEG).toFixed(1)}°`}</Readout>
      <Readout color={C.teal}>{`${tx(t, "figTl_shoulder", "shoulder")} = ${((arm.base + arm.sh) * DEG).toFixed(1)}°`}</Readout>
      {arm.out && <Readout color={C.red}>{tx(t, "figTl_out", "out of reach: arm stretched")}</Readout>}
    </Row>
  </>;
  const note = mode === "cosines"
    ? tx(t, "figTl_noteC", "Drag the corners. The dashed purple height from B meets the line CA at D, at a right angle. In the right triangle BDC, CD = a·cos C and BD = a·sin C; the rest of the base, DA, is b − a·cos C. Pythagoras on the right triangle BDA gives c² = (a sin C)² + (b − a cos C)², which simplifies to a² + b² − 2ab cos C. Make C a right angle: the correction 2ab cos C becomes 0 and it is Pythagoras. Make C obtuse: the cosine turns negative, D falls outside the triangle and c² is bigger than a² + b².")
    : mode === "sines"
      ? tx(t, "figTl_noteS", "Each side is opposite the corner with the same letter: a faces A. Drag the corners: the three ratios side / sine of the opposite angle stay equal to one another, and equal to the diameter of the circle through the three corners (purple). A long side must face a large angle, and the law of sines says exactly how large.")
      : mode === "ssa"
        ? tx(t, "figTl_noteA", "You know side b (green), the angle A, and side a, which is not next to A. Corner B must lie on the dashed ray from A and at distance a from C, so on the red circle. If a is shorter than the distance from C to the ray, b · sin A, the circle misses and no triangle exists. If a lies between b · sin A and b, the circle cuts the ray twice: two different triangles fit the data. That is why SSA proves nothing, as the triangles chapter warned.")
        : tx(t, "figTl_noteK", "Drag the target point. Upper arm, forearm and the line from shoulder to target form a triangle with three known sides, so the law of cosines gives every angle: the elbow angle directly, and the shoulder angle as the angle between the target line and the upper arm. When the target is further than l₁ + l₂ (outside the dashed circle) no triangle exists: the cosine would have to be below −1, and the arm can only stretch out straight towards it.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figTlL1_t", "Back to Pythagoras"),
      body: <>
        <p>{tx(t, "figTlL1_b1", "c² = a² + b² − 2ab cos C. The purple readout is the correction term that Pythagoras lacks.")}</p>
        <p>{tx(t, "figTlL1_b2", "Drag the corners until the angle at C is a right angle.")}</p>
      </>,
      goal: { text: tx(t, "figTlL1_g", "C = 90° (within 1°): the correction is 0."), done: mode === "cosines" && Math.abs(cDeg - 90) < 1 },
      hint: tx(t, "figTlL1_h", "Move B straight above C."),
      setup: () => { setMode("cosines"); reset(); },
    },
    {
      title: tx(t, "figTlL2_t", "Past 90°"),
      body: <>
        <p>{tx(t, "figTlL2_b1", "Keep going. An obtuse angle has a negative cosine, so the correction is subtracted as a negative number.")}</p>
        <p>{tx(t, "figTlL2_b2", "Make C obtuse and watch where D, the foot of the height, ends up.")}</p>
      </>,
      goal: { text: tx(t, "figTlL2_g", "C > 100°: c² is now more than a² + b²."), done: mode === "cosines" && cDeg > 100 },
      hint: tx(t, "figTlL2_h", "Drag B to the right, past C."),
    },
    {
      title: tx(t, "figTlL3_t", "Quick check"),
      body: <p>{tx(t, "figTlL3_b", "cos C = (a² + b² − c²) / 2ab finds an angle from three sides.")}</p>,
      quiz: {
        q: tx(t, "figTlL3_q", "A triangle has sides 5, 7 and 8. What is the angle facing the 7?"),
        options: ["60°", "45°", "30°", "90°"],
        answer: 0,
        why: tx(t, "figTlL3_w", "cos = (5² + 8² − 7²) / (2 · 5 · 8) = (25 + 64 − 49) / 80 = 40/80 = 0.5, and arccos 0.5 = 60°."),
      },
    },
    {
      title: tx(t, "figTlL4_t", "The circle through the corners"),
      body: <>
        <p>{tx(t, "figTlL4_b1", "Here every side divided by the sine of the angle facing it gives the same number: the diameter 2R of the purple circle.")}</p>
        <p>{tx(t, "figTlL4_b2", "Make C a right angle and look at where the circle's centre lands.")}</p>
      </>,
      goal: { text: tx(t, "figTlL4_g", "C = 90° (within 1.5°)."), done: mode === "sines" && Math.abs(cDeg - 90) < 1.5 },
      hint: tx(t, "figTlL4_h", "sin 90° = 1, so c / 1 = 2R: side c itself is a diameter."),
      setup: () => { setMode("sines"); reset(); },
    },
    {
      title: tx(t, "figTlL5_t", "Two triangles, same data"),
      body: <>
        <p>{tx(t, "figTlL5_b1", "You know b, the angle A and the side a facing it. B must be on the dashed ray and on the red circle around C.")}</p>
        <p>{tx(t, "figTlL5_b2", "Right now the circle misses the ray. Change a until two different triangles fit.")}</p>
      </>,
      goal: { text: tx(t, "figTlL5_g", "Two triangles."), done: mode === "ssa" && ssa.Bs.length === 2 },
      hint: tx(t, "figTlL5_h", "a has to be longer than b · sin A but shorter than b = 5.5."),
      setup: () => { setMode("ssa"); setSa(2); setAlpha(35); },
    },
    {
      title: tx(t, "figTlL6_t", "Exactly one"),
      body: <p>{tx(t, "figTlL6_b", "Shrink a until the circle only just touches the ray: the two triangles merge into one right triangle.")}</p>,
      goal: { text: tx(t, "figTlL6_g", "a = b · sin A (within 0.05)."), done: mode === "ssa" && Math.abs(sa - ssa.h) < 0.05 },
      hint: tx(t, "figTlL6_h", "Read b · sin A in the first readout and set a to it."),
    },
    {
      title: tx(t, "figTlL7_t", "Quick check"),
      body: <p>{tx(t, "figTlL7_b", "Compare a with b · sin A and with b.")}</p>,
      quiz: {
        q: tx(t, "figTlL7_q", "b = 10, A = 30° and a = 6. How many triangles fit?"),
        options: [tx(t, "figTlL7_o1", "two"), tx(t, "figTlL7_o2", "one"), tx(t, "figTlL7_o3", "none")],
        answer: 0,
        why: tx(t, "figTlL7_w", "b · sin A = 10 · 0.5 = 5. Since 5 < 6 < 10, the circle of radius 6 cuts the ray twice: two triangles."),
      },
    },
    {
      title: tx(t, "figTlL8_t", "An arm"),
      body: <>
        <p>{tx(t, "figTlL8_b1", "Shoulder, elbow and target make a triangle with three known sides, so the law of cosines gives the elbow angle.")}</p>
        <p>{tx(t, "figTlL8_b2", "Drag the target until the elbow is bent at exactly a right angle.")}</p>
      </>,
      goal: { text: tx(t, "figTlL8_g", "Elbow = 90° (within 2°)."), done: mode === "ik" && !arm.out && Math.abs(arm.elbow * DEG - 90) < 2 },
      hint: tx(t, "figTlL8_h", "At 90° the correction vanishes: d² = l₁² + l₂², so d = √(9 + 6.25) ≈ 3.9."),
      setup: () => { setMode("ik"); setL1(3); setL2(2.5); setTarget({ x: 4, y: 2 }); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "flat", tone: "warn", when: (mode === "cosines" || mode === "sines") && flat,
      title: tx(t, "figTlI1_t", "Almost flat"),
      body: tx(t, "figTlI1_b", "The three corners are nearly on one line. The angles head for 0° and 180°, whose sines are 0, so the law of sines divides by almost nothing and the circle grows huge."),
    },
    {
      id: "right", tone: "ok", when: mode === "cosines" && !flat && Math.abs(cDeg - 90) < 1,
      title: tx(t, "figTlI2_t", "Pythagoras"),
      body: tx(t, "figTlI2_b", "cos 90° = 0, so the correction vanishes and c² = a² + b². Pythagoras is the law of cosines at a right angle."),
    },
    {
      id: "obtuse", tone: "info", when: mode === "cosines" && !flat && cDeg > 91,
      title: tx(t, "figTlI3_t", "Obtuse: the foot falls outside"),
      body: fill(tx(t, "figTlI3_b", "cos {C}° < 0, so −2ab cos C = +{corr} adds to a² + b². The height from B now lands on the extension of CA, outside the triangle."), { C: cDeg.toFixed(0), corr: n2(-corr) }),
    },
    {
      id: "diam", tone: "ok", when: mode === "sines" && !flat && Math.abs(cDeg - 90) < 1.5,
      title: tx(t, "figTlI4_t", "c is a diameter"),
      body: tx(t, "figTlI4_b", "With a right angle at C the hypotenuse c passes through the centre: Thales' theorem from the circle chapter, read backwards."),
    },
    {
      id: "two", tone: "info", when: mode === "ssa" && ssa.Bs.length === 2,
      title: tx(t, "figTlI5_t", "Two answers"),
      body: tx(t, "figTlI5_b", "Both triangles have the same b, A and a. Their angles at B are supplementary, B and 180° − B, which have the same sine: that is why sin⁻¹ alone cannot tell them apart."),
    },
    {
      id: "miss", tone: "warn", when: mode === "ssa" && ssa.Bs.length === 0,
      title: tx(t, "figTlI6_t", "Too short to close"),
      body: fill(tx(t, "figTlI6_b", "a = {a} is shorter than the distance from C to the ray, b · sin A = {h}. Side a cannot reach the ray, so no triangle has these measurements."), { a: n2(sa), h: n2(ssa.h) }),
    },
    {
      id: "reach", tone: "warn", when: mode === "ik" && arm.out,
      title: tx(t, "figTlI7_t", "Out of reach"),
      body: fill(tx(t, "figTlI7_b", "d = {d} is more than l₁ + l₂ = {sum}. The formula would ask for a cosine below −1, which no angle has: the arm can only point straight at the target."), { d: n2(arm.d0), sum: n2(l1 + l2) }),
    },
  ];

  const title = tx(t, "figTl_title", "Solving any triangle");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        {view}
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figTlR1", "c² = a² + b² − 2ab cos C: Pythagoras plus a correction that is 0 at 90° and changes sign past it."),
          tx(t, "figTlR2", "a / sin A = b / sin B = c / sin C = 2R, the diameter of the circle through the corners."),
          tx(t, "figTlR3", "Two sides and an angle not between them can give no triangle, one or two."),
          tx(t, "figTlR4", "A two-segment arm reaching a point is an SSS triangle; the law of cosines gives its joint angles."),
        ]}
      />
    </>
  );
}
