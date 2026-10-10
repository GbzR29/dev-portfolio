// ── Notes ─────────────────────────────────────────────────────────────────────
// Notes are MIDI numbers: one step = one semitone (one piano key), middle C
// (C4) = 60 and the tuning A (A4) = 69. Equal temperament makes every
// semitone the same frequency ratio, 2^(1/12) ≈ 1.0595, so twelve of them
// double the frequency: one octave up.

export const A4 = 69;
export const A4_HZ = 440;

/** f = 440 · 2^((m − 69) / 12) */
export const midiToFreq = (m: number) => A4_HZ * 2 ** ((m - A4) / 12);

/** The (fractional) MIDI number of a frequency: the inverse of midiToFreq. */
export const freqToMidi = (f: number) => A4 + 12 * Math.log2(f / A4_HZ);

const SHARPS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const FLATS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

/** Pitch class 0…11 (C = 0), also for negative numbers. */
export const pitchClass = (m: number) => ((m % 12) + 12) % 12;

/** Scientific pitch octave: C4 is middle C, the octave changes at every C. */
export const octave = (m: number) => Math.floor(m / 12) - 1;

/** "C4", "F♯3" (or "G♭3" with flats). */
export function noteName(m: number, { flats = false, withOctave = true } = {}) {
  const name = (flats ? FLATS : SHARPS)[pitchClass(m)];
  return withOctave ? name + octave(m) : name;
}

/** The five keys per octave that are black on the piano. */
export const isBlack = (m: number) => [1, 3, 6, 8, 10].includes(pitchClass(m));
