// src/lib/book.ts
// Facts about the novel shown on the Home and on /the-weight-of-being.
// Text (synopsis, status wording) lives in homeTranslations; this file holds
// only the numbers, so updating progress is a one-line change.

export const BOOK = {
  title: "The Weight of Being",
  path: "/the-weight-of-being",
  /** Share of the draft written, 0–1. null hides the progress bar. */
  progress: null as number | null,
};
