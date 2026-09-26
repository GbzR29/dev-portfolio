"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, Slider, Btn, Choice, C, T, f2 } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Left: the 36 equally likely outcomes of rolling two dice (first die across,
// second die down, each cell showing the sum). The chosen event lights up its
// cells, so its probability is a count: cells / 36. Right: rolling the dice
// for real. The amber curve is the event's relative frequency after each roll,
// on a logarithmic axis from 1 to 10 000 rolls; it wanders at first and then
// settles on the dashed green line, the probability counted on the left.

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

export function DiceFigure({ t }: { t?: TrackTranslations }) {
  const [ev, setEv] = useState<Ev>("sum");
  const [s, setS] = useState(7);
  const [rolls, setRolls] = useState<number[]>([]);

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
  const last = rolls.length ? rolls[rolls.length - 1] : -1;

  const roll = (m: number) => setRolls(r => (r.length >= MAX_ROLLS ? r : [...r, ...Array.from({ length: Math.min(m, MAX_ROLLS - r.length) }, () => Math.floor(Math.random() * 36))]));
  const usesS = ev === "sum" || ev === "atLeast";

  return (
    <Figure
      title={tx(t, "figDice_title", "Two dice: counting and rolling")}
      head={<Choice value={ev} onChange={setEv} options={[
        ["sum", tx(t, "figDice_sum", "sum = s")],
        ["atLeast", tx(t, "figDice_atLeast", "sum ≥ s")],
        ["doubles", tx(t, "figDice_doubles", "doubles")],
        ["six", tx(t, "figDice_six", "at least one 6")],
        ["even", tx(t, "figDice_even", "first die even")],
      ]} />}
      controls={<>
        {usesS && <Slider label="s" value={s} min={2} max={12} step={1} onChange={setS} fmt={v => String(v)} />}
        <Row>
          <Btn onClick={() => roll(1)}>{tx(t, "figDice_roll1", "roll once")}</Btn>
          <Btn onClick={() => roll(10)}>+10</Btn>
          <Btn onClick={() => roll(100)}>+100</Btn>
          <Btn onClick={() => roll(1000)}>+1000</Btn>
          <Btn onClick={() => setRolls([])}>{tx(t, "figDice_reset", "reset")}</Btn>
        </Row>
        <Row>
          <Readout color={C.green}>{`P = ${favourable}/36 = ${f2(p, 3)}`}</Readout>
          <Readout color={C.amber}>{rolls.length ? `${tx(t, "figDice_freq", "frequency")} = ${hits}/${rolls.length} = ${f2(hits / rolls.length, 3)}` : tx(t, "figDice_none", "no rolls yet")}</Readout>
        </Row>
      </>}
      note={tx(t, "figDice_note", "The grid counts: every cell is one ordered outcome (first die, second die), all 36 equally likely, so the probability of an event is the number of lit cells divided by 36. The plot experiments: after a handful of rolls the frequency can be far from the probability, but as the rolls pile up it settles closer and closer to it. Probability is the value the frequency settles on.")}
    >
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
        {[1, 10, 100, 1000, 10000].map(n => <g key={`x${n}`}>
          <line x1={px(n)} x2={px(n)} y1={PY0} y2={PY1} stroke={C.grid} strokeWidth={0.6} />
          <T x={px(n)} y={PY1 + 13} anchor="middle" color={C.axis} size={8.5}>{n}</T>
        </g>)}
        <T x={PX1} y={PY1 + 26} anchor="end" color={C.axis} size={8.5}>{tx(t, "figDice_rolls", "rolls (log scale)")}</T>
        <line x1={PX0} x2={PX1} y1={py(p)} y2={py(p)} stroke={C.green} strokeWidth={1.4} strokeDasharray="6 5" />
        {d && <path d={d} fill="none" stroke={C.amber} strokeWidth={1.8} />}
      </svg>
    </Figure>
  );
}
