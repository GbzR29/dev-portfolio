// src/lib/tracks/crumbs.ts
// The start of every /learn breadcrumb: "learn / <track>", with the track's
// name in the current language (trackName_<id> in the learning bundle).

import type { Crumb } from "@/components/lesson/LearnTopBar";
import { getTrack } from "./index";

type Strings = Record<string, string | undefined>;

export function trackName(t: Strings, trackPath: string): string {
  const track = getTrack(trackPath);
  return (track && t[`trackName_${track.id}`]) ?? track?.title ?? trackPath;
}

export function trackCrumbs(t: Strings, trackPath: string): Crumb[] {
  return [
    { label: t.learnCrumb ?? "learn", href: "/learn" },
    { label: trackName(t, trackPath), href: `/learn/${encodeURIComponent(trackPath)}` },
  ];
}
