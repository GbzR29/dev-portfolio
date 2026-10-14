"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure, Readout, Row } from "@/components/lesson/kit/figure";

// ── What this figure shows ────────────────────────────────────────────────────
// A std::vector<int> as it really is: three values on the stack (data, size,
// capacity) and a heap block of `capacity` ints, the first `size` of them in
// use. push_back writes into spare room when there is some; when the block is
// full it allocates a larger one (×2 in GCC and Clang, ×1.5 in MSVC), copies
// every element across and frees the old block, which is drawn faded for one
// step. reserve, clear and shrink_to_fit show which operations touch the
// capacity. "Break it": keep a pointer to v[0], grow the vector, and the
// pointer is left aimed at freed memory.

type Growth = "x2" | "x15";
type Block = { id: number; cap: number; addr: number };
type V = {
  vals: number[];
  block: Block | null;
  old: { block: Block; copied: number } | null;     // the block freed by the last operation
  allocs: number;
  copies: number;
  next: number;
  serial: number;
  p: { block: number; i: number; addr: number } | null;   // int* p = &v[0]
  msg: { key: string; en: string; n?: number; c?: number };
};

const MAX = 20;
const start = (): V => ({ vals: [], block: null, old: null, allocs: 0, copies: 0, next: 10, serial: 0, p: null,
  msg: { key: "figCppVec_start", en: "An empty vector: size 0, capacity 0, and no heap block at all yet. Press push_back." } });
const grow = (cap: number, g: Growth) => (cap === 0 ? 1 : g === "x2" ? cap * 2 : Math.max(cap + 1, cap + Math.floor(cap / 2)));
const hex = (n: number) => "0x" + n.toString(16);

/** Moves the elements into a new block of `cap` (the old one is freed). */
function realloc(v: V, cap: number): V {
  const serial = v.serial + 1;
  const block = cap === 0 ? null : { id: serial, cap, addr: 0x4052a0 + serial * 0x60 + cap * 8 };
  return { ...v, block, serial, allocs: v.allocs + (cap ? 1 : 0), copies: v.copies + v.vals.length,
    old: v.block ? { block: v.block, copied: v.vals.length } : null };
}

export function VectorGrowthFigure({ t }: { t?: TrackTranslations }) {
  const [growth, setGrowth] = useState<Growth>("x2");
  const [v, setV] = useState<V>(start);
  const cap = v.block?.cap ?? 0;
  const size = v.vals.length;
  const pValid = v.p !== null && v.block !== null && v.p.block === v.block.id && v.p.i < size;
  const pBad = v.p !== null && !pValid;

  const push = () => {
    if (size >= MAX) return;
    let w: V = { ...v, old: null };
    let realloced = false;
    if (size === cap) { w = realloc(w, grow(cap, growth)); realloced = true; }
    w = { ...w, vals: [...w.vals, w.next], next: w.next + 10 };
    w.msg = realloced
      ? { key: "figCppVec_pushGrow", en: "push_back({n}): the block was full (size = capacity). The vector allocated a new block for {c} ints, copied the old elements across, freed the old block, then wrote {n}.", n: v.next, c: w.block!.cap }
      : { key: "figCppVec_push", en: "push_back({n}): there was spare room, so {n} was written in place. No allocation, no copying.", n: v.next };
    setV(w);
  };
  const pop = () => {
    if (!size) return;
    setV({ ...v, old: null, vals: v.vals.slice(0, -1), msg: { key: "figCppVec_pop", en: "pop_back(): the last element is destroyed and size drops by one. The capacity stays: the room is kept for the next push_back." } });
  };
  const reserve = () => {
    if (cap >= 16) { setV({ ...v, old: null, msg: { key: "figCppVec_reserveNo", en: "reserve(16): the capacity is already at least 16, so nothing happens. reserve never shrinks." } }); return; }
    const w = realloc({ ...v, old: null }, 16);
    w.msg = { key: "figCppVec_reserve", en: "reserve(16): one allocation with room for 16 ints. The next pushes up to 16 elements will never reallocate. Use it when you know roughly how many elements are coming." };
    setV(w);
  };
  const clear = () => {
    setV({ ...v, old: null, vals: [], msg: { key: "figCppVec_clear", en: "clear(): every element is destroyed and size becomes 0. The block and its capacity stay, ready to be filled again." } });
  };
  const shrink = () => {
    if (cap === size) { setV({ ...v, old: null, msg: { key: "figCppVec_shrinkNo", en: "shrink_to_fit(): size already equals capacity, nothing to give back." } }); return; }
    const w = realloc({ ...v, old: null }, size);
    w.msg = { key: "figCppVec_shrink", en: "shrink_to_fit(): a new block exactly as large as the elements, one more round of copying, and the spare room is given back to the system." };
    setV(w);
  };
  const takeP = () => {
    if (!size || !v.block) return;
    setV({ ...v, old: null, p: { block: v.block.id, i: 0, addr: v.block.addr }, msg: { key: "figCppVec_takeP", en: "int* p = &v[0]; p holds the address of the first element. Now push_back until the vector reallocates." } });
  };
  const reset = () => setV(start());
  const fill = (s: string, vars: { n?: number; c?: number }) => s.replace(/\{n\}/g, String(vars.n ?? "")).replace(/\{c\}/g, String(vars.c ?? ""));

  const cell = (i: number, content: string, kind: "used" | "spare" | "old", hot = false, target = false) => (
    <div key={i} className="h-8 min-w-[2.25rem] px-1 flex items-center justify-center rounded border font-mono text-[12px]"
      style={{
        borderColor: target ? (pBad ? C.red : C.sky) : hot ? C.amber : "var(--code-border)",
        borderWidth: target || hot ? 2 : 1,
        background: kind === "used" ? "var(--primary-low)" : "var(--code-surface)",
        color: kind === "spare" ? "var(--text-muted)" : "var(--text-main)",
      }}>{content}</div>
  );

  return (
    <Figure
      title={tx(t, "figCppVec_title", "Inside std::vector: size, capacity and reallocation")}
      head={<Choice value={growth} onChange={g => { setGrowth(g); reset(); }}
        options={[["x2", "GCC / Clang ×2"], ["x15", "MSVC ×1.5"]] as const} />}
      controls={<>
        <Row>
          <Btn onClick={push}>push_back({v.next})</Btn>
          <Btn onClick={pop}>pop_back()</Btn>
          <Btn onClick={reserve}>reserve(16)</Btn>
          <Btn onClick={clear}>clear()</Btn>
          <Btn onClick={shrink}>shrink_to_fit()</Btn>
          <Btn onClick={takeP}>int* p = &amp;v[0]</Btn>
          <Btn onClick={reset}>{tx(t, "figCppVec_reset", "start over")}</Btn>
        </Row>
        <Row>
          <Readout>size: {size}</Readout>
          <Readout>capacity: {cap}</Readout>
          <Readout>{tx(t, "figCppVec_allocs", "allocations")}: {v.allocs}</Readout>
          <Readout color={v.copies ? C.amber : undefined}>{tx(t, "figCppVec_copies", "elements copied")}: {v.copies}</Readout>
          {v.p && <Readout color={pBad ? C.red : C.sky}>p: {pBad ? tx(t, "figCppVec_dangling", "dangling") : tx(t, "figCppVec_valid", "valid")}</Readout>}
        </Row>
        <p className="text-[13px] leading-relaxed text-[var(--text-main)]" aria-live="polite">
          {fill(tx(t, v.msg.key, v.msg.en), v.msg)}
          {pBad && <span style={{ color: C.red }}> {tx(t, "figCppVec_pBad", "And p still holds the old address: the memory it points at is gone. Reading *p now is undefined behaviour, just like the dangling pointers of the C chapters.")}</span>}
        </p>
      </>}
      note={tx(t, "figCppVec_note", "Push 9 elements one at a time and count the copies: each one costs little on average, because the capacity grows by a factor, not by one. Switch the growth factor to compare. Break it: take p = &v[0], then push until the block moves.")}
    >
      <div className="p-4 flex flex-col gap-4 overflow-x-auto">
        {/* The three values on the stack */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figCppVec_stack", "stack: the vector object (24 bytes)")}</span>
          <div className="flex gap-2 flex-wrap font-mono text-[12px]">
            {[["data", v.block ? hex(v.block.addr) : "nullptr"], ["size", String(size)], ["capacity", String(cap)]].map(([k, val]) => (
              <div key={k} className="rounded border border-[var(--code-border)] bg-[var(--code-surface)] px-2 py-1">
                <span className="text-[var(--text-muted)]">{k} </span><span className="text-[var(--text-main)]">{val}</span>
              </div>
            ))}
            {v.p && (
              <div className="rounded border px-2 py-1" style={{ borderColor: pBad ? C.red : C.sky }}>
                <span className="text-[var(--text-muted)]">int* p </span>
                <span style={{ color: pBad ? C.red : "var(--text-main)" }}>{hex(v.p.addr)}</span>
              </div>
            )}
          </div>
        </div>

        {/* The heap block */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {tx(t, "figCppVec_heap", "heap")}{v.block ? ` · ${hex(v.block.addr)} · ${cap} × 4 B = ${cap * 4} B` : ""}
          </span>
          {v.block ? (
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: cap }, (_, i) => cell(i, i < size ? String(v.vals[i]) : "", i < size ? "used" : "spare",
                i === size - 1 && v.msg.key.startsWith("figCppVec_push"), v.p !== null && pValid && i === v.p.i))}
            </div>
          ) : <span className="font-mono text-[12px] text-[var(--text-muted)]">{tx(t, "figCppVec_noBlock", "no block")}</span>}
        </div>

        {/* The block freed by the last operation */}
        {v.old && (
          <div className="flex flex-col gap-1.5 opacity-50">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.red }}>
              {tx(t, "figCppVec_old", "old block, freed")} · {hex(v.old.block.addr)} · {v.old.copied} {tx(t, "figCppVec_copiedOut", "elements copied out")}
            </span>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: v.old.block.cap }, (_, i) => cell(i, i < v.old!.copied ? String(v.vals[i]) : "", "old", false, pBad && v.p?.block === v.old!.block.id && i === v.p.i))}
            </div>
          </div>
        )}
      </div>
    </Figure>
  );
}
