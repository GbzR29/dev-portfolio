"use client";

// ── Score state ───────────────────────────────────────────────────────────────
// The editor's score with undo and redo, kept in the reader's browser between
// visits, and opened from a link: `?score=…` (model.ts encode) wins over the
// saved one, so a shared link shows the sender's score. The first render is
// always the preset, so the server and the client agree; the saved score
// follows right after.

import { useCallback, useEffect, useState } from "react";
import { decode, encode, PRESETS, type Score } from "./model";

const KEY = "learn-music-score";
const LIMIT = 200;                                          // undo steps kept

type Hist = { past: Score[]; now: Score; future: Score[] };

export function useScore() {
  const [h, setH] = useState<Hist>({ past: [], now: PRESETS.ode, future: [] });
  // Nothing is saved before the saved score is read, or the preset would overwrite it
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let s: Score | null = null;
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("score");
      s = (fromUrl && decode(fromUrl)) || decode(localStorage.getItem(KEY) ?? "");
    } catch { /* storage blocked: start from the preset */ }
    if (s) setH({ past: [], now: s, future: [] });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, encode(h.now)); } catch { /* storage blocked */ }
  }, [h.now, loaded]);

  /** Changes the score; `record` false skips the undo history (the tempo slider). */
  const update = useCallback((fn: (s: Score) => Score, record = true) => {
    setH(({ past, now, future }) => {
      const next = fn(now);
      if (next === now) return { past, now, future };
      return record ? { past: [...past, now].slice(-LIMIT), now: next, future: [] } : { past, now: next, future };
    });
  }, []);
  const undo = useCallback(() => setH(({ past, now, future }) =>
    past.length ? { past: past.slice(0, -1), now: past[past.length - 1], future: [now, ...future] } : { past, now, future }), []);
  const redo = useCallback(() => setH(({ past, now, future }) =>
    future.length ? { past: [...past, now], now: future[0], future: future.slice(1) } : { past, now, future }), []);

  /** A link that opens this score (the page's own address plus ?score=…). */
  const link = useCallback(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("score", encode(h.now));
    u.hash = "";
    return u.toString();
  }, [h.now]);

  return { score: h.now, update, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0, link };
}
