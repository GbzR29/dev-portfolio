"use client";

// Trigonometry 3: solving any triangle — naming sides and angles, the law of
// cosines (derived from a height and Pythagoras), the law of sines and the
// circumscribed circle, the area ½ab·sin C, which law for which data, the
// ambiguous SSA case, two-bone inverse kinematics, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TriangleLawFigure } from "@/components/lesson/figures/math/TriangleLawFigure";

const r = String.raw;

export function TriangleLawsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTl_intro",
          "SOH-CAH-TOA needs a right angle, and most triangles do not have one: the triangle between a player, an enemy and a wall, the two bones of an arm and the target it reaches for, three GPS satellites. Two laws handle every triangle. The law of cosines is Pythagoras with a correction term; the law of sines links each side to the angle facing it. Both come from a single trick: cut the triangle into two right triangles with a height.")}
      </Lead>

      <H2>{tx(t, "mTl_namesTitle", "Naming the parts")}</H2>
      <p>
        {tx(t, "mTl_namesBody",
          "Call the corners A, B and C, and use the same capital letters for the angles at them. Each side gets the lower-case letter of the corner it faces: side a is opposite corner A (it joins B and C), b is opposite B, c is opposite C. With this naming every formula below reads the same whichever corner you start from; swap the letters around and it stays true.")}
      </p>

      <H2>{tx(t, "mTl_cosTitle", "The law of cosines")}</H2>
      <p>
        {tx(t, "mTl_cosBody",
          "Drop the height from B straight down onto the line through C and A, meeting it at D. The height makes two right triangles. In triangle BDC the hypotenuse is a and the angle at C is C, so CD = a cos C and the height BD = a sin C, by the definitions of the first chapter of this section. The rest of the base is DA = b − a cos C. Now apply Pythagoras to the other right triangle, BDA, whose hypotenuse is c.")}
      </p>
      <Equation label={tx(t, "mTl_eqDerive", "Deriving the law of cosines")}
        notes={[
          tx(t, "mTl_d1", "Pythagoras in the right triangle BDA: height² + (rest of base)²"),
          tx(t, "mTl_d2", "expand the bracket: (b − a cos C)² = b² − 2ab cos C + a² cos² C"),
          tx(t, "mTl_d3", "collect a² sin² C + a² cos² C = a²(sin² C + cos² C) = a²"),
        ]}>
        {r`c^2 = (a\sin C)^2 + (b - a\cos C)^2 = a^2\sin^2 C + b^2 - 2ab\cos C + a^2\cos^2 C = a^2 + b^2 - 2ab\cos C`}
      </Equation>
      <Equation label={tx(t, "mTl_eqCos", "Law of cosines")}
        where={[
          [r`a,\ b`, tx(t, "mTl_wAB", "the two sides that meet at the angle C")],
          [r`c`, tx(t, "mTl_wC", "the side opposite C")],
          [r`2ab\cos C`, tx(t, "mTl_wCorr", "the correction to Pythagoras: 0 when C = 90°, positive when C is acute, negative when C is obtuse")],
        ]}
        note={tx(t, "mTl_cosNote", "The second form finds an angle from three sides. Example: sides 5, 7, 8. The angle facing 7 has cos = (5² + 8² − 7²)/(2 · 5 · 8) = 40/80 = 0.5, so it is exactly 60°.")}>
        {r`c^2 = a^2 + b^2 - 2ab\cos C \qquad\Longleftrightarrow\qquad \cos C = \frac{a^2 + b^2 - c^2}{2ab}`}
      </Equation>
      <p>
        {tx(t, "mTl_cosCases",
          "The correction term explains the Pythagoras chapter's classification of triangles. When C = 90°, cos C = 0 and the law is Pythagoras. When C is acute its cosine is positive, so c² is less than a² + b². When C is obtuse its cosine is negative (quadrant II, from the unit circle chapter), so c² exceeds a² + b². In the figure's first mode, drag C past 90° and watch D slide outside the triangle.")}
      </p>

      <TriangleLawFigure t={t} />

      <H2>{tx(t, "mTl_sinTitle", "The law of sines")}</H2>
      <p>
        {tx(t, "mTl_sinBody",
          "The height from C onto side c can be computed from either side of it. From corner A it is b sin A (the hypotenuse is b); from corner B it is a sin B. Both are the same height, so b sin A = a sin B, and dividing by sin A sin B gives a / sin A = b / sin B. The same argument with another height brings in c. The common value has a geometric meaning, shown in the second mode of the figure: it is the diameter 2R of the circle through the three corners, the circumscribed circle.")}
      </p>
      <Equation label={tx(t, "mTl_eqSin", "Law of sines")}
        where={[
          [r`a / \sin A`, tx(t, "mTl_wRatio", "a side divided by the sine of the angle facing it")],
          [r`R`, tx(t, "mTl_wR", "the radius of the circumscribed circle, through A, B and C")],
        ]}
        note={tx(t, "mTl_sinNote", "Example: A = 40°, B = 60°, a = 10. Then C = 80° and the common ratio is 10 / sin 40° ≈ 15.56, so b = 15.56 · sin 60° ≈ 13.47 and c = 15.56 · sin 80° ≈ 15.32.")}>
        {r`\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R`}
      </Equation>

      <H2>{tx(t, "mTl_areaTitle", "Area from two sides and an angle")}</H2>
      <p>
        {tx(t, "mTl_areaBody",
          "The area chapter gave a triangle's area as ½ · base · height. Take b as the base; the height from B onto it is a sin C, as in the derivation above. So the area needs only two sides and the angle between them, no height measured by hand. The Heron formula of the powers chapter gives the same area from three sides.")}
      </p>
      <Equation label={tx(t, "mTl_eqArea", "Area of any triangle")}
        where={[
          [r`a,\ b`, tx(t, "mTl_wAreaAB", "two sides")],
          [r`C`, tx(t, "mTl_wAreaC", "the angle between them")],
        ]}
        note={tx(t, "mTl_areaNote", "Example: sides 6 and 9 with 30° between them: ½ · 6 · 9 · 0.5 = 13.5. The largest area for two given sides comes at C = 90°, where sin C = 1.")}>
        {r`\text{area} = \tfrac12\,a\,b\,\sin C`}
      </Equation>

      <H2>{tx(t, "mTl_whichTitle", "Which law for which data")}</H2>
      <p>
        {tx(t, "mTl_whichBody",
          "The congruence rules of the triangles chapter say which data fix a triangle; the two laws actually compute it. Once two angles are known, the third is 180° minus their sum.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTl_tKnown", "You know"), tx(t, "mTl_tUse", "Use"), tx(t, "mTl_tSteps", "Steps")]}
        rows={[
          [tx(t, "mTl_w1", "SSS: three sides"), tx(t, "mTl_u1", "law of cosines"), tx(t, "mTl_s1", "an angle from cos C = (a² + b² − c²)/2ab, then another, then 180° minus both")],
          [tx(t, "mTl_w2", "SAS: two sides and the angle between"), tx(t, "mTl_u2", "law of cosines"), tx(t, "mTl_s2", "the third side first, then the angles as for SSS")],
          [tx(t, "mTl_w3", "ASA or AAS: two angles and a side"), tx(t, "mTl_u3", "law of sines"), tx(t, "mTl_s3", "third angle by the 180° sum, then each side from the common ratio")],
          [tx(t, "mTl_w4", "SSA: two sides and an angle not between them"), tx(t, "mTl_u4", "law of sines, with care"), tx(t, "mTl_s4", "zero, one or two triangles: see below")],
        ]}
      />
      <H3>{tx(t, "mTl_ssaTitle", "The ambiguous case")}</H3>
      <p>
        {tx(t, "mTl_ssaBody",
          "Knowing b, the angle A and the side a that faces it is not always enough. Corner B has to lie on the ray from A at angle A, and at distance a from C, so on a circle of radius a around C. The distance from C to the ray is b sin A. If a is smaller, the circle misses the ray: no triangle. If a equals it, the circle just touches: one right triangle. If a is between b sin A and b, it cuts the ray twice: two triangles, one acute and one obtuse at B. If a is at least b, one of the crossings is behind A, so one triangle. The law of sines reflects this: sin B = b sin A / a can have two angles between 0° and 180° with that sine, B and 180° − B.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mTl_asinWarn", "asin only ever returns the acute angle. When solving SSA with the law of sines, check whether 180° − B also fits (it does when the angles still add up to less than 180°), or you will silently miss the second triangle.")}
      </Callout>

      <H2>{tx(t, "mTl_ikTitle", "Two-bone inverse kinematics")}</H2>
      <p>
        {tx(t, "mTl_ikBody",
          "Animation often has to work backwards: the hand must touch the door handle, so what should the shoulder and elbow do? That is inverse kinematics (IK). For a limb with two bones, upper arm l₁ and forearm l₂, the shoulder, the elbow and the target form a triangle whose three sides are known: l₁, l₂ and the shoulder-to-target distance d. SSS, so the law of cosines gives all of it. The elbow angle comes straight from the formula; the shoulder turns towards the target and then lifts by the triangle's angle at the shoulder. The last mode of the figure is a working arm.")}
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

      <H2>{tx(t, "mTl_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mTl_ex1",
          "1. Two roads leave a town at 50° to each other. One car drives 30 km along the first, another 45 km along the second. How far apart are they? c² = 30² + 45² − 2 · 30 · 45 · cos 50° ≈ 900 + 2025 − 1735.6 = 1189.4, so c ≈ 34.5 km.")}
      </p>
      <p>
        {tx(t, "mTl_ex2",
          "2. A player sees a tower at 35° left of straight ahead, walks 100 m straight ahead and now sees it at 80°. In the triangle (start, end, tower) the angle at the start is 35°, at the end 180° − 80° = 100°, at the tower 45°. By the law of sines the distance from the end point to the tower is 100 · sin 35° / sin 45° ≈ 81.1 m.")}
      </p>
      <p>
        {tx(t, "mTl_ex3",
          "3. An arm with l₁ = 0.3 m and l₂ = 0.25 m reaches for a point 0.4 m from the shoulder. cos(elbow) = (0.09 + 0.0625 − 0.16)/(2 · 0.3 · 0.25) = −0.0075/0.15 = −0.05, so the elbow is at about 92.9°.")}
      </p>

      <H2>{tx(t, "mTl_codeTitle", "Solving triangles in C++")}</H2>
      <p>
        {tx(t, "mTl_codeBody",
          "Every acos argument is clamped, because rounding can push a fraction to 1.0000001 for a flat triangle and turn the result into NaN. The IK function returns the two joint angles in radians, measured anticlockwise, with the elbow bent to one side (negate the bend for the other).")}
      </p>
      <CodeBlock lang="cpp" filename="triangle_laws.hpp" t={t}>{`#include <algorithm>
#include <cmath>

// Angle C (radians) opposite side c, from three sides: law of cosines
float angleFromSides(float a, float b, float c) {
    float cosC = (a * a + b * b - c * c) / (2.0f * a * b);
    return std::acos(std::clamp(cosC, -1.0f, 1.0f));
}

// Third side from two sides and the angle between them (SAS)
float sideFromSAS(float a, float b, float C) {
    return std::sqrt(a * a + b * b - 2.0f * a * b * std::cos(C));
}

// Side facing angle B, given side a facing angle A (law of sines)
float sideFromSines(float a, float A, float B) { return a * std::sin(B) / std::sin(A); }

float triangleArea(float a, float b, float C) { return 0.5f * a * b * std::sin(C); }

// Two-bone IK in 2D. Shoulder at (sx, sy), target at (tx, ty).
// Outputs the upper arm's world angle and the elbow's interior angle.
void twoBoneIK(float sx, float sy, float tx, float ty, float l1, float l2,
               float& shoulder, float& elbow) {
    float dx = tx - sx, dy = ty - sy;
    float d = std::sqrt(dx * dx + dy * dy);
    d = std::clamp(d, std::abs(l1 - l2) + 1e-4f, l1 + l2 - 1e-4f);  // stay a real triangle
    float toTarget = std::atan2(dy, dx);           // direction to the target
    shoulder = toTarget + angleFromSides(l1, d, l2);  // lift by the angle at the shoulder
    elbow    = angleFromSides(l1, l2, d);          // interior angle at the elbow
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "mTl_atan2Info", "The IK code uses atan2 to find the direction to the target; the Polar Coordinates chapter explains it. For now read it as \"the angle of the line from the shoulder to the target\".")}
      </Callout>

      <H2>{tx(t, "mTl_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTl_tWrong", "Wrong"), tx(t, "mTl_tRight", "Right"), tx(t, "mTl_tWhy", "Why")]}
        rows={[
          [tx(t, "mTl_m1w", "pairing a with angle B"), tx(t, "mTl_m1r", "a faces A, b faces B"), tx(t, "mTl_m1", "both laws pair each side with the opposite angle")],
          [tx(t, "mTl_m2w", "c² = a² + b² − 2ab cos C with C not between a and b"), tx(t, "mTl_m2r", "C must be the angle where a and b meet"), tx(t, "mTl_m2", "the derivation drops the height from that corner")],
          [tx(t, "mTl_m3w", "trusting a single asin in the SSA case"), tx(t, "mTl_m3r", "also test 180° − B"), tx(t, "mTl_m3", "two triangles can fit the data")],
          [tx(t, "mTl_m4w", "acos of an unclamped fraction"), tx(t, "mTl_m4r", "clamp to [−1, 1]"), tx(t, "mTl_m4", "rounding or an unreachable target gives NaN")],
          [tx(t, "mTl_m5w", "area = ½ab for any triangle"), tx(t, "mTl_m5r", "½ab · sin C"), tx(t, "mTl_m5", "½ab is right only when C = 90°")],
        ]}
      />

      <KeyIdeas t={t} id="mTl" items={[
        "Side a faces angle A; each law pairs a side with the angle opposite it.",
        "Law of cosines: c² = a² + b² − 2ab cos C, Pythagoras plus a correction.",
        "Law of sines: a/sin A = b/sin B = c/sin C = 2R.",
        "Area = ½ab sin C from two sides and the angle between them.",
        "SSS and SAS: cosines; ASA and AAS: sines; SSA can give 0, 1 or 2 triangles.",
        "Two-bone IK is an SSS triangle solved with the law of cosines.",
      ]} />
    </Article>
  );
}
