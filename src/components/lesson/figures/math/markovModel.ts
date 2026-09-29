// ── Random walks on {0, …, k} as Markov chains ────────────────────────────────
// Shared by the Markov-chain figures: builds the transition matrix of a walk
// that steps right with probability p and left with q = 1 − p (optionally
// staying put with probability h), with reflecting or absorbing ends. The
// slider values are multiples of 1/20, so every entry is an exact fraction and
// the figures can show P², P³… the way a textbook writes them.

// ── Exact fractions ───────────────────────────────────────────────────────────

export type Frac = { n: bigint; d: bigint };

// BigInt constants (the project targets ES2017, which has no 0n literals)
const B0 = BigInt(0), B1 = BigInt(1);
const gcd = (a: bigint, b: bigint): bigint => { a = a < B0 ? -a : a; b = b < B0 ? -b : b; while (b) [a, b] = [b, a % b]; return a || B1; };
export const frac = (n: bigint | number, d: bigint | number = 1): Frac => {
  let N = BigInt(n), D = BigInt(d);
  if (D < B0) { N = -N; D = -D; }
  const g = gcd(N, D);
  return { n: N / g, d: D / g };
};
export const ZERO = frac(0), ONE = frac(1);
export const fAdd = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const fMul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
export const fNum = (a: Frac) => Number(a.n) / Number(a.d);
export const fIsZero = (a: Frac) => a.n === B0;
export const fStr = (a: Frac) => (a.n === B0 ? "0" : a.d === B1 ? String(a.n) : `${a.n}/${a.d}`);
/** A slider value that is a multiple of 1/20, as a fraction. */
export const twentieths = (x: number) => frac(Math.round(x * 20), 20);

export type FMat = Frac[][];

export function fMatMul(A: FMat, B: FMat): FMat {
  return A.map(row => B[0].map((_, j) => row.reduce((s, a, k) => fAdd(s, fMul(a, B[k][j])), ZERO)));
}
export function fIdentity(n: number): FMat {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)));
}
/** Pⁿ by repeated multiplication (n is small in the figures). */
export function fMatPow(P: FMat, n: number): FMat {
  let R = fIdentity(P.length);
  for (let i = 0; i < n; i++) R = fMatMul(R, P);
  return R;
}
/** Row vector times matrix: the distribution one step later. */
export function fVecMul(v: Frac[], P: FMat): Frac[] {
  return P[0].map((_, j) => v.reduce((s, a, i) => fAdd(s, fMul(a, P[i][j])), ZERO));
}

// ── The walk ──────────────────────────────────────────────────────────────────

export type Boundary = "reflecting" | "absorbing";
export type Walk = { k: number; p: number; hold: number; boundary: Boundary };

/** Transition matrix of the walk, exact. Row i = "from i", column j = "to j". */
export function walkMatrix({ k, p, hold, boundary }: Walk): FMat {
  const pf = twentieths(p), qf = twentieths(1 - p), h = twentieths(hold), move = twentieths(1 - hold);
  const n = k + 1;
  const P: FMat = Array.from({ length: n }, () => Array.from({ length: n }, () => ZERO));
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === k) {
      if (boundary === "absorbing") { P[i][i] = ONE; continue; }
      P[i][i] = h;
      P[i][i === 0 ? 1 : k - 1] = move;
      continue;
    }
    P[i][i] = h;
    P[i][i + 1] = fMul(move, pf);
    P[i][i - 1] = fMul(move, qf);
  }
  return P;
}

export const toNumbers = (M: FMat) => M.map(r => r.map(fNum));

/** The chain the exercise uses: k = 3, q = 1/4, p = 3/4, reflecting, no holding. */
export const EXERCISE: Walk = { k: 3, p: 0.75, hold: 0, boundary: "reflecting" };

// ── Paths ─────────────────────────────────────────────────────────────────────

export type Path = { states: number[]; prob: Frac };

/** Every path i → j of exactly n steps with positive probability, most likely first. */
export function pathsBetween(P: FMat, i: number, j: number, n: number, limit = 5000): Path[] {
  const out: Path[] = [];
  const walk = (states: number[], prob: Frac) => {
    if (out.length >= limit) return;
    const s = states[states.length - 1];
    if (states.length === n + 1) { if (s === j) out.push({ states, prob }); return; }
    for (let k = 0; k < P.length; k++) if (!fIsZero(P[s][k])) walk([...states, k], fMul(prob, P[s][k]));
  };
  walk([i], ONE);
  return out.sort((a, b) => fNum(b.prob) - fNum(a.prob));
}

// ── Long run ──────────────────────────────────────────────────────────────────

/**
 * Stationary distribution of a reflecting walk by detailed balance:
 * π(i)·P(i, i+1) = π(i+1)·P(i+1, i), then normalised. Null for absorbing walks.
 */
export function stationary(P: FMat, boundary: Boundary): number[] | null {
  if (boundary === "absorbing") return null;
  const w = [1];
  for (let i = 0; i + 1 < P.length; i++) {
    const down = fNum(P[i + 1][i]);
    if (down === 0) return null;
    w.push((w[i] * fNum(P[i][i + 1])) / down);
  }
  const s = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / s);
}

/** Draws the next state of a walker at s. */
export function stepFrom(P: number[][], s: number, rnd: number) {
  let acc = 0;
  for (let j = 0; j < P.length; j++) { acc += P[s][j]; if (rnd < acc) return j; }
  return P.length - 1;
}
