// ── Live formulas of "Buffer Data: Update, Map, Copy" ────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, r } from "./fmt";

type V = Record<string, number>;

/** Position, normal, uv: bytes per element and offset inside one interleaved vertex. */
const SIZE = [12, 12, 8], OFFSET = [0, 12, 24];

/** The byte where attribute a of vertex i starts, in both layouts of a mesh with n vertices. */
export const addressNumbers = (t: TrackTranslations) => ({ i, a, n }: V) => {
  const inter = i * 32 + OFFSET[a];
  const blockTex = [r`0`, r`12 \cdot ${big(n)}`, r`24 \cdot ${big(n)}`][a], block = [0, 12 * n, 24 * n][a];
  const batched = block + i * SIZE[a];
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglBuf_liveInter", "interleaved")}}: && ${big(i)} \cdot 32 + ${OFFSET[a]} = \amber{${big(inter)}} \\[4pt] &\text{${tx(t, "oglBuf_liveBatched", "batched")}}: && ${blockTex} + ${big(i)} \cdot ${SIZE[a]} = \amber{${big(batched)}} \end{aligned}`,
  };
};
