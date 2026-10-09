// ── Live formulas of "Vectors for 3D" ─────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

/** Length of (x, y, z), then the same arrow normalized and its length checked. */
export function lengthNumbers({ x, y, z }: V) {
  const sq = x * x + y * y + z * z, L = Math.sqrt(sq);
  const unit = L < 1e-6
    ? r`\hat{\mathbf a} = \frac{(0,\ 0,\ 0)}{0} \;\Rightarrow\; \red{\text{NaN}}`
    : r`\hat{\mathbf a} = \left(\frac{${num(x)}}{${num(L, 3)}},\ \frac{${num(y)}}{${num(L, 3)}},\ \frac{${num(z)}}{${num(L, 3)}}\right) = \amber{${vec([x / L, y / L, z / L], 3)}}`;
  return {
    tex: r`\begin{aligned} &|\mathbf a| = \sqrt{${fac(x)}^2 + ${fac(y)}^2 + ${fac(z)}^2} = \sqrt{${num(sq)}} = \green{${num(L, 3)}} \\[4pt] &${unit} \end{aligned}`,
  };
}

/** a along x with length |a|, b at angle θ with length |b|: both dot formulas, side by side. */
export const dotNumbers = (t: TrackTranslations) => ({ la, lb, th }: V) => {
  const rad = (th * Math.PI) / 180, c = Math.cos(rad), bx = lb * c, by = lb * Math.sin(rad), d = la * bx;
  const verdict = Math.abs(c) < 0.02
    ? tx(t, "oglVec_liveDotPerp", "perpendicular")
    : c > 0 ? tx(t, "oglVec_liveDotSame", "same side (less than 90°)") : tx(t, "oglVec_liveDotOpp", "opposite side (more than 90°)");
  return {
    tex: r`\begin{aligned} &\mathbf a = (${num(la)},\ 0,\ 0) \qquad \mathbf b = (${num(lb)}\cos ${th}^\circ,\ ${num(lb)}\sin ${th}^\circ,\ 0) = ${vec([bx, by, 0])} \\[4pt] &a_x b_x + a_y b_y + a_z b_z = ${num(la)} \cdot ${fac(bx)} + 0 \cdot ${fac(by)} + 0 \cdot 0 = \green{${num(d)}} \\[4pt] &|\mathbf a|\,|\mathbf b| \cos\theta = ${num(la)} \cdot ${num(lb)} \cdot ${fac(c, 3)} = \green{${num(d)}} \end{aligned}`,
    meter: (c + 1) / 2,
    meterLabel: `cos θ = ${num(c, 3)} · ${verdict}`,
  };
};

/** Triangle A = 0, B = (2, 0, 0), C movable: edge cross product, area and normal. */
export const normalNumbers = (t: TrackTranslations) => ({ cx, cy, cz }: V) => {
  const n = [0 * cz - 0 * cy, 0 * cx - 2 * cz, 2 * cy - 0 * cx], L = Math.hypot(...n);
  const unit = L < 1e-6 ? r`\red{\text{---}}` : r`\amber{${vec(n.map(k => k / L), 3)}}`;
  return {
    tex: r`\begin{aligned} &(B - A) \times (C - A) = (2,\ 0,\ 0) \times ${vec([cx, cy, cz])} \\[4pt] &= (0 \cdot ${fac(cz)} - 0 \cdot ${fac(cy)},\ \ 0 \cdot ${fac(cx)} - 2 \cdot ${fac(cz)},\ \ 2 \cdot ${fac(cy)} - 0 \cdot ${fac(cx)}) = \green{${vec(n)}} \\[4pt] &\text{${tx(t, "oglVec_liveArea", "area")}} = \tfrac12\,|\mathbf n| = \tfrac12 \cdot ${num(L, 3)} = ${num(L / 2, 3)} \qquad \hat{\mathbf n} = ${unit} \end{aligned}`,
  };
};
