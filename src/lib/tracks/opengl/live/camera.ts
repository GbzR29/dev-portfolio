// ── Live formulas of "Camera & View Matrix" ───────────────────────────────────

import { fac, num, r, vec } from "./fmt";

type V = Record<string, number>;
type V3 = [number, number, number];

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(...a);
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

/** lookAt(eye = p, center = origin, up = (0, 1, 0)): the three axes and where the target lands. */
export function lookAtNumbers({ px, py, pz }: V) {
  const p: V3 = [px, py, pz], d = len(p);
  if (d < 1e-6) return { tex: r`\text{eye} = \text{center} \;\Rightarrow\; \mathbf f = \frac{(0,\ 0,\ 0)}{0} = \red{\text{NaN}}` };
  const f = scale(p, -1 / d), c = cross(f, [0, 1, 0]), cl = len(c);
  const fLine = r`\mathbf f = \text{normalize}(\mathbf 0 - ${vec(p)}) = \blue{${vec(f, 3)}}`;
  if (cl < 1e-6) {
    return { tex: r`\begin{aligned} &${fLine} \\[4pt] &\text{cross}(\mathbf f,\ \text{up}) = ${vec(c)} \;\Rightarrow\; \mathbf r = \frac{(0,\ 0,\ 0)}{0} = \red{\text{NaN}} \end{aligned}` };
  }
  const rr = scale(c, 1 / cl), u = cross(rr, f);
  const tv = [-dot(rr, p), -dot(u, p), dot(f, p)];
  return {
    tex: r`\begin{aligned} &${fLine} \\[4pt] &\mathbf r = \text{normalize}(\mathbf f \times \text{up}) = \red{${vec(rr, 3)}} \\[4pt] &\mathbf u = \mathbf r \times \mathbf f = \green{${vec(u, 3)}} \\[4pt] &\text{view} \cdot \text{center} = (-\mathbf r \cdot \mathbf p,\ -\mathbf u \cdot \mathbf p,\ \mathbf f \cdot \mathbf p) = \amber{${vec(tv, 3)}} \end{aligned}`,
  };
}

/** The direction d from yaw and pitch, and its length. */
export function directionNumbers({ yaw, pitch }: V) {
  const y = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180;
  const cp = Math.cos(p), d = [Math.cos(y) * cp, Math.sin(p), Math.sin(y) * cp];
  return {
    tex: r`\begin{aligned} &\amber{h} = \cos(${pitch}^\circ) = ${num(cp, 3)} \qquad \green{y} = \sin(${pitch}^\circ) = ${num(d[1], 3)} \\[4pt] &\red{x} = \cos(${yaw}^\circ) \cdot ${num(cp, 3)} = ${num(d[0], 3)} \qquad \blue{z} = \sin(${yaw}^\circ) \cdot ${num(cp, 3)} = ${num(d[2], 3)} \\[4pt] &|\mathbf d| = \sqrt{${fac(d[0], 3)}^2 + ${fac(d[1], 3)}^2 + ${fac(d[2], 3)}^2} = \green{${num(Math.hypot(d[0], d[1], d[2]), 3)}} \end{aligned}`,
  };
}
