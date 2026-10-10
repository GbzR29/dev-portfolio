"use client";

// ── Held notes of one widget ──────────────────────────────────────────────────
// Remembers which notes a widget is sounding, keyed by MIDI number, so a key
// release finds its voice. Everything is silenced when the widget scrolls out
// of view (`on` false) or unmounts, so no note keeps ringing off screen.

import { useCallback, useEffect, useRef } from "react";
import type { Voice } from "./context";

export function useVoices(on: boolean) {
  const held = useRef(new Map<number, Voice>());

  /** Starts `voice` for note `m`, cutting short any voice already on that note. */
  const start = useCallback((m: number, voice: Voice | null) => {
    held.current.get(m)?.stop(0.05);
    if (voice) held.current.set(m, voice);
    else held.current.delete(m);
  }, []);

  const release = useCallback((m: number) => {
    held.current.get(m)?.stop();
    held.current.delete(m);
  }, []);

  const releaseAll = useCallback(() => {
    for (const v of held.current.values()) v.stop();
    held.current.clear();
  }, []);

  useEffect(() => { if (!on) releaseAll(); }, [on, releaseAll]);
  useEffect(() => releaseAll, [releaseAll]);

  return { start, release, releaseAll };
}
