"use client";

// Arithmetic 3: fractions and decimals — what a fraction means, equivalent
// fractions and simplifying, comparing, the four operations with fractions,
// decimals as fractions over powers of ten, terminating and repeating
// expansions, and rounding.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "Whole numbers count things; fractions measure the parts in between. Half an hour, three quarters of a cup of flour, a quarter of a pizza, a price of 2.35: everyday life is full of quantities that are not whole. This chapter builds fractions from the idea of cutting a whole into equal parts, derives every rule for computing with them from pictures rather than memorising them, and then shows how decimals are just fractions in disguise, including why some of them never end.")}
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
        note={tx(t, "mFrac_eqCmpNote", "Is 5/7 bigger than 2/3? 5 · 3 = 15 and 2 · 7 = 14, so 5/7 > 2/3 (15/21 against 14/21). The comparison uses only whole-number multiplication, so it is exact: no decimals, no rounding. It needs positive denominators: multiplying by a negative number would flip the comparison.")}>
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
        note={tx(t, "mFrac_eqMulNote", "Simplify before multiplying when you can: in 2/3 × 3/4 the 3 on top and the 3 below cancel, and the 2 and the 4 share a 2, leaving 1/2. A whole number n is the fraction n/1, so 5 × 2/3 = 10/3. Multiplying by a fraction smaller than 1 makes a number smaller: half of something is less than the whole of it.")}>
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
          "Which fractions end? A decimal that ends is n/10ᵏ, and 10 = 2 × 5, so its denominator can only contain the prime factors 2 and 5. Reduce the fraction to lowest terms and look at the denominator: if it is built only from 2s and 5s (like 8 = 2³ or 20 = 2² × 5), the decimal ends; any other prime factor (3, 7, 11 …) makes it repeat. The same reasoning works in any base. In base 2 (number bases get their own chapter later in this section) only the prime 2 is allowed, so 1/10, which ends in decimal, repeats forever in binary: switch the figure to base 2.")}
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
          "A repeating or very long decimal has to be cut off somewhere, and so does any measured quantity: a ruler, a scale or a stopwatch only shows so many digits. Rounding to a given number of decimal places keeps that many digits and looks at the next one: 5 or more rounds up, less than 5 rounds down. 2.346 to two places is 2.35; 2.344 is 2.34. Truncating instead simply drops the extra digits, always toward zero: 2.349 truncates to 2.34. Several rounding rules exist, and for negative numbers and exact halves they give different answers, so it matters which one a question asks for.")}
      </p>
      <LessonTable
        headers={[tx(t, "mFrac_tFn", "Name"), tx(t, "mFrac_tRule", "Rule"), "2.5", "−2.5", "2.7", "−2.7"]}
        rows={[
          [tx(t, "mFrac_floorN", "floor ⌊x⌋"), tx(t, "mFrac_floor", "down, toward −∞: the nearest whole number to the left"), "2", "−3", "2", "−3"],
          [tx(t, "mFrac_ceilN", "ceiling ⌈x⌉"), tx(t, "mFrac_ceil", "up, toward +∞: the nearest whole number to the right"), "3", "−2", "3", "−2"],
          [tx(t, "mFrac_truncN", "truncate"), tx(t, "mFrac_trunc", "toward 0: drop the digits"), "2", "−2", "2", "−2"],
          [tx(t, "mFrac_roundN", "round half up"), tx(t, "mFrac_round", "nearest; exact halves away from 0 (the school rule)"), "3", "−3", "3", "−3"],
          [tx(t, "mFrac_rintN", "round half to even"), tx(t, "mFrac_rint", "nearest; exact halves to the even neighbour, so that halves do not push long sums upward (used in statistics and banking)"), "2", "−2", "3", "−3"],
        ]}
      />
      <p>
        {tx(t, "mFrac_roundPlaces",
          "Rounding up can carry, just like adding 1: 3.996 to two decimal places looks at the third digit, 6, and rounds the 99 up, giving 4.00. Keep the trailing zeros: 4.00 says the value is known to the hundredth, while 4 says much less. Sometimes a question asks for significant figures instead of decimal places: count digits from the first one that is not 0. 0.004 567 to two significant figures is 0.0046, and 83 250 to two significant figures is 83 000. Round only once, at the end: rounding 2.346 first to 2.35 and then to 2.4 gives a different answer from rounding 2.346 straight to one place, which is 2.3.")}
      </p>

      <H2>{tx(t, "mFrac_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mFrac_ex1T", "Planning a day")}</H3>
      <p>
        {tx(t, "mFrac_ex1",
          "Sleep takes 1/3 of a day, work 1/4 and meals 1/12. What fraction is left? The lcm of 3, 4 and 12 is 12, so write everything in twelfths: 1 − 1/3 − 1/4 − 1/12 = 12/12 − 4/12 − 3/12 − 1/12 = 4/12 = 1/3. A third of 24 hours is 1/3 × 24 = 24/3 = 8 hours.")}
      </p>
      <H3>{tx(t, "mFrac_ex2T", "How many glasses?")}</H3>
      <p>
        {tx(t, "mFrac_ex2",
          "A jug holds 7/2 litres and a glass holds 3/8 of a litre. 7/2 ÷ 3/8 = 7/2 × 8/3 = 56/6 = 28/3. As a mixed number, 28 ÷ 3 = 9 remainder 1, so 28/3 = 9⅓: nine full glasses, and a third of one more.")}
      </p>
      <H3>{tx(t, "mFrac_ex3T", "Which score is better?")}</H3>
      <p>
        {tx(t, "mFrac_ex3",
          "One student answered 13 of 20 questions correctly, another 21 of 32. Cross-multiply: 13 · 32 = 416 and 21 · 20 = 420. Since 416 < 420, 13/20 < 21/32 and the second student did slightly better. As decimals the scores are 0.65 and 0.65625, which agrees.")}
      </p>

      <H3>{tx(t, "mFrac_ex4T", "Mixed numbers, step by step")}</H3>
      <Equation label={tx(t, "mFrac_eqMixed", "2¾ + 1⅚")}
        notes={[
          tx(t, "mFrac_mix1", "turn each mixed number into an improper fraction: 2¾ is 2 wholes of 4 quarters plus 3 more, 2 × 4 + 3 = 11 quarters; 1⅚ is 1 × 6 + 5 = 11 sixths"),
          tx(t, "mFrac_mix2", "common denominator: lcm(4, 6) = 12. Multiply 11/4 top and bottom by 3, and 11/6 by 2"),
          tx(t, "mFrac_mix3", "add the numerators: 33 + 22 = 55 twelfths"),
          tx(t, "mFrac_mix4", "back to a mixed number: 55 ÷ 12 = 4 remainder 7, so 4 wholes and 7/12. Check: 4 × 12 + 7 = 55"),
        ]}>
        {r`2\tfrac{3}{4} + 1\tfrac{5}{6} = \frac{11}{4} + \frac{11}{6} = \frac{33}{12} + \frac{22}{12} = \frac{55}{12} = 4\tfrac{7}{12}`}
      </Equation>
      <p>
        {tx(t, "mFrac_ex4Body",
          "A quick estimate catches mistakes: 2¾ is almost 3 and 1⅚ is almost 2, so the sum should be a bit under 5, and 4 7/12 is. For multiplying or dividing mixed numbers the first step is the same, convert to improper fractions, but never multiply the whole parts and the fractional parts separately: 2½ × 2½ is 5/2 × 5/2 = 25/4 = 6¼, not 4¼.")}
      </p>

      <H2>{tx(t, "mFrac_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mFrac_tWrong", "Wrong"), tx(t, "mFrac_tRight", "Right"), tx(t, "mFrac_tWhy", "Why")]}
        rows={[
          ["1/2 + 1/3 = 2/5", "1/2 + 1/3 = 5/6", tx(t, "mFrac_m1", "denominators name the slice size; they are never added")],
          ["(2 + 3)/3 = 2 + 1", "(2 + 3)/3 = 5/3", tx(t, "mFrac_m2", "you may only cancel factors of the whole top and bottom, not a term of a sum")],
          ["3 ÷ ½ = 1.5", "3 ÷ ½ = 6", tx(t, "mFrac_m3", "dividing by ½ asks how many halves fit into 3; it is multiplying by the reciprocal, 2 (halving would be × ½)")],
          ["0.3 × 0.2 = 0.6", "0.3 × 0.2 = 0.06", tx(t, "mFrac_m4", "tenths times tenths are hundredths: 3/10 × 2/10 = 6/100. Count the decimal places of both factors")],
          ["2.96 → 2.10 (2 places)", "2.96 → 3.0 (1 place)", tx(t, "mFrac_m5", "rounding a 9 up carries into the digit before it, as 29 + 1 = 30")],
        ]}
      />

      <KeyIdeas t={t} id="mFrac" items={[
        "a/b means a parts of size 1/b, and also a ÷ b; the denominator is never 0.",
        "Multiplying or dividing top and bottom by the same number keeps the value; divide by the gcd to reach lowest terms.",
        "Add and subtract over a common denominator; multiply tops and bottoms; divide by multiplying by the reciprocal.",
        "Compare a/b and c/d (b, d > 0) exactly with integers: a·d versus c·b.",
        "A decimal is a fraction over a power of ten; a/b ends only if the reduced denominator has no primes but 2 and 5, otherwise it repeats.",
        "The same rule holds in any base: in base 2 only denominators that are powers of 2 end, so 1/10 repeats in binary.",
        "Round by looking at the next digit, and only once, at the end; floor, ceiling and truncation differ for negative numbers.",
      ]} />
    </Article>
  );
}
