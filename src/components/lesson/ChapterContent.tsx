"use client";

import { lazy, Suspense, useEffect, type LazyExoticComponent } from "react";
import type { Chapter, ChapterComponent, TrackTranslations } from "@/lib/tracks/types";

// One lazy component per chapter, created once so React keeps its state.
// A failed download is forgotten, so ChapterBoundary's "Try again" refetches.
const cache = new Map<Chapter, LazyExoticComponent<ChapterComponent>>();

function lazyChapter(chapter: Chapter) {
  let C = cache.get(chapter);
  if (!C) {
    C = lazy(() => chapter.load().then(
      (component) => ({ default: component }),
      (error) => { cache.delete(chapter); throw error; },
    ));
    cache.set(chapter, C);
  }
  return C;
}

/**
 * Renders a chapter's content, downloading it on first view. `preload` starts
 * fetching another chapter (the next one) in the background, so moving on
 * does not wait for the network.
 */
export function ChapterContent({ chapter, t, preload }: { chapter: Chapter; t: TrackTranslations; preload?: Chapter }) {
  const C = lazyChapter(chapter);

  useEffect(() => {
    if (!preload) return;
    const id = setTimeout(() => { preload.load().catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, [preload]);

  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <C t={t} />
    </Suspense>
  );
}
