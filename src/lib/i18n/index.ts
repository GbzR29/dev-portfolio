// src/lib/i18n/index.ts
import { homeTranslations } from "./home/homeTranslations";
import { blogTranslations } from "./blog/blogTranslations";

export const translations = {
  en: { ...homeTranslations.en, ...blogTranslations.en },
  pt: { ...homeTranslations.pt, ...blogTranslations.pt },
  zh: { ...homeTranslations.zh, ...blogTranslations.zh },
  es: { ...homeTranslations.es, ...blogTranslations.es },
};

export type Language = keyof typeof translations;
