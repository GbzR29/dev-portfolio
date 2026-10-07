// src/lib/tracks/types.ts

import type { ComponentType } from "react";

/**
 * The translation bundle handed to chapter content. Chapters look keys up
 * dynamically through a `tx(t, key, fallback)` helper and fall back to English,
 * so every key is optional and a missing bundle is valid.
 */
export type TrackTranslations = Record<string, string | undefined> | undefined;

/** A chapter's content: a component that receives the current translations. */
export type ChapterComponent = ComponentType<{ t: TrackTranslations }>;

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
  /**
   * Ids of earlier chapters (same track) this one builds on. They are listed
   * in a "Before you start" box at the top, for review only.
   */
  requires?: string[];
  /**
   * Loads the content on demand, e.g.
   * `() => import("./chapters/legacy").then((m) => m.LegacyContent)`.
   * Only the open chapter is downloaded; the track list stays metadata only.
   */
  load: () => Promise<ChapterComponent>;
}

export interface Track {
  id: string;
  title: string;
  chapters: Chapter[];
}