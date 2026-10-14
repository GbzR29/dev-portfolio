// Live numbers for chapters/minor-scale.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { MINOR_FIFTHS, atFifth, minorSignature } from "@/components/lesson/figures/music/scales";

const r = String.raw;
const L = ["C", "D", "E", "F", "G", "A", "B"];
const texSign = (a: number) => (a > 0 ? r`{\sharp}`.repeat(a) : r`{\flat}`.repeat(-a));
const texName = (q: number) => { const { l, a } = atFifth(q); return r`\text{${L[l]}}${texSign(a)}`; };

/** Is degree k raised in this form? (0 natural, 1 harmonic: 7th, 2 melodic: 6th and 7th) */
export const raised = (form: number, k: number) => (k === 7 && form >= 1) || (k === 6 && form === 2);

// ── Minor tonic on the line of fifths + degree + form → the note ─────────────

export const minorDegreeNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const p = v.r, k = v.k, f = MINOR_FIFTHS[k - 1], up = raised(v.form, k) ? 1 : 0, q = p + f + 7 * up, { l, a } = atFifth(q);
  const sig = minorSignature(p);
  const sigText = sig === 0 ? tx(t, "musMin_lvNone", "no sharps or flats")
    : `${Math.abs(sig)} ${sig > 0 ? tx(t, "musMin_lvSharps", "sharp(s)") : tx(t, "musMin_lvFlats", "flat(s)")}`;
  const form = [tx(t, "musMin_lvNat", "natural"), tx(t, "musMin_lvHar", "harmonic"), tx(t, "musMin_lvMel", "melodic")][v.form];
  return {
    tex: r`\begin{gathered} q = ${p} ${f < 0 ? "-" : "+"} ${Math.abs(f)} + 7 \times ${up} = ${q} \\ \ell = 4 \times ${q} \bmod 7 = ${l}\ (\text{${L[l]}}), \quad a = \left\lfloor \tfrac{${q} + 1}{7} \right\rfloor = ${a} \\ \text{${tx(t, "musMin_lvDegree", "degree")}}\ ${k}\ \text{${tx(t, "musMin_lvOf", "of")}}\ ${texName(p)}\ \text{${tx(t, "musMin_lvMinor", "minor")} (${form})} = \amber{${texName(q)}} \qquad \text{${tx(t, "musMin_lvSig", "signature")}}: ${p} - 3 = ${sig}\ (\text{${sigText}}) \end{gathered}`,
  };
};
