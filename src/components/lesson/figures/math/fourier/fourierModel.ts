// ── Fourier series on [−π, π] ─────────────────────────────────────────────────
// The preset functions of the Fourier figure and their coefficients
//   a_n = (1/π) ∫ f(x) cos(nx) dx,  b_n = (1/π) ∫ f(x) sin(nx) dx  over [−π, π],
// computed by the midpoint rule (fine enough that the jumps cost < 1e-4), and
// the partial sum a₀/2 + Σ (a_n cos nx + b_n sin nx).

export const PRESETS = ["square", "saw", "triangle", "halfwave", "pulse"] as const;
export type Preset = (typeof PRESETS)[number];

const PI = Math.PI, TAU = 2 * PI;
/** x moved into [−π, π), so every preset repeats with period 2π. */
export const wrap = (x: number) => ((((x + PI) % TAU) + TAU) % TAU) - PI;

const BASE: Record<Preset, (x: number) => number> = {
  square: x => (x > 0 ? 1 : x < 0 ? -1 : 0),
  saw: x => x / PI,
  triangle: x => 1 - (2 * Math.abs(x)) / PI,
  halfwave: x => Math.max(0, Math.sin(x)),
  pulse: x => (x > 0 && x < (2 * PI) / 3 ? 1 : 0),
};
export const fOf = (p: Preset) => (x: number) => BASE[p](wrap(x));

export const MAX_N = 40;
export type Coefs = { a: number[]; b: number[] };

const cache = new Map<Preset, Coefs>();
/** a[0..MAX_N] and b[0..MAX_N] (b[0] = 0). */
export function coefs(p: Preset): Coefs {
  const hit = cache.get(p);
  if (hit) return hit;
  const M = 8192, h = TAU / M, f = BASE[p];
  const a = new Array(MAX_N + 1).fill(0), b = new Array(MAX_N + 1).fill(0);
  for (let i = 0; i < M; i++) {
    const x = -PI + (i + 0.5) * h, y = f(x) * h / PI;
    for (let n = 0; n <= MAX_N; n++) { a[n] += y * Math.cos(n * x); b[n] += y * Math.sin(n * x); }
  }
  const clean = (v: number) => (Math.abs(v) < 2e-4 ? 0 : v);
  const out = { a: a.map(clean), b: b.map(clean) };
  cache.set(p, out);
  return out;
}

/** a₀/2 + Σ_{n=1..N} (a_n cos nx + b_n sin nx); `cos: false` drops the cosine terms (and a₀). */
export function partial(c: Coefs, N: number, x: number, cos = true) {
  let s = cos ? c.a[0] / 2 : 0;
  for (let n = 1; n <= N; n++) s += (cos ? c.a[n] * Math.cos(n * x) : 0) + c.b[n] * Math.sin(n * x);
  return s;
}

/** Mean squared error of the partial sum over one period (the "energy" still missing). */
export function meanSqError(p: Preset, N: number, cos = true) {
  const c = coefs(p), f = BASE[p], M = 1200, h = TAU / M;
  let s = 0;
  for (let i = 0; i < M; i++) { const x = -PI + (i + 0.5) * h, d = f(x) - partial(c, N, x, cos); s += d * d * h; }
  return s / TAU;
}
