"use client";

// ── Chapter steps ────────────────────────────────────────────────────────────
// Reads the rendered chapter and
//   • splits it into steps at each <h2> that is a direct child of the article
//     (content before the first h2 is step 0, the introduction), tagging every
//     child with data-step so focus mode can show one step at a time;
//   • numbers the figures in document order ("<chapter>.<n>") on their title
//     span (data-fig-no), which learn.css turns into "fig. 3.2 — …". Numbers
//     come from here rather than a CSS counter because a counter skips the
//     figures on hidden focus-mode steps.
// Chapters load lazily and re-render on language change, so the DOM is watched
// instead of read once. No chapter module needs to know about any of this.

import { useEffect, useState, type RefObject } from "react";

export interface ChapterStep {
  /** The step's heading text; null for the introduction. */
  title: string | null;
  /** id of the step's h2 (for "On this page"); null for the introduction. */
  id: string | null;
}

const TITLE_SPAN = ":scope > :first-child:not([data-stage]) > span:first-child";

function tag(root: HTMLElement, chapterNo: number): ChapterStep[] {
  // Figures, numbered in reading order across the whole body
  root.querySelectorAll<HTMLElement>("[data-figure]").forEach((fig, i) => {
    const title = fig.querySelector<HTMLElement>(TITLE_SPAN);
    const no = `${chapterNo}.${i + 1}`;
    if (title && title.dataset.figNo !== no) title.dataset.figNo = no;
  });

  // Steps
  const article = root.querySelector("article");
  if (!article) return [];
  const steps: ChapterStep[] = [];
  let current = -1;
  for (const child of Array.from(article.children) as HTMLElement[]) {
    if (child.tagName === "H2") {
      steps.push({ title: child.textContent ?? "", id: child.id || null });
      current = steps.length - 1;
    } else if (current === -1) {
      steps.push({ title: null, id: null });
      current = 0;
    }
    const s = String(current);
    if (child.dataset.step !== s) child.dataset.step = s;
  }
  return steps;
}

const same = (a: ChapterStep[], b: ChapterStep[]) =>
  a.length === b.length && a.every((s, i) => s.title === b[i].title && s.id === b[i].id);

/** Tags the chapter under `rootRef` and returns its steps; re-runs when the chapter changes. */
export function useChapterSteps(rootRef: RefObject<HTMLElement | null>, chapterNo: number, chapterKey: string) {
  const [steps, setSteps] = useState<ChapterStep[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const run = () => {
      const next = tag(root, chapterNo);
      setSteps((prev) => (same(prev, next) ? prev : next));
    };
    const schedule = () => { clearTimeout(timer); timer = window.setTimeout(run, 50); };
    run();
    // Our own data-* writes are attribute changes, which this observer ignores
    const mo = new MutationObserver(schedule);
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => { clearTimeout(timer); mo.disconnect(); };
  }, [rootRef, chapterNo, chapterKey]);

  return steps;
}
