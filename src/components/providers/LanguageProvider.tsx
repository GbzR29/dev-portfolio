"use client";

// ── Language ────────────────────────────────────────────────────────────────
// Pages under /pt (only Home, since the courses moved out) are Portuguese by URL, so
// search engines index them in PT; visiting one also saves PT as the reader's
// choice. Elsewhere the saved choice applies (English by default). Picking a
// language moves to that language's copy of the page when there is one.

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { translations, Language } from "@/lib/i18n";
import { langOfPath, pathInLang } from "@/lib/site";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const urlLang: Language | null = langOfPath(pathname) === "pt" ? "pt" : null;
  const [saved, setSaved] = useState<Language>("en");
  const language = urlLang ?? saved;

  // The saved choice, read once; a /pt page makes PT the choice
  useEffect(() => {
    if (urlLang) {
      setSaved(urlLang);
      localStorage.setItem("lang", urlLang);
      return;
    }
    const stored = localStorage.getItem("lang") as Language;
    if (stored && translations[stored]) setSaved(stored);
  }, [urlLang]);

  useEffect(() => {
    document.documentElement.lang = language === "pt" ? "pt-BR" : language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setSaved(lang);
    localStorage.setItem("lang", lang);
    // Move to this page's copy in the new language, if it has one
    const target = lang === "pt" || lang === "en" ? pathInLang(pathname, lang) : pathInLang(pathname, "en");
    if (target && target !== pathname) router.push(target + window.location.search + window.location.hash);
  };

  const t = translations[language] as typeof translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
