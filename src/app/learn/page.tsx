// app/learn/page.tsx
"use client";

import "@/styles/home.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import HomeNav from "@/components/home/HomeNav";
import Stars from "@/components/home/Stars";
import HomeFooter from "@/components/home/HomeFooter";
import { getTrack } from "@/lib/tracks";
import { TRACK_CATALOG, type TrackInfo } from "@/lib/tracks/catalog";
import { getReference, referenceHref } from "@/lib/reference";
import { readLastLesson, readVisited, type LastLesson } from "@/lib/tracks/progress";
import { trackName } from "@/lib/tracks/crumbs";

type Strings = Record<string, string | undefined>;

const fill = (s: string, values: Record<string, number | string>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));

// ── Totals, from the track registry ─────────────────────────────────────────

const AVAILABLE = TRACK_CATALOG.filter((info) => getTrack(info.path));
const TOTAL_LESSONS = AVAILABLE.reduce((n, info) => n + (getTrack(info.path)?.chapters.length ?? 0), 0);

// ── Track card ───────────────────────────────────────────────────────────────

function TrackCard({ info, t, visited }: { info: TrackInfo; t: Strings; visited: number }) {
  const track = getTrack(info.path);
  const reference = getReference(info.path);
  const level = t[info.levelKey] ?? info.levelFallback;
  const desc = t[info.descKey] ?? info.descFallback;
  const href = `/learn/${encodeURIComponent(info.path)}`;

  if (!track) {
    return (
      <article className="hm-card hm-track soon" style={{ "--track": info.accentColor } as React.CSSProperties}>
        <div className="hm-level"><i />{level} · {t.learnSoon ?? "coming soon"}</div>
        <h3>{trackName(t, info.path)}</h3>
        <p>{desc}</p>
        <div className="hm-meta"><span>{fill(t.learnPlannedN ?? "{n} lessons planned", { n: info.plannedLessons })}</span></div>
        <div />
        <div className="hm-track-foot"><span className="hm-ref">{t.learnInPrep ?? "in preparation"}</span></div>
      </article>
    );
  }

  const lessons = track.chapters.length;
  const sections = new Set(track.chapters.map((c) => c.section).filter(Boolean)).size;
  const pct = Math.round((visited / lessons) * 100);

  return (
    <article className="hm-card hm-track" style={{ "--track": info.accentColor } as React.CSSProperties}>
      <div className="hm-level"><i />{level}</div>
      <h3>{trackName(t, info.path)}</h3>
      <p>{desc}</p>
      <div className="hm-meta">
        <span>{fill(t.learnLessonsN ?? "{n} lessons", { n: lessons })}</span>
        {sections > 1 && <span>{fill(t.learnSectionsN ?? "{n} sections", { n: sections })}</span>}
        {visited > 0 && <span>{fill(t.learnReadN ?? "{n} read", { n: visited })}</span>}
      </div>
      {visited > 0 ? <div className="hm-prog" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div> : <div />}
      <div className="hm-track-foot">
        <Link className="hm-more" href={href}>{visited > 0 ? t.learnContinue ?? "Continue →" : t.learnStart ?? "Start →"}</Link>
        {reference && <Link className="hm-ref" href={referenceHref(reference)}>{t.learnReference ?? "reference"}</Link>}
      </div>
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { t } = useLanguage();
  const ui = t as unknown as Strings;

  // Progress lives in localStorage, so it is read after mount (the server has none)
  const [visited, setVisited] = useState<Record<string, number>>({});
  const [last, setLast] = useState<LastLesson | null>(null);
  useEffect(() => {
    setVisited(Object.fromEntries(AVAILABLE.map((info) => [info.id, readVisited(info.id).size])));
    const l = readLastLesson();
    setLast(l && getTrack(l.track) ? l : null);
  }, []);

  return (
    <div className="home">
      <header className="hm-hero-wrap">
        <Stars />
        <div className="hm-in">
          <HomeNav />
          <div className="hm-hero">
            <div className="hm-eyebrow">
              {fill(ui.learnEyebrow ?? "learn · {lessons} lessons in {tracks} tracks", { lessons: TOTAL_LESSONS, tracks: AVAILABLE.length })}
            </div>
            <h1>{ui.learnHeroTitle ?? "Learn from scratch"}</h1>
            <p className="hm-lead">{ui.learnLead}</p>
            {last && (
              <div className="hm-resume">
                <span>{ui.learnResume ?? "where you left off:"}</span>
                <Link href={`/learn/${encodeURIComponent(last.track)}?chapter=${encodeURIComponent(last.chapter)}`}>
                  {trackName(ui, last.track)}
                  {last.title && <> · {last.number ? `${last.number}. ` : ""}{last.title}</>} →
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="hm-horizon" aria-hidden="true" />
      </header>

      <main className="hm-in">
        <section className="hm-sec">
          <h2>{ui.learnTracks ?? "Tracks"}</h2>
          <div className="hm-track-grid">
            {TRACK_CATALOG.map((info) => (
              <TrackCard key={info.id} info={info} t={ui} visited={visited[info.id] ?? 0} />
            ))}
          </div>
        </section>

        <section className="hm-sec">
          <h2>{ui.learnHowTitle ?? "How the lessons work"}</h2>
          <div className="hm-how">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <h3>{ui[`learnHow${i}Title`]}</h3>
                <p>{ui[`learnHow${i}Body`]}</p>
              </div>
            ))}
          </div>
        </section>

        <HomeFooter />
      </main>
    </div>
  );
}
