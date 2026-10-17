// ── Tic-tac-toe and game-tree search for the AI track's figures ──────────────
// The board is 9 cells, row-major (0 = empty, 1 = X, 2 = O); X moves first.
// Minimax and alpha-beta count the nodes they visit, so the chapter's numbers
// (549 946 nodes for the full tree, and the alpha-beta savings) come from
// running this file under Node.

import type { Game } from "./mcts";

export type Cell = 0 | 1 | 2;
export type Board = Cell[];

export const EMPTY: Board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]] as const;

/** 0 = still playing, 1 = X has won, 2 = O has won, 3 = draw. */
export function winner(b: Board): 0 | 1 | 2 | 3 {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as 1 | 2;
  return b.includes(0) ? 0 : 3;
}

export const filled = (b: Board) => b.reduce<number>((n, c) => n + (c ? 1 : 0), 0);
export const toMove = (b: Board): 1 | 2 => (filled(b) % 2 === 0 ? 1 : 2);
export const moves = (b: Board) => b.flatMap((c, i) => (c ? [] : [i]));
export function play(b: Board, m: number): Board { const n = b.slice(); n[m] = toMove(b); return n; }

/** The value of a finished game for X: a win is worth more the sooner it comes (10 − marks on the board). */
export function terminal(b: Board): number | null {
  const w = winner(b);
  if (w === 0) return null;
  if (w === 3) return 0;
  return (w === 1 ? 1 : -1) * (10 - filled(b));
}

/** A guess for an unfinished position, for depth-limited search: lines still open for X minus lines still open for O. */
export function heuristic(b: Board) {
  let s = 0;
  for (const l of LINES) {
    const xs = l.filter(i => b[i] === 1).length, os = l.filter(i => b[i] === 2).length;
    if (!os && xs) s += xs;                                  // a line only X can still complete
    if (!xs && os) s -= os;
  }
  return s * 0.1;                                            // well inside ±1, below any real win
}

/** Centre, then corners, then edges: the order that makes alpha-beta prune most in tic-tac-toe. */
export const GOOD_ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

export type SearchOpts = { alphaBeta?: boolean; depth?: number; order?: readonly number[] };
export type Counter = { nodes: number };

/** Minimax value of b for X (X maximises, O minimises), counting every node visited. */
export function minimax(b: Board, o: SearchOpts, cnt: Counter, depth = 0, alpha = -Infinity, beta = Infinity): number {
  cnt.nodes++;
  const v = terminal(b);
  if (v !== null) return v;
  if (o.depth !== undefined && depth >= o.depth) return heuristic(b);
  const ms = o.order ? o.order.filter(i => !b[i]) : moves(b);
  const max = toMove(b) === 1;
  let best = max ? -Infinity : Infinity;
  for (const m of ms) {
    const s = minimax(play(b, m), o, cnt, depth + 1, alpha, beta);
    if (max) { best = Math.max(best, s); alpha = Math.max(alpha, s); }
    else     { best = Math.min(best, s); beta = Math.min(beta, s); }
    if (o.alphaBeta && alpha >= beta) break;                 // the opponent will never allow this line: prune
  }
  return best;
}

/** The minimax value of every legal move (for X's point of view), and the nodes it took. */
export function scoreMoves(b: Board, o: SearchOpts = {}) {
  const cnt = { nodes: 1 };
  const out = moves(b).map(m => ({ m, v: minimax(play(b, m), o, cnt, 1) }));
  return { moves: out, nodes: cnt.nodes };
}

/** The best move for the player to move (ties broken by `rng`, or the first one). */
export function bestMove(b: Board, o: SearchOpts = {}, rng?: () => number) {
  const { moves: ms } = scoreMoves(b, o);
  const sign = toMove(b) === 1 ? 1 : -1;
  const top = Math.max(...ms.map(x => sign * x.v));
  const best = ms.filter(x => Math.abs(sign * x.v - top) < 1e-9);
  return best[rng ? Math.floor(rng() * best.length) : 0].m;
}

/** "X wins in 3", "draw", "O wins in 1": a terminal-scored value in words-ready parts. */
export function describe(v: number, b: Board) {
  if (Math.abs(v) < 1e-9) return { kind: "draw" as const, plies: 0 };
  if (Math.abs(v) < 1) return { kind: "guess" as const, plies: 0 };
  const endMarks = 10 - Math.abs(v);
  return { kind: v > 0 ? ("x" as const) : ("o" as const), plies: endMarks - filled(b) };
}

/** Tic-tac-toe as a Game for Monte Carlo tree search (mcts.ts). */
export const TTT: Game<Board> = { moves, play, toMove, winner };
