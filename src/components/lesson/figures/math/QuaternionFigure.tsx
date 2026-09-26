"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, Btn, C } from "@/components/lesson/kit/figure";
import { makeProjector, useOrbit, boxFaces, frontFacing, shade, add, scale, cross, dot, type V3, type Projector } from "@/components/lesson/kit/scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// axis  — the rotation by θ about the unit axis n is the quaternion
//         q = (cos θ/2, sin θ/2 · n). One corner of the box travels round a
//         circle about the axis. At θ = 360° q = −1: a different quaternion
//         for the same (full-turn) rotation.
// euler — yaw, then pitch, then roll. Each turns about an axis carried along
//         by the turns before it. At pitch = ±90° the roll axis lines up with
//         the yaw axis and one way of turning is lost: gimbal lock.
// slerp — blending from orientation A to B. Slerp moves the box's nose along
//         the shortest arc at constant speed; blending the three Euler angles
//         separately wanders along a longer, uneven path.

type Mode = "axis" | "euler" | "slerp";
type Q = [number, number, number, number];         // (w, x, y, z)
const W = 560, H = 320;
const DEG = Math.PI / 180;

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

export function QuaternionFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("axis");
  const [ayaw, setAyaw] = useState(30), [atilt, setAtilt] = useState(50), [th, setTh] = useState(120);
  const [yaw, setYaw] = useState(30), [pitch, setPitch] = useState(20), [roll, setRoll] = useState(0);
  const [s, setS] = useState(0.5);
  const orb = useOrbit({ yaw: -0.6, pitch: 0.35, zoom: 1 });
  const proj = makeProjector(orb.orbit, W / 2, H / 2 + 10, 62, 9);

  const axes = <>
    <Line3 proj={proj} a={[0, 0, 0]} b={[2, 0, 0]} color={C.red} w={1} />
    <Line3 proj={proj} a={[0, 0, 0]} b={[0, 2, 0]} color={C.green} w={1} />
    <Line3 proj={proj} a={[0, 0, 0]} b={[0, 0, 2]} color={C.blue} w={1} />
  </>;

  let scene: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "axis") {
    const n: V3 = [Math.cos(atilt * DEG) * Math.sin(ayaw * DEG), Math.sin(atilt * DEG), Math.cos(atilt * DEG) * Math.cos(ayaw * DEG)];
    const q = axisAngle(n, th * DEG);
    const corner: V3 = [HALF[0], HALF[1], HALF[2]];
    const circle = Array.from({ length: 65 }, (_, k) => rotate(axisAngle(n, (k / 64) * 2 * Math.PI), corner));
    const done = Array.from({ length: 41 }, (_, k) => rotate(axisAngle(n, (k / 40) * th * DEG), corner));
    const centre = scale(n, dot(corner, n)), tip = rotate(q, corner);
    scene = <>
      {axes}
      <Line3 proj={proj} a={scale(n, -2.3)} b={scale(n, 2.3)} color={C.purple} w={1.4} dash="6 4" />
      <path d={path3(proj, circle)} fill="none" stroke={C.pink} strokeWidth={1} strokeDasharray="3 3" />
      <BoxShape proj={proj} q={q} />
      <path d={path3(proj, done)} fill="none" stroke={C.pink} strokeWidth={2.2} />
      <Line3 proj={proj} a={centre} b={tip} color={C.pink} w={1} />
      <Line3 proj={proj} a={[0, 0, 0]} b={scale(n, 2.3)} color={C.purple} w={2.6} />
      {(() => { const p = proj(tip); return <circle cx={p.x} cy={p.y} r={4.5} fill={C.pink} />; })()}
    </>;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figQ_axYaw", "axis turn")} value={ayaw} min={-180} max={180} step={1} onChange={setAyaw} fmt={v => `${v}°`} width="w-20" />
        <Slider label={tx(t, "figQ_axTilt", "axis tilt")} value={atilt} min={-90} max={90} step={1} onChange={setAtilt} fmt={v => `${v}°`} width="w-20" />
        <Slider label={tx(t, "figQ_angle", "angle θ")} value={th} min={0} max={720} step={1} onChange={setTh} fmt={v => `${v}°`} width="w-20" />
      </Sliders>
      <Row>
        <Readout color={C.purple}>{`n = (${n2(n[0])}, ${n2(n[1])}, ${n2(n[2])})`}</Readout>
        <Readout>{`q = (cos θ/2, sin θ/2 · n) = (${n2(q[0])}, ${n2(q[1])}, ${n2(q[2])}, ${n2(q[3])})`}</Readout>
        <Readout>{`|q| = ${n2(Math.hypot(...q))}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figQ_noteA", "Choose an axis (purple) and an angle. The quaternion stores the cosine of half the angle and the axis scaled by the sine of half the angle, so its length is always 1. The pink corner travels round a circle about the axis. Push θ past 360°: the box is back where it started, but q has become its own negative (w = −1 at 360°); only at 720° does q return. Two quaternions, q and −q, describe every rotation.");
  } else if (mode === "euler") {
    const q = euler(yaw, pitch, roll);
    const yawAxis: V3 = [0, 1, 0];
    const pitchAxis = rotate(axisAngle([0, 1, 0], yaw * DEG), [1, 0, 0]);
    const rollAxis = rotate(q, [0, 0, 1]);
    const gap = (Math.acos(Math.min(1, Math.abs(dot(yawAxis, rollAxis)))) * 180) / Math.PI;
    const locked = gap < 1;
    scene = <>
      {axes}
      <BoxShape proj={proj} q={q} />
      <Line3 proj={proj} a={scale(yawAxis, -2)} b={scale(yawAxis, 2)} color={C.green} w={2.4} />
      <Line3 proj={proj} a={scale(pitchAxis, -2)} b={scale(pitchAxis, 2)} color={C.red} w={2.4} />
      <Line3 proj={proj} a={scale(rollAxis, -2.2)} b={scale(rollAxis, 2.2)} color={locked ? C.pink : C.blue} w={locked ? 3 : 2.4} dash={locked ? "7 4" : undefined} />
    </>;
    controls = <>
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
    </>;
    note = tx(t, "figQ_noteE", "Yaw turns about the vertical axis (green), pitch about the sideways axis after the yaw (red), roll about the box's own nose after both (blue). Press \"pitch = 90°\" so the nose points straight up, then move yaw and roll: they spin the box about the same vertical line. One of the three ways of turning has disappeared, so some orientations close to this one can only be reached by big, sudden jumps in the angles. That is gimbal lock.");
  } else {
    const qa: Q = [1, 0, 0, 0], eb: V3 = [170, 80, 150];
    const qb = euler(eb[0], eb[1], eb[2]);
    const mark: V3 = [0.7, 0.35, 1.4];                 // just outside a corner, so roll moves it too
    const N = 40;
    const sl = Array.from({ length: N + 1 }, (_, k) => rotate(slerp(qa, qb, k / N), mark));
    const eq = Array.from({ length: N + 1 }, (_, k) => euler(eb[0] * k / N, eb[1] * k / N, eb[2] * k / N));
    const eu = eq.map(e => rotate(e, mark));
    const turn = (a: Q, b: Q) => 2 * Math.acos(Math.min(1, Math.abs(qmul([a[0], -a[1], -a[2], -a[3]], b)[0]))) / DEG;
    const eulerTotal = eq.reduce((acc, e, k) => (k ? acc + turn(eq[k - 1], e) : 0), 0);
    const q = slerp(qa, qb, s);
    const total = 2 * Math.acos(Math.min(1, Math.abs(qb[0]))) / DEG;
    const sofar = 2 * Math.acos(Math.min(1, Math.abs(q[0]))) / DEG;
    const ticks = (pts: V3[], col: string) => pts.filter((_, k) => k % 4 === 0).map((p, k) => { const sp = proj(p); return <circle key={k} cx={sp.x} cy={sp.y} r={2.4} fill={col} />; });
    scene = <>
      {axes}
      <BoxShape proj={proj} q={qa} ghost />
      <BoxShape proj={proj} q={qb} ghost />
      <BoxShape proj={proj} q={q} />
      <path d={path3(proj, eu)} fill="none" stroke={C.pink} strokeWidth={1.6} strokeDasharray="5 3" />
      {ticks(eu, C.pink)}
      <path d={path3(proj, sl)} fill="none" stroke={C.amber} strokeWidth={2} />
      {ticks(sl, C.amber)}
      {(() => { const p = proj(rotate(q, mark)); return <circle cx={p.x} cy={p.y} r={5} fill={C.amber} />; })()}
    </>;
    controls = <>
      <Slider label="t" value={s} min={0} max={1} step={0.01} onChange={setS} width="w-4" />
      <Row>
        <Readout color={C.amber}>{`slerp: ${tx(t, "figQ_turned", "turned")} ${Math.round(sofar)}° ${tx(t, "figQ_of", "of")} ${Math.round(total)}° (t · ${Math.round(total)}° = ${Math.round(s * total)}°)`}</Readout>
        <Readout color={C.pink}>{`${tx(t, "figQ_eulerPath", "Euler angles blended: turns")} ${Math.round(eulerTotal)}° ${tx(t, "figQ_inTotal", "in total")}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figQ_noteS", "The dashed boxes are the start and end orientations; the dot follows one corner of the box. Slide t. With slerp (amber) the box turns about one fixed axis by the smallest possible angle, and the dots, placed at equal steps of t, are equally spaced: the speed is constant and the angle turned is exactly t times the total. Blending yaw, pitch and roll separately (pink, dashed) reaches the same end, but the box turns much further in total, and its dots bunch up and spread out: the speed is uneven.");
  }

  return (
    <Figure
      title={tx(t, "figQ_title", "Rotations in 3D")}
      head={<>
        <Choice value={mode} onChange={setMode} options={[
          ["axis", tx(t, "figQ_mAxis", "axis & angle")],
          ["euler", tx(t, "figQ_mEuler", "gimbal lock")],
          ["slerp", tx(t, "figQ_mSlerp", "slerp")],
        ] as const} />
        <Btn onClick={orb.reset}>{tx(t, "figQ_view", "reset view")}</Btn>
      </>}
      controls={controls}
      note={<>
        {note}{" "}
        <span data-mouse-only>{tx(t, "figQ_drag", "Drag to turn the view.")}</span>
        <span data-touch-only>{tx(t, "figQ_dragTouch", "Swipe to turn the view.")}</span>
      </>}
    >
      <svg ref={orb.ref} {...orb.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-grab" style={{ touchAction: "none" }}>{scene}</svg>
    </Figure>
  );
}
