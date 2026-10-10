// ── Live formulas of "Post-Processing" ────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r, vec } from "./fmt";

type V = Record<string, number>;

const LUMA = [0.2126, 0.7152, 0.0722];
const luma = (c: number[]) => c[0] * LUMA[0] + c[1] * LUMA[1] + c[2] * LUMA[2];

/** Rec. 709 luminance of one colour, next to the plain average a naive greyscale would use. */
export const lumaNumbers = (t: TrackTranslations) => ({ R, G, B }: V) => {
  const Y = luma([R, G, B]), avg = (R + G + B) / 3;
  return {
    tex: r`\begin{aligned} &Y = 0.2126 \cdot \red{${num(R)}} + 0.7152 \cdot \green{${num(G)}} + 0.0722 \cdot \blue{${num(B)}} = \amber{${num(Y, 3)}} \\[4pt] &\text{${tx(t, "oglPost_liveAvg", "plain average")}}: (${num(R)} + ${num(G)} + ${num(B)})/3 = ${num(avg, 3)} \end{aligned}`,
    meter: Y,
    meterLabel: tx(t, "oglPost_liveMeterY", "grey level Y"),
  };
};

/** The grading chain on one fixed colour: exposure, then saturation around its luma, then contrast around 0.5. */
export const GRADE_C = [0.8, 0.5, 0.2];
export const gradeNumbers = ({ e, s, k }: V) => {
  const c1 = GRADE_C.map(x => x * e), Y = luma(c1);
  const c2 = c1.map(x => Y + s * (x - Y)), c3 = c2.map(x => k * (x - 0.5) + 0.5);
  return {
    tex: r`\begin{aligned} &c' = ${num(e)} \cdot ${vec(GRADE_C)} = ${vec(c1)} \\[4pt] &Y = ${num(Y, 3)} \\[4pt] &c'' = ${num(Y, 3)} + ${num(s)}\,(c' - ${num(Y, 3)}) = ${vec(c2)} \\[4pt] &c''' = ${num(k)}\,(c'' - 0.5) + 0.5 = \amber{${vec(c3)}} \end{aligned}`,
  };
};

/** Cost of a Gaussian blur of a given σ: one 2D pass against two 1D passes, with and without the linear-filtering trick. */
export const gaussCostNumbers = (t: TrackTranslations) => ({ sigma }: V) => {
  const rad = Math.ceil(3 * sigma), w = 2 * rad + 1;
  const full = w * w, sep = 2 * w, lin = 2 * (rad + 1), px = 1920 * 1080;
  return {
    tex: r`\begin{aligned} &r = \lceil 3 \cdot ${num(sigma, 1)} \rceil = ${rad}, \quad 2r + 1 = ${w} \\[4pt] &\text{2D}: ${w}^2 = ${full} \qquad \text{${tx(t, "oglPost_liveSep", "two passes")}}: 2 \cdot ${w} = \amber{${sep}} \\[4pt] &\text{${tx(t, "oglPost_liveLin", "with linear filtering")}}: 2\,(r + 1) = ${lin} \\[4pt] &\text{1080p}: ${big(px * full / 1e6)}\text{M} \to ${num(px * sep / 1e6, 1)}\text{M}\ \text{${tx(t, "oglPost_liveReads", "reads")}} \end{aligned}`,
    meter: sep / full,
    meterLabel: tx(t, "oglPost_liveMeterSep", "two passes, as a share of the 2D cost"),
  };
};

/** Vignette factor at distance d from the centre, with the fade between r₀ = 0.3 and r₁ = 0.8. */
export const VIG_R0 = 0.3, VIG_R1 = 0.8;
export const vignetteNumbers = (t: TrackTranslations) => ({ d, v }: V) => {
  const x = Math.min(1, Math.max(0, (d - VIG_R0) / (VIG_R1 - VIG_R0))), sm = x * x * (3 - 2 * x), f = 1 - v * sm;
  return {
    tex: r`\begin{aligned} &x = \operatorname{clamp}\!\Big(\frac{${num(d)} - ${VIG_R0}}{${VIG_R1} - ${VIG_R0}}\Big) = ${num(x, 3)} \\[4pt] &\operatorname{smoothstep} = x^2(3 - 2x) = ${num(sm, 3)} \\[4pt] &c \mathrel{*}= 1 - ${num(v)} \cdot ${num(sm, 3)} = \amber{${num(f, 3)}} \end{aligned}`,
    meter: f,
    meterLabel: tx(t, "oglPost_liveMeterVig", "brightness kept"),
  };
};
