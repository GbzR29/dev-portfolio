// components/sections/HeroSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import HeroAvatar from "@/components/HeroAvatar";
import HeroCard from "@/components/cards/HeroCard";
import BinaryDecoration from "@/components/ui/BinaryDecoration";
import GridDecoration from "../ui/GridDecoration";

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section
      id="hero"
      className="
        relative w-full min-h-[100dvh]
        px-6 sm:px-10 lg:px-20
        pt-28 pb-20 lg:py-0
        flex items-center overflow-hidden
        bg-[var(--bg)]
      "
    >
      {/* ── Background layers ──────────────────────────────────────────────── */}

      {/* Honeycomb grid */}
      <GridDecoration />

      {/* Binary decoration — top left corner */}
      <BinaryDecoration
        className="absolute top-10 left-6 sm:left-10 z-0"
        text="01101101 01111001 00100000 01101111 01101110 01101100 01101001 01101110 01100101 00100000 01100011 01101111 01110010 01101110 01100101 01110010 00100001"
      />

      {/* ── Ambient lights — multiple sources for depth ────────────────────── */}
      {/*
        Three distinct light sources:
        - Left glow: blue, behind the text
        - Right glow: slightly cyan, behind the avatar
        - Center glow: very faint, ties everything together
      */}
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-1/2 -translate-y-1/2 -right-32 w-[450px] h-[450px] rounded-full bg-blue-400/6 blur-[100px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-blue-500/4 blur-[100px] pointer-events-none"
      />

      {/* ── Subtle scanline texture — reinforces the HUD / engine aesthetic ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
          backgroundSize: "100% 3px",
        }}
      />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div
        className={`
          relative z-10 w-full max-w-7xl mx-auto
          flex flex-col-reverse lg:flex-row
          items-center justify-between
          gap-14 lg:gap-20
          transition-opacity duration-700
          ${isMounted ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* Left: HeroCard — now a raw editorial layout, no Card wrapper */}
        <div
          className="
            w-full lg:max-w-2xl
            fill-mode-backwards
            animate-in fade-in slide-in-from-bottom-8 lg:slide-in-from-left-8
            duration-1000 delay-200
          "
        >
          <HeroCard />
        </div>

        {/* Right: Avatar */}
        <div
          className="
            w-full max-w-[260px] sm:max-w-[360px] lg:max-w-[400px]
            flex justify-center lg:justify-end flex-shrink-0
            fill-mode-backwards
            animate-in fade-in slide-in-from-top-8 lg:slide-in-from-right-8
            duration-1000 delay-500
          "
        >
          <HeroAvatar />
        </div>
      </div>

      {/* ── Bottom fade — blends into the next section ─────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[var(--bg)] to-transparent z-20 pointer-events-none"
      />
    </section>
  );
}