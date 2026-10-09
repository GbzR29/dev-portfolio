"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

// The "where" heading of an equation's symbol list, and the words/symbols toggle, per UI language
const WHERE: Record<string, string> = { en: "where", pt: "onde", es: "donde", zh: "其中" };
const IN_WORDS: Record<string, [string, string]> = {
  en: ["in words", "symbols"], pt: ["em palavras", "símbolos"], es: ["en palabras", "símbolos"], zh: ["文字", "符号"],
};

// ── LaTeX for lessons ─────────────────────────────────────────────────────────
// Rendered to HTML on the server with KaTeX, so formulas appear with the page
// and never shift the layout. Colour macros map to CSS classes (see
// globals.css → .tx-*), so a symbol is the same colour here and in the figures
// in both themes:
//   \red{…} \green{…} \blue{…} \amber{…} \purple{…} \cyan{…} \muted{…}
// A few shorthands keep lighting formulas short:
//   \vN \vL \vV \vR \vH   bold unit vectors n̂, l̂, v̂, r̂, ĥ in their figure colours
//   \dotp{a}{b}           a · b
// Linked symbols: \sym{id}{…} marks a symbol. Pointing at it (or tapping it)
// lights it up everywhere in the same equation, together with the "where"
// line whose symbol carries the same \sym id, and the other way round.
//   • Colour comes for free: every id explained in the "where" list gets its
//     own colour, in the formula and in its line alike, unless its TeX already
//     picks one (\sym{now}{\amber{X_n}}).
//   • One symbol can belong to several groups: \sym{r2 e21 e22}{c}. The first
//     id is the one pointing at it lights; the others make it light up when
//     any of those ids is lit (see texMatrix.ts: an entry of a product lights
//     its row and its column). Its colour is that of its first coloured id.

const MACROS: Record<string, string> = {
  "\\sym": "\\htmlData{sym=#1}{#2}",
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

/** \sym id → colour class, for the symbols of one card (see symColors). */
export type SymColors = Map<string, string>;

export function render(tex: string, display: boolean, colors?: SymColors): string {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,          // a typo shows red source instead of crashing the page
    strict: false,
    macros: { ...MACROS },
    trust: ctx => ctx.command === "\\htmlClass" || ctx.command === "\\htmlData",
  });
  if (!colors?.size) return html;
  // KaTeX writes \htmlData as <span class="enclosing" data-sym="…">: colour it by its first id that has a colour
  return html.replace(/class="enclosing" data-sym="([\w -]+)"/g, (m, ids: string) => {
    const c = ids.split(" ").map(id => colors.get(id)).find(Boolean);
    return c ? `class="enclosing ${c}" data-sym="${ids}"` : m;
  });
}

const SYM = /\\sym\{([\w-]+)[^}]*\}(\{\\(red|green|blue|amber|purple|cyan|muted)\{)?/;

/** The first \sym id a piece of TeX carries, if any (for "where" lines). */
export const symOf = (tex: string) => tex.match(SYM)?.[1];

// The order colours are handed out in; red last, it reads as "wrong"
const PALETTE = ["amber", "green", "blue", "purple", "cyan", "red"];

/**
 * A colour for every \sym id named in a "where" list, in list order. Ids whose
 * TeX already sets a colour keep it, and their colour is not handed out again.
 */
export function symColors(where?: [string, ReactNode][]): SymColors {
  const colors: SymColors = new Map();
  if (!where) return colors;
  const found = where.map(([tex]) => tex.match(SYM)).filter(m => m !== null);
  const taken = new Set(found.map(m => m[3]).filter(Boolean));
  const free = PALETTE.filter(c => !taken.has(c));
  for (const m of found) {
    if (m[3] || colors.has(m[1])) continue;
    colors.set(m[1], `tx-${free[colors.size % free.length]}`);
  }
  return colors;
}

/**
 * Hover / tap linking for \sym-marked symbols inside `root`: the id under the
 * pointer gets the class "sym-on" on every element that carries it.
 */
export function useSymbolLinks<E extends HTMLElement>() {
  const ref = useRef<E>(null);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll(".sym-on").forEach(e => e.classList.remove("sym-on"));
    if (active) root.querySelectorAll(`[data-sym~="${active}"]`).forEach(e => e.classList.add("sym-on"));
  }, [active]);
  // The first id of the symbol under the pointer
  const idAt = (t: EventTarget | null) =>
    (t as HTMLElement | null)?.closest?.("[data-sym]")?.getAttribute("data-sym")?.split(" ")[0] ?? null;
  return {
    ref,
    handlers: {
      onPointerOver: (e: React.PointerEvent) => { if (e.pointerType === "mouse") setActive(idAt(e.target)); },
      onPointerLeave: (e: React.PointerEvent) => { if (e.pointerType === "mouse") setActive(null); },
      // Touch: a tap toggles the symbol under the finger
      onClick: (e: React.MouseEvent) => { const id = idAt(e.target); setActive(a => (id && a !== id ? id : null)); },
    },
  };
}

/**
 * The "where" legend under a formula card (Equation, Derivation, LiveFormula):
 * one line per symbol, its meaning linked to it by its \sym id.
 */
export function WhereList({ where, colors }: { where?: [string, ReactNode][]; colors?: SymColors }) {
  const { language } = useLanguage();
  if (!where?.length) return null;
  return (
    <div className="px-4 pb-3.5 pt-1 border-t border-[var(--separator)] grid gap-x-4 gap-y-1.5 grid-cols-[auto_1fr] items-baseline text-[13px]">
      <span className="col-span-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] pt-2">{WHERE[language] ?? WHERE.en}</span>
      {where.map(([sym, meaning], i) => (
        <div key={i} className="contents">
          <span className="text-[var(--primary)] whitespace-nowrap" dangerouslySetInnerHTML={{ __html: render(sym, false, colors) }} />
          <span data-sym={symOf(sym)} className="eq-meaning text-[var(--text-muted)] leading-snug">{meaning}</span>
        </div>
      ))}
    </div>
  );
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
export function Equation({ children, label, where, note, notes, glsl, glm, words }: {
  children: string;
  label?: string;
  where?: [string, ReactNode][];
  note?: ReactNode;
  notes?: ReactNode[];
  glsl?: string;
  glm?: string;
  /** The same statement as a sentence; adds an "in words" toggle. */
  words?: ReactNode;
}) {
  const { language } = useLanguage();
  const [inWords, setInWords] = useState(false);
  const links = useSymbolLinks<HTMLDivElement>();
  const colors = symColors(where);
  const [wordsLabel, symbolsLabel] = IN_WORDS[language] ?? IN_WORDS.en;
  return (
    <div ref={links.ref} {...links.handlers} className="eq-card my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      {(label || words) && (
        <div className="px-4 pt-3 flex items-center gap-3">
          {label && <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</span>}
          {words && (
            <button type="button" onClick={() => setInWords(w => !w)} aria-pressed={inWords}
              className="ml-auto flex-shrink-0 px-2 py-0.5 rounded-md border border-[var(--border)] text-[10.5px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-colors">
              {inWords ? `∑ ${symbolsLabel}` : `Aa ${wordsLabel}`}
            </button>
          )}
        </div>
      )}
      {inWords && words
        ? <div className="eq-words px-5 py-5 text-[15px] leading-relaxed text-[var(--text-main)]">{words}</div>
        : <div className="px-4 py-5 overflow-x-auto text-[var(--text-main)] text-[1.1rem]"
            dangerouslySetInnerHTML={{ __html: render(children, true, colors) }} />}
      <WhereList where={where} colors={colors} />
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
