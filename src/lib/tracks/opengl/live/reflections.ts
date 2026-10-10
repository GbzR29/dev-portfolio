// ── Live formulas of "Reflections" ────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

const RAD = Math.PI / 180;

/** A view ray hitting a floor (n = up) at theta degrees from the normal. */
export const reflectNumbers = (t: TrackTranslations) => ({ th }: V) => {
  const v = [Math.sin(th * RAD), -Math.cos(th * RAD)], vn = v[1], rr = [v[0], v[1] - 2 * vn];
  const out = Math.atan2(rr[0], rr[1]) / RAD;
  return {
    tex: r`\begin{aligned} &\mathbf v = ${vec(v, 3)} \qquad \mathbf v\cdot\vN = ${num(vn, 3)} \\[4pt] &\mathbf r = ${vec(v, 3)} - 2 \cdot ${fac(vn, 3)} \cdot (0,\ 1) = \amber{${vec(rr, 3)}} \\[4pt] &\text{${tx(t, "oglRefl_liveOut", "leaves at")}}\ ${num(out, 1)}^\circ \end{aligned}`,
  };
};

/** A 2D room [−5, 5] × [0, 4] with a probe at (0, 2); a floor point p = (px, 0) reflects along angle phi from up. */
export const boxNumbers = (t: TrackTranslations) => ({ px, phi }: V) => {
  const rx = Math.sin(phi * RAD), ry = Math.cos(phi * RAD);
  const tx_ = Math.abs(rx) < 1e-9 ? Infinity : Math.max((5 - px) / rx, (-5 - px) / rx), ty = 4 / ry, tt = Math.min(tx_, ty);
  const hit = [px + tt * rx, tt * ry], rp = [hit[0], hit[1] - 2], ang = Math.atan2(rp[0], rp[1]) / RAD;
  const txs = Number.isFinite(tx_) ? num(tx_, 3) : r`\infty`;
  return {
    tex: r`\begin{aligned} &t_x = ${txs} \quad t_y = \frac{4}{${num(ry, 3)}} = ${num(ty, 3)} \quad t = ${num(tt, 3)} \quad \text{${tx(t, "oglRefl_liveHit", "hit")}} = ${vec(hit)} \\[4pt] &\mathbf r' = ${vec(hit)} - (0,\ 2) = ${vec(rp)} \;\Rightarrow\; \amber{${num(ang, 1)}^\circ} \ \text{${tx(t, "oglRefl_liveInstead", "instead of")}}\ ${num(phi, 0)}^\circ \end{aligned}`,
    meter: Math.min(1, Math.abs(ang - phi) / 90),
    meterLabel: tx(t, "oglRefl_liveMeter", "how far the naive lookup direction is off (90° = full bar)"),
  };
};
