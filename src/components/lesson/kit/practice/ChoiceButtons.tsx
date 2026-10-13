"use client";

// ── Answer buttons ────────────────────────────────────────────────────────────
// The big tappable options of a multiple-choice practice question. After an
// answer (`feedback` set) the right one turns green and, if the pick was
// wrong, the picked one red. `extra` sits at the end of the row (a "hear it
// again" button, say).

import type { ReactNode } from "react";
import type { Feedback } from "./Practice";

export function ChoiceButtons({ options, right, picked, feedback, onPick, extra }: {
  options: ReactNode[];
  /** Index of the right option. */
  right: number;
  /** Index the reader picked for this question (null before answering). */
  picked: number | null;
  feedback: Feedback;
  onPick: (i: number) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {options.map((o, i) => {
        const ok = feedback && i === right, bad = feedback && !feedback.ok && picked === i;
        const tone = ok ? "var(--pr-ok)" : bad ? "var(--pr-bad)" : null;
        return (
          <button key={i} type="button" onClick={() => onPick(i)}
            className="min-w-[3rem] h-11 px-3 rounded-xl border-2 border-b-4 text-[15px] font-bold transition active:scale-95 active:border-b-2"
            style={{
              borderColor: tone ?? "var(--border)",
              background: tone ? `color-mix(in srgb, ${tone} 18%, var(--card))` : "var(--card)",
              color: "var(--text-main)",
            }}>{o}</button>
        );
      })}
      {extra}
    </div>
  );
}
