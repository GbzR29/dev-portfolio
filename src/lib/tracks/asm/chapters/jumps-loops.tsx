"use client";

// Control flow 2: jumps — jmp and labels, relative encodings (7E F7 = −9);
// cmp and test, the conditional jumps and their flag tests, signed (less /
// greater) versus unsigned (below / above) with the max program run both ways;
// if/else by inverting the condition; loops (for, while, do-while, countdown),
// an endless loop to break it, gcc's rotated loop; setcc and cmov instead of a
// branch (real gcc -O2 output).

import { CodeBlock, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";
import { FlagsFigure } from "@/components/lesson/figures/asm/FlagsFigure";

export function JumpsLoopsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmJmp_intro",
          "Assembly has no if, no while and no for. It has jumps: instructions that load a new address into rip, so the CPU continues somewhere else. A conditional jump does it only when the flags say so. With jumps and the flags from the last chapter you can build every control structure C has, and this chapter does exactly that.")}
      </Lead>

      <Goals t={t} id="asmJmp" items={[
        "Use cmp or test followed by a conditional jump, and choose the signed or the unsigned jump.",
        "Translate if/else, while, do-while and for into labels and jumps.",
        "Recognise the loop shape gcc produces, with the test at the bottom.",
        "Replace a short branch with setcc or cmov, and say why compilers do it.",
      ]} />

      <H2>{tx(t, "asmJmp_jmpTitle", "jmp and labels")}</H2>
      <p>
        {tx(t, "asmJmp_jmpBody",
          "jmp target puts the target's address into rip. The next instruction the CPU fetches is the one at the target. You name targets with labels, as in the first program. A label that starts with a dot, such as .top, is local: NASM attaches it to the last ordinary label, so every function can have its own .done without a clash.")}
      </p>
      <p>
        {tx(t, "asmJmp_relBody",
          "The machine code does not store the target's address. It stores the distance from the end of the jump to the target, like RIP-relative data. A short jump uses one signed byte, −128 to 127; a longer one uses four. In the loop further down, jle .top is the two bytes 7E F7. 7E means \"jump if less or equal\", and F7 is −9: back nine bytes, to .top.")}
      </p>

      <H2>{tx(t, "asmJmp_condTitle", "Compare, then jump")}</H2>
      <p>
        {tx(t, "asmJmp_condBody",
          "A conditional jump looks at the flags and either jumps or falls through to the next line. Something must set the flags right before it, and usually that is one of two instructions made for the purpose:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmJmp_hInstr", "Instruction"), tx(t, "asmJmp_hDoes", "Does"), tx(t, "asmJmp_hUse", "Typical use")]}
        rows={[
          ["cmp a, b", tx(t, "asmJmp_cmp", "a − b, flags only; a is not changed"), tx(t, "asmJmp_cmpUse", "compare two values")],
          ["test a, b", tx(t, "asmJmp_test", "a & b, flags only"), tx(t, "asmJmp_testUse", "test eax, eax: is it zero? is it negative?")],
        ]}
      />
      <p>
        {tx(t, "asmJmp_condNames",
          "Read cmp a, b followed by a jump as a question about a and b. The names follow a rule: less and greater (l, g) are for signed numbers, below and above (b, a) for unsigned ones. e is equal, n means not. Move the sliders and see which jumps would be taken:")}
      </p>
      <FlagsFigure t={t} jcc />
      <LessonTable
        headers={["C", tx(t, "asmJmp_hSigned", "Signed (int)"), tx(t, "asmJmp_hUnsigned", "Unsigned")]}
        rows={[
          ["a == b", "je", "je"],
          ["a != b", "jne", "jne"],
          ["a < b", "jl", "jb"],
          ["a <= b", "jle", "jbe"],
          ["a > b", "jg", "ja"],
          ["a >= b", "jge", "jae"],
        ]}
      />
      <p>
        {tx(t, "asmJmp_whyFlags",
          "Why does jl test SF ≠ OF? After a − b, a negative result (SF = 1) means a < b, unless the subtraction overflowed, in which case the sign is the wrong way round (OF = 1). So \"less\" is \"negative, or overflowed but not both\". For unsigned numbers it is simpler: a < b exactly when a − b needed a borrow, CF = 1.")}
      </p>

      <H3>{tx(t, "asmJmp_typeTitle", "The jump decides the type")}</H3>
      <p>
        {tx(t, "asmJmp_typeBody",
          "In assembly, a register is just bits; there is no int or unsigned. The type lives in the jump you choose. The two programs below are identical except for one jump: both compute the larger of −1 and 1. Run each one and compare the exit statuses.")}
      </p>
      <CpuFigure t={t} programs={["maxs", "maxu"]} />
      <p>
        {tx(t, "asmJmp_typeC",
          "This is the assembly behind a famous C trap. If a is an int holding −1 and b is unsigned, C converts a to unsigned before comparing, and the compiler emits the unsigned jump: −1 becomes 4,294,967,295, and −1 < 1u is false. gcc -O2 compiles the two versions of max to cmovge and cmovnb, the same signed-or-unsigned choice in another instruction (nb, not below, is another name for ae).")}
      </p>

      <H2>{tx(t, "asmJmp_ifTitle", "if and else")}</H2>
      <p>
        {tx(t, "asmJmp_ifBody",
          "The pattern for an if is to jump over the body when the condition is false. So the jump in the code tests the opposite of the C condition: if (x < 0) becomes \"jump past the body if x ≥ 0\".")}
      </p>
      <CodeBlock lang="nasm" filename="if.asm" t={t}>{`; if (x < 0) x = -x;            x in edi
        test    edi, edi
        jns     .done           ; not negative: skip the body
        neg     edi
.done:

; if (a > b) m = a; else m = b;  a in edi, b in esi, m in eax
        cmp     edi, esi
        jle     .else           ; the opposite of >
        mov     eax, edi        ; then: m = a
        jmp     .end            ; skip the else part
.else:  mov     eax, esi        ; else: m = b
.end:`}</CodeBlock>
      <p>
        {tx(t, "asmJmp_ifEnd",
          "The jmp .end at the end of the then-part is easy to forget. Without it, the CPU falls straight into the else-part and overwrites the result: labels are just addresses, not walls.")}
      </p>

      <H2>{tx(t, "asmJmp_loopTitle", "Loops")}</H2>
      <p>
        {tx(t, "asmJmp_loopBody",
          "A loop is a jump backwards. The program below is for (i = 1; i <= 5; i++) total += i; with total in eax and i in ecx. Run it, then remove inc ecx.")}
      </p>
      <CpuFigure t={t} programs={["loop"]} />
      <p>
        {tx(t, "asmJmp_hang",
          "Without inc, ecx stays 1 forever, cmp ecx, 5 always finds 1 ≤ 5, and jle always jumps back. The assembler cannot spot this, and the CPU will not stop by itself: the program runs until someone ends it. The figure gives up after 60 steps; in a terminal you would press Ctrl+C.")}
      </p>

      <H3>{tx(t, "asmJmp_shapesTitle", "Four loop shapes")}</H3>
      <LessonTable
        headers={["C", tx(t, "asmJmp_hShape", "Shape in assembly")]}
        rows={[
          ["do { … } while (c);", tx(t, "asmJmp_s1", "body, test, jump back if c: the simplest, one jump per round")],
          ["while (c) { … }", tx(t, "asmJmp_s2", "test at the top, jump out if not c; body; jmp back to the test")],
          ["for (init; c; step) { … }", tx(t, "asmJmp_s3", "init, then a while loop whose body ends with step")],
          [tx(t, "asmJmp_s4c", "count down to 0"), tx(t, "asmJmp_s4", "body; dec ecx; jnz back: dec sets ZF itself, so no cmp is needed")],
        ]}
      />
      <p>
        {tx(t, "asmJmp_rotate",
          "A while loop costs two jumps per round. Compilers avoid that by testing once before the loop and then putting the test at the bottom, turning it into a do-while. This is gcc -O1 for int sum(int n) { int t = 0; for (int i = 1; i <= n; i++) t += i; return t; }:")}
      </p>
      <CodeBlock lang="nasm" filename="gcc -O1" t={t}>{`sum:
        test    edi, edi        ; n <= 0?
        jle     .L14            ;   then the loop never runs: return 0
        add     edi, 1          ; the loop stops when i reaches n + 1
        mov     eax, 1          ; i = 1
        mov     edx, 0          ; t = 0
.L13:   add     edx, eax        ; t += i
        add     eax, 1          ; i++
        cmp     eax, edi        ; i != n + 1?
        jne     .L13            ;   then go round again
.L11:   mov     eax, edx        ; return t
        ret
.L14:   mov     edx, 0
        jmp     .L11`}</CodeBlock>
      <p>
        {tx(t, "asmJmp_rotateNote",
          "Labels such as .L13 are invented by the compiler. Spotting the backward jump (jne .L13) is the quickest way to find a loop in compiler output. At -O2, gcc goes further and handles two numbers per round; reading that is the subject of a later chapter.")}
      </p>

      <H2>{tx(t, "asmJmp_noBranchTitle", "Deciding without jumping")}</H2>
      <p>
        {tx(t, "asmJmp_noBranchBody",
          "Two families of instructions use the flags without jumping. setcc writes 1 or 0 into a byte register: setl al sets al = 1 if the last cmp found less. cmovcc (conditional move) copies a value only if the condition holds. The cc is any of the condition codes above. Real gcc -O2 output:")}
      </p>
      <LessonTable
        headers={["C", "gcc -O2"]}
        rows={[
          ["return a < b;", "xor eax, eax · cmp edi, esi · setl al"],
          ["return a < b; (unsigned)", "xor eax, eax · cmp edi, esi · setb al"],
          ["return a > b ? a : b;", "cmp esi, edi · mov eax, edi · cmovge eax, esi"],
        ]}
      />
      <p>
        {tx(t, "asmJmp_noBranchWhy",
          "Why bother? A modern CPU starts working on instructions long before it knows where a conditional jump goes. It guesses, and when the guess is wrong it throws the work away, costing around 15 to 20 cycles. For a condition that changes unpredictably, a cmov that always takes a cycle or two is cheaper. The xor before setl clears all of eax first, since setl writes only al. The Performance section comes back to branch prediction.")}
      </p>

      <H2>{tx(t, "asmJmp_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmJmp_try1", "Rewrite the loop program as a countdown: start ecx at 5, add, then dec ecx and jnz. Why can the cmp go?")}</li>
        <li>{tx(t, "asmJmp_try2", "Write the absolute value of edi into eax without a jump: mov eax, edi, neg eax, then a cmov. Which condition code?")}</li>
        <li>{tx(t, "asmJmp_try3", "Write a loop that counts the characters of a zero-terminated string: cmp byte [rdi + rax], 0, je to the end, inc rax, jmp back. It is strlen.")}</li>
      </ol>

      <KeyIdeas t={t} id="asmJmp" items={[
        "A jump puts a new address in rip. Conditional jumps do it only when the flags match their condition.",
        "cmp a, b computes a − b and test a, b computes a & b, keeping only the flags.",
        "l and g (less, greater) compare signed numbers; b and a (below, above) compare unsigned ones. The jump you pick decides the type.",
        "An if jumps over its body when the condition is false, so the jump tests the opposite of the C condition.",
        "A loop is a backward jump. Compilers test once before the loop and then at the bottom of each round.",
        "setcc and cmovcc use the flags without jumping; compilers prefer them when a branch would be hard to predict.",
      ]} />
    </Article>
  );
}
