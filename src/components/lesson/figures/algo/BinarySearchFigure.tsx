"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Searching a sorted array of 16 numbers. Tap a cell to search for its value,
// or pick a value that is not there. "linear" checks the cells one by one from
// the left; "binary" keeps a range lo..hi that must contain the target if it
// is present, looks at the middle cell and throws away the half that cannot
// hold it. Cells that have been ruled out fade. Binary search never needs more
// than ⌊log₂ 16⌋ + 1 = 5 comparisons here; linear search may need 16.

const DATA = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 72, 78, 84, 91, 95, 99];
const ABSENT = [1, 50, 100];
type Probe = { lo: number; hi: number; at: number; cmp: -1 | 0 | 1 };   // cmp: sign of a[at] − target

function binary(x: number): Probe[] {
  const out: Probe[] = [];
  let lo = 0, hi = DATA.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const c = Math.sign(DATA[mid] - x) as -1 | 0 | 1;
    out.push({ lo, hi, at: mid, cmp: c });
    if (c === 0) break;
    if (c < 0) lo = mid + 1; else hi = mid - 1;
  }
  return out;
}

function linear(x: number): Probe[] {
  const out: Probe[] = [];
  for (let i = 0; i < DATA.length; ++i) {
    const c = Math.sign(DATA[i] - x) as -1 | 0 | 1;
    out.push({ lo: i, hi: DATA.length - 1, at: i, cmp: c });
    if (c === 0) break;
  }
  return out;
}

const W = 560, H = 150, X0 = 16, CW = 33, Y = 62, CH = 34;

export function BinarySearchFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<"binary" | "linear">("binary");
  const [target, setTarget] = useState(23);
  const probes = useMemo(() => (mode === "binary" ? binary(target) : linear(target)), [mode, target]);
  const s = useStepper(probes.length, 900, 250);
  const k = Math.min(probes.length, Math.floor(s.raw + 1e-9));
  const pick = (v: number) => { setTarget(v); s.restart(); };

  // The live range after k probes, and the probe just made
  const last = k > 0 ? probes[k - 1] : null;
  const found = last?.cmp === 0;
  let lo = 0, hi = DATA.length - 1;
  if (mode === "binary") {
    for (const p of probes.slice(0, k)) { if (p.cmp < 0) lo = p.at + 1; else if (p.cmp > 0) hi = p.at - 1; }
  } else if (k > 0) lo = found ? last!.at : last!.at + 1;
  const finished = k === probes.length;

  const msg = () => {
    if (!last) return `${tx(t, "figBin_search", "search for")} ${target}`;
    const v = DATA[last.at];
    if (found) return `a[${last.at}] = ${v} = ${target}: ${tx(t, "figBin_found", "found")}`;
    const rel = last.cmp < 0 ? "<" : ">";
    const tail = finished ? tx(t, "figBin_absent", "range empty: not in the array")
      : mode === "binary"
        ? (last.cmp < 0 ? tx(t, "figBin_goRight", "keep the right half") : tx(t, "figBin_goLeft", "keep the left half"))
        : tx(t, "figBin_next", "try the next cell");
    return `a[${last.at}] = ${v} ${rel} ${target}: ${tail}`;
  };

  return (
    <Figure
      title={tx(t, "figBin_title", "Linear vs binary search")}
      head={<Choice value={mode} onChange={v => { setMode(v); s.restart(); }} options={[["binary", tx(t, "figBin_binary", "binary")], ["linear", tx(t, "figBin_linear", "linear")]] as const} />}
      controls={<>
        <Row>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figBin_notThere", "values not in the array")}:</span>
          {ABSENT.map(v => <Btn key={v} active={target === v} onClick={() => pick(v)}>{v}</Btn>)}
        </Row>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.amber}>{tx(t, "figBin_cmps", "comparisons")}: {k}</Readout>
          <Readout>{mode === "binary" ? `${tx(t, "figBin_worst", "worst case")}: ⌊log₂16⌋ + 1 = 5` : `${tx(t, "figBin_worst", "worst case")}: n = 16`}</Readout>
        </Row>
      </>}
      note={tx(t, "figBin_note", "Tap any cell to search for its value. Binary search keeps lo and hi around the only part of the array where the target can still be, looks at the middle cell, and moves lo or hi past it. Each comparison halves the range, so 16 cells need at most 5 comparisons, a million at most 20. Linear search does not need sorted data, but it may have to look at every cell.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        <T x={X0} y={20} size={10} color={found ? C.green : finished ? C.red : C.fg} bold>{msg()}</T>
        {DATA.map((v, i) => {
          const alive = found ? i === last!.at : i >= lo && i <= hi;
          const probed = last && last.at === i;
          const x = X0 + i * CW;
          return (
            <g key={i} onClick={() => pick(v)} style={{ cursor: "pointer" }}>
              <rect x={x + 1} y={Y} width={CW - 2} height={CH} rx={4}
                fill={probed ? (found ? C.green : C.amber) : C.bg} fillOpacity={probed ? 0.35 : 1}
                stroke={v === target ? C.pink : C.axis} strokeWidth={v === target ? 2 : 1} opacity={alive ? 1 : 0.28} />
              <T x={x + CW / 2} y={Y + CH / 2 + 4} size={11} anchor="middle" color={C.fg} bold={probed ?? false}>{v}</T>
              <T x={x + CW / 2} y={Y + CH + 13} size={8} anchor="middle">{i}</T>
            </g>
          );
        })}
        {!found && !finished && mode === "binary" && <>
          {lo !== hi && <T x={X0 + lo * CW + CW / 2} y={Y - 8} size={9} anchor="middle" color={C.sky} bold>lo</T>}
          <T x={X0 + hi * CW + CW / 2} y={Y - 8} size={9} anchor="middle" color={C.sky} bold>{lo === hi ? "lo=hi" : "hi"}</T>
          {lo <= hi && <T x={X0 + (lo + Math.floor((hi - lo) / 2)) * CW + CW / 2} y={Y + CH + 28} size={9} anchor="middle" color={C.amber} bold>{tx(t, "figBin_midNext", "next mid")}</T>}
        </>}
        {!found && !finished && mode === "linear" && (
          <T x={X0 + lo * CW + CW / 2} y={Y - 8} size={9} anchor="middle" color={C.sky} bold>i</T>
        )}
      </svg>
    </Figure>
  );
}
