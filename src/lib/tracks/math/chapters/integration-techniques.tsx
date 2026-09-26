"use client";

// Calculus 7: techniques of integration — substitution (the chain rule run
// backwards, with new limits for definite integrals); integration by parts
// (the product rule run backwards, choosing u, repeating, the loop trick);
// powers of sin and cos with the half-angle identities; partial fractions;
// trigonometric substitution and the area of a circle; improper integrals
// (infinite intervals and infinite spikes, the p-test); a strategy table.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { IntegrationFigure } from "@/components/lesson/figures/math/IntegrationFigure";

const r = String.raw;

export function IntegrationTechniquesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTech_intro",
          "The fundamental theorem turned integration into a search: find a function whose derivative is the integrand. The reversed derivative table handles single terms, but most integrands are products, compositions or fractions, and there is no reversed product rule or chain rule that works blindly. Instead there is a small toolbox of rewrites, each one a derivative rule read backwards or an algebra trick, that turn a hard integral into one from the table. This chapter works through them by hand, one at a time, and ends with integrals over intervals that never end.")}
      </Lead>

      <H2>{tx(t, "mTech_subTitle", "Substitution: the chain rule backwards")}</H2>
      <p>
        {tx(t, "mTech_subBody",
          "The chain rule says the derivative of F(g(x)) is F′(g(x)) · g′(x): the outer derivative, evaluated at the inside, times the derivative of the inside. So whenever an integrand has exactly that shape, a function of some inside expression g(x) multiplied by g′(x), its antiderivative is F(g(x)). Substitution is the bookkeeping that spots this. Give the inside a new name, u = g(x). Its derivative du/dx = g′(x) is written as the pair du = g′(x) dx, which says: a small change dx in x causes a change du = g′(x) dx in u. The product g′(x) dx in the integrand is then replaced by du, and the whole integral is written in u alone.")}
      </p>
      <Equation label={tx(t, "mTech_eqSub", "Substitution")}
        where={[
          [r`u = g(x)`, tx(t, "mTech_wU", "the new variable: the inside of the composition")],
          [r`du = g'(x)\,dx`, tx(t, "mTech_wDu", "the differential of u: how u changes when x changes by dx")],
          [r`F`, tx(t, "mTech_wF", "an antiderivative of f; the answer is F(u), written back in x")],
        ]}>
        {r`\int f\big(g(x)\big)\,g'(x)\,dx = \int f(u)\,du = F(u) + C = F\big(g(x)\big) + C`}
      </Equation>
      <H3>{tx(t, "mTech_recipeTitle", "The recipe, step by step")}</H3>
      <p>
        {tx(t, "mTech_recipeBody",
          "Take ∫ 2x cos(x²) dx. Step 1, pick u as an inside expression whose derivative also appears: u = x², since 2x is sitting outside. Step 2, differentiate: du = 2x dx. Step 3, rewrite everything: cos(x²) becomes cos u and 2x dx becomes du, giving ∫ cos u du. If any x is left over, the choice of u was wrong (or needs one more rewrite). Step 4, integrate: sin u + C. Step 5, put x back: sin(x²) + C. Step 6, check by differentiating: cos(x²) · 2x ✓.")}
      </p>
      <p>
        {tx(t, "mTech_constBody",
          "A missing constant factor is no obstacle. In ∫ x √(x² + 1) dx, take u = x² + 1, so du = 2x dx; the integrand has x dx, which is du/2. The integral becomes ½ ∫ √u du = ½ · (2/3) u^(3/2) + C = ⅓ (x² + 1)^(3/2) + C. Only constants can be moved around like this: a missing x cannot be conjured up, because x is not a constant.")}
      </p>
      <H3>{tx(t, "mTech_limTitle", "Definite integrals: change the limits too")}</H3>
      <p>
        {tx(t, "mTech_limBody",
          "With limits, the limits belong to x. When the integral is rewritten in u, convert them as well: each x-limit goes through u = g(x). Then there is no need to go back to x at all. Example: ∫₀² x (x² + 1)³ dx. Take u = x² + 1, du = 2x dx, so x dx = du/2. At x = 0, u = 1; at x = 2, u = 5. The integral is ½ ∫₁⁵ u³ du = ½ [u⁴/4]₁⁵ = ½ · (625 − 1)/4 = 78.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mTech_logTip", "A pattern worth knowing by heart: when the numerator is the derivative of the denominator, the integral is a logarithm. With u = g(x), ∫ g′(x)/g(x) dx = ∫ du/u = ln|g(x)| + C. For example ∫ 2x/(x² + 1) dx = ln(x² + 1) + C, and ∫ tan x dx = ∫ sin x / cos x dx = −ln|cos x| + C (the numerator is minus the derivative of cos x, hence the minus sign).")}
      </Callout>

      <H2>{tx(t, "mTech_partsTitle", "Integration by parts: the product rule backwards")}</H2>
      <p>
        {tx(t, "mTech_partsBody",
          "The product rule says (uv)′ = u′v + uv′. Integrate both sides: uv = ∫ u′v dx + ∫ uv′ dx. Move one term across and you get a way to trade one integral for another. In differential notation, with du = u′ dx and dv = v′ dx, it reads ∫ u dv = uv − ∫ v du. It helps when the integrand is a product of two factors where one, u, becomes simpler when differentiated and the other, dv, is easy to integrate. The figure shows the formula as a picture: two areas that together fill a rectangle.")}
      </p>
      <Equation label={tx(t, "mTech_eqParts", "Integration by parts")}
        where={[
          [r`u`, tx(t, "mTech_wPu", "the factor you will differentiate; choose one that gets simpler")],
          [r`dv`, tx(t, "mTech_wPdv", "the rest of the integrand, including dx; you must be able to integrate it to get v")],
          [r`uv`, tx(t, "mTech_wPuv", "the product of the two, already integrated: the \"boundary term\"")],
          [r`\int v\,du`, tx(t, "mTech_wPvdu", "the new integral, which should be easier than the old one")],
        ]}
        note={tx(t, "mTech_partsNote", "With limits: ∫ₐᵇ u dv = [uv]ₐᵇ − ∫ₐᵇ v du. The boundary term is evaluated at both ends and subtracted, like any antiderivative.")}>
        {r`\int u\,dv = uv - \int v\,du`}
      </Equation>

      <IntegrationFigure t={t} />

      <H3>{tx(t, "mTech_partsEx1Title", "Three standard cases")}</H3>
      <p>
        {tx(t, "mTech_partsEx1",
          "∫ x eˣ dx. Take u = x (differentiating it gives 1, simpler) and dv = eˣ dx (so v = eˣ). Then du = dx and ∫ x eˣ dx = x eˣ − ∫ eˣ dx = x eˣ − eˣ + C = (x − 1)eˣ + C. Check: the product rule gives eˣ + (x − 1)eˣ = x eˣ ✓.")}
      </p>
      <p>
        {tx(t, "mTech_partsEx2",
          "∫ ln x dx. There seems to be only one factor, but dv = dx is the second one. Take u = ln x, so du = dx/x, and v = x. Then ∫ ln x dx = x ln x − ∫ x · (1/x) dx = x ln x − x + C. This is exactly the picture in the figure: the area under ln x is the rectangle minus the area beside the curve.")}
      </p>
      <p>
        {tx(t, "mTech_partsEx3",
          "∫ x² sin x dx needs two rounds. Round 1: u = x², dv = sin x dx, v = −cos x: the integral is −x² cos x + ∫ 2x cos x dx. Round 2 on the new integral: u = 2x, dv = cos x dx, v = sin x: ∫ 2x cos x dx = 2x sin x − ∫ 2 sin x dx = 2x sin x + 2 cos x. Altogether: −x² cos x + 2x sin x + 2 cos x + C. Each round lowers the power of x by one, so xⁿ needs n rounds.")}
      </p>
      <H3>{tx(t, "mTech_loopTitle", "When the integral comes back")}</H3>
      <p>
        {tx(t, "mTech_loopBody",
          "For ∫ eˣ sin x dx neither factor ever gets simpler, yet parts still works. Call the integral I. With u = sin x, dv = eˣ dx: I = eˣ sin x − ∫ eˣ cos x dx. Again with u = cos x, dv = eˣ dx: ∫ eˣ cos x dx = eˣ cos x + ∫ eˣ sin x dx = eˣ cos x + I. Substitute: I = eˣ sin x − eˣ cos x − I. The unknown I appears on both sides, so solve for it like a linear equation: 2I = eˣ(sin x − cos x), and I = ½ eˣ(sin x − cos x) + C.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTech_tPriority", "Choose u from the type that comes first"), tx(t, "mTech_tExamples", "Examples"), tx(t, "mTech_tReason", "Reason")]}
        rows={[
          [tx(t, "mTech_lLog", "L: logarithms"), "ln x", tx(t, "mTech_lLogR", "differentiating gives 1/x, which is algebraic; integrating ln x is exactly what we cannot do yet")],
          [tx(t, "mTech_lInv", "I: inverse trig"), "arctan x", tx(t, "mTech_lInvR", "the derivative is algebraic: y = arctan x means tan y = x; implicitly y′/cos²y = 1, so y′ = cos²y = 1/(1 + x²)")],
          [tx(t, "mTech_lAlg", "A: algebraic (powers of x)"), "x, x²", tx(t, "mTech_lAlgR", "each derivative lowers the power, ending at a constant")],
          [tx(t, "mTech_lTrig", "T: trigonometric"), "sin x, cos x", tx(t, "mTech_lTrigR", "easy to integrate either way")],
          [tx(t, "mTech_lExp", "E: exponential"), "eˣ", tx(t, "mTech_lExpR", "integrates to itself, so it is the ideal dv")],
        ]}
      />
      <p>{tx(t, "mTech_liateBody", "The order spells LIATE. It is a rule of thumb, not a law: it simply puts first the functions that improve when differentiated and last the ones that are easy to integrate.")}</p>

      <H2>{tx(t, "mTech_trigTitle", "Powers of sine and cosine")}</H2>
      <p>
        {tx(t, "mTech_trigBody",
          "sin²x has no entry in the table, and substitution fails (u = sin x needs a cos x factor that is not there). The half-angle identities from the trigonometry section remove the square: sin²x = (1 − cos 2x)/2 and cos²x = (1 + cos 2x)/2. Each right side is a constant plus a plain cosine, and ∫ cos 2x dx = sin(2x)/2.")}
      </p>
      <Equation label={tx(t, "mTech_eqSin2", "Squares of sine and cosine")}
        where={[
          [r`\tfrac{x}{2}`, tx(t, "mTech_wHalf", "from the constant ½: on average, sin² and cos² are each one half")],
          [r`\tfrac{\sin 2x}{4}`, tx(t, "mTech_wWiggle", "from ±½ cos 2x: a wiggle that averages out to nothing over a full period")],
        ]}
        note={tx(t, "mTech_sin2Note", "Over [0, π] the wiggle term is 0 at both ends, so ∫₀^π sin²x dx = π/2: half the width of the interval. The same holds for cos², consistent with sin² + cos² = 1 averaging to 1.")}>
        {r`\int \sin^2 x\,dx = \frac{x}{2} - \frac{\sin 2x}{4} + C \qquad \int \cos^2 x\,dx = \frac{x}{2} + \frac{\sin 2x}{4} + C`}
      </Equation>
      <p>
        {tx(t, "mTech_oddBody",
          "An odd power is easier still. Split off one factor and turn the rest into the other function with sin² + cos² = 1: sin³x = sin x · sin²x = sin x (1 − cos²x). Now u = cos x, du = −sin x dx works: ∫ sin³x dx = −∫ (1 − u²) du = −u + u³/3 + C = −cos x + ⅓ cos³x + C.")}
      </p>

      <H2>{tx(t, "mTech_pfTitle", "Partial fractions")}</H2>
      <p>
        {tx(t, "mTech_pfBody",
          "A fraction of two polynomials, such as 1/(x² − 1), is integrated by undoing the addition of fractions. Adding 1/(x − 1) and 1/(x + 1) needs a common denominator (x − 1)(x + 1); partial fractions goes the other way, splitting a fraction with a factored denominator into simple pieces A/(x − a), each of which integrates to A ln|x − a|. It requires the degree of the numerator to be less than that of the denominator; if it is not, divide the polynomials first, as in the polynomials chapter.")}
      </p>
      <H3>{tx(t, "mTech_pfStepsTitle", "Finding the numerators")}</H3>
      <p>
        {tx(t, "mTech_pfSteps",
          "Step 1, factor the denominator: x² − 1 = (x − 1)(x + 1). Step 2, write the unknown split: 1/((x − 1)(x + 1)) = A/(x − 1) + B/(x + 1). Step 3, multiply both sides by the denominator: 1 = A(x + 1) + B(x − 1), which must hold for every x. Step 4, choose values of x that kill one term: x = 1 gives 1 = 2A, so A = ½; x = −1 gives 1 = −2B, so B = −½. Step 5, integrate each piece: ½ ln|x − 1| − ½ ln|x + 1| + C = ½ ln|(x − 1)/(x + 1)| + C.")}
      </p>
      <p>
        {tx(t, "mTech_pfEx",
          "A second one: ∫ (3x + 5)/((x + 1)(x + 3)) dx. Write 3x + 5 = A(x + 3) + B(x + 1). At x = −1: 2 = 2A, so A = 1. At x = −3: −4 = −2B, so B = 2. The integral is ln|x + 1| + 2 ln|x + 3| + C. A repeated factor such as (x − 1)² needs two pieces, A/(x − 1) + B/(x − 1)², and the second integrates to −B/(x − 1) by the power rule.")}
      </p>

      <H2>{tx(t, "mTech_tsubTitle", "Trigonometric substitution: the area of a circle")}</H2>
      <p>
        {tx(t, "mTech_tsubBody",
          "The top half of the circle x² + y² = r² is the graph y = √(r² − x²), so the area of the half-disc is ∫₋ᵣʳ √(r² − x²) dx. The square root blocks every method so far. The trick is to substitute in the other direction, x = r sin θ, because then r² − x² = r²(1 − sin²θ) = r² cos²θ, a perfect square. As x runs from −r to r, θ runs from −π/2 to π/2, where cos θ ≥ 0, so the root is simply r cos θ. And dx = r cos θ dθ.")}
      </p>
      <Equation label={tx(t, "mTech_eqCircle", "The half-disc by trigonometric substitution")}
        where={[
          [r`x = r\sin\theta`, tx(t, "mTech_wSin", "the substitution: θ is the angle whose sine is x/r")],
          [r`\sqrt{r^2 - x^2} = r\cos\theta`, tx(t, "mTech_wRoot", "by sin² + cos² = 1, with cos θ ≥ 0 on [−π/2, π/2]")],
          [r`\int \cos^2\theta\,d\theta`, tx(t, "mTech_wCos2", "the square of cosine from the previous section; over a half turn it is π/2")],
        ]}
        note={tx(t, "mTech_circleNote", "Doubling gives πr² for the whole disc: the formula the circle chapter found by cutting a pizza into slices is now proved with an integral.")}>
        {r`\int_{-r}^{r}\sqrt{r^2 - x^2}\,dx = \int_{-\pi/2}^{\pi/2} r\cos\theta \cdot r\cos\theta\,d\theta = r^2 \cdot \frac{\pi}{2}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mTech_tSees", "The integrand contains"), tx(t, "mTech_tSubst", "Substitute"), tx(t, "mTech_tBecause", "Because")]}
        rows={[
          ["√(a² − x²)", "x = a sin θ", "a² − a² sin²θ = a² cos²θ"],
          ["√(a² + x²)", "x = a tan θ", tx(t, "mTech_tTan", "a² + a² tan²θ = a²/cos²θ (divide sin² + cos² = 1 by cos²)")],
          ["√(x² − a²)", "x = a / cos θ", tx(t, "mTech_tSec", "a²/cos²θ − a² = a² tan²θ")],
        ]}
      />

      <H2>{tx(t, "mTech_impTitle", "Improper integrals: areas that go on forever")}</H2>
      <p>
        {tx(t, "mTech_impBody",
          "A definite integral was defined on a finite interval [a, b] with a function that stays finite. Two natural questions break those rules: what is the area under 1/x² all the way from 1 to infinity, and what is the area under 1/√x from 0, where the function shoots up to infinity? Neither can be cut into finitely many strips. The answer is to integrate over an interval that avoids the problem and then take a limit. If the limit is a finite number the improper integral converges (has that value); if not, it diverges (has no value).")}
      </p>
      <Equation label={tx(t, "mTech_eqImp", "Improper integrals as limits")}
        where={[
          [r`b \to \infty`, tx(t, "mTech_wBinf", "the right end moves off to infinity; the area up to b is an ordinary integral")],
          [r`\varepsilon \to 0^+`, tx(t, "mTech_wEps", "the left end creeps toward the bad point 0 from the right")],
        ]}>
        {r`\int_1^{\infty} f(x)\,dx = \lim_{b\to\infty}\int_1^{b} f(x)\,dx \qquad \int_0^{1} f(x)\,dx = \lim_{\varepsilon\to 0^+}\int_{\varepsilon}^{1} f(x)\,dx`}
      </Equation>
      <p>
        {tx(t, "mTech_impEx",
          "For 1/x²: ∫₁ᵇ x⁻² dx = [−1/x]₁ᵇ = 1 − 1/b, which tends to 1. For 1/x: ∫₁ᵇ dx/x = ln b, which grows without bound, so it diverges, even though 1/x also shrinks to zero. Shrinking is not enough; it must shrink fast enough. Near 0 it is the other way round: ∫ε¹ x^(−1/2) dx = [2√x]ε¹ = 2 − 2√ε → 2 converges, while ∫ε¹ dx/x = −ln ε diverges. The figure's last two modes show both limits.")}
      </p>
      <LessonTable
        headers={[tx(t, "mTech_tInt", "Integral"), tx(t, "mTech_tConv", "Converges when"), tx(t, "mTech_tVal", "Value")]}
        rows={[
          ["∫₁^∞ x⁻ᵖ dx", "p > 1", "1/(p − 1)"],
          ["∫₀¹ x⁻ᵖ dx", "p < 1", "1/(1 − p)"],
          ["∫₀^∞ e^(−kx) dx", "k > 0", "1/k"],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mTech_pInfo", "Where the p-test comes from: for p ≠ 1, ∫₁ᵇ x⁻ᵖ dx = (b^(1−p) − 1)/(1 − p). If p > 1 the power 1 − p is negative, so b^(1−p) → 0 and the value is 1/(p − 1). If p < 1 it is positive and b^(1−p) → ∞. The case p = 1 is the logarithm, which also runs off to infinity. The same comparison, with sums instead of areas, decides whether a series such as 1 + 1/2² + 1/3² + … adds up to a finite number: the series chapter comes next.")}
      </Callout>

      <H2>{tx(t, "mTech_stratTitle", "Which method to try")}</H2>
      <LessonTable
        headers={[tx(t, "mTech_tLook", "If the integrand looks like"), tx(t, "mTech_tTry", "Try"), tx(t, "mTech_tEx", "Example")]}
        rows={[
          [tx(t, "mTech_s1", "a sum of table entries"), tx(t, "mTech_s1t", "split it (linearity) and use the table"), "∫ (3x² − 2/x) dx"],
          [tx(t, "mTech_s2", "a function of an inside expression, times that inside's derivative"), tx(t, "mTech_s2t", "substitution"), "∫ 2x e^(x²) dx"],
          [tx(t, "mTech_s3", "a product of two different kinds of function"), tx(t, "mTech_s3t", "by parts, u chosen by LIATE"), "∫ x cos x dx"],
          [tx(t, "mTech_s4", "an even power of sin or cos"), tx(t, "mTech_s4t", "half-angle identities"), "∫ cos²x dx"],
          [tx(t, "mTech_s5", "an odd power of sin or cos"), tx(t, "mTech_s5t", "split off one factor, then substitute"), "∫ cos³x dx"],
          [tx(t, "mTech_s6", "a polynomial over a factorable polynomial"), tx(t, "mTech_s6t", "partial fractions"), "∫ dx/(x² − 4)"],
          [tx(t, "mTech_s7", "√(a² − x²) and relatives"), tx(t, "mTech_s7t", "trigonometric substitution"), "∫ √(9 − x²) dx"],
          [tx(t, "mTech_s8", "an infinite interval or a vertical asymptote"), tx(t, "mTech_s8t", "integrate on a safe interval, then take the limit"), "∫₀^∞ e^(−2x) dx"],
        ]}
      />

      <H2>{tx(t, "mTech_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mTech_ex1", "1. ∫ 2x e^(x²) dx: u = x², du = 2x dx, so ∫ eᵘ du = e^(x²) + C.")}</p>
      <p>{tx(t, "mTech_ex2", "2. ∫₀^(π/2) sin x cos x dx: u = sin x, du = cos x dx, limits 0 → 0 and π/2 → 1: ∫₀¹ u du = ½.")}</p>
      <p>{tx(t, "mTech_ex3", "3. ∫₁^e x ln x dx: u = ln x, dv = x dx, v = x²/2. [½x² ln x]₁^e − ∫₁^e (x/2) dx = e²/2 − [x²/4]₁^e = e²/2 − e²/4 + ¼ = (e² + 1)/4 ≈ 2.097.")}</p>
      <p>{tx(t, "mTech_ex4", "4. ∫ cos³x dx = ∫ cos x (1 − sin²x) dx; u = sin x: u − u³/3 + C = sin x − ⅓ sin³x + C.")}</p>
      <p>{tx(t, "mTech_ex5", "5. ∫ dx/(x² − 4): 1 = A(x + 2) + B(x − 2); x = 2 gives A = ¼, x = −2 gives B = −¼. Answer: ¼ ln|(x − 2)/(x + 2)| + C.")}</p>
      <p>{tx(t, "mTech_ex6", "6. ∫₀^∞ x e^(−x) dx: by parts on [0, b], [−x e^(−x)]₀ᵇ + ∫₀ᵇ e^(−x) dx = −b e^(−b) + 1 − e^(−b). As b → ∞ both terms with e^(−b) vanish (the exponential beats the power), leaving 1.")}</p>

      <H2>{tx(t, "mTech_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTech_tWrong", "Wrong"), tx(t, "mTech_tRight", "Right"), tx(t, "mTech_tWhy", "Why")]}
        rows={[
          [tx(t, "mTech_m1w", "∫ cos(x²) dx = sin(x²)/(2x)"), tx(t, "mTech_m1r", "no elementary antiderivative"), tx(t, "mTech_m1", "only constants may be moved outside; x is not a constant")],
          [tx(t, "mTech_m2w", "keeping the x-limits after substituting u"), tx(t, "mTech_m2r", "convert the limits through u = g(x)"), tx(t, "mTech_m2", "the limits belong to the variable of integration")],
          [tx(t, "mTech_m3w", "u = eˣ, dv = x dx in ∫ x eˣ dx"), "u = x, dv = eˣ dx", tx(t, "mTech_m3", "the new integral ∫ ½x² eˣ dx is harder than the old one")],
          [tx(t, "mTech_m4w", "∫ sin²x dx = sin³x/3"), "x/2 − sin(2x)/4 + C", tx(t, "mTech_m4", "the power rule needs the derivative of sin x as a factor")],
          [tx(t, "mTech_m5w", "partial fractions on (x² + 1)/(x² − 1) directly"), tx(t, "mTech_m5r", "divide first: 1 + 2/(x² − 1)"), tx(t, "mTech_m5", "the numerator's degree must be smaller")],
          [tx(t, "mTech_m6w", "∫₋₁¹ dx/x² = [−1/x]₋₁¹ = −2"), tx(t, "mTech_m6r", "diverges"), tx(t, "mTech_m6", "1/x² blows up at 0, inside the interval; a positive function cannot have negative area")],
        ]}
      />

      <KeyIdeas t={t} id="mTech" items={[
        "Substitution is the chain rule backwards: u = g(x), du = g′(x) dx, and convert the limits.",
        "Integration by parts is the product rule backwards: ∫ u dv = uv − ∫ v du; pick u to get simpler (LIATE).",
        "If the integral comes back after two rounds of parts, solve for it like an equation.",
        "Half-angle identities turn sin² and cos² into integrable cosines; odd powers split off one factor.",
        "Partial fractions split a fraction of polynomials into pieces that integrate to logarithms.",
        "x = r sin θ turns √(r² − x²) into r cos θ and proves the area πr².",
        "Improper integrals are limits: ∫₁^∞ x⁻ᵖ converges only for p > 1, ∫₀¹ x⁻ᵖ only for p < 1.",
      ]} />
    </Article>
  );
}
