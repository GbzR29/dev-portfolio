// ── Intervals ─────────────────────────────────────────────────────────────────
// Naming the distance between two spelled notes (accidentals.tsx: a note is a
// staff position d plus a sign a). An interval has two measures:
//   number    n = d₂ − d₁ + 1   letters counted from the lower note to the
//                               upper one, both ends included (C→G: 5, a fifth)
//   size      s = m₂ − m₁        keys (half steps) between them
// The quality compares s with the size the number has between C and the
// white key above it (the "reference"): 1 4 5 8 are perfect, 2 3 6 7 major;
// one key less makes a major interval minor; one key more makes either
// augmented; one less than minor (or than perfect) is diminished.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { keyOf, type Spelled } from "./accidentals";

/** Half steps from C up to the white key of each simple number 1…7 (C D E F G A B). */
export const REF = [0, 2, 4, 5, 7, 9, 11];
/** Numbers whose white-key form from C is perfect: unison, fourth, fifth (and their octaves). */
export const isPerfectNumber = (n: number) => [1, 4, 5].includes(simpleNumber(n));

/** 1…7 for any number ≥ 1: 8 → 1 (an octave is a unison plus one octave), 9 → 2… */
export const simpleNumber = (n: number) => ((n - 1) % 7) + 1;
/** Whole octaves inside an interval of number n (an octave counts as one). */
export const octavesIn = (n: number) => Math.floor((n - 1) / 7);
/** The reference size of number n in half steps: perfect or major. */
export const refSize = (n: number) => REF[simpleNumber(n) - 1] + 12 * octavesIn(n);

export type Quality = "dd" | "d" | "m" | "P" | "M" | "A" | "AA";

/** The quality of an interval of number n and size s half steps, or null when no name fits. */
export function qualityOf(n: number, s: number): Quality | null {
  const diff = s - refSize(n);
  if (isPerfectNumber(n)) return ({ [-2]: "dd", [-1]: "d", 0: "P", 1: "A", 2: "AA" } as Record<number, Quality>)[diff] ?? null;
  return ({ [-3]: "dd", [-2]: "d", [-1]: "m", 0: "M", 1: "A", 2: "AA" } as Record<number, Quality>)[diff] ?? null;
}

/** Number, size and quality of the interval between two spelled notes, lower first. */
export function measure(lo: Spelled, hi: Spelled) {
  const n = hi.d - lo.d + 1, s = keyOf(hi) - keyOf(lo);
  return { n, s, q: n >= 1 ? qualityOf(n, s) : null };
}

/** The inversion: the lower note goes up an octave. n + n' = 9, s + s' = 12, the quality flips. */
export const INVERT: Record<Quality, Quality> = { dd: "AA", d: "A", m: "M", P: "P", M: "m", A: "d", AA: "dd" };

/** "P5", "m3", "A4", "M9": the short label (PT: "5J", "3m", "4A", "9M"). */
export function abbr(q: Quality, n: number, t?: TrackTranslations) {
  const ql = tx(t, `figMus_ivA${q}`, q);
  return tx(t, "figMus_ivOrder", "QN") === "NQ" ? `${n}${ql}` : `${ql}${n}`;
}

// ── Names in words ────────────────────────────────────────────────────────────

const QUALITY_EN: Record<Quality, string> = {
  dd: "doubly diminished", d: "diminished", m: "minor", P: "perfect", M: "major", A: "augmented", AA: "doubly augmented",
};
const ORD_EN = ["unison", "2nd", "3rd", "4th", "5th", "6th", "7th", "octave", "9th", "10th", "11th", "12th", "13th", "14th", "double octave"];

/** "perfect 5th" / "5ª justa". PT puts the quality after the number and agrees in gender (o uníssono). */
export function intervalName(t: TrackTranslations | undefined, q: Quality, n: number) {
  const unison = n === 1;
  const ql = tx(t, `figMus_ivQ${q}${unison ? "U" : ""}`, QUALITY_EN[q]);
  const num = tx(t, `figMus_ivN${n}`, ORD_EN[n - 1] ?? `${n}th`);
  return tx(t, "figMus_ivOrder", "QN") === "NQ" ? `${num} ${ql}` : `${ql} ${num}`;
}

/** The number alone: "5th", "octave". */
export const numberName = (t: TrackTranslations | undefined, n: number) => tx(t, `figMus_ivN${n}`, ORD_EN[n - 1] ?? `${n}th`);
