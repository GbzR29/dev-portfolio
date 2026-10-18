// src/lib/og/cards.tsx
// What each page's preview image says, in English or Portuguese. The
// opengraph-image.tsx files in src/app only pick one of these.

import type { UrlLang } from "@/lib/site";
import { renderOgCard } from "./card";

const COPY = {
  en: {
    homeEyebrow: "C++ · computer graphics",
    homeDetail: "Interactive courses on OpenGL, Vulkan, C++, math and physics at fromscratchlab.com",
    homeFooter: "portfolio · book · blog",
  },
  pt: {
    homeEyebrow: "C++ · computação gráfica",
    homeDetail: "Cursos interativos de OpenGL, Vulkan, C++, matemática e física em fromscratchlab.com",
    homeFooter: "portfólio · livro · blog",
  },
};

export function homeImage(lang: UrlLang) {
  const c = COPY[lang];
  return renderOgCard({ eyebrow: c.homeEyebrow, title: "Gabriel Carvalho", detail: c.homeDetail, footer: c.homeFooter });
}
