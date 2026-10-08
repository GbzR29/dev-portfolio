// src/components/lesson/Prose.tsx
"use client";

// Page-level building blocks shared by every track's chapters: the article
// wrapper, the lead paragraph, the "By the end you can" goals under it and the
// "Key ideas" summary box at the end.

import type { ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

/**
 * What the reader will be able to do after the chapter, placed right after the
 * Lead. Each item is a task they can check themselves on ("Find a side from an
 * angle and the hypotenuse"), not a topic name. Keys: `${id}_goal${i}`.
 */
export function Goals({ t, id, items }: { t: TrackTranslations; id: string; items: string[] }) {
  return (
    <div className="my-6 rounded-xl border border-[var(--border)] px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">{tx(t, "goals", "By the end you can")}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[var(--text-main)]">
            <span aria-hidden className="font-mono text-[12px] leading-[1.6rem] text-[var(--primary)]">→</span>
            <span>{tx(t, `${id}_goal${i}`, it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KeyIdeas({ t, id, items }: { t: TrackTranslations; id: string; items: string[] }) {
  return (
    <div className="my-8 rounded-xl border border-[var(--border)] px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">{tx(t, "keyIdeas", "Key ideas")}</p>
      <ol className="space-y-2 list-decimal pl-5 marker:font-mono marker:text-[12px] marker:text-[var(--primary)]">
        {items.map((it, i) => (
          <li key={i} className="pl-1 text-[15px] leading-relaxed text-[var(--text-main)]">
            {tx(t, `${id}_key${i}`, it)}
          </li>
        ))}
      </ol>
    </div>
  );
}
export const Article = ({ children }: { children: ReactNode }) => (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">{children}</article>
);
export const Lead = ({ children }: { children: ReactNode }) => <p className="text-lg text-[var(--text-main)]">{children}</p>;
