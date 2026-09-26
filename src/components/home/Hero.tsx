"use client";

// ── Hero ────────────────────────────────────────────────────────────────────
// Navigation, name, one-paragraph introduction, three links and a "now" line.

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import HomeNav from "./HomeNav";
import Stars from "./Stars";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <header className="hm-hero-wrap">
      <Stars />
      <div className="hm-in">
        <HomeNav />
        <div className="hm-hero">
          <div className="hm-eyebrow">{t.heroEyebrow}</div>
          <h1>Gabriel Carvalho</h1>
          <p className="hm-lead">{t.heroLead}</p>
          <div className="hm-cta">
            <Link href="/the-weight-of-being">{t.heroBookLink}</Link>
            <Link href="/learn">{t.heroTracksLink}</Link>
            <a href="/pdf/resume.pdf" target="_blank" rel="noopener noreferrer">{t.heroCvLink}</a>
          </div>
          <div className="hm-status">
            <span>{t.heroNow}</span>
            <em>{t.heroNowWriting}</em>
            <span aria-hidden="true">·</span>
            <em>{t.heroNowRevising}</em>
          </div>
        </div>
      </div>
      <div className="hm-horizon" aria-hidden="true" />
    </header>
  );
}
