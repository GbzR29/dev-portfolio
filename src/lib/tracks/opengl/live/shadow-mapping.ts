// ── Live formulas of "Shadow Mapping" ─────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** The chapter's light box: glm::ortho(-10, 10, -10, 10, 1, 25). */
const BOX_W = 20, RANGE = 25 - 1;

/**
 * Acne against bias for a surface tilted θ away from the light. A texel covers
 * BOX_W / size world units; half a texel away from its centre the true surface
 * is (texel/2)·tan θ deeper. Depth in [0, 1] spans RANGE world units.
 */
export const acneNumbers = (t: TrackTranslations) => ({ theta, k }: V) => {
  const size = 2 ** k, texel = BOX_W / size, err = (texel / 2) * Math.tan(rad(theta)), errZ = err / RANGE;
  const ndl = Math.cos(rad(theta)), b = Math.max(0.05 * (1 - ndl), 0.005), gap = b * RANGE;
  const ok = b >= errZ;
  return {
    tex: r`\begin{aligned} &\text{texel} = \frac{20}{${size}} = ${num(texel, 5)} \\[4pt] &\Delta = \frac{\text{texel}}{2}\tan ${theta}^\circ = ${num(err, 5)} \;\Rightarrow\; \frac{\Delta}{24} = \amber{${num(errZ, 6)}} \\[4pt] &b = \max\!\big(0.05\,(1 - ${num(ndl, 3)}),\ 0.005\big) = \green{${num(b, 4)}} \\[4pt] &${num(b, 4)} \ ${ok ? r`\ge` : r`<`} \ ${num(errZ, 6)} \;\Rightarrow\; \text{${ok ? tx(t, "oglShadow_liveNoAcne", "no acne") : tx(t, "oglShadow_liveAcne", "acne")}} \\[4pt] &\text{${tx(t, "oglShadow_liveGap", "gap the bias opens")}}: \ ${num(b, 4)} \cdot 24 = ${num(gap, 3)}\ \text{${tx(t, "oglShadow_liveUnits", "world units")}} \end{aligned}`,
  };
};
