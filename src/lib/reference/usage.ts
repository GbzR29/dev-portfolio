// src/lib/reference/usage.ts
//
// Works out which reference entries each chapter mentions, straight from the
// chapter's element tree — no DOM, no build step, never out of date.
//
// Chapter content components are hook-free functions returning JSX, so the
// component can be called directly once its module is loaded; below it we only read props (code
// blocks carry their source as string children, tables as row arrays, etc.).

import { isValidElement, type ReactNode } from "react";
import type { Chapter, Track, TrackTranslations } from "@/lib/tracks/types";
import type { Reference } from "./types";
import { referenceIndex } from "./index";

function collectStrings(value: unknown, out: string[], depth: number, seen: Set<unknown>): void {
  if (value == null || typeof value === "boolean" || depth > 40) return;
  if (typeof value === "string") { out.push(value); return; }
  if (typeof value !== "object" || seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out, depth + 1, seen);
    return;
  }
  if (isValidElement(value)) {
    collectStrings(value.props, out, depth + 1, seen);
    return;
  }
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (typeof v !== "function") collectStrings(v, out, depth + 1, seen);
  }
}

async function chapterStrings(chapter: Chapter): Promise<string[]> {
  const out: string[] = [];
  const Content = await chapter.load();
  let root: ReactNode = null;
  // Expand the content component once (e.g. CameraContent with no translations).
  try {
    root = (Content as (p: { t: TrackTranslations }) => ReactNode)({ t: undefined });
  } catch {
    return out;
  }
  collectStrings(root, out, 0, new Set());
  return out;
}

// chapter → reference → names found in it (a promise, so each chapter is scanned once)
const usageCache = new WeakMap<Chapter, WeakMap<Reference, Promise<string[]>>>();

/** Reference names a chapter mentions, in order of first appearance. Loads the chapter. */
export function chapterNames(chapter: Chapter, ref: Reference): Promise<string[]> {
  let byRef = usageCache.get(chapter);
  if (!byRef) { byRef = new WeakMap(); usageCache.set(chapter, byRef); }
  let found = byRef.get(ref);
  if (!found) {
    const index = referenceIndex(ref);
    found = chapterStrings(chapter).then((strings) => {
      const names = new Set<string>();
      for (const s of strings) for (const m of s.matchAll(ref.tokenPattern)) if (index.has(m[0])) names.add(m[0]);
      return [...names];
    }, () => {
      byRef.delete(ref);           // the chapter failed to download: try again next time
      return [];
    });
    byRef.set(ref, found);
  }
  return found;
}

/** Chapters (in track order) that mention `name`. Loads every chapter of the track. */
export async function chaptersUsing(track: Track, ref: Reference, name: string): Promise<Chapter[]> {
  const lists = await Promise.all(track.chapters.map((c) => chapterNames(c, ref)));
  return track.chapters.filter((_, i) => lists[i].includes(name));
}
