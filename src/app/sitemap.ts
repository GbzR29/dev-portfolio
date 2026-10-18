// app/sitemap.ts → /sitemap.xml
// Every public page for search engines: Home in English and Portuguese (/pt,
// linked to each other as hreflang alternates), the book and the blog. The
// courses moved to From Scratch Lab, which has its own sitemap.

import type { MetadataRoute } from "next";
import { SITE_URL, pathInLang } from "@/lib/site";

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
  return [
    ...bothLanguages("/", { changeFrequency: "monthly", priority: 1 }),
    { url: `${SITE_URL}/the-weight-of-being`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.5 },
  ];
}
