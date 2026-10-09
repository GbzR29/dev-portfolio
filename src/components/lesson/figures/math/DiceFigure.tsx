"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, f2, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";

// ── What this figure shows ────────────────────────────────────────────────────
// Left: the 36 equally likely outcomes of rolling two dice (first die across,
// second die down, each cell showing the sum). The chosen event lights up its
// cells, so its probability is a count: cells / 36. Right: rolling the dice
// for real. The amber curve is the event's relative frequency after each roll,
// on a logarithmic axis from 1 to 10 000 rolls; it wanders at first and then
// settles on the dashed green line, the probability counted on the left.
// The Transport rolls: ▶ keeps rolling, faster and faster so the curve moves
// across the log axis at a steady pace; ⏭ rolls up to the next power of 10.
// The lab: the most likely sum, Leibniz's slip, short versus long runs.

type Ev = "sum" | "atLeast" | "doubles" | "six" | "even";
const EVENTS: Record<Ev, (a: number, b: number, s: number) => boolean> = {
  sum: (a, b, s) => a + b === s,
  atLeast: (a, b, s) => a + b >= s,
  doubles: (a, b) => a === b,
  six: (a, b) => a === 6 || b === 6,
  even: a => a % 2 === 0,
};
const W = 560, H = 236, CELL = 28, GX = 36, GY = 36;
const PX0 = 270, PX1 = 530, PY0 = 22, PY1 = 204, MAX_ROLLS = 10000;
const px = (n: number) => PX0 + (Math.log10(n) / 4) * (PX1 - PX0);
const py = (f: number) => PY1 - f * (PY1 - PY0);
const fresh = (m: number) => Array.from({ length: m }, () => Math.floor(Math.random() * 36));

export function DiceFigure({ t }: { t?: TrackTranslations }) {
  const [ev, setEv] = useState<Ev>("sum");
  const [s, setS] = useState(7);
  const [rolls, setRolls] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const lab = useLab("math-dice");
  const vis = useVisible<HTMLDivElement>();

  const test = (a: number, b: number) => EVENTS[ev](a, b, s);
  const favourable = Array.from({ length: 36 }, (_, i) => test(Math.floor(i / 6) + 1, (i % 6) + 1)).filter(Boolean).length;
  const p = favourable / 36;

  // Running relative frequency, thinned out so the path stays short.
  let hits = 0, d = "";
  const every = Math.max(1, Math.ceil(rolls.length / 1500));
  rolls.forEach((r, i) => {
    if (test(Math.floor(r / 6) + 1, (r % 6) + 1)) hits++;
    if ((i + 1) % every === 0 || i === rolls.length - 1) d += `${d ? "L" : "M"}${px(i + 1).toFixed(1)},${py(hits / (i + 1)).toFixed(1)}`;
  });
  const n = rolls.length, freq = n ? hits / n : NaN, off = Math.abs(freq - p);
  const last = n ? rolls[n - 1] : -1;

  const rollTo = (m: number) => { const k = Math.min(m, MAX_ROLLS) - n; if (k > 0) setRolls([...rolls, ...fresh(k)]); };
  // Playing multiplies the number of rolls by about 3 each second: a steady pace on the log axis.
  useFrame(playing && (vis.on || lab.open), dt => {
    if (n >= MAX_ROLLS) { setPlaying(false); return; }
    rollTo(n + Math.max(1, Math.round(n * 1.15 * dt)));
  });
  const stop = () => setPlaying(false);
  const nextPow = n < 1 ? 1 : 10 ** (Math.floor(Math.log10(n) + 1e-9) + 1);
  const usesS = ev === "sum" || ev === "atLeast";

  const view = (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* the 6 × 6 outcome grid */}
        <T x={GX + 3 * CELL} y={GY - 20} anchor="middle" color={C.axis}>{tx(t, "figDice_first", "first die →")}</T>
        <T x={GX - 16} y={GY + 6 * CELL + 16} color={C.axis}>{tx(t, "figDice_second", "↑ second die")}</T>
        {[1, 2, 3, 4, 5, 6].map(i => <g key={`h${i}`}>
          <T x={GX + (i - 0.5) * CELL} y={GY - 6} anchor="middle" color={C.fg} bold>{i}</T>
          <T x={GX - 7} y={GY + (i - 0.5) * CELL + 3.5} anchor="end" color={C.fg} bold>{i}</T>
        </g>)}
        {Array.from({ length: 36 }, (_, i) => {
          const a = Math.floor(i / 6) + 1, b = (i % 6) + 1, on = test(a, b);
          return <g key={i}>
            <rect x={GX + (a - 1) * CELL + 1} y={GY + (b - 1) * CELL + 1} width={CELL - 2} height={CELL - 2} rx={4}
              fill={on ? C.green : "var(--surface)"} fillOpacity={on ? 0.3 : 1} stroke={i === last ? C.amber : on ? C.green : "var(--border)"} strokeWidth={i === last ? 2.4 : 1} />
            <T x={GX + (a - 0.5) * CELL} y={GY + (b - 0.5) * CELL + 3.5} anchor="middle" color={on ? C.fg : C.muted}>{a + b}</T>
          </g>;
        })}

        {/* running frequency on a log axis */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => <g key={`y${f}`}>
          <line x1={PX0} x2={PX1} y1={py(f)} y2={py(f)} stroke={C.grid} strokeWidth={f === 0 ? 1.2 : 0.6} />
          <T x={PX0 - 5} y={py(f) + 3} anchor="end" color={C.axis} size={8.5}>{f}</T>
        </g>)}
        {[1, 10, 100, 1000, 10000].map(v => <g key={`x${v}`}>
          <line x1={px(v)} x2={px(v)} y1={PY0} y2={PY1} stroke={C.grid} strokeWidth={0.6} />
          <T x={px(v)} y={PY1 + 13} anchor="middle" color={C.axis} size={8.5}>{v}</T>
        </g>)}
        <T x={PX1} y={PY1 + 26} anchor="end" color={C.axis} size={8.5}>{tx(t, "figDice_rolls", "rolls (log scale)")}</T>
        <line x1={PX0} x2={PX1} y1={py(p)} y2={py(p)} stroke={C.green} strokeWidth={1.4} strokeDasharray="6 5" />
        {d && <path d={d} fill="none" stroke={C.amber} strokeWidth={1.8} />}
      </svg>
      <Transport t={t} playing={playing}
        onPlay={() => { if (n >= MAX_ROLLS) setRolls([]); setPlaying(v => !v); }}
        playLabel={tx(t, "figDice_keepRolling", "keep rolling, faster and faster")}
        onStep={() => { stop(); rollTo(nextPow); }}
        onReset={() => { stop(); setRolls([]); }}
        readout={fill(tx(t, "figDice_nRolls", "{n} rolls"), { n })} />
    </div>
  );

  const evChoice = <Choice value={ev} onChange={setEv} options={[
    ["sum", tx(t, "figDice_sum", "sum = s")],
    ["atLeast", tx(t, "figDice_atLeast", "sum ≥ s")],
    ["doubles", tx(t, "figDice_doubles", "doubles")],
    ["six", tx(t, "figDice_six", "at least one 6")],
    ["even", tx(t, "figDice_even", "first die even")],
  ]} />;
  const controls = <>
    {usesS && <Slider label="s" value={s} min={2} max={12} step={1} onChange={setS} fmt={v => String(v)} />}
    <Row>
      <Btn onClick={() => { stop(); rollTo(n + 1); }}>{tx(t, "figDice_roll1", "roll once")}</Btn>
      <Readout color={C.green}>{`P = ${favourable}/36 = ${f2(p, 3)}`}</Readout>
      <Readout color={C.amber}>{n ? `${tx(t, "figDice_freq", "frequency")} = ${hits}/${n} = ${f2(freq, 3)}` : tx(t, "figDice_none", "no rolls yet")}</Readout>
    </Row>
  </>;
  const note = tx(t, "figDice_note2", "The grid counts: every cell is one ordered outcome (first die, second die), all 36 equally likely, so the probability of an event is the number of lit cells divided by 36. The plot experiments: press ▶ and the dice roll faster and faster. After a handful of rolls the frequency can be far from the probability, but as the rolls pile up it settles closer and closer to it. Probability is the value the frequency settles on.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figDiceL1_t", "The most likely sum"),
      body: <>
        <p>{tx(t, "figDiceL1_b1", "Each cell is one ordered outcome, red die first, blue die second, and all 36 are equally likely. The number in a cell is the sum of the two dice.")}</p>
        <p>{tx(t, "figDiceL1_b2", "Move s to find the sum that lights up the most cells.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDiceL1_g", "The sum with the most cells (now s = {s}: {c} cells)."), { s, c: favourable }), done: ev === "sum" && s === 7 },
      hint: tx(t, "figDiceL1_h", "The cells with the same sum run along a diagonal. The longest diagonal has 6 cells."),
      setup: () => { stop(); setRolls([]); setEv("sum"); setS(2); },
    },
    {
      title: tx(t, "figDiceL2_t", "Quick check"),
      body: <p>{tx(t, "figDiceL2_b", "Leibniz, one of the inventors of calculus, once claimed that a sum of 11 and a sum of 12 are equally easy to throw: each can be made in only one way, 5 + 6 or 6 + 6.")}</p>,
      quiz: {
        q: tx(t, "figDiceL2_q", "What are P(sum = 11) and P(sum = 12)?"),
        options: ["2/36 and 1/36", "1/36 and 1/36", "1/11 and 1/11", "2/36 and 2/36"],
        answer: 0,
        why: tx(t, "figDiceL2_w", "11 is two cells, (5, 6) and (6, 5): the red die can be the 5 or the 6. 12 is only (6, 6). The 11 sums 2 … 12 are not equally likely, so 1/11 is wrong too."),
      },
    },
    {
      title: tx(t, "figDiceL3_t", "A short run"),
      body: <>
        <p>{tx(t, "figDiceL3_b1", "P(sum = 7) = 6/36 ≈ 0.167: the dashed green line. The amber curve will be the share of rolls that actually gave 7.")}</p>
        <p>{tx(t, "figDiceL3_b2", "Roll ten times, with the button or ⏭.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDiceL3_g", "At least 10 rolls (now {n})."), { n }), done: n >= 10 },
      focus: "step",
      setup: () => { stop(); setRolls([]); setEv("sum"); setS(7); },
    },
    {
      title: tx(t, "figDiceL4_t", "The long run"),
      body: <>
        <p>{tx(t, "figDiceL4_b1", "Ten rolls can give no 7 at all, or four. Press ▶ and let the dice roll all the way to 10 000.")}</p>
        <p>{tx(t, "figDiceL4_b2", "Watch the amber curve: wild at first, then hugging the green line.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDiceL4_g", "10 000 rolls (now {n})."), { n }), done: n >= MAX_ROLLS },
      focus: "play",
      setup: () => { setEv("sum"); setS(7); },
    },
    {
      title: tx(t, "figDiceL5_t", "At least one six"),
      body: <>
        <p>{tx(t, "figDiceL5_b1", "Pick \"at least one 6\". The lit cells form a cross: the last column and the last row.")}</p>
        <p>{tx(t, "figDiceL5_b2", "Count them before you read the answer.")}</p>
      </>,
      goal: { text: fill(tx(t, "figDiceL5_g", "The event \"at least one 6\" is shown ({c} cells)."), { c: favourable }), done: ev === "six" },
      setup: () => { stop(); setRolls([]); },
    },
    {
      title: tx(t, "figDiceL6_t", "Quick check"),
      body: <p>{tx(t, "figDiceL6_b", "6 cells in the column plus 6 in the row would be 12, but (6, 6) is in both.")}</p>,
      quiz: {
        q: tx(t, "figDiceL6_q", "Which calculation gives P(at least one 6) with two dice?"),
        options: ["1 − 25/36 = 11/36", "1/6 + 1/6 = 12/36", "1/6 · 1/6 = 1/36", "25/36"],
        answer: 0,
        why: tx(t, "figDiceL6_w", "The complement, no 6 at all, leaves 5 options for each die: 5 · 5 = 25 cells. So 36 − 25 = 11 cells have a 6. Adding 1/6 + 1/6 counts (6, 6) twice; 1/36 is both dice showing 6."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "short", tone: "warn", when: n >= 5 && n < 100 && off > 0.08,
      title: tx(t, "figDiceI1_t", "Short runs wander"),
      body: fill(tx(t, "figDiceI1_b", "After {n} rolls the frequency is {f}, against a probability of {p}. Nothing is wrong with the dice: a few rolls simply vary a lot."), { n, f: f2(freq, 3), p: f2(p, 3) }),
    },
    {
      id: "settled", tone: "ok", when: n >= 1000 && off < 0.02,
      title: tx(t, "figDiceI2_t", "Settled"),
      body: fill(tx(t, "figDiceI2_b", "{n} rolls: the frequency {f} is within {e} of {p}. This is the law of large numbers: the long-run frequency settles on the probability."), { n, f: f2(freq, 3), e: f2(off, 3), p: f2(p, 3) }),
    },
    {
      id: "corner", tone: "info", when: ev === "sum" && (s === 2 || s === 12),
      title: tx(t, "figDiceI3_t", "Only one way"),
      body: fill(tx(t, "figDiceI3_b", "A sum of {s} needs both dice to show {d}: a single corner cell, P = 1/36."), { s, d: s / 2 }),
    },
    {
      id: "firstOnly", tone: "info", when: ev === "even",
      title: tx(t, "figDiceI4_t", "The second die does not matter"),
      body: tx(t, "figDiceI4_b", "The event only asks about the first die, so whole columns light up: 3 columns of 6, 18/36 = 1/2."),
    },
    {
      id: "empty", tone: "warn", when: ev === "sum" && favourable === 0,
      title: tx(t, "figDiceI5_t", "Impossible"),
      body: tx(t, "figDiceI5_b", "No cell has this sum, so P = 0."),
    },
  ];

  const title = tx(t, "figDice_title", "Two dice: counting and rolling");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{evChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls}
        note={note}
      >
        <div ref={vis.ref}>{view}</div>
      </Figure>

      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{evChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figDiceR1", "The 36 ordered pairs are the equally likely outcomes; the 11 sums are not."),
          tx(t, "figDiceR2", "P(event) = lit cells / 36: 7 is the most likely sum, at 6/36."),
          tx(t, "figDiceR3", "Short runs can be far from the probability; over thousands of rolls the frequency settles on it."),
          tx(t, "figDiceR4", "At least one 6 is 1 − P(no 6) = 1 − 25/36 = 11/36."),
        ]}
      />
    </>
  );
}
