"use client";

// From C 2: arrays and structs in memory — a[i] as base + i × size (gcc
// output for a[3], a[i] with a long and with an int index); 2D arrays in row
// order; struct fields as offsets, alignment and padding with a figure that
// reorders fields and shows the loads gcc makes (lea / sal for strides that
// are not 1, 2, 4, 8); an array of structs on the CPU with a wrong-stride
// version; NASM's struc / endstruc, which assembles to the same bytes.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { StructLayoutFigure } from "@/components/lesson/figures/asm/StructLayoutFigure";

export function ArraysStructsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmArr_intro",
          "The CPU has no idea what an array or a struct is. It knows addresses, and sizes of 1, 2, 4 or 8 bytes. Everything else is arithmetic the compiler does for you: a[i] becomes \"the address of a, plus i times the size of one element\", and p->y becomes \"p plus the offset of y\". This chapter shows that arithmetic in gcc's output, explains the padding the compiler slips between struct fields, and builds an array of structs by hand in NASM.")}
      </Lead>

      <Goals t={t} id="asmArr" items={[
        "Work out the address of a[i], g[r][c] and a[i].f from the base, the sizes and the offsets.",
        "Explain where padding comes from, and reorder a struct's fields to remove it.",
        "Recognise the lea and shift tricks gcc uses to multiply by a struct's size.",
        "Describe a struct in NASM with struc and endstruc.",
      ]} />

      <H2>{tx(t, "asmArr_arrTitle", "An array is a base plus i × size")}</H2>
      <p>
        {tx(t, "asmArr_arrBody",
          "The elements of an array sit one after another, with no gaps and nothing in between. If a starts at address A and each element is s bytes, element i starts at A + i × s. That is exactly the base + index × scale addressing mode from the mov chapter, which is why it exists. Here is gcc -O2 for three ways to read an int array, with a in rdi:")}
      </p>
      <LessonTable
        headers={["C", "gcc -O2", tx(t, "asmArr_hHow", "How")]}
        rows={[
          ["return a[3];", "mov eax, DWORD PTR [rdi+12]", tx(t, "asmArr_r1", "the index is known: 3 × 4 = 12 is worked out while compiling")],
          ["return a[i];   // long i", "mov eax, DWORD PTR [rdi+rsi*4]", tx(t, "asmArr_r2", "i in rsi, scaled by 4 inside the address")],
          ["return a[i];   // int i", "movsx rsi, esi   ·   mov eax, DWORD PTR [rdi+rsi*4]", tx(t, "asmArr_r3", "an address is 64 bits, so a 32-bit int index must first be sign-extended (movsx); a negative i must stay negative")],
        ]}
      />
      <p>
        {tx(t, "asmArr_scaleBody",
          "The scale can only be 1, 2, 4 or 8, the sizes of char, short, int and long. Arrays of anything else need an extra instruction, as the structs below show.")}
      </p>

      <H2>{tx(t, "asmArr_2dTitle", "Two dimensions")}</H2>
      <p>
        {tx(t, "asmArr_2dBody",
          "C stores int g[3][4] row by row: the 4 ints of row 0, then the 4 of row 1, and so on, 48 bytes in all. A row is 4 × 4 = 16 bytes, so g[r][c] is at g + r × 16 + c × 4. gcc -O2 compiles int get(int g[][4], long r, long c) { return g[r][c]; } to:")}
      </p>
      <CodeBlock lang="nasm" filename="get, gcc -O2" t={t}>{`        sal     rsi, 4                  ; r × 16: shift left by 4 multiplies by 2⁴
        add     rdi, rsi                ; rdi = the address of row r
        mov     eax, DWORD PTR [rdi+rdx*4]  ; + c × 4: the element
        ret`}</CodeBlock>
      <p>
        {tx(t, "asmArr_2dOrder",
          "Walking such an array row by row reads consecutive addresses; walking it column by column jumps 16 bytes each time. For big arrays that difference decides whether the cache helps or not, as the C/C++ Performance chapter measured.")}
      </p>

      <H2>{tx(t, "asmArr_structTitle", "A struct is a list of offsets")}</H2>
      <p>
        {tx(t, "asmArr_structBody",
          "The fields of a struct sit in memory in the order you declare them. Each field has an offset, its distance in bytes from the start of the struct, and reading p->f means reading at p + offset. For struct point { int x; int y; }, x is at offset 0 and y at offset 4, so return p->y; is mov eax, DWORD PTR [rdi+4]. The field names are gone from the machine code; only the numbers remain.")}
      </p>
      <p>
        {tx(t, "asmArr_alignBody",
          "Offsets are not always the sum of the sizes before them. The System V ABI gives each type an alignment: its address must be a multiple of that number, which for these types is their own size. An aligned value never straddles two cache lines or two pages, so the CPU reads it in one access. x86 tolerates misaligned data, at a cost, but some instructions, such as the movaps mentioned in the calling-convention chapter, fault on it. To keep every field aligned, the compiler inserts unused bytes, padding:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmArr_hRule", "Rule"), tx(t, "asmArr_hEffect", "Effect")]}
        rows={[
          [tx(t, "asmArr_rule1", "each field starts at a multiple of its alignment"), tx(t, "asmArr_rule1e", "padding before a field, if needed")],
          [tx(t, "asmArr_rule2", "the struct's alignment is its largest field's"), tx(t, "asmArr_rule2e", "a struct with a double must start at a multiple of 8")],
          [tx(t, "asmArr_rule3", "sizeof is rounded up to a multiple of that alignment"), tx(t, "asmArr_rule3e", "padding at the end, so that a[1] is aligned too")],
        ]}
      />
      <p>
        {tx(t, "asmArr_recBody",
          "struct rec { char tag; double value; int count; } uses 13 bytes of data but takes 24: 7 bytes of padding after tag, so that value starts at 8, and 4 at the end, so that the next rec in an array starts at a multiple of 8. Move the fields around:")}
      </p>
      <StructLayoutFigure t={t} />
      <p>
        {tx(t, "asmArr_sortBody",
          "Putting the largest fields first removes most padding: rec drops from 24 to 16 bytes, a third less memory and a third more records per cache line. Compilers may not do it for you, because C promises that fields stay in the order you wrote them; code and file formats depend on it.")}
      </p>

      <H2>{tx(t, "asmArr_aosTitle", "Arrays of structs")}</H2>
      <p>
        {tx(t, "asmArr_aosBody",
          "a[i].f combines both: the address is a + i × sizeof + offset. With a size of 1, 2, 4 or 8 that is one instruction. With other sizes gcc multiplies first, and avoids imul when it can, because lea computes x + x × 2, x + x × 4 or x + x × 8 in one cycle:")}
      </p>
      <LessonTable
        headers={["sizeof", "gcc -O2", tx(t, "asmArr_hMath", "Arithmetic")]}
        rows={[
          ["8", "mov eax, DWORD PTR [rdi+4+rsi*8]", "a + i × 8 + 4"],
          ["24", "lea rax, [rsi+rsi*2]   ·   mov eax, DWORD PTR [rdi+16+rax*8]", "i × 3, then a + (i × 3) × 8 + 16"],
          ["16", "sal rsi, 4   ·   mov eax, DWORD PTR [rsi+8+rdi]", tx(t, "asmArr_m16", "i × 16 with a shift, then + 8 + a")],
          ["12", "lea rax, [rsi+rsi*2]   ·   movss xmm0, DWORD PTR [rdi+8+rax*4]", tx(t, "asmArr_m12", "a float z in struct { float x, y, z; }: i × 3, then × 4, + 8")],
        ]}
      />
      <p>
        {tx(t, "asmArr_cpuRun",
          "Here is the loop by hand: the sum of the y fields of three points. Then pick \"wrong stride\", the same loop with a scale of 4 instead of 8, the classic bug of stepping by the size of a field instead of the size of the struct.")}
      </p>
      <CpuFigure t={t} programs={["points", "pointsBad"]} />

      <H2>{tx(t, "asmArr_strucTitle", "Structs in NASM")}</H2>
      <p>
        {tx(t, "asmArr_strucBody",
          "Writing [rbx + rcx*8 + 4] by hand works, but the 8 and the 4 are magic numbers that break when the struct changes. NASM can name them. struc and endstruc define a set of offsets: each field reserves its size with resb, resw, resd or resq, and NASM also defines point_size.")}
      </p>
      <CodeBlock lang="nasm" filename="points.asm" t={t}>{`        default rel
        struc   point                   ; struct point { int x; int y; };
.x:     resd    1                       ; point.x = 0
.y:     resd    1                       ; point.y = 4
        endstruc                        ; and point_size = 8

        section .data
pts:    dd      1, 10, 2, 20, 3, 30     ; three points

        section .text
        global  _start
_start:
        lea     rbx, [pts]
        xor     eax, eax
        xor     ecx, ecx
.next:  add     eax, [rbx + rcx*point_size + point.y]
        inc     rcx
        cmp     rcx, 3
        jne     .next
        mov     edi, eax                ; exit status 60
        mov     eax, 60
        syscall`}</CodeBlock>
      <p>
        {tx(t, "asmArr_strucSame",
          "The add assembles to the same four bytes as before, 03 44 CB 04: struc creates no code and no data, only names for numbers. It does not add padding either. For a struct shared with C, put alignb 8 (or the alignment you need) before a field to pad it the way the compiler would.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "asmArr_packWarn",
          "__attribute__((packed)) in gcc, or #pragma pack(1), removes the padding. The struct gets smaller, but its fields can end up misaligned, and taking a pointer to such a field and passing it on is a common source of crashes on processors stricter than x86. Use it for file formats and network packets, not for speed.")}
      </Callout>

      <H2>{tx(t, "asmArr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmArr_try1", "Work out sizeof and every offset of struct { short a; double b; char c; int d; } by hand, then check with offsetof on Compiler Explorer. Reorder it to the smallest size.")}</li>
        <li>{tx(t, "asmArr_try2", "Compile int get3(int g[][3], long r, long c) { return g[r][c]; } with -O2. How does gcc multiply r by 12?")}</li>
        <li>{tx(t, "asmArr_try3", "Extend points.asm with a z field (resd 1). What do you have to change in the loop, and what changes by itself?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmArr" items={[
        "a[i] is at a + i × sizeof(element); the addressing mode can scale by 1, 2, 4 or 8.",
        "An int index is sign-extended (movsx) before it can be part of a 64-bit address.",
        "g[r][c] in a C 2D array is at g + r × (row size) + c × (element size): rows are stored one after another.",
        "p->f is a read at p + offset(f); the names disappear from the machine code.",
        "Each field is aligned to its size, and sizeof is rounded up to the largest alignment; the gaps are padding. Largest fields first wastes the least.",
        "For other sizes gcc multiplies with lea (× 3, × 5, × 9) and shifts instead of imul.",
        "NASM's struc / endstruc names the offsets and the size without creating any bytes.",
      ]} />
    </Article>
  );
}
