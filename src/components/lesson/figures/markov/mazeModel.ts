// ── A mouse in a 3 × 3 maze, exactly ──────────────────────────────────────────
// Rooms A…I, row by row. Each of the 12 inner walls may hold an open door; the
// mouse leaves a room through one of its open doors, all equally likely. The
// cheese room is absorbing. First-step analysis gives the expected number of
// moves tᵢ from every room, and the fundamental matrix N = (I − Q)⁻¹ gives the
// expected number of visits to every room, all as exact fractions.

import { ONE, ZERO, fSolve, frac, type FMat, type Frac } from "./model";

export const ROOMS = 9;
export const NAMES = "ABCDEFGHI";

/** The 12 inner walls as pairs of rooms: 6 between columns, then 6 between rows. */
export const EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8],
  [0, 3], [1, 4], [2, 5], [3, 6], [4, 7], [5, 8],
];

/** The maze of the lesson: every door open. */
export const ALL_OPEN: readonly boolean[] = EDGES.map(() => true);
/** Index of the door between rooms a and b (a < b), or −1. */
export const doorOf = (a: number, b: number) => EDGES.findIndex(([x, y]) => x === a && y === b);

export function neighbours(open: readonly boolean[]): number[][] {
  const nb: number[][] = Array.from({ length: ROOMS }, () => []);
  EDGES.forEach(([a, b], e) => { if (open[e]) { nb[a].push(b); nb[b].push(a); } });
  nb.forEach(l => l.sort((x, y) => x - y));
  return nb;
}

/** Rooms from which the cheese can be reached (doors work both ways: its component). */
function component(nb: number[][], from: number) {
  const seen = Array(ROOMS).fill(false);
  const stack = [from];
  seen[from] = true;
  while (stack.length) {
    const r = stack.pop()!;
    for (const n of nb[r]) if (!seen[n]) { seen[n] = true; stack.push(n); }
  }
  return seen as boolean[];
}

export type MazeSolution = {
  nb: number[][];
  /** Expected moves to the cheese from each room; null = it may never arrive. */
  time: (Frac | null)[];
  /** Expected visits to each room before the cheese, starting from `start` (row of N); null when the start cannot reach it. */
  visits: Frac[] | null;
};

export function solveMaze(open: readonly boolean[], cheese: number, start: number): MazeSolution {
  const nb = neighbours(open);
  const reach = component(nb, cheese);
  const T = Array.from({ length: ROOMS }, (_, r) => r).filter(r => reach[r] && r !== cheese);   // transient rooms
  const at = new Map(T.map((r, i) => [r, i]));
  // I − Q over the transient rooms: Q[i][j] = 1/deg(i) when a door joins them
  const A: FMat = T.map((r, i) => T.map((s, j) => {
    const q = nb[r].includes(s) ? frac(1, nb[r].length) : ZERO;
    return i === j ? frac(1) : frac(-q.n, q.d);
  }));
  const tLocal = T.length ? fSolve(A, T.map(() => ONE)) : [];
  const time: (Frac | null)[] = Array.from({ length: ROOMS }, (_, r) =>
    r === cheese ? ZERO : at.has(r) && tLocal ? tLocal[at.get(r)!] : null);

  let visits: Frac[] | null = null;
  if (start === cheese) visits = Array(ROOMS).fill(ZERO);
  else if (at.has(start)) {
    // Row `start` of N solves y (I − Q) = e_start, i.e. (I − Q)ᵀ yᵀ = e_start
    const At: FMat = T.map((_, i) => T.map((__, j) => A[j][i]));
    const y = fSolve(At, T.map(r => (r === start ? ONE : ZERO)));
    if (y) visits = Array.from({ length: ROOMS }, (_, r) => (at.has(r) ? y[at.get(r)!] : ZERO));
  }
  return { nb, time, visits };
}
