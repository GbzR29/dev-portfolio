"use client";

import { useMemo } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, C, T, mulberry32 } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { iterate, makeRoot, ucb, type Node } from "./mcts";
import { TTT, play, type Board } from "./ttt";

// ── What this figure shows ────────────────────────────────────────────────────
// The first 16 iterations of Monte Carlo tree search on the chapter's puzzle
// (O to move in O · · / X X · / · · ·), each split into its four phases:
// selection (follow the best UCB1 child), expansion (add one new node),
// simulation (random moves to the end) and backpropagation (every node on the
// path counts the visit and the result). Nodes show wins / visits for the
// player who made the move into them. The board on the right is the position
// at the end of the selected path, with the playout drawn faintly.

const START: Board = [2, 0, 0, 1, 1, 0, 0, 0, 0];
const ITERS = 16, K = Math.SQRT2;

type Snap = { N: number[]; W: number[] };
type It = { path: number[]; added: number; playout: number[]; result: 0 | 1 | 2 | 3; before: Snap; after: Snap; rootUcb: [number, number][] };
type Info = { id: number; parent: number; move: number; player: number; depth: number; born: number; board: Board };

function build() {
  const root = makeRoot(TTT, START);
  const rng = mulberry32(27), counter = { next: 1 };
  const all: Node<Board>[] = [root];
  const info: Info[] = [{ id: 0, parent: -1, move: -1, player: 0, depth: 0, born: 0, board: START }];
  const snap = (): Snap => ({ N: all.map(n => n.N), W: all.map(n => n.W) });
  const its: It[] = [];
  for (let i = 0; i < ITERS; i++) {
    const before = snap();
    const rootUcb: [number, number][] = root.untried.length === 0 ? root.children.map(c => [c.move, ucb(c, root.N, K)]) : [];
    const tr = iterate(TTT, root, K, rng, counter);
    if (tr.added) {
      all.push(tr.added);
      const p = tr.added.parent!;
      info.push({ id: tr.added.id, parent: p.id, move: tr.added.move, player: tr.added.player, depth: info[p.id].depth + 1, born: i, board: tr.added.state });
    }
    // `before` was taken before the new node existed: give it zeros
    before.N.push(0); before.W.push(0);
    its.push({ path: tr.path.map(n => n.id), added: tr.added ? tr.added.id : -1, playout: tr.playout, result: tr.result, before, after: snap(), rootUcb });
  }
  return { its, info };
}

const W = 640, H = 250, TW = 440;
const ROWY = [26, 92, 158, 214];
const BX = 470, BS = 46;

export function MctsStepsFigure({ t }: { t?: TrackTranslations }) {
  const { its, info } = useMemo(build, []);
  const steps = ITERS * 4;
  const s = useStepper(steps, 800, 400);
  const k = Math.min(steps, Math.round(s.raw));
  const L = (key: string, en: string) => tx(t, `figAiMctsS_${key}`, en);

  const it = k === 0 ? null : its[Math.floor((k - 1) / 4)];
  const phase = k === 0 ? -1 : (k - 1) % 4;                 // 0 select, 1 expand, 2 simulate, 3 backpropagate
  const iter = k === 0 ? 0 : Math.floor((k - 1) / 4);
  const stats = !it ? { N: [0], W: [0] } : phase === 3 ? it.after : it.before;
  const visible = (id: number) => id === 0 || (info[id].born < iter || (info[id].born === iter && phase >= 1));

  // ── layout: each level spreads its visible nodes under their parents ──
  const pos = useMemo(() => {
    const p = new Map<number, { x: number; y: number }>();
    const kids = (id: number) => info.filter(n => n.parent === id && visible(n.id)).sort((a, b) => a.move - b.move);
    const place = (id: number, x0: number, x1: number) => {
      const n = info[id];
      p.set(id, { x: (x0 + x1) / 2, y: ROWY[Math.min(3, n.depth)] });
      const ks = kids(id);
      ks.forEach((c, i) => place(c.id, x0 + ((x1 - x0) * i) / ks.length, x0 + ((x1 - x0) * (i + 1)) / ks.length));
    };
    place(0, 8, TW);
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, info]);

  const onPath = new Set(it && phase >= 0 ? it.path.filter(id => phase >= 1 || id !== it.added) : []);
  const leafId = it ? (phase >= 1 && it.added >= 0 ? it.added : it.path[it.path.length - 1]) : 0;
  const board = info[leafId].board;
  const who = (r: number) => (r === 1 ? "X" : r === 2 ? "O" : L("draw", "draw"));
  const cellName = (m: number) => String(m);

  let cap = L("c0", "O must block at square 5. Each node is a move; its numbers are wins / visits for the player who made that move. Press play or step through the four phases of each iteration.");
  if (it) {
    const pathTxt = it.path.filter(id => id !== it.added).map(id => (id === 0 ? L("root", "root") : cellName(info[id].move))).join(" → ");
    if (phase === 0) {
      cap = L("c1", "Selection ({i}/16). From the root, while every move of a node has been tried, go to the child with the highest UCB1 score. Path: {p}.").replace("{i}", String(iter + 1)).replace("{p}", pathTxt);
      if (it.rootUcb.length) cap += " " + L("c1u", "UCB1 at the root: {u}.").replace("{u}", it.rootUcb.map(([m, u]) => `${m}: ${u.toFixed(2)}`).join(", "));
      else cap += " " + L("c1n", "The root still has untried moves, so selection stops there.");
    } else if (phase === 1) {
      cap = it.added >= 0
        ? L("c2", "Expansion. Add one untried move as a new node: {who} plays {m}.").replace("{who}", info[it.added].player === 1 ? "X" : "O").replace("{m}", cellName(info[it.added].move))
        : L("c2n", "Expansion. The game is already over at this node: nothing to add.");
    } else if (phase === 2) {
      cap = (it.playout.length
        ? L("c3", "Simulation. From the new node, both sides play random moves to the end: {m}. Result: {r}.").replace("{m}", it.playout.join(", "))
        : L("c3n", "Simulation. No moves left to play. Result: {r}.")).replace("{r}", who(it.result));
    } else {
      cap = L("c4", "Backpropagation. Every node on the path adds 1 visit, and 1 win if the result is a win for the player who moved into it (a draw counts ½). Result: {r}.").replace("{r}", who(it.result));
    }
  }

  // the playout, drawn on the side board
  const playoutMarks = new Map<number, number>();
  if (it && phase >= 2) {
    let b = board;
    for (const m of it.playout) { playoutMarks.set(m, TTT.toMove(b)); b = play(b, m); }
  }

  return (
    <Figure
      title={L("title", "One MCTS iteration, phase by phase")}
      note={L("note", "The search starts with only the root. The first six iterations each add one of O's six possible moves, because a node with untried moves is expanded before anything below it is explored. From iteration 7 on, selection walks down using UCB1: a child's win rate plus a bonus that is large for children visited rarely. Random playouts after the other moves often end with X completing its row, so their win rates for O fall. After 16 iterations the block at 5 leads with 2.5 wins in 4 visits, but with so few playouts that is partly luck: other runs of 16 put another move ahead. A real search repeats the four phases thousands of times; the next figure does exactly that.")}
    >
      <div className="flex flex-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
          {info.filter(n => n.parent >= 0 && visible(n.id) && n.depth <= 3).map(n => {
            const a = pos.get(n.parent), b = pos.get(n.id);
            if (!a || !b) return null;
            const hot = onPath.has(n.id) && onPath.has(n.parent);
            return <line key={n.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? (phase === 3 ? C.green : C.amber) : C.axis} strokeWidth={hot ? 2.4 : 1.2} />;
          })}
          {info.filter(n => visible(n.id) && n.depth <= 3).map(n => {
            const p = pos.get(n.id);
            if (!p) return null;
            const fresh = it && n.id === it.added && phase >= 1;
            const hot = onPath.has(n.id);
            const Nn = stats.N[n.id] ?? 0, Wn = stats.W[n.id] ?? 0;
            const r = n.depth === 0 ? 17 : n.depth === 1 ? 15 : 12;
            const col = n.player === 1 ? C.sky : n.player === 2 ? C.orange : C.fg;
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r={r} fill="var(--card)" stroke={fresh ? C.purple : hot ? (phase === 3 ? C.green : C.amber) : col}
                  strokeWidth={fresh || hot ? 2.6 : 1.4} />
                <T x={p.x} y={p.y + 4} size={n.depth <= 1 ? 11 : 9.5} anchor="middle" bold color={col}>{n.depth === 0 ? "R" : cellName(n.move)}</T>
                {n.depth <= 2 && <T x={p.x} y={p.y + r + 11} size={8.5} anchor="middle" color={C.muted}>{n.depth === 0 ? `N ${Nn}` : `${Number.isInteger(Wn) ? Wn : Wn.toFixed(1)}/${Nn}`}</T>}
              </g>
            );
          })}
          {/* side board: the position at the end of the path */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = BX + (i % 3) * BS, y = 40 + Math.floor(i / 3) * BS, cx = x + BS / 2, cy = y + BS / 2;
            const c = board[i] || 0, pm = playoutMarks.get(i);
            const mark = c || pm || 0;
            return (
              <g key={i} opacity={c ? 1 : pm ? 0.45 : 1}>
                <rect x={x} y={y} width={BS} height={BS} fill="none" stroke={C.axis} />
                {mark === 1 && <g stroke={C.sky} strokeWidth={3.5} strokeLinecap="round"><line x1={cx - 11} y1={cy - 11} x2={cx + 11} y2={cy + 11} /><line x1={cx + 11} y1={cy - 11} x2={cx - 11} y2={cy + 11} /></g>}
                {mark === 2 && <circle cx={cx} cy={cy} r={12} fill="none" stroke={C.orange} strokeWidth={3.5} />}
                {!mark && <T x={x + 5} y={y + 13} size={9} color={C.muted}>{i}</T>}
              </g>
            );
          })}
          <T x={BX} y={28} size={9}>{phase >= 2 ? L("playout", "the playout (faint)") : L("position", "position at the end of the path")}</T>
          {it && phase >= 2 && <T x={BX + BS * 1.5} y={40 + BS * 3 + 20} size={11} anchor="middle" bold color={it.result === 2 ? C.orange : it.result === 1 ? C.sky : C.muted}>
            {it.result === 3 ? L("draw", "draw") : L("wins", "{w} wins").replace("{w}", who(it.result))}
          </T>}
        </svg>
        <div className="px-4 pb-1 min-h-[3.6rem]">
          <p className="text-[12.5px] text-[var(--text-main)] leading-snug">{cap}</p>
        </div>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${L("iteration", "iteration")} ${Math.min(ITERS, iter + (k === 0 ? 0 : 1))} / ${ITERS}`} />
      </div>
    </Figure>
  );
}
