// Live numbers for chapters/intervals.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { REF, abbr, intervalName, isPerfectNumber, octavesIn, qualityOf, refSize, simpleNumber } from "@/components/lesson/figures/music/intervals";

const r = String.raw;

// ── Number n and size s → the interval's name ─────────────────────────────────

export const nameNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const n = v.n, s = v.s, sn = simpleNumber(n), k = octavesIn(n), ref = refSize(n), diff = s - ref, q = qualityOf(n, s);
  const kind = isPerfectNumber(n) ? tx(t, "musInt_lvPerfect", "perfect") : tx(t, "musInt_lvMajor", "major");
  const name = q ? r`\green{\text{${intervalName(t, q, n)}}\ (${abbr(q, n, t)})}` : r`\red{\text{${tx(t, "musInt_lvNone", "no usual name")}}}`;
  return {
    tex: r`\begin{gathered} n = ${n} = 7 \times ${k} + ${sn} \;\Rightarrow\; s_{\text{ref}} = 12 \times ${k} + ${REF[sn - 1]} = ${ref}\ (\text{${kind}}) \\ s - s_{\text{ref}} = ${s} - ${ref} = ${diff > 0 ? "+" : ""}${diff} \;\Rightarrow\; ${name} \end{gathered}`,
  };
};
