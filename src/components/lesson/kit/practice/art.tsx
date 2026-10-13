"use client";

// ── Practice artwork ──────────────────────────────────────────────────────────
// Small drawn SVG pieces for the practice sessions, in place of emoji: the
// start card's path-to-a-flag, the streak flame, the best-score cup and the
// review-done seal. Each takes its colours from the practice tokens
// (--pr-ok, --pr-gold) or the theme, so they sit in both themes.

/** The start card's default picture: a dotted path with milestones, up to a flag. */
export function StartArt() {
  return (
    <svg viewBox="0 0 84 64" className="w-[84px] h-[64px]" aria-hidden>
      <path d="M10 54 C24 55 20 37 34 36 C49 35 44 20 62 18" fill="none" stroke="var(--border)" strokeWidth={3} strokeLinecap="round" strokeDasharray="0.5 7" />
      <circle cx={10} cy={54} r={5} fill="var(--primary)" />
      <circle cx={34} cy={36} r={4.5} fill="none" stroke="var(--primary)" strokeWidth={2.2} />
      <path d="M62.5 19 L62.5 2.5" stroke="var(--text-main)" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M63 3 C68 2 71 5.5 76 4.5 L74.5 12 C70 13 67 9.5 63 11 Z" fill="var(--pr-gold)" />
      <ellipse cx={62.5} cy={20} rx={6} ry={2} fill="var(--border)" />
    </svg>
  );
}

/** A small flame for the streak counter. */
export function Flame({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden className="inline-block align-[-2px]">
      <path d="M8 1.2 C9.6 3.8 12.6 5.4 12.6 9.6 A4.6 4.6 0 0 1 3.4 9.6 C3.4 7.1 4.9 5.9 5.5 4.2 C6.3 5.6 6.8 6.5 7.7 6.9 C7.6 4.7 7.3 3 8 1.2 Z" fill="var(--pr-gold)" />
      <path d="M8.1 8 C9.1 9.2 10.1 10 10.1 11.4 A2.1 2.1 0 0 1 5.9 11.4 C5.9 10.2 7 9.5 8.1 8 Z" fill="#fde68a" />
    </svg>
  );
}

/** The new-best-score cup. */
export function Cup({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="inline-block align-[-3px]">
      <path d="M7 5 H4.6 A2.6 2.6 0 0 0 7.4 9.9 M17 5 H19.4 A2.6 2.6 0 0 1 16.6 9.9" fill="none" stroke="var(--pr-gold)" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M6.6 3 H17.4 V8.2 A5.4 5.4 0 0 1 6.6 8.2 Z" fill="var(--pr-gold)" />
      <path d="M9 4.6 V8 A3 3 0 0 0 10.6 10.6" fill="none" stroke="#fde68a" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M12 13.6 V17.2 M8.4 20.6 H15.6 M9.6 17.4 H14.4 L15 20.4 H9 Z" fill="var(--pr-gold)" stroke="var(--pr-gold)" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

/** The review-done seal: a hand-drawn ring, a check, three sparks. */
export function Seal() {
  return (
    <svg viewBox="0 0 72 72" className="w-[76px] h-[76px]" aria-hidden>
      <path d="M36 12 C50 11.5 60 22 60 36 C60.5 50 49 60 36 60 C21.5 60.5 12 49 12 36 C11.5 22 22.5 12.5 37 12.4" fill="color-mix(in srgb, var(--pr-ok) 14%, transparent)" stroke="var(--pr-ok)" strokeWidth={3.2} strokeLinecap="round" />
      <path d="M25 37 L33 45 L48 28" fill="none" stroke="var(--pr-ok)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 10 L66 6 M65 18 L70 17 M55 4.5 L56 0.5" stroke="var(--pr-gold)" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}
