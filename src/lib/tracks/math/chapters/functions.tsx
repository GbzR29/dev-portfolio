"use client";

// Algebra: functions (equations, graphs, transforms,
// composition and inverses, quadratics, systems, sums).

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FunctionFigure } from "@/components/lesson/figures/math/FunctionFigure";
import { QuadraticFigure } from "@/components/lesson/figures/math/QuadraticFigure";

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
