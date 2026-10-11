// Live numbers for chapters/pulse.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

const r = String.raw;

// ── Tempo → length of one beat ───────────────────────────────────────────────

export const beatNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const T = 60 / v.bpm, f = v.bpm / 60, beats = Math.round(v.bpm * v.min);
  return {
    tex: r`\begin{gathered} T = \frac{60}{${v.bpm}} = \green{${T.toFixed(3)}\ \text{s}} = ${Math.round(T * 1000)}\ \text{ms} \qquad f = \frac{${v.bpm}}{60} = \amber{${f.toFixed(2)}\ \text{Hz}} \\ ${v.min}\ \text{min} \times ${v.bpm}\ \text{BPM} = ${beats.toLocaleString("en-US").replace(/,/g, r`\,`)}\ \text{${tx(t, "musPul_lvBeats", "beats")}} \end{gathered}`,
  };
};

// ── Tap tempo: the average gap between taps ──────────────────────────────────

export function tapNumbers(v: Record<string, number>) {
  const m = (v.g1 + v.g2 + v.g3) / 3, bpm = 60000 / m;
  return {
    tex: r`\begin{gathered} \overline{\Delta t} = \frac{${v.g1} + ${v.g2} + ${v.g3}}{3} = \amber{${m.toFixed(1)}\ \text{ms}} = ${(m / 1000).toFixed(4)}\ \text{s} \\ \text{BPM} = \frac{60}{${(m / 1000).toFixed(4)}} = \green{${bpm.toFixed(1)}} \end{gathered}`,
  };
}
