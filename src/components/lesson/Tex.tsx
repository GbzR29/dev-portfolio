import katex from "katex";
import "katex/dist/katex.min.css";
import type { ReactNode } from "react";

// ── LaTeX for lessons ─────────────────────────────────────────────────────────
// Rendered to HTML on the server with KaTeX, so formulas appear with the page
// and never shift the layout. Colour macros map to CSS classes (see
// globals.css → .tx-*), so a symbol is the same colour here and in the figures
// in both themes:
//   \red{…} \green{…} \blue{…} \amber{…} \purple{…} \cyan{…} \muted{…}
// A few shorthands keep lighting formulas short:
//   \vN \vL \vV \vR \vH   bold unit vectors n̂, l̂, v̂, r̂, ĥ in their figure colours
//   \dotp{a}{b}           a · b

const MACROS: Record<string, string> = {
  "\\red": "\\htmlClass{tx-red}{#1}",
  "\\green": "\\htmlClass{tx-green}{#1}",
  "\\blue": "\\htmlClass{tx-blue}{#1}",
  "\\amber": "\\htmlClass{tx-amber}{#1}",
  "\\purple": "\\htmlClass{tx-purple}{#1}",
  "\\cyan": "\\htmlClass{tx-cyan}{#1}",
  "\\muted": "\\htmlClass{tx-muted}{#1}",
  "\\vN": "\\green{\\hat{\\mathbf{n}}}",
  "\\vL": "\\amber{\\hat{\\mathbf{l}}}",
  "\\vV": "\\blue{\\hat{\\mathbf{v}}}",
  "\\vR": "\\red{\\hat{\\mathbf{r}}}",
  "\\vH": "\\purple{\\hat{\\mathbf{h}}}",
  "\\dotp": "{#1}\\cdot{#2}",
};

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,          // a typo shows red source instead of crashing the page
    strict: false,
    macros: { ...MACROS },
    trust: ctx => ctx.command === "\\htmlClass",
  });
}

/** Inline formula: <Tex>{String.raw`\cos\theta`}</Tex> */
export function Tex({ children }: { children: string }) {
  return <span className="tex-inline" dangerouslySetInnerHTML={{ __html: render(children, false) }} />;
}

/**
 * A displayed equation, centred like a textbook, with an optional name, a
 * "where" legend that explains each symbol, bullet notes, and the matching
 * GLSL / GLM one-liners underneath.
 */
export function Equation({ children, label, where, note, notes, glsl, glm }: {
  children: string;
  label?: string;
  where?: [string, ReactNode][];
  note?: ReactNode;
  notes?: ReactNode[];
  glsl?: string;
  glm?: string;
}) {
  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {label && (
        <div className="px-4 pt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </div>
      )}
      <div className="px-4 py-4 overflow-x-auto text-[var(--text-main)] text-[1.05rem]"
        dangerouslySetInnerHTML={{ __html: render(children, true) }} />
      {where && where.length > 0 && (
        <div className="px-4 pb-3.5 pt-1 border-t border-[var(--separator)] grid gap-x-4 gap-y-1.5 grid-cols-[auto_1fr] items-baseline text-[13px]">
          <span className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] pt-2">where</span>
          {where.map(([sym, meaning], i) => (
            <div key={i} className="contents">
              <span className="text-[var(--text-main)] whitespace-nowrap" dangerouslySetInnerHTML={{ __html: render(sym, false) }} />
              <span className="text-[var(--text-muted)] leading-snug">{meaning}</span>
            </div>
          ))}
        </div>
      )}
      {notes && notes.length > 0 && (
        <ul className="px-4 pb-3.5 pt-2.5 border-t border-[var(--separator)] space-y-1 text-[13px] text-[var(--text-muted)] leading-relaxed">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[var(--primary)]">→</span>
              {/* Older texts carry their own arrow; drop it so there is only one */}
              <span>{typeof n === "string" ? n.replace(/^\s*→\s*/, "") : n}</span>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <div className="px-4 pb-3.5 pt-2 border-t border-[var(--separator)] text-[13px] text-[var(--text-muted)] leading-relaxed">
          {note}
        </div>
      )}
      {(glsl || glm) && (
        <div className="border-t border-[var(--code-border)] bg-[var(--code-bg)] px-4 py-2.5 space-y-1 overflow-x-auto">
          {glsl && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-widest flex-shrink-0 w-10">GLSL</span>
              <code className="font-mono text-[11.5px] text-[var(--code-text)] whitespace-pre">{glsl}</code>
            </div>
          )}
          {glm && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-blue-400/70 uppercase tracking-widest flex-shrink-0 w-10">GLM</span>
              <code className="font-mono text-[11.5px] text-[var(--code-text)] whitespace-pre">{glm}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
