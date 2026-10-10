// ── Synth ─────────────────────────────────────────────────────────────────────
// A plain oscillator through an ADSR envelope: the pure waveforms the lessons
// on sound and timbre need, where a piano would hide what is going on.
//   attack  — seconds from silence to full level when the key goes down
//   decay   — seconds to fall from full level to the sustain level
//   sustain — the level (0…1) held while the key stays down
//   release — seconds to fade to silence after the key is let go

import { audio, type Voice } from "./context";

export type Wave = "sine" | "triangle" | "square" | "sawtooth";
export type Envelope = { attack: number; decay: number; sustain: number; release: number };

export const DEFAULT_ENVELOPE: Envelope = { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3 };

/**
 * Starts a tone of `freq` Hz and holds it until `stop()`. With `duration` it
 * stops by itself after that many seconds.
 */
export function playTone(freq: number, {
  wave = "sine" as Wave, level = 0.5, env = DEFAULT_ENVELOPE, when = 0, duration,
}: { wave?: Wave; level?: number; env?: Envelope; when?: number; duration?: number } = {}): Voice {
  const { ctx, out } = audio();
  const t0 = Math.max(when, ctx.currentTime);

  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(level, t0 + env.attack);
  gain.gain.setTargetAtTime(level * env.sustain, t0 + env.attack, env.decay / 3);
  osc.connect(gain).connect(out);
  osc.start(t0);
  osc.onended = () => gain.disconnect();

  let stopped = false;
  const voice: Voice = {
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
