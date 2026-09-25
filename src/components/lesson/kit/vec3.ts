// ── 3D vectors for lesson figures ─────────────────────────────────────────────
// Plain [x, y, z] tuples, shared by the WebGL toolkit (gl.ts) and the SVG 3D
// renderer (scene3d.tsx). 2D helpers stay local to the figures that use them.

export type Vec3 = [number, number, number];

export const add   = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub   = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot   = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len   = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const norm  = (a: Vec3): Vec3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));

/** Rotation about +Y by r radians (right-handed). */
export const rotY = (p: Vec3, r: number): Vec3 => {
  const c = Math.cos(r), s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
/** Rotation about +X by r radians (right-handed). */
export const rotX = (p: Vec3, r: number): Vec3 => {
  const c = Math.cos(r), s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
