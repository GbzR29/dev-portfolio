// ── Live formulas of "Matrices for 3D" ────────────────────────────────────────

import { fac, num, r, signed } from "./fmt";

type V = Record<string, number>;

/** (x, y) turned by θ around z, row by row, with the length before and after. */
export function rotateNumbers({ th, x, y }: V) {
  const a = (th * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const nx = c * x - s * y, ny = s * x + c * y;
  return {
    tex: r`\begin{aligned} &\cos ${th}^\circ = ${num(c, 3)} \qquad \sin ${th}^\circ = ${num(s, 3)} \\[4pt] &x' = ${num(c, 3)} \cdot ${fac(x)} - ${fac(s, 3)} \cdot ${fac(y)} = \green{${num(nx)}} \\[4pt] &y' = ${num(s, 3)} \cdot ${fac(x)} + ${fac(c, 3)} \cdot ${fac(y)} = \green{${num(ny)}} \\[4pt] &\sqrt{${fac(x)}^2 + ${fac(y)}^2} = ${num(Math.hypot(x, y), 3)} = \sqrt{${fac(nx)}^2 + ${fac(ny)}^2} \end{aligned}`,
  };
}

/** T = translate(tx, 0, tz) on (1, 2, 3, w). */
export function translateNumbers({ tx, tz, w }: V) {
  const out = [1 + tx * w, 2, 3 + tz * w];
  const tw = w ? r`\purple{1}` : r`\red{0}`;
  return {
    tex: r`\begin{pmatrix} 1 ${signed(tx)} \cdot ${tw} \\ 2 + 0 \cdot ${tw} \\ 3 ${signed(tz)} \cdot ${tw} \\ ${tw} \end{pmatrix} = \green{\begin{pmatrix} ${out.map(v => num(v)).join(r` \\ `)} \\ ${w} \end{pmatrix}}`,
  };
}
