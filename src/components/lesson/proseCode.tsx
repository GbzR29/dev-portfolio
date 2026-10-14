"use client";

// ── Code names in prose ─────────────────────────────────────────────────────
// Lesson text is plain strings (tx), so API names inside a sentence
// ("glBindBuffer(GL_ARRAY_BUFFER, vbo) makes…") used to read as ordinary words.
// This walks a chapter's JSX before it renders and wraps those names in <IC>,
// which also links OpenGL functions to their reference card. Only text inside
// paragraphs, lists, emphasis and the components listed in `deep` is touched;
// headings, code, tables and figures are left as they are.

import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { IC } from "./LessonComponents";

// API-looking tokens: gl… and glfw… calls, GL_ and GLFW_ constants, GL types,
// glm:: and std:: names, sizeof(…), source file names.
const CODE_NAME = new RegExp(
  [
    String.raw`\b(?:gl|glfw)[A-Z]\w*(?:\*\w*)?(?:\([^()]*\))?`,
    String.raw`\b(?:GL|GLFW)_[A-Z0-9_]+\b`,
    String.raw`\bGL(?:uint|int|float|double|sizei|sizeiptr|intptr|enum|boolean|bitfield|ubyte|byte|ushort|short|char|void)\b`,
    String.raw`\b(?:glm|std)::[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*(?:\([^()]*\))?`,
    String.raw`\bsizeof\([^()]*\)`,
    String.raw`\b[\w-]+\.(?:cpp|hpp|h|glsl|vert|frag|geom|comp)\b`,
  ].join("|"),
  "g",
);

/** Elements whose children are walked. */
const INTRINSIC = new Set(["p", "li", "ul", "ol", "strong", "em", "b", "i", "span"]);

function splitText(text: string, keyBase: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CODE_NAME)) {
    if (m.index === undefined) continue;
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<IC key={`${keyBase}-${m.index}`}>{m[0]}</IC>);
    last = m.index + m[0].length;
  }
  if (last === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function walk(node: ReactNode, deep: ReadonlySet<unknown>, key: string): ReactNode {
  if (typeof node === "string") return splitText(node, key);
  if (Array.isArray(node)) return node.map((child, i) => walk(child, deep, `${key}.${i}`));
  if (!isValidElement(node)) return node;

  const el = node as ReactElement<{ children?: ReactNode }>;
  const walkable = el.type === Fragment || (typeof el.type === "string" && INTRINSIC.has(el.type)) || deep.has(el.type);
  if (!walkable || el.props.children === undefined) return node;
  const children = Children.map(el.props.children, (child, i) => walk(child, deep, `${key}.${i}`));
  return cloneElement(el, undefined, children);
}

/** One string with its code names marked (table cells, goal and key-idea items). */
export function markCode(text: string): ReactNode {
  return splitText(text, "m");
}

/** `deep`: components whose text children are prose too (Lead, Callout). */
export function markCodeInProse(children: ReactNode, deep: ReadonlySet<unknown>): ReactNode {
  return Children.map(children, (child, i) => walk(child, deep, `c${i}`));
}
