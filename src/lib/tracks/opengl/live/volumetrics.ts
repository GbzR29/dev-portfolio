// ── Live formulas of "Atmosphere & Volumetrics" ───────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, sci } from "./fmt";

type V = Record<string, number>;

/** Beer–Lambert through a uniform fog. */
export const beerNumbers = (t: TrackTranslations) => ({ sigma, d }: V) => {
  const tau = sigma * d, T = Math.exp(-tau), vis = Math.log(20) / sigma;
  return {
    tex: r`\begin{aligned} &T = e^{-${num(sigma, 3)} \cdot ${num(d, 0)}} = e^{-${num(tau, 2)}} = \amber{${sci(T)}} \\[4pt] &T = 0.05 \;\Rightarrow\; d = \frac{\ln 20}{${num(sigma, 3)}} = ${num(vis, 0)}\ \text{m} \end{aligned}`,
    meter: T,
    meterLabel: tx(t, "oglVol_liveBeerMeter", "share of the surface's light that reaches the eye"),
  };
};

const BETA = [5.8e-6, 13.5e-6, 33.1e-6], HR = 8000;
const hex = (c: number[]) => "#" + c.map(x => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("");

/** Sunlight through the Rayleigh column above altitude h, along a path m times the vertical one. */
export const sunNumbers = (t: TrackTranslations) => ({ h, m }: V) => {
  const tau = BETA.map(b => b * HR * Math.exp(-(h * 1000) / HR) * m), T = tau.map(x => Math.exp(-x));
  const mx = Math.max(...T), sw = hex(T.map(x => x / mx));
  const trip = (v: number[], f: (x: number) => string) => `(${v.map(f).join(",\\ ")})`;
  return {
    tex: r`\begin{aligned} &\tau = \beta_R \cdot ${num(HR, 0)} \cdot e^{-${num(h, 1)}/8} \cdot ${num(m, 0)} = ${trip(tau, x => num(x, 3))} \\[4pt] &T = e^{-\tau} = \amber{${trip(T, x => sci(x, 2))}} \;\textcolor{${sw}}{\blacksquare\!\blacksquare} \end{aligned}`,
    meter: T[2] / T[0],
    meterLabel: tx(t, "oglVol_liveSunMeter", "blue that survives, relative to red"),
  };
};
