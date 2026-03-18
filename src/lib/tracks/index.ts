// src/lib/tracks/index.ts
// Central registry of all available tracks.
// To add a new track (e.g. Vulkan), create src/lib/tracks/vulkan/index.tsx
// following the same pattern as opengl/index.tsx, then add it here.

import { Track } from "./types";
import { openGLTrack } from "./opengl";
// import { cppTrack }    from "./cpp";    // uncomment when ready
// import { vulkanTrack } from "./vulkan"; // uncomment when ready

const ALL_TRACKS: Record<string, Track> = {
  OpenGL: openGLTrack,
  // "C++":   cppTrack,
  // Vulkan:  vulkanTrack,
};

export function getTrack(trackPath: string): Track | undefined {
  return ALL_TRACKS[trackPath];
}

export { ALL_TRACKS };