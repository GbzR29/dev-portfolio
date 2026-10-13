// Live numbers for chapters/meter.tsx: the LiveFormula compute functions.
// Factories `(t) => (v) => …` when the TeX holds words to translate.

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { groupings } from "@/components/lesson/figures/music/OddMeterFigure";

const r = String.raw;

/** A number with only the digits it needs: 3, 0.75, 0.375. */
const num = (x: number) => String(Number(x.toFixed(4)));

// ── A time signature at a tempo → bar length, beats, seconds ─────────────────

export const barNumbers = (t?: TrackTranslations) => (v: Record<string, number>) => {
  const N = v.N, d = 2 ** v.k, compound = N % 3 === 0 && N >= 6, beats = compound ? N / 3 : N, s = (beats * 60) / v.bpm;
  const value = (u: number) => tx(t, `musMet_lvV${u}`, ({ 1: "whole note", 2: "half note", 4: "quarter note", 8: "eighth note", 16: "sixteenth note" } as Record<number, string>)[u]);
  const dotted = (u: number) => tx(t, `musMet_lvD${u}`, ({ 1: "dotted whole note", 2: "dotted half note", 4: "dotted quarter note", 8: "dotted eighth note" } as Record<number, string>)[u]);
  const kind = [tx(t, "musMet_lvSimple", "simple"), tx(t, "musMet_lvCompound", "compound")][compound ? 1 : 0];
  const size = beats === 2 ? tx(t, "musMet_lvDuple", "duple") : beats === 3 ? tx(t, "musMet_lvTriple", "triple") : beats === 4 ? tx(t, "musMet_lvQuad", "quadruple") : tx(t, "musMet_lvOther", "irregular");
  const B = tx(t, "musMet_lvBeats", "beats"), OF = tx(t, "musMet_lvOfWhole", "of a whole note");
  const beatLine = compound
    ? r`\frac{${N}}{3} = \amber{${beats}\ \text{${B}}},\ \text{${dotted(d / 2)}}`
    : r`\amber{${N}\ \text{${B}}},\ \text{${value(d)}}`;
  return {
    tex: r`\begin{gathered} \frac{${N}}{${d}} = ${num(N / d)}\ \text{${OF}} \qquad \text{${tx(t, "musMet_lvKind", "{kind} {size}").replace("{kind}", kind).replace("{size}", size)}} \\ ${beatLine} \\ t_{\text{bar}} = ${beats} \times \frac{60}{${v.bpm}} = \green{${s.toFixed(2)}\ \text{s}} \end{gathered}`,
  };
};

// ── Ways to cut a bar of n eighths into 2s and 3s ────────────────────────────

export function countNumbers(v: Record<string, number>) {
  const n = v.n, c = [1, 0];
  for (let k = 2; k <= n; k++) c[k] = c[k - 2] + (k >= 3 ? c[k - 3] : 0);
  const list = n <= 9 ? groupings(n).map(g => r`\text{${g.join("+")}}`) : [];
  const seq = c.slice(2, n + 1).join(r`,\ `);
  const rec = n >= 3 ? r`c(${n}) = c(${n - 2}) + c(${n - 3}) = ${c[n - 2]} + ${c[n - 3]} = \amber{${c[n]}}` : r`c(${n}) = \amber{${c[n]}}`;
  return {
    tex: r`\begin{gathered} ${rec} \\ c(2 \dots ${n}) = ${seq} ${list.length ? r`\\ ${list.join(r`\quad `)}` : ""} \end{gathered}`,
  };
}
