// ── Water Lab parameters and presets ──────────────────────────────────────────
// Everything a water scene can set, the ready-made scenes, and the water body
// colours. Shared by the Gerstner lab and the shading code every water source uses.

import type { SkyParams } from "../sky/proceduralSky";
import type { Vec3 } from "../../kit/gl/gl";

export const MAX_WAVES = 8;

export type WaterParams = {
  // waves
  amp: number;          // height of the longest wave (m)
  wavelength: number;   // longest wavelength (m)
  chop: number;         // Gerstner steepness Σ Q·A·k over all waves (crests fold where several line up)
  waves: number;        // 1 … MAX_WAVES
  windDir: number;      // degrees
  spread: number;       // 0 = all waves along the wind, 1 = wide spread
  detail: number;       // small ripples on the normal only
  // water
  absorb: Vec3;         // σa per metre, per channel
  scatter: Vec3;        // colour of light scattered back by the water body
  clarity: number;      // divides the absorption: higher = clearer
  depth: number;        // bed depth under the camera (m)
  slope: number;        // bed slope toward +X (a beach), 0 = flat
  bed: 0 | 1;           // 0 sand, 1 pool tiles
  // effects
  foam: number; foamEdge: number; shoreFoam: number;
  caustics: number; sss: number; glint: number;
  terms: { reflect: boolean; refract: boolean; sss: boolean; foam: boolean };
  view: number;         // 0 final, 1 normals, 2 Jacobian, 3 water thickness, 4 caustics, 5 Fresnel
  style: 0 | 1;         // 0 realistic, 1 stylised
  bands: number;
  camHeight: number;
  speed: number;
};

export const WATER_PRESETS: { id: string; label: string; water: Partial<WaterParams>; sky: Partial<SkyParams> }[] = [
  {
    id: "ocean", label: "Open ocean",
    water: { amp: 0.8, wavelength: 30, chop: 2.2, waves: 8, windDir: 20, spread: 0.55, detail: 0.6,
      absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.018, 0.045], clarity: 1, depth: 400, slope: 0, bed: 0,
      foam: 0.8, foamEdge: 0.8, shoreFoam: 0.6, caustics: 0.8, sss: 1, glint: 1, style: 0, camHeight: 4 },
    sky: { sunEl: 14, sunAz: 70, cover: 0.45, model: 1 },
  },
  {
    id: "lagoon", label: "Tropical lagoon",
    water: { amp: 0.12, wavelength: 9, chop: 0.8, waves: 7, windDir: -30, spread: 0.6, detail: 0.7,
      absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.4, depth: 3.5, slope: 0.08, bed: 0,
      foam: 0.6, foamEdge: 0.25, shoreFoam: 0.7, caustics: 1, sss: 0.8, glint: 1, style: 0, camHeight: 2.5 },
    sky: { sunEl: 55, sunAz: 150, cover: 0.3, model: 1, exposure: 1.0 },
  },
  {
    id: "pool", label: "Swimming pool",
    water: { amp: 0.025, wavelength: 2.2, chop: 0.5, waves: 6, windDir: 40, spread: 0.9, detail: 0.5,
      absorb: [0.3, 0.05, 0.04], scatter: [0.0, 0.03, 0.05], clarity: 2.5, depth: 1.8, slope: 0, bed: 1,
      foam: 0, foamEdge: 0.2, shoreFoam: 0, caustics: 1.4, sss: 0.3, glint: 0.8, style: 0, camHeight: 1.6 },
    sky: { sunEl: 62, sunAz: 30, cover: 0.2, model: 1, exposure: 1.0 },
  },
  {
    id: "storm", label: "Stormy sea",
    water: { amp: 2.2, wavelength: 55, chop: 3, waves: 8, windDir: 0, spread: 0.45, detail: 1,
      absorb: [0.5, 0.12, 0.1], scatter: [0.01, 0.03, 0.03], clarity: 0.7, depth: 400, slope: 0, bed: 0,
      foam: 1, foamEdge: 0.95, shoreFoam: 0.6, caustics: 0.5, sss: 1.2, glint: 0.5, style: 0, camHeight: 6 },
    sky: { sunEl: 9, sunAz: 40, cover: 0.9, model: 1 },
  },
  {
    id: "toon", label: "Stylised (toon)",
    water: { amp: 0.18, wavelength: 12, chop: 0.8, waves: 5, windDir: -20, spread: 0.6, detail: 0.3,
      absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07], clarity: 1.4, depth: 3.5, slope: 0.08, bed: 0,
      foam: 0.7, foamEdge: 0.3, shoreFoam: 0.8, caustics: 1, sss: 0.8, glint: 1, style: 1, bands: 4, camHeight: 3 },
    sky: { sunEl: 40, sunAz: 150, cover: 0.35, model: 0 },
  },
];

export const DEFAULT_WATER: WaterParams = {
  amp: 0.8, wavelength: 30, chop: 2.2, waves: 8, windDir: 20, spread: 0.55, detail: 0.6,
  absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.018, 0.045], clarity: 1, depth: 400, slope: 0, bed: 0,
  foam: 0.8, foamEdge: 0.8, shoreFoam: 0.6, caustics: 0.8, sss: 1, glint: 1,
  terms: { reflect: true, refract: true, sss: true, foam: true },
  view: 0, style: 0, bands: 4, camHeight: 4, speed: 1,
};

/** Water body colours: absorption per metre and scattered colour. */
export const WATER_COLOURS: { id: string; label: string; absorb: Vec3; scatter: Vec3 }[] = [
  { id: "ocean", label: "deep ocean", absorb: [0.45, 0.075, 0.05], scatter: [0.0, 0.03, 0.05] },
  { id: "tropical", label: "tropical", absorb: [0.32, 0.055, 0.06], scatter: [0.01, 0.07, 0.07] },
  { id: "lake", label: "green lake", absorb: [0.4, 0.1, 0.25], scatter: [0.025, 0.06, 0.025] },
  { id: "murky", label: "murky", absorb: [0.8, 0.6, 0.65], scatter: [0.06, 0.055, 0.035] },
];
