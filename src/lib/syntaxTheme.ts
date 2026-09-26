// src/lib/syntaxTheme.ts
import type { CSSProperties } from "react";

type PrismTheme = Record<string, CSSProperties>;

/**
 * Syntax colours for lesson code blocks. Every colour is a --syn-* variable
 * defined in src/styles/learn.css, so the same object serves both themes and
 * a theme toggle needs no re-render. No background is set: the block's
 * container paints --code-bg.
 */
const BASE: CSSProperties = {
  color: "var(--code-text)",
  fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
  textAlign: "left",
  whiteSpace: "pre",
  wordSpacing: "normal",
  wordBreak: "normal",
  tabSize: 4,
  hyphens: "none",
};

const LESSON: PrismTheme = {
  'code[class*="language-"]': BASE,
  'pre[class*="language-"]': { ...BASE, overflow: "auto" },
  comment: { color: "var(--syn-comment)", fontStyle: "italic" },
  prolog: { color: "var(--syn-comment)" },
  doctype: { color: "var(--syn-comment)" },
  cdata: { color: "var(--syn-comment)" },
  punctuation: { color: "var(--syn-punct)" },
  operator: { color: "var(--syn-punct)" },
  keyword: { color: "var(--syn-keyword)" },
  directive: { color: "var(--syn-keyword)" },
  "directive-hash": { color: "var(--syn-keyword)" },
  macro: { color: "var(--syn-keyword)" },
  boolean: { color: "var(--syn-number)" },
  number: { color: "var(--syn-number)" },
  constant: { color: "var(--syn-number)" },
  symbol: { color: "var(--syn-number)" },
  string: { color: "var(--syn-string)" },
  char: { color: "var(--syn-string)" },
  "attr-value": { color: "var(--syn-string)" },
  regex: { color: "var(--syn-string)" },
  url: { color: "var(--syn-string)" },
  "class-name": { color: "var(--syn-type)" },
  builtin: { color: "var(--syn-type)" },
  tag: { color: "var(--syn-type)" },
  function: { color: "var(--syn-function)" },
  property: { color: "var(--syn-function)" },
  "attr-name": { color: "var(--syn-function)" },
  variable: { color: "var(--code-text)" },
  important: { fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};

/** Syntax colours for lesson code blocks. */
export const lessonSyntaxTheme = (): PrismTheme => LESSON;
