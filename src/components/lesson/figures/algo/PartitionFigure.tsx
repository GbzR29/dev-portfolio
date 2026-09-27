"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, mulberry32 } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Partitioning, the heart of quicksort, one step at a time.
// Lomuto: the pivot is the last element; a[lo..i−1] holds values ≤ pivot
// (green band), a[i..j−1] values > pivot (red band), a[j..hi−1] is not yet
// looked at. j scans left to right; a small value is swapped to position i.
// At the end the pivot is swapped into position i, its final place.
// Hoare: the pivot is the middle value; i walks right past values < pivot, j
// walks left past values > pivot, then the two stuck values are swapped. When
// the fingers cross, everything up to j is ≤ pivot and everything after is ≥.
// The dashed line is the pivot's height: bars under it belong on the left.

type Scheme = "lomuto" | "hoare";
type Frame = { a: number[]; i: number; j: number; kind: "start" | "le" | "gt" | "swap" | "moveI" | "moveJ" | "final" | "cross"; swap?: [number, number] };

function lomuto(input: number[]): Frame[] {
  const a = [...input], hi = a.length - 1, p = a[hi];
  const out: Frame[] = [{ a: [...a], i: 0, j: 0, kind: "start" }];
  let i = 0;
  for (let j = 0; j < hi; ++j) {
    if (a[j] <= p) {
      [a[i], a[j]] = [a[j], a[i]];
      out.push({ a: [...a], i: i + 1, j: j + 1, kind: "le", swap: i !== j ? [i, j] : undefined });
      i++;
    } else out.push({ a: [...a], i, j: j + 1, kind: "gt" });
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  out.push({ a: [...a], i, j: hi, kind: "final", swap: [i, hi] });
  return out;
}

function hoare(input: number[]): Frame[] {
  const a = [...input], p = a[Math.floor((a.length - 1) / 2)];
  const out: Frame[] = [{ a: [...a], i: -1, j: a.length, kind: "start" }];
  let i = -1, j = a.length;
  for (;;) {
    do { i++; out.push({ a: [...a], i, j, kind: "moveI" }); } while (a[i] < p);
    do { j--; out.push({ a: [...a], i, j, kind: "moveJ" }); } while (a[j] > p);
    if (i >= j) { out.push({ a: [...a], i, j, kind: "cross" }); return out; }
    [a[i], a[j]] = [a[j], a[i]];
    out.push({ a: [...a], i, j, kind: "swap", swap: [i, j] });
  }
}

function makeArray(seed: number) {
  const rnd = mulberry32(seed);
  return Array.from({ length: 10 }, () => 1 + Math.floor(rnd() * 20));
}

const W = 560, H = 214, X0 = 30, SLOT = 50, TOP = 40, BOTTOM = 178;

export function PartitionFigure({ t, initial = "lomuto" }: { t?: TrackTranslations; initial?: Scheme }) {
  const [scheme, setScheme] = useState<Scheme>(initial);
  const [seed, setSeed] = useState(11);
  const input = useMemo(() => makeArray(seed), [seed]);
  const frames = useMemo(() => (scheme === "lomuto" ? lomuto(input) : hoare(input)), [scheme, input]);
  const s = useStepper(frames.length - 1, 850, 200);
  const f = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const n = input.length, last = f === frames[frames.length - 1];
  const pivot = scheme === "lomuto" ? input[n - 1] : input[Math.floor((n - 1) / 2)];
  const swaps = frames.slice(0, frames.indexOf(f) + 1).filter(x => x.swap).length;
  const y = (v: number) => BOTTOM - ((BOTTOM - TOP) * v) / 20;

  const msg = () => {
    switch (f.kind) {
      case "start": return `${tx(t, "figPart_pivot", "pivot")} = ${pivot}`;
      case "le": return `a[${f.j - 1}] ≤ ${pivot}: ${f.swap ? tx(t, "figPart_swapIn", "swap it into the left part") : tx(t, "figPart_grow", "already in place, grow the left part")}`;
      case "gt": return `a[${f.j - 1}] > ${pivot}: ${tx(t, "figPart_leave", "leave it, it belongs on the right")}`;
      case "final": return `${tx(t, "figPart_final", "swap the pivot into its final place")}: a[${f.i}]`;
      case "moveI": return `i → ${f.i}: a[i] = ${f.a[f.i]} ${f.a[f.i] < pivot ? `< ${pivot}, ${tx(t, "figPart_keep", "keep going")}` : `≥ ${pivot}, ${tx(t, "figPart_stop", "stop")}`}`;
      case "moveJ": return `j → ${f.j}: a[j] = ${f.a[f.j]} ${f.a[f.j] > pivot ? `> ${pivot}, ${tx(t, "figPart_keep", "keep going")}` : `≤ ${pivot}, ${tx(t, "figPart_stop", "stop")}`}`;
      case "swap": return `${tx(t, "figPart_swap", "swap")} a[${f.i}] ↔ a[${f.j}]`;
      case "cross": return `${tx(t, "figPart_cross", "fingers crossed: a[0..j] ≤ pivot ≤ a[j+1..]")}, j = ${f.j}`;
    }
  };

  // Background bands (Lomuto regions, or Hoare's finished split)
  const bands: [number, number, string][] = scheme === "lomuto"
    ? [[0, f.i, C.green], [f.i, f.j, C.red]]
    : last ? [[0, f.j + 1, C.green], [f.j + 1, n, C.red]]
    : [[0, Math.max(0, f.i), C.green], [Math.min(n, f.j + 1), n, C.red]];

  return (
    <Figure
      title={tx(t, "figPart_title", "Partitioning around a pivot")}
      head={<Choice value={scheme} onChange={v => { setScheme(v); s.restart(); }} options={[["lomuto", "Lomuto"], ["hoare", "Hoare"]] as const} />}
      controls={<>
        <Row><Btn onClick={() => { setSeed(v => v + 1); s.restart(); }}>{tx(t, "figPart_new", "new array")}</Btn></Row>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.purple}>{tx(t, "figPart_pivot", "pivot")}: {pivot}</Readout>
          <Readout color={C.red}>{tx(t, "figPart_swaps", "swaps")}: {swaps}</Readout>
        </Row>
      </>}
      note={tx(t, "figPart_note", "Lomuto (pivot = last element): the green band holds values ≤ pivot, the red band values > pivot, the rest is still unknown; each step looks at one new value and at most one swap keeps the bands in order. Hoare (pivot = middle element): two fingers walk towards each other and swap the pairs that are on the wrong side; it usually needs about a third of Lomuto's swaps. Either way, one pass of n − 1 comparisons splits the array into a small part and a large part.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X0} y={18} size={10} color={last ? C.green : C.fg} bold>{msg()}</T>
        {bands.map(([a, b, col], k) => b > a && (
          <rect key={k} x={X0 + a * SLOT} y={TOP - 6} width={(b - a) * SLOT} height={BOTTOM - TOP + 6} rx={4} fill={col} fillOpacity={0.1} />
        ))}
        <line x1={X0 - 6} x2={X0 + n * SLOT + 6} y1={y(pivot)} y2={y(pivot)} stroke={C.purple} strokeDasharray="4 4" strokeWidth={1.2} />
        {f.a.map((v, k) => {
          const isPivot = scheme === "lomuto" ? (last ? k === f.i : k === n - 1) : false;
          const swapped = f.swap && (f.swap[0] === k || f.swap[1] === k);
          const active = (scheme === "lomuto" && !last && k === f.j - 1 && f.kind !== "start") || (scheme === "hoare" && (k === f.i || k === f.j));
          const col = isPivot ? C.purple : swapped ? C.red : active ? C.amber : C.sky;
          return (
            <g key={k}>
              <rect x={X0 + k * SLOT + 8} y={y(v)} width={SLOT - 16} height={BOTTOM - y(v)} rx={3} fill={col} opacity={isPivot || swapped || active ? 0.95 : 0.6} />
              <T x={X0 + k * SLOT + SLOT / 2} y={y(v) - 4} size={10} anchor="middle" color={C.fg}>{v}</T>
              <T x={X0 + k * SLOT + SLOT / 2} y={BOTTOM + 12} size={8} anchor="middle">{k}</T>
            </g>
          );
        })}
        {scheme === "lomuto" && !last && <>
          <T x={X0 + f.i * SLOT + SLOT / 2} y={BOTTOM + 26} size={9} anchor="middle" color={C.green} bold>{f.i === f.j ? "i=j" : "i"}</T>
          {f.i !== f.j && <T x={X0 + f.j * SLOT + SLOT / 2} y={BOTTOM + 26} size={9} anchor="middle" color={C.amber} bold>j</T>}
        </>}
        {scheme === "hoare" && <>
          {f.i >= 0 && f.i < n && <T x={X0 + f.i * SLOT + SLOT / 2 - (f.i === f.j ? 8 : 0)} y={BOTTOM + 26} size={9} anchor="middle" color={C.green} bold>i</T>}
          {f.j >= 0 && f.j < n && <T x={X0 + f.j * SLOT + SLOT / 2 + (f.i === f.j ? 8 : 0)} y={BOTTOM + 26} size={9} anchor="middle" color={C.red} bold>j</T>}
        </>}
      </svg>
    </Figure>
  );
}
