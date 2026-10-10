// ── Live formulas of "Cascaded Shadow Maps" ───────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** The chapter's screen: 1080 pixels tall, 60° vertical field of view. */
const H = 1080, TAN_HALF_FOV = Math.tan(Math.PI / 6);

/** Size of a pixel and of a shadow texel at view depth z, and their ratio ρ. */
export const texelRatioNumbers = (t: TrackTranslations) => ({ z, E, k }: V) => {
  const N = 2 ** k, pix = (2 * z * TAN_HALF_FOV) / H, tex = E / N, rho = pix / tex;
  const read = rho >= 1
    ? tx(t, "oglCsm_liveSharp", "sharp: a texel is smaller than a pixel")
    : `${tx(t, "oglCsm_liveSpans", "one texel spans")} ${num(1 / rho, 1)} ${tx(t, "oglCsm_livePixels", "pixels")}`;
  return {
    tex: r`\begin{aligned} &s_{pix} = \frac{2 \cdot ${num(z, 1)} \cdot \tan 30^\circ}{1080} = ${num(pix * 100, 3)}\ \text{cm} \qquad s_{tex} = \frac{${E}}{${N}} = ${num(tex * 100, 2)}\ \text{cm} \\[4pt] &\rho = \frac{${num(pix * 100, 3)}}{${num(tex * 100, 2)}} = \amber{${num(rho, 3)}} \quad (\text{${read}}) \end{aligned}`,
    meter: Math.min(1, rho),
    meterLabel: tx(t, "oglCsm_liveMeter", "ρ (1 = one texel per pixel)"),
  };
};
