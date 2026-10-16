// ── STROKES: the CNN chapter's running data set ──────────────────────────────
// 12×12 grayscale images with one 5-pixel stroke: class 0 "—" horizontal,
// class 1 "|" vertical, class 2 "/" diagonal. Stroke brightness 0.7…1, plus a
// little noise on every pixel. `side` picks where the stroke's centre column
// lies: "left" = columns 2–5, "right" = columns 6–9, "any" = 2–9. Training on
// the left half and testing on the right half is the chapter's shift test.

import type { Rng } from "./mlp";
import type { Img, Sample } from "./cnn";

export const N = 12;
export const CLASSES = ["—", "|", "/"] as const;

export type Side = "left" | "right" | "any";

/** The 5 pixel offsets (dy, dx) of each stroke around its centre. */
const OFFSETS: [number, number][][] = [
  [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2]],
  [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0]],
  [[2, -2], [1, -1], [0, 0], [-1, 1], [-2, 2]],
];

/** One stroke of class y with its centre at (cy, cx); noise from rng when given. */
export function stroke(y: number, cy: number, cx: number, rng?: Rng, bright = 1): Img {
  const px = new Float64Array(N * N);
  if (rng) for (let i = 0; i < px.length; i++) px[i] = Math.max(0, 0.12 * (rng() - 0.5) + 0.05);
  for (const [dy, dx] of OFFSETS[y]) {
    const r = cy + dy, c = cx + dx;
    if (r >= 0 && r < N && c >= 0 && c < N) px[r * N + c] = Math.min(1, bright + (rng ? 0.1 * (rng() - 0.5) : 0));
  }
  return { n: N, px };
}

const COLS: Record<Side, [number, number]> = { left: [2, 5], right: [6, 9], any: [2, 9] };

export function strokes(count: number, side: Side, rng: Rng): Sample[] {
  const [c0, c1] = COLS[side];
  return Array.from({ length: count }, (_, i) => {
    const y = i % 3;
    const cy = 2 + Math.floor(rng() * (N - 4));                // centre rows 2–9: the stroke always fits
    const cx = c0 + Math.floor(rng() * (c1 - c0 + 1));
    return { img: stroke(y, cy, cx, rng, 0.7 + 0.3 * rng()), y };
  });
}
