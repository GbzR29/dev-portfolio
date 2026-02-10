"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
// Importamos apenas o objeto unificado e o tipo Language do index
import { translations, Language } from "@/lib/i18n"; 

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en; // Tipagem automática para o intellisense
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Carrega o idioma salvo no carregamento inicial
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("lang", lang);
    // Opcional: Atualiza a tag lang do HTML para acessibilidade/SEO
    document.documentElement.lang = lang;
  };

  // Aqui o 't' agora contém a união de todos os seus arquivos (home, learning, blog)
  const t = translations[language];

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