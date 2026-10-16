"use client";

// From C 1: reading compiler output — three ways to see it (gcc -S,
// objdump, Compiler Explorer); the directives gcc writes and which to ignore;
// GAS Intel syntax next to NASM; -O0 (every variable in memory) against
// -O1/-O2/-O3 in a figure with real gcc 14 output (square, max with cmov,
// x / 10 by a magic multiply, a sum loop that turns into pointer walking and
// SIMD); a five-step reading method on the -O2 sum.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";

export function ReadingCompilerOutputContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmRead_intro",
          "Most assembly people read today was not written by a person. It comes out of a compiler, and reading it answers questions the source cannot: did this loop get vectorised, why is this function slow, what did the optimiser do with my undefined behavior? This chapter shows three ways to see the assembly for your C, what to skip in it, and how the same function changes from -O0 to -O3.")}
      </Lead>

      <Goals t={t} id="asmRead" items={[
        "Get the assembly for a C function with gcc -S, objdump or Compiler Explorer.",
        "Tell the instructions apart from the directives, and translate gcc's Intel syntax to NASM's.",
        "Explain why -O0 code stores every variable in memory, and name three things -O2 does instead.",
        "Read an unknown function by its arguments, its return value and its loops.",
      ]} />

      <H2>{tx(t, "asmRead_waysTitle", "Three ways to see the assembly")}</H2>
      <LessonTable
        headers={[tx(t, "asmRead_hTool", "Tool"), tx(t, "asmRead_hGives", "What you get")]}
        rows={[
          ["gcc -S -masm=intel -O2 square.c", tx(t, "asmRead_w1", "square.s, the assembly the compiler would hand to the assembler, before any machine code exists. -masm=intel asks for Intel syntax; the default is AT&T.")],
          ["objdump -d -M intel square.o", tx(t, "asmRead_w2", "the disassembly of a finished object file or program: the real bytes, decoded back into instructions. It works on any binary, even without the source.")],
          ["godbolt.org", tx(t, "asmRead_w3", "Compiler Explorer: type C on the left, see the assembly on the right, with colours linking each C line to its instructions. It has hundreds of compilers and versions.")],
        ]}
      />
      <CodeBlock lang="bash" filename="terminal" t={t}>{`gcc -S -masm=intel -O2 square.c         # writes square.s
gcc -c -O2 square.c                     # writes square.o (machine code)
objdump -d -M intel square.o            # decodes square.o back into assembly`}</CodeBlock>

      <H2>{tx(t, "asmRead_rawTitle", "What gcc writes, and what to skip")}</H2>
      <p>
        {tx(t, "asmRead_rawBody",
          "This is the whole square.s for int square(int x) { return x * x; } with gcc 14 -O2 on Linux. Only three lines are instructions. The lines that start with a dot are directives: notes for the assembler and the linker, not code the CPU runs.")}
      </p>
      <CodeBlock lang="nasm" filename="square.s" t={t}>{`        .file   "square.c"
        .intel_syntax noprefix
        .text
        .p2align 4
        .globl  square
        .type   square, @function
square:
.LFB0:
        .cfi_startproc
        imul    edi, edi
        mov     eax, edi
        ret
        .cfi_endproc
.LFE0:
        .size   square, .-square
        .ident  "GCC: (GNU) 14.2.0"
        .section        .note.GNU-stack,"",@progbits`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "asmRead_hDir", "Directive"), tx(t, "asmRead_hMeans", "Means")]}
        rows={[
          [".text", tx(t, "asmRead_d1", "what follows is code, like NASM's section .text")],
          [".p2align 4", tx(t, "asmRead_d2", "start the function at an address that is a multiple of 2⁴ = 16, which the CPU fetches faster")],
          [".globl square", tx(t, "asmRead_d3", "make the name visible to the linker, like NASM's global")],
          [".type / .size", tx(t, "asmRead_d4", "record that square is a function and how many bytes it takes, for debuggers and the linker")],
          [".LFB0, .LFE0, .L2…", tx(t, "asmRead_d5", "local labels, invented by the compiler; .LFB0 is \"function begin 0\". Names that start with .L never leave the file")],
          [".cfi_…", tx(t, "asmRead_d6", "call frame information: how to find the return address at each point, used by debuggers and by C++ exceptions to unwind the stack")],
          [".ident, .note.GNU-stack", tx(t, "asmRead_d7", "the compiler's name, and the note that the stack need not be executable (the previous chapter wrote it by hand)")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "asmRead_cfiTip",
          "Add -fno-asynchronous-unwind-tables to drop the .cfi lines from a .s file you only want to read. Compiler Explorer hides all directives by default.")}
      </Callout>
      <p>
        {tx(t, "asmRead_syntaxBody",
          "gcc's Intel syntax is the GNU assembler's version of it, and differs from NASM in a few spellings. The instructions themselves are the same.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmRead_hGas", "gcc / GNU as"), "NASM", tx(t, "asmRead_hNote", "Note")]}
        rows={[
          ["DWORD PTR [rbp-4]", "dword [rbp-4]", tx(t, "asmRead_s1", "the size of a memory operand")],
          [".LC0[rip]", "[rel LC0]", tx(t, "asmRead_s2", "RIP-relative address of a constant")],
          ["cdqe", "cdqe", tx(t, "asmRead_s3", "sign-extend eax into rax; also written movsxd rax, eax")],
          ["# comment", "; comment", tx(t, "asmRead_s4", "comments")],
        ]}
      />

      <H2>{tx(t, "asmRead_o0Title", "-O0: every variable lives in memory")}</H2>
      <p>
        {tx(t, "asmRead_o0Body",
          "Without optimisation, gcc translates each statement on its own and keeps every variable, arguments included, in a slot of the stack frame. Before each use it loads the value from memory, and after each change it stores it back. The code is long and slow, but a debugger can stop on any line and show or change any variable, because each one has an address. Pick a function and compare the levels:")}
      </p>
      <CompilerOutputFigure t={t} programs={["square", "max", "div10", "sum"]} />
      <p>
        {tx(t, "asmRead_levels",
          "-O1 turns on the main optimisations, -O2 adds more that do not make the code much bigger (it is what most projects ship), and -O3 adds aggressive ones such as vectorising loops. -Os optimises for size. Debug builds use -O0 or -Og, which optimises a little without getting in the way of the debugger.")}
      </p>

      <H2>{tx(t, "asmRead_optTitle", "What the optimiser did")}</H2>
      <LessonTable
        headers={[tx(t, "asmRead_hTrick", "Change"), tx(t, "asmRead_hWhere", "Where to see it"), tx(t, "asmRead_hWhy", "Why")]}
        rows={[
          [tx(t, "asmRead_t1", "values stay in registers"), "square, sum", tx(t, "asmRead_t1w", "a register is ready at once; even the fastest cache takes 4 or 5 cycles")],
          [tx(t, "asmRead_t2", "no frame pointer"), tx(t, "asmRead_t2v", "every function"), tx(t, "asmRead_t2w", "without locals on the stack, push rbp / mov rbp, rsp / pop rbp do nothing useful, and rbp becomes a free register")],
          [tx(t, "asmRead_t3", "a branch becomes cmov"), "max", tx(t, "asmRead_t3w", "no jump means nothing to predict wrongly")],
          [tx(t, "asmRead_t4", "division becomes multiplication"), "x / 10", tx(t, "asmRead_t4w", "imul takes 3 cycles; div takes between about 10 and 30, depending on the processor")],
          [tx(t, "asmRead_t5", "an index becomes a pointer"), "sum", tx(t, "asmRead_t5w", "add rdi, 4 replaces load i, widen, multiply, add the base")],
          [tx(t, "asmRead_t6", "a loop handles 4 elements at once"), "sum -O3", tx(t, "asmRead_t6w", "one SSE instruction adds four ints")],
        ]}
      />
      <p>
        {tx(t, "asmRead_magic",
          "The division needs a closer look. Dividing by 10 is the same as multiplying by 1/10, and 1/10 can be written as a fraction with a power of two below: m / 2³⁵ with m = 2³⁵ ÷ 10 = 3,435,973,836.8, rounded up to 3,435,973,837. So x / 10 becomes (x × m) >> 35: a multiplication, then a shift right by 35 bits, which divides by 2³⁵ and throws away the remainder. Rounding m up by 0.2 adds 0.2 × x / 2³⁵ to the quotient: less than 0.025 for any 32-bit x. A real x / 10 is never closer than 0.1 to the next whole number, so the error can never push the result over it. Compilers do this for every division by a constant.")}
      </p>
      <p>
        {tx(t, "asmRead_fold",
          "The optimiser also works across functions. Add int main(void) { return square(7); } and build with -O2: main does not call square at all.")}
      </p>
      <CodeBlock lang="nasm" filename="objdump -d -M intel prog" t={t}>{`0000000000401020 <main>:
  401020:  b8 31 00 00 00        mov    eax,0x31
  401025:  c3                    ret

0000000000401120 <square>:
  401120:  0f af ff              imul   edi,edi
  401123:  89 f8                 mov    eax,edi
  401125:  c3                    ret`}</CodeBlock>
      <p>
        {tx(t, "asmRead_foldBody",
          "gcc inlined square into main and worked out 7 × 7 while compiling: 0x31 is 49. square still exists because another file might call it. objdump also shows what gcc -S cannot: the address and the bytes of each instruction.")}
      </p>

      <H2>{tx(t, "asmRead_methodTitle", "A method for reading a function")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmRead_m1", "Find the label with the function's name, and its ret instructions: there may be more than one.")}</li>
        <li>{tx(t, "asmRead_m2", "Name the arguments with the calling convention: the first in edi or rdi, the second in esi or rsi, then edx, ecx; doubles in xmm0, xmm1. The width tells you the type: edi is an int, rdi a pointer or a long.")}</li>
        <li>{tx(t, "asmRead_m3", "Look at what is in eax, rax or xmm0 at each ret: that is the result.")}</li>
        <li>{tx(t, "asmRead_m4", "Find the loops: a jump back to a label above it. The cmp before it tells you when the loop ends.")}</li>
        <li>{tx(t, "asmRead_m5", "Give each register a name, as if it were a variable, and write the names in comments.")}</li>
      </ol>
      <p>{tx(t, "asmRead_methodRun", "Here is the -O2 sum read that way:")}</p>
      <CodeBlock lang="nasm" filename="sum, gcc -O2" t={t}>{`sum:                                ; int sum(const int *a, int n): a = rdi, n = esi
        test    esi, esi            ; n <= 0?
        jle     .L4                 ;   then return 0
        movsx   rsi, esi            ; widen n to 64 bits
        xor     eax, eax            ; s = 0
        lea     rdx, [rdi+rsi*4]    ; end = a + n
.L3:                                ; loop:
        add     eax, DWORD PTR [rdi];   s += *a
        add     rdi, 4              ;   a++
        cmp     rdi, rdx            ;   until a == end
        jne     .L3                 ;   (jump back: this is the loop)
        ret                         ; return s (in eax)
.L4:
        xor     eax, eax
        ret                         ; return 0`}</CodeBlock>

      <H2>{tx(t, "asmRead_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmRead_try1", "On Compiler Explorer, compile unsigned div7(unsigned x) { return x / 7; } with -O2. The constant and the steps are different from x / 10: find the multiply and the shifts.")}</li>
        <li>{tx(t, "asmRead_try2", "Compile sum with -O3 and then with -O3 -fno-tree-vectorize. How many instructions does each version have?")}</li>
        <li>{tx(t, "asmRead_try3", "Change max to unsigned. Which cmov does gcc choose now, and why?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmRead" items={[
        "gcc -S shows the assembly before it is assembled; objdump -d decodes a finished binary; Compiler Explorer links each C line to its instructions.",
        "Lines that start with a dot are directives for the assembler and linker; .L names are local labels.",
        "gcc's Intel syntax writes DWORD PTR and .LC0[rip] where NASM writes dword and [rel LC0].",
        "-O0 keeps every variable in memory so a debugger can see it; -O2 keeps values in registers and drops the frame pointer.",
        "Optimisers replace branches with cmov, division by a constant with a multiply and a shift, and indexes with moving pointers; -O3 vectorises loops.",
        "Read a function by its arguments (the convention), its result (eax, xmm0) and its loops (jumps back).",
      ]} />
    </Article>
  );
}
