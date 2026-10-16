// ── Signals through a deep network, for the initialisation figure ────────────
// A 10-layer network, 100 neurons wide, fed 200 random inputs: how large the
// activations are at each layer (forward) and how large each layer's weight
// gradient is (backward), for a choice of activation and initialisation.

import { backward, forward, gauss, makeNet, seeded, zeroGrads, type Act, type Init } from "./mlp";

export const DEPTH = 10, WIDTH = 100, BATCH = 200;

export type DepthStats = { act: number[]; grad: number[]; dead: number[] };

/** rms of each hidden layer's activations, mean ‖∂L/∂W‖ of each layer, and the fraction of ReLU units that output 0. */
export function depthStats(a: Act, init: Init, seed = 3): DepthStats {
  const net = makeNet([...Array(DEPTH + 1).fill(WIDTH), 1], a, seeded(seed), init);
  const rng = seeded(7);
  const act = new Array(DEPTH).fill(0), grad = new Array(DEPTH).fill(0), dead = new Array(DEPTH).fill(0);
  for (let n = 0; n < BATCH; n++) {
    const x = Array.from({ length: WIDTH }, () => gauss(rng));
    const c = forward(net, x);
    for (let l = 1; l <= DEPTH; l++) {
      let s = 0, z = 0;
      for (const v of c.a[l]) { s += v * v; if (v === 0) z++; }
      act[l - 1] += s / WIDTH; dead[l - 1] += z / WIDTH;
    }
    const g = zeroGrads(net);
    backward(net, c, 1, g);
    for (let l = 0; l < DEPTH; l++) grad[l] += Math.sqrt(g.W[l].reduce((t, v) => t + v * v, 0));
  }
  return { act: act.map(s => Math.sqrt(s / BATCH)), grad: grad.map(s => s / BATCH), dead: dead.map(s => s / BATCH) };
}
