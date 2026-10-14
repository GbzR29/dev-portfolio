// ── Coffee cup icon ─────────────────────────────────────────────────────────
// Line drawing for the Ko-fi links (Home footer, end of a lesson). Strokes use
// currentColor so it follows the text colour and the hover state.

export function CoffeeCup({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* steam */}
      <path d="M5.5 1.5c-.6.8.6 1.4 0 2.3M8.5 1.5c-.6.8.6 1.4 0 2.3" />
      {/* cup and handle */}
      <path d="M2.5 6h9v3.5a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z" />
      <path d="M11.5 7h1a1.8 1.8 0 0 1 0 3.6h-1.2" />
      {/* saucer */}
      <path d="M1.5 15h12" />
    </svg>
  );
}
