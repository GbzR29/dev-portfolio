// src/lib/tracks/urls.ts
// The one place that builds lesson URLs: /learn/<track path>/<chapter id>,
// and the Portuguese copies under /pt (/pt/learn/<track>/<id>, /pt, /pt/learn).
// Chapter ids and track paths are part of these URLs, so changing one breaks
// links and search results.

/** The site's public address (sitemap, canonical URLs, Open Graph). */
export const SITE_URL = "https://www.gabrielfrc.dev";

/** Languages with their own indexable URLs. English has no prefix. */
export type UrlLang = "en" | "pt";

/** Route params can arrive encoded ("C%2B%2B") or not ("C++"). */
export function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

const prefix = (lang: UrlLang = "en") => (lang === "pt" ? "/pt" : "");

export function learnHref(lang?: UrlLang): string {
  return `${prefix(lang)}/learn`;
}

export function trackHref(trackPath: string, lang?: UrlLang): string {
  return `${learnHref(lang)}/${encodeURIComponent(trackPath)}`;
}

export function chapterHref(trackPath: string, chapterId: string, lang?: UrlLang): string {
  return `${trackHref(trackPath, lang)}/${encodeURIComponent(chapterId)}`;
}

// ── Moving between the language copies ────────────────────────────────────

/** The URL language of a pathname: "pt" under /pt, else "en". */
export function langOfPath(pathname: string | null | undefined): UrlLang {
  return pathname === "/pt" || pathname?.startsWith("/pt/") ? "pt" : "en";
}

/** Pages that have a /pt copy: Home, /learn, a track and a lesson (not the reference). */
function hasPtCopy(enPath: string): boolean {
  const m = enPath.match(/^\/learn(?:\/([^/]+)(?:\/([^/]+))?)?\/?$/);
  return enPath === "/" || (m !== null && m[2] !== "reference");
}

/** The same page in another language, or null when it has no copy there. */
export function pathInLang(pathname: string, lang: UrlLang): string | null {
  const enPath = langOfPath(pathname) === "pt" ? pathname.slice(3) || "/" : pathname;
  if (lang === "en") return enPath;
  if (!hasPtCopy(enPath)) return null;
  return enPath === "/" ? "/pt" : `/pt${enPath}`;
}

/** hreflang links for a page that exists in both languages (path = English path). */
export function languageAlternates(enPath: string): Record<string, string> {
  return { en: enPath, "pt-BR": pathInLang(enPath, "pt") ?? enPath, "x-default": enPath };
}
