"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Readout, Row, Slider, Sliders, C, T, useFrame, useVisible, f2, clamp } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// The damped block and spring (k = 20 N/m, m = 1 kg, natural frequency
// ω₀ = 4.47 rad/s) now pushed by a periodic force F = F₀ cos ωt, F₀ = 2 N.
// The motion is integrated live (RK4, 2 ms steps) from rest, so you see the
// start-up transient die away and the steady swing take over; changing ω
// while it runs is like turning the knob of a real shaker.
// Left: the last 8 s of x(t) (sky) with the push (red, not to scale).
// Right: the steady-state amplitude
//   A(ω) = (F₀/m) / √((ω₀² − ω²)² + (2γω)²),   γ = b / 2m
// for the current damping, with the drive marked; the dot is the amplitude
// actually reached in the last few cycles, which climbs onto the curve.
// "break it: remove the damper" sets b = 0: at resonance nothing limits the
// growth and the amplitude climbs by the same amount every cycle.

const W = 560, H = 300;
const K = 20, M = 1, F0 = 2, W0 = Math.sqrt(K / M);
const WALL = 20, X0 = 165, PX = 42, BY = 46;
const TX0 = 22, TX1 = 300, TY = 190, TH = 64, SPAN = 8, TSCALE = 1.5;   // trace: px for 1.5 m = TH
const RX0 = 340, RX1 = 545, RY0 = 262, RY1 = 72, WMAX = 9, AMAX = 3;   // response graph
const STEP = 0.002;

const steady = (w: number, b: number) => (F0 / M) / Math.sqrt((W0 * W0 - w * w) ** 2 + ((b / M) * w) ** 2);

type Sample = { t: number; x: number; f: number };

export function ResonanceFigure({ t }: { t?: TrackTranslations }) {
  const [w, setW] = useState(3);
  const [b, setB] = useState(0.6);
  const [noDamp, setNoDamp] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [, setTick] = useState(0);
  const sim = useRef({ x: 0, v: 0, ph: 0, time: 0, hist: [] as Sample[] });
  const vis = useVisible<HTMLDivElement>();
  const bb = noDamp ? 0 : b;

  const advance = (dt: number) => {
    const s = sim.current, n = Math.max(1, Math.round(dt / STEP));
    const acc = (x: number, v: number, ph: number) => (F0 * Math.cos(ph) - bb * v - K * x) / M;
    for (let i = 0; i < n; i++) {
      const h = STEP, { x, v, ph } = s;
      const a1 = acc(x, v, ph);
      const a2 = acc(x + (h / 2) * v, v + (h / 2) * a1, ph + (w * h) / 2);
      const a3 = acc(x + (h / 2) * (v + (h / 2) * a1), v + (h / 2) * a2, ph + (w * h) / 2);
      const a4 = acc(x + h * (v + (h / 2) * a2), v + h * a3, ph + w * h);
      s.x = x + h * v + ((h * h) / 6) * (a1 + a2 + a3);
      s.v = v + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
      s.ph = ph + w * h;
      s.time += h;
      if (i % 5 === 0) s.hist.push({ t: s.time, x: s.x, f: Math.cos(s.ph) });
    }
    while (s.hist.length && s.hist[0].t < s.time - SPAN) s.hist.shift();
    setTick(v => v + 1);
  };
  useFrame(playing && vis.on, dt => advance(dt));
  const reset = () => { setPlaying(false); sim.current = { x: 0, v: 0, ph: 0, time: 0, hist: [] }; setTick(v => v + 1); };

  const s = sim.current;
  // amplitude reached: the largest |x| over the last three drive periods (or 3 s)
  const win = Math.max(3 * ((2 * Math.PI) / w), 3);
  const reached = s.hist.filter(p => p.t > s.time - win).reduce((m, p) => Math.max(m, Math.abs(p.x)), 0);
  const A = bb > 0 || Math.abs(w - W0) > 1e-3 ? steady(w, bb) : Infinity;
  const lag = (Math.atan2((bb / M) * w, W0 * W0 - w * w) * 180) / Math.PI;

  // ── drawing helpers
  const bx = X0 + clamp(s.x, -3.3, 3.3) * PX;
  const spring = () => {
    const x1 = bx - 16, n = 12, seg = (x1 - WALL - 12) / n;
    let d = `M${WALL},${BY} l6,0`;
    for (let i = 0; i < n; i++) d += ` L${WALL + 6 + seg * (i + 0.5)},${BY + (i % 2 ? 7 : -7)}`;
    return d + ` L${x1 - 6},${BY} L${x1},${BY}`;
  };
  const tx0 = Math.max(0, s.time - SPAN);
  const tX = (time: number) => TX0 + ((time - tx0) / SPAN) * (TX1 - TX0);
  const tY = (x: number) => TY - clamp(x / TSCALE, -1.1, 1.1) * TH;
  const trace = (f: (p: Sample) => number) => s.hist.map((p, i) => `${i ? "L" : "M"}${tX(p.t).toFixed(1)},${f(p).toFixed(1)}`).join("");
  const rX = (om: number) => RX0 + (om / WMAX) * (RX1 - RX0);
  const rY = (a: number) => RY0 - (Math.min(a, AMAX) / AMAX) * (RY0 - RY1);
  let curve = "";
  for (let i = 1; i <= 360; i++) { const om = (WMAX * i) / 360; curve += `${i > 1 ? "L" : "M"}${rX(om).toFixed(1)},${rY(steady(om, bb)).toFixed(1)}`; }
  const push = F0 * Math.cos(s.ph);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={WALL} y1={BY - 22} x2={WALL} y2={BY + 20} stroke={C.fg} strokeWidth={2} />
      <line x1={WALL} y1={BY + 17} x2={318} y2={BY + 17} stroke={C.axis} />
      <line x1={X0} y1={BY + 17} x2={X0} y2={BY + 23} stroke={C.muted} />
      <path d={spring()} fill="none" stroke={C.muted} strokeWidth={1.4} />
      <rect x={bx - 16} y={BY - 15} width={32} height={30} rx={3} fill={C.sky} opacity={0.9} />
      {Math.abs(push) > 0.05 && (() => {
        const len = push * 18, tip = bx + len, sg = Math.sign(len);
        return <g>
          <line x1={bx} y1={BY - 22} x2={tip - sg * 6} y2={BY - 22} stroke={C.red} strokeWidth={2} />
          <polygon points={`${tip},${BY - 22} ${tip - sg * 7},${BY - 26} ${tip - sg * 7},${BY - 18}`} fill={C.red} />
        </g>;
      })()}
      {Math.abs(s.x) > 3.3 && <T x={X0} y={BY + 34} anchor="middle" color={C.red} size={8}>{tx(t, "figPhRes_off", "off the scale")}</T>}

      <T x={TX0} y={TY - TH - 22} color={C.muted} size={8.5}>{tx(t, "figPhRes_trace", "position (sky) and push (red), last 8 s")}</T>
      <line x1={TX0} y1={TY} x2={TX1} y2={TY} stroke={C.axis} />
      <line x1={TX0} y1={TY - TH} x2={TX0} y2={TY + TH} stroke={C.axis} />
      <T x={TX0 + 3} y={TY - TH - 4} color={C.muted} size={7.5}>+1.5 m</T>
      <path d={trace(p => TY - p.f * TH * 0.35)} fill="none" stroke={C.red} strokeWidth={1} opacity={0.55} />
      <path d={trace(p => tY(p.x))} fill="none" stroke={C.sky} strokeWidth={1.7} />

      <T x={RX0} y={RY1 - 22} color={C.muted} size={8.5}>{tx(t, "figPhRes_curve", "steady amplitude against drive frequency")}</T>
      <line x1={RX0} y1={RY0} x2={RX1} y2={RY0} stroke={C.axis} />
      <line x1={RX0} y1={RY0} x2={RX0} y2={RY1} stroke={C.axis} />
      {[1, 2, 3].map(a => <g key={a}>
        <line x1={RX0} y1={rY(a)} x2={RX1} y2={rY(a)} stroke={C.grid} strokeDasharray="2 4" />
        <T x={RX0 - 4} y={rY(a) + 3} anchor="end" color={C.muted} size={7.5}>{`${a} m`}</T>
      </g>)}
      {[0, 3, 6, 9].map(om => <T key={om} x={rX(om)} y={RY0 + 12} anchor="middle" color={C.muted} size={7.5}>{`${om}`}</T>)}
      <T x={RX1} y={RY0 + 24} anchor="end" color={C.muted} size={7.5}>{tx(t, "figPhRes_wAxis", "ω (rad/s)")}</T>
      <line x1={rX(W0)} y1={RY0} x2={rX(W0)} y2={RY1} stroke={C.green} strokeDasharray="3 3" opacity={0.7} />
      <T x={rX(W0) + 3} y={RY1 + 8} color={C.green} size={8}>ω₀</T>
      <path d={curve} fill="none" stroke={C.purple} strokeWidth={1.6} />
      <line x1={rX(w)} y1={RY0} x2={rX(w)} y2={rY(A)} stroke={C.amber} strokeDasharray="2 3" />
      <circle cx={rX(w)} cy={rY(Math.min(reached, AMAX))} r={4.5} fill={C.amber} />
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhRes_title", "Push at the right rhythm")}
      head={<Btn active={noDamp} onClick={() => { setNoDamp(v => !v); reset(); }}>{tx(t, "figPhRes_broken", "break it: remove the damper")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhRes_w", "drive frequency ω")} value={w} min={0.5} max={WMAX} step={0.05} onChange={setW} fmt={v => `${f2(v, 2)} rad/s`} />
          <Slider label={tx(t, "figPhRes_b", "damping b")} value={b} min={0.1} max={6} step={0.1} onChange={v => { setB(v); }} fmt={v => `${f2(v, 1)} kg/s`} />
        </Sliders>
        <Row>
          <Readout color={C.green}>{`ω₀ = ${f2(W0, 2)} rad/s`}</Readout>
          <Readout color={C.purple}>{`${tx(t, "figPhRes_A", "steady A")} = ${A === Infinity ? "∞" : `${f2(A, 2)} m`}`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhRes_reached", "reached")} ${f2(reached, 2)} m`}</Readout>
          <Readout>{`${tx(t, "figPhRes_lag", "lag behind the push")} ${f2(lag, 0)}°`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhRes_note", "Press play with the drive at 3 rad/s: after a short, messy start the block settles into swinging at the drive's rhythm, not its own, with a small amplitude, almost in step with the push. Now slide ω slowly towards the green line ω₀ = 4.47 rad/s: the swing grows, and right at resonance it reaches about 0.75 m from a 2 N push that would stretch the spring by only 10 cm if held still. The block is then a quarter cycle behind the push (90°), so the push always points the way the block is moving and every cycle feeds it energy. Go past ω₀ and the amplitude collapses, with the block now swinging against the push (lag near 180°). More damping makes the peak lower and wider. Then break it: without the damper, at ω₀ the amplitude grows by the same amount each cycle with no limit; real structures break before that.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={reset}
          readout={`t = ${f2(s.time, 1)} s`} />
      </div>
    </Figure>
  );
}
