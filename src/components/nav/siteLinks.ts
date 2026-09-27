"use client";

// ── Site links ──────────────────────────────────────────────────────────────
// The main links and the language list, shared by HomeNav, LearnTopBar and
// the phone menu so they never drift apart.

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Language } from "@/lib/i18n";

export const LANGUAGES: Language[] = ["en", "pt", "es", "zh"];

export function useSiteLinks() {
  const { t } = useLanguage();
  return [
    { href: "/#about", label: t.navAbout },
    { href: "/learn", label: t.navLearn },
    { href: "/the-weight-of-being", label: t.navBook },
    { href: "/blog", label: t.navBlog },
    { href: "/#contact", label: t.navContact },
  ];
}
