"use client";

// Algebra 6: quadratics — the parabola and what a, b, c do, vertex form,
// solving by square roots, by factoring and by completing the square, the
// quadratic formula and the discriminant, sum and product of the roots,
// building a quadratic from its roots, and projectile and area problems.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { QuadraticFigure } from "@/components/lesson/figures/math/QuadraticFigure";
import { CompleteSquareFigure } from "@/components/lesson/figures/math/CompleteSquareFigure";

const r = String.raw;

export function QuadraticsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mQuad_intro",
          "Linear equations describe things that change at a constant rate. The moment something accelerates, a thrown ball, a falling stone, a car braking, the unknown appears squared, and you have a quadratic. Quadratics also appear whenever two unknown lengths multiply, as in the area of a rectangle. This chapter explains the shape of their graphs, three ways to solve them, where the famous formula comes from, and how the roots are tied to the coefficients.")}
      </Lead>

      <H2>{tx(t, "mQuad_formTitle", "The standard form and the parabola")}</H2>
      <p>
        {tx(t, "mQuad_formBody",
          "A quadratic expression has a squared term as its highest power: ax² + bx + c, with a ≠ 0 (if a were 0 it would be linear). Its graph y = ax² + bx + c is a parabola, a symmetric U shape. The simplest one, y = x², has its lowest point at the origin and rises equally on both sides, because (−x)² = x². Every other parabola is that same curve moved and stretched, using the transformations of the functions chapter.")}
      </p>
      <Equation label={tx(t, "mQuad_eqStd", "Standard form")}
        where={[
          [r`a`, tx(t, "mQuad_wA", "the shape: a > 0 opens upward (a valley, it has a minimum), a < 0 opens downward (a hill, a maximum). A larger |a| is narrower")],
          [r`b`, tx(t, "mQuad_wB", "together with a, sets where the vertex is left or right: its x is −b/(2a)")],
          [r`c`, tx(t, "mQuad_wC", "the value at x = 0, where the parabola crosses the y axis")],
        ]}>
        {r`y = a\,x^2 + b\,x + c \qquad (a \neq 0)`}
      </Equation>

      <H3>{tx(t, "mQuad_vertexTitle", "Vertex form")}</H3>
      <p>
        {tx(t, "mQuad_vertexBody",
          "The same parabola can be written to show its turning point directly. In vertex form, y = a(x − h)² + k, the vertex is (h, k): at x = h the squared term is 0, its smallest possible value, so y = k is the minimum (for a > 0) or the maximum (a < 0). Everything else is symmetric around the vertical line x = h, the axis of symmetry. This is y = x² shifted right by h, up by k and stretched by a. Converting from standard form to vertex form is completing the square, below.")}
      </p>
      <Equation label={tx(t, "mQuad_eqVertex", "Vertex form")}
        where={[
          [r`(h, k)`, tx(t, "mQuad_wHK", "the vertex, the highest or lowest point")],
          [r`h = -\tfrac{b}{2a}`, tx(t, "mQuad_wH", "the vertex's x, from the standard form")],
          [r`k = c - \tfrac{b^2}{4a}`, tx(t, "mQuad_wK", "the vertex's y: the value of the quadratic at x = h")],
        ]}
        note={tx(t, "mQuad_eqVertexNote", "Example: y = 2x² − 8x + 5. h = 8/4 = 2, k = 2·4 − 16 + 5 = −3, so y = 2(x − 2)² − 3: a valley with its bottom at (2, −3).")}>
        {r`y = a\,(x - h)^2 + k`}
      </Equation>

      <H2>{tx(t, "mQuad_solveTitle", "Solving ax² + bx + c = 0")}</H2>
      <p>
        {tx(t, "mQuad_solveBody",
          "The solutions (roots) are the x values where the parabola crosses the x axis. A parabola can cross twice, touch once at its vertex, or miss the axis entirely, so a quadratic has two, one or no real solutions. There are three methods, from quickest to most general.")}
      </p>
      <H3>{tx(t, "mQuad_sqrtTitle", "1. Square roots, when there is no x term")}</H3>
      <p>
        {tx(t, "mQuad_sqrtBody",
          "If b = 0, isolate x² and take the square root of both sides. Remember both signs: x² = 9 has two solutions, 3 and −3, because both square to 9. Writing only x = 3 loses half of the answer. The same works for anything of the form (x − h)² = k: x − h = ±√k, so x = h ± √k.")}
      </p>
      <Equation label={tx(t, "mQuad_eqSqrt", "Solving 2x² − 18 = 0")}
        notes={[
          tx(t, "mQuad_q1", "add 18, divide by 2: x² = 9"),
          tx(t, "mQuad_q2", "square root of both sides, both signs: x = ±3"),
        ]}>
        {r`2x^2 = 18 \;\to\; x^2 = 9 \;\to\; x = \pm 3`}
      </Equation>

      <H3>{tx(t, "mQuad_factTitle", "2. Factoring and the zero-product rule")}</H3>
      <p>
        {tx(t, "mQuad_factBody",
          "If a product is zero, one of its factors must be zero: 0 is the only number that can make a product vanish. So if you can write the quadratic as (x − p)(x − q) = 0, the solutions are p and q. For x² + bx + c with a = 1, look for two numbers p and q whose product is c and whose sum is −b (the expansion (x − p)(x − q) = x² − (p + q)x + pq from the expressions chapter). This is quick when the roots are whole numbers, and useless when they are not.")}
      </p>
      <Equation label={tx(t, "mQuad_eqFact", "Solving x² − 5x + 6 = 0 by factoring")}
        notes={[
          tx(t, "mQuad_f1", "we need two numbers with product 6 and sum 5: 2 and 3"),
          tx(t, "mQuad_f2", "so x² − 5x + 6 = (x − 2)(x − 3)"),
          tx(t, "mQuad_f3", "the product is 0 when x − 2 = 0 or x − 3 = 0: x = 2 or x = 3"),
        ]}>
        {r`x^2 - 5x + 6 = (x - 2)(x - 3) = 0 \;\Rightarrow\; x = 2 \text{ or } x = 3`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "mQuad_divWarn", "Never divide both sides by x to \"simplify\" x² = 3x. That silently assumes x ≠ 0 and loses the solution x = 0. Instead move everything to one side and factor: x² − 3x = x(x − 3) = 0, so x = 0 or x = 3.")}
      </Callout>

      <H3>{tx(t, "mQuad_csTitle", "3. Completing the square")}</H3>
      <p>
        {tx(t, "mQuad_csBody",
          "This method always works, and it is where the formula comes from. The idea is to rewrite x² + bx as a perfect square minus a correction, so that x appears only once, inside the square; then the square-root method finishes the job. The picture shows why the correction is (b/2)².")}
      </p>

      <CompleteSquareFigure t={t} />

      <Equation label={tx(t, "mQuad_eqCs", "Solving x² + 6x − 7 = 0 by completing the square")}
        notes={[
          tx(t, "mQuad_c1", "move the constant: x² + 6x = 7"),
          tx(t, "mQuad_c2", "half of 6 is 3, and 3² = 9: add 9 to both sides, x² + 6x + 9 = 16"),
          tx(t, "mQuad_c3", "the left side is now a perfect square: (x + 3)² = 16"),
          tx(t, "mQuad_c4", "square roots: x + 3 = ±4, so x = 1 or x = −7"),
        ]}>
        {r`x^2 + 6x = 7 \;\to\; (x + 3)^2 = 16 \;\to\; x = -3 \pm 4`}
      </Equation>

      <H2>{tx(t, "mQuad_formulaTitle", "The quadratic formula")}</H2>
      <p>
        {tx(t, "mAlg_completeBody",
          "The formula comes from a trick called completing the square. Divide by a: x² + (b/a)x + c/a = 0. The first two terms are the start of a perfect square: (x + b/2a)² = x² + (b/a)x + b²/4a². So add and subtract b²/4a²: (x + b/2a)² = b²/4a² − c/a = (b² − 4ac)/4a². Take the square root of both sides (both signs) and subtract b/2a.")}
      </p>
      <Equation label={tx(t, "mAlg_eqQuad", "The quadratic formula")}
        where={[
          [r`a, b, c`, tx(t, "mAlg_wABC", "the coefficients of ax² + bx + c = 0, with a ≠ 0")],
          [r`\Delta = b^2 - 4ac`, tx(t, "mAlg_wDisc", "the discriminant. Δ > 0: two real solutions; Δ = 0: one (the parabola touches the axis); Δ < 0: none, because no real number squares to a negative")],
          [r`-\tfrac{b}{2a}`, tx(t, "mAlg_wVertex", "the x of the vertex, the parabola's turning point. The roots sit symmetrically around it")],
          [r`\pm\tfrac{\sqrt\Delta}{2a}`, tx(t, "mAlg_wSpread", "how far each root is from the vertex")],
        ]}>
        {r`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`}
      </Equation>
      <Equation label={tx(t, "mQuad_eqUse", "Using it on 2x² + 3x − 5 = 0")}
        notes={[
          tx(t, "mQuad_u1", "read off a = 2, b = 3, c = −5 (the sign belongs to the coefficient)"),
          tx(t, "mQuad_u2", "discriminant: Δ = 3² − 4 · 2 · (−5) = 9 + 40 = 49 > 0, two roots"),
          tx(t, "mQuad_u3", "x = (−3 ± 7)/4: x = 4/4 = 1 or x = −10/4 = −2.5"),
          tx(t, "mQuad_u4", "check x = 1: 2 + 3 − 5 = 0 ✓"),
        ]}>
        {r`x = \frac{-3 \pm \sqrt{49}}{4} = \frac{-3 \pm 7}{4} \;\Rightarrow\; x = 1,\; x = -2.5`}
      </Equation>

      <QuadraticFigure t={t} />

      <H3>{tx(t, "mQuad_vietaTitle", "Sum and product of the roots")}</H3>
      <p>
        {tx(t, "mQuad_vietaBody",
          "Adding the two roots of the formula cancels the ± parts: x₁ + x₂ = −b/a. Multiplying them gives x₁ · x₂ = c/a (the difference of squares from the expressions chapter does the work). These relations, named after François Viète, are a quick check of any answer, and they let you run the solving process backwards, as the next section shows.")}
      </p>
      <Equation label={tx(t, "mQuad_eqVieta", "Viète's formulas")}
        where={[
          [r`x_1 + x_2`, tx(t, "mQuad_wSum", "the sum of the roots, −b/a. For 2x² + 3x − 5: 1 + (−2.5) = −1.5 = −3/2 ✓")],
          [r`x_1\,x_2`, tx(t, "mQuad_wProd", "the product of the roots, c/a. Here 1 · (−2.5) = −2.5 = −5/2 ✓")],
        ]}>
        {r`x_1 + x_2 = -\frac{b}{a} \qquad x_1\,x_2 = \frac{c}{a}`}
      </Equation>

      <H3>{tx(t, "mQuad_buildTitle", "From the roots back to the equation")}</H3>
      <p>
        {tx(t, "mQuad_buildBody",
          "Viète's formulas work in both directions. If you want a quadratic whose roots are 3 and 4, multiply out (x − 3)(x − 4): x² − 4x − 3x + 12 = x² − 7x + 12. The middle coefficient is minus the sum of the roots, 3 + 4 = 7, and the constant is their product, 3 · 4 = 12. Read the other way, this is the fastest way to factor by hand when a = 1: to factor x² − 7x + 12, look for two numbers whose sum is 7 and whose product is 12. The pairs that multiply to 12 are 1 · 12, 2 · 6 and 3 · 4, and only 3 + 4 = 7.")}
      </p>
      <Equation label={tx(t, "mQuad_eqBuild", "A monic quadratic from its roots")}
        where={[
          [r`x_1, x_2`, tx(t, "mQuad_wRoots", "the two roots you want")],
          [r`x_1 + x_2`, tx(t, "mQuad_wS", "their sum, which appears with a minus sign as the x coefficient")],
          [r`x_1\,x_2`, tx(t, "mQuad_wP", "their product, the constant term")],
        ]}
        note={tx(t, "mQuad_eqBuildNote", "Example: x² + x − 12. The product −12 is negative, so the roots have opposite signs; the sum is −1, so the negative one is bigger in size: −4 and 3. Check: −4 + 3 = −1 and −4 · 3 = −12 ✓, so x² + x − 12 = (x + 4)(x − 3).")}>
        {r`(x - x_1)(x - x_2) = x^2 - (x_1 + x_2)\,x + x_1 x_2`}
      </Equation>

      <H2>{tx(t, "mQuad_appTitle", "Where quadratics show up")}</H2>
      <H3>{tx(t, "mQuad_projTitle", "When does the ball land?")}</H3>
      <p>
        {tx(t, "mQuad_projBody",
          "A ball thrown upward from a height of 2 m at 12 m/s, with gravity g = 9.8 m/s², has height h(t) = 2 + 12t − 4.9t² (the ½gt² term is what makes it quadratic). It lands when h(t) = 0: a = −4.9, b = 12, c = 2. Δ = 144 + 39.2 = 183.2, √Δ ≈ 13.54, so t = (−12 ± 13.54)/(−9.8): t ≈ −0.16 or t ≈ 2.60. The negative root is a moment before the throw, meaningless here; the ball lands after about 2.6 s. Its highest point is the vertex, at t = −b/(2a) ≈ 1.22 s.")}
      </p>
      <H3>{tx(t, "mQuad_rayTitle", "A fence and a garden")}</H3>
      <p>
        {tx(t, "mQuad_rayBody",
          "A rectangular garden is enclosed by 40 m of fence and must have an area of 96 m². What are its sides? Let one side be x. The perimeter is 2x + 2y = 40, so the other side is y = 20 − x. The area condition is x(20 − x) = 96. Expand and move everything to one side: x² − 20x + 96 = 0. Two numbers with sum 20 and product 96 are 8 and 12, so (x − 8)(x − 12) = 0 and x = 8 or x = 12. Both roots describe the same garden, 8 m by 12 m, just turned. Check: 2 · 8 + 2 · 12 = 40 ✓ and 8 · 12 = 96 ✓. What about an area of 120 m²? Then x² − 20x + 120 = 0 has Δ = 400 − 480 < 0: no such garden exists. The largest possible area is at the vertex, x = 10, a 10 × 10 square of 100 m².")}
      </p>

      <H2>{tx(t, "mQuad_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mQuad_tWrong", "Wrong"), tx(t, "mQuad_tRight", "Right"), tx(t, "mQuad_tWhy", "Why")]}
        rows={[
          ["x² = 9 → x = 3", "x = ±3", tx(t, "mQuad_m1", "both 3 and −3 square to 9")],
          ["x² = 3x → x = 3", "x = 0 or x = 3", tx(t, "mQuad_m2", "dividing by x loses x = 0; factor instead")],
          ["x² − 5x + 6 = 0, c = 6, b = 5", "b = −5", tx(t, "mQuad_m3", "the sign in front of a term belongs to its coefficient")],
          ["−b ± √(b² − 4ac) / 2a", "(−b ± √(b² − 4ac)) / (2a)", tx(t, "mQuad_m4", "the whole numerator is divided by the whole 2a; draw the fraction bar under everything")],
          ["(x + 3)² = x² + 9", "x² + 6x + 9", tx(t, "mQuad_m5", "the middle term 2 · 3 · x is always there")],
          [tx(t, "mQuad_m6w", "keeping the negative time"), tx(t, "mQuad_m6r", "choose the root that makes sense"), tx(t, "mQuad_m6", "both roots solve the equation; only some solve the problem")],
        ]}
      />

      <KeyIdeas t={t} id="mQuad" items={[
        "y = ax² + bx + c is a parabola: a > 0 opens up, a < 0 down; c is the value at 0.",
        "Vertex form a(x − h)² + k shows the turning point (h, k), with h = −b/(2a).",
        "Square roots give ± two answers; the zero-product rule turns factors into roots.",
        "Completing the square adds (b/2)² to make a perfect square; it proves the formula.",
        "x = (−b ± √(b² − 4ac)) / (2a); Δ = b² − 4ac counts the real roots.",
        "x₁ + x₂ = −b/a, x₁x₂ = c/a: a check, and a fast way to factor by hand.",
      ]} />
    </Article>
  );
}
