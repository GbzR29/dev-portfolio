"use client";

// Geometry 6: circles and π — the definition and the named parts, why C/d is
// the same for every circle, π by unrolling and by Archimedes' polygons, the
// area πr² by rearranging slices and by throwing darts (Monte Carlo), arcs and
// sectors, tangents and the angle in a semicircle, and circle code in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CircleFigure } from "@/components/lesson/figures/math/CircleFigure";
import { PiFigure } from "@/components/lesson/figures/math/PiFigure";
import { PiAreaFigure } from "@/components/lesson/figures/math/PiAreaFigure";

const r = String.raw;

export function CircleContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mCir_intro",
          "Wheels, explosions, detection radii, round buttons, orbiting moons, the ripples on a pond: circles are everywhere in games. Measuring them needs one special number, π, which is not a formula anyone invented but a fact about every circle that exists. This chapter makes π visible four different ways (rolling a wheel, squeezing it between polygons, cutting a pizza, throwing darts) and then puts it to work.")}
      </Lead>

      <H2>{tx(t, "mCir_defTitle", "What a circle is")}</H2>
      <p>
        {tx(t, "mCir_defBody",
          "Pick a point, the centre O, and a distance r, the radius. The circle is every point whose distance from O is exactly r: nothing more, nothing less. That definition, together with the distance formula from the Pythagoras chapter, is all a computer needs to decide whether a point is on a circle, inside it (distance less than r) or outside it (more than r). Strictly, \"circle\" means only the curve; the flat region inside it is a disc. Everyday language uses \"circle\" for both, and so will this chapter when the meaning is clear.")}
      </p>
      <LessonTable
        headers={[tx(t, "mCir_tPart", "Part"), tx(t, "mCir_tMeans", "What it is")]}
        rows={[
          [tx(t, "mCir_p1", "radius r"), tx(t, "mCir_p1d", "a segment from the centre to the circle, and its length")],
          [tx(t, "mCir_p2", "diameter d"), tx(t, "mCir_p2d", "a chord through the centre: two radii in a line, so d = 2r")],
          [tx(t, "mCir_p3", "circumference C"), tx(t, "mCir_p3d", "the length all the way round: the circle's perimeter")],
          [tx(t, "mCir_p4", "chord"), tx(t, "mCir_p4d", "a segment joining two points of the circle; the diameter is the longest one")],
          [tx(t, "mCir_p5", "arc"), tx(t, "mCir_p5d", "a piece of the circle between two of its points")],
          [tx(t, "mCir_p6", "sector"), tx(t, "mCir_p6d", "a slice of the disc between two radii and an arc, like a slice of pizza")],
          [tx(t, "mCir_p7", "tangent"), tx(t, "mCir_p7d", "a line that touches the circle at exactly one point")],
        ]}
      />

      <CircleFigure t={t} />

      <H2>{tx(t, "mCir_piTitle", "π: the same ratio for every circle")}</H2>
      <p>
        {tx(t, "mCir_piBody",
          "All circles are similar: scaling one about its centre by a factor k (the dilation from the similarity chapter) turns it into any other circle, with radius kr. A length such as the circumference is multiplied by k and so is the diameter, so their ratio does not change. Every circle, from a coin to the orbit of the Earth, has the same circumference-to-diameter ratio. That ratio is called π (the Greek letter pi). The first mode of the figure measures it directly by rolling a wheel along a ruler marked in diameters.")}
      </p>
      <Equation label={tx(t, "mCir_eqC", "Circumference")}
        where={[
          [r`C`, tx(t, "mCir_wC", "the circumference, the distance round the circle")],
          [r`d,\ r`, tx(t, "mCir_wDR", "the diameter and the radius, with d = 2r")],
          [r`\pi`, tx(t, "mCir_wPi", "C divided by d, the same for every circle: 3.14159265…")],
        ]}
        note={tx(t, "mCir_cNote", "Example: a wheel of diameter 0.7 m travels π · 0.7 ≈ 2.2 m each time it turns once. A circle of radius 10 has a circumference of 2π · 10 ≈ 62.8.")}>
        {r`\pi = \frac{C}{d} \quad\Longrightarrow\quad C = \pi d = 2\pi r`}
      </Equation>

      <PiFigure t={t} />

      <H3>{tx(t, "mCir_archTitle", "Squeezing π between polygons")}</H3>
      <p>
        {tx(t, "mCir_archBody",
          "Rolling a wheel is a measurement, and measurements are never exact. Archimedes found a way to calculate π instead, using only Pythagoras and similar triangles. Take a circle of radius 1 (diameter 2). A regular hexagon fits exactly inside it: it is made of six equilateral triangles meeting at the centre, so each side is 1, and its perimeter 6 is shorter than the circle. So C > 6, and π = C/2 > 3. A slightly bigger hexagon drawn outside, touching the circle at the middle of each side, has a longer perimeter than the circle and gives an upper bound. Then double the number of sides and repeat. The second mode of the figure shows the squeeze.")}
      </p>
      <p>
        {tx(t, "mCir_doubleBody",
          "The doubling step is one piece of Pythagoras. A side s of the inside polygon is a chord. From the centre to the middle of that chord is a distance a, and half the chord, s/2, and the radius 1 form a right triangle, so a = √(1 − (s/2)²). The point of the circle straight past the middle of the chord is at distance 1 − a from it. The new side joins that point to an end of the old chord; it is the hypotenuse of a triangle with legs s/2 and 1 − a. Squaring and simplifying (a² = 1 − s²/4 cancels the s²/4) gives a formula that uses only square roots. For the outside polygon, enlarge the inside one about the centre until its sides touch the circle: the centre-to-side distance goes from a to 1, so by similarity every side is multiplied by 1/a.")}
      </p>
      <Equation label={tx(t, "mCir_eqArch", "Archimedes' doubling (radius 1)")}
        where={[
          [r`s_n`, tx(t, "mCir_wSn", "the side of the inside polygon with n sides; the hexagon has s₆ = 1")],
          [r`a = \sqrt{1 - (s_n/2)^2}`, tx(t, "mCir_wA", "the distance from the centre to the middle of a side")],
          [r`t_n = s_n / a`, tx(t, "mCir_wTn", "the side of the outside polygon, by similar triangles")],
          [r`n\,s_n/2,\ n\,t_n/2`, tx(t, "mCir_wBounds", "perimeter over diameter for each polygon: a lower and an upper bound for π")],
        ]}
        note={tx(t, "mCir_archNote", "Hexagon: 3 < π < 3.4641. With 96 sides: 3.1410 < π < 3.1427. Archimedes, doing the square roots by hand, reached 3 10/71 < π < 3 1/7, that is 3.1408 < π < 3.1429.")}>
        {r`s_{2n} = \sqrt{\left(\tfrac{s_n}{2}\right)^2 + (1 - a)^2} = \sqrt{2 - \sqrt{4 - s_n^2}}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "mCir_irrInfo", "π is irrational: its decimals never end and never repeat, so no fraction equals it exactly (that was proved in 1761). Good fractions exist: 22/7 = 3.1428… is off by 0.04%, and 355/113 = 3.14159292… is right to six decimals. In code, never type 3.14; use the library constant, which is correct to the last bit of a double.")}
      </Callout>

      <H2>{tx(t, "mCir_areaTitle", "The area of a circle: πr²")}</H2>
      <p>
        {tx(t, "mCir_areaBody",
          "The area chapter found areas by cutting shapes up and moving the pieces. A circle can be treated the same way. Cut it into many equal slices, like a pizza, and lay them in a row, alternating point up and point down. Half the slices carry half the crust along the top, and the other half along the bottom, so the row is half the circumference long: ½ · 2πr = πr. Each slice is a radius long, so the row is r tall. The more slices, the straighter the crust and the closer the row is to a rectangle πr wide and r tall. Its area, and therefore the circle's, is πr · r = πr².")}
      </p>
      <Equation label={tx(t, "mCir_eqA", "Area of a disc")}
        where={[
          [r`A`, tx(t, "mCir_wArea", "the area inside the circle")],
          [r`r^2`, tx(t, "mCir_wR2", "the radius squared: the area of a square with side r")],
        ]}
        note={tx(t, "mCir_aNote", "So a circle covers π ≈ 3.14 of the squares built on its radius. The square that just holds the circle has side 2r and area 4r², and the circle fills π/4 ≈ 78.5% of it. Example: a 12-inch pizza (r = 6) has 36π ≈ 113 square inches; two 8-inch pizzas (r = 4) have 2 · 16π ≈ 100.5. The single big one has more.")}>
        {r`A = \underbrace{\pi r}_{\text{width}} \cdot \underbrace{r}_{\text{height}} = \pi r^2`}
      </Equation>

      <PiAreaFigure t={t} />

      <H3>{tx(t, "mCir_mcTitle", "Estimating π with random darts")}</H3>
      <p>
        {tx(t, "mCir_mcBody",
          "The second mode of the figure uses the area in reverse. A circle of radius 1 sits in a 2 × 2 square. Throw darts that land anywhere in the square with equal chance. The fraction that land inside the circle tends to the fraction of the square the circle covers, π/4. Count, multiply by 4, and you have an estimate of π. A dart at (x, y) is inside when x² + y² ≤ 1, the squared-distance test from the Pythagoras chapter. This is a terrible way to compute π, since it improves very slowly, but a brilliant way to compute things that have no formula: renderers estimate the light reaching a pixel by averaging random rays in exactly this way.")}
      </p>

      <H2>{tx(t, "mCir_arcTitle", "Arcs and sectors")}</H2>
      <p>
        {tx(t, "mCir_arcBody",
          "An angle θ at the centre cuts out an arc and a sector. The full circle is 360°, so the angle is the fraction θ/360 of a full turn, and the arc and sector are that same fraction of the circumference and of the area. The sector mode of the parts figure shows it. The Trigonometry section introduces radians, a unit that measures an angle by its arc on a circle of radius 1; with radians these formulas lose the 360 and become simpler.")}
      </p>
      <Equation label={tx(t, "mCir_eqSector", "Arc length and sector area")}
        where={[
          [r`\theta`, tx(t, "mCir_wTheta", "the angle at the centre, in degrees")],
          [r`\tfrac{\theta}{360}`, tx(t, "mCir_wFrac", "the fraction of a full turn")],
          [r`s`, tx(t, "mCir_wS", "the length of the arc")],
          [r`A_\text{sector}`, tx(t, "mCir_wAs", "the area of the slice")],
        ]}
        note={tx(t, "mCir_secNote", "Example: an enemy sees 8 m ahead in a 90° cone. The cone is a quarter sector: its area is ¼ · π · 8² ≈ 50.3 m², and its curved edge is ¼ · 2π · 8 ≈ 12.6 m long.")}>
        {r`s = \frac{\theta}{360} \cdot 2\pi r \qquad A_\text{sector} = \frac{\theta}{360} \cdot \pi r^2`}
      </Equation>

      <H2>{tx(t, "mCir_tanTitle", "Tangents and right angles")}</H2>
      <p>
        {tx(t, "mCir_tanBody",
          "A tangent touches the circle at one point P, and it is always perpendicular to the radius at P. The reason: the radius is the shortest way from the centre to the tangent line (every other point of the line is outside the circle, so further away), and the angles chapter showed that the shortest way from a point to a line is the perpendicular. Games use this constantly: a ball rolling around a circular obstacle moves along the tangent, and a collision with a circle pushes the other object out along the radius, the direction perpendicular to the surface.")}
      </p>
      <H3>{tx(t, "mCir_thalesTitle", "The angle in a semicircle")}</H3>
      <p>
        {tx(t, "mCir_thalesBody",
          "Join the ends A and B of a diameter to any other point P of the circle: the angle at P is always exactly 90°. The third mode of the figure lets you drag P; the note under it has the proof, which uses only isosceles triangles and the 180° angle sum. Turned around, it gives a construction: the circle with diameter AB is exactly the set of points that see AB at a right angle.")}
      </p>

      <H2>{tx(t, "mCir_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mCir_ex1",
          "1. A car wheel has radius 0.3 m. How many turns per second at 20 m/s? One turn covers 2π · 0.3 ≈ 1.885 m, so 20 / 1.885 ≈ 10.6 turns per second. This is how a game spins wheel meshes so they match the car's speed instead of sliding.")}
      </p>
      <p>
        {tx(t, "mCir_ex2",
          "2. An explosion's radius grows from 4 m to 6 m. Its area grows from 16π to 36π, a factor 36/16 = 2.25, because the radius factor 1.5 is squared (the k² law). An upgrade that says \"+50% radius\" is really +125% area.")}
      </p>
      <p>
        {tx(t, "mCir_ex3",
          "3. A round arena has a circumference of 100 m. Its radius is 100 / (2π) ≈ 15.9 m, and its area is π · 15.9² ≈ 796 m².")}
      </p>

      <H2>{tx(t, "mCir_codeTitle", "Circles in C++")}</H2>
      <p>
        {tx(t, "mCir_codeBody",
          "C++20 has π in <numbers> as std::numbers::pi (a double) and std::numbers::pi_v<float>. Before C++20, M_PI from <cmath> is common but not standard. The point test compares squared distances, so it never takes a square root; the Monte Carlo function is the darts figure in a few lines.")}
      </p>
      <CodeBlock lang="cpp" filename="circle.hpp" t={t}>{`#include <numbers>
#include <random>

constexpr float PI = std::numbers::pi_v<float>;

struct Vec2 { float x, y; };
struct Circle { Vec2 c; float r; };

float circumference(const Circle& k) { return 2.0f * PI * k.r; }
float area(const Circle& k)          { return PI * k.r * k.r; }

float arcLength(const Circle& k, float degrees)  { return degrees / 360.0f * 2.0f * PI * k.r; }
float sectorArea(const Circle& k, float degrees) { return degrees / 360.0f * PI * k.r * k.r; }

// Inside or on the circle? Squared distance against squared radius.
bool contains(const Circle& k, Vec2 p) {
    float dx = p.x - k.c.x, dy = p.y - k.c.y;
    return dx * dx + dy * dy <= k.r * k.r;
}

// Estimate pi by throwing n random darts at the square [-1, 1] x [-1, 1]
double estimatePi(int n, unsigned seed = 42) {
    std::mt19937 rng(seed);
    std::uniform_real_distribution<double> u(-1.0, 1.0);
    int inside = 0;
    for (int i = 0; i < n; ++i) {
        double x = u(rng), y = u(rng);
        if (x * x + y * y <= 1.0) ++inside;
    }
    return 4.0 * inside / n;                     // share inside -> pi/4
}`}</CodeBlock>

      <H2>{tx(t, "mCir_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mCir_tWrong", "Wrong"), tx(t, "mCir_tRight", "Right"), tx(t, "mCir_tWhy", "Why")]}
        rows={[
          [tx(t, "mCir_m1w", "using the diameter in πr²"), tx(t, "mCir_m1r", "halve it first: r = d/2"), tx(t, "mCir_m1", "a 10 cm pizza has r = 5, area 25π, not 100π")],
          [tx(t, "mCir_m2w", "mixing up 2πr and πr²"), tx(t, "mCir_m2r", "length: 2πr, area: πr²"), tx(t, "mCir_m2", "an area has a squared length in it; the circumference does not")],
          [tx(t, "mCir_m3w", "double radius, double area"), tx(t, "mCir_m3r", "double radius, four times the area"), tx(t, "mCir_m3", "area scales with r², as with any shape")],
          [tx(t, "mCir_m4w", "πr² written as (πr)²"), tx(t, "mCir_m4r", "only r is squared"), tx(t, "mCir_m4", "order of operations: powers before multiplication")],
          [tx(t, "mCir_m5w", "const float PI = 3.14;"), tx(t, "mCir_m5r", "std::numbers::pi_v<float>"), tx(t, "mCir_m5", "3.14 is wrong in the third decimal and errors pile up in long simulations")],
          [tx(t, "mCir_m6w", "sqrt in a point-in-circle test"), tx(t, "mCir_m6r", "compare dx² + dy² with r²"), tx(t, "mCir_m6", "same answer, no square root")],
        ]}
      />

      <KeyIdeas t={t} id="mCir" items={[
        "A circle is every point at distance r from the centre; d = 2r.",
        "All circles are similar, so C/d is one constant: π ≈ 3.14159.",
        "C = πd = 2πr; A = πr² (slices rearranged into a πr × r rectangle).",
        "Archimedes trapped π between inside and outside polygons using only Pythagoras.",
        "Arc and sector are the fraction θ/360 of the circumference and area.",
        "A tangent is perpendicular to the radius; the angle in a semicircle is 90°.",
        "Point in circle: dx² + dy² ≤ r², no square root.",
      ]} />
    </Article>
  );
}
