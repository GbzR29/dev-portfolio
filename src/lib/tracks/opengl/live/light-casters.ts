// ── Live formulas of "Light Casters" ──────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** The chapter's table of tested constants (Ogre3D wiki): reach, K_l, K_q; K_c is always 1. */
export const ATT_ROWS: [number, number, number][] = [
  [7, 0.7, 1.8], [13, 0.35, 0.44], [20, 0.22, 0.2], [32, 0.14, 0.07], [50, 0.09, 0.032], [65, 0.07, 0.017],
  [100, 0.045, 0.0075], [160, 0.027, 0.0028], [200, 0.022, 0.0019], [325, 0.014, 0.0007], [600, 0.007, 0.0002], [3250, 0.0014, 0.000007],
];

/** F_att at distance d with the constants of one table row. */
export const attenuationNumbers = (t: TrackTranslations) => ({ row, d }: V) => {
  const [, kl, kq] = ATT_ROWS[row];
  const den = 1 + kl * d + kq * d * d, F = 1 / den;
  return {
    tex: r`\begin{aligned} &K_c + K_l\,d + K_q\,d^2 = 1 + ${num(kl, 4)} \cdot ${d} + ${num(kq, 6)} \cdot ${d}^2 \\[4pt] &\phantom{K_c + K_l\,d + K_q\,d^2} = 1 + ${num(kl * d, 3)} + ${num(kq * d * d, 3)} = ${num(den, 3)} \\[4pt] &F_{att} = \frac{1}{${num(den, 3)}} = \amber{${num(F, 4)}} \quad (${num(F * 100, 1)}\,\%\ \text{${tx(t, "oglCast_liveLeft", "of the light left")}}) \end{aligned}`,
    meter: F,
    meterLabel: tx(t, "oglCast_liveMeter", "light that arrives"),
  };
};

/** Soft-edged spotlight: the ramp between the inner (φ) and outer (γ) cut-offs, in cosines. */
export const spotNumbers = (t: TrackTranslations) => ({ theta, inner, outer }: V) => {
  const c = (deg: number) => Math.cos((deg * Math.PI) / 180);
  const ct = c(theta), cp = c(inner), cg = c(outer);
  if (outer <= inner) {
    return { tex: r`\gamma \le \phi \;\Rightarrow\; \cos\phi - \cos\gamma \le 0: \;\text{${tx(t, "oglCast_liveBadCone", "the outer cone must be wider than the inner one")}}` };
  }
  const raw = (ct - cg) / (cp - cg), I = Math.min(1, Math.max(0, raw));
  const where = raw >= 1 ? tx(t, "oglCast_liveInside", "inside the inner cone") : raw <= 0 ? tx(t, "oglCast_liveOutside", "outside the outer cone") : tx(t, "oglCast_liveEdge", "on the soft edge");
  return {
    tex: r`\begin{aligned} &\frac{\cos ${theta}^\circ - \cos ${outer}^\circ}{\cos ${inner}^\circ - \cos ${outer}^\circ} = \frac{${num(ct, 4)} - ${num(cg, 4)}}{${num(cp, 4)} - ${num(cg, 4)}} = \frac{${num(ct - cg, 4)}}{${num(cp - cg, 4)}} = ${num(raw, 3)} \\[4pt] &I = \operatorname{clamp}(${num(raw, 3)},\ 0,\ 1) = \amber{${num(I, 3)}} \quad (\text{${where}}) \end{aligned}`,
    meter: I,
    meterLabel: tx(t, "oglCast_liveSpotMeter", "spotlight strength"),
  };
};
