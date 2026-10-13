// Live numbers for chapters/syncopation.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { STEPS, weight } from "@/components/lesson/figures/music/syncopation";
import { euclid, gapsOf } from "@/components/lesson/figures/music/EuclidFigure";

const r = String.raw;

/** The name of sixteenth p in a 4/4 bar, as it is counted: 1, 1e, 1&, 1a, 2 … (PT: 1, 1i, 1e, 1a). */
export const posName = (t?: TrackTranslations) => (p: number) =>
  `${Math.floor(p / 4) + 1}${["", tx(t, "figMus_sdE", "e"), tx(t, "figMus_sdAnd", "&"), tx(t, "figMus_sdA", "a")][p % 4]}`;

// ── One note and the silence after it → its syncopation score ───────────────

export const noteScore = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const p = v.p, silent = Array.from({ length: v.len - 1 }, (_, i) => (p + 1 + i) % STEPS);
  const heaviest = silent.reduce((m, q) => Math.max(m, weight(q)), 0), s = Math.max(0, heaviest - weight(p));
  const N = tx(t, "musSyn_lvNone", "no silence"), Y = tx(t, "musSyn_lvYes", "syncopated"), O = tx(t, "musSyn_lvNo", "not syncopated");
  const list = silent.length ? silent.map(q => `${weight(q)}`).join(",\\ ") : r`\text{${N}}`;
  return {
    tex: r`\begin{gathered} w(\text{${posName(t)(p).replace("&", r`\&`)}}) = ${weight(p)} \qquad \max w(${list}) = ${heaviest} \\ s = \max(0,\ ${heaviest} - ${weight(p)}) = \amber{${s}} \quad \text{${s > 0 ? Y : O}} \end{gathered}`,
  };
};

// ── k notes over n pulses → the Euclidean gaps ───────────────────────────────

export function euclidNumbers(v: Record<string, number>) {
  const n = v.n, k = Math.min(v.k, n), q = Math.floor(n / k), rem = n - k * q;
  const on = euclid(n, k), gaps = gapsOf(on);
  const pattern = on.map(x => (x ? r`\amber{\times}` : r`\cdot`)).join(r`\,`);
  return {
    tex: r`\begin{gathered} \frac{${n}}{${k}} = ${(n / k).toFixed(2)} \qquad ${n} = ${k} \times ${q} + ${rem} \\ ${rem}\ \times\ (${q + 1}) \quad + \quad ${k - rem}\ \times\ (${q}) \ \Rightarrow\ \green{${gaps.join(" + ")}} \\ ${pattern} \end{gathered}`,
  };
}
