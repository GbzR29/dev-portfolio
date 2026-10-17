// ── A small game tree searched step by step (GameTreeFigure) ─────────────────
// MAX at the root, three MIN nodes, six MAX nodes, twelve leaves. `trace` runs
// minimax (or alpha-beta) and records one frame per event, so the figure can
// play the search forward and back: entering a node with its window [α, β],
// reading a leaf, a node's value improving, a cut-off, a node finishing.

export type Kind = "max" | "min" | "leaf";
export type TNode = { id: number; kind: Kind; children: number[]; leaf?: number; depth: number; parent: number };

const LEAVES = [3, 5, 6, 9, 1, 2, 0, -1, 8, 7, 4, 2];

/** The tree, nodes in breadth-first order: 0 = root, 1–3 MIN, 4–9 MAX, 10–21 leaves. */
export const TREE: TNode[] = (() => {
  const n: TNode[] = [{ id: 0, kind: "max", children: [1, 2, 3], depth: 0, parent: -1 }];
  for (let i = 0; i < 3; i++) n.push({ id: 1 + i, kind: "min", children: [4 + 2 * i, 5 + 2 * i], depth: 1, parent: 0 });
  for (let i = 0; i < 6; i++) n.push({ id: 4 + i, kind: "max", children: [10 + 2 * i, 11 + 2 * i], depth: 2, parent: 1 + (i >> 1) });
  for (let i = 0; i < 12; i++) n.push({ id: 10 + i, kind: "leaf", children: [], leaf: LEAVES[i], depth: 3, parent: 4 + (i >> 1) });
  return n;
})();

export type FrameKind = "start" | "enter" | "leaf" | "better" | "cut" | "done";
export type Frame = {
  kind: FrameKind;
  node: number;
  value: (number | null)[];          // the best value found so far at each node (null = not reached)
  window: ([number, number] | null)[]; // α, β at each node while it is open
  open: boolean[];                   // on the current search path
  pruned: boolean[];                 // skipped by a cut-off
  leaves: number;                    // leaves read so far
  child?: number;                    // the child that just reported (better) or the first one skipped (cut)
};

export function trace(alphaBeta: boolean): Frame[] {
  const N = TREE.length;
  const value: (number | null)[] = Array(N).fill(null);
  const window: ([number, number] | null)[] = Array(N).fill(null);
  const open = Array(N).fill(false), pruned = Array(N).fill(false);
  let leaves = 0;
  const frames: Frame[] = [];
  const snap = (kind: FrameKind, node: number, child?: number) =>
    frames.push({ kind, node, value: value.slice(), window: window.map(w => (w ? [w[0], w[1]] : null)), open: open.slice(), pruned: pruned.slice(), leaves, child });
  const prune = (id: number) => { pruned[id] = true; TREE[id].children.forEach(prune); };

  const visit = (id: number, alpha: number, beta: number): number => {
    const nd = TREE[id];
    open[id] = true;
    if (nd.kind === "leaf") {
      leaves++;
      value[id] = nd.leaf!;
      snap("leaf", id);
      open[id] = false;
      return nd.leaf!;
    }
    window[id] = [alpha, beta];
    snap("enter", id);
    const max = nd.kind === "max";
    let best = max ? -Infinity : Infinity;
    for (let k = 0; k < nd.children.length; k++) {
      const c = nd.children[k];
      const v = visit(c, alpha, beta);
      if (max ? v > best : v < best) {
        best = v;
        value[id] = v;
        if (alphaBeta) { if (max) alpha = Math.max(alpha, v); else beta = Math.min(beta, v); window[id] = [alpha, beta]; }
        snap("better", id, c);
      }
      if (alphaBeta && alpha >= beta && k < nd.children.length - 1) {
        for (const rest of nd.children.slice(k + 1)) prune(rest);
        snap("cut", id, nd.children[k + 1]);
        break;
      }
    }
    open[id] = false;
    window[id] = null;
    snap("done", id);
    return best;
  };

  snap("start", 0);
  visit(0, -Infinity, Infinity);
  return frames;
}
