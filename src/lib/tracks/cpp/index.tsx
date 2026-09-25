// src/lib/tracks/cpp/index.tsx
"use client";

// The Modern C++ track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

export const cppChapters: Chapter[] = [
  { id: "landscape", section: "Language Core",   title: "The Modern C++ Landscape",     minRead: 9,  load: () => import("./chapters/landscape").then((m) => m.LandscapeContent) },
  { id: "values", section: "Language Core",      title: "Initialization & Values",      minRead: 10, load: () => import("./chapters/values").then((m) => m.ValuesContent) },
  { id: "move", section: "Language Core",        title: "Move Semantics",               minRead: 12, load: () => import("./chapters/move").then((m) => m.MoveContent) },
  { id: "raii", section: "Language Core",        title: "RAII & Smart Pointers",        minRead: 12, load: () => import("./chapters/raii").then((m) => m.RaiiContent) },
  { id: "templates", section: "Generic C++",   title: "Templates & Generic Code",     minRead: 11, load: () => import("./chapters/templates").then((m) => m.TemplatesContent) },
  { id: "concepts", section: "Generic C++",    title: "Concepts & Constraints",       minRead: 9,  load: () => import("./chapters/concepts").then((m) => m.ConceptsContent) },
  { id: "constexpr", section: "Generic C++",   title: "Compile-Time C++",             minRead: 10, load: () => import("./chapters/constexpr").then((m) => m.ConstexprContent) },
  { id: "ranges", section: "Standard Library",      title: "Ranges & Views",               minRead: 11, load: () => import("./chapters/ranges").then((m) => m.RangesContent) },
  { id: "errors", section: "Standard Library",      title: "Error Handling",               minRead: 11, load: () => import("./chapters/errors").then((m) => m.ErrorsContent) },
  { id: "vocabulary", section: "Standard Library",  title: "Vocabulary Types",             minRead: 10, load: () => import("./chapters/vocabulary").then((m) => m.VocabularyContent) },
  { id: "modules", section: "Systems & Performance",     title: "Modules & Build Hygiene",      minRead: 11, load: () => import("./chapters/modules").then((m) => m.ModulesContent) },
  { id: "concurrency", section: "Systems & Performance", title: "Concurrency & Threads",        minRead: 13, load: () => import("./chapters/concurrency").then((m) => m.ConcurrencyContent) },
  { id: "performance", section: "Systems & Performance", title: "Performance & Data Layout",    minRead: 13, load: () => import("./chapters/performance").then((m) => m.PerformanceContent) },
  { id: "cpp26", section: "What's Next",       title: "What's New in C++26",          minRead: 10, load: () => import("./chapters/cpp26").then((m) => m.Cpp26Content) },
  { id: "tooling", section: "What's Next",     title: "Tooling, Build & Sanitizers",  minRead: 11, load: () => import("./chapters/tooling").then((m) => m.ToolingContent) },
];
