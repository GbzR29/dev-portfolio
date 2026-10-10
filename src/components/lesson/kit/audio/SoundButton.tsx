"use client";

// ── Sound button ──────────────────────────────────────────────────────────────
// The big round "listen / stop" pill of a widget that sounds. Browsers only
// allow sound after a click, so every sounding widget starts from one of these
// (or a key press); the pill shows a stop square while its sound plays.

import type { ReactNode } from "react";
import { Square, Volume2 } from "lucide-react";

export function SoundButton({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`h-11 px-4 rounded-full flex items-center gap-2 border text-[12px] font-semibold transition-all ${on
        ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--card)]"
        : "border-[var(--border)] bg-[var(--card)] text-[var(--text-main)] hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"}`}>
      {on ? <Square size={14} /> : <Volume2 size={16} />}
      {children}
    </button>
  );
}
