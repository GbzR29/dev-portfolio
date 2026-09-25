// src/lib/tracks/cpp/index.tsx
"use client";

// The Modern C++ track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters.

import type { Chapter } from "@/lib/tracks/types";
import { LandscapeContent } from "./chapters/landscape";
import { ValuesContent } from "./chapters/values";
import { MoveContent } from "./chapters/move";
import { RaiiContent } from "./chapters/raii";
import { TemplatesContent } from "./chapters/templates";
import { ConceptsContent } from "./chapters/concepts";
import { ConstexprContent } from "./chapters/constexpr";
import { RangesContent } from "./chapters/ranges";
import { ErrorsContent } from "./chapters/errors";
import { VocabularyContent } from "./chapters/vocabulary";
import { ModulesContent } from "./chapters/modules";
import { ConcurrencyContent } from "./chapters/concurrency";
import { PerformanceContent } from "./chapters/performance";
import { Cpp26Content } from "./chapters/cpp26";
import { ToolingContent } from "./chapters/tooling";

export const cppChapters: Chapter[] = [
  { id: "landscape", section: "Language Core",   title: "The Modern C++ Landscape",     minRead: 9,  content: (t) => <LandscapeContent   t={t} /> },
  { id: "values", section: "Language Core",      title: "Initialization & Values",      minRead: 10, content: (t) => <ValuesContent      t={t} /> },
  { id: "move", section: "Language Core",        title: "Move Semantics",               minRead: 12, content: (t) => <MoveContent        t={t} /> },
  { id: "raii", section: "Language Core",        title: "RAII & Smart Pointers",        minRead: 12, content: (t) => <RaiiContent        t={t} /> },
  { id: "templates", section: "Generic C++",   title: "Templates & Generic Code",     minRead: 11, content: (t) => <TemplatesContent   t={t} /> },
  { id: "concepts", section: "Generic C++",    title: "Concepts & Constraints",       minRead: 9,  content: (t) => <ConceptsContent    t={t} /> },
  { id: "constexpr", section: "Generic C++",   title: "Compile-Time C++",             minRead: 10, content: (t) => <ConstexprContent   t={t} /> },
  { id: "ranges", section: "Standard Library",      title: "Ranges & Views",               minRead: 11, content: (t) => <RangesContent      t={t} /> },
  { id: "errors", section: "Standard Library",      title: "Error Handling",               minRead: 11, content: (t) => <ErrorsContent      t={t} /> },
  { id: "vocabulary", section: "Standard Library",  title: "Vocabulary Types",             minRead: 10, content: (t) => <VocabularyContent  t={t} /> },
  { id: "modules", section: "Systems & Performance",     title: "Modules & Build Hygiene",      minRead: 11, content: (t) => <ModulesContent     t={t} /> },
  { id: "concurrency", section: "Systems & Performance", title: "Concurrency & Threads",        minRead: 13, content: (t) => <ConcurrencyContent t={t} /> },
  { id: "performance", section: "Systems & Performance", title: "Performance & Data Layout",    minRead: 13, content: (t) => <PerformanceContent t={t} /> },
  { id: "cpp26", section: "What's Next",       title: "What's New in C++26",          minRead: 10, content: (t) => <Cpp26Content       t={t} /> },
  { id: "tooling", section: "What's Next",     title: "Tooling, Build & Sanitizers",  minRead: 11, content: (t) => <ToolingContent     t={t} /> },
];
