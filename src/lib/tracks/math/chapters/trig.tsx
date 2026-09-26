"use client";

// Trigonometry 1: right-triangle trigonometry — naming the sides, why the
// ratios depend only on the angle (similarity), sine, cosine and tangent,
// complementary angles, the exact 30°/45°/60° values, solving right
// triangles, inverse functions, tangent as slope, heights and the field of
// view, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RightTriangleFigure } from "@/components/lesson/figures/math/RightTriangleFigure";

const r = String.raw;

export function TrigContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRt_intro",
          "Trigonometry began as the study of triangles, for surveying land and navigating by the stars. For graphics it is the bridge between angles and lengths: turning \"face 30° to the left\" into a direction, turning a mouse position into an aiming angle, finding how high a camera sees at a given distance. The whole subject grows from one observation about right triangles, which this chapter makes precise. The following chapters extend it to every angle, to any triangle, to rotation and to waves.")}
      </Lead>

      <H2>{tx(t, "mRt_sidesTitle", "Naming the sides from an angle")}</H2>
      <p>
        {tx(t, "mRt_sidesBody",
          "Take a right triangle and pick one of its two sharp (acute) angles; call it θ, the Greek letter theta. The sides get names relative to that angle. The hypotenuse is the longest side, opposite the right angle, as in the Pythagoras chapter. The opposite side is the one across from θ, not touching it. The adjacent side is the other side that touches θ (\"adjacent\" means \"next to\"). If you pick the other acute angle instead, opposite and adjacent swap places, while the hypotenuse stays the same.")}
      </p>

      <H2>{tx(t, "mRt_whyTitle", "The ratios depend only on the angle")}</H2>
      <p>
        {tx(t, "mRt_whyBody",
          "Here is the key fact. Any two right triangles with the same angle θ have two equal angles (θ and the right angle), so by the AA test of the similarity chapter they are similar: one is a scaled copy of the other. Scaling multiplies every side by the same factor k, so the ratio of any two sides, such as opposite divided by hypotenuse, does not change: k cancels. The ratios are therefore properties of the angle alone, not of the particular triangle. Each of the three useful ratios has a name.")}
      </p>
      <Equation label={tx(t, "mRt_eqSoh", "Sine, cosine and tangent")}
        where={[
          [r`\theta`, tx(t, "mRt_wTheta", "one of the acute angles of a right triangle")],
          [r`\text{opp}`, tx(t, "mRt_wOpp", "the side opposite θ")],
          [r`\text{adj}`, tx(t, "mRt_wAdj", "the side next to θ that is not the hypotenuse")],
          [r`\text{hyp}`, tx(t, "mRt_wHyp", "the hypotenuse, opposite the right angle")],
        ]}
        note={tx(t, "mRt_sohNote", "The mnemonic SOH-CAH-TOA lists them: Sine = Opposite/Hypotenuse, Cosine = Adjacent/Hypotenuse, Tangent = Opposite/Adjacent. Dividing the first by the second, the hypotenuses cancel: tan θ = sin θ / cos θ.")}>
        {r`\sin\theta = \frac{\text{opp}}{\text{hyp}} \qquad \cos\theta = \frac{\text{adj}}{\text{hyp}} \qquad \tan\theta = \frac{\text{opp}}{\text{adj}} = \frac{\sin\theta}{\cos\theta}`}
      </Equation>

      <RightTriangleFigure t={t} />

      <p>
        {tx(t, "mRt_unitBody",
          "The small purple triangle in the figure is the one worth remembering. With hypotenuse 1, the definitions say that the adjacent side is exactly cos θ and the opposite side exactly sin θ. Any other right triangle with the angle θ is that one scaled by its hypotenuse: its sides are hyp · cos θ and hyp · sin θ. Since the legs are shorter than the hypotenuse, sine and cosine of an acute angle are always between 0 and 1; the tangent can be any positive number, growing without limit as θ approaches 90°.")}
      </p>
      <Equation label={tx(t, "mRt_eqPyth", "Pythagoras in trigonometric form")}
        where={[
          [r`\sin^2\theta`, tx(t, "mRt_wSq", "short for (sin θ)², the square of the sine")],
        ]}
        note={tx(t, "mRt_pythNote", "Apply Pythagoras to the triangle with hypotenuse 1: its legs are cos θ and sin θ. Knowing one of the two gives the other: if sin θ = 0.6, then cos θ = √(1 − 0.36) = 0.8.")}>
        {r`\cos^2\theta + \sin^2\theta = 1`}
      </Equation>

      <H3>{tx(t, "mRt_coTitle", "Complementary angles: the \"co\" in cosine")}</H3>
      <p>
        {tx(t, "mRt_coBody",
          "The two acute angles of a right triangle add up to 90°, since all three add up to 180°. Angles that add up to 90° are complementary. The side opposite one of them is adjacent to the other, so the sine of one angle is the cosine of the other. That is where the name comes from: cosine is the \"complement's sine\".")}
      </p>
      <Equation label={tx(t, "mRt_eqCo", "Complementary angles")}
        where={[
          [r`90^\circ - \theta`, tx(t, "mRt_wComp", "the other acute angle of the same right triangle")],
        ]}>
        {r`\sin\theta = \cos(90^\circ - \theta) \qquad \cos\theta = \sin(90^\circ - \theta)`}
      </Equation>

      <H2>{tx(t, "mRt_specialTitle", "Exact values: 30°, 45° and 60°")}</H2>
      <p>
        {tx(t, "mRt_specialBody",
          "For most angles the ratios are irrational numbers that a computer approximates. Three angles have exact values, read off two simple triangles (the special-angles mode of the figure). Half of a unit square, cut along its diagonal, has two 45° angles, legs 1 and hypotenuse √2. Half of an equilateral triangle with side 2 has angles 30°, 60° and 90°, sides 1 and 2, and height √(2² − 1²) = √3. The table also includes 0° and 90° as the limits of a triangle squashed flat.")}
      </p>
      <LessonTable
        headers={["θ", "0°", "30°", "45°", "60°", "90°"]}
        rows={[
          ["sin θ", "0", "1/2", "√2/2 ≈ 0.707", "√3/2 ≈ 0.866", "1"],
          ["cos θ", "1", "√3/2 ≈ 0.866", "√2/2 ≈ 0.707", "1/2", "0"],
          ["tan θ", "0", "1/√3 ≈ 0.577", "1", "√3 ≈ 1.732", tx(t, "mTrig_undef", "undefined")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mRt_tableTip", "A pattern to remember the sine row: √0/2, √1/2, √2/2, √3/2, √4/2. The cosine row is the same backwards, because cos θ = sin(90° − θ).")}
      </Callout>

      <H2>{tx(t, "mRt_solveTitle", "Solving a right triangle")}</H2>
      <p>
        {tx(t, "mRt_solveBody",
          "To solve a triangle means to find every side and angle from the ones you know. For a right triangle, one side and one acute angle, or two sides, are enough. With an angle and a side, pick the ratio that links the side you know to the side you want, and rearrange it. With two sides you need the angle itself, which means running a ratio backwards: that is the job of the inverse functions.")}
      </p>
      <Equation label={tx(t, "mRt_eqSolve", "Sides from an angle")}
        where={[
          [r`\text{hyp}\cdot\sin\theta`, tx(t, "mRt_wHs", "the opposite side, from sin θ = opp / hyp multiplied by hyp")],
          [r`\text{adj}\cdot\tan\theta`, tx(t, "mRt_wAt", "the opposite side from the adjacent one")],
        ]}
        note={tx(t, "mRt_solveNote", "Example: a 4 m ladder leans at 70° to the ground. Its top is 4 · sin 70° ≈ 3.76 m up the wall and its foot 4 · cos 70° ≈ 1.37 m out from it.")}>
        {r`\text{opp} = \text{hyp}\cdot\sin\theta \qquad \text{adj} = \text{hyp}\cdot\cos\theta \qquad \text{opp} = \text{adj}\cdot\tan\theta`}
      </Equation>
      <H3>{tx(t, "mRt_invTitle", "Inverse functions: from a ratio back to the angle")}</H3>
      <p>
        {tx(t, "mRt_invBody",
          "The functions chapter introduced inverses: a function that undoes another. arcsin (written asin in code, or sin⁻¹ on calculators) takes a ratio and returns the angle with that sine; arccos and arctan do the same for cosine and tangent. For right triangles the answer is always an acute angle, so there is no ambiguity. The Polar Coordinates chapter deals with the full circle, where the question \"which angle has this tangent?\" has more than one answer.")}
      </p>
      <Equation label={tx(t, "mRt_eqInv", "Angles from sides")}
        where={[
          [r`\arcsin`, tx(t, "mRt_wAsin", "the inverse of sine; its input must be between −1 and 1")],
          [r`\arctan`, tx(t, "mRt_wAtan", "the inverse of tangent; any input works")],
        ]}
        note={tx(t, "mRt_invNote", "Example: a ramp rises 1 m over a run of 4 m. Its angle is arctan(1/4) ≈ 14.0°. The notation sin⁻¹ means the inverse function, not 1/sin; the reciprocal 1/sin θ has its own name, the cosecant, which games rarely need.")}>
        {r`\theta = \arcsin\frac{\text{opp}}{\text{hyp}} = \arccos\frac{\text{adj}}{\text{hyp}} = \arctan\frac{\text{opp}}{\text{adj}}`}
      </Equation>

      <H2>{tx(t, "mRt_slopeTitle", "Tangent is slope")}</H2>
      <p>
        {tx(t, "mRt_slopeBody",
          "A line that climbs at an angle θ above the horizontal makes a right triangle with any horizontal run: the run is adjacent to θ and the rise is opposite it. So the line's slope, rise over run from the functions chapter, is exactly tan θ. A 45° line has slope 1; a road with a 10% grade (slope 0.1) climbs at arctan 0.1 ≈ 5.7°. Games use this to decide whether a character can walk up a slope: compare the ground's angle with a maximum, or equivalently its slope with tan of that maximum.")}
      </p>
      <Equation label={tx(t, "mRt_eqSlope", "Slope and angle")}
        where={[
          [r`m`, tx(t, "mRt_wM", "the slope of the line, rise over run")],
          [r`\theta`, tx(t, "mRt_wIncl", "the angle between the line and the horizontal")],
        ]}>
        {r`m = \frac{\text{rise}}{\text{run}} = \tan\theta \qquad \theta = \arctan m`}
      </Equation>

      <H2>{tx(t, "mRt_heightTitle", "Heights and distances you cannot measure")}</H2>
      <p>
        {tx(t, "mRt_heightBody",
          "The third mode of the figure is the surveyor's trick. From a known distance d, measure the angle up to the top of something tall; then h = d · tan θ. It also runs backwards: an archer on a 10 m wall sees a target at an angle of 20° below the horizontal, so the target is 10 / tan 20° ≈ 27.5 m away along the ground.")}
      </p>
      <H3>{tx(t, "mTrig_fovTitle", "Tangent and the field of view")}</H3>
      <p>
        {tx(t, "mTrig_fovBody",
          "A perspective camera with a vertical field of view θ sees, at distance d in front of it, a slab of height 2d·tan(θ/2): the half-angle and the distance form a right triangle with the half-height as the opposite side. That is why tan(fov/2) appears in every projection matrix, and why doubling the distance doubles the visible height.")}
      </p>

      <H2>{tx(t, "mRt_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mRt_ex1",
          "1. A right triangle has legs 5 and 12. The hypotenuse is 13 (a Pythagorean triple). The angle opposite the 5 is arctan(5/12) ≈ 22.6°, and the other acute angle is 90° − 22.6° = 67.4°.")}
      </p>
      <p>
        {tx(t, "mRt_ex2",
          "2. A camera with a 60° vertical field of view looks at a wall 10 m away. The visible height is 2 · 10 · tan 30° ≈ 11.5 m. To fit a 20 m tall building, the camera must be 20 / (2 tan 30°) ≈ 17.3 m away.")}
      </p>
      <p>
        {tx(t, "mRt_ex3",
          "3. A character's maximum walkable slope is 45°. A ground triangle rising 0.8 m over 1 m of run has slope 0.8 < tan 45° = 1, so it is walkable; its angle is arctan 0.8 ≈ 38.7°.")}
      </p>

      <H2>{tx(t, "mRt_codeTitle", "Right triangles in C++")}</H2>
      <p>
        {tx(t, "mRt_codeBody",
          "The C++ functions std::sin, std::cos, std::tan and their inverses std::asin, std::acos, std::atan measure angles in radians, a different unit explained in the next chapter. Until then, convert degrees with the factor π/180 on the way in and 180/π on the way out.")}
      </p>
      <CodeBlock lang="cpp" filename="right_triangle.hpp" t={t}>{`#include <algorithm>
#include <cmath>
#include <numbers>

constexpr float PI = std::numbers::pi_v<float>;
float radians(float deg) { return deg * PI / 180.0f; }
float degrees(float rad) { return rad * 180.0f / PI; }

// Legs of a right triangle from the hypotenuse and one acute angle (degrees)
float oppositeSide(float hyp, float deg) { return hyp * std::sin(radians(deg)); }
float adjacentSide(float hyp, float deg) { return hyp * std::cos(radians(deg)); }

// Acute angle (degrees) from the two legs
float angleFromLegs(float opp, float adj) { return degrees(std::atan(opp / adj)); }

// asin/acos return NaN outside [-1, 1]; rounding can push a ratio just past 1
float safeAsinDeg(float ratio) { return degrees(std::asin(std::clamp(ratio, -1.0f, 1.0f))); }

// Visible height at distance d for a vertical field of view (degrees)
float visibleHeight(float fovDeg, float d) { return 2.0f * d * std::tan(radians(fovDeg) / 2.0f); }

// Can a character walk up ground that rises 'rise' over 'run'?
bool walkable(float rise, float run, float maxDeg) {
    return rise <= run * std::tan(radians(maxDeg));    // compare slopes, no atan needed
}`}</CodeBlock>

      <H2>{tx(t, "mRt_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRt_tWrong", "Wrong"), tx(t, "mRt_tRight", "Right"), tx(t, "mRt_tWhy", "Why")]}
        rows={[
          [tx(t, "mRt_m1w", "std::sin(30) expecting 0.5"), "std::sin(radians(30))", tx(t, "mRt_m1", "C++ takes radians; sin of 30 radians is about −0.99")],
          [tx(t, "mRt_m2w", "calling the hypotenuse \"adjacent\""), tx(t, "mRt_m2r", "adjacent is the leg next to θ"), tx(t, "mRt_m2", "the hypotenuse touches θ too, but it has its own name")],
          [tx(t, "mRt_m3w", "sin⁻¹ x = 1 / sin x"), tx(t, "mRt_m3r", "sin⁻¹ is the inverse function, arcsin"), tx(t, "mRt_m3", "the −1 means \"undo\", not a power")],
          [tx(t, "mRt_m4w", "asin(1.0000001) in code"), tx(t, "mRt_m4r", "clamp to [−1, 1] first"), tx(t, "mRt_m4", "no angle has a sine above 1; the result is NaN")],
          [tx(t, "mRt_m5w", "using SOH-CAH-TOA without a right angle"), tx(t, "mRt_m5r", "use the laws of sines and cosines"), tx(t, "mRt_m5", "the ratios are defined in right triangles")],
        ]}
      />

      <KeyIdeas t={t} id="mRt" items={[
        "Right triangles with the same angle are similar, so their side ratios depend only on the angle.",
        "sin = opp/hyp, cos = adj/hyp, tan = opp/adj = sin/cos.",
        "With hypotenuse 1 the legs are cos θ and sin θ, so cos²θ + sin²θ = 1.",
        "sin θ = cos(90° − θ); exact values come from half a square and half an equilateral triangle.",
        "arcsin, arccos, arctan turn a ratio back into an angle.",
        "The slope of a line is the tangent of its angle; h = d · tan θ.",
        "C++ trig functions take radians.",
      ]} />
    </Article>
  );
}
