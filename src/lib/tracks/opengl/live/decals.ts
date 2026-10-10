// ── Live formulas of "Decals" ─────────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, vec } from "./fmt";

type V = Record<string, number>;

const RAD = Math.PI / 180;

/** A decal box centred at (2, 0, 3), 2 × 1 × 2 units, not rotated: D⁻¹ subtracts the centre and divides by the size. */
export const boxNumbers = (t: TrackTranslations) => ({ px, py, pz }: V) => {
  const q = [(px - 2) / 2, py / 1, (pz - 3) / 2], m = Math.max(...q.map(Math.abs)), inside = m <= 0.5;
  const res = inside
    ? r`uv = (${num(q[0], 3)} + 0.5,\ ${num(q[2], 3)} + 0.5) = \amber{(${num(q[0] + 0.5, 3)},\ ${num(q[2] + 0.5, 3)})}`
    : r`\amber{\text{${tx(t, "oglDecal_liveDiscard", "discard")}}}`;
  return {
    tex: r`\begin{aligned} &\mathbf q = \Big(\frac{${num(px)} - 2}{2},\ \frac{${num(py)}}{1},\ \frac{${num(pz)} - 3}{2}\Big) = ${vec(q, 3)} \\[4pt] &\max|q_k| = ${num(m, 3)} \;\Rightarrow\; ${res} \end{aligned}`,
  };
};

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** The angle fade with c0 = 0.3, c1 = 0.6, as in the shader below. */
export const fadeNumbers = (t: TrackTranslations) => ({ th }: V) => {
  const c = Math.abs(Math.cos(th * RAD)), k = Math.min(1, Math.max(0, (c - 0.3) / 0.3)), f = smooth(0.3, 0.6, c);
  return {
    tex: r`\begin{aligned} &|\vN\cdot\hat{\mathbf y}_D| = |\cos ${num(th, 0)}^\circ| = ${num(c, 3)} \qquad x = \operatorname{clamp}\!\Big(\frac{${num(c, 3)} - 0.3}{0.3}\Big) = ${num(k, 3)} \\[4pt] &\operatorname{smoothstep} = x^2\,(3 - 2x) = \amber{${num(f, 3)}} \end{aligned}`,
    meter: f,
    meterLabel: tx(t, "oglDecal_liveMeter", "share of the decal's opacity kept on this surface"),
  };
};
