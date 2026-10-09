"use client";

// Calculus 6: the fundamental theorem of calculus — the accumulation function
// A(x); part 1, A′ = f, by the thin-strip argument; antiderivatives and the
// constant C; part 2, ∫ f = F(b) − F(a); a table of antiderivatives; the net
// change theorem; motion from acceleration (constant-gravity formulas and
// where a thrown ball lands); functions with no formula antiderivative.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { AccumulationFigure } from "@/components/lesson/figures/math/AccumulationFigure";

const r = String.raw;
const num = (v: number, d = 3) => String(+v.toFixed(d)).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** ∫ₐᵇ x² dx by the antiderivative x³/3. */
function squareNumbers(v: Record<string, number>) {
  const { a, b } = v, Fa = a ** 3 / 3, Fb = b ** 3 / 3;
  return {
    tex: r`\int_{${num(a)}}^{${num(b)}} x^2\,dx = \frac{${par(b)}^3}{3} - \frac{${par(a)}^3}{3} = ${num(Fb)} - ${par(Fa)} = \green{${num(Fb - Fa)}}`,
  };
}

/** A ball thrown up from 1.5 m at v₀: the top of the arc and the landing time. */
const throwNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const v0 = v.v, tTop = v0 / 9.8, yTop = 1.5 + v0 * tTop - 4.9 * tTop ** 2;
  const tLand = (v0 + Math.sqrt(v0 * v0 + 4 * 4.9 * 1.5)) / 9.8;
  return {
    tex: r`\begin{aligned} \text{${tx(t, "mFtc_liveTop", "top")}:}\quad v = ${num(v0, 1)} - 9.8\,t = 0 &\;\Rightarrow\; t = ${num(tTop, 2)}\,\text{s}, \; y = \green{${num(yTop, 2)}}\,\text{m} \\ \text{${tx(t, "mFtc_liveLand", "landing")}:}\quad 1.5 + ${num(v0, 1)}\,t - 4.9\,t^2 = 0 &\;\Rightarrow\; t = \green{${num(tLand, 2)}}\,\text{s} \end{aligned}`,
  };
};

export function FtcContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mFtc_intro",
          "Slopes and areas look like unrelated problems: one is about a single point, the other about a whole interval. The fundamental theorem of calculus says they are inverse operations, like multiplication and division. Integrating a rate gives the total change; differentiating an accumulated total gives back the rate. In practice it means the painful limit of sums from the last chapter can almost always be replaced by running the derivative table backwards and subtracting two numbers.")}
      </Lead>

      <Goals t={t} id="mFtc" items={[
        "Explain why the area under a curve grows at the rate of the curve's height.",
        "Find antiderivatives, constant of integration included.",
        "Evaluate a definite integral with an antiderivative.",
        "Get position from velocity and velocity from acceleration.",
      ]} />

      <H2>{tx(t, "mFtc_accTitle", "Area as a function")}</H2>
      <p>
        {tx(t, "mFtc_accBody",
          "Fix the left end a of an integral and let the right end move. The area from a to x is then a number for every x: a new function, the accumulation function A(x). The integration variable is renamed t so that the letter x is free for the moving end (the name of a dummy variable does not matter). If f is a flow of water into a tank in litres per second, A(x) is the water collected by time x. The figure draws f on top with the area shaded, and A underneath.")}
      </p>
      <Equation label={tx(t, "mFtc_eqAcc", "The accumulation function")}
        where={[
          [r`a`, tx(t, "mFtc_wA", "the fixed starting point; A(a) = 0")],
          [r`x`, tx(t, "mFtc_wX", "the moving right end: the input of A")],
          [r`t`, tx(t, "mFtc_wT", "the dummy variable that runs from a to x")],
        ]}
        words={tx(t, "mFtc_accWords", "A(x) is the signed area under f collected so far, from the fixed start a up to the moving edge x.")}>
        {r`A(x) = \int_a^x f(t)\,dt`}
      </Equation>

      <AccumulationFigure t={t} />

      <H2>{tx(t, "mFtc_p1Title", "Part 1: the area grows at the rate f(x)")}</H2>
      <p>
        {tx(t, "mFtc_p1Body2",
          "How fast does A change as x moves? Nudge x to x + h and look at the extra area: a thin strip under the curve from x to x + h.")}
      </p>
      <Derivation t={t} label={tx(t, "mFtc_eqP1Proof", "Why the area grows at the rate f(x)")}
        steps={[
          { tex: r`A(x + h) - A(x) = \int_x^{x+h} f(t)\,dt`, full: true, why: tx(t, "mFtc_d1", "the new area minus the old one is the thin strip from x to x + h") },
          { tex: r`\int_x^{x+h} f(t)\,dt \approx f(x)\cdot h`, full: true, why: tx(t, "mFtc_d2", "the strip is almost a rectangle of height f(x) and width h; f is continuous, so it hardly changes across a thin strip") },
          { tex: r`\frac{A(x + h) - A(x)}{h} \approx f(x)`, full: true, why: tx(t, "mFtc_d3", "divide by h: the difference quotient of A") },
          { tex: r`A'(x) = \green{f(x)}`, full: true, why: tx(t, "mFtc_d4", "as h → 0 the approximation becomes exact") },
        ]} />
      <p>
        {tx(t, "mFtc_p1Body3",
          "The rate at which the area grows is the height of the curve at the moving edge. In the figure, the amber tangent slope on the bottom always equals the amber height on top.")}
      </p>
      <Equation label={tx(t, "mFtc_eqP1", "The fundamental theorem, part 1")}
        where={[
          [r`A(x+h) - A(x) \approx f(x)\,h`, tx(t, "mFtc_wStrip", "the thin strip is almost a rectangle, height f(x), width h")],
          [r`A'(x) = f(x)`, tx(t, "mFtc_wRes", "dividing by h and letting h → 0")],
        ]}
        note={tx(t, "mFtc_p1Note", "In words: differentiating an integral with respect to its upper limit gives back the integrand. Accumulating and then taking the rate undoes itself.")}>
        {r`\frac{d}{dx}\int_a^x f(t)\,dt = f(x)`}
      </Equation>

      <H2>{tx(t, "mFtc_antiTitle", "Antiderivatives and the constant C")}</H2>
      <p>
        {tx(t, "mFtc_antiBody",
          "A function F whose derivative is f is called an antiderivative of f. Part 1 says A is one. But antiderivatives are never unique: x² and x² + 5 both have derivative 2x, because adding a constant shifts a graph up without changing any slope. Conversely, the mean value theorem from the previous chapter showed that two functions with the same derivative differ only by a constant. So once you have found one antiderivative F, every other one is F + C for some constant C. The figure's second mode shows the family: vertical copies with parallel tangents. The notation without limits, the indefinite integral, stands for the whole family.")}
      </p>
      <Equation label={tx(t, "mFtc_eqIndef", "The indefinite integral")}
        where={[
          [r`F'(x) = f(x)`, tx(t, "mFtc_wAnti", "F is an antiderivative of f")],
          [r`C`, tx(t, "mFtc_wC", "the constant of integration: any number; one extra fact (a starting value) fixes it")],
        ]}
        note={tx(t, "mFtc_indefNote", "Example: ∫ 2x dx = x² + C. Always check by differentiating: (x² + C)′ = 2x ✓.")}
        words={tx(t, "mFtc_indefWords", "The integral without limits means every function whose derivative is f: one of them, plus any constant.")}>
        {r`\int f(x)\,dx = F(x) + C`}
      </Equation>

      <H2>{tx(t, "mFtc_p2Title", "Part 2: evaluating with an antiderivative")}</H2>
      <p>
        {tx(t, "mFtc_p2Body2",
          "Now the payoff. Let F be any antiderivative of f. The accumulation function A is also one, so the two differ only by a constant.")}
      </p>
      <Derivation t={t} label={tx(t, "mFtc_eqP2Proof", "From one antiderivative to the whole area")}
        steps={[
          { tex: r`A(x) = F(x) + C`, full: true, why: tx(t, "mFtc_e1", "A and F are both antiderivatives of f, so they differ by a constant") },
          { tex: r`0 = A(a) = F(a) + C \;\Rightarrow\; C = -F(a)`, full: true, why: tx(t, "mFtc_e2", "at x = a no area has been collected yet") },
          { tex: r`A(x) = F(x) - F(a)`, full: true, why: tx(t, "mFtc_e3", "put that C back") },
          { tex: r`\int_a^b f(x)\,dx = A(b) = \green{F(b) - F(a)}`, full: true, why: tx(t, "mFtc_e4", "take x = b: the whole area from a to b") },
        ]} />
      <p>
        {tx(t, "mFtc_p2Body3",
          "No strips, no limits: find an antiderivative, evaluate it at the two ends and subtract. The square-bracket notation [F(x)]ₐᵇ is shorthand for that subtraction.")}
      </p>
      <Equation label={tx(t, "mFtc_eqP2", "The fundamental theorem, part 2")}
        where={[
          [r`F`, tx(t, "mFtc_wF", "any antiderivative of f (the constant C cancels in the subtraction, so any one works)")],
          [r`\big[F(x)\big]_a^b`, tx(t, "mFtc_wBr", "\"F evaluated from a to b\": F(b) − F(a), upper minus lower")],
        ]}
        words={tx(t, "mFtc_p2Words", "To add up f from a to b, find any function whose derivative is f, and subtract its value at a from its value at b.")}>
        {r`\int_a^b f(x)\,dx = \big[F(x)\big]_a^b = F(b) - F(a)`}
      </Equation>
      <LiveFormula label={tx(t, "mFtc_liveSq", "Try it: areas under x² with no strips")}
        tex={r`\int_a^b x^2\,dx = \left[\frac{x^3}{3}\right]_a^b = \frac{b^3}{3} - \frac{a^3}{3}`}
        vars={[
          { id: "a", label: "a", min: -2, max: 2, step: 0.5, value: 0, fmt: v => num(v, 1) },
          { id: "b", label: "b", min: -2, max: 3, step: 0.5, value: 2, fmt: v => num(v, 1) },
        ]}
        compute={squareNumbers}
        note={tx(t, "mFtc_liveSqNote", "a = 0, b = 2 gives 8/3, the area the strips of the last chapter closed in on. Try a = −2, b = 2: 16/3, twice the right half, because x² is symmetric. Swap the limits (a above b) and the answer changes sign.")} />
      <p>
        {tx(t, "mFtc_checkBody",
          "Check it against the last chapter. For x², an antiderivative is x³/3 (its derivative is 3x²/3 = x²), so ∫₀² x² dx = 8/3 − 0 = 8/3: the same answer the sum of squares took a page to reach. For sin x, an antiderivative is −cos x, so ∫₀^π sin x dx = −cos π − (−cos 0) = 1 + 1 = 2, the exact value the figure and the Simpson example were approaching. And ∫₁⁴ dx/x = ln 4 − ln 1 = ln 4 ≈ 1.386.")}
      </p>

      <H2>{tx(t, "mFtc_tableTitle", "The derivative table, backwards")}</H2>
      <p>
        {tx(t, "mFtc_tableBody",
          "Every derivative rule read from right to left is an integration rule. The power rule lowers the exponent by one and multiplies by it, so its reverse raises the exponent by one and divides by the new exponent. That fails only for n = −1, which would divide by zero; that gap is filled by the logarithm, since (ln x)′ = 1/x. The absolute value in ln|x| makes it work for negative x as well, because (ln(−x))′ = −1/(−x) = 1/x.")}
      </p>
      <LessonTable
        headers={["f(x)", "∫ f(x) dx", tx(t, "mFtc_tCheck", "Check by differentiating")]}
        rows={[
          ["k " + tx(t, "mFtc_tConst", "(constant)"), "kx + C", "(kx)′ = k"],
          ["xⁿ (n ≠ −1)", "xⁿ⁺¹/(n + 1) + C", "(n + 1)xⁿ/(n + 1) = xⁿ"],
          ["1/x", "ln|x| + C", "1/x"],
          ["eˣ", "eˣ + C", "eˣ"],
          ["e^(kx)", "e^(kx)/k + C", tx(t, "mFtc_tChain", "chain rule: k e^(kx)/k")],
          ["sin x", "−cos x + C", "−(−sin x) = sin x"],
          ["cos x", "sin x + C", "cos x"],
          ["sin(kx)", "−cos(kx)/k + C", tx(t, "mFtc_tChain2", "chain rule: k sin(kx)/k")],
          ["c·f + g", "c ∫f + ∫g", tx(t, "mFtc_tLin", "linearity")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mFtc_hardInfo", "There is no product rule or chain rule in reverse that always works. Integrating is harder than differentiating: the next chapter's substitution and integration by parts cover the common cases, and some innocent-looking functions, such as e^(−x²) (the bell curve of statistics) or sin x / x, have no antiderivative made of the usual functions at all. Their integrals are computed numerically, with the rules of the previous chapter.")}
      </Callout>

      <H2>{tx(t, "mFtc_netTitle", "Rate in, total change out")}</H2>
      <p>
        {tx(t, "mFtc_netBody",
          "Part 2 applied to F′ itself gives the net change theorem: integrating a rate of change over an interval gives the total change over that interval. Integrate velocity to get displacement; integrate a leak rate to get water lost; integrate power (energy per second) to get energy; integrate a damage-over-time rate to get total damage. It also works in reverse as a bookkeeping rule: the value at the end is the value at the start plus the accumulated change.")}
      </p>
      <Equation label={tx(t, "mFtc_eqNet", "The net change theorem")}
        where={[
          [r`F'(t)`, tx(t, "mFtc_wRate", "the rate of change of some quantity F")],
          [r`F(b) - F(a)`, tx(t, "mFtc_wChange", "the total change of F between the two times")],
        ]}
        words={tx(t, "mFtc_netWords", "Adding up a rate of change gives the total change; the value at the end is the value at the start plus everything that accumulated.")}>
        {r`\int_a^b F'(t)\,dt = F(b) - F(a) \qquad\Longleftrightarrow\qquad F(b) = F(a) + \int_a^b F'(t)\,dt`}
      </Equation>

      <H2>{tx(t, "mFtc_motionTitle", "Motion from acceleration")}</H2>
      <p>
        {tx(t, "mFtc_motionBody2",
          "Run the derivative chain of motion backwards, with a constant acceleration a (gravity, a rocket's thrust).")}
      </p>
      <Derivation t={t} label={tx(t, "mFtc_eqMotionProof", "Integrating a constant acceleration twice")}
        steps={[
          { tex: r`v(t) = \int a\,dt = a\,t + C_1`, full: true, why: tx(t, "mFtc_m_1", "the velocity is an antiderivative of the acceleration") },
          { tex: r`v(0) = v_0 \;\Rightarrow\; C_1 = v_0`, full: true, why: tx(t, "mFtc_m_2", "at t = 0 the velocity is the starting velocity v₀") },
          { tex: r`s(t) = \int (v_0 + a\,t)\,dt = v_0\,t + \tfrac12 a\,t^2 + C_2`, full: true, why: tx(t, "mFtc_m_3", "the position is an antiderivative of the velocity") },
          { tex: r`s(0) = s_0 \;\Rightarrow\; s(t) = \green{s_0 + v_0\,t + \tfrac12 a\,t^2}`, full: true, why: tx(t, "mFtc_m_4", "at t = 0 the position is the starting position s₀") },
        ]} />
      <p>
        {tx(t, "mFtc_motionBody3",
          "Each constant of integration is an initial condition. These are the formulas of every thrown ball and every falling stone, derived rather than memorised.")}
      </p>
      <Equation label={tx(t, "mFtc_eqMotion", "Constant acceleration")}
        where={[
          [r`a`, tx(t, "mFtc_wAcc", "the constant acceleration, e.g. −9.8 m/s² for gravity (up is positive)")],
          [r`v_0,\ s_0`, tx(t, "mFtc_wInit", "the velocity and position at t = 0: the two constants of integration")],
        ]}
        note={tx(t, "mFtc_motionNote", "In 2D or 3D the same formulas hold for each coordinate separately, with vectors: p(t) = p₀ + v₀t + ½at².")}
        words={tx(t, "mFtc_motionWords", "The velocity changes by the acceleration times the time; the position is where it started, plus the starting velocity times the time, plus half the acceleration times the time squared.")}>
        {r`v(t) = v_0 + a\,t \qquad s(t) = s_0 + v_0\,t + \tfrac12 a\,t^2`}
      </Equation>
      <LiveFormula label={tx(t, "mFtc_liveThrow", "Try it: a ball thrown up from 1.5 m")}
        tex={r`y(t) = 1.5 + v_0\,t - 4.9\,t^2 \qquad v(t) = v_0 - 9.8\,t`}
        vars={[{ id: "v", label: <>v<sub>0</sub> (m/s)</>, min: 2, max: 20, step: 0.5, value: 8, fmt: v => num(v, 1) }]}
        compute={throwNumbers(t)}
        note={tx(t, "mFtc_liveThrowNote", "v₀ = 8 is the throw worked out below: top at 4.77 m after 0.82 s, landing after 1.80 s. Double v₀ to 16 and the top climbs from 4.77 m to 14.6 m: the height gained, v₀²/19.6, grows with the square of the speed.")} />
      <H3>{tx(t, "mFtc_aimTitle", "When does it land?")}</H3>
      <p>
        {tx(t, "mFtc_aimBody",
          "A ball is thrown from height 1.5 m with upward speed 8 m/s and sideways speed 6 m/s. Its height is y(t) = 1.5 + 8t − 4.9t². It lands when y = 0, a quadratic: 4.9t² − 8t − 1.5 = 0, so t = (8 + √(64 + 29.4))/9.8 = (8 + 9.66)/9.8 ≈ 1.80 s (the other root is negative, before the throw). Sideways it travels 6 · 1.80 ≈ 10.8 m. The top of the arc is where the velocity 8 − 9.8t is 0: t ≈ 0.82 s, height 1.5 + 8 · 0.82 − 4.9 · 0.82² ≈ 4.77 m. Its path is a parabola: x grows steadily with t while y follows a quadratic.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mFtc_exactTip", "Integrating twice worked because the acceleration was a known function of time, here a constant. As soon as the force depends on where the object is or how fast it moves (air drag, a spring, a pendulum), the acceleration is no longer known in advance, and integrating it directly is impossible. That situation is a differential equation, the subject of a later chapter.")}
      </Callout>

      <H2>{tx(t, "mFtc_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mFtc_ex1", "1. ∫₁² (3x² + 2x) dx = [x³ + x²]₁² = (8 + 4) − (1 + 1) = 10.")}</p>
      <p>{tx(t, "mFtc_ex2", "2. ∫₀¹ eˣ dx = e¹ − e⁰ = e − 1 ≈ 1.718.")}</p>
      <p>{tx(t, "mFtc_ex3", "3. ∫₀^(π/2) cos x dx = sin(π/2) − sin 0 = 1.")}</p>
      <p>{tx(t, "mFtc_ex4", "4. ∫ (4x³ − 1/x + 2) dx = x⁴ − ln|x| + 2x + C. Check: 4x³ − 1/x + 2 ✓.")}</p>
      <p>{tx(t, "mFtc_ex5", "5. d/dx ∫₀ˣ √(1 + t³) dt = √(1 + x³), by part 1, even though this antiderivative has no simple formula.")}</p>
      <p>{tx(t, "mFtc_ex6", "6. Water flows into a tank at r(t) = 10 e^(−0.5t) litres per minute as a valve slowly closes. Total over the first 4 minutes: ∫₀⁴ 10e^(−0.5t) dt = [−20e^(−0.5t)]₀⁴ = −20e^(−2) + 20 ≈ 17.3 L. Over all time it approaches 20 L.")}</p>

      <H2>{tx(t, "mFtc_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mFtc_tWrong", "Wrong"), tx(t, "mFtc_tRight", "Right"), tx(t, "mFtc_tWhy", "Why")]}
        rows={[
          [tx(t, "mFtc_m1w", "∫ 2x dx = x²"), "x² + C", tx(t, "mFtc_m1", "every vertical shift is also an antiderivative")],
          ["∫ x⁻¹ dx = x⁰/0", "ln|x| + C", tx(t, "mFtc_m2", "the power rule excludes n = −1")],
          ["F(a) − F(b)", "F(b) − F(a)", tx(t, "mFtc_m3", "upper limit minus lower limit")],
          ["∫ sin x dx = cos x", "−cos x + C", tx(t, "mFtc_m4", "differentiate to check the sign")],
          [tx(t, "mFtc_m5w", "area between curve and axis = ∫ f"), tx(t, "mFtc_m5r", "split where f changes sign"), tx(t, "mFtc_m5", "negative parts subtract")],
          ["∫ f·g = ∫f · ∫g", tx(t, "mFtc_m6r", "no such rule"), tx(t, "mFtc_m6", "the product rule does not run backwards that simply")],
        ]}
      />

      <KeyIdeas t={t} id="mFtc" items={[
        "A(x) = ∫ₐˣ f(t) dt accumulates area as the right end moves.",
        "Part 1: A′(x) = f(x). The area grows at the rate of the curve's height.",
        "Antiderivatives differ by a constant: ∫ f dx = F + C.",
        "Part 2: ∫ₐᵇ f dx = F(b) − F(a) for any antiderivative F.",
        "Integrate a rate to get the total change: velocity → displacement.",
        "Constant acceleration: v = v₀ + at, s = s₀ + v₀t + ½at²; the constants are initial conditions.",
        "Always check an antiderivative by differentiating it.",
      ]} />
    </Article>
  );
}
