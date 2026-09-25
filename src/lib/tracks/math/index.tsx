// src/lib/tracks/math/index.tsx
"use client";

// The Math track: the mathematics behind computer graphics and game
// programming, from arithmetic and floating point upward, each topic with
// interactive figures.

import type { Chapter } from "@/lib/tracks/types";
import { NumbersContent } from "./chapters/numbers";
import { AlgebraContent, ExpLogContent } from "./chapters/algebra";
import { TrigContent } from "./chapters/trig";
import { VectorsContent, DotContent, CrossContent } from "./chapters/vectors";

const FOUNDATIONS = "Foundations";
const VECTORS = "Vectors";

export const mathChapters: Chapter[] = [
  { id: "numbers",   section: FOUNDATIONS, title: "Numbers & Floating Point",  minRead: 18, content: (t) => <NumbersContent t={t} /> },
  { id: "algebra",   section: FOUNDATIONS, title: "Algebra & Functions",       minRead: 17, content: (t) => <AlgebraContent t={t} /> },
  { id: "exponents", section: FOUNDATIONS, title: "Exponents & Logarithms",    minRead: 13, content: (t) => <ExpLogContent  t={t} /> },
  { id: "trig",      section: FOUNDATIONS, title: "Trigonometry",              minRead: 17, content: (t) => <TrigContent    t={t} /> },

  { id: "vectors",   section: VECTORS,     title: "Vectors",                   minRead: 13, content: (t) => <VectorsContent t={t} /> },
  { id: "dot",       section: VECTORS,     title: "The Dot Product",           minRead: 14, content: (t) => <DotContent     t={t} /> },
  { id: "cross",     section: VECTORS,     title: "The Cross Product",         minRead: 14, content: (t) => <CrossContent   t={t} /> },
];
