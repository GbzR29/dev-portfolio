"use client";

// Arithmetic 7: place value in any base, binary (counting, converting both
// ways, how many values n digits hold), hexadecimal and octal, adding in
// binary by hand, base 60 (time), and fractions in other bases.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { BaseFigure } from "@/components/lesson/figures/math/BaseFigure";

const r = String.raw;

export function BasesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mBase_intro",
          "We count in tens because we have ten fingers; nothing about numbers requires it. Other bases are all around us: an hour has 60 minutes and a minute 60 seconds, a leftover from Babylonian base 60; eggs come in dozens; and computers count in twos, because a wire either carries a voltage or does not. This chapter shows that base 2, base 16 and base 60 work exactly like base 10, how to convert between bases by hand, and how to add in binary with the same carrying you learned for decimal.")}
      </Lead>

      <H2>{tx(t, "mBase_placeTitle", "Place value in any base")}</H2>
      <p>
        {tx(t, "mBase_placeBody",
          "In 347, the 7 counts ones, the 4 counts tens and the 3 counts hundreds: each position is worth ten times the one to its right, and ten different digits, 0 to 9, are enough because a count of ten carries into the next position. Nothing changes if the base is some other whole number B ≥ 2: use digits 0 to B − 1, and let each position be worth B times the one to its right. The positions are then worth 1, B, B², B³ … from the right, the powers of the base from the previous chapter.")}
      </p>
      <Equation label={tx(t, "mBase_eqPlace", "Positional notation")}
        where={[
          [r`B`, tx(t, "mBase_wB", "the base (or radix): 10 for decimal, 2 for binary, 16 for hexadecimal, 8 for octal")],
          [r`d_k`, tx(t, "mBase_wD", "the digit in position k, with 0 ≤ dₖ < B. Positions are counted from 0 at the right, so the rightmost digit counts ones (B⁰ = 1)")],
          [r`n`, tx(t, "mBase_wN", "the number of digits")],
          [r`\sum_{k=0}^{n-1}`, tx(t, "mBase_wSum", "the sum over every position k from 0 to n − 1: add up digit × place value for each digit")],
        ]}
        note={tx(t, "mBase_eqPlaceNote", "A subscript names the base when it is not obvious: 101₂ = 1·4 + 0·2 + 1·1 = 5, while 101₁₀ is a hundred and one. Hexadecimal numbers are also often written with the prefix 0x: 0x1F = 1F₁₆ = 1·16 + 15 = 31.")}>
        {r`(d_{n-1} \cdots d_1 d_0)_B = \sum_{k=0}^{n-1} d_k \, B^{k}`}
      </Equation>

      <H2>{tx(t, "mBase_binTitle", "Binary")}</H2>
      <p>
        {tx(t, "mBase_binBody",
          "Base 2 has only the digits 0 and 1, called bits (binary digits). The place values are the powers of two: 1, 2, 4, 8, 16, 32, 64, 128 … Counting goes 0, 1, 10, 11, 100, 101, 110, 111, 1000: the rightmost bit flips every step, and whenever a bit goes from 1 back to 0 it carries into the next one, just as 9 rolls over to 0 and carries in decimal. A group of 8 bits is a byte; 4 bits, half a byte, is a nibble.")}
      </p>
      <H3>{tx(t, "mBase_toDecTitle", "Binary to decimal")}</H3>
      <p>
        {tx(t, "mBase_toDec",
          "Add the place values of the 1 bits. 1101 0110₂: the ones sit at positions 7, 6, 4, 2 and 1, worth 128 + 64 + 16 + 4 + 2 = 214. Starting from the left also works without knowing any powers: keep a running total, and for each bit double the total and add the bit (1 → 3 → 6 → 13 → 26 → 53 → 107 → 214). The method works in any base: multiply the running total by the base instead of by 2.")}
      </p>
      <H3>{tx(t, "mBase_toBinTitle", "Decimal to binary")}</H3>
      <p>
        {tx(t, "mBase_toBin",
          "Divide by 2 repeatedly and write down the remainders; read them from the last to the first. 214 ÷ 2 = 107 r 0, 107 ÷ 2 = 53 r 1, 53 ÷ 2 = 26 r 1, 26 ÷ 2 = 13 r 0, 13 ÷ 2 = 6 r 1, 6 ÷ 2 = 3 r 0, 3 ÷ 2 = 1 r 1, 1 ÷ 2 = 0 r 1. Bottom up: 11010110. The first remainder is the last digit because it says whether the number is even or odd, which is exactly what the ones bit says. The same method, dividing by B, converts to any base; the figure's second mode shows it step by step.")}
      </p>
      <Equation label={tx(t, "mBase_eqRange", "How much fits in n digits")}
        where={[
          [r`B^n`, tx(t, "mBase_wCount", "the number of different values n digits of base B can write: B choices for each of the n positions")],
          [r`B^n - 1`, tx(t, "mBase_wMax", "the largest of them, all digits at B − 1: 999 = 10³ − 1, 1111 1111₂ = 2⁸ − 1 = 255")],
        ]}
        note={tx(t, "mBase_eqRangeNote", "So 8 binary digits write 256 values, 0 to 255, just as 3 decimal digits write 1000 values, 0 to 999. Going the other way, writing N different values needs the smallest n with Bⁿ ≥ N: 1000 values need 10 binary digits, because 2⁹ = 512 is too few and 2¹⁰ = 1024 is enough. The same count answers everyday questions: a 4-digit PIN has 10⁴ = 10 000 possibilities, and a lock with 3 dials of 6 symbols has 6³ = 216.")}>
        {r`\text{values} = B^n \qquad 0 \le x \le B^n - 1`}
      </Equation>

      <H2>{tx(t, "mBase_hexTitle", "Hexadecimal and octal")}</H2>
      <p>
        {tx(t, "mBase_hexBody",
          "Binary is long: 214 needs eight digits. Base 16, hexadecimal or hex, is compact and converts to binary without any arithmetic, because 16 = 2⁴: every hex digit is exactly one nibble. Hex needs sixteen digits, so after 0–9 it borrows letters: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15. To convert binary to hex, split the bits into groups of four from the right and replace each group: 1101 0110₂ = D6₁₆ = 0xD6. Two hex digits are one byte, which is why hex is the usual shorthand for long binary numbers.")}
      </p>
      <p>
        {tx(t, "mBase_hexConvBody",
          "Hex to decimal works like any base: 2F7₁₆ = 2 × 16² + 15 × 16 + 7 = 512 + 240 + 7 = 759. Octal, base 8 = 2³, does the same trick with groups of three bits: 11 010 110₂ = 326₈, and check, 3 × 64 + 2 × 8 + 6 = 214. Whenever one base is a power of another, converting is just grouping digits; otherwise, such as between 2 and 10, you have to divide.")}
      </p>

      <BaseFigure t={t} />

      <H2>{tx(t, "mBase_arithTitle", "Arithmetic in binary")}</H2>
      <p>
        {tx(t, "mBase_addBody",
          "Addition in binary is column addition exactly as in decimal, only with fewer facts to remember: 0 + 0 = 0, 0 + 1 = 1, and 1 + 1 = 10₂, which means write 0 and carry 1, just as 5 + 5 = 10 means write 0 and carry 1 in decimal. With a carry coming in, a column can also hold 1 + 1 + 1 = 11₂: write 1, carry 1. Subtraction borrows in the same way: borrowing from the next column brings 2 instead of 10.")}
      </p>
      <LessonTable
        headers={[tx(t, "mBase_tOp", "Column"), tx(t, "mBase_tRes", "Sum"), tx(t, "mBase_tUse", "Write, carry")]}
        rows={[
          ["0 + 0", "0", "0, 0"],
          ["0 + 1, 1 + 0", "1", "1, 0"],
          ["1 + 1", "10₂ = 2", "0, 1"],
          ["1 + 1 + 1", "11₂ = 3", "1, 1"],
        ]}
      />
      <p>
        {tx(t, "mBase_timesBaseBody",
          "Multiplying by the base is especially easy in every base: append a 0. In decimal, 37 × 10 = 370; in binary, 101₂ × 2 = 1010₂ (5 × 2 = 10). Dividing by the base drops the last digit, and the dropped digit is the remainder: 1011₂ ÷ 2 = 101₂ remainder 1 (11 ÷ 2 = 5 remainder 1). That is exactly why repeated division by B, read bottom up, produces the digits.")}
      </p>
      <Equation label={tx(t, "mBase_eqAdd", "Column addition in binary: 1011₂ + 0110₂")}
        notes={[
          tx(t, "mBase_add1", "ones column: 1 + 0 = 1, write 1"),
          tx(t, "mBase_add2", "twos column: 1 + 1 = 10₂, write 0, carry 1"),
          tx(t, "mBase_add3", "fours column: 0 + 1 + carried 1 = 10₂, write 0, carry 1"),
          tx(t, "mBase_add4", "eights column: 1 + 0 + carried 1 = 10₂, write 0, carry 1 into a new sixteens column"),
          tx(t, "mBase_add5", "check in decimal: 1011₂ = 11 and 0110₂ = 6, and 10001₂ = 16 + 1 = 17 = 11 + 6"),
        ]}>
        {r`1011_2 + 0110_2 = 10001_2 \qquad (11 + 6 = 17)`}
      </Equation>
      <H2>{tx(t, "mBase_sixtyTitle", "Base 60: hours, minutes and seconds")}</H2>
      <p>
        {tx(t, "mBase_sixtyBody",
          "Clocks are a mixed base system: 60 seconds make a minute and 60 minutes an hour, so 2 h 15 min 40 s is the number (2, 15, 40) in base 60, worth 2 × 3600 + 15 × 60 + 40 = 8140 seconds. Each \"digit\" runs from 0 to 59. Angles use the same system: 1 degree = 60 minutes of arc = 3600 seconds of arc. Adding times carries at 60 instead of 10: 1 h 50 min + 25 min = 1 h 75 min = 2 h 15 min.")}
      </p>
      <Equation label={tx(t, "mBase_eqSixty", "Decimal hours and base 60")}
        where={[
          [r`h,\; m,\; s`, tx(t, "mBase_wHms", "hours, minutes (0–59) and seconds (0–59)")],
          [r`\tfrac{m}{60},\; \tfrac{s}{3600}`, tx(t, "mBase_wFrac", "the fraction of an hour that the minutes and seconds make: a minute is 1/60 of an hour, a second 1/3600")],
        ]}
        note={tx(t, "mBase_eqSixtyNote", "Going the other way, 2.7 h is 2 h and 0.7 × 60 = 42 min. A common slip is to read 2.7 h as 2 h 70 min or 2 h 7 min: the part after the decimal point is tenths of an hour, not minutes.")}>
        {r`h \text{ h } m \text{ min } s \text{ s} = h + \frac{m}{60} + \frac{s}{3600} \text{ hours} \qquad 1 \text{ h } 30 \text{ min} = 1.5 \text{ h}`}
      </Equation>

      <H2>{tx(t, "mBase_fracTitle", "Fractions in base 2")}</H2>
      <p>
        {tx(t, "mBase_fracBody",
          "Positions to the right of the point continue the pattern with negative powers of the base. In binary they are worth 1/2, 1/4, 1/8 …, so 0.101₂ = 1/2 + 1/8 = 0.625. As the fractions chapter showed, a fraction ends in base B only when its reduced denominator uses no primes except those of B. In base 2 only powers of two are allowed: 3/8 = 0.011₂ ends, but 1/10 = 0.000110011001100…₂ repeats forever. So whether a number has a short or an endless expansion depends on the base it is written in, not on the number itself: one tenth is short in decimal and endless in binary, while one third is endless in decimal and simply 0.1 in base 3.")}
      </p>

      <H2>{tx(t, "mBase_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mBase_ex1T", "200 in binary and hex")}</H3>
      <p>
        {tx(t, "mBase_ex1",
          "Subtract the largest powers of two that fit: 200 − 128 = 72, 72 − 64 = 8, 8 − 8 = 0. Bits 7, 6 and 3 are set: 1100 1000₂. Group by four: 1100 = C, 1000 = 8, so 200 = 0xC8. Check: 12 × 16 + 8 = 200.")}
      </p>
      <H3>{tx(t, "mBase_ex2T", "Hex to decimal and back")}</H3>
      <p>
        {tx(t, "mBase_ex2",
          "B3₁₆ = 11 × 16 + 3 = 176 + 3 = 179. Back again by dividing by 16: 179 ÷ 16 = 11 remainder 3, and 11 ÷ 16 = 0 remainder 11 = B. Read bottom up: B3. Through binary instead: B = 1011 and 3 = 0011, so B3₁₆ = 1011 0011₂ = 128 + 32 + 16 + 2 + 1 = 179.")}
      </p>
      <H3>{tx(t, "mBase_ex3T", "Seconds to hours, minutes and seconds")}</H3>
      <p>
        {tx(t, "mBase_ex3",
          "How long is 10 000 seconds? Convert to base 60 by repeated division, exactly as for binary. 10 000 ÷ 60 = 166 remainder 40: 40 seconds. 166 ÷ 60 = 2 remainder 46: 46 minutes. 2 ÷ 60 = 0 remainder 2: 2 hours. So 10 000 s = 2 h 46 min 40 s. Check: 2 × 3600 + 46 × 60 + 40 = 7200 + 2760 + 40 = 10 000.")}
      </p>

      <H2>{tx(t, "mBase_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mBase_tWrong", "Wrong"), tx(t, "mBase_tRight", "Right"), tx(t, "mBase_tWhy", "Why")]}
        rows={[
          ["101₂ = 101", "101₂ = 5", tx(t, "mBase_m1", "the subscript names the base: the places are worth 4, 2 and 1, not 100, 10 and 1")],
          ["1 + 1 = 2 (in binary)", "1 + 1 = 10₂", tx(t, "mBase_m2", "binary has no digit 2: write 0 and carry 1")],
          ["A₁₆ = 1", "A₁₆ = 10", tx(t, "mBase_m3", "the hex digits A to F stand for the values 10 to 15")],
          [tx(t, "mBase_m4w", "remainders read top down"), tx(t, "mBase_m4r", "read bottom up"), tx(t, "mBase_m4", "the first remainder is the ones digit")],
          ["2.7 h = 2 h 70 min", "2.7 h = 2 h 42 min", tx(t, "mBase_m5", "0.7 is tenths of an hour: 0.7 × 60 = 42 minutes")],
          ["F₁₆ + 1 = G₁₆", "F₁₆ + 1 = 10₁₆", tx(t, "mBase_m6", "after the last digit, carry into the next place, as 9 + 1 = 10 in decimal")],
        ]}
      />

      <KeyIdeas t={t} id="mBase" items={[
        "In base B each position is worth B times the one to its right; digits run 0 … B − 1.",
        "Binary → decimal: add the place values of the 1 bits. Decimal → base B: divide by B, read remainders bottom up.",
        "n digits hold Bⁿ values, 0 … Bⁿ − 1: a byte is 0–255.",
        "One hex digit is exactly four bits: convert between binary and hex by grouping bits in fours.",
        "Binary addition carries when 1 + 1 = 10₂; appending a 0 multiplies by the base, dropping the last digit divides by it.",
        "Time is base 60: convert seconds by dividing by 60 repeatedly; 0.5 h is 30 min.",
      ]} />
    </Article>
  );
}
