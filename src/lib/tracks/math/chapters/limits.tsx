"use client";

// Calculus 1: limits and continuity — why 0/0 needs a new idea; the limit
// as "what f(x) approaches"; one-sided, infinite and at-infinity limits; the
// ε–δ definition; limit laws and the plug-in-then-simplify strategy; the
// squeeze theorem and sin x / x → 1; continuity and its three failures; the
// intermediate value theorem and bisection by hand; limits from tables of
// values and why they can mislead.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { LimitFigure } from "@/components/lesson/figures/math/LimitFigure";

const r = String.raw;
const dec = (v: number, d: number) => v.toFixed(d).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The squeeze cos x < sin x / x < 1 at one angle x (radians). */
const squeezeNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const x = v.x, c = Math.cos(x), s = Math.sin(x) / x;
  return {
    tex: r`\cos ${dec(x, 2)} = ${dec(c, 5)} \;<\; \frac{\sin ${dec(x, 2)}}{${dec(x, 2)}} = \green{${dec(s, 5)}} \;<\; 1 \qquad \text{${tx(t, "mLim_liveGap", "gap")}: } ${dec(1 - c, 5)}`,
    meter: s,
    meterLabel: `sin x / x = ${dec(s, 5)}`,
  };
};

/** (1 − cos x)/x² at x = 10⁻ᵏ: the true value, and what a 10-digit calculator gets. */
const tableNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const x = 10 ** -v.k;
  const truth = (2 * Math.sin(x / 2) ** 2) / (x * x);          // 1 − cos x = 2 sin²(x/2), with no cancellation
  const c10 = Number(Math.cos(x).toPrecision(10));
  const calc = (1 - c10) / (x * x);
  const ok = Math.abs(calc - 0.5) < 0.01;
  return {
    tex: r`\begin{aligned} \cos 10^{-${v.k}} &\approx ${c10.toPrecision(10)} \\ \text{${tx(t, "mLim_liveTrue", "true value")}:}\quad \frac{1 - \cos x}{x^2} &= \green{${truth.toFixed(8)}} \\ \text{${tx(t, "mLim_liveCalc", "10-digit calculator")}:}\quad \frac{1 - ${c10.toPrecision(10)}}{(10^{-${v.k}})^2} &= ${ok ? r`\green` : r`\red`}{${dec(calc, 8)}} \end{aligned}`,
  };
};

export function LimitsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mLim_intro",
          "Calculus is the mathematics of change and accumulation: how fast something is changing at one instant, and how much piles up when tiny changes add together. Both questions lead to the same obstacle, a division by zero or a sum of infinitely many pieces, and both are answered by one new idea: the limit, the value a quantity gets as close as you like to. This chapter builds that idea carefully, because every later chapter of the section stands on it.")}
      </Lead>

      <Goals t={t} id="mLim" items={[
        "Say what a limit means, and find one from a graph or a table of values.",
        "Compute limits, one-sided limits and limits at infinity.",
        "Tell whether a function is continuous, and where it breaks.",
        "Find a root by bisection, using the intermediate value theorem.",
      ]} />

      <H2>{tx(t, "mLim_whyTitle", "Why we need a new idea")}</H2>
      <p>
        {tx(t, "mLim_whyBody",
          "A car's speedometer shows 60 km/h. Speed is distance divided by time, but at a single instant the car covers no distance in no time: 0/0, which has no value. Yet the speedometer is not lying. Over one second before and after, the average speed is very close to 60; over a tenth of a second, closer still. The speed \"at an instant\" is the number those averages settle on as the time interval shrinks. That is a limit. The same pattern appears in a simpler algebraic form: the function f(x) = (x² − 1)/(x − 1) is undefined at x = 1 (it gives 0/0), but you can still ask what happens near 1.")}
      </p>
      <LessonTable
        headers={["x", "0.9", "0.99", "0.999", "1", "1.001", "1.01", "1.1"]}
        rows={[["(x² − 1)/(x − 1)", "1.9", "1.99", "1.999", tx(t, "mLim_undef", "undefined"), "2.001", "2.01", "2.1"]]}
      />
      <p>
        {tx(t, "mLim_whyBody2",
          "From both sides the values close in on 2. Algebra explains why: x² − 1 = (x − 1)(x + 1), so for every x ≠ 1 the fraction cancels to x + 1. The graph is the straight line y = x + 1 with a single point missing, a hole at (1, 2). The function never equals 2, but it approaches 2, and we write this as a limit.")}
      </p>

      <H2>{tx(t, "mLim_defTitle", "What a limit says")}</H2>
      <Equation label={tx(t, "mLim_eqDef", "The limit of f as x approaches a")}
        where={[
          [r`\lim`, tx(t, "mLim_wLim", "short for limit: the value approached, not necessarily reached")],
          [r`x \to a`, tx(t, "mLim_wTo", "x gets closer and closer to a, from both sides, but is never equal to a")],
          [r`f(x)`, tx(t, "mLim_wF", "the function's value at those nearby x")],
          [r`L`, tx(t, "mLim_wL", "the limit: f(x) can be made as close to L as you want by taking x close enough to a")],
        ]}
        note={tx(t, "mLim_defNote", "The value f(a) plays no part: it may be undefined (a hole), equal to L, or even some other number. The limit only asks where the function is heading.")}
        words={tx(t, "mLim_defWords", "As x gets closer and closer to a, from either side, the values f(x) get closer and closer to the number L.")}>
        {r`\lim_{x \to 1} \frac{x^2 - 1}{x - 1} = 2 \qquad\text{in general}\qquad \lim_{x \to a} f(x) = L`}
      </Equation>

      <LimitFigure t={t} />

      <H2>{tx(t, "mLim_sidedTitle", "One-sided limits")}</H2>
      <p>
        {tx(t, "mLim_sidedBody",
          "Sometimes the two sides disagree. A step function, such as the number of coins you own as you pick one up at x = 1, jumps: coming from the left it is heading for 1, from the right for 2. We write one-sided limits with a small sign: x → 1⁻ means \"from below\" (x < 1), x → 1⁺ means \"from above\" (x > 1). The two-sided limit exists only when both one-sided limits exist and are equal. Functions such as floor(x), which rounds down to a whole number and is used to turn a position into a tile index, have this kind of jump at every integer.")}
      </p>
      <Equation label={tx(t, "mLim_eqSided", "One-sided limits of the step")}
        where={[
          [r`x \to 1^-`, tx(t, "mLim_wMinus", "x approaches 1 through values smaller than 1")],
          [r`x \to 1^+`, tx(t, "mLim_wPlus", "x approaches 1 through values larger than 1")],
        ]}
        note={tx(t, "mLim_sidedNote", "Since 1 ≠ 2, the step has no (two-sided) limit at 1, even though it has a perfectly good value there.")}>
        {r`\lim_{x \to 1^-} f(x) = 1 \qquad \lim_{x \to 1^+} f(x) = 2`}
      </Equation>

      <H2>{tx(t, "mLim_infTitle", "Infinity in limits")}</H2>
      <p>
        {tx(t, "mLim_infBody",
          "Infinity (∞) is not a number, but it appears in limits in two ways. First, f(x) may grow without bound as x approaches a: 1/x² gets bigger than any number you name as x → 0 (at x = 0.001 it is already a million). We write lim 1/x² = ∞, which is a precise way of saying that the limit does not exist because the values run away; the graph has a vertical asymptote there. Second, x itself may grow without bound, and we ask where f(x) is heading: 1/x → 0 as x → ∞, because dividing 1 by a huge number gives a tiny one. The graph then has a horizontal asymptote, a line it creeps toward.")}
      </p>
      <p>
        {tx(t, "mLim_infBody3",
          "For a ratio of polynomials as x → ∞, only the highest powers matter, because they outgrow everything else. Divide top and bottom by the highest power in the denominator.")}
      </p>
      <Derivation t={t} label={tx(t, "mLim_eqRatio", "A ratio of polynomials at infinity")}
        steps={[
          { tex: r`\lim_{x \to \infty} \frac{3x^2 + 1}{x^2 + 5}` },
          { tex: r`= \lim_{x \to \infty} \frac{3 + 1/x^2}{1 + 5/x^2}`, why: tx(t, "mLim_r1", "divide every term, top and bottom, by x², the highest power in the denominator; the fraction's value does not change") },
          { tex: r`= \frac{3 + 0}{1 + 0}`, why: tx(t, "mLim_r2", "1/x² and 5/x² go to 0, because dividing by a huge number gives a tiny one") },
          { tex: r`= \green{3}`, why: tx(t, "mLim_r3", "only the leading coefficients 3 and 1 are left") },
        ]} />
      <p>
        {tx(t, "mLim_infBody4",
          "You have met two limits at infinity already: the geometric series in the sequences chapter (rⁿ → 0 when |r| < 1) and the number e = lim (1 + 1/n)ⁿ in the exponents chapter.")}
      </p>
      <Equation label={tx(t, "mLim_eqInf", "Limits involving infinity")}
        where={[
          [r`\infty`, tx(t, "mLim_wInfty", "\"without bound\": larger than any number you choose, not a number itself")],
          [r`x \to \infty`, tx(t, "mLim_wXInf", "x grows past every number")],
        ]}>
        {r`\lim_{x \to 0} \frac{1}{x^2} = \infty \qquad \lim_{x \to \infty} \frac{1}{x} = 0 \qquad \lim_{x \to \infty} \frac{3x^2 + 1}{x^2 + 5} = 3`}
      </Equation>

      <H2>{tx(t, "mLim_epsTitle", "The precise definition: ε and δ")}</H2>
      <p>
        {tx(t, "mLim_epsBody",
          "\"As close as you want\" can be made exact, and the figure's second mode plays it as a game. A challenger names a tolerance ε (the Greek letter epsilon), a small positive number: \"I want f(x) within ε of L.\" You must answer with a distance δ (delta): \"then keep x within δ of a.\" If you can always answer, however small ε is, the limit is L. For f(x) = (x² − 1)/(x − 1) near a = 1, f(x) = x + 1, so |f(x) − 2| = |x − 1|, and δ = ε always works. You will rarely need this definition to compute anything, but it is what makes every rule below trustworthy, and it is how you can prove that a limit does not exist: for the step, no δ can keep the values within 0.5 of any single number.")}
      </p>
      <Equation label={tx(t, "mLim_eqEps", "The ε–δ definition")}
        where={[
          [r`\varepsilon > 0`, tx(t, "mLim_wEps", "the tolerance on the output: how close to L you demand")],
          [r`\delta > 0`, tx(t, "mLim_wDelta", "the tolerance on the input: how close to a is close enough")],
          [r`0 < |x - a| < \delta`, tx(t, "mLim_wNear", "x is within δ of a, but not a itself")],
          [r`|f(x) - L| < \varepsilon`, tx(t, "mLim_wClose", "the output is within ε of L")],
        ]}
        words={tx(t, "mLim_epsWords", "However small a tolerance you demand on the output, there is a distance round a such that every x inside it, except a itself, gives an output within that tolerance of L.")}>
        {r`\text{for every } \varepsilon > 0 \text{ there is a } \delta > 0 \text{ such that } 0 < |x - a| < \delta \;\Rightarrow\; |f(x) - L| < \varepsilon`}
      </Equation>

      <H2>{tx(t, "mLim_lawsTitle", "Computing limits")}</H2>
      <p>
        {tx(t, "mLim_lawsBody",
          "Limits respect arithmetic: the limit of a sum is the sum of the limits, and the same holds for differences, products and quotients (as long as the denominator's limit is not 0). Since lim x = a and lim c = c for a constant, it follows that for any polynomial p, lim p(x) = p(a): you simply substitute. The same is true for sin, cos, eˣ, √x and ln x wherever they are defined. So the strategy is always the same: plug in first. Only when that produces something meaningless, typically 0/0, do you need to work, by rewriting the expression until the troublesome factor cancels.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLim_tForm", "Plugging in gives"), tx(t, "mLim_tMeans", "What it means"), tx(t, "mLim_tDo", "What to do")]}
        rows={[
          [tx(t, "mLim_c1f", "a number"), tx(t, "mLim_c1m", "that number is the limit"), tx(t, "mLim_c1d", "done")],
          [tx(t, "mLim_c2f", "(non-zero)/0"), tx(t, "mLim_c2m", "the values blow up: ±∞, or different signs on each side"), tx(t, "mLim_c2d", "check the sign from each side")],
          ["0/0", tx(t, "mLim_c3m", "undecided: could be anything"), tx(t, "mLim_c3d", "factor and cancel, multiply by a conjugate, or use a known limit")],
          ["∞/∞", tx(t, "mLim_c4m", "undecided"), tx(t, "mLim_c4d", "divide by the fastest-growing term")],
        ]}
      />
      <p>
        {tx(t, "mLim_conjBody2",
          "A second 0/0 example needs a different trick. (√(x + 1) − 1)/x at x = 0 gives 0/0, and nothing factors. Multiply top and bottom by the conjugate √(x + 1) + 1 (the same two terms with the sign between them flipped).")}
      </p>
      <Derivation t={t} label={tx(t, "mLim_eqConj", "Removing a square root with the conjugate")}
        steps={[
          { tex: r`\frac{\sqrt{x + 1} - 1}{x}` },
          { tex: r`= \frac{(\sqrt{x + 1} - 1)(\sqrt{x + 1} + 1)}{x\,(\sqrt{x + 1} + 1)}`, why: tx(t, "mLim_c1", "multiply top and bottom by the conjugate; multiplying by something over itself changes nothing") },
          { tex: r`= \frac{(x + 1) - 1}{x\,(\sqrt{x + 1} + 1)}`, why: tx(t, "mLim_c2", "difference of squares on top: (u − 1)(u + 1) = u² − 1, and (√(x + 1))² = x + 1") },
          { tex: r`= \frac{1}{\sqrt{x + 1} + 1}`, why: tx(t, "mLim_c3", "the top is just x; cancel it with the x below, allowed because x ≠ 0 while approaching") },
          { tex: r`\to \frac{1}{\sqrt{1} + 1} = \green{\tfrac{1}{2}}`, why: tx(t, "mLim_c4", "no 0/0 any more: plug in x = 0") },
        ]} />

      <H3>{tx(t, "mLim_squeezeTitle", "The squeeze theorem and sin x / x")}</H3>
      <p>
        {tx(t, "mLim_squeezeBody",
          "If a function is trapped between two others that both approach L, it has no choice but to approach L too, like a person walking between two police officers who both head to the station. This squeeze theorem settles the most important limit in the section: sin x / x as x → 0, with x in radians. Draw the unit circle and an angle x between 0 and a quarter turn. The triangle inside the sector (height sin x, base 1) is smaller than the sector (the fraction x/2π of a full turn, so x/2π of the circle's area π, which is x/2), which is smaller than the triangle that reaches up to the tangent line (height tan x). Comparing areas: ½ sin x < ½ x < ½ tan x.")}
      </p>
      <Derivation t={t} label={tx(t, "mLim_eqSqueeze", "From three areas to the squeeze")}
        steps={[
          { tex: r`\tfrac12 \sin x < \tfrac12 x < \tfrac12 \tan x`, full: true, why: tx(t, "mLim_s1", "inner triangle < sector < outer triangle, for 0 < x < π/2") },
          { tex: r`1 < \frac{x}{\sin x} < \frac{1}{\cos x}`, full: true, why: tx(t, "mLim_s2", "divide all three by ½ sin x, which is positive here; tan x / sin x = 1 / cos x") },
          { tex: r`\cos x < \frac{\sin x}{x} < 1`, full: true, why: tx(t, "mLim_s3", "flip all three fractions; flipping positive numbers reverses the inequalities") },
          { tex: r`\lim_{x \to 0} \frac{\sin x}{x} = \green{1}`, full: true, why: tx(t, "mLim_s4", "cos x → 1 as x → 0, so sin x / x is trapped between two things going to 1") },
        ]} />
      <p>
        {tx(t, "mLim_squeezeBody3",
          "The same holds for small negative x, because both sin x and x change sign. This limit is the reason sin x ≈ x for small angles, and it is what makes the derivative of sin come out as exactly cos in the rules chapter. It only works in radians: in degrees the arc would be (π/180)·x, and the limit would be π/180.")}
      </p>
      <Equation label={tx(t, "mLim_eqSinc", "Two limits the derivative of sine needs")}
        where={[
          [r`x`, tx(t, "mLim_wRad", "an angle in radians: the arc length on the unit circle")],
          [r`\cos x < \tfrac{\sin x}{x} < 1`, tx(t, "mLim_wSqueeze", "the squeeze, from comparing the areas of two triangles and a sector")],
        ]}
        note={tx(t, "mLim_cosNote", "The second limit follows from the first: multiply (1 − cos x)/x by (1 + cos x)/(1 + cos x) to get sin² x / (x(1 + cos x)) = (sin x / x) · (sin x / (1 + cos x)), which tends to 1 · 0/2 = 0.")}
        words={tx(t, "mLim_sincWords", "For small angles in radians, the sine is almost exactly the angle itself, and one minus the cosine is tiny even compared with the angle.")}>
        {r`\lim_{x \to 0} \frac{\sin x}{x} = 1 \qquad \lim_{x \to 0} \frac{1 - \cos x}{x} = 0`}
      </Equation>
      <LiveFormula label={tx(t, "mLim_liveSqueeze", "Try it: the squeeze at one angle")}
        tex={r`\cos x < \frac{\sin x}{x} < 1`}
        vars={[{ id: "x", label: tx(t, "mLim_liveX", "angle x (radians)"), min: 0.01, max: 1.5, step: 0.01, value: 1, fmt: v => dec(v, 2) }]}
        compute={squeezeNumbers(t)}
        note={tx(t, "mLim_liveSqueezeNote", "At x = 1 the gap between the two walls is 0.46. Slide x toward 0: cos x climbs to 1, the gap closes, and sin x / x has nowhere to go but 1. At x = 0.1 it is already 0.99833.")} />

      <H2>{tx(t, "mLim_contTitle", "Continuity")}</H2>
      <p>
        {tx(t, "mLim_contBody",
          "Informally, a function is continuous if you can draw its graph without lifting your pen. Limits make that exact: f is continuous at a when three things hold: f(a) is defined, the limit as x → a exists, and the two are equal. Each condition failing gives a kind of break. A missing or misplaced single point is a removable discontinuity (the hole: redefine one value and it is fixed). Different one-sided limits give a jump. A value that blows up gives an infinite discontinuity. Polynomials, sin, cos and eˣ are continuous everywhere; a fraction of continuous functions is continuous except where its denominator is zero.")}
      </p>
      <Equation label={tx(t, "mLim_eqCont", "Continuity at a point")}
        where={[
          [r`f(a)`, tx(t, "mLim_wFa", "the value actually taken at a: must exist")],
          [r`\lim_{x\to a} f(x)`, tx(t, "mLim_wLimA", "the value approached: must exist and equal f(a)")],
        ]}
        words={tx(t, "mLim_contWords", "Where the function is heading as x approaches a is exactly where it actually is at a.")}>
        {r`\lim_{x \to a} f(x) = f(a)`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "mLim_contTip", "Continuity is built into the physical world. A car's position cannot jump, and neither can its speed: a sudden change of speed would need an infinite force. A road whose direction changes abruptly, a corner, jolts the passengers, which is why road and railway designers join straight stretches and curves so that even the bending changes gradually. The derivative chapter measures slopes, and \"smooth\" curves are the ones whose slopes are continuous too.")}
      </Callout>

      <H2>{tx(t, "mLim_ivtTitle", "The intermediate value theorem and bisection")}</H2>
      <p>
        {tx(t, "mLim_ivtBody",
          "If f is continuous on [a, b] (every point from a to b, ends included), it takes every value between f(a) and f(b) somewhere in between. If you walk from sea level to a hilltop without teleporting, you pass every height on the way. The most useful case: if f(a) < 0 and f(b) > 0, then f(c) = 0 for some c between them. That gives the simplest root-finder, bisection, the figure's third mode: test the midpoint, keep the half whose ends still have opposite signs, repeat. Each step halves the interval, so 20 steps shrink it by a factor of 2²⁰ ≈ one million. It is slow compared with the Newton's method of a later chapter, but it cannot fail as long as the function is continuous and the signs differ.")}
      </p>
      <LessonTable
        headers={[tx(t, "mLim_tInt", "interval"), tx(t, "mLim_tMid", "midpoint m"), "f(m) = m³ − m − 1", tx(t, "mLim_tKeep", "keep")]}
        rows={[
          ["[1, 2]", "1.5", "3.375 − 1.5 − 1 = 0.875 > 0", "[1, 1.5]"],
          ["[1, 1.5]", "1.25", "1.953 − 1.25 − 1 = −0.297 < 0", "[1.25, 1.5]"],
          ["[1.25, 1.5]", "1.375", "2.600 − 1.375 − 1 = 0.225 > 0", "[1.25, 1.375]"],
          ["[1.25, 1.375]", "1.3125", "2.261 − 1.3125 − 1 = −0.052 < 0", "[1.3125, 1.375]"],
          ["[1.3125, 1.375]", "1.34375", "2.426 − 1.344 − 1 = 0.083 > 0", "[1.3125, 1.34375]"],
        ]}
      />
      <p>
        {tx(t, "mLim_bisectNote",
          "The table finds the root of x³ − x − 1 = 0, a cubic with no simple formula for its root. It starts from f(1) = −1 < 0 and f(2) = 5 > 0, so a root lies between 1 and 2. Each row tests the midpoint and keeps the half whose ends still have opposite signs. After five steps the root is known to lie in an interval of width 1/32 ≈ 0.03 around 1.33; the true value is 1.3247…")}
      </p>
      <p>
        {tx(t, "mLim_ivtUse",
          "The theorem also answers questions about the real world. A water tank that was full at 8:00 and empty at 9:00 was exactly half full at some moment in between, because the level changes continuously; halving the time interval again and again narrows that moment down. And a surprising consequence: at any instant, some two opposite points of the equator have exactly the same temperature. Walk the difference \"temperature here minus temperature opposite\" half way round: it changes sign, so it passes through 0.")}
      </p>

      <H2>{tx(t, "mLim_floatTitle", "Limits from a table of values")}</H2>
      <p>
        {tx(t, "mLim_floatBody",
          "A quick way to guess a limit is to try values of x closer and closer to a. For (1 − cos x)/x² as x → 0: x = 0.1 gives 0.49958 and x = 0.01 gives 0.4999958, which suggests ½, and multiplying by (1 + cos x)/(1 + cos x) as above proves it. But a table only suggests; it never proves, and going too far misleads. On a calculator that keeps 10 digits, x = 0.000001 gives cos x = 0.9999999999995, which is rounded to 1.000000000, and the calculator answers 0. Subtracting two nearly equal numbers throws away exactly the digits that matter. So take a few moderate values to guess, and then let the algebra decide.")}
      </p>
      <LiveFormula label={tx(t, "mLim_liveTable", "Try it: a table of values on a 10-digit calculator")}
        tex={r`\lim_{x \to 0} \frac{1 - \cos x}{x^2} = \tfrac12`}
        vars={[{ id: "k", label: <>k, x = 10<sup>−k</sup></>, min: 1, max: 6, step: 1, value: 1, fmt: v => String(v) }]}
        compute={tableNumbers(t)}
        note={tx(t, "mLim_liveTableNote", "From k = 1 to 4 the calculator agrees with ½. At k = 5 it answers 1, twice the truth: cos x lost its last digit to rounding, and that digit was all the top had. At k = 6 it rounds cos x to exactly 1 and answers 0. The true value never moves away from ½.")} />

      <H2>{tx(t, "mLim_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mLim_ex1", "1. lim (2x² + 3) as x → 2. A polynomial: plug in. 2·4 + 3 = 11.")}</p>
      <p>{tx(t, "mLim_ex2", "2. lim (x² − 9)/(x − 3) as x → 3. Plugging in gives 0/0. Factor: (x − 3)(x + 3)/(x − 3) = x + 3 for x ≠ 3, so the limit is 6.")}</p>
      <p>{tx(t, "mLim_ex3", "3. lim sin(3x)/x as x → 0. Write it as 3 · sin(3x)/(3x). As x → 0, u = 3x → 0 too, and sin u / u → 1. The limit is 3.")}</p>
      <p>{tx(t, "mLim_ex4", "4. lim (5x³ − x)/(2x³ + 7) as x → ∞. Divide by x³: (5 − 1/x²)/(2 + 7/x³) → 5/2.")}</p>
      <p>{tx(t, "mLim_ex5", "5. lim 1/x as x → 0. From the right the values go to +∞, from the left to −∞: no limit, not even an infinite one.")}</p>

      <H2>{tx(t, "mLim_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mLim_tWrong", "Wrong"), tx(t, "mLim_tRight", "Right"), tx(t, "mLim_tWhy", "Why")]}
        rows={[
          [tx(t, "mLim_m1w", "the limit is f(a)"), tx(t, "mLim_m1r", "only when f is continuous at a"), tx(t, "mLim_m1", "the limit ignores the value at a")],
          [tx(t, "mLim_m2w", "0/0 = 0, or 1, or undefined so no limit"), tx(t, "mLim_m2r", "0/0 means: simplify first"), tx(t, "mLim_m2", "the answer depends on how fast top and bottom vanish")],
          [tx(t, "mLim_m3w", "∞ − ∞ = 0, ∞/∞ = 1"), tx(t, "mLim_m3r", "rewrite the expression"), tx(t, "mLim_m3", "∞ is not a number; these forms are undecided")],
          [tx(t, "mLim_m4w", "sin x / x → 1 with x in degrees"), tx(t, "mLim_m4r", "radians only"), tx(t, "mLim_m4", "in degrees the limit is π/180")],
          [tx(t, "mLim_m5w", "checking only one side"), tx(t, "mLim_m5r", "check both sides at a jump"), tx(t, "mLim_m5", "the two-sided limit needs them to agree")],
        ]}
      />

      <KeyIdeas t={t} id="mLim" items={[
        "lim f(x) = L as x → a: f(x) gets as close to L as you like for x close enough to a (x ≠ a).",
        "The value f(a) does not matter; the limit is where the function is heading.",
        "Both one-sided limits must agree for the limit to exist.",
        "Plug in first; if you get 0/0, factor, use a conjugate, or a known limit.",
        "sin x / x → 1 as x → 0, in radians: the squeeze theorem proves it.",
        "Continuous at a: lim f(x) = f(a). Breaks are holes, jumps or blow-ups.",
        "A continuous function that changes sign has a root in between: bisection finds it.",
      ]} />
    </Article>
  );
}
