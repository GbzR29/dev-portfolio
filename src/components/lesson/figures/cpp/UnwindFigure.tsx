"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { STEP_IDS, VARIANTS, code, steps, type ErrMode, type Variant } from "./unwindModel";

// ── What this figure shows ────────────────────────────────────────────────────
// One failure, two ways to report it. load_level → load_texture → read_file,
// and the file is missing. With throw, the exception flies up the stack and
// every frame it leaves runs its destructors (stack unwinding) until main's
// catch. With std::expected, the error is an ordinary return value that each
// caller checks and passes on. Right: the call stack, what is in flight, the
// heap block and the mutex, the console. Break it: a raw new (a leak in both
// modes), noexcept on load_level or no catch (std::terminate, nothing
// cleaned), a caller that ignores the returned error.

const VARIANT_NAMES: Record<Variant, string> = {
  none: "as written",
  raw: "raw new",
  noexcept: "noexcept load_level",
  nocatch: "no catch in main",
  ignore: "ignore the result",
};

export function UnwindFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<ErrMode>("throw");
  const [variant, setVariant] = useState<Variant>("none");
  const lines = useMemo(() => code(mode, variant), [mode, variant]);
  const script = useMemo(() => steps(mode, variant), [mode, variant]);
  const ids = STEP_IDS[mode][variant] ?? [];
  const s = useStepper(script.length - 1, 1300, 500);
  const k = Math.max(0, Math.min(script.length - 1, Math.floor(s.raw + 1e-9)));
  const step = script[k];

  const pickMode = (m: ErrMode) => { setMode(m); if (!VARIANTS[m].includes(variant)) setVariant("none"); s.restart(); };
  const pickVariant = (v: Variant) => { setVariant(v); s.restart(); };

  const label = (txt: string) => <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{txt}</div>;
  const box = "rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2";
  const heapColor = step.heap === "leaked" ? C.red : step.heap === "held" ? C.amber : step.heap === "freed" ? C.green : "var(--text-muted)";
  const heapText = {
    none: tx(t, "figCppErr_heapNone", "nothing allocated"),
    held: tx(t, "figCppErr_heapHeld", "4 KiB in use"),
    freed: tx(t, "figCppErr_heapFreed", "4 KiB freed"),
    leaked: tx(t, "figCppErr_heapLeaked", "4 KiB leaked: no pointer to them is left"),
  }[step.heap];
  const flightColor = step.flight?.kind === "exception" ? C.red : step.flight?.kind === "error" ? C.amber : C.green;

  return (
    <Figure
      title={tx(t, "figCppErr_title", "One missing file: an exception against an expected")}
      head={<Choice value={mode} onChange={pickMode} options={[
        ["throw", tx(t, "figCppErr_throw", "exception")],
        ["expected", "std::expected"],
      ]} />}
      controls={
        <div className="flex gap-1.5 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppErr_breakIt", "Break it")}</span>
          <Choice value={variant} onChange={pickVariant}
            options={VARIANTS[mode].map(v => [v, tx(t, `figCppErr_v_${v}`, VARIANT_NAMES[v])] as [Variant, string])} />
        </div>
      }
      note={tx(t, "figCppErr_note", "Step through and watch the call stack: the frames that disappear, the object in flight, and whether the memory and the mutex are given back. Then break it: replace the unique_ptr with a raw new, mark load_level noexcept, remove the catch, or ignore a returned error.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[11.5px] leading-[1.55] overflow-x-auto">
            {lines.map(([id, ln], i) => {
              const on = id === step.line;
              return (
                <li key={i} className={`flex items-start gap-2 rounded px-1 ${on ? "bg-[var(--primary-low)]" : ""}`}>
                  <span className="w-5 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                  <span className={`whitespace-pre flex-1 ${on ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
                </li>
              );
            })}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[6rem]" aria-live="polite">
            {tx(t, `figCppErr_s_${ids[k]}`, step.en)}
          </p>
        </div>

        {/* ── Stack, flight, resources, output ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex-1 flex flex-col gap-2 min-h-[14rem]">
            {label(tx(t, "figCppErr_stack", "call stack"))}
            {step.frames.map((f, depth) => (
              <div key={f.fn} className="rounded-lg border border-dashed px-2.5 py-1.5 flex flex-col gap-1 font-mono text-[12px]"
                style={{ marginLeft: depth * 14, borderColor: step.dead ? C.red : "var(--code-border)" }}>
                <span className="font-bold text-[11px] text-[var(--text-main)]">{f.fn}</span>
                {f.locals.map(l => (
                  <div key={l.name} className="flex gap-2 flex-wrap">
                    <span className="text-[var(--text-muted)]">{l.type}</span>
                    <span className="text-[var(--text-main)]">{l.name}</span>
                    <span className="ml-auto" style={{ color: l.state === "bad" ? C.red : C.sky }}>{l.val}</span>
                  </div>
                ))}
              </div>
            ))}

            {step.flight && (
              <div className="rounded-lg border-2 px-2.5 py-1.5 font-mono text-[12px] bg-[var(--code-surface)]" style={{ borderColor: flightColor }}>
                <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: flightColor }}>
                  {step.flight.kind === "exception"
                    ? (step.flight.caught ? tx(t, "figCppErr_caught", "exception, caught") : tx(t, "figCppErr_flying", "exception in flight"))
                    : tx(t, "figCppErr_returned", "return value on its way up")}
                </div>
                <span className="text-[var(--text-main)] break-all">{step.flight.text}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className={box}>
                <div className="text-[10px] text-[var(--text-muted)]">{tx(t, "figCppErr_heap", "heap")}</div>
                <div className="text-[12px] font-semibold" style={{ color: heapColor }}>{heapText}</div>
              </div>
              <div className={box}>
                <div className="text-[10px] text-[var(--text-muted)]">g_assets</div>
                <div className="text-[12px] font-semibold" style={{ color: step.mutex === "locked" ? (step.dead ? C.red : C.amber) : C.green }}>
                  {step.mutex === "locked" ? tx(t, "figCppErr_locked", "locked") : tx(t, "figCppErr_unlocked", "unlocked")}
                </div>
              </div>
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className={box + " font-mono text-[11.5px] leading-[1.5] min-h-[3rem]"}>
              {label(tx(t, "figCppErr_output", "output"))}
              {step.out.length
                ? step.out.map((l, i) => <div key={i} className="break-words" style={{ color: step.dead ? C.red : C.green }}>{l}</div>)
                : <div className="text-[var(--text-muted)]">—</div>}
            </div>
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppErr_step", "step")} ${k + 1} / ${script.length}`} />
        </div>
      </div>
    </Figure>
  );
}
