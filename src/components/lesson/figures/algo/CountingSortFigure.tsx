"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, T, mulberry32 } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// Sorting without comparing. "counting": keys are whole numbers 0..5. Pass 1
// counts how many times each key occurs; pass 2 turns the counts into running
// totals, so count[v] becomes "how many keys are ≤ v", which is one past the
// last slot for v; pass 3 walks the input from the right and drops each key
// into slot count[v] − 1. The small label under each output cell is where it
// came from: equal keys keep their order (stable). "radix": three-digit
// numbers sorted one digit at a time, ones first, each pass a stable sort by
// that digit; after the last pass the whole list is in order.

const K = 6;
const CLRS = [2, 5, 3, 0, 2, 3, 0, 3];
type CFrame = { phase: "start" | "count" | "prefix" | "place" | "done"; at: number; count: number[]; out: (number | null)[]; from: (number | null)[] };

function countingFrames(a: number[]): CFrame[] {
  const count = new Array(K).fill(0), out: (number | null)[] = a.map(() => null), from: (number | null)[] = a.map(() => null);
  const snap = (phase: CFrame["phase"], at: number): CFrame => ({ phase, at, count: [...count], out: [...out], from: [...from] });
  const frames = [snap("start", -1)];
  a.forEach((v, i) => { count[v]++; frames.push(snap("count", i)); });
  for (let v = 1; v < K; ++v) { count[v] += count[v - 1]; frames.push(snap("prefix", v)); }
  for (let i = a.length - 1; i >= 0; --i) {
    const pos = --count[a[i]];
    out[pos] = a[i]; from[pos] = i;
    frames.push(snap("place", i));
  }
  frames.push(snap("done", -1));
  return frames;
}

const RADIX = [170, 45, 75, 90, 802, 24, 2, 66];
function radixColumns(a: number[]) {
  const cols = [a];
  for (let d = 1; d <= 100; d *= 10) {
    const prev = cols[cols.length - 1];
    const digit = (x: number) => Math.floor(x / d) % 10;
    cols.push([...prev].sort((x, y) => digit(x) - digit(y)));   // Array.sort is stable
  }
  return cols;
}

const W = 560, H = 230;

export function CountingSortFigure({ t, initial = "counting" }: { t?: TrackTranslations; initial?: "counting" | "radix" }) {
  const [mode, setMode] = useState<"counting" | "radix">(initial);
  const [seed, setSeed] = useState(0);
  const input = useMemo(() => {
    if (seed === 0) return CLRS;
    const rnd = mulberry32(seed);
    return Array.from({ length: 10 }, () => Math.floor(rnd() * K));
  }, [seed]);
  const frames = useMemo(() => countingFrames(input), [input]);
  const cols = useMemo(() => radixColumns(RADIX), []);
  const steps = mode === "counting" ? frames.length - 1 : cols.length - 1;
  const s = useStepper(steps, mode === "counting" ? 800 : 1400, 250);
  const k = Math.min(steps, Math.floor(s.raw + 1e-9));
  const switchMode = (m: "counting" | "radix") => { setMode(m); s.restart(); };

  return (
    <Figure
      title={tx(t, "figCount_title", "Counting sort and radix sort")}
      head={<Choice value={mode} onChange={switchMode} options={[["counting", tx(t, "figCount_counting", "counting sort")], ["radix", tx(t, "figCount_radix", "radix sort")]] as const} />}
      controls={<>
        {mode === "counting" && <Row>
          <Btn active={seed === 0} onClick={() => { setSeed(0); s.restart(); }}>{tx(t, "figCount_example", "chapter example")}</Btn>
          <Btn onClick={() => { setSeed(v => v + 1); s.restart(); }}>{tx(t, "figCount_new", "new keys")}</Btn>
        </Row>}
        <StepperControls s={s} />
        <Row>
          {mode === "counting"
            ? <Readout>n = {input.length}, k = {K}: Θ(n + k)</Readout>
            : <Readout>{tx(t, "figCount_passes", "passes")}: {k} / 3</Readout>}
        </Row>
      </>}
      note={tx(t, "figCount_note", "Counting sort never compares two keys: it uses each key as an index into the count array. Its cost is Θ(n + k), which beats n log n when the range of keys k is small. The running totals tell each key exactly where its block ends, and filling from the right keeps equal keys in their original order. Radix sort applies a stable sort to one digit at a time, least significant first; because each pass is stable, ties on the current digit keep the order set by the earlier digits.")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {mode === "counting" ? <CountingView t={t} a={input} f={frames[k]} /> : <RadixView t={t} cols={cols} k={k} />}
      </svg>
    </Figure>
  );
}

function CountingView({ t, a, f }: { t?: TrackTranslations; a: number[]; f: CFrame }) {
  const CW = 40, x0 = (W - a.length * CW) / 2, kx0 = (W - K * CW) / 2;
  const msg = {
    start: tx(t, "figCount_mStart", "keys 0..5: count, add up, place"),
    count: `${tx(t, "figCount_mCount", "pass 1: count")} a[${f.at}] = ${a[f.at]}  →  count[${a[f.at]}]++`,
    prefix: `${tx(t, "figCount_mPrefix", "pass 2: running total")}  count[${f.at}] += count[${f.at - 1}]`,
    place: `${tx(t, "figCount_mPlace", "pass 3: place")} a[${f.at}] = ${a[f.at]}  →  out[${f.count[a[f.at]]}]`,
    done: tx(t, "figCount_mDone", "sorted, and equal keys kept their order"),
  }[f.phase];
  const box = (x: number, y: number, v: number | null, hl: string | null, key: string, sub?: string) => (
    <g key={key}>
      <rect x={x + 1} y={y} width={CW - 2} height={28} rx={4} fill={hl ?? C.bg} fillOpacity={hl ? 0.35 : 1} stroke={hl ?? C.axis} strokeDasharray={v === null ? "3 3" : undefined} />
      {v !== null && <T x={x + CW / 2} y={y + 18} size={11} anchor="middle" color={C.fg}>{v}</T>}
      {sub && <T x={x + CW - 4} y={y + 26} size={6.5} anchor="end">{sub}</T>}
    </g>
  );
  const keyActive = f.phase === "count" || f.phase === "place" ? a[f.at] : f.phase === "prefix" ? f.at : -1;
  return <>
    <T x={16} y={18} size={10} color={f.phase === "done" ? C.green : C.fg} bold>{msg}</T>
    <T x={16} y={52} size={9} bold color={C.fg}>{tx(t, "figCount_in", "input")}</T>
    {a.map((v, i) => box(x0 + i * CW, 36, v, i === f.at && f.phase !== "prefix" ? C.amber : null, `a${i}`))}
    <T x={16} y={116} size={9} bold color={C.fg}>count</T>
    {f.count.map((c, v) => <g key={`c${v}`}>
      {box(kx0 + v * CW, 100, c, v === keyActive ? C.purple : null, `cb${v}`)}
      <T x={kx0 + v * CW + CW / 2} y={140} size={8} anchor="middle">{v}</T>
    </g>)}
    <T x={16} y={180} size={9} bold color={C.fg}>{tx(t, "figCount_out", "output")}</T>
    {f.out.map((v, i) => box(x0 + i * CW, 164, v, v !== null && f.phase === "place" && f.from[i] === f.at ? C.green : null, `o${i}`, f.from[i] !== null ? `a${f.from[i]}` : undefined))}
    {f.out.map((_, i) => <T key={`oi${i}`} x={x0 + i * CW + CW / 2} y={204} size={8} anchor="middle">{i}</T>)}
  </>;
}

function RadixView({ t, cols, k }: { t?: TrackTranslations; cols: number[][]; k: number }) {
  const heads = [tx(t, "figCount_input", "input"), tx(t, "figCount_by1", "by ones"), tx(t, "figCount_by10", "by tens"), tx(t, "figCount_by100", "by hundreds")];
  const CX = 130, x0 = 30;
  return <>
    {cols.map((col, c) => c <= k && (
      <g key={c}>
        <T x={x0 + c * CX} y={22} size={9.5} bold color={c === k ? C.amber : C.fg}>{heads[c]}</T>
        {col.map((v, r) => {
          const s = String(v).padStart(3, "0");
          const hi = c === k && k < 3 ? 2 - k : -1;   // the digit the next pass sorts by
          return (
            <text key={r} x={x0 + c * CX} y={46 + r * 22} fontFamily="monospace" fontSize={13} fill={C.fg}>
              {s.split("").map((ch, d) => (
                <tspan key={d} fill={d === hi ? C.amber : v < 10 ** (2 - d) && d < 2 ? C.muted : C.fg} fontWeight={d === hi ? 700 : 400}>{ch}</tspan>
              ))}
            </text>
          );
        })}
        {c < 3 && c < k && <T x={x0 + c * CX + 52} y={46 + 3.5 * 22} size={14} color={C.muted}>→</T>}
      </g>
    ))}
    <T x={x0} y={H - 16} size={9} color={k === 3 ? C.green : C.muted}>
      {k === 3 ? tx(t, "figCount_rDone", "three stable passes: sorted") : tx(t, "figCount_rHint", "amber digit: the one the next pass sorts by")}
    </T>
  </>;
}
