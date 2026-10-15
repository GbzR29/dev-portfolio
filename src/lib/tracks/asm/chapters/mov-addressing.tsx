"use client";

// Foundations 4: moving data — mov's operand forms, no memory-to-memory; the
// size of a move and NASM's real errors; only mov takes a 64-bit immediate;
// movzx / movsx / movsxd; brackets mean memory (msg vs [msg], like p vs *p),
// little-endian loads; [base + index*scale + disp] and the C patterns it
// serves (gcc -O2 output), what NASM refuses; lea for addresses and fast
// arithmetic; RIP-relative addressing, default rel, ASLR and PIE; a whole
// array sum with a null-pointer crash to break it.

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { AddressingFigure } from "@/components/lesson/figures/asm/AddressingFigure";

export function MovAddressingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmMov_intro",
          "Most instructions in a real program move data rather than compute with it: from memory into a register, from a register back to memory, from one register to another. This chapter covers mov and its relatives, and the feature that makes x86 code compact: one operand can work out an address such as base + index × scale + displacement. That is how C's arrays, structs and pointers turn into instructions.")}
      </Lead>

      <Goals t={t} id="asmMov" items={[
        "Say which operand pairs mov accepts, and how the size of a move is decided.",
        "Tell an address from the value stored there: msg versus [msg].",
        "Write the memory operand for an array element or a struct field.",
        "Use lea to compute addresses and small sums, and RIP-relative addressing for global variables.",
      ]} />

      <H2>{tx(t, "asmMov_movTitle", "mov copies")}</H2>
      <p>
        {tx(t, "asmMov_movBody",
          "mov dst, src copies src into dst. src does not change: despite the name, nothing is taken away. Each operand can be a register, an immediate (a number written inside the instruction) or a memory location, in these combinations:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmMov_hForm", "Form"), tx(t, "asmMov_hEx", "Example"), tx(t, "asmMov_hMeans", "Means")]}
        rows={[
          [tx(t, "asmMov_f1", "register ← immediate"), "mov eax, 42", "eax = 42"],
          [tx(t, "asmMov_f2", "register ← register"), "mov rbx, rax", "rbx = rax"],
          [tx(t, "asmMov_f3", "register ← memory"), "mov eax, [count]", tx(t, "asmMov_f3m", "eax = the 4 bytes at count")],
          [tx(t, "asmMov_f4", "memory ← register"), "mov [count], eax", tx(t, "asmMov_f4m", "the 4 bytes at count = eax")],
          [tx(t, "asmMov_f5", "memory ← immediate"), "mov dword [count], 0", tx(t, "asmMov_f5m", "the 4 bytes at count = 0")],
        ]}
      />
      <p>
        {tx(t, "asmMov_noMemMem",
          "Memory to memory is missing: an x86 instruction can name at most one memory operand. To copy one variable into another, go through a register:")}
      </p>
      <CodeBlock lang="nasm" filename="copy.asm" t={t}>{`        mov     eax, [a]        ; load
        mov     [b], eax        ; store`}</CodeBlock>

      <H3>{tx(t, "asmMov_sizeTitle", "The size of a move")}</H3>
      <p>
        {tx(t, "asmMov_sizeBody",
          "Both operands of a mov have the same size, and a register says its own size: rax is 8 bytes, eax 4, ax 2, al 1. When one side is a register, the other side follows it. When neither side is a register, as in mov [count], 0, NASM cannot know whether to write 1, 2, 4 or 8 bytes, so you name the size: byte, word, dword or qword. The assembler catches mistakes, with these real messages:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmMov_hYou", "You write"), tx(t, "asmMov_hNasm", "NASM says")]}
        rows={[
          ["mov [count], 0", "error: operation size not specified"],
          ["mov [b], [a]", "error: invalid combination of opcode and operands"],
          ["mov eax, bl", "error: invalid combination of opcode and operands"],
          ["add rax, 0x123456789", "warning: signed dword immediate exceeds bounds"],
        ]}
      />
      <p>
        {tx(t, "asmMov_immBody",
          "The last one is only a warning, and a nasty one. Only mov can carry a full 64-bit number. Every other instruction takes at most 32 bits, which the CPU sign-extends to 64. NASM keeps the low 32 bits and assembles anyway, so the program adds the wrong number. To use a big constant, mov it into a register first.")}
      </p>

      <H3>{tx(t, "asmMov_widenTitle", "Widening: movzx and movsx")}</H3>
      <p>{tx(t, "asmMov_widenBody", "To load a small value into a bigger register, you say how to fill the extra bits:")}</p>
      <LessonTable
        headers={[tx(t, "asmMov_hInstr", "Instruction"), tx(t, "asmMov_hFills", "Fills the rest with"), tx(t, "asmMov_hFor", "Use it for")]}
        rows={[
          ["movzx eax, byte [p]", tx(t, "asmMov_w1", "zeros"), "unsigned char, uint8_t, uint16_t"],
          ["movsx eax, byte [p]", tx(t, "asmMov_w2", "copies of the sign bit"), "signed char, int8_t, short"],
          ["movsxd rax, dword [p]", tx(t, "asmMov_w3", "copies of the sign bit"), tx(t, "asmMov_w3f", "an int that must become 64 bits, such as an array index")],
          ["mov eax, dword [p]", tx(t, "asmMov_w4", "zeros (the 32-bit rule)"), tx(t, "asmMov_w4f", "unsigned int to 64 bits: no special instruction needed")],
        ]}
      />
      <p>
        {tx(t, "asmMov_widenNote",
          "The byte 0xfb loads as 251 with movzx and as −5 with movsx: the two readings from the Registers chapter.")}
      </p>

      <H2>{tx(t, "asmMov_bracketTitle", "Brackets mean memory")}</H2>
      <p>
        {tx(t, "asmMov_bracketBody",
          "A label stands for an address. Without brackets you get the address itself; with brackets you get the bytes stored there. It is the same difference as between a pointer p and *p in C:")}
      </p>
      <LessonTable
        headers={["NASM", "C", tx(t, "asmMov_hGets", "rax gets")]}
        rows={[
          ["mov rax, msg", "rax = &msg", tx(t, "asmMov_b1", "the address of msg, such as 0x402000")],
          ["mov rax, [msg]", "rax = *(long *)&msg", tx(t, "asmMov_b2", "the 8 bytes stored at msg")],
          ["mov rax, [rbx]", "rax = *(long *)rbx", tx(t, "asmMov_b3", "the 8 bytes at the address held in rbx")],
        ]}
      />
      <p>
        {tx(t, "asmMov_endianBody",
          "A load of several bytes puts the first byte in memory into the lowest position of the register: little-endian, as in the first chapter. Loading 8 bytes of \"Hello, assembly!\" gives 0x61202c6f6c6c6548, the first eight characters read from right to left. Step through it:")}
      </p>
      <CpuFigure t={t} programs={["endian"]} />

      <H2>{tx(t, "asmMov_modesTitle", "Addressing modes")}</H2>
      <p>
        {tx(t, "asmMov_modesBody",
          "Inside the brackets, x86 accepts a whole formula, which the CPU computes as part of the instruction, at no extra cost: [ base + index × scale + displacement ]. Each part is optional:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmMov_hPart", "Part"), tx(t, "asmMov_hCanBe", "What it can be")]}
        rows={[
          ["base", tx(t, "asmMov_p1", "any of the 16 registers")],
          ["index", tx(t, "asmMov_p2", "any register except rsp")],
          ["scale", tx(t, "asmMov_p3", "1, 2, 4 or 8, multiplied by the index")],
          ["displacement", tx(t, "asmMov_p4", "a constant from −2³¹ to 2³¹ − 1: often a label or the offset of a struct field")],
        ]}
      />
      <p>
        {tx(t, "asmMov_scaleBody",
          "The scale is the size of an array element, so one operand reaches element i of an array of chars, shorts, ints or 8-byte values. These are the patterns C turns into:")}
      </p>
      <LessonTable
        headers={["C", tx(t, "asmMov_hOperand", "Operand"), tx(t, "asmMov_hPieces", "Pieces used")]}
        rows={[
          [tx(t, "asmMov_c1", "x, a global int"), "[x]", tx(t, "asmMov_c1p", "displacement")],
          ["*p", "[rdi]", "base"],
          [tx(t, "asmMov_c3", "p->y (y at offset 4)"), "[rdi + 4]", tx(t, "asmMov_c3p", "base + displacement")],
          [tx(t, "asmMov_c4", "a[i] (int)"), "[rdi + rsi*4]", tx(t, "asmMov_c4p", "base + index × 4")],
          [tx(t, "asmMov_c5", "a[i].y (8-byte struct)"), "[rdi + rsi*8 + 4]", tx(t, "asmMov_c5p", "all four")],
        ]}
      />
      <p>
        {tx(t, "asmMov_gccBody",
          "Those are exactly what gcc -O2 writes. For int get(const int *a, long i) { return a[i]; } it produces one instruction before ret: mov eax, DWORD PTR [rdi+rsi*4]. DWORD PTR is how the GNU tools spell NASM's dword.")}
      </p>
      <AddressingFigure t={t} />
      <p>
        {tx(t, "asmMov_misalign",
          "Try a displacement of 1 in the figure. The CPU happily reads 4 bytes that start in the middle of an int. The value is nonsense: the top bytes of one element glued to the lowest byte of the next. Nothing stops you, and this is exactly what a C pointer cast to the wrong type does.")}
      </p>
      <H3>{tx(t, "asmMov_refuseTitle", "What the assembler refuses")}</H3>
      <LessonTable
        headers={[tx(t, "asmMov_hYou2", "You write"), tx(t, "asmMov_hNasm2", "NASM says"), tx(t, "asmMov_hWhy", "Why")]}
        rows={[
          ["[rbx + rcx*3]", "error: invalid 64-bit effective address", tx(t, "asmMov_e1", "the encoding has two bits for the scale: 1, 2, 4 or 8")],
          ["[rbx + rcx + rdx]", "error: invalid effective address: too many registers", tx(t, "asmMov_e2", "at most a base and an index")],
          ["[rsp*2]", "error: invalid 64-bit effective address", tx(t, "asmMov_e3", "rsp cannot be an index")],
        ]}
      />
      <p>
        {tx(t, "asmMov_trick",
          "[rcx*3] on its own does assemble: NASM rewrites it as [rcx + rcx*2], using rcx as both base and index. [rcx*5] and [rcx*9] work the same way.")}
      </p>

      <H2>{tx(t, "asmMov_leaTitle", "lea: the address, not the value")}</H2>
      <p>
        {tx(t, "asmMov_leaBody",
          "lea (load effective address) works out the address of its memory operand and stops there: no memory is read. lea rsi, [msg] puts the address of msg in rsi; lea rax, [rbx + rcx*4] puts the address of element rcx. Switch the figure above to lea to see it.")}
      </p>
      <p>
        {tx(t, "asmMov_leaMath",
          "Since the formula is plain arithmetic, compilers also use lea for sums that have nothing to do with addresses. In one instruction it adds two registers and a constant, and multiplies by 2, 3, 4, 5, 8 or 9, without changing the flags. Real gcc -O2 output:")}
      </p>
      <LessonTable
        headers={["C", "gcc -O2"]}
        rows={[
          ["return x * 3 + 5;", "lea eax, [rdi+5+rdi*2]"],
          ["return a + b + 3;", "lea rax, [rdi+3+rsi]"],
          ["return a[i];", "mov eax, DWORD PTR [rdi+rsi*4]"],
          ["return p[i].y;", "mov eax, DWORD PTR [rdi+4+rsi*8]"],
        ]}
      />
      <p>
        {tx(t, "asmMov_leaCheck",
          "Check the first line: x arrives in edi, and rdi + rdi × 2 + 5 is 3x + 5.")}
      </p>

      <H2>{tx(t, "asmMov_relTitle", "RIP-relative addressing")}</H2>
      <p>
        {tx(t, "asmMov_relBody",
          "In the first program, mov rsi, msg wrote the full 8-byte address of msg into the instruction, 10 bytes in all. Modern programs avoid that. The operating system loads each program at a random address (address space layout randomisation, ASLR, which makes attacks harder), so absolute addresses would have to be patched every time. Instead, x86-64 can address memory relative to rip: the instruction stores the distance from the next instruction to the data, and that distance is the same wherever the program is loaded.")}
      </p>
      <CodeBlock lang="nasm" filename="rel.asm" t={t}>{`        default rel             ; from here on, [label] means [rel label]
        lea     rsi, [msg]      ; 48 8D 35 + 4-byte distance: 7 bytes
        mov     eax, [count]    ; 8B 05 + 4-byte distance: 6 bytes`}</CodeBlock>
      <p>
        {tx(t, "asmMov_relNote",
          "Put default rel at the top of every file and NASM makes every [label] RIP-relative. It is also what a position-independent executable (PIE) needs, the kind gcc builds by default on most Linux systems. The rest of this track uses it.")}
      </p>
      <p>
        {tx(t, "asmMov_allBody",
          "Here is everything together: a sum over an array with RIP-relative globals and indexed operands. Remove the lea line to see what an uninitialised pointer does.")}
      </p>
      <CpuFigure t={t} programs={["array"]} />
      <p>
        {tx(t, "asmMov_nullBody",
          "Without the lea, rbx is still 0 and the first load reads address 0: a null pointer. Linux never maps the lowest page of memory, precisely so that this mistake crashes at once instead of quietly reading garbage.")}
      </p>

      <H2>{tx(t, "asmMov_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmMov_try1", "struct P { int x, y, z; } is 12 bytes. Write the operands that load p[i].y, with p in rdi and i in rsi. Why does it take two instructions? (Hint: lea can multiply by 3.)")}</li>
        <li>{tx(t, "asmMov_try2", "Put the byte 0xfb in .data. Load it into eax with movzx and with movsx, and predict both values before you check with gdb.")}</li>
        <li>{tx(t, "asmMov_try3", "In the array program, make total a qword (dq) and store rax into it. Which lines must change?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmMov" items={[
        "mov copies a register, an immediate or a memory value into a register or memory. At most one operand can be in memory.",
        "Both sides have one size. Name it (byte, word, dword, qword) when no register gives it.",
        "Only mov takes a 64-bit immediate; other instructions take at most 32 bits, sign-extended.",
        "movzx fills with zeros, movsx with copies of the sign bit; a 32-bit mov already clears the top half.",
        "[base + index × scale + displacement] reaches globals, pointers, struct fields and array elements. The scale is 1, 2, 4 or 8.",
        "lea computes that address without reading memory; compilers use it for quick arithmetic.",
        "default rel makes [label] RIP-relative: shorter, and correct wherever the program is loaded.",
      ]} />
    </Article>
  );
}
