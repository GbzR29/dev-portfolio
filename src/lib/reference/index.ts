// src/lib/reference/index.ts
// Registry of API references, keyed by the same route segment as ALL_TRACKS.

import type { RefEntry, Reference } from "./types";
import { openGLReference } from "./opengl";

const ALL_REFERENCES: Record<string, Reference> = {
  OpenGL: openGLReference,
};

export function getReference(trackPath: string): Reference | undefined {
  return ALL_REFERENCES[trackPath];
}

const indexCache = new WeakMap<Reference, Map<string, RefEntry>>();

/** Name → entry lookup, built once per reference. */
export function referenceIndex(ref: Reference): Map<string, RefEntry> {
  let index = indexCache.get(ref);
  if (!index) {
    index = new Map(ref.entries.map((e) => [e.name, e]));
    indexCache.set(ref, index);
  }
  return index;
}

export function referenceHref(ref: Reference, name?: string): string {
  const base = `/learn/${encodeURIComponent(ref.trackPath)}/reference`;
  return name ? `${base}/${name}` : base;
}

export type { Reference, RefEntry, RefCategory, RefParam, Localized } from "./types";
export { loc } from "./types";
