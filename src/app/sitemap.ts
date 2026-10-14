// app/sitemap.ts → /sitemap.xml
// Every public page for search engines: the main pages, each track and each
// lesson (with the date it last changed, from chapter-dates.json).

import type { MetadataRoute } from "next";
import { ALL_TRACKS } from "@/lib/tracks";
import { chapterDates } from "@/lib/tracks/dates";
import { SITE_URL, chapterHref, trackHref } from "@/lib/tracks/urls";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/learn`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/the-weight-of-being`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const [trackPath, track] of Object.entries(ALL_TRACKS)) {
    pages.push({ url: SITE_URL + trackHref(trackPath), changeFrequency: "weekly", priority: 0.8 });
    for (const chapter of track.chapters) {
      const dates = chapterDates(track.id, chapter.id);
      pages.push({
        url: SITE_URL + chapterHref(trackPath, chapter.id),
        lastModified: dates?.updated,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return pages;
}
