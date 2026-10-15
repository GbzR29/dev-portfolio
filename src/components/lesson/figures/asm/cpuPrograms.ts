// ── Programs for the step-through CPU figure ─────────────────────────────────
// Each line carries the bytes NASM 2.16 printed for it in its listing
// (nasm -f elf64 -l); "(…)" / "[…]" are bytes the linker fills in. Notes are
// the English text for each line, keyed figAsmCpu_<id>_<line> for translation.
// The outputs and exit statuses were checked by running the same source on
// Linux (Compiler Explorer, NASM 3.01).

import type { Gpr, SrcLine } from "./cpuModel";
import { FLOW_NAMES, FLOW_PROGRAMS, type FlowProgramId } from "./cpuProgramsFlow";

export type Watch = { sym: string; len: number; as: "text" | "dword" };

export type CpuProgram = {
  code: SrcLine[];
  regs: Gpr[];                       // registers shown, in order
  flags?: boolean;                   // show ZF SF CF OF
  bytes?: boolean;                   // show the machine-code column
  snippet?: boolean;                 // a fragment: stops at its last line instead of running on
  watch?: Watch[];                   // memory shown under the registers
  cuts?: number[][];                 // lines that can be removed together ("break it"); the button sits on the first
  bin?: string;                      // executable name shown in the terminal
  stack?: boolean;                   // show the stack, one 8-byte slot per row
  stackBytes?: number;               // a small stack, so an overflow shows up in a few dozen steps
  maxSteps?: number;                 // an endless loop is stopped (Ctrl+C) after this many steps
  notes: Record<number, string>;
};

export type CpuProgramId = "tiny" | "subregs" | "hello" | "endian" | "array" | FlowProgramId;

export const CPU_PROGRAMS: Record<CpuProgramId, CpuProgram> = {
  ...FLOW_PROGRAMS,
  // ── What is assembly: fetch, decode, execute ──
  tiny: {
    bytes: true, snippet: true, regs: ["rax", "rbx"],
    code: [
      ["        mov     eax, 5", "B805000000"],
      ["        mov     ebx, 7", "BB07000000"],
      ["        add     eax, ebx", "01D8"],
      ["        imul    eax, eax", "0FAFC0"],
      ["        sub     eax, 44", "83E82C"],
    ],
    notes: {
      0: "The CPU fetches the 5 bytes at rip and decodes them: B8 means \"put the 4-byte number that follows into eax\". The number is 05 00 00 00, lowest byte first. eax = 5, and rip moves on by 5 bytes.",
      1: "BB is the same instruction for ebx. ebx = 7. rip moves on by another 5 bytes.",
      2: "add eax, ebx is only 2 bytes: 01 means add, and D8 names the two registers. eax = 5 + 7 = 12.",
      3: "imul eax, eax multiplies eax by itself: 12 × 12 = 144. This one takes 3 bytes.",
      4: "sub eax, 44 subtracts: 144 − 44 = 100. In the bytes 83 E8 2C, 2C is 44 written in hexadecimal.",
    },
  },

  // ── Registers: writing part of a register ──
  subregs: {
    bytes: true, snippet: true, regs: ["rax"],
    code: [
      ["        mov     rax, -1", "48C7C0FFFFFFFF"],
      ["        mov     al, 0x12", "B012"],
      ["        mov     ah, 0x34", "B434"],
      ["        mov     ax, 0xBEEF", "66B8EFBE"],
      ["        mov     eax, 1", "B801000000"],
      ["        xor     eax, eax", "31C0"],
    ],
    notes: {
      0: "mov rax, -1 sets all 64 bits to 1: sixteen f digits. Read as a signed number, that pattern is −1.",
      1: "mov al, 0x12 writes only the lowest byte. The other 56 bits keep their f digits.",
      2: "mov ah, 0x34 writes the second byte, bits 8 to 15. Only four registers have such a name: ah, bh, ch and dh.",
      3: "mov ax, 0xBEEF writes the low 16 bits, replacing both al and ah. The top 48 bits are still all ones.",
      4: "mov eax, 1 writes the low 32 bits, and the CPU clears the top 32 at the same time. This is the rule to remember: a 32-bit write fills the rest of the register with zeros.",
      5: "xor eax, eax: a value xor itself is 0. Since it is a 32-bit write, the whole of rax becomes 0. At 2 bytes it is the shortest way to zero a register.",
    },
  },

  // ── First program: write + exit ──
  hello: {
    bin: "hello", regs: ["rax", "rdi", "rsi", "rdx", "rcx", "r11"],
    cuts: [[10], [12, 13, 14]],
    watch: [{ sym: "msg", len: 17, as: "text" }],
    code: [
      ["        section .data", ""],
      ["msg:    db      \"Hello, assembly!\", 10", "48656C6C6F2C20617373656D626C79210A"],
      ["len     equ     $ - msg", ""],
      ["", ""],
      ["        section .text", ""],
      ["        global  _start", ""],
      ["_start:", ""],
      ["        mov     rax, 1", "B801000000"],
      ["        mov     rdi, 1", "BF01000000"],
      ["        mov     rsi, msg", "48BE[0000000000000000]"],
      ["        mov     rdx, len", "BA11000000"],
      ["        syscall", "0F05"],
      ["        mov     rax, 60", "B83C000000"],
      ["        xor     edi, edi", "31FF"],
      ["        syscall", "0F05"],
    ],
    notes: {
      7: "rax chooses the system call. 1 means write: send bytes to a file.",
      8: "rdi is write's first argument, the file descriptor. 1 is standard output, the terminal.",
      9: "rsi is the second argument: the address of the first byte to send. msg is the label of the string in .data.",
      10: "rdx is the third argument: how many bytes. The assembler worked out len for you: 17.",
      11: "syscall hands control to the Linux kernel. It writes the 17 bytes and puts its result in rax: the number of bytes written. The kernel also overwrites rcx and r11 on the way back.",
      12: "Now rax = 60, the exit system call.",
      13: "edi = 0 is the exit status. A register xor itself is 0, and the 32-bit write clears all of rdi.",
      14: "The kernel ends the process with status 0. The shell can show it with echo $?.",
    },
  },

  // ── mov and memory: little-endian loads ──
  endian: {
    bytes: true, snippet: true, regs: ["rax", "rbx", "rcx", "rsi"],
    watch: [{ sym: "msg", len: 17, as: "text" }],
    code: [
      ["        default rel", ""],
      ["        section .data", ""],
      ["msg:    db      \"Hello, assembly!\", 10", "48656C6C6F2C20617373656D626C79210A"],
      ["", ""],
      ["        section .text", ""],
      ["        global  _start", ""],
      ["_start:", ""],
      ["        lea     rsi, [msg]", "488D35(00000000)"],
      ["        mov     rax, [rsi]", "488B06"],
      ["        mov     al, [rsi + 7]", "8A4607"],
      ["        movzx   ebx, byte [rsi + 1]", "0FB65E01"],
      ["        mov     ecx, [msg + 7]", "8B0D(07000000)"],
    ],
    notes: {
      7: "lea works out an address without reading memory. rsi = the address of msg, 0x402000.",
      8: "mov rax, [rsi] reads the 8 bytes at that address. The first byte, 'H' = 0x48, lands in the lowest byte of rax: x86 is little-endian. Read the hex from the right: 48 65 6c 6c 6f 2c 20 61 is \"Hello, a\".",
      9: "mov al, [rsi + 7] reads a single byte, 'a' = 0x61, into al. The rest of rax does not change: it is an 8-bit write.",
      10: "movzx ebx, byte [rsi + 1] reads one byte, 'e' = 0x65, and fills the rest with zeros: rbx = 0x65. Use it to load a small value into a big register.",
      11: "mov ecx, [msg + 7] reads 4 bytes from the 8th byte on: a, s, s, e. In ecx they read 0x65737361, lowest byte first again.",
    },
  },

  // ── Addressing modes: sum of an array ──
  array: {
    bin: "sum", regs: ["rax", "rbx", "rcx", "rdi"],
    cuts: [[8]],
    watch: [{ sym: "nums", len: 16, as: "dword" }, { sym: "total", len: 4, as: "dword" }],
    code: [
      ["        default rel", ""],
      ["        section .data", ""],
      ["nums:   dd      10, 20, 30, 40", "0A000000140000001E00000028000000"],
      ["total:  dd      0", "00000000"],
      ["", ""],
      ["        section .text", ""],
      ["        global  _start", ""],
      ["_start:", ""],
      ["        lea     rbx, [nums]", "488D1D(00000000)"],
      ["        mov     eax, [rbx]", "8B03"],
      ["        add     eax, [rbx + 4]", "034304"],
      ["        mov     ecx, 2", "B902000000"],
      ["        add     eax, [rbx + rcx*4]", "03048B"],
      ["        add     eax, [rbx + rcx*4 + 4]", "03448B04"],
      ["        mov     [total], eax", "8905(10000000)"],
      ["        mov     edi, eax", "89C7"],
      ["        mov     eax, 60", "B83C000000"],
      ["        syscall", "0F05"],
    ],
    notes: {
      8: "rbx = the address of nums. From now on, [rbx + …] reaches into the array.",
      9: "mov eax, [rbx] reads the 4 bytes at rbx: nums[0] = 10. The size comes from eax, which is 32 bits.",
      10: "nums[1] sits 4 bytes further on, at [rbx + 4]. eax = 10 + 20 = 30.",
      11: "ecx = 2 plays the index i.",
      12: "[rbx + rcx*4] is base + index × scale: the address of nums[i] when each element is 4 bytes. eax = 30 + 30 = 60.",
      13: "Add a displacement of 4 and you reach nums[i + 1] = 40. eax = 100.",
      14: "mov [total], eax stores the sum in memory. [total] is RIP-relative: the instruction holds the distance from the next instruction to total.",
      15: "The sum becomes the exit status, so echo $? will print 100.",
      16: "60 = exit.",
      17: "The process ends with status 100.",
    },
  },
};

export const CPU_NAMES: Record<CpuProgramId, string> = {
  ...FLOW_NAMES,
  tiny: "five instructions",
  subregs: "parts of rax",
  hello: "hello",
  endian: "loading bytes",
  array: "sum of an array",
};
