"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T, useRaf } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// Five loop shapes and how many times their innermost line runs. Every run is
// one cell: the column is i, the row is the inner loop's step, so a single loop
// is one row of n cells, two full nested loops are an n × n square, a loop
// whose j starts after i is a triangle, and a halving loop touches only a
// handful of cells. Press play to watch the cells light up in execution order.
// The readouts compare the measured count with its formula and show what
// happens to the count when n doubles.

type Pattern = "single" | "nested" | "tri" | "halve" | "nlog";

const CODE: Record<Pattern, string[]> = {
  single: ["for (int i = 0; i < n; ++i)", "    work();"],
  nested: ["for (int i = 0; i < n; ++i)", "    for (int j = 0; j < n; ++j)", "        work();"],
  tri:    ["for (int i = 0; i < n; ++i)", "    for (int j = i + 1; j < n; ++j)", "        work();"],
  halve:  ["for (int i = n; i > 1; i /= 2)", "    work();"],
  nlog:   ["for (int i = 0; i < n; ++i)", "    for (int j = 1; j < n; j *= 2)", "        work();"],
};

/** The (column, row) cell of every run of work(), in execution order, and the grid's row count. */
function runs(p: Pattern, n: number): { cells: [number, number][]; rows: number } {
  const cells: [number, number][] = [];
  if (p === "single") for (let i = 0; i < n; ++i) cells.push([i, 0]);
  if (p === "nested") for (let i = 0; i < n; ++i) for (let j = 0; j < n; ++j) cells.push([i, j]);
  if (p === "tri") for (let i = 0; i < n; ++i) for (let j = i + 1; j < n; ++j) cells.push([i, j]);
  if (p === "halve") for (let i = n; i > 1; i = Math.floor(i / 2)) cells.push([i - 1, 0]);
  let rows = p === "nested" || p === "tri" ? n : 1;
  if (p === "nlog") {
    for (let i = 0; i < n; ++i) { let k = 0; for (let j = 1; j < n; j *= 2) cells.push([i, k++]); }
    rows = Math.max(1, Math.ceil(Math.log2(n)));
  }
  return { cells, rows };
}
const count = (p: Pattern, n: number) => runs(p, n).cells.length;

const FORMULA: Record<Pattern, [string, string, (n: number) => number]> = {
  single: ["n", "O(n)", n => n],
  nested: ["n · n", "O(n²)", n => n * n],
  tri:    ["n(n − 1)/2", "O(n²)", n => (n * (n - 1)) / 2],
  halve:  ["⌊log₂ n⌋", "O(log n)", n => Math.floor(Math.log2(n))],
  nlog:   ["n · ⌈log₂ n⌉", "O(n log n)", n => n * Math.ceil(Math.log2(n))],
};

const W = 560, H = 236, GX = 290, GW = 256;

export function LoopCountFigure({ t }: { t?: TrackTranslations }) {
  const [pat, setPat] = useState<Pattern>("tri");
  const [n, setN] = useState(12);
  const [shown, setShown] = useState<number | null>(null);   // null = all cells shown
  const { cells, rows } = useMemo(() => runs(pat, n), [pat, n]);
  const total = cells.length;

  const ref = useRaf(shown !== null, dt => {
    setShown(k => {
      if (k === null) return null;
      const next = k + Math.max(4, total / 3.5) * dt;       // about 3.5 s for any size
      return next >= total ? null : next;
    });
  });
  const visible = shown === null ? total : Math.floor(shown);

  const cell = Math.min(GW / n, (H - 40) / Math.max(rows, 1), 40);
  const [fText, bigO, f] = FORMULA[pat];
  const ratio = count(pat, n) > 0 ? count(pat, 2 * n) / count(pat, n) : NaN;

  return (
    <Figure
      title={tx(t, "figLoops_title", "Counting how often a loop body runs")}
      head={<Choice value={pat} onChange={v => { setPat(v); setShown(null); }} options={[["single", tx(t, "figLoops_single", "one loop")], ["nested", tx(t, "figLoops_nested", "nested")], ["tri", tx(t, "figLoops_tri", "j after i")], ["halve", tx(t, "figLoops_halve", "halving")], ["nlog", tx(t, "figLoops_nlog", "n × doubling")]] as const} />}
      controls={<>
        <Row>
          <Slider label="n" value={n} min={1} max={32} step={1} onChange={v => { setN(v); setShown(null); }} fmt={v => `${v}`} />
          <Btn onClick={() => setShown(shown === null ? 0 : null)}>{shown === null ? tx(t, "figLoops_play", "▶ run it") : tx(t, "figLoops_stop", "■ show all")}</Btn>
        </Row>
        <Row>
          <Readout color={C.amber}>{tx(t, "figLoops_ran", "work() ran")}: {visible}</Readout>
          <Readout>{fText} = {f(n)}</Readout>
          <Readout color={C.green}>{bigO}</Readout>
          <Readout>{tx(t, "figLoops_double", "n → 2n multiplies the count by")} {Number.isFinite(ratio) ? ratio.toFixed(2) : "—"}</Readout>
        </Row>
      </>}
      note={{
        single: tx(t, "figLoops_noteSingle", "One pass over n items: n runs. Double n and the count doubles. This is linear time, O(n)."),
        nested: tx(t, "figLoops_noteNested", "For each of the n values of i, the inner loop runs n times: n groups of n is n · n = n². The cells fill a square. Doubling n makes the square twice as wide and twice as tall, four times the area."),
        tri: tx(t, "figLoops_noteTri", "The inner loop starts after i, so row j only has cells for i < j: a triangle, about half the square. Exactly (n − 1) + (n − 2) + … + 1 + 0 = n(n − 1)/2 runs, the arithmetic-series sum. Half of n² is still quadratic: doubling n still multiplies the count by almost 4. This is the shape of \"compare every pair once\"."),
        halve: tx(t, "figLoops_noteHalve", "i starts at n and is cut in half each time, so it visits n, n/2, n/4, … until it reaches 1: only ⌊log₂ n⌋ steps. With n = 32 that is 5; with n = a billion it would be 29. Doubling n adds just one step: that is the signature of logarithmic time."),
        nlog: tx(t, "figLoops_noteNlog", "The outer loop runs n times and the inner one doubles j, so it runs ⌈log₂ n⌉ times: n thin columns of logarithmic height. n log n grows only slightly faster than n: doubling n a little more than doubles the count. The fastest general sorting algorithms land here."),
      }[pat]}
    >
      <div ref={ref}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {CODE[pat].map((line, k) => (
            <T key={k} x={14} y={30 + k * 18} size={10} color={k === CODE[pat].length - 1 ? C.amber : C.fg}>{line.replace(/^ +/, m => " ".repeat(m.length))}</T>
          ))}
          <T x={14} y={H - 20} size={9}>{tx(t, "figLoops_axes", "each cell = one run of work()")}</T>
          <T x={14} y={H - 6} size={9}>{tx(t, "figLoops_axes2", "column = i, row = inner step")}</T>
          {Array.from({ length: rows }, (_, r) => Array.from({ length: n }, (_, c) => (
            <rect key={`${c}-${r}`} x={GX + c * cell} y={20 + r * cell} width={Math.max(1, cell - 1.5)} height={Math.max(1, cell - 1.5)}
              fill="var(--code-surface)" stroke="var(--code-border)" strokeWidth={0.5} />
          )))}
          {cells.slice(0, visible).map(([c, r], k) => (
            <rect key={k} x={GX + c * cell} y={20 + r * cell} width={Math.max(1, cell - 1.5)} height={Math.max(1, cell - 1.5)}
              fill={k === visible - 1 && shown !== null ? C.red : C.amber} fillOpacity={0.85} />
          ))}
          <T x={GX} y={14} size={8.5}>{`i = 0 … ${n - 1}  →`}</T>
        </svg>
      </div>
    </Figure>
  );
}
