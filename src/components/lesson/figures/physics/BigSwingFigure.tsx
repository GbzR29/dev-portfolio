"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Readout, Row, Slider, C, T, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// A 1 m pendulum released from rest at the angle θ₀ (slider). The pink bob
// follows the true equation θ'' = −(g/L) sin θ, integrated with RK4 in 1 ms
// steps. The dashed amber bob follows the small-angle answer θ₀ cos(ω₀ t),
// ω₀ = √(g/L), which assumes sin θ ≈ θ. For small swings they stay together;
// for big ones the real pendulum falls behind, because sin θ < θ means a
// weaker pull back than the small-angle model assumes.
// On the right, the exact period divided by the small-angle one,
// T/T₀ = 1 / AGM(1, cos(θ₀/2)) (the arithmetic-geometric mean gives the
// elliptic integral exactly), against the amplitude, with a marker at θ₀.

const W = 560, H = 300;
const G = 9.81, L = 1;
const PX = 40, PY = 140, LP = 110;                    // pivot x − 110 and y (px), rod length (px)
const GX0 = 330, GX1 = 545, GY0 = 250, GY1 = 60;     // graph box: x for 0°…180°, y for T/T₀ = 1…3
const STEP = 0.001;

function agm(a: number, b: number) {
  for (let i = 0; i < 30 && Math.abs(a - b) > 1e-12; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return a;
}
const ratio = (th0: number) => 1 / agm(1, Math.cos(th0 / 2));

/** One RK4 step of θ'' = −(g/L) sin θ. */
function rk4(th: number, w: number, h: number): [number, number] {
  const f = (x: number) => -(G / L) * Math.sin(x);
  const k1t = w, k1w = f(th);
  const k2t = w + (h / 2) * k1w, k2w = f(th + (h / 2) * k1t);
  const k3t = w + (h / 2) * k2w, k3w = f(th + (h / 2) * k2t);
  const k4t = w + h * k3w, k4w = f(th + h * k3t);
  return [th + (h / 6) * (k1t + 2 * k2t + 2 * k3t + k4t), w + (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w)];
}

export function BigSwingFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(20);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const state = useRef<[number, number]>([(20 * Math.PI) / 180, 0]);
  const vis = useVisible<HTMLDivElement>();

  const th0 = (deg * Math.PI) / 180;
  const w0 = Math.sqrt(G / L), T0 = (2 * Math.PI) / w0, Tx = T0 * ratio(th0);

  const advance = (dt: number) => {
    let [th, w] = state.current;
    const n = Math.round(dt / STEP);
    for (let i = 0; i < n; i++) [th, w] = rk4(th, w, STEP);
    state.current = [th, w];
    setTime(v => +(v + n * STEP).toFixed(3));
  };
  useFrame(playing && vis.on, dt => advance(Math.max(STEP, dt)));
  const reset = (d = deg) => { setPlaying(false); setTime(0); state.current = [(d * Math.PI) / 180, 0]; };

  const th = state.current[0], ghost = th0 * Math.cos(w0 * time);
  const bob = (a: number) => ({ x: PX + 110 + LP * Math.sin(a), y: PY + LP * Math.cos(a) });
  const pv = { x: PX + 110, y: PY };
  const real = bob(th), sa = bob(ghost);

  // graph of T/T₀ against amplitude
  const gx = (d: number) => GX0 + (d / 180) * (GX1 - GX0);
  const gy = (r: number) => GY0 - ((Math.min(r, 3) - 1) / 2) * (GY0 - GY1);
  let curve = "";
  for (let d = 0; d <= 176; d += 2) curve += `${d ? "L" : "M"}${gx(d).toFixed(1)},${gy(ratio((d * Math.PI) / 180)).toFixed(1)}`;

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <path d={`M${pv.x - 9},${PY - 14} L${pv.x + 9},${PY - 14} L${pv.x},${PY} Z`} fill={C.axis} />
      <path d={`M${bob(-th0).x},${bob(-th0).y} A${LP},${LP} 0 ${th0 > Math.PI / 2 ? 1 : 0} 0 ${bob(th0).x},${bob(th0).y}`} fill="none" stroke={C.grid} strokeDasharray="3 4" />
      <line x1={pv.x} y1={pv.y} x2={pv.x} y2={pv.y + LP + 20} stroke={C.grid} strokeDasharray="2 4" />
      <line x1={pv.x} y1={pv.y} x2={sa.x} y2={sa.y} stroke={C.amber} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
      <circle cx={sa.x} cy={sa.y} r={11} fill="none" stroke={C.amber} strokeWidth={1.5} strokeDasharray="3 2" />
      <line x1={pv.x} y1={pv.y} x2={real.x} y2={real.y} stroke={C.fg} strokeWidth={1.6} />
      <circle cx={real.x} cy={real.y} r={10} fill={C.pink} />
      <circle cx={pv.x} cy={pv.y} r={3} fill={C.fg} />
      <T x={14} y={H - 20} color={C.pink} size={8.5}>{tx(t, "figPhSwing_real", "real pendulum: θ'' = −(g/L) sin θ")}</T>
      <T x={14} y={H - 6} color={C.amber} size={8.5}>{tx(t, "figPhSwing_small", "small-angle model: θ₀ cos(ω₀t)")}</T>

      <T x={GX0} y={GY1 - 18} color={C.muted} size={8.5}>{tx(t, "figPhSwing_graph", "period ÷ small-angle period")}</T>
      <line x1={GX0} y1={GY0} x2={GX1} y2={GY0} stroke={C.axis} />
      <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke={C.axis} />
      {[1, 1.5, 2, 2.5, 3].map(r => <g key={r}>
        <line x1={GX0} y1={gy(r)} x2={GX1} y2={gy(r)} stroke={C.grid} strokeDasharray="2 4" />
        <T x={GX0 - 4} y={gy(r) + 3} anchor="end" color={C.muted} size={7.5}>{`${r}×`}</T>
      </g>)}
      {[0, 45, 90, 135, 180].map(d => <T key={d} x={gx(d)} y={GY0 + 13} anchor="middle" color={C.muted} size={7.5}>{`${d}°`}</T>)}
      <T x={GX1} y={GY0 + 26} anchor="end" color={C.muted} size={7.5}>{tx(t, "figPhSwing_amp", "amplitude θ₀")}</T>
      <path d={curve} fill="none" stroke={C.pink} strokeWidth={1.8} />
      <line x1={gx(deg)} y1={GY0} x2={gx(deg)} y2={gy(ratio(th0))} stroke={C.pink} strokeDasharray="2 3" />
      <circle cx={gx(deg)} cy={gy(ratio(th0))} r={4.5} fill={C.pink} />
      <T x={gx(deg) + (deg > 120 ? -8 : 8)} y={gy(ratio(th0)) - 8} anchor={deg > 120 ? "end" : "start"} color={C.pink} size={8.5} bold>{`${f2(ratio(th0), 3)}×`}</T>
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhSwing_title", "Big swings take longer")}
      controls={<>
        <Slider label={tx(t, "figPhSwing_th0", "release angle θ₀")} value={deg} min={5} max={175} step={1} onChange={v => { setDeg(v); reset(v); }} fmt={v => `${v}°`} width="w-48" />
        <Row>
          <Readout color={C.amber}>{`T₀ = 2π√(L/g) = ${f2(T0, 3)} s`}</Readout>
          <Readout color={C.pink}>{`${tx(t, "figPhSwing_exact", "true period")} T = ${f2(Tx, 3)} s`}</Readout>
          <Readout>{`${tx(t, "figPhSwing_swings", "swings")}: ${f2(time / T0, 1)}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhSwing_note", "Start at 20° and press play: the real pendulum and the small-angle model swing together, since the true period is only 0.8% longer. Raise the angle to 60°: the model gains on the real bob, a little each swing (7% per period). At 120° the real period is 37% longer, and near 175° the pendulum hangs almost upside down, barely moving at first, and takes almost three times as long. The graph on the right shows the whole story: flat near zero, which is why clocks use small swings, and climbing steeply as θ₀ nears 180°, where the bob balances on top and never falls.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => reset()}
          onStep={() => { setPlaying(false); advance(0.05); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
