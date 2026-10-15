"use client";

// Foundations 1: what assembly is — a program as bytes in memory, the
// fetch / decode / execute / advance cycle and rip; reading hexadecimal and
// little-endian numbers; machine code next to its assembly (a real NASM
// listing, the short encoding NASM picks); assembler, linker, loader and
// disassembler; x86-64 as an ISA (vs ARM64), Intel vs AT&T syntax; setting up
// NASM on Linux / WSL or Compiler Explorer; where assembly is used today.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";

export function WhatIsAssemblyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmWhat_intro",
          "A processor understands one thing: numbers in memory. Every program you have ever run, whatever language it was written in, reached the CPU as a list of bytes called machine code. Assembly language writes those bytes as words a person can read, one line per instruction, such as add eax, ebx. This track teaches the assembly of x86-64, the processor family inside almost every desktop, laptop and server. You will rarely write whole programs in it. You will use it to read what your compiler produced, to understand a crash, and to see why one loop is fast and another slow.")}
      </Lead>

      <Goals t={t} id="asmWhat" items={[
        "Say what machine code, assembly language and an assembler are.",
        "Follow the fetch, decode, execute cycle and say what rip holds.",
        "Read a byte written in hexadecimal, and a number stored little-endian.",
        "Tell Intel syntax from AT&T syntax, and set up NASM to follow the track.",
      ]} />

      <H2>{tx(t, "asmWhat_bytesTitle", "A program is bytes in memory")}</H2>
      <p>
        {tx(t, "asmWhat_bytesBody",
          "Memory is a long row of bytes, each with a number called its address. Your program's code sits in that row too, next to its data. The CPU has a few storage cells of its own, called registers. One of them, rip (the instruction pointer), holds the address of the next instruction to run. The CPU repeats four steps, billions of times per second:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmWhat_hStep", "Step"), tx(t, "asmWhat_hHappens", "What happens")]}
        rows={[
          [tx(t, "asmWhat_s1", "Fetch"), tx(t, "asmWhat_s1b", "Read the bytes at the address in rip.")],
          [tx(t, "asmWhat_s2", "Decode"), tx(t, "asmWhat_s2b", "Work out which instruction they spell and how long it is. An x86 instruction is 1 to 15 bytes long.")],
          [tx(t, "asmWhat_s3", "Execute"), tx(t, "asmWhat_s3b", "Do it: add two registers, copy a value, read memory…")],
          [tx(t, "asmWhat_s4", "Advance"), tx(t, "asmWhat_s4b", "Add the instruction's length to rip, so it points at the next one. A jump simply writes a different address into rip.")],
        ]}
      />
      <p>
        {tx(t, "asmWhat_figBody",
          "Step through five instructions below. The second column shows the real bytes NASM produced for each line, and the first column the address where they sit. Watch rip grow by the length of each instruction.")}
      </p>
      <CpuFigure t={t} programs={["tiny"]} />

      <H2>{tx(t, "asmWhat_hexTitle", "Reading hexadecimal")}</H2>
      <p>
        {tx(t, "asmWhat_hexBody",
          "Bytes are almost always written in hexadecimal, base 16. It needs sixteen digits: 0 to 9, then a to f for ten to fifteen. One hex digit holds exactly 4 bits, so a byte (8 bits) is always two hex digits, from 00 to ff. In C and in NASM, 0x in front marks a number as hex.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmWhat_hHex", "Hex"), tx(t, "asmWhat_hBin", "Binary"), tx(t, "asmWhat_hDec", "Decimal")]}
        rows={[
          ["0x0a", "0000 1010", "10"],
          ["0x2c", "0010 1100", "2 × 16 + 12 = 44"],
          ["0x7f", "0111 1111", "127"],
          ["0xff", "1111 1111", "255"],
          ["0x401000", "—", "4 198 400"],
        ]}
      />
      <p>
        {tx(t, "asmWhat_hexRead",
          "To read a hex number, multiply each digit by its place value, which grows 16 times at each step to the left: 1, 16, 256, 4096… So 0x2c = 2 × 16 + 12 = 44. Binary works the same way with powers of 2, and each group of 4 bits is one hex digit: 0010 is 2, 1100 is c.")}
      </p>
      <H3>{tx(t, "asmWhat_endianTitle", "Little-endian: the lowest byte first")}</H3>
      <p>
        {tx(t, "asmWhat_endianBody",
          "A number wider than one byte is stored as several bytes in a row. x86 puts the lowest byte at the lowest address. That is why mov eax, 5 is encoded B8 05 00 00 00: B8 is the instruction, and 05 00 00 00 is the 4-byte number 0x00000005 written lowest byte first. This order is called little-endian. Most CPUs today use it, ARM included.")}
      </p>

      <H2>{tx(t, "asmWhat_listTitle", "Machine code and assembly, side by side")}</H2>
      <p>
        {tx(t, "asmWhat_listBody",
          "Here is the code of the first program of this track, as NASM lists it (nasm -l). Each line of assembly became one instruction of machine code:")}
      </p>
      <CodeBlock lang="text" filename="hello.lst" t={t}>{`  9 00000000 B801000000             mov     rax, 1
 10 00000005 BF01000000             mov     rdi, 1
 11 0000000A 48BE[0000000000000000] mov     rsi, msg
 12 00000014 BA11000000             mov     rdx, len
 13 00000019 0F05                   syscall`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "asmWhat_hCol", "Column"), tx(t, "asmWhat_hMeans", "What it means")]}
        rows={[
          ["9, 10…", tx(t, "asmWhat_c1", "The line number in the source file.")],
          ["00000005", tx(t, "asmWhat_c2", "Where the instruction starts, counted in bytes from the start of the code, in hex.")],
          ["BF01000000", tx(t, "asmWhat_c3", "The machine code: BF means \"put the 4-byte number that follows into edi\", then 01 00 00 00.")],
          ["[00…00]", tx(t, "asmWhat_c4", "Bytes NASM cannot know yet: the address of msg. The linker fills them in.")],
          ["mov rdi, 1", tx(t, "asmWhat_c5", "The source line that produced the bytes.")],
        ]}
      />
      <p>
        {tx(t, "asmWhat_listNote",
          "Two things stand out. The instructions have different lengths: 5, 10 and 2 bytes. And the source says mov rax, 1, but B8 01 00 00 00 is the shorter mov eax, 1. NASM knows both leave the same value in rax and picked the 5-byte form over the 7-byte one. The Registers chapter explains why they are equal.")}
      </p>

      <H2>{tx(t, "asmWhat_toolsTitle", "Assembler, linker, loader")}</H2>
      <p>
        {tx(t, "asmWhat_toolsBody",
          "An assembler translates assembly into machine code. It is far simpler than a compiler: each line maps to one instruction, and nothing is reordered or optimised. NASM writes an object file, which is machine code with holes where an address is not known yet. The linker, ld, gives every piece its final address, fills the holes and writes the executable. When you run it, the operating system's loader copies the bytes into memory and points rip at the first instruction.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmWhat_hTool", "Tool"), tx(t, "asmWhat_hInOut", "Input → output"), tx(t, "asmWhat_hInC", "In C terms")]}
        rows={[
          ["nasm", "hello.asm → hello.o", tx(t, "asmWhat_t1", "the compiler (gcc -c)")],
          ["ld", "hello.o → hello", tx(t, "asmWhat_t2", "the same linker C uses")],
          [tx(t, "asmWhat_t3a", "the loader"), tx(t, "asmWhat_t3b", "hello → a running process"), tx(t, "asmWhat_t3", "the same as for C")],
          ["objdump -d", tx(t, "asmWhat_t4a", "hello → assembly text"), tx(t, "asmWhat_t4", "a disassembler: bytes back to text")],
        ]}
      />
      <p>
        {tx(t, "asmWhat_gccBody",
          "A C compiler does the same job with one more stage in front: gcc turns C into assembly text, then runs an assembler on it. gcc -S stops after the first stage so you can read the result. The section From C to Assembly, later in this track, does exactly that.")}
      </p>

      <H2>{tx(t, "asmWhat_isaTitle", "One processor family, two ways to write it")}</H2>
      <p>
        {tx(t, "asmWhat_isaBody",
          "x86-64 is an instruction set architecture (ISA): the list of instructions a family of CPUs understands, with their encodings. Intel and AMD processors share it. It is also called AMD64 or x64, because AMD designed the 64-bit version (announced in 2000, first chips in 2003) on top of Intel's 32-bit x86 from 1985. Phones, tablets and Apple's M-series Macs use a different ISA, ARM64, whose machine code is completely different. Assembly is always written for one ISA. The last chapter of the track compares the two.")}
      </p>
      <p>
        {tx(t, "asmWhat_syntaxBody",
          "Even for one ISA there are two spellings. Intel syntax puts the destination first, like an assignment. AT&T syntax, the default of the GNU tools, puts it last and marks registers with % and numbers with $:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmWhat_hDoes", "Does"), "Intel (NASM)", "AT&T (GNU as)"]}
        rows={[
          [tx(t, "asmWhat_x1", "copy 1 into rax"), "mov rax, 1", "movq $1, %rax"],
          [tx(t, "asmWhat_x2", "add rbx to rax"), "add rax, rbx", "addq %rbx, %rax"],
          [tx(t, "asmWhat_x3", "load 4 bytes from rbx + 8"), "mov eax, [rbx + 8]", "movl 8(%rbx), %eax"],
        ]}
      />
      <p>
        {tx(t, "asmWhat_syntaxNote",
          "Both produce the same bytes. This track uses Intel syntax with NASM, the most common choice for hand-written x86 assembly. To make the GNU tools print Intel syntax too, use gcc -masm=intel, objdump -M intel, and in gdb set disassembly-flavor intel.")}
      </p>

      <H2>{tx(t, "asmWhat_setupTitle", "Setting up")}</H2>
      <p>
        {tx(t, "asmWhat_setupBody",
          "The programs in this track run on Linux, because Linux has a simple and stable way for a program to talk to the system. On Windows, use WSL (the Windows Subsystem for Linux). On a Mac, use a Linux virtual machine or a remote Linux machine. Then install the tools:")}
      </p>
      <CodeBlock lang="bash" filename="setup.sh" t={t}>{`# Ubuntu / Debian, also Ubuntu inside WSL
sudo apt install nasm binutils gdb
nasm -v        # NASM version 2.16.01 (or newer)`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "asmWhat_ceTip",
          "No Linux at hand? Compiler Explorer (godbolt.org) assembles, links and runs NASM in the browser. Choose the language Assembly and the compiler NASM, then turn on execution of the code. Every program in this track was checked there.")}
      </Callout>

      <H2>{tx(t, "asmWhat_whoTitle", "Who writes assembly today")}</H2>
      <p>
        {tx(t, "asmWhat_whoBody",
          "Very little software is written in assembly any more. Compilers produce good code, and portable C runs on every ISA. But assembly is everywhere you look closely:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmWhat_hWhere", "Where"), tx(t, "asmWhat_hWhy", "Why")]}
        rows={[
          [tx(t, "asmWhat_w1", "reading compiler output"), tx(t, "asmWhat_w1b", "to check what a hot loop really became, and whether it uses SIMD")],
          [tx(t, "asmWhat_w2", "debuggers and crash reports"), tx(t, "asmWhat_w2b", "a crash in an optimised build often shows only instructions and registers")],
          [tx(t, "asmWhat_w3", "operating systems"), tx(t, "asmWhat_w3b", "the first instructions after power-on, switching between tasks, entering the kernel")],
          [tx(t, "asmWhat_w4", "hot spots in libraries"), tx(t, "asmWhat_w4b", "memcpy, video codecs and cryptography use hand-tuned SIMD code")],
          [tx(t, "asmWhat_w5", "security"), tx(t, "asmWhat_w5b", "reverse engineering, exploits and their defences work at the instruction level")],
        ]}
      />
      <p>
        {tx(t, "asmWhat_aimBody",
          "This track aims at the first two: reading assembly fluently, and writing small pieces with confidence. It builds on the C/C++ track. A C pointer, a struct and a stack frame all become concrete here.")}
      </p>

      <H2>{tx(t, "asmWhat_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmWhat_try1", "Convert 0x7f, 0x100 and 0xffff to decimal, then 200 to hex.")}</li>
        <li>{tx(t, "asmWhat_try2", "Write the 4-byte number 0x12345678 as it sits in memory, lowest address first.")}</li>
        <li>{tx(t, "asmWhat_try3", "In the figure, which instruction is the shortest, and how far does rip move after it?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmWhat" items={[
        "The CPU only runs machine code: instructions encoded as bytes in memory.",
        "It loops fetch, decode, execute, advance; rip always holds the address of the next instruction.",
        "Assembly is machine code written as text, one line per instruction. An assembler such as NASM translates it; a disassembler goes back.",
        "A hex digit holds 4 bits, so a byte is two of them. x86 stores numbers little-endian, lowest byte first.",
        "x86-64 is one ISA and ARM64 another. Intel and AT&T are two syntaxes for x86; this track uses Intel syntax with NASM on Linux.",
      ]} />
    </Article>
  );
}
