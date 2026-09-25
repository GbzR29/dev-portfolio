// src/components/lesson/Prose.tsx
"use client";

// Page-level building blocks shared by every track's chapters: the article
// wrapper, the lead paragraph and the "Key ideas" summary box.

import type { ReactNode } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function KeyIdeas({ t, id, items }: { t: TrackTranslations; id: string; items: string[] }) {
  return (
    <div className="my-8 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-low)] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-3">{tx(t, "keyIdeas", "Key ideas")}</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-[var(--text-main)]">
            <span className="text-[var(--primary)] font-bold">→</span><span>{tx(t, `${id}_key${i}`, it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
export const Article = ({ children }: { children: ReactNode }) => (
  <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">{children}</article>
);
export const Lead = ({ children }: { children: ReactNode }) => <p className="text-lg text-[var(--text-main)]">{children}</p>;
