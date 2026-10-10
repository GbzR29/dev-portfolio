// ── Piano sampler ─────────────────────────────────────────────────────────────
// A real piano from recordings: the Salamander Grand Piano (Yamaha C5, by
// Alexander Holm, CC-BY 3.0), in public/sounds/piano. Only every third key is
// recorded (C, D♯, F♯ and A from C2 to C6); any other key plays the nearest
// recording faster or slower. Speeding a sound up by 2^(1/12) raises it one
// semitone, so a key d semitones from its recording plays at rate 2^(d/12).
// The nearest recording is never more than 1.5 semitones away, too little
// for the change in timbre to be heard.
//
// The 17 files (~1.3 MB) download the first time a widget asks for the piano.

import { audio, type Voice } from "./context";

const NAMES = ["C", "Ds", "Fs", "A"];                       // pitch classes 0, 3, 6, 9
const FIRST = 36, LAST = 84;                                // C2 … C6

/** The recorded keys, as MIDI numbers. */
export const PIANO_SAMPLES = Array.from({ length: (LAST - FIRST) / 3 + 1 }, (_, i) => FIRST + 3 * i);

const fileOf = (m: number) => `/sounds/piano/${NAMES[(m % 12) / 3]}${Math.floor(m / 12) - 1}.mp3`;

let loading: Promise<Map<number, AudioBuffer>> | null = null;
let buffers: Map<number, AudioBuffer> | null = null;

/** Downloads and decodes the recordings once; later calls share the promise. */
export function loadPiano() {
  loading ??= (async () => {
    const { ctx } = audio();
    const entries = await Promise.all(PIANO_SAMPLES.map(async m => {
      const res = await fetch(fileOf(m));
      if (!res.ok) throw new Error(`piano sample ${fileOf(m)}: ${res.status}`);
      return [m, await ctx.decodeAudioData(await res.arrayBuffer())] as const;
    }));
    buffers = new Map(entries);
    return buffers;
  })().catch(err => {
    loading = null;                                          // let a later click retry
    throw err;
  });
  return loading;
}

export const pianoReady = () => buffers !== null;

/** Which recording a key uses and how fast it is played. */
export function pianoSource(m: number) {
  const sample = PIANO_SAMPLES.reduce((best, s) => Math.abs(s - m) < Math.abs(best - m) ? s : best);
  return { sample, rate: 2 ** ((m - sample) / 12) };
}

/**
 * Plays key `m` now (or at context time `when`). `velocity` 0…1 is how hard
 * the key is struck. Returns null while the recordings are still loading.
 */
export function playPiano(m: number, { velocity = 0.8, when = 0, release = 0.25 } = {}): Voice | null {
  if (!buffers) return null;
  const { ctx, out } = audio();
  const { sample, rate } = pianoSource(m);
  const t0 = Math.max(when, ctx.currentTime);

  const src = ctx.createBufferSource();
  src.buffer = buffers.get(sample)!;
  src.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = velocity * velocity;                     // loudness grows faster than the hand's force
  src.connect(gain).connect(out);
  src.start(t0);
  src.onended = () => gain.disconnect();

  let stopped = false;
  return {
    stop(r = release) {
      if (stopped) return;
      stopped = true;
      const t = Math.max(ctx.currentTime, t0);
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.setTargetAtTime(0, t, r / 3);                // ~95 % gone after r seconds (the damper)
      src.stop(t + r * 2);
    },
  };
}
