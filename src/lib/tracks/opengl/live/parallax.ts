// ── Live formulas of "Parallax Mapping" ───────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** The one-step offset for a view θ degrees away from the normal: |P| = tan θ · d · s, also in texels of a 1024² map. */
export const offsetNumbers = (t: TrackTranslations) => ({ theta, d, s }: V) => {
  const tan = Math.tan(rad(theta)), P = tan * d * s;
  return {
    tex: r`\begin{aligned} &\frac{\lvert \vV_{xy} \rvert}{\vV_z} = \tan ${theta}^\circ = ${num(tan, 3)} \\[4pt] &\lvert \mathbf{P} \rvert = ${num(tan, 3)} \cdot ${num(d, 2)} \cdot ${num(s, 3)} = \amber{${num(P, 4)}}\ \text{UV} \\[4pt] &\text{${tx(t, "oglPar_liveTexels", "on a 1024² map")}}: ${num(P * 1024, 1)}\ \text{texels} \end{aligned}`,
    meter: Math.min(1, P / 0.25),
    meterLabel: tx(t, "oglPar_liveMeterP", "shift, out of a quarter of the texture"),
  };
};

/** Layer count for the view angle (8 … 32) and the size of one step in depth and in UV. */
export const layerNumbers = (t: TrackTranslations) => ({ theta, s }: V) => {
  const c = Math.cos(rad(theta)), n = 32 + (8 - 32) * c, P = Math.tan(rad(theta)) * s;
  return {
    tex: r`\begin{aligned} &n = \operatorname{mix}(32,\ 8,\ ${num(c, 3)}) = 32 - 24 \cdot ${num(c, 3)} = \amber{${num(n, 1)}} \\[4pt] &\Delta d = \frac{1}{${num(n, 1)}} = ${num(1 / n, 4)}, \quad \lvert \Delta uv \rvert = \frac{${num(P, 4)}}{${num(n, 1)}} = ${num(P / n, 5)} \\[4pt] &\text{${tx(t, "oglPar_liveReads", "most depth reads with POM")}}: \lceil n \rceil + 1 = ${Math.ceil(n - 1e-9) + 1} \end{aligned}`,
    meter: (n - 8) / 24,
    meterLabel: tx(t, "oglPar_liveMeterN", "layers, from 8 to 32"),
  };
};
