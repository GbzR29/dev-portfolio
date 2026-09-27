// src/lib/tracks/algorithms/index.tsx
"use client";

// The Algorithms & Data Structures track: everything built from scratch in
// C++, from how memory is laid out to graphs. Chapters follow their
// prerequisites; the Math track supplies logarithms, series and probability.
//
// Planned order (the rest is added one batch at a time):
//   Foundations        memory, complexity, recursion
//   Searching & Sorting searching, elementary-sorts, merge-sort, quicksort, linear-sorts
//   Linear Structures  dynamic-array, linked-list, stacks, queues, hash-table
//   Trees              trees, bst, balanced-trees, heaps, tries
//   Algorithm Design   greedy, dynamic-programming
//   Graphs             graphs, graph-traversal, shortest-paths, mst

import type { Chapter } from "@/lib/tracks/types";

const FOUNDATIONS = "Foundations";
const SORTING = "Searching & Sorting";

export const algorithmsChapters: Chapter[] = [
  { id: "memory",     section: FOUNDATIONS, title: "Memory, Arrays & Pointers", minRead: 20, load: () => import("./chapters/memory").then((m) => m.MemoryContent) },
  { id: "complexity", section: FOUNDATIONS, title: "Counting Steps: Big-O",     minRead: 22, load: () => import("./chapters/complexity").then((m) => m.ComplexityContent) },
  { id: "recursion",  section: FOUNDATIONS, title: "Recursion & the Call Stack", minRead: 22, load: () => import("./chapters/recursion").then((m) => m.RecursionContent) },

  { id: "searching",        section: SORTING, title: "Linear & Binary Search",      minRead: 20, load: () => import("./chapters/searching").then((m) => m.SearchingContent) },
  { id: "elementary-sorts", section: SORTING, title: "Elementary Sorts",            minRead: 22, load: () => import("./chapters/elementary-sorts").then((m) => m.ElementarySortsContent) },
  { id: "merge-sort",       section: SORTING, title: "Merge Sort",                  minRead: 22, load: () => import("./chapters/merge-sort").then((m) => m.MergeSortContent) },
  { id: "quicksort",        section: SORTING, title: "Quicksort",                   minRead: 26, load: () => import("./chapters/quicksort").then((m) => m.QuicksortContent) },
  { id: "linear-sorts",     section: SORTING, title: "Beyond Comparisons: Linear Sorts", minRead: 22, load: () => import("./chapters/linear-sorts").then((m) => m.LinearSortsContent) },
];
