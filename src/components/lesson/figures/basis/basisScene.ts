// src/components/lesson/figures/basis/basisScene.ts
// ── What this widget shows ────────────────────────────────────────────────────
// A 2×2 matrix is nothing more than "where î and ĵ land". Its first column is
// the new î, its second column is the new ĵ, and every other point follows:
// M·(x, y) = x·î + y·ĵ. Drag the basis vectors and the whole grid comes along.

export const SZ    = 320;             // SVG viewBox size
export const CTR   = SZ / 2;
export const RANGE = 4;               // world units from the centre to the edge at zoom 1
export const U     = SZ / (2 * RANGE);

export const LIMIT    = 5;            // how far a handle may be dragged
export const HIT_R    = 14;           // handle grab radius, in viewBox units
export const SNAP     = 0.1;          // drags land on tenths unless Alt is held
export const MAX_LINES = 160;         // cap for the transformed grid on extreme matrices
export const NEAR_FLAT = 0.3;         // |det| below this gets the "almost flat" warning

export type Pt     = { x: number; y: number };
export type Mat    = { a: number; b: number; c: number; d: number };   // [a b; c d]
export type Handle = "i" | "j" | "v";
export type View   = { zoom: number; pan: Pt };

// ── Math ──────────────────────────────────────────────────────────────────────
export const mul  = (m: Mat, p: Pt): Pt => ({ x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y });
export const det  = (m: Mat) => m.a * m.d - m.b * m.c;
export const inv  = (m: Mat): Mat | null => {
  const D = det(m);
  if (Math.abs(D) < 1e-6) return null;
  return { a: m.d / D, b: -m.b / D, c: -m.c / D, d: m.a / D };
};
export const lerp  = (p: number, q: number, t: number) => p + (q - p) * t;
export const lerpM = (p: Mat, q: Mat, t: number): Mat =>
  ({ a: lerp(p.a, q.a, t), b: lerp(p.b, q.b, t), c: lerp(p.c, q.c, t), d: lerp(p.d, q.d, t) });
export const ease  = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export const rotation = (deg: number): Mat => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r), s = Math.sin(r);
  return { a: c, b: -s, c: s, d: c };
};

/** A pure rotation animates by angle; lerping its entries would shrink it midway. */
export const rotAngle = (m: Mat): number | null =>
  Math.abs(m.a - m.d) < 1e-6 && Math.abs(m.b + m.c) < 1e-6 && Math.abs(det(m) - 1) < 1e-3
    ? Math.atan2(m.c, m.a) : null;

export const clampN = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
export const snapTo = (v: number) => Math.round(v / SNAP) * SNAP;
export const fmt    = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

// World ↔ screen (viewBox) for a given view. Y is flipped on screen.
export const toScreen = (v: View) => (p: Pt): Pt =>
  ({ x: CTR + v.pan.x + p.x * U * v.zoom, y: CTR + v.pan.y - p.y * U * v.zoom });
export const toWorld = (v: View) => (p: Pt): Pt =>
  ({ x: (p.x - CTR - v.pan.x) / (U * v.zoom), y: -(p.y - CTR - v.pan.y) / (U * v.zoom) });

/** Keeps the world point under the cursor fixed while zooming. */
export const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - CTR) * (1 - k) + pan.x * k,
  y: (cursor.y - CTR) * (1 - k) + pan.y * k,
});

/** Grid spacing that keeps roughly 6–16 lines across the view. */
export const gridStep = (zoom: number) => (zoom < 0.45 ? 2 : zoom > 2.2 ? 0.5 : 1);

export const IDENTITY: Mat = { a: 1, b: 0, c: 0, d: 1 };

/**
 * Images of the lines x = k and y = k under m, covering the whole viewport.
 * The k range comes from pulling the viewport corners back through m⁻¹, so the
 * grid fills the canvas however much m stretches or shears it.
 */
export function transformedGrid(m: Mat, view: View): { p: Pt; q: Pt; axis: boolean }[] {
  const W = toWorld(view);
  const corners = [W({ x: 0, y: 0 }), W({ x: SZ, y: 0 }), W({ x: 0, y: SZ }), W({ x: SZ, y: SZ })];
  const mi = inv(m);
  let lo = -8, hi = 8;
  if (mi) {
    const pre = corners.map(c => mul(mi, c));
    lo = Math.floor(Math.min(...pre.map(p => Math.min(p.x, p.y)))) - 1;
    hi = Math.ceil(Math.max(...pre.map(p => Math.max(p.x, p.y)))) + 1;
  }
  // Extreme shears need many lines; past the cap they would be sub-pixel anyway.
  if (hi - lo > MAX_LINES) { const mid = Math.round((hi + lo) / 2); lo = mid - MAX_LINES / 2; hi = mid + MAX_LINES / 2; }
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);

  const out: { p: Pt; q: Pt; axis: boolean }[] = [];
  for (let k = lo; k <= hi; k++) {
    out.push({ p: mul(m, { x: k, y: lo }), q: mul(m, { x: k, y: hi }), axis: k === 0 });
    out.push({ p: mul(m, { x: lo, y: k }), q: mul(m, { x: hi, y: k }), axis: k === 0 });
  }
  return out;
}

/** Visible values of the untransformed grid for one axis. */
export function baseGridValues(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = Math.floor(from / step) * step; v <= to + 1e-9; v += step) out.push(parseFloat(v.toFixed(4)));
  return out;
}

// ── Presets ───────────────────────────────────────────────────────────────────
export const PRESETS: { id: string; label: string; m: Mat; hint: string }[] = [
  { id: "identity", label: "Identity", m: IDENTITY,
    hint: "î = (1,0), ĵ = (0,1). Nothing moves." },
  { id: "scale",    label: "Scale",    m: { a: 1.5, b: 0, c: 0, d: 0.75 },
    hint: "Only the diagonal changes: î is stretched, ĵ is squashed." },
  { id: "rotate",   label: "Rotate",   m: rotation(45),
    hint: "î and ĵ turn together and keep their length. det stays 1." },
  { id: "shear",    label: "Shear",    m: { a: 1, b: 1, c: 0, d: 1 },
    hint: "î stays put, ĵ leans over. Area is unchanged, det = 1." },
  { id: "reflect",  label: "Reflect",  m: { a: -1, b: 0, c: 0, d: 1 },
    hint: "î flips to the left. det < 0 means the space was mirrored — look at the F." },
  { id: "collapse", label: "det = 0",  m: { a: 1, b: 2, c: 0.5, d: 1 },
    hint: "î and ĵ point the same way. The plane collapses onto a line and cannot be undone." },
];

// ── The "F": asymmetric, so rotations and mirror images are obvious ──────────
export const SHAPE: Pt[] = [
  { x: 0.5, y: 0.5 }, { x: 0.5, y: 2.3 }, { x: 1.7, y: 2.3 }, { x: 1.7, y: 1.95 },
  { x: 0.85, y: 1.95 }, { x: 0.85, y: 1.55 }, { x: 1.45, y: 1.55 }, { x: 1.45, y: 1.2 },
  { x: 0.85, y: 1.2 }, { x: 0.85, y: 0.5 },
];

// ── Palettes ──────────────────────────────────────────────────────────────────
export const PALETTES = {
  dark: {
    gridBase: "rgba(255,255,255,0.05)",
    axisBase: "rgba(255,255,255,0.16)",
    grid:     "rgba(59,130,246,0.28)",
    gridAxis: "rgba(147,197,253,0.75)",
    shape:    "rgba(168,85,247,0.30)",
    shapeLn:  "rgba(192,132,252,0.90)",
    ghost:    "rgba(255,255,255,0.28)",
    detPos:   "rgba(250,204,21,0.14)",
    detNeg:   "rgba(239,68,68,0.20)",
    text:     "rgba(255,255,255,0.60)",
    chip:     "rgba(13,17,23,0.80)",
    ring:     "rgba(255,255,255,0.85)",
  },
  light: {
    gridBase: "rgba(0,0,0,0.06)",
    axisBase: "rgba(0,0,0,0.22)",
    grid:     "rgba(37,99,235,0.26)",
    gridAxis: "rgba(29,78,216,0.75)",
    shape:    "rgba(147,51,234,0.20)",
    shapeLn:  "rgba(126,34,206,0.85)",
    ghost:    "rgba(0,0,0,0.30)",
    detPos:   "rgba(202,138,4,0.16)",
    detNeg:   "rgba(220,38,38,0.16)",
    text:     "rgba(0,0,0,0.65)",
    chip:     "rgba(255,255,255,0.85)",
    ring:     "rgba(0,0,0,0.55)",
  },
} as const;

export const COL_I = "#ef4444";
export const COL_J = "#22c55e";
export const COL_V = "#f59e0b";
