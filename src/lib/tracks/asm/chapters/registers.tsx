"use client";

// Foundations 2: registers — bits, bytes and the size names (byte, word,
// dword, qword); the 16 general-purpose registers and their usual roles, rip
// and rflags; the 32/16/8-bit names of each register; the 32-bit rule (a
// 32-bit write zero-extends, 8/16-bit writes merge) and why; xor eax, eax;
// signed and unsigned readings of the same bits, two's complement; registers
// versus memory and what a trip to memory costs.

import { H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { RegisterFigure } from "@/components/lesson/figures/asm/RegisterFigure";

export function RegistersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmReg_intro",
          "A register is a storage cell inside the processor. An x86-64 CPU has sixteen general-purpose registers, each 64 bits wide. Almost every instruction reads or writes at least one, because registers are the only storage the CPU can use with no waiting. This chapter names them, shows how one register can be used as 64, 32, 16 or 8 bits, and how the same bits can mean a positive or a negative number.")}
      </Lead>

      <Goals t={t} id="asmReg" items={[
        "Name the 16 general-purpose registers and the roles they usually play.",
        "Use a register's 32-, 16- and 8-bit names, and predict what each write does to the rest.",
        "Read a bit pattern as an unsigned number and as a two's-complement signed one.",
        "Explain why xor eax, eax is the usual way to zero a register.",
      ]} />

      <H2>{tx(t, "asmReg_sizesTitle", "Bits, bytes and the names of sizes")}</H2>
      <p>
        {tx(t, "asmReg_sizesBody",
          "A bit is 0 or 1. With n bits you can write 2ⁿ different patterns, so 8 bits give 256 and 64 bits give 2⁶⁴, about 1.8 × 10¹⁹. Intel named the sizes when its processors were 16-bit, and the names stayed:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmReg_hName", "Name"), tx(t, "asmReg_hBits", "Bits"), tx(t, "asmReg_hBytes", "Bytes"), "NASM", tx(t, "asmReg_hCType", "C type")]}
        rows={[
          ["byte", "8", "1", "byte, db", "char, int8_t"],
          ["word", "16", "2", "word, dw", "short, int16_t"],
          [tx(t, "asmReg_dword", "double word"), "32", "4", "dword, dd", "int, int32_t"],
          [tx(t, "asmReg_qword", "quad word"), "64", "8", "qword, dq", tx(t, "asmReg_qwordC", "long long, int64_t, pointers")],
        ]}
      />
      <p>
        {tx(t, "asmReg_wordNote",
          "So on x86 a word is 16 bits, even though the machine works on 64 at a time. db, dw, dd and dq are the directives that lay out data of each size in memory; the next chapter uses them.")}
      </p>

      <H2>{tx(t, "asmReg_sixteenTitle", "The sixteen registers")}</H2>
      <p>
        {tx(t, "asmReg_sixteenBody",
          "The first eight carry names from the 8086 of 1978, where each had a job. The other eight, r8 to r15, arrived with 64-bit mode. Today most instructions accept any of them, but the old roles live on in a few instructions and in the conventions that decide which register holds what:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmReg_hReg", "Register"), tx(t, "asmReg_hOrig", "Original name"), tx(t, "asmReg_hRole", "Main role today")]}
        rows={[
          ["rax", tx(t, "asmReg_n1", "accumulator"), tx(t, "asmReg_r1", "the return value of a function; the system call number")],
          ["rbx", tx(t, "asmReg_n2", "base"), tx(t, "asmReg_r2", "general use; a function must hand it back unchanged")],
          ["rcx", tx(t, "asmReg_n3", "counter"), tx(t, "asmReg_r3", "4th function argument; shift counts go in cl")],
          ["rdx", tx(t, "asmReg_n4", "data"), tx(t, "asmReg_r4", "3rd argument; the high half of a multiply or divide")],
          ["rsi", tx(t, "asmReg_n5", "source index"), tx(t, "asmReg_r5", "2nd argument")],
          ["rdi", tx(t, "asmReg_n6", "destination index"), tx(t, "asmReg_r6", "1st argument")],
          ["rbp", tx(t, "asmReg_n7", "base pointer"), tx(t, "asmReg_r7", "general use, or the base of the current stack frame")],
          ["rsp", tx(t, "asmReg_n8", "stack pointer"), tx(t, "asmReg_r8", "the top of the stack; never use it for anything else")],
          ["r8 – r15", tx(t, "asmReg_n9", "(new in 64-bit mode)"), tx(t, "asmReg_r9", "r8 and r9 are the 5th and 6th arguments; the rest are general")],
        ]}
      />
      <p>
        {tx(t, "asmReg_conventionNote",
          "\"Argument\" and \"hand back unchanged\" come from the System V calling convention, the rules Linux follows for function calls. A later chapter covers it fully. For now, the table explains why compilers keep putting the same kinds of values in the same registers.")}
      </p>
      <p>
        {tx(t, "asmReg_specialBody",
          "Two more registers are not general purpose. rip holds the address of the next instruction; you never write it with mov, only through jumps, calls and returns. rflags holds single-bit flags that instructions set as a side effect, such as ZF (zero flag) when a result is zero. The chapter on arithmetic and flags is about them.")}
      </p>

      <H2>{tx(t, "asmReg_partsTitle", "One register, several names")}</H2>
      <p>
        {tx(t, "asmReg_partsBody",
          "Every register can be used whole or in part. eax is the low 32 bits of rax, ax the low 16 bits, al the lowest 8 bits, and ah the 8 bits just above al. The parts are not separate registers: writing al changes rax. Try it below. Click a part, then run an instruction on it.")}
      </p>
      <RegisterFigure t={t} />
      <LessonTable
        headers={["64", "32", "16", tx(t, "asmReg_hLow8", "8 (low)"), tx(t, "asmReg_hHigh8", "8 (bits 8–15)")]}
        rows={[
          ["rax", "eax", "ax", "al", "ah"],
          ["rbx", "ebx", "bx", "bl", "bh"],
          ["rcx", "ecx", "cx", "cl", "ch"],
          ["rdx", "edx", "dx", "dl", "dh"],
          ["rsi", "esi", "si", "sil", "—"],
          ["rdi", "edi", "di", "dil", "—"],
          ["rbp", "ebp", "bp", "bpl", "—"],
          ["rsp", "esp", "sp", "spl", "—"],
          ["r8 … r15", "r8d … r15d", "r8w … r15w", "r8b … r15b", "—"],
        ]}
      />

      <H2>{tx(t, "asmReg_ruleTitle", "The 32-bit rule")}</H2>
      <p>
        {tx(t, "asmReg_ruleBody",
          "The figure shows a rule that surprises everyone once. Writing an 8- or 16-bit part keeps every other bit of the register. Writing the 32-bit part clears the top 32 bits. Step through the same thing as a program:")}
      </p>
      <CpuFigure t={t} programs={["subregs"]} />
      <p>
        {tx(t, "asmReg_whyBody",
          "AMD chose this on purpose for 64-bit mode. A modern CPU works on many instructions at once, and an instruction can only start when the values it needs are ready. If mov eax, 1 kept the top half, it would have to wait for the old rax just to copy its top bits. Clearing them makes the new value independent of the old one. The 8- and 16-bit writes kept their old behaviour for compatibility, which is one reason compilers avoid them.")}
      </p>
      <p>{tx(t, "asmReg_consequences", "You will see the consequences in every listing:")}</p>
      <LessonTable
        headers={[tx(t, "asmReg_hCode", "Code"), tx(t, "asmReg_hWhy", "Why")]}
        rows={[
          ["xor eax, eax", tx(t, "asmReg_k1", "Sets the whole of rax to 0 in 2 bytes. The CPU recognises it and does not even wait for the old value.")],
          ["mov eax, 1", tx(t, "asmReg_k2", "Written for mov rax, 1: same result, 5 bytes instead of 7. NASM and compilers choose the short form.")],
          ["movzx eax, byte [x]", tx(t, "asmReg_k3", "Loads 1 byte and clears the rest, where mov al, [x] would keep the old upper bits.")],
        ]}
      />

      <H2>{tx(t, "asmReg_signTitle", "Signed and unsigned: the same bits")}</H2>
      <p>
        {tx(t, "asmReg_signBody",
          "A register holds bits, not \"a number\". The instruction decides how to read them. Read as unsigned, the bits are a plain binary number. Read as signed, x86 uses two's complement: the top bit counts as minus its usual value. In 8 bits, the top bit is worth −128 instead of +128:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmReg_hBitsCol", "Bits"), "Hex", tx(t, "asmReg_hUns", "Unsigned"), tx(t, "asmReg_hSig", "Signed")]}
        rows={[
          ["0000 0101", "0x05", "5", "5"],
          ["0111 1111", "0x7f", "127", "127"],
          ["1000 0000", "0x80", "128", "−128"],
          ["1111 1011", "0xfb", "251", "−5"],
          ["1111 1111", "0xff", "255", "−1"],
        ]}
      />
      <p>
        {tx(t, "asmReg_negBody",
          "To negate a number in two's complement, flip every bit and add 1. 5 is 0000 0101; flipped it is 1111 1010; plus 1 gives 1111 1011, which is −5. Check: −128 + 64 + 32 + 16 + 8 + 2 + 1 = −5. The instruction neg does exactly this.")}
      </p>
      <H3>{tx(t, "asmReg_wrapTitle", "Why one adder serves both")}</H3>
      <p>
        {tx(t, "asmReg_wrapBody",
          "Addition does not care which reading you meant. 0xfb + 0x05 = 0x100, and in 8 bits only 0x00 is kept: unsigned, 251 + 5 wrapped round to 0; signed, −5 + 5 is 0. Both answers are right, from one circuit. The readings differ only when you compare or widen a value, which is why x86 has two versions of those: jl and jb for \"less than\", movsx and movzx for widening.")}
      </p>
      <p>
        {tx(t, "asmReg_tryFig",
          "In the figure, choose al and run mov al, -1: unsigned it reads 255, signed −1. Then add 1: both readings wrap to 0, and no other byte of rax changes.")}
      </p>

      <H2>{tx(t, "asmReg_memTitle", "Registers or memory")}</H2>
      <p>
        {tx(t, "asmReg_memBody",
          "Sixteen registers are not many. A C function with twenty local variables cannot keep them all in registers, so the compiler keeps the busiest ones there and the rest in memory, on the stack. Moving a value from memory into a register is a load; the other way is a store. The difference in speed is why this choice matters:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmReg_hWhere", "Where the value is"), tx(t, "asmReg_hCost", "Time to reach it, roughly, on a current desktop CPU")]}
        rows={[
          [tx(t, "asmReg_m1", "a register"), tx(t, "asmReg_m1b", "no extra time: it is part of the instruction")],
          [tx(t, "asmReg_m2", "L1 cache (tens of KiB per core)"), tx(t, "asmReg_m2b", "about 4 to 5 cycles")],
          [tx(t, "asmReg_m3", "L2 cache"), tx(t, "asmReg_m3b", "about 12 to 15 cycles")],
          [tx(t, "asmReg_m4", "L3 cache (shared)"), tx(t, "asmReg_m4b", "about 40 to 50 cycles")],
          [tx(t, "asmReg_m5", "main memory (RAM)"), tx(t, "asmReg_m5b", "a few hundred cycles")],
        ]}
      />
      <p>
        {tx(t, "asmReg_cycleNote",
          "A cycle at 4 GHz lasts a quarter of a nanosecond. The Performance section at the end of this track measures these costs, and the C/C++ chapter Performance & Data Layout shows what they mean for how you arrange data.")}
      </p>

      <H2>{tx(t, "asmReg_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmReg_try1", "In the figure, pick rsi. Why is there no part for bits 8 to 15?")}</li>
        <li>{tx(t, "asmReg_try2", "Write −1, −2 and −128 as 8-bit hex patterns. Check them with the figure: choose al, run mov al, -1, then sub al, 1.")}</li>
        <li>{tx(t, "asmReg_try3", "rax = 0x1122334455667788. What is rax after mov ax, 0? And after mov eax, 0 instead?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmReg" items={[
        "x86-64 has 16 general-purpose 64-bit registers: rax, rbx, rcx, rdx, rsi, rdi, rbp, rsp and r8 to r15. rsp is the stack pointer; leave it alone.",
        "eax, ax, al and ah are parts of rax, not separate registers.",
        "Writing a 32-bit part clears the upper 32 bits. Writing an 8- or 16-bit part keeps them.",
        "xor eax, eax zeroes the whole of rax; it is the shortest and fastest way.",
        "The same bits read as unsigned or as two's-complement signed. Addition works the same for both; comparing and widening do not.",
        "Registers are the only storage with no waiting. Memory, even the L1 cache, costs cycles.",
      ]} />
    </Article>
  );
}
