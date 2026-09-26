"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, Slider, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";

// ── What this figure shows ────────────────────────────────────────────────────
// A recursive function running one event at a time. Every call pushes a frame
// on the call stack (right) and adds a node to the recursion tree (left); every
// return pops the frame and writes the returned value under the node. The line
// at the bottom says what the current event does. Factorial makes a single
// chain, Fibonacci branches and recomputes the same calls again and again, and
// fast power halves its argument so the chain is only about log₂ n deep.

type Fn = "fact" | "fib" | "pow";
type Node = { id: number; label: string; depth: number; parent: number; kids: number[]; x: number; value?: number; why?: string };
type Ev = { kind: "call" | "ret"; id: number };

function build(fn: Fn, n: number) {
  const nodes: Node[] = [];
  const evs: Ev[] = [];
  const call = (arg: number, depth: number, parent: number): number => {
    const id = nodes.length;
    nodes.push({ id, label: fn === "pow" ? `pow(2, ${arg})` : `${fn}(${arg})`, depth, parent, kids: [], x: 0 });
    if (parent >= 0) nodes[parent].kids.push(id);
    evs.push({ kind: "call", id });
    let v: number, why: string;
    if (fn === "fact") {
      if (arg <= 1) { v = 1; why = "n ≤ 1: base case, return 1"; }
      else { const s = call(arg - 1, depth + 1, id); v = arg * s; why = `${arg} × ${s} = ${v}`; }
    } else if (fn === "fib") {
      if (arg < 2) { v = arg; why = `n < 2: base case, return ${arg}`; }
      else { const a = call(arg - 1, depth + 1, id), b = call(arg - 2, depth + 1, id); v = a + b; why = `${a} + ${b} = ${v}`; }
    } else {
      if (arg === 0) { v = 1; why = "n = 0: base case, return 1"; }
      else {
        const h = call(Math.floor(arg / 2), depth + 1, id);
        v = arg % 2 === 0 ? h * h : 2 * h * h;
        why = arg % 2 === 0 ? `n even: ${h} × ${h} = ${v}` : `n odd: 2 × ${h} × ${h} = ${v}`;
      }
    }
    nodes[id].value = v; nodes[id].why = why;
    evs.push({ kind: "ret", id });
    return v;
  };
  call(n, 0, -1);
  // Layout: leaves get consecutive slots, parents sit over the middle of their children
  let slot = 0;
  const place = (id: number): number => {
    const nd = nodes[id];
    nd.x = nd.kids.length === 0 ? slot++ : nd.kids.map(place).reduce((a, b) => a + b, 0) / nd.kids.length;
    return nd.x;
  };
  place(0);
  return { nodes, evs, leaves: slot, depth: Math.max(...nodes.map(d => d.depth)) + 1 };
}

const W = 560, H = 272, TREE_W = 370, SX = 392;
const RANGE: Record<Fn, [number, number, number]> = { fact: [1, 7, 4], fib: [1, 5, 4], pow: [0, 32, 10] };

export function CallStackFigure({ t }: { t?: TrackTranslations }) {
  const [fn, setFn] = useState<Fn>("fact");
  const [args, setArgs] = useState<Record<Fn, number>>({ fact: 4, fib: 4, pow: 10 });
  const n = args[fn];
  const { nodes, evs, leaves, depth } = useMemo(() => build(fn, n), [fn, n]);
  const s = useStepper(evs.length, 900, 250);

  const k = Math.min(evs.length, Math.floor(s.raw + 1e-9));     // events applied so far
  const called = new Set<number>(), returned = new Set<number>();
  evs.slice(0, k).forEach(e => (e.kind === "call" ? called : returned).add(e.id));
  const stack: number[] = [];
  evs.slice(0, k).forEach(e => { if (e.kind === "call") stack.push(e.id); else stack.pop(); });
  const last = k > 0 ? evs[k - 1] : null;
  const maxDepth = (() => { let d = 0, m = 0; evs.forEach(e => { d += e.kind === "call" ? 1 : -1; m = Math.max(m, d); }); return m; })();

  const nx = (x: number) => 14 + (leaves <= 1 ? (TREE_W - 28) / 2 : (x / (leaves - 1)) * (TREE_W - 28));
  const ny = (d: number) => 22 + d * Math.min(34, (H - 60) / Math.max(1, depth - 1));
  const frameH = Math.min(26, (H - 50) / (maxDepth + 1));

  let say = tx(t, "figStack_start", "Press play or step: main() is about to make the first call.");
  if (last) {
    const nd = nodes[last.id];
    say = last.kind === "call"
      ? `${tx(t, "figStack_call", "call")} ${nd.label}: ${tx(t, "figStack_push", "push a new frame")}`
      : `${nd.label} ${tx(t, "figStack_returns", "returns")} ${nd.value}  (${nd.why}): ${tx(t, "figStack_pop", "pop its frame")}`;
  }

  return (
    <Figure
      title={tx(t, "figStack_title", "Recursion: the call tree and the call stack")}
      head={<Choice value={fn} onChange={f => { setFn(f); s.restart(); }} options={[["fact", "factorial"], ["fib", "fibonacci"], ["pow", tx(t, "figStack_pow", "fast power")]] as const} />}
      controls={<>
        <Slider label="n" value={n} min={RANGE[fn][0]} max={RANGE[fn][1]} step={1} onChange={v => { setArgs(a => ({ ...a, [fn]: v })); s.restart(); }} fmt={v => `${v}`} />
        <StepperControls s={s} />
        <Row>
          <Readout>{tx(t, "figStack_calls", "calls")}: {nodes.length}</Readout>
          <Readout>{tx(t, "figStack_depth", "deepest stack")}: {maxDepth} {tx(t, "figStack_frames", "frames")}</Readout>
          <Readout color={C.green}>{tx(t, "figStack_result", "result")}: {returned.has(0) ? nodes[0].value : "…"}</Readout>
        </Row>
      </>}
      note={{
        fact: tx(t, "figStack_noteFact", "Factorial calls itself once, so the tree is a single chain and the stack grows to n frames before anything returns. Nothing is multiplied on the way down: each frame waits with its n until the call below it answers, and the multiplications happen on the way back up."),
        fib: tx(t, "figStack_noteFib", "Each Fibonacci call makes two calls, so the tree branches. Look how often the same call appears: with n = 5, fib(2) is computed 3 times and fib(1) 5 times. The stack never gets deeper than n frames, but the number of calls grows roughly like 1.6ⁿ. Remembering answers already computed (memoization) removes the repeats."),
        pow: tx(t, "figStack_notePow", "Fast power computes 2ⁿ from 2^(n/2) squared, so every call halves n. The chain is only ⌊log₂ n⌋ + 2 calls long: 2³² takes 7 calls instead of 32 multiplications. It is repeated squaring from the Math track, written recursively."),
      }[fn]}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {nodes.filter(d => d.parent >= 0 && called.has(d.id)).map(d => (
          <line key={`e${d.id}`} x1={nx(nodes[d.parent].x)} y1={ny(d.depth - 1) + 6} x2={nx(d.x)} y2={ny(d.depth) - 10} stroke={C.axis} />
        ))}
        {nodes.map(d => {
          if (!called.has(d.id)) return null;
          const onStack = stack.includes(d.id), top = stack[stack.length - 1] === d.id;
          const color = top ? C.amber : onStack ? C.sky : C.green;
          return <g key={d.id}>
            <T x={nx(d.x)} y={ny(d.depth)} size={leaves > 6 ? 8 : 9.5} anchor="middle" color={color} bold={top}>{d.label}</T>
            {returned.has(d.id) && <T x={nx(d.x)} y={ny(d.depth) + 11} size={8} anchor="middle" color={C.green}>{`= ${d.value}`}</T>}
          </g>;
        })}
        <line x1={SX - 12} x2={SX - 12} y1={8} y2={H - 30} stroke={C.grid} />
        <T x={SX} y={14} size={8.5}>{tx(t, "figStack_stack", "call stack (top = running)")}</T>
        {["main()", ...stack.map(id => nodes[id].label)].map((label, i, all) => {
          const y = H - 36 - (i + 1) * frameH;
          const top = i === all.length - 1 && i > 0;
          return <g key={i}>
            <rect x={SX} y={y} width={W - SX - 8} height={frameH - 3} rx={3} fill={top ? C.amber : i === 0 ? "var(--code-surface)" : C.sky} fillOpacity={i === 0 ? 1 : top ? 0.35 : 0.18} stroke={top ? C.amber : "var(--code-border)"} />
            <T x={SX + 6} y={y + frameH / 2 + 2} size={Math.min(9.5, frameH * 0.45)} color={C.fg}>{label}</T>
            {i > 0 && <T x={W - 14} y={y + frameH / 2 + 2} size={Math.min(8, frameH * 0.4)} anchor="end">{top ? tx(t, "figStack_running", "running") : tx(t, "figStack_waiting", "waiting")}</T>}
          </g>;
        })}
        <T x={10} y={H - 8} size={9.5} color={last?.kind === "ret" ? C.green : C.amber}>{say}</T>
      </svg>
    </Figure>
  );
}
