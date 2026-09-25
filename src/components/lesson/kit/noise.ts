// ── Gradient noise for the figures ────────────────────────────────────────────
// A readable Perlin-style gradient noise: every integer lattice corner gets a
// pseudo-random unit gradient from a hash of its coordinates and the seed, the
// noise at a point is the four corner dot products blended with the quintic
// fade. The pieces are exported separately so figures can draw each step.

import { hash2 } from "./figure";

export type V2 = [number, number];

/** Unit gradient at lattice corner (ix, iy): a random angle, so every direction is possible. */
export function gradient(ix: number, iy: number, seed: number): V2 {
  const a = hash2(ix, iy, seed) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
}

/** 6t⁵ − 15t⁴ + 10t³: zero slope and zero curvature at t = 0 and t = 1. */
export const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Everything Perlin noise computes for one point, for figures that show the steps. */
export function perlinParts(x: number, y: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const corners: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const grads = corners.map(([cx, cy]) => gradient(ix + cx, iy + cy, seed));
  const offs = corners.map(([cx, cy]) => [fx - cx, fy - cy] as V2);
  const dots = grads.map((g, i) => g[0] * offs[i][0] + g[1] * offs[i][1]);
  const u = fade(fx), v = fade(fy);
  const bottom = dots[0] + (dots[1] - dots[0]) * u;
  const top = dots[2] + (dots[3] - dots[2]) * u;
  const value = bottom + (top - bottom) * v;
  return { ix, iy, fx, fy, grads, offs, dots, u, v, bottom, top, value };
}

/** 2D gradient noise in about [−0.7, 0.7] (√½ is the theoretical bound). */
export function perlin2(x: number, y: number, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const g00 = gradient(ix, iy, seed), g10 = gradient(ix + 1, iy, seed);
  const g01 = gradient(ix, iy + 1, seed), g11 = gradient(ix + 1, iy + 1, seed);
  const d00 = g00[0] * fx + g00[1] * fy;
  const d10 = g10[0] * (fx - 1) + g10[1] * fy;
  const d01 = g01[0] * fx + g01[1] * (fy - 1);
  const d11 = g11[0] * (fx - 1) + g11[1] * (fy - 1);
  const u = fade(fx), v = fade(fy);
  const a = d00 + (d10 - d00) * u, b = d01 + (d11 - d01) * u;
  return a + (b - a) * v;
}

/** 2D value noise: random heights at the corners, blended with the same fade. In [0, 1]. */
export function value2(x: number, y: number, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const u = fade(x - ix), v = fade(y - iy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 1D gradient noise, same construction on a line. About [−0.5, 0.5]. */
export function perlin1(x: number, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const g0 = hash2(i, 0, seed) * 2 - 1, g1 = hash2(i + 1, 0, seed) * 2 - 1;
  const u = fade(f);
  return g0 * f + (g1 * (f - 1) - g0 * f) * u;
}

export type FbmParams = { octaves: number; lacunarity: number; gain: number };

/**
 * Fractal Brownian motion: octaves of noise, each at `lacunarity` times the
 * frequency and `gain` times the amplitude of the previous one. The sum is
 * divided by the total amplitude so the range does not grow with octaves.
 */
export function fbm2(x: number, y: number, seed: number, { octaves, lacunarity, gain }: FbmParams) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    // Each octave gets its own seed and a small offset so lattice points do not line up
    sum += amp * perlin2(x * freq + o * 17.13, y * freq - o * 9.71, seed + o * 101);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
