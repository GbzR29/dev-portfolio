"use client";

// ── Learn top bar ────────────────────────────────────────────────────────────
// The slim sticky bar over lessons and reference pages: name, the page's path
// (breadcrumbs), theme toggle and language switch. Its height is --nav-h
// (src/styles/learn.css); the rails and pinned figures sit below it.
// On phones only the page title and ☰ remain; the sheet (components/nav/SiteMenu)
// holds the way back up the path, the site links, theme and languages.

import Link from "next/link";
import type { ReactNode } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SiteMenu } from "@/components/nav/SiteMenu";
import { LANGUAGES } from "@/components/nav/siteLinks";

export interface Crumb {
  label: string;
  href?: string;
}

export function LearnTopBar({ crumbs = [] }: { crumbs?: Crumb[] }) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 h-12 border-b border-[var(--border)] bg-[var(--navbar-bg)] backdrop-blur-md">
      <div className="h-full flex items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="hidden sm:block font-display text-[17px] text-[var(--text-main)] whitespace-nowrap hover:text-[var(--primary)] transition-colors">
          Gabriel Carvalho
        </Link>

        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 font-mono text-[12px] text-[var(--text-muted)] min-w-0">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <CrumbItem key={i} last={last}>
                  {c.href && !last
                    ? <Link href={c.href} className="hover:text-[var(--primary)] transition-colors whitespace-nowrap">{c.label}</Link>
                    : <span className={`truncate ${last ? "text-[var(--text-main)]" : ""}`} aria-current={last ? "page" : undefined}>{c.label}</span>}
                </CrumbItem>
              );
            })}
          </ol>
        </nav>

        <SiteMenu crumbs={crumbs} className="md:!hidden flex-shrink-0" />

        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="font-mono text-[12px] text-[var(--text-muted)] border border-[var(--border-strong)] rounded-full px-2.5 py-0.5 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors whitespace-nowrap"
          >
            {theme === "dark" ? t.navLight : t.navDark}
          </button>
          <div className="flex gap-0.5" role="group" aria-label={t.navLanguage}>
            {LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
                className={`font-mono text-[11.5px] px-1.5 py-0.5 transition-colors ${
                  language === code
                    ? "text-[var(--text-main)] underline underline-offset-4"
                    : "text-[var(--text-muted)] hover:text-[var(--primary)]"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/** On phones only the last crumb (the page itself) is shown, in place of the name. */
function CrumbItem({ last, children }: { last: boolean; children: ReactNode }) {
  return (
    <li className={`items-center gap-2 min-w-0 ${last ? "flex" : "hidden md:flex"}`}>
      {children}
      {!last && <span aria-hidden="true" className="opacity-50">/</span>}
    </li>
  );
}
