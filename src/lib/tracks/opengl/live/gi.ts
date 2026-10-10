// ── Live formulas of "Global Illumination" ────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, signed } from "./fmt";

type V = Record<string, number>;

/** Irradiance from bands 0 and 1 only, for a sky that varies along z: E = π·Y₀₀·L₀₀ + (2π/3)·Y₁₀·L₁₀ (Y₁₀ = 0.488603 n_z). */
export const shNumbers = (t: TrackTranslations) => ({ L0, L1, nz }: V) => {
  const b0 = Math.PI * 0.282095 * L0, b1 = ((2 * Math.PI) / 3) * 0.488603 * L1 * nz, E = b0 + b1;
  const tail = E < 0
    ? r` \;\Rightarrow\; \text{${tx(t, "oglGi_liveNeg", "negative: ringing, clamp to 0")}}`
    : "";
  return {
    tex: r`\begin{aligned} &\pi \cdot 0.282095 \cdot ${fac(L0, 2)} = ${num(b0, 3)} \\[4pt] &\tfrac{2\pi}{3} \cdot 0.488603 \cdot ${fac(L1, 2)} \cdot ${fac(nz, 2)} = ${num(b1, 3)} \\[4pt] &E = ${num(b0, 3)} ${signed(b1, 3)} = \amber{${num(E, 3)}}${tail} \end{aligned}`,
  };
};
