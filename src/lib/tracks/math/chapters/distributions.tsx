"use client";

// Probability & Statistics 6: the common distributions — Bernoulli and
// binomial (pmf by counting sequences, mean np and variance np(1 − p) by
// indicators); geometric (series, first-step argument, memoryless); Poisson
// as the limit of the binomial, e^(−λ) from (1 − λ/n)ⁿ, mean = variance = λ;
// the continuous uniform; the exponential and its link to Poisson counts; the
// normal: every term of the density, the constant from the Gaussian
// integral, 68–95–99.7, standardising and the Φ table, normal approximation
// to the binomial with the continuity correction; a summary table.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DistributionFigure } from "@/components/lesson/figures/math/DistributionFigure";

const r = String.raw;

export function DistributionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDist_intro",
          "Many random situations look different on the surface but share the same structure: counting successes in repeated trials, waiting for the first success, counting rare events in a period of time, measuring a quantity made of many small influences. Each structure gives a family of distributions with a name, a formula and one or two parameters, the knobs that pick one member of the family. This chapter derives the six families you will meet most often, each from its story, and computes their means and variances with the tools of the previous chapter.")}
      </Lead>

      <H2>{tx(t, "mDist_binTitle", "Bernoulli and binomial: successes in n trials")}</H2>
      <p>
        {tx(t, "mDist_bernBody",
          "The simplest random variable has two values: 1 (\"success\") with probability p and 0 (\"failure\") with probability 1 − p. This is a Bernoulli(p) variable: one coin toss, one patient who recovers or not, one item that is defective or not. From the expectation chapter, its mean is p and its variance p(1 − p). Now repeat the trial n times, independently, with the same p each time, and count the successes K. K has the binomial distribution, Binomial(n, p).")}
      </p>
      <p>
        {tx(t, "mDist_binDeriv",
          "Derivation. Take n = 5 and ask for exactly k = 2 successes. One way is SSFFF, with probability p · p · (1 − p)(1 − p)(1 − p) = p²(1 − p)³ by independence. Any other arrangement, such as FSFSF, contains the same factors in a different order, so it has the same probability. How many arrangements are there? Choosing which 2 of the 5 places hold the successes: C(5, 2) = 10. So P(K = 2) = 10 p²(1 − p)³. The same reasoning for any n and k gives the formula.")}
      </p>
      <Equation label={tx(t, "mDist_eqBin", "Binomial distribution")}
        where={[
          [r`n`, tx(t, "mDist_wN", "the number of independent trials")],
          [r`p`, tx(t, "mDist_wP", "the probability of success in each trial")],
          [r`k`, tx(t, "mDist_wK", "the number of successes, from 0 to n")],
          [r`\binom{n}{k}`, tx(t, "mDist_wC", "the number of ways to place the k successes among the n trials")],
          [r`p^k (1-p)^{n-k}`, tx(t, "mDist_wSeq", "the probability of one particular sequence with k successes and n − k failures")],
        ]}
        note={tx(t, "mDist_binNote", "The probabilities add to 1 by the binomial theorem: Σ C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ = (p + (1 − p))ⁿ = 1ⁿ = 1. That is where the name comes from.")}>
        {r`P(K = k) = \binom{n}{k} p^k (1-p)^{n-k}, \qquad E[K] = np, \qquad \operatorname{Var}(K) = np(1-p)`}
      </Equation>
      <p>
        {tx(t, "mDist_binMean",
          "The mean and variance come free from indicators. K = I₁ + … + Iₙ, where Iⱼ is 1 if trial j succeeds. Each Iⱼ has mean p and variance p(1 − p), and they are independent, so E[K] = np and Var(K) = np(1 − p). Summing k · C(n, k) pᵏ(1 − p)ⁿ⁻ᵏ directly would also work, but takes a page.")}
      </p>
      <H3>{tx(t, "mDist_quizTitle", "Worked example: guessing a quiz")}</H3>
      <p>
        {tx(t, "mDist_quizBody",
          "A quiz has 10 questions with 4 options each, and a student guesses every answer. The number right is Binomial(10, 1/4): mean 2.5, variance 10 · 1/4 · 3/4 = 1.875, σ ≈ 1.37. What is the chance of passing with 5 or more? Add the terms k = 5 to 10:")}
      </p>
      <LessonTable
        headers={["k", "C(10, k)", "(1/4)ᵏ (3/4)¹⁰⁻ᵏ", "P(K = k)"]}
        rows={[
          ["5", "252", "0.000 231 7", "0.058 4"],
          ["6", "210", "0.000 077 2", "0.016 2"],
          ["7", "120", "0.000 025 7", "0.003 1"],
          ["8", "45", "0.000 008 6", "0.000 4"],
          ["9, 10", "10, 1", "…", "0.000 03"],
          [tx(t, "mDist_tTotal", "total"), "", "", "≈ 0.078"],
        ]}
      />
      <p>
        {tx(t, "mDist_quizEnd",
          "About 7.8%: guessing passes roughly one quiz in thirteen. Notice how quickly the terms shrink once k passes the mean.")}
      </p>

      <H2>{tx(t, "mDist_geoTitle", "Geometric: waiting for the first success")}</H2>
      <p>
        {tx(t, "mDist_geoBody",
          "Keep repeating the same independent trial until the first success, and let N be the number of trials needed, counting the successful one. N = k means k − 1 failures followed by a success. Rolling a die until a 6: P(N = 1) = 1/6, P(N = 2) = 5/6 · 1/6, P(N = 3) = (5/6)² · 1/6, and so on, each value a factor 5/6 less likely than the one before.")}
      </p>
      <Equation label={tx(t, "mDist_eqGeo", "Geometric distribution")}
        where={[
          [r`k`, tx(t, "mDist_wKgeo", "the trial on which the first success happens: 1, 2, 3, …")],
          [r`(1-p)^{k-1}`, tx(t, "mDist_wFail", "the probability that the first k − 1 trials all fail")],
          [r`P(N > k)`, tx(t, "mDist_wTail", "no success in the first k trials")],
        ]}
        note={tx(t, "mDist_geoNote", "The probabilities form a geometric series with ratio 1 − p (hence the name) and add to p · 1/(1 − (1 − p)) = 1.")}>
        {r`P(N = k) = (1-p)^{k-1}\,p, \qquad P(N > k) = (1-p)^k, \qquad E[N] = \frac1p, \qquad \operatorname{Var}(N) = \frac{1-p}{p^2}`}
      </Equation>
      <p>
        {tx(t, "mDist_geoMean",
          "The mean by the first-step argument: the first trial is always used. With probability p it succeeds and we stop; with probability 1 − p it fails and, since the trials have no memory, we are back where we began, still expecting E[N] more trials. So E[N] = 1 + (1 − p) E[N], which gives p E[N] = 1, E[N] = 1/p. (The series route: differentiate Σ qᵏ = 1/(1 − q) to get Σ k qᵏ⁻¹ = 1/(1 − q)², then multiply by p with q = 1 − p.) For the die: 6 rolls on average, variance (5/6)/(1/36) = 30, σ ≈ 5.5, and P(no 6 in 10 rolls) = (5/6)¹⁰ ≈ 0.16.")}
      </p>
      <p>
        {tx(t, "mDist_memBody",
          "Memorylessness. P(N > m + k | N > m) = (1 − p)ᵐ⁺ᵏ/(1 − p)ᵐ = (1 − p)ᵏ = P(N > k). After m failures, the remaining wait has the same distribution as a fresh start. The die has not \"saved up\" a 6: this is the gambler's fallacy from the conditional-probability chapter, seen as a formula.")}
      </p>

      <H2>{tx(t, "mDist_poisTitle", "Poisson: counting rare events")}</H2>
      <p>
        {tx(t, "mDist_poisMotiv",
          "A help line receives on average λ = 3 calls per hour, at random moments. How likely are 0 calls in an hour, or 5? Split the hour into n tiny slots, so small that two calls never share one. Each slot then holds a call with a small probability p = λ/n, independently, so the count is Binomial(n, λ/n). Now let n grow without limit.")}
      </p>
      <p>
        {tx(t, "mDist_poisDeriv",
          "Write the binomial term as C(n, k) (λ/n)ᵏ (1 − λ/n)ⁿ⁻ᵏ = [n(n − 1)⋯(n − k + 1)/nᵏ] · λᵏ/k! · (1 − λ/n)ⁿ · (1 − λ/n)⁻ᵏ. As n → ∞ with k fixed: the bracket is (n/n)((n − 1)/n)⋯ → 1; (1 − λ/n)⁻ᵏ → 1; and (1 − λ/n)ⁿ → e^(−λ), the same limit that defined e in the exponents chapter, (1 + x/n)ⁿ → eˣ with x = −λ. What is left is the Poisson distribution.")}
      </p>
      <Equation label={tx(t, "mDist_eqPois", "Poisson distribution")}
        where={[
          [r`\lambda`, tx(t, "mDist_wLam", "the average number of events in the period (the rate times the length of the period)")],
          [r`k`, tx(t, "mDist_wKpois", "the number of events: 0, 1, 2, … with no upper limit")],
          [r`e^{-\lambda}`, tx(t, "mDist_wE", "the probability of no events at all, the k = 0 term")],
          [r`\lambda^k/k!`, tx(t, "mDist_wTerm", "the k-th term of the Taylor series of e^λ")],
        ]}
        note={tx(t, "mDist_poisNote", "The probabilities add to e^(−λ) Σ λᵏ/k! = e^(−λ) e^λ = 1, using the series of eˣ from the series chapter. The mean: Σ k e^(−λ) λᵏ/k! = λ e^(−λ) Σ λᵏ⁻¹/(k − 1)! = λ. The variance is also λ, as the binomial's np(1 − p) suggests when p → 0.")}>
        {r`P(K = k) = e^{-\lambda}\,\frac{\lambda^k}{k!}, \qquad E[K] = \operatorname{Var}(K) = \lambda`}
      </Equation>
      <p>
        {tx(t, "mDist_poisEx",
          "The help line, λ = 3: P(0) = e⁻³ ≈ 0.050, P(1) = 3e⁻³ ≈ 0.149, P(2) = 4.5e⁻³ ≈ 0.224, so P(at least 2) = 1 − 0.050 − 0.149 ≈ 0.801. Over half an hour the mean is 1.5, so P(no call in 30 min) = e^(−1.5) ≈ 0.223. The Poisson model fits typing errors per page, radioactive decays per second, cars through a quiet junction per minute: many opportunities, each rarely used, independently.")}
      </p>
      <LessonTable
        headers={["k", "0", "1", "2", "3", "4"]}
        rows={[
          [tx(t, "mDist_tBin", "Binomial(100, 0.02)"), "0.133", "0.271", "0.273", "0.182", "0.090"],
          [tx(t, "mDist_tPois", "Poisson(2)"), "0.135", "0.271", "0.271", "0.180", "0.090"],
        ]}
      />
      <p>
        {tx(t, "mDist_poisApprox",
          "The table shows how good the approximation already is for n = 100, p = 0.02 (say, 100 items with a 2% defect rate): agreement to about two decimals, with a formula that needs no huge binomial coefficients.")}
      </p>

      <DistributionFigure t={t} />

      <H2>{tx(t, "mDist_unifTitle", "The continuous uniform")}</H2>
      <p>
        {tx(t, "mDist_unifBody",
          "Uniform(a, b) spreads the probability evenly over [a, b]: f(x) = 1/(b − a) there, 0 elsewhere. Every interval of the same length inside [a, b] is equally likely. From the previous chapters: F(x) = (x − a)/(b − a) on [a, b], mean (a + b)/2, variance (b − a)²/12. It models a rounding error (uniform on [−0.5, 0.5], σ = 1/√12 ≈ 0.29 of a unit), or where a stick breaks when nothing favours any point.")}
      </p>

      <H2>{tx(t, "mDist_expTitle", "Exponential: waiting in continuous time")}</H2>
      <p>
        {tx(t, "mDist_expBody",
          "Back to the help line with λ calls per hour. Let T be the time until the next call. T > t means no call in [0, t], and the number of calls in that interval is Poisson with mean λt, so P(T > t) = e^(−λt). Hence F(t) = 1 − e^(−λt) and, differentiating, the density f(t) = λe^(−λt). The previous chapter's waiting time with f = e⁻ˣ was the case λ = 1.")}
      </p>
      <Equation label={tx(t, "mDist_eqExp", "Exponential distribution")}
        where={[
          [r`\lambda`, tx(t, "mDist_wRate", "the rate: events per unit time")],
          [r`e^{-\lambda t}`, tx(t, "mDist_wSurv", "the probability of still waiting at time t")],
          [r`1/\lambda`, tx(t, "mDist_wMeanExp", "the mean waiting time: 3 calls per hour means 20 minutes on average")],
        ]}
        note={tx(t, "mDist_expNote", "The mean ∫₀^∞ t λe^(−λt) dt = 1/λ and E[T²] = 2/λ² come from integration by parts, as in the previous chapter with λ = 1; so Var = 2/λ² − 1/λ² = 1/λ². Like the geometric, the exponential is memoryless: P(T > s + t | T > s) = e^(−λt).")}>
        {r`f(t) = \lambda e^{-\lambda t}\ (t \ge 0), \qquad P(T > t) = e^{-\lambda t}, \qquad E[T] = \frac1\lambda, \qquad \operatorname{Var}(T) = \frac1{\lambda^2}`}
      </Equation>
      <p>
        {tx(t, "mDist_expEx",
          "With 3 calls per hour (λ = 3 per hour), P(wait more than 30 minutes) = e^(−3 · 0.5) ≈ 0.223, the same number as \"no call in half an hour\" above, as it must be. The median wait solves e^(−3t) = ½: t = ln 2/3 ≈ 0.231 h ≈ 14 minutes, shorter than the 20-minute mean because a few very long waits pull the mean up. The exponential also describes the life of an atom in radioactive decay; the half-life ln 2/λ is its median.")}
      </p>

      <H2>{tx(t, "mDist_normTitle", "The normal distribution")}</H2>
      <p>
        {tx(t, "mDist_normMotiv",
          "Heights, measurement errors, the weight of bread loaves, the sum of many dice: quantities that are built from many small independent influences all end up with the same bell-shaped histogram. The sampling chapter explains why (the central limit theorem). The bell is the normal, or Gaussian, distribution, with two parameters: its centre μ and its spread σ.")}
      </p>
      <Equation label={tx(t, "mDist_eqNorm", "Normal distribution N(μ, σ²)")}
        where={[
          [r`\mu`, tx(t, "mDist_wMu", "the mean: the centre and peak of the bell, and its axis of symmetry")],
          [r`\sigma`, tx(t, "mDist_wSig", "the standard deviation: the distance from the centre to the inflection points, where the curve changes from bending down to bending up")],
          [r`\frac{x-\mu}{\sigma}`, tx(t, "mDist_wZ", "the distance from the mean measured in standard deviations, z")],
          [r`e^{-z^2/2}`, tx(t, "mDist_wBell", "the bell itself: 1 at the centre and falling very fast; at z = 3 it is already 0.011")],
          [r`\frac1{\sigma\sqrt{2\pi}}`, tx(t, "mDist_wConst", "the constant that makes the total area 1")],
        ]}
        note={tx(t, "mDist_normNote", "The constant comes from the Gaussian integral of the multiple-integrals chapter, ∫ e^(−u²) du = √π. Substituting x = μ + σ√2 u gives ∫ e^(−(x − μ)²/(2σ²)) dx = σ√2 · √π = σ√(2π), so dividing by it leaves area 1. The mean is μ by symmetry; integration by parts shows the variance is σ².")}>
        {r`f(x) = \frac{1}{\sigma\sqrt{2\pi}}\; e^{-\frac12\left(\frac{x-\mu}{\sigma}\right)^2}`}
      </Equation>
      <p>
        {tx(t, "mDist_normShape",
          "Changing μ slides the bell sideways without changing its shape. Changing σ stretches it horizontally and, to keep the area 1, squashes it vertically: the peak height is 1/(σ√(2π)), about 0.4/σ. The normal density has no antiderivative made of ordinary functions, so its areas are read from a table of the standard normal, the case μ = 0, σ = 1, called Z. Its CDF is written Φ(z) = P(Z ≤ z).")}
      </p>
      <LessonTable
        headers={["z", "0", "0.5", "1", "1.5", "1.645", "1.96", "2", "2.5", "3"]}
        rows={[["Φ(z)", "0.500", "0.691", "0.841", "0.933", "0.950", "0.975", "0.977", "0.994", "0.9987"]]}
      />
      <p>
        {tx(t, "mDist_phiUse",
          "Negative z by symmetry: Φ(−z) = 1 − Φ(z). The table contains the famous 68–95–99.7 rule: P(−1 ≤ Z ≤ 1) = 2 · 0.841 − 1 ≈ 0.68, within 2σ about 0.95 (exactly 1.96σ for 95%), within 3σ about 0.997. Compare Chebyshev's guarantees of 75% and 89%: knowing the shape is normal buys much sharper statements.")}
      </p>
      <H3>{tx(t, "mDist_stdTitle", "Any normal through the table")}</H3>
      <p>
        {tx(t, "mDist_stdBody",
          "If X is N(μ, σ²), then Z = (X − μ)/σ is standard normal: an aX + b of a normal is still normal, and the rules of the expectation chapter give it mean 0 and variance 1. So P(X ≤ x) = Φ((x − μ)/σ). Adult heights in a population: μ = 170 cm, σ = 8 cm.")}
      </p>
      <LessonTable
        headers={[tx(t, "mDist_tQ", "question"), tx(t, "mDist_tZ", "standardise"), tx(t, "mDist_tAns", "answer")]}
        rows={[
          ["P(X > 186)", "z = (186 − 170)/8 = 2", "1 − Φ(2) ≈ 0.023"],
          ["P(162 < X < 178)", "z = −1 … 1", "0.841 − 0.159 ≈ 0.683"],
          ["P(X < 158)", "z = −1.5", "1 − 0.933 ≈ 0.067"],
          [tx(t, "mDist_tPct", "90th percentile"), "Φ(z) = 0.9 → z ≈ 1.28", "170 + 1.28 · 8 ≈ 180.3 cm"],
        ]}
      />
      <p>
        {tx(t, "mDist_sumNorm",
          "Sums of independent normals are normal, with means and variances added. If a loaf's dough is N(500, 10²) grams and the tin is N(200, 5²), the filled tin weighs N(700, 125), σ = √125 ≈ 11.2 g.")}
      </p>
      <H3>{tx(t, "mDist_approxTitle", "The normal approximation to the binomial")}</H3>
      <p>
        {tx(t, "mDist_approxBody",
          "When np(1 − p) is large (a rule of thumb: at least about 10), the binomial histogram is close to the normal curve with the same mean and variance. Toss a coin 100 times: np = 50, σ = √25 = 5. For P(at least 60 heads), the exact sum has 41 terms. The bar for 60 covers 59.5 to 60.5, so the area starts at 59.5: this half-unit shift is the continuity correction. z = (59.5 − 50)/5 = 1.9 and P ≈ 1 − Φ(1.9) ≈ 1 − 0.971 = 0.029; the exact value is 0.028.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mDist_normWarn", "Not everything is normal. Waiting times, incomes and city sizes are strongly lopsided, and a normal model would give negative waits or badly underestimate the chance of extreme values. Check the story, or plot the data, before reaching for the bell.")}
      </Callout>

      <H2>{tx(t, "mDist_sumTitle", "Summary")}</H2>
      <LessonTable
        headers={[tx(t, "mDist_tName", "distribution"), tx(t, "mDist_tStory", "story"), tx(t, "mDist_tForm", "P(X = k) or f(x)"), tx(t, "mDist_tMean", "mean"), tx(t, "mDist_tVar", "variance")]}
        rows={[
          ["Bernoulli(p)", tx(t, "mDist_sBern", "one trial"), "pᵏ(1 − p)¹⁻ᵏ, k = 0, 1", "p", "p(1 − p)"],
          ["Binomial(n, p)", tx(t, "mDist_sBin", "successes in n trials"), "C(n, k) pᵏ(1 − p)ⁿ⁻ᵏ", "np", "np(1 − p)"],
          ["Geometric(p)", tx(t, "mDist_sGeo", "trials until the first success"), "(1 − p)ᵏ⁻¹ p", "1/p", "(1 − p)/p²"],
          ["Poisson(λ)", tx(t, "mDist_sPois", "rare events in a period"), "e^(−λ) λᵏ/k!", "λ", "λ"],
          ["Uniform(a, b)", tx(t, "mDist_sUnif", "no point favoured"), "1/(b − a)", "(a + b)/2", "(b − a)²/12"],
          ["Exponential(λ)", tx(t, "mDist_sExp", "time until the next event"), "λe^(−λx)", "1/λ", "1/λ²"],
          ["Normal(μ, σ²)", tx(t, "mDist_sNorm", "sum of many small effects"), "e^(−(x − μ)²/2σ²)/(σ√(2π))", "μ", "σ²"],
        ]}
      />

      <H2>{tx(t, "mDist_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mDist_ex1", "1. 5% of bulbs are faulty; a box holds 20. P(no faulty) = 0.95²⁰ ≈ 0.358. P(exactly 1) = 20 · 0.05 · 0.95¹⁹ ≈ 0.377. Mean 1, σ = √0.95 ≈ 0.97.")}</p>
      <p>{tx(t, "mDist_ex2", "2. A basketball player scores 70% of free throws. The chance the first miss comes on the 4th throw: 0.7³ · 0.3 ≈ 0.103. Expected throws until a miss: 1/0.3 ≈ 3.3.")}</p>
      <p>{tx(t, "mDist_ex3", "3. A page averages 0.5 typing errors. P(error-free page) = e^(−0.5) ≈ 0.607. In a 10-page chapter the count is Poisson(5): P(0) = e⁻⁵ ≈ 0.007.")}</p>
      <p>{tx(t, "mDist_ex4", "4. A lamp's life is exponential with mean 1000 h (λ = 0.001 per hour). P(it lasts past 2000 h) = e⁻² ≈ 0.135. Having lasted 500 h, P(it lasts 1000 more) = e⁻¹ ≈ 0.368, the same as for a new lamp.")}</p>
      <p>{tx(t, "mDist_ex5", "5. Exam scores N(65, 10²). The share scoring above 80: z = 1.5, 1 − 0.933 ≈ 6.7%. The score that only 2.5% beat: 65 + 1.96 · 10 ≈ 84.6.")}</p>
      <p>{tx(t, "mDist_ex6", "6. 400 tosses of a fair coin: mean 200, σ = 10. P(between 190 and 210 heads inclusive) ≈ P(189.5 ≤ X ≤ 210.5) = Φ(1.05) − Φ(−1.05) ≈ 0.71.")}</p>

      <H2>{tx(t, "mDist_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDist_tWrong", "Wrong"), tx(t, "mDist_tRight", "Right"), tx(t, "mDist_tWhy", "Why")]}
        rows={[
          [tx(t, "mDist_m1w", "binomial for draws without replacement"), tx(t, "mDist_m1r", "only if trials are independent with fixed p"), tx(t, "mDist_m1", "drawing cards without putting them back changes p each time")],
          ["P(K = 2) = p²(1 − p)³", "C(5, 2) p²(1 − p)³", tx(t, "mDist_m2", "that is one arrangement; there are C(5, 2) of them")],
          [tx(t, "mDist_m3w", "Poisson with λ per hour for a 2-hour window"), tx(t, "mDist_m3r", "use 2λ"), tx(t, "mDist_m3", "λ is the mean count for the period actually considered")],
          [tx(t, "mDist_m4w", "N(μ, σ²) with σ² in the z formula"), "z = (x − μ)/σ", tx(t, "mDist_m4", "divide by the standard deviation, not the variance")],
          [tx(t, "mDist_m5w", "P(X ≥ 60) ≈ 1 − Φ(2) for 100 coins"), "1 − Φ(1.9)", tx(t, "mDist_m5", "the bar for 60 starts at 59.5: continuity correction")],
          [tx(t, "mDist_m6w", "exponential: mean wait λ"), tx(t, "mDist_m6r", "mean wait 1/λ"), tx(t, "mDist_m6", "a high rate means short waits")],
        ]}
      />

      <KeyIdeas t={t} id="mDist" items={[
        "Binomial(n, p): C(n, k) pᵏ(1 − p)ⁿ⁻ᵏ successes in n independent trials; mean np, variance np(1 − p).",
        "Geometric(p): (1 − p)ᵏ⁻¹p for the first success on trial k; mean 1/p; memoryless.",
        "Poisson(λ): e^(−λ)λᵏ/k!, the limit of Binomial(n, λ/n); mean and variance both λ.",
        "Exponential(λ): the waiting time between Poisson events; P(T > t) = e^(−λt), mean 1/λ, memoryless.",
        "Normal(μ, σ²): the bell; standardise with z = (x − μ)/σ and read Φ from a table.",
        "68–95–99.7% of a normal lies within 1, 2, 3 standard deviations of the mean.",
        "A binomial with large np(1 − p) is nearly normal; use the continuity correction of ½.",
      ]} />
    </Article>
  );
}
