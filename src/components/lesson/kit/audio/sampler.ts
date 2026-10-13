// ── Sampler ───────────────────────────────────────────────────────────────────
// An instrument made of recordings, one file per recorded note. Any other
// note plays the nearest recording faster or slower: speeding a sound up by
// 2^(1/12) raises it one semitone, so a note d semitones from its recording
// plays at rate 2^(d/12). With recordings a few semitones apart the change
// in timbre is too small to hear.
//
// The files download the first time a widget asks for the instrument.

import { audio, type Voice } from "./context";

export type PlayOptions = { velocity?: number; when?: number; release?: number };

export function makeSampler({ samples, file, release: defaultRelease, gain: level = 1 }: {
  /** The recorded notes, as MIDI numbers. */
  samples: readonly number[];
  /** URL of the recording of note `m`. */
  file: (m: number) => string;
  /** Seconds a note takes to die away once let go. */
  release: number;
  /** Overall level, to match the instruments to each other. */
  gain?: number;
}) {
  let loading: Promise<Map<number, AudioBuffer>> | null = null;
  let buffers: Map<number, AudioBuffer> | null = null;

  /** Downloads and decodes the recordings once; later calls share the promise. */
  function load() {
    loading ??= (async () => {
      const { ctx } = audio();
      const entries = await Promise.all(samples.map(async m => {
        const res = await fetch(file(m));
        if (!res.ok) throw new Error(`sample ${file(m)}: ${res.status}`);
        return [m, await ctx.decodeAudioData(await res.arrayBuffer())] as const;
      }));
      buffers = new Map(entries);
      return buffers;
    })().catch(err => {
      loading = null;                                        // let a later click retry
      throw err;
    });
    return loading;
  }

  const ready = () => buffers !== null;

  /** Which recording a note uses and how fast it is played. */
  function source(m: number) {
    const sample = samples.reduce((best, s) => Math.abs(s - m) < Math.abs(best - m) ? s : best);
    return { sample, rate: 2 ** ((m - sample) / 12) };
  }

  /**
   * Plays note `m` now (or at context time `when`). `velocity` 0…1 is how hard
   * it is struck. Returns null while the recordings are still loading.
   */
  function play(m: number, { velocity = 0.8, when = 0, release = defaultRelease }: PlayOptions = {}): Voice | null {
    if (!buffers) return null;
    const { ctx, out } = audio();
    const { sample, rate } = source(m);
    const t0 = Math.max(when, ctx.currentTime);

    const src = ctx.createBufferSource();
    src.buffer = buffers.get(sample)!;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = level * velocity * velocity;           // loudness grows faster than the hand's force
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
        gain.gain.setTargetAtTime(0, t, r / 3);              // ~95 % gone after r seconds
        src.stop(t + r * 2);
      },
    };
  }

  return { samples, load, ready, source, play };
}
