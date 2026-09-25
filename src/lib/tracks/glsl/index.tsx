// src/lib/tracks/glsl/index.tsx
"use client";

// The GLSL track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

// ── Exported track ────────────────────────────────────────────────────────────

const BASICS   = "Language Basics";
const SHAPES   = "Shapes, Patterns & Colour";
const EFFECTS  = "Effect Recipes";
const RAYMARCH = "Raymarching";
const RAYTRACE = "Ray & Path Tracing";
const TOOLING  = "Tooling";


export const glslChapters: Chapter[] = [
  // ── Language Basics ─────────────────────────────────────────────────────
  { id: "types",       section: BASICS,  title: "Types & Vectors",             minRead: 11, load: () => import("./chapters/types").then((m) => m.TypesContent) },
  { id: "builtins",    section: BASICS,  title: "Built-in Functions",          minRead: 13, load: () => import("./chapters/builtins").then((m) => m.BuiltinsContent) },
  { id: "fragcoord",   section: BASICS,  title: "Fragment Coordinates & UV",   minRead: 9,  load: () => import("./chapters/fragcoord").then((m) => m.FragCoordContent) },
  { id: "playground",  section: BASICS,  title: "The Shader Playground",       minRead: 8,  load: () => import("./chapters/playground").then((m) => m.PlaygroundContent) },
  // ── Shapes, Patterns & Colour ───────────────────────────────────────────
  { id: "sdf",         section: SHAPES,  title: "Signed Distance Functions",   minRead: 15, load: () => import("./chapters/sdf").then((m) => m.SDFContent) },
  { id: "patterns",    section: SHAPES,  title: "Patterns & Transformations",  minRead: 11, load: () => import("./chapters/shapes").then((m) => m.PatternsContent) },
  { id: "color",       section: SHAPES,  title: "Colour",                      minRead: 12, load: () => import("./chapters/shapes").then((m) => m.ColorContent) },
  { id: "noise",       section: SHAPES,  title: "Noise & Procedural Patterns", minRead: 16, load: () => import("./chapters/noise").then((m) => m.NoiseContent) },
  // ── Effect Recipes ──────────────────────────────────────────────────────
  { id: "texturing",   section: EFFECTS, title: "Texturing Tricks",            minRead: 12, load: () => import("./chapters/effects").then((m) => m.TexturingContent) },
  { id: "water",       section: EFFECTS, title: "Waves & Water",               minRead: 36, load: () => import("./chapters/effects").then((m) => m.WaterContent) },
  { id: "glass",       section: EFFECTS, title: "Glass, Refraction & Fresnel", minRead: 21, load: () => import("./chapters/effects").then((m) => m.GlassContent) },
  { id: "fog",         section: EFFECTS, title: "Fog",                         minRead: 18, load: () => import("./chapters/effects").then((m) => m.FogContent) },
  { id: "stylized",    section: EFFECTS, title: "Toon, Dissolve & Hologram",   minRead: 11, load: () => import("./chapters/effects").then((m) => m.StylizedContent) },
  // ── Raymarching ─────────────────────────────────────────────────────────
  { id: "raymarching", section: RAYMARCH, title: "Raymarching",                minRead: 17, load: () => import("./chapters/raymarching").then((m) => m.RaymarchingContent) },
  // ── Ray & Path Tracing ──────────────────────────────────────────────────
  { id: "raytracing",  section: RAYTRACE, title: "Ray Tracing",                minRead: 20, load: () => import("./chapters/raytracing").then((m) => m.RayTracingContent) },
  { id: "pathtracing", section: RAYTRACE, title: "Path Tracing",               minRead: 26, load: () => import("./chapters/raytracing").then((m) => m.PathTracingContent) },
  { id: "rt-accel",    section: RAYTRACE, title: "Acceleration & Denoising",   minRead: 15, load: () => import("./chapters/raytracing").then((m) => m.RtAccelContent) },
  // ── Tooling ─────────────────────────────────────────────────────────────
  { id: "shaderclass", section: TOOLING, title: "Shader Class in C++",         minRead: 12, load: () => import("./chapters/shader-class").then((m) => m.ShaderClassContent) },
];
