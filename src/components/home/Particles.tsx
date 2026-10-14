"use client";

// ── Floating particles ──────────────────────────────────────────────────────
// A few faint dots drifting behind the whole Home page, in both themes. The
// mouse pushes the nearby ones gently aside; they drift back on their own.
// Colours come from the --hm-ink / --hm-accent tokens, so a theme switch
// recolours them. With reduced motion the dots are drawn once and stay put.

import { useEffect, useRef } from "react";

type Dot = {
  x: number; y: number;     // position, CSS px
  vx: number; vy: number;   // own slow drift, px per frame
  px: number; py: number;   // push from the mouse, decays every frame
  r: number;                // radius
  a: number;                // base opacity
  warm: boolean;            // accent colour instead of ink
  phase: number;            // offset of the slow breathing of the opacity
};

const PUSH_RADIUS = 120;    // px around the cursor that feel the push
const PUSH_FORCE = 0.6;
const PUSH_DECAY = 0.94;    // per frame: the push fades in about a second
const MAX_DOTS = 70;
const AREA_PER_DOT = 22000; // px² of screen per dot

function makeDots(w: number, h: number): Dot[] {
  const count = Math.min(MAX_DOTS, Math.round((w * h) / AREA_PER_DOT));
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.1;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.03, // a slight upward bias, like dust in warm air
      px: 0, py: 0,
      r: Math.random() < 0.15 ? 1.8 : 1.1,
      a: 0.2 + Math.random() * 0.35,
      warm: Math.random() < 0.25,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

function readColours(host: Element) {
  const css = getComputedStyle(host);
  return {
    ink: css.getPropertyValue("--hm-ink").trim() || "#1d2427",
    accent: css.getPropertyValue("--hm-accent").trim() || "#2e6166",
    dark: document.documentElement.classList.contains("dark"),
  };
}

export default function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const g = canvas?.getContext("2d");
    if (!canvas || !host || !g) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0;
    let dots: Dot[] = [];
    let colours = readColours(host);
    const mouse = { x: -1e4, y: -1e4 };
    let frame = 0;
    let t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const nw = window.innerWidth, nh = window.innerHeight;
      canvas.width = nw * dpr;
      canvas.height = nh * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep the dots on a width change; phones fire resize when the URL bar hides
      if (dots.length === 0 || Math.abs(nw - w) > 1) dots = makeDots(nw, nh);
      w = nw; h = nh;
      if (still) draw();
    };

    const draw = () => {
      g.clearRect(0, 0, w, h);
      // Dark sky: dots glow a little brighter; light paper: ink stays faint
      const gain = colours.dark ? 1 : 0.75;
      for (const d of dots) {
        const breathe = 0.75 + 0.25 * Math.sin(t * 0.02 + d.phase);
        g.globalAlpha = d.a * breathe * gain;
        g.fillStyle = d.warm ? colours.accent : colours.ink;
        g.beginPath();
        g.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    };

    const step = () => {
      t++;
      for (const d of dots) {
        const dx = d.x - mouse.x, dy = d.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < PUSH_RADIUS * PUSH_RADIUS && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const f = (1 - dist / PUSH_RADIUS) * PUSH_FORCE;
          d.px += (dx / dist) * f;
          d.py += (dy / dist) * f;
        }
        d.px *= PUSH_DECAY;
        d.py *= PUSH_DECAY;
        d.x += d.vx + d.px;
        d.y += d.vy + d.py;
        // Wrap around the edges with a small margin so dots never pop in
        if (d.x < -10) d.x = w + 10; else if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10; else if (d.y > h + 10) d.y = -10;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => { mouse.x = mouse.y = -1e4; };

    // Theme switch = class change on <html>
    const themeObserver = new MutationObserver(() => {
      colours = readColours(host);
      if (still) draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    resize();
    window.addEventListener("resize", resize);
    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      frame = requestAnimationFrame(step); // rAF already sleeps in a hidden tab
    }

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hm-particles" aria-hidden="true" />;
}
