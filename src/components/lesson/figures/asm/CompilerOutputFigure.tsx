"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { CE_PROGRAMS, type CeProgram, type CeProgramId } from "./compilerData";
import { PERF_PROGRAMS, type PerfProgramId } from "./compilerDataPerf";
import { CE_NAMES, CE_NOTES, SAME } from "./compilerNotes";
import { PERF_NAMES, PERF_NOTES } from "./compilerNotesPerf";

// ── What this figure shows ────────────────────────────────────────────────────
// A small C function and the assembly gcc 14 makes of it, the way Compiler
// Explorer shows it: each C line has a colour, and the assembly lines it
// produced share that colour. Clicking a line on either side picks out its
// partners. The flag buttons switch between real outputs (-O0, -O2, or a flag
// that changes a rule); the count of instructions shows what the optimiser
// removed. Programs with undefined behavior also show what the program printed
// on Linux with each set of flags. A level may also be another version of the C
// (an inline-asm constraint, a fourth accumulator) or the same C built for ARM64.

const mono = "font-mono tabular-nums";
const PALETTE = [C.sky, C.amber, C.green, C.pink, C.purple, C.teal, C.orange];

type Id = CeProgramId | PerfProgramId;
const PROGRAMS: Record<Id, CeProgram> = { ...CE_PROGRAMS, ...PERF_PROGRAMS };
const NAMES: Record<Id, string> = { ...CE_NAMES, ...PERF_NAMES };
const NOTES: Record<Id, string[]> = { ...CE_NOTES, ...PERF_NOTES };

/** True for a line that is an instruction (not a label or a data directive). */
const isInstr = (s: string) => /^\s+[a-z]/.test(s) && !/^\s+\./.test(s);

export function CompilerOutputFigure({ t, programs }: { t?: TrackTranslations; programs: Id[] }) {
  const [pid, setPid] = useState<Id>(programs[0]);
  const [lvl, setLvl] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const prog = PROGRAMS[pid];
  const level = prog.levels[Math.min(lvl, prog.levels.length - 1)];
  const li = prog.levels.indexOf(level);
  const src = level.c ?? prog.c;
  const arm = prog.levels.some(L => L.cc === "arm64");

  // Colour per C line, in order of first appearance
  const color = new Map<number, string>();
  src.forEach((_, i) => { if (level.asm.some(([, l]) => l === i + 1)) color.set(i + 1, PALETTE[color.size % PALETTE.length]); });

  const count = level.asm.filter(([s]) => isInstr(s)).length;
  const count0 = prog.levels[0].asm.filter(([s]) => isInstr(s)).length;
  const choose = (id: Id) => { setPid(id); setLvl(0); setSel(null); };
  const pick = (line: number) => setSel(sel === line || line === 0 ? null : line);
  const dim = (line: number) => sel !== null && line !== sel;

  const noteEn = NOTES[pid][li];
  const note = noteEn === SAME ? tx(t, "figAsmCe_same", SAME) : tx(t, `figAsmCe_${pid}_${li}`, noteEn);

  const lineRow = (n: number, text: string, line: number, key: string, asm: boolean) => {
    const c = color.get(line);
    return (
      <li key={key} onClick={() => pick(line)}
        className={`flex gap-2 pl-2 pr-1 border-l-[3px] ${line ? "cursor-pointer" : ""}`}
        style={{
          borderColor: c ?? "transparent",
          background: c && sel === line ? "var(--primary-low)" : undefined,
          opacity: dim(line) ? 0.35 : 1,
        }}>
        {!asm && <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-70 select-none">{n}</span>}
        <span className={`whitespace-pre ${asm && !isInstr(text) ? "text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}>{(asm ? text.replace(/^ {8}/, "  ") : text) || " "}</span>
      </li>
    );
  };

  return (
    <Figure
      title={tx(t, "figAsmCe_title", "C and the assembly it becomes")}
      head={programs.length > 1 ? (
        <Choice value={pid} onChange={choose}
          options={programs.map(id => [id, tx(t, `figAsmCe_name_${id}`, NAMES[id])] as [Id, string])} />
      ) : undefined}
      note={arm
        ? tx(t, "figAsmCe_howArm", "Real output of gcc 14 for Linux, on x86-64 (Intel syntax) and on ARM64. Click a line on either side to see which lines belong together; switch between the two processors.")
        : tx(t, "figAsmCe_how", "Real output of gcc 14 for x86-64 Linux, Intel syntax. Click a line on either side to see which lines belong together; switch the flags to see what the optimiser changes.")}
    >
      <div className="flex flex-col">
        <div className="px-3 pt-3 flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
          <span className={`${mono} text-[11px] text-[var(--text-muted)] mr-1`}>gcc</span>
          {prog.levels.map((L, i) => (
            <Btn key={i} active={i === li} onClick={() => { setLvl(i); setSel(null); }}>{L.label ?? L.flags}</Btn>
          ))}
          <span className={`${mono} text-[11px] ml-auto text-[var(--text-muted)]`}>
            {tx(t, "figAsmCe_count", "{n} instructions").replace("{n}", String(count))}
            {li > 0 && count !== count0 && <span style={{ color: count < count0 ? C.green : C.amber }}> ({count0} → {count})</span>}
          </span>
        </div>
        {level.label && (
          <div className={`${mono} px-3 pt-1.5 text-[11px] text-[var(--text-muted)] whitespace-pre-wrap`}>
            $ {level.cc === "arm64" ? "aarch64-linux-gnu-gcc" : "gcc"} {level.flags}
          </div>
        )}
        <div className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">C</span>
            <ol className={`${mono} text-[12px] leading-[1.7] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] py-2 overflow-x-auto`}>
              {src.map((s, i) => lineRow(i + 1, s, color.has(i + 1) ? i + 1 : 0, `c${i}`, false))}
            </ol>
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{level.cc === "arm64" ? "ARM64" : "x86-64"}</span>
            <ol className={`${mono} text-[12px] leading-[1.7] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] py-2 overflow-x-auto max-h-[26rem] overflow-y-auto`}>
              {level.asm.map(([s, l], i) => lineRow(i, s, l, `a${i}`, true))}
            </ol>
          </div>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-2">
          <p className="text-[13px] leading-relaxed text-[var(--text-main)]" aria-live="polite">{note}</p>
          {level.out !== undefined && prog.call && (
            <div className={`${mono} text-[11.5px] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 leading-relaxed overflow-x-auto`}>
              <div className="text-[var(--text-muted)] whitespace-pre">{"// main: " + prog.call}</div>
              <div className="text-[var(--text-muted)] whitespace-pre">$ gcc {level.flags} main.c -o prog && ./prog</div>
              <div className="text-[var(--text-main)]">{level.out}</div>
            </div>
          )}
        </div>
      </div>
    </Figure>
  );
}
