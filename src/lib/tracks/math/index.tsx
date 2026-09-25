// src/lib/tracks/math/index.tsx
"use client";

// The Math track: the mathematics behind computer graphics and game
// programming, from arithmetic and floating point upward, each topic with
// interactive figures.

import type { Chapter } from "@/lib/tracks/types";

const FOUNDATIONS = "Foundations";
const VECTORS = "Vectors";

export const mathChapters: Chapter[] = [
  { id: "numbers",   section: FOUNDATIONS, title: "Numbers & Floating Point",  minRead: 18, load: () => import("./chapters/numbers").then((m) => m.NumbersContent) },
  { id: "algebra",   section: FOUNDATIONS, title: "Algebra & Functions",       minRead: 17, load: () => import("./chapters/algebra").then((m) => m.AlgebraContent) },
  { id: "exponents", section: FOUNDATIONS, title: "Exponents & Logarithms",    minRead: 13, load: () => import("./chapters/algebra").then((m) => m.ExpLogContent) },
  { id: "trig",      section: FOUNDATIONS, title: "Trigonometry",              minRead: 17, load: () => import("./chapters/trig").then((m) => m.TrigContent) },

  { id: "vectors",   section: VECTORS,     title: "Vectors",                   minRead: 13, load: () => import("./chapters/vectors").then((m) => m.VectorsContent) },
  { id: "dot",       section: VECTORS,     title: "The Dot Product",           minRead: 14, load: () => import("./chapters/vectors").then((m) => m.DotContent) },
  { id: "cross",     section: VECTORS,     title: "The Cross Product",         minRead: 14, load: () => import("./chapters/vectors").then((m) => m.CrossContent) },
];
