"use client";

// Geometry 9: transformations — translations, reflections and their effect on
// winding, quarter-turn rotations and rotating about a pivot, rigid motions
// and congruence, scaling (uniform and not) and shear with their effect on
// area, composition and why order matters, symmetry, and following a shape
// through several moves by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TransformFigure } from "@/components/lesson/figures/math/TransformFigure";

const r = String.raw;

// ── Live formula: quarter turns of one point ──────────────────────────────────

const num = (v: number) => String(v).replace("-", "−");

function quarterNumbers(v: Record<string, number>) {
  let x = v.x, y = v.y;
  const chain = [r`(${num(x)},\ ${num(y)})`];
  for (let i = 0; i < v.q; i++) { [x, y] = [-y, x]; chain.push(r`(${num(x)},\ ${num(y)})`); }
  chain[chain.length - 1] = r`\green{${chain[chain.length - 1]}}`;
  return { tex: chain.join(r` \xrightarrow{90^\circ} `) };
}

export function TransformationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTf_intro",
          "Sliding a sofa across a floor plan, seeing your face in a mirror, turning a key and enlarging a photo are all transformations: rules that take every point of a shape to a new point. Tiled floors, wallpaper and kaleidoscopes are built by repeating one shape with them. This chapter writes each basic move as a rule on coordinates, shows what it keeps and what it changes, and explains why doing two of them in a different order gives a different result. The Linear Algebra section will later pack all of these into matrices.")}
      </Lead>

      <Goals t={t} id="mTf" items={[
        "Slide, flip and turn shapes with rules on their coordinates.",
        "Scale and shear a shape, and say which moves keep its size and form.",
        "Apply several moves in a row, in the right order.",
        "Find a shape's symmetries.",
      ]} />

      <H2>{tx(t, "mTf_whatTitle", "A transformation is a rule on points")}</H2>
      <p>
        {tx(t, "mTf_whatBody",
          "A transformation takes any point (x, y) and gives back a point (x', y'), its image. To transform a shape, transform each of its corners and join them up again, which works because every move in this chapter keeps straight lines straight. The figure uses a letter F on purpose: it has no symmetry, so every flip and every turn shows. The first corner is marked with a dot in both the original (blue) and the image (amber), and under the drawing the figure reports the area and the winding order, the direction you go round when you list the corners in order.")}
      </p>

      <TransformFigure t={t} />

      <H2>{tx(t, "mTf_transTitle", "Translation: slide")}</H2>
      <p>
        {tx(t, "mTf_transBody",
          "A translation moves every point by the same step: a to the side and b up. Each coordinate simply has a number added. Nothing else changes: not lengths, not angles, not area, not the direction the shape faces.")}
      </p>
      <Equation label={tx(t, "mTf_eqTrans", "Translation by (a, b)")}
        where={[
          [r`a`, tx(t, "mTf_wA", "the horizontal step; negative moves left")],
          [r`b`, tx(t, "mTf_wB", "the vertical step; negative moves down")],
        ]}
        words={tx(t, "mTf_transWords", "Add a to every x and b to every y: the whole shape slides, unchanged.")}
        note={tx(t, "mTf_transNote", "Example: moving (2, 5) by (−3, 1) gives (−1, 6). Someone walking due east at 1.5 m/s for 4 s is translated by (1.5 · 4, 0) = (6, 0) metres.")}>
        {r`(x, y) \mapsto (x + a,\ y + b)`}
      </Equation>

      <H2>{tx(t, "mTf_reflTitle", "Reflection: flip")}</H2>
      <p>
        {tx(t, "mTf_reflBody",
          "A reflection flips the plane over a mirror line. Each point moves straight across the line (along the perpendicular) and lands the same distance on the other side; points on the line stay put. Across the x-axis only y changes sign; across the y-axis only x does; across the diagonal y = x the two coordinates swap. Across a vertical line x = c, the distance to the line, x − c, is reversed, so the new x is c − (x − c) = 2c − x.")}
      </p>
      <Equation label={tx(t, "mTf_eqRefl", "Reflections")}
        where={[
          [r`(x, -y)`, tx(t, "mTf_wRx", "across the x-axis")],
          [r`(-x, y)`, tx(t, "mTf_wRy", "across the y-axis")],
          [r`(y, x)`, tx(t, "mTf_wRd", "across the line y = x")],
          [r`(2c - x, y)`, tx(t, "mTf_wRc", "across the vertical line x = c")],
        ]}>
        {r`(x, y) \mapsto (x, -y) \qquad (-x, y) \qquad (y, x) \qquad (2c - x,\ y)`}
      </Equation>
      <H3>{tx(t, "mTf_windTitle", "Reflections reverse the winding")}</H3>
      <p>
        {tx(t, "mTf_windBody",
          "A reflection keeps lengths and angles but turns the shape into its mirror image. You can see it in the numbers: list the corners anticlockwise before the flip and they come out clockwise after it, so the shoelace formula from the area chapter gives the same area with the opposite sign. That sign is why no amount of sliding and turning in the plane can undo a reflection: slides and turns never change the winding. It is the same reason a left glove cannot be turned into a right glove by moving it around on a table.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTf_flipTip", "To reflect across a vertical line x = c that is not the y-axis, use x' = 2c − x (y stays). The reason: the mirror line is halfway between a point and its image, so c = (x + x') / 2, and solving for x' gives 2c − x. Reflecting twice across the same line returns every point home.")}
      </Callout>
      <Derivation t={t} label={tx(t, "mTf_derMirror", "Why the image is at 2c − x")}
        steps={[
          { full: true, tex: r`c = \frac{x + x'}{2}`, why: tx(t, "mTf_dm1", "the mirror line is exactly halfway between the point and its image") },
          { full: true, tex: r`2c = x + x'`, why: tx(t, "mTf_dm2", "multiply both sides by 2") },
          { full: true, tex: r`\green{x' = 2c - x}`, why: tx(t, "mTf_dm3", "subtract x from both sides") },
        ]} />

      <H2>{tx(t, "mTf_rotTitle", "Rotation: turn")}</H2>
      <p>
        {tx(t, "mTf_rotBody",
          "A rotation turns every point about a fixed centre, the pivot, by the same angle; by convention a positive angle turns anticlockwise. Quarter turns about the origin need no trigonometry. The analytic geometry chapter showed that turning a step (run, rise) by 90° gives (−rise, run): the same trick turns a whole point. Doing it twice gives the half turn, and three times the three-quarter turn. Rotations by other angles need sine and cosine and wait for the Trigonometry section.")}
      </p>
      <Equation label={tx(t, "mTf_eqRot", "Quarter turns about the origin")}
        where={[
          [r`90^\circ`, tx(t, "mTf_w90", "a quarter turn anticlockwise: swap the coordinates and negate the new x")],
          [r`180^\circ`, tx(t, "mTf_w180", "a half turn: negate both, the same as reflecting in both axes")],
          [r`270^\circ`, tx(t, "mTf_w270", "a quarter turn clockwise")],
        ]}
        words={tx(t, "mTf_rotWords", "For a quarter turn anticlockwise, swap the two coordinates and change the sign of the new x. Do it twice for a half turn, three times for three quarters.")}
        note={tx(t, "mTf_rotNote", "Example: (3, 1) turned 90° becomes (−1, 3); turned again, (−3, −1); again, (1, −3); a fourth time, back to (3, 1).")}>
        {r`90^\circ: (x, y) \mapsto (-y,\ x) \qquad 180^\circ: (x, y) \mapsto (-x,\ -y) \qquad 270^\circ: (x, y) \mapsto (y,\ -x)`}
      </Equation>
      <LiveFormula label={tx(t, "mTf_liveRot", "Try it: quarter turns")}
        tex={r`(x, y) \xrightarrow{90^\circ} (-y,\ x)`}
        vars={[
          { id: "x", label: "x", min: -5, max: 5, step: 1, value: 3, fmt: num },
          { id: "y", label: "y", min: -5, max: 5, step: 1, value: 1, fmt: num },
          { id: "q", label: tx(t, "mTf_liveQ", "quarter turns"), min: 0, max: 4, step: 1, value: 1, fmt: v => `${v} · 90°` },
        ]}
        compute={quarterNumbers}
        note={tx(t, "mTf_liveRotNote", "Four quarter turns always bring the point home. Two quarter turns give (−x, −y) whatever the point: the half turn.")} />
      <H3>{tx(t, "mTf_pivotTitle", "Turning about another point")}</H3>
      <p>
        {tx(t, "mTf_pivotBody",
          "The rules above turn about the origin. To turn about a pivot P = (pₓ, p_y), use three steps: translate so that P lands on the origin (subtract P), turn, then translate back (add P). This \"move there, do it, move back\" pattern appears everywhere in graphics: it is how a door swings on its hinge instead of around the centre of the world, and how the dilation about a centre in the similarity chapter was built.")}
      </p>
      <Derivation t={t} label={tx(t, "mTf_eqPivot", "90° about the pivot P")}
        steps={[
          { full: true, tex: r`(x,\ y)` },
          { full: true, tex: r`\to (x - p_x,\ y - p_y)`, why: tx(t, "mTf_pv1", "subtract P: the offset from the pivot") },
          { full: true, tex: r`\to \big({-(y - p_y)},\ x - p_x\big)`, why: tx(t, "mTf_pv2", "turn the offset a quarter turn") },
          { full: true, tex: r`\to \green{\big(p_x - (y - p_y),\ p_y + (x - p_x)\big)}`, why: tx(t, "mTf_pv3", "add P back") },
        ]} />

      <H2>{tx(t, "mTf_rigidTitle", "Rigid motions and congruence")}</H2>
      <p>
        {tx(t, "mTf_rigidBody",
          "Translations, rotations and reflections, and any sequence of them, are the rigid motions (also called isometries): they never change a distance, so they never change a shape or a size. This gives the triangles chapter's congruence its precise meaning: two figures are congruent exactly when a rigid motion carries one onto the other. Rotations and translations also keep the winding (they are \"proper\"); reflections reverse it. In a game, rigid motions are what a physics engine applies to a solid body: it can slide and spin, but not squash.")}
      </p>

      <H2>{tx(t, "mTf_scaleTitle", "Scaling and shear: changing the shape")}</H2>
      <p>
        {tx(t, "mTf_scaleBody",
          "Scaling multiplies each coordinate by a factor. With the same factor k on both, it is the dilation about the origin from the similarity chapter: the image is similar, areas grow by k². With different factors sₓ and s_y the shape is stretched: angles change, a square becomes a rectangle and a circle an ellipse, and the area is multiplied by sₓ · s_y (every unit square becomes an sₓ × s_y rectangle). A shear slides each row sideways by an amount proportional to its height. Rows keep their length and height, so by Cavalieri's principle the area is unchanged, while angles change.")}
      </p>
      <Equation label={tx(t, "mTf_eqScale", "Scale and shear")}
        where={[
          [r`s_x,\ s_y`, tx(t, "mTf_wS", "the scale factors along x and y; a negative factor also mirrors")],
          [r`k`, tx(t, "mTf_wK", "the shear factor: how far a row moves per unit of height")],
          [r`s_x s_y`, tx(t, "mTf_wArea", "how much a scale multiplies areas; negative means the winding flipped")],
        ]}
        words={tx(t, "mTf_scaleWords", "Scaling multiplies x by one factor and y by another; a shear adds k times the height to x and leaves y alone.")}
        note={tx(t, "mTf_scaleNote", "Example: scaling by (2, 0.5) turns a 4 × 4 square (area 16) into an 8 × 2 rectangle (area 16, since 2 · 0.5 = 1). Scaling by (−1, 1) is the reflection across the y-axis.")}>
        {r`\text{scale: } (x, y) \mapsto (s_x\,x,\ s_y\,y) \qquad \text{shear: } (x, y) \mapsto (x + k\,y,\ y)`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mTf_tMove", "Transformation"), tx(t, "mTf_tLen", "Lengths"), tx(t, "mTf_tAng", "Angles"), tx(t, "mTf_tArea", "Area"), tx(t, "mTf_tWind", "Winding")]}
        rows={[
          [tx(t, "mTf_k1", "translation"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept")],
          [tx(t, "mTf_k2", "rotation"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept")],
          [tx(t, "mTf_k3", "reflection"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_flipped", "reversed")],
          [tx(t, "mTf_k4", "uniform scale k"), "× k", tx(t, "mTf_kept", "kept"), "× k²", tx(t, "mTf_k4w", "kept if k > 0")],
          [tx(t, "mTf_k5", "stretch sₓ ≠ s_y"), tx(t, "mTf_changed", "changed"), tx(t, "mTf_changed", "changed"), "× sₓ s_y", tx(t, "mTf_k5w", "reversed if sₓ s_y < 0")],
          [tx(t, "mTf_k6", "shear"), tx(t, "mTf_changed", "changed"), tx(t, "mTf_changed", "changed"), tx(t, "mTf_kept", "kept"), tx(t, "mTf_kept", "kept")],
        ]}
      />

      <H2>{tx(t, "mTf_compTitle", "Composition: order matters")}</H2>
      <p>
        {tx(t, "mTf_compBody",
          "Applying one transformation and then another is a composition. Translations can be done in any order (moving 2 right then 1 up is the same as 1 up then 2 right), but mixing kinds usually cannot. In the order mode of the figure, turning the F a quarter turn about the origin and then moving it 3 to the left puts it somewhere else than moving it first and turning after: the turn is about the origin, and moving first changed where the F sits relative to the origin, so the turn swings it to a different place. Directions in everyday life work the same way: \"turn left, then walk 10 m\" and \"walk 10 m, then turn left\" leave you in different places. So a description of several moves is incomplete without their order. A safe habit: scale and turn a shape while it sits at the origin, and move it to its final place last.")}
      </p>
      <Derivation t={t} label={tx(t, "mTf_eqComp", "Two orders, two results")}
        steps={[
          { full: true, tex: r`(x, y) \to (-y,\ x) \to \amber{(-y - 3,\ x)}`, why: tx(t, "mTf_c1", "turn 90° first, then move (−3, 0)") },
          { full: true, tex: r`(x, y) \to (x - 3,\ y) \to \blue{(-y,\ x - 3)}`, why: tx(t, "mTf_c2", "move (−3, 0) first, then turn 90°") },
          { full: true, tex: r`(1, 0):\quad \amber{(-3,\ 1)} \;\ne\; \blue{(0,\ -2)}`, why: tx(t, "mTf_c3", "try one point: the two orders send (1, 0) to different places") },
        ]} />
      <H3>{tx(t, "mTf_twoReflTitle", "Two reflections make a slide or a turn")}</H3>
      <p>
        {tx(t, "mTf_twoReflBody",
          "Reflect across the y-axis, then across the x-axis: (x, y) → (−x, y) → (−x, −y), which is the half turn. Two flips undo each other's mirroring, so the result is always a proper motion: reflecting in two parallel lines gives a translation by twice the distance between them, and reflecting in two lines that cross gives a rotation about the crossing point by twice the angle between them.")}
      </p>

      <H2>{tx(t, "mTf_symTitle", "Symmetry")}</H2>
      <p>
        {tx(t, "mTf_symBody",
          "A shape is symmetric under a transformation when the transformation maps it onto itself. A shape with a mirror line (line symmetry) looks the same reflected across it: a heart has one, a square has four. A shape with rotational symmetry of order n looks the same after a turn of 360°/n: a square has order 4, a regular hexagon order 6, the letter S order 2. Artists and engines exploit symmetry to save work: model half a character and mirror it, store one quarter of a symmetric texture, or generate a tiled floor by repeating one tile with translations.")}
      </p>

      <H2>{tx(t, "mTf_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mTf_ex1",
          "1. Rotate the point (5, 2) by 90° about the pivot (3, 1). Offset: (2, 1). Turned: (−1, 2). Back: (3 − 1, 1 + 2) = (2, 3). Check the distance to the pivot: √(4 + 1) before and √(1 + 4) after, the same.")}
      </p>
      <p>
        {tx(t, "mTf_ex2",
          "2. A sign 32 cm wide has its left edge at x = 100 cm, so its centre line is x = 116. Reflecting it across that line sends its left edge to 2 · 116 − 100 = 132 and its right edge, 132, to 100: the sign stays in the same place but its lettering now reads backwards.")}
      </p>
      <p>
        {tx(t, "mTf_ex3",
          "3. A tile is scaled by (3, 2) and then moved by (10, 0). Its corner (1, 1) goes to (3, 2) and then to (13, 2). In the other order, (1, 1) → (11, 1) → (33, 2): the translation was scaled too.")}
      </p>

      <H2>{tx(t, "mTf_trackTitle", "Following a shape through several moves")}</H2>
      <p>
        {tx(t, "mTf_trackBody",
          "A shape is transformed by transforming its corners and joining them up again in the same order. Take the triangle A = (1, 0), B = (3, 0), C = (1, 2) and apply three moves in this order: reflect across the y-axis, (x, y) → (−x, y); turn a quarter turn anticlockwise about the origin, (x, y) → (−y, x); move by (4, 1). One row per corner, one column per move:")}
      </p>
      <LessonTable
        headers={[tx(t, "mTf_tCorner", "Corner"), tx(t, "mTf_tReflect", "reflect in y-axis"), tx(t, "mTf_tTurn", "quarter turn"), tx(t, "mTf_tMoveBy", "move (4, 1)")]}
        rows={[
          ["A (1, 0)", "(−1, 0)", "(0, −1)", "A' (4, 0)"],
          ["B (3, 0)", "(−3, 0)", "(0, −3)", "B' (4, −2)"],
          ["C (1, 2)", "(−1, 2)", "(−2, −1)", "C' (2, 0)"],
        ]}
      />
      <p>
        {tx(t, "mTf_trackCheck",
          "Two checks catch almost every slip. Lengths: all three moves are rigid, so the sides must keep their lengths. AB = 2 and A'B' = |0 − (−2)| = 2; AC = 2 and A'C' = |4 − 2| = 2; BC = √(2² + 2²) = √8 and B'C' = √(2² + 2²) = √8 ✓. Winding: the moves include exactly one reflection, so the shoelace sign must flip. For ABC: 1·0 − 3·0 = 0, 3·2 − 1·0 = 6, 1·0 − 1·2 = −2, sum 4, so +2 (anticlockwise). For A'B'C': 4·(−2) − 4·0 = −8, 4·0 − 2·(−2) = 4, 2·0 − 4·0 = 0, sum −4, so −2 (clockwise) ✓. Same area 2, opposite sign.")}
      </p>

      <H2>{tx(t, "mTf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTf_tWrong", "Wrong"), tx(t, "mTf_tRight", "Right"), tx(t, "mTf_tWhy", "Why")]}
        rows={[
          [tx(t, "mTf_m1w", "90° turn: (x, y) → (y, −x)"), "(−y, x)", tx(t, "mTf_m1", "(y, −x) is the clockwise turn, −90°")],
          [tx(t, "mTf_m2w", "rotating about a pivot with the origin rule"), tx(t, "mTf_m2r", "subtract the pivot, turn, add it back"), tx(t, "mTf_m2", "otherwise the shape swings around the origin")],
          [tx(t, "mTf_m3w", "translate, then scale about the origin"), tx(t, "mTf_m3r", "scale (and turn) at the origin, move last"), tx(t, "mTf_m3", "scaling after moving also scales the move")],
          [tx(t, "mTf_m4w", "undoing a reflection with a rotation"), tx(t, "mTf_m4r", "only another reflection undoes it"), tx(t, "mTf_m4", "a reflection flips the winding; rotations never do")],
          [tx(t, "mTf_m5w", "stretching keeps the shape similar"), tx(t, "mTf_m5r", "only equal factors do"), tx(t, "mTf_m5", "sₓ ≠ s_y changes angles")],
        ]}
      />

      <KeyIdeas t={t} id="mTf" items={[
        "A transformation maps every point to an image; transform a shape by its corners.",
        "Translation (x + a, y + b); reflections negate or swap coordinates.",
        "Quarter turn about the origin: (x, y) → (−y, x); about a pivot, move there and back.",
        "Rigid motions keep lengths and angles; congruent means related by one.",
        "Reflections (and negative scales) reverse the winding order.",
        "Scale multiplies area by sₓ s_y; shear keeps area.",
        "Order matters: scaling or turning after a move also changes where the shape ends up.",
      ]} />
    </Article>
  );
}
