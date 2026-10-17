"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, C, T, Handle, plot, fnPath, useDrag, useFrame, useVisible, clamp, f2, type Plot } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// One car, three linked graphs. The reader drags the acceleration of four
// 2.5-second stages up or down on the bottom graph a(t). The velocity v(t) is
// built from it (each stage adds a·Δt), and the position x(t) from v (each
// instant adds v·dt). Playing moves a time cursor through all three graphs
// and drives the car on the road at the top: the area under v so far is
// shaded and equals the distance moved; the tangent to x has slope v.
// "Break it": the tempting wrong rule x = v·t is drawn as a dashed curve; it
// only agrees with the real x while the speed never changed.

const W = 560, ROAD = 56, PH = 104, GAP = 8;
const SEG = 2.5, N = 4, TMAX = SEG * N;
const L = 38, R = 536;                               // plot area inside the svg
type Preset = "trip" | "steady" | "back";
const PRESETS: Record<Preset, { a: number[]; v0: number }> = {
  trip: { a: [2, 0, 0, -2], v0: 0 },
  steady: { a: [1, 1, 1, 1], v0: 0 },
  back: { a: [0, -2, -2, 0], v0: 6 },
};

/** Velocity and position at time t for piecewise-constant acceleration. */
function stateAt(acc: number[], v0: number, t: number) {
  let v = v0, x = 0;
  for (let i = 0; i < N; i++) {
    const t0 = i * SEG, dt = clamp(t - t0, 0, SEG);
    if (dt <= 0) break;
    x += v * dt + 0.5 * acc[i] * dt * dt;
    v += acc[i] * dt;
  }
  return { v, x, a: acc[Math.min(N - 1, Math.floor(t / SEG))] };
}

/** A pleasant grid step for a range. */
function niceStep(span: number) {
  const raw = span / 4, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/** A panel's plot over t ∈ [0, TMAX] with the given y range, placed inside the plot area. */
const panel = (y0: number, y1: number): Plot => plot({ W: R - L, H: PH, x0: 0, x1: TMAX, y0, y1 });

/** Value lines every yStep (labelled on the left), a time line at each stage boundary, and the zero line. */
function PanelGrid({ p, yStep }: { p: Plot; yStep: number }) {
  const ys: number[] = [];
  for (let y = Math.ceil(p.y0 / yStep) * yStep; y <= p.y1 + 1e-9; y += yStep) ys.push(+y.toFixed(6));
  return (
    <g pointerEvents="none">
      <rect x={0} y={0} width={p.W} height={PH} fill="none" stroke={C.grid} />
      {ys.map(y => <g key={y}>
        <line x1={0} x2={p.W} y1={p.Y(y)} y2={p.Y(y)} stroke={y === 0 ? C.axis : C.grid} strokeWidth={y === 0 ? 1.2 : 0.6} />
        <text x={-4} y={p.Y(y) + 3} fontSize={8} fill={C.axis} textAnchor="end" fontFamily="monospace">{+y.toFixed(2)}</text>
      </g>)}
      {[1, 2, 3].map(i => <line key={i} x1={p.X(i * SEG)} x2={p.X(i * SEG)} y1={0} y2={PH} stroke={C.grid} strokeWidth={0.6} />)}
    </g>
  );
}

const range = (lo: number, hi: number): [number, number] => {
  const span = Math.max(hi - lo, 1), pad = span * 0.12;
  return [Math.min(lo, 0) - pad, Math.max(hi, 0) + pad];
};

const n2 = (v: number) => f2(v).replace("-", "−");

export function MotionGraphsFigure({ t }: { t?: TrackTranslations }) {
  const [acc, setAcc] = useState<number[]>(PRESETS.trip.a);
  const [v0, setV0] = useState(PRESETS.trip.v0);
  const [time, setTime] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => {
    if (time >= TMAX) { setPlaying(false); return; }
    setTime(v => Math.min(TMAX, v + dt));
  });

  // Ranges of the three graphs over the whole run
  const samples = Array.from({ length: 101 }, (_, i) => stateAt(acc, v0, (i / 100) * TMAX));
  const [xLo, xHi] = range(Math.min(...samples.map(s => s.x)), Math.max(...samples.map(s => s.x)));
  const [vLo, vHi] = range(Math.min(...samples.map(s => s.v)), Math.max(...samples.map(s => s.v)));
  const px = panel(xLo, xHi), pv = panel(vLo, vHi), pa = panel(-3.4, 3.4);
  const top = { x: ROAD + GAP, v: ROAD + GAP * 2 + PH, a: ROAD + GAP * 3 + PH * 2 };
  const H = top.a + PH + 4;

  const now = stateAt(acc, v0, time);
  const stop = () => setPlaying(false);

  // Drag a stage's acceleration on the a(t) panel
  const drag = useDrag<number>(
    p => (p.y < top.a || p.x < L || p.x > R ? null : Math.min(N - 1, Math.floor(pa.inv({ x: p.x - L, y: 0 }).x / SEG))),
    (i, p) => {
      stop();
      const a = clamp(Math.round(pa.inv({ x: 0, y: p.y - top.a }).y * 2) / 2, -3, 3);
      setAcc(prev => prev.map((v, k) => (k === i ? a : v)));
    },
  );

  // ── Road with the car
  const sx = (x: number) => L + ((x - xLo) / (xHi - xLo)) * (R - L);
  const carX = sx(now.x);
  const road = (
    <g>
      <line x1={L} x2={R} y1={ROAD - 14} y2={ROAD - 14} stroke={C.axis} strokeWidth={2} />
      {xLo <= 0 && <line x1={sx(0)} x2={sx(0)} y1={ROAD - 20} y2={ROAD - 8} stroke={C.muted} />}
      <T x={sx(0)} y={ROAD - 1} color={C.muted} anchor="middle">x = 0</T>
      <g transform={`translate(${carX} ${ROAD - 16})`}>
        <rect x={-15} y={-14} width={30} height={10} rx={3} fill={C.sky} />
        <rect x={-8} y={-20} width={14} height={7} rx={2} fill={C.sky} opacity={0.75} />
        <circle cx={-9} cy={-3} r={3.2} fill={C.fg} />
        <circle cx={9} cy={-3} r={3.2} fill={C.fg} />
      </g>
      {Math.abs(now.v) > 0.05 && (() => {
        const dir = Math.sign(now.v), len = Math.min(60, 6 + Math.abs(now.v) * 5);
        const y = ROAD - 44;
        return <>
          <line x1={carX} x2={carX + dir * len} y1={y} y2={y} stroke={C.green} strokeWidth={2} />
          <polygon fill={C.green} points={`${carX + dir * (len + 6)},${y} ${carX + dir * len},${y - 4} ${carX + dir * len},${y + 4}`} />
        </>;
      })()}
      <T x={6} y={14} color={C.muted}>{`t = ${f2(time, 1)} s`}</T>
    </g>
  );

  // ── The three panels
  const cursor = (p: Plot) => <line x1={p.X(time)} x2={p.X(time)} y1={0} y2={PH} stroke={C.fg} strokeWidth={1} strokeDasharray="3 3" />;

  // area under v from 0 to the cursor, split into positive and negative parts
  const area = (sign: 1 | -1) => {
    let d = `M${pv.X(0)},${pv.Y(0)}`;
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const tt = (time * i) / n, v = stateAt(acc, v0, tt).v;
      d += `L${pv.X(tt).toFixed(2)},${pv.Y(sign > 0 ? Math.max(0, v) : Math.min(0, v)).toFixed(2)}`;
    }
    return d + `L${pv.X(time)},${pv.Y(0)}Z`;
  };
  const slopeLen = 1.2;
  const view = (
    <svg ref={drag.ref} {...drag.handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {road}

      <g transform={`translate(${L} ${top.x})`}>
        <PanelGrid p={px} yStep={niceStep(xHi - xLo)} />
        {wrong && <path d={fnPath(px, tt => clamp(stateAt(acc, v0, tt).v * tt, xLo, xHi), 0, TMAX)} fill="none" stroke={C.red} strokeWidth={1.8} strokeDasharray="6 4" />}
        <path d={fnPath(px, tt => stateAt(acc, v0, tt).x, 0, TMAX)} fill="none" stroke={C.sky} strokeWidth={2.2} />
        <line x1={px.X(time - slopeLen)} y1={px.Y(now.x - now.v * slopeLen)} x2={px.X(time + slopeLen)} y2={px.Y(now.x + now.v * slopeLen)} stroke={C.green} strokeWidth={1.6} />
        {cursor(px)}
        <circle cx={px.X(time)} cy={px.Y(now.x)} r={4} fill={C.sky} />
        <T x={5} y={12} color={C.sky} bold>x (m)</T>
        <T x={R - L - 5} y={PH - 6} color={C.green} anchor="end">{tx(t, "figPhMot_slope", "green line: slope = v")}</T>
      </g>

      <g transform={`translate(${L} ${top.v})`}>
        <path d={area(1)} fill={C.green} opacity={0.18} />
        <path d={area(-1)} fill={C.red} opacity={0.18} />
        <PanelGrid p={pv} yStep={niceStep(vHi - vLo)} />
        <path d={fnPath(pv, tt => stateAt(acc, v0, tt).v, 0, TMAX)} fill="none" stroke={C.green} strokeWidth={2.2} />
        {cursor(pv)}
        <circle cx={pv.X(time)} cy={pv.Y(now.v)} r={4} fill={C.green} />
        <T x={5} y={12} color={C.green} bold>v (m/s)</T>
        <T x={R - L - 5} y={PH - 6} color={C.muted} anchor="end">{tx(t, "figPhMot_area", "shaded area = distance moved")}</T>
      </g>

      <g transform={`translate(${L} ${top.a})`}>
        <PanelGrid p={pa} yStep={1} />
        {acc.map((a, i) => {
          const x0 = pa.X(i * SEG), x1 = pa.X((i + 1) * SEG);
          const col = a > 0 ? C.amber : a < 0 ? C.purple : C.muted;
          return (
            <g key={i}>
              <rect x={x0 + 2} width={x1 - x0 - 4} y={Math.min(pa.Y(a), pa.Y(0))} height={Math.abs(pa.Y(a) - pa.Y(0))} fill={col} opacity={0.22} />
              <line x1={x0 + 2} x2={x1 - 2} y1={pa.Y(a)} y2={pa.Y(a)} stroke={col} strokeWidth={2.4} />
              <Handle x={(x0 + x1) / 2} y={pa.Y(a)} color={col} active={drag.dragging === i} />
              <T x={(x0 + x1) / 2} y={a >= 0 ? pa.Y(a) + 16 : pa.Y(a) - 9} color={col} anchor="middle" bold>{n2(a)}</T>
            </g>
          );
        })}
        {cursor(pa)}
        <T x={5} y={12} color={C.amber} bold>a (m/s²)</T>
        {[2.5, 5, 7.5, 10].map(s => <T key={s} x={pa.X(s)} y={PH - 3} anchor="middle" color={C.axis} size={8.5}>{`${s}s`}</T>)}
      </g>
    </svg>
  );

  const preset = (k: Preset) => { stop(); setAcc(PRESETS[k].a); setV0(PRESETS[k].v0); setTime(0); };
  const wrongNow = now.v * time;

  return (
    <Figure title={tx(t, "figPhMot_title", "Position, velocity, acceleration")}
      head={<>
        <Btn onClick={() => preset("trip")}>{tx(t, "figPhMot_pTrip", "go, cruise, brake")}</Btn>
        <Btn onClick={() => preset("steady")}>{tx(t, "figPhMot_pSteady", "steady speeding up")}</Btn>
        <Btn onClick={() => preset("back")}>{tx(t, "figPhMot_pBack", "turn back")}</Btn>
      </>}
      controls={<>
        <Row>
          <div className="w-full sm:w-80"><Slider label={tx(t, "figPhMot_v0", "start speed v₀")} value={v0} min={-4} max={8} step={0.5} onChange={v => { stop(); setV0(v); }} fmt={v => `${n2(v)} m/s`} width="w-28" /></div>
          <Btn active={wrong} onClick={() => setWrong(w => !w)}>{tx(t, "figPhMot_wrong", "show the wrong rule x = v·t")}</Btn>
        </Row>
        <Row>
          <Readout color={C.sky}>{`x = ${n2(now.x)} m`}</Readout>
          <Readout color={C.green}>{`v = ${n2(now.v)} m/s`}</Readout>
          <Readout color={C.amber}>{`a = ${n2(now.a)} m/s²`}</Readout>
          {wrong && <Readout color={C.red}>{`v·t = ${n2(wrongNow)} m (${Math.abs(wrongNow - now.x) < 0.05 ? tx(t, "figPhMot_agree", "agrees") : tx(t, "figPhMot_off", "off by") + " " + n2(Math.abs(wrongNow - now.x)) + " m"})`}</Readout>}
        </Row>
      </>}
      note={tx(t, "figPhMot_note", "Drag the four handles on the bottom graph to set the acceleration of each 2.5 s stage, then press play. The middle graph is the velocity: it climbs while a is positive, falls while a is negative, and stays level while a is zero; its slope is a. The top graph is the position: its slope (the green line) is v, so it is steep when the car is fast and flat when the car stops. The shaded area under v up to the cursor equals the distance moved; red area counts backwards. Turn on the wrong rule to see why x = v·t fails as soon as the speed changes.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing}
          onPlay={() => { if (time >= TMAX) setTime(0); setPlaying(p => !p); }}
          onStep={() => { stop(); setTime(v => Math.min(TMAX, Math.floor(v * 2 + 1e-6) / 2 + 0.5)); }}
          onBack={() => { stop(); setTime(v => Math.max(0, Math.ceil(v * 2 - 1e-6) / 2 - 0.5)); }}
          onReset={() => { stop(); setTime(0); }}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
