// ── Live formulas of "Geometry Shader" ────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, vec } from "./fmt";

type V = Record<string, number>;

/** Shrink and explode the triangle a = (0,0,0), b = (3,0,0), c = (0,3,0): g = (1,1,0), n = (0,0,1). */
export const faceNumbers = () => ({ s, m }: V) => {
  const g = [1, 1, 0], P = [[0, 0, 0], [3, 0, 0], [0, 3, 0]];
  const out = P.map(p => p.map((x, i) => x + (g[i] - x) * s + (i === 2 ? m : 0)));
  const tight = (v: number[]) => `(${v.map(x => num(x)).join(", ")})`;
  const row = (name: string, p: number[], q: number[]) => r`${name}' &= \operatorname{mix}(${tight(p)},\ ${tight(g)},\ ${num(s)}) + ${tight([0, 0, m])} = \amber{${vec(q)}}`;
  return {
    tex: r`\begin{aligned} ${row("a", P[0], out[0])} \\[2pt] ${row("b", P[1], out[1])} \\[2pt] ${row("c", P[2], out[2])} \end{aligned}`,
  };
};

/** Wireframe intensity at d pixels from the nearest edge, for a line w pixels wide. */
export const edgeNumbers = (t: TrackTranslations) => ({ d, w }: V) => {
  const x = Math.min(1, Math.max(0, (d - (w - 1)) / 2)), ss = x * x * (3 - 2 * x), e = 1 - ss;
  return {
    tex: r`\begin{aligned} x &= \operatorname{clamp}\!\Big(\frac{${num(d)} - ${num(w - 1)}}{2},\ 0,\ 1\Big) = ${num(x, 3)} \\[4pt] \text{edge} &= 1 - ${num(x, 3)}^2\,(3 - 2 \cdot ${num(x, 3)}) = \amber{${num(e, 3)}} \end{aligned}`,
    meter: e,
    meterLabel: tx(t, "oglGs_liveMeterEdge", "how much of the line colour this pixel gets"),
  };
};
