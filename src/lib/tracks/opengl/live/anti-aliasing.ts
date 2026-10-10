// ── Live formulas of "Anti-Aliasing" ──────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r, vec } from "./fmt";

type V = Record<string, number>;

/** Stripes with a period of p pixels, sampled once per pixel: the frequency, the Nyquist limit and the alias that is seen. */
export const nyquistNumbers = (t: TrackTranslations) => ({ p }: V) => {
  const f = 1 / p, fa = Math.abs(f - Math.round(f)), seenAs = tx(t, "oglAa_liveSeen", "seen as stripes every");
  let verdict: string, seen: string;
  if (f < 0.5 - 1e-9) {
    verdict = r`f < 0.5 \;\Rightarrow\; \text{${tx(t, "oglAa_liveOk", "reproduced correctly")}}`;
    seen = r`\text{${seenAs}}\ \amber{${num(p, 2)}\ \text{px}}`;
  } else if (f < 0.5 + 1e-9) {
    verdict = r`f = 0.5 \;\Rightarrow\; \text{${tx(t, "oglAa_liveLimit", "on the limit")}}`;
    seen = r`\text{${tx(t, "oglAa_liveLimit2", "full stripes or flat grey, depending on where the samples land")}}`;
  } else {
    verdict = r`f > 0.5 \;\Rightarrow\; f_{alias} = \lvert ${num(f, 3)} - ${Math.round(f)} \rvert = ${num(fa, 3)}`;
    seen = fa < 1e-6
      ? r`\text{${tx(t, "oglAa_liveFlat", "every sample lands on the same phase: a flat colour")}}`
      : r`\text{${seenAs}}\ \amber{${num(1 / fa, 2)}\ \text{px}}`;
  }
  return {
    tex: r`\begin{aligned} &f = \frac{1}{${num(p, 2)}} = ${num(f, 3)}\ \text{${tx(t, "oglAa_liveCyc", "cycles per pixel")}}, \quad \tfrac{f_s}{2} = 0.5 \\[4pt] &${verdict} \\[4pt] &${seen} \end{aligned}`,
    meter: Math.min(1, f / 1.5),
    meterLabel: tx(t, "oglAa_liveMeterF", "frequency, up to 1.5 cycles per pixel"),
  };
};

/** The resolved colour of an orange-on-dark edge pixel when k of its N samples are covered. */
const ORANGE = [1, 0.55, 0.1], DARK = [0.05, 0.05, 0.08];
export const resolveNumbers = (t: TrackTranslations) => ({ e, k }: V) => {
  const N = 2 ** e, kk = Math.min(k, N), a = kk / N;
  const C = ORANGE.map((o, i) => a * o + (1 - a) * DARK[i]);
  return {
    tex: r`\begin{aligned} &N = ${N},\ \ ${kk}\ \text{${tx(t, "oglAa_liveCovered", "covered")}} \;\Rightarrow\; \frac{${kk}}{${N}} = ${num(a, 3)} \\[4pt] &C = ${num(a, 3)} \cdot ${vec(ORANGE)} + ${num(1 - a, 3)} \cdot ${vec(DARK)} \\[4pt] &\phantom{C} = \amber{${vec(C)}} \\[4pt] &\text{${tx(t, "oglAa_liveLevels", "possible edge shades")}}: N + 1 = ${N + 1} \end{aligned}`,
    meter: a,
    meterLabel: tx(t, "oglAa_liveMeterCov", "share of the pixel covered"),
  };
};

/** SSAA k×k against MSAA with the same N = k² samples, at a 16:9 resolution: shading work and framebuffer memory. */
export const costNumbers = (t: TrackTranslations) => ({ h, k }: V) => {
  const w = Math.round((h * 16) / 9), px = w * h, N = k * k, mb = (px * N * 8) / 2 ** 20;
  return {
    tex: r`\begin{aligned} &${w} \times ${h} = ${big(px)}\ \text{px}, \quad N = ${k}^2 = ${N} \\[4pt] &\text{SSAA}: ${big(px)} \cdot ${N} = \amber{${big(px * N)}}\ \text{${tx(t, "oglAa_liveShades", "shader runs")}} \\[4pt] &\text{MSAA}: \approx ${big(px)}\ \text{${tx(t, "oglAa_liveShades", "shader runs")}} \\[4pt] &\text{${tx(t, "oglAa_liveMem", "memory, both")}}: ${big(px)} \cdot ${N} \cdot 8\ \text{B} = ${num(mb, 0)}\ \text{MB} \end{aligned}`,
    meter: 1 / N,
    meterLabel: tx(t, "oglAa_liveMeterRatio", "MSAA shading, as a share of SSAA's"),
  };
};

/** FXAA's direction from the four diagonal lumas, and its edge test against τ = 0.125. */
export const FXAA_TAU = 0.125;
export const fxaaNumbers = (t: TrackTranslations) => ({ nw, ne, sw, se }: V) => {
  const dx = -((nw + ne) - (sw + se)), dy = (nw + sw) - (ne + se);
  const hi = Math.max(nw, ne, sw, se), lo = Math.min(nw, ne, sw, se), edge = hi - lo > FXAA_TAU;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const dir = Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9 ? "" : r`, \quad \operatorname{atan2}(d_y, d_x) = ${num(ang, 0)}^\circ`;
  return {
    tex: r`\begin{aligned} &\ell_{max} - \ell_{min} = ${num(hi)} - ${num(lo)} = ${num(hi - lo)} ${edge ? ">" : "\\le"} ${FXAA_TAU} \;\Rightarrow\; \text{${edge ? tx(t, "oglAa_liveEdge", "edge") : tx(t, "oglAa_liveNoEdge", "left alone")}} \\[4pt] &d_x = -\big[(${num(nw)} + ${num(ne)}) - (${num(sw)} + ${num(se)})\big] = \amber{${num(dx)}} \\[4pt] &d_y = (${num(nw)} + ${num(sw)}) - (${num(ne)} + ${num(se)}) = \amber{${num(dy)}}${dir} \end{aligned}`,
    meter: hi - lo,
    meterLabel: tx(t, "oglAa_liveMeterC", "local contrast"),
  };
};
