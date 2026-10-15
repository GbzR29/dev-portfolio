"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Btn, C, Choice, Figure } from "@/components/lesson/kit/figure";
import { ASM, OP_LINE, PROGRAM, SCHEDULES, SOURCE, START, done, step, type ThrMode, type ThrState, type Tid } from "./interleaveModel";

// ── What this figure shows ────────────────────────────────────────────────────
// You are the scheduler. Two threads each run ++counter once; press "run A" or
// "run B" to let one of them execute its next machine instruction. With a
// plain int, letting both load before either stores loses an update: the
// result is 1, not 2. A mutex makes the second thread wait; an atomic makes
// the whole increment one step. Two ready-made schedules replay the safe
// order and the bad interleaving.

const COLOR: Record<Tid, string> = { A: C.sky, B: C.amber };

export function InterleaveFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<ThrMode>("plain");
  const [hist, setHist] = useState<ThrState[]>([START]);
  const s = hist[hist.length - 1];
  const prog = PROGRAM[mode];
  const finished = done(s, mode, "A") && done(s, mode, "B");

  const pickMode = (m: ThrMode) => { setMode(m); setHist([START]); };
  const run = (tid: Tid) => setHist(h => [...h, step(h[h.length - 1], mode, tid)]);
  const replay = (name: string) => {
    let st = START; const h = [st];
    for (const tid of SCHEDULES[mode][name]) { st = step(st, mode, tid); h.push(st); }
    setHist(h);
  };

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";
  const fill = (en: string, key: string, tid: Tid, v: number) =>
    tx(t, `figCppThr_ev_${key}`, en).replace("{t}", tid).replace("{v}", String(v));

  const lost = finished && s.mem !== 2;

  const thread = (tid: Tid) => {
    const pc = s.pc[tid];
    const blocked = mode === "mutex" && prog[pc] === "lock" && s.owner !== null && s.owner !== tid;
    return (
      <div className="rounded-lg border-2 px-2.5 py-2 bg-[var(--code-surface)] flex flex-col gap-1.5 min-w-0"
        style={{ borderColor: s.last?.t === tid ? COLOR[tid] : "var(--code-border)" }}>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-bold" style={{ color: COLOR[tid] }}>{tx(t, "figCppThr_thread", "thread")} {tid}</span>
          <span className="text-[var(--text-muted)]">
            {done(s, mode, tid) ? tx(t, "figCppThr_finished", "finished") : blocked ? tx(t, "figCppThr_waiting", "waiting for m") : tx(t, "figCppThr_ready", "ready")}
          </span>
          <span className="ml-auto font-mono text-[var(--text-muted)]">eax = <b style={{ color: COLOR[tid] }}>{s.reg[tid] ?? "—"}</b></span>
        </div>
        <ol className="font-mono text-[11.5px] leading-[1.5]">
          {SOURCE[mode].map((ln, i) => (
            <li key={i} className="text-[var(--text-main)] px-1">{ln}</li>
          ))}
        </ol>
        <ol className="font-mono text-[11px] leading-[1.5] border-t border-[var(--code-border)] pt-1">
          {prog.map((op, i) => (
            <li key={i} className="flex gap-2 rounded px-1"
              style={{ background: i === pc && !done(s, mode, tid) ? "var(--primary-low)" : undefined, opacity: i < pc ? 0.45 : 1 }}>
              <span className="w-3 text-[var(--text-muted)]">{i < pc ? "✓" : i === pc ? "›" : ""}</span>
              <span className="whitespace-pre text-[var(--text-muted)]">{ASM[op]}</span>
              <span className="ml-auto text-[9px] text-[var(--text-muted)] opacity-70">L{OP_LINE[mode][i] + 1}</span>
            </li>
          ))}
        </ol>
        <Btn onClick={() => run(tid)} active={!done(s, mode, tid)}>
          {done(s, mode, tid) ? tx(t, "figCppThr_done", "done") : `${tx(t, "figCppThr_run", "run")} ${tid}: ${tx(t, "figCppThr_oneInstr", "one instruction")}`}
        </Btn>
      </div>
    );
  };

  return (
    <Figure
      title={tx(t, "figCppThr_title", "You are the scheduler: two threads, one ++counter each")}
      head={<Choice value={mode} onChange={pickMode} options={[
        ["plain", "int"], ["mutex", "int + std::mutex"], ["atomic", "std::atomic<int>"],
      ]} />}
      controls={
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppThr_replay", "Replay")}</span>
          <Btn onClick={() => replay("serial")}>{tx(t, "figCppThr_serial", "A, then B")}</Btn>
          <Btn onClick={() => replay("lost")}>{tx(t, "figCppThr_lost", "alternate A and B · break it")}</Btn>
          <Btn onClick={() => setHist(h => (h.length > 1 ? h.slice(0, -1) : h))}>{tx(t, "figCppThr_undo", "undo")}</Btn>
          <Btn onClick={() => setHist([START])}>{tx(t, "figCppThr_reset", "reset")}</Btn>
        </div>
      }
      note={tx(t, "figCppThr_note", "Each button lets one thread execute one machine instruction, as the operating system would between time slices. Break it: with a plain int, let A load, then B load, then both store. Both read 0, both write 1, and one increment is lost. Then try the same order with the mutex and with the atomic.")}
    >
      <div className="p-3 flex flex-col gap-3">
        <div className="grid sm:grid-cols-2 gap-3">
          {thread("A")}
          {thread("B")}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)]">{tx(t, "figCppThr_memory", "counter in memory")}</div>
            <div className="font-mono text-[22px] font-bold" style={{ color: lost ? C.red : finished ? C.green : "var(--text-main)" }}>{s.mem}</div>
          </div>
          <div className={box}>
            <div className="text-[10px] text-[var(--text-muted)]">{tx(t, "figCppThr_expected", "expected when both finish")}</div>
            <div className="font-mono text-[22px] font-bold text-[var(--text-main)]">2</div>
          </div>
          {mode === "mutex" && (
            <div className={box}>
              <div className="text-[10px] text-[var(--text-muted)]">std::mutex m</div>
              <div className="font-mono text-[13px] font-bold mt-1" style={{ color: s.owner ? COLOR[s.owner] : C.green }}>
                {s.owner ? `${tx(t, "figCppThr_heldBy", "locked by")} ${s.owner}` : tx(t, "figCppThr_free", "unlocked")}
              </div>
            </div>
          )}
        </div>

        <div className={box + " min-h-[4.5rem]"} aria-live="polite">
          {label(tx(t, "figCppThr_what", "what just happened"))}
          <p className="text-[13px] leading-relaxed text-[var(--text-main)]">
            {s.last ? fill(s.last.en, s.last.key, s.last.t, s.last.v) : tx(t, "figCppThr_start", "Nothing has run yet. counter is 0 and each thread will add 1 to it.")}
          </p>
          {finished && (
            <p className="text-[13px] leading-relaxed mt-1 font-semibold" style={{ color: lost ? C.red : C.green }}>
              {lost
                ? tx(t, "figCppThr_lostMsg", "Both threads finished and counter is 1. Each read 0 before the other stored, so the second store overwrote the first: a lost update. In C++ this is a data race, which is undefined behaviour.")
                : tx(t, "figCppThr_okMsg", "Both threads finished and counter is 2.")}
            </p>
          )}
        </div>

        {s.writes.length > 0 && (
          <div className="flex gap-2 items-center font-mono text-[11px] flex-wrap">
            <span className="text-[var(--text-muted)] font-sans text-[10px] uppercase tracking-wider">{tx(t, "figCppThr_writes", "writes to counter")}</span>
            {s.writes.map((w, i) => (
              <span key={i} className="rounded border px-1.5 py-0.5" style={{ borderColor: COLOR[w.t], color: "var(--text-main)" }}>{w.t}: {w.v}</span>
            ))}
          </div>
        )}
      </div>
    </Figure>
  );
}
