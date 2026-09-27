"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Interval scheduling: choose as many non-overlapping intervals as possible.
// A greedy rule fixes the order in which the intervals are considered; each
// one is taken if it starts at or after the end of everything taken so far
// (half-open intervals [s, e), so touching is fine), otherwise skipped.
// "earliest finish" reaches the optimum, 4. "shortest" is fooled by the short
// intervals that straddle two longer ones (3), "earliest start" by the long
// interval that starts first and blocks everything (1).

type Iv = { s: number; e: number; name: string };
const IVS: Iv[] = [
  { s: 0, e: 23, name: "A" },
  { s: 1, e: 5, name: "B" },
  { s: 4, e: 7, name: "C" },
  { s: 6, e: 11, name: "D" },
  { s: 10, e: 13, name: "E" },
  { s: 12, e: 17, name: "F" },
  { s: 16, e: 19, name: "G" },
  { s: 18, e: 22, name: "H" },
];
const BEST = 4;
type Rule = "finish" | "short" | "start";
const KEY: Record<Rule, (v: Iv) => number> = {
  finish: v => v.e,
  short: v => v.e - v.s,
  start: v => v.s,
};

/** For each interval, in the rule's order: was it taken? */
function run(rule: Rule) {
  const order = IVS.map((_, i) => i).sort((a, b) => KEY[rule](IVS[a]) - KEY[rule](IVS[b]) || a - b);
  const taken: number[] = [];
  return order.map(i => {
    const ok = taken.every(j => IVS[i].s >= IVS[j].e || IVS[i].e <= IVS[j].s);
    if (ok) taken.push(i);
    return { i, ok };
  });
}

const W = 560, X0 = 40, X1 = 540, TOP = 40, LANE = 22, H = TOP + IVS.length * LANE + 34;
const sx = (x: number) => X0 + (x / 24) * (X1 - X0);

export function IntervalFigure({ t }: { t?: TrackTranslations }) {
  const [rule, setRule] = useState<Rule>("finish");
  const steps = useMemo(() => run(rule), [rule]);
  const s = useStepper(steps.length, 900, 300);
  const k = Math.min(steps.length, Math.floor(s.raw + 1e-9));
  const state = new Map(steps.slice(0, k).map(st => [st.i, st.ok]));
  const chosen = steps.slice(0, k).filter(st => st.ok).length;
  const cur = k > 0 ? steps[k - 1] : null;
  const rank = new Map(steps.map((st, r) => [st.i, r + 1]));

  const msg = () => {
    if (!cur) return tx(t, "figIv_start", "consider the intervals in the rule's order");
    const v = IVS[cur.i];
    return cur.ok
      ? `${v.name} [${v.s}, ${v.e}): ${tx(t, "figIv_take", "no overlap, take it")}`
      : `${v.name} [${v.s}, ${v.e}): ${tx(t, "figIv_skip", "overlaps a taken interval, skip")}`;
  };

  return (
    <Figure
      title={tx(t, "figIv_title", "Interval scheduling: which greedy rule?")}
      head={<Choice value={rule} onChange={v => { setRule(v); s.restart(); }} options={[
        ["finish", tx(t, "figIv_finish", "earliest finish")],
        ["short", tx(t, "figIv_short", "shortest")],
        ["start", tx(t, "figIv_startRule", "earliest start")],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.green}>{tx(t, "figIv_chosen", "taken")}: {chosen}</Readout>
          <Readout>{tx(t, "figIv_best", "best possible")}: {BEST}</Readout>
        </Row>
      </>}
      note={tx(t, "figIv_note", "The small number on the left of each bar is its place in the rule's order. Earliest finish always leaves the most room for what comes after, and reaches 4. Shortest takes the three short bars first, each of which overlaps two longer ones, and ends with 3; earliest start takes A first, which blocks everything else.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X0} y={20} size={10} color={cur ? (cur.ok ? C.green : C.red) : C.fg} bold>{msg()}</T>
        {Array.from({ length: 25 }, (_, x) => (
          <g key={x}>
            <line x1={sx(x)} x2={sx(x)} y1={TOP - 4} y2={H - 26} stroke={C.grid} strokeWidth={x % 6 === 0 ? 1 : 0.5} />
            {x % 3 === 0 && <T x={sx(x)} y={H - 12} size={8.5} anchor="middle">{x}</T>}
          </g>
        ))}
        {IVS.map((v, i) => {
          const st = state.get(i);
          const isCur = cur?.i === i;
          const color = st === undefined ? C.axis : st ? C.green : C.red;
          const y = TOP + i * LANE;
          return (
            <g key={i} opacity={st === false && !isCur ? 0.4 : 1}>
              <T x={X0 - 26} y={y + 12} size={8.5} color={C.muted}>{rank.get(i)}</T>
              <rect x={sx(v.s)} y={y + 2} width={sx(v.e) - sx(v.s)} height={LANE - 6} rx={4}
                fill={st === undefined ? C.bg : color} fillOpacity={st === undefined ? 1 : 0.3}
                stroke={isCur ? C.amber : color} strokeWidth={isCur ? 2 : 1} />
              <T x={sx(v.s) + 6} y={y + 14} size={9} color={C.fg} bold>{v.name}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
