// ── The ocean as a spectrum ───────────────────────────────────────────────────
// A wind sea is the sum of a huge number of waves with random phases. Which
// wavelengths carry how much energy is a measured law: the JONSWAP spectrum
// S(ω), which only needs the wind speed U and the fetch F (how far the wind
// has blown over open water). Spread over directions by D(θ) and turned into
// a wave-number spectrum S(kx, kz), it sets the variance of every Fourier
// mode; Gaussian random numbers then give one random sea with those
// statistics (Tessendorf, "Simulating Ocean Water", 2001).

import { mulberry32 } from "../../kit/figure";

export const G = 9.81;

export type SeaState = {
  wind: number;      // U, wind speed 10 m above the sea (m/s)
  fetch: number;     // F, distance the wind has blown over water (km)
  gamma: number;     // JONSWAP peak enhancement (1 = Pierson–Moskowitz, 3.3 = typical)
  windDir: number;   // degrees, direction the waves travel
  spread: number;    // s in cos^2s(Δθ/2): higher = waves more aligned with the wind
  short: number;     // amplitude factor for waves much shorter than the peak (1 = plain JONSWAP)
};

// JONSWAP was fitted to the energetic waves around the peak; measured slopes
// (Cox & Munk's sun-glitter photographs, 1954) show the short waves are
// steeper than its ω⁻⁵ tail predicts. `short` scales their amplitudes: 1 at
// the peak, rising to the full factor for waves 6× shorter.
export function shortBoost(k: number, kp: number, short: number) {
  const x = Math.min(Math.max((k / kp - 1.5) / 4.5, 0), 1);
  return 1 + (short - 1) * x * x * (3 - 2 * x);
}

// Past a dimensionless fetch g·F/U² of about 2.2·10⁴ the sea is fully
// developed: the wind adds no more energy than breaking removes, and a longer
// fetch changes nothing. The JONSWAP fetch laws hold only up to there.
export const FULLY_DEVELOPED = 2.2e4;

/** JONSWAP peak frequency ωp (rad/s) and Phillips constant α for wind U (m/s) over fetch F (m). */
export function jonswapPeak(U: number, F: number) {
  const x = Math.min(Math.max(F, 1000), (FULLY_DEVELOPED * U * U) / G);
  return { wp: 22 * Math.cbrt((G * G) / (U * x)), alpha: 0.076 * Math.pow((U * U) / (x * G), 0.22) };
}

/** S(ω) in m²·s: the variance per unit angular frequency. */
export function jonswap(w: number, U: number, F: number, gamma: number) {
  if (w <= 0) return 0;
  const { wp, alpha } = jonswapPeak(U, F);
  const sigma = w <= wp ? 0.07 : 0.09;
  const r = Math.exp(-((w - wp) ** 2) / (2 * sigma * sigma * wp * wp));
  return ((alpha * G * G) / w ** 5) * Math.exp(-1.25 * (wp / w) ** 4) * Math.pow(gamma, r);
}

/** D(θ) = N·cos^2s(θ/2), normalised so it integrates to 1 over −π … π (numerically). */
export function spreading(s: number) {
  const n = 720;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.pow(Math.cos((-Math.PI + ((i + 0.5) / n) * 2 * Math.PI) / 2), 2 * s);
  const norm = 1 / (sum * ((2 * Math.PI) / n));
  return (dTheta: number) => norm * Math.pow(Math.abs(Math.cos(dTheta / 2)), 2 * s);
}

// ── Cascades ──────────────────────────────────────────────────────────────────
// One FFT tile of size L repeats every L metres and holds wavelengths from L
// down to 2L/N. Three tiles of unrelated sizes each keep one band of
// wavelengths, so together they cover 500 m swells down to 10 cm ripples
// without two tiles drawing the same wave, and their repeats never line up.
export const N = 256;
export const CASCADES = [
  { L: 500, lMin: 20 },       // wavelengths from 500 m down to 20 m
  { L: 83, lMin: 3.3 },       // 20 m … 3.3 m
  { L: 13.7, lMin: 0 },       // 3.3 m … 2·13.7/256 ≈ 0.1 m
] as const;
export type Cascade = (typeof CASCADES)[number];

/**
 * The initial spectrum of one cascade: per texel (kx, kz) the RGBA32F values
 * (h̃0(k).re, h̃0(k).im, conj h̃0(−k).re, conj h̃0(−k).im). Texel (m, n) holds
 * k = 2π(m − N/2, n − N/2)/L. Also returns the variance the tile carries.
 */
export function initialSpectrum(sea: SeaState, c: Cascade, lMax: number, seed: number) {
  const rand = mulberry32(seed);
  const gauss = () => {                                     // Box–Muller
    const u = Math.max(rand(), 1e-9), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const dk = (2 * Math.PI) / c.L;
  const kLo = (2 * Math.PI) / lMax, kHi = c.lMin > 0 ? (2 * Math.PI) / c.lMin : Infinity;
  const D = spreading(sea.spread);
  const wind = (sea.windDir * Math.PI) / 180;
  const F = sea.fetch * 1000;
  const kp = jonswapPeak(sea.wind, F).wp ** 2 / G;

  // h̃0 for every texel first, then pair each k with −k
  const h0 = new Float32Array(N * N * 2);
  let variance = 0;
  for (let n = 0; n < N; n++) for (let m = 0; m < N; m++) {
    const kx = (m - N / 2) * dk, kz = (n - N / 2) * dk, k = Math.hypot(kx, kz);
    const xr = gauss(), xi = gauss();                      // drawn for every texel, so the sea does not reshuffle
    if (k < kLo || k >= kHi || k === 0) continue;
    const w = Math.sqrt(G * k), dwdk = G / (2 * w);
    const S = jonswap(w, sea.wind, F, sea.gamma) * D(Math.atan2(kz, kx) - wind) * dwdk / k * shortBoost(k, kp, sea.short) ** 2;
    const a = (Math.sqrt(S) * dk) / 2;
    h0[(n * N + m) * 2] = xr * a;
    h0[(n * N + m) * 2 + 1] = xi * a;
    variance += S * dk * dk;
  }
  const out = new Float32Array(N * N * 4);
  for (let n = 0; n < N; n++) for (let m = 0; m < N; m++) {
    const o = (n * N + m) * 4, i = (n * N + m) * 2;
    const mm = (N - m) % N, nn = (N - n) % N, j = (nn * N + mm) * 2;   // the texel of −k
    out[o] = h0[i]; out[o + 1] = h0[i + 1];
    out[o + 2] = h0[j]; out[o + 3] = -h0[j + 1];
  }
  return { data: out, variance };
}

/**
 * Significant wave height, peak wavelength and period of a sea state, and
 * the mean square slope of the simulated waves (down to 10 cm) next to Cox
 * and Munk's measured 0.003 + 0.00512·U.
 */
export function seaStats(sea: SeaState) {
  const F = sea.fetch * 1000;
  const { wp } = jonswapPeak(sea.wind, F);
  const kp = (wp * wp) / G, wMax = Math.sqrt((G * 2 * Math.PI) / 0.1);
  let m0 = 0, mss = 0;                                       // ∫ S dω and ∫ k²·S dω
  for (let w = 0.02; w < wMax; w += 0.005) {
    const k = (w * w) / G, S = jonswap(w, sea.wind, F, sea.gamma) * shortBoost(k, kp, sea.short) ** 2 * 0.005;
    m0 += S; mss += k * k * S;
  }
  return {
    hs: 4 * Math.sqrt(m0), lambdaP: (2 * Math.PI * G) / (wp * wp), tp: (2 * Math.PI) / wp, wp,
    mss, mssCoxMunk: 0.003 + 0.00512 * sea.wind,
  };
}
