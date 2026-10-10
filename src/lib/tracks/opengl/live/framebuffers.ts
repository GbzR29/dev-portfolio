// ── Live formulas of "Framebuffers & Post-FX" ─────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, fac, num, r } from "./fmt";

type V = Record<string, number>;

export const FBO_RES = [[1280, 720], [1920, 1080], [2560, 1440], [3840, 2160]];
export const FBO_FORMATS = [["RGBA8", 4], ["RGBA16F", 8], ["RGBA32F", 16]] as const;
export const FBO_SCALES = [1, 2, 4];

/** Memory of one colour + D24S8 target at a resolution, format and downscale. */
export const fboMemoryNumbers = (t: TrackTranslations) => ({ res, fmt, sc }: V) => {
  const s = FBO_SCALES[sc], W = FBO_RES[res][0] / s, H = FBO_RES[res][1] / s, b = FBO_FORMATS[fmt][1];
  const px = W * H, mb = (px * (b + 4)) / 1e6, full = (FBO_RES[3][0] * FBO_RES[3][1] * (16 + 4)) / 1e6;
  return {
    tex: r`\begin{aligned} W \cdot H &= ${W} \cdot ${H} = ${big(px)}\ \text{${tx(t, "oglFbo_livePx", "pixels")}} \\[4pt] M &= ${big(px)} \cdot (${b} + 4)\ \text{B} = \amber{${num(mb, 1)}\ \text{MB}} \end{aligned}`,
    meter: mb / full,
    meterLabel: tx(t, "oglFbo_liveMeterMem", "share of the largest case (4K, RGBA32F, 166 MB)"),
  };
};

/** Centre and neighbour weights: sharpen, box blur, edge detection. */
export const KERNELS = [{ c: 9, n: -1 }, { c: 1 / 9, n: 1 / 9 }, { c: -8, n: 1 }];

/** A 3×3 kernel on a centre pixel c whose eight neighbours are all n. */
export const kernelNumbers = (t: TrackTranslations) => ({ k, c, n }: V) => {
  const K = KERNELS[k], out = K.c * c + 8 * K.n * n, sum = K.c + 8 * K.n;
  const w = (v: number) => (k === 1 ? r`\tfrac{1}{9}` : fac(v));
  const flat = Math.abs(sum) < 1e-9 ? tx(t, "oglFbo_liveSum0", "flat areas become 0") : tx(t, "oglFbo_liveSum1", "flat areas keep their value");
  return {
    tex: r`\begin{aligned} \text{out} &= ${w(K.c)} \cdot ${num(c)} + 8 \cdot ${w(K.n)} \cdot ${num(n)} = \amber{${num(out, 3)}} \\[4pt] \textstyle\sum k_{ij} &= ${w(K.c)} + 8 \cdot ${w(K.n)} = ${num(sum, 3)} \quad \text{(${flat})} \end{aligned}`,
  };
};
