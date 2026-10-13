// Live numbers for chapters/accidentals.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { midiToFreq } from "@/components/lesson/kit/audio/notes";
import { WHITE_PCS } from "@/components/lesson/figures/music/names";
import { spellings, type Acc } from "@/components/lesson/figures/music/accidentals";

const r = String.raw;
const L = ["C", "D", "E", "F", "G", "A", "B"];
const SIGN: Record<number, string> = { [-2]: r`{\flat}{\flat}`, [-1]: r`{\flat}`, 0: "", 1: r`{\sharp}`, 2: r`{\sharp}{\sharp}` };
const texName = (l: number, a: number, o: number) => r`\text{${L[l]}}${SIGN[a]}\text{${o}}`;

// ── Letter + octave + sign → key number and frequency ────────────────────────

export const accNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const l = v.l, o = v.o, a = v.a as Acc, P = WHITE_PCS[l], m = 12 * (o + 1) + P + a;
  const same = spellings(m).filter(s => !(((s.d % 7) + 7) % 7 === l && Math.floor(s.d / 7) === o));
  const sameTex = same.map(s => texName(((s.d % 7) + 7) % 7, s.a, Math.floor(s.d / 7))).join(r`,\ `);
  return {
    tex: r`\begin{gathered} ${texName(l, a, o)}:\quad m = 12 \times (${o} + 1) + ${P} ${a < 0 ? "-" : "+"} ${Math.abs(a)} = \amber{${m}} \\ f = 440 \cdot 2^{(${m} - 69)/12} = \green{${midiToFreq(m).toFixed(2)}\ \text{Hz}} \\ \text{${tx(t, "musAcc_lvSame", "same key as")}}\ ${sameTex} \end{gathered}`,
  };
};

