"use client";

// Geometry 5: similarity — scale factor and similar figures, scaling about a
// centre, the similar-triangle tests (AA, SSS, SAS), matching sides through
// angles, solving with proportions, every length k and area k², the
// parallel-line cut and the midsegment, the hourglass and the river, heights
// with shadows and a mirror, the altitude of a right triangle (h² = pq, a
// second proof of Pythagoras), the angle bisector theorem, k, k² and k³, the
// pinhole camera as similar triangles, and map scales by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SimilarityFigure } from "@/components/lesson/figures/math/SimilarityFigure";
import { SimilarTrianglesFigure } from "@/components/lesson/figures/math/SimilarTrianglesFigure";

const r = String.raw;

// ── Live formulas: height from a shadow, perspective projection ───────────────

const num = (v: number) => String(Math.round(v * 100) / 100);

function shadowNumbers(v: Record<string, number>) {
  return { tex: r`h_2 = ${num(v.s2)} \cdot \frac{${num(v.h1)}}{${num(v.s1)}} = ${num(v.s2)} \cdot ${num(v.h1 / v.s1)} = \green{${num((v.s2 * v.h1) / v.s1)}\ \text{m}}` };
}

function projNumbers(v: Record<string, number>) {
  return { tex: r`y' = \frac{${num(v.d)} \cdot ${num(v.y)}}{${num(v.z)}} = \frac{${num(v.d * v.y)}}{${num(v.z)}} = \green{${num((v.d * v.y) / v.z)}}` };
}

/** The right triangle from the two pieces p, q of its hypotenuse. */
function altNumbers(v: Record<string, number>) {
  const { p, q } = v, c = p + q, h = Math.sqrt(p * q), a = Math.sqrt(q * c), b = Math.sqrt(p * c);
  return {
    tex: r`\begin{aligned} &h = \sqrt{${num(p)} \cdot ${num(q)}} = \sqrt{${num(p * q)}} = \green{${num(h)}} \\[4pt] &a = \sqrt{${num(q)} \cdot ${num(c)}} = ${num(a)} \qquad b = \sqrt{${num(p)} \cdot ${num(c)}} = ${num(b)} \\[4pt] &a^2 + b^2 = ${num(q * c)} + ${num(p * c)} = ${num(c * c)} = c^2 \end{aligned}`,
  };
}

/** The angle bisector from A cuts BC into BD and DC in the ratio AB : AC. */
function bisNumbers(v: Record<string, number>) {
  const { ab, ac, bc } = v, bd = (bc * ab) / (ab + ac), dc = bc - bd;
  return {
    tex: r`\begin{aligned} &BD = ${num(bc)} \cdot \frac{${num(ab)}}{${num(ab)} + ${num(ac)}} = \amber{${num(bd)}} \qquad DC = ${num(bc)} - ${num(bd)} = \amber{${num(dc)}} \\[4pt] &\frac{BD}{DC} = ${num(bd / dc)} = \frac{${num(ab)}}{${num(ac)}} \end{aligned}`,
  };
}

export function SimilarityContent({ t }: { t: TrackTranslations }) {
  const area = tx(t, "mSim_texArea", "area");
  return (
    <Article>
      <Lead>
        {tx(t, "mSim_intro",
          "A photo and its thumbnail, a map and the land it shows, a model car and the real one: each pair has the same shape at a different size. Geometry calls such shapes similar. The idea looks modest, but it is the reason a camera can turn a 3D world into a 2D picture, the reason trigonometry works at all, and the reason a statue built twice as tall needs four times the paint and eight times the bronze. This chapter builds it from the ratios chapter and the triangles chapter.")}
      </Lead>

      <Goals t={t} id="mSim" items={[
        "Find the scale factor between two shapes of the same form.",
        "Show that two triangles are similar, and use it to find missing lengths.",
        "Spot similar triangles inside a figure: nested, hourglass, and the altitude of a right triangle.",
        "Predict how lengths, areas and volumes change with scale.",
        "Use map and plan scales, and explain why far things look smaller.",
      ]} />

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
        words={tx(t, "mSim_kWords", "Divide any length of the copy by the matching length of the original: you always get the same number, k.")}
        note={tx(t, "mSim_kNote", "Example: a 4 × 3 rectangle and an 8 × 6 rectangle are similar with k = 2 (8/4 = 6/3 = 2). A 4 × 3 and a 6 × 4 are not: 6/4 = 1.5 but 4/3 ≈ 1.33.")}>
        {r`\frac{a'}{a} = \frac{b'}{b} = \frac{c'}{c} = k`}
      </Equation>
      <p>
        {tx(t, "mSim_ratioBody",
          "Equal ratios between the figures mean equal ratios inside each figure as well. If a'/a = b'/b, then a'/b' = a/b (multiply both sides by a/b'). So a 3 : 2 photo enlarged to any width stays 3 : 2, and a poster scaled without distortion keeps its proportions. That is the test for \"not stretched\": width divided by height must not change.")}
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
        words={tx(t, "mSim_dilWords", "Take the point's offset from the centre, multiply it by k, and add the centre back.")}
        note={tx(t, "mSim_dilNote", "Example: O = (1, 1), k = 3, P = (2, 3). Offset (1, 2), times 3 is (3, 6), plus O is (4, 7). With O at the origin the formula is simply (kx, ky). A slide projector does exactly this, with O at the lamp: every point of the slide lands k times as far from it on the wall.")}>
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

      <H3>{tx(t, "mSim_matchTitle", "Matching sides through the angles")}</H3>
      <p>
        {tx(t, "mSim_matchBody",
          "In exercises the second triangle is rarely drawn in the same position as the first. It may be bigger, turned, or a mirror image, so \"the bottom side\" of one is often not the partner of \"the bottom side\" of the other. The reliable rule: the side opposite an angle matches the side opposite the equal angle. In the figure below each corner has a colour and each side has the colour of the corner across from it. Press ▶ in its matching-corners mode to watch the copy being built in three moves (scale, turn, flip) and follow the colours.")}
      </p>

      <SimilarTrianglesFigure t={t} />

      <H3>{tx(t, "mSim_propTitle", "Solving with a proportion")}</H3>
      <p>
        {tx(t, "mSim_propBody",
          "Once two triangles are known to be similar, one unknown side is found by setting two ratios equal and solving, as in the ratios chapter. Write the unknown x in the ratio of its own pair, pick a pair where both lengths are known, and multiply both sides of the equation by whatever is under x (cross-multiplying).")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqProp", "Finding a side")}
        note={tx(t, "mSim_p1", "△ABC ∼ △DEF with AB = 4, BC = 6, DE = 10; find EF")}
        steps={[
          { full: true, tex: r`\frac{EF}{BC} = \frac{DE}{AB}`, why: tx(t, "mSim_p2", "matching sides in the same ratio") },
          { full: true, tex: r`\frac{EF}{6} = \frac{10}{4}`, why: tx(t, "mSim_p2b", "put in the three known lengths") },
          { full: true, tex: r`EF = 6 \cdot \frac{10}{4} = \green{15}`, why: tx(t, "mSim_p3", "multiply both sides by 6: the scale factor here is 10/4 = 2.5") },
        ]} />

      <H3>{tx(t, "mSim_allTitle", "Every length scales by k, every area by k²")}</H3>
      <p>
        {tx(t, "mSim_allBody",
          "The ratio k is not only for the three sides. Any length built the same way in both triangles (the perimeter, an altitude, a median, the radius of the inscribed circle) is in the same ratio, because the copy is the original scaled by k, and scaling multiplies every distance by k. Areas, being a length times a length, pick up k twice.")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqAreaDer", "Why the areas are in the ratio k²")}
        steps={[
          { full: true, tex: r`\text{${area}}(\triangle ABC) = \tfrac12\, a\, h_a`, why: tx(t, "mSim_ad1", "half the base times the height, from the area chapter: a is the side BC and hₐ the altitude onto it") },
          { full: true, tex: r`a' = k\,a \qquad h_a' = k\,h_a`, why: tx(t, "mSim_ad2", "in the copy the base is k times as long, and so is the altitude, since it is also a length of the figure") },
          { full: true, tex: r`\text{${area}}(\triangle A'B'C') = \tfrac12\,(k\,a)(k\,h_a) = \green{k^2} \cdot \tfrac12\, a\, h_a`, why: tx(t, "mSim_ad3", "put both into the area formula: the two factors k multiply") },
        ]} />
      <p>
        {tx(t, "mSim_allEx",
          "Example: two similar triangles have perimeters 12 cm and 18 cm. Then k = 18/12 = 1.5, the altitudes are in the ratio 1.5 as well, and if the smaller one has area 6 cm², the larger one has 6 · 1.5² = 13.5 cm². Going backwards, areas of 9 and 25 mean k² = 25/9, so k = 5/3: take the square root before comparing lengths.")}
      </p>

      <H2>{tx(t, "mSim_parTitle", "A line parallel to a side")}</H2>
      <p>
        {tx(t, "mSim_parBody",
          "Draw a line across a triangle ABC, parallel to side BC, meeting AB at D and AC at E. The angles chapter showed that a line crossing two parallels makes equal corresponding angles, so ∠ADE = ∠ABC and ∠AED = ∠ACB. By AA, △ADE ∼ △ABC. The consequence is called the intercept theorem (or Thales' theorem): the parallel line cuts both sides in the same ratio. The parallel-cut mode of the first figure lets you slide the cut and reshape the triangle.")}
      </p>
      <Equation label={tx(t, "mSim_eqPar", "The intercept theorem")}
        where={[
          [r`DE \parallel BC`, tx(t, "mSim_wPar", "the segment DE is parallel to the side BC")],
          [r`AD,\ AB`, tx(t, "mSim_wAD", "distances from A along one side: to the cut, and to the corner")],
          [r`AE,\ AC`, tx(t, "mSim_wAE", "the same along the other side")],
        ]}
        words={tx(t, "mSim_parWords", "A line parallel to one side cuts the other two sides at the same fraction of the way from the shared corner, and the cut is that same fraction of the parallel side.")}
        note={tx(t, "mSim_midNote", "The midsegment: when D and E are the midpoints, the ratio is ½, so DE is parallel to BC and exactly half as long. Joining the three midpoints of a triangle cuts it into four congruent triangles, each similar to the original with k = ½, the pattern of the Sierpinski triangle.")}>
        {r`DE \parallel BC \;\Rightarrow\; \frac{AD}{AB} = \frac{AE}{AC} = \frac{DE}{BC}`}
      </Equation>

      <H3>{tx(t, "mSim_hourTitle", "The hourglass")}</H3>
      <p>
        {tx(t, "mSim_hourBody",
          "The nested triangles above form an \"A\" shape. The other picture to look for is an \"X\", or hourglass: two parallel lines, with segment AB on one and DC on the other, and the lines AC and BD crossing at a point O between them. The two triangles OAB and OCD point at each other from opposite sides of O. The hourglass mode of the similar-triangles figure lets you drag A, B and O.")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqHourDer", "Why the two triangles of an hourglass are similar")}
        steps={[
          { full: true, tex: r`\angle AOB = \angle COD`, why: tx(t, "mSim_hd1", "vertical angles: two crossing lines make equal opposite angles (angles chapter)") },
          { full: true, tex: r`\angle OAB = \angle OCD`, why: tx(t, "mSim_hd2", "alternate angles: the line AC crosses the parallels AB and DC, making equal angles on opposite sides") },
          { full: true, tex: r`\triangle OAB \sim \triangle OCD`, why: tx(t, "mSim_hd3", "two equal angles are enough (AA). In this order O matches O, A matches C and B matches D") },
          { full: true, tex: r`\frac{OC}{OA} = \frac{OD}{OB} = \frac{DC}{AB} = \green{k}`, why: tx(t, "mSim_hd4", "matching sides read straight off the names. Careful: OA pairs with OC, the other half of the same line, not with OD") },
        ]} />
      <p>
        {tx(t, "mSim_riverBody",
          "This is how a river can be measured without crossing it. Pick a tree A on the far bank and stand at B, straight across from it. Walk 12 m along your bank to a stake C, then 4 m further to D. From D walk straight away from the river, at a right angle to the bank, until the stake C hides the tree: you are at E, and DE = 5 m. AB and DE are both at right angles to the bank, so they are parallel, and the lines AE and BD cross at C: an hourglass with C in the middle. B matches D, so AB/DE = BC/DC = 12/4 = 3, and the river is AB = 3 · 5 = 15 m wide. The same picture hides in every trapezoid: its two diagonals cross at a point that divides each of them in the ratio of the two parallel sides.")}
      </p>

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
      <LiveFormula label={tx(t, "mSim_liveShadow", "Try it: a height from a shadow")}
        tex={r`h_2 = s_2 \cdot \frac{h_1}{s_1}`}
        vars={[
          { id: "h1", label: tx(t, "mSim_liveH1", "stick height h₁ (m)"), min: 0.5, max: 3, step: 0.1, value: 1, fmt: num },
          { id: "s1", label: tx(t, "mSim_liveS1", "stick shadow s₁ (m)"), min: 0.2, max: 5, step: 0.1, value: 1.6, fmt: num },
          { id: "s2", label: tx(t, "mSim_liveS2", "building shadow s₂ (m)"), min: 1, max: 100, step: 1, value: 24, fmt: num },
        ]}
        compute={shadowNumbers}
        note={tx(t, "mSim_liveShadowNote", "The fraction h₁/s₁ is fixed by the sun's height at that moment. At midday in summer shadows are short and the fraction is big; in the evening shadows stretch and it gets small, but it is the same for every object at the same time.")} />
      <p>
        {tx(t, "mSim_mirrorBody",
          "No sun? Use a mirror. Lay a small mirror flat on the ground and walk back until you see the top of a tree in it. Light reflects at equal angles, so the angle from your eye down to the mirror equals the angle from the mirror up to the treetop. You and the tree both stand at right angles to the ground, so by AA your triangle (eye, feet, mirror) is similar to the tree's (top, foot, mirror). With your eyes 1.6 m high, 2 m from the mirror, and the mirror 9 m from the tree: h / 9 = 1.6 / 2, so h = 7.2 m.")}
      </p>

      <H2>{tx(t, "mSim_altTitle", "The altitude of a right triangle")}</H2>
      <p>
        {tx(t, "mSim_altBody",
          "Take a right triangle ACB with the right angle at C, legs a = BC and b = AC, and hypotenuse c = AB. Drop the altitude from C to the hypotenuse; its foot D cuts AB into two pieces, p = AD next to b and q = DB next to a, and its length is h = CD. Now there are three right triangles in the picture, and they are all similar. The altitude mode of the similar-triangles figure pulls them apart and stacks them on their common angle.")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqAltDer", "Three similar right triangles")}
        steps={[
          { full: true, tex: r`\triangle ADC \sim \triangle ACB`, why: tx(t, "mSim_ld1", "both have the angle α at A and a right angle (at D and at C): AA. So A matches A, D matches C and C matches B") },
          { full: true, tex: r`\triangle CDB \sim \triangle ACB`, why: tx(t, "mSim_ld2", "both have the angle β at B and a right angle: AA. So C matches A, D matches C and B matches B") },
          { full: true, tex: r`\frac{AD}{CD} = \frac{CD}{DB} \;\Rightarrow\; \frac{p}{h} = \frac{h}{q} \;\Rightarrow\; \green{h^2 = p\,q}`, why: tx(t, "mSim_ld3", "the two small triangles are similar to the same triangle, so to each other. In each, divide the leg along AB by the leg CD, then multiply both sides by hq") },
          { full: true, tex: r`\frac{AD}{AC} = \frac{AC}{AB} \;\Rightarrow\; \frac{p}{b} = \frac{b}{c} \;\Rightarrow\; \green{b^2 = p\,c}`, why: tx(t, "mSim_ld4", "from the first similarity: in each triangle, the side next to α that is not the hypotenuse, divided by the hypotenuse") },
          { full: true, tex: r`\frac{DB}{CB} = \frac{CB}{AB} \;\Rightarrow\; \frac{q}{a} = \frac{a}{c} \;\Rightarrow\; \green{a^2 = q\,c}`, why: tx(t, "mSim_ld5", "the same with the second similarity, around the angle β") },
        ]} />
      <Equation label={tx(t, "mSim_eqAlt", "Altitude and legs from the pieces of the hypotenuse")}
        where={[
          [r`p,\ q`, tx(t, "mSim_wPQ", "the two pieces into which the altitude's foot cuts the hypotenuse")],
          [r`h`, tx(t, "mSim_wHalt", "the altitude from the right angle to the hypotenuse")],
          [r`a,\ b`, tx(t, "mSim_wLegs", "the legs; a is next to the piece q and b next to the piece p")],
          [r`c`, tx(t, "mSim_wC", "the hypotenuse, c = p + q")],
        ]}
        words={tx(t, "mSim_altWords", "The altitude squared is the product of the two pieces of the hypotenuse. Each leg squared is the whole hypotenuse times the piece next to that leg.")}
        note={tx(t, "mSim_altNote", "A number whose square is the product of two others is their geometric mean: h = √(pq). With p = 9 and q = 16: h = √144 = 12, a = √(16 · 25) = 20, b = √(9 · 25) = 15.")}>
        {r`h^2 = p\,q \qquad a^2 = q\,c \qquad b^2 = p\,c`}
      </Equation>
      <p>
        {tx(t, "mSim_pythBody",
          "Add the last two equations and Pythagoras' theorem falls out, a second proof that uses similarity instead of rearranging areas.")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqPythDer", "Pythagoras from similar triangles")}
        steps={[
          { full: true, tex: r`a^2 + b^2 = q\,c + p\,c`, why: tx(t, "mSim_pd1", "add a² = qc and b² = pc") },
          { full: true, tex: r`= (p + q)\,c`, why: tx(t, "mSim_pd2", "take out the common factor c") },
          { full: true, tex: r`= c \cdot c = \green{c^2}`, why: tx(t, "mSim_pd3", "D lies on AB, so the two pieces make up the whole hypotenuse: p + q = c") },
        ]} />
      <LiveFormula label={tx(t, "mSim_liveAlt", "Try it: a right triangle from its altitude's foot")}
        tex={r`h = \sqrt{p\,q} \qquad a = \sqrt{q\,c} \qquad b = \sqrt{p\,c}`}
        vars={[
          { id: "p", label: "p", min: 0.5, max: 20, step: 0.5, value: 9, fmt: num },
          { id: "q", label: "q", min: 0.5, max: 20, step: 0.5, value: 16, fmt: num },
        ]}
        compute={altNumbers}
        note={tx(t, "mSim_liveAltNote", "The start is the 15–20–25 triangle. Make p = q and the triangle is half a square: h = p, and the two legs are equal. Make p tiny and h almost vanishes: C slides down next to A.")} />

      <H3>{tx(t, "mSim_bisTitle", "The angle bisector theorem")}</H3>
      <p>
        {tx(t, "mSim_bisBody",
          "One more result that similar triangles prove. In a triangle ABC, the line from A that cuts the angle at A into two equal halves (the angle bisector) meets BC at a point D. Where exactly? The proof adds a helper line: through C, draw a line parallel to AD, and extend the side BA beyond A until it meets that line, at E.")}
      </p>
      <Derivation t={t} label={tx(t, "mSim_eqBisDer", "Where the bisector cuts the opposite side")}
        steps={[
          { full: true, tex: r`\angle AEC = \angle BAD`, why: tx(t, "mSim_bd1", "corresponding angles: the line BE crosses the parallels AD and EC") },
          { full: true, tex: r`\angle ACE = \angle DAC`, why: tx(t, "mSim_bd2", "alternate angles: the line AC crosses the same parallels") },
          { full: true, tex: r`\angle AEC = \angle ACE`, why: tx(t, "mSim_bd3", "AD bisects the angle at A, so ∠BAD = ∠DAC, and the two lines above are equal too") },
          { full: true, tex: r`AE = AC`, why: tx(t, "mSim_bd4", "a triangle with two equal angles is isosceles: the sides opposite them are equal (triangles chapter)") },
          { full: true, tex: r`\frac{BD}{DC} = \frac{BA}{AE}`, why: tx(t, "mSim_bd5", "the intercept theorem in triangle BEC: AD is parallel to the side EC, so it cuts BE and BC in the same ratio") },
          { full: true, tex: r`\frac{BD}{DC} = \green{\frac{AB}{AC}}`, why: tx(t, "mSim_bd6", "replace AE by AC") },
        ]} />
      <LiveFormula label={tx(t, "mSim_liveBis", "Try it: the bisector's cut")}
        tex={r`\frac{BD}{DC} = \frac{AB}{AC}`}
        vars={[
          { id: "ab", label: "AB", min: 1, max: 15, step: 0.5, value: 6, fmt: num },
          { id: "ac", label: "AC", min: 1, max: 15, step: 0.5, value: 9, fmt: num },
          { id: "bc", label: "BC", min: 1, max: 20, step: 0.5, value: 10, fmt: num },
        ]}
        compute={bisNumbers}
        note={tx(t, "mSim_liveBisNote", "The start: AB = 6, AC = 9, BC = 10 gives BD = 4 and DC = 6. The longer neighbouring side gets the longer piece. With AB = AC the bisector hits the midpoint. (For a real triangle each side must be shorter than the other two together.)")} />

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

      <H2>{tx(t, "mSim_projTitle", "How a camera sees: perspective")}</H2>
      <p>
        {tx(t, "mSim_projBody",
          "Why do far things look small? A pinhole camera, a dark box with a tiny hole, answers with similar triangles, and your eye works the same way. Picture it from the side, drawn the way painters and architects draw perspective: the eye (the pinhole) at the origin, looking along the depth axis z, and a flat picture plane, like a window you trace the view onto, at distance d in front of it. A point of the world at height y and depth z sends a ray of light to the eye; the ray crosses the screen at some height y'. The eye, the foot of the screen and the ray's crossing point form a small right triangle. The eye, the point's foot on the ground line and the point itself form a big one. They share the angle at the eye, and both have a right angle, so by AA they are similar. The projection mode of the first figure shows both.")}
      </p>
      <Equation label={tx(t, "mSim_eqProj", "Perspective projection")}
        where={[
          [r`y`, tx(t, "mSim_wY", "the height of the point in the world (the same holds for the sideways coordinate x)")],
          [r`z`, tx(t, "mSim_wZ", "its depth: its distance in front of the eye along the viewing direction")],
          [r`d`, tx(t, "mSim_wD", "the distance from the eye to the picture plane")],
          [r`y'`, tx(t, "mSim_wYp", "where the point lands on the picture plane")],
        ]}
        words={tx(t, "mSim_projWords", "A point's height in the picture is its real height scaled by d over its distance: the farther away, the smaller.")}
        note={tx(t, "mSim_projNote", "Example: d = 1, a 2 m tall tree 10 m away appears 1 · 2 / 10 = 0.2 units tall; the same tree 20 m away appears 0.1 units tall. Doubling the distance halves the size, which is why the rails of a straight railway seem to meet at the horizon.")}>
        {r`\frac{y'}{d} = \frac{y}{z} \;\Rightarrow\; y' = \frac{d\,y}{z} \qquad x' = \frac{d\,x}{z}`}
      </Equation>
      <LiveFormula label={tx(t, "mSim_liveProj", "Try it: perspective")}
        tex={r`y' = \frac{d\,y}{z}`}
        vars={[
          { id: "d", label: tx(t, "mSim_liveD", "picture distance d"), min: 0.5, max: 3, step: 0.5, value: 1, fmt: num },
          { id: "y", label: tx(t, "mSim_liveY", "height y (m)"), min: 0.5, max: 10, step: 0.5, value: 2, fmt: num },
          { id: "z", label: tx(t, "mSim_liveZ", "distance z (m)"), min: 1, max: 100, step: 1, value: 10, fmt: num },
        ]}
        compute={projNumbers}
        note={tx(t, "mSim_liveProjNote", "Double z and the image halves; double y and z together and nothing changes. That second fact is forced perspective.")} />
      <Callout type="tip" t={t}>
        {tx(t, "mSim_projTip", "Similarity also explains why a camera cannot tell size from distance: a 1 m ball at 5 m and a 2 m ball at 10 m give exactly the same picture, since d · 1 / 5 = d · 2 / 10. Film-makers exploit this with forced perspective: a small model close to the camera passes for a huge building far away, and tourists do it when they \"hold up\" the Leaning Tower of Pisa in a photo.")}
      </Callout>

      <H2>{tx(t, "mSim_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mSim_ex1",
          "1. A 10 cm × 15 cm photo is enlarged so that its short side becomes 40 cm. k = 40 / 10 = 4, so the long side becomes 15 · 4 = 60 cm, and the print needs 4² = 16 times as much paper: 40 · 60 = 2400 cm² against 10 · 15 = 150 cm², and 150 · 16 = 2400 ✓.")}
      </p>
      <p>
        {tx(t, "mSim_ex2",
          "2. A ramp rises 2 m over its full 8 m run. How high is it 3 m from the bottom? The small triangle under that point is similar to the whole ramp (same slope angle, same right angle): h / 3 = 2 / 8, so h = 0.75 m. This is the same as linear interpolation from the ratios chapter.")}
      </p>
      <p>
        {tx(t, "mSim_ex3",
          "3. Triangles with sides 3, 5, 7 and 7.5, 12.5, 17.5. Sort both and divide: 7.5/3 = 2.5, 12.5/5 = 2.5, 17.5/7 = 2.5. Same ratio, so they are similar by SSS∼ with k = 2.5, and the bigger one has 2.5² = 6.25 times the area.")}
      </p>
      <p>
        {tx(t, "mSim_ex4",
          "4. A trapezoid has parallel sides AB = 6 and DC = 10, and its diagonals AC and BD cross at O. The triangles OAB and OCD form an hourglass with k = 10/6 = 5/3, so O cuts each diagonal in the ratio 3 : 5. If AC = 12, then OA = 12 · 3/8 = 4.5 and OC = 7.5. Check: 7.5/4.5 = 5/3 ✓.")}
      </p>
      <p>
        {tx(t, "mSim_ex5",
          "5. A right triangle has legs 6 and 8, so its hypotenuse is 10. Where does the altitude from the right angle meet the hypotenuse? From b² = pc: p = 6²/10 = 3.6, and from a² = qc: q = 8²/10 = 6.4 (3.6 + 6.4 = 10 ✓). The altitude is h = √(3.6 · 6.4) = √23.04 = 4.8, which agrees with the area: ½ · 6 · 8 = 24 = ½ · 10 · 4.8.")}
      </p>
      <p>
        {tx(t, "mSim_ex6",
          "6. In triangle ABC, AB = 6, AC = 9 and BC = 10. The bisector of the angle at A cuts BC in the ratio 6 : 9 = 2 : 3, so BD = 10 · 2/5 = 4 and DC = 6.")}
      </p>
      <p>
        {tx(t, "mSim_ex7",
          "7. A 1.8 m person stands 4 m from a lamp post and casts a 2 m shadow. The tip of the shadow, the person and the post form an \"A\": the small triangle (person, 2 m of ground) and the big one (post, 2 + 4 = 6 m of ground) share the angle at the tip, so the post is 1.8 · 6/2 = 5.4 m tall. The trap is to use 4 m instead of 6 m: the big triangle's base runs all the way from the tip of the shadow to the post.")}
      </p>

      <H2>{tx(t, "mSim_mapTitle", "Map and plan scales by hand")}</H2>
      <p>
        {tx(t, "mSim_mapBody",
          "A map scale such as 1 : 25 000 is a scale factor written as a ratio: 1 cm on the map is 25 000 cm on the ground. To go from the map to the ground, multiply lengths by 25 000; to go back, divide. Areas follow the k² rule, so they are multiplied by 25 000², which is why areas measured on a map need the scale squared, never the scale itself.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSim_tQuestion", "Question"), tx(t, "mSim_tWork", "Working"), tx(t, "mSim_tAnswer", "Answer")]}
        rows={[
          [tx(t, "mSim_q1", "a trail 4.2 cm long on a 1 : 25 000 map"), "4.2 · 25 000 = 105 000 cm", "1050 m = 1.05 km"],
          [tx(t, "mSim_q2", "a 3 km road, drawn on the same map"), "300 000 cm ÷ 25 000", "12 cm"],
          [tx(t, "mSim_q3", "a lake covering 3 cm² of the map"), "3 · 25 000² = 1 875 000 000 cm²", tx(t, "mSim_a3", "187 500 m² = 18.75 ha")],
          [tx(t, "mSim_q4", "a 4.8 m wall on a 1 : 50 house plan"), "480 cm ÷ 50", "9.6 cm"],
        ]}
      />
      <p>
        {tx(t, "mSim_mapCheck",
          "The lake line, unit by unit: 1 m² = 100 cm × 100 cm = 10 000 cm², so 1 875 000 000 cm² ÷ 10 000 = 187 500 m², and a hectare is 100 m × 100 m = 10 000 m², giving 18.75 ha. Using 25 000 instead of 25 000² would have made the lake 10 000 times too small.")}
      </p>

      <H2>{tx(t, "mSim_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSim_tWrong", "Wrong"), tx(t, "mSim_tRight", "Right"), tx(t, "mSim_tWhy2", "Why")]}
        rows={[
          [tx(t, "mSim_m1w", "pairing sides by position on the page"), tx(t, "mSim_m1r", "pair sides opposite equal angles"), tx(t, "mSim_m1", "a turned or flipped copy lists its sides in another order")],
          [tx(t, "mSim_m2w", "adding to scale: 4 × 3 → 6 × 5"), tx(t, "mSim_m2r", "multiply: 4 × 3 → 6 × 4.5"), tx(t, "mSim_m2", "adding 2 to each side changes the shape")],
          [tx(t, "mSim_m3w", "area doubles when lengths double"), tx(t, "mSim_m3r", "area ×4, volume ×8"), tx(t, "mSim_m3", "areas scale by k², volumes by k³")],
          [tx(t, "mSim_m4w", "SSA or two sides alone prove similarity"), tx(t, "mSim_m4r", "use AA, SSS∼ or SAS∼"), tx(t, "mSim_m4", "the angle must be between the two sides")],
          [tx(t, "mSim_m5w", "map area = paper area × scale"), tx(t, "mSim_m5r", "multiply by the scale squared"), tx(t, "mSim_m5", "an area is a length times a length, so each is scaled")],
          [tx(t, "mSim_m6w", "hourglass: OA/OD = OB/OC"), "OA/OC = OB/OD", tx(t, "mSim_m6", "each half pairs with the other half of the same line, through O")],
          [tx(t, "mSim_m7w", "nested triangles: using only the extra piece as the big side"), tx(t, "mSim_m7r", "the big triangle's side is the whole side"), tx(t, "mSim_m7", "the lamp post's triangle reaches from the shadow's tip to the post: 2 + 4, not 4")],
        ]}
      />

      <KeyIdeas t={t} id="mSim" items={[
        "Similar figures have equal angles and all lengths in one ratio k, the scale factor.",
        "A dilation about O: x' = oₓ + k(x − oₓ), and the same for y.",
        "Triangles are similar by AA, SSS∼ or SAS∼; list matching corners in the same order.",
        "Match sides through the angles opposite them; a turned or flipped copy is still similar.",
        "A line parallel to a side cuts the other two sides in the same ratio; two lines crossing between parallels make an hourglass of similar triangles.",
        "The altitude to the hypotenuse makes three similar right triangles: h² = pq, a² = qc, b² = pc, and so a² + b² = c².",
        "The bisector of an angle cuts the opposite side in the ratio of the two neighbouring sides.",
        "Scaling by k multiplies lengths by k, areas by k², volumes by k³.",
        "Perspective is similar triangles: y' = d·y / z, so twice as far looks half as big.",
        "Map scale 1 : n multiplies lengths by n and areas by n².",
      ]} />
    </Article>
  );
}
