// src/lib/og/cards.tsx
// What each page's preview image says, in English or Portuguese. The
// opengraph-image.tsx files in src/app only pick one of these.

import { ALL_TRACKS, getTrack } from "@/lib/tracks";
import { chapterTitle, findChapter, sectionName, trackInfo, trackName } from "@/lib/tracks/seo";
import { seoWording } from "@/lib/tracks/seoText";
import { decodeSegment, type UrlLang } from "@/lib/tracks/urls";
import { getReference, referenceIndex } from "@/lib/reference";
import { renderOgCard } from "./card";

const COPY = {
  en: {
    homeEyebrow: "C++ · computer graphics",
    homeDetail: "Free interactive courses on OpenGL, GLSL, Vulkan, C++ and math",
    homeFooter: "portfolio · courses · blog",
    learnTitle: "Learn from scratch",
    learn: "learn",
    learnDetail: "OpenGL · GLSL · Vulkan · C++ · SDL3 · Game Dev · Math · AI",
    footer: "free interactive course",
    footerMany: "free interactive courses",
    lessons: (n: number) => `${n} lessons`,
    tracks: (n: number) => `${n} tracks`,
    sections: (n: number) => `${n} sections`,
    lessonOf: (n: number, total: number) => `lesson ${n} of ${total}`,
    minRead: (n: number) => `${n} min read`,
  },
  pt: {
    homeEyebrow: "C++ · computação gráfica",
    homeDetail: "Cursos interativos e gratuitos de OpenGL, GLSL, Vulkan, C++ e matemática",
    homeFooter: "portfólio · cursos · blog",
    learnTitle: "Aprender do zero",
    learn: "aprender",
    learnDetail: "OpenGL · GLSL · Vulkan · C++ · SDL3 · Game Dev · Matemática · IA",
    footer: "curso interativo e gratuito",
    footerMany: "cursos interativos e gratuitos",
    lessons: (n: number) => `${n} lições`,
    tracks: (n: number) => `${n} trilhas`,
    sections: (n: number) => `${n} seções`,
    lessonOf: (n: number, total: number) => `lição ${n} de ${total}`,
    minRead: (n: number) => `${n} min de leitura`,
  },
};

const TRACK_PATHS = Object.keys(ALL_TRACKS);
const TOTAL_LESSONS = Object.values(ALL_TRACKS).reduce((n, t) => n + t.chapters.length, 0);

export function homeImage(lang: UrlLang) {
  const c = COPY[lang];
  return renderOgCard({ eyebrow: c.homeEyebrow, title: "Gabriel Carvalho", detail: c.homeDetail, footer: c.homeFooter });
}

export function learnImage(lang: UrlLang) {
  const c = COPY[lang];
  return renderOgCard({
    eyebrow: `${c.learn} · ${c.tracks(TRACK_PATHS.length)} · ${c.lessons(TOTAL_LESSONS)}`,
    title: c.learnTitle,
    detail: c.learnDetail,
    footer: c.footerMany,
  });
}

export function trackImage(params: { trackPath: string }, lang: UrlLang) {
  const c = COPY[lang];
  const trackPath = decodeSegment(params.trackPath);
  const track = getTrack(trackPath);
  const info = trackInfo(trackPath);
  if (!track || !info) return learnImage(lang);
  const sections = new Set(track.chapters.map((ch) => ch.section).filter(Boolean)).size;
  return renderOgCard({
    eyebrow: `${c.learn} / ${trackName(info, lang)}`,
    title: seoWording(info.id, info.title, lang).title,
    detail: [c.lessons(track.chapters.length), sections > 1 ? c.sections(sections) : ""].filter(Boolean).join(" · "),
    footer: c.footer,
    accent: info.accentColor,
  });
}

export function chapterImage(params: { trackPath: string; chapterId: string }, lang: UrlLang) {
  const c = COPY[lang];
  const trackPath = decodeSegment(params.trackPath);
  const track = getTrack(trackPath);
  const info = trackInfo(trackPath);
  const found = track && findChapter(track, decodeSegment(params.chapterId));
  if (!track || !info || !found) return trackImage(params, lang);
  const { chapter, index } = found;
  const section = sectionName(info.id, chapter.section, lang);
  return renderOgCard({
    eyebrow: [trackName(info, lang), section].filter(Boolean).join(" / "),
    title: chapterTitle(info.id, chapter, lang),
    detail: [c.lessonOf(index + 1, track.chapters.length), chapter.minRead ? c.minRead(chapter.minRead) : ""]
      .filter(Boolean).join(" · "),
    footer: c.footer,
    accent: info.accentColor,
  });
}

export function referenceImage(params: { trackPath: string; fn?: string }) {
  const trackPath = decodeSegment(params.trackPath);
  const ref = getReference(trackPath);
  const accent = trackInfo(trackPath)?.accentColor;
  const entry = ref && params.fn ? referenceIndex(ref).get(decodeSegment(params.fn)) : undefined;
  if (!ref || !entry) {
    return renderOgCard({
      eyebrow: `learn / ${trackPath} / reference`,
      title: `${trackPath} Function Reference`,
      detail: ref ? `${ref.entries.length} functions, explained for beginners` : undefined,
      footer: "free interactive course",
      accent,
    });
  }
  const category = ref.categories.find((cat) => cat.id === entry.category)?.title.en;
  return renderOgCard({
    eyebrow: [`${trackPath} reference`, category].filter(Boolean).join(" / "),
    title: entry.name,
    monoTitle: true,
    detail: entry.summary.en.length > 96 ? `${entry.summary.en.slice(0, 93).trimEnd()}…` : entry.summary.en,
    footer: "free interactive course",
    accent,
  });
}
