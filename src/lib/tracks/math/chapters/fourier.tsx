"use client";

// Calculus 15: Fourier series and the Fourier transform — a periodic function
// as a sum of sines and cosines; orthogonality of the waves over a period; the
// coefficient formulas derived from it (a projection, as with the dot
// product); the square wave worked by hand; odd/even shortcuts; how fast the
// series converges (jumps, kinks, Gibbs); any period 2L; the complex form;
// Parseval's identity and Σ 1/n² = π²/6; and the step from series to
// transform as the period grows, with the pulse, the bell curve, the
// width trade-off and derivatives turning into multiplication by iω.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { FourierFigure } from "@/components/lesson/figures/math/FourierFigure";
import { FourierTransformFigure } from "@/components/lesson/figures/math/FourierTransformFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;
const n = (v: number) => String(+v.toFixed(4)).replace("-", "−");

// ── Live formula: the square wave at x = π/2 gives Leibniz's series ──────────

function leibnizNumbers(v: Record<string, number>) {
  let s = 0;
  for (let k = 0; k < v.N; k++) s += (k % 2 ? -1 : 1) / (2 * k + 1);
  return {
    tex: r`4\left(1 - \tfrac13 + \tfrac15 - \dots\right)_{${v.N}\ \text{terms}} = ${n(4 * s)} \quad (\pi = ${n(Math.PI)})`,
    meter: Math.min(1, Math.max(0, 1 - Math.abs(4 * s - Math.PI))),
  };
}

export function FourierContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mFou_intro",
          "The waves chapter built a square wave by adding sin x, sin 3x / 3, sin 5x / 5 and so on. It looked like a trick for one shape. It is not: practically any function that repeats can be written as a sum of sines and cosines, and there is a formula for exactly how much of each wave it contains. This chapter derives that formula, uses it, and then lets the period grow without limit, which turns the sum into the Fourier transform. It is the mathematics behind audio equalisers, JPEG images and MRI scanners, and the next chapters use it to solve the equations of heat and waves.")}
      </Lead>

      <Goals t={t} id="mFou" items={[
        "Explain why sin(mx) and sin(nx) integrate to 0 over a period when m ≠ n (orthogonality).",
        "Derive and use the formulas for the Fourier coefficients aₙ and bₙ.",
        "Use odd and even symmetry, any period 2L and the complex form e^(inx).",
        "Use Parseval's identity, and describe how the series becomes the Fourier transform as the period grows.",
      ]} />

      <H2>{tx(t, "mFou_sumTitle", "A function as a sum of waves")}</H2>
      <p>
        {tx(t, "mFou_sumBody",
          "A function f is periodic with period 2π when f(x + 2π) = f(x) for every x: its graph repeats every 2π. The simplest such functions are the waves cos(nx) and sin(nx) for whole numbers n = 1, 2, 3 … The wave with index n goes through n complete cycles in one period; n is called its frequency, or its harmonic number. A constant also repeats. The claim of Fourier analysis is that a periodic f can be rebuilt from these pieces.")}
      </p>
      <Equation label={tx(t, "mFou_eqSeries", "The Fourier series of a 2π-periodic function")}
        where={[
          [r`a_0`, tx(t, "mFou_wA0", "a constant; a₀/2 turns out to be the average height of f (why halved: see below)")],
          [r`a_n`, tx(t, "mFou_wAn", "how much of the wave cos(nx) is in f, its cosine coefficient")],
          [r`b_n`, tx(t, "mFou_wBn", "how much of the wave sin(nx) is in f, its sine coefficient")],
          [r`n`, tx(t, "mFou_wN", "the harmonic number: 1, 2, 3 …; the wave fits n whole cycles in one period")],
        ]}
        words={tx(t, "mFou_seriesWords", "f equals its average, plus some amount of each cosine wave, plus some amount of each sine wave.")}>
        {r`f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty} \big(a_n \cos nx + b_n \sin nx\big)`}
      </Equation>
      <p>
        {tx(t, "mFou_sumQ",
          "The sum is an infinite series, as in the Taylor series chapter, but built from waves instead of powers of x. A Taylor series copies a function near one point; a Fourier series copies it over a whole period at once, corners and jumps included. Two questions follow: how do we find the numbers aₙ and bₙ, and does the sum really come back to f?")}
      </p>

      <H2>{tx(t, "mFou_orthoTitle", "Orthogonality: waves that cancel each other out")}</H2>
      <p>
        {tx(t, "mFou_orthoBody",
          "The key fact is about products of two waves. Over one full period, the integral of cos(kx) is 0 for any whole number k ≠ 0: the wave spends as much area above the axis as below. Products of two waves can be turned into sums of single waves by the product-to-sum identities of the identities chapter, and then the same cancellation does the rest.")}
      </p>
      <Derivation t={t} label={tx(t, "mFou_eqOrthoDer", "∫ sin(mx) sin(nx) dx over [−π, π]")}
        steps={[
          { tex: r`\sin A \sin B = \tfrac12\big[\cos(A - B) - \cos(A + B)\big]`, why: tx(t, "mFou_o1", "the product-to-sum identity, from cos(A ± B) = cos A cos B ∓ sin A sin B") },
          { full: true, tex: r`\int_{-\pi}^{\pi} \sin mx \sin nx\,dx = \tfrac12\int_{-\pi}^{\pi} \cos\big((m - n)x\big)\,dx - \tfrac12\int_{-\pi}^{\pi} \cos\big((m + n)x\big)\,dx`, why: tx(t, "mFou_o2", "with A = mx and B = nx") },
          { full: true, tex: r`\int_{-\pi}^{\pi} \cos kx\,dx = \Big[\tfrac{\sin kx}{k}\Big]_{-\pi}^{\pi} = 0 \quad (k \neq 0)`, why: tx(t, "mFou_o3", "sin(kπ) = 0 for every whole number k") },
          { full: true, tex: r`m \neq n:\ 0 - 0 = \green{0}, \qquad m = n:\ \tfrac12 \cdot 2\pi - 0 = \green{\pi}`, why: tx(t, "mFou_o4", "when m = n the first cosine is cos 0 = 1, whose integral is the length 2π") },
        ]} />
      <LessonTable
        headers={[tx(t, "mFou_tInt", "Integral over [−π, π]"), "m ≠ n", "m = n ≥ 1"]}
        rows={[
          [r`∫ sin mx · sin nx dx`, "0", "π"],
          [r`∫ cos mx · cos nx dx`, "0", tx(t, "mFou_tPi", "π (2π when m = n = 0)")],
          [r`∫ sin mx · cos nx dx`, "0", "0"],
        ]}
      />
      <p>
        {tx(t, "mFou_orthoDot",
          "This is the dot product of the vectors chapter in disguise. Think of a function as a vector with one component for every x, and of ⟨f, g⟩ = ∫ f(x) g(x) dx as their dot product: multiply component by component, then add. Then two different waves have dot product 0: they are perpendicular, or orthogonal. And each wave has ⟨sin nx, sin nx⟩ = π, its length squared.")}
      </p>

      <H2>{tx(t, "mFou_coefTitle", "Finding the coefficients")}</H2>
      <p>
        {tx(t, "mFou_coefBody",
          "Suppose f really is the series. To pull out one coefficient, say b₃, multiply both sides by sin 3x and integrate over a period. By orthogonality every term of the series gives 0, except the one with sin 3x, which gives b₃ · π. So b₃ is the integral of f(x) sin 3x divided by π. The same works for every n and for the cosines.")}
      </p>
      <Derivation t={t} label={tx(t, "mFou_eqCoefDer", "Why bₘ = (1/π) ∫ f(x) sin(mx) dx")}
        steps={[
          { full: true, tex: r`\int_{-\pi}^{\pi} f(x)\sin mx\,dx = \frac{a_0}{2}\int \sin mx\,dx + \sum_{n} \Big(a_n \!\int \cos nx \sin mx\,dx + b_n \!\int \sin nx \sin mx\,dx\Big)`, why: tx(t, "mFou_c1", "multiply the series by sin mx and integrate term by term") },
          { full: true, tex: r`= 0 + \sum_n \big(a_n \cdot 0\big) + b_m \cdot \pi`, why: tx(t, "mFou_c2", "the orthogonality table: only the term with n = m survives") },
          { full: true, tex: r`b_m = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x) \sin mx\,dx`, why: tx(t, "mFou_c3", "divide by π") },
        ]} />
      <Equation label={tx(t, "mFou_eqCoef", "The Fourier coefficients")}
        where={[
          [r`\frac{1}{\pi}`, tx(t, "mFou_wInvPi", "divides by π = ∫ sin² nx dx, the wave's length squared")],
          [r`f(x)\cos nx`, tx(t, "mFou_wProd", "the product of f with one wave: positive where they agree in sign, negative where they disagree")],
          [r`[-\pi, \pi]`, tx(t, "mFou_wPer", "one whole period; any interval of length 2π gives the same result")],
        ]}
        note={tx(t, "mFou_coefNote", "With n = 0 the cosine formula gives a₀ = (1/π) ∫ f dx, twice the average of f. That is why the series starts with a₀/2: so one formula works for every aₙ.")}
        words={tx(t, "mFou_coefWords", "To find how much of a wave is in f, multiply f by that wave, integrate over a period, and divide by π.")}>
        {r`a_n = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\cos nx\,dx, \qquad b_n = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\sin nx\,dx`}
      </Equation>
      <p>
        {tx(t, "mFou_coefProj",
          "It is the same recipe as finding the component of a vector v along a direction e: v · e divided by e · e. Here v is f, e is the wave, and e · e is π. Each coefficient is a projection of f onto one wave.")}
      </p>

      <FourierFigure t={t} />

      <H3>{tx(t, "mFou_sqTitle", "By hand: the square wave")}</H3>
      <p>
        {tx(t, "mFou_sqBody",
          "Let f(x) = −1 for −π < x < 0 and f(x) = 1 for 0 < x < π, repeated every 2π. It is odd, f(−x) = −f(x), so every aₙ is 0 (the next section explains why). For bₙ, both halves contribute the same amount, so we can integrate over [0, π] and double.")}
      </p>
      <Derivation t={t} label={tx(t, "mFou_eqSqDer", "bₙ for the square wave")}
        steps={[
          { full: true, tex: r`b_n = \frac{1}{\pi}\Big(\int_{-\pi}^{0} (-1)\sin nx\,dx + \int_{0}^{\pi} \sin nx\,dx\Big) = \frac{2}{\pi}\int_{0}^{\pi} \sin nx\,dx`, why: tx(t, "mFou_s1", "−sin(nx) on the left half has the same area as sin(nx) on the right half") },
          { full: true, tex: r`\int_0^{\pi} \sin nx\,dx = \Big[-\frac{\cos nx}{n}\Big]_0^{\pi} = \frac{1 - \cos n\pi}{n} = \frac{1 - (-1)^n}{n}`, why: tx(t, "mFou_s2", "cos(nπ) is 1 for even n and −1 for odd n, which is (−1)ⁿ") },
          { full: true, tex: r`b_n = \frac{2\,(1 - (-1)^n)}{n\pi} = \begin{cases} \green{\dfrac{4}{n\pi}} & n \text{ odd} \\[4pt] 0 & n \text{ even} \end{cases}`, why: tx(t, "mFou_s3", "1 − (−1)ⁿ is 2 for odd n and 0 for even n") },
          { full: true, tex: r`f(x) = \frac{4}{\pi}\Big(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \dots\Big)`, why: tx(t, "mFou_s4", "exactly the sum the waves chapter added up by eye") },
        ]} />
      <p>
        {tx(t, "mFou_leib",
          "Put x = π/2 into that series. The left side is f(π/2) = 1, and sin(π/2) = 1, sin(3π/2) = −1, sin(5π/2) = 1 … So 1 = (4/π)(1 − 1/3 + 1/5 − 1/7 + …), which says that π = 4(1 − 1/3 + 1/5 − …). A formula for π falls out of a square wave.")}
      </p>
      <LiveFormula label={tx(t, "mFou_liveLeib", "Try it: π from the square wave")}
        tex={r`\pi = 4\left(1 - \tfrac13 + \tfrac15 - \tfrac17 + \dots\right)`}
        vars={[{ id: "N", label: tx(t, "mFou_liveTerms", "terms"), min: 1, max: 200, step: 1, value: 5, fmt: (v: number) => String(v) }]}
        compute={leibnizNumbers}
        note={tx(t, "mFou_liveLeibNote", "It gets there, but slowly: with 200 terms the error is still about 0.005. Series of functions with jumps converge slowly, as the next section explains.")} />

      <H3>{tx(t, "mFou_symTitle", "Odd and even: half the work")}</H3>
      <p>
        {tx(t, "mFou_symBody",
          "A function is even when f(−x) = f(x) (a mirror image across the y-axis, like cos x or x²) and odd when f(−x) = −f(x) (like sin x or x³). Over a symmetric interval [−π, π] an odd function integrates to 0, because the area on the left cancels the area on the right. An odd function times a cosine (even) is odd, so all its aₙ vanish; an even function times a sine is odd, so all its bₙ vanish.")}
      </p>
      <LessonTable
        headers={[tx(t, "mFou_tF", "f is…"), tx(t, "mFou_tSeries", "its series has…"), tx(t, "mFou_tCoef", "and the coefficient is")]}
        rows={[
          [tx(t, "mFou_tOdd", "odd"), tx(t, "mFou_tOnlySin", "only sines"), "bₙ = (2/π) ∫₀^π f(x) sin nx dx"],
          [tx(t, "mFou_tEven", "even"), tx(t, "mFou_tOnlyCos", "only cosines (and a₀)"), "aₙ = (2/π) ∫₀^π f(x) cos nx dx"],
          [tx(t, "mFou_tNeither", "neither"), tx(t, "mFou_tBoth", "both families"), tx(t, "mFou_tFull", "the full formulas over [−π, π]")],
        ]}
      />

      <H2>{tx(t, "mFou_convTitle", "Does the sum come back to f?")}</H2>
      <p>
        {tx(t, "mFou_convBody",
          "For the functions met in practice, yes. Dirichlet's theorem says: if f is piecewise smooth (made of finitely many smooth pieces, with finitely many jumps in a period), its Fourier series converges to f(x) at every point where f is continuous, and to the midpoint of the jump, ½(left value + right value), at a jump. The square wave's series gives 0 at x = 0, halfway between −1 and 1.")}
      </p>
      <p>
        {tx(t, "mFou_convRate",
          "How fast it converges depends on how smooth f is, and you can read it from the coefficients: the rougher f is, the more of its energy sits in high frequencies, and the more terms you need.")}
      </p>
      <LessonTable
        headers={[tx(t, "mFou_tShape", "f has…"), tx(t, "mFou_tSize", "coefficients shrink like"), tx(t, "mFou_tEx", "example")]}
        rows={[
          [tx(t, "mFou_tJump", "a jump"), "1/n", tx(t, "mFou_tExSq", "square wave 4/(nπ), sawtooth")],
          [tx(t, "mFou_tKink", "a kink (corner), no jump"), "1/n²", tx(t, "mFou_tExTri", "triangle wave 8/(n²π²), half sine")],
          [tx(t, "mFou_tSmooth", "no corners at all"), tx(t, "mFou_tFast", "faster than any power"), tx(t, "mFou_tExSm", "e^(cos x)")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mFou_gibbs", "Beside a jump, the partial sums always overshoot by about 9% of the jump's height, however many terms you take. This is the Gibbs phenomenon. More terms push the bump closer to the jump and make it narrower, so its area, and the overall error, still goes to 0. You can hear it as ringing in heavily compressed audio.")}
      </Callout>

      <H2>{tx(t, "mFou_periodTitle", "Any period")}</H2>
      <p>
        {tx(t, "mFou_periodBody",
          "Nothing special happens at 2π. If f repeats every 2L, stretch the waves to fit: cos(nπx/L) and sin(nπx/L) go through n cycles in a length 2L. Substituting x → πx/L in everything gives the general formulas.")}
      </p>
      <Equation label={tx(t, "mFou_eqPeriod", "Fourier series with period 2L")}
        where={[
          [r`L`, tx(t, "mFou_wL", "half the period: f(x + 2L) = f(x)")],
          [r`\tfrac{n\pi}{L}`, tx(t, "mFou_wFreq", "the angular frequency of the n-th wave, in radians per unit of x")],
          [r`\tfrac{1}{L}`, tx(t, "mFou_wInvL", "replaces 1/π: ∫ sin²(nπx/L) dx over the period is L")],
        ]}
        words={tx(t, "mFou_periodWords", "The same series, with every wave stretched so that n of its cycles fit exactly into one period.")}>
        {r`f(x) = \frac{a_0}{2} + \sum_{n=1}^{\infty}\Big(a_n \cos\frac{n\pi x}{L} + b_n \sin\frac{n\pi x}{L}\Big),\quad a_n = \frac1L\int_{-L}^{L} f(x)\cos\frac{n\pi x}{L}\,dx`}
      </Equation>
      <p>
        {tx(t, "mFou_halfRange",
          "A function given only on [0, L] can be extended to [−L, L] as an odd function and then repeated. Its series then contains only sines, sin(nπx/L), each of which is 0 at x = 0 and at x = L. The chapter on partial differential equations uses exactly this \"sine series\" for a string tied at both ends.")}
      </p>

      <H2>{tx(t, "mFou_cxTitle", "The complex form")}</H2>
      <p>
        {tx(t, "mFou_cxBody",
          "Euler's formula, e^(inx) = cos nx + i sin nx from the complex numbers chapter, packs a cosine and a sine into one rotating arrow. Using both e^(inx) and e^(−inx), the cosines and sines combine into a single sum over all whole numbers n, positive and negative, with one complex coefficient each.")}
      </p>
      <Equation label={tx(t, "mFou_eqComplex", "The complex Fourier series")}
        where={[
          [r`c_n`, tx(t, "mFou_wCn", "a complex number: its modulus is the amplitude of frequency n, its argument the phase")],
          [r`e^{inx}`, tx(t, "mFou_wE", "cos nx + i sin nx, a point going n times round the unit circle per period")],
          [r`e^{-inx}`, tx(t, "mFou_wEm", "the conjugate wave; multiplying by it and integrating picks out c_n, as sin mx picked out b_m")],
        ]}
        note={tx(t, "mFou_cxNote", "For n ≥ 1: cₙ = (aₙ − i bₙ)/2 and c₋ₙ = (aₙ + i bₙ)/2, the conjugate, when f is real. And c₀ = a₀/2, the average.")}
        words={tx(t, "mFou_cxWords", "f is a sum of circles turning at every whole-number speed, forwards and backwards; cₙ says how big each circle is and where it starts.")}>
        {r`f(x) = \sum_{n=-\infty}^{\infty} c_n e^{inx}, \qquad c_n = \frac{1}{2\pi}\int_{-\pi}^{\pi} f(x)\,e^{-inx}\,dx`}
      </Equation>

      <H2>{tx(t, "mFou_parTitle", "Energy: Parseval's identity")}</H2>
      <p>
        {tx(t, "mFou_parBody",
          "Square the series and integrate over a period. Every cross term, like a₁ cos x · b₃ sin 3x, integrates to 0 by orthogonality; only the squares survive, each giving π times its coefficient squared. The result is the Pythagorean theorem for functions: the length squared of f is the sum of the squares of its components.")}
      </p>
      <Equation label={tx(t, "mFou_eqParseval", "Parseval's identity")}
        where={[
          [r`\frac1\pi\int_{-\pi}^{\pi} f(x)^2\,dx`, tx(t, "mFou_wEnergy", "the energy of f over one period (in a signal, the power it carries)")],
          [r`a_n^2 + b_n^2`, tx(t, "mFou_wShare", "the share of that energy at frequency n")],
        ]}
        words={tx(t, "mFou_parWords", "The total energy of f is the sum of the energies of its waves.")}>
        {r`\frac{1}{\pi}\int_{-\pi}^{\pi} f(x)^2\,dx = \frac{a_0^2}{2} + \sum_{n=1}^{\infty}\big(a_n^2 + b_n^2\big)`}
      </Equation>
      <Derivation t={t} label={tx(t, "mFou_eqBasel", "A famous sum: Σ 1/n² from f(x) = x")}
        steps={[
          { full: true, tex: r`f(x) = x \text{ on } (-\pi, \pi):\quad b_n = \frac{2}{\pi}\int_0^{\pi} x\sin nx\,dx = \frac{2\,(-1)^{n+1}}{n}`, why: tx(t, "mFou_b1", "f is odd, so only sines; integrate by parts: ∫ x sin nx dx = −x cos(nx)/n + sin(nx)/n²") },
          { full: true, tex: r`\frac{1}{\pi}\int_{-\pi}^{\pi} x^2\,dx = \frac{1}{\pi}\cdot\frac{2\pi^3}{3} = \frac{2\pi^2}{3}`, why: tx(t, "mFou_b2", "the left side of Parseval") },
          { full: true, tex: r`\frac{2\pi^2}{3} = \sum_{n=1}^{\infty} \frac{4}{n^2}`, why: tx(t, "mFou_b3", "the right side: bₙ² = 4/n², the sign disappears when squared") },
          { full: true, tex: r`\sum_{n=1}^{\infty}\frac{1}{n^2} = 1 + \frac14 + \frac19 + \dots = \green{\frac{\pi^2}{6}}`, why: tx(t, "mFou_b4", "divide by 4: the Basel problem, which Euler first solved in 1734") },
        ]} />

      <H2>{tx(t, "mFou_ftTitle", "From series to transform")}</H2>
      <p>
        {tx(t, "mFou_ftBody",
          "A function that never repeats, such as a single click of sound, has no period. Treat it as periodic with an enormous period 2L and let L grow. The frequencies present are ωₙ = nπ/L, spaced π/L apart; as L → ∞ they crowd together until every real frequency ω is present. The sum over n becomes an integral over ω, and the list of coefficients becomes a function F(ω), the Fourier transform.")}
      </p>
      <Derivation t={t} label={tx(t, "mFou_eqFtDer", "Letting the period grow")}
        steps={[
          { full: true, tex: r`c_n = \frac{1}{2L}\int_{-L}^{L} f(x)\,e^{-i\omega_n x}\,dx, \quad \omega_n = \frac{n\pi}{L}`, why: tx(t, "mFou_f1", "the complex coefficient for period 2L") },
          { full: true, tex: r`2L\,c_n \;\longrightarrow\; F(\omega_n) = \int_{-\infty}^{\infty} f(x)\,e^{-i\omega_n x}\,dx`, why: tx(t, "mFou_f2", "as L → ∞ the integration range covers the whole line") },
          { full: true, tex: r`f(x) = \sum_n c_n e^{i\omega_n x} = \frac{1}{2\pi}\sum_n F(\omega_n)\,e^{i\omega_n x}\,\Delta\omega`, why: tx(t, "mFou_f3", "cₙ = F(ωₙ)/(2L) and 1/(2L) = Δω/(2π), where Δω = π/L is the gap between frequencies") },
          { full: true, tex: r`\longrightarrow\ \frac{1}{2\pi}\int_{-\infty}^{\infty} F(\omega)\,e^{i\omega x}\,d\omega`, why: tx(t, "mFou_f4", "a Riemann sum with step Δω → 0 becomes the integral") },
        ]} />
      <Equation label={tx(t, "mFou_eqFt", "The Fourier transform and its inverse")}
        where={[
          [r`\omega`, tx(t, "mFou_wOmega", "any real angular frequency, not just whole numbers")],
          [r`F(\omega)`, tx(t, "mFou_wF", "the amount (and phase) of frequency ω in f: the spectrum")],
          [r`\frac{1}{2\pi}`, tx(t, "mFou_w2pi", "the factor that makes the inverse undo the transform")],
        ]}
        words={tx(t, "mFou_ftWords", "Measure how much of each frequency f contains; adding all those waves back up gives f again.")}>
        {r`F(\omega) = \int_{-\infty}^{\infty} f(x)\,e^{-i\omega x}\,dx, \qquad f(x) = \frac{1}{2\pi}\int_{-\infty}^{\infty} F(\omega)\,e^{i\omega x}\,d\omega`}
      </Equation>
      <Derivation t={t} label={tx(t, "mFou_eqPulse", "The rectangular pulse: 1 for |x| < a, 0 outside")}
        steps={[
          { full: true, tex: r`F(\omega) = \int_{-a}^{a} e^{-i\omega x}\,dx = \Big[\frac{e^{-i\omega x}}{-i\omega}\Big]_{-a}^{a} = \frac{e^{i\omega a} - e^{-i\omega a}}{i\omega}`, why: tx(t, "mFou_p1", "the integral of e^(kx) is e^(kx)/k, here with k = −iω") },
          { full: true, tex: r`= \green{\frac{2\sin(a\omega)}{\omega}}`, why: tx(t, "mFou_p2", "e^(iθ) − e^(−iθ) = 2i sin θ, from Euler's formula") },
        ]} />

      <FourierTransformFigure t={t} />

      <p>
        {tx(t, "mFou_unc",
          "The transform of the pulse is 0 for the first time at ω = π/a. Halve the width of the pulse and that main lobe doubles in width. This trade-off holds for every function: the narrower something is in x, the wider its spectrum. The bell curve e^(−x²/(2a²)) is the extreme case: its transform is again a bell curve, a√(2π) e^(−a²ω²/2), with width 1/a, so the product of the two widths is always 1. In quantum physics the same mathematics becomes Heisenberg's uncertainty principle.")}
      </p>

      <H3>{tx(t, "mFou_derivTitle", "Derivatives become multiplication")}</H3>
      <p>
        {tx(t, "mFou_derivBody",
          "Differentiate e^(iωx) and you get iω e^(iωx): each wave is only multiplied by a number. So the transform of f′ is iω F(ω), and of f″ it is −ω² F(ω). A differential equation for f becomes an algebraic equation for F, which is how Fourier himself, in 1807, solved the equation of heat flow. The next chapters do the same.")}
      </p>
      <Equation label={tx(t, "mFou_eqDeriv", "The transform of a derivative")}
        where={[
          [r`f'`, tx(t, "mFou_wFp", "the derivative of f, which must fade to 0 far away")],
          [r`i\omega`, tx(t, "mFou_wIw", "the derivative of e^(iωx) divided by e^(iωx)")],
        ]}
        note={tx(t, "mFou_derivNote", "Proof: integrate by parts. ∫ f′ e^(−iωx) dx = [f e^(−iωx)] + iω ∫ f e^(−iωx) dx, and the bracket is 0 because f fades at ±∞.")}
        words={tx(t, "mFou_derivWords", "Taking a derivative multiplies each frequency ω by iω.")}>
        {r`\mathcal F[f'](\omega) = i\omega\,F(\omega), \qquad \mathcal F[f''](\omega) = -\omega^2 F(\omega)`}
      </Equation>

      <Callout type="info" t={t}>
        {tx(t, "mFou_uses", "Where it is used: a music app's spectrum display and equaliser split sound into frequencies; JPEG stores an image as amounts of cosine patterns and throws away the high frequencies the eye barely sees; an MRI scanner measures the Fourier transform of a slice of the body and inverts it; computers compute all of this with the fast Fourier transform (FFT), n log n steps instead of n².")}
      </Callout>

      <H2>{tx(t, "mFou_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mFou_ex1", "1. f(x) = 3 + 2 cos 4x − sin x is already a Fourier series: a₀ = 6 (so that a₀/2 = 3), a₄ = 2, b₁ = −1, and every other coefficient is 0.")}</p>
      <p>{tx(t, "mFou_ex2", "2. ∫ from −π to π of sin 2x sin 5x dx = 0 (different frequencies), and ∫ cos² 3x dx = π.")}</p>
      <p>{tx(t, "mFou_ex3", "3. f(x) = |x| on [−π, π] is even, so bₙ = 0. a₀ = (2/π) ∫₀^π x dx = π, and integrating by parts gives aₙ = 2((−1)ⁿ − 1)/(πn²): −4/(πn²) for odd n, 0 for even n. They shrink like 1/n² because |x| has corners but no jump.")}</p>
      <p>{tx(t, "mFou_ex4", "4. Parseval for f(x) = sin x + 2 cos 3x: (1/π) ∫ f² dx = b₁² + a₃² = 1 + 4 = 5.")}</p>

      <MathPracticeFigure t={t} set="fourier" />

      <H2>{tx(t, "mFou_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mFou_tWrong", "Wrong"), tx(t, "mFou_tRight", "Right"), tx(t, "mFou_tWhy", "Why")]}
        rows={[
          [tx(t, "mFou_m1w", "the constant term is a₀"), tx(t, "mFou_m1r", "it is a₀/2"), tx(t, "mFou_m1", "a₀ = (1/π) ∫ f dx is twice the average")],
          [tx(t, "mFou_m2w", "dividing by 2π in aₙ, bₙ"), tx(t, "mFou_m2r", "divide by π (by L for period 2L)"), tx(t, "mFou_m2", "∫ sin² nx dx over the period is π, not 2π")],
          [tx(t, "mFou_m3w", "computing aₙ for an odd function"), tx(t, "mFou_m3r", "they are all 0"), tx(t, "mFou_m3", "odd × even is odd, and its integral over [−π, π] is 0")],
          [tx(t, "mFou_m4w", "the series equals f at a jump"), tx(t, "mFou_m4r", "it gives the midpoint"), tx(t, "mFou_m4", "the square wave's series is 0 at x = 0")],
          [tx(t, "mFou_m5w", "more terms remove the overshoot"), tx(t, "mFou_m5r", "it stays near 9%"), tx(t, "mFou_m5", "the Gibbs bump only gets narrower")],
        ]}
      />

      <KeyIdeas t={t} id="mFou" items={[
        "A 2π-periodic function is a₀/2 + Σ (aₙ cos nx + bₙ sin nx): an average plus waves of whole-number frequencies.",
        "Different waves are orthogonal: ∫ sin mx sin nx dx over a period is 0 for m ≠ n and π for m = n.",
        "So aₙ = (1/π) ∫ f cos nx dx and bₙ = (1/π) ∫ f sin nx dx: each coefficient is a projection of f onto one wave.",
        "Odd functions have only sines, even ones only cosines; jumps give coefficients like 1/n and a 9% overshoot, kinks give 1/n².",
        "Complex form: f = Σ cₙ e^(inx); Parseval: the energy of f is the sum of the squares of its coefficients (Σ 1/n² = π²/6).",
        "As the period grows the series becomes the transform F(ω) = ∫ f e^(−iωx) dx; narrow in x means wide in ω, and derivatives become multiplication by iω.",
      ]} />
    </Article>
  );
}
