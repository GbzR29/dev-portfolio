"use client";

// ── What I'm working on ─────────────────────────────────────────────────────
// The book and the /learn tracks side by side. Lesson counts come from the
// track registry, so they stay right as chapters are added.

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { TRACK_CATALOG } from "@/lib/tracks/catalog";
import { ALL_TRACKS } from "@/lib/tracks";
import { BOOK } from "@/lib/book";

const TRACKS = TRACK_CATALOG
  .filter((info) => ALL_TRACKS[info.path])
  .map((info) => ({ path: info.path, lessons: ALL_TRACKS[info.path].chapters.length }))
  .sort((a, b) => b.lessons - a.lessons);

const TOTAL_LESSONS = TRACKS.reduce((sum, tr) => sum + tr.lessons, 0);

export default function Now() {
  const { t } = useLanguage();

  return (
    <section className="hm-sec">
      <h2>{t.nowTitle}</h2>
      <div className="hm-now">
        <article className="hm-card">
          <div className="hm-fig">{t.nowFigBook}</div>
          <div className="hm-kind">{t.bookKind}</div>
          <h3>{BOOK.title}</h3>
          <p className="hm-ph">{t.bookSynopsisPlaceholder}</p>
          {BOOK.progress !== null && (
            <div className="hm-bar" aria-hidden="true">
              <i style={{ width: `${Math.round(BOOK.progress * 100)}%` }} />
            </div>
          )}
          <div className="hm-meta">
            <span>{t.bookStatus}</span>
            <span>{t.bookChapters}</span>
          </div>
          <Link className="hm-more" href={BOOK.path}>{t.bookMore}</Link>
        </article>

        <article className="hm-card">
          <div className="hm-fig">{t.nowFigTracks}</div>
          <div className="hm-kind">{t.tracksKind}</div>
          <h3>{t.tracksTitle}</h3>
          <p>{t.tracksBody.replace("{n}", String(TOTAL_LESSONS))}</p>
          <ul className="hm-tracks">
            {TRACKS.map((tr) => (
              <li key={tr.path}>
                <Link href={`/learn/${encodeURIComponent(tr.path)}`}>
                  {tr.path} <b>{tr.lessons}</b>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="hm-more" href="/learn">{t.tracksMore}</Link>
        </article>
      </div>
    </section>
  );
}
