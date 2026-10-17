// ── A patrolling guard, driven by a state machine or a behaviour tree ───────
// A room with crates that block movement and sight. The guard walks a loop
// of waypoints; it sees the player inside a 100° cone up to 170 units when no
// crate is in the way. It chases while it sees the player, then searches the
// last place it saw them (walk there, look around for 3 s), then goes back to
// patrolling. The same behaviour is written twice: as a finite state machine
// (`fsmTick`) and as a behaviour tree (`btTick`), which also reports the status
// of every node on each tick so the figure can light the tree up.

export type P = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export const ROOM = { w: 600, h: 300 };
export const CRATES: Box[] = [
  { x: 150, y: 70, w: 70, h: 50 },
  { x: 360, y: 40, w: 50, h: 90 },
  { x: 260, y: 190, w: 110, h: 45 },
  { x: 470, y: 200, w: 60, h: 50 },
];
export const WAYPOINTS: P[] = [{ x: 60, y: 50 }, { x: 540, y: 50 }, { x: 540, y: 270 }, { x: 60, y: 270 }];

export const SIGHT = { range: 170, half: (50 * Math.PI) / 180 };
const SPEED = { patrol: 55, chase: 95, search: 70 };
const LOOK_TIME = 3;
export const CATCH = 16;

export type State = "patrol" | "chase" | "search";
export type Guard = {
  p: P; heading: number;
  state: State;                 // FSM only
  wp: number;                   // next waypoint
  last: P | null;               // where the player was last seen
  look: number;                 // seconds spent looking around at `last`
  caught: number;               // seconds left of the "caught" flash
};

export const makeGuard = (): Guard => ({ p: { ...WAYPOINTS[0] }, heading: 0, state: "patrol", wp: 1, last: null, look: 0, caught: 0 });

const inBox = (p: P, b: Box, pad = 0) => p.x > b.x - pad && p.x < b.x + b.w + pad && p.y > b.y - pad && p.y < b.y + b.h + pad;
export const blocked = (p: P, pad = 8) =>
  p.x < pad || p.y < pad || p.x > ROOM.w - pad || p.y > ROOM.h - pad || CRATES.some(b => inBox(p, b, pad));

/** True when the segment a–b crosses box b (sampled every 4 units: enough for crates this size). */
function segmentHits(a: P, c: P, b: Box) {
  const n = Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 4);
  for (let i = 1; i < n; i++) if (inBox({ x: a.x + ((c.x - a.x) * i) / n, y: a.y + ((c.y - a.y) * i) / n }, b)) return true;
  return false;
}

/** Can the guard see point q: close enough, inside the cone, and no crate in between? */
export function sees(g: Guard, q: P) {
  const dx = q.x - g.p.x, dy = q.y - g.p.y, d = Math.hypot(dx, dy);
  if (d > SIGHT.range) return false;
  let ang = Math.atan2(dy, dx) - g.heading;
  ang = Math.atan2(Math.sin(ang), Math.cos(ang));
  if (Math.abs(ang) > SIGHT.half) return false;
  return !CRATES.some(b => segmentHits(g.p, q, b));
}

/** Walk toward q; slides along crates instead of entering them. Returns true on arrival. */
function moveTo(g: Guard, q: P, speed: number, dt: number) {
  const dx = q.x - g.p.x, dy = q.y - g.p.y, d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const want = Math.atan2(dy, dx);
  let turn = Math.atan2(Math.sin(want - g.heading), Math.cos(want - g.heading));
  turn = Math.max(-5 * dt, Math.min(5 * dt, turn));          // turn at most 5 rad/s
  g.heading += turn;
  const step = Math.min(d, speed * dt);
  const nx = { x: g.p.x + Math.cos(want) * step, y: g.p.y + Math.sin(want) * step };
  if (!blocked(nx)) g.p = nx;
  else if (!blocked({ x: nx.x, y: g.p.y })) g.p = { x: nx.x, y: g.p.y };
  else if (!blocked({ x: g.p.x, y: nx.y })) g.p = { x: g.p.x, y: nx.y };
  else return true;                                          // stuck against a corner: give up on this target
  return false;
}

// ── Actions shared by both versions ───────────────────────────────────────────
function patrol(g: Guard, dt: number) { if (moveTo(g, WAYPOINTS[g.wp], SPEED.patrol, dt)) g.wp = (g.wp + 1) % WAYPOINTS.length; }
function chase(g: Guard, player: P, dt: number) {
  g.last = { ...player };
  moveTo(g, player, SPEED.chase, dt);
  if (Math.hypot(player.x - g.p.x, player.y - g.p.y) < CATCH) g.caught = 1;
}
/** Walk to the last known position, then sweep the gaze for LOOK_TIME seconds. "running" until done. */
function search(g: Guard, dt: number): "running" | "success" {
  if (!g.last) return "success";
  if (g.look === 0 && !moveTo(g, g.last, SPEED.search, dt)) return "running";
  g.look += dt;
  g.heading += Math.sin(g.look * 2.2) * 2.4 * dt;           // look left and right
  if (g.look < LOOK_TIME) return "running";
  g.last = null;
  g.look = 0;
  return "success";
}

// ── 1. The finite state machine ───────────────────────────────────────────────
/** One tick. Returns the transition taken this tick, if any (for the figure's caption). */
export function fsmTick(g: Guard, player: P, dt: number, canSearch: boolean): string | null {
  if (g.caught > 0) g.caught -= dt;
  const see = sees(g, player);
  const from = g.state;
  switch (g.state) {
    case "patrol":
      if (see) g.state = "chase";
      else patrol(g, dt);
      break;
    case "chase":
      if (!see) { g.state = canSearch ? "search" : "patrol"; g.look = 0; if (!canSearch) g.last = null; }
      else chase(g, player, dt);
      break;
    case "search":
      if (see) { g.state = "chase"; g.look = 0; }
      else if (search(g, dt) === "success") g.state = "patrol";
      break;
  }
  return from !== g.state ? `${from}>${g.state}` : null;
}

// ── 2. The behaviour tree ─────────────────────────────────────────────────────
//   Selector
//   ├─ Sequence  [ can see player? → chase ]
//   ├─ Sequence  [ knows where player was? → search there ]
//   └─ patrol
export type Status = "success" | "failure" | "running" | "idle";
export const BT_NODES = ["root", "seqChase", "see", "chase", "seqSearch", "known", "search", "patrol"] as const;
export type BtNode = (typeof BT_NODES)[number];

export function btTick(g: Guard, player: P, dt: number, canSearch: boolean): Record<BtNode, Status> {
  if (g.caught > 0) g.caught -= dt;
  const s = Object.fromEntries(BT_NODES.map(n => [n, "idle"])) as Record<BtNode, Status>;
  // first branch
  s.see = sees(g, player) ? "success" : "failure";
  if (s.see === "success") {
    chase(g, player, dt);
    s.chase = "running"; s.seqChase = "running"; s.root = "running"; g.look = 0;
    return s;
  }
  s.seqChase = "failure";
  // second branch (removed by the "search" switch: the guard forgets at once)
  if (!canSearch) g.last = null;
  s.known = g.last ? "success" : "failure";
  if (s.known === "success") {
    s.search = search(g, dt);
    s.seqSearch = s.search; s.root = s.search;            // running, or success: a selector stops at the first child that does not fail
    return s;
  }
  s.seqSearch = "failure";
  // last branch: always runs
  patrol(g, dt);
  s.patrol = "running"; s.root = "running";
  return s;
}
