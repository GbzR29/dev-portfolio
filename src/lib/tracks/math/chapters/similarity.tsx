"use client";

// Geometry 5: similarity — scale factor and similar figures, scaling about a
// centre, the similar-triangle tests (AA, SSS, SAS), solving with proportions,
// the parallel-line cut and the midsegment, measuring heights with shadows,
// k, k² and k³, perspective projection as similar triangles, and C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SimilarityFigure } from "@/components/lesson/figures/math/SimilarityFigure";

const r = String.raw;

export function SimilarityContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSim_intro",
          "A photo and its thumbnail, a map and the land it shows, a model car and the real one: each pair has the same shape at a different size. Geometry calls such shapes similar. The idea looks modest, but it is the reason a camera can turn a 3D world into a 2D picture, the reason trigonometry works at all, and the reason a character scaled up twice needs four times the texture and eight times the mass. This chapter builds it from the ratios chapter and the triangles chapter.")}
      </Lead>

      <H2>{tx(t, "mSim_defTitle", "Same shape: the scale factor")}</H2>
      <p>
        {tx(t, "mSim_defBody",
          "Two figures are similar, written ∼, when one is an exact enlargement or reduction of the other, possibly also moved, turned or flipped. Precisely: their corresponding angles are equal, and every length of one is the same number k times the matching length of the other. That number is the scale factor. If k > 1 the copy is bigger (an enlargement), if 0 < k < 1 it is smaller (a reduction), and if k = 1 the two are congruent, which makes congruence the special case of similarity with no change of size. \"Corresponding\" means \"in the same place\": the left wall of one house matches the left wall of the other, never the roof.")}
      </p>
      <Equation label={tx(t, "mSim_eqK", "Scale factor")}
        where={[
          [r`a,\ b,\ c`, tx(t, "mSim_wABC", "lengths in the original figure")],
          [r`a',\ b',\ c'`, tx(t, "mSim_wABCp", "the matching lengths in the copy (read \"a prime\")")],
          [r`k`, tx(t, "mSim_wK", "the scale factor: the same ratio for every pair of matching lengths")],
        ]}
        note={tx(t, "mSim_kNote", "Example: a 4 × 3 rectangle and an 8 × 6 rectangle are similar with k = 2 (8/4 = 6/3 = 2). A 4 × 3 and a 6 × 4 are not: 6/4 = 1.5 but 4/3 ≈ 1.33.")}>
        {r`\frac{a'}{a} = \frac{b'}{b} = \frac{c'}{c} = k`}
      </Equation>
      <p>
        {tx(t, "mSim_ratioBody",
          "Equal ratios between the figures mean equal ratios inside each figure as well. If a'/a = b'/b, then a'/b' = a/b (multiply both sides by a/b'). So a 16 : 9 screenshot resized to any width stays 16 : 9, and a sprite scaled without distortion keeps its aspect ratio. That is the test for \"not stretched\": width divided by height must not change.")}
      </p>

      <H2>{tx(t, "mSim_dilTitle", "Scaling about a centre")}</H2>
      <p>
        {tx(t, "mSim_dilBody",
          "The cleanest way to make a similar copy is a dilation. Pick a centre point O and a factor k. Every point P moves along the ray from O through P until its distance from O is k times what it was. In coordinates, take P's offset from O (x − oₓ, y − o_y), multiply it by k, and add O back. Points on the same ray stay on it, so straight lines stay straight, angles stay the same, and every length is multiplied by k. The first mode of the figure does exactly this to a small house.")}
      </p>
      <Equation label={tx(t, "mSim_eqDil", "Dilation about O = (oₓ, o_y) by k")}
        where={[
          [r`(x, y)`, tx(t, "mSim_wP", "a point of the original figure")],
          [r`(o_x, o_y)`, tx(t, "mSim_wO", "the centre of the dilation; it is the one point that does not move")],
          [r`x - o_x`, tx(t, "mSim_wOff", "how far the point is from the centre, horizontally; the vertical offset works the same way")],
          [r`(x', y')`, tx(t, "mSim_wPp", "where the point ends up")],
        ]}
        note={tx(t, "mSim_dilNote", "Example: O = (1, 1), k = 3, P = (2, 3). Offset (1, 2), times 3 is (3, 6), plus O is (4, 7). With O at the origin the formula is simply (kx, ky). Scaling a sprite \"about its pivot\" means using the pivot as O.")}>
        {r`x' = o_x + k\,(x - o_x) \qquad y' = o_y + k\,(y - o_y)`}
      </Equation>

      <SimilarityFigure t={t} />

      <H2>{tx(t, "mSim_triTitle", "Similar triangles")}</H2>
      <p>
        {tx(t, "mSim_triBody",
          "For triangles you do not need to check every angle and every ratio. The triangles chapter warned that three equal angles (AAA) do not prove two triangles congruent: they fix the shape but not the size. That is exactly what similarity needs. And since the angles of a triangle always add up to 180°, two equal angles force the third, so two are enough. Three tests, the similar versions of SSS and SAS, cover the other situations.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSim_tTest", "Test"), tx(t, "mSim_tNeed", "What must match"), tx(t, "mSim_tWhy", "Why it is enough")]}
        rows={[
          ["AA", tx(t, "mSim_s1", "two angles"), tx(t, "mSim_s1w", "the third angle is 180° minus the other two, so the shape is fixed; only the size is free")],
          ["SSS ∼", tx(t, "mSim_s2", "all three sides in the same ratio k"), tx(t, "mSim_s2w", "shrink the bigger one by 1/k and the sides are equal, so SSS congruence applies")],
          ["SAS ∼", tx(t, "mSim_s3", "two sides in ratio k and the angle between them equal"), tx(t, "mSim_s3w", "same argument, with SAS congruence after shrinking")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mSim_orderInfo", "Write similar triangles with matching corners in the same order: △ABC ∼ △DEF means A matches D, B matches E and C matches F. Then AB/DE = BC/EF = CA/FD can be read straight off the names, and most mistakes in this topic come from pairing the wrong sides.")}
      </Callout>

      <H3>{tx(t, "mSim_propTitle", "Solving with a proportion")}</H3>
      <p>
        {tx(t, "mSim_propBody",
          "Once two triangles are known to be similar, one unknown side is found by setting two ratios equal and solving, as in the ratios chapter. Write the unknown x in the ratio of its own pair, pick a pair where both lengths are known, and multiply both sides of the equation by whatever is under x (cross-multiplying).")}
      </p>
      <Equation label={tx(t, "mSim_eqProp", "Finding a side")}
        notes={[
          tx(t, "mSim_p1", "△ABC ∼ △DEF with AB = 4, BC = 6, DE = 10; find EF"),
          tx(t, "mSim_p2", "matching sides in the same ratio"),
          tx(t, "mSim_p3", "multiply both sides by 6: the scale factor here is 10/4 = 2.5"),
        ]}>
        {r`\frac{EF}{BC} = \frac{DE}{AB} \;\Rightarrow\; \frac{EF}{6} = \frac{10}{4} \;\Rightarrow\; EF = 6 \cdot \frac{10}{4} = 15`}
      </Equation>

      <H2>{tx(t, "mSim_parTitle", "A line parallel to a side")}</H2>
      <p>
        {tx(t, "mSim_parBody",
          "Draw a line across a triangle ABC, parallel to side BC, meeting AB at D and AC at E. The angles chapter showed that a line crossing two parallels makes equal corresponding angles, so ∠ADE = ∠ABC and ∠AED = ∠ACB. By AA, △ADE ∼ △ABC. The consequence is called the intercept theorem (or Thales' theorem): the parallel line cuts both sides in the same ratio. The second mode of the figure lets you slide the cut and reshape the triangle.")}
      </p>
      <Equation label={tx(t, "mSim_eqPar", "The intercept theorem")}
        where={[
          [r`DE \parallel BC`, tx(t, "mSim_wPar", "the segment DE is parallel to the side BC")],
          [r`AD,\ AB`, tx(t, "mSim_wAD", "distances from A along one side: to the cut, and to the corner")],
          [r`AE,\ AC`, tx(t, "mSim_wAE", "the same along the other side")],
        ]}
        note={tx(t, "mSim_midNote", "The midsegment: when D and E are the midpoints, the ratio is ½, so DE is parallel to BC and exactly half as long. Joining the three midpoints of a triangle cuts it into four congruent triangles, each similar to the original with k = ½, the pattern of the Sierpinski triangle.")}>
        {r`DE \parallel BC \;\Rightarrow\; \frac{AD}{AB} = \frac{AE}{AC} = \frac{DE}{BC}`}
      </Equation>

      <H3>{tx(t, "mSim_shadowTitle", "Measuring what you cannot reach")}</H3>
      <p>
        {tx(t, "mSim_shadowBody",
          "The story goes that Thales measured the height of an Egyptian pyramid with a stick. The sun is so far away that its rays arrive parallel, so every upright object and its shadow form a right triangle with the same angle at the tip of the shadow. By AA all those triangles are similar, and height divided by shadow is the same for all of them at that moment. A 1 m stick casting a 1.6 m shadow means a building casting a 24 m shadow is 24 / 1.6 = 15 m tall.")}
      </p>
      <Equation label={tx(t, "mSim_eqShadow", "Heights from shadows")}
        where={[
          [r`h_1,\ s_1`, tx(t, "mSim_wH1", "the height and shadow of something you can measure (the stick)")],
          [r`h_2,\ s_2`, tx(t, "mSim_wH2", "the unknown height and the measured shadow of the tall object")],
        ]}>
        {r`\frac{h_2}{s_2} = \frac{h_1}{s_1} \;\Rightarrow\; h_2 = s_2 \cdot \frac{h_1}{s_1} = 24 \cdot \frac{1}{1.6} = 15\ \text{m}`}
      </Equation>

      <H2>{tx(t, "mSim_scaleTitle", "Lengths k, areas k², volumes k³")}</H2>
      <p>
        {tx(t, "mSim_scaleBody",
          "The area chapter showed that scaling by k multiplies areas by k², since an area is a length times a length. A volume is length times length times length, so it is multiplied by k³ (the next chapters build volume properly). This mismatch has a name, the square–cube law. Scale a creature up 10 times: its bones' cross-section, which holds it up, grows 100 times, but its weight, which follows volume, grows 1000 times. That is why giant insects cannot exist, and why a boss that is simply a scaled-up enemy often looks wrong: its legs are relatively ten times thinner than they should be.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSim_tK", "Scale k"), tx(t, "mSim_tLen", "Lengths, perimeters ×k"), tx(t, "mSim_tArea", "Areas ×k²"), tx(t, "mSim_tVol", "Volumes, mass ×k³")]}
        rows={[
          ["½", "×0.5", "×0.25", "×0.125"],
          ["2", "×2", "×4", "×8"],
          ["3", "×3", "×9", "×27"],
          ["10", "×10", "×100", "×1000"],
        ]}
      />

      <H2>{tx(t, "mSim_projTitle", "How a camera draws: perspective")}</H2>
      <p>
        {tx(t, "mSim_projBody",
          "Here is the most important use of similar triangles in graphics. Picture a pinhole camera from the side: the eye at the origin, looking along the depth axis z, and a flat screen at distance d in front of it. A point of the world at height y and depth z sends a ray of light to the eye; the ray crosses the screen at some height y'. The eye, the foot of the screen and the ray's crossing point form a small right triangle. The eye, the point's foot on the ground line and the point itself form a big one. They share the angle at the eye, and both have a right angle, so by AA they are similar. The third mode of the figure shows both.")}
      </p>
      <Equation label={tx(t, "mSim_eqProj", "Perspective projection")}
        where={[
          [r`y`, tx(t, "mSim_wY", "the height of the point in the world (the same holds for the sideways coordinate x)")],
          [r`z`, tx(t, "mSim_wZ", "its depth: its distance in front of the eye along the viewing direction")],
          [r`d`, tx(t, "mSim_wD", "the distance from the eye to the screen")],
          [r`y'`, tx(t, "mSim_wYp", "where the point lands on the screen")],
        ]}
        note={tx(t, "mSim_projNote", "Example: d = 1, a 2 m tall tree 10 m away appears 1 · 2 / 10 = 0.2 units tall; the same tree 20 m away appears 0.1 units tall. Doubling the distance halves the size. Every 3D engine divides by depth like this, a step called the perspective divide.")}>
        {r`\frac{y'}{d} = \frac{y}{z} \;\Rightarrow\; y' = \frac{d\,y}{z} \qquad x' = \frac{d\,x}{z}`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mSim_projTip", "Similarity also explains why a camera cannot tell size from distance: a 1 m ball at 5 m and a 2 m ball at 10 m give exactly the same picture, since d · 1 / 5 = d · 2 / 10. Games exploit this with forced perspective and with far-away scenery that is really a small model or a flat image.")}
      </Callout>

      <H2>{tx(t, "mSim_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mSim_ex1",
          "1. A 1920 × 1080 image is shown in a 480 pixel wide thumbnail. k = 480 / 1920 = 0.25, so the height is 1080 · 0.25 = 270 pixels, and the thumbnail holds 0.25² = 1/16 of the pixels.")}
      </p>
      <p>
        {tx(t, "mSim_ex2",
          "2. A ramp rises 2 m over its full 8 m run. How high is it 3 m from the bottom? The small triangle under that point is similar to the whole ramp (same slope angle, same right angle): h / 3 = 2 / 8, so h = 0.75 m. This is the same as linear interpolation from the ratios chapter.")}
      </p>
      <p>
        {tx(t, "mSim_ex3",
          "3. Triangles with sides 3, 5, 7 and 7.5, 12.5, 17.5. Sort both and divide: 7.5/3 = 2.5, 12.5/5 = 2.5, 17.5/7 = 2.5. Same ratio, so they are similar by SSS∼ with k = 2.5, and the bigger one has 2.5² = 6.25 times the area.")}
      </p>

      <H2>{tx(t, "mSim_codeTitle", "Similarity in C++")}</H2>
      <p>
        {tx(t, "mSim_codeBody",
          "Scaling about a pivot and projecting a point are one line each. The similarity test sorts both sets of sides so that the matching ones line up (shortest with shortest), then compares the ratios with a relative tolerance, because floats almost never divide to exactly equal numbers.")}
      </p>
      <CodeBlock lang="cpp" filename="similarity.hpp" t={t}>{`#include <algorithm>
#include <cmath>

struct Vec2 { float x, y; };

// Dilation: move p along the ray from 'pivot' to k times its distance
Vec2 scaleAbout(Vec2 p, Vec2 pivot, float k) {
    return { pivot.x + k * (p.x - pivot.x), pivot.y + k * (p.y - pivot.y) };
}

// Pinhole projection: eye at the origin looking down +z, screen at distance d.
// Only valid for points in front of the eye (z > 0).
Vec2 project(float x, float y, float z, float d) {
    return { d * x / z, d * y / z };             // similar triangles: x'/d = x/z
}

// Are two triangles (given by side lengths) similar? SSS~ test.
bool similar(float a[3], float b[3], float eps = 1e-4f) {
    std::sort(a, a + 3);                         // pair shortest with shortest...
    std::sort(b, b + 3);
    float k = b[0] / a[0];                       // candidate scale factor
    for (int i = 1; i < 3; ++i)
        if (std::abs(b[i] / a[i] - k) > eps * k) return false;
    return true;
}`}</CodeBlock>

      <H2>{tx(t, "mSim_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSim_tWrong", "Wrong"), tx(t, "mSim_tRight", "Right"), tx(t, "mSim_tWhy2", "Why")]}
        rows={[
          [tx(t, "mSim_m1w", "pairing sides by position on the page"), tx(t, "mSim_m1r", "pair sides opposite equal angles"), tx(t, "mSim_m1", "a turned or flipped copy lists its sides in another order")],
          [tx(t, "mSim_m2w", "adding to scale: 4 × 3 → 6 × 5"), tx(t, "mSim_m2r", "multiply: 4 × 3 → 6 × 4.5"), tx(t, "mSim_m2", "adding 2 to each side changes the shape")],
          [tx(t, "mSim_m3w", "area doubles when lengths double"), tx(t, "mSim_m3r", "area ×4, volume ×8"), tx(t, "mSim_m3", "areas scale by k², volumes by k³")],
          [tx(t, "mSim_m4w", "SSA or two sides alone prove similarity"), tx(t, "mSim_m4r", "use AA, SSS∼ or SAS∼"), tx(t, "mSim_m4", "the angle must be between the two sides")],
          [tx(t, "mSim_m5w", "dividing by z when z ≤ 0"), tx(t, "mSim_m5r", "clip points behind the eye first"), tx(t, "mSim_m5", "z = 0 divides by zero; z < 0 flips the point upside down")],
        ]}
      />

      <KeyIdeas t={t} id="mSim" items={[
        "Similar figures have equal angles and all lengths in one ratio k, the scale factor.",
        "A dilation about O: x' = oₓ + k(x − oₓ), and the same for y.",
        "Triangles are similar by AA, SSS∼ or SAS∼; list matching corners in the same order.",
        "A line parallel to a side cuts the other two sides in the same ratio.",
        "Scaling by k multiplies lengths by k, areas by k², volumes by k³.",
        "Perspective is similar triangles: y' = d·y / z.",
      ]} />
    </Article>
  );
}
