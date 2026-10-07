"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { SpeedControl, scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { EXERCISE, PLAY, stationary, stepFrom, toNumbers, walkMatrix, type Boundary, type Walk } from "./model";
import { MarkovMatrixTable } from "./MatrixTable";
import { ChainStage, NEEDLE_END, type Move } from "./ChainStage";

// ── What this figure shows ────────────────────────────────────────────────────
// A random walk on {0, …, k} as a Markov chain. Each step is drawn from the
// row of P of the state the walker is on, and from nothing else: a random
// needle u ∈ [0, 1) lands on that row's strip and picks the next state. The
// history is drawn too, faded, to show that it plays no part. Let it run and
// the share of time in each state settles on the stationary distribution π.
// The lab adds the matrix, the sliders and seven guided steps.

const HISTORY = 9;

export function MarkovChainFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [state, setState] = useState(0);
  const [hist, setHist] = useState<number[]>([0]);
  const [visits, setVisits] = useState<number[]>([1, 0, 0, 0]);
  const [steps, setSteps] = useState(0);
  const [pairs, setPairs] = useState<string[]>([]);      // "a>b" moves seen since the last reset
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const [move, setMove] = useState<Move | null>(null);
  const [speed, setSpeed] = useFigureSpeed();
  const lab = useLab();
  const vis = useVisible<HTMLDivElement>();

  const P = useMemo(() => walkMatrix(walk), [walk]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const pi = useMemo(() => stationary(P, walk.boundary), [P, walk.boundary]);

  // Refs for the animation loop, which must not see stale state
  const stateRef = useRef(state); stateRef.current = state;
  const moveRef = useRef(move); moveRef.current = move;
  const PnRef = useRef(Pn); PnRef.current = Pn;

  const reset = (w: Walk, start: number) => {
    setState(start); setHist([start]); setSteps(0); setPairs([]); setMove(null);
    setVisits(Array.from({ length: w.k + 1 }, (_, i) => (i === start ? 1 : 0)));
  };
  const change = (w: Walk) => { setWalk(w); reset(w, Math.min(state, w.k)); };

  /** Applies a run of steps: a, then each state in `to`. */
  const apply = (seq: number[]) => {
    if (!seq.length) return;
    const add = Array(PnRef.current.length).fill(0);
    const seen: string[] = [];
    let a = stateRef.current;
    for (const b of seq) { add[b]++; seen.push(`${a}>${b}`); a = b; }
    stateRef.current = a;
    setState(a);
    setSteps(s => s + seq.length);
    setVisits(v => v.map((x, i) => x + add[i]));
    setHist(h => [...h, ...seq].slice(-HISTORY));
    setPairs(p => { const s = new Set(p); seen.forEach(x => s.add(x)); return s.size === p.length ? p : [...s]; });
  };

  const begin = () => {
    const from = stateRef.current, u = Math.random();
    const m = { from, to: stepFrom(PnRef.current, from, u), u, t: 0 };
    moveRef.current = m; setMove(m);
  };
  /** One step: animated, unless the walker is already running fast. */
  const stepOnce = () => {
    const m = moveRef.current;
    if (m) { moveRef.current = null; setMove(null); apply([m.to]); }
    begin();
  };

  const acc = useRef(0);
  const animating = playing || move !== null;
  useFrame(animating && (vis.on || lab.open), dt => {
    if (playing && fast) {
      if (moveRef.current) { const m = moveRef.current; moveRef.current = null; setMove(null); apply([m.to]); }
      acc.current += dt * 60;
      const n = Math.floor(acc.current);
      if (n <= 0) return;
      acc.current -= n;
      const seq: number[] = [];
      let s = stateRef.current;
      for (let i = 0; i < n; i++) { s = stepFrom(PnRef.current, s, Math.random()); seq.push(s); }
      apply(seq);
      return;
    }
    const m = moveRef.current;
    if (!m) { if (playing) begin(); return; }
    const nt = m.t + (dt * 1000) / scaledMs(620, speed);
    if (nt >= 1) { moveRef.current = null; setMove(null); apply([m.to]); if (playing) begin(); }
    else { const next = { ...m, t: nt }; moveRef.current = next; setMove(next); }
  });

  const total = visits.reduce((a, b) => a + b, 0);
  const share = visits.map(v => v / total);
  const atEnd = state === 0 || state === walk.k;
  const labels = {
    history: tx(t, "figMkChain_history", "history"),
    onlyThis: tx(t, "figMkChain_onlyThis", "only this one counts"),
    row: tx(t, "figMkChain_row", "row {i} of P"),
    time: tx(t, "figMkChain_time", "time spent"),
  };
  const stage = (
    <ChainStage P={P} state={state} hist={hist} move={move} share={share} pi={pi} labels={labels} />
  );

  const playBtn = (
    <Btn active={playing} onClick={() => setPlaying(v => !v)}>{playing ? `❚❚ ${tx(t, "figMk_pause", "pause")}` : `${PLAY} ${tx(t, "figMk_play", "play")}`}</Btn>
  );
  const stepBtn = <Btn onClick={stepOnce}>{tx(t, "figMkChain_step", "one step")}</Btn>;
  const resetBtn = <Btn onClick={() => { setPlaying(false); reset(walk, 0); }}>{tx(t, "figMkChain_reset", "reset")}</Btn>;
  const stepsReadout = <Readout>{tx(t, "figMkChain_steps", "steps")}: {steps}</Readout>;

  // ── Lab ──
  const exercise = () => { setPlaying(false); setFast(false); setWalk(EXERCISE); reset(EXERCISE, 0); };
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkChainL1_t", "One step = one row of P"),
      body: <>
        <p>{tx(t, "figMkChainL1_b1", "The walker stands on a state. To move, it reads that state's row of P: the strip at the bottom. The strip has length 1 and is cut into pieces as long as the row's probabilities.")}</p>
        <p>{tx(t, "figMkChainL1_b2", "A step drops a random number u between 0 and 1 on the strip. The piece it lands in is the next state. A piece of length 3/4 catches the needle 3/4 of the time.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL1_g", "Press \"one step\" three times and watch the needle."), done: steps >= 3 },
      setup: exercise,
    },
    {
      title: tx(t, "figMkChainL2_t", "The past is ignored"),
      body: <>
        <p>{tx(t, "figMkChainL2_b1", "The top line is the history. Look at what the walker reads when it stands on 2: always row 2, the same strip, whether it came from 1 or from 3.")}</p>
        <p>{tx(t, "figMkChainL2_b2", "That is the Markov property: given the present state, the past changes nothing.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL2_g", "Reach state 2 once from 1 and once from 3."), done: pairs.includes("1>2") && pairs.includes("3>2") },
      hint: tx(t, "figMkChainL2_h", "From 3 the walker always goes to 2. So get to 3 (it takes two right steps from 1) and take one more step."),
    },
    {
      title: tx(t, "figMkChainL3_t", "Quick check"),
      body: <p>{tx(t, "figMkChainL3_b", "Use only what the figure shows. No computing needed.")}</p>,
      quiz: {
        q: tx(t, "figMkChainL3_q", "The walker is on 1. Its last six states were 0, 1, 2, 3, 2, 1. What is the chance that its next state is 2?"),
        options: ["3/4", "1/4", "1/2", tx(t, "figMkChainL3_o4", "it depends on the history")],
        answer: 0,
        why: tx(t, "figMkChainL3_w", "Only the present state counts: the walker reads row 1, and p₁₂ = 3/4. The history 0, 1, 2, 3, 2 plays no part."),
      },
    },
    {
      title: tx(t, "figMkChainL4_t", "The long run"),
      body: <>
        <p>{tx(t, "figMkChainL4_b1", "The amber bars count the share of time the walker has spent in each state. The green ticks are the stationary distribution π = (1, 4, 12, 9)/26.")}</p>
        <p>{tx(t, "figMkChainL4_b2", "Fast mode is on: press play and let it run.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL4_g", "Run 2000 steps. Do the bars meet the ticks?"), done: steps >= 2000 },
      setup: () => { exercise(); setFast(true); },
    },
    {
      title: tx(t, "figMkChainL5_t", "Change the rule"),
      body: <>
        <p>{tx(t, "figMkChainL5_b1", "The slider p is the chance of stepping right from an inner state, and q = 1 − p is the chance of stepping left. Moving it rewrites rows 1 and 2 of P.")}</p>
        <p>{tx(t, "figMkChainL5_b2", "The bars restart, and the green ticks move to the new π.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL5_g", "Make the walk fair (p = 0.50) or lean left (p < 0.50)."), done: walk.p <= 0.5 + 1e-9 },
    },
    {
      title: tx(t, "figMkChainL6_t", "Break it: absorbing walls"),
      body: <>
        <p>{tx(t, "figMkChainL6_b1", "Until now the walls bounced the walker back. Switch them to absorbing: row 0 becomes (1, 0, 0, 0), so from 0 the only move is to stay at 0. The same holds for the last state.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL6_g", "Choose \"absorbing\" and run until the walker is stuck."), done: walk.boundary === "absorbing" && atEnd && steps > 0 },
    },
    {
      title: tx(t, "figMkChainL7_t", "Staying put"),
      body: <>
        <p>{tx(t, "figMkChainL7_b1", "A chain may also stay where it is. The slider h is the chance of that. It fills the diagonal of P (p_ii = h) and draws a loop on every state.")}</p>
      </>,
      goal: { text: tx(t, "figMkChainL7_g", "Go back to reflecting walls and give h a value above 0."), done: walk.boundary === "reflecting" && walk.hold > 0 },
    },
  ];

  const r = walk.p / (1 - walk.p);
  const insights: Insight[] = [
    {
      id: "absorbed", tone: "warn", when: walk.boundary === "absorbing" && atEnd && steps > 0,
      title: tx(t, "figMkChainI1_t", "Stuck for ever"),
      body: fill(tx(t, "figMkChainI1_b", "Row {s} of P is 0 everywhere except a 1 on the diagonal, so every needle lands on {s} again. The walker never leaves. The long run now depends on luck: some walks end at 0, others at the last state, so there is no single π for the bars to settle on."), { s: state }),
    },
    {
      id: "fair", tone: "info", when: walk.boundary === "reflecting" && Math.abs(walk.p - 0.5) < 1e-9,
      title: tx(t, "figMkChainI2_t", "A fair walk"),
      body: tx(t, "figMkChainI2_b", "With p = q = 1/2 every inner state gets the same long-run share, and each wall gets half of it: π is proportional to (1, 2, …, 2, 1). A wall gets half because only one neighbour feeds it, and that neighbour sends it only half of its traffic."),
    },
    {
      id: "drift", tone: "info", when: walk.boundary === "reflecting" && (walk.p >= 0.85 || walk.p <= 0.15),
      title: tx(t, "figMkChainI3_t", "A strong drift"),
      body: fill(tx(t, "figMkChainI3_b", "Detailed balance links neighbours: π(i + 1) = π(i) · p / q for the inner steps. Here p / q = {r}, so each state is {r} times as likely as the one to its left, and π piles up against one wall."), { r: f2(r, 2) }),
    },
    {
      id: "hold", tone: "ok", when: walk.boundary === "reflecting" && walk.hold > 0,
      title: tx(t, "figMkChainI4_t", "Loops are the diagonal"),
      body: tx(t, "figMkChainI4_b", "Each loop is an entry p_ii = h. Staying put does not move the green ticks: every move left or right is scaled by the same 1 − h, so detailed balance gives the same π. What it changes is the rhythm. Without loops the walker alternates even, odd, even… The next figure shows why that matters."),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkChain_title", "A random walk as a Markov chain")}
        head={<LabButton onClick={lab.show} t={t} />}
        controls={<>
          <Row>{playBtn}{stepBtn}{resetBtn}{stepsReadout}</Row>
        </>}
        note={tx(t, "figMkChain_note2", "To move, the walker reads only the row of P of the state it is on: a random needle lands on that row's strip and picks the next state. The faded history plays no part. That is the Markov property. Let it run and the bars, the share of time in each state, settle on the green ticks: the long-run distribution π. Open the lab to change p, the walls and more, one step at a time.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab open={lab.open} onClose={lab.hide} t={t}
        title={tx(t, "figMkChain_title", "A random walk as a Markov chain")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          <Row>
            {playBtn}{stepBtn}
            <Btn active={fast} onClick={() => setFast(v => !v)}>{fast ? "✓ " : ""}{tx(t, "figMkChain_fast", "fast")}</Btn>
            {resetBtn}
            <Btn onClick={exercise}>{tx(t, "figMkChain_exercise", "the exercise's chain")}</Btn>
          </Row>
          <Row>
            <Choice value={walk.boundary} onChange={(b: Boundary) => change({ ...walk, boundary: b })}
              options={[["reflecting", tx(t, "figMkChain_reflect", "reflecting")], ["absorbing", tx(t, "figMkChain_absorb", "absorbing")]]} />
          </Row>
          <Sliders>
            <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => change({ ...walk, p: v })} width="w-28" />
            <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => change({ ...walk, hold: v })} width="w-28" />
            <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={6} step={1} onChange={v => change({ ...walk, k: v })} fmt={v => String(v)} width="w-28" />
          </Sliders>
          <SpeedControl speed={speed} setSpeed={setSpeed} />
          <MarkovMatrixTable P={P} row={move ? move.from : state} cell={move && move.t > NEEDLE_END ? [move.from, move.to] : null} t={t} />
          <Row>
            {stepsReadout}
            <Readout color={C.amber}>X = {state}</Readout>
            {pi && <Readout color={C.green}>π = ({pi.map(x => f2(x, 3)).join(", ")})</Readout>}
          </Row>
        </>}
      />
    </>
  );
}
