// src/lib/tracks/ai/index.tsx
"use client";

// The AI track: artificial intelligence built from scratch in C++, with no
// libraries — every matrix, derivative and training loop written by hand.
// Chapters follow their prerequisites; the Math track supplies vectors,
// calculus, matrices and probability.
//
// Planned sections (24 chapters, agreed 2026-09-30):
//   Foundations                       what-is-ai, data, linear-regression, gradient-descent
//   Classic Machine Learning          logistic regression, generalisation, k-NN, decision trees, k-means
//   Neural Networks                   perceptron, MLP, backpropagation, training, regularisation
//   Deep Learning                     CNN, embeddings, RNN, attention, transformers & LLMs
//   Reinforcement Learning & Game AI  game search, MCTS, bandits & MDPs, Q-learning, AI in games

import type { Chapter } from "@/lib/tracks/types";

const FOUNDATIONS = "Foundations";
const CLASSIC = "Classic Machine Learning";
const NEURAL = "Neural Networks";

export const aiChapters: Chapter[] = [
  { id: "what-is-ai",        section: FOUNDATIONS, title: "What Is AI? Learning from Data", minRead: 17, load: () => import("./chapters/what-is-ai").then((m) => m.WhatIsAiContent) },
  { id: "data",              section: FOUNDATIONS, title: "Data, Features & Vectors",        minRead: 20, load: () => import("./chapters/data").then((m) => m.DataContent) },
  { id: "linear-regression", section: FOUNDATIONS, title: "Linear Regression",               minRead: 24, load: () => import("./chapters/linear-regression").then((m) => m.LinearRegressionContent) },
  { id: "gradient-descent",  section: FOUNDATIONS, title: "Gradient Descent",                minRead: 24, load: () => import("./chapters/gradient-descent").then((m) => m.GradientDescentContent) },
  { id: "logistic-regression",  section: CLASSIC, title: "Logistic Regression & Classification",        minRead: 25, load: () => import("./chapters/logistic-regression").then((m) => m.LogisticRegressionContent) },
  { id: "generalisation",       section: CLASSIC, title: "Generalisation: Overfitting, Validation & Metrics", minRead: 25, load: () => import("./chapters/generalisation").then((m) => m.GeneralisationContent) },
  { id: "k-nearest-neighbours", section: CLASSIC, title: "k-Nearest Neighbours",                        minRead: 21, load: () => import("./chapters/k-nearest-neighbours").then((m) => m.KNearestNeighboursContent) },
  { id: "decision-trees",       section: CLASSIC, title: "Decision Trees",                              minRead: 23, load: () => import("./chapters/decision-trees").then((m) => m.DecisionTreesContent) },
  { id: "k-means",              section: CLASSIC, title: "k-Means Clustering",                          minRead: 21, load: () => import("./chapters/k-means").then((m) => m.KMeansContent) },
  { id: "perceptron", section: NEURAL, title: "The Perceptron", minRead: 24, load: () => import("./chapters/perceptron").then((m) => m.PerceptronContent) },
];
