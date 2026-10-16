// ── Backpropagation with classic bugs, for the gradient-check figure ──────────
// The same backward pass as mlp.ts, with a switch for one mistake at a time.
// Every bug still produces numbers of a plausible size: only a numerical
// check (or a training run that goes nowhere) gives it away.

import { actSlope, cloneNet, forward, meanLoss, zeroGrads, applyStep, makeOpt, type Grads, type Net } from "./mlp";

export type Bug = "none" | "noSlope" | "slopeOfZ" | "sign" | "noInput";
export const BUGS: Bug[] = ["none", "noSlope", "slopeOfZ", "sign", "noInput"];

/** Mean gradient of the cross-entropy over (X, Y), computed with the chosen bug. */
export function buggyGradient(net: Net, X: number[][], Y: number[], bug: Bug): Grads {
  const g = zeroGrads(net);
  for (let n = 0; n < X.length; n++) {
    const c = forward(net, X[n]);
    const p = c.a[net.length][0];
    let delta = Float64Array.of(bug === "sign" ? Y[n] - p : p - Y[n]);
    for (let l = net.length - 1; l >= 0; l--) {
      const L = net[l], inp = c.a[l];
      for (let o = 0; o < L.nOut; o++) {
        g.b[l][o] += delta[o];
        for (let i = 0; i < L.nIn; i++) g.W[l][o * L.nIn + i] += delta[o] * (bug === "noInput" ? 1 : inp[i]);
      }
      if (l === 0) break;
      const P = net[l - 1], prev = new Float64Array(L.nIn);
      for (let i = 0; i < L.nIn; i++) {
        let s = 0;
        for (let o = 0; o < L.nOut; o++) s += L.W[o * L.nIn + i] * delta[o];
        const z = c.z[l - 1][i], y = inp[i];
        const sl = bug === "noSlope" ? 1 : bug === "slopeOfZ" ? z * (1 - z) : actSlope(P.act, z, y);
        prev[i] = s * sl;
      }
      delta = prev;
    }
  }
  const k = 1 / X.length;
  g.W.forEach(a => a.forEach((v, j) => (a[j] = v * k)));
  g.b.forEach(a => a.forEach((v, j) => (a[j] = v * k)));
  return g;
}

/** One row per parameter: its name, the backprop value and the central-difference value. */
export function checkRows(net: Net, X: number[][], Y: number[], bug: Bug, h = 1e-5) {
  const g = buggyGradient(net, X, Y, bug);
  const rows: { name: string; analytic: number; numeric: number; rel: number }[] = [];
  const poke = (l: number, kind: "W" | "b", j: number, name: string) => {
    const up = cloneNet(net), down = cloneNet(net);
    up[l][kind][j] += h; down[l][kind][j] -= h;
    const numeric = (meanLoss(up, X, Y) - meanLoss(down, X, Y)) / (2 * h);
    const analytic = (kind === "W" ? g.W : g.b)[l][j];
    const rel = Math.abs(analytic - numeric) / Math.max(Math.abs(analytic), Math.abs(numeric), 1e-8);
    rows.push({ name, analytic, numeric, rel });
  };
  net.forEach((L, l) => {
    const sup = l === 0 ? "⁽¹⁾" : "⁽²⁾";
    for (let o = 0; o < L.nOut; o++) for (let i = 0; i < L.nIn; i++)
      poke(l, "W", o * L.nIn + i, L.nOut === 1 ? `w${sup}${"₁₂₃₄"[i]}` : `w${sup}${"₁₂₃₄"[o]}${"₁₂₃₄"[i]}`);
    for (let o = 0; o < L.nOut; o++) poke(l, "b", o, L.nOut === 1 ? `b${sup}` : `b${sup}${"₁₂₃₄"[o]}`);
  });
  return rows;
}

/** Plain gradient descent with the (possibly buggy) gradient: the loss after each epoch. */
export function trainCurve(net0: Net, X: number[][], Y: number[], bug: Bug, epochs: number, lr = 1) {
  const net = cloneNet(net0), opt = makeOpt(net, "sgd", lr), out = [meanLoss(net, X, Y)];
  for (let e = 0; e < epochs; e++) {
    applyStep(net, opt, buggyGradient(net, X, Y, bug));
    out.push(meanLoss(net, X, Y));
  }
  return { curve: out, net };
}
