// app/sitemap.ts → /sitemap.xml
// Every public page for search engines: the main pages, each track and each
// lesson in English and in Portuguese (/pt, linked to each other as hreflang
// alternates), and the API reference pages.

import type { MetadataRoute } from "next";
import { ALL_TRACKS } from "@/lib/tracks";
import { chapterDates } from "@/lib/tracks/dates";
import { SITE_URL, chapterHref, learnHref, pathInLang, trackHref } from "@/lib/tracks/urls";
import { getReference, referenceHref } from "@/lib/reference";

type Entry = MetadataRoute.Sitemap[number];
type Extra = Pick<Entry, "lastModified" | "changeFrequency" | "priority">;

/** The English page and its /pt copy, each listing both languages. */
function bothLanguages(enPath: string, extra: Extra): Entry[] {
  const ptPath = pathInLang(enPath, "pt") ?? enPath;
  const languages = { en: SITE_URL + enPath, "pt-BR": SITE_URL + ptPath, "x-default": SITE_URL + enPath };
  return [
    { url: SITE_URL + enPath, alternates: { languages }, ...extra },
    { url: SITE_URL + ptPath, alternates: { languages }, ...extra },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    ...bothLanguages("/", { changeFrequency: "monthly", priority: 1 }),
    ...bothLanguages(learnHref(), { changeFrequency: "weekly", priority: 0.9 }),
    { url: `${SITE_URL}/the-weight-of-being`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const [trackPath, track] of Object.entries(ALL_TRACKS)) {
    pages.push(...bothLanguages(trackHref(trackPath), { changeFrequency: "weekly", priority: 0.8 }));
    for (const chapter of track.chapters) {
      const dates = chapterDates(track.id, chapter.id);
      pages.push(...bothLanguages(chapterHref(trackPath, chapter.id), {
        lastModified: dates?.updated,
        changeFrequency: "monthly",
        priority: 0.7,
      }));
    }

    const reference = getReference(trackPath);
    if (reference) {
      pages.push({ url: SITE_URL + referenceHref(reference), changeFrequency: "monthly", priority: 0.6 });
      for (const entry of reference.entries) {
        pages.push({ url: SITE_URL + referenceHref(reference, entry.name), changeFrequency: "monthly", priority: 0.5 });
      }
    }
  }
  return pages;
}
