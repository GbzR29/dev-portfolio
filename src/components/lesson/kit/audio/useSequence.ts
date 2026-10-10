"use client";

// ── Timed notes ───────────────────────────────────────────────────────────────
// Plays a short run of notes one after another, or a chord, and tells the
// widget which step is sounding so it can light it up. `make(i)` starts step
// i's voice (or several, for a chord); the hook stops it `hold` seconds later.
// Everything is silenced when the widget leaves the screen (`on` false), when
// a new run starts, and on unmount.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Voice } from "./context";

type Made = Voice | null | (Voice | null)[];

const voicesOf = (made: Made) => (Array.isArray(made) ? made : [made]).filter((v): v is Voice => v !== null);

export function useSequence(on: boolean) {
  const [step, setStep] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voices = useRef(new Set<Voice>());

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach(v => v.stop(0.08));
    voices.current.clear();
    setStep(null);
  }, []);

  /** Step i starts at i·gap seconds and sounds for `hold` seconds. */
  const play = useCallback((count: number, make: (i: number) => Made, { gap = 0.45, hold = 0.42 } = {}) => {
    stop();
    const at = (s: number, fn: () => void) => { timers.current.push(setTimeout(fn, s * 1000)); };
    const startStep = (i: number) => {
      const vs = voicesOf(make(i));
      vs.forEach(v => voices.current.add(v));
      setStep(i);
      at(hold, () => vs.forEach(v => { v.stop(); voices.current.delete(v); }));
    };
    Array.from({ length: count }, (_, i) => at(i * gap, () => startStep(i)));
    at((count - 1) * gap + hold, () => setStep(null));
  }, [stop]);

  useEffect(() => { if (!on) stop(); }, [on, stop]);
  useEffect(() => stop, [stop]);

  return { step, playing: step !== null, play, stop };
}
