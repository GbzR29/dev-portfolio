// ── Waiting for a pattern of coin flips, exactly ──────────────────────────────
// The prefix chain of a pattern: state k means "the last flips spell the first
// k letters of the pattern", and a flip moves to the longest beginning of the
// pattern that the flips now end with. Solved two ways, which must agree:
// first-step analysis on that chain, (I − Q)·t = 1, and the overlap formula
// E[T] = Σ 1/P(first k letters) over every k whose first k letters equal the
// last k. The chance of heads is a multiple of 1/20, so both are exact.

import { ONE, ZERO, fAdd, fDiv, fMul, fSolve, fSub, twentieths, type FMat, type Frac } from "./model";

export type Flip = "H" | "T";

/** From state k, after the flip c: the longest beginning of the pattern that the flips end with. */
export function nextState(pat: string, k: number, c: Flip) {
  const s = pat.slice(0, k) + c;
  for (let j = Math.min(s.length, pat.length); j > 0; j--) if (s.endsWith(pat.slice(0, j))) return j;
  return 0;
}

/** The chance that given flips spell `word`: p for each H, q for each T. */
export function wordChance(word: string, p: Frac) {
  const q = fSub(ONE, p);
  return word.split("").reduce((a, c) => fMul(a, c === "H" ? p : q), ONE);
}

export type Overlap = { k: number; first: string; last: string; ok: boolean; term: Frac | null };

export function solvePattern(pat: string, pRaw: number) {
  const p = twentieths(pRaw), q = fSub(ONE, p), m = pat.length;
  const next = Array.from({ length: m }, (_, k) => ({ H: nextState(pat, k, "H"), T: nextState(pat, k, "T") }));
  // (I − Q)·t = 1 over the transient states 0 … m − 1 (p and q > 0, so it is never singular)
  const A: FMat = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? ONE : ZERO)));
  next.forEach((n, i) => {
    if (n.H < m) A[i][n.H] = fSub(A[i][n.H], p);
    if (n.T < m) A[i][n.T] = fSub(A[i][n.T], q);
  });
  const time = [...(fSolve(A, Array(m).fill(ONE)) ?? []), ZERO];
  const overlaps: Overlap[] = Array.from({ length: m }, (_, i) => {
    const k = i + 1, first = pat.slice(0, k), last = pat.slice(m - k);
    const ok = first === last;
    return { k, first, last, ok, term: ok ? fDiv(ONE, wordChance(first, p)) : null };
  });
  const total = overlaps.reduce((s, o) => (o.term ? fAdd(s, o.term) : s), ZERO);
  return { p, q, next, time, overlaps, total };
}

/**
 * Up to `runs` runs (flips until the pattern appears), stopping early once
 * `budget` flips are spent so a rare pattern cannot freeze the page.
 */
export function runPatterns(next: { H: number; T: number }[], p: number, rnd: () => number, runs: number, budget = 300000) {
  const m = next.length;
  let done = 0, flips = 0;
  while (done < runs && flips < budget) {
    let k = 0, n = 0;
    while (k < m && flips + n < budget) { k = rnd() < p ? next[k].H : next[k].T; n++; }
    if (k < m) break;
    done++; flips += n;
  }
  return { runs: done, flips };
}
