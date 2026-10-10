// ── Live formulas of "Colour Spaces & ACES" ───────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

const M = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
];

/** Linear sRGB → XYZ, row by row, then the chromaticity (x, y). */
export const xyzNumbers = (t: TrackTranslations) => ({ R, G, B }: V) => {
  const c = [R, G, B], [X, Y, Z] = M.map(row => row[0] * R + row[1] * G + row[2] * B), sum = X + Y + Z;
  const line = (name: string, row: number[], v: number) =>
    r`&${name} = ${row.map((m, i) => `${m} \\cdot ${num(c[i], 2)}`).join(" + ")} = ${num(v, 4)}`;
  const chroma = sum > 0
    ? r`x = \frac{X}{X + Y + Z} = \amber{${num(X / sum, 4)}} \qquad y = \frac{Y}{X + Y + Z} = \amber{${num(Y / sum, 4)}}`
    : r`X + Y + Z = 0: \ \text{${tx(t, "oglColor_liveBlack", "black has no chromaticity")}}`;
  return {
    tex: r`\begin{aligned} ${line("X", M[0], X)} \\[4pt] ${line("Y", M[1], Y)} \\[4pt] ${line("Z", M[2], Z)} \\[4pt] &${chroma} \end{aligned}`,
  };
};

/** PQ inverse EOTF: nits → signal 0–1 → 10-bit code. */
export const pqNumbers = (t: TrackTranslations) => ({ nits }: V) => {
  const m1 = 0.1593, m2 = 78.84, c1 = 0.8359, c2 = 18.85, c3 = 18.69;
  const Y = nits / 10000, p = Y ** m1, E = ((c1 + c2 * p) / (1 + c3 * p)) ** m2;
  return {
    tex: r`\begin{aligned} &Y = \frac{${nits}}{10000} = ${num(Y, 5)} \qquad Y^{m_1} = ${num(p, 4)} \\[4pt] &E = \left(\frac{0.8359 + 18.85 \cdot ${num(p, 4)}}{1 + 18.69 \cdot ${num(p, 4)}}\right)^{78.84} = \amber{${num(E, 4)}} \quad (\text{${tx(t, "oglColor_liveCode", "10-bit code")}}\ ${Math.round(E * 1023)}) \end{aligned}`,
    meter: E,
    meterLabel: tx(t, "oglColor_liveSignal", "signal"),
  };
};
