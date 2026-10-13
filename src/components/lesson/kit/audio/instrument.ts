// ── The reader's instrument ───────────────────────────────────────────────────
// The Music track teaches on the piano or on the guitar. The choice is ONE
// value for the whole site (saved in localStorage): the picker at the start
// of the track and the selector in each widget's head both change it, so the
// text and every widget on the page always show the same instrument.
//
// `playNote` sounds a note on whichever instrument is chosen; widgets that
// only need "a note" use it instead of naming the piano.

import { guitar } from "./guitar";
import { piano } from "./piano";
import type { PlayOptions } from "./sampler";

export type Instrument = "piano" | "guitar";

const KEY = "learn-music-instrument";
const listeners = new Set<() => void>();
let current: Instrument | null = null;

export function getInstrument(): Instrument {
  if (current === null) {
    try {
      current = localStorage.getItem(KEY) === "guitar" ? "guitar" : "piano";
    } catch {
      current = "piano";
    }
  }
  return current;
}

/** Whether the reader has ever picked an instrument (the start-of-track card asks until then). */
export function instrumentChosen() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function setInstrument(v: Instrument) {
  current = v;
  try { localStorage.setItem(KEY, v); } catch { /* private window: the choice lasts this visit */ }
  for (const f of listeners) f();
}

export function subscribeInstrument(f: () => void) {
  listeners.add(f);
  // Another tab changed it
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = null;
    f();
  };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(f); window.removeEventListener("storage", onStorage); };
}

export const samplerOf = (v: Instrument) => (v === "guitar" ? guitar : piano);

/** Plays note `m` on the chosen instrument; null while its recordings are still loading. */
export const playNote = (m: number, opts?: PlayOptions) => samplerOf(getInstrument()).play(m, opts);

/** Whether the chosen instrument's recordings are decoded. */
export const notesReady = () => samplerOf(getInstrument()).ready();
