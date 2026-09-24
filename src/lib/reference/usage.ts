// src/lib/reference/usage.ts
//
// Works out which reference entries each chapter mentions, straight from the
// chapter's element tree — no DOM, no build step, never out of date.
//
// Chapter content components are hook-free functions returning JSX, so the
// root component can be called directly; below it we only read props (code
// blocks carry their source as string children, tables as row arrays, etc.).

import { isValidElement, type ReactNode } from "react";
import type { Chapter, Track } from "@/lib/tracks/types";
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

function chapterStrings(chapter: Chapter): string[] {
  const out: string[] = [];
  let root: ReactNode = chapter.content(undefined);
  // Expand the top-level content component once (e.g. <CameraContent t={t} />).
  if (isValidElement(root) && typeof root.type === "function") {
    try {
      root = (root.type as (p: unknown) => ReactNode)(root.props);
    } catch {
      // Fall back to scanning the unexpanded element's props.
    }
  }
  collectStrings(root, out, 0, new Set());
  return out;
}

const usageCache = new WeakMap<Track, WeakMap<Reference, Map<string, string[]>>>();

/**
 * chapter id → reference names mentioned in it, in order of first appearance.
 */
export function chapterUsage(track: Track, ref: Reference): Map<string, string[]> {
  let byRef = usageCache.get(track);
  if (!byRef) { byRef = new WeakMap(); usageCache.set(track, byRef); }
  const cached = byRef.get(ref);
  if (cached) return cached;

  const index = referenceIndex(ref);
  const usage = new Map<string, string[]>();
  for (const chapter of track.chapters) {
    const found = new Set<string>();
    for (const s of chapterStrings(chapter)) {
      for (const m of s.matchAll(ref.tokenPattern)) {
        if (index.has(m[0])) found.add(m[0]);
      }
    }
    usage.set(chapter.id, [...found]);
  }
  byRef.set(ref, usage);
  return usage;
}

/** Chapters (in track order) that mention `name`. */
export function chaptersUsing(track: Track, ref: Reference, name: string): Chapter[] {
  const usage = chapterUsage(track, ref);
  return track.chapters.filter((c) => usage.get(c.id)?.includes(name));
}
