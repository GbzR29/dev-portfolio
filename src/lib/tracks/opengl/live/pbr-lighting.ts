// ── Live formulas of "Cook-Torrance Lighting" ─────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** The albedo of the example pixel: a light grey, the same in every channel. */
const CT_ALBEDO = 0.8;

/**
 * One point light of radiance 1 through the whole Cook-Torrance BRDF.
 * n = (0, 0, 1); the light is tilted by θL to one side and the eye by θV to the other, in one plane.
 */
export const pixelNumbers = (t: TrackTranslations) => ({ rough, metal, thL, thV }: V) => {
  const l = (thL * Math.PI) / 180, v = (thV * Math.PI) / 180;
  const L = [Math.sin(l), Math.cos(l)], Vv = [-Math.sin(v), Math.cos(v)];
  const hl = Math.hypot(L[0] + Vv[0], L[1] + Vv[1]), H = [(L[0] + Vv[0]) / hl, (L[1] + Vv[1]) / hl];
  const NdotL = L[1], NdotV = Vv[1], NdotH = H[1], HdotV = H[0] * Vv[0] + H[1] * Vv[1];

  const a = rough * rough, a2 = a * a, d = NdotH * NdotH * (a2 - 1) + 1, D = a2 / (Math.PI * d * d);
  const k = (rough + 1) ** 2 / 8, g1 = (x: number) => x / (x * (1 - k) + k), G = g1(NdotV) * g1(NdotL);
  const F0 = 0.04 + (CT_ALBEDO - 0.04) * metal, F = F0 + (1 - F0) * (1 - HdotV) ** 5;
  const spec = (D * F * G) / (4 * NdotV * NdotL + 0.0001), kd = (1 - F) * (1 - metal);
  const diff = (kd * CT_ALBEDO) / Math.PI, Lo = (diff + spec) * NdotL;

  return {
    tex: r`\begin{aligned} &\dotp{\vN}{\vL} = ${num(NdotL, 3)}, \ \ \dotp{\vN}{\vV} = ${num(NdotV, 3)} \\[4pt] &\dotp{\vN}{\vH} = ${num(NdotH, 3)}, \ \ \dotp{\vH}{\vV} = ${num(HdotV, 3)} \\[4pt] &\purple{D} = \frac{${num(a2, 4)}}{\pi\,(${num(NdotH, 3)}^2 \cdot (${num(a2, 4)} - 1) + 1)^2} = ${num(D, 3)} \\[4pt] &k = ${num(k, 3)}, \quad \green{G} = ${num(g1(NdotV), 3)} \cdot ${num(g1(NdotL), 3)} = ${num(G, 3)} \\[4pt] &F_0 = ${num(F0, 3)}, \quad \amber{F} = ${num(F0, 3)} + ${num(1 - F0, 3)} \cdot ${num(1 - HdotV, 3)}^5 = ${num(F, 3)} \\[4pt] &\text{spec} = \frac{${num(D, 3)} \cdot ${num(F, 3)} \cdot ${num(G, 3)}}{4 \cdot ${num(NdotV, 3)} \cdot ${num(NdotL, 3)}} = ${num(spec, 3)} \\[4pt] &k_d\,\tfrac{c}{\pi} = ${num(kd, 3)} \cdot \tfrac{${CT_ALBEDO}}{\pi} = ${num(diff, 3)} \\[4pt] &L_o = (${num(diff, 3)} + ${num(spec, 3)}) \cdot ${num(NdotL, 3)} = \amber{${num(Lo, 3)}} \end{aligned}`,
    meter: spec / (diff + spec || 1),
    meterLabel: tx(t, "oglPbrL_liveMeter", "share of the light that is specular"),
  };
};
