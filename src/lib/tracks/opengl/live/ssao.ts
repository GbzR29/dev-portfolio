// ── Live formulas of "SSAO" ───────────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** How far sample i of N may reach: lerp(0.1, 1, (i/N)²), and the share of the kernel kept inside half the radius. */
export const kernelScaleNumbers = (t: TrackTranslations) => ({ i, N }: V) => {
  const k = Math.min(i, N - 1), f = k / N, s = 0.1 + 0.9 * f * f;
  const inner = Math.floor((2 * N) / 3) + 1;                // i/N ≤ √(0.4/0.9) = 2/3 ⇔ scale ≤ 0.5
  return {
    tex: r`\begin{aligned} &\big(\tfrac{${k}}{${N}}\big)^2 = ${num(f * f, 4)} \\[4pt] &\operatorname{lerp}(0.1,\ 1,\ ${num(f * f, 4)}) = 0.1 + 0.9 \cdot ${num(f * f, 4)} = \amber{${num(s, 3)}} \\[4pt] &\text{${tx(t, "oglSsao_liveInner", "samples within half the radius")}}: ${inner} / ${N} \end{aligned}`,
    meter: s,
    meterLabel: tx(t, "oglSsao_liveMeterScale", "longest reach of this sample, out of R"),
  };
};

/** The final factor when m of the 64 samples are occluded by geometry |Δz| = gap · R away in depth. */
export const aoNumbers = (t: TrackTranslations) => ({ m, gap, k }: V) => {
  const x = Math.min(1, 1 / gap), w = x * x * (3 - 2 * x), A = Math.pow(1 - (m * w) / 64, k);
  return {
    tex: r`\begin{aligned} &w = \operatorname{smoothstep}\!\Big(0,\ 1,\ \frac{1}{${num(gap, 2)}}\Big) = ${num(w, 3)} \\[4pt] &A = \Big(1 - \frac{${m} \cdot ${num(w, 3)}}{64}\Big)^{${k}} = \amber{${num(A, 3)}} \end{aligned}`,
    meter: A,
    meterLabel: tx(t, "oglSsao_liveMeterA", "ambient light kept"),
  };
};
