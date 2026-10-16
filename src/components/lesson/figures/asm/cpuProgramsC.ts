// ── Programs for the CPU figure: from C to assembly ─────────────────────────
// Same format as cpuPrograms.ts: each line carries the bytes NASM 2.16 printed
// in its listing. Exit statuses were checked on Linux (Compiler Explorer,
// NASM 3.01): points 60 / endless without inc rcx; pointsBad 32; walk 12 /
// SIGSEGV without the lea (rdi starts at 0) / endless without add rdi, 4.

import type { CpuProgram } from "./cpuPrograms";

export type CProgramId = "points" | "pointsBad" | "walk";

const pointsCode = (scale: 4 | 8): CpuProgram["code"] => [
  ["        default rel", ""],
  ["        section .data", ""],
  ["pts:    dd      1, 10, 2, 20, 3, 30", "010000000A0000000200000014000000030000001E000000"],
  ["", ""],
  ["        section .text", ""],
  ["        global  _start", ""],
  ["_start:", ""],
  ["        lea     rbx, [pts]", "488D1D(00000000)"],
  ["        xor     eax, eax", "31C0"],
  ["        xor     ecx, ecx", "31C9"],
  [`.next:  add     eax, [rbx + rcx*${scale} + 4]`, scale === 8 ? "0344CB04" : "03448B04"],
  ["        inc     rcx", "48FFC1"],
  ["        cmp     rcx, 3", "4883F903"],
  ["        jne     .next", "75F3"],
  ["        mov     edi, eax", "89C7"],
  ["        mov     eax, 60", "B83C000000"],
  ["        syscall", "0F05"],
];

const pointsNotes = {
  7: "rbx = the address of pts[0]. In C: struct point { int x; int y; } pts[3]; each point is 8 bytes, x at offset 0 and y at offset 4.",
  8: "sum = 0.",
  9: "i = 0, in rcx.",
  11: "i++.",
  12: "Compare i with 3, the number of points.",
  13: "Back to .next while i ≠ 3.",
  14: "The sum becomes the exit status.",
  15: "60 = exit.",
  16: "The process ends.",
};

export const C_PROGRAMS: Record<CProgramId, CpuProgram> = {
  // ── Arrays & structs: an array of structs ──
  points: {
    bin: "points", regs: ["rbx", "rcx", "rax"], cuts: [[11]], maxSteps: 60,
    watch: [{ sym: "pts", len: 24, as: "dword" }],
    code: pointsCode(8),
    notes: {
      ...pointsNotes,
      10: "pts[i].y lives at base + i × 8 + 4: 8 is sizeof(struct point), the stride from one point to the next, and 4 is the offset of y inside a point. One instruction works out the whole address and adds the int it finds there.",
    },
  },
  pointsBad: {
    bin: "points", regs: ["rbx", "rcx", "rax"],
    watch: [{ sym: "pts", len: 24, as: "dword" }],
    code: pointsCode(4),
    notes: {
      ...pointsNotes,
      10: "The stride is 4, the size of an int, but a point is 8 bytes. i = 0 reads offset 4, pts[0].y = 10, which is right. i = 1 reads offset 8, which is pts[1].x = 2. i = 2 reads offset 12, pts[1].y = 20. The CPU has no idea what a point is: it reads whatever the address names.",
      14: "10 + 2 + 20 = 32 instead of 10 + 20 + 30 = 60. No crash, no warning: a wrong stride just reads the wrong bytes.",
    },
  },

  // ── Pointers: walking an array with a pointer ──
  walk: {
    bin: "walk", regs: ["rdi", "rdx", "rax"], cuts: [[7], [13]], maxSteps: 60,
    watch: [{ sym: "nums", len: 16, as: "dword" }],
    code: [
      ["        default rel", ""],
      ["        section .data", ""],
      ["nums:   dd      7, 1, 4, 0", "07000000010000000400000000000000"],
      ["", ""],
      ["        section .text", ""],
      ["        global  _start", ""],
      ["_start:", ""],
      ["        lea     rdi, [nums]", "488D3D(00000000)"],
      ["        xor     eax, eax", "31C0"],
      [".loop:  mov     edx, [rdi]", "8B17"],
      ["        test    edx, edx", "85D2"],
      ["        jz      .done", "7408"],
      ["        add     eax, edx", "01D0"],
      ["        add     rdi, 4", "4883C704"],
      ["        jmp     .loop", "EBF2"],
      [".done:  mov     edi, eax", "89C7"],
      ["        mov     eax, 60", "B83C000000"],
      ["        syscall", "0F05"],
    ],
    notes: {
      7: "int *p = nums; The pointer is just the address of nums, in rdi. The list ends with a 0, the way a C string ends with a 0 byte.",
      8: "int s = 0;",
      9: "int v = *p; The [rdi] is the *: read the 4 bytes at the address in rdi.",
      10: "test edx, edx ANDs the value with itself: ZF = 1 only when v is 0.",
      11: "if (v == 0) break;",
      12: "s += v;",
      13: "p++; In C, p + 1 moves to the next int. In assembly there are no types: the compiler wrote add rdi, 4, because an int is 4 bytes.",
      14: "Back to the top of the loop.",
      15: "s = 7 + 1 + 4 = 12 becomes the exit status.",
      16: "60 = exit.",
      17: "The process ends with status 12.",
    },
  },
};

export const C_NAMES: Record<CProgramId, string> = {
  points: "pts[i].y",
  pointsBad: "wrong stride",
  walk: "walking a pointer",
};
