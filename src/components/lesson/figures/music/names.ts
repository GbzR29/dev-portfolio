// ── Note names ────────────────────────────────────────────────────────────────
// The names the Notes chapters use: the seven letters, the seven solfège
// syllables (fixed do: do is always C), scientific octave numbers (C4 =
// middle C, the number changes at every C), and the black keys named after
// their neighbours. Translated syllables come through tx.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { isBlack, noteName, octave, pitchClass } from "@/components/lesson/kit/audio/notes";

/** Pitch classes of the white keys, C D E F G A B. */
export const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

/** The solfège syllables do re mi fa sol la si, in the reader's language. */
export const solfa = (t?: TrackTranslations) => [
  tx(t, "figMus_nmDo", "do"), tx(t, "figMus_nmRe", "re"), tx(t, "figMus_nmMi", "mi"), tx(t, "figMus_nmFa", "fa"),
  tx(t, "figMus_nmSol", "sol"), tx(t, "figMus_nmLa", "la"), tx(t, "figMus_nmSi", "si"),
];

/** Index 0…6 of a white key's letter (C = 0), or -1 for a black key. */
export const letterIndex = (m: number) => WHITE_PCS.indexOf(pitchClass(m));

export type NameStyle = "letter" | "solfa" | "octave" | "midi";

/** The label of key m in a style (null when the style leaves the key blank). */
export function keyLabel(m: number, style: NameStyle, t?: TrackTranslations): string | null {
  if (style === "midi") return String(m);
  if (isBlack(m)) return null;
  const i = letterIndex(m);
  if (style === "letter") return LETTERS[i];
  if (style === "solfa") return solfa(t)[i];
  return LETTERS[i] + octave(m);
}

/** "C♯ / D♭" for a black key, the letter for a white one (no octave). */
export const bothNames = (m: number) =>
  isBlack(m) ? `${noteName(m, { withOctave: false })} / ${noteName(m, { flats: true, withOctave: false })}` : LETTERS[letterIndex(m)];
