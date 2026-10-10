// ── Live formulas of "Uniform Buffer Objects" ─────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r } from "./fmt";

type V = Record<string, number>;

export const UBO_ALIGNS = [4, 8, 16];
export const UBO_OFFSET_ALIGNS = [16, 64, 256];

/** std140: where a member of alignment a starts when the previous one ends at o_end. */
export const nextOffsetNumbers = (t: TrackTranslations) => ({ end, ai }: V) => {
  const a = UBO_ALIGNS[ai], q = Math.ceil(end / a), next = q * a;
  return {
    tex: r`\begin{aligned} o_{\text{next}} &= \Big\lceil \frac{${end}}{${a}} \Big\rceil \cdot ${a} = ${q} \cdot ${a} = \amber{${next}} \\[4pt] &\text{${tx(t, "oglUbo_livePad", "padding")}}: ${next} - ${end} = ${next - end}\ \text{B} \end{aligned}`,
  };
};

/** Per-object slices of one big UBO: stride rounded up to GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT. */
export const strideNumbers = (t: TrackTranslations) => ({ s, ai, n }: V) => {
  const A = UBO_OFFSET_ALIGNS[ai], q = Math.ceil(s / A), stride = q * A, total = stride * n;
  return {
    tex: r`\begin{aligned} \text{stride} &= \Big\lceil \frac{${s}}{${A}} \Big\rceil \cdot ${A} = \amber{${stride}}\ \text{B} \\[4pt] ${n} \cdot ${stride} &= ${big(total)}\ \text{B} = ${num(total / 1024, 1)}\ \text{KiB} \end{aligned}`,
    meter: s / stride,
    meterLabel: tx(t, "oglUbo_liveMeter", "share of the buffer that is data, not padding"),
  };
};
