"use client";

// ── Lab: a figure's full-screen, guided mode ──────────────────────────────────
// Any figure can open a lab: the same drawing, full screen, beside a panel that
// walks the reader through it one small step at a time.
//   • A step is a short text, an optional goal that ticks itself as soon as the
//     figure's state meets it, an optional hint and an optional quick question.
//     Its `setup` puts the figure in the step's starting state on arrival.
//   • Insights appear only while their condition holds: the place to explain
//     what just happened when the reader moves a value that breaks something.
//   • After the last step a closing card recaps what the lab showed.
// The figure owns all of its state; the lab only lays it out. The inline figure
// calls useLab("<id>"), shows a <LabButton> in its title bar and renders <Lab>
// next to itself. URL, back button and saved progress: useLab.ts. Panel pieces:
// LabParts.tsx. Styles: src/styles/lab.css.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Maximize2, RotateCcw, X } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Recap, StepCard, type Insight, type LabStep } from "./LabParts";
import type { LabHandle } from "./useLab";

export type { Insight, LabStep, Quiz } from "./LabParts";
export { useLab, type LabHandle } from "./useLab";

const TONE = { info: "var(--primary)", warn: "#f59e0b", ok: "#22c55e" } as const;

/** Fills {name} placeholders in a translated string: fill("p = {p}", { p: "0.75" }). */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

// ── The button that opens it ──────────────────────────────────────────────────

/** The title-bar button that opens a figure's lab; ticked once the lab is finished. */
export function LabButton({ lab, t }: { lab: LabHandle; t?: TrackTranslations }) {
  const done = lab.progress.done;
  return (
    <button type="button" onClick={lab.show} data-lab-for={lab.id}
      title={done ? tx(t, "figLab_openDone", "Lab finished: open it again") : tx(t, "figLab_openTitle", "Open the guided lab, full screen")}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${done
        ? "border-[#22c55e]/60 text-[#22c55e] bg-[#22c55e]/10 hover:border-[#22c55e]"
        : "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)] hover:border-[var(--primary)]"}`}>
      {done ? <Check size={12} strokeWidth={3} /> : <Maximize2 size={12} strokeWidth={2.2} />}
      {tx(t, "figLab_open", "explore")}
    </button>
  );
}

// ── The overlay ───────────────────────────────────────────────────────────────

export function Lab({ lab, title, steps, insights = [], stage, controls, recap = [], t }: {
  lab: LabHandle;
  title: string;
  steps: LabStep[];
  insights?: Insight[];
  /** The drawing, as big as the screen allows. */
  stage: ReactNode;
  /** Everything the reader can change, under the drawing. */
  controls?: ReactNode;
  /** The closing card's points: what the lab showed, one sentence each. */
  recap?: ReactNode[];
  t?: TrackTranslations;
}) {
  const { open, hide, progress, setProgress } = lab;
  const [mounted, setMounted] = useState(false);
  const [at, setAt] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hint, setHint] = useState(false);
  const opened = useRef(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);

  const reached = new Set(progress.reached);
  const step = steps[Math.min(at, steps.length - 1)];
  const goTo = (i: number) => {
    const k = Math.max(0, Math.min(steps.length - 1, i));
    setAt(k); setHint(false); setFinished(false);
    steps[k].setup?.();
  };

  // First opening: start the first step from its own setup. Its state lands on
  // the next render, so the goal check below skips this one (the figure's
  // state before the setup could already meet the goal).
  const settling = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (!opened.current) { opened.current = true; settling.current = !!steps[0]?.setup; steps[0]?.setup?.(); }
    closeBtn.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A goal, once met, stays met: the dots (and the saved progress) remember it
  const done = step?.goal?.done ?? false;
  useEffect(() => {
    if (settling.current) { settling.current = false; return; }
    if (open && done && !progress.reached.includes(at)) setProgress({ ...progress, reached: [...progress.reached, at] });
  }, [open, done, at, progress, setProgress]);

  // The lab owns the screen: no page scroll behind it; Esc closes it
  const closeRef = useRef(hide);
  closeRef.current = hide;
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    return () => { html.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!mounted || !open || !step) return null;
  const last = at === steps.length - 1;
  const ready = !step.goal || done || reached.has(at);
  const shown = insights.filter(s => s.when);
  const withGoal = steps.map((s, i) => (s.goal ? i : -1)).filter(i => i >= 0);
  const finish = () => { setProgress({ ...progress, done: true }); setFinished(true); };

  return createPortal(
    <div className="lab-root fixed inset-0 z-[70] flex flex-col bg-[var(--bg)] text-[var(--text-main)]" role="dialog" aria-modal="true" aria-label={title}
      data-lab-focus={!finished && step.focus && !ready ? step.focus : undefined}>
      {/* ── Top bar: title, progress, close ── */}
      <header className="flex items-center gap-3 px-3 md:px-5 h-12 flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] flex-shrink-0">{tx(t, "figLab_name", "lab")}</span>
        <span className="text-[12.5px] font-mono truncate min-w-0">{title}</span>
        <nav className="ml-auto hidden sm:flex items-center gap-1" aria-label={tx(t, "figLab_steps", "steps")}>
          {steps.map((s, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} title={s.title} aria-current={i === at && !finished ? "step" : undefined}
              className={`h-6 min-w-6 px-1 rounded-full text-[10px] font-mono border transition-all flex items-center justify-center ${i === at && !finished
                ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-low)]"
                : reached.has(i) ? "border-[#22c55e]/60 text-[#22c55e]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
              {reached.has(i) && (i !== at || finished) ? <Check size={11} strokeWidth={3} /> : i + 1}
            </button>
          ))}
        </nav>
        <button ref={closeBtn} type="button" onClick={hide} aria-label={tx(t, "figLab_close", "Back to the lesson")}
          className="ml-auto sm:ml-2 h-8 px-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 flex items-center gap-1.5 text-[11px] flex-shrink-0">
          <X size={15} /><span className="hidden md:inline">{tx(t, "figLab_close", "Back to the lesson")}</span>
        </button>
      </header>

      {/* ── Body: drawing + controls | step + insights. On phones the two
           columns dissolve (display: contents) into one ordered column with the
           drawing pinned on top. ── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden flex flex-col md:flex-row">
        <section className="contents md:flex md:flex-col md:flex-1 md:min-w-0 md:overflow-y-auto">
          <div className="lab-stage order-1 md:order-none sticky top-0 z-10 md:static bg-[var(--code-bg)] border-b border-[var(--border)] p-2 md:p-6 flex items-center justify-center select-none shadow-[0_10px_16px_-14px_rgb(0_0_0/0.5)] md:shadow-none">
            <div className="w-full max-w-[1100px]">{stage}</div>
          </div>
          {controls && <div className="order-3 md:order-none p-4 md:px-6 md:py-5 space-y-3 bg-[var(--card)] md:flex-1">{controls}</div>}
        </section>

        <aside className="contents md:flex md:flex-col md:w-[400px] md:flex-shrink-0 md:border-l md:border-[var(--border)] md:overflow-y-auto md:bg-[var(--surface)]">
          <div className="order-2 md:order-none p-4 md:p-5 bg-[var(--surface)] border-b md:border-b-0 border-[var(--border)]">
            {finished ? (
              <Recap points={recap} met={withGoal.filter(i => reached.has(i)).length} count={withGoal.length}
                onAgain={() => goTo(0)} onClose={hide} t={t} />
            ) : (
              <>
                <StepCard key={at} step={step} index={at} count={steps.length} done={done || reached.has(at)} hint={hint} setHint={setHint} t={t} />
                <div className="flex items-center gap-2 mt-4">
                  <button type="button" onClick={() => goTo(at - 1)} disabled={at === 0} aria-label={tx(t, "figLab_back", "back")}
                    className="h-9 w-9 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-35 disabled:pointer-events-none flex items-center justify-center">
                    <ChevronLeft size={16} />
                  </button>
                  {step.setup && (
                    <button type="button" onClick={() => step.setup?.()} title={tx(t, "figLab_redo", "start this step again")} aria-label={tx(t, "figLab_redo", "start this step again")}
                      className="h-9 w-9 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button type="button" onClick={last ? finish : () => goTo(at + 1)}
                    className={`ml-auto h-9 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border transition-all ${ready
                      ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--bg)] hover:opacity-90"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                    {last ? tx(t, "figLab_finish", "finish") : ready ? tx(t, "figLab_next", "next") : tx(t, "figLab_skip", "skip")}
                    {!last && <ChevronRight size={15} />}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="order-4 md:order-none p-4 md:p-5 md:pt-0 space-y-2.5 bg-[var(--surface)] min-h-[40px]">
            {shown.length > 0 && (
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[var(--text-muted)] pt-1">{tx(t, "figLab_insights", "what's happening")}</p>
            )}
            {shown.map(s => (
              <div key={s.id} className="lab-card-in rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 border-l-[3px]" style={{ borderLeftColor: TONE[s.tone ?? "info"] }}>
                <p className="text-[12.5px] font-semibold mb-1" style={{ color: TONE[s.tone ?? "info"] }}>{s.title}</p>
                <div className="text-[12.5px] leading-relaxed text-[var(--text-main)]">{s.body}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
