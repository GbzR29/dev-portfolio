// src/lib/tracks/music/index.tsx
"use client";

// The Music track: music from the ground up, every idea heard. Sound itself
// first (pitch, timbre, loudness), then rhythm, notes and the staff, scales and
// harmony. The widgets play through the audio kit (components/lesson/kit/audio).

import type { Chapter } from "@/lib/tracks/types";

const SOUND = "Sound";

export const musicChapters: Chapter[] = [
  { id: "what-is-sound", section: SOUND, title: "What Is Sound?", minRead: 14, load: () => import("./chapters/what-is-sound").then((m) => m.WhatIsSoundContent) },
  { id: "pitch", section: SOUND, title: "Pitch and Frequency", minRead: 16, load: () => import("./chapters/pitch").then((m) => m.PitchContent) },
  { id: "timbre", section: SOUND, title: "Timbre and Harmonics", minRead: 17, load: () => import("./chapters/timbre").then((m) => m.TimbreContent) },
  { id: "loudness", section: SOUND, title: "Loudness and the Envelope", minRead: 18, load: () => import("./chapters/loudness").then((m) => m.LoudnessContent) },
];
