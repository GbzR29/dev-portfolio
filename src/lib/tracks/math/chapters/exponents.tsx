"use client";

// Algebra: exponents and logarithms — power rules, growth and decay, the
// number e, logarithms as the inverse, and where both show up in graphics.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "Some quantities change by adding: a car moving at constant speed gains the same distance every second. Others change by multiplying: a population that doubles every generation, a sound that loses half its energy every metre of wall, a camera zoom that feels the same whether you are close or far. Multiplicative change is described by exponentials, and the tool that turns multiplications back into additions is the logarithm. Graphics uses both constantly: mipmaps, exposure, gamma, decibels, damping.")}
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
          [r`e^{-\lambda t}`, tx(t, "mExp_wLambda", "the same curve written with base e and a rate λ = ln 2 / T for a half-life. Physics and code usually use this form: exp() is the fastest exponential in every math library")],
        ]}
        note={tx(t, "mExp_eqDecayNote", "Example: a sound fades to half its amplitude every 0.3 s. After 1.2 s = 4 half-lives it is at (½)⁴ = 1/16. Exponential decay never reaches exactly zero; cut it off below a threshold.")}>
        {r`y(t) = y_0 \cdot b^{\,t/T} \qquad\text{decay:}\quad y(t) = y_0\left(\tfrac12\right)^{t/T} = y_0\,e^{-\lambda t}`}
      </Equation>

      <H3>{tx(t, "mExp_eTitle", "The number e")}</H3>
      <p>
        {tx(t, "mExp_eBody",
          "Why does every library use e ≈ 2.71828 as its base? Imagine growing by 100% over one year. Added once at the end, 1 becomes 2. Split into two half-year steps of 50% each, the second step also grows the first step's gain: 1.5 × 1.5 = 2.25. Twelve monthly steps of 1/12 give 2.613, daily steps 2.7146. The limit of ever finer steps, (1 + 1/n)ⁿ as n → ∞, is e: the result of growing continuously. Its defining property, proved in the calculus chapters, is that eˣ grows at a rate equal to its own value, which makes it the natural solution of every \"rate proportional to amount\" problem: cooling, charging, damping, radioactive decay.")}
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
          [r`\log_b x = \frac{\ln x}{\ln b}`, tx(t, "mExp_wChange", "change of base: any logarithm from the natural one (ln = log base e). C++ also has std::log2 and std::log10")],
        ]}>
        {r`\log_b(x\,y) = \log_b x + \log_b y \qquad \log_b(x^k) = k\log_b x \qquad \log_b x = \frac{\ln x}{\ln b}`}
      </Equation>

      <H2>{tx(t, "mExp_usesTitle", "Where they show up")}</H2>
      <LessonTable
        headers={[tx(t, "mExp_tWhere", "Where"), tx(t, "mExp_tFormula", "Formula"), tx(t, "mExp_tWhy", "Why")]}
        rows={[
          [tx(t, "mExp_u1", "Mipmap count"), "⌊log₂(max(w, h))⌋ + 1", tx(t, "mExp_u1b", "each level halves the size; a 1024² texture has 11 levels (1024 … 1)")],
          [tx(t, "mExp_u2", "Mip level selection"), "λ = log₂(ρ)", tx(t, "mExp_u2b", "ρ = texels per pixel; every doubling of ρ moves one level down the chain")],
          [tx(t, "mExp_u3", "Exposure (photographic stops)"), "L · 2^EV", tx(t, "mExp_u3b", "one stop = ×2 light; eyes perceive ratios, so exposure sliders are in stops")],
          [tx(t, "mExp_u4", "Audio volume"), "dB = 20 log₁₀(A / A₀)", tx(t, "mExp_u4b", "perceived loudness is roughly logarithmic; −6 dB ≈ half the amplitude. Volume sliders should be linear in dB, not in amplitude")],
          [tx(t, "mExp_u5", "Gamma"), "V = L^(1/2.2)", tx(t, "mExp_u5b", "a power law that spends more of the 8 bits on dark tones, where eyes are more sensitive")],
          [tx(t, "mExp_u6", "Camera zoom"), "zoom ·= e^(k·scroll)", tx(t, "mExp_u6b", "multiplicative steps feel uniform at any zoom level; additive steps crawl when far and jump when close")],
          [tx(t, "mExp_u7", "Frame-independent damping"), "1 − e^(−λ·dt)", tx(t, "mExp_u7b", "see the Game Dev track: two half-frames equal one full frame only for an exponential")],
          [tx(t, "mExp_u8", "Search and trees"), "log₂ n", tx(t, "mExp_u8b", "binary search, balanced trees and BVHs take about log₂ n steps: 20 for a million items")],
          [tx(t, "mExp_u9", "Level curves"), "XP(L) = a · b^L", tx(t, "mExp_u9b", "exponential XP requirements keep each level taking a similar time as rewards grow")],
        ]}
      />
      <Callout type="warn" t={t}>
        {tx(t, "mExp_numWarn", "Exponentials overflow fast: in float, exp(89) is already infinity, and exp(−104) underflows toward 0. log(0) is −∞ and log of a negative number is NaN, so guard inputs such as log(max(x, 1e-8)). For small arguments use std::expm1(x) = eˣ − 1 and std::log1p(x) = ln(1 + x), which stay accurate where the direct forms lose everything to cancellation.")}
      </Callout>

      <KeyIdeas t={t} id="mExp" items={[
        "Exponent rules come from counting copies: bᵐbⁿ = bᵐ⁺ⁿ, (bᵐ)ⁿ = bᵐⁿ, b⁰ = 1, b⁻ⁿ = 1/bⁿ.",
        "y₀·b^(t/T) multiplies by b every T: doubling times and half-lives.",
        "e = lim (1 + 1/n)ⁿ ≈ 2.718 is continuous growth; e^(−λt) is continuous decay.",
        "log_b y = x means bˣ = y; logs turn products into sums.",
        "Logs measure ratios: mip levels, stops, decibels, tree depth.",
      ]} />
    </Article>
  );
}
