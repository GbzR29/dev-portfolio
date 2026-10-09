"use client";

// Calculus 8: Taylor series — matching a function's value and derivatives at a
// point with a polynomial (coefficients f⁽ᵏ⁾(a)/k!); the standard series for
// eˣ, sin, cos, ln(1 + x), 1/(1 − x); infinite series and convergence
// (geometric, harmonic, comparison with integrals, ratio test, radius of
// convergence); the Lagrange error bound and hand computations of sin 0.1 and
// e; Euler's formula from the series; limits, integrals and roots by series.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TaylorFigure } from "@/components/lesson/figures/math/TaylorFigure";

const r = String.raw;
/** 0.0012 → 1.2 × 10⁻³, in TeX. */
const sci = (v: number) => {
  if (v === 0) return "0";
  const [m, e] = v.toExponential(1).split("e");
  return r`${m} \times 10^{${e.replace("+", "").replace("-", "−")}}`;
};
const fact = (k: number) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return p; };

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** sin x by its Taylor polynomial of odd degree n, with the true error and Lagrange's bound (M = 1). */
const sinNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const { x, n } = v;
  let s = 0;
  for (let k = 1; k <= n; k += 2) s += ((k % 4 === 1 ? 1 : -1) * x ** k) / fact(k);
  const err = Math.abs(Math.sin(x) - s), bound = x ** (n + 2) / fact(n + 2);
  return {
    tex: r`\begin{aligned} T_{${n}}(${x.toFixed(2)}) &= ${s.toFixed(8)} \\ \sin ${x.toFixed(2)} &= ${Math.sin(x).toFixed(8)} \\ \text{${tx(t, "mSer_liveErr", "error")}} &= \green{${sci(err)}} \;\le\; \frac{${x.toFixed(2)}^{${n + 2}}}{${n + 2}!} = \amber{${sci(bound)}} \end{aligned}`,
  };
};

/** Partial sums of the harmonic series and of Σ 1/k², up to n = 10ᵏ. */
function harmonicNumbers(v: Record<string, number>) {
  const n = 10 ** v.k;
  let h = 0, q = 0;
  for (let i = 1; i <= n; i++) { h += 1 / i; q += 1 / (i * i); }
  return {
    tex: r`\begin{aligned} \sum_{k=1}^{10^{${v.k}}} \frac1k &= \red{${h.toFixed(4)}} &\quad \ln 10^{${v.k}} &= ${Math.log(n).toFixed(4)} \\ \sum_{k=1}^{10^{${v.k}}} \frac1{k^2} &= \green{${q.toFixed(6)}} &\quad \tfrac{\pi^2}{6} &= 1.644934 \end{aligned}`,
  };
}

export function SeriesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mSer_intro",
          "Polynomials are the friendliest functions there are: to evaluate one you only add and multiply, which can be done by hand to any accuracy. Sine, the exponential and the logarithm are not like that; there is no finite recipe of additions and multiplications that gives sin 0.3 exactly. Taylor series close the gap. They build, for a given function, a polynomial that copies the function's value, slope, bend and every further derivative at one point, and they let the degree grow forever. For the functions of this course the result, an infinite sum, is the function itself.")}
      </Lead>

      <Goals t={t} id="mSer" items={[
        "Build a polynomial that copies a function near a point.",
        "Write the standard series for eˣ, sin x, cos x and others.",
        "Tell when a series converges, and bound the error of a cut-off.",
        "Derive Euler's formula from the series.",
      ]} />

      <H2>{tx(t, "mSer_matchTitle", "Copying a function one derivative at a time")}</H2>
      <p>
        {tx(t, "mSer_matchBody2",
          "Pick a point a, the centre, and look for a polynomial T(x) = c₀ + c₁(x − a) + c₂(x − a)² + … whose value and derivatives at a are those of f. At x = a every power of (x − a) is 0, so each derivative picks out exactly one coefficient.")}
      </p>
      <Derivation t={t} label={tx(t, "mSer_eqMatch", "Matching one derivative at a time")}
        steps={[
          { tex: r`T(a) = c_0 = f(a)`, full: true, why: tx(t, "mSer_c1", "the value: every other term has a factor (x − a), which is 0 at a") },
          { tex: r`T'(a) = c_1 = f'(a)`, full: true, why: tx(t, "mSer_c2", "the slope: the tangent line of the derivatives chapter") },
          { tex: r`T''(a) = 2c_2 = f''(a) \;\Rightarrow\; c_2 = \frac{f''(a)}{2}`, full: true, why: tx(t, "mSer_c3", "the bend: (x − a)² differentiated twice is the constant 2") },
          { tex: r`T^{(k)}(a) = k!\,c_k = f^{(k)}(a) \;\Rightarrow\; c_k = \green{\frac{f^{(k)}(a)}{k!}}`, full: true, why: tx(t, "mSer_c4", "in general (x − a)ᵏ differentiated k times is k · (k − 1) · … · 1 = k! (\"k factorial\"); lower powers are gone, higher ones are still 0 at a") },
        ]} />
      <Equation label={tx(t, "mSer_eqPoly", "The Taylor polynomial of degree n")}
        where={[
          [r`a`, tx(t, "mSer_wA", "the centre: the point where the copy is exact")],
          [r`f^{(k)}(a)`, tx(t, "mSer_wFk", "the k-th derivative of f at a; f⁽⁰⁾ is f itself")],
          [r`k!`, tx(t, "mSer_wFact", "k factorial, 1 · 2 · … · k; by convention 0! = 1, so the first term is f(a)")],
          [r`(x-a)^k`, tx(t, "mSer_wPow", "how far x is from the centre, to the k-th power")],
        ]}
        note={tx(t, "mSer_polyNote", "With a = 0 it is also called a Maclaurin polynomial. Written out: f(a) + f′(a)(x − a) + f″(a)(x − a)²/2 + f‴(a)(x − a)³/6 + …")}
        words={tx(t, "mSer_polyWords", "Add up, for each k from 0 to n, the k-th derivative at the centre, divided by k factorial, times the distance from the centre to the k-th power.")}>
        {r`T_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}\,(x-a)^k`}
      </Equation>

      <TaylorFigure t={t} />

      <H2>{tx(t, "mSer_stdTitle", "The standard series")}</H2>
      <p>
        {tx(t, "mSer_expBody",
          "For eˣ at a = 0 every derivative is eˣ again, and e⁰ = 1, so every coefficient is 1/k!. For sin x the derivatives cycle through sin, cos, −sin, −cos, which at 0 are 0, 1, 0, −1: only odd powers survive, with alternating signs. Cosine is the same with even powers. For 1/(1 − x) the k-th derivative is k!/(1 − x)^(k+1), which is k! at 0, so every coefficient is 1: it is the geometric series 1 + x + x² + … from the sequences chapter. For ln(1 + x) the derivative is 1/(1 + x), the geometric series with −x in place of x; integrating it term by term gives the series of the logarithm.")}
      </p>
      <LessonTable
        headers={[tx(t, "mSer_tFn", "Function"), tx(t, "mSer_tSeries", "Series around 0"), tx(t, "mSer_tValid", "Valid for")]}
        rows={[
          ["eˣ", "1 + x + x²/2! + x³/3! + x⁴/4! + …", tx(t, "mSer_all", "every x")],
          ["sin x", "x − x³/3! + x⁵/5! − x⁷/7! + …", tx(t, "mSer_all2", "every x")],
          ["cos x", "1 − x²/2! + x⁴/4! − x⁶/6! + …", tx(t, "mSer_all3", "every x")],
          ["1/(1 − x)", "1 + x + x² + x³ + …", "−1 < x < 1"],
          ["ln(1 + x)", "x − x²/2 + x³/3 − x⁴/4 + …", "−1 < x ≤ 1"],
          ["(1 + x)ᵖ", "1 + px + p(p − 1)x²/2! + p(p − 1)(p − 2)x³/3! + …", tx(t, "mSer_binom", "−1 < x < 1 (any power p)")],
        ]}
      />
      <p>
        {tx(t, "mSer_symBody",
          "Two checks that the table is right. Sine is odd (sin(−x) = −sin x) and its series has only odd powers; cosine is even and has only even powers. And differentiating the sine series term by term, x − x³/6 + x⁵/120 − …, gives 1 − x²/2 + x⁴/24 − …, the cosine series, as it should.")}
      </p>

      <H2>{tx(t, "mSer_convTitle", "Infinite sums and when they converge")}</H2>
      <p>
        {tx(t, "mSer_convBody",
          "An infinite series a₀ + a₁ + a₂ + … means the limit of its partial sums Sₙ = a₀ + … + aₙ. If the partial sums approach a number S, the series converges and S is its sum; otherwise it diverges. The geometric series 1 + r + r² + … has Sₙ = (1 − rⁿ⁺¹)/(1 − r), which tends to 1/(1 − r) when |r| < 1 and has no limit otherwise. For the terms to add up to something finite they must shrink to 0, but that alone is not enough.")}
      </p>
      <H3>{tx(t, "mSer_harmTitle", "The harmonic series diverges")}</H3>
      <p>
        {tx(t, "mSer_harmBody",
          "1 + 1/2 + 1/3 + 1/4 + … has terms that shrink to 0, yet it grows without bound. Group the terms: 1/3 + 1/4 > 1/4 + 1/4 = 1/2; 1/5 + … + 1/8 > 4 · 1/8 = 1/2; 1/9 + … + 1/16 > 8 · 1/16 = 1/2; and so on. There are infinitely many groups, each worth more than ½. It matches the improper integral ∫₁^∞ dx/x = ∞ from the previous chapter: the sum and the area under 1/x grow together, like ln n. By the same comparison, 1 + 1/2² + 1/3² + … converges, like ∫₁^∞ dx/x²; its sum turns out to be π²/6 ≈ 1.645.")}
      </p>
      <LiveFormula label={tx(t, "mSer_liveHarm", "Try it: two series with shrinking terms")}
        tex={r`\sum_{k=1}^{n} \frac1k \qquad\qquad \sum_{k=1}^{n} \frac1{k^2}`}
        vars={[{ id: "k", label: <>n = 10<sup>k</sup>, k</>, min: 1, max: 6, step: 1, value: 1, fmt: v => String(v) }]}
        compute={harmonicNumbers}
        note={tx(t, "mSer_liveHarmNote", "Each step multiplies the number of terms by 10. The harmonic sum gains about 2.3 every time, keeping 0.577 above ln n: it never stops. The sum of 1/k² gains less and less: after a million terms it agrees with π²/6 to six digits.")} />
      <H3>{tx(t, "mSer_ratioTitle", "The ratio test and the radius of convergence")}</H3>
      <p>
        {tx(t, "mSer_ratioBody",
          "Far out, a series behaves like a geometric one if each term is roughly a fixed multiple L of the one before. So compare consecutive terms: if |aₖ₊₁/aₖ| tends to L < 1 the series converges, if L > 1 it diverges, and L = 1 says nothing (the harmonic series and 1/k² both have L = 1). For eˣ the ratio is |x|/(k + 1), which tends to 0 for every x: the series converges everywhere. For 1/(1 − x) the ratio is |x|, so it converges only for |x| < 1. The largest such distance from the centre is the radius of convergence. It reaches exactly to the nearest point where the function breaks down: 1/(1 − x) blows up at x = 1, so from a = 0 the radius is 1. The figure's shaded band shows this.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mSer_outWarn", "Outside the radius of convergence, adding more terms makes things worse, not better. 1 + 2 + 4 + 8 + … is not 1/(1 − 2) = −1. The formula and the series agree only where the series converges.")}
      </Callout>

      <H2>{tx(t, "mSer_errTitle", "How big is the error?")}</H2>
      <p>
        {tx(t, "mSer_errBody",
          "Stopping at degree n leaves a remainder Rₙ(x) = f(x) − Tₙ(x). Lagrange's form of it looks exactly like the next term of the series, except that the derivative is taken at some unknown point ξ (the Greek letter xi) between a and x. We never know ξ, but we usually know a bound M for the size of that derivative on the interval, and that bounds the error. It is the mean value theorem from the \"Using derivatives\" chapter, extended to higher derivatives: for n = 0 it says f(x) − f(a) = f′(ξ)(x − a).")}
      </p>
      <Equation label={tx(t, "mSer_eqRem", "Lagrange's remainder")}
        where={[
          [r`\xi`, tx(t, "mSer_wXi", "some point between a and x (its exact position is unknown)")],
          [r`M`, tx(t, "mSer_wM", "any upper bound for |f⁽ⁿ⁺¹⁾| between a and x")],
          [r`|x-a|^{n+1}`, tx(t, "mSer_wDist", "close to the centre this is tiny, and it shrinks fast as n grows")],
        ]}
        words={tx(t, "mSer_remWords", "The error looks like the next term of the series, with the derivative taken somewhere in between; bound that derivative and you bound the error.")}>
        {r`R_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\,(x-a)^{n+1} \qquad |R_n(x)| \le \frac{M\,|x-a|^{n+1}}{(n+1)!}`}
      </Equation>
      <LiveFormula label={tx(t, "mSer_liveSin", "Try it: sin x from its series, with the error bound")}
        tex={r`\sin x \approx x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots \pm \frac{x^n}{n!} \qquad |R| \le \frac{|x|^{n+2}}{(n+2)!}`}
        vars={[
          { id: "x", label: "x", min: 0.1, max: 3, step: 0.05, value: 0.1, fmt: v => v.toFixed(2) },
          { id: "n", label: tx(t, "mSer_liveN", "degree n (odd)"), min: 1, max: 9, step: 2, value: 3, fmt: v => String(v) },
        ]}
        compute={sinNumbers(t)}
        note={tx(t, "mSer_liveSinNote", "Starts on the hand computation below: x = 0.1 with two terms, error 8.3 × 10⁻⁸ against a bound of 8.3 × 10⁻⁸. The degree-n polynomial equals the degree-(n + 1) one, so the bound uses the power n + 2. Take x = 3: degree 3 is off by 1.6, degree 9 by 0.004. The bound always stays above the true error.")} />
      <H3>{tx(t, "mSer_sinTitle", "sin 0.1 by hand")}</H3>
      <p>
        {tx(t, "mSer_sinBody",
          "Take two terms: sin 0.1 ≈ 0.1 − 0.1³/6 = 0.1 − 0.001/6 = 0.1 − 0.000166 67 = 0.099 833 33. Every derivative of sine is at most 1 in size, so M = 1, and the next term missing is the x⁵ one (the x⁴ coefficient is 0, so T₃ = T₄ and we may use n = 4): the error is at most 0.1⁵/5! = 0.000 01/120 ≈ 8.3 · 10⁻⁸. The true value is 0.099 833 42, and the difference, 8.3 · 10⁻⁸, is right at the bound.")}
      </p>
      <H3>{tx(t, "mSer_eTitle", "The number e by hand")}</H3>
      <LessonTable
        headers={["n", tx(t, "mSer_tTerm", "term 1/n!"), tx(t, "mSer_tSum", "partial sum")]}
        rows={[
          ["0", "1", "1"],
          ["1", "1", "2"],
          ["2", "0.5", "2.5"],
          ["3", "0.166 667", "2.666 667"],
          ["4", "0.041 667", "2.708 333"],
          ["5", "0.008 333", "2.716 667"],
          ["6", "0.001 389", "2.718 056"],
          ["7", "0.000 198", "2.718 254"],
        ]}
      />
      <p>
        {tx(t, "mSer_eBody",
          "Each term is the previous one divided by n, so the table costs one division per row. On [0, 1] the derivative eˣ is at most e < 3, so after n = 7 the error is below 3/8! = 3/40 320 ≈ 0.000 074. The true value is e = 2.718 281 8…, and 2.718 254 is indeed within that.")}
      </p>

      <H2>{tx(t, "mSer_eulerTitle", "Euler's formula, from the series")}</H2>
      <p>
        {tx(t, "mSer_eulerBody",
          "The complex numbers chapter found e^(iθ) = cos θ + i sin θ by a limit of small turns. The series gives a second proof in a few lines. Put x = iθ into the series of eˣ. The powers of i repeat in a cycle of four: i, i² = −1, i³ = −i, i⁴ = 1. So the terms alternate between real and imaginary, with signs that alternate within each group. Collect them: the real terms are 1 − θ²/2! + θ⁴/4! − …, the cosine series, and the imaginary terms are i(θ − θ³/3! + θ⁵/5! − …), i times the sine series.")}
      </p>
      <Equation label={tx(t, "mSer_eqEuler", "Euler's formula by series")}
        where={[
          [r`(i\theta)^2 = -\theta^2`, tx(t, "mSer_wI2", "i² = −1 makes every other real term negative")],
          [r`(i\theta)^3 = -i\theta^3`, tx(t, "mSer_wI3", "i³ = −i does the same to the imaginary terms")],
        ]}
        words={tx(t, "mSer_eulerWords", "Feed iθ into the series of the exponential: the real terms that come out are the cosine series, and the imaginary ones are i times the sine series.")}>
        {r`e^{i\theta} = 1 + i\theta - \frac{\theta^2}{2!} - i\frac{\theta^3}{3!} + \frac{\theta^4}{4!} + \dots = \underbrace{\Big(1 - \frac{\theta^2}{2!} + \dots\Big)}_{\cos\theta} + i\underbrace{\Big(\theta - \frac{\theta^3}{3!} + \dots\Big)}_{\sin\theta}`}
      </Equation>

      <H2>{tx(t, "mSer_useTitle", "What series are good for")}</H2>
      <p>
        {tx(t, "mSer_limBody",
          "Limits. The limits chapter needed a squeeze argument for sin x / x → 1. With the series it is immediate: sin x / x = 1 − x²/6 + x⁴/120 − …, and every term after the 1 vanishes as x → 0. Likewise (1 − cos x)/x² = 1/2 − x²/24 + … → ½. Series also show how fast a limit is approached, which a table of values only suggests.")}
      </p>
      <p>
        {tx(t, "mSer_intBody",
          "Integrals with no formula. The bell curve e^(−x²) has no elementary antiderivative, but its series does. Replace x by −x² in the series of eˣ: e^(−x²) = 1 − x² + x⁴/2 − x⁶/6 + x⁸/24 − …. Integrate term by term from 0 to 1: 1 − 1/3 + 1/10 − 1/42 + 1/216 − 1/1320 + … ≈ 1 − 0.333 33 + 0.1 − 0.023 81 + 0.004 63 − 0.000 76 = 0.746 73. For a series with alternating, shrinking terms, the error is smaller than the first term left out (here 1/9360 ≈ 0.0001); the exact value is 0.746 82.")}
      </p>
      <p>
        {tx(t, "mSer_rootBody",
          "Quick approximations. The binomial series with p = ½ gives √(1 + x) ≈ 1 + x/2 − x²/8 for small x. So √1.1 ≈ 1 + 0.05 − 0.001 25 = 1.048 75 (true: 1.048 81), and √50 = √49 · √(1 + 1/49) ≈ 7 (1 + 1/98) ≈ 7.0714 (true: 7.0711).")}
      </p>

      <H2>{tx(t, "mSer_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mSer_ex1", "1. Degree-2 Taylor polynomial of √x around a = 4: f(4) = 2, f′(x) = 1/(2√x) gives ¼, f″(x) = −1/(4x^(3/2)) gives −1/32. T₂(x) = 2 + (x − 4)/4 − (x − 4)²/64. At x = 4.2: 2 + 0.05 − 0.000 625 = 2.049 375 (true √4.2 = 2.049 390).")}</p>
      <p>{tx(t, "mSer_ex2", "2. cos 0.2 ≈ 1 − 0.04/2 + 0.0016/24 = 1 − 0.02 + 0.000 067 = 0.980 067 (true 0.980 067).")}</p>
      <p>{tx(t, "mSer_ex3", "3. Series of x eˣ: multiply the series of eˣ by x: x + x² + x³/2! + x⁴/3! + ….")}</p>
      <p>{tx(t, "mSer_ex4", "4. ln 2 from ln(1 + x) at x = 1: 1 − 1/2 + 1/3 − 1/4 + … converges, but slowly (after 1000 terms the error is still about 0.0005). A better route: ln 2 = −ln(1 − ½) = ½ + 1/8 + 1/24 + 1/64 + 1/160 + … ≈ 0.6885 after five terms (true 0.6931).")}</p>
      <p>{tx(t, "mSer_ex5", "5. Does Σ 2ᵏ/k! converge? The ratio is 2/(k + 1) → 0, so it converges, and it is the series of eˣ at x = 2: the sum is e² ≈ 7.389.")}</p>
      <p>{tx(t, "mSer_ex6", "6. lim (eˣ − 1 − x)/x² as x → 0: the numerator is x²/2 + x³/6 + …, so the ratio is ½ + x/6 + … → ½.")}</p>

      <H2>{tx(t, "mSer_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mSer_tWrong", "Wrong"), tx(t, "mSer_tRight", "Right"), tx(t, "mSer_tWhy", "Why")]}
        rows={[
          [tx(t, "mSer_m1w", "coefficient f⁽ᵏ⁾(a)"), "f⁽ᵏ⁾(a)/k!", tx(t, "mSer_m1", "differentiating (x − a)ᵏ k times leaves the factor k!")],
          [tx(t, "mSer_m2w", "powers of x in a series centred at a ≠ 0"), tx(t, "mSer_m2r", "powers of (x − a)"), tx(t, "mSer_m2", "the polynomial must be exact at x = a")],
          [tx(t, "mSer_m3w", "terms → 0, so the series converges"), tx(t, "mSer_m3r", "necessary, not sufficient"), tx(t, "mSer_m3", "the harmonic series is the counterexample")],
          [tx(t, "mSer_m4w", "1 + 2 + 4 + … = −1"), tx(t, "mSer_m4r", "diverges"), tx(t, "mSer_m4", "1/(1 − x) equals the series only for |x| < 1")],
          [tx(t, "mSer_m5w", "sin 30 ≈ 30 − 30³/6"), "sin(π/6) ≈ 0.5236 − 0.0239", tx(t, "mSer_m5", "the series is for radians; far from 0 it also needs many terms")],
          [tx(t, "mSer_m6w", "forgetting 0! = 1 and 1! = 1"), "T₀ = f(a), T₁ = f(a) + f′(a)(x − a)", tx(t, "mSer_m6", "the first two terms are the value and the tangent line")],
        ]}
      />

      <KeyIdeas t={t} id="mSer" items={[
        "The Taylor polynomial copies f and its first n derivatives at a: coefficients f⁽ᵏ⁾(a)/k!.",
        "eˣ = Σ xᵏ/k!, sin and cos keep the odd and even terms with alternating signs; all converge everywhere.",
        "1/(1 − x) = 1 + x + x² + … only for |x| < 1: the radius reaches to where the function breaks.",
        "Terms shrinking to 0 is not enough: the harmonic series diverges, Σ 1/k² converges.",
        "The ratio test compares a series with a geometric one: limit of |aₖ₊₁/aₖ| below 1 means convergence.",
        "Lagrange's bound M|x − a|ⁿ⁺¹/(n + 1)! tells you how many terms you need.",
        "Substituting iθ into eˣ proves Euler's formula; series also give limits, integrals and roots.",
      ]} />
    </Article>
  );
}
