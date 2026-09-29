// ── A tiny impulse solver for circles in a box ────────────────────────────────
// Used by BallPitFigure. One fixed step: integrate gravity (semi-implicit
// Euler), find every contact (ball–ball and ball–wall), then run the
// velocity solver for a number of iterations over all contacts (sequential
// impulses), and finally push overlapping bodies apart (positional correction).
// Units are metres, seconds and kilograms; y points up.

export type Ball = { x: number; y: number; vx: number; vy: number; r: number; invM: number };
export type PitParams = {
  gravity: number; e: number; mu: number; iterations: number;
  correction: boolean; percent: number; slop: number; restThreshold: number;
};
export const PIT_W = 8, PIT_H = 5;

// `bounce` is e·vₙ at first touch: the solver drives the normal relative velocity to −e·vₙ
type Contact = { a: number; b: number; nx: number; ny: number; depth: number; bounce: number; jn: number };

/** Every overlapping pair; b = −1..−4 stands for the floor, the ceiling and the two walls. */
function findContacts(balls: Ball[], p: PitParams): Contact[] {
  const out: Contact[] = [];
  // vn = (v_B − v_A)·n, negative while the two approach
  const add = (a: number, b: number, nx: number, ny: number, depth: number, vn: number) => {
    // A slow contact does not bounce: it would jitter for ever on the floor
    const e = -vn < p.restThreshold ? 0 : p.e;
    out.push({ a, b, nx, ny, depth, bounce: vn < 0 ? e * vn : 0, jn: 0 });
  };
  balls.forEach((A, i) => {
    // Walls: the normal points from the ball into the wall (from A to B, like ball pairs),
    // and a wall does not move, so vn = −v_A·n
    if (A.y - A.r < 0) add(i, -1, 0, -1, A.r - A.y, A.vy);
    if (A.y + A.r > PIT_H) add(i, -2, 0, 1, A.y + A.r - PIT_H, -A.vy);
    if (A.x - A.r < 0) add(i, -3, -1, 0, A.r - A.x, A.vx);
    if (A.x + A.r > PIT_W) add(i, -4, 1, 0, A.x + A.r - PIT_W, -A.vx);
    for (let j = i + 1; j < balls.length; j++) {
      const B = balls[j];
      const dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy, rr = A.r + B.r;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      add(i, j, nx, ny, rr - d, (B.vx - A.vx) * nx + (B.vy - A.vy) * ny);
    }
  });
  return out;
}

const STATIC: Ball = { x: 0, y: 0, vx: 0, vy: 0, r: 0, invM: 0 };

/** Advances the pit by one step h. Returns the deepest overlap left after the step. */
export function stepPit(balls: Ball[], p: PitParams, h: number): number {
  for (const b of balls) { b.vy -= p.gravity * h; }

  const contacts = findContacts(balls, p);
  const bodyOf = (k: number) => (k < 0 ? STATIC : balls[k]);

  // Velocity solver: each pass fixes every contact once, using the latest velocities
  for (let it = 0; it < p.iterations; it++) {
    for (const c of contacts) {
      const A = balls[c.a], B = bodyOf(c.b);
      const rvx = B.vx - A.vx, rvy = B.vy - A.vy;
      const vn = rvx * c.nx + rvy * c.ny;
      const k = A.invM + B.invM;
      // Normal impulse that brings vn to −e·vn₀, accumulated and kept ≥ 0: contacts push, never pull
      const jnNew = Math.max(0, c.jn - (vn + c.bounce) / k);
      const dj = jnNew - c.jn;
      c.jn = jnNew;
      A.vx -= dj * c.nx * A.invM; A.vy -= dj * c.ny * A.invM;
      B.vx += dj * c.nx * B.invM; B.vy += dj * c.ny * B.invM;

      // Friction along the tangent, at most μ times the normal impulse (Coulomb)
      const tx = -c.ny, ty = c.nx;
      const vt = (B.vx - A.vx) * tx + (B.vy - A.vy) * ty;
      let jt = -vt / k;
      jt = Math.max(-p.mu * c.jn, Math.min(p.mu * c.jn, jt));
      A.vx -= jt * tx * A.invM; A.vy -= jt * ty * A.invM;
      B.vx += jt * tx * B.invM; B.vy += jt * ty * B.invM;
    }
  }

  for (const b of balls) { b.x += b.vx * h; b.y += b.vy * h; }

  // Positional correction: push apart a share of the overlap beyond the slop, split by inverse mass
  let worst = 0;
  for (const c of findContacts(balls, p)) {
    worst = Math.max(worst, c.depth);
    if (!p.correction) continue;
    const A = balls[c.a], B = bodyOf(c.b);
    const push = (Math.max(c.depth - p.slop, 0) * p.percent) / (A.invM + B.invM);
    A.x -= push * c.nx * A.invM; A.y -= push * c.ny * A.invM;
    B.x += push * c.nx * B.invM; B.y += push * c.ny * B.invM;
  }
  return worst;
}

/** A fresh pit of n balls of mixed sizes, mass ∝ area. */
export function makeBalls(n: number, rnd: () => number): Ball[] {
  return Array.from({ length: n }, (_, i) => {
    const r = 0.22 + rnd() * 0.3;
    return {
      x: 0.6 + ((i * 1.37) % (PIT_W - 1.2)), y: 1 + (i % 4) * 1.0 + rnd() * 0.5,
      vx: (rnd() - 0.5) * 4, vy: 0, r, invM: 1 / (Math.PI * r * r * 4),
    };
  });
}
