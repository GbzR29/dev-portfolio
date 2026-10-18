"use client";

// The URL language of the current page ("pt" under /pt, else "en"), so links
// built with the helpers in lib/site.ts stay in the same copy.

import { usePathname } from "next/navigation";
import { langOfPath, type UrlLang } from "@/lib/site";

export function useUrlLang(): UrlLang {
  return langOfPath(usePathname());
}

/** "/" → "/pt" and "/#about" → "/pt#about" on Portuguese pages. */
export function homeHref(lang: UrlLang, hash = ""): string {
  return (lang === "pt" ? "/pt" : "/") + hash;
}
