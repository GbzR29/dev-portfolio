"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// A dynamic-programming table being filled one cell at a time, in an order
// where every cell's inputs are already known. The cell being computed is
// amber, the cells it reads are sky blue, and the line on top is the
// recurrence with the numbers put in. Base cases are filled from the start.
// When the table is full, the cells of the reconstruction (following the
// winning choice back from the answer) turn green.
//   coins     best[v] = 1 + min over coins c ≤ v of best[v − c], coins {1, 3, 4}
//   knapsack  best[i][w] = max(best[i−1][w], vᵢ + best[i−1][w − wᵢ])
//   edit      d[i][j] = min(d[i−1][j] + 1, d[i][j−1] + 1, d[i−1][j−1] + [aᵢ ≠ bⱼ])

type Cell = [number, number];
type Table = {
  rows: string[]; cols: string[]; labelW: number;
  val: number[][]; base: boolean[][];
  order: Cell[];
  deps: (c: Cell) => Cell[];
  formula: (c: Cell) => string;
  path: Cell[];
  answer: string;
};

const INF = 1e9;
const show = (x: number) => (x >= INF ? "∞" : String(x));
const grid = <V,>(r: number, c: number, v: V) => Array.from({ length: r }, () => new Array<V>(c).fill(v));

// ── coins ─────────────────────────────────────────────────────────────────────
const COINS = [1, 3, 4], V = 10;
function coins(): Table {
  const best = [0], last = [0];
  for (let v = 1; v <= V; ++v) {
    best[v] = INF;
    for (const c of COINS) if (c <= v && best[v - c] + 1 < best[v]) { best[v] = best[v - c] + 1; last[v] = c; }
  }
  const path: Cell[] = [];
  const used: number[] = [];
  for (let v = V; v > 0; v -= last[v]) { path.push([0, v]); used.push(last[v]); }
  path.push([0, 0]);
  const fits = (v: number) => COINS.filter(c => c <= v);
  return {
    rows: ["best"], cols: Array.from({ length: V + 1 }, (_, v) => String(v)), labelW: 44,
    val: [best], base: [best.map((_, v) => v === 0)],
    order: Array.from({ length: V }, (_, i) => [0, i + 1] as Cell),
    deps: ([, v]) => fits(v).map(c => [0, v - c] as Cell),
    formula: ([, v]) => `best[${v}] = 1 + min(${fits(v).map(c => show(best[v - c])).join(", ")}) = ${best[v]}`,
    path,
    answer: `${V} = ${used.join(" + ")}`,
  };
}

// ── 0/1 knapsack ──────────────────────────────────────────────────────────────
const ITEMS = [{ w: 1, v: 60 }, { w: 2, v: 100 }, { w: 3, v: 120 }], CAP = 5;
function knapsack(): Table {
  const n = ITEMS.length;
  const best = grid(n + 1, CAP + 1, 0);
  for (let i = 1; i <= n; ++i)
    for (let w = 0; w <= CAP; ++w) {
      const { w: wi, v: vi } = ITEMS[i - 1];
      best[i][w] = best[i - 1][w];
      if (wi <= w) best[i][w] = Math.max(best[i][w], vi + best[i - 1][w - wi]);
    }
  const path: Cell[] = [];
  const taken: number[] = [];
  for (let i = n, w = CAP; i >= 0; --i) {
    path.push([i, w]);
    if (i > 0 && best[i][w] !== best[i - 1][w]) { taken.push(i); w -= ITEMS[i - 1].w; }
  }
  const order: Cell[] = [];
  for (let i = 1; i <= n; ++i) for (let w = 0; w <= CAP; ++w) order.push([i, w]);
  return {
    rows: ["—", ...ITEMS.map((it, i) => `#${i + 1} (${it.w}, $${it.v})`)],
    cols: Array.from({ length: CAP + 1 }, (_, w) => String(w)), labelW: 92,
    val: best, base: best.map((_, i) => best[0].map(() => i === 0)),
    order,
    deps: ([i, w]) => (ITEMS[i - 1].w <= w ? [[i - 1, w], [i - 1, w - ITEMS[i - 1].w]] : [[i - 1, w]]),
    formula: ([i, w]) => {
      const { w: wi, v: vi } = ITEMS[i - 1];
      return wi <= w
        ? `best[${i}][${w}] = max(${best[i - 1][w]}, ${vi} + ${best[i - 1][w - wi]}) = ${best[i][w]}`
        : `best[${i}][${w}] = best[${i - 1}][${w}] = ${best[i][w]}  (w${i} = ${wi} > ${w})`;
    },
    path,
    answer: `${taken.reverse().map(i => `#${i}`).join(" + ")} = $${best[n][CAP]}`,
  };
}

// ── edit distance ─────────────────────────────────────────────────────────────
const A = "kitten", B = "sitting";
function edit(): Table {
  const n = A.length, m = B.length;
  const d = grid(n + 1, m + 1, 0);
  for (let i = 0; i <= n; ++i) d[i][0] = i;
  for (let j = 0; j <= m; ++j) d[0][j] = j;
  const cost = (i: number, j: number) => (A[i - 1] === B[j - 1] ? 0 : 1);
  for (let i = 1; i <= n; ++i)
    for (let j = 1; j <= m; ++j)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost(i, j));
  const path: Cell[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    path.push([i, j]);
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + cost(i, j)) { --i; --j; }
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) --i;
    else --j;
  }
  path.push([0, 0]);
  const order: Cell[] = [];
  for (let r = 1; r <= n; ++r) for (let c = 1; c <= m; ++c) order.push([r, c]);
  return {
    rows: ["", ...A], cols: ["", ...B], labelW: 24,
    val: d, base: d.map((row, r) => row.map((_, c) => r === 0 || c === 0)),
    order,
    deps: ([r, c]) => [[r - 1, c - 1], [r - 1, c], [r, c - 1]],
    formula: ([r, c]) => `d[${r}][${c}]: ${A[r - 1]} ${cost(r, c) ? "≠" : "="} ${B[c - 1]} → min(${d[r - 1][c - 1]} + ${cost(r, c)}, ${d[r - 1][c]} + 1, ${d[r][c - 1]} + 1) = ${d[r][c]}`,
    path,
    answer: `${A} → ${B}: ${d[n][m]}`,
  };
}

const BUILD = { coins, knapsack, edit };
const SPEED = { coins: 1000, knapsack: 800, edit: 420 };
type Mode = keyof typeof BUILD;
const W = 560, X0 = 12, TOP = 40, CH = 28;

export function DPTableFigure({ t, initial = "coins" }: { t?: TrackTranslations; initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const tb = useMemo(() => BUILD[mode](), [mode]);
  // One step per cell, plus a last one for the reconstruction
  const s = useStepper(tb.order.length + 1, SPEED[mode], 200);
  const k = Math.min(tb.order.length + 1, Math.floor(s.raw + 1e-9));
  const done = k > tb.order.length;
  const cur = k > 0 && !done ? tb.order[k - 1] : null;
  const filled = new Set(tb.order.slice(0, k).map(([r, c]) => `${r},${c}`));
  const deps = new Set((cur ? tb.deps(cur) : []).map(([r, c]) => `${r},${c}`));
  const onPath = new Set(done ? tb.path.map(([r, c]) => `${r},${c}`) : []);

  const cols = tb.cols.length;
  const CW = Math.min(52, (W - 2 * X0 - tb.labelW) / cols);
  const gx = X0 + tb.labelW;
  const H = TOP + (tb.rows.length + 1) * CH + 14;
  const top = cur ? tb.formula(cur) : done ? `${tx(t, "figDp_answer", "answer")}: ${tb.answer}` : tx(t, "figDp_ready", "base cases filled; press play");

  return (
    <Figure
      title={tx(t, "figDp_title", "Filling a DP table")}
      head={<Choice value={mode} onChange={v => { setMode(v); s.restart(); }} options={[
        ["coins", tx(t, "figDp_coins", "fewest coins")],
        ["knapsack", tx(t, "figDp_knap", "0/1 knapsack")],
        ["edit", tx(t, "figDp_edit", "edit distance")],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout>{tx(t, "figDp_cells", "cells computed")}: {Math.min(k, tb.order.length)} / {tb.order.length}</Readout>
          {mode === "coins" && <Readout color={C.red}>{tx(t, "figDp_greedy", "greedy for 10")}: 4 + 4 + 1 + 1</Readout>}
          {done && <Readout color={C.green}>{tb.answer}</Readout>}
        </Row>
      </>}
      note={tx(t, "figDp_note", "Every cell is computed once, from cells that are already final: that is the whole trick. In the coins table best[v] looks back one coin; in the knapsack a row only reads the row above; in edit distance a cell reads its left, upper and upper-left neighbours. When the table is full, the green cells trace the choices back from the answer: the coins used, the items taken, or the edits (a diagonal step is a match or a substitution, a step down a deletion, a step right an insertion).")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X0} y={20} size={10} color={done ? C.green : C.fg} bold>{top}</T>
        {tb.cols.map((h, c) => (
          <T key={c} x={gx + c * CW + CW / 2} y={TOP + CH / 2 + 4} size={9.5} anchor="middle" color={C.sky} bold>{h}</T>
        ))}
        {tb.rows.map((label, r) => (
          <g key={r}>
            <T x={gx - 6} y={TOP + (r + 1) * CH + CH / 2 + 4} size={9} anchor="end" color={C.sky} bold>{label}</T>
            {tb.cols.map((_, c) => {
              const key = `${r},${c}`;
              const known = tb.base[r][c] || filled.has(key);
              const isCur = cur && cur[0] === r && cur[1] === c;
              const fill = isCur ? C.amber : deps.has(key) ? C.sky : onPath.has(key) ? C.green : C.bg;
              const x = gx + c * CW, y = TOP + (r + 1) * CH;
              return (
                <g key={c}>
                  <rect x={x + 1} y={y + 1} width={CW - 2} height={CH - 2} rx={3}
                    fill={fill} fillOpacity={fill === C.bg ? 1 : 0.32}
                    stroke={isCur ? C.amber : C.axis} strokeWidth={isCur ? 2 : 1} />
                  {known && <T x={x + CW / 2} y={y + CH / 2 + 4} size={10} anchor="middle"
                    color={tb.base[r][c] ? C.muted : C.fg} bold={!!isCur}>{show(tb.val[r][c])}</T>}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </Figure>
  );
}
