// Live numbers for chapters/durations.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

/** A beat count with only the digits it needs: 4, 1.5, 0.75, 0.375. */
const beats = (b: number) => String(Number(b.toFixed(4)));

// ── A note value (with dots) at a tempo → beats and seconds ──────────────────

export const noteNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const val = 2 ** v.k, d = v.dots, b = (4 / val) * (2 - 1 / 2 ** d), s = (b * 60) / v.bpm;
  const B = tx(t, "musDur_lvBeats", "beats");
  return {
    tex: r`\begin{gathered} b = \frac{4}{${val}} \left(2 - \frac{1}{2^{${d}}}\right) = ${beats(4 / val)} \times ${beats(2 - 1 / 2 ** d)} = \amber{${beats(b)}\ \text{${B}}} \\ t = ${beats(b)} \times \frac{60}{${v.bpm}} = \green{${s.toFixed(3)}\ \text{s}} = ${Math.round(s * 1000)}\ \text{ms} \end{gathered}`,
  };
};

// ── A tuplet: n notes in the time of m ───────────────────────────────────────

export const tupletNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const val = 2 ** v.k, each = (v.m / v.n) * (4 / val), ms = (each * 60000) / v.bpm;
  const B = tx(t, "musDur_lvBeats", "beats");
  return {
    tex: r`\begin{gathered} b' =\frac{${v.m}}{${v.n}} \times \frac{4}{${val}} = \amber{${beats(each)}\ \text{${B}}} \\ ${beats(each)} \times \frac{60}{${v.bpm}} = \green{${Math.round(ms)}\ \text{ms}} \qquad ${v.n} \times ${Math.round(ms)} \approx ${Math.round(v.n * ms)}\ \text{ms} = ${v.m} \times ${Math.round(((4 / val) * 60000) / v.bpm)}\ \text{ms} \end{gathered}`,
  };
};
