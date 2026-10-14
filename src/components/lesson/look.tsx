"use client";

// ── Lesson look ─────────────────────────────────────────────────────────────
// The "clean reading" layout, tried on a few tracks before it becomes the
// default: a wide stage where figures, code and tables use the full width
// while the text keeps a comfortable line length (learn.css, .lesson-wide);
// long cards and code that fold; sections that can be folded from their
// heading; and code names in prose shown as inline code (Prose.tsx).
// Components read it through useLessonLook(); outside a lesson it is off.

import { createContext, useContext } from "react";

/** Tracks (catalog ids) that use the clean look. */
export const CLEAN_LOOK_TRACKS = new Set(["opengl"]);

export interface LessonLook {
  clean: boolean;
  /** Sections can be folded from their h2 (reading mode only; focus mode shows one at a time). */
  canFold: boolean;
  /** Heading ids of the sections folded by the reader. */
  folded: ReadonlySet<string>;
  toggleFold: (headingId: string) => void;
}

const OFF: LessonLook = { clean: false, canFold: false, folded: new Set(), toggleFold: () => {} };

export const LessonLookContext = createContext<LessonLook>(OFF);

export function useLessonLook(): LessonLook {
  return useContext(LessonLookContext);
}
