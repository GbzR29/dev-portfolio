// src/lib/i18n/index.ts
import { homeTranslations } from "./home/homeTranslations";
import { learningTranslations } from "./learning/learningTranslantions";
import { blogTranslations } from "./blog/blogTranslations";

export const translations = {
  en: {
    ...homeTranslations.en,
    ...learningTranslations.en,
    ...blogTranslations.en,
  },
  pt: {
    ...homeTranslations.pt,
    ...learningTranslations.pt,
    ...blogTranslations.pt,
  },
  zh: {
    ...homeTranslations.zh,
    ...learningTranslations.zh,
    ...blogTranslations.zh,
  },
  es: {
    ...homeTranslations.es,
    ...learningTranslations.es,
    ...blogTranslations.es,
  }
};

export type Language = keyof typeof translations;