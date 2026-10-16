// ── 2D data sets for the Neural Networks chapters ────────────────────────────
// Generated from a fixed seed, so every run (the figures and the numbers in the
// text) sees exactly the same points. Coordinates lie in [−1, 1]².

import type { Rng } from "./mlp";

export type Pts = { X: [number, number][]; Y: number[] };

/** The four XOR corners. */
export const XOR: Pts = { X: [[0, 0], [0, 1], [1, 0], [1, 1]], Y: [0, 1, 1, 0] };

/** Uniform points; class 1 inside the circle of radius 0.6. `flip` = fraction of labels swapped (noise). */
export function circle(n: number, rng: Rng, flip = 0): Pts {
  const X: [number, number][] = [], Y: number[] = [];
  for (let i = 0; i < n; i++) {
    const x: [number, number] = [rng() * 2 - 1, rng() * 2 - 1];
    let y = Math.hypot(x[0], x[1]) < 0.6 ? 1 : 0;
    if (rng() < flip) y = 1 - y;
    X.push(x); Y.push(y);
  }
  return { X, Y };
}

/** XOR as a cloud: class 1 where x·y < 0, points kept away from the axes by `gap`. */
export function xorCloud(n: number, rng: Rng, flip = 0, gap = 0.08): Pts {
  const X: [number, number][] = [], Y: number[] = [];
  while (X.length < n) {
    const x: [number, number] = [rng() * 2 - 1, rng() * 2 - 1];
    if (Math.abs(x[0]) < gap || Math.abs(x[1]) < gap) continue;
    let y = x[0] * x[1] < 0 ? 1 : 0;
    if (rng() < flip) y = 1 - y;
    X.push(x); Y.push(y);
  }
  return { X, Y };
}

/** Two interleaved spiral arms, one per class, with a little jitter. */
export function spiral(n: number, rng: Rng, jitter = 0.04): Pts {
  const X: [number, number][] = [], Y: number[] = [];
  for (let i = 0; i < n; i++) {
    const y = i % 2, r = 0.1 + 0.85 * (Math.floor(i / 2) / Math.ceil(n / 2));
    const th = r * 3 * Math.PI + y * Math.PI;
    X.push([r * Math.cos(th) + jitter * (rng() * 2 - 1), r * Math.sin(th) + jitter * (rng() * 2 - 1)]);
    Y.push(y);
  }
  return { X, Y };
}
