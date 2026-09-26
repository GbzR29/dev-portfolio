"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, Btn, C, T, plot, useRaf, type Pt } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Where π comes from, measured on the circumference:
// unroll   — a wheel of diameter D rolls along a ruler marked in diameters.
//            After one full turn the crust laid on the ground is π ≈ 3.14 D
//            long: a little more than three diameters.
// polygons — Archimedes' squeeze. Regular polygons drawn inside and outside
//            a circle of diameter 1; their perimeters are easy to compute
//            (Pythagoras and similar triangles) and trap π between them.
//            Doubling the sides 6 → 12 → 24 → 48 → 96 closes the gap.

type Mode = "unroll" | "polygons";
const W = 560, H = 300, HU = 230;
const TAU = Math.PI * 2;
const n5 = (v: number) => v.toFixed(5);

/** Side lengths for a circle of radius 1, doubling from the hexagon (side 1). */
function archimedes(steps: number) {
  const rows: { n: number; s: number; t: number }[] = [];
  let n = 6, s = 1;
  for (let i = 0; i <= steps; i++) {
    const apothem = Math.sqrt(1 - (s / 2) ** 2);    // centre to the middle of a side
    rows.push({ n, s, t: s / apothem });            // outside side: scaled by 1/apothem
    s = Math.sqrt(2 - Math.sqrt(4 - s * s));        // side after doubling (Pythagoras twice)
    n *= 2;
  }
  return rows;
}
const ROWS = archimedes(4);

export function PiFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("unroll");
  const [u, setU] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);

  const ref = useRaf(playing && mode === "unroll", dt => {
    const nv = Math.min(1, u + dt * 0.18);
    setU(nv);
    if (nv >= 1) setPlaying(false);
  });

  let svg: React.ReactNode, controls: React.ReactNode, note: string;

  if (mode === "unroll") {
    // Radius 1, so the diameter D = 2 world units; the ruler is marked in D.
    const p = plot({ W, H: HU, x0: -1.3, x1: 8.2, y0: -1.3, y1: 2.6 });
    const cx = TAU * u, cy = 1;
    const P = (a: number): Pt => ({ x: cx + Math.cos(a), y: cy + Math.sin(a) });
    const arc = (a0: number, a1: number) => {
      let d = "";
      for (let i = 0; i <= 90; i++) { const q = P(a0 + ((a1 - a0) * i) / 90); d += `${i ? "L" : "M"}${p.X(q.x)},${p.Y(q.y)}`; }
      return d;
    };
    const mark = P(-Math.PI / 2 - TAU * u);      // the point that started at the bottom
    svg = <>
      <line x1={p.X(-1.3)} y1={p.Y(0)} x2={p.X(8.2)} y2={p.Y(0)} stroke={C.axis} strokeWidth={1.2} />
      {[0, 1, 2, 3].map(i => <g key={i}>
        <line x1={p.X(2 * i)} y1={p.Y(0)} x2={p.X(2 * i)} y2={p.Y(-0.35)} stroke={C.fg} strokeWidth={1.2} />
        <T x={p.X(2 * i)} y={p.Y(-0.35) + 12} size={10} anchor="middle" color={C.fg} bold>{i === 0 ? "0" : `${i}D`}</T>
      </g>)}
      <line x1={p.X(TAU)} y1={p.Y(0.15)} x2={p.X(TAU)} y2={p.Y(-0.9)} stroke={C.pink} strokeWidth={1.4} strokeDasharray="3 2" />
      <T x={p.X(TAU) + 4} y={p.Y(-0.9) + 3} size={10} color={C.pink} bold>πD</T>
      <line x1={p.X(0)} y1={p.Y(0)} x2={p.X(TAU * u)} y2={p.Y(0)} stroke={C.amber} strokeWidth={5} strokeLinecap="round" />
      <circle cx={p.X(cx)} cy={p.Y(cy)} r={p.sx} fill={C.sky} fillOpacity={0.1} stroke={C.muted} strokeWidth={1} />
      {u < 1 && <path d={arc(-Math.PI / 2, 1.5 * Math.PI - TAU * u)} fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" />}
      <line x1={p.X(cx - Math.cos(-TAU * u))} y1={p.Y(cy - Math.sin(-TAU * u))} x2={p.X(cx + Math.cos(-TAU * u))} y2={p.Y(cy + Math.sin(-TAU * u))} stroke={C.sky} strokeWidth={1.5} />
      <T x={p.X(cx)} y={p.Y(cy) - 6} size={10} anchor="middle" color={C.sky} bold>D</T>
      <circle cx={p.X(mark.x)} cy={p.Y(mark.y)} r={4.5} fill={C.pink} />
    </>;
    controls = <>
      <Row>
        <Btn active={playing} onClick={() => { if (u >= 1) setU(0); setPlaying(v => !v); }}>{playing ? tx(t, "figPi_pause", "pause") : tx(t, "figPi_roll", "roll")}</Btn>
        <Btn onClick={() => { setPlaying(false); setU(0); }}>{tx(t, "figPi_reset", "reset")}</Btn>
      </Row>
      <Slider label={tx(t, "figPi_turn", "turned")} value={u} min={0} max={1} step={0.001} onChange={v => { setPlaying(false); setU(v); }} fmt={v => `${Math.round(v * 360)}°`} width="w-20" />
      <Row>
        <Readout color={C.amber}>{`${tx(t, "figPi_laid", "crust on the ground")} = ${(Math.PI * u).toFixed(3)} D`}</Readout>
        {u >= 1 && <Readout color={C.pink}>{`C / D = π ≈ 3.14159`}</Readout>}
      </Row>
    </>;
    note = tx(t, "figPi_noteU", "Roll the wheel. Its edge (the amber crust) is laid flat on the ruler as it turns, without slipping, so the amber line on the ground is exactly as long as the part of the circumference that has touched it. The ruler is marked in diameters D. After one full turn the whole circumference is on the ground and it reaches a little past 3D: 3.14159… diameters. That number, the same for every circle, is π.");
  } else {
    const p = plot({ W, H, x0: -2.4, x1: 2.4, y0: -1.286, y1: 1.286 });
    const row = ROWS[step], n = row.n;
    const R = 1.05, ro = R / Math.sqrt(1 - (row.s / 2) ** 2);   // outside polygon's corner radius
    const poly = (rad: number) => Array.from({ length: n }, (_, i) => {
      const a = (i / n) * TAU + Math.PI / 2;
      return `${p.X(rad * Math.cos(a))},${p.Y(rad * Math.sin(a))}`;
    }).join(" ");
    // Perimeter / diameter: n sides of length s over a diameter of 2 (radius 1).
    const lo = (n * row.s) / 2, hi = (n * row.t) / 2;
    svg = <>
      <polygon points={poly(ro)} fill={C.pink} fillOpacity={0.1} stroke={C.pink} strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={p.X(0)} cy={p.Y(0)} r={R * p.sx} fill="none" stroke={C.fg} strokeWidth={2.2} />
      <polygon points={poly(R)} fill={C.sky} fillOpacity={0.14} stroke={C.sky} strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={p.X(-R)} y1={p.Y(0)} x2={p.X(R)} y2={p.Y(0)} stroke={C.muted} strokeWidth={1} strokeDasharray="4 3" />
      <T x={p.X(0)} y={p.Y(0) - 5} size={9.5} anchor="middle" color={C.muted}>D = 1</T>
      <T x={p.X(-2.3)} y={p.Y(1.1)} size={11} color={C.fg} bold>{`n = ${n}`}</T>
      <T x={p.X(-2.3)} y={p.Y(1.1) + 16} size={9.5} color={C.sky}>{tx(t, "figPi_inside", "inside")}</T>
      <T x={p.X(-2.3)} y={p.Y(1.1) + 30} size={9.5} color={C.pink}>{tx(t, "figPi_outside", "outside")}</T>
      {ROWS.map((q, i) => {
        const l = (q.n * q.s) / 2, h = (q.n * q.t) / 2;
        return <T key={i} x={p.X(1.3)} y={p.Y(1.1) + i * 15} size={9} color={i === step ? C.fg : C.muted} bold={i === step}>
          {`${String(q.n).padStart(2, " ")}: ${l.toFixed(4)} < π < ${h.toFixed(4)}`}
        </T>;
      })}
    </>;
    controls = <>
      <Slider label={tx(t, "figPi_sides", "sides")} value={step} min={0} max={4} step={1} onChange={setStep} fmt={v => String(6 * 2 ** v)} width="w-16" />
      <Row>
        <Readout color={C.sky}>{`${tx(t, "figPi_in", "inside perimeter")} = ${n5(lo)}`}</Readout>
        <Readout color={C.fg}>{`π = ${n5(Math.PI)}`}</Readout>
        <Readout color={C.pink}>{`${tx(t, "figPi_out", "outside perimeter")} = ${n5(hi)}`}</Readout>
      </Row>
    </>;
    note = tx(t, "figPi_noteP", "The circle has diameter 1, so its circumference is exactly π. The blue polygon is inside the circle, so its perimeter is shorter than π; the pink one is outside, so its perimeter is longer. With 6 sides the gap is wide (3 < π < 3.46). Each step doubles the number of sides and both polygons hug the circle more tightly. Archimedes did this by hand up to 96 sides, around 250 BC, and proved 3.1408 < π < 3.1429.");
  }

  return (
    <Figure
      title={tx(t, "figPi_title", "Measuring pi on the circumference")}
      head={<Choice value={mode} onChange={v => { setMode(v); setPlaying(false); }} options={[
        ["unroll", tx(t, "figPi_mUnroll", "unroll")],
        ["polygons", tx(t, "figPi_mPoly", "Archimedes")],
      ] as const} />}
      controls={controls}
      note={note}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${mode === "unroll" ? HU : H}`} className="w-full h-auto">{svg}</svg>
      </div>
    </Figure>
  );
}
