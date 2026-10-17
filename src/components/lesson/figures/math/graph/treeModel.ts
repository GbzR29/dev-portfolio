// ── Trees: Prüfer codes and the number of spanning trees ─────────────────────
// Pure functions for PruferFigure and SpanningTreeFigure (and the practice
// generators). Labels in Prüfer codes run 1..n.

import type { Graph } from "./graphModel";

/** Decode a Prüfer sequence on labels 1..n into its edges, in the order they are made. */
export function decode(seq: number[], n: number): [number, number][] {
  const deg = new Array(n + 1).fill(1);
  for (const s of seq) deg[s]++;
  const edges: [number, number][] = [];
  for (const s of seq) {
    let leaf = 1;
    while (deg[leaf] !== 1) leaf++;
    edges.push([leaf, s]);
    deg[leaf]--; deg[s]--;
  }
  const last: number[] = [];
  for (let v = 1; v <= n; v++) if (deg[v] === 1) last.push(v);
  edges.push([last[0], last[1]]);
  return edges;
}

/** Encode a labelled tree (edges on 1..n): each step removes the smallest leaf and writes its neighbour. */
export function encode(edges: [number, number][], n: number) {
  const adj = Array.from({ length: n + 1 }, () => new Set<number>());
  for (const [a, b] of edges) { adj[a].add(b); adj[b].add(a); }
  const alive = new Array(n + 1).fill(true);
  const steps: { leaf: number; nbr: number }[] = [];
  for (let k = 0; k < n - 2; k++) {
    let leaf = 1;
    while (!alive[leaf] || adj[leaf].size !== 1) leaf++;
    const nbr = [...adj[leaf]][0];
    steps.push({ leaf, nbr });
    adj[nbr].delete(leaf);
    alive[leaf] = false;
  }
  return steps;
}

/** A random labelled tree on 1..n: a random code, decoded, so every tree is equally likely. */
export const randomTree = (n: number) => decode(Array.from({ length: n - 2 }, () => 1 + Math.floor(Math.random() * n)), n);

/** Number of spanning trees: any cofactor of the Laplacian matrix (Kirchhoff's matrix-tree theorem). */
export function spanningCount(g: Graph): number {
  const n = g.pts.length;
  if (n < 2) return 1;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [a, b] of g.edges) { L[a][a]++; L[b][b]++; L[a][b]--; L[b][a]--; }
  const M = L.slice(1).map(row => row.slice(1));
  let det = 1;
  for (let c = 0; c < n - 1; c++) {
    let p = c;
    for (let r = c + 1; r < n - 1; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return 0;
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; det = -det; }
    det *= M[c][c];
    for (let r = c + 1; r < n - 1; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k < n - 1; k++) M[r][k] -= f * M[c][k];
    }
  }
  return Math.round(det);
}
