// ── Live formulas of "Order-Independent Transparency" ─────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r, sci } from "./fmt";

type V = Record<string, number>;

/** Whole numbers from 100 up, a few decimals below, a × 10^b when tiny. */
const g = (v: number) => (v >= 100 ? big(v) : sci(v));

/** McGuire and Bavoil's depth weight (their eq. 7) for one fragment. */
export const weightNumbers = (t: TrackTranslations) => ({ z, a }: V) => {
  const raw = 10 / (1e-5 + (z / 5) ** 2 + (z / 200) ** 6), c = Math.min(3e3, Math.max(1e-2, raw)), w = a * c;
  const clamp = raw !== c ? r`\;\to\; ${g(c)}\ (\text{${tx(t, "oglOit_liveClamp", "clamped")}})` : "";
  return {
    tex: r`\begin{aligned} &\frac{10}{10^{-5} + (${num(z, 1)}/5)^2 + (${num(z, 1)}/200)^6} = ${g(raw)}${clamp} \\[4pt] &w = ${num(a)} \cdot ${g(c)} = \amber{${g(w)}} \end{aligned}`,
    meter: Math.log10(c / 1e-2) / Math.log10(3e5),
    meterLabel: tx(t, "oglOit_liveMeter", "depth factor on a log scale, from 0.01 (far) to 3000 (near)"),
  };
};
