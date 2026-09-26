"use client";

// Arithmetic (last): numbers inside the computer — integer division and
// modulo, fixed-width integers and two's complement, and IEEE 754 floating
// point. Binary itself is taught in the bases chapter just before.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FloatFigure } from "@/components/lesson/figures/math/FloatFigure";

const r = String.raw;

export function NumbersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mNum_intro",
          "The previous chapters worked with ideal numbers: as many digits as needed, no limits. A computer stores every number in a fixed number of bits, and that has consequences: integers that wrap around, divisions that round the \"wrong\" way for negative numbers, and decimals that are never quite exact. This chapter looks at how integers and real numbers are really stored, and ends inside a 32-bit float.")}
      </Lead>

      <H2>{tx(t, "mNum_divTitle", "Integer division and the modulo trap")}</H2>
      <p>
        {tx(t, "mNum_divBody",
          "Dividing integers in C++, C#, Java or GLSL gives an integer: the fraction is thrown away by truncating toward zero. 7 / 2 = 3 and −7 / 2 = −3. The remainder operator % is defined to match, so that (a / b) · b + a % b = a always holds: 7 % 2 = 1 but −7 % 2 = −1. For positive numbers this is exactly what you expect. For negative numbers it is a classic source of bugs, because games usually want floor division: the tile that contains x = −0.5 in a grid of 1-unit tiles is tile −1, not tile 0.")}
      </p>
      <Equation label={tx(t, "mNum_eqMod", "Floor division and a modulo that is never negative")}
        where={[
          [r`\lfloor x \rfloor`, tx(t, "mNum_wFloor", "floor: the largest integer ≤ x. ⌊2.7⌋ = 2, ⌊−2.7⌋ = −3 (rounding toward −∞, not toward 0)")],
          [r`a \bmod n`, tx(t, "mNum_wMod", "the mathematical modulo: the remainder in [0, n) for n > 0. −7 mod 3 = 2, because −7 = 3·(−3) + 2")],
        ]}
        note={tx(t, "mNum_eqModNote", "In C++, ((a % n) + n) % n gives the mathematical modulo for n > 0: the inner % may be negative, adding n makes it positive, the outer % brings n back to 0. Use it to wrap array indices (i − 1 for i = 0 becomes the last element) and angles.")}>
        {r`\text{tile}(x) = \left\lfloor \frac{x}{s} \right\rfloor \qquad a \bmod n = a - n\left\lfloor \frac{a}{n} \right\rfloor`}
      </Equation>
      <CodeBlock lang="cpp" filename="floor_mod.hpp" t={t}>{`int floorDiv(int a, int n) { int q = a / n; return (a % n != 0 && ((a < 0) != (n < 0))) ? q - 1 : q; }
int wrap(int a, int n)     { return ((a % n) + n) % n; }      // result in [0, n) for n > 0

int tileX = int(std::floor(worldX / tileSize));   // floats: std::floor, never a cast
int prev  = wrap(i - 1, count);                   // i = 0 → count - 1`}</CodeBlock>

      <H2>{tx(t, "mNum_intTitle", "Integers in memory")}</H2>
      <p>
        {tx(t, "mNum_intBody",
          "An unsigned integer is stored as its plain binary digits, as in the previous chapter: n bits hold 0 … 2ⁿ − 1, which is 0–255 for 8 bits, 0–65 535 for 16 and about 4.29 billion for 32. Types have fixed widths (uint8_t, int32_t, uint64_t), and every result is cut back to that width. Negative numbers need a way to store the sign.")}
      </p>
      <p>
        {tx(t, "mNum_twosBody",
          "Negative integers use two's complement: the highest bit counts as −2ⁿ⁻¹ instead of +2ⁿ⁻¹. For 8 bits, 1111 1111 is −128 + 127 = −1, and the range is −128 … 127. Its great property is that addition works identically for positive and negative numbers, so the hardware needs only one adder. To negate, flip all the bits and add one: −x = ~x + 1. When a result goes past the largest value it wraps around to the smallest: 127 + 1 = −128 in 8 bits. For unsigned integers that wrap-around is well defined; for signed integers in C++ it is undefined behaviour, and the compiler may assume it never happens.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mNum_overflowWarn", "Overflow bugs are real: Pac-Man's famous \"kill screen\" at level 256 comes from an 8-bit level counter wrapping to 0, and Windows 95 and 98 could hang after 49.7 days of uptime because a 32-bit millisecond counter wrapped. A frame counter at 60 FPS in a signed 32-bit int overflows after 414 days. Compute differences between timestamps (now − then), which stay correct across a wrap for unsigned counters, instead of comparing timestamps directly.")}
      </Callout>

      <H2>{tx(t, "mNum_floatTitle", "Floating point")}</H2>
      <p>
        {tx(t, "mNum_floatBody",
          "Integers cannot store 0.5 or 6.02 × 10²³. Floating-point numbers borrow the idea of scientific notation: store a few significant digits and, separately, where the point goes. The IEEE 754 standard, which every modern CPU and GPU implements, does this in binary. A 32-bit float (float in C++, the default in shaders) splits its bits into a sign, an 8-bit exponent and a 23-bit fraction.")}
      </p>
      <Equation label={tx(t, "mNum_eqFloat", "The value of a normal float32")}
        where={[
          [r`s`, tx(t, "mNum_wS", "the sign bit: 0 for positive, 1 for negative")],
          [r`e`, tx(t, "mNum_wE", "the 8-bit exponent field, read as an unsigned number 0–255. Storing e = exponent + 127 (a bias) lets the field represent exponents from −126 to +127 without its own sign bit. e = 0 and e = 255 are reserved for special values")],
          [r`m`, tx(t, "mNum_wM", "the 23-bit fraction (mantissa) field, read as an integer 0 … 2²³ − 1")],
          [r`1 + m / 2^{23}`, tx(t, "mNum_wSig", "the significand, between 1 and 2. In binary a normalised number always starts with 1, so that 1 is not stored (the \"hidden bit\"), giving 24 significant bits for the price of 23")],
        ]}
        note={tx(t, "mNum_eqFloatNote", "Example: 0.75 = 1.5 × 2⁻¹, so s = 0, e = −1 + 127 = 126, and the fraction is 0.5, stored as m = 2²² (the first fraction bit set). A 64-bit double uses 1 + 11 + 52 bits: about 16 significant decimal digits instead of about 7.")}>
        {r`v = (-1)^{s} \times \left(1 + \frac{m}{2^{23}}\right) \times 2^{\,e - 127}`}
      </Equation>

      <FloatFigure t={t} />

      <H3>{tx(t, "mNum_precTitle", "Precision: 24 bits, wherever the number is")}</H3>
      <p>
        {tx(t, "mNum_precBody",
          "A float always has 24 significant bits, about 7 decimal digits. The distance between one float and the next, called a ULP (unit in the last place), therefore grows with the size of the number: every time the exponent goes up by one, the gap doubles. Between 1 and 2 the gap is 2⁻²³ ≈ 1.19 × 10⁻⁷ (this value is called machine epsilon); between 1024 and 2048 it is about 0.000122; between 8 388 608 and 16 777 216 it is exactly 1, so floats past 2²⁴ cannot even represent every integer.")}
      </p>
      <Equation label={tx(t, "mNum_eqUlp", "Gap between neighbouring floats")}
        where={[
          [r`x`, tx(t, "mNum_wX", "a (positive, normal) float")],
          [r`\lfloor \log_2 x \rfloor`, tx(t, "mNum_wLog", "its exponent: which power-of-two band [2ᵏ, 2ᵏ⁺¹) it falls in (logarithms are explained two chapters from now)")],
          [r`\varepsilon = 2^{-23}`, tx(t, "mNum_wEps", "machine epsilon for float32: the gap just above 1")],
        ]}
        note={tx(t, "mNum_eqUlpNote", "The relative precision, gap / x, stays roughly constant at about 10⁻⁷. The absolute precision does not. For a game world measured in metres, positions near the origin are precise to fractions of a micrometre, positions 100 km away only to about 8 mm, which is enough for animation joints and physics contacts to visibly jitter. Switch the figure to \"precision far away\".")}>
        {r`\operatorname{ulp}(x) = 2^{\lfloor \log_2 x \rfloor}\cdot\varepsilon`}
      </Equation>
      <p>
        {tx(t, "mNum_origin",
          "Large worlds fix this in one of two ways. A floating origin periodically shifts the whole world so the player is back near (0, 0, 0), keeping everything the player can see precise (Kerbal Space Program is a famous example). Or positions are stored in doubles (Unreal Engine 5's Large World Coordinates) and converted to floats relative to the camera just before rendering, since the GPU works in float.")}
      </p>

      <H3>{tx(t, "mNum_exactTitle", "Why 0.1 + 0.2 ≠ 0.3")}</H3>
      <p>
        {tx(t, "mNum_exactBody",
          "In base 10 you cannot write 1/3 exactly: 0.333… goes on forever. In base 2 the same happens to 1/10, because 10 has a factor of 5 that 2 lacks. So 0.1 is stored as the nearest float, 0.100000001490116…, and 0.2 and 0.3 are also slightly off, each by a different amount. The sum of the stored 0.1 and 0.2 is rounded again, and lands on a neighbour of the stored 0.3 rather than on it. The lesson is not that floats are broken: every operation is correctly rounded to the nearest representable value. The lesson is never to test floats computed in different ways for exact equality.")}
      </p>
      <CodeBlock lang="cpp" filename="compare.hpp" t={t}>{`// Absolute tolerance: good near zero, useless for big numbers
bool nearlyEqualAbs(float a, float b, float eps = 1e-5f) { return std::fabs(a - b) <= eps; }

// Relative tolerance: scales with the size of the numbers
bool nearlyEqual(float a, float b, float rel = 1e-5f, float abs = 1e-8f) {
    float diff = std::fabs(a - b);
    return diff <= abs || diff <= rel * std::max(std::fabs(a), std::fabs(b));
}

// Never:  if (x == 0.3f)      Usually fine:  if (x <= 0.f), if (count == 3)`}</CodeBlock>

      <H3>{tx(t, "mNum_specialTitle", "Special values")}</H3>
      <LessonTable
        headers={[tx(t, "mNum_tVal", "Value"), tx(t, "mNum_tBits", "Bits"), tx(t, "mNum_tFrom", "Comes from"), tx(t, "mNum_tBeware", "Watch out")]}
        rows={[
          ["±0", tx(t, "mNum_z0", "e = 0, m = 0"), tx(t, "mNum_z1", "underflow, −1 × 0"), tx(t, "mNum_z2", "−0 == 0 is true, but 1/−0 = −∞ and atan2(0, −0) = π")],
          ["±∞", tx(t, "mNum_i0", "e = 255, m = 0"), tx(t, "mNum_i1", "overflow, x / 0 for x ≠ 0"), tx(t, "mNum_i2", "∞ − ∞ and 0 × ∞ give NaN")],
          ["NaN", tx(t, "mNum_n0", "e = 255, m ≠ 0"), tx(t, "mNum_n1", "0/0, √−1, acos(1.0000001), normalising a zero vector"), tx(t, "mNum_n2", "NaN ≠ NaN; every operation with NaN gives NaN, so one bad value spreads through a whole simulation. Test with std::isnan")],
          [tx(t, "mNum_s", "subnormal"), tx(t, "mNum_s0", "e = 0, m ≠ 0"), tx(t, "mNum_s1", "numbers below 2⁻¹²⁶ ≈ 1.2 × 10⁻³⁸"), tx(t, "mNum_s2", "can be 10–100× slower on some CPUs; audio and physics code often enables flush-to-zero")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "mNum_cancelTip", "Subtracting two nearly equal numbers loses precision (catastrophic cancellation): 1.0000001 − 1.0000000 keeps only the one or two digits in which they differ. Rearranging a formula often avoids it. For example 1 − cos x for a tiny angle x is 0 in float, but the equal expression 2 sin²(x/2) is accurate. The same idea gives the numerically stable quadratic formula in the Quadratics chapter.")}
      </Callout>

      <KeyIdeas t={t} id="mNum" items={[
        "C++ integer / and % truncate toward zero; use floor division and ((a % n) + n) % n for grids and wrapping.",
        "n bits hold 2ⁿ values; signed integers use two's complement; unsigned overflow wraps.",
        "float = sign × 1.fraction × 2^(exponent − 127): 24 significant bits, ~7 decimal digits.",
        "The gap between floats grows with magnitude: precision is relative, not absolute.",
        "Never compare computed floats with ==; watch for NaN, ∞ and cancellation.",
      ]} />
    </Article>
  );
}
