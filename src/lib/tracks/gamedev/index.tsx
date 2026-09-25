// src/lib/tracks/gamedev/index.tsx
"use client";

// The Game Dev track: the techniques between rendering and a finished game —
// timing, motion and feel, procedural generation, collision detection and the
// patterns that keep game code fast and manageable.

import type { Track } from "@/lib/tracks/types";
import { GameLoopContent } from "./chapters/loop";
import { EasingContent, SpringsContent } from "./chapters/motion";
import { RandomContent, PerlinContent } from "./chapters/procedural";
import { CollisionContent, SatContent } from "./chapters/collision";
import { ObjectPoolContent } from "./chapters/patterns";

const LOOP = "Core Loop & Time";
const MOTION = "Motion & Game Feel";
const PROC = "Procedural Generation";
const COLLISION = "Collision Detection";
const ARCH = "Architecture & Patterns";

export const gameDevTrack: Track = {
  id: "gamedev",
  title: "Game Development",
  chapters: [
    { id: "game-loop",   section: LOOP,      title: "The Game Loop & Fixed Timestep", minRead: 16, content: (t) => <GameLoopContent   t={t} /> },

    { id: "easing",      section: MOTION,    title: "Lerp, Easing & Tweening",        minRead: 17, content: (t) => <EasingContent     t={t} /> },
    { id: "springs",     section: MOTION,    title: "Springs & Screen Shake",         minRead: 15, content: (t) => <SpringsContent    t={t} /> },

    { id: "random",      section: PROC,      title: "Randomness, Seeds & Hashing",    minRead: 18, content: (t) => <RandomContent     t={t} /> },
    { id: "perlin",      section: PROC,      title: "Perlin Noise & Fractal Terrain", minRead: 20, content: (t) => <PerlinContent     t={t} /> },

    { id: "collision",   section: COLLISION, title: "Collision Shapes & Overlap",     minRead: 18, content: (t) => <CollisionContent  t={t} /> },
    { id: "sat",         section: COLLISION, title: "Separating Axis Theorem",        minRead: 13, content: (t) => <SatContent        t={t} /> },

    { id: "object-pool", section: ARCH,      title: "Object Pools & Handles",         minRead: 15, content: (t) => <ObjectPoolContent t={t} /> },
  ],
};
