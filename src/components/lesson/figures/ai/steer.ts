// ── Steering behaviours (Reynolds 1999) and boids (Reynolds 1987) ───────────
// Each agent is a point with a velocity. A behaviour returns a steering force:
// the desired velocity minus the current one. Forces are capped at maxForce,
// speeds at maxSpeed, and positions advance with explicit Euler steps. Plain
// functions over {x, y}: the figure and the chapter's measurements share them.

export type V2 = { x: number; y: number };
export type Agent = { p: V2; v: V2; wander: number };
export type Limits = { maxSpeed: number; maxForce: number };

export const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: V2, k: number): V2 => ({ x: a.x * k, y: a.y * k });
export const len = (a: V2) => Math.hypot(a.x, a.y);
export const norm = (a: V2): V2 => { const l = len(a); return l > 1e-9 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 }; };
export const truncate = (a: V2, max: number): V2 => { const l = len(a); return l > max ? mul(a, max / l) : a; };

/** Seek: full speed straight at the target. */
export function seek(ag: Agent, target: V2, lim: Limits): V2 {
  const desired = mul(norm(sub(target, ag.p)), lim.maxSpeed);
  return sub(desired, ag.v);
}

/** Flee: full speed straight away from the threat. */
export function flee(ag: Agent, threat: V2, lim: Limits): V2 {
  const desired = mul(norm(sub(ag.p, threat)), lim.maxSpeed);
  return sub(desired, ag.v);
}

/** Arrive: like seek, but the desired speed falls in proportion to the distance inside the slowing radius. */
export function arrive(ag: Agent, target: V2, lim: Limits, slowRadius: number): V2 {
  const off = sub(target, ag.p), d = len(off);
  const speed = d < slowRadius ? (lim.maxSpeed * d) / slowRadius : lim.maxSpeed;
  return sub(mul(norm(off), speed), ag.v);
}

/** The point wander steers toward: on a circle of radius r, a distance ahead of the agent, at its drifting angle. */
export function wanderTarget(ag: Agent, ahead: number, r: number): V2 {
  const h = len(ag.v) > 1e-6 ? Math.atan2(ag.v.y, ag.v.x) : 0;
  const c = add(ag.p, { x: Math.cos(h) * ahead, y: Math.sin(h) * ahead });
  return { x: c.x + r * Math.cos(h + ag.wander), y: c.y + r * Math.sin(h + ag.wander) };
}

/** Wander: nudge the angle on the circle a little at random each frame, then seek the point. */
export function wander(ag: Agent, lim: Limits, rng: () => number, jitter: number, ahead = 50, r = 25): V2 {
  ag.wander += (rng() * 2 - 1) * jitter;
  return seek(ag, wanderTarget(ag, ahead, r), lim);
}

export type FlockWeights = { separation: number; alignment: number; cohesion: number; radius: number };

/** The three boids rules for agent i, each as a steering force, plus their weighted sum. */
export function flockForces(all: Agent[], i: number, w: FlockWeights, lim: Limits) {
  const me = all[i];
  let sep = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, cen = { x: 0, y: 0 }, n = 0;
  for (let j = 0; j < all.length; j++) {
    if (j === i) continue;
    const off = sub(me.p, all[j].p), d = len(off);
    if (d > w.radius || d < 1e-6) continue;
    if (d < w.radius / 2) sep = add(sep, mul(off, 1 / (d * d)));   // push away from close ones, harder when closer
    vel = add(vel, all[j].v);
    cen = add(cen, all[j].p);
    n++;
  }
  if (n === 0) return { sep, ali: sep, coh: sep, total: sep };
  const separation = len(sep) > 0 ? sub(mul(norm(sep), lim.maxSpeed), me.v) : { x: 0, y: 0 };   // no one too close: no push
  const alignment = sub(mul(norm(vel), lim.maxSpeed), me.v);       // match the neighbours' heading
  const cohesion = seek(me, mul(cen, 1 / n), lim);                 // head for the neighbours' centre
  const total = add(add(mul(separation, w.separation), mul(alignment, w.alignment)), mul(cohesion, w.cohesion));
  return { sep: separation, ali: alignment, coh: cohesion, total };
}

/** How fast an agent closes the gap between its velocity and the desired one: 1 / reaction time (0.15 s). */
export const RESPONSE = 1 / 0.15;

/**
 * One Euler step. The steering force (desired − current velocity) becomes an
 * acceleration of RESPONSE × force, capped at maxForce; the velocity is capped
 * at maxSpeed and moves the position.
 */
export function integrate(ag: Agent, force: V2, lim: Limits, dt: number) {
  ag.v = truncate(add(ag.v, mul(truncate(mul(force, RESPONSE), lim.maxForce), dt)), lim.maxSpeed);
  ag.p = add(ag.p, mul(ag.v, dt));
}
