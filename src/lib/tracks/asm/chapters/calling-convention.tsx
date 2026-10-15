"use client";

// Control flow 4: the calling convention — what an ABI is; System V argument
// and return registers, the stack beyond six arguments (figure comparing
// Win64); caller- and callee-saved registers with a break-it program (35 →
// 34) and gcc -O0's push rbx; alignment at a call, checked on Linux (printf
// with a double crashes when misaligned, prints 0.000000 when al is wrong);
// calling printf from NASM (wrt ..plt, .note.GNU-stack) and an asm function
// from C, run on Linux and Windows; Win64 and ARM64 in brief.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { CallConvFigure } from "@/components/lesson/figures/asm/CallConvFigure";

export function CallingConventionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmCall_intro",
          "call and ret only move rip. Where the arguments go, where the result comes back, and which registers a function may overwrite are not decided by the CPU: they are an agreement, the calling convention. Every compiler on a system follows the same one, which is why C, C++, Rust and your assembly can call each other. This chapter covers the convention of Linux and macOS, System V, with the differences on Windows, and ends with assembly and C calling each other for real.")}
      </Lead>

      <Goals t={t} id="asmCall" items={[
        "Say in which registers a function finds its first six integer arguments and its floating-point arguments, and where it puts its result.",
        "Tell caller-saved from callee-saved registers, and save the ones you use.",
        "Keep the stack aligned to 16 bytes at every call.",
        "Call a C function from assembly, and write an assembly function that C can call.",
      ]} />

      <H2>{tx(t, "asmCall_abiTitle", "An agreement called the ABI")}</H2>
      <p>
        {tx(t, "asmCall_abiBody",
          "The calling convention is part of the ABI, the application binary interface: the rules that machine code compiled separately must share to work together. The API is what you see in a header file; the ABI is what that header means in registers and bytes. Linux, macOS and the BSDs use the System V AMD64 ABI. Windows uses its own, usually called the Microsoft x64 convention or Win64.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmCall_hWhat", "What"), "System V"]}
        rows={[
          [tx(t, "asmCall_a1", "integer and pointer arguments 1–6"), "rdi, rsi, rdx, rcx, r8, r9"],
          [tx(t, "asmCall_a2", "floating-point arguments 1–8"), "xmm0 – xmm7"],
          [tx(t, "asmCall_a3", "more arguments"), tx(t, "asmCall_a3v", "on the stack, above the return address: [rsp + 8], [rsp + 16]… at entry")],
          [tx(t, "asmCall_a4", "integer result"), tx(t, "asmCall_a4v", "rax (eax for an int); a 16-byte result in rdx:rax")],
          [tx(t, "asmCall_a5", "floating-point result"), "xmm0"],
        ]}
      />
      <p>
        {tx(t, "asmCall_mnemonic",
          "A way to remember the first four: \"Diane's silk dress costs\": rdi, rsi, rdx, rcx. Integer and floating-point arguments are counted separately, so in f(int a, double b, int c), a goes in edi, b in xmm0 and c in esi. Pick a function below and compare the two conventions:")}
      </p>
      <CallConvFigure t={t} />
      <p>
        {tx(t, "asmCall_figNote",
          "Each layout in the figure matches what gcc 14 generates on Linux and on Windows (MinGW). One more Windows surprise: long is 4 bytes there and 8 on Linux, which is why the examples use int and long long.")}
      </p>

      <H2>{tx(t, "asmCall_saveTitle", "Who saves which registers")}</H2>
      <p>
        {tx(t, "asmCall_saveBody",
          "A function needs registers to work, but so does its caller. The convention splits them in two groups:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmCall_hGroup", "Group"), "System V", tx(t, "asmCall_hRule", "Rule")]}
        rows={[
          [tx(t, "asmCall_g1", "caller-saved (scratch)"), "rax, rcx, rdx, rsi, rdi, r8 – r11, xmm0 – xmm15", tx(t, "asmCall_g1r", "a call may destroy them. If the caller needs a value after the call, the caller must keep it somewhere safe.")],
          [tx(t, "asmCall_g2", "callee-saved (preserved)"), "rbx, rbp, r12 – r15, rsp", tx(t, "asmCall_g2r", "a function that changes one must restore it before ret, usually with push at the start and pop at the end.")],
        ]}
      />
      <p>
        {tx(t, "asmCall_saveRun",
          "The caller below keeps 10 in rbx across a call. The function borrows rbx and gives it back. Remove its push and pop and run it again.")}
      </p>
      <CpuFigure t={t} programs={["saved"]} />
      <p>
        {tx(t, "asmCall_saveBreak",
          "Without the push and pop, the function leaves 9 in rbx, and the caller adds 9 instead of 10: exit status 34 instead of 35. Nothing crashes. This is the worst kind of calling-convention bug, because it shows up far from its cause, in code that is correct. Compilers use the rule in both directions. gcc -O0 compiles int twice(int x) { return square(x) + square(x + 1); } with push rbx in the prologue: it keeps the first result in ebx, where the second call cannot destroy it.")}
      </p>

      <H2>{tx(t, "asmCall_alignTitle", "Alignment at the call")}</H2>
      <p>
        {tx(t, "asmCall_alignBody",
          "The previous chapter's rule matters as soon as you call code you did not write. rsp must be a multiple of 16 at the call instruction. Library functions may rely on it, using instructions such as movaps that crash on an unaligned address. On Linux, a main that calls printf(\"%f\\n\", 2.5) without fixing the alignment dies with a segmentation fault inside printf.")}
      </p>
      <p>
        {tx(t, "asmCall_alBody",
          "Variadic functions such as printf add one more rule. They do not know how many floating-point arguments they got, so the caller puts the number of xmm registers it used in al. Forget it with a double, leaving al = 0, and printf does not look at xmm0: the same program printed 0.000000 on Linux, with no error. Both results were checked on a real Linux machine.")}
      </p>

      <H2>{tx(t, "asmCall_cFromAsmTitle", "Calling C from assembly")}</H2>
      <p>
        {tx(t, "asmCall_cFromAsmBody",
          "With the convention in hand, an assembly program can use the C library. It defines main instead of _start, because gcc links in the C start-up code that sets up the library and then calls main. main returns its exit status in eax.")}
      </p>
      <CodeBlock lang="nasm" filename="square.asm" t={t}>{`        default rel
        extern  printf                      ; defined in the C library
        section .note.GNU-stack noalloc noexec nowrite progbits

        section .data
fmt:    db      "%d squared is %d", 10, 0   ; C strings end with a 0 byte

        section .text
        global  main
main:
        sub     rsp, 8              ; at entry rsp is 8 off; now aligned to 16
        lea     rdi, [fmt]          ; 1st argument: the format string
        mov     esi, 7              ; 2nd argument
        mov     edx, 49             ; 3rd argument
        xor     eax, eax            ; al = 0: no xmm registers used
        call    printf wrt ..plt    ; through the PLT, see below
        xor     eax, eax            ; main returns 0
        add     rsp, 8              ; undo the sub before ret
        ret`}</CodeBlock>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`nasm -f elf64 square.asm -o square.o
gcc square.o -o square          # gcc links the C library and its start-up code
./square                        # 7 squared is 49`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "asmCall_hLine", "Line"), tx(t, "asmCall_hWhy", "Why")]}
        rows={[
          ["extern printf", tx(t, "asmCall_l1", "tells NASM the name is defined elsewhere; the linker finds it")],
          [".note.GNU-stack", tx(t, "asmCall_l2", "declares that this file does not need an executable stack; without it the linker warns")],
          ["wrt ..plt", tx(t, "asmCall_l3", "printf lives in a shared library loaded at a random address; the call goes through a small table the loader fills in, the PLT (procedure linkage table). gcc builds position-independent executables by default, and they require it")],
        ]}
      />

      <H2>{tx(t, "asmCall_asmFromCTitle", "Calling assembly from C")}</H2>
      <p>
        {tx(t, "asmCall_asmFromCBody",
          "The other direction is how assembly is mostly used today: a small, hot function written by hand, called from a C or C++ program. The function only has to follow the convention.")}
      </p>
      <CodeBlock lang="nasm" filename="sumsq.asm" t={t}>{`        section .note.GNU-stack noalloc noexec nowrite progbits
        section .text
        global  sumsq
sumsq:                          ; int sumsq(int a, int b)
        mov     eax, edi        ; a arrives in edi
        imul    eax, edi        ; a * a
        imul    esi, esi        ; b arrives in esi: b * b
        add     eax, esi        ; the result goes back in eax
        ret                     ; only scratch registers used: nothing to save`}</CodeBlock>
      <CodeBlock lang="c" filename="main.c" t={t}>{`#include <stdio.h>

int sumsq(int a, int b);        // the prototype tells the compiler the convention to use

int main(void) {
    printf("%d\\n", sumsq(3, 4));
    return 0;
}`}</CodeBlock>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`nasm -f elf64 sumsq.asm -o sumsq.o
gcc main.c sumsq.o -o main
./main                          # 25`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "asmCall_winBreak",
          "Built for Windows instead (nasm -f win64, then MinGW's gcc), the same sumsq.asm links without a single warning and prints 0. On Windows a and b arrive in ecx and edx, so the function squares whatever edi and esi happened to hold. The version that reads ecx and edx prints 25. The linker only matches names; it cannot see conventions.")}
      </Callout>

      <H2>{tx(t, "asmCall_otherTitle", "Windows and ARM64 in brief")}</H2>
      <LessonTable
        headers={["", "System V", "Win64", "ARM64 (AAPCS64)"]}
        rows={[
          [tx(t, "asmCall_o1", "integer arguments"), "rdi rsi rdx rcx r8 r9", "rcx rdx r8 r9", "x0 – x7"],
          [tx(t, "asmCall_o2", "floating-point arguments"), "xmm0 – xmm7", tx(t, "asmCall_o2w", "xmm0 – xmm3, by position"), "v0 – v7"],
          [tx(t, "asmCall_o3", "result"), "rax / xmm0", "rax / xmm0", "x0 / v0"],
          [tx(t, "asmCall_o4", "callee-saved"), "rbx rbp r12–r15", "rbx rbp rdi rsi r12–r15 xmm6–xmm15", "x19 – x28, x29"],
          [tx(t, "asmCall_o5", "return address"), tx(t, "asmCall_o5s", "on the stack"), tx(t, "asmCall_o5w", "on the stack, plus 32 bytes of shadow space"), tx(t, "asmCall_o5a", "in register x30, the link register")],
        ]}
      />
      <p>
        {tx(t, "asmCall_otherBody",
          "On ARM64 the call instruction, bl (branch with link), puts the return address in x30 instead of pushing it, and ret jumps to x30. A function that calls nothing never touches memory for the round trip; one that does call others saves x30 on the stack itself. macOS on Intel follows System V, with one twist: C names get a leading underscore, so you write call _printf.")}
      </p>

      <H2>{tx(t, "asmCall_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmCall_try1", "Write long add6(long a, long b, long c, long d, long e, long f) in assembly and call it from C. Then add a seventh argument: where does the function find it?")}</li>
        <li>{tx(t, "asmCall_try2", "Make square.asm print 2.5 with \"%f\": the double goes in xmm0 (load it from a dq 2.5 in .data with movsd), and al must be 1. Then delete the sub rsp, 8 and watch it crash.")}</li>
        <li>{tx(t, "asmCall_try3", "In the callee-saved program, keep the value in r12 instead of rbx. What has to change in the function? And if you used r11?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmCall" items={[
        "The calling convention is an agreement, part of the ABI; the CPU does not enforce it.",
        "System V: integer arguments in rdi, rsi, rdx, rcx, r8, r9; floating-point ones in xmm0–xmm7; the rest on the stack. Results in rax or xmm0.",
        "Caller-saved registers may be destroyed by any call. Callee-saved ones (rbx, rbp, r12–r15) must be restored before ret.",
        "rsp must be a multiple of 16 at each call; at entry it is 8 off.",
        "For a variadic call such as printf, al holds the number of xmm registers used.",
        "From assembly, call C with extern and wrt ..plt, and define main when gcc links. From C, declare a prototype and follow the convention in the assembly.",
        "Win64 passes four arguments in rcx, rdx, r8, r9 and reserves shadow space; ARM64 passes eight in x0–x7 and keeps the return address in x30.",
      ]} />
    </Article>
  );
}
