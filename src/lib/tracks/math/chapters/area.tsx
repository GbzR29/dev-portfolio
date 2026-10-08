"use client";

// Geometry 3: perimeter and area — perimeter, the unit square, rectangle,
// parallelogram, triangle and trapezoid formulas with where they come from,
// composite shapes, how scaling changes perimeter and area (k and k²), unit
// conversion, the shoelace formula with signed area and winding order, and
// the area of a plot of land from its corner coordinates, by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { AreaFigure } from "@/components/lesson/figures/math/AreaFigure";
import { ShoelaceFigure } from "@/components/lesson/figures/math/ShoelaceFigure";

const r = String.raw;

// ── Live formula: scaling a rectangle by k ────────────────────────────────────

const num = (v: number) => String(Math.round(v * 100) / 100);

function scaleNumbers(v: Record<string, number>) {
  const { b, h, k } = v, P = 2 * (b + h), A = b * h;
  return {
    tex: r`P' = \sym{k}{\amber{${num(k)}}} \cdot 2(${num(b)} + ${num(h)}) = \sym{k}{\amber{${num(k)}}} \cdot ${num(P)} = \green{${num(k * P)}}`
      + r` \qquad A' = \sym{k}{\amber{${num(k)}}}^2 \cdot ${num(b)} \cdot ${num(h)} = ${num(k * k)} \cdot ${num(A)} = \green{${num(k * k * A)}}`,
  };
}

export function AreaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mArea_intro",
          "How much fence does a field need, and how much seed? The first question is about perimeter, the length around a shape; the second is about area, the amount of surface inside it. The same two questions come up when you skirt a room with trim, tile a floor, paint a wall or buy a plot of land. This chapter derives the area formulas for the basic shapes instead of just listing them, shows how area behaves when a shape is scaled, and ends with one formula that gives the area of any polygon from its corner coordinates.")}
      </Lead>

      <Goals t={t} id="mArea" items={[
        "Find the perimeter and area of rectangles, triangles, parallelograms and trapezoids.",
        "Split a complicated shape into simple ones.",
        "Predict how the area changes when a shape is scaled.",
        "Find the area of any polygon from its corners with the shoelace formula.",
      ]} />

      <H2>{tx(t, "mArea_perimTitle", "Perimeter: the length around")}</H2>
      <p>
        {tx(t, "mArea_perimBody",
          "The perimeter of a shape is the total length of its boundary: walk once around it and measure how far you went. For a polygon (a shape bounded by straight segments) it is just the sum of the side lengths. A perimeter is a length, so it has length units: metres, centimetres, pixels, grid tiles. For a rectangle, two sides have length b (the base) and two have length h (the height), so the perimeter is b + h + b + h.")}
      </p>
      <Equation label={tx(t, "mArea_eqPerim", "Perimeters")}
        where={[
          [r`P`, tx(t, "mArea_wP", "the perimeter, a length")],
          [r`b,\ h`, tx(t, "mArea_wBH", "the base and height (the two side lengths) of a rectangle")],
          [r`s`, tx(t, "mArea_wS", "the side of a square, whose four sides are equal")],
          [r`s_1, \dots, s_n`, tx(t, "mArea_wSi", "the n side lengths of any polygon")],
        ]}
        words={tx(t, "mArea_perimWords", "Walk once around the shape and add up the length of every side you pass.")}>
        {r`P_{\text{rect}} = 2(b + h) \qquad P_{\text{square}} = 4s \qquad P_{\text{polygon}} = s_1 + s_2 + \dots + s_n`}
      </Equation>

      <H2>{tx(t, "mArea_areaTitle", "Area: counting unit squares")}</H2>
      <p>
        {tx(t, "mArea_areaBody",
          "Area is measured by comparison with a unit square, a square whose sides are 1 unit long. The area of a shape is how many unit squares it takes to cover it exactly, with pieces of squares allowed. Because the unit is a square, area units are squared length units: square metres (m²), square centimetres (cm²), square pixels. A rectangle 5 units wide and 3 tall holds 3 rows of 5 squares, 15 in all, which is why its area is base times height. Every other formula in this chapter comes from that one by cutting and moving pieces, and moving a piece never changes how many squares it covers.")}
      </p>

      <AreaFigure t={t} />

      <H3>{tx(t, "mArea_paraTitle", "Parallelogram")}</H3>
      <p>
        {tx(t, "mArea_paraBody",
          "A parallelogram has two pairs of parallel sides; it looks like a rectangle pushed over. Its height h is the perpendicular distance between the two bases, measured straight across, not along the slanted side. Cut off the triangle at one end along a perpendicular, slide it to the other end, and the pieces form a rectangle with the same base b and height h. So a parallelogram's area is b · h, however far it leans. Try the parallelogram mode above and move the lean slider: the area readout never changes.")}
      </p>
      <H3>{tx(t, "mArea_triTitle", "Triangle")}</H3>
      <p>
        {tx(t, "mArea_triBody",
          "Take any triangle and a copy of it, turned half a turn. Placed side by side along one side, the two copies make a parallelogram with the triangle's base and height. The triangle is half of that parallelogram, so its area is ½ · b · h. Any of the three sides can be the base; the height then is the perpendicular distance from that side (or its extension) to the opposite corner. For an obtuse triangle that height can fall outside the triangle, and the formula still works.")}
      </p>
      <H3>{tx(t, "mArea_trapTitle", "Trapezoid")}</H3>
      <p>
        {tx(t, "mArea_trapBody",
          "A trapezoid (called a trapezium in British English) has exactly one pair of parallel sides, a and b, at distance h apart. Two copies, one turned half a turn, form a parallelogram whose base is a + b, so one trapezoid has area ½ · (a + b) · h: the average of the two parallel sides, times the height. With a = b it is a parallelogram (b · h), and with a = 0 the top shrinks to a point and it becomes a triangle (½ · b · h), so the formula agrees with both.")}
      </p>
      <Equation label={tx(t, "mArea_eqAreas", "Areas of the basic shapes")}
        where={[
          [r`A`, tx(t, "mArea_wA", "the area, in squared units")],
          [r`b`, tx(t, "mArea_wB", "a base: the side the height is measured from")],
          [r`h`, tx(t, "mArea_wH", "the height: the perpendicular distance from the base to the opposite side or corner")],
          [r`a`, tx(t, "mArea_wA2", "a trapezoid's second parallel side")],
          [r`\tfrac12`, tx(t, "mArea_wHalf", "a triangle is half a parallelogram; a trapezoid is half of two copies")],
        ]}
        words={tx(t, "mArea_areasWords", "A rectangle or parallelogram is base times height. A triangle is half of that. A trapezoid is the average of its two parallel sides, times the height.")}>
        {r`A_{\text{rect}} = b\,h \qquad A_{\text{square}} = s^2 \qquad A_{\text{para}} = b\,h \qquad A_{\triangle} = \tfrac12\,b\,h \qquad A_{\text{trap}} = \tfrac12\,(a + b)\,h`}
      </Equation>
      <Derivation t={t} label={tx(t, "mArea_derTrap", "The trapezoid formula, step by step")}
        steps={[
          { full: true, tex: r`2 \times \text{${tx(t, "mArea_dt0a", "trapezoid")}} = \text{${tx(t, "mArea_dt0b", "parallelogram")}}`, why: tx(t, "mArea_dt1", "turn a copy half a turn and put it against the slanted side: the two make a parallelogram") },
          { full: true, tex: r`\text{${tx(t, "mArea_dtBase", "base")}} = a + b,\quad \text{${tx(t, "mArea_dtHeight", "height")}} = h`, why: tx(t, "mArea_dt2", "the copy's short side a continues the original's long side b; the height does not change") },
          { full: true, tex: r`A_{2} = (a + b)\,h`, why: tx(t, "mArea_dt3", "a parallelogram is base times height") },
          { full: true, tex: r`\green{A_{\text{trap}} = \tfrac12\,(a + b)\,h}`, why: tx(t, "mArea_dt4", "one trapezoid is half of the two copies") },
        ]} />

      <H2>{tx(t, "mArea_compTitle", "Composite shapes")}</H2>
      <p>
        {tx(t, "mArea_compBody",
          "Most real outlines are not one basic shape. Cut them into basic shapes and add the areas, or take a big shape and subtract the parts that are missing. An L-shaped room 8 m by 6 m with a 3 m by 2 m corner missing has area 8 · 6 − 3 · 2 = 48 − 6 = 42 m². Cutting it instead into a 5 × 6 and a 3 × 4 rectangle gives 30 + 12 = 42 m² as well. The perimeter is different: add the lengths of the outer walls only, never the cut lines. Here, walking around: 8 + 4 + 3 + 2 + 5 + 6 = 28 m, exactly the same as the full 8 × 6 rectangle, because the notch only moved two walls inwards.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mArea_indepInfo", "Perimeter and area are independent. A 5 × 1 and a 3 × 3 rectangle both have perimeter 12, but areas 5 and 9. Among all rectangles with a given perimeter, the square has the largest area; long, thin shapes have lots of boundary and little inside. That is why cells, bubbles and igloos tend towards round shapes, and why a long corridor costs more walls than a square room of the same floor area.")}
      </Callout>

      <H2>{tx(t, "mArea_scaleTitle", "Scaling: k for lengths, k² for areas")}</H2>
      <p>
        {tx(t, "mArea_scaleBody",
          "Scale a shape by a factor k: every length is multiplied by k. The perimeter, a sum of lengths, is multiplied by k. The area is multiplied by k², because it is length times length: a rectangle b × h becomes kb × kh, with area k² · bh. Double the size and the area is four times as big; triple it and it is nine times. This k² law is everywhere in graphics. A 2048 × 2048 texture has four times the pixels, and four times the memory, of a 1024 × 1024 one. Rendering at 4K (3840 × 2160) means four times the pixels of 1080p (1920 × 1080), because both sides doubled.")}
      </p>
      <Equation label={tx(t, "mArea_eqScale", "Scaling by a factor k")}
        where={[
          [r`\sym{k}{\amber{k}}`, tx(t, "mArea_wK", "the scale factor; every length is multiplied by k")],
          [r`P,\ A`, tx(t, "mArea_wPA", "perimeter and area before scaling")],
        ]}
        words={tx(t, "mArea_scaleWords", "Scale every length by k and the perimeter grows k times, but the area grows k times k times, because it is a length times a length.")}
        note={tx(t, "mArea_unitNote", "The same law converts units. 1 m = 100 cm, so 1 m² = 100 cm × 100 cm = 10 000 cm², not 100 cm². A 3 m × 2 m floor is 6 m² = 60 000 cm².")}>
        {r`P' = \sym{k}{\amber{k}}\,P \qquad A' = \sym{k}{\amber{k}}^2\,A`}
      </Equation>
      <LiveFormula label={tx(t, "mArea_liveScale", "Try it: scale a rectangle")}
        tex={r`P' = \sym{k}{\amber{k}} \cdot 2(b + h) \qquad A' = \sym{k}{\amber{k}}^2 \cdot b\,h`}
        vars={[
          { id: "b", label: tx(t, "mArea_liveB", "base b"), min: 1, max: 10, step: 1, value: 3, fmt: num },
          { id: "h", label: tx(t, "mArea_liveH", "height h"), min: 1, max: 10, step: 1, value: 2, fmt: num },
          { id: "k", label: tx(t, "mArea_liveK", "scale factor k"), min: 0.5, max: 10, step: 0.5, value: 2, fmt: num },
        ]}
        compute={scaleNumbers}
        note={tx(t, "mArea_liveScaleNote", "Set k = 100 in your head: a 3 m × 2 m floor measured in centimetres. With k = 0.5 the area drops to a quarter, not a half.")} />

      <H2>{tx(t, "mArea_shoeTitle", "Any polygon: the shoelace formula")}</H2>
      <p>
        {tx(t, "mArea_shoeBody",
          "For a polygon given by the coordinates of its corners (the way a surveyor records a plot of land, as measured positions of its corner posts) there is one formula that needs no cutting at all. List the corners in order around the outline, P₁ to Pₙ, and wrap around so that after Pₙ comes P₁ again. For each edge, multiply crosswise, xᵢ · yᵢ₊₁ − xᵢ₊₁ · yᵢ, and add up all these terms; the area is half the sum. The name comes from the criss-cross pattern of the multiplications when the coordinates are written in two columns, like the laces of a shoe.")}
      </p>
      <Equation label={tx(t, "mArea_eqShoe", "The shoelace formula")}
        where={[
          [r`(x_i, y_i)`, tx(t, "mArea_wXi", "the coordinates of corner i, listed in order around the polygon")],
          [r`n`, tx(t, "mArea_wN", "the number of corners")],
          [r`i + 1`, tx(t, "mArea_wWrap", "the next corner; after corner n comes corner 1 again")],
          [r`\sum`, tx(t, "mArea_wSum", "add the term for every edge, i = 1 to n")],
          [r`A_{\pm}`, tx(t, "mArea_wSigned", "the signed area: positive if the corners go anticlockwise, negative if clockwise. Its absolute value is the area")],
        ]}
        words={tx(t, "mArea_shoeWords", "For every edge, multiply crosswise (this corner's x times the next corner's y, minus the next corner's x times this corner's y), add all the results, and halve the total.")}
        note={tx(t, "mArea_shoeNote", "Check with the rectangle (0, 0), (4, 0), (4, 3), (0, 3): the terms are 0·0 − 4·0 = 0, 4·3 − 4·0 = 12, 4·3 − 0·3 = 12, 0·0 − 0·3 = 0. Sum 24, area 12 = 4 · 3 ✓.")}>
        {r`A_{\pm} = \frac12 \sum_{i=1}^{n} \left( x_i\,y_{i+1} - x_{i+1}\,y_i \right)`}
      </Equation>
      <p>
        {tx(t, "mArea_shoeWhy",
          "Why it works: each term is twice the signed area of the triangle formed by the origin and one edge. Going round the polygon, those triangles cover the polygon once and also cover some area outside it, but the outside parts are covered once turning one way (positive) and once turning the other way (negative), so they cancel. Turn on the triangles in the figure to see it.")}
      </p>

      <ShoelaceFigure t={t} />

      <H3>{tx(t, "mArea_windTitle", "The sign is a feature: winding order")}</H3>
      <p>
        {tx(t, "mArea_windBody",
          "The sign of the shoelace sum tells you which way the corners go round: positive for anticlockwise, negative for clockwise (with the y axis pointing up, as on graph paper). The order the corners are listed in is called the winding order. So the formula answers two questions at once: its size is the area, and its sign says whether you walked round the outline anticlockwise or clockwise. For the area alone, take the absolute value. The Linear Algebra section will meet the same crosswise term again as the 2D cross product, where its sign tells left turns from right turns.")}
      </p>

      <H2>{tx(t, "mArea_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mArea_ex1",
          "1. A triangular sail has a 4 m base and is 6 m tall: A = ½ · 4 · 6 = 12 m². A trapezoidal ramp side has parallel edges 2 m and 5 m, 1.5 m apart: A = ½ · (2 + 5) · 1.5 = 5.25 m².")}
      </p>
      <p>
        {tx(t, "mArea_ex2",
          "2. A square hall 12 m × 12 m is tiled with 40 cm × 40 cm tiles. Along each wall fit 12 ÷ 0.4 = 30 tiles, so the floor takes 30 × 30 = 900 tiles. With 20 cm tiles each side halves, 60 tiles per wall, and the count quadruples to 3600: the area of one tile went down by a factor of 2² = 4.")}
      </p>
      <p>
        {tx(t, "mArea_ex3",
          "3. The triangle (1, 1), (5, 2), (2, 4) by shoelace: 1·2 − 5·1 = −3, 5·4 − 2·2 = 16, 2·1 − 1·4 = −2. Sum 11, signed area 5.5, positive, so the corners are listed anticlockwise.")}
      </p>

      <H2>{tx(t, "mArea_plotTitle", "A plot of land, by hand")}</H2>
      <p>
        {tx(t, "mArea_plotBody",
          "A surveyor measures the four corner posts of a field, in metres from a reference post: P₁ = (0, 0), P₂ = (8, 0), P₃ = (10, 6), P₄ = (2, 5), listed in order around the edge. No side is parallel to another, so none of the basic formulas fits directly, but the shoelace formula does. Write one row per edge, including the closing edge from P₄ back to P₁, and compute the crosswise term xᵢ · yᵢ₊₁ − xᵢ₊₁ · yᵢ for each.")}
      </p>
      <LessonTable
        headers={[tx(t, "mArea_tEdge", "Edge"), tx(t, "mArea_tCross", "xᵢ · yᵢ₊₁ − xᵢ₊₁ · yᵢ"), tx(t, "mArea_tTerm", "Term")]}
        rows={[
          ["P₁ → P₂", "0 · 0 − 8 · 0", "0"],
          ["P₂ → P₃", "8 · 6 − 10 · 0", "48"],
          ["P₃ → P₄", "10 · 5 − 2 · 6", "38"],
          [tx(t, "mArea_closing", "P₄ → P₁ (closing edge)"), "2 · 0 − 0 · 5", "0"],
          [tx(t, "mArea_sumRow", "sum"), "", "86"],
        ]}
      />
      <p>
        {tx(t, "mArea_plotResult",
          "Half the sum is 86 ÷ 2 = 43, so the field covers 43 m², and the positive sign says the posts were listed anticlockwise. A check by cutting: draw the rectangle 0 ≤ x ≤ 10, 0 ≤ y ≤ 6 around the field; its area is 10 · 6 = 60 m². Three pieces of it lie outside the field. On the right, the triangle (8, 0), (10, 0), (10, 6) has area ½ · 2 · 6 = 6. On top, the triangle (2, 5), (10, 6), (2, 6) has area ½ · 8 · 1 = 4. On the left, the trapezoid (0, 0), (2, 5), (2, 6), (0, 6) has parallel sides 6 and 1 and width 2, so its area is ½ · (6 + 1) · 2 = 7. And 60 − 6 − 4 − 7 = 43 ✓. The cutting took three shapes and some care; the shoelace table took four multiplications per row. Listing the same posts clockwise (P₁, P₄, P₃, P₂) gives −86 and −43: the same area with the opposite sign.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mArea_crossWarn", "The shoelace formula assumes a simple polygon: an outline that never crosses itself. A figure-eight shape gives the difference of its two loops' areas (one counts as positive, the other as negative), which is not the area anyone wanted.")}
      </Callout>

      <H2>{tx(t, "mArea_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mArea_tWrong", "Wrong"), tx(t, "mArea_tRight", "Right"), tx(t, "mArea_tWhy", "Why")]}
        rows={[
          [tx(t, "mArea_m1w", "using the slanted side as the height"), tx(t, "mArea_m1r", "use the perpendicular distance"), tx(t, "mArea_m1", "leaning a shape does not add area")],
          [tx(t, "mArea_m2w", "triangle area b · h"), "½ · b · h", tx(t, "mArea_m2", "a triangle is half a parallelogram")],
          [tx(t, "mArea_m3w", "1 m² = 100 cm²"), "1 m² = 10 000 cm²", tx(t, "mArea_m3", "convert both lengths: 100 × 100")],
          [tx(t, "mArea_m4w", "doubling size doubles area"), tx(t, "mArea_m4r", "it multiplies area by 4"), tx(t, "mArea_m4", "area scales with k²")],
          [tx(t, "mArea_m5w", "adding cut lines to the perimeter"), tx(t, "mArea_m5r", "only the outer boundary counts"), tx(t, "mArea_m5", "perimeter is the walk around the outside")],
          [tx(t, "mArea_m6w", "forgetting the last edge Pₙ → P₁"), tx(t, "mArea_m6r", "always include the edge back to the start"), tx(t, "mArea_m6", "the outline must be closed")],
        ]}
      />

      <KeyIdeas t={t} id="mArea" items={[
        "Perimeter is the length around (length units); area is the unit squares inside (squared units).",
        "Rectangle b · h; parallelogram b · h; triangle ½ · b · h; trapezoid ½ · (a + b) · h.",
        "The height is always perpendicular to the base.",
        "Composite shapes: add the pieces or subtract the missing parts.",
        "Scaling by k multiplies perimeter by k and area by k²; the same goes for unit conversions.",
        "Shoelace: A = ½ Σ (xᵢyᵢ₊₁ − xᵢ₊₁yᵢ); its sign tells anticlockwise (+) from clockwise (−).",
      ]} />
    </Article>
  );
}
