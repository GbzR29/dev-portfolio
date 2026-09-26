"use client";

// Algebra 9: sequences and series — terms and indices, explicit and
// recursive rules, arithmetic and geometric sequences, sigma notation, the
// two closed-form sums, infinite geometric series, and sequences in
// everyday life and nature.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SequenceFigure } from "@/components/lesson/figures/math/SequenceFigure";

const r = String.raw;

export function SequencesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSeq_intro",
          "Everyday life is full of lists of numbers that follow a rule: the seat numbers in each row of a theatre, the balance of a savings account year after year, the height of each bounce of a dropped ball, the rabbits in a field generation after generation. Those lists are sequences, and adding their terms up gives series. This chapter shows the two basic kinds, arithmetic (add the same step) and geometric (multiply by the same factor), how to jump straight to any term without computing all the ones before it, and how to add many terms, even infinitely many, with a single formula.")}
      </Lead>

      <H2>{tx(t, "mSeq_whatTitle", "Terms and indices")}</H2>
      <p>
        {tx(t, "mSeq_whatBody",
          "A sequence is an ordered list of numbers: a₁, a₂, a₃, …. Each number is a term, and the small number below is its index, the term's position in the list. aₙ means \"the n-th term\", for a general n. Most books start counting at 1, but some start at a₀; before using a formula, check which one it assumes. A sequence can be given in two ways, and it helps to be able to switch between them.")}
      </p>
      <Equation label={tx(t, "mSeq_eqTwo", "Two ways to describe a sequence")}
        where={[
          [r`a_n = 2n + 1`, tx(t, "mSeq_wExplicit", "explicit rule: a formula in n that gives any term directly. a₁₀₀ = 201, without computing the 99 before it")],
          [r`a_1 = 3,\ a_{n+1} = a_n + 2`, tx(t, "mSeq_wRecursive", "recursive rule: a starting term and how to get each term from the previous one. It describes the same list, 3, 5, 7, 9, …, and is how you would continue the list by hand, one term at a time")],
        ]}>
        {r`3,\ 5,\ 7,\ 9,\ 11,\ \dots`}
      </Equation>

      <H2>{tx(t, "mSeq_arithTitle", "Arithmetic sequences: add a constant")}</H2>
      <p>
        {tx(t, "mSeq_arithBody",
          "In an arithmetic sequence each term is the previous one plus a fixed number d, the common difference: 5, 8, 11, 14 has d = 3; 10, 7.5, 5, 2.5 has d = −2.5. To reach the n-th term from the first you take n − 1 steps of size d. The terms are the values of a linear function at 1, 2, 3, …, so on a graph they lie on a straight line whose slope is d.")}
      </p>
      <Equation label={tx(t, "mSeq_eqArith", "The n-th term of an arithmetic sequence")}
        where={[
          [r`a_1`, tx(t, "mSeq_wA1", "the first term")],
          [r`d`, tx(t, "mSeq_wD", "the common difference, a₂ − a₁ (or any term minus the one before it)")],
          [r`n - 1`, tx(t, "mSeq_wSteps", "the number of steps from the first term to the n-th; the most common off-by-one error is writing n")],
        ]}
        note={tx(t, "mSeq_eqArithNote", "Example: a level-up costs 100 gold at level 1 and 40 more each level. At level 25: 100 + 24 · 40 = 1060 gold.")}>
        {r`a_n = a_1 + (n - 1)\,d`}
      </Equation>

      <H2>{tx(t, "mSeq_geoTitle", "Geometric sequences: multiply by a constant")}</H2>
      <p>
        {tx(t, "mSeq_geoBody",
          "In a geometric sequence each term is the previous one times a fixed number r, the common ratio: 3, 6, 12, 24 has r = 2; 80, 40, 20, 10 has r = ½. After n − 1 steps you have multiplied by r a total of n − 1 times. These are the exponential functions of the exponents chapter sampled at whole numbers: with r > 1 they grow explosively, with 0 < r < 1 they decay toward 0, and with a negative r the signs alternate.")}
      </p>
      <Equation label={tx(t, "mSeq_eqGeo", "The n-th term of a geometric sequence")}
        where={[
          [r`a_1`, tx(t, "mSeq_wG1", "the first term")],
          [r`r`, tx(t, "mSeq_wR", "the common ratio, a₂ / a₁ (any term divided by the one before it)")],
          [r`r^{n-1}`, tx(t, "mSeq_wRn", "n − 1 multiplications by r")],
        ]}
        note={tx(t, "mSeq_eqGeoNote", "Example: a bouncing ball keeps 70% of its height each bounce. Dropped from 5 m, its peak heights are 5, 3.5, 2.45, …, and the 6th term, the peak after the 5th bounce, is 5 · 0.7⁵ ≈ 0.84 m.")}>
        {r`a_n = a_1 \cdot r^{\,n-1}`}
      </Equation>

      <SequenceFigure t={t} />

      <H2>{tx(t, "mAlg_sumTitle", "Sums: reading Σ")}</H2>
      <p>
        {tx(t, "mAlg_sumBody",
          "The capital Greek letter sigma, Σ, is shorthand for \"add up all of these\". Below it, the index variable and where it starts; above it, where it stops; to its right, what to add each time. Two sums have closed forms worth knowing. The arithmetic series 1 + 2 + … + n: pairing the first and last terms (1 + n), the second and second-to-last (2 + n − 1), and so on gives n/2 pairs of n + 1. The geometric series, where each term is r times the previous one, appears in compound growth, in repeated halving and in bouncing balls.")}
      </p>
      <Equation label={tx(t, "mSeq_eqSigma", "Reading sigma notation")}
        where={[
          [r`k = 1`, tx(t, "mSeq_wFrom", "the index variable and its first value")],
          [r`4`, tx(t, "mSeq_wTo", "its last value (inclusive)")],
          [r`k^2`, tx(t, "mSeq_wTerm", "the term to add for each k")],
        ]}>
        {r`\sum_{k=1}^{4} k^2 = 1^2 + 2^2 + 3^2 + 4^2 = 30`}
      </Equation>

      <H3>{tx(t, "mSeq_arithSumTitle", "Adding an arithmetic sequence")}</H3>
      <p>
        {tx(t, "mSeq_arithSumBody",
          "The story goes that the young Carl Friedrich Gauss, asked to add 1 to 100, wrote the list forwards and backwards and added them in pairs: 1 + 100, 2 + 99, 3 + 98… every pair is 101, and there are 100 pairs, which counts every number twice. So the sum is 100 · 101 / 2 = 5050. The same trick works for any arithmetic sequence, because the first plus the last is always equal to the second plus the second-to-last.")}
      </p>
      <Equation label={tx(t, "mSeq_eqArithSum", "Sum of the first n terms, arithmetic")}
        where={[
          [r`S_n`, tx(t, "mSeq_wSn", "the sum a₁ + a₂ + … + aₙ")],
          [r`\tfrac{a_1 + a_n}{2}`, tx(t, "mSeq_wAvg", "the average of the first and last term, which is also the average of all the terms")],
          [r`n`, tx(t, "mSeq_wCount", "the number of terms")],
        ]}
        note={tx(t, "mSeq_eqArithSumNote", "The total gold for levels 1 to 25 in the example above: 25 · (100 + 1060)/2 = 14 500.")}>
        {r`S_n = n \cdot \frac{a_1 + a_n}{2} \qquad\text{in particular}\qquad 1 + 2 + \dots + n = \frac{n(n+1)}{2}`}
      </Equation>

      <H3>{tx(t, "mSeq_geoSumTitle", "Adding a geometric sequence")}</H3>
      <p>
        {tx(t, "mSeq_geoSumBody",
          "Call the sum S = a + ar + ar² + … + arⁿ⁻¹. Multiply it by r: rS = ar + ar² + … + arⁿ. The two lists share every term except the first of S and the last of rS, so subtracting leaves S − rS = a − arⁿ. Factor: S(1 − r) = a(1 − rⁿ), and divide by 1 − r (allowed when r ≠ 1; if r = 1 every term is a and S = na).")}
      </p>
      <Equation label={tx(t, "mAlg_eqSums", "Sigma notation and two closed forms")}
        where={[
          [r`\textstyle\sum_{k=1}^{n} k`, tx(t, "mAlg_wArith", "the arithmetic series: n(n + 1)/2. A stack of logs with 1 on top, 2 below, … 20 at the bottom holds 20 · 21/2 = 210 logs")],
          [r`\textstyle\sum_{k=0}^{n-1} r^k`, tx(t, "mAlg_wGeo", "the geometric series: (1 − rⁿ)/(1 − r) for r ≠ 1. Multiply the sum S by r and subtract: S − rS = 1 − rⁿ, since all the middle terms cancel")],
          [r`\tfrac{1}{1 - r}`, tx(t, "mAlg_wInf", "the limit of the geometric series as n → ∞, when |r| < 1. With r = ½: 1 + ½ + ¼ + … = 2. Each term is half the previous one, and together they never exceed twice the first")],
        ]}>
        {r`\sum_{k=1}^{n} k = \frac{n(n+1)}{2} \qquad \sum_{k=0}^{n-1} r^k = \frac{1 - r^n}{1 - r}`}
      </Equation>

      <H2>{tx(t, "mSeq_infTitle", "Adding infinitely many terms")}</H2>
      <p>
        {tx(t, "mSeq_infBody",
          "Can infinitely many numbers add up to something finite? Walk halfway to a wall, then half the remaining distance, then half again: you cover ½ + ¼ + ⅛ + … of the distance, never more than all of it, and as close to all of it as you like. When |r| < 1, the term rⁿ in the sum formula shrinks toward 0 as n grows, so the partial sums approach a(1 − 0)/(1 − r) = a/(1 − r). We say the series converges to that value. If |r| ≥ 1 the terms do not shrink and the sum grows without bound (or keeps oscillating): the series diverges. The precise meaning of \"approaches\" is the subject of limits, in the calculus section.")}
      </p>
      <Equation label={tx(t, "mSeq_eqInf", "The infinite geometric series")}
        where={[
          [r`|r| < 1`, tx(t, "mSeq_wCond", "required; otherwise there is no finite sum")],
          [r`\tfrac{a}{1 - r}`, tx(t, "mSeq_wLim", "the value the partial sums approach")],
        ]}
        note={tx(t, "mSeq_eqInfNote", "Example: 0.999… = 0.9 + 0.09 + 0.009 + … is geometric with a = 0.9 and r = 0.1, so it equals 0.9/(1 − 0.1) = 0.9/0.9 = 1 exactly.")}>
        {r`a + ar + ar^2 + \dots = \frac{a}{1 - r} \qquad (|r| < 1)`}
      </Equation>

      <H2>{tx(t, "mSeq_gameTitle", "Sequences around you")}</H2>
      <LessonTable
        headers={[tx(t, "mSeq_tWhere", "Where"), tx(t, "mSeq_tSeq", "Sequence"), tx(t, "mSeq_tNote", "What the maths tells you")]}
        rows={[
          [tx(t, "mSeq_g1", "theatre seats"), "aₙ = 20 + 2(n − 1)", tx(t, "mSeq_g1n", "20 seats in the first row, 2 more in each row behind: 30 rows hold 30 · (20 + 78)/2 = 1470 seats")],
          [tx(t, "mSeq_g2", "savings account"), "aₙ = 1000 · 1.04ⁿ", tx(t, "mSeq_g2n", "4% interest multiplies the balance by 1.04 every year: after 10 years 1000 · 1.04¹⁰ ≈ 1480")],
          [tx(t, "mSeq_g3", "regular deposits"), tx(t, "mSeq_g3s", "100 + 100 · 1.04 + … + 100 · 1.04⁹"), tx(t, "mSeq_g3n", "100 saved each year for 10 years: a geometric sum, 100 · (1.04¹⁰ − 1)/0.04 ≈ 1201")],
          [tx(t, "mSeq_g4", "medicine in the body"), tx(t, "mSeq_g4s", "the amount left falls to (1 − k) each day"), tx(t, "mSeq_g4n", "a geometric sequence: after n days the amount is dose · (1 − k)ⁿ")],
          [tx(t, "mSeq_g5", "bouncing ball"), tx(t, "mSeq_g5s", "heights h, hr, hr², …"), tx(t, "mSeq_g5n", "total distance travelled is finite: h + 2hr/(1 − r)")],
          [tx(t, "mSeq_g6", "Fibonacci"), "1, 1, 2, 3, 5, 8, …", tx(t, "mSeq_g6n", "recursive: aₙ₊₁ = aₙ + aₙ₋₁; the ratio of neighbours tends to the golden ratio ≈ 1.618, and sunflower spirals come in Fibonacci numbers")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mSeq_indexInfo", "Index conventions are the classic source of off-by-one errors. If a list starts at a₀ instead of a₁, the n-th term of an arithmetic sequence is a₀ + n·d, with no \"− 1\", and the terms up to aₙ number n + 1, not n. Decide on one convention, write it down, and test your formula on the first and last terms.")}
      </Callout>

      <H2>{tx(t, "mSeq_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSeq_tWrong", "Wrong"), tx(t, "mSeq_tRight", "Right"), tx(t, "mSeq_tWhy", "Why")]}
        rows={[
          ["aₙ = a₁ + n·d", "aₙ = a₁ + (n − 1)·d", tx(t, "mSeq_m1", "from the 1st to the n-th term there are n − 1 steps")],
          ["aₙ = a₁ · rⁿ", "aₙ = a₁ · rⁿ⁻¹", tx(t, "mSeq_m2", "the same off-by-one, for ratios")],
          ["1 + 2 + … + 100 = 100 · 100 / 2", "100 · 101 / 2 = 5050", tx(t, "mSeq_m3", "the average term is (1 + 100)/2, not 100/2")],
          ["1 + 2 + 4 + 8 + … = 1/(1 − 2) = −1", tx(t, "mSeq_m4r", "no finite sum"), tx(t, "mSeq_m4", "the formula needs |r| < 1")],
          [tx(t, "mSeq_m5w", "d = a₁ − a₂"), "d = a₂ − a₁", tx(t, "mSeq_m5", "later term minus earlier term; a decreasing sequence has d < 0")],
        ]}
      />

      <KeyIdeas t={t} id="mSeq" items={[
        "A sequence is an ordered list a₁, a₂, …; explicit rules jump to any term, recursive rules step from the previous one.",
        "Arithmetic: add d each step, aₙ = a₁ + (n − 1)d; the terms lie on a line.",
        "Geometric: multiply by r each step, aₙ = a₁ · rⁿ⁻¹; the terms grow or decay exponentially.",
        "Σ means \"add all of these\"; 1 + … + n = n(n + 1)/2 and Sₙ = n(a₁ + aₙ)/2.",
        "Geometric sum: a(1 − rⁿ)/(1 − r); with |r| < 1 the infinite sum is a/(1 − r).",
        "Repeated growth or decay by the same factor is a geometric sequence: use the formula to predict it.",
      ]} />
    </Article>
  );
}
