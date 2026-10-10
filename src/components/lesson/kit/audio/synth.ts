// ── Synth ─────────────────────────────────────────────────────────────────────
// A plain oscillator through an ADSR envelope: the pure waveforms the lessons
// on sound and timbre need, where a piano would hide what is going on.
//   attack  — seconds from silence to full level when the key goes down
//   decay   — seconds to fall from full level to the sustain level
//   sustain — the level (0…1) held while the key stays down
//   release — seconds to fade to silence after the key is let go

import { audio, type Voice } from "./context";

export type Wave = "sine" | "triangle" | "square" | "sawtooth";
/**
 * A waveform given as its recipe of harmonics: `amps[k]` is the amplitude of
 * harmonic k + 1 (frequency (k + 1)·f), `phases[k]` its phase in radians
 * (0 = starts like a sine). The browser scales the sum so its peak is 1.
 */
export type Harmonics = { amps: number[]; phases?: number[] };
export type Envelope = { attack: number; decay: number; sustain: number; release: number };

export const DEFAULT_ENVELOPE: Envelope = { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 };

/** A held tone whose pitch and level can follow a slider while it sounds. */
export type ToneVoice = Voice & {
  /** Glides to `f` Hz in a few milliseconds (an instant jump would click). */
  setFreq: (f: number) => void;
  setLevel: (level: number) => void;
  /** Swaps the waveform while the tone sounds. Give at least one non-zero amplitude. */
  setHarmonics: (h: Harmonics) => void;
};

const GLIDE = 0.015;                                         // s, time constant of setFreq/setLevel

/** a·sin(ωt + φ) = a·sin φ·cos ωt + a·cos φ·sin ωt: the cosine part goes in `real`, the sine part in `imag` (index 0 = no offset). */
function periodicWave(ctx: AudioContext, { amps, phases }: Harmonics) {
  const real = new Float32Array(amps.length + 1), imag = new Float32Array(amps.length + 1);
  amps.forEach((a, k) => {
    const ph = phases?.[k] ?? 0;
    real[k + 1] = a * Math.sin(ph);
    imag[k + 1] = a * Math.cos(ph);
  });
  return ctx.createPeriodicWave(real, imag);
}

/**
 * Starts a tone of `freq` Hz and holds it until `stop()`. With `duration` it
 * stops by itself after that many seconds. The chain is
 * oscillator → envelope gain (0…1, ADSR) → level gain → master.
 */
export function playTone(freq: number, {
  wave = "sine" as Wave, level = 0.5, env = DEFAULT_ENVELOPE, when = 0, duration,
}: { wave?: Wave | Harmonics; level?: number; env?: Envelope; when?: number; duration?: number } = {}): ToneVoice {
  const { ctx, out } = audio();
  const t0 = Math.max(when, ctx.currentTime);

  const osc = ctx.createOscillator();
  if (typeof wave === "string") osc.type = wave;
  else osc.setPeriodicWave(periodicWave(ctx, wave));
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(1, t0 + env.attack);
  gain.gain.setTargetAtTime(env.sustain, t0 + env.attack, env.decay / 3);
  const amp = ctx.createGain();
  amp.gain.value = level;
  osc.connect(gain).connect(amp).connect(out);
  osc.start(t0);
  osc.onended = () => amp.disconnect();

  let stopped = false;
  const voice: ToneVoice = {
    setFreq(f) { osc.frequency.setTargetAtTime(f, ctx.currentTime, GLIDE); },
    setLevel(l) { amp.gain.setTargetAtTime(l, ctx.currentTime, GLIDE); },
    setHarmonics(h) { osc.setPeriodicWave(periodicWave(ctx, h)); },
    stop(r = env.release) {
      if (stopped) return;
      stopped = true;
      const t = Math.max(ctx.currentTime, t0 + env.attack);
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.setTargetAtTime(0, t, Math.max(r, 0.005) / 3);
      osc.stop(t + r * 2 + 0.05);
    },
  };
  if (duration !== undefined) {
    const at = (t0 - ctx.currentTime + duration) * 1000;
    setTimeout(() => voice.stop(), at);
  }
  return voice;
}
