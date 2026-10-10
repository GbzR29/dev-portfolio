// ── Shared audio context ──────────────────────────────────────────────────────
// One AudioContext for the whole page: every widget plays through the same
// master gain, so one volume and one mute switch govern all of them.
//
// Browsers create the context "suspended" until the user clicks or taps, so
// widgets call `startAudio()` inside their pointer/key handlers; calling it
// elsewhere is harmless but stays silent until the first gesture.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const VOLUME_KEY = "learn-audio-volume";
let volume = readVolume();

function readVolume() {
  try {
    const v = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(v) && v > 0 && v <= 1 ? v : 0.8;
  } catch {
    return 0.8;
  }
}

/** The page's context and master gain, created on first use (client only). */
export function audio() {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  return { ctx, out: master! };
}

/** Call from a click/tap/key handler: wakes the context if the browser put it to sleep. */
export function startAudio() {
  const a = audio();
  if (a.ctx.state !== "running") void a.ctx.resume();
  return a;
}

export function getVolume() {
  return volume;
}

/** Master volume, 0…1, remembered between visits. */
export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (ctx && master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch { /* private mode */ }
}

// ── Voices ────────────────────────────────────────────────────────────────────

/** A sounding note: piano sample or synth tone. */
export type Voice = {
  /** Fades the note out over `release` seconds (default: the voice's own). */
  stop: (release?: number) => void;
};
