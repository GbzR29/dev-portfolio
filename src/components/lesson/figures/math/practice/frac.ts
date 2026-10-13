// ── Exact fractions ───────────────────────────────────────────────────────────
// The practice generators never touch floating point: every number is a
// fraction n/d of integers, kept in lowest terms with d > 0. That is what makes
// the answers trustworthy: 1/3 + 1/6 is exactly 1/2, never 0.49999…
// The numbers stay small, but every result is still checked to be a safe integer.

export type Frac = { n: number; d: number };

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const lcm = (a: number, b: number) => Math.abs(a / gcd(a, b) * b);

function safe(x: number) {
  if (!Number.isSafeInteger(x)) throw new Error(`fraction overflow: ${x}`);
  return x;
}

/** n/d in lowest terms, d > 0. */
export function fr(n: number, d = 1): Frac {
  safe(n); safe(d);
  if (d === 0) throw new Error("division by zero");
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g + 0, d: d / g };          // + 0 turns -0 into 0
}

export const add = (a: Frac, b: Frac) => fr(safe(a.n * b.d + b.n * a.d), safe(a.d * b.d));
export const sub = (a: Frac, b: Frac) => fr(safe(a.n * b.d - b.n * a.d), safe(a.d * b.d));
export const mul = (a: Frac, b: Frac) => fr(safe(a.n * b.n), safe(a.d * b.d));
export const div = (a: Frac, b: Frac) => fr(safe(a.n * b.d), safe(a.d * b.n));
export const neg = (a: Frac) => fr(-a.n, a.d);
export const eq = (a: Frac, b: Frac) => a.n === b.n && a.d === b.d;
export const isInt = (a: Frac) => a.d === 1;

/** aᵏ for a whole k (negative k flips the fraction). */
export function pow(a: Frac, k: number): Frac {
  if (!Number.isInteger(k)) throw new Error("pow: whole exponents only");
  let r = fr(1);
  for (let i = 0; i < Math.abs(k); i++) r = mul(r, a);
  return k < 0 ? div(fr(1), r) : r;
}

/** TeX: 5, -3, \frac{3}{4}, -\frac{1}{2}. */
export function texFrac(a: Frac) {
  if (a.d === 1) return `${a.n}`;
  return `${a.n < 0 ? "-" : ""}\\frac{${Math.abs(a.n)}}{${a.d}}`;
}
/** Plain text: 5, -3, 3/4. */
export const textFrac = (a: Frac) => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);
