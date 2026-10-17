"use client";

// ── Plane vector fields for the vector-calculus widgets ──────────────────────
// A field is F(x, y) = (P, Q). The figures share one world window (x from −3.5
// to 3.5, y from −2 to 2, the 560 × 320 viewBox), numerical div and curl by
// central differences, and the arrow grid that draws a field.

import { C, plot, type Pt } from "@/components/lesson/kit/figure";

export type Field = {
  id: string;
  /** Formula shown to the reader. */
  label: string;
  F: (x: number, y: number) => Pt;
  /** A potential f with ∇f = F, when the field is conservative on the whole window. */
  pot?: (x: number, y: number) => number;
  /** The exact curl, for a field with a singular point (the whirl: 0 everywhere it is defined). */
  curl?: (x: number, y: number) => number;
  /** Not defined at the origin. */
  singular?: boolean;
};

export const W = 560, H = 320;
export const pv = plot({ W, H, x0: -3.5, x1: 3.5, y0: -2, y1: 2 });

const v = (x: number, y: number): Pt => ({ x, y });
export const FIELDS: Record<string, Field> = {
  source: { id: "source", label: "(x, y) / 2", F: (x, y) => v(x / 2, y / 2), pot: (x, y) => (x * x + y * y) / 4 },
  vortex: { id: "vortex", label: "(−y, x) / 2", F: (x, y) => v(-y / 2, x / 2) },
  shear: { id: "shear", label: "(0.6y, 0)", F: (_x, y) => v(0.6 * y, 0) },
  saddle: { id: "saddle", label: "(x, −y) / 2", F: (x, y) => v(x / 2, -y / 2), pot: (x, y) => (x * x - y * y) / 4 },
  spiral: { id: "spiral", label: "(x − y, x + y) / 3", F: (x, y) => v((x - y) / 3, (x + y) / 3) },
  uniform: { id: "uniform", label: "(1, 0.4)", F: () => v(1, 0.4), pot: (x, y) => x + 0.4 * y },
  hills: {
    id: "hills", label: "∇(e^(−r₁²) − e^(−r₂²))",
    F: (x, y) => {
      const a = Math.exp(-((x - 1.3) ** 2 + (y - 0.2) ** 2)), b = Math.exp(-((x + 1.3) ** 2 + (y + 0.3) ** 2));
      return v(-2 * (x - 1.3) * a + 2 * (x + 1.3) * b, -2 * (y - 0.2) * a + 2 * (y + 0.3) * b);
    },
    pot: (x, y) => Math.exp(-((x - 1.3) ** 2 + (y - 0.2) ** 2)) - Math.exp(-((x + 1.3) ** 2 + (y + 0.3) ** 2)),
  },
  whirl: {
    id: "whirl", label: "(−y, x) / (x² + y²)",
    F: (x, y) => { const r2 = Math.max(x * x + y * y, 0.04); return v(-y / r2, x / r2); },
    curl: () => 0, singular: true,
  },
};

const h = 1e-4;
/** ∂P/∂x + ∂Q/∂y at (x, y): net outflow per unit area. */
export const divAt = (f: Field, x: number, y: number) =>
  (f.F(x + h, y).x - f.F(x - h, y).x) / (2 * h) + (f.F(x, y + h).y - f.F(x, y - h).y) / (2 * h);
/** ∂Q/∂x − ∂P/∂y at (x, y): circulation per unit area (counterclockwise positive). */
export const curlAt = (f: Field, x: number, y: number) => f.curl ? f.curl(x, y) :
  (f.F(x + h, y).y - f.F(x - h, y).y) / (2 * h) - (f.F(x, y + h).x - f.F(x, y - h).x) / (2 * h);

/** "0.25", "−1", never "-0". */
export const n2 = (x: number, d = 2) => {
  const s = Math.abs(x) < 0.5 * 10 ** -d ? "0" : String(+x.toFixed(d));
  return s.replace("-", "−");
};

/** The arrow grid of a field: each arrow scaled to the strongest arrow on screen, longest about one cell. */
export function FieldArrows({ field, step = 0.5, opacity = 0.55, color = C.muted }: { field: Field; step?: number; opacity?: number; color?: string }) {
  const pts: { p: Pt; f: Pt }[] = [];
  for (let x = pv.x0 + step / 2; x < pv.x1; x += step) for (let y = pv.y0 + step / 2; y < pv.y1; y += step) pts.push({ p: v(x, y), f: field.F(x, y) });
  const max = Math.max(1e-9, ...pts.map(q => Math.hypot(q.f.x, q.f.y)));
  const cell = step * pv.sx * 0.85;
  return (
    <g opacity={opacity}>
      {pts.map(({ p, f }, i) => {
        const m = Math.hypot(f.x, f.y);
        if (m < 1e-6) return null;
        // length grows like √(|F|/max) so weak arrows stay visible
        const L = cell * Math.sqrt(m / max), ux = f.x / m, uy = -f.y / m;
        const x0 = pv.X(p.x) - (ux * L) / 2, y0 = pv.Y(p.y) - (uy * L) / 2, x1 = x0 + ux * L, y1 = y0 + uy * L;
        const hx = -uy, hy = ux, a = Math.min(4, L * 0.35);
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={1.2} />
            <path d={`M${x1},${y1} L${x1 - ux * a + hx * a * 0.55},${y1 - uy * a + hy * a * 0.55} L${x1 - ux * a - hx * a * 0.55},${y1 - uy * a - hy * a * 0.55} Z`} fill={color} />
          </g>
        );
      })}
    </g>
  );
}

/** World axes, faint. */
export function Axes() {
  return (
    <g>
      <line x1={0} x2={W} y1={pv.Y(0)} y2={pv.Y(0)} stroke={C.grid} strokeWidth={1} />
      <line x1={pv.X(0)} x2={pv.X(0)} y1={0} y2={H} stroke={C.grid} strokeWidth={1} />
    </g>
  );
}
