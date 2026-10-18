"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// The block and spring again (k = 20 N/m, m = 1 kg, so ω₀ = 4.47 rad/s), now
// with a damper: a piston in oil that pushes against the motion with
// F = −b v. The block starts at rest at x = A and the graph below shows the
// whole of x(t) for 6 s, with a dot riding along it during playback.
// The exact solutions are used for all three regimes:
//   underdamped (b < 2√(km)): x = A e^(−γt) (cos ω_d t + (γ/ω_d) sin ω_d t)
//   critical     (b = 2√(km)): x = A e^(−γt) (1 + γ t)
//   overdamped   (b > 2√(km)): x = A (r₂ e^(r₁t) − r₁ e^(r₂t)) / (r₂ − r₁)
// with γ = b / 2m, ω_d = √(ω₀² − γ²), r = −γ ± √(γ² − ω₀²).
// The dashed envelope ±A e^(−γt) shows the shrinking amplitude; the faint
// grey curve is the critically damped motion, always there for comparison.
// The settling time is when |x| last exceeds 2% of A.

const W = 560, H = 300;
const K = 20, M = 1, W0 = Math.sqrt(K / M), BC = 2 * Math.sqrt(K * M), A = 1;
const WALL = 22, X0 = 170, PX = 90, BY = 52;
const GX0 = 44, GX1 = 546, GY = 196, GH = 72, SPAN = 6;

function xAt(time: number, b: number) {
  const g = b / (2 * M);
  if (Math.abs(b - BC) < 1e-6) return A * Math.exp(-g * time) * (1 + g * time);
  if (b < BC) {
    const wd = Math.sqrt(W0 * W0 - g * g);
    return A * Math.exp(-g * time) * (Math.cos(wd * time) + (g / wd) * Math.sin(wd * time));
  }
  const s = Math.sqrt(g * g - W0 * W0), r1 = -g + s, r2 = -g - s;
  return (A * (r2 * Math.exp(r1 * time) - r1 * Math.exp(r2 * time))) / (r2 - r1);
}

/** Last moment |x| is above 2% of A, sampled every 5 ms up to 20 s. */
function settle(b: number) {
  let last = 0;
  for (let s = 0; s <= 20; s += 0.005) if (Math.abs(xAt(s, b)) > 0.02 * A) last = s;
  return last;
}

export function DampingFigure({ t }: { t?: TrackTranslations }) {
  const [b, setB] = useState(1);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const crit = Math.abs(b - BC) < 0.05;
  const bb = crit ? BC : b;
  const g = bb / (2 * M);
  const x = xAt(time, bb), ts = settle(bb);
  const v = (xAt(time + 1e-4, bb) - xAt(Math.max(0, time - 1e-4), bb)) / (time > 1e-4 ? 2e-4 : 1e-4);
  const energy = (K * x * x + M * v * v) / (K * A * A);
  const regime = crit ? "crit" : bb < BC ? "under" : "over";
  const regimeText = {
    under: tx(t, "figPhDamp_under", "underdamped: it oscillates while the swings shrink"),
    crit: tx(t, "figPhDamp_crit", "critically damped: the fastest return with no overshoot"),
    over: tx(t, "figPhDamp_over", "overdamped: it creeps back without oscillating"),
  }[regime];
  const regimeColor = { under: C.sky, crit: C.green, over: C.orange }[regime];

  useFrame(playing && vis.on, dt => {
    if (time >= SPAN) { setPlaying(false); return; }
    setTime(v => Math.min(SPAN, v + dt));
  });
  const play = () => { if (time >= SPAN) setTime(0); setPlaying(p => !p); };

  const gx = (s: number) => GX0 + (s / SPAN) * (GX1 - GX0);
  const gy = (v: number) => GY - v * GH;
  const path = (f: (s: number) => number) => {
    let d = "";
    for (let i = 0; i <= 400; i++) { const s = (SPAN * i) / 400; d += `${i ? "L" : "M"}${gx(s).toFixed(1)},${gy(f(s)).toFixed(1)}`; }
    return d;
  };

  const bx = X0 + x * PX;
  const spring = () => {
    const x1 = bx - 20, n = 12, seg = (x1 - WALL - 16) / n, y = BY - 9;
    let d = `M${WALL},${y} l8,0`;
    for (let i = 0; i < n; i++) d += ` L${WALL + 8 + seg * (i + 0.5)},${y + (i % 2 ? 6 : -6)}`;
    return d + ` L${x1 - 8},${y} L${x1},${y}`;
  };
  // the damper: a cylinder fixed to the wall, a piston rod fixed to the block
  const cyl = 70, py = BY + 10;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={WALL} y1={BY - 26} x2={WALL} y2={BY + 22} stroke={C.fg} strokeWidth={2} />
      <line x1={WALL} y1={BY + 19} x2={300} y2={BY + 19} stroke={C.axis} />
      <line x1={X0} y1={BY + 19} x2={X0} y2={BY + 26} stroke={C.muted} />
      <T x={X0} y={BY + 36} anchor="middle" color={C.muted} size={8}>x = 0</T>
      <path d={spring()} fill="none" stroke={C.muted} strokeWidth={1.4} />
      <line x1={WALL} y1={py} x2={WALL + 10} y2={py} stroke={C.purple} strokeWidth={1.5} />
      <path d={`M${WALL + 10 + cyl},${py - 6} L${WALL + 10},${py - 6} L${WALL + 10},${py + 6} L${WALL + 10 + cyl},${py + 6}`} fill={C.purple} fillOpacity={Math.min(0.5, 0.06 + b / 30)} stroke={C.purple} strokeWidth={1.5} />
      <line x1={Math.min(bx - 20, WALL + 10 + cyl - 6)} y1={py} x2={bx - 20} y2={py} stroke={C.purple} strokeWidth={1.5} />
      <line x1={Math.min(bx - 26, WALL + 4 + cyl)} y1={py - 5} x2={Math.min(bx - 26, WALL + 4 + cyl)} y2={py + 5} stroke={C.purple} strokeWidth={3} />
      <rect x={bx - 20} y={BY - 17} width={40} height={34} rx={3} fill={C.sky} opacity={0.9} />
      <T x={330} y={BY - 6} color={C.purple} size={8.5}>{tx(t, "figPhDamp_damper", "damper: F = −b v")}</T>
      <T x={GX0 + 8} y={GY - GH - 6} color={regimeColor} size={8} bold>{regimeText}</T>

      <line x1={GX0} y1={GY} x2={GX1} y2={GY} stroke={C.axis} />
      <line x1={GX0} y1={GY - GH} x2={GX0} y2={GY + GH} stroke={C.axis} />
      <T x={GX0 - 4} y={gy(1) + 3} anchor="end" color={C.muted} size={7.5}>A</T>
      <T x={GX0 - 4} y={gy(-1) + 3} anchor="end" color={C.muted} size={7.5}>−A</T>
      {[1, 2, 3, 4, 5, 6].map(s => <T key={s} x={gx(s)} y={GY + GH + 12} anchor="middle" color={C.muted} size={7.5}>{`${s} s`}</T>)}
      <line x1={GX0} y1={gy(0.02)} x2={GX1} y2={gy(0.02)} stroke={C.grid} strokeDasharray="1 3" />
      <line x1={GX0} y1={gy(-0.02)} x2={GX1} y2={gy(-0.02)} stroke={C.grid} strokeDasharray="1 3" />
      {!crit && <path d={path(s => xAt(s, BC))} fill="none" stroke={C.muted} strokeWidth={1.2} opacity={0.35} />}
      {regime === "under" && b > 0 && <>
        <path d={path(s => A * Math.exp(-g * s))} fill="none" stroke={C.amber} strokeDasharray="4 3" opacity={0.8} />
        <path d={path(s => -A * Math.exp(-g * s))} fill="none" stroke={C.amber} strokeDasharray="4 3" opacity={0.8} />
        <T x={gx(0.35)} y={gy(Math.exp(-g * 0.35)) - 6} color={C.amber} size={8}>{"A e^(−γt)"}</T>
      </>}
      <path d={path(s => xAt(s, bb))} fill="none" stroke={regimeColor} strokeWidth={1.8} />
      {ts > 0 && ts <= SPAN && <>
        <line x1={gx(ts)} y1={GY - GH} x2={gx(ts)} y2={GY + GH} stroke={regimeColor} strokeDasharray="3 3" opacity={0.6} />
        <T x={gx(ts) + 4} y={GY - GH + 8} color={regimeColor} size={8}>{`${tx(t, "figPhDamp_settled", "settled")} ${f2(ts, 2)} s`}</T>
      </>}
      <circle cx={gx(time)} cy={gy(x)} r={4} fill={regimeColor} />
      {!crit && <T x={GX1} y={GY - GH - 6} anchor="end" color={C.muted} size={8}>{tx(t, "figPhDamp_ref", "grey: critical damping, for comparison")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhDamp_title", "Three ways to come to rest")}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhDamp_b", "damping b")} value={b} min={0} max={30} step={0.1} onChange={v => { setB(v); setTime(0); setPlaying(false); }} fmt={v => `${f2(v, 1)} kg/s`} />
        </Sliders>
        <Row>
          <Readout color={C.green}>{`b_crit = 2√(km) = ${f2(BC, 2)} kg/s`}</Readout>
          <Readout color={regimeColor}>{`γ = b/2m = ${f2(g, 2)} /s`}</Readout>
          {regime === "under" && <Readout color={C.sky}>{`ω_d = ${f2(Math.sqrt(W0 * W0 - g * g), 2)} rad/s`}</Readout>}
          {regime === "under" && b > 0 && <Readout>{`Q = ω₀/2γ = ${f2(W0 / (2 * g), 1)}`}</Readout>}
          <Readout color={regimeColor}>{`${tx(t, "figPhDamp_settled", "settled")} ${f2(ts, 2)} s`}</Readout>
          <Readout>{`${tx(t, "figPhDamp_left", "energy left")} ${f2(100 * energy, 0)}%`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhDamp_note", "With b = 0 there is no damper and the swings go on for ever. Raise b a little: the oscillation keeps almost the same period, but its size shrinks along the dashed curve A e^(−γt). Keep raising it and the swings die faster, until at b = 8.94 kg/s (green) the block returns without ever crossing zero: critical damping, the quickest way back. Go further and the block creeps home more and more slowly, held back by the thick oil: overdamped. The settling time shows the best choice is at or just below critical, which is what car suspensions and door closers aim for. The energy readout is the share of the starting energy still in the motion; the rest has warmed the oil.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={play} onReset={() => { setPlaying(false); setTime(0); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
