"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Newton's cannon: a ball fired sideways from a (very) tall mountain, 1 000 km
// up, with real values for the Earth (G M, radius). Too slow and it falls back
// to the ground; at the circular speed √(GM/r) it falls round the Earth for
// ever; faster, it traces an ellipse; at √2 times the circular speed it
// escapes. "equal areas" shades the region swept by the line from the Earth's
// centre in each 15 minutes: the wedges all have the same area (Kepler's
// second law, a consequence of L being conserved). "break it: force ∝ 1/r"
// swaps the inverse-square law for a 1/r force of the same strength at the
// mountain: the orbit no longer closes and traces a rosette, while the equal
// areas survive, because any force pointing at the centre conserves L.
// Leapfrog integration in metres and seconds, 5 s steps, 2 000 s per second.

const W = 560, H = 320;
const GM = 3.986e14, RE = 6.371e6, ALT = 1.0e6, R0 = RE + ALT;
const CX = 300, CY = 132, PXR = 34;                   // centre (px), Earth radius (px)
const K = PXR / RE;                                   // px per metre
const RATE = 2000, STEP = 5, AREA_DT = 900;           // sim s per real s, step (s), wedge length (s)

type State = { x: number; y: number; vx: number; vy: number; t: number; done: "" | "crash" | "away" };
type P = { x: number; y: number; t: number };

const accel = (x: number, y: number, inv1: boolean) => {
  const r = Math.hypot(x, y);
  const g = inv1 ? GM / (R0 * r) : GM / (r * r);      // same pull at the mountain top
  return { ax: (-g * x) / r, ay: (-g * y) / r };
};

export function OrbitFigure({ t }: { t?: TrackTranslations }) {
  const [v0, setV0] = useState(6.5);                  // km/s
  const [deg, setDeg] = useState(0);
  const [areas, setAreas] = useState(false);
  const [inv1, setInv1] = useState(false);
  const [playing, setPlaying] = useState(false);
  const vis = useVisible<HTMLDivElement>();

  const start = (v = v0, a = deg): State => {
    const th = (a * Math.PI) / 180;
    return { x: 0, y: R0, vx: v * 1000 * Math.cos(th), vy: v * 1000 * Math.sin(th), t: 0, done: "" };
  };
  const [st, setSt] = useState<State>(() => start());
  const trail = useRef<P[]>([{ x: 0, y: R0, t: 0 }]);

  // useFrame always calls the latest closure, so `st` here is current
  useFrame(playing && vis.on, dt => {
    if (st.done) return;
    let { x, y, vx, vy, t: tt } = st;
    let done: State["done"] = "";
    const n = Math.max(1, Math.round((dt * RATE) / STEP));
    for (let i = 0; i < n; i++) {
      let a = accel(x, y, inv1);
      vx += (a.ax * STEP) / 2; vy += (a.ay * STEP) / 2;
      x += vx * STEP; y += vy * STEP;
      a = accel(x, y, inv1);
      vx += (a.ax * STEP) / 2; vy += (a.ay * STEP) / 2;
      tt += STEP;
      const last = trail.current[trail.current.length - 1];
      if (tt - last.t >= 30) { trail.current.push({ x, y, t: tt }); if (trail.current.length > 4000) trail.current.shift(); }
      const r = Math.hypot(x, y);
      if (r < RE) { done = "crash"; break; }
      if (r > 14 * RE) { done = "away"; break; }
    }
    if (done) setPlaying(false);
    setSt({ x, y, vx, vy, t: tt, done });
  });

  const reset = (v = v0, a = deg) => { setPlaying(false); setSt(start(v, a)); trail.current = [{ x: 0, y: R0, t: 0 }]; };
  const play = () => { if (st.done) reset(); setPlaying(p => !p); };

  // ── what Kepler predicts from the launch alone (inverse square only) ──
  const vc = Math.sqrt(GM / R0), ve = Math.sqrt(2) * vc;
  const v = v0 * 1000, th = (deg * Math.PI) / 180;
  const eps = (v * v) / 2 - GM / R0;                    // energy per kg
  const h = R0 * v * Math.cos(th);                      // angular momentum per kg
  const ecc = Math.sqrt(Math.max(0, 1 + (2 * eps * h * h) / (GM * GM)));
  const a = -GM / (2 * eps);
  const rPeri = eps < 0 ? a * (1 - ecc) : (h * h) / GM / (1 + ecc);
  let fate: string;
  if (inv1) fate = tx(t, "figPhOrb_rosette", "1/r force: the orbit does not close");
  else if (eps >= 0) fate = tx(t, "figPhOrb_escape", "escapes for ever");
  else if (rPeri < RE) fate = tx(t, "figPhOrb_crash", "falls back to the ground");
  else fate = `${tx(t, "figPhOrb_ellipse", "orbit, period")} ${f2((2 * Math.PI * Math.sqrt(a ** 3 / GM)) / 3600, 2)} h`;

  // ── drawing ──
  const X = (x: number) => CX + x * K, Y = (y: number) => CY - y * K;
  const pts = trail.current;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join("") + `L${X(st.x).toFixed(1)},${Y(st.y).toFixed(1)}`;
  const wedges: string[] = [];
  if (areas) {
    let k = 0, cur: P[] = [];
    for (const p of [...pts, { x: st.x, y: st.y, t: st.t }]) {
      const kk = Math.floor(p.t / AREA_DT);
      if (kk !== k) { if (k % 2 === 0 && cur.length) wedges.push(`M${CX},${CY}` + cur.map(q => `L${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join("") + `L${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}Z`); k = kk; cur = []; }
      cur.push(p);
    }
    if (k % 2 === 0 && cur.length > 1) wedges.push(`M${CX},${CY}` + cur.map(q => `L${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join("") + "Z");
  }
  const r = Math.hypot(st.x, st.y), sp = Math.hypot(st.vx, st.vy);
  const ar = accel(st.x, st.y, inv1);
  const ag = Math.hypot(ar.ax, ar.ay);
  const ball = { x: X(st.x), y: Y(st.y) };
  const energy = inv1 ? (sp * sp) / 2 + (GM / R0) * Math.log(r / R0) : (sp * sp) / 2 - GM / r;
  const hNow = Math.abs(st.x * st.vy - st.y * st.vx);

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <circle cx={CX} cy={CY} r={(R0 / RE) * PXR} fill="none" stroke={C.grid} strokeDasharray="3 4" />
      {wedges.map((d, i) => <path key={i} d={d} fill={C.amber} opacity={0.22} stroke={C.amber} strokeWidth={0.6} />)}
      <circle cx={CX} cy={CY} r={PXR} fill={C.blue} />
      <path d={`M${CX - 9},${CY - PXR + 2} L${CX},${Y(R0) + 2} L${CX + 9},${CY - PXR + 2} Z`} fill={C.green} opacity={0.8} />
      <T x={CX + 12} y={Y(R0) - 4} color={C.muted} size={8}>{tx(t, "figPhOrb_mountain", "1 000 km mountain")}</T>
      <path d={path} fill="none" stroke={C.pink} strokeWidth={1.6} opacity={0.85} />
      {!st.done && <>
        <Vec a={ball} b={{ x: ball.x + (st.vx / 1000) * 6, y: ball.y - (st.vy / 1000) * 6 }} color={C.green} w={1.6} />
        <Vec a={ball} b={{ x: ball.x + (ar.ax / ag) * 26, y: ball.y - (ar.ay / ag) * 26 }} color={C.red} w={1.6} />
      </>}
      <circle cx={ball.x} cy={ball.y} r={4} fill={C.pink} stroke="var(--code-bg)" strokeWidth={1} />
      <T x={12} y={18} color={C.green} size={9}>{tx(t, "figPhOrb_vel", "velocity")}</T>
      <T x={12} y={31} color={C.red} size={9}>{tx(t, "figPhOrb_pull", "gravity, towards the centre")}</T>
      <T x={12} y={H - 26} color={C.muted} size={9}>{`${tx(t, "figPhOrb_vc", "circular speed")} √(GM/r) = ${f2(vc / 1000, 2)} km/s`}</T>
      <T x={12} y={H - 12} color={C.muted} size={9}>{`${tx(t, "figPhOrb_ve", "escape speed")} √(2GM/r) = ${f2(ve / 1000, 2)} km/s`}</T>
      {st.done === "crash" && <T x={W - 12} y={18} anchor="end" color={C.red} size={9}>{tx(t, "figPhOrb_hit", "hit the ground")}</T>}
      {st.done === "away" && <T x={W - 12} y={18} anchor="end" color={C.amber} size={9}>{tx(t, "figPhOrb_gone", "gone: still slowing, never coming back")}</T>}
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhOrb_title", "Newton's cannon")}
      head={<>
        <Btn active={areas} onClick={() => setAreas(v => !v)}>{tx(t, "figPhOrb_areas", "equal areas")}</Btn>
        <Btn active={inv1} onClick={() => { setInv1(v => !v); reset(); }}>{tx(t, "figPhOrb_broken", "break it: force ∝ 1/r")}</Btn>
      </>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhOrb_speed", "launch speed")} value={v0} min={2} max={12} step={0.05} onChange={x => { setV0(x); reset(x); }} fmt={x => `${f2(x, 2)} km/s`} />
          <Slider label={tx(t, "figPhOrb_angle", "aim above level")} value={deg} min={-30} max={45} step={1} onChange={x => { setDeg(x); reset(v0, x); }} fmt={x => `${x}°`} />
        </Sliders>
        <Row>
          <Readout color={C.amber}>{fate}</Readout>
          <Readout>{`${tx(t, "figPhOrb_alt", "height")} ${f2(Math.max(0, r - RE) / 1000, 0)} km`}</Readout>
          <Readout color={C.green}>{`v = ${f2(sp / 1000, 2)} km/s`}</Readout>
          <Readout color={C.purple}>{`E/m = ${f2(energy / 1e6, 2)} MJ/kg`}</Readout>
          <Readout color={C.amber}>{`L/m = |r × v| = ${f2(hNow / 1e6, 0)} km²/s`}</Readout>
        </Row>
      </>}
      note={tx(t, "figPhOrb_note", "Press play at the starting speed: the ball falls, but the ground curves away beneath it and it lands far round the Earth. Raise the speed to the circular speed shown at the bottom: the ball keeps falling and never lands, which is what an orbit is. Go faster and it swings out into an ellipse and comes back to the mountain top; at the escape speed it leaves for good. Turn on equal areas: the ball moves fast near the Earth and slowly far away, so that the shaded wedges, each 15 minutes long, all have the same area. The energy and r × v readouts do not change during a flight. Then break it with a 1/r force: the ellipse turns into a rosette that never closes, yet the areas stay equal.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={play} onReset={() => reset()}
          readout={`t = ${Math.floor(st.t / 3600)} h ${String(Math.floor((st.t % 3600) / 60)).padStart(2, "0")} min`} />
      </div>
    </Figure>
  );
}
