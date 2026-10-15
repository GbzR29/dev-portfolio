"use client";

// Control flow 1: arithmetic and the flags — two-operand add/sub/inc/dec/neg;
// rflags and the four flags that matter (ZF SF CF OF), set once for both the
// unsigned and the signed reading; which instructions touch which flags;
// imul's forms and the one-operand mul into rdx:rax; div/idiv with cdq/cqo
// (a program whose two "break it" lines give a silent wrong answer and
// SIGFPE); why compilers avoid division (real gcc -O2 output for /4 and /7);
// logic and shifts, shr versus sar.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { FlagsFigure } from "@/components/lesson/figures/asm/FlagsFigure";

export function ArithmeticFlagsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmAri_intro",
          "So far the CPU has mostly moved data. This chapter makes it compute: add, subtract, multiply, divide, and work on single bits. Each of these instructions also leaves a short report behind, a handful of bits called flags. The flags say whether the result was zero, negative, or too big to fit. The next chapter uses them to make decisions.")}
      </Lead>

      <Goals t={t} id="asmAri" items={[
        "Write add, sub, inc, dec, neg and imul, and say what each one changes.",
        "Say what ZF, SF, CF and OF mean, and predict them for an 8-bit add or sub.",
        "Divide with idiv, preparing rdx with cdq or cqo, and name the two ways a division can crash.",
        "Pick shr or sar to divide by a power of two, for unsigned and for signed numbers.",
      ]} />

      <H2>{tx(t, "asmAri_twoTitle", "Two operands, one of them the result")}</H2>
      <p>
        {tx(t, "asmAri_twoBody",
          "x86 arithmetic takes two operands and writes the answer into the first one. add eax, ebx means eax = eax + ebx: the old eax is gone. This is the C compound assignment, +=, rather than a = b + c. As with mov, at most one operand can be in memory, and both have the same size.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmAri_hInstr", "Instruction"), "C", tx(t, "asmAri_hNote", "Note")]}
        rows={[
          ["add eax, ebx", "a += b", ""],
          ["sub eax, 5", "a -= 5", ""],
          ["add dword [n], 1", "n += 1", tx(t, "asmAri_n1", "works directly on memory")],
          ["inc ecx", "i++", tx(t, "asmAri_n2", "add 1, but leaves CF alone")],
          ["dec ecx", "i--", tx(t, "asmAri_n3", "subtract 1, also leaves CF alone")],
          ["neg eax", "a = -a", tx(t, "asmAri_n4", "0 − a")],
          ["imul eax, ebx", "a *= b", tx(t, "asmAri_n5", "signed multiply, low 32 bits kept")],
          ["imul eax, ebx, 10", "a = b * 10", tx(t, "asmAri_n6", "the one form with three operands")],
        ]}
      />
      <p>
        {tx(t, "asmAri_wrap",
          "None of these instructions stop when a result is too big. A 32-bit register keeps the low 32 bits and drops the rest, exactly like unsigned arithmetic in C. What the CPU does do is record that something was dropped. That record is the flags.")}
      </p>

      <H2>{tx(t, "asmAri_flagsTitle", "The flags")}</H2>
      <p>
        {tx(t, "asmAri_flagsBody",
          "rflags is a 64-bit register you never name in an instruction. Most of its bits are for the operating system; four of them matter in everyday code. Arithmetic and logic instructions set them from their result. mov, lea, push and pop never touch them.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmAri_hFlag", "Flag"), tx(t, "asmAri_hName", "Name"), tx(t, "asmAri_hSet", "Set to 1 when")]}
        rows={[
          ["ZF", tx(t, "asmAri_zfName", "zero flag"), tx(t, "asmAri_zfWhen", "the result is 0")],
          ["SF", tx(t, "asmAri_sfName", "sign flag"), tx(t, "asmAri_sfWhen", "the top bit of the result is 1: negative, if you read it as signed")],
          ["CF", tx(t, "asmAri_cfName", "carry flag"), tx(t, "asmAri_cfWhen", "an add carried out of the top bit, or a sub needed a borrow: the unsigned answer did not fit")],
          ["OF", tx(t, "asmAri_ofName", "overflow flag"), tx(t, "asmAri_ofWhen", "the signed answer did not fit: two positives gave a negative, or two negatives a positive")],
        ]}
      />
      <p>
        {tx(t, "asmAri_flagsStep",
          "Step through some 8-bit arithmetic on al and watch the flags under the registers. A flag drawn with an amber border changed in that step.")}
      </p>
      <CpuFigure t={t} programs={["flags"]} />

      <H3>{tx(t, "asmAri_twoReadTitle", "One add, two readings")}</H3>
      <p>
        {tx(t, "asmAri_twoReadBody",
          "The bits 11001000 are 200 if you read them as unsigned and −56 if you read them as signed (two's complement, from the Registers chapter). The CPU has no idea which one you mean. It does not need to: adding the bits gives the right bits for both readings, as long as the answer fits. So it adds once and records two verdicts. CF says whether the unsigned answer fits; OF says whether the signed answer fits. Your code later looks at the one that matches its type.")}
      </p>
      <FlagsFigure t={t} />
      <LessonTable
        headers={[tx(t, "asmAri_hOp", "Operation (8 bits)"), tx(t, "asmAri_hRes", "Result"), "CF", "OF", tx(t, "asmAri_hWhy", "Why")]}
        rows={[
          ["200 + 100", "44", "1", "0", tx(t, "asmAri_w1", "300 does not fit in 0–255; as signed, −56 + 100 = 44 is right")],
          ["100 + 50", "150 (= −106)", "0", "1", tx(t, "asmAri_w2", "150 fits unsigned; as signed, two positives gave a negative")],
          ["128 + 128", "0", "1", "1", tx(t, "asmAri_w3", "256 is too big; as signed, −128 + −128 = −256 is too small")],
          ["0 − 1", "255 (= −1)", "1", "0", tx(t, "asmAri_w4", "unsigned needs a borrow; signed 0 − 1 = −1 is fine")],
          ["128 − 1", "127", "0", "1", tx(t, "asmAri_w5", "unsigned 127 is right; signed −128 − 1 = −129 is too small")],
        ]}
      />

      <H3>{tx(t, "asmAri_whoTitle", "Who sets which flags")}</H3>
      <LessonTable
        headers={[tx(t, "asmAri_hInstrs", "Instructions"), tx(t, "asmAri_hFlags", "Flags")]}
        rows={[
          ["add, sub, cmp, neg", tx(t, "asmAri_f1", "all four, from the result")],
          ["inc, dec", tx(t, "asmAri_f2", "ZF, SF, OF; CF keeps its old value")],
          ["and, or, xor, test", tx(t, "asmAri_f3", "ZF and SF from the result; CF and OF cleared to 0")],
          ["imul", tx(t, "asmAri_f4", "CF = OF = 1 if the product did not fit; ZF and SF are left undefined")],
          ["mov, lea, push, pop, call, ret", tx(t, "asmAri_f5", "none")],
        ]}
      />
      <p>
        {tx(t, "asmAri_undefined",
          "\"Undefined\" is the manual's word: a flag may hold anything afterwards, and code must not read it. lea leaving the flags alone is one more reason compilers like it for arithmetic.")}
      </p>

      <H2>{tx(t, "asmAri_mulTitle", "Multiplication")}</H2>
      <p>
        {tx(t, "asmAri_mulBody",
          "The two- and three-operand forms of imul are what compilers use for C's *. They keep the low half of the product, which is the same for signed and unsigned numbers, so there is no separate unsigned form. gcc -O2 turns long mul(long a, long b) { return a * b; } into:")}
      </p>
      <CodeBlock lang="nasm" filename="gcc -O2" t={t}>{`mul:
        mov     rax, rdi        ; a arrives in rdi
        imul    rax, rsi        ; rax = a * b (b arrives in rsi)
        ret                     ; the result goes back in rax`}</CodeBlock>
      <p>
        {tx(t, "asmAri_mulWide",
          "The older one-operand forms keep the whole product. mul rbx multiplies rax by rbx as unsigned numbers and writes the 128-bit answer into two registers: the high 64 bits in rdx, the low 64 in rax. This pair is written rdx:rax. imul rbx does the same for signed numbers. You will meet them in code that needs the full product, such as big-number libraries.")}
      </p>

      <H2>{tx(t, "asmAri_divTitle", "Division")}</H2>
      <p>
        {tx(t, "asmAri_divBody",
          "Division is the odd one out. div and idiv take a single operand, the divisor, and divide a number twice as wide that lives in two fixed registers:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmAri_hSize", "Size"), tx(t, "asmAri_hDividend", "Number divided"), tx(t, "asmAri_hQuot", "Quotient"), tx(t, "asmAri_hRem", "Remainder"), tx(t, "asmAri_hPrep", "Prepare the top half with")]}
        rows={[
          ["32", "edx:eax", "eax", "edx", tx(t, "asmAri_p1", "cdq (signed) or xor edx, edx (unsigned)")],
          ["64", "rdx:rax", "rax", "rdx", tx(t, "asmAri_p2", "cqo (signed) or xor edx, edx (unsigned)")],
        ]}
      />
      <p>
        {tx(t, "asmAri_divPrep",
          "Forgetting the top half is the classic mistake. cdq (convert doubleword to quadword) copies the sign bit of eax into all of edx, so that edx:eax holds the same signed number as eax. cqo does the same for rax into rdx. C's % uses the remainder that idiv leaves in edx. gcc -O2 compiles int mod(int a, int b) { return a % b; } as:")}
      </p>
      <CodeBlock lang="nasm" filename="gcc -O2" t={t}>{`mod:
        mov     eax, edi        ; eax = a
        cdq                     ; edx:eax = a, sign-extended to 64 bits
        idiv    esi             ; eax = a / b, edx = a % b
        mov     eax, edx        ; return the remainder
        ret`}</CodeBlock>
      <p>
        {tx(t, "asmAri_divRun",
          "The program below averages four temperatures, some of them negative. Step through it, then remove the marked lines one at a time.")}
      </p>
      <CpuFigure t={t} programs={["divide"]} />
      <LessonTable
        headers={[tx(t, "asmAri_hRemove", "Remove"), tx(t, "asmAri_hHappens", "What happens"), tx(t, "asmAri_hLinux", "On Linux")]}
        rows={[
          ["cdq", tx(t, "asmAri_r1", "edx stays 0, so edx:eax is the positive number 4,294,967,291. Divided by 4 that is 1,073,741,822: a wrong answer, with no error at all."), tx(t, "asmAri_r1x", "exit status 254")],
          ["mov ecx, 4", tx(t, "asmAri_r2", "ecx is 0. The CPU refuses to divide by zero and raises a divide error."), "Floating point exception, 136"],
        ]}
      />
      <p>
        {tx(t, "asmAri_divErr",
          "The same divide error happens when the quotient does not fit in the register. The only way to get there with matching sizes is −2,147,483,648 ÷ −1 = 2,147,483,648, one more than the largest int. In C both cases are undefined behaviour, and on x86 both crash. Linux reports the error as SIGFPE, the signal for an arithmetic error; the FP in its name is historical.")}
      </p>

      <H3>{tx(t, "asmAri_slowTitle", "Compilers avoid dividing")}</H3>
      <p>
        {tx(t, "asmAri_slowBody",
          "A division takes several times longer than a multiplication, so when the divisor is a constant, compilers find another way. Here is real gcc -O2 output:")}
      </p>
      <LessonTable
        headers={["C", "gcc -O2", tx(t, "asmAri_hIdea", "Idea")]}
        rows={[
          ["unsigned: x / 4", "shr eax, 2", tx(t, "asmAri_s1", "shifting right by 2 divides by 2² = 4")],
          ["int: x / 4", "lea eax, [rdi+3] · test · cmovns · sar eax, 2", tx(t, "asmAri_s2", "add 3 first when x is negative, so the shift rounds toward zero like C")],
          ["int: x / 7", "imul rax, rax, -1840700269 · shr rax, 32 · …", tx(t, "asmAri_s3", "multiply by a precomputed number close to 2³⁴ ÷ 7, then shift right by 34 in all: what is left is x ÷ 7")],
        ]}
      />
      <p>
        {tx(t, "asmAri_slowWhy",
          "Why the +3 for signed numbers? sar rounds down, toward minus infinity: −5 shifted right by 2 is −2. C rounds toward zero: −5 / 4 is −1. Adding 3 (the divisor minus 1) to a negative number before the shift turns the first rounding into the second. cmovns, a conditional move covered in the next chapter, keeps the +3 only when x is negative.")}
      </p>

      <H2>{tx(t, "asmAri_bitsTitle", "Bits: logic and shifts")}</H2>
      <LessonTable
        headers={[tx(t, "asmAri_hInstr2", "Instruction"), "C", tx(t, "asmAri_hDoes", "What it does")]}
        rows={[
          ["and eax, 0xff", "a &= 0xff", tx(t, "asmAri_b1", "keeps the bits that are 1 in both: here, the low byte")],
          ["or eax, 4", "a |= 4", tx(t, "asmAri_b2", "turns bit 2 on")],
          ["xor eax, ebx", "a ^= b", tx(t, "asmAri_b3", "flips the bits where b has a 1; xor eax, eax gives 0")],
          ["not eax", "a = ~a", tx(t, "asmAri_b4", "flips every bit (no flags)")],
          ["shl eax, 3", "a <<= 3", tx(t, "asmAri_b5", "shifts left, filling with zeros: × 8")],
          ["shr eax, 3", tx(t, "asmAri_b6c", "a >>= 3 (unsigned)"), tx(t, "asmAri_b6", "shifts right, filling with zeros")],
          ["sar eax, 3", tx(t, "asmAri_b7c", "a >>= 3 (signed)"), tx(t, "asmAri_b7", "shifts right, filling with copies of the sign bit")],
        ]}
      />
      <p>
        {tx(t, "asmAri_shiftNote",
          "shr and sar differ only for negative numbers: −8 is 0xfffffff8, sar by 1 gives 0xfffffffc = −4, but shr by 1 gives 0x7ffffffc, a large positive number. The last bit shifted out lands in CF. A neat use: gcc compiles int is_neg(int x) { return x < 0; } into mov eax, edi then shr eax, 31, which moves the sign bit down to bit 0.")}
      </p>

      <H2>{tx(t, "asmAri_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmAri_try1", "Predict ZF, SF, CF and OF for the 8-bit sums 127 + 1, 255 + 1 and 64 + 64. Check each one in the flags figure.")}</li>
        <li>{tx(t, "asmAri_try2", "Change the average program so it also returns the remainder: put it in the exit status instead of the quotient. Which register holds it, and why is it negative?")}</li>
        <li>{tx(t, "asmAri_try3", "Write x * 10 without imul, using lea and add (hint: 10x = 2 × 5x). Then compile return x * 10; with gcc -O2 and compare.")}</li>
      </ol>

      <KeyIdeas t={t} id="asmAri" items={[
        "Arithmetic writes its answer into the first operand: add a, b means a += b. Results that are too big are cut to the register size.",
        "ZF: the result is 0. SF: its top bit is 1. CF: the unsigned answer did not fit. OF: the signed answer did not fit.",
        "The CPU adds once for both readings; your code picks the flag that matches its type.",
        "mov, lea, push and pop never change the flags; inc and dec leave CF alone.",
        "div and idiv divide rdx:rax (or edx:eax) and leave the quotient in rax and the remainder in rdx. Fill the top half first: cdq, cqo or xor edx, edx.",
        "Dividing by zero, or a quotient that does not fit, crashes with SIGFPE.",
        "shr fills with zeros (unsigned), sar with the sign bit (signed). Compilers replace division by a constant with shifts and multiplications.",
      ]} />
    </Article>
  );
}
