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
  { id: "newtons-laws", section: "Dynamics",                  title: "Newton's Laws of Motion",         minRead: 18, load: () => import("./chapters/newtons-laws").then((m) => m.NewtonsLawsContent) },
  { id: "forces", section: "Dynamics",                        title: "Forces You Meet Every Day",       minRead: 20, load: () => import("./chapters/forces").then((m) => m.ForcesContent) },
  { id: "circular-motion", section: "Dynamics",               title: "Circular Motion",                 minRead: 18, load: () => import("./chapters/circular-motion").then((m) => m.CircularMotionContent) },
  { id: "work-energy", section: "Dynamics",                   title: "Work, Energy & Power",            minRead: 20, load: () => import("./chapters/work-energy").then((m) => m.WorkEnergyContent) },
  { id: "momentum-collisions", section: "Conservation & Rotation", title: "Momentum & Collisions",      minRead: 20, load: () => import("./chapters/momentum-collisions").then((m) => m.MomentumCollisionsContent) },
  { id: "rotation", section: "Conservation & Rotation",       title: "Rotation, Torque & Inertia",      minRead: 21, load: () => import("./chapters/rotation").then((m) => m.RotationContent) },
  { id: "angular-momentum", section: "Conservation & Rotation", title: "Angular Momentum",              minRead: 19, load: () => import("./chapters/angular-momentum").then((m) => m.AngularMomentumContent) },
  { id: "gravity-orbits", section: "Conservation & Rotation", title: "Gravity & Orbits",                minRead: 22, load: () => import("./chapters/gravity-orbits").then((m) => m.GravityOrbitsContent) },
  { id: "simple-harmonic", section: "Oscillations & Waves",   title: "Simple Harmonic Motion",          minRead: 21, load: () => import("./chapters/simple-harmonic").then((m) => m.SimpleHarmonicContent) },
  { id: "damping-resonance", section: "Oscillations & Waves", title: "Damping & Resonance",             minRead: 21, load: () => import("./chapters/damping-resonance").then((m) => m.DampingResonanceContent) },
  { id: "waves", section: "Oscillations & Waves",             title: "Waves",                           minRead: 22, load: () => import("./chapters/waves").then((m) => m.WavesContent) },
  { id: "sound", section: "Oscillations & Waves",             title: "Sound",                           minRead: 22, load: () => import("./chapters/sound").then((m) => m.SoundContent) },
  { id: "fluid-statics", section: "Fluids & Heat",            title: "Fluids at Rest: Pressure & Buoyancy", minRead: 22, load: () => import("./chapters/fluid-statics").then((m) => m.FluidStaticsContent) },
  { id: "fluid-dynamics", section: "Fluids & Heat",           title: "Fluids in Motion",                minRead: 21, load: () => import("./chapters/fluid-dynamics").then((m) => m.FluidDynamicsContent) },
  { id: "temperature-heat", section: "Fluids & Heat",         title: "Temperature & Heat",              minRead: 23, load: () => import("./chapters/temperature-heat").then((m) => m.TemperatureHeatContent) },
  { id: "thermodynamics", section: "Fluids & Heat",           title: "Thermodynamics",                  minRead: 24, load: () => import("./chapters/thermodynamics").then((m) => m.ThermodynamicsContent) },
];
