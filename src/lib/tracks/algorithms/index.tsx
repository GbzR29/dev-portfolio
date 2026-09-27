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
const LINEAR = "Linear Structures";
const TREES = "Trees";
const DESIGN = "Algorithm Design";

export const algorithmsChapters: Chapter[] = [
  { id: "memory",     section: FOUNDATIONS, title: "Memory, Arrays & Pointers", minRead: 20, load: () => import("./chapters/memory").then((m) => m.MemoryContent) },
  { id: "complexity", section: FOUNDATIONS, title: "Counting Steps: Big-O",     minRead: 22, load: () => import("./chapters/complexity").then((m) => m.ComplexityContent) },
  { id: "recursion",  section: FOUNDATIONS, title: "Recursion & the Call Stack", minRead: 22, load: () => import("./chapters/recursion").then((m) => m.RecursionContent) },

  { id: "searching",        section: SORTING, title: "Linear & Binary Search",      minRead: 20, load: () => import("./chapters/searching").then((m) => m.SearchingContent) },
  { id: "elementary-sorts", section: SORTING, title: "Elementary Sorts",            minRead: 22, load: () => import("./chapters/elementary-sorts").then((m) => m.ElementarySortsContent) },
  { id: "merge-sort",       section: SORTING, title: "Merge Sort",                  minRead: 22, load: () => import("./chapters/merge-sort").then((m) => m.MergeSortContent) },
  { id: "quicksort",        section: SORTING, title: "Quicksort",                   minRead: 26, load: () => import("./chapters/quicksort").then((m) => m.QuicksortContent) },
  { id: "linear-sorts",     section: SORTING, title: "Beyond Comparisons: Linear Sorts", minRead: 22, load: () => import("./chapters/linear-sorts").then((m) => m.LinearSortsContent) },

  { id: "dynamic-array", section: LINEAR, title: "Dynamic Arrays",           minRead: 20, load: () => import("./chapters/dynamic-array").then((m) => m.DynamicArrayContent) },
  { id: "linked-list",   section: LINEAR, title: "Linked Lists",             minRead: 22, load: () => import("./chapters/linked-list").then((m) => m.LinkedListContent) },
  { id: "stacks",        section: LINEAR, title: "Stacks",                   minRead: 20, load: () => import("./chapters/stacks").then((m) => m.StacksContent) },
  { id: "queues",        section: LINEAR, title: "Queues & Deques",          minRead: 18, load: () => import("./chapters/queues").then((m) => m.QueuesContent) },
  { id: "hash-table",    section: LINEAR, title: "Hash Tables",              minRead: 24, load: () => import("./chapters/hash-table").then((m) => m.HashTableContent) },

  { id: "trees",          section: TREES, title: "Trees & Traversals",         minRead: 22, load: () => import("./chapters/trees").then((m) => m.TreesContent) },
  { id: "bst",            section: TREES, title: "Binary Search Trees",        minRead: 22, load: () => import("./chapters/bst").then((m) => m.BstContent) },
  { id: "balanced-trees", section: TREES, title: "Balanced Trees: AVL & Red-Black", minRead: 26, load: () => import("./chapters/balanced-trees").then((m) => m.BalancedTreesContent) },
  { id: "heaps",          section: TREES, title: "Heaps & Priority Queues",    minRead: 22, load: () => import("./chapters/heaps").then((m) => m.HeapsContent) },
  { id: "tries",          section: TREES, title: "Tries",                      minRead: 18, load: () => import("./chapters/tries").then((m) => m.TriesContent) },

  { id: "greedy",              section: DESIGN, title: "Greedy Algorithms",   minRead: 26, load: () => import("./chapters/greedy").then((m) => m.GreedyContent) },
  { id: "dynamic-programming", section: DESIGN, title: "Dynamic Programming", minRead: 28, load: () => import("./chapters/dynamic-programming").then((m) => m.DynamicProgrammingContent) },
];
