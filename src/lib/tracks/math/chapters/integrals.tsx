"use client";

// Calculus 5: the integral as area — distance from a changing speed; Riemann
// sums (left, right, midpoint) and Σ notation; the definite integral as their
// limit; the exact area under x² via the sum of squares (and the ⅓ in the cone
// formula); signed area and the properties of integrals; trapezoid and
// Simpson's rules and their error orders; average value; Euler integration
// in games as a Riemann sum; C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RiemannFigure } from "@/components/lesson/figures/math/RiemannFigure";

const r = String.raw;

export function IntegralsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mInt_intro",
          "The derivative takes something apart into rates. The integral puts it back together: it adds up a quantity that keeps changing, by cutting it into pieces so thin that each one is almost constant. Distance from a changing speed, area under a curve, volume of a shape, total damage from a poison that wears off: all are integrals. This chapter defines the integral as a limit of sums and computes one exactly; the next shows the shortcut that connects integrals to derivatives.")}
      </Lead>

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
        ]}>
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
        note={tx(t, "mInt_defNote", "The letter used for the variable does not matter: ∫ f(x) dx and ∫ f(t) dt from a to b are the same number. Such a variable is called a dummy variable, like the loop counter k in a sum.")}>
        {r`\int_a^b f(x)\,dx = \lim_{n \to \infty} \sum_{k=1}^{n} f(x_k^*)\,\Delta x`}
      </Equation>

      <H2>{tx(t, "mInt_exactTitle", "An exact area: under x²")}</H2>
      <p>
        {tx(t, "mInt_exactBody",
          "Take f(x) = x² from 0 to b with n strips and right endpoints. Then Δx = b/n, the k-th right endpoint is kb/n, and the sum is Σ (kb/n)² · (b/n) = (b³/n³) · (1² + 2² + … + n²). We need a formula for the sum of the first n squares, and a telescoping trick finds it. Expand (k + 1)³ − k³ = 3k² + 3k + 1. Add this up for k = 1 to n: on the left almost everything cancels ((2³ − 1³) + (3³ − 2³) + … leaves (n + 1)³ − 1); on the right you get 3 times the sum of squares, plus 3 · n(n + 1)/2 (Gauss's sum), plus n. Solving for the sum of squares gives n(n + 1)(2n + 1)/6. Check: n = 2 gives 1 + 4 = 5 and 2 · 3 · 5/6 = 5 ✓.")}
      </p>
      <Equation label={tx(t, "mInt_eqSq", "The area under x² from 0 to b")}
        where={[
          [r`\sum_{k=1}^n k^2 = \tfrac{n(n+1)(2n+1)}{6}`, tx(t, "mInt_wSq", "the sum of the first n squares")],
          [r`\tfrac{(n+1)(2n+1)}{n^2}`, tx(t, "mInt_wRatio", "equals (1 + 1/n)(2 + 1/n), which tends to 2 as n → ∞")],
        ]}
        note={tx(t, "mInt_sqNote", "So the area under x² from 0 to 2 is 8/3 ≈ 2.667, the value the figure's sums close in on. Notice the ⅓.")}>
        {r`\int_0^b x^2\,dx = \lim_{n\to\infty} \frac{b^3}{n^3}\cdot\frac{n(n+1)(2n+1)}{6} = \lim_{n\to\infty} \frac{b^3}{6}\cdot\frac{(n+1)(2n+1)}{n^2} = \frac{b^3}{3}`}
      </Equation>
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
        note={tx(t, "mInt_oddNote", "Symmetry saves work: an odd function (f(−x) = −f(x), like x³ or sin x) has as much area below the axis as above on [−a, a], so its integral there is 0.")}>
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
      <CodeBlock lang="cpp" filename="integrate.hpp" t={t}>{`// Numerical integration of f over [a, b] with n strips.

template <class F>
double midpoint(F f, double a, double b, int n) {
    double dx = (b - a) / n, sum = 0;
    for (int k = 0; k < n; ++k) sum += f(a + (k + 0.5) * dx);   // centre of strip k
    return sum * dx;
}

template <class F>
double trapezoid(F f, double a, double b, int n) {
    double dx = (b - a) / n, sum = 0.5 * (f(a) + f(b));        // the two ends count half
    for (int k = 1; k < n; ++k) sum += f(a + k * dx);
    return sum * dx;
}

template <class F>
double simpson(F f, double a, double b, int n /* even */) {
    double dx = (b - a) / n, sum = f(a) + f(b);
    for (int k = 1; k < n; ++k) sum += (k % 2 ? 4 : 2) * f(a + k * dx);   // 4, 2, 4, 2, ...
    return sum * dx / 3;
}

// simpson([](double x) { return x * x; }, 0, 2, 2)  ->  2.6666... = 8/3 exactly`}</CodeBlock>

      <H2>{tx(t, "mInt_avgTitle", "Average value")}</H2>
      <p>
        {tx(t, "mInt_avgBody",
          "The average of n numbers is their sum divided by n. The average of a function over [a, b] is its integral divided by the width b − a: the height of the rectangle with the same base and the same area. The average of x² over [0, 2] is (8/3)/2 = 4/3. For a sine wave over half a period, [0, π], the area is 2 (the next chapter shows why), so the average is 2/π ≈ 0.637: why a rectified AC voltage delivers about 64% of its peak.")}
      </p>
      <Equation label={tx(t, "mInt_eqAvg", "The average value of f on [a, b]")}
        where={[
          [r`b - a`, tx(t, "mInt_wWidth", "the width of the interval")],
          [r`\bar{f}`, tx(t, "mInt_wBar", "the average height: a rectangle this tall has the same area as the region under f")],
        ]}>
        {r`\bar{f} = \frac{1}{b - a}\int_a^b f(x)\,dx`}
      </Equation>

      <H2>{tx(t, "mInt_gameTitle", "Every game loop is a Riemann sum")}</H2>
      <p>
        {tx(t, "mInt_gameBody",
          "A physics update position += velocity * dt adds one strip of width dt and height velocity per frame: the position is a Riemann sum of the velocity. Which sample point is used depends on the order of the two lines. Take a stone falling from rest, v(t) = 9.8t, for one second at 60 frames per second. The exact distance is the triangle ½ · 1 · 9.8 = 4.9 m. Updating the position before the velocity (explicit Euler) uses the old velocity, the left sum: 4.818 m. Updating the velocity first (semi-implicit Euler, the usual choice in games) uses the new one, the right sum: 4.982 m. Averaging old and new velocity is the trapezoid rule, exact here: 4.9 m.")}
      </p>
      <CodeBlock lang="cpp" filename="falling.cpp" t={t}>{`// One second of free fall at 60 fps, three ways.
const float g = 9.8f, dt = 1.0f / 60.0f;
float yE = 0, vE = 0, yS = 0, vS = 0, yT = 0, vT = 0;
for (int i = 0; i < 60; ++i) {
    yE += vE * dt;  vE += g * dt;                    // explicit Euler: left sum        -> 4.818
    vS += g * dt;   yS += vS * dt;                   // semi-implicit Euler: right sum  -> 4.982
    float v0 = vT;  vT += g * dt;
    yT += 0.5f * (v0 + vT) * dt;                     // trapezoid                       -> 4.900
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "mInt_fpsWarn", "Because the error depends on Δx, a game whose physics uses the frame time as dt behaves slightly differently at 30 and at 144 frames per second: jumps reach different heights. That is one reason engines step physics with a fixed dt, as the game-loop chapter of the Game Dev track explains.")}
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
        headers={[tx(t, "mInt_tWrong", "Wrong"), tx(t, "mInt_tRight", "Right"), tx(t, "mInt_tWhy", "Why")]}
        rows={[
          [tx(t, "mInt_m1w", "the integral is always the geometric area"), tx(t, "mInt_m1r", "it is signed area"), tx(t, "mInt_m1", "parts below the axis subtract")],
          [tx(t, "mInt_m2w", "displacement = distance travelled"), tx(t, "mInt_m2r", "distance is ∫|v| dt"), tx(t, "mInt_m2", "moving back cancels moving forward in ∫v")],
          [tx(t, "mInt_m3w", "dropping the dx"), tx(t, "mInt_m3r", "keep it"), tx(t, "mInt_m3", "it names the variable and is the strip width; substitution needs it")],
          [tx(t, "mInt_m4w", "Simpson with an odd n"), tx(t, "mInt_m4r", "n must be even"), tx(t, "mInt_m4", "it fits one parabola per pair of strips")],
          [tx(t, "mInt_m5w", "tiny dt fixes Euler integration"), tx(t, "mInt_m5r", "use a better rule or a fixed step"), tx(t, "mInt_m5", "error only shrinks like dt, and rounding grows")],
        ]}
      />

      <KeyIdeas t={t} id="mInt" items={[
        "Area under a rate is the total change: distance is the area under speed.",
        "A Riemann sum adds n strips of width Δx = (b − a)/n and height f at a sample point.",
        "∫ₐᵇ f(x) dx is the limit of Riemann sums as n → ∞: a signed area.",
        "∫₀ᵇ x² dx = b³/3, from the sum of squares; the same ⅓ as in the cone.",
        "Integrals are linear, split at any point, and change sign when reversed.",
        "Left/right: error ~ Δx; midpoint/trapezoid ~ Δx²; Simpson ~ Δx⁴.",
        "position += velocity · dt is a Riemann sum; the update order picks the sample point.",
      ]} />
    </Article>
  );
}
