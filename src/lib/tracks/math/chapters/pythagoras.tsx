"use client";

// Geometry 4: the Pythagorean theorem — the statement with every term, two
// proofs (rearrangement and algebra), finding a missing side, Pythagorean
// triples, the converse and classifying triangles by their sides, the
// distance formula in 2D and 3D, squared distances, and distance code in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { PythagorasFigure } from "@/components/lesson/figures/math/PythagorasFigure";

const r = String.raw;

export function PythagorasContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPy_intro",
          "If a game had to keep only one formula, it would keep this one. How far is the enemy? How long is this vector? Is the player inside the explosion radius? How long is the diagonal of the screen? Each is the Pythagorean theorem, a 2500-year-old fact about right triangles. This chapter states it precisely, proves it in two ways (one of them you can slide around with your mouse), and turns it into the distance formula that the rest of this track, and nearly every game engine, runs thousands of times per frame.")}
      </Lead>

      <H2>{tx(t, "mPy_stmtTitle", "The statement")}</H2>
      <p>
        {tx(t, "mPy_stmtBody",
          "In a right triangle, the two sides that form the 90° corner are the legs, usually called a and b. The third side, opposite the right angle, is the hypotenuse, c; it is always the longest side (it faces the largest angle, as the triangles chapter showed). The theorem says that the square of the hypotenuse equals the sum of the squares of the legs. \"Square\" can be read literally: build a square on each side, and the areas of the two small squares together are exactly the area of the big one.")}
      </p>
      <Equation label={tx(t, "mPy_eqThm", "The Pythagorean theorem")}
        where={[
          [r`a,\ b`, tx(t, "mPy_wAB", "the legs: the two sides that meet at the right angle")],
          [r`c`, tx(t, "mPy_wC", "the hypotenuse: the side opposite the right angle, the longest")],
          [r`a^2`, tx(t, "mPy_wSq", "a squared, a · a: the area of a square with side a")],
        ]}
        note={tx(t, "mPy_thmNote", "It holds only when the angle between a and b is exactly 90°. For other triangles the Trigonometry section adds a correction term (the law of cosines).")}>
        {r`a^2 + b^2 = c^2`}
      </Equation>

      <PythagorasFigure t={t} />

      <H2>{tx(t, "mPy_proofTitle", "Why it is true")}</H2>
      <p>
        {tx(t, "mPy_proofBody",
          "There are hundreds of proofs. The most visual one is in the proof mode of the figure. Take a big square with side a + b and put four copies of the triangle inside it, one in each corner. The space left over in the middle is a square tilted on its corner, with side c: its area is c². Now slide the four triangles into a different arrangement, two rectangles in opposite corners. The space left over is now two squares, one with side a and one with side b. The big square has not changed and the four triangles are the same four, so the space they leave must be the same in both arrangements: c² = a² + b².")}
      </p>
      <H3>{tx(t, "mPy_algTitle", "The same proof in algebra")}</H3>
      <p>
        {tx(t, "mPy_algBody",
          "The first arrangement can also be written as an equation. The big square's area is (a + b)². It is made of the tilted square, c², and four triangles, each with area ½ab (half the rectangle a × b, from the area chapter). Expanding the bracket, as in the expressions chapter, finishes the proof.")}
      </p>
      <Equation label={tx(t, "mPy_eqAlg", "Algebraic proof")}
        notes={[
          tx(t, "mPy_a1", "big square = tilted square + four triangles"),
          tx(t, "mPy_a2", "expand (a + b)² = a² + 2ab + b², and 4 · ½ab = 2ab"),
          tx(t, "mPy_a3", "subtract 2ab from both sides"),
        ]}>
        {r`(a + b)^2 = c^2 + 4\cdot\tfrac12 ab \;\Rightarrow\; a^2 + 2ab + b^2 = c^2 + 2ab \;\Rightarrow\; a^2 + b^2 = c^2`}
      </Equation>

      <H2>{tx(t, "mPy_findTitle", "Finding a missing side")}</H2>
      <p>
        {tx(t, "mPy_findBody",
          "Knowing any two sides of a right triangle gives the third. For the hypotenuse, add the squares of the legs and take the square root (the powers chapter covered √). For a leg, subtract the square of the other leg from the square of the hypotenuse, then take the root. Only the positive root makes sense, because a length cannot be negative.")}
      </p>
      <Equation label={tx(t, "mPy_eqSolve", "Solving for each side")}
        where={[
          [r`\sqrt{\ }`, tx(t, "mPy_wRoot", "the square root, the positive number whose square is inside")],
          [r`c^2 - a^2`, tx(t, "mPy_wDiff", "must be positive: the hypotenuse is longer than either leg")],
        ]}>
        {r`c = \sqrt{a^2 + b^2} \qquad a = \sqrt{c^2 - b^2} \qquad b = \sqrt{c^2 - a^2}`}
      </Equation>
      <p>
        {tx(t, "mPy_findEx",
          "Examples. A 1920 × 1080 screen has a diagonal of √(1920² + 1080²) = √(3 686 400 + 1 166 400) = √4 852 800 ≈ 2203 pixels. A 5 m ladder with its foot 3 m from a wall reaches √(5² − 3²) = √(25 − 9) = √16 = 4 m up the wall. A square with side 1 has a diagonal of √(1 + 1) = √2 ≈ 1.414, which is why moving diagonally on a grid covers about 41% more distance than moving straight, and why games that add the x and y inputs without normalising let players run faster diagonally.")}
      </p>

      <H2>{tx(t, "mPy_triplesTitle", "Pythagorean triples")}</H2>
      <p>
        {tx(t, "mPy_triplesBody",
          "Usually at least one side comes out irrational, like √2. A few right triangles have three whole-number sides; these are Pythagorean triples. The smallest is 3, 4, 5 (9 + 16 = 25). Multiplying a triple by any whole number gives another one: 6, 8, 10 and 30, 40, 50. Builders have used 3-4-5 for millennia to check a right angle with nothing but a rope: mark 3 units along one wall and 4 along the other, and the corner is square exactly when the diagonal between the marks is 5.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPy_tTriple", "Triple a, b, c"), tx(t, "mPy_tCheck", "Check"), tx(t, "mPy_tNote", "Note")]}
        rows={[
          ["3, 4, 5", "9 + 16 = 25", tx(t, "mPy_tr1", "the smallest; the builder's triangle")],
          ["5, 12, 13", "25 + 144 = 169", tx(t, "mPy_tr2", "a thin triangle")],
          ["8, 15, 17", "64 + 225 = 289", ""],
          ["7, 24, 25", "49 + 576 = 625", ""],
          ["6, 8, 10", "36 + 64 = 100", tx(t, "mPy_tr5", "3, 4, 5 doubled")],
        ]}
      />

      <H2>{tx(t, "mPy_convTitle", "The converse: testing for a right angle")}</H2>
      <p>
        {tx(t, "mPy_convBody",
          "The theorem also works backwards: if three sides satisfy a² + b² = c², the triangle has a right angle, opposite c. Comparing instead of testing for equality classifies any triangle by its angles, using only its sides. Let c be the longest side. If c² is smaller than a² + b², the angle opposite c is narrower than a right angle, so every angle is acute. If c² is larger, that angle has opened past 90° and the triangle is obtuse. Only the largest angle can be 90° or more, so looking at the longest side is enough.")}
      </p>
      <Equation label={tx(t, "mPy_eqConv", "Classifying a triangle by its sides")}
        where={[
          [r`c`, tx(t, "mPy_wLong", "the longest side")],
          [r`a,\ b`, tx(t, "mPy_wOther", "the other two sides")],
        ]}
        note={tx(t, "mPy_convNote", "Example: 5, 6, 8. The longest is 8: 5² + 6² = 25 + 36 = 61 and 8² = 64 > 61, so the triangle is obtuse. With 6, 7, 8: 36 + 49 = 85 > 64, acute.")}>
        {r`c^2 < a^2 + b^2 \Rightarrow \text{acute} \qquad c^2 = a^2 + b^2 \Rightarrow \text{right} \qquad c^2 > a^2 + b^2 \Rightarrow \text{obtuse}`}
      </Equation>

      <H2>{tx(t, "mPy_distTitle", "The distance between two points")}</H2>
      <p>
        {tx(t, "mPy_distBody",
          "Here is where the theorem earns its keep. Two points P = (x₁, y₁) and Q = (x₂, y₂) on a grid are joined by a straight segment. Walking from P to Q the long way, you first move sideways by Δx = x₂ − x₁ and then up or down by Δy = y₂ − y₁ (Δ, delta, means \"change in\"). Those two moves are perpendicular, so they are the legs of a right triangle, and the straight segment is its hypotenuse. The distance is therefore √(Δx² + Δy²). The distance mode of the figure draws the triangle for any two points. Because the differences are squared, their signs vanish: it does not matter which point you call P.")}
      </p>
      <Equation label={tx(t, "mPy_eqDist", "The distance formula in 2D")}
        where={[
          [r`(x_1, y_1),\ (x_2, y_2)`, tx(t, "mPy_wPts", "the coordinates of the two points")],
          [r`\Delta x = x_2 - x_1`, tx(t, "mPy_wDx", "the horizontal change, one leg")],
          [r`\Delta y = y_2 - y_1`, tx(t, "mPy_wDy", "the vertical change, the other leg")],
          [r`d`, tx(t, "mPy_wD", "the straight-line distance, the hypotenuse; never negative")],
        ]}
        note={tx(t, "mPy_distNote", "Example: from (−4, −2) to (3, 2): Δx = 7, Δy = 4, d = √(49 + 16) = √65 ≈ 8.06.")}>
        {r`d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} = \sqrt{\Delta x^2 + \Delta y^2}`}
      </Equation>
      <H3>{tx(t, "mPy_3dTitle", "In three dimensions")}</H3>
      <p>
        {tx(t, "mPy_3dBody",
          "In a 3D world a point has a third coordinate, z. Apply the theorem twice. On the floor, the distance across is √(Δx² + Δy²). That floor distance and the height change Δz are perpendicular too (height goes straight up from the floor), so they are the legs of a second right triangle. Squaring the first root undoes it, and the result is simply one more squared term under the root. The same pattern continues for any number of dimensions, which is how machine learning measures distance between vectors of hundreds of numbers.")}
      </p>
      <Equation label={tx(t, "mPy_eq3d", "The distance formula in 3D")}
        where={[
          [r`\Delta z = z_2 - z_1`, tx(t, "mPy_wDz", "the change in height, the third leg")],
          [r`\sqrt{\Delta x^2 + \Delta y^2}`, tx(t, "mPy_wFloor", "the distance across the floor, the first hypotenuse")],
        ]}
        note={tx(t, "mPy_3dNote", "Example: the diagonal of a 1 × 1 × 1 cube is √(1 + 1 + 1) = √3 ≈ 1.732. A 3 × 4 × 12 box has a diagonal of √(9 + 16 + 144) = √169 = 13.")}>
        {r`d = \sqrt{\left(\sqrt{\Delta x^2 + \Delta y^2}\right)^2 + \Delta z^2} = \sqrt{\Delta x^2 + \Delta y^2 + \Delta z^2}`}
      </Equation>

      <H2>{tx(t, "mPy_sqTitle", "Skip the square root when you can")}</H2>
      <p>
        {tx(t, "mPy_sqBody",
          "A square root costs much more than a multiplication. Many questions only compare distances: is the enemy within 10 m, which pickup is closest? For lengths (never negative), d < r exactly when d² < r², because squaring keeps the order of positive numbers. So compare the squared distance with the squared range and never take a root. Engines provide lengthSquared or distanceSquared functions for exactly this reason. The root is needed only when the actual distance is used as a number, for example to move 3 m towards a target or to show \"42 m\" on screen.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mPy_sqTip", "Square the threshold once, outside the loop: const float r2 = range * range; then inside it compare dx*dx + dy*dy < r2. That is three multiplications, one addition and one comparison per object.")}
      </Callout>

      <H2>{tx(t, "mPy_codeTitle", "Distances in C++")}</H2>
      <p>
        {tx(t, "mPy_codeBody",
          "The formulas become a few short functions. std::hypot computes √(x² + y²) while avoiding overflow for very large values (the squares of big floats can exceed the float range even when the distance does not); for the everyday sizes in a game, the direct formula is fine and faster. The classifier puts the triangles chapter and this one together.")}
      </p>
      <CodeBlock lang="cpp" filename="distance.hpp" t={t}>{`#include <cmath>
#include <algorithm>

struct Vec2 { float x, y; };
struct Vec3 { float x, y, z; };

float distanceSq(Vec2 p, Vec2 q) {
    float dx = q.x - p.x, dy = q.y - p.y;
    return dx * dx + dy * dy;                    // no root: for comparisons
}
float distance(Vec2 p, Vec2 q) { return std::sqrt(distanceSq(p, q)); }

float distance(Vec3 p, Vec3 q) {
    float dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z;
    return std::sqrt(dx * dx + dy * dy + dz * dz);
}

// Is q within 'range' of p?  Squared on both sides, no sqrt.
bool withinRange(Vec2 p, Vec2 q, float range) {
    return distanceSq(p, q) <= range * range;
}

enum class ByAngles { Acute, Right, Obtuse };

// Sides must already form a triangle (see isTriangle in the triangles chapter)
ByAngles classifyAngles(float a, float b, float c, float eps = 1e-4f) {
    float s[3] = { a, b, c };
    std::sort(s, s + 3);                         // s[2] is the longest side
    float lhs = s[0] * s[0] + s[1] * s[1], rhs = s[2] * s[2];
    if (std::abs(lhs - rhs) <= eps * rhs) return ByAngles::Right;   // relative tolerance
    return rhs < lhs ? ByAngles::Acute : ByAngles::Obtuse;
}`}</CodeBlock>

      <H2>{tx(t, "mPy_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPy_tWrong", "Wrong"), tx(t, "mPy_tRight", "Right"), tx(t, "mPy_tWhy", "Why")]}
        rows={[
          ["c = a + b", "c = √(a² + b²)", tx(t, "mPy_m1", "the squares add, not the sides; a + b is the walk along the legs")],
          ["√(a² + b²) = a + b", tx(t, "mPy_m2r", "the root does not split over +"), tx(t, "mPy_m2", "√(9 + 16) = 5, but 3 + 4 = 7")],
          [tx(t, "mPy_m3w", "a² + c² = b² with c a leg"), tx(t, "mPy_m3r", "c is the side opposite the right angle"), tx(t, "mPy_m3", "the hypotenuse is always alone on its side")],
          [tx(t, "mPy_m4w", "using it on a triangle without a right angle"), tx(t, "mPy_m4r", "check for the 90° corner first"), tx(t, "mPy_m4", "otherwise use the law of cosines (Trigonometry)")],
          [tx(t, "mPy_m5w", "sqrt in every range check"), tx(t, "mPy_m5r", "compare squared distances"), tx(t, "mPy_m5", "same answer, much cheaper")],
          [tx(t, "mPy_m6w", "adding x and y input for diagonal movement"), tx(t, "mPy_m6r", "scale the combined direction back to length 1"), tx(t, "mPy_m6", "otherwise diagonals are √2 ≈ 1.41 times faster")],
        ]}
      />

      <KeyIdeas t={t} id="mPy" items={[
        "In a right triangle, a² + b² = c², where c is the hypotenuse, opposite the right angle.",
        "Proof: four copies of the triangle in a square of side a + b leave either c² or a² + b² uncovered.",
        "c = √(a² + b²); a leg is √(c² − other leg²).",
        "Triples like 3-4-5 have whole-number sides; the converse tests for a right angle.",
        "Longest side c: c² < a² + b² acute, = right, > obtuse.",
        "Distance: d = √(Δx² + Δy²), and in 3D add Δz².",
        "Compare squared distances to avoid square roots.",
      ]} />
    </Article>
  );
}
