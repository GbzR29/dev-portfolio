"use client";

// ── Site menu (phones) ──────────────────────────────────────────────────────
// The ☰ button that HomeNav and LearnTopBar show on narrow screens, and the
// sheet it opens from the right: the page's path (lessons), the site links,
// the theme toggle and the language switch. The sheet is portalled to <body>
// because the lesson bar's backdrop blur would otherwise trap a fixed child.
// Styles: src/styles/sitemenu.css (own tokens, same palette as the Home).

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LANGUAGES, useSiteLinks } from "./siteLinks";

export interface MenuCrumb {
  label: string;
  href?: string;
}

export function SiteMenu({ crumbs = [], className = "" }: { crumbs?: MenuCrumb[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const links = useSiteLinks();
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  // While open: Escape closes, the page behind does not scroll, focus goes to the close button
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    close.current?.focus();
    const opener = button.current;
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const path = crumbs.filter((c) => c.href);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`sm-open ${className}`}
        onClick={() => setOpen(true)}
        aria-label={t.navMenu}
        aria-expanded={open}
        aria-controls="site-menu"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {mounted && open && createPortal(
        <div className="site-menu" id="site-menu" role="dialog" aria-modal="true" aria-label={t.navMenu}>
          <div className="sm-backdrop" onClick={() => setOpen(false)} />
          <nav className="sm-sheet" aria-label="Primary">
            <div className="sm-head">
              <Link className="sm-brand" href="/" onClick={() => setOpen(false)}>Gabriel Carvalho</Link>
              <button ref={close} type="button" className="sm-close" onClick={() => setOpen(false)} aria-label={t.navClose}>
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            {path.length > 0 && (
              <div className="sm-path">
                {path.map((c) => (
                  <Link key={c.href} href={c.href!} onClick={() => setOpen(false)}>← {c.label}</Link>
                ))}
              </div>
            )}

            <ul className="sm-links">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} aria-current={pathname === l.href ? "page" : undefined}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="sm-tools">
              <div className="sm-row">
                <span>{t.navTheme}</span>
                <button type="button" className="sm-pill" onClick={toggleTheme}>
                  {theme === "dark" ? t.navLight : t.navDark}
                </button>
              </div>
              <div className="sm-row">
                <span>{t.navLanguage}</span>
                <div className="sm-langs" role="group" aria-label={t.navLanguage}>
                  {LANGUAGES.map((code) => (
                    <button key={code} type="button" lang={code} aria-pressed={language === code} onClick={() => setLanguage(code)}>
                      {code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>,
        document.body,
      )}
    </>
  );
}
