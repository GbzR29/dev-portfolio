// src/lib/syntaxTheme.ts
import type { CSSProperties } from "react";
import {
  okaidia, oneLight, vscDarkPlus, vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type PrismTheme = Record<string, CSSProperties>;

/**
 * Prism themes paint the code background themselves — most with the `background`
 * shorthand, `vs` with the `backgroundColor` longhand. Two problems come from that:
 *
 *  1. Overriding it from `customStyle` mixes a shorthand with a longhand on the
 *     same element. React warns about it as soon as the value changes on a
 *     re-render, which is exactly what a theme toggle does.
 *  2. It paints over `--code-bg`, so the block ignores our own token. oneLight
 *     sets it on the inner <code> too, which `customStyle` cannot reach at all.
 *
 * Stripping both properties from the two container selectors solves both: the
 * element paints nothing and the container's `--code-bg` shows through.
 */
function stripBackground(theme: PrismTheme): PrismTheme {
  const out: PrismTheme = { ...theme };
  for (const selector of ['pre[class*="language-"]', 'code[class*="language-"]']) {
    const rule = out[selector];
    if (!rule) continue;
    const cleaned: CSSProperties = { ...rule };
    delete cleaned.background;
    delete cleaned.backgroundColor;
    out[selector] = cleaned;
  }
  return out;
}

/**
 * oneLight ships comments at ~64% lightness, which is too faint on our code
 * surface — and in these lessons the comments carry teaching content.
 */
function readableComments(theme: PrismTheme): PrismTheme {
  return { ...theme, comment: { ...theme.comment, color: "hsl(230, 6%, 45%)" } };
}

const LESSON_DARK  = stripBackground(okaidia as PrismTheme);
const LESSON_LIGHT = readableComments(stripBackground(oneLight as PrismTheme));
const MODAL_DARK   = stripBackground(vscDarkPlus as PrismTheme);
const MODAL_LIGHT  = stripBackground(vs as PrismTheme);

/** Syntax colours for lesson code blocks. */
export const lessonSyntaxTheme = (theme: "dark" | "light"): PrismTheme =>
  theme === "dark" ? LESSON_DARK : LESSON_LIGHT;

/** Syntax colours for the project modal's code tab. */
export const modalSyntaxTheme = (theme: "dark" | "light"): PrismTheme =>
  theme === "dark" ? MODAL_DARK : MODAL_LIGHT;
