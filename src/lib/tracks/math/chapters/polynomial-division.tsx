"use client";

// Algebra 8: dividing polynomials — the division algorithm (p = d·q + r with
// deg r < deg d); long division by any divisor; Ruffini's rule (the
// Briot–Ruffini device, synthetic division) derived by matching
// coefficients; dividing by ax − b; the remainder and factor theorems again,
// including the remainder by (x − a)(x − b); repeated division and the
// multiplicity of a root; the rational root theorem; Girard's (Vieta's)
// relations for cubics and beyond.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RuffiniFigure } from "@/components/lesson/figures/math/RuffiniFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: a cubic from its roots (Girard) ─────────────────────────────

const sg = (v: number) => (v < 0 ? `- ${-v}` : `+ ${v}`);
function girardNumbers(v: Record<string, number>) {
  const { a, b, c } = v;
  const s1 = a + b + c, s2 = a * b + a * c + b * c, s3 = a * b * c;
  return {
    tex: r`(x ${sg(-a)})(x ${sg(-b)})(x ${sg(-c)}) = x^3 \amber{${sg(-s1)}}x^2 \amber{${sg(s2)}}x \amber{${sg(-s3)}} \qquad \Sigma = \green{${s1}},\ \Sigma_2 = \green{${s2}},\ \Pi = \green{${s3}}`,
  };
}

export function PolynomialDivisionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPdiv_intro",
          "The polynomials chapter showed that dividing p(x) by (x − r) leaves the remainder p(r), and used it to factor one cubic. This chapter turns that into a full toolkit. Long division divides by any polynomial, the way you divide whole numbers on paper. Ruffini's rule, known in Brazil as the Briot–Ruffini device and in English-speaking schools as synthetic division, does the most common case, dividing by (x − r), in a small table with one multiplication and one addition per coefficient. With it come the tools to find every rational root of a polynomial and the relations between its roots and its coefficients.")}
      </Lead>

      <Goals t={t} id="mPdiv" items={[
        "Divide a polynomial by any polynomial with long division, and state the division algorithm.",
        "Divide by (x − r) and by (ax − b) with Ruffini's rule, and know why it works.",
        "Use the remainder theorem, find the multiplicity of a root, and list the rational root candidates ±p/q.",
        "Use Girard's relations between the roots and the coefficients.",
      ]} />

      <H2>{tx(t, "mPdiv_algTitle", "The division algorithm")}</H2>
      <p>
        {tx(t, "mPdiv_algBody",
          "With whole numbers, 17 ÷ 5 gives quotient 3 and remainder 2: 17 = 5 · 3 + 2, and the remainder is smaller than the divisor. Polynomials work the same way, with \"smaller\" meaning \"of lower degree\". For any polynomials p (the dividend) and d (the divisor, not zero) there is exactly one pair q (the quotient) and r (the remainder) such that the equation below holds and the remainder's degree is lower than the divisor's. Dividing by a degree-1 polynomial leaves a constant remainder; dividing by a quadratic leaves at most a linear one.")}
      </p>
      <Equation label={tx(t, "mPdiv_eqAlg", "The division algorithm for polynomials")}
        where={[
          [r`p(x)`, tx(t, "mPdiv_wP", "the dividend, the polynomial being divided")],
          [r`d(x)`, tx(t, "mPdiv_wD", "the divisor, not the zero polynomial")],
          [r`q(x)`, tx(t, "mPdiv_wQ", "the quotient, of degree deg p − deg d")],
          [r`R(x)`, tx(t, "mPdiv_wR", "the remainder, of degree lower than d (or zero)")],
        ]}
        words={tx(t, "mPdiv_algWords", "The dividend equals divisor times quotient plus a remainder too small to contain the divisor again.")}>
        {r`p(x) = d(x)\,q(x) + R(x), \qquad \deg R < \deg d`}
      </Equation>

      <H2>{tx(t, "mPdiv_longTitle", "Long division")}</H2>
      <p>
        {tx(t, "mPdiv_longBody",
          "Long division repeats one move. Divide the leading term of what is left by the leading term of the divisor; that is the next term of the quotient. Multiply the whole divisor by it and subtract. The leading term cancels, so what is left has lower degree. Stop when what is left has lower degree than the divisor: that is the remainder. Write every power, with 0 for any that is missing, so that the columns line up.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqLong", "(x³ − 2x² + 4x − 3) ÷ (x² + 1)")}
        steps={[
          { full: true, tex: r`\tfrac{x^3}{x^2} = \amber{x}: \quad x^3 - 2x^2 + 4x - 3 - x(x^2 + 1) = -2x^2 + 3x - 3`, why: tx(t, "mPdiv_l1", "first quotient term: x³ divided by x² is x; subtract x times the divisor, x³ + x") },
          { full: true, tex: r`\tfrac{-2x^2}{x^2} = \amber{-2}: \quad -2x^2 + 3x - 3 - (-2)(x^2 + 1) = 3x - 1`, why: tx(t, "mPdiv_l2", "next term: −2x² over x² is −2; subtracting −2x² − 2 leaves 3x − 1") },
          { full: true, tex: r`\deg(3x - 1) = 1 < 2 = \deg(x^2 + 1)`, why: tx(t, "mPdiv_l3", "what is left has lower degree than the divisor: stop") },
          { full: true, tex: r`\green{x^3 - 2x^2 + 4x - 3 = (x^2 + 1)(x - 2) + (3x - 1)}`, why: tx(t, "mPdiv_l4", "quotient x − 2, remainder 3x − 1; multiply back out to check") },
        ]} />
      <LessonTable
        headers={["", "x³", "x²", "x", "1", tx(t, "mPdiv_tNote", "what happened")]}
        rows={[
          [tx(t, "mPdiv_rP", "dividend"), "1", "−2", "4", "−3", ""],
          ["− x·(x² + 1)", "1", "0", "1", "", tx(t, "mPdiv_rN1", "subtract x times the divisor")],
          [tx(t, "mPdiv_rLeft", "left"), "", "−2", "3", "−3", ""],
          ["− (−2)·(x² + 1)", "", "−2", "0", "−2", tx(t, "mPdiv_rN2", "subtract −2 times the divisor")],
          [tx(t, "mPdiv_rRem", "remainder"), "", "", "3", "−1", "3x − 1"],
        ]}
      />

      <H2>{tx(t, "mPdiv_ruffTitle", "Ruffini's rule: dividing by (x − r)")}</H2>
      <p>
        {tx(t, "mPdiv_ruffBody",
          "When the divisor is x − r, long division does a lot of writing for little work: every subtraction removes a term x·(something) that was put there on purpose. Paolo Ruffini (1804) and later Charles Briot noticed that only the coefficients matter. Write p(x) = (x − r) q(x) + R with unknown coefficients for q and multiply out: matching the coefficients of each power gives a simple chain.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqWhy", "Why the device works: a cubic divided by (x − r)")}
        steps={[
          { full: true, tex: r`a_3x^3 + a_2x^2 + a_1x + a_0 = (x - r)(b_2x^2 + b_1x + b_0) + R`, why: tx(t, "mPdiv_w1", "the quotient has degree one less; its coefficients b₂, b₁, b₀ and R are unknown") },
          { full: true, tex: r`= b_2x^3 + (b_1 - r b_2)x^2 + (b_0 - r b_1)x + (R - r b_0)`, why: tx(t, "mPdiv_w2", "multiply out and collect each power") },
          { full: true, tex: r`b_2 = a_3, \quad b_1 = a_2 + r b_2, \quad b_0 = a_1 + r b_1, \quad R = a_0 + r b_0`, why: tx(t, "mPdiv_w3", "match coefficients of x³, x², x and 1, and solve each for the new unknown") },
          { full: true, tex: r`\green{\text{bring down } a_3, \text{ then repeat: } \times r, + \text{next coefficient}}`, why: tx(t, "mPdiv_w4", "each new number is r times the last one plus the next coefficient: this is the whole device, and it is Horner's method for p(r)") },
        ]} />
      <p>
        {tx(t, "mPdiv_ruffHow",
          "The device is laid out as a small table. Write r on the left, behind a vertical bar, and the coefficients of p across the top, highest power first, with a 0 for every missing power. Bring the first coefficient down below the line. Then, column by column: multiply the last number below the line by r, write the product under the next coefficient, and add the column. The numbers below the line are the quotient's coefficients, and the last one is the remainder.")}
      </p>
      <LessonTable
        headers={["r", "x⁴", "x³", "x²", "x", "1"]}
        rows={[
          ["2", "2", "−3", "0", "5", "−7"],
          ["", "", "+ 4", "+ 2", "+ 4", "+ 18"],
          ["", "2", "1", "2", "9", "11"],
        ]}
      />
      <p>
        {tx(t, "mPdiv_ruffEx",
          "That is 2x⁴ − 3x³ + 5x − 7 divided by x − 2. Bring down 2. 2 × 2 = 4, and −3 + 4 = 1. 1 × 2 = 2, and 0 + 2 = 2. 2 × 2 = 4, and 5 + 4 = 9. 9 × 2 = 18, and −7 + 18 = 11. So the quotient is 2x³ + x² + 2x + 9 and the remainder is 11. The remainder theorem checks it: p(2) = 32 − 24 + 10 − 7 = 11.")}
      </p>

      <RuffiniFigure t={t} />

      <Callout type="warn" t={t}>
        {tx(t, "mPdiv_zeroWarn", "The most common mistake is to skip a missing power. In 2x⁴ − 3x³ + 5x − 7 there is no x² term, and its 0 must have its own column; without it every later coefficient lands on the wrong power. Turn on \"skip the 0 coefficients\" in the figure to see the wrong answer it gives.")}
      </Callout>

      <H3>{tx(t, "mPdiv_axbTitle", "Dividing by ax − b")}</H3>
      <p>
        {tx(t, "mPdiv_axbBody",
          "Ruffini's rule needs a divisor of the form x − r. For 2x − 1, factor out the 2: 2x − 1 = 2(x − 1/2). Run the device with r = 1/2; it gives p(x) = (x − 1/2) q₁(x) + R. Then p(x) = (2x − 1) · q₁(x)/2 + R. So the remainder stays the same and the quotient is the device's result divided by the leading coefficient a.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqAxb", "(2x³ − x² + 4x − 2) ÷ (2x − 1)")}
        steps={[
          { tex: r`2x - 1 = 2\left(x - \tfrac12\right)`, why: tx(t, "mPdiv_a1", "the root of the divisor is r = 1/2") },
          { tex: r`\begin{array}{r|rrrr} \tfrac12 & 2 & -1 & 4 & -2 \\ & & 1 & 0 & 2 \\ \hline & 2 & 0 & 4 & \amber{0} \end{array}`, why: tx(t, "mPdiv_a2", "the device at r = 1/2: 2; 2·½ − 1 = 0; 0·½ + 4 = 4; 4·½ − 2 = 0") },
          { tex: r`q_1(x) = 2x^2 + 4, \quad R = 0`, why: tx(t, "mPdiv_a3", "the quotient by (x − ½), and the remainder") },
          { tex: r`\green{2x^3 - x^2 + 4x - 2 = (2x - 1)(x^2 + 2)}`, why: tx(t, "mPdiv_a4", "divide q₁ by 2; the remainder 0 means 2x − 1 is a factor") },
        ]} />

      <H2>{tx(t, "mPdiv_remTitle", "The remainder theorem at work")}</H2>
      <p>
        {tx(t, "mPdiv_remBody",
          "The remainder of dividing by (x − r) is p(r): put x = r into p(x) = (x − r)q(x) + R and the first term vanishes. Two consequences are used constantly. First, (x − r) divides p exactly if and only if p(r) = 0 (the factor theorem). Second, the remainder can be found without dividing at all, which answers questions like \"for which k does x − 2 divide x³ − 3x + k?\": p(2) = 8 − 6 + k = 0, so k = −2.")}
      </p>
      <p>
        {tx(t, "mPdiv_twoBody",
          "The same idea works for a divisor with two roots. Dividing by (x − a)(x − b), a quadratic, leaves a remainder of degree at most 1, say mx + c. You may not know p(x) at all, only two of its values; that is enough.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqTwo", "p(1) = 3 and p(2) = 5: the remainder by (x − 1)(x − 2)")}
        steps={[
          { full: true, tex: r`p(x) = (x - 1)(x - 2)\,q(x) + mx + c`, why: tx(t, "mPdiv_t1", "the division algorithm: the remainder has degree below 2") },
          { full: true, tex: r`x = 1:\ m + c = 3, \qquad x = 2:\ 2m + c = 5`, why: tx(t, "mPdiv_t2", "at the divisor's roots the first term is 0") },
          { full: true, tex: r`\green{m = 2,\ c = 1: \quad R(x) = 2x + 1}`, why: tx(t, "mPdiv_t3", "subtract the equations: m = 2; then c = 1") },
        ]} />

      <H3>{tx(t, "mPdiv_multTitle", "Repeated division and multiplicity")}</H3>
      <p>
        {tx(t, "mPdiv_multBody",
          "After finding a root r and dividing it out, divide the quotient by (x − r) again. If the remainder is 0 again, r is at least a double root. The number of times (x − r) divides p is the multiplicity of the root. For x³ − 3x + 2: dividing by x − 1 gives x² + x − 2 with remainder 0; dividing that by x − 1 again gives x + 2 with remainder 0; dividing x + 2 by x − 1 leaves 3. So 1 is a double root and x³ − 3x + 2 = (x − 1)²(x + 2). On the graph, a double root is where the curve touches the axis without crossing it, as the polynomials chapter showed.")}
      </p>

      <H2>{tx(t, "mPdiv_ratTitle", "Which roots to try: the rational root theorem")}</H2>
      <p>
        {tx(t, "mPdiv_ratBody",
          "For a polynomial with whole-number coefficients, the rational roots cannot be just any fractions. If p/q (in lowest terms) is a root, then p divides the constant term and q divides the leading coefficient. That turns the search into a short list of candidates ±p/q to test with the device.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqRat", "Why a rational root p/q must have p | a₀ and q | aₙ")}
        steps={[
          { full: true, tex: r`a_n\left(\tfrac{p}{q}\right)^n + a_{n-1}\left(\tfrac{p}{q}\right)^{n-1} + \dots + a_0 = 0`, why: tx(t, "mPdiv_r1", "p/q is a root, written in lowest terms: p and q have no common factor") },
          { full: true, tex: r`a_n p^n + a_{n-1} p^{n-1} q + \dots + a_1 p\,q^{n-1} + a_0 q^n = 0`, why: tx(t, "mPdiv_r2", "multiply every term by qⁿ to clear the fractions") },
          { full: true, tex: r`a_0 q^n = -p\,(a_n p^{n-1} + \dots + a_1 q^{n-1})`, why: tx(t, "mPdiv_r3", "every term but the last has a factor p, so p divides a₀qⁿ; sharing no factor with q, p divides a₀") },
          { full: true, tex: r`\green{p \mid a_0, \qquad q \mid a_n}`, why: tx(t, "mPdiv_r4", "the same argument with the first term isolated shows q divides aₙ") },
        ]} />
      <Derivation t={t} label={tx(t, "mPdiv_eqRatEx", "Solve 2x³ − 3x² − 3x + 2 = 0")}
        steps={[
          { tex: r`\pm\tfrac{p}{q}: \ p \mid 2,\ q \mid 2 \;\Rightarrow\; \pm 1, \pm 2, \pm\tfrac12`, why: tx(t, "mPdiv_e1", "p from the divisors of the constant 2, q from the divisors of the leading 2") },
          { tex: r`p(2) = 16 - 12 - 6 + 2 = 0`, why: tx(t, "mPdiv_e2", "try them: 1 gives −2, −1 gives 0 too, 2 gives 0") },
          { tex: r`\begin{array}{r|rrrr} 2 & 2 & -3 & -3 & 2 \\ & & 4 & 2 & -2 \\ \hline & 2 & 1 & -1 & \amber{0} \end{array}`, why: tx(t, "mPdiv_e3", "divide out (x − 2) with the device") },
          { tex: r`2x^2 + x - 1 = (2x - 1)(x + 1)`, why: tx(t, "mPdiv_e4", "the quotient is a quadratic; factor it or use the quadratic formula") },
          { tex: r`\green{x = 2,\ \tfrac12,\ -1}`, why: tx(t, "mPdiv_e5", "all three roots; the fraction 1/2 was on the candidate list") },
        ]} />
      <Callout type="info" t={t}>
        {tx(t, "mPdiv_ratTip", "The theorem lists every possible rational root, but a polynomial may have none: x³ − 2 has candidates ±1, ±2, none of which works, and its real root ∛2 is irrational. Then other methods (graphs, numerical approximation) take over.")}
      </Callout>

      <H2>{tx(t, "mPdiv_girTitle", "Girard's relations: roots and coefficients")}</H2>
      <p>
        {tx(t, "mPdiv_girBody",
          "The quadratics chapter showed that the roots of ax² + bx + c add up to −b/a and multiply to c/a. Albert Girard (1629) and François Viète found the same pattern for every degree. Write the cubic through its roots and multiply out.")}
      </p>
      <Derivation t={t} label={tx(t, "mPdiv_eqGirDer", "The coefficients of a cubic from its roots")}
        steps={[
          { full: true, tex: r`ax^3 + bx^2 + cx + d = a(x - r_1)(x - r_2)(x - r_3)`, why: tx(t, "mPdiv_g1", "a cubic with roots r₁, r₂, r₃ (counted with multiplicity) factors this way") },
          { full: true, tex: r`= a\left[x^3 - (r_1 + r_2 + r_3)x^2 + (r_1r_2 + r_1r_3 + r_2r_3)x - r_1r_2r_3\right]`, why: tx(t, "mPdiv_g2", "multiply out: each power of x collects the products of the roots it skips") },
          { full: true, tex: r`b = -a(r_1 + r_2 + r_3), \quad c = a(r_1r_2 + r_1r_3 + r_2r_3), \quad d = -a\,r_1r_2r_3`, why: tx(t, "mPdiv_g3", "compare coefficients power by power") },
        ]} />
      <Equation label={tx(t, "mPdiv_eqGir", "Girard's relations for a cubic")}
        where={[
          [r`r_1, r_2, r_3`, tx(t, "mPdiv_wRoots", "the three roots, real or complex, repeated ones counted again")],
          [r`a, b, c, d`, tx(t, "mPdiv_wCoef", "the coefficients of ax³ + bx² + cx + d, with a ≠ 0")],
        ]}
        note={tx(t, "mPdiv_girNote", "For degree n the signs alternate in the same way: the sum of the roots is −aₙ₋₁/aₙ, the sum of the products two at a time is aₙ₋₂/aₙ, …, and the product of all n roots is (−1)ⁿa₀/aₙ.")}
        words={tx(t, "mPdiv_girWords", "The roots add up to minus b over a, their products in pairs add up to c over a, and all three multiplied give minus d over a.")}>
        {r`r_1 + r_2 + r_3 = -\frac{b}{a}, \qquad r_1r_2 + r_1r_3 + r_2r_3 = \frac{c}{a}, \qquad r_1r_2r_3 = -\frac{d}{a}`}
      </Equation>
      <LiveFormula label={tx(t, "mPdiv_liveGir", "Try it: a cubic built from its roots")}
        tex={r`(x - r_1)(x - r_2)(x - r_3) = x^3 - \Sigma\,x^2 + \Sigma_2\,x - \Pi`}
        vars={[
          { id: "a", label: "r₁", min: -4, max: 4, step: 1, value: 1, fmt: v => String(v).replace("-", "−") },
          { id: "b", label: "r₂", min: -4, max: 4, step: 1, value: 2, fmt: v => String(v).replace("-", "−") },
          { id: "c", label: "r₃", min: -4, max: 4, step: 1, value: 3, fmt: v => String(v).replace("-", "−") },
        ]}
        compute={girardNumbers}
        note={tx(t, "mPdiv_liveGirNote", "Roots 1, 2, 3 give x³ − 6x² + 11x − 6: 6 is their sum, 11 = 1·2 + 1·3 + 2·3, and 6 is their product. Make one root 0 and the constant term vanishes.")} />
      <p>
        {tx(t, "mPdiv_girUse",
          "The relations help when something is known about the roots. Solve x³ − 9x² + 23x − 15 = 0 knowing that the roots are in arithmetic progression: write them m − d, m, m + d. Their sum is 3m = 9, so m = 3 is a root; dividing by (x − 3) with the device leaves x² − 6x + 5 = (x − 1)(x − 5), so the roots are 1, 3, 5. They also check results: the roots found for 2x³ − 3x² − 3x + 2 add up to 2 + 1/2 − 1 = 3/2 = −(−3)/2.")}
      </p>

      <H2>{tx(t, "mPdiv_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPdiv_ex1", "1. (x⁴ − 1) ÷ (x − 1) with the device: coefficients 1, 0, 0, 0, −1 give 1, 1, 1, 1 and remainder 0, so x⁴ − 1 = (x − 1)(x³ + x² + x + 1).")}</p>
      <p>{tx(t, "mPdiv_ex2", "2. The remainder of x¹⁰⁰ + 3 divided by x + 1 is (−1)¹⁰⁰ + 3 = 4, with no division at all.")}</p>
      <p>{tx(t, "mPdiv_ex3", "3. 3x³ + 4x² − 5x − 2: candidates ±1, ±2, ±1/3, ±2/3. p(1) = 0; the device leaves 3x² + 7x + 2 = (3x + 1)(x + 2), so the roots are 1, −1/3 and −2.")}</p>
      <p>{tx(t, "mPdiv_ex4", "4. The roots of x³ + 2x² − 5x + k = 0 add up to −2 whatever k is; their product is −k.")}</p>

      <MathPracticeFigure t={t} set="polyDivision" />

      <H2>{tx(t, "mPdiv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPdiv_tWrong", "Wrong"), tx(t, "mPdiv_tRight", "Right"), tx(t, "mPdiv_tWhy", "Why")]}
        rows={[
          [tx(t, "mPdiv_m1w", "dividing by x + 2 with r = 2"), "r = −2", tx(t, "mPdiv_m1", "x + 2 = x − (−2): r is the root of the divisor")],
          [tx(t, "mPdiv_m2w", "skipping a missing power"), tx(t, "mPdiv_m2r", "write a 0 in its column"), tx(t, "mPdiv_m2", "every column is one power of x")],
          [tx(t, "mPdiv_m3w", "÷ (2x − 1): the device's quotient as is"), tx(t, "mPdiv_m3r", "divide it by 2"), tx(t, "mPdiv_m3", "2x − 1 = 2(x − ½); the remainder stays the same")],
          [tx(t, "mPdiv_m4w", "subtracting in the device"), tx(t, "mPdiv_m4r", "multiply by r and add"), tx(t, "mPdiv_m4", "the sign is already inside r")],
          [tx(t, "mPdiv_m5w", "root sum of ax³ + bx² + … is b/a"), "−b/a", tx(t, "mPdiv_m5", "(x − r₁)(x − r₂)(x − r₃) has −(r₁ + r₂ + r₃)x²")],
          [tx(t, "mPdiv_m6w", "no candidate works ⇒ no roots"), tx(t, "mPdiv_m6r", "no rational roots"), tx(t, "mPdiv_m6", "x³ − 2 has the irrational root ∛2")],
        ]}
      />

      <KeyIdeas t={t} id="mPdiv" items={[
        "p = d·q + R with deg R < deg d; long division finds q and R one leading term at a time.",
        "Ruffini's rule divides by (x − r): bring down, multiply by r, add; the last number is the remainder.",
        "Write a 0 for every missing power. For ax − b, use r = b/a and divide the quotient by a.",
        "The remainder by (x − r) is p(r); it is 0 exactly when (x − r) is a factor; dividing again finds the multiplicity.",
        "Rational roots p/q of a whole-coefficient polynomial have p | a₀ and q | aₙ: test those candidates.",
        "Girard: for ax³ + bx² + cx + d the roots add to −b/a, their pair products to c/a, and multiply to −d/a.",
      ]} />
    </Article>
  );
}
