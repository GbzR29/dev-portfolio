// Live numbers for chapters/note-names.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { isBlack, midiToFreq, noteName } from "@/components/lesson/kit/audio/notes";
import { letterIndex, solfa } from "@/components/lesson/figures/music/names";

const r = String.raw;

// ── Key number → pitch class, octave, name, frequency ────────────────────────

export const keyNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const m = v.m, q = Math.floor(m / 12), pc = m % 12, o = q - 1;
  const [letter, sharp] = noteName(m, { withOctave: false }).split("");
  const name = r`\text{${letter}}${sharp ? r`{\sharp}` : ""}\text{${o}}`;
  const extra = isBlack(m)
    ? r`\text{${tx(t, "musNam_lvBlack", "black key")}}`
    : r`\text{${solfa(t)[letterIndex(m)]}${o}}`;
  return {
    tex: r`\begin{gathered} ${m} = 12 \times ${q} + ${pc} \\ pc = ${pc},\quad o = ${q} - 1 = ${o} \;\Rightarrow\; \amber{${name}} \quad (${extra}) \\ f = 440 \cdot 2^{(${m} - 69)/12} = \green{${midiToFreq(m).toFixed(2)}\ \text{Hz}} \end{gathered}`,
  };
};
