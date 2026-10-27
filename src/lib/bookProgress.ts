// src/lib/bookProgress.ts
// The numbers behind the progress bar on /the-weight-of-being ("Progress").
// This is the only file to edit when the draft moves on; the wording
// (stage names, "chapters", "updated") lives in homeTranslations.

export type BookStage = "first-draft" | "revision" | "editing" | "done";

export const BOOK_PROGRESS = {
  chaptersWritten: 11,
  chaptersTotal: 40,
  /** true while the total can still change: shows "~" before it */
  totalIsEstimate: true,
  stage: "first-draft" as BookStage,
  /** Date of the last update, YYYY-MM-DD */
  lastUpdated: "2026-10-27",
};
