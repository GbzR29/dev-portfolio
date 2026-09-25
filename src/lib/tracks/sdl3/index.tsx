// src/lib/tracks/sdl3/index.tsx
"use client";

// The SDL3 track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";


// ── Exported track ────────────────────────────────────────────────────────────

export const sdl3Chapters: Chapter[] = [
  { id: "whats-new", section: "Foundations", title: "SDL3 vs SDL2",              minRead: 9,  load: () => import("./chapters/whats-new").then((m) => m.WhatsNewContent) },
  { id: "setup", section: "Foundations",     title: "Setup & First Window",      minRead: 10, load: () => import("./chapters/setup").then((m) => m.SetupContent) },
  { id: "main-loop", section: "Foundations", title: "The Main Loop",             minRead: 11, load: () => import("./chapters/main-loop").then((m) => m.MainLoopContent) },
  { id: "input", section: "Input & 2D",     title: "Events & Input",            minRead: 12, load: () => import("./chapters/input").then((m) => m.InputContent) },
  { id: "renderer", section: "Input & 2D",  title: "The 2D Renderer",           minRead: 10, load: () => import("./chapters/renderer").then((m) => m.RendererContent) },
  { id: "textures", section: "Input & 2D",  title: "Textures & Images",         minRead: 11, load: () => import("./chapters/textures").then((m) => m.TexturesContent) },
  { id: "text", section: "Input & 2D",      title: "Text with SDL3_ttf",        minRead: 9,  load: () => import("./chapters/text").then((m) => m.TextContent) },
  { id: "audio", section: "Audio & Graphics",     title: "Audio Streams",             minRead: 10, load: () => import("./chapters/audio").then((m) => m.AudioContent) },
  { id: "gpu", section: "Audio & Graphics",       title: "SDL_GPU — Modern Graphics", minRead: 14, load: () => import("./chapters/gpu").then((m) => m.GpuContent) },
  { id: "platform", section: "Shipping",  title: "Time, Files & Shipping",    minRead: 11, load: () => import("./chapters/platform").then((m) => m.PlatformContent) },
];
