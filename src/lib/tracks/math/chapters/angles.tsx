"use client";

// Geometry 1: points, lines and angles — the basic objects (point, line, ray,
// segment, plane), what an angle measures and why a turn is 360°, the kinds of
// angle, complementary/supplementary/vertical angles, perpendicular and
// parallel lines, the angles a transversal makes, and compass bearings by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { AngleFigure } from "@/components/lesson/figures/math/AngleFigure";
import { ParallelFigure } from "@/components/lesson/figures/math/ParallelFigure";

const r = String.raw;

// ── Live formulas: shortest turn between bearings, angle between clock hands ──

const num = (v: number) => String(Math.round(v * 100) / 100);
const deg = (v: number) => `${num(v).replace("-", "−")}°`;
const wrap = (v: number) => ((v % 360) + 360) % 360;

function turnNumbers(v: Record<string, number>, t: TrackTranslations) {
  const d = v.to - v.from, w = wrap(d), s = w > 180 ? w - 360 : w;
  const way = r`\text{${s > 0 ? tx(t, "mAng_liveCw", "clockwise") : s < 0 ? tx(t, "mAng_liveAcw", "anticlockwise") : tx(t, "mAng_liveNone", "no turn")}}`;
  return { tex: r`${num(v.to)}^\circ - ${num(v.from)}^\circ = ${num(d)}^\circ \;\to\; ${num(w)}^\circ \;\to\; \green{${num(s)}^\circ}\ (${way})` };
}

function clockNumbers(v: Record<string, number>) {
  const hand = 30 * v.h + 0.5 * v.m, minute = 6 * v.m, a = Math.abs(hand - minute), small = a > 180 ? 360 - a : a;
  return { tex: r`|\,(30 \cdot ${v.h} + 0.5 \cdot ${v.m}) - 6 \cdot ${v.m}\,| = |\,${num(hand)} - ${num(minute)}\,| = ${num(a)}^\circ` + (a > 180 ? r` \;\to\; 360^\circ - ${num(a)}^\circ = \green{${num(small)}^\circ}` : r` = \green{${num(small)}^\circ}`) };
}

export function AnglesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAng_intro",
          "Geometry is the mathematics of shape, size and position. It began as land measurement (the name means \"earth measuring\"), and it is still what a carpenter, a surveyor or a sailor uses every day: a floor plan is rectangles, a roof is triangles, a route on a map is segments and turns. This section builds that geometry from the ground up, and this first chapter sets out the smallest pieces: points, lines and the angles between them. Angles are how we describe direction and turning, which is what a compass, a steering wheel or the hands of a clock do all day.")}
      </Lead>

      <Goals t={t} id="mAng" items={[
        "Name points, lines, rays, segments and the kinds of angle.",
        "Use pairs of angles that add up to 90° or 180°, and opposite angles.",
        "Find all the angles where a line crosses two parallel lines.",
        "Work out unknown angles in a figure, one step at a time.",
      ]} />

      <H2>{tx(t, "mAng_objTitle", "Points, lines, rays and segments")}</H2>
      <p>
        {tx(t, "mAng_objBody",
          "Geometry starts from a few objects that are described rather than defined. A point is an exact position with no size at all; we name points with capital letters, like A or P. A line is perfectly straight, has no thickness and goes on forever in both directions; any two different points lie on exactly one line. The parts of a line we actually draw have names too. A segment is the piece between two endpoints, and it has a length. A ray starts at one point and goes on forever in one direction, like a laser beam. A plane is a perfectly flat surface that goes on forever, like an endless sheet of paper. Everything in this section happens in a plane, which is the 2D world of the functions chapter's graphs.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAng_tObj", "Object"), tx(t, "mAng_tNotation", "Notation"), tx(t, "mAng_tMeaning", "What it is"), tx(t, "mAng_tEveryday", "Everyday picture")]}
        rows={[
          [tx(t, "mAng_o1", "point"), "A", tx(t, "mAng_o1m", "a position, no size"), tx(t, "mAng_o1e", "a town on a map, the tip of a pencil")],
          [tx(t, "mAng_o2", "line"), "AB ↔", tx(t, "mAng_o2m", "straight, endless both ways, through A and B"), tx(t, "mAng_o2e", "the equator, a road drawn straight off both edges of the map")],
          [tx(t, "mAng_o3", "ray"), "AB →", tx(t, "mAng_o3m", "starts at A, passes through B, endless one way"), tx(t, "mAng_o3e", "a beam from a lighthouse, a line of sight")],
          [tx(t, "mAng_o4", "segment"), "AB", tx(t, "mAng_o4m", "the part between A and B, with a length"), tx(t, "mAng_o4e", "the edge of a table, a straight fence")],
          [tx(t, "mAng_o5", "plane"), "—", tx(t, "mAng_o5m", "a flat surface, endless in every direction"), tx(t, "mAng_o5e", "a calm lake, a sheet of paper that never ends")],
        ]}
      />
      <p>
        {tx(t, "mAng_collinear",
          "Points that lie on one line are collinear. Two lines in a plane either cross at exactly one point, or never meet (they are parallel), or are the same line; the systems of equations chapter found those same three cases with algebra. A line splits the plane into two sides, the half-planes, the way a river splits a map into a north bank and a south bank; every point not on the line is on exactly one side.")}
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
        ]}
        words={tx(t, "mAng_turnWords", "A full turn is 360 degrees, so any fraction of a turn is that fraction of 360: half a turn is 180°, a quarter 90°, an eighth 45°.")}>
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
          [tx(t, "mAng_k1", "acute"), "0° < θ < 90°", tx(t, "mAng_k1e", "the tip of a pizza slice, clock hands at 1 o'clock (30°)")],
          [tx(t, "mAng_k2", "right"), "θ = 90°", tx(t, "mAng_k2e", "the corner of a page, a wall meeting the floor")],
          [tx(t, "mAng_k3", "obtuse"), "90° < θ < 180°", tx(t, "mAng_k3e", "a reclined chair, clock hands at 5 o'clock (150°)")],
          [tx(t, "mAng_k4", "straight"), "θ = 180°", tx(t, "mAng_k4e", "turning to face backwards")],
          [tx(t, "mAng_k5", "reflex"), "180° < θ < 360°", tx(t, "mAng_k5e", "the outside of a room's corner, a pie with one slice taken")],
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
        ]}
        words={tx(t, "mAng_pairsWords", "Two angles that fill a right angle add to 90°, two that fill a straight line add to 180°, and all the angles around one point add to 360°.")}>
        {r`\alpha + \beta = 90^{\circ} \qquad \alpha + \beta = 180^{\circ} \qquad \alpha_1 + \alpha_2 + \dots + \alpha_n = 360^{\circ}`}
      </Equation>
      <H3>{tx(t, "mAng_vertTitle", "Vertical angles are equal")}</H3>
      <p>
        {tx(t, "mAng_vertBody",
          "When two lines cross they make four angles. The two that face each other across the crossing are called vertical angles (vertical here means \"sharing a vertex\", not \"up and down\"), and they are always equal. The reason is a two-line proof, and it is worth reading because it is the pattern of most geometry proofs: call the angles around the crossing α, β, γ going round. α and β sit on a straight line, so α + β = 180°. β and γ sit on the other line, so β + γ = 180°. Both sums equal 180°, so α + β = β + γ, and subtracting β from both sides leaves α = γ.")}
      </p>
      <Derivation t={t} label={tx(t, "mAng_eqVert", "Why vertical angles are equal")}
        steps={[
          { full: true, tex: r`\alpha + \beta = 180^{\circ}`, why: tx(t, "mAng_v1", "α and β are adjacent on one line: they are supplementary") },
          { full: true, tex: r`\beta + \gamma = 180^{\circ}`, why: tx(t, "mAng_v2", "β and γ are adjacent on the other line: also supplementary") },
          { full: true, tex: r`\alpha + \beta = \beta + \gamma`, why: tx(t, "mAng_v3", "equal things equal to the same thing: α + β = β + γ") },
          { full: true, tex: r`\green{\alpha = \gamma}`, why: tx(t, "mAng_v4", "subtract β from both sides (the balance rule from linear equations): α = γ") },
        ]} />

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

      <H2>{tx(t, "mAng_bearTitle", "Compass bearings by hand")}</H2>
      <p>
        {tx(t, "mAng_bearBody",
          "Sailors and hikers give a direction as a bearing: the angle measured clockwise from north, from 0° up to (but not including) 360°. North is 0°, east 90°, south 180°, west 270°. Two questions come up on every trip, and both are angle arithmetic you can do in your head.")}
      </p>
      <H3>{tx(t, "mAng_wrapTitle", "Bringing an angle back into 0° – 360°")}</H3>
      <p>
        {tx(t, "mAng_wrapBody",
          "Turning adds and subtracts degrees, and the result can leave the range: a walker facing 300° who turns 100° clockwise faces 300° + 100° = 400°. But a full turn changes nothing, so 400° faces the same way as 400° − 360° = 40°. The rule: add or subtract 360° until the angle lands in 0° ≤ θ < 360°. This is the clock arithmetic of the divisibility chapter with 360 in place of 12.")}
      </p>
      <Equation where={[
        [r`\theta`, tx(t, "mAng_wWrapTheta", "the angle you got from adding or subtracting turns, in degrees")],
        [r`k`, tx(t, "mAng_wWrapK", "a whole number of full turns, chosen so the result lands in the range; it can be negative")],
        [r`360^\circ`, tx(t, "mAng_wWrap360", "one full turn, which leaves the direction unchanged")],
      ]}
        words={tx(t, "mAng_wrapWords", "Take away (or add back) whole turns of 360° until the angle is at least 0° and less than 360°; the direction it points does not change.")}>{r`\theta_{\text{wrapped}} = \theta - 360^\circ\cdot k, \qquad 0^\circ \le \theta_{\text{wrapped}} < 360^\circ`}</Equation>
      <LessonTable
        headers={[tx(t, "mAng_tStart", "Angle"), tx(t, "mAng_tStep", "Step"), tx(t, "mAng_tResult", "Bearing")]}
        rows={[
          ["400°", "400° − 360°", "40°"],
          ["−90°", "−90° + 360°", "270°"],
          ["1000°", tx(t, "mAng_wrap3", "1000 = 2 × 360 + 280, so subtract 2 turns"), "280°"],
          ["−450°", "−450° + 2 × 360°", "270°"],
        ]}
      />
      <H3>{tx(t, "mAng_shortTitle", "The shortest turn between two bearings")}</H3>
      <p>
        {tx(t, "mAng_shortBody",
          "A ship on bearing 350° must change to 10°. Subtracting gives 10° − 350° = −340°, which would mean turning anticlockwise almost all the way round. The short way is 20° clockwise. The recipe: take the difference (new − old), bring it into 0° – 360°, and if it is more than 180°, subtract 360° to go the other way. A positive answer means turn clockwise, a negative one anticlockwise, and the answer is never more than 180° either way.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAng_tFromTo", "From → to"), tx(t, "mAng_tDiff", "new − old"), tx(t, "mAng_tWrapped", "into 0°–360°"), tx(t, "mAng_tTurn", "Shortest turn")]}
        rows={[
          ["350° → 10°", "−340°", "20°", tx(t, "mAng_turn1", "20° clockwise")],
          ["10° → 350°", "340°", "340°", tx(t, "mAng_turn2", "340° − 360° = −20°: 20° anticlockwise")],
          ["90° → 300°", "210°", "210°", tx(t, "mAng_turn3", "210° − 360° = −150°: 150° anticlockwise")],
          ["45° → 180°", "135°", "135°", tx(t, "mAng_turn4", "135° clockwise")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mAng_bearTip", "Exactly 180° is the one tie: both ways are the same length, so either direction is correct.")}
      </Callout>
      <LiveFormula label={tx(t, "mAng_liveTurn", "Try it: the shortest turn")}
        tex={r`\Delta = \theta_2 - \theta_1 \;\to\; [0^\circ, 360^\circ) \;\to\; \Delta > 180^\circ \Rightarrow \Delta - 360^\circ`}
        vars={[
          { id: "from", label: tx(t, "mAng_liveFrom", "old bearing θ₁"), min: 0, max: 355, step: 5, value: 350, fmt: deg },
          { id: "to", label: tx(t, "mAng_liveTo", "new bearing θ₂"), min: 0, max: 355, step: 5, value: 10, fmt: deg },
        ]}
        compute={v => turnNumbers(v, t)}
        note={tx(t, "mAng_liveTurnNote", "Swap the two bearings and the answer only changes sign: the same turn, the other way. The answer never goes past 180° either way.")} />

      <H3>{tx(t, "mAng_clockTitle", "The angle between the hands of a clock")}</H3>
      <p>
        {tx(t, "mAng_clockBody",
          "A classic puzzle that uses only degrees per unit of time. The minute hand goes round 360° in 60 minutes, so it moves 360 ÷ 60 = 6° per minute. The hour hand goes round in 12 hours: 360 ÷ 12 = 30° per hour, and since an hour is 60 minutes it also creeps 30 ÷ 60 = 0.5° per minute. Measure both from 12 o'clock and subtract.")}
      </p>
      <Equation where={[
        [r`h`, tx(t, "mAng_wH", "the hour on a 12-hour dial (0 to 11; 12 o'clock counts as 0)")],
        [r`m`, tx(t, "mAng_wM", "the minutes past the hour (0 to 59)")],
        [r`30h + 0.5m`, tx(t, "mAng_wHour", "where the hour hand points: 30° for every whole hour plus 0.5° for every minute")],
        [r`6m`, tx(t, "mAng_wMin", "where the minute hand points: 6° for every minute")],
      ]}
        words={tx(t, "mAng_clockWords", "Find where each hand points, measured from 12 o'clock, and take the difference; if it is over 180°, the smaller angle is 360° minus it.")}>{r`\text{angle} = \left|\,(30h + 0.5m) - 6m\,\right| = \left|\,30h - 5.5m\,\right|`}</Equation>
      <LiveFormula label={tx(t, "mAng_liveClock", "Try it: the hands of a clock")}
        tex={r`\text{angle} = \left|\,(30h + 0.5m) - 6m\,\right|`}
        vars={[
          { id: "h", label: tx(t, "mAng_liveH", "hour h"), min: 0, max: 11, step: 1, value: 3, fmt: num },
          { id: "m", label: tx(t, "mAng_liveM", "minutes m"), min: 0, max: 59, step: 1, value: 40, fmt: num },
        ]}
        compute={clockNumbers}
        note={tx(t, "mAng_liveClockNote", "Try 12:00 (h = 0, m = 0): both hands on 12, 0°. Then 6:00: 180°, the hands in one straight line. At 3:15 the answer is not 0°: the hour hand has already crept 7.5° past the 3.")} />
      <p>
        {tx(t, "mAng_clockEx",
          "At 3:40: h = 3, m = 40. The hour hand is at 30 × 3 + 0.5 × 40 = 90 + 20 = 110°; the minute hand at 6 × 40 = 240°. The difference is |110 − 240| = 130°. If a result is more than 180°, the smaller angle between the hands is 360° minus it: at 9:00 the formula gives |270 − 0| = 270°, and the hands actually make 360° − 270° = 90°.")}
      </p>

      <H2>{tx(t, "mAng_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mAng_tWrong", "Wrong"), tx(t, "mAng_tRight", "Right"), tx(t, "mAng_tWhy", "Why")]}
        rows={[
          [tx(t, "mAng_m1w", "longer arms make a bigger angle"), tx(t, "mAng_m1r", "only the turn between the arms counts"), tx(t, "mAng_m1", "an angle measures rotation, not length")],
          [tx(t, "mAng_m2w", "∠ABC with the vertex at A"), tx(t, "mAng_m2r", "the middle letter is the vertex"), tx(t, "mAng_m2", "∠ABC is the angle at B")],
          [tx(t, "mAng_m3w", "mixing up complement and supplement"), tx(t, "mAng_m3r", "complement → 90°, supplement → 180°"), tx(t, "mAng_m3", "memory aid: C comes before S, and 90 before 180")],
          [tx(t, "mAng_m4w", "using the parallel rules on lines that are not parallel"), tx(t, "mAng_m4r", "check the lines are parallel first"), tx(t, "mAng_m4", "only vertical angles are equal for any lines")],
          [tx(t, "mAng_m5w", "new bearing − old bearing as the turn"), tx(t, "mAng_m5r", "wrap the difference into (−180°, 180°]"), tx(t, "mAng_m5", "angles repeat every 360°")],
        ]}
      />

      <KeyIdeas t={t} id="mAng" items={[
        "A point has no size; a line is endless both ways, a ray one way, a segment has two ends and a length.",
        "An angle measures turning around its vertex; a full turn is 360°, a straight angle 180°, a right angle 90°.",
        "Acute < 90° < obtuse < 180° < reflex < 360°.",
        "Complementary angles add to 90°, supplementary to 180°, angles around a point to 360°.",
        "Vertical angles are always equal.",
        "With parallel lines, corresponding and alternate angles are equal and co-interior angles add to 180°.",
        "Bring bearings back into 0° – 360° by adding or subtracting full turns; the shortest turn is never more than 180°.",
      ]} />
    </Article>
  );
}
