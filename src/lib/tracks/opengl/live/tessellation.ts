// ── Live formulas of "Tessellation" ───────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

export const SPACINGS = ["equal", "frac. even", "frac. odd"];

/** How a real-valued level f becomes segments under each spacing mode. */
export const spacingNumbers = (t: TrackTranslations) => ({ f, mode }: V) => {
  const lo = mode === 1 ? 2 : 1, F = Math.min(64, Math.max(lo, f));
  const n = mode === 0 ? Math.ceil(F) : mode === 1 ? 2 * Math.ceil(F / 2) : 2 * Math.ceil((F - 1) / 2) + 1;
  const nTex = [r`\lceil ${num(F)} \rceil`, r`2\lceil ${num(F)}/2 \rceil`, r`2\lceil (${num(F)} - 1)/2 \rceil + 1`][mode];
  const clamp = F !== f ? r`\ (${tx(t, "oglTess_liveClamped", "clamped from")}\ ${num(f)})` : "";
  let rest: string;
  if (mode === 0) rest = r`\text{${tx(t, "oglTess_liveAllEqual", "all equal")}}: \tfrac{1}{${n}} = \amber{${num(1 / n, 3)}}`;
  else if (n <= 2) rest = r`\text{${tx(t, "oglTess_liveAllEqual", "all equal")}}: \tfrac{1}{${n}} = \amber{${num(1 / n, 3)}}`;
  else {
    const L = 1 / F, S = (1 - (n - 2) * L) / 2;
    rest = r`${n - 2} \times \ell_{long} = ${n - 2} \times ${num(L, 3)}, \quad 2 \times \ell_{short} = 2 \times \amber{${num(S, 3)}}`;
  }
  return {
    tex: r`\begin{aligned} n &= ${nTex} = \amber{${n}}${clamp} \\[4pt] &${rest} \end{aligned}`,
  };
};

/** Screen-space level of one edge: its projected length in pixels over the target length. 1080 px, fov 60°. */
export const levelNumbers = (t: TrackTranslations) => ({ L, d, T }: V) => {
  const k = 1080 / (2 * Math.tan(Math.PI / 6)), px = (L / d) * k, lvl = Math.min(64, Math.max(1, px / T));
  return {
    tex: r`\begin{aligned} \text{px} &\approx \frac{${num(L, 1)}}{${num(d, 0)}} \cdot \frac{1080}{2 \tan 30^\circ} = \frac{${num(L, 1)}}{${num(d, 0)}} \cdot ${num(k, 1)} = ${num(px, 1)} \\[4pt] \text{level} &= \operatorname{clamp}\!\Big(\frac{${num(px, 1)}}{${T}},\ 1,\ 64\Big) = \amber{${num(lvl, 2)}} \end{aligned}`,
    meter: lvl / 64,
    meterLabel: tx(t, "oglTess_liveMeter", "level, out of the maximum 64"),
  };
};
