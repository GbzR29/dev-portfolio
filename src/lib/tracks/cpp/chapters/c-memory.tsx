"use client";

// C Foundations 3: memory — the three storage durations (static, automatic,
// allocated); stack frames, their speed and their size limit; malloc, calloc,
// realloc and free, checking for NULL, the sizeof *p idiom, the realloc
// pitfall; lifetime bugs (leak, use after free, double free, returning the
// address of a local, overflow); ownership rules and create/destroy pairs
// with a growable array; finding the bugs with AddressSanitizer and Valgrind.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CMemoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cMem_intro",
          "Every box in a C program has a lifetime: the stretch of time during which it exists and may be used. Some boxes live as long as the program, some only while a function runs, and some exactly as long as you decide. In C, the last kind is entirely your job. You ask for the memory and you give it back, and nothing checks that you did either correctly. This chapter shows where memory comes from, how long it lasts, and the five classic ways of getting it wrong.")}
      </Lead>

      <Goals t={t} id="cMem" items={[
        "Say where a variable lives (static, stack or heap) and how long it lasts.",
        "Allocate, resize and free heap memory, checking every result.",
        "Recognise a leak, a dangling pointer, a double free and an overflow in code.",
        "Write a create/destroy pair that owns a heap block.",
        "Find memory bugs with AddressSanitizer.",
      ]} />

      <H2>{tx(t, "cMem_kindsTitle", "Three places memory comes from")}</H2>
      <LessonTable
        headers={[tx(t, "cMem_hKind", "Kind"), tx(t, "cMem_hWhat", "What lives there"), tx(t, "cMem_hLife", "Lifetime"), tx(t, "cMem_hSize", "Size")]}
        rows={[
          [tx(t, "cMem_k1", "Static"), tx(t, "cMem_k1w", "globals, and locals marked static"), tx(t, "cMem_k1l", "the whole run of the program"), tx(t, "cMem_k1s", "fixed when compiling")],
          [tx(t, "cMem_k2", "Stack (automatic)"), tx(t, "cMem_k2w", "local variables and parameters"), tx(t, "cMem_k2l", "from the declaration to the end of its block { }"), tx(t, "cMem_k2s", "small: usually 1–8 MB in total")],
          [tx(t, "cMem_k3", "Heap (allocated)"), tx(t, "cMem_k3w", "blocks from malloc, calloc, realloc"), tx(t, "cMem_k3l", "from malloc until you call free"), tx(t, "cMem_k3s", "as much as the machine has; chosen while running")],
        ]}
      />

      <H2>{tx(t, "cMem_stackTitle", "The stack")}</H2>
      <p>
        {tx(t, "cMem_stackBody",
          "Each function call gets a stack frame for its locals, its parameters and the address to return to. Calling a function pushes a frame; returning pops it. Making a frame costs almost nothing, since the processor just moves one register, the stack pointer, by the frame's size. That is why local variables are fast. The price is that the stack is small and the sizes must be fixed. An array of a million doubles (8 MB) as a local variable, or a recursion thousands of calls deep, runs past the end of the stack and the program dies with a stack overflow.")}
      </p>
      <CodeBlock lang="c" filename="static.c" t={t}>{`int calls = 0;                 // static: one box for the whole program

void tick(void) {
    static int mine = 0;       // static local: keeps its value between calls
    int temp = 0;              // automatic: a new box every call
    calls++; mine++; temp++;
    printf("%d %d %d\\n", calls, mine, temp);   // 1 1 1, then 2 2 1, then 3 3 1
}`}</CodeBlock>

      <H2>{tx(t, "cMem_heapTitle", "The heap: malloc and free")}</H2>
      <p>
        {tx(t, "cMem_heapBody",
          "When the size is only known while running, or the data must outlive the function that makes it, you ask the heap. malloc(n) (from <stdlib.h>) finds n free bytes and returns their address, or NULL if it cannot. The bytes are not cleared. free(p) hands them back; after that, the address in p must never be used again. Step through the program and then break it: remove the free, or the line that sets the pointer to NULL, and watch the summary.")}
      </p>
      <MemoryBoxFigure t={t} programs={["heap"]} />
      <LessonTable
        headers={[tx(t, "cMem_hFn", "Function"), tx(t, "cMem_hDoes", "What it does")]}
        rows={[
          ["malloc(bytes)", tx(t, "cMem_f1", "a block of that many bytes, uninitialised; NULL on failure")],
          ["calloc(count, size)", tx(t, "cMem_f2", "count × size bytes, all set to zero; checks the multiplication for overflow")],
          ["realloc(p, bytes)", tx(t, "cMem_f3", "resizes the block, moving it if needed and copying the old contents; returns the new address or NULL")],
          ["free(p)", tx(t, "cMem_f4", "gives the block back; free(NULL) is allowed and does nothing")],
        ]}
      />
      <CodeBlock lang="c" filename="alloc.c" t={t}>{`#include <stdlib.h>

size_t n = 1000;
double *v = malloc(n * sizeof *v);   // sizeof *v: stays right if v's type changes
if (v == NULL) {                     // always check
    fprintf(stderr, "out of memory\\n");
    return 1;
}
for (size_t i = 0; i < n; i++) v[i] = 0.5 * i;
free(v);
v = NULL;`}</CodeBlock>
      <H3>{tx(t, "cMem_reallocTitle", "The realloc trap")}</H3>
      <p>
        {tx(t, "cMem_reallocBody",
          "If realloc fails it returns NULL and leaves the old block where it was. Writing p = realloc(p, bigger) therefore overwrites your only copy of the old address with NULL, and the old block leaks. Keep the result in a second variable first.")}
      </p>
      <CodeBlock lang="c" filename="grow.c" t={t}>{`int *tmp = realloc(p, newCount * sizeof *p);
if (tmp == NULL) {
    // p is still valid: handle the error, p can still be freed
} else {
    p = tmp;                // only now replace the old address
}`}</CodeBlock>

      <H2>{tx(t, "cMem_bugsTitle", "Five ways to get it wrong")}</H2>
      <p>
        {tx(t, "cMem_bugsBody",
          "All five compile without complaint and often seem to work. That is what makes them dangerous: the damage shows up later, somewhere else, or only on another machine.")}
      </p>
      <LessonTable
        headers={[tx(t, "cMem_hBug", "Bug"), tx(t, "cMem_hHow", "How it happens"), tx(t, "cMem_hEffect", "Effect")]}
        rows={[
          [tx(t, "cMem_b1", "Leak"), tx(t, "cMem_b1h", "the last pointer to a block is lost before free"), tx(t, "cMem_b1e", "memory use grows until the program ends or runs out")],
          [tx(t, "cMem_b2", "Use after free"), tx(t, "cMem_b2h", "reading or writing through a pointer after free"), tx(t, "cMem_b2e", "reads someone else's data, or corrupts it")],
          [tx(t, "cMem_b3", "Double free"), tx(t, "cMem_b3h", "free called twice on the same address"), tx(t, "cMem_b3e", "corrupts the allocator; often a crash much later")],
          [tx(t, "cMem_b4", "Returning a local's address"), tx(t, "cMem_b4h", "return &local; the frame dies at return"), tx(t, "cMem_b4e", "the next call reuses the memory: the value changes under you")],
          [tx(t, "cMem_b5", "Overflow"), tx(t, "cMem_b5h", "writing past the end of a block or array"), tx(t, "cMem_b5e", "overwrites neighbours; the root of many security holes")],
        ]}
      />
      <p>
        {tx(t, "cMem_bugsFig",
          "The figure below shows two of them. In the leak, one assignment loses a block for good. In the dangling case, make returns the address of its own local variable; watch what happens to that box when the next function is called.")}
      </p>
      <MemoryBoxFigure t={t} programs={["leak", "dangling"]} />

      <H2>{tx(t, "cMem_ownTitle", "Ownership: one malloc, one free, one owner")}</H2>
      <p>
        {tx(t, "cMem_ownBody",
          "The cure is discipline, written down. For every heap block, decide which piece of code owns it, meaning which one is responsible for freeing it. Then wrap the block in a struct with a create function and a destroy function, and never touch the raw allocation anywhere else. Large C code bases (SDL, Vulkan, SQLite) are built this way: SDL_CreateWindow is paired with SDL_DestroyWindow, vkCreateBuffer with vkDestroyBuffer.")}
      </p>
      <CodeBlock lang="c" filename="intvec.c" t={t}>{`typedef struct {
    int    *data;
    size_t  len, cap;          // elements used, elements allocated
} IntVec;

IntVec vec_create(void) { return (IntVec){ NULL, 0, 0 }; }

int vec_push(IntVec *v, int x) {
    if (v->len == v->cap) {                        // full: double the capacity
        size_t cap = v->cap ? v->cap * 2 : 8;
        int *tmp = realloc(v->data, cap * sizeof *tmp);
        if (!tmp) return 0;                        // failure, v is unchanged
        v->data = tmp;
        v->cap  = cap;
    }
    v->data[v->len++] = x;
    return 1;
}

void vec_destroy(IntVec *v) {
    free(v->data);
    *v = vec_create();                             // no dangling pointer left behind
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cMem_raiiNote",
          "This create/destroy pair is exactly what C++ automates. A constructor plays vec_create, a destructor plays vec_destroy, and the compiler calls the destructor on every path out of the block, so it cannot be forgotten. std::vector is this struct, done once and done right. The RAII chapter picks up from here.")}
      </Callout>

      <H2>{tx(t, "cMem_toolsTitle", "Let the tools find the bugs")}</H2>
      <p>
        {tx(t, "cMem_toolsBody",
          "You do not have to find these bugs by staring at code. AddressSanitizer (ASan) is built into gcc and clang: compile with -fsanitize=address and every out-of-bounds access, use after free, double free and leak stops the program with a report naming the exact line. It makes the program about twice as slow, so use it while developing and testing. On Linux, Valgrind finds the same bugs without recompiling, only much more slowly. MSVC supports /fsanitize=address too.")}
      </p>
      <CodeBlock lang="bash" filename="asan.sh" t={t}>{`gcc -std=c17 -Wall -Wextra -g -fsanitize=address leak.c -o leak
./leak
# ==4182==ERROR: LeakSanitizer: detected memory leaks
# Direct leak of 16 byte(s) in 1 object(s) allocated from:
#     #0 malloc
#     #1 main leak.c:4`}</CodeBlock>

      <H2>{tx(t, "cMem_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cMem_try1", "Read a count n with scanf, malloc n ints, fill them, print their sum and free them. Run it under -fsanitize=address with free removed.")}</li>
        <li>{tx(t, "cMem_try2", "Use the IntVec above to read numbers until the input ends, then print them in reverse. Print cap after each doubling.")}</li>
        <li>{tx(t, "cMem_try3", "Write each of the five bugs on purpose in a tiny program and read the ASan report for each one.")}</li>
      </ol>

      <KeyIdeas t={t} id="cMem" items={[
        "Static memory lives for the whole program, stack memory until its block ends, heap memory until free.",
        "The stack is fast but small and fixed in size; large or long-lived data goes on the heap.",
        "Check every malloc, calloc and realloc for NULL, and keep realloc's result in a temporary.",
        "Each block needs exactly one owner and exactly one free. Set pointers to NULL after freeing.",
        "Never return the address of a local variable: its frame is reused by the next call.",
        "Build and test with -fsanitize=address: it names the line of every memory bug.",
      ]} />
    </Article>
  );
}
