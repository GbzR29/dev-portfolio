"use client";

// Geometry 8: coordinate geometry and conics — the midpoint and points along
// a segment, lines in point-slope and general form, parallel and
// perpendicular slopes, the circle's equation and completing the square,
// line against circle, and the conics (parabola, ellipse, hyperbola) from
// their distance definitions, with eccentricity, and line against circle by hand.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CoordFigure } from "@/components/lesson/figures/math/CoordFigure";
import { ConicFigure } from "@/components/lesson/figures/math/ConicFigure";

const r = String.raw;

// ── Live formula: inside, on or outside a circle ──────────────────────────────

const num = (v: number) => String(Math.round(v * 100) / 100).replace("-", "−");
const sub = (v: number, c: number) => (c < 0 ? `${num(v)} + ${num(-c)}` : `${num(v)} - ${num(c)}`);

function insideNumbers(v: Record<string, number>, t: TrackTranslations) {
  const H = 2, K = -1;                                  // the example's centre
  const lhs = (v.x - H) ** 2 + (v.y - K) ** 2, rr = v.r * v.r;
  const [rel, where] = lhs < rr - 1e-9 ? ["<", tx(t, "mAn_liveIn", "inside")] : lhs > rr + 1e-9 ? [">", tx(t, "mAn_liveOut", "outside")] : ["=", tx(t, "mAn_liveOn", "on the circle")];
  return { tex: r`(${sub(v.x, H)})^2 + (${sub(v.y, K)})^2 = ${num(lhs)} \;${rel}\; ${num(v.r)}^2 = ${num(rr)} \;\Rightarrow\; \green{\text{${where}}}` };
}

export function AnalyticContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAn_intro",
          "In 1637 René Descartes joined the two halves of mathematics: put a grid on the plane, and every point becomes a pair of numbers and every shape an equation. Geometry questions (do these lines meet? is this point inside the circle?) become algebra questions you can settle with a pencil, and algebra gets pictures in return. This chapter collects the tools: points between points, lines and their slopes, the circle as an equation, and the four curves the Greeks got by slicing a cone.")}
      </Lead>

      <H2>{tx(t, "mAn_midTitle", "Points between points")}</H2>
      <p>
        {tx(t, "mAn_midBody",
          "The midpoint of a segment from A = (x₁, y₁) to B = (x₂, y₂) is found one coordinate at a time: its x is halfway between x₁ and x₂, which is their average, and likewise for y. More generally, the point a fraction t of the way from A to B starts at A and adds t times the step B − A; this is the lerp of the ratios chapter, applied to both coordinates. t = 0 gives A, t = 1 gives B, t = ½ gives the midpoint.")}
      </p>
      <Equation label={tx(t, "mAn_eqMid", "Midpoint and a point along a segment")}
        where={[
          [r`(x_1, y_1),\ (x_2, y_2)`, tx(t, "mAn_wAB", "the two end points A and B")],
          [r`M`, tx(t, "mAn_wM", "the midpoint, the average of the end points")],
          [r`t`, tx(t, "mAn_wT", "the fraction of the way from A to B, usually between 0 and 1")],
        ]}
        words={tx(t, "mAn_midWords", "The midpoint is the average of the two points, one coordinate at a time. To go a fraction t of the way, start at the first point and add t times the step to the second.")}
        note={tx(t, "mAn_midNote", "Example: A = (−4, −2), B = (3, 2): M = (−0.5, 0). A quarter of the way, t = 0.25: (−4 + 0.25 · 7, −2 + 0.25 · 4) = (−2.25, −1).")}>
        {r`M = \left(\frac{x_1 + x_2}{2},\ \frac{y_1 + y_2}{2}\right) \qquad P(t) = \big(x_1 + t\,(x_2 - x_1),\ y_1 + t\,(y_2 - y_1)\big)`}
      </Equation>

      <CoordFigure t={t} />

      <H2>{tx(t, "mAn_lineTitle", "Equations of a line")}</H2>
      <p>
        {tx(t, "mAn_lineBody",
          "The functions chapter wrote a line as y = mx + b, with slope m (rise over run) and intercept b. Two other forms are often handier. The point-slope form writes the line through a known point (x₁, y₁) with slope m directly, with nothing to solve. The general form ax + by = c can describe every line, including vertical ones like x = 3, which have no slope (the run is zero) and so cannot be written as y = mx + b at all. Geometry code prefers the general form for that reason.")}
      </p>
      <Equation label={tx(t, "mAn_eqLine", "Three forms of a line")}
        where={[
          [r`m`, tx(t, "mAn_wSlope", "the slope, (y₂ − y₁)/(x₂ − x₁)")],
          [r`(x_1, y_1)`, tx(t, "mAn_wPt", "any point the line passes through")],
          [r`a,\ b,\ c`, tx(t, "mAn_wGen", "numbers that fix the line; b = 0 gives a vertical line, a = 0 a horizontal one")],
        ]}
        note={tx(t, "mAn_lineNote", "Example: the line through (1, 3) with slope 2 is y − 3 = 2(x − 1), which is y = 2x + 1, which is 2x − y = −1.")}>
        {r`y = m x + b \qquad y - y_1 = m\,(x - x_1) \qquad a x + b y = c`}
      </Equation>

      <H3>{tx(t, "mAn_parTitle", "Parallel and perpendicular slopes")}</H3>
      <p>
        {tx(t, "mAn_parBody",
          "Parallel lines climb at the same rate, so they have equal slopes (and different intercepts, or they would be the same line). Perpendicular lines are subtler. Take a step along a line: run across and rise up. Turn that step a quarter turn: the run becomes the rise, and the rise becomes a run in the opposite direction, so the new step is (−rise, run), and the new line is perpendicular. The second mode of the figure shows the two little triangles; they are congruent, just turned. The new slope is run/(−rise), the negative reciprocal of the old one.")}
      </p>
      <Equation label={tx(t, "mAn_eqPerp", "Parallel and perpendicular")}
        where={[
          [r`m_1,\ m_2`, tx(t, "mAn_wM12", "the slopes of the two lines")],
          [r`-\tfrac{1}{m_1}`, tx(t, "mAn_wNegRec", "the negative reciprocal: flip the fraction and change the sign")],
        ]}
        words={tx(t, "mAn_perpWords", "Parallel lines have the same slope. A perpendicular line has the slope flipped upside down and with the opposite sign, so the two slopes multiply to −1.")}
        note={tx(t, "mAn_perpNote", "Example: a wall along y = ½x + 1 has slope ½, so a line straight out of the wall has slope −2. Check: ½ · (−2) = −1. Horizontal and vertical lines are perpendicular too, but the rule breaks there because a vertical line has no slope.")}>
        {r`\text{parallel: } m_1 = m_2 \qquad \text{perpendicular: } m_2 = -\frac{1}{m_1} \iff m_1\,m_2 = -1`}
      </Equation>

      <H2>{tx(t, "mAn_circTitle", "The circle as an equation")}</H2>
      <p>
        {tx(t, "mAn_circBody",
          "A circle is every point at distance r from its centre (h, k). Write that with the distance formula, √((x − h)² + (y − k)²) = r, and square both sides to drop the root. The result is the circle's equation: a point (x, y) is on the circle exactly when it makes the equation true, inside when the left side is smaller, outside when it is larger.")}
      </p>
      <Equation label={tx(t, "mAn_eqCirc", "Circle with centre (h, k) and radius r")}
        where={[
          [r`(h, k)`, tx(t, "mAn_wHK", "the centre")],
          [r`r`, tx(t, "mAn_wR", "the radius; the right side is r², not r")],
          [r`x - h`, tx(t, "mAn_wXH", "how far the point is from the centre horizontally, as in the distance formula")],
        ]}
        words={tx(t, "mAn_circWords", "A point is on the circle when its squared distance from the centre equals the squared radius.")}
        note={tx(t, "mAn_circNote", "Example: centre (2, −1), radius 3: (x − 2)² + (y + 1)² = 9. Is (4, 1) inside? (2)² + (2)² = 8 < 9, yes, just.")}>
        {r`(x - h)^2 + (y - k)^2 = r^2`}
      </Equation>
      <LiveFormula label={tx(t, "mAn_liveCirc", "Try it: inside or outside? (centre (2, −1))")}
        tex={r`(x - 2)^2 + (y + 1)^2 \;\lesseqgtr\; r^2`}
        vars={[
          { id: "x", label: "x", min: -6, max: 8, step: 0.5, value: 4, fmt: num },
          { id: "y", label: "y", min: -6, max: 6, step: 0.5, value: 1, fmt: num },
          { id: "r", label: tx(t, "mAn_liveR", "radius r"), min: 0.5, max: 6, step: 0.5, value: 3, fmt: num },
        ]}
        compute={v => insideNumbers(v, t)}
        note={tx(t, "mAn_liveCircNote", "No square root needed: compare the squared distance with r². Try (5, −1) with r = 3: exactly on the circle, straight to the right of the centre.")} />
      <H3>{tx(t, "mAn_csTitle", "Reading a circle from an expanded equation")}</H3>
      <p>
        {tx(t, "mAn_csBody",
          "Multiplied out, a circle's equation looks like x² + y² + Dx + Ey + F = 0, and the centre and radius are hidden. Completing the square, from the quadratics chapter, brings them back: group the x terms and the y terms, add the square of half each linear coefficient to both sides, and fold each group into a square.")}
      </p>
      <Derivation t={t} label={tx(t, "mAn_eqCs", "Completing the square twice")}
        steps={[
          { full: true, tex: r`x^2 - 6x + y^2 + 4y = 3`, why: tx(t, "mAn_cs1", "the expanded equation; group x terms and y terms") },
          { full: true, tex: r`(x^2 - 6x + \amber{9}) + (y^2 + 4y + \amber{4}) = 3 + \amber{9} + \amber{4}`, why: tx(t, "mAn_cs2", "half of −6 is −3, squared 9; half of 4 is 2, squared 4; add both to both sides") },
          { full: true, tex: r`(x - 3)^2 + (y + 2)^2 = 16`, why: tx(t, "mAn_cs2b", "each group is now a perfect square: x² − 6x + 9 = (x − 3)², y² + 4y + 4 = (y + 2)²") },
          { full: true, tex: r`\green{\text{${tx(t, "mAn_csCentre", "centre")}}\ (3, -2), \quad r = \sqrt{16} = 4}`, why: tx(t, "mAn_cs3", "centre (3, −2), radius √16 = 4") },
        ]} />
      <H3>{tx(t, "mAn_lcTitle", "Where a line meets a circle")}</H3>
      <p>
        {tx(t, "mAn_lcBody",
          "To intersect two shapes, solve their equations together, as in the systems chapter. Substitute the line y = mx + b into the circle's equation: y disappears and a quadratic in x is left. Its discriminant (the part under the square root of the quadratic formula) answers the geometric question before any root is taken: positive means two crossings, zero means the line just touches the circle (a tangent), negative means it misses. The third mode of the figure computes all of it live. Ray tracers do exactly this for every ray and every sphere.")}
      </p>

      <H2>{tx(t, "mAn_conicTitle", "Conic sections")}</H2>
      <p>
        {tx(t, "mAn_conicBody",
          "Slice a double cone (two ice-cream cones point to point) with a flat plane. A cut straight across gives a circle. Tilt the plane a little and the circle stretches into an ellipse. Tilt it until it is parallel to the side of the cone and the curve never closes: a parabola. Tilt it further, steep enough to cut both halves of the cone, and you get a hyperbola with two branches. The Greeks studied these conic sections 2000 years before anyone knew that planets move on ellipses and thrown stones on parabolas. Each one has a simple definition in terms of distances, which is how the figure below draws them.")}
      </p>

      <ConicFigure t={t} />

      <H3>{tx(t, "mAn_parabTitle", "The parabola: focus and directrix")}</H3>
      <p>
        {tx(t, "mAn_parabBody",
          "A parabola is every point as far from a fixed point, the focus, as from a fixed line, the directrix. Put the focus at (0, p) and the directrix at y = −p. A point (x, y) is at distance √(x² + (y − p)²) from the focus and y + p from the line. Setting them equal and squaring leaves x² − 2py = 2py after the y² and p² cancel, so y = x²/(4p). That is the familiar parabola y = ax² of the quadratics chapter, with a = 1/(4p): every such graph has a focus. Its reflecting property, rays parallel to the axis bounce into the focus, is why satellite dishes, telescope mirrors and car headlights are parabolic.")}
      </p>
      <Derivation t={t} label={tx(t, "mAn_eqParab", "Parabola with focus (0, p) and directrix y = −p")}
        where={[
          [r`p`, tx(t, "mAn_wP", "the distance from the vertex to the focus (and to the directrix)")],
          [r`\sqrt{x^2 + (y - p)^2}`, tx(t, "mAn_wPF", "the distance from (x, y) to the focus")],
          [r`y + p`, tx(t, "mAn_wPD", "the distance from (x, y) down to the directrix")],
        ]}
        steps={[
          { full: true, tex: r`\sqrt{x^2 + (y - p)^2} = y + p`, why: tx(t, "mAn_pa1", "distance to the focus = distance to the directrix") },
          { full: true, tex: r`x^2 + (y - p)^2 = (y + p)^2`, why: tx(t, "mAn_pa2", "square both sides to drop the root (both sides are distances, never negative)") },
          { full: true, tex: r`x^2 + y^2 - 2py + p^2 = y^2 + 2py + p^2`, why: tx(t, "mAn_pa3", "expand both squares") },
          { full: true, tex: r`x^2 = 4py`, why: tx(t, "mAn_pa4", "y² and p² cancel; add 2py to both sides") },
          { full: true, tex: r`\green{y = \frac{x^2}{4p}}`, why: tx(t, "mAn_pa5", "divide both sides by 4p") },
        ]} />

      <H3>{tx(t, "mAn_ellTitle", "The ellipse: two foci, a constant sum")}</H3>
      <p>
        {tx(t, "mAn_ellBody",
          "An ellipse is every point whose distances to two foci add up to the same length, 2a. Pin a loop of string at the foci and trace it with a pencil. With the foci at (±c, 0), the widest point is at x = ±a (the semi-major axis, half the width) and the tallest at y = ±b (the semi-minor axis). At the top, the string runs from each focus up to (0, b), two equal pieces of length a, so c² + b² = a² by Pythagoras. The equation is a circle's equation with x measured in units of a and y in units of b: an ellipse is a circle stretched by different amounts in each direction.")}
      </p>
      <Equation label={tx(t, "mAn_eqEll", "Ellipse centred at the origin")}
        where={[
          [r`a`, tx(t, "mAn_wEa", "the semi-major axis: half the width, and half the string's constant sum")],
          [r`b`, tx(t, "mAn_wEb", "the semi-minor axis: half the height")],
          [r`c`, tx(t, "mAn_wEc", "the distance from the centre to each focus")],
        ]}
        words={tx(t, "mAn_ellWords", "An ellipse is a circle with x measured in units of a and y in units of b; the foci sit c from the centre, where c² = a² − b².")}
        note={tx(t, "mAn_ellNote", "Example: a = 5, b = 3 gives c = √(25 − 9) = 4, foci at (±4, 0). The point (3, 2.4) is on it: 9/25 + 5.76/9 = 0.36 + 0.64 = 1. With a = b the foci merge (c = 0) and the ellipse is a circle.")}>
        {r`\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 \qquad c^2 = a^2 - b^2`}
      </Equation>

      <H3>{tx(t, "mAn_hypTitle", "The hyperbola: a constant difference")}</H3>
      <p>
        {tx(t, "mAn_hypBody",
          "A hyperbola is every point whose distances to two foci differ by the same amount, 2a. It has two branches, one hugging each focus. Its equation is the ellipse's with a minus sign, and now c² = a² + b² since the foci lie outside the curve. Far from the centre each branch approaches a straight line, an asymptote, y = ±(b/a)x, getting ever closer without touching. Timing systems use hyperbolas: a difference in arrival time at two receivers fixes a difference in distance, so the source is on one hyperbola; a third receiver gives a second hyperbola, and the source is where they cross.")}
      </p>
      <Equation label={tx(t, "mAn_eqHyp", "Hyperbola centred at the origin")}
        where={[
          [r`2a`, tx(t, "mAn_wHa", "the constant difference of the distances; the branches cross the x-axis at ±a")],
          [r`c`, tx(t, "mAn_wHc", "the distance from the centre to each focus, now bigger than a")],
          [r`y = \pm\tfrac{b}{a}x`, tx(t, "mAn_wAsym", "the asymptotes, the lines the branches approach")],
        ]}
        words={tx(t, "mAn_hypWords", "The ellipse's equation with a minus sign: two branches instead of a closed loop, and the foci now farther out, c² = a² + b².")}>
        {r`\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1 \qquad c^2 = a^2 + b^2`}
      </Equation>

      <H3>{tx(t, "mAn_eccTitle", "One family: eccentricity")}</H3>
      <p>
        {tx(t, "mAn_eccBody",
          "A single number, the eccentricity e = c/a, sorts the conics: how far the foci are from the centre compared with the size of the curve. The figure shows it for each curve.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAn_tCurve", "Curve"), tx(t, "mAn_tE", "Eccentricity"), tx(t, "mAn_tRule", "Distance rule"), tx(t, "mAn_tWhere", "Where you meet it")]}
        rows={[
          [tx(t, "mAn_c1", "circle"), "e = 0", tx(t, "mAn_c1r", "fixed distance to one point"), tx(t, "mAn_c1w", "wheels, radii, ripples")],
          [tx(t, "mAn_c2", "ellipse"), "0 < e < 1", tx(t, "mAn_c2r", "sum to two foci is constant"), tx(t, "mAn_c2w", "planet orbits, circles seen at an angle, whispering galleries")],
          [tx(t, "mAn_c3", "parabola"), "e = 1", tx(t, "mAn_c3r", "focus distance = directrix distance"), tx(t, "mAn_c3w", "thrown objects, dishes, headlights")],
          [tx(t, "mAn_c4", "hyperbola"), "e > 1", tx(t, "mAn_c4r", "difference to two foci is constant"), tx(t, "mAn_c4w", "fly-by trajectories, locating by time difference")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mAn_circleInfo", "A circle seen at an angle looks like an ellipse. That is why the rim of a cup, a round table in a photo and a coin tilted in your hand all look like ellipses, and why drawings of cylinders show their tops that way.")}
      </Callout>

      <H2>{tx(t, "mAn_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mAn_ex1",
          "1. Does the line y = x + 1 hit the circle x² + y² = 4? Substitute: x² + (x + 1)² = 4, so 2x² + 2x − 3 = 0. Discriminant 4 + 24 = 28 > 0: two crossings, at x = (−2 ± √28)/4 ≈ 0.82 and −1.82.")}
      </p>
      <p>
        {tx(t, "mAn_ex2",
          "2. An oval flower bed is an ellipse 12 m long and 6 m wide, so a = 6 and b = 3. A point (x, y), measured from the centre of the bed, is inside when x²/36 + y²/9 ≤ 1. Is a sprinkler at (4, 2) inside? 16/36 + 4/9 = 4/9 + 4/9 = 8/9 ≤ 1, yes. At (5, 2): 25/36 + 16/36 = 41/36 > 1, just outside.")}
      </p>
      <p>
        {tx(t, "mAn_ex3",
          "3. A dish has the shape y = x²/8. Then 4p = 8, so p = 2: the receiver belongs 2 units above the bottom of the dish.")}
      </p>

      <H2>{tx(t, "mAn_lcHandTitle", "Line against circle: the three cases by hand")}</H2>
      <p>
        {tx(t, "mAn_lcHandBody",
          "Take the circle x² + y² = 25 (centre at the origin, radius 5) and three lines. The steps are the same every time: substitute the line's y into the circle, expand, collect everything on one side to get a quadratic ax² + bx + c = 0, and look at its discriminant b² − 4ac. Positive means two crossings, zero means the line just touches (a tangent), negative means it misses.")}
      </p>
      <LessonTable
        headers={[tx(t, "mAn_tLine", "Line"), tx(t, "mAn_tSub", "Substitute and collect"), tx(t, "mAn_tDisc", "b² − 4ac"), tx(t, "mAn_tMeet", "Meeting points")]}
        rows={[
          ["y = x + 1", "x² + (x + 1)² = 25 → 2x² + 2x − 24 = 0 → x² + x − 12 = 0", "1 + 48 = 49 > 0", tx(t, "mAn_meet1", "(x + 4)(x − 3) = 0: (3, 4) and (−4, −3)")],
          ["y = 5", "x² + 25 = 25 → x² = 0", "0", tx(t, "mAn_meet2", "one point, (0, 5): the line is tangent")],
          ["y = x + 10", "x² + (x + 10)² = 25 → 2x² + 20x + 75 = 0", "400 − 600 = −200 < 0", tx(t, "mAn_meet3", "none: the line passes outside")],
        ]}
      />
      <p>
        {tx(t, "mAn_lcHandCheck",
          "Always check an answer in both equations. (3, 4): 3² + 4² = 9 + 16 = 25 ✓ and 4 = 3 + 1 ✓. (−4, −3): 16 + 9 = 25 ✓ and −3 = −4 + 1 ✓. The tangent case also matches the tangent rule from the circle chapter: the radius to (0, 5) is vertical and the line y = 5 is horizontal, so they are perpendicular.")}
      </p>

      <H2>{tx(t, "mAn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mAn_tWrong", "Wrong"), tx(t, "mAn_tRight", "Right"), tx(t, "mAn_tWhy", "Why")]}
        rows={[
          [tx(t, "mAn_m1w", "(x − 2)² + (y + 1)² = 9 has centre (−2, 1)"), tx(t, "mAn_m1r", "centre (2, −1)"), tx(t, "mAn_m1", "the equation subtracts the centre; the signs flip")],
          [tx(t, "mAn_m2w", "radius 9 from … = 9"), tx(t, "mAn_m2r", "radius √9 = 3"), tx(t, "mAn_m2", "the right side is r²")],
          [tx(t, "mAn_m3w", "perpendicular slope of 2 is −2"), tx(t, "mAn_m3r", "it is −½"), tx(t, "mAn_m3", "negative reciprocal: flip and change sign")],
          [tx(t, "mAn_m4w", "writing a vertical line as y = mx + b"), tx(t, "mAn_m4r", "x = c, or ax + by = c with b = 0"), tx(t, "mAn_m4", "its slope would be a division by zero")],
          [tx(t, "mAn_m5w", "ellipse: c² = a² + b²"), tx(t, "mAn_m5r", "ellipse c² = a² − b², hyperbola c² = a² + b²"), tx(t, "mAn_m5", "an ellipse's foci are inside it, so c < a")],
        ]}
      />

      <KeyIdeas t={t} id="mAn" items={[
        "Midpoint: average the coordinates; a fraction t along: A + t(B − A).",
        "Lines: y = mx + b, y − y₁ = m(x − x₁), or ax + by = c (handles vertical lines).",
        "Parallel slopes are equal; perpendicular slopes multiply to −1.",
        "Circle: (x − h)² + (y − k)² = r²; complete the square to read centre and radius.",
        "Line against circle is a quadratic; the discriminant counts the crossings.",
        "Parabola: focus = directrix distance; ellipse: constant sum; hyperbola: constant difference.",
        "Eccentricity e = c/a: 0 circle, < 1 ellipse, 1 parabola, > 1 hyperbola.",
      ]} />
    </Article>
  );
}
