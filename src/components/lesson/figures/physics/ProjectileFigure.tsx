"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, Vec, useFrame, useVisible, f2 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { planetName } from "./PendulumDimensionsFigure";

// ── What this figure shows ────────────────────────────────────────────────────
// A launcher fires a ball at speed v₀ and angle θ from a height h. Playing
// moves the ball along its path in real time. Options:
//   • shadows — a ball on the left wall that moves only up and down, and one on
//     the ground that moves only sideways. They keep exact pace with the real
//     ball: the two motions are independent (vertical = a throw straight up,
//     horizontal = constant speed).
//   • components — the velocity split into vₓ (constant) and v_y (shrinking,
//     then growing downward).
//   • air drag — break the textbook: a tennis ball's quadratic drag
//     (k = 0.02 /m) shortens and skews the path; the dashed ideal path stays.
// The last three shots stay as faint trails, to compare angles.

const W = 560, H = 300, PADL = 34, PADB = 26, PADT = 14, PADR = 14;
const PLANETS = [["earth", 9.81], ["moon", 1.62], ["mars", 3.71]] as const;
type Planet = (typeof PLANETS)[number][0];
const K_DRAG = 0.02;                                  // tennis ball: ρ C_d A / (2m), per metre
const DT = 0.002;

type Sample = { t: number; x: number; y: number; vx: number; vy: number };

/** The flight from launch to landing, sampled every DT (drag or ideal). */
function fly(v0: number, deg: number, h: number, g: number, drag: boolean): Sample[] {
  const th = (deg * Math.PI) / 180;
  let x = 0, y = h, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), t = 0;
  if (!drag) {                                        // the exact parabola, so readouts match the formulas
    const vy0 = vy, tEnd = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
    return Array.from({ length: 401 }, (_, i) => {
      const tt = (tEnd * i) / 400;
      return { t: tt, x: vx * tt, y: i === 400 ? 0 : h + vy0 * tt - 0.5 * g * tt * tt, vx, vy: vy0 - g * tt };
    });
  }
  const out: Sample[] = [{ t, x, y, vx, vy }];
  for (let i = 0; i < 400000; i++) {
    const sp = Math.hypot(vx, vy), k = drag ? K_DRAG : 0;
    const ax = -k * sp * vx, ay = -g - k * sp * vy;
    // semi-implicit Euler is plenty at this step size
    vx += ax * DT; vy += ay * DT;
    const nx = x + vx * DT, ny = y + vy * DT;
    t += DT;
    if (ny < 0) {                                     // land exactly on y = 0
      const f = y / (y - ny);
      out.push({ t: t - DT + f * DT, x: x + f * (nx - x), y: 0, vx, vy });
      break;
    }
    x = nx; y = ny;
    if (i % 5 === 0) out.push({ t, x, y, vx, vy });
  }
  return out;
}

const at = (path: Sample[], t: number) => {
  if (t >= path[path.length - 1].t) return path[path.length - 1];
  let lo = 0, hi = path.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path[m].t <= t) lo = m; else hi = m; }
  return path[lo];
};

export function ProjectileFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(45);
  const [v0, setV0] = useState(20);
  const [h, setH] = useState(0);
  const [planet, setPlanet] = useState<Planet>("earth");
  const [drag, setDrag] = useState(false);
  const [shadows, setShadows] = useState(true);
  const [comps, setComps] = useState(true);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trails, setTrails] = useState<Sample[][]>([]);
  const vis = useVisible<HTMLDivElement>();

  const g = PLANETS.find(p => p[0] === planet)![1];
  const ideal = useMemo(() => fly(v0, deg, h, g, false), [v0, deg, h, g]);
  const path = useMemo(() => (drag ? fly(v0, deg, h, g, true) : ideal), [drag, ideal, v0, deg, h, g]);
  const T_END = path[path.length - 1].t;

  useFrame(playing && vis.on, dt => {
    if (time >= T_END) { setPlaying(false); return; }
    setTime(v => Math.min(T_END, v + dt));
  });

  // Equal scale on both axes, so angles look right; fit the ideal path and the trails
  const all = [ideal, path, ...trails];
  const xMax = Math.max(10, ...all.map(p => p[p.length - 1].x), ...all.flat().map(s => s.x));
  const yMax = Math.max(5, h, ...all.flat().map(s => s.y));
  const s = Math.min((W - PADL - PADR) / (xMax * 1.05), (H - PADB - PADT) / (yMax * 1.1));
  const X = (x: number) => PADL + x * s, Y = (y: number) => H - PADB - y * s;
  const line = (p: Sample[]) => p.map((q, i) => `${i ? "L" : "M"}${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join("");

  const now = at(path, time);
  const th = (deg * Math.PI) / 180;
  const vy0 = v0 * Math.sin(th), tTop = Math.max(0, vy0 / g);
  const apex = { x: v0 * Math.cos(th) * tTop, y: h + vy0 * tTop - 0.5 * g * tTop * tTop };
  const range = ideal[ideal.length - 1].x;
  const vScale = 3;                                 // px per (m/s) for the arrows

  // grid every "nice" metres
  const stepM = [1, 2, 5, 10, 20, 50, 100, 200, 500].find(m => m * s >= 38) ?? 1000;
  const gridX: number[] = [], gridY: number[] = [];
  for (let x = 0; X(x) <= W - PADR; x += stepM) gridX.push(x);
  for (let y = 0; Y(y) >= PADT; y += stepM) gridY.push(y);

  const stop = () => setPlaying(false);
  const changed = (f: () => void) => () => { stop(); f(); setTime(0); };
  const fire = () => {
    if (time >= T_END || time === 0) {
      setTrails(tr => [path, ...tr].slice(0, 3));
      setTime(0);
    }
    setPlaying(p => !p);
  };

  const view = (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {gridX.map(x => <g key={`x${x}`}>
        <line x1={X(x)} x2={X(x)} y1={PADT} y2={H - PADB} stroke={C.grid} strokeWidth={0.6} />
        <text x={X(x)} y={H - PADB + 12} fontSize={8.5} fill={C.axis} textAnchor="middle" fontFamily="monospace">{x}</text>
      </g>)}
      {gridY.map(y => <g key={`y${y}`}>
        <line x1={PADL} x2={W - PADR} y1={Y(y)} y2={Y(y)} stroke={C.grid} strokeWidth={0.6} />
        <text x={PADL - 4} y={Y(y) + 3} fontSize={8.5} fill={C.axis} textAnchor="end" fontFamily="monospace">{y}</text>
      </g>)}
      <line x1={PADL} x2={W - PADR} y1={Y(0)} y2={Y(0)} stroke={C.axis} strokeWidth={1.5} />
      <T x={W - PADR} y={H - 4} anchor="end" color={C.axis} size={8.5}>m</T>

      {/* launch tower and barrel */}
      {h > 0 && <rect x={X(0) - 5} y={Y(h)} width={10} height={Y(0) - Y(h)} fill={C.axis} opacity={0.5} />}
      <line x1={X(0)} y1={Y(h)} x2={X(0) + 22 * Math.cos(th)} y2={Y(h) - 22 * Math.sin(th)} stroke={C.fg} strokeWidth={5} strokeLinecap="round" />

      {trails.map((p, i) => <path key={i} d={line(p)} fill="none" stroke={C.muted} strokeWidth={1.2} opacity={0.35 - i * 0.08} />)}
      <path d={line(ideal)} fill="none" stroke={C.sky} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.8} />
      {drag && <path d={line(path)} fill="none" stroke={C.red} strokeWidth={1.8} />}
      {!drag && <>
        <circle cx={X(apex.x)} cy={Y(apex.y)} r={2.5} fill={C.amber} />
        <T x={X(apex.x)} y={Y(apex.y) - 7} anchor="middle" color={C.amber}>{`${f2(apex.y, 1)} m`}</T>
        <T x={X(range)} y={Y(0) - 6} anchor="middle" color={C.sky}>{`${f2(range, 1)} m`}</T>
      </>}

      {shadows && <>
        <line x1={X(now.x)} x2={PADL} y1={Y(now.y)} y2={Y(now.y)} stroke={C.green} strokeDasharray="2 4" opacity={0.6} />
        <line x1={X(now.x)} x2={X(now.x)} y1={Y(now.y)} y2={Y(0)} stroke={C.blue} strokeDasharray="2 4" opacity={0.6} />
        <circle cx={PADL} cy={Y(now.y)} r={5} fill={C.green} opacity={0.85} />
        <circle cx={X(now.x)} cy={Y(0)} r={5} fill={C.blue} opacity={0.85} />
      </>}

      {comps && time < T_END && <>
        <Vec a={{ x: X(now.x), y: Y(now.y) }} b={{ x: X(now.x) + now.vx * vScale, y: Y(now.y) }} color={C.blue} w={1.8} />
        <Vec a={{ x: X(now.x), y: Y(now.y) }} b={{ x: X(now.x), y: Y(now.y) - now.vy * vScale }} color={C.green} w={1.8} />
        <Vec a={{ x: X(now.x), y: Y(now.y) }} b={{ x: X(now.x) + now.vx * vScale, y: Y(now.y) - now.vy * vScale }} color={C.fg} w={1.4} opacity={0.6} />
      </>}
      <circle cx={X(now.x)} cy={Y(now.y)} r={6} fill={drag ? C.red : C.sky} stroke="var(--code-bg)" strokeWidth={1.5} />
    </svg>
  );

  return (
    <Figure title={tx(t, "figPhProj_title", "Projectile launcher")}
      head={<Choice value={planet} onChange={p => changed(() => setPlanet(p))()} options={PLANETS.map(([k]) => [k, planetName(t, k)] as const)} />}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figPhProj_angle", "angle θ")} value={deg} min={0} max={90} step={1} onChange={v => changed(() => setDeg(v))()} fmt={v => `${v}°`} />
          <Slider label={tx(t, "figPhProj_speed", "speed v₀")} value={v0} min={5} max={30} step={0.5} onChange={v => changed(() => setV0(v))()} fmt={v => `${f2(v, 1)} m/s`} />
          <Slider label={tx(t, "figPhProj_height", "height h")} value={h} min={0} max={20} step={1} onChange={v => changed(() => setH(v))()} fmt={v => `${v} m`} />
        </Sliders>
        <Row>
          <Btn active={shadows} onClick={() => setShadows(v => !v)}>{tx(t, "figPhProj_shadows", "the two shadows")}</Btn>
          <Btn active={comps} onClick={() => setComps(v => !v)}>{tx(t, "figPhProj_comps", "velocity components")}</Btn>
          <Btn active={drag} onClick={changed(() => setDrag(v => !v))}>{tx(t, "figPhProj_drag", "break it: air drag")}</Btn>
          <Btn onClick={() => setTrails([])}>{tx(t, "figPhProj_clear", "clear trails")}</Btn>
        </Row>
        <Row>
          <Readout color={C.blue}>{`vₓ = ${f2(now.vx, 1)} m/s`}</Readout>
          <Readout color={C.green}>{`v_y = ${f2(now.vy, 1).replace("-", "−")} m/s`}</Readout>
          <Readout color={C.amber}>{`${tx(t, "figPhProj_top", "top")} ${f2(apex.y, 2)} m`}</Readout>
          <Readout color={C.sky}>{`${tx(t, "figPhProj_range", "range")} ${f2(range, 2)} m · ${f2(ideal[ideal.length - 1].t, 2)} s`}</Readout>
          {drag && <Readout color={C.red}>{`${tx(t, "figPhProj_withDrag", "with drag")} ${f2(path[path.length - 1].x, 2)} m`}</Readout>}
        </Row>
      </>}
      note={tx(t, "figPhProj_note", "Set the angle and speed, then press play to fire. The green ball on the left wall copies only the height, the blue one on the ground only the horizontal position: the green one rises and falls exactly like a ball thrown straight up, the blue one slides at constant speed. That is the whole secret of projectiles: two independent one-dimensional motions. Fire at 30°, 45° and 60° and compare the trails: 45° goes farthest from the ground, and 30° and 60° land together. Then switch on air drag: the real path is shorter and falls more steeply than it rose, and the best angle drops below 45°.")}>
      <div ref={vis.ref}>
        {view}
        <Transport t={t} playing={playing} onPlay={fire} playLabel={tx(t, "figPhProj_fire", "fire")}
          onStep={() => { stop(); setTime(v => Math.min(T_END, +(v + 0.1).toFixed(3))); }}
          onBack={() => { stop(); setTime(v => Math.max(0, +(v - 0.1).toFixed(3))); }}
          onReset={() => { stop(); setTime(0); }}
          readout={`t = ${f2(time, 2)} s`} />
      </div>
    </Figure>
  );
}
