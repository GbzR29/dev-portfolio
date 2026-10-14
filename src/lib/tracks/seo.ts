// src/lib/tracks/seo.ts
// What search engines and link previews see for a track or a lesson: title,
// description, canonical URL and Open Graph. Built on the server from the
// catalog and the chapter lists (English, the site's default language).

import type { Metadata } from "next";
import { TRACK_CATALOG, type TrackInfo } from "./catalog";
import { getTrack } from "./index";
import type { Chapter, Track } from "./types";
import { chapterHref, trackHref } from "./urls";
import { learningTranslations } from "@/lib/i18n/learning/learningTranslantions";

const SITE_NAME = "gabrielfrc.dev";

export function trackInfo(trackPath: string): TrackInfo | undefined {
  return TRACK_CATALOG.find((info) => info.path === trackPath);
}

/** The track's one-paragraph description from the /learn card. */
function trackDescription(info: TrackInfo): string {
  const en = learningTranslations.en as Record<string, string | undefined>;
  return en[info.descKey] ?? info.descFallback ?? `A free interactive ${info.title} course.`;
}

export function trackMetadata(trackPath: string): Metadata {
  const track = getTrack(trackPath);
  const info = trackInfo(trackPath);
  if (!track || !info) return {};
  const title = `${info.title} — free interactive course`;
  const description = trackDescription(info);
  const url = trackHref(trackPath);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
  };
}

export function findChapter(track: Track, chapterId: string): { chapter: Chapter; index: number } | undefined {
  const index = track.chapters.findIndex((c) => c.id === chapterId);
  return index < 0 ? undefined : { chapter: track.chapters[index], index };
}

export function chapterMetadata(trackPath: string, chapterId: string): Metadata {
  const track = getTrack(trackPath);
  const info = trackInfo(trackPath);
  const found = track && findChapter(track, chapterId);
  if (!track || !info || !found) return {};
  const { chapter, index } = found;
  const title = `${chapter.title} | ${info.title} course`;
  const where = chapter.section ? ` (${chapter.section})` : "";
  const description =
    `${chapter.title}: lesson ${index + 1} of ${track.chapters.length} in the free interactive ${info.title} course${where}. ` +
    "Every step explained, with live figures you can play with.";
  const url = chapterHref(trackPath, chapterId);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "article" },
  };
}
