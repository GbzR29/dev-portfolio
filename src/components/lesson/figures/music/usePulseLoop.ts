"use client";

// ── Pulse loop ────────────────────────────────────────────────────────────────
// Loops a bar of equal pulses, each with its own hits: metronome clicks (any
// pitch and level) and piano keys. Sounds are booked on the audio clock a
// moment ahead, as in the metronome, and every pulse reads the newest loop,
// so the bar, the tempo and the accents can change while it plays. `pulse`
// is the index of the pulse being heard (null when stopped). Stops off screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@/components/lesson/kit/figure";
import { audio, startAudio, type Voice } from "@/components/lesson/kit/audio/context";
import { playClick } from "@/components/lesson/kit/audio/click";
import { playPiano } from "@/components/lesson/kit/audio/piano";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";

/** One sound on a pulse: a click, or a piano key. */
export type Hit = { hz: number; level: number } | { midi: number; vel: number };
/** The bar to loop: the hits of each pulse, and the seconds from one pulse to the next. */
export type Loop = { pulses: Hit[][]; spp: number };

const AHEAD = 0.15, TICK_MS = 25;

/** The click for a strong (2), medium (1) or weak (0) pulse. */
export const accentClick = (level: number): Hit =>
  [{ hz: 1200, level: 0.2 }, { hz: 1200, level: 0.55 }, { hz: 1800, level: 0.75 }][level];

export function usePulseLoop(on: boolean, loop: Loop) {
  const { load, ensure } = usePiano();
  const [running, setRunning] = useState(false);
  const [pulse, setPulse] = useState<number | null>(null);
  const live = useRef(loop);
  useEffect(() => { live.current = loop; });
  const booked = useRef<{ at: number; i: number }[]>([]);      // booked pulse starts, newest last
  const voices = useRef<{ v: Voice; end: number }[]>([]);

  // The scheduler: book each pulse's hits just before it comes
  useEffect(() => {
    if (!running || !on) return;
    const { ctx } = audio();
    let next = ctx.currentTime + 0.1, i = 0;
    booked.current = [];
    const id = setInterval(() => {
      voices.current = voices.current.filter(x => x.end > ctx.currentTime || (x.v.stop(), false));
      while (next < ctx.currentTime + AHEAD) {
        const { pulses, spp } = live.current;
        if (i >= pulses.length) i = 0;
        pulses[i].forEach(h => {
          if ("hz" in h) { playClick(next, { hz: h.hz, level: h.level }); return; }
          const v = playPiano(h.midi, { when: next, velocity: h.vel });
          if (v) voices.current.push({ v, end: next + spp * 1.6 });
        });
        booked.current = [...booked.current.slice(-15), { at: next, i }];
        next += spp; i++;
      }
    }, TICK_MS);
    return () => {
      clearInterval(id);
      voices.current.forEach(x => x.v.stop(0.1)); voices.current = [];
    };
  }, [running, on]);
  useEffect(() => { if (!on) { setRunning(false); setPulse(null); } }, [on]);

  // Follow the heard pulse
  useFrame(on && running, () => {
    const { ctx } = audio(), now = ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
    const last = [...booked.current].reverse().find(b => b.at <= now);
    if (last) setPulse(p => (p === last.i ? p : last.i));
  });

  /** Starts or stops the loop; `withPiano` waits for the recordings first. */
  const toggle = useCallback(async (withPiano: boolean) => {
    startAudio();
    if (running) { setRunning(false); setPulse(null); return; }
    if (withPiano) { try { await ensure(); } catch { return; } }
    setRunning(true);
  }, [running, ensure]);

  /** Starts downloading the piano (when the reader switches to it mid-loop). */
  const preparePiano = useCallback(() => { ensure().catch(() => {}); }, [ensure]);

  return { running, pulse, toggle, preparePiano, load };
}
