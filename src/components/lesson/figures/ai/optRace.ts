// ── Four optimisers on a two-parameter loss, for the optimiser figure ────────
// The same update rules as mlp.ts (SGD, momentum, RMSProp, Adam), written for
// a point (x, y) on a surface whose gradient we know exactly, so the paths can
// be drawn. Two surfaces: a long, narrow bowl (curvatures 1 and 100, like
// unscaled features) and a curved banana valley (Rosenbrock's function).

export type Surface = "ravine" | "banana";
export type OptName = "sgd" | "momentum" | "rmsprop" | "adam";
export const OPTS: OptName[] = ["sgd", "momentum", "rmsprop", "adam"];

export const SURF: Record<Surface, {
  f: (x: number, y: number) => number;
  g: (x: number, y: number) => [number, number];
  start: [number, number]; min: [number, number];
  view: [number, number, number, number];                 // x0, x1, y0, y1
  lr: Record<OptName, number>;                            // a good learning rate for each optimiser
}> = {
  ravine: {
    f: (x, y) => 0.5 * (x * x + 100 * y * y),
    g: (x, y) => [x, 100 * y],
    start: [-4.5, 0.5], min: [0, 0], view: [-5, 1.5, -0.65, 0.65],
    lr: { sgd: 0.019, momentum: 0.01, rmsprop: 0.005, adam: 0.2 },
  },
  banana: {
    f: (x, y) => (1 - x) ** 2 + 10 * (y - x * x) ** 2,
    g: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
    start: [-1.2, 1.4], min: [1, 1], view: [-1.8, 1.6, -0.6, 2.0],
    lr: { sgd: 0.01, momentum: 0.005, rmsprop: 0.005, adam: 0.1 },
  },
};

/** The path of one optimiser: `steps` updates from the surface's start, learning rate lr. */
export function path(s: Surface, o: OptName, lr: number, steps: number) {
  const S = SURF[s];
  let [x, y] = S.start;
  let mx = 0, my = 0, vx = 0, vy = 0;
  const b1 = 0.9, b2 = 0.999, rho = 0.9, eps = 1e-8;
  const pts: [number, number][] = [[x, y]];
  for (let t = 1; t <= steps; t++) {
    const [gx, gy] = S.g(x, y);
    switch (o) {
      case "sgd": x -= lr * gx; y -= lr * gy; break;
      case "momentum":
        mx = b1 * mx + gx; my = b1 * my + gy;
        x -= lr * mx; y -= lr * my; break;
      case "rmsprop":
        vx = rho * vx + (1 - rho) * gx * gx; vy = rho * vy + (1 - rho) * gy * gy;
        x -= (lr * gx) / (Math.sqrt(vx) + eps); y -= (lr * gy) / (Math.sqrt(vy) + eps); break;
      case "adam": {
        mx = b1 * mx + (1 - b1) * gx; my = b1 * my + (1 - b1) * gy;
        vx = b2 * vx + (1 - b2) * gx * gx; vy = b2 * vy + (1 - b2) * gy * gy;
        const c1 = 1 - b1 ** t, c2 = 1 - b2 ** t;
        x -= (lr * mx / c1) / (Math.sqrt(vx / c2) + eps);
        y -= (lr * my / c1) / (Math.sqrt(vy / c2) + eps);
      }
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) { pts.push([NaN, NaN]); break; }
    pts.push([x, y]);
  }
  return pts;
}

/** First step at which the loss is below tol and stays below it for the rest of the run (or −1). */
export function stepsTo(s: Surface, pts: [number, number][], tol = 1e-3) {
  const f = SURF[s].f;
  let first = -1;
  for (let i = 0; i < pts.length; i++) {
    const v = f(pts[i][0], pts[i][1]);
    if (!(v < tol)) first = -1;
    else if (first === -1) first = i;
  }
  return first;
}
