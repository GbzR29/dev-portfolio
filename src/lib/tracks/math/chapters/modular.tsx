"use client";

// Arithmetic 8: modular arithmetic — reducing sums, differences and products
// at any step; negative numbers; powers mod n by their cycle and by repeated
// squaring; why the divisibility tests work; the modular inverse (when it
// exists, by the table and by extended Euclid) and linear congruences;
// Fermat's little theorem; check digits (ISBN-13 and ISBN-10).

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { ModularFigure } from "@/components/lesson/figures/math/ModularFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: a power reduced by its cycle ───────────────────────────────

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function powerMod(v: Record<string, number>) {
  const a = v.a, k = v.k, n = v.n;
  let x = 1;
  for (let i = 0; i < k; i++) x = (x * a) % n;
  if (gcd(a, n) !== 1) return { tex: r`${a}^{${k}} \equiv \green{${x}} \pmod{${n}}` };
  let L = 1;
  for (let y = a % n; y !== 1; y = (y * a) % n) L++;          // the cycle length: first L with aᴸ ≡ 1
  const q = Math.floor(k / L), rem = k % L;
  return { tex: r`${a}^{${L}} \equiv 1 \;\Rightarrow\; ${a}^{${k}} = (${a}^{${L}})^{${q}}\cdot ${a}^{${rem}} \equiv ${a}^{${rem}} \equiv \green{${x}} \pmod{${n}}` };
}

export function ModularContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mMod_intro",
          "The Divisibility chapter ended with clock arithmetic: when something goes round in a cycle of length n, only the remainder mod n matters. This chapter turns that idea into a way of calculating. You can add, subtract and multiply remainders, and reduce at any step, so the numbers never grow. That makes it easy to find the last digit of 7¹⁰⁰, or its remainder mod 13, without ever writing 7¹⁰⁰ out. It also explains why the divisibility tests work. Division turns out to be the tricky operation, and the answer to it leads to Fermat's little theorem and to the check digits printed on every book.")}
      </Lead>

      <Goals t={t} id="mMod" items={[
        "Add, subtract and multiply mod n, reducing at any step.",
        "Find a huge power mod n from the cycle of its powers.",
        "Explain the divisibility tests for 3, 9 and 11 with congruences.",
        "Decide when a number has an inverse mod n, find it, and solve ax ≡ b (mod n).",
        "Use Fermat's little theorem, and check an ISBN.",
      ]} />

      <H2>{tx(t, "mMod_rulesTitle", "Calculating mod n")}</H2>
      <p>
        {tx(t, "mMod_rulesBody",
          "Recall the notation: a ≡ b (mod n) means that a and b leave the same remainder when divided by n, or in other words that n divides a − b. The number n is called the modulus. The key fact is that congruences survive addition, subtraction and multiplication. If you replace a number by another with the same remainder, the result keeps the same remainder. So you may reduce whenever you like.")}
      </p>
      <Equation label={tx(t, "mMod_eqRules", "Reducing at any step")}
        where={[
          [r`a \equiv a',\; b \equiv b'`, tx(t, "mMod_wSame", "a and a′ have the same remainder mod n, and so do b and b′: for example a′ is the remainder of a")],
          [r`\pm,\ \cdot`, tx(t, "mMod_wOps", "addition, subtraction and multiplication may all use the reduced numbers instead")],
        ]}
        words={tx(t, "mMod_rulesWords", "If two pairs of numbers have the same remainders, their sums, differences and products also have the same remainders.")}>
        {r`a \equiv a',\; b \equiv b' \pmod{n} \;\Rightarrow\; a \pm b \equiv a' \pm b',\quad ab \equiv a'b' \pmod{n}`}
      </Equation>
      <Derivation t={t} label={tx(t, "mMod_eqWhy", "Why products can be reduced")}
        steps={[
          { full: true, tex: r`a = a' + sn,\qquad b = b' + tn`, why: tx(t, "mMod_wy1", "same remainder means the difference is a multiple of n: s and t are whole numbers") },
          { full: true, tex: r`ab = a'b' + a'tn + b'sn + stn^2`, why: tx(t, "mMod_wy2", "multiply out the two brackets") },
          { full: true, tex: r`ab = a'b' + \amber{n\,(a't + b's + stn)}`, why: tx(t, "mMod_wy3", "every term after the first has a factor n") },
          { full: true, tex: r`\green{ab \equiv a'b' \pmod{n}}`, why: tx(t, "mMod_wy4", "ab and a′b′ differ by a multiple of n. Sums work the same way, with one line less") },
        ]} />
      <Derivation t={t} label={tx(t, "mMod_eqEx1", "(123 · 456 + 789) mod 7, without big numbers")}
        steps={[
          { full: true, tex: r`123 \equiv 4,\quad 456 \equiv 1,\quad 789 \equiv 5 \pmod 7`, why: tx(t, "mMod_e11", "reduce each number first: 123 = 17 · 7 + 4, 456 = 65 · 7 + 1, 789 = 112 · 7 + 5") },
          { full: true, tex: r`4 \cdot 1 + 5 = 9`, why: tx(t, "mMod_e12", "do the arithmetic with the small numbers") },
          { full: true, tex: r`9 \equiv \green{2} \pmod 7`, why: tx(t, "mMod_e13", "reduce again. Check: 123 · 456 + 789 = 56877 = 8125 · 7 + 2 ✓") },
        ]} />
      <p>
        {tx(t, "mMod_negBody",
          "Negative numbers are no problem: add n until the result lands between 0 and n − 1. So −3 ≡ 9 (mod 12): 3 hours before midnight is 9 o'clock. That is also how subtraction works on the circle: a − b is the number you must add to b to reach a.")}
      </p>

      <ModularFigure t={t} />

      <H2>{tx(t, "mMod_powTitle", "Powers mod n")}</H2>
      <p>
        {tx(t, "mMod_powBody",
          "A power is a long product, so it can be reduced after every factor. The values a¹, a², a³, … mod n can only take n different values, so sooner or later one repeats. From then on the powers go round a cycle. When gcd(a, n) = 1 the cycle comes back to 1. Once you know the cycle length L, only the remainder of the exponent mod L matters.")}
      </p>
      <Derivation t={t} label={tx(t, "mMod_eqEx2", "The last digit of 7¹⁰⁰")}
        steps={[
          { full: true, tex: r`7^1 \equiv 7,\quad 7^2 = 49 \equiv 9,\quad 7^3 \equiv 9 \cdot 7 = 63 \equiv 3,\quad 7^4 \equiv 3 \cdot 7 = 21 \equiv \amber{1} \pmod{10}`, why: tx(t, "mMod_e21", "the last digit is the remainder mod 10; multiply by 7 and reduce each time") },
          { full: true, tex: r`100 = 25 \cdot 4`, why: tx(t, "mMod_e22", "the cycle has length 4, so divide the exponent by 4") },
          { full: true, tex: r`7^{100} = (7^4)^{25} \equiv 1^{25} = \green{1} \pmod{10}`, why: tx(t, "mMod_e23", "7¹⁰⁰ ends in 1, though it has 85 digits") },
        ]} />
      <LiveFormula label={tx(t, "mMod_livePow", "Try it: a power mod n by its cycle")}
        tex={r`a^{k} \bmod n`}
        vars={[
          { id: "a", label: "a", min: 2, max: 12, step: 1, value: 7, fmt: v => String(v) },
          { id: "k", label: "k", min: 1, max: 200, step: 1, value: 100, fmt: v => String(v) },
          { id: "n", label: "n", min: 2, max: 20, step: 1, value: 10, fmt: v => String(v) },
        ]}
        compute={powerMod}
        note={tx(t, "mMod_livePowNote", "When gcd(a, n) = 1 the formula first finds the cycle length, the smallest power with aᴸ ≡ 1. Then it keeps only the remainder of k divided by that length. When a and n share a factor the powers never return to 1, and the formula just shows the result.")} />
      <H3>{tx(t, "mMod_sqTitle", "Repeated squaring")}</H3>
      <p>
        {tx(t, "mMod_sqBody",
          "When the cycle is long, square instead. Squaring aᵐ gives a²ᵐ, so a few squarings reach a¹, a², a⁴, a⁸, a¹⁶, …. Then write the exponent as a sum of these powers of 2, which is its binary form from the Number Bases chapter, and multiply the matching values.")}
      </p>
      <Derivation t={t} label={tx(t, "mMod_eqEx3", "3¹³ mod 7 by squaring")}
        steps={[
          { full: true, tex: r`3^1 \equiv 3,\quad 3^2 = 9 \equiv 2,\quad 3^4 \equiv 2^2 = 4,\quad 3^8 \equiv 4^2 = 16 \equiv 2 \pmod 7`, why: tx(t, "mMod_e31", "square the previous value and reduce: three squarings") },
          { full: true, tex: r`13 = 8 + 4 + 1`, why: tx(t, "mMod_e32", "13 in binary is 1101") },
          { full: true, tex: r`3^{13} = 3^8 \cdot 3^4 \cdot 3^1 \equiv 2 \cdot 4 \cdot 3 = 24 \equiv \green{3} \pmod 7`, why: tx(t, "mMod_e33", "exponents add when powers multiply") },
        ]} />

      <H2>{tx(t, "mMod_testsTitle", "Why the divisibility tests work")}</H2>
      <p>
        {tx(t, "mMod_testsBody",
          "A number written with digits is a sum of digits times powers of ten: 4752 = 4 · 10³ + 7 · 10² + 5 · 10 + 2. So its remainder mod n depends only on the remainders of 10, 100, 1000, … mod n. Each divisibility test comes from one simple fact about 10.")}
      </p>
      <LessonTable
        headers={[tx(t, "mMod_tN", "Divisor"), tx(t, "mMod_tFact", "Fact about 10"), tx(t, "mMod_tTest", "Test")]}
        rows={[
          ["2, 5, 10", "10 ≡ 0", tx(t, "mMod_r1", "every term except the last digit is ≡ 0: look at the last digit")],
          ["4, 25", "100 ≡ 0", tx(t, "mMod_r2", "look at the last two digits")],
          ["3, 9", "10 ≡ 1", tx(t, "mMod_r3", "every power of 10 is ≡ 1, so the number ≡ its digit sum")],
          ["11", "10 ≡ −1", tx(t, "mMod_r4", "powers of 10 are ≡ +1, −1, +1, …: the number ≡ the alternating digit sum, starting with + on the last digit")],
        ]}
      />
      <Equation label={tx(t, "mMod_eqNine", "The test for 9")}
        where={[
          [r`d_k \dots d_1 d_0`, tx(t, "mMod_wDigits", "the digits of N, d₀ the last one")],
          [r`10^i \equiv 1`, tx(t, "mMod_wTen", "because 10 ≡ 1 (mod 9), and powers of 1 are 1")],
        ]}
        words={tx(t, "mMod_nineWords", "A number has the same remainder mod 9 as the sum of its digits.")}
        note={tx(t, "mMod_nineNote", "4752: 4 + 7 + 5 + 2 = 18 ≡ 0, so 9 divides 4752 (it is 9 · 528). For 11: 918082 gives 2 − 8 + 0 − 8 + 1 − 9 = −22 ≡ 0, so 11 divides it (11 · 83462).")}>
        {r`N = \sum_{i} d_i \cdot 10^{i} \equiv \sum_{i} d_i \pmod 9`}
      </Equation>

      <H2>{tx(t, "mMod_invTitle", "Division: the inverse")}</H2>
      <p>
        {tx(t, "mMod_invBody",
          "Dividing by a means multiplying by a number x with a · x = 1. Mod n, such an x is called the inverse of a, written a⁻¹. Mod 7, 3 · 5 = 15 ≡ 1, so 3⁻¹ ≡ 5. But mod 12 the number 4 has no inverse at all: 4x is always one of 0, 4, 8 mod 12, never 1. The rule is that a has an inverse mod n exactly when gcd(a, n) = 1. Here is why: if ax − 1 = qn, any common divisor of a and n also divides ax − qn = 1.")}
      </p>
      <Equation label={tx(t, "mMod_eqInv", "The modular inverse")}
        where={[
          [r`a^{-1}`, tx(t, "mMod_wInv", "the inverse of a mod n: the number between 0 and n − 1 that multiplies a to 1")],
          [r`\gcd(a, n) = 1`, tx(t, "mMod_wCoprime", "a and n share no factor other than 1; then the inverse exists and is unique mod n")],
        ]}
        words={tx(t, "mMod_invWords", "a has a partner that multiplies it to 1 mod n exactly when a and n have no common factor.")}>
        {r`\exists\, a^{-1}:\ a \cdot a^{-1} \equiv 1 \pmod{n} \iff \gcd(a, n) = 1`}
      </Equation>
      <p>
        {tx(t, "mMod_euclidBody",
          "For small n you can try the candidates one by one, or read the inverse from the table in the figure. For larger n, run Euclid's algorithm from the Divisibility chapter and then work backwards. Writing the last remainder, 1, in terms of a and n gives the inverse. This is called the extended Euclidean algorithm.")}
      </p>
      <Derivation t={t} label={tx(t, "mMod_eqEx4", "7⁻¹ mod 26 by extended Euclid")}
        steps={[
          { full: true, tex: r`26 = 3 \cdot 7 + 5,\quad 7 = 1 \cdot 5 + 2,\quad 5 = 2 \cdot 2 + \amber{1}`, why: tx(t, "mMod_e41", "Euclid's algorithm on 26 and 7: the last non-zero remainder is 1, so the gcd is 1 and the inverse exists") },
          { full: true, tex: r`1 = 5 - 2 \cdot 2 = 5 - 2\,(7 - 5) = 3 \cdot 5 - 2 \cdot 7`, why: tx(t, "mMod_e42", "start from the last line and replace 2 using the line above it") },
          { full: true, tex: r`1 = 3\,(26 - 3 \cdot 7) - 2 \cdot 7 = 3 \cdot 26 - 11 \cdot 7`, why: tx(t, "mMod_e43", "replace 5 using the first line: now 1 is written with 26 and 7 only") },
          { full: true, tex: r`7 \cdot (-11) \equiv 1 \pmod{26}`, why: tx(t, "mMod_e44", "the multiple of 26 is ≡ 0, so drop it") },
          { full: true, tex: r`7^{-1} \equiv -11 \equiv \green{15} \pmod{26}`, why: tx(t, "mMod_e45", "add 26 to get a number from 0 to 25. Check: 7 · 15 = 105 = 4 · 26 + 1 ✓") },
        ]} />
      <p>
        {tx(t, "mMod_linBody",
          "With the inverse you can solve a linear congruence ax ≡ b (mod n), just as you solve ax = b by dividing by a. For 4x ≡ 3 (mod 9): 4 · 7 = 28 ≡ 1, so 4⁻¹ ≡ 7. Multiply both sides by 7: x ≡ 21 ≡ 3. Check: 4 · 3 = 12 ≡ 3 ✓.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mMod_cancelWarn", "You may not cancel a common factor that shares a divisor with n. 2 · 3 ≡ 2 · 9 (mod 12), since both sides are 6, but 3 ≢ 9. Cancelling a is allowed only when gcd(a, n) = 1, because that is multiplying by a⁻¹.")}
      </Callout>

      <H2>{tx(t, "mMod_fermatTitle", "Fermat's little theorem")}</H2>
      <p>
        {tx(t, "mMod_fermatBody",
          "When the modulus is a prime p, every a from 1 to p − 1 has an inverse, and the powers of a have a cycle length that always divides p − 1. Pierre de Fermat stated it in 1640: a to the power p − 1 is always 1. The proof uses the table in the figure. In a row a ≠ 0 of the multiplication table mod p, every value 1 … p − 1 appears exactly once.")}
      </p>
      <Equation label={tx(t, "mMod_eqFermat", "Fermat's little theorem")}
        where={[
          [r`p`, tx(t, "mMod_wP", "a prime number")],
          [r`p \nmid a`, tx(t, "mMod_wNot", "p does not divide a, that is a ≢ 0 (mod p)")],
        ]}
        words={tx(t, "mMod_fermatWords", "For a prime p, any number not divisible by p, raised to the power p minus one, leaves remainder 1 mod p.")}
        note={tx(t, "mMod_fermatNote", "So a · a^(p−2) ≡ 1: a^(p−2) is the inverse of a mod p. Example: 3⁵ = 243 = 34 · 7 + 5, so 3⁻¹ ≡ 5 (mod 7), as before.")}>
        {r`a^{p-1} \equiv 1 \pmod{p}`}
      </Equation>
      <Derivation t={t} label={tx(t, "mMod_eqProof", "Why it is true")}
        steps={[
          { full: true, tex: r`a\cdot 1,\; a\cdot 2,\; \dots,\; a\cdot(p-1)`, why: tx(t, "mMod_pr1", "multiply each of 1 … p − 1 by a") },
          { full: true, tex: r`\{a\cdot 1, \dots, a\cdot(p-1)\} \equiv \{1, 2, \dots, p-1\} \pmod{p}`, why: tx(t, "mMod_pr2", "none is 0, since p is prime and divides neither factor; and no two are equal, since ai ≡ aj would give i ≡ j after multiplying by a⁻¹") },
          { full: true, tex: r`a^{p-1}\,(p-1)! \equiv (p-1)! \pmod{p}`, why: tx(t, "mMod_pr3", "the products of both lists are therefore equal mod p; on the left, the p − 1 factors a come out in front") },
          { full: true, tex: r`\green{a^{p-1} \equiv 1 \pmod{p}}`, why: tx(t, "mMod_pr4", "(p − 1)! = 1 · 2 ⋯ (p − 1) has no factor p, so it has an inverse: multiply both sides by it") },
        ]} />
      <Derivation t={t} label={tx(t, "mMod_eqEx5", "2¹⁰⁰ mod 13 with Fermat")}
        steps={[
          { full: true, tex: r`2^{12} \equiv 1 \pmod{13}`, why: tx(t, "mMod_e51", "13 is prime and does not divide 2, so p − 1 = 12") },
          { full: true, tex: r`100 = 8 \cdot 12 + 4`, why: tx(t, "mMod_e52", "only the remainder of the exponent mod 12 matters") },
          { full: true, tex: r`2^{100} = (2^{12})^8 \cdot 2^4 \equiv 2^4 = 16 \equiv \green{3} \pmod{13}`, why: tx(t, "mMod_e53", "the eight factors 2¹² are each ≡ 1") },
        ]} />

      <H2>{tx(t, "mMod_checkTitle", "Check digits")}</H2>
      <p>
        {tx(t, "mMod_checkBody",
          "A book's ISBN-13 ends in a check digit, chosen so that a weighted sum of all 13 digits is ≡ 0 (mod 10). The weights alternate 1, 3, 1, 3, …. When someone types the number with one wrong digit, the sum changes by 1 or 3 times the error. Since 1 and 3 have inverses mod 10, that change is never ≡ 0, so the mistake is always caught.")}
      </p>
      <Derivation t={t} label={tx(t, "mMod_eqIsbn", "Checking ISBN 978-0-306-40615-7")}
        steps={[
          { full: true, tex: r`9,7,8,0,3,0,6,4,0,6,1,5,7 \qquad w = 1,3,1,3,\dots`, why: tx(t, "mMod_is1", "the 13 digits, and the weight w of each place") },
          { full: true, tex: r`9 + 21 + 8 + 0 + 3 + 0 + 6 + 12 + 0 + 18 + 1 + 15 + 7 = 100`, why: tx(t, "mMod_is2", "digit times weight, added up") },
          { full: true, tex: r`100 \equiv \green{0} \pmod{10}`, why: tx(t, "mMod_is3", "valid. Type 978-0-306-40625-7 by mistake and the sum becomes 101 ≢ 0: rejected") },
        ]} />
      <p>
        {tx(t, "mMod_isbn10Body",
          "One kind of slip gets through: swapping two neighbouring digits that differ by 5. The sum changes by 2 times their difference, and 2 · 5 = 10 ≡ 0. The older ISBN-10 used mod 11 with weights 10, 9, …, 1. Because 11 is prime, every weight and every difference has an inverse, and it caught every single wrong digit and every swap of neighbours. The price was an eleventh symbol: a check value of 10 is printed as X.")}
      </p>

      <MathPracticeFigure t={t} set="modular" />

      <H2>{tx(t, "mMod_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mMod_tWrong", "Wrong"), tx(t, "mMod_tRight", "Right"), tx(t, "mMod_tWhy", "Why")]}
        rows={[
          ["−3 mod 12 = −3", "9", tx(t, "mMod_m1", "a remainder is kept between 0 and n − 1: add n")],
          [tx(t, "mMod_m2w", "2x ≡ 2 (mod 12), so x ≡ 1"), "x ≡ 1 or 7", tx(t, "mMod_m2", "2 has no inverse mod 12, so it cannot be cancelled; 2 · 7 = 14 ≡ 2 too")],
          [tx(t, "mMod_m3w", "reducing the exponent mod n"), tx(t, "mMod_m3r", "mod the cycle length"), tx(t, "mMod_m3", "7¹⁰⁰ mod 10: reduce 100 mod 4, not mod 10")],
          [tx(t, "mMod_m4w", "aᵖ⁻¹ ≡ 1 for any modulus"), tx(t, "mMod_m4r", "only for a prime p"), tx(t, "mMod_m4", "mod 8: 3⁷ = 2187 ≡ 3, not 1")],
          [tx(t, "mMod_m5w", "every a ≠ 0 has an inverse"), tx(t, "mMod_m5r", "only if gcd(a, n) = 1"), tx(t, "mMod_m5", "4 · x mod 12 is only ever 0, 4 or 8")],
        ]}
      />

      <KeyIdeas t={t} id="mMod" items={[
        "a ≡ b (mod n) means the same remainder; sums, differences and products can be reduced at any step.",
        "Powers mod n end in a cycle; reduce the exponent by the cycle length, or use repeated squaring.",
        "The divisibility tests come from 10 ≡ 0, 1 or −1 mod the divisor.",
        "a⁻¹ mod n exists exactly when gcd(a, n) = 1; extended Euclid finds it, and it solves ax ≡ b.",
        "Fermat: aᵖ⁻¹ ≡ 1 (mod p) for a prime p not dividing a.",
        "Check digits make a weighted sum ≡ 0, so a single wrong digit is caught.",
      ]} />
    </Article>
  );
}
