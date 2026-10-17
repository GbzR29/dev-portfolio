// ── Monte Carlo tree search for the AI track's figures ──────────────────────
// UCT (Kocsis & Szepesvári 2006) over any two-player game that gives its
// moves, plays a move and says who won. Each node stores N (visits) and W
// (wins, for the player who made the move into it; a draw counts ½), so a
// parent picks the child that is best for the player choosing there. One
// iteration = selection, expansion, simulation (a random playout), and
// backpropagation; `iterate` can report each phase for the step-by-step figure.

export type Rng = () => number;

export interface Game<S> {
  moves(s: S): number[];
  play(s: S, m: number): S;
  /** Who is to move: 1 or 2. */
  toMove(s: S): 1 | 2;
  /** 0 = playing, 1 or 2 = that player won, 3 = draw. */
  winner(s: S): 0 | 1 | 2 | 3;
}

export type Node<S> = {
  state: S;
  move: number;                 // the move that led here (−1 at the root)
  player: 1 | 2 | 0;            // who made that move (0 at the root)
  parent: Node<S> | null;
  children: Node<S>[];
  untried: number[];            // legal moves not expanded yet
  N: number;
  W: number;
  id: number;                   // creation order, for drawing
};

export function makeRoot<S>(g: Game<S>, s: S): Node<S> {
  return { state: s, move: -1, player: 0, parent: null, children: [], untried: g.winner(s) ? [] : g.moves(s), N: 0, W: 0, id: 0 };
}

/** UCB1 score of child c seen from its parent: its win rate plus an exploration bonus. */
export function ucb(c: { N: number; W: number }, parentN: number, k: number) {
  if (c.N === 0) return Infinity;
  return c.W / c.N + k * Math.sqrt(Math.log(parentN) / c.N);
}

export type Trace<S> = {
  path: Node<S>[];              // root … selected node (selection)
  added: Node<S> | null;        // the new node (expansion), null at a finished game
  playout: number[];            // the random moves of the simulation
  result: 0 | 1 | 2 | 3;        // who won the playout (3 = draw)
};

/** One MCTS iteration from `root`; returns what each phase did. */
export function iterate<S>(g: Game<S>, root: Node<S>, k: number, rng: Rng, counter = { next: 1 }): Trace<S> {
  // 1. selection: while the node is fully expanded and has children, follow the best UCB1 child
  let n = root;
  const path = [n];
  while (n.untried.length === 0 && n.children.length > 0) {
    let best = n.children[0], bs = -Infinity;
    for (const c of n.children) { const s = ucb(c, n.N, k); if (s > bs) { bs = s; best = c; } }
    n = best;
    path.push(n);
  }
  // 2. expansion: add one untried move as a new child
  let added: Node<S> | null = null;
  if (n.untried.length > 0) {
    const i = Math.floor(rng() * n.untried.length);
    const m = n.untried.splice(i, 1)[0];
    const s = g.play(n.state, m);
    added = { state: s, move: m, player: g.toMove(n.state), parent: n, children: [], untried: g.winner(s) ? [] : g.moves(s), N: 0, W: 0, id: counter.next++ };
    n.children.push(added);
    n = added;
    path.push(n);
  }
  // 3. simulation: random moves to the end of the game
  let s = n.state;
  const playout: number[] = [];
  while (!g.winner(s)) { const ms = g.moves(s); const m = ms[Math.floor(rng() * ms.length)]; playout.push(m); s = g.play(s, m); }
  const result = g.winner(s);
  // 4. backpropagation: every node on the path counts the visit and the result for its mover
  for (const p of path) {
    p.N++;
    if (result === 3) p.W += 0.5;
    else if (result === p.player) p.W += 1;
  }
  return { path, added, playout, result };
}

/** Run `iters` iterations; returns the root. */
export function search<S>(g: Game<S>, s: S, iters: number, k: number, rng: Rng) {
  const root = makeRoot(g, s), counter = { next: 1 };
  for (let i = 0; i < iters; i++) iterate(g, root, k, rng, counter);
  return root;
}

/** The final choice: the most visited child (the "robust child"). */
export function mostVisited<S>(root: Node<S>) {
  let best = root.children[0];
  for (const c of root.children) if (c.N > best.N) best = c;
  return best;
}

export const countNodes = <S>(n: Node<S>): number => 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
