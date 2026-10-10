// ── Live formulas of "Bloom" ──────────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

/** The bright pass with the chapter's threshold τ = 1 and knee k = 0.5. */
export const brightNumbers = (t: TrackTranslations) => ({ R, G, B }: V) => {
  const tau = 1, k = 0.5, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const s = Math.min(1, Math.max(0, (Y - tau) / k)), f = s * s * (3 - 2 * s);
  const tail = Y <= tau
    ? r`Y \le \tau \;\Rightarrow\; \text{${tx(t, "oglBloom_liveNone", "no bloom")}}`
    : Y >= tau + k
      ? r`Y \ge \tau + k \;\Rightarrow\; \text{${tx(t, "oglBloom_liveFull", "the whole colour blooms")}}`
      : r`s = \frac{${num(Y, 3)} - 1}{0.5} = ${num(s, 3)} \;\Rightarrow\; 3s^2 - 2s^3 = ${num(f, 3)}`;
  return {
    tex: r`\begin{aligned} &Y = 0.2126 \cdot ${num(R, 2)} + 0.7152 \cdot ${num(G, 2)} + 0.0722 \cdot ${num(B, 2)} = ${num(Y, 3)} \\[4pt] &${tail} \\[4pt] &\text{bright} = ${num(f, 3)} \cdot (${num(R, 2)},\ ${num(G, 2)},\ ${num(B, 2)}) = \amber{(${num(f * R, 2)},\ ${num(f * G, 2)},\ ${num(f * B, 2)})} \end{aligned}`,
    meter: f,
    meterLabel: tx(t, "oglBloom_liveMeter", "share of the colour that blooms"),
  };
};

/** n repeats of a blur of width σ, at a resolution scale of 1/d, measured in full-resolution pixels. */
export const repeatNumbers = (t: TrackTranslations) => ({ sigma, n, d }: V) => {
  const total = sigma * Math.sqrt(n);
  return {
    tex: r`\begin{aligned} &\sigma_{\text{total}} = ${num(sigma, 2)} \cdot \sqrt{${n}} = ${num(sigma, 2)} \cdot ${num(Math.sqrt(n), 3)} = ${num(total, 2)}\ \text{px} \\[4pt] &\text{${tx(t, "oglBloom_liveFullRes", "in full-resolution pixels")}}: ${num(total, 2)} \cdot ${d} = \amber{${num(total * d, 1)}\ \text{px}} \\[4pt] &\text{${tx(t, "oglBloom_liveFetches", "fetches per pixel")}}: ${n} \cdot 2 \cdot 5 = ${n * 10} \end{aligned}`,
  };
};
