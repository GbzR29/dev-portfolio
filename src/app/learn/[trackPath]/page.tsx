// app/learn/[trackPath]/page.tsx
"use client";

import { ChapterBoundary } from "@/components/lesson/ChapterBoundary";
import { ChapterContent } from "@/components/lesson/ChapterContent";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getTrack } from "@/lib/tracks";
import type { TrackTranslations } from "@/lib/tracks/types";
import { rememberLastLesson, useLessonProgress } from "@/lib/tracks/progress";
import { trackCrumbs, trackName as trackNameOf } from "@/lib/tracks/crumbs";
import { useLessonText } from "@/lib/i18n/lessons";
import { getReference, referenceHref } from "@/lib/reference";
import { chapterNames } from "@/lib/reference/usage";
import { LessonSidebar } from "@/components/sidebar/LessonSidebar";
import { DocsLayout } from "@/components/lesson/DocsLayout";
import { OnThisPage, type TocHeading } from "@/components/lesson/OnThisPage";
import { ChapterPager } from "@/components/lesson/ChapterPager";
import { ReferenceProvider } from "@/components/reference/RefToken";
import { ChapterFunctions } from "@/components/reference/ChapterFunctions";
import { useChapterSteps } from "@/components/lesson/focus/useChapterSteps";
import { FocusNav, FocusProgress, ModeToggle, useFocusView, useLessonMode } from "@/components/lesson/focus/FocusMode";

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Chapter selection lives in ?chapter= so lessons can be linked to directly. */
function readChapterParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("chapter");
}

/** Focus-mode step from ?step= (1-based in the URL, 0-based here). */
function readStepParam(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(new URLSearchParams(window.location.search).get("step"));
  return Number.isInteger(n) && n > 0 ? n - 1 : 0;
}

/** Scrolls so the top of `el` sits just under the sticky top bar. */
function scrollBelowBar(el: HTMLElement | null) {
  if (!el) return;
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 49;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - bar - 12, behavior: "smooth" });
}

export default function LessonPage() {
  const router   = useRouter();
  const params   = useParams();
  const { t, language } = useLanguage();

  const trackPath = params?.trackPath
    ? decodeURIComponent(params.trackPath as string)
    : "";
  const track     = getTrack(trackPath);
  const reference = getReference(trackPath);

  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [headings, setHeadings]               = useState<TocHeading[]>([]);
  const [activeTocId, setActiveTocId]         = useState<string>("");

  const contentRef = useRef<HTMLDivElement>(null);

  // Lesson text in the current language (null while it downloads), merged over
  // the global UI strings; chapter titles and sections are translated for display.
  const lessonText = useLessonText(track?.id, language);
  const lessonT = useMemo(
    () => ({ ...t, ...lessonText?.strings }) as TrackTranslations,
    [t, lessonText],
  );
  const shownChapters = useMemo(
    () => (track?.chapters ?? []).map((c) => ({
      ...c,
      title: lessonText?.titles[c.id] ?? c.title,
      section: c.section && (lessonText?.sections[c.section] ?? c.section),
    })),
    [track, lessonText],
  );
  const { visited, markVisited } = useLessonProgress(track?.id ?? "");

  // Reference functions mentioned in the open chapter (scanned once its content has loaded)
  const [chapterFns, setChapterFns] = useState<string[]>([]);
  useEffect(() => {
    const chapter = track?.chapters.find((c) => c.id === activeChapterId);
    setChapterFns([]);
    if (!chapter || !reference) return;
    let alive = true;
    chapterNames(chapter, reference).then((names) => { if (alive) setChapterFns(names); });
    return () => { alive = false; };
  }, [track, reference, activeChapterId]);

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

  // Remember this chapter (with its title in the reading language) for /learn's "resume"
  const openIndex = track?.chapters.findIndex((c) => c.id === activeChapterId) ?? -1;
  const openTitle = shownChapters[openIndex]?.title;
  useEffect(() => {
    if (!activeChapterId || openIndex < 0) return;
    rememberLastLesson({ track: trackPath, chapter: activeChapterId, title: openTitle, number: openIndex + 1 });
  }, [trackPath, activeChapterId, openIndex, openTitle]);

  // Extract headings from the rendered chapter. Content arrives asynchronously
  // (it is downloaded on demand), so watch the DOM instead of reading it once.
  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    let last = "";
    const read = () => {
      const nodes = Array.from(root.querySelectorAll("h2, h3")).filter((h) => h.id);
      const key = nodes.map((h) => h.id).join("|");
      if (key === last) return;
      last = key;
      setHeadings(nodes.map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
        level: (h.tagName === "H2" ? 2 : 3) as 2 | 3,
      })));
      setActiveTocId(nodes[0]?.id ?? "");
    };
    let id = setTimeout(read, 60);
    const mo = new MutationObserver(() => { clearTimeout(id); id = setTimeout(read, 60); });
    mo.observe(root, { childList: true, subtree: true });
    return () => { clearTimeout(id); mo.disconnect(); };
  }, [activeChapterId]);

  // ── Focus mode: one h2 section per step ────────────────────────────────────
  const [mode, setMode] = useLessonMode();
  const focus = mode === "focus";
  const chapterNo = openIndex + 1;
  const steps = useChapterSteps(contentRef, chapterNo, activeChapterId);
  const [step, setStep] = useState(0);
  const stepFromUrl = useRef<number | null>(readStepParam());
  const stepAnchorRef = useRef<HTMLDivElement>(null);

  // A new chapter starts at its first step (the URL's step only on first load)
  useEffect(() => {
    if (!activeChapterId) return;
    setStep(stepFromUrl.current ?? 0);
    stepFromUrl.current = null;
  }, [activeChapterId]);

  // Keep the step inside the chapter once its steps are known
  useEffect(() => {
    if (steps.length && step > steps.length - 1) setStep(steps.length - 1);
  }, [steps.length, step]);

  // ?step= mirrors the step while focus mode is on
  useEffect(() => {
    if (!activeChapterId) return;
    const url = new URL(window.location.href);
    if (focus && step > 0) url.searchParams.set("step", String(step + 1));
    else url.searchParams.delete("step");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [focus, step, activeChapterId]);

  const nextChapter = shownChapters[openIndex + 1];
  const moveTo = useCallback((i: number) => {
    setStep(i);
    requestAnimationFrame(() => scrollBelowBar(stepAnchorRef.current));
  }, []);
  const go = useCallback((delta: 1 | -1) => {
    const target = step + delta;
    if (target < 0) return;
    if (target >= steps.length) { if (nextChapter) setActiveChapterId(nextChapter.id); return; }
    moveTo(target);
  }, [step, steps.length, nextChapter, moveTo]);

  useFocusView({ rootRef: contentRef, enabled: focus, step, count: steps.length, go });

  // "On this page" in focus mode: open the heading's step, then scroll to it
  const jumpToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (focus) {
      const owner = el.closest<HTMLElement>("article > [data-step]");
      const s = Number(owner?.dataset.step ?? 0);
      setStep(s);
      requestAnimationFrame(() => scrollBelowBar(el.tagName === "H2" ? stepAnchorRef.current : el));
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focus]);

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

  const ui = t as unknown as Record<string, string | undefined>;
  const trackName      = trackNameOf(ui, trackPath);
  const currentIndex   = track.chapters.findIndex((c) => c.id === activeChapterId);
  const currentChapter = shownChapters[currentIndex];
  const chapterOf      = (ui.lessonChapterOf ?? "chapter {n} of {total}")
    .replace("{n}", String(currentIndex + 1))
    .replace("{total}", String(track.chapters.length));
  const focusSteps     = focus && steps.length > 1;
  const lastStep       = !focusSteps || step >= steps.length - 1;

  return (
    <ReferenceProvider reference={reference}>
      <DocsLayout
        crumbs={[...trackCrumbs(ui, trackPath), { label: currentChapter?.title ?? "" }]}
        drawerTitle={t.lessonChapters ?? "Chapters"}
        drawerKey={activeChapterId}
        backHref="/learn"
        backLabel={ui.lessonAllTracks ?? "All tracks"}
        left={
          <LessonSidebar
            track={track}
            title={trackName}
            chapters={shownChapters}
            activeId={activeChapterId}
            visited={visited}
            onSelect={setActiveChapterId}
            t={t}
            referenceHref={reference ? referenceHref(reference) : undefined}
          />
        }
        right={<OnThisPage headings={headings} activeId={activeTocId} label={ui.lessonOnThisPage ?? "On this page"} onJump={jumpToHeading} />}
      >
        {/* Chapter header */}
        <header className="mb-10 pb-8 border-b border-[var(--border)] space-y-3">
          <p className="font-mono text-[12.5px] tracking-[0.04em] text-[var(--primary)]">
            {currentChapter?.section ?? trackName} · {chapterOf}
          </p>
          <h1 className="font-display text-[2.2rem] md:text-[2.9rem] leading-[1.08] tracking-[-0.01em] [text-wrap:balance]">
            {currentChapter?.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {currentChapter?.minRead && (
              <p className="font-mono text-[12px] text-[var(--text-muted)]">
                {currentChapter.minRead} {t.lessonMinRead ?? "min read"}
              </p>
            )}
            <ModeToggle
              mode={mode}
              onChange={setMode}
              labels={{ read: ui.modeRead ?? "reading", focus: ui.modeFocus ?? "focus", title: ui.modeTitle ?? "Reading mode" }}
            />
          </div>
        </header>

        <div ref={stepAnchorRef} />
        {focusSteps && (
          <FocusProgress
            steps={steps}
            step={step}
            onPick={moveTo}
            introLabel={ui.focusIntro ?? "Introduction"}
            stepOf={(ui.focusStepOf ?? "{n} of {total}").replace("{n}", String(step + 1)).replace("{total}", String(steps.length))}
          />
        )}

        {/* Chapter body — larger type and looser leading for long-form reading */}
        <div
          ref={contentRef}
          className="lesson-body [&_article]:text-[1.06rem] [&_article]:leading-[1.8] [&_article>p]:!mt-6 [&_article>p]:max-w-[68ch]"
        >
          <ChapterBoundary resetKey={activeChapterId}>
            {lessonText
              ? <ChapterContent chapter={track.chapters[currentIndex]} t={lessonT} preload={track.chapters[currentIndex + 1]} />
              : <div className="min-h-[60vh]" aria-busy="true" />}
          </ChapterBoundary>

          {reference && lastStep && <ChapterFunctions reference={reference} names={chapterFns} />}
        </div>

        {focusSteps && (
          <FocusNav
            step={step}
            steps={steps}
            onGo={go}
            nextChapterTitle={nextChapter?.title}
            labels={{
              back: ui.focusBack ?? "back",
              next: ui.focusNext ?? "continue",
              nextChapter: ui.focusNextChapter ?? "next lesson",
              hintKeys: ui.focusHintKeys ?? "← → move between steps",
              hintSwipe: ui.focusHintSwipe ?? "swipe to move between steps",
            }}
          />
        )}

        {/* In focus mode the pager appears only when the track ends here */}
        {(!focusSteps || (lastStep && !nextChapter)) && (
          <ChapterPager
            prev={shownChapters[currentIndex - 1]}
            next={shownChapters[currentIndex + 1]}
            onSelect={setActiveChapterId}
            labels={{
              prev: ui.lessonPrevShort ?? "previous",
              next: ui.lessonNextShort ?? "next",
              done: ui.lessonTrackDone ?? "track complete",
              backToTracks: ui.lessonAllTracks ?? "All tracks",
            }}
          />
        )}
      </DocsLayout>
    </ReferenceProvider>
  );
}
