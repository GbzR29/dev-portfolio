// ── Quaternions and dual quaternions for the skinning figures ─────────────────
// Quaternions are [x, y, z, w] (w = scalar part), the same layout GLSL and GLM use.

export type Quat = [number, number, number, number];
export type V3 = [number, number, number];

export const qAxis = (axis: V3, angle: number): Quat => {
  const s = Math.sin(angle / 2), l = Math.hypot(...axis) || 1;
  return [(axis[0] / l) * s, (axis[1] / l) * s, (axis[2] / l) * s, Math.cos(angle / 2)];
};

/** Hamilton product a ⊗ b. */
export const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

/** Rotates v by the unit quaternion q: v + 2 q.xyz × (q.xyz × v + w v). */
export function qRotate(q: Quat, v: V3): V3 {
  const [x, y, z, w] = q;
  const cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2];
  return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)];
}

/** Spherical linear interpolation, taking the short way round. */
export function slerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const bb: Quat = d < 0 ? [-b[0], -b[1], -b[2], -b[3]] : [...b];
  d = Math.abs(d);
  if (d > 0.9995) {                                            // nearly equal: nlerp is exact enough
    const r = a.map((v, i) => v + (bb[i] - v) * t) as Quat, l = Math.hypot(...r);
    return r.map(v => v / l) as Quat;
  }
  const th = Math.acos(d), s = Math.sin(th);
  const ka = Math.sin((1 - t) * th) / s, kb = Math.sin(t * th) / s;
  return a.map((v, i) => v * ka + bb[i] * kb) as Quat;
}

/** A rigid transform x ↦ q·x + t as a unit dual quaternion (real, dual). */
export function toDual(q: Quat, t: V3): { real: Quat; dual: Quat } {
  const d = qMul([t[0], t[1], t[2], 0], q);                    // dual = ½ t ⊗ q
  return { real: q, dual: [d[0] / 2, d[1] / 2, d[2] / 2, d[3] / 2] };
}

/** Blends dual quaternions by weight (with hemisphere fixing) and applies the result to p. */
export function dqBlendApply(dqs: { real: Quat; dual: Quat }[], w: number[], p: V3): V3 {
  const r: Quat = [0, 0, 0, 0], d: Quat = [0, 0, 0, 0];
  const ref = dqs[0].real;
  dqs.forEach((q, i) => {
    const sign = q.real[0] * ref[0] + q.real[1] * ref[1] + q.real[2] * ref[2] + q.real[3] * ref[3] < 0 ? -1 : 1;
    for (let k = 0; k < 4; k++) { r[k] += w[i] * sign * q.real[k]; d[k] += w[i] * sign * q.dual[k]; }
  });
  const l = Math.hypot(...r);
  for (let k = 0; k < 4; k++) { r[k] /= l; d[k] /= l; }
  const rp = qRotate(r, p);
  // translation = 2 · dual ⊗ conj(real)
  const tq = qMul(d, [-r[0], -r[1], -r[2], r[3]]);
  return [rp[0] + 2 * tq[0], rp[1] + 2 * tq[1], rp[2] + 2 * tq[2]];
}
