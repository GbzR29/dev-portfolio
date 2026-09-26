// src/lib/tracks/math/index.tsx
"use client";

// The Math track: the mathematics behind computer graphics and game
// programming, from arithmetic and floating point upward, each topic with
// interactive figures.

import type { Chapter } from "@/lib/tracks/types";

const ARITHMETIC = "Arithmetic";
const FOUNDATIONS = "Foundations";
const VECTORS = "Vectors";

export const mathChapters: Chapter[] = [
  { id: "number-line",         section: ARITHMETIC, title: "Numbers & the Number Line",    minRead: 16, load: () => import("./chapters/number-line").then((m) => m.NumberLineContent) },
  { id: "order-of-operations", section: ARITHMETIC, title: "Order of Operations",          minRead: 13, load: () => import("./chapters/order-of-operations").then((m) => m.OrderOfOperationsContent) },
  { id: "fractions",           section: ARITHMETIC, title: "Fractions & Decimals",         minRead: 19, load: () => import("./chapters/fractions").then((m) => m.FractionsContent) },
  { id: "ratios",              section: ARITHMETIC, title: "Ratios, Proportion & Percent", minRead: 16, load: () => import("./chapters/ratios").then((m) => m.RatiosContent) },
  { id: "divisibility",        section: ARITHMETIC, title: "Divisibility, Primes, GCD & LCM", minRead: 17, load: () => import("./chapters/divisibility").then((m) => m.DivisibilityContent) },
  { id: "powers",              section: ARITHMETIC, title: "Powers & Roots",               minRead: 17, load: () => import("./chapters/powers").then((m) => m.PowersContent) },
  { id: "bases",               section: ARITHMETIC, title: "Number Bases & Bits",          minRead: 16, load: () => import("./chapters/bases").then((m) => m.BasesContent) },
  { id: "numbers",             section: ARITHMETIC, title: "Integers & Floating Point",    minRead: 13, load: () => import("./chapters/numbers").then((m) => m.NumbersContent) },

  { id: "algebra",   section: FOUNDATIONS, title: "Algebra & Functions",       minRead: 17, load: () => import("./chapters/algebra").then((m) => m.AlgebraContent) },
  { id: "exponents", section: FOUNDATIONS, title: "Exponents & Logarithms",    minRead: 13, load: () => import("./chapters/algebra").then((m) => m.ExpLogContent) },
  { id: "trig",      section: FOUNDATIONS, title: "Trigonometry",              minRead: 17, load: () => import("./chapters/trig").then((m) => m.TrigContent) },

  { id: "vectors",   section: VECTORS,     title: "Vectors",                   minRead: 13, load: () => import("./chapters/vectors").then((m) => m.VectorsContent) },
  { id: "dot",       section: VECTORS,     title: "The Dot Product",           minRead: 14, load: () => import("./chapters/vectors").then((m) => m.DotContent) },
  { id: "cross",     section: VECTORS,     title: "The Cross Product",         minRead: 14, load: () => import("./chapters/vectors").then((m) => m.CrossContent) },
];
