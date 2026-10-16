"use client";

// Performance 4: inline assembly and intrinsics — three ways to get an
// instruction into a C program; GCC extended asm (template, outputs, inputs,
// clobbers, constraints) with -masm=intel; a wrong constraint that compiles
// silently and prints 4198504 instead of 42 (checked on Linux); volatile and
// the "memory" clobber; rdtsc; builtins and intrinsics beating inline asm
// (popcount with and without -mpopcnt); when hand-written assembly is worth
// it, and MSVC's lack of x64 inline asm.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";

export function InlineAsmContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmInl_intro",
          "Sometimes a C program needs one instruction the compiler will not write by itself: read the cycle counter, ask the processor what it supports, use a special-purpose instruction. There are three ways to get it: a separate assembly file, as in the calling-convention chapter; inline assembly, written inside the C function; or an intrinsic or builtin, a function the compiler knows. This chapter teaches GCC's inline assembly, shows how easily it goes wrong, and makes the case that the third way is usually the right one.")}
      </Lead>

      <Goals t={t} id="asmInl" items={[
        "Read and write GCC extended asm: template, outputs, inputs and clobbers.",
        "Choose the right constraints (=r, +r, a, m) and explain what a wrong one does.",
        "Say when asm needs volatile or a \"memory\" clobber.",
        "Prefer a builtin or an intrinsic when one exists, and recognise the few cases where hand-written assembly pays off.",
      ]} />

      <H2>{tx(t, "asmInl_syntaxTitle", "Extended asm")}</H2>
      <p>
        {tx(t, "asmInl_syntaxBody",
          "GCC and Clang accept an __asm__ statement with four parts separated by colons. The compiler does not read your instructions. It copies the template into its output, replacing %0, %1… with the registers it chose, and relies entirely on the other three parts to know what the code reads, writes and destroys.")}
      </p>
      <CodeBlock lang="c" filename="add.c" t={t}>{`int add(int a, int b) {
    __asm__("add %0, %1"        // template: %0 and %1 become registers
            : "+r"(a)           // outputs: a is read and written, in a register
            : "r"(b)            // inputs: b, in a register
            : "cc");            // clobbers: add changes the flags
    return a;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "asmInl_hCons", "Constraint"), tx(t, "asmInl_hMeans", "Means")]}
        rows={[
          ["r", tx(t, "asmInl_c1", "any general register, chosen by the compiler")],
          ["m", tx(t, "asmInl_c2", "a memory operand: the template gets an address such as DWORD PTR [rdi]")],
          ["i", tx(t, "asmInl_c3", "an immediate, a constant known at compile time")],
          ["a, b, c, d, S, D", tx(t, "asmInl_c4", "exactly eax, ebx, ecx, edx, esi, edi (or their 64-bit forms)")],
          ["=", tx(t, "asmInl_c5", "output only: the old value is not needed and is not loaded")],
          ["+", tx(t, "asmInl_c6", "input and output: loaded before, used after")],
          ["&", tx(t, "asmInl_c7", "early clobber: written before all inputs are read, so it must not share a register with them")],
        ]}
      />
      <p>
        {tx(t, "asmInl_clobBody",
          "Clobbers list what else the asm destroys: register names such as \"rcx\", \"cc\" for the flags, and \"memory\" when it reads or writes memory the compiler cannot see in the operands. GCC writes templates in AT&T syntax by default; every example here is compiled with -masm=intel, so the templates use the syntax of this track. Code meant for others should either use AT&T or state the flag clearly.")}
      </p>

      <H2>{tx(t, "asmInl_bugTitle", "A wrong constraint compiles fine")}</H2>
      <p>
        {tx(t, "asmInl_bugBody",
          "The compiler checks the syntax of the four parts, never whether they describe the template truthfully. Here is the add function with one character different, = instead of +, called as add(2, 40) on Linux:")}
      </p>
      <CompilerOutputFigure t={t} programs={["inlineAdd"]} />
      <p>
        {tx(t, "asmInl_bugAfter",
          "Built with -O0, the same wrong version printed 80; with -O2 it printed 4198504; there was no warning in either case. A bug that changes with the optimisation level is the signature of a lie in the constraints. When in doubt, look at the generated code: it shows exactly which registers the compiler gave you.")}
      </p>

      <H2>{tx(t, "asmInl_volTitle", "volatile and the \"memory\" clobber")}</H2>
      <p>
        {tx(t, "asmInl_volBody",
          "To the optimiser, an asm statement with outputs is a calculation like any other. If its outputs are unused it can be deleted, if it repeats with the same inputs it can be merged, and it can be moved out of loops. That is right for a calculation and wrong for an instruction with side effects:")}
      </p>
      <CompilerOutputFigure t={t} programs={["inlineVol"]} />
      <LessonTable
        headers={[tx(t, "asmInl_hTool", "Tool"), tx(t, "asmInl_hEffect", "Effect")]}
        rows={[
          ["__asm__ volatile", tx(t, "asmInl_v1", "the statement is never deleted or merged, and keeps its place relative to other volatile code")],
          ["\"memory\"", tx(t, "asmInl_v2", "the asm may read or write any memory: values cached in registers are written back before it and reloaded after it")],
          ["__asm__ volatile(\"\" ::: \"memory\")", tx(t, "asmInl_v3", "no instruction at all, only a compiler barrier: loads and stores may not be moved across it. It does not stop the processor reordering; that takes a fence or an atomic")],
        ]}
      />

      <H2>{tx(t, "asmInl_tscTitle", "Example: reading the time-stamp counter")}</H2>
      <p>
        {tx(t, "asmInl_tscBody",
          "rdtsc reads a 64-bit counter that the processor increments at a fixed rate, and returns it split in two: the low half in eax and the high half in edx. C has no operator for that, so it is a classic use of inline asm. The a and d constraints pin the outputs to those registers:")}
      </p>
      <CodeBlock lang="c" filename="ticks.c" t={t}>{`static inline unsigned long long ticks(void) {
    unsigned lo, hi;
    __asm__ volatile("rdtsc" : "=a"(lo), "=d"(hi));   // volatile: every call reads the clock
    return (unsigned long long)hi << 32 | lo;
}

// The same with an intrinsic, from <x86intrin.h>:
//     unsigned long long t = __rdtsc();`}</CodeBlock>
      <p>
        {tx(t, "asmInl_tscAfter",
          "Two calls back to back measured 36 ticks on the Linux test machine. On modern processors the counter runs at a constant reference frequency, not at the current clock speed, so ticks are not exactly cycles; and the processor may run rdtsc out of order with the code around it unless an lfence is placed before it. For timing whole functions, clock_gettime is simpler and portable.")}
      </p>

      <H2>{tx(t, "asmInl_builtinTitle", "Builtins and intrinsics usually win")}</H2>
      <p>
        {tx(t, "asmInl_builtinBody",
          "For most special instructions the compiler already offers a function that becomes that instruction, and knows what it does: it can compute it at compile time, schedule it, vectorise around it, and pick a fallback for an older processor. Counting the 1 bits of a number shows the difference:")}
      </p>
      <CompilerOutputFigure t={t} programs={["popcount"]} />
      <LessonTable
        headers={[tx(t, "asmInl_hBuiltin", "Builtin"), tx(t, "asmInl_hInstr", "Instruction on x86-64"), tx(t, "asmInl_hDoes", "Does")]}
        rows={[
          ["__builtin_popcount(x)", "popcnt", tx(t, "asmInl_b1", "number of 1 bits")],
          ["__builtin_ctz(x) / __builtin_clz(x)", "tzcnt / lzcnt (bsf / bsr)", tx(t, "asmInl_b2", "zero bits below the lowest 1 / above the highest 1")],
          ["__builtin_bswap32(x)", "bswap", tx(t, "asmInl_b3", "reverse the byte order, for big-endian file formats and networks")],
          ["__builtin_expect(c, 1)", tx(t, "asmInl_b4i", "none"), tx(t, "asmInl_b4", "tells gcc which way a branch usually goes, to lay out the likely path first")],
          ["__builtin_prefetch(p)", "prefetcht0", tx(t, "asmInl_b5", "asks for a cache line before it is needed")],
          ["_mm_add_ps, _mm256_… ", tx(t, "asmInl_b6i", "SSE, AVX…"), tx(t, "asmInl_b6", "the intrinsics of the SIMD chapter")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "asmInl_msvc",
          "Microsoft's compiler supports inline assembly only for 32-bit x86. For x64 and ARM64 it has none: Windows code uses intrinsics (__rdtsc, __cpuid, _mm_…) or separate .asm files built with MASM. Intrinsics are the portable choice across compilers.")}
      </Callout>

      <H2>{tx(t, "asmInl_whenTitle", "When is assembly worth it?")}</H2>
      <LessonTable
        headers={[tx(t, "asmInl_hCase", "Case"), tx(t, "asmInl_hWhy", "Why")]}
        rows={[
          [tx(t, "asmInl_w1", "instructions with no C equivalent and no intrinsic"), tx(t, "asmInl_w1v", "operating system kernels: switching tasks, entering user mode, boot code, interrupt handlers; the system-call wrappers inside libc")],
          [tx(t, "asmInl_w2", "code that must take the same time whatever the data"), tx(t, "asmInl_w2v", "cryptography: a compiler may turn constant-time C into a branch that leaks secrets through timing")],
          [tx(t, "asmInl_w3", "a hot loop, after measuring"), tx(t, "asmInl_w3v", "video codecs such as dav1d and FFmpeg, and math libraries such as OpenBLAS, keep hand-written SIMD kernels per processor, and win because of it")],
          [tx(t, "asmInl_w4", "everything else"), tx(t, "asmInl_w4v", "not worth it: the compiler's code is usually as good, stays correct when the surrounding code changes, and runs on every processor you compile for")],
        ]}
      />
      <p>
        {tx(t, "asmInl_whenAfter",
          "For most programmers the lasting value of this track is reading: knowing what the compiler made of your code, why a loop is slow, and what a crash dump or a disassembly means. Writing assembly is the rare case, and when it comes, the tools of these chapters are what you need.")}
      </p>

      <H2>{tx(t, "asmInl_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmInl_try1", "Write unsigned max_leaf(void) with inline asm that runs cpuid with eax = 0 and returns eax. Which constraints do you need for eax, ebx, ecx and edx, and why must ebx be listed even though you do not use it?")}</li>
        <li>{tx(t, "asmInl_try2", "Rewrite it with __get_cpuid from <cpuid.h>. Compare the generated code on Compiler Explorer.")}</li>
        <li>{tx(t, "asmInl_try3", "Compile int f(void) { return __builtin_popcount(0xF0F0); } with -O2. Then do the same with the inline asm version. What can the compiler do with one that it cannot do with the other?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmInl" items={[
        "Extended asm has a template and three lists: outputs, inputs, clobbers. The compiler trusts the lists and never reads the template.",
        "Constraints pick registers or memory (r, m, a, d…); = is output only, + is read and write, & is early clobber.",
        "A wrong constraint compiles without a warning and gives results that change with the optimisation level.",
        "Without volatile, asm with unused outputs can be deleted or merged; \"memory\" makes the compiler reload memory around it.",
        "Builtins and intrinsics produce the same instructions and let the optimiser keep working; prefer them.",
        "MSVC has no inline asm on x64 or ARM64: intrinsics or separate files only.",
        "Hand-written assembly pays off in kernels, constant-time crypto and measured hot loops; reading assembly pays off everywhere.",
      ]} />
    </Article>
  );
}
