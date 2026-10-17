// ── Grid-world Markov decision processes for the AI track's figures ─────────
// A grid of cells; some are walls, some are exits with a fixed reward. Every
// other step costs (or pays) the living reward r. A move goes the intended way
// with probability 1 − slip and slides to each side with slip/2 (Russell &
// Norvig's 4×3 world uses slip 0.2); bumping into a wall or the edge stays put.
// Value iteration computes V(s) = max_a Σ P(s'|s,a)[r + γV(s')] one sweep at a
// time, which is what the figure steps through and the chapter quotes.

export type Dir = 0 | 1 | 2 | 3;                              // up, right, down, left
export const DIRS: readonly [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export type Grid = {
  w: number; h: number;
  wall: (x: number, y: number) => boolean;
  /** Exit reward, or null when (x, y) is not an exit. */
  exit: (x: number, y: number) => number | null;
};

export type Params = { living: number; slip: number; gamma: number };

/** Russell & Norvig's 4×3 world: +1 at top right, −1 under it, a wall at (1, 1). y grows downwards. */
export const RN43: Grid = {
  w: 4, h: 3,
  wall: (x, y) => x === 1 && y === 1,
  exit: (x, y) => (x === 3 && y === 0 ? 1 : x === 3 && y === 1 ? -1 : null),
};

const idx = (g: Grid, x: number, y: number) => y * g.w + x;

/** Where action d from (x, y) lands, if it does not slip. */
export function step(g: Grid, x: number, y: number, d: Dir): [number, number] {
  const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
  if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || g.wall(nx, ny)) return [x, y];
  return [nx, ny];
}

/** The outcomes of taking d: [probability, x', y'] for the intended move and the two slides. */
export function outcomes(g: Grid, x: number, y: number, d: Dir, slip: number): [number, number, number][] {
  const side = [((d + 1) % 4) as Dir, ((d + 3) % 4) as Dir];
  const out: [number, number, number][] = [[1 - slip, ...step(g, x, y, d)]];
  if (slip > 0) for (const s of side) out.push([slip / 2, ...step(g, x, y, s)]);
  return out;
}

/** Q(s, a) = Σ P(s'|s,a) [r + γ V(s')] for every action, from the current values V. */
export function qValues(g: Grid, V: Float64Array, x: number, y: number, p: Params) {
  return ([0, 1, 2, 3] as Dir[]).map(d =>
    outcomes(g, x, y, d, p.slip).reduce((s, [pr, nx, ny]) => s + pr * (p.living + p.gamma * V[idx(g, nx, ny)]), 0));
}

/** One synchronous sweep of value iteration; returns the new values and the largest change. */
export function sweep(g: Grid, V: Float64Array, p: Params) {
  const out = new Float64Array(V.length);
  let delta = 0;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.wall(x, y)) continue;
    const e = g.exit(x, y);
    const v = e !== null ? e : Math.max(...qValues(g, V, x, y, p));   // an exit is worth its reward, then the episode ends
    out[idx(g, x, y)] = v;
    delta = Math.max(delta, Math.abs(v - V[idx(g, x, y)]));
  }
  return { V: out, delta };
}

/** The greedy policy for the values V: the best action in each ordinary cell (−1 elsewhere). */
export function policy(g: Grid, V: Float64Array, p: Params) {
  const pi = new Int8Array(g.w * g.h).fill(-1);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.wall(x, y) || g.exit(x, y) !== null) continue;
    const q = qValues(g, V, x, y, p);
    pi[idx(g, x, y)] = q.indexOf(Math.max(...q));
  }
  return pi;
}

/** Sweep until the largest change is below tol (or maxIter sweeps). */
export function solve(g: Grid, p: Params, tol = 1e-6, maxIter = 2000) {
  let V = new Float64Array(g.w * g.h), it = 0;
  for (; it < maxIter; it++) {
    const r = sweep(g, V, p);
    V = r.V;
    if (r.delta < tol) break;
  }
  return { V, iters: it + 1, pi: policy(g, V, p) };
}
