// ── Integrators for the physics figures ───────────────────────────────────────
// Each method advances a state (position x, velocity v; both 2D) by one step h
// under an acceleration a(x) that depends only on position: a spring
// (a = −ω²x) or a planet's gravity (a = −GM·x/|x|³). The figures run them side
// by side against the exact answer.

export type V2 = [number, number];
export type State = { x: V2; v: V2 };
export type Accel = (x: V2) => V2;
export type Method = "euler" | "semi" | "verlet" | "rk4";

export const METHODS: Method[] = ["euler", "semi", "verlet", "rk4"];

const add = (a: V2, b: V2, s = 1): V2 => [a[0] + b[0] * s, a[1] + b[1] * s];

/** One step of the chosen method. */
export function step(m: Method, s: State, a: Accel, h: number): State {
  const { x, v } = s;
  switch (m) {
    case "euler":            // both updates use the values from the start of the step
      return { x: add(x, v, h), v: add(v, a(x), h) };
    case "semi": {           // velocity first, then position with the new velocity
      const v1 = add(v, a(x), h);
      return { x: add(x, v1, h), v: v1 };
    }
    case "verlet": {         // velocity Verlet: position with ½ah², velocity with the average acceleration
      const a0 = a(x);
      const x1 = add(add(x, v, h), a0, 0.5 * h * h);
      const a1 = a(x1);
      return { x: x1, v: add(v, add(a0, a1), 0.5 * h) };
    }
    case "rk4": {            // four slopes: start, two at the midpoint, end
      const k1x = v, k1v = a(x);
      const k2x = add(v, k1v, h / 2), k2v = a(add(x, k1x, h / 2));
      const k3x = add(v, k2v, h / 2), k3v = a(add(x, k2x, h / 2));
      const k4x = add(v, k3v, h), k4v = a(add(x, k3x, h));
      return {
        x: [x[0] + (h / 6) * (k1x[0] + 2 * k2x[0] + 2 * k3x[0] + k4x[0]), x[1] + (h / 6) * (k1x[1] + 2 * k2x[1] + 2 * k3x[1] + k4x[1])],
        v: [v[0] + (h / 6) * (k1v[0] + 2 * k2v[0] + 2 * k3v[0] + k4v[0]), v[1] + (h / 6) * (k1v[1] + 2 * k2v[1] + 2 * k3v[1] + k4v[1])],
      };
    }
  }
}

/** Runs n steps and returns every state, the starting one included. */
export function run(m: Method, s0: State, a: Accel, h: number, n: number): State[] {
  const out = [s0];
  let s = s0;
  for (let i = 0; i < n; i++) {
    s = step(m, s, a, h);
    // A blown-up run stops growing, so the plots stay readable
    if (!Number.isFinite(s.x[0]) || Math.abs(s.x[0]) + Math.abs(s.x[1]) > 1e6) break;
    out.push(s);
  }
  return out;
}

// ── Stability on the spring ───────────────────────────────────────────────────
// For a = −ω²x each method multiplies the state by a fixed 2×2 matrix per
// step. The size of that matrix's largest eigenvalue says what one step does
// to the amplitude: > 1 grows, < 1 damps, = 1 keeps it. s = ω·h.

export type StabMethod = Method | "implicit";

export function amplification(m: StabMethod, s: number): number {
  switch (m) {
    case "euler": return Math.sqrt(1 + s * s);
    case "implicit": return 1 / Math.sqrt(1 + s * s);
    case "semi":
    case "verlet": {
      // Both have det = 1 and trace 2 − s²: on the unit circle while s ≤ 2
      const tr = 2 - s * s;
      if (Math.abs(tr) <= 2) return 1;
      return (Math.abs(tr) + Math.sqrt(tr * tr - 4)) / 2;
    }
    case "rk4": {
      // R(z) = 1 + z + z²/2 + z³/6 + z⁴/24 at z = i·s
      const re = 1 - (s * s) / 2 + (s ** 4) / 24, im = s - (s ** 3) / 6;
      return Math.hypot(re, im);
    }
  }
}
