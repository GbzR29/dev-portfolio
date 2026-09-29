"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Figure, Readout, Row, Slider, T, f2, fnPath, plot } from "@/components/lesson/kit/figure";
import { amplification, type StabMethod } from "./integrators";

// ── What this figure shows ────────────────────────────────────────────────────
// On a spring (a = −ω²x), one step of any of these methods multiplies the
// amplitude by a fixed factor that depends only on s = ω·h, the step measured
// against the spring's own time scale. The curves plot that factor. Above 1
// the motion grows every step (unstable), below 1 it is damped, exactly 1 it
// is kept. The readouts raise the factor to the number of steps in one period
// of the spring, which is what you would see after one oscillation.

const P = plot({ W: 660, H: 280, x0: 0, x1: 3.5, y0: 0.4, y1: 1.6 });
const CURVES: [StabMethod, string, string][] = [
  ["euler", C.red, "explicit Euler"],
  ["semi", C.amber, "semi-implicit Euler = Verlet"],
  ["rk4", C.sky, "RK4"],
  ["implicit", C.purple, "implicit Euler"],
];

export function StabilityFigure({ t }: { t?: TrackTranslations }) {
  const [s, setS] = useState(0.5);
  const perPeriod = (2 * Math.PI) / s;

  return (
    <Figure
      title={tx(t, "figStab_title", "Growth per step on a spring")}
      controls={<>
        <Slider label={tx(t, "figStab_s", "ω·h")} value={s} min={0.05} max={3.4} step={0.01} onChange={setS} width="w-20" />
        <Row>
          <Readout>{tx(t, "figStab_steps", "steps per period")}: {f2(perPeriod, 1)}</Readout>
          {CURVES.map(([m, col]) => {
            const g = amplification(m, s) ** perPeriod;
            return <Readout key={m} color={col}>{tx(t, "figStab_after", "after one period")}: ×{g > 999 ? "≫1000" : f2(g, 3)}</Readout>;
          })}
        </Row>
      </>}
      note={tx(t, "figStab_note", "Explicit Euler is above 1 for every step size: it always gains energy, just slowly when ω·h is small. Semi-implicit Euler and Verlet sit exactly on 1 until ω·h = 2, then shoot up: past that point they explode. RK4 dips just below 1 (a slow loss) and stays stable until ω·h ≈ 2.83. Implicit Euler is below 1 everywhere: it can never explode, but it drains energy, which is why it is used for stiff springs and cloth that must never blow up. At 60 steps per second, ω·h = 2 means a spring that oscillates about 19 times per second.")}
    >
      <svg viewBox={`0 0 ${P.W} ${P.H}`} className="w-full block">
        {[0.5, 1, 1.5].map(v => (
          <g key={v}>
            <line x1={P.X(0)} x2={P.X(3.5)} y1={P.Y(v)} y2={P.Y(v)} stroke={v === 1 ? C.fg : C.grid} strokeDasharray={v === 1 ? "4 4" : undefined} opacity={v === 1 ? 0.6 : 1} />
            <T x={P.X(0) + 4} y={P.Y(v) - 4} size={9}>{v}</T>
          </g>
        ))}
        {[1, 2, 3].map(v => (
          <g key={v}>
            <line x1={P.X(v)} x2={P.X(v)} y1={P.Y(0.4)} y2={P.Y(1.6)} stroke={C.grid} />
            <T x={P.X(v)} y={P.H - 4} anchor="middle" size={9}>{`ω·h = ${v}`}</T>
          </g>
        ))}
        <defs><clipPath id="figStabClip"><rect x={P.X(0)} y={P.Y(1.6)} width={P.X(3.5) - P.X(0)} height={P.Y(0.4) - P.Y(1.6)} /></clipPath></defs>
        <g clipPath="url(#figStabClip)">
          {CURVES.map(([m, col]) => (
            <path key={m} d={fnPath(P, x => Math.max(0.3, Math.min(1.7, amplification(m, x))), 0.001, 3.5, 400)} fill="none" stroke={col} strokeWidth={2} />
          ))}
        </g>
        <line x1={P.X(s)} x2={P.X(s)} y1={P.Y(0.4)} y2={P.Y(1.6)} stroke={C.fg} strokeWidth={1.2} />
        {CURVES.map(([m, col], i) => (
          <g key={`l${m}`}>
            <circle cx={P.X(s)} cy={P.Y(Math.min(1.6, amplification(m, s)))} r={4} fill={col} />
            <T x={P.W - 8} y={18 + i * 14} anchor="end" color={col} size={10}>{tx(t, `figStab_${m}`, CURVES[i][2])}</T>
          </g>
        ))}
      </svg>
    </Figure>
  );
}
