// ── Live formulas of "Stencil Testing" ────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { r } from "./fmt";

type V = Record<string, number>;

export const STENCIL_FUNCS = ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"];
export const STENCIL_MASKS = [0xff, 0x0f, 0x01];

const OP_TEX = [r`\text{never}`, "<", r`\le`, ">", r`\ge`, "=", r`\ne`, r`\text{always}`];

/** An 8-bit value as two groups of four binary digits. */
const bin = (v: number) => { const s = v.toString(2).padStart(8, "0"); return r`\mathtt{${s.slice(0, 4)}\,${s.slice(4)}}`; };

/** glStencilFunc for one pixel: both sides masked, then compared with ref on the left. */
export const stencilTestNumbers = (t: TrackTranslations) => ({ ref, s, m, op }: V) => {
  const mask = STENCIL_MASKS[m], a = ref & mask, b = s & mask;
  const pass = [false, a < b, a <= b, a > b, a >= b, a === b, a !== b, true][op];
  const verdict = pass ? tx(t, "oglSten_livePass", "pass: the fragment goes on to the depth test")
                       : tx(t, "oglSten_liveFail", "fail: the fragment is discarded");
  const cmp = op === 0 || op === 7 ? OP_TEX[op] : r`${a} \;${OP_TEX[op]}\; ${b}`;   // NEVER / ALWAYS ignore both sides
  return {
    tex: r`\begin{aligned} &\text{ref}: && ${bin(ref)} \;\&\; ${bin(mask)} = ${bin(a)} = ${a} \\[2pt] &s: && ${bin(s)} \;\&\; ${bin(mask)} = ${bin(b)} = ${b} \\[4pt] & && ${cmp} \;\Rightarrow \\[2pt] & && \amber{\text{${verdict}}} \end{aligned}`,
  };
};
