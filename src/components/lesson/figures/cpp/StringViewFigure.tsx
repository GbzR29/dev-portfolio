"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { VIEW_CODE, VIEW_PROGRAMS, VIEW_STEPS, hex, type Buf, type ViewProgram, type ViewStep } from "./viewModel";

// ── What this figure shows ────────────────────────────────────────────────────
// A std::string_view is a pointer and a length into characters someone else
// owns. Four short programs: a slice made without copying, then the three
// ways a view goes wrong: the string reallocates when it grows, the string
// was a temporary, and data() handed to a C function that expects a '\0'.
// Stack variables on top, heap buffers below with one cell per character
// (the view's characters in blue, freed buffers in red), the console last.

const NAMES: Record<ViewProgram, string> = {
  slice: "a slice",
  grow: "the string grows",
  temp: "a temporary",
  cstr: "printf(\"%s\")",
};

function BufferRow({ b, step, t }: { b: Buf; step: ViewStep; t?: TrackTranslations }) {
  const view = step.vars.find(v => v.kind === "view");
  const cells = Array.from({ length: b.cap + 1 }, (_, i) => i);
  return (
    <div className="rounded-lg border px-2 py-1.5" style={{ borderColor: b.freed ? C.red : "var(--code-border)", borderStyle: b.freed ? "dashed" : "solid" }}>
      <div className="flex gap-2 items-baseline font-mono text-[11px] mb-1 flex-wrap">
        <span className="text-[var(--text-main)]">{hex(b.addr)}</span>
        <span className="text-[var(--text-muted)]">
          {b.freed ? tx(t, "figCppSv_freed", "freed") : `${tx(t, "figCppSv_ownedBy", "owned by")} ${b.owner} · ${tx(t, "figCppSv_cap", "capacity")} ${b.cap}`}
        </span>
      </div>
      <div className="flex font-mono text-[11px]" style={{ flexWrap: "wrap", gap: 2 }}>
        {cells.map(i => {
          const addr = b.addr + i;
          const ch = i < b.text.length ? b.text[i] : i === b.text.length ? "\\0" : "";
          const inView = view && view.kind === "view" && addr >= view.ptr && addr < view.ptr + view.len;
          const inScan = step.scan && addr >= step.scan.ptr && addr < step.scan.ptr + step.scan.len;
          const col = inView ? (b.freed ? C.red : C.sky) : inScan ? C.amber : undefined;
          return (
            <span key={i} className="inline-flex items-center justify-center rounded-sm"
              style={{
                width: 17, height: 21,
                border: `1px solid ${col ?? "var(--code-border)"}`,
                background: col ? `color-mix(in srgb, ${col} 20%, transparent)` : i > b.text.length ? "transparent" : "var(--code-surface)",
                color: ch === "\\0" ? C.purple : b.freed ? "var(--text-muted)" : "var(--text-main)",
                opacity: i > b.text.length ? 0.4 : 1,
                fontSize: ch === "\\0" ? 9 : 11,
              }}>{ch === " " ? "·" : ch}</span>
          );
        })}
      </div>
    </div>
  );
}

export function StringViewFigure({ t }: { t?: TrackTranslations }) {
  const [prog, setProg] = useState<ViewProgram>("slice");
  const steps = VIEW_STEPS[prog];
  const s = useStepper(steps.length - 1, 1300, 500);
  const k = Math.max(0, Math.min(steps.length - 1, Math.floor(s.raw + 1e-9)));
  const step = steps[k];
  const code = VIEW_CODE[prog];
  const pick = (p: ViewProgram) => { setProg(p); s.restart(); };

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const freedAt = new Set(step.bufs.filter(b => b.freed).map(b => b.addr));

  return (
    <Figure
      title={tx(t, "figCppSv_title", "std::string_view: a pointer and a length into someone else's characters")}
      head={<Choice value={prog} onChange={pick} options={VIEW_PROGRAMS.map(p => [p, tx(t, `figCppSv_name_${p}`, NAMES[p])] as [ViewProgram, string])} />}
      note={tx(t, "figCppSv_note", "Blue cells are the characters sv covers; dots are spaces. Start with \"a slice\", then break it three ways: let the string grow, view a temporary, and pass data() to printf.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {code.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${i === step.line ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${i === step.line ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[6rem]" aria-live="polite">
            {tx(t, `figCppSv_s_${step.id}`, step.en)}
          </p>
        </div>

        {/* ── Stack, heap, output ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex-1 flex flex-col gap-3 min-h-[15rem]">
            <div>
              {label(tx(t, "figCppSv_stack", "stack"))}
              <div className="flex flex-col gap-1.5">
                {step.vars.map(v => {
                  const dangling = v.kind === "view" && freedAt.has(step.bufs.find(b => v.ptr >= b.addr && v.ptr <= b.addr + b.cap)?.addr ?? -1);
                  return (
                    <div key={v.name} className="rounded-lg border px-2.5 py-1.5 font-mono text-[12px] flex gap-x-3 gap-y-0.5 flex-wrap items-baseline"
                      style={{ borderColor: dangling ? C.red : v.kind === "view" ? C.sky : "var(--code-border)", opacity: v.kind === "string" && v.dead ? 0.5 : 1 }}>
                      <span className="text-[var(--text-muted)]">{v.kind === "view" ? "std::string_view" : "std::string"}</span>
                      <span className={`text-[var(--text-main)] font-bold ${v.kind === "string" && v.dead ? "line-through" : ""}`}>{v.name}</span>
                      <span className="text-[var(--text-muted)]">data <span style={{ color: dangling ? C.red : C.sky }}>{hex(v.ptr)}</span></span>
                      <span className="text-[var(--text-muted)]">size <span className="text-[var(--text-main)]">{v.kind === "view" ? v.len : v.size}</span></span>
                      {v.kind === "string" && <span className="text-[var(--text-muted)]">capacity <span className="text-[var(--text-main)]">{v.cap}</span></span>}
                      <span className="ml-auto text-[10px] text-[var(--text-muted)]">{v.kind === "view" ? "16 B" : "32 B"}</span>
                      {dangling && <span className="w-full text-[11px]" style={{ color: C.red }}>{tx(t, "figCppSv_dangling", "dangling: points into freed memory")}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              {label(tx(t, "figCppSv_heap", "heap"))}
              <div className="flex flex-col gap-1.5">
                {step.bufs.map(b => <BufferRow key={b.addr} b={b} step={step} t={t} />)}
              </div>
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.5] min-h-[3rem]">
              {label(tx(t, "figCppSv_output", "output"))}
              {step.out.length ? step.out.map((l, i) => (
                <div key={i} style={{ color: l.bad ? C.red : l.warn ? C.amber : C.green }}>
                  {l.bad ? `??? ${tx(t, "figCppSv_ub", "(undefined behaviour)")}` : l.text}
                </div>
              )) : <div className="text-[var(--text-muted)]">—</div>}
            </div>
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppSv_step", "step")} ${k + 1} / ${steps.length}`} />
        </div>
      </div>
    </Figure>
  );
}
