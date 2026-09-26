"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// The Towers of Hanoi: move the whole tower from peg A to peg C, one disk at a
// time, never putting a disk on a smaller one. "you play": tap a peg to lift
// its top disk, tap another to drop it. "watch": the recursive solution plays
// move by move, and the list on the right is the chain of recursive calls that
// is active at that move: to move n disks, move n − 1 out of the way, move the
// biggest, move the n − 1 back on top. 2ⁿ − 1 moves, no fewer.

type Move = { from: number; to: number; calls: string[] };
const PEGS = ["A", "B", "C"];

function solve(n: number): Move[] {
  const out: Move[] = [];
  const stack: string[] = [];
  const hanoi = (k: number, from: number, to: number, via: number) => {
    if (k === 0) return;
    stack.push(`hanoi(${k}, ${PEGS[from]}→${PEGS[to]})`);
    hanoi(k - 1, from, via, to);
    out.push({ from, to, calls: [...stack] });
    hanoi(k - 1, via, to, from);
    stack.pop();
  };
  hanoi(n, 0, 2, 1);
  return out;
}

const start = (n: number): number[][] => [Array.from({ length: n }, (_, i) => n - i), [], []];
function apply(n: number, moves: Move[], k: number) {
  const pegs = start(n);
  for (const m of moves.slice(0, k)) pegs[m.to].push(pegs[m.from].pop()!);
  return pegs;
}

const W = 560, H = 214, PEG_X = [80, 210, 340], BASE = 176, DISK_H = 16;

export function HanoiFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"play" | "watch">("watch");
  const [n, setN] = useState(3);
  const moves = useMemo(() => solve(n), [n]);
  const s = useStepper(moves.length, 700, 200);
  // "you play" state
  const [mine, setMine] = useState<number[][]>(() => start(3));
  const [held, setHeld] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [bad, setBad] = useState(false);

  const reset = (m = n) => { setMine(start(m)); setHeld(null); setCount(0); setBad(false); s.restart(); };
  const k = Math.min(moves.length, Math.floor(s.raw + 1e-9));
  const pegs = mode === "watch" ? apply(n, moves, k) : mine;
  const done = pegs[2].length === n;

  const tap = (p: number) => {
    if (mode !== "play" || done) return;
    if (held === null) { if (mine[p].length) { setHeld(p); setBad(false); } return; }
    if (p === held) { setHeld(null); return; }
    const disk = mine[held][mine[held].length - 1], top = mine[p][mine[p].length - 1];
    if (top !== undefined && top < disk) { setBad(true); setHeld(null); return; }
    const next = mine.map(q => [...q]);
    next[p].push(next[held].pop()!);
    setMine(next); setHeld(null); setCount(c => c + 1); setBad(false);
  };

  const cur = mode === "watch" && k > 0 ? moves[k - 1] : null;
  const minMoves = 2 ** n - 1;

  return (
    <Figure
      title={tx(t, "figHanoi_title", "Towers of Hanoi")}
      head={<Choice value={mode} onChange={m => { setMode(m); reset(); }} options={[["watch", tx(t, "figHanoi_watch", "watch the recursion")], ["play", tx(t, "figHanoi_play", "you play")]] as const} />}
      controls={<>
        <Row>
          <Slider label={tx(t, "figHanoi_disks", "disks")} value={n} min={1} max={7} step={1} onChange={v => { setN(v); reset(v); }} fmt={v => `${v}`} />
          {mode === "play" && <Btn onClick={() => reset()}>↻</Btn>}
        </Row>
        {mode === "watch" && <StepperControls s={s} />}
        <Row>
          <Readout>{tx(t, "figHanoi_moves", "moves")}: {mode === "watch" ? k : count}</Readout>
          <Readout color={C.green}>{tx(t, "figHanoi_min", "minimum")}: 2^{n} − 1 = {minMoves}</Readout>
          {mode === "play" && done && <Readout color={count === minMoves ? C.green : C.amber}>{count === minMoves ? tx(t, "figHanoi_perfect", "solved in the minimum!") : tx(t, "figHanoi_solved", "solved")}</Readout>}
          {bad && <Readout color={C.red}>{tx(t, "figHanoi_bad", "a disk cannot go on a smaller one")}</Readout>}
        </Row>
      </>}
      note={tx(t, "figHanoi_note", "To move a tower of n disks from A to C you must, at some moment, move the biggest disk; at that moment the other n − 1 disks must all sit on B. So: move n − 1 disks A → B (a smaller copy of the same puzzle), move the biggest A → C, move the n − 1 disks B → C. That recipe is the whole program. Moves: M(n) = 2 · M(n − 1) + 1 with M(1) = 1, which gives 2ⁿ − 1. Try 3 or 4 disks yourself, then watch how the call list on the right grows and shrinks.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {PEG_X.map((x, p) => (
          <g key={p} onClick={() => tap(p)} style={{ cursor: mode === "play" ? "pointer" : undefined }}>
            <rect x={x - 64} y={30} width={128} height={BASE - 22} fill="transparent" />
            <rect x={x - 3} y={42} width={6} height={BASE - 42} rx={3} fill={held === p ? C.amber : C.axis} />
            <T x={x} y={BASE + 18} size={10} anchor="middle" color={held === p ? C.amber : C.fg} bold>{PEGS[p]}</T>
          </g>
        ))}
        <rect x={10} y={BASE} width={400} height={4} rx={2} fill={C.axis} />
        {pegs.map((peg, p) => peg.map((d, i) => {
          const w = 22 + d * 14, lifted = mode === "play" && held === p && i === peg.length - 1;
          const moved = cur && cur.to === p && i === peg.length - 1;
          return <rect key={`${p}-${d}`} x={PEG_X[p] - w / 2} y={BASE - (i + 1) * DISK_H - (lifted ? 14 : 0)} width={w} height={DISK_H - 2} rx={4}
            fill={`hsl(${(d - 1) * 47}, 75%, 55%)`} stroke={moved ? C.fg : "none"} strokeWidth={1.5} pointerEvents="none" />;
        }))}
        {mode === "watch" && <>
          <T x={420} y={20} size={8.5}>{tx(t, "figHanoi_calls", "active calls")}</T>
          {(cur?.calls ?? []).map((c, i) => (
            <T key={i} x={420 + Math.min(i, 6) * 4} y={36 + i * 15} size={9} color={i === (cur?.calls.length ?? 0) - 1 ? C.amber : C.fg}>{c}</T>
          ))}
          {cur && <T x={10} y={16} size={10} color={C.amber} bold>{`${tx(t, "figHanoi_move", "move")} ${k}: ${PEGS[cur.from]} → ${PEGS[cur.to]}`}</T>}
        </>}
        {mode === "play" && <T x={10} y={16} size={9.5}>{tx(t, "figHanoi_tap", "tap a peg to lift its top disk, then tap where it goes")}</T>}
      </svg>
    </Figure>
  );
}
