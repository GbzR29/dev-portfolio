// src/lib/tracks/index.ts
// Central registry of all available tracks.
// To add a new track (e.g. Vulkan), create src/lib/tracks/vulkan/index.tsx
// following the same pattern as opengl/index.tsx, then add it here.

import { Track } from "./types";
import { openGLTrack } from "./opengl";
import { glslTrack }   from "./glsl";
import { cppTrack }    from "./cpp";
import { sdl3Track }   from "./sdl3";
// import { vulkanTrack } from "./vulkan"; // uncomment when ready

// Keys must match the `path` field in TRACK_CONFIG (src/app/learn/page.tsx),
// since the route is /learn/[trackPath].
const ALL_TRACKS: Record<string, Track> = {
  OpenGL: openGLTrack,
  GLSL:   glslTrack,
  "C++":  cppTrack,
  SDL3:   sdl3Track,
  // Vulkan:  vulkanTrack,
};

export function getTrack(trackPath: string): Track | undefined {
  return ALL_TRACKS[trackPath];
}

export { ALL_TRACKS };