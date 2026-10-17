"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Two carts on a frictionless track run into each other. Masses, starting
// velocities and the coefficient of restitution e (1 = perfectly elastic,
// 0 = they stick) are sliders. Underneath, p(t) for each cart and for the
// pair: the two lines jump by equal and opposite amounts at the collision
// (the impulses), and the total stays flat. The purple mark is the centre of
// mass, which moves at constant velocity through the whole collision.
// "break it: each keeps its speed" replaces the real outcome with a naive
// guess (both simply bounce back at their old speeds): the total momentum
// jumps and the centre of mass changes velocity with nothing outside pushing.
// Closed form: positions are linear in t before and after the contact time.

const W = 560, H = 300;
const END = 6;                                        // run time (s)
const S = 28, X0 = W / 2, TY = 92;                    // px per metre, track centre, track y
const HALF = 0.5;                                     // half the cart length (m)
const GY0 = 150, GY1 = 278, GX0 = 52, GX1 = 540;      // graph box

/** Velocities after the collision: momentum conserved, separation speed = e × approach speed. */
export function afterCollision(m1: number, m2: number, v1: number, v2: number, e: number) {
  const p = m1 * v1 + m2 * v2, M = m1 + m2, rel = v1 - v2;
  return { u1: (p - m2 * e * rel) / M, u2: (p + m1 * e * rel) / M };
}

export function CollisionFigure({ t }: { t?: TrackTranslations }) {
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(1);
  const [v1, setV1] = useState(1.5);
  const [v2, setV2] = useState(-0.5);
  const [e, setE] = useState(1);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  useFrame(playing && vis.on, dt => {
    if (time >= END) { setPlaying(false); return; }
    setTime(v => Math.min(END, v + dt));
  });
  const stop = () => setPlaying(false);
  const changed = (f: () => void) => { stop(); f(); setTime(0); };
  const play = () => { if (time >= END) setTime(0); setPlaying(p => !p); };

  // ── the motion ──
  const x10 = -3, x20 = 3;
  const tc = v1 > v2 ? (x20 - x10 - 2 * HALF) / (v1 - v2) : Infinity;   // contact time
  const real = afterCollision(m1, m2, v1, v2, e);
  const u1 = broken ? -v1 : real.u1, u2 = broken ? -v2 : real.u2;
  const at = (tt: number) => {
    if (tt <= tc) return { x1: x10 + v1 * tt, x2: x20 + v2 * tt, w1: v1, w2: v2 };
    const d = tt - tc;
    return { x1: x10 + v1 * tc + u1 * d, x2: x20 + v2 * tc + u2 * d, w1: u1, w2: u2 };
  };
  const now = at(time);
  const M = m1 + m2;
  const xcm = (m1 * now.x1 + m2 * now.x2) / M;
  const p1 = m1 * now.w1, p2 = m2 * now.w2;
  const K = (m: number, v: number) => 0.5 * m * v * v;
  const kBefore = K(m1, v1) + K(m2, v2), kAfter = K(m1, u1) + K(m2, u2);
  const kNow = K(m1, now.w1) + K(m2, now.w2);
  const hit = time > tc;

  // ── p(t) graph ──
  const pts = [m1 * v1, m2 * v2, m1 * u1, m2 * u2, m1 * v1 + m2 * v2, m1 * u1 + m2 * u2];
  const pMax = Math.max(1, ...pts.map(Math.abs)) * 1.15;
  const gX = (tt: number) => GX0 + (tt / END) * (GX1 - GX0);
  const mid = (GY0 + GY1) / 2;
  const gY = (p: number) => mid - (p / pMax) * ((GY1 - GY0) / 2 - 4);
  /** A step line: `before` until the contact, `after` from then on, drawn up to `upto`. */
  const line = (before: number, after: number, upto: number) => {
    const knots: [number, number][] = tc < upto
      ? [[0, before], [tc, before], [tc, after], [upto, after]]
      : [[0, before], [upto, before]];
    return knots.map(([tt, p], i) => `${i ? "L" : "M"}${gX(tt).toFixed(1)},${gY(p).toFixed(1)}`).join("");
  };

  const sx = (x: number) => X0 + x * S;
  const cart = (x: number, m: number, color: string, label: string) => {
    const w = HALF * 2 * S, h = 14 + m * 4, X = sx(x);
    return <g>
      <rect x={X - w / 2} y={TY - 8 - h} width={w} height={h} rx={3} fill={color} opacity={0.85} />
      <T x={X} y={TY - 8 - h / 2 + 3} anchor="middle" color="#fff" size={9} bold>{label}</T>
      <T x={X} y={TY - 13 - h} anchor="middle" color={color} size={8.5}>{`${m} kg`}</T>
      <circle cx={X - w / 4} cy={TY - 4} r={4} fill={C.fg} opacity={0.65} />
      <circle cx={X + w / 4} cy={TY - 4} r={4} fill={C.fg} opacity={0.65} />
    </g>;
  };

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <line x1={0} x2={W} y1={TY} y2={TY} stroke={C.axis} strokeWidth={1.5} />
      {Array.from({ length: 21 }, (_, i) => i - 10).map(k => <g key={k}>
        <line x1={sx(k)} x2={sx(k)} y1={TY} y2={TY + (k % 5 === 0 ? 7 : 3)} stroke={C.axis} />
        {k % 5 === 0 && Math.abs(k) < 10 && <T x={sx(k)} y={TY + 16} anchor="middle" color={C.axis} size={8}>{`${k} m`}</T>}
      </g>)}
      {cart(now.x1, m1, C.sky, "1")}
      {cart(now.x2, m2, C.pink, "2")}
      <Vec a={{ x: sx(now.x1), y: TY - 52 }} b={{ x: sx(now.x1) + now.w1 * 18, y: TY - 52 }} color={C.sky} w={1.8} />
      <Vec a={{ x: sx(now.x2), y: TY - 52 }} b={{ x: sx(now.x2) + now.w2 * 18, y: TY - 52 }} color={C.pink} w={1.8} />
      <path d={`M${sx(xcm)},${TY + 22} l-5,8 h10 z`} fill={broken && hit ? C.red : C.purple} />
      <T x={sx(xcm)} y={TY + 42} anchor="middle" color={broken && hit ? C.red : C.purple} size={8}>{tx(t, "figPhCol_cm", "centre of mass")}</T>
      {/* p(t) */}
      <line x1={GX0} x2={GX0} y1={GY0} y2={GY1} stroke={C.axis} />
      <line x1={GX0} x2={GX1} y1={mid} y2={mid} stroke={C.axis} />
      {Array.from({ length: END + 1 }, (_, i) => <g key={i}>
        <line x1={gX(i)} x2={gX(i)} y1={mid} y2={mid + 3} stroke={C.axis} />
        <T x={gX(i)} y={mid + 12} anchor="middle" color={C.axis} size={8}>{i}</T>
      </g>)}
      <T x={GX0 - 6} y={GY0 + 6} anchor="end" color={C.axis} size={8}>p</T>
      <T x={GX1} y={mid - 5} anchor="end" color={C.axis} size={8}>t (s)</T>
      {time > 0 && <>
        <path d={line(m1 * v1, m1 * u1, time)} fill="none" stroke={C.sky} strokeWidth={2} />
        <path d={line(m2 * v2, m2 * u2, time)} fill="none" stroke={C.pink} strokeWidth={2} />
        <path d={line(m1 * v1 + m2 * v2, m1 * u1 + m2 * u2, time)} fill="none" stroke={broken ? C.red : C.purple} strokeWidth={2.2} strokeDasharray="5 3" />
      </>}
      <T x={12} y={18} color={C.muted} size={9}>{tx(t, "figPhCol_pLegend", "momentum p = m v:")}</T>
      <T x={12} y={31} color={C.sky} size={9}>{tx(t, "figPhCol_p1", "cart 1")}</T>
      <T x={12} y={44} color={C.pink} size={9}>{tx(t, "figPhCol_p2", "cart 2")}</T>
      <T x={12} y={57} color={broken ? C.red : C.purple} size={9}>{`- - ${tx(t, "figPhCol_ptot", "total")}`}</T>
      {tc < END && <line x1={gX(tc)} x2={gX(tc)} y1={GY0} y2={GY1} stroke={C.amber} strokeDasharray="2 3" opacity={0.7} />}
    </svg>
  );

  const lost = kBefore - kAfter;
  return (
    <Figure title={tx(t, "figPhCol_title", "Two carts collide")}
      head={<Btn active={broken} onClick={() => changed(() => setBroken(v => !v))}>{tx(t, "figPhCol_broken", "break it: each keeps its speed")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhCol_m1", "mass 1")} value={m1} min={0.5} max={5} step={0.5} onChange={v => changed(() => setM1(v))} fmt={v => `${v} kg`} />
          <Slider label={tx(t, "figPhCol_m2", "mass 2")} value={m2} min={0.5} max={5} step={0.5} onChange={v => changed(() => setM2(v))} fmt={v => `${v} kg`} />
          <Slider label={tx(t, "figPhCol_v1", "velocity 1")} value={v1} min={-2} max={3} step={0.25} onChange={v => changed(() => setV1(v))} fmt={v => `${f2(v, 2)} m/s`} />
          <Slider label={tx(t, "figPhCol_v2", "velocity 2")} value={v2} min={-3} max={2} step={0.25} onChange={v => changed(() => setV2(v))} fmt={v => `${f2(v, 2)} m/s`} />
          <Slider label={tx(t, "figPhCol_e", "bounciness e")} value={e} min={0} max={1} step={0.05} onChange={v => changed(() => setE(v))} fmt={v => f2(v, 2)} />
        </Sliders>
        <Row>
          <Readout color={C.sky}>{`p₁ = ${f2(p1, 2)}`}</Readout>
          <Readout color={C.pink}>{`p₂ = ${f2(p2, 2)}`}</Readout>
          <Readout color={broken && hit ? C.red : C.purple}>{`p₁ + p₂ = ${f2(p1 + p2, 2)} kg·m/s`}</Readout>
          <Readout color={C.green}>{`K = ${f2(kNow, 2)} J`}</Readout>
          {hit && !broken && lost > 0.005 && <Readout color={C.red}>{`${tx(t, "figPhCol_heat", "turned into heat")} ${f2(lost, 2)} J`}</Readout>}
          {tc === Infinity && <Readout color={C.muted}>{tx(t, "figPhCol_miss", "they never meet")}</Readout>}
        </Row>
      </>}
      note={tx(t, "figPhCol_note", "Press play. During the collision the blue and pink lines jump by the same amount in opposite directions: what cart 1 loses, cart 2 gains. The purple total never moves, and neither does the velocity of the centre of mass. With e = 1 no kinetic energy is lost; lower e and the carts separate more slowly, the difference becomes heat and sound; at e = 0 they stick together. Try equal masses with e = 1 and cart 2 at rest: cart 1 stops dead and cart 2 leaves with its speed, like a snooker ball. Then break it: if each cart simply bounced back at its old speed, the total would jump and the centre of mass would change speed with nothing pushing it.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={play}
          onStep={() => { stop(); setTime(v => Math.min(END, +(v + 0.1).toFixed(3))); }}
          onBack={() => { stop(); setTime(v => Math.max(0, +(v - 0.1).toFixed(3))); }}
          onReset={() => { stop(); setTime(0); }}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
