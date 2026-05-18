// app/learn/[trackPath]/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";
import {
  ChevronRight, ArrowLeft, Clock, CheckCircle2,
  X, BookOpen, AlignLeft,
} from "lucide-react";
import { getTrack } from "@/lib/tracks";
import type { Chapter, Track } from "@/lib/tracks/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

// ─── useLessonProgress ────────────────────────────────────────────────────────

function useLessonProgress(trackId: string) {
  const key = `lesson:${trackId}:progress`;

  const [visited, setVisited] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(key);
      return stored ? new Set<string>(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markVisited = useCallback(
    (chapterId: string) => {
      setVisited((prev) => {
        if (prev.has(chapterId)) return prev;
        const next = new Set(prev);
        next.add(chapterId);
        try { localStorage.setItem(key, JSON.stringify([...next])); } catch {}
        return next;
      });
    },
    [key],
  );

  return { visited, markVisited };
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  track, chapters, activeId, visited, onSelect, t,
}: {
  track: Track;
  chapters: Chapter[];
  activeId: string;
  visited: Set<string>;
  onSelect: (id: string) => void;
  t: any;
}) {
  const visitedCount = visited.size;
  const visitedPct = Math.round((visitedCount / chapters.length) * 100);

  return (
    <div className="flex flex-col gap-5 py-5 px-4">
      {/* Track meta + progress */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] mb-2">
          {track.title}
        </p>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {t.lessonProgress ?? "Progress"}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {visitedCount}/{chapters.length}
          </span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${visitedPct}%` }}
          />
        </div>
      </div>

      {/* Chapter list */}
      <nav>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-1 mb-2">
          {t.lessonChapters ?? "Chapters"}
        </p>
        <div className="space-y-0.5">
          {chapters.map((ch, i) => {
            const isActive = ch.id === activeId;
            const isDone = visited.has(ch.id) && !isActive;
            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? "bg-[var(--primary)]/10 text-[var(--text-main)] border border-[var(--primary)]/20"
                    : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-white border border-transparent"
                  }`}
              >
                {/* Status indicator */}
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                    ${isActive
                      ? "bg-[var(--primary)] text-white"
                      : isDone
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 text-[var(--text-muted)] group-hover:bg-white/10"
                    }`}
                >
                  {isDone
                    ? <CheckCircle2 size={10} />
                    : <span className="text-[9px] font-bold font-mono">{i + 1}</span>
                  }
                </span>

                <span className="text-xs leading-snug flex-1 text-left">{ch.title}</span>

                {ch.minRead && (
                  <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-mono text-[var(--text-muted)] opacity-50">
                    <Clock size={9} />{ch.minRead}m
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ headings, activeId }: { headings: TocHeading[]; activeId: string }) {
  if (headings.length === 0) return null;

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
        <AlignLeft size={10} />
        On this page
      </p>
      <nav className="space-y-0.5">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block py-1 text-[11px] leading-relaxed transition-colors
              ${h.level === 3 ? "pl-3 border-l border-white/5" : ""}
              ${activeId === h.id
                ? "text-[var(--primary)] font-medium"
                : "text-[var(--text-muted)] hover:text-white"
              }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const router   = useRouter();
  const params   = useParams();
  const { t }    = useLanguage();

  const trackPath = params?.trackPath
    ? decodeURIComponent(params.trackPath as string)
    : "";
  const track = getTrack(trackPath);

  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [isDrawerOpen, setIsDrawerOpen]       = useState(false);
  const [headings, setHeadings]               = useState<TocHeading[]>([]);
  const [activeTocId, setActiveTocId]         = useState<string>("");

  const contentRef = useRef<HTMLDivElement>(null);
  const { visited, markVisited } = useLessonProgress(track?.id ?? "");

  // Init first chapter
  useEffect(() => {
    if (track && !activeChapterId) setActiveChapterId(track.chapters[0].id);
  }, [track, activeChapterId]);

  // Redirect if track not found
  useEffect(() => {
    if (!track && trackPath && trackPath !== "undefined") {
      router.push("/status?type=development&from=learn");
    }
  }, [track, router, trackPath]);

  // On chapter change: mark visited, close drawer, scroll to top
  useEffect(() => {
    if (!activeChapterId) return;
    markVisited(activeChapterId);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeChapterId, markVisited]);

  // Extract headings from rendered DOM after chapter content mounts
  useEffect(() => {
    const id = setTimeout(() => {
      if (!contentRef.current) return;
      const nodes = Array.from(contentRef.current.querySelectorAll("h2, h3"));
      setHeadings(
        nodes
          .filter((h) => h.id)
          .map((h) => ({
            id: h.id,
            text: h.textContent ?? "",
            level: (h.tagName === "H2" ? 2 : 3) as 2 | 3,
          })),
      );
      setActiveTocId(nodes[0]?.id ?? "");
    }, 60);
    return () => clearTimeout(id);
  }, [activeChapterId]);

  // Scroll spy — highlights ToC item as user scrolls
  useEffect(() => {
    if (!contentRef.current || headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 },
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (!track || !activeChapterId) return null;

  const currentIndex   = track.chapters.findIndex((c) => c.id === activeChapterId);
  const currentChapter = track.chapters[currentIndex];
  const prevChapter    = track.chapters[currentIndex - 1];
  const nextChapter    = track.chapters[currentIndex + 1];
  const overallPct     = Math.round(((currentIndex + 1) / track.chapters.length) * 100);

  const sidebarProps = {
    track,
    chapters: track.chapters,
    activeId: activeChapterId,
    visited,
    onSelect: setActiveChapterId,
    t,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <Navbar />

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[var(--bg)] border-r border-white/10 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 pt-6 pb-3 border-b border-white/5">
              <span className="text-sm font-semibold text-white">
                {t.lessonChapters ?? "Chapters"}
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-[var(--text-muted)]" />
              </button>
            </div>
            <SidebarContent {...sidebarProps} />
          </aside>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-24">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
          <Link href="/learn" className="hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} />
            Learn
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-[var(--primary)]">{track.title}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-white truncate max-w-[180px]">{currentChapter?.title}</span>
        </div>

        {/* 3-column layout */}
        <div className="flex gap-8 xl:gap-12 items-start">

          {/* ── Desktop sidebar ──────────────────────────────────────── */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-white/5 bg-white/[0.015]">
            <SidebarContent {...sidebarProps} />
          </aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* Chapter header */}
            <header className="mb-10 pb-8 border-b border-[var(--separator)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[10px] text-[var(--primary)] uppercase tracking-[0.25em]">
                  {track.title}
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  Chapter {currentIndex + 1} of {track.chapters.length}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold mb-5">
                {currentChapter?.title}
              </h1>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2.5 flex-1 min-w-[140px] max-w-xs">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                    {overallPct}%
                  </span>
                </div>
                {currentChapter?.minRead && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono">
                    <Clock size={12} />
                    {currentChapter.minRead} {t.lessonMinRead ?? "min read"}
                  </div>
                )}
              </div>
            </header>

            {/* Chapter body */}
            <div ref={contentRef}>
              {currentChapter?.content(t)}
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-[var(--separator)] gap-4">
              {prevChapter ? (
                <button
                  onClick={() => setActiveChapterId(prevChapter.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-main)] transition-all text-sm group"
                >
                  <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  <div className="text-left">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">
                      {t.lessonPrev ?? "Previous"}
                    </div>
                    <div className="font-medium">{prevChapter.title}</div>
                  </div>
                </button>
              ) : <div />}

              {nextChapter ? (
                <button
                  onClick={() => setActiveChapterId(nextChapter.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-white transition-all text-sm group ml-auto"
                >
                  <div className="text-right">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-60 mb-0.5">
                      {t.lessonNext ?? "Next"}
                    </div>
                    <div className="font-medium">{nextChapter.title}</div>
                  </div>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm ml-auto">
                  <CheckCircle2 size={15} />
                  <span className="font-medium">Track complete!</span>
                </div>
              )}
            </div>
          </main>

          {/* ── Table of Contents (xl+) ───────────────────────────────── */}
          <aside className="hidden xl:block w-44 flex-shrink-0 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <TableOfContents headings={headings} activeId={activeTocId} />
          </aside>
        </div>
      </div>

      {/* ── Mobile FAB — opens drawer ─────────────────────────────────── */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 left-6 z-30 lg:hidden flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-full shadow-lg shadow-[var(--primary)]/25 hover:opacity-90 transition-opacity"
        aria-label="Open chapters"
      >
        <BookOpen size={15} />
        Chapters
      </button>
    </div>
  );
}
