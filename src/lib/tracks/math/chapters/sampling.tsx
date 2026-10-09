"use client";

// Probability & Statistics 8: sampling and inference — parameters and
// statistics, random sampling and bias; the sampling distribution of x̄
// (mean μ, standard error σ/√n) and why s² divides by n − 1; the law of
// large numbers proved with Chebyshev; the central limit theorem; sample
// proportions; confidence intervals for a mean and a proportion, what "95%"
// means, margin of error and choosing n, the t correction for small n;
// hypothesis tests: null hypothesis, test statistic, p-value, significance,
// the two kinds of error, and the link between tests and intervals.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SamplingFigure } from "@/components/lesson/figures/math/SamplingFigure";
import { Phi, PhiInv } from "@/components/lesson/figures/math/distMath";

const r = String.raw;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** z* for a two-sided confidence level given in percent: Φ(z*) = 1 − (1 − level)/2. */
const zStar = (level: number) => PhiInv(1 - (1 - level / 100) / 2);

/** Confidence interval for a mean with known σ. */
function ciNumbers(v: Record<string, number>) {
  const { xbar, s, n, lv } = v, z = zStar(lv), se = s / Math.sqrt(n), E = z * se;
  return {
    tex: r`\begin{aligned} &z^* = ${z.toFixed(3)} \qquad \operatorname{SE} = \frac{${s.toFixed(2)}}{\sqrt{${n}}} = ${se.toFixed(4)} \\[4pt] &E = ${z.toFixed(3)} \cdot ${se.toFixed(4)} = \amber{${E.toFixed(3)}} \\[4pt] &${xbar.toFixed(2)} \pm ${E.toFixed(3)} = \green{[\,${(xbar - E).toFixed(3)},\ ${(xbar + E).toFixed(3)}\,]} \end{aligned}`,
  };
}

/** Confidence interval for a proportion: k successes out of n. */
function propNumbers(v: Record<string, number>) {
  const { n, lv } = v, k = Math.min(v.k, n), ph = k / n, z = zStar(lv);
  const se = Math.sqrt((ph * (1 - ph)) / n), E = z * se;
  return {
    tex: r`\begin{aligned} &\hat p = \frac{${k}}{${n}} = ${ph.toFixed(3)} \qquad \operatorname{SE} = \sqrt{\frac{${ph.toFixed(3)} \cdot ${(1 - ph).toFixed(3)}}{${n}}} = ${se.toFixed(4)} \\[4pt] &E = ${z.toFixed(3)} \cdot ${se.toFixed(4)} = \amber{${E.toFixed(3)}} \\[4pt] &${ph.toFixed(3)} \pm ${E.toFixed(3)} = \green{[\,${(ph - E).toFixed(3)},\ ${(ph + E).toFixed(3)}\,]} \end{aligned}`,
  };
}

/** Sample size for a margin of error E. */
function sizeNumbers(v: Record<string, number>) {
  const { s, E, lv } = v, z = zStar(lv), raw = ((z * s) / E) ** 2;
  return {
    tex: r`n = \left(\frac{${z.toFixed(3)} \cdot ${s.toFixed(2)}}{${E.toFixed(3)}}\right)^2 = ${((z * s) / E).toFixed(2)}^2 = ${raw.toFixed(1)} \;\Rightarrow\; n = \green{${Math.ceil(raw - 1e-9)}}`,
  };
}

/** Two-sided z test for a mean with known σ. */
const testNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const { xbar, mu0, s, n } = v, se = s / Math.sqrt(n), z = (xbar - mu0) / se, p = 2 * (1 - Phi(Math.abs(z)));
  const verdict = p < 0.05 ? tx(t, "mSamp_liveReject", "below 0.05: reject the null hypothesis at the 5% level") : tx(t, "mSamp_liveKeep", "not below 0.05: do not reject the null hypothesis");
  return {
    tex: r`\begin{aligned} &z = \frac{${xbar.toFixed(2)} - ${mu0.toFixed(2)}}{${s.toFixed(2)}/\sqrt{${n}}} = \frac{${(xbar - mu0).toFixed(2)}}{${se.toFixed(4)}} = ${z.toFixed(2)} \\[4pt] &\text{p-value} = 2\big(1 - \Phi(${Math.abs(z).toFixed(2)})\big) = \amber{${p < 1e-4 ? p.toExponential(1).replace("e", r`\times 10^{`) + "}" : p.toFixed(4)}} \\[4pt] &\text{${verdict.replace(/%/g, r`\%`)}} \end{aligned}`,
    meter: p,
    meterLabel: `p = ${p < 1e-4 ? p.toExponential(1) : p.toFixed(4)}`,
  };
};

/** The confidence-level slider shared by three live formulas. */
const levelVar = (t: TrackTranslations) =>
  ({ id: "lv", label: tx(t, "mSamp_liveLevel", "level"), min: 80, max: 99.5, step: 0.5, value: 95, fmt: (v: number) => `${v}%` });

export function SamplingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSamp_intro",
          "A poll asks 1000 people and announces what a whole country thinks. A factory measures 50 bolts and certifies a million. How can a small sample say anything reliable about a huge population, and how reliable is it? This chapter joins the two halves of the section: the data of the descriptive chapter are treated as random variables, and the rules of expectation and the normal distribution tell us how far a sample result is likely to be from the truth. The answers are the law of large numbers, the central limit theorem, confidence intervals and hypothesis tests.")}
      </Lead>

      <Goals t={t} id="mSamp" items={[
        "Tell a population's parameters from a sample's statistics.",
        "Explain how the sample mean behaves with the law of large numbers and the central limit theorem.",
        "Build a confidence interval.",
        "Run a hypothesis test and read its result.",
      ]} />

      <H2>{tx(t, "mSamp_paramTitle", "Parameters, statistics and random samples")}</H2>
      <p>
        {tx(t, "mSamp_paramBody",
          "A parameter is a fixed number describing the population, usually unknown: the mean height μ of all adults, the proportion p of voters who back a proposal. A statistic is a number computed from the sample: x̄, s, the sample proportion p̂. The statistic is used to estimate the parameter. The key step is to see that before the sample is drawn, the statistic is a random variable: a different sample would give a different x̄. Its distribution over all possible samples is called its sampling distribution, and it tells us how much to trust the one value we got.")}
      </p>
      <p>
        {tx(t, "mSamp_biasBody",
          "All of this assumes a simple random sample, in which every group of n members of the population is equally likely to be chosen, so that the values X₁, …, Xₙ behave as independent draws from the population's distribution. A sample chosen for convenience (the first people to walk past), or one where people choose themselves (a phone-in vote), is biased: it misses the target systematically, and no formula below can fix that. A famous magazine poll in 1936 asked 2.4 million people and predicted the wrong winner of a US presidential election, because its lists of names came from telephone directories and car registrations, which at the time left out poorer voters. A sample of a few thousand chosen at random did better.")}
      </p>

      <H2>{tx(t, "mSamp_xbarTitle", "The sampling distribution of the mean")}</H2>
      <p>
        {tx(t, "mSamp_xbarBody",
          "The expectation chapter already did the work. If X₁, …, Xₙ are independent with mean μ and standard deviation σ, then X̄ = (X₁ + … + Xₙ)/n has E[X̄] = μ and standard deviation σ/√n. The first fact says x̄ is unbiased: on average over all samples it hits the target. The second says how far a single x̄ typically lands from μ, and this spread has its own name.")}
      </p>
      <Equation label={tx(t, "mSamp_eqSe", "Standard error of the mean")}
        where={[
          [r`\mu,\ \sigma`, tx(t, "mSamp_wMuSig", "the population mean and standard deviation")],
          [r`n`, tx(t, "mSamp_wN", "the sample size")],
          [r`\operatorname{SE}`, tx(t, "mSamp_wSe", "the standard error: the standard deviation of x̄ over all possible samples")],
        ]}
        words={tx(t, "mSamp_seWords", "On average over all samples, x̄ hits μ exactly. A single x̄ typically misses by the population's spread σ divided by the square root of the sample size.")}
        note={tx(t, "mSamp_seNote", "The population size does not appear: for a large population, a sample of 1000 is as precise for a city as for a whole country. What matters is n, and precision grows only like √n.")}>
        {r`E[\bar X] = \mu \qquad \operatorname{SE}(\bar X) = \frac{\sigma}{\sqrt n}`}
      </Equation>
      <H3>{tx(t, "mSamp_s2Title", "Why s² divides by n − 1")}</H3>
      <p>
        {tx(t, "mSamp_s2Intro",
          "The descriptive chapter divided the sum of squared deviations by n − 1 and promised a reason. The deviations are measured from x̄, which sits in the middle of the sample, so they come out a little smaller than the deviations from the true μ. The derivation measures exactly how much smaller.")}
      </p>
      <Derivation t={t} label={tx(t, "mSamp_eqS2Der", "Why n − 1 makes s² unbiased")}
        steps={[
          { tex: r`x_i - \bar x = (x_i - \mu) - (\bar x - \mu)`, full: true, why: tx(t, "mSamp_sd1", "subtract and add μ: each deviation from x̄ is a deviation from μ minus the error of x̄") },
          { tex: r`\sum (x_i - \bar x)^2 = \sum (x_i - \mu)^2 - 2(\bar x - \mu)\sum (x_i - \mu) + n(\bar x - \mu)^2`, full: true, why: tx(t, "mSamp_sd2", "square with (a − b)² = a² − 2ab + b² and add over i = 1 … n. x̄ − μ is the same for every i, so it comes out of the sums, and the last term is added n times") },
          { tex: r`\sum (x_i - \bar x)^2 = \sum (x_i - \mu)^2 - n(\bar x - \mu)^2`, full: true, why: tx(t, "mSamp_sd3", "Σ(xᵢ − μ) = nx̄ − nμ = n(x̄ − μ), so the middle term is −2n(x̄ − μ)². Together with +n(x̄ − μ)² it leaves −n(x̄ − μ)²") },
          { tex: r`E\Big[\sum (X_i - \bar X)^2\Big] = n\sigma^2 - n \cdot \frac{\sigma^2}{n}`, full: true, why: tx(t, "mSamp_sd4", "take expectations. Each (Xᵢ − μ)² has mean σ², the definition of the variance, and there are n of them. (X̄ − μ)² has mean Var(X̄) = σ²/n") },
          { tex: r`= \green{(n-1)\,\sigma^2}`, full: true, why: tx(t, "mSamp_sd5", "so dividing the sum by n − 1 gives E[s²] = σ² exactly. Dividing by n would come out low by the factor (n − 1)/n") },
        ]} />

      <H2>{tx(t, "mSamp_llnTitle", "The law of large numbers")}</H2>
      <p>
        {tx(t, "mSamp_llnBody2",
          "The probability chapter took it on trust that relative frequencies settle down to probabilities. Now it can be proved with two facts from the expectation chapter: the variance of X̄ and Chebyshev's inequality. Fix any margin ε > 0 and ask how likely the average is to miss μ by ε or more.")}
      </p>
      <Derivation t={t} label={tx(t, "mSamp_eqLlnDer", "The law of large numbers from Chebyshev")}
        steps={[
          { tex: r`\operatorname{Var}(\bar X) = \frac{\sigma^2}{n}`, full: true, why: tx(t, "mSamp_ld1", "the average of n independent values with variance σ² (expectation chapter)") },
          { tex: r`P\big(|\bar X - \mu| \ge \varepsilon\big) \le \frac{\operatorname{Var}(\bar X)}{\varepsilon^2}`, full: true, why: tx(t, "mSamp_ld2", "Chebyshev's inequality P(|Y − E[Y]| ≥ ε) ≤ Var(Y)/ε², applied to Y = X̄, whose mean is μ") },
          { tex: r`P\big(|\bar X - \mu| \ge \varepsilon\big) \le \frac{\sigma^2}{n\,\varepsilon^2}`, full: true, why: tx(t, "mSamp_ld3", "put in Var(X̄) = σ²/n") },
          { tex: r`\frac{\sigma^2}{n\,\varepsilon^2} \green{\xrightarrow[n\to\infty]{} 0}`, full: true, why: tx(t, "mSamp_ld4", "σ and ε stay fixed while n grows, so the bound shrinks to 0. However small the margin, enough observations make a miss that large as unlikely as we like") },
        ]} />
      <p>
        {tx(t, "mSamp_llnFreq",
          "For a frequency, let Xᵢ be 1 when an event happens on trial i and 0 otherwise: X̄ is then the relative frequency and μ = p, so the relative frequency settles on the probability.")}
      </p>
      <Equation label={tx(t, "mSamp_eqLln", "Weak law of large numbers")}
        where={[[r`\varepsilon`, tx(t, "mSamp_wEps", "any fixed margin of error, however small")]]}
        words={tx(t, "mSamp_llnWords", "The chance that the average misses the true mean by ε or more is at most σ² over nε², and that shrinks to zero as the sample grows.")}
        note={tx(t, "mSamp_llnNote", "It says the proportion settles, not that the counts balance out. After 10 000 tosses with 5100 heads, the excess of 100 heads is not \"corrected\"; it is simply diluted: 100 extra heads in 10 000 is 1%, in a million it is 0.01%.")}>
        {r`P\big(|\bar X - \mu| \ge \varepsilon\big) \le \frac{\sigma^2}{n\,\varepsilon^2} \xrightarrow[n\to\infty]{} 0`}
      </Equation>

      <H2>{tx(t, "mSamp_cltTitle", "The central limit theorem")}</H2>
      <p>
        {tx(t, "mSamp_cltBody",
          "The law of large numbers says where X̄ goes; the central limit theorem says what shape its random scatter has on the way. However the population is distributed (lopsided, two-humped, a die), as long as it has a finite variance, the distribution of the average of n independent draws gets closer and closer to a normal distribution as n grows. The sum does too, since it is just n times the average. This is why the normal curve is everywhere: any quantity that is the total of many small independent contributions is approximately normal.")}
      </p>
      <Equation label={tx(t, "mSamp_eqClt", "Central limit theorem")}
        where={[
          [r`\frac{\bar X - \mu}{\sigma/\sqrt n}`, tx(t, "mSamp_wZ", "the average, standardised: minus its mean, divided by its standard error")],
          [r`\Phi(z)`, tx(t, "mSamp_wPhi", "the standard normal CDF from the distributions chapter")],
        ]}
        words={tx(t, "mSamp_cltWords", "Standardise the average: subtract μ and divide by its standard error. For large n, its probabilities are those of the standard normal, whatever the population looks like.")}
        note={tx(t, "mSamp_cltNote", "How large must n be? For roughly symmetric populations 10 or so is plenty; for strongly skewed ones, 30 or more. The proof uses tools beyond this course, but the figure shows it happening.")}>
        {r`P\!\left(\frac{\bar X - \mu}{\sigma/\sqrt n} \le z\right) \xrightarrow[n\to\infty]{} \Phi(z)`}
      </Equation>

      <SamplingFigure t={t} />

      <p>
        {tx(t, "mSamp_cltEx",
          "Examples. The average of 100 dice has mean 3.5 and standard error 1.708/10 ≈ 0.171, so P(average above 3.8) ≈ P(Z > 0.3/0.171) = P(Z > 1.75) ≈ 0.04. The sum of 36 dice has mean 126 and σ = √(36 · 35/12) = √105 ≈ 10.2; P(sum ≥ 140) ≈ P(Z ≥ (139.5 − 126)/10.2) = P(Z ≥ 1.32) ≈ 0.09, with the continuity correction since sums are whole numbers. The normal approximation to the binomial in the distributions chapter was the central limit theorem applied to n coin indicators.")}
      </p>
      <H3>{tx(t, "mSamp_propTitle", "Sample proportions")}</H3>
      <p>
        {tx(t, "mSamp_propBody",
          "When each member of the population either has a property or not, the sample proportion p̂ = (number with it)/n is the average of n indicators with mean p and variance p(1 − p). So E[p̂] = p, SE(p̂) = √(p(1 − p)/n), and for large n, p̂ is approximately normal. For a poll of 1000 people with p near 0.5: SE ≈ √(0.25/1000) ≈ 0.016, about 1.6 percentage points.")}
      </p>

      <H2>{tx(t, "mSamp_ciTitle", "Confidence intervals")}</H2>
      <p>
        {tx(t, "mSamp_ciIntro",
          "Turn the central limit theorem around: it says how far X̄ strays from μ, so it also says how far μ can be from X̄. Start from the standardised mean and solve for μ.")}
      </p>
      <Derivation t={t} label={tx(t, "mSamp_eqCiDer", "From the bell to an interval for the mean")}
        steps={[
          { tex: r`P(-1.96 \le Z \le 1.96) = 0.95`, full: true, why: tx(t, "mSamp_cd1", "from the Φ table: Φ(1.96) − Φ(−1.96) = 0.975 − 0.025 = 0.95") },
          { tex: r`-1.96 \le \frac{\bar X - \mu}{\sigma/\sqrt n} \le 1.96`, full: true, why: tx(t, "mSamp_cd2", "by the central limit theorem the standardised mean behaves like Z, so this event also has probability 0.95") },
          { tex: r`-1.96\,\frac{\sigma}{\sqrt n} \le \bar X - \mu \le 1.96\,\frac{\sigma}{\sqrt n}`, full: true, why: tx(t, "mSamp_cd3", "multiply all three parts by σ/√n, which is positive, so the inequalities keep their direction") },
          { tex: r`\green{\bar X - 1.96\,\frac{\sigma}{\sqrt n} \le \mu \le \bar X + 1.96\,\frac{\sigma}{\sqrt n}}`, full: true, why: tx(t, "mSamp_cd4", "subtract X̄ from all three parts and multiply by −1, which flips both inequalities and swaps the two ends. It is the same event, so its probability is still 0.95") },
        ]} />
      <p>
        {tx(t, "mSamp_ciAfter",
          "So the random interval X̄ ± 1.96 σ/√n contains μ with probability 0.95. Once the sample is drawn and x̄ is a number, the interval is fixed and either contains μ or not; we call it a 95% confidence interval, meaning it was produced by a method that succeeds 95% of the time.")}
      </p>
      <Equation label={tx(t, "mSamp_eqCi", "Confidence interval for a mean")}
        words={tx(t, "mSamp_ciWords", "Start at the sample mean and go z* standard errors to each side. z* is set by how sure you want to be.")}
        where={[
          [r`\bar x`, tx(t, "mSamp_wXbar", "the sample mean: the centre of the interval")],
          [r`z^*`, tx(t, "mSamp_wZstar", "the critical value for the chosen level: 1.645 for 90%, 1.96 for 95%, 2.576 for 99%")],
          [r`\sigma/\sqrt n`, tx(t, "mSamp_wSe2", "the standard error; when σ is unknown, the sample's s is used instead")],
          [r`E = z^*\sigma/\sqrt n`, tx(t, "mSamp_wMargin", "the margin of error, half the width of the interval")],
        ]}
        note={tx(t, "mSamp_ciNote", "A higher confidence level needs a larger z* and gives a wider interval: more certainty, less precision. For a proportion the same recipe reads p̂ ± z* √(p̂(1 − p̂)/n).")}>
        {r`\bar x \pm z^* \frac{\sigma}{\sqrt n}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mSamp_tCase", "situation"), tx(t, "mSamp_tCalc", "calculation"), tx(t, "mSamp_tInt", "95% interval")]}
        rows={[
          [tx(t, "mSamp_tBolts", "50 bolts, x̄ = 10.2 mm, σ = 0.5 mm"), "1.96 · 0.5/√50 = 1.96 · 0.0707 ≈ 0.14", "10.06 to 10.34 mm"],
          [tx(t, "mSamp_tPoll", "poll: 520 of 1000 in favour"), "1.96 · √(0.52 · 0.48/1000) ≈ 1.96 · 0.0158 ≈ 0.031", "48.9% to 55.1%"],
          [tx(t, "mSamp_tBolts99", "the bolts at 99%"), "2.576 · 0.0707 ≈ 0.18", "10.02 to 10.38 mm"],
        ]}
      />
      <LiveFormula label={tx(t, "mSamp_liveCi", "Try it: a confidence interval for a mean")}
        tex={r`\bar x \pm z^* \frac{\sigma}{\sqrt n}`}
        vars={[
          { id: "xbar", label: "x̄", min: 9, max: 11, step: 0.01, value: 10.2, fmt: v => v.toFixed(2) },
          { id: "s", label: "σ", min: 0.1, max: 2, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
          { id: "n", label: "n", min: 2, max: 400, step: 1, value: 50, fmt: v => String(v) },
          levelVar(t),
        ]}
        compute={ciNumbers}
        note={tx(t, "mSamp_liveCiNote", "The start is the bolts: 10.06 to 10.34 mm. Raise the level to 99% for the third row of the table. Then try n = 200: four times the bolts, half the margin.")} />
      <LiveFormula label={tx(t, "mSamp_liveProp", "Try it: a confidence interval for a proportion")}
        tex={r`\hat p \pm z^* \sqrt{\frac{\hat p\,(1-\hat p)}{n}}`}
        vars={[
          { id: "n", label: "n", min: 10, max: 3000, step: 10, value: 1000, fmt: v => String(v) },
          { id: "k", label: tx(t, "mSamp_liveYes", "in favour"), min: 0, max: 3000, step: 1, value: 520, fmt: v => String(v) },
          levelVar(t),
        ]}
        compute={propNumbers}
        note={tx(t, "mSamp_livePropNote", "The start is the poll: 520 of 1000 in favour gives 0.489 to 0.551, so the poll cannot tell whether a majority is in favour. Set n = 400 and 48 in favour for worked example 3. If the count is set above n it is treated as n.")} />
      <p>
        {tx(t, "mSamp_nBody",
          "Choosing the sample size. To get a margin E, solve E = z*σ/√n for n: n = (z*σ/E)². To pin the bolts' mean down to ±0.05 mm at 95%: n = (1.96 · 0.5/0.05)² = 19.6² ≈ 384.2, so 385 bolts. For a poll with a ±2-point margin, use the worst case p = 0.5: n = (1.96 · 0.5/0.02)² = 49² = 2401. Halving the margin always costs four times as many observations.")}
      </p>
      <LiveFormula label={tx(t, "mSamp_liveSize", "Try it: how many observations?")}
        tex={r`n = \left(\frac{z^*\,\sigma}{E}\right)^2`}
        vars={[
          { id: "s", label: "σ", min: 0.1, max: 2, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
          { id: "E", label: "E", min: 0.01, max: 0.5, step: 0.005, value: 0.05, fmt: v => v.toFixed(3) },
          levelVar(t),
        ]}
        compute={sizeNumbers}
        note={tx(t, "mSamp_liveSizeNote", "The start is the bolts: 385. Halve E to 0.025 and n grows about four times, to 1537. For the poll, σ = 0.5 (the worst case p = 0.5) and E = 0.02 give 2401. n is rounded up, since a smaller sample would miss the margin.")} />
      <Callout type="info" t={t}>
        {tx(t, "mSamp_tTip", "With a small sample and an unknown σ, replacing σ by s adds extra uncertainty, since s itself varies from sample to sample. For data from a normal population the exact fix replaces z* by a slightly larger number from Student's t distribution with n − 1 degrees of freedom: for n = 10 and 95% it is 2.262 instead of 1.96. For n above about 30 the difference hardly matters.")}
      </Callout>

      <H2>{tx(t, "mSamp_testTitle", "Hypothesis tests")}</H2>
      <p>
        {tx(t, "mSamp_testBody",
          "A coin is tossed 100 times and shows 61 heads. Is it biased, or could a fair coin easily do that? A hypothesis test answers by assuming the boring explanation and checking whether the data would be surprising under it. The null hypothesis H₀ is the no-effect claim (p = 0.5); the alternative H₁ is what we suspect (p ≠ 0.5). Under H₀ the number of heads has mean 50 and σ = 5, so, with the continuity correction, P(61 or more) ≈ P(Z ≥ (60.5 − 50)/5) = P(Z ≥ 2.1) ≈ 0.018. A result as far from 50 in the other direction (39 or fewer) is equally unlikely, so the two-sided probability is about 0.036.")}
      </p>
      <Equation label={tx(t, "mSamp_eqTest", "z test statistic and p-value")}
        where={[
          [r`\mu_0`, tx(t, "mSamp_wMu0", "the value of the mean claimed by the null hypothesis")],
          [r`z`, tx(t, "mSamp_wZtest", "how many standard errors the sample result lies from that claim")],
          [r`\text{p-value}`, tx(t, "mSamp_wP", "the probability, if H₀ were true, of a result at least as extreme as the one observed")],
        ]}
        words={tx(t, "mSamp_testWords", "Count how many standard errors the result lies from the claimed value. The p-value is the chance of landing at least that far out, on either side, if the claim is true.")}
        note={tx(t, "mSamp_testNote", "Decide beforehand on a significance level α, often 0.05. If the p-value is below α, reject H₀: the data are too surprising for it. Otherwise we fail to reject it, which is not the same as proving it true.")}>
        {r`z = \frac{\bar x - \mu_0}{\sigma/\sqrt n} \qquad \text{p-value} = P\big(|Z| \ge |z|\big) = 2\big(1 - \Phi(|z|)\big)`}
      </Equation>
      <p>
        {tx(t, "mSamp_testEx",
          "The coin: p ≈ 0.036 < 0.05, so at the 5% level we reject fairness; at the 1% level we would not. The bolts: the specification says μ = 10.0 mm, and 50 bolts gave x̄ = 10.2 with σ = 0.5. z = 0.2/0.0707 ≈ 2.83, p = 2(1 − Φ(2.83)) ≈ 0.005: strong evidence that the machine is off. Notice that the 95% interval 10.06 to 10.34 does not contain 10.0. In general a two-sided test at level α rejects μ₀ exactly when μ₀ lies outside the 1 − α confidence interval.")}
      </p>
      <LiveFormula label={tx(t, "mSamp_liveTest", "Try it: a z test")}
        tex={r`z = \frac{\bar x - \mu_0}{\sigma/\sqrt n}, \qquad \text{p-value} = 2\big(1 - \Phi(|z|)\big)`}
        vars={[
          { id: "xbar", label: "x̄", min: 9.5, max: 10.5, step: 0.01, value: 10.2, fmt: v => v.toFixed(2) },
          { id: "mu0", label: <>μ<sub>0</sub></>, min: 9.5, max: 10.5, step: 0.01, value: 10, fmt: v => v.toFixed(2) },
          { id: "s", label: "σ", min: 0.1, max: 2, step: 0.05, value: 0.5, fmt: v => v.toFixed(2) },
          { id: "n", label: "n", min: 2, max: 400, step: 1, value: 50, fmt: v => String(v) },
        ]}
        compute={testNumbers(t)}
        note={tx(t, "mSamp_liveTestNote", "The start is the bolts: z ≈ 2.83 and p ≈ 0.005. Lower n to 10: the same 0.2 mm difference gives p ≈ 0.21, no longer evidence. With n = 400, even x̄ = 10.05 is significant: a small effect, detected by a large sample.")} />
      <LessonTable
        headers={["", tx(t, "mSamp_tH0true", "H₀ true"), tx(t, "mSamp_tH0false", "H₀ false")]}
        rows={[
          [tx(t, "mSamp_tReject", "reject H₀"), tx(t, "mSamp_tType1", "type I error (probability α)"), tx(t, "mSamp_tCorrect1", "correct: the power of the test")],
          [tx(t, "mSamp_tKeep", "do not reject"), tx(t, "mSamp_tCorrect2", "correct"), tx(t, "mSamp_tType2", "type II error")],
        ]}
      />
      <p>
        {tx(t, "mSamp_errorsBody",
          "A test can go wrong in two ways, like a smoke alarm that rings without a fire (type I) or stays silent during one (type II). Lowering α makes false alarms rarer but real effects harder to detect; the only way to reduce both at once is a larger sample. And a significant result is not the same as an important one: with a million tosses, a coin that lands heads 50.2% of the time is detected with p far below 0.05, although the bias is tiny. Always report the size of the effect, ideally as a confidence interval, not just the p-value.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mSamp_pWarn", "The p-value is not the probability that H₀ is true. It is P(data this extreme | H₀), and turning it around needs Bayes' rule and a prior, just as P(positive | healthy) was not P(healthy | positive) in the conditional-probability chapter. Also, if you run 20 independent tests of true null hypotheses at α = 0.05, you expect one false alarm: 20 · 0.05 = 1.")}
      </Callout>

      <H2>{tx(t, "mSamp_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mSamp_ex1", "1. A population has σ = 12. Samples of 36 give x̄ with SE = 12/6 = 2. To halve it to 1 you need n = 144.")}</p>
      <p>{tx(t, "mSamp_ex2", "2. 64 light bulbs last on average 980 h; σ = 80 h is known. 95% interval: 980 ± 1.96 · 10 = 960.4 to 999.6 h. The maker's claim of 1000 h is just outside: rejected at the 5% level (z = (980 − 1000)/10 = −2, p ≈ 0.046), though not at 1%.")}</p>
      <p>{tx(t, "mSamp_ex3", "3. A survey of 400 people finds 48 who are left-handed: p̂ = 0.12, SE = √(0.12 · 0.88/400) ≈ 0.0162, 95% interval 0.088 to 0.152.")}</p>
      <p>{tx(t, "mSamp_ex4", "4. A die is rolled 600 times and shows 120 sixes. Under fairness the count has mean 100 and σ = √(600 · 1/6 · 5/6) ≈ 9.13; z = (119.5 − 100)/9.13 ≈ 2.14; one-sided p ≈ 0.016.")}</p>
      <p>{tx(t, "mSamp_ex5", "5. Chebyshev's guarantee for a fair coin: after 10 000 tosses, P(|p̂ − 0.5| ≥ 0.02) ≤ 0.25/(10 000 · 0.0004) = 0.0625. The central limit theorem gives the much smaller true value: z = 0.02/0.005 = 4, about 0.00006.")}</p>

      <H2>{tx(t, "mSamp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSamp_tWrong", "Wrong"), tx(t, "mSamp_tRight", "Right"), tx(t, "mSamp_tWhy", "Why")]}
        rows={[
          [tx(t, "mSamp_m1w", "a huge sample cannot be wrong"), tx(t, "mSamp_m1r", "a biased sample stays biased"), tx(t, "mSamp_m1", "size reduces random error, not systematic error")],
          [tx(t, "mSamp_m2w", "95% chance that μ is in this interval"), tx(t, "mSamp_m2r", "95% of intervals made this way contain μ"), tx(t, "mSamp_m2", "μ is fixed; the randomness is in the interval")],
          [tx(t, "mSamp_m3w", "SE = σ/n"), "σ/√n", tx(t, "mSamp_m3", "variances divide by n, standard deviations by √n")],
          [tx(t, "mSamp_m4w", "p-value = P(H₀ is true)"), tx(t, "mSamp_m4r", "P(result this extreme | H₀)"), tx(t, "mSamp_m4", "the conditional is the other way round")],
          [tx(t, "mSamp_m5w", "not significant, so H₀ is true"), tx(t, "mSamp_m5r", "not enough evidence against H₀"), tx(t, "mSamp_m5", "a small sample may simply miss a real effect")],
          [tx(t, "mSamp_m6w", "the law of large numbers evens out the counts"), tx(t, "mSamp_m6r", "it evens out the proportions"), tx(t, "mSamp_m6", "differences in counts are diluted, not repaid")],
        ]}
      />

      <KeyIdeas t={t} id="mSamp" items={[
        "A statistic is a random variable; its sampling distribution measures how much it varies between samples.",
        "x̄ is unbiased for μ with standard error σ/√n; s² with n − 1 is unbiased for σ².",
        "Law of large numbers: P(|X̄ − μ| ≥ ε) ≤ σ²/(nε²) → 0.",
        "Central limit theorem: averages and sums of many independent values are approximately normal, whatever the population.",
        "A confidence interval x̄ ± z*σ/√n captures μ for the stated share of samples; n = (z*σ/E)² gives margin E.",
        "A test assumes H₀, computes how surprising the data are (the p-value) and rejects H₀ if p < α.",
        "Significant ≠ important, and a p-value is not the probability that H₀ is true.",
      ]} />
    </Article>
  );
}
