// ── Piano sampler ─────────────────────────────────────────────────────────────
// A real piano from recordings: the Salamander Grand Piano (Yamaha C5, by
// Alexander Holm, CC-BY 3.0), in public/sounds/piano. Only every third key is
// recorded (C, D♯, F♯ and A from C2 to C6); any other key plays the nearest
// recording faster or slower (sampler.ts). The nearest recording is never
// more than 1.5 semitones away, too little for the change in timbre to be heard.
//
// The 17 files (~1.3 MB) download the first time a widget asks for the piano.

import { makeSampler } from "./sampler";

const NAMES = ["C", "Ds", "Fs", "A"];                       // pitch classes 0, 3, 6, 9
const FIRST = 36, LAST = 84;                                // C2 … C6

/** The recorded keys, as MIDI numbers. */
export const PIANO_SAMPLES = Array.from({ length: (LAST - FIRST) / 3 + 1 }, (_, i) => FIRST + 3 * i);

const fileOf = (m: number) => `/sounds/piano/${NAMES[(m % 12) / 3]}${Math.floor(m / 12) - 1}.mp3`;

// The damper stops a released key in about a quarter of a second
export const piano = makeSampler({ samples: PIANO_SAMPLES, file: fileOf, release: 0.25 });

export const loadPiano = piano.load;
export const pianoReady = piano.ready;
/** Which recording a key uses and how fast it is played. */
export const pianoSource = piano.source;
/**
 * Plays key `m` now (or at context time `when`). `velocity` 0…1 is how hard
 * the key is struck. Returns null while the recordings are still loading.
 */
export const playPiano = piano.play;
