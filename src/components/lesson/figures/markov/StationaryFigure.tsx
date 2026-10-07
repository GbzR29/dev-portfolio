"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Figure, Readout, Row, f2 } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { classify, frac, fDiv, fNum, fStr, ONE, stationaryExact, vecMul } from "./model";
import { FREE_MAX, STATE_COLS, StationaryStage, dec, type Handle } from "./StationaryStage";

// ── What this figure shows ────────────────────────────────────────────────────
// Any 3-state chain, not only a walk: tomorrow's weather given today's. The
// rows of P are bars to drag. Under the drawing, the equations πP = π with the
// current numbers and their exact solution, the long-run share of each state,
// and the mean time between visits 1/π(j). The lab breaks the chain on purpose
// (a cycle, a trap, two separate worlds, rows that don't add up to 1) and
// explains what each break does to π.

type Preset = "weather" | "cycle" | "trap" | "worlds" | "forget";
const PRESETS: Record<Preset, number[][]> = {
  weather: [[14, 4, 2], [6, 8, 6], [4, 6, 10]],     // 0.7 0.2 0.1 / 0.3 0.4 0.3 / 0.2 0.3 0.5
  cycle: [[0, 20, 0], [0, 0, 20], [20, 0, 0]],
  trap: [[10, 10, 0], [5, 10, 5], [0, 0, 20]],
  worlds: [[10, 10, 0], [10, 10, 0], [0, 0, 20]],
  forget: [[10, 6, 4], [10, 6, 4], [10, 6, 4]],
};
const N_PLOT = 20;

export function StationaryFigure({ t }: { t?: TrackTranslations }) {
  const [M, setM] = useState<number[][]>(PRESETS.weather);
  const [free, setFree] = useState(false);
  const [moved, setMoved] = useState(false);
  const lab = useLab("markov-stationary");
  const names = [tx(t, "figMkStat_s0", "sunny"), tx(t, "figMkStat_s1", "cloudy"), tx(t, "figMkStat_s2", "rainy")];

  const sums = M.map(r => r[0] + r[1] + r[2]);
  const stochastic = sums.every(s => s === 20);
  const Pf = useMemo(() => M.map(r => r.map(v => frac(v, 20))), [M]);
  const Pn = useMemo(() => M.map(r => r.map(v => v / 20)), [M]);
  const piExact = useMemo(() => (stochastic ? stationaryExact(Pf) : null), [Pf, stochastic]);
  const pi = piExact ? piExact.map(fNum) : null;
  const classes = useMemo(() => classify(Pn), [Pn]);
  const dists = useMemo(() => {
    const out = [[1, 0, 0]];
    for (let s = 0; s < N_PLOT; s++) out.push(vecMul(out[s], Pn));
    return out;
  }, [Pn]);

  const closed = classes.filter(c => c.closed);
  const irreducible = classes.length === 1;
  const period = irreducible ? classes[0].period : 1;
  const traps = [0, 1, 2].filter(i => M[i][i] === 20);
  const forgetful = M.every(r => r.every((v, j) => v === M[0][j]));
  const broken = sums.findIndex(s => s !== 20);

  const load = (p: Preset) => { setFree(false); setM(PRESETS[p]); };
  const onDrag = (h: Handle, v: number) => {
    setMoved(true);
    setM(prev => prev.map((row, r) => {
      if (r !== h.r) return row;
      const c = [row[0], row[0] + row[1], row[0] + row[1] + row[2]];
      if (!free) {
        const lo = h.d === 0 ? 0 : c[0], hi = h.d === 0 ? c[1] : 20;
        c[h.d] = Math.max(lo, Math.min(hi, v));
        return [c[0], c[1] - c[0], 20 - c[1]];
      }
      const lo = h.d === 0 ? 0 : c[h.d - 1];
      const others = c[2] - row[h.d];
      const next = [...row];
      next[h.d] = Math.max(0, Math.min(FREE_MAX - others, v - lo));
      return next;
    }));
  };
  const toggleFree = () => {
    if (free) {
      // Back to the rules: scale each row so it adds up to 1 again
      setM(prev => prev.map((row, r) => {
        const s = row[0] + row[1] + row[2];
        if (s === 20) return row;
        if (s === 0) return row.map((_, j) => (j === r ? 20 : 0));
        const a = Math.round((row[0] * 20) / s), b = Math.min(20 - a, Math.round((row[1] * 20) / s));
        return [a, b, 20 - a - b];
      }));
    }
    setFree(f => !f);
  };

  const stage = <StationaryStage M={M} free={free} pi={pi} names={names} dists={dists} onDrag={onDrag} />;

  // ── The equations πP = π, one per column, with the current numbers ──
  const term = (i: number, j: number) => M[i][j] === 0 ? null : `${dec(M[i][j])}·π(${i})`;
  const equation = (j: number) => `π(${j}) = ${[0, 1, 2].map(i => term(i, j)).filter(Boolean).join(" + ") || "0"}`;
  const equations = (
    <div className="font-mono text-[11.5px] leading-relaxed rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 overflow-x-auto">
      <div style={{ color: STATE_COLS[0] }}>{equation(0)}</div>
      <div style={{ color: STATE_COLS[1] }}>{equation(1)}</div>
      <div className="opacity-50" style={{ color: STATE_COLS[2] }}>{equation(2)}   ← {tx(t, "figMkStat_redundant", "follows from the other two")}</div>
      <div>π(0) + π(1) + π(2) = 1</div>
    </div>
  );
  const solution = piExact
    ? <Readout color={C.green}>π = ({piExact.map(fStr).join(", ")}) ≈ ({pi!.map(v => f2(v, 3)).join(", ")})</Readout>
    : <Readout color={C.red}>{stochastic ? tx(t, "figMkStat_noUnique", "πP = π has many solutions") : tx(t, "figMkStat_notStoch", "not a stochastic matrix: no π")}</Readout>;
  const returns = piExact && piExact.every(p => p.n > BigInt(0)) && (
    <Readout>{tx(t, "figMkStat_return", "mean return time 1/π")}: {piExact.map((p, j) => `${j}: ${f2(fNum(fDiv(ONE, p)), 2)}`).join(" · ")}</Readout>
  );
  const presets = (
    <Row>
      <Btn active={!free && M === PRESETS.weather} onClick={() => load("weather")}>{tx(t, "figMkStat_weather", "weather")}</Btn>
      <Btn active={!free && M === PRESETS.cycle} onClick={() => load("cycle")}>{tx(t, "figMkStat_cycle", "cycle")}</Btn>
      <Btn active={!free && M === PRESETS.trap} onClick={() => load("trap")}>{tx(t, "figMkStat_trap", "trap")}</Btn>
      <Btn active={!free && M === PRESETS.worlds} onClick={() => load("worlds")}>{tx(t, "figMkStat_worlds", "two worlds")}</Btn>
      <Btn active={!free && M === PRESETS.forget} onClick={() => load("forget")}>{tx(t, "figMkStat_forget", "forgetful")}</Btn>
    </Row>
  );

  // ── Lab ──
  const nameList = (s: number[]) => s.map(i => names[i]).join(", ");
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figMkStatL1_t", "Any chain is a stack of rows"),
      body: <>
        <p>{tx(t, "figMkStatL1_b1", "Tomorrow's weather depends only on today's. Each bar on the right is one row of P: if today is sunny, the top bar says how likely tomorrow is sunny, cloudy or rainy.")}</p>
        <p>{tx(t, "figMkStatL1_b2", "Drag a divider. One piece grows and its neighbour shrinks, so the row still adds up to 1.")}</p>
      </>,
      goal: { text: tx(t, "figMkStatL1_g", "Drag any divider."), done: moved },
      setup: () => load("weather"),
    },
    {
      title: tx(t, "figMkStatL2_t", "One equation per column"),
      body: <>
        <p>{tx(t, "figMkStatL2_b1", "π is the distribution that one step leaves unchanged: πP = π. Read it column by column. The probability of being sunny (state 0) tomorrow adds up what flows in from each state today: π(0) = 0.7·π(0) + 0.3·π(1) + 0.2·π(2).")}</p>
        <p>{tx(t, "figMkStatL2_b2", "That gives three equations, but they always add up to 0 = 0, so one is redundant. It is replaced by π(0) + π(1) + π(2) = 1. The box under the drawing shows the system and its exact solution, live.")}</p>
      </>,
      goal: { text: tx(t, "figMkStatL2_g", "Load \"weather\" and check: π = (21/46, 13/46, 6/23)."), done: !free && M === PRESETS.weather },
      setup: () => load("weather"),
    },
    {
      title: tx(t, "figMkStatL3_t", "Quick check"),
      body: <p>{tx(t, "figMkStatL3_b", "π(2) = 6/23 = 12/46: in the long run, 12 days in 46 are rainy.")}</p>,
      quiz: {
        q: tx(t, "figMkStatL3_q", "On average, how many days pass from one rainy day to the next?"),
        options: ["46/12 ≈ 3.8", "12/46 ≈ 0.26", "3", "46"],
        answer: 0,
        why: tx(t, "figMkStatL3_w", "If 12 days in 46 are rainy, the rainy days are on average 46/12 ≈ 3.8 days apart. In general the mean return time to a state is 1/π(j)."),
      },
    },
    {
      title: tx(t, "figMkStatL4_t", "Break it: a cycle"),
      body: <p>{tx(t, "figMkStatL4_b", "Make the weather go round: sunny always to cloudy, cloudy always to rainy, rainy always to sunny. Then watch the plot.")}</p>,
      goal: { text: tx(t, "figMkStatL4_g", "Make the chain periodic (the \"cycle\" button does it)."), done: irreducible && period > 1 },
      hint: tx(t, "figMkStatL4_h", "Drag each row's dividers so that the whole bar is the colour of the next state, or press \"cycle\"."),
    },
    {
      title: tx(t, "figMkStatL5_t", "Break it: a trap"),
      body: <p>{tx(t, "figMkStatL5_b", "A state whose row is all \"stay\" is absorbing: once there, the chain never leaves.")}</p>,
      goal: { text: tx(t, "figMkStatL5_g", "Make one state absorbing: its whole bar its own colour."), done: stochastic && traps.length > 0 },
      setup: () => load("weather"),
    },
    {
      title: tx(t, "figMkStatL6_t", "Break it: two worlds"),
      body: <p>{tx(t, "figMkStatL6_b", "Now cut the chain in two, so that one group of states can never reach the other.")}</p>,
      goal: { text: tx(t, "figMkStatL6_g", "Make two closed groups (\"two worlds\" does it)."), done: stochastic && closed.length >= 2 },
    },
    {
      title: tx(t, "figMkStatL7_t", "Break the rules"),
      body: <p>{tx(t, "figMkStatL7_b", "Switch on \"free entries\": now each piece can be dragged on its own, and a row can add up to more or less than 1.")}</p>,
      goal: { text: tx(t, "figMkStatL7_g", "Make a row that does not add up to 1, and watch the red line."), done: free && broken >= 0 },
      setup: () => load("weather"),
    },
    {
      title: tx(t, "figMkStatL8_t", "The forgetful chain"),
      body: <p>{tx(t, "figMkStatL8_b", "Last one, back to the rules: what if all three rows are the same?")}</p>,
      goal: { text: tx(t, "figMkStatL8_g", "Make all rows equal (\"forgetful\" does it)."), done: stochastic && forgetful },
      setup: () => { setFree(false); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "broken", tone: "warn", when: broken >= 0,
      title: tx(t, "figMkStatI1_t", "Not a stochastic matrix"),
      body: fill(tx(t, "figMkStatI1_b", "The row of {name} adds up to {s}, not 1. Each step from {name} {verb} {d}% of the probability out of nothing. The total, the red dashed line, should stay at 1; after 20 steps it is {tot}. The numbers are no longer probabilities, and πP = π means nothing. Every real transition matrix has rows that add up to exactly 1."), {
        name: names[Math.max(0, broken)], s: f2((sums[Math.max(0, broken)] ?? 20) / 20, 2),
        verb: (sums[Math.max(0, broken)] ?? 20) > 20 ? tx(t, "figMkStatI1_creates", "creates") : tx(t, "figMkStatI1_destroys", "destroys"),
        d: f2(Math.abs((sums[Math.max(0, broken)] ?? 20) - 20) * 5, 0),
        tot: f2(dists[N_PLOT].reduce((a, b) => a + b, 0), 3),
      }),
    },
    {
      id: "forget", tone: "ok", when: stochastic && forgetful,
      title: tx(t, "figMkStatI2_t", "Every row is the same"),
      body: tx(t, "figMkStatI2_b", "Then tomorrow does not depend on today at all: the days are independent. πP = π holds for π equal to that row, and π₁ already equals it from any start, so the plot is flat after one step."),
    },
    {
      id: "period", tone: "warn", when: stochastic && irreducible && period > 1,
      title: fill(tx(t, "figMkStatI3_t", "Period {d}"), { d: period }),
      body: fill(tx(t, "figMkStatI3_b", "The chain can return to a state only after a multiple of {d} steps, so πₙ goes round and round and never settles (look at the plot). A stationary π still exists, here ({pi}): it is the long-run share of time in each state, but not the limit of πₙ."), { d: period, pi: piExact ? piExact.map(fStr).join(", ") : "" }),
    },
    {
      id: "trap", tone: "warn", when: stochastic && closed.length === 1 && traps.length === 1,
      title: tx(t, "figMkStatI4_t", "A trap"),
      body: fill(tx(t, "figMkStatI4_b", "Once the chain reaches {name}, it stays there. The other states are transient: probability leaks out of them and never comes back. So π puts all its weight on the trap, π({name}) = 1, and every start ends there."), { name: names[traps[0]] }),
    },
    {
      id: "transient", tone: "info", when: stochastic && closed.length === 1 && traps.length === 0 && !irreducible,
      title: tx(t, "figMkStatI5_t", "Transient states"),
      body: fill(tx(t, "figMkStatI5_b", "The chain can leave {out} but never come back. Those states are transient and get π = 0. All the long-run probability lives in the closed class {in}."), {
        out: nameList(classes.filter(c => !c.closed).flatMap(c => c.states)), in: nameList(closed[0]?.states ?? []),
      }),
    },
    {
      id: "worlds", tone: "warn", when: stochastic && closed.length >= 2,
      title: tx(t, "figMkStatI6_t", "Two worlds: π is not unique"),
      body: fill(tx(t, "figMkStatI6_b", "The chain splits into closed classes that never reach each other: {a} and {b}. Each has its own stationary distribution, and any mix of them is stationary too, so πP = π has infinitely many solutions. The long run depends on where the chain starts. The plot starts at {s0} and never leaves its world."), {
        a: nameList(closed[0].states), b: nameList(closed[1]?.states ?? []), s0: names[0],
      }),
    },
    {
      id: "good", tone: "ok", when: stochastic && irreducible && period === 1 && !forgetful,
      title: tx(t, "figMkStatI7_t", "Irreducible and aperiodic"),
      body: tx(t, "figMkStatI7_b", "Every state can reach every other (irreducible), and loops of length 1 or of coprime lengths exist (aperiodic). Such a chain has exactly one π, and πₙ → π from any start. In the plot, the lines meet the dotted levels."),
    },
  ];

  return (
    <>
      <Figure fullscreen={false}
        title={tx(t, "figMkStat_title", "Any chain: solving πP = π")}
        head={<LabButton lab={lab} t={t} />}
        controls={<>
          {presets}
          {equations}
          <Row>{solution}{returns}</Row>
        </>}
        note={tx(t, "figMkStat_note", "Drag the dividers in the bars: each bar is one row of P, so it always adds up to 1. The system under the drawing is πP = π with the current numbers, one equation per column, and its exact solution sizes the circles. The plot follows πₙ from a sunny start; the dotted levels are π. The presets break the chain in different ways; the lab explains each one.")}
      >
        {stage}
      </Figure>

      <Lab lab={lab} t={t}
        recap={[
          tx(t, "figMkStatR1", "πP = π is one equation per column of P; one of them is redundant and is replaced by Σπ = 1."),
          tx(t, "figMkStatR2", "1/π(j) is the mean time between visits to j."),
          tx(t, "figMkStatR3", "A cycle has a π but πₙ keeps circling; a trap takes all of π; two closed classes make π not unique."),
          tx(t, "figMkStatR4", "Rows that don't add up to 1 create or destroy probability: they are not a Markov chain."),
        ]}
        title={tx(t, "figMkStat_title", "Any chain: solving πP = π")}
        steps={labSteps} insights={insights} stage={stage}
        controls={<>
          {presets}
          <Row><Btn active={free} onClick={toggleFree}>{free ? "✓ " : ""}{tx(t, "figMkStat_free", "free entries (break the rules)")}</Btn></Row>
          {equations}
          <Row>{solution}{returns}</Row>
        </>}
      />
    </>
  );
}
