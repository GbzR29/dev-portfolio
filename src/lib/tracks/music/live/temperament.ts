// Live numbers for chapters/temperament.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { PURE_FIFTH, PURE_THIRD } from "@/components/lesson/figures/music/tuning";

const r = String.raw;
const L32 = Math.log2(3 / 2), L54 = Math.log2(5 / 4);
const sgn = (x: number, d = 2) => `${x >= 0 ? "+" : "-"}${Math.abs(x).toFixed(d)}`;

// ── n fifths against the nearest number of octaves ───────────────────────────

export const fifthsNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const n = v.n, oct = n * L32, m = Math.round(oct), gap = 1200 * (oct - m);
  const good = Math.abs(gap) < 25;
  return {
    tex: r`\begin{gathered} ${n} \times 0.58496 = ${oct.toFixed(4)}\ \text{${tx(t, "musTem_lvOct", "octaves")}} \;\approx\; ${m} \\ 1200 \times (${oct.toFixed(4)} - ${m}) = ${good ? r`\green` : r`\amber`}{${sgn(gap)}\ \text{cents}} \end{gathered}`,
  };
};

// ── N equal steps per octave: the best fifth and third ───────────────────────

export const edoNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const N = v.N, k5 = Math.round(N * L32), k3 = Math.round(N * L54);
  const c5 = (1200 * k5) / N, c3 = (1200 * k3) / N, e5 = c5 - PURE_FIFTH, e3 = c3 - PURE_THIRD;
  const col = (e: number) => (Math.abs(e) < 5 ? r`\green` : Math.abs(e) < 15 ? r`\amber` : r`\red`);
  return {
    tex: r`\begin{gathered} \text{${tx(t, "musTem_lvStep", "step")}} = \tfrac{1200}{${N}} = ${(1200 / N).toFixed(2)}\ \text{cents} \\ \text{${tx(t, "musTem_lvFifth", "fifth")}:}\ k = \operatorname{round}(${N} \times 0.58496) = ${k5} \\ ${k5} \times ${(1200 / N).toFixed(2)} = ${c5.toFixed(2)}\ \text{cents}\ \ ${col(e5)}{(${sgn(e5)})} \\[4pt] \text{${tx(t, "musTem_lvThird", "major third")}:}\ k = \operatorname{round}(${N} \times 0.32193) = ${k3} \\ ${k3} \times ${(1200 / N).toFixed(2)} = ${c3.toFixed(2)}\ \text{cents}\ \ ${col(e3)}{(${sgn(e3)})} \end{gathered}`,
  };
};

// ── Where fret n goes ─────────────────────────────────────────────────────────

export const fretNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const L = v.L, n = v.n, d = L * (1 - 2 ** (-n / 12)), prev = L * (1 - 2 ** (-(n - 1) / 12));
  return {
    tex: r`\begin{gathered} d_{${n}} = ${L} \times (1 - 2^{-${n}/12}) = ${L} \times ${(1 - 2 ** (-n / 12)).toFixed(4)} = \amber{${d.toFixed(1)}\ \text{mm}} \\ \text{${tx(t, "musTem_lvGap", "gap from the fret before")}:}\ ${(d - prev).toFixed(1)}\ \text{mm} \end{gathered}`,
  };
};
