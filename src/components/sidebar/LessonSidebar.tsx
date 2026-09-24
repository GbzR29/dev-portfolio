// components/sidebar/LessonSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookMarked, CheckCircle2, ChevronRight, Clock } from "lucide-react";
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
  track, chapters, activeId, visited, onSelect, t, referenceHref,
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

  const toggle = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  return (
    <div className="flex flex-col gap-7 py-8">

      {/* ── Track meta + progress ─────────────────────────────────────── */}
      <div className="px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] mb-3">
          {track.title}
        </p>

        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {t?.lessonProgress ?? "Progress"}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            <span className="text-[var(--text-main)]">{visitedCount}</span>/{chapters.length}
            <span className="opacity-50"> · {visitedPct}%</span>
          </span>
        </div>

        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${visitedPct}%` }}
          />
        </div>
      </div>

      {/* ── Chapter rail, grouped by section ──────────────────────────── */}
      <nav>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-6 mb-2">
          {t?.lessonChapters ?? "Chapters"}
        </p>

        <div className="px-3 space-y-0.5">
          {groups.map((group, gi) => {
            const groupTitle  = group.title;
            const isOpen      = groupTitle === null || !collapsed.has(groupTitle);
            const doneInGroup = group.entries.filter((e) => visited.has(e.chapter.id)).length;
            const hasActive   = group.entries.some((e) => e.chapter.id === activeId);

            return (
              <div key={groupTitle ?? `ungrouped-${gi}`}>

                {groupTitle && (
                  <button
                    onClick={() => toggle(groupTitle)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg
                      transition-colors hover:bg-[var(--primary-low)]/60 group mt-4 first:mt-0"
                  >
                    <ChevronRight
                      size={11}
                      className={`flex-shrink-0 transition-transform duration-200
                        ${isOpen ? "rotate-90" : ""}
                        ${hasActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
                    />
                    <span
                      className={`flex-1 text-left text-[10px] font-bold uppercase tracking-[0.16em] leading-tight transition-colors
                        ${hasActive
                          ? "text-[var(--primary)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                        }`}
                    >
                      {groupTitle}
                    </span>
                    <span className="flex-shrink-0 text-[9px] font-mono text-[var(--text-muted)] opacity-55">
                      {doneInGroup}/{group.entries.length}
                    </span>
                  </button>
                )}

                {isOpen && (
                  <div className={groupTitle ? "pl-1.5" : ""}>
                    {group.entries.map(({ chapter, index }, i) => {
                      const isActive = chapter.id === activeId;
                      const isDone   = visited.has(chapter.id) && !isActive;
                      const isLast   = i === group.entries.length - 1;

                      return (
                        <button
                          key={chapter.id}
                          onClick={() => onSelect(chapter.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative w-full flex items-stretch gap-3 pl-3 pr-2.5 py-2.5 rounded-lg text-left
                            transition-colors duration-200 group
                            ${isActive
                              ? "bg-[var(--primary-low)]"
                              : "hover:bg-[var(--primary-low)]/60"
                            }`}
                        >
                          {/* Active accent bar */}
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--primary)]" />
                          )}

                          {/* Badge + connecting rail */}
                          <span className="flex flex-col items-center flex-shrink-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors
                                ${isActive
                                  ? "bg-[var(--primary)] text-white"
                                  : isDone
                                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-500"
                                  : "border border-[var(--border-strong)] text-[var(--text-muted)] group-hover:border-[var(--primary)]/50"
                                }`}
                            >
                              {isDone
                                ? <CheckCircle2 size={11} />
                                : <span className="text-[9px] font-bold font-mono">{index + 1}</span>
                              }
                            </span>
                            {!isLast && (
                              <span className="w-px flex-1 min-h-[10px] mt-1 -mb-2 bg-[var(--separator)]" />
                            )}
                          </span>

                          {/* Title + read time */}
                          <span className="flex-1 min-w-0 flex items-start justify-between gap-2 pt-0.5">
                            <span
                              className={`text-[13px] leading-snug transition-colors
                                ${isActive
                                  ? "text-[var(--text-main)] font-medium"
                                  : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                                }`}
                            >
                              {chapter.title}
                            </span>

                            {chapter.minRead && (
                              <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-mono text-[var(--text-muted)] opacity-50 pt-px">
                                <Clock size={9} />{chapter.minRead}m
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── API reference link ────────────────────────────────────────── */}
      {referenceHref && (
        <div className="px-3">
          <Link
            href={referenceHref}
            className="flex items-start gap-3 rounded-xl border border-[var(--border)] px-3.5 py-3
              hover:border-[var(--primary)]/50 hover:bg-[var(--primary-low)] transition-colors group"
          >
            <BookMarked size={16} className="mt-0.5 flex-shrink-0 text-[var(--primary)]" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-[var(--text-main)]">
                {t?.refTitle ?? "Function reference"}
              </span>
              <span className="text-[11px] leading-snug text-[var(--text-muted)]">
                {t?.refSidebarHint ?? "Every function used in the track, with parameters and examples"}
              </span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
