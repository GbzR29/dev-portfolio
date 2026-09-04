// src/lib/tracks/tx.ts
import type { TrackTranslations } from "./types";

/**
 * Returns the translated string for `key`, or `fallback` when the bundle has no
 * entry for it. Chapters always pass real English prose as the fallback, so a
 * missing translation degrades to English instead of showing a key name.
 */
export function tx(t: TrackTranslations, key: string, fallback: string): string {
  const val = t?.[key];
  return val && val.length > 0 ? val : fallback;
}
