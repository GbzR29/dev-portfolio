// ── Word embeddings for the AI track's Embeddings chapter ────────────────────
// A tiny corpus (the FARM corpus), its vocabulary, the (centre, context) pairs
// of skip-gram, and a skip-gram model with a full softmax, small enough to
// train in a browser. No side effects on import: the numbers quoted in the
// chapter come from running this file under Node.

import { gauss, seeded, type Rng } from "./mlp";
import { softmax } from "./cnn";

// ── The FARM corpus ──────────────────────────────────────────────────────────

export const GROUPS = {
  animal: ["cat", "dog", "cow", "horse"],
  food:   ["bread", "apple", "cheese", "rice"],
  drink:  ["water", "milk", "juice"],
  place:  ["house", "farm", "park"],
  verb:   ["eats", "drinks", "sleeps", "runs"],
  other:  ["in", "the"],
} as const;
export type Group = keyof typeof GROUPS;

export const VOCAB: string[] = Object.values(GROUPS).flat();
export const groupOf = (w: string) => (Object.keys(GROUPS) as Group[]).find(g => (GROUPS[g] as readonly string[]).includes(w))!;

const pick = <T,>(xs: readonly T[], rng: Rng) => xs[Math.floor(rng() * xs.length)];

/** n sentences from four templates: "the cat eats bread", "the dog drinks milk", "the cow sleeps in the farm", "the horse runs in the park". */
export function farmCorpus(n: number, rng: Rng): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < n; i++) {
    const a = pick(GROUPS.animal, rng);
    switch (i % 4) {
      case 0: out.push(["the", a, "eats", pick(GROUPS.food, rng)]); break;
      case 1: out.push(["the", a, "drinks", pick(GROUPS.drink, rng)]); break;
      case 2: out.push(["the", a, "sleeps", "in", "the", pick(GROUPS.place, rng)]); break;
      default: out.push(["the", a, "runs", "in", "the", pick(GROUPS.place, rng)]);
    }
  }
  return out;
}

/** The same words in a random order: every context is noise ("break it"). */
export function shuffled(corpus: string[][], rng: Rng): string[][] {
  const all = corpus.flat();
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const out: string[][] = [];
  let k = 0;
  for (const s of corpus) { out.push(all.slice(k, k + s.length)); k += s.length; }
  return out;
}

/** Skip-gram training pairs: every word with each word up to `window` places before or after it in its sentence. */
export function pairs(corpus: string[][], window: number): [number, number][] {
  const id = new Map(VOCAB.map((w, i) => [w, i]));
  const out: [number, number][] = [];
  for (const s of corpus) for (let i = 0; i < s.length; i++)
    for (let j = Math.max(0, i - window); j <= Math.min(s.length - 1, i + window); j++)
      if (j !== i) out.push([id.get(s[i])!, id.get(s[j])!]);
  return out;
}

// ── Skip-gram with a full softmax ────────────────────────────────────────────

/**
 * Two tables of n × d numbers: E[w] is word w's embedding (used when w is the
 * centre), U[c] its output vector (used when c is the context). The model says
 * p(c | w) = softmax_c(U[c] · E[w]); training lowers −ln p(context | centre).
 */
export class SkipGram {
  readonly n: number; readonly d: number;
  E: Float64Array; U: Float64Array;

  constructor(n: number, d: number, rng: Rng) {
    this.n = n; this.d = d;
    this.E = Float64Array.from({ length: n * d }, () => 0.5 * gauss(rng));
    this.U = Float64Array.from({ length: n * d }, () => 0.5 * gauss(rng));
  }

  vec(w: number) { return this.E.subarray(w * this.d, (w + 1) * this.d); }

  /** p(· | w): one probability per word of the vocabulary. */
  probs(w: number) {
    const z = new Float64Array(this.n), e = this.vec(w);
    for (let c = 0; c < this.n; c++) {
      let s = 0;
      for (let k = 0; k < this.d; k++) s += this.U[c * this.d + k] * e[k];
      z[c] = s;
    }
    return softmax(z);
  }

  /** One SGD step on one (centre, context) pair; returns its loss. */
  step(w: number, ctx: number, lr: number) {
    const p = this.probs(w), d = this.d, e = this.vec(w);
    const gE = new Float64Array(d);
    for (let c = 0; c < this.n; c++) {
      const g = p[c] - (c === ctx ? 1 : 0);                      // ∂L/∂z_c, as for any softmax
      for (let k = 0; k < d; k++) { gE[k] += g * this.U[c * d + k]; this.U[c * d + k] -= lr * g * e[k]; }
    }
    for (let k = 0; k < d; k++) e[k] -= lr * gE[k];
    return -Math.log(Math.max(p[ctx], 1e-12));
  }
}

/** One pass over the pairs in a shuffled order; returns the mean loss. */
export function sgEpoch(m: SkipGram, ps: [number, number][], lr: number, rng: Rng) {
  const order = ps.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let loss = 0;
  for (const i of order) loss += m.step(ps[i][0], ps[i][1], lr);
  return loss / ps.length;
}

/** cos θ = a·b / (|a| |b|): 1 = same direction, 0 = unrelated, −1 = opposite. */
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>) {
  let ab = 0, aa = 0, bb = 0;
  for (let k = 0; k < a.length; k++) { ab += a[k] * b[k]; aa += a[k] * a[k]; bb += b[k] * b[k]; }
  return ab / (Math.sqrt(aa * bb) || 1);
}

let farm8: SkipGram | null = null;

/** The chapter's d = 8 model: FARM corpus (200 sentences), window 2, 60 epochs, η = 0.05. Trained once, on first use. */
export function farmModel(): SkipGram {
  if (!farm8) {
    const m = new SkipGram(VOCAB.length, 8, seeded(3)), rng = seeded(4), ps = pairs(farmCorpus(200, seeded(1)), 2);
    for (let e = 0; e < 60; e++) sgEpoch(m, ps, 0.05, rng);
    farm8 = m;
  }
  return farm8;
}

/** The `k` words whose embeddings have the highest cosine with word w's. */
export function nearest(m: SkipGram, w: number, k: number) {
  return VOCAB.map((_, j) => ({ j, cos: cosine(m.vec(w), m.vec(j)) }))
    .filter(x => x.j !== w).sort((a, b) => b.cos - a.cos).slice(0, k);
}
