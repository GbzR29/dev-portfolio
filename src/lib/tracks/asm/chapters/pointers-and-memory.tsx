"use client";

// From C 4: pointers, memory and undefined behavior — a pointer is an
// address in a register, * is the brackets, p + 1 is scaled while compiling
// (gcc output, -O0 and -O2), &x keeps x in memory; walking an array with a
// pointer on the CPU (break it: NULL → SIGSEGV at 0, no p++ → endless); why
// NULL faults (unmapped page 0, vm.mmap_min_addr); UB as gcc sees it: the
// null check deleted, x + 1 > x folded, strict aliasing, each with the flag
// that turns it off and the output on Linux; no bounds checks, and what
// AddressSanitizer inserts; volatile.

import { CodeBlock, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";

export function PointersAndMemoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmPtr_intro",
          "In C a pointer has a type: int *, char *, struct player *. In the machine code the type is gone. A pointer is a 64-bit number in a register, and the only traces of its type are the size of each read and the numbers the compiler multiplied by. This chapter reads pointers in gcc's output, walks memory with one on the CPU, and then looks at what undefined behavior does to the assembly: the optimiser assumes it never happens, and writes code accordingly.")}
      </Lead>

      <Goals t={t} id="asmPtr" items={[
        "Translate *p, p[i], p + 1, &x and p->f into instructions, and back.",
        "Explain why dereferencing NULL ends in a segmentation fault, and who detects it.",
        "Recognise in gcc's output three optimisations that rely on undefined behavior, and the flags that turn them off.",
        "Say what AddressSanitizer and volatile change in the generated code.",
      ]} />

      <H2>{tx(t, "asmPtr_regTitle", "A pointer is an address in a register")}</H2>
      <LessonTable
        headers={["C", tx(t, "asmPtr_hAsm", "Assembly (p in rdi)"), tx(t, "asmPtr_hWhat", "What happens")]}
        rows={[
          ["int x = *p;", "mov eax, DWORD PTR [rdi]", tx(t, "asmPtr_r1", "the brackets are the *: read 4 bytes at the address in rdi")],
          ["*p = 5;", "mov DWORD PTR [rdi], 5", tx(t, "asmPtr_r2", "the same brackets on the left: write")],
          ["p[1]   or   *(p + 1)", "mov eax, DWORD PTR [rdi+4]", tx(t, "asmPtr_r3", "one int further: + 4 bytes. For a long *, + 8")],
          ["int *q = p + 1;", "lea rax, [rdi+4]", tx(t, "asmPtr_r4", "only the address is computed; nothing is read")],
          ["p->hp", "mov eax, DWORD PTR [rdi+4]", tx(t, "asmPtr_r5", "the field's offset, as in the last chapters")],
          ["&x", "lea rax, [rbp-4]", tx(t, "asmPtr_r6", "the address of x's stack slot")],
        ]}
      />
      <p>
        {tx(t, "asmPtr_regBody",
          "C's pointer arithmetic counts elements, the CPU counts bytes, and the compiler converts between them while compiling: p + 1 on an int * becomes + 4, on a long * + 8. Compare the levels, and look at what happens to a local variable whose address is taken:")}
      </p>
      <CompilerOutputFigure t={t} programs={["second", "local"]} />

      <H2>{tx(t, "asmPtr_walkTitle", "Walking memory with a pointer")}</H2>
      <p>
        {tx(t, "asmPtr_walkBody",
          "The C loop for (int *p = nums; *p != 0; p++) s += *p; walks a list that ends in 0, the way strlen walks a string. In assembly, p is rdi and p++ is add rdi, 4. Run it, then break it both ways: remove the lea, so the pointer starts at 0, the null pointer; or remove the add, so it never moves.")}
      </p>
      <CpuFigure t={t} programs={["walk"]} />

      <H2>{tx(t, "asmPtr_nullTitle", "Why NULL crashes")}</H2>
      <p>
        {tx(t, "asmPtr_nullBody",
          "C does not check pointers, and neither does the instruction. The check is done by the hardware, for free, on every memory access. The CPU translates each address through page tables that the kernel fills in, in pages of 4,096 bytes. Linux never maps the lowest pages of a process: by default nothing may be mapped below 65,536 (the setting vm.mmap_min_addr). A read at address 0, or at 4 for p->hp, finds no page; the CPU raises a page fault, the kernel sees that the address belongs to nothing, and sends the process SIGSEGV.")}
      </p>
      <p>
        {tx(t, "asmPtr_nullBig",
          "That is why NULL is 0, and why the protection has limits: a struct with a field at offset 100,000 read through a null pointer lands above the protected area, perhaps in mapped memory. Before vm.mmap_min_addr existed, a program could map page 0 itself, and kernel bugs that followed a null pointer would read the attacker's data instead of crashing.")}
      </p>

      <H2>{tx(t, "asmPtr_ubTitle", "Undefined behavior, seen by the optimiser")}</H2>
      <p>
        {tx(t, "asmPtr_ubBody",
          "The C standard leaves some operations undefined: reading through a null pointer, overflowing a signed integer, reading an object through a pointer of an unrelated type. The compiler does not insert checks for them. It does more: it assumes they never happen, and draws conclusions. In the assembly those conclusions are easy to see. The C/C++ track's chapter on undefined behavior has the rules; here are the instructions, and what each program printed on Linux:")}
      </p>
      <CompilerOutputFigure t={t} programs={["null", "over", "alias"]} />
      <LessonTable
        headers={[tx(t, "asmPtr_hRule", "Assumption"), tx(t, "asmPtr_hFlag", "Flag that turns it off"), tx(t, "asmPtr_hWho", "Who uses the flag")]}
        rows={[
          [tx(t, "asmPtr_f1", "a pointer that was dereferenced is not NULL"), "-fno-delete-null-pointer-checks", tx(t, "asmPtr_f1w", "the Linux kernel")],
          [tx(t, "asmPtr_f2", "signed arithmetic never overflows"), "-fwrapv", tx(t, "asmPtr_f2w", "code that relies on wrapping; -ftrapv makes overflow abort instead")],
          [tx(t, "asmPtr_f3", "pointers to different types never point to the same object"), "-fno-strict-aliasing", tx(t, "asmPtr_f3w", "the Linux kernel, and much older C code")],
        ]}
      />
      <p>
        {tx(t, "asmPtr_ubWhy",
          "These assumptions are not malice: they are what lets a compiler keep values in registers and remove checks it can prove useless. The overflow rule, for example, lets gcc treat for (int i = 0; i < n; i++) as a loop that runs exactly n times and replace the index by a moving pointer, as the sum function did two chapters ago. The price is that a bug in the source can become different code at every optimisation level.")}
      </p>

      <H2>{tx(t, "asmPtr_boundsTitle", "No bounds, unless you ask")}</H2>
      <p>
        {tx(t, "asmPtr_boundsBody",
          "a[10] on an array of 4 compiles to the same mov as a[1], with a different number in the brackets. The CPU reads what is there: another variable, a saved register, a return address. Only an address outside every mapped page faults. AddressSanitizer, turned on with -fsanitize=address, adds the missing check to every access. Here is what it adds to a one-line function:")}
      </p>
      <CompilerOutputFigure t={t} programs={["asan"]} />
      <p>
        {tx(t, "asmPtr_asanAfter",
          "The program also gets a runtime that surrounds every heap block and stack array with poisoned bytes and marks freed memory as poisoned, so reads past the end and use after free hit a negative shadow byte. The cost is about twice the run time and more memory, which is why it is for testing, not for release builds.")}
      </p>

      <H2>{tx(t, "asmPtr_volTitle", "volatile: memory that changes by itself")}</H2>
      <p>
        {tx(t, "asmPtr_volBody",
          "The optimiser also assumes that memory only changes when the program writes it. A loop that waits for a flag set by an interrupt handler or a device breaks that assumption. Here are two versions of void wait_for(int *flag) { while (*flag == 0) { } }, gcc -O2, the second with volatile int *:")}
      </p>
      <CodeBlock lang="nasm" filename="gcc -O2" t={t}>{`wait_for:                       ; int *flag
        mov     eax, DWORD PTR [rdi]    ; read *flag once
        test    eax, eax
        je      .L3
        ret
.L3:
        jmp     .L3                     ; then spin forever without reading it again

wait_for_v:                     ; volatile int *flag
.L6:
        mov     eax, DWORD PTR [rdi]    ; read *flag on every trip
        test    eax, eax
        je      .L6
        ret`}</CodeBlock>
      <p>
        {tx(t, "asmPtr_volAfter",
          "Without volatile, gcc reads the flag once: nothing in the loop writes it, so it cannot change, and an endless jmp is a faithful translation. volatile tells the compiler that every read and write must happen, in order, so the load stays inside the loop. It is meant for memory-mapped hardware registers and signal handlers. It does not make code thread-safe: for threads, use atomics, as the C/C++ concurrency chapter explains.")}
      </p>

      <H2>{tx(t, "asmPtr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmPtr_try1", "Compile char second_c(char *p) { return p[1]; } and double second_d(double *p) { return p[1]; }. What number is in the brackets, and which register receives the value?")}</li>
        <li>{tx(t, "asmPtr_try2", "Change set_both so that b is an int * too. Does gcc -O2 still return the constant 1? Why not?")}</li>
        <li>{tx(t, "asmPtr_try3", "Compile int f(int *a) { return a[4]; } with -O2 -fsanitize=address. The index is known while compiling: is the check still there?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmPtr" items={[
        "A pointer is a 64-bit address in a register; * is the brackets, and the type survives only as the size of each read and the scale.",
        "p + 1 adds sizeof(*p) bytes, multiplied while compiling; lea computes an address without reading memory.",
        "A variable whose address is taken has to live in memory: registers have no address.",
        "NULL faults because Linux never maps the lowest 64 KiB; the page tables catch the access, not C.",
        "The optimiser assumes undefined behavior never happens: it deletes null checks after a dereference, folds x + 1 > x to 1, and ignores stores through pointers of other types.",
        "-fno-delete-null-pointer-checks, -fwrapv and -fno-strict-aliasing turn those assumptions off.",
        "Nothing checks array bounds unless you add -fsanitize=address, which tests a shadow byte before each access.",
        "volatile forces every read and write to happen; it is for hardware and signals, not threads.",
      ]} />
    </Article>
  );
}
