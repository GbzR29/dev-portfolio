"use client";

// Trigonometry 1: right-triangle trigonometry — naming the sides, why the
// ratios depend only on the angle (similarity), sine, cosine and tangent,
// complementary angles, the exact 30°/45°/60° values, solving right
// triangles, inverse functions, tangent as slope, heights and distances,
// and a step-by-step method for solving by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "Trigonometry began as the study of triangles, for surveying land and navigating by the stars. It is the bridge between angles and lengths: from the angle of a ladder, how high it reaches; from the angle to a hilltop, how tall the hill is; from the steepness of a road, the angle it climbs at. The whole subject grows from one observation about right triangles, which this chapter makes precise. The following chapters extend it to every angle, to any triangle, to rotation and to waves.")}
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
          "The functions chapter introduced inverses: a function that undoes another. arcsin (written sin⁻¹ on calculators) takes a ratio and returns the angle with that sine; arccos and arctan do the same for cosine and tangent. For right triangles the answer is always an acute angle, so there is no ambiguity. The Polar Coordinates chapter deals with the full circle, where the question \"which angle has this tangent?\" has more than one answer.")}
      </p>
      <Equation label={tx(t, "mRt_eqInv", "Angles from sides")}
        where={[
          [r`\arcsin`, tx(t, "mRt_wAsin", "the inverse of sine; its input must be between −1 and 1")],
          [r`\arctan`, tx(t, "mRt_wAtan", "the inverse of tangent; any input works")],
        ]}
        note={tx(t, "mRt_invNote", "Example: a ramp rises 1 m over a run of 4 m. Its angle is arctan(1/4) ≈ 14.0°. The notation sin⁻¹ means the inverse function, not 1/sin; the reciprocal 1/sin θ has its own name, the cosecant, and this course rarely needs it.")}>
        {r`\theta = \arcsin\frac{\text{opp}}{\text{hyp}} = \arccos\frac{\text{adj}}{\text{hyp}} = \arctan\frac{\text{opp}}{\text{adj}}`}
      </Equation>

      <H2>{tx(t, "mRt_slopeTitle", "Tangent is slope")}</H2>
      <p>
        {tx(t, "mRt_slopeBody",
          "A line that climbs at an angle θ above the horizontal makes a right triangle with any horizontal run: the run is adjacent to θ and the rise is opposite it. So the line's slope, rise over run from the functions chapter, is exactly tan θ. A 45° line has slope 1; a road with a 10% grade (slope 0.1) climbs at arctan 0.1 ≈ 5.7°. Building codes use the same link: a wheelchair ramp may rise at most 1 m for every 12 m of run, a slope of 1/12, so its angle is at most arctan(1/12) ≈ 4.8°. Comparing slopes or comparing angles gives the same answer, because a steeper angle always has a bigger tangent.")}
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
      <H3>{tx(t, "mRt_twoTitle", "When you cannot reach the foot: two angles")}</H3>
      <p>
        {tx(t, "mRt_twoBody",
          "Often the distance to the foot of a mountain is unknown, because the foot is across a river or inside a forest. Measure the angle of elevation twice instead: α from a first point, then walk d closer along a straight line and measure a larger angle β. Call the unknown height h and the unknown remaining distance x. The two right triangles give h = x · tan β and h = (x + d) · tan α. Both equal h, so x · tan β = (x + d) · tan α. Expand: x · tan β = x · tan α + d · tan α. Collect the x terms: x (tan β − tan α) = d · tan α, so x = d · tan α / (tan β − tan α), and then h = x · tan β.")}
      </p>
      <Equation label={tx(t, "mRt_eqTwo", "Height from two angles of elevation")}
        where={[
          [r`lpha`, tx(t, "mRt_wAlpha", "the angle of elevation from the farther point")],
          [r`eta`, tx(t, "mRt_wBeta", "the angle from the nearer point, which is larger")],
          [r`d`, tx(t, "mRt_wD", "the distance walked between the two measurements")],
          [r`h`, tx(t, "mRt_wH", "the height of the top above eye level")],
        ]}
        note={tx(t, "mRt_twoNote", "Numbers: α = 30°, β = 45°, d = 100 m. tan 30° ≈ 0.577 and tan 45° = 1, so x = 100 · 0.577 / (1 − 0.577) ≈ 136.6 m and h ≈ 136.6 · 1 = 136.6 m.")}>
        {r`h = \frac{d\,\tan\alpha\,\tan\beta}{\tan\beta - \tan\alpha}`}
      </Equation>

      <H2>{tx(t, "mRt_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mRt_ex1",
          "1. A right triangle has legs 5 and 12. The hypotenuse is 13 (a Pythagorean triple). The angle opposite the 5 is arctan(5/12) ≈ 22.6°, and the other acute angle is 90° − 22.6° = 67.4°.")}
      </p>
      <p>
        {tx(t, "mRt_ex2",
          "2. A kite string 50 m long makes 35° with the ground, held 1.5 m above it. The kite is 50 · sin 35° ≈ 50 · 0.574 = 28.7 m above the hand, so 28.7 + 1.5 = 30.2 m above the ground, and 50 · cos 35° ≈ 41.0 m away horizontally.")}
      </p>
      <p>
        {tx(t, "mRt_ex3",
          "3. A ramp must climb 0.6 m and may not be steeper than 4.8° (slope 1/12). Its horizontal run must be at least 0.6 / tan 4.8° ≈ 0.6 / 0.084 ≈ 7.1 m, which matches 12 · 0.6 = 7.2 m from the 1 : 12 rule; the small difference is rounding.")}
      </p>

      <H2>{tx(t, "mRt_methodTitle", "Solving step by step")}</H2>
      <p>
        {tx(t, "mRt_methodBody",
          "Every right-triangle problem is solved by the same five steps. (1) Draw the triangle and mark the right angle. (2) Write down what you know and put a question mark on what you want. (3) Name the sides relative to the angle you are using: opposite, adjacent, hypotenuse. (4) Pick the one ratio that contains the known side and the wanted side, and nothing else unknown. (5) Rearrange and compute, then check the answer against something you know is true.")}
      </p>
      <LessonTable
        headers={[tx(t, "mRt_tStep", "Step"), tx(t, "mRt_tDo", "Ladder problem: 5 m ladder, foot 1.5 m from the wall")]}
        rows={[
          ["1–2", tx(t, "mRt_s1", "hyp = 5 (the ladder), adj = 1.5 (the gap at the foot); wanted: the angle θ at the ground and the height h")],
          ["3", tx(t, "mRt_s2", "from θ, the gap is adjacent, the wall height is opposite, the ladder is the hypotenuse")],
          ["4", tx(t, "mRt_s3", "adj and hyp are known → cosine: cos θ = 1.5 / 5 = 0.3")],
          ["5", tx(t, "mRt_s4", "θ = arccos 0.3 ≈ 72.5°; h = 5 · sin 72.5° ≈ 5 · 0.954 ≈ 4.77 m")],
          [tx(t, "mRt_sCheck", "check"), tx(t, "mRt_s5", "Pythagoras: √(5² − 1.5²) = √(25 − 2.25) = √22.75 ≈ 4.77 ✓; the other angle is 90° − 72.5° = 17.5°")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mRt_calcTip", "Before pressing sin on a calculator, check that it shows DEG. In RAD mode it expects radians, a unit met in the next chapter, and sin 30 comes out as about −0.99 instead of 0.5.")}
      </Callout>

      <H2>{tx(t, "mRt_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRt_tWrong", "Wrong"), tx(t, "mRt_tRight", "Right"), tx(t, "mRt_tWhy", "Why")]}
        rows={[
          [tx(t, "mRt_m1w", "sin 30 = −0.99 on the calculator"), tx(t, "mRt_m1r", "switch the calculator to DEG"), tx(t, "mRt_m1", "in RAD mode 30 means 30 radians, about 1719°")],
          [tx(t, "mRt_m2w", "calling the hypotenuse \"adjacent\""), tx(t, "mRt_m2r", "adjacent is the leg next to θ"), tx(t, "mRt_m2", "the hypotenuse touches θ too, but it has its own name")],
          [tx(t, "mRt_m3w", "sin⁻¹ x = 1 / sin x"), tx(t, "mRt_m3r", "sin⁻¹ is the inverse function, arcsin"), tx(t, "mRt_m3", "the −1 means \"undo\", not a power")],
          [tx(t, "mRt_m4w", "arcsin(6/5) = error, so try again"), tx(t, "mRt_m4r", "recheck which side is the hypotenuse"), tx(t, "mRt_m4", "a leg can never be longer than the hypotenuse, so sin and cos never pass 1")],
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
        "Solve in steps: draw, label, pick the ratio with one unknown, rearrange, check with Pythagoras.",
      ]} />
    </Article>
  );
}
