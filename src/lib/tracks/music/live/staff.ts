// Live numbers for chapters/staff.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { CLEFS, dName, type ClefKind } from "@/components/lesson/figures/music/staff";

const r = String.raw;
const KINDS: ClefKind[] = ["treble", "bass", "alto"];

// ── A clef and a position on its staff → the note ────────────────────────────

export const staffNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const kind = KINDS[v.k], bottom = CLEFS[kind].lines[0], s = v.s, d = bottom + s, l = ((d % 7) + 7) % 7, o = Math.floor(d / 7);
  const place = s >= 0 && s <= 8
    ? (s % 2 === 0 ? `${tx(t, "musStf_lvLine", "line")} ${s / 2 + 1}` : `${tx(t, "musStf_lvSpace", "space")} ${(s + 1) / 2}`)
    : s < 0 ? tx(t, "musStf_lvBelow", "below the staff") : tx(t, "musStf_lvAbove", "above the staff");
  return {
    tex: r`\begin{gathered} d = ${bottom} + (${s}) = ${d} \qquad \text{${place}} \\ ${d} = 7 \times ${o} + ${l} \;\Rightarrow\; \ell = ${l},\ o = ${o} \;\Rightarrow\; \amber{\text{${dName(d)}}} \end{gathered}`,
  };
};
