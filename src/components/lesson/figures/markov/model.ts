// ── Markov chains, exactly ────────────────────────────────────────────────────
// Shared by the Markov-chain figures. Builds the transition matrix of a walk
// that steps right with probability p and left with q = 1 − p (optionally
// staying put with probability h), with reflecting or absorbing ends. The
// slider values are multiples of 1/20, so every entry is an exact fraction and
// the figures can show P², P³… the way a textbook writes them. Also: the
// stationary distribution of any chain (πP = π solved exactly), the
// classification of its states, and first-step analysis for absorbing walks.

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
export const fSub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const fDiv = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);
export const fNum = (a: Frac) => Number(a.n) / Number(a.d);
export const fIsZero = (a: Frac) => a.n === B0;
export const fStr = (a: Frac) => (a.n === B0 ? "0" : a.d === B1 ? String(a.n) : `${a.n}/${a.d}`);
/** ▶ forced to its text form (U+FE0E): outside the lesson's font Windows draws it as a blue emoji. */
export const PLAY = "▶︎";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", SUB = "₀₁₂₃₄₅₆₇₈₉";
/** Unicode superscript / subscript digits, for labels such as (P³)₂₁. */
export const sup = (n: number) => String(n).split("").map(d => SUP[Number(d)]).join("");
export const sub = (n: number) => String(n).split("").map(d => SUB[Number(d)]).join("");
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
/** Solves A·x = b exactly by Gauss–Jordan elimination; null when A is singular. */
export function fSolve(A: FMat, b: Frac[]): Frac[] | null {
  const n = A.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    const piv = M.findIndex((r, i) => i >= c && !fIsZero(r[c]));
    if (piv < 0) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    const lead = M[c][c];
    M[c] = M[c].map(v => fDiv(v, lead));
    for (let i = 0; i < n; i++) {
      if (i === c || fIsZero(M[i][c])) continue;
      const f = M[i][c];
      M[i] = M[i].map((v, j) => fSub(v, fMul(f, M[c][j])));
    }
  }
  return M.map(r => r[n]);
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

/**
 * Stationary distribution of any stochastic matrix, exact: one equation
 * Σᵢ π(i)·(p_ij − [i = j]) = 0 per column j. Those n equations add up to
 * 0 = 0 (every row of P adds up to 1), so one is redundant and is replaced by
 * Σπ = 1. Null when the answer is not unique (two or more closed classes).
 */
export function stationaryExact(P: FMat): Frac[] | null {
  const n = P.length;
  const A = Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, i) =>
    j === n - 1 ? ONE : fSub(P[i][j], i === j ? ONE : ZERO)));
  const b = Array.from({ length: n }, (_, j) => (j === n - 1 ? ONE : ZERO));
  return fSolve(A, b);
}

// ── Classification ────────────────────────────────────────────────────────────

/**
 * A communicating class: states that can each reach the others. Closed means
 * no arrow leaves it (once in, the chain stays). Period: the gcd of the lengths
 * of the loops inside the class (0 for a lone state the chain only passes).
 */
export type ChainClass = { states: number[]; closed: boolean; period: number };

const igcd = (a: number, b: number): number => (b ? igcd(b, a % b) : Math.abs(a));

export function classify(P: number[][]): ChainClass[] {
  const n = P.length;
  const reach = P.map((r, i) => r.map((v, j) => v > 0 || i === j));
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    if (reach[i][k] && reach[k][j]) reach[i][j] = true;

  const seen = Array(n).fill(false);
  const out: ChainClass[] = [];
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    const members = Array.from({ length: n }, (_, j) => j).filter(j => reach[s][j] && reach[j][s]);
    members.forEach(m => (seen[m] = true));
    const inside = new Set(members);
    const closed = members.every(a => P[a].every((v, b) => v === 0 || inside.has(b)));
    // Period: BFS levels inside the class; every arrow a → b adds |level(a) + 1 − level(b)| to the gcd
    const level = new Map<number, number>([[members[0], 0]]);
    const queue = [members[0]];
    while (queue.length) {
      const a = queue.shift()!;
      for (const b of members) if (P[a][b] > 0 && !level.has(b)) { level.set(b, level.get(a)! + 1); queue.push(b); }
    }
    let g = 0;
    for (const a of members) for (const b of members) if (P[a][b] > 0) g = igcd(g, level.get(a)! + 1 - level.get(b)!);
    out.push({ states: members, closed, period: g });
  }
  return out;
}

// ── Absorbing walks: first-step analysis ──────────────────────────────────────

/**
 * For a walk whose ends 0 and k are absorbing: from each start i, the chance
 * h_i of ending at k (rather than 0) and the expected number of steps t_i
 * until it stops. One step from i lands on j with probability p_ij and the
 * walk starts afresh there, so
 *   h_i = Σⱼ p_ij h_j   (h_0 = 0, h_k = 1)
 *   t_i = 1 + Σⱼ p_ij t_j   (t_0 = t_k = 0)
 * which is a linear system on the inner states 1 … k − 1.
 */
export function absorption(P: FMat): { hit: Frac[]; time: Frac[] } {
  const k = P.length - 1;
  const inner = Array.from({ length: k - 1 }, (_, i) => i + 1);
  const A = inner.map(i => inner.map(j => fSub(i === j ? ONE : ZERO, P[i][j])));
  const h = fSolve(A, inner.map(i => P[i][k])) ?? inner.map(() => ZERO);
  const t = fSolve(A, inner.map(() => ONE)) ?? inner.map(() => ZERO);
  return { hit: [ZERO, ...h, ONE], time: [ZERO, ...t, ZERO] };
}

// ── Plain numbers ─────────────────────────────────────────────────────────────

/** Row vector times matrix, in floats (also for "broken" matrices whose rows don't add up to 1). */
export function vecMul(v: number[], P: number[][]): number[] {
  return P[0].map((_, j) => v.reduce((s, a, i) => s + a * P[i][j], 0));
}

/** Draws the next state of a walker at s. */
export function stepFrom(P: number[][], s: number, rnd: number) {
  let acc = 0;
  for (let j = 0; j < P.length; j++) { acc += P[s][j]; if (rnd < acc) return j; }
  return P.length - 1;
}
