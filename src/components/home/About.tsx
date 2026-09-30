"use client";

// ── About ───────────────────────────────────────────────────────────────────
// Text on the left; photo and a few dated facts on the right. Side by side the
// text is about as tall as the photo column, so it shows whole. When the
// columns stack (narrow screens) only the first paragraph shows and "Read
// more" unfolds the rest (home.css animates the height with grid rows).

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMediaQuery } from "@/components/lesson/kit/media";

/** Same breakpoint as the one-column .hm-about layout in home.css */
const STACKED_ABOUT = "(max-width: 680px)";

export default function About() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const stacked = useMediaQuery(STACKED_ABOUT);

  const facts = [
    { label: t.factCoding, value: t.factCodingValue },
    { label: t.factGraphics, value: t.factGraphicsValue },
    { label: t.factWriting, value: t.factWritingValue },
    { label: t.factStudying, value: t.factStudyingValue },
  ];

  return (
    <section id="about" className="hm-sec">
      <h2>{t.aboutTitle}</h2>
      <div className="hm-about">
        <div className="hm-about-text">
          <p>{t.aboutPara1}</p>
          <div id="about-more" className="hm-fold" data-open={open} inert={stacked && !open}>
            <div>
              <p>{t.aboutPara2}</p>
              <p>{t.aboutWriting}</p>
            </div>
          </div>
          <button
            type="button"
            className="hm-toggle"
            aria-expanded={open}
            aria-controls="about-more"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? t.aboutLess : t.aboutMore}
            <span aria-hidden="true">↓</span>
          </button>
        </div>
        <div className="hm-about-side">
          <div className="hm-photo">
            <Image
              src="/perfil.jpeg"
              alt={t.aboutPhotoAlt}
              fill
              sizes="280px"
              className="object-cover"
            />
          </div>
          <dl className="hm-facts">
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
