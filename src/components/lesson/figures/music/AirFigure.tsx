"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";

// ── What this figure shows ────────────────────────────────────────────────────
// Sound as a push passed along through air, slowed down a few hundred times.
// The speaker's cone moves back and forth; each air particle is shoved by its
// neighbour and shoves the next, so crowded patches (compressions) and sparse
// ones (rarefactions) travel to the ear while every particle only wobbles in
// place (follow the red one). Displacement of a particle at distance x:
//   u(x, t) = A · sin(2π(f·t − x/λ)),  with λ = v / f,
// zero ahead of the wave front x > v·t. The strip underneath is the pressure,
// p ∝ −∂u/∂x = cos(…): high where the dots crowd. "Remove the air" leaves the
// speaker moving and the eardrum still: there is nothing to carry the push.

const W = 600, H = 250;
const X0 = 80, X1 = 512;                                   // air between the speaker and the ear
const ROWS = 9, COLS = 44, ROW_Y0 = 22, ROW_DY = 13;
const V = 120;                                             // wave speed in drawing units per second
const U_MAX = 10;                                          // displacement at A = 1
const P_Y = 188, P_H = 26;                                 // pressure strip baseline and half height
const EAR_X = 540;
const RED_ROW = 4, RED_COL = 14;

/** The pressure strip's curve along the air. */
function pressurePath(p: (x: number) => number) {
  let d = "";
  for (let x = X0; x <= X1; x += 2) d += `${d ? "L" : "M"}${x},${(P_Y - P_H * p(x)).toFixed(2)}`;
  return d;
}

/** The two newest pressure peaks behind the wave front: one wavelength apart. Peak k sits where f·t − x/λ = k. */
function lastPeaks(f: number, time: number, lambda: number, front: number) {
  const peaks: number[] = [];
  for (let k = Math.floor(f * time); k >= 0 && peaks.length < 2; k--) {
    const x = X0 + lambda * (f * time - k);
    if (x >= X0 && x <= Math.min(X1, X0 + front)) peaks.push(x);
  }
  return peaks;
}

export function MusicAirFigure({ t }: { t?: TrackTranslations }) {
  const [f, setF] = useState(0.5);
  const [A, setA] = useState(0.8);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [vacuum, setVacuum] = useState(false);
  const vis = useVisible<HTMLDivElement>();
  useFrame(playing && vis.on, dt => setTime(s => s + dt));

  // Rest positions: a grid with a little jitter so it reads as air, not a lattice
  const rest = useMemo(() => {
    const rnd = mulberry32(11);
    const dx = (X1 - X0 - 8) / (COLS - 1);
    return Array.from({ length: ROWS * COLS }, (_, i) => {
      const r = Math.floor(i / COLS), c = i % COLS;
      return { r, c, x: X0 + 4 + c * dx + (rnd() - 0.5) * 4, y: ROW_Y0 + r * ROW_DY + (rnd() - 0.5) * 5 };
    });
  }, []);

  const lambda = V / f;
  const front = V * time;
  const phase = (x: number) => 2 * Math.PI * (f * time - (x - X0) / lambda);
  // The speaker starts gently: the first half wavelength behind the front fades in, so the pressure has no jump there
  const ramp = (x: number) => { const s = Math.max(0, Math.min(1, (front - (x - X0)) / (lambda / 2))); return s * s * (3 - 2 * s); };
  const u = (x: number) => A * U_MAX * ramp(x) * Math.sin(phase(x));
  const p = (x: number) => (vacuum ? 0 : A * ramp(x) * Math.cos(phase(x)));

  const pPath = pressurePath(p);
  const peaks = lastPeaks(f, time, lambda, front);
  const cone = X0 - 14 + u(X0);
  const ear = vacuum ? 0 : u(X1);

  return (
    <Figure title={tx(t, "figMus_airTitle", "A push passed along through the air")}
      head={<Btn active={vacuum} onClick={() => setVacuum(v => !v)}>{tx(t, "figMus_vacuum", "remove the air")}</Btn>}
      controls={<>
        <Sliders>
          <Slider label={tx(t, "figMus_airF", "f (slowed down)")} value={f} min={0.25} max={2} step={0.05}
            onChange={v => { setF(v); setTime(0); }} fmt={v => `${v.toFixed(2)} /s`} />
          <Slider label={tx(t, "figMus_airA", "push strength A")} value={A} min={0} max={1} step={0.05} onChange={setA} />
        </Sliders>
        <Row>
          <Readout>T = 1/f = {(1 / f).toFixed(2)} s</Readout>
          <Readout>λ = v/f = {V} / {f.toFixed(2)} = {lambda.toFixed(0)}</Readout>
        </Row>
      </>}
      note={tx(t, "figMus_airNote", "Follow the red particle: it only rocks back and forth around its place, yet the crowded patches travel all the way to the ear. Raise f and the patches come closer together (λ = v/f). Then remove the air: the speaker keeps moving, but nothing reaches the ear. Real sound is a few hundred times faster than this.")}>
      <div ref={vis.ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {/* speaker: magnet box and cone */}
          <rect x={20} y={48} width={26} height={60} rx={3} fill={C.muted} fillOpacity={0.35} stroke={C.muted} />
          <path d={`M46,58 L${cone},${ROW_Y0 - 6} L${cone},${ROW_Y0 + (ROWS - 1) * ROW_DY + 6} L46,98 Z`}
            fill={C.muted} fillOpacity={0.2} stroke={C.fg} strokeWidth={1.2} />
          <line x1={cone} x2={cone} y1={ROW_Y0 - 6} y2={ROW_Y0 + (ROWS - 1) * ROW_DY + 6} stroke={C.fg} strokeWidth={2.5} />
          <T x={33} y={124} anchor="middle" size={9}>{tx(t, "figMus_speaker", "speaker")}</T>

          {/* air particles */}
          {!vacuum && rest.map((q, i) => {
            const red = q.r === RED_ROW && q.c === RED_COL;
            return <circle key={i} cx={q.x + u(q.x)} cy={q.y} r={red ? 3.6 : 2.5}
              fill={red ? C.red : C.sky} fillOpacity={red ? 1 : 0.75} />;
          })}
          {!vacuum && (() => {
            const q = rest[RED_ROW * COLS + RED_COL];
            return [-1, 1].map(s => <line key={s} x1={q.x + s * A * U_MAX} x2={q.x + s * A * U_MAX} y1={q.y - 6} y2={q.y + 6}
              stroke={C.red} strokeOpacity={0.6} strokeDasharray="2 2" />);
          })()}
          {vacuum && <T x={(X0 + X1) / 2} y={ROW_Y0 + 4 * ROW_DY + 3} anchor="middle" size={11} bold>
            {tx(t, "figMus_vacuumLabel", "vacuum: nothing to push")}</T>}

          {/* ear: outer ear and eardrum */}
          <path d={`M${EAR_X + 40},30 C${EAR_X + 10},30 ${EAR_X + 4},70 ${EAR_X + 18},80 C${EAR_X + 4},90 ${EAR_X + 10},128 ${EAR_X + 40},128`}
            fill="none" stroke={C.muted} strokeWidth={1.5} />
          <line x1={EAR_X + 22 + ear} x2={EAR_X + 22 + ear} y1={62} y2={98} stroke={C.amber} strokeWidth={3} strokeLinecap="round" />
          <T x={EAR_X + 26} y={144} anchor="middle" size={9}>{tx(t, "figMus_eardrum", "eardrum")}</T>

          {/* pressure strip */}
          <line x1={X0} x2={X1} y1={P_Y} y2={P_Y} stroke={C.axis} />
          <path d={pPath} fill="none" stroke={C.amber} strokeWidth={2} />
          <T x={X0 - 6} y={P_Y - P_H + 4} anchor="end" size={8.5}>{tx(t, "figMus_crowded", "+ crowded")}</T>
          <T x={X0 - 6} y={P_Y + 3} anchor="end" size={8.5}>{tx(t, "figMus_normal", "normal")}</T>
          <T x={X0 - 6} y={P_Y + P_H + 2} anchor="end" size={8.5}>{tx(t, "figMus_sparse", "− sparse")}</T>
          <T x={X1 + 6} y={P_Y + 3} size={8.5}>{tx(t, "figMus_pressure", "pressure")}</T>

          {/* one wavelength between two neighbouring peaks */}
          {!vacuum && peaks.length === 2 && A > 0 && (
            <g>
              <line x1={peaks[1]} x2={peaks[0]} y1={P_Y - P_H - 8} y2={P_Y - P_H - 8} stroke={C.purple} strokeWidth={1.2} />
              {peaks.map(x => <line key={x} x1={x} x2={x} y1={P_Y - P_H - 12} y2={P_Y - P_H - 4} stroke={C.purple} strokeWidth={1.2} />)}
              <T x={(peaks[0] + peaks[1]) / 2} y={P_Y - P_H - 12} anchor="middle" color={C.purple} size={10} bold>λ</T>
            </g>
          )}
        </svg>
        <div className="px-3 pb-3">
          <Transport t={t} playing={playing} onPlay={() => setPlaying(p => !p)} onReset={() => setTime(0)}
            readout={`t = ${time.toFixed(1)} s`} />
        </div>
      </div>
    </Figure>
  );
}
