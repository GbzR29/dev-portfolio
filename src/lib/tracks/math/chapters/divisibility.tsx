"use client";

// Arithmetic 5: division with remainder, divisibility and its quick tests,
// primes and the sieve of Eratosthenes, prime factorisation, the gcd by
// Euclid's algorithm, the lcm, and remainders as clock arithmetic.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DivisibilityFigure } from "@/components/lesson/figures/math/DivisibilityFigure";

const r = String.raw;

export function DivisibilityContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mDiv_intro",
          "Some questions about whole numbers have nothing to do with size and everything to do with how they split: can 36 chairs be set out in 5 equal rows? What is the biggest square tile that covers a 48 × 36 floor exactly? Two lighthouses flash every 6 and every 8 seconds; after how long do they flash together again? The answers come from divisibility, prime numbers, the greatest common divisor and the least common multiple. This chapter builds all four from ordinary division, and they are used immediately: the gcd reduces fractions, the lcm finds common denominators.")}
      </Lead>

      <H2>{tx(t, "mDiv_remTitle", "Division with remainder")}</H2>
      <p>
        {tx(t, "mDiv_remBody",
          "Before fractions, division of whole numbers already had an answer: 17 sweets shared between 5 children gives each child 3, and 2 are left over. The 3 is the quotient, the 2 the remainder. The remainder is always smaller than the divisor, otherwise every child could have been given one more. This \"how many whole times, and what is left\" is the starting point of the whole chapter.")}
      </p>
      <Equation label={tx(t, "mDiv_eqRem", "Division with remainder")}
        where={[
          [r`a`, tx(t, "mDiv_wA", "the dividend: the number being divided (17)")],
          [r`b`, tx(t, "mDiv_wB", "the divisor, a whole number greater than 0 (5)")],
          [r`q`, tx(t, "mDiv_wQ", "the quotient: how many whole times b fits into a (3)")],
          [r`r`, tx(t, "mDiv_wR", "the remainder: what is left, always 0 ≤ r < b (2)")],
        ]}
        note={tx(t, "mDiv_eqRemNote", "For every whole number a and every b > 0 there is exactly one such pair q, r. Check: 3 × 5 + 2 = 17. The rule 0 ≤ r < b also settles negative dividends: −17 = (−4) × 5 + 3, so the quotient is −4 and the remainder 3. The quotient is the whole number just below −17/5 = −3.4 (rounded down, toward −∞), which keeps the remainder positive.")}>
        {r`a = q \cdot b + r \qquad 0 \le r < b`}
      </Equation>

      <H2>{tx(t, "mDiv_divTitle", "Divisors and multiples")}</H2>
      <p>
        {tx(t, "mDiv_divBody",
          "When the remainder is 0 the division is exact, and we say b divides a, written b | a (the vertical bar is read \"divides\"). Then b is a divisor (or factor) of a, and a is a multiple of b. 3 | 12 because 12 = 4 × 3; 5 does not divide 12, written 5 ∤ 12. The divisors of 12 are 1, 2, 3, 4, 6 and 12; the multiples of 12 are 0, 12, 24, 36 … and go on forever. Two edge cases: 1 divides every number, and every number divides 0 (0 = 0 × b).")}
      </p>
      <p>
        {tx(t, "mDiv_pairBody",
          "Divisors come in pairs: if d divides n then so does n/d, and one of the two is at most √n (if both were bigger, their product would be bigger than n). For 36: 1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6. So to list every divisor of n you only need to try the numbers up to √n, and each hit gives you its partner for free. The same observation makes prime testing fast, below.")}
      </p>

      <H3>{tx(t, "mDiv_testTitle", "Quick tests")}</H3>
      <p>
        {tx(t, "mDiv_testBody",
          "A few tests decide divisibility without doing the division. They work because of place value: 10, 100, 1000 … are all multiples of 2 and 5, so only the last digit matters for them; and 10 = 9 + 1, 100 = 99 + 1, so each power of ten leaves remainder 1 when divided by 9 (or by 3), which makes the remainder of the whole number equal to the remainder of its digit sum.")}
      </p>
      <LessonTable
        headers={[tx(t, "mDiv_tBy", "Divisible by"), tx(t, "mDiv_tWhen", "When"), tx(t, "mDiv_tEx", "Example")]}
        rows={[
          ["2", tx(t, "mDiv_t2", "the last digit is even (0, 2, 4, 6, 8)"), "538"],
          ["3", tx(t, "mDiv_t3", "the digit sum is divisible by 3"), tx(t, "mDiv_t3e", "471: 4 + 7 + 1 = 12")],
          ["4", tx(t, "mDiv_t4", "the number formed by the last two digits is divisible by 4"), tx(t, "mDiv_t4e", "1 316: 16 = 4 × 4")],
          ["5", tx(t, "mDiv_t5", "the last digit is 0 or 5"), "2 745"],
          ["6", tx(t, "mDiv_t6", "divisible by both 2 and 3"), tx(t, "mDiv_t6e", "474: even, 4 + 7 + 4 = 15")],
          ["9", tx(t, "mDiv_t9", "the digit sum is divisible by 9"), tx(t, "mDiv_t9e", "3 861: 3 + 8 + 6 + 1 = 18")],
          ["10", tx(t, "mDiv_t10", "the last digit is 0"), "4 190"],
        ]}
      />

      <H2>{tx(t, "mDiv_primeTitle", "Prime numbers")}</H2>
      <p>
        {tx(t, "mDiv_primeBody",
          "A prime is a whole number greater than 1 whose only divisors are 1 and itself: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 … A number greater than 1 that is not prime is composite: it can be written as a product of two smaller numbers, like 15 = 3 × 5. The number 1 is neither: it has only one divisor, and excluding it keeps the factorisation below unique. 2 is the only even prime, since every other even number has 2 as a divisor.")}
      </p>
      <p>
        {tx(t, "mDiv_sieveBody",
          "The sieve of Eratosthenes, from about 240 BC, finds every prime up to a limit N without a single division. Write out 2 … N. The first number not crossed out, 2, is prime; cross out all its multiples. The next number still standing, 3, is prime; cross out its multiples. Repeat. Crossing can start at p², because the smaller multiples of p (2p, 3p …) have a smaller factor and were already crossed. For the same reason you can stop as soon as p² > N: everything still standing is prime. For N = 100 that means only 2, 3, 5 and 7 need to be sieved.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mDiv_infinite", "There is no largest prime. Euclid's proof: suppose p₁, p₂ … pₖ were all the primes, and form N = p₁ · p₂ ⋯ pₖ + 1. Dividing N by any of the pᵢ leaves remainder 1, so none of them divides it. But N > 1 has at least one prime factor, which must therefore be missing from the list: a contradiction.")}
      </Callout>

      <H2>{tx(t, "mDiv_factTitle", "Prime factorisation")}</H2>
      <p>
        {tx(t, "mDiv_factBody",
          "Keep splitting a composite number into smaller factors and you must eventually stop, with only primes left: 360 = 2 × 180 = 2 × 2 × 90 = … = 2 × 2 × 2 × 3 × 3 × 5. The fundamental theorem of arithmetic says this list of primes is the same whichever split you start with; only the order can differ. Primes are the atoms of multiplication, and the factorisation is a number's complete recipe: every divisor of 360 is some selection of those same atoms.")}
      </p>
      <Equation label={tx(t, "mDiv_eqFact", "Prime factorisation")}
        where={[
          [r`p_1 < p_2 < \dots < p_k`, tx(t, "mDiv_wP", "the distinct primes that divide n, in increasing order")],
          [r`e_i`, tx(t, "mDiv_wE", "the exponent of pᵢ: how many times it appears in the product (a power, pᵉ, is e copies of p multiplied, as the next chapter explains)")],
          [r`(e_1 + 1)\cdots(e_k + 1)`, tx(t, "mDiv_wCount", "the number of divisors of n: a divisor picks 0 to eᵢ copies of each pᵢ, which is eᵢ + 1 choices per prime")],
        ]}
        note={tx(t, "mDiv_eqFactNote", "360 = 2³ × 3² × 5¹ has (3 + 1)(2 + 1)(1 + 1) = 24 divisors. Finding the factorisation by trial division: divide by 2 as long as it goes, then by 3, then 5, and so on, and stop when the divisor squared passes what is left; whatever is left then (if more than 1) is itself prime.")}>
        {r`n = p_1^{e_1}\, p_2^{e_2} \cdots p_k^{e_k} \qquad \#\text{divisors} = (e_1 + 1)(e_2 + 1)\cdots(e_k + 1)`}
      </Equation>

      <DivisibilityFigure t={t} />

      <H2>{tx(t, "mDiv_gcdTitle", "The greatest common divisor")}</H2>
      <p>
        {tx(t, "mDiv_gcdBody",
          "The greatest common divisor gcd(a, b) is the largest number that divides both a and b. gcd(48, 36) = 12. It answers every \"largest equal pieces\" question: the largest square tile that covers a 48 × 36 room exactly is 12 × 12, and dividing a fraction's top and bottom by their gcd reduces it to lowest terms in one step. When gcd(a, b) = 1 the numbers share no factor and are called coprime; 8 and 15 are coprime although neither is prime.")}
      </p>
      <p>
        {tx(t, "mDiv_gcdFact",
          "With both factorisations in hand, the gcd takes each shared prime with the smaller of its two exponents: 48 = 2⁴ × 3 and 36 = 2² × 3², so gcd = 2² × 3 = 12. But factorising large numbers is slow. Euclid's algorithm, over 2300 years old and still the fastest method by hand, needs no factorisation at all.")}
      </p>
      <Equation label={tx(t, "mDiv_eqEuclid", "Euclid's algorithm")}
        where={[
          [r`a \bmod b`, tx(t, "mDiv_wMod", "a mod b, read \"a modulo b\": the remainder r when a is divided by b")],
          [r`\gcd(a, 0) = a`, tx(t, "mDiv_wStop", "the stopping rule: every number divides 0, so the largest common divisor of a and 0 is a itself")],
        ]}
        note={tx(t, "mDiv_eqEuclidNote", "Why it works: a = q·b + r. Any number that divides a and b also divides r = a − q·b, and any number that divides b and r also divides a = q·b + r. So the pair (a, b) and the pair (b, r) have exactly the same common divisors, hence the same gcd, and the numbers shrink every step. gcd(48, 36) = gcd(36, 12) = gcd(12, 0) = 12. Geometrically: cut the biggest possible squares off a 48 × 36 rectangle; the leftover strip is 12 × 36; cut squares off that; the last square size that fits exactly is the gcd. The figure draws this.")}>
        {r`\gcd(a, b) = \gcd(b,\; a \bmod b) \qquad \gcd(a, 0) = a`}
      </Equation>

      <H2>{tx(t, "mDiv_lcmTitle", "The least common multiple")}</H2>
      <p>
        {tx(t, "mDiv_lcmBody",
          "The least common multiple lcm(a, b) is the smallest positive number that both a and b divide. lcm(6, 8) = 24: the multiples of 6 are 6, 12, 18, 24 …, the multiples of 8 are 8, 16, 24 …, and 24 is the first one on both lists. It answers every \"when do they line up again\" question: two lighthouses flashing every 6 and every 8 seconds, starting together, flash together again every 24 seconds. It is also the least common denominator when adding fractions: 1/6 + 1/8 = 4/24 + 3/24 = 7/24.")}
      </p>
      <Equation label={tx(t, "mDiv_eqLcm", "The lcm from the gcd")}
        where={[
          [r`\operatorname{lcm}(a, b)`, tx(t, "mDiv_wLcm", "the least common multiple of positive whole numbers a and b")],
          [r`\gcd(a, b)`, tx(t, "mDiv_wGcd", "their greatest common divisor, from Euclid's algorithm")],
        ]}
        note={tx(t, "mDiv_eqLcmNote", "In factorisations, the lcm takes each prime with the larger of its two exponents, the gcd with the smaller, and between them they use every copy exactly once, which is why gcd × lcm = a × b. Example: gcd(6, 8) = 2, so lcm(6, 8) = 6 × 8 / 2 = 24. By hand, divide first to keep the numbers small: 6 ÷ 2 × 8 = 3 × 8 = 24.")}>
        {r`\operatorname{lcm}(a, b) = \frac{a \cdot b}{\gcd(a, b)}`}
      </Equation>

      <H2>{tx(t, "mDiv_clockTitle", "Remainders as clock arithmetic")}</H2>
      <p>
        {tx(t, "mDiv_clockBody",
          "A clock face counts hours modulo 12: 5 hours after 9 o'clock it is 2 o'clock, because 9 + 5 = 14 and 14 mod 12 = 2. Whenever a quantity goes round in a cycle of length n, only the remainder mod n matters. What day of the week is it 100 days after a Monday? 100 = 14 × 7 + 2, so 100 whole weeks bring you back to Monday 14 times and 2 more days remain: Wednesday. Going backwards works the same way with a negative number and a remainder kept between 0 and n − 1: 10 days before a Monday is −10 = (−2) × 7 + 4, four days after Monday, a Friday.")}
      </p>
      <Equation label={tx(t, "mDiv_eqCong", "Congruence: same remainder")}
        where={[
          [r`a \equiv b \pmod{n}`, tx(t, "mDiv_wCong", "\"a is congruent to b modulo n\": a and b leave the same remainder when divided by n, which is the same as saying n divides a − b. 14 ≡ 2 (mod 12)")],
          [r`n`, tx(t, "mDiv_wN", "the modulus, the length of the cycle: 12 for hours, 7 for weekdays, 10 for the last digit of a number")],
        ]}
        note={tx(t, "mDiv_eqCongNote", "Sums and products can be reduced at any step: to find the last digit of 37 × 58, only the last digits matter, 7 × 8 = 56, so the answer ends in 6 (37 × 58 = 2146). The divisibility test for 9 is this rule too: 10 ≡ 1 (mod 9), so every power of ten is ≡ 1 and a number is ≡ its digit sum.")}>
        {r`a \equiv b \pmod{n} \iff n \mid (a - b)`}
      </Equation>
      <p>
        {tx(t, "mDiv_strideBody",
          "The gcd decides what happens when you walk round a cycle in fixed steps. On a 12-hour clock, jumping 5 hours at a time from 12 visits 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7, 12: every hour, because gcd(5, 12) = 1. Jumping 4 at a time visits only 4, 8, 12, because gcd(4, 12) = 4 and the walk can only land on multiples of 4. In general, steps of k round a cycle of n positions visit n / gcd(k, n) different positions, so all of them exactly when k and n are coprime. When two cycles run side by side, such as the two lighthouses, the combined pattern repeats after the lcm of their lengths.")}
      </p>

      <H2>{tx(t, "mDiv_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mDiv_ex1T", "Reducing a fraction")}</H3>
      <p>
        {tx(t, "mDiv_ex1",
          "Reduce 84/126. Euclid: 126 = 1 × 84 + 42, then 84 = 2 × 42 + 0, so gcd = 42. Dividing both by 42 gives 2/3 in one step. By factorisation: 84 = 2² × 3 × 7 and 126 = 2 × 3² × 7; shared, with the smaller exponents: 2 × 3 × 7 = 42.")}
      </p>
      <H3>{tx(t, "mDiv_ex2T", "Tiling a room")}</H3>
      <p>
        {tx(t, "mDiv_ex2",
          "A floor is 48 dm × 36 dm and must be covered by equal square tiles with no cutting. The tile side must divide both 48 and 36, and the largest such side is gcd(48, 36) = 12. That gives 48/12 × 36/12 = 4 × 3 = 12 tiles. Any common divisor (1, 2, 3, 4, 6, 12) also works, with more, smaller tiles.")}
      </p>
      <H3>{tx(t, "mDiv_ex3T", "Three bus lines")}</H3>
      <p>
        {tx(t, "mDiv_ex3",
          "Buses on three lines leave the station every 4, 6 and 10 minutes, and all three leave together at 8:00. They next leave together after lcm(4, 6, 10) minutes. Take the numbers two at a time: gcd(4, 6) = 2, so lcm(4, 6) = 4 × 6 / 2 = 12; then gcd(12, 10) = 2, so lcm(12, 10) = 120/2 = 60. They meet again at 9:00. By factorisation: 4 = 2², 6 = 2 × 3, 10 = 2 × 5, and the largest exponents give 2² × 3 × 5 = 60. If the third line ran every 11 minutes instead, lcm(12, 11) = 132 minutes, and they would meet at 10:12.")}
      </p>

      <H3>{tx(t, "mDiv_ex4T", "Is 221 prime?")}</H3>
      <p>
        {tx(t, "mDiv_ex4",
          "Only primes up to √221 need testing, and √221 is a little under 15 (15² = 225). 221 is odd, so not 2. Digit sum 2 + 2 + 1 = 5, so not 3. It does not end in 0 or 5, so not 5. 221 = 31 × 7 + 4, so not 7. 221 = 20 × 11 + 1, so not 11. 221 = 17 × 13 exactly. So 221 is composite, 13 × 17, even though none of the quick tests caught it. Had every prime up to 13 failed, 221 would have been proven prime.")}
      </p>

      <H2>{tx(t, "mDiv_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mDiv_tWrong", "Wrong"), tx(t, "mDiv_tRight", "Right"), tx(t, "mDiv_tWhy", "Why")]}
        rows={[
          [tx(t, "mDiv_m1w", "1 is prime"), tx(t, "mDiv_m1r", "1 is neither prime nor composite"), tx(t, "mDiv_m1", "a prime has exactly two divisors; 1 has one")],
          ["lcm(a, b) = a × b", "a × b / gcd(a, b)", tx(t, "mDiv_m2", "a × b is a common multiple, but only the least one when a and b are coprime")],
          ["gcd(12, 18) = 36", "gcd = 6, lcm = 36", tx(t, "mDiv_m3", "the gcd divides both numbers, so it is never bigger than the smaller one; 36 is the lcm")],
          [tx(t, "mDiv_m4w", "test 97 by 2, 3, 4 … 96"), tx(t, "mDiv_m4r", "test by 2, 3, 5, 7 only"), tx(t, "mDiv_m4", "divisors pair up around √97 ≈ 9.8, and only primes need testing: if 4 divided it, 2 would too")],
          [tx(t, "mDiv_m5w", "coprime means both prime"), tx(t, "mDiv_m5r", "gcd = 1"), tx(t, "mDiv_m5", "8 and 15 share no factor, so they are coprime though neither is prime; 3 and 6 are not coprime")],
        ]}
      />

      <KeyIdeas t={t} id="mDiv" items={[
        "a = q·b + r with 0 ≤ r < b; b divides a (b | a) when r = 0.",
        "Divisors pair up as d and n/d, so testing up to √n is enough.",
        "A prime has exactly two divisors, 1 and itself; every n > 1 factors into primes in exactly one way.",
        "gcd(a, b) = gcd(b, a mod b), gcd(a, 0) = a: Euclid's algorithm, no factoring needed.",
        "lcm(a, b) = a / gcd(a, b) × b; gcd is \"largest equal pieces\", lcm is \"when do they line up\".",
        "Remainders are clock arithmetic: steps of k round a cycle of n visit every position exactly when gcd(k, n) = 1.",
      ]} />
    </Article>
  );
}
