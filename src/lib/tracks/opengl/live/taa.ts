// ── Live formulas of "Temporal AA & Upscaling" ────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r, sci } from "./fmt";

type V = Record<string, number>;

/** Radical inverse of i in base b: the digits of i mirrored after the point. */
function halton(i: number, b: number) {
  let f = 1, h = 0;
  for (let n = i; n > 0; n = Math.floor(n / b)) { f /= b; h += f * (n % b); }
  return h;
}

/** Frame i's jitter: i in bases 2 and 3, mirrored, and the offset in pixels and in NDC at 1920 × 1080. */
export const haltonNumbers = ({ i }: V) => {
  const d2 = i.toString(2), d3 = i.toString(3), h2 = halton(i, 2), h3 = halton(i, 3);
  const jx = h2 - 0.5, jy = h3 - 0.5;
  const mirror = (d: string) => [...d].reverse().join("");
  return {
    tex: r`\begin{aligned} &${i} = {${d2}}_2 \;\to\; H_2 = {0.${mirror(d2)}}_2 = ${num(h2, 4)} \\[4pt] &${i} = {${d3}}_3 \;\to\; H_3 = {0.${mirror(d3)}}_3 = ${num(h3, 4)} \\[4pt] &(j_x, j_y) = \amber{(${num(jx, 3)},\ ${num(jy, 3)})}\ \text{px} \\[4pt] &\tfrac{2 j_x}{1920} = ${sci((2 * jx) / 1920)}, \quad \tfrac{2 j_y}{1080} = ${sci((2 * jy) / 1080)} \end{aligned}`,
  };
};

/** The exponential average for one α: effective frame count, and how long an old frame takes to fade. */
export const emaNumbers = (t: TrackTranslations) => ({ alpha }: V) => {
  const neff = 2 / alpha - 1, w10 = alpha * (1 - alpha) ** 10, k = Math.log(0.01) / Math.log(1 - alpha);
  return {
    tex: r`\begin{aligned} &N_{\text{eff}} \approx \frac{2}{${num(alpha, 2)}} - 1 = \amber{${num(neff, 1)}} \\[4pt] &\text{${tx(t, "oglTaa_liveW10", "weight of the frame 10 back")}}: ${num(alpha, 2)} \cdot ${num(1 - alpha, 2)}^{10} = ${num(w10, 4)} \\[4pt] &\text{${tx(t, "oglTaa_liveFade", "below a hundredth of its first weight after")}} \\[4pt] &\quad \frac{\ln 0.01}{\ln ${num(1 - alpha, 2)}} = ${num(k, 1)}\ \text{${tx(t, "oglTaa_liveFrames", "frames")}} = ${num((k / 60) * 1000, 0)}\ \text{ms} \end{aligned}`,
    meter: Math.min(1, neff / 40),
    meterLabel: tx(t, "oglTaa_liveMeterN", "frames blended, out of 40"),
  };
};

/** Variance clipping of one channel: a stale history value pulled into μ ± γσ, then blended with α = 0.1. */
export const clipNumbers = (t: TrackTranslations) => ({ h, mu, sigma, gamma }: V) => {
  const lo = mu - gamma * sigma, hi = mu + gamma * sigma, hc = Math.min(hi, Math.max(lo, h));
  const out = 0.9 * hc + 0.1 * mu, raw = 0.9 * h + 0.1 * mu;
  return {
    tex: r`\begin{aligned} &[\mu - \gamma\sigma,\ \mu + \gamma\sigma] = [${num(lo, 3)},\ ${num(hi, 3)}] \\[4pt] &h' = \operatorname{clamp}(${num(h)},\ ${num(lo, 3)},\ ${num(hi, 3)}) = ${num(hc, 3)} \\[4pt] &0.9 \cdot ${num(hc, 3)} + 0.1 \cdot ${num(mu)} = \amber{${num(out, 3)}} \\[4pt] &\text{${tx(t, "oglTaa_liveNoClip", "without clipping")}}: 0.9 \cdot ${num(h)} + 0.1 \cdot ${num(mu)} = ${num(raw, 3)} \end{aligned}`,
    meter: Math.min(1, Math.abs(raw - mu) / 1),
    meterLabel: tx(t, "oglTaa_liveMeterGhost", "ghost left without clipping"),
  };
};

/** A temporal upscaler at scale s per axis, 4K output: pixels rendered and samples gathered per output pixel. */
export const upscaleNumbers = (t: TrackTranslations) => ({ s, n }: V) => {
  const W = 3840, H = 2160, w = Math.round(W / s), hh = Math.round(H / s), per = 1 / (s * s);
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglTaa_liveRender", "render")}}: \frac{${W}}{${num(s, 2)}} \times \frac{${H}}{${num(s, 2)}} = ${w} \times ${hh} = ${big(w * hh)}\ \text{px} \\[4pt] &\text{${tx(t, "oglTaa_livePerFrame", "per output pixel per frame")}}: \frac{1}{${num(s, 2)}^2} = ${num(per, 3)} \\[4pt] &\text{${tx(t, "oglTaa_liveAfter", "after")}}\ ${n}\ \text{${tx(t, "oglTaa_liveFrames", "frames")}}: ${n} \cdot ${num(per, 3)} = \amber{${num(n * per, 2)}}\ \text{${tx(t, "oglTaa_liveSamples", "samples")}} \end{aligned}`,
    meter: Math.min(1, (n * per) / 8),
    meterLabel: tx(t, "oglTaa_liveMeterUp", "samples per output pixel, out of 8"),
  };
};
