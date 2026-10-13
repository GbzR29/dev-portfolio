// ── Drums ─────────────────────────────────────────────────────────────────────
// Four drum sounds for the rhythm lessons, synthesized once into buffers (no
// samples to download) and started at an exact context time, like the clicks.
// kick: a sine that sweeps down from ~155 to 45 Hz and dies in a quarter second;
// snare: a burst of noise over a short 190 Hz tone; hat: very bright noise,
// gone in 40 ms; clap: three quick noise bursts and a short tail, as several
// hands never clap at exactly the same instant.

import { audio } from "./context";

export type Drum = "kick" | "snare" | "hat" | "clap";

const buffers = new Map<Drum, AudioBuffer>();

/** Fills a new buffer of `len` seconds with f(t, white noise sample). */
function make(ctx: AudioContext, len: number, f: (t: number, noise: number) => number) {
  const n = Math.round(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = f(i / ctx.sampleRate, Math.random() * 2 - 1) * Math.min(1, i / 16);
  return buf;
}

/** Takes the low rumble out of noise (a first difference), leaving the hiss. */
function brighten(buf: AudioBuffer, times: number) {
  const d = buf.getChannelData(0);
  for (let k = 0; k < times; k++) for (let i = d.length - 1; i > 0; i--) d[i] = 0.5 * (d[i] - d[i - 1]);
  const peak = d.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
  for (let i = 0; i < d.length; i++) d[i] *= 0.9 / peak;
  return buf;
}

function build(ctx: AudioContext, drum: Drum): AudioBuffer {
  switch (drum) {
    case "kick": {
      let phase = 0;
      return make(ctx, 0.4, t => {
        phase += (2 * Math.PI * (45 + 110 * Math.exp(-t / 0.03))) / ctx.sampleRate;
        return Math.sin(phase) * Math.exp(-t / 0.1);
      });
    }
    case "snare":
      return make(ctx, 0.25, (t, w) => 0.55 * w * Math.exp(-t / 0.045) + 0.45 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.03));
    case "hat":
      return brighten(make(ctx, 0.06, (t, w) => w * Math.exp(-t / 0.012)), 3);
    case "clap":
      return brighten(make(ctx, 0.2, (t, w) => {
        const burst = [0, 0.011, 0.022].reduce((s, a) => s + (t >= a ? Math.exp(-(t - a) / 0.004) : 0), 0);
        return w * (t < 0.03 ? burst : Math.exp(-(t - 0.022) / 0.04));
      }), 1);
  }
}

/** Plays one drum hit at context time `when` (now if earlier), at gain `level`. */
export function playDrum(drum: Drum, when = 0, level = 0.7) {
  const { ctx, out } = audio();
  if (!buffers.has(drum)) buffers.set(drum, build(ctx, drum));
  const src = ctx.createBufferSource();
  src.buffer = buffers.get(drum)!;
  const g = ctx.createGain();
  g.gain.value = level;
  src.connect(g).connect(out);
  src.start(Math.max(when, ctx.currentTime));
  src.onended = () => g.disconnect();
}
