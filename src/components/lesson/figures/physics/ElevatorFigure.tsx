"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A person standing on a bathroom scale in a lift. Left: the shaft, five
// floors of 3 m. Middle: the person with the two forces on them, weight mg
// (always the same) and the normal force N from the scale, which is what the
// scale displays (as N/g, in "kg"). Right: the reading over the ride.
// Rides are lists of (duration, acceleration) segments, solved in closed form:
//   • up / down — speed up at 1.5 m/s², cruise at 3 m/s, slow down.
//   • break it: the cable snaps — free fall (the scale reads 0), then the
//     safety brakes grip at 15 m/s² (the scale reads about 2.5 × the weight).

const W = 560, H = 300;
const G = 9.81, HEIGHT = 15, PXM = 14;
const BASE = 272, CAR = 38;                           // shaft floor (px), car height (px)
const GX0 = 330, GX1 = 548, GY0 = 30, GY1 = 250;      // graph box

type RideId = "up" | "down" | "snap";
const RIDES: Record<RideId, { y0: number; segs: [number, number][] }> = {
  up: { y0: 0, segs: [[0.5, 0], [2, 1.5], [3, 0], [2, -1.5], [1, 0]] },
  down: { y0: HEIGHT, segs: [[0.5, 0], [2, -1.5], [3, 0], [2, 1.5], [1, 0]] },
  snap: { y0: HEIGHT, segs: [[0.5, 0], [1.2, -G], [11.772 / 15, 15], [1.5, 0]] },
};
const rideEnd = (id: RideId) => RIDES[id].segs.reduce((s, [d]) => s + d, 0);

/** Height, velocity and acceleration of the car at time t. */
function rideAt(id: RideId, t: number) {
  const { y0, segs } = RIDES[id];
  let y = y0, v = 0, a = 0, left = t;
  for (const [d, acc] of segs) {
    const dt = Math.min(d, left);
    a = acc;
    y += v * dt + 0.5 * acc * dt * dt;
    v += acc * dt;
    left -= dt;
    if (left <= 0) break;
  }
  if (Math.abs(v) < 1e-9) v = 0;
  return { y, v, a };
}

export function ElevatorFigure({ t }: { t?: TrackTranslations }) {
  const [ride, setRide] = useState<RideId>("up");
  const [m, setM] = useState(70);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const END = rideEnd(ride);
  useFrame(playing && vis.on, dt => {
    if (time >= END) { setPlaying(false); return; }
    setTime(v => Math.min(END, v + dt));
  });
  const stop = () => setPlaying(false);

  const now = rideAt(ride, time);
  const Nf = m * (G + now.a);                          // the scale's push on the feet
  const reading = Nf / G;                              // what the display shows, in "kg"
  const ratio = (G + now.a) / G;

  // ── shaft ──
  const carY = BASE - now.y * PXM - CAR;
  const floors = Array.from({ length: 6 }, (_, i) => i * 3);

  // ── person, with the two forces drawn relative to the weight ──
  const PX = 44;                                       // px for one weight
  const pcx = 222, feet = 214;
  const lift = ratio < 0.02 ? -10 : 0;               // weightless: the body drifts off the scale

  // ── graph ──
  const rMax = ride === "snap" ? 2.8 : 1.4;
  const gX = (tt: number) => GX0 + (tt / END) * (GX1 - GX0);
  const gY = (r: number) => GY1 - (r / rMax) * (GY1 - GY0);
  const path = Array.from({ length: 241 }, (_, i) => {
    const tt = (time * i) / 240;
    return `${i ? "L" : "M"}${gX(tt).toFixed(1)},${gY((G + rideAt(ride, tt).a) / G).toFixed(1)}`;
  }).join("");

  const feel = ratio > 1.02 ? tx(t, "figPhLift_heavy", "you feel heavier")
    : ratio < 0.02 ? tx(t, "figPhLift_float", "weightless: you float")
    : ratio < 0.98 ? tx(t, "figPhLift_light", "you feel lighter")
    : tx(t, "figPhLift_normal", "you feel normal");

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* shaft */}
      <rect x={34} y={BASE - HEIGHT * PXM - CAR - 6} width={84} height={HEIGHT * PXM + CAR + 6} fill="none" stroke={C.axis} />
      {floors.map(f => <g key={f}>
        <line x1={118} x2={130} y1={BASE - f * PXM} y2={BASE - f * PXM} stroke={C.axis} />
        <T x={134} y={BASE - f * PXM + 3} color={C.axis} size={8}>{`${f} m`}</T>
      </g>)}
      <line x1={76} x2={76} y1={BASE - HEIGHT * PXM - CAR - 6} y2={carY} stroke={ride === "snap" && time > 0.5 ? C.red : C.muted} strokeDasharray={ride === "snap" && time > 0.5 ? "2 3" : undefined} />
      <rect x={44} y={carY} width={64} height={CAR} rx={3} fill={C.sky} opacity={0.25} stroke={C.sky} />
      <circle cx={76} cy={carY + 11} r={4} fill={C.fg} opacity={0.7} />
      <line x1={76} x2={76} y1={carY + 15} y2={carY + 31} stroke={C.fg} strokeWidth={3} opacity={0.7} />
      <rect x={68} y={carY + 32} width={16} height={4} fill={C.fg} opacity={0.5} />
      {Math.abs(now.a) > 0.01 && <Vec a={{ x: 26, y: carY + CAR / 2 }} b={{ x: 26, y: carY + CAR / 2 - now.a * 3 }} color={C.amber} w={2} />}

      {/* person on the scale */}
      <g transform={`translate(0,${lift})`}>
        <circle cx={pcx} cy={feet - 76} r={11} fill={C.fg} opacity={0.75} />
        <rect x={pcx - 12} y={feet - 62} width={24} height={36} rx={8} fill={C.fg} opacity={0.6} />
        <line x1={pcx - 6} x2={pcx - 6} y1={feet - 28} y2={feet - 2} stroke={C.fg} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
        <line x1={pcx + 6} x2={pcx + 6} y1={feet - 28} y2={feet - 2} stroke={C.fg} strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      </g>
      <rect x={pcx - 34} y={feet} width={68} height={12} rx={3} fill={C.axis} opacity={0.6} />
      <rect x={pcx - 36} y={feet + 22} width={72} height={26} rx={5} fill="var(--surface)" stroke={C.green} />
      <T x={pcx} y={feet + 40} anchor="middle" color={C.green} size={13} bold>{`${f2(reading, 1)} kg`}</T>
      <Vec a={{ x: pcx + 30, y: feet - 44 }} b={{ x: pcx + 30, y: feet - 44 + PX }} color={C.blue} w={2.4} />
      <T x={pcx + 36} y={feet - 44 + PX} color={C.blue} size={9}>mg</T>
      {ratio > 0.01 && <Vec a={{ x: pcx - 30, y: feet - 4 }} b={{ x: pcx - 30, y: feet - 4 - PX * ratio }} color={C.green} w={2.4} />}
      <T x={pcx - 36} y={Math.max(14, feet - 4 - PX * ratio)} anchor="end" color={C.green} size={9}>N</T>
      <T x={pcx} y={feet + 64} anchor="middle" color={C.fg} size={9.5}>{feel}</T>

      {/* reading over time */}
      <line x1={GX0} x2={GX0} y1={GY0} y2={GY1} stroke={C.axis} />
      <line x1={GX0} x2={GX1} y1={GY1} y2={GY1} stroke={C.axis} />
      <line x1={GX0} x2={GX1} y1={gY(1)} y2={gY(1)} stroke={C.blue} strokeDasharray="4 3" opacity={0.6} />
      <T x={GX0 - 4} y={gY(1) + 3} anchor="end" color={C.blue} size={8}>{`${m}`}</T>
      <T x={GX0 - 4} y={GY1 + 3} anchor="end" color={C.axis} size={8}>0</T>
      <T x={GX0 - 4} y={GY0 + 3} anchor="end" color={C.axis} size={8}>{`${f2(m * rMax, 0)}`}</T>
      <T x={GX0 + 4} y={GY0 - 8} color={C.green} size={8.5}>{tx(t, "figPhLift_axis", "scale reading (kg)")}</T>
      {Array.from({ length: Math.floor(END) + 1 }, (_, i) => <g key={i}>
        <line x1={gX(i)} x2={gX(i)} y1={GY1} y2={GY1 + 3} stroke={C.axis} />
        <T x={gX(i)} y={GY1 + 13} anchor="middle" color={C.axis} size={8}>{i}</T>
      </g>)}
      <T x={GX1} y={GY1 + 26} anchor="end" color={C.axis} size={8}>t (s)</T>
      {time > 0 && <path d={path} fill="none" stroke={C.green} strokeWidth={2} />}
      <circle cx={gX(time)} cy={gY(ratio)} r={3.5} fill={C.green} />
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhLift_title", "Bathroom scale in a lift")}
      head={<Choice value={ride} onChange={v => { stop(); setRide(v); setTime(0); }} options={[
        ["up", tx(t, "figPhLift_up", "ride up")],
        ["down", tx(t, "figPhLift_down", "ride down")],
        ["snap", tx(t, "figPhLift_snap", "break it: the cable snaps")],
      ] as const} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhLift_mass", "your mass")} value={m} min={40} max={120} step={5} onChange={v => setM(v)} fmt={v => `${v} kg`} />
        </Sliders>
        <Row>
          <Readout color={C.amber}>{`a = ${f2(now.a, 2).replace("-", "−")} m/s²`}</Readout>
          <Readout>{`v = ${f2(now.v, 2).replace("-", "−")} m/s`}</Readout>
          <Readout color={C.green}>{`N = m (g + a) = ${f2(Nf, 0)} N`}</Readout>
          <Readout color={C.blue}>{`mg = ${f2(m * G, 0)} N`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhLift_note", "The scale does not measure your weight. It measures how hard it has to push up on your feet, N, and divides by g. Standing still or moving at constant speed, N = mg and the reading is your mass. While the lift speeds up going up (or slows down going down) the floor must push harder, N = m(g + a), and you read more. In the opposite cases you read less. Watch the ride up: the reading changes only while the speed changes, never during the steady part. Then break it: with the cable gone, you and the scale fall together, the scale has nothing to push against and reads 0. That is what astronauts in orbit feel all the time.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (time >= END) setTime(0); setPlaying(p => !p); }}
          onStep={() => { stop(); setTime(v => Math.min(END, +(v + 0.1).toFixed(3))); }}
          onBack={() => { stop(); setTime(v => Math.max(0, +(v - 0.1).toFixed(3))); }}
          onReset={() => { stop(); setTime(0); }}
          readout={`t = ${f2(time, 1)} s · ${f2(now.y, 1)} m`} />
      </div>
    </Figure>
  );
}
