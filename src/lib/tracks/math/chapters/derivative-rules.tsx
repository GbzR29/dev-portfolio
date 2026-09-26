"use client";

// Calculus 3: rules of differentiation — constant, constant multiple and sum
// rules; the power rule from the binomial expansion; product rule by the
// growing rectangle; chain rule as multiplied stretch factors; quotient rule
// from the two; sin and cos from the turning radius; eˣ as its own derivative;
// aˣ and ln x; implicit differentiation on the circle; a derivative table;
// forward-mode automatic differentiation with dual numbers in C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DerivRulesFigure } from "@/components/lesson/figures/math/DerivRulesFigure";

const r = String.raw;

export function DerivativeRulesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRule_intro",
          "Working out every derivative from the limit definition is slow. Fortunately every formula you will meet is built from a few basic functions (powers, sine and cosine, exponentials, logarithms) combined by adding, multiplying, dividing and plugging one into another. Learn the derivative of each basic piece and one rule for each way of combining them, and you can differentiate anything mechanically. This chapter proves each rule, so none of it is magic.")}
      </Lead>

      <H2>{tx(t, "mRule_linTitle", "Constants, multiples and sums")}</H2>
      <p>
        {tx(t, "mRule_linBody",
          "Three rules follow straight from the definition and the limit laws. A constant never changes, so its derivative is 0. Multiplying a function by a constant c multiplies every rise by c while the run stays the same, so the slope is multiplied by c. The rise of a sum is the sum of the rises, so the derivative of a sum is the sum of the derivatives. Together these say that differentiation is linear, the same word as in the matrices chapter: it respects adding and scaling. That is why a polynomial can be differentiated one term at a time.")}
      </p>
      <Equation label={tx(t, "mRule_eqLin", "Linearity of the derivative")}
        where={[
          [r`c`, tx(t, "mRule_wC", "any constant number")],
          [r`f, g`, tx(t, "mRule_wFG", "differentiable functions")],
        ]}>
        {r`(c)' = 0 \qquad (c\,f)' = c\,f' \qquad (f + g)' = f' + g'`}
      </Equation>

      <H2>{tx(t, "mRule_powTitle", "The power rule")}</H2>
      <p>
        {tx(t, "mRule_powBody",
          "The table in the previous chapter showed x² → 2x and x³ → 3x². The pattern holds for every whole-number power n. Expand (x + h)ⁿ = (x + h)(x + h)···(x + h), n brackets. Picking x from every bracket gives xⁿ. Picking h from exactly one bracket and x from the others gives xⁿ⁻¹h, and there are n ways to choose which bracket, so that term is n xⁿ⁻¹ h. Every other choice picks h at least twice and contains h². Subtract xⁿ and divide by h: n xⁿ⁻¹ plus terms that still contain h, which vanish as h → 0.")}
      </p>
      <Equation label={tx(t, "mRule_eqPow", "The power rule")}
        where={[
          [r`n`, tx(t, "mRule_wN", "any real exponent: whole, negative or fractional")],
          [r`n\,x^{n-1}`, tx(t, "mRule_wNx", "bring the exponent down as a factor, then lower the exponent by one")],
        ]}
        note={tx(t, "mRule_powNote", "It also works for negative and fractional powers, which the previous chapter's table confirms: 1/x = x⁻¹ gives −1·x⁻² = −1/x², and √x = x^½ gives ½x^(−½) = 1/(2√x). The general proof comes later in this chapter, from logarithms.")}>
        {r`\frac{d}{dx}\,x^n = n\,x^{n-1}`}
      </Equation>
      <p>
        {tx(t, "mRule_polyEx",
          "Example: p(x) = 4x³ − 5x² + 7x − 2. Term by term: 4 · 3x² − 5 · 2x + 7 − 0 = 12x² − 10x + 7. The constant −2 only shifts the graph up or down, which changes no slope.")}
      </p>

      <H2>{tx(t, "mRule_prodTitle", "The product rule")}</H2>
      <p>
        {tx(t, "mRule_prodBody",
          "The derivative of a product is not the product of the derivatives. Picture u·v as the area of a rectangle with sides u and v (the figure's first mode). When u grows by Δu and v by Δv, the area gains two strips, v·Δu and u·Δv, and a small corner Δu·Δv. Divide by the step Δx that caused the growth and let it shrink: the strips give v·u′ and u·v′, while the corner, (Δu/Δx)·Δv, is a finite rate times something going to 0, and disappears.")}
      </p>
      <Equation label={tx(t, "mRule_eqProd", "The product rule")}
        where={[
          [r`u'v`, tx(t, "mRule_wUpV", "the change from u changing, with v held at its current value")],
          [r`uv'`, tx(t, "mRule_wUVp", "the change from v changing, with u held")],
        ]}
        note={tx(t, "mRule_prodNote", "Example: (x² sin x)′ = 2x · sin x + x² · cos x. Check with x · x: 1 · x + x · 1 = 2x = (x²)′ ✓.")}>
        {r`(u\,v)' = u'\,v + u\,v'`}
      </Equation>

      <DerivRulesFigure t={t} />

      <H2>{tx(t, "mRule_chainTitle", "The chain rule")}</H2>
      <p>
        {tx(t, "mRule_chainBody",
          "Most formulas feed one function into another: sin(2x), (3x + 1)⁵, √(x² + 1). Think of gears. If gear A turns gear B three times as fast, and B turns C twice as fast, then C turns 3 · 2 = 6 times as fast as A. In the same way, if u = g(x) changes g′(x) times as fast as x, and y = f(u) changes f′(u) times as fast as u, then y changes f′(u) · g′(x) times as fast as x. The figure's second mode shows it with three number lines: a small piece dx is stretched by 2x on the way to u = x², then by cos u on the way to y = sin u. In Leibniz notation the rule looks like cancelling fractions, which is a good way to remember it (though du is not really a number being cancelled).")}
      </p>
      <Equation label={tx(t, "mRule_eqChain", "The chain rule")}
        where={[
          [r`g`, tx(t, "mRule_wInner", "the inner function, applied first: u = g(x)")],
          [r`f`, tx(t, "mRule_wOuter", "the outer function, applied to the result: y = f(u)")],
          [r`f'(g(x))`, tx(t, "mRule_wOutD", "the outer derivative, evaluated at the inner value (not at x)")],
          [r`g'(x)`, tx(t, "mRule_wInD", "the inner derivative: \"times the derivative of the inside\"")],
        ]}>
        {r`\frac{d}{dx}\,f(g(x)) = f'(g(x))\cdot g'(x) \qquad\text{or}\qquad \frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "mRule_tFunc", "Function"), tx(t, "mRule_tOuter", "Outer, inner"), tx(t, "mRule_tDeriv", "Derivative")]}
        rows={[
          ["(3x + 1)⁵", "u⁵, u = 3x + 1", "5(3x + 1)⁴ · 3 = 15(3x + 1)⁴"],
          ["sin(2x)", "sin u, u = 2x", "cos(2x) · 2"],
          ["√(x² + 1)", "√u, u = x² + 1", "1/(2√(x² + 1)) · 2x = x/√(x² + 1)"],
          ["sin²x = (sin x)²", "u², u = sin x", "2 sin x · cos x"],
        ]}
      />
      <p>
        {tx(t, "mRule_chainTime",
          "The chain rule is also how rates convert. If a function depends on position and position depends on time, its rate of change in time is (rate per metre) · (metres per second). A sound whose volume falls with distance d as V(d), heard by a player running away at d′(t) = 5 m/s, changes in volume at V′(d) · 5 per second.")}
      </p>

      <H2>{tx(t, "mRule_quotTitle", "The quotient rule")}</H2>
      <p>
        {tx(t, "mRule_quotBody",
          "A quotient is a product with a reciprocal: u/v = u · v⁻¹. The chain rule with the power rule gives (v⁻¹)′ = −v⁻² · v′. The product rule then gives u′ · v⁻¹ + u · (−v′/v²), and putting both over v² yields the quotient rule. The minus sign and the order matter: a handy phrase is \"low d-high minus high d-low, over low squared\".")}
      </p>
      <Equation label={tx(t, "mRule_eqQuot", "The quotient rule")}
        where={[
          [r`u`, tx(t, "mRule_wNum", "the numerator (\"high\")")],
          [r`v \neq 0`, tx(t, "mRule_wDen", "the denominator (\"low\")")],
        ]}
        note={tx(t, "mRule_quotNote", "Example: tan x = sin x / cos x. (cos x · cos x − sin x · (−sin x)) / cos² x = (cos² x + sin² x)/cos² x = 1/cos² x.")}>
        {r`\left(\frac{u}{v}\right)' = \frac{u'\,v - u\,v'}{v^2}`}
      </Equation>

      <H2>{tx(t, "mRule_trigTitle", "Sine and cosine")}</H2>
      <p>
        {tx(t, "mRule_trigBody",
          "The figure's third mode proves the derivative of sine with a picture. On the unit circle, a point at angle θ has height sin θ. Turn it by a tiny extra angle dθ: it moves along an arc of length dθ (radians measure arc length on the unit circle). A tiny arc is almost a straight step along the tangent, and the tangent is perpendicular to the radius. So the little step triangle is the radius triangle turned a quarter turn: its vertical side is cos θ · dθ and its horizontal side is −sin θ · dθ (it moves left while in the first quadrant). The height changes by cos θ · dθ, so (sin θ)′ = cos θ; the horizontal position changes by −sin θ · dθ, so (cos θ)′ = −sin θ.")}
      </p>
      <p>
        {tx(t, "mRule_trigAlg",
          "The same result, algebraically: by the angle-sum identity, sin(x + h) = sin x cos h + cos x sin h. So the difference quotient is sin x · (cos h − 1)/h + cos x · (sin h)/h. The limits chapter showed (cos h − 1)/h → 0 and (sin h)/h → 1 as h → 0, leaving cos x. Both limits need h in radians. With angles in degrees every derivative would carry an extra factor π/180, which is why calculus, and every math library, measures angles in radians.")}
      </p>
      <Equation label={tx(t, "mRule_eqTrig", "Derivatives of sine and cosine")}
        where={[
          [r`x`, tx(t, "mRule_wXrad", "in radians")],
        ]}
        note={tx(t, "mRule_trigNote", "Differentiating four times brings you back to the start: sin → cos → −sin → −cos → sin. The slope of a wave is the same wave shifted a quarter period ahead.")}>
        {r`\frac{d}{dx}\sin x = \cos x \qquad \frac{d}{dx}\cos x = -\sin x`}
      </Equation>

      <H2>{tx(t, "mRule_expTitle", "The exponential: its own derivative")}</H2>
      <p>
        {tx(t, "mRule_expBody",
          "For eˣ, the difference quotient factors neatly: (e^(x+h) − eˣ)/h = eˣ · (eʰ − 1)/h. Everything depends on the limit of (eʰ − 1)/h as h → 0, the slope of eˣ at x = 0. The exponents chapter defined e as the limit of (1 + 1/n)ⁿ; with h = 1/n that says e^h ≈ 1 + h for small h, so eʰ − 1 ≈ h and the ratio tends to 1. That is precisely what makes e special: it is the one base whose exponential has slope exactly 1 where it crosses the y-axis. Then (eˣ)′ = eˣ · 1 = eˣ. The function is its own derivative: the higher it is, the faster it climbs, which is the \"rate proportional to amount\" behaviour of growth and decay.")}
      </p>
      <p>
        {tx(t, "mRule_expBody2",
          "Any other base reduces to e. Since a = e^(ln a), aˣ = e^(x ln a), and the chain rule gives (aˣ)′ = e^(x ln a) · ln a = aˣ ln a. For 2ˣ the slope is 2ˣ · 0.693: always about 69% of its height. A decay e^(−kt) has derivative −k e^(−kt), a rate of loss proportional to what is left, as in radioactive decay or exponential smoothing.")}
      </p>

      <H2>{tx(t, "mRule_lnTitle", "The logarithm")}</H2>
      <p>
        {tx(t, "mRule_lnBody",
          "ln x undoes eˣ, so e^(ln x) = x for every x > 0. Differentiate both sides, using the chain rule on the left (outer eᵘ, inner u = ln x): e^(ln x) · (ln x)′ = 1. Since e^(ln x) = x, this is x · (ln x)′ = 1, so (ln x)′ = 1/x. This trick, differentiating an equation that holds for all x, is how the derivative of any inverse function is found. It also proves the power rule for every real n: xⁿ = e^(n ln x), whose derivative is e^(n ln x) · n/x = xⁿ · n/x = n xⁿ⁻¹.")}
      </p>
      <Equation label={tx(t, "mRule_eqExpLn", "Exponentials and logarithms")}
        where={[
          [r`e^x`, tx(t, "mRule_wEx", "slope equals height at every point")],
          [r`a^x`, tx(t, "mRule_wAx", "a base other than e: an extra factor ln a")],
          [r`\ln x`, tx(t, "mRule_wLn", "defined for x > 0; its slope 1/x shrinks as x grows, so it rises ever more slowly")],
        ]}>
        {r`(e^x)' = e^x \qquad (a^x)' = a^x \ln a \qquad (\ln x)' = \frac{1}{x}`}
      </Equation>

      <H3>{tx(t, "mRule_implTitle", "Implicit differentiation")}</H3>
      <p>
        {tx(t, "mRule_implBody",
          "The same idea works for curves that are not written as y = f(x). On the circle x² + y² = r², think of y as some function of x near a point and differentiate both sides with respect to x: 2x + 2y · y′ = 0 (the chain rule gives y² → 2y · y′). So y′ = −x/y. At the point (3, 4) on the circle of radius 5 the slope is −3/4. The radius to that point has slope 4/3, and (−3/4) · (4/3) = −1: the tangent is perpendicular to the radius, as the circle chapter found with geometry.")}
      </p>

      <H2>{tx(t, "mRule_tableTitle", "The table")}</H2>
      <LessonTable
        headers={["f(x)", "f′(x)", tx(t, "mRule_tNote", "Note")]}
        rows={[
          ["c", "0", tx(t, "mRule_r1", "flat")],
          ["xⁿ", "n xⁿ⁻¹", tx(t, "mRule_r2", "any real n")],
          ["eˣ", "eˣ", tx(t, "mRule_r3", "its own derivative")],
          ["aˣ", "aˣ ln a", tx(t, "mRule_r4", "a > 0")],
          ["ln x", "1/x", "x > 0"],
          ["sin x", "cos x", tx(t, "mRule_r6", "radians")],
          ["cos x", "−sin x", tx(t, "mRule_r6", "radians")],
          ["tan x", "1/cos² x", tx(t, "mRule_r8", "quotient rule")],
          ["u + v, c·u", "u′ + v′, c·u′", tx(t, "mRule_r9", "linearity")],
          ["u·v", "u′v + uv′", tx(t, "mRule_r10", "product rule")],
          ["u/v", "(u′v − uv′)/v²", tx(t, "mRule_r11", "quotient rule")],
          ["f(g(x))", "f′(g(x))·g′(x)", tx(t, "mRule_r12", "chain rule")],
        ]}
      />

      <H2>{tx(t, "mRule_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mRule_ex1", "1. Smoothstep, the easing curve s(x) = 3x² − 2x³ on [0, 1]. s′(x) = 6x − 6x² = 6x(1 − x). At x = 0 and x = 1 the slope is 0: the motion starts and stops gently, which is exactly why smoothstep looks smooth. The fastest point is the middle, s′(½) = 1.5.")}</p>
      <p>{tx(t, "mRule_ex2", "2. A damped spring: x(t) = e^(−2t) cos(10t). Product rule plus chain rule: x′ = −2e^(−2t) cos(10t) + e^(−2t) · (−10 sin(10t)) = −e^(−2t)(2 cos 10t + 10 sin 10t). This is the spring's velocity.")}</p>
      <p>{tx(t, "mRule_ex3", "3. Distance from the origin, d(x) = √(x² + 9), as x changes: d′ = x/√(x² + 9). At x = 4, d = 5 and d′ = 4/5: moving 1 unit along x changes the distance by only 0.8, because the motion is partly sideways.")}</p>
      <p>{tx(t, "mRule_ex4", "4. f(x) = ln(x² + 1). Chain rule: 1/(x² + 1) · 2x = 2x/(x² + 1).")}</p>

      <H2>{tx(t, "mRule_codeTitle", "Letting the computer apply the rules")}</H2>
      <p>
        {tx(t, "mRule_codeBody",
          "The rules are mechanical enough for a program to apply them while it computes. Carry every number together with its derivative, a pair (value, slope), called a dual number. Adding two pairs adds both parts (sum rule); multiplying applies the product rule to the slope; sin applies the chain rule with cos. Start with x = (x, 1), since dx/dx = 1, and any formula built from these operations returns its exact derivative alongside its value, with no h and no rounding trouble. This is forward-mode automatic differentiation; its reverse-mode cousin, backpropagation, trains every neural network, and the AI track builds it from scratch.")}
      </p>
      <CodeBlock lang="cpp" filename="dual.hpp" t={t}>{`#include <cmath>

// A number together with its derivative: v + d·ε, where ε² = 0.
struct Dual { double v, d; };

Dual operator+(Dual a, Dual b) { return { a.v + b.v, a.d + b.d }; }            // sum rule
Dual operator-(Dual a, Dual b) { return { a.v - b.v, a.d - b.d }; }
Dual operator*(Dual a, Dual b) { return { a.v * b.v, a.d * b.v + a.v * b.d }; } // product rule
Dual operator/(Dual a, Dual b) { return { a.v / b.v, (a.d * b.v - a.v * b.d) / (b.v * b.v) }; } // quotient rule
Dual operator*(double c, Dual a) { return { c * a.v, c * a.d }; }

// Chain rule: outer derivative at the inner value, times the inner derivative.
Dual sin(Dual a) { return { std::sin(a.v),  std::cos(a.v) * a.d }; }
Dual cos(Dual a) { return { std::cos(a.v), -std::sin(a.v) * a.d }; }
Dual exp(Dual a) { double e = std::exp(a.v); return { e, e * a.d }; }
Dual log(Dual a) { return { std::log(a.v), a.d / a.v }; }

// f(x) = e^(-2x) cos(10x); seed x with derivative 1.
Dual spring(Dual x) { return exp(-2.0 * x) * cos(10.0 * x); }
// Dual r = spring({0.3, 1.0});   r.v = position, r.d = velocity, exactly`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "mRule_codeTip", "Adding a function (sqrt, pow, tan…) takes one line using its row of the table above: the value part calls the ordinary function, and the derivative part is that row's derivative at a.v, multiplied by a.d. That final factor a.d is the chain rule at work. Dual numbers are also a handy way to check a derivative worked out by hand.")}
      </Callout>

      <H2>{tx(t, "mRule_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mRule_tWrong", "Wrong"), tx(t, "mRule_tRight", "Right"), tx(t, "mRule_tWhy", "Why")]}
        rows={[
          ["(uv)′ = u′v′", "(uv)′ = u′v + uv′", tx(t, "mRule_m1", "both factors change; see the rectangle")],
          ["(sin 2x)′ = cos 2x", "2 cos 2x", tx(t, "mRule_m2", "forgot the inner derivative")],
          ["(2ˣ)′ = x·2ˣ⁻¹", "2ˣ ln 2", tx(t, "mRule_m3", "the power rule needs the variable in the base, not the exponent")],
          ["(u/v)′ = (uv′ − u′v)/v²", "(u′v − uv′)/v²", tx(t, "mRule_m4", "the order sets the sign")],
          [tx(t, "mRule_m5w", "(sin x)′ = cos x with x in degrees"), tx(t, "mRule_m5r", "convert to radians first"), tx(t, "mRule_m5", "in degrees the derivative is (π/180) cos x")],
          ["(e^(3x))′ = e^(3x)", "3e^(3x)", tx(t, "mRule_m6", "chain rule again")],
        ]}
      />

      <KeyIdeas t={t} id="mRule" items={[
        "Differentiation is linear: constants factor out, sums split.",
        "Power rule: (xⁿ)′ = n xⁿ⁻¹ for any real n.",
        "Product rule (uv)′ = u′v + uv′: two strips of a growing rectangle.",
        "Chain rule: outer derivative at the inside, times the inner derivative. Rates multiply.",
        "Quotient rule: (u′v − uv′)/v².",
        "sin′ = cos, cos′ = −sin (radians); (eˣ)′ = eˣ; (ln x)′ = 1/x.",
        "Dual numbers apply the rules automatically and give exact derivatives in code.",
      ]} />
    </Article>
  );
}
