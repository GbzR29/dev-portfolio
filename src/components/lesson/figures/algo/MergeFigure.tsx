"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, mulberry32 } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Merging two sorted runs L and R into one sorted output: one finger on the
// front of each run, compare the two front values, copy the smaller one out
// and move that finger. When one run is empty the rest of the other is copied
// without comparing. Output cells keep the colour of the run they came from;
// with "with ties" on, equal values show that the left one always goes first,
// which is what makes merge sort stable.

type Step = { from: "L" | "R"; i: number; j: number; compared: boolean };

function runs(seed: number, ties: boolean) {
  const rnd = mulberry32(seed);
  const make = (len: number) => Array.from({ length: len }, () => 1 + Math.floor(rnd() * (ties ? 6 : 40))).sort((a, b) => a - b);
  return { L: make(4), R: make(5) };
}

function mergeSteps(L: number[], R: number[]): Step[] {
  const out: Step[] = [];
  let i = 0, j = 0;
  while (i < L.length || j < R.length) {
    const both = i < L.length && j < R.length;
    const takeL = j >= R.length || (i < L.length && L[i] <= R[j]);   // ≤: ties go left
    out.push({ from: takeL ? "L" : "R", i, j, compared: both });
    if (takeL) i++; else j++;
  }
  return out;
}

const W = 560, H = 196, CW = 44, CH = 32, YIN = 54, YOUT = 138;
const LX = 24, RX = 300, OX = (W - 9 * CW) / 2;
const COL = { L: C.sky, R: C.orange };

export function MergeFigure({ t }: { t?: TrackTranslations }) {
  const [seed, setSeed] = useState(5);
  const [ties, setTies] = useState<"distinct" | "ties">("distinct");
  const { L, R } = useMemo(() => runs(seed, ties === "ties"), [seed, ties]);
  const steps = useMemo(() => mergeSteps(L, R), [L, R]);
  const s = useStepper(steps.length, 900, 250);
  const k = Math.min(steps.length, Math.floor(s.raw + 1e-9));

  const i = k < steps.length ? steps[k].i : L.length;
  const j = k < steps.length ? steps[k].j : R.length;
  const cmps = steps.slice(0, k).filter(st => st.compared).length;
  const next = k < steps.length ? steps[k] : null;

  // Output so far, with the run each value came from and its index there
  const out = steps.slice(0, k).map(st => ({ v: st.from === "L" ? L[st.i] : R[st.j], from: st.from, idx: st.from === "L" ? st.i : st.j }));

  const msg = () => {
    if (!next) return tx(t, "figMerge_done", "merged: one sorted run");
    if (!next.compared) return next.from === "L"
      ? tx(t, "figMerge_restL", "R is empty: copy the rest of L")
      : tx(t, "figMerge_restR", "L is empty: copy the rest of R");
    const a = L[next.i], b = R[next.j];
    return next.from === "L"
      ? `L[${next.i}] = ${a} ≤ R[${next.j}] = ${b}: ${tx(t, "figMerge_takeL", "take from L")}`
      : `L[${next.i}] = ${a} > R[${next.j}] = ${b}: ${tx(t, "figMerge_takeR", "take from R")}`;
  };

  const cells = (vals: number[], x0: number, run: "L" | "R", ptr: number) => vals.map((v, idx) => (
    <g key={`${run}${idx}`}>
      <rect x={x0 + idx * CW + 1} y={YIN} width={CW - 2} height={CH} rx={4} fill={COL[run]} fillOpacity={idx === ptr ? 0.4 : 0.12}
        stroke={idx === ptr ? COL[run] : C.axis} strokeWidth={idx === ptr ? 2 : 1} opacity={idx < ptr ? 0.3 : 1} />
      <T x={x0 + idx * CW + CW / 2} y={YIN + CH / 2 + 4} size={11} anchor="middle" color={C.fg} bold={idx === ptr}>{v}</T>
    </g>
  ));

  return (
    <Figure
      title={tx(t, "figMerge_title", "Merging two sorted runs")}
      head={<Choice value={ties} onChange={v => { setTies(v); s.restart(); }} options={[["distinct", tx(t, "figMerge_distinct", "distinct")], ["ties", tx(t, "figMerge_ties", "with ties")]] as const} />}
      controls={<>
        <Row><Btn onClick={() => { setSeed(v => v + 1); s.restart(); }}>{tx(t, "figMerge_new", "new runs")}</Btn></Row>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.amber}>{tx(t, "figMerge_cmps", "comparisons")}: {cmps}</Readout>
          <Readout>{tx(t, "figMerge_max", "at most")} n − 1 = {L.length + R.length - 1}</Readout>
          <Readout>{tx(t, "figMerge_writes", "writes")}: {k} / {L.length + R.length}</Readout>
        </Row>
      </>}
      note={tx(t, "figMerge_note", "Both runs are already sorted, so the smallest value not yet used is always at the front of one of them: compare the two fronts, copy the smaller, advance that finger. Every comparison places one value, and the last value is placed without any, so merging n values costs at most n − 1 comparisons and exactly n writes. With ties, the value from L goes first (the test is ≤, not <), so equal values keep their original order.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={LX} y={20} size={10} color={next ? C.fg : C.green} bold>{msg()}</T>
        <T x={LX} y={YIN - 8} size={9} color={COL.L} bold>L</T>
        <T x={RX} y={YIN - 8} size={9} color={COL.R} bold>R</T>
        {cells(L, LX, "L", i)}
        {cells(R, RX, "R", j)}
        {i < L.length && <T x={LX + i * CW + CW / 2} y={YIN + CH + 13} size={9} anchor="middle" color={COL.L} bold>i</T>}
        {j < R.length && <T x={RX + j * CW + CW / 2} y={YIN + CH + 13} size={9} anchor="middle" color={COL.R} bold>j</T>}
        <T x={OX} y={YOUT - 8} size={9} color={C.fg} bold>{tx(t, "figMerge_out", "output")}</T>
        {Array.from({ length: L.length + R.length }, (_, idx) => {
          const o = out[idx];
          return (
            <g key={idx}>
              <rect x={OX + idx * CW + 1} y={YOUT} width={CW - 2} height={CH} rx={4} fill={o ? COL[o.from] : C.bg} fillOpacity={o ? 0.3 : 1}
                stroke={idx === k ? C.fg : C.axis} strokeDasharray={o ? undefined : "3 3"} />
              {o && <T x={OX + idx * CW + CW / 2} y={YOUT + CH / 2 + 4} size={11} anchor="middle" color={C.fg}>{o.v}</T>}
              {o && ties === "ties" && <T x={OX + idx * CW + CW - 4} y={YOUT + CH - 4} size={7} anchor="end" color={COL[o.from]}>{o.from}{o.idx}</T>}
              <T x={OX + idx * CW + CW / 2} y={YOUT + CH + 12} size={8} anchor="middle">{idx}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
