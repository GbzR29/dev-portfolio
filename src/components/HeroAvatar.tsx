// components/HeroAvatar.tsx
"use client";

import HeroImage from "@/components/HeroImage";

// ─── HUD corner bracket SVG ────────────────────────────────────────────────────
// Decorative corner brackets that reinforce the game-engine-debug-overlay aesthetic.
// Pure CSS would work too, but SVG keeps it sharp at all sizes.

function HUDCorner({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const transforms = {
    tl: "",
    tr: "rotate-90",
    bl: "-rotate-90",
    br: "rotate-180",
  };
  const positions = {
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  };

  return (
    <div
      className={`absolute ${positions[position]} w-5 h-5 ${transforms[position]} opacity-60`}
    >
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 10 L1 1 L10 1"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroAvatar() {
  return (
    <div className="relative w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] group isolate">

      {/* ── Glow layers ─────────────────────────────────────────────────── */}

      {/* 1. Back glow — ultra-diffuse */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/25 via-blue-400/15 to-cyan-500/20 blur-[80px] animate-pulse group-hover:scale-110 transition-transform duration-1000" />

      {/* ── Orbital rings ───────────────────────────────────────────────── */}

      {/* Ring outer — clockwise, dashed */}
      <div className="absolute inset-[-18px] rounded-full border-[1.5px] border-dashed border-[var(--primary)]/25 animate-[spin_35s_linear_infinite] opacity-50 pointer-events-none" />

      {/* Ring inner — counter-clockwise, dotted */}
      <div className="absolute inset-[-7px] rounded-full border border-dotted border-blue-400/15 animate-[spin_22s_linear_reverse_infinite] opacity-60 pointer-events-none" />

      {/* ── HUD frame — adds game-engine overlay feeling ──────────────── */}
      {/*
        A square container with corner brackets sits around the circular avatar.
        It floats just slightly outside the circle, creating a tech-UI framing.
      */}
      <div className="absolute inset-[-28px] pointer-events-none">
        <HUDCorner position="tl" />
        <HUDCorner position="tr" />
        <HUDCorner position="bl" />
        <HUDCorner position="br" />
      </div>

      {/* ── Photo container ─────────────────────────────────────────────── */}
      <div className="relative h-full w-full rounded-full p-3 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-md border border-white/20 shadow-[0_0_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Vignette overlay for depth */}
        <div className="absolute inset-0 z-10 rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.55)] pointer-events-none" />

        {/* Photo with hover effects */}
        <div className="relative h-full w-full rounded-full overflow-hidden bg-[var(--surface)]">
          <div className="h-full w-full grayscale-[20%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out">
            <HeroImage
              path="/perfil.jpeg"
              alt="Gabriel Carvalho — Game Developer"
              width={400}
              height={400}
              className="object-cover h-full w-full"
            />
          </div>
        </div>
      </div>

      {/* ── Status badge — HUD-style ─────────────────────────────────────── */}
      {/*
        Positioned to overlap the bottom-right of the circle.
        The ping animation reinforces "live / available".
      */}
      <div className="absolute bottom-5 -right-3 sm:-right-4 z-20">
        <div className="flex items-center gap-2 bg-black/65 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-2xl shadow-xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold font-mono text-white tracking-[0.18em] uppercase">
            Available
          </span>
        </div>
      </div>

      {/* ── HUD telemetry label — subtle, below the avatar ───────────────── */}
      {/*
        A small monospaced coordinate label. Purely decorative.
        Reinforces the "you are looking at a game dev's portfolio" feel.
      */}
      <div
        aria-hidden
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[var(--primary)]/30 tracking-[0.25em] select-none whitespace-nowrap"
      >
        ID:GFC · GRAPHICS_DEV
      </div>
    </div>
  );
}