"use client";

// Geometry 3: perimeter and area — perimeter, the unit square, rectangle,
// parallelogram, triangle and trapezoid formulas with where they come from,
// composite shapes, how scaling changes perimeter and area (k and k²), unit
// conversion, the shoelace formula with signed area and winding order, and
// polygon area in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { AreaFigure } from "@/components/lesson/figures/math/AreaFigure";
import { ShoelaceFigure } from "@/components/lesson/figures/math/ShoelaceFigure";

const r = String.raw;

export function AreaContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mArea_intro",
          "How much fence does a field need, and how much seed? The first question is about perimeter, the length around a shape; the second is about area, the amount of surface inside it. Games ask the same questions all the time: how long is a patrol route around a room, how big is a region on the map, how much memory does a texture take, which way does a triangle face. This chapter derives the area formulas for the basic shapes instead of just listing them, shows how area behaves when a shape is scaled, and ends with one formula that gives the area of any polygon from its corner coordinates.")}
      </Lead>

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
        ]}>
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
        ]}>
        {r`A_{\text{rect}} = b\,h \qquad A_{\text{square}} = s^2 \qquad A_{\text{para}} = b\,h \qquad A_{\triangle} = \tfrac12\,b\,h \qquad A_{\text{trap}} = \tfrac12\,(a + b)\,h`}
      </Equation>

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
          [r`k`, tx(t, "mArea_wK", "the scale factor; every length is multiplied by k")],
          [r`P,\ A`, tx(t, "mArea_wPA", "perimeter and area before scaling")],
        ]}
        note={tx(t, "mArea_unitNote", "The same law converts units. 1 m = 100 cm, so 1 m² = 100 cm × 100 cm = 10 000 cm², not 100 cm². A 3 m × 2 m floor is 6 m² = 60 000 cm².")}>
        {r`P' = k\,P \qquad A' = k^2\,A`}
      </Equation>

      <H2>{tx(t, "mArea_shoeTitle", "Any polygon: the shoelace formula")}</H2>
      <p>
        {tx(t, "mArea_shoeBody",
          "For a polygon given by the coordinates of its corners (the way a game stores a region, a navmesh cell or a selection lasso) there is one formula that needs no cutting at all. List the corners in order around the outline, P₁ to Pₙ, and wrap around so that after Pₙ comes P₁ again. For each edge, multiply crosswise, xᵢ · yᵢ₊₁ − xᵢ₊₁ · yᵢ, and add up all these terms; the area is half the sum. The name comes from the criss-cross pattern of the multiplications when the coordinates are written in two columns, like the laces of a shoe.")}
      </p>
      <Equation label={tx(t, "mArea_eqShoe", "The shoelace formula")}
        where={[
          [r`(x_i, y_i)`, tx(t, "mArea_wXi", "the coordinates of corner i, listed in order around the polygon")],
          [r`n`, tx(t, "mArea_wN", "the number of corners")],
          [r`i + 1`, tx(t, "mArea_wWrap", "the next corner; after corner n comes corner 1 again")],
          [r`\sum`, tx(t, "mArea_wSum", "add the term for every edge, i = 1 to n")],
          [r`A_{\pm}`, tx(t, "mArea_wSigned", "the signed area: positive if the corners go anticlockwise, negative if clockwise. Its absolute value is the area")],
        ]}
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
          "The sign of the shoelace sum tells you which way the corners go round: positive for anticlockwise, negative for clockwise (with y pointing up; on a screen where y points down, the signs swap). The order the corners are listed in is the winding order. GPUs use exactly this for backface culling: after projecting a triangle to the screen, the sign of its signed area says whether you are looking at its front or its back, and back faces of a closed model are skipped, which saves about half the work. The Linear Algebra section will meet the same crosswise term again as the 2D cross product.")}
      </p>

      <H2>{tx(t, "mArea_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mArea_ex1",
          "1. A triangular sail has a 4 m base and is 6 m tall: A = ½ · 4 · 6 = 12 m². A trapezoidal ramp side has parallel edges 2 m and 5 m, 1.5 m apart: A = ½ · (2 + 5) · 1.5 = 5.25 m².")}
      </p>
      <p>
        {tx(t, "mArea_ex2",
          "2. A game map is 1 km × 1 km and its fog-of-war texture stores one pixel per 2 m × 2 m cell: that is 500 × 500 = 250 000 pixels. Halving the cell size to 1 m doubles each side to 1000 pixels and quadruples the total to 1 000 000.")}
      </p>
      <p>
        {tx(t, "mArea_ex3",
          "3. The triangle (1, 1), (5, 2), (2, 4) by shoelace: 1·2 − 5·1 = −3, 5·4 − 2·2 = 16, 2·1 − 1·4 = −2. Sum 11, signed area 5.5, positive, so the corners are listed anticlockwise.")}
      </p>

      <H2>{tx(t, "mArea_codeTitle", "Polygon area in C++")}</H2>
      <p>
        {tx(t, "mArea_codeBody",
          "The shoelace formula is a single loop. The index (i + 1) % n implements the wrap-around from the last corner back to the first (the % remainder from the divisibility chapter). For a triangle it collapses to one expression, which is the standard way to get a triangle's signed area, and therefore its winding, in 2D.")}
      </p>
      <CodeBlock lang="cpp" filename="area.hpp" t={t}>{`#include <vector>
#include <cmath>

struct Vec2 { float x, y; };

// Signed area: > 0 anticlockwise, < 0 clockwise (y up)
float signedArea(const std::vector<Vec2>& p) {
    float sum = 0.0f;
    const size_t n = p.size();
    for (size_t i = 0; i < n; ++i) {
        const Vec2& a = p[i];
        const Vec2& b = p[(i + 1) % n];      // wraps from the last corner to the first
        sum += a.x * b.y - b.x * a.y;
    }
    return 0.5f * sum;
}

float area(const std::vector<Vec2>& p) { return std::abs(signedArea(p)); }

// The same formula for three corners
float triangleSignedArea(Vec2 a, Vec2 b, Vec2 c) {
    return 0.5f * ((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
}

bool isAnticlockwise(const std::vector<Vec2>& p) { return signedArea(p) > 0.0f; }`}</CodeBlock>
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
          [tx(t, "mArea_m6w", "forgetting the last edge Pₙ → P₁"), tx(t, "mArea_m6r", "wrap with (i + 1) % n"), tx(t, "mArea_m6", "the outline must be closed")],
        ]}
      />

      <KeyIdeas t={t} id="mArea" items={[
        "Perimeter is the length around (length units); area is the unit squares inside (squared units).",
        "Rectangle b · h; parallelogram b · h; triangle ½ · b · h; trapezoid ½ · (a + b) · h.",
        "The height is always perpendicular to the base.",
        "Composite shapes: add the pieces or subtract the missing parts.",
        "Scaling by k multiplies perimeter by k and area by k²; the same goes for unit conversions.",
        "Shoelace: A = ½ Σ (xᵢyᵢ₊₁ − xᵢ₊₁yᵢ); its sign is the winding order, used for backface culling.",
      ]} />
    </Article>
  );
}
