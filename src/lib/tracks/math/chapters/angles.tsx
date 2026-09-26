"use client";

// Geometry 1: points, lines and angles — the basic objects (point, line, ray,
// segment, plane), what an angle measures and why a turn is 360°, the kinds of
// angle, complementary/supplementary/vertical angles, perpendicular and
// parallel lines, the angles a transversal makes, and headings in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { AngleFigure } from "@/components/lesson/figures/math/AngleFigure";
import { ParallelFigure } from "@/components/lesson/figures/math/ParallelFigure";

const r = String.raw;

export function AnglesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAng_intro",
          "Geometry is the mathematics of shape, size and position. Everything a game draws is geometry: a character model is thousands of triangles, a level is walls and floors, a camera is a point that looks in a direction. This section builds that geometry from the ground up, and this first chapter sets out the smallest pieces: points, lines and the angles between them. Angles are how we describe direction and turning, which is what a turret, a steering wheel or a camera does all day.")}
      </Lead>

      <H2>{tx(t, "mAng_objTitle", "Points, lines, rays and segments")}</H2>
      <p>
        {tx(t, "mAng_objBody",
          "Geometry starts from a few objects that are described rather than defined. A point is an exact position with no size at all; we name points with capital letters, like A or P. A line is perfectly straight, has no thickness and goes on forever in both directions; any two different points lie on exactly one line. The parts of a line we actually draw have names too. A segment is the piece between two endpoints, and it has a length. A ray starts at one point and goes on forever in one direction, like a laser beam. A plane is a perfectly flat surface that goes on forever, like an endless sheet of paper. Everything in this section happens in a plane, which is the 2D world of the functions chapter's graphs.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAng_tObj", "Object"), tx(t, "mAng_tNotation", "Notation"), tx(t, "mAng_tMeaning", "What it is"), tx(t, "mAng_tGame", "In a game")]}
        rows={[
          [tx(t, "mAng_o1", "point"), "A", tx(t, "mAng_o1m", "a position, no size"), tx(t, "mAng_o1g", "a vertex of a mesh, a player's position")],
          [tx(t, "mAng_o2", "line"), "AB ↔", tx(t, "mAng_o2m", "straight, endless both ways, through A and B"), tx(t, "mAng_o2g", "an infinite wall used for collision tests")],
          [tx(t, "mAng_o3", "ray"), "AB →", tx(t, "mAng_o3m", "starts at A, passes through B, endless one way"), tx(t, "mAng_o3g", "a bullet's path, a line of sight, a ray tracer's ray")],
          [tx(t, "mAng_o4", "segment"), "AB", tx(t, "mAng_o4m", "the part between A and B, with a length"), tx(t, "mAng_o4g", "an edge of a triangle, a laser with a range")],
          [tx(t, "mAng_o5", "plane"), "—", tx(t, "mAng_o5m", "a flat surface, endless in every direction"), tx(t, "mAng_o5g", "the ground, a mirror, a clipping plane")],
        ]}
      />
      <p>
        {tx(t, "mAng_collinear",
          "Points that lie on one line are collinear. Two lines in a plane either cross at exactly one point, or never meet (they are parallel), or are the same line; the systems of equations chapter found those same three cases with algebra. A line drawn through a point splits the plane into two sides, the half-planes; which side a point is on is one of the most common questions in collision code.")}
      </p>

      <H2>{tx(t, "mAng_angleTitle", "What an angle is")}</H2>
      <p>
        {tx(t, "mAng_angleBody",
          "Two rays that start at the same point form an angle. The shared starting point is the vertex and the two rays are the arms. The size of the angle is how much you would have to turn the first arm, around the vertex, to lay it on the second. It measures turning, not length: making the arms longer does not change the angle. An angle with vertex B and arms through A and C is written ∠ABC (the vertex always in the middle), or with a Greek letter such as θ (theta) or α (alpha).")}
      </p>
      <H3>{tx(t, "mAng_degTitle", "Degrees: why a full turn is 360")}</H3>
      <p>
        {tx(t, "mAng_degBody",
          "The everyday unit is the degree, written °. One full turn, all the way round back to where you started, is 360°. So a half turn is 180° and a quarter turn is 90°. The number 360 is old (the Babylonians used it) and practical: it has 24 divisors, so a half, third, quarter, fifth, sixth, eighth, ninth, tenth and twelfth of a turn are all whole numbers of degrees (the divisibility chapter showed how to count divisors). A protractor is simply a half circle marked from 0° to 180°. The Trigonometry section introduces a second unit, the radian, which is the one code uses; the ideas in this chapter work the same in either unit.")}
      </p>
      <Equation label={tx(t, "mAng_eqTurn", "Fractions of a turn in degrees")}
        where={[
          [r`1\ \text{turn}`, tx(t, "mAng_wTurn", "one complete rotation around the vertex")],
          [r`^{\circ}`, tx(t, "mAng_wDeg", "the degree symbol; one degree is 1/360 of a turn")],
        ]}>
        {r`1\ \text{turn} = 360^{\circ} \qquad \tfrac12\ \text{turn} = 180^{\circ} \qquad \tfrac14\ \text{turn} = 90^{\circ} \qquad \tfrac18\ \text{turn} = 45^{\circ}`}
      </Equation>

      <H2>{tx(t, "mAng_kindsTitle", "Kinds of angle")}</H2>
      <p>
        {tx(t, "mAng_kindsBody",
          "Angles get names by comparing them with the quarter turn and the half turn. A right angle is exactly 90°, the corner of a square; drawings mark it with a small square instead of an arc. Anything smaller is acute (sharp), anything between 90° and 180° is obtuse (blunt). A straight angle is 180°: its two arms point in opposite directions and form a single line. Beyond that, up to a full turn, the angle is reflex. Drag the arm in the figure to see every kind.")}
      </p>
      <AngleFigure t={t} />
      <LessonTable
        headers={[tx(t, "mAng_tName", "Name"), tx(t, "mAng_tSize", "Size"), tx(t, "mAng_tExample", "Example")]}
        rows={[
          [tx(t, "mAng_k1", "acute"), "0° < θ < 90°", tx(t, "mAng_k1e", "the tip of a pizza slice, a narrow cone of vision")],
          [tx(t, "mAng_k2", "right"), "θ = 90°", tx(t, "mAng_k2e", "the corner of a screen, a wall meeting the floor")],
          [tx(t, "mAng_k3", "obtuse"), "90° < θ < 180°", tx(t, "mAng_k3e", "a reclined chair, a wide field of view")],
          [tx(t, "mAng_k4", "straight"), "θ = 180°", tx(t, "mAng_k4e", "turning to face backwards")],
          [tx(t, "mAng_k5", "reflex"), "180° < θ < 360°", tx(t, "mAng_k5e", "the outside of a room's corner, Pac-Man's body")],
          [tx(t, "mAng_k6", "full"), "θ = 360°", tx(t, "mAng_k6e", "a complete spin, which faces the same way as 0°")],
        ]}
      />

      <H2>{tx(t, "mAng_pairsTitle", "Angles that work in pairs")}</H2>
      <p>
        {tx(t, "mAng_pairsBody",
          "Two angles are adjacent when they share a vertex and one arm and do not overlap, so together they make a bigger angle. Many geometry facts come from noticing that adjacent angles fill a known total. If they fill a right angle they are complementary and add to 90°. If they fill a straight line they are supplementary and add to 180°. And all the angles around a point, filling a full turn, add to 360°.")}
      </p>
      <Equation label={tx(t, "mAng_eqPairs", "Complementary, supplementary, around a point")}
        where={[
          [r`\alpha,\ \beta`, tx(t, "mAng_wAB", "two angles (alpha and beta), in degrees")],
          [r`90^{\circ}`, tx(t, "mAng_w90", "complementary angles together make a right angle; each is the other's complement")],
          [r`180^{\circ}`, tx(t, "mAng_w180", "supplementary angles together make a straight line; each is the other's supplement")],
          [r`360^{\circ}`, tx(t, "mAng_w360", "all the angles around one point make a full turn")],
        ]}>
        {r`\alpha + \beta = 90^{\circ} \qquad \alpha + \beta = 180^{\circ} \qquad \alpha_1 + \alpha_2 + \dots + \alpha_n = 360^{\circ}`}
      </Equation>
      <H3>{tx(t, "mAng_vertTitle", "Vertical angles are equal")}</H3>
      <p>
        {tx(t, "mAng_vertBody",
          "When two lines cross they make four angles. The two that face each other across the crossing are called vertical angles (vertical here means \"sharing a vertex\", not \"up and down\"), and they are always equal. The reason is a two-line proof, and it is worth reading because it is the pattern of most geometry proofs: call the angles around the crossing α, β, γ going round. α and β sit on a straight line, so α + β = 180°. β and γ sit on the other line, so β + γ = 180°. Both sums equal 180°, so α + β = β + γ, and subtracting β from both sides leaves α = γ.")}
      </p>
      <Equation label={tx(t, "mAng_eqVert", "Why vertical angles are equal")}
        notes={[
          tx(t, "mAng_v1", "α and β are adjacent on one line: they are supplementary"),
          tx(t, "mAng_v2", "β and γ are adjacent on the other line: also supplementary"),
          tx(t, "mAng_v3", "equal things equal to the same thing: α + β = β + γ"),
          tx(t, "mAng_v4", "subtract β from both sides (the balance rule from linear equations): α = γ"),
        ]}>
        {r`\alpha + \beta = 180^{\circ} = \beta + \gamma \;\Rightarrow\; \alpha = \gamma`}
      </Equation>

      <H2>{tx(t, "mAng_perpTitle", "Perpendicular and parallel lines")}</H2>
      <p>
        {tx(t, "mAng_perpBody",
          "Two lines are perpendicular, written ⊥, when they cross at a right angle; then all four angles at the crossing are 90°. The shortest way from a point to a line is always along the perpendicular, which is why \"the distance from a point to a wall\" means the perpendicular distance. Two lines in a plane are parallel, written ∥, when they never meet however far they are extended. Parallel lines keep the same distance apart everywhere and point in the same direction; in the functions chapter's language, they have the same slope. The grid lines of graph paper are two families of parallel lines, perpendicular to each other.")}
      </p>

      <H2>{tx(t, "mAng_transTitle", "A line crossing two parallels")}</H2>
      <p>
        {tx(t, "mAng_transBody",
          "A line that crosses two other lines is a transversal. It makes four angles at each crossing, eight in total, and those eight come in named pairs. The angles between the two lines are interior; those outside are exterior. When the two lines are parallel, the transversal meets them both at the same slant, so the picture at one crossing is an exact copy of the picture at the other. That one fact gives three rules. The figure lets you check each one, and shows that they break as soon as the lines are not parallel.")}
      </p>
      <ParallelFigure t={t} />
      <LessonTable
        headers={[tx(t, "mAng_tPair", "Pair"), tx(t, "mAng_tWhere", "Where they sit"), tx(t, "mAng_tRule", "Rule (parallel lines)")]}
        rows={[
          [tx(t, "mAng_p1", "vertical"), tx(t, "mAng_p1w", "opposite each other at one crossing"), tx(t, "mAng_p1r", "equal (for any two crossing lines)")],
          [tx(t, "mAng_p2", "corresponding"), tx(t, "mAng_p2w", "the same position at the two crossings"), tx(t, "mAng_p2r", "equal")],
          [tx(t, "mAng_p3", "alternate interior"), tx(t, "mAng_p3w", "between the lines, on opposite sides of the transversal"), tx(t, "mAng_p3r", "equal")],
          [tx(t, "mAng_p4", "co-interior"), tx(t, "mAng_p4w", "between the lines, on the same side of the transversal"), tx(t, "mAng_p4r", "supplementary: they add to 180°")],
        ]}
      />
      <p>
        {tx(t, "mAng_transWhy",
          "The rules follow from each other. Corresponding angles are equal because the crossings are copies. An alternate interior angle is the vertical partner of a corresponding angle, so it is equal too. A co-interior angle sits on a straight line next to an alternate one, so the two co-interior angles add to 180°. The rules also work backwards: if a transversal makes equal corresponding angles with two lines, the lines are parallel. The next chapter uses the alternate-angle rule to prove that the angles of every triangle add up to 180°.")}
      </p>

      <H2>{tx(t, "mAng_exTitle", "Worked example: chasing angles")}</H2>
      <p>
        {tx(t, "mAng_ex1",
          "A road (the transversal) crosses two parallel railway tracks. At the first track, the angle above the track on the right of the road is 65°. Find all eight angles. At the first crossing: the angle next to it on the same line is 180° − 65° = 115° (supplementary). The vertical angles give the other two: 65° opposite 65°, and 115° opposite 115°. The second crossing is a copy of the first, because the tracks are parallel: the same four values in the same positions (corresponding angles). Check one co-interior pair: the angle below the first track on the right is 115°, the angle above the second track on the right is 65°, and 115° + 65° = 180° ✓. With parallel lines, one angle is enough to know all eight.")}
      </p>

      <H2>{tx(t, "mAng_codeTitle", "Headings in C++")}</H2>
      <p>
        {tx(t, "mAng_codeBody",
          "Games often store a direction as a heading angle, for example a turret's rotation. Two problems come up at once. First, angles repeat every full turn: 370° faces the same way as 10°, and −90° the same as 270°, so headings must be wrapped into one standard range. Second, to turn towards a target you need the shortest turn, which is never more than 180° either way: from 350° to 10° is +20°, not −340°. Both come down to the remainder operation from the divisibility chapter, done with std::fmod for floats.")}
      </p>
      <CodeBlock lang="cpp" filename="heading.hpp" t={t}>{`#include <cmath>

// Wraps any angle into [0, 360).  370 -> 10, -90 -> 270
float wrap360(float deg) {
    float r = std::fmod(deg, 360.0f);     // remainder, keeps the sign of deg
    return r < 0.0f ? r + 360.0f : r;
}

// Shortest signed turn from 'from' to 'to', in (-180, 180].
// Positive = anticlockwise.  from 350 to 10 -> +20
float shortestTurn(float from, float to) {
    float d = wrap360(to - from);          // 0 ... 360
    return d > 180.0f ? d - 360.0f : d;    // the long way round becomes the short way
}

// Turns 'heading' towards 'target' by at most 'maxStep' degrees (one frame)
float turnTowards(float heading, float target, float maxStep) {
    float d = shortestTurn(heading, target);
    if (std::abs(d) <= maxStep) return wrap360(target);
    return wrap360(heading + (d > 0.0f ? maxStep : -maxStep));
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "mAng_codeTip", "Never compare headings with == or subtract them directly. Wrap first and use the shortest turn; otherwise a unit facing 359° that wants to face 1° will spin almost a full turn the long way round.")}
      </Callout>

      <H2>{tx(t, "mAng_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mAng_tWrong", "Wrong"), tx(t, "mAng_tRight", "Right"), tx(t, "mAng_tWhy", "Why")]}
        rows={[
          [tx(t, "mAng_m1w", "longer arms make a bigger angle"), tx(t, "mAng_m1r", "only the turn between the arms counts"), tx(t, "mAng_m1", "an angle measures rotation, not length")],
          [tx(t, "mAng_m2w", "∠ABC with the vertex at A"), tx(t, "mAng_m2r", "the middle letter is the vertex"), tx(t, "mAng_m2", "∠ABC is the angle at B")],
          [tx(t, "mAng_m3w", "mixing up complement and supplement"), tx(t, "mAng_m3r", "complement → 90°, supplement → 180°"), tx(t, "mAng_m3", "memory aid: C comes before S, and 90 before 180")],
          [tx(t, "mAng_m4w", "using the parallel rules on lines that are not parallel"), tx(t, "mAng_m4r", "check the lines are parallel first"), tx(t, "mAng_m4", "only vertical angles are equal for any lines")],
          [tx(t, "mAng_m5w", "target − heading as the turn"), tx(t, "mAng_m5r", "wrap the difference into (−180°, 180°]"), tx(t, "mAng_m5", "angles repeat every 360°")],
        ]}
      />

      <KeyIdeas t={t} id="mAng" items={[
        "A point has no size; a line is endless both ways, a ray one way, a segment has two ends and a length.",
        "An angle measures turning around its vertex; a full turn is 360°, a straight angle 180°, a right angle 90°.",
        "Acute < 90° < obtuse < 180° < reflex < 360°.",
        "Complementary angles add to 90°, supplementary to 180°, angles around a point to 360°.",
        "Vertical angles are always equal.",
        "With parallel lines, corresponding and alternate angles are equal and co-interior angles add to 180°.",
        "Wrap headings into [0°, 360°) and turn by the shortest signed difference.",
      ]} />
    </Article>
  );
}
