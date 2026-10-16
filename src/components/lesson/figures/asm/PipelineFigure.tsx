"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { PIPE_PROGRAMS, schedule, stageAt, type PipeProgramId } from "./pipelineModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A pipeline diagram: one row per instruction, one column per clock cycle,
// each cell the stage the instruction is in (Fetch, Decode, eXecute, Memory,
// Write back). Stepping moves the clock. Dashed cells are stalls, an
// instruction waiting for a value; red rows were fetched behind a branch the
// predictor got wrong and are flushed. Turning forwarding off (break it) makes
// every dependent instruction wait until the value is written back.

const mono = "font-mono tabular-nums";
const STAGE: Record<string, [string, string]> = {
  F: ["F", C.sky], D: ["D", C.amber], X: ["X", C.green], M: ["M", C.purple], W: ["W", C.pink],
  stall: ["·", C.amber], fwait: ["·", C.sky],
};

const NOTES: Record<PipeProgramId, [string, string]> = {
  independent: [
    "Five instructions that share no registers. Once the pipe is full, one finishes every cycle: 5 instructions in 9 cycles, and 1,000 would take 1,004. Each instruction still needs 5 cycles from start to end; the pipeline wins by overlapping them.",
    "No instruction needs another's result, so forwarding changes nothing here.",
  ],
  chain: [
    "Each add needs the eax of the one before. Forwarding sends the result from the end of X straight into the next X, so the chain still runs at one per cycle.",
    "Without forwarding, each add must wait until the previous result is written back, in W: two stall cycles per instruction, 14 cycles instead of 8. Real processors forward everywhere for exactly this reason.",
  ],
  loadUse: [
    "A load's value only arrives at the end of M, one stage later than an ALU result, so the add right after it waits one cycle: a load-use bubble. The second load is followed by an independent add, which fills the gap: compilers schedule code like this on purpose.",
    "Without forwarding both dependent instructions wait for write back, and the program takes 13 cycles instead of 10.",
  ],
  branch: [
    "The branch is only resolved in X. The predictor guessed \"not taken\", so the two instructions after jne were fetched; when jne turns out to be taken they are flushed, and fetching restarts at .skip. Two cycles are lost. Real processors resolve branches 10 to 20 stages deep, so a wrong guess costs about 15 cycles.",
    "Without forwarding the branch also waits for cmp's flags to be written back, and the flushed instructions sat in the pipe even longer.",
  ],
};

export function PipelineFigure({ t, programs = ["independent", "chain", "loadUse", "branch"] }: { t?: TrackTranslations; programs?: PipeProgramId[] }) {
  const [pid, setPid] = useState<PipeProgramId>(programs[0]);
  const [fw, setFw] = useState(true);
  const prog = PIPE_PROGRAMS[pid];
  const { t: tm, cycles } = useMemo(() => schedule(prog, fw), [prog, fw]);
  const bi = prog.findIndex(q => q.mispredict);
  const flushAt = bi < 0 ? Infinity : tm[bi].x + 1;
  const s = useStepper(cycles, 800, 300);
  const k = Math.max(0, Math.min(cycles, Math.floor(s.raw + 1e-9)));      // cycles shown so far
  const real = prog.filter(q => !q.wrongPath).length;
  const finished = tm.filter((q, i) => !prog[i].wrongPath && q.x + 2 < k).length;

  const choose = (id: PipeProgramId) => { setPid(id); s.restart(); };
  const toggle = () => { setFw(!fw); s.restart(); };
  const note = tx(t, `figAsmPipe_${pid}_${fw ? 0 : 1}`, NOTES[pid][fw ? 0 : 1]);

  return (
    <Figure
      title={tx(t, "figAsmPipe_title", "Five instructions in flight at once")}
      head={<Choice value={pid} onChange={choose} options={programs.map(id => [id, tx(t, `figAsmPipe_name_${id}`, { independent: "independent", chain: "a chain", loadUse: "load, then use", branch: "wrong guess" }[id])] as [PipeProgramId, string])} />}
      note={tx(t, "figAsmPipe_how", "Each step is one clock cycle. F fetch, D decode, X execute, M memory, W write back. Dashed cells are stalls; red rows are flushed. Break it: turn forwarding off.")}
    >
      <div className="flex flex-col">
        <div className="px-3 pt-3 flex items-center gap-2" style={{ flexWrap: "wrap" }}>
          <Btn active={fw} onClick={toggle}>{fw ? tx(t, "figAsmPipe_fwOn", "forwarding on") : tx(t, "figAsmPipe_fwOff", "forwarding off")}</Btn>
          <span className={`${mono} text-[11.5px] text-right text-[var(--text-muted)]`} style={{ flex: "1 1 12rem" }}>
            {tx(t, "figAsmPipe_stats", "{c} cycles for {n} instructions").replace("{c}", String(cycles)).replace("{n}", String(real))}
          </span>
        </div>
        <div className="p-3 overflow-x-auto">
          <table className={`${mono} text-[11.5px] border-separate`} style={{ borderSpacing: 2 }}>
            <thead>
              <tr>
                <th />
                {Array.from({ length: cycles }, (_, c) => (
                  <th key={c} className="w-7 text-[10px] font-normal" style={{ color: c < k ? "var(--text-main)" : "var(--text-muted)" }}>{c + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prog.map((ins, i) => (
                <tr key={i}>
                  <td className="pr-3 whitespace-pre" style={{ color: ins.wrongPath ? C.red : "var(--text-main)", textDecoration: ins.wrongPath && k >= flushAt ? "line-through" : undefined }}>{ins.text}</td>
                  {Array.from({ length: cycles }, (_, c) => {
                    const st = c < k ? stageAt(tm[i], c, flushAt) : "";
                    const [label, color] = STAGE[st] ?? ["", ""];
                    const wait = st === "stall" || st === "fwait";
                    return (
                      <td key={c} className="w-7 h-6 text-center rounded-sm text-[11px]"
                        style={st ? {
                          background: wait ? "transparent" : ins.wrongPath ? "transparent" : color,
                          border: wait ? `1px dashed ${color}` : ins.wrongPath ? `1px solid ${C.red}` : undefined,
                          color: wait ? color : ins.wrongPath ? C.red : "#0b1220", fontWeight: 600,
                        } : { border: "1px solid var(--code-border)", opacity: 0.35 }}>
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-3 pb-3 text-[13px] leading-relaxed text-[var(--text-main)]">{note}</p>
        <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
          readout={`${tx(t, "figAsmPipe_cycle", "cycle")} ${k} · ${tx(t, "figAsmPipe_done", "done")} ${finished}/${real}`} />
      </div>
    </Figure>
  );
}
