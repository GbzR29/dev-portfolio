"use client";

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C } from "@/components/lesson/kit/figure";
import { STACK_START, TEXT_BASE, type CpuState, type Effect, type Image } from "./cpuModel";

// ── The stack, for the CPU figure ─────────────────────────────────────────────
// One row per 8-byte slot, higher addresses at the top, so the stack grows
// downward on screen as it does in memory. rsp and rbp point at their slots;
// slots below rsp are free (drawn faint) but keep their old bytes, as real
// memory does. A value that is an address inside the code is labelled as a
// return address ("↩ _start+10"). Bytes the last step wrote are amber, bytes it
// read are blue. Deep stacks show only the rows nearest rsp.

const MAX_ROWS = 9;
const mono = "font-mono tabular-nums";

/** "name+off" for a code address, using the nearest label at or before it (local .labels skipped). */
function codeLabel(img: Image, a: number): string | null {
  if (a < TEXT_BASE || a >= img.textEnd) return null;
  let best: [string, number] | null = null;
  for (const [name, v] of img.symbols) {
    if (name.startsWith(".") || v > a || v < TEXT_BASE || v >= img.textEnd) continue;
    if (!best || v > best[1]) best = [name, v];
  }
  return best ? (a === best[1] ? best[0] : `${best[0]}+${a - best[1]}`) : null;
}

export function StackView({ t, st, fx, img, bottom }: {
  t?: TrackTranslations; st: CpuState; fx: Effect; img: Image; bottom: number;
}) {
  const rsp = Number(st.regs.rsp), rbp = Number(st.regs.rbp);
  const top = STACK_START - 8;                                   // the first slot a push fills
  const inStack = (a: number) => a >= bottom && a <= top;
  // Lowest slot drawn: one below rsp (or rbp), never past the end of the stack
  const low = Math.max(bottom, Math.min(rsp, inStack(rbp) ? rbp : rsp, top) - 8);
  const all: number[] = [];
  for (let a = top; a >= low; a -= 8) all.push(a);
  const rows = all.length > MAX_ROWS ? all.slice(-MAX_ROWS) : all;
  const hidden = all.length - rows.length;

  const qword = (a: number) => {
    let v = 0;                                                   // stack values here stay below 2^53
    for (let k = 7; k >= 0; k--) v = v * 256 + (st.mem.get(a + k) ?? 0);
    return v;
  };
  const touched = (a: number, set: Set<number>) => [0, 1, 2, 3, 4, 5, 6, 7].some(k => set.has(a + k));

  return (
    <div className="flex flex-col gap-1">
      <span className={`${mono} text-[10.5px] text-[var(--text-muted)]`}>
        {tx(t, "figAsmStack_title", "stack")} · {tx(t, "figAsmStack_high", "higher addresses at the top")}
      </span>
      {hidden > 0 && (
        <span className={`${mono} text-[10.5px] text-[var(--text-muted)] pl-[4.6rem]`}>
          ⋮ {tx(t, "figAsmStack_more", "{n} more slots above").replace("{n}", String(hidden))}
        </span>
      )}
      <div className="flex flex-col gap-[3px]">
        {rows.map(a => {
          const v = qword(a);
          const free = a < rsp;
          const wrote = touched(a, fx.mem), read = touched(a, fx.read);
          const ret = codeLabel(img, v);
          const marks = [a === rsp ? "rsp" : "", a === rbp ? "rbp" : ""].filter(Boolean).join(" ");
          return (
            <div key={a} className="grid grid-cols-[4.2rem_3.6rem_minmax(0,1fr)] gap-2 items-center">
              <span className={`${mono} text-[11px] text-right font-bold`} style={{ color: marks ? "var(--primary)" : undefined }}>
                {marks && <>{marks} →</>}
              </span>
              <span className={`${mono} text-[10.5px] text-[var(--text-muted)]`}>…{(a & 0xffff).toString(16).padStart(4, "0")}</span>
              <span className={`${mono} text-[11.5px] rounded border px-2 py-0.5 flex justify-between gap-2 min-w-0`}
                style={{
                  borderColor: wrote ? C.amber : read ? C.sky : "var(--code-border)",
                  background: "var(--code-surface)", opacity: free ? 0.45 : 1,
                }}>
                <span className="text-[var(--text-main)] truncate">0x{v.toString(16)}</span>
                {ret && <span className="text-[var(--text-muted)] truncate">↩ {ret}</span>}
              </span>
            </div>
          );
        })}
      </div>
      <span className={`${mono} text-[10.5px] text-[var(--text-muted)] pl-[4.6rem]`}>
        ↓ {tx(t, "figAsmStack_grows", "the stack grows down")}{low === bottom ? ` · ${tx(t, "figAsmStack_end", "end of the stack")}` : ""}
      </span>
    </div>
  );
}
