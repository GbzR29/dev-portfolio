"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";
import { traceSort, makeInput, moveKind, type Frame, type InputKind, type Mark, type SortAlgo } from "./sortTrace";

// ── What this figure shows ────────────────────────────────────────────────────
// A sorting algorithm played back one comparison, swap or write at a time.
// Each bar is one element; its height is its value. Amber bars are being
// compared, red ones swapped, orange ones written (merge sort), purple is the
// pivot (quicksort), pink the key or current minimum, green bars are in their
// final place. The shaded band is the part of the array being worked on. The
// counters show how the work grows, and the input menu shows how it depends on
// the order the data arrives in.

const MARK_COLOR: Record<Mark, string> = { cmp: C.amber, swap: C.red, write: C.orange, pivot: C.purple, key: C.pink };
const W = 560, H = 214, TOP = 34, BOTTOM = 190, X0 = 12, X1 = 548;

export function SortFigure({ t, algos, initial }: { t?: TrackTranslations; algos: SortAlgo[]; initial?: SortAlgo }) {
  const [algo, setAlgo] = useState<SortAlgo>(initial ?? algos[0]);
  const [kind, setKind] = useState<InputKind>("random");
  const [n, setN] = useState(12);
  const [seed, setSeed] = useState(3);
  const frames = useMemo(() => traceSort(algo, makeInput(kind, n, seed), seed), [algo, kind, n, seed]);
  const steps = frames.length - 1;
  const s = useStepper(steps, Math.max(45, Math.min(650, 9000 / steps)), 0);
  const f: Frame = frames[Math.min(steps, Math.floor(s.raw + 1e-9))];

  const names: Record<SortAlgo, string> = {
    bubble: tx(t, "figSort_bubble", "bubble"),
    insertion: tx(t, "figSort_insertion", "insertion"),
    selection: tx(t, "figSort_selection", "selection"),
    merge: tx(t, "figSort_merge", "merge"),
    quick: tx(t, "figSort_quick", "quick (last pivot)"),
    "quick-random": tx(t, "figSort_quickRand", "quick (random pivot)"),
  };
  const moves = { swaps: tx(t, "figSort_swaps", "swaps"), shifts: tx(t, "figSort_shifts", "shifts"), writes: tx(t, "figSort_writes", "writes") }[moveKind(algo)];

  const msg = () => {
    const [x, y] = f.args;
    switch (f.kind) {
      case "start": return tx(t, "figSort_mStart", "press play, or step with ⟩");
      case "cmp": return `${tx(t, "figSort_mCmp", "compare")} a[${x}] = ${f.a[x]}  ${tx(t, "figSort_mWith", "with")}  a[${y}] = ${f.a[y]}`;
      case "swap": return `${tx(t, "figSort_mSwap", "swap")} a[${x}] ↔ a[${y}]`;
      case "min": return `${tx(t, "figSort_mMin", "new minimum")}: a[${x}] = ${f.a[x]}`;
      case "write": return `${tx(t, "figSort_mWrite", "write")} ${f.a[x]} → a[${x}]`;
      case "split": return `${tx(t, "figSort_mMerge", "merge")} a[${x}..${y}] + a[${y + 1}..${f.args[2]}]`;
      case "pivot": return `${tx(t, "figSort_mPivot", "pivot")} = ${f.a[x]}`;
      case "placed": return `${tx(t, "figSort_mPlaced", "pivot now in its final place")}: a[${x}]`;
      case "early": return tx(t, "figSort_mEarly", "a pass with no swaps: already sorted, stop early");
      case "done": return tx(t, "figSort_mDone", "sorted");
    }
  };

  const max = Math.max(...f.a);
  const slot = (X1 - X0) / n, bw = Math.max(3, slot - (n > 20 ? 2 : 4));
  const marks = new Map(f.marks);
  const done = new Set(f.done);
  const restartWith = (fn: () => void) => { fn(); s.restart(); };

  return (
    <Figure
      title={tx(t, "figSort_title", "Sorting, step by step")}
      head={algos.length > 1 && <Choice value={algo} onChange={v => restartWith(() => setAlgo(v))} options={algos.map(k => [k, names[k]] as const)} />}
      controls={<>
        <Row>
          <Choice value={kind} onChange={v => restartWith(() => setKind(v))} options={[
            ["random", tx(t, "figSort_random", "random")],
            ["sorted", tx(t, "figSort_sorted", "sorted")],
            ["reversed", tx(t, "figSort_reversed", "reversed")],
            ["few", tx(t, "figSort_few", "few distinct")],
          ] as const} />
          <Btn onClick={() => restartWith(() => setSeed(v => v + 1))}>{tx(t, "figSort_shuffle", "new data")}</Btn>
        </Row>
        <Slider label={tx(t, "figSort_n", "elements n")} value={n} min={6} max={32} step={1} onChange={v => restartWith(() => setN(v))} fmt={v => `${v}`} />
        <StepperControls s={s} />
        <Row>
          <Readout color={C.amber}>{tx(t, "figSort_cmps", "comparisons")}: {f.cmp}</Readout>
          <Readout color={C.red}>{moves}: {f.mv}</Readout>
          <Readout>n(n − 1)/2 = {(n * (n - 1)) / 2}</Readout>
          <Readout>n·log₂n ≈ {Math.round(n * Math.log2(n))}</Readout>
        </Row>
      </>}
      note={tx(t, "figSort_note", "Amber: the two elements being compared. Red: a swap. Orange: a write (merge sort copies values back from its buffer). Purple: the pivot. Pink: the element being inserted, or the smallest found so far. Green: in its final place. Compare the counters with n(n − 1)/2 and n·log₂n, and try each input order: some algorithms barely notice it, others change completely.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X0} y={18} size={10} color={f.kind === "done" || f.kind === "early" ? C.green : C.fg} bold>{msg()}</T>
        {f.range && (
          <rect x={X0 + f.range[0] * slot} y={TOP - 4} width={(f.range[1] - f.range[0] + 1) * slot} height={BOTTOM - TOP + 8} rx={4} fill={C.grid} />
        )}
        {f.a.map((v, i) => {
          const h = ((BOTTOM - TOP - 14) * v) / max + 6;
          const m = marks.get(i);
          const color = m ? MARK_COLOR[m] : done.has(i) ? C.green : C.sky;
          const x = X0 + i * slot + (slot - bw) / 2;
          return (
            <g key={i}>
              <rect x={x} y={BOTTOM - h} width={bw} height={h} rx={2} fill={color} opacity={m || done.has(i) ? 0.95 : 0.6} />
              {n <= 16 && <T x={x + bw / 2} y={BOTTOM - h - 3} size={8.5} anchor="middle" color={C.fg}>{v}</T>}
              {n <= 16 && <T x={x + bw / 2} y={BOTTOM + 13} size={7.5} anchor="middle">{i}</T>}
            </g>
          );
        })}
        <rect x={X0} y={BOTTOM} width={X1 - X0} height={1.5} fill={C.axis} />
      </svg>
    </Figure>
  );
}
