"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Handle, useDrag, useFrame, useVisible, f2, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A person on a spinning stool, seen from above, holding a dumbbell in each
// hand. Drag a dumbbell (or the slider) to pull the arms in or push them out
// while it spins. Nothing outside twists the stool, so the angular momentum
// L = I ω stays the same: a smaller moment of inertia I means a faster spin.
// The bars on the right show I, ω, L and the kinetic energy K = L²/(2I),
// which grows as the arms come in (the arms do work pulling the weights).
// "give it a push" is an outside torque: it changes L by a fixed amount.
// "break it: keep ω fixed" shows the wrong guess that the spin rate stays put:
// L then changes with no outside torque, and K would drop when it should rise.

const W = 560, H = 300;
const I0 = 2.0;                                     // person + stool (kg·m²)
const CX = 190, CY = 150, PX = 150;                   // centre (px), px per metre
const R_MIN = 0.15, R_MAX = 0.85, L0 = 2 * Math.PI * 0.5 * (I0 + 2 * 2 * 0.8 * 0.8);   // 0.5 turn/s with arms at 0.8 m
const KICK = 6;                                       // angular impulse of one push (kg·m²/s)
const BX = 392, BW = 150;                             // bars

export function SpinFigure({ t }: { t?: TrackTranslations }) {
  const [r, setR] = useState(0.8);
  const [m, setM] = useState(2);
  const [L, setL] = useState(L0);
  const [w, setW] = useState(L0 / (I0 + 2 * 2 * 0.8 * 0.8));   // used only while broken
  const [broken, setBroken] = useState(false);
  const [angle, setAngle] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const I = I0 + 2 * m * r * r;
  const omega = broken ? w : L / I;
  const Lnow = I * omega;
  const K = 0.5 * I * omega * omega;

  useFrame(playing && vis.on, dt => {
    setAngle(a => (a + omega * dt) % (2 * Math.PI));
    setTime(v => v + dt);
  });

  const reset = () => { setPlaying(false); setAngle(0); setTime(0); setR(0.8); setL(L0); setW(L0 / (I0 + 2 * m * 0.64)); };
  const setArm = (v: number) => setR(clamp(Math.round(v * 100) / 100, R_MIN, R_MAX));

  const hand = (k: 0 | 1) => {
    const a = angle + k * Math.PI;
    return { x: CX + r * PX * Math.cos(a), y: CY + r * PX * Math.sin(a) };
  };
  const drag = useDrag<0 | 1>(
    p => {
      for (const k of [0, 1] as const) { const h = hand(k); if (Math.hypot(p.x - h.x, p.y - h.y) < 20) return k; }
      return null;
    },
    (_k, p) => setArm(Math.hypot(p.x - CX, p.y - CY) / PX));

  // trail: the arc each dumbbell covered in the last 0.25 s
  const trail = (k: 0 | 1) => {
    const a1 = angle + k * Math.PI, a0 = a1 - Math.min(2.5, omega * 0.25), R = r * PX;
    return `M${CX + R * Math.cos(a0)},${CY + R * Math.sin(a0)} A${R},${R} 0 0 1 ${CX + R * Math.cos(a1)},${CY + R * Math.sin(a1)}`;
  };

  // bars, each against a fixed scale so changes are visible
  const IMAX = I0 + 2 * 4 * R_MAX * R_MAX;
  const scales = { I: IMAX, w: 2 * Math.PI * 3, L: L0 * 3, K: (L0 * L0) / I0 };
  const bar = (i: number, val: number, max: number, color: string, label: string, text: string) => {
    const y = 40 + i * 60, wpx = clamp(val / max, 0, 1) * BW;
    return <g key={label}>
      <T x={BX} y={y - 6} color={color} size={9}>{label}</T>
      <rect x={BX} y={y} width={BW} height={14} fill="none" stroke={C.axis} />
      <rect x={BX} y={y} width={wpx} height={14} fill={color} opacity={0.8} />
      <T x={BX + BW} y={y + 26} anchor="end" color={color} size={9}>{text}</T>
    </g>;
  };
  const lColor = broken && Math.abs(Lnow - L) > 0.01 ? C.red : C.amber;

  const view = (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <circle cx={CX} cy={CY} r={R_MAX * PX + 14} fill="none" stroke={C.grid} />
      <circle cx={CX} cy={CY} r={R_MIN * PX} fill="none" stroke={C.grid} strokeDasharray="3 4" />
      <circle cx={CX} cy={CY} r={36} fill={C.axis} opacity={0.35} />
      <g transform={`rotate(${(angle * 180) / Math.PI} ${CX} ${CY})`}>
        <ellipse cx={CX} cy={CY} rx={16} ry={26} fill={C.sky} opacity={0.85} />
        <circle cx={CX + 4} cy={CY} r={10} fill={C.fg} opacity={0.75} />
        <path d={`M${CX + 14},${CY - 4} l7,4 l-7,4 z`} fill={C.fg} opacity={0.75} />
      </g>
      {([0, 1] as const).map(k => {
        const h = hand(k), a = angle + k * Math.PI;
        const sh = { x: CX + 22 * Math.cos(a), y: CY + 22 * Math.sin(a) };
        return <g key={k}>
          <path d={trail(k)} fill="none" stroke={C.pink} strokeWidth={6} opacity={0.18} strokeLinecap="round" />
          <line x1={sh.x} y1={sh.y} x2={h.x} y2={h.y} stroke={C.sky} strokeWidth={6} strokeLinecap="round" opacity={0.75} />
          <circle cx={h.x} cy={h.y} r={6 + m * 1.6} fill={C.pink} />
          <Handle x={h.x} y={h.y} color={C.pink} r={3} active={drag.dragging === k} />
        </g>;
      })}
      <T x={CX} y={CY + R_MAX * PX + 30} anchor="middle" color={C.muted} size={8.5}>{`r = ${f2(r, 2)} m`}</T>
      {bar(0, I, scales.I, C.sky, tx(t, "figPhSpin_I", "moment of inertia I"), `${f2(I, 2)} kg·m²`)}
      {bar(1, omega, scales.w, C.green, tx(t, "figPhSpin_w", "spin rate ω"), `${f2(omega / (2 * Math.PI), 2)} ${tx(t, "figPhSpin_tps", "turns/s")}`)}
      {bar(2, Lnow, scales.L, lColor, tx(t, "figPhSpin_L", "angular momentum L = Iω"), `${f2(Lnow, 1)} kg·m²/s`)}
      {bar(3, K, scales.K, C.purple, tx(t, "figPhSpin_K", "kinetic energy ½Iω²"), `${f2(K, 0)} J`)}
      {broken && Math.abs(Lnow - L) > 0.01 && <T x={BX} y={280} color={C.red} size={8.5}>{tx(t, "figPhSpin_bad", "L changed with no outside torque")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhSpin_title", "Pull your arms in")}
      head={<Btn active={broken} onClick={() => { setBroken(v => !v); setW(omega); setL(Lnow); }}>{tx(t, "figPhSpin_broken", "break it: keep ω fixed")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhSpin_r", "arm radius r")} value={r} min={R_MIN} max={R_MAX} step={0.01} onChange={setArm} fmt={v => `${f2(v, 2)} m`} />
          <Slider label={tx(t, "figPhSpin_m", "each dumbbell")} value={m} min={0.5} max={4} step={0.5} onChange={setM} fmt={v => `${v} kg`} />
        </Sliders>
        <Row>
          <Btn onClick={() => { if (broken) setW(v => v + KICK / I); else setL(v => v + KICK); }}>{tx(t, "figPhSpin_push", "give it a push (outside torque)")}</Btn>
          <Readout>{`I = ${f2(I0, 1)} + 2·${m}·${f2(r, 2)}² = ${f2(I, 2)}`}</Readout>
          <Readout color={C.green}>{`ω = L / I = ${f2(omega, 2)} rad/s`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhSpin_note", "Press play, then drag a pink dumbbell towards the centre while it spins. The stool speeds up, more than doubling its rate when the arms come all the way in, and slows again when they go out. The amber bar, L = I ω, never moves: nothing outside twists the stool. The kinetic energy does change: pulling the weights inwards against their tendency to fly outward takes work, and that work turns into faster spinning. Give it a push to see an outside torque change L. Then break it: if ω stayed fixed as the arms came in, L would shrink by itself and the energy would drop, the opposite of what every spinning skater shows.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={reset}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
