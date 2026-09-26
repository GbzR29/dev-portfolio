"use client";

// ── Media queries ─────────────────────────────────────────────────────────────
// Phone layout switches shared by the figure frame, GLView and the lesson shell.
// All of them start false, so the server render and the first client render
// agree; the real value arrives right after mount.

import { useEffect, useState } from "react";

/** Below Tailwind's `sm`: the one-column phone layout. */
export const PHONE = "(max-width: 639px)";
/** Below `md`: widgets stack their drawing above their controls. */
export const STACKED = "(max-width: 767px)";
/** A finger rather than a mouse is the main pointer. */
export const TOUCH = "(pointer: coarse)";

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
