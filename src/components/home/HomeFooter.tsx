"use client";

// ── Footer ──────────────────────────────────────────────────────────────────

import { useLanguage } from "@/components/providers/LanguageProvider";
import { CONTACT } from "./links";

export default function HomeFooter() {
  const { t } = useLanguage();

  return (
    <footer className="hm-foot">
      <span>gabrielfrc.dev · {new Date().getFullYear()}</span>
      <nav aria-label="Links">
        <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">github</a>
        <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">linkedin</a>
        <a href={CONTACT.cv} target="_blank" rel="noopener noreferrer">{t.contactCv.toLowerCase()}</a>
      </nav>
    </footer>
  );
}
