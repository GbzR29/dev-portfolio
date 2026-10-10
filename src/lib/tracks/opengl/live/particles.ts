// ── Live formulas of "Particles" ──────────────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { big, num, r, sci } from "./fmt";

type V = Record<string, number>;

/** Four frames of the emission accumulator, and what rounding each frame would spawn instead. */
export const accumulatorNumbers = (t: TrackTranslations) => ({ R, fps }: V) => {
  const inc = R / fps, rows: string[] = [];
  let a = 0;
  for (let k = 1; k <= 4; k++) {
    const sum = a + inc, n = Math.floor(sum);
    rows.push(r`${k})\ \ & ${num(a, 3)} + ${num(inc, 3)} = ${num(sum, 3)} \quad n = \amber{${n}} \quad a = ${num(sum - n, 3)}`);
    a = sum - n;
  }
  const rounded = Math.round(inc) * fps;
  return {
    tex: r`\begin{aligned} ${rows.join(r` \\[2pt] `)} \\[6pt] \text{${tx(t, "oglPart_liveRound", "rounding instead")}}:\ & \operatorname{round}(${num(inc, 3)}) \cdot ${fps} = ${rounded} / \text{s} \end{aligned}`,
  };
};

/** Drag over one second: e^(−kΔt) per frame against a fixed 0.98 per frame. */
export const dragNumbers = (t: TrackTranslations) => ({ k, fps }: V) => {
  const f = Math.exp(-k / fps), fixed = Math.pow(0.98, fps);
  return {
    tex: r`\begin{aligned} &e^{-k\,\Delta t} = e^{-${num(k, 1)}/${fps}} = ${num(f, 4)} \\[4pt] &\text{${tx(t, "oglPart_liveAfter", "after 1 s")}}: \ ${num(f, 4)}^{${fps}} = e^{-${num(k, 1)}} = \amber{${num(Math.exp(-k), 3)}} \\[4pt] &0.98^{${fps}} = ${num(fixed, 3)} \end{aligned}`,
    meter: Math.exp(-k),
    meterLabel: tx(t, "oglPart_liveMeterDrag", "speed left after 1 s, at any frame rate"),
  };
};

/** A drop of diameter D mm: mass, cross-section and terminal velocity (water 1000 kg/m³, air 1.2, C_d 0.5). */
export const terminalNumbers = (t: TrackTranslations) => ({ D }: V) => {
  const rad = D / 2000, m = 1000 * (4 / 3) * Math.PI * rad ** 3, A = Math.PI * rad ** 2;
  const vt = Math.sqrt((2 * m * 9.81) / (1.2 * 0.5 * A));
  return {
    tex: r`\begin{aligned} m &= 1000 \cdot \tfrac43 \pi\,(${num(rad * 1000, 2)}\ \text{mm})^3 = ${sci(m)}\ \text{kg} \\[4pt] A &= \pi\,(${num(rad * 1000, 2)}\ \text{mm})^2 = ${sci(A)}\ \text{m}^2 \\[4pt] v_t &= \sqrt{\frac{2 \cdot ${sci(m)} \cdot 9.81}{1.2 \cdot 0.5 \cdot ${sci(A)}}} = \amber{${num(vt, 1)}\ \text{m/s}} \end{aligned}`,
    meter: Math.min(1, vt / 12),
    meterLabel: tx(t, "oglPart_liveMeterVt", "terminal velocity, out of 12 m/s"),
  };
};

/** How many drops are alive in the box around the camera. */
export const aliveNumbers = () => ({ rho, B, H, vt }: V) => {
  const N = (rho * (2 * B) ** 2 * H) / vt;
  return {
    tex: r`N_{alive} = ${rho} \cdot (2 \cdot ${B})^2 \cdot \frac{${H}}{${num(vt, 1)}} = ${big(rho * 4 * B * B)} \cdot ${num(H / vt, 3)}\ \text{s} = \amber{${big(N)}}`,
  };
};

/** A streak at speed v and distance d: its length, the width of one pixel there, and the alpha factor. 60° fov, 1080 px, 2 mm drop, 16 ms. */
export const streakNumbers = (t: TrackTranslations) => ({ v, d }: V) => {
  const L = v * 0.016, wmin = (2 * d * Math.tan(Math.PI / 6)) / 1080, f = 0.002 / Math.max(0.002, wmin);
  return {
    tex: r`\begin{aligned} L &= ${num(v, 1)} \cdot 0.016 = ${num(L * 100, 1)}\ \text{cm} \\[4pt] w_{min} &= \frac{2 \cdot ${d} \cdot \tan 30^\circ}{1080} = ${num(wmin * 1000, 2)}\ \text{mm} \\[4pt] \alpha' / \alpha &= \frac{2\ \text{mm}}{\max(2,\ ${num(wmin * 1000, 2)})\ \text{mm}} = \amber{${num(f, 3)}} \end{aligned}`,
    meter: f,
    meterLabel: tx(t, "oglPart_liveMeterStreak", "opacity kept by the widened streak"),
  };
};
