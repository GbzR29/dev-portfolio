"use client";

// ── What I'm working on ─────────────────────────────────────────────────────
// The book and the courses side by side. The courses live on their own site,
// From Scratch Lab, so this card only links there: the track list is written
// out by hand (each name is also the track's path on that site).

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BOOK } from "@/lib/book";
import { useUrlLang } from "@/lib/i18n/useUrlLang";
import { learnUrl } from "@/lib/site";

const TRACKS = ["OpenGL", "Math", "Physics", "C++", "AI", "GLSL", "Algorithms", "Vulkan", "Assembly", "Music", "GameDev", "SDL3"];

export default function Now() {
  const { t } = useLanguage();
  const urlLang = useUrlLang();

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
          <p>{t.tracksBody}</p>
          <ul className="hm-tracks">
            {TRACKS.map((path) => (
              <li key={path}>
                <a href={learnUrl(urlLang, path)}>{path}</a>
              </li>
            ))}
          </ul>
          <a className="hm-more" href={learnUrl(urlLang)}>{t.tracksMore}</a>
        </article>
      </div>
    </section>
  );
}
