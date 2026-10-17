"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Two scenes for Newton's three laws.
//   • cart — a cart on a long track. A rod pushes it with force F for the first
//     PUSH_T seconds, then lets go. The v(t) graph underneath climbs with slope
//     F_net/m during the push (second law) and stays flat afterwards (first
//     law: no net force, no change of velocity). "break it: add friction"
//     brings back the everyday experience that misled Aristotle: the cart
//     slows down and stops by itself, and a heavy cart may not move at all.
//   • skaters — two skaters on ice push each other for PUSH_S seconds. The two
//     forces are equal and opposite (third law); the lighter skater gets the
//     bigger acceleration. "break it: unequal forces" shows a world without the
//     third law: the pair's centre of mass (purple mark) sets off by itself.
// Everything is computed in closed form from t, so stepping back is exact.

const W = 560, H = 300;
const G = 9.81, MU = 0.15;
const PUSH_T = 2, CART_END = 8;                       // cart: push time, run time (s)
const PUSH_S = 0.5, SKATE_END = 5;                    // skaters
const S = 20;                                         // cart scene: px per metre
const GY0 = 172, GY1 = 282, GX0 = 52, GX1 = 540;      // graph box

type Mode = "cart" | "skaters";

/** The cart at time t: position, velocity, net force and friction (closed form, piecewise). */
function cartAt(t: number, F: number, m: number, fric: boolean) {
  const fMax = fric ? MU * m * G : 0;
  const a1 = F > fMax ? (F - fMax) / m : 0;           // static friction holds the cart while F ≤ μmg
  const t1 = Math.min(t, PUSH_T);
  let x = 0.5 * a1 * t1 * t1, v = a1 * t1;
  let net = t < PUSH_T && a1 > 0 ? F - fMax : 0;
  let f = t < PUSH_T ? (a1 > 0 ? fMax : F) : 0;       // static friction equals F when nothing moves
  if (t > PUSH_T) {
    const tl = t - PUSH_T;
    if (fric && v > 0) {
      const dec = MU * G, tStop = v / dec, dt = Math.min(tl, tStop);
      x += v * dt - 0.5 * dec * dt * dt;
      if (tl < tStop) { net = -fMax; f = fMax; }
      v -= dec * dt;
    } else x += v * tl;
  }
  return { x, v: Math.max(0, v), a: net / m, net, f };
}

/** The skaters at time t: positions and velocities (A goes left, B goes right). */
function skatersAt(t: number, mA: number, mB: number, F: number, broken: boolean) {
  const FB = broken ? 1.6 * F : F;
  const aA = F / mA, aB = FB / mB;
  const t1 = Math.min(t, PUSH_S), tl = Math.max(0, t - PUSH_S);
  const vA = -aA * t1, vB = aB * t1;
  const xA = -0.6 - 0.5 * aA * t1 * t1 + vA * tl;
  const xB = 0.6 + 0.5 * aB * t1 * t1 + vB * tl;
  return { xA, xB, vA, vB, aA, aB, FB, pushing: t < PUSH_S };
}

export function NewtonCartFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("cart");
  const [F, setF] = useState(4);
  const [m, setM] = useState(2);
  const [fric, setFric] = useState(false);
  const [mA, setMA] = useState(50);
  const [mB, setMB] = useState(75);
  const [Fs, setFs] = useState(150);
  const [broken, setBroken] = useState(false);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const END = mode === "cart" ? CART_END : SKATE_END;
  useFrame(playing && vis.on, dt => {
    if (time >= END) { setPlaying(false); return; }
    setTime(v => Math.min(END, v + dt));
  });

  const stop = () => setPlaying(false);
  const changed = (f: () => void) => { stop(); f(); setTime(0); };
  const play = () => { if (time >= END) setTime(0); setPlaying(p => !p); };

  // ── graph helpers (shared) ──
  const gX = (tt: number) => GX0 + (tt / END) * (GX1 - GX0);
  const graphFrame = (label: string, push: number) => <>
    <rect x={GX0} y={GY0} width={gX(push) - GX0} height={GY1 - GY0} fill={C.blue} opacity={0.07} />
    <T x={GX0 + 4} y={GY0 + 10} color={C.blue} size={8.5}>{tx(t, "figPhNew_push", "push")}</T>
    <line x1={GX0} x2={GX0} y1={GY0} y2={GY1} stroke={C.axis} />
    {Array.from({ length: END + 1 }, (_, i) => <g key={i}>
      <line x1={gX(i)} x2={gX(i)} y1={GY1} y2={GY1 + 3} stroke={C.axis} />
      <T x={gX(i)} y={GY1 + 12} anchor="middle" color={C.axis} size={8}>{i}</T>
    </g>)}
    <T x={(gX(END - 1) + gX(END)) / 2} y={GY1 + 12} anchor="middle" color={C.axis} size={8}>t (s)</T>
    <T x={GX0 - 6} y={GY0 + 4} anchor="end" color={C.axis} size={8}>{label}</T>
  </>;

  let view: React.ReactNode, controls: React.ReactNode;

  if (mode === "cart") {
    const now = cartAt(time, F, m, fric);
    const peak = cartAt(PUSH_T, F, m, fric).v;
    const vMax = Math.max(2, peak * 1.2);
    const gY = (v: number) => GY1 - (v / vMax) * (GY1 - GY0 - 8);
    const curve = (t0: number, t1: number) => {
      const pts: string[] = [];
      for (let i = 0; i <= 120; i++) { const tt = t0 + ((t1 - t0) * i) / 120; pts.push(`${i ? "L" : "M"}${gX(tt).toFixed(1)},${gY(cartAt(tt, F, m, fric).v).toFixed(1)}`); }
      return pts.join("");
    };
    const camX = Math.max(0, now.x - 9);
    const sx = (x: number) => 120 + (x - camX) * S;
    const cx = sx(now.x), gy = 128;
    const ticks: number[] = [];
    for (let k = Math.floor(camX - 6); k <= camX + 24; k++) ticks.push(k);
    const pushing = time < PUSH_T && F > 0;
    const PX = 5;                                       // px per newton

    view = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* track */}
        <line x1={0} x2={W} y1={gy} y2={gy} stroke={C.axis} strokeWidth={1.5} />
        {fric && <rect x={0} y={gy} width={W} height={5} fill={C.red} opacity={0.12} />}
        {ticks.map(k => <g key={k}>
          <line x1={sx(k)} x2={sx(k)} y1={gy} y2={gy + (k % 5 === 0 ? 8 : 4)} stroke={C.axis} />
          {k % 5 === 0 && <T x={sx(k)} y={gy + 18} anchor="middle" color={C.axis} size={8}>{`${k} m`}</T>}
        </g>)}
        {/* pushing rod */}
        {pushing && <g>
          <line x1={cx - 64} x2={cx - 26} y1={gy - 16} y2={gy - 16} stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
          <rect x={cx - 30} y={gy - 24} width={4} height={16} rx={1.5} fill={C.muted} />
        </g>}
        {/* cart */}
        <rect x={cx - 25} y={gy - 32} width={50} height={22} rx={4} fill={C.sky} opacity={0.85} />
        <T x={cx} y={gy - 18} anchor="middle" color="#fff" size={9} bold>{`${m} kg`}</T>
        <circle cx={cx - 15} cy={gy - 6} r={6} fill={C.fg} opacity={0.7} />
        <circle cx={cx + 15} cy={gy - 6} r={6} fill={C.fg} opacity={0.7} />
        {/* forces */}
        {pushing && <Vec a={{ x: cx - 25, y: gy - 21 }} b={{ x: cx - 25 + F * PX, y: gy - 21 }} color={C.blue} w={2.2} />}
        {now.f > 0.01 && <Vec a={{ x: cx, y: gy + 2 }} b={{ x: cx - now.f * PX, y: gy + 2 }} color={C.red} w={2.2} />}
        {Math.abs(now.net) > 0.01 && <>
          <Vec a={{ x: cx, y: gy - 46 }} b={{ x: cx + now.net * PX, y: gy - 46 }} color={C.amber} w={2.6} />
          <T x={cx + now.net * PX / 2} y={gy - 52} anchor="middle" color={C.amber} size={8.5}>{`ΣF = ${f2(now.net, 1)} N`}</T>
        </>}
        {now.v > 0.02 && <Vec a={{ x: cx, y: gy - 66 }} b={{ x: cx + now.v * 3, y: gy - 66 }} color={C.green} w={1.6} dash="4 3" />}
        <g>
          <T x={12} y={18} color={C.blue} size={9}>{`F ${tx(t, "figPhNew_applied", "applied")}`}</T>
          <T x={12} y={31} color={C.red} size={9}>{tx(t, "figPhNew_friction", "friction")}</T>
          <T x={12} y={44} color={C.amber} size={9}>{tx(t, "figPhNew_net", "net force ΣF")}</T>
          <T x={12} y={57} color={C.green} size={9}>{tx(t, "figPhNew_vel", "velocity v")}</T>
        </g>
        {/* v(t) graph */}
        {graphFrame("v", PUSH_T)}
        <line x1={GX0} x2={GX1} y1={GY1} y2={GY1} stroke={C.axis} />
        <path d={curve(0, END)} fill="none" stroke={C.green} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.45} />
        {time > 0 && <path d={curve(0, time)} fill="none" stroke={C.green} strokeWidth={2} />}
        <circle cx={gX(time)} cy={gY(now.v)} r={3.5} fill={C.green} />
        <T x={gX(PUSH_T) + 4} y={gY(peak) - 6} color={C.green} size={8.5}>{`${f2(peak, 2)} m/s`}</T>
      </svg>
    );
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhNew_force", "push F")} value={F} min={0} max={10} step={0.5} onChange={v => changed(() => setF(v))} fmt={v => `${f2(v, 1)} N`} />
        <Slider label={tx(t, "figPhNew_mass", "mass m")} value={m} min={1} max={10} step={0.5} onChange={v => changed(() => setM(v))} fmt={v => `${f2(v, 1)} kg`} />
      </Sliders>
      <Row>
        <Btn active={fric} onClick={() => changed(() => setFric(v => !v))}>{tx(t, "figPhNew_fric", "break it: add friction")}</Btn>
        <Readout color={C.amber}>{`ΣF = ${f2(now.net, 2)} N`}</Readout>
        <Readout color={C.amber}>{`a = ΣF / m = ${f2(now.a, 2)} m/s²`}</Readout>
        <Readout color={C.green}>{`v = ${f2(now.v, 2)} m/s`}</Readout>
        <Readout>{`x = ${f2(now.x, 1)} m`}</Readout>
        {fric && <Readout color={C.red}>{`${tx(t, "figPhNew_fmax", "friction")} μmg = ${f2(MU * m * G, 2)} N`}</Readout>}
      </Row>
    </>;
  } else {
    const now = skatersAt(time, mA, mB, Fs, broken);
    const end = skatersAt(SKATE_END, mA, mB, Fs, broken);
    const PXM = 12, cx0 = W / 2, iceY = 120;
    const sx = (x: number) => cx0 + x * PXM;
    const xcm = (mA * now.xA + mB * now.xB) / (mA + mB);
    const xcm0 = (mA * -0.6 + mB * 0.6) / (mA + mB);
    const vMax = Math.max(1, Math.abs(end.vA), Math.abs(end.vB)) * 1.2;
    const mid = (GY0 + GY1) / 2;
    const gY = (v: number) => mid - (v / vMax) * ((GY1 - GY0) / 2 - 6);
    const vpath = (k: "vA" | "vB") => Array.from({ length: 101 }, (_, i) => {
      const tt = (time * i) / 100;
      return `${i ? "L" : "M"}${gX(tt).toFixed(1)},${gY(skatersAt(tt, mA, mB, Fs, broken)[k]).toFixed(1)}`;
    }).join("");
    const skater = (x: number, mass: number, color: string, label: string, facing: 1 | -1) => {
      const h = 34 + mass * 0.32, X = sx(x);
      return <g>
        <circle cx={X} cy={iceY - h - 7} r={7} fill={color} />
        <rect x={X - 8} y={iceY - h} width={16} height={h - 12} rx={6} fill={color} opacity={0.85} />
        <line x1={X - 4} x2={X - 6} y1={iceY - 12} y2={iceY - 1} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <line x1={X + 4} x2={X + 6} y1={iceY - 12} y2={iceY - 1} stroke={color} strokeWidth={3} strokeLinecap="round" />
        {now.pushing && <line x1={X} x2={X + facing * 16} y1={iceY - h + 8} y2={iceY - h + 8} stroke={color} strokeWidth={3} strokeLinecap="round" />}
        <T x={X} y={iceY + 14} anchor="middle" color={color} size={8.5}>{`${label} ${mass} kg`}</T>
      </g>;
    };
    const FPX = 0.22;
    view = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <rect x={0} y={iceY} width={W} height={4} fill={C.sky} opacity={0.25} />
        <line x1={0} x2={W} y1={iceY} y2={iceY} stroke={C.axis} />
        {/* centre of mass */}
        <line x1={sx(xcm0)} x2={sx(xcm)} y1={iceY + 26} y2={iceY + 26} stroke={C.purple} strokeWidth={2} opacity={0.6} />
        <path d={`M${sx(xcm)},${iceY + 20} l-5,-8 h10 z`} fill={C.purple} />
        <T x={sx(xcm)} y={iceY + 38} anchor="middle" color={C.purple} size={8}>{tx(t, "figPhNew_cm", "centre of mass")}</T>
        {skater(now.xA, mA, C.sky, "A", 1)}
        {skater(now.xB, mB, C.pink, "B", -1)}
        {now.pushing && <>
          <Vec a={{ x: sx(now.xA), y: iceY - 70 }} b={{ x: sx(now.xA) - Fs * FPX, y: iceY - 70 }} color={C.amber} w={2.4} />
          <T x={sx(now.xA) - Fs * FPX / 2} y={iceY - 76} anchor="middle" color={C.amber} size={8.5}>{`${Fs} N`}</T>
          <Vec a={{ x: sx(now.xB), y: iceY - 70 }} b={{ x: sx(now.xB) + now.FB * FPX, y: iceY - 70 }} color={broken ? C.red : C.amber} w={2.4} />
          <T x={sx(now.xB) + now.FB * FPX / 2} y={iceY - 76} anchor="middle" color={broken ? C.red : C.amber} size={8.5}>{`${f2(now.FB, 0)} N`}</T>
        </>}
        {!now.pushing && <>
          <Vec a={{ x: sx(now.xA), y: iceY - 70 }} b={{ x: sx(now.xA) + now.vA * 14, y: iceY - 70 }} color={C.green} w={1.6} dash="4 3" />
          <Vec a={{ x: sx(now.xB), y: iceY - 70 }} b={{ x: sx(now.xB) + now.vB * 14, y: iceY - 70 }} color={C.green} w={1.6} dash="4 3" />
        </>}
        {/* v(t) for both */}
        {graphFrame("v", PUSH_S)}
        <line x1={GX0} x2={GX1} y1={mid} y2={mid} stroke={C.axis} />
        {time > 0 && <>
          <path d={vpath("vA")} fill="none" stroke={C.sky} strokeWidth={2} />
          <path d={vpath("vB")} fill="none" stroke={C.pink} strokeWidth={2} />
        </>}
        <T x={GX1} y={gY(end.vB) - 5} anchor="end" color={C.pink} size={8.5}>{`v_B = ${f2(end.vB, 2)} m/s`}</T>
        <T x={GX1} y={gY(end.vA) + 12} anchor="end" color={C.sky} size={8.5}>{`v_A = ${f2(end.vA, 2).replace("-", "−")} m/s`}</T>
      </svg>
    );
    const pA = mA * end.vA, pB = mB * end.vB;
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhNew_mA", "mass of A")} value={mA} min={30} max={100} step={5} onChange={v => changed(() => setMA(v))} fmt={v => `${v} kg`} />
        <Slider label={tx(t, "figPhNew_mB", "mass of B")} value={mB} min={30} max={100} step={5} onChange={v => changed(() => setMB(v))} fmt={v => `${v} kg`} />
        <Slider label={tx(t, "figPhNew_push2", "push force")} value={Fs} min={50} max={300} step={10} onChange={v => changed(() => setFs(v))} fmt={v => `${v} N`} />
      </Sliders>
      <Row>
        <Btn active={broken} onClick={() => changed(() => setBroken(v => !v))}>{tx(t, "figPhNew_broken", "break it: unequal forces")}</Btn>
        <Readout color={C.sky}>{`a_A = ${Fs}/${mA} = ${f2(end.aA, 2)} m/s²`}</Readout>
        <Readout color={C.pink}>{`a_B = ${f2(end.FB, 0)}/${mB} = ${f2(end.aB, 2)} m/s²`}</Readout>
        <Readout color={broken ? C.red : C.purple}>{`m_A v_A + m_B v_B = ${f2(pA + pB, 1)} kg·m/s`}</Readout>
      </Row>
    </>;
  }

  return (
    <Figure title={tx(t, "figPhNew_title", "Push, let go, push back")}
      head={<Choice value={mode} onChange={v => changed(() => setMode(v))} options={[["cart", tx(t, "figPhNew_cart", "cart")], ["skaters", tx(t, "figPhNew_skaters", "two skaters")]] as const} />}
      controls={controls}
      note={mode === "cart"
        ? tx(t, "figPhNew_noteCart", "Press play. For two seconds the rod pushes and the velocity graph climbs in a straight line: its slope is the acceleration, ΣF/m. Double the force and the slope doubles; double the mass and it halves. Then the rod lets go. Nothing pushes any more, and the graph goes flat: the cart keeps its speed for ever. That is the first law. Now break it with friction: the cart slows down and stops, which is what everyday life shows and why people believed for two thousand years that motion needs a force. Try 10 kg with friction: the push is smaller than the most friction can give, so the cart never moves.")
        : tx(t, "figPhNew_noteSkate", "The two skaters push each other for half a second. The amber arrows are the force on A from B and the force on B from A: always the same size, opposite directions, on different bodies. The lighter skater gets the larger acceleration and leaves faster, and mass × velocity comes out equal and opposite, so their sum stays 0. Break it with unequal forces: the purple centre of mass, which stayed put, now drifts away with nothing outside pushing it. No real system does that.")}>
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
