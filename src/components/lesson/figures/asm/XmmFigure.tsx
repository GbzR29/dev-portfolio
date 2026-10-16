"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { f32, f64, laneHex, runSse, shortest, type Xmm } from "./sseModel";
import { SSE_NAMES, SSE_PROGRAMS, type SseProgramId } from "./ssePrograms";

// ── What this figure shows ────────────────────────────────────────────────────
// gcc's code for a small floating-point function, one instruction at a time.
// Each xmm register is drawn as its 16 bytes split into lanes: two doubles, or
// four floats for float code. Scalar instructions (…sd, …ss) change only lane
// 0, and the figure shows it: the other lanes keep whatever they held. The
// input buttons rerun the function on other arguments, NaN included, and the
// flags row shows what comisd / ucomisd leave for the jump or set that follows.
// Lines with a "remove" button can be taken out (break it).

const mono = "font-mono tabular-nums";
const baseOf = (r: string) => (r === "eax" ? "rax" : r === "edx" ? "rdx" : r === "esi" ? "rsi" : r) as "rax" | "rdx" | "rsi";

function Lanes({ x, prev, single, hot, label }: { x: Xmm; prev: Xmm; single: boolean; hot: boolean; label: (lane: number) => string }) {
  const n = single ? 4 : 2, bytes = single ? 4 : 8;
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
      {Array.from({ length: n }, (_, k) => n - 1 - k).map(lane => {
        const v = single ? f32(x, lane) : f64(x, lane);
        const changed = hot && laneHex(x, lane, bytes) !== laneHex(prev, lane, bytes);
        return (
          <div key={lane} className={`${mono} rounded border px-1.5 py-1 flex flex-col min-w-0 leading-tight`}
            style={{ borderColor: changed ? C.amber : lane === 0 ? "var(--primary)" : "var(--code-border)", background: "var(--code-surface)", opacity: lane === 0 ? 1 : 0.7 }}>
            <span className="text-[9.5px] text-[var(--text-muted)]">{label(lane)}</span>
            <span className="text-[12.5px] text-[var(--text-main)] truncate" style={{ color: changed ? C.amber : undefined }}>{shortest(v, single)}</span>
            <span className="text-[9.5px] text-[var(--text-muted)] truncate">{laneHex(x, lane, bytes)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function XmmFigure({ t, programs }: { t?: TrackTranslations; programs: SseProgramId[] }) {
  const [pid, setPid] = useState<SseProgramId>(programs[0]);
  const [inp, setInp] = useState(0);
  const [cut, setCut] = useState<number[]>([]);
  const prog = SSE_PROGRAMS[pid];
  const input = prog.inputs[Math.min(inp, prog.inputs.length - 1)];
  const removed = useMemo(() => new Set(cut.flatMap(i => prog.cuts?.[i] ?? [])), [cut, prog]);
  const steps = useMemo(() => runSse(prog, input[1], removed), [prog, input, removed]);
  const s = useStepper(steps.length - 1, 1000, 500);
  const k = Math.max(0, Math.min(steps.length - 1, Math.floor(s.raw + 1e-9)));
  const step = steps[k], before = steps[Math.max(0, k - 1)].state, st = step.state;
  const next = steps[k + 1]?.line;
  const cutAt = new Map((prog.cuts ?? []).map((g, i) => [g[0], i] as const));

  const choose = (id: SseProgramId) => { setPid(id); setInp(0); setCut([]); s.restart(); };
  const pickInput = (i: number) => { setInp(i); s.restart(); };
  const toggleCut = (i: number) => { setCut(cut.includes(i) ? cut.filter(x => x !== i) : [...cut, i]); s.restart(); };

  const note = tx(t, `figAsmXmm_${pid}_${step.line}`, prog.notes[step.line] ?? "");
  const cutNote = removed.size > 0 && k === steps.length - 1
    ? tx(t, "figAsmXmm_cutNote", "Same answer: the pxor lines never changed the result. Look at the high lanes, though: they still hold the leftovers, and on a real CPU cvtsi2sd had to wait for the instruction that wrote them. The pxor is there for speed.")
    : "";

  const laneLabel = (lane: number) => lane === 0
    ? tx(t, "figAsmXmm_lane0", "lane 0 · {type}").replace("{type}", prog.single ? "float" : "double")
    : tx(t, "figAsmXmm_lane", "lane {n}").replace("{n}", String(lane));

  const gprRow = (r: string) => {
    const base = baseOf(r);
    const v = st.gpr[base], was = before.gpr[base];
    const w32 = r.startsWith("e");
    const shown = w32 ? v & BigInt(0xffffffff) : v;
    const bits = w32 ? 32 : 64;
    const sv = shown >= BigInt(1) << BigInt(bits - 1) ? shown - (BigInt(1) << BigInt(bits)) : shown;
    const hot = step.wrote.includes(base) && v !== was;
    return (
      <div key={r} className={`grid grid-cols-[3rem_auto] gap-x-3 items-baseline rounded px-1.5 py-0.5 ${hot ? "bg-[var(--primary-low)]" : ""}`}>
        <span className={`${mono} text-[12px] font-bold text-[var(--text-main)]`}>{r}</span>
        <span className={`${mono} text-[12px] text-[var(--text-main)]`}>
          {sv.toString()} <span className="text-[10.5px] text-[var(--text-muted)]">0x{shown.toString(16).padStart(w32 ? 8 : 16, "0")}</span>
        </span>
      </div>
    );
  };

  const flag = (name: string, on: boolean, was: boolean) => (
    <span key={name} className={`${mono} text-[11px] px-1.5 py-0.5 rounded border`}
      style={{ borderColor: on !== was ? C.amber : "var(--border)", color: on ? "var(--text-main)" : "var(--text-muted)" }}>
      {name}={on ? 1 : 0}
    </span>
  );

  return (
    <Figure
      title={tx(t, "figAsmXmm_title", "Floating point in the xmm registers")}
      head={programs.length > 1 ? (
        <Choice value={pid} onChange={choose}
          options={programs.map(id => [id, tx(t, `figAsmXmm_name_${id}`, SSE_NAMES[id])] as [SseProgramId, string])} />
      ) : undefined}
      note={prog.cuts
        ? tx(t, "figAsmXmm_breakIt", "Break it: remove the marked lines and run again. Pick another input with the buttons above the code.")
        : tx(t, "figAsmXmm_how", "Step through gcc's code. Pick another input with the buttons above the code. Lane 0, outlined, is the one scalar instructions use; amber marks what the last step changed.")}
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code ── */}
        <div className="p-3 flex flex-col gap-3 min-w-0 border-b md:border-b-0 md:border-r border-[var(--border)]">
          <div className={`${mono} text-[11.5px] text-[var(--text-muted)] whitespace-pre-wrap`}>{prog.c}</div>
          <div className="flex items-center gap-1.5" style={{ flexWrap: "wrap" }}>
            <span className="text-[11px] text-[var(--text-muted)] mr-1">{tx(t, "figAsmXmm_input", "input")}</span>
            {prog.inputs.map(([label], i) => <Btn key={label} active={i === inp} onClick={() => pickInput(i)}>{label}</Btn>)}
          </div>
          <ol className={`${mono} text-[12px] leading-[1.6] overflow-x-auto rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] py-2`}>
            {prog.code.map((src, i) => {
              const gone = removed.has(i);
              const c = cutAt.get(i);
              return (
                <li key={i} className={`flex items-start gap-2 px-1 ${step.line === i ? "bg-[var(--primary-low)]" : ""}`}>
                  <span className="w-3 shrink-0 text-[var(--primary)] select-none" aria-hidden>{next === i ? "→" : ""}</span>
                  <span className={`whitespace-pre flex-1 ${gone ? "line-through opacity-40" : step.line === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>
                    {src.replace(/^ {8}/, "  ").replace(/^(\s+\S+)\s{2,}/, (_, a: string) => a.padEnd(Math.max(a.length + 1, 12)))}
                  </span>
                  {c !== undefined && (
                    <button type="button" onClick={() => toggleCut(c)}
                      className={`shrink-0 px-1.5 rounded border text-[10px] leading-[1.5] ${gone ? "border-[var(--primary)]/50 text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                      {gone ? tx(t, "figAsmCpu_restore", "put back") : tx(t, "figAsmCpu_remove", "remove")}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">
            {note}{cutNote && <> <span style={{ color: C.amber }}>{cutNote}</span></>}
          </p>
        </div>

        {/* ── Registers ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex flex-col gap-2.5">
            {prog.regs.filter(r => r.startsWith("xmm")).map(r => {
              const i = Number(r.slice(3));
              return (
                <div key={r} className="flex flex-col gap-1">
                  <span className={`${mono} text-[12px] font-bold text-[var(--text-main)]`}>{r}</span>
                  <Lanes x={st.xmm[i]} prev={before.xmm[i]} single={!!prog.single} hot={step.wrote.includes(r)} label={laneLabel} />
                </div>
              );
            })}
            <div className="flex flex-col gap-0.5">{prog.regs.filter(r => !r.startsWith("xmm")).map(gprRow)}</div>
            {prog.flags && (
              <div className="flex gap-1.5" style={{ flexWrap: "wrap" }}>
                {flag("ZF", st.flags.zf, before.flags.zf)}{flag("PF", st.flags.pf, before.flags.pf)}{flag("CF", st.flags.cf, before.flags.cf)}
              </div>
            )}
          </div>
          <div className="mt-auto">
            <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
              readout={`${tx(t, "figAsmCpu_step", "step")} ${k} / ${steps.length - 1}`} />
          </div>
        </div>
      </div>
    </Figure>
  );
}
