"use client";

// ── Book page ───────────────────────────────────────────────────────────────
// /the-weight-of-being. Every text block is a placeholder until the synopsis,
// excerpt and progress notes are written.

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BOOK } from "@/lib/book";
import HomeNav from "./HomeNav";
import Stars from "./Stars";
import HomeFooter from "./HomeFooter";

export default function BookContent() {
  const { t } = useLanguage();

  return (
    <>
      <header className="hm-hero-wrap">
        <Stars />
        <div className="hm-in">
          <HomeNav />
          <div className="hm-book">
            <Link className="hm-more" href="/">{t.bookBack}</Link>
            <div className="hm-kind">{t.bookKind}</div>
            <h1>{BOOK.title}</h1>
            {BOOK.progress !== null && (
              <div className="hm-bar" aria-hidden="true" style={{ maxWidth: 320 }}>
                <i style={{ width: `${Math.round(BOOK.progress * 100)}%` }} />
              </div>
            )}
            <div className="hm-meta">
              <span>{t.bookStatus}</span>
              <span>{t.bookChapters}</span>
            </div>
            <div className="hm-book-body">
              <p className="hm-ph">{t.bookIntroPlaceholder}</p>
            </div>
          </div>
        </div>
        <div className="hm-horizon" aria-hidden="true" />
      </header>

      <main className="hm-in">
        <section className="hm-sec">
          <h2>{t.bookExcerptTitle}</h2>
          <div className="hm-book-body">
            <p className="hm-ph">{t.bookExcerptPlaceholder}</p>
          </div>
        </section>
        <section className="hm-sec">
          <h2>{t.bookUpdatesTitle}</h2>
          <div className="hm-book-body">
            <p className="hm-ph">{t.bookUpdatesPlaceholder}</p>
          </div>
        </section>
        <HomeFooter />
      </main>
    </>
  );
}
