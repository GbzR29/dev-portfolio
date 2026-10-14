"use client";

// ── Lesson look ─────────────────────────────────────────────────────────────
// The "clean reading" layout of every lesson (piloted on OpenGL, then made the
// default for all tracks on 2026-10-14): a wide stage where text, figures,
// code and tables share one width (learn.css, .lesson-wide); notes and tips as
// chips that open a popover, warnings as an always-open card; long code that
// folds; sections that fold from their heading; and code names in prose shown
// as inline code (proseCode.tsx). Components read it through useLessonLook();
// outside a lesson page it is off, so the components keep their plain look.

import { createContext, useContext } from "react";

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
