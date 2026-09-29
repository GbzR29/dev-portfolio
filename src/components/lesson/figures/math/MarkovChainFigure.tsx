"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, T, f2, useRaf } from "@/components/lesson/kit/figure";
import { EXERCISE, fIsZero, fStr, stationary, stepFrom, toNumbers, walkMatrix, type Boundary, type FMat, type Walk } from "./markovModel";
import { MarkovMatrixTable } from "./MarkovMatrixTable";

// ── What this figure shows ────────────────────────────────────────────────────
// A random walk on {0, …, k} drawn as a graph: one circle per state, an arrow
// for every move with positive probability, labelled with that probability.
// A walker (amber) takes one random step at a time; only its current state
// decides where it can go next, which is the Markov property. The bars under
// the states count the share of time spent in each, and the ticks mark the
// stationary distribution they settle towards. Under the drawing, the
// transition matrix: the walker always reads the row of the state it is in.

const W = 660, H = 250, Y = 105, R = 21;

export function MarkovChainFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [state, setState] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [visits, setVisits] = useState<number[]>(() => [1, 0, 0, 0]);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);

  const P = useMemo(() => walkMatrix(walk), [walk]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const pi = useMemo(() => stationary(P, walk.boundary), [P, walk.boundary]);

  const reset = (w: Walk, start: number) => {
    setState(start); setPrev(null);
    setVisits(Array.from({ length: w.k + 1 }, (_, i) => (i === start ? 1 : 0)));
  };
  const change = (w: Walk) => { setWalk(w); reset(w, Math.min(state, w.k)); };

  // One step: the next state is drawn from row `state` of P, nothing else
  const stateRef = useRef(state); stateRef.current = state;
  const step = (count: number) => {
    let s = stateRef.current, last = s;
    const add = Array(Pn.length).fill(0);
    for (let i = 0; i < count; i++) { last = s; s = stepFrom(Pn, s, Math.random()); add[s]++; }
    setPrev(last); setState(s);
    setVisits(v => v.map((x, i) => x + add[i]));
  };
  // useRaf pauses by itself while the drawing is off screen
  const acc = useRef(0);
  const rafRef = useRaf(playing, dt => {
    acc.current += dt * (fast ? 60 : 3);
    const k = Math.floor(acc.current);
    if (k > 0) { acc.current -= k; step(k); }
  });
  useEffect(() => { acc.current = 0; }, [fast]);

  const total = visits.reduce((a, b) => a + b, 0);

  return (
    <Figure
      title={tx(t, "figMkChain_title", "A random walk as a Markov chain")}
      head={<Choice value={walk.boundary} onChange={(b: Boundary) => change({ ...walk, boundary: b })}
        options={[["reflecting", tx(t, "figMkChain_reflect", "reflecting")], ["absorbing", tx(t, "figMkChain_absorb", "absorbing")]]} />}
      controls={<>
        <Row>
          <Btn onClick={() => step(1)}>{tx(t, "figMkChain_step", "one step")}</Btn>
          <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn active={fast} onClick={() => setFast(v => !v)}>{fast ? "✓ " : ""}{tx(t, "figMkChain_fast", "fast")}</Btn>
          <Btn onClick={() => reset(walk, 0)}>{tx(t, "figMkChain_reset", "reset")}</Btn>
          <Btn onClick={() => { setWalk(EXERCISE); reset(EXERCISE, 0); }}>{tx(t, "figMkChain_exercise", "the exercise's chain")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={6} step={1} onChange={v => change({ ...walk, k: v })} fmt={v => String(v)} width="w-28" />
          <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => change({ ...walk, p: v })} width="w-28" />
          <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => change({ ...walk, hold: v })} width="w-28" />
        </Sliders>
        <MarkovMatrixTable P={P} row={state} cell={prev === null ? null : [prev, state]} t={t} />
        <Row>
          <Readout>{tx(t, "figMkChain_steps", "steps")}: {total - 1}</Readout>
          <Readout color={C.amber}>X = {state}</Readout>
          {pi && <Readout color={C.green}>π = ({pi.map(x => f2(x, 3)).join(", ")})</Readout>}
        </Row>
      </>}
      note={tx(t, "figMkChain_note", "Each arrow is one entry of the matrix: the blue ones go right, the pink ones left. Step the walker: where it goes next depends only on the circle it is on, never on how it got there. That is the Markov property, and it is why a single row of the matrix is all the walker ever needs. Let it run: the bars (share of time in each state) settle on the green ticks, the long-run distribution π. With absorbing ends the walker eventually gets stuck at 0 or k.")}
    >
      <div ref={rafRef}>
        <ChainGraph P={P} state={state} prev={prev} share={visits.map(v => v / total)} pi={pi} />
      </div>
    </Figure>
  );
}

// ── The graph ─────────────────────────────────────────────────────────────────

function ChainGraph({ P, state, prev, share, pi }: {
  P: FMat; state: number; prev: number | null; share: number[]; pi: number[] | null;
}) {
  const n = P.length, k = n - 1;
  const X = (i: number) => 60 + (i * (W - 120)) / k;
  const BAR_H = 44, BASE = H - 12, scale = BAR_H * 1.6;

  const arrows: React.ReactNode[] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    if (fIsZero(P[a][b])) continue;
    const active = prev === a && state === b;
    arrows.push(a === b
      ? <SelfLoop key={`${a}-${b}`} x={X(a)} label={fStr(P[a][a])} active={active} />
      : <Arc key={`${a}-${b}`} x0={X(a)} x1={X(b)} label={fStr(P[a][b])} active={active} />);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
      <defs>
        {([["R", C.sky], ["L", C.pink], ["S", C.purple], ["A", C.amber]] as const).map(([id, col]) => (
          <marker key={id} id={`mkArrow${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={col} />
          </marker>
        ))}
      </defs>
      {arrows}
      {P.map((_, i) => {
        const here = i === state;
        return (
          <g key={i}>
            <circle cx={X(i)} cy={Y} r={R} fill={here ? C.amber : "var(--card)"} stroke={here ? C.amber : C.muted} strokeWidth={1.5} />
            <T x={X(i)} y={Y + 5} anchor="middle" size={14} bold color={here ? "#1f1300" : C.fg}>{i}</T>
          </g>
        );
      })}
      {/* Share of time spent in each state, and the stationary distribution */}
      {P.map((_, i) => {
        const h = Math.min(share[i] * scale, BAR_H + 6);
        return (
          <g key={`b${i}`}>
            <line x1={X(i) - 24} x2={X(i) + 24} y1={BASE} y2={BASE} stroke={C.axis} />
            <rect x={X(i) - 15} y={BASE - h} width={30} height={h} fill={C.amber} opacity={0.7} />
            {pi && <line x1={X(i) - 20} x2={X(i) + 20} y1={BASE - pi[i] * scale} y2={BASE - pi[i] * scale} stroke={C.green} strokeWidth={2.2} />}
          </g>
        );
      })}
    </svg>
  );
}

/** A move between neighbours: above the row when it goes right, below when it goes left. */
function Arc({ x0, x1, label, active }: { x0: number; x1: number; label: string; active: boolean }) {
  const up = x1 > x0, dy = up ? -1 : 1, side = up ? 0.6 : -0.6;
  const s = { x: x0 + side * R, y: Y + dy * 0.8 * R };
  const e = { x: x1 - side * R, y: Y + dy * 0.8 * R };
  const c = { x: (x0 + x1) / 2, y: Y + dy * 62 };
  const col = up ? C.sky : C.pink;
  const marker = active ? "A" : up ? "R" : "L";
  return (
    <g>
      <path d={`M${s.x},${s.y} Q${c.x},${c.y} ${e.x},${e.y}`} fill="none" stroke={active ? C.amber : col}
        strokeWidth={active ? 2.6 : 1.5} markerEnd={`url(#mkArrow${marker})`} />
      {/* The quadratic's apex is half-way to its control point; the label sits just beyond it */}
      <T x={c.x} y={Y + dy * (up ? 45 : 53)} anchor="middle" color={col} size={10.5}>{label}</T>
    </g>
  );
}

/** Staying put: a small loop on top of the state, between the arcs that leave it. */
function SelfLoop({ x, label, active }: { x: number; label: string; active: boolean }) {
  return (
    <g>
      <path d={`M${x - 12},${Y - R + 4} C${x - 26},${Y - R - 26} ${x + 26},${Y - R - 26} ${x + 12},${Y - R + 4}`}
        fill="none" stroke={active ? C.amber : C.purple} strokeWidth={active ? 2.4 : 1.3} markerEnd={`url(#mkArrow${active ? "A" : "S"})`} />
      <T x={x} y={Y - R - 24} anchor="middle" color={C.purple} size={10}>{label}</T>
    </g>
  );
}
