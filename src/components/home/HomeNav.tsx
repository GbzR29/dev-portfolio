"use client";

// ── Home navigation ─────────────────────────────────────────────────────────
// A quiet text bar for the Home, the book page, /learn and the blog: name,
// links, theme toggle and the language switch. On phones the links and tools
// move into the ☰ sheet (components/nav/SiteMenu). Styles: .hm-nav in home.css.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SiteMenu } from "@/components/nav/SiteMenu";
import { LANGUAGES, useSiteLinks } from "@/components/nav/siteLinks";

export default function HomeNav() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const links = useSiteLinks();

  return (
    <nav className="hm-nav" aria-label="Primary">
      <Link className="hm-brand" href="/">Gabriel Carvalho</Link>
      <div className="hm-links">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>{l.label}</Link>
        ))}
        <div className="hm-tools">
          <button type="button" className="hm-pill" onClick={toggleTheme}>
            {theme === "dark" ? t.navLight : t.navDark}
          </button>
          <div className="hm-langs" role="group" aria-label={t.navLanguage}>
            {LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SiteMenu className="hm-menu" />
    </nav>
  );
}
