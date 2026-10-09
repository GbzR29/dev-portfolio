"use client";

// Calculus 4: using derivatives — rising and falling from the sign of f′;
// critical points and the first-derivative test; the second derivative,
// concavity and inflection; the mean value theorem and its consequences;
// optimisation (fence, box, closest point, why squared distance); linear
// approximation and error propagation; Newton's method (Heron's square roots
// as a special case) worked by hand; related rates; L'Hôpital's rule.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ExtremaFigure } from "@/components/lesson/figures/math/ExtremaFigure";

const r = String.raw;
const num = (v: number, d = 3) => String(+v.toFixed(d)).replace("-", "−");

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The mean value theorem for f(x) = x² on [a, b]: the tangent at c = (a + b)/2 matches the secant. */
function mvtNumbers(v: Record<string, number>) {
  const { a, b } = v;
  if (b <= a) return { tex: r`b \le a: \text{—}` };
  const sec = (b * b - a * a) / (b - a), c = (a + b) / 2;
  return {
    tex: r`\frac{${num(b)}^2 - ${num(a)}^2}{${num(b)} - ${num(a)}} = \amber{${num(sec)}} \qquad c = ${num(c)}: \; f'(c) = 2 \cdot ${num(c)} = \green{${num(2 * c)}}`,
  };
}

/** The open box from a 30 × 30 sheet: V(x) = x(30 − 2x)² and its slope. */
function boxNumbers(v: Record<string, number>) {
  const x = v.x, V = x * (30 - 2 * x) ** 2, dV = (30 - 2 * x) * (30 - 6 * x);
  return {
    tex: r`V = ${num(x, 1)} \cdot (30 - ${num(2 * x, 1)})^2 = \green{${num(V, 0)}}\,\text{cm}^3 \qquad V' = (${num(30 - 2 * x, 1)})(${num(30 - 6 * x, 1)}) = ${Math.abs(dV) < 1e-9 ? r`\green{0}` : num(dV, 0)}`,
    meter: V / 2000,
    meterLabel: `${num(V, 0)} / 2000 cm³`,
  };
}

/** √(4 + Δx) by the tangent at 4, against the true value. */
const sqrtNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const dx = v.dx, approx = 2 + dx / 4, truth = Math.sqrt(4 + dx);
  return {
    tex: r`\sqrt{${num(4 + dx, 2)}} \approx 2 + \frac{${num(dx, 2)}}{4} = \amber{${approx.toFixed(5)}} \qquad \text{${tx(t, "mUse_liveTrue", "true")}: } ${truth.toFixed(5)} \qquad \text{${tx(t, "mUse_liveErr", "error")} } ${Math.abs(approx - truth).toFixed(5)}`,
  };
};

export function DerivativeUsesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mUse_intro",
          "Knowing the slope everywhere tells you a surprising amount about a function without drawing it: where it rises and falls, where its peaks and valleys are, how it bends. That turns \"what is the best choice?\" questions into equations, lets you approximate hard functions with easy ones, and gives the fastest general method for solving equations there is. This chapter collects those uses.")}
      </Lead>

      <Goals t={t} id="mUse" items={[
        "Find where a function rises, falls and bends.",
        "Find the largest or smallest value in a real problem.",
        "Approximate a function with its tangent line, and find roots with Newton's method.",
        "Solve related-rates problems, and evaluate tricky limits with L'Hôpital's rule.",
      ]} />

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
        note={tx(t, "mUse_testNote", "In motion, f″ is acceleration. At the top of a throw the velocity is 0 and the acceleration is −9.8 m/s² (negative): the height is at a maximum.")}
        words={tx(t, "mUse_testWords", "A flat spot where the curve bends down is a peak; a flat spot where it bends up is a valley.")}>
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
        ]}
        words={tx(t, "mUse_mvtWords", "Somewhere between a and b, the rate at that instant equals the average rate over the whole interval.")}>
        {r`f'(c) = \frac{f(b) - f(a)}{b - a}`}
      </Equation>
      <LiveFormula label={tx(t, "mUse_liveMvt", "Try it: the mean value theorem for f(x) = x²")}
        tex={r`f'(c) = \frac{f(b) - f(a)}{b - a}`}
        vars={[
          { id: "a", label: "a", min: -2, max: 2, step: 0.5, value: 1, fmt: v => num(v) },
          { id: "b", label: "b", min: -1.5, max: 3, step: 0.5, value: 3, fmt: v => num(v) },
        ]}
        compute={mvtNumbers}
        note={tx(t, "mUse_liveMvtNote", "For a parabola the point c is always exactly the midpoint of [a, b]: the secant's slope is (b² − a²)/(b − a) = a + b, and f′(c) = 2c matches it at c = (a + b)/2. Starts on the ball of the derivative chapter: average speed 4 m/s between t = 1 and 3, reached at t = 2.")} />
      <p>
        {tx(t, "mUse_mvtCons",
          "Two consequences are used constantly. If f′ = 0 everywhere on an interval, then every average rate is 0, so f is constant there. And if two functions have the same derivative everywhere, their difference has derivative 0, so they differ only by a constant. The fundamental theorem chapter relies on exactly this.")}
      </p>

      <H2>{tx(t, "mUse_optTitle", "Optimisation")}</H2>
      <p>
        {tx(t, "mUse_optBody",
          "To find the best value of something: (1) name the quantity you can choose and the one you want to maximise or minimise; (2) write the second as a function of the first, using the problem's constraints to remove any other variables; (3) note the allowed range; (4) solve f′ = 0; (5) compare the critical points with the endpoints. The figure's second mode is the classic fence: 20 m of fence for three sides of a pen against a wall. With width w the length is 20 − 2w, so A(w) = w(20 − 2w) = 20w − 2w². A′(w) = 20 − 4w = 0 gives w = 5, and A″ = −4 < 0 confirms a maximum: 5 × 10 m = 50 m². The endpoints w = 0 and w = 10 give no area at all.")}
      </p>
      <Derivation t={t} label={tx(t, "mUse_eqFence", "The fence, step by step")}
        steps={[
          { tex: r`A(w) = w\,(20 - 2w) = 20w - 2w^2`, full: true, why: tx(t, "mUse_f1", "steps 1–2: width w, length 20 − 2w (two widths and one length use the 20 m)") },
          { tex: r`0 < w < 10`, full: true, why: tx(t, "mUse_f2", "step 3: the length 20 − 2w must stay positive") },
          { tex: r`A'(w) = 20 - 4w = 0 \;\Rightarrow\; w = 5`, full: true, why: tx(t, "mUse_f3", "step 4: the tangent is flat where A′ = 0") },
          { tex: r`A''(w) = -4 < 0`, full: true, why: tx(t, "mUse_f4", "the curve bends down everywhere, so the flat spot is a maximum") },
          { tex: r`A(5) = 5 \cdot 10 = \green{50\ \text{m}^2}`, full: true, why: tx(t, "mUse_f5", "step 5: the endpoints give A = 0, so 50 m² is the largest") },
        ]} />
      <H3>{tx(t, "mUse_boxTitle", "A box from a sheet")}</H3>
      <p>
        {tx(t, "mUse_boxBody",
          "Cut equal squares of side x from the corners of a 30 × 30 cm sheet and fold up the sides. The box has base (30 − 2x)² and height x, so V(x) = x(30 − 2x)², for x between 0 and 15. The product and chain rules give V′ = (30 − 2x)² + x · 2(30 − 2x)(−2) = (30 − 2x)(30 − 2x − 4x) = (30 − 2x)(30 − 6x). This is 0 at x = 15 (no base left, V = 0) and at x = 5, where V = 5 · 20² = 2000 cm³, the largest possible box.")}
      </p>
      <LiveFormula label={tx(t, "mUse_liveBox", "Try it: cut the corners")}
        tex={r`V(x) = x\,(30 - 2x)^2 \qquad V'(x) = (30 - 2x)(30 - 6x)`}
        vars={[{ id: "x", label: tx(t, "mUse_liveCut", "cut x (cm)"), min: 0.5, max: 14.5, step: 0.5, value: 2, fmt: v => num(v, 1) }]}
        compute={boxNumbers}
        note={tx(t, "mUse_liveBoxNote", "Small cuts make a flat tray, big cuts a tall, thin tower: both hold little. While V′ > 0 a deeper cut helps; at x = 5, V′ = 0 and the bar is full at 2000 cm³; past it every deeper cut loses volume.")} />
      <H3>{tx(t, "mUse_closeTitle", "The closest point, and why squared distance")}</H3>
      <p>
        {tx(t, "mUse_closeBody",
          "Which point on the line y = 2x is closest to P = (5, 0)? A point on the line is (x, 2x), and its distance to P is √((x − 5)² + (2x)²). The square root is increasing, so the distance is smallest exactly where the squared distance D(x) = (x − 5)² + 4x² = 5x² − 10x + 25 is smallest. D′ = 10x − 10 = 0 gives x = 1: the point (1, 2), at distance √(16 + 4) = √20 ≈ 4.47. Minimising the squared distance gives the same answer with easier derivatives and no square root, which is why collision code compares squared lengths. As a check, the segment from (1, 2) to P is (4, −2), and its dot product with the line's direction (1, 2) is 4 − 4 = 0: the shortest path meets the line at a right angle.")}
      </p>

      <H2>{tx(t, "mUse_linTitle", "Linear approximation")}</H2>
      <p>
        {tx(t, "mUse_linBody",
          "Near a, the tangent line is a good stand-in for the curve. So a function's value a little way from a known point is approximately the known value plus slope times step. This is how you estimate without a calculator, how a motion is advanced in small steps of time, and how errors spread through a calculation.")}
      </p>
      <Equation label={tx(t, "mUse_eqLin", "Linear approximation")}
        where={[
          [r`a`, tx(t, "mUse_wA", "a point where f and f′ are easy to compute")],
          [r`\Delta x`, tx(t, "mUse_wDx", "a small step away from a")],
          [r`f'(a)\,\Delta x`, tx(t, "mUse_wChange", "the predicted change: slope times step")],
        ]}
        note={tx(t, "mUse_linNote", "The error is roughly ½ f″(a) Δx²: it shrinks with the square of the step, and it is larger where the curve bends more. The series chapter turns this into a full recipe with more terms.")}
        words={tx(t, "mUse_linWords", "The value a little way off is about the value you know, plus the slope there times the step.")}>
        {r`f(a + \Delta x) \approx f(a) + f'(a)\,\Delta x`}
      </Equation>
      <LiveFormula label={tx(t, "mUse_liveSqrt", "Try it: square roots near 4 from the tangent")}
        tex={r`\sqrt{4 + \Delta x} \approx \sqrt{4} + \frac{1}{2\sqrt{4}}\,\Delta x = 2 + \frac{\Delta x}{4}`}
        vars={[{ id: "dx", label: "Δx", min: -2, max: 2, step: 0.05, value: 0.1, fmt: v => num(v, 2) }]}
        compute={sqrtNumbers(t)}
        note={tx(t, "mUse_liveSqrtNote", "Δx = 0.1 is the table's √4.1. Double the step to 0.2 and the error roughly quadruples, from 0.00015 to 0.0006: it grows with Δx². Far from 4, at Δx = 2, the tangent is off by 0.05.")} />
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
        ]}
        words={tx(t, "mUse_newtonWords", "From the current guess, step back by how far the function is from zero, divided by how steep it is there.")}>
        {r`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`}
      </Equation>
      <p>
        {tx(t, "mUse_heronBody",
          "For f(x) = x² − 2 the step is x − (x² − 2)/(2x) = (x + 2/x)/2: exactly Heron's square-root method from the powers chapter, now explained. From x₀ = 3 the guesses are 1.8333, 1.46212, 1.4149984, 1.41421378, 1.414213562373: the number of correct digits roughly doubles each step once close (quadratic convergence), because the error of the tangent approximation shrinks with the square of the distance. Newton's method can also fail: a flat tangent (f′ ≈ 0) throws the next guess far away, a start near the wrong root finds that root instead, and some starts cycle, as x³ − 2x + 2 from 0 does in the figure. A safe strategy combines it with bisection: take Newton's step when it stays inside a bracket known to hold the root, otherwise halve the bracket.")}
      </p>
      <p>
        {tx(t, "mUse_cubeBody",
          "By hand: the cube root of 10 is the root of f(x) = x³ − 10, with f′(x) = 3x². Start from x₀ = 2, since 2³ = 8 is close to 10. Each row computes f and f′ at the current guess and moves to x − f/f′.")}
      </p>
      <LessonTable
        headers={["n", "xₙ", "f(xₙ) = xₙ³ − 10", "f′(xₙ) = 3xₙ²", "xₙ₊₁ = xₙ − f/f′"]}
        rows={[
          ["0", "2", "−2", "12", "2 + 2/12 ≈ 2.16667"],
          ["1", "2.16667", "0.17130", "14.0833", "2.16667 − 0.01216 ≈ 2.15450"],
          ["2", "2.15450", "0.00091", "13.926", "2.15450 − 0.000065 ≈ 2.154435"],
        ]}
      />
      <p>
        {tx(t, "mUse_cubeCheck",
          "The true value is 2.1544347…: three steps give six correct digits. Watch the size of f: −2, then 0.17, then 0.0009. Each step roughly squares the error, which is what \"the number of correct digits doubles\" means.")}
      </p>

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
        ]}
        words={tx(t, "mUse_lhWords", "When top and bottom both vanish, compare how fast each one vanishes: the ratio of their slopes.")}>
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
