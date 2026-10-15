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
  { id: "arithmetic-flags", section: "Control Flow & Functions", title: "Arithmetic & Flags",          minRead: 17, load: () => import("./chapters/arithmetic-flags").then((m) => m.ArithmeticFlagsContent) },
  { id: "jumps-loops", section: "Control Flow & Functions",      title: "Jumps & Loops",               minRead: 16, load: () => import("./chapters/jumps-loops").then((m) => m.JumpsLoopsContent) },
  { id: "stack-calls", section: "Control Flow & Functions",      title: "The Stack & Function Calls",  minRead: 16, load: () => import("./chapters/stack-calls").then((m) => m.StackCallsContent) },
  { id: "calling-convention", section: "Control Flow & Functions", title: "The Calling Convention",    minRead: 17, load: () => import("./chapters/calling-convention").then((m) => m.CallingConventionContent) },
];
