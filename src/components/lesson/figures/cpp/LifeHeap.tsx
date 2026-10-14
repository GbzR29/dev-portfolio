"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C } from "@/components/lesson/kit/figure";
import type { Block, LifeState, Obj } from "./lifeModel";

// ── Heap part of the lifetime figure ──────────────────────────────────────────
// The blocks a program has on the heap, each in its own colour, with its
// shared_ptr counts and the block it points at; and the small "→ #1" tag an
// object shows for the block its pointer holds. A freed block is drawn faded
// for one step, then removed; a block freed twice stays, in red; a leaked
// block (nobody freed it, nothing alive reaches it) gets a dashed red border.

const BLOCK_COL = [C.purple, C.teal, C.pink, C.orange];
export const blockCol = (id: string) => BLOCK_COL[(parseInt(id.slice(1), 10) - 1) % BLOCK_COL.length];

/** The pointer an object holds: a coloured tag, red when the block is already freed. */
export function PtrTag({ t, o, st }: { t?: TrackTranslations; o: Obj; st: LifeState }) {
  if (!o.ptr) {
    if (!o.note) return null;
    return <div className="font-mono text-[10.5px] text-[var(--text-muted)]">{o.note}</div>;
  }
  const b = st.heap.find(b => b.id === o.ptr);
  const dangling = !b || b.freed;
  return (
    <div className="font-mono text-[10.5px]" style={{ color: dangling ? C.red : blockCol(o.ptr) }}>
      → {o.ptr}{dangling && ` (${tx(t, "figCppLife_dangling", "freed: dangling")})`}
    </div>
  );
}

export function LifeHeap({ t, st, touched, leaked }: { t?: TrackTranslations; st: LifeState; touched: Set<string>; leaked: Block[] }) {
  const shown = st.heap.filter(b => !b.hidden);
  return (
    <div className="px-3 pb-3">
      <div className="rounded-lg border border-[var(--code-border)] px-2.5 py-2 flex flex-col gap-1.5">
        <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)]">{tx(t, "figCppLife_heap", "heap")}</div>
        {shown.length === 0 && <span className="text-[12px] text-[var(--text-muted)]">—</span>}
        <div className="flex flex-wrap gap-1.5">
          {shown.map(b => {
            const leak = leaked.includes(b);
            const col = b.doubleFree || leak ? C.red : blockCol(b.id);
            const status = b.doubleFree ? tx(t, "figCppLife_twice", "freed twice!")
              : b.freed ? tx(t, "figCppLife_freed", "freed")
                : leak ? tx(t, "figCppLife_leaked", "leaked") : "";
            return (
              <div key={b.id} className="rounded-lg px-2.5 py-1.5 bg-[var(--code-surface)] min-w-[9rem]"
                style={{ border: `${touched.has(`h${b.id}`) ? 2 : 1}px ${leak ? "dashed" : "solid"} ${col}`, opacity: b.freed && !b.doubleFree ? 0.5 : 1 }}>
                <div className="flex items-baseline gap-2 font-mono text-[12px]">
                  <span className="font-bold" style={{ color: blockCol(b.id) }}>{b.id}</span>
                  <span className={`text-[var(--text-main)] ${b.freed ? "line-through" : ""}`}>{b.label}</span>
                </div>
                {b.refs !== undefined && (
                  <div className="font-mono text-[10.5px] text-[var(--text-muted)]">
                    use_count {b.refs}{b.weak ? ` · weak ${b.weak}` : ""}
                  </div>
                )}
                {b.to && (
                  <div className="font-mono text-[10.5px]" style={{ color: blockCol(b.to) }}>
                    {b.toWeak ? `⇢ ${b.to} (weak)` : `→ ${b.to}`}
                  </div>
                )}
                {status && <div className="font-mono text-[10.5px] font-bold" style={{ color: col }}>{status}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
