// Live numbers for chapters/major-scale.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { DEGREE_FIFTHS, atFifth } from "@/components/lesson/figures/music/scales";

const r = String.raw;
const L = ["C", "D", "E", "F", "G", "A", "B"];
const texSign = (a: number) => (a > 0 ? r`{\sharp}`.repeat(a) : r`{\flat}`.repeat(-a));
const texName = (q: number) => { const { l, a } = atFifth(q); return r`\text{${L[l]}}${texSign(a)}`; };

// ── Tonic on the line of fifths + degree → the note, and the key signature ───

export const degreeNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const p = v.p, k = v.k, off = DEGREE_FIFTHS[k - 1], q = p + off, { l, a } = atFifth(q);
  const sig = p === 0 ? tx(t, "musMaj_lvNone", "no sharps or flats")
    : `${Math.abs(p)} ${p > 0 ? tx(t, "musMaj_lvSharps", "sharp(s)") : tx(t, "musMaj_lvFlats", "flat(s)")}`;
  return {
    tex: r`\begin{gathered} q = ${p} ${off < 0 ? "-" : "+"} ${Math.abs(off)} = ${q} \\ \ell = 4 \times ${q} \bmod 7 = ${l}\ (\text{${L[l]}}), \quad a = \left\lfloor \tfrac{${q} + 1}{7} \right\rfloor = ${a} \\ \text{${tx(t, "musMaj_lvDegree", "degree")}}\ ${k}\ \text{${tx(t, "musMaj_lvOf", "of")}}\ ${texName(p)}\ \text{${tx(t, "musMaj_lvMajor", "major")}} = \amber{${texName(q)}} \qquad \text{${tx(t, "musMaj_lvSig", "signature")}}: \text{${sig}} \end{gathered}`,
  };
};
