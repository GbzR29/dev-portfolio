"use client";

// Physics 4: platformer feel — kinematic character controllers, per-axis tile
// collision, acceleration and air control, jumps designed from height and
// time to apex, faster falling, variable jump height, apex and terminal
// velocity, coyote time and jump buffering, and a tuning table.

import { Callout, CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { JumpDesignFigure } from "@/components/lesson/figures/gamedev/JumpDesignFigure";
import { PlatformerFigure } from "@/components/lesson/figures/gamedev/PlatformerFigure";

const r = String.raw;

export function PlatformerContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "gdPlat_intro",
          "The previous chapters made physics more faithful. A platformer hero needs the opposite: controls that do what the player meant, even when the player was a few frames late. Mario, Celeste and Hollow Knight all bend physics on purpose: they jump higher than they fall, stop almost instantly, steer in mid-air and forgive a jump pressed just after running off a ledge. This chapter builds such a controller step by step, deriving the jump from the two numbers a designer actually thinks in, and ends in a small level where every trick can be switched off to feel what it does.")}
      </Lead>

      <H2>{tx(t, "gdPlat_kinTitle", "Kinematic, not dynamic")}</H2>
      <p>
        {tx(t, "gdPlat_kinBody",
          "The player character is usually not a rigid body. A rigid body is pushed by forces and keeps its momentum; a character must start and stop when the stick says so, never tip over, and never be flung by a stack of crates. So the controller is kinematic: each step it decides its own velocity from the input and its tuning, moves, and stops at solid geometry. It still uses the integrator of the first chapter (semi-implicit Euler at a fixed step), but the forces are replaced by rules.")}
      </p>

      <H3>{tx(t, "gdPlat_tileTitle", "Moving through tiles, one axis at a time")}</H3>
      <p>
        {tx(t, "gdPlat_tileBody",
          "In a tile map the classic collision is simple and robust: move along x, and if the box now overlaps a solid tile, snap it back against that tile's side and zero the x velocity; then do the same along y. Doing the axes separately means the controller always knows which side it hit: a collision while moving down is a floor, which sets grounded = true; moving up, a ceiling, which stops the rise. It also lets the player slide along walls and floors instead of sticking to them. Standing still produces no overlap at all, so a tiny probe just below the feet tells whether the character is still supported. The step must be small enough that the box never moves more than a tile per step, or it can tunnel through a floor, the problem of the Collision Shapes chapter.")}
      </p>
      <Equation label={tx(t, "gdPlat_eqSnap", "Snapping out of a tile")}
        where={[
          [r`y`, tx(t, "gdPlat_wY", "the centre of the character's box, whose half height is h_b; tiles are 1 unit tall and tile row k spans y from k to k + 1")],
          [r`\lfloor y - h_b \rfloor + 1`, tx(t, "gdPlat_wTop", "the top of the tile the feet are in. Landing on it puts the centre h_b above it")],
          [r`\lfloor y + h_b \rfloor`, tx(t, "gdPlat_wBottom", "the bottom of the tile the head is in, for a ceiling")],
        ]}>
        {r`\text{floor: } y \leftarrow \lfloor y - h_b \rfloor + 1 + h_b \qquad \text{ceiling: } y \leftarrow \lfloor y + h_b \rfloor - h_b`}
      </Equation>

      <H3>{tx(t, "gdPlat_runTitle", "Running: acceleration and air control")}</H3>
      <p>
        {tx(t, "gdPlat_runBody",
          "Horizontal speed moves towards the target speed (the stick times the run speed) by at most a fixed amount per step, with separate rates for speeding up and slowing down. High acceleration feels snappy (Mega Man reaches full speed at once), low acceleration feels heavy and slippery (the ice levels of every game). In the air the same rules apply with the rates scaled down by an air-control factor: 1 gives full steering, 0 commits the player to the jump they started.")}
      </p>
      <Equation label={tx(t, "gdPlat_eqRun", "Approaching the target speed")}
        where={[
          [r`d \in \{-1, 0, 1\}`, tx(t, "gdPlat_wD", "the input direction")],
          [r`v_{\max}`, tx(t, "gdPlat_wVmax", "the run speed")],
          [r`a`, tx(t, "gdPlat_wA", "the acceleration when d ≠ 0, the deceleration when d = 0 (tiles/s²)")],
          [r`c`, tx(t, "gdPlat_wC", "1 on the ground, the air-control factor in the air")],
          [r`\operatorname{approach}(v, g, s)`, tx(t, "gdPlat_wApp", "moves v towards g by at most s, never past it")],
        ]}>
        {r`v_x \leftarrow \operatorname{approach}\big(v_x,\ d\,v_{\max},\ c\,a\,h\big)`}
      </Equation>

      <H2>{tx(t, "gdPlat_jumpTitle", "Designing the jump")}</H2>
      <p>
        {tx(t, "gdPlat_jumpBody",
          "Picking a gravity and a take-off speed and hoping the jump feels right is backwards. Designers think in two numbers: how high the jump goes (H, say 3 tiles, so that it clears 3-tile walls) and how long it takes to get there (T_apex, say 0.4 s, which sets how floaty it feels). Constant-acceleration motion links them. The height is y(t) = v₀t − ½gt², the rise stops when the velocity v₀ − gt reaches zero, at t = T, so v₀ = gT. Put that into y(T) = H: H = gT² − ½gT² = ½gT². Solve both for g and v₀:")}
      </p>
      <Equation label={tx(t, "gdPlat_eqJump", "Gravity and jump speed from height and time")}
        where={[
          [r`H`, tx(t, "gdPlat_wH", "the jump height, in tiles (or metres)")],
          [r`T`, tx(t, "gdPlat_wT", "the time from take-off to the top of the jump, in seconds")],
          [r`g`, tx(t, "gdPlat_wG", "the gravity to use while rising. With H = 3.2 and T = 0.38 it is 44 tiles/s², far above real gravity, because game jumps are both high and fast")],
          [r`v_0`, tx(t, "gdPlat_wV0", "the upward speed given at take-off")],
        ]}
        note={tx(t, "gdPlat_jumpNote", "Change H and the jump stays as fast; change T and it stays as high. Tuning becomes independent sliders instead of a guessing game.")}>
        {r`H = \tfrac12\,g\,T^2 \quad\text{and}\quad v_0 = g\,T \qquad\Longrightarrow\qquad g = \frac{2H}{T^2} \qquad v_0 = \frac{2H}{T}`}
      </Equation>

      <H3>{tx(t, "gdPlat_fallTitle", "Falling faster")}</H3>
      <p>
        {tx(t, "gdPlat_fallBody",
          "A plain parabola spends as long coming down as going up, and that feels floaty: the player waits for the landing. Most platformers use a stronger gravity while falling, k·g with k between 1.5 and 3. The descent from height H then takes √(2H/(k·g)) = T/√k: with k = 2, about 70% of the rise time. The height does not change, since it only depends on the rise. A terminal velocity caps the fall speed, so long drops stay readable and the per-axis collision never moves more than a tile per step.")}
      </p>
      <Equation label={tx(t, "gdPlat_eqFall", "Fall time with a heavier fall")}
        where={[
          [r`k`, tx(t, "gdPlat_wK", "the fall multiplier: gravity is k·g while the velocity points down")],
          [r`T_{\text{fall}}`, tx(t, "gdPlat_wTf", "the time to fall back from the apex to the take-off height")],
        ]}>
        {r`H = \tfrac12\,(k g)\,T_{\text{fall}}^2 \qquad\Longrightarrow\qquad T_{\text{fall}} = \sqrt{\frac{2H}{k g}} = \frac{T}{\sqrt k}`}
      </Equation>

      <H3>{tx(t, "gdPlat_varTitle", "Variable jump height")}</H3>
      <p>
        {tx(t, "gdPlat_varBody",
          "Players expect a tap to make a small hop and a hold to make a full jump. The simplest way: when the button is released while still rising, multiply the upward velocity once by a cut factor c between 0 and 1. The remaining climb from speed v is v²/2g, so cutting it by c cuts the remaining climb by c². Released right at take-off, the hop reaches c²·H: with c = 0.45 about a fifth of the full jump. Another common way switches to the heavier fall gravity as soon as the button is released, which gives a smoother curve.")}
      </p>
      <Equation label={tx(t, "gdPlat_eqCut", "The shortest hop")}
        where={[
          [r`c`, tx(t, "gdPlat_wCut", "the cut factor applied to the upward speed on release")],
          [r`(c\,v_0)^2 / 2g`, tx(t, "gdPlat_wHop", "how far the cut speed can still climb against gravity g")],
        ]}>
        {r`H_{\min} = \frac{(c\,v_0)^2}{2g} = c^2 H`}
      </Equation>

      <JumpDesignFigure t={t} />

      <H2>{tx(t, "gdPlat_forgiveTitle", "Forgiving input")}</H2>
      <p>
        {tx(t, "gdPlat_forgiveBody",
          "People react to what they see about 0.2 s late and press buttons a little early or a little late. A strict controller punishes both; a forgiving one quietly accepts inputs that were meant to count. Two small timers do most of the work, and neither makes the game easier in a way the player notices: they only remove failures the player would call unfair.")}
      </p>
      <H3>{tx(t, "gdPlat_coyoteTitle", "Coyote time")}</H3>
      <p>
        {tx(t, "gdPlat_coyoteBody",
          "Named after the cartoon coyote who runs off a cliff and only falls once he notices. Keep a timer of how long ago the character last stood on the ground, and allow a jump while it is below a small window, typically 0.06–0.15 s (4 to 9 frames at 60 Hz). A player who presses jump a few frames after running off a ledge still jumps. The jump must reset the timer, or it could be used twice.")}
      </p>
      <H3>{tx(t, "gdPlat_bufferTitle", "Jump buffering")}</H3>
      <p>
        {tx(t, "gdPlat_bufferBody",
          "The mirror image: remember when jump was last pressed, and if the character lands within a short window after that press (about 0.1 s), jump at the moment of landing. Without it, a press 3 frames before touching the ground is simply lost, and the player feels the game ignored them. Together, the two timers turn a strict condition, \"press exactly while grounded\", into a forgiving one.")}
      </p>
      <Equation label={tx(t, "gdPlat_eqForgive", "When a jump fires")}
        where={[
          [r`t_{\text{ground}}`, tx(t, "gdPlat_wTg", "seconds since the character last stood on the ground (0 while grounded)")],
          [r`t_{\text{press}}`, tx(t, "gdPlat_wTp", "seconds since the jump button was last pressed")],
          [r`c_{\text{coyote}},\ c_{\text{buffer}}`, tx(t, "gdPlat_wWin", "the two windows, about 0.1 s each")],
          [r`\text{jumping}`, tx(t, "gdPlat_wJumping", "true from take-off until landing, so the coyote window cannot give a second jump")],
        ]}>
        {r`\text{jump} \iff \underbrace{t_{\text{ground}} \le c_{\text{coyote}} \ \wedge\ \neg\,\text{jumping}}_{\text{can jump}} \ \wedge\ \underbrace{t_{\text{press}} \le c_{\text{buffer}}}_{\text{wants to jump}}`}
      </Equation>

      <PlatformerFigure t={t} />

      <CodeBlock lang="cpp" filename="player.cpp" t={t}>{`struct Tuning {
    float runSpeed = 7, accel = 70, decel = 60, airControl = 0.65f;
    float jumpHeight = 3.2f, timeToApex = 0.38f, fallMultiplier = 1.8f, cut = 0.45f;
    float coyote = 0.10f, buffer = 0.12f, terminal = 18;
};

void Player::step(const Input& in, bool jumpPressed, const TileMap& map, const Tuning& k, float h) {
    float g  = 2 * k.jumpHeight / (k.timeToApex * k.timeToApex);
    float v0 = 2 * k.jumpHeight / k.timeToApex;

    // Run: approach the target speed, with less grip in the air
    float dir = float(in.right) - float(in.left);
    float rate = (dir != 0 ? k.accel : k.decel) * (grounded ? 1.0f : k.airControl);
    vel.x = approach(vel.x, dir * k.runSpeed, rate * h);

    // Timers
    sinceGround = grounded ? 0 : sinceGround + h;
    sincePress  = jumpPressed ? 0 : sincePress + h;

    // Jump: grounded or within coyote time, pressed now or within the buffer
    bool canJump = !jumping && sinceGround <= k.coyote;
    if (canJump && sincePress <= k.buffer) {
        vel.y = v0;  jumping = true;  cutDone = false;  sincePress = 1e9f;
    }
    if (jumping && !in.jump && vel.y > 0 && !cutDone) { vel.y *= k.cut; cutDone = true; }

    // Gravity: heavier on the way down, capped
    float gNow = vel.y < 0 ? g * k.fallMultiplier : g;
    vel.y = std::max(vel.y - gNow * h, -k.terminal);

    // Move and collide one axis at a time
    pos.x += vel.x * h;
    if (map.overlaps(box())) { pos.x = snapX(map, vel.x); vel.x = 0; }
    pos.y += vel.y * h;
    grounded = false;
    if (map.overlaps(box())) {
        if (vel.y <= 0) { pos.y = snapToFloor(map); grounded = true; jumping = false; }
        else            { pos.y = snapToCeiling(map); }
        vel.y = 0;
    } else if (vel.y <= 0 && map.overlaps(box().offset(0, -0.002f))) {
        grounded = true;  jumping = false;               // standing still on a floor
    }
}`}</CodeBlock>

      <H2>{tx(t, "gdPlat_moreTitle", "More tricks of the trade")}</H2>
      <LessonTable
        headers={[tx(t, "gdPlat_tTrick", "Trick"), tx(t, "gdPlat_tWhat", "What it does"), tx(t, "gdPlat_tWhy", "Why")]}
        rows={[
          [tx(t, "gdPlat_m1", "apex hang"), tx(t, "gdPlat_m1w", "halve gravity while |v_y| is small near the top"), tx(t, "gdPlat_m1y", "more time to steer at the apex, where precision matters")],
          [tx(t, "gdPlat_m2", "corner correction"), tx(t, "gdPlat_m2w", "if the head clips a ceiling corner by a few pixels, nudge sideways instead of stopping"), tx(t, "gdPlat_m2y", "near-misses feel like hits otherwise")],
          [tx(t, "gdPlat_m3", "ledge nudge"), tx(t, "gdPlat_m3w", "lift the character onto a ledge it misses by a few pixels"), tx(t, "gdPlat_m3y", "same idea on the way up")],
          [tx(t, "gdPlat_m4", "input queue"), tx(t, "gdPlat_m4w", "record the press as an event, consumed in the next fixed step"), tx(t, "gdPlat_m4y", "a tap between two fixed steps must not be lost (see the game-loop chapter)")],
          [tx(t, "gdPlat_m5", "wall slide and wall jump"), tx(t, "gdPlat_m5w", "cap the fall speed against a wall; jump away with a fixed sideways speed and brief loss of control"), tx(t, "gdPlat_m5y", "vertical levels without ladders")],
          [tx(t, "gdPlat_m6", "landing squash"), tx(t, "gdPlat_m6w", "squash the sprite on landing, stretch it at take-off, with a spring"), tx(t, "gdPlat_m6y", "the eye reads weight and impact (see the springs chapter)")],
        ]}
      />

      <Callout type="tip" t={t}>
        {tx(t, "gdPlat_tip", "Expose every number of the controller in a debug panel and tune while playing, as in the figure. Game feel is found by iteration, and the formulas above only make sure each slider changes one thing: height, rise time, fall weight or forgiveness.")}
      </Callout>

      <KeyIdeas t={t} id="gdPlat" items={[
        tx(t, "gdPlat_k1", "A player character is a kinematic controller: it sets its own velocity from input and moves through tiles one axis at a time."),
        tx(t, "gdPlat_k2", "Design jumps from height H and time to apex T: g = 2H/T² and v₀ = 2H/T."),
        tx(t, "gdPlat_k3", "A heavier fall (k·g) shortens the descent to T/√k without changing the height; a terminal speed caps it."),
        tx(t, "gdPlat_k4", "Releasing jump early cuts the upward speed by c, and the remaining climb by c²."),
        tx(t, "gdPlat_k5", "Coyote time allows a jump shortly after leaving a ledge; jump buffering keeps a press made shortly before landing."),
      ]} />
    </Article>
  );
}
