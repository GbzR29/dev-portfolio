// src/lib/tracks/gamedev/index.tsx
"use client";

// The Game Dev track: the techniques between rendering and a finished game —
// timing, motion and feel, procedural generation, collision detection and the
// patterns that keep game code fast and manageable.

import type { Chapter } from "@/lib/tracks/types";

const LOOP = "Core Loop & Time";
const MOTION = "Motion & Game Feel";
const PROC = "Procedural Generation";
const COLLISION = "Collision Detection";
const PHYSICS = "Physics";
const ARCH = "Architecture & Patterns";

export const gameDevChapters: Chapter[] = [
  { id: "game-loop",   section: LOOP,      title: "The Game Loop & Fixed Timestep", minRead: 16, load: () => import("./chapters/loop").then((m) => m.GameLoopContent) },

  { id: "easing",      section: MOTION,    title: "Lerp, Easing & Tweening",        minRead: 17, load: () => import("./chapters/motion").then((m) => m.EasingContent) },
  { id: "springs",     section: MOTION,    title: "Springs & Screen Shake",         minRead: 15, load: () => import("./chapters/motion").then((m) => m.SpringsContent) },

  { id: "random",      section: PROC,      title: "Randomness, Seeds & Hashing",    minRead: 18, load: () => import("./chapters/procedural").then((m) => m.RandomContent) },
  { id: "perlin",      section: PROC,      title: "Perlin Noise & Fractal Terrain", minRead: 20, load: () => import("./chapters/procedural").then((m) => m.PerlinContent) },

  { id: "collision",   section: COLLISION, title: "Collision Shapes & Overlap",     minRead: 18, load: () => import("./chapters/collision").then((m) => m.CollisionContent) },
  { id: "sat",         section: COLLISION, title: "Separating Axis Theorem",        minRead: 13, load: () => import("./chapters/collision").then((m) => m.SatContent) },

  { id: "integration",        section: PHYSICS, title: "Integrators: Euler, Verlet & RK4",         minRead: 20, load: () => import("./chapters/integration").then((m) => m.IntegrationContent) },
  { id: "collision-response", section: PHYSICS, title: "Collision Response & Impulses",            minRead: 21, load: () => import("./chapters/collision-response").then((m) => m.CollisionResponseContent) },
  { id: "rigid-body",         section: PHYSICS, title: "2D Rigid Bodies: Rotation & Torque",       minRead: 22, load: () => import("./chapters/rigid-body").then((m) => m.RigidBodyContent) },
  { id: "platformer",         section: PHYSICS, title: "Platformer Feel: Jumps, Coyote Time & Buffering", minRead: 19, load: () => import("./chapters/platformer").then((m) => m.PlatformerContent) },

  { id: "object-pool", section: ARCH,      title: "Object Pools & Handles",         minRead: 15, load: () => import("./chapters/patterns").then((m) => m.ObjectPoolContent) },
];
