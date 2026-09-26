"use client";

// Trigonometry 2: radians and the unit circle — radians, arc length and
// angular speed, sine and cosine of every angle, directions and points on a
// circle, quadrant signs and reference angles, periodicity and symmetry, the
// graphs of sin, cos and tan, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { UnitCircleFigure } from "@/components/lesson/figures/math/UnitCircleFigure";
import { TrigGraphFigure } from "@/components/lesson/figures/math/TrigGraphFigure";

const r = String.raw;

export function UnitCircleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mUc_intro",
          "A right triangle only has angles up to 90°, but a game character can face any direction: 135°, 270°, or −30° after turning right. This chapter frees sine and cosine from the triangle by putting them on a circle, where they work for every angle, including negative ones and ones past a full turn. On the way it introduces the radian, the unit every programming language uses for angles.")}
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
      <p>
        {tx(t, "mUc_whyBody",
          "Why does the ratio s/ρ not depend on the circle? All circles are similar (the circle chapter), so scaling the circle scales the arc and the radius by the same factor. The conversion follows from one full turn: 360° is the whole circumference divided by the radius, 2πρ/ρ = 2π. So 180° = π, and one degree is π/180 radians.")}
      </p>
      <LessonTable
        headers={[tx(t, "mUc_tDeg", "Degrees"), "0°", "30°", "45°", "60°", "90°", "180°", "270°", "360°"]}
        rows={[[tx(t, "mUc_tRad", "Radians"), "0", "π/6", "π/4", "π/3", "π/2", "π", "3π/2", "2π"]]}
      />
      <H3>{tx(t, "mUc_arcTitle", "Arc length and angular speed")}</H3>
      <p>
        {tx(t, "mUc_arcBody",
          "Radians clean up the circle chapter's formulas. That chapter wrote an arc as θ/360 of the circumference; with θ in radians the fraction of a turn is θ/2π, so the arc is (θ/2π) · 2πr = rθ, and the sector's area is (θ/2π) · πr² = ½r²θ. The same idea links turning speed to moving speed: a wheel turning at ω radians per second (ω is the Greek letter omega) carries its rim at v = ωr metres per second, because every second the rim covers an arc of ω · r.")}
      </p>
      <Equation label={tx(t, "mUc_eqArc", "With the angle in radians")}
        where={[
          [r`s = r\theta`, tx(t, "mUc_wArc", "the length of the arc cut out by the angle θ")],
          [r`A = \tfrac12 r^2 \theta`, tx(t, "mUc_wSec", "the area of the sector")],
          [r`\omega`, tx(t, "mUc_wOmega", "the angular speed, in radians per second")],
          [r`v = \omega r`, tx(t, "mUc_wV", "the speed of a point at distance r from the centre")],
        ]}
        note={tx(t, "mUc_arcNote", "Example: a 0.35 m wheel turning at 20 rad/s moves the car at 20 · 0.35 = 7 m/s. A turret barrel 2 m long turning at 3 rad/s sweeps its tip at 6 m/s.")}>
        {r`s = r\,\theta \qquad A = \tfrac12\,r^2\,\theta \qquad v = \omega\,r`}
      </Equation>

      <H2>{tx(t, "mTrig_unitTitle", "The unit circle")}</H2>
      <p>
        {tx(t, "mTrig_unitBody",
          "Triangles only give angles up to 90°. The unit circle extends the definitions to every angle. Place a circle of radius 1 at the origin and walk counter-clockwise from the point (1, 0) through an angle θ. The point you reach has coordinates (cos θ, sin θ). For angles below 90° this is the triangle definition with hyp = 1, and for larger or negative angles it simply keeps going around the circle, with signs that follow the quadrant.")}
      </p>
      <Equation label={tx(t, "mUc_eqDef", "Sine and cosine of any angle")}
        where={[
          [r`\theta`, tx(t, "mUc_wAny", "any angle: positive turns anticlockwise from the positive x-axis, negative turns clockwise")],
          [r`(\cos\theta,\ \sin\theta)`, tx(t, "mUc_wPoint", "the point reached on the circle of radius 1: cosine is its x, sine its y")],
          [r`\tan\theta`, tx(t, "mUc_wTan", "sin θ / cos θ, the slope of the radius; undefined when cos θ = 0")],
        ]}>
        {r`P(\theta) = (\cos\theta,\ \sin\theta) \qquad \tan\theta = \frac{\sin\theta}{\cos\theta}`}
      </Equation>

      <UnitCircleFigure t={t} />

      <p>
        {tx(t, "mTrig_dirBody",
          "The most common use in games follows directly: a direction at angle θ is the vector (cos θ, sin θ), with length 1. A sprite facing 30° moves along (cos 30°, sin 30°) · speed. Points on a circle of radius R around a centre c are c + R(cos θ, sin θ), which is how you place enemies in a ring, draw a circle with line segments or make a moon orbit.")}
      </p>

      <H2>{tx(t, "mUc_signTitle", "Signs, quadrants and reference angles")}</H2>
      <p>
        {tx(t, "mUc_signBody",
          "The axes cut the plane into four quadrants, numbered I to IV anticlockwise from the top right. Since cos θ is the point's x and sin θ its y, their signs follow the quadrant: both positive in I; in II the point is left of the y-axis, so the cosine is negative; in III both are negative; in IV only the sine is. The sizes come from the reference angle, the acute angle between the radius and the x-axis. Reflecting a point in the axes does not change that angle, only the signs, so every angle's sine and cosine are the values of an angle between 0° and 90° with the right signs attached.")}
      </p>
      <Equation label={tx(t, "mUc_eqRef", "Reference angle by quadrant (degrees)")}
        where={[
          [r`\theta'`, tx(t, "mUc_wRef", "the reference angle, always between 0° and 90°")],
        ]}
        note={tx(t, "mUc_refNote", "Example: 150° is in quadrant II, reference angle 30°, so sin 150° = +sin 30° = 0.5 and cos 150° = −cos 30° ≈ −0.866. And 225° is in III, reference 45°: both values are −√2/2 ≈ −0.707.")}>
        {r`\text{I: } \theta' = \theta \qquad \text{II: } \theta' = 180^\circ - \theta \qquad \text{III: } \theta' = \theta - 180^\circ \qquad \text{IV: } \theta' = 360^\circ - \theta`}
      </Equation>

      <TrigGraphFigure t={t} />

      <H2>{tx(t, "mUc_periodTitle", "Going round again: periodicity and symmetry")}</H2>
      <p>
        {tx(t, "mUc_periodBody",
          "Adding a full turn, 2π, brings the point back to where it was, so sine and cosine repeat with period 2π: a function is periodic when its values repeat after a fixed step, the period. The tangent repeats every π already, because the opposite point of the circle, half a turn away, has both coordinates negated and their ratio unchanged. Turning by −θ mirrors the point in the x-axis: its y changes sign and its x stays. That makes sine an odd function and cosine an even one (the functions chapter's words for symmetric through the origin and mirror-symmetric about the y-axis).")}
      </p>
      <Equation label={tx(t, "mUc_eqPeriod", "Periods and symmetries")}
        where={[
          [r`k`, tx(t, "mUc_wK", "any whole number of extra turns, positive or negative")],
          [r`\sin(-\theta) = -\sin\theta`, tx(t, "mUc_wOdd", "sine is odd")],
          [r`\cos(-\theta) = \cos\theta`, tx(t, "mUc_wEven", "cosine is even")],
        ]}>
        {r`\sin(\theta + 2\pi k) = \sin\theta \qquad \cos(\theta + 2\pi k) = \cos\theta \qquad \tan(\theta + \pi k) = \tan\theta`}
      </Equation>
      <H3>{tx(t, "mUc_graphTitle", "The graphs")}</H3>
      <p>
        {tx(t, "mUc_graphBody",
          "Plotting the height of the moving point against the angle gives the sine wave; plotting its x gives the cosine wave, the same shape a quarter turn (π/2) ahead. Both stay between −1 and 1. The tangent graph looks different: it climbs from −∞ to +∞ on every stretch of length π and jumps at the angles where the cosine is zero (π/2, 3π/2, …), where the radius is vertical and its slope does not exist. The graphs mode of the figure shows all three. The Waves chapter stretches and shifts the sine wave to make motion.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mUc_screenInfo", "In most 2D screen coordinates y points down. The same formulas then turn clockwise on screen: angle 90° points down, not up. Either flip y when converting between world and screen, or accept that positive angles go clockwise in that space, but never mix the two conventions.")}
      </Callout>

      <H2>{tx(t, "mUc_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mUc_ex1",
          "1. Convert 225° to radians: 225 · π/180 = 5π/4 ≈ 3.927. Convert 2 rad to degrees: 2 · 180/π ≈ 114.6°.")}
      </p>
      <p>
        {tx(t, "mUc_ex2",
          "2. Eight enemies stand in a ring of radius 5 around (10, 3). Enemy i is at angle i · 2π/8 = i · π/4, so enemy 3 is at (10 + 5 cos(3π/4), 3 + 5 sin(3π/4)) = (10 − 3.54, 3 + 3.54) = (6.46, 6.54).")}
      </p>
      <p>
        {tx(t, "mUc_ex3",
          "3. What is sin 330°? Quadrant IV, reference angle 30°, sine negative there: −0.5. And cos(−60°) = cos 60° = 0.5, because cosine is even.")}
      </p>

      <H2>{tx(t, "mUc_codeTitle", "Circles of points in C++")}</H2>
      <p>
        {tx(t, "mUc_codeBody",
          "Angles stay in radians throughout. The ring function is the workhorse: it places objects around a centre, draws a circle with line segments or spawns particles in every direction. The wrap function keeps a growing angle in [0, 2π) so it does not lose float precision after many turns.")}
      </p>
      <CodeBlock lang="cpp" filename="circle_points.hpp" t={t}>{`#include <cmath>
#include <numbers>
#include <vector>

constexpr float PI  = std::numbers::pi_v<float>;
constexpr float TAU = 2.0f * PI;                 // one full turn in radians

struct Vec2 { float x, y; };

// Unit direction at angle a (radians, anticlockwise from +x)
Vec2 direction(float a) { return { std::cos(a), std::sin(a) }; }

// n points evenly spaced on a circle of radius r around c
std::vector<Vec2> ring(Vec2 c, float r, int n, float start = 0.0f) {
    std::vector<Vec2> pts;
    pts.reserve(n);
    for (int i = 0; i < n; ++i) {
        float a = start + i * TAU / n;
        pts.push_back({ c.x + r * std::cos(a), c.y + r * std::sin(a) });
    }
    return pts;
}

// Keep an ever-growing angle inside [0, 2π)
float wrap0To2Pi(float a) {
    a = std::fmod(a, TAU);
    return a < 0.0f ? a + TAU : a;
}

// A moon orbiting a planet at w radians per second
struct Orbit { float angle = 0, w = 0.5f, r = 4; };
Vec2 step(Orbit& o, Vec2 planet, float dt) {
    o.angle = wrap0To2Pi(o.angle + o.w * dt);
    return { planet.x + o.r * std::cos(o.angle), planet.y + o.r * std::sin(o.angle) };
}`}</CodeBlock>

      <H2>{tx(t, "mUc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mUc_tWrong", "Wrong"), tx(t, "mUc_tRight", "Right"), tx(t, "mUc_tWhy", "Why")]}
        rows={[
          [tx(t, "mUc_m1w", "degrees passed to sin/cos"), tx(t, "mUc_m1r", "multiply by π/180 first"), tx(t, "mUc_m1", "rotations come out about 57 times too big")],
          [tx(t, "mUc_m2w", "sin 150° = −0.5"), "sin 150° = +0.5", tx(t, "mUc_m2", "quadrant II has positive sine; only the cosine is negative")],
          [tx(t, "mUc_m3w", "tan 90° = a very big number"), tx(t, "mUc_m3r", "tan 90° is undefined"), tx(t, "mUc_m3", "it divides by cos 90° = 0; in floats you get a huge, meaningless value")],
          [tx(t, "mUc_m4w", "angle += w * dt forever"), tx(t, "mUc_m4r", "wrap it into [0, 2π)"), tx(t, "mUc_m4", "a large float angle loses precision and motion stutters")],
          [tx(t, "mUc_m5w", "arc = r · θ with θ in degrees"), tx(t, "mUc_m5r", "θ must be in radians"), tx(t, "mUc_m5", "s = rθ is the definition of the radian")],
        ]}
      />

      <KeyIdeas t={t} id="mUc" items={[
        "A radian is arc length divided by radius; a full turn is 2π, so 180° = π.",
        "With radians: arc s = rθ, sector ½r²θ, rim speed v = ωr.",
        "On the unit circle the point at angle θ is (cos θ, sin θ), for every θ.",
        "Signs follow the quadrant; sizes come from the reference angle.",
        "sin and cos repeat every 2π, tan every π; sin is odd, cos is even.",
        "c + r(cos θ, sin θ) places a point on a circle; it is how games build rings and orbits.",
      ]} />
    </Article>
  );
}
