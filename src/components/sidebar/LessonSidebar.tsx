// components/sidebar/LessonSidebar.tsx
"use client";

import { CheckCircle2, Clock } from "lucide-react";
import type { Chapter, Track } from "@/lib/tracks/types";

/** Only the keys this sidebar reads — keeps it decoupled from the full bundle. */
interface SidebarLabels {
  lessonProgress?: string;
  lessonChapters?: string;
}

interface LessonSidebarProps {
  track: Track;
  chapters: Chapter[];
  activeId: string;
  visited: Set<string>;
  onSelect: (id: string) => void;
  t: SidebarLabels;
}

export function LessonSidebar({
  track, chapters, activeId, visited, onSelect, t,
}: LessonSidebarProps) {
  const visitedCount = visited.size;
  const visitedPct   = chapters.length ? Math.round((visitedCount / chapters.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 py-5">

      {/* ── Track meta + progress ─────────────────────────────────────── */}
      <div className="px-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] mb-3">
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

      {/* ── Chapter rail ──────────────────────────────────────────────── */}
      <nav>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] px-4 mb-1.5">
          {t?.lessonChapters ?? "Chapters"}
        </p>

        <div className="px-2">
          {chapters.map((ch, i) => {
            const isActive = ch.id === activeId;
            const isDone   = visited.has(ch.id) && !isActive;
            const isLast   = i === chapters.length - 1;

            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative w-full flex items-stretch gap-3 pl-3 pr-2.5 py-2 rounded-lg text-left
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
                      : <span className="text-[9px] font-bold font-mono">{i + 1}</span>
                    }
                  </span>
                  {!isLast && (
                    <span className="w-px flex-1 min-h-[10px] mt-1 -mb-2 bg-[var(--separator)]" />
                  )}
                </span>

                {/* Title + read time */}
                <span className="flex-1 min-w-0 flex items-start justify-between gap-2 pt-0.5">
                  <span
                    className={`text-xs leading-snug transition-colors
                      ${isActive
                        ? "text-[var(--text-main)] font-medium"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                      }`}
                  >
                    {ch.title}
                  </span>

                  {ch.minRead && (
                    <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-mono text-[var(--text-muted)] opacity-50 pt-px">
                      <Clock size={9} />{ch.minRead}m
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
