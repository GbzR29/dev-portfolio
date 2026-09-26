"use client";

// Trigonometry 5: polar coordinates and atan2 — (r, θ) and converting both
// ways, the ranges of asin/acos/atan, atan2 for the full circle, many names
// for one angle, wrapping and the shortest turn, interpolating angles,
// polar curves, sectors, and conversions and polar equations by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "A radar screen, a lighthouse beam, a garden sprinkler, a spiral galaxy, a snail's shell: some positions are more naturally described by \"how far, in which direction\" than by \"how far right, how far up\". That description is polar coordinates. This chapter converts between the two systems, meets atan2, the rule that answers \"which direction is that?\" for the whole circle, and learns to handle the fact that one direction has infinitely many angle names.")}
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
          "The reverse question is at least as common: a boat is at (x, y) relative to the harbour, in which direction is it? The inverse functions arcsin, arccos and arctan return angles, but each only covers half the circle. arctan(y/x) is the classic trap: y/x is the same for (1, 1) and (−1, −1), so it cannot tell opposite directions apart, and it divides by zero straight up. The fix is to keep the two coordinates separate and look at their signs to find the quadrant. The full angle this gives, in (−π, π], is written atan2(y, x), \"the two-argument arctangent\"; calculators and software use the same name.")}
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
          "What atan2 does inside is simple: compute atan(y/x), which is right when x > 0; when x < 0 the point is on the other side, so add or subtract π (half a turn) according to the sign of y; when x = 0 answer ±π/2 straight away. At the origin itself there is no direction at all: r = 0, and every θ describes the same point, so the angle is simply undefined there.")}
      </p>

      <H2>{tx(t, "mPol_manyTitle", "One direction, many angles")}</H2>
      <p>
        {tx(t, "mPol_manyBody",
          "A point has one pair (x, y) but many polar names: adding a full turn gives the same direction, so (r, θ), (r, θ + 2π) and (r, θ − 2π) are the same point. Comparing or subtracting angles is therefore dangerous. Wrapping picks one representative, usually in (−π, π]. The difference between a target direction and the current heading, once wrapped, is the shortest turn: its sign says which way (positive is anticlockwise) and its size how far. The second mode of the figure shows the difference before and after wrapping.")}
      </p>
      <PolarFigure t={t} />
      <Callout type="warn" t={t}>
        {tx(t, "mTrig_wrapWarn", "Angles wrap: 350° and −10° are the same direction, and the difference between 350° and 10° is 20°, not 340°. Always wrap a difference into (−π, π] before using it to turn, interpolate or compare, or the turn will go the long way round.")}
      </Callout>
      <H3>{tx(t, "mPol_lerpTitle", "Interpolating angles")}</H3>
      <p>
        {tx(t, "mPol_lerpBody",
          "The same care applies to blending. Lerping from 170° to −170° with the ratios chapter's formula passes through 0°, a 340° sweep the wrong way. Lerp the wrapped difference instead: a + t · wrap(b − a) goes from 170° through 180° to 190° (= −170°), 20° in total. The same trick averages directions: the wrapped difference from 350° to 10° is +20°, so the direction halfway between them is 350° + ½ · 20° = 360°, which is 0°. The plain average (350 + 10)/2 = 180° points exactly the wrong way.")}
      </p>
      <Equation label={tx(t, "mPol_eqWrap", "Shortest difference and angle lerp")}
        where={[
          [r`\operatorname{wrap}(\delta)`, tx(t, "mPol_wWrap", "the angle δ moved by whole turns into (−π, π]")],
          [r`t`, tx(t, "mPol_wT", "the blend factor, from 0 (at a) to 1 (at b)")],
        ]}>
        {r`\Delta = \operatorname{wrap}(b - a) \qquad \theta(t) = a + t\,\Delta`}
      </Equation>

      <H2>{tx(t, "mPol_curvesTitle", "Curves in polar form")}</H2>
      <p>
        {tx(t, "mPol_curvesBody",
          "Some curves are awkward as y = f(x) but simple as r = f(θ): the distance from the centre as a function of the direction. A circle is r = constant. An Archimedean spiral, r = bθ, moves out by the same amount every turn, like a coiled rope or the groove of a vinyl record. A cardioid, r = a(1 + cos θ), is heart-shaped and is the pickup pattern of many microphones. A rose, r = a cos(kθ), has petals. To draw one by hand, make a table of θ in steps of 30°, compute r for each, convert each pair to (x, y) and join the points smoothly.")}
      </p>
      <H3>{tx(t, "mPol_menuTitle", "Sectors")}</H3>
      <p>
        {tx(t, "mPol_menuBody",
          "A pie chart or a compass rose splits the full turn into n equal sectors, and asks one polar question: in which sector is a given point? Convert the point's offset from the centre to (r, θ), shift θ into [0, 2π) by adding 2π if it is negative, divide by the sector width 2π/n and round down: the result is the sector's number, counting anticlockwise from 0 at the positive x-axis. Being inside a single sector of radius R, such as the area a lighthouse beam or a sprinkler covers, takes two checks: r ≤ R, and the wrapped difference between θ and the sector's middle direction is at most half its opening angle.")}
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
          "3. A compass rose with 8 sectors of 45°; the point is at (−2, −1). θ = atan2(−1, −2) ≈ −153.4°, shifted to 206.6°. 206.6 / 45 ≈ 4.59, rounded down to 4: the point is in sector 4, counting anticlockwise from sector 0 at the right.")}
      </p>

      <H2>{tx(t, "mPol_handTitle", "Converting by hand")}</H2>
      <p>
        {tx(t, "mPol_handBody",
          "The quadrant rule in practice: compute r with Pythagoras, compute the reference angle arctan|y/x| from the sizes alone, then place it in the quadrant that the signs of x and y point to. Written in degrees, a point in quadrant II gets 180° − reference, quadrant III gets −(180° − reference), and quadrant IV gets −reference.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPol_tPoint", "Point"), "r", tx(t, "mPol_tRefA", "reference"), tx(t, "mPol_tQuad", "signs → quadrant"), "θ"]}
        rows={[
          ["(4, −4)", "√32 = 4√2 ≈ 5.66", "arctan 1 = 45°", "+, − → IV", "−45°"],
          ["(−1, −√3)", "√(1 + 3) = 2", "arctan √3 = 60°", "−, − → III", "−120°"],
          ["(−3, 4)", "√25 = 5", "arctan(4/3) ≈ 53.1°", "−, + → II", "≈ 126.9°"],
          ["(0, −5)", "5", "—", tx(t, "mPol_axis", "on the negative y-axis"), "−90°"],
          ["(−2, 0)", "2", "—", tx(t, "mPol_axis2", "on the negative x-axis"), "180°"],
        ]}
      />
      <p>
        {tx(t, "mPol_backBody",
          "The other way needs no care with quadrants, because cosine and sine carry the signs themselves: (r, θ) = (6, 150°) gives x = 6 cos 150° = 6 · (−√3/2) = −3√3 ≈ −5.20 and y = 6 sin 150° = 6 · 0.5 = 3.")}
      </p>
      <H3>{tx(t, "mPol_eqTitle", "Equations in polar form")}</H3>
      <p>
        {tx(t, "mPol_eqBody",
          "Whole equations convert with the same substitutions: x = r cos θ, y = r sin θ and x² + y² = r². The circle x² + y² = 4x becomes r² = 4r cos θ; dividing by r gives r = 4 cos θ, a circle of radius 2 through the pole (dividing by r loses only the point r = 0, which r = 4 cos θ still reaches at θ = 90°). Going the other way, r = 2 / sin θ means r sin θ = 2, that is y = 2: a horizontal line, which looked nothing like a line in its polar form.")}
      </p>
      <Equation label={tx(t, "mPol_eqSub", "Substitutions between the two systems")}
        where={[
          [r`r^2`, tx(t, "mPol_wR2", "replaces x² + y² wherever that sum appears")],
          [r`r\cos\theta,\ r\sin\theta`, tx(t, "mPol_wRc", "replace x and y")],
        ]}>
        {r`x = r\cos\theta \qquad y = r\sin\theta \qquad x^2 + y^2 = r^2 \qquad \tan\theta = \frac{y}{x}`}
      </Equation>

      <H2>{tx(t, "mPol_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTrig_tSym", "Symptom"), tx(t, "mTrig_tCause", "Cause"), tx(t, "mTrig_tFix", "Fix")]}
        rows={[
          [tx(t, "mTrig_b2", "The angle points the opposite way for points on the left"), tx(t, "mTrig_c2", "arctan(y/x) alone"), tx(t, "mTrig_f2", "use the signs: add or subtract 180° when x < 0")],
          [tx(t, "mTrig_b3", "A turn or an average goes the long way round"), tx(t, "mTrig_c3", "raw angle difference"), tx(t, "mTrig_f3", "wrap the difference into (−π, π]")],
          [tx(t, "mTrig_b4", "arccos or arcsin gives an error"), tx(t, "mTrig_c4", "a value outside [−1, 1], usually an arithmetic slip"), tx(t, "mTrig_f4", "recheck the working: |cos| and |sin| never pass 1")],
          [tx(t, "mPol_b1", "Giving the origin an angle"), tx(t, "mPol_c1", "(0, 0) has no direction"), tx(t, "mPol_f1", "r = 0 and θ is undefined; every θ names the pole")],
          [tx(t, "mPol_b2", "The angle is measured from the y-axis"), tx(t, "mPol_c2", "x and y swapped: arctan(x/y)"), tx(t, "mPol_f2", "tan θ = y/x, rise over run; atan2 takes y first")],
        ]}
      />

      <KeyIdeas t={t} id="mPol" items={[
        "Polar (r, θ): x = r cos θ, y = r sin θ; back: r = √(x² + y²), θ = atan2(y, x).",
        "asin, acos and atan each cover only half the circle; atan2 covers all of it.",
        "An angle plus any number of full turns is the same direction.",
        "Wrap differences into (−π, π] to get the shortest turn and to lerp angles.",
        "Polar curves give r as a function of θ: circles, spirals, roses, cardioids.",
        "Sectors are polar tests: distance plus wrapped angle.",
        "Polar equations: substitute x = r cos θ, y = r sin θ, x² + y² = r².",
      ]} />
    </Article>
  );
}
