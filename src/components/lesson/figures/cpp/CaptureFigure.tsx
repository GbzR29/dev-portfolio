"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { C, Choice, Figure } from "@/components/lesson/kit/figure";
import { useStepper } from "@/components/lesson/kit/Stepper";
import { Transport } from "@/components/lesson/kit/Transport";
import { CAP_SCRIPTS, type CapMode, type CapProgram } from "./captureData";

// ── What this figure shows ────────────────────────────────────────────────────
// What a lambda captures, made visible. Three short programs each run with the
// variable captured by value or by reference. On the right: the stack frames,
// the closure object the lambda expression creates (a copy shows its own
// value, a reference shows "→ main.bonus"), what the compiler writes for the
// lambda, and the console. In "outlives its scope" the reference capture is
// the break-it case: the frame it points into dies and the call reads it.

const PROGRAMS: CapProgram[] = ["later", "outlive", "counter"];
const NAMES: Record<CapProgram, string> = { later: "change after capture", outlive: "outlives its scope", counter: "a counter" };

export function CaptureFigure({ t }: { t?: TrackTranslations }) {
  const [prog, setProg] = useState<CapProgram>("later");
  const [mode, setMode] = useState<CapMode>("value");
  const script = CAP_SCRIPTS[prog];
  const steps = script.steps[mode];
  const s = useStepper(steps.length - 1, 1000, 500);
  const k = Math.max(0, Math.min(steps.length - 1, Math.floor(s.raw + 1e-9)));
  const step = steps[k];
  const hot = new Set(step.hot ?? []);
  const code = script.code(script.capture[mode]);
  const bad = step.closure?.members.some(m => m.bad) ?? false;

  const pickProg = (p: CapProgram) => { setProg(p); s.restart(); };
  const pickMode = (m: CapMode) => { setMode(m); s.restart(); };

  return (
    <Figure
      title={tx(t, "figCppCap_title", "Lambda captures: a copy or a reference?")}
      head={<Choice value={prog} onChange={pickProg} options={PROGRAMS.map(p => [p, tx(t, `figCppCap_name_${p}`, NAMES[p])] as [CapProgram, string])} />}
      controls={
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[12px] text-[var(--text-main)] mr-1">{tx(t, "figCppCap_capture", "Capture")}</span>
          <Choice value={mode} onChange={pickMode} options={[
            ["value", `${script.capture.value} · ${tx(t, "figCppCap_byValue", "by value")}`],
            ["ref", `${script.capture.ref} · ${tx(t, "figCppCap_byRef", "by reference")}`],
          ]} />
        </div>
      }
      note={tx(t, "figCppCap_note", "A copy (amber) is the closure's own int, frozen at the moment the lambda was created. A reference (blue arrow) is only the address of someone else's int, read at each call. Break it: choose \"outlives its scope\" with a reference capture and watch the frame it points into disappear.")}
    >
      <div className="grid 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Code ── */}
        <div className="p-3 2xl:border-r border-b 2xl:border-b-0 border-[var(--border)] flex flex-col gap-3 min-w-0">
          <ol className="font-mono text-[12px] leading-[1.55] overflow-x-auto">
            {code.map((ln, i) => (
              <li key={i} className={`flex items-start gap-2 rounded px-1 ${step.line === i ? "bg-[var(--primary-low)]" : ""}`}>
                <span className="w-4 shrink-0 text-right text-[var(--text-muted)] opacity-60 select-none">{i + 1}</span>
                <span className={`whitespace-pre flex-1 ${step.line === i ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"}`}>{ln}</span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] leading-relaxed text-[var(--text-main)] min-h-[4.5rem]" aria-live="polite">
            {tx(t, `figCppCap_${prog}_${mode}${k}`, step.en)}
          </p>
          <div>
            <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-1">{tx(t, "figCppCap_compiled", "what the compiler writes for the lambda")}</div>
            <pre className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.5] overflow-x-auto text-[var(--text-muted)]">
              {script.compiled[mode].join("\n")}
            </pre>
          </div>
        </div>

        {/* ── Stack, closure, output ── */}
        <div className="min-w-0 flex flex-col">
          <div className="p-3 flex-1 flex flex-col gap-2 min-h-[12rem]">
            <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)]">{tx(t, "figCppCap_stack", "stack")}</div>
            {step.frames.map((f, depth) => (
              <div key={f.name} className="rounded-lg border border-dashed px-2.5 py-2 flex flex-col gap-1 font-mono text-[12px]"
                style={{ marginLeft: depth * 14, borderColor: f.dead ? C.red : "var(--code-border)", opacity: f.dead ? 0.5 : 1 }}>
                <div className="flex items-baseline gap-2 text-[11px]">
                  <span className="font-bold text-[var(--text-main)]">{f.name}</span>
                  <span style={{ color: f.dead ? C.red : "var(--text-muted)" }}>
                    {f.dead ? tx(t, "figCppCap_gone", "returned: this memory is free for reuse") : tx(t, "figCppCap_frame", "frame")}
                  </span>
                </div>
                {f.vars.map(v => {
                  const on = hot.has(`${f.name}.${v.name}`);
                  return (
                    <div key={v.name} className="flex gap-2 rounded px-1.5" style={{ background: on ? "var(--primary-low)" : undefined }}>
                      <span className="text-[var(--text-muted)]">{v.name === "add" || v.name === "tick" ? "auto" : "int"}</span>
                      <span className={`text-[var(--text-main)] ${f.dead ? "line-through" : ""}`}>{v.name}</span>
                      <span className="ml-auto" style={{ color: C.sky }}>{v.val}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mt-1">{tx(t, "figCppCap_closure", "closure object")}</div>
            {step.closure ? (
              <div className="rounded-lg border-2 px-2.5 py-2 font-mono text-[12px] bg-[var(--code-surface)]" style={{ borderColor: bad ? C.red : C.purple }}>
                <div className="text-[11px] mb-1">
                  <span className="font-bold" style={{ color: C.purple }}>Lambda</span>
                  <span className="text-[var(--text-muted)]"> · {tx(t, "figCppCap_heldBy", "held by")} {step.closure.owner}</span>
                </div>
                {step.closure.members.map(m => {
                  const on = hot.has(`closure.${m.name}`);
                  return (
                    <div key={m.name} className="flex gap-2 rounded px-1.5" style={{ background: on ? "var(--primary-low)" : undefined }}>
                      <span className="text-[var(--text-muted)]">{m.ref ? "int&" : "int"}</span>
                      <span className="text-[var(--text-main)]">{m.name}</span>
                      {m.ref
                        ? <span className="ml-auto" style={{ color: m.bad ? C.red : C.sky }}>→ {m.ref}{m.bad ? ` (${tx(t, "figCppCap_dangling", "dangling")})` : ""}</span>
                        : <span className="ml-auto" style={{ color: C.amber }}>{m.val}</span>}
                    </div>
                  );
                })}
              </div>
            ) : <span className="text-[12px] text-[var(--text-muted)]">{tx(t, "figCppCap_none", "not created yet")}</span>}
          </div>
          <div className="px-3 pb-3">
            <div className="rounded-lg bg-[var(--code-surface)] border border-[var(--code-border)] px-3 py-2 font-mono text-[11.5px] leading-[1.5] min-h-[3rem]">
              <div className="uppercase tracking-wider text-[10px] text-[var(--text-muted)] mb-0.5">{tx(t, "figCppCap_output", "output")}</div>
              {step.out.length ? step.out.map((l, i) => (
                <div key={i} style={{ color: l === "???" ? C.red : C.green }}>{l === "???" ? `??? ${tx(t, "figCppCap_ub", "(undefined behaviour)")}` : l}</div>
              )) : <div className="text-[var(--text-muted)]">—</div>}
            </div>
          </div>
          <Transport t={t} playing={s.playing} onPlay={s.play} onStep={s.next} onBack={s.prev} onReset={s.restart} speed
            readout={`${tx(t, "figCppCap_step", "step")} ${k + 1} / ${steps.length}`} />
        </div>
      </div>
    </Figure>
  );
}
