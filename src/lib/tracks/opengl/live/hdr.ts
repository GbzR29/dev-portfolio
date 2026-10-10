// ── Live formulas of "HDR & Tone Mapping" ─────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { num, r } from "./fmt";

type V = Record<string, number>;

const reinhard = (x: number) => x / (1 + x);
const expo = (x: number) => 1 - Math.exp(-x);
const aces = (x: number) => Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
const byte = (c: number) => Math.round(Math.min(1, c) ** (1 / 2.2) * 255);

/** The worked example's orange pixel (4, 2, 0.5), multiplied by 2^EV, through the three operators. */
export const orangeNumbers = (t: TrackTranslations) => ({ ev }: V) => {
  const e = 2 ** ev, px = [4, 2, 0.5].map(c => c * e);
  const row = (name: string, f: (x: number) => number) => {
    const m = px.map(f);
    return r`&\text{${name}}: (${m.map(c => num(c, 3)).join(",\\ ")}), \ \tfrac{R}{B} = ${num(m[0] / m[2], 2)} \\[2pt] &\quad \to\ \text{bytes}\ (${m.map(byte).join(",\\ ")})`;
  };
  return {
    tex: r`\begin{aligned} &x = 2^{${ev}} \cdot (4,\ 2,\ 0.5) = (${px.map(c => num(c, 3)).join(",\\ ")}), \ \tfrac{R}{B} = 8 \\[4pt] ${row("Reinhard", reinhard)} \\[4pt] ${row(tx(t, "oglHdr_o2n", "exposure"), expo)} \\[4pt] ${row("ACES", aces)} \end{aligned}`,
  };
};

/**
 * Auto exposure on a simple scene: most pixels are a wall of luminance Y_w,
 * a share s of them is a bulb of luminance Y_b. Arithmetic against geometric mean.
 */
export const exposureNumbers = (t: TrackTranslations) => ({ wall, bulb, share }: V) => {
  const s = share / 100, eps = 1e-4;
  const arith = (1 - s) * wall + s * bulb;
  const geo = Math.exp((1 - s) * Math.log(wall + eps) + s * Math.log(bulb + eps));
  const eA = 0.18 / arith, eG = 0.18 / geo;
  return {
    tex: r`\begin{aligned} &\text{${tx(t, "oglHdr_liveArith", "plain average")}}: ${num(1 - s, 3)} \cdot ${num(wall, 2)} + ${num(s, 3)} \cdot ${bulb} = ${num(arith, 3)} \\[2pt] &\quad e = \tfrac{0.18}{${num(arith, 3)}} = ${num(eA, 3)} \;\Rightarrow\; \text{${tx(t, "oglHdr_liveWall", "wall")}}\ ${num(wall, 2)} \cdot ${num(eA, 3)} = \amber{${num(wall * eA, 3)}} \\[8pt] &\text{${tx(t, "oglHdr_liveGeo", "geometric")}}: e^{${num(1 - s, 3)} \ln ${num(wall, 2)} \,+\, ${num(s, 3)} \ln ${bulb}} = ${num(geo, 3)} \\[2pt] &\quad e = \tfrac{0.18}{${num(geo, 3)}} = ${num(eG, 3)} \;\Rightarrow\; \text{${tx(t, "oglHdr_liveWall", "wall")}}\ ${num(wall, 2)} \cdot ${num(eG, 3)} = \green{${num(wall * eG, 3)}} \end{aligned}`,
  };
};
