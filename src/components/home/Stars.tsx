"use client";

// ── Static star field ───────────────────────────────────────────────────────
// Drawn once (and again on resize) behind the hero. Only visible in the dark
// theme — home.css hides the canvas otherwise. A fixed seed keeps the sky the
// same on every visit.

import { useEffect, useRef } from "react";

const STAR = "#e7e3ef";
const WARM_STAR = "#f1b39c";

function draw(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  if (!host) return;
  const w = host.clientWidth;
  const h = host.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const g = canvas.getContext("2d");
  if (!g) return;
  g.scale(dpr, dpr);

  // Park–Miller generator: deterministic, so the sky never reshuffles
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Roughly one star per 5200 px², kept out of the bottom 15% near the horizon
  const count = Math.round((w * h) / 5200);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.85;
    const r = rnd() < 0.08 ? 1.3 : 0.7;
    g.globalAlpha = 0.18 + rnd() * 0.45;
    g.fillStyle = rnd() < 0.15 ? WARM_STAR : STAR;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
}

export default function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas?.parentElement) return;
    const ro = new ResizeObserver(() => draw(canvas));
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  return <canvas ref={ref} className="hm-stars" aria-hidden="true" />;
}
