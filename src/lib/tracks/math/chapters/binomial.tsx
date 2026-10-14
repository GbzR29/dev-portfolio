"use client";

// Algebra 8: the binomial theorem — (a + b)² and (a + b)³ by hand and as
// pictures; where the coefficients come from (picking a or b from each
// bracket); Pascal's triangle from the expansions; factorials and the formula
// for C(n, k); the theorem; the general term, a chosen coefficient and the
// constant term; minus signs; sums of the coefficients; (1 + x)ⁿ ≈ 1 + nx.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BinomialFigure } from "@/components/lesson/figures/math/BinomialFigure";
import { PascalFigure } from "@/components/lesson/figures/math/PascalFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

const choose = (n: number, k: number) => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return c; };
const xp = (e: number) => (e === 0 ? "" : e === 1 ? "x" : `x^{${e}}`);

/** One term of (x + 2)ⁿ: C(n, k) · x^(n−k) · 2^k. */
function termOf(v: Record<string, number>) {
  const n = v.n, k = Math.min(v.k, n), c = choose(n, k), coef = c * 2 ** k;
  return { tex: r`\binom{${n}}{${k}}\,${xp(n - k) || "1"}\cdot 2^{${k}} = ${c}\cdot ${2 ** k}\,${xp(n - k)} = \green{${coef}}\,${xp(n - k)}` };
}

/** (1 + x)ⁿ next to 1 + nx. */
function approx(v: Record<string, number>) {
  const x = v.x, n = v.n, exact = (1 + x) ** n, lin = 1 + n * x;
  const f = (y: number) => y.toFixed(4);
  return {
    tex: r`(1 ${x < 0 ? "-" : "+"} ${Math.abs(x).toFixed(3)})^{${n}} = \green{${f(exact)}} \qquad 1 + ${n}\cdot${x < 0 ? `(${x.toFixed(3)})` : x.toFixed(3)} = \amber{${f(lin)}} \qquad |\Delta| = ${f(Math.abs(exact - lin))}`,
  };
}

export function BinomialContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mBin_intro",
          "A binomial is a sum of two terms, such as a + b or 2x − 1. You already know (a + b)² = a² + 2ab + b². But what is (a + b)⁷? Multiplying seven brackets out by hand is slow and easy to get wrong. This chapter shows that the answer follows a pattern. The numbers in front of the terms come from Pascal's triangle, and there is a formula for each of them. With it you can write any power of a binomial, or pick out a single term, without multiplying anything out.")}
      </Lead>

      <Goals t={t} id="mBin" items={[
        "Expand (a + b)² and (a + b)³, and see them as a square and a cube.",
        "Explain where the coefficients come from, and build Pascal's triangle.",
        "Compute C(n, k) with factorials, and write (a + b)ⁿ with the binomial theorem.",
        "Find one term of an expansion: a given power of x, or the constant term.",
        "Use (1 + x)ⁿ ≈ 1 + nx for small x.",
      ]} />

      <H2>{tx(t, "mBin_handTitle", "Squares and cubes by hand")}</H2>
      <p>
        {tx(t, "mBin_handBody",
          "Start with what the Polynomials chapter already does: multiply term by term, then collect like terms. For the square, each term of the first bracket multiplies each term of the second. That gives 4 products, and two of them, ab and ba, are the same term.")}
      </p>
      <Derivation t={t} label={tx(t, "mBin_eqSq", "Squaring a binomial")}
        steps={[
          { tex: r`(a + b)^2 = (a + b)(a + b)` },
          { tex: r`= a\cdot a + a\cdot b + b\cdot a + b\cdot b`, why: tx(t, "mBin_sq1", "every term of the first bracket times every term of the second: 2 × 2 = 4 products") },
          { tex: r`= a^2 + \amber{ab + ab} + b^2`, why: tx(t, "mBin_sq2", "b · a is the same as a · b, because multiplication does not care about order") },
          { tex: r`= \green{a^2 + 2ab + b^2}`, why: tx(t, "mBin_sq3", "collect the two equal terms") },
        ]} />
      <p>
        {tx(t, "mBin_cubeBody",
          "For the cube, multiply the square by one more (a + b). Each of the 3 terms of a² + 2ab + b² meets a and b. That makes 6 products, and the like terms are collected again.")}
      </p>
      <Derivation t={t} label={tx(t, "mBin_eqCube", "Cubing a binomial")}
        steps={[
          { tex: r`(a + b)^3 = (a^2 + 2ab + b^2)(a + b)` },
          { tex: r`= \amber{a^3 + 2a^2b + ab^2} + \purple{a^2b + 2ab^2 + b^3}`, why: tx(t, "mBin_cu1", "amber: each term times a; purple: each term times b") },
          { tex: r`= \green{a^3 + 3a^2b + 3ab^2 + b^3}`, why: tx(t, "mBin_cu2", "2a²b + a²b = 3a²b and ab² + 2ab² = 3ab²") },
        ]} />
      <p>
        {tx(t, "mBin_picBody",
          "Both results are areas and volumes. (a + b)² is the area of a square with side a + b. Cut it at a along both sides and you get one a × a square, one b × b square and two a × b rectangles. (a + b)³ is a cube cut the same way along all three directions, and it falls into 8 blocks. The figure shows both.")}
      </p>

      <BinomialFigure t={t} />

      <H2>{tx(t, "mBin_whyTitle", "Where the coefficients come from")}</H2>
      <p>
        {tx(t, "mBin_whyBody",
          "There is a faster way to see the coefficients than multiplying step by step. Write (a + b)ⁿ as n brackets side by side. To multiply them out, you take one term from each bracket, a or b, and multiply what you took. You do this in every possible way, and then add all the products.")}
      </p>
      <p>
        {tx(t, "mBin_whyBody2",
          "Each pick is a list of n letters. For n = 3, \"aba\" means a from the first bracket, b from the second and a from the third. Its product is a · b · a = a²b. Each bracket gives 2 choices, so there are 2 · 2 · 2 = 8 picks. Every pick with exactly one b gives a²b. There are 3 such picks (baa, aba, aab), because the single b can come from any one of the 3 brackets. So the coefficient of a²b is 3.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mBin_whyRule", "The coefficient of aⁿ⁻ᵏbᵏ is the number of ways to choose which k of the n brackets give b. The other n − k brackets give a. The \"picks\" mode of the figure lists them all.")}
      </Callout>

      <H2>{tx(t, "mBin_pascalTitle", "Pascal's triangle")}</H2>
      <p>
        {tx(t, "mBin_pascalBody",
          "Write the coefficients of (a + b)⁰, (a + b)¹, (a + b)², … one row each. Every row starts and ends with 1, because aⁿ and bⁿ each come from a single pick: a from every bracket, or b from every bracket. Every number inside a row is the sum of the two numbers just above it. The next derivation shows why: multiplying by one more (a + b) adds each coefficient to its neighbour.")}
      </p>
      <Derivation t={t} label={tx(t, "mBin_eqNext", "From row 3 to row 4")}
        steps={[
          { full: true, tex: r`(a + b)^4 = (a^3 + 3a^2b + 3ab^2 + b^3)(a + b)` },
          { full: true, tex: r`= (a^4 + 3a^3b + 3a^2b^2 + ab^3) + (a^3b + 3a^2b^2 + 3ab^3 + b^4)`, why: tx(t, "mBin_nx1", "times a, then times b: the second list is the first one shifted one place right") },
          { full: true, tex: r`= a^4 + (\amber{3 + 1})a^3b + (\amber{3 + 3})a^2b^2 + (\amber{1 + 3})ab^3 + b^4`, why: tx(t, "mBin_nx2", "each new coefficient is the sum of two neighbours of row 3: 1 3 3 1") },
          { full: true, tex: r`= \green{a^4 + 4a^3b + 6a^2b^2 + 4ab^3 + b^4}`, why: tx(t, "mBin_nx3", "row 4 is 1 4 6 4 1") },
        ]} />

      <PascalFigure t={t} />

      <H2>{tx(t, "mBin_formulaTitle", "A formula for each coefficient")}</H2>
      <p>
        {tx(t, "mBin_factBody",
          "Building the triangle row by row works, but row 20 takes a while. A formula gives one number straight away. It uses the factorial: n! (read \"n factorial\") is the product of the whole numbers from 1 to n. So 4! = 4 · 3 · 2 · 1 = 24. By convention 0! = 1, the empty product, for the same reason that b⁰ = 1.")}
      </p>
      <Derivation t={t} label={tx(t, "mBin_eqWhy", "Counting the ways to choose k brackets")}
        steps={[
          { full: true, tex: r`n\cdot(n-1)\cdots(n-k+1)`, why: tx(t, "mBin_wh1", "choose the k brackets one at a time: n choices for the first, n − 1 for the second, and so on, k factors in all") },
          { full: true, tex: r`k! = k\cdot(k-1)\cdots 1`, why: tx(t, "mBin_wh2", "but that counts each set of k brackets once for every order in which it could be picked, and k things can be ordered in k! ways") },
          { full: true, tex: r`\binom{n}{k} = \frac{n\cdot(n-1)\cdots(n-k+1)}{k!}`, why: tx(t, "mBin_wh3", "so divide by k! to count each set once") },
          { full: true, tex: r`= \frac{n!}{k!\,(n-k)!}`, why: tx(t, "mBin_wh4", "multiply top and bottom by (n − k)!: the top becomes the whole product n!") },
        ]} />
      <Equation label={tx(t, "mBin_eqChoose", "The binomial coefficient")}
        where={[
          [r`\binom{n}{k}`, tx(t, "mBin_wChoose", "read \"n choose k\", also written C(n, k): the number of ways to choose k of n brackets, and entry k of row n of Pascal's triangle (both counted from 0)")],
          [r`n!`, tx(t, "mBin_wFact", "n factorial: 1 · 2 · 3 ⋯ n; and 0! = 1")],
          [r`k`, tx(t, "mBin_wK", "a whole number from 0 to n")],
        ]}
        words={tx(t, "mBin_chooseWords", "The number of ways to choose k things out of n is n factorial divided by k factorial and by n minus k factorial.")}
        note={tx(t, "mBin_chooseNote", "Example: C(5, 2) = 5!/(2! · 3!) = 120/(2 · 6) = 10. Faster: (5 · 4)/(2 · 1) = 10. Swapping k and n − k only swaps the two factorials underneath, so C(n, k) = C(n, n − k). That is why every row reads the same from both ends.")}>
        {r`\binom{n}{k} = \frac{n!}{k!\,(n-k)!}`}
      </Equation>
      <Equation label={tx(t, "mBin_eqThm", "The binomial theorem")}
        where={[
          [r`\sum_{k=0}^{n}`, tx(t, "mBin_wSum", "add the terms for k = 0, 1, 2, …, n: there are n + 1 terms")],
          [r`\binom{n}{k}`, tx(t, "mBin_wCoef", "the coefficient: the number of picks with b from exactly k brackets")],
          [r`a^{n-k}`, tx(t, "mBin_wA", "a from the other n − k brackets; its power goes down by one from term to term")],
          [r`b^{k}`, tx(t, "mBin_wB", "b from k brackets; its power goes up by one. In every term the two powers add up to n")],
        ]}
        words={tx(t, "mBin_thmWords", "To raise a plus b to the n-th power, add up, for every k from 0 to n, the number n choose k times a to the n minus k times b to the k.")}
        note={tx(t, "mBin_thmNote", "For n = 5: (a + b)⁵ = a⁵ + 5a⁴b + 10a³b² + 10a²b³ + 5ab⁴ + b⁵. The coefficients 1 5 10 10 5 1 are row 5.")}>
        {r`(a+b)^n = \sum_{k=0}^{n} \binom{n}{k}\,a^{\,n-k}\,b^{\,k}`}
      </Equation>

      <H2>{tx(t, "mBin_termTitle", "One term at a time")}</H2>
      <p>
        {tx(t, "mBin_termBody",
          "Often you need just one term, for example the term with x⁵ in (2x − 1)⁷. Writing all 8 terms would be wasteful. The term with index k is called the general term. Note that k starts at 0, so the term with index k is the (k + 1)-th term. To find one term, set a and b to the two parts of the bracket, signs included. Then find the k that gives the power you want.")}
      </p>
      <Equation label={tx(t, "mBin_eqTerm", "The general term")}
        where={[
          [r`T_{k+1}`, tx(t, "mBin_wT", "the (k + 1)-th term of the expansion, counting from the start")],
          [r`a,\; b`, tx(t, "mBin_wAB", "the two parts of the bracket, with their signs and numbers: in (2x − 1)ⁿ, a = 2x and b = −1")],
        ]}
        words={tx(t, "mBin_termWords", "Term number k plus one is n choose k, times the first part to the n minus k, times the second part to the k.")}>
        {r`T_{k+1} = \binom{n}{k}\,a^{\,n-k}\,b^{\,k}`}
      </Equation>
      <Derivation t={t} label={tx(t, "mBin_eqEx1", "The coefficient of x⁵ in (2x − 1)⁷")}
        steps={[
          { full: true, tex: r`a = 2x,\quad b = -1,\quad n = 7`, why: tx(t, "mBin_e11", "read the parts off the bracket, sign included") },
          { full: true, tex: r`T_{k+1} = \binom{7}{k}\,(2x)^{7-k}\,(-1)^{k}`, why: tx(t, "mBin_e12", "the general term") },
          { full: true, tex: r`7 - k = 5 \;\Rightarrow\; k = 2`, why: tx(t, "mBin_e13", "x only appears in (2x)^(7−k), so its power is 7 − k") },
          { full: true, tex: r`\binom{7}{2}\,(2x)^5\,(-1)^2 = 21 \cdot 32x^5 \cdot 1`, why: tx(t, "mBin_e14", "C(7, 2) = 7 · 6/2 = 21; (2x)⁵ = 2⁵x⁵ = 32x⁵, so the 2 is raised to the power too") },
          { full: true, tex: r`= \green{672}\,x^5`, why: tx(t, "mBin_e15", "the coefficient is 672") },
        ]} />
      <LiveFormula label={tx(t, "mBin_liveTerm", "Try it: any term of (x + 2)ⁿ")}
        tex={r`T_{k+1} = \binom{n}{k}\,x^{\,n-k}\cdot 2^{k}`}
        vars={[
          { id: "n", label: "n", min: 1, max: 8, step: 1, value: 5, fmt: v => String(v) },
          { id: "k", label: "k", min: 0, max: 8, step: 1, value: 2, fmt: v => String(v) },
        ]}
        compute={termOf}
        note={tx(t, "mBin_liveTermNote", "The green number is the coefficient of the term. When k is larger than n it is held at n, since (x + 2)ⁿ has only n + 1 terms. Notice how the powers of 2 make the late terms large even where C(n, k) is small.")} />

      <H3>{tx(t, "mBin_constTitle", "The constant term")}</H3>
      <p>
        {tx(t, "mBin_constBody",
          "When both parts of the bracket contain x, the powers of x combine, and some term may have no x at all. That term is the constant term. To find it, write the power of x in the general term and set it to 0.")}
      </p>
      <Derivation t={t} label={tx(t, "mBin_eqEx2", "The constant term of (x + 1/x)⁶")}
        steps={[
          { full: true, tex: r`T_{k+1} = \binom{6}{k}\,x^{6-k}\left(\tfrac{1}{x}\right)^{k}`, why: tx(t, "mBin_e21", "a = x, b = 1/x") },
          { full: true, tex: r`= \binom{6}{k}\,x^{6-k}\,x^{-k} = \binom{6}{k}\,x^{6-2k}`, why: tx(t, "mBin_e22", "1/x = x⁻¹, and multiplying adds the exponents") },
          { full: true, tex: r`6 - 2k = 0 \;\Rightarrow\; k = 3`, why: tx(t, "mBin_e23", "no x means the power of x is 0") },
          { full: true, tex: r`\binom{6}{3} = \frac{6\cdot5\cdot4}{3\cdot2\cdot1} = \green{20}`, why: tx(t, "mBin_e24", "the constant term is 20") },
        ]} />

      <H2>{tx(t, "mBin_signTitle", "Minus signs")}</H2>
      <p>
        {tx(t, "mBin_signBody",
          "For (a − b)ⁿ, use the theorem with b replaced by −b. The factor (−b)ᵏ is positive when k is even and negative when k is odd. So the signs alternate +, −, +, −, …, starting with + on aⁿ. The coefficients themselves do not change.")}
      </p>
      <Equation label={tx(t, "mBin_eqMinus", "A difference raised to a power")}
        where={[
          [r`(-1)^k`, tx(t, "mBin_wSign", "+1 for even k, −1 for odd k: the sign of each term")],
        ]}
        note={tx(t, "mBin_minusNote", "Example: (x − 1)⁴ = x⁴ − 4x³ + 6x² − 4x + 1.")}>
        {r`(a-b)^n = \sum_{k=0}^{n} (-1)^k \binom{n}{k}\,a^{\,n-k}\,b^{\,k}`}
      </Equation>

      <H2>{tx(t, "mBin_sumTitle", "Adding up the coefficients")}</H2>
      <p>
        {tx(t, "mBin_sumBody",
          "Put a = b = 1 in the theorem. The left side becomes 2ⁿ, and on the right every term becomes just its coefficient. So each row of Pascal's triangle adds up to a power of 2: 1 + 4 + 6 + 4 + 1 = 16 = 2⁴. This matches the picks: there are 2ⁿ of them, and each one lands in exactly one term. Put a = 1 and b = −1 instead, and the left side is 0ⁿ = 0. So the alternating sum of a row is 0: 1 − 4 + 6 − 4 + 1 = 0.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mBin_sumTip", "The same trick works for any expanded polynomial: its coefficients add up to its value at x = 1. The coefficients of (2x + 1)³ = 8x³ + 12x² + 6x + 1 add up to 27, which is (2 + 1)³. This is a quick way to check an expansion.")}
      </Callout>

      <H2>{tx(t, "mBin_approxTitle", "Small x: (1 + x)ⁿ ≈ 1 + nx")}</H2>
      <p>
        {tx(t, "mBin_approxBody",
          "Expand (1 + x)ⁿ with a = 1 and b = x: 1 + nx + C(n, 2)x² + C(n, 3)x³ + …. When x is small, x² is much smaller still: for x = 0.01, x² = 0.0001. So all the terms after the first two are tiny, and 1 + nx is a good approximation. For example, 1.01¹⁰ ≈ 1 + 10 · 0.01 = 1.1, while the true value is 1.1046. The error grows as x or n grows, because the x² term, about n²x²/2, gets bigger.")}
      </p>
      <LiveFormula label={tx(t, "mBin_liveApprox", "Try it: the exact power against 1 + nx")}
        tex={r`(1 + x)^n \approx 1 + nx`}
        vars={[
          { id: "x", label: "x", min: -0.2, max: 0.2, step: 0.005, value: 0.01, fmt: v => v.toFixed(3) },
          { id: "n", label: "n", min: 2, max: 20, step: 1, value: 10, fmt: v => String(v) },
        ]}
        compute={approx}
        note={tx(t, "mBin_liveApproxNote", "Green is the exact power, amber the approximation. Keep x near 0 and they agree to several decimals. Move x to 0.2 with n = 20 and the approximation falls far short, because the dropped terms are no longer small. The Taylor Series chapter extends this idea to any function.")} />

      <MathPracticeFigure t={t} set="binomial" />

      <H2>{tx(t, "mBin_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mBin_tWrong", "Wrong"), tx(t, "mBin_tRight", "Right"), tx(t, "mBin_tWhy", "Why")]}
        rows={[
          ["(a + b)² = a² + b²", "a² + 2ab + b²", tx(t, "mBin_m1", "the two ab rectangles of the square are missing")],
          [tx(t, "mBin_m2w", "(2x)⁵ = 2x⁵"), "32x⁵", tx(t, "mBin_m2", "the power applies to the number inside the bracket too")],
          [tx(t, "mBin_m3w", "(x − 1)⁴ with all signs +"), "x⁴ − 4x³ + 6x² − 4x + 1", tx(t, "mBin_m3", "b is −1, and (−1)ᵏ alternates the signs")],
          [tx(t, "mBin_m4w", "the 3rd term uses k = 3"), "k = 2", tx(t, "mBin_m4", "k counts from 0, so term number k + 1 uses k")],
          [tx(t, "mBin_m5w", "(a + b)ⁿ has n terms"), tx(t, "mBin_m5r", "n + 1 terms"), tx(t, "mBin_m5", "k runs from 0 to n")],
          ["0! = 0", "0! = 1", tx(t, "mBin_m6", "the empty product is 1, which keeps C(n, 0) = C(n, n) = 1")],
        ]}
      />

      <KeyIdeas t={t} id="mBin" items={[
        "(a + b)² = a² + 2ab + b² and (a + b)³ = a³ + 3a²b + 3ab² + b³: a square and a cube cut into pieces.",
        "Multiplying out (a + b)ⁿ picks a or b from each bracket; the coefficient of aⁿ⁻ᵏbᵏ counts the picks with k b's.",
        "Those counts form Pascal's triangle: each entry is the sum of the two above it.",
        "C(n, k) = n!/(k!(n − k)!), and (a + b)ⁿ = Σ C(n, k) aⁿ⁻ᵏ bᵏ for k = 0 … n.",
        "One term: T_(k+1) = C(n, k) aⁿ⁻ᵏ bᵏ; set the power of x to what you want and solve for k.",
        "Signs alternate in (a − b)ⁿ; a row adds up to 2ⁿ; for small x, (1 + x)ⁿ ≈ 1 + nx.",
      ]} />
    </Article>
  );
}
