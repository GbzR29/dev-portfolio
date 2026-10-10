// ── Live formulas of "Terrain Rendering" ──────────────────────────────────────

import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;

const RAD = Math.PI / 180;
const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** Central differences on a grid with 4 m spacing, from the four neighbours' heights. */
export const normalNumbers = (t: TrackTranslations) => ({ hL, hR, hD, hU }: V) => {
  const s = 4, hx = (hR - hL) / (2 * s), hz = (hU - hD) / (2 * s), len = Math.hypot(hx, 1, hz);
  const n = [-hx / len, 1 / len, -hz / len], deg = Math.acos(n[1]) / RAD;
  return {
    tex: r`\begin{aligned} &\frac{\partial h}{\partial x} \approx \frac{${num(hR, 1)} - ${num(hL, 1)}}{8} = ${num(hx, 3)} \qquad \frac{\partial h}{\partial z} \approx \frac{${num(hU, 1)} - ${num(hD, 1)}}{8} = ${num(hz, 3)} \\[4pt] &\mathbf n = \frac{(${fac(-hx, 3)},\ 1,\ ${fac(-hz, 3)})}{${num(len, 3)}} = \amber{${vec(n, 3)}} \qquad ${num(deg, 1)}^\circ \end{aligned}`,
    meter: 1 - n[1],
    meterLabel: tx(t, "oglTerr_liveSlopeMeter", "slope = 1 − n_y (rock starts above 0.28)"),
  };
};

/** The figure's splat rules with the noise wobble set to 0. */
export const splatNumbers = (t: TrackTranslations) => ({ y, slope }: V) => {
  const sand = smooth(1.5, 0, y) * (1 - smooth(0.2, 0.4, slope)), rock = smooth(0.28, 0.45, slope);
  const snow = smooth(26, 30, y) * (1 - smooth(0.35, 0.55, slope)), grass = Math.max(1 - sand - rock - snow, 0);
  const sum = Math.max(sand + grass + rock + snow, 1e-4), w = [sand, grass, rock, snow].map(x => x / sum);
  const names = [tx(t, "oglTerr_liveSand", "sand"), tx(t, "oglTerr_liveGrass", "grass"), tx(t, "oglTerr_liveRock", "rock"), tx(t, "oglTerr_liveSnow", "snow")];
  const raw = [sand, grass, rock, snow].map((x, i) => r`\text{${names[i]}}\ ${num(x, 2)}`).join(r`,\ `);
  const out = w.map((x, i) => r`\text{${names[i]}}\ ${num(x, 2)}`).join(r`,\ `);
  return {
    tex: r`\begin{aligned} &w = ${raw} \qquad \textstyle\sum w = ${num(sum, 2)} \\[4pt] &w / \textstyle\sum w = \amber{${out}} \end{aligned}`,
  };
};

/** Triplanar weights for a normal tilted th degrees from up toward +x. */
export const triNumbers = (t: TrackTranslations) => ({ th, k }: V) => {
  const nx = Math.abs(Math.sin(th * RAD)), ny = Math.abs(Math.cos(th * RAD)), a = nx ** k, b = ny ** k, sum = a + b;
  return {
    tex: r`\begin{aligned} &\mathbf n = (${num(nx, 3)},\ ${num(ny, 3)},\ 0) \qquad |n_x|^{${num(k, 0)}} = ${num(a, 3)} \quad |n_y|^{${num(k, 0)}} = ${num(b, 3)} \\[4pt] &\text{${tx(t, "oglTerr_liveWeights", "weights")}}\ C_{yz} : C_{xz} : C_{xy} = \amber{${num(a / sum, 3)} : ${num(b / sum, 3)} : 0} \end{aligned}`,
    meter: a / sum,
    meterLabel: tx(t, "oglTerr_liveTriMeter", "share of the side projection C_yz"),
  };
};
