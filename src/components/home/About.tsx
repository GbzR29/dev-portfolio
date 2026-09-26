"use client";

// ── About ───────────────────────────────────────────────────────────────────
// Text on the left; photo and a few dated facts on the right.

import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";

export default function About() {
  const { t } = useLanguage();

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
          <p>{t.aboutPara2}</p>
          <p>{t.aboutWriting}</p>
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
