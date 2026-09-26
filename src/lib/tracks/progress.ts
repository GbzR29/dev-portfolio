// src/lib/tracks/progress.ts
// Reading progress, kept in this browser only:
//   lesson:<trackId>:progress   the chapters opened in a track (JSON array of ids)
//   lesson:last                 the last chapter opened anywhere ({ track, chapter })
// /learn reads both to show progress bars and "resume where you left off".
"use client";

import { useCallback, useState } from "react";

const progressKey = (trackId: string) => `lesson:${trackId}:progress`;
const LAST_KEY = "lesson:last";

export interface LastLesson {
  /** Route segment of the track (/learn/<track>). */
  track: string;
  chapter: string;
  /** Chapter title in the language it was read in, and its 1-based number. */
  title?: string;
  number?: number;
}

export function readVisited(trackId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(progressKey(trackId));
    return stored ? new Set<string>(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function readLastLesson(): LastLesson | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.track === "string" && typeof v.chapter === "string" ? v : null;
  } catch {
    return null;
  }
}

/** Remembers the open chapter for "resume where you left off" on /learn. */
export function rememberLastLesson(last: LastLesson) {
  try { localStorage.setItem(LAST_KEY, JSON.stringify(last)); } catch { /* storage blocked */ }
}

export function useLessonProgress(trackId: string) {
  const [visited, setVisited] = useState<Set<string>>(() => readVisited(trackId));

  const markVisited = useCallback(
    (chapterId: string) => {
      setVisited((prev) => {
        if (prev.has(chapterId)) return prev;
        const next = new Set(prev);
        next.add(chapterId);
        try { localStorage.setItem(progressKey(trackId), JSON.stringify([...next])); } catch { /* storage blocked */ }
        return next;
      });
    },
    [trackId],
  );

  return { visited, markVisited };
}
