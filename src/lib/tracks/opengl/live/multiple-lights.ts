// ── Live formulas of "Multiple Lights" ────────────────────────────────────────

import { num, r } from "./fmt";
import { ATT_ROWS } from "./light-casters";

type V = Record<string, number>;

/** Radius past which a light adds less than 5/256 to any channel, for one row of the attenuation table. */
export function radiusNumbers({ row, imax }: V) {
  const [, l, q] = ATT_ROWS[row];
  const k = 1 - (256 / 5) * imax, disc = l * l - 4 * q * k, d = (-l + Math.sqrt(disc)) / (2 * q);
  return {
    tex: r`\begin{aligned} &c - \tfrac{256}{5} I_{\max} = 1 - 51.2 \cdot ${num(imax, 2)} = ${num(k, 2)} \\[4pt] &\sqrt{${num(l, 4)}^2 - 4 \cdot ${num(q, 6)} \cdot (${num(k, 2)})} = \sqrt{${num(disc, 3)}} = ${num(Math.sqrt(disc), 3)} \\[4pt] &d_{\max} = \frac{-${num(l, 4)} + ${num(Math.sqrt(disc), 3)}}{2 \cdot ${num(q, 6)}} = \amber{${num(d, 1)}} \end{aligned}`,
  };
}

/** Light evaluations per frame and per second at 1920 × 1080 and 60 fps. */
export function costNumbers({ n, over }: V) {
  const px = 1920 * 1080, frags = px * over, frame = frags * n, sec = frame * 60;
  const big = (x: number) => (x >= 1e9 ? r`${num(x / 1e9, 2)} \times 10^{9}` : r`${num(x / 1e6, 1)} \times 10^{6}`);
  return {
    tex: r`\begin{aligned} &N_{\text{fragments}} = 1920 \cdot 1080 \cdot ${num(over, 1)} = ${big(frags)} \\[4pt] &\text{cost} \approx ${n} \cdot ${big(frags)} = \amber{${big(frame)}} \\[4pt] &\times 60\ \text{fps} = ${big(sec)}\ /\ \text{s} \end{aligned}`,
  };
}
