// Live numbers for chapters/loudness.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

/** A pressure in pascals with sensible digits: 0.00002, 0.0356, 2.00, 63.2. */
export function pa(p: number) {
  if (p >= 10) return p.toFixed(1);
  if (p >= 0.1) return p.toFixed(2);
  return p.toPrecision(3).replace(/\.?0+$/, "");
}

/** A signed number for TeX: +6.0, −3.5. */
const signed = (x: number, d = 1) => `${x < 0 ? "-" : "+"}${Math.abs(x).toFixed(d)}`;

// ── Pressure swing → sound pressure level ────────────────────────────────────

export function splNumbers(v: Record<string, number>) {
  const p = 10 ** v.e, ratio = p / 0.00002, L = 20 * Math.log10(ratio);
  // Thin spaces between groups of three digits: 1\,000\,000
  const rs = ratio < 10 ? ratio.toFixed(2) : String(Math.round(ratio)).replace(/\B(?=(\d{3})+$)/g, r`\,`);
  return {
    tex: r`\begin{gathered} \frac{p}{p_0} = \frac{${pa(p)}}{0.00002} = \amber{${rs}} \\ L = 20 \log_{10} ${rs} = 20 \times ${Math.log10(ratio).toFixed(3)} = \green{${L.toFixed(1)}\ \text{dB}} \end{gathered}`,
  };
}

// ── Moving away from a source: the inverse-square law ────────────────────────

export function distanceNumbers(v: Record<string, number>) {
  const drop = 20 * Math.log10(v.r2 / v.r1), L2 = v.L1 - drop;
  return {
    tex: r`\begin{gathered} 20 \log_{10} \frac{${v.r2}}{${v.r1}} = 20 \times ${Math.log10(v.r2 / v.r1).toFixed(3)} = \amber{${drop.toFixed(1)}\ \text{dB}} \\ L_2 = ${v.L1} - ${drop.toFixed(1)} = \green{${L2.toFixed(1)}\ \text{dB}} \end{gathered}`,
  };
}

// ── n equal instruments: level and loudness ──────────────────────────────────

export const sectionNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const add = 10 * Math.log10(v.n), louder = 2 ** (add / 10);
  return {
    tex: r`\begin{gathered} L = ${v.L1} + 10 \log_{10} ${v.n} = ${v.L1} ${signed(add)} = \green{${(v.L1 + add).toFixed(1)}\ \text{dB}} \\ 2^{${add.toFixed(1)}/10} = \amber{${louder.toFixed(2)}} \times\ \text{${tx(t, "musLou_lvLouder", "as loud")}} \end{gathered}`,
  };
};

// ── Safe listening time ──────────────────────────────────────────────────────

/** Minutes as "8 h", "2 h 50 min", "14 min", "28 s". */
function duration(min: number) {
  if (min < 1) return r`${Math.round(min * 60)}\ \text{s}`;
  if (min < 60) return r`${min < 10 ? min.toFixed(1) : Math.round(min)}\ \text{min}`;
  const h = Math.floor(min / 60), m = Math.round(min - 60 * h);
  return m ? r`${h}\ \text{h}\ ${m}\ \text{min}` : r`${h}\ \text{h}`;
}

export function exposureNumbers(v: Record<string, number>) {
  const halvings = (v.L - 85) / 3, min = 480 / 2 ** halvings;
  return {
    tex: r`T = \frac{8\ \text{h}}{2^{(${v.L} - 85)/3}} = \frac{480\ \text{min}}{2^{${halvings.toFixed(2)}}} = \green{${duration(min)}}`,
  };
}
