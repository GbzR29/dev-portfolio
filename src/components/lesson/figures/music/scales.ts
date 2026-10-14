// ── Major scales and keys ─────────────────────────────────────────────────────
// The major scale on any tonic, spelled with every letter once, and the line
// of fifths that explains key signatures. A note name (pitch class, spelled)
// has a position p on the line of fifths, C = 0, G = 1, D = 2… F = −1, B♭ = −2:
//   letter      ℓ = 4p mod 7       (a fifth up is 4 letters up: C → G)
//   sign        a = ⌊(p + 1) / 7⌋   (F…B, positions −1…5, are the naturals;
//                                    each 7 fifths further adds a sharp)
// The major scale of tonic p is the 7 consecutive positions p − 1 … p + 5,
// and its key signature has p sharps (p > 0) or −p flats (p < 0).

import type { Acc, Spelled } from "./accidentals";
import { keyOf } from "./accidentals";
import { midiOf } from "./staff";

/** Half steps from the tonic to each degree 1…7 of the major scale. */
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];
/** The steps between neighbouring degrees, 1→2 … 7→8: whole, whole, half, whole, whole, whole, half. */
export const MAJOR_STEPS = [2, 2, 1, 2, 2, 2, 1];
/** Each degree's place on the line of fifths, relative to the tonic. */
export const DEGREE_FIFTHS = [0, 2, 4, -1, 1, 3, 5];

/** The letter index (C = 0 … B = 6) and sign of the note at position p on the line of fifths. */
export const atFifth = (p: number) => ({ l: (((4 * p) % 7) + 7) % 7, a: Math.floor((p + 1) / 7) });

/** The 15 usual major keys, from 7 flats (C♭) to 7 sharps (C♯): line-of-fifths positions. */
export const KEY_POSITIONS = Array.from({ length: 15 }, (_, i) => i - 7);

/** The tonic of key p, spelled in the octave from C4 (d 28…34). */
export function tonicOf(p: number): Spelled {
  const { l, a } = atFifth(p);
  return { d: 28 + l, a: a as Acc };
}

/** The major scale on a spelled tonic, degrees 1…8: one letter per degree, the sign is what the size asks for. */
export function majorScale(tonic: Spelled): Spelled[] {
  return [...MAJOR, 12].map((s, k) => {
    const d = tonic.d + k, a = keyOf(tonic) + s - midiOf(d);
    return { d, a: a as Acc };
  });
}

/** The same scale spelled naively: every black key as a sharp, whatever letter that takes. */
export function sharpScale(tonic: Spelled): { m: number; name: string }[] {
  const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  return [...MAJOR, 12].map(s => { const m = keyOf(tonic) + s; return { m, name: NAMES[((m % 12) + 12) % 12] }; });
}

/** Line-of-fifths positions of the sharps (F♯ C♯ G♯ D♯ A♯ E♯ B♯) and flats (B♭ E♭ A♭ D♭ G♭ C♭ F♭) in signature order. */
export const SHARP_ORDER = [6, 7, 8, 9, 10, 11, 12];
export const FLAT_ORDER = [-2, -3, -4, -5, -6, -7, -8];

/** Where each signature sign sits on the treble staff (d values), in order. */
export const SHARP_D = [38, 35, 39, 36, 33, 37, 34];         // F5 C5 G5 D5 A4 E5 B4
export const FLAT_D = [34, 37, 33, 36, 32, 35, 31];          // B4 E5 A4 D5 G4 C5 F4
