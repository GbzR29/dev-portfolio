// src/components/reference/diagrams/frame.tsx
// Shared pieces of the reference diagrams: the frame with its caption, the
// EN/PT label picker, arrowheads and the fixed data colours.

import { useId, type ReactNode } from "react";
import type { Language } from "@/lib/i18n";

/** Data colours: the same in both themes. */
export const C = {
  orange: "#e07a5f",
  blue: "#4f9fd6",
  green: "#5fb878",
  red: "#e0675a",
  gray: "#8a8f98",
};

export const pick = (language: Language, en: string, pt: string) => (language === "pt" ? pt : en);

/** A card with the drawing (scrolls sideways on narrow phones) and a caption under it. */
export function DiagramFrame({ caption, minWidth = 520, children }: { caption: string; minWidth?: number; children: ReactNode }) {
  return (
    <figure className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="overflow-x-auto px-3 pt-4 pb-2">
        <div style={{ minWidth }}>{children}</div>
      </div>
      <figcaption className="border-t border-[var(--border)] px-5 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)]">
        {caption}
      </figcaption>
    </figure>
  );
}

/** An arrowhead marker; returns the defs element and the url() to use in markerEnd/markerStart. */
export function useArrow(color = "currentColor"): [ReactNode, string] {
  const id = useId().replace(/:/g, "");
  const defs = (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill={color} />
      </marker>
    </defs>
  );
  return [defs, `url(#${id})`];
}

/** Text styles inside the SVGs. */
export const T = {
  label: { fontSize: 12, fill: "var(--text-muted)", fontFamily: "var(--font-mono, ui-monospace, monospace)" },
  strong: { fontSize: 12.5, fill: "var(--text-main)", fontFamily: "var(--font-mono, ui-monospace, monospace)" },
  small: { fontSize: 10.5, fill: "var(--text-muted)", fontFamily: "var(--font-mono, ui-monospace, monospace)" },
} as const;
