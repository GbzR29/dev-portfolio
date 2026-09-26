"use client";

// ── Focus mode ───────────────────────────────────────────────────────────────
// Reading mode shows the whole chapter; focus mode shows one step (one h2
// section, see useChapterSteps) at a time, with a progress bar on top and
// back / continue below. ← → keys and a horizontal swipe also move between
// steps. The mode is remembered in this browser; the step lives in ?step=.

import { useCallback, useEffect, useState, type RefObject } from "react";
import type { ChapterStep } from "./useChapterSteps";

export type LessonMode = "read" | "focus";
const MODE_KEY = "lesson:mode";

// ── Mode ─────────────────────────────────────────────────────────────────────

export function useLessonMode() {
  const [mode, setModeState] = useState<LessonMode>("read");
  useEffect(() => {
    try { if (localStorage.getItem(MODE_KEY) === "focus") setModeState("focus"); } catch { /* storage blocked */ }
  }, []);
  const setMode = useCallback((m: LessonMode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* storage blocked */ }
  }, []);
  return [mode, setMode] as const;
}

export function ModeToggle({ mode, onChange, labels }: {
  mode: LessonMode;
  onChange: (m: LessonMode) => void;
  labels: { read: string; focus: string; title: string };
}) {
  return (
    <div role="group" aria-label={labels.title} className="inline-flex rounded-full border border-[var(--border-strong)] p-0.5 font-mono text-[12px]">
      {(["read", "focus"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`px-3 py-0.5 rounded-full transition-colors ${
            mode === m ? "bg-[var(--text-main)] text-[var(--bg)]" : "text-[var(--text-muted)] hover:text-[var(--primary)]"
          }`}
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
}

// ── Showing one step ─────────────────────────────────────────────────────────

/** Hides every step but `step` while focus mode is on; wires keys and swipes. */
export function useFocusView({ rootRef, enabled, step, count, go }: {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  step: number;
  count: number;
  /** Moves by ±1 (the caller decides what happens past either end). */
  go: (delta: 1 | -1) => void;
}) {
  // Visibility: re-applied whenever the chapter's DOM changes (lazy content)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const apply = () => {
      root.querySelectorAll<HTMLElement>("article > [data-step]").forEach((el) => {
        const off = enabled && el.dataset.step !== String(step);
        if (off) el.setAttribute("data-focus-off", "");
        else el.removeAttribute("data-focus-off");
      });
    };
    apply();
    if (enabled) root.setAttribute("data-focus", ""); else root.removeAttribute("data-focus");
    const mo = new MutationObserver(apply);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [rootRef, enabled, step, count]);

  // ← → keys, unless the reader is typing or using a figure's controls
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true], [data-figure]")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, go]);

  // Horizontal swipe on the text (figures, code and tables keep their own gestures)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    let start: { x: number; y: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const el = e.target as HTMLElement;
      start = e.touches.length === 1 && !el.closest("[data-figure], pre, table, .overflow-x-auto, .katex-display")
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      start = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) go(dx < 0 ? 1 : -1);
    };
    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchend", onEnd, { passive: true });
    return () => { root.removeEventListener("touchstart", onStart); root.removeEventListener("touchend", onEnd); };
  }, [rootRef, enabled, go]);
}

// ── Progress bar (top) ───────────────────────────────────────────────────────

export function FocusProgress({ steps, step, onPick, introLabel, stepOf }: {
  steps: ChapterStep[];
  step: number;
  onPick: (i: number) => void;
  introLabel: string;
  stepOf: string;
}) {
  const title = steps[step]?.title ?? introLabel;
  return (
    <div className="sticky top-[var(--nav-h)] z-20 -mx-2 px-2 pt-3 pb-2.5 mb-6 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="flex gap-1" role="tablist">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === step}
            aria-label={s.title ?? introLabel}
            title={s.title ?? introLabel}
            onClick={() => onPick(i)}
            className="flex-1 h-3 flex items-center group"
          >
            <span className={`block w-full h-[3px] rounded-full transition-colors ${
              i <= step ? "bg-[var(--primary)]" : "bg-[var(--border)] group-hover:bg-[var(--border-strong)]"
            }`} />
          </button>
        ))}
      </div>
      <p className="mt-1.5 flex justify-between gap-3 font-mono text-[11.5px] text-[var(--text-muted)]">
        <span className="truncate">{title}</span>
        <span className="flex-shrink-0 tabular-nums">{stepOf}</span>
      </p>
    </div>
  );
}

// ── Back / continue (bottom) ─────────────────────────────────────────────────

export function FocusNav({ step, steps, onGo, labels, nextChapterTitle }: {
  step: number;
  steps: ChapterStep[];
  onGo: (delta: 1 | -1) => void;
  labels: { back: string; next: string; nextChapter: string; hintKeys: string; hintSwipe: string };
  /** Shown on the last step, where "continue" opens the next chapter. */
  nextChapterTitle?: string;
}) {
  const last = step >= steps.length - 1;
  const nextTitle = last ? nextChapterTitle : steps[step + 1]?.title;
  return (
    <div className="mt-12 pt-6 border-t border-[var(--border)]">
      <div className="flex items-stretch justify-between gap-3">
        <button
          type="button"
          onClick={() => onGo(-1)}
          disabled={step === 0}
          className="font-mono text-[12.5px] px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          ← {labels.back}
        </button>
        {(!last || nextChapterTitle) && (
          <button
            type="button"
            onClick={() => onGo(1)}
            className="min-w-0 flex-1 max-w-sm grid gap-0.5 text-right px-4 py-2.5 rounded-xl bg-[var(--text-main)] text-[var(--bg)] hover:opacity-90 transition-opacity"
          >
            <span className="font-mono text-[11.5px] opacity-75">{last ? labels.nextChapter : labels.next} →</span>
            {nextTitle && <span className="font-display text-[17px] leading-snug truncate">{nextTitle}</span>}
          </button>
        )}
      </div>
      <p className="mt-3 text-center font-mono text-[11px] text-[var(--text-muted)]">
        <span className="hidden [@media(pointer:fine)]:inline">{labels.hintKeys}</span>
        <span className="[@media(pointer:fine)]:hidden">{labels.hintSwipe}</span>
      </p>
    </div>
  );
}
