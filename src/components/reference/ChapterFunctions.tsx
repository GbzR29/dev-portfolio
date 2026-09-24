// src/components/reference/ChapterFunctions.tsx
"use client";

import Link from "next/link";
import { ArrowUpRight, BookMarked } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { loc, referenceHref, referenceIndex, type Reference } from "@/lib/reference";

/**
 * "Functions used in this chapter" — a grid of cards linking to the reference.
 * `names` comes from chapterUsage(), so the list follows the chapter's content.
 */
export function ChapterFunctions({ reference, names }: { reference: Reference; names: string[] }) {
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;
  const index = referenceIndex(reference);
  const entries = names.map((n) => index.get(n)).filter((e) => e !== undefined);

  if (entries.length === 0) return null;

  return (
    <section className="mt-20 pt-10 border-t border-[var(--separator)]">
      <div className="flex items-end justify-between gap-4 mb-2">
        <h2 id="chapter-functions" className="scroll-mt-28 text-xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-2">
          <BookMarked size={18} className="text-[var(--primary)]" />
          {tt.refUsedInChapter ?? "Functions used in this chapter"}
        </h2>
        <Link
          href={referenceHref(reference)}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors whitespace-nowrap"
        >
          {tt.refSeeAll ?? "Full reference →"}
        </Link>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        {tt.refUsedInChapterHint ??
          "Click any function to see its parameters, accepted values, common mistakes and an example."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.name}
            href={referenceHref(reference, entry.name)}
            className="group flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5
              hover:border-[var(--primary)]/50 hover:bg-[var(--primary-low)] transition-colors"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-mono text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors truncate">
                {entry.name}
              </span>
              <ArrowUpRight size={14} className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
            </span>
            <span className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">
              {loc(entry.summary, language)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
