// components/cards/HeroCard.tsx
"use client";

import { ArrowRight, Download } from "lucide-react";
import Typewriter from "@/components/Typewriter";
import { zIndex } from "@/lib/z-index";
import { useLanguage } from "@/components/providers/LanguageProvider";

// ─── Static stats — facts about Gabriel that shouldn't be translated ──────────
const STATS = [
  { label: "since",  value: "2016"         },
  { label: "stack",  value: "C++ / OpenGL"  },
  { label: "projs",  value: "4+"            },
  { label: "focus",  value: "Engine Dev"    },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroCard() {
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  return (
    <div className="space-y-7 lg:space-y-8" style={{ zIndex: zIndex.card }}>

      {/* ── 1. Tag line ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px w-10 bg-[var(--primary)]" />
        <span className="font-mono text-[10px] sm:text-xs text-[var(--primary)] uppercase tracking-[0.3em] select-none">
          // graphics programmer & game dev
        </span>
      </div>

      {/* ── 2. Name — Orbitron for maximum futuristic impact ──────────────── */}
      {/*
        The name is the hero. Orbitron was imported in layout.tsx exactly for this.
        Two lines: first line white, second line primary-colored.
        The period at the end is intentional — a typographic period adds gravitas.
      */}
      <div>
        <h1
          className="
            text-[clamp(3rem,8vw,6rem)]
            font-black leading-[0.88] tracking-tighter text-white
          "
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <span className="block">GABRIEL</span>
          <span className="block text-[var(--primary)]">
            CARVALHO
            <span className="text-white/30">.</span>
          </span>
        </h1>
      </div>

      {/* ── 3. Terminal typewriter — role/title ───────────────────────────── */}
      <div className="flex items-center gap-2.5 font-mono h-6">
        <span className="text-[var(--primary)] text-sm select-none opacity-80">&gt;_</span>
        <Typewriter
          text={t?.heroRole || "Building a game engine from scratch"}
          speed={65}
          loop
          pauseDuration={3200}
        >
          {(current) => (
            <span className="text-[var(--text-muted)] text-sm sm:text-base">
              {current}
              <span className="animate-cursor-blink text-[var(--primary)] ml-px font-bold">|</span>
            </span>
          )}
        </Typewriter>
      </div>

      {/* ── 4. Description ────────────────────────────────────────────────── */}
      <p className="text-[var(--text-muted)] text-base sm:text-lg leading-relaxed max-w-lg">
        {t?.heroDescription ||
          "C++ developer passionate about graphics programming, game engine architecture, and low-level systems. Building from scratch since 2016."}
      </p>

      {/* ── 5. Stats row — game engine debug-panel aesthetic ──────────────── */}
      <div className="flex flex-wrap gap-2">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="
              flex items-center gap-2 px-3 py-1.5
              rounded-lg bg-white/[0.04] border border-white/[0.07]
              hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5
              transition-colors duration-300
            "
          >
            <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em]">
              {stat.label}
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="font-mono text-[11px] text-[var(--primary)] font-bold">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── 6. CTAs — clear visual hierarchy ─────────────────────────────── */}
      {/*
        Three levels of emphasis:
        - Primary: solid blue, arrow icon, most important action
        - Secondary: ghost border, equal visual weight
        - Tertiary: text-only, download action (least critical)
      */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Primary CTA */}
        <button
          onClick={() => scrollToSection("projects")}
          className="
            group flex items-center gap-2.5
            px-6 py-3 rounded-xl
            bg-[var(--primary)] text-white font-semibold text-sm
            hover:bg-[var(--primary-hover)]
            hover:shadow-[0_0_32px_rgba(59,130,246,0.55)]
            active:scale-[0.97]
            transition-all duration-300
          "
        >
          {t?.heroViewProjects || "View Projects"}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => scrollToSection("contact")}
          className="
            flex items-center gap-2
            px-6 py-3 rounded-xl
            border border-white/15 text-[var(--text-main)] font-semibold text-sm
            hover:border-[var(--primary)] hover:text-[var(--primary)]
            active:scale-[0.97]
            transition-all duration-300
          "
        >
          {t?.heroContact || "Contact Me"}
        </button>

        {/* Tertiary — CV download */}
        <button
          onClick={() => window.open("/pdf/resume.pdf", "_blank")}
          className="
            flex items-center gap-1.5
            px-3 py-3
            text-[var(--text-muted)] font-medium text-sm
            hover:text-white
            transition-colors duration-300
          "
        >
          <Download size={14} />
          {t?.heroMyCv || "CV"}
        </button>
      </div>
    </div>
  );
}