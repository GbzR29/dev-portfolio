"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure, Readout, Row, T } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { hex, leakedBlocks, pointerState, snapshots, type Cell, type PtrState, type State } from "./memModel";
import { PROGRAMS, type ProgramId } from "./memPrograms";

// ── What this figure shows ────────────────────────────────────────────────────
// A short C program on the left, run one line at a time; its memory on the
// right. Every variable is a box in its function's stack frame, with its
// address, type and size; malloc'd blocks sit on the heap. A pointer's box
// holds an address, and an arrow goes to whatever is stored there: blue when
// that is fine, orange when it has walked past the end of its array, red when
// the memory it was taken from is gone (a returned frame or a freed block).
// Heap blocks nobody points at any more are marked as leaked. Some lines can be
// removed ("break it") to see what goes wrong without them.

const ROW = 44, HEAD = 22, GAP = 12, BOX_H = 22;
const BX = 122;                                  // x of the first value box in a stack row
const COMPACT = 8;                               // blocks with more elements are drawn as one box

type Rect = { x: number; y: number; w: number; h: number };
type Laid = {
  frames: { f: State["frames"][number]; r: Rect }[];
  blocks: { b: State["heap"][number]; r: Rect; compact: boolean }[];
  boxes: Map<string, Rect[]>;                    // cell key → one rect per element (one for compact blocks)
  height: number;
  W: number;
};

const boxW = (c: Cell) => (c.vals.length === 1 ? 84 : c.elem === 1 ? 26 : 40);

function layout(s: State, narrow: boolean): Laid {
  const W = narrow ? 330 : 600;
  const boxes = new Map<string, Rect[]>();
  const row = (c: Cell, x: number, y: number) => {
    const w = boxW(c);
    boxes.set(c.key, c.vals.map((_, i) => ({ x: x + i * w, y, w, h: BOX_H })));
  };

  let y = 28;
  const frames = s.frames.map(f => {
    const top = y;
    f.cells.forEach((c, i) => row(c, 12 + BX, top + HEAD + i * ROW + 16));
    y = top + HEAD + f.cells.length * ROW + 8;
    const r = { x: 8, y: top, w: 316, h: y - top };
    y += GAP;
    return { f, r };
  });

  let hy = narrow ? y + 26 : 28;
  const hx = narrow ? 8 : 352;
  const blocks = s.heap.map(b => {
    const compact = b.vals.length > COMPACT;
    const r = { x: hx, y: hy, w: narrow ? 316 : 240, h: 58 };
    if (compact) boxes.set(b.key, [{ x: hx + 10, y: hy + 28, w: 120, h: BOX_H }]);
    else row(b, hx + 10, hy + 28);
    hy += r.h + GAP;
    return { b, r, compact };
  });

  return { frames, blocks, boxes, height: Math.max(y, hy) + 6, W };
}

// ── Arrows ────────────────────────────────────────────────────────────────────

const COLOR: Record<PtrState, string> = { ok: C.sky, null: C.muted, uninit: C.muted, dangling: C.red, outside: C.orange, end: C.orange };

function arrowPath(from: Rect, to: Rect, toHeap: boolean, narrow: boolean, past: boolean) {
  const sx = from.x + from.w, sy = from.y + from.h / 2;
  let ex: number, ey: number, c1: [number, number], c2: [number, number];
  if (past) {                                    // one past the last element: point at the gap after it
    ex = to.x + to.w + 4; ey = to.y - 2;
    c1 = [sx + 50, sy]; c2 = [ex + 10, ey - 30];
  } else if (toHeap && !narrow) {
    ex = to.x; ey = to.y + to.h / 2;
    c1 = [sx + 60, sy]; c2 = [ex - 60, ey];
  } else if (toHeap) {
    ex = to.x + to.w / 2; ey = to.y;
    c1 = [sx + 70, sy]; c2 = [ex, ey - 50];
  } else if (to.w === 84) {                      // a single stack box: come in from the right
    ex = to.x + to.w; ey = to.y + to.h / 2;
    c1 = [sx + 45, sy]; c2 = [ex + 45, ey];
  } else {                                       // an element of a stack array: from above or below
    const above = sy < to.y;
    ex = to.x + to.w / 2; ey = above ? to.y : to.y + to.h;
    c1 = [sx + 45, sy]; c2 = [ex, above ? ey - 30 : ey + 30];
  }
  // Arrow head along the last control → end direction
  const dx = ex - c2[0], dy = ey - c2[1], len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, h = 6;
  const head = `${ex},${ey} ${ex - ux * h - uy * h * 0.5},${ey - uy * h + ux * h * 0.5} ${ex - ux * h + uy * h * 0.5},${ey - uy * h - ux * h * 0.5}`;
  const d = `M${sx},${sy} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${ex - ux * h * 0.7},${ey - uy * h * 0.7}`;
  return { d, head };
}

// ── Width of the figure body, to pick the layout ──────────────────────────────

function useWidth<E extends HTMLElement>() {
  const ref = useRef<E>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// ── Figure ────────────────────────────────────────────────────────────────────

export function MemoryBoxFigure({ t, programs }: { t?: TrackTranslations; programs: ProgramId[] }) {
  const [pid, setPid] = useState<ProgramId>(programs[0]);
  const [removedBy, setRemovedBy] = useState<Partial<Record<ProgramId, number[]>>>({});
  const [bodyRef, bodyW] = useWidth<HTMLDivElement>();
  const side = bodyW >= 980;                       // code beside the memory only when both fit at full size
  const narrow = bodyW > 0 && bodyW < 520;         // phone: heap drawn under the stack
  const prog = PROGRAMS[pid];
  const removed = useMemo(() => new Set(removedBy[pid] ?? []), [removedBy, pid]);
  const snaps = useMemo(() => snapshots(prog, removed), [prog, removed]);
  const s = useStepper(snaps.length - 1, 900, 500);
  const k = Math.max(0, Math.min(snaps.length - 1, Math.floor(s.raw + 1e-9)));
  const snap = snaps[k];
  const st = snap.state;

  // One fixed height per program, so the drawing does not jump while stepping
  const height = useMemo(() => Math.max(...snaps.map(x => layout(x.state, narrow).height)), [snaps, narrow]);
  const L = layout(st, narrow);
  const leaked = leakedBlocks(st);
  const cutLines = new Map(prog.steps.map((x, i) => [x, i] as const).filter(([x]) => x.cut).map(([x, i]) => [x.line, i]));

  const pointers = [...st.frames.flatMap(f => f.cells), ...st.heap].filter(c => c.pointee !== undefined);
  const states = new Map(pointers.map(c => [c.key, pointerState(st, c)]));
  const dangling = [...states.values()].filter(p => p.state === "dangling" || p.state === "outside").length;
  const inUse = st.heap.filter(b => !b.freed).reduce((n, b) => n + b.bytes, 0);
  const leakBytes = leaked.reduce((n, b) => n + b.bytes, 0);

  const toggleCut = (i: number) => {
    const cur = removedBy[pid] ?? [];
    setRemovedBy({ ...removedBy, [pid]: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i] });
    s.restart();
  };
  const choose = (id: ProgramId) => { setPid(id); s.restart(); };

  const valueText = (c: Cell, i: number) => {
    if (c.pointee !== undefined) return c.ptr === undefined ? "?" : c.ptr === null ? "NULL" : hex(c.ptr.addr);
    return c.vals[i] ?? "?";
  };

  const drawCell = (c: Cell, inHeap: boolean, compact = false) => {
    const rects = L.boxes.get(c.key) ?? [];
    const ps = states.get(c.key);
    return rects.map((r, i) => {
      const hot = snap.touched.has(`${c.key}:${i}`) || (compact && [...snap.touched].some(x => x.startsWith(c.key + ":")));
      const garbage = c.pointee !== undefined ? c.ptr === undefined : c.vals[i] === null;
      const text = compact ? `${(c as State["heap"][number]).bytes} B` : valueText(c, i);
      return (
        <g key={i}>
          {c.vals.length > 1 && !compact && (
            <T x={r.x + r.w / 2} y={r.y - 3} size={7.5} anchor="middle">{c.labels?.[i] ?? `[${i}]`}</T>
          )}
          <rect x={r.x + 0.5} y={r.y} width={r.w - 1} height={r.h} rx={3}
            fill="var(--code-surface)"
            stroke={hot ? C.amber : ps && ps.state !== "ok" && ps.state !== "null" && ps.state !== "uninit" ? COLOR[ps.state] : ps ? C.sky : "var(--code-border)"}
            strokeWidth={hot ? 2 : 1} />
          <T x={r.x + r.w / 2} y={r.y + 15} size={c.pointee !== undefined ? 9.5 : 10.5} anchor="middle"
            color={garbage ? C.muted : C.fg} bold={hot}>{text}</T>
          {inHeap && compact && <T x={r.x + r.w + 6} y={r.y + 15} size={8}>{`${c.vals.length} × ${c.type}`}</T>}
        </g>
      );
    });
  };

  // What the last line did, and what the program has printed so far
  const explain = <>
    <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">
      {tx(t, snap.key, snap.en)}
    </p>
    <div className="font-mono text-[11px] text-[var(--text-muted)]">
      <span className="uppercase tracking-wider mr-2">{tx(t, "figCMem_output", "output")}</span>
      <span className="text-[var(--text-main)] whitespace-pre">{st.out.trimEnd() || "—"}</span>
    </div>
  </>;

  return (
    <Figure
      title={tx(t, "figCMem_title", "Memory, line by line: stack, heap and pointers")}
      head={programs.length > 1 ? (
        <Choice value={pid} onChange={choose}
          options={programs.map(id => [id, tx(t, `figCMem_name_${id}`, NAMES[id])] as [ProgramId, string])} />
      ) : undefined}
      controls={<>
        <Row>
          <Readout>{tx(t, "figCMem_frames", "stack frames")}: {st.frames.filter(f => !f.dead).length}</Readout>
          <Readout>{tx(t, "figCMem_inUse", "heap in use")}: {inUse} B</Readout>
          <Readout color={leakBytes ? C.red : undefined}>{tx(t, "figCMem_leaked", "leaked")}: {leakBytes} B</Readout>
          <Readout color={dangling ? C.red : undefined}>{tx(t, "figCMem_bad", "bad pointers")}: {dangling}</Readout>
        </Row>
      </>}
      note={cutLines.size > 0
        ? tx(t, "figCMem_breakIt", "Break it: remove a marked line in the code, play again and watch the summary. The program still compiles and runs, which is exactly why these bugs are hard to find.")
        : tx(t, "figCMem_howTo", "Step through the program with the buttons under the drawing. The highlighted line has just run; boxes it wrote to have an amber outline. A ? is a box that was never given a value.")}
    >
      <div ref={bodyRef} className={side ? "grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "flex flex-col"}>
        {/* ── Code ── */}
        <div className={`p-3 ${side ? "border-r" : "border-b"} border-[var(--border)] flex flex-col gap-3 min-w-0`}>
          <ol className="font-mono text-[12px] leading-[1.55] overflow-x-auto">
            {prog.code.map((ln, i) => {
              const cut = cutLines.get(i);
              const gone = cut !== undefined && removed.has(cut);
              return (
                <li key={i} className={`flex items-start gap-2 rounded px-1 ${snap.line === i ? "bg-[var(--primary-low)]" : ""}`}>
                  <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                  <span className={`whitespace-pre flex-1 ${gone ? "line-through opacity-40" : snap.line === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
                  {cut !== undefined && (
                    <button type="button" onClick={() => toggleCut(cut)}
                      className={`shrink-0 px-1.5 rounded border text-[10px] leading-[1.5] transition-colors ${gone
                        ? "border-[var(--primary)]/50 text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                      {gone ? tx(t, "figCMem_restore", "put back") : tx(t, "figCMem_remove", "remove")}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          {side && explain}
        </div>

        {/* ── Memory ── */}
        <div className="min-w-0">
          <svg viewBox={`0 0 ${L.W} ${height}`} className="w-full h-auto">
            <T x={10} y={16} size={8.5} bold>{tx(t, "figCMem_stack", "STACK  (grows toward lower addresses ↓)")}</T>
            <T x={narrow ? 10 : 354} y={narrow ? L.frames.reduce((y, f) => Math.max(y, f.r.y + f.r.h), 28) + 18 : 16} size={8.5} bold>
              {tx(t, "figCMem_heap", "HEAP  (malloc / free)")}
            </T>

            {L.frames.map(({ f, r }) => (
              <g key={f.uid} opacity={f.dead ? 0.45 : 1}>
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} fill="none" stroke="var(--code-border)" strokeDasharray={f.dead ? "4 3" : undefined} />
                <T x={r.x + 8} y={r.y + 15} size={10} color={C.fg} bold>{`${f.fn}()`}</T>
                {f.dead && <T x={r.x + r.w - 8} y={r.y + 15} size={8.5} anchor="end">{tx(t, "figCMem_returned", "returned: memory up for reuse")}</T>}
                {f.cells.map((c, i) => {
                  const y = r.y + HEAD + i * ROW;
                  return (
                    <g key={c.key}>
                      <T x={r.x + 10} y={y + 16} size={10.5} color={C.fg} bold>{c.name}</T>
                      <T x={r.x + 10} y={y + 28} size={8.5}>{c.type}</T>
                      <T x={r.x + 10} y={y + 39} size={8}>{`${hex(c.addr)} · ${c.elem * c.vals.length} B`}</T>
                      {drawCell(c, false)}
                    </g>
                  );
                })}
              </g>
            ))}

            {L.blocks.map(({ b, r, compact }) => {
              const isLeak = leaked.includes(b);
              return (
                <g key={b.key} opacity={b.freed ? 0.45 : 1}>
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} fill="none"
                    stroke={isLeak ? C.red : "var(--code-border)"} strokeWidth={isLeak ? 1.6 : 1} strokeDasharray={b.freed ? "4 3" : undefined} />
                  <T x={r.x + 8} y={r.y + 14} size={9.5} color={C.fg} bold>{b.name}</T>
                  <T x={r.x + r.w - 8} y={r.y + 14} size={8.5} anchor="end" color={isLeak ? C.red : C.muted}>
                    {b.freed ? tx(t, "figCMem_freed", "freed") : isLeak ? tx(t, "figCMem_leak", "leaked: no pointer left") : hex(b.addr)}
                  </T>
                  {drawCell(b, true, compact)}
                </g>
              );
            })}

            {pointers.map(c => {
              const ps = states.get(c.key)!;
              const from = L.boxes.get(c.key)?.[0];
              if (!from || !ps.target) return null;
              const rects = L.boxes.get(ps.target.key) ?? [];
              const past = ps.index !== undefined && ps.index >= rects.length && rects.length > 0 && !(rects.length === 1 && ps.target.vals.length > COMPACT);
              const to = past ? rects[rects.length - 1] : rects.length === 1 ? rects[0] : rects[ps.index ?? 0];
              if (!to) return null;
              const toHeap = st.heap.some(b => b.key === ps.target!.key);
              const { d, head } = arrowPath(from, to, toHeap, narrow, past);
              const col = COLOR[ps.state];
              const dead = st.frames.some(f => f.dead && f.cells.includes(c));
              return (
                <g key={c.key} opacity={dead ? 0.45 : 0.95}>
                  <path d={d} fill="none" stroke={col} strokeWidth={1.7} strokeDasharray={ps.state === "ok" ? undefined : "5 3"} />
                  <polygon points={head} fill={col} />
                </g>
              );
            })}
          </svg>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCMem_step", "step")} ${k + 1} / ${snaps.length}`} />
          {!side && <div className="px-4 pb-4 flex flex-col gap-3">{explain}</div>}
        </div>
      </div>
    </Figure>
  );
}

const NAMES: Record<ProgramId, string> = {
  vars: "variables",
  pointer: "pointers",
  swapVal: "swap by value",
  swapPtr: "swap by pointer",
  heap: "malloc / free",
  leak: "leak",
  dangling: "dangling",
  string: "string",
  noTerm: "missing \\0",
  struct: "struct",
  overflow: "off by one",
  file: "fopen / fclose",
  vector: "std::vector",
  swapRef: "swap by reference",
  refDangle: "dangling reference",
};
