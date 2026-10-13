"use client";

// ── Rhythm player ─────────────────────────────────────────────────────────────
// Plays a list of notes measured in beats (start and length) on the piano,
// optionally with a metronome click on every beat, at a given tempo. Every
// sound is booked on the audio clock up front, so the rhythm is exact; `pos`
// follows the heard position in beats (rounded to 1/8 beat) for lighting the
// drawing. Stops off screen, on a new run and on unmount.

import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame } from "@/components/lesson/kit/figure";
import { audio, startAudio, type Voice } from "@/components/lesson/kit/audio/context";
import { playPiano } from "@/components/lesson/kit/audio/piano";
import { playClick } from "@/components/lesson/kit/audio/click";
import { usePiano } from "@/components/lesson/kit/audio/usePiano";

/** One note (or a rest, midi null), in beats from the start. */
export type RhythmEvent = { at: number; len: number; midi: number | null };

const LEAD = 0.15;                                           // s between the click on "play" and the first beat
const GAP = 0.03;                                            // s cut from each note, so repeated notes are heard apart

export function useRhythmPlayer(on: boolean) {
  const piano = usePiano();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState<number | null>(null);
  const voices = useRef<Voice[]>([]);
  const ticks = useRef<{ cancel: () => void }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const t0 = useRef(0), spb = useRef(1);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    voices.current.forEach(v => v.stop(0.1)); voices.current = [];
    ticks.current.forEach(c => c.cancel()); ticks.current = [];
    setPlaying(false); setPos(null);
  }, []);
  useEffect(() => { if (!on) stop(); }, [on, stop]);
  useEffect(() => stop, [stop]);

  /** Plays `events` at `bpm`; the run lasts `beats` beats (clicks on each, accent every `accentEvery`). */
  const play = useCallback(async (events: RhythmEvent[], bpm: number, { beats, clicks = true, accentEvery = 4 }: { beats: number; clicks?: boolean; accentEvery?: number }) => {
    stop();
    startAudio();
    try { await piano.ensure(); } catch { return; }
    const { ctx } = audio(), s = 60 / bpm, start = ctx.currentTime + LEAD;
    t0.current = start; spb.current = s;
    events.forEach(e => {
      if (e.midi === null) return;
      const v = playPiano(e.midi, { when: start + e.at * s, velocity: 0.7 });
      if (!v) return;
      voices.current.push(v);
      timers.current.push(setTimeout(() => v.stop(), (LEAD + (e.at + e.len) * s - GAP) * 1000));
    });
    if (clicks) ticks.current = Array.from({ length: Math.ceil(beats) }, (_, k) => playClick(start + k * s, { level: 0.3, accent: k % accentEvery === 0 }));
    timers.current.push(setTimeout(() => { setPlaying(false); setPos(null); }, (LEAD + beats * s + 0.3) * 1000));
    setPlaying(true);
  }, [piano, stop]);

  /** The heard position in beats (negative before the first beat). */
  const now = useCallback(() => {
    const { ctx } = audio();
    return (ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) - t0.current) / spb.current;
  }, []);

  useFrame(on && playing, () => {
    const q = Math.floor(now() * 8) / 8;
    setPos(p => (p === q ? p : q));
  });

  return { play, stop, playing, pos, now, load: piano.load };
}
