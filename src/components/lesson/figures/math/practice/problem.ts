// ── A practice problem and how an answer is checked ───────────────────────────
// A generator builds the problem backwards: it picks the answer first and then
// writes a question that has exactly that answer, so the key is right by
// construction (and practice.test checks it again by substituting back).
// Typed answers are read exactly: 0.75, 3/4 and 6/8 are all the same number;
// a "lowest terms" answer asks again, without counting a mistake, for 6/8.

import { eq, fr, gcd, type Frac } from "./frac";

export type Level = 1 | 2 | 3;

export type Answer =
  | { kind: "num"; value: Frac; lowest?: boolean }   // lowest: a fraction must be typed reduced
  | { kind: "digits"; value: string };               // a numeral in some base, e.g. "101101"

export type Field = {
  /** TeX before the box: "x", "y", "x_1"; "" for a single answer. */
  label: string;
  /** Text after the box: "%". */
  suffix?: string;
  answer: Answer;
};

export type Problem = {
  key: string;
  /** The instruction: [translation key, English]. */
  ask: [string, string];
  /** The question itself, TeX. */
  tex: string;
  fields: Field[];
  /** The answers may be typed in any order (the two roots of a quadratic). */
  unordered?: boolean;
  /** The worked solution, one TeX line each. */
  steps: string[];
  /** The answer in one short TeX line, for the summary. */
  short: string;
};

export type Gen = (level: Level) => Problem;

// ── Random helpers ──
export const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
/** A whole number in [a, b] that is not 0. */
export const nz = (a: number, b: number) => { for (;;) { const x = ri(a, b); if (x) return x; } };
export const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const sgn = () => (Math.random() < 0.5 ? -1 : 1);

// ── Reading a typed answer ──
/** "-3", "2.5", "2,5", "3/4", "-3/4", " − 7 " → an exact fraction; anything else → null. */
export function readNumber(raw: string): { v: Frac; n: number; d: number } | null {
  const s = raw.replace(/[−–]/g, "-").replace(/\s+/g, "").replace(",", ".");
  let m = s.match(/^(-?)(\d+)\/(\d+)$/);
  if (m) {
    const n = Number(m[2]) * (m[1] ? -1 : 1), d = Number(m[3]);
    return d === 0 || !Number.isSafeInteger(n) || !Number.isSafeInteger(d) ? null : { v: fr(n, d), n, d };
  }
  m = s.match(/^(-?)(\d*)\.?(\d*)$/);
  if (!m || (!m[2] && !m[3]) || m[3].length > 12) return null;
  const d = 10 ** m[3].length, n = Number((m[2] || "0") + m[3]) * (m[1] ? -1 : 1);
  return Number.isSafeInteger(n) ? { v: fr(n, d), n, d } : null;
}

const digits = (s: string) => s.replace(/\s+/g, "").toLowerCase().replace(/^0+(?=.)/, "");

export type Verdict = "ok" | "wrong" | "unread" | "simplify";

function one(a: Answer, raw: string): Verdict {
  if (a.kind === "digits") return /^[0-9a-z\s]+$/i.test(raw.trim()) ? (digits(raw) === digits(a.value) ? "ok" : "wrong") : "unread";
  const r = readNumber(raw);
  if (!r) return "unread";
  if (!eq(r.v, a.value)) return "wrong";
  return a.lowest && Number.isInteger(r.d) && r.d !== 1 && gcd(r.n, r.d) > 1 && !raw.includes(".") && !raw.includes(",") ? "simplify" : "ok";
}

/** The whole answer: every box read, then right, wrong, or "reduce it first". */
export function check(p: Problem, inputs: string[]): Verdict {
  if (!p.unordered) {
    const vs = p.fields.map((f, i) => one(f.answer, inputs[i] ?? ""));
    if (vs.includes("unread")) return "unread";
    if (vs.includes("wrong")) return "wrong";
    return vs.includes("simplify") ? "simplify" : "ok";
  }
  // any order: match each box to a different answer
  const left = p.fields.map(f => f.answer);
  let simplify = false;
  for (const raw of inputs) {
    if (inputs.some(s => readNumber(s) === null)) return "unread";
    const k = left.findIndex(a => one(a, raw) !== "wrong");
    if (k < 0) return "wrong";
    if (one(left[k], raw) === "simplify") simplify = true;
    left.splice(k, 1);
  }
  return simplify ? "simplify" : "ok";
}
