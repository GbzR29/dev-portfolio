// ── Programs for the xmm figure ──────────────────────────────────────────────
// Listings are gcc 14 -O2 output for the C in each `c` (Compiler Explorer,
// Intel syntax). Notes are the English text per line, keyed
// figAsmXmm_<id>_<line> for translation; the note for line -1 is shown before
// the first step.

import type { SseProgram } from "./sseModel";

export type SseProgramId = "celsius" | "celsiusF" | "average" | "trunc" | "isCold" | "same";

export const SSE_PROGRAMS: Record<SseProgramId, SseProgram & { c: string; notes: Record<number, string> }> = {
  celsius: {
    c: "double to_celsius(double f) { return (f - 32.0) * 5.0 / 9.0; }",
    regs: ["xmm0"], consts: { ".LC0": 32, ".LC1": 5, ".LC2": 9 },
    inputs: [["212", { xmm: [212] }], ["100", { xmm: [100] }], ["-40", { xmm: [-40] }]],
    code: [
      "to_celsius:",
      "        subsd   xmm0, QWORD PTR .LC0[rip]",
      "        mulsd   xmm0, QWORD PTR .LC1[rip]",
      "        divsd   xmm0, QWORD PTR .LC2[rip]",
      "        ret",
    ],
    notes: {
      [-1]: "The argument f arrives in xmm0, in the low lane: a double is 8 of the register's 16 bytes. The high lane holds nothing useful.",
      1: "subsd = subtract, scalar, double: xmm0 = f − 32. The 32.0 is not inside the instruction. SSE has no immediate operands, so gcc stores the constant in memory (.LC0, in the read-only data) and the instruction reads it from there.",
      2: "mulsd: × 5.0, read from .LC1. Only the low lane changes; that is what scalar means.",
      3: "divsd: ÷ 9.0. gcc does not multiply by 5/9 in one step: 5/9 has no exact double, and the answer could change in the last bit. Without -ffast-math the compiler keeps your order of operations.",
      4: "ret: the double result goes back in xmm0, low lane.",
    },
  },
  celsiusF: {
    c: "float to_celsius_f(float f) { return (f - 32.0f) * 5.0f / 9.0f; }",
    regs: ["xmm0"], single: true, consts: { ".LC3": 32, ".LC4": 5, ".LC5": 9 },
    inputs: [["212", { xmm: [212] }], ["100", { xmm: [100] }], ["-40", { xmm: [-40] }]],
    code: [
      "to_celsius_f:",
      "        subss   xmm0, DWORD PTR .LC3[rip]",
      "        mulss   xmm0, DWORD PTR .LC4[rip]",
      "        divss   xmm0, DWORD PTR .LC5[rip]",
      "        ret",
    ],
    notes: {
      [-1]: "The same function with float. A float is 4 bytes, so xmm0 now reads as four lanes, and f is in the lowest one. A float keeps about 7 correct digits instead of 16.",
      1: "subss = subtract, scalar, single precision: only the lowest 4 bytes change. The constants are 4-byte floats this time (DWORD PTR).",
      2: "mulss: × 5.",
      3: "divss: ÷ 9. Compare the result with the double version: the float one runs out of digits sooner.",
      4: "A float result also goes back in xmm0, in the lowest lane.",
    },
  },
  average: {
    c: "return (double)s / n;   // long s in rax, int n in esi",
    regs: ["xmm0", "xmm1", "rax", "esi"], consts: {},
    cuts: [[1, 2]],
    inputs: [["7 / 2", { rax: 7, rsi: 2, xmm: [[1.5, 2.75], [0.25, 8]] }], ["-7 / 2", { rax: -7, rsi: 2, xmm: [[1.5, 2.75], [0.25, 8]] }], ["1 / 3", { rax: 1, rsi: 3, xmm: [[1.5, 2.75], [0.25, 8]] }]],
    code: [
      "average:   ...",
      "        pxor    xmm0, xmm0",
      "        pxor    xmm1, xmm1",
      "        cvtsi2sd        xmm0, rax",
      "        cvtsi2sd        xmm1, esi",
      "        divsd   xmm0, xmm1",
      "        ret",
    ],
    notes: {
      [-1]: "The end of average(), after its loop: the sum s is in rax and n in esi. xmm0 and xmm1 still hold leftovers from earlier code.",
      1: "pxor xmm0, xmm0 XORs the register with itself: all 16 bytes become 0, which is also the double 0.0.",
      2: "The same for xmm1.",
      3: "cvtsi2sd = convert signed integer to scalar double: xmm0 = (double)s. It writes only the low lane and keeps the high one, so the CPU has to wait for whatever last wrote xmm0. The pxor before it cuts that link: a zeroed register depends on nothing.",
      4: "xmm1 = (double)n, from the 32-bit esi.",
      5: "divsd: a real division, 3.5 for 7 / 2. In C, s / n without the cast would be an integer division (idiv) giving 3.",
      6: "The result goes back in xmm0.",
    },
  },
  trunc: {
    c: "int truncate_it(double x) { return (int)x; }",
    regs: ["xmm0", "eax"], consts: {},
    inputs: [["3.99", { xmm: [3.99] }], ["-3.99", { xmm: [-3.99] }], ["3e9", { xmm: [3e9] }], ["NaN", { xmm: [NaN] }]],
    code: [
      "truncate_it:",
      "        cvttsd2si       eax, xmm0",
      "        ret",
    ],
    notes: {
      [-1]: "x arrives in xmm0.",
      1: "cvttsd2si = convert with truncation scalar double to signed integer. The extra t rounds toward zero, as a C cast must: 3.99 → 3, −3.99 → −3. A value that does not fit in 32 bits, or a NaN, gives 0x80000000 = −2147483648, the \"integer indefinite\" value. In C that conversion is undefined behavior.",
      2: "An int result goes back in eax, like any integer.",
    },
  },
  isCold: {
    c: "int is_cold(double c) { return c < 5.0; }",
    regs: ["xmm0", "xmm1", "eax"], flags: true, consts: { ".LC1": 5 },
    inputs: [["3", { xmm: [3] }], ["20", { xmm: [20] }], ["5", { xmm: [5] }], ["NaN", { xmm: [NaN] }]],
    code: [
      "is_cold:",
      "        movsd   xmm1, QWORD PTR .LC1[rip]",
      "        xor     eax, eax",
      "        comisd  xmm1, xmm0",
      "        seta    al",
      "        ret",
    ],
    notes: {
      [-1]: "c arrives in xmm0.",
      1: "movsd loads 5.0 into xmm1. Loaded from memory, movsd also zeroes the high lane.",
      2: "eax = 0, so that seta can set only al afterwards.",
      3: "comisd compares xmm1 with xmm0, 5.0 with c, and sets the flags the way an unsigned compare does: CF = 1 if 5.0 < c, ZF = 1 if they are equal. If either side is NaN the result is \"unordered\", and ZF, PF and CF all become 1.",
      4: "seta = set if above: al = 1 when CF = 0 and ZF = 0, that is when 5.0 > c. For NaN, CF = ZF = 1, so al = 0: c < 5.0 is false, as C requires. This is why gcc swapped the operands. Comparing c with 5.0 and using setb (CF = 1) would answer 1 for NaN.",
      5: "eax is 1 or 0.",
    },
  },
  same: {
    c: "int same(double a, double b) { return a == b; }",
    regs: ["xmm0", "xmm1", "eax", "edx"], flags: true, consts: {},
    inputs: [["0.3, 0.1 + 0.2", { xmm: [0.3, 0.1 + 0.2] }], ["2, 2", { xmm: [2, 2] }], ["NaN, NaN", { xmm: [NaN, NaN] }]],
    code: [
      "same:",
      "        xor     eax, eax",
      "        ucomisd xmm0, xmm1",
      "        mov     edx, 0",
      "        setnp   al",
      "        cmovne  eax, edx",
      "        ret",
    ],
    notes: {
      [-1]: "a arrives in xmm0 and b in xmm1.",
      1: "eax = 0.",
      2: "ucomisd compares like comisd, but does not raise the invalid-operation exception for a quiet NaN, which is what == needs. Equal: ZF = 1. Unordered (a NaN): ZF = PF = CF = 1.",
      3: "edx = 0. gcc writes mov edx, 0 here and not xor edx, edx, because xor would overwrite the flags that ucomisd just set.",
      4: "setnp = set if not parity: al = 1 when PF = 0, that is when no NaN was involved.",
      5: "cmovne: if ZF = 0 (not equal), eax = edx = 0. So the result is 1 only when ZF = 1 and PF = 0: equal, and not NaN. NaN == NaN is false.",
      6: "eax is 1 or 0. 0.3 and 0.1 + 0.2 differ in their last bit, so they are not equal.",
    },
  },
};

export const SSE_NAMES: Record<SseProgramId, string> = {
  celsius: "double",
  celsiusF: "float",
  average: "int → double",
  trunc: "(int)x",
  isCold: "c < 5.0",
  same: "a == b",
};
