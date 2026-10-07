"use client";

// Probability & Statistics 6: expectation and variance — the mean as a
// long-run average and a balance point; E[X] for discrete and continuous
// variables; E[g(X)] and why E[g(X)] ≠ g(E[X]); linearity and the indicator
// trick (hat-check problem); fair games; variance and standard deviation,
// the shortcut E[X²] − μ²; Var(aX + b); covariance and the variance of a sum;
// the average of n independent copies (σ/√n); standardising; Chebyshev.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ExpectationFigure } from "@/components/lesson/figures/math/ExpectationFigure";

const r = String.raw;

export function ExpectationContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mExpv_intro",
          "A random variable is described completely by its distribution, but a whole table or curve is a lot to carry around. Two numbers summarise most of what we need: where the values sit on average, the expectation, and how widely they scatter around that average, the variance. This chapter defines both for discrete and continuous variables, computes them by hand, and proves the rules that make them so useful: expectations add, even for dependent variables, and variances add for independent ones. The last rule explains why averaging many measurements makes them more precise.")}
      </Lead>

      <H2>{tx(t, "mExp_avgTitle", "The long-run average")}</H2>
      <p>
        {tx(t, "mExp_avgBody",
          "Roll a die 600 times. By the frequency interpretation from the probability chapter, each face shows up about 100 times, so the total of all rolls is about 100 · 1 + 100 · 2 + … + 100 · 6 = 2100, and the average per roll is about 2100/600 = 3.5. Divide each count by 600 before adding and the same calculation reads 1 · 1/6 + 2 · 1/6 + … + 6 · 1/6 = 21/6 = 3.5. The average of many results is the sum of each value times its probability. That number is the expectation, or expected value, or mean, of X.")}
      </p>
      <p>
        {tx(t, "mExp_notBody",
          "\"Expected\" does not mean \"most likely\" or even \"possible\": no roll ever shows 3.5. It is the centre the average settles on in the long run, just as an average family can have 2.3 children.")}
      </p>

      <H2>{tx(t, "mExp_defTitle", "Definition: a probability-weighted average")}</H2>
      <Equation label={tx(t, "mExp_eqDef", "Expectation of a discrete random variable")}
        where={[
          [r`E[X]`, tx(t, "mExp_wE", "the expectation (mean) of X, also written μ or μ_X")],
          [r`x`, tx(t, "mExp_wX", "each possible value of X")],
          [r`p(x)`, tx(t, "mExp_wP", "its probability P(X = x), the weight given to that value")],
          [r`\sum_x`, tx(t, "mExp_wSum", "the sum over all possible values")],
        ]}
        note={tx(t, "mExp_defNote", "Since the weights p(x) add to 1, this is a weighted average of the values, like a course grade where each exam counts with its own weight. Values with more probability pull harder.")}>
        {r`\mu = E[X] = \sum_x x\,p(x)`}
      </Equation>
      <p>
        {tx(t, "mExp_balanceBody",
          "Physically, the mean is a balance point. Put a weight p(x) at each position x on a weightless board; the board balances on a pivot at μ, because the definition says Σ (x − μ) p(x) = E[X] − μ = 0: the turning effects of the weights on the left and on the right cancel exactly. That is why one far-away value with a small probability can move the mean a lot, just as a small child at the far end of a see-saw can balance an adult near the middle.")}
      </p>

      <ExpectationFigure t={t} />

      <H3>{tx(t, "mExp_exampleTitle", "Computing means by hand")}</H3>
      <LessonTable
        headers={[tx(t, "mExp_tVar", "X"), tx(t, "mExp_tCalc", "calculation"), "E[X]"]}
        rows={[
          [tx(t, "mExp_tDie", "one die"), "(1 + 2 + 3 + 4 + 5 + 6) · 1/6", "3.5"],
          [tx(t, "mExp_tSum", "sum of two dice"), "(2·1 + 3·2 + 4·3 + 5·4 + 6·5 + 7·6 + 8·5 + 9·4 + 10·3 + 11·2 + 12·1)/36 = 252/36", "7"],
          [tx(t, "mExp_tCoins", "heads in 3 coins"), "0·1/8 + 1·3/8 + 2·3/8 + 3·1/8 = 12/8", "1.5"],
          [tx(t, "mExp_tBern", "1 if success (prob. p), else 0"), "1·p + 0·(1 − p)", "p"],
        ]}
      />
      <p>
        {tx(t, "mExp_gameBody",
          "Games and prices. A raffle sells 1000 tickets at 5 each; one prize is worth 2000 and three are worth 500. Your net gain G is 1995 with probability 1/1000, 495 with probability 3/1000 and −5 with probability 996/1000. E[G] = (1995 + 3 · 495 − 5 · 996)/1000 = (1995 + 1485 − 4980)/1000 = −1.5. On average each ticket loses 1.5: the organisers collect 5000 and pay out 3500. A game is called fair when the expected net gain is 0; here the fair price would be 3.5, the expected prize.")}
      </p>

      <H2>{tx(t, "mExp_contTitle", "The mean of a continuous variable")}</H2>
      <p>
        {tx(t, "mExp_contBody",
          "For a continuous X the sum becomes an integral. Chop the line into tiny intervals of width dx; the probability of the interval at x is about f(x) dx, and each contributes value times probability, x · f(x) dx. Adding them up is exactly the integral. Geometrically, E[X] is the x-coordinate of the centroid of the region under the density: where a cut-out of that shape would balance on a knife edge.")}
      </p>
      <Equation label={tx(t, "mExp_eqCont", "Expectation of a continuous random variable")}
        where={[
          [r`f(x)`, tx(t, "mExp_wF", "the density of X")],
          [r`x\,f(x)\,dx`, tx(t, "mExp_wXf", "value times the probability of a thin slice at x")],
        ]}>
        {r`E[X] = \int_{-\infty}^{\infty} x\,f(x)\,dx`}
      </Equation>
      <p>
        {tx(t, "mExp_contEx",
          "Uniform on [a, b]: f = 1/(b − a), so E[X] = ∫ₐᵇ x/(b − a) dx = (b² − a²)/(2(b − a)) = (a + b)/2, the midpoint, as symmetry demands. The ramp f(x) = 2x on [0, 1]: E[X] = ∫₀¹ 2x² dx = 2/3, pulled to the right where the density is higher. The waiting time f(x) = e⁻ˣ on [0, ∞): by parts with u = x, dv = e⁻ˣ dx, ∫₀^∞ x e⁻ˣ dx = [−x e⁻ˣ]₀^∞ + ∫₀^∞ e⁻ˣ dx = 0 + 1 = 1 minute.")}
      </p>

      <H2>{tx(t, "mExp_lotusTitle", "The expectation of a function of X")}</H2>
      <p>
        {tx(t, "mExp_lotusBody",
          "To find E[g(X)] there is no need to work out the distribution of g(X) first: weight each value g(x) by the probability of the x it came from. The values that coincide are then automatically added together, which is what the method of the random-variables chapter did by hand.")}
      </p>
      <Equation label={tx(t, "mExp_eqLotus", "Expectation of g(X)")}
        where={[[r`g(x)`, tx(t, "mExp_wG", "the new value computed from each old value x")]]}>
        {r`E[g(X)] = \sum_x g(x)\,p(x) \qquad E[g(X)] = \int_{-\infty}^{\infty} g(x)\,f(x)\,dx`}
      </Equation>
      <p>
        {tx(t, "mExp_lotusEx",
          "For one die, E[X²] = (1 + 4 + 9 + 16 + 25 + 36)/6 = 91/6 ≈ 15.17. But (E[X])² = 3.5² = 12.25. They differ: in general E[g(X)] ≠ g(E[X]). The average of the squares is not the square of the average, and the average of 1/X is not 1/(average). A car that covers half a trip at 30 km/h and half at 90 km/h does not average 60 km/h: over 90 km it takes 1.5 h + 0.5 h = 2 h, which is 45 km/h. Only for straight-line functions does the order not matter, as the next section proves.")}
      </p>

      <H2>{tx(t, "mExp_linTitle", "Linearity: expectations always add")}</H2>
      <Equation label={tx(t, "mExp_eqLin", "Linearity of expectation")}
        where={[
          [r`a, b`, tx(t, "mExp_wAb", "fixed numbers: a changes the scale, b shifts every value")],
          [r`X, Y`, tx(t, "mExp_wXY", "any two random variables on the same experiment, independent or not")],
        ]}
        note={tx(t, "mExp_linNote", "Proof of the first: Σ (ax + b) p(x) = a Σ x p(x) + b Σ p(x) = a E[X] + b · 1. For the second, write E[X + Y] as a sum over the joint table, Σ (x + y) p(x, y), and split it into Σ x p(x, y) + Σ y p(x, y); summing each over the other variable leaves the marginals, E[X] + E[Y]. No independence was used.")}>
        {r`E[aX + b] = a\,E[X] + b \qquad E[X + Y] = E[X] + E[Y]`}
      </Equation>
      <p>
        {tx(t, "mExp_linEx",
          "Converting units is linear: if the mean temperature is 20 °C, the mean in °F is 1.8 · 20 + 32 = 68 °F, without redoing the average. And the sum of two dice has mean 3.5 + 3.5 = 7 without the 36-row table.")}
      </p>
      <H3>{tx(t, "mExp_indTitle", "The indicator trick")}</H3>
      <p>
        {tx(t, "mExp_indBody",
          "Linearity is most powerful for counting. To find the expected number of times something happens, write the count as a sum of indicators, variables that are 1 if one particular thing happens and 0 if not. Each indicator has mean equal to its probability, so the expected count is the sum of the probabilities, even when the events are tangled together.")}
      </p>
      <p>
        {tx(t, "mExp_hatBody",
          "Hat check: n people leave their hats and get them back in random order. How many, on average, get their own hat? Let Iₖ = 1 if person k gets theirs. The hat that person k receives is equally likely to be any of the n, so E[Iₖ] = 1/n, and the expected number of matches is n · 1/n = 1, for 5 people or 5 million. Working out the full distribution of matches is hard; its mean is one line. In the same way: n coin tosses give n/2 heads on average; among 30 people there are C(30, 2) = 435 pairs, each sharing a birthday with probability 1/365, so on average 435/365 ≈ 1.19 shared-birthday pairs.")}
      </p>

      <H2>{tx(t, "mExp_varTitle", "Variance: how far from the mean")}</H2>
      <p>
        {tx(t, "mExp_varMotiv",
          "Two games can have the same mean and feel completely different: winning exactly 1 every time, or winning 101 with probability 1/100 and 0 otherwise, both have mean 1. To measure spread, look at the deviations X − μ. Their average is useless, always 0, since the positive and negative ones cancel (that is the balance property). Squaring makes every deviation count positively and punishes large ones most. The average squared deviation is the variance.")}
      </p>
      <Equation label={tx(t, "mExp_eqVar", "Variance and standard deviation")}
        where={[
          [r`\operatorname{Var}(X)`, tx(t, "mExp_wVar", "the variance, also written σ²: the mean squared distance from μ")],
          [r`(X - \mu)^2`, tx(t, "mExp_wDev", "the squared deviation of X from its mean")],
          [r`\sigma`, tx(t, "mExp_wSd", "the standard deviation, the square root of the variance, measured in the same units as X")],
          [r`E[X^2] - \mu^2`, tx(t, "mExp_wShort", "the shortcut: mean of the square minus square of the mean")],
        ]}
        note={tx(t, "mExp_varNote", "The shortcut follows from linearity: E[(X − μ)²] = E[X² − 2μX + μ²] = E[X²] − 2μ E[X] + μ² = E[X²] − 2μ² + μ² = E[X²] − μ². It also shows E[X²] ≥ μ², since a variance is never negative.")}>
        {r`\sigma^2 = \operatorname{Var}(X) = E\big[(X - \mu)^2\big] = E[X^2] - \mu^2 \qquad \sigma = \sqrt{\operatorname{Var}(X)}`}
      </Equation>
      <p>
        {tx(t, "mExp_sdUnits",
          "If X is in metres, the variance is in square metres, which is hard to picture; that is why we take the square root. σ is a typical distance from the mean: not the average distance exactly, but of the same size.")}
      </p>
      <H3>{tx(t, "mExp_dieVarTitle", "The variance of a die, two ways")}</H3>
      <LessonTable
        headers={["x", "1", "2", "3", "4", "5", "6", tx(t, "mExp_tTotal", "total ÷ 6")]}
        rows={[
          ["x − 3.5", "−2.5", "−1.5", "−0.5", "0.5", "1.5", "2.5", "0"],
          ["(x − 3.5)²", "6.25", "2.25", "0.25", "0.25", "2.25", "6.25", "17.5/6 ≈ 2.917"],
          ["x²", "1", "4", "9", "16", "25", "36", "91/6 ≈ 15.167"],
        ]}
      />
      <p>
        {tx(t, "mExp_dieVarBody",
          "The definition gives 17.5/6 = 35/12 ≈ 2.917 directly. The shortcut gives 91/6 − 3.5² = 91/6 − 49/4 = 182/12 − 147/12 = 35/12, the same. So σ = √(35/12) ≈ 1.71: a roll is typically about 1.7 away from 3.5. For the two games above, the steady one has variance 0; the lottery-style one has E[X²] = 101² · 0.01 = 102.01, variance 102.01 − 1 = 101.01 and σ ≈ 10.05.")}
      </p>
      <p>
        {tx(t, "mExp_contVar",
          "Continuous examples: uniform on [0, 1] has E[X²] = ∫₀¹ x² dx = 1/3, so Var = 1/3 − 1/4 = 1/12 and σ ≈ 0.289. On [a, b] everything stretches by (b − a), so Var = (b − a)²/12. The waiting time with f = e⁻ˣ has E[X²] = ∫₀^∞ x² e⁻ˣ dx = 2 (by parts twice), so Var = 2 − 1² = 1.")}
      </p>

      <H2>{tx(t, "mExp_rulesTitle", "Rules for variance")}</H2>
      <Equation label={tx(t, "mExp_eqVarLin", "Variance under shifts and scaling")}
        where={[[r`a, b`, tx(t, "mExp_wAb2", "fixed numbers")]]}
        note={tx(t, "mExp_varLinNote", "Adding b moves every value and the mean by the same amount, so the deviations do not change. Multiplying by a multiplies every deviation by a and every squared deviation by a². So σ scales by |a|: in °F the spread is 1.8 times the spread in °C, and the +32 has no effect.")}>
        {r`\operatorname{Var}(aX + b) = a^2 \operatorname{Var}(X) \qquad \sigma_{aX+b} = |a|\,\sigma_X`}
      </Equation>
      <p>
        {tx(t, "mExp_covBody",
          "For sums, expand the square: Var(X + Y) = E[((X − μ_X) + (Y − μ_Y))²] = Var X + Var Y + 2 E[(X − μ_X)(Y − μ_Y)]. The last expectation is the covariance, Cov(X, Y). It is positive when X and Y tend to be above their means together, negative when one tends to be high while the other is low. For independent variables E[XY] = E[X] E[Y] (every cell of the joint table is a product, so the double sum factors), which makes the covariance 0.")}
      </p>
      <Equation label={tx(t, "mExp_eqSum", "Covariance and the variance of a sum")}
        where={[
          [r`\operatorname{Cov}(X,Y)`, tx(t, "mExp_wCov", "the covariance: the mean product of the two deviations")],
          [r`E[XY] - E[X]E[Y]`, tx(t, "mExp_wCovShort", "the shortcut, proved like the one for variance")],
        ]}
        note={tx(t, "mExp_sumNote", "For independent X and Y the covariance is 0, so variances add. Standard deviations do not add; they combine like the sides of a right triangle: σ_{X+Y} = √(σ_X² + σ_Y²).")}>
        {r`\operatorname{Cov}(X,Y) = E[XY] - E[X]E[Y] \qquad \operatorname{Var}(X+Y) = \operatorname{Var}X + \operatorname{Var}Y + 2\operatorname{Cov}(X,Y)`}
      </Equation>
      <p>
        {tx(t, "mExp_sumEx",
          "Two dice: Var(S) = 35/12 + 35/12 = 35/6 ≈ 5.83, σ ≈ 2.42. A coin indicator has Var = E[I²] − p² = p − p² = p(1 − p) (note I² = I), so the number of heads in n independent tosses has variance n · 1/4 and σ = √n/2. And Var(X − Y) = Var X + Var Y as well for independent variables, since Var(−Y) = (−1)² Var Y: the difference of two dice is just as spread as their sum.")}
      </p>
      <H3>{tx(t, "mExp_avgNTitle", "Why averages are more precise")}</H3>
      <p>
        {tx(t, "mExp_avgNBody",
          "Let X₁, …, Xₙ be independent copies of X (n repeated measurements) with mean μ and standard deviation σ, and let X̄ = (X₁ + … + Xₙ)/n be their average. Linearity gives E[X̄] = nμ/n = μ. Variances of independent variables add, and the factor 1/n comes out squared: Var(X̄) = n σ²/n² = σ²/n. So the average is centred on the right value, and its spread shrinks like σ/√n. Four times as many measurements halve the error; a hundred times as many cut it by ten. This square-root law is the engine of the sampling chapter.")}
      </p>
      <Equation label={tx(t, "mExp_eqMean", "Mean and spread of an average of n independent copies")}
        where={[
          [r`\bar X`, tx(t, "mExp_wBar", "the average of the n values")],
          [r`\sigma/\sqrt n`, tx(t, "mExp_wSe", "its standard deviation, called the standard error")],
        ]}>
        {r`E[\bar X] = \mu \qquad \operatorname{Var}(\bar X) = \frac{\sigma^2}{n} \qquad \sigma_{\bar X} = \frac{\sigma}{\sqrt n}`}
      </Equation>

      <H2>{tx(t, "mExp_stdTitle", "Standardising and Chebyshev's inequality")}</H2>
      <p>
        {tx(t, "mExp_stdBody",
          "Subtract the mean and divide by the standard deviation: Z = (X − μ)/σ. By the rules above, E[Z] = 0 and Var(Z) = 1. Z measures how many standard deviations X lies from its mean, which makes values on different scales comparable. A score of 80 in a test with mean 65 and σ = 10 has z = 1.5; a score of 70 in a test with mean 60 and σ = 4 has z = 2.5, the more unusual result.")}
      </p>
      <Equation label={tx(t, "mExp_eqCheb", "Chebyshev's inequality")}
        where={[
          [r`k`, tx(t, "mExp_wK", "any number of standard deviations greater than 1")],
          [r`|X - \mu| \ge k\sigma`, tx(t, "mExp_wFar", "X lands at least k standard deviations away from the mean")],
        ]}
        note={tx(t, "mExp_chebNote", "Proof: the outcomes with |X − μ| ≥ kσ each contribute at least (kσ)² to the variance, so σ² ≥ (kσ)² · P(|X − μ| ≥ kσ). Divide by k²σ². It holds for every distribution, which is why it is crude: at least 75% of any distribution lies within 2σ and at least 89% within 3σ.")}>
        {r`P\big(|X - \mu| \ge k\sigma\big) \le \frac{1}{k^2}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "mExp_stPeteTip", "A mean need not exist. Toss a coin until the first head; if that takes k tosses you win 2ᵏ. Each possible k contributes 2ᵏ · (1/2)ᵏ = 1 to the expectation, and there are infinitely many k, so E = 1 + 1 + 1 + … = ∞. Yet few people would pay even 20 to play. This St Petersburg paradox shows that an infinite (or huge) mean driven by very rare outcomes says little about what actually happens, and it led to the idea of valuing money by its usefulness rather than its amount.")}
      </Callout>

      <H2>{tx(t, "mExp_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mExp_ex1", "1. X takes 0, 1, 2 with probabilities 0.5, 0.3, 0.2. E[X] = 0.3 + 0.4 = 0.7; E[X²] = 0.3 + 0.8 = 1.1; Var = 1.1 − 0.49 = 0.61; σ ≈ 0.78.")}</p>
      <p>{tx(t, "mExp_ex2", "2. Y = 3X − 2 for that X: E[Y] = 3 · 0.7 − 2 = 0.1; Var(Y) = 9 · 0.61 = 5.49.")}</p>
      <p>{tx(t, "mExp_ex3", "3. An insurer charges 300 for a policy that pays 10 000 with probability 0.02. Its expected profit per policy is 300 − 0.02 · 10 000 = 100.")}</p>
      <p>{tx(t, "mExp_ex4", "4. Roll a die until a 6 appears. With p = 1/6 per roll the expected number of rolls is 1/p = 6 (proved in the distributions chapter).")}</p>
      <p>{tx(t, "mExp_ex5", "5. Ten dice: the total has mean 35, variance 10 · 35/12 ≈ 29.2 and σ ≈ 5.4. Their average has mean 3.5 and σ = 1.71/√10 ≈ 0.54.")}</p>
      <p>{tx(t, "mExp_ex6", "6. Uniform on [2, 8]: mean 5, variance 36/12 = 3, σ ≈ 1.73. Chebyshev with k = 2 promises P(|X − 5| ≥ 3.46) ≤ 1/4; the true value is 0, since X never leaves [2, 8].")}</p>

      <H2>{tx(t, "mExp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mExp_tWrong", "Wrong"), tx(t, "mExp_tRight", "Right"), tx(t, "mExp_tWhy", "Why")]}
        rows={[
          [tx(t, "mExp_m1w", "E[X] is the most likely value"), tx(t, "mExp_m1r", "E[X] is the long-run average"), tx(t, "mExp_m1", "a die's mean 3.5 never occurs at all")],
          ["E[X²] = (E[X])²", "E[X²] = Var X + (E[X])²", tx(t, "mExp_m2", "they differ by exactly the variance")],
          ["Var(3X) = 3 Var X", "9 Var X", tx(t, "mExp_m3", "deviations triple, squared deviations grow ninefold")],
          ["Var(X − Y) = Var X − Var Y", tx(t, "mExp_m4r", "Var X + Var Y (independent)"), tx(t, "mExp_m4", "subtracting a random quantity adds uncertainty")],
          ["σ_{X+Y} = σ_X + σ_Y", "√(σ_X² + σ_Y²)", tx(t, "mExp_m5", "variances add for independent variables, not standard deviations")],
          [tx(t, "mExp_m6w", "linearity needs independence"), tx(t, "mExp_m6r", "E[X + Y] = E[X] + E[Y] always"), tx(t, "mExp_m6", "only the variance rule needs independence")],
        ]}
      />

      <KeyIdeas t={t} id="mExp" items={[
        "E[X] = Σ x p(x) or ∫ x f(x) dx: the probability-weighted average and the balance point of the distribution.",
        "E[g(X)] weights g(x) by p(x); in general E[g(X)] ≠ g(E[X]).",
        "Expectation is linear, E[aX + b] = aE[X] + b and E[X + Y] = E[X] + E[Y], with no independence needed.",
        "Indicators turn expected counts into sums of probabilities.",
        "Var X = E[(X − μ)²] = E[X²] − μ²; σ = √Var has the units of X; Var(aX + b) = a² Var X.",
        "Var(X + Y) = Var X + Var Y + 2 Cov; for independent variables the covariance is 0.",
        "The average of n independent copies has mean μ and standard deviation σ/√n.",
        "Z = (X − μ)/σ measures distance in standard deviations; Chebyshev bounds P(|Z| ≥ k) by 1/k².",
      ]} />
    </Article>
  );
}
