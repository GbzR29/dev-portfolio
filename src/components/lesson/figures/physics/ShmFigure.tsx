"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Handle, useDrag, useFrame, useVisible, f2, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A block on a frictionless floor, tied to a wall by a spring. Drag the block
// to stretch the spring and let go (or set the amplitude with the slider).
// The spring pulls back with F = −k x, and the block swings to and fro.
// Under it, a point goes round a circle of radius A at the steady rate ω: its
// shadow on the floor line moves exactly like the block, which is why
// x = A cos ωt. On the right, x(t) is drawn as it happens, and the bars split
// the energy into kinetic (green) and spring (sky), whose sum never changes.
// "break it: constant-size pull" replaces the spring with a force of the same
// size wherever the block is, always towards the middle. The motion still
// repeats, but the period now depends on the amplitude, the block drifts off
// the circle's shadow and x(t) is made of parabolas instead of a cosine.
// Both motions have closed forms, so the drawing is a pure function of time.

const W = 560, H = 300;
const WALL = 22, X0 = 175, PX = 100;                 // wall x, equilibrium x (px), px per metre
const BY = 64, BH = 34;                               // block: centre y, height
const CY = 196;                                       // reference circle centre y
const GX0 = 330, GX1 = 548, GY = 120, GH = 70;       // graph: left, right, mid line y, half height (px for 1 m)
const SPAN = 6;                                        // s of history shown
const F_PULL = 0.3;                                    // broken mode: force = k × 0.3 m in size

/** Position of a block released from rest at x = A, for both force laws. */
function xAt(time: number, A: number, k: number, m: number, broken: boolean) {
  if (time <= 0) return A;
  if (!broken) return A * Math.cos(Math.sqrt(k / m) * time);
  const a = (k * F_PULL) / m, tq = Math.sqrt((2 * A) / a);
  let s = time % (4 * tq), sign = 1;
  if (s >= 2 * tq) { s -= 2 * tq; sign = -1; }
  const x = s < tq ? A - 0.5 * a * s * s : -A + 0.5 * a * (2 * tq - s) ** 2;
  return sign * x;
}

export function ShmFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState(20);
  const [m, setM] = useState(1);
  const [A, setA] = useState(0.6);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const omega = Math.sqrt(k / m);
  const period = broken ? 4 * Math.sqrt((2 * A * m) / (k * F_PULL)) : (2 * Math.PI) / omega;
  const x = xAt(time, A, k, m, broken);
  const U = broken ? k * F_PULL * Math.abs(x) : 0.5 * k * x * x;
  const E = broken ? k * F_PULL * A : 0.5 * k * A * A;
  const K = Math.max(0, E - U);
  const force = broken ? -Math.sign(x) * k * F_PULL : -k * x;

  useFrame(playing && vis.on, dt => setTime(v => v + dt));
  const restart = (f: () => void) => { f(); setTime(0); };

  const bx = X0 + x * PX;
  const drag = useDrag<"b">(
    p => (Math.abs(p.x - bx) < 26 && Math.abs(p.y - BY) < 26 ? "b" : null),
    (_k, p) => { setPlaying(false); setTime(0); setA(clamp(Math.round(((p.x - X0) / PX) * 20) / 20, 0.1, 1)); });

  // the spring: a zigzag from the wall to the block's left face
  const spring = () => {
    const x1 = bx - 20, n = 14, seg = (x1 - WALL - 16) / n;
    let d = `M${WALL},${BY} l8,0`;
    for (let i = 0; i < n; i++) d += ` L${WALL + 8 + seg * (i + 0.5)},${BY + (i % 2 ? 9 : -9)}`;
    return d + ` L${x1 - 8},${BY} L${x1},${BY}`;
  };

  // reference circle: a point at angle ωt, its shadow is A cos ωt
  const ang = omega * time;
  const px = X0 + A * PX * Math.cos(ang), py = CY - A * PX * 0.62 * Math.sin(ang);

  // x(t) history and, in broken mode, the cosine it would have been
  const curve = (f: (τ: number) => number) => {
    const n = 220, t0 = Math.max(0, time - SPAN);
    let d = "";
    for (let i = 0; i <= n; i++) {
      const τ = t0 + ((time - t0) * i) / n;
      if (time - t0 < 1e-6) break;
      d += `${i ? "L" : "M"}${(GX0 + ((τ - Math.max(0, time - SPAN)) / SPAN) * (GX1 - GX0)).toFixed(1)},${(GY - f(τ) * GH).toFixed(1)}`;
    }
    return d;
  };
  const headX = GX0 + (Math.min(time, SPAN) / SPAN) * (GX1 - GX0);

  const BAR = 200;
  const view = (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* wall, floor, equilibrium mark */}
      <line x1={WALL} y1={BY - 30} x2={WALL} y2={BY + 22} stroke={C.fg} strokeWidth={2} />
      <line x1={WALL} y1={BY + BH / 2 + 1} x2={300} y2={BY + BH / 2 + 1} stroke={C.axis} />
      <line x1={X0} y1={BY + BH / 2 + 1} x2={X0} y2={CY + 80} stroke={C.grid} strokeDasharray="3 4" />
      <T x={X0} y={BY + BH / 2 + 13} anchor="middle" color={C.muted} size={8}>x = 0</T>
      <path d={spring()} fill="none" stroke={broken ? C.red : C.muted} strokeWidth={1.6} opacity={broken ? 0.45 : 1} />
      <rect x={bx - 20} y={BY - BH / 2} width={40} height={BH} rx={3} fill={C.sky} opacity={0.9} />
      <Handle x={bx} y={BY} color={C.sky} r={3} active={drag.dragging === "b"} />
      {Math.abs(force) > 0.05 && (() => {
        const len = clamp(force * 2.2, -70, 70);
        const tip = bx + len, s = Math.sign(len);
        return <g>
          <line x1={bx} y1={BY - BH / 2 - 9} x2={tip - s * 6} y2={BY - BH / 2 - 9} stroke={C.red} strokeWidth={2} />
          <polygon points={`${tip},${BY - BH / 2 - 9} ${tip - s * 7},${BY - BH / 2 - 13} ${tip - s * 7},${BY - BH / 2 - 5}`} fill={C.red} />
        </g>;
      })()}
      <T x={bx} y={BY - BH / 2 - 16} anchor="middle" color={C.red} size={8}>{`F = ${f2(force, 1)} N`}</T>

      {/* reference circle */}
      <ellipse cx={X0} cy={CY} rx={A * PX} ry={A * PX * 0.62} fill="none" stroke={C.grid} />
      <line x1={X0} y1={CY} x2={px} y2={py} stroke={C.amber} strokeWidth={1.2} />
      <line x1={px} y1={py} x2={px} y2={BY + BH / 2 + 1} stroke={C.amber} strokeDasharray="2 3" opacity={0.7} />
      <circle cx={px} cy={py} r={5} fill={C.amber} />
      <T x={X0} y={CY + A * PX * 0.62 + 16} anchor="middle" color={C.amber} size={8}>{tx(t, "figPhShm_circle", "a point going round at the steady rate ω")}</T>
      {broken && Math.abs(px - bx) > 6 && <T x={X0} y={CY + A * PX * 0.62 + 28} anchor="middle" color={C.red} size={8}>{tx(t, "figPhShm_off", "the block has left the shadow")}</T>}

      {/* x(t) graph */}
      <T x={GX0} y={GY - GH - 14} color={C.muted} size={8.5}>{tx(t, "figPhShm_graph", "position x over time")}</T>
      <line x1={GX0} y1={GY} x2={GX1} y2={GY} stroke={C.axis} />
      <line x1={GX0} y1={GY - GH} x2={GX0} y2={GY + GH} stroke={C.axis} />
      <T x={GX0 - 4} y={GY - A * GH + 3} anchor="end" color={C.muted} size={7.5}>+A</T>
      <T x={GX0 - 4} y={GY + A * GH + 3} anchor="end" color={C.muted} size={7.5}>−A</T>
      <line x1={GX0} y1={GY - A * GH} x2={GX1} y2={GY - A * GH} stroke={C.grid} strokeDasharray="2 4" />
      <line x1={GX0} y1={GY + A * GH} x2={GX1} y2={GY + A * GH} stroke={C.grid} strokeDasharray="2 4" />
      {broken && <path d={curve(τ => A * Math.cos(omega * τ))} fill="none" stroke={C.amber} strokeDasharray="4 3" opacity={0.7} />}
      <path d={curve(τ => xAt(τ, A, k, m, broken))} fill="none" stroke={C.sky} strokeWidth={1.8} />
      <circle cx={headX} cy={GY - x * GH} r={3.5} fill={C.sky} />
      <T x={GX1} y={GY + GH + 14} anchor="end" color={C.muted} size={7.5}>{tx(t, "figPhShm_last", "last 6 s")}</T>

      {/* energy bar */}
      <T x={GX0} y={236} color={C.muted} size={8.5}>{tx(t, "figPhShm_energy", "energy")}</T>
      <rect x={GX0} y={244} width={(K / E) * BAR} height={14} fill={C.green} opacity={0.85} />
      <rect x={GX0 + (K / E) * BAR} y={244} width={(U / E) * BAR} height={14} fill={C.sky} opacity={0.85} />
      <rect x={GX0} y={244} width={BAR} height={14} fill="none" stroke={C.axis} />
      <T x={GX0} y={272} color={C.green} size={8}>{`${tx(t, "figPhShm_K", "kinetic")} ${f2(K, 2)} J`}</T>
      <T x={GX0 + BAR} y={272} anchor="end" color={C.sky} size={8}>{`${broken ? tx(t, "figPhShm_Ub", "stored") : tx(t, "figPhShm_U", "spring ½kx²")} ${f2(U, 2)} J`}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhShm_title", "A mass on a spring")}
      head={<Btn active={broken} onClick={() => restart(() => setBroken(v => !v))}>{tx(t, "figPhShm_broken", "break it: constant-size pull")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhShm_k", "spring stiffness k")} value={k} min={2} max={50} step={1} onChange={v => restart(() => setK(v))} fmt={v => `${v} N/m`} />
          <Slider label={tx(t, "figPhShm_m", "mass m")} value={m} min={0.2} max={5} step={0.1} onChange={v => restart(() => setM(v))} fmt={v => `${f2(v, 1)} kg`} />
          <Slider label={tx(t, "figPhShm_A", "amplitude A")} value={A} min={0.1} max={1} step={0.05} onChange={v => restart(() => setA(v))} fmt={v => `${f2(v, 2)} m`} />
        </Sliders>
        <Row>
          <Readout color={C.amber}>{`ω = √(k/m) = ${f2(omega, 2)} rad/s`}</Readout>
          <Readout color={broken ? C.red : C.sky}>{`${tx(t, "figPhShm_T", "period")} T = ${f2(period, 2)} s`}</Readout>
          <Readout>{`x = ${f2(x, 2)} m`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhShm_note", "Drag the block to the right and press play. The spring pulls it back, it overshoots, and the motion repeats for ever since nothing takes energy out. Watch the amber point going round the circle: the block always sits exactly above it, so its position is the shadow A cos ωt of steady circular motion. Change the amplitude: the period does not change. A stiffer spring makes it faster, a heavier block slower, as T = 2π√(m/k) says. The energy bar trades kinetic for spring energy and back, with the total fixed. Then break it: with a pull of the same size everywhere the block still swings, but a bigger amplitude now takes longer, the period readout changes with A, and the block leaves the circle's shadow. Only a restoring force proportional to x gives a period that ignores the amplitude.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => { setPlaying(false); setTime(0); }}
          onStep={() => { setPlaying(false); setTime(v => +(v + 0.05).toFixed(3)); }}
          onBack={() => { setPlaying(false); setTime(v => Math.max(0, +(v - 0.05).toFixed(3))); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
