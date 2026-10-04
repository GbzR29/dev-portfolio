// ── Contour lines of a loss surface ───────────────────────────────────────────
// Marching squares over a grid, at explicitly chosen levels (loss surfaces are
// long, narrow bowls, so evenly spaced levels would crowd around the rim).
// Returns one SVG path per level, in the plot's viewBox coordinates.

export type Map2 = { X: (x: number) => number; Y: (y: number) => number };

export function contourPaths(m: Map2, f: (x: number, y: number) => number,
  x0: number, x1: number, y0: number, y1: number, levels: number[], nx = 64, ny = 48) {
  const xs = Array.from({ length: nx + 1 }, (_, i) => x0 + ((x1 - x0) * i) / nx);
  const ys = Array.from({ length: ny + 1 }, (_, j) => y0 + ((y1 - y0) * j) / ny);
  const v = ys.map(y => xs.map(x => f(x, y)));
  return levels.map(c => {
    let d = "";
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const q: [number, number, number][] = [[xs[i], ys[j], v[j][i]], [xs[i + 1], ys[j], v[j][i + 1]], [xs[i + 1], ys[j + 1], v[j + 1][i + 1]], [xs[i], ys[j + 1], v[j + 1][i]]];
      const pts: [number, number][] = [];
      for (let e = 0; e < 4; e++) {
        const [ax, ay, az] = q[e], [bx, by, bz] = q[(e + 1) % 4];
        if ((az < c) !== (bz < c)) { const u = (c - az) / (bz - az); pts.push([ax + (bx - ax) * u, ay + (by - ay) * u]); }
      }
      for (let p = 0; p + 1 < pts.length; p += 2)
        d += `M${m.X(pts[p][0]).toFixed(1)},${m.Y(pts[p][1]).toFixed(1)}L${m.X(pts[p + 1][0]).toFixed(1)},${m.Y(pts[p + 1][1]).toFixed(1)}`;
    }
    return { c, d };
  });
}

/** Levels spaced geometrically between lo and hi: equal steps on a log scale. */
export const geoLevels = (lo: number, hi: number, n: number) =>
  Array.from({ length: n }, (_, k) => lo * (hi / lo) ** (k / (n - 1)));

// ── Half-plane of a linear classifier ─────────────────────────────────────────

/** The rectangle [x0, x1] × [y0, y1] clipped to the side where z(x, y) ≥ 0 (z linear),
 *  as a polygon in world coordinates, plus the two ends of the line z = 0 inside it. */
export function halfPlane(z: (x: number, y: number) => number, x0: number, x1: number, y0: number, y1: number) {
  const cs: [number, number][] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const poly: [number, number][] = [], ends: [number, number][] = [];
  cs.forEach((p, k) => {
    const q = cs[(k + 1) % 4], zp = z(...p), zq = z(...q);
    if (zp >= 0) poly.push(p);
    if ((zp >= 0) !== (zq >= 0)) {
      const u = zp / (zp - zq), c: [number, number] = [p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1])];
      poly.push(c); ends.push(c);
    }
  });
  return { poly, ends };
}
