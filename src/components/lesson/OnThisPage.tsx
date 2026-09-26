"use client";

// ── On this page ─────────────────────────────────────────────────────────────
// The right rail of a lesson: the chapter's H2/H3 headings, the one in view
// highlighted.

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function OnThisPage({ headings, activeId, label, onJump }: {
  headings: TocHeading[];
  activeId: string;
  label: string;
  /** Takes over the jump (focus mode first opens the heading's step). */
  onJump?: (id: string) => void;
}) {
  if (headings.length === 0) return null;

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] mb-3">{label}</p>
      <nav>
        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              if (onJump) onJump(h.id);
              else document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            aria-current={activeId === h.id ? "true" : undefined}
            className={`block border-l py-1 text-[13px] leading-snug transition-colors
              ${h.level === 3 ? "pl-6" : "pl-3"}
              ${activeId === h.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
