"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { SIGS, sysv, win64, type Layout, type Place } from "./callConv";

// ── What this figure shows ────────────────────────────────────────────────────
// A C function (or a printf call) and, side by side, where each argument is
// waiting when the function starts under Linux / macOS (System V) and under
// Windows (Win64): which register, or which stack slot above the return
// address. Integer and pointer arguments are blue, floating-point ones purple,
// stack slots orange. Under each column, the stack at the moment of the call
// and the rules that produced that layout.

const mono = "font-mono tabular-nums";
const KIND_COLOR = { int: C.sky, ptr: C.sky, i64: C.sky, hidden: C.amber, double: C.purple, float: C.purple } as const;

const NOTES: Record<string, string> = {
  al: "Variadic call: al holds how many xmm registers carry arguments (here 1), so printf knows whether it must save them.",
  sysvStack: "There are only six integer registers. The 7th and 8th arguments go on the stack, written by the caller just above the return address.",
  pair: "A 16-byte struct of two integers comes back in two registers: x in rax, y in rdx.",
  shadow: "The caller always reserves 32 bytes above the return address, the shadow space, where the function may store rcx, rdx, r8 and r9.",
  hidden: "A struct bigger than 8 bytes comes back through memory: the caller passes the address of the result as a hidden first argument in rcx, and every real argument moves one place along.",
  winVar: "Variadic call: the double goes in both xmm2 and r8, because printf cannot know in advance which kind of register to read.",
  positional: "Registers go by position, not by kind: the 2nd argument takes rdx or xmm1, whichever fits, and the other one is skipped.",
};

function Chip({ text, color }: { text: string; color: string }) {
  return (
    <span className={`${mono} text-[12px] px-1.5 py-0.5 rounded border`} style={{ borderColor: color, color: "var(--text-main)", background: "var(--code-surface)" }}>
      {text}
    </span>
  );
}

function Column({ t, title, os, lay }: { t?: TrackTranslations; title: string; os: string; lay: Layout }) {
  const onStack = lay.places.filter(p => p.stack !== undefined).sort((a, b) => b.stack! - a.stack!);
  const win = lay.extra.includes("shadow");
  const place = (p: Place) => (
    <div key={p.arg} className="grid grid-cols-[3.6rem_auto] gap-2 items-center">
      <span className={`${mono} text-[12px] text-right truncate`} style={{ color: KIND_COLOR[p.kind] }}>{p.arg}</span>
      <span className="flex gap-1" style={{ flexWrap: "wrap" }}>
        {p.stack !== undefined ? <Chip text={`[rsp + ${p.stack}]`} color={C.orange} />
          : p.regs.map(r => <Chip key={r} text={r} color={p.kind === "hidden" ? C.amber : r.startsWith("xmm") ? C.purple : C.sky} />)}
      </span>
    </div>
  );
  const slot = (label: string, what: string, color?: string, tall = false) => (
    <div key={label} className={`grid grid-cols-[5.6rem_minmax(0,1fr)] gap-2 items-center`}>
      <span className={`${mono} text-[11px] text-right text-[var(--text-muted)]`}>{label}</span>
      <span className={`${mono} text-[11.5px] rounded border px-2 ${tall ? "py-2" : "py-0.5"} truncate`}
        style={{ borderColor: color ?? "var(--code-border)", background: "var(--code-surface)", color: "var(--text-main)" }}>{what}</span>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-baseline gap-2" style={{ flexWrap: "wrap" }}>
        <span className="text-[13px] font-bold text-[var(--text-main)]">{title}</span>
        <span className="text-[11px] text-[var(--text-muted)]">{os}</span>
      </div>
      <div className="flex flex-col gap-1">
        {lay.places.map(place)}
        <div className="grid grid-cols-[3.6rem_auto] gap-2 items-center pt-1 mt-1 border-t border-[var(--border)]">
          <span className="text-[11px] text-right text-[var(--text-muted)]">{tx(t, "figAsmCc_return", "return")}</span>
          <span><Chip text={lay.ret} color="var(--primary)" /></span>
        </div>
      </div>

      <div className="flex flex-col gap-[3px]">
        <span className="text-[10.5px] text-[var(--text-muted)]">{tx(t, "figAsmCc_atEntry", "the stack when the function starts")}</span>
        {onStack.map(p => slot(`[rsp + ${p.stack}]`, p.arg, C.orange))}
        {win && slot("[rsp + 8…39]", tx(t, "figAsmCc_shadow", "shadow space, 32 bytes"), undefined, true)}
        {slot("[rsp]", tx(t, "figAsmCc_retAddr", "return address"), "var(--primary)")}
      </div>

      <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-[var(--text-muted)] list-disc pl-4">
        {lay.extra.map(k => <li key={k}>{tx(t, `figAsmCc_x_${k}`, NOTES[k])}</li>)}
      </ul>
    </div>
  );
}

export function CallConvFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState("mix");
  const sig = SIGS.find(s => s.id === id)!;
  return (
    <Figure
      title={tx(t, "figAsmCc_title", "Where the arguments wait")}
      head={<Choice value={id} onChange={setId} options={SIGS.map(s => [s.id, s.id] as [string, string])} />}
      note={tx(t, "figAsmCc_note", "Blue arguments travel in integer registers, purple ones in xmm registers, orange ones on the stack. The C code is the same; only the rules of the operating system differ, which is why an assembly function written for one does not work on the other.")}
    >
      <pre className={`${mono} text-[12px] sm:text-[13px] px-4 py-3 border-b border-[var(--border)] text-[var(--text-main)] overflow-x-auto`}>{sig.c}</pre>
      <div className="grid sm:grid-cols-2 sm:divide-x divide-y sm:divide-y-0 divide-[var(--border)]">
        <Column t={t} title="System V" os={tx(t, "figAsmCc_sysvOs", "Linux, macOS, BSD")} lay={sysv(sig)} />
        <Column t={t} title="Win64" os={tx(t, "figAsmCc_winOs", "Windows")} lay={win64(sig)} />
      </div>
    </Figure>
  );
}
