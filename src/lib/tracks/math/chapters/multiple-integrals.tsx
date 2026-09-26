"use client";

// Calculus 10: multiple integrals — the volume under a surface as a double
// Riemann sum; iterated integrals (Fubini) as Cavalieri's slices; regions
// bounded by curves and swapping the order; area, average value, mass and
// centre of mass (the triangle's centroid); polar coordinates, dA = r dr dθ,
// the disc, the sphere and the Gaussian integral √π; triple integrals and the
// volume of a tetrahedron.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DoubleIntegralFigure } from "@/components/lesson/figures/math/DoubleIntegralFigure";

const r = String.raw;

export function MultipleIntegralsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMul_intro",
          "A one-variable integral adds up thin strips to get an area. Its two-variable cousin adds up thin boxes to get a volume: the space under a surface z = f(x, y) and above a region of the floor. The same idea covers the total rain falling on a field whose rainfall varies from place to place, the mass of a plate whose thickness varies, or the average height of a landscape. And the good news of this chapter is that no new integration rules are needed: a double integral is computed as two ordinary integrals, one inside the other.")}
      </Lead>

      <H2>{tx(t, "mMul_boxTitle", "Volume by boxes")}</H2>
      <p>
        {tx(t, "mMul_boxBody",
          "Take a rectangle R of the floor, a ≤ x ≤ b and c ≤ y ≤ d, and a surface z = f(x, y) above it. Cut R into small rectangles of width Δx and depth Δy, so each has area ΔA = Δx Δy. Above each one, stand a box whose height is the value of f at a sample point of that small rectangle (its centre, say). Its volume is f · ΔA. Adding all the boxes gives a double Riemann sum, and as the rectangles shrink the sum approaches the volume under the surface. That limit is the double integral. Parts of the surface below the floor count as negative, just as in one variable.")}
      </p>
      <Equation label={tx(t, "mMul_eqDouble", "The double integral")}
        where={[
          [r`R`, tx(t, "mMul_wR", "the region of the floor being integrated over")],
          [r`(x_i, y_j)`, tx(t, "mMul_wSample", "the sample point of the small rectangle in column i, row j")],
          [r`\Delta A = \Delta x\,\Delta y`, tx(t, "mMul_wDA", "the area of one small rectangle; in the limit it becomes dA")],
        ]}>
        {r`\iint_R f(x,y)\,dA = \lim_{\Delta x,\,\Delta y\to 0}\ \sum_i\sum_j f(x_i, y_j)\,\Delta x\,\Delta y`}
      </Equation>

      <DoubleIntegralFigure t={t} />

      <H2>{tx(t, "mMul_iterTitle", "Slices: an integral inside an integral")}</H2>
      <p>
        {tx(t, "mMul_iterBody",
          "Nobody adds up boxes by hand. Instead, cut the solid into thin slices, as Cavalieri did in the volumes chapter. Fix one value of x. Above the line of the floor where x has that value, the surface is an ordinary curve z = f(x, y) in the single variable y, and the area of the slice under it is A(x) = ∫ f(x, y) dy, with x treated as a constant. A slice of thickness dx has volume A(x) dx, and the whole volume is ∫ A(x) dx. So a double integral is an iterated integral: integrate in y with x frozen (like a partial derivative in reverse), then integrate the result in x. Fubini's theorem says that for a rectangle and a continuous f, the other order, x first, gives the same answer.")}
      </p>
      <Equation label={tx(t, "mMul_eqFubini", "Iterated integrals (Fubini)")}
        where={[
          [r`\int_c^d f(x,y)\,dy`, tx(t, "mMul_wInner", "the inner integral: x is a constant; the result A(x) is a function of x only")],
          [r`\int_a^b \ldots\,dx`, tx(t, "mMul_wOuter", "the outer integral adds up the slices")],
        ]}>
        {r`\iint_R f\,dA = \int_a^b\!\left(\int_c^d f(x,y)\,dy\right)dx = \int_c^d\!\left(\int_a^b f(x,y)\,dx\right)dy`}
      </Equation>
      <H3>{tx(t, "mMul_handTitle", "The figure's plane, by hand")}</H3>
      <p>
        {tx(t, "mMul_handBody",
          "f = 1 + xy/2 on 0 ≤ x ≤ 2, 0 ≤ y ≤ 2. Inner integral, x constant: ∫₀² (1 + xy/2) dy = [y + xy²/4]₀² = 2 + x. That is the slice area A(x), a line in x. Outer: ∫₀² (2 + x) dx = [2x + x²/2]₀² = 4 + 2 = 6, the value the boxes approach. In the other order the inner integral is ∫₀² (1 + xy/2) dx = 2 + y and the outer one again gives 6.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "mMul_sepTip", "When f is a product of a function of x and a function of y, over a rectangle the double integral splits into a product of two single integrals: ∬ g(x) h(y) dA = (∫ₐᵇ g dx)(∫ h dy from c to d). The inner integral treats g(x) as a constant factor, which comes straight out. Example: ∬ x²y over [0, 3] × [0, 2] = (∫₀³ x² dx)(∫₀² y dy) = 9 · 2 = 18.")}
      </Callout>

      <H2>{tx(t, "mMul_regTitle", "Regions bounded by curves")}</H2>
      <p>
        {tx(t, "mMul_regBody",
          "When the region is not a rectangle, the slices have different lengths, so the inner limits depend on the outer variable. The recipe: (1) sketch the region; (2) choose the outer variable, say x, and read its smallest and largest values: these are numbers; (3) for a fixed x, run a line across the region in the y direction and read where it enters and leaves: these are the inner limits, functions of x; (4) integrate inside out. Take the triangle below the line y = x, above y = 0, left of x = 1. For fixed x between 0 and 1, y runs from 0 to x. So ∬ xy dA = ∫₀¹ ∫₀ˣ xy dy dx = ∫₀¹ x · x²/2 dx = ∫₀¹ x³/2 dx = 1/8.")}
      </p>
      <p>
        {tx(t, "mMul_swapBody",
          "Checking with the other order: for a fixed y between 0 and 1, the horizontal line enters the triangle at x = y (the slanted side) and leaves at x = 1. So the integral is ∫₀¹ ∫ᵧ¹ xy dx dy = ∫₀¹ y(1 − y²)/2 dy = ½(½ − ¼) = 1/8 ✓. Sometimes only one order is possible by hand. ∫₀¹ ∫ᵧ¹ e^(x²) dx dy is stuck, since e^(x²) has no antiderivative. Swapped, the same triangle reads ∫₀¹ ∫₀ˣ e^(x²) dy dx = ∫₀¹ x e^(x²) dx, and the substitution u = x² gives (e − 1)/2 ≈ 0.859.")}
      </p>

      <H2>{tx(t, "mMul_useTitle", "Area, average, mass and balance point")}</H2>
      <LessonTable
        headers={[tx(t, "mMul_tQty", "Quantity"), tx(t, "mMul_tFormula", "Formula"), tx(t, "mMul_tMeaning", "Meaning")]}
        rows={[
          [tx(t, "mMul_qArea", "area of R"), "A = ∬_R 1 dA", tx(t, "mMul_qAreaM", "boxes of height 1: the volume equals the base area")],
          [tx(t, "mMul_qAvg", "average value of f"), "f̄ = (1/A) ∬_R f dA", tx(t, "mMul_qAvgM", "the height of the flat box with the same base and volume")],
          [tx(t, "mMul_qMass", "mass of a plate"), "m = ∬_R ρ dA", tx(t, "mMul_qMassM", "ρ(x, y) is the density: mass per unit area")],
          [tx(t, "mMul_qCent", "centre of mass"), "x̄ = (1/m) ∬ x ρ dA, ȳ = (1/m) ∬ y ρ dA", tx(t, "mMul_qCentM", "the average position, weighted by mass: the point where the plate balances")],
        ]}
      />
      <p>
        {tx(t, "mMul_centBody",
          "The triangle of the last section, as a uniform plate (ρ = 1): its area is ∫₀¹ ∫₀ˣ dy dx = ∫₀¹ x dx = ½. Then ∬ x dA = ∫₀¹ x · x dx = ⅓, so x̄ = (⅓)/(½) = ⅔; and ∬ y dA = ∫₀¹ x²/2 dx = 1/6, so ȳ = (1/6)/(½) = ⅓. The corners are (0, 0), (1, 0) and (1, 1), and their average is ((0 + 1 + 1)/3, (0 + 0 + 1)/3) = (⅔, ⅓): the centre of mass of a triangle is the average of its corners, the point where its medians meet.")}
      </p>

      <H2>{tx(t, "mMul_polarTitle", "Polar coordinates: dA = r dr dθ")}</H2>
      <p>
        {tx(t, "mMul_polarBody",
          "Discs, rings and anything round are awkward in x and y (the limits involve square roots) and natural in polar coordinates, x = r cos θ, y = r sin θ. Cut the region into polar patches instead of rectangles: between radii r and r + dr, and between angles θ and θ + dθ. Such a patch is almost a rectangle. One side is dr. The other is an arc of a circle of radius r through the angle dθ, and arc length is radius times angle in radians, so it is r dθ. Its area is therefore r dr dθ, not dr dθ: patches far from the centre are bigger. That extra factor r is the price of the change of coordinates.")}
      </p>
      <Equation label={tx(t, "mMul_eqPolar", "Double integrals in polar coordinates")}
        where={[
          [r`r\,dr\,d\theta`, tx(t, "mMul_wRdr", "the area of a small polar patch: radial side dr times arc r dθ")],
          [r`f(r\cos\theta,\ r\sin\theta)`, tx(t, "mMul_wFpol", "the same function, with x and y written in polar form")],
        ]}
        note={tx(t, "mMul_polarNote", "The disc of radius R: ∫₀^(2π) ∫₀ᴿ r dr dθ = 2π · R²/2 = πR². A third proof of the area of a circle, after the pizza slices and the trigonometric substitution.")}>
        {r`\iint_R f\,dA = \int_{\theta_1}^{\theta_2}\!\int_{r_1}^{r_2} f(r\cos\theta,\ r\sin\theta)\;r\,dr\,d\theta`}
      </Equation>
      <p>
        {tx(t, "mMul_sphereBody",
          "The volume of a sphere. The top half of a ball of radius R is the solid under z = √(R² − x² − y²) = √(R² − r²) over the disc of radius R. In polar form: ∫₀^(2π) ∫₀ᴿ √(R² − r²) r dr dθ. For the inner integral substitute u = R² − r², du = −2r dr: it becomes ½ ∫₀^(R²) √u du = ½ · ⅔ (R²)^(3/2) = R³/3. The outer integral multiplies by 2π: the hemisphere is 2πR³/3, and the whole ball 4πR³/3, as the volumes chapter found by comparing it with a cylinder and a cone.")}
      </p>
      <H3>{tx(t, "mMul_gaussTitle", "The bell-curve integral")}</H3>
      <p>
        {tx(t, "mMul_gaussBody",
          "e^(−x²) has no elementary antiderivative, yet its integral over the whole line is known exactly, thanks to a beautiful trick. Call it I = ∫ e^(−x²) dx over all x. Multiply it by the same integral written with y: I² = ∫ e^(−x²) dx · ∫ e^(−y²) dy = ∬ e^(−(x² + y²)) dA over the whole plane (the separable-product rule, backwards). Now x² + y² = r², and in polar coordinates the factor r appears, which is exactly what the substitution u = r² needs: I² = ∫₀^(2π) ∫₀^∞ e^(−r²) r dr dθ = 2π · ½ = π. So I = √π ≈ 1.772. The Probability and Statistics section uses this to make the normal distribution's total probability equal 1.")}
      </p>
      <Equation label={tx(t, "mMul_eqGauss", "The Gaussian integral")}
        where={[
          [r`\int_0^\infty e^{-r^2}\,r\,dr = \tfrac12`, tx(t, "mMul_wGr", "with u = r², du = 2r dr: ½ ∫₀^∞ e^(−u) du = ½")],
          [r`2\pi`, tx(t, "mMul_wG2pi", "the θ integral: nothing depends on the angle")],
        ]}>
        {r`\left(\int_{-\infty}^{\infty} e^{-x^2}dx\right)^{2} = \int_0^{2\pi}\!\!\int_0^{\infty} e^{-r^2}\,r\,dr\,d\theta = \pi \quad\Longrightarrow\quad \int_{-\infty}^{\infty} e^{-x^2}dx = \sqrt{\pi}`}
      </Equation>

      <H2>{tx(t, "mMul_tripleTitle", "Triple integrals")}</H2>
      <p>
        {tx(t, "mMul_tripleBody",
          "The same construction one dimension up: cut a solid region into small boxes of volume dV = dx dy dz and add f · dV. With f = 1 it gives the volume of the region; with f = density it gives the mass of a solid whose density varies; divided by the volume it gives an average, such as the mean temperature in a room. It is computed as three nested ordinary integrals, with limits read from the inside out exactly as in two dimensions. Round solids use cylindrical coordinates (polar in x, y plus the height z), where dV = r dr dθ dz.")}
      </p>
      <p>
        {tx(t, "mMul_tetraBody",
          "The corner of a cube cut off by the plane x + y + z = 1 (a tetrahedron with three right angles at the origin). For fixed x and y, z runs from 0 up to the plane, 1 − x − y; for fixed x, y runs from 0 to 1 − x; and x runs from 0 to 1. Inner: ∫₀^(1−x−y) dz = 1 − x − y. Middle: ∫₀^(1−x) (1 − x − y) dy = (1 − x)² − (1 − x)²/2 = (1 − x)²/2. Outer: ∫₀¹ (1 − x)²/2 dx = 1/6. That is ⅓ × base × height = ⅓ × ½ × 1, the pyramid formula.")}
      </p>

      <H2>{tx(t, "mMul_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mMul_ex1", "1. ∬ (x + 2y) over [0, 1] × [0, 3]: inner ∫₀³ (x + 2y) dy = 3x + 9; outer ∫₀¹ (3x + 9) dx = 1.5 + 9 = 10.5.")}</p>
      <p>{tx(t, "mMul_ex2", "2. Area between y = x² and y = x: for 0 ≤ x ≤ 1, y from x² to x: ∫₀¹ (x − x²) dx = ½ − ⅓ = 1/6.")}</p>
      <p>{tx(t, "mMul_ex3", "3. Average of f = x² + y² over the unit square: ∬ = ⅓ + ⅓ = ⅔, area 1, average ⅔.")}</p>
      <p>{tx(t, "mMul_ex4", "4. ∬ over the disc of radius 2 of (x² + y²): polar, ∫₀^(2π) ∫₀² r² · r dr dθ = 2π · 16/4 = 8π ≈ 25.1.")}</p>
      <p>{tx(t, "mMul_ex5", "5. A square plate [0, 1] × [0, 1] with density ρ = 1 + x (heavier on the right): m = ∫₀¹ (1 + x) dx = 1.5; ∬ x ρ dA = ∫₀¹ (x + x²) dx = ½ + ⅓ = 5/6; x̄ = (5/6)/1.5 = 5/9 ≈ 0.556, right of centre, and ȳ = ½ by symmetry.")}</p>
      <p>{tx(t, "mMul_ex6", "6. Rain on a field 100 m × 50 m falls at a depth of d(x, y) = 0.02 + 0.0002x metres: total volume ∬ d dA = 50 · ∫₀¹⁰⁰ (0.02 + 0.0002x) dx = 50 · (2 + 1) = 150 m³.")}</p>

      <H2>{tx(t, "mMul_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mMul_tWrong", "Wrong"), tx(t, "mMul_tRight", "Right"), tx(t, "mMul_tWhy", "Why")]}
        rows={[
          [tx(t, "mMul_m1w", "outer limits depending on the inner variable"), tx(t, "mMul_m1r", "outer limits are numbers"), tx(t, "mMul_m1", "after the inner integral that variable is gone")],
          [tx(t, "mMul_m2w", "swapping the order but keeping the limits"), tx(t, "mMul_m2r", "re-read the limits from a sketch"), tx(t, "mMul_m2", "only on a rectangle do the limits stay the same")],
          ["dA = dr dθ", "dA = r dr dθ", tx(t, "mMul_m3", "polar patches grow with the distance from the centre")],
          [tx(t, "mMul_m4w", "forgetting to write x and y in polar form"), "x = r cos θ, y = r sin θ", tx(t, "mMul_m4", "the integrand must be in the same variables as dA")],
          [tx(t, "mMul_m5w", "∬ f g dA = ∬ f dA · ∬ g dA"), tx(t, "mMul_m5r", "only for g(x) h(y) on a rectangle, as single integrals"), tx(t, "mMul_m5", "a product splits only when each factor depends on one variable")],
          [tx(t, "mMul_m6w", "average = ∬ f dA"), "(1/A) ∬ f dA", tx(t, "mMul_m6", "divide by the area of the region")],
        ]}
      />

      <KeyIdeas t={t} id="mMul" items={[
        "∬_R f dA is the limit of box sums f · ΔA: the signed volume under the surface.",
        "Compute it as an iterated integral: inner with the other variable frozen, then outer.",
        "On a rectangle the order does not matter (Fubini); on other regions the inner limits depend on the outer variable.",
        "Swapping the order can turn an impossible integral into an easy one.",
        "∬ 1 dA is area; divide ∬ f dA by it for an average; weight by density for mass and centre of mass.",
        "In polar coordinates dA = r dr dθ; this gives πR², 4πR³/3 and ∫ e^(−x²) dx = √π.",
        "Triple integrals add f dV over a solid; nested the same way.",
      ]} />
    </Article>
  );
}
