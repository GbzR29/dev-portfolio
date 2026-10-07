"use client";

// ── Lab: a figure's full-screen, guided mode ──────────────────────────────────
// Any figure can open a lab: the same drawing, full screen, beside a panel that
// walks the reader through it one small step at a time.
//   • A step is a short text, an optional goal that ticks itself as soon as the
//     figure's state meets it, an optional hint and an optional quick question.
//     Its `setup` puts the figure in the step's starting state on arrival.
//   • Insights appear only while their condition holds: the place to explain
//     what just happened when the reader moves a value that breaks something.
// The figure owns all of its state; the lab only lays it out. The inline figure
// shows a <LabButton> in its title bar and renders <Lab> next to itself.
// Styles: src/styles/lab.css.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Lightbulb, Maximize2, RotateCcw, X } from "lucide-react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export type Quiz = {
  q: ReactNode;
  options: ReactNode[];
  /** Index of the right option. */
  answer: number;
  /** Shown once the reader picks the right option (or gives up). */
  why: ReactNode;
};

export type LabStep = {
  title: string;
  body: ReactNode;
  goal?: { text: ReactNode; done: boolean };
  hint?: ReactNode;
  quiz?: Quiz;
  /** Puts the figure in this step's starting state; runs when the step opens. */
  setup?: () => void;
};

export type Insight = {
  id: string;
  /** Shown while true. */
  when: boolean;
  tone?: "info" | "warn" | "ok";
  title: string;
  body: ReactNode;
};

const TONE = { info: "var(--primary)", warn: "#f59e0b", ok: "#22c55e" } as const;

/** Fills {name} placeholders in a translated string: fill("p = {p}", { p: "0.75" }). */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

// ── Open / close ──────────────────────────────────────────────────────────────

export function useLab() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

/** The title-bar button that opens a figure's lab. */
export function LabButton({ onClick, t }: { onClick: () => void; t?: TrackTranslations }) {
  return (
    <button type="button" onClick={onClick} title={tx(t, "figLab_openTitle", "Open the guided lab, full screen")}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)] hover:border-[var(--primary)] transition-all">
      <Maximize2 size={12} strokeWidth={2.2} />
      {tx(t, "figLab_open", "explore")}
    </button>
  );
}

// ── The overlay ───────────────────────────────────────────────────────────────

export function Lab({ open, onClose, title, steps, insights = [], stage, controls, t }: {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: LabStep[];
  insights?: Insight[];
  /** The drawing, as big as the screen allows. */
  stage: ReactNode;
  /** Everything the reader can change, under the drawing. */
  controls?: ReactNode;
  t?: TrackTranslations;
}) {
  const [mounted, setMounted] = useState(false);
  const [at, setAt] = useState(0);
  const [reached, setReached] = useState<boolean[]>([]);
  const [hint, setHint] = useState(false);
  const opened = useRef(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);

  const step = steps[Math.min(at, steps.length - 1)];
  const goTo = (i: number) => {
    const k = Math.max(0, Math.min(steps.length - 1, i));
    setAt(k); setHint(false);
    steps[k].setup?.();
  };

  // First opening: start the first step from its own setup
  useEffect(() => {
    if (!open) return;
    if (!opened.current) { opened.current = true; steps[0]?.setup?.(); }
    closeBtn.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A goal, once met, stays met (the dots remember it)
  const done = step?.goal?.done ?? false;
  useEffect(() => {
    if (done && !reached[at]) setReached(r => { const c = [...r]; c[at] = true; return c; });
  }, [done, at, reached]);

  // The lab owns the screen: no page scroll behind it; Esc closes it
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
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
  const ready = !step.goal || done || reached[at];
  const shown = insights.filter(s => s.when);

  return createPortal(
    <div className="lab-root fixed inset-0 z-[70] flex flex-col bg-[var(--bg)] text-[var(--text-main)]" role="dialog" aria-modal="true" aria-label={title}>
      {/* ── Top bar: title, progress, close ── */}
      <header className="flex items-center gap-3 px-3 md:px-5 h-12 flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] flex-shrink-0">{tx(t, "figLab_name", "lab")}</span>
        <span className="text-[12.5px] font-mono truncate min-w-0">{title}</span>
        <nav className="ml-auto hidden sm:flex items-center gap-1" aria-label={tx(t, "figLab_steps", "steps")}>
          {steps.map((s, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} title={s.title} aria-current={i === at ? "step" : undefined}
              className={`h-6 min-w-6 px-1 rounded-full text-[10px] font-mono border transition-all flex items-center justify-center ${i === at
                ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-low)]"
                : reached[i] ? "border-[#22c55e]/60 text-[#22c55e]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
              {reached[i] && i !== at ? <Check size={11} strokeWidth={3} /> : i + 1}
            </button>
          ))}
        </nav>
        <button ref={closeBtn} type="button" onClick={onClose} aria-label={tx(t, "figLab_close", "Back to the lesson")}
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
            <StepCard key={at} step={step} index={at} count={steps.length} done={done || !!reached[at]} hint={hint} setHint={setHint} t={t} />
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
              <button type="button" onClick={last ? onClose : () => goTo(at + 1)}
                className={`ml-auto h-9 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border transition-all ${ready
                  ? "bg-[var(--primary)] border-[var(--primary)] text-[var(--bg)] hover:opacity-90"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
                {last ? tx(t, "figLab_finish", "finish") : ready ? tx(t, "figLab_next", "next") : tx(t, "figLab_skip", "skip")}
                {!last && <ChevronRight size={15} />}
              </button>
            </div>
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

// ── One step ──────────────────────────────────────────────────────────────────

function StepCard({ step, index, count, done, hint, setHint, t }: {
  step: LabStep; index: number; count: number; done: boolean;
  hint: boolean; setHint: (v: boolean) => void; t?: TrackTranslations;
}) {
  return (
    <div className="lab-card-in">
      <p className="text-[10px] font-mono text-[var(--text-muted)] mb-1">
        {tx(t, "figLab_step", "step")} {index + 1} / {count}
      </p>
      <h3 className="text-[17px] font-semibold leading-snug mb-2.5">{step.title}</h3>
      <div className="text-[13.5px] leading-relaxed space-y-2 text-[var(--text-main)]">{step.body}</div>

      {step.goal && (
        <div className={`mt-3.5 flex items-start gap-2.5 rounded-xl border p-3 transition-colors ${done ? "border-[#22c55e]/50 bg-[#22c55e]/10" : "border-[var(--border)] bg-[var(--card)]"}`}>
          <span className={`mt-0.5 h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${done ? "lab-pop border-[#22c55e] bg-[#22c55e] text-white" : "border-[var(--text-muted)]/50"}`}>
            {done && <Check size={12} strokeWidth={3.5} />}
          </span>
          <div className="text-[12.5px] leading-relaxed">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">{tx(t, "figLab_goal", "your turn")}</span>
            {step.goal.text}
          </div>
        </div>
      )}

      {step.quiz && <QuizBox key={index} quiz={step.quiz} t={t} />}

      {step.hint && (
        <div className="mt-3">
          {hint
            ? <div className="lab-card-in text-[12.5px] leading-relaxed rounded-xl bg-[var(--primary-low)] p-3"><Lightbulb size={13} className="inline -mt-0.5 mr-1.5 text-[var(--primary)]" />{step.hint}</div>
            : <button type="button" onClick={() => setHint(true)} className="text-[11.5px] text-[var(--primary)] hover:underline inline-flex items-center gap-1"><Lightbulb size={13} />{tx(t, "figLab_hint", "show a hint")}</button>}
        </div>
      )}
    </div>
  );
}

// ── A quick question ──────────────────────────────────────────────────────────

function QuizBox({ quiz, t }: { quiz: Quiz; t?: TrackTranslations }) {
  const [picked, setPicked] = useState<number[]>([]);
  const solved = picked.includes(quiz.answer);
  const gaveUp = !solved && picked.length >= 2;
  return (
    <div className="mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <span className="text-[9.5px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">{tx(t, "figLab_quiz", "quick check")}</span>
      <div className="text-[13px] leading-relaxed mb-2.5">{quiz.q}</div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {quiz.options.map((o, i) => {
          const was = picked.includes(i), right = i === quiz.answer;
          const show = was || (gaveUp && right);
          return (
            <button key={i} type="button" disabled={solved} onClick={() => setPicked(p => (p.includes(i) ? p : [...p, i]))}
              className={`text-left px-3 py-2 rounded-lg border text-[12.5px] font-mono transition-all ${show
                ? right ? "border-[#22c55e] bg-[#22c55e]/10 text-[var(--text-main)]" : "border-[#ef4444]/60 bg-[#ef4444]/10 text-[var(--text-muted)] line-through"
                : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked.length > 0 && !solved && !gaveUp && (
        <p className="mt-2 text-[12px] text-[#ef4444]">{tx(t, "figLab_wrong", "Not quite. Try another one.")}</p>
      )}
      {(solved || gaveUp) && (
        <div className="lab-card-in mt-2.5 text-[12.5px] leading-relaxed">
          <span className="font-semibold" style={{ color: solved ? "#22c55e" : "#f59e0b" }}>
            {solved ? tx(t, "figLab_right", "Right.") : tx(t, "figLab_answer", "The answer:")}
          </span>{" "}{quiz.why}
        </div>
      )}
    </div>
  );
}
