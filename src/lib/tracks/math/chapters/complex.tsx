"use client";

// Linear Algebra 8: complex numbers — i² = −1, a + bi as a point, adding as
// vectors, multiplying by expanding, and what multiplication does (lengths
// multiply, angles add, from the angle-sum identities); modulus, argument,
// conjugate and division; powers, De Moivre and roots of unity; complex
// roots of polynomials; Euler's formula from (1 + iθ/n)ⁿ; complex numbers as
// 2D rotations in code; the Mandelbrot set; C++.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { ComplexFigure } from "@/components/lesson/figures/math/ComplexFigure";

const r = String.raw;

export function ComplexContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mCx_intro",
          "Two chapters ended at the same wall. The polynomials chapter said x² + 1 = 0 has no real solutions, since no real number squared is negative. The eigenvalues chapter found that a rotation's eigenvalues need the square root of a negative number. Complex numbers break through that wall with one new number, i, whose square is −1. It sounds like a trick, but the result has a beautifully concrete meaning: complex numbers are points of the plane, and multiplying them rotates and scales. They are the algebra of 2D rotation, and the stepping stone to quaternions, the algebra of 3D rotation.")}
      </Lead>

      <H2>{tx(t, "mCx_iTitle", "The imaginary unit")}</H2>
      <p>
        {tx(t, "mCx_iBody",
          "Negative numbers were once called absurd too: \"3 − 5\" had no answer until people agreed to add new numbers to the line and checked that all the old rules still worked. Complex numbers are the same move. Declare a new number i with the single property i² = −1, and keep all the usual rules of arithmetic (commutative, associative, distributive, from the number-line chapter). Nothing contradicts itself, and now x² + 1 = 0 has the solutions x = i and x = −i, since (−i)² = i² = −1 too. The name \"imaginary\" is a historical accident; i is no less real than −1, it just does not live on the number line.")}
      </p>
      <p>
        {tx(t, "mCx_powBody",
          "Powers of i cycle with period 4: i¹ = i, i² = −1, i³ = i² · i = −i, i⁴ = (i²)² = 1, and then it repeats: i⁵ = i. Keep that cycle in mind; it will turn out to be a quarter turn repeated.")}
      </p>

      <H2>{tx(t, "mCx_formTitle", "Complex numbers are points")}</H2>
      <p>
        {tx(t, "mCx_formBody",
          "A complex number is a real number plus a real multiple of i: z = a + bi. The number a is its real part, Re z, and b is its imaginary part, Im z (b itself is real; it is the coefficient of i). Real numbers are the complex numbers with b = 0. Since a complex number is just two real numbers, draw it as the point (a, b): the real part along the horizontal axis, the imaginary part along the vertical axis. This is the complex plane. The number line becomes its horizontal axis, and i sits one step up from 0.")}
      </p>

      <H2>{tx(t, "mCx_opsTitle", "Adding and multiplying")}</H2>
      <p>
        {tx(t, "mCx_addBody",
          "Add by collecting real parts and imaginary parts separately: (3 + 2i) + (1 − 4i) = 4 − 2i. That is exactly vector addition of (3, 2) and (1, −4). Multiply by expanding the brackets, as with any two sums of two terms, and then replace i² by −1.")}
      </p>
      <Equation label={tx(t, "mCx_eqMul", "Multiplying two complex numbers")}
        where={[
          [r`ac`, tx(t, "mCx_wAC", "real times real")],
          [r`adi + bci`, tx(t, "mCx_wADBC", "the two mixed terms, both multiples of i")],
          [r`bd\,i^2 = -bd`, tx(t, "mCx_wBD", "imaginary times imaginary: i² = −1 makes it a real number with a minus sign")],
        ]}
        note={tx(t, "mCx_mulNote", "Example: (3 + 2i)(1 + 4i) = 3 + 12i + 2i + 8i² = 3 + 14i − 8 = −5 + 14i.")}>
        {r`(a + bi)(c + di) = ac + adi + bci + bd\,i^2 = (ac - bd) + (ad + bc)\,i`}
      </Equation>

      <H2>{tx(t, "mCx_geoTitle", "What multiplication does: turn and scale")}</H2>
      <p>
        {tx(t, "mCx_iTurn",
          "Start with the simplest case, multiplying by i: (x + yi) · i = xi + yi² = −y + xi. The point (x, y) goes to (−y, x), which is the quarter-turn rule from the transformations chapter. So multiplying by i turns the plane 90° anticlockwise, and the cycle i, −1, −i, 1 is the point 1 turned by one, two, three and four quarter turns.")}
      </p>
      <p>
        {tx(t, "mCx_rotTurn",
          "Now multiply by a number on the unit circle, w = cos θ + i sin θ. Using the formula with c = cos θ and d = sin θ: (x + yi)(cos θ + i sin θ) = (x cos θ − y sin θ) + (x sin θ + y cos θ)i. That is the rotation formula from the identities chapter, word for word. Multiplying by cos θ + i sin θ rotates by θ.")}
      </p>
      <p>
        {tx(t, "mCx_polarBody",
          "Every complex number can be written that way, scaled. Its distance from 0 is its modulus |z| = √(a² + b²), by Pythagoras, and its angle from the positive real axis is its argument arg z = atan2(b, a), from the polar coordinates chapter. Then z = r(cos θ + i sin θ) with r = |z| and θ = arg z, the polar form. Multiplying two numbers in polar form and applying the angle-sum identities gives the whole story at once:")}
      </p>
      <Equation label={tx(t, "mCx_eqPolar", "Multiplication in polar form")}
        where={[
          [r`r_1, r_2`, tx(t, "mCx_wR", "the moduli (lengths) of the two numbers")],
          [r`\theta_1, \theta_2`, tx(t, "mCx_wTh", "their arguments (angles)")],
          [r`r_1r_2`, tx(t, "mCx_wRR", "lengths multiply")],
          [r`\theta_1 + \theta_2`, tx(t, "mCx_wTT", "angles add: the real part is cos θ₁ cos θ₂ − sin θ₁ sin θ₂ = cos(θ₁ + θ₂), the imaginary part sin(θ₁ + θ₂)")],
        ]}
        note={tx(t, "mCx_polarNote", "Example: 1 + i has length √2 and angle 45°. Squared: length 2, angle 90°, so (1 + i)² = 2i. Check by expanding: 1 + 2i + i² = 2i. ✓")}>
        {r`r_1(\cos\theta_1 + i\sin\theta_1)\cdot r_2(\cos\theta_2 + i\sin\theta_2) = r_1r_2\big(\cos(\theta_1 + \theta_2) + i\sin(\theta_1 + \theta_2)\big)`}
      </Equation>

      <ComplexFigure t={t} />

      <H2>{tx(t, "mCx_conjTitle", "Conjugate and division")}</H2>
      <p>
        {tx(t, "mCx_conjBody",
          "The conjugate of z = a + bi is z̄ = a − bi (\"z bar\"): the mirror image in the real axis, same length, opposite angle. Multiplying a number by its conjugate removes the imaginary part: (a + bi)(a − bi) = a² − abi + abi − b²i² = a² + b² = |z|². That makes division possible. To divide by w, multiply the top and the bottom by w̄; the bottom becomes the real number |w|², and dividing by a real number is easy. Geometrically, dividing does the opposite of multiplying: lengths divide and angles subtract.")}
      </p>
      <Equation label={tx(t, "mCx_eqDiv", "Conjugate and division")}
        where={[
          [r`\bar z = a - bi`, tx(t, "mCx_wConj", "the conjugate: flip the sign of the imaginary part")],
          [r`z\bar z = |z|^2`, tx(t, "mCx_wZZ", "a number times its conjugate is its squared length, always real and ≥ 0")],
          [r`\frac{1}{z} = \frac{\bar z}{|z|^2}`, tx(t, "mCx_wInv", "the reciprocal: for a unit-length z it is simply z̄, the rotation the other way")],
        ]}
        note={tx(t, "mCx_divNote", "Example: (5 + 5i)/(1 + 2i) = (5 + 5i)(1 − 2i)/(1 + 4) = (5 − 10i + 5i − 10i²)/5 = (15 − 5i)/5 = 3 − i. Check: (3 − i)(1 + 2i) = 3 + 6i − i − 2i² = 5 + 5i. ✓")}>
        {r`\bar z = a - bi \qquad z\bar z = a^2 + b^2 = |z|^2 \qquad \frac{z}{w} = \frac{z\,\bar w}{|w|^2}`}
      </Equation>

      <H2>{tx(t, "mCx_powerTitle", "Powers and roots")}</H2>
      <p>
        {tx(t, "mCx_deMoivre",
          "Multiplying z by itself n times multiplies the length by r each time and adds the angle θ each time: zⁿ = rⁿ(cos nθ + i sin nθ). This is De Moivre's formula, the figure's third mode. It turns powers into something you can picture: for |z| > 1 the powers spiral outward, for |z| < 1 inward, and for |z| = 1 they march round the unit circle.")}
      </p>
      <p>
        {tx(t, "mCx_rootsBody",
          "Running it backwards solves zⁿ = 1. The length must satisfy rⁿ = 1, so r = 1. The angle must satisfy nθ = a whole number of full turns, so θ = 0, 360°/n, 2·360°/n, and so on: n different answers before they repeat. These are the n-th roots of unity, the corners of a regular n-gon inscribed in the unit circle (the fourth mode). The same idea gives n different n-th roots of any non-zero complex number.")}
      </p>
      <Equation label={tx(t, "mCx_eqRoots", "De Moivre and the roots of unity")}
        where={[
          [r`z^n`, tx(t, "mCx_wZn", "length raised to the n-th power, angle multiplied by n")],
          [r`\omega_k`, tx(t, "mCx_wOmega", "the k-th root of unity, k = 0, 1, …, n − 1: angle k/n of a full turn")],
        ]}>
        {r`z^n = r^n(\cos n\theta + i\sin n\theta) \qquad \omega_k = \cos\frac{2\pi k}{n} + i\sin\frac{2\pi k}{n}, \quad \omega_k^n = 1`}
      </Equation>

      <H3>{tx(t, "mCx_polyTitle", "Every polynomial has its roots")}</H3>
      <p>
        {tx(t, "mCx_polyBody",
          "With i available, the quadratic formula always works. For x² + 2x + 5 = 0 the discriminant is 4 − 20 = −16, and √(−16) = 4i, so x = (−2 ± 4i)/2 = −1 ± 2i. Complex roots of a polynomial with real coefficients always come in conjugate pairs like this one. More generally, the fundamental theorem of algebra, mentioned in the polynomials chapter, says every polynomial of degree n has exactly n complex roots (counting repeats). And the rotation matrix's eigenvalues, λ = cos θ ± √(−sin² θ), are now cos θ ± i sin θ: the rotation's own angle, as numbers on the unit circle.")}
      </p>

      <H2>{tx(t, "mCx_eulerTitle", "Euler's formula")}</H2>
      <p>
        {tx(t, "mCx_eulerBody",
          "The exponents chapter defined eˣ as the limit of (1 + x/n)ⁿ: growing continuously. Put x = iθ. The number 1 + iθ/n is one step right and a tiny step θ/n up: a point at length very nearly 1 and angle very nearly θ/n. Multiplying n of them together multiplies lengths (≈ 1 each, and the error shrinks to nothing as n grows) and adds angles (n times θ/n = θ). So in the limit e^(iθ) is the point on the unit circle at angle θ. That is Euler's formula. It lets the polar form be written z = re^(iθ), and it explains why multiplication adds angles: e^(iα)e^(iβ) = e^(i(α + β)), the ordinary rule for exponents. The Calculus section proves it again with series.")}
      </p>
      <Equation label={tx(t, "mCx_eqEuler", "Euler's formula")}
        where={[
          [r`e^{i\theta}`, tx(t, "mCx_wEit", "continuous growth \"in the i direction\": a turn by θ radians")],
          [r`\cos\theta + i\sin\theta`, tx(t, "mCx_wCis", "the point at angle θ on the unit circle")],
          [r`e^{i\pi} = -1`, tx(t, "mCx_wPi", "half a turn from 1 lands on −1")],
        ]}
        note={tx(t, "mCx_eulerNote", "θ is in radians, as always when e is involved: e^(iπ/2) = i, a quarter turn.")}>
        {r`e^{i\theta} = \cos\theta + i\sin\theta \qquad z = r\,e^{i\theta} \qquad e^{i\pi} + 1 = 0`}
      </Equation>

      <H2>{tx(t, "mCx_useTitle", "Complex numbers in games and graphics")}</H2>
      <p>
        {tx(t, "mCx_useRot",
          "A 2D rotation stored as a unit complex number (cos θ, sin θ) is exactly the Rot struct from the identities chapter: applying it is a complex multiplication, combining two rotations is a multiplication, undoing one is the conjugate, and no angles or trig calls are needed along the way. Turning smoothly from one direction to another can blend the two complex numbers and renormalise. Quaternions do the same for 3D.")}
      </p>
      <p>
        {tx(t, "mCx_useWave",
          "Waves: a sin t + b cos t, the combination the waves chapter merged into one sinusoid, is the imaginary part of (a + bi) · e^(it); its amplitude is the modulus and its phase the argument. Engineers call this a phasor. The Fourier transform, which splits a sound or image into waves (the FFT behind audio spectra and ocean-wave simulations), is written with e^(iθ) throughout. And the Mandelbrot set, a favourite shader, colours each point c of the plane by whether repeating z → z² + c from z = 0 stays near 0 or escapes.")}
      </p>
      <LessonTable
        headers={[tx(t, "mCx_tOp", "Operation"), tx(t, "mCx_tAlg", "Algebra"), tx(t, "mCx_tGeo", "Geometry")]}
        rows={[
          [tx(t, "mCx_oAdd", "z + w"), "(a + c) + (b + d)i", tx(t, "mCx_oAddG", "vector addition")],
          [tx(t, "mCx_oMul", "z · w"), "(ac − bd) + (ad + bc)i", tx(t, "mCx_oMulG", "multiply lengths, add angles")],
          [tx(t, "mCx_oI", "z · i"), "−b + ai", tx(t, "mCx_oIG", "quarter turn anticlockwise")],
          [tx(t, "mCx_oConj", "z̄"), "a − bi", tx(t, "mCx_oConjG", "mirror in the real axis")],
          [tx(t, "mCx_oDiv", "z / w"), "z w̄ / |w|²", tx(t, "mCx_oDivG", "divide lengths, subtract angles")],
          [tx(t, "mCx_oPow", "zⁿ"), "rⁿ e^(inθ)", tx(t, "mCx_oPowG", "spiral: n turns by θ, n scalings by r")],
        ]}
      />

      <H2>{tx(t, "mCx_exTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "mCx_ex1",
          "1. Rotate the point (4, 1) by 90° about the origin: (4 + i) · i = 4i + i² = −1 + 4i, the point (−1, 4). Rotate it by 45° instead: multiply by (√2/2)(1 + i): (4 + i)(1 + i) = 4 + 4i + i − 1 = 3 + 5i, times 0.707 gives (2.12, 3.54). Length before √17 ≈ 4.12, after √(4.5 + 12.5) = √17. ✓")}
      </p>
      <p>
        {tx(t, "mCx_ex2",
          "2. (1 + i)⁸: length √2, angle 45°. The eighth power has length (√2)⁸ = 16 and angle 360°, so it is 16. Expanding eight brackets by hand would take much longer.")}
      </p>
      <p>
        {tx(t, "mCx_ex3",
          "3. The cube roots of unity: angles 0°, 120°, 240°, i.e. 1, −½ + (√3/2)i, −½ − (√3/2)i. They add up to 0, the centre of the triangle they form.")}
      </p>

      <H2>{tx(t, "mCx_codeTitle", "Complex numbers in C++")}</H2>
      <p>
        {tx(t, "mCx_codeBody",
          "The standard library has std::complex<float>, but a hand-written struct shows that nothing magic is going on: two floats and the multiplication formula. The Mandelbrot loop at the end is the whole fractal; a shader runs the same loop once per pixel.")}
      </p>
      <CodeBlock lang="cpp" filename="complex.hpp" t={t}>{`#include <cmath>

struct Complex {
    float re = 0, im = 0;

    Complex operator+(Complex w) const { return { re + w.re, im + w.im }; }
    // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
    Complex operator*(Complex w) const { return { re * w.re - im * w.im, re * w.im + im * w.re }; }
    Complex conj() const { return { re, -im }; }
    float   abs2() const { return re * re + im * im; }         // |z|^2 = z * conj(z)
    float   abs()  const { return std::sqrt(abs2()); }
    float   arg()  const { return std::atan2(im, re); }
    Complex operator/(Complex w) const {                       // z * conj(w) / |w|^2
        Complex n = *this * w.conj(); float d = w.abs2();
        return { n.re / d, n.im / d };
    }
    static Complex polar(float r, float theta) { return { r * std::cos(theta), r * std::sin(theta) }; }
};

// A 2D rotation is a unit complex number: rotate p by multiplying
Complex rotate(Complex p, float theta) { return p * Complex::polar(1, theta); }

// Mandelbrot: how many steps of z -> z^2 + c before |z| > 2 (the point escapes)
int mandelbrot(Complex c, int maxIter = 256) {
    Complex z;
    for (int i = 0; i < maxIter; ++i) {
        z = z * z + c;
        if (z.abs2() > 4.0f) return i;
    }
    return maxIter;                                             // stayed bounded: inside the set
}`}</CodeBlock>

      <H2>{tx(t, "mCx_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mCx_tWrong", "Wrong"), tx(t, "mCx_tRight", "Right"), tx(t, "mCx_tWhy", "Why")]}
        rows={[
          ["(a + bi)(c + di) = ac + bdi", "(ac − bd) + (ad + bc)i", tx(t, "mCx_m1", "every term of one bracket multiplies every term of the other, and i² = −1")],
          ["i² = 1", "i² = −1", tx(t, "mCx_m2", "that is the definition of i")],
          ["|a + bi| = a + b", "√(a² + b²)", tx(t, "mCx_m3", "the modulus is a distance, found with Pythagoras")],
          ["arg = atan(b / a)", "atan2(b, a)", tx(t, "mCx_m4", "atan loses the quadrant: −1 − i and 1 + i would get the same angle")],
          [tx(t, "mCx_m5w", "dividing real and imaginary parts separately"), tx(t, "mCx_m5r", "multiply by the conjugate"), tx(t, "mCx_m5", "(a + bi)/(c + di) is not a/c + (b/d)i")],
          ["√(−4) · √(−9) = √36 = 6", "2i · 3i = −6", tx(t, "mCx_m6", "√a · √b = √(ab) holds only for a, b ≥ 0")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "mCx_whyNote", "Why is this chapter in Linear Algebra? Because multiplying by w = c + di is a linear map of the plane, with matrix [[c, −d], [d, c]]: a rotation matrix scaled by |w|. Complex numbers are exactly the 2 × 2 matrices that rotate and scale without shearing or mirroring, written in a compact form that multiplies like ordinary numbers.")}
      </Callout>

      <KeyIdeas t={t} id="mCx" items={[
        "i² = −1; a complex number a + bi is the point (a, b) of the complex plane.",
        "Add like vectors; multiply by expanding and replacing i² with −1.",
        "Multiplication multiplies lengths and adds angles; multiplying by i is a quarter turn.",
        "z̄ = a − bi; z z̄ = |z|²; divide by multiplying top and bottom by the conjugate.",
        "zⁿ = rⁿ(cos nθ + i sin nθ); the n roots of 1 form a regular n-gon.",
        "e^(iθ) = cos θ + i sin θ; a unit complex number is a 2D rotation.",
      ]} />
    </Article>
  );
}
