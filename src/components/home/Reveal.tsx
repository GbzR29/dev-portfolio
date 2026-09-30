"use client";

// ── Scroll reveal ───────────────────────────────────────────────────────────
// Fades each Home section in the first time it scrolls into view. It only
// arms itself (.hm-reveal on .home) once JS runs, so without JS — or with
// "reduce motion", which home.css respects — everything is simply visible.

import { useEffect } from "react";

export default function Reveal() {
  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".home");
    if (!home || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    home.classList.add("hm-reveal");
    home.querySelectorAll(".hm-sec").forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      home.classList.remove("hm-reveal");
    };
  }, []);

  return null;
}
