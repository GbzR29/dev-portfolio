// src/lib/tracks/crumbs.ts
// The start of every /learn breadcrumb: "learn / <track>", with the track's
// name in the current language (trackName_<id> in the learning bundle).

import type { Crumb } from "@/components/lesson/LearnTopBar";
import { TRACK_CATALOG } from "./catalog";

type Strings = Record<string, string | undefined>;

/** Looked up in the catalog, so "coming soon" tracks (no chapters yet) are named too. */
export function trackName(t: Strings, trackPath: string): string {
  const info = TRACK_CATALOG.find((i) => i.path === trackPath);
  return (info && t[`trackName_${info.id}`]) ?? info?.title ?? trackPath;
}

export function trackCrumbs(t: Strings, trackPath: string): Crumb[] {
  return [
    { label: t.learnCrumb ?? "learn", href: "/learn" },
    { label: trackName(t, trackPath), href: `/learn/${encodeURIComponent(trackPath)}` },
  ];
}
