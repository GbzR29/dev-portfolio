// src/lib/tracks/sdl3/index.tsx
"use client";

// The SDL3 track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters.

import type { Chapter } from "@/lib/tracks/types";

import { WhatsNewContent } from "./chapters/whats-new";
import { SetupContent } from "./chapters/setup";
import { MainLoopContent } from "./chapters/main-loop";
import { InputContent } from "./chapters/input";
import { RendererContent } from "./chapters/renderer";
import { TexturesContent } from "./chapters/textures";
import { TextContent } from "./chapters/text";
import { AudioContent } from "./chapters/audio";
import { GpuContent } from "./chapters/gpu";
import { PlatformContent } from "./chapters/platform";

// ── Exported track ────────────────────────────────────────────────────────────

export const sdl3Chapters: Chapter[] = [
  { id: "whats-new", section: "Foundations", title: "SDL3 vs SDL2",              minRead: 9,  content: (t) => <WhatsNewContent  t={t} /> },
  { id: "setup", section: "Foundations",     title: "Setup & First Window",      minRead: 10, content: (t) => <SetupContent     t={t} /> },
  { id: "main-loop", section: "Foundations", title: "The Main Loop",             minRead: 11, content: (t) => <MainLoopContent  t={t} /> },
  { id: "input", section: "Input & 2D",     title: "Events & Input",            minRead: 12, content: (t) => <InputContent     t={t} /> },
  { id: "renderer", section: "Input & 2D",  title: "The 2D Renderer",           minRead: 10, content: (t) => <RendererContent  t={t} /> },
  { id: "textures", section: "Input & 2D",  title: "Textures & Images",         minRead: 11, content: (t) => <TexturesContent  t={t} /> },
  { id: "text", section: "Input & 2D",      title: "Text with SDL3_ttf",        minRead: 9,  content: (t) => <TextContent      t={t} /> },
  { id: "audio", section: "Audio & Graphics",     title: "Audio Streams",             minRead: 10, content: (t) => <AudioContent     t={t} /> },
  { id: "gpu", section: "Audio & Graphics",       title: "SDL_GPU — Modern Graphics", minRead: 14, content: (t) => <GpuContent       t={t} /> },
  { id: "platform", section: "Shipping",  title: "Time, Files & Shipping",    minRead: 11, content: (t) => <PlatformContent  t={t} /> },
];
