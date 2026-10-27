"use client";

// ── Book progress ───────────────────────────────────────────────────────────
// The bar in the "Progress" section of the book page: stage, chapter count and
// share written, all read from lib/bookProgress. The fill grows from 0 the
// first time the bar scrolls into view. Like Reveal, it only arms itself once
// JS runs, so without JS — or with "reduce motion" — the bar is simply full.

import { useEffect, useRef, type CSSProperties } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BOOK_PROGRESS } from "@/lib/bookProgress";
import type { Language } from "@/lib/i18n";

const LOCALES: Record<Language, string> = { en: "en-US", pt: "pt-BR", es: "es-ES", zh: "zh-CN" };

// One tick per chapter only while they stay readable
const MAX_TICKS = 30;

// "Oct 2026", "out 2026", "oct 2026"; Chinese keeps its own order ("2026年10月")
function monthYear(iso: string, lang: Language) {
  const date = new Date(`${iso}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat(LOCALES[lang], { month: "short", year: "numeric", timeZone: "UTC" });
  if (lang === "zh") return fmt.format(date);
  const parts = fmt.formatToParts(date);
  const month = parts.find((p) => p.type === "month")?.value.replace(".", "") ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${month} ${year}`;
}

export default function BookProgress() {
  const { t, language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { chaptersWritten, chaptersTotal, totalIsEstimate, stage, lastUpdated } = BOOK_PROGRESS;

  const share = chaptersTotal > 0 ? Math.min(chaptersWritten / chaptersTotal, 1) : 0;
  const percent = Math.round(share * 100);
  const count = `${chaptersWritten} / ${totalIsEstimate ? "~" : ""}${chaptersTotal} ${t.bookChaptersUnit}`;
  const ticks = chaptersTotal > 1 && chaptersTotal <= MAX_TICKS;

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.phase = "armed";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        // Next frame, so the empty bar is painted before it grows
        requestAnimationFrame(() => { el.dataset.phase = "in"; });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.phase;
    };
  }, []);

  return (
    <div className="hm-progress" ref={ref}>
      <div className="hm-progress-head">
        <b>{t.bookStages[stage]}</b>
        <span className="hm-progress-nums">
          <span>{count}</span>
          <span>{percent}%</span>
        </span>
      </div>
      <div
        className="hm-progress-track"
        role="progressbar"
        aria-label={t.bookProgressLabel}
        aria-valuemin={0}
        aria-valuemax={chaptersTotal}
        aria-valuenow={chaptersWritten}
        aria-valuetext={`${count} (${percent}%)`}
        data-ticks={ticks || undefined}
        style={{ "--p": share, "--n": chaptersTotal } as CSSProperties}
      >
        <i />
      </div>
      <time className="hm-progress-date" dateTime={lastUpdated}>
        {t.bookUpdatedOn} {monthYear(lastUpdated, language)}
      </time>
    </div>
  );
}
