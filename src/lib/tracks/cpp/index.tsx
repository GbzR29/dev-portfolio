// src/lib/tracks/cpp/index.tsx

// The C/C++ track: C first, then modern C++. This file only lists the chapters;
// each chapter's content lives in its own module under ./chapters and is
// loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

export const cppChapters: Chapter[] = [
  { id: "history", section: "Origins",                 title: "The Story of C and C++",       minRead: 13, load: () => import("./chapters/history").then((m) => m.HistoryContent) },
  { id: "c-basics", section: "C Foundations",          title: "C: Your First Program",        minRead: 14, load: () => import("./chapters/c-basics").then((m) => m.CBasicsContent) },
  { id: "c-pointers", section: "C Foundations",        title: "Pointers",                     minRead: 15, load: () => import("./chapters/c-pointers").then((m) => m.CPointersContent) },
  { id: "c-memory", section: "C Foundations",          title: "Stack, Heap & Lifetime",       minRead: 15, load: () => import("./chapters/c-memory").then((m) => m.CMemoryContent) },
  { id: "c-strings-structs", section: "C Foundations", title: "Strings, Structs & Unions",    minRead: 14, load: () => import("./chapters/c-strings-structs").then((m) => m.CStringsStructsContent) },
  { id: "c-preprocessor-build", section: "C Foundations", title: "The Preprocessor & the Build", minRead: 15, load: () => import("./chapters/c-preprocessor-build").then((m) => m.CPreprocessorBuildContent) },
  { id: "c-undefined-behavior", section: "C Foundations", title: "Undefined Behaviour",       minRead: 14, load: () => import("./chapters/c-undefined-behavior").then((m) => m.CUndefinedBehaviorContent) },
  { id: "c-io-files", section: "C Foundations",        title: "Input, Output & Files",        minRead: 15, load: () => import("./chapters/c-io-files").then((m) => m.CIoFilesContent) },
  { id: "c-to-cpp", section: "From C to C++",          title: "From C to C++",                minRead: 14, load: () => import("./chapters/c-to-cpp").then((m) => m.CToCppContent) },
  { id: "landscape", section: "First Steps in C++",           title: "C++ Today: A First Program",   minRead: 12, load: () => import("./chapters/landscape").then((m) => m.LandscapeContent) },
  { id: "cpp-references", section: "First Steps in C++",      title: "References, Overloading & Namespaces", minRead: 15, load: () => import("./chapters/cpp-references").then((m) => m.CppReferencesContent) },
  { id: "cpp-classes", section: "First Steps in C++",         title: "Classes, Constructors & Destructors", minRead: 16, load: () => import("./chapters/cpp-classes").then((m) => m.CppClassesContent) },
  { id: "cpp-strings-vectors", section: "First Steps in C++", title: "std::string & std::vector",    minRead: 15, load: () => import("./chapters/cpp-strings-vectors").then((m) => m.CppStringsVectorsContent) },
  { id: "values", section: "Language Core",      title: "Values, Copies & Initialization", minRead: 17, load: () => import("./chapters/values").then((m) => m.ValuesContent) },
  { id: "move", section: "Language Core",        title: "Move Semantics",               minRead: 18, load: () => import("./chapters/move").then((m) => m.MoveContent) },
  { id: "raii", section: "Language Core",        title: "RAII & Smart Pointers",        minRead: 18, load: () => import("./chapters/raii").then((m) => m.RaiiContent) },
  { id: "cpp-inheritance", section: "Objects & Functions", title: "Inheritance & Virtual Functions", minRead: 17, load: () => import("./chapters/cpp-inheritance").then((m) => m.CppInheritanceContent) },
  { id: "cpp-lambdas", section: "Objects & Functions",     title: "Lambdas & Function Objects",   minRead: 16, load: () => import("./chapters/cpp-lambdas").then((m) => m.CppLambdasContent) },
  { id: "cpp-containers", section: "Objects & Functions",  title: "Containers: Choosing the Right One", minRead: 17, load: () => import("./chapters/cpp-containers").then((m) => m.CppContainersContent) },
  { id: "templates", section: "Generic C++",  title: "Templates & Generic Code",     minRead: 18, load: () => import("./chapters/templates").then((m) => m.TemplatesContent) },
  { id: "concepts", section: "Generic C++",    title: "Concepts & Constraints",       minRead: 16, load: () => import("./chapters/concepts").then((m) => m.ConceptsContent) },
  { id: "constexpr", section: "Generic C++",   title: "Compile-Time C++",             minRead: 17, load: () => import("./chapters/constexpr").then((m) => m.ConstexprContent) },
  { id: "ranges", section: "Standard Library",      title: "Ranges & Views",               minRead: 16, load: () => import("./chapters/ranges").then((m) => m.RangesContent) },
  { id: "errors", section: "Standard Library",      title: "Error Handling",               minRead: 19, load: () => import("./chapters/errors").then((m) => m.ErrorsContent) },
  { id: "vocabulary", section: "Standard Library",  title: "Vocabulary Types",             minRead: 17, load: () => import("./chapters/vocabulary").then((m) => m.VocabularyContent) },
  { id: "modules", section: "Systems & Performance",     title: "Modules & Build Hygiene",      minRead: 16, load: () => import("./chapters/modules").then((m) => m.ModulesContent) },
  { id: "concurrency", section: "Systems & Performance", title: "Concurrency & Threads",        minRead: 19, load: () => import("./chapters/concurrency").then((m) => m.ConcurrencyContent) },
  { id: "performance", section: "Systems & Performance", title: "Performance & Data Layout",    minRead: 18, load: () => import("./chapters/performance").then((m) => m.PerformanceContent) },
  { id: "cpp26", section: "What's Next",       title: "What's New in C++26",          minRead: 15, load: () => import("./chapters/cpp26").then((m) => m.Cpp26Content) },
  { id: "tooling", section: "What's Next",     title: "Tooling, Build & Sanitizers",  minRead: 17, load: () => import("./chapters/tooling").then((m) => m.ToolingContent) },
];
