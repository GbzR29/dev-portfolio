// ── A tiny multi-layer perceptron for the AI track's figures ─────────────────
// The same network the Neural Networks chapters build in C++: dense layers,
// sigmoid / tanh / ReLU activations, one output neuron (sigmoid + cross-entropy
// for classification), backpropagation, and the optimisers of the Training
// chapter (SGD, momentum, RMSProp, Adam) with an optional L2 penalty and
// dropout. Plain arrays, no imports with side effects: the numbers quoted in
// the chapters come from running this file under Node.

export type Act = "sigmoid" | "tanh" | "relu" | "linear";
export type Rng = () => number;

/** One dense layer: out = act(W·in + b). W is row-major, nOut rows of nIn. */
export type Layer = { nIn: number; nOut: number; W: Float64Array; b: Float64Array; act: Act };
export type Net = Layer[];

export const sig = (z: number) => 1 / (1 + Math.exp(-z));

export function act(a: Act, z: number) {
  switch (a) {
    case "sigmoid": return sig(z);
    case "tanh":    return Math.tanh(z);
    case "relu":    return z > 0 ? z : 0;
    default:        return z;
  }
}

/** Slope of the activation, written with its output y where that is cheaper (σ' = y(1 − y), tanh' = 1 − y²). */
export function actSlope(a: Act, z: number, y: number) {
  switch (a) {
    case "sigmoid": return y * (1 - y);
    case "tanh":    return 1 - y * y;
    case "relu":    return z > 0 ? 1 : 0;
    default:        return 1;
  }
}

/** A standard normal sample (Box–Muller). */
export function gauss(rng: Rng) {
  const u = Math.max(rng(), 1e-12), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Building a network ───────────────────────────────────────────────────────

/** How the first weights are drawn: zero, N(0, 0.01²), Glorot/Xavier N(0, 2/(nIn+nOut)), He N(0, 2/nIn), or N(0, 1). */
export type Init = "zero" | "small" | "xavier" | "he" | "large";

export function initStd(init: Init, nIn: number, nOut: number) {
  switch (init) {
    case "zero":   return 0;
    case "small":  return 0.01;
    case "xavier": return Math.sqrt(2 / (nIn + nOut));
    case "he":     return Math.sqrt(2 / nIn);
    default:       return 1;
  }
}

/** sizes = [inputs, hidden…, 1]; every hidden layer uses `hidden`, the last uses `out`. Biases start at 0. */
export function makeNet(sizes: number[], hidden: Act, rng: Rng, init: Init = "xavier", out: Act = "sigmoid"): Net {
  const net: Net = [];
  for (let l = 1; l < sizes.length; l++) {
    const nIn = sizes[l - 1], nOut = sizes[l];
    const sd = initStd(init, nIn, nOut);
    const W = new Float64Array(nIn * nOut);
    for (let k = 0; k < W.length; k++) W[k] = sd * gauss(rng);
    net.push({ nIn, nOut, W, b: new Float64Array(nOut), act: l === sizes.length - 1 ? out : hidden });
  }
  return net;
}

/** A network from explicit weights: layers[l] = { W: rows of weights, b }. */
export function netFrom(layers: { W: number[][]; b: number[]; act: Act }[]): Net {
  return layers.map(({ W, b, act: a }) => ({
    nIn: W[0].length, nOut: W.length, W: Float64Array.from(W.flat()), b: Float64Array.from(b), act: a,
  }));
}

export const cloneNet = (net: Net): Net => net.map(L => ({ ...L, W: L.W.slice(), b: L.b.slice() }));

export const paramCount = (net: Net) => net.reduce((s, L) => s + L.W.length + L.b.length, 0);

// ── Forward pass ─────────────────────────────────────────────────────────────

/** Everything the backward pass needs: a[0] = input, z[l] and a[l + 1] for layer l, and dropout masks. */
export type Cache = { a: Float64Array[]; z: Float64Array[]; mask: (Float64Array | null)[] };

/**
 * Runs the network. With `drop` (probability p of dropping a hidden unit), each
 * hidden unit is zeroed with probability p and the survivors are scaled by
 * 1/(1 − p) ("inverted dropout"), so nothing changes at test time.
 */
export function forward(net: Net, x: ArrayLike<number>, drop?: { p: number; rng: Rng }): Cache {
  const a: Float64Array[] = [Float64Array.from(x)], z: Float64Array[] = [], mask: (Float64Array | null)[] = [];
  net.forEach((L, l) => {
    const inp = a[l], zl = new Float64Array(L.nOut), al = new Float64Array(L.nOut);
    for (let o = 0; o < L.nOut; o++) {
      let s = L.b[o];
      for (let i = 0; i < L.nIn; i++) s += L.W[o * L.nIn + i] * inp[i];
      zl[o] = s; al[o] = act(L.act, s);
    }
    let m: Float64Array | null = null;
    if (drop && drop.p > 0 && l < net.length - 1) {
      m = new Float64Array(L.nOut);
      for (let o = 0; o < L.nOut; o++) { m[o] = drop.rng() < drop.p ? 0 : 1 / (1 - drop.p); al[o] *= m[o]; }
    }
    z.push(zl); a.push(al); mask.push(m);
  });
  return { a, z, mask };
}

/** The single output of the network for one input. */
export const output = (net: Net, x: ArrayLike<number>) => forward(net, x).a[net.length][0];

// ── Loss ─────────────────────────────────────────────────────────────────────

const clampP = (p: number) => Math.min(Math.max(p, 1e-12), 1 - 1e-12);

/** Loss of one example: cross-entropy for a sigmoid output, squared error otherwise. */
export function exampleLoss(net: Net, p: number, y: number) {
  return net[net.length - 1].act === "sigmoid"
    ? -(y ? Math.log(clampP(p)) : Math.log(1 - clampP(p)))
    : (p - y) ** 2;
}

/** Mean loss over a data set, plus λ·Σw² (weights only, not biases) when l2 > 0. */
export function meanLoss(net: Net, X: ArrayLike<number>[], Y: number[], l2 = 0) {
  let s = 0;
  for (let i = 0; i < X.length; i++) s += exampleLoss(net, output(net, X[i]), Y[i]);
  return s / X.length + (l2 > 0 ? l2 * sumSq(net) : 0);
}

export const sumSq = (net: Net) => net.reduce((s, L) => s + L.W.reduce((t, w) => t + w * w, 0), 0);

/** Fraction of examples on the wrong side of p = 0.5. */
export function errorRate(net: Net, X: ArrayLike<number>[], Y: number[]) {
  let e = 0;
  for (let i = 0; i < X.length; i++) e += ((output(net, X[i]) >= 0.5 ? 1 : 0) !== Y[i] ? 1 : 0);
  return e / X.length;
}

// ── Backward pass ────────────────────────────────────────────────────────────

/** Gradients with the same shapes as the network. */
export type Grads = { W: Float64Array[]; b: Float64Array[] };

export const zeroGrads = (net: Net): Grads => ({ W: net.map(L => new Float64Array(L.W.length)), b: net.map(L => new Float64Array(L.nOut)) });

/**
 * Backpropagation for one example: ADDS ∂loss/∂W and ∂loss/∂b to g and returns
 * the deltas δ[l] = ∂loss/∂z[l]. For a sigmoid output with cross-entropy the
 * output delta is simply p − y; for a linear output with squared error, 2(p − y).
 */
export function backward(net: Net, c: Cache, y: number, g: Grads): Float64Array[] {
  const Lc = net.length;
  const deltas: Float64Array[] = new Array(Lc);
  const p = c.a[Lc][0];
  deltas[Lc - 1] = Float64Array.of(net[Lc - 1].act === "sigmoid" ? p - y : 2 * (p - y));
  for (let l = Lc - 1; l >= 0; l--) {
    const L = net[l], d = deltas[l], inp = c.a[l];
    for (let o = 0; o < L.nOut; o++) {
      g.b[l][o] += d[o];
      for (let i = 0; i < L.nIn; i++) g.W[l][o * L.nIn + i] += d[o] * inp[i];
    }
    if (l === 0) break;
    // δ of the layer below: (Wᵀ δ) times the slope of its activation (and its dropout mask)
    const P = net[l - 1], dPrev = new Float64Array(P.nOut), m = c.mask[l - 1];
    for (let i = 0; i < L.nIn; i++) {
      let s = 0;
      for (let o = 0; o < L.nOut; o++) s += L.W[o * L.nIn + i] * d[o];
      const keep = m ? m[i] : 1;
      const yOut = keep ? c.a[l][i] / keep : 0;                    // the activation before the mask
      dPrev[i] = s * keep * actSlope(P.act, c.z[l - 1][i], yOut);
    }
    deltas[l - 1] = dPrev;
  }
  return deltas;
}

/** Mean gradient over a data set (no penalty): the exact gradient, for checks. */
export function fullGradient(net: Net, X: ArrayLike<number>[], Y: number[]) {
  const g = zeroGrads(net);
  for (let i = 0; i < X.length; i++) backward(net, forward(net, X[i]), Y[i], g);
  scaleGrads(g, 1 / X.length);
  return g;
}

export function scaleGrads(g: Grads, k: number) {
  g.W.forEach(a => { for (let j = 0; j < a.length; j++) a[j] *= k; });
  g.b.forEach(a => { for (let j = 0; j < a.length; j++) a[j] *= k; });
}

// ── Optimisers ───────────────────────────────────────────────────────────────

export type OptKind = "sgd" | "momentum" | "rmsprop" | "adam";

export type Opt = {
  kind: OptKind; lr: number; l2: number; beta1: number; beta2: number; eps: number;
  t: number; m: Grads; v: Grads;
};

export function makeOpt(net: Net, kind: OptKind, lr: number, l2 = 0): Opt {
  return { kind, lr, l2, beta1: 0.9, beta2: 0.999, eps: 1e-8, t: 0, m: zeroGrads(net), v: zeroGrads(net) };
}

/** One update with the mean gradient g. The L2 term 2λw is added to the weight gradients (not to biases). */
export function applyStep(net: Net, o: Opt, g: Grads) {
  o.t++;
  const { beta1: b1, beta2: b2, eps, lr } = o;
  const rmsB2 = 0.9;                                              // RMSProp's usual decay
  const upd = (p: Float64Array, gr: Float64Array, m: Float64Array, v: Float64Array, decay: boolean) => {
    for (let j = 0; j < p.length; j++) {
      const gj = gr[j] + (decay ? 2 * o.l2 * p[j] : 0);
      switch (o.kind) {
        case "sgd":
          p[j] -= lr * gj; break;
        case "momentum":
          m[j] = b1 * m[j] + gj; p[j] -= lr * m[j]; break;
        case "rmsprop":
          v[j] = rmsB2 * v[j] + (1 - rmsB2) * gj * gj; p[j] -= (lr * gj) / (Math.sqrt(v[j]) + eps); break;
        case "adam": {
          m[j] = b1 * m[j] + (1 - b1) * gj;
          v[j] = b2 * v[j] + (1 - b2) * gj * gj;
          const mh = m[j] / (1 - b1 ** o.t), vh = v[j] / (1 - b2 ** o.t);
          p[j] -= (lr * mh) / (Math.sqrt(vh) + eps);
        }
      }
    }
  };
  net.forEach((L, l) => {
    upd(L.W, g.W[l], o.m.W[l], o.v.W[l], o.l2 > 0);
    upd(L.b, g.b[l], o.m.b[l], o.v.b[l], false);
  });
}

/** One epoch of mini-batch training in a shuffled order. Returns nothing; read the loss with meanLoss. */
export function trainEpoch(net: Net, o: Opt, X: ArrayLike<number>[], Y: number[], batch: number, rng: Rng, dropout = 0) {
  const n = X.length, order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  for (let s = 0; s < n; s += batch) {
    const e = Math.min(s + batch, n), g = zeroGrads(net);
    for (let k = s; k < e; k++) {
      const i = order[k];
      backward(net, forward(net, X[i], dropout > 0 ? { p: dropout, rng } : undefined), Y[i], g);
    }
    scaleGrads(g, 1 / (e - s));
    applyStep(net, o, g);
  }
}

/** mulberry32, the kit's seeded PRNG, repeated here so this file runs on its own. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
