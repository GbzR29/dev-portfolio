"use client";

// Logic & Proof 4: summation — reading Σ again (dummy index, number of terms,
// the empty sum); linearity and its limits; splitting the range, shifting and
// reversing the index; the standard sums Σc, Σk, Σk², Σk³ and the geometric
// sum, each derived; telescoping sums; double sums and swapping their order;
// products Π and how logarithms turn them into sums.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SummationFigure } from "@/components/lesson/figures/math/SummationFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** Σk² term by term against the closed form. */
function squaresNumbers(v: Record<string, number>) {
  const n = v.n;
  const terms = Array.from({ length: Math.min(n, 6) }, (_, i) => `${(i + 1) ** 2}`).join(" + ") + (n > 6 ? r` + \dots + ${n * n}` : "");
  const direct = Array.from({ length: n }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0);
  return {
    tex: r`${terms} = \amber{${direct}} \qquad \frac{${n} \cdot ${n + 1} \cdot ${2 * n + 1}}{6} = \green{${(n * (n + 1) * (2 * n + 1)) / 6}}`,
  };
}

/** A geometric sum a + ar + … + arⁿ, added up and from the formula. */
function geoNumbers(v: Record<string, number>) {
  const { a, q, n } = v;
  let s = 0;
  for (let k = 0; k <= n; k++) s += a * q ** k;
  const f = q === 1 ? a * (n + 1) : (a * (q ** (n + 1) - 1)) / (q - 1);
  const fmt = (x: number) => String(+x.toFixed(4)).replace("-", "−");
  return {
    tex: q === 1
      ? r`r = 1:\ \ \text{all } ${n + 1} \text{ terms equal } ${fmt(a)} \;\Rightarrow\; S = \green{${fmt(f)}}`
      : r`S = ${fmt(a)} \cdot \frac{${fmt(q)}^{${n + 1}} - 1}{${fmt(q)} - 1} = \green{${fmt(f)}} \qquad \text{(${fmt(s)})}`,
  };
}

export function SummationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSum_intro",
          "The Sequences chapter introduced Σ as shorthand for \"add all of these up\" and found two sums in closed form. This chapter turns Σ into a tool you can calculate with. A handful of rules let you pull sums apart, shift them, flip them and nest them; a handful of standard sums cover most of what you meet; and one trick, telescoping, makes long sums collapse to a single subtraction. These rules come back everywhere: in averages and variances, in integrals as limits of sums, in matrix products and in the proofs by induction of the next chapter.")}
      </Lead>

      <Goals t={t} id="mSum" items={[
        "Read and write Σ notation, and count its terms.",
        "Use linearity, splitting and index shifts to rearrange a sum.",
        "Derive and use the sums of 1, k, k², k³ and of a geometric sequence.",
        "Collapse a telescoping sum, swap the order of a double sum, and turn a product into a sum.",
      ]} />

      <H2>{tx(t, "mSum_readTitle", "Reading Σ, carefully")}</H2>
      <p>
        {tx(t, "mSum_readBody",
          "A sum in sigma notation has four parts: the index variable (often k, i or j), its first value below the Σ, its last value above, and the term to the right, a formula in the index. You get the sum by putting each whole number from the first value to the last into the term and adding the results. The index is a dummy variable: it only exists inside the sum, so renaming it changes nothing. Σₖ k² and Σⱼ j² are the same number, just as ∫ x dx and ∫ t dt are.")}
      </p>
      <Equation label={tx(t, "mSum_eqRead", "The parts of a sum")}
        where={[
          [r`k`, tx(t, "mSum_wK", "the index: a dummy variable that steps through whole numbers")],
          [r`m`, tx(t, "mSum_wM", "the first value of the index (the lower limit)")],
          [r`n`, tx(t, "mSum_wN", "the last value, included (the upper limit)")],
          [r`a_k`, tx(t, "mSum_wA", "the term: a formula in k, evaluated once for each k")],
        ]}
        note={tx(t, "mSum_readNote", "Example: Σ from k = 3 to 6 of (2k − 1) = 5 + 7 + 9 + 11 = 32.")}
        words={tx(t, "mSum_readWords", "Put each whole number k from m to n into the term, and add up everything you get.")}>
        {r`\sum_{k=m}^{n} a_k = a_m + a_{m+1} + \dots + a_n`}
      </Equation>
      <p>
        {tx(t, "mSum_countBody",
          "Two small facts avoid many slips. From k = m to k = n there are n − m + 1 terms, not n − m: from 3 to 6 there are four (3, 4, 5, 6). Count fence posts, not gaps. And if the upper limit is below the lower one, there is nothing to add: the empty sum is 0 by convention, which is what makes rules like splitting work at the edges.")}
      </p>

      <H2>{tx(t, "mSum_linTitle", "Linearity: what you can pull out")}</H2>
      <p>
        {tx(t, "mSum_linBody",
          "A constant factor that does not depend on the index is in every term, so it can be taken out as a common factor. A sum of two terms can be split into two sums, because addition can be done in any order. Together these two rules are called linearity. A third rule follows: adding the constant c once for each of the n − m + 1 values of k gives c times the number of terms.")}
      </p>
      <Derivation t={t} label={tx(t, "mSum_eqLin", "Why linearity holds")}
        steps={[
          { full: true, tex: r`\sum_{k=1}^{n} (c\,a_k + b_k) = (c\,a_1 + b_1) + (c\,a_2 + b_2) + \dots + (c\,a_n + b_n)`, why: tx(t, "mSum_l1", "write the sum out") },
          { full: true, tex: r`= (c\,a_1 + c\,a_2 + \dots + c\,a_n) + (b_1 + b_2 + \dots + b_n)`, why: tx(t, "mSum_l2", "regroup: all the a-parts first, then all the b-parts (finite sums can be reordered)") },
          { full: true, tex: r`= c\,(a_1 + a_2 + \dots + a_n) + (b_1 + \dots + b_n)`, why: tx(t, "mSum_l3", "c is a common factor of the first group") },
          { full: true, tex: r`= \green{c \sum_{k=1}^{n} a_k + \sum_{k=1}^{n} b_k}`, why: tx(t, "mSum_l4", "back to sigma notation") },
        ]} />
      <Equation label={tx(t, "mSum_eqConst", "Adding a constant")}
        where={[
          [r`c`, tx(t, "mSum_wC", "a number that does not depend on k")],
          [r`n - m + 1`, tx(t, "mSum_wCount", "the number of terms")],
        ]}
        note={tx(t, "mSum_constNote", "So Σ from k = 1 to 10 of 2 is 20, not 2. A frequent mistake is to add the constant only once.")}>
        {r`\sum_{k=m}^{n} c = c\,(n - m + 1)`}
      </Equation>
      <Callout type="warn" t={t}>
        {tx(t, "mSum_notLin", "Linearity is about sums and constant factors only. A sum of products is not the product of the sums, and a sum of squares is not the square of the sum: Σ k² from 1 to 3 is 1 + 4 + 9 = 14, while (Σ k)² = 6² = 36.")}
      </Callout>

      <H2>{tx(t, "mSum_shiftTitle", "Splitting, shifting and reversing")}</H2>
      <p>
        {tx(t, "mSum_splitBody",
          "A sum over a long range can be cut at any point into two consecutive sums. Read backwards, this is how you get a sum that does not start at 1: take the sum from 1 and subtract the part you do not want.")}
      </p>
      <Equation label={tx(t, "mSum_eqSplit", "Splitting the range")}
        where={[
          [r`p`, tx(t, "mSum_wP", "any cutting point with m ≤ p < n")],
        ]}
        note={tx(t, "mSum_splitNote", "Example: 11 + 12 + … + 20 = (1 + … + 20) − (1 + … + 10) = 210 − 55 = 155.")}>
        {r`\sum_{k=m}^{n} a_k = \sum_{k=m}^{p} a_k + \sum_{k=p+1}^{n} a_k`}
      </Equation>
      <p>
        {tx(t, "mSum_shiftBody",
          "Shifting the index renames it so that the limits move. Put j = k − 1: when k runs from 1 to n, j runs from 0 to n − 1, and every k in the term becomes j + 1. Nothing about the actual numbers being added changes. Shifts line two sums up so that their terms can be compared or combined, which is exactly what telescoping needs.")}
      </p>
      <Equation label={tx(t, "mSum_eqShift", "Shifting the index by one")}
        where={[
          [r`j = k - 1`, tx(t, "mSum_wJ", "the new index; then k = j + 1")],
        ]}
        words={tx(t, "mSum_shiftWords", "Lower both limits by one and raise the index inside the term by one: the same numbers get added.")}>
        {r`\sum_{k=1}^{n} a_k = \sum_{j=0}^{n-1} a_{j+1}`}
      </Equation>
      <p>
        {tx(t, "mSum_revBody",
          "Reversing the order is a shift too: put j = n + 1 − k, so the last term comes first. Gauss's trick from the Sequences chapter is exactly this: write S = Σ k and S = Σ (n + 1 − k), add the two term by term, and every pair gives n + 1. The figure below shows the same idea as two staircases.")}
      </p>
      <Derivation t={t} label={tx(t, "mSum_eqGauss", "Σk by reversing the order")}
        steps={[
          { full: true, tex: r`S = \sum_{k=1}^{n} k = \sum_{k=1}^{n} (n + 1 - k)`, why: tx(t, "mSum_g1", "the same numbers in the opposite order (j = n + 1 − k, renamed back to k)") },
          { full: true, tex: r`2S = \sum_{k=1}^{n} \big(k + (n + 1 - k)\big) = \sum_{k=1}^{n} (n + 1)`, why: tx(t, "mSum_g2", "add the two sums term by term: linearity") },
          { full: true, tex: r`2S = n\,(n + 1) \quad\Rightarrow\quad S = \green{\frac{n(n+1)}{2}}`, why: tx(t, "mSum_g3", "a constant added n times") },
        ]} />

      <SummationFigure t={t} />

      <H2>{tx(t, "mSum_stdTitle", "The standard sums")}</H2>
      <p>
        {tx(t, "mSum_stdBody",
          "With linearity, any polynomial in k can be summed once you know the sums of 1, k, k², k³… separately. These four cover most needs, together with the geometric sum.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSum_tSum", "Sum (k = 1 to n)"), tx(t, "mSum_tClosed", "Closed form"), tx(t, "mSum_tCheck", "Check, n = 4")]}
        rows={[
          ["Σ 1", "n", "4"],
          ["Σ k", "n(n + 1)/2", "1 + 2 + 3 + 4 = 10"],
          ["Σ k²", "n(n + 1)(2n + 1)/6", "1 + 4 + 9 + 16 = 30"],
          ["Σ k³", "(n(n + 1)/2)²", "1 + 8 + 27 + 64 = 100 = 10²"],
          [tx(t, "mSum_tGeo", "Σ rᵏ, from k = 0"), "(rⁿ⁺¹ − 1)/(r − 1), r ≠ 1", tx(t, "mSum_tGeoEx", "r = 2: 1 + 2 + 4 + 8 + 16 = 31")],
        ]}
      />
      <p>
        {tx(t, "mSum_sqBody",
          "Where does n(n + 1)(2n + 1)/6 come from? Not from staring at 1, 4, 9, 16. The trick is to sum something that telescopes and contains k². Expanding (k + 1)³ − k³ gives 3k² + 3k + 1, and the sum of (k + 1)³ − k³ collapses to (n + 1)³ − 1 (the next section shows why). Solving for Σ k² finishes the job.")}
      </p>
      <Derivation t={t} label={tx(t, "mSum_eqSq", "The sum of squares")}
        steps={[
          { full: true, tex: r`(k+1)^3 - k^3 = 3k^2 + 3k + 1`, why: tx(t, "mSum_s1", "expand (k + 1)³ = k³ + 3k² + 3k + 1 (binomial theorem)") },
          { full: true, tex: r`\sum_{k=1}^{n} \big((k+1)^3 - k^3\big) = (n+1)^3 - 1`, why: tx(t, "mSum_s2", "the left side telescopes: 2³ − 1³ + 3³ − 2³ + … leaves only the ends") },
          { full: true, tex: r`3\sum k^2 + 3\sum k + \sum 1 = (n+1)^3 - 1`, why: tx(t, "mSum_s3", "sum the right side of the first line, using linearity") },
          { full: true, tex: r`3\sum k^2 = (n+1)^3 - 1 - \frac{3n(n+1)}{2} - n`, why: tx(t, "mSum_s4", "put in Σk = n(n + 1)/2 and Σ1 = n, and isolate Σk²") },
          { full: true, tex: r`3\sum k^2 = \frac{(n+1)\big(2(n+1)^2 - 3n - 2\big)}{2} = \frac{n(n+1)(2n+1)}{2}`, why: tx(t, "mSum_s5", "(n + 1)³ − (n + 1) = (n + 1)(n² + 2n); collect over 2, factor out n + 1; 2n² + n = n(2n + 1)") },
          { full: true, tex: r`\sum_{k=1}^{n} k^2 = \green{\frac{n(n+1)(2n+1)}{6}}`, why: tx(t, "mSum_s6", "divide by 3") },
        ]} />
      <LiveFormula label={tx(t, "mSum_liveSq", "Try it: the sum of squares")}
        tex={r`1^2 + 2^2 + \dots + n^2 = \frac{n(n+1)(2n+1)}{6}`}
        vars={[{ id: "n", label: "n", min: 1, max: 30, step: 1, value: 4, fmt: v => String(v) }]}
        compute={squaresNumbers}
        note={tx(t, "mSum_liveSqNote", "Amber is the sum added up term by term, green the formula. They agree for every n. At n = 24 the sum is 4900 = 70², the only square-pyramid number that is a perfect square (besides 1).")} />

      <H3>{tx(t, "mSum_geoTitle", "The geometric sum")}</H3>
      <p>
        {tx(t, "mSum_geoBody",
          "A geometric sum multiplies by a fixed ratio r at each step. Multiply the whole sum by r and every term moves one place along; subtracting the two lines cancels everything except one term at each end. This is the same telescoping idea in disguise.")}
      </p>
      <Derivation t={t} label={tx(t, "mSum_eqGeo", "The geometric sum")}
        steps={[
          { full: true, tex: r`S = a + ar + ar^2 + \dots + ar^n`, why: tx(t, "mSum_q1", "n + 1 terms, from k = 0 to n") },
          { full: true, tex: r`rS = \phantom{a + {}} ar + ar^2 + \dots + ar^n + ar^{n+1}`, why: tx(t, "mSum_q2", "multiply by r: each term becomes the next one") },
          { full: true, tex: r`rS - S = ar^{n+1} - a`, why: tx(t, "mSum_q3", "subtract: all the middle terms cancel") },
          { full: true, tex: r`S = \green{a\,\frac{r^{n+1} - 1}{r - 1}} \quad (r \neq 1)`, why: tx(t, "mSum_q4", "factor S out on the left and divide by r − 1; for r = 1 every term is a and S = a(n + 1)") },
        ]} />
      <LiveFormula label={tx(t, "mSum_liveGeo", "Try it: a geometric sum")}
        tex={r`a + ar + \dots + ar^n = a\,\frac{r^{n+1} - 1}{r - 1}`}
        vars={[
          { id: "a", label: "a", min: 1, max: 5, step: 1, value: 1, fmt: v => String(v) },
          { id: "q", label: "r", min: -2, max: 3, step: 0.5, value: 2, fmt: v => String(v).replace("-", "−") },
          { id: "n", label: "n", min: 1, max: 12, step: 1, value: 4, fmt: v => String(v) },
        ]}
        compute={geoNumbers}
        note={tx(t, "mSum_liveGeoNote", "The number in brackets is the sum added up directly. With r = 0.5 the sum creeps towards 2a as n grows: the infinite sum of the Sequences chapter. With r = 2 it doubles, plus a, at every step. Try r = 1, where the formula would divide by zero.")} />

      <H2>{tx(t, "mSum_teleTitle", "Telescoping sums")}</H2>
      <p>
        {tx(t, "mSum_teleBody",
          "When each term is a difference of consecutive values of some sequence, a sum of n terms collapses, like a telescope sliding shut. Every inner value appears once with a plus sign and once with a minus sign, and cancels. Only the first and the last value are left. The art is in spotting the difference: partial fractions, as in the integration chapter, often reveal it.")}
      </p>
      <Equation label={tx(t, "mSum_eqTele", "A telescoping sum")}
        where={[
          [r`b_k`, tx(t, "mSum_wB", "any sequence; each term of the sum is the step from one value to the next")],
        ]}
        words={tx(t, "mSum_teleWords", "Adding up all the steps from b₁ to bₙ₊₁ gives the total change: where you end minus where you started.")}>
        {r`\sum_{k=1}^{n} \big(b_{k+1} - b_k\big) = b_{n+1} - b_1`}
      </Equation>
      <Derivation t={t} label={tx(t, "mSum_eqFrac", "1/(1·2) + 1/(2·3) + … + 1/(n(n+1))")}
        steps={[
          { full: true, tex: r`\frac{1}{k(k+1)} = \frac{1}{k} - \frac{1}{k+1}`, why: tx(t, "mSum_f1", "partial fractions; check: (k + 1 − k)/(k(k + 1)) = 1/(k(k + 1))") },
          { full: true, tex: r`\sum_{k=1}^{n} \frac{1}{k(k+1)} = \Big(1 - \tfrac12\Big) + \Big(\tfrac12 - \tfrac13\Big) + \dots + \Big(\tfrac1n - \tfrac{1}{n+1}\Big)`, why: tx(t, "mSum_f2", "write it out: each −1/(k + 1) meets a +1/(k + 1) in the next bracket") },
          { full: true, tex: r`= 1 - \frac{1}{n+1} = \green{\frac{n}{n+1}}`, why: tx(t, "mSum_f3", "only the first and the last piece survive") },
        ]} />
      <p>
        {tx(t, "mSum_teleBody2",
          "As n grows, n/(n + 1) tends to 1, so this infinite sum converges to exactly 1. Telescoping is the discrete version of the Fundamental Theorem of Calculus: there, integrating a derivative gives the total change F(b) − F(a); here, adding up differences gives b_{n+1} − b₁.")}
      </p>

      <H2>{tx(t, "mSum_dblTitle", "Double sums")}</H2>
      <p>
        {tx(t, "mSum_dblBody",
          "A double sum has a sum inside a sum: for each value of the outer index, add up the inner sum, then add up those results. Think of a table with a value in every cell. Summing row by row or column by column visits the same cells, so for finite sums the order can be swapped. When the term is a product of a part that depends only on i and a part that depends only on j, the double sum factors into a product of two single sums.")}
      </p>
      <Equation label={tx(t, "mSum_eqDbl", "Swapping and factoring a double sum")}
        where={[
          [r`a_{ij}`, tx(t, "mSum_wAij", "the value in row i, column j")],
          [r`x_i\,y_j`, tx(t, "mSum_wXy", "a term that splits into a factor of i times a factor of j")],
        ]}
        note={tx(t, "mSum_dblNote", "The multiplication table up to 10 × 10 adds up to (1 + … + 10)² = 55² = 3025.")}>
        {r`\sum_{i=1}^{n}\sum_{j=1}^{m} a_{ij} = \sum_{j=1}^{m}\sum_{i=1}^{n} a_{ij} \qquad \sum_{i=1}^{n}\sum_{j=1}^{m} x_i\,y_j = \Big(\sum_{i=1}^{n} x_i\Big)\Big(\sum_{j=1}^{m} y_j\Big)`}
      </Equation>
      <p>
        {tx(t, "mSum_triBody",
          "If the inner limit depends on the outer index, the cells form a triangle, and swapping the order means describing the same triangle the other way round. The cells with 1 ≤ j ≤ i ≤ n can be listed row by row (for each i, j goes from 1 to i) or column by column (for each j, i goes from j to n). Counting them both ways gives 1 + 2 + … + n either way, which is one more proof of Gauss's formula.")}
      </p>
      <Equation label={tx(t, "mSum_eqTri", "Swapping a triangular double sum")}
        where={[
          [r`1 \le j \le i \le n`, tx(t, "mSum_wTri", "the cells on and below the diagonal of an n × n table")],
        ]}>
        {r`\sum_{i=1}^{n}\sum_{j=1}^{i} a_{ij} = \sum_{j=1}^{n}\sum_{i=j}^{n} a_{ij}`}
      </Equation>

      <H2>{tx(t, "mSum_prodTitle", "Products: Π")}</H2>
      <p>
        {tx(t, "mSum_prodBody",
          "The capital pi, Π, does for multiplication what Σ does for addition. n! is the product of k from 1 to n. The empty product is 1, the number that leaves a product unchanged, just as the empty sum is 0. Products telescope too: in the product of (k + 1)/k every numerator cancels the next denominator. And the logarithm turns a product into a sum, since log(ab) = log a + log b, which is how products are usually handled in probability and statistics.")}
      </p>
      <Equation label={tx(t, "mSum_eqProd", "Products, and logarithms of products")}
        where={[
          [r`\prod`, tx(t, "mSum_wPi", "capital pi: multiply all the terms")],
          [r`\log`, tx(t, "mSum_wLog", "a logarithm in any base; it turns the product into a sum")],
        ]}
        note={tx(t, "mSum_prodNote", "Telescoping product: (2/1)(3/2)(4/3)…((n + 1)/n) = n + 1.")}>
        {r`\prod_{k=1}^{n} k = n! \qquad \prod_{k=1}^{n} \frac{k+1}{k} = n + 1 \qquad \log \prod_{k=1}^{n} a_k = \sum_{k=1}^{n} \log a_k`}
      </Equation>

      <H2>{tx(t, "mSum_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mSum_ex1", "1. Σ from k = 1 to 10 of (3k² − 2k + 5) = 3 · 385 − 2 · 55 + 5 · 10 = 1155 − 110 + 50 = 1095, using Σk² = 10 · 11 · 21 / 6 = 385.")}</p>
      <p>{tx(t, "mSum_ex2", "2. The odd numbers: Σ from k = 1 to n of (2k − 1) = 2 · n(n + 1)/2 − n = n². The first n odd numbers always add up to a perfect square: 1 + 3 + 5 + 7 = 16.")}</p>
      <p>{tx(t, "mSum_ex3", "3. Σ from k = 21 to 40 of k = Σ₁⁴⁰ − Σ₁²⁰ = 820 − 210 = 610. Or shift: 20 terms whose average is (21 + 40)/2 = 30.5, and 20 · 30.5 = 610.")}</p>
      <H3>{tx(t, "mSum_ex4Title", "A double sum")}</H3>
      <p>{tx(t, "mSum_ex4", "4. Σ for i = 1 to n of Σ for j = 1 to i of 1 counts the cells of a triangle: Σᵢ i = n(n + 1)/2. A handshake count works the same way: in a room of n people, each pair shakes hands once, and the number of pairs with j < i is Σᵢ (i − 1) = n(n − 1)/2.")}</p>

      <MathPracticeFigure t={t} set="summation" />

      <H2>{tx(t, "mSum_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSum_tWrong", "Wrong"), tx(t, "mSum_tRight", "Right"), tx(t, "mSum_tWhy", "Why")]}
        rows={[
          [tx(t, "mSum_m1w", "Σ₁¹⁰ 2 = 2"), "20", tx(t, "mSum_m1", "the constant is added once per term")],
          [tx(t, "mSum_m2w", "from 3 to 6: 3 terms"), tx(t, "mSum_m2r", "6 − 3 + 1 = 4 terms"), tx(t, "mSum_m2", "count the end points too")],
          [tx(t, "mSum_m3w", "Σ k² = (Σ k)²"), "14 ≠ 36 (n = 3)", tx(t, "mSum_m3", "linearity does not cover squares or products")],
          [tx(t, "mSum_m4w", "shifting the limits but not the term"), tx(t, "mSum_m4r", "k → j + 1 inside too"), tx(t, "mSum_m4", "the same numbers must be added")],
          [tx(t, "mSum_m5w", "geometric sum with n terms in the exponent"), tx(t, "mSum_m5r", "from k = 0 to n there are n + 1 terms"), tx(t, "mSum_m5", "hence rⁿ⁺¹ in the formula")],
        ]}
      />

      <KeyIdeas t={t} id="mSum" items={[
        "Σ from k = m to n has n − m + 1 terms; the index is a dummy variable; the empty sum is 0.",
        "Linearity: Σ(c aₖ + bₖ) = c Σaₖ + Σbₖ, and Σ c = c × (number of terms). Sums of products or squares do not split.",
        "Split a range at any point, shift the index (k = j + 1), or reverse it (k → n + 1 − k).",
        "Σk = n(n + 1)/2, Σk² = n(n + 1)(2n + 1)/6, Σk³ = (n(n + 1)/2)², Σ rᵏ (k = 0…n) = (rⁿ⁺¹ − 1)/(r − 1).",
        "A sum of differences telescopes: Σ(bₖ₊₁ − bₖ) = bₙ₊₁ − b₁.",
        "Finite double sums can be taken in either order; Σᵢ Σⱼ xᵢ yⱼ = (Σ xᵢ)(Σ yⱼ).",
        "Π multiplies; the empty product is 1; log turns a product into a sum.",
      ]} />
    </Article>
  );
}
