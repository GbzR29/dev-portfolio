// ── Ready-made graphs for the Discrete Mathematics widgets ───────────────────
// All in a 560 × 300 viewBox. Each preset is a function so that every load
// gets a fresh copy the reader can edit.

import { complete, cycle, petersen, ring, type Graph, type Pt } from "./graphModel";

const W = 560, H = 300, CX = W / 2, CY = H / 2;

export const PRESETS = {
  empty: (): Graph => ({ pts: ring(5, CX, CY, 105), edges: [] }),
  k4: (): Graph => ({ pts: ring(4, CX, CY, 110, Math.PI / 4), edges: complete(4) }),
  k5: (): Graph => ({ pts: ring(5, CX, CY, 115), edges: complete(5) }),
  path5: (): Graph => ({ pts: Array.from({ length: 5 }, (_, i) => ({ x: 120 + i * 80, y: CY + (i % 2 ? -40 : 40) })), edges: [[0, 1], [1, 2], [2, 3], [3, 4]] }),
  c6: (): Graph => ({ pts: ring(6, CX, CY, 110), edges: cycle(6) }),
  twoTriangles: (): Graph => ({
    pts: [...ring(3, CX - 120, CY + 10, 80), ...ring(3, CX + 120, CY + 10, 80)],
    edges: [...cycle(3), ...cycle(3, 3)],
  }),
  k33: (): Graph => ({
    pts: [...[0, 1, 2].map(i => ({ x: CX - 150 + i * 150, y: 60 })), ...[0, 1, 2].map(i => ({ x: CX - 150 + i * 150, y: 240 }))],
    edges: [0, 1, 2].flatMap(i => [3, 4, 5].map(j => [i, j] as [number, number])),
  }),
  petersen: (): Graph => petersen(CX, CY + 8, 125, 60),
  /** Königsberg: north bank A, island B, south bank C, east island D; seven bridges. */
  konigsberg: (): Graph => ({
    pts: [{ x: 200, y: 50 }, { x: 200, y: 150 }, { x: 200, y: 250 }, { x: 400, y: 150 }],
    edges: [[0, 1], [0, 1], [1, 2], [1, 2], [0, 3], [1, 3], [2, 3]],
  }),
  /** The "house": a square with both diagonals and a roof. */
  house: (): Graph => ({
    pts: [{ x: 210, y: 270 }, { x: 350, y: 270 }, { x: 350, y: 140 }, { x: 210, y: 140 }, { x: 280, y: 40 }],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3], [3, 4], [4, 2]],
  }),
  /** Octahedron: every vertex degree 4. */
  octahedron: (): Graph => {
    const pts: Pt[] = [...ring(3, CX, CY + 15, 125), ...ring(3, CX, CY + 15, 52, Math.PI)];
    return { pts, edges: [...cycle(3), ...cycle(3, 3), [0, 4], [0, 5], [1, 5], [1, 3], [2, 3], [2, 4]] };
  },
  /** Dodecahedron (Hamilton's icosian game): 20 vertices, all of degree 3. */
  dodecahedron: (): Graph => {
    // outer pentagon, a ring of 10 (even ones face out, odd ones in), inner pentagon
    const pts = [...ring(5, CX, CY + 8, 138), ...ring(10, CX, CY + 8, 92), ...ring(5, CX, CY + 8, 46, Math.PI / 5)];
    const edges: [number, number][] = [
      ...cycle(5),
      ...Array.from({ length: 5 }, (_, i) => [i, 5 + 2 * i] as [number, number]),
      ...cycle(10, 5),
      ...Array.from({ length: 5 }, (_, i) => [5 + 2 * i + 1, 15 + i] as [number, number]),
      ...cycle(5, 15),
    ];
    return { pts, edges };
  },
};

export type PresetId = keyof typeof PRESETS;
