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
  { id: "reading-compiler-output", section: "From C to Assembly", title: "Reading Compiler Output",       minRead: 17, load: () => import("./chapters/reading-compiler-output").then((m) => m.ReadingCompilerOutputContent) },
  { id: "arrays-structs", section: "From C to Assembly",          title: "Arrays & Structs in Memory",    minRead: 16, load: () => import("./chapters/arrays-structs").then((m) => m.ArraysStructsContent) },
  { id: "floating-point", section: "From C to Assembly",          title: "Floating Point: SSE & xmm",     minRead: 18, load: () => import("./chapters/floating-point").then((m) => m.FloatingPointContent) },
  { id: "pointers-and-memory", section: "From C to Assembly",     title: "Pointers, Memory & UB",         minRead: 17, load: () => import("./chapters/pointers-and-memory").then((m) => m.PointersAndMemoryContent) },
  { id: "simd", section: "Performance",                        title: "SIMD: SSE & AVX",               minRead: 17, load: () => import("./chapters/simd").then((m) => m.SimdContent) },
  { id: "cpu-pipeline", section: "Performance",                title: "Pipelines, Branches & Caches",  minRead: 19, load: () => import("./chapters/cpu-pipeline").then((m) => m.CpuPipelineContent) },
  { id: "arm64", section: "Performance",                       title: "ARM64 Compared",                minRead: 18, load: () => import("./chapters/arm64").then((m) => m.Arm64Content) },
  { id: "inline-asm", section: "Performance",                  title: "Inline Assembly & Intrinsics",  minRead: 16, load: () => import("./chapters/inline-asm").then((m) => m.InlineAsmContent) },
];
