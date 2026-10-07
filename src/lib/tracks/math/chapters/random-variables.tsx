"use client";

// Probability & Statistics 5: random variables — a number attached to each
// outcome; events {X = x}; discrete variables and the probability mass
// function (dice sum, heads in n tosses); the cumulative distribution function
// and interval probabilities; functions of a random variable; two variables:
// joint table, marginals, independence; continuous variables: P(X = x) = 0,
// the density as probability per unit, areas by integrals, F′ = f, finding the
// normalising constant, medians, and the CDF method for Y = 2X.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RandomVariableFigure } from "@/components/lesson/figures/math/RandomVariableFigure";

const r = String.raw;

export function RandomVariablesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRv_intro",
          "So far outcomes were things: pairs of dice faces, cards, sequences of heads and tails. But usually we care about a number that the outcome determines: the sum of the dice, how many heads, how long we wait, how tall a person picked at random is. A random variable is exactly that, a number attached to every outcome. Once outcomes become numbers, we can draw their probabilities as a graph, add them up with sums and integrals, and, in the next chapters, compute averages and spreads. This chapter covers discrete variables, whose values can be listed, and continuous ones, which fill whole intervals.")}
      </Lead>

      <H2>{tx(t, "mRv_defTitle", "A number for every outcome")}</H2>
      <p>
        {tx(t, "mRv_defBody",
          "A random variable X is a rule that assigns a number X(ω) to each outcome ω of the sample space. It is a function, despite its name, and it is not itself random: the randomness is in which outcome occurs. Rolling two dice, S = the sum assigns S(2, 5) = 7, S(6, 6) = 12, and so on. Several different variables can live on the same experiment: M = the larger of the two faces, D = first minus second. Random variables are written with capital letters and their possible values with lower-case ones.")}
      </p>
      <p>
        {tx(t, "mRv_eventBody",
          "A statement about X is an event. {S = 7} is the set of outcomes whose sum is 7, the six pairs from the probability chapter, so P(S = 7) = 6/36. {S ≤ 4} is the set of pairs with sum at most 4: (1,1), (1,2), (2,1), (1,3), (2,2), (3,1), so P(S ≤ 4) = 6/36. Every question about X becomes a question about a set of outcomes, and the rules we already have apply.")}
      </p>

      <H2>{tx(t, "mRv_pmfTitle", "Discrete variables: the probability mass function")}</H2>
      <p>
        {tx(t, "mRv_pmfBody",
          "A random variable is discrete when its possible values can be listed: 2, 3, …, 12 for the sum, 0, 1, 2, … for a count. Its distribution is described completely by the probability of each value, the probability mass function (pmf) p(x) = P(X = x). For the sum of two dice, count the pairs for each sum:")}
      </p>
      <LessonTable
        headers={["s", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]}
        rows={[
          [tx(t, "mRv_tPairs", "pairs"), "1", "2", "3", "4", "5", "6", "5", "4", "3", "2", "1"],
          ["P(S = s)", "1/36", "2/36", "3/36", "4/36", "5/36", "6/36", "5/36", "4/36", "3/36", "2/36", "1/36"],
        ]}
      />
      <Equation label={tx(t, "mRv_eqPmf", "Probability mass function")}
        where={[
          [r`p(x)`, tx(t, "mRv_wPx", "the probability that X takes the value x; 0 for values X cannot take")],
          [r`\sum_x`, tx(t, "mRv_wSumX", "the sum over all possible values of X")],
        ]}
        note={tx(t, "mRv_pmfNote", "The two conditions are the axioms in disguise: the events {X = x} for different x are mutually exclusive and together make up the whole sample space. Any list of non-negative numbers adding to 1 is a valid pmf.")}>
        {r`p(x) = P(X = x) \qquad p(x) \ge 0 \qquad \sum_x p(x) = 1`}
      </Equation>
      <p>
        {tx(t, "mRv_coinsBody",
          "Toss 3 coins and let H = the number of heads. The 8 equally likely sequences give H = 0 once (TTT), H = 1 three times (HTT, THT, TTH), H = 2 three times and H = 3 once. So the pmf is 1/8, 3/8, 3/8, 1/8: row 3 of Pascal's triangle divided by 2³. For n coins, P(H = k) = C(n, k)/2ⁿ, because C(n, k) sequences have their heads in exactly k of the n places. This is the first example of a named distribution, the binomial, which the distributions chapter studies in general.")}
      </p>

      <H2>{tx(t, "mRv_cdfTitle", "The cumulative distribution function")}</H2>
      <p>
        {tx(t, "mRv_cdfBody",
          "A second description, which works for every kind of random variable, accumulates the probability from the left: F(x) = P(X ≤ x). For the dice sum, F(4) = (1 + 2 + 3)/36 = 6/36 and F(8) = 26/36. F starts at 0 far to the left, ends at 1 far to the right, and never decreases, since moving x to the right only adds outcomes. For a discrete X it is a staircase that jumps by p(x) at each possible value x and is flat in between.")}
      </p>
      <Equation label={tx(t, "mRv_eqCdf", "Cumulative distribution function and intervals")}
        where={[
          [r`F(x)`, tx(t, "mRv_wF", "the probability that X is at most x")],
          [r`F(b) - F(a)`, tx(t, "mRv_wFba", "the probability that X is above a and at most b: the rise of F across the interval")],
        ]}
        note={tx(t, "mRv_cdfNote", "For whole-number values, \"5 ≤ S ≤ 8\" is \"4 < S ≤ 8\": P = F(8) − F(4) = 26/36 − 6/36 = 20/36 = 5/9. Check with the pmf: (4 + 5 + 6 + 5)/36 = 20/36 ✓. Watch whether the ends are included.")}>
        {r`F(x) = P(X \le x) \qquad P(a < X \le b) = F(b) - F(a)`}
      </Equation>

      <RandomVariableFigure t={t} />

      <H2>{tx(t, "mRv_funcTitle", "Functions of a random variable")}</H2>
      <p>
        {tx(t, "mRv_funcBody",
          "Apply a function to a random variable and you get a new one: if X is the result of one die, Y = 2X + 1 takes the values 3, 5, …, 13, each with probability 1/6. When the function sends different values to the same place, their probabilities add. Y = (X − 3)² sends 1, 2, 3, 4, 5, 6 to 4, 1, 0, 1, 4, 9. So P(Y = 0) = 1/6 (only X = 3), P(Y = 1) = 2/6 (X = 2 or 4), P(Y = 4) = 2/6 (X = 1 or 5) and P(Y = 9) = 1/6. The method is always the same: for each value y, collect the x's that go there and add their probabilities.")}
      </p>

      <H2>{tx(t, "mRv_jointTitle", "Two random variables together")}</H2>
      <p>
        {tx(t, "mRv_jointBody",
          "Two variables on the same experiment are described together by their joint pmf p(x, y) = P(X = x and Y = y), a table with one row per value of X and one column per value of Y. Toss two coins; let X = heads on the first coin (0 or 1) and T = total heads. The four outcomes TT, TH, HT, HH give (X, T) = (0,0), (0,1), (1,1), (1,2), each with probability 1/4:")}
      </p>
      <LessonTable
        headers={["", "T = 0", "T = 1", "T = 2", tx(t, "mRv_tRowSum", "row sum: P(X = x)")]}
        rows={[
          ["X = 0", "1/4", "1/4", "0", "1/2"],
          ["X = 1", "0", "1/4", "1/4", "1/2"],
          [tx(t, "mRv_tColSum", "column sum: P(T = t)"), "1/4", "1/2", "1/4", "1"],
        ]}
      />
      <p>
        {tx(t, "mRv_margBody",
          "Adding a row gives the probability of that value of X whatever T is: these row sums are the marginal distribution of X, written in the margin. Column sums give the marginal of T. X and Y are independent when every cell equals the product of its row and column totals, p(x, y) = P(X = x) P(Y = y): then knowing one tells nothing about the other. Here they are dependent, since p(0, 2) = 0 but P(X = 0) P(T = 2) = 1/2 · 1/4 = 1/8. Of course: if the first coin is tails, two heads is impossible. The results of two separate dice, in contrast, are independent, and their joint table has 1/36 = 1/6 · 1/6 in every cell.")}
      </p>

      <H2>{tx(t, "mRv_contTitle", "Continuous variables: probability as area")}</H2>
      <p>
        {tx(t, "mRv_contBody",
          "The time until a bus arrives, a person's height, the point where a dart lands: these can take any value in an interval, not just a list. Such a variable is continuous, and something new happens. The chance of any single exact value is 0. The chance of waiting exactly 2.000… minutes, to infinitely many decimals, is 0, just as a dart has probability 0 of hitting one exact point. So a pmf is useless here: it would be 0 everywhere. What still makes sense is the probability of an interval, such as waiting between 1 and 2 minutes.")}
      </p>
      <p>
        {tx(t, "mRv_densBody",
          "The replacement for the pmf is a density function f(x) ≥ 0, whose area over an interval is the probability of that interval. It is the calculus idea of the integrals chapter: a quantity spread along a line with a certain density per unit length, like mass along a rod. Over a short interval of width Δx near x, P(x ≤ X ≤ x + Δx) ≈ f(x) Δx, so f(x) is probability per unit of x. In a histogram of many observed values, with bars of shrinking width scaled so their areas are relative frequencies, the bar tops approach the density.")}
      </p>
      <Equation label={tx(t, "mRv_eqPdf", "Probability density function")}
        where={[
          [r`f(x)`, tx(t, "mRv_wf", "the density at x: probability per unit length, not a probability itself")],
          [r`\int_a^b f(x)\,dx`, tx(t, "mRv_wInt", "the area under f from a to b, which is the probability that X lands in [a, b]")],
          [r`\int_{-\infty}^{\infty} f(x)\,dx = 1`, tx(t, "mRv_wTotal", "the total area is 1: X lands somewhere (an improper integral when the values are unbounded)")],
        ]}
        note={tx(t, "mRv_pdfNote", "Because single points have probability 0, it makes no difference whether the ends are included: P(a ≤ X ≤ b) = P(a < X < b).")}>
        {r`P(a \le X \le b) = \int_a^b f(x)\,dx \qquad f(x) \ge 0 \qquad \int_{-\infty}^{\infty} f(x)\,dx = 1`}
      </Equation>
      <p>
        {tx(t, "mRv_uniformBody",
          "The simplest density is flat. A point chosen uniformly at random on [0, 2] has f(x) = 1/2 there and 0 elsewhere: a rectangle of width 2 and height 1/2, area 1. Then P(0.5 ≤ X ≤ 1.2) = 0.7 · 1/2 = 0.35, the width of the interval over the total width, as in geometric probability. On [0, 0.5] the flat density is f = 2: a density can be larger than 1, since it is a probability per unit and the unit here is large compared with the interval. Only areas must stay at most 1.")}
      </p>
      <H3>{tx(t, "mRv_rampTitle", "A worked density: f(x) = 2x on [0, 1]")}</H3>
      <p>
        {tx(t, "mRv_rampBody",
          "Let f(x) = 2x for 0 ≤ x ≤ 1 and 0 elsewhere. It is never negative, and its total area is ∫₀¹ 2x dx = [x²]₀¹ = 1, so it is a valid density. Values near 1 are more likely than values near 0. P(X ≤ ½) = ∫₀^½ 2x dx = (½)² = 1/4: although [0, ½] is half the interval, it holds only a quarter of the probability. P(0.2 ≤ X ≤ 0.6) = 0.6² − 0.2² = 0.36 − 0.04 = 0.32.")}
      </p>

      <H2>{tx(t, "mRv_ftcTitle", "The CDF of a continuous variable")}</H2>
      <p>
        {tx(t, "mRv_ftcBody",
          "The cumulative distribution function F(x) = P(X ≤ x) is defined exactly as before. For a continuous X it is the area under f from the far left up to x, an accumulation function, so the fundamental theorem of calculus applies: F is an antiderivative of f, F′ = f, and every interval probability is F(b) − F(a). For f(x) = 2x on [0, 1], F(x) = x² there, 0 to the left and 1 to the right. Instead of the staircase of a discrete variable, F now rises smoothly, steepest where the density is highest.")}
      </p>
      <Equation label={tx(t, "mRv_eqFtc", "From density to CDF and back")}
        where={[
          [r`F(x)`, tx(t, "mRv_wFcont", "the accumulated area under f up to x")],
          [r`F'(x) = f(x)`, tx(t, "mRv_wFprime", "the density is the slope of the CDF (wherever F has a slope)")],
        ]}>
        {r`F(x) = \int_{-\infty}^{x} f(u)\,du \qquad F'(x) = f(x) \qquad P(a \le X \le b) = F(b) - F(a)`}
      </Equation>
      <p>
        {tx(t, "mRv_waitBody",
          "Waiting time. Suppose the minutes until the next call to a help line have density f(x) = e⁻ˣ for x ≥ 0. Its area is ∫₀^∞ e⁻ˣ dx = [−e⁻ˣ]₀^∞ = 0 − (−1) = 1 ✓, an improper integral. F(x) = 1 − e⁻ˣ, so P(wait more than 2 minutes) = 1 − F(2) = e⁻² ≈ 0.135, and P(1 ≤ X ≤ 2) = e⁻¹ − e⁻² ≈ 0.368 − 0.135 = 0.233.")}
      </p>
      <H3>{tx(t, "mRv_constTitle", "Finding the constant, the median and other quantiles")}</H3>
      <p>
        {tx(t, "mRv_constBody",
          "A density is often known only up to a constant factor. If f(x) = c x² on [0, 3], the constant is fixed by the total area: ∫₀³ c x² dx = c · 27/3 = 9c = 1, so c = 1/9. Then P(X ≤ 1) = ∫₀¹ x²/9 dx = 1/27. The median m is the value with half the probability on each side, F(m) = ½. For f = 2x: m² = ½, m = √½ ≈ 0.707. For the waiting time: 1 − e⁻ᵐ = ½, m = ln 2 ≈ 0.693 minutes. In the same way the 90th percentile solves F(x) = 0.9; for the waiting time x = ln 10 ≈ 2.30 minutes.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mRv_cdfMethodTip", "To find the density of a new variable such as Y = 2X, go through the CDF. F_Y(y) = P(2X ≤ y) = P(X ≤ y/2) = F_X(y/2). Differentiate with the chain rule: f_Y(y) = f_X(y/2) · ½. Stretching the values by 2 spreads the same probability over twice the length, so the density halves. If X is uniform on [0, 1], Y = 2X is uniform on [0, 2] with height ½.")}
      </Callout>
      <p>
        {tx(t, "mRv_roundBody",
          "Measured data are always rounded, so in practice \"X = 170 cm\" means an interval such as 169.5 ≤ X < 170.5, which has positive probability, approximately f(170) · 1. The continuous model with probability-0 points is not a paradox but a very accurate idealisation, and integrals are much easier to handle than enormous sums.")}
      </p>
      <LessonTable
        headers={["", tx(t, "mRv_tDisc", "discrete X"), tx(t, "mRv_tCont", "continuous X")]}
        rows={[
          [tx(t, "mRv_tDescr", "described by"), "pmf p(x) = P(X = x)", tx(t, "mRv_tDens", "density f(x), probability per unit")],
          ["P(X = x)", "p(x)", "0"],
          ["P(a ≤ X ≤ b)", "Σ p(x) " + tx(t, "mRv_tOver", "over a ≤ x ≤ b"), "∫ₐᵇ f(x) dx"],
          [tx(t, "mRv_tTotal", "total"), "Σ p(x) = 1", "∫ f(x) dx = 1"],
          ["F(x) = P(X ≤ x)", tx(t, "mRv_tStairs", "staircase, jumps of p(x)"), tx(t, "mRv_tSmooth", "smooth, F′ = f")],
        ]}
      />

      <H2>{tx(t, "mRv_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mRv_ex1", "1. M = the larger face of two dice. M ≤ m means both dice ≤ m: F(m) = m²/36. So P(M = m) = F(m) − F(m − 1) = (m² − (m − 1)²)/36 = (2m − 1)/36: 1/36, 3/36, 5/36, …, 11/36, which add to 36/36 ✓.")}</p>
      <p>{tx(t, "mRv_ex2", "2. Heads in 4 tosses: P(H = 2) = C(4, 2)/16 = 6/16. P(H ≥ 1) = 1 − P(H = 0) = 1 − 1/16 = 15/16.")}</p>
      <p>{tx(t, "mRv_ex3", "3. Is p(x) = x/10 for x = 1, 2, 3, 4 a pmf? All values are positive and 1/10 + 2/10 + 3/10 + 4/10 = 1 ✓. P(X ≥ 3) = 7/10.")}</p>
      <p>{tx(t, "mRv_ex4", "4. f(x) = c(1 − x²) on [−1, 1]: ∫ = c(2 − 2/3) = 4c/3 = 1, c = 3/4. By symmetry P(X ≤ 0) = ½, so the median is 0.")}</p>
      <p>{tx(t, "mRv_ex5", "5. X uniform on [0, 10]: P(X > 7) = 3/10; F(x) = x/10 on [0, 10]; its 25th percentile solves x/10 = 0.25: x = 2.5.")}</p>
      <p>{tx(t, "mRv_ex6", "6. Waiting time with f = e⁻ˣ: P(X > 3 | X > 1) = P(X > 3)/P(X > 1) = e⁻³/e⁻¹ = e⁻² ≈ 0.135, the same as P(X > 2). Having already waited a minute changes nothing: this variable has no memory.")}</p>

      <H2>{tx(t, "mRv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRv_tWrong", "Wrong"), tx(t, "mRv_tRight", "Right"), tx(t, "mRv_tWhy", "Why")]}
        rows={[
          [tx(t, "mRv_m1w", "f(x) is the probability of x"), tx(t, "mRv_m1r", "f(x) Δx ≈ P(x ≤ X ≤ x + Δx)"), tx(t, "mRv_m1", "a density is probability per unit; it can exceed 1")],
          [tx(t, "mRv_m2w", "P(5 ≤ S ≤ 8) = F(8) − F(5)"), "F(8) − F(4)", tx(t, "mRv_m2", "for whole-number values, F(5) already includes S = 5")],
          [tx(t, "mRv_m3w", "P(X = 2) = f(2) for continuous X"), "P(X = 2) = 0", tx(t, "mRv_m3", "a single point has no width, so no area")],
          [tx(t, "mRv_m4w", "Y = (X − 3)²: P(Y = 1) = 1/6"), "2/6", tx(t, "mRv_m4", "both X = 2 and X = 4 give Y = 1; add their probabilities")],
          [tx(t, "mRv_m5w", "f(x) = c x² on [0, 3] with c = 1/3"), "c = 1/9", tx(t, "mRv_m5", "fix c by making the total area 1")],
          [tx(t, "mRv_m6w", "marginals determine the joint table"), tx(t, "mRv_m6r", "only if X and Y are independent"), tx(t, "mRv_m6", "different joint tables can share the same row and column sums")],
        ]}
      />

      <KeyIdeas t={t} id="mRv" items={[
        "A random variable assigns a number to every outcome; {X = x} and {X ≤ x} are events.",
        "A discrete X is described by its pmf p(x) = P(X = x): non-negative, adding to 1.",
        "The CDF F(x) = P(X ≤ x) rises from 0 to 1; P(a < X ≤ b) = F(b) − F(a).",
        "For Y = g(X), add the probabilities of all x that map to the same y.",
        "A joint table gives marginals by row and column sums; independence means every cell is the product of its margins.",
        "A continuous X has P(X = x) = 0 and a density f: probability is area, ∫ f = 1, and f may exceed 1.",
        "F is the accumulated area of f, so F′ = f; medians and percentiles solve F(x) = ½, 0.9, ….",
      ]} />
    </Article>
  );
}
