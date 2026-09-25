// src/lib/tracks/glsl/index.tsx
"use client";

// The GLSL track. This file only lists the chapters; each chapter's
// content lives in its own module under ./chapters.

import type { Chapter } from "@/lib/tracks/types";
import { PlaygroundContent } from "./chapters/playground";
import { PatternsContent, ColorContent } from "./chapters/shapes";
import { TexturingContent, WaterContent, GlassContent, FogContent, StylizedContent } from "./chapters/effects";
import { RaymarchingContent } from "./chapters/raymarching";
import { RayTracingContent, PathTracingContent, RtAccelContent } from "./chapters/raytracing";
import { TypesContent } from "./chapters/types";
import { BuiltinsContent } from "./chapters/builtins";
import { FragCoordContent } from "./chapters/fragcoord";
import { SDFContent } from "./chapters/sdf";
import { NoiseContent } from "./chapters/noise";
import { ShaderClassContent } from "./chapters/shader-class";

// ── Exported track ────────────────────────────────────────────────────────────

const BASICS   = "Language Basics";
const SHAPES   = "Shapes, Patterns & Colour";
const EFFECTS  = "Effect Recipes";
const RAYMARCH = "Raymarching";
const RAYTRACE = "Ray & Path Tracing";
const TOOLING  = "Tooling";


export const glslChapters: Chapter[] = [
  // ── Language Basics ─────────────────────────────────────────────────────
  { id: "types",       section: BASICS,  title: "Types & Vectors",             minRead: 11, content: (t) => <TypesContent       t={t} /> },
  { id: "builtins",    section: BASICS,  title: "Built-in Functions",          minRead: 13, content: (t) => <BuiltinsContent    t={t} /> },
  { id: "fragcoord",   section: BASICS,  title: "Fragment Coordinates & UV",   minRead: 9,  content: (t) => <FragCoordContent   t={t} /> },
  { id: "playground",  section: BASICS,  title: "The Shader Playground",       minRead: 8,  content: (t) => <PlaygroundContent  t={t} /> },
  // ── Shapes, Patterns & Colour ───────────────────────────────────────────
  { id: "sdf",         section: SHAPES,  title: "Signed Distance Functions",   minRead: 15, content: (t) => <SDFContent         t={t} /> },
  { id: "patterns",    section: SHAPES,  title: "Patterns & Transformations",  minRead: 11, content: (t) => <PatternsContent    t={t} /> },
  { id: "color",       section: SHAPES,  title: "Colour",                      minRead: 12, content: (t) => <ColorContent       t={t} /> },
  { id: "noise",       section: SHAPES,  title: "Noise & Procedural Patterns", minRead: 16, content: (t) => <NoiseContent       t={t} /> },
  // ── Effect Recipes ──────────────────────────────────────────────────────
  { id: "texturing",   section: EFFECTS, title: "Texturing Tricks",            minRead: 12, content: (t) => <TexturingContent   t={t} /> },
  { id: "water",       section: EFFECTS, title: "Waves & Water",               minRead: 36, content: (t) => <WaterContent       t={t} /> },
  { id: "glass",       section: EFFECTS, title: "Glass, Refraction & Fresnel", minRead: 21, content: (t) => <GlassContent       t={t} /> },
  { id: "fog",         section: EFFECTS, title: "Fog",                         minRead: 18, content: (t) => <FogContent         t={t} /> },
  { id: "stylized",    section: EFFECTS, title: "Toon, Dissolve & Hologram",   minRead: 11, content: (t) => <StylizedContent    t={t} /> },
  // ── Raymarching ─────────────────────────────────────────────────────────
  { id: "raymarching", section: RAYMARCH, title: "Raymarching",                minRead: 17, content: (t) => <RaymarchingContent t={t} /> },
  // ── Ray & Path Tracing ──────────────────────────────────────────────────
  { id: "raytracing",  section: RAYTRACE, title: "Ray Tracing",                minRead: 20, content: (t) => <RayTracingContent  t={t} /> },
  { id: "pathtracing", section: RAYTRACE, title: "Path Tracing",               minRead: 26, content: (t) => <PathTracingContent t={t} /> },
  { id: "rt-accel",    section: RAYTRACE, title: "Acceleration & Denoising",   minRead: 15, content: (t) => <RtAccelContent     t={t} /> },
  // ── Tooling ─────────────────────────────────────────────────────────────
  { id: "shaderclass", section: TOOLING, title: "Shader Class in C++",         minRead: 12, content: (t) => <ShaderClassContent t={t} /> },
];
