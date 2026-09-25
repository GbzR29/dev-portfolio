"use client";

// Foundations 2 & 3: algebra and functions (equations, graphs, transforms,
// composition and inverses, quadratics, systems, sums), and exponents and
// logarithms.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FunctionFigure } from "@/components/lesson/figures/math/FunctionFigure";
import { QuadraticFigure } from "@/components/lesson/figures/math/QuadraticFigure";
import { ExpLogFigure } from "@/components/lesson/figures/math/ExpLogFigure";

const r = String.raw;

// ═════════════════════════════════════════════════════════════════════════════
// Algebra & Functions
// ═════════════════════════════════════════════════════════════════════════════

export function AlgebraContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mAlg_intro",
          "Algebra is arithmetic with names in place of some numbers. That small step is what lets you write one formula for every bullet instead of one calculation per bullet, and then run it backwards: not \"where will it be after 2 seconds?\" but \"when will it reach the wall?\". This chapter covers solving equations, functions and their graphs, the quadratic formula that ray tracing depends on, and the summation notation used everywhere later.")}
      </Lead>

      <H2>{tx(t, "mAlg_eqTitle", "Equations are balances")}</H2>
      <p>
        {tx(t, "mAlg_eqBody",
          "An equation says two expressions have the same value. You may do anything to it as long as you do the same thing to both sides: add, subtract, multiply or divide by the same (non-zero) amount. Solving means applying such steps until the unknown stands alone on one side. Each step undoes one operation that was applied to the unknown, in reverse order, like unwrapping a present.")}
      </p>
      <Equation label={tx(t, "mAlg_eqSolve", "Solving for the time of arrival")}
        where={[
          [r`x_0`, tx(t, "mAlg_wX0", "where the object starts")],
          [r`v`, tx(t, "mAlg_wV", "its constant velocity (units per second)")],
          [r`t`, tx(t, "mAlg_wT", "the unknown time")],
          [r`x_w`, tx(t, "mAlg_wXw", "the position of the wall")],
        ]}
        note={tx(t, "mAlg_eqSolveNote", "Start from x₀ + v·t = x_w. Subtract x₀ from both sides: v·t = x_w − x₀. Divide both sides by v: t = (x_w − x₀)/v. Check the edge cases the algebra hides: v = 0 means it never arrives (division by zero), and a negative t means the wall is behind it.")}>
        {r`x_0 + v\,t = x_w \;\;\Longrightarrow\;\; t = \frac{x_w - x_0}{v}`}
      </Equation>

      <H2>{tx(t, "mAlg_fnTitle", "Functions")}</H2>
      <p>
        {tx(t, "mAlg_fnBody",
          "A function is a rule that turns each input into exactly one output: f(x) = x² turns 3 into 9. The set of allowed inputs is the domain (√x only accepts x ≥ 0 among reals), the set of outputs it can produce is the range (x² never produces negatives). Its graph is the set of all points (x, f(x)), drawn as a curve. Games are full of functions: damage as a function of distance, experience needed as a function of level, brightness as a function of time of day. Thinking of them as curves you can see and reshape makes them much easier to design.")}
      </p>
      <Equation label={tx(t, "mAlg_eqLine", "Linear functions")}
        where={[
          [r`m`, tx(t, "mAlg_wM", "the slope: how much y changes when x increases by 1. Between two points it is rise over run, (y₂ − y₁)/(x₂ − x₁)")],
          [r`b`, tx(t, "mAlg_wB", "the intercept: the value at x = 0, where the line crosses the y axis")],
        ]}
        note={tx(t, "mAlg_eqLineNote", "A straight line through two points (x₁, y₁) and (x₂, y₂) is y = y₁ + m(x − x₁). If you set x₁ = 0, x₂ = 1, this is exactly lerp(y₁, y₂, x) from the Game Dev track.")}>
        {r`y = m\,x + b`}
      </Equation>

      <H2>{tx(t, "mAlg_transTitle", "Moving and stretching graphs")}</H2>
      <p>
        {tx(t, "mAlg_transBody",
          "You rarely need a brand-new function; you need a known one moved or stretched into place. Four numbers do all of it. Two act on the output (outside f), two on the input (inside f). The outside ones behave the way you expect. The inside ones behave in reverse, because they change which input f sees: to see what f normally shows at 0, the input must be c, so subtracting c moves the graph right.")}
      </p>
      <Equation label={tx(t, "mAlg_eqTrans", "The four transformations")}
        where={[
          [r`a`, tx(t, "mAlg_wA", "vertical scale: multiplies every output. a = 2 doubles heights; a < 0 flips the graph upside down")],
          [r`b`, tx(t, "mAlg_wBh", "horizontal scale: multiplies the input, so b = 2 makes things happen twice as fast (half as wide); b < 0 mirrors left–right")],
          [r`c`, tx(t, "mAlg_wC", "horizontal shift: the graph moves right by c")],
          [r`d`, tx(t, "mAlg_wD", "vertical shift: the graph moves up by d")],
        ]}>
        {r`y = a\cdot f\big(b\,(x - c)\big) + d`}
      </Equation>

      <FunctionFigure t={t} />

      <H2>{tx(t, "mAlg_compTitle", "Composition and inverses")}</H2>
      <p>
        {tx(t, "mAlg_compBody",
          "Feeding one function's output into another is composition, written (f ∘ g)(x) = f(g(x)): apply g first, then f. The order matters: squaring then adding 1 is not adding 1 then squaring. Graphics pipelines are long compositions: model transform, then view, then projection. An inverse function f⁻¹ undoes f: f⁻¹(f(x)) = x. It only exists if f never sends two inputs to the same output (x² sends 2 and −2 to 4, so √ can only undo it for x ≥ 0). The graph of f⁻¹ is the graph of f mirrored across the diagonal line y = x, because inverting swaps the roles of input and output. You will see that mirror in the next chapter, between exponentials and logarithms.")}
      </p>
      <Equation label={tx(t, "mAlg_eqInv", "Inverting a linear function")}
        where={[
          [r`y = m\,x + b`, tx(t, "mAlg_wFwd", "the forward function")],
          [r`x = (y - b) / m`, tx(t, "mAlg_wBack", "solving for x gives the inverse. Inverse lerp, (v − a)/(b − a), is exactly this")],
        ]}>
        {r`f(x) = m\,x + b \quad\Longrightarrow\quad f^{-1}(y) = \frac{y - b}{m}`}
      </Equation>

      <H2>{tx(t, "mAlg_quadTitle", "Quadratics")}</H2>
      <p>
        {tx(t, "mAlg_quadBody",
          "A quadratic has a squared term: y = ax² + bx + c. Its graph is a parabola, and it appears whenever something accelerates at a constant rate: the height of a thrown ball is h(t) = h₀ + v₀t − ½gt², a quadratic in t. Asking \"when does it hit the ground?\" means solving h(t) = 0. Ray tracing asks the same kind of question: a point on a ray is at distance t along it, and requiring that point to be on a sphere gives a quadratic in t. So the formula below is used millions of times per frame in a ray tracer.")}
      </p>
      <p>
        {tx(t, "mAlg_completeBody",
          "The formula comes from a trick called completing the square. Divide by a: x² + (b/a)x + c/a = 0. The first two terms are the start of a perfect square: (x + b/2a)² = x² + (b/a)x + b²/4a². So add and subtract b²/4a²: (x + b/2a)² = b²/4a² − c/a = (b² − 4ac)/4a². Take the square root of both sides (both signs) and subtract b/2a.")}
      </p>
      <Equation label={tx(t, "mAlg_eqQuad", "The quadratic formula")}
        where={[
          [r`a, b, c`, tx(t, "mAlg_wABC", "the coefficients of ax² + bx + c = 0, with a ≠ 0")],
          [r`\Delta = b^2 - 4ac`, tx(t, "mAlg_wDisc", "the discriminant. Δ > 0: two real solutions; Δ = 0: one (the parabola touches the axis); Δ < 0: none, because no real number squares to a negative")],
          [r`-\tfrac{b}{2a}`, tx(t, "mAlg_wVertex", "the x of the vertex, the parabola's turning point. The roots sit symmetrically around it")],
          [r`\pm\tfrac{\sqrt\Delta}{2a}`, tx(t, "mAlg_wSpread", "how far each root is from the vertex")],
        ]}>
        {r`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`}
      </Equation>

      <QuadraticFigure t={t} />

      <H3>{tx(t, "mAlg_stableTitle", "The formula in floating point")}</H3>
      <p>
        {tx(t, "mAlg_stableBody",
          "When b² is much larger than 4ac, √Δ is almost equal to |b|, and one of the two roots computes −b + √Δ, a subtraction of nearly equal numbers that loses most of its digits (the cancellation from the previous chapter). The fix uses the fact that the two roots multiply to c/a. Compute the root without cancellation first (the one where −b and ∓√Δ have the same sign), then get the other by division.")}
      </p>
      <CodeBlock lang="cpp" filename="quadratic.hpp" t={t}>{`// Solves a·x² + b·x + c = 0. Returns the number of real roots, sorted x0 ≤ x1.
int solveQuadratic(float a, float b, float c, float& x0, float& x1) {
    float disc = b * b - 4 * a * c;
    if (disc < 0) return 0;
    float q = -0.5f * (b + std::copysign(std::sqrt(disc), b));  // b and √Δ same sign: no cancellation
    x0 = q / a;
    x1 = (q != 0) ? c / q : x0;      // x0 · x1 = c / a  →  x1 = c / q
    if (x0 > x1) std::swap(x0, x1);
    return disc == 0 ? 1 : 2;
}`}</CodeBlock>

      <H2>{tx(t, "mAlg_sysTitle", "Two equations, two unknowns")}</H2>
      <p>
        {tx(t, "mAlg_sysBody",
          "Where do two lines cross? Where does a patrol path meet a river? Those are systems of equations: several conditions that must hold at once. With two linear equations in x and y, eliminate one unknown: scale the equations so the y terms match, subtract, solve for x, then substitute back. Doing it once symbolically gives a formula (Cramer's rule). Its denominator, ad − bc, is zero exactly when the lines are parallel: then there is no intersection, or infinitely many. That denominator is the determinant of a 2 × 2 matrix, which the matrices chapters will explain geometrically.")}
      </p>
      <Equation label={tx(t, "mAlg_eqCramer", "Cramer's rule for two equations")}
        where={[
          [r`a x + b y = e`, tx(t, "mAlg_wEq1", "the first equation")],
          [r`c x + d y = f`, tx(t, "mAlg_wEq2", "the second equation")],
          [r`ad - bc`, tx(t, "mAlg_wDet", "the determinant; if it is 0 the lines are parallel and the formula divides by zero")],
        ]}>
        {r`x = \frac{e\,d - b\,f}{a\,d - b\,c}, \qquad y = \frac{a\,f - e\,c}{a\,d - b\,c}`}
      </Equation>

      <H2>{tx(t, "mAlg_absTitle", "Absolute value, inequalities and clamping")}</H2>
      <p>
        {tx(t, "mAlg_absBody",
          "The absolute value |x| is the distance of x from 0, so |x − c| is the distance between x and c, and |x − c| < r reads \"x is within r of c\", the one-dimensional version of \"inside a circle\". Inequalities behave like equations with one exception: multiplying or dividing both sides by a negative number flips the direction (−x < 3 means x > −3). min, max and clamp(x, lo, hi) = min(max(x, lo), hi) are the everyday tools for keeping values in range: health between 0 and its maximum, a camera between its limits.")}
      </p>

      <H2>{tx(t, "mAlg_sumTitle", "Sums: reading Σ")}</H2>
      <p>
        {tx(t, "mAlg_sumBody",
          "The capital Greek letter sigma, Σ, is shorthand for a loop that adds. Below it, the loop variable and where it starts; above it, where it stops; to its right, what to add each time. Two sums have closed forms worth knowing. The arithmetic series 1 + 2 + … + n: pairing the first and last terms (1 + n), the second and second-to-last (2 + n − 1), and so on gives n/2 pairs of n + 1. The geometric series, where each term is r times the previous one, appears in fractal noise (each octave has gain times the amplitude of the last), in compound growth and in the exponential smoothing of the Game Dev track.")}
      </p>
      <Equation label={tx(t, "mAlg_eqSums", "Sigma notation and two closed forms")}
        where={[
          [r`\textstyle\sum_{k=1}^{n} k`, tx(t, "mAlg_wArith", "the arithmetic series: n(n + 1)/2. The total XP for levels 1…100 at 1 XP × level is 5050")],
          [r`\textstyle\sum_{k=0}^{n-1} r^k`, tx(t, "mAlg_wGeo", "the geometric series: (1 − rⁿ)/(1 − r) for r ≠ 1. Multiply the sum S by r and subtract: S − rS = 1 − rⁿ, since all the middle terms cancel")],
          [r`\tfrac{1}{1 - r}`, tx(t, "mAlg_wInf", "the limit of the geometric series as n → ∞, when |r| < 1. With r = ½: 1 + ½ + ¼ + … = 2. That is why fBm with gain 0.5 never exceeds twice its first octave")],
        ]}>
        {r`\sum_{k=1}^{n} k = \frac{n(n+1)}{2} \qquad \sum_{k=0}^{n-1} r^k = \frac{1 - r^n}{1 - r}`}
      </Equation>
      <CodeBlock lang="cpp" filename="sigma.cpp" t={t}>{`// Σ_{k=1}^{n} f(k) is just this loop:
float sum = 0;
for (int k = 1; k <= n; ++k) sum += f(k);`}</CodeBlock>

      <LessonTable
        headers={[tx(t, "mAlg_tSym", "Symptom"), tx(t, "mAlg_tCause", "Cause"), tx(t, "mAlg_tFix", "Fix")]}
        rows={[
          [tx(t, "mAlg_b1", "Ray–sphere misses nearby spheres randomly"), tx(t, "mAlg_c1", "cancellation in −b + √Δ"), tx(t, "mAlg_f1", "stable quadratic (above), or the half-b form used in the GLSL track")],
          [tx(t, "mAlg_b2", "Division by zero in a solved formula"), tx(t, "mAlg_c2", "the algebra silently assumed a denominator ≠ 0 (v = 0, parallel lines)"), tx(t, "mAlg_f2", "check every denominator you divided by while solving")],
          [tx(t, "mAlg_b3", "A shifted curve moved the wrong way"), tx(t, "mAlg_c3", "adding c inside f(x + c) moves it left, not right"), tx(t, "mAlg_f3", "inside the function, subtract to move right: f(x − c)")],
          [tx(t, "mAlg_b4", "Composed transforms in the wrong order"), tx(t, "mAlg_c4", "(f ∘ g)(x) applies g first"), tx(t, "mAlg_f4", "read compositions right to left")],
        ]}
      />

      <KeyIdeas t={t} id="mAlg" items={[
        "Solve an equation by doing the same thing to both sides; check what you divided by.",
        "y = a·f(b(x − c)) + d: outside knobs act as expected, inside knobs act in reverse.",
        "(f ∘ g)(x) = f(g(x)); an inverse undoes a function and mirrors its graph across y = x.",
        "Quadratic formula: x = (−b ± √(b² − 4ac)) / 2a; the discriminant counts the roots.",
        "Σ is a loop; 1 + … + n = n(n+1)/2; 1 + r + r² + … = (1 − rⁿ)/(1 − r).",
      ]} />
    </Article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Exponents & Logarithms
// ═════════════════════════════════════════════════════════════════════════════

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
