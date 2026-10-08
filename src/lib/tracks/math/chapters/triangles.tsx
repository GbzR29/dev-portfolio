"use client";

// Geometry 2: triangles — parts and naming, the 180° angle sum and its proof,
// the exterior angle, naming by sides and by angles, isosceles base angles,
// the triangle inequality, congruence (SSS, SAS, ASA, AAS, RHS) and why
// frames are built from triangles, the centroid, and checking three lengths by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TriangleFigure } from "@/components/lesson/figures/math/TriangleFigure";

const r = String.raw;

// ── Live formulas: the third angle, and whether three lengths close ───────────

const num = (v: number) => String(Math.round(v * 100) / 100);
const degf = (v: number) => `${v}°`;

function thirdAngle(v: Record<string, number>, t: TrackTranslations) {
  const C = 180 - v.A - v.B;
  if (C <= 0) return { tex: r`C = 180^\circ - (${v.A}^\circ + ${v.B}^\circ) = \red{${C}^\circ} \quad \text{${tx(t, "mTri_liveNoTri", "no triangle")}}` };
  const big = Math.max(v.A, v.B, C);
  const kind = big === 90 ? tx(t, "mTri_n5", "right") : big > 90 ? tx(t, "mTri_n6", "obtuse") : tx(t, "mTri_n4", "acute");
  return { tex: r`C = 180^\circ - (${v.A}^\circ + ${v.B}^\circ) = \green{${C}^\circ} \qquad \varepsilon_C = A + B = ${v.A + v.B}^\circ \qquad \text{${kind}}` };
}

function closes(v: Record<string, number>, t: TrackTranslations) {
  const [s, m, l] = [v.a, v.b, v.c].sort((x, y) => x - y);
  const sum = s + m;
  const verdict = sum > l ? r`\green{\text{${tx(t, "mTri_liveYes", "a triangle")}}}` : sum === l ? r`\amber{\text{${tx(t, "mTri_liveFlat", "flat")}}}` : r`\red{\text{${tx(t, "mTri_liveNo", "no triangle")}}}`;
  return { tex: r`${num(s)} + ${num(m)} = ${num(sum)} \;${sum > l ? ">" : sum === l ? "=" : "<"}\; ${num(l)} \quad\Rightarrow\quad ${verdict}` };
}

export function TrianglesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTri_intro",
          "Surveyors map whole countries by splitting the land into triangles, and roof trusses, bridges and bicycle frames are built from them. There is a reason: the triangle is the simplest shape that encloses an area, it is always flat, and its three sides fix its shape completely. This chapter covers what every triangle has in common: its angles always add up to 180°, its sides obey the triangle inequality, and a few measurements are enough to pin it down exactly.")}
      </Lead>

      <H2>{tx(t, "mTri_partsTitle", "Parts and names")}</H2>
      <p>
        {tx(t, "mTri_partsBody",
          "A triangle is three points that are not on one line (not collinear), joined by three segments. The points are its vertices (singular: vertex) or corners, the segments are its sides, and at each vertex the two sides make an interior angle. We name a triangle by its vertices, △ABC. The standard convention, used in every formula in this track, names each side after the vertex opposite it: side a is across from vertex A, b across from B, c across from C. The same capital letter is also used for the angle at that vertex, so A can mean both the corner and its angle.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTri_tPart", "Part"), tx(t, "mTri_tCount", "How many"), tx(t, "mTri_tNote", "Note")]}
        rows={[
          [tx(t, "mTri_p1", "vertices A, B, C"), "3", tx(t, "mTri_p1n", "any three points not on one line")],
          [tx(t, "mTri_p2", "sides a, b, c"), "3", tx(t, "mTri_p2n", "side a joins B and C, so it is opposite A")],
          [tx(t, "mTri_p3", "interior angles A, B, C"), "3", tx(t, "mTri_p3n", "together always 180°")],
          [tx(t, "mTri_p4", "exterior angles"), tx(t, "mTri_p4c", "3 (one per corner)"), tx(t, "mTri_p4n", "made by one side and the extension of the next")],
        ]}
      />

      <H2>{tx(t, "mTri_sumTitle", "The angles add up to 180°")}</H2>
      <p>
        {tx(t, "mTri_sumBody",
          "Draw any triangle, cut out its three corners and lay them side by side: they always fill a straight line exactly. The figure below does this for whatever triangle you drag. It is not a coincidence of the drawings you tried; there is a proof, and it uses the parallel lines from the previous chapter. Through vertex C draw the line parallel to side AB. At C that line makes three angles that together form a straight angle, 180°. The left one is an alternate angle to A (AC is the transversal), so it equals A. The right one is an alternate angle to B (BC is the transversal), so it equals B. The middle one is the triangle's own angle C. So A + B + C = 180°.")}
      </p>
      <Equation label={tx(t, "mTri_eqSum", "The angle sum of a triangle")}
        where={[
          [r`A,\ B,\ C`, tx(t, "mTri_wABC", "the three interior angles of the triangle, in degrees")],
          [r`180^{\circ}`, tx(t, "mTri_w180", "a straight angle: the three angles, placed side by side, fill a line")],
        ]}
        words={tx(t, "mTri_sumWords", "The three angles of any triangle, put side by side, make a straight line.")}
        note={tx(t, "mTri_sumNote", "Consequences: a triangle has at most one right or obtuse angle (two of them would already make 180° or more), and if you know two angles the third is 180° minus their sum.")}>
        {r`A + B + C = 180^{\circ}`}
      </Equation>
      <Derivation t={t} label={tx(t, "mTri_derSum", "The proof, one step at a time")}
        steps={[
          { full: true, tex: r`\alpha + C + \beta = 180^{\circ}`, why: tx(t, "mTri_ds1", "through C draw the line parallel to AB; the three angles at C along it, α on the left and β on the right, fill a straight angle") },
          { full: true, tex: r`\alpha = A`, why: tx(t, "mTri_ds2", "α and A are alternate angles: AC crosses the two parallel lines") },
          { full: true, tex: r`\beta = B`, why: tx(t, "mTri_ds3", "β and B are alternate angles: BC crosses the two parallel lines") },
          { full: true, tex: r`\green{A + C + B = 180^{\circ}}`, why: tx(t, "mTri_ds4", "put A in place of α and B in place of β in the first line") },
        ]} />
      <LiveFormula label={tx(t, "mTri_liveThird", "Try it: the third angle")}
        tex={r`C = 180^\circ - (A + B)`}
        vars={[
          { id: "A", label: tx(t, "mTri_liveA", "angle A"), min: 5, max: 175, step: 5, value: 48, fmt: degf },
          { id: "B", label: tx(t, "mTri_liveB", "angle B"), min: 5, max: 175, step: 5, value: 67, fmt: degf },
        ]}
        compute={v => thirdAngle(v, t)}
        note={tx(t, "mTri_liveThirdNote", "Push A + B up to 180° or more and nothing is left for C: no triangle. The exterior angle at C, A + B, is shown too; the next paragraph explains it.")} />

      <TriangleFigure t={t} />

      <H3>{tx(t, "mTri_extTitle", "The exterior angle")}</H3>
      <p>
        {tx(t, "mTri_extBody",
          "Extend one side past a vertex, say side BC past C. The angle between the extension and side CA is an exterior angle. It sits next to the interior angle C on a straight line, so it equals 180° − C. And since A + B = 180° − C as well, the exterior angle equals A + B, the sum of the two interior angles at the other corners. This is a handy shortcut: it gives the outside angle without ever computing C.")}
      </p>
      <Derivation t={t} label={tx(t, "mTri_eqExt", "The exterior angle at C")}
        where={[
          [r`\varepsilon_C`, tx(t, "mTri_wExt", "the exterior angle at C (epsilon), between side CA and the extension of BC")],
          [r`180^{\circ} - C`, tx(t, "mTri_wSupp", "it is supplementary to the interior angle C")],
        ]}
        steps={[
          { full: true, tex: r`\varepsilon_C = 180^{\circ} - C`, why: tx(t, "mTri_de1", "ε_C and C sit side by side on the line BC: supplementary") },
          { full: true, tex: r`A + B = 180^{\circ} - C`, why: tx(t, "mTri_de2", "the angle sum A + B + C = 180°, with C moved to the right") },
          { full: true, tex: r`\green{\varepsilon_C = A + B}`, why: tx(t, "mTri_de3", "both equal 180° − C, so they equal each other") },
        ]} />

      <H2>{tx(t, "mTri_kindsTitle", "Naming triangles")}</H2>
      <p>
        {tx(t, "mTri_kindsBody",
          "Triangles are named in two independent ways: by how many sides are equal, and by their largest angle. Every triangle gets one name from each list, so \"right isosceles\" (the half of a square cut along its diagonal) and \"obtuse scalene\" are both possible. Drawings mark equal sides with the same number of small tick marks.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTri_tBy", "By"), tx(t, "mTri_tName", "Name"), tx(t, "mTri_tMeans", "Means")]}
        rows={[
          [tx(t, "mTri_bySides", "sides"), tx(t, "mTri_n1", "equilateral"), tx(t, "mTri_n1m", "all three sides equal; then all three angles are 60°")],
          [tx(t, "mTri_bySides", "sides"), tx(t, "mTri_n2", "isosceles"), tx(t, "mTri_n2m", "at least two sides equal; the angles opposite them are equal")],
          [tx(t, "mTri_bySides", "sides"), tx(t, "mTri_n3", "scalene"), tx(t, "mTri_n3m", "no two sides equal; no two angles equal")],
          [tx(t, "mTri_byAngles", "angles"), tx(t, "mTri_n4", "acute"), tx(t, "mTri_n4m", "all three angles below 90°")],
          [tx(t, "mTri_byAngles", "angles"), tx(t, "mTri_n5", "right"), tx(t, "mTri_n5m", "one angle is exactly 90°; the side opposite it is the hypotenuse")],
          [tx(t, "mTri_byAngles", "angles"), tx(t, "mTri_n6", "obtuse"), tx(t, "mTri_n6m", "one angle is above 90°")],
        ]}
      />
      <p>
        {tx(t, "mTri_isoBody",
          "The isosceles rule, equal sides face equal angles, works both ways: if two angles are equal, the sides opposite them are equal too. More generally, in any triangle the longest side faces the largest angle and the shortest side faces the smallest angle. The equilateral triangle is the extreme case: three equal sides, so three equal angles, and 180° ÷ 3 = 60° each.")}
      </p>

      <H2>{tx(t, "mTri_ineqTitle", "The triangle inequality")}</H2>
      <p>
        {tx(t, "mTri_ineqBody",
          "Not every three lengths make a triangle. Try sticks of 2, 3 and 10: the two short ones together reach only 5, so they cannot meet over the long one. The rule is that each side must be shorter than the other two together. Geometrically it says that the straight path between two points is the shortest one: going from A to B directly (side c) is shorter than going via C (sides b and a). When one side exactly equals the sum of the other two, the triangle collapses into a flat segment, a degenerate triangle with no area. Switch the figure to its second mode to try lengths.")}
      </p>
      <Equation label={tx(t, "mTri_eqIneq", "The triangle inequality")}
        where={[
          [r`a, b, c`, tx(t, "mTri_wSides", "the three side lengths, all positive")],
          [r`<`, tx(t, "mTri_wLess", "strictly less; with = the triangle is flat (degenerate)")],
        ]}
        words={tx(t, "mTri_ineqWords", "Every side is shorter than the other two put together: going straight is always shorter than taking a detour through the third corner.")}
        note={tx(t, "mTri_ineqNote", "In practice you only need one check: the longest side must be shorter than the sum of the other two. The other two inequalities then hold automatically.")}>
        {r`a < b + c \qquad b < a + c \qquad c < a + b`}
      </Equation>
      <LiveFormula label={tx(t, "mTri_liveClose", "Try it: does it close?")}
        tex={r`\text{${tx(t, "mTri_liveS", "shortest")}} + \text{${tx(t, "mTri_liveM", "middle")}} > \text{${tx(t, "mTri_liveL", "longest")}}`}
        vars={[
          { id: "a", label: "a", min: 0.5, max: 12, step: 0.5, value: 4, fmt: num },
          { id: "b", label: "b", min: 0.5, max: 12, step: 0.5, value: 7, fmt: num },
          { id: "c", label: "c", min: 0.5, max: 12, step: 0.5, value: 12, fmt: num },
        ]}
        compute={v => closes(v, t)}
        note={tx(t, "mTri_liveCloseNote", "The formula sorts the three lengths first, so only one comparison is needed. Make the two short ones add up exactly to the long one to see the flat, degenerate case.")} />

      <H2>{tx(t, "mTri_congTitle", "Congruence: when two triangles are the same")}</H2>
      <p>
        {tx(t, "mTri_congBody",
          "Two shapes are congruent, written ≅, when one can be moved onto the other exactly, by sliding, turning and possibly flipping it over, without stretching. Congruent triangles have all three sides and all three angles equal. The useful discovery is that you do not have to check all six: some combinations of three measurements already force the rest. For example, if you know all three sides, there is only one triangle you can build with them (the second mode of the figure shows it: the two arcs cross at one point above the base, and the one below is just its mirror image).")}
      </p>
      <LessonTable
        headers={[tx(t, "mTri_tRule", "Rule"), tx(t, "mTri_tKnown", "What must match"), tx(t, "mTri_tWhy", "Why it is enough")]}
        rows={[
          ["SSS", tx(t, "mTri_c1", "all three sides"), tx(t, "mTri_c1w", "three lengths build one triangle (up to mirroring)")],
          ["SAS", tx(t, "mTri_c2", "two sides and the angle between them"), tx(t, "mTri_c2w", "the angle fixes where the two sides end; the third side just joins them")],
          ["ASA", tx(t, "mTri_c3", "two angles and the side between them"), tx(t, "mTri_c3w", "the two rays from the ends of the side meet at one point")],
          ["AAS", tx(t, "mTri_c4", "two angles and a side not between them"), tx(t, "mTri_c4w", "two angles give the third (180° sum), so it becomes ASA")],
          ["RHS", tx(t, "mTri_c5", "right angle, hypotenuse and one other side"), tx(t, "mTri_c5w", "a special case that works only with the 90° corner")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "mTri_congWarn", "Two combinations do not work. AAA (three equal angles) fixes the shape but not the size: a small and a big equilateral triangle have the same angles. Those triangles are similar, not congruent, and a later chapter is about them. SSA (two sides and an angle that is not between them) can allow two different triangles, so it proves nothing.")}
      </Callout>
      <H3>{tx(t, "mTri_rigidTitle", "Why frames are built from triangles")}</H3>
      <p>
        {tx(t, "mTri_rigidBody",
          "SSS has a physical meaning: a triangle made of three rigid bars cannot change shape, because three fixed lengths allow only one triangle. A square frame of four bars has no such rule and folds into a rhombus at the lightest push. That is why bridges, cranes, gates and roof trusses are full of triangles, and why a wobbly bookshelf is fixed with one diagonal brace: the brace cuts the rectangle into two triangles. Two more facts make triangles the basic building block of geometry itself. Three points always lie in one plane, so a triangle is always flat, while four points need not be (a sheet of card with four corners can be bent along a diagonal). And every polygon, however many sides it has, can be cut into triangles by drawing diagonals, which is how the next chapter finds the area of any polygon.")}
      </p>

      <H2>{tx(t, "mTri_centroidTitle", "The centroid")}</H2>
      <p>
        {tx(t, "mTri_centroidBody",
          "A median is the segment from a vertex to the midpoint of the opposite side. The three medians of any triangle meet at one point, the centroid. It is the triangle's balance point: cut a triangle out of card and it balances on a pin at the centroid. With coordinates it is simply the average of the three corners, computed separately for x and for y. That is also why it is the balance point: each corner pulls with the same weight, and the average is where those pulls cancel.")}
      </p>
      <Equation label={tx(t, "mTri_eqCentroid", "The centroid of a triangle")}
        where={[
          [r`(x_A, y_A), \dots`, tx(t, "mTri_wCoords", "the coordinates of the three vertices")],
          [r`G`, tx(t, "mTri_wG", "the centroid, where the three medians meet; it lies two thirds of the way from each vertex to the midpoint of the opposite side")],
        ]}
        words={tx(t, "mTri_centroidWords", "The balance point's x is the average of the three corners' x values, and its y the average of their y values.")}
        note={tx(t, "mTri_centroidNote", "Example: A = (0, 0), B = (6, 0), C = (3, 9) gives G = ((0 + 6 + 3)/3, (0 + 0 + 9)/3) = (3, 3).")}>
        {r`G = \left( \frac{x_A + x_B + x_C}{3},\ \frac{y_A + y_B + y_C}{3} \right)`}
      </Equation>

      <H2>{tx(t, "mTri_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mTri_ex1",
          "1. Two angles of a triangle are 48° and 67°. The third is 180° − (48° + 67°) = 180° − 115° = 65°. All three are below 90° and all differ, so the triangle is acute and scalene.")}
      </p>
      <p>
        {tx(t, "mTri_ex2",
          "2. An isosceles triangle has a 40° angle between its two equal sides. The other two angles are equal (they face the equal sides), and together they are 180° − 40° = 140°, so each is 70°.")}
      </p>
      <p>
        {tx(t, "mTri_ex3",
          "3. Can 4, 7 and 12 be the sides of a triangle? The longest side is 12, and 4 + 7 = 11 < 12, so no: the two short sides cannot reach each other. With 4, 8 and 12 we get 4 + 8 = 12, a flat, degenerate triangle. With 5, 8 and 12, 5 + 8 = 13 > 12, so yes.")}
      </p>

      <H2>{tx(t, "mTri_checkTitle", "Checking three lengths by hand")}</H2>
      <p>
        {tx(t, "mTri_checkBody",
          "Given three lengths, say for a triangular garden bed or a frame you are about to cut, three questions settle everything the side lengths can tell you. Do them in this order. First, write the lengths from shortest to longest; then only the last one needs testing. Second, apply the triangle inequality to the longest side: add the two shorter ones and compare. Third, count equal lengths to name the triangle by its sides.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTri_tLengths", "Lengths"), tx(t, "mTri_tSorted", "Sorted"), tx(t, "mTri_tTest", "Two short ones vs longest"), tx(t, "mTri_tVerdict", "Verdict")]}
        rows={[
          ["9, 4, 6", "4, 6, 9", "4 + 6 = 10 > 9", tx(t, "mTri_v1", "a triangle; all different, so scalene")],
          ["5, 8, 5", "5, 5, 8", "5 + 5 = 10 > 8", tx(t, "mTri_v2", "a triangle; two equal, so isosceles")],
          ["3, 12, 8", "3, 8, 12", "3 + 8 = 11 < 12", tx(t, "mTri_v3", "no triangle: the short sides cannot meet")],
          ["2.5, 7, 4.5", "2.5, 4.5, 7", "2.5 + 4.5 = 7 = 7", tx(t, "mTri_v4", "flat (degenerate): the corners lie on one line")],
          ["6, 6, 6", "6, 6, 6", "6 + 6 = 12 > 6", tx(t, "mTri_v5", "a triangle; all equal, so equilateral, 60° each")],
        ]}
      />
      <p>
        {tx(t, "mTri_checkNext",
          "Naming the triangle by its angles (acute, right or obtuse) from the three sides needs one more tool, the Pythagorean theorem; it is the last worked example of that chapter.")}
      </p>

      <H2>{tx(t, "mTri_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTri_tWrong", "Wrong"), tx(t, "mTri_tRight", "Right"), tx(t, "mTri_tWhy2", "Why")]}
        rows={[
          [tx(t, "mTri_m1w", "side a between A and B"), tx(t, "mTri_m1r", "side a is opposite A, between B and C"), tx(t, "mTri_m1", "the formulas later depend on this convention")],
          [tx(t, "mTri_m2w", "a triangle with two right angles"), tx(t, "mTri_m2r", "at most one angle ≥ 90°"), tx(t, "mTri_m2", "two of them already use up 180°")],
          [tx(t, "mTri_m3w", "checking only a + b > c for a random c"), tx(t, "mTri_m3r", "check the longest side"), tx(t, "mTri_m3", "a short side always passes")],
          [tx(t, "mTri_m4w", "AAA proves congruence"), tx(t, "mTri_m4r", "AAA only proves the same shape"), tx(t, "mTri_m4", "the size can still differ")],
          [tx(t, "mTri_m5w", "any three points make a triangle"), tx(t, "mTri_m5r", "three points on one line do not"), tx(t, "mTri_m5", "collinear points enclose no area: the \"triangle\" is flat")],
        ]}
      />

      <KeyIdeas t={t} id="mTri" items={[
        "Side a is opposite vertex A; the longest side faces the largest angle.",
        "A + B + C = 180°, proved with a parallel line and alternate angles.",
        "An exterior angle equals the sum of the two opposite interior angles.",
        "Named by sides (equilateral, isosceles, scalene) and by angles (acute, right, obtuse).",
        "Triangle inequality: the longest side must be shorter than the other two together.",
        "SSS, SAS, ASA, AAS and RHS prove congruence; AAA and SSA do not.",
        "The centroid is the average of the corners, where the medians meet.",
      ]} />
    </Article>
  );
}
