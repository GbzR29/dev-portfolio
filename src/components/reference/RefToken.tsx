// src/components/reference/RefToken.tsx
"use client";

import {
  createContext, useContext, useEffect, useRef, useState,
  type CSSProperties, type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  loc, referenceHref, referenceIndex,
  type RefEntry, type Reference,
} from "@/lib/reference";

// ─── Context ──────────────────────────────────────────────────────────────────
// Set by pages that render track content. Components below (CodeBlock, IC) use
// it to turn known API names into links; without a provider nothing is linked.

const ReferenceContext = createContext<Reference | null>(null);

export function ReferenceProvider({ reference, children }: { reference?: Reference; children: ReactNode }) {
  return <ReferenceContext.Provider value={reference ?? null}>{children}</ReferenceContext.Provider>;
}

export function useReference(): Reference | null {
  return useContext(ReferenceContext);
}

/** Returns the entry for `name` in the active reference, if any. */
export function useRefEntry(name: string): RefEntry | undefined {
  const ref = useReference();
  return ref ? referenceIndex(ref).get(name) : undefined;
}

// ─── Hover card ───────────────────────────────────────────────────────────────

const OPEN_DELAY  = 180;
const CLOSE_DELAY = 140;
const CARD_WIDTH  = 360;

function HoverCard({
  entry, href, anchor, onEnter, onLeave,
}: {
  entry: RefEntry;
  href: string;
  anchor: DOMRect;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { language, t } = useLanguage();
  const tt = t as Record<string, string | undefined>;

  const left = Math.max(12, Math.min(anchor.left, window.innerWidth - CARD_WIDTH - 12));
  const below = anchor.bottom + 8 + 220 < window.innerHeight;
  const style: CSSProperties = below
    ? { left, top: anchor.bottom + 8 }
    : { left, bottom: window.innerHeight - anchor.top + 8 };

  return createPortal(
    <div
      role="tooltip"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ ...style, width: CARD_WIDTH, zIndex: 90 }}
      className="fixed max-w-[calc(100vw-24px)] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl p-4 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="font-mono text-sm font-semibold text-[var(--primary)]">{entry.name}</span>
        {entry.since && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5">
            {entry.since}
          </span>
        )}
      </div>
      <pre className="font-mono text-[11px] leading-relaxed text-[var(--text-main)] bg-[var(--code-bg)] border border-[var(--border)] rounded-lg p-2.5 mb-3 whitespace-pre-wrap break-words">
        {entry.signature}
      </pre>
      <p className="text-[13px] leading-relaxed text-[var(--text-muted)] mb-3">
        {loc(entry.summary, language)}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:underline"
      >
        {tt.refOpenDocs ?? "Open full documentation"}
        <ArrowRight size={12} />
      </Link>
    </div>,
    document.body,
  );
}

// ─── RefToken ─────────────────────────────────────────────────────────────────
// A known API name rendered as a link to its reference page, with a preview
// card on hover. Accepts the className/style the syntax highlighter passes.

export function RefToken({
  entry, children, className, style,
}: {
  entry: RefEntry;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useReference();
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Close on scroll — the card is fixed-positioned and would drift.
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, { capture: true });
  }, [anchor]);

  if (!ref) return <>{children ?? entry.name}</>;
  const href = referenceHref(ref, entry.name);

  const open = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (anchorRef.current) setAnchor(anchorRef.current.getBoundingClientRect());
    }, OPEN_DELAY);
  };
  const keepOpen = () => clearTimeout(timer.current);
  const close = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnchor(null), CLOSE_DELAY);
  };

  return (
    <>
      <Link
        ref={anchorRef}
        href={href}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        className={`${className ?? ""} underline decoration-dotted decoration-1 underline-offset-[3px] decoration-[color:var(--primary)] hover:decoration-solid cursor-pointer`}
        style={style}
      >
        {children ?? entry.name}
      </Link>
      {anchor && (
        <HoverCard entry={entry} href={href} anchor={anchor} onEnter={keepOpen} onLeave={close} />
      )}
    </>
  );
}
