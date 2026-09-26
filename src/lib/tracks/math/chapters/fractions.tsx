"use client";

// Arithmetic 3: fractions and decimals — what a fraction means, equivalent
// fractions and simplifying, comparing, the four operations with fractions,
// decimals as fractions over powers of ten, terminating and repeating
// expansions, and rounding.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { FractionFigure } from "@/components/lesson/figures/math/FractionFigure";
import { DecimalFigure } from "@/components/lesson/figures/math/DecimalFigure";

const r = String.raw;

export function FractionsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mFrac_intro",
          "Whole numbers count things; fractions measure the parts in between. Half a second of invulnerability, three quarters of a health bar, a texture coordinate of 0.25, an aspect ratio of 16/9: games are full of quantities that are not whole. This chapter builds fractions from the idea of cutting a whole into equal parts, derives every rule for computing with them from pictures rather than memorising them, and then shows how decimals are just fractions in disguise, including why some of them never end.")}
      </Lead>

      <H2>{tx(t, "mFrac_whatTitle", "What a fraction is")}</H2>
      <p>
        {tx(t, "mFrac_whatBody",
          "Cut a whole, a bar, a pizza, the segment from 0 to 1 on the number line, into b equal parts. Each part is one b-th of the whole, written 1/b. Taking a of those parts gives the fraction a/b. The bottom number, the denominator, names the size of the parts (it \"denominates\" them: thirds, quarters, tenths). The top number, the numerator, counts how many parts you have. So 3/4 is three parts, each a quarter of the whole.")}
      </p>
      <Equation label={tx(t, "mFrac_eqDef", "A fraction")}
        where={[
          [r`a`, tx(t, "mFrac_wNum", "the numerator: how many parts are taken. Any integer")],
          [r`b`, tx(t, "mFrac_wDen", "the denominator: into how many equal parts the whole is cut. Any integer except 0 (a whole cannot be cut into zero parts)")],
          [r`a \div b`, tx(t, "mFrac_wDiv", "a fraction is also a division: 3/4 is what each person gets when 3 pizzas are shared by 4 people. Both readings give the same point on the number line")],
        ]}
        note={tx(t, "mFrac_eqDefNote", "When a < b the fraction is less than 1 (a proper fraction). When a ≥ b it is 1 or more (an improper fraction): 7/4 is seven quarters, one whole (4/4) and 3/4 more, sometimes written as the mixed number 1¾. In calculations, improper fractions are easier to work with; mixed numbers are only for reading. A negative fraction can put its sign anywhere: −3/4 = (−3)/4 = 3/(−4).")}>
        {r`\frac{a}{b} = a \div b \qquad b \neq 0`}
      </Equation>

      <H2>{tx(t, "mFrac_eqTitle", "Equivalent fractions and simplifying")}</H2>
      <p>
        {tx(t, "mFrac_eqBody",
          "Cut every quarter of a bar in half. You now have eighths, and the 3 quarters you had are 6 eighths: 3/4 = 6/8. The amount did not change, only the size of the slices. In general, multiplying the numerator and the denominator by the same non-zero number gives an equivalent fraction, the same point on the number line with a different name. Going the other way, dividing both by a common factor, is called simplifying (or reducing). A fraction is in lowest terms when no number bigger than 1 divides both.")}
      </p>
      <Equation label={tx(t, "mFrac_eqEquiv", "Equivalent fractions")}
        where={[
          [r`k`, tx(t, "mFrac_wK", "any non-zero number. Multiplying both parts by k cuts each slice into k thinner slices and takes k times as many")],
          [r`\gcd(a, b)`, tx(t, "mFrac_wGcd", "the greatest common divisor: the largest whole number that divides both a and b exactly. Dividing both by it gives lowest terms in one step. gcd(12, 18) = 6, so 12/18 = 2/3")],
        ]}
        note={tx(t, "mFrac_eqEquivNote", "Without knowing the gcd you can simplify in small steps: 12/18 → divide both by 2 → 6/9 → divide both by 3 → 2/3. Finding the gcd quickly (Euclid's algorithm) and prime factors are the topic of the divisibility chapter later in this section.")}>
        {r`\frac{a}{b} = \frac{a \cdot k}{b \cdot k} \qquad \frac{12}{18} = \frac{12 \div 6}{18 \div 6} = \frac{2}{3}`}
      </Equation>

      <H3>{tx(t, "mFrac_cmpTitle", "Comparing fractions")}</H3>
      <p>
        {tx(t, "mFrac_cmpBody",
          "With the same denominator, the slices are the same size and the bigger numerator wins: 5/8 > 3/8. With the same numerator, the smaller denominator wins, because its slices are bigger: 1/3 > 1/4. Otherwise rewrite both over a common denominator. A shortcut that does exactly that: compare a·d with c·b (cross-multiplying), which are the numerators both fractions get over the denominator b·d.")}
      </p>
      <Equation label={tx(t, "mFrac_eqCmp", "Cross-multiplication (b, d > 0)")}
        where={[
          [r`a \cdot d`, tx(t, "mFrac_wAd", "the numerator of a/b rewritten over b·d")],
          [r`c \cdot b`, tx(t, "mFrac_wCb", "the numerator of c/d rewritten over b·d")],
        ]}
        note={tx(t, "mFrac_eqCmpNote", "Is 5/7 bigger than 2/3? 5 · 3 = 15 and 2 · 7 = 14, so 5/7 > 2/3 (15/21 against 14/21). The comparison uses only integer multiplication, so in code it is exact, with no rounding. It needs positive denominators: multiplying by a negative number would flip the comparison.")}>
        {r`\frac{a}{b} < \frac{c}{d} \iff a\,d < c\,b`}
      </Equation>

      <H2>{tx(t, "mFrac_opsTitle", "Computing with fractions")}</H2>
      <H3>{tx(t, "mFrac_addTitle", "Adding and subtracting")}</H3>
      <p>
        {tx(t, "mFrac_addBody",
          "You can only count parts together when they are the same size: 1/3 + 1/3 = 2/3, two thirds. Thirds and quarters cannot be counted together directly, so first rewrite both over a common denominator, a number both denominators divide into. Any common multiple works; the smallest one, the least common multiple (lcm), keeps the numbers small. Then add or subtract the numerators and keep the denominator.")}
      </p>
      <Equation label={tx(t, "mFrac_eqAdd", "Adding fractions")}
        where={[
          [r`b\,d`, tx(t, "mFrac_wBd", "a common denominator that always works: the product of the two denominators")],
          [r`a\,d,\; c\,b`, tx(t, "mFrac_wAdCb", "the numerators after rewriting: a/b = (a·d)/(b·d) and c/d = (c·b)/(d·b)")],
        ]}
        note={tx(t, "mFrac_eqAddNote", "Example: 1/4 + 1/6. With b·d = 24: 6/24 + 4/24 = 10/24 = 5/12. With the lcm, 12: 3/12 + 2/12 = 5/12 directly. Subtraction works the same way: 3/4 − 1/6 = 9/12 − 2/12 = 7/12. Never add denominators: 1/2 + 1/2 is 2/2 = 1, not 2/4.")}>
        {r`\frac{a}{b} + \frac{c}{d} = \frac{a\,d + c\,b}{b\,d}`}
      </Equation>

      <H3>{tx(t, "mFrac_mulTitle", "Multiplying")}</H3>
      <p>
        {tx(t, "mFrac_mulBody",
          "Multiplying by a fraction means taking that fraction of something: 2/3 × 3/4 is \"two thirds of three quarters\". The word \"of\" between a fraction and an amount always means ×: half of 10 is ½ × 10 = 5. The area picture in the figure shows why the rule is so simple: tops multiply to count the shaded cells, bottoms multiply to count all the cells.")}
      </p>
      <Equation label={tx(t, "mFrac_eqMul", "Multiplying fractions")}
        where={[
          [r`a\,c`, tx(t, "mFrac_wAc", "the number of cells in the overlap of a columns and c rows")],
          [r`b\,d`, tx(t, "mFrac_wBd2", "the number of cells the whole is cut into")],
        ]}
        note={tx(t, "mFrac_eqMulNote", "Simplify before multiplying when you can: in 2/3 × 3/4 the 3 on top and the 3 below cancel, and the 2 and the 4 share a 2, leaving 1/2. A whole number n is the fraction n/1, so 5 × 2/3 = 10/3. Multiplying by a fraction smaller than 1 makes a number smaller, which is exactly how scaling by 0.5 works.")}>
        {r`\frac{a}{b} \times \frac{c}{d} = \frac{a\,c}{b\,d}`}
      </Equation>

      <H3>{tx(t, "mFrac_divTitle", "Dividing")}</H3>
      <p>
        {tx(t, "mFrac_divBody",
          "Dividing asks how many times one amount fits into another. How many halves fit into 3? Six: 3 ÷ ½ = 6. That matches multiplying by 2, the reciprocal of ½. The reciprocal of c/d is d/c, the fraction you multiply c/d by to get 1. Since division undoes multiplication, dividing by c/d is the same as multiplying by d/c.")}
      </p>
      <Equation label={tx(t, "mFrac_eqDiv", "Dividing fractions")}
        where={[
          [r`\tfrac{d}{c}`, tx(t, "mFrac_wRecip", "the reciprocal of c/d, which exists only when c ≠ 0: c/d × d/c = (c·d)/(d·c) = 1")],
        ]}
        note={tx(t, "mFrac_eqDivNote", "Example: 3/4 ÷ 1/8 = 3/4 × 8/1 = 24/4 = 6. Six eighths fit into three quarters. Dividing by a number between 0 and 1 gives a bigger result, which surprises people at first: small pieces fit many times.")}>
        {r`\frac{a}{b} \div \frac{c}{d} = \frac{a}{b} \times \frac{d}{c} = \frac{a\,d}{b\,c}`}
      </Equation>

      <FractionFigure t={t} />

      <H2>{tx(t, "mFrac_decTitle", "Decimals")}</H2>
      <p>
        {tx(t, "mFrac_decBody",
          "Decimals extend place value to the right of the units. Each position to the right of the decimal point is worth a tenth of the one before it: tenths, hundredths, thousandths. So 0.375 = 3/10 + 7/100 + 5/1000 = 375/1000. Every decimal that ends is therefore a fraction whose denominator is a power of ten, and that is the whole connection between the two notations.")}
      </p>
      <Equation label={tx(t, "mFrac_eqDec", "A decimal is a fraction over a power of ten")}
        where={[
          [r`d_1, d_2, d_3`, tx(t, "mFrac_wDigits", "the digits after the point: tenths, hundredths, thousandths")],
          [r`10^k`, tx(t, "mFrac_wPow", "1 followed by k zeros, where k is the number of digits after the point. 0.375 has 3, so it is 375/10³ = 375/1000 = 3/8")],
        ]}
        note={tx(t, "mFrac_eqDecNote", "Multiplying by 10 shifts every digit one place left, which looks like moving the point right: 0.375 × 10 = 3.75. Dividing by 10 moves it left. That is why metric conversions (and percentages, in the next chapter) are so easy.")}>
        {r`0.d_1 d_2 d_3 = \frac{d_1}{10} + \frac{d_2}{100} + \frac{d_3}{1000} = \frac{d_1 d_2 d_3}{10^3}`}
      </Equation>

      <H3>{tx(t, "mFrac_convTitle", "From fraction to decimal, and why some never end")}</H3>
      <p>
        {tx(t, "mFrac_convBody",
          "To turn a/b into a decimal, divide: long division produces one digit per step. At each step the remainder is less than b, so there are only b possible remainders. Either the remainder becomes 0 and the decimal ends (it terminates), or a remainder comes back, and then the same digits come back in the same order forever (it repeats). 1/8 = 0.125 ends; 1/3 = 0.333… and 1/7 = 0.142857142857… repeat. A bar over the repeating block is the usual notation: 1/7 = 0.1̅4̅2̅8̅5̅7̅.")}
      </p>
      <p>
        {tx(t, "mFrac_convRule",
          "Which fractions end? A decimal that ends is n/10ᵏ, and 10 = 2 × 5, so its denominator can only contain the prime factors 2 and 5. Reduce the fraction to lowest terms and look at the denominator: if it is built only from 2s and 5s (like 8 = 2³ or 20 = 2² × 5), the decimal ends; any other prime factor (3, 7, 11 …) makes it repeat. The same rule in base 2, with only the factor 2 allowed, is why 1/10 cannot be stored exactly in a computer: switch the figure to base 2.")}
      </p>

      <DecimalFigure t={t} />

      <H3>{tx(t, "mFrac_backTitle", "From a repeating decimal back to a fraction")}</H3>
      <Equation label={tx(t, "mFrac_eqRep", "Shifting away the repeating part")}
        notes={[
          tx(t, "mFrac_rep1", "call the number x: x = 0.272727…"),
          tx(t, "mFrac_rep2", "the block \"27\" has 2 digits, so multiply by 10² = 100: 100x = 27.272727…"),
          tx(t, "mFrac_rep3", "subtract the first line from the second: the infinite tails are identical and cancel, leaving 99x = 27"),
          tx(t, "mFrac_rep4", "divide: x = 27/99 = 3/11. The same trick shows 0.999… = 9/9 = 1 exactly: they are two names for the same number"),
        ]}>
        {r`100x - x = 27.\overline{27} - 0.\overline{27} \;\Rightarrow\; 99x = 27 \;\Rightarrow\; x = \tfrac{27}{99} = \tfrac{3}{11}`}
      </Equation>

      <H2>{tx(t, "mFrac_roundTitle", "Rounding")}</H2>
      <p>
        {tx(t, "mFrac_roundBody",
          "A repeating or very long decimal has to be cut off somewhere, and so does any measured or computed quantity you show to a player. Rounding to a given number of decimal places keeps that many digits and looks at the next one: 5 or more rounds up, less than 5 rounds down. 2.346 to two places is 2.35; 2.344 is 2.34. Truncating instead simply drops the extra digits, always toward zero: 2.349 truncates to 2.34. Programs offer several kinds of rounding, and picking the wrong one is a classic off-by-one.")}
      </p>
      <LessonTable
        headers={[tx(t, "mFrac_tFn", "C++"), tx(t, "mFrac_tRule", "Rule"), "2.5", "−2.5", "2.7", "−2.7"]}
        rows={[
          ["std::floor", tx(t, "mFrac_floor", "down, toward −∞"), "2", "−3", "2", "−3"],
          ["std::ceil", tx(t, "mFrac_ceil", "up, toward +∞"), "3", "−2", "3", "−2"],
          ["std::trunc, (int)x", tx(t, "mFrac_trunc", "toward 0: drop the fraction"), "2", "−2", "2", "−2"],
          ["std::round", tx(t, "mFrac_round", "nearest; halves away from 0"), "3", "−3", "3", "−3"],
          ["std::nearbyint", tx(t, "mFrac_rint", "nearest; halves to the even neighbour (the default rounding mode)"), "2", "−2", "3", "−3"],
        ]}
      />
      <p>
        {tx(t, "mFrac_roundPlaces",
          "To round to k decimal places, scale, round and scale back: round(x × 10ᵏ) / 10ᵏ. For display, prefer the formatting functions (std::format(\"{:.2f}\", x)), because the scaled result is itself stored in binary and may print as 2.3500000000000001.")}
      </p>

      <H2>{tx(t, "mFrac_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mFrac_ex1T", "Frame budget")}</H3>
      <p>
        {tx(t, "mFrac_ex1",
          "At 60 frames per second each frame gets 1/60 of a second. Physics takes 1/4 of that and rendering 1/2. What is left for everything else? 1 − 1/4 − 1/2 = 4/4 − 1/4 − 2/4 = 1/4 of the frame, and 1/4 × 1/60 = 1/240 s ≈ 4.17 ms.")}
      </p>
      <H3>{tx(t, "mFrac_ex2T", "How many bullets fit?")}</H3>
      <p>
        {tx(t, "mFrac_ex2",
          "A magazine holds 7/2 seconds of fire and each burst lasts 3/8 s. 7/2 ÷ 3/8 = 7/2 × 8/3 = 56/6 = 28/3 = 9⅓: nine full bursts, and a third of one more.")}
      </p>
      <H3>{tx(t, "mFrac_ex3T", "Exact comparison in code")}</H3>
      <p>
        {tx(t, "mFrac_ex3",
          "Two players have win ratios 13/20 and 21/32. As decimals they are 0.65 and 0.65625, but in code you can compare them exactly with integers: 13 · 32 = 416 < 21 · 20 = 420, so the second player is ahead.")}
      </p>

      <CodeBlock lang="cpp" filename="fraction.hpp" t={t}>{`#include <numeric>   // std::gcd, std::lcm (C++17)

struct Fraction {
    long long num, den;   // invariant: den > 0 and gcd(num, den) == 1
    Fraction(long long n, long long d = 1) : num(n), den(d) {
        if (den < 0) { num = -num; den = -den; }        // keep the sign on top
        long long g = std::gcd(num, den);               // gcd(0, d) = d, so 0 becomes 0/1
        if (g > 1) { num /= g; den /= g; }
    }
};
Fraction operator+(Fraction a, Fraction b) { return { a.num * b.den + b.num * a.den, a.den * b.den }; }
Fraction operator-(Fraction a, Fraction b) { return { a.num * b.den - b.num * a.den, a.den * b.den }; }
Fraction operator*(Fraction a, Fraction b) { return { a.num * b.num, a.den * b.den }; }
Fraction operator/(Fraction a, Fraction b) { return { a.num * b.den, a.den * b.num }; }   // b must not be 0
bool operator<(Fraction a, Fraction b)     { return a.num * b.den < b.num * a.den; }     // cross-multiply
double toDouble(Fraction f)                { return double(f.num) / double(f.den); }

// The integer-division trap: both operands are ints, so the fraction is thrown away
float half  = 1 / 2;      // 0.0f !
float half2 = 1.0f / 2;   // 0.5f: one float operand makes it a float division`}</CodeBlock>

      <H2>{tx(t, "mFrac_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mFrac_tWrong", "Wrong"), tx(t, "mFrac_tRight", "Right"), tx(t, "mFrac_tWhy", "Why")]}
        rows={[
          ["1/2 + 1/3 = 2/5", "1/2 + 1/3 = 5/6", tx(t, "mFrac_m1", "denominators name the slice size; they are never added")],
          ["(2 + 3)/3 = 2 + 1", "(2 + 3)/3 = 5/3", tx(t, "mFrac_m2", "you may only cancel factors of the whole top and bottom, not a term of a sum")],
          ["3 ÷ ½ = 1.5", "3 ÷ ½ = 6", tx(t, "mFrac_m3", "dividing by ½ asks how many halves fit into 3; it is multiplying by the reciprocal, 2 (halving would be × ½)")],
          ["0.1 × 3 == 0.3 in code", tx(t, "mFrac_m4r", "compare with a tolerance"), tx(t, "mFrac_m4", "0.1 repeats in binary, so it is stored rounded")],
          ["float x = 3 / 4;", "float x = 3.0f / 4;", tx(t, "mFrac_m5", "int / int is integer division: 3 / 4 is 0")],
        ]}
      />

      <KeyIdeas t={t} id="mFrac" items={[
        "a/b means a parts of size 1/b, and also a ÷ b; the denominator is never 0.",
        "Multiplying or dividing top and bottom by the same number keeps the value; divide by the gcd to reach lowest terms.",
        "Add and subtract over a common denominator; multiply tops and bottoms; divide by multiplying by the reciprocal.",
        "Compare a/b and c/d (b, d > 0) exactly with integers: a·d versus c·b.",
        "A decimal is a fraction over a power of ten; a/b ends only if the reduced denominator has no primes but 2 and 5, otherwise it repeats.",
        "In base 2 only denominators that are powers of 2 end, which is why 0.1 is inexact in a float.",
        "In C++, int / int discards the fraction; know which rounding function you need.",
      ]} />
    </Article>
  );
}
