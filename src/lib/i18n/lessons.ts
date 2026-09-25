// src/lib/i18n/lessons.ts
// Lesson translations, loaded on demand. English lives in the code itself (the
// tx() fallbacks and the chapter lists); other languages are small files next
// to the content they translate:
//
//   src/lib/tracks/<track>/i18n/<lang>/<chapter module>.ts   chapter text
//   src/lib/tracks/<track>/i18n/<lang>/_track.ts             chapter titles, sections
//   src/components/lesson/i18n/<lang>/<topic>.ts             widget text
//
// Only the open track's text in the chosen language is downloaded.

"use client";

import { useEffect, useState } from "react";
import type { Language } from "./index";

export type Dict = Record<string, string>;

/** What a track's translation bundle provides for one language. */
export interface LessonText {
  strings: Dict;
  /** chapter id → translated title */
  titles: Dict;
  /** English section name → translated section name */
  sections: Dict;
}

type Loader<T> = Partial<Record<Language, () => Promise<T>>>;

const TRACKS: Record<string, Loader<LessonText>> = {
  cpp:     { pt: () => import("@/lib/tracks/cpp/i18n/pt").then((m) => m.default) },
  sdl3:    { pt: () => import("@/lib/tracks/sdl3/i18n/pt").then((m) => m.default) },
  gamedev: { pt: () => import("@/lib/tracks/gamedev/i18n/pt").then((m) => m.default) },
  math:    { pt: () => import("@/lib/tracks/math/i18n/pt").then((m) => m.default) },
  opengl: {
    pt: () => import("@/lib/tracks/opengl/i18n/pt").then((m) => m.default),
    es: () => import("@/lib/tracks/opengl/i18n/es").then((m) => m.default),
    zh: () => import("@/lib/tracks/opengl/i18n/zh").then((m) => m.default),
  },
  glsl: {
    pt: () => import("@/lib/tracks/glsl/i18n/pt").then((m) => m.default),
    es: () => import("@/lib/tracks/glsl/i18n/es").then((m) => m.default),
    zh: () => import("@/lib/tracks/glsl/i18n/zh").then((m) => m.default),
  },
};

const WIDGETS: Loader<Dict> = {
  pt: () => import("@/components/lesson/i18n/pt").then((m) => m.default),
};

const EMPTY: LessonText = { strings: {}, titles: {}, sections: {} };
const cache = new Map<string, Promise<LessonText>>();

/** A track's text in a language, widgets included. English (or a missing file) resolves to EMPTY. */
export function loadLessonText(trackId: string, lang: Language): Promise<LessonText> {
  if (lang === "en") return Promise.resolve(EMPTY);
  const id = `${trackId}:${lang}`;
  let p = cache.get(id);
  if (!p) {
    const track = TRACKS[trackId]?.[lang];
    const widgets = WIDGETS[lang];
    p = Promise.all([track ? track() : EMPTY, widgets ? widgets() : {}]).then(
      ([text, w]) => ({ ...text, strings: { ...w, ...text.strings } }),
      () => { cache.delete(id); return EMPTY; },        // offline: English, retry next time
    );
    cache.set(id, p);
  }
  return p;
}

/**
 * The open track's text in the current language: `null` while it downloads,
 * so the page can wait instead of flashing English first.
 */
export function useLessonText(trackId: string | undefined, lang: Language): LessonText | null {
  const [state, setState] = useState<{ id: string; text: LessonText } | null>(null);
  const id = `${trackId}:${lang}`;
  useEffect(() => {
    if (!trackId) return;
    let alive = true;
    loadLessonText(trackId, lang).then((text) => { if (alive) setState({ id, text }); });
    return () => { alive = false; };
  }, [trackId, lang, id]);
  if (lang === "en") return EMPTY;
  return state?.id === id ? state.text : null;
}
