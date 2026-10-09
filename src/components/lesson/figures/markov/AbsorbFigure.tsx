"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, f2, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { absorption, conditionalTime, fDiv, fMul, fNum, fStr, fSub, ONE, stepFrom, sub, toNumbers, walkMatrix, type Frac } from "./model";
import { AbsorbStage, crowdLayout, stateX, type Mode } from "./AbsorbStage";

// ── What this figure shows ────────────────────────────────────────────────────
// A walk on {0, …, k} whose ends are absorbing: a gambler with i coins who
// wins a coin with probability p and loses one with q = 1 − p, until ruin (0)
// or the target (k). The bars give, for every start, the exact chance of
// reaching k and the expected number of steps, from first-step analysis, and
// the expected steps counted only over the runs that win (or only over those
// ruined). A crowd of walkers released from the chosen start checks them by
// simulation: each walker remembers the step at which it stopped.

const WALKERS = 150;
const EX = { k: 3, p: 0.75 };
/** A fraction as text, or a decimal when its denominator gets long. */
const short = (v: Frac) => (v.d < BigInt(1000) ? fStr(v) : f2(fNum(v), 2));
const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

export function AbsorbFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState(EX.k);
  const [p, setP] = useState(EX.p);
  const [start, setStart] = useState(1);
  const [mode, setMode] = useState<Mode>("hit");
  const [focus, setFocus] = useState<number | null>(1);
  const [pos, setPos] = useState<number[]>(() => Array(WALKERS).fill(1));
  const [prev, setPrev] = useState<number[]>(() => Array(WALKERS).fill(1));
  const [u, setU] = useState(1);
  const [running, setRunning] = useState(false);
  const [moves, setMoves] = useState(0);                // steps taken by the crowd since it was placed
  const [stops, setStops] = useState<number[]>(() => Array(WALKERS).fill(0)); // step at which each walker stopped (0 = still walking)
  const [touched, setTouched] = useState(false);
  const [speed] = useFigureSpeed();
  const lab = useLab("markov-absorbing");
  const vis = useVisible<HTMLDivElement>();

  const P =useMemo(() => walkMatrix({ k, p, hold: 0, boundary: "absorbing" }), [k, p]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const { hit, time } = useMemo(() => absorption(P), [P]);
  const winTime = useMemo(() => conditionalTime(P, hit, "win"), [P, hit]);
  const ruinTime = useMemo(() => conditionalTime(P, hit, "ruin"), [P, hit]);
  const values = mode === "hit" ? hit : mode === "time" ? time : mode === "win" ? winTime : ruinTime;
  // The chance of the ending the mode conditions on (1 when it conditions on nothing)
  const ends = mode === "win" ? hit : mode === "ruin" ? hit.map(h => fSub(ONE, h)) : null;

  const rnd = useRef(mulberry32(11));
  const posRef = useRef(pos); posRef.current = pos;
  const stopsRef = useRef(stops); stopsRef.current = stops;
  const movesRef = useRef(moves); movesRef.current = moves;
  const uRef = useRef(1);
  // "go": the ⏭ button asked for one move; "done": that move was made, stop when its glide ends
  const single = useRef<null | "go" | "done">(null);
  const [stepMode, setStepMode] = useState(false);       // running only to show one ⏭ move
  const place = (s: number) => {
    const a = Array(WALKERS).fill(s);
    const z = Array(WALKERS).fill(0);
    setPos(a); setPrev(a); posRef.current = a; uRef.current = 1; setU(1); setRunning(false); setMoves(0); single.current = null;
    setStops(z); stopsRef.current = z;
  };
  const absorbed = (ps: number[]) => ps.every(s => s === 0 || s === k);
  const playPause = () => {
    if (running && !stepMode) { setRunning(false); single.current = null; return; }
    if (absorbed(posRef.current)) place(start);
    single.current = null; setStepMode(false); setRunning(true);
  };
  const stepOnce = () => {
    if (absorbed(posRef.current)) return;
    single.current = "go"; setStepMode(true); uRef.current = 1; setRunning(true);
  };
  const reconfigure = (nk: number, np: number, ns = start) => {
    const s = Math.max(1, Math.min(nk - 1, ns));
    setK(nk); setP(np); setStart(s); setFocus(s); place(s);
  };

  // Each tick moves every walker that is not absorbed one step; dots glide between piles
  useFrame(running && (vis.on || lab.open), dt => {
    const next = uRef.current + (dt * 1000) / scaledMs(260, speed);
    if (next < 1) { uRef.current = next; setU(next); return; }
    const cur = posRef.current;
    if (single.current === "done" || absorbed(cur)) { single.current = null; setStepMode(false); setRunning(false); uRef.current = 1; setU(1); return; }
    const moved = cur.map(s => (s === 0 || s === k ? s : stepFrom(Pn, s, rnd.current())));
    const n = movesRef.current + 1;
    const st = stopsRef.current.map((v, w) => (v || (moved[w] === 0 || moved[w] === k ? n : 0)));
    setPrev(cur); setPos(moved); posRef.current = moved; setMoves(n); movesRef.current = n;
    setStops(st); stopsRef.current = st;
    if (single.current === "go") single.current = "done";
    uRef.current = 0; setU(0);
  });

  const X = stateX(k);
  const a = crowdLayout(prev, X), b = crowdLayout(pos, X);
  const e = u >= 1 ? 1 : u * u * (3 - 2 * u);
  const dots = b.map((q, w) => ({ x: a[w].x + (q.x - a[w].x) * e, y: a[w].y + (q.y - a[w].y) * e }));

  const won = pos.filter(s => s === k).length, lost = pos.filter(s => s === 0).length;
  const done = won + lost === WALKERS && pos.some(s => s !== start);
  const f = focus !== null && focus > 0 && focus < k ? focus : null;
  const q = 1 - p;
  // Given the ending, a step is weighted by how likely it leads there: p′ = p·e(i+1)/e(i)
  const pf = f === null ? null : ends ? fDiv(fMul(P[f][f + 1], ends[f + 1]), ends[f]) : P[f][f + 1];
  const qf = f === null ? null : ends ? fDiv(fMul(P[f][f - 1], ends[f - 1]), ends[f]) : P[f][f - 1];
  const formula = f === null || pf === null || qf === null ? "" : mode === "hit"
    ? `h${sub(f)} = q·h${sub(f - 1)} + p·h${sub(f + 1)} = ${fStr(qf)}·${fStr(hit[f - 1])} + ${fStr(pf)}·${fStr(hit[f + 1])} = ${fStr(hit[f])}`
    : mode === "time"
      ? `t${sub(f)} = 1 + q·t${sub(f - 1)} + p·t${sub(f + 1)} = 1 + ${fStr(qf)}·${fStr(time[f - 1])} + ${fStr(pf)}·${fStr(time[f + 1])} = ${fStr(time[f])}`
      : `τ${sub(f)} = 1 + q′·τ${sub(f - 1)} + p′·τ${sub(f + 1)} = 1 + ${short(qf)}·${short(values[f - 1])} + ${short(pf)}·${short(values[f + 1])} = ${short(values[f])}`;

  // Simulation: mean stopping step of the walkers that won, and of those ruined
  const winSteps = stops.filter((s, w) => s > 0 && pos[w] === k), ruinSteps = stops.filter((s, w) => s > 0 && pos[w] === 0);

  const drawing = (
    <AbsorbStage k={k} p={pf === null ? p : fNum(pf)} values={values} mode={mode} focus={focus} dots={dots}
      onFocus={i => { if (i > 0 && i < k) { setFocus(i); setTouched(true); } }}
      labels={{ ruin: tx(t, "figMkAbs_ruin", "ruin"), win: tx(t, "figMkAbs_win", "target"), formula }} />
  );
  const stage = (
    <>
      {drawing}
      <Transport t={t} speed playing={running && !stepMode} onPlay={playPause} onStep={stepOnce} onReset={() => place(start)}
        playLabel={fill(tx(t, "figMkAbs_release", "release {n} walkers"), { n: WALKERS })}
        readout={`${tx(t, "figMkChain_steps", "steps")}: ${moves}`} />
    </>
  );

  const startPick = (
    <>
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figMkAbs_start", "start i")}</span>
      {Array.from({ length: k - 1 }, (_, i) => i + 1).map(i => (
        <Btn key={i} active={start === i} onClick={() => { setStart(i); setFocus(i); place(i); }}>{i}</Btn>
      ))}
    </>
  );
  const modeChoice = (
    <Choice value={mode} onChange={(m: Mode) => setMode(m)} options={[
      ["hit", tx(t, "figMkAbs_hit", "chance to reach k")],
      ["time", tx(t, "figMkAbs_time", "expected steps")],
      ["win", tx(t, "figMkAbs_ifWin", "steps, if it wins")],
      ["ruin", tx(t, "figMkAbs_ifRuin", "steps, if ruined")],
    ]} />
  );
  const cond = mode === "win" || mode === "ruin";
  const condSteps = mode === "win" ? winSteps : ruinSteps;
  const readouts = (
    <Row>
      <Readout color={C.green}>h{sub(start)} = {fStr(hit[start])} ≈ {f2(fNum(hit[start]) * 100, 1)}%</Readout>
      <Readout color={C.purple}>t{sub(start)} = {fStr(time[start])} ≈ {f2(fNum(time[start]), 2)}</Readout>
      {cond && (
        <Readout color={mode === "win" ? C.teal : C.red}>
          τ{sub(start)} = {short(values[start])}{values[start].d < BigInt(1000) && values[start].d > BigInt(1) ? ` ≈ ${f2(fNum(values[start]), 2)}` : ""}
        </Readout>
      )}
      {pos.some(s => s !== start) && !cond && (
        <Readout color={C.amber}>{tx(t, "figMkAbs_sim", "simulated")}: {won} / {WALKERS} {tx(t, "figMkAbs_atK", "at k")} ({f2((won / WALKERS) * 100, 0)}%)</Readout>
      )}
      {pos.some(s => s !== start) && cond && (
        <Readout color={C.amber}>
          {fill(tx(t, mode === "win" ? "figMkAbs_simWin" : "figMkAbs_simRuin", mode === "win" ? "simulated: {n} winners, {m} steps on average" : "simulated: {n} ruined, {m} steps on average"),
            { n: condSteps.length, m: condSteps.length ? f2(mean(condSteps), 2) : "–" })}
        </Readout>
      )}
    </Row>
  );

  // ── Lab ──
  const r = q / p;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkAbsL1_t", "Where does it end?"),
      body: <>
        <p>{tx(t, "figMkAbsL1_b1", "The walk on {0, 1, 2, 3} again, with p = 3/4, but now the ends are absorbing: think of a gambler with 1 coin who wins a coin with probability 3/4 and loses one with 1/4, until ruin (0 coins) or the target (3 coins).")}</p>
        <p>{tx(t, "figMkAbsL1_b2", "Release a crowd of walkers from 1 with the big ▶ under the drawing, and count how many reach 3. ⏭ moves them one step at a time.")}</p>
      </>,
      goal: { text: tx(t, "figMkAbsL1_g", "Release the walkers and wait until every one has stopped."), done },
      focus: "play",
      setup: () => { setMode("hit"); reconfigure(EX.k, EX.p, 1); },
    },
    {
      title: tx(t, "figMkAbsL2_t", "One step, then start afresh"),
      body: <>
        <p>{tx(t, "figMkAbsL2_b1", "Call hᵢ the chance of reaching k from i. Look at one step: from i the walk goes to i + 1 with probability p, or to i − 1 with q, and from there it is a fresh start, by the Markov property. So hᵢ = q·hᵢ₋₁ + p·hᵢ₊₁.")}</p>
        <p>{tx(t, "figMkAbsL2_b2", "In the drawing: each bar's top lies on the dashed chord between its neighbours' tops, p of the way along it. The ends are fixed, h₀ = 0 and hₖ = 1, and the system has one solution.")}</p>
      </>,
      goal: { text: tx(t, "figMkAbsL2_g", "Click (or tap) another inner bar to see its equation."), done: touched },
    },
    {
      title: tx(t, "figMkAbsL3_t", "A fair game"),
      body: <p>{tx(t, "figMkAbsL3_b", "Now make the game fair: p = 1/2. Each bar sits half-way between its neighbours.")}</p>,
      goal: { text: tx(t, "figMkAbsL3_g", "Set p to 0.50 and look at the shape of the bars."), done: Math.abs(p - 0.5) < 1e-9 },
    },
    {
      title: tx(t, "figMkAbsL4_t", "Quick check"),
      body: <p>{tx(t, "figMkAbsL4_b", "Use the shape you just saw.")}</p>,
      quiz: {
        q: tx(t, "figMkAbsL4_q", "A fair game (p = 1/2) with target k = 4, starting with 1 coin. What is the chance of reaching 4?"),
        options: ["1/4", "1/2", "1/3", "3/4"],
        answer: 0,
        why: tx(t, "figMkAbsL4_w", "With p = 1/2 the bars form a straight line from h₀ = 0 to h₄ = 1, so hᵢ = i/k and h₁ = 1/4."),
      },
    },
    {
      title: tx(t, "figMkAbsL5_t", "How long does it take?"),
      body: <>
        <p>{tx(t, "figMkAbsL5_b1", "Switch to expected steps. Call tᵢ the expected number of steps until the walk stops. The same first-step idea works, plus 1 for the step just taken: tᵢ = 1 + q·tᵢ₋₁ + p·tᵢ₊₁, with t₀ = tₖ = 0.")}</p>
        <p>{tx(t, "figMkAbsL5_b2", "That +1 is the amber arrow: each bar sits exactly one unit above the chord.")}</p>
      </>,
      goal: { text: tx(t, "figMkAbsL5_g", "Choose \"expected steps\"."), done: mode === "time" },
    },
    {
      title: tx(t, "figMkAbsL6_t", "Gambler's ruin"),
      body: <>
        <p>{tx(t, "figMkAbsL6_b1", "A casino game that is only slightly unfair: p = 0.45. You start with 4 coins and stop at 0 or at 8.")}</p>
        <p>{tx(t, "figMkAbsL6_b2", "With r = q/p, the solution is hᵢ = (1 − rⁱ)/(1 − rᵏ). Release the walkers and compare.")}</p>
      </>,
      goal: { text: tx(t, "figMkAbsL6_g", "Release the walkers from 4 and let them finish."), done: k === 8 && p < 0.5 && start === 4 && done },
      focus: "play",
      setup: () => { setMode("hit"); reconfigure(8, 0.45, 4); },
    },
    {
      title: tx(t, "figMkAbsL7_t", "How long, if it wins?"),
      body: <>
        <p>{tx(t, "figMkAbsL7_b1", "Back to the worked example, p = 3/4 from 1. Now count the steps only of the walkers that reach 3, and call their average τᵢ. Among those runs the steps are not p and q any more: knowing that the run ends at k makes a step towards k more likely. A step to i + 1 counts with p′ = p·hᵢ₊₁/hᵢ, a step to i − 1 with q′ = q·hᵢ₋₁/hᵢ, and p′ + q′ = 1 by the first-step equation for h.")}</p>
        <p>{tx(t, "figMkAbsL7_b2", "Then the same first-step idea works: τᵢ = 1 + q′·τᵢ₋₁ + p′·τᵢ₊₁. From 1, q′ = 1/4 · 0 = 0: a winning run can never have gone to 0. Release the walkers and compare their average with τ₁.")}</p>
      </>,
      goal: { text: tx(t, "figMkAbsL7_g", "Choose \"steps, if it wins\" and release the walkers until all have stopped."), done: mode === "win" && done },
      focus: "play",
      setup: () => { setMode("win"); reconfigure(EX.k, EX.p, 1); },
    },
    {
      title: tx(t, "figMkAbsL8_t", "Ruin comes fast"),
      body: <p>{tx(t, "figMkAbsL8_b", "Switch to \"steps, if ruined\" and read τ₁ for the runs that end at 0 (with ruin, the weights use 1 − h instead of h). The two kinds of run, weighted by how likely each is, must give back the plain expected time.")}</p>,
      quiz: {
        q: tx(t, "figMkAbsL8_q", "From 1 with p = 3/4: h₁ = 9/13, a winning run lasts 32/13 steps on average and a ruined one 19/13. What is the plain expected time t₁?"),
        options: ["28/13", "51/26", "32/13", "2"],
        answer: 0,
        why: tx(t, "figMkAbsL8_w", "The law of total expectation: t₁ = h₁·τ(win) + (1 − h₁)·τ(ruin) = 9/13 · 32/13 + 4/13 · 19/13 = 364/169 = 28/13. The plain average 51/26 forgets that wins are more than twice as common."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "fair", tone: "info", when: Math.abs(p - 0.5) < 1e-9,
      title: tx(t, "figMkAbsI1_t", "Fair game: a straight line"),
      body: fill(tx(t, "figMkAbsI1_b", "With p = q every hᵢ is the plain average of its neighbours, so the bars lie on a straight line: hᵢ = i/k. Your chance of winning is just your share of the target, here {h}. The expected time is tᵢ = i·(k − i), largest in the middle."), { h: `${start}/${k}` }),
    },
    {
      id: "house", tone: "warn", when: p < 0.5 && k >= 6,
      title: tx(t, "figMkAbsI2_t", "A small edge, a big effect"),
      body: fill(tx(t, "figMkAbsI2_b", "p = {p} looks almost fair, but r = q/p = {r} > 1 and hᵢ = (1 − rⁱ)/(1 − rᵏ). From {i} of {k} the chance of reaching the target is {h}%, below the fair {fair}%. The longer the game, the more the edge counts."), {
        p: f2(p, 2), r: f2(r, 3), i: start, k, h: f2(fNum(hit[start]) * 100, 1), fair: f2((start / k) * 100, 1),
      }),
    },
    {
      id: "plusone", tone: "info", when: mode === "time" && f !== null,
      title: tx(t, "figMkAbsI3_t", "Where the +1 comes from"),
      body: tx(t, "figMkAbsI3_b", "Whatever happens next, one step has just been taken. After it, the walk is at i − 1 or i + 1 and expects tᵢ₋₁ or tᵢ₊₁ more steps. So tᵢ is one more than the weighted average of its neighbours, and each bar sits one unit above the chord."),
    },
    {
      id: "sim", tone: "ok", when: done && !running,
      title: tx(t, "figMkAbsI4_t", "Simulation against the exact answer"),
      body: fill(tx(t, "figMkAbsI4_b", "{w} of {n} walkers reached k: {s}%. First-step analysis says {h}%. With {n} walkers the share typically misses by a few percent (one standard deviation is about {sd}%), so release them again to see it change."), {
        w: won, n: WALKERS, s: f2((won / WALKERS) * 100, 1), h: f2(fNum(hit[start]) * 100, 1),
        sd: f2(Math.sqrt((fNum(hit[start]) * (1 - fNum(hit[start]))) / WALKERS) * 100, 1),
      }),
    },
    {
      id: "total", tone: "info", when: cond,
      title: tx(t, "figMkAbsI5_t", "Two kinds of run, one average"),
      body: fill(tx(t, "figMkAbsI5_b", "From {i}: a winning run lasts {w} steps on average, a ruined one {l}. Weighted by their chances, {h} · {w} + {m} · {l} = {t}, exactly the plain expected time t. That is the law of total expectation, split by how the walk ends."), {
        i: start, w: short(winTime[start]), l: short(ruinTime[start]), h: short(hit[start]), m: short(fSub(ONE, hit[start])), t: short(time[start]),
      }),
    },
    {
      id: "swap", tone: "ok", when: cond && Math.abs(p - 0.5) > 1e-9,
      title: tx(t, "figMkAbsI6_t", "The edge decides who wins, not how long a win takes"),
      body: fill(tx(t, "figMkAbsI6_b", "Change p to {p2} and watch the bars of this mode: they do not move. Wherever it wanders, every winning run from i has exactly k − i more wins than losses, and every ruined run exactly i more losses than wins. So swapping p and q multiplies the chance of every run of one kind by the same factor. Within each kind the runs keep their relative weights, so their average length stays put. (Here, with i = {i}: τ = {tau}.)"), {
        p2: f2(1 - p, 2), i: start, tau: short(values[start]),
      }),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkAbs_title", "Absorbing walls: where it ends and how long it takes")}
        head={<>
          <Btn onClick={() => { setMode("hit"); reconfigure(EX.k, EX.p, 1); }}>{tx(t, "figMkAbs_ex", "worked example")}</Btn>
          <LabButton lab={lab} t={t} />
        </>}
        controls={<>
          <Row>{startPick}<span className="w-px h-5 bg-[var(--border)] mx-1" />{modeChoice}</Row>
          {readouts}
        </>}
        note={tx(t, "figMkAbs_note2", "The bars are exact: for every start, the chance of reaching k before 0, the expected number of steps until the walk stops, or that number counted only over the runs that win (or only over those ruined). Click an inner bar to see its first-step equation: its top lies on the chord between its neighbours, p of the way along. Release the crowd to check by simulation.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab lab={lab} t={t}
        recap={[
          tx(t, "figMkAbsR1", "First-step analysis: one step, then a fresh start, so hᵢ = q·hᵢ₋₁ + p·hᵢ₊₁ with h₀ = 0 and hₖ = 1."),
          tx(t, "figMkAbsR2", "The expected time adds 1 for the step taken: tᵢ = 1 + q·tᵢ₋₁ + p·tᵢ₊₁."),
          tx(t, "figMkAbsR3", "A fair game gives a straight line, hᵢ = i/k; otherwise hᵢ = (1 − rⁱ)/(1 − rᵏ) with r = q/p."),
          tx(t, "figMkAbsR4", "A small edge against you makes ruin much more likely, and more so the longer the game."),
          tx(t, "figMkAbsR5", "Counting only the runs that win, steps use p′ = p·hᵢ₊₁/hᵢ, and τᵢ = 1 + q′·τᵢ₋₁ + p′·τᵢ₊₁; the win and ruin averages, weighted by h and 1 − h, give back t."),
        ]}
        title={tx(t, "figMkAbs_title", "Absorbing walls: where it ends and how long it takes")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          <Row>{startPick}<span className="w-px h-5 bg-[var(--border)] mx-1" />{modeChoice}</Row>
          <Sliders>
            <Slider label={tx(t, "figMkAbs_p", "win a coin, p")} value={p} min={0.05} max={0.95} step={0.05} onChange={v => reconfigure(k, v)} width="w-28" />
            <Slider label={tx(t, "figMkAbs_k", "target k")} value={k} min={2} max={8} step={1} onChange={v => reconfigure(v, p)} fmt={v => String(v)} width="w-28" />
          </Sliders>
          {readouts}
        </>}
      />
    </>
  );
}
