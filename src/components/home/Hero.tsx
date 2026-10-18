"use client";

// ── Hero ────────────────────────────────────────────────────────────────────
// Navigation, name, one-paragraph introduction, three links and a "now" line.

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUrlLang } from "@/lib/i18n/useUrlLang";
import { learnUrl } from "@/lib/site";
import HomeNav from "./HomeNav";
import Stars from "./Stars";

export default function Hero() {
  const { t } = useLanguage();
  const urlLang = useUrlLang();

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
            <a href={learnUrl(urlLang)}>{t.heroTracksLink}</a>
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
