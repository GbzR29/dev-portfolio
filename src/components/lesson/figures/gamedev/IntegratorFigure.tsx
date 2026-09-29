"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, T, f2, plot, useRaf } from "@/components/lesson/kit/figure";
import { METHODS, run, type Accel, type Method, type State } from "./integrators";

// ── What this figure shows ────────────────────────────────────────────────────
// Four integrators run the same system with the same step h. Spring: the
// state (position x, velocity v) drawn as a point in the phase plane; the exact
// motion goes round the dashed unit circle for ever. Orbit: a planet around a
// star; the exact orbit closes on itself. Explicit Euler spirals outwards
// (energy grows every step), semi-implicit Euler and Verlet stay on a closed
// curve, RK4 hugs the exact answer but slowly loses energy. The plot under the
// drawing tracks each method's energy relative to the start.

const COLS: Record<Method, string> = { euler: C.red, semi: C.amber, verlet: C.green, rk4: C.sky };
const LABELS: Record<Method, string> = { euler: "explicit Euler", semi: "semi-implicit Euler", verlet: "velocity Verlet", rk4: "RK4" };
type Scene = "spring" | "orbit";

const SCENES: Record<Scene, { a: Accel; s0: State; energy: (s: State) => number; period: number; range: number }> = {
  // ω = 1: period 2π, energy ½v² + ½x²
  spring: {
    a: x => [-x[0], 0], s0: { x: [1, 0], v: [0, 0] }, period: 2 * Math.PI, range: 2.4,
    energy: s => 0.5 * s.v[0] ** 2 + 0.5 * s.x[0] ** 2,
  },
  // GM = 1, an eccentric orbit (e = 0.44): energy ½|v|² − 1/r
  orbit: {
    a: x => { const r = Math.hypot(x[0], x[1]); return [-x[0] / r ** 3, -x[1] / r ** 3]; },
    s0: { x: [1, 0], v: [0, 1.2] }, period: 2 * Math.PI * Math.pow(1 / (2 - 1.44), 1.5), range: 3.2,
    energy: s => 0.5 * (s.v[0] ** 2 + s.v[1] ** 2) - 1 / Math.hypot(s.x[0], s.x[1]),
  },
};

const W = 660, H = 330, PLOT_H = 110;

export function IntegratorFigure({ t }: { t?: TrackTranslations }) {
  const [scene, setScene] = useState<Scene>("spring");
  const [h, setH] = useState(0.2);
  const [periods, setPeriods] = useState(3);
  const [on, setOn] = useState<Record<Method, boolean>>({ euler: true, semi: true, verlet: true, rk4: true });
  const [time, setTime] = useState(1e9);          // shows the whole run until play is pressed
  const [playing, setPlaying] = useState(false);

  const S = SCENES[scene];
  const total = S.period * periods, steps = Math.ceil(total / h);
  const runs = useMemo(() => Object.fromEntries(METHODS.map(m => [m, run(m, S.s0, S.a, h, steps)])) as Record<Method, State[]>, [S, h, steps]);
  const E0 = S.energy(S.s0);

  const tRef = useRef(time); tRef.current = time;
  const rafRef = useRaf(playing, dt => {
    const next = tRef.current + dt * S.period / 3;
    if (next >= total) { setTime(total); setPlaying(false); } else setTime(next);
  });
  const shown = Math.min(steps, Math.floor(Math.min(time, total) / h));

  // Drawing: the phase plane (spring) or the orbital plane, left; energy, below
  const P = plot({ W: 330, H: H - 10, x0: -S.range, x1: S.range, y0: -S.range * 0.94, y1: S.range * 0.94 });
  const coord = (s: State): [number, number] => (scene === "spring" ? [s.x[0], s.v[0]] : [s.x[0], s.x[1]]);
  const exact = useMemo(() => {
    const e = run("rk4", S.s0, S.a, S.period / 400, 400);
    return e.map(s => coord(s)).map(([x, y]) => `${P.X(x).toFixed(1)},${P.Y(y).toFixed(1)}`).join(" ");
    // coord depends only on the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S, scene]);

  const EX0 = 350, EW = W - EX0 - 10;
  const ex = (tt: number) => EX0 + (tt / total) * EW;
  // Energy change relative to the start's size: 1 = kept, above = gained, below = lost.
  // (A plain ratio E/E₀ would flip for the orbit, whose energy is negative.)
  const eRel = (s: State) => 1 + (S.energy(s) - E0) / Math.abs(E0);
  const ey = (r: number) => 30 + PLOT_H * 2 - Math.max(0, Math.min(2.5, r)) * PLOT_H * 0.8;

  const errors = METHODS.map(m => {
    const last = runs[m][Math.min(shown, runs[m].length - 1)];
    return [m, eRel(last)] as const;
  });

  return (
    <Figure
      title={tx(t, "figInt_title", "Four integrators, one system")}
      head={<Choice value={scene} onChange={(v: Scene) => { setScene(v); setTime(1e9); }} options={[["spring", tx(t, "figInt_spring", "spring")], ["orbit", tx(t, "figInt_orbit", "orbit")]]} />}
      controls={<>
        <Row>
          {METHODS.map(m => (
            <Btn key={m} active={on[m]} onClick={() => setOn(o => ({ ...o, [m]: !o[m] }))}>
              <span style={{ color: COLS[m] }}>●</span> {tx(t, `figInt_${m}`, LABELS[m])}
            </Btn>
          ))}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <Btn active={playing} onClick={() => { if (!playing) setTime(0); setPlaying(v => !v); }}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
        </Row>
        <Slider label={tx(t, "figInt_h", "step h")} value={h} min={0.02} max={1} step={0.01} onChange={setH} fmt={v => `${v.toFixed(2)} s`} width="w-28" />
        <Slider label={tx(t, "figInt_periods", "periods")} value={periods} min={1} max={20} step={1} onChange={v => { setPeriods(v); setTime(1e9); }} fmt={v => String(v)} width="w-28" />
        <Row>
          <Readout>{tx(t, "figInt_steps", "steps per period")}: {(S.period / h).toFixed(1)}</Readout>
          {errors.filter(([m]) => on[m]).map(([m, r]) => (
            <Readout key={m} color={COLS[m]}>E: {Math.abs(r) > 99 ? "≫" : f2(r, 3)}</Readout>
          ))}
        </Row>
      </>}
      note={tx(t, "figInt_note", "Spring: every point is a state (position across, velocity up); the exact motion circles the dashed line for ever. Explicit Euler spirals outwards because each step multiplies the energy by 1 + ω²h². Semi-implicit Euler and Verlet trace a closed loop, slightly squashed: their energy wobbles but never drifts. RK4 is almost exactly on the circle, but its energy slowly leaks away, which you see after many periods or with a large h. Orbit: the same story in space; explicit Euler lets the planet escape, and the symplectic methods keep it in an orbit that slowly turns (precesses) instead.")}
    >
      <div ref={rafRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
          {/* Left: the trajectories, clipped so a blown-up run stays in its panel */}
          <defs><clipPath id="figIntClip"><rect x={0} y={0} width={P.W} height={P.H} /></clipPath></defs>
          <g clipPath="url(#figIntClip)">
          <line x1={P.X(-S.range)} x2={P.X(S.range)} y1={P.Y(0)} y2={P.Y(0)} stroke={C.axis} />
          <line x1={P.X(0)} x2={P.X(0)} y1={P.Y(-S.range)} y2={P.Y(S.range)} stroke={C.axis} />
          <T x={P.X(S.range) - 4} y={P.Y(0) - 5} anchor="end">x</T>
          <T x={P.X(0) + 5} y={14}>{scene === "spring" ? "v" : "y"}</T>
          {scene === "orbit" && <circle cx={P.X(0)} cy={P.Y(0)} r={6} fill={C.amber} />}
          <polyline points={exact} fill="none" stroke={C.fg} strokeDasharray="4 4" opacity={0.5} />
          {METHODS.filter(m => on[m]).map(m => {
            const pts = runs[m].slice(0, shown + 1).map(coord);
            const last = pts[pts.length - 1];
            return (
              <g key={m}>
                <polyline points={pts.map(([x, y]) => `${P.X(x).toFixed(1)},${P.Y(y).toFixed(1)}`).join(" ")} fill="none" stroke={COLS[m]} strokeWidth={1.5} opacity={0.9} />
                {last && <circle cx={P.X(last[0])} cy={P.Y(last[1])} r={4} fill={COLS[m]} />}
              </g>
            );
          })}
          </g>

          {/* Right: energy over time */}
          <T x={EX0} y={18}>{tx(t, "figInt_energy", "energy (1 = the start, up = gained)")}</T>
          <line x1={EX0} x2={EX0 + EW} y1={ey(0)} y2={ey(0)} stroke={C.axis} />
          <line x1={EX0} x2={EX0 + EW} y1={ey(1)} y2={ey(1)} stroke={C.fg} strokeDasharray="4 4" opacity={0.5} />
          <line x1={EX0} x2={EX0} y1={ey(0)} y2={ey(2.5)} stroke={C.axis} />
          {[0, 1, 2].map(v => <T key={v} x={EX0 - 4} y={ey(v) + 4} anchor="end" size={8.5}>{v}</T>)}
          {METHODS.filter(m => on[m]).map(m => (
            <polyline key={m} fill="none" stroke={COLS[m]} strokeWidth={1.5}
              points={runs[m].slice(0, shown + 1).map((s, i) => `${ex(i * h).toFixed(1)},${ey(eRel(s)).toFixed(1)}`).join(" ")} />
          ))}
          <T x={EX0 + EW} y={ey(0) + 14} anchor="end" size={9}>{`t → ${f2(total, 1)} s`}</T>
        </svg>
      </div>
    </Figure>
  );
}
