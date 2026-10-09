// ── Live formulas of "Transformations + GLM" ──────────────────────────────────

import { fac, num, r } from "./fmt";

type V = Record<string, number>;

const N = 0.1, F = 100;

/** A view-space point (0, y, −d) through glm::perspective(fov, aspect, 0.1, 100) and the divide by w. */
export function perspectiveNumbers({ fov, y, d }: V) {
  const tn = Math.tan((fov * Math.PI) / 360), yc = y / tn;
  const A = -(F + N) / (F - N), B = (-2 * F * N) / (F - N), zc = A * -d + B;
  return {
    tex: r`\begin{aligned} &t = \tan\frac{${fov}^\circ}{2} = ${num(tn, 3)} \qquad y_{\text{clip}} = \frac{${num(y)}}{${num(tn, 3)}} = ${num(yc, 3)} \qquad w = -z = ${num(d)} \\[4pt] &z_{\text{clip}} = ${num(A, 4)} \cdot ${fac(-d)} ${B < 0 ? "-" : "+"} ${num(Math.abs(B), 4)} = ${num(zc, 3)} \\[4pt] &y_{\text{ndc}} = \frac{${num(yc, 3)}}{${num(d)}} = \green{${num(yc / d, 3)}} \qquad z_{\text{ndc}} = \frac{${num(zc, 3)}}{${num(d)}} = \amber{${num(zc / d, 4)}} \end{aligned}`,
    meter: (zc / d + 1) / 2,
    meterLabel: `z_ndc = ${num(zc / d, 4)}`,
  };
}
