"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, Slider, Sliders, T } from "@/components/lesson/kit/figure";
import { EXERCISE, fAdd, fIsZero, fMatPow, fNum, fStr, pathsBetween, walkMatrix, ZERO, type Walk } from "./markovModel";
import { MarkovMatrixTable } from "./MarkovMatrixTable";

// ── What this figure shows ────────────────────────────────────────────────────
// Why the n-step probabilities are the entries of Pⁿ. The trellis has one
// column per time 0 … n and one row per state; every path of the walk is a
// route through it from left to right. The routes from i to j are drawn in
// amber, thicker where more of the probability flows. The list multiplies the
// probabilities along each route; their sum is exactly the (i, j) entry of the
// matrix Pⁿ shown on the right. Click a cell of the matrix to pick i and j.

const W = 660, PAD_L = 40, PAD_R = 20, PAD_T = 22, SHOWN = 10;

export function MatrixPathsFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [from, setFrom] = useState(2);
  const [to, setTo] = useState(1);
  const [n, setN] = useState(3);
  const [hover, setHover] = useState<number | null>(null);

  const P = useMemo(() => walkMatrix(walk), [walk]);
  // Powers 0 … n: Pᵗ[i][a] = chance to be at a after t steps, used for the flow through each edge
  const pows = useMemo(() => Array.from({ length: n + 1 }, (_, s) => fMatPow(P, s)), [P, n]);
  const paths = useMemo(() => pathsBetween(P, from, to, n), [P, from, to, n]);
  const total = paths.reduce((s, p) => fAdd(s, p.prob), ZERO);
  const entry = pows[n][from][to];

  const S = walk.k + 1, H = PAD_T + S * 36 + 26;
  const X = (s: number) => PAD_L + (s * (W - PAD_L - PAD_R)) / n;
  const Y = (state: number) => PAD_T + (walk.k - state) * 36 + 10;
  const tot = fNum(entry);
  const hp = hover !== null ? paths[hover] : null;

  const setK = (k: number) => {
    setWalk(w => ({ ...w, k }));
    setFrom(f => Math.min(f, k)); setTo(v => Math.min(v, k));
  };

  const edges: React.ReactNode[] = [];
  for (let s = 0; s < n; s++) for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) {
    if (fIsZero(P[a][b])) continue;
    // Probability that the walk goes i → … → a at time s, then a → b, then b → … → j
    const flow = fNum(pows[s][from][a]) * fNum(P[a][b]) * fNum(pows[n - s - 1][b][to]);
    const on = flow > 0;
    edges.push(
      <line key={`${s}-${a}-${b}`} x1={X(s)} y1={Y(a)} x2={X(s + 1)} y2={Y(b)}
        stroke={on ? C.amber : C.grid} strokeWidth={on ? 1.2 + 7 * (flow / (tot || 1)) : 1} opacity={on ? (hp ? 0.3 : 0.85) : 0.7} strokeLinecap="round" />,
    );
  }

  const product = (states: number[]) => states.slice(1).map((b, s) => fStr(P[states[s]][b])).join(" · ");

  return (
    <Figure
      title={tx(t, "figMkPaths_title", "Why Pⁿ: adding up every path")}
      head={<Btn onClick={() => { setWalk(EXERCISE); setFrom(2); setTo(1); setN(3); }}>{tx(t, "figMkPaths_ex", "exercise (b): 2 → 1 in 3 steps")}</Btn>}
      controls={<>
        <Row>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkPaths_from", "from i")}</span>
          {Array.from({ length: S }, (_, i) => <Btn key={i} active={from === i} onClick={() => setFrom(i)}>{i}</Btn>)}
          <span className="w-px h-5 bg-[var(--border)] mx-1" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkPaths_to", "to j")}</span>
          {Array.from({ length: S }, (_, j) => <Btn key={j} active={to === j} onClick={() => setTo(j)}>{j}</Btn>)}
        </Row>
        <Sliders>
          <Slider label={tx(t, "figMkPaths_n", "steps n")} value={n} min={1} max={8} step={1} onChange={setN} fmt={v => String(v)} width="w-24" />
          <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => setWalk(w => ({ ...w, p: v }))} width="w-24" />
          <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={5} step={1} onChange={setK} fmt={v => String(v)} width="w-24" />
          <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => setWalk(w => ({ ...w, hold: v }))} width="w-24" />
        </Sliders>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              {tx(t, "figMkPaths_list", "paths")} {from} → {to} ({paths.length})
            </p>
            <div className="font-mono text-[11px] space-y-0.5">
              {paths.slice(0, SHOWN).map((p, i) => (
                <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  className={`flex justify-between gap-3 px-1.5 rounded cursor-default ${hover === i ? "bg-[var(--primary-low)]" : ""}`}>
                  <span className="text-[var(--text-main)]">{p.states.join(" → ")}</span>
                  <span className="text-[var(--text-muted)] text-right">{product(p.states)} = <span className="text-[var(--text-main)]">{fStr(p.prob)}</span></span>
                </div>
              ))}
              {paths.length > SHOWN && (
                <div className="px-1.5 text-[var(--text-muted)]">
                  + {paths.length - SHOWN} {tx(t, "figMkPaths_more", "more paths")} = {fStr(paths.slice(SHOWN).reduce((s, p) => fAdd(s, p.prob), ZERO))}
                </div>
              )}
              {paths.length === 0 && <div className="px-1.5 text-[var(--text-muted)]">{tx(t, "figMkPaths_none", "no path: this move is impossible in exactly n steps")}</div>}
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <MarkovMatrixTable P={pows[n]} row={from} cell={[from, to]} onPick={(i, j) => { setFrom(i); setTo(j); }} t={t} label={`P${n === 1 ? "" : sup(n)}`} />
          </div>
        </div>
        <Row>
          <Readout color={C.amber}>Σ {tx(t, "figMkPaths_sum", "of the paths")} = {fStr(total)}</Readout>
          <Readout color={C.green}>(P{sup(n)})<sub>{from},{to}</sub> = {fStr(entry)} ≈ {fNum(entry).toFixed(4)}</Readout>
        </Row>
      </>}
      note={tx(t, "figMkPaths_note", "Each path is a sequence of moves, and the Markov property lets you multiply the step probabilities along it. Different paths are different ways of getting there, so their probabilities add. That sum, over every state the walk can visit in between, is exactly what matrix multiplication computes: row i of P times column j. Hover a path to trace it; click another cell of the matrix to choose a new start and end. Notice that with h = 0, from an even state you can only be at an even state after an even number of steps; that is why so many entries are 0.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
        {edges}
        {hp && hp.states.slice(1).map((b, s) => (
          <line key={`h${s}`} x1={X(s)} y1={Y(hp.states[s])} x2={X(s + 1)} y2={Y(b)} stroke={C.pink} strokeWidth={3.5} strokeLinecap="round" />
        ))}
        {Array.from({ length: n + 1 }, (_, s) => (
          <g key={`c${s}`}>
            <T x={X(s)} y={H - 6} anchor="middle">{`t=${s}`}</T>
            {Array.from({ length: S }, (_, a) => {
              const isEnd = (s === 0 && a === from) || (s === n && a === to);
              return <circle key={a} cx={X(s)} cy={Y(a)} r={isEnd ? 7 : 4.5} fill={isEnd ? C.amber : "var(--card)"} stroke={C.muted} strokeWidth={1} />;
            })}
          </g>
        ))}
        {Array.from({ length: S }, (_, a) => <T key={`s${a}`} x={8} y={Y(a) + 4}>{a}</T>)}
      </svg>
    </Figure>
  );
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map(d => SUP[Number(d)]).join("");
