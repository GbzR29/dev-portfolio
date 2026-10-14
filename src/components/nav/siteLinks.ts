"use client";

// ── Site links ──────────────────────────────────────────────────────────────
// The main links and the language list, shared by HomeNav, LearnTopBar and
// the phone menu so they never drift apart.

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Language } from "@/lib/i18n";
import { homeHref, useUrlLang } from "@/lib/i18n/useUrlLang";
import { learnHref } from "@/lib/tracks/urls";

export const LANGUAGES: Language[] = ["en", "pt", "es", "zh"];

export function useSiteLinks() {
  const { t } = useLanguage();
  const lang = useUrlLang();
  return [
    { href: homeHref(lang, "#about"), label: t.navAbout },
    { href: learnHref(lang), label: t.navLearn },
    { href: "/the-weight-of-being", label: t.navBook },
    { href: "/blog", label: t.navBlog },
    { href: homeHref(lang, "#contact"), label: t.navContact },
  ];
}
