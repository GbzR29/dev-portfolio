// src/components/lesson/LessonComponents.tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLessonLook } from "./look";
import { markCode } from "./proseCode";
import { Prism as SyntaxHighlighter, createElement } from "react-syntax-highlighter";
import { lessonSyntaxTheme } from "@/lib/syntaxTheme";
import { RefToken, useReference, useRefEntry } from "@/components/reference/RefToken";
import { referenceIndex, type RefEntry } from "@/lib/reference";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ─── Reference linking ────────────────────────────────────────────────────────
// The highlighter hands its renderer a HAST-like tree. We split text nodes on
// known API names and swap each match for a RefToken element; createElement
// accepts a component as tagName, so the rest of the pipeline is untouched.

type HastNode = {
  type: string;
  tagName?: unknown;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function linkifyNode(node: HastNode, pattern: RegExp, index: Map<string, RefEntry>): HastNode[] {
  // Line-number nodes carry a numeric value — only real strings are scanned.
  if (node.type === "text" && typeof node.value === "string") {
    const out: HastNode[] = [];
    let last = 0;
    for (const m of node.value.matchAll(pattern)) {
      const entry = index.get(m[0]);
      if (!entry || m.index === undefined) continue;
      if (m.index > last) out.push({ type: "text", value: node.value.slice(last, m.index) });
      out.push({
        type: "element",
        tagName: RefToken,
        properties: { className: [], entry },
        children: [{ type: "text", value: m[0] }],
      });
      last = m.index + m[0].length;
    }
    if (last === 0) return [node];
    if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
    return out;
  }
  if (node.children) {
    return [{ ...node, children: node.children.flatMap((c) => linkifyNode(c, pattern, index)) }];
  }
  return [node];
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

/** Clean look: listings longer than this start folded to CODE_FOLD_TO lines. */
const CODE_FOLD_OVER = 24;
const CODE_FOLD_TO = 14;

export function CodeBlock({
  children, lang = "cpp", filename, t,
}: {
  children: string;
  lang?: string;
  filename?: string;
  t?: TrackTranslations;
}) {
  const [copied, setCopied] = useState(false);
  const reference = useReference();

  const renderer = useMemo(() => {
    if (!reference) return undefined;
    const index = referenceIndex(reference);
    return ({ rows, stylesheet, useInlineStyles }: {
      rows: HastNode[];
      stylesheet: { [key: string]: React.CSSProperties };
      useInlineStyles: boolean;
    }) =>
      rows.map((row, i) =>
        createElement({
          node: linkifyNode(row, reference.tokenPattern, index)[0] as never,
          stylesheet,
          useInlineStyles,
          key: `row-${i}`,
        }),
      );
  }, [reference]);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean look: long listings (a whole main.cpp) start folded to their first lines
  const look = useLessonLook();
  const lineCount = children.replace(/\n$/, "").split("\n").length;
  const foldable = look.clean && lineCount > CODE_FOLD_OVER;
  const [open, setOpen] = useState(false);
  const folded = foldable && !open;

  return (
    <div data-wide="" className="rounded-xl overflow-hidden border border-[var(--border)] !my-8">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--code-bg)] border-b border-[var(--border)]">
        <span className="font-mono text-[11.5px] text-[var(--text-muted)]">
          {filename ?? lang}
          {foldable && <span className="ml-3 opacity-70">{tx(t, "codeLines", "{n} lines").replace("{n}", String(lineCount))}</span>}
        </span>
        <button
          onClick={handleCopy}
          className="text-[11.5px] font-mono text-[var(--primary)] hover:underline underline-offset-4 px-1 py-1"
        >
          {copied ? tx(t, "codeCopied", "copied") : tx(t, "codeCopy", "copy")}
        </button>
      </div>
      <div
        className={`${folded ? "overflow-hidden code-folded" : "overflow-auto"} bg-[var(--code-bg)]`}
        style={folded ? { maxHeight: `calc(${CODE_FOLD_TO} * 1.75 * 0.82rem + 1.25rem)` } : undefined}
      >
        <SyntaxHighlighter
          language={lang}
          style={lessonSyntaxTheme()}
          showLineNumbers
          renderer={renderer as never}
          lineNumberStyle={{ color: "var(--code-gutter)", fontSize: "0.7rem", minWidth: "2.5em", userSelect: "none" }}
          customStyle={{
            margin: 0,
            padding: "1.25rem 1.25rem 1.25rem 0",
            fontSize: "0.82rem",
            lineHeight: "1.75",
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
      {foldable && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full px-4 py-2 bg-[var(--code-bg)] border-t border-[var(--border)] font-mono text-[11.5px] text-[var(--primary)] hover:underline underline-offset-4 text-left"
        >
          {open
            ? tx(t, "codeFold", "fold the code")
            : tx(t, "codeShowAll", "show all {n} lines").replace("{n}", String(lineCount))}
        </button>
      )}
    </div>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────────

type CalloutType = "info" | "warn" | "tip";

export function Callout({
  type = "info", children, t,
}: {
  type?: CalloutType;
  children: React.ReactNode;
  t?: TrackTranslations;
}) {
  // A rule down the left edge and a faint tint: note = the page accent,
  // warning = amber, tip = green. Colours come from the theme tokens.
  const config = {
    info: { tone: "var(--primary)",   tint: "var(--primary-low)",   labelKey: "calloutNote",    fallback: "NOTE"    },
    warn: { tone: "var(--highlight)", tint: "var(--highlight-low)", labelKey: "calloutWarning", fallback: "WARNING" },
    tip:  { tone: "var(--success)",   tint: "color-mix(in srgb, var(--success) 8%, transparent)", labelKey: "calloutTip", fallback: "TIP" },
  }[type];

  // Clean look: warnings stay a visible card; notes and tips become a chip under
  // the paragraph they add to, opening a popover
  const look = useLessonLook();
  if (look.clean) {
    const Variant = type === "warn" ? CleanCallout : CalloutChip;
    return <Variant type={type} tone={config.tone} tint={config.tint} label={tx(t, config.labelKey, config.fallback)} t={t}>{children}</Variant>;
  }

  return (
    <div className="!my-8 py-4 px-5 border-l-2" style={{ borderColor: config.tone, background: config.tint }}>
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] block mb-1.5" style={{ color: config.tone }}>
        {tx(t, config.labelKey, config.fallback)}
      </span>
      <div className="text-[var(--text-main)] opacity-90 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

/** Drawn 14 px marks for the three callout kinds (stroke = the callout's tone). */
function CalloutIcon({ type }: { type: CalloutType }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (type === "warn") {
    return <svg {...common}><path d="M8 1.8 15 14H1z" /><path d="M8 6.2v3.6M8 11.9v.1" /></svg>;
  }
  if (type === "tip") {
    return <svg {...common}><path d="M5.6 10.4A4.6 4.6 0 1 1 10.4 10.4c-.6.5-.9 1.1-.9 1.8H6.5c0-.7-.3-1.3-.9-1.8z" /><path d="M6.4 14.4h3.2" /></svg>;
  }
  return <svg {...common}><circle cx="8" cy="8" r="6.6" /><path d="M8 7.2v4.2M8 4.7v.1" /></svg>;
}

/** The clean-look warning card (styles: learn.css "Clean look"). Always open:
 *  the first time it scrolls into view its rule draws down, the icon pops in
 *  and the text rises. */
function CleanCallout({ type, tone, tint, label, children }: {
  type: CalloutType;
  tone: string;
  tint: string;
  label: string;
  t?: TrackTranslations;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  // Play the entrance once, when a fifth of the card is on screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-callout=""
      data-seen={seen ? "" : undefined}
      className="callout-clean"
      style={{ "--tone": tone, "--tint": tint } as React.CSSProperties}
    >
      <span className="callout-rule" aria-hidden="true" />
      <span className="callout-head font-mono">
        <span className="callout-badge"><CalloutIcon type={type} /></span>
        {label}
      </span>
      <div className="callout-body">{children}</div>
    </div>
  );
}

/** The clean-look note or tip: a chip under the paragraph it adds to (a curved
 *  arrow points up at it); the text opens in a popover below the chip, or above
 *  when there is no room, and as a bottom sheet on phones (learn.css). Closes on
 *  an outside click, Esc or ×. The text stays in the page while closed. */
function CalloutChip({ type, tone, tint, label, t, children }: {
  type: CalloutType;
  tone: string;
  tint: string;
  label: string;
  t?: TrackTranslations;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const popId = useId();
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);

  const toggle = () => {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setAbove(below < 320 && r.top > below);
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); chipRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      data-callout=""
      className="callout-chip-wrap"
      style={{ "--tone": tone, "--tint": tint } as React.CSSProperties}
    >
      <button
        ref={chipRef}
        type="button"
        className="callout-chip font-mono"
        aria-expanded={open}
        aria-controls={popId}
        onClick={toggle}
      >
        {/* curved arrow up to the paragraph this note belongs to */}
        <svg className="callout-chip-point" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 13H7a4 4 0 0 1-4-4V3" /><path d="M1 5l2-2 2 2" />
        </svg>
        <span className="callout-badge"><CalloutIcon type={type} /></span>
        {label}
      </button>
      <div
        id={popId}
        role="dialog"
        aria-label={label}
        className="callout-pop"
        data-open={open ? "" : undefined}
        data-above={above ? "" : undefined}
      >
        <div className="callout-pop-head font-mono">
          <span className="callout-badge"><CalloutIcon type={type} /></span>
          {label}
          <button type="button" className="callout-pop-close" onClick={() => { setOpen(false); chipRef.current?.focus(); }} aria-label={tx(t, "calloutClose", "close")}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="callout-pop-body">{children}</div>
      </div>
    </div>
  );
}

// ─── InlineCode ───────────────────────────────────────────────────────────────

export function IC({ children }: { children: string }) {
  const entry = useRefEntry(children);
  const cls = "bg-[var(--primary-low)] px-1.5 py-0.5 rounded-sm text-[var(--text-main)] font-mono text-[0.85em]";
  return (
    <code className={cls}>
      {entry ? <RefToken entry={entry}>{children}</RefToken> : children}
    </code>
  );
}

// ─── H2 / H3 ─────────────────────────────────────────────────────────────────
// scroll-margin offsets the sticky top bar so headings aren't hidden when jumped to.

function slug(text: React.ReactNode): string {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function H2({ children }: { children: React.ReactNode }) {
  const look = useLessonLook();
  const id = slug(children);
  const folded = look.folded.has(id);
  return (
    <h2
      id={id}
      data-folded={look.canFold && folded ? "" : undefined}
      className="font-display text-[1.85rem] leading-tight font-normal text-[var(--text-main)] !mt-16 scroll-mt-[calc(var(--nav-h,81px)+24px)] [text-wrap:balance]"
    >
      {look.canFold ? (
        // Clean look: the heading folds its section (LessonView hides the section's blocks)
        <button
          type="button"
          data-fold-toggle=""
          onClick={() => look.toggleFold(id)}
          aria-expanded={!folded}
          className="group/fold inline text-left cursor-pointer"
        >
          {children}
          <svg
            width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className={`inline-block ml-3 align-middle text-[var(--text-muted)] transition-[transform,opacity] duration-200
              ${folded ? "-rotate-90 opacity-100" : "opacity-0 group-hover/fold:opacity-100 group-focus-visible/fold:opacity-100"}`}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      ) : children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      id={slug(children)}
      className="font-display text-[1.3rem] font-medium text-[var(--text-main)] !mt-10 scroll-mt-[calc(var(--nav-h,81px)+24px)]"
    >
      {children}
    </h3>
  );
}

// ─── LessonTable ──────────────────────────────────────────────────────────────

export function LessonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  // Clean look: code names inside the text columns read as code too
  const { clean } = useLessonLook();
  return (
    <div data-wide="" className="overflow-x-auto my-6 border-t border-[var(--border-strong)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left pl-0 pr-4 pt-2.5 pb-2 font-mono font-medium text-[11px] text-[var(--text-muted)] uppercase tracking-[0.06em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] border-b border-[var(--border)]">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`pl-0 pr-4 py-2.5 text-[13.5px] align-baseline ${j === 0 ? "font-mono text-[var(--primary)]" : "text-[var(--text-main)] opacity-90"}`}>
                  {clean && j > 0 && typeof cell === "string" ? markCode(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MathBlock ─────────────────────────────────────────────────────────────────
// Renders a mathematical formula with optional GLSL and GLM code equivalents.

export function MathBlock({
  children,
  label,
  glsl,
  glm,
}: {
  children: React.ReactNode;
  label?: string;
  glsl?: string;
  glm?: string;
}) {
  return (
    <div className="my-5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {label && (
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">{label}</div>
          )}
          <div className="font-mono text-[var(--text-main)] text-sm leading-loose">{children}</div>
        </div>
      </div>
      {(glsl || glm) && (
        <div className="border-t border-[var(--code-border)] bg-[var(--code-bg)] px-5 py-3 space-y-1.5">
          {glsl && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-emerald-400/60 uppercase tracking-widest flex-shrink-0 w-10">GLSL</span>
              <code className="font-mono text-[11px] text-[var(--code-text)]">{glsl}</code>
            </div>
          )}
          {glm && (
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-mono text-blue-400/60 uppercase tracking-widest flex-shrink-0 w-10">GLM</span>
              <code className="font-mono text-[11px] text-[var(--code-text)]">{glm}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Matrix4x4 ────────────────────────────────────────────────────────────────
// Visual 4×4 matrix for math explanations.

export function Matrix4x4({
  data,
  label,
}: {
  data: (string | number)[][];
  label?: string;
}) {
  return (
    <div className="inline-flex flex-col items-center">
      {label && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2 text-center">
          {label}
        </span>
      )}
      <div className="flex items-stretch gap-0">
        {/* Left bracket via borders */}
        <div className="border-l-2 border-t-2 border-b-2 border-[var(--border-strong)] w-2.5 rounded-l" />
        <div className="px-3 py-2 flex flex-col gap-0.5">
          {data.map((row, i) => (
            <div key={i} className="flex gap-3">
              {row.map((cell, j) => (
                <span
                  key={j}
                  className={`font-mono text-[11px] text-right leading-5 min-w-[3ch] ${
                    cell === 0 || cell === "0"
                      ? "text-[var(--text-muted)] opacity-25"
                      : cell === 1 || cell === "1"
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-main)]"
                  }`}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* Right bracket */}
        <div className="border-r-2 border-t-2 border-b-2 border-[var(--border-strong)] w-2.5 rounded-r" />
      </div>
    </div>
  );
}