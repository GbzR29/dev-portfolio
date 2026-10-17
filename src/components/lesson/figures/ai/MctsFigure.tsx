"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Btn, C, T, mulberry32, useRerender } from "@/components/lesson/kit/figure";
import { countNodes, iterate, makeRoot, mostVisited, type Node } from "./mcts";
import { EMPTY, TTT, moves, play, toMove, winner, type Board } from "./ttt";

// ── What this figure shows ────────────────────────────────────────────────────
// Monte Carlo tree search with a budget you spend: each button runs more
// iterations from the same tree. Every empty square shows its visits N and the
// win rate for the player to move. The search plays the most visited move.
// Beside it, flat Monte Carlo spends the same number of random playouts evenly
// on the moves, with no tree: on the puzzle it prefers square 2 (37% for O)
// over the block at 5 (32%), because random X players rarely finish their row.
// The exploration constant c is the break-it control: at 0 the search can lock
// onto an early lucky move (45% right at any budget); at 4 it needs about 1 000
// iterations where 0.5 to 1.4 need a few hundred.

type Pos = "puzzle" | "empty";
const BOARDS: Record<Pos, Board> = { puzzle: [2, 0, 0, 1, 1, 0, 0, 0, 0], empty: EMPTY };
const S = 62, PAD = 10, BW = S * 3 + PAD * 2;

/** Flat Monte Carlo: `n` random playouts split evenly over the moves; returns each move's win rate for the mover. */
function flat(b: Board, n: number, seed: number) {
  const rng = mulberry32(seed), me = toMove(b), ms = moves(b);
  const per = Math.max(1, Math.floor(n / ms.length));
  return new Map(ms.map(m => {
    let w = 0;
    for (let i = 0; i < per; i++) {
      let s = play(b, m);
      while (!winner(s)) { const mm = moves(s); s = play(s, mm[Math.floor(rng() * mm.length)]); }
      const r = winner(s);
      w += r === me ? 1 : r === 3 ? 0.5 : 0;
    }
    return [m, w / per] as const;
  }));
}

export function MctsFigure({ t }: { t?: TrackTranslations }) {
  const [pos, setPos] = useState<Pos>("puzzle");
  const [c, setC] = useState(Math.SQRT2);
  const [seed, setSeed] = useState(1);
  const tree = useRef<{ root: Node<Board>; rng: () => number; counter: { next: number }; iters: number } | null>(null);
  const [flatRates, setFlatRates] = useState<Map<number, number> | null>(null);
  const rerender = useRerender();
  const L = (k: string, en: string) => tx(t, `figAiMcts_${k}`, en);

  const b = BOARDS[pos];
  if (!tree.current) tree.current = { root: makeRoot(TTT, b), rng: mulberry32(seed), counter: { next: 1 }, iters: 0 };
  const T0 = tree.current;

  const reset = (p = pos, sd = seed) => {
    tree.current = { root: makeRoot(TTT, BOARDS[p]), rng: mulberry32(sd), counter: { next: 1 }, iters: 0 };
    setFlatRates(null);
  };
  const run = (n: number) => {
    for (let i = 0; i < n; i++) iterate(TTT, T0.root, c, T0.rng, T0.counter);
    T0.iters += n;
    setFlatRates(flat(b, T0.iters, seed + 99));
    rerender();
  };

  const stats = new Map(T0.root.children.map(ch => [ch.move, ch]));
  const best = T0.iters > 0 ? mostVisited(T0.root).move : -1;
  let flatBest = -1;
  if (flatRates) { let bv = -1; flatRates.forEach((v, m) => { if (v > bv) { bv = v; flatBest = m; } }); }
  const me = toMove(b);

  return (
    <Figure
      title={L("title", "Monte Carlo tree search: spend a playout budget")}
      head={<Choice value={pos} onChange={p => { setPos(p); reset(p); }} options={[["puzzle", L("puzzle", "puzzle: O to move")], ["empty", L("empty", "empty board")]] as const} />}
      controls={<>
        <Row>
          {[1, 10, 100, 1000].map(n => <Btn key={n} onClick={() => run(n)}>+{n}</Btn>)}
          <Btn onClick={() => reset()}>{L("reset", "reset")}</Btn>
          <Btn onClick={() => { const s2 = seed + 1; setSeed(s2); reset(pos, s2); }}>{L("reseed", "other random numbers")}</Btn>
        </Row>
        <Slider label={L("c", "exploration c")} value={c} min={0} max={4} step={0.05} onChange={v => { setC(v); reset(); }} fmt={v => v.toFixed(2)} />
        <Row>
          <Readout>{L("iters", "iterations")} {T0.iters}</Readout>
          <Readout>{L("nodes", "tree nodes")} {countNodes(T0.root)}</Readout>
          {best >= 0 && <Readout color={pos === "puzzle" ? (best === 5 ? C.green : C.red) : C.fg}>{L("mctsPlays", "MCTS plays")} {best}</Readout>}
          {flatBest >= 0 && <Readout color={pos === "puzzle" ? (flatBest === 5 ? C.green : C.red) : C.fg}>{L("flatPlays", "flat Monte Carlo plays")} {flatBest}</Readout>}
        </Row>
      </>}
      note={L("note", "The puzzle: O to move, and X threatens to complete the middle row, so O must block at 5; every other move loses. Each square shows N, how many iterations went through that move, and the win rate for the player to move (a draw counts ½); the bar under it is its share of the visits. Press +100 a few times: the visits pile up on 5, and MCTS plays the most visited move. Flat Monte Carlo (the small purple rate in each corner) spends the same number of random playouts evenly on every move, without a tree, and tends to pick 2: against an X that plays at random, X often fails to finish its row, so the other moves do not look as bad as they are. Now break it. Set c to 0: the search only exploits, sticks with whatever looked good first and finds 5 in about 45% of runs whatever the budget (use \"other random numbers\"). Set c to 4: it spreads its visits so evenly that it needs about 1 000 iterations. On the empty board, every move is a draw with perfect play, yet the centre collects about half the visits after 10 000 iterations: it wins most often when the rest of the game is random.")}
    >
      <div className="flex justify-center p-3">
        <svg viewBox={`0 0 ${BW} ${BW}`} className="w-full h-auto" style={{ maxWidth: 300 }} role="img">
          {[1, 2].map(i => (
            <g key={i}>
              <line x1={PAD + S * i} y1={PAD} x2={PAD + S * i} y2={PAD + S * 3} stroke={C.axis} strokeWidth={2} />
              <line x1={PAD} y1={PAD + S * i} x2={PAD + S * 3} y2={PAD + S * i} stroke={C.axis} strokeWidth={2} />
            </g>
          ))}
          {b.map((cell, i) => {
            const x = PAD + (i % 3) * S, y = PAD + Math.floor(i / 3) * S, cx = x + S / 2, cy = y + S / 2;
            const ch = stats.get(i);
            const share = ch && T0.root.N ? ch.N / T0.root.N : 0;
            return (
              <g key={i}>
                {cell === 1 && <g stroke={C.sky} strokeWidth={5} strokeLinecap="round"><line x1={cx - 15} y1={cy - 15} x2={cx + 15} y2={cy + 15} /><line x1={cx + 15} y1={cy - 15} x2={cx - 15} y2={cy + 15} /></g>}
                {cell === 2 && <circle cx={cx} cy={cy} r={17} fill="none" stroke={C.orange} strokeWidth={5} />}
                {!cell && (
                  <g>
                    {i === best && <rect x={x + 3} y={y + 3} width={S - 6} height={S - 6} rx={6} fill={me === 2 ? C.orange : C.sky} fillOpacity={0.12} />}
                    <T x={x + 5} y={y + 12} size={8.5} color={C.muted}>{i}</T>
                    {ch && ch.N > 0 && <>
                      <T x={cx} y={cy - 2} size={10.5} anchor="middle" bold color={C.fg}>N {ch.N}</T>
                      <T x={cx} y={cy + 12} size={9.5} anchor="middle" color={C.muted}>{`${Math.round((100 * ch.W) / ch.N)}%`}</T>
                      <rect x={x + 8} y={y + S - 12} width={S - 16} height={4} rx={2} fill={C.axis} fillOpacity={0.4} />
                      <rect x={x + 8} y={y + S - 12} width={(S - 16) * share} height={4} rx={2} fill={me === 2 ? C.orange : C.sky} />
                    </>}
                    {flatRates?.has(i) && <T x={x + S - 5} y={y + 12} size={8} anchor="end" color={C.purple}>{`${Math.round(100 * flatRates.get(i)!)}%`}</T>}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </Figure>
  );
}
