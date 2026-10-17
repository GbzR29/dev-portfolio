"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, Sliders, C, T, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Induction as a row of dominoes, one per n. A domino falls when it is pushed
// (the base case) or when the one before it falls and the link between them
// holds (the inductive step: P(k) ⇒ P(k + 1)). Play pushes the base domino.
// Claims:
//   sum   — 1 + 2 + … + n = n(n + 1)/2. Base and step both hold. "Break the
//           step" cuts the link after one domino, "no base" removes the push.
//   pow   — 2ⁿ ≥ n². True for n = 1, 2, false for n = 3, true from 4 on; the
//           step 2ᵏ ≥ k² ⇒ 2ᵏ⁺¹ ≥ (k + 1)² only holds for k ≥ 3. The base
//           slider decides where the chain starts.
//   euler — n² + n + 41 is prime. True for every n up to 39, false at 40. No
//           step can be proved, so every domino has to be checked by hand.

type Claim = "sum" | "pow" | "euler";
const W = 560, H = 230;
const isPrime = (x: number) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
const CLAIMS: Record<Claim, {
  from: number; to: number;
  truth: (n: number) => boolean;
  link: (k: number, broken: number | null) => boolean;
  value: (n: number) => string;
}> = {
  sum: {
    from: 1, to: 12, truth: () => true,
    link: (k, broken) => k !== broken,
    value: n => `${(n * (n + 1)) / 2}`,
  },
  pow: {
    from: 1, to: 12, truth: n => 2 ** n >= n * n,
    link: k => k >= 3,                                   // 2·2ᵏ ≥ 2k² ≥ (k + 1)² needs k² ≥ 2k + 1, i.e. k ≥ 3
    value: n => `${2 ** n} ≥ ${n * n}`,
  },
  euler: {
    from: 30, to: 42, truth: n => isPrime(n * n + n + 41),
    link: () => false,
    value: n => `${n * n + n + 41}`,
  },
};
const DELAY = 0.22, FALL = 0.35;                         // seconds between dominoes, seconds to tip over

/** Which dominoes fall when the base n0 is pushed (if `push`), and when each starts. */
function chain(claim: Claim, n0: number, push: boolean, broken: number | null) {
  const c = CLAIMS[claim], start = new Map<number, number>();
  if (!push || n0 < c.from || n0 > c.to || !c.truth(n0)) return start;
  start.set(n0, 0);
  for (let n = n0; n < c.to && c.link(n, broken) && c.truth(n + 1); n++) start.set(n + 1, (n + 1 - n0) * DELAY);
  return start;
}

export function InductionFigure({ t }: { t?: TrackTranslations }) {
  const [claim, setClaim] = useState<Claim>("sum");
  const [n0, setN0] = useState(1);
  const [push, setPush] = useState(true);
  const [broken, setBroken] = useState<number | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-induction");
  const vis = useVisible<HTMLDivElement>();

  const c = CLAIMS[claim];
  const starts = chain(claim, n0, push, broken);
  const tEnd = Math.max(0, ...starts.values()) + FALL;
  useFrame(playing && (vis.on || lab.open), dt => {
    if (time >= tEnd) { setPlaying(false); return; }
    setTime(v => Math.min(tEnd, v + dt));
  });
  const stop = () => setPlaying(false);
  const reset = () => { stop(); setTime(0); };
  const fallen = [...starts.entries()].filter(([, s]) => time >= s + FALL).map(([n]) => n);
  const done = time >= tEnd && starts.size > 0;
  const choose = (k: Claim) => { reset(); setClaim(k); setN0(CLAIMS[k].from); setBroken(null); setPush(true); };

  // ── drawing
  const N = c.to - c.from + 1, gap = (W - 60) / N, dw = Math.min(12, gap * 0.38), dh = 70, base = 150;
  const xOf = (n: number) => 36 + (n - c.from) * gap;
  const dominoes = [];
  for (let n = c.from; n <= c.to; n++) {
    const s = starts.get(n), p = s === undefined ? 0 : Math.max(0, Math.min(1, (time - s) / FALL));
    const ang = p * 62, truth = c.truth(n);
    const col = !truth ? C.red : p > 0 ? C.green : n === n0 && push ? C.amber : C.sky;
    const x = xOf(n);
    dominoes.push(
      <g key={n}>
        <g transform={`rotate(${ang} ${x + dw} ${base})`}>
          <rect x={x} y={base - dh} width={dw} height={dh} rx={2} fill={col} opacity={truth ? 0.9 : 0.75} />
        </g>
        <T x={x + dw / 2} y={base + 16} anchor="middle" color={truth ? C.muted : C.red} size={9}>{n}</T>
        {n < c.to && !c.link(n, broken) && (
          <g>
            <line x1={x + gap * 0.62} x2={x + gap * 0.62} y1={base - 26} y2={base} stroke={C.red} strokeWidth={2} />
            <T x={x + gap * 0.62} y={base - 30} anchor="middle" color={C.red} size={9} bold>×</T>
          </g>
        )}
      </g>,
    );
  }
  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <line x1={20} x2={W - 16} y1={base} y2={base} stroke={C.axis} strokeWidth={1.5} />
        {dominoes}
        {push && <T x={xOf(n0) - 4} y={base - dh - 10} anchor="middle" color={C.amber} bold>{tx(t, "figInd_push", "push")}</T>}
        <T x={20} y={H - 34} color={C.muted}>{`P(n): ${claim === "sum" ? "1 + 2 + … + n = n(n + 1)/2" : claim === "pow" ? "2ⁿ ≥ n²" : tx(t, "figInd_euler", "n² + n + 41 is prime")}`}</T>
        <T x={20} y={H - 16} color={done ? C.green : C.muted}>{done
          ? fill(tx(t, "figInd_proved", "fallen: n = {a} to {b}"), { a: Math.min(...fallen), b: Math.max(...fallen) })
          : starts.size === 0 ? tx(t, "figInd_nothing", "nothing is pushed: no domino can fall") : tx(t, "figInd_ready", "press play to push the base domino")}</T>
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (time >= tEnd) setTime(0); setPlaying(v => !v); }}
        playLabel={tx(t, "figInd_play", "push")}
        onStep={() => { stop(); setTime(v => Math.min(tEnd, v + DELAY)); }}
        onBack={() => { stop(); setTime(v => Math.max(0, v - DELAY)); }}
        onReset={reset}
        readout={`${fallen.length} / ${N}`} />
    </div>
  );

  const claimChoice = <Choice value={claim} onChange={choose} options={[
    ["sum", "1 + … + n"],
    ["pow", "2ⁿ ≥ n²"],
    ["euler", "n² + n + 41"],
  ] as const} />;
  const controls = <>
    <Row>
      <Btn active={push} onClick={() => { reset(); setPush(v => !v); }}>{tx(t, "figInd_base", "base case (push)")}</Btn>
      {claim === "sum" && <Btn active={broken !== null} onClick={() => { reset(); setBroken(b => (b === null ? 5 : null)); }}>{tx(t, "figInd_break", "break it: no step from 5 to 6")}</Btn>}
    </Row>
    <Sliders>
      <Slider label={tx(t, "figInd_n0", "base n₀")} value={n0} min={c.from} max={c.to} step={1} onChange={v => { reset(); setN0(v); }} fmt={v => String(v)} />
    </Sliders>
    <Row>
      <Readout color={c.truth(n0) ? C.green : C.red}>{`P(${n0}): ${c.value(n0)} ${c.truth(n0) ? "✓" : "✗"}`}</Readout>
      {claim === "euler" && <Readout color={C.red}>{`P(40): 40² + 40 + 41 = 1681 = 41²`}</Readout>}
    </Row>
  </>;
  const note = tx(t, "figInd_note", "Each domino is one statement P(n). Pushing the first one is the base case. The spacing that lets each falling domino knock over the next is the inductive step, P(k) ⇒ P(k + 1). Press play: if both hold, every domino falls, however many there are. Remove the push, or break one link, and the chain stops. On 2ⁿ ≥ n², domino 3 is false (8 < 9) and the step only works from k = 3 on, so the chain has to start at 4. On n² + n + 41 every domino up to 39 stands for a true statement, but there is no step at all: checking cases one by one proves nothing about the next, and n = 40 fails.");

  // ── Lab ──
  const allFell = done && fallen.length === starts.size && fallen.length === c.to - n0 + 1;
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figIndL1_t", "Push the first one"),
      body: <>
        <p>{tx(t, "figIndL1_b1", "Each domino is the statement 1 + 2 + … + n = n(n + 1)/2 for one n. The base case P(1) is true: 1 = 1 · 2 / 2.")}</p>
        <p>{tx(t, "figIndL1_b2", "The step (shown in the lesson) holds for every k. Push the first domino.")}</p>
      </>,
      goal: { text: tx(t, "figIndL1_g", "All 12 dominoes down."), done: claim === "sum" && push && broken === null && allFell && n0 === 1 },
      focus: "play",
      setup: () => choose("sum"),
    },
    {
      title: tx(t, "figIndL2_t", "No base case"),
      body: <p>{tx(t, "figIndL2_b", "Turn the push off and press play. The links are all still there.")}</p>,
      goal: { text: tx(t, "figIndL2_g", "Base case off, play pressed."), done: claim === "sum" && !push && time > 0 },
      hint: tx(t, "figIndL2_h", "Untick \"base case\", then press play. Nothing moves."),
      setup: () => choose("sum"),
    },
    {
      title: tx(t, "figIndL3_t", "A broken link"),
      body: <p>{tx(t, "figIndL3_b", "Now keep the push but break the step from 5 to 6.")}</p>,
      goal: { text: tx(t, "figIndL3_g", "Step broken, chain run to the end."), done: claim === "sum" && push && broken !== null && done },
      setup: () => choose("sum"),
    },
    {
      title: tx(t, "figIndL4_t", "Quick check"),
      body: <p>{tx(t, "figIndL4_b", "Base case true, step proved for every k except from 5 to 6.")}</p>,
      quiz: {
        q: tx(t, "figIndL4_q", "What has been proved?"),
        options: [tx(t, "figIndL4_o1", "P(1) to P(5) only"), tx(t, "figIndL4_o2", "P(n) for all n"), tx(t, "figIndL4_o3", "nothing at all"), tx(t, "figIndL4_o4", "P(6) onwards")],
        answer: 0,
        why: tx(t, "figIndL4_w", "The chain reaches 5 and stops. P(6) and beyond may well be true, but this argument does not reach them."),
      },
    },
    {
      title: tx(t, "figIndL5_t", "Where to start"),
      body: <>
        <p>{tx(t, "figIndL5_b1", "Claim: 2ⁿ ≥ n². Domino 3 is red: 2³ = 8 < 9. The step only holds from k = 3 on.")}</p>
        <p>{tx(t, "figIndL5_b2", "Move the base so that every domino from the base on falls.")}</p>
      </>,
      goal: { text: fill(tx(t, "figIndL5_g", "Every domino from n₀ to 12 down (now n₀ = {n})."), { n: n0 }), done: claim === "pow" && push && allFell && n0 >= 3 },
      hint: tx(t, "figIndL5_h", "Try n₀ = 4: P(4) is 16 ≥ 16, true, and from 4 on every link holds."),
      setup: () => { choose("pow"); },
    },
    {
      title: tx(t, "figIndL6_t", "Quick check"),
      body: <p>{tx(t, "figIndL6_b", "Look at n² + n + 41 from n = 30 to 42. Every value up to n = 39 is prime.")}</p>,
      quiz: {
        q: tx(t, "figIndL6_q", "Is \"n² + n + 41 is always prime\" proved by checking n = 1 to 39?"),
        options: [tx(t, "figIndL6_o1", "No: there is no inductive step, and n = 40 fails"), tx(t, "figIndL6_o2", "Yes: 39 cases is plenty"), tx(t, "figIndL6_o3", "Yes, for odd n only")],
        answer: 0,
        why: tx(t, "figIndL6_w", "40² + 40 + 41 = 40·41 + 41 = 41·41 = 1681. Without a step, true cases say nothing about the next one."),
      },
      setup: () => choose("euler"),
    },
  ];

  const insights: Insight[] = [
    {
      id: "all", tone: "ok", when: allFell && claim !== "euler",
      title: tx(t, "figIndI1_t", "The whole row"),
      body: fill(tx(t, "figIndI1_b", "Base P({n}) plus the step: every statement from n = {n} on is proved, not just the {k} on screen."), { n: n0, k: c.to - n0 + 1 }),
    },
    {
      id: "nopush", tone: "warn", when: !push,
      title: tx(t, "figIndI2_t", "A step alone proves nothing"),
      body: tx(t, "figIndI2_b", "P(k) ⇒ P(k + 1) can hold for a false statement, such as \"n = n + 1\": if k = k + 1 then k + 1 = k + 2. Without a true starting case nothing falls."),
    },
    {
      id: "euler", tone: "warn", when: claim === "euler",
      title: tx(t, "figIndI3_t", "Examples are not a proof"),
      body: tx(t, "figIndI3_b", "Euler's polynomial gives primes for n = 0 to 39. The pattern breaks at n = 40 = 41 − 1, where n² + n + 41 = 41²."),
    },
  ];

  const title = tx(t, "figInd_title", "Induction as dominoes");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{claimChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls} note={note}>
        <div ref={vis.ref}>{view}</div>
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{claimChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figIndR1", "Base case: P(n₀) is true. Inductive step: P(k) ⇒ P(k + 1) for every k ≥ n₀."),
          tx(t, "figIndR2", "Together they prove P(n) for every n ≥ n₀; either one alone proves nothing."),
          tx(t, "figIndR3", "The base must be where the step starts working (2ⁿ ≥ n² from n = 4)."),
          tx(t, "figIndR4", "Checking many cases is not a proof: n² + n + 41 fails at n = 40."),
        ]}
      />
    </>
  );
}
