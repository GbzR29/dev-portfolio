// ── Live formulas of "Blending & Transparency" ───────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r, vec } from "./fmt";

type V = Record<string, number>;

export const BLEND_MODES = ["Alpha", "Additive", "Multiply", "Premultiplied"];

/** One colour channel through glBlendFunc in each mode of the table. An 8-bit target clamps to 1. */
export const blendNumbers = (t: TrackTranslations) => ({ mode, S, a, D }: V) => {
  const lines = [
    [r`${num(S)} \cdot ${num(a)} + ${num(D)} \cdot (1 - ${num(a)})`, S * a + D * (1 - a)],
    [r`${num(S)} \cdot ${num(a)} + ${num(D)} \cdot 1`, S * a + D],
    [r`${num(S)} \cdot ${num(D)} + ${num(D)} \cdot 0`, S * D],
    [r`(${num(S)} \cdot ${num(a)}) \cdot 1 + ${num(D)} \cdot (1 - ${num(a)})`, S * a + D * (1 - a)],
  ] as const;
  const [sum, raw] = lines[mode], out = Math.min(1, raw);
  const res = raw > 1 ? r`${num(raw, 3)} \;\to\; \text{${tx(t, "oglBlend_liveClamp", "clamped to")}}\ \amber{1}` : r`\amber{${num(out, 3)}}`;
  return {
    tex: r`\begin{aligned} C &= ${sum} \\[4pt] &= ${res} \end{aligned}`,
    meter: out,
    meterLabel: tx(t, "oglBlend_liveMeter", "value written to the framebuffer"),
  };
};

const hex = (c: number[]) => "#" + c.map(x => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0")).join("");
const over = (S: number[], a: number, D: number[]) => S.map((s, i) => s * a + D[i] * (1 - a));

/** A far red pane and a near blue pane over white, drawn in both orders. */
export const orderNumbers = (t: TrackTranslations) => ({ a1, a2 }: V) => {
  const W = [1, 1, 1], R = [1, 0, 0], B = [0, 0, 1];
  const right = over(B, a2, over(R, a1, W)), wrong = over(R, a1, over(B, a2, W));
  const sw = (c: number[]) => r`\;\textcolor{${hex(c)}}{\blacksquare\!\blacksquare}`;
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglBlend_liveRight", "far first (correct)")}}: && ${vec(right)}${sw(right)} \\[4pt] &\text{${tx(t, "oglBlend_liveWrong", "near first (wrong)")}}: && ${vec(wrong)}${sw(wrong)} \end{aligned}`,
  };
};
