"use client";

// ── Previous / next chapter ──────────────────────────────────────────────────

import Link from "next/link";
import type { Chapter } from "@/lib/tracks/types";

interface PagerLabels {
  prev: string;
  next: string;
  done: string;
  backToTracks: string;
}

const BOX = "grid gap-1 px-4 py-3.5 border border-[var(--border)] rounded-xl min-w-0 transition-colors";

export function ChapterPager({ prev, next, onSelect, labels }: {
  prev?: Chapter;
  next?: Chapter;
  onSelect: (id: string) => void;
  labels: PagerLabels;
}) {
  return (
    <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16 pt-8 border-t border-[var(--border)]">
      {prev ? (
        <button onClick={() => onSelect(prev.id)} className={`${BOX} text-left hover:border-[var(--primary)] group`}>
          <small className="font-mono text-[11.5px] text-[var(--text-muted)]">← {labels.prev}</small>
          <span className="font-display text-[19px] leading-snug truncate group-hover:text-[var(--primary)]">{prev.title}</span>
        </button>
      ) : <div className="hidden sm:block" />}

      {next ? (
        <button onClick={() => onSelect(next.id)} className={`${BOX} text-left sm:text-right hover:border-[var(--primary)] group`}>
          <small className="font-mono text-[11.5px] text-[var(--text-muted)]">{labels.next} →</small>
          <span className="font-display text-[19px] leading-snug truncate group-hover:text-[var(--primary)]">{next.title}</span>
        </button>
      ) : (
        <Link href="/learn" className={`${BOX} text-left sm:text-right hover:border-[var(--primary)] group`}>
          <small className="font-mono text-[11.5px] text-[var(--primary)]">✓ {labels.done}</small>
          <span className="font-display text-[19px] leading-snug group-hover:text-[var(--primary)]">{labels.backToTracks} →</span>
        </Link>
      )}
    </nav>
  );
}
