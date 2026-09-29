// ── A platformer character controller ─────────────────────────────────────────
// Shared by the platformer figures. Units are tiles (1 tile = 1 m) and seconds;
// y points up. The controller is kinematic: it sets its own velocity from the
// input and the jump design, moves one axis at a time and stops at solid tiles.
// It is not a rigid body, because a player character must obey the stick, not
// friction and momentum.

export type Tuning = {
  runSpeed: number; accel: number; decel: number; airControl: number;
  jumpHeight: number; timeToApex: number; fallMultiplier: number; cut: number;
  coyote: number; buffer: number; terminal: number;
  useCoyote: boolean; useBuffer: boolean; useCut: boolean; useFall: boolean;
};

export const DEFAULT_TUNING: Tuning = {
  runSpeed: 7, accel: 70, decel: 60, airControl: 0.65,
  jumpHeight: 3.2, timeToApex: 0.38, fallMultiplier: 1.8, cut: 0.45,
  coyote: 0.1, buffer: 0.12, terminal: 18,
  useCoyote: true, useBuffer: true, useCut: true, useFall: true,
};

/** Gravity and take-off speed that reach height H at time T (from y = v₀t − ½gt²). */
export const jumpPhysics = (H: number, T: number) => ({ g: (2 * H) / (T * T), v0: (2 * H) / T });

export type Input = { left: boolean; right: boolean; jump: boolean };
export type Player = {
  x: number; y: number; vx: number; vy: number;
  grounded: boolean; sinceGround: number; sincePress: number; jumpHeld: boolean; jumping: boolean; cutDone: boolean;
  lastJump: "none" | "normal" | "coyote" | "buffered"; lastJumpAge: number;
};
export const HALF_W = 0.35, HALF_H = 0.45;

export const newPlayer = (x: number, y: number): Player => ({
  x, y, vx: 0, vy: 0, grounded: false, sinceGround: 99, sincePress: 99, jumpHeld: false, jumping: false, cutDone: false,
  lastJump: "none", lastJumpAge: 99,
});

export type Level = { rows: string[]; solid: (tx: number, ty: number) => boolean; w: number; h: number };

/** A level from text rows, top row first; '#' is solid, anything else is air. */
export function makeLevel(rows: string[]): Level {
  const h = rows.length, w = rows[0].length;
  return {
    rows, w, h,
    // Tile (tx, ty) covers x ∈ [tx, tx+1), y ∈ [ty, ty+1), with ty = 0 at the bottom row
    solid: (tx, ty) => tx < 0 || tx >= w ? true : ty < 0 || ty >= h ? false : rows[h - 1 - ty][tx] === "#",
  };
}

/** Moves toward a target by at most `step` (never overshoots). */
const approach = (v: number, target: number, step: number) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

/** One fixed step of the controller. `pressed` is true only on the step the jump button went down. */
export function stepPlayer(p: Player, input: Input, pressed: boolean, lv: Level, k: Tuning, h: number) {
  const { g, v0 } = jumpPhysics(k.jumpHeight, k.timeToApex);

  // ── Horizontal: accelerate toward the wanted speed, less grip in the air
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const control = p.grounded ? 1 : k.airControl;
  const rate = (dir !== 0 ? k.accel : k.decel) * control;
  p.vx = approach(p.vx, dir * k.runSpeed, rate * h);

  // ── Timers: time since we last stood on ground, time since jump was pressed
  p.sinceGround = p.grounded ? 0 : p.sinceGround + h;
  p.sincePress = pressed ? 0 : p.sincePress + h;
  p.lastJumpAge += h;

  // ── Jump: allowed on the ground, or within the coyote window after leaving it;
  //    a press is remembered for the buffer window and fires as soon as it can
  const canJump = !p.jumping && (p.grounded || (k.useCoyote && p.sinceGround <= k.coyote));
  const wants = pressed || (k.useBuffer && p.sincePress <= k.buffer);
  if (canJump && wants) {
    p.lastJump = pressed ? (p.grounded ? "normal" : "coyote") : "buffered";
    p.lastJumpAge = 0;
    p.vy = v0; p.jumping = true; p.cutDone = false; p.grounded = false; p.sincePress = 99;
  }
  // Variable height: letting go while still rising cuts the upward speed once
  if (k.useCut && p.jumping && !input.jump && p.vy > 0 && !p.cutDone) { p.vy *= k.cut; p.cutDone = true; }

  // ── Gravity: stronger on the way down, capped at a terminal speed
  const gNow = k.useFall && p.vy < 0 ? g * k.fallMultiplier : g;
  p.vy = Math.max(p.vy - gNow * h, -k.terminal);

  // ── Move and collide, one axis at a time
  p.x += p.vx * h;
  if (hits(p, lv)) {
    p.x = p.vx > 0 ? Math.floor(p.x + HALF_W) - HALF_W - 1e-4 : Math.floor(p.x - HALF_W) + 1 + HALF_W + 1e-4;
    p.vx = 0;
  }
  p.y += p.vy * h;
  p.grounded = false;
  if (hits(p, lv)) {
    if (p.vy <= 0) { p.y = Math.floor(p.y - HALF_H) + 1 + HALF_H + 1e-4; p.grounded = true; p.jumping = false; }
    else p.y = Math.floor(p.y + HALF_H) - HALF_H - 1e-4;
    p.vy = 0;
  } else {
    // Standing still on a floor gives no collision this step: probe a hair below the feet
    const probe = { ...p, y: p.y - 2e-3 };
    if (p.vy <= 0 && hits(probe, lv)) { p.grounded = true; p.jumping = false; }
  }
  p.jumpHeld = input.jump;
}

/** Does the player's box overlap any solid tile? */
function hits(p: { x: number; y: number }, lv: Level) {
  const x0 = Math.floor(p.x - HALF_W), x1 = Math.floor(p.x + HALF_W - 1e-6);
  const y0 = Math.floor(p.y - HALF_H), y1 = Math.floor(p.y + HALF_H - 1e-6);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (lv.solid(tx, ty)) return true;
  return false;
}
