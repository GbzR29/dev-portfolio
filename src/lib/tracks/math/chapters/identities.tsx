"use client";

// Trigonometry 4: identities and rotation — what an identity is, the
// Pythagorean identity and symmetries, rotating a point by any angle (from
// the turned unit steps), rotating about a pivot, the angle-sum and
// difference formulas, double and half angles, composing rotations, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RotationFigure } from "@/components/lesson/figures/math/RotationFigure";

const r = String.raw;

export function IdentitiesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mId_intro",
          "The transformations chapter could only turn shapes by quarter turns, because anything else needed sine and cosine. Now they are available, and this chapter finishes the job: one formula rotates a point by any angle. Out of that formula fall the angle-sum identities, the handful of trigonometric facts that game and shader code actually relies on. Everything is derived, nothing is to be memorised blindly.")}
      </Lead>

      <H2>{tx(t, "mId_whatTitle", "What an identity is")}</H2>
      <p>
        {tx(t, "mId_whatBody",
          "An equation like 2x + 1 = 7 is true for one value of x. An identity is true for every value: (a + b)² = a² + 2ab + b² from the expressions chapter is one. Trigonometric identities are equations between sines and cosines that hold for every angle. They are tools for rewriting: replacing an expensive or awkward expression with an equal one that is cheaper, simpler or easier to reason about. Two were already derived in this section, straight from the unit circle.")}
      </p>
      <Equation label={tx(t, "mId_eqBasic", "Identities from the unit circle")}
        where={[
          [r`\cos^2\theta + \sin^2\theta = 1`, tx(t, "mId_wPyth", "Pythagoras: the point (cos θ, sin θ) is at distance 1 from the origin")],
          [r`\sin(-\theta) = -\sin\theta`, tx(t, "mId_wOdd", "turning the other way mirrors the point in the x-axis: y changes sign")],
          [r`\cos(-\theta) = \cos\theta`, tx(t, "mId_wEven", "…and x does not")],
          [r`\sin(\pi - \theta) = \sin\theta`, tx(t, "mId_wSupp", "mirroring in the y-axis keeps the height: 150° and 30° have the same sine")],
        ]}>
        {r`\cos^2\theta + \sin^2\theta = 1 \qquad \sin(-\theta) = -\sin\theta \qquad \cos(-\theta) = \cos\theta \qquad \sin(\pi - \theta) = \sin\theta`}
      </Equation>

      <H2>{tx(t, "mId_rotTitle", "Rotating a point by any angle")}</H2>
      <p>
        {tx(t, "mId_rotBody",
          "A point (x, y) is reached from the origin by x unit steps to the right and y unit steps up. Rotate the whole plane about the origin by θ. The unit step to the right, (1, 0), is the point at angle 0 on the unit circle; after rotating it is the point at angle θ, (cos θ, sin θ). The unit step up, (0, 1), is at angle 90°; after rotating it is at θ + 90°, which is (−sin θ, cos θ), the quarter-turn rule of the transformations chapter applied to (cos θ, sin θ). The rotated point is reached by the same x and y steps, taken along the turned directions. Adding them coordinate by coordinate gives the formula; the figure's first mode builds it with arrows.")}
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

      <RotationFigure t={t} />

      <p>
        {tx(t, "mId_rotCheck",
          "Check it against what you know. θ = 90°: cos = 0, sin = 1, so (x, y) → (−y, x), the quarter-turn rule. θ = 180°: (−x, −y). θ = 0: nothing moves. And the distance from the origin never changes: x'² + y'² expands to (x² + y²)(cos² θ + sin² θ) = x² + y², so rotation is a rigid motion, as it should be. The Linear Algebra section will write the two turned unit steps as the columns of a 2 × 2 matrix, the rotation matrix of every graphics API.")}
      </p>

      <H2>{tx(t, "mId_sumTitle", "The angle-sum formulas")}</H2>
      <p>
        {tx(t, "mId_sumBody",
          "Take the point at angle α on the unit circle, (cos α, sin α), and rotate it by β. Turning adds angles, so it lands at angle α + β, the point (cos(α + β), sin(α + β)). The rotation formula computes the same point with x = cos α and y = sin α. Two descriptions of one point must have equal coordinates, which gives two identities at once. The second mode of the figure checks them for any α and β.")}
      </p>
      <Equation label={tx(t, "mTrig_eqIds", "Core identities")}
        where={[
          [r`\sin^2\theta + \cos^2\theta = 1`, tx(t, "mTrig_wPyth2", "Pythagoras on the unit circle: the point is at distance 1 from the origin")],
          [r`\sin(-\theta) = -\sin\theta,\ \cos(-\theta) = \cos\theta`, tx(t, "mTrig_wSym", "mirroring the angle below the x axis flips the y coordinate only")],
          [r`\sin(\theta + \tfrac{\pi}{2}) = \cos\theta`, tx(t, "mTrig_wShift", "cosine is sine a quarter turn ahead: the same wave, shifted")],
          [r`\cos(\alpha + \beta),\ \sin(\alpha + \beta)`, tx(t, "mId_wSum", "the angle-sum formulas: rotating the point at angle α by β")],
        ]}>
        {r`\cos(\alpha+\beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta \qquad \sin(\alpha+\beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta`}
      </Equation>
      <p>
        {tx(t, "mId_diffBody",
          "Replacing β by −β and using the symmetries (cos(−β) = cos β, sin(−β) = −sin β) gives the difference formulas: only the signs in the middle flip. With α = 90° they give back the complementary-angle rules of the first chapter, and with β = 90° the quarter-turn shift sin(θ + π/2) = cos θ.")}
      </p>
      <Equation label={tx(t, "mId_eqDiff", "Difference formulas")}
        where={[
          [r`\alpha - \beta`, tx(t, "mId_wDiff", "turning back by β instead of forward")],
        ]}
        note={tx(t, "mId_diffNote", "Example: cos 15° = cos(45° − 30°) = cos 45° cos 30° + sin 45° sin 30° = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4 ≈ 0.966.")}>
        {r`\cos(\alpha-\beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta \qquad \sin(\alpha-\beta) = \sin\alpha\cos\beta - \cos\alpha\sin\beta`}
      </Equation>

      <H3>{tx(t, "mId_doubleTitle", "Double and half angles")}</H3>
      <p>
        {tx(t, "mId_doubleBody",
          "Set β = α in the sum formulas. Then cos 2α = cos² α − sin² α and sin 2α = 2 sin α cos α. Using cos² α + sin² α = 1 to remove one of the squares gives two more forms of cos 2α, and solving those for cos² α and sin² α gives the half-angle formulas. They turn a square into a plain cosine, which is why they show up in lighting and sampling code, and in the Calculus section when integrating sin².")}
      </p>
      <Equation label={tx(t, "mId_eqDouble", "Double angle and squares")}
        where={[
          [r`\sin 2\alpha`, tx(t, "mId_wSin2", "the sine of twice the angle")],
          [r`\cos^2\alpha`, tx(t, "mId_wCos2", "rewritten without a square, using the doubled angle")],
        ]}
        note={tx(t, "mId_doubleNote", "Check with α = 30°: sin 60° = 2 · ½ · (√3/2) = √3/2 ✓, and cos² 30° = (1 + cos 60°)/2 = (1 + ½)/2 = ¾ = (√3/2)² ✓.")}>
        {r`\sin 2\alpha = 2\sin\alpha\cos\alpha \qquad \cos 2\alpha = \cos^2\alpha - \sin^2\alpha = 2\cos^2\alpha - 1 \qquad \cos^2\alpha = \frac{1 + \cos 2\alpha}{2}`}
      </Equation>

      <H2>{tx(t, "mId_pivotTitle", "Rotating about a pivot and chaining rotations")}</H2>
      <p>
        {tx(t, "mId_pivotBody",
          "To rotate about a pivot c instead of the origin, use the transformations chapter's pattern: subtract c, rotate, add c back. Rotating by α and then by β is the same as rotating once by α + β; the sum formulas are exactly the statement that the two rotation formulas, applied in turn, collapse into one. So rotations in 2D can be done in either order. An object that spins every frame can therefore store its total angle and rotate once from its original shape, instead of rotating the already-rotated shape again and again, which would slowly pile up rounding errors and distort it.")}
      </p>
      <Equation label={tx(t, "mId_eqPivot", "Rotation by θ about a pivot c")}
        where={[
          [r`(c_x, c_y)`, tx(t, "mId_wC", "the pivot, the one point that stays put")],
          [r`x - c_x,\ y - c_y`, tx(t, "mId_wOff", "the offset from the pivot, which is what actually gets rotated")],
        ]}>
        {r`x' = c_x + (x - c_x)\cos\theta - (y - c_y)\sin\theta \qquad y' = c_y + (x - c_x)\sin\theta + (y - c_y)\cos\theta`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mId_perfTip", "Rotating many points by the same angle? Compute cos θ and sin θ once, outside the loop; each point then costs four multiplications and two additions. And a small steady turn per frame can be applied with a precomputed pair, rotating by the same small angle again and again, as long as you renormalise (rescale to length 1) now and then to stop rounding from growing or shrinking the vectors.")}
      </Callout>

      <H2>{tx(t, "mId_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mId_ex1",
          "1. Rotate (4, 0) by 30°: (4 cos 30°, 4 sin 30°) = (3.46, 2). Rotate (2, 1) by 60°: x' = 2 · 0.5 − 1 · 0.866 = 0.134, y' = 2 · 0.866 + 1 · 0.5 = 2.232. Check the length: √5 ≈ 2.236 before, √(0.018 + 4.982) = √5 after.")}
      </p>
      <p>
        {tx(t, "mId_ex2",
          "2. A turret at (10, 5) has its barrel tip at (12, 5). After turning 90° about the turret the tip is at (10 + 0 − 0, 5 + 2 + 0) = (10, 7): offset (2, 0), rotated to (0, 2), added back.")}
      </p>
      <p>
        {tx(t, "mId_ex3",
          "3. sin 75° = sin(45° + 30°) = (√2/2)(√3/2) + (√2/2)(1/2) = (√6 + √2)/4 ≈ 0.966. It equals cos 15°, as the complementary-angle rule says it must.")}
      </p>

      <H2>{tx(t, "mId_codeTitle", "Rotation in C++")}</H2>
      <p>
        {tx(t, "mId_codeBody",
          "The rotate function is the rotation formula line for line. The Rot struct stores a precomputed cosine and sine so a whole mesh can be turned without calling std::cos and std::sin per vertex; combining two Rots uses the angle-sum formulas directly, with no angles involved.")}
      </p>
      <CodeBlock lang="cpp" filename="rotate2d.hpp" t={t}>{`#include <cmath>

struct Vec2 { float x, y; };

// Rotate p by angle a (radians, anticlockwise) about the origin
Vec2 rotate(Vec2 p, float a) {
    float c = std::cos(a), s = std::sin(a);
    return { p.x * c - p.y * s, p.x * s + p.y * c };
}

// ... about a pivot: subtract, rotate, add back
Vec2 rotateAbout(Vec2 p, Vec2 pivot, float a) {
    Vec2 r = rotate({ p.x - pivot.x, p.y - pivot.y }, a);
    return { r.x + pivot.x, r.y + pivot.y };
}

// A rotation stored as (cos, sin): no trig calls when applying it
struct Rot {
    float c = 1, s = 0;                          // identity: angle 0
    static Rot fromAngle(float a) { return { std::cos(a), std::sin(a) }; }
    Vec2 apply(Vec2 p) const { return { p.x * c - p.y * s, p.x * s + p.y * c }; }
    // Rotate by 'this' then by 'o': the angle-sum formulas
    Rot then(Rot o) const { return { c * o.c - s * o.s, s * o.c + c * o.s }; }
    void renormalize() { float l = std::sqrt(c * c + s * s); c /= l; s /= l; }
};`}</CodeBlock>

      <H2>{tx(t, "mId_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mId_tWrong", "Wrong"), tx(t, "mId_tRight", "Right"), tx(t, "mId_tWhy", "Why")]}
        rows={[
          ["sin(α + β) = sin α + sin β", "sin α cos β + cos α sin β", tx(t, "mId_m1", "sine is not linear: sin 60° ≠ sin 30° + sin 30° = 1")],
          ["x' = x cos θ + y sin θ", "x' = x cos θ − y sin θ", tx(t, "mId_m2", "the plus version rotates the other way (by −θ)")],
          [tx(t, "mId_m3w", "updating x, then using the new x for y"), tx(t, "mId_m3r", "compute both from the old x and y"), tx(t, "mId_m3", "x = x*c - y*s; y = x*s + y*c uses the rotated x by mistake")],
          [tx(t, "mId_m4w", "rotating about the origin when you meant the pivot"), tx(t, "mId_m4r", "subtract the pivot first"), tx(t, "mId_m4", "otherwise the object swings around the world's centre")],
          [tx(t, "mId_m5w", "rotating the rotated shape every frame"), tx(t, "mId_m5r", "store the angle and rotate the original"), tx(t, "mId_m5", "rounding errors accumulate and the shape drifts")],
        ]}
      />

      <KeyIdeas t={t} id="mId" items={[
        "An identity holds for every angle; it is a tool for rewriting.",
        "Rotation turns (1, 0) into (cos θ, sin θ) and (0, 1) into (−sin θ, cos θ).",
        "x' = x cos θ − y sin θ, y' = x sin θ + y cos θ; about a pivot, subtract and add it back.",
        "Rotating (cos α, sin α) by β gives the angle-sum formulas.",
        "sin 2α = 2 sin α cos α; cos² α = (1 + cos 2α)/2.",
        "2D rotations add their angles, so store the angle and rotate once.",
      ]} />
    </Article>
  );
}
