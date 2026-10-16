// ── A tiny GPT for the AI track's Transformers chapter ───────────────────────
// A real decoder-only transformer, small enough to train in a browser: token
// and position embeddings, ONE pre-norm block (LayerNorm → 2-head causal
// self-attention → residual; LayerNorm → ReLU MLP → residual), a final
// LayerNorm and an output layer with a softmax over the vocabulary. It learns
// to predict the next word of the FARM corpus. Forward and backward passes are
// written out by hand; Adam trains it. No side effects on import: the numbers
// quoted in the chapter come from running this file under Node.

import { gauss, type Rng } from "./mlp";
import { softmax } from "./cnn";

export type GptCfg = { V: number; P: number; d: number; heads: number; ff: number };

type Vec = Float64Array;
const zeros = (n: number) => new Float64Array(n);

/** All parameters, as named flat arrays (row-major matrices). */
export type GptParams = {
  E: Vec; Pos: Vec;                                       // V × d tokens, P × d positions
  g1: Vec; b1: Vec; Wq: Vec; Wk: Vec; Wv: Vec; Wo: Vec;   // LayerNorm 1, attention (d × d each)
  g2: Vec; b2: Vec; W1: Vec; c1: Vec; W2: Vec; c2: Vec;   // LayerNorm 2, MLP (d × ff, ff × d)
  gf: Vec; bf: Vec; U: Vec; cu: Vec;                      // final LayerNorm, output layer (d × V)
};
const KEYS = ["E", "Pos", "g1", "b1", "Wq", "Wk", "Wv", "Wo", "g2", "b2", "W1", "c1", "W2", "c2", "gf", "bf", "U", "cu"] as const;

export function makeGpt(cfg: GptCfg, rng: Rng): GptParams {
  const { V, P, d, ff } = cfg;
  const r = (n: number, sd: number) => Float64Array.from({ length: n }, () => sd * gauss(rng));
  const ones = (n: number) => new Float64Array(n).fill(1);
  return {
    E: r(V * d, 0.3), Pos: r(P * d, 0.3),
    g1: ones(d), b1: zeros(d), Wq: r(d * d, 1 / Math.sqrt(d)), Wk: r(d * d, 1 / Math.sqrt(d)), Wv: r(d * d, 1 / Math.sqrt(d)), Wo: r(d * d, 0.5 / Math.sqrt(d)),
    g2: ones(d), b2: zeros(d), W1: r(d * ff, Math.sqrt(2 / d)), c1: zeros(ff), W2: r(ff * d, 0.5 / Math.sqrt(ff)), c2: zeros(d),
    gf: ones(d), bf: zeros(d), U: r(d * V, 1 / Math.sqrt(d)), cu: zeros(V),
  };
}

export const gptParamCount = (p: GptParams) => KEYS.reduce((s, k) => s + p[k].length, 0);

// ── Small helpers on n × m row-major matrices ────────────────────────────────

/** out (n × m) = A (n × k) · B (k × m) */
function mm(A: Vec, B: Vec, n: number, k: number, m: number) {
  const out = zeros(n * m);
  for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) {
    const a = A[i * k + t];
    if (a !== 0) for (let j = 0; j < m; j++) out[i * m + j] += a * B[t * m + j];
  }
  return out;
}
/** dA += dOut · Bᵀ, dB += Aᵀ · dOut for out = A · B */
function mmBack(A: Vec, B: Vec, dOut: Vec, dA: Vec | null, dB: Vec | null, n: number, k: number, m: number) {
  for (let i = 0; i < n; i++) for (let t = 0; t < k; t++) {
    let s = 0;
    for (let j = 0; j < m; j++) {
      const g = dOut[i * m + j];
      s += g * B[t * m + j];
      if (dB) dB[t * m + j] += A[i * k + t] * g;
    }
    if (dA) dA[i * k + t] += s;
  }
}

const EPS = 1e-5;
/** LayerNorm of each row: y = γ·(x − mean)/√(var + ε) + β. Keeps x̂ and 1/σ for the backward pass. */
function layerNorm(x: Vec, g: Vec, b: Vec, n: number, d: number) {
  const y = zeros(n * d), xhat = zeros(n * d), inv = zeros(n);
  for (let i = 0; i < n; i++) {
    let mu = 0, v = 0;
    for (let j = 0; j < d; j++) mu += x[i * d + j];
    mu /= d;
    for (let j = 0; j < d; j++) v += (x[i * d + j] - mu) ** 2;
    inv[i] = 1 / Math.sqrt(v / d + EPS);
    for (let j = 0; j < d; j++) {
      xhat[i * d + j] = (x[i * d + j] - mu) * inv[i];
      y[i * d + j] = g[j] * xhat[i * d + j] + b[j];
    }
  }
  return { y, xhat, inv };
}
function layerNormBack(dy: Vec, ln: { xhat: Vec; inv: Vec }, g: Vec, dg: Vec, db: Vec, n: number, d: number) {
  const dx = zeros(n * d);
  for (let i = 0; i < n; i++) {
    let m1 = 0, m2 = 0;
    for (let j = 0; j < d; j++) {
      const dxh = dy[i * d + j] * g[j];
      dg[j] += dy[i * d + j] * ln.xhat[i * d + j]; db[j] += dy[i * d + j];
      m1 += dxh; m2 += dxh * ln.xhat[i * d + j];
    }
    m1 /= d; m2 /= d;
    for (let j = 0; j < d; j++) dx[i * d + j] = ln.inv[i] * (dy[i * d + j] * g[j] - m1 - ln.xhat[i * d + j] * m2);
  }
  return dx;
}

// ── Forward ──────────────────────────────────────────────────────────────────

/** Runs the model on tokens[0…n−1]; probs[i] is the distribution of the token after position i. */
export function gptForward(p: GptParams, cfg: GptCfg, tokens: number[]) {
  const { d, heads, ff, V } = cfg, n = tokens.length, dh = d / heads;
  const x0 = zeros(n * d);
  tokens.forEach((tk, i) => { for (let j = 0; j < d; j++) x0[i * d + j] = p.E[tk * d + j] + p.Pos[i * d + j]; });
  const ln1 = layerNorm(x0, p.g1, p.b1, n, d);
  const Q = mm(ln1.y, p.Wq, n, d, d), K = mm(ln1.y, p.Wk, n, d, d), Vv = mm(ln1.y, p.Wv, n, d, d);
  const A: Vec[] = [], concat = zeros(n * d);
  for (let h = 0; h < heads; h++) {
    const Ah = zeros(n * n);
    for (let i = 0; i < n; i++) {
      const z = new Float64Array(i + 1);                    // causal: keys 0…i only
      for (let j = 0; j <= i; j++) {
        let s = 0;
        for (let c = 0; c < dh; c++) s += Q[i * d + h * dh + c] * K[j * d + h * dh + c];
        z[j] = s / Math.sqrt(dh);
      }
      const w = softmax(z);
      for (let j = 0; j <= i; j++) {
        Ah[i * n + j] = w[j];
        for (let c = 0; c < dh; c++) concat[i * d + h * dh + c] += w[j] * Vv[j * d + h * dh + c];
      }
    }
    A.push(Ah);
  }
  const att = mm(concat, p.Wo, n, d, d);
  const x1 = x0.map((v, k) => v + att[k]);                 // residual
  const ln2 = layerNorm(x1, p.g2, p.b2, n, d);
  const hpre = mm(ln2.y, p.W1, n, d, ff);
  const hid = hpre.map((v, k) => Math.max(0, v + p.c1[k % ff]));
  const mlp = mm(hid, p.W2, n, ff, d);
  const x2 = x1.map((v, k) => v + mlp[k] + p.c2[k % d]);   // residual
  const lnf = layerNorm(x2, p.gf, p.bf, n, d);
  const logits = mm(lnf.y, p.U, n, d, V);
  const probs: Vec[] = [];
  for (let i = 0; i < n; i++) {
    for (let v = 0; v < V; v++) logits[i * V + v] += p.cu[v];
    probs.push(softmax(logits.subarray(i * V, (i + 1) * V)));
  }
  return { x0, ln1, Q, K, Vv, A, concat, x1, ln2, hid, x2, lnf, probs };
}

// ── Backward ─────────────────────────────────────────────────────────────────

export const zeroGrads = (p: GptParams): GptParams => Object.fromEntries(KEYS.map(k => [k, zeros(p[k].length)])) as GptParams;

/** Adds the gradient of the summed next-token loss over the sequence to g; returns { loss sum, count }. */
export function gptBackward(p: GptParams, cfg: GptCfg, tokens: number[], g: GptParams) {
  const { d, heads, ff, V } = cfg, inp = tokens.slice(0, -1), n = inp.length, dh = d / heads;
  const f = gptForward(p, cfg, inp);
  let loss = 0;
  const dLogits = zeros(n * V);
  for (let i = 0; i < n; i++) {
    const y = tokens[i + 1];
    loss -= Math.log(Math.max(f.probs[i][y], 1e-12));
    for (let v = 0; v < V; v++) { dLogits[i * V + v] = f.probs[i][v] - (v === y ? 1 : 0); g.cu[v] += dLogits[i * V + v]; }
  }
  const dlnf = zeros(n * d);
  mmBack(f.lnf.y, p.U, dLogits, dlnf, g.U, n, d, V);
  const dx2 = layerNormBack(dlnf, f.lnf, p.gf, g.gf, g.bf, n, d);
  // MLP branch: x2 = x1 + W2·relu(W1·ln2 + c1) + c2
  for (let k = 0; k < n * d; k++) g.c2[k % d] += dx2[k];
  const dhid = zeros(n * ff);
  mmBack(f.hid, p.W2, dx2, dhid, g.W2, n, ff, d);
  for (let k = 0; k < n * ff; k++) { if (f.hid[k] <= 0) dhid[k] = 0; else g.c1[k % ff] += dhid[k]; }
  const dln2 = zeros(n * d);
  mmBack(f.ln2.y, p.W1, dhid, dln2, g.W1, n, d, ff);
  const dx1 = layerNormBack(dln2, f.ln2, p.g2, g.g2, g.b2, n, d).map((v, k) => v + dx2[k]);   // + the residual path
  // Attention branch: x1 = x0 + concat·Wo
  const dconcat = zeros(n * d);
  mmBack(f.concat, p.Wo, dx1, dconcat, g.Wo, n, d, d);
  const dQ = zeros(n * d), dK = zeros(n * d), dV = zeros(n * d);
  for (let h = 0; h < heads; h++) {
    const Ah = f.A[h];
    for (let i = 0; i < n; i++) {
      const dA = new Float64Array(i + 1);
      let dot = 0;
      for (let j = 0; j <= i; j++) {
        let s = 0;
        for (let c = 0; c < dh; c++) {
          s += dconcat[i * d + h * dh + c] * f.Vv[j * d + h * dh + c];
          dV[j * d + h * dh + c] += Ah[i * n + j] * dconcat[i * d + h * dh + c];
        }
        dA[j] = s; dot += s * Ah[i * n + j];
      }
      for (let j = 0; j <= i; j++) {
        const dS = Ah[i * n + j] * (dA[j] - dot) / Math.sqrt(dh);   // through the softmax and the ÷√dh
        for (let c = 0; c < dh; c++) {
          dQ[i * d + h * dh + c] += dS * f.K[j * d + h * dh + c];
          dK[j * d + h * dh + c] += dS * f.Q[i * d + h * dh + c];
        }
      }
    }
  }
  const dln1 = zeros(n * d);
  mmBack(f.ln1.y, p.Wq, dQ, dln1, g.Wq, n, d, d);
  mmBack(f.ln1.y, p.Wk, dK, dln1, g.Wk, n, d, d);
  mmBack(f.ln1.y, p.Wv, dV, dln1, g.Wv, n, d, d);
  const dx0 = layerNormBack(dln1, f.ln1, p.g1, g.g1, g.b1, n, d).map((v, k) => v + dx1[k]);
  inp.forEach((tk, i) => { for (let j = 0; j < d; j++) { g.E[tk * d + j] += dx0[i * d + j]; g.Pos[i * d + j] += dx0[i * d + j]; } });
  return { loss, count: n };
}

// ── Training ─────────────────────────────────────────────────────────────────

export type GptAdam = { lr: number; t: number; m: GptParams; v: GptParams };
export const makeGptAdam = (p: GptParams, lr: number): GptAdam => ({ lr, t: 0, m: zeroGrads(p), v: zeroGrads(p) });

/** One epoch over the sequences in a shuffled order, batches of `batch` sequences; returns the mean loss per predicted token. */
export function gptEpoch(p: GptParams, cfg: GptCfg, opt: GptAdam, seqs: number[][], batch: number, rng: Rng) {
  const order = seqs.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let loss = 0, count = 0;
  for (let s = 0; s < order.length; s += batch) {
    const g = zeroGrads(p);
    let c = 0;
    for (let k = s; k < Math.min(s + batch, order.length); k++) {
      const r = gptBackward(p, cfg, seqs[order[k]], g);
      loss += r.loss; c += r.count;
    }
    count += c;
    opt.t++;
    const c1 = 1 - 0.9 ** opt.t, c2 = 1 - 0.999 ** opt.t;
    for (const key of KEYS) {
      const P = p[key], G = g[key], M = opt.m[key], Vv = opt.v[key];
      for (let j = 0; j < P.length; j++) {
        const gj = G[j] / c;                                  // mean over the predicted tokens of the batch
        M[j] = 0.9 * M[j] + 0.1 * gj;
        Vv[j] = 0.999 * Vv[j] + 0.001 * gj * gj;
        P[j] -= (opt.lr * M[j] / c1) / (Math.sqrt(Vv[j] / c2) + 1e-8);
      }
    }
  }
  return loss / count;
}

/** Mean loss per predicted token, without training. */
export function gptLoss(p: GptParams, cfg: GptCfg, seqs: number[][]) {
  let loss = 0, count = 0;
  for (const s of seqs) {
    const f = gptForward(p, cfg, s.slice(0, -1));
    for (let i = 0; i < s.length - 1; i++) loss -= Math.log(Math.max(f.probs[i][s[i + 1]], 1e-12));
    count += s.length - 1;
  }
  return loss / count;
}

// ── Sampling ─────────────────────────────────────────────────────────────────

/** p_i ∝ exp(ln p_i / T), keeping only the k most likely tokens when k > 0. T → 0 is greedy. */
export function reshape(probs: ArrayLike<number>, temperature: number, topK = 0) {
  const n = probs.length, idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => probs[b] - probs[a]);
  const keep = new Set(topK > 0 ? idx.slice(0, topK) : idx);
  const out = zeros(n);
  if (temperature <= 1e-3) { out[idx[0]] = 1; return out; }
  let s = 0;
  for (let i = 0; i < n; i++) if (keep.has(i)) { out[i] = Math.exp(Math.log(Math.max(probs[i], 1e-300)) / temperature); s += out[i]; }
  for (let i = 0; i < n; i++) out[i] /= s;
  return out;
}

export function sampleFrom(probs: ArrayLike<number>, rng: Rng) {
  let u = rng(), i = 0;
  for (; i < probs.length - 1; i++) { u -= probs[i]; if (u <= 0) break; }
  return i;
}
