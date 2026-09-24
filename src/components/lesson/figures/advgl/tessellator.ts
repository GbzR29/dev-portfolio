// ── A CPU model of OpenGL's fixed-function tessellator ────────────────────────
// Produces the same kind of pattern as the primitive generator between the TCS
// and the TES: the domain is split into concentric rings by the inner level,
// the outermost ring is replaced by the outer levels (one per edge), and
// neighbouring rings are stitched with triangles.
//
// Vertex positions follow the spec's spacing rules. The exact triangulation
// inside a ring and where the two short fractional segments go differ between
// GPUs; the spec only fixes the vertex positions on each edge.

export type Spacing = "equal_spacing" | "fractional_even_spacing" | "fractional_odd_spacing";

/** Segment count and the (clamped) real-valued level for a requested level. */
export function effective(level: number, spacing: Spacing): { count: number; f: number } {
  if (spacing === "equal_spacing") {
    const f = Math.min(64, Math.max(1, level));
    return { count: Math.ceil(f - 1e-6), f: Math.ceil(f - 1e-6) };
  }
  if (spacing === "fractional_even_spacing") {
    const f = Math.min(64, Math.max(2, level));
    return { count: 2 * Math.ceil(f / 2 - 1e-6), f };
  }
  const f = Math.min(63, Math.max(1, level));
  return { count: 2 * Math.ceil((f - 1) / 2 - 1e-6) + 1, f };
}

/**
 * Positions 0..1 of the vertices on an edge with `count` segments at real level f:
 * count − 2 segments of length 1/f and two equal short ones, placed symmetrically,
 * so that as f grows a new vertex pair slides out of a point instead of popping in.
 */
export function positions(count: number, f: number): number[] {
  if (count <= 0) return [0];
  if (count <= 2 || Math.abs(f - count) < 1e-6) return Array.from({ length: count + 1 }, (_, i) => i / count);
  const long = 1 / f, short = (1 - (count - 2) * long) / 2;
  const shortAt = count % 2 === 0 ? [count / 2 - 1, count / 2] : [(count - 1) / 2 - 1, (count - 1) / 2 + 1];
  const out = [0];
  for (let i = 0; i < count; i++) out.push(out[i] + (shortAt.includes(i) ? short : long));
  out[count] = 1;
  return out;
}

export const edgePositions = (level: number, spacing: Spacing) => { const e = effective(level, spacing); return positions(e.count, e.f); };

type Pt = number[];
export type TessResult = { tris: [Pt, Pt, Pt][] };

/** Stitches two roughly parallel polylines (a = outer, b = inner) whose ends are joined. */
function zip(a: Pt[], b: Pt[], out: [Pt, Pt, Pt][]) {
  let i = 0, j = 0;
  const na = a.length - 1, nb = b.length - 1;
  while (i < na || j < nb) {
    const ta = na ? (i + 0.5) / na : Infinity, tb = nb ? (j + 0.5) / nb : Infinity;
    if (j >= nb || (i < na && ta <= tb)) { out.push([a[i], a[i + 1], b[j]]); i++; }
    else { out.push([a[i], b[j + 1], b[j]]); j++; }
  }
}

const lerpPt = (p: Pt, q: Pt, s: number) => p.map((v, k) => v + (q[k] - v) * s);

/**
 * Quad domain. Points are gl_TessCoord (u, v).
 * outer[0] = edge u = 0, outer[1] = v = 0, outer[2] = u = 1, outer[3] = v = 1;
 * inner[0] subdivides along u, inner[1] along v.
 */
export function tessQuad(inner: [number, number], outer: [number, number, number, number], spacing: Spacing): TessResult {
  const tris: [Pt, Pt, Pt][] = [];
  const allOne = [...inner, ...outer].every(l => effective(l, spacing).count === 1);
  if (allOne) return { tris: [[[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 1], [0, 1]]] };
  // An inner level of 1 with any outer level above 1 is treated as 1 + ε
  const ei = inner.map(l => { const e = effective(l, spacing); return e.count === 1 ? effective(1 + 1e-3, spacing) : e; });
  const pu = positions(ei[0].count, ei[0].f), pv = positions(ei[1].count, ei[1].f);
  const m = ei[0].count, n = ei[1].count;

  // Interior grid (the concentric inner rings share these vertices)
  for (let i = 1; i < m - 1; i++) for (let j = 1; j < n - 1; j++) {
    const a = [pu[i], pv[j]], b = [pu[i + 1], pv[j]], c = [pu[i + 1], pv[j + 1]], d = [pu[i], pv[j + 1]];
    tris.push([a, b, c], [a, c, d]);
  }
  // The outer ring: each domain edge stitched to the matching side of the inner rectangle
  const range = (a: number, b: number) => { const r: number[] = []; if (a <= b) for (let k = a; k <= b; k++) r.push(k); else for (let k = a; k >= b; k--) r.push(k); return r; };
  const side = (from: Pt, to: Pt, level: number, innerPts: Pt[]) =>
    zip(edgePositions(level, spacing).map(s => lerpPt(from, to, s)), innerPts, tris);
  side([0, 0], [1, 0], outer[1], range(1, m - 1).map(i => [pu[i], pv[1]]));
  side([1, 0], [1, 1], outer[2], range(1, n - 1).map(j => [pu[m - 1], pv[j]]));
  side([1, 1], [0, 1], outer[3], range(m - 1, 1).map(i => [pu[i], pv[n - 1]]));
  side([0, 1], [0, 0], outer[0], range(n - 1, 1).map(j => [pu[1], pv[j]]));
  return { tris };
}

/**
 * Triangle domain. Points are barycentric gl_TessCoord (u, v, w).
 * outer[0] = edge u = 0, outer[1] = v = 0, outer[2] = w = 0.
 */
export function tessTri(inner: number, outer: [number, number, number], spacing: Spacing): TessResult {
  const tris: [Pt, Pt, Pt][] = [];
  const P: Pt[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const allOne = [inner, ...outer].every(l => effective(l, spacing).count === 1);
  if (allOne) return { tris: [[P[0], P[1], P[2]]] };
  let e = effective(inner, spacing);
  if (e.count === 1) e = effective(1 + 1e-3, spacing);
  const p = positions(e.count, e.f);
  const C = [1 / 3, 1 / 3, 1 / 3];
  // Ring k: the triangle scaled toward the centroid by 1 − 2·p[k]; its edges carry count − 2k segments
  const ringCorners = (k: number) => P.map(c => lerpPt(C, c, 1 - 2 * p[k]));
  const ringSide = (k: number, j: number): Pt[] => {
    const cs = ringCorners(k), cnt = e.count - 2 * k;
    if (cnt <= 0) return [C];
    return positions(cnt, e.f - 2 * k).map(s => lerpPt(cs[j], cs[(j + 1) % 3], s));
  };
  // Side j runs P[j] → P[j+1]; its outer level is the one for the edge where the third coordinate is 0
  const outerFor = [outer[2], outer[0], outer[1]];
  const rings = Math.floor(e.count / 2);
  for (let k = 0; k < rings; k++) {
    for (let j = 0; j < 3; j++) {
      const a = k === 0 ? edgePositions(outerFor[j], spacing).map(s => lerpPt(P[j], P[(j + 1) % 3], s)) : ringSide(k, j);
      zip(a, ringSide(k + 1, j), tris);
    }
  }
  // Odd counts leave a small central triangle
  if (e.count % 2 === 1) {
    const last = ringCorners(rings);
    if (e.count - 2 * rings === 1) tris.push([last[0], last[1], last[2]]);
  }
  return { tris };
}
