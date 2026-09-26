"use client";

// Trigonometry 5: polar coordinates and atan2 — (r, θ) and converting both
// ways, the ranges of asin/acos/atan, atan2 for the full circle, many names
// for one angle, wrapping and the shortest turn, interpolating angles,
// polar curves, radial menus, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { Atan2Figure } from "@/components/lesson/figures/math/Atan2Figure";
import { PolarFigure } from "@/components/lesson/figures/math/PolarFigure";

const r = String.raw;

export function PolarContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPol_intro",
          "A radar screen, a radial menu, a turret's aim, a spiral galaxy, a bullet-hell pattern: some positions are more naturally described by \"how far, in which direction\" than by \"how far right, how far up\". That description is polar coordinates. This chapter converts between the two systems, meets atan2, the function that answers \"which direction is that?\" for the whole circle, and learns to handle the fact that one direction has infinitely many angle names.")}
      </Lead>

      <H2>{tx(t, "mPol_defTitle", "Polar coordinates")}</H2>
      <p>
        {tx(t, "mPol_defBody",
          "Instead of (x, y), describe a point by its distance r from the origin (the pole) and the angle θ its direction makes with the positive x-axis. Going from polar to Cartesian is the unit circle chapter again: the direction at angle θ is (cos θ, sin θ), and walking r along it gives (r cos θ, r sin θ). Going back, r is the distance formula, √(x² + y²). The angle is the hard part: it needs an inverse function, and the ordinary inverses are not quite up to the job.")}
      </p>

      <H2>{tx(t, "mPol_invTitle", "The inverse functions only see half the circle")}</H2>
      <p>
        {tx(t, "mPol_invBody",
          "Every value of sine between −1 and 1 is taken by two angles in each turn (sin 30° = sin 150° = 0.5), and by infinitely many once whole turns are added. A function must return one answer, so each inverse picks one principal range and stays there. asin returns angles from −90° to 90°, the right half of the circle. acos returns 0° to 180°, the upper half. atan returns −90° to 90° again. None of them alone covers a full turn, so none can tell every direction apart.")}
      </p>
      <Equation label={tx(t, "mPol_eqRanges", "Principal ranges")}
        where={[
          [r`\arcsin x`, tx(t, "mPol_wAsin", "for −1 ≤ x ≤ 1, an angle in [−π/2, π/2]")],
          [r`\arccos x`, tx(t, "mPol_wAcos", "for −1 ≤ x ≤ 1, an angle in [0, π]")],
          [r`\arctan x`, tx(t, "mPol_wAtan", "for any x, an angle in (−π/2, π/2); the ends are never reached")],
        ]}>
        {r`\arcsin: [-1, 1] \to [-\tfrac{\pi}{2}, \tfrac{\pi}{2}] \qquad \arccos: [-1, 1] \to [0, \pi] \qquad \arctan: \mathbb{R} \to (-\tfrac{\pi}{2}, \tfrac{\pi}{2})`}
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
      <p>
        {tx(t, "mPol_atan2How",
          "What atan2 does inside is simple: compute atan(y/x), which is right when x > 0; when x < 0 the point is on the other side, so add or subtract π (half a turn) according to the sign of y; when x = 0 answer ±π/2 straight away. At the origin itself there is no direction at all; most libraries return 0 there, so check for a zero vector before trusting the angle.")}
      </p>

      <H2>{tx(t, "mPol_manyTitle", "One direction, many angles")}</H2>
      <p>
        {tx(t, "mPol_manyBody",
          "A point has one pair (x, y) but many polar names: adding a full turn gives the same direction, so (r, θ), (r, θ + 2π) and (r, θ − 2π) are the same point. Comparing or subtracting angles is therefore dangerous. Wrapping picks one representative, usually in (−π, π]. The difference between a target direction and the current heading, once wrapped, is the shortest turn: its sign says which way (positive is anticlockwise) and its size how far. The second mode of the figure shows the difference before and after wrapping.")}
      </p>
      <PolarFigure t={t} />
      <Callout type="warn" t={t}>
        {tx(t, "mTrig_wrapWarn", "Angles wrap: 350° and −10° are the same direction, and the difference between 350° and 10° is 20°, not 340°. Always wrap a difference into (−π, π] before using it to turn, interpolate or compare, or objects will spin the long way round.")}
      </Callout>
      <H3>{tx(t, "mPol_lerpTitle", "Interpolating angles")}</H3>
      <p>
        {tx(t, "mPol_lerpBody",
          "The same care applies to blending. Lerping from 170° to −170° with the ratios chapter's formula passes through 0°, a 340° sweep the wrong way. Lerp the wrapped difference instead: a + t · wrap(b − a) goes from 170° through 180° to 190° (= −170°), 20° in total. For turning at a limited speed, clamp the wrapped difference to the largest step allowed this frame.")}
      </p>
      <Equation label={tx(t, "mPol_eqWrap", "Shortest difference and angle lerp")}
        where={[
          [r`\operatorname{wrap}(\delta)`, tx(t, "mPol_wWrap", "the angle δ moved by whole turns into (−π, π]")],
          [r`t`, tx(t, "mPol_wT", "the blend factor, from 0 (at a) to 1 (at b)")],
        ]}>
        {r`\Delta = \operatorname{wrap}(b - a) \qquad \operatorname{lerpAngle}(a, b, t) = a + t\,\Delta`}
      </Equation>

      <H2>{tx(t, "mPol_curvesTitle", "Curves in polar form")}</H2>
      <p>
        {tx(t, "mPol_curvesBody",
          "Some curves are awkward as y = f(x) but simple as r = f(θ): the distance from the centre as a function of the direction. A circle is r = constant. An Archimedean spiral, r = bθ, moves out by the same amount every turn, like a coiled rope or a spiral bullet pattern. A cardioid, r = a(1 + cos θ), is heart-shaped and is the pickup pattern of many microphones. A rose, r = a cos(kθ), has petals. In code, sample θ in small steps, compute r, convert to (x, y) and join the points.")}
      </p>
      <H3>{tx(t, "mPol_menuTitle", "Radial menus and sectors")}</H3>
      <p>
        {tx(t, "mPol_menuBody",
          "A radial menu with n slices asks one polar question: in which slice is the cursor? Convert the cursor's offset from the menu centre to (r, θ). If r is small, nothing is selected (the dead zone in the middle). Otherwise shift θ into [0, 2π), divide by the slice width 2π/n and round down: the result is the slice index. A vision cone is the same test with one slice: the target is visible when its distance is within range and the wrapped difference between its direction and the facing direction is at most half the cone's angle.")}
      </p>

      <H2>{tx(t, "mPol_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mPol_ex1",
          "1. (−3, 3) in polar: r = √18 ≈ 4.24; atan2(3, −3) = 135° (quadrant II). atan(3/−3) = atan(−1) = −45° would point the opposite way. Back: 4.24 · (cos 135°, sin 135°) = (−3, 3) ✓.")}
      </p>
      <p>
        {tx(t, "mPol_ex2",
          "2. A ship heads at 170° and must face −150°. The raw difference is −320°; wrapped, +40°. It turns 40° anticlockwise, through 180°, not 320° clockwise.")}
      </p>
      <p>
        {tx(t, "mPol_ex3",
          "3. An 8-slice radial menu; the cursor is at offset (−2, −1). θ = atan2(−1, −2) ≈ −153.4°, shifted to 206.6°. The slice width is 45°, so the slice is floor(206.6 / 45) = 4, counting anticlockwise from slice 0 at the right.")}
      </p>

      <H2>{tx(t, "mPol_codeTitle", "Angles in C++")}</H2>
      <p>
        {tx(t, "mPol_codeBody",
          "These helpers cover most angle work in a game: conversion both ways, wrapping, turning towards a target at limited speed, lerping and the radial-menu slice. They all keep angles in radians.")}
      </p>
      <CodeBlock lang="cpp" filename="angles.hpp" t={t}>{`#include <algorithm>
#include <cmath>
#include <numbers>

constexpr float PI = std::numbers::pi_v<float>, TAU = 2.0f * PI;
struct Vec2 { float x, y; };
struct Polar { float r, theta; };

Polar toPolar(Vec2 p)     { return { std::sqrt(p.x * p.x + p.y * p.y), std::atan2(p.y, p.x) }; }
Vec2  toCartesian(Polar q) { return { q.r * std::cos(q.theta), q.r * std::sin(q.theta) }; }

// Wrap any angle into (-π, π]
float wrapAngle(float a) {
    a = std::fmod(a + PI, TAU);
    if (a <= 0.0f) a += TAU;
    return a - PI;
}

// Turn 'current' toward 'target' by at most maxStep radians, the short way round
float rotateToward(float current, float target, float maxStep) {
    float diff = wrapAngle(target - current);            // signed, in (-π, π]
    return current + std::clamp(diff, -maxStep, maxStep);
}

float lerpAngle(float a, float b, float t) { return a + t * wrapAngle(b - a); }

// Which of n slices of a radial menu is the offset p in? -1 inside the dead zone.
int radialSlice(Vec2 p, int n, float deadZone) {
    Polar q = toPolar(p);
    if (q.r < deadZone) return -1;
    float a = q.theta < 0.0f ? q.theta + TAU : q.theta;  // [0, 2π)
    return std::min(n - 1, int(a / (TAU / n)));
}

// A turret aiming at the mouse at 3 radians per second:
//   float want = std::atan2(mouse.y - turret.y, mouse.x - turret.x);
//   turret.angle = rotateToward(turret.angle, want, 3.0f * dt);`}</CodeBlock>

      <H2>{tx(t, "mPol_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTrig_tSym", "Symptom"), tx(t, "mTrig_tCause", "Cause"), tx(t, "mTrig_tFix", "Fix")]}
        rows={[
          [tx(t, "mTrig_b2", "Turret aims backwards on one side"), tx(t, "mTrig_c2", "atan(y/x) instead of atan2(y, x)"), tx(t, "mTrig_f2", "atan2, with y first")],
          [tx(t, "mTrig_b3", "Object spins the long way round"), tx(t, "mTrig_c3", "raw angle difference"), tx(t, "mTrig_f3", "wrap the difference into (−π, π]")],
          [tx(t, "mTrig_b4", "NaN from acos or asin"), tx(t, "mTrig_c4", "argument slightly outside [−1, 1] after rounding"), tx(t, "mTrig_f4", "clamp the argument first")],
          [tx(t, "mPol_b1", "Aim points right when the target is on top of you"), tx(t, "mPol_c1", "atan2(0, 0) returns 0"), tx(t, "mPol_f1", "skip aiming when the offset is (almost) zero")],
          [tx(t, "mPol_b2", "atan2(x, y) gives strange angles"), tx(t, "mPol_c2", "arguments swapped"), tx(t, "mPol_f2", "y comes first: atan2(y, x)")],
        ]}
      />

      <KeyIdeas t={t} id="mPol" items={[
        "Polar (r, θ): x = r cos θ, y = r sin θ; back: r = √(x² + y²), θ = atan2(y, x).",
        "asin, acos and atan each cover only half the circle; atan2 covers all of it.",
        "An angle plus any number of full turns is the same direction.",
        "Wrap differences into (−π, π] to get the shortest turn and to lerp angles.",
        "Polar curves give r as a function of θ: circles, spirals, roses, cardioids.",
        "Radial menus and vision cones are polar tests: distance plus wrapped angle.",
      ]} />
    </Article>
  );
}
