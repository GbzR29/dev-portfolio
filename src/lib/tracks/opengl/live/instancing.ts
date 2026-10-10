// ── Live formulas of "Instancing" ─────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r } from "./fmt";

type V = Record<string, number>;

/** The asteroid ring: driver time of one draw per asteroid against the bytes of one instanced draw. */
export const asteroidNumbers = (t: TrackTranslations) => ({ N, us }: V) => {
  const ms = (N * us) / 1000, fps = 1000 / ms, bytes = N * 64, kib = bytes / 1024, mbs = (bytes * 60) / 1e6;
  return {
    tex: r`\begin{aligned} &t_{\text{CPU}} = ${big(N)} \cdot ${num(us, 1)}\ \mu\text{s} = ${num(ms, 1)}\ \text{ms} \;\Rightarrow\; f_{\max} = \frac{1000}{${num(ms, 1)}} = \amber{${num(fps, 1)}\ \text{fps}} \\[4pt] &B = ${big(N)} \cdot 64 = ${big(bytes)}\ \text{B} = ${num(kib, 1)}\ \text{KiB} \;\xrightarrow{\times 60}\; ${num(mbs, 1)}\ \text{MB/s} \end{aligned}`,
    meter: Math.min(1, ms / (1000 / 60)),
    meterLabel: tx(t, "oglInst_liveMeter", "share of a 60 fps frame (16.7 ms) spent submitting draws"),
  };
};
