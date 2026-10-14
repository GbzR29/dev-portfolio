"use client";

// ── Footer ──────────────────────────────────────────────────────────────────

import { useLanguage } from "@/components/providers/LanguageProvider";
import { CoffeeCup } from "@/components/nav/CoffeeCup";
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
        <a href={CONTACT.kofi} target="_blank" rel="noopener noreferrer" className="hm-kofi">
          <CoffeeCup size={13} />
          {t.footCoffee ?? "buy me a coffee"}
        </a>
      </nav>
    </footer>
  );
}
