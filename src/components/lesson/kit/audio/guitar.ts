// ── Guitar sampler ────────────────────────────────────────────────────────────
// A real nylon-string guitar: "ClassicalGuitar-multisampled" by quartertone
// (Yamaha Eterna, CC-BY 4.0, freesound.org pack 11573), as trimmed MP3s by the
// tonejs-instruments project, in public/sounds/guitar. 27 notes from D2 to
// A♯5, at most 3 semitones apart; the rest are pitch-shifted (sampler.ts).
// (The pack's D5 actually sounds D♯5, 622 Hz, so it was left out.)
//
// A plucked string keeps ringing after the finger leaves the screen, so a
// released note fades over a second instead of the piano's quarter second.
// The recordings are about three times as loud as the piano's (RMS), hence
// the gain below.
//
// The 27 files (~2.1 MB) download the first time a widget asks for the guitar.

import { makeSampler } from "./sampler";
import { noteName } from "./notes";

/** The recorded notes, as MIDI numbers. */
export const GUITAR_SAMPLES = [
  38, 40, 42, 44, 45, 47,                                   // D2 E2 F♯2 G♯2 A2 B2
  49, 50, 52, 54, 55, 57, 59,                               // C♯3 D3 E3 F♯3 G3 A3 B3
  61, 63, 64, 66, 68, 69, 71,                               // C♯4 D♯4 E4 F♯4 G♯4 A4 B4
  73, 76, 78, 79, 80, 81, 82,                               // C♯5 E5 F♯5 G5 G♯5 A5 A♯5
];

const fileOf = (m: number) => `/sounds/guitar/${noteName(m).replace("♯", "s")}.mp3`;

export const guitar = makeSampler({ samples: GUITAR_SAMPLES, file: fileOf, release: 1, gain: 0.32 });
