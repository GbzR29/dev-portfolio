// src/lib/tracks/asm/index.tsx

// The x86-64 Assembly track: NASM, Intel syntax, Linux System V, with notes on
// Win64 and ARM64. This file only lists the chapters; each chapter's content
// lives in its own module under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

export const asmChapters: Chapter[] = [
  { id: "what-is-assembly", section: "Foundations", title: "What Is Assembly?",               minRead: 14, load: () => import("./chapters/what-is-assembly").then((m) => m.WhatIsAssemblyContent) },
  { id: "registers", section: "Foundations",        title: "Registers: The CPU's Variables",  minRead: 15, load: () => import("./chapters/registers").then((m) => m.RegistersContent) },
  { id: "first-program", section: "Foundations",    title: "Your First Program",              minRead: 16, load: () => import("./chapters/first-program").then((m) => m.FirstProgramContent) },
  { id: "mov-addressing", section: "Foundations",   title: "mov, Memory & Addressing Modes",  minRead: 16, load: () => import("./chapters/mov-addressing").then((m) => m.MovAddressingContent) },
];
