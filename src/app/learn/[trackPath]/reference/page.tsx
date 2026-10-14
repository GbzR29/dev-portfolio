// app/learn/[trackPath]/reference/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpRight, Search } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { DocsLayout } from "@/components/lesson/DocsLayout";
import { trackCrumbs } from "@/lib/tracks/crumbs";
import { ReferenceSidebar } from "@/components/reference/ReferenceSidebar";
import { displayName, getReference, loc, referenceHref, sinceVersion } from "@/lib/reference";

/** Version ceilings offered by the filter: 3.3 (most tutorials), 4.1 (macOS), 4.5 (DSA), all. */
const VERSIONS = [3.3, 4.1, 4.5] as const;
const VERSION_KEY = "learn-ref-version";

export default function ReferenceIndexPage() {
  const params = useParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;

  const trackPath = params?.trackPath ? decodeURIComponent(params.trackPath as string) : "";
  const reference = getReference(trackPath);
  const [query, setQuery] = useState("");
  // Highest version to show (0 = all); remembered per viewer
  const [maxVersion, setMaxVersion] = useState(0);

  useEffect(() => {
    try { setMaxVersion(Number(localStorage.getItem(VERSION_KEY)) || 0); } catch { /* storage blocked */ }
  }, []);
  const chooseVersion = (v: number) => {
    setMaxVersion(v);
    try { localStorage.setItem(VERSION_KEY, String(v)); } catch { /* storage blocked */ }
  };

  useEffect(() => {
    if (!reference && trackPath) router.replace(`/learn/${encodeURIComponent(trackPath)}`);
  }, [reference, trackPath, router]);

  const groups = useMemo(() => {
    if (!reference) return [];
    const q = query.trim().toLowerCase();
    const fits = (v: number | undefined) => !maxVersion || v === undefined || v <= maxVersion + 1e-9;
    return reference.categories
      .map((cat) => ({
        cat,
        entries: reference.entries.filter(
          (e) =>
            e.category === cat.id &&
            fits(sinceVersion(e)) &&
            (!q ||
              e.name.toLowerCase().includes(q) ||
              loc(e.summary, language).toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.entries.length > 0);
  }, [reference, query, language, maxVersion]);

  if (!reference) return null;
  const shown = groups.reduce((n, g) => n + g.entries.length, 0);
  const hasVersions = reference.entries.some((e) => sinceVersion(e) !== undefined);

  return (
    <DocsLayout
      crumbs={[...trackCrumbs(tt, trackPath), { label: tt.refTitle ?? "Function reference" }]}
      drawerTitle={tt.refTitle ?? "Function reference"}
      backHref={`/learn/${encodeURIComponent(trackPath)}`}
      backLabel={reference.title ?? "Back"}
      left={<ReferenceSidebar reference={reference} />}
      right={
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-4">
            {tt.refCategories ?? "Categories"}
          </p>
          <nav className="space-y-0.5 border-l border-[var(--border)]">
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

      <header className="mb-12 pb-10 border-b border-[var(--border)]">
        <p className="font-mono text-[12.5px] text-[var(--primary)] tracking-[0.04em] mb-4">
          {reference.title}
        </p>
        <h1 className="font-display text-[2.2rem] md:text-[2.9rem] leading-[1.08] tracking-[-0.01em] mb-5">
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
            {shown < reference.entries.length
              ? `${shown} / ${reference.entries.length} ${tt.refShown ?? "shown"}`
              : `${reference.entries.length} ${tt.refFunctions ?? "functions"}`}
          </span>
        </label>

        {hasVersions && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mr-1">
                {tt.refVersion ?? "Available in"}
              </span>
              {[0, ...VERSIONS].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => chooseVersion(v)}
                  aria-pressed={maxVersion === v}
                  className={`rounded-full border px-3 py-1 font-mono text-[11.5px] transition-colors
                    ${maxVersion === v
                      ? "border-[var(--primary)] bg-[var(--primary-low)] text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]"}`}
                >
                  {v ? `GL ≤ ${v.toFixed(1)}` : (tt.refVersionAll ?? "all versions")}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-[var(--text-muted)]">
              {tt.refVersionHint ?? "Hide functions newer than the OpenGL version you target. macOS stops at 4.1."}
            </p>
          </div>
        )}
      </header>

      <div className="space-y-14">
        {groups.map(({ cat, entries }) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-[calc(var(--nav-h,81px)+24px)]">
            <h2 className="font-display text-[1.6rem] leading-tight text-[var(--text-main)] mb-5">
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
                      {displayName(e)}
                    </span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {e.since && (
                        <span className="font-mono text-[10px] text-[var(--text-muted)] rounded border border-[var(--border)] px-1.5 py-px">
                          {e.since.replace(/^GL /, "")}
                        </span>
                      )}
                      <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                    </span>
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
