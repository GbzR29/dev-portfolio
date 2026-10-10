// Live numbers for chapters/pitch.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { noteName } from "@/components/lesson/kit/audio/notes";

const r = String.raw;

/** Up to three decimals, no trailing zeros: −0.75, 0.083. */
const short = (x: number) => String(Math.round(x * 1000) / 1000);

/** A note name for TeX (KaTeX has no ♯ glyph in text): C♯4 → \text{C}{\sharp}\text{4}. */
export function texNote(m: number) {
  const n = noteName(m);
  return n.includes("♯") ? r`\text{${n[0]}}{\sharp}\text{${n.slice(2)}}` : r`\text{${n}}`;
}

// ── Key number → frequency ───────────────────────────────────────────────────

export function keyNumbers(v: Record<string, number>) {
  const e = (v.m - 69) / 12, k = 2 ** e;
  return {
    tex: r`\begin{gathered} f = 440 \cdot 2^{(${v.m} - 69)/12} = 440 \cdot 2^{${short(e)}} \\ = 440 \times ${k.toFixed(4)} = \green{${(440 * k).toFixed(2)}\ \text{Hz}} \quad (${texNote(v.m)}) \end{gathered}`,
  };
}

// ── Frequency → key number: what a tuner does ────────────────────────────────

export const tunerNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const oct = Math.log2(v.f / 440), m = 69 + 12 * oct, n = Math.round(m), c = Math.round(100 * (m - n));
  return {
    tex: r`\begin{gathered} m = 69 + 12 \log_2 \frac{${v.f}}{440} = 69 + 12 \times (${oct.toFixed(4)}) = \amber{${m.toFixed(2)}} \\ \text{${tx(t, "musPit_lvNearest", "nearest key")}}\ ${n} = ${texNote(n)} \qquad \green{${c > 0 ? "+" : ""}${c}\ \text{cents}} \end{gathered}`,
  };
};

// ── Two frequencies → the interval between them ──────────────────────────────

export const intervalNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const ratio = v.f2 / v.f1, oct = Math.log2(ratio);
  return {
    tex: r`\begin{gathered} \frac{f_2}{f_1} = \frac{${v.f2}}{${v.f1}} = \amber{${ratio.toFixed(4)}} \qquad \log_2 ${ratio.toFixed(4)} = ${oct.toFixed(4)} \\ c = 1200 \times ${oct.toFixed(4)} = \green{${(1200 * oct).toFixed(1)}\ \text{cents}} = ${(12 * oct).toFixed(2)}\ \text{${tx(t, "musPit_lvSemis", "semitones")}} \end{gathered}`,
  };
};
