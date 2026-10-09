// ── Live formulas of "Depth Testing" ──────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

const STEPS = 2 ** 24, GAP = 0.0005;

/** "a × 10^b" for TeX when v is tiny, plain digits otherwise. */
function sci(v: number, digits = 3) {
  if (v === 0 || Math.abs(v) >= 0.01) return num(v, digits + 1);
  const e = Math.floor(Math.log10(Math.abs(v))), m = v / 10 ** e;
  return `${num(m, 2)} \\times 10^{${e}}`;
}

/** Distance d with near n and far f: z_ndc and the stored depth. */
export function depthNumbers({ d, n, f }: V) {
  const a = (f + n) / (f - n), b = (2 * f * n) / ((f - n) * d), z = a - b, buf = (z + 1) / 2;
  return {
    tex: r`\begin{aligned} &z_{\text{ndc}} = \frac{${num(f)} + ${num(n)}}{${num(f)} - ${num(n)}} - \frac{2 \cdot ${num(f)} \cdot ${num(n)}}{(${num(f)} - ${num(n)}) \cdot ${num(d)}} = ${num(a, 4)} - ${num(b, 4)} = ${num(z, 4)} \\[4pt] &z_{\text{buffer}} = \frac{${num(z, 4)} + 1}{2} = \green{${num(buf, 4)}} \end{aligned}`,
    meter: buf,
    meterLabel: `z_buffer = ${num(buf, 4)}`,
  };
}

/** Depth resolution at distance d for near plane 10^e, against the 0.0005 gap of step 3. */
export const resolutionNumbers = (t: TrackTranslations) => ({ d, e }: V) => {
  const n = 10 ** e, dd = (d * d) / (n * STEPS), steps = GAP / dd;
  const verdict = steps >= 2 ? tx(t, "oglDepth_liveClean", "clean") : tx(t, "oglDepth_liveFlicker", "flickers");
  return {
    tex: r`\begin{aligned} &\Delta d \approx \frac{${num(d)}^2}{${num(n, 3)} \cdot 16\,777\,216} = \amber{${sci(dd)}} \\[4pt] &\frac{0.0005}{\Delta d} = \green{${steps >= 100 ? Math.round(steps) : num(steps, 2)}}\ \text{${tx(t, "oglDepth_liveSteps", "steps between the two faces")}} \end{aligned}`,
    meter: Math.min(1, Math.log10(1 + steps) / 2),
    meterLabel: `${num(steps, 1)} · ${verdict}`,
  };
};
