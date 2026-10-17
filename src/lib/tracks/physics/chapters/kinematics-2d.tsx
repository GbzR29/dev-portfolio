"use client";

// Foundations 3: motion in a plane — position and velocity as vectors with
// components; the independence of horizontal and vertical motion; the
// projectile equations; the path is a parabola; time of flight, maximum height
// and range (sin 2θ, 45°, complementary angles); launching from a height;
// what air resistance changes; the monkey-and-hunter puzzle.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ProjectileFigure } from "@/components/lesson/figures/physics/ProjectileFigure";

const r = String.raw;
const num = (v: number, d = 2) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Range, height and flight time of a launch from the ground. */
const rangeNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const g = 9.81, th = (v.deg * Math.PI) / 180, v0 = v.v0;
  const R = (v0 * v0 * Math.sin(2 * th)) / g, Hm = (v0 * v0 * Math.sin(th) ** 2) / (2 * g), T = (2 * v0 * Math.sin(th)) / g;
  return {
    tex: r`R = \frac{${num(v0, 1)}^2 \cdot \sin ${num(2 * v.deg, 0)}^\circ}{9.81} = \amber{${num(R, 1)}\ \text{m}} \qquad H = \frac{${num(v0, 1)}^2 \sin^2 ${num(v.deg, 0)}^\circ}{2 \cdot 9.81} = ${num(Hm, 1)}\ \text{m} \qquad T = ${num(T)}\ \text{s}`,
    meter: Math.min(1, R / ((v0 * v0) / g)), meterLabel: `${num((R / ((v0 * v0) / g)) * 100, 0)} % ${tx(t, "phKin2_liveMax", "of the maximum")}`,
  };
};

export function Kinematics2dContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "phKin2_intro",
          "A ball kicked across a field, a jet of water from a hose, a long jump: each moves sideways and up and down at the same time, along a curved path. It looks like a new kind of motion, but it is not. Split it into a horizontal part and a vertical part and each one is the straight-line motion of the last chapter. This one idea, that the two directions do not interfere, solves every projectile problem.")}
      </Lead>

      <Goals t={t} id="phKin2" items={[
        "Split a velocity into horizontal and vertical components.",
        "Explain why horizontal and vertical motion are independent.",
        "Derive the projectile's path, flight time, maximum height and range.",
        "Say what changes when launching from a height or through air.",
      ]} />

      <H2>{tx(t, "phKin2_vecTitle", "Position and velocity as vectors")}</H2>
      <p>
        {tx(t, "phKin2_vecBody",
          "In a plane, a position needs two numbers: x across and y up. Together they form the position vector r = (x, y), an arrow from the origin to the object (the Math track's vectors chapter covers vectors in full). Velocity is also a vector: it has a size, the speed, and a direction, the way the object is heading. A velocity of size v at an angle θ above the horizontal splits into two components with the trigonometry of a right triangle.")}
      </p>
      <Equation label={tx(t, "phKin2_eqComp", "Components of a velocity")}
        where={[
          [r`v`, tx(t, "phKin2_wV", "the speed, the length of the velocity arrow (m/s)")],
          [r`\theta`, tx(t, "phKin2_wTh", "the angle above the horizontal")],
          [r`v_x`, tx(t, "phKin2_wVx", "the horizontal component: how fast x changes")],
          [r`v_y`, tx(t, "phKin2_wVy", "the vertical component: how fast y changes")],
        ]}
        note={tx(t, "phKin2_compNote", "A kick at 20 m/s and 30°: vₓ = 20 cos 30° = 17.3 m/s, v_y = 20 sin 30° = 10 m/s. Going back: v = √(17.3² + 10²) = 20 m/s, by Pythagoras.")}
        words={tx(t, "phKin2_compWords", "The horizontal part is the speed times the cosine of the angle; the vertical part is the speed times the sine.")}>
        {r`v_x = v\cos\theta \qquad v_y = v\sin\theta \qquad v = \sqrt{v_x^2 + v_y^2}`}
      </Equation>

      <H2>{tx(t, "phKin2_indTitle", "Two motions that ignore each other")}</H2>
      <p>
        {tx(t, "phKin2_indBody",
          "Fire a ball horizontally off a table and, at the same instant, drop a second ball from the same height. Which lands first? They land together. The fired ball's sideways speed does nothing to its fall: gravity pulls straight down, so it only changes the vertical velocity, and nothing acts sideways, so the horizontal velocity never changes. High-speed photographs show the two balls at the same height in every frame. In vector form the acceleration is (0, −g): zero across, −g up.")}
      </p>
      <LessonTable
        headers={["", tx(t, "phKin2_tHoriz", "Horizontal (x)"), tx(t, "phKin2_tVert", "Vertical (y)")]}
        rows={[
          [tx(t, "phKin2_tAcc", "acceleration"), "0", "−g"],
          [tx(t, "phKin2_tVel", "velocity"), "vₓ = v₀ cos θ " + tx(t, "phKin2_tConst", "(constant)"), "v_y = v₀ sin θ − g t"],
          [tx(t, "phKin2_tPos", "position"), "x = v₀ cos θ · t", "y = h + v₀ sin θ · t − ½ g t²"],
          [tx(t, "phKin2_tLike", "behaves like"), tx(t, "phKin2_tLikeX", "a car at steady speed"), tx(t, "phKin2_tLikeY", "a ball thrown straight up")],
        ]}
      />
      <p>
        {tx(t, "phKin2_indBody2",
          "The only thing the two motions share is the clock. Time is the link: find t from one direction, use it in the other. In the figure, the green ball on the wall and the blue ball on the ground are the two \"shadows\" of the real ball. Watch them while the real ball flies.")}
      </p>
      <ProjectileFigure t={t} />

      <H2>{tx(t, "phKin2_pathTitle", "The path is a parabola")}</H2>
      <p>
        {tx(t, "phKin2_pathBody",
          "To get the shape of the path, y as a function of x, remove time from the two position equations. The horizontal one gives t directly.")}
      </p>
      <Derivation t={t} label={tx(t, "phKin2_eqPath", "The trajectory y(x)")}
        steps={[
          { tex: r`x = v_0\cos\theta\; t \quad\Rightarrow\quad t = \frac{x}{v_0\cos\theta}`, why: tx(t, "phKin2_p1", "solve the horizontal equation for t") },
          { tex: r`y = h + v_0\sin\theta\,\frac{x}{v_0\cos\theta} - \frac12 g \left(\frac{x}{v_0\cos\theta}\right)^2`, why: tx(t, "phKin2_p2", "put that t into the vertical equation") },
          { tex: r`y = \green{h + x\tan\theta - \frac{g}{2 v_0^2 \cos^2\theta}\, x^2}`, why: tx(t, "phKin2_p3", "sin θ / cos θ = tan θ, and square the last fraction") },
        ]} />
      <p>
        {tx(t, "phKin2_pathBody2",
          "That is a quadratic in x with a negative x² coefficient: a downward-opening parabola, as in the Math track's quadratics chapter. The constant term h is the launch height, the tan θ term is the straight line the ball would follow without gravity, and the x² term is how far gravity has pulled it below that line. The pull grows with the square of the distance.")}
      </p>

      <H2>{tx(t, "phKin2_numTitle", "Flight time, height and range")}</H2>
      <p>
        {tx(t, "phKin2_numBody",
          "For a launch from the ground (h = 0), three numbers describe the flight. The ball is highest when its vertical velocity is zero; it lands when y comes back to 0; the range is how far it went sideways in that time.")}
      </p>
      <Derivation t={t} label={tx(t, "phKin2_eqRange", "From the launch to the landing (h = 0)")}
        steps={[
          { tex: r`v_y = v_0\sin\theta - g\,t_{\text{top}} = 0 \;\Rightarrow\; t_{\text{top}} = \frac{v_0\sin\theta}{g}`, why: tx(t, "phKin2_r1", "at the top the vertical velocity is zero") },
          { tex: r`H = v_0\sin\theta\, t_{\text{top}} - \tfrac12 g\, t_{\text{top}}^2 = \frac{v_0^2\sin^2\theta}{2g}`, why: tx(t, "phKin2_r2", "the height at that moment") },
          { tex: r`T = 2\,t_{\text{top}} = \frac{2 v_0 \sin\theta}{g}`, why: tx(t, "phKin2_r3", "rising and falling take equal times, from ground to ground") },
          { tex: r`R = v_0\cos\theta \cdot T = \frac{2 v_0^2 \sin\theta\cos\theta}{g}`, why: tx(t, "phKin2_r4", "horizontal speed × flight time") },
          { tex: r`R = \green{\frac{v_0^2 \sin 2\theta}{g}}`, why: tx(t, "phKin2_r5", "the double-angle identity 2 sin θ cos θ = sin 2θ") },
        ]} />
      <Equation label={tx(t, "phKin2_eqSum", "Launch from the ground: the three results")}
        where={[
          [r`T`, tx(t, "phKin2_wT", "time of flight (s)")],
          [r`H`, tx(t, "phKin2_wH", "maximum height (m)")],
          [r`R`, tx(t, "phKin2_wR", "range, the horizontal distance to the landing point (m)")],
          [r`\sin 2\theta`, tx(t, "phKin2_wS2", "largest (= 1) when 2θ = 90°, that is θ = 45°")],
        ]}
        words={tx(t, "phKin2_sumWords", "All three grow with the launch speed; the range grows with its square. The angle decides how that speed is shared between going up and going across.")}>
        {r`T = \frac{2 v_0\sin\theta}{g} \qquad H = \frac{v_0^2\sin^2\theta}{2g} \qquad R = \frac{v_0^2\sin 2\theta}{g}`}
      </Equation>
      <p>
        {tx(t, "phKin2_angleBody",
          "Two facts fall out of sin 2θ. First, the longest range from flat ground is at θ = 45°, giving R_max = v₀²/g. Steeper angles waste speed going up; flatter ones land too soon. Second, complementary angles, which add up to 90°, give the same range: sin(2 · 30°) = sin 60° = sin 120° = sin(2 · 60°). The 60° shot goes higher and takes longer, but lands in the same spot.")}
      </p>
      <LiveFormula label={tx(t, "phKin2_liveRange", "Try it: range from flat ground")}
        tex={r`R = \frac{v_0^2 \sin 2\theta}{g} \qquad H = \frac{v_0^2 \sin^2\theta}{2g} \qquad T = \frac{2 v_0 \sin\theta}{g}`}
        vars={[
          { id: "v0", label: "v₀ (m/s)", min: 5, max: 30, step: 0.5, value: 20, fmt: v => num(v, 1) },
          { id: "deg", label: "θ (°)", min: 0, max: 90, step: 1, value: 30, fmt: v => num(v, 0) },
        ]}
        compute={rangeNumbers(t)}
        note={tx(t, "phKin2_liveRangeNote", "Start at 30°: 35.3 m. Move to 60°: the range stays 35.3 m while the height triples. At 45° the meter is full: v₀²/g = 40.8 m for 20 m/s.")} />

      <H3>{tx(t, "phKin2_heightTitle", "Launching from a height")}</H3>
      <p>
        {tx(t, "phKin2_heightBody",
          "A shot put leaves the hand about 2 m above the ground, a stone is thrown from a cliff. Now the landing is at y = 0 while the launch is at y = h, so the flight is no longer symmetric and the time comes from the quadratic formula. The ball has extra time to fly sideways while it falls the last h metres, so the best angle is a little below 45°: about 42° for a shot put, much lower from a high cliff.")}
      </p>
      <Equation label={tx(t, "phKin2_eqHeight", "Flight time from a height h")}
        where={[
          [r`h`, tx(t, "phKin2_wHh", "launch height above the landing ground (m)")],
          [r`v_0\sin\theta`, tx(t, "phKin2_wVy0", "initial vertical velocity")],
        ]}
        note={tx(t, "phKin2_heightNote", "It is the positive root of 0 = h + v₀ sin θ · t − ½ g t². For h = 0 it reduces to 2 v₀ sin θ / g.")}>
        {r`T = \frac{v_0\sin\theta + \sqrt{(v_0\sin\theta)^2 + 2 g h}}{g}`}
      </Equation>

      <H2>{tx(t, "phKin2_airTitle", "What air does")}</H2>
      <p>
        {tx(t, "phKin2_airBody",
          "Everything above ignores the air. For a dense, slow object over a short distance that is fine. For a fast, light ball it is not: air pushes back against the motion with a force that grows roughly with the square of the speed, so it hurts most early on, when the ball is fastest. The real path is shorter than the parabola and no longer symmetric: it rises at a gentle slope and comes down steeply. The best angle drops: a well-hit baseball goes farthest at about 35°. Turn on \"air drag\" in the figure to see it. The forces chapter explains drag; Game Dev's physics section shows how games simulate it step by step.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "phKin2_spinTip", "Spin adds another force, the Magnus effect: backspin lifts a golf ball and makes it fly much farther than any parabola; topspin dips a tennis ball. These come from how the spinning ball drags the air around it, covered in the fluids chapters.")}
      </Callout>

      <H2>{tx(t, "phKin2_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "phKin2_ex1", "1. A ball is kicked at 20 m/s and 30° from flat ground. vₓ = 17.3 m/s, v_y = 10 m/s. Top after 10/9.81 = 1.02 s at H = 10²/(2 × 9.81) = 5.1 m. Lands after 2.04 s, at R = 17.3 × 2.04 = 35.3 m.")}</p>
      <p>{tx(t, "phKin2_ex2", "2. A stone is thrown horizontally at 10 m/s from a 45 m cliff. Vertically it is simply dropped: 45 = ½ × 9.81 × t², so t = 3.03 s. Horizontally it moves at 10 m/s all the time: it lands 30.3 m from the foot of the cliff, with v_y = 9.81 × 3.03 = 29.7 m/s downward.")}</p>
      <p>{tx(t, "phKin2_ex3", "3. What launch speed sends a ball 50 m at best? Best is 45° on flat ground, R_max = v₀²/g, so v₀ = √(50 × 9.81) = 22.1 m/s.")}</p>
      <H3>{tx(t, "phKin2_ex4Title", "The monkey and the hunter")}</H3>
      <p>{tx(t, "phKin2_ex4", "4. A hunter aims straight at a monkey hanging from a branch. The monkey lets go the instant the gun fires. Should the hunter aim lower? No. Without gravity the bullet would fly along the aiming line and hit the monkey. With gravity, the bullet and the monkey both fall ½ g t² below where they would have been, by the same amount at every moment. So the bullet still meets the monkey (if it gets there before the monkey reaches the ground). It is the independence of the two motions once more.")}</p>

      <H2>{tx(t, "phKin2_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "phKin2_tWrong", "Wrong"), tx(t, "phKin2_tRight", "Right"), tx(t, "phKin2_tWhy", "Why")]}
        rows={[
          [tx(t, "phKin2_m1w", "v = 0 at the top"), tx(t, "phKin2_m1r", "only v_y = 0; vₓ is unchanged"), tx(t, "phKin2_m1", "nothing acts sideways")],
          [tx(t, "phKin2_m2w", "a faster horizontal shot falls slower"), tx(t, "phKin2_m2r", "it falls exactly as a dropped ball"), tx(t, "phKin2_m2", "the motions are independent")],
          [tx(t, "phKin2_m3w", "45° is always the best angle"), tx(t, "phKin2_m3r", "only from flat ground without air"), tx(t, "phKin2_m3", "height and drag lower it")],
          [tx(t, "phKin2_m4w", "sin and cos swapped"), tx(t, "phKin2_m4r", "vₓ = v cos θ when θ is from the horizontal"), tx(t, "phKin2_m4", "cos goes with the side next to the angle")],
          [tx(t, "phKin2_m5w", "calculator in radians with degrees typed"), tx(t, "phKin2_m5r", "check the angle mode"), tx(t, "phKin2_m5", "sin 30 (rad) = −0.99, not 0.5")],
        ]}
      />

      <KeyIdeas t={t} id="phKin2" items={[
        "A velocity splits into vₓ = v cos θ and v_y = v sin θ.",
        "Without air, horizontal motion is constant speed and vertical motion is free fall; time is the only link.",
        "The path is a downward parabola: y = h + x tan θ − g x² / (2 v₀² cos² θ).",
        "From flat ground: T = 2 v₀ sin θ / g, H = v₀² sin² θ / (2g), R = v₀² sin 2θ / g.",
        "The range is largest at 45°, and complementary angles land in the same place.",
        "From a height or through air the best angle is below 45°.",
      ]} />
    </Article>
  );
}
