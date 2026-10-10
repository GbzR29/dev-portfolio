// ── Number formatting for LiveFormula cards ───────────────────────────────────
// Shared by the OpenGL live-formula modules: numbers rounded for TeX, with
// negative factors wrapped in parentheses so "3 · -2" reads "3 · (−2)".

export const r = String.raw;

/** v rounded to d decimals, without trailing zeros. */
export const num = (v: number, d = 2) => String(Number(v.toFixed(d)) || 0);

/** A factor inside a product: negatives get parentheses. */
export const fac = (v: number, d = 2) => (Number(v.toFixed(d)) < 0 ? `(${num(v, d)})` : num(v, d));

/** "+ v" or "- v", for writing a sum term by term. */
export const signed = (v: number, d = 2) => (Number(v.toFixed(d)) < 0 ? `- ${num(-v, d)}` : `+ ${num(v, d)}`);

/** "a × 10^b" for TeX when v is tiny, plain digits otherwise. */
export function sci(v: number, digits = 3) {
  if (v === 0 || Math.abs(v) >= 0.01) return num(v, digits + 1);
  const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e;
  return `${num(m, 2)} \\times 10^{${e}}`;
}

/** An integer with thin spaces between groups of three digits: 97 542 144. */
export const big = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\\,");

/** (x, y, z) as TeX. */
export const vec = (v: number[], d = 2) => `(${v.map(x => num(x, d)).join(",\\ ")})`;
