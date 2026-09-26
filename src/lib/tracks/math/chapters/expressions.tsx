"use client";

// Algebra 1: expressions — variables, terms and coefficients, evaluating by
// substitution, combining like terms, the distributive law and expanding two
// brackets, factoring out a common factor, and expressions as C++ code.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { AlgebraTilesFigure } from "@/components/lesson/figures/math/AlgebraTilesFigure";

const r = String.raw;

export function ExpressionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mExpr_intro",
          "Arithmetic works with particular numbers: 3 × 4 + 2. Algebra starts the moment you replace one of those numbers with a name, 3 × n + 2, and say \"this works for any n\". That one change turns a single calculation into a rule you can reuse, rearrange and reason about. This chapter is about the objects algebra manipulates, expressions: how they are built, how to evaluate them, and the handful of rewriting rules, all of them old friends from arithmetic, that let you turn one expression into a simpler equal one.")}
      </Lead>

      <H2>{tx(t, "mExpr_varTitle", "Variables: names for numbers")}</H2>
      <p>
        {tx(t, "mExpr_varBody",
          "A variable is a letter (or a word) that stands for a number. It plays one of two roles. Sometimes it is a placeholder for any number: in \"the area of a rectangle is w × h\", w and h can be anything, and the rule holds for all of them. Sometimes it is an unknown: in \"some number doubled plus 3 is 11\", there is one particular number we do not know yet, and the next chapter is about finding it. In both cases the letter behaves exactly like a number in every calculation, because it is one; we just have not said which.")}
      </p>
      <p>
        {tx(t, "mExpr_varBody2",
          "Programmers already think this way. In float speed = distance / time; the names are variables, and the line is a rule that works for whatever values they hold when it runs. The difference is that in code a variable always has a current value, while in algebra we are allowed to reason about it before choosing one.")}
      </p>

      <H2>{tx(t, "mExpr_partsTitle", "The parts of an expression")}</H2>
      <p>
        {tx(t, "mExpr_partsBody",
          "An expression is any combination of numbers, variables and operations that has a value once the variables are given values: 3x + 2, a² − 2ab + b², (v + 1)/2. It is not a statement: it has no = sign and is neither true nor false. An expression is made of terms, the parts joined by + and − at the top level. Each term is a coefficient (the number in front) times the variable part.")}
      </p>
      <Equation label={tx(t, "mExpr_eqParts", "Anatomy of an expression")}
        where={[
          [r`5x^2,\ -3x,\ 7`, tx(t, "mExpr_wTerms", "the three terms. The minus sign belongs to the term that follows it: 5x² − 3x + 7 is 5x² + (−3x) + 7")],
          [r`5,\ -3`, tx(t, "mExpr_wCoef", "the coefficients: the numbers multiplying the variable part. x alone has coefficient 1, and −x has coefficient −1")],
          [r`7`, tx(t, "mExpr_wConst", "the constant term: a term with no variable, so its value never changes")],
          [r`x^2,\ x`, tx(t, "mExpr_wVarPart", "the variable parts. Terms with the same variable part (same letters, same powers) are called like terms")],
        ]}>
        {r`5x^2 - 3x + 7`}
      </Equation>
      <H3>{tx(t, "mExpr_notationTitle", "Notation shortcuts")}</H3>
      <LessonTable
        headers={[tx(t, "mExpr_tWritten", "Written"), tx(t, "mExpr_tMeans", "Means"), tx(t, "mExpr_tNote", "Note")]}
        rows={[
          ["3x", "3 × x", tx(t, "mExpr_n1", "the multiplication sign is left out between a number and a letter, or two letters: ab = a × b")],
          ["x", "1 · x", tx(t, "mExpr_n2", "a coefficient of 1 is not written")],
          ["−x", "(−1) · x", tx(t, "mExpr_n3", "the opposite of x; it is negative only if x is positive")],
          ["x²", "x · x", tx(t, "mExpr_n4", "powers from the Powers & Roots chapter; x² is not 2x")],
          ["2(x + 1)", "2 × (x + 1)", tx(t, "mExpr_n5", "a number touching a bracket multiplies all of it")],
          ["x/2", tx(t, "mExpr_n6a", "x ÷ 2, also ½x"), tx(t, "mExpr_n6", "dividing by 2 is multiplying by ½")],
        ]}
      />

      <H2>{tx(t, "mExpr_evalTitle", "Evaluating: substitution")}</H2>
      <p>
        {tx(t, "mExpr_evalBody",
          "To evaluate an expression, replace every occurrence of each variable by its value, then compute using the order of operations. The one habit that prevents most mistakes: put the substituted value in parentheses, especially when it is negative. Squaring x when x = −3 must give (−3)² = 9, but writing −3² gives −9.")}
      </p>
      <Equation label={tx(t, "mExpr_eqEval", "Substituting x = −3")}
        notes={[
          tx(t, "mExpr_ev1", "replace every x with (−3), in parentheses"),
          tx(t, "mExpr_ev2", "powers first: (−3)² = 9, so 2 · 9 = 18"),
          tx(t, "mExpr_ev3", "then the products: −5 · (−3) = +15"),
          tx(t, "mExpr_ev4", "finally add left to right: 18 + 15 + 1 = 34"),
        ]}>
        {r`2x^2 - 5x + 1 \;\to\; 2(-3)^2 - 5(-3) + 1 = 18 + 15 + 1 = 34`}
      </Equation>

      <H2>{tx(t, "mExpr_likeTitle", "Combining like terms")}</H2>
      <p>
        {tx(t, "mExpr_likeBody",
          "3 apples plus 2 apples is 5 apples, but 3 apples plus 2 pears stays 3 apples + 2 pears. Terms work the same way: 3x + 2x = 5x, because both count x's, but 3x + 2 cannot be merged, because x and 1 are different kinds of thing. To simplify, gather the like terms (same variable part) and add their coefficients. Subtracted terms count as negative coefficients. Nothing about the value changes; you have only rewritten the same quantity in fewer symbols.")}
      </p>
      <Equation label={tx(t, "mExpr_eqLike", "Why 3x + 2x = 5x")}
        where={[
          [r`3x + 2x`, tx(t, "mExpr_wLike1", "three x's and two more x's")],
          [r`(3 + 2)x`, tx(t, "mExpr_wLike2", "the distributive law read backwards: a common factor x taken out")],
          [r`x^2 + x`, tx(t, "mExpr_wLike3", "not like terms: x² and x are different variable parts, so this does not simplify to 2x³ or anything else")],
        ]}>
        {r`3x + 2x = (3 + 2)\,x = 5x`}
      </Equation>

      <AlgebraTilesFigure t={t} />

      <H2>{tx(t, "mExpr_distTitle", "The distributive law")}</H2>
      <p>
        {tx(t, "mExpr_distBody",
          "A number multiplying a bracket multiplies every term inside it. The tiles show why: a rectangle k wide and x + c long has the same area as the two pieces k·x and k·c put side by side. Going left to right (removing the brackets) is called expanding; going right to left (putting a common factor outside a bracket) is called factoring. They are the same law read in two directions, and algebra uses both constantly.")}
      </p>
      <Equation label={tx(t, "mExpr_eqDist", "Distribute, and with a minus sign")}
        where={[
          [r`k(a + b) = ka + kb`, tx(t, "mExpr_wDist", "the factor k reaches every term inside the bracket, not just the first")],
          [r`-(a - b) = -a + b`, tx(t, "mExpr_wMinus", "a minus sign before a bracket is a factor of −1, so it flips the sign of every term inside")],
          [r`a - 2(x - 3) = a - 2x + 6`, tx(t, "mExpr_wMinus2", "the −2 multiplies the −3 as well: (−2)(−3) = +6")],
        ]}>
        {r`k\,(a + b) = k\,a + k\,b`}
      </Equation>

      <H3>{tx(t, "mExpr_foilTitle", "Two brackets")}</H3>
      <p>
        {tx(t, "mExpr_foilBody",
          "To multiply two brackets, apply the law twice: every term of the first bracket multiplies every term of the second. With two terms in each, that gives four products (some schools call the order First, Outer, Inner, Last: FOIL). Then collect like terms. The \"two brackets\" mode of the figure is the picture: four rectangles make up the big one.")}
      </p>
      <Equation label={tx(t, "mExpr_eqFoil", "Expanding two brackets")}
        where={[
          [r`x \cdot x`, tx(t, "mExpr_wF", "first terms: x²")],
          [r`x \cdot b + a \cdot x`, tx(t, "mExpr_wOI", "outer and inner: both are x terms, so they combine into (a + b)x")],
          [r`a \cdot b`, tx(t, "mExpr_wL", "last terms: the constant")],
        ]}>
        {r`(x + a)(x + b) = x^2 + (a + b)\,x + ab`}
      </Equation>
      <p>
        {tx(t, "mExpr_specialBody",
          "Three products appear so often that they are worth knowing by sight. They are special cases of the rule above, and they will come back in the quadratics chapter and in every vector length calculation.")}
      </p>
      <Equation label={tx(t, "mExpr_eqSpecial", "Three special products")}
        where={[
          [r`(a + b)^2`, tx(t, "mExpr_wSq1", "a² + 2ab + b²: the middle term 2ab is the two rectangles a·b; forgetting it is the most common algebra mistake")],
          [r`(a - b)^2`, tx(t, "mExpr_wSq2", "a² − 2ab + b²: the same with b replaced by −b")],
          [r`(a + b)(a - b)`, tx(t, "mExpr_wDiff", "a² − b²: the middle terms +ab and −ab cancel. Mental maths trick: 21 × 19 = (20 + 1)(20 − 1) = 400 − 1 = 399")],
        ]}>
        {r`(a + b)^2 = a^2 + 2ab + b^2 \qquad (a + b)(a - b) = a^2 - b^2`}
      </Equation>

      <H3>{tx(t, "mExpr_factTitle", "Factoring out a common factor")}</H3>
      <p>
        {tx(t, "mExpr_factBody",
          "Reading the distributive law backwards: if every term shares a factor, pull it out in front of a bracket. Find the greatest common divisor of the coefficients (the GCD from the divisibility chapter) and the lowest power of each shared variable. Check by expanding back. Factored forms are often more useful: 6x² + 9x = 3x(2x + 3) shows at a glance that the expression is zero when x = 0 or when 2x + 3 = 0.")}
      </p>
      <Equation label={tx(t, "mExpr_eqFact", "Pulling out the common factor")}
        where={[
          [r`3`, tx(t, "mExpr_wF3", "gcd(6, 9) = 3")],
          [r`x`, tx(t, "mExpr_wFx", "both terms contain at least one x")],
          [r`2x + 3`, tx(t, "mExpr_wFrest", "what remains of each term after dividing it by 3x: 6x²/3x = 2x and 9x/3x = 3")],
        ]}>
        {r`6x^2 + 9x = 3x\,(2x + 3)`}
      </Equation>

      <H2>{tx(t, "mExpr_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mExpr_ex1T", "Simplify 4(x − 2) − (x − 5)")}</H3>
      <Equation label={tx(t, "mExpr_eqEx1", "Expand, then collect")}
        notes={[
          tx(t, "mExpr_ex1a", "distribute the 4: 4x − 8"),
          tx(t, "mExpr_ex1b", "the minus before the second bracket flips both signs inside: −x + 5"),
          tx(t, "mExpr_ex1c", "collect: 4x − x = 3x and −8 + 5 = −3"),
          tx(t, "mExpr_ex1d", "check with x = 1: 4(−1) − (−4) = 0, and 3 − 3 = 0 ✓"),
        ]}>
        {r`4(x - 2) - (x - 5) = 4x - 8 - x + 5 = 3x - 3`}
      </Equation>
      <H3>{tx(t, "mExpr_ex2T", "A game formula")}</H3>
      <p>
        {tx(t, "mExpr_ex2",
          "A shop sells a sword for 50 gold plus 20 gold per upgrade level L, with a 10% discount on the whole price: 0.9(50 + 20L). Expanded, that is 45 + 18L: the base price after discount is 45, and each level adds 18. Both forms give the same price, 0.9 × 110 = 99 and 45 + 54 = 99 for L = 3, but the expanded one says directly what each level costs.")}
      </p>
      <H3>{tx(t, "mExpr_ex3T", "The midpoint")}</H3>
      <p>
        {tx(t, "mExpr_ex3",
          "The midpoint of a and b is (a + b)/2. Rewrite it as a + (b − a)/2: expand the second form, a + b/2 − a/2 = a/2 + b/2 = (a + b)/2. Same value, but the second form never adds a and b together, so for large integers it cannot overflow. That is why binary search implementations use lo + (hi − lo)/2. Rewriting expressions into equal but safer forms is everyday programming work.")}
      </p>

      <H2>{tx(t, "mExpr_codeTitle", "Expressions in C++")}</H2>
      <p>
        {tx(t, "mExpr_codeBody",
          "A C++ expression is an algebraic expression with a type. Every rule above holds for exact integers (until they overflow), but floating-point numbers are rounded after each operation, so rewrites that are equal on paper can give slightly different results. The compiler knows this and, by default, will not reorder float arithmetic for you.")}
      </p>
      <CodeBlock lang="cpp" filename="expressions.cpp" t={t}>{`// 2x² − 5x + 1 — "evaluate by substitution" is just calling the function
float poly(float x) { return 2 * x * x - 5 * x + 1; }

// Same value, fewer multiplications: factor x out of the first two terms (Horner's form)
float polyHorner(float x) { return (2 * x - 5) * x + 1; }

// Integers: equal on paper, different in code
int midBad  = (lo + hi) / 2;        // lo + hi can overflow int
int midGood = lo + (hi - lo) / 2;   // same value, never overflows

// Floats: (a + b) + c and a + (b + c) can differ in the last bits,
// so the compiler keeps your order unless you allow -ffast-math.`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "mExpr_checkTip", "The fastest way to catch an algebra slip: pick an easy value (x = 1, x = 2, never x = 0 alone, because it hides mistakes in the x terms) and evaluate both the original and your rewritten expression. If they differ, the rewrite is wrong. If they agree for two or three values, it is very probably right.")}
      </Callout>

      <H2>{tx(t, "mExpr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mExpr_tWrong", "Wrong"), tx(t, "mExpr_tRight", "Right"), tx(t, "mExpr_tWhy", "Why")]}
        rows={[
          ["3x + 2 = 5x", tx(t, "mExpr_m1r", "3x + 2 (already simplest)"), tx(t, "mExpr_m1", "x terms and constants are not like terms")],
          ["x² + x² = x⁴", "x² + x² = 2x²", tx(t, "mExpr_m2", "adding counts copies; only multiplying adds exponents")],
          ["2(x + 3) = 2x + 3", "2(x + 3) = 2x + 6", tx(t, "mExpr_m3", "the factor multiplies every term in the bracket")],
          ["−(x − 4) = −x − 4", "−(x − 4) = −x + 4", tx(t, "mExpr_m4", "a minus before a bracket flips every sign inside")],
          ["(a + b)² = a² + b²", "a² + 2ab + b²", tx(t, "mExpr_m5", "the two a·b rectangles are missing; try a = b = 1: 4 ≠ 2")],
          ["−x² with x = −3 → 9", "−(−3)² = −9", tx(t, "mExpr_m6", "substitute in parentheses; the power comes before the minus")],
        ]}
      />

      <KeyIdeas t={t} id="mExpr" items={[
        "A variable is a number you have not named yet; it obeys every rule numbers obey.",
        "Terms are the pieces joined by + and −; each is a coefficient times a variable part.",
        "Evaluate by substituting in parentheses, then following the order of operations.",
        "Only like terms (same variable part) combine: add their coefficients.",
        "k(a + b) = ka + kb: expanding reads it left to right, factoring right to left.",
        "(a + b)² = a² + 2ab + b², never a² + b²; check rewrites by plugging in a number.",
      ]} />
    </Article>
  );
}
