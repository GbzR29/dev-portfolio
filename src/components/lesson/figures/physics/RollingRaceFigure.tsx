"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A race down a ramp: a hoop, a disc, a solid ball and a box that slides
// without friction, released together. A body that rolls without slipping
// has I = c m R², and the energy equation gives a = g sin θ / (1 + c): the
// more of its mass sits far from the axis (bigger c), the more of the energy
// goes into spinning and the slower it gets down. The lanes show distance
// along the ramp; the bar at the end of each lane splits its kinetic energy
// into moving (green) and spinning (purple). Size does not change the order.
// "break it: no friction" takes away the grip that makes them roll: every body
// slides without turning and they all arrive together, like the box.
// Closed form: s(t) = ½ a t², stopped at the lane end.

const W = 560, H = 300;
const G = 9.81, L = 3;                                // ramp length (m)
const LX0 = 92, LX1 = 450, LY0 = 108, LH = 48;        // lanes: start, finish, first lane y, spacing
const BX = 466, BW = 84;                              // energy bars

type Body = { id: string; c: number; color: string; label: string };

export function RollingRaceFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(20);
  const [size, setSize] = useState(13);
  const [noFric, setNoFric] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const bodies: Body[] = [
    { id: "hoop", c: 1, color: C.orange, label: tx(t, "figPhRoll_hoop", "hoop  I = mR²") },
    { id: "disc", c: 0.5, color: C.sky, label: tx(t, "figPhRoll_disc", "disc  I = ½mR²") },
    { id: "ball", c: 0.4, color: C.pink, label: tx(t, "figPhRoll_ball", "ball  I = ⅖mR²") },
    { id: "box", c: 0, color: C.teal, label: tx(t, "figPhRoll_box", "box, sliding  I = 0") },
  ];
  const th = (deg * Math.PI) / 180;
  const accel = (b: Body) => (G * Math.sin(th)) / (1 + (noFric ? 0 : b.c));
  const finish = (b: Body) => Math.sqrt((2 * L) / accel(b));
  const END = Math.max(...bodies.map(finish)) + 0.4;

  useFrame(playing && vis.on, dt => {
    if (time >= END) { setPlaying(false); return; }
    setTime(v => Math.min(END, v + dt));
  });
  const stop = () => setPlaying(false);
  const changed = (f: () => void) => { stop(); f(); setTime(0); };
  const play = () => { if (time >= END) setTime(0); setPlaying(p => !p); };

  const sAt = (b: Body) => Math.min(L, 0.5 * accel(b) * time * time);
  const X = (s: number) => LX0 + (s / L) * (LX1 - LX0);
  const eMax = G * L * Math.sin(th);                   // energy per kg released over the whole ramp

  // inset: the ramp itself
  const rx0 = 14, ry0 = 84, rlen = 100;
  const rx1 = rx0 + rlen * Math.cos(th), ry1 = ry0 - rlen * Math.sin(th);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <path d={`M${rx0},${ry0} L${rx1},${ry0} L${rx1},${ry1} Z`} fill={C.axis} opacity={0.18} />
      <line x1={rx0} y1={ry0} x2={rx1} y2={ry1} stroke={C.fg} strokeWidth={1.5} />
      <path d={`M${rx0 + 26},${ry0} A26,26 0 0 0 ${rx0 + 26 * Math.cos(th)},${ry0 - 26 * Math.sin(th)}`} fill="none" stroke={C.amber} />
      <T x={rx0 + 32} y={ry0 - 4} color={C.amber} size={8.5}>{`θ = ${deg}°`}</T>
      <T x={rx1 + 8} y={ry1 + 10} color={C.muted} size={8.5}>{tx(t, "figPhRoll_start", "start")}</T>
      <T x={200} y={22} color={C.muted} size={9}>{tx(t, "figPhRoll_lanes", "distance along the ramp, all released together")}</T>
      <T x={200} y={36} color={C.muted} size={9}>{tx(t, "figPhRoll_formula", "a = g sin θ / (1 + c),   I = c m R²")}</T>
      <T x={BX} y={LY0 - 22} color={C.muted} size={8}>{tx(t, "figPhRoll_split", "kinetic energy")}</T>
      <T x={BX} y={LY0 - 12} color={C.green} size={7.5}>{tx(t, "figPhRoll_move", "moving")}</T>
      <T x={BX + 38} y={LY0 - 12} color={C.purple} size={7.5}>{tx(t, "figPhRoll_spin", "spinning")}</T>
      <line x1={LX1} x2={LX1} y1={LY0 - 26} y2={LY0 + 3 * LH + 20} stroke={C.amber} strokeDasharray="4 3" />
      {bodies.map((b, i) => {
        const y = LY0 + i * LH, s = sAt(b), cx = X(s);
        const c = noFric ? 0 : b.c;
        const turn = noFric ? 0 : (s / L) * (LX1 - LX0) / size;    // rolling: angle = distance / radius
        const done = 0.5 * accel(b) * time * time >= L;
        const ePerKg = G * s * Math.sin(th);
        const wTot = (ePerKg / eMax) * BW, wRot = wTot * (c / (1 + c));
        return <g key={b.id}>
          <line x1={LX0 - size} x2={LX1 + 4} y1={y + size} y2={y + size} stroke={C.axis} />
          <T x={LX0 - size} y={y + size + 12} color={b.color} size={8.5}>{b.label}</T>
          {b.id === "box"
            ? <rect x={cx - size} y={y - size} width={size * 2} height={size * 2} rx={2} fill={b.color} opacity={0.85} />
            : <g transform={`rotate(${(turn * 180) / Math.PI} ${cx} ${y})`}>
                <circle cx={cx} cy={y} r={size} fill={b.id === "hoop" ? "none" : b.color} stroke={b.color} strokeWidth={b.id === "hoop" ? 4 : 1} opacity={b.id === "ball" ? 0.9 : 0.85} />
                <line x1={cx} y1={y} x2={cx + size} y2={y} stroke={b.id === "hoop" ? b.color : "#fff"} strokeWidth={2} />
              </g>}
          {done && <T x={LX1 - 4} y={y + size + 12} anchor="end" color={b.color} size={8.5} bold>{`${f2(finish(b), 2)} s`}</T>}
          <rect x={BX} y={y - 6} width={wTot - wRot} height={12} fill={C.green} opacity={0.8} />
          <rect x={BX + wTot - wRot} y={y - 6} width={wRot} height={12} fill={C.purple} opacity={0.8} />
          <rect x={BX} y={y - 6} width={BW} height={12} fill="none" stroke={C.axis} />
        </g>;
      })}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhRoll_title", "Rolling race")}
      head={<Btn active={noFric} onClick={() => changed(() => setNoFric(v => !v))}>{tx(t, "figPhRoll_broken", "break it: no friction")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhRoll_angle", "ramp angle θ")} value={deg} min={5} max={45} step={1} onChange={v => changed(() => setDeg(v))} fmt={v => `${v}°`} />
          <Slider label={tx(t, "figPhRoll_size", "size R")} value={size} min={8} max={18} step={1} onChange={v => changed(() => setSize(v))} fmt={v => `${v * 2} cm`} />
        </Sliders>
        <Row>
          {bodies.map(b => <Readout key={b.id} color={b.color}>{`a = ${f2(accel(b), 2)} m/s²`}</Readout>)}
        </Row>
      </>}
      note={tx(t, "figPhRoll_note", "Press play. The box, which slides without friction and does not turn, wins; the ball comes next, then the disc, and the hoop is last. The bars show why: every body has turned the same amount of height into kinetic energy per kilogram, but the hoop must put half of it into spinning (c = 1), while the ball spends only 2/7 of it that way. Change the size: nothing changes, because R cancels out of a = g sin θ / (1 + c); so does the mass. Then break it: on a frictionless ramp nothing grips the surface, nothing makes the bodies spin, and they all slide down together.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={play}
          onStep={() => { stop(); setTime(v => Math.min(END, +(v + 0.05).toFixed(3))); }}
          onBack={() => { stop(); setTime(v => Math.max(0, +(v - 0.05).toFixed(3))); }}
          onReset={() => { stop(); setTime(0); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
