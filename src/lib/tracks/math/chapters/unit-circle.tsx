"use client";

// Trigonometry 2: radians and the unit circle — radians, arc length and
// angular speed, sine and cosine of every angle, directions and points on a
// circle, quadrant signs and reference angles, periodicity and symmetry, the
// graphs of sin, cos and tan, and the exact values round the whole circle.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "A right triangle only has angles up to 90°, but angles in the world go further: a clock hand sweeps through 135° and 270°, a door swings back to −30°, a wheel turns through thousands of degrees. This chapter frees sine and cosine from the triangle by putting them on a circle, where they work for every angle, including negative ones and ones past a full turn. On the way it introduces the radian, the unit of angle that mathematics and physics prefer.")}
      </Lead>

      <H2>{tx(t, "mTrig_radTitle", "Degrees and radians")}</H2>
      <p>
        {tx(t, "mTrig_radBody",
          "Degrees split a full turn into 360 parts, a number the Babylonians liked because it divides evenly by so many others. Radians measure an angle by the arc it cuts out of a circle: the arc length divided by the radius. On a circle of radius 1, an angle of θ radians cuts an arc exactly θ long. A full turn is the whole circumference, 2π ≈ 6.283 radians. Radians turn arc lengths and turning speeds into plain multiplications, as the next section shows, and they make the calculus of sine and cosine clean (for small angles, sin θ ≈ θ only in radians).")}
      </p>
      <Equation label={tx(t, "mTrig_eqRad", "Radians")}
        where={[
          [r`\theta`, tx(t, "mTrig_wTheta", "the angle in radians")],
          [r`s`, tx(t, "mTrig_wS", "the length of the arc between the two sides of the angle")],
          [r`\rho`, tx(t, "mTrig_wRho", "the radius of the circle. Because s grows in proportion to ρ, the ratio does not depend on the circle's size")],
        ]}
        note={tx(t, "mTrig_eqRadNote", "Useful values: 90° = π/2, 180° = π, 360° = 2π, 1 rad ≈ 57.3°. Scientific calculators have a DEG/RAD switch: it decides which unit the sin key expects.")}>
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
        note={tx(t, "mUc_arcNote", "Example: a 0.35 m wheel turning at 20 rad/s moves the car at 20 · 0.35 = 7 m/s. The minute hand of a clock, 12 cm long, turns 2π rad per hour, so its tip travels 2π · 12 ≈ 75.4 cm every hour.")}>
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
          "Scaling and shifting gives every other circle. On a circle of radius R the point at angle θ is R(cos θ, sin θ), because the whole unit-circle picture is stretched by R. If the centre is c = (c₁, c₂) instead of the origin, add it: (c₁ + R cos θ, c₂ + R sin θ). That is how the positions of the seats of a Ferris wheel, the hour marks of a clock face or the corners of a regular polygon are worked out.")}
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
      <H3>{tx(t, "mUc_bearTitle", "Compass bearings turn the other way")}</H3>
      <p>
        {tx(t, "mUc_bearBody",
          "Maps and navigation measure a direction as a bearing: the angle from north, turning clockwise, so east is 090°, south 180° and west 270°. Mathematics measures from the positive x-axis (east) turning anticlockwise. The two start a quarter turn apart and turn in opposite directions, so θ = 90° − bearing (add 360° if the result is negative). Example: a ship sails 20 km on bearing 120°. Its maths angle is 90° − 120° = −30°, so it moves 20 cos(−30°) ≈ 17.3 km east and 20 sin(−30°) = −10 km, that is 10 km south.")}
      </p>

      <H2>{tx(t, "mUc_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mUc_ex1",
          "1. Convert 225° to radians: 225 · π/180 = 5π/4 ≈ 3.927. Convert 2 rad to degrees: 2 · 180/π ≈ 114.6°.")}
      </p>
      <p>
        {tx(t, "mUc_ex2",
          "2. A Ferris wheel of radius 5 m has its centre 6 m above the ground and 8 cabins spaced evenly. Cabin i is at angle i · 2π/8 = i · π/4, so cabin 3 is at 3π/4 = 135°: 5 cos 135° ≈ −3.54 m sideways from the centre and 6 + 5 sin 135° ≈ 6 + 3.54 = 9.54 m above the ground.")}
      </p>
      <p>
        {tx(t, "mUc_ex3",
          "3. What is sin 330°? Quadrant IV, reference angle 30°, sine negative there: −0.5. And cos(−60°) = cos 60° = 0.5, because cosine is even.")}
      </p>

      <H2>{tx(t, "mUc_tableTitle", "Exact values round the whole circle")}</H2>
      <p>
        {tx(t, "mUc_tableBody",
          "The reference angle turns the three exact triangles of the previous chapter into exact values for sixteen angles. For each angle: find its quadrant, find its reference angle, look up 30°, 45° or 60°, and attach the signs of that quadrant. A short way to remember the signs is the phrase \"All Students Take Calculus\", read from quadrant I anticlockwise: All positive, then Sine, then Tangent, then Cosine are the positive ones.")}
      </p>
      <LessonTable
        headers={["θ", tx(t, "mUc_tQuad", "quadrant"), tx(t, "mUc_tRefA", "ref."), "cos θ", "sin θ", "tan θ"]}
        rows={[
          ["120° = 2π/3", "II", "60°", "−1/2", "√3/2", "−√3"],
          ["135° = 3π/4", "II", "45°", "−√2/2", "√2/2", "−1"],
          ["150° = 5π/6", "II", "30°", "−√3/2", "1/2", "−1/√3"],
          ["180° = π", "—", "0°", "−1", "0", "0"],
          ["210° = 7π/6", "III", "30°", "−√3/2", "−1/2", "1/√3"],
          ["225° = 5π/4", "III", "45°", "−√2/2", "−√2/2", "1"],
          ["240° = 4π/3", "III", "60°", "−1/2", "−√3/2", "√3"],
          ["270° = 3π/2", "—", "90°", "0", "−1", tx(t, "mTrig_undef", "undefined")],
          ["300° = 5π/3", "IV", "60°", "1/2", "−√3/2", "−√3"],
          ["315° = 7π/4", "IV", "45°", "√2/2", "−√2/2", "−1"],
          ["330° = 11π/6", "IV", "30°", "√3/2", "−1/2", "−1/√3"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mUc_bigTip", "For an angle beyond a full turn, subtract 360° (or 2π) as many times as needed first. 1110° − 3 · 360° = 30°, so sin 1110° = 1/2. For a negative angle, add 360°: −45° + 360° = 315°.")}
      </Callout>

      <H2>{tx(t, "mUc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mUc_tWrong", "Wrong"), tx(t, "mUc_tRight", "Right"), tx(t, "mUc_tWhy", "Why")]}
        rows={[
          [tx(t, "mUc_m1w", "quadrant II at the bottom left"), tx(t, "mUc_m1r", "I, II, III, IV run anticlockwise from the top right"), tx(t, "mUc_m1", "they follow the direction in which angles grow")],
          [tx(t, "mUc_m2w", "sin 150° = −0.5"), "sin 150° = +0.5", tx(t, "mUc_m2", "quadrant II has positive sine; only the cosine is negative")],
          [tx(t, "mUc_m3w", "tan 90° = a very big number"), tx(t, "mUc_m3r", "tan 90° is undefined"), tx(t, "mUc_m3", "it divides by cos 90° = 0; a calculator shows an error")],
          [tx(t, "mUc_m4w", "cos(−60°) = −1/2"), "cos(−60°) = 1/2", tx(t, "mUc_m4", "turning backwards mirrors the point in the x-axis; its x does not change")],
          [tx(t, "mUc_m5w", "arc = r · θ with θ in degrees"), tx(t, "mUc_m5r", "θ must be in radians"), tx(t, "mUc_m5", "s = rθ is the definition of the radian")],
        ]}
      />

      <KeyIdeas t={t} id="mUc" items={[
        "A radian is arc length divided by radius; a full turn is 2π, so 180° = π.",
        "With radians: arc s = rθ, sector ½r²θ, rim speed v = ωr.",
        "On the unit circle the point at angle θ is (cos θ, sin θ), for every θ.",
        "Signs follow the quadrant; sizes come from the reference angle.",
        "sin and cos repeat every 2π, tan every π; sin is odd, cos is even.",
        "(c₁ + R cos θ, c₂ + R sin θ) is the point at angle θ on a circle of radius R around c.",
        "Bearings run clockwise from north: θ = 90° − bearing.",
      ]} />
    </Article>
  );
}
