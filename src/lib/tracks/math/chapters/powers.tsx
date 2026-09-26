"use client";

// Arithmetic 6: powers as repeated multiplication, squares and cubes, the
// laws for whole-number exponents, zero and negative exponents, scientific
// notation, square and n-th roots, simplifying and estimating roots, and
// Heron's method for computing a square root.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { PowerFigure } from "@/components/lesson/figures/math/PowerFigure";

const r = String.raw;

export function PowersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPow_intro",
          "Multiplication is repeated addition; a power is repeated multiplication. Powers measure how areas and volumes grow with size, how brightness falls off with distance, how fast savings with compound interest climb, and they are the only sane way to write the size of a galaxy or of an atom. Roots run powers backwards, and the square root in particular is inside every distance formula. This chapter covers whole-number exponents and roots; the Exponents & Logarithms chapter in the Algebra section extends exponents to every real number and introduces logarithms.")}
      </Lead>

      <H2>{tx(t, "mPow_powTitle", "Powers as repeated multiplication")}</H2>
      <p>
        {tx(t, "mPow_powBody",
          "3 × 3 × 3 × 3 is written 3⁴ and read \"3 to the power 4\" or \"3 to the fourth\": 81. The number being multiplied, 3, is the base; the small raised number, 4, is the exponent, and it counts how many copies of the base are multiplied. The second and third powers have names from geometry. A square with side 5 is made of 5 rows of 5 unit squares, so its area is 5 × 5 = 5², \"five squared\". A cube with side 5 is 5 layers of 5², so its volume is 5³, \"five cubed\".")}
      </p>
      <Equation label={tx(t, "mPow_eqPow", "A power")}
        where={[
          [r`b`, tx(t, "mPow_wB", "the base: the number multiplied by itself")],
          [r`n`, tx(t, "mPow_wN", "the exponent: how many copies of b are in the product, here a whole number 1, 2, 3 …")],
          [r`b^1 = b`, tx(t, "mPow_wOne", "a single copy is just the number itself")],
        ]}
        note={tx(t, "mPow_eqPowNote", "Signs: a negative base multiplied an even number of times gives a positive result, (−2)⁴ = 16, and an odd number of times a negative one, (−2)³ = −8, because the minus signs cancel in pairs. Remember from the order of operations that −2⁴ means −(2⁴) = −16: without parentheses, the minus is not part of the base.")}>
        {r`b^n = \underbrace{b \cdot b \cdots b}_{n \text{ copies}}`}
      </Equation>
      <p>
        {tx(t, "mPow_growBody",
          "Powers grow fast, and the exponent matters more than the base. Scale a model, a room or an animal by 2 in every direction and its lengths double, its area goes up 2² = 4 times and its volume (and so its weight, if it is solid) 2³ = 8 times. That is why a giant cannot simply be a scaled-up human: its weight grows as the cube of its size but the strength of its legs, which depends on their cross-section area, only as the square.")}
      </p>

      <H2>{tx(t, "mPow_lawsTitle", "The laws of exponents")}</H2>
      <p>
        {tx(t, "mPow_lawsBody",
          "Every rule for powers comes from counting copies. 2³ × 2² is (2·2·2) × (2·2), five copies of 2 in a row, so 2⁵: when powers of the same base multiply, the exponents add. 2⁵ ÷ 2² cancels two copies from the top and bottom, leaving 2³: dividing subtracts exponents. (2³)² is two groups of three copies, 2⁶: a power of a power multiplies exponents. And (2 · 5)³ = 2·5 · 2·5 · 2·5 can be regrouped as 2³ · 5³, because multiplication can be reordered freely.")}
      </p>
      <Equation label={tx(t, "mPow_eqLaws", "The laws, for whole-number exponents")}
        where={[
          [r`b^m \cdot b^n = b^{m+n}`, tx(t, "mPow_wProd", "product: m copies then n copies make m + n copies. Only for the same base: 2³ · 3² has no shortcut")],
          [r`b^m / b^n = b^{m-n}`, tx(t, "mPow_wQuot", "quotient (b ≠ 0): n copies cancel from top and bottom")],
          [r`(b^m)^n = b^{m \cdot n}`, tx(t, "mPow_wPow", "power of a power: n groups of m copies")],
          [r`(a b)^n = a^n b^n`, tx(t, "mPow_wProdBase", "power of a product: each factor gets the exponent. The same for a quotient, (a/b)ⁿ = aⁿ/bⁿ")],
        ]}
        note={tx(t, "mPow_eqLawsNote", "There is no law for sums: (a + b)² is not a² + b². Multiplied out, (a + b)(a + b) = a² + 2ab + b²; the missing 2ab is the two rectangles in the corner of a square with side a + b. For a = 3, b = 4: (3 + 4)² = 49, but 3² + 4² = 25.")}>
        {r`b^m b^n = b^{m+n} \qquad \frac{b^m}{b^n} = b^{m-n} \qquad (b^m)^n = b^{mn} \qquad (ab)^n = a^n b^n`}
      </Equation>

      <H3>{tx(t, "mPow_zeroTitle", "Zero and negative exponents")}</H3>
      <p>
        {tx(t, "mPow_zeroBody",
          "\"Zero copies of 2 multiplied together\" does not obviously mean anything, and neither does \"minus two copies\". But look at the pattern 2³ = 8, 2² = 4, 2¹ = 2: every step down in the exponent divides by 2. Continue it: 2⁰ = 1, 2⁻¹ = 1/2, 2⁻² = 1/4. These are the only values that keep the quotient law working: 2³ / 2³ must be both 1 and 2³⁻³ = 2⁰, and 2⁰ / 2² must be both 1/4 and 2⁻². So they are not new rules, just the old ones extended. The figure's first mode walks the pattern in both directions.")}
      </p>
      <Equation label={tx(t, "mPow_eqNeg", "Zero and negative exponents")}
        where={[
          [r`b^0 = 1`, tx(t, "mPow_wZero", "for any b ≠ 0: the empty product, just as an empty sum is 0. By convention 0⁰ = 1 too, which keeps formulas such as the binomial theorem working")],
          [r`b^{-n} = \frac{1}{b^n}`, tx(t, "mPow_wNeg", "a negative exponent means \"divide by that many copies\": the reciprocal. It does not make the number negative: 2⁻³ = 1/8 = 0.125")],
        ]}
        note={tx(t, "mPow_eqNegNote", "So 10⁻³ = 1/1000 = 0.001, a thousandth, and 2⁻¹⁰ = 1/1024. Dividing by a power and multiplying by the negative power are the same operation, which is how x / 8 can be written x · 2⁻³.")}>
        {r`b^0 = 1 \qquad b^{-n} = \frac{1}{b^n} \qquad \left(\frac{a}{b}\right)^{-n} = \left(\frac{b}{a}\right)^{n}`}
      </Equation>

      <H2>{tx(t, "mPow_sciTitle", "Powers of ten and scientific notation")}</H2>
      <p>
        {tx(t, "mPow_sciBody",
          "Multiplying by 10ⁿ moves the decimal point n places to the right; multiplying by 10⁻ⁿ moves it n places to the left. Scientific notation uses that to write any number as a value between 1 and 10 times a power of ten: the speed of light is 3 × 10⁸ m/s, a nanosecond is 1 × 10⁻⁹ s. The exponent tells you the size at a glance, the first part gives the digits. Multiplying two such numbers multiplies the first parts and adds the exponents: (3 × 10⁸) × (2 × 10⁻⁹) = 6 × 10⁻¹. Calculators display 3 × 10⁸ as 3E8.")}
      </p>
      <Equation label={tx(t, "mPow_eqSci", "Scientific notation")}
        where={[
          [r`m`, tx(t, "mPow_wM", "the significand, 1 ≤ m < 10: the significant digits. 0.00042 has significand 4.2")],
          [r`k`, tx(t, "mPow_wK", "the exponent, a whole number: how many places the point moved. Left for large numbers (k > 0), right for small ones (k < 0): 0.00042 = 4.2 × 10⁻⁴")],
        ]}
        note={tx(t, "mPow_eqSciNote", "The metric prefixes are named powers of ten: kilo 10³, mega 10⁶, giga 10⁹; milli 10⁻³, micro 10⁻⁶, nano 10⁻⁹. A red blood cell is about 8 micrometres = 8 × 10⁻⁶ m across; the Earth is about 1.27 × 10⁷ m across. Dividing, (1.27 × 10⁷)/(8 × 10⁻⁶) ≈ 0.16 × 10¹³ = 1.6 × 10¹²: the Earth is over a trillion blood cells wide. When the significand leaves [1, 10), shift the point and adjust the exponent to match.")}>
        {r`x = m \times 10^{k} \qquad 1 \le m < 10`}
      </Equation>

      <H2>{tx(t, "mPow_rootTitle", "Square roots")}</H2>
      <p>
        {tx(t, "mPow_rootBody",
          "Squaring turns a side into an area; the square root turns an area back into a side. √49 = 7 because 7² = 49: a square of area 49 has side 7. Every positive number has two numbers that square to it, 7 and −7, and the symbol √ means the non-negative one, the principal root. That makes √(x²) = |x|, not x: √((−7)²) = √49 = 7. Negative numbers have no real square root, because no real number squared is negative (the Complex Numbers chapter, in the Linear Algebra section, invents numbers that do).")}
      </p>
      <Equation label={tx(t, "mPow_eqRoot", "The square root")}
        where={[
          [r`\sqrt{x}`, tx(t, "mPow_wRoot", "for x ≥ 0: the number r ≥ 0 with r² = x")],
          [r`\sqrt{ab} = \sqrt{a}\,\sqrt{b}`, tx(t, "mPow_wRootProd", "for a, b ≥ 0. Both sides squared give ab. Likewise √(a/b) = √a / √b")],
          [r`\sqrt{a + b} \ne \sqrt{a} + \sqrt{b}`, tx(t, "mPow_wRootSum", "there is no rule for sums: √(9 + 16) = √25 = 5, but √9 + √16 = 7. This is the same fact as (a + b)² ≠ a² + b²")],
        ]}
        note={tx(t, "mPow_eqRootNote", "The product rule simplifies roots: pull out the largest perfect-square factor. √72 = √(36 × 2) = √36 · √2 = 6√2. The numbers 1, 4, 9, 16, 25, 36, 49, 64, 81, 100 … are the perfect squares, the squares of whole numbers; the square root of any other whole number is irrational, an endless non-repeating decimal like √2 = 1.41421356….")}>
        {r`\sqrt{x} = r \iff r^2 = x,\; r \ge 0 \qquad \sqrt{x^2} = |x|`}
      </Equation>
      <p>
        {tx(t, "mPow_estBody",
          "To estimate a root, find the perfect squares on either side. 50 is between 49 = 7² and 64 = 8², so √50 is between 7 and 8, and much nearer 7: about 7 + 1/(2 × 7) ≈ 7.07. (That small correction comes from (7 + d)² = 49 + 14d + d², where d² is tiny, so 14d ≈ 1.) The figure's second mode shows a square growing with its area.")}
      </p>

      <H3>{tx(t, "mPow_nthTitle", "Cube roots and n-th roots")}</H3>
      <p>
        {tx(t, "mPow_nthBody",
          "The cube root ∛x is the number whose cube is x: ∛125 = 5, the side of a cube with volume 125. In general the n-th root ⁿ√x undoes the n-th power. Odd roots exist for negative numbers too, because an odd power keeps the sign: ∛(−8) = −2. Even roots of negative numbers do not exist among the real numbers. The Exponents & Logarithms chapter shows that a root is itself a power, with a fractional exponent: √x = x^(1/2) and ⁿ√x = x^(1/n).")}
      </p>

      <PowerFigure t={t} />

      <H2>{tx(t, "mPow_heronTitle", "Computing a square root")}</H2>
      <p>
        {tx(t, "mPow_heronBody",
          "How does a calculator find √10? One of the oldest algorithms, used in Babylon almost 4000 years ago and later described by Heron of Alexandria, needs only division and averaging. Guess any positive g. If g is too big, 10/g is too small, and the other way round, because their product is exactly 10. The true root lies between them, so take their average as the next guess. Each step roughly doubles the number of correct digits.")}
      </p>
      <Equation label={tx(t, "mPow_eqHeron", "Heron's method")}
        where={[
          [r`x`, tx(t, "mPow_wX", "the number whose square root we want, x > 0")],
          [r`g_k`, tx(t, "mPow_wG", "the k-th guess. g₀ can be anything positive; x itself or x/2 works")],
          [r`\tfrac{x}{g_k}`, tx(t, "mPow_wXg", "the partner of the guess: a rectangle with sides gₖ and x/gₖ always has area x")],
        ]}
        note={tx(t, "mPow_eqHeronNote", "For √10 from g₀ = 3: g₁ = (3 + 10/3)/2 = 3.1667, g₂ = (3.1667 + 3.1579)/2 = 3.16228, already correct to five decimals (√10 = 3.162278…). Geometrically, each step reshapes a rectangle of area x to be more square; the side of the final square is √x. It is Newton's method, from the calculus chapters, applied to g² − x = 0.")}>
        {r`g_{k+1} = \frac{1}{2}\left(g_k + \frac{x}{g_k}\right)`}
      </Equation>
      <H2>{tx(t, "mPow_squaringTitle", "Big powers by hand: repeated squaring")}</H2>
      <p>
        {tx(t, "mPow_squaringBody",
          "Computing 3⁸ as 3 × 3 × 3 × 3 × 3 × 3 × 3 × 3 takes seven multiplications. The power-of-a-power law gives a shortcut: 3⁸ = ((3²)²)², so square three times, 3² = 9, 9² = 81, 81² = 6561. For an exponent that is not a power of two, split it into powers of two with the product law: 3¹³ = 3⁸ · 3⁴ · 3¹, because 13 = 8 + 4 + 1, and 3⁴ and 3⁸ were already on the way. Five multiplications instead of twelve.")}
      </p>
      <Equation label={tx(t, "mPow_eqSquaring", "2¹⁰ by squaring")}
        notes={[
          tx(t, "mPow_sq1", "10 = 8 + 2, so 2¹⁰ = 2⁸ · 2²"),
          tx(t, "mPow_sq2", "square repeatedly: 2² = 4, 4² = 16 = 2⁴, 16² = 256 = 2⁸"),
          tx(t, "mPow_sq3", "multiply the pieces you need: 256 × 4 = 1024"),
        ]}>
        {r`2^{10} = 2^{8} \cdot 2^{2} = \left((2^2)^2\right)^2 \cdot 2^2 = 256 \cdot 4 = 1024`}
      </Equation>

      <H2>{tx(t, "mPow_gamesTitle", "Squares and roots in the world")}</H2>
      <p>
        {tx(t, "mPow_gamesBody",
          "The distance between two points is a square root, √(dx² + dy²), by Pythagoras (Geometry section). To decide which of two distances is bigger you do not need the roots: for non-negative numbers, a < b exactly when a² < b², so comparing the squares gives the same answer. A lamp's light fades with the inverse square of distance, 1/d², because the same light spreads over a sphere whose surface area grows as d². And a square field of 1 hectare = 10 000 m² has side √10 000 = 100 m, while a field of 2 hectares has side √20 000 ≈ 141 m, not 200 m: doubling an area multiplies the side only by √2.")}
      </p>

      <H2>{tx(t, "mPow_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mPow_ex1T", "Simplifying with the laws")}</H3>
      <p>
        {tx(t, "mPow_ex1",
          "Simplify 2⁵ × 4³ / 8². Write every base as a power of 2: 4 = 2², 8 = 2³. Then 4³ = 2⁶ and 8² = 2⁶, so the expression is 2⁵ × 2⁶ / 2⁶ = 2⁵⁺⁶⁻⁶ = 2⁵ = 32.")}
      </p>
      <H3>{tx(t, "mPow_ex2T", "A light three times as far")}</H3>
      <p>
        {tx(t, "mPow_ex2",
          "A lamp gives brightness 1 at 2 m. At 6 m the distance is 3 times larger, so the brightness is 1/3² = 1/9 of it, about 0.11. To get the brightness back to 1 at 6 m the light would need to be 9 times stronger.")}
      </p>
      <H3>{tx(t, "mPow_ex3T", "Simplifying and estimating a root")}</H3>
      <p>
        {tx(t, "mPow_ex3",
          "√200 = √(100 × 2) = 10√2 ≈ 10 × 1.414 = 14.14. As a check: 14² = 196 and 15² = 225, so √200 is just above 14.")}
      </p>

      <H2>{tx(t, "mPow_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPow_tWrong", "Wrong"), tx(t, "mPow_tRight", "Right"), tx(t, "mPow_tWhy", "Why")]}
        rows={[
          ["(a + b)² = a² + b²", "a² + 2ab + b²", tx(t, "mPow_m1", "powers do not distribute over sums")],
          ["√(a² + b²) = a + b", tx(t, "mPow_m2r", "no simpler form"), tx(t, "mPow_m2", "roots do not distribute over sums either: √(9 + 16) = 5, not 7")],
          ["2⁻³ = −8", "2⁻³ = 1/8", tx(t, "mPow_m3", "a negative exponent is a reciprocal, not a negative number")],
          ["2³ · 2⁴ = 2¹²", "2³ · 2⁴ = 2⁷", tx(t, "mPow_m4", "multiplying powers adds exponents; multiplying exponents is a power of a power")],
          ["√(x²) = x", "√(x²) = |x|", tx(t, "mPow_m5", "√ always returns the non-negative root")],
          ["(2³)² = 2⁹", "(2³)² = 2⁶", tx(t, "mPow_m6", "a power of a power multiplies exponents; 2 to the power 3² = 2⁹ is a different expression")],
          ["0.1² = 0.2", "0.1² = 0.01", tx(t, "mPow_m7", "squaring multiplies, it does not double; a number between 0 and 1 gets smaller when squared")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mPow_tip", "Squaring a sum or taking the root of a sum is where most algebra slips happen. When unsure, test with small numbers: if a formula says (3 + 4)² = 3² + 4², compute both sides, 49 and 25, and the mistake shows itself.")}
      </Callout>

      <KeyIdeas t={t} id="mPow" items={[
        "bⁿ is n copies of b multiplied; area scales with the square of size, volume with the cube.",
        "Same base: multiply → add exponents, divide → subtract, power of a power → multiply.",
        "b⁰ = 1 and b⁻ⁿ = 1/bⁿ keep those laws working; a negative exponent is a reciprocal.",
        "Scientific notation m × 10ᵏ, 1 ≤ m < 10, writes any size compactly; to multiply, multiply the m parts and add the exponents.",
        "√x is the non-negative number whose square is x; √(ab) = √a√b but √(a + b) ≠ √a + √b.",
        "Heron: average g and x/g repeatedly. Big powers: square repeatedly. For non-negative numbers, comparing squares is comparing the numbers.",
      ]} />
    </Article>
  );
}
