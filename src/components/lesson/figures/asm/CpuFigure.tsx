"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { hex64, hexAddr, signed, splitBytes, run, type Gpr, type Snap } from "./cpuModel";
import { CPU_NAMES, CPU_PROGRAMS, type CpuProgramId, type Watch } from "./cpuPrograms";

// ── What this figure shows ────────────────────────────────────────────────────
// A small x86-64 program on the left, its address and machine-code bytes beside
// each instruction; on the right the CPU: rip, the registers the program uses
// (hex, with the digits the last step changed in amber), the flags, the bytes
// of memory it reads (blue) and writes (amber), and the terminal. Each step
// runs one instruction, the way the processor does: fetch the bytes at rip,
// decode, execute, move rip on. Lines with a "remove" button can be taken out
// ("break it"): the program then runs on into whatever comes next, often a
// segmentation fault, exactly as it would on Linux.

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

const mono = "font-mono tabular-nums";

/** A source line for a phone: no indentation, the mnemonic padded to 6 columns instead of 8. */
const compact = (src: string) =>
  src.replace(/^ {8}/, "").replace(/^(\S+)\s{2,}(?=\S)/, (_, w: string) => w.padEnd(Math.max(w.length + 1, 6)));

/** The 16 hex digits of a register; digits that changed in the last step are amber. */
function HexDigits({ now, before }: { now: bigint; before: bigint }) {
  const a = hex64(now), b = hex64(before);
  return (
    <span className={mono}>
      {[...a].map((d, i) => (
        <span key={i} style={{ color: d !== b[i] ? C.amber : undefined, fontWeight: d !== b[i] ? 700 : undefined }}
          className={i % 4 === 0 && i > 0 ? "ml-[3px]" : undefined}>{d}</span>
      ))}
    </span>
  );
}

function decimal(v: bigint) {
  const s = signed(v, 64);
  return s < BigInt(0) ? `${s} / ${v}` : `${v}`;
}

export function CpuFigure({ t, programs }: { t?: TrackTranslations; programs: CpuProgramId[] }) {
  const [pid, setPid] = useState<CpuProgramId>(programs[0]);
  const [removedBy, setRemovedBy] = useState<Partial<Record<CpuProgramId, number[]>>>({});
  const [bodyRef, bodyW] = useWidth<HTMLDivElement>();
  const side = bodyW >= 820;
  const narrow = bodyW > 0 && bodyW < 520;          // phone: drop the indentation and the address column
  const prog = CPU_PROGRAMS[pid];
  const showAddr = !narrow || !!prog.bytes;
  const removed = useMemo(() => new Set((removedBy[pid] ?? []).flatMap(i => prog.cuts?.[i] ?? [])), [removedBy, pid, prog]);
  const { img, snaps } = useMemo(() => run(prog.code, removed, !!prog.snippet), [prog, removed]);
  const s = useStepper(snaps.length - 1, 1000, 500);
  const k = Math.max(0, Math.min(snaps.length - 1, Math.floor(s.raw + 1e-9)));
  const snap: Snap = snaps[k];
  const before = snaps[Math.max(0, k - 1)].state;
  const st = snap.state;
  const nextLine = st.exit === undefined ? img.instrs[img.byAddr.get(st.rip) ?? -1]?.line : undefined;
  const cutAt = new Map((prog.cuts ?? []).map((g, i) => [g[0], i] as const));
  const cutLines = new Set((prog.cuts ?? []).flat());

  const toggleCut = (i: number) => {
    const cur = removedBy[pid] ?? [];
    setRemovedBy({ ...removedBy, [pid]: cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i] });
    s.restart();
  };
  const choose = (id: CpuProgramId) => { setPid(id); s.restart(); };

  // ── What the last step did ──
  let note: string;
  if (snap.line === -1) {
    note = tx(t, "figAsmCpu_start", "Before the first instruction. rip holds the address of the first one; press the step button to run it.");
  } else if (snap.line === "ghost") {
    note = tx(t, "figAsmCpu_ghost", "There is no exit, so the CPU carries on with whatever bytes follow the code. They are zeros, and the bytes 00 00 mean add [rax], al: add al to the byte at the address in rax. rax still holds 17, the result of write, and address 17 belongs to nobody.");
  } else if (st.fault) {
    note = tx(t, "figAsmCpu_faultHere", "This instruction could not finish: the address it works out is not one the program may use.");
  } else {
    note = tx(t, `figAsmCpu_${pid}_${snap.line}`, prog.notes[snap.line] ?? "");
  }
  const fault = st.fault ? tx(t, "figAsmCpu_fault", "Segmentation fault: the program touched address {a}, which is not mapped in its memory. Linux stops it, and the shell reports exit status 139 = 128 + 11, the number of the signal SIGSEGV.")
    .replace("{a}", hexAddr(st.faultAddr ?? 0)) : "";
  const ended = !prog.snippet || k === snaps.length - 1;

  const explain = (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">
        {note}{fault && <> <span style={{ color: C.red }}>{fault}</span></>}
      </p>
      {prog.snippet && k === snaps.length - 1 && (
        <p className="text-[12px] text-[var(--text-muted)]">{tx(t, "figAsmCpu_end", "End of the fragment. A whole program would go on to exit through a system call.")}</p>
      )}
    </div>
  );

  // ── Registers ──
  const regRow = (name: string, now: bigint, prev: bigint, hot: boolean) => (
    <div key={name} className={`grid grid-cols-[3.2rem_auto] gap-x-3 items-baseline rounded px-1.5 py-0.5 ${hot ? "bg-[var(--primary-low)]" : ""}`}>
      <span className={`${mono} text-[12px] font-bold text-[var(--text-main)]`}>{name}</span>
      <span className="flex flex-col min-w-0">
        <span className="text-[12px] text-[var(--text-main)]"><HexDigits now={now} before={prev} /></span>
        {name !== "rip" && <span className={`${mono} text-[10.5px] text-[var(--text-muted)] truncate`}>{decimal(now)}</span>}
      </span>
    </div>
  );

  const flagBox = (name: string, on: boolean, was: boolean) => (
    <span key={name} className={`${mono} text-[11px] px-1.5 py-0.5 rounded border`}
      style={{ borderColor: on !== was ? C.amber : "var(--border)", color: on ? "var(--text-main)" : "var(--text-muted)" }}>
      {name}={on ? 1 : 0}
    </span>
  );

  const watchRow = (w: Watch) => {
    const base = img.symbols.get(w.sym) ?? 0;
    const cells = Array.from({ length: w.len }, (_, i) => base + i);
    const byte = (a: number) => st.mem.get(a) ?? 0;
    const color = (a: number) => snap.fx.mem.has(a) ? C.amber : snap.fx.read.has(a) ? C.sky : undefined;
    return (
      <div key={w.sym} className="flex flex-col gap-1">
        <span className={`${mono} text-[10.5px] text-[var(--text-muted)]`}>{w.sym} @ {hexAddr(base)}</span>
        <div className="flex flex-wrap gap-[3px]" style={{ flexWrap: "wrap" }}>
          {w.as === "text" ? cells.map(a => (
            <span key={a} className={`${mono} flex flex-col items-center w-[1.55rem] rounded border text-[10px] leading-tight py-0.5`}
              style={{ borderColor: color(a) ?? "var(--code-border)", background: "var(--code-surface)" }}>
              <span className="text-[var(--text-main)] text-[11px]">{byte(a) === 10 ? "\\n" : byte(a) === 32 ? "␣" : String.fromCharCode(byte(a))}</span>
              <span className="text-[var(--text-muted)]">{byte(a).toString(16).padStart(2, "0")}</span>
            </span>
          )) : Array.from({ length: w.len / 4 }, (_, j) => {
            const a = base + 4 * j;
            const v = byte(a) | byte(a + 1) << 8 | byte(a + 2) << 16 | byte(a + 3) << 24;
            const c = [0, 1, 2, 3].map(i => color(a + i)).find(Boolean);
            return (
              <span key={a} className={`${mono} flex flex-col items-center rounded border px-1.5 py-0.5 leading-tight`}
                style={{ borderColor: c ?? "var(--code-border)", background: "var(--code-surface)" }}>
                <span className="text-[12px] text-[var(--text-main)]">{v}</span>
                <span className="text-[9.5px] text-[var(--text-muted)]">{[0, 1, 2, 3].map(i => byte(a + i).toString(16).padStart(2, "0")).join(" ")}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const flagsNow = st.flags, flagsWas = before.flags;
  const showOut = !prog.snippet;

  return (
    <Figure
      title={tx(t, "figAsmCpu_title", "A CPU, one instruction at a time")}
      head={programs.length > 1 ? (
        <Choice value={pid} onChange={choose}
          options={programs.map(id => [id, tx(t, `figAsmCpu_name_${id}`, CPU_NAMES[id])] as [CpuProgramId, string])} />
      ) : undefined}
      note={prog.cuts
        ? tx(t, "figAsmCpu_breakIt", "Break it: remove a marked line, then play again. The assembler is happy either way; the CPU simply runs what is there.")
        : tx(t, "figAsmCpu_howTo", "Step with the buttons under the code. The highlighted line has just run and the arrow marks the next one, the instruction rip points at. Amber digits are the ones that step changed.")}
    >
      <div ref={bodyRef} className={side ? "grid grid-cols-[minmax(0,11fr)_minmax(0,9fr)]" : "flex flex-col"}>
        {/* ── Code ── */}
        <div className={`p-3 ${side ? "border-r" : "border-b"} border-[var(--border)] flex flex-col gap-3 min-w-0`}>
          <ol className={`${mono} text-[12px] leading-[1.6] overflow-x-auto`}>
            {prog.code.map(([src, enc], i) => {
              const gone = removed.has(i);
              const addr = img.lineAddr[i];
              const isCode = enc !== "" && !/^\w+:\s*d[bwdq]\b/i.test(src.trim());
              const ran = snap.line === i, next = nextLine === i;
              const cut = cutAt.get(i);
              return (
                <li key={i} className={`flex items-start gap-2 rounded px-1 ${ran ? "bg-[var(--primary-low)]" : ""}`}>
                  <span className="w-3 shrink-0 text-[var(--primary)] select-none" aria-hidden>{next ? "→" : ""}</span>
                  {showAddr && (
                    <span className={`${narrow ? "w-[3.2rem]" : "w-[4.6rem]"} shrink-0 text-[var(--text-muted)] opacity-70 select-none`}>
                      {isCode && addr !== undefined && !gone ? addr.toString(16) : ""}
                    </span>
                  )}
                  {prog.bytes && (
                    <span className={`${narrow ? "w-[6.2rem] text-[10.5px]" : "w-[9.5rem]"} shrink-0 text-[var(--text-muted)] select-none truncate`} title={enc}>
                      {isCode && !gone ? splitBytes(enc).join(" ") : ""}
                    </span>
                  )}
                  <span className={`whitespace-pre flex-1 ${gone ? "line-through opacity-40" : ran ? "text-[var(--text-main)]" : cutLines.has(i) ? "text-[var(--text-main)] opacity-80" : "text-[var(--text-muted)]"}`}>{(narrow ? compact(src) : src) || " "}</span>
                  {cut !== undefined && (
                    <button type="button" onClick={() => toggleCut(cut)}
                      className={`shrink-0 px-1.5 rounded border text-[10px] leading-[1.5] transition-colors ${gone
                        ? "border-[var(--primary)]/50 text-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                      {gone ? tx(t, "figAsmCpu_restore", "put back") : tx(t, "figAsmCpu_remove", "remove")}
                    </button>
                  )}
                </li>
              );
            })}
            {snap.line === "ghost" && (
              <li className="flex items-start gap-2 rounded px-1 bg-[var(--primary-low)]">
                <span className="w-3 shrink-0" />
                {showAddr && <span className={`${narrow ? "w-[3.2rem]" : "w-[4.6rem]"} shrink-0 text-[var(--text-muted)] opacity-70`}>{img.textEnd.toString(16)}</span>}
                <span className="whitespace-pre flex-1" style={{ color: C.red }}>00 00   add [rax], al</span>
              </li>
            )}
          </ol>
          {side && explain}
        </div>

        {/* ── CPU ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              {regRow("rip", BigInt(st.rip), BigInt(before.rip), false)}
              {prog.regs.map((r: Gpr) => regRow(r, st.regs[r], before.regs[r], snap.fx.regs.has(r)))}
            </div>
            {prog.flags && (
              <div className="flex gap-1.5 flex-wrap" style={{ flexWrap: "wrap" }}>
                {flagBox("ZF", flagsNow.zf, flagsWas.zf)}{flagBox("SF", flagsNow.sf, flagsWas.sf)}
                {flagBox("CF", flagsNow.cf, flagsWas.cf)}{flagBox("OF", flagsNow.of, flagsWas.of)}
              </div>
            )}
            {prog.watch?.map(watchRow)}
            {showOut && (
              <div className={`${mono} text-[11.5px] rounded-lg border border-[var(--code-border)] bg-[var(--code-surface)] px-3 py-2 leading-relaxed`}>
                <div className="text-[var(--text-muted)]">$ ./{prog.bin ?? "prog"}</div>
                <div className="text-[var(--text-main)] whitespace-pre-wrap">{st.out.replace(/\n$/, "") || " "}</div>
                {st.fault && <div style={{ color: C.red }}>Segmentation fault (core dumped)</div>}
                {st.exit !== undefined && ended && <>
                  <div className="text-[var(--text-muted)]">$ echo $?</div>
                  <div className="text-[var(--text-main)]">{st.exit}</div>
                </>}
              </div>
            )}
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figAsmCpu_step", "step")} ${k} / ${snaps.length - 1}`} />
          {!side && <div className="px-4 pb-4">{explain}</div>}
        </div>
      </div>
    </Figure>
  );
}
