// ── English notes for the compiler-output figure: Performance section ───────
// Same format as compilerNotes.ts: one paragraph per program and level, keyed
// figAsmCe_<id>_<level> for translation. Timings quoted here were measured on
// a Ryzen 5 5600X (Zen 3) with gcc 14.

import type { PerfProgramId } from "./compilerDataPerf";

export const PERF_NAMES: Record<PerfProgramId, string> = {
  scale: "scale by k",
  fsum: "float sum",
  intrin: "intrinsics",
  branch: "if in a loop",
  ilp: "accumulators",
  armMax: "max",
  armSum: "sum",
  armCall: "a call",
  armBig: "64-bit constant",
  inlineAdd: "\"=r\" or \"+r\"",
  inlineVol: "volatile",
  popcount: "popcount",
};

export const PERF_NOTES: Record<PerfProgramId, string[]> = {
  scale: [
    "-O2 keeps this loop scalar: movss loads one float, mulss multiplies it by k (in xmm0, where the third argument arrived), and movss stores it back. One element per trip.",
    "-O3 vectorises. shufps xmm2, xmm2, 0 copies k into all four lanes of xmm2, a broadcast. The loop at .L4 then loads 4 floats with movups, multiplies them by the 4 copies of k with mulps and stores 4 back: 4 elements per trip. The code after the loop handles the 1 to 3 elements left over, and arrays shorter than 4 jump straight there.",
    "-mavx2 allows the 256-bit ymm registers. vbroadcastss copies k into all 8 lanes of ymm2, and vmulps multiplies 8 floats read straight from memory: 8 elements per trip. The v instructions are the AVX encodings, with three operands, so the destination need not be a source. vzeroupper clears the upper halves of the ymm registers before returning, because leaving them dirty slows down older SSE code on some processors.",
  ],
  fsum: [
    "Even at -O3 this float sum is not vectorised. The loop is unrolled 4 times, but every addss adds into the same xmm0, one after another. Vectorising would add the elements in another order, (a0 + a4 + …) + (a1 + a5 + …), and float addition is not associative: the result could change in its last bits. gcc does not change your results without permission.",
    "-ffast-math gives that permission. addps keeps four partial sums in the four lanes of xmm0, and after the loop movhlps, shufps and two more addps fold the lanes into one. The answer can differ slightly from the -O3 one. For most code that is fine; for some, such as a physics simulation that must replay identically, it is not.",
  ],
  intrin: [
    "Intrinsics are C functions that each stand for one instruction, declared in immintrin.h. __m128 is one xmm register's worth: 4 floats. _mm_loadu_ps becomes movups (u for unaligned: any address works), _mm_add_ps becomes addps, and _mm_storeu_ps becomes a movups to memory. You choose the instructions; the compiler still chooses the registers and the order.",
    "The AVX versions use __m256 and the _mm256_ prefix: 8 floats in a ymm register. The compiler folded one load into vaddps, which may read its last operand from memory. This needs -mavx (or -march=native) to compile, and a processor with AVX to run: on one without it, the program dies with SIGILL, illegal instruction.",
  ],
  branch: [
    "With if-conversion turned off, the if stays a real branch. p[i] >= 128 is tested as test al, al / jns: a byte of 128 or more has its top bit set, so jns (jump if not sign) skips the add for the small ones. With random data this jump goes one way or the other at random, and the predictor guesses wrong about half the time. Measured: 2.02 ns per element on random data, 0.38 ns once the same data is sorted.",
    "gcc's normal -O2 code has no branch inside the loop. It always computes s + p[i], and cmovs (move if sign) keeps the new sum only when the byte is 128 or more. It does a little more work per element, but nothing depends on a guess: 0.43 ns per element on random and sorted data alike.",
  ],
  ilp: [
    "One accumulator: each addss adds into xmm0 and must wait for the previous one to finish. gcc unrolled the loop twice, but the two additions still form a single chain. An addss takes 3 cycles on this processor (Zen 3), so the loop cannot beat 3 cycles per element, however much else the CPU could do at the same time. Measured: 0.64 ns per element.",
    "Four accumulators are four chains: xmm0, xmm3, xmm1 and xmm2 each collect every fourth element. The four addss in one trip do not depend on each other, so the CPU starts one each cycle while the others are still in flight, and the three addss after the loop combine the partial sums. Measured: 0.17 ns per element, 3.85 times faster, with the same number of additions. (-fno-tree-vectorize stops gcc from turning the four sums into one addps.)",
  ],
  armMax: [
    "x86-64: compare, copy one argument into eax, conditional move. Instructions have two operands, and cmovge eax, esi overwrites its first one.",
    "ARM64: the arguments arrive in w0 and w1, the 32-bit halves of x0 and x1, and the result goes back in w0. csel w0, w1, w0, ge is conditional select: w0 = b if the comparison said greater or equal, otherwise a. With three operands, no extra copy is needed.",
  ],
  armSum: [
    "x86-64: add eax, DWORD PTR [rdi] reads memory and adds in one instruction.",
    "ARM64 cannot add from memory. It is a load/store architecture: only loads and stores touch memory. ldr w1, [x2], 4 loads a[i] and then adds 4 to x2 (post-indexed addressing), so the pointer moves in the same instruction, and add w0, w0, w1 sums in registers. add x3, x2, w1, uxtw 2 works out the end: it zero-extends n and shifts it left by 2 (× 4) inside the add. ble and bne are the conditional branches, officially written b.le and b.ne.",
  ],
  armCall: [
    "x86-64: call pushes the return address. The function saves rbx and rbp (callee-saved), keeps x in ebx and the first result in ebp across the calls, and aligns the stack with sub rsp, 8.",
    "ARM64: bl, branch with link, puts the return address in x30, the link register, instead of on the stack. A function that calls others must save x30 itself: stp, store pair, writes x29 (the frame pointer) and x30 in one instruction, after moving sp down by 32 (the ! means \"update sp\"). x19 and x20 are callee-saved like rbx and keep x and the first result. ldp, load pair, restores them, and ret jumps to x30.",
  ],
  armBig: [
    "x86-64 has a 10-byte instruction that carries a whole 64-bit constant: movabs, a mov with a 64-bit immediate.",
    "Every ARM64 instruction is exactly 4 bytes, so a 64-bit constant cannot fit in one. mov x0, 57072 loads the low 16 bits (0xdef0), and each movk, move and keep, writes 16 more bits at a shift of 16, 32 or 48 and keeps the rest: four instructions, 16 bytes. Fixed-size instructions are a big part of why ARM decoders are simple.",
  ],
  inlineAdd: [
    "The template \"add %0, %1\" adds operand 1 (b) into operand 0 (a). \"=r\" declares a as output only, so the compiler assumes the old value of a is not needed and never loads it. At -O2 it picked eax, which still held whatever was left there, and the program printed 4198504 instead of 42. At -O0 it printed 80, because the register happened to hold b. No warning: the compiler trusts the constraints and never reads the template.",
    "\"+r\" means read and write: the compiler must put a in the register first (mov eax, edi) and use the register afterwards. Now the program prints 42. The constraints are the whole contract between your asm and the optimiser.",
  ],
  inlineVol: [
    "An __asm__ with outputs and no volatile counts as a pure calculation: if nothing uses lo and hi, the compiler deletes it, like any unused expression. What remains is an empty loop counting to 100 in steps of 2.",
    "volatile says the asm has effects beyond its outputs, so it must stay, as many times as the source runs it. The loop is unrolled twice, with two rdtsc per trip.",
  ],
  popcount: [
    "__builtin_popcount counts the 1 bits. The basic x86-64 instruction set, the 2003 baseline every x86-64 processor has, has no instruction for it, so gcc calls a library function, __popcountdi2.",
    "-mpopcnt tells gcc the processor has popcnt, as every x86 chip from about 2008 on does: one instruction. The xor eax, eax before it breaks a false dependency on the old eax that some Intel processors have.",
    "Inline asm gets the same instruction, but loses the xor, and the compiler can no longer compute the answer at compile time when x is a constant, or choose a different instruction for another processor. The builtin with the right flag (-mpopcnt, or -march=x86-64-v2) is better on every count.",
  ],
};
