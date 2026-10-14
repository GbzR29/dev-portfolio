"use client";

// C Foundations 2: pointers — addresses and &, pointer variables, * in a
// declaration vs * in an expression; pass by value and why swap needs
// pointers; arrays as blocks, decay to a pointer, a[i] == *(a + i), pointer
// arithmetic scaled by the element size, pointer difference; passing arrays
// with their length; NULL and uninitialised pointers; const with pointers;
// void *; pointers to pointers (argv).

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";

export function CPointersContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cPtr_intro",
          "Every variable lives at an address: the number of its first byte in memory. A pointer is a variable whose value is such an address. That is all a pointer is, yet it gives C most of its power. A function can change a variable that belongs to its caller. A large structure can be handed over without copying it. A whole array can be walked with one moving address. Pointers are also behind most crashes in C programs, so this chapter builds the picture slowly, with boxes and arrows.")}
      </Lead>

      <Goals t={t} id="cPtr" items={[
        "Say what a pointer holds, and read &x, *p and p in any line of code.",
        "Write a function that changes its caller's variables.",
        "Walk an array with pointer arithmetic and explain why p + 1 skips sizeof(*p) bytes.",
        "Pass an array to a function correctly, with its length.",
        "Read const int * and int * const, and guard against NULL.",
      ]} />

      <H2>{tx(t, "cPtr_addrTitle", "Addresses and the & operator")}</H2>
      <p>
        {tx(t, "cPtr_addrBody",
          "The operator & placed before a variable gives its address. Printed with %p, it is a large hexadecimal number (base 16, digits 0–9 and a–f). The exact value changes from run to run, because the operating system places the stack at a random spot each time to make attacks harder. What stays the same is the layout: variables declared together sit a few bytes apart.")}
      </p>
      <CodeBlock lang="c" filename="address.c" t={t}>{`int x = 5;
double d = 1.5;
printf("x is %d and lives at %p\\n", x, (void *)&x);   // e.g. 0x7ffe4c
printf("d is %f and lives at %p\\n", d, (void *)&d);   // e.g. 0x7ffe40`}</CodeBlock>

      <H2>{tx(t, "cPtr_varTitle", "Pointer variables")}</H2>
      <p>
        {tx(t, "cPtr_varBody",
          "A pointer variable is declared with a * between the type and the name: int *p; reads \"p is a pointer to int\". It takes 8 bytes on a 64-bit machine, whatever it points to, because it only stores an address. The type in front (int here) tells the compiler what it will find at that address. Using * in an expression does something different: *p means \"the value at the address stored in p\". Reading or writing *p is called dereferencing p.")}
      </p>
      <LessonTable
        headers={[tx(t, "cPtr_hExpr", "Expression"), tx(t, "cPtr_hType", "Type"), tx(t, "cPtr_hMeans", "Means (with int x = 5; int *p = &x;)")]}
        rows={[
          ["x", "int", tx(t, "cPtr_e1", "the value in x: 5")],
          ["&x", "int *", tx(t, "cPtr_e2", "the address of x")],
          ["p", "int *", tx(t, "cPtr_e3", "the value in p, which is the address of x")],
          ["*p", "int", tx(t, "cPtr_e4", "the int at that address: x itself. *p = 9 changes x")],
          ["&p", "int **", tx(t, "cPtr_e5", "the address of p: a pointer is a variable too, with its own box")],
        ]}
      />
      <MemoryBoxFigure t={t} programs={["pointer"]} />
      <Callout type="warn" t={t}>
        {tx(t, "cPtr_starWarn",
          "In int *a, b; only a is a pointer. b is a plain int: the * belongs to the name, not to the type. Declare one pointer per line and the problem never comes up.")}
      </Callout>

      <H2>{tx(t, "cPtr_swapTitle", "Why functions need pointers")}</H2>
      <p>
        {tx(t, "cPtr_swapBody",
          "C passes every argument by value: the function receives a copy in a new box of its own frame. Changing the copy does not touch the original. So a function that should change its caller's variables must receive their addresses instead. Compare the two versions of swap below: the first swaps its copies and then throws them away; the second reaches the originals through the pointers.")}
      </p>
      <MemoryBoxFigure t={t} programs={["swapVal", "swapPtr"]} />
      <CodeBlock lang="c" filename="minmax.c" t={t}>{`// Returning two results: write them through pointers the caller provides
void minmax(const int *a, size_t n, int *lo, int *hi) {
    *lo = *hi = a[0];
    for (size_t i = 1; i < n; i++) {
        if (a[i] < *lo) *lo = a[i];
        if (a[i] > *hi) *hi = a[i];
    }
}

int data[] = {4, 9, 1, 7};
int lo, hi;
minmax(data, 4, &lo, &hi);   // lo = 1, hi = 9`}</CodeBlock>

      <H2>{tx(t, "cPtr_arrTitle", "Arrays and pointer arithmetic")}</H2>
      <p>
        {tx(t, "cPtr_arrBody",
          "An array is one block of elements side by side, with no gaps. In almost every expression, the name of an array turns into a pointer to its first element. This is called decay. Adding a whole number n to a pointer moves it n elements forward, not n bytes: the compiler multiplies by the element size. So for an int pointer, p + 1 is 4 bytes further, and for a double pointer it is 8 bytes further. C defines indexing with that rule: a[i] means exactly *(a + i).")}
      </p>
      <LessonTable
        headers={[tx(t, "cPtr_hOp", "Operation"), tx(t, "cPtr_hResult", "Result (int a[5]; int *p = a;)")]}
        rows={[
          ["p + i", tx(t, "cPtr_a1", "the address of a[i]: address of a + i × sizeof(int)")],
          ["*(p + i)  ≡  p[i]", tx(t, "cPtr_a2", "the element a[i]")],
          ["p++", tx(t, "cPtr_a3", "p now points at the next element")],
          ["q − p", tx(t, "cPtr_a4", "for two pointers into the same array: how many elements apart they are")],
          ["p < q", tx(t, "cPtr_a5", "compares positions in the same array; used as a loop condition")],
          ["a + 5", tx(t, "cPtr_a6", "one past the end: allowed as a stop marker, but must never be read")],
        ]}
      />
      <CodeBlock lang="c" filename="walk.c" t={t}>{`int a[5] = {3, 1, 4, 1, 5};

// Indexing
int sum = 0;
for (size_t i = 0; i < 5; i++) sum += a[i];

// The same walk with a moving pointer, stopping one past the end
sum = 0;
for (const int *p = a; p != a + 5; p++) sum += *p;`}</CodeBlock>

      <H3>{tx(t, "cPtr_passTitle", "Passing an array to a function")}</H3>
      <p>
        {tx(t, "cPtr_passBody",
          "An array cannot be passed by value. When you write sum(a), the function receives only the address of a[0], so it has no way to know how many elements follow. Always pass the length as a second parameter. Inside the function, sizeof on the parameter gives the size of a pointer (8), not of the array: a classic mistake.")}
      </p>
      <CodeBlock lang="c" filename="sum.c" t={t}>{`// "int a[]" in a parameter list is just another way to write "int *a"
int sum(const int *a, size_t n) {
    int s = 0;
    for (size_t i = 0; i < n; i++) s += a[i];
    return s;
}

int values[] = {3, 1, 4, 1, 5};
size_t n = sizeof values / sizeof values[0];   // 20 / 4 = 5: works only where values is the array itself
printf("%d\\n", sum(values, n));                // 14`}</CodeBlock>

      <H2>{tx(t, "cPtr_nullTitle", "NULL and pointers that point nowhere")}</H2>
      <p>
        {tx(t, "cPtr_nullBody",
          "NULL is a special pointer value that means \"points at nothing\". Functions return it to report failure (malloc and fopen do), and you can test for it with if (p == NULL) or simply if (!p). Dereferencing NULL crashes the program on desktop systems, which is the good outcome: the bug shows up at once. The bad case is a pointer that was never given a value. Like any uninitialised variable it holds garbage, so it points at some random address, and writing through it can quietly damage other data. Initialise every pointer, to NULL if nothing better is available yet.")}
      </p>
      <CodeBlock lang="c" filename="null.c" t={t}>{`int *p = NULL;          // explicit: points at nothing yet
if (p != NULL) *p = 3;  // safe: skipped
int *q;                 // garbage address
// *q = 3;              // undefined behaviour: may crash, may corrupt anything`}</CodeBlock>

      <H2>{tx(t, "cPtr_constTitle", "const and pointers")}</H2>
      <p>
        {tx(t, "cPtr_constBody",
          "const marks something as read-only. With pointers there are two things that can be read-only: the value pointed at, and the pointer itself. Read the declaration from the name outwards, right to left.")}
      </p>
      <LessonTable
        headers={[tx(t, "cPtr_hDecl", "Declaration"), tx(t, "cPtr_hRead", "Read as"), tx(t, "cPtr_hAllowed", "Allowed")]}
        rows={[
          ["const int *p", tx(t, "cPtr_c1", "p is a pointer to a const int"), tx(t, "cPtr_c1b", "p = &y yes, *p = 1 no")],
          ["int *const p", tx(t, "cPtr_c2", "p is a const pointer to an int"), tx(t, "cPtr_c2b", "*p = 1 yes, p = &y no")],
          ["const int *const p", tx(t, "cPtr_c3", "a const pointer to a const int"), tx(t, "cPtr_c3b", "neither")],
        ]}
      />
      <p>
        {tx(t, "cPtr_constUse",
          "The first form is the one you will write most. A parameter declared const int *a promises the caller that the function only reads the array, and the compiler enforces the promise.")}
      </p>

      <H2>{tx(t, "cPtr_voidTitle", "void * and pointers to pointers")}</H2>
      <p>
        {tx(t, "cPtr_voidBody",
          "A void * holds an address with no type attached. It cannot be dereferenced or moved with + until it is converted to a real pointer type. Generic functions use it: malloc returns a void *, and memcpy copies bytes between two of them. In C it converts to any other pointer type without a cast; C++ requires the cast.")}
      </p>
      <p>
        {tx(t, "cPtr_ppBody",
          "A pointer is a variable, so it has an address too, and a pointer to a pointer stores that address. You meet one in the full form of main: int main(int argc, char **argv). argv points at an array of pointers, one per command-line word, and each of those points at the characters of the word.")}
      </p>
      <CodeBlock lang="c" filename="args.c" t={t}>{`#include <stdio.h>

int main(int argc, char **argv) {     // ./args red green
    for (int i = 0; i < argc; i++)
        printf("argv[%d] = %s\\n", i, argv[i]);
    return 0;                         // prints ./args, red, green
}`}</CodeBlock>

      <H2>{tx(t, "cPtr_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cPtr_try1", "Print &a[0], &a[1] and &a[2] for an int array and for a double array. By how much do the addresses grow each time?")}</li>
        <li>{tx(t, "cPtr_try2", "Write void reverse(int *a, size_t n) with two pointers, one from each end, that swap and move towards each other until they meet.")}</li>
        <li>{tx(t, "cPtr_try3", "Write int *find(int *a, size_t n, int x) that returns a pointer to the first element equal to x, or NULL. Use it to change that element through the pointer.")}</li>
      </ol>

      <KeyIdeas t={t} id="cPtr" items={[
        "A pointer is a variable that holds an address. &x makes an address and *p follows one.",
        "C passes arguments by value. To let a function change your variable, pass its address.",
        "An array name decays to a pointer to its first element, and a[i] is *(a + i).",
        "p + 1 moves by one element, sizeof(*p) bytes, not by one byte.",
        "A function receiving an array gets only a pointer: pass the length too.",
        "Initialise every pointer. NULL means nowhere and can be tested; garbage cannot.",
      ]} />
    </Article>
  );
}
