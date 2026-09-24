// app/learn/[trackPath]/reference/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, ChevronRight, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { DocsLayout } from "@/components/lesson/DocsLayout";
import { ReferenceSidebar } from "@/components/reference/ReferenceSidebar";
import { getReference, loc, referenceHref } from "@/lib/reference";

export default function ReferenceIndexPage() {
  const params = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;

  const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
  const reference = getReference(trackPath);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!reference && trackPath) router.replace(`/learn/${encodeURIComponent(trackPath)}`);
  }, [reference, trackPath, router]);

  const groups = useMemo(() => {
    if (!reference) return [];
    const q = query.trim().toLowerCase();
    return reference.categories
      .map((cat) => ({
        cat,
        entries: reference.entries.filter(
          (e) =>
            e.category === cat.id &&
            (!q ||
              e.name.toLowerCase().includes(q) ||
              loc(e.summary, language).toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.entries.length > 0);
  }, [reference, query, language]);

  if (!reference) return null;

  return (
    <DocsLayout
      drawerTitle={tt.refTitle ?? "Function reference"}
      backHref={`/learn/${encodeURIComponent(trackPath)}`}
      backLabel={reference.title ?? "Back"}
      left={<ReferenceSidebar reference={reference} />}
      right={
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] mb-4">
            {tt.refCategories ?? "Categories"}
          </p>
          <nav className="space-y-0.5 border-l border-[var(--separator)]">
            {groups.map(({ cat, entries }) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="flex items-center justify-between -ml-px border-l border-transparent pl-4 py-1.5 text-[12.5px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)] transition-colors"
              >
                {loc(cat.title, language)}
                <span className="font-mono text-[10px] opacity-60">{entries.length}</span>
              </a>
            ))}
          </nav>
        </div>
      }
    >
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono mb-8">
        <Link href="/learn" className="hover:text-[var(--text-main)] transition-colors">Learn</Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href={`/learn/${encodeURIComponent(trackPath)}`} className="hover:text-[var(--text-main)] transition-colors">
          {reference.title}
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="text-[var(--text-main)]">{tt.refTitle ?? "Function reference"}</span>
      </div>

      <header className="mb-12 pb-10 border-b border-[var(--separator)]">
        <p className="font-mono text-[11px] text-[var(--primary)] uppercase tracking-[0.25em] mb-4">
          {reference.title}
        </p>
        <h1 className="text-3xl md:text-[2.6rem] md:leading-[1.15] font-extrabold tracking-tight mb-5">
          {tt.refTitle ?? "Function reference"}
        </h1>
        <p className="text-lg leading-relaxed text-[var(--text-muted)] max-w-2xl">
          {tt.refIntro ??
            "Every function used in the lessons, explained one by one: what it does, what each parameter means, which values it accepts, common mistakes and a short example."}
        </p>

        <label className="mt-8 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 focus-within:border-[var(--primary)]/60 transition-colors">
          <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tt.refSearch ?? "Search by name or description…"}
            className="w-full bg-transparent text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <span className="font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
            {reference.entries.length} {tt.refFunctions ?? "functions"}
          </span>
        </label>
      </header>

      <div className="space-y-14">
        {groups.map(({ cat, entries }) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)] mb-5">
              {loc(cat.title, language)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {entries.map((e) => (
                <Link
                  key={e.name}
                  href={referenceHref(reference, e.name)}
                  className="group flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5
                    hover:border-[var(--primary)]/50 hover:bg-[var(--primary-low)] transition-colors"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[13px] font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {e.name}
                    </span>
                    <ArrowUpRight size={14} className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </span>
                  <span className="text-xs leading-relaxed text-[var(--text-muted)] line-clamp-2">
                    {loc(e.summary, language)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-[var(--text-muted)]">{tt.refNoMatch ?? "No function matches."}</p>
        )}
      </div>
    </DocsLayout>
  );
}
