"use client";

// Calculus 3: rules of differentiation — constant, constant multiple and sum
// rules; the power rule from the binomial expansion; product rule by the
// growing rectangle; chain rule as multiplied stretch factors; quotient rule
// from the two; sin and cos from the turning radius; eˣ as its own derivative;
// aˣ and ln x; implicit differentiation on the circle; a derivative table;
// differentiating a layered formula step by step, from the outside in.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DerivRulesFigure } from "@/components/lesson/figures/math/DerivRulesFigure";

const r = String.raw;
const num = (v: number, d = 3) => String(+v.toFixed(d)).replace("-", "−");
const par = (v: number) => (v < 0 ? `(${num(v)})` : num(v));

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The power rule at one point, checked against a central difference. */
function powerNumbers(v: Record<string, number>) {
  const { n, x } = v, h = 1e-4;
  const rule = n * x ** (n - 1), est = ((x + h) ** n - (x - h) ** n) / (2 * h);
  return {
    tex: r`\frac{d}{dx}\,x^{${num(n, 1)}} = ${num(n, 1)}\,x^{${num(n - 1, 1)}} \;\xrightarrow{\;x = ${num(x, 1)}\;}\; ${par(n)} \cdot ${num(x, 1)}^{${num(n - 1, 1)}} = \green{${num(rule)}} \qquad \frac{f(x + h) - f(x - h)}{2h} \approx ${num(est)}`,
  };
}

/** The slope of aˣ at x = 0: (aʰ − 1)/h for a tiny h, against ln a. */
function baseNumbers(v: Record<string, number>) {
  const a = v.a, h = 1e-6, slope = (a ** h - 1) / h;
  const near = Math.abs(slope - 1) < 0.01;
  return {
    tex: r`\frac{${num(a, 2)}^{h} - 1}{h}\Big|_{h = 10^{-6}} \approx ${near ? r`\green` : r`\amber`}{${num(slope)}} \qquad \ln ${num(a, 2)} = ${num(Math.log(a))}`,
    meter: Math.min(1, Math.max(0, slope / 2)),
    meterLabel: near ? "≈ 1: a ≈ e" : `${num(slope)}`,
  };
}

export function DerivativeRulesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mRule_intro",
          "Working out every derivative from the limit definition is slow. Fortunately every formula you will meet is built from a few basic functions (powers, sine and cosine, exponentials, logarithms) combined by adding, multiplying, dividing and plugging one into another. Learn the derivative of each basic piece and one rule for each way of combining them, and you can differentiate anything mechanically. This chapter proves each rule, so none of it is magic.")}
      </Lead>

      <Goals t={t} id="mRule" items={[
        "Differentiate powers, sums and constant multiples.",
        "Apply the product, quotient and chain rules.",
        "Differentiate sine, cosine, the exponential and the logarithm.",
        "Differentiate a complicated function step by step.",
      ]} />

      <H2>{tx(t, "mRule_linTitle", "Constants, multiples and sums")}</H2>
      <p>
        {tx(t, "mRule_linBody",
          "Three rules follow straight from the definition and the limit laws. A constant never changes, so its derivative is 0. Multiplying a function by a constant c multiplies every rise by c while the run stays the same, so the slope is multiplied by c. The rise of a sum is the sum of the rises, so the derivative of a sum is the sum of the derivatives. Together these say that differentiation is linear, the same word as in the matrices chapter: it respects adding and scaling. That is why a polynomial can be differentiated one term at a time.")}
      </p>
      <Equation label={tx(t, "mRule_eqLin", "Linearity of the derivative")}
        where={[
          [r`c`, tx(t, "mRule_wC", "any constant number")],
          [r`f, g`, tx(t, "mRule_wFG", "differentiable functions")],
        ]}
        words={tx(t, "mRule_linWords", "A constant does not change. A constant factor stays in front of the derivative. The derivative of a sum is the sum of the derivatives.")}>
        {r`(c)' = 0 \qquad (c\,f)' = c\,f' \qquad (f + g)' = f' + g'`}
      </Equation>

      <H2>{tx(t, "mRule_powTitle", "The power rule")}</H2>
      <p>
        {tx(t, "mRule_powBody2",
          "The table in the previous chapter showed x² → 2x and x³ → 3x². The pattern holds for every whole-number power n. Expand (x + h)ⁿ = (x + h)(x + h)···(x + h), n brackets, and sort the terms by how many h's they contain.")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqPowProof", "The power rule, from the expansion")}
        steps={[
          { tex: r`(x + h)^n` },
          { tex: r`= x^n + n\,x^{n-1}h + (\text{${tx(t, "mRule_pTerms", "terms with")}} \; h^2, h^3, \dots)`, why: tx(t, "mRule_p1", "x from every bracket gives xⁿ; h from exactly one bracket gives xⁿ⁻¹h, in n ways; every other choice takes h at least twice") },
          { tex: r`\frac{(x + h)^n - x^n}{h} = n\,x^{n-1} + (\text{${tx(t, "mRule_pTerms", "terms with")}} \; h, h^2, \dots)`, full: true, why: tx(t, "mRule_p2", "subtract xⁿ and divide by h: each leftover term loses one h but keeps at least one") },
          { tex: r`\frac{d}{dx}\,x^n = \green{n\,x^{n-1}}`, full: true, why: tx(t, "mRule_p3", "as h → 0 every term that still contains h vanishes") },
        ]} />
      <Equation label={tx(t, "mRule_eqPow", "The power rule")}
        where={[
          [r`n`, tx(t, "mRule_wN", "any real exponent: whole, negative or fractional")],
          [r`n\,x^{n-1}`, tx(t, "mRule_wNx", "bring the exponent down as a factor, then lower the exponent by one")],
        ]}
        note={tx(t, "mRule_powNote", "It also works for negative and fractional powers, which the previous chapter's table confirms: 1/x = x⁻¹ gives −1·x⁻² = −1/x², and √x = x^½ gives ½x^(−½) = 1/(2√x). The general proof comes later in this chapter, from logarithms.")}
        words={tx(t, "mRule_powWords", "Bring the exponent down in front as a factor, then lower the exponent by one.")}>
        {r`\frac{d}{dx}\,x^n = n\,x^{n-1}`}
      </Equation>
      <LiveFormula label={tx(t, "mRule_livePow", "Try it: the power rule against a measured slope")}
        tex={r`\frac{d}{dx}\,x^n = n\,x^{n-1}`}
        vars={[
          { id: "n", label: "n", min: -2, max: 4, step: 0.5, value: 3, fmt: v => num(v, 1) },
          { id: "x", label: "x", min: 0.5, max: 3, step: 0.1, value: 2, fmt: v => num(v, 1) },
        ]}
        compute={powerNumbers}
        note={tx(t, "mRule_livePowNote", "The green value is the rule; the one on the right is the slope measured with a central difference (h = 0.0001). They agree for whole, negative and fractional n: try n = −1 (the slope of 1/x) and n = 0.5 (the slope of √x). n = 0 gives 0, the flat line y = 1.")} />
      <p>
        {tx(t, "mRule_polyEx",
          "Example: p(x) = 4x³ − 5x² + 7x − 2. Term by term: 4 · 3x² − 5 · 2x + 7 − 0 = 12x² − 10x + 7. The constant −2 only shifts the graph up or down, which changes no slope.")}
      </p>

      <H2>{tx(t, "mRule_prodTitle", "The product rule")}</H2>
      <p>
        {tx(t, "mRule_prodBody2",
          "The derivative of a product is not the product of the derivatives. Picture u·v as the area of a rectangle with sides u and v (the figure's first mode). When x moves by a step Δx, u grows by Δu and v by Δv.")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqProdProof", "The product rule, from the growing rectangle")}
        steps={[
          { tex: r`\Delta(uv)` },
          { tex: r`= (u + \Delta u)(v + \Delta v) - uv`, why: tx(t, "mRule_pr1", "the new area minus the old one") },
          { tex: r`= v\,\Delta u + u\,\Delta v + \Delta u\,\Delta v`, why: tx(t, "mRule_pr2", "multiply out; uv cancels, leaving two strips and a corner") },
          { tex: r`\frac{\Delta(uv)}{\Delta x} = v\,\frac{\Delta u}{\Delta x} + u\,\frac{\Delta v}{\Delta x} + \frac{\Delta u}{\Delta x}\,\Delta v`, full: true, why: tx(t, "mRule_pr3", "divide by the step Δx that caused the growth") },
          { tex: r`(uv)' = \green{v\,u' + u\,v'}`, full: true, why: tx(t, "mRule_pr4", "as Δx → 0 the strips give v·u′ and u·v′; the corner is u′ times Δv, and Δv → 0, so it disappears") },
        ]} />
      <Equation label={tx(t, "mRule_eqProd", "The product rule")}
        where={[
          [r`u'v`, tx(t, "mRule_wUpV", "the change from u changing, with v held at its current value")],
          [r`uv'`, tx(t, "mRule_wUVp", "the change from v changing, with u held")],
        ]}
        note={tx(t, "mRule_prodNote", "Example: (x² sin x)′ = 2x · sin x + x² · cos x. Check with x · x: 1 · x + x · 1 = 2x = (x²)′ ✓.")}
        words={tx(t, "mRule_prodWords", "Derivative of the first times the second, plus the first times the derivative of the second.")}>
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
        ]}
        words={tx(t, "mRule_chainWords", "Differentiate the outside, leaving the inside untouched, then multiply by the derivative of the inside.")}>
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
          "The chain rule is also how rates convert. If a function depends on position and position depends on time, its rate of change in time is (rate per metre) · (metres per second). A sound whose volume falls with distance d as V(d), heard by a person running away at d′(t) = 5 m/s, changes in volume at V′(d) · 5 per second.")}
      </p>

      <H2>{tx(t, "mRule_quotTitle", "The quotient rule")}</H2>
      <p>
        {tx(t, "mRule_quotBody2",
          "A quotient is a product with a reciprocal, so the two rules above already cover it. The minus sign and the order matter: a handy phrase is \"low d-high minus high d-low, over low squared\".")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqQuotProof", "The quotient rule, from the product and chain rules")}
        steps={[
          { tex: r`\left(\frac{u}{v}\right)'` },
          { tex: r`= \left(u \cdot v^{-1}\right)'`, why: tx(t, "mRule_q1", "dividing by v is multiplying by v⁻¹") },
          { tex: r`= u' \cdot v^{-1} + u \cdot \left(-v^{-2}\, v'\right)`, why: tx(t, "mRule_q2", "product rule; (v⁻¹)′ = −v⁻² · v′ by the power rule with the chain rule") },
          { tex: r`= \frac{u'}{v} - \frac{u\,v'}{v^2}`, why: tx(t, "mRule_q3", "write the negative powers as fractions") },
          { tex: r`= \green{\frac{u'\,v - u\,v'}{v^2}}`, why: tx(t, "mRule_q4", "multiply the first fraction by v/v to put both over v²") },
        ]} />
      <Equation label={tx(t, "mRule_eqQuot", "The quotient rule")}
        where={[
          [r`u`, tx(t, "mRule_wNum", "the numerator (\"high\")")],
          [r`v \neq 0`, tx(t, "mRule_wDen", "the denominator (\"low\")")],
        ]}
        note={tx(t, "mRule_quotNote", "Example: tan x = sin x / cos x. (cos x · cos x − sin x · (−sin x)) / cos² x = (cos² x + sin² x)/cos² x = 1/cos² x.")}
        words={tx(t, "mRule_quotWords", "Bottom times the derivative of the top, minus top times the derivative of the bottom, all over the bottom squared.")}>
        {r`\left(\frac{u}{v}\right)' = \frac{u'\,v - u\,v'}{v^2}`}
      </Equation>

      <H2>{tx(t, "mRule_trigTitle", "Sine and cosine")}</H2>
      <p>
        {tx(t, "mRule_trigBody",
          "The figure's third mode proves the derivative of sine with a picture. On the unit circle, a point at angle θ has height sin θ. Turn it by a tiny extra angle dθ: it moves along an arc of length dθ (radians measure arc length on the unit circle). A tiny arc is almost a straight step along the tangent, and the tangent is perpendicular to the radius. So the little step triangle is the radius triangle turned a quarter turn: its vertical side is cos θ · dθ and its horizontal side is −sin θ · dθ (it moves left while in the first quadrant). The height changes by cos θ · dθ, so (sin θ)′ = cos θ; the horizontal position changes by −sin θ · dθ, so (cos θ)′ = −sin θ.")}
      </p>
      <p>
        {tx(t, "mRule_trigAlg2",
          "The same result, algebraically, from the angle-sum identity and the two limits of the limits chapter:")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqSinProof", "The derivative of sine, from the definition")}
        steps={[
          { tex: r`\frac{\sin(x + h) - \sin x}{h}` },
          { tex: r`= \frac{\sin x \cos h + \cos x \sin h - \sin x}{h}`, why: tx(t, "mRule_s1", "angle-sum identity: sin(x + h) = sin x cos h + cos x sin h") },
          { tex: r`= \sin x \cdot \frac{\cos h - 1}{h} + \cos x \cdot \frac{\sin h}{h}`, why: tx(t, "mRule_s2", "group the two sin x terms and split the fraction") },
          { tex: r`\to \sin x \cdot 0 + \cos x \cdot 1 = \green{\cos x}`, why: tx(t, "mRule_s3", "as h → 0, (cos h − 1)/h → 0 and (sin h)/h → 1, both with h in radians") },
        ]} />
      <p>
        {tx(t, "mRule_trigAlg3",
          "With angles in degrees every derivative would carry an extra factor π/180, which is why calculus, and every math library, measures angles in radians.")}
      </p>
      <Equation label={tx(t, "mRule_eqTrig", "Derivatives of sine and cosine")}
        where={[
          [r`x`, tx(t, "mRule_wXrad", "in radians")],
        ]}
        note={tx(t, "mRule_trigNote", "Differentiating four times brings you back to the start: sin → cos → −sin → −cos → sin. The slope of a wave is the same wave shifted a quarter period ahead.")}
        words={tx(t, "mRule_trigWords", "The slope of the sine is the cosine; the slope of the cosine is minus the sine.")}>
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
      <LiveFormula label={tx(t, "mRule_liveBase", "Try it: which base has slope 1 at x = 0?")}
        tex={r`\frac{d}{dx}\,a^x \Big|_{x = 0} = \lim_{h \to 0} \frac{a^h - 1}{h} = \ln a`}
        vars={[{ id: "a", label: tx(t, "mRule_liveA", "base a"), min: 1.5, max: 4, step: 0.01, value: 2, fmt: v => num(v, 2) }]}
        compute={baseNumbers}
        note={tx(t, "mRule_liveBaseNote", "Base 2 climbs at 0.693 where it crosses the y-axis, base 3 at 1.099. Somewhere between them the slope is exactly 1: slide a to 2.72 and the measured slope reads 1.001, because e = 2.71828… is that base.")} />

      <H2>{tx(t, "mRule_lnTitle", "The logarithm")}</H2>
      <p>
        {tx(t, "mRule_lnBody2",
          "ln x undoes eˣ, so e^(ln x) = x for every x > 0. Differentiate both sides of that equation.")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqLnProof", "The derivative of ln x")}
        steps={[
          { tex: r`e^{\ln x} = x`, full: true, why: tx(t, "mRule_l1", "ln undoes the exponential, for every x > 0") },
          { tex: r`e^{\ln x} \cdot (\ln x)' = 1`, full: true, why: tx(t, "mRule_l2", "differentiate both sides; on the left the chain rule with outer eᵘ and inner u = ln x") },
          { tex: r`x \cdot (\ln x)' = 1`, full: true, why: tx(t, "mRule_l3", "e^(ln x) is just x") },
          { tex: r`(\ln x)' = \green{\frac{1}{x}}`, full: true, why: tx(t, "mRule_l4", "divide by x") },
        ]} />
      <p>
        {tx(t, "mRule_lnBody3",
          "This trick, differentiating an equation that holds for all x, is how the derivative of any inverse function is found. It also proves the power rule for every real n: xⁿ = e^(n ln x), whose derivative is e^(n ln x) · n/x = xⁿ · n/x = n xⁿ⁻¹.")}
      </p>
      <Equation label={tx(t, "mRule_eqExpLn", "Exponentials and logarithms")}
        where={[
          [r`e^x`, tx(t, "mRule_wEx", "slope equals height at every point")],
          [r`a^x`, tx(t, "mRule_wAx", "a base other than e: an extra factor ln a")],
          [r`\ln x`, tx(t, "mRule_wLn", "defined for x > 0; its slope 1/x shrinks as x grows, so it rises ever more slowly")],
        ]}
        words={tx(t, "mRule_expWords", "eˣ climbs exactly as fast as its height; any other base climbs at its height times ln a; ln x climbs at one over x.")}>
        {r`(e^x)' = e^x \qquad (a^x)' = a^x \ln a \qquad (\ln x)' = \frac{1}{x}`}
      </Equation>

      <H3>{tx(t, "mRule_implTitle", "Implicit differentiation")}</H3>
      <p>
        {tx(t, "mRule_implBody2",
          "The same idea works for curves that are not written as y = f(x). On the circle x² + y² = r², think of y as some function of x near a point and differentiate both sides with respect to x.")}
      </p>
      <Derivation t={t} label={tx(t, "mRule_eqImpl", "The slope of a circle, implicitly")}
        steps={[
          { tex: r`x^2 + y^2 = r^2`, full: true, why: tx(t, "mRule_i1", "the circle; y depends on x near the point") },
          { tex: r`2x + 2y \cdot y' = 0`, full: true, why: tx(t, "mRule_i2", "differentiate each side; y² → 2y · y′ by the chain rule, and r² is a constant") },
          { tex: r`y' = -\frac{x}{y}`, full: true, why: tx(t, "mRule_i3", "solve for y′") },
          { tex: r`y'\big|_{(3,\,4)} = \green{-\tfrac{3}{4}}`, full: true, why: tx(t, "mRule_i4", "at the point (3, 4) of the circle of radius 5") },
        ]} />
      <p>
        {tx(t, "mRule_implBody3",
          "The radius to (3, 4) has slope 4/3, and (−3/4) · (4/3) = −1: the tangent is perpendicular to the radius, as the circle chapter found with geometry.")}
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
      <p>{tx(t, "mRule_ex1", "1. The curve s(x) = 3x² − 2x³ rises from 0 at x = 0 to 1 at x = 1. s′(x) = 6x − 6x² = 6x(1 − x). At x = 0 and x = 1 the slope is 0: a change that follows this curve starts and stops gently, with no sudden kick at either end. The fastest point is the middle, s′(½) = 1.5.")}</p>
      <p>{tx(t, "mRule_ex2", "2. A damped spring: x(t) = e^(−2t) cos(10t). Product rule plus chain rule: x′ = −2e^(−2t) cos(10t) + e^(−2t) · (−10 sin(10t)) = −e^(−2t)(2 cos 10t + 10 sin 10t). This is the spring's velocity.")}</p>
      <p>{tx(t, "mRule_ex3", "3. Distance from the origin, d(x) = √(x² + 9), as x changes: d′ = x/√(x² + 9). At x = 4, d = 5 and d′ = 4/5: moving 1 unit along x changes the distance by only 0.8, because the motion is partly sideways.")}</p>
      <p>{tx(t, "mRule_ex4", "4. f(x) = ln(x² + 1). Chain rule: 1/(x² + 1) · 2x = 2x/(x² + 1).")}</p>

      <H2>{tx(t, "mRule_drillTitle", "Differentiating step by step")}</H2>
      <p>
        {tx(t, "mRule_drillBody",
          "A long formula is a set of layers. Work from the outside in: name the operation that is done last, apply its rule, and only then differentiate the pieces it needs, each with its own rule. Take y = (x² + 1)³ · e^(2x).")}
      </p>
      <LessonTable
        headers={[tx(t, "mRule_tStep", "Step"), tx(t, "mRule_tWork", "Working")]}
        rows={[
          [tx(t, "mRule_d1a", "outermost operation"), tx(t, "mRule_d1", "a product u · v with u = (x² + 1)³ and v = e^(2x), so y′ = u′v + uv′")],
          [tx(t, "mRule_d2a", "u′ (chain rule)"), tx(t, "mRule_d2", "outer: (…)³ → 3(…)²; inner: x² + 1 → 2x. So u′ = 3(x² + 1)² · 2x = 6x(x² + 1)²")],
          [tx(t, "mRule_d3a", "v′ (chain rule)"), tx(t, "mRule_d3", "outer: e^(…) → e^(…); inner: 2x → 2. So v′ = 2e^(2x)")],
          [tx(t, "mRule_d4a", "assemble"), tx(t, "mRule_d4", "y′ = 6x(x² + 1)² e^(2x) + 2(x² + 1)³ e^(2x)")],
          [tx(t, "mRule_d5a", "tidy up"), tx(t, "mRule_d5", "take out the common factor 2(x² + 1)² e^(2x): y′ = 2(x² + 1)² e^(2x) (3x + x² + 1) = 2(x² + 1)² e^(2x) (x² + 3x + 1)")],
          [tx(t, "mRule_d6a", "check"), tx(t, "mRule_d6", "at x = 0 the formula gives 2 · 1 · 1 · 1 = 2. Numerically, (y(0.001) − y(−0.001))/0.002 ≈ (1.002005 − 0.998005)/0.002 = 2.000 ✓")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mRule_drillTip", "Because every step applies a fixed rule to a smaller piece, differentiation is completely mechanical: no insight is needed, only care. That is why the numerical check in the last row is worth the minute it takes; it catches a forgotten inner derivative at once.")}
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
        "Work from the outside in: name the last operation, apply its rule, then differentiate the pieces.",
      ]} />
    </Article>
  );
}
