// src/lib/tracks/types.ts

import { ReactNode } from "react";

/**
 * The translation bundle handed to chapter content. Chapters look keys up
 * dynamically through a `tx(t, key, fallback)` helper and fall back to English,
 * so every key is optional and a missing bundle is valid.
 */
export type TrackTranslations = Record<string, string | undefined> | undefined;

export interface Chapter {
  id: string;
  title: string;
  minRead?: number;
  /**
   * Optional category heading. Consecutive chapters sharing a section are
   * grouped under one collapsible header in the sidebar. Chapters stay a flat
   * ordered list, so numbering, progress and prev/next are unaffected.
   */
  section?: string;
  /** Content is a function so it can receive the current translations object */
  content: (t: TrackTranslations) => ReactNode;
}

export interface Track {
  id: string;
  title: string;
  chapters: Chapter[];
}