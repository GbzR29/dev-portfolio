"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { EXERCISE, frac, fStr, fVecMul, stationary, sub, toNumbers, walkMatrix, type Boundary, type Frac, type Walk } from "./model";
import { FlowStage } from "./FlowStage";

// ── What this figure shows ────────────────────────────────────────────────────
// The distribution of the walk after n steps, πₙ = π₀·Pⁿ, as bars of a fluid.
// Each step pours every bar along its arrows (πₙ(i)·p_ij to state j) and the
// pieces stack where they land, which is the row-vector product πₙ·P. The plot
// follows each state's probability over time. The exercise's walk alternates
// between even and odd states, so from most starts the fluid sloshes for ever;
// a chance of staying put (h > 0) breaks the rhythm and it settles on π.

const T_MAX = 30;
type Start = "uniform" | "zero" | "top";

export function MarkovDistributionFigure({ t }: { t?: TrackTranslations }) {
  const [walk, setWalk] = useState<Walk>(EXERCISE);
  const [start, setStart] = useState<Start>("zero");
  const [n, setN] = useState(0);
  const [u, setU] = useState(0);                 // progress of the step n → n + 1
  const [stepping, setStepping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("markov-distribution");
  const vis = useVisible<HTMLDivElement>();
  const S = walk.k + 1;

  const P = useMemo(() => walkMatrix(walk), [walk]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const pi = useMemo(() => stationary(P, walk.boundary), [P, walk.boundary]);
  const init = useMemo<Frac[]>(() => Array.from({ length: S }, (_, i) =>
    start === "uniform" ? frac(1, S) : (start === "zero" ? i === 0 : i === walk.k) ? frac(1) : frac(0)), [S, start, walk.k]);

  // π₀, π₁, … exactly; in numbers for the drawing
  const exact = useMemo(() => {
    const out: Frac[][] = [init];
    for (let s = 0; s < T_MAX; s++) out.push(fVecMul(out[s], P));
    return out;
  }, [init, P]);
  const dists = useMemo(() => exact.map(d => d.map(f => Number(f.n) / Number(f.d))), [exact]);

  // ── Stepping: one animated pour per step ──
  const nRef = useRef(n); nRef.current = n;
  const uRef = useRef(0);
  const playRef = useRef(playing); playRef.current = playing;
  const pour = () => { if (nRef.current >= T_MAX) return; uRef.current = 0; setU(0); setStepping(true); };
  useFrame(stepping && (vis.on || lab.open), dt => {
    const next = uRef.current + (dt * 1000) / scaledMs(playRef.current ? 520 : 750, speed);
    if (next < 1) { uRef.current = next; setU(next); return; }
    uRef.current = 0; setU(0);
    const m = nRef.current + 1;
    nRef.current = m; setN(m);
    if (!playRef.current || m >= T_MAX) { setStepping(false); setPlaying(false); }
  });
  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (n >= T_MAX) { setN(0); nRef.current = 0; }
    setPlaying(true); pour();
  };
  const jump = (m: number) => { setPlaying(false); setStepping(false); uRef.current = 0; setU(0); setN(m); };

  const cur = dists[n];
  const exactStr = exact[n].every(f => f.d < BigInt(100000)) ? exact[n].map(fStr).join(", ") : cur.map(v => f2(v, 3)).join(", ");
  const tv = pi ? cur.reduce((s, v, i) => s + Math.abs(v - pi[i]), 0) / 2 : null;
  const evenShare = dists[0].reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0);
  const balanced = Math.abs(evenShare - 0.5) < 1e-9;
  const rhythm = walk.boundary === "reflecting" && walk.hold === 0;
  const isExercise = walk.k === 3 && walk.p === 0.75 && walk.hold === 0 && walk.boundary === "reflecting";

  const stage = (
    <>
      <FlowStage P={Pn} dists={dists} n={n} u={u} pi={pi} tMax={T_MAX} labels={{ time: tx(t, "figMkDist_time", "n") }} />
      <Transport t={t} speed playing={playing} onPlay={play}
        onStep={() => { setPlaying(false); pour(); }}
        onBack={n > 0 ? () => jump(n - 1) : undefined}
        onReset={() => jump(0)} readout={`n = ${n}`} />
    </>
  );

  const startChoice = (
    <Choice value={start} onChange={(v: Start) => { setStart(v); jump(0); }} options={[
      ["uniform", tx(t, "figMkDist_uniform", "start uniform")],
      ["zero", tx(t, "figMkDist_zero", "start at 0")],
      ["top", tx(t, "figMkDist_top", "start at k")],
    ]} />
  );
  const exBtn = <Btn onClick={() => { setWalk(EXERCISE); setStart("uniform"); jump(3); }}>{tx(t, "figMkDist_ex", "exercise (c): n = 3")}</Btn>;
  const holdSlider = <Slider label={tx(t, "figMkChain_hold", "stay put, h")} value={walk.hold} min={0} max={0.5} step={0.05} onChange={v => { setWalk(w => ({ ...w, hold: v })); jump(0); }} width="w-28" />;
  const nSlider = <Slider label={tx(t, "figMkDist_n", "step n")} value={n} min={0} max={T_MAX} step={1} onChange={jump} fmt={v => String(v)} width="w-28" />;
  const piRead = <Readout>π{sub(n)} = ({exactStr})</Readout>;

  // ── Lab ──
  const setupAt = (w: Walk, s: Start) => { setWalk(w); setStart(s); jump(0); };
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkDistL1_t", "Probability is a fluid"),
      body: <>
        <p>{tx(t, "figMkDistL1_b1", "Picture 1 litre of fluid spread over the states: the bar of state j holds πₙ(j), the chance that the walk is at j at time n. Right now it all sits at 0, because the walk starts at 0.")}</p>
        <p>{tx(t, "figMkDistL1_b2", "One step pours every bar along the arrows that leave it: state i sends the share p_ij of its fluid to j.")}</p>
      </>,
      goal: { text: tx(t, "figMkDistL1_g2", "Press ⏭ (one step, under the drawing) and watch the fluid move."), done: n >= 1 },
      focus: "step",
      setup: () => setupAt(EXERCISE, "zero"),
    },
    {
      title: tx(t, "figMkDistL2_t", "What lands is what flows in"),
      body: <>
        <p>{tx(t, "figMkDistL2_b1", "Watch a bar fill up: it receives a piece from every state that has an arrow into it. The pieces keep the colour of the state they came from until they land.")}</p>
        <p>{tx(t, "figMkDistL2_b2", "Adding what lands on j gives πₙ₊₁(j) = Σᵢ πₙ(i)·p_ij. That is the row vector πₙ times the matrix P, so n steps are π₀·Pⁿ.")}</p>
      </>,
      goal: { text: tx(t, "figMkDistL2_g", "Take steps until n = 3."), done: n >= 3 },
      focus: "step",
    },
    {
      title: tx(t, "figMkDistL3_t", "Quick check"),
      body: <p>{tx(t, "figMkDistL3_b", "The exercise's chain, starting at 0 for sure: π₀ = (1, 0, 0, 0).")}</p>,
      quiz: {
        q: tx(t, "figMkDistL3_q", "What is π₂, the distribution after two steps?"),
        options: ["(1/4, 0, 3/4, 0)", "(0, 1, 0, 0)", "(1/4, 1/4, 1/4, 1/4)", "(0, 1/4, 0, 3/4)"],
        answer: 0,
        why: tx(t, "figMkDistL3_w", "After one step all the fluid is at 1. State 1 pours 1/4 to the left and 3/4 to the right, so π₂ = (1/4, 0, 3/4, 0). That is row 0 of P²."),
      },
    },
    {
      title: tx(t, "figMkDistL4_t", "It never settles"),
      body: <>
        <p>{tx(t, "figMkDistL4_b1", "Every step moves the fluid by one state, so all of it jumps from the even states {0, 2} to the odd states {1, 3} and back.")}</p>
        <p>{tx(t, "figMkDistL4_b2b", "Press the big ▶ under the drawing and follow the lines in the plot.")}</p>
      </>,
      goal: { text: tx(t, "figMkDistL4_g", "Play until n = 20. Do the bars reach the green ticks?"), done: n >= 20 && rhythm && !balanced },
      focus: "play",
      setup: () => setupAt(EXERCISE, "zero"),
    },
    {
      title: tx(t, "figMkDistL5_t", "Break the rhythm"),
      body: <p>{tx(t, "figMkDistL5_b", "Let the walker stay put with probability h. A piece that stays where it is does not switch parity, so the even and odd halves start to mix.")}</p>,
      goal: { text: tx(t, "figMkDistL5_g", "Raise h, then play until the bars come within 1% of the ticks."), done: walk.hold > 0 && tv !== null && tv < 0.01 },
    },
    {
      title: tx(t, "figMkDistL6_t", "The lucky start"),
      body: <>
        <p>{tx(t, "figMkDistL6_b1", "Back to h = 0, but start uniform: 1/4 in each state.")}</p>
        <p>{tx(t, "figMkDistL6_b2", "Before you play: will it slosh like the start at 0?")}</p>
      </>,
      goal: { text: tx(t, "figMkDistL6_g", "Play to n = 10 and compare."), done: start === "uniform" && rhythm && n >= 10 },
      focus: "play",
      setup: () => setupAt(EXERCISE, "uniform"),
    },
    {
      title: tx(t, "figMkDistL7_t", "Exercise (c)"),
      body: <>
        <p>{tx(t, "figMkDistL7_b1", "Part (c) needs P(X₃ = 1) with a uniform start: the bar of state 1 at n = 3.")}</p>
        <p>{tx(t, "figMkDistL7_b2", "The readout gives π₃ exactly: (11/256, 47/256, 117/256, 81/256). So P(X₃ = 1) = 47/256, and the answer is 47/256 · 9/16 = 423/4096.")}</p>
      </>,
      goal: { text: tx(t, "figMkDistL7_g", "Show the exercise's chain at n = 3 with a uniform start."), done: isExercise && start === "uniform" && n === 3 && u === 0 },
    },
  ];

  const insights: Insight[] = [
    {
      id: "period", tone: "warn", when: rhythm && !balanced && n >= 4,
      title: tx(t, "figMkDistI1_t", "Period 2: it sloshes for ever"),
      body: fill(tx(t, "figMkDistI1_b", "Each step sends all the fluid from the even states to the odd ones, or back. Right now {e}% of it is on the even states, and next step it will be {o}%. So πₙ keeps swapping between two patterns and never reaches π, even though π exists. The chain is periodic with period 2."), {
        e: f2(cur.reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0) * 100, 0),
        o: f2(dists[Math.min(T_MAX, n + 1)].reduce((s, v, i) => (i % 2 === 0 ? s + v : s), 0) * 100, 0),
      }),
    },
    {
      id: "balanced", tone: "ok", when: rhythm && balanced && n >= 2,
      title: tx(t, "figMkDistI2_t", "Nothing to swing"),
      body: tx(t, "figMkDistI2_b", "For a chain with period 2, every stationary π puts exactly half of the fluid on the even states. One step moves all the even fluid to the odd states and back, so a distribution that one step does not change must have equal halves. This start already has them, so nothing sloshes and πₙ still settles. With an odd number of states the uniform start is not balanced: try k = 4."),
    },
    {
      id: "settled", tone: "ok", when: walk.boundary === "reflecting" && walk.hold > 0 && tv !== null && tv < 0.01,
      title: tx(t, "figMkDistI3_t", "Settled"),
      body: fill(tx(t, "figMkDistI3_b", "At n = {n}, πₙ is within 1% of π. Some fluid staying put makes the chain aperiodic. A chain that can reach every state from every state and is aperiodic forgets where it started: πₙ → π from any π₀."), { n }),
    },
    {
      id: "drain", tone: "info", when: walk.boundary === "absorbing",
      title: tx(t, "figMkDistI4_t", "The fluid drains into the ends"),
      body: tx(t, "figMkDistI4_b", "With absorbing ends, fluid can flow into 0 and k but never out. The inner bars empty, and πₙ tends to a split between the two ends that depends on where it started. The new section on absorbing chains computes that split."),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkDist_title", "The distribution after n steps: π₀ · Pⁿ")}
        head={<LabButton lab={lab} t={t} />}
        controls={<>
          <Row>{startChoice}<span className="w-px h-5 bg-[var(--border)] mx-1" />{exBtn}</Row>
          <Sliders>{holdSlider}</Sliders>
          <Row>{piRead}{pi && <Readout color={C.green}>π = ({pi.map(v => f2(v, 3)).join(", ")})</Readout>}</Row>
        </>}
        note={tx(t, "figMkDist_note2", "The bars hold the probability of each state as a fluid. Each step pours every bar along its arrows and adds up what lands: that is πₙ·P. Starting at 0, all the fluid jumps between the even and the odd states and never settles. Raise \"stay put\" a little and it settles on the green ticks, the stationary π, from any start.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t}
        recap={[
          tx(t, "figMkDistR1", "One step pours every state's probability along its arrows: πₙ₊₁(j) = Σᵢ πₙ(i)·p_ij, which is πₙ·P."),
          tx(t, "figMkDistR2", "So n steps are π₀·Pⁿ; from a sure start, πₙ is a row of Pⁿ."),
          tx(t, "figMkDistR3", "A chain with period 2 sloshes between even and odd states unless its start is already balanced."),
          tx(t, "figMkDistR4", "A chance of staying put makes it aperiodic, and then πₙ → π from any start."),
        ]}
        title={tx(t, "figMkDist_title", "The distribution after n steps: π₀ · Pⁿ")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          <Row>{startChoice}<span className="w-px h-5 bg-[var(--border)] mx-1" />{exBtn}</Row>
          <Row>
            <Choice value={walk.boundary} onChange={(b: Boundary) => { setWalk(w => ({ ...w, boundary: b })); jump(0); }}
              options={[["reflecting", tx(t, "figMkChain_reflect", "reflecting")], ["absorbing", tx(t, "figMkChain_absorb", "absorbing")]]} />
          </Row>
          <Sliders>
            {nSlider}
            {holdSlider}
            <Slider label={tx(t, "figMkChain_p", "right, p")} value={walk.p} min={0.05} max={0.95} step={0.05} onChange={v => { setWalk(w => ({ ...w, p: v })); jump(0); }} width="w-28" />
            <Slider label={tx(t, "figMkChain_k", "last state k")} value={walk.k} min={2} max={6} step={1} onChange={v => { setWalk(w => ({ ...w, k: v })); jump(0); }} fmt={v => String(v)} width="w-28" />
          </Sliders>
          <Row>
            {piRead}
            {pi && <Readout color={C.green}>π = ({pi.map(v => f2(v, 3)).join(", ")})</Readout>}
            {tv !== null && <Readout>{tx(t, "figMkDist_dist", "distance to π")}: {f2(tv, 3)}</Readout>}
          </Row>
        </>}
      />
    </>
  );
}
