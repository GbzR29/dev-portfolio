"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// The same motion described from two frames of reference.
// river — a boat crosses a 60 m river. Its velocity relative to the water
//         (purple, set by its heading and engine) plus the water's velocity
//         relative to the shore (sky) gives its velocity relative to the
//         shore (amber). "Seen from the shore" the banks stand still and the
//         boat drifts downstream along the amber line; "seen from the water"
//         the ripples stand still, the boat goes exactly where it points, and
//         the banks slide past. Same crossing time in both.
// train — a passenger throws a ball straight up in a moving train. From the
//         train it goes up and down a vertical line; from the platform it
//         flies a parabola. Same ball, same throw, two honest descriptions.

const W = 560, H = 300;
type Mode = "river" | "train";
type Frame = "ground" | "moving";

// river geometry (metres → px)
const RW = 60, RS = 3.4, RY0 = 250, RX0 = 30;       // river width, scale, bottom bank y, left margin
const START_X = 30;
// train geometry
const TS = 12, TY = 250, V_THROW = 10, G = 9.81, HAND = 1.4;
const T_FLIGHT = (2 * V_THROW) / G;                    // up and back to the hand

const n1 = (v: number) => f2(v, 1).replace("-", "−");

export function RelativeMotionFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("river");
  const [frame, setFrame] = useState<Frame>("ground");
  const [u, setU] = useState(1.5);                  // current (m/s)
  const [vb, setVb] = useState(3);                  // boat speed relative to water (m/s)
  const [phi, setPhi] = useState(0);                // heading from straight across, + = downstream (deg)
  const [V, setV] = useState(10);                   // train speed (m/s)
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const ph = (phi * Math.PI) / 180;
  const across = vb * Math.cos(ph), along = u + vb * Math.sin(ph);
  const tCross = RW / across;
  const tEnd = mode === "river" ? tCross : T_FLIGHT;

  useFrame(playing && vis.on, dt => {
    if (time >= tEnd) { setPlaying(false); return; }
    setTime(v => Math.min(tEnd, v + dt * (mode === "river" ? 4 : 1)));   // the river runs 4× faster than real time
  });
  const stop = () => setPlaying(false);
  const reset = () => { stop(); setTime(0); };
  const set = <A,>(f: (a: A) => void) => (a: A) => { f(a); reset(); };

  let svg: React.ReactNode, readouts: React.ReactNode, note: string, controls: React.ReactNode;

  if (mode === "river") {
    // positions in the shore frame
    const bx = START_X + along * time, by = across * time;
    // what the camera follows: nothing (shore) or the water
    const shift = frame === "moving" ? -u * time : 0;
    const X = (x: number) => RX0 + (x + shift) * RS, Y = (y: number) => RY0 - y * RS;
    const ripple = 14;
    const ripples: React.ReactNode[] = [];
    for (let k = -2; k < 14; k++) for (let j = 1; j < 5; j++) {
      // ripples ride with the water: fixed in the water frame, wrapped round the screen in the shore frame
      const base = k * ripple + (j % 2) * 7, span = 16 * ripple;
      const x = frame === "moving" ? base + u * time : ((((base + u * time) % span) + span) % span) - 2 * ripple;
      const px = X(x), py = Y((j * RW) / 5);
      if (px > 0 && px < W) ripples.push(<path key={`${k}-${j}`} d={`M${px - 5},${py} q2.5,-3 5,0 q2.5,3 5,0`} fill="none" stroke={C.sky} strokeWidth={1} opacity={0.5} />);
    }
    const posts: React.ReactNode[] = [];
    for (let k = -4; k < 30; k++) {
      const px = X(k * 10);
      if (px > -10 && px < W + 10) posts.push(<g key={k}>
        <line x1={px} x2={px} y1={Y(0)} y2={Y(0) + 8} stroke={C.axis} />
        <line x1={px} x2={px} y1={Y(RW)} y2={Y(RW) - 8} stroke={C.axis} />
      </g>);
    }
    // the path drawn in the current frame: shore → amber line; water → purple line
    const pathEnd = frame === "ground" ? { x: START_X + along * tCross, y: RW } : { x: START_X + (along - u) * tCross + u * time, y: RW };
    const pathStart = frame === "ground" ? { x: START_X, y: 0 } : { x: START_X + u * time, y: 0 };
    const vsc = 18;                                           // px per m/s for the arrows
    const B = { x: X(bx), y: Y(by) };
    const tipW = { x: B.x + vb * Math.sin(ph) * vsc, y: B.y - vb * Math.cos(ph) * vsc };
    const tipG = { x: tipW.x + u * vsc, y: tipW.y };
    svg = <>
      <rect x={0} y={Y(RW)} width={W} height={Y(0) - Y(RW)} fill={C.sky} opacity={0.07} />
      <line x1={0} x2={W} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={2} />
      <line x1={0} x2={W} y1={Y(RW)} y2={Y(RW)} stroke={C.axis} strokeWidth={2} />
      {posts}{ripples}
      <circle cx={X(START_X)} cy={Y(0)} r={3.5} fill={C.muted} />
      <circle cx={X(START_X)} cy={Y(RW)} r={3.5} fill={C.muted} opacity={0.6} />
      <T x={X(START_X) + 6} y={Y(RW) - 6} color={C.muted}>{tx(t, "figPhRel_opposite", "opposite point")}</T>
      <line x1={X(pathStart.x)} y1={Y(pathStart.y)} x2={X(pathEnd.x)} y2={Y(pathEnd.y)} stroke={frame === "ground" ? C.amber : C.purple} strokeWidth={1.4} strokeDasharray="5 4" />
      <g transform={`translate(${B.x} ${B.y}) rotate(${phi})`}>
        <path d="M0,-11 L6,4 L4,9 L-4,9 L-6,4 Z" fill={C.fg} />
      </g>
      <Vec a={B} b={tipW} color={C.purple} w={2} />
      {frame === "ground" && <>
        <Vec a={tipW} b={tipG} color={C.sky} w={2} />
        <Vec a={B} b={tipG} color={C.amber} w={2.4} />
      </>}
      <T x={8} y={16} color={C.muted}>{frame === "ground" ? tx(t, "figPhRel_shoreView", "camera on the shore") : tx(t, "figPhRel_waterView", "camera floating with the water")}</T>
      <T x={W - 8} y={16} color={C.sky} anchor="end">{frame === "ground"
        ? `${tx(t, "figPhRel_current", "current")} → ${n1(u)} m/s`
        : `${tx(t, "figPhRel_shore", "shore")} ← ${n1(u)} m/s`}</T>
    </>;
    const drift = along * tCross;
    readouts = <>
      <Readout color={C.purple}>{`v(${tx(t, "figPhRel_bw", "boat/water")}) = ${n1(vb)} m/s`}</Readout>
      <Readout color={C.amber}>{`v(${tx(t, "figPhRel_bs", "boat/shore")}) = ${n1(Math.hypot(along, across))} m/s`}</Readout>
      <Readout>{`${tx(t, "figPhRel_cross", "crossing")} ${n1(tCross)} s`}</Readout>
      <Readout color={Math.abs(drift) < 0.5 ? C.green : C.red}>{`${tx(t, "figPhRel_drift", "lands")} ${n1(Math.abs(drift))} m ${drift >= 0 ? tx(t, "figPhRel_down", "downstream") : tx(t, "figPhRel_up", "upstream")}`}</Readout>
    </>;
    const canLand = u < vb;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhRel_u", "current u")} value={u} min={0} max={3} step={0.1} onChange={set(setU)} fmt={v => `${n1(v)} m/s`} />
        <Slider label={tx(t, "figPhRel_vb", "boat speed")} value={vb} min={1} max={5} step={0.1} onChange={set(setVb)} fmt={v => `${n1(v)} m/s`} />
        <Slider label={tx(t, "figPhRel_phi", "heading")} value={phi} min={-75} max={75} step={1} onChange={set(setPhi)} fmt={v => `${v}°`} />
      </Sliders>
      <Row>
        <Btn onClick={() => set(setPhi)(0)}>{tx(t, "figPhRel_fast", "aim straight across")}</Btn>
        <Btn onClick={() => canLand && set(setPhi)(Math.round((-Math.asin(u / vb) * 180) / Math.PI))}>{canLand
          ? tx(t, "figPhRel_aimUp", "aim upstream to land opposite")
          : tx(t, "figPhRel_cant", "too slow to land opposite")}</Btn>
      </Row>
    </>;
    note = tx(t, "figPhRel_noteR", "The purple arrow is the boat's velocity relative to the water: where the engine pushes it. The sky arrow is the water's velocity relative to the shore. Their sum, amber, is the boat's velocity relative to the shore. Aim straight across for the quickest crossing, and drift downstream. Aim partly upstream to land right opposite: the crossing is slower, because part of the engine's effort cancels the current. Switch the camera to float with the water: now the boat goes exactly where it points, and the shore slides past. The crossing time is the same in both frames.");
  } else {
    // ── train
    const tt = time;
    const trainX0 = 2;                                      // metres, train's back at t = 0 (ground frame)
    const seat = 6;                                         // ball thrown at this point of the train
    const yBall = HAND + V_THROW * tt - 0.5 * G * tt * tt;
    const camX = frame === "moving" ? V * tt : 0;           // camera rides with the train or stands
    const X = (x: number) => 20 + (x - camX) * TS, Y = (y: number) => TY - y * TS;
    const trainX = trainX0 + V * tt;
    const trace: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const s = (tt * i) / 60, xg = trainX0 + seat + V * s, y = HAND + V_THROW * s - 0.5 * G * s * s;
      const x = frame === "moving" ? xg - V * s + V * tt : xg;   // in the train frame the x of the ball never changes
      trace.push(`${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
    }
    const posts: React.ReactNode[] = [];
    for (let k = -2; k < 60; k++) {
      const px = X(k * 3);
      if (px > -10 && px < W + 10) posts.push(<line key={k} x1={px} x2={px} y1={TY + 4} y2={TY + 14} stroke={C.axis} />);
    }
    svg = <>
      <line x1={0} x2={W} y1={TY + 4} y2={TY + 4} stroke={C.axis} strokeWidth={2} />
      {posts}
      <rect x={X(trainX)} y={Y(3.2)} width={14 * TS} height={Y(0) - Y(3.2)} rx={6} fill={C.green} opacity={0.14} stroke={C.green} />
      {[2, 5, 8, 11].map(k => <rect key={k} x={X(trainX + k)} y={Y(2.6)} width={1.6 * TS} height={0.9 * TS} rx={2} fill={C.green} opacity={0.25} />)}
      <circle cx={X(trainX + 1.4)} cy={Y(0) + 2} r={5} fill={C.fg} />
      <circle cx={X(trainX + 12.6)} cy={Y(0) + 2} r={5} fill={C.fg} />
      <line x1={X(trainX + seat)} x2={X(trainX + seat)} y1={Y(0)} y2={Y(HAND)} stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
      <path d={trace.join("")} fill="none" stroke={frame === "ground" ? C.amber : C.purple} strokeWidth={1.8} strokeDasharray="4 3" />
      <circle cx={X(trainX0 + seat + V * tt)} cy={Y(yBall)} r={6} fill={C.red} stroke="var(--code-bg)" strokeWidth={1.5} />
      <T x={8} y={16} color={C.muted}>{frame === "ground" ? tx(t, "figPhRel_platform", "camera on the platform") : tx(t, "figPhRel_inTrain", "camera inside the train")}</T>
      <T x={W - 8} y={16} color={C.green} anchor="end">{`${tx(t, "figPhRel_train", "train")} → ${n1(V)} m/s`}</T>
    </>;
    const vxSeen = frame === "ground" ? V : 0;
    readouts = <>
      <Readout color={C.red}>{`${tx(t, "figPhRel_ballV", "ball")}: vₓ = ${n1(vxSeen)} m/s, v_y = ${n1(V_THROW - G * tt)} m/s`}</Readout>
      <Readout>{`a = (0, −9.81) m/s² ${tx(t, "figPhRel_both", "in both frames")}`}</Readout>
    </>;
    controls = <Sliders>
      <Slider label={tx(t, "figPhRel_V", "train speed")} value={V} min={0} max={15} step={0.5} onChange={set(setV)} fmt={v => `${n1(v)} m/s`} />
    </Sliders>;
    note = tx(t, "figPhRel_noteT", "A passenger throws a ball straight up at 10 m/s and catches it again. Seen from inside the train, the ball goes up and comes down the same vertical line, as if the train were standing still. Seen from the platform, the ball also moves forward with the train's speed the whole time, so it flies a parabola, like the projectiles of the last chapter. Both descriptions are right. They disagree about the velocity (they differ by the train's velocity) but agree about the acceleration: gravity, straight down.");
  }

  return (
    <Figure title={tx(t, "figPhRel_title", "One motion, two frames")}
      head={<Choice value={mode} onChange={m => { setMode(m); reset(); }} options={[
        ["river", tx(t, "figPhRel_mRiver", "river crossing")],
        ["train", tx(t, "figPhRel_mTrain", "ball in a train")],
      ] as const} />}
      controls={<>
        {controls}
        <Row>
          <Choice value={frame} onChange={f => setFrame(f)} options={[
            ["ground", mode === "river" ? tx(t, "figPhRel_fShore", "seen from the shore") : tx(t, "figPhRel_fPlatform", "seen from the platform")],
            ["moving", mode === "river" ? tx(t, "figPhRel_fWater", "seen from the water") : tx(t, "figPhRel_fTrain", "seen from the train")],
          ] as const} />
        </Row>
        <Row>{readouts}</Row>
      </>}
      note={note}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">{svg}</svg>
        <Transport t={t} playing={playing}
          onPlay={() => { if (time >= tEnd) setTime(0); setPlaying(p => !p); }}
          onStep={() => { stop(); setTime(v => Math.min(tEnd, v + tEnd / 10)); }}
          onBack={() => { stop(); setTime(v => Math.max(0, v - tEnd / 10)); }}
          onReset={reset}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
