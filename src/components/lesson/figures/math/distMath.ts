// ── Probabilities of the common distributions ─────────────────────────────────
// Shared by DistributionFigure and the live formulas of the distributions
// chapter.

export const choose = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
export const fact = (k: number) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
export const normPdf = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
export const poisPmf = (k: number, l: number) => (Math.exp(-l) * l ** k) / fact(k);
export const binomPmf = (k: number, n: number, p: number) => choose(n, k) * p ** k * (1 - p) ** (n - k);

/** P(K ≥ k) for Binomial(n, p), summed in logs so large n neither overflows nor underflows. */
export function binomTail(n: number, p: number, k: number) {
  let lnC = 0, sum = 0;                               // lnC = ln C(n, j), built up from j = 0
  for (let j = 0; j <= n; j++) {
    if (j > 0) lnC += Math.log((n - j + 1) / j);
    if (j >= k) sum += Math.exp(lnC + j * Math.log(p) + (n - j) * Math.log(1 - p));
  }
  return Math.min(1, sum);
}

/** Standard normal CDF by the Abramowitz–Stegun 7.1.26 approximation of erf (error < 1.5e-7). */
export function Phi(z: number) {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
