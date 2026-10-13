// ── Tunings ───────────────────────────────────────────────────────────────────
// The numbers behind the equal-temperament chapter: cents, pure ratios, the
// pitch of each of the 12 keys (in cents above C) in five historical tunings,
// and the beat rate of a nearly pure interval. Used by BeatsFigure,
// FifthsSpiralFigure, TuningFigure and music/live/temperament.ts.

import { playTone, type Harmonics } from "@/components/lesson/kit/audio/synth";

/** Size of a frequency ratio in cents: 1200 per octave, 100 per equal semitone. */
export const cents = (ratio: number) => 1200 * Math.log2(ratio);

export const PURE_FIFTH = cents(3 / 2);                    // 701.955
export const PURE_THIRD = cents(5 / 4);                    // 386.314
export const PYTH_COMMA = 12 * PURE_FIFTH - 7 * 1200;      // 23.460
export const SYNT_COMMA = cents(81 / 80);                  // 21.506

/** Pitch-class names from C, sharps and flats for the black keys. */
export const PC_NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];

export type TuningId = "pyth" | "meantone" | "just" | "well" | "equal";
export const TUNINGS: TuningId[] = ["pyth", "meantone", "just", "well", "equal"];

/**
 * A chain of equal fifths of `fifth` cents from E♭ (3 fifths below C) to G♯
 * (8 above), folded into one octave: the layout of most old keyboards. The
 * twelfth fifth, G♯ → E♭, is whatever is left over: the wolf.
 */
function chain(fifth: number) {
  const out = new Array<number>(12);
  for (let n = -3; n <= 8; n++) {
    const c = n * fifth, pc = (((7 * n) % 12) + 12) % 12;
    out[pc] = ((c % 1200) + 1200) % 1200;
  }
  return out;
}

const JUST_RATIOS = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8];

/** Cents above C of each key, C = 0. */
export const TUNING_CENTS: Record<TuningId, number[]> = {
  pyth: chain(PURE_FIFTH),
  meantone: chain(PURE_FIFTH - SYNT_COMMA / 4),          // quarter-comma: four fifths make a pure third
  just: JUST_RATIOS.map(cents),                          // 5-limit just intonation in C
  well: [0, 90.225, 192.18, 294.135, 390.225, 498.045, 588.27, 696.09, 792.18, 888.27, 996.09, 1092.18], // Werckmeister III (1691)
  equal: Array.from({ length: 12 }, (_, i) => 100 * i),
};

/** The interval from key `a` up to key `a + k` (k semitones) in a tuning, in cents. */
export function intervalCents(tuning: TuningId, a: number, k: number) {
  const tab = TUNING_CENTS[tuning], pa = ((a % 12) + 12) % 12, pb = (pa + k) % 12;
  return tab[pb] - tab[pa] + 1200 * Math.floor((pa + k) / 12);
}

/** Frequency of MIDI key `m` in a tuning, with every tuning sharing C4 = 261.63 Hz (the equal-tempered C). */
export function tunedFreq(tuning: TuningId, m: number) {
  const pc = ((m % 12) + 12) % 12, oct = Math.floor(m / 12) - 5;
  return 261.6256 * 2 ** (oct + TUNING_CENTS[tuning][pc] / 1200);
}

/**
 * Beats per second of two tones forming roughly the ratio q : p (upper : lower):
 * harmonic q of the lower tone and harmonic p of the upper should meet, and
 * miss by |p·f2 − q·f1| Hz.
 */
export const beatRate = (f1: number, f2: number, p: number, q: number) => Math.abs(p * f2 - q * f1);

/** A bright tone (harmonics at 1/n) so that the meeting harmonics are loud enough to beat. */
export const RICH: Harmonics = { amps: [1, 0.5, 0.33, 0.25, 0.2, 0.17] };

export function richTone(f: number, level = 0.16) {
  return playTone(f, { wave: RICH, level, env: { attack: 0.03, decay: 0.1, sustain: 0.9, release: 0.25 } });
}
