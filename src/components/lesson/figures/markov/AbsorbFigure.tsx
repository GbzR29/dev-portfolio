"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row, Slider, Sliders, f2, mulberry32, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { SpeedControl, scaledMs, useFigureSpeed } from "@/components/lesson/kit/Stepper";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { Transport } from "@/components/lesson/kit/Transport";
import { absorption, fNum, fStr, stepFrom, sub, toNumbers, walkMatrix } from "./model";
import { AbsorbStage, crowdLayout, stateX, type Mode } from "./AbsorbStage";

// ── What this figure shows ────────────────────────────────────────────────────
// A walk on {0, …, k} whose ends are absorbing: a gambler with i coins who
// wins a coin with probability p and loses one with q = 1 − p, until ruin (0)
// or the target (k). The bars give, for every start, the exact chance of
// reaching k and the expected number of steps, from first-step analysis. A
// crowd of walkers released from the chosen start checks them by simulation.

const WALKERS = 150;
const EX = { k: 3, p: 0.75 };

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
  const [touched, setTouched] = useState(false);
  const [speed, setSpeed] = useFigureSpeed();
  const lab = useLab();
  const vis = useVisible<HTMLDivElement>();

  const P =useMemo(() => walkMatrix({ k, p, hold: 0, boundary: "absorbing" }), [k, p]);
  const Pn = useMemo(() => toNumbers(P), [P]);
  const { hit, time } = useMemo(() => absorption(P), [P]);
  const values = mode === "hit" ? hit : time;

  const rnd = useRef(mulberry32(11));
  const posRef = useRef(pos); posRef.current = pos;
  const uRef = useRef(1);
  // "go": the ⏭ button asked for one move; "done": that move was made, stop when its glide ends
  const single = useRef<null | "go" | "done">(null);
  const [stepMode, setStepMode] = useState(false);       // running only to show one ⏭ move
  const place = (s: number) => {
    const a = Array(WALKERS).fill(s);
    setPos(a); setPrev(a); posRef.current = a; uRef.current = 1; setU(1); setRunning(false); setMoves(0); single.current = null;
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
    setPrev(cur); setPos(moved); posRef.current = moved; setMoves(m => m + 1);
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
  const formula = f === null ? "" : mode === "hit"
    ? `h${sub(f)} = q·h${sub(f - 1)} + p·h${sub(f + 1)} = ${fStr(P[f][f - 1])}·${fStr(hit[f - 1])} + ${fStr(P[f][f + 1])}·${fStr(hit[f + 1])} = ${fStr(hit[f])}`
    : `t${sub(f)} = 1 + q·t${sub(f - 1)} + p·t${sub(f + 1)} = 1 + ${fStr(P[f][f - 1])}·${fStr(time[f - 1])} + ${fStr(P[f][f + 1])}·${fStr(time[f + 1])} = ${fStr(time[f])}`;

  const drawing = (
    <AbsorbStage k={k} p={p} values={values} mode={mode} focus={focus} dots={dots}
      onFocus={i => { if (i > 0 && i < k) { setFocus(i); setTouched(true); } }}
      labels={{ ruin: tx(t, "figMkAbs_ruin", "ruin"), win: tx(t, "figMkAbs_win", "target"), formula }} />
  );
  const stage = (
    <>
      {drawing}
      <Transport t={t} playing={running && !stepMode} onPlay={playPause} onStep={stepOnce} onReset={() => place(start)}
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
    ]} />
  );
  const readouts = (
    <Row>
      <Readout color={C.green}>h{sub(start)} = {fStr(hit[start])} ≈ {f2(fNum(hit[start]) * 100, 1)}%</Readout>
      <Readout color={C.purple}>t{sub(start)} = {fStr(time[start])} ≈ {f2(fNum(time[start]), 2)}</Readout>
      {pos.some(s => s !== start) && (
        <Readout color={C.amber}>{tx(t, "figMkAbs_sim", "simulated")}: {won} / {WALKERS} {tx(t, "figMkAbs_atK", "at k")} ({f2((won / WALKERS) * 100, 0)}%)</Readout>
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
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkAbs_title", "Absorbing walls: where it ends and how long it takes")}
        head={<>
          <Btn onClick={() => { setMode("hit"); reconfigure(EX.k, EX.p, 1); }}>{tx(t, "figMkAbs_ex", "worked example")}</Btn>
          <LabButton onClick={lab.show} t={t} />
        </>}
        controls={<>
          <Row>{startPick}<span className="w-px h-5 bg-[var(--border)] mx-1" />{modeChoice}</Row>
          {readouts}
        </>}
        note={tx(t, "figMkAbs_note", "The bars are exact: for every start, the chance of reaching k before 0, or the expected number of steps until the walk stops. Click an inner bar to see its first-step equation: its top lies on the chord between its neighbours, p of the way along. Release the crowd to check the chance by simulation.")}
      >
        <div ref={vis.ref}>{stage}</div>
      </Figure>

      <Lab open={lab.open} onClose={lab.hide} t={t}
        title={tx(t, "figMkAbs_title", "Absorbing walls: where it ends and how long it takes")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          <Row>{startPick}<span className="w-px h-5 bg-[var(--border)] mx-1" />{modeChoice}</Row>
          <Sliders>
            <Slider label={tx(t, "figMkAbs_p", "win a coin, p")} value={p} min={0.05} max={0.95} step={0.05} onChange={v => reconfigure(k, v)} width="w-28" />
            <Slider label={tx(t, "figMkAbs_k", "target k")} value={k} min={2} max={8} step={1} onChange={v => reconfigure(v, p)} fmt={v => String(v)} width="w-28" />
          </Sliders>
          <SpeedControl speed={speed} setSpeed={setSpeed} />
          {readouts}
        </>}
      />
    </>
  );
}
