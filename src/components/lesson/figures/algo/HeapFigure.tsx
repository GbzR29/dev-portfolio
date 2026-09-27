"use client";

import { useEffect, useState, type ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// A binary max-heap stored in a plain array. The tree on top is only a way
// of reading the array: index i has children 2i + 1 and 2i + 2 and parent
// (i − 1) / 2. Every parent is ≥ its children, so the maximum is a[0].
// push appends and sifts up; pop moves the last element to the root and
// sifts down; build turns a random array into a heap from the last parent
// backwards; heapsort builds, then repeatedly swaps the root to the end.
// Each operation plays as a sequence of comparisons and swaps; cells that
// are already sorted (heapsort) are green and no longer part of the heap.

type Frame = { a: number[]; n: number; hi: number[]; swap: boolean; msg: string };
type Tx = (key: string, en: string) => string;

function siftDown(a: number[], n: number, i: number, out: Frame[], say: Tx) {
  for (;;) {
    const l = 2 * i + 1, r = l + 1;
    let big = i;
    if (l < n && a[l] > a[big]) big = l;
    if (r < n && a[r] > a[big]) big = r;
    const kids = [l, r].filter(c => c < n);
    if (big === i) { out.push({ a: [...a], n, hi: [i, ...kids], swap: false, msg: `${a[i]} ${say("figHeap_okDown", "is ≥ its children: stop")}` }); return; }
    out.push({ a: [...a], n, hi: [i, ...kids], swap: false, msg: `${a[i]} < ${a[big]}: ${say("figHeap_bigger", "swap with the bigger child")}` });
    [a[i], a[big]] = [a[big], a[i]];
    out.push({ a: [...a], n, hi: [i, big], swap: true, msg: say("figHeap_swapped", "swapped; continue one level down") });
    i = big;
  }
}

function siftUp(a: number[], i: number, out: Frame[], say: Tx) {
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (a[p] >= a[i]) { out.push({ a: [...a], n: a.length, hi: [i, p], swap: false, msg: `${a[p]} ≥ ${a[i]}: ${say("figHeap_okUp", "parent is bigger, stop")}` }); return; }
    [a[i], a[p]] = [a[p], a[i]];
    out.push({ a: [...a], n: a.length, hi: [p, i], swap: true, msg: `${say("figHeap_up", "bigger than its parent: swap up")}` });
    i = p;
  }
  out.push({ a: [...a], n: a.length, hi: [0], swap: false, msg: say("figHeap_root", "reached the root") });
}

type Op = "push" | "pop" | "build" | "sort";
function run(op: Op, base: number[], say: Tx): Frame[] {
  const a = [...base], out: Frame[] = [];
  if (op === "push") {
    let v = 0;
    do v = 1 + Math.floor(Math.random() * 99); while (a.includes(v));
    a.push(v);
    out.push({ a: [...a], n: a.length, hi: [a.length - 1], swap: false, msg: `push ${v}: ${say("figHeap_append", "append at the end")}` });
    siftUp(a, a.length - 1, out, say);
  } else if (op === "pop") {
    const n = a.length;
    out.push({ a: [...a], n, hi: [0], swap: false, msg: `pop: ${say("figHeap_max", "the maximum is")} ${a[0]}` });
    a[0] = a[n - 1]; a.pop();
    out.push({ a: [...a], n: n - 1, hi: [0], swap: true, msg: say("figHeap_lastToRoot", "move the last element to the root") });
    siftDown(a, a.length, 0, out, say);
  } else {
    if (op === "build" || a.length < 2) {
      a.length = 0;
      while (a.length < 12) { const v = 1 + Math.floor(Math.random() * 99); if (!a.includes(v)) a.push(v); }
    }
    out.push({ a: [...a], n: a.length, hi: [], swap: false, msg: say("figHeap_random", "any array; now heapify from the last parent back to the root") });
    for (let i = (a.length >> 1) - 1; i >= 0; --i) siftDown(a, a.length, i, out, say);
    if (op === "sort") {
      for (let n = a.length - 1; n > 0; --n) {
        [a[0], a[n]] = [a[n], a[0]];
        out.push({ a: [...a], n, hi: [0, n], swap: true, msg: `${say("figHeap_sortSwap", "swap the maximum to the end; it is final:")} ${a[n]}` });
        siftDown(a, n, 0, out, say);
      }
      out.push({ a: [...a], n: 0, hi: [], swap: false, msg: say("figHeap_sorted", "sorted, in place, with no extra array") });
      return out;
    }
  }
  out.push({ ...out[out.length - 1], hi: [], swap: false, msg: say("figHeap_done", "every parent ≥ its children again") });
  return out;
}

const W = 560, CW = 34;
const nodePos = (i: number) => {
  const lvl = Math.floor(Math.log2(i + 1)), first = 2 ** lvl - 1;
  return { x: (W * ((i - first) + 0.5)) / 2 ** lvl, y: 26 + lvl * 42 };
};

export function HeapFigure({ t }: { t?: TrackTranslations }) {
  const say = (key: string, en: string) => tx(t, key, en);
  const [frames, setFrames] = useState<Frame[]>(() => {
    const a = [90, 72, 65, 40, 58, 30, 12, 8, 25];
    return [{ a, n: a.length, hi: [], swap: false, msg: say("figHeap_start", "a max-heap: every parent ≥ its children") }];
  });
  const [id, setId] = useState(0);
  const cur = frames[frames.length - 1];
  const heapN = cur.n === 0 ? cur.a.length : cur.n;   // after heapsort: start again from the sorted array
  const heap = cur.n === 0 ? [...cur.a].reverse() : cur.a.slice(0, cur.n);
  const go = (op: Op) => { setFrames(run(op, op === "sort" ? cur.a.slice(0, heapN) : heap, say)); setId(id + 1); };
  const buttons = <Row>
    <Btn onClick={() => heap.length < 15 && go("push")}>push</Btn>
    <Btn onClick={() => heap.length > 0 && go("pop")}>pop</Btn>
    <Btn onClick={() => go("build")}>{tx(t, "figHeap_build", "build from random")}</Btn>
    <Btn onClick={() => go("sort")}>heapsort</Btn>
  </Row>;
  return <HeapRun key={id} t={t} frames={frames} buttons={buttons} auto={id > 0} />;
}

function HeapRun({ t, frames, buttons, auto }: { t?: TrackTranslations; frames: Frame[]; buttons: ReactNode; auto: boolean }) {
  const s = useStepper(frames.length - 1, 650, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (auto && frames.length > 1) s.play(); }, []);
  const f = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const hiColor = f.swap ? C.pink : C.amber;
  const x0 = (W - f.a.length * CW) / 2;
  const levels = f.n > 0 ? Math.floor(Math.log2(f.n)) + 1 : 0;

  return (
    <Figure title={tx(t, "figHeap_title", "A heap lives in an array")}
      controls={<>
        {buttons}
        {frames.length > 1 && <StepperControls s={s} />}
        <Row>
          <Readout>{tx(t, "figHeap_size", "heap size")} = {f.n}</Readout>
          {f.n > 0 && <Readout color={C.green}>max = a[0] = {f.a[0]}</Readout>}
          <Readout>{tx(t, "figHeap_levels", "levels")} = {levels}</Readout>
        </Row>
      </>}
      note={tx(t, "figHeap_note", "The tree is never stored: parent and children are found by arithmetic on indices, and a complete tree has no gaps in the array. push and pop move one element along a single root-to-leaf path, at most ⌊log₂ n⌋ swaps. Building from scratch sifts down from the last parent backwards and costs only O(n); heapsort then takes the root n − 1 times, O(n log n) in place.")}>
      <svg viewBox={`0 0 ${W} 250`} className="w-full h-auto" role="img">
        <T x={16} y={12} size={10} color={C.fg} bold>{f.msg}</T>
        {f.a.map((_, i) => i > 0 && i < f.n && (() => {
          const a = nodePos(i), b = nodePos((i - 1) >> 1);
          return <line key={"e" + i} x1={a.x} y1={a.y + 10} x2={b.x} y2={b.y + 10} stroke={C.axis} strokeWidth={1.5} />;
        })())}
        {f.a.map((v, i) => {
          if (i >= f.n) return null;
          const p = nodePos(i), hot = f.hi.includes(i);
          return <g key={"n" + i}>
            <circle cx={p.x} cy={p.y + 10} r={13} fill={C.bg} />
            <circle cx={p.x} cy={p.y + 10} r={13} fill={hot ? hiColor : C.sky} fillOpacity={hot ? 0.45 : 0.25} stroke={hot ? hiColor : C.sky} strokeWidth={hot ? 2 : 1} />
            <T x={p.x} y={p.y + 14} size={10.5} anchor="middle" color={C.fg} bold>{v}</T>
          </g>;
        })}
        {f.a.map((v, i) => {
          const hot = f.hi.includes(i), sorted = i >= f.n;
          const col = hot ? hiColor : sorted ? C.green : C.sky;
          return <g key={"c" + i}>
            <rect x={x0 + i * CW} y={200} width={CW - 3} height={26} rx={3} fill={col} fillOpacity={hot || sorted ? 0.4 : 0.18} stroke={col} />
            <T x={x0 + i * CW + (CW - 3) / 2} y={218} size={11} anchor="middle" color={C.fg} bold>{v}</T>
            <T x={x0 + i * CW + (CW - 3) / 2} y={240} size={8} anchor="middle">{i}</T>
          </g>;
        })}
      </svg>
    </Figure>
  );
}
