// src/components/reference/ReferenceSidebar.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { loc, referenceHref, type Reference } from "@/lib/reference";

/** Left rail for reference pages: filter box + functions grouped by category. */
export function ReferenceSidebar({ reference, activeName }: { reference: Reference; activeName?: string }) {
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reference.categories
      .map((cat) => ({
        cat,
        entries: reference.entries
          .filter((e) => e.category === cat.id)
          .filter((e) => !q || e.name.toLowerCase().includes(q)),
      }))
      .filter((g) => g.entries.length > 0);
  }, [reference, query]);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="px-6 space-y-4">
        <Link
          href={`/learn/${encodeURIComponent(reference.trackPath)}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <ArrowLeft size={12} />
          {tt.refBackToLessons ?? "Back to lessons"}
        </Link>

        <Link href={referenceHref(reference)} className="block">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] mb-1">
            {reference.title}
          </p>
          <p className="text-base font-semibold text-[var(--text-main)]">
            {tt.refTitle ?? "Function reference"}
          </p>
        </Link>

        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 focus-within:border-[var(--primary)]/60 transition-colors">
          <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tt.refFilter ?? "Filter functions…"}
            className="w-full bg-transparent text-[13px] font-mono text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </label>
      </div>

      <nav className="px-3 space-y-5">
        {groups.map(({ cat, entries }) => (
          <div key={cat.id}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {loc(cat.title, language)}
            </p>
            {entries.map((e) => {
              const isActive = e.name === activeName;
              return (
                <Link
                  key={e.name}
                  href={referenceHref(reference, e.name)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative block px-3 py-1.5 rounded-lg font-mono text-[12.5px] truncate transition-colors
                    ${isActive
                      ? "bg-[var(--primary-low)] text-[var(--primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:bg-[var(--primary-low)]/60 hover:text-[var(--text-main)]"
                    }`}
                >
                  {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--primary)]" />}
                  {e.name}
                </Link>
              );
            })}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-3 text-xs text-[var(--text-muted)]">{tt.refNoMatch ?? "No function matches."}</p>
        )}
      </nav>
    </div>
  );
}
