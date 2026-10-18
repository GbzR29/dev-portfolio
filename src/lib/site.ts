// src/lib/site.ts
// The site's address, the language of a URL, and the links to From Scratch
// Lab, the courses site that used to live here under /learn (moved out on
// 2026-10-18; next.config.ts redirects the old /learn URLs there).

/** The site's public address (sitemap, canonical URLs, Open Graph). */
export const SITE_URL = "https://www.gabrielfrc.dev";

/** The courses site, with its English and Portuguese home pages. */
export const LEARN_URL = "https://www.fromscratchlab.com";

/** Languages with their own indexable URLs. English has no prefix. */
export type UrlLang = "en" | "pt";

/** From Scratch Lab's home page, or one of its tracks, in the given language. */
export function learnUrl(lang: UrlLang = "en", trackPath?: string): string {
  const base = lang === "pt" ? `${LEARN_URL}/pt` : LEARN_URL;
  return trackPath ? `${base}/${encodeURIComponent(trackPath)}` : base;
}

// ── Moving between the language copies ────────────────────────────────────

/** The URL language of a pathname: "pt" under /pt, else "en". */
export function langOfPath(pathname: string | null | undefined): UrlLang {
  return pathname === "/pt" || pathname?.startsWith("/pt/") ? "pt" : "en";
}

/** The same page in another language, or null when it has no copy there (only Home has one). */
export function pathInLang(pathname: string, lang: UrlLang): string | null {
  const enPath = langOfPath(pathname) === "pt" ? pathname.slice(3) || "/" : pathname;
  if (lang === "en") return enPath;
  return enPath === "/" ? "/pt" : null;
}

/** hreflang links for a page that exists in both languages (path = English path). */
export function languageAlternates(enPath: string): Record<string, string> {
  return { en: enPath, "pt-BR": pathInLang(enPath, "pt") ?? enPath, "x-default": enPath };
}
