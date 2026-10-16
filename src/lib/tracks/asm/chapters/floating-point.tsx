"use client";

// From C 3: floating point — IEEE 754 doubles and floats bit by bit (figure
// with the formula filled in and the exact stored value); the 16 xmm
// registers and the scalar SSE instructions, named by their suffixes;
// constants in .rodata (gcc's to_celsius, double and float, stepped in the
// xmm figure); int ↔ double with cvtsi2sd / cvttsd2si and why gcc zeroes
// first; comisd / ucomisd flags and NaN (is_cold, a == b); negation by a sign
// mask; an asm function C can call (checked on Linux); x87 in brief.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { FloatBitsFigure } from "@/components/lesson/figures/asm/FloatBitsFigure";
import { XmmFigure } from "@/components/lesson/figures/asm/XmmFigure";

export function FloatingPointContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmFp_intro",
          "None of the instructions so far can add 0.5 to anything. Floating-point numbers have their own format, their own registers and their own instructions: on x86-64 that is SSE, with sixteen 128-bit registers named xmm0 to xmm15. This chapter opens up a double to see how it stores a number, then follows gcc's code for a few small functions one instruction at a time, including the comparisons where NaN changes the answer.")}
      </Lead>

      <Goals t={t} id="asmFp" items={[
        "Decode a double from its sign, exponent and fraction bits, and say why 0.1 + 0.2 is not 0.3.",
        "Read scalar SSE instructions by their names: movsd, addsd, mulss, cvtsi2sd, cvttsd2si, comisd.",
        "Explain why floating-point constants live in memory, and how gcc compares doubles so that NaN gives the right answer.",
        "Write an assembly function that takes and returns doubles, following the calling convention.",
      ]} />

      <H2>{tx(t, "asmFp_ieeeTitle", "How a double is stored")}</H2>
      <p>
        {tx(t, "asmFp_ieeeBody",
          "A double is 64 bits split into three fields, as the IEEE 754 standard defines: 1 sign bit, 11 exponent bits and 52 fraction bits. It works like scientific notation in base 2: a number between 1 and 2, times a power of two.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmFp_hTerm", "Term"), tx(t, "asmFp_hMeaning", "Meaning")]}
        rows={[
          ["value", "(−1)^s × 1.f × 2^(e − 1023)"],
          ["s", tx(t, "asmFp_s", "the sign bit: 0 for positive, 1 for negative. (−1)⁰ = 1 and (−1)¹ = −1")],
          ["e", tx(t, "asmFp_e", "the 11 exponent bits read as an unsigned number, 0 to 2047. Subtracting the bias 1023 gives the real exponent, −1022 to 1023; storing it biased avoids a sign bit for the exponent. e = 0 and e = 2047 are reserved for zero, subnormals, infinity and NaN")],
          ["1.f", tx(t, "asmFp_f", "the significand: the binary number 1.f, where f is the 52 fraction bits after the point. The leading 1 is not stored, since every normal number has it: 53 bits of precision for the price of 52")],
          ["float", tx(t, "asmFp_float", "the same layout in 32 bits: 1 sign bit, 8 exponent bits with bias 127, 23 fraction bits")],
        ]}
      />
      <p>
        {tx(t, "asmFp_ieeeRun",
          "0.1 has no exact binary form, just as 1/3 has none in decimal: its binary digits 0.000110011001100… repeat forever, and 52 bits must stop somewhere. Look at what is really stored, then try 0.1 + 0.2 and 0.3:")}
      </p>
      <FloatBitsFigure t={t} />
      <p>
        {tx(t, "asmFp_ieeeAfter",
          "0.1 is stored a little too high, 0.2 too, and their sum lands one step above the double nearest to 0.3. The two differ only in their last bit, but they differ, so 0.1 + 0.2 == 0.3 is false. 53 bits are about 16 decimal digits; a float's 24 bits are about 7. And past 2⁵³, a double cannot even hold every integer: 2⁵³ + 1 rounds to 2⁵³.")}
      </p>

      <H2>{tx(t, "asmFp_xmmTitle", "The xmm registers and scalar instructions")}</H2>
      <p>
        {tx(t, "asmFp_xmmBody",
          "SSE (Streaming SIMD Extensions) added the xmm registers to x86. Every x86-64 processor has SSE2, so compilers use it for all float and double arithmetic. An xmm register is 128 bits wide: room for two doubles or four floats, called lanes. Most of this chapter uses only the lowest lane, with scalar instructions; filling all the lanes at once, packed instructions, is SIMD, the subject of the next section. The instruction names are built from parts:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmFp_hPart", "Part"), tx(t, "asmFp_hMeans", "Means"), tx(t, "asmFp_hEx", "Example")]}
        rows={[
          ["…sd", tx(t, "asmFp_p1", "scalar double: one double, lane 0"), "addsd xmm0, xmm1"],
          ["…ss", tx(t, "asmFp_p2", "scalar single: one float, lane 0"), "mulss xmm0, xmm2"],
          ["…pd / …ps", tx(t, "asmFp_p3", "packed: every lane at once"), "addpd xmm0, xmm1"],
          ["mov…", tx(t, "asmFp_p4", "copy; movsd and movss load and store one value"), "movsd xmm1, [rel half]"],
          ["cvt…2…", tx(t, "asmFp_p5", "convert: si = signed integer, sd = double, ss = float"), "cvtsi2sd xmm0, eax"],
          ["cvtt…", tx(t, "asmFp_p6", "convert with truncation, toward zero, like a C cast"), "cvttsd2si eax, xmm0"],
          ["sqrtsd", tx(t, "asmFp_p7", "square root, a single instruction"), "sqrtsd xmm0, xmm0"],
        ]}
      />

      <H2>{tx(t, "asmFp_constTitle", "Constants live in memory")}</H2>
      <p>
        {tx(t, "asmFp_constBody",
          "No SSE instruction takes an immediate operand: there is no addsd xmm0, 32.0. gcc puts each constant in the read-only data section under a label like .LC0, and the instruction reads it from there. Here is double to_celsius(double f) { return (f - 32.0) * 5.0 / 9.0; } at -O2, and the same function with float:")}
      </p>
      <XmmFigure t={t} programs={["celsius", "celsiusF"]} />
      <p>
        {tx(t, "asmFp_constData",
          "In gcc's .s file the constant appears as .LC0: .long 0, .long 1077936128. Those are the two 4-byte halves of 32.0, low half first: 1077936128 is 0x40400000, so the whole double is 0x4040000000000000. In NASM you write dq 32.0 and the assembler encodes it. Two tricks need no constant at all: pxor xmm0, xmm0 makes 0.0, since all-zero bits are +0.0, and negating x is xorpd with a mask that flips only the sign bit, which is how gcc compiles return -x;.")}
      </p>

      <H2>{tx(t, "asmFp_convTitle", "Between integers and doubles")}</H2>
      <p>
        {tx(t, "asmFp_convBody",
          "Mixing int and double in C makes the compiler convert. The end of double average(const int *a, int n), which returns (double)s / n, converts the sum and the count before dividing. Step through it, then remove the two pxor lines:")}
      </p>
      <XmmFigure t={t} programs={["average", "trunc"]} />
      <p>
        {tx(t, "asmFp_convAfter",
          "cvtsi2sd writes only lane 0 and keeps the rest of the register, so it has to wait until the last instruction that wrote that register is finished, even if the program never cared about those bytes. A register cleared with pxor depends on nothing, so the conversion can start at once. In the other direction, (int)x is cvttsd2si: the extra t is truncation, as C requires, while plain cvtsd2si would follow the current rounding mode, which is round-to-nearest by default. A double that does not fit gives 0x80000000, which C calls undefined behavior.")}
      </p>

      <H2>{tx(t, "asmFp_cmpTitle", "Comparisons and NaN")}</H2>
      <p>
        {tx(t, "asmFp_cmpBody",
          "comisd a, b compares two doubles and sets three flags, the way an unsigned integer cmp would. So the jumps and sets that follow are the unsigned ones: ja, jb, seta, setb, never jg or jl.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmFp_hResult", "Result"), "ZF", "PF", "CF"]}
        rows={[
          ["a > b", "0", "0", "0"],
          ["a < b", "0", "0", "1"],
          ["a = b", "1", "0", "0"],
          [tx(t, "asmFp_unordered", "unordered (a NaN)"), "1", "1", "1"],
        ]}
      />
      <p>
        {tx(t, "asmFp_nanBody",
          "NaN, not a number, is what 0.0 / 0.0 and √−1 give. Every comparison with a NaN is false in C, even NaN == NaN. The flags for unordered look like \"less than\" and \"equal\" at the same time, so the compiler has to choose its instructions with care. PF, the parity flag, is the one that tells NaN apart. Try both functions with NaN:")}
      </p>
      <XmmFigure t={t} programs={["isCold", "same"]} />
      <Callout type="warn" t={t}>
        {tx(t, "asmFp_fastMath",
          "-ffast-math lets gcc assume there are no NaNs or infinities and reorder arithmetic as if it were exact. Code gets faster, but isnan(x) can be compiled to 0 and sums can change in their last digits. Use it only when you have checked that your program does not depend on those rules.")}
      </Callout>

      <H2>{tx(t, "asmFp_ownTitle", "A floating-point function in NASM")}</H2>
      <p>
        {tx(t, "asmFp_ownBody",
          "The calling convention from the last chapter covers doubles too: the first eight floating-point arguments arrive in xmm0 to xmm7, and the result goes back in xmm0. On Linux every xmm register is caller-saved, so a function may use them all freely.")}
      </p>
      <CodeBlock lang="nasm" filename="area.asm" t={t}>{`        default rel
        section .note.GNU-stack noalloc noexec nowrite progbits

        section .rodata
half:   dq      0.5                     ; NASM writes the double's 8 bytes

        section .text
        global  area
area:                                   ; double area(double base, double height)
        mulsd   xmm0, xmm1              ; base arrives in xmm0, height in xmm1
        mulsd   xmm0, [half]            ; no immediates: the constant is in memory
        ret                             ; the result goes back in xmm0`}</CodeBlock>
      <CodeBlock lang="c" filename="main.c" t={t}>{`#include <stdio.h>

double area(double base, double height);

int main(void) {
    printf("%g\\n", area(3.0, 4.0));    // 6
    return 0;
}`}</CodeBlock>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`nasm -f elf64 area.asm -o area.o
gcc main.c area.o -o main
./main                          # 6`}</CodeBlock>

      <H2>{tx(t, "asmFp_x87Title", "And the x87?")}</H2>
      <p>
        {tx(t, "asmFp_x87Body",
          "Before SSE, x86 did floating point on the x87, a coprocessor with eight 80-bit registers used as a stack (fld pushes, fadd works on the top). 32-bit programs still use it, and on Linux x86-64 long double is the x87's 80-bit format, so long double code still contains fld and fstp. Everything else moved to SSE, which has plain registers and gives the same results on every machine.")}
      </p>

      <H2>{tx(t, "asmFp_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmFp_try1", "In the bits figure, start from 1 and press +1 once. How big is the step from 1 to the next double? Then try the same from 2⁵³.")}</li>
        <li>{tx(t, "asmFp_try2", "Write double hyp(double a, double b) returning √(a² + b²) in NASM with mulsd, addsd and sqrtsd, and call it from C with 3 and 4.")}</li>
        <li>{tx(t, "asmFp_try3", "On Compiler Explorer, compile int is_hot(double c) { return c > 30.0; } and compare it with is_cold. Why did gcc not need to swap the operands this time?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmFp" items={[
        "A double is (−1)^s × 1.f × 2^(e − 1023): 1 sign bit, 11 exponent bits, 52 fraction bits. A float has 8 and 23, with bias 127.",
        "Most decimal fractions, 0.1 among them, have no exact binary form, so they are rounded; 0.1 + 0.2 ≠ 0.3.",
        "Floating-point math runs in the 128-bit xmm registers; …sd and …ss instructions work on lane 0 only.",
        "SSE has no immediates: constants live in .rodata. pxor makes 0.0 and an xor with the sign bit negates.",
        "cvtsi2sd converts int to double (gcc zeroes the register first); cvttsd2si truncates toward zero, like a C cast.",
        "comisd and ucomisd set ZF, PF and CF like an unsigned compare; NaN sets all three, and PF is the one that reveals it.",
        "Doubles are passed in xmm0–xmm7 and returned in xmm0; all xmm registers are caller-saved on Linux.",
      ]} />
    </Article>
  );
}
