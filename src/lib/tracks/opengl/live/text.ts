// ── Live formulas of "Text Rendering" ─────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r } from "./fmt";

type V = Record<string, number>;

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** One SDF texel: encode its distance, then threshold it with a one-screen-pixel edge. */
export const sdfNumbers = (t: TrackTranslations) => ({ d, spread, zoom }: V) => {
  const s = Math.min(1, Math.max(0, 0.5 + d / (2 * spread))), w = 1 / (2 * spread * zoom), a = smooth(0.5 - w, 0.5 + w, s);
  return {
    tex: r`\begin{aligned} &s = \operatorname{clamp}\!\Big(\tfrac12 + \frac{${fac(d)}}{2 \cdot ${num(spread)}}\Big) = ${num(s, 3)} \qquad w = \frac{1}{2 \cdot ${num(spread)} \cdot ${num(zoom)}} = ${num(w, 4)} \\[4pt] &\alpha = \operatorname{smoothstep}(${num(0.5 - w, 4)},\ ${num(0.5 + w, 4)},\ ${num(s, 3)}) = \amber{${num(a, 3)}} \end{aligned}`,
    meter: a,
    meterLabel: tx(t, "oglText_liveMeter", "opacity of the screen pixel at this distance"),
  };
};
