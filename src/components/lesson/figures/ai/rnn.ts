// ── Recurrent networks for the AI track's RNN chapter ────────────────────────
// A plain (Elman) RNN and an LSTM, both reading a sequence of numbers and
// answering with one sigmoid output after the last step, trained by
// backpropagation through time (BPTT) with Adam. The chapter's task, MEMORY:
// a sequence of T random ±1 values; the answer is whether the FIRST one was +1,
// so the network has to carry one bit across T − 1 distracting steps.
// No side effects on import: the numbers quoted in the chapter come from
// running this file under Node.

import { gauss, sig, type Rng } from "./mlp";

export type Seq = { x: number[]; y: number };

/** MEMORY: n sequences of length T. */
export function memoryTask(n: number, T: number, rng: Rng): Seq[] {
  return Array.from({ length: n }, () => {
    const x = Array.from({ length: T }, () => (rng() < 0.5 ? -1 : 1));
    return { x, y: x[0] > 0 ? 1 : 0 };
  });
}

type Params = Float64Array[];

/** A model offers its parameters, the forward pass, and the gradient of one sequence. */
export interface SeqModel {
  readonly H: number;
  params: Params;
  /** Hidden states h_1…h_T (and the probability after the last step). */
  run(x: number[]): { h: Float64Array[]; p: number };
  /** Adds ∂loss/∂params for one sequence to g; returns the loss and ‖∂loss/∂h_t‖ for every t. */
  grad(s: Seq, g: Params): { loss: number; dh: number[] };
}

const randn = (n: number, sd: number, rng: Rng) => Float64Array.from({ length: n }, () => sd * gauss(rng));
const bce = (p: number, y: number) => -Math.log(Math.max(y ? p : 1 - p, 1e-12));
const norm = (v: Float64Array) => Math.sqrt(v.reduce((s, a) => s + a * a, 0));

// ── Plain RNN: h_t = tanh(Wh·h_{t−1} + wx·x_t + b) ───────────────────────────

export class Rnn implements SeqModel {
  readonly H: number;
  Wh: Float64Array; wx: Float64Array; b: Float64Array; wy: Float64Array; by: Float64Array;
  params: Params;

  constructor(H: number, rng: Rng) {
    this.H = H;
    this.Wh = randn(H * H, 1 / Math.sqrt(H), rng);
    this.wx = randn(H, 1, rng);
    this.b = new Float64Array(H);
    this.wy = randn(H, 1 / Math.sqrt(H), rng);
    this.by = new Float64Array(1);
    this.params = [this.Wh, this.wx, this.b, this.wy, this.by];
  }

  run(x: number[]) {
    const H = this.H, h: Float64Array[] = [];
    let prev = new Float64Array(H);
    for (const xt of x) {
      const cur = new Float64Array(H);
      for (let i = 0; i < H; i++) {
        let s = this.b[i] + this.wx[i] * xt;
        for (let j = 0; j < H; j++) s += this.Wh[i * H + j] * prev[j];
        cur[i] = Math.tanh(s);
      }
      h.push(cur); prev = cur;
    }
    let z = this.by[0];
    for (let i = 0; i < H; i++) z += this.wy[i] * prev[i];
    return { h, p: sig(z) };
  }

  grad(s: Seq, g: Params) {
    const H = this.H, { h, p } = this.run(s.x), T = s.x.length;
    const [gWh, gwx, gb, gwy, gby] = g;
    const dz0 = p - s.y;
    gby[0] += dz0;
    let dh = new Float64Array(H);
    for (let i = 0; i < H; i++) { gwy[i] += dz0 * h[T - 1][i]; dh[i] = dz0 * this.wy[i]; }
    const norms = new Array<number>(T);
    for (let t = T - 1; t >= 0; t--) {
      norms[t] = norm(dh);
      const prev = t > 0 ? h[t - 1] : new Float64Array(H), dz = new Float64Array(H);
      for (let i = 0; i < H; i++) dz[i] = dh[i] * (1 - h[t][i] * h[t][i]);       // through tanh
      const dPrev = new Float64Array(H);
      for (let i = 0; i < H; i++) {
        gb[i] += dz[i]; gwx[i] += dz[i] * s.x[t];
        for (let j = 0; j < H; j++) { gWh[i * H + j] += dz[i] * prev[j]; dPrev[j] += this.Wh[i * H + j] * dz[i]; }
      }
      dh = dPrev;
    }
    return { loss: bce(p, s.y), dh: norms };
  }
}

// ── LSTM: gates f, i, o and a candidate g decide what the cell c keeps ──────

export class Lstm implements SeqModel {
  readonly H: number;
  /** W: 4H rows (f, i, g, o) of H + 1 columns ([h_{t−1}, x_t]); b: 4H. */
  W: Float64Array; b: Float64Array; wy: Float64Array; by: Float64Array;
  params: Params;

  constructor(H: number, rng: Rng) {
    this.H = H;
    this.W = randn(4 * H * (H + 1), 1 / Math.sqrt(H + 1), rng);
    this.b = new Float64Array(4 * H);
    for (let i = 0; i < H; i++) this.b[i] = 1;                                // forget bias 1: start by remembering
    this.wy = randn(H, 1 / Math.sqrt(H), rng);
    this.by = new Float64Array(1);
    this.params = [this.W, this.b, this.wy, this.by];
  }

  private steps(x: number[]) {
    const H = this.H, K = H + 1;
    const hs: Float64Array[] = [], cs: Float64Array[] = [], gates: Float64Array[] = [];
    let h = new Float64Array(H), c = new Float64Array(H);
    for (const xt of x) {
      const a = new Float64Array(4 * H);
      for (let r = 0; r < 4 * H; r++) {
        let s = this.b[r] + this.W[r * K + H] * xt;
        for (let j = 0; j < H; j++) s += this.W[r * K + j] * h[j];
        a[r] = r >= 2 * H && r < 3 * H ? Math.tanh(s) : sig(s);              // g uses tanh, the gates σ
      }
      const c2 = new Float64Array(H), h2 = new Float64Array(H);
      for (let i = 0; i < H; i++) {
        c2[i] = a[i] * c[i] + a[H + i] * a[2 * H + i];                        // c = f·c + i·g
        h2[i] = a[3 * H + i] * Math.tanh(c2[i]);                              // h = o·tanh(c)
      }
      hs.push(h2); cs.push(c2); gates.push(a); h = h2; c = c2;
    }
    return { hs, cs, gates };
  }

  run(x: number[]) {
    const { hs } = this.steps(x), last = hs[hs.length - 1];
    let z = this.by[0];
    for (let i = 0; i < this.H; i++) z += this.wy[i] * last[i];
    return { h: hs, p: sig(z) };
  }

  /** The cell states too, for figures. */
  cells(x: number[]) { return this.steps(x); }

  grad(s: Seq, g: Params) {
    const H = this.H, K = H + 1, T = s.x.length;
    const { hs, cs, gates } = this.steps(s.x);
    let z = this.by[0];
    for (let i = 0; i < H; i++) z += this.wy[i] * hs[T - 1][i];
    const p = sig(z), [gW, gb, gwy, gby] = g, dz0 = p - s.y;
    gby[0] += dz0;
    let dh = new Float64Array(H), dc = new Float64Array(H);
    for (let i = 0; i < H; i++) { gwy[i] += dz0 * hs[T - 1][i]; dh[i] = dz0 * this.wy[i]; }
    const norms = new Array<number>(T);
    for (let t = T - 1; t >= 0; t--) {
      norms[t] = norm(dh);
      const a = gates[t], cPrev = t > 0 ? cs[t - 1] : new Float64Array(H), hPrev = t > 0 ? hs[t - 1] : new Float64Array(H);
      const da = new Float64Array(4 * H), dcPrev = new Float64Array(H);
      for (let i = 0; i < H; i++) {
        const f = a[i], ii = a[H + i], gg = a[2 * H + i], o = a[3 * H + i], tc = Math.tanh(cs[t][i]);
        const dci = dc[i] + dh[i] * o * (1 - tc * tc);
        da[3 * H + i] = dh[i] * tc * o * (1 - o);                              // output gate
        da[i] = dci * cPrev[i] * f * (1 - f);                                  // forget gate
        da[H + i] = dci * gg * ii * (1 - ii);                                  // input gate
        da[2 * H + i] = dci * ii * (1 - gg * gg);                              // candidate
        dcPrev[i] = dci * f;                                                   // the cell path: just × f
      }
      const dhPrev = new Float64Array(H);
      for (let r = 0; r < 4 * H; r++) {
        gb[r] += da[r];
        gW[r * K + H] += da[r] * s.x[t];
        for (let j = 0; j < H; j++) { gW[r * K + j] += da[r] * hPrev[j]; dhPrev[j] += this.W[r * K + j] * da[r]; }
      }
      dh = dhPrev; dc = dcPrev;
    }
    return { loss: bce(p, s.y), dh: norms };
  }
}

// ── Training ─────────────────────────────────────────────────────────────────

export type Adam = { lr: number; t: number; m: Params; v: Params; clip: number };
export const makeAdam = (ps: Params, lr: number, clip = 1): Adam =>
  ({ lr, t: 0, clip, m: ps.map(p => new Float64Array(p.length)), v: ps.map(p => new Float64Array(p.length)) });

/** One Adam step on a mini-batch, with the gradient clipped to norm ≤ clip. Returns the mean loss. */
export function trainBatch(model: SeqModel, opt: Adam, batch: Seq[]) {
  const g = model.params.map(p => new Float64Array(p.length));
  let loss = 0;
  for (const s of batch) loss += model.grad(s, g).loss;
  let n2 = 0;
  for (const a of g) for (let j = 0; j < a.length; j++) { a[j] /= batch.length; n2 += a[j] * a[j]; }
  const scale = Math.sqrt(n2) > opt.clip ? opt.clip / Math.sqrt(n2) : 1;          // gradient clipping
  opt.t++;
  const c1 = 1 - 0.9 ** opt.t, c2 = 1 - 0.999 ** opt.t;
  model.params.forEach((p, k) => {
    for (let j = 0; j < p.length; j++) {
      const gj = g[k][j] * scale;
      opt.m[k][j] = 0.9 * opt.m[k][j] + 0.1 * gj;
      opt.v[k][j] = 0.999 * opt.v[k][j] + 0.001 * gj * gj;
      p[j] -= (opt.lr * opt.m[k][j] / c1) / (Math.sqrt(opt.v[k][j] / c2) + 1e-8);
    }
  });
  return loss / batch.length;
}

export function seqAccuracy(model: SeqModel, data: Seq[]) {
  let ok = 0;
  for (const s of data) ok += (model.run(s.x).p >= 0.5 ? 1 : 0) === s.y ? 1 : 0;
  return ok / data.length;
}
