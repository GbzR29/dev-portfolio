// ── Live formulas of "IBL: Specular" ──────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, sci } from "./fmt";

type V = Record<string, number>;

/** One GGX importance sample: ξ₂ → the tilt θh of the halfway vector away from n. */
export const ggxSampleNumbers = (t: TrackTranslations) => ({ xi, rough }: V) => {
  const a = rough * rough, a2 = a * a;
  const c = Math.sqrt((1 - xi) / (1 + (a2 - 1) * xi)), deg = (Math.acos(Math.min(1, c)) * 180) / Math.PI;
  return {
    tex: r`\begin{aligned} &\alpha = ${num(rough, 2)}^2 = ${num(a, 4)}, \quad \alpha^2 = ${num(a2, 5)} \\[4pt] &\cos\theta_h = \sqrt{\frac{1 - ${num(xi, 2)}}{1 + (${num(a2, 5)} - 1) \cdot ${num(xi, 2)}}} = ${num(c, 4)} \\[4pt] &\theta_h = \amber{${num(deg, 1)}^\circ} \end{aligned}`,
    meter: deg / 90,
    meterLabel: tx(t, "oglIblS_liveMeterTilt", "tilt of h, out of 90°"),
  };
};

/** Which mip a sample should read: its solid angle against the solid angle of one texel. */
export const mipNumbers = (t: TrackTranslations) => ({ N, w, pdf }: V) => {
  const os = 1 / (N * pdf), op = (4 * Math.PI) / (6 * w * w), mip = 0.5 * Math.log2(os / op);
  return {
    tex: r`\begin{aligned} &\Omega_s = \frac{1}{${N} \cdot ${num(pdf, 1)}} = ${sci(os)}\ \text{sr} \\[4pt] &\Omega_p = \frac{4\pi}{6 \cdot ${w}^2} = ${sci(op)}\ \text{sr} \\[4pt] &\text{mip} = \tfrac{1}{2}\log_2 ${num(os / op, 2)} = ${num(mip, 2)} \;\Rightarrow\; \amber{${num(Math.max(0, mip), 2)}} \end{aligned}`,
    meter: Math.max(0, mip) / Math.log2(w),
    meterLabel: tx(t, "oglIblS_liveMeterMip", "how far down the mip chain"),
  };
};
