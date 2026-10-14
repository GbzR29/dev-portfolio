// ── Support note ────────────────────────────────────────────────────────────
// One quiet line under the chapter pager: the lessons are free, and this is
// where a reader who liked one can leave a tip on Ko-fi.

import { CoffeeCup } from "@/components/nav/CoffeeCup";
import { CONTACT } from "@/components/home/links";

export function SupportNote({ text, link }: { text: string; link: string }) {
  return (
    <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[13.5px] text-[var(--text-muted)]">
      <span>{text}</span>
      <a
        href={CONTACT.kofi}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-[var(--primary)] underline underline-offset-4 decoration-[var(--border)] hover:decoration-[var(--primary)]"
      >
        <CoffeeCup size={14} />
        {link}
      </a>
    </p>
  );
}
