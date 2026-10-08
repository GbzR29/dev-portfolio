"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { makeProjector, useOrbit, boxFaces, frontFacing, shade, add, scale, cross, dot, type V3, type Projector } from "@/components/lesson/kit/scene3d";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// axis  — the rotation by θ about the unit axis n is the quaternion
//         q = (cos θ/2, sin θ/2 · n). One corner of the box travels round a
//         circle about the axis. At θ = 360° q = −1: a different quaternion
//         for the same (full-turn) rotation. The Transport turns θ.
// euler — yaw, then pitch, then roll. Each turns about an axis carried along
//         by the turns before it. At pitch = ±90° the roll axis lines up with
//         the yaw axis and one way of turning is lost: gimbal lock.
// slerp — blending from orientation A to B. Slerp moves the box's nose along
//         the shortest arc at constant speed; blending the three Euler angles
//         separately wanders along a longer, uneven path. The Transport
//         plays the blend.
// The lab: a half turn, a full turn that flips q, gimbal lock, then a blend.

type Mode = "axis" | "euler" | "slerp";
type Q = [number, number, number, number];         // (w, x, y, z)
const W = 560, H = 320;
const DEG = Math.PI / 180;
const TH_STEP = 30;                 // degrees per Transport step (axis)
const T_STEP = 0.1;                 // t per Transport step (slerp)

// ── Quaternion maths ──────────────────────────────────────────────────────────
const qmul = (a: Q, b: Q): Q => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
const axisAngle = (n: V3, th: number): Q => { const s = Math.sin(th / 2); return [Math.cos(th / 2), n[0] * s, n[1] * s, n[2] * s]; };
/** v' = q v q*, written with two cross products (the fast form used in real code). */
const rotate = (q: Q, v: V3): V3 => {
  const u: V3 = [q[1], q[2], q[3]], t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[0])), cross(u, t));
};
const euler = (yaw: number, pitch: number, roll: number): Q =>
  qmul(qmul(axisAngle([0, 1, 0], yaw * DEG), axisAngle([1, 0, 0], pitch * DEG)), axisAngle([0, 0, 1], roll * DEG));
function slerp(a: Q, b: Q, t: number): Q {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const bb = d < 0 ? (b.map(v => -v) as Q) : b;
  d = Math.abs(d);
  if (d > 0.9995) {                                  // nearly equal: lerp and renormalise
    const q = a.map((v, i) => v + (bb[i] - v) * t) as Q, l = Math.hypot(...q);
    return q.map(v => v / l) as Q;
  }
  const th = Math.acos(d), s = Math.sin(th);
  const ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
  return a.map((v, i) => ka * v + kb * bb[i]) as Q;
}
const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");
/** The unit axis pointing `ayaw` round from +z and `atilt` up from the floor. */
const axisOf = (ayaw: number, atilt: number): V3 => [Math.cos(atilt * DEG) * Math.sin(ayaw * DEG), Math.sin(atilt * DEG), Math.cos(atilt * DEG) * Math.cos(ayaw * DEG)];
/** The three gimbal axes after yaw, pitch and roll, and the angle between the yaw and roll axes. */
function gimbal(yaw: number, pitch: number, roll: number) {
  const q = euler(yaw, pitch, roll);
  const yawAxis: V3 = [0, 1, 0];
  const pitchAxis = rotate(axisAngle([0, 1, 0], yaw * DEG), [1, 0, 0]);
  const rollAxis = rotate(q, [0, 0, 1]);
  const gap = (Math.acos(Math.min(1, Math.abs(dot(yawAxis, rollAxis)))) * 180) / Math.PI;
  return { q, yawAxis, pitchAxis, rollAxis, gap, locked: gap < 1 };
}
// The slerp example: from no turn to yaw 170°, pitch 80°, roll 150°
const QA: Q = [1, 0, 0, 0], EB: V3 = [170, 80, 150];
const QB = euler(EB[0], EB[1], EB[2]);
const turnBetween = (a: Q, b: Q) => 2 * Math.acos(Math.min(1, Math.abs(qmul([a[0], -a[1], -a[2], -a[3]], b)[0]))) / DEG;
const SLERP_TOTAL = turnBetween(QA, QB);
const EULER_TOTAL = Array.from({ length: 41 }, (_, k) => euler(EB[0] * k / 40, EB[1] * k / 40, EB[2] * k / 40))
  .reduce((acc, e, k, all) => (k ? acc + turnBetween(all[k - 1], e) : 0), 0);

// ── Drawing ───────────────────────────────────────────────────────────────────
const HALF: V3 = [0.55, 0.25, 1.1];
const TINT = ["", "", C.sky, "", C.amber, ""];       // top blue, nose (+z) amber

function BoxShape({ proj, q, ghost = false }: { proj: Projector; q: Q; ghost?: boolean }) {
  const ax = [rotate(q, [1, 0, 0]), rotate(q, [0, 1, 0]), rotate(q, [0, 0, 1])] as [V3, V3, V3];
  const faces = boxFaces([0, 0, 0], HALF, ax).map((f, i) => {
    const sp = f.pts.map(proj);
    return { sp, i, n: f.normal, depth: sp.reduce((s, p) => s + p.depth, 0) / 4 };
  });
  return <g pointerEvents="none">
    {faces.filter(f => ghost || frontFacing(f.sp)).sort((a, b) => b.depth - a.depth).map(f =>
      <path key={f.i} d={"M" + f.sp.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L") + "Z"}
        fill={ghost ? "none" : TINT[f.i] || shade(f.n)} fillOpacity={ghost ? 0 : TINT[f.i] ? 0.85 : 1}
        stroke={ghost ? C.muted : "rgba(0,0,0,0.35)"} strokeWidth={ghost ? 0.8 : 1} strokeDasharray={ghost ? "3 3" : undefined} strokeLinejoin="round" />)}
  </g>;
}

function Line3({ proj, a, b, color, w = 1.5, dash }: { proj: Projector; a: V3; b: V3; color: string; w?: number; dash?: string }) {
  const p = proj(a), q = proj(b);
  return <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" pointerEvents="none" />;
}
const path3 = (proj: Projector, pts: V3[]) => pts.map((p, k) => { const s = proj(p); return `${k ? "L" : "M"}${s.x.toFixed(1)},${s.y.toFixed(1)}`; }).join("");

type Scene = { mode: Mode; ayaw: number; atilt: number; th: number; yaw: number; pitch: number; roll: number; s: number };

function AxisScene({ proj, ayaw, atilt, th }: { proj: Projector; ayaw: number; atilt: number; th: number }) {
  const n = axisOf(ayaw, atilt), q = axisAngle(n, th * DEG);
  const corner: V3 = [HALF[0], HALF[1], HALF[2]];
  const circle = Array.from({ length: 65 }, (_, k) => rotate(axisAngle(n, (k / 64) * 2 * Math.PI), corner));
  const done = Array.from({ length: 41 }, (_, k) => rotate(axisAngle(n, (k / 40) * th * DEG), corner));
  const centre = scale(n, dot(corner, n)), tip = rotate(q, corner), p = proj(tip);
  return <>
    <Line3 proj={proj} a={scale(n, -2.3)} b={scale(n, 2.3)} color={C.purple} w={1.4} dash="6 4" />
    <path d={path3(proj, circle)} fill="none" stroke={C.pink} strokeWidth={1} strokeDasharray="3 3" />
    <BoxShape proj={proj} q={q} />
    <path d={path3(proj, done)} fill="none" stroke={C.pink} strokeWidth={2.2} />
    <Line3 proj={proj} a={centre} b={tip} color={C.pink} w={1} />
    <Line3 proj={proj} a={[0, 0, 0]} b={scale(n, 2.3)} color={C.purple} w={2.6} />
    <circle cx={p.x} cy={p.y} r={4.5} fill={C.pink} />
  </>;
}

function EulerScene({ proj, yaw, pitch, roll }: { proj: Projector; yaw: number; pitch: number; roll: number }) {
  const { q, yawAxis, pitchAxis, rollAxis, locked } = gimbal(yaw, pitch, roll);
  return <>
    <BoxShape proj={proj} q={q} />
    <Line3 proj={proj} a={scale(yawAxis, -2)} b={scale(yawAxis, 2)} color={C.green} w={2.4} />
    <Line3 proj={proj} a={scale(pitchAxis, -2)} b={scale(pitchAxis, 2)} color={C.red} w={2.4} />
    <Line3 proj={proj} a={scale(rollAxis, -2.2)} b={scale(rollAxis, 2.2)} color={locked ? C.pink : C.blue} w={locked ? 3 : 2.4} dash={locked ? "7 4" : undefined} />
  </>;
}

function SlerpScene({ proj, s }: { proj: Projector; s: number }) {
  const mark: V3 = [0.7, 0.35, 1.4];                 // just outside a corner, so roll moves it too
  const N = 40;
  const sl = Array.from({ length: N + 1 }, (_, k) => rotate(slerp(QA, QB, k / N), mark));
  const eu = Array.from({ length: N + 1 }, (_, k) => rotate(euler(EB[0] * k / N, EB[1] * k / N, EB[2] * k / N), mark));
  const q = slerp(QA, QB, s), p = proj(rotate(q, mark));
  const ticks = (pts: V3[], col: string) => pts.filter((_, k) => k % 4 === 0).map((pt, k) => { const sp = proj(pt); return <circle key={k} cx={sp.x} cy={sp.y} r={2.4} fill={col} />; });
  return <>
    <BoxShape proj={proj} q={QA} ghost />
    <BoxShape proj={proj} q={QB} ghost />
    <BoxShape proj={proj} q={q} />
    <path d={path3(proj, eu)} fill="none" stroke={C.pink} strokeWidth={1.6} strokeDasharray="5 3" />
    {ticks(eu, C.pink)}
    <path d={path3(proj, sl)} fill="none" stroke={C.amber} strokeWidth={2} />
    {ticks(sl, C.amber)}
    <circle cx={p.x} cy={p.y} r={5} fill={C.amber} />
  </>;
}

/** The orbiting svg; owns its orbit (it is mounted twice while the lab is open). */
function QuatStage({ sc, t }: { sc: Scene; t?: TrackTranslations }) {
  const orb = useOrbit({ yaw: -0.6, pitch: 0.35, zoom: 1 });
  const proj = makeProjector(orb.orbit, W / 2, H / 2 + 10, 62, 9);
  return (
    <div className="relative">
      <svg ref={orb.ref} {...orb.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>
        <Line3 proj={proj} a={[0, 0, 0]} b={[2, 0, 0]} color={C.red} w={1} />
        <Line3 proj={proj} a={[0, 0, 0]} b={[0, 2, 0]} color={C.green} w={1} />
        <Line3 proj={proj} a={[0, 0, 0]} b={[0, 0, 2]} color={C.blue} w={1} />
        {sc.mode === "axis" ? <AxisScene proj={proj} ayaw={sc.ayaw} atilt={sc.atilt} th={sc.th} />
          : sc.mode === "euler" ? <EulerScene proj={proj} yaw={sc.yaw} pitch={sc.pitch} roll={sc.roll} />
          : <SlerpScene proj={proj} s={sc.s} />}
      </svg>
      <div className="absolute top-2 right-2"><Btn onClick={orb.reset}>{tx(t, "figQ_view", "reset view")}</Btn></div>
    </div>
  );
}

export function QuaternionFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("axis");
  const [ayaw, setAyaw] = useState(30), [atilt, setAtilt] = useState(50), [rawTh, setTh] = useState(120);
  const [yaw, setYaw] = useState(30), [pitch, setPitch] = useState(20), [roll, setRoll] = useState(0);
  const [rawS, setS] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-quaternion");
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && mode !== "euler" && (vis.on || lab.open), dt => {
    if (mode === "axis") {
      const next = rawTh + dt * 60;
      if (next >= 720) { setTh(720); setPlaying(false); } else setTh(next);
    } else {
      const next = rawS + dt * 0.25;
      if (next >= 1) { setS(1); setPlaying(false); } else setS(next);
    }
  });

  const th = Math.round(rawTh), s = Math.round(rawS * 100) / 100;
  const stop = () => setPlaying(false);
  const pick = (k: Mode) => { setMode(k); stop(); };
  const turnTo = (d: number) => { stop(); setTh(Math.max(0, Math.min(720, d))); };
  const blendTo = (v: number) => { stop(); setS(Math.max(0, Math.min(1, Math.round(v * 100) / 100))); };

  const n = axisOf(ayaw, atilt), q = axisAngle(n, th * DEG);
  const { gap, locked } = gimbal(yaw, pitch, roll);
  const qs = slerp(QA, QB, s);
  const sofar = 2 * Math.acos(Math.min(1, Math.abs(qs[0]))) / DEG;

  const view = (
    <div>
      <QuatStage sc={{ mode, ayaw, atilt, th, yaw, pitch, roll, s }} t={t} />
      {mode === "axis" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (!playing && th >= 720) setTh(0); setPlaying(p => !p); }}
          playLabel={tx(t, "figQ_playTurn", "turn about the axis")}
          onStep={() => turnTo((Math.floor(th / TH_STEP) + 1) * TH_STEP)}
          onBack={() => turnTo((Math.ceil(th / TH_STEP) - 1) * TH_STEP)}
          onReset={() => turnTo(0)}
          readout={`θ = ${th}° · w = cos θ/2 = ${n2(q[0])}`} />
      )}
      {mode === "slerp" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (!playing && s >= 1) setS(0); setPlaying(p => !p); }}
          playLabel={tx(t, "figQ_playBlend", "blend from A to B")}
          onStep={() => blendTo((Math.floor(s / T_STEP + 1e-6) + 1) * T_STEP)}
          onBack={() => blendTo((Math.ceil(s / T_STEP - 1e-6) - 1) * T_STEP)}
          onReset={() => blendTo(0)}
          readout={`t = ${s.toFixed(2)}`} />
      )}
    </div>
  );
  const modeChoice = <Choice value={mode} onChange={pick} options={[
    ["axis", tx(t, "figQ_mAxis", "axis & angle")],
    ["euler", tx(t, "figQ_mEuler", "gimbal lock")],
    ["slerp", tx(t, "figQ_mSlerp", "slerp")],
  ] as const} />;
  const controls = mode === "axis" ? <>
    <Sliders>
      <Slider label={tx(t, "figQ_axYaw", "axis turn")} value={ayaw} min={-180} max={180} step={1} onChange={setAyaw} fmt={v => `${v}°`} width="w-20" />
      <Slider label={tx(t, "figQ_axTilt", "axis tilt")} value={atilt} min={-90} max={90} step={1} onChange={setAtilt} fmt={v => `${v}°`} width="w-20" />
      <Slider label={tx(t, "figQ_angle", "angle θ")} value={th} min={0} max={720} step={1} onChange={turnTo} fmt={v => `${v}°`} width="w-20" />
    </Sliders>
    <Row>
      <Readout color={C.purple}>{`n = (${n2(n[0])}, ${n2(n[1])}, ${n2(n[2])})`}</Readout>
      <Readout>{`q = (cos θ/2, sin θ/2 · n) = (${n2(q[0])}, ${n2(q[1])}, ${n2(q[2])}, ${n2(q[3])})`}</Readout>
      <Readout>{`|q| = ${n2(Math.hypot(...q))}`}</Readout>
    </Row>
  </> : mode === "euler" ? <>
    <Sliders>
      <Slider label={tx(t, "figQ_yaw", "yaw")} value={yaw} min={-180} max={180} step={1} onChange={setYaw} fmt={v => `${v}°`} width="w-10" />
      <Slider label={tx(t, "figQ_pitch", "pitch")} value={pitch} min={-90} max={90} step={1} onChange={setPitch} fmt={v => `${v}°`} width="w-10" />
      <Slider label={tx(t, "figQ_roll", "roll")} value={roll} min={-180} max={180} step={1} onChange={setRoll} fmt={v => `${v}°`} width="w-10" />
    </Sliders>
    <Row>
      <Btn onClick={() => setPitch(90)}>{tx(t, "figQ_lock", "pitch = 90°")}</Btn>
      <Readout color={locked ? C.pink : undefined}>{`${tx(t, "figQ_gap", "angle between yaw and roll axes")}: ${Math.round(gap)}°`}</Readout>
      {locked && <Readout color={C.pink}>{tx(t, "figQ_locked", "gimbal lock: yaw and roll now do the same thing")}</Readout>}
    </Row>
  </> : <Row>
    <Readout color={C.amber}>{`slerp: ${tx(t, "figQ_turned", "turned")} ${Math.round(sofar)}° ${tx(t, "figQ_of", "of")} ${Math.round(SLERP_TOTAL)}° (t · ${Math.round(SLERP_TOTAL)}° = ${Math.round(s * SLERP_TOTAL)}°)`}</Readout>
    <Readout color={C.pink}>{`${tx(t, "figQ_eulerPath", "Euler angles blended: turns")} ${Math.round(EULER_TOTAL)}° ${tx(t, "figQ_inTotal", "in total")}`}</Readout>
  </Row>;
  const note = {
    axis: tx(t, "figQ_noteA2", "Choose an axis (purple) and press play to turn about it. The quaternion stores the cosine of half the angle and the axis scaled by the sine of half the angle, so its length is always 1. The pink corner travels round a circle about the axis. Keep going past 360°: the box is back where it started, but q has become its own negative (w = −1 at 360°); only at 720° does q return. Two quaternions, q and −q, describe every rotation."),
    euler: tx(t, "figQ_noteE", "Yaw turns about the vertical axis (green), pitch about the sideways axis after the yaw (red), roll about the box's own nose after both (blue). Press \"pitch = 90°\" so the nose points straight up, then move yaw and roll: they spin the box about the same vertical line. One of the three ways of turning has disappeared, so some orientations close to this one can only be reached by big, sudden jumps in the angles. That is gimbal lock."),
    slerp: tx(t, "figQ_noteS2", "The dashed boxes are the start and end orientations; the dot follows one corner of the box. Press play, or step through t. With slerp (amber) the box turns about one fixed axis by the smallest possible angle, and the dots, placed at equal steps of t, are equally spaced: the speed is constant and the angle turned is exactly t times the total. Blending yaw, pitch and roll separately (pink, dashed) reaches the same end, but the box turns much further in total, and its dots bunch up and spread out: the speed is uneven."),
  }[mode];

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figQL1_t", "Half a turn"),
      body: <>
        <p>{tx(t, "figQL1_b1", "q = (cos θ/2, sin θ/2 · n). Watch w, the first number, as the box turns about the purple axis.")}</p>
        <p>{tx(t, "figQL1_b2", "Step to a half turn.")}</p>
      </>,
      goal: { text: tx(t, "figQL1_g", "θ = 180°: w = 0."), done: mode === "axis" && th === 180 },
      hint: tx(t, "figQL1_h", "Six steps of 30°. cos 90° = 0, so the quaternion is pure axis: (0, n)."),
      focus: "step",
      setup: () => { pick("axis"); setAyaw(30); setAtilt(50); setTh(0); },
    },
    {
      title: tx(t, "figQL2_t", "Quick check"),
      body: <p>{tx(t, "figQL2_b", "A quarter turn (90°) about the vertical axis n = (0, 1, 0).")}</p>,
      quiz: {
        q: tx(t, "figQL2_q", "Which quaternion is it?"),
        options: ["(0.71, 0, 0.71, 0)", "(0, 0, 1, 0)", "(0.5, 0, 0.87, 0)", "(1, 0, 90, 0)"],
        answer: 0,
        why: tx(t, "figQL2_w", "Half the angle is 45°: (cos 45°, sin 45° · (0, 1, 0)) = (0.71, 0, 0.71, 0). (0, 0, 1, 0) is the half turn, because it uses the whole angle instead of half."),
      },
    },
    {
      title: tx(t, "figQL3_t", "A full turn is not 1"),
      body: <>
        <p>{tx(t, "figQL3_b1", "Keep turning until the box is back where it started.")}</p>
        <p>{tx(t, "figQL3_b2", "Then read q.")}</p>
      </>,
      goal: { text: tx(t, "figQL3_g", "θ = 360°."), done: mode === "axis" && th === 360 },
      focus: "step",
    },
    {
      title: tx(t, "figQL4_t", "Gimbal lock"),
      body: <>
        <p>{tx(t, "figQL4_b1", "Yaw (green), pitch (red) and roll (blue) are three axes, each carried by the turns before it.")}</p>
        <p>{tx(t, "figQL4_b2", "Tip the nose straight up and watch the roll axis.")}</p>
      </>,
      goal: { text: tx(t, "figQL4_g", "The roll axis lies on the yaw axis."), done: mode === "euler" && locked },
      hint: tx(t, "figQL4_h", "Set the pitch to 90°, with the button or the slider."),
      setup: () => { pick("euler"); setYaw(30); setPitch(20); setRoll(0); },
    },
    {
      title: tx(t, "figQL5_t", "Quick check"),
      body: <p>{tx(t, "figQL5_b", "In gimbal lock, yaw and roll spin the box about the same line.")}</p>,
      quiz: {
        q: tx(t, "figQL5_q", "What has been lost?"),
        options: [tx(t, "figQL5_o1", "one of the three independent ways of turning"), tx(t, "figQL5_o2", "the ability to turn at all"), tx(t, "figQL5_o3", "the length of the box"), tx(t, "figQL5_o4", "nothing: the angles are just large")],
        answer: 0,
        why: tx(t, "figQL5_w", "Two sliders now do the same thing, so only two independent turns are left. The box can still reach every orientation, but some nearby ones need sudden jumps in the angles. Quaternions have no such special pose."),
      },
    },
    {
      title: tx(t, "figQL6_t", "Blend two orientations"),
      body: <>
        <p>{tx(t, "figQL6_b1", "Amber: slerp of the two quaternions. Pink dashed: the three Euler angles blended one by one.")}</p>
        <p>{tx(t, "figQL6_b2", "Play the blend from A to B and compare the spacing of the dots.")}</p>
      </>,
      goal: { text: tx(t, "figQL6_g", "t = 1."), done: mode === "slerp" && s >= 1 },
      focus: "play",
      setup: () => { pick("slerp"); setS(0); },
    },
    {
      title: tx(t, "figQL7_t", "Quick check"),
      body: <p>{tx(t, "figQL7_b", "Slerp turns about one fixed axis at a constant speed.")}</p>,
      quiz: {
        q: fill(tx(t, "figQL7_q", "The whole slerp turns {a}°. How far has the box turned at t = 0.25?"), { a: Math.round(SLERP_TOTAL) }),
        options: [`${Math.round(SLERP_TOTAL / 4)}°`, `${Math.round(SLERP_TOTAL / 2)}°`, "25°", `${Math.round(EULER_TOTAL / 4)}°`],
        answer: 0,
        why: tx(t, "figQL7_w", "Constant speed about one axis: the angle turned is t times the total. That is what makes slerp the right tool for smooth turns."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "half", tone: "info", when: mode === "axis" && th === 180,
      title: tx(t, "figQI1_t", "Pure axis"),
      body: tx(t, "figQI1_b", "At a half turn w = cos 90° = 0 and the quaternion is (0, n): just the axis."),
    },
    {
      id: "minus", tone: "warn", when: mode === "axis" && th === 360,
      title: tx(t, "figQI2_t", "Same box, opposite q"),
      body: tx(t, "figQI2_b", "The box is back at the start, yet q = (−1, 0, 0, 0). The half angle is 180°, and cos 180° = −1. q and −q give the same rotation; turning further to 720° brings q back to 1."),
    },
    {
      id: "home", tone: "ok", when: mode === "axis" && th === 720,
      title: tx(t, "figQI3_t", "Two full turns"),
      body: tx(t, "figQI3_b", "Half of 720° is 360°: q = (1, 0, 0, 0) again. A quaternion needs two full turns of the box to come home."),
    },
    {
      id: "lock", tone: "warn", when: mode === "euler" && locked,
      title: tx(t, "figQI4_t", "Locked"),
      body: tx(t, "figQI4_b", "The nose points straight up, so the roll axis lies on the yaw axis. Moving yaw or roll now spins the box about the same vertical line."),
    },
    {
      id: "slerp", tone: "ok", when: mode === "slerp" && s >= 1,
      title: tx(t, "figQI5_t", "Shortest and steady"),
      body: fill(tx(t, "figQI5_b", "Slerp turned {a}° in all, the least any path can. Blending the Euler angles reached the same orientation by turning {e}°, with uneven speed."), { a: Math.round(SLERP_TOTAL), e: Math.round(EULER_TOTAL) }),
    },
  ];

  const title = tx(t, "figQ_title", "Rotations in 3D");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{modeChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={<>
          {note}{" "}
          <span data-mouse-only>{tx(t, "figQ_drag", "Drag to turn the view.")}</span>
          <span data-touch-only>{tx(t, "figQ_dragTouch", "Swipe to turn the view.")}</span>
        </>}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figQR1", "A turn by θ about the unit axis n is q = (cos θ/2, sin θ/2 · n), always of length 1."),
          tx(t, "figQR2", "q and −q are the same rotation: a full turn gives −1, two full turns give 1."),
          tx(t, "figQR3", "Yaw, pitch and roll lose a way of turning at pitch ±90°: gimbal lock."),
          tx(t, "figQR4", "Slerp turns about one axis by the smallest angle, at constant speed."),
        ]}
      />
    </>
  );
}
