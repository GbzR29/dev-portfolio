"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Sliders, C, T, plot, Grid, fnPath, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A parabola y = ax² + bx + c with its vertex, axis of symmetry and roots.
// The discriminant Δ = b² − 4ac decides how many times it crosses y = 0:
// two roots (Δ > 0), one touching root (Δ = 0) or none (Δ < 0). The quadratic
// formula places the roots at the vertex's x ± √Δ / (2a).

export function QuadraticFigure({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState(0.5);
  const [b, setB] = useState(-1);
  const [c, setC] = useState(-2);
  const p = plot({ W: 560, H: 280, x0: -7, x1: 7, y0: -5, y1: 5 });
  const disc = b * b - 4 * a * c;
  const aOk = Math.abs(a) > 1e-6;
  const vx = aOk ? -b / (2 * a) : 0, vy = a * vx * vx + b * vx + c;
  const roots = !aOk ? (Math.abs(b) > 1e-6 ? [-c / b] : []) : disc > 1e-9 ? [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)] : Math.abs(disc) <= 1e-9 ? [vx] : [];
  const col = disc > 1e-9 ? C.green : Math.abs(disc) <= 1e-9 ? C.amber : C.red;

  return (
    <Figure
      title={tx(t, "figQuad_title", "Quadratics, the discriminant and the roots")}
      controls={<>
        <Sliders>
          <Slider label="a" value={a} min={-2} max={2} step={0.05} onChange={setA} />
          <Slider label="b" value={b} min={-5} max={5} step={0.1} onChange={setB} />
          <Slider label="c" value={c} min={-5} max={5} step={0.1} onChange={setC} />
        </Sliders>
        <Row>
          <Readout>y = {f2(a)}x² {b < 0 ? "−" : "+"} {f2(Math.abs(b))}x {c < 0 ? "−" : "+"} {f2(Math.abs(c))}</Readout>
          <Readout color={col}>Δ = b² − 4ac = {f2(disc)}</Readout>
          {aOk && <Readout color={C.purple}>{tx(t, "figQuad_vertex", "vertex")} ({f2(vx)}, {f2(vy)})</Readout>}
          <Readout color={col}>{roots.length === 0 ? tx(t, "figQuad_none", "no real roots") : `x = ${roots.map(r => f2(r)).join(", ")}`}</Readout>
        </Row>
      </>}
      note={tx(t, "figQuad_note", "a sets how wide the parabola is and whether it opens up (a > 0) or down (a < 0). The vertex, the turning point, sits at x = −b/(2a). The roots are where the curve meets the x axis; they sit symmetrically around the vertex, √Δ/(2a) to each side. Slide c up until the curve lifts off the axis: at the exact moment Δ reaches 0 the two roots merge into one, and beyond it they would need the square root of a negative number, so there are none. Ray tracing asks this exact question for a ray and a sphere: two roots mean the ray enters and leaves, one means it grazes, none means it misses.")}
    >
      <svg viewBox={`0 0 ${p.W} ${p.H}`} className="w-full h-auto">
        <Grid p={p} step={1} />
        {aOk && <line x1={p.X(vx)} x2={p.X(vx)} y1={0} y2={p.H} stroke={C.purple} strokeDasharray="4 4" opacity={0.6} />}
        <path d={fnPath(p, x => a * x * x + b * x + c, p.x0, p.x1, 400)} fill="none" stroke={C.sky} strokeWidth={2.4} />
        {aOk && <circle cx={p.X(vx)} cy={p.Y(vy)} r={5} fill={C.purple} />}
        {roots.length === 2 && aOk && (
          <g>
            <line x1={p.X(roots[0])} x2={p.X(roots[1])} y1={p.Y(0) + 16} y2={p.Y(0) + 16} stroke={C.green} strokeWidth={1.2} />
            <T x={p.X(vx)} y={p.Y(0) + 28} size={9} anchor="middle" color={C.green}>{`√Δ / |a| = ${f2(Math.sqrt(disc) / Math.abs(a))}`}</T>
          </g>
        )}
        {roots.map((r, i) => <circle key={i} cx={p.X(r)} cy={p.Y(0)} r={5.5} fill={col} stroke="var(--code-bg)" strokeWidth={1.5} />)}
      </svg>
    </Figure>
  );
}
