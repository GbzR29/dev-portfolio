// ── A small 2D rigid-body engine for boxes ────────────────────────────────────
// Used by RigidBoxesFigure, in the spirit of Erin Catto's Box2D Lite:
// oriented boxes, contacts from the separating axis test with the incident
// face clipped against the reference face, and a sequential-impulse solver
// with accumulated (clamped) impulses, Coulomb friction, restitution, a
// Baumgarte position bias and optional warm starting. y points up; units are
// metres, kilograms, seconds and radians.

export type V = { x: number; y: number };
export type Body = {
  x: number; y: number; angle: number; vx: number; vy: number; w: number;
  hw: number; hh: number;               // half width, half height
  invM: number; invI: number;
};
export type Contact = {
  a: number; b: number; p: V; n: V;     // n points from body a to body b
  depth: number; key: string;
  jn: number; jt: number; bounce: number; bias: number;
  rA: V; rB: V; kN: number; kT: number;
};
export type WorldParams = {
  gravity: number; e: number; mu: number; iterations: number; warmStart: boolean;
  beta: number; slop: number; restThreshold: number;
};

const cross = (a: V, b: V) => a.x * b.y - a.y * b.x;
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });

/** A box of full size w × h with density ρ (kg/m²); a static body has ρ = 0. */
export function makeBox(x: number, y: number, w: number, h: number, rho: number, angle = 0): Body {
  const m = rho * w * h;
  return {
    x, y, angle, vx: 0, vy: 0, w: 0, hw: w / 2, hh: h / 2,
    invM: m > 0 ? 1 / m : 0,
    // Moment of inertia of a rectangle about its centre: m(w² + h²)/12
    invI: m > 0 ? 12 / (m * (w * w + h * h)) : 0,
  };
}

/** The four corners, counter-clockwise, in world space. */
export function corners(b: Body): V[] {
  const c = Math.cos(b.angle), s = Math.sin(b.angle);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const lx = sx * b.hw, ly = sy * b.hh;
    return { x: b.x + c * lx - s * ly, y: b.y + s * lx + c * ly };
  });
}

/** Outward unit normal of edge i (from corner i to corner i + 1). */
const edgeNormal = (v: V[], i: number): V => {
  const d = sub(v[(i + 1) % 4], v[i]), l = Math.hypot(d.x, d.y);
  return { x: d.y / l, y: -d.x / l };
};

/** The largest separation of polygon b from the edges of polygon a, and the edge that gives it. */
function maxSeparation(va: V[], vb: V[]) {
  let best = -Infinity, edge = 0;
  for (let i = 0; i < 4; i++) {
    const n = edgeNormal(va, i);
    let s = Infinity;
    for (const p of vb) s = Math.min(s, dot(n, sub(p, va[i])));
    if (s > best) { best = s; edge = i; }
  }
  return { sep: best, edge };
}

/** Contact points between two boxes (0, 1 or 2), normal from ia to ib. */
function collide(bodies: Body[], ia: number, ib: number): Contact[] {
  const A = bodies[ia], B = bodies[ib];
  const va = corners(A), vb = corners(B);
  const sa = maxSeparation(va, vb);
  if (sa.sep > 0) return [];
  const sb = maxSeparation(vb, va);
  if (sb.sep > 0) return [];

  // The reference face is the one with the larger separation; a small bias keeps
  // the choice from flickering between frames when the two are nearly equal
  const flip = sb.sep > sa.sep * 0.95 + 0.01 * 0.1;
  const [ref, inc, refEdge] = flip ? [vb, va, sb.edge] : [va, vb, sa.edge];
  const n = edgeNormal(ref, refEdge);

  // Incident edge: the edge of the other box whose normal faces most against n
  let incEdge = 0, minDot = Infinity;
  for (let i = 0; i < 4; i++) { const d = dot(edgeNormal(inc, i), n); if (d < minDot) { minDot = d; incEdge = i; } }
  let seg = [inc[incEdge], inc[(incEdge + 1) % 4]];

  // Clip the incident edge to the slab between the reference edge's two side planes
  const r1 = ref[refEdge], r2 = ref[(refEdge + 1) % 4];
  const tangent = sub(r2, r1), tl = Math.hypot(tangent.x, tangent.y);
  const tn = { x: tangent.x / tl, y: tangent.y / tl };
  const clip = (pts: V[], dir: V, offset: number): V[] => {
    const d0 = dot(dir, pts[0]) - offset, d1 = dot(dir, pts[1]) - offset;
    const out: V[] = [];
    if (d0 <= 0) out.push(pts[0]);
    if (d1 <= 0) out.push(pts[1]);
    if (d0 * d1 < 0) { const f = d0 / (d0 - d1); out.push({ x: pts[0].x + f * (pts[1].x - pts[0].x), y: pts[0].y + f * (pts[1].y - pts[0].y) }); }
    return out;
  };
  seg = clip(seg, { x: -tn.x, y: -tn.y }, -dot(tn, r1));
  if (seg.length < 2) return [];
  seg = clip(seg, tn, dot(tn, r2));
  if (seg.length < 2) return [];

  const out: Contact[] = [];
  seg.forEach((p, k) => {
    const s = dot(n, sub(p, r1));
    if (s > 0) return;
    const nAB = flip ? { x: -n.x, y: -n.y } : n;
    out.push({
      a: ia, b: ib, p, n: nAB, depth: -s, key: `${ia}:${ib}:${flip ? 1 : 0}:${refEdge}:${incEdge}:${k}`,
      jn: 0, jt: 0, bounce: 0, bias: 0, rA: { x: 0, y: 0 }, rB: { x: 0, y: 0 }, kN: 0, kT: 0,
    });
  });
  return out;
}

const velAt = (b: Body, r: V): V => ({ x: b.vx - b.w * r.y, y: b.vy + b.w * r.x });
function applyImpulse(b: Body, r: V, P: V, sign: number) {
  b.vx += sign * P.x * b.invM; b.vy += sign * P.y * b.invM;
  b.w += sign * cross(r, P) * b.invI;
}

/** One fixed step. `prev` carries last step's impulses for warm starting; returns this step's contacts. */
export function stepWorld(bodies: Body[], p: WorldParams, h: number, prev: Map<string, Contact>): Contact[] {
  // 1. Gravity changes the velocities
  for (const b of bodies) if (b.invM > 0) b.vy -= p.gravity * h;

  // 2. Contacts between every pair that is not static–static
  const contacts: Contact[] = [];
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    if (bodies[i].invM === 0 && bodies[j].invM === 0) continue;
    contacts.push(...collide(bodies, i, j));
  }

  // 3. Per-contact constants: lever arms, effective masses, the bounce and the push-out bias
  for (const c of contacts) {
    const A = bodies[c.a], B = bodies[c.b];
    c.rA = sub(c.p, A); c.rB = sub(c.p, B);
    const rnA = cross(c.rA, c.n), rnB = cross(c.rB, c.n);
    c.kN = A.invM + B.invM + A.invI * rnA * rnA + B.invI * rnB * rnB;
    const t = { x: c.n.y, y: -c.n.x };
    const rtA = cross(c.rA, t), rtB = cross(c.rB, t);
    c.kT = A.invM + B.invM + A.invI * rtA * rtA + B.invI * rtB * rtB;
    const vRel = sub(velAt(B, c.rB), velAt(A, c.rA)), vn = dot(vRel, c.n);
    c.bounce = vn < -p.restThreshold ? p.e * vn : 0;
    c.bias = (p.beta / h) * Math.max(0, c.depth - p.slop);
    const old = p.warmStart ? prev.get(c.key) : undefined;
    if (old) {
      c.jn = old.jn; c.jt = old.jt;
      const P = { x: c.n.x * c.jn + t.x * c.jt, y: c.n.y * c.jn + t.y * c.jt };
      applyImpulse(A, c.rA, P, -1); applyImpulse(B, c.rB, P, 1);
    }
  }

  // 4. Sequential impulses: sweep all contacts several times with the latest velocities
  for (let it = 0; it < p.iterations; it++) {
    for (const c of contacts) {
      const A = bodies[c.a], B = bodies[c.b];
      const t = { x: c.n.y, y: -c.n.x };
      let vRel = sub(velAt(B, c.rB), velAt(A, c.rA));
      const vn = dot(vRel, c.n);
      // Drive vn to max(bounce target, push-out speed); the total impulse never pulls
      const jn = Math.max(0, c.jn + (-vn - c.bounce + c.bias) / c.kN);
      const dn = jn - c.jn; c.jn = jn;
      const Pn = { x: c.n.x * dn, y: c.n.y * dn };
      applyImpulse(A, c.rA, Pn, -1); applyImpulse(B, c.rB, Pn, 1);

      vRel = sub(velAt(B, c.rB), velAt(A, c.rA));
      const vt = dot(vRel, t);
      const lim = p.mu * c.jn;
      const jt = Math.max(-lim, Math.min(lim, c.jt - vt / c.kT));
      const dt = jt - c.jt; c.jt = jt;
      const Pt = { x: t.x * dt, y: t.y * dt };
      applyImpulse(A, c.rA, Pt, -1); applyImpulse(B, c.rB, Pt, 1);
    }
  }

  // 5. Positions follow the corrected velocities (semi-implicit Euler)
  for (const b of bodies) {
    if (b.invM === 0) continue;
    b.x += b.vx * h; b.y += b.vy * h; b.angle += b.w * h;
  }

  prev.clear();
  for (const c of contacts) prev.set(c.key, c);
  return contacts;
}
