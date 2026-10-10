// ── Live formulas of "Picking" ────────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

const sub = (a: number[], b: number[]) => a.map((x, i) => x - b[i]);
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A mouse position on a 1920 × 1080 window, into normalised device coordinates. */
export const ndcNumbers = () => ({ mx, my }: V) => {
  const x = (2 * mx) / 1920 - 1, y = 1 - (2 * my) / 1080;
  return {
    tex: r`x_{ndc} = \frac{2 \cdot ${num(mx, 0)}}{1920} - 1 = \amber{${num(x, 3)}} \qquad y_{ndc} = 1 - \frac{2 \cdot ${num(my, 0)}}{1080} = \amber{${num(y, 3)}}`,
  };
};

/** The ray o = 0, d = +x against a sphere at (5, cy, 0). */
export const sphereNumbers = (t: TrackTranslations) => ({ cy, rho }: V) => {
  const oc2 = 25 + cy * cy, h = 25 - (oc2 - rho * rho);
  const hit = h >= 0
    ? r`t = 5 - \sqrt{${num(h, 3)}} = \amber{${num(5 - Math.sqrt(h), 3)}}`
    : r`h < 0 \;\Rightarrow\; \amber{\text{${tx(t, "oglPick_liveMiss", "miss")}}}`;
  return {
    tex: r`\begin{aligned} &\mathbf{oc} = (-5,\ ${fac(-cy)},\ 0) \qquad b = -5 \qquad \mathbf{oc}\cdot\mathbf{oc} = ${num(oc2, 3)} \\[4pt] &h = 25 - (${num(oc2, 3)} - ${num(rho * rho, 3)}) = ${num(h, 3)} \qquad ${hit} \end{aligned}`,
  };
};

/** Möller–Trumbore against the triangle (0,0,0), (1,0,0), (0,1,0), ray from (ox, oy, 1) along (dx, 0, −1). */
export const mtNumbers = (t: TrackTranslations) => ({ ox, oy, dx }: V) => {
  const v0 = [0, 0, 0], e1 = [1, 0, 0], e2 = [0, 1, 0], o = [ox, oy, 1], d = [dx, 0, -1];
  const p = cross(d, e2), det = dot(e1, p), s = sub(o, v0), u = dot(s, p) / det, q = cross(s, e1), v = dot(d, q) / det, tt = dot(e2, q) / det;
  const inside = u >= 0 && v >= 0 && u + v <= 1;
  const verdict = inside ? tx(t, "oglPick_liveIn", "inside: hit") : tx(t, "oglPick_liveOut", "outside: miss");
  return {
    tex: r`\begin{aligned} &\mathbf p = ${vec(p)} \quad \det = ${num(det, 3)} \quad \mathbf s = ${vec(s)} \quad u = ${num(u, 3)} \\[4pt] &\mathbf q = ${vec(q)} \quad v = ${num(v, 3)} \quad t = ${num(tt, 3)} \\[4pt] &u + v = ${num(u + v, 3)} \;\Rightarrow\; \amber{\text{${verdict}}} \end{aligned}`,
  };
};
