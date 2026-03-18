// app/learn/page.tsx
"use client";

import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import TriangleParticles from "@/components/particles/TriangleParticles";
import { MyButton } from "@/components/ui/Button";
import { BookOpen, Code2, Cpu, Globe, Zap, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

type TrackStatus = "available" | "coming-soon";

const TRACK_CONFIG = [
  { id: "cpp",    path: "C++",    title: "Modern C++",      lessonsCount: 15, icon: <Code2 size={26} />, accentColor: "#3b82f6", status: "available"    as TrackStatus },
  { id: "opengl", path: "OpenGL", title: "OpenGL 4.6",      lessonsCount: 22, icon: <Zap size={26} />,   accentColor: "#8b5cf6", status: "available"    as TrackStatus },
  { id: "vulkan", path: "Vulkan", title: "Vulkan API",       lessonsCount: 12, icon: <Cpu size={26} />,   accentColor: "#ef4444", status: "coming-soon"  as TrackStatus },
  { id: "sdl3",   path: "SDL3",   title: "SDL3 Framework",   lessonsCount: 8,  icon: <Globe size={26} />, accentColor: "#22c55e", status: "coming-soon"  as TrackStatus },
];

function TrackCard({ config, t }: { config: (typeof TRACK_CONFIG)[number]; t: any }) {
  const descMap: Record<string, string> = {
    cpp:    t.trackCppDesc,
    opengl: t.trackOpenglDesc,
    vulkan: t.trackVulkanDesc,
    sdl3:   t.trackSdlDesc,
  };
  const levelMap: Record<string, string> = {
    cpp:    t.begAdv,
    opengl: t.intermediate,
    vulkan: t.advanced,
    sdl3:   t.beginner,
  };

  const isAvailable = config.status === "available";

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300
      ${isAvailable
        ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        : "border-white/5 bg-white/[0.01] opacity-75"
      }
    `}>
      {/* Top color accent bar */}
      <div
        className="h-0.5 w-full flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${config.accentColor}, transparent)` }}
      />

      <div className="flex flex-col flex-grow p-6 sm:p-7">
        {/* Row: icon + level badge + optional soon badge */}
        <div className="flex items-start justify-between mb-5 gap-3">
          {/* Icon */}
          <div className="p-3 rounded-xl border flex-shrink-0"
            style={{ background: `${config.accentColor}14`, borderColor: `${config.accentColor}28`, color: config.accentColor }}>
            {config.icon}
          </div>

          {/* Right side: soon + level stacked vertically */}
          <div className="flex flex-col items-end gap-1.5">
            {!isAvailable && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                <Lock size={9} className="text-[var(--text-muted)]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Soon</span>
              </div>
            )}
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[var(--text-muted)] whitespace-nowrap">
              {levelMap[config.id]}
            </span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{config.title}</h3>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed flex-grow mb-6">
          {descMap[config.id]}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-mono">
            <BookOpen size={13} style={{ color: config.accentColor }} />
            <span>{config.lessonsCount} {t.lessons}</span>
          </div>

          {isAvailable ? (
            <Link href={`/learn/${config.path}`}>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group/btn"
                style={{
                  background: `${config.accentColor}15`,
                  color: config.accentColor,
                  border: `1px solid ${config.accentColor}28`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${config.accentColor}25`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${config.accentColor}15`; }}
              >
                {t.startTrack}
                <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </Link>
          ) : (
            <span className="text-xs text-[var(--text-muted)] font-mono opacity-50">// coming soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { t } = useLanguage();
  if (!t) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-main)] transition-colors duration-300">
      <TriangleParticles />
      <Navbar />

      <main className="flex-grow pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 space-y-16">

          <header className="space-y-5 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[var(--primary)]" />
              <span className="font-mono text-[10px] text-[var(--primary)] uppercase tracking-[0.3em]">
                // gabrielfc.dev/learn
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              {t.learnTitle} <span className="text-[var(--primary)]">{t.learnEngine}</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] leading-relaxed">{t.learnSubtitle}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACK_CONFIG.map((config) => (
              <TrackCard key={config.id} config={config} t={t} />
            ))}
          </div>

          {/* AI banner */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 bg-white/[0.02] p-8 md:p-10">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-[var(--primary)] opacity-5 blur-3xl rounded-full pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
              <div className="flex-shrink-0 p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-2xl text-[var(--primary)]">
                <Zap size={26} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold text-white mb-2">{t.aiTitle}</h4>
                <p className="text-[var(--text-muted)] max-w-xl">{t.aiDesc}</p>
              </div>
              <div className="md:ml-auto flex-shrink-0">
                <MyButton text={t.notifyMe} variant="outline" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}