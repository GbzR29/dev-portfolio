"use client";

// Algebra: exponents and logarithms — power rules, growth and decay, the
// number e, logarithms as the inverse, solving exponential equations, and
// where both show up in science and everyday life.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ExpLogFigure } from "@/components/lesson/figures/math/ExpLogFigure";

const r = String.raw;

export function ExpLogContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mExp_intro",
          "Some quantities change by adding: a car moving at constant speed gains the same distance every second. Others change by multiplying: a population that doubles every generation, a sound that loses half its energy every metre of wall, money in a savings account that earns interest on its interest. Multiplicative change is described by exponentials, and the tool that turns multiplications back into additions is the logarithm. Science uses both constantly: half-lives, decibels, pH, earthquakes, compound interest.")}
      </Lead>

      <H2>{tx(t, "mExp_powTitle", "Powers and their rules")}</H2>
      <p>
        {tx(t, "mExp_powBody",
          "bⁿ for a whole number n means n copies of b multiplied together: 2⁵ = 2·2·2·2·2 = 32. b is the base, n the exponent. Every rule of exponents follows from counting copies. Multiplying 2³ by 2² puts 3 + 2 copies side by side, so exponents add. Raising 2³ to the power 2 makes 2 groups of 3 copies, so exponents multiply. The rules for zero, negative and fractional exponents are then chosen so that these laws keep working.")}
      </p>
      <Equation label={tx(t, "mExp_eqRules", "Exponent rules")}
        where={[
          [r`b^m\,b^n = b^{m+n}`, tx(t, "mExp_wAdd", "copies side by side: the exponents add")],
          [r`(b^m)^n = b^{mn}`, tx(t, "mExp_wMul", "n groups of m copies: the exponents multiply")],
          [r`b^0 = 1`, tx(t, "mExp_wZero", "forced by the first rule: bⁿ · b⁰ = bⁿ⁺⁰ = bⁿ, so b⁰ must be 1")],
          [r`b^{-n} = 1/b^n`, tx(t, "mExp_wNeg", "forced too: bⁿ · b⁻ⁿ = b⁰ = 1. A negative exponent means \"divide by\"")],
          [r`b^{1/n} = \sqrt[n]{b}`, tx(t, "mExp_wFrac", "(b^(1/n))ⁿ = b¹ = b, so b^(1/n) is the number whose n-th power is b: a root. 2.2 in gamma correction, x^(1/2.2), is a fractional exponent")],
        ]}>
        {r`b^m\,b^n = b^{m+n}, \quad (b^m)^n = b^{mn}, \quad b^0 = 1, \quad b^{-n} = \frac{1}{b^n}, \quad b^{1/n} = \sqrt[n]{b}`}
      </Equation>

      <H2>{tx(t, "mExp_growTitle", "Exponential growth and decay")}</H2>
      <p>
        {tx(t, "mExp_growBody",
          "Put the variable in the exponent and you get an exponential function: y = y₀ · b^(t/T). Every time t increases by T, y is multiplied by b. With b = 2 it doubles every T (doubling time); with b = ½ it halves every T (half-life). The shape is the same in both directions: slow at first and then explosive for growth, fast at first and then lingering for decay. Linear intuition fails badly here: something doubling every day covers half a pond on the second-to-last day before it covers all of it.")}
      </p>
      <Equation label={tx(t, "mExp_eqDecay", "Growth and decay")}
        where={[
          [r`y_0`, tx(t, "mExp_wY0", "the starting value, at t = 0")],
          [r`T`, tx(t, "mExp_wT", "the time it takes to multiply by b once (doubling time or half-life)")],
          [r`e^{-\lambda t}`, tx(t, "mExp_wLambda", "the same curve written with base e and a rate λ = ln 2 / T for a half-life. Physics usually uses this form, because the rate λ appears directly in the laws of cooling, radioactivity and charging")],
        ]}
        note={tx(t, "mExp_eqDecayNote", "Example: a sound fades to half its amplitude every 0.3 s. After 1.2 s = 4 half-lives it is at (½)⁴ = 1/16. Exponential decay never reaches exactly zero; cut it off below a threshold.")}>
        {r`y(t) = y_0 \cdot b^{\,t/T} \qquad\text{decay:}\quad y(t) = y_0\left(\tfrac12\right)^{t/T} = y_0\,e^{-\lambda t}`}
      </Equation>

      <H3>{tx(t, "mExp_eTitle", "The number e")}</H3>
      <p>
        {tx(t, "mExp_eBody",
          "Why do scientists prefer e ≈ 2.71828 as a base? Imagine growing by 100% over one year. Added once at the end, 1 becomes 2. Split into two half-year steps of 50% each, the second step also grows the first step's gain: 1.5 × 1.5 = 2.25. Twelve monthly steps of 1/12 give 2.613, daily steps 2.7146. The limit of ever finer steps, (1 + 1/n)ⁿ as n → ∞, is e: the result of growing continuously. Its defining property, proved in the calculus chapters, is that eˣ grows at a rate equal to its own value, which makes it the natural solution of every \"rate proportional to amount\" problem: cooling, charging, damping, radioactive decay.")}
      </p>
      <Equation label={tx(t, "mExp_eqE", "e as a limit")}
        where={[
          [r`n`, tx(t, "mExp_wN", "the number of compounding steps; each step grows by 1/n of the total rate")],
          [r`e^{x}`, tx(t, "mExp_wEx", "the same limit with total growth x: (1 + x/n)ⁿ → eˣ")],
        ]}>
        {r`e = \lim_{n\to\infty}\left(1 + \frac1n\right)^{n} \approx 2.718281828`}
      </Equation>

      <ExpLogFigure t={t} />

      <H2>{tx(t, "mExp_logTitle", "Logarithms: the inverse")}</H2>
      <p>
        {tx(t, "mExp_logBody",
          "The logarithm answers the question \"what power?\": log₂ 32 = 5 because 2⁵ = 32. It is the inverse function of the exponential, which is why their graphs mirror each other across y = x in the figure. Because exponents add when powers multiply, logarithms turn multiplications into additions. That was their original purpose: before calculators, astronomers multiplied large numbers by adding their logarithms from printed tables.")}
      </p>
      <Equation label={tx(t, "mExp_eqLog", "Definition and rules")}
        where={[
          [r`\log_b y = x \iff b^x = y`, tx(t, "mExp_wDef", "the definition, for b > 0, b ≠ 1 and y > 0 (no power of a positive base is zero or negative)")],
          [r`\log_b(xy) = \log_b x + \log_b y`, tx(t, "mExp_wProd", "from b^m · b^n = b^(m+n)")],
          [r`\log_b(x^k) = k\,\log_b x`, tx(t, "mExp_wPow", "from (b^m)^k = b^(mk)")],
          [r`\log_b x = \frac{\ln x}{\ln b}`, tx(t, "mExp_wChange", "change of base: any logarithm from the natural one (ln = log base e), or from log₁₀, the two a calculator has")],
        ]}>
        {r`\log_b(x\,y) = \log_b x + \log_b y \qquad \log_b(x^k) = k\log_b x \qquad \log_b x = \frac{\ln x}{\ln b}`}
      </Equation>

      <H2>{tx(t, "mExp_solveTitle", "Solving exponential equations")}</H2>
      <p>
        {tx(t, "mExp_solveBody",
          "When the unknown sits in an exponent, as in 2ˣ = 20, none of the moves from the linear equations chapter can reach it. The logarithm can: take the log of both sides and use the power rule to bring the exponent down to the ground floor, where it becomes an ordinary factor. Any base of logarithm works, as long as you use the same one on both sides.")}
      </p>
      <Equation label={tx(t, "mExp_eqSolve", "Solving 2ˣ = 20")}
        notes={[
          tx(t, "mExp_s1", "take log₁₀ of both sides: log(2ˣ) = log 20"),
          tx(t, "mExp_s2", "power rule: x · log 2 = log 20"),
          tx(t, "mExp_s3", "divide by log 2 ≈ 0.3010: x = 1.3010 / 0.3010 ≈ 4.32"),
          tx(t, "mExp_s4", "check: 2⁴ = 16 and 2⁵ = 32, and 20 lies between them, so x between 4 and 5 is right"),
        ]}>
        {r`2^x = 20 \;\Rightarrow\; x\log 2 = \log 20 \;\Rightarrow\; x = \frac{\log 20}{\log 2} \approx 4.32`}
      </Equation>
      <p>
        {tx(t, "mExp_solveEx",
          "Example: 1000 is saved at 5% interest per year. When does it reach 2000? 1000 · 1.05ⁿ = 2000. Divide by 1000: 1.05ⁿ = 2. Take logs: n · log 1.05 = log 2, so n = 0.3010 / 0.0212 ≈ 14.2. After 14 years it is still just short of 2000 (1.05¹⁴ ≈ 1.98), so it takes 15 whole years. Notice the starting amount cancelled: at 5% any sum doubles in about 14.2 years.")}
      </p>

      <H2>{tx(t, "mExp_usesTitle", "Where they show up")}</H2>
      <LessonTable
        headers={[tx(t, "mExp_tWhere", "Where"), tx(t, "mExp_tFormula", "Formula"), tx(t, "mExp_tWhy", "Why")]}
        rows={[
          [tx(t, "mExp_v1", "Compound interest"), "P · (1 + r)ⁿ", tx(t, "mExp_v1b", "each year multiplies the balance by 1 + r: an exponential in the number of years n")],
          [tx(t, "mExp_v2", "Radioactive dating"), "N₀ · (½)^(t/T)", tx(t, "mExp_v2b", "carbon-14 halves every 5730 years; measuring what is left and taking a log gives the age")],
          [tx(t, "mExp_v3", "Sound level"), "dB = 10 log₁₀(I / I₀)", tx(t, "mExp_v3b", "every +10 dB is 10 times the intensity; the ear hears ratios, not differences")],
          [tx(t, "mExp_v4", "Acidity"), "pH = −log₁₀[H⁺]", tx(t, "mExp_v4b", "each pH step is a factor of 10 in hydrogen-ion concentration: pH 3 is 10 times more acidic than pH 4")],
          [tx(t, "mExp_v5", "Earthquakes"), tx(t, "mExp_v5f", "magnitude ∝ log₁₀(amplitude)"), tx(t, "mExp_v5b", "one step on the magnitude scale is 10 times the ground motion")],
          [tx(t, "mExp_v6", "Music"), "f · 2^(n/12)", tx(t, "mExp_v6b", "each semitone multiplies the frequency by the twelfth root of 2; twelve of them double it, one octave")],
          [tx(t, "mExp_v7", "Cooling"), "T = T_room + (T₀ − T_room)·e^(−kt)", tx(t, "mExp_v7b", "the gap to room temperature shrinks by the same factor every minute")],
          [tx(t, "mExp_v8", "Halving problems"), "log₂ n", tx(t, "mExp_v8b", "how many times n can be halved before reaching 1: guessing a number from 1 to 1000 by \"higher or lower\" takes at most 10 guesses")],
        ]}
      />

      <KeyIdeas t={t} id="mExp" items={[
        "Exponent rules come from counting copies: bᵐbⁿ = bᵐ⁺ⁿ, (bᵐ)ⁿ = bᵐⁿ, b⁰ = 1, b⁻ⁿ = 1/bⁿ.",
        "y₀·b^(t/T) multiplies by b every T: doubling times and half-lives.",
        "e = lim (1 + 1/n)ⁿ ≈ 2.718 is continuous growth; e^(−λt) is continuous decay.",
        "log_b y = x means bˣ = y; logs turn products into sums.",
        "Logs bring an unknown exponent down: bˣ = y gives x = log y / log b.",
      ]} />
    </Article>
  );
}
