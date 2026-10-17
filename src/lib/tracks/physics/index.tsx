// src/lib/tracks/physics/index.tsx

// The Physics track: physics as a subject in its own right, from units and
// motion up to relativity, quantum mechanics and cosmology. No code, like the
// Math track: every law is derived and every idea is a simulation. This file
// only lists the chapters; each chapter's content lives in its own module
// under ./chapters and is loaded on demand.

import type { Chapter } from "@/lib/tracks/types";

export const physicsChapters: Chapter[] = [
  { id: "units-measurement", section: "Foundations & Motion", title: "Units, Dimensions & Measurement", minRead: 16, load: () => import("./chapters/units-measurement").then((m) => m.UnitsMeasurementContent) },
  { id: "kinematics-1d", section: "Foundations & Motion",     title: "Motion in a Straight Line",       minRead: 18, load: () => import("./chapters/kinematics-1d").then((m) => m.Kinematics1dContent) },
  { id: "kinematics-2d", section: "Foundations & Motion",     title: "Projectiles: Motion in a Plane",  minRead: 17, load: () => import("./chapters/kinematics-2d").then((m) => m.Kinematics2dContent) },
  { id: "relative-motion", section: "Foundations & Motion",   title: "Relative Motion & Frames",        minRead: 15, load: () => import("./chapters/relative-motion").then((m) => m.RelativeMotionContent) },
];
