// ── A small graph model for the Discrete Mathematics widgets ─────────────────
// Vertices are points in viewBox units; edges are pairs of vertex indices and
// may repeat (Königsberg has parallel bridges). Everything here is pure: the
// widgets keep a Graph in state and ask this file about it.

export type Pt = { x: number; y: number };
export type Graph = { pts: Pt[]; edges: [number, number][] };

// ── Basic counts ──
export function degrees(g: Graph): number[] {
  const d = g.pts.map(() => 0);
  for (const [a, b] of g.edges) { d[a]++; d[b]++; }
  return d;
}

export const oddVertices = (g: Graph) => degrees(g).flatMap((d, i) => (d % 2 ? [i] : []));

export const hasEdge = (g: Graph, a: number, b: number) =>
  g.edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));

/** The other end of edge e seen from vertex v. */
export const other = (g: Graph, e: number, v: number) => (g.edges[e][0] === v ? g.edges[e][1] : g.edges[e][0]);

/** Component label of every vertex (0, 1, 2, …) and how many components there are. */
export function components(g: Graph): { comp: number[]; count: number } {
  const comp = g.pts.map(() => -1);
  let count = 0;
  for (let s = 0; s < g.pts.length; s++) {
    if (comp[s] >= 0) continue;
    const stack = [s];
    comp[s] = count;
    while (stack.length) {
      const v = stack.pop()!;
      for (const [a, b] of g.edges) {
        const w = a === v ? b : b === v ? a : -1;
        if (w >= 0 && comp[w] < 0) { comp[w] = count; stack.push(w); }
      }
    }
    count++;
  }
  return { comp, count };
}

/** Connected, ignoring vertices with no edges (they do not matter for Euler trails). */
export function edgesConnected(g: Graph) {
  const { comp } = components(g), d = degrees(g);
  const used = new Set(d.flatMap((k, i) => (k > 0 ? [comp[i]] : [])));
  return used.size <= 1;
}

// ── Euler ──
export type EulerKind = "circuit" | "trail" | "none" | "split" | "empty";

/** What Euler's theorem says about this graph. */
export function eulerKind(g: Graph): EulerKind {
  if (!g.edges.length) return "empty";
  if (!edgesConnected(g)) return "split";
  const odd = oddVertices(g).length;
  return odd === 0 ? "circuit" : odd === 2 ? "trail" : "none";
}

/** An Euler trail as a list of edge indices (Hierholzer), from `start`; null if there is none. */
export function eulerTrail(g: Graph, start?: number): { edges: number[]; verts: number[] } | null {
  const kind = eulerKind(g);
  if (kind !== "circuit" && kind !== "trail") return null;
  const odd = oddVertices(g), d = degrees(g);
  const s = start ?? (odd.length ? odd[0] : d.findIndex(k => k > 0));
  if (kind === "trail" && !odd.includes(s)) return null;
  const used = g.edges.map(() => false);
  // stack of [vertex, edge used to reach it]
  const stack: [number, number][] = [[s, -1]];
  const verts: number[] = [], edges: number[] = [];
  while (stack.length) {
    const [v, via] = stack[stack.length - 1];
    const e = g.edges.findIndex((ed, i) => !used[i] && (ed[0] === v || ed[1] === v));
    if (e < 0) {
      stack.pop();
      verts.push(v);
      if (via >= 0) edges.push(via);
    } else {
      used[e] = true;
      stack.push([other(g, e, v), e]);
    }
  }
  verts.reverse(); edges.reverse();
  return edges.length === g.edges.length ? { edges, verts } : null;
}

// ── Trees ──
/** Union–find over the vertices; `join` says false when the edge would close a cycle. */
export function unionFind(n: number) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  return {
    find,
    join(a: number, b: number) {
      const ra = find(a), rb = find(b);
      if (ra === rb) return false;
      parent[ra] = rb;
      return true;
    },
  };
}

/** The edges of the path from a to b inside the chosen edge set (a forest), or null. */
export function pathIn(g: Graph, chosen: number[], a: number, b: number): number[] | null {
  const prev = new Map<number, [number, number]>([[a, [-1, -1]]]);
  const queue = [a];
  while (queue.length) {
    const v = queue.shift()!;
    if (v === b) break;
    for (const e of chosen) {
      const [x, y] = g.edges[e];
      const w = x === v ? y : y === v ? x : -1;
      if (w >= 0 && !prev.has(w)) { prev.set(w, [v, e]); queue.push(w); }
    }
  }
  if (!prev.has(b)) return null;
  const out: number[] = [];
  for (let v = b; v !== a;) { const [p, e] = prev.get(v)!; out.push(e); v = p; }
  return out;
}

// ── Drawing: crossings and faces ──
function cross(a: Pt, b: Pt, c: Pt) { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }

/** Whether two segments cross at a point inside both (shared end points do not count). */
export function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** Indices of edges involved in a crossing, and the number of crossing pairs. */
export function crossings(g: Graph): { pairs: number; bad: Set<number> } {
  const bad = new Set<number>();
  let pairs = 0;
  for (let i = 0; i < g.edges.length; i++) for (let j = i + 1; j < g.edges.length; j++) {
    const [a, b] = g.edges[i], [c, d] = g.edges[j];
    if (a === c || a === d || b === c || b === d) continue;
    if (segmentsCross(g.pts[a], g.pts[b], g.pts[c], g.pts[d])) { pairs++; bad.add(i); bad.add(j); }
  }
  return { pairs, bad };
}

/**
 * The faces of a straight-line drawing with no crossings, found by walking
 * around them: leave each vertex along the next edge clockwise from the one
 * you arrived by. Each face is its list of vertices; `outer` is the index of
 * the unbounded face of each component (the one walked the other way round).
 * Only for simple graphs.
 */
export function faces(g: Graph): { cycles: number[][]; outer: number[] } {
  const n = g.pts.length;
  const nbrs: number[][] = g.pts.map(() => []);
  for (const [a, b] of g.edges) { nbrs[a].push(b); nbrs[b].push(a); }
  const ang = (v: number, w: number) => Math.atan2(g.pts[w].y - g.pts[v].y, g.pts[w].x - g.pts[v].x);
  for (let v = 0; v < n; v++) nbrs[v].sort((p, q) => ang(v, p) - ang(v, q));
  const seen = new Set<string>();
  const cycles: number[][] = [], area: number[] = [];
  for (const [a0, b0] of g.edges) for (const [s, t] of [[a0, b0], [b0, a0]]) {
    if (seen.has(`${s},${t}`)) continue;
    const cyc: number[] = [];
    let u = s, v = t;
    while (!seen.has(`${u},${v}`)) {
      seen.add(`${u},${v}`);
      cyc.push(u);
      const list = nbrs[v], k = list.indexOf(u);
      const w = list[(k - 1 + list.length) % list.length];
      u = v; v = w;
    }
    let A = 0;
    for (let i = 0; i < cyc.length; i++) {
      const p = g.pts[cyc[i]], q = g.pts[cyc[(i + 1) % cyc.length]];
      A += p.x * q.y - q.x * p.y;
    }
    cycles.push(cyc); area.push(A / 2);
  }
  // In viewBox coordinates (y down) the bounded faces come out with one sign;
  // the outer face of each component is the one with the other sign (or zero, for a tree).
  const outer = cycles.flatMap((_, i) => (area[i] <= 1e-6 ? [i] : []));
  return { cycles, outer };
}

// ── Colouring ──
/** Edges whose two ends have the same colour (−1 = uncoloured never clashes). */
export const clashes = (g: Graph, col: number[]) =>
  g.edges.flatMap(([a, b], i) => (col[a] >= 0 && col[a] === col[b] ? [i] : []));

/** Greedy colouring in the given vertex order: each vertex takes the smallest colour its neighbours do not use. */
export function greedy(g: Graph, order = g.pts.map((_, i) => i)): number[] {
  const col = g.pts.map(() => -1);
  for (const v of order) {
    const taken = new Set(g.edges.flatMap(([a, b]) => (a === v ? [col[b]] : b === v ? [col[a]] : [])));
    let c = 0;
    while (taken.has(c)) c++;
    col[v] = c;
  }
  return col;
}

/** The chromatic number, by backtracking (fine for the small graphs drawn here). */
export function chromatic(g: Graph): number {
  const n = g.pts.length;
  if (!n) return 0;
  if (!g.edges.length) return 1;
  const adj = g.pts.map((_, v) => g.edges.flatMap(([a, b]) => (a === v ? [b] : b === v ? [a] : [])));
  const order = g.pts.map((_, i) => i).sort((p, q) => adj[q].length - adj[p].length);
  const col = g.pts.map(() => -1);
  const tryK = (k: number, i: number): boolean => {
    if (i === n) return true;
    const v = order[i];
    for (let c = 0; c < k; c++) {
      if (adj[v].some(w => col[w] === c)) continue;
      col[v] = c;
      if (tryK(k, i + 1)) return true;
      col[v] = -1;
      if (adj[v].every(w => col[w] < 0) && c > 0) break;      // symmetry: an untouched vertex needs only try one new colour
    }
    return false;
  };
  for (let k = 1; k <= n; k++) { col.fill(-1); if (tryK(k, 0)) return k; }
  return n;
}

// ── Presets ──
/** n points on a circle around (cx, cy), starting at the top. */
export function ring(n: number, cx: number, cy: number, r: number, turn = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + turn + (2 * Math.PI * i) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

export const complete = (n: number) => {
  const e: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) e.push([i, j]);
  return e;
};

export const cycle = (n: number, from = 0): [number, number][] =>
  Array.from({ length: n }, (_, i) => [from + i, from + ((i + 1) % n)]);

export const copy = (g: Graph): Graph => ({ pts: g.pts.map(p => ({ ...p })), edges: g.edges.map(e => [e[0], e[1]]) });

/** The Petersen graph: an outer pentagon, an inner pentagram, spokes. */
export function petersen(cx: number, cy: number, R: number, r: number): Graph {
  const pts = [...ring(5, cx, cy, R), ...ring(5, cx, cy, r)];
  const edges: [number, number][] = [...cycle(5), ...Array.from({ length: 5 }, (_, i) => [5 + i, 5 + ((i + 2) % 5)] as [number, number]),
    ...Array.from({ length: 5 }, (_, i) => [i, 5 + i] as [number, number])];
  return { pts, edges };
}
