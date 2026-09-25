"use client";

// Foundations 4: trigonometry — angles and radians, right triangles, the unit
// circle, identities, the rotation formula, polar coordinates and atan2,
// waves, and the law of cosines.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { UnitCircleFigure } from "@/components/lesson/figures/math/UnitCircleFigure";
import { Atan2Figure } from "@/components/lesson/figures/math/Atan2Figure";
import { WaveFigure } from "@/components/lesson/figures/math/WaveFigure";

const r = String.raw;

export function TrigContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTrig_intro",
          "Trigonometry began as the study of triangles, for surveying land and navigating by the stars. For graphics it is the bridge between angles and coordinates: turning \"face 30° to the left\" into a direction vector, turning a mouse position into an aiming angle, rotating a sprite, making things bob, pulse and orbit. Everything here comes from one picture, a point moving around a circle.")}
      </Lead>

      <H2>{tx(t, "mTrig_radTitle", "Degrees and radians")}</H2>
      <p>
        {tx(t, "mTrig_radBody",
          "Degrees split a full turn into 360 parts, a number the Babylonians liked because it divides evenly by so many others. Radians measure an angle by the arc it cuts out of a circle: the arc length divided by the radius. On a circle of radius 1, an angle of θ radians cuts an arc exactly θ long. A full turn is the whole circumference, 2π ≈ 6.283 radians. Every trigonometric function in C++, GLSL and every other programming language takes radians, and radians make the calculus of sine and cosine clean (for small angles, sin θ ≈ θ only in radians).")}
      </p>
      <Equation label={tx(t, "mTrig_eqRad", "Radians")}
        where={[
          [r`\theta`, tx(t, "mTrig_wTheta", "the angle in radians")],
          [r`s`, tx(t, "mTrig_wS", "the length of the arc between the two sides of the angle")],
          [r`\rho`, tx(t, "mTrig_wRho", "the radius of the circle. Because s grows in proportion to ρ, the ratio does not depend on the circle's size")],
        ]}
        note={tx(t, "mTrig_eqRadNote", "Useful values: 90° = π/2, 180° = π, 360° = 2π, 1 rad ≈ 57.3°. Keep angles in radians inside code and convert only at the edges (UI, level files).")}>
        {r`\theta = \frac{s}{\rho} \qquad \theta_{\text{rad}} = \theta_{\text{deg}}\cdot\frac{\pi}{180}`}
      </Equation>

      <H2>{tx(t, "mTrig_triTitle", "Right triangles")}</H2>
      <p>
        {tx(t, "mTrig_triBody",
          "In a triangle with one 90° corner, the side opposite that corner is the longest, the hypotenuse. Pick one of the other angles, θ. The side touching θ (not the hypotenuse) is the adjacent side, the side across from it is the opposite side. Because all right triangles with the same θ have the same shape (only the size differs), the ratios between their sides depend only on θ. Those ratios are sine, cosine and tangent. The mnemonic SOH-CAH-TOA lists them.")}
      </p>
      <Equation label={tx(t, "mTrig_eqSoh", "Sine, cosine, tangent and Pythagoras")}
        where={[
          [r`\text{opp},\ \text{adj},\ \text{hyp}`, tx(t, "mTrig_wSides", "the opposite side, the adjacent side and the hypotenuse, relative to the angle θ")],
          [r`a^2 + b^2 = c^2`, tx(t, "mTrig_wPyth", "Pythagoras: the squares on the two short sides add up to the square on the hypotenuse. It is how every length and distance in this track is computed")],
        ]}>
        {r`\sin\theta = \frac{\text{opp}}{\text{hyp}} \qquad \cos\theta = \frac{\text{adj}}{\text{hyp}} \qquad \tan\theta = \frac{\text{opp}}{\text{adj}} = \frac{\sin\theta}{\cos\theta} \qquad a^2 + b^2 = c^2`}
      </Equation>

      <H2>{tx(t, "mTrig_unitTitle", "The unit circle")}</H2>
      <p>
        {tx(t, "mTrig_unitBody",
          "Triangles only give angles up to 90°. The unit circle extends the definitions to every angle. Place a circle of radius 1 at the origin and walk counter-clockwise from the point (1, 0) through an angle θ. The point you reach has coordinates (cos θ, sin θ). For angles below 90° this is the triangle definition with hyp = 1, and for larger or negative angles it simply keeps going around the circle, with signs that follow the quadrant.")}
      </p>

      <UnitCircleFigure t={t} />

      <LessonTable
        headers={["θ", "0", "30° = π/6", "45° = π/4", "60° = π/3", "90° = π/2"]}
        rows={[
          ["sin θ", "0", "1/2", "√2/2 ≈ 0.707", "√3/2 ≈ 0.866", "1"],
          ["cos θ", "1", "√3/2 ≈ 0.866", "√2/2 ≈ 0.707", "1/2", "0"],
          ["tan θ", "0", "√3/3 ≈ 0.577", "1", "√3 ≈ 1.732", tx(t, "mTrig_undef", "undefined")],
        ]}
      />
      <p>
        {tx(t, "mTrig_dirBody",
          "The most common use in games follows directly: a direction at angle θ is the vector (cos θ, sin θ), with length 1. A sprite facing 30° moves along (cos 30°, sin 30°) · speed. Points on a circle of radius R around a centre c are c + R(cos θ, sin θ), which is how you place enemies in a ring, draw a circle with line segments or make a moon orbit.")}
      </p>

      <H2>{tx(t, "mTrig_idTitle", "The identities you actually need")}</H2>
      <Equation label={tx(t, "mTrig_eqIds", "Core identities")}
        where={[
          [r`\sin^2\theta + \cos^2\theta = 1`, tx(t, "mTrig_wPyth2", "Pythagoras on the unit circle: the point is at distance 1 from the origin")],
          [r`\sin(-\theta) = -\sin\theta,\ \cos(-\theta) = \cos\theta`, tx(t, "mTrig_wSym", "mirroring the angle below the x axis flips the y coordinate only")],
          [r`\sin(\theta + \tfrac{\pi}{2}) = \cos\theta`, tx(t, "mTrig_wShift", "cosine is sine a quarter turn ahead: the same wave, shifted")],
          [r`\cos(\alpha + \beta),\ \sin(\alpha + \beta)`, tx(t, "mTrig_wSum", "the angle-sum formulas, which give the rotation formula below")],
        ]}>
        {r`\cos(\alpha+\beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta \qquad \sin(\alpha+\beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta`}
      </Equation>

      <H3>{tx(t, "mTrig_rotTitle", "Rotating a point")}</H3>
      <p>
        {tx(t, "mTrig_rotBody",
          "Any point (x, y) can be written by its distance ρ from the origin and its angle φ: (ρ cos φ, ρ sin φ). Rotating it by θ around the origin keeps ρ and adds θ to the angle: (ρ cos(φ + θ), ρ sin(φ + θ)). Expanding with the angle-sum formulas and replacing ρ cos φ by x and ρ sin φ by y gives the rotation formula, without any angle φ left in it. That formula, written as a matrix, is the 2D rotation matrix of every graphics API.")}
      </p>
      <Equation label={tx(t, "mTrig_eqRot", "Rotation by θ around the origin")}
        where={[
          [r`(x, y)`, tx(t, "mTrig_wXY", "the original point")],
          [r`(x', y')`, tx(t, "mTrig_wXY2", "the rotated point")],
          [r`\theta`, tx(t, "mTrig_wRotTheta", "the rotation angle, counter-clockwise for positive θ (with y pointing up)")],
        ]}
        note={tx(t, "mTrig_eqRotNote", "To rotate around another point c, subtract c, rotate, add c back. Check θ = 90°: (1, 0) goes to (0, 1). With y pointing down, as in most 2D screen coordinates, the same formula turns clockwise on screen.")}>
        {r`x' = x\cos\theta - y\sin\theta \qquad y' = x\sin\theta + y\cos\theta`}
      </Equation>

      <H2>{tx(t, "mTrig_polarTitle", "From coordinates back to angles: atan2")}</H2>
      <p>
        {tx(t, "mTrig_polarBody",
          "The reverse question is at least as common: the mouse is at (x, y) relative to the turret, which angle should it face? The inverse functions asin, acos and atan return angles, but each only covers half the circle. atan(y/x) is the classic trap: y/x is the same for (1, 1) and (−1, −1), so it cannot tell opposite directions apart, and it divides by zero straight up. atan2(y, x) takes the two coordinates separately, looks at their signs to find the quadrant, and returns the full angle in (−π, π].")}
      </p>

      <Atan2Figure t={t} />

      <Equation label={tx(t, "mTrig_eqPolar", "Polar coordinates")}
        where={[
          [r`\rho`, tx(t, "mTrig_wR", "the distance from the origin (the length of the vector)")],
          [r`\theta`, tx(t, "mTrig_wPolarTheta", "the angle from the positive x axis, from atan2; note the argument order, y first")],
        ]}>
        {r`\rho = \sqrt{x^2 + y^2}, \quad \theta = \operatorname{atan2}(y, x) \qquad\Longleftrightarrow\qquad x = \rho\cos\theta, \quad y = \rho\sin\theta`}
      </Equation>
      <CodeBlock lang="cpp" filename="angles.hpp" t={t}>{`constexpr float PI = 3.14159265358979f;

// Wrap any angle into (-π, π]
float wrapAngle(float a) {
    a = std::fmod(a + PI, 2 * PI);
    if (a < 0) a += 2 * PI;
    return a - PI;
}

// Turn 'current' toward 'target' by at most maxStep radians, the short way round
float rotateToward(float current, float target, float maxStep) {
    float diff = wrapAngle(target - current);            // signed, in (-π, π]
    return current + std::clamp(diff, -maxStep, maxStep);
}

// A turret aiming at the mouse at 3 radians per second
float want = std::atan2(mouse.y - turret.y, mouse.x - turret.x);
turret.angle = rotateToward(turret.angle, want, 3.0f * dt);`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "mTrig_wrapWarn", "Angles wrap: 350° and −10° are the same direction, and the difference between 350° and 10° is 20°, not 340°. Always wrap a difference into (−π, π] before using it to turn, interpolate or compare, or objects will spin the long way round.")}
      </Callout>

      <H2>{tx(t, "mTrig_waveTitle", "Waves")}</H2>
      <p>
        {tx(t, "mTrig_waveBody",
          "Unroll the unit circle over time and the height of the moving point traces a sine wave: the smoothest possible back-and-forth motion. Four numbers shape it, the same four as the function transformations of the algebra chapter: amplitude (how far), frequency (how often), phase (where in the cycle it starts) and offset (around which value).")}
      </p>
      <Equation label={tx(t, "mTrig_eqWave", "A sinusoid")}
        where={[
          [r`A`, tx(t, "mTrig_wA", "the amplitude: the wave goes from C − A to C + A")],
          [r`f`, tx(t, "mTrig_wF", "the frequency in cycles per second (Hz). The period, the duration of one cycle, is T = 1/f")],
          [r`2\pi f`, tx(t, "mTrig_wOmega", "the angular frequency ω, in radians per second: it converts seconds into an angle so that one period is one full turn")],
          [r`\varphi`, tx(t, "mTrig_wPhi", "the phase: a head start along the cycle, in radians. Giving each object a different φ keeps a row of bobbing coins from moving in lockstep")],
          [r`C`, tx(t, "mTrig_wC", "the offset: the centre line")],
        ]}>
        {r`y(t) = A\,\sin(2\pi f\,t + \varphi) + C`}
      </Equation>

      <WaveFigure t={t} />

      <p>
        {tx(t, "mTrig_waveUses",
          "Uses are everywhere: a hovering pickup bobs with A = 0.1 m and f = 0.5 Hz, a warning light pulses its brightness, a day–night cycle drives the sun's height with a period of 20 minutes, water surfaces sum several sines of different directions and frequencies (Gerstner waves in the GLSL track), and an idle character breathes by scaling its chest. Adding sines with unrelated frequencies gives motion that never visibly repeats, a cheap alternative to noise.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTrig_timeTip", "sin(time · ω) with a float time that keeps growing loses precision after hours: at time = 100 000 s, float time has a resolution of about 8 ms, and fast waves stutter. Wrap the phase instead: phase = fmod(phase + ω·dt, 2π).")}
      </Callout>

      <H2>{tx(t, "mTrig_cosLawTitle", "Any triangle: the law of cosines")}</H2>
      <p>
        {tx(t, "mTrig_cosLawBody",
          "Pythagoras only works with a 90° corner. The law of cosines generalises it to any triangle, with a correction term that vanishes when the angle is 90° (cos 90° = 0). Its most famous game use is two-bone inverse kinematics: given the upper-arm length, the forearm length and the distance from shoulder to the hand's target, it gives the elbow angle directly.")}
      </p>
      <Equation label={tx(t, "mTrig_eqCosLaw", "Law of cosines")}
        where={[
          [r`a, b`, tx(t, "mTrig_wAB", "two sides of the triangle (upper arm and forearm)")],
          [r`c`, tx(t, "mTrig_wCside", "the third side, opposite the angle γ (shoulder-to-target distance)")],
          [r`\gamma`, tx(t, "mTrig_wGamma", "the angle between a and b (the elbow). Solving for it: cos γ = (a² + b² − c²) / 2ab")],
        ]}
        note={tx(t, "mTrig_eqCosLawNote", "If c > a + b the target is out of reach and the fraction falls below −1: clamp it to [−1, 1] before calling acos, or the result is NaN.")}>
        {r`c^2 = a^2 + b^2 - 2ab\cos\gamma \qquad\Longrightarrow\qquad \gamma = \arccos\frac{a^2 + b^2 - c^2}{2ab}`}
      </Equation>

      <H3>{tx(t, "mTrig_fovTitle", "Tangent and the field of view")}</H3>
      <p>
        {tx(t, "mTrig_fovBody",
          "A perspective camera with a vertical field of view θ sees, at distance d in front of it, a slab of height 2d·tan(θ/2): the half-angle and the distance form a right triangle with the half-height as the opposite side. That is why tan(fov/2) appears in every projection matrix, and why doubling the distance doubles the visible height.")}
      </p>

      <LessonTable
        headers={[tx(t, "mTrig_tSym", "Symptom"), tx(t, "mTrig_tCause", "Cause"), tx(t, "mTrig_tFix", "Fix")]}
        rows={[
          [tx(t, "mTrig_b1", "Rotations about 57 times too big"), tx(t, "mTrig_c1", "degrees passed to sin/cos"), tx(t, "mTrig_f1", "convert with π/180 (or glm::radians)")],
          [tx(t, "mTrig_b2", "Turret aims backwards on one side"), tx(t, "mTrig_c2", "atan(y/x) instead of atan2(y, x)"), tx(t, "mTrig_f2", "atan2, with y first")],
          [tx(t, "mTrig_b3", "Object spins the long way round"), tx(t, "mTrig_c3", "raw angle difference"), tx(t, "mTrig_f3", "wrap the difference into (−π, π]")],
          [tx(t, "mTrig_b4", "NaN from acos or asin"), tx(t, "mTrig_c4", "argument slightly outside [−1, 1] after rounding"), tx(t, "mTrig_f4", "clamp the argument first")],
          [tx(t, "mTrig_b5", "Rotation goes the wrong direction"), tx(t, "mTrig_c5", "screen y points down"), tx(t, "mTrig_f5", "negate θ, or flip y at the boundary between world and screen")],
        ]}
      />

      <KeyIdeas t={t} id="mTrig" items={[
        "Radians = arc length on a unit circle; 2π = 360°. Code always uses radians.",
        "The point at angle θ on the unit circle is (cos θ, sin θ): a unit direction.",
        "Rotation: x' = x cos θ − y sin θ, y' = x sin θ + y cos θ.",
        "atan2(y, x) recovers the full angle; wrap differences into (−π, π].",
        "A sin(2πft + φ) + C: amplitude, frequency, phase, offset.",
        "Law of cosines: c² = a² + b² − 2ab cos γ (two-bone IK).",
      ]} />
    </Article>
  );
}
