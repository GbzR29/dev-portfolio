"use client";

// Control flow 3: the stack and calls — rsp, push and pop spelled out as
// sub/mov and mov/add, the stack growing down; call = push the return address
// + jmp, ret = pop into rip; the frame (prologue, rbp, locals at negative
// offsets, leave) checked against gcc -O0, the red zone; removing leave so
// ret jumps to address 0 and what attackers make of a return address;
// recursion and a stack overflow; ulimit -s.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { CpuFigure } from "@/components/lesson/figures/asm/CpuFigure";

export function StackCallsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "asmStk_intro",
          "A function has to know where to go back to when it finishes, and it needs room for its local variables. Both live on the stack: an area of memory that grows and shrinks as functions are called and return. Two registers manage it, and four instructions do the work: push, pop, call and ret. This chapter shows each of them in action, including what a crash looks like when the bookkeeping goes wrong.")}
      </Lead>

      <Goals t={t} id="asmStk" items={[
        "Say what push and pop do to rsp and to memory, and why the stack grows toward lower addresses.",
        "Explain how call and ret use the stack to come back to the right place.",
        "Read a function's prologue and epilogue and find its local variables relative to rbp.",
        "Explain why a broken return address and endless recursion both end in a segmentation fault.",
      ]} />

      <H2>{tx(t, "asmStk_stackTitle", "The stack")}</H2>
      <p>
        {tx(t, "asmStk_stackBody",
          "When Linux starts a program, it maps a few megabytes near the top of the address space for the stack and points rsp at it. rsp, the stack pointer, always holds the address of the top item: the last value pushed. On x86 the stack grows downward. Pushing moves rsp to a lower address; popping moves it back up. Each push and pop moves 8 bytes.")}
      </p>
      <LessonTable
        headers={[tx(t, "asmStk_hInstr", "Instruction"), tx(t, "asmStk_hSame", "Does the same as")]}
        rows={[
          ["push rax", "sub rsp, 8   ·   mov [rsp], rax"],
          ["pop rax", "mov rax, [rsp]   ·   add rsp, 8"],
        ]}
      />
      <p>
        {tx(t, "asmStk_stepPush",
          "Step through two pushes and two pops. The stack is drawn under the registers, one 8-byte slot per row, with higher addresses at the top so it grows downward on the screen too.")}
      </p>
      <CpuFigure t={t} programs={["pushpop"]} />
      <p>
        {tx(t, "asmStk_stale",
          "Popping does not erase anything. The old values stay in memory below rsp, drawn faint, until the next push writes over them. This is why an uninitialised local variable in C can hold a value left behind by an earlier function.")}
      </p>

      <H2>{tx(t, "asmStk_callTitle", "call and ret")}</H2>
      <p>
        {tx(t, "asmStk_callBody",
          "A function is a label followed by code that ends in ret. To call it, the caller needs to come back afterwards to the instruction right after the call. call saves that address, the return address, on the stack:")}
      </p>
      <LessonTable
        headers={[tx(t, "asmStk_hInstr2", "Instruction"), tx(t, "asmStk_hSame2", "Does the same as")]}
        rows={[
          ["call square", tx(t, "asmStk_callSame", "push the address of the next instruction   ·   jmp square")],
          ["ret", tx(t, "asmStk_retSame", "pop into rip")],
        ]}
      />
      <p>
        {tx(t, "asmStk_callWhy",
          "Using the stack instead of a fixed place is what makes nesting work: a function can call another, which calls a third, and each ret pops the newest return address, in reverse order. ret does not check anything. It trusts that rsp points at a return address, and jumps wherever those 8 bytes say.")}
      </p>

      <H3>{tx(t, "asmStk_frameTitle", "The stack frame")}</H3>
      <p>
        {tx(t, "asmStk_frameBody",
          "Each call that has not returned yet owns a stretch of the stack, its frame: the return address, saved registers and local variables. The program below calls square(7). The function opens with the classic prologue and closes with the epilogue. Watch rsp and rbp, and the slots they point at.")}
      </p>
      <CpuFigure t={t} programs={["call"]} />
      <LessonTable
        headers={[tx(t, "asmStk_hLine", "Line"), tx(t, "asmStk_hRole", "Role")]}
        rows={[
          ["push rbp", tx(t, "asmStk_r1", "save the caller's frame pointer")],
          ["mov rbp, rsp", tx(t, "asmStk_r2", "rbp = the base of this frame; it stays fixed while rsp moves")],
          ["sub rsp, 16", tx(t, "asmStk_r3", "reserve room for local variables below rbp")],
          ["[rbp − 4]", tx(t, "asmStk_r4", "a local variable: negative offsets from rbp")],
          ["leave", tx(t, "asmStk_r5", "mov rsp, rbp then pop rbp: free the locals, restore the caller's rbp")],
          ["ret", tx(t, "asmStk_r6", "pop the return address into rip")],
        ]}
      />
      <p>
        {tx(t, "asmStk_gccO0",
          "This is the shape gcc uses without optimisation. For int square(int x) { return x * x; } gcc -O0 writes push rbp, mov rbp, rsp, mov DWORD PTR [rbp-4], edi, mov eax, DWORD PTR [rbp-4], imul eax, eax, pop rbp, ret. One difference: no sub rsp. square calls nothing, and System V lets such a leaf function use the 128 bytes below rsp without reserving them, an area called the red zone. A function that calls others must move rsp, or the call would push its return address over the locals.")}
      </p>
      <p>
        {tx(t, "asmStk_noFp",
          "With optimisation, gcc usually drops rbp as a frame pointer and addresses everything relative to rsp, which frees rbp as one more general register. Debuggers and profilers then use extra tables in the executable to walk the stack instead.")}
      </p>

      <H3>{tx(t, "asmStk_breakTitle", "Break it: a lost return address")}</H3>
      <p>
        {tx(t, "asmStk_breakBody",
          "Remove the leave line in the figure above and run again. rsp still points 16 bytes below the saved rbp, at the local area. ret pops whatever is there, 8 bytes nobody wrote (zeros here), and jumps to address 0. There is no code at address 0, so the CPU cannot even fetch the next instruction, and Linux stops the program with a segmentation fault. On Linux it is exit status 139, exactly as in the figure.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "asmStk_smash",
          "That ret jumps wherever the stack says is the basis of the classic stack buffer overflow attack. A C function that copies too much input into a local array writes past its end, over the return address, and the attacker chooses where ret goes. Modern systems defend in layers: a random canary value checked before ret (gcc's -fstack-protector), a stack that cannot be executed, random addresses (ASLR), and on recent CPUs a hardware shadow stack that keeps a second copy of every return address.")}
      </Callout>

      <H2>{tx(t, "asmStk_recTitle", "Recursion")}</H2>
      <p>
        {tx(t, "asmStk_recBody",
          "Since every call gets its own slots, a function can call itself. fact(n) computes n! = n × (n − 1)!. Each level saves its n and pushes a return address: 16 bytes per level. Watch the stack grow five levels deep, then unwind.")}
      </p>
      <CpuFigure t={t} programs={["fact"]} />
      <p>
        {tx(t, "asmStk_overflow",
          "Now remove the two lines of the base case. Nothing stops the calls any more: n goes to 0, −1, −2 and on, and every level takes another 16 bytes until the stack runs out. The next push touches an address below the stack, which is not mapped, and the program dies with a segmentation fault. This is a stack overflow.")}
      </p>
      <p>
        {tx(t, "asmStk_size",
          "The figure gives this program a stack of only 512 bytes, so the crash comes after about thirty calls. A real Linux stack is 8 MiB by default (ulimit -s prints 8192, in KiB), enough for about half a million levels of this function. The crash is the same, only later.")}
      </p>

      <H2>{tx(t, "asmStk_alignTitle", "One more rule: alignment")}</H2>
      <p>
        {tx(t, "asmStk_alignBody",
          "Some instructions that move 16 bytes at once require an address that is a multiple of 16. So System V adds a rule: rsp must be a multiple of 16 at every call. Right after the call, the return address has taken 8 bytes, so a function starts with rsp 8 bytes off. The push rbp of the prologue happens to fix that. The next chapter shows what goes wrong when a call breaks the rule.")}
      </p>
      <CodeBlock lang="nasm" filename="align.asm" t={t}>{`; rsp at a call:            ...0   (a multiple of 16)
; after call, at entry:     ...8   (the return address took 8)
        push    rbp         ; ...0   aligned again
        mov     rbp, rsp
        sub     rsp, 16     ; ...0   reserve in multiples of 16`}</CodeBlock>

      <H2>{tx(t, "asmStk_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "asmStk_try1", "The push-and-pop program swaps two registers. Rotate three with push and pop only: the old rax into rbx, the old rbx into rcx, the old rcx into rax. In which order must the pops come?")}</li>
        <li>{tx(t, "asmStk_try2", "In the square program, replace leave by pop rbp. What still goes wrong, and which instruction must come before it?")}</li>
        <li>{tx(t, "asmStk_try3", "Rewrite fact as a loop with no call at all. How many bytes of stack does it use for n = 20?")}</li>
      </ol>

      <KeyIdeas t={t} id="asmStk" items={[
        "rsp points at the last value pushed. push lowers rsp by 8 and writes; pop reads and raises rsp by 8. The stack grows downward.",
        "call pushes the return address and jumps; ret pops it into rip. ret trusts the stack completely.",
        "A frame holds a call's return address, saved registers and locals. With rbp as frame pointer, locals sit at [rbp − n].",
        "leave undoes the prologue: mov rsp, rbp, then pop rbp.",
        "A corrupted or misplaced return address sends ret anywhere, usually into a segmentation fault.",
        "Endless recursion uses up the stack (8 MiB by default on Linux) and crashes with a stack overflow.",
        "System V wants rsp to be a multiple of 16 at every call.",
      ]} />
    </Article>
  );
}
