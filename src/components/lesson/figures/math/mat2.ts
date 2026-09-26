// ── 2 × 2 matrices for the Linear Algebra figures ─────────────────────────────
// A matrix [[a, b], [c, d]] is stored row by row as [a, b, c, d]. Its columns,
// (a, c) and (b, d), are where the unit steps (1, 0) and (0, 1) land.

import type { Pt } from "@/components/lesson/kit/figure";

export type M2 = [number, number, number, number];

export const I2: M2 = [1, 0, 0, 1];
export const apply = (m: M2, p: Pt): Pt => ({ x: m[0] * p.x + m[1] * p.y, y: m[2] * p.x + m[3] * p.y });
/** m · n: apply n first, then m. */
export const mul = (m: M2, n: M2): M2 => [
  m[0] * n[0] + m[1] * n[2], m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2], m[2] * n[1] + m[3] * n[3],
];
export const det = (m: M2) => m[0] * m[3] - m[1] * m[2];
export const inverse = (m: M2): M2 | null => {
  const d = det(m);
  if (Math.abs(d) < 1e-9) return null;
  return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d];
};
export const rot = (deg: number): M2 => {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180);
  return [c, -s, s, c];
};

/** Real eigenvalues (largest first), or the complex pair re ± im·i. */
export function eigen(m: M2): { real: true; l1: number; l2: number } | { real: false; re: number; im: number } {
  const tr = m[0] + m[3], disc = tr * tr - 4 * det(m);
  if (disc < -1e-9) return { real: false, re: tr / 2, im: Math.sqrt(-disc) / 2 };
  const r = Math.sqrt(Math.max(0, disc));
  return { real: true, l1: (tr + r) / 2, l2: (tr - r) / 2 };
}

/** A unit eigenvector for a real eigenvalue λ: a non-zero row of (A − λI), turned a quarter. */
export function eigvec(m: M2, l: number): Pt {
  const a = m[0] - l, b = m[1], c = m[2], d = m[3] - l;
  let v: Pt = Math.hypot(a, b) > Math.hypot(c, d) ? { x: -b, y: a } : { x: -d, y: c };
  if (Math.hypot(v.x, v.y) < 1e-9) v = { x: 1, y: 0 };      // A = λI: every direction works
  const n = Math.hypot(v.x, v.y);
  return { x: v.x / n, y: v.y / n };
}

/** Number formatting for readouts: 2 decimals, a real minus sign, no "−0.00". */
export const n2 = (v: number) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2).replace("-", "−");

/** The letter F: no symmetry, so turns and mirror images are easy to tell apart. */
export const F_SHAPE: Pt[] = [
  [0, 0], [0.4, 0], [0.4, 0.8], [1, 0.8], [1, 1.2], [0.4, 1.2], [0.4, 1.6], [1.3, 1.6], [1.3, 2], [0, 2],
].map(([x, y]) => ({ x, y }));
