// src/lib/reference/types.ts
//
// Data model for the per-track API reference (e.g. /learn/OpenGL/reference).
// Entries are plain data so the same source feeds the reference pages, the
// hover cards in code blocks and the "functions used in this chapter" list.

import type { Language } from "@/lib/i18n";

/** Text in English plus an optional Portuguese translation. Other languages fall back to English. */
export type Localized = { en: string; pt?: string };

export interface RefParam {
  name: string;
  /** C type as written in the signature, e.g. "GLenum" or "const void *". */
  type: string;
  desc: Localized;
  /** Common accepted values (usually enum constants). */
  values?: { name: string; desc: Localized }[];
}

export interface RefEntry {
  /** Exact function name — also the URL slug. */
  name: string;
  /** Key of a category in the reference's `categories` list. */
  category: string;
  /** Full C prototype. */
  signature: string;
  /** One sentence — shown in hover cards and lists. */
  summary: Localized;
  /** A few beginner-friendly paragraphs, separated by blank lines. */
  description?: Localized;
  params: RefParam[];
  returns?: Localized;
  /** Minimum OpenGL version (or extension) that provides the function. */
  since?: string;
  /** Present when the function belongs to the legacy/compatibility API. */
  deprecated?: Localized;
  /** Pitfalls and practical advice, rendered as a bullet list. */
  notes?: Localized[];
  errors?: { code: string; when: Localized }[];
  /** Short, complete usage example. */
  example?: string;
  /** Names of related entries. */
  related?: string[];
  /** Link to the official Khronos page. */
  khronos?: string;
  /** Present on a family page (glUniform*): the functions it groups and how to read their names. */
  family?: { members: string[]; suffixes?: { part: string; desc: Localized }[] };
  /** Id of a drawing shown under "How it works" (components/reference/diagrams). */
  diagram?: string;
}

export interface RefCategory {
  id: string;
  title: Localized;
}

export interface Reference {
  /** Route segment of the owning track, e.g. "OpenGL". */
  trackPath: string;
  title: string;
  categories: RefCategory[];
  entries: RefEntry[];
  /** Regex that finds candidate identifiers in code/prose (must use the `g` flag). */
  tokenPattern: RegExp;
}

/** The name as shown: family pages get a trailing * (glUniform*). */
export function displayName(entry: RefEntry): string {
  return entry.family ? `${entry.name}*` : entry.name;
}

/** "GL 4.5" → 4.5; undefined for entries without a version (families). */
export function sinceVersion(entry: RefEntry): number | undefined {
  const m = entry.since?.match(/(\d+)\.(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 10 : undefined;
}

export function loc(text: Localized | undefined, language: Language): string {
  if (!text) return "";
  if (language === "pt" && text.pt) return text.pt;
  return text.en;
}
