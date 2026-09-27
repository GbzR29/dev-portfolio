// ── Sorting traces ────────────────────────────────────────────────────────────
// Runs a sorting algorithm on a copy of the input and records one frame per
// comparison, swap or write, so SortFigure can play the sort back step by
// step. No drawing here: only the algorithms and what they touched.

import { mulberry32 } from "@/components/lesson/kit/figure";

export type SortAlgo = "bubble" | "insertion" | "selection" | "merge" | "quick" | "quick-random";
export type InputKind = "random" | "sorted" | "reversed" | "few";
export type Mark = "cmp" | "swap" | "write" | "pivot" | "key";
export type Kind = "start" | "cmp" | "swap" | "min" | "write" | "split" | "pivot" | "placed" | "early" | "done";

export type Frame = {
  a: number[];
  marks: [number, Mark][];
  range?: [number, number];     // the part of the array being worked on
  cmp: number;                  // comparisons so far
  mv: number;                   // swaps, shifts or writes so far (see moveLabel)
  kind: Kind;
  args: number[];
  done: number[];               // indices already in their final place
};

/** What `mv` counts for each algorithm. */
export const moveKind = (algo: SortAlgo): "swaps" | "shifts" | "writes" =>
  algo === "insertion" ? "shifts" : algo === "merge" ? "writes" : "swaps";

export function makeInput(kind: InputKind, n: number, seed: number): number[] {
  const rnd = mulberry32(seed);
  if (kind === "sorted") return Array.from({ length: n }, (_, i) => i + 1);
  if (kind === "reversed") return Array.from({ length: n }, (_, i) => n - i);
  if (kind === "few") return Array.from({ length: n }, () => 1 + Math.floor(rnd() * 4));
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; --i) {           // Fisher–Yates shuffle
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class Rec {
  frames: Frame[] = [];
  cmp = 0;
  mv = 0;
  done = new Set<number>();
  range?: [number, number];
  constructor(public a: number[]) { this.snap([], "start", []); }

  snap(marks: [number, Mark][], kind: Kind, args: number[]) {
    this.frames.push({ a: [...this.a], marks, range: this.range, cmp: this.cmp, mv: this.mv, kind, args, done: [...this.done] });
  }
  /** a[i] − a[j], recorded as one comparison. */
  compare(i: number, j: number, extra: [number, Mark][] = []) {
    this.cmp++;
    this.snap([...extra, [i, "cmp"], [j, "cmp"]], "cmp", [i, j]);
    return this.a[i] - this.a[j];
  }
  swap(i: number, j: number, extra: [number, Mark][] = []) {
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.mv++;
    this.snap([...extra, [i, "swap"], [j, "swap"]], "swap", [i, j]);
  }
  finish() {
    this.range = undefined;
    this.a.forEach((_, i) => this.done.add(i));
    this.snap([], "done", []);
  }
}

function bubble(r: Rec) {
  const n = r.a.length;
  for (let pass = 0; pass < n - 1; ++pass) {
    let swapped = false;
    for (let j = 0; j + 1 < n - pass; ++j) {
      if (r.compare(j, j + 1) > 0) { r.swap(j, j + 1); swapped = true; }
    }
    r.done.add(n - 1 - pass);
    if (!swapped) { r.snap([], "early", []); break; }
  }
}

function insertion(r: Rec) {
  // Drawn as adjacent swaps so the key visibly walks left; each one is a shift.
  for (let i = 1; i < r.a.length; ++i) {
    for (let j = i; j > 0; --j) {
      if (r.compare(j - 1, j, [[j, "key"]]) <= 0) break;
      r.swap(j - 1, j);
    }
  }
}

function selection(r: Rec) {
  const n = r.a.length;
  for (let i = 0; i + 1 < n; ++i) {
    let m = i;
    for (let j = i + 1; j < n; ++j) {
      if (r.compare(j, m, [[m, "key"]]) < 0) { m = j; r.snap([[m, "key"]], "min", [m]); }
    }
    if (m !== i) r.swap(i, m);
    r.done.add(i);
  }
}

function merge(r: Rec, aux: number[], lo: number, hi: number) {
  if (hi <= lo) return;
  const mid = lo + Math.floor((hi - lo) / 2);
  merge(r, aux, lo, mid);
  merge(r, aux, mid + 1, hi);
  r.range = [lo, hi];
  r.snap([], "split", [lo, mid, hi]);
  for (let k = lo; k <= hi; ++k) aux[k] = r.a[k];
  let i = lo, j = mid + 1;
  for (let k = lo; k <= hi; ++k) {
    if (i > mid) r.a[k] = aux[j++];
    else if (j > hi) r.a[k] = aux[i++];
    else { r.cmp++; r.a[k] = aux[j] < aux[i] ? aux[j++] : aux[i++]; }   // ties: take the left one
    r.mv++;
    r.snap([[k, "write"]], "write", [k]);
  }
  r.range = undefined;
}

function quick(r: Rec, lo: number, hi: number, rnd: (() => number) | null) {
  if (lo > hi) return;
  if (lo === hi) { r.done.add(lo); return; }
  r.range = [lo, hi];
  if (rnd) {
    const p = lo + Math.floor(rnd() * (hi - lo + 1));
    if (p !== hi) r.swap(p, hi, [[p, "pivot"]]);
  }
  r.snap([[hi, "pivot"]], "pivot", [hi]);
  let i = lo;                                  // a[lo..i-1] ≤ pivot
  for (let j = lo; j < hi; ++j) {
    if (r.compare(j, hi, [[hi, "pivot"]]) <= 0) {
      if (i !== j) r.swap(i, j, [[hi, "pivot"]]);
      i++;
    }
  }
  if (i !== hi) r.swap(i, hi);
  r.done.add(i);
  r.snap([], "placed", [i]);
  r.range = undefined;
  quick(r, lo, i - 1, rnd);
  quick(r, i + 1, hi, rnd);
}

export function traceSort(algo: SortAlgo, input: number[], seed: number): Frame[] {
  const r = new Rec([...input]);
  const n = input.length;
  if (algo === "bubble") bubble(r);
  else if (algo === "insertion") insertion(r);
  else if (algo === "selection") selection(r);
  else if (algo === "merge") merge(r, new Array(n), 0, n - 1);
  else quick(r, 0, n - 1, algo === "quick-random" ? mulberry32(seed * 7 + 1) : null);
  r.finish();
  return r.frames;
}
