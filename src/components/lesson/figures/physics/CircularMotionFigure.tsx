"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2, type Pt } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Two scenes, both seen from above.
//   • string — a ball whirled on a string at constant speed. Blue: velocity,
//     always along the tangent. Amber: acceleration v²/r, towards the centre.
//     The right panel puts the velocity now and a moment later tail to tail:
//     the change Δv between them points to the centre too. "break it: cut the
//     string" removes the only force, and the ball leaves along the tangent
//     (first law), not outwards along the radius (the faint red guess).
//   • curve — a car on a flat curve. Friction must supply m v²/R; it can give
//     at most μ m g. Above √(μ g R) the car follows the tightest circle
//     friction allows, radius v²/(μ g), and drifts off the road.

const W = 560, H = 300;
const G = 9.81;
const CX = 190, CY = 150;

type Mode = "string" | "curve";

export function CircularMotionFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("string");
  const [r, setR] = useState(1.2);
  const [v, setV] = useState(4);
  const [m, setM] = useState(0.3);
  const [R, setRc] = useState(50);
  const [vc, setVc] = useState(15);
  const [mu, setMu] = useState(0.7);
  const [cutAt, setCutAt] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const stop = () => setPlaying(false);
  const reset = () => { stop(); setTime(0); setCutAt(null); };
  const changed = (f: () => void) => { f(); reset(); };

  // ── curve mode: does friction hold? ──
  const need = (vc * vc) / R, avail = mu * G;
  const skid = need > avail + 1e-9;
  const Rs = skid ? (vc * vc) / avail : R;            // the circle the car actually follows
  const RP = 105, sc = RP / R;                        // road radius in px, px per metre
  const carAt = (tt: number): Pt => {                 // world metres, y up, entry at the bottom going anticlockwise
    const psi = -Math.PI / 2 + (vc * tt) / Rs;
    return { x: Rs * Math.cos(psi), y: -R + Rs + Rs * Math.sin(psi) };
  };
  const car = carAt(time);
  const offRoad = Math.hypot(car.x, car.y) > R + 4;
  const carGone = Math.abs(car.x * sc) > 200 || Math.abs(car.y * sc) > 170;

  // ── string mode ──
  const PXM = 70, rp = r * PXM, omega = v / r;
  const ballAt = (tt: number): Pt => {
    const cutT = cutAt ?? Infinity, ph = omega * Math.min(tt, cutT);
    const p = { x: CX + rp * Math.cos(ph), y: CY - rp * Math.sin(ph) };
    if (tt <= cutT) return p;
    const d = (tt - cutT) * v * PXM;
    return { x: p.x - Math.sin(ph) * d, y: p.y - Math.cos(ph) * d };
  };
  const ball = ballAt(time);
  const ballGone = cutAt !== null && (ball.x < -20 || ball.x > 340 || ball.y < -20 || ball.y > H + 20);

  useFrame(playing && vis.on, dt => {
    if ((mode === "string" && ballGone) || (mode === "curve" && carGone)) { setPlaying(false); return; }
    setTime(x => x + dt);
  });

  let view: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "string") {
    const ph = omega * Math.min(time, cutAt ?? Infinity);
    const tan = { x: -Math.sin(ph), y: -Math.cos(ph) };
    const acc = (v * v) / r;
    const cut = cutAt !== null && time > cutAt;
    const cp = cutAt !== null ? ballAt(cutAt) : null;
    // right panel: velocity now and Δφ later, tail to tail
    const O = { x: 445, y: 165 }, VS = 12, dph = 0.6;
    const v1 = { x: O.x + tan.x * v * VS, y: O.y + tan.y * v * VS };
    const t2 = { x: -Math.sin(ph + dph), y: -Math.cos(ph + dph) };
    const v2 = { x: O.x + t2.x * v * VS, y: O.y + t2.y * v * VS };
    view = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <circle cx={CX} cy={CY} r={rp} fill="none" stroke={C.grid} strokeDasharray="4 4" />
        <circle cx={CX} cy={CY} r={3} fill={C.fg} />
        {!cut && <line x1={CX} y1={CY} x2={ball.x} y2={ball.y} stroke={C.muted} strokeWidth={1.4} />}
        {cp && <>
          <line x1={cp.x} y1={cp.y} x2={cp.x + (cp.x - CX) / rp * 150} y2={cp.y + (cp.y - CY) / rp * 150} stroke={C.red} strokeDasharray="3 4" opacity={0.5} />
          <T x={cp.x + (cp.x - CX) / rp * 60 + 6} y={cp.y + (cp.y - CY) / rp * 60} color={C.red} size={8.5}>{tx(t, "figPhCirc_notThis", "not this way")}</T>
          <line x1={cp.x} y1={cp.y} x2={ball.x} y2={ball.y} stroke={C.blue} strokeDasharray="2 3" opacity={0.7} />
        </>}
        {!cut && <Vec a={ball} b={{ x: ball.x + (CX - ball.x) / rp * acc * 0.7, y: ball.y + (CY - ball.y) / rp * acc * 0.7 }} color={C.amber} w={2.2} />}
        <Vec a={ball} b={{ x: ball.x + tan.x * v * 9, y: ball.y + tan.y * v * 9 }} color={C.blue} w={2.2} />
        <circle cx={ball.x} cy={ball.y} r={7} fill={C.sky} stroke="var(--code-bg)" strokeWidth={1.5} />
        <T x={12} y={18} color={C.blue} size={9}>{tx(t, "figPhCirc_v", "velocity v (along the tangent)")}</T>
        <T x={12} y={31} color={C.amber} size={9}>{tx(t, "figPhCirc_a", "acceleration v²/r (to the centre)")}</T>
        {/* tail-to-tail panel */}
        <rect x={350} y={12} width={200} height={276} rx={10} fill="none" stroke={C.grid} />
        <T x={360} y={28} color={C.muted} size={8.5}>{tx(t, "figPhCirc_tail", "v now and a moment later")}</T>
        <circle cx={O.x} cy={O.y} r={v * VS} fill="none" stroke={C.grid} strokeDasharray="3 3" />
        <Vec a={O} b={v1} color={C.blue} w={2} />
        <Vec a={O} b={v2} color={C.blue} w={2} opacity={0.5} />
        <Vec a={v1} b={v2} color={C.amber} w={2.2} />
        <T x={(v1.x + v2.x) / 2 + 6} y={(v1.y + v2.y) / 2} color={C.amber} size={9}>Δv</T>
        <T x={360} y={276} color={C.muted} size={8}>{tx(t, "figPhCirc_tailNote", "Δv points to the centre of the circle")}</T>
      </svg>
    );
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhCirc_r", "radius r")} value={r} min={0.5} max={1.8} step={0.1} onChange={x => changed(() => setR(x))} fmt={x => `${f2(x, 1)} m`} />
        <Slider label={tx(t, "figPhCirc_speed", "speed v")} value={v} min={1} max={8} step={0.5} onChange={x => changed(() => setV(x))} fmt={x => `${f2(x, 1)} m/s`} />
        <Slider label={tx(t, "figPhCirc_mass", "mass m")} value={m} min={0.1} max={1} step={0.05} onChange={x => setM(x)} fmt={x => `${f2(x, 2)} kg`} />
      </Sliders>
      <Row>
        <Btn active={cutAt !== null} onClick={() => { if (cutAt === null) { setCutAt(time); setPlaying(true); } else reset(); }}>
          {cutAt === null ? tx(t, "figPhCirc_cut", "break it: cut the string") : tx(t, "figPhCirc_tie", "tie it again")}
        </Btn>
        <Readout>{`ω = v/r = ${f2(omega, 2)} rad/s`}</Readout>
        <Readout>{`T = 2πr/v = ${f2((2 * Math.PI) / omega, 2)} s`}</Readout>
        <Readout color={C.amber}>{`a = v²/r = ${f2(acc, 1)} m/s²`}</Readout>
        <Readout color={C.purple}>{`${tx(t, "figPhCirc_tension", "string tension")} m v²/r = ${f2(m * acc, 2)} N`}</Readout>
      </Row>
    </>;
    note = tx(t, "figPhCirc_noteString", "Press play. The speed never changes, yet the velocity arrow keeps turning, so the velocity is changing, and that is an acceleration. The right panel shows why it points inward: put the velocity now and a moment later tail to tail, and the arrow joining their tips, Δv, aims at the centre. Double the speed and the acceleration (and the pull the string must give) quadruples; halve the radius and it doubles. Then cut the string. Most people expect the ball to fly outward along the red line. It goes straight along the tangent, the way it was moving at that instant, because nothing pushes it any more.");
  } else {
    const X = (p: Pt) => CX + p.x * sc, Y = (p: Pt) => CY - p.y * sc;
    const psi = -Math.PI / 2 + (vc * time) / Rs;
    const heading = (Math.atan2(-Math.cos(psi), -Math.sin(psi)) * 180) / Math.PI;   // screen angle of the velocity
    const pathD = Array.from({ length: 121 }, (_, i) => {
      const p = carAt((i / 120) * Math.max(time, 0.01));
      return `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(p).toFixed(1)}`;
    }).join("");
    const BX = 400, BW = 34, BY1 = 250, BS = 150 / 12;    // bars: px per m/s²
    const vmax = Math.sqrt(avail * R);
    view = (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <circle cx={CX} cy={CY} r={RP} fill="none" stroke={C.axis} strokeWidth={8 * sc} opacity={0.22} />
        <circle cx={CX} cy={CY} r={RP} fill="none" stroke={C.fg} strokeDasharray="6 6" opacity={0.35} />
        <circle cx={CX} cy={CY} r={2.5} fill={C.fg} />
        {time > 0 && <path d={pathD} fill="none" stroke={skid ? C.red : C.green} strokeWidth={1.5} opacity={0.8} />}
        <g transform={`translate(${X(car)},${Y(car)}) rotate(${heading})`}>
          <rect x={-10} y={-5.5} width={20} height={11} rx={3} fill={skid ? C.red : C.sky} />
          <rect x={3} y={-4} width={4} height={8} rx={1} fill="var(--code-bg)" opacity={0.6} />
        </g>
        {!offRoad && <Vec a={{ x: X(car), y: Y(car) }} b={{ x: X(car) - (X(car) - CX) / RP * Math.min(need, avail) * 7, y: Y(car) - (Y(car) - CY) / RP * Math.min(need, avail) * 7 }} color={C.red} w={2} />}
        <T x={12} y={18} color={C.red} size={9}>{tx(t, "figPhCirc_fric", "friction from the road")}</T>
        {offRoad && <T x={X(car)} y={Y(car) - 12} anchor="middle" color={C.red} size={9.5} bold>{tx(t, "figPhCirc_off", "off the road")}</T>}
        {/* needed vs available */}
        <rect x={350} y={12} width={200} height={276} rx={10} fill="none" stroke={C.grid} />
        <T x={360} y={28} color={C.muted} size={8.5}>{tx(t, "figPhCirc_bars", "sideways acceleration (m/s²)")}</T>
        <rect x={BX - BW} y={BY1 - Math.min(need, 14) * BS} width={BW} height={Math.min(need, 14) * BS} fill={skid ? C.red : C.amber} opacity={0.8} />
        <rect x={BX + 30} y={BY1 - avail * BS} width={BW} height={avail * BS} fill={C.green} opacity={0.7} />
        <line x1={BX - BW - 8} x2={BX + 30 + BW + 8} y1={BY1 - avail * BS} y2={BY1 - avail * BS} stroke={C.green} strokeDasharray="3 3" />
        <line x1={BX - BW - 8} x2={BX + 30 + BW + 8} y1={BY1} y2={BY1} stroke={C.axis} />
        <T x={BX - BW / 2} y={BY1 + 13} anchor="middle" color={skid ? C.red : C.amber} size={8.5}>v²/R</T>
        <T x={BX - BW / 2} y={BY1 + 24} anchor="middle" color={skid ? C.red : C.amber} size={8.5}>{f2(need, 1)}</T>
        <T x={BX + 30 + BW / 2} y={BY1 + 13} anchor="middle" color={C.green} size={8.5}>μg</T>
        <T x={BX + 30 + BW / 2} y={BY1 + 24} anchor="middle" color={C.green} size={8.5}>{f2(avail, 1)}</T>
        <T x={450} y={52} anchor="middle" color={skid ? C.red : C.green} size={9.5} bold>{skid ? tx(t, "figPhCirc_skids", "too fast: it skids") : tx(t, "figPhCirc_holds", "friction holds")}</T>
        <T x={450} y={66} anchor="middle" color={C.muted} size={8.5}>{`v_max = ${f2(vmax, 1)} m/s = ${f2(vmax * 3.6, 0)} km/h`}</T>
      </svg>
    );
    controls = <>
      <Sliders>
        <Slider label={tx(t, "figPhCirc_Rc", "curve radius R")} value={R} min={20} max={120} step={5} onChange={x => changed(() => setRc(x))} fmt={x => `${x} m`} />
        <Slider label={tx(t, "figPhCirc_speed", "speed v")} value={vc} min={5} max={40} step={1} onChange={x => changed(() => setVc(x))} fmt={x => `${f2(x * 3.6, 0)} km/h`} />
        <Slider label={tx(t, "figPhCirc_mu", "grip μ")} value={mu} min={0.1} max={1} step={0.05} onChange={x => changed(() => setMu(x))} fmt={x => f2(x, 2)} />
      </Sliders>
      <Row>
        <Readout color={skid ? C.red : C.amber}>{`${tx(t, "figPhCirc_need", "needed")} v²/R = ${f2(need, 2)} m/s²`}</Readout>
        <Readout color={C.green}>{`${tx(t, "figPhCirc_avail", "available")} μg = ${f2(avail, 2)} m/s²`}</Readout>
        {skid && <Readout color={C.red}>{`${tx(t, "figPhCirc_actual", "actual circle")} v²/(μg) = ${f2(Rs, 0)} m`}</Readout>}
      </Row>
    </>;
    note = tx(t, "figPhCirc_noteCurve", "Nothing pulls the car towards the centre except the sideways grip of the tyres on the road. The bars compare what the curve needs, v²/R, with the most friction can give, μg. Press play at 54 km/h on a dry road (μ = 0.7): it holds. Raise the speed past the dashed limit, or drop μ to 0.4 for a wet road or 0.1 for ice, and the car follows a wider circle than the road and slides off the outside edge. The car's mass appears on both sides and cancels: a truck and a bicycle have the same limit.");
  }

  return (
    <Figure title={tx(t, "figPhCirc_title", "Going round in circles")}
      head={<Choice value={mode} onChange={x => changed(() => setMode(x))} options={[["string", tx(t, "figPhCirc_string", "ball on a string")], ["curve", tx(t, "figPhCirc_curve", "car on a curve")]] as const} />}
      controls={controls} note={note}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={() => { if (ballGone || carGone) reset(); setPlaying(p => !p); }}
          onReset={reset}
          readout={`t = ${f2(time, 1)} s`} />
      </div>
    </Figure>
  );
}
