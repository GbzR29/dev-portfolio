"use client";

// Geometry 9: transformations — translations, reflections and their effect on
// winding, quarter-turn rotations and rotating about a pivot, rigid motions
// and congruence, scaling (uniform and not) and shear with their effect on
// area, composition and why order matters, symmetry, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { TransformFigure } from "@/components/lesson/figures/math/TransformFigure";

const r = String.raw;

export function TransformationsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTf_intro",
          "Every object in a game has a transform: where it is, which way it faces, how big it is. Moving a character, mirroring a sprite to face left, spinning a coin and growing a power-up are all transformations, rules that take every point of a shape to a new point. This chapter writes each basic move as a rule on coordinates, shows what it keeps and what it changes, and explains why doing two of them in a different order gives a different result. The Linear Algebra section will later pack all of these into matrices.")}
      </Lead>

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
        note={tx(t, "mTf_transNote", "Example: moving (2, 5) by (−3, 1) gives (−1, 6). A character walking at velocity v for a frame of dt seconds is translated by v · dt.")}>
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
          "A reflection keeps lengths and angles but turns the shape into its mirror image. You can see it in the numbers: list the corners anticlockwise before the flip and they come out clockwise after it, so the shoelace formula from the area chapter gives the same area with the opposite sign. This matters a lot in 3D. GPUs decide which side of a triangle faces the camera from its winding, and discard the back faces. Mirror a model with a negative scale and every triangle's winding flips, the model turns inside out, and engines must swap their culling mode to compensate.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTf_flipTip", "Flipping a 2D sprite to face left is a reflection across its own vertical centre line: x' = 2c − x with c the sprite's centre, or simply a horizontal scale of −1 about the centre. Flipping it back is the same reflection again, since reflecting twice across the same line returns every point home.")}
      </Callout>

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
        note={tx(t, "mTf_rotNote", "Example: (3, 1) turned 90° becomes (−1, 3); turned again, (−3, −1); again, (1, −3); a fourth time, back to (3, 1).")}>
        {r`90^\circ: (x, y) \mapsto (-y,\ x) \qquad 180^\circ: (x, y) \mapsto (-x,\ -y) \qquad 270^\circ: (x, y) \mapsto (y,\ -x)`}
      </Equation>
      <H3>{tx(t, "mTf_pivotTitle", "Turning about another point")}</H3>
      <p>
        {tx(t, "mTf_pivotBody",
          "The rules above turn about the origin. To turn about a pivot P = (pₓ, p_y), use three steps: translate so that P lands on the origin (subtract P), turn, then translate back (add P). This \"move there, do it, move back\" pattern appears everywhere in graphics: it is how a door swings on its hinge instead of around the centre of the world, and how the dilation about a centre in the similarity chapter was built.")}
      </p>
      <Equation label={tx(t, "mTf_eqPivot", "90° about the pivot P")}
        notes={[
          tx(t, "mTf_pv1", "subtract P: the offset from the pivot"),
          tx(t, "mTf_pv2", "turn the offset a quarter turn"),
          tx(t, "mTf_pv3", "add P back"),
        ]}>
        {r`(x, y) \to (x - p_x,\ y - p_y) \to \big({-(y - p_y)},\ x - p_x\big) \to \big(p_x - (y - p_y),\ p_y + (x - p_x)\big)`}
      </Equation>

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
          "Applying one transformation and then another is a composition. Translations can be done in any order (moving 2 right then 1 up is the same as 1 up then 2 right), but mixing kinds usually cannot. In the order mode of the figure, turning the F a quarter turn about the origin and then moving it 3 to the left puts it somewhere else than moving it first and turning after: the turn is about the origin, and moving first changed where the F sits relative to the origin, so the turn swings it to a different place. Game engines therefore fix a standard order for an object's transform: scale first, then rotate, then translate. That way the object is scaled and turned about its own origin and only then placed in the world.")}
      </p>
      <Equation label={tx(t, "mTf_eqComp", "Two orders, two results")}
        notes={[
          tx(t, "mTf_c1", "turn 90° first, then move (−3, 0)"),
          tx(t, "mTf_c2", "move (−3, 0) first, then turn 90°"),
        ]}>
        {r`(x, y) \to (-y,\ x) \to (-y - 3,\ x) \qquad (x, y) \to (x - 3,\ y) \to (-y,\ x - 3)`}
      </Equation>
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
          "2. A sprite 32 pixels wide has its left edge at x = 100, so its centre is c = 116. Mirroring it to face left sends its left edge to 2 · 116 − 100 = 132 and its right edge, 132, to 100: it stays in the same place, facing the other way.")}
      </p>
      <p>
        {tx(t, "mTf_ex3",
          "3. A tile is scaled by (3, 2) and then moved by (10, 0). Its corner (1, 1) goes to (3, 2) and then to (13, 2). In the other order, (1, 1) → (11, 1) → (33, 2): the translation was scaled too.")}
      </p>

      <H2>{tx(t, "mTf_codeTitle", "Transformations in C++")}</H2>
      <p>
        {tx(t, "mTf_codeBody",
          "Each rule is a small function on a point; a shape is transformed by applying the function to every vertex. The pivot helper shows the \"move there, do it, move back\" pattern, and applyTRS fixes the scale–rotate–translate order that engines use (with quarter turns only until the Trigonometry section provides any angle).")}
      </p>
      <CodeBlock lang="cpp" filename="transform2d.hpp" t={t}>{`#include <vector>

struct Vec2 { float x, y; };

Vec2 translate(Vec2 p, Vec2 d)        { return { p.x + d.x, p.y + d.y }; }
Vec2 reflectX(Vec2 p)                 { return { p.x, -p.y }; }         // across the x-axis
Vec2 reflectVertical(Vec2 p, float c) { return { 2.0f * c - p.x, p.y }; } // across x = c
Vec2 rot90(Vec2 p)                    { return { -p.y, p.x }; }         // quarter turn, anticlockwise
Vec2 scale(Vec2 p, Vec2 s)            { return { p.x * s.x, p.y * s.y }; }
Vec2 shearX(Vec2 p, float k)          { return { p.x + k * p.y, p.y }; }

// Quarter turns about a pivot: move there, turn, move back
Vec2 rot90About(Vec2 p, Vec2 pivot, int quarterTurns) {
    Vec2 q = { p.x - pivot.x, p.y - pivot.y };
    for (int i = 0; i < (quarterTurns & 3); ++i) q = rot90(q);
    return { q.x + pivot.x, q.y + pivot.y };
}

// Scale, then rotate, then translate: the engine order
void applyTRS(std::vector<Vec2>& shape, Vec2 s, int quarterTurns, Vec2 pos) {
    for (Vec2& p : shape) {
        p = scale(p, s);
        for (int i = 0; i < (quarterTurns & 3); ++i) p = rot90(p);
        p = translate(p, pos);
    }
}

// One negative scale factor mirrors the shape and flips the winding: fix culling
bool flipsWinding(Vec2 s) { return s.x * s.y < 0.0f; }`}</CodeBlock>

      <H2>{tx(t, "mTf_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTf_tWrong", "Wrong"), tx(t, "mTf_tRight", "Right"), tx(t, "mTf_tWhy", "Why")]}
        rows={[
          [tx(t, "mTf_m1w", "90° turn: (x, y) → (y, −x)"), "(−y, x)", tx(t, "mTf_m1", "(y, −x) is the clockwise turn, −90°")],
          [tx(t, "mTf_m2w", "rotating about a pivot with the origin rule"), tx(t, "mTf_m2r", "subtract the pivot, turn, add it back"), tx(t, "mTf_m2", "otherwise the shape swings around the origin")],
          [tx(t, "mTf_m3w", "translate, then scale"), tx(t, "mTf_m3r", "scale, then rotate, then translate"), tx(t, "mTf_m3", "scaling after moving also scales the position")],
          [tx(t, "mTf_m4w", "mirroring with scale −1 and nothing else"), tx(t, "mTf_m4r", "also flip the culling / winding"), tx(t, "mTf_m4", "the mirrored mesh would render inside out")],
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
        "Order matters: engines scale, then rotate, then translate.",
      ]} />
    </Article>
  );
}
