// src/lib/tracks/urls.ts
// The one place that builds lesson URLs: /learn/<track path>/<chapter id>.
// Chapter ids and track paths are part of these URLs, so changing one breaks
// links and search results.

/** The site's public address (sitemap, canonical URLs, Open Graph). */
export const SITE_URL = "https://www.gabrielfrc.dev";

/** Route params can arrive encoded ("C%2B%2B") or not ("C++"). */
export function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function trackHref(trackPath: string): string {
  return `/learn/${encodeURIComponent(trackPath)}`;
}

export function chapterHref(trackPath: string, chapterId: string): string {
  return `${trackHref(trackPath)}/${encodeURIComponent(chapterId)}`;
}
