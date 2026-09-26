"use client";

// Arithmetic 7: place value in any base, binary (counting, converting both
// ways, how many values n bits hold), hexadecimal and octal, bitwise
// operations, masks and flags, and fractions in base 2.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
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
          "We count in tens because we have ten fingers; nothing about numbers requires it. A computer has only two \"fingers\", a wire that carries a voltage or does not, so it counts in twos. Programmers constantly move between the two worlds: colours written as #FF8800, flags packed into a single integer, texture sizes that must be powers of two, an overflow at 255. This chapter shows that base 2 and base 16 work exactly like base 10, how to convert between them, and the bitwise operations that only make sense once numbers are seen as bits.")}
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
        note={tx(t, "mBase_eqPlaceNote", "A subscript names the base when it is not obvious: 101₂ = 1·4 + 0·2 + 1·1 = 5, while 101₁₀ is a hundred and one. Code uses prefixes: 0b101 (binary), 0x1F (hexadecimal), and, a famous trap, a leading 0 for octal: in C++ 010 is 8.")}>
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
          "Add the place values of the 1 bits. 1101 0110₂: the ones sit at positions 7, 6, 4, 2 and 1, worth 128 + 64 + 16 + 4 + 2 = 214. Starting from the left also works without knowing any powers: keep a running total, and for each bit double the total and add the bit (1 → 3 → 6 → 13 → 26 → 53 → 107 → 214). That doubling method is how a program parses a number string in any base.")}
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
        note={tx(t, "mBase_eqRangeNote", "So a byte holds 256 values, 0 to 255, which is why colour channels, and old games' level counters, stop at 255. 16 bits hold 65 536 values, 32 bits about 4.29 billion. Going the other way, storing N different values needs the smallest n with 2ⁿ ≥ N: 1000 values need 10 bits, because 2¹⁰ = 1024. The number 2¹⁰ = 1024 ≈ 10³ is why a kibibyte is 1024 bytes.")}>
        {r`\text{values} = B^n \qquad 0 \le x \le B^n - 1`}
      </Equation>

      <H2>{tx(t, "mBase_hexTitle", "Hexadecimal and octal")}</H2>
      <p>
        {tx(t, "mBase_hexBody",
          "Binary is long: 214 needs eight digits. Base 16, hexadecimal or hex, is compact and converts to binary without any arithmetic, because 16 = 2⁴: every hex digit is exactly one nibble. Hex needs sixteen digits, so after 0–9 it borrows letters: A = 10, B = 11, C = 12, D = 13, E = 14, F = 15. To convert binary to hex, split the bits into groups of four from the right and replace each group: 1101 0110₂ = D6₁₆ = 0xD6. Two hex digits are one byte, which is why memory dumps, addresses and colours are written in hex.")}
      </p>
      <p>
        {tx(t, "mBase_colorBody",
          "A colour #FF8800 is three bytes, one per channel: red FF = 255, green 88 = 136, blue 00 = 0, a strong orange. Shaders use the same channels as 0.0–1.0 floats: divide by 255, so 0x88 becomes 136/255 ≈ 0.533. Octal, base 8 = 2³, groups bits by three; it survives mainly in Unix file permissions (chmod 755: rwx r-x r-x) and in C++'s leading-zero trap.")}
      </p>

      <BaseFigure t={t} />

      <H2>{tx(t, "mBase_bitTitle", "Bitwise operations")}</H2>
      <p>
        {tx(t, "mBase_bitBody",
          "Seen as rows of bits, integers support operations that work on every bit position separately. AND (&) gives 1 where both bits are 1, OR (|) where at least one is, XOR (^) where exactly one is, and NOT (~) flips every bit. Shifts slide the whole row: x << n moves every bit n places left, filling with zeros, which multiplies by 2ⁿ exactly as appending a zero multiplies by 10 in decimal; x >> n moves right and divides by 2ⁿ, dropping the remainder.")}
      </p>
      <LessonTable
        headers={[tx(t, "mBase_tOp", "Operation"), "a = 1100", "b = 1010", tx(t, "mBase_tRes", "Result"), tx(t, "mBase_tUse", "Typical use")]}
        rows={[
          ["a & b", "1100", "1010", "1000", tx(t, "mBase_uAnd", "keep only some bits (masking): is a flag set?")],
          ["a | b", "1100", "1010", "1110", tx(t, "mBase_uOr", "set bits: turn a flag on, combine flags")],
          ["a ^ b", "1100", "1010", "0110", tx(t, "mBase_uXor", "toggle bits; which bits differ")],
          ["~a", "1100", "", "0011", tx(t, "mBase_uNot", "clear a flag: x & ~FLAG")],
          ["a << 1", "1100", "", "11000", tx(t, "mBase_uShl", "× 2; build masks: 1u << n is bit n")],
          ["a >> 2", "1100", "", "0011", tx(t, "mBase_uShr", "÷ 4 for unsigned numbers; extract a field")],
        ]}
      />
      <p>
        {tx(t, "mBase_flagsBody",
          "Flags pack many yes/no facts into one integer, one bit each. Physics engines give every object a collision layer bit and a mask of the layers it collides with; two objects interact when (layerA & maskB) != 0. Packing does the same with larger fields: an RGBA colour is four 8-bit fields in one 32-bit integer, red in bits 24–31, and a field is extracted by shifting it down and masking off the rest with 0xFF.")}
      </p>
      <Equation label={tx(t, "mBase_eqPow2", "The power-of-two test")}
        where={[
          [r`x - 1`, tx(t, "mBase_wXm1", "subtracting 1 turns the lowest 1 bit of x into 0 and every 0 below it into 1: 1000₂ − 1 = 0111₂, 1010₂ − 1 = 1001₂")],
          [r`x \mathbin{\&} (x - 1)`, tx(t, "mBase_wAnd", "x with its lowest 1 bit cleared. It is 0 exactly when x had a single 1 bit, that is, when x is a power of two")],
        ]}
        note={tx(t, "mBase_eqPow2Note", "Graphics APIs used to require power-of-two texture sizes (256, 512, 1024) because mipmaps halve each side cleanly and addresses become shifts; they are still the safe choice. Test x > 0 as well: 0 & (−1) is 0 too, but 0 is not a power of two.")}>
        {r`x > 0 \;\text{ and }\; x \mathbin{\&} (x - 1) = 0 \iff x = 2^k`}
      </Equation>
      <CodeBlock lang="cpp" filename="bits.hpp" t={t}>{`#include <cstdint>
#include <string>

enum Layer : uint32_t { PLAYER = 1u << 0, ENEMY = 1u << 1, BULLET = 1u << 2, WALL = 1u << 3 };

uint32_t mask = ENEMY | WALL;                   // collides with enemies and walls: 0b1010
bool hits    = (mask & ENEMY) != 0;             // test a flag
mask |=  BULLET;                                // set it
mask &= ~WALL;                                  // clear it
mask ^=  PLAYER;                                // toggle it

uint32_t packRGBA(uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    return (uint32_t(r) << 24) | (uint32_t(g) << 16) | (uint32_t(b) << 8) | a;
}
uint8_t red(uint32_t c)   { return (c >> 24) & 0xFF; }   // shift the field down, mask the rest
uint8_t green(uint32_t c) { return (c >> 16) & 0xFF; }

bool isPow2(uint32_t x) { return x != 0 && (x & (x - 1)) == 0; }

std::string toBase(uint32_t n, uint32_t B) {           // 2 <= B <= 16
    const char* digits = "0123456789ABCDEF";
    std::string s;
    do { s.insert(s.begin(), digits[n % B]); n /= B; } while (n != 0);   // remainders, last first
    return s;
}`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "mBase_shiftWarn", "Shift unsigned types. Shifting a negative signed integer right copies the sign bit on most compilers, and shifting a 1 into a signed integer's top bit is a trap too. Shifting by the type's width or more (1u << 32 for a 32-bit integer) is undefined behaviour in C++, not 0: use a 64-bit type (1ull << 32) when you need that many bits.")}
      </Callout>

      <H2>{tx(t, "mBase_fracTitle", "Fractions in base 2")}</H2>
      <p>
        {tx(t, "mBase_fracBody",
          "Positions to the right of the point continue the pattern with negative powers of the base. In binary they are worth 1/2, 1/4, 1/8 …, so 0.101₂ = 1/2 + 1/8 = 0.625. As the fractions chapter showed, a fraction ends in base B only when its reduced denominator uses no primes except those of B. In base 2 only powers of two are allowed: 3/8 = 0.011₂ ends, but 1/10 = 0.000110011001100…₂ repeats forever. Every float is stored as a finite binary fraction, which is why 0.1 cannot be stored exactly; the next chapter looks inside one.")}
      </p>

      <H2>{tx(t, "mBase_exTitle", "Worked examples")}</H2>
      <H3>{tx(t, "mBase_ex1T", "200 in binary and hex")}</H3>
      <p>
        {tx(t, "mBase_ex1",
          "Subtract the largest powers of two that fit: 200 − 128 = 72, 72 − 64 = 8, 8 − 8 = 0. Bits 7, 6 and 3 are set: 1100 1000₂. Group by four: 1100 = C, 1000 = 8, so 200 = 0xC8. Check: 12 × 16 + 8 = 200.")}
      </p>
      <H3>{tx(t, "mBase_ex2T", "Reading a colour")}</H3>
      <p>
        {tx(t, "mBase_ex2",
          "0x3CB371 is medium sea green. Red 3C = 3 × 16 + 12 = 60, green B3 = 11 × 16 + 3 = 179, blue 71 = 7 × 16 + 1 = 113. As shader floats: 60/255 ≈ 0.235, 179/255 ≈ 0.702, 113/255 ≈ 0.443.")}
      </p>
      <H3>{tx(t, "mBase_ex3T", "A wrapping index without %")}</H3>
      <p>
        {tx(t, "mBase_ex3",
          "A ring buffer of 64 = 2⁶ entries wraps its index with i % 64. Because 64 is a power of two, the remainder is just the lowest 6 bits, i & 63 (63 = 111111₂), which is a single cheap instruction and also works for the unsigned wrap-around at the top of the integer range. This is why ring buffers and hash tables often have power-of-two sizes.")}
      </p>

      <H2>{tx(t, "mBase_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mBase_tWrong", "Wrong"), tx(t, "mBase_tRight", "Right"), tx(t, "mBase_tWhy", "Why")]}
        rows={[
          ["int perms = 0755; // = 755?", tx(t, "mBase_m1r", "0755 is octal, 493"), tx(t, "mBase_m1", "a leading 0 makes a C++ literal octal")],
          ["2 ^ 8 == 256", "(1 << 8) == 256", tx(t, "mBase_m2", "^ is XOR in C++: 2 ^ 8 is 10")],
          ["if (flags & A == A)", "if ((flags & A) == A)", tx(t, "mBase_m3", "== binds tighter than &, so this is flags & (A == A) = flags & 1")],
          [tx(t, "mBase_m4w", "remainders read top down"), tx(t, "mBase_m4r", "read bottom up"), tx(t, "mBase_m4", "the first remainder is the ones digit")],
          ["1u << 32", "1ull << 32", tx(t, "mBase_m5", "shifting by the type's width is undefined")],
          ["byte / 256.f", "byte / 255.f", tx(t, "mBase_m6", "the largest byte is 255 = 0xFF, and it must map to exactly 1.0")],
        ]}
      />

      <KeyIdeas t={t} id="mBase" items={[
        "In base B each position is worth B times the one to its right; digits run 0 … B − 1.",
        "Binary → decimal: add the place values of the 1 bits. Decimal → base B: divide by B, read remainders bottom up.",
        "n digits hold Bⁿ values, 0 … Bⁿ − 1: a byte is 0–255.",
        "One hex digit is exactly four bits; #RRGGBB is one byte per channel.",
        "&, |, ^, ~ work per bit; << n multiplies and >> n divides by 2ⁿ. Masks test, set and clear flags.",
        "x & (x − 1) == 0 tests for a power of two; i & (2ⁿ − 1) is i mod 2ⁿ.",
      ]} />
    </Article>
  );
}
