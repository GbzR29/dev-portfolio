// ── Clicks ────────────────────────────────────────────────────────────────────
// Short percussive ticks for the rhythm lessons. A metronome click is a tiny
// recorded-like buffer (a woodblock-ish ping that dies in ~40 ms) started at an
// exact context time, so beats land on time however busy the page is. A click
// train repeats a 2 ms tick by looping a buffer whose loop length is the gap
// between ticks: slow, you hear separate clicks; past ~20 a second they fuse
// into a buzz with a pitch.

import { audio } from "./context";

const pings = new Map<number, AudioBuffer>();               // by pitch in Hz
let ticks: AudioBuffer | null = null;

/** A decaying ping at `hz` (plus a quieter octave) lasting `len` seconds. */
function ping(ctx: AudioContext, hz: number, len: number) {
  const n = Math.round(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / ctx.sampleRate, env = Math.exp(-t / (len / 6)) * Math.min(1, i / 24);
    d[i] = env * (0.8 * Math.sin(2 * Math.PI * hz * t) + 0.3 * Math.sin(2 * Math.PI * 2 * hz * t));
  }
  return buf;
}

/**
 * Plays one metronome click at context time `when` (now if earlier).
 * `accent` uses the higher ping, as metronomes mark the first beat; `hz`
 * picks any other pitch (to tell several layers of clicks apart).
 * Returns a handle that cancels the click if it has not sounded yet.
 */
export function playClick(when = 0, { level = 0.6, accent = false, hz }: { level?: number; accent?: boolean; hz?: number } = {}): { cancel: () => void } {
  const { ctx, out } = audio();
  hz ??= accent ? 1800 : 1200;
  if (!pings.has(hz)) pings.set(hz, ping(ctx, hz, 0.045));
  const src = ctx.createBufferSource();
  src.buffer = pings.get(hz)!;
  const g = ctx.createGain();
  g.gain.value = level;
  src.connect(g).connect(out);
  src.start(Math.max(when, ctx.currentTime));
  src.onended = () => g.disconnect();
  return { cancel: () => { try { src.stop(); } catch { /* already ended */ } } };
}

export type ClickTrain = { setRate: (perSecond: number) => void; stop: () => void };

const TRAIN_MAX_GAP = 2.5;                                   // s: the slowest train is 0.4 ticks a second

/** Starts ticks repeating `perSecond` times a second until `stop()`; the rate can change live. */
export function startClickTrain(perSecond: number, level = 0.5): ClickTrain {
  const { ctx, out } = audio();
  if (!ticks) {
    // One 2 ms tick at the start of a long silent buffer; the loop end sets the gap
    const n = Math.round(ctx.sampleRate * TRAIN_MAX_GAP), w = Math.round(ctx.sampleRate * 0.002);
    ticks = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = ticks.getChannelData(0);
    for (let i = 0; i < w; i++) d[i] = 0.9 * Math.sin(2 * Math.PI * i / w) * Math.sin(Math.PI * i / w);   // one smooth up-down wiggle
  }
  const src = ctx.createBufferSource();
  src.buffer = ticks;
  src.loop = true;
  src.loopStart = 0;
  const gap = (r: number) => Math.min(TRAIN_MAX_GAP, Math.max(0.0025, 1 / r));
  src.loopEnd = gap(perSecond);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.01);
  src.connect(g).connect(out);
  src.start();
  let stopped = false;
  return {
    setRate(r) { src.loopEnd = gap(r); },
    stop() {
      if (stopped) return;
      stopped = true;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      src.stop(ctx.currentTime + 0.08);
      src.onended = () => g.disconnect();
    },
  };
}
