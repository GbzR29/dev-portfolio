// src/lib/tracks/dates.ts
// When each lesson was created and last changed, from git history
// (scripts/gen-chapter-dates.mjs writes the JSON before dev and build).

import DATES from "@/lib/generated/chapter-dates.json";

export type ChapterDates = { created: string; updated: string };   // YYYY-MM-DD

export function chapterDates(trackId: string | undefined, chapterId: string | undefined): ChapterDates | undefined {
  if (!trackId || !chapterId) return undefined;
  return (DATES as Record<string, ChapterDates>)[`${trackId}/${chapterId}`];
}

const LOCALES: Record<string, string> = { en: "en-GB", pt: "pt-BR", es: "es-ES", zh: "zh-CN" };

/** "2026-09-29" → "29 Sept 2026" / "29 de set. de 2026"… in the reading language. */
export function formatDate(iso: string, language: string): string {
  // Read and print in UTC, so the day never shifts with the reader's time zone
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(LOCALES[language] ?? "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}
