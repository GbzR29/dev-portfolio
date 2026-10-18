"use client";

// ── Media queries ─────────────────────────────────────────────────────────────
// Whether a CSS media query matches, for layouts that change in JavaScript.
// Starts false, so the server render and the first client render agree; the
// real value arrives right after mount.

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return on;
}
