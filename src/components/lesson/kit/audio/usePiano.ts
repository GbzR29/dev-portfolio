"use client";

// ── Piano loading state ───────────────────────────────────────────────────────
// The piano recordings download on first use (piano.ts). A widget calls
// `ensure()` when the reader reaches for it and shows `load` while it waits.

import { useCallback, useState } from "react";
import { loadPiano, pianoReady } from "./piano";

export type PianoLoad = "idle" | "loading" | "ready" | "error";

export function usePiano() {
  const [load, setLoad] = useState<PianoLoad>(() => (pianoReady() ? "ready" : "idle"));

  /** Resolves once the recordings are decoded; rejects (and shows "error") if they fail. */
  const ensure = useCallback(() => {
    if (pianoReady()) return Promise.resolve();
    setLoad("loading");
    return loadPiano().then(() => setLoad("ready"), () => { setLoad("error"); throw new Error("piano"); });
  }, []);

  return { load, ensure };
}
