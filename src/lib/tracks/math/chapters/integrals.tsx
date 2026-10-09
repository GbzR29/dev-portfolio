"use client";

// Calculus 5: the integral as area — distance from a changing speed; Riemann
// sums (left, right, midpoint) and Σ notation; the definite integral as their
// limit; the exact area under x² via the sum of squares (and the ⅓ in the cone
// formula); signed area and the properties of integrals; trapezoid and
// Simpson's rules and their error orders; average value; distance from a
// table of speedometer readings.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { RiemannFigure } from "@/components/lesson/figures/math/RiemannFigure";

const r = String.raw;

// ── Live formulas: the numbers plugged in ─────────────────────────────────────

/** The right sum for x² on [0, 2] with n strips, from the sum-of-squares formula. */
function squaresNumbers(v: Record<string, number>) {
  const n = v.n, s = ((8 / 6) * (n + 1) * (2 * n + 1)) / (n * n);
  return {
    tex: r`S_{${n}} = \frac{2^3}{6} \cdot \frac{(${n} + 1)(2 \cdot ${n} + 1)}{${n}^2} = \frac{8}{6} \cdot \frac{${(n + 1) * (2 * n + 1)}}{${n * n}} = \amber{${s.toFixed(5)}} \qquad \frac{8}{3} = \green{2.66667}`,
    meter: 8 / 3 / s,
    meterLabel: `8/3 ÷ S = ${(8 / 3 / s).toFixed(4)}`,
  };
}

export function IntegralsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mInt_intro",
          "The derivative takes something apart into rates. The integral puts it back together: it adds up a quantity that keeps changing, by cutting it into pieces so thin that each one is almost constant. Distance from a changing speed, area under a curve, volume of a shape, total rain from a storm that slowly eases off: all are integrals. This chapter defines the integral as a limit of sums and computes one exactly; the next shows the shortcut that connects integrals to derivatives.")}
      </Lead>

      <Goals t={t} id="mInt" items={[
        "Get the distance travelled from the speed by adding up strips.",
        "Approximate an area with a Riemann sum, and improve it with trapezoids and Simpson's rule.",
        "Read the definite integral as signed area, and use its rules.",
        "Find a function's average value.",
      ]} />

      <H2>{tx(t, "mInt_distTitle", "Distance from speed")}</H2>
      <p>
        {tx(t, "mInt_distBody",
          "Drive at a constant 60 km/h for 2 hours and you cover 120 km. On a graph of speed against time that is a rectangle, 60 high and 2 wide: distance is the area under the speed graph. When the speed changes, the region under the graph is no longer a rectangle, but you can cut the time into short intervals, pretend the speed is constant within each (a thin rectangle), and add up the areas. Shorter intervals make the pretence more accurate. Here is a car whose speedometer is read once a second, speeding up from rest.")}
      </p>
      <LessonTable
        headers={[tx(t, "mInt_tTime", "second"), "0–1", "1–2", "2–3", "3–4", tx(t, "mInt_tTotal", "total")]}
        rows={[
          [tx(t, "mInt_tLeft", "speed at the start of the second (m/s)"), "0", "2", "4", "6", "12 m"],
          [tx(t, "mInt_tRight", "speed at the end of the second (m/s)"), "2", "4", "6", "8", "20 m"],
        ]}
      />
      <p>
        {tx(t, "mInt_distBody2",
          "Using the speed at the start of each second underestimates (the car was speeding up during it); using the speed at the end overestimates. The true distance lies between 12 and 20 m. For this car the speed is v(t) = 2t, a straight line, and the region under it from 0 to 4 is a triangle of area ½ · 4 · 8 = 16 m, the average of the two estimates. For curved graphs there is no triangle to fall back on, and we need the limit.")}
      </p>

      <H2>{tx(t, "mInt_riemannTitle", "Riemann sums")}</H2>
      <p>
        {tx(t, "mInt_riemannBody",
          "To approximate the area under f from x = a to x = b: split [a, b] into n strips of equal width Δx = (b − a)/n. In each strip pick a sample point and use f there as the strip's height. Adding height × width over all strips gives a Riemann sum (after Bernhard Riemann, who made the idea rigorous in 1854). Choosing the left edge of every strip gives the left sum, the right edge the right sum, the centre the midpoint sum. The Σ notation from the sequences chapter writes the loop compactly.")}
      </p>
      <Equation label={tx(t, "mInt_eqRiemann", "A Riemann sum with n strips")}
        where={[
          [r`\Delta x = \tfrac{b - a}{n}`, tx(t, "mInt_wDx", "the width of each strip")],
          [r`x_k^*`, tx(t, "mInt_wXk", "the sample point in strip k: its left end a + (k − 1)Δx, its right end a + kΔx, or its middle")],
          [r`f(x_k^*)\,\Delta x`, tx(t, "mInt_wArea", "the area of strip k: height times width")],
          [r`\sum_{k=1}^{n}`, tx(t, "mInt_wSum", "add the n strip areas")],
        ]}
        words={tx(t, "mInt_riemannWords", "Cut the interval into n equal strips; in each, multiply a height read from the curve by the strip's width; add them all up.")}>
        {r`S_n = \sum_{k=1}^{n} f(x_k^*)\,\Delta x`}
      </Equation>

      <RiemannFigure t={t} />

      <H2>{tx(t, "mInt_defTitle", "The definite integral")}</H2>
      <p>
        {tx(t, "mInt_defBody",
          "As n → ∞ the strips become infinitely thin, and for any continuous function all the choices of sample point give sums that approach the same number. That limit is the definite integral of f from a to b. Leibniz's notation reads like the sum it came from: the long ∫ is a stretched S for \"sum\", f(x) is the height, dx is the width of an infinitely thin strip, and a and b, the limits of integration, mark where the adding starts and stops.")}
      </p>
      <Equation label={tx(t, "mInt_eqDef", "The definite integral")}
        where={[
          [r`\int_a^b`, tx(t, "mInt_wInt", "sum up from x = a (lower limit) to x = b (upper limit)")],
          [r`f(x)`, tx(t, "mInt_wF", "the integrand: the height of the strip at x")],
          [r`dx`, tx(t, "mInt_wDxInt", "the width of an infinitely thin strip; it also names the variable that runs from a to b")],
        ]}
        note={tx(t, "mInt_defNote", "The letter used for the variable does not matter: ∫ f(x) dx and ∫ f(t) dt from a to b are the same number. Such a variable is called a dummy variable, like the loop counter k in a sum.")}
        words={tx(t, "mInt_defWords", "The integral from a to b is the number the strip sums settle on as the strips become infinitely many and infinitely thin.")}>
        {r`\int_a^b f(x)\,dx = \lim_{n \to \infty} \sum_{k=1}^{n} f(x_k^*)\,\Delta x`}
      </Equation>

      <H2>{tx(t, "mInt_exactTitle", "An exact area: under x²")}</H2>
      <p>
        {tx(t, "mInt_exactBody2",
          "Take f(x) = x² from 0 to b with n strips and right endpoints. Then Δx = b/n, the k-th right endpoint is kb/n, and the sum is Σ (kb/n)² · (b/n) = (b³/n³) · (1² + 2² + … + n²). We need a formula for the sum of the first n squares, and a telescoping trick finds it.")}
      </p>
      <Derivation t={t} label={tx(t, "mInt_eqSquares", "The sum of the first n squares, by telescoping")}
        steps={[
          { tex: r`(k + 1)^3 - k^3 = 3k^2 + 3k + 1`, full: true, why: tx(t, "mInt_s1", "expand (k + 1)³ = k³ + 3k² + 3k + 1 and subtract k³") },
          { tex: r`\sum_{k=1}^{n} \big[(k + 1)^3 - k^3\big] = (n + 1)^3 - 1`, full: true, why: tx(t, "mInt_s2", "add the left side for k = 1 to n: (2³ − 1³) + (3³ − 2³) + … every middle cube cancels, leaving only the last and the first") },
          { tex: r`(n + 1)^3 - 1 = 3\sum_{k=1}^{n} k^2 + 3 \cdot \frac{n(n + 1)}{2} + n`, full: true, why: tx(t, "mInt_s3", "add the right side for k = 1 to n too: 3 times the sum of squares, 3 times Gauss's sum, and n ones") },
          { tex: r`\sum_{k=1}^{n} k^2 = \green{\frac{n(n + 1)(2n + 1)}{6}}`, full: true, why: tx(t, "mInt_s4", "solve for the sum of squares and factor. Check: n = 2 gives 1 + 4 = 5 and 2 · 3 · 5 / 6 = 5 ✓") },
        ]} />
      <Equation label={tx(t, "mInt_eqSq", "The area under x² from 0 to b")}
        where={[
          [r`\sum_{k=1}^n k^2 = \tfrac{n(n+1)(2n+1)}{6}`, tx(t, "mInt_wSq", "the sum of the first n squares")],
          [r`\tfrac{(n+1)(2n+1)}{n^2}`, tx(t, "mInt_wRatio", "equals (1 + 1/n)(2 + 1/n), which tends to 2 as n → ∞")],
        ]}
        note={tx(t, "mInt_sqNote", "So the area under x² from 0 to 2 is 8/3 ≈ 2.667, the value the figure's sums close in on. Notice the ⅓.")}>
        {r`\int_0^b x^2\,dx = \lim_{n\to\infty} \frac{b^3}{n^3}\cdot\frac{n(n+1)(2n+1)}{6} = \lim_{n\to\infty} \frac{b^3}{6}\cdot\frac{(n+1)(2n+1)}{n^2} = \frac{b^3}{3}`}
      </Equation>
      <LiveFormula label={tx(t, "mInt_liveSq", "Try it: the right sum for x² on [0, 2]")}
        tex={r`S_n = \frac{b^3}{6} \cdot \frac{(n + 1)(2n + 1)}{n^2} \;\xrightarrow{\;n \to \infty\;}\; \frac{b^3}{3}`}
        vars={[{ id: "n", label: tx(t, "mInt_liveN", "strips n"), min: 1, max: 100, step: 1, value: 2, fmt: v => String(v) }]}
        compute={squaresNumbers}
        note={tx(t, "mInt_liveSqNote", "n = 2 gives 5, the two right-edge strips 1 · 1 + 1 · 4. The right sum is always too big for a rising curve, so the bar (8/3 divided by the sum) creeps up to 1 from below: 0.94 at n = 25, 0.985 at n = 100.")} />
      <Callout type="tip" t={t}>
        {tx(t, "mInt_coneTip", "This ⅓ is the same one as in the cone and pyramid volumes of the geometry section. Slice a cone of height h and base radius R into thin discs: at distance x from the tip the radius is Rx/h, so the disc's area is πR²x²/h². Adding the discs is ∫₀ʰ πR²x²/h² dx = (πR²/h²) · h³/3 = ⅓πR²h. The integral turns Cavalieri's slicing argument into a calculation.")}
      </Callout>

      <H2>{tx(t, "mInt_signTitle", "Signed area and the rules")}</H2>
      <p>
        {tx(t, "mInt_signBody",
          "Where f is negative, f(x)·Δx is negative, so strips below the axis subtract. The integral is a signed area: area above the axis minus area below. For a velocity that goes negative (moving backwards), the integral gives the displacement, how far from the start you end up, not the total distance travelled; for that you integrate the speed |v|. The figure's x³ − x example has a negative part that cancels most of the positive one. The following rules all follow from the sums.")}
      </p>
      <Equation label={tx(t, "mInt_eqProps", "Properties of the definite integral")}
        where={[
          [r`c`, tx(t, "mInt_wConst", "a constant: scaling every strip scales the sum")],
          [r`\int_a^b + \int_b^c`, tx(t, "mInt_wSplit", "two adjacent pieces add up to the whole")],
          [r`\int_b^a = -\int_a^b`, tx(t, "mInt_wRev", "running backwards makes every Δx negative")],
          [r`\int_a^a = 0`, tx(t, "mInt_wZero", "no width, no area")],
        ]}
        note={tx(t, "mInt_oddNote", "Symmetry saves work: an odd function (f(−x) = −f(x), like x³ or sin x) has as much area below the axis as above on [−a, a], so its integral there is 0.")}
        words={tx(t, "mInt_propsWords", "Constants and sums can be taken out of an integral; two neighbouring pieces add up to the whole; running from b back to a flips the sign.")}>
        {r`\int_a^b (c f + g)\,dx = c\!\int_a^b f\,dx + \int_a^b g\,dx \qquad \int_a^b f\,dx + \int_b^c f\,dx = \int_a^c f\,dx \qquad \int_b^a f\,dx = -\!\int_a^b f\,dx`}
      </Equation>

      <H2>{tx(t, "mInt_numTitle", "Better sums: trapezoids and Simpson")}</H2>
      <p>
        {tx(t, "mInt_numBody",
          "The left and right sums have an error proportional to Δx: double the strips, halve the error. Two cheap improvements do much better. The midpoint rule samples the centre of each strip, where overestimate and underestimate roughly cancel. The trapezoid rule joins the two edge heights with a slanted top, which is the same as averaging the left and right sums. Both have errors proportional to Δx²: double the strips, quarter the error. Simpson's rule goes further by fitting a parabola through each pair of strips; with weights 1, 4, 2, 4, …, 4, 1 its error shrinks like Δx⁴, and it is exact for every polynomial up to degree 3.")}
      </p>
      <LessonTable
        headers={[tx(t, "mInt_tRule", "Rule"), tx(t, "mInt_tFormula", "Estimate"), tx(t, "mInt_tError", "Error shrinks like")]}
        rows={[
          [tx(t, "mInt_r1", "left / right"), "Δx · Σ f(edge)", "Δx"],
          [tx(t, "mInt_r2", "midpoint"), "Δx · Σ f(centre)", "Δx²"],
          [tx(t, "mInt_r3", "trapezoid"), "Δx · (f₀/2 + f₁ + … + fₙ₋₁ + fₙ/2)", "Δx²"],
          [tx(t, "mInt_r4", "Simpson (n even)"), "Δx/3 · (f₀ + 4f₁ + 2f₂ + 4f₃ + … + 4fₙ₋₁ + fₙ)", "Δx⁴"],
        ]}
      />
      <p>
        {tx(t, "mInt_simpsonHand",
          "Simpson by hand on ∫₀² x² dx with n = 2 strips: Δx = 1 and the heights are f(0) = 0, f(1) = 1, f(2) = 4. The estimate is (1/3)(0 + 4 · 1 + 4) = 8/3, exactly the true value found above with the sum of squares. It has to be: x² is a parabola, and Simpson's rule fits parabolas.")}
      </p>

      <H2>{tx(t, "mInt_avgTitle", "Average value")}</H2>
      <p>
        {tx(t, "mInt_avgBody",
          "The average of n numbers is their sum divided by n. The average of a function over [a, b] is its integral divided by the width b − a: the height of the rectangle with the same base and the same area. The average of x² over [0, 2] is (8/3)/2 = 4/3. For a sine wave over half a period, [0, π], the area is 2 (the next chapter shows why), so the average is 2/π ≈ 0.637: why a rectified AC voltage delivers about 64% of its peak.")}
      </p>
      <Equation label={tx(t, "mInt_eqAvg", "The average value of f on [a, b]")}
        where={[
          [r`b - a`, tx(t, "mInt_wWidth", "the width of the interval")],
          [r`\bar{f}`, tx(t, "mInt_wBar", "the average height: a rectangle this tall has the same area as the region under f")],
        ]}
        words={tx(t, "mInt_avgWords", "The total area divided by the width: the height of the flat rectangle that holds the same area.")}>
        {r`\bar{f} = \frac{1}{b - a}\int_a^b f(x)\,dx`}
      </Equation>

      <H2>{tx(t, "mInt_gameTitle", "Distance from speedometer readings")}</H2>
      <p>
        {tx(t, "mInt_gameBody",
          "Often the rate is known only from readings, and a Riemann sum is then the only way to the total. A car's speedometer is read every 10 seconds as it pulls away. Each reading, times 10 s, is one strip; the rules differ only in which heights they use.")}
      </p>
      <LessonTable
        headers={["t (s)", "0", "10", "20", "30", "40"]}
        rows={[[tx(t, "mInt_tSpeed", "speed (m/s)"), "0", "10", "16", "20", "22"]]}
      />
      <LessonTable
        headers={[tx(t, "mInt_tRule", "Rule"), tx(t, "mInt_tWorking", "Working"), tx(t, "mInt_tDist", "Distance")]}
        rows={[
          [tx(t, "mInt_r1l", "left sum"), "10 · (0 + 10 + 16 + 20)", "460 m"],
          [tx(t, "mInt_r1r", "right sum"), "10 · (10 + 16 + 20 + 22)", "680 m"],
          [tx(t, "mInt_r3", "trapezoid"), "10 · (0/2 + 10 + 16 + 20 + 22/2)", "570 m"],
          [tx(t, "mInt_r4", "Simpson (n even)"), "(10/3) · (0 + 4 · 10 + 2 · 16 + 4 · 20 + 22)", "580 m"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mInt_fpsWarn", "While the speed keeps rising, the left sum uses the lowest speed of each strip and the right sum the highest, so the true distance is trapped between them, here between 460 m and 680 m: a guarantee, not just an estimate. The trapezoid and Simpson values, 570 m and 580 m, are the realistic guesses.")}
      </Callout>

      <H2>{tx(t, "mInt_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mInt_ex1", "1. ∫₀³ 2 dx: a rectangle 3 wide and 2 tall, area 6.")}</p>
      <p>{tx(t, "mInt_ex2", "2. ∫₀⁴ 2t dt: a triangle with base 4 and height 8, area 16 (the car above).")}</p>
      <p>{tx(t, "mInt_ex3", "3. ∫₁³ x² dx = ∫₀³ x² dx − ∫₀¹ x² dx = 27/3 − 1/3 = 26/3, using the split rule and the formula b³/3.")}</p>
      <p>{tx(t, "mInt_ex4", "4. ∫₋₂² x³ dx = 0: x³ is odd, so the negative half cancels the positive half.")}</p>
      <H3>{tx(t, "mInt_ex5Title", "A numeric example")}</H3>
      <p>{tx(t, "mInt_ex5", "5. ∫₀^π sin x dx with n = 4 (Δx = π/4 ≈ 0.785). Midpoint: 0.785 · (sin(π/8) + sin(3π/8) + sin(5π/8) + sin(7π/8)) = 0.785 · 2.613 = 2.052. Trapezoid: 0.785 · (0 + 0.707 + 1 + 0.707 + 0) = 1.896. Simpson: (0.785/3) · (0 + 4 · 0.707 + 2 · 1 + 4 · 0.707 + 0) = 2.005. The exact value is 2.")}</p>

      <H2>{tx(t, "mInt_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mInt_tWrong", "Wrong"), tx(t, "mInt_tRightM", "Right"), tx(t, "mInt_tWhy", "Why")]}
        rows={[
          [tx(t, "mInt_m1w", "the integral is always the geometric area"), tx(t, "mInt_m1r", "it is signed area"), tx(t, "mInt_m1", "parts below the axis subtract")],
          [tx(t, "mInt_m2w", "displacement = distance travelled"), tx(t, "mInt_m2r", "distance is ∫|v| dt"), tx(t, "mInt_m2", "moving back cancels moving forward in ∫v")],
          [tx(t, "mInt_m3w", "dropping the dx"), tx(t, "mInt_m3r", "keep it"), tx(t, "mInt_m3", "it names the variable and is the strip width; substitution needs it")],
          [tx(t, "mInt_m4w", "Simpson with an odd n"), tx(t, "mInt_m4r", "n must be even"), tx(t, "mInt_m4", "it fits one parabola per pair of strips")],
          [tx(t, "mInt_m5w", "more strips always rescue a crude rule"), tx(t, "mInt_m5r", "use a better rule"), tx(t, "mInt_m5", "doubling the strips halves a left sum's error but cuts Simpson's 16-fold")],
        ]}
      />

      <KeyIdeas t={t} id="mInt" items={[
        "Area under a rate is the total change: distance is the area under speed.",
        "A Riemann sum adds n strips of width Δx = (b − a)/n and height f at a sample point.",
        "∫ₐᵇ f(x) dx is the limit of Riemann sums as n → ∞: a signed area.",
        "∫₀ᵇ x² dx = b³/3, from the sum of squares; the same ⅓ as in the cone.",
        "Integrals are linear, split at any point, and change sign when reversed.",
        "Left/right: error ~ Δx; midpoint/trapezoid ~ Δx²; Simpson ~ Δx⁴.",
        "From readings, a total is a sum of rate × width strips; left and right sums bracket a rising rate.",
      ]} />
    </Article>
  );
}
