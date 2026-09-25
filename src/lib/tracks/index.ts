// src/lib/tracks/index.ts
// Joins each track's catalog entry (./catalog.ts) with its chapter list.
// To add a new track (e.g. Vulkan): add it to TRACK_CATALOG, create
// src/lib/tracks/vulkan/index.tsx following gamedev/index.tsx, and register
// its chapters below.

import type { Chapter, Track } from "./types";
import { TRACK_CATALOG } from "./catalog";
import { openGLChapters } from "./opengl";
import { glslChapters }   from "./glsl";
import { cppChapters }    from "./cpp";
import { sdl3Chapters }   from "./sdl3";
import { gameDevChapters } from "./gamedev";
import { mathChapters }   from "./math";

// Keyed by catalog id.
const CHAPTERS: Record<string, Chapter[]> = {
  opengl:  openGLChapters,
  glsl:    glslChapters,
  cpp:     cppChapters,
  sdl3:    sdl3Chapters,
  gamedev: gameDevChapters,
  math:    mathChapters,
};

// Keyed by route segment (/learn/[trackPath]). Built once, so every lookup of
// the same path returns the same object.
const ALL_TRACKS: Record<string, Track> = Object.fromEntries(
  TRACK_CATALOG
    .filter((info) => CHAPTERS[info.id])
    .map((info) => [info.path, { id: info.id, title: info.title, chapters: CHAPTERS[info.id] }]),
);

export function getTrack(trackPath: string): Track | undefined {
  return ALL_TRACKS[trackPath];
}

export { ALL_TRACKS };
