// Live numbers for chapters/timbre.tsx: the LiveFormula compute functions.

import { freqToMidi } from "@/components/lesson/kit/audio/notes";
import { texNote } from "./pitch";

const r = String.raw;

/** The nearest key to f, as TeX, with how many cents f is off it. */
function nearest(f: number) {
  const m = freqToMidi(f), k = Math.round(m), c = Math.round(100 * (m - k));
  return r`${texNote(k)}\ ${c > 0 ? "+" : ""}${c}\ \text{cents}`;
}

// ── Harmonic n of a fundamental ──────────────────────────────────────────────

export function harmonicNumbers(v: Record<string, number>) {
  const fn = v.n * v.f1;
  return {
    tex: r`f_{${v.n}} = ${v.n} \times ${v.f1} = \green{${fn}\ \text{Hz}} \quad \approx ${nearest(fn)}`,
  };
}

// ── A string's fundamental from its length, tension and weight ───────────────

export function stringNumbers(v: Record<string, number>) {
  const mu = v.mu / 1000;                                  // g/m → kg/m
  const speed = Math.sqrt(v.T / mu), f1 = speed / (2 * v.L);
  return {
    tex: r`\begin{gathered} v = \sqrt{\frac{${v.T}}{${mu.toFixed(5).replace(/0+$/, "")}}} = \amber{${speed.toFixed(1)}\ \text{m/s}} \\ f_1 = \frac{${speed.toFixed(1)}}{2 \times ${v.L.toFixed(3)}} = \green{${f1.toFixed(1)}\ \text{Hz}} \quad \approx ${nearest(f1)} \end{gathered}`,
  };
}
