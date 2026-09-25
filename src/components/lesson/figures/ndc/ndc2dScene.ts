// src/components/lesson/figures/ndc/ndc2dScene.ts
// Constants, coordinate conversions and palettes shared by the NDC 2D widget and its plot.

// ── Constants ─────────────────────────────────────────────────────────────────
export const SZ   = 300;            // SVG viewBox size
export const CX   = SZ / 2;
export const CY   = SZ / 2;
export const HALF = SZ * 0.39;      // px from centre for NDC = 1 at zoom = 1

export const MIN_VERTS = 3;
export const MAX_VERTS = 12;
export const LIMIT     = 2.0;       // how far outside the NDC box a vertex may go
export const SNAP      = 0.05;      // Alt-drag snap increment
export const FINE      = 0.22;      // Shift-drag movement multiplier
export const HIT_R     = 15;        // vertex grab radius, in viewBox units
export const AXIS_HIT  = 8;         // gizmo arm grab distance, in viewBox units
export const GIZMO_IN  = 10;        // arms start this far out, so the dot stays grabbable
export const GIZMO_OUT = 40;        // arm length, constant on screen regardless of zoom

export type Pt   = { x: number; y: number };
export type Axis = 0 | 1;           // X, Y

export const AXIS_COLOR = ["#ef4444", "#22c55e"] as const;
export const AXIS_NAME  = ["X", "Y"] as const;
// Screen-space direction of each NDC axis (Y is flipped on screen).
export const AXIS_SCREEN: Pt[] = [{ x: 1, y: 0 }, { x: 0, y: -1 }];

// ── Coordinate conversions ───────────────────────────────────────────────────
// Screen (viewBox px) = centre + pan + ndc * h, with Y flipped.
export const n2s = (ndc: number, axis: "x" | "y", zoom: number, pan: Pt): number => {
  const h = HALF * zoom;
  return axis === "x" ? CX + pan.x + ndc * h : CY + pan.y - ndc * h;
};

export const s2n = (px: number, axis: "x" | "y", zoom: number, pan: Pt): number => {
  const h = HALF * zoom;
  return axis === "x" ? (px - CX - pan.x) / h : -(px - CY - pan.y) / h;
};

/**
 * Keeps the world point under the cursor fixed while the zoom changes.
 * From  q = C + pan + p*h  ⇒  pan' = (q - C)(1 - k) + pan*k,  where k = h'/h.
 * The Y flip cancels out, so the same expression works for both axes.
 */
export const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - CX) * (1 - k) + pan.x * k,
  y: (cursor.y - CY) * (1 - k) + pan.y * k,
});

// ── Palettes ──────────────────────────────────────────────────────────────────
// The widget sits on --code-bg, which follows the theme, so the ink has to too.
export const PALETTES = {
  dark: {
    gridZero: "rgba(255,255,255,0.18)",
    gridOne:  "rgba(255,255,255,0.12)",
    gridSub:  "rgba(255,255,255,0.04)",
    tick:     "rgba(255,255,255,0.28)",
    axis:     "rgba(255,255,255,0.40)",
    bounds:   "rgba(59,130,246,0.35)",
    fill:     "rgba(59,130,246,0.12)",
    stroke:   "rgba(59,130,246,0.50)",
    ring:     "rgba(255,255,255,0.50)",
    halo:     "rgba(255,255,255,0.85)",
  },
  light: {
    gridZero: "rgba(0,0,0,0.30)",
    gridOne:  "rgba(0,0,0,0.18)",
    gridSub:  "rgba(0,0,0,0.07)",
    tick:     "rgba(0,0,0,0.45)",
    axis:     "rgba(0,0,0,0.55)",
    bounds:   "rgba(37,99,235,0.45)",
    fill:     "rgba(37,99,235,0.14)",
    stroke:   "rgba(37,99,235,0.65)",
    ring:     "rgba(0,0,0,0.20)",
    halo:     "rgba(0,0,0,0.55)",
  },
} as const;

// ── Config ────────────────────────────────────────────────────────────────────
// The first five keep the original palette; beyond that, hues are spread by the
// golden angle so any number of vertices stays distinguishable.
export const BASE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];
export const colorFor = (i: number) =>
  i < BASE_COLORS.length ? BASE_COLORS[i] : `hsl(${(210 + i * 137.5) % 360}, 68%, 58%)`;

export const DEFAULT: Pt[] = [
  { x:  0.00, y:  0.60 },
  { x: -0.55, y: -0.45 },
  { x:  0.55, y: -0.45 },
];

export const fmt    = (n: number) => n.toFixed(2);
export const clampN = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
export const snapTo = (v: number) => Math.round(v / SNAP) * SNAP;

/** Shortest distance from point p to segment a→b, for gizmo hit testing. */
export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
}
