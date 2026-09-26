// components/sidebar/LessonSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Chapter, Track } from "@/lib/tracks/types";

/** Only the keys this sidebar reads — keeps it decoupled from the full bundle. */
interface SidebarLabels {
  lessonProgress?: string;
  lessonChapters?: string;
  refTitle?: string;
  refSidebarHint?: string;
}

interface LessonSidebarProps {
  track: Track;
  /** Shown as the rail's heading; defaults to the track's catalog title. */
  title?: string;
  chapters: Chapter[];
  activeId: string;
  visited: Set<string>;
  onSelect: (id: string) => void;
  t: SidebarLabels;
  /** When set, a link to the track's API reference is shown under the chapters. */
  referenceHref?: string;
}

/** A chapter plus its position in the flat list, so numbering stays global. */
type Entry = { chapter: Chapter; index: number };
type Group = { title: string | null; entries: Entry[] };

/** Groups consecutive chapters that share a section. */
function groupChapters(chapters: Chapter[]): Group[] {
  const groups: Group[] = [];
  chapters.forEach((chapter, index) => {
    const title = chapter.section ?? null;
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.entries.push({ chapter, index });
    else groups.push({ title, entries: [{ chapter, index }] });
  });
  return groups;
}

export function LessonSidebar({
  track, title, chapters, activeId, visited, onSelect, t, referenceHref,
}: LessonSidebarProps) {
  const groups = useMemo(() => groupChapters(chapters), [chapters]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visitedCount = visited.size;
  const visitedPct   = chapters.length ? Math.round((visitedCount / chapters.length) * 100) : 0;

  // Never let the active chapter hide inside a collapsed section.
  const activeSection = chapters.find((c) => c.id === activeId)?.section ?? null;
  useEffect(() => {
    if (!activeSection) return;
    setCollapsed((prev) => {
      if (!prev.has(activeSection)) return prev;
      const next = new Set(prev);
      next.delete(activeSection);
      return next;
    });
  }, [activeSection]);

  const toggle = (name: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="flex flex-col gap-6 px-5 py-6">

      {/* ── Track title + progress ────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="font-display text-[24px] leading-tight text-[var(--text-main)]">{title ?? track.title}</h2>
        <div className="flex items-baseline justify-between font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums">
          <span>{t?.lessonProgress ?? "Progress"}</span>
          <span><span className="text-[var(--text-main)]">{visitedCount}</span>/{chapters.length} · {visitedPct}%</span>
        </div>
        <div className="h-[3px] bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${visitedPct}%` }} />
        </div>
      </div>

      {/* ── Chapters, grouped by section ──────────────────────────────── */}
      <nav aria-label={t?.lessonChapters ?? "Chapters"}>
        {groups.map((group, gi) => {
          const name        = group.title;
          const isOpen      = name === null || !collapsed.has(name);
          const doneInGroup = group.entries.filter((e) => visited.has(e.chapter.id)).length;

          return (
            <div key={name ?? `ungrouped-${gi}`}>
              {name && (
                <button
                  onClick={() => toggle(name)}
                  aria-expanded={isOpen}
                  className="w-full flex items-baseline justify-between gap-2 pt-2.5 pb-1.5 border-t border-[var(--border)]
                    font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  <span className="flex items-baseline gap-1.5 text-left">
                    <ChevronRight size={11} className={`self-center flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                    {name}
                  </span>
                  <span className="tracking-normal tabular-nums">{doneInGroup}/{group.entries.length}</span>
                </button>
              )}

              {isOpen && (
                <ol className="mb-2">
                  {group.entries.map(({ chapter, index }) => {
                    const isActive = chapter.id === activeId;
                    const isDone   = visited.has(chapter.id);
                    return (
                      <li key={chapter.id}>
                        <button
                          onClick={() => onSelect(chapter.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-full grid grid-cols-[22px_1fr_auto] gap-2 items-baseline text-left py-1.5 pr-2 pl-2.5 -ml-2.5 border-l-2 transition-colors
                            ${isActive
                              ? "border-[var(--primary)] bg-[var(--primary-low)] text-[var(--text-main)] font-medium"
                              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--primary-low)]"}`}
                        >
                          <span className={`font-mono text-[11px] tabular-nums ${isActive || isDone ? "text-[var(--primary)]" : ""}`}>
                            {isDone && !isActive ? "✓" : index + 1}
                          </span>
                          <span className="text-[13.5px] leading-snug">{chapter.title}</span>
                          {chapter.minRead && (
                            <span className="font-mono text-[10.5px] text-[var(--text-muted)] tabular-nums">{chapter.minRead}m</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── API reference link ────────────────────────────────────────── */}
      {referenceHref && (
        <Link
          href={referenceHref}
          className="block border-t border-[var(--border)] pt-4 group"
        >
          <span className="block font-mono text-[12.5px] text-[var(--primary)] group-hover:underline underline-offset-4">
            {t?.refTitle ?? "Function reference"} →
          </span>
          <span className="block mt-1 text-[12px] leading-snug text-[var(--text-muted)]">
            {t?.refSidebarHint ?? "Every function used in the track, with parameters and examples"}
          </span>
        </Link>
      )}
    </div>
  );
}
