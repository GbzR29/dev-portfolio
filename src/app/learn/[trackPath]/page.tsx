// app/learn/[trackPath]/page.tsx
// Key change: currentChapter.content is now called as a function with t
"use client";

import Navbar from "@/components/navbar/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { getTrack } from "@/lib/tracks";
import type { Chapter } from "@/lib/tracks/types";

function Sidebar({ chapters, activeId, onSelect, t }: {
  chapters: Chapter[];
  activeId: string;
  onSelect: (id: string) => void;
  t: any;
}) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="lg:sticky lg:top-28 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1 mb-3">
          {t.lessonChapters}
        </p>
        <nav className="space-y-0.5">
          {chapters.map((ch, i) => {
            const isActive = ch.id === activeId;
            return (
              <button key={ch.id} onClick={() => onSelect(ch.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? "bg-[var(--primary)]/10 text-white border border-[var(--primary)]/20"
                    : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white border border-transparent"}`}>
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono transition-colors
                  ${isActive ? "bg-[var(--primary)] text-white" : "bg-white/5 text-[var(--text-muted)] group-hover:bg-white/10"}`}>
                  {i + 1}
                </span>
                <span className="text-sm leading-snug flex-1">{ch.title}</span>
                {ch.minRead && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-mono text-[var(--text-muted)] opacity-60">
                    <Clock size={9} />{ch.minRead}m
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
  const track = getTrack(trackPath);
  const [activeChapterId, setActiveChapterId] = useState<string>("");

  useEffect(() => {
    if (track && !activeChapterId) setActiveChapterId(track.chapters[0].id);
  }, [track, activeChapterId]);

  useEffect(() => {
    if (!track && trackPath && trackPath !== "undefined") {
      router.push("/status?type=development&from=learn");
    }
  }, [track, router, trackPath]);

  if (!track || !activeChapterId) return null;

  const currentIndex = track.chapters.findIndex((c) => c.id === activeChapterId);
  const currentChapter = track.chapters[currentIndex];
  const prevChapter = track.chapters[currentIndex - 1];
  const nextChapter = track.chapters[currentIndex + 1];
  const progress = Math.round(((currentIndex + 1) / track.chapters.length) * 100);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-28 pb-24">

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
          <Link href="/learn" className="hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} />
            {(t.lessonBackToLearn ?? "Back to modules").replace("← ", "")}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span>{track.title}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-white">{currentChapter?.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <Sidebar chapters={track.chapters} activeId={activeChapterId} onSelect={setActiveChapterId} t={t} />

          <main className="flex-1 min-w-0">
            <header className="mb-10 pb-8 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] text-[var(--primary)] uppercase tracking-[0.25em]">{track.title}</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {t.lessonProgress ?? "Progress"}: {progress}%
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{currentChapter?.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--primary)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                {currentChapter?.minRead && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Clock size={12} />{currentChapter.minRead} {t.lessonMinRead ?? "min read"}
                  </div>
                )}
              </div>
            </header>

            {/* content is now called as a function, passing t for translations */}
            <div>{currentChapter?.content(t)}</div>

            <div className="flex items-center justify-between mt-16 pt-8 border-t border-white/10 gap-4">
              {prevChapter ? (
                <button onClick={() => setActiveChapterId(prevChapter.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white transition-all text-sm group">
                  <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">{t.lessonPrev ?? "Previous"}</div>
                    <div className="font-medium">{prevChapter.title}</div>
                  </div>
                </button>
              ) : <div />}

              {nextChapter ? (
                <button onClick={() => setActiveChapterId(nextChapter.id)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white transition-all text-sm group text-right ml-auto">
                  <div className="text-right">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">{t.lessonNext ?? "Next"}</div>
                    <div className="font-medium">{nextChapter.title}</div>
                  </div>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm ml-auto">
                  <CheckCircle2 size={15} />
                  <span className="font-medium">Track complete!</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}