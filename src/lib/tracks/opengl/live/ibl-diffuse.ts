// ── Live formulas of "IBL: Diffuse Irradiance" ────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** An integer with thin spaces between groups of three digits: 97 542 144. */
export const big = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\\,");

/** Cost of the convolution shader: loop steps per texel × texels of the six faces. */
export const convCostNumbers = (t: TrackTranslations) => ({ delta, size }: V) => {
  const nPhi = Math.ceil((2 * Math.PI) / delta - 1e-9), nTheta = Math.ceil(Math.PI / 2 / delta - 1e-9);
  const perTexel = nPhi * nTheta, texels = 6 * size * size, total = perTexel * texels;
  return {
    tex: r`\begin{aligned} &n_1 = \Big\lceil \frac{2\pi}{${num(delta, 3)}} \Big\rceil = ${nPhi}, \quad n_2 = \Big\lceil \frac{\pi/2}{${num(delta, 3)}} \Big\rceil = ${nTheta} \\[4pt] &\text{${tx(t, "oglIblD_livePerTexel", "per texel")}}: ${nPhi} \cdot ${nTheta} = ${big(perTexel)} \\[4pt] &\text{${tx(t, "oglIblD_liveTexels", "texels")}}: 6 \cdot ${size}^2 = ${big(texels)} \\[4pt] &\text{${tx(t, "oglIblD_liveTotal", "fetches")}}: \amber{${big(total)}} \end{aligned}`,
  };
};

/** Lagarde's Fresnel with roughness next to plain Schlick, and the diffuse share kd of a dielectric. */
export const fresnelRoughNumbers = (t: TrackTranslations) => ({ nv, rough, f0 }: V) => {
  const p = (1 - nv) ** 5, cap = Math.max(1 - rough, f0);
  const F = f0 + (cap - f0) * p, plain = f0 + (1 - f0) * p;
  return {
    tex: r`\begin{aligned} &(1 - ${num(nv, 2)})^5 = ${num(p, 4)}, \quad \max(1 - ${num(rough, 2)},\ ${num(f0, 2)}) = ${num(cap, 2)} \\[4pt] &\amber{F} = ${num(f0, 2)} + (${num(cap, 2)} - ${num(f0, 2)}) \cdot ${num(p, 4)} = \amber{${num(F, 3)}} \\[4pt] &\text{${tx(t, "oglIblD_livePlain", "plain Schlick")}}: ${num(f0, 2)} + ${num(1 - f0, 2)} \cdot ${num(p, 4)} = ${num(plain, 3)} \\[4pt] &k_d = 1 - ${num(F, 3)} = ${num(1 - F, 3)} \end{aligned}`,
    meter: F,
    meterLabel: tx(t, "oglIblD_liveMeter", "share reflected (F)"),
  };
};
