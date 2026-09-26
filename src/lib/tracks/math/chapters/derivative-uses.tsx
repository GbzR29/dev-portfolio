"use client";

// Calculus 4: using derivatives — rising and falling from the sign of f′;
// critical points and the first-derivative test; the second derivative,
// concavity and inflection; the mean value theorem and its consequences;
// optimisation (fence, box, closest point, why squared distance); linear
// approximation and error propagation; Newton's method (Heron's method and
// the fast inverse square root as special cases); related rates;
// L'Hôpital's rule; C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ExtremaFigure } from "@/components/lesson/figures/math/ExtremaFigure";

const r = String.raw;

export function DerivativeUsesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mUse_intro",
          "Knowing the slope everywhere tells you a surprising amount about a function without drawing it: where it rises and falls, where its peaks and valleys are, how it bends. That turns \"what is the best choice?\" questions into equations, lets you approximate hard functions with easy ones, and gives the fastest general method for solving equations there is. This chapter collects those uses.")}
      </Lead>

      <H2>{tx(t, "mUse_signTitle", "Rising, falling and flat")}</H2>
      <p>
        {tx(t, "mUse_signBody",
          "Where f′(x) > 0 the tangent points uphill, so f is increasing: bigger x, bigger f(x). Where f′(x) < 0, f is decreasing. A point where f′(x) = 0 (or where f′ does not exist) is a critical point: the tangent is flat, or there is a corner. Peaks and valleys can only happen at critical points or at the ends of the domain, because anywhere else the function is still going up on one side and down on the other. The first-derivative test tells which it is: if f′ changes from + to − as x passes the point, the function went up then down, so it is a local maximum; from − to + it is a local minimum; if the sign does not change, it is neither.")}
      </p>
      <LessonTable
        headers={[tx(t, "mUse_tBefore", "f′ before"), tx(t, "mUse_tAfter", "f′ after"), tx(t, "mUse_tKind", "The critical point is")]}
        rows={[
          ["+", "−", tx(t, "mUse_k1", "a local maximum (a peak)")],
          ["−", "+", tx(t, "mUse_k2", "a local minimum (a valley)")],
          ["+", "+", tx(t, "mUse_k3", "neither: a flat step on the way up (x³ at 0)")],
          ["−", "−", tx(t, "mUse_k4", "neither: a flat step on the way down")],
        ]}
      />
      <p>
        {tx(t, "mUse_localBody",
          "\"Local\" means highest or lowest compared with nearby points only. A function can have several local maxima; the largest value over the whole domain is the global (or absolute) maximum. The extreme value theorem guarantees one exists when f is continuous on a closed interval [a, b]: the global maximum and minimum are then among the critical points and the two endpoints, so checking that short list finds them.")}
      </p>

      <H2>{tx(t, "mUse_bendTitle", "The second derivative: bending")}</H2>
      <p>
        {tx(t, "mUse_bendBody",
          "f″ is the rate of change of the slope. Where f″ > 0 the slope is increasing, so the curve bends upward like a cup, ∪ (concave up); where f″ < 0 it bends downward like a cap, ∩ (concave down). A point where the bending switches is an inflection point. This gives a quicker test for critical points: if f′(c) = 0 and f″(c) < 0, the flat spot sits on a cap, so it is a maximum; if f″(c) > 0 it sits in a cup, a minimum. If f″(c) = 0 this second-derivative test says nothing, and you go back to the sign of f′.")}
      </p>
      <Equation label={tx(t, "mUse_eqTest", "The second-derivative test")}
        where={[
          [r`c`, tx(t, "mUse_wC", "a critical point, f′(c) = 0")],
          [r`f''(c)`, tx(t, "mUse_wF2", "the bending there")],
        ]}
        note={tx(t, "mUse_testNote", "In motion, f″ is acceleration. At the top of a throw the velocity is 0 and the acceleration is −9.8 m/s² (negative): the height is at a maximum.")}>
        {r`f'(c) = 0 \text{ and } f''(c) < 0 \;\Rightarrow\; \text{max} \qquad f'(c) = 0 \text{ and } f''(c) > 0 \;\Rightarrow\; \text{min}`}
      </Equation>

      <ExtremaFigure t={t} />

      <H2>{tx(t, "mUse_mvtTitle", "The mean value theorem")}</H2>
      <p>
        {tx(t, "mUse_mvtBody",
          "Some motorways catch speeders with two cameras 10 km apart. If you pass them 5 minutes apart, your average speed was 120 km/h, and the fine is legal even if no one saw you going that fast: at some instant you must have been doing exactly 120. That is the mean value theorem. If f is continuous on [a, b] and differentiable between, then at some point c between a and b the instantaneous rate equals the average rate. Geometrically: some tangent is parallel to the secant joining the ends.")}
      </p>
      <Equation label={tx(t, "mUse_eqMvt", "The mean value theorem")}
        where={[
          [r`c`, tx(t, "mUse_wCm", "some point strictly between a and b (the theorem says it exists, not where)")],
          [r`\frac{f(b) - f(a)}{b - a}`, tx(t, "mUse_wAvg", "the average rate: the slope of the secant")],
        ]}>
        {r`f'(c) = \frac{f(b) - f(a)}{b - a}`}
      </Equation>
      <p>
        {tx(t, "mUse_mvtCons",
          "Two consequences are used constantly. If f′ = 0 everywhere on an interval, then every average rate is 0, so f is constant there. And if two functions have the same derivative everywhere, their difference has derivative 0, so they differ only by a constant. The fundamental theorem chapter relies on exactly this.")}
      </p>

      <H2>{tx(t, "mUse_optTitle", "Optimisation")}</H2>
      <p>
        {tx(t, "mUse_optBody",
          "To find the best value of something: (1) name the quantity you can choose and the one you want to maximise or minimise; (2) write the second as a function of the first, using the problem's constraints to remove any other variables; (3) note the allowed range; (4) solve f′ = 0; (5) compare the critical points with the endpoints. The figure's second mode is the classic fence: 20 m of fence for three sides of a pen against a wall. With width w the length is 20 − 2w, so A(w) = w(20 − 2w) = 20w − 2w². A′(w) = 20 − 4w = 0 gives w = 5, and A″ = −4 < 0 confirms a maximum: 5 × 10 m = 50 m². The endpoints w = 0 and w = 10 give no area at all.")}
      </p>
      <H3>{tx(t, "mUse_boxTitle", "A box from a sheet")}</H3>
      <p>
        {tx(t, "mUse_boxBody",
          "Cut equal squares of side x from the corners of a 30 × 30 cm sheet and fold up the sides. The box has base (30 − 2x)² and height x, so V(x) = x(30 − 2x)², for x between 0 and 15. The product and chain rules give V′ = (30 − 2x)² + x · 2(30 − 2x)(−2) = (30 − 2x)(30 − 2x − 4x) = (30 − 2x)(30 − 6x). This is 0 at x = 15 (no base left, V = 0) and at x = 5, where V = 5 · 20² = 2000 cm³, the largest possible box.")}
      </p>
      <H3>{tx(t, "mUse_closeTitle", "The closest point, and why squared distance")}</H3>
      <p>
        {tx(t, "mUse_closeBody",
          "Which point on the line y = 2x is closest to P = (5, 0)? A point on the line is (x, 2x), and its distance to P is √((x − 5)² + (2x)²). The square root is increasing, so the distance is smallest exactly where the squared distance D(x) = (x − 5)² + 4x² = 5x² − 10x + 25 is smallest. D′ = 10x − 10 = 0 gives x = 1: the point (1, 2), at distance √(16 + 4) = √20 ≈ 4.47. Minimising the squared distance gives the same answer with easier derivatives and no square root, which is why collision code compares squared lengths. As a check, the segment from (1, 2) to P is (4, −2), and its dot product with the line's direction (1, 2) is 4 − 4 = 0: the shortest path meets the line at a right angle.")}
      </p>

      <H2>{tx(t, "mUse_linTitle", "Linear approximation")}</H2>
      <p>
        {tx(t, "mUse_linBody",
          "Near a, the tangent line is a good stand-in for the curve. So a function's value a little way from a known point is approximately the known value plus slope times step. This is how you estimate without a calculator, how physics engines advance by small steps, and how errors spread through a calculation.")}
      </p>
      <Equation label={tx(t, "mUse_eqLin", "Linear approximation")}
        where={[
          [r`a`, tx(t, "mUse_wA", "a point where f and f′ are easy to compute")],
          [r`\Delta x`, tx(t, "mUse_wDx", "a small step away from a")],
          [r`f'(a)\,\Delta x`, tx(t, "mUse_wChange", "the predicted change: slope times step")],
        ]}
        note={tx(t, "mUse_linNote", "The error is roughly ½ f″(a) Δx²: it shrinks with the square of the step, and it is larger where the curve bends more. The series chapter turns this into a full recipe with more terms.")}>
        {r`f(a + \Delta x) \approx f(a) + f'(a)\,\Delta x`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mUse_tEst", "Estimate"), tx(t, "mUse_tHow", "Using"), tx(t, "mUse_tApprox", "Approximation"), tx(t, "mUse_tTrue", "True value")]}
        rows={[
          ["√4.1", "√x at 4, slope 1/(2·2)", "2 + 0.1/4 = 2.025", "2.02485"],
          ["sin 0.1", "sin x at 0, slope cos 0 = 1", "0.1", "0.09983"],
          ["1.02¹⁰", "(1 + x)¹⁰ at 0, slope 10", "1 + 10 · 0.02 = 1.2", "1.21899"],
          ["e^0.05", "eˣ at 0, slope 1", "1.05", "1.05127"],
        ]}
      />
      <p>
        {tx(t, "mUse_errBody",
          "The same formula spreads measurement errors. A circle's radius is measured as 10 cm ± 0.1 cm. The area A = πr² has A′ = 2πr, so the area's uncertainty is about 2π · 10 · 0.1 ≈ 6.3 cm² out of 314: a 1% error in r becomes a 2% error in the area, because the area depends on r squared. In general, a relative error in x becomes n times that relative error in xⁿ.")}
      </p>

      <H2>{tx(t, "mUse_newtonTitle", "Newton's method")}</H2>
      <p>
        {tx(t, "mUse_newtonBody",
          "To solve f(x) = 0, start from a guess x₀. The curve is hard, but its tangent at x₀ is a straight line, and the root of a straight line is easy: set the linear approximation f(x₀) + f′(x₀)(x − x₀) to 0 and solve for x. Use that as the next guess, and repeat. The figure's third mode draws each step: down the tangent to the axis, up to the curve, down the next tangent.")}
      </p>
      <Equation label={tx(t, "mUse_eqNewton", "One Newton step")}
        where={[
          [r`x_n`, tx(t, "mUse_wXn", "the current guess")],
          [r`f(x_n)`, tx(t, "mUse_wFxn", "how far from zero the function is there")],
          [r`f'(x_n)`, tx(t, "mUse_wDxn", "the slope there; must not be 0")],
          [r`x_{n+1}`, tx(t, "mUse_wXn1", "where the tangent crosses the axis: the next guess")],
        ]}>
        {r`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`}
      </Equation>
      <p>
        {tx(t, "mUse_heronBody",
          "For f(x) = x² − 2 the step is x − (x² − 2)/(2x) = (x + 2/x)/2: exactly Heron's square-root method from the powers chapter, now explained. From x₀ = 3 the guesses are 1.8333, 1.46212, 1.4149984, 1.41421378, 1.414213562373: the number of correct digits roughly doubles each step once close (quadratic convergence), because the error of the tangent approximation shrinks with the square of the distance. Newton's method can also fail: a flat tangent (f′ ≈ 0) throws the next guess far away, a start near the wrong root finds that root instead, and some starts cycle, as x³ − 2x + 2 from 0 does in the figure. Robust code combines it with bisection: take Newton's step when it stays inside a known bracket, otherwise halve.")}
      </p>
      <CodeBlock lang="cpp" filename="newton.hpp" t={t}>{`#include <cmath>
#include <cstdint>
#include <cstring>

// Newton's method with a fallback: gives up (returns NaN) if the slope vanishes
// or it has not converged after maxIter steps.
template <class F, class DF>
double newton(F f, DF df, double x, double tol = 1e-12, int maxIter = 50) {
    for (int i = 0; i < maxIter; ++i) {
        double fx = f(x), d = df(x);
        if (std::fabs(d) < 1e-15) break;            // flat tangent: no crossing
        double next = x - fx / d;
        if (std::fabs(next - x) < tol) return next;
        x = next;
    }
    return NAN;
}

// 1/sqrt(x): a rough first guess from the float's bit pattern, then one Newton step
// for f(y) = 1/y^2 - x. Here f'(y) = -2/y^3, so y - f/f' = y * (1.5 - 0.5 * x * y * y).
float invSqrt(float x) {
    std::uint32_t i; std::memcpy(&i, &x, 4);
    i = 0x5f3759df - (i >> 1);                      // halves and negates the exponent
    float y; std::memcpy(&y, &i, 4);
    return y * (1.5f - 0.5f * x * y * y);           // Newton step: ~0.2% error
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "mUse_quakeTip", "invSqrt is the famous \"fast inverse square root\" from the Quake III source. The magic constant produces a guess within a few percent by treating the float's bits as a logarithm (see the floating-point chapter); the last line is one Newton step, which squares the error. Modern CPUs have a hardware instruction for it, but the method is still a perfect example of Newton's method.")}
      </Callout>

      <H2>{tx(t, "mUse_relTitle", "Related rates")}</H2>
      <p>
        {tx(t, "mUse_relBody",
          "When two quantities are linked by an equation and both change in time, the chain rule links their rates. A stone makes a circular ripple whose radius grows at 2 m/s. How fast does the area grow when r = 5 m? Differentiate A = πr² with respect to time: dA/dt = 2πr · dr/dt = 2π · 5 · 2 ≈ 62.8 m²/s. The area grows faster and faster even though the radius grows steadily, because each new ring is longer.")}
      </p>

      <H2>{tx(t, "mUse_lhTitle", "L'Hôpital's rule")}</H2>
      <p>
        {tx(t, "mUse_lhBody",
          "Linear approximation also settles 0/0 limits. If f(a) = g(a) = 0, then near a, f(x) ≈ f′(a)(x − a) and g(x) ≈ g′(a)(x − a), so f(x)/g(x) ≈ f′(a)/g′(a): the (x − a) factors cancel. The rule says that, whenever the right-hand limit exists, lim f/g = lim f′/g′ for 0/0 (and also for ∞/∞). Example: (eˣ − 1)/x as x → 0 becomes eˣ/1 → 1. Differentiate top and bottom separately, not as a quotient. Careful with sin x / x: L'Hôpital gives cos 0 / 1 = 1, but that argument is circular, because the derivative of sin was found using this very limit.")}
      </p>
      <Equation label={tx(t, "mUse_eqLh", "L'Hôpital's rule")}
        where={[
          [r`\tfrac{0}{0}`, tx(t, "mUse_wForm", "required form: both top and bottom tend to 0 (or both to ±∞)")],
          [r`\tfrac{f'}{g'}`, tx(t, "mUse_wRatio", "the ratio of the separate derivatives, not the derivative of the ratio")],
        ]}>
        {r`\lim_{x\to a}\frac{f(x)}{g(x)} = \lim_{x\to a}\frac{f'(x)}{g'(x)}`}
      </Equation>

      <H2>{tx(t, "mUse_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mUse_ex1", "1. f(x) = x³ − 3x. f′ = 3x² − 3 = 3(x − 1)(x + 1), zero at ±1. f″ = 6x: f″(−1) = −6 < 0, a local max f(−1) = 2; f″(1) = 6 > 0, a local min f(1) = −2. f″ = 0 at x = 0: the inflection point.")}</p>
      <p>{tx(t, "mUse_ex2", "2. A ball is thrown up at 15 m/s: h(t) = 15t − 4.9t². h′ = 15 − 9.8t = 0 at t ≈ 1.53 s, where h ≈ 11.5 m. h″ = −9.8 < 0: a maximum.")}</p>
      <p>{tx(t, "mUse_ex3", "3. Global max of f(x) = x − x² on [0, 2]. f′ = 1 − 2x = 0 at x = ½, f(½) = ¼. Endpoints: f(0) = 0, f(2) = −2. Global max ¼, global min −2 (at an endpoint, where f′ ≠ 0).")}</p>
      <p>{tx(t, "mUse_ex4", "4. Solve cos x = x by Newton with f(x) = cos x − x, f′ = −sin x − 1, from x₀ = 1: x₁ = 0.7504, x₂ = 0.7391, x₃ = 0.739085: the fixed point of cosine.")}</p>

      <H2>{tx(t, "mUse_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mUse_tWrong", "Wrong"), tx(t, "mUse_tRight", "Right"), tx(t, "mUse_tWhy", "Why")]}
        rows={[
          [tx(t, "mUse_m1w", "f′(c) = 0 means a max or min"), tx(t, "mUse_m1r", "check the sign change or f″"), tx(t, "mUse_m1", "x³ is flat at 0 but keeps rising")],
          [tx(t, "mUse_m2w", "ignoring the endpoints"), tx(t, "mUse_m2r", "compare critical points and endpoints"), tx(t, "mUse_m2", "the best value can sit at the edge of the range")],
          [tx(t, "mUse_m3w", "f″(c) = 0 means an inflection point"), tx(t, "mUse_m3r", "f″ must change sign"), tx(t, "mUse_m3", "x⁴ has f″(0) = 0 and is a plain minimum")],
          [tx(t, "mUse_m4w", "L'Hôpital on (f/g)′"), tx(t, "mUse_m4r", "f′/g′, derivatives taken separately"), tx(t, "mUse_m4", "it is not the quotient rule")],
          [tx(t, "mUse_m5w", "trusting Newton from any start"), tx(t, "mUse_m5r", "start near the root, keep a fallback"), tx(t, "mUse_m5", "flat tangents and cycles")],
        ]}
      />

      <KeyIdeas t={t} id="mUse" items={[
        "f′ > 0: rising; f′ < 0: falling; f′ = 0: a critical point.",
        "A sign change + → − is a max, − → + a min; no change is neither.",
        "f″ > 0 bends up (∪), f″ < 0 bends down (∩); inflection is where it switches.",
        "Mean value theorem: somewhere the instant rate equals the average rate. Equal derivatives mean functions differ by a constant.",
        "Optimise by writing one function of one variable, solving f′ = 0, and checking the endpoints.",
        "f(a + Δx) ≈ f(a) + f′(a)Δx: the tangent approximates the curve nearby.",
        "Newton's method x − f/f′ doubles the correct digits per step near a root, but needs a good start.",
      ]} />
    </Article>
  );
}
