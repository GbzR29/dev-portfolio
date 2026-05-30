// src/lib/i18n/index.ts
import { homeTranslations } from "./home/homeTranslations";
import { learningTranslations } from "./learning/learningTranslantions";
import { blogTranslations } from "./blog/blogTranslations";
import { openglTranslations } from "./opengl/openglTranslations";
import { glslTranslations } from "./glsl/glslTranslations";

export const translations = {
  en: {
    ...homeTranslations.en,
    ...learningTranslations.en,
    ...blogTranslations.en,
    ...openglTranslations.en,
    ...glslTranslations.en,
  },
  pt: {
    ...homeTranslations.pt,
    ...learningTranslations.pt,
    ...blogTranslations.pt,
    ...openglTranslations.pt,
    ...glslTranslations.pt,
  },
  zh: {
    ...homeTranslations.zh,
    ...learningTranslations.zh,
    ...blogTranslations.zh,
    ...openglTranslations.zh,
    ...glslTranslations.zh,
  },
  es: {
    ...homeTranslations.es,
    ...learningTranslations.es,
    ...blogTranslations.es,
    ...openglTranslations.es,
    ...glslTranslations.es,
  }
};

export type Language = keyof typeof translations;