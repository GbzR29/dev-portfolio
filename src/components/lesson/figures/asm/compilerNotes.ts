// ── English notes for the compiler-output figure ────────────────────────────
// One paragraph per program and level (index into CE_PROGRAMS[id].levels),
// keyed figAsmCe_<id>_<level> for translation. Levels that look the same as
// the one before point back to it with SAME.

import type { CeProgramId } from "./compilerData";

export const SAME = "Same as the level before: this one finds nothing more to change.";

export const CE_NAMES: Record<CeProgramId, string> = {
  square: "square",
  max: "max",
  div10: "x / 10",
  sum: "sum of an array",
  second: "p + 1",
  local: "&x",
  null: "null check",
  over: "x + 1 > x",
  alias: "int * and float *",
  asan: "AddressSanitizer",
};

export const CE_NOTES: Record<CeProgramId, string[]> = {
  square: [
    "-O0 means no optimisation. gcc sets up a stack frame (push rbp, mov rbp, rsp), stores the argument x from edi into memory at [rbp-4], and reads it back for the multiply. Every variable gets a home in memory, so a debugger can show it and change it at any line.",
    "-O1: x stays in edi, where it arrived. imul edi, edi multiplies it by itself, and mov eax, edi puts the result where the calling convention wants it. No frame, no memory.",
    SAME,
    "-O3 adds heavier transformations, such as vectorising loops. There is no loop here, so nothing changes.",
  ],
  max: [
    "At -O0 the ?: becomes a real branch: compare a with b, jle (jump if less or equal, signed) to the line that loads b, otherwise load a and jmp over it. a and b are first stored on the stack and reloaded at each use.",
    "-O1 removes the branch. eax = b, then cmovge eax, edi, a conditional move: copy a into eax if a ≥ b, by the flags of the cmp. With no jump, there is nothing for the CPU to predict wrongly.",
    SAME,
    SAME,
  ],
  div10: [
    "Even at -O0 there is no div instruction: a division takes tens of cycles. gcc multiplies by 3435973837 instead: imul rax, rdx makes a 64-bit product, shr rax, 32 keeps its top half, and shr eax, 3 divides by 8 more. In all, x × 3435973837 ÷ 2³⁵.",
    "The same trick, with the two shifts merged: shr rax, 35. 3435973837 is 2³⁵ ÷ 10 rounded up, so the product is x ÷ 10 times 2³⁵ plus a tiny error that never reaches the next whole number for a 32-bit x. For x = 123: 123 × 3435973837 = 422,624,781,951, and that ÷ 2³⁵ (34,359,738,368) is 12.3, so the shift leaves 12.",
    SAME,
    SAME,
  ],
  sum: [
    "-O0 follows the C word for word: s and i live at [rbp-4] and [rbp-8], a and n at [rbp-24] and [rbp-28]. Each a[i] is computed from scratch: load i, widen it to 64 bits with cdqe, multiply by 4 with lea, add the base. Every trip round the loop reads and writes memory.",
    "-O1 keeps everything in registers and swaps the index for a pointer: rax walks from a to a + n (in rcx), 4 bytes at a time, and add edx, [rax] is the whole s += a[i]. The test esi, esi / jle at the top skips the loop when n ≤ 0.",
    "-O2: the same loop, tidier. rdi itself is the moving pointer, rdx the end, and xor eax, eax sets s = 0 in 2 bytes instead of the 5 of mov eax, 0. The loop body is 4 instructions.",
    "-O3 vectorises. movdqu loads 4 ints at once into xmm2, and paddd adds 4 pairs in one instruction, so each trip handles 4 elements. After the loop, shifts (psrldq) and adds fold the 4 partial sums into one, and a tail handles the last 1 to 3 elements. SIMD gets its own chapter in the next section.",
  ],
  second: [
    "At -O0 even the pointer p is a local variable: it arrives in rdi, is stored at [rbp-8], and is loaded into rax before each use. Look at the numbers inside the brackets: p + 1 is +4 for an int, p[1] is +8 for a long. The compiler multiplied by sizeof while compiling; the CPU only sees bytes.",
    "-O2: *(p + 1) is mov eax, [rdi+4], a 4-byte read. p[1] for a long is mov rax, [rdi+8], an 8-byte read. next only works out the address and reads nothing: lea rax, [rdi+4]. The brackets are the *; the pointer arithmetic is the number inside them.",
  ],
  local: [
    "x lives at [rbp-4]. &x is lea rax, [rbp-4]: the address of that stack slot, passed to bump in rdi. After the call, x is read back from memory, because bump may have changed it through the pointer.",
    "Even at -O2, x has to stay in memory: a register has no address, and bump needs one. gcc keeps x at [rsp+12] and reads it back after the call. Taking a variable's address is one of the few things that keep the optimiser from moving it into a register.",
  ],
  null: [
    "-O0 does what the source says: read p->hp ([rax+4], since hp sits at offset 4), then compare p with 0 and return −1 if it is NULL. The check comes too late: with p = NULL the read has already crashed.",
    "-O2 deleted the check. p->hp is read first, and reading through NULL is undefined behavior, so the compiler concludes that p is not NULL and the if can never be true. One load is left. On Linux both versions crash when p is NULL; the deleted check matters where address 0 can be mapped, as in a 2009 Linux kernel bug.",
    "-fno-delete-null-pointer-checks tells gcc not to draw that conclusion, and the test rdi, rdi / je comes back. The Linux kernel is built with this flag.",
  ],
  over: [
    "Signed overflow is undefined, so gcc assumes x + 1 never overflows, and then x + 1 > x is always true. It applies this even at -O0: the function returns 1. With x = INT_MAX the hardware would wrap x + 1 around to INT_MIN, and INT_MIN > INT_MAX is false, yet the program prints 1.",
    "-O2: the same answer without the frame, mov eax, 1.",
    "-fwrapv defines signed overflow as wrapping around, the way the hardware does it. Now x + 1 > x is false exactly when x = INT_MAX, so gcc compares edi with 2147483647 and returns the result of that test (setne al). The program prints 0.",
  ],
  alias: [
    "-O0 stores 1 through a, stores 2.0f (bits 0x40000000, which read as an int are 1073741824) through b, then reads *a back from memory. main passes the same address twice, so the float has overwritten the int: the program prints 1073741824.",
    "-O2 applies the strict aliasing rule: an int * and a float * may not point to the same object, so a store through b cannot change *a, which must still be 1. The return value becomes the constant 1, set even before the float store. Given the same address twice, the program prints 1 while memory holds 1073741824.",
    "-fno-strict-aliasing drops the rule. After the float store, gcc reads *a again from [rdi], and the program prints 1073741824. The Linux kernel uses this flag too. In portable C, copy the bytes with memcpy instead of casting the pointer.",
  ],
  asan: [
    "Without checks, a[i] is one load. Nothing compares i with the size of the array: the CPU reads whatever is at a + i × 4.",
    "-fsanitize=address puts a check before the load. Every 8 bytes of memory have one shadow byte at (address >> 3) + 0x7fff8000 (2147450880): 0 means all 8 bytes may be used, a number k from 1 to 7 means only the first k, and a negative number means none. If the shadow byte is not 0 and the last byte of the 4-byte read, (address & 7) + 3, is not below k, the code calls __asan_report_load4, which prints the error and stops the program. The extra code at the end registers the file with the sanitizer when the program starts.",
  ],
};
