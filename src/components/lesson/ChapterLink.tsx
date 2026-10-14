"use client";

// ── Link to a chapter ───────────────────────────────────────────────────────
// A real <a href> (search engines follow it, middle-click opens a new tab),
// but a plain click switches the chapter in place through `onSelect`.

import type { ReactNode } from "react";

export function ChapterLink({ href, onSelect, className, current, children }: {
  href: string;
  onSelect: () => void;
  className?: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className={className}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onSelect();
      }}
    >
      {children}
    </a>
  );
}
