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

/** (x, y, z) as TeX. */
export const vec = (v: number[], d = 2) => `(${v.map(x => num(x, d)).join(",\\ ")})`;
