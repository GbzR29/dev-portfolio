// ── Live formulas of "PBR Theory" ─────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** ∫ cos θ dω over the hemisphere as the shader's Riemann sum: n1 steps in φ, n2 in θ, left endpoints. */
export const hemisphereNumbers = (t: TrackTranslations) => ({ n1, n2 }: V) => {
  const dPhi = (2 * Math.PI) / n1, dTheta = Math.PI / 2 / n2;
  let s = 0;
  for (let k = 0; k < n2; k++) s += Math.cos(k * dTheta) * Math.sin(k * dTheta) * dTheta;
  const total = n1 * dPhi * s, err = (Math.abs(total - Math.PI) / Math.PI) * 100;
  return {
    tex: r`\begin{aligned} &\Delta\varphi = \frac{2\pi}{${n1}} = ${num(dPhi, 4)}, \quad \Delta\theta = \frac{\pi}{2 \cdot ${n2}} = ${num(dTheta, 4)} \\[4pt] &\textstyle\sum_\theta \cos\theta_k \sin\theta_k\,\Delta\theta = ${num(s, 5)} \\[4pt] &${n1} \cdot \Delta\varphi \cdot ${num(s, 5)} = 2\pi \cdot ${num(s, 5)} = \amber{${num(total, 5)}} \\[4pt] &\pi = 3.14159, \quad \text{${tx(t, "oglPbrT_liveErr", "error")}:}\ ${num(err, 3)}\,\% \end{aligned}`,
    meter: total / Math.PI,
    meterLabel: tx(t, "oglPbrT_liveMeter", "share of π reached"),
  };
};

/** A linear roughness value read by mistake through the sRGB decode, and what that does to GGX. */
export const srgbRoughNumbers = (t: TrackTranslations) => ({ v }: V) => {
  const read = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const aTrue = v * v, aRead = read * read, peak = aRead > 0 ? (aTrue / aRead) ** 2 : Infinity;
  const decode = v <= 0.04045
    ? r`\frac{${num(v, 3)}}{12.92}`
    : r`\Big(\frac{${num(v, 3)} + 0.055}{1.055}\Big)^{2.4}`;
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglPbrT_liveRead", "read")}} = ${decode} = \amber{${num(read, 3)}} \\[4pt] &\alpha = \text{roughness}^2: \quad ${num(aTrue, 3)} \;\to\; ${num(aRead, 4)} \\[4pt] &\text{${tx(t, "oglPbrT_livePeak", "highlight peak")}} \;\tfrac{1}{\pi\alpha^2}: \times ${isFinite(peak) ? num(peak, 1) : r`\infty`} \end{aligned}`,
    meter: v > 0 ? read / v : 1,
    meterLabel: tx(t, "oglPbrT_liveMeterRead", "share of the roughness that survives"),
  };
};
