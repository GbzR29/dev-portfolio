"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Readout, Row, Slider, Btn, C, T, mulberry32 } from "@/components/lesson/kit/figure";
import { EMPTY, GOOD_ORDER, LINES, bestMove, describe, minimax, scoreMoves, toMove, winner, play, type Board } from "./ttt";

// ── What this figure shows ────────────────────────────────────────────────────
// Tic-tac-toe against minimax. Each empty square can show its exact value for
// the player to move (full search): a win in n moves, a draw, or a loss. The
// readouts count the positions each search visits from the current board:
// plain minimax, alpha-beta, and alpha-beta with good move ordering. "Look
// ahead" limits the computer to d moves plus a guess (open lines): at 1 or 2
// it can be beaten with a fork; from 4 on it never loses.

const S = 64, PAD = 14, BW = S * 3 + PAD * 2;

export function TicTacToeFigure({ t }: { t?: TrackTranslations }) {
  const [hist, setHist] = useState<Board[]>([EMPTY]);
  const [human, setHuman] = useState<1 | 2>(1);
  const [depth, setDepth] = useState(9);
  const [show, setShow] = useState(true);
  const rng = useRef(mulberry32(7));
  const L = (k: string, en: string) => tx(t, `figAiTtt_${k}`, en);

  const b = hist[hist.length - 1];
  const w = winner(b);
  const me = toMove(b);
  const aiTurn = !w && me !== human;

  // The computer moves after a short pause, so the move can be seen.
  useEffect(() => {
    if (!aiTurn) return;
    const id = setTimeout(() => {
      const m = bestMove(b, { alphaBeta: true, depth: depth >= 9 ? undefined : depth, order: GOOD_ORDER }, rng.current);
      setHist(h => [...h, play(b, m)]);
    }, 420);
    return () => clearTimeout(id);
  }, [aiTurn, b, depth]);

  // Exact values of every move, and the cost of each kind of search from here
  const info = useMemo(() => {
    if (w) return null;
    const vals = new Map(scoreMoves(b, { alphaBeta: true, order: GOOD_ORDER }).moves.map(x => [x.m, x.v]));
    const count = (o: Parameters<typeof minimax>[1]) => { const c = { nodes: 0 }; minimax(b, o, c); return c.nodes; };
    // The empty board's full tree takes a moment to walk; its counts are measured once (ttt.ts under Node)
    if (b === EMPTY) return { vals, mm: 549946, ab: 20866, abo: 7865 };
    return { vals, mm: count({}), ab: count({ alphaBeta: true }), abo: count({ alphaBeta: true, order: GOOD_ORDER }) };
  }, [b, w]);

  const click = (i: number) => { if (!w && !aiTurn && !b[i]) setHist(h => [...h, play(b, i)]); };
  const restart = (side = human) => { setHuman(side); setHist([EMPTY]); };
  const undo = () => setHist(h => {
    let n = h.slice(0, -1);
    while (n.length > 1 && toMove(n[n.length - 1]) !== human) n = n.slice(0, -1);   // back to the human's turn
    return n.length ? n : [EMPTY];
  });

  const winLine = LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]);
  const label = (v: number) => {
    const d = describe(v, b);
    const mine = (d.kind === "x" && me === 1) || (d.kind === "o" && me === 2);
    if (d.kind === "draw") return { text: L("draw", "draw"), color: C.muted };
    return { text: (mine ? L("winIn", "wins in {n}") : L("losesIn", "loses in {n}")).replace("{n}", String(Math.ceil(d.plies / 2))), color: mine ? C.green : C.red };
  };
  const status = w === 1 ? L("xWins", "X wins") : w === 2 ? L("oWins", "O wins") : w === 3 ? L("isDraw", "draw") : aiTurn ? L("thinking", "computer to move") : L("yourMove", "your move");

  return (
    <Figure
      title={L("title", "Tic-tac-toe against minimax")}
      head={<Choice value={String(human)} onChange={v => restart(Number(v) as 1 | 2)} options={[["1", L("playX", "you are X")], ["2", L("playO", "you are O")]] as const} />}
      controls={<>
        <Slider label={L("depth", "look ahead")} value={depth} min={1} max={9} step={1} onChange={setDepth}
          fmt={v => (v >= 9 ? L("full", "full") : `${v}`)} />
        <Row>
          <Btn onClick={() => restart()}>{L("newGame", "new game")}</Btn>
          <Btn onClick={undo}>{L("undo", "undo")}</Btn>
          <Btn active={show} onClick={() => setShow(v => !v)}>{L("values", "show values")}</Btn>
          <Readout color={w === 0 ? C.fg : w === 3 ? C.muted : w === human ? C.green : C.red}>{status}</Readout>
        </Row>
        {info && <Row>
          <Readout>minimax {info.mm.toLocaleString("en-US").replace(/,/g, " ")}</Readout>
          <Readout>alpha-beta {info.ab.toLocaleString("en-US").replace(/,/g, " ")}</Readout>
          <Readout>{L("ordered", "alpha-beta, good order")} {info.abo.toLocaleString("en-US").replace(/,/g, " ")}</Readout>
        </Row>}
      </>}
      note={L("note", "Click a square to move; the computer answers with minimax. With \"show values\" on, every empty square shows what that move is worth for the player to move, from a full search: a win in n of their own moves (green), a draw, or a loss (red). On the empty board every square says draw: tic-tac-toe is a draw with perfect play. The three readouts count the positions each search visits from the board you see, all giving the same answer: 549 946 for plain minimax at the start, 20 866 with alpha-beta, 7 865 when the centre and corners are tried first. Lower \"look ahead\" to 1 or 2 and play X: take a corner, and if O does not answer in the centre, a fork (two threats at once) wins. The computer only sees d moves ahead and then guesses from open lines; from 4 on it never loses.")}
    >
      <div className="flex justify-center p-3">
        <svg viewBox={`0 0 ${BW} ${BW}`} className="w-full h-auto" style={{ maxWidth: 300 }} role="img">
          {[1, 2].map(i => (
            <g key={i}>
              <line x1={PAD + S * i} y1={PAD} x2={PAD + S * i} y2={PAD + S * 3} stroke={C.axis} strokeWidth={2} />
              <line x1={PAD} y1={PAD + S * i} x2={PAD + S * 3} y2={PAD + S * i} stroke={C.axis} strokeWidth={2} />
            </g>
          ))}
          {b.map((c, i) => {
            const x = PAD + (i % 3) * S, y = PAD + Math.floor(i / 3) * S, cx = x + S / 2, cy = y + S / 2;
            const v = info?.vals.get(i);
            const lab = !c && show && v !== undefined && !aiTurn ? label(v) : null;
            return (
              <g key={i} onClick={() => click(i)} style={{ cursor: !c && !w && !aiTurn ? "pointer" : "default" }}>
                <rect x={x + 2} y={y + 2} width={S - 4} height={S - 4} fill="transparent" />
                {c === 1 && <g stroke={C.sky} strokeWidth={5} strokeLinecap="round">
                  <line x1={cx - 16} y1={cy - 16} x2={cx + 16} y2={cy + 16} /><line x1={cx + 16} y1={cy - 16} x2={cx - 16} y2={cy + 16} />
                </g>}
                {c === 2 && <circle cx={cx} cy={cy} r={18} fill="none" stroke={C.orange} strokeWidth={5} />}
                {lab && <T x={cx} y={cy + 4} size={9.5} anchor="middle" color={lab.color} bold>{lab.text}</T>}
              </g>
            );
          })}
          {winLine && (() => {
            const p = (i: number) => ({ x: PAD + (i % 3) * S + S / 2, y: PAD + Math.floor(i / 3) * S + S / 2 });
            const a = p(winLine[0]), d = p(winLine[2]);
            return <line x1={a.x} y1={a.y} x2={d.x} y2={d.y} stroke={C.green} strokeWidth={4} strokeOpacity={0.8} strokeLinecap="round" />;
          })()}
        </svg>
      </div>
    </Figure>
  );
}
