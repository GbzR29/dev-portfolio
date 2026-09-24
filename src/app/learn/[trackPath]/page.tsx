// app/learn/[trackPath]/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import Link from "next/link";
import {
  ChevronRight, ArrowLeft, Clock, CheckCircle2, AlignLeft,
} from "lucide-react";
import { getTrack } from "@/lib/tracks";
import { getReference, referenceHref } from "@/lib/reference";
import { chapterUsage } from "@/lib/reference/usage";
import { LessonSidebar } from "@/components/sidebar/LessonSidebar";
import { DocsLayout } from "@/components/lesson/DocsLayout";
import { ReferenceProvider } from "@/components/reference/RefToken";
import { ChapterFunctions } from "@/components/reference/ChapterFunctions";

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

// ─── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ headings, activeId }: { headings: TocHeading[]; activeId: string }) {
  if (headings.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
        <AlignLeft size={11} />
        On this page
      </p>
      <nav className="space-y-0.5 border-l border-[var(--separator)]">
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`block -ml-px border-l py-1.5 text-[12.5px] leading-snug transition-colors
              ${h.level === 3 ? "pl-7" : "pl-4"}
              ${activeId === h.id
                ? "border-[var(--primary)] text-[var(--primary)] font-medium"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]"
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

/** Chapter selection lives in ?chapter= so lessons can be linked to directly. */
function readChapterParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("chapter");
}

export default function LessonPage() {
  const router   = useRouter();
  const params   = useParams();
  const { t }    = useLanguage();

  const trackPath = params?.trackPath
    ? decodeURIComponent(params.trackPath as string)
    : "";
  const track     = getTrack(trackPath);
  const reference = getReference(trackPath);

  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [headings, setHeadings]               = useState<TocHeading[]>([]);
  const [activeTocId, setActiveTocId]         = useState<string>("");

  const contentRef = useRef<HTMLDivElement>(null);
  const { visited, markVisited } = useLessonProgress(track?.id ?? "");

  const usage = useMemo(
    () => (track && reference ? chapterUsage(track, reference) : undefined),
    [track, reference],
  );

  // Init chapter from the URL, else the first one
  useEffect(() => {
    if (!track || activeChapterId) return;
    const fromUrl = readChapterParam();
    const valid   = fromUrl !== null && track.chapters.some((c) => c.id === fromUrl);
    setActiveChapterId(valid ? fromUrl : track.chapters[0].id);
  }, [track, activeChapterId]);

  // Redirect if track not found
  useEffect(() => {
    if (!track && trackPath && trackPath !== "undefined") {
      router.push("/status?type=development&from=learn");
    }
  }, [track, router, trackPath]);

  // On chapter change: mark visited, sync URL, scroll to top
  useEffect(() => {
    if (!activeChapterId) return;
    markVisited(activeChapterId);
    if (readChapterParam() !== activeChapterId) {
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", activeChapterId);
      window.history.replaceState(window.history.state, "", url);
    }
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

  return (
    <ReferenceProvider reference={reference}>
      <DocsLayout
        drawerTitle={t.lessonChapters ?? "Chapters"}
        drawerKey={activeChapterId}
        backHref="/learn"
        backLabel="Learn"
        left={
          <LessonSidebar
            track={track}
            chapters={track.chapters}
            activeId={activeChapterId}
            visited={visited}
            onSelect={setActiveChapterId}
            t={t}
            referenceHref={reference ? referenceHref(reference) : undefined}
          />
        }
        right={<TableOfContents headings={headings} activeId={activeTocId} />}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
          <Link href="/learn" className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
            <ArrowLeft size={12} />
            Learn
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-[var(--primary)]">{track.title}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-[var(--text-main)] truncate max-w-[220px]">{currentChapter?.title}</span>
        </div>

        {/* Chapter header */}
        <header className="mb-12 pb-10 border-b border-[var(--separator)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[11px] text-[var(--primary)] uppercase tracking-[0.25em]">
              {currentChapter?.section ?? track.title}
            </span>
            <span className="text-[var(--separator)] text-xs">·</span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              Chapter {currentIndex + 1} of {track.chapters.length}
            </span>
          </div>

          <h1 className="text-3xl md:text-[2.6rem] md:leading-[1.15] font-extrabold tracking-tight mb-6">
            {currentChapter?.title}
          </h1>

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2.5 flex-1 min-w-[140px] max-w-xs">
              <div className="flex-1 h-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)] whitespace-nowrap">
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

        {/* Chapter body — larger type and looser leading for long-form reading */}
        <div
          ref={contentRef}
          className="[&_article]:text-[1.125rem] [&_article]:leading-[1.85] [&_article>p]:!mt-6"
        >
          {currentChapter?.content(t)}

          {reference && usage && (
            <ChapterFunctions reference={reference} names={usage.get(activeChapterId) ?? []} />
          )}
        </div>

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-4 mt-16 pt-10 border-t border-[var(--separator)]">
          {prevChapter ? (
            <button
              onClick={() => setActiveChapterId(prevChapter.id)}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-main)] transition-all text-sm group"
            >
              <ArrowLeft size={15} className="flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              <div className="text-left min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-0.5">
                  {t.lessonPrev ?? "Previous"}
                </div>
                <div className="font-medium truncate">{prevChapter.title}</div>
              </div>
            </button>
          ) : <div />}

          {nextChapter ? (
            <button
              onClick={() => setActiveChapterId(nextChapter.id)}
              className="flex items-center justify-end gap-3 px-5 py-4 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-main)] transition-all text-sm group"
            >
              <div className="text-right min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 mb-0.5">
                  {t.lessonNext ?? "Next"}
                </div>
                <div className="font-medium truncate">{nextChapter.title}</div>
              </div>
              <ChevronRight size={15} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm">
              <CheckCircle2 size={15} />
              <span className="font-medium">Track complete!</span>
            </div>
          )}
        </div>
      </DocsLayout>
    </ReferenceProvider>
  );
}
