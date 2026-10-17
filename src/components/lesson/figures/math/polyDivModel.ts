// ── Polynomial division by (x − r): Ruffini's rule with exact fractions ──────
// Pure helpers for RuffiniFigure (and the practice generators). A polynomial
// is its list of coefficients from the highest power down: 2x³ − 5x + 1 is
// [2, 0, −5, 1]. Every number is an exact fraction (practice/frac.ts).

import { add, eq, fr, mul, textFrac, type Frac } from "./practice/frac";

/**
 * Ruffini's rule: bring the first coefficient down, then repeatedly multiply
 * by r and add the next coefficient. `row` is the bottom row: the quotient's
 * coefficients followed by the remainder; `products[k]` is r · row[k − 1],
 * the number written under coefficient k (undefined for the first one).
 */
export function ruffini(coefs: Frac[], r: Frac) {
  const row: Frac[] = [], products: (Frac | undefined)[] = [];
  coefs.forEach((c, k) => {
    if (k === 0) { row.push(c); products.push(undefined); return; }
    const p = mul(row[k - 1], r);
    products.push(p);
    row.push(add(c, p));
  });
  return { row, products, quotient: row.slice(0, -1), remainder: row[row.length - 1] };
}

/** p(r) by Horner (the same numbers as Ruffini's bottom row). */
export const evaluate = (coefs: Frac[], r: Frac) => ruffini(coefs, r).remainder;

const divisors = (n: number) => {
  const a = Math.abs(n), out: number[] = [];
  for (let d = 1; d <= a; d++) if (a % d === 0) out.push(d);
  return out;
};

/**
 * The rational root theorem's candidates ±p/q for whole-number coefficients:
 * p divides the constant term, q divides the leading coefficient. A zero
 * constant term means 0 is a root; it is listed and the rest is found from the
 * remaining coefficients.
 */
export function candidates(coefs: number[]): Frac[] {
  let cs = coefs, zero = false;
  while (cs.length > 1 && cs[cs.length - 1] === 0) { cs = cs.slice(0, -1); zero = true; }
  const out: Frac[] = zero ? [fr(0)] : [];
  if (cs.length > 1) {
    for (const p of divisors(cs[cs.length - 1])) for (const q of divisors(cs[0])) for (const s of [1, -1]) {
      const f = fr(s * p, q);
      if (!out.some(o => eq(o, f))) out.push(f);
    }
  }
  return out.sort((a, b) => a.n / a.d - b.n / b.d);
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (k: number) => String(k).split("").map(d => SUP[+d]).join("");
/** Plain text with real minus signs: "2x³ − 5x + 1", "x² + 1/2". */
export function polyText(coefs: Frac[]) {
  const deg = coefs.length - 1, parts: string[] = [];
  coefs.forEach((c, i) => {
    if (c.n === 0) return;
    const k = deg - i, abs = fr(Math.abs(c.n), c.d), one = abs.n === 1 && abs.d === 1;
    const num = k > 0 && one ? "" : textFrac(abs);
    const body = num + (k === 0 ? "" : k === 1 ? "x" : `x${sup(k)}`);
    parts.push(parts.length === 0 ? (c.n < 0 ? `−${body}` : body) : `${c.n < 0 ? "−" : "+"} ${body}`);
  });
  return parts.length ? parts.join(" ") : "0";
}
/** "x − 2", "x + 1/3", "x". */
export const factorText = (r: Frac) => (r.n === 0 ? "x" : `x ${r.n > 0 ? "−" : "+"} ${textFrac(fr(Math.abs(r.n), r.d))}`);
/** A number for display, with a real minus sign. */
export const fracText = (a: Frac) => textFrac(a).replace("-", "−");
