"use client";

// Algebra 7: polynomials — terms, degree and leading coefficient, adding and
// multiplying, evaluating with Horner's method, division and the remainder
// and factor theorems, roots and multiplicity, end behaviour, factoring
// techniques, and the polynomials graphics code is built from.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { PolynomialFigure } from "@/components/lesson/figures/math/PolynomialFigure";

const r = String.raw;

export function PolynomialsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPoly_intro",
          "Linear expressions (x to the first power) and quadratics (up to x²) are the first two members of a family: polynomials, sums of whole-number powers of x. They are the functions a computer evaluates most easily, using only multiplication and addition, which is why so much of graphics is built from them. Smoothstep is a cubic polynomial, Bézier curves are polynomials, easing curves are polynomials, and sin, exp and log are computed inside math libraries by carefully chosen polynomials. This chapter covers how to work with them, how their roots shape their graphs, and how to evaluate them efficiently.")}
      </Lead>

      <H2>{tx(t, "mPoly_defTitle", "What a polynomial is")}</H2>
      <p>
        {tx(t, "mPoly_defBody",
          "A polynomial in x is a sum of terms, each a number times a whole-number power of x. The powers must be 0, 1, 2, 3…: no negative powers (1/x is not allowed), no fractional powers (√x is not allowed) and no x inside other functions. Written in standard form, the terms go from the highest power down. The degree is the highest power that appears; the coefficient of that term is the leading coefficient.")}
      </p>
      <Equation label={tx(t, "mPoly_eqDef", "A polynomial of degree n")}
        where={[
          [r`n`, tx(t, "mPoly_wN", "the degree, a whole number: the highest power of x with a non-zero coefficient")],
          [r`a_n, \dots, a_0`, tx(t, "mPoly_wA", "the coefficients, fixed numbers; the small index says which power each one multiplies")],
          [r`a_n \neq 0`, tx(t, "mPoly_wLead", "the leading coefficient; if it were 0, the degree would be lower")],
          [r`a_0`, tx(t, "mPoly_wA0", "the constant term, the value p(0)")],
        ]}
        note={tx(t, "mPoly_eqDefNote", "Example: p(x) = 4x³ − 2x + 7 has degree 3, leading coefficient 4, constant term 7, and a missing x² term (its coefficient is 0).")}>
        {r`p(x) = a_n x^n + a_{n-1} x^{n-1} + \dots + a_1 x + a_0`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mPoly_tDeg", "Degree"), tx(t, "mPoly_tName", "Name"), tx(t, "mPoly_tEx", "Example"), tx(t, "mPoly_tGraph", "Graph")]}
        rows={[
          ["0", tx(t, "mPoly_n0", "constant"), "5", tx(t, "mPoly_g0", "horizontal line")],
          ["1", tx(t, "mPoly_n1", "linear"), "2x − 1", tx(t, "mPoly_g1", "straight line")],
          ["2", tx(t, "mPoly_n2", "quadratic"), "x² − 4", tx(t, "mPoly_g2", "parabola")],
          ["3", tx(t, "mPoly_n3", "cubic"), "3x² − 2x³ (smoothstep)", tx(t, "mPoly_g3", "an S shape, up to 2 turns")],
          ["4", tx(t, "mPoly_n4", "quartic"), "x⁴ − 5x² + 4", tx(t, "mPoly_g4", "a W or M shape, up to 3 turns")],
        ]}
      />

      <H2>{tx(t, "mPoly_opsTitle", "Adding and multiplying")}</H2>
      <p>
        {tx(t, "mPoly_opsBody",
          "Adding or subtracting polynomials is collecting like terms: add the coefficients of equal powers. Multiplying uses the distributive law: every term of the first multiplies every term of the second, the exponents add (x² · x³ = x⁵), then like terms are collected. The degree of a product is the sum of the degrees, which is why multiplying the factors (x − r) of the figure below builds a polynomial of any degree you like.")}
      </p>
      <Equation label={tx(t, "mPoly_eqMul", "Multiplying (x² + 2x − 1)(x − 3)")}
        notes={[
          tx(t, "mPoly_mu1", "x² · (x − 3) = x³ − 3x²"),
          tx(t, "mPoly_mu2", "2x · (x − 3) = 2x² − 6x"),
          tx(t, "mPoly_mu3", "−1 · (x − 3) = −x + 3"),
          tx(t, "mPoly_mu4", "collect: x³ + (−3 + 2)x² + (−6 − 1)x + 3. Degrees 2 + 1 = 3 ✓"),
        ]}>
        {r`(x^2 + 2x - 1)(x - 3) = x^3 - x^2 - 7x + 3`}
      </Equation>

      <H2>{tx(t, "mPoly_hornerTitle", "Evaluating: Horner's method")}</H2>
      <p>
        {tx(t, "mPoly_hornerBody",
          "Evaluating term by term recomputes powers again and again. Factoring x out repeatedly, from the inside, gives a nested form that uses one multiplication and one addition per coefficient: for degree n, n multiplications instead of about n²/2. It is also more accurate in floating point, and it is how every math library evaluates its polynomial approximations. On the GPU each step is a single fused multiply-add (fma) instruction.")}
      </p>
      <Equation label={tx(t, "mPoly_eqHorner", "Horner's form")}
        where={[
          [r`2x^3 - 6x^2 + 2x - 1`, tx(t, "mPoly_wStd", "standard form: x³ and x² are computed separately")],
          [r`((2x - 6)x + 2)x - 1`, tx(t, "mPoly_wNested", "the same polynomial, nested: start with the leading coefficient, then repeatedly multiply by x and add the next coefficient")],
        ]}
        note={tx(t, "mPoly_eqHornerNote", "At x = 3: 2 → 2·3 − 6 = 0 → 0·3 + 2 = 2 → 2·3 − 1 = 5. Check: 54 − 54 + 6 − 1 = 5 ✓.")}>
        {r`2x^3 - 6x^2 + 2x - 1 = \big((2x - 6)\,x + 2\big)\,x - 1`}
      </Equation>
      <CodeBlock lang="cpp" filename="horner.hpp" t={t}>{`#include <vector>
#include <cmath>

// Coefficients from the highest power down: {2, -6, 2, -1} is 2x³ − 6x² + 2x − 1
float evalPoly(const std::vector<float>& c, float x) {
    float y = 0;
    for (float a : c) y = std::fma(y, x, a);   // y = y·x + a, rounded once
    return y;
}

// smoothstep's cubic, 3t² − 2t³, in Horner form
float smooth(float t) { return t * t * (3 - 2 * t); }`}</CodeBlock>

      <H2>{tx(t, "mPoly_divTitle", "Division, remainders and factors")}</H2>
      <p>
        {tx(t, "mPoly_divBody",
          "Polynomials divide like whole numbers: 17 ÷ 5 is 3 remainder 2 because 17 = 5 · 3 + 2. In the same way, dividing p(x) by (x − r) gives a quotient q(x), one degree lower, and a remainder, which is just a number. The shortcut for dividing by (x − r) is synthetic division, and it is exactly Horner's method run at x = r: the intermediate values are the quotient's coefficients and the final value is the remainder.")}
      </p>
      <Equation label={tx(t, "mPoly_eqRem", "The remainder theorem")}
        where={[
          [r`q(x)`, tx(t, "mPoly_wQ", "the quotient, of degree one less than p")],
          [r`p(r)`, tx(t, "mPoly_wR", "the remainder: substitute x = r into p(x) = (x − r)q(x) + R and the first term vanishes, leaving R = p(r)")],
        ]}>
        {r`p(x) = (x - r)\,q(x) + p(r)`}
      </Equation>
      <p>
        {tx(t, "mPoly_factorThm",
          "The factor theorem follows at once: (x − r) divides p(x) exactly, with no remainder, precisely when p(r) = 0. So every root of a polynomial gives a factor, and every factor gives a root. To factor a cubic, find one root r by trying small whole numbers (for whole-number coefficients, any whole-number root must divide the constant term), divide by (x − r), and what remains is a quadratic you already know how to solve.")}
      </p>
      <Equation label={tx(t, "mPoly_eqFactor", "Factoring x³ − 6x² + 11x − 6")}
        notes={[
          tx(t, "mPoly_fa1", "try divisors of 6: p(1) = 1 − 6 + 11 − 6 = 0, so (x − 1) is a factor"),
          tx(t, "mPoly_fa2", "Horner at x = 1 on the coefficients 1, −6, 11, −6: 1 → 1·1 − 6 = −5 → −5·1 + 11 = 6 → 6·1 − 6 = 0 (the remainder)"),
          tx(t, "mPoly_fa3", "the intermediate values 1, −5, 6 are the quotient: x² − 5x + 6 = (x − 2)(x − 3)"),
          tx(t, "mPoly_fa4", "so the roots are 1, 2 and 3"),
        ]}>
        {r`x^3 - 6x^2 + 11x - 6 = (x - 1)(x^2 - 5x + 6) = (x - 1)(x - 2)(x - 3)`}
      </Equation>

      <H2>{tx(t, "mPoly_rootsTitle", "Roots shape the graph")}</H2>
      <p>
        {tx(t, "mPoly_rootsBody",
          "Written in factored form, p(x) = a(x − r₁)(x − r₂)…(x − rₙ), a polynomial shows its roots directly. Between two neighbouring roots the sign of p cannot change (no factor passes through zero there), so the graph stays on one side of the axis, and at each simple root it crosses to the other side. When a factor is repeated, as in (x − 2)², the root is called a double root: the squared factor never becomes negative, so the curve touches the axis and turns back instead of crossing. Drag two roots together in the figure to see it.")}
      </p>

      <PolynomialFigure t={t} />

      <Equation label={tx(t, "mPoly_eqFund", "How many roots?")}
        where={[
          [r`n`, tx(t, "mPoly_wDeg", "the degree")],
          [r`\le n`, tx(t, "mPoly_wAtMost", "a polynomial of degree n has at most n real roots, and at most n − 1 turning points")],
          [r`= n`, tx(t, "mPoly_wExact", "counting repeated roots and complex roots, it has exactly n (the fundamental theorem of algebra). x² + 1 has no real roots but two complex ones, ±i, covered in the complex numbers chapter")],
        ]}
        note={tx(t, "mPoly_eqFundNote", "An odd degree always has at least one real root: its ends go in opposite directions, so the curve must cross the axis somewhere in between.")}>
        {r`\deg p = n \;\Rightarrow\; \text{at most } n \text{ real roots}`}
      </Equation>

      <H3>{tx(t, "mPoly_endTitle", "End behaviour")}</H3>
      <p>
        {tx(t, "mPoly_endBody",
          "For large |x| the highest power outgrows all the others, so far from the origin a polynomial looks like its leading term aₙxⁿ alone. That decides where the two ends of the graph go. Even degree: both ends go the same way, up if aₙ > 0, down if aₙ < 0. Odd degree: the ends go opposite ways, rising to the right if aₙ > 0. This is why polynomial approximations are only used on a limited range: outside it, the leading term takes over and the values explode.")}
      </p>

      <H2>{tx(t, "mPoly_techTitle", "Factoring toolbox")}</H2>
      <LessonTable
        headers={[tx(t, "mPoly_tPattern", "Pattern"), tx(t, "mPoly_tFactored", "Factored"), tx(t, "mPoly_tExample", "Example")]}
        rows={[
          [tx(t, "mPoly_p1", "common factor"), "ax³ + bx² = x²(ax + b)", "6x³ − 9x² = 3x²(2x − 3)"],
          [tx(t, "mPoly_p2", "difference of squares"), "a² − b² = (a − b)(a + b)", "x⁴ − 16 = (x² − 4)(x² + 4) = (x − 2)(x + 2)(x² + 4)"],
          [tx(t, "mPoly_p3", "perfect square"), "a² ± 2ab + b² = (a ± b)²", "x² − 10x + 25 = (x − 5)²"],
          [tx(t, "mPoly_p4", "sum / difference of cubes"), "a³ ± b³ = (a ± b)(a² ∓ ab + b²)", "x³ − 8 = (x − 2)(x² + 2x + 4)"],
          [tx(t, "mPoly_p5", "grouping"), "ax + ay + bx + by = (a + b)(x + y)", "x³ + 2x² + 3x + 6 = (x² + 3)(x + 2)"],
          [tx(t, "mPoly_p6", "quadratic in x²"), tx(t, "mPoly_p6f", "substitute u = x²"), "x⁴ − 5x² + 4 = (x² − 1)(x² − 4)"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mPoly_orderTip", "A good order to try: first pull out any common factor, then look for a special pattern (difference of squares, perfect square, cubes), then try grouping or a small whole-number root. Always check by multiplying back out, or by plugging a value into both forms.")}
      </Callout>

      <H2>{tx(t, "mPoly_gfxTitle", "Polynomials in graphics")}</H2>
      <LessonTable
        headers={[tx(t, "mPoly_tWhere", "Where"), tx(t, "mPoly_tPoly", "Polynomial"), tx(t, "mPoly_tWhy", "Why")]}
        rows={[
          ["smoothstep", "3t² − 2t³", tx(t, "mPoly_u1", "the cubic with value 0 and 1 at the ends and zero slope at both: a smooth start and stop")],
          ["smootherstep", "6t⁵ − 15t⁴ + 10t³", tx(t, "mPoly_u2", "a quintic that also has zero curvature at the ends; Perlin noise uses it")],
          [tx(t, "mPoly_u3w", "easing"), "t², t³, 1 − (1 − t)³", tx(t, "mPoly_u3", "ease-in and ease-out curves from the Game Dev track")],
          [tx(t, "mPoly_u4w", "Bézier curves"), "(1 − t)³P₀ + 3(1 − t)²tP₁ + …", tx(t, "mPoly_u4", "every coordinate of a cubic Bézier is a cubic in t")],
          [tx(t, "mPoly_u5w", "sin, exp in libraries"), "x − x³/6 + x⁵/120 …", tx(t, "mPoly_u5", "polynomials fitted on a small range, evaluated with Horner (series come in the calculus section)")],
        ]}
      />

      <H2>{tx(t, "mPoly_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPoly_tWrong", "Wrong"), tx(t, "mPoly_tRight", "Right"), tx(t, "mPoly_tWhy2", "Why")]}
        rows={[
          [tx(t, "mPoly_m1w", "x² · x³ = x⁶"), "x⁵", tx(t, "mPoly_m1", "multiplying adds exponents")],
          [tx(t, "mPoly_m2w", "1/x + x² is a polynomial"), tx(t, "mPoly_m2r", "it is not"), tx(t, "mPoly_m2", "powers must be whole numbers ≥ 0")],
          [tx(t, "mPoly_m3w", "degree of 3 + 5x − x⁴ is 1"), tx(t, "mPoly_m3r", "4"), tx(t, "mPoly_m3", "the degree is the highest power, wherever it is written")],
          [tx(t, "mPoly_m4w", "(x − 2) is a factor, so p(−2) = 0"), "p(2) = 0", tx(t, "mPoly_m4", "the factor (x − r) belongs to the root r: the sign flips")],
          [tx(t, "mPoly_m5w", "forgetting a missing power in synthetic division"), tx(t, "mPoly_m5r", "write its 0 coefficient"), tx(t, "mPoly_m5", "x³ − 1 has coefficients 1, 0, 0, −1")],
          ["x² + 4 = (x + 2)(x − 2)", "x² − 4 = (x + 2)(x − 2)", tx(t, "mPoly_m6", "a sum of squares has no real factors")],
        ]}
      />

      <KeyIdeas t={t} id="mPoly" items={[
        "A polynomial is a sum of coefficients times whole-number powers of x; its degree is the highest power.",
        "Multiply term by term; the degree of a product is the sum of the degrees.",
        "Evaluate with Horner: ((aₙx + aₙ₋₁)x + …)x + a₀, one multiply-add per coefficient.",
        "p(r) is the remainder of dividing by (x − r); (x − r) is a factor exactly when p(r) = 0.",
        "Simple roots cross the axis, double roots touch it; degree n means at most n real roots.",
        "Far away, the leading term wins: it decides where the graph's ends go.",
      ]} />
    </Article>
  );
}
