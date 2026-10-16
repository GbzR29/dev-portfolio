// ── A tiny convolutional network for the AI track's Deep Learning figures ────
// The networks the CNN chapter compares, small enough to train in a browser:
//   • Cnn:   K 3×3 filters → ReLU → global max pool → dense softmax over classes
//   • Dense: flattened pixels → one ReLU hidden layer → dense softmax
// Both are trained with Adam on the softmax cross-entropy, with hand-written
// backpropagation. No side effects on import: the numbers quoted in the chapter
// come from running this file under Node.

import { gauss, type Rng } from "./mlp";

/** A square grayscale image, row-major, values 0…1. */
export type Img = { n: number; px: Float64Array };

// ── Convolution ──────────────────────────────────────────────────────────────

/**
 * One 3×3 (or k×k) filter slid over the image ("valid" when pad = 0): out[r][c] =
 * b + Σ_{i,j} w[i][j] · in[r·stride + i − pad][c·stride + j − pad], pixels outside the image count as 0.
 * Deep-learning libraries call this convolution, although mathematically it is cross-correlation (no flip).
 */
export function conv2d(img: Img, w: ArrayLike<number>, k: number, b = 0, pad = 0, stride = 1): Img {
  const m = Math.floor((img.n + 2 * pad - k) / stride) + 1;
  const px = new Float64Array(m * m);
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) {
    let s = b;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const y = r * stride + i - pad, x = c * stride + j - pad;
      if (y >= 0 && y < img.n && x >= 0 && x < img.n) s += w[i * k + j] * img.px[y * img.n + x];
    }
    px[r * m + c] = s;
  }
  return { n: m, px };
}

export const outSize = (n: number, k: number, pad: number, stride: number) => Math.floor((n + 2 * pad - k) / stride) + 1;

// ── Softmax ──────────────────────────────────────────────────────────────────

/** softmax(z)_i = e^{z_i} / Σ e^{z_j}, computed after subtracting max z so no exponent overflows. */
export function softmax(z: ArrayLike<number>): Float64Array {
  let mx = -Infinity;
  for (let i = 0; i < z.length; i++) mx = Math.max(mx, z[i]);
  const p = new Float64Array(z.length);
  let s = 0;
  for (let i = 0; i < z.length; i++) { p[i] = Math.exp(z[i] - mx); s += p[i]; }
  for (let i = 0; i < z.length; i++) p[i] /= s;
  return p;
}

// ── Parameters + Adam ────────────────────────────────────────────────────────

/** Every model keeps its parameters as a list of flat arrays, so one Adam serves both. */
type Params = Float64Array[];
export type Adam = { lr: number; t: number; m: Params; v: Params };
const zerosLike = (ps: Params) => ps.map(p => new Float64Array(p.length));
export const makeAdam = (ps: Params, lr: number): Adam => ({ lr, t: 0, m: zerosLike(ps), v: zerosLike(ps) });

function adamStep(ps: Params, gs: Params, o: Adam) {
  o.t++;
  const b1 = 0.9, b2 = 0.999, c1 = 1 - b1 ** o.t, c2 = 1 - b2 ** o.t;
  ps.forEach((p, k) => {
    const g = gs[k], m = o.m[k], v = o.v[k];
    for (let j = 0; j < p.length; j++) {
      m[j] = b1 * m[j] + (1 - b1) * g[j];
      v[j] = b2 * v[j] + (1 - b2) * g[j] * g[j];
      p[j] -= (o.lr * m[j] / c1) / (Math.sqrt(v[j] / c2) + 1e-8);
    }
  });
}

/** What both models offer the training loop. */
export interface Model {
  params: Params;
  /** Class probabilities for one image. */
  predict(img: Img): Float64Array;
  /** Adds ∂loss/∂params for one example (softmax cross-entropy) to g; returns the loss. */
  grad(img: Img, y: number, g: Params): number;
}

// ── The CNN ──────────────────────────────────────────────────────────────────

export class Cnn implements Model {
  readonly K: number; readonly classes: number;
  /** filters: K × 9 weights; fb: K biases; W: classes × K; b: classes. */
  filters: Float64Array; fb: Float64Array; W: Float64Array; b: Float64Array;
  params: Params;

  constructor(K: number, classes: number, rng: Rng) {
    this.K = K; this.classes = classes;
    this.filters = Float64Array.from({ length: K * 9 }, () => Math.sqrt(2 / 9) * gauss(rng));  // He: ReLU after
    this.fb = new Float64Array(K);
    this.W = Float64Array.from({ length: classes * K }, () => Math.sqrt(2 / (K + classes)) * gauss(rng));
    this.b = new Float64Array(classes);
    this.params = [this.filters, this.fb, this.W, this.b];
  }

  /** Feature maps after ReLU, and where each map's maximum is (the pooled value and its index). */
  features(img: Img) {
    const maps: Img[] = [], pooled = new Float64Array(this.K), arg = new Int32Array(this.K);
    for (let f = 0; f < this.K; f++) {
      const m = conv2d(img, this.filters.subarray(f * 9, f * 9 + 9), 3, this.fb[f]);
      let best = -Infinity, at = 0;
      for (let i = 0; i < m.px.length; i++) {
        m.px[i] = Math.max(0, m.px[i]);
        if (m.px[i] > best) { best = m.px[i]; at = i; }
      }
      maps.push(m); pooled[f] = best; arg[f] = at;
    }
    return { maps, pooled, arg };
  }

  logits(pooled: Float64Array) {
    const z = new Float64Array(this.classes);
    for (let c = 0; c < this.classes; c++) {
      let s = this.b[c];
      for (let f = 0; f < this.K; f++) s += this.W[c * this.K + f] * pooled[f];
      z[c] = s;
    }
    return z;
  }

  predict(img: Img) { return softmax(this.logits(this.features(img).pooled)); }

  grad(img: Img, y: number, g: Params) {
    const { maps, pooled, arg } = this.features(img);
    const p = softmax(this.logits(pooled));
    const [gF, gFb, gW, gb] = g;
    const dPool = new Float64Array(this.K);
    for (let c = 0; c < this.classes; c++) {
      const d = p[c] - (c === y ? 1 : 0);                        // ∂L/∂z_c for softmax + cross-entropy
      gb[c] += d;
      for (let f = 0; f < this.K; f++) { gW[c * this.K + f] += d * pooled[f]; dPool[f] += d * this.W[c * this.K + f]; }
    }
    // Max pool sends the gradient only to the winning position; ReLU blocks it where the map was ≤ 0.
    const m = maps[0].n;
    for (let f = 0; f < this.K; f++) {
      if (pooled[f] <= 0) continue;
      const r = Math.floor(arg[f] / m), c = arg[f] % m;
      gFb[f] += dPool[f];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) gF[f * 9 + i * 3 + j] += dPool[f] * img.px[(r + i) * img.n + c + j];
    }
    return -Math.log(Math.max(p[y], 1e-12));
  }
}

// ── The dense network ────────────────────────────────────────────────────────

export class Dense implements Model {
  readonly nIn: number; readonly H: number; readonly classes: number;
  W1: Float64Array; b1: Float64Array; W2: Float64Array; b2: Float64Array;
  params: Params;

  constructor(nIn: number, H: number, classes: number, rng: Rng) {
    this.nIn = nIn; this.H = H; this.classes = classes;
    this.W1 = Float64Array.from({ length: H * nIn }, () => Math.sqrt(2 / nIn) * gauss(rng));
    this.b1 = new Float64Array(H);
    this.W2 = Float64Array.from({ length: classes * H }, () => Math.sqrt(2 / (H + classes)) * gauss(rng));
    this.b2 = new Float64Array(classes);
    this.params = [this.W1, this.b1, this.W2, this.b2];
  }

  private hidden(img: Img) {
    const h = new Float64Array(this.H);
    for (let o = 0; o < this.H; o++) {
      let s = this.b1[o];
      for (let i = 0; i < this.nIn; i++) s += this.W1[o * this.nIn + i] * img.px[i];
      h[o] = Math.max(0, s);
    }
    return h;
  }

  private logits(h: Float64Array) {
    const z = new Float64Array(this.classes);
    for (let c = 0; c < this.classes; c++) {
      let s = this.b2[c];
      for (let o = 0; o < this.H; o++) s += this.W2[c * this.H + o] * h[o];
      z[c] = s;
    }
    return z;
  }

  predict(img: Img) { return softmax(this.logits(this.hidden(img))); }

  grad(img: Img, y: number, g: Params) {
    const h = this.hidden(img), p = softmax(this.logits(h));
    const [gW1, gb1, gW2, gb2] = g;
    const dh = new Float64Array(this.H);
    for (let c = 0; c < this.classes; c++) {
      const d = p[c] - (c === y ? 1 : 0);
      gb2[c] += d;
      for (let o = 0; o < this.H; o++) { gW2[c * this.H + o] += d * h[o]; dh[o] += d * this.W2[c * this.H + o]; }
    }
    for (let o = 0; o < this.H; o++) {
      if (h[o] <= 0) continue;
      gb1[o] += dh[o];
      for (let i = 0; i < this.nIn; i++) gW1[o * this.nIn + i] += dh[o] * img.px[i];
    }
    return -Math.log(Math.max(p[y], 1e-12));
  }
}

export const paramTotal = (m: Model) => m.params.reduce((s, p) => s + p.length, 0);

// ── Training and scoring ─────────────────────────────────────────────────────

export type Sample = { img: Img; y: number };

/** One epoch of mini-batch Adam in a shuffled order; returns the mean training loss. */
export function epoch(model: Model, opt: Adam, data: Sample[], batch: number, rng: Rng) {
  const order = data.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let loss = 0;
  for (let s = 0; s < order.length; s += batch) {
    const e = Math.min(s + batch, order.length), g = zerosLike(model.params);
    for (let k = s; k < e; k++) loss += model.grad(data[order[k]].img, data[order[k]].y, g);
    g.forEach(a => { for (let j = 0; j < a.length; j++) a[j] /= e - s; });
    adamStep(model.params, g, opt);
  }
  return loss / data.length;
}

export function accuracy(model: Model, data: Sample[]) {
  let ok = 0;
  for (const s of data) {
    const p = model.predict(s.img);
    let best = 0;
    for (let c = 1; c < p.length; c++) if (p[c] > p[best]) best = c;
    ok += best === s.y ? 1 : 0;
  }
  return ok / data.length;
}
