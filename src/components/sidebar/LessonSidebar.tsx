// components/sidebar/LessonSidebar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Aperture, BookMarked, Boxes, Braces, Calculator, CheckCircle2, ChevronRight, Clock, Crosshair, Divide, Gauge, Hash, Layers, Mountain, MoveUpRight, Puzzle, Radar, Shapes, Timer, Wand, Waves, Lightbulb, Move3d, Rocket, Sparkles, Wrench,
  type LucideIcon,
} from "lucide-react";
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

/** An icon per section, matched on its title; anything unknown gets a plain mark. */
const SECTION_ICONS: [RegExp, LucideIcon][] = [
  // Game Dev sections come first so their titles are not caught by the generic patterns below
  [/loop|time/i, Timer],
  [/motion|feel/i, Waves],
  [/procedural/i, Mountain],
  [/collision/i, Crosshair],
  [/architecture/i, Puzzle],
  [/getting|start/i, Rocket],
  [/transform|3d/i, Move3d],
  [/pbr|physically/i, Sparkles],
  [/post|effect/i, Aperture],
  [/perform/i, Gauge],
  [/technique/i, Wand],
  [/language|basics/i, Braces],
  [/shape|pattern/i, Shapes],
  [/raymarch/i, Radar],
  [/light/i, Lightbulb],
  [/model/i, Boxes],
  [/advanced/i, Layers],
  [/modern|tool/i, Wrench],
];
/** Section names that mean something different per track ("Foundations" in C++ vs Math). */
const TRACK_SECTION_ICONS: Record<string, [RegExp, LucideIcon][]> = {
  math: [[/arithmetic/i, Divide], [/foundation/i, Calculator], [/vector/i, MoveUpRight]],
};
const sectionIcon = (title: string, trackId: string) =>
  (TRACK_SECTION_ICONS[trackId] ?? []).concat(SECTION_ICONS).find(([re]) => re.test(title))?.[1] ?? Hash;

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

                {groupTitle && (() => {
                  const Icon = sectionIcon(groupTitle, track.id);
                  const pct = Math.round((doneInGroup / group.entries.length) * 100);
                  return (
                    <button
                      onClick={() => toggle(groupTitle)}
                      aria-expanded={isOpen}
                      className={`w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-lg mt-5 first:mt-0 transition-colors group
                        ${hasActive ? "bg-[var(--primary-low)]/60" : "hover:bg-[var(--primary-low)]/50"}`}
                    >
                      <span className="w-full flex items-center gap-2">
                        <ChevronRight
                          size={12}
                          className={`flex-shrink-0 transition-transform duration-200 text-[var(--text-muted)] ${isOpen ? "rotate-90" : ""}`}
                        />
                        <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors
                          ${hasActive
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] group-hover:text-[var(--primary)]"}`}
                        >
                          <Icon size={13} />
                        </span>
                        <span
                          className={`flex-1 text-left text-[12px] font-bold uppercase tracking-[0.1em] leading-tight transition-colors
                            ${hasActive ? "text-[var(--primary)]" : "text-[var(--text-main)]"}`}
                        >
                          {groupTitle}
                        </span>
                        <span className="flex-shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                          {doneInGroup}/{group.entries.length}
                        </span>
                      </span>
                      {/* Section progress, aligned with the title */}
                      <span className="block h-[3px] ml-[46px] mr-1 rounded-full bg-[var(--border)] overflow-hidden">
                        <span className="block h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${pct}%` }} />
                      </span>
                    </button>
                  );
                })()}

                {isOpen && (
                  // The tree: chapters hang off a vertical guide under the section icon
                  <div className={groupTitle ? "relative ml-[33px] mt-1 pl-3 border-l border-[var(--border)]" : ""}>
                    {group.entries.map(({ chapter, index }) => {
                      const isActive = chapter.id === activeId;
                      const isDone   = visited.has(chapter.id) && !isActive;

                      return (
                        <button
                          key={chapter.id}
                          onClick={() => onSelect(chapter.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative w-full flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-lg text-left
                            transition-colors duration-200 group
                            ${isActive ? "bg-[var(--primary-low)]" : "hover:bg-[var(--primary-low)]/60"}`}
                        >
                          {/* Branch from the guide line; the active one is highlighted */}
                          {groupTitle && (
                            <span className={`absolute -left-3 top-1/2 w-3 h-px ${isActive ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                          )}
                          {isActive && groupTitle && (
                            <span className="absolute -left-[13px] top-1 bottom-1 w-[2px] rounded-full bg-[var(--primary)]" />
                          )}

                          <span
                            className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center transition-colors
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

                          <span className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span
                              className={`text-[13px] leading-snug transition-colors
                                ${isActive
                                  ? "text-[var(--text-main)] font-semibold"
                                  : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                                }`}
                            >
                              {chapter.title}
                            </span>

                            {chapter.minRead && (
                              <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-mono text-[var(--text-muted)] opacity-60">
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
