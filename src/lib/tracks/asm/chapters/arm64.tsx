"use client";

// Performance 3: ARM64 compared — where ARM64 runs; registers (x0–x30, w
// halves, xzr, sp, the link register, v0–v31) next to x86-64; load/store and
// fixed 4-byte instructions (gcc 14 output for both processors: max with
// csel, sum with post-indexed ldr, a call with bl/stp/ldp, a 64-bit constant
// with movz/movk); flags only on request (adds/subs, cbz, b.cond); the
// AAPCS64 convention; a complete Linux program in ARM64 assembly, run for real
// (Hello + exit status 55); the weaker memory model.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CompilerOutputFigure } from "@/components/lesson/figures/asm/CompilerOutputFigure";

export function Arm64Content({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmArm_intro",
          "x86-64 is not the only 64-bit processor family that matters. Every phone, Apple's Macs since 2020, the Raspberry Pi and a growing share of cloud servers run ARM64, also called AArch64. Its assembly is different in style, built on ideas the x86 lessons will make easy to follow: more registers, instructions that are all the same size, and memory touched only by loads and stores. This chapter compares the two side by side, with gcc's output for both, and ends with a complete ARM64 program run on Linux.")}
      </Lead>

      <Goals t={t} id="asmArm" items={[
        "Name the ARM64 registers and their x86-64 counterparts, including the zero register and the link register.",
        "Explain what load/store architecture and fixed-size instructions mean, and how they change the code.",
        "Read gcc's ARM64 output for a comparison, a loop, a call and a large constant.",
        "Write and run a small Linux program in ARM64 assembly.",
      ]} />

      <H2>{tx(t, "asmArm_regsTitle", "Registers")}</H2>
      <LessonTable
        headers={[tx(t, "asmArm_hWhat", "What"), "x86-64", "ARM64"]}
        rows={[
          [tx(t, "asmArm_r1", "general registers"), "16: rax … r15", tx(t, "asmArm_r1v", "31: x0 … x30")],
          [tx(t, "asmArm_r2", "32-bit half"), "eax, r8d…", tx(t, "asmArm_r2v", "w0 … w30; writing one zeroes the top half, as on x86")],
          [tx(t, "asmArm_r3", "zero"), tx(t, "asmArm_r3v", "none (xor eax, eax)"), tx(t, "asmArm_r3a", "xzr / wzr: reads as 0, writes are discarded")],
          [tx(t, "asmArm_r4", "stack pointer"), "rsp", tx(t, "asmArm_r4v", "sp, kept a multiple of 16 at all times")],
          [tx(t, "asmArm_r5", "return address"), tx(t, "asmArm_r5v", "on the stack"), tx(t, "asmArm_r5a", "x30, the link register (lr)")],
          [tx(t, "asmArm_r6", "frame pointer"), "rbp", "x29 (fp)"],
          [tx(t, "asmArm_r7", "floating point and SIMD"), "xmm0 – xmm15", tx(t, "asmArm_r7v", "v0 – v31, 128 bits; d0 is a double, s0 a float")],
          [tx(t, "asmArm_r8", "flags"), "ZF SF CF OF", tx(t, "asmArm_r8v", "N Z C V: negative, zero, carry, overflow")],
        ]}
      />
      <p>
        {tx(t, "asmArm_regsBody",
          "Twice as many registers means fewer values spilled to the stack. The zero register is used everywhere: cmp is really subs with the result thrown into xzr, and mov x0, xzr clears x0. The program counter is not a general register, as on x86.")}
      </p>

      <H2>{tx(t, "asmArm_lsTitle", "Load/store, and every instruction is 4 bytes")}</H2>
      <p>
        {tx(t, "asmArm_lsBody",
          "x86 grew from the 1970s as a CISC design, complex instruction set computer: one instruction can read memory, compute and write back, and instructions are 1 to 15 bytes long. ARM64 follows the RISC idea, reduced instruction set computer: arithmetic works only on registers, only ldr and str and their variants touch memory, and every instruction is exactly 4 bytes. Decoding is simpler, which lets wide processors such as Apple's decode eight instructions per cycle; the price is more instructions for some jobs. Compare gcc's output for the same C on both:")}
      </p>
      <CompilerOutputFigure t={t} programs={["armMax", "armSum", "armCall", "armBig"]} />
      <LessonTable
        headers={[tx(t, "asmArm_hMode", "Addressing"), "ARM64", tx(t, "asmArm_hMeans", "Means")]}
        rows={[
          [tx(t, "asmArm_m1", "offset"), "ldr w1, [x0, 8]", tx(t, "asmArm_m1v", "read at x0 + 8, like [rax + 8]")],
          [tx(t, "asmArm_m2", "register, scaled"), "ldr w1, [x0, x2, lsl 2]", tx(t, "asmArm_m2v", "read at x0 + x2 × 4, like [rax + rdx*4]")],
          [tx(t, "asmArm_m3", "pre-index"), "ldr w1, [x0, 4]!", tx(t, "asmArm_m3v", "x0 += 4 first, then read at the new x0")],
          [tx(t, "asmArm_m4", "post-index"), "ldr w1, [x0], 4", tx(t, "asmArm_m4v", "read at x0, then x0 += 4: the pointer walk of the sum loop")],
          [tx(t, "asmArm_m5", "pair"), "stp x29, x30, [sp, -16]!", tx(t, "asmArm_m5v", "store two registers in one instruction; ldp loads two")],
        ]}
      />

      <H2>{tx(t, "asmArm_flagsTitle", "Flags only when you ask")}</H2>
      <p>
        {tx(t, "asmArm_flagsBody",
          "On x86, almost every arithmetic instruction changes the flags. On ARM64 only the ones with an s do: add leaves the flags alone, adds sets them. That frees the compiler to put other work between a comparison and the branch that uses it. Branches add a few shortcuts of their own:")}
      </p>
      <LessonTable
        headers={["ARM64", tx(t, "asmArm_hDoes", "Does"), tx(t, "asmArm_hX86", "x86-64 equivalent")]}
        rows={[
          ["cmp w0, w1", tx(t, "asmArm_f1", "subs wzr, w0, w1: flags only"), "cmp eax, ecx"],
          ["b.lt label", tx(t, "asmArm_f2", "branch if less, signed"), "jl label"],
          ["cbz x0, label", tx(t, "asmArm_f3", "branch if x0 is zero, no flags needed"), "test rax, rax · jz label"],
          ["tbnz x0, 3, label", tx(t, "asmArm_f4", "branch if bit 3 of x0 is 1"), "bt rax, 3 · jc label"],
          ["csel w0, w1, w2, ge", tx(t, "asmArm_f5", "w0 = ge ? w1 : w2"), "cmovge"],
          ["cset w0, eq", tx(t, "asmArm_f6", "w0 = 1 if equal, else 0"), "sete al"],
        ]}
      />

      <H2>{tx(t, "asmArm_convTitle", "The calling convention")}</H2>
      <LessonTable
        headers={[tx(t, "asmArm_hRole", "Role"), tx(t, "asmArm_hRegs", "AAPCS64 registers")]}
        rows={[
          [tx(t, "asmArm_c1", "arguments and result"), tx(t, "asmArm_c1v", "x0 – x7 (result in x0); v0 – v7 for floating point")],
          [tx(t, "asmArm_c2", "scratch (caller-saved)"), "x9 – x15, x16, x17"],
          [tx(t, "asmArm_c3", "callee-saved"), tx(t, "asmArm_c3v", "x19 – x28, x29; the low 64 bits of v8 – v15")],
          [tx(t, "asmArm_c4", "reserved"), tx(t, "asmArm_c4v", "x18, the platform register: do not use it (macOS and Windows need it)")],
        ]}
      />
      <p>
        {tx(t, "asmArm_convBody",
          "bl saves the return address in x30 rather than on the stack, so a leaf function, one that calls nothing, never touches memory for its call. A function that does call others saves x29 and x30 with one stp at the start and restores them with one ldp at the end, as the call example above shows.")}
      </p>

      <H2>{tx(t, "asmArm_progTitle", "A complete ARM64 program")}</H2>
      <p>
        {tx(t, "asmArm_progBody",
          "Linux on ARM64 uses the svc instruction for system calls, with the call's number in x8 and the arguments in x0 to x5. The numbers differ from x86-64: write is 64 and exit is 93. This program prints a line and exits with the sum 1 + 2 + … + 10. It uses the GNU assembler's syntax, the usual one on ARM, where comments start with //:")}
      </p>
      <CodeBlock lang="nasm" filename="hello64.s" t={t}>{`        .global _start
        .text
_start:
        mov     x0, 1                   // fd 1: standard output
        adr     x1, msg                 // x1 = address of msg
        mov     x2, 14                  // 14 bytes
        mov     x8, 64                  // system call 64 = write
        svc     0                       // ask the kernel

        mov     x0, 0                   // sum = 0
        mov     x1, 10                  // i = 10
loop:   add     x0, x0, x1              // sum += i
        subs    x1, x1, 1               // i -= 1, and set the flags
        b.ne    loop                    // again while i != 0
        mov     x8, 93                  // system call 93 = exit, status in x0
        svc     0

msg:    .ascii  "Hello, ARM64!\\n"`}</CodeBlock>
      <CodeBlock lang="bash" filename="build.sh" t={t}>{`as hello64.s -o hello64.o        # on an ARM64 machine (Raspberry Pi, Graviton…)
ld hello64.o -o hello64
./hello64                        # Hello, ARM64!
echo $?                          # 55

# on an x86-64 PC: cross tools and an emulator
aarch64-linux-gnu-as hello64.s -o hello64.o
aarch64-linux-gnu-ld hello64.o -o hello64
qemu-aarch64 ./hello64`}</CodeBlock>
      <p>
        {tx(t, "asmArm_progAfter",
          "Both results were checked by running the program on ARM64 Linux. adr computes an address relative to the instruction itself, the ARM version of a RIP-relative lea. On macOS the system calls work differently (svc 0x80, number in x16) and C names start with an underscore, as on Intel Macs.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "asmArm_memWarn",
          "ARM64 has a weaker memory model than x86. x86 keeps stores in program order as seen by other cores; ARM64 may let another core see two stores in the opposite order. Multithreaded C that \"worked\" on x86 thanks to that, without atomics, can fail on ARM. With C11 atomics or C++ std::atomic the compiler inserts the barriers each processor needs (ARM64 uses ldar, stlr and dmb), which is one more reason to use them.")}
      </Callout>

      <H2>{tx(t, "asmArm_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmArm_try1", "On Compiler Explorer, pick an ARM64 gcc and compile the struct examples from the arrays chapter. How does ARM64 multiply i by 24?")}</li>
        <li>{tx(t, "asmArm_try2", "Change hello64.s to use cbnz x1, loop instead of subs and b.ne. What else must change?")}</li>
        <li>{tx(t, "asmArm_try3", "Compile the float sum with -O3 -ffast-math for ARM64. Which instruction plays the role of addps, and which registers does it use?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmArm" items={[
        "ARM64 (AArch64) has 31 general registers x0–x30 with 32-bit halves w0–w30, a zero register xzr, and 32 SIMD registers v0–v31.",
        "It is a load/store design: arithmetic only on registers, memory only through ldr/str and friends.",
        "Every instruction is 4 bytes, so a 64-bit constant takes a mov and up to three movk.",
        "Flags change only with the s forms (adds, subs); cbz, tbnz and csel save instructions.",
        "bl puts the return address in x30; functions that call others save x29 and x30 with stp.",
        "AAPCS64 passes eight arguments in x0–x7; x19–x28 are callee-saved; x18 is reserved.",
        "Linux system calls use svc 0 with the number in x8 (write = 64, exit = 93).",
        "ARM64's memory model is weaker than x86's: use atomics for data shared between threads.",
      ]} />
    </Article>
  );
}
