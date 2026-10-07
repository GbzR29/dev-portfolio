"use client";

// ── Pieces of the lab's side panel ────────────────────────────────────────────
// The step card (text, goal, quick question, hint), the quick question itself
// and the closing card shown after the last step. Types shared with Lab.tsx.

import { useState, type ReactNode } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
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
  /** A Transport button ("play", "step", "back", "reset") that pulses until the goal is met. */
  focus?: string;
};

export type Insight = {
  id: string;
  /** Shown while true. */
  when: boolean;
  tone?: "info" | "warn" | "ok";
  title: string;
  body: ReactNode;
};

const LABEL = "text-[9.5px] font-bold uppercase tracking-widest text-[var(--text-muted)] block";

// ── One step ──────────────────────────────────────────────────────────────────

export function StepCard({ step, index, count, done, hint, setHint, t }: {
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
            <span className={LABEL}>{tx(t, "figLab_goal", "your turn")}</span>
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
      <span className={`${LABEL} mb-1`}>{tx(t, "figLab_quiz", "quick check")}</span>
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

// ── After the last step ───────────────────────────────────────────────────────

export function Recap({ points, met, count, onAgain, onClose, t }: {
  /** What the lab showed, one short sentence each. */
  points: ReactNode[];
  /** Goals met, out of `count` steps with a goal. */
  met: number; count: number;
  onAgain: () => void;
  onClose: () => void;
  t?: TrackTranslations;
}) {
  return (
    <div className="lab-card-in">
      <span className="lab-pop h-11 w-11 rounded-full bg-[#22c55e] text-white flex items-center justify-center mb-3">
        <Check size={22} strokeWidth={3} />
      </span>
      <h3 className="text-[18px] font-semibold leading-snug">{tx(t, "figLab_doneTitle", "Lab complete")}</h3>
      <p className="text-[12px] font-mono text-[var(--text-muted)] mt-1 mb-3.5">
        {met} / {count} {tx(t, "figLab_goalsMet", "goals met")}
      </p>
      {points.length > 0 && (
        <>
          <span className={`${LABEL} mb-1.5`}>{tx(t, "figLab_learned", "what you saw")}</span>
          <ul className="space-y-2 mb-4">
            {points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
                <Check size={14} strokeWidth={3} className="text-[#22c55e] flex-shrink-0 mt-1" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onAgain}
          className="h-9 px-3 rounded-lg border border-[var(--border)] text-[12px] text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5">
          <RotateCcw size={13} />{tx(t, "figLab_again", "go through it again")}
        </button>
        <button type="button" onClick={onClose}
          className="ml-auto h-9 px-4 rounded-lg text-[12px] font-semibold bg-[var(--primary)] text-[var(--bg)] hover:opacity-90 flex items-center gap-1.5">
          <X size={14} />{tx(t, "figLab_close", "Back to the lesson")}
        </button>
      </div>
    </div>
  );
}
