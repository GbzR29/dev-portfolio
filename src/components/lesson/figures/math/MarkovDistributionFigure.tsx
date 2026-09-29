"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, T, f2, mulberry32, useRaf } from "@/components/lesson/kit/figure";
import { EXERCISE, frac, fStr, fVecMul, stationary, stepFrom, toNumbers, walkMatrix, type Frac, type Walk } from "./markovModel";

// ── What this figure shows ────────────────────────────────────────────────────
// The distribution of the walk after n steps. Solid bars: the exact
// probabilities πₙ = π₀·Pⁿ. Outlined bars: where 2000 simulated walkers
// actually are after n steps. The plot underneath follows each state's
// probability over time. The exercise's walk alternates between even and odd
// states, so its distribution swings for ever; a little chance of staying put
// (h > 0) breaks the rhythm and it settles on the stationary distribution π.

const W = 660, BAR_H = 150, PLOT_H = 130, H = BAR_H + PLOT_H + 46, T_MAX = 30, WALKERS = 2000;
const COLS = [C.sky, C.pink, C.amber, C.green, C.purple, C.teal, C.orange];
type Start = "uniform" | "zero" | "top";

export function MarkovDistributionFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [start, setStart] = useState<Start>("zero");
  const [n, setN] = useState(0);
  const [playing, setPlaying] = useState(false);
  const S = walk.k + 1;

  const P = useMemo(() => walkMatrix(walk), [walk]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const pi = useMemo(() => stationary(P, walk.boundary), [P, walk.boundary]);
  const init = useMemo<Frac[]>(() => Array.from({ length: S }, (_, i) =>
    start === "uniform" ? frac(1, S) : (start === "zero" ? i === 0 : i === walk.k) ? frac(1) : frac(0)), [S, start, walk.k]);

  // π₀, π₁, …: exact while the fractions stay short, as numbers for the plot
  const dists = useMemo(() => {
    const out: Frac[][] = [init];
    for (let s = 0; s < T_MAX; s++) out.push(fVecMul(out[s], P));
    return out;
  }, [init, P]);
  const nums = dists.map(d => d.map(f => Number(f.n) / Number(f.d)));

  // The simulated walkers, replayed from a fixed seed so that n can go back and forth
  const walkers = useMemo(() => {
    const rnd = mulberry32(7);
    const pos = Array.from({ length: WALKERS }, (_, w) => {
      if (start === "zero") return 0;
      if (start === "top") return walk.k;
      return w % S;
    });
    const hist: number[][] = [];
    const count = () => { const h = Array(S).fill(0); for (const s of pos) h[s]++; return h.map(c => c / WALKERS); };
    hist.push(count());
    for (let s = 0; s < T_MAX; s++) { for (let w = 0; w < WALKERS; w++) pos[w] = stepFrom(Pn, pos[w], rnd()); hist.push(count()); }
    return hist;
  }, [Pn, start, S, walk.k]);

  const acc = useRef(0);
  const nRef = useRef(n); nRef.current = n;
  const rafRef = useRaf(playing, dt => {
    acc.current += dt * 2.5;
    if (acc.current < 1) return;
    acc.current = 0;
    if (nRef.current >= T_MAX) setPlaying(false);
    else setN(nRef.current + 1);
  });

  const cur = nums[n], sim = walkers[n];
  const bx = (i: number) => 70 + (i * (W - 140)) / walk.k;
  const bw = Math.min(46, (W - 140) / S * 0.6);
  const yBar = (v: number) => 12 + BAR_H - v * BAR_H;
  const px = (s: number) => 40 + (s * (W - 60)) / T_MAX;
  const py = (v: number) => BAR_H + 34 + PLOT_H - v * PLOT_H;
  const exactStr = dists[n].every(f => f.d < BigInt(100000)) ? dists[n].map(fStr).join(", ") : null;

  return (
    <Figure
      title={tx(t, "figMkDist_title", "The distribution after n steps: π₀ · Pⁿ")}
      head={<Choice value={start} onChange={(v: Start) => { setStart(v); setN(0); }} options={[
        ["uniform", tx(t, "figMkDist_uniform", "start uniform")],
        ["zero", tx(t, "figMkDist_zero", "start at 0")],
        ["top", tx(t, "figMkDist_top", "start at k")],
      ]} />}
      controls={<>
        <Row>
          <Btn onClick={() => setN(v => Math.min(T_MAX, v + 1))}>{tx(t, "figMkChain_step", "one step")}</Btn>
          <Btn active={playing} onClick={() => { if (n >= T_MAX) setN(0); setPlaying(v => !v); }}>{playing ? "❚❚ pause" : "▶ play"}</Btn>
          <Btn onClick={() => { setN(0); setPlaying(false); }}>n = 0</Btn>
          <Btn onClick={() => { setWalk(EXERCISE); setStart("uniform"); setN(3); }}>{tx(t, "figMkDist_ex", "exercise (c): n = 3")}</Btn>
        </Row>
        <Sliders>
          <Slider label={tx(t, "figMkDist_n", "step n")} value={n} min={0} max={T_MAX} step={1} onChange={setN} fmt={v => String(v)} width="w-28" />
          <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => setWalk(w => ({ ...w, hold: v }))} width="w-28" />
          <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => setWalk(w => ({ ...w, p: v }))} width="w-28" />
          <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={6} step={1} onChange={v => { setWalk(w => ({ ...w, k: v })); setN(0); }} fmt={v => String(v)} width="w-28" />
        </Sliders>
        <Row>
          <Readout>π{sub(n)} = ({exactStr ?? cur.map(v => f2(v, 3)).join(", ")})</Readout>
          {pi && <Readout color={C.green}>π = ({pi.map(v => f2(v, 3)).join(", ")})</Readout>}
        </Row>
      </>}
      note={tx(t, "figMkDist_note", "Each step multiplies the row vector by P once, so after n steps the distribution is π₀·Pⁿ; the outlined bars, 2000 walkers moved at random, agree with it up to chance. Starting at 0, every step of the exercise's walk changes the parity of the state, so the probability sloshes between the even and the odd states and never settles: the chain is periodic. The uniform start is a lucky exception: it already gives the even and the odd states 1/2 each, just as π does, so there is nothing to swing and it settles. Raise 'stay put' a little and the swings die out from any start, which ends at the same green levels, the stationary distribution π that solves π = πP.")}
    >
      <div ref={rafRef}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block">
          {/* Bars: exact (filled) and simulated (outlined) */}
          <line x1={30} x2={W - 20} y1={yBar(0)} y2={yBar(0)} stroke={C.axis} />
          {Array.from({ length: S }, (_, i) => (
            <g key={i}>
              <rect x={bx(i) - bw / 2} y={yBar(cur[i])} width={bw} height={cur[i] * BAR_H} fill={COLS[i % COLS.length]} opacity={0.75} />
              <rect x={bx(i) - bw / 2 - 3} y={yBar(sim[i])} width={bw + 6} height={sim[i] * BAR_H} fill="none" stroke={C.fg} strokeWidth={1.2} strokeDasharray="3 2" />
              {pi && <line x1={bx(i) - bw / 2 - 6} x2={bx(i) + bw / 2 + 6} y1={yBar(pi[i])} y2={yBar(pi[i])} stroke={C.green} strokeWidth={2} />}
              <T x={bx(i)} y={yBar(0) + 13} anchor="middle" bold color={C.fg}>{i}</T>
              <T x={bx(i)} y={yBar(cur[i]) - 4} anchor="middle" size={9}>{f2(cur[i], 3)}</T>
            </g>
          ))}
          {/* Each state's probability over time */}
          <line x1={40} x2={W - 20} y1={py(0)} y2={py(0)} stroke={C.axis} />
          <line x1={40} x2={40} y1={py(0)} y2={py(1)} stroke={C.axis} />
          <T x={34} y={py(1) + 4} anchor="end" size={8.5}>1</T>
          <T x={34} y={py(0.5) + 4} anchor="end" size={8.5}>½</T>
          {Array.from({ length: S }, (_, i) => (
            <polyline key={`l${i}`} fill="none" stroke={COLS[i % COLS.length]} strokeWidth={1.6}
              points={nums.map((d, s) => `${px(s)},${py(d[i])}`).join(" ")} />
          ))}
          <line x1={px(n)} x2={px(n)} y1={py(0)} y2={py(1)} stroke={C.fg} strokeDasharray="3 3" />
          <T x={W - 20} y={py(0) + 14} anchor="end" size={9}>n →</T>
        </svg>
      </div>
    </Figure>
  );
}

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n: number) => String(n).split("").map(d => SUB[Number(d)]).join("");
