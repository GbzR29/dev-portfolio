// ── Light around a Schwarzschild black hole ───────────────────────────────────
// Units: the Schwarzschild radius r_s = 2GM/c² is 1 and c is 1, so GM = 1/2.
// A photon's path obeys u'' + u = (3/2)·r_s·u² (u = 1/r, ' = d/dφ). Written as
// a central force, a = −(3/2)·h²·x/r⁵ with h = |x × v| conserved, it can be
// integrated in Cartesian coordinates; the shader does the same in 3D.

export const PHOTON_SPHERE = 1.5;
/** Critical impact parameter (3√3/2)·r_s: rays aimed closer than this fall in. */
export const B_CRIT = 1.5 * Math.sqrt(3);
/** Innermost stable circular orbit, where a thin disk ends. */
export const ISCO = 3;

export type Bending = "none" | "newton" | "einstein";

type V2 = [number, number];

function accel(x: V2, h2: number, mode: Bending): V2 {
  const r2 = x[0] * x[0] + x[1] * x[1], r = Math.sqrt(r2);
  if (mode === "none") return [0, 0];
  // Newton: a particle moving at c pulled by GM/r² (GM = 1/2)
  const k = mode === "newton" ? 0.5 / (r2 * r) : (1.5 * h2) / (r2 * r2 * r);
  return [-k * x[0], -k * x[1]];
}

export type Trace = {
  pts: V2[];
  fate: "captured" | "escaped" | "orbiting";
  /** Total deflection in radians (more than 2π for rays that loop). */
  deflection: number;
  rMin: number;
};

/**
 * Traces a ray in the orbital plane from x0 along the unit direction d0 with
 * RK4, the step growing with r. Stops at the horizon (r < 1), when it leaves
 * the circle of radius rFar, or after maxSteps.
 */
export function trace2D(x0: V2, d0: V2, mode: Bending, rFar = 14, maxSteps = 4000): Trace {
  let x: V2 = [...x0], v: V2 = [...d0];
  const h2 = (x[0] * v[1] - x[1] * v[0]) ** 2;
  const pts: V2[] = [[...x]];
  let rMin = Infinity, sweep = 0, ang = Math.atan2(x[1], x[0]);
  let fate: Trace["fate"] = "orbiting";
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.hypot(x[0], x[1]);
    rMin = Math.min(rMin, r);
    if (r < 1) { fate = "captured"; break; }
    if (r > rFar && x[0] * v[0] + x[1] * v[1] > 0) { fate = "escaped"; break; }
    const dt = Math.min(0.25, 0.03 * r);
    const k1v = accel(x, h2, mode), k1x = v;
    const k2v = accel([x[0] + 0.5 * dt * k1x[0], x[1] + 0.5 * dt * k1x[1]], h2, mode), k2x: V2 = [v[0] + 0.5 * dt * k1v[0], v[1] + 0.5 * dt * k1v[1]];
    const k3v = accel([x[0] + 0.5 * dt * k2x[0], x[1] + 0.5 * dt * k2x[1]], h2, mode), k3x: V2 = [v[0] + 0.5 * dt * k2v[0], v[1] + 0.5 * dt * k2v[1]];
    const k4v = accel([x[0] + dt * k3x[0], x[1] + dt * k3x[1]], h2, mode), k4x: V2 = [v[0] + dt * k3v[0], v[1] + dt * k3v[1]];
    x = [x[0] + (dt / 6) * (k1x[0] + 2 * k2x[0] + 2 * k3x[0] + k4x[0]), x[1] + (dt / 6) * (k1x[1] + 2 * k2x[1] + 2 * k3x[1] + k4x[1])];
    v = [v[0] + (dt / 6) * (k1v[0] + 2 * k2v[0] + 2 * k3v[0] + k4v[0]), v[1] + (dt / 6) * (k1v[1] + 2 * k2v[1] + 2 * k3v[1] + k4v[1])];
    const a = Math.atan2(x[1], x[0]);
    let da = a - ang;
    if (da > Math.PI) da -= 2 * Math.PI;
    if (da < -Math.PI) da += 2 * Math.PI;
    sweep += da; ang = a;
    pts.push([...x]);
  }
  // A straight line seen from the centre sweeps π; the rest is the deflection.
  // Both ends are at finite distance, so add the angle each end still has to
  // sweep on its way to infinity: the angle between its radius and its velocity.
  const endGap = (p: V2, d: V2) => Math.abs(Math.atan2(p[0] * d[1] - p[1] * d[0], p[0] * d[0] + p[1] * d[1]));
  const vn = Math.hypot(v[0], v[1]);
  const total = Math.abs(sweep) + (Math.PI - endGap(x0, d0)) + endGap(x, [v[0] / vn, v[1] / vn]);
  return { pts, fate, deflection: total - Math.PI, rMin };
}

/** Weak-field deflection, 2·r_s/b in general relativity (half that for Newton). */
export const weakDeflection = (b: number, mode: Bending) => (mode === "none" ? 0 : mode === "newton" ? 1 / b : 2 / b);

/** Angular radius (rad) of the shadow for a static observer at distance D. */
export function shadowRadius(D: number) {
  const s = (B_CRIT * Math.sqrt(Math.max(0, 1 - 1 / D))) / D;
  const a = Math.asin(Math.min(1, s));
  return D < PHOTON_SPHERE ? Math.PI - a : a;
}

/** Keplerian angular velocity Ω = √(GM/r³), in radians per r_s/c. */
export const omega = (r: number) => Math.sqrt(0.5 / (r * r * r));

/** Orbital speed at r measured by a static observer there, as a fraction of c. */
export const orbitSpeed = (r: number) => Math.sqrt(0.5 / (r - 1));

/**
 * Frequency ratio g = ν_seen / ν_emitted for gas orbiting at r, reaching a
 * distant observer with angular momentum ℓ about the disk's axis.
 */
export function redshift(r: number, ell: number, { doppler = true, gravity = true } = {}) {
  const grav = Math.sqrt(1 - 1 / r);
  const dop = Math.sqrt((1 - 1.5 / r) / (1 - 1 / r)) / (1 - omega(r) * ell);
  return (gravity ? grav : 1) * (doppler ? dop : 1);
}

/** ℓ of a photon leaving r tangentially (the most Doppler-shifted case). */
export const tangentialEll = (r: number) => r / Math.sqrt(1 - 1 / r);

/** Thin-disk temperature profile T(r)/T_peak, zero at r_in, peak at (49/36)·r_in. */
export function diskProfile(r: number, rIn: number) {
  const f = (x: number) => (x <= 1 ? 0 : Math.pow(x, -0.75) * Math.pow(1 - 1 / Math.sqrt(x), 0.25));
  return f(r / rIn) / f(49 / 36);
}
