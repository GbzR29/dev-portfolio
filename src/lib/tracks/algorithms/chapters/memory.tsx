"use client";

// Foundations 1: memory — bytes and addresses, sizeof, byte order; variables
// at addresses; arrays as contiguous blocks and the address formula
// base + i·s (why indexing is constant time and starts at 0); 2D arrays in
// row-major order; pointers, dereferencing and pointer arithmetic (a[i] is
// *(a + i)); struct layout, alignment and padding; stack vs heap, new/delete,
// leaks and dangling pointers, RAII owners; the memory hierarchy, cache lines
// and locality; worked address calculations; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { MemoryFigure } from "@/components/lesson/figures/algo/MemoryFigure";

const r = String.raw;

export function MemoryContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alMem_intro",
          "A data structure is a way of arranging data in memory so that some operations become fast. An array, a linked list, a hash table and a tree can all hold the same thousand numbers; what differs is where each number sits and how you get from one to the next. So before building any of them we need a clear picture of memory itself: what an address is, how an array is laid out, what a pointer holds, where memory comes from and why reading it in order is so much faster than jumping around. Every chapter of this track relies on this picture, and every structure in it is written by hand in C++, so nothing is hidden inside a library.")}
      </Lead>

      <H2>{tx(t, "alMem_bytesTitle", "Bytes and addresses")}</H2>
      <p>
        {tx(t, "alMem_bytesBody",
          "To a program, memory is one enormous row of numbered boxes. Each box holds one byte: 8 bits, so a whole number from 0 to 255 (2⁸ = 256 possible patterns). The number of a box is its address. Addresses start at 0 and go up one per byte; on a 64-bit machine they are 64-bit numbers, which is why they are almost always written in hexadecimal (base 16, see the Number Bases chapter of the Math track): 0x1000 is 4096, 0x1004 is four bytes further. Everything a program stores, whether a number, a letter, a picture or a pointer, is some run of consecutive bytes at some address.")}
      </p>
      <p>
        {tx(t, "alMem_sizeBody",
          "A value bigger than 255 needs several bytes. The number of bytes a type takes is its size, and C++ reports it with the sizeof operator. The standard only fixes minimums, but every mainstream desktop and phone uses the sizes below; when the exact width matters, the types int32_t, int64_t and so on from <cstdint> guarantee it.")}
      </p>
      <LessonTable
        headers={[tx(t, "alMem_tType", "Type"), tx(t, "alMem_tBytes", "Bytes"), tx(t, "alMem_tHolds", "Holds")]}
        rows={[
          ["bool, char", "1", tx(t, "alMem_s1", "true/false; a character or a small integer (−128…127 or 0…255)")],
          ["short", "2", tx(t, "alMem_s2", "integers from −32 768 to 32 767")],
          ["int, float", "4", tx(t, "alMem_s3", "integers up to about ±2.1 billion; a decimal number with about 7 significant digits")],
          ["long long, double", "8", tx(t, "alMem_s4", "integers up to about ±9.2 · 10¹⁸; a decimal number with about 16 significant digits")],
          ["T* (any pointer)", "8", tx(t, "alMem_s5", "an address, on a 64-bit machine (4 on a 32-bit one)")],
        ]}
      />
      <CodeBlock lang="cpp" filename="sizes.cpp" t={t}>{`#include <cstdio>

int main() {
    std::printf("char   %zu\\n", sizeof(char));     // 1, by definition
    std::printf("int    %zu\\n", sizeof(int));      // 4
    std::printf("double %zu\\n", sizeof(double));   // 8
    std::printf("int*   %zu\\n", sizeof(int*));     // 8 on a 64-bit machine
}`}</CodeBlock>
      <H3>{tx(t, "alMem_endianTitle", "Byte order")}</H3>
      <p>
        {tx(t, "alMem_endianBody",
          "A 4-byte int occupies 4 consecutive addresses, and the machine must decide which end of the number goes first. x86 and ARM processors are little-endian: the least significant byte is stored at the lowest address. The int 0x12345678 stored at 0x1000 therefore looks like 78 56 34 12 when you read the bytes 0x1000 to 0x1003 one by one. You rarely notice, because the processor reads and writes whole ints; it matters only when bytes are inspected one at a time or sent to another machine.")}
      </p>

      <H2>{tx(t, "alMem_varTitle", "Variables live at addresses")}</H2>
      <p>
        {tx(t, "alMem_varBody",
          "When you write int x = 42;, the compiler reserves 4 bytes somewhere and remembers that the name x means \"the int stored at that address\". Reading x loads those 4 bytes; assigning to x overwrites them. The operator & (address-of) gives the address itself. Printing it shows a large hexadecimal number that changes from run to run, because the operating system places the program at a different spot each time.")}
      </p>
      <CodeBlock lang="cpp" filename="address.cpp" t={t}>{`int x = 42;
int y = 7;
std::printf("x = %d lives at %p\\n", x, (void*)&x);   // e.g. 0x7ffd5c3a1b2c
std::printf("y = %d lives at %p\\n", y, (void*)&y);   // a few bytes away`}</CodeBlock>

      <H2>{tx(t, "alMem_arrTitle", "Arrays: one block, no gaps")}</H2>
      <p>
        {tx(t, "alMem_arrBody",
          "An array of n elements of type T is a single block of n · sizeof(T) bytes, with the elements stored one right after another, in index order, with no gaps between them. That one fact gives the array its superpower. To find element i, the program does not search: it computes where the element must be.")}
      </p>
      <Equation label={tx(t, "alMem_eqAddr", "Address of element i")}
        where={[
          [r`\text{base}`, tx(t, "alMem_wBase", "the address of the first byte of the array, which is also the address of element 0")],
          [r`i`, tx(t, "alMem_wI", "the index: how many whole elements lie before the one we want")],
          [r`s`, tx(t, "alMem_wS", "the size of one element in bytes, sizeof(T)")],
        ]}
        note={tx(t, "alMem_eqAddrNote", "One multiplication and one addition, the same work for i = 3 as for i = 3 000 000. The next chapter calls this \"constant time\". It also explains why C++ counts from 0: the index is an offset, and the first element is 0 elements past the start.")}>
        {r`\text{address}(a[i]) = \text{base} + i \cdot s`}
      </Equation>
      <p>
        {tx(t, "alMem_arrWorked",
          "Worked example. int a[10] starts at 0x1000, and an int takes s = 4 bytes. Element 7 is at 0x1000 + 7 · 4 = 0x1000 + 28. In hexadecimal 28 = 1 · 16 + 12 = 0x1C, so a[7] lives at 0x101C and occupies bytes 0x101C to 0x101F. For a double array at the same base, s = 8 and a[3] is at 0x1000 + 24 = 0x1018. Drag the index in the figure and switch the element type to see the same formula at work.")}
      </p>

      <MemoryFigure t={t} initial="array" />

      <CodeBlock lang="cpp" filename="array.cpp" t={t}>{`int a[5] = {10, 20, 30, 40, 50};
for (int i = 0; i < 5; ++i)
    std::printf("a[%d] = %d at %p\\n", i, a[i], (void*)&a[i]);   // addresses exactly 4 apart`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "alMem_boundsNote", "C++ does not check indices. a[5] in the array above computes base + 20 and reads whatever lies there: another variable, garbage, or memory the program may not touch (a crash). This is undefined behaviour: the program may do anything, including appear to work. The valid indices of an array of n elements are 0 to n − 1. std::array and std::vector offer .at(i), which checks and throws an exception instead.")}
      </Callout>

      <H3>{tx(t, "alMem_2dTitle", "Two-dimensional arrays: row after row")}</H3>
      <p>
        {tx(t, "alMem_2dBody",
          "Memory has only one dimension, so a grid must be flattened. C++ stores int g[R][C] in row-major order: all of row 0 (C elements), then all of row 1, and so on. Element (r, c) has r complete rows before it plus c elements of its own row:")}
      </p>
      <Equation label={tx(t, "alMem_eq2d", "Row-major address")}
        where={[
          [r`r,\ c`, tx(t, "alMem_wRC", "the row and column index, both counted from 0")],
          [r`C`, tx(t, "alMem_wC", "the number of columns, the length of one row")],
          [r`s`, tx(t, "alMem_wS2", "the size of one element in bytes")],
        ]}
        note={tx(t, "alMem_eq2dNote", "Worked example: int g[3][4] at 0x2000. g[2][1] has 2 · 4 + 1 = 9 elements before it, so it is at 0x2000 + 9 · 4 = 0x2000 + 36 = 0x2024 (36 = 2 · 16 + 4). The number of rows R does not appear: only the row length is needed to find anything.")}>
        {r`\text{address}(g[r][c]) = \text{base} + (r \cdot C + c) \cdot s`}
      </Equation>

      <H2>{tx(t, "alMem_ptrTitle", "Pointers: variables that hold addresses")}</H2>
      <p>
        {tx(t, "alMem_ptrBody",
          "A pointer is an ordinary variable whose value is an address. int* p declares a pointer to int: 8 bytes that hold the address of some int. Writing *p (dereferencing) means \"the int at the address stored in p\", so *p can be read and assigned like the variable it points to. The special value nullptr means \"points nowhere\"; dereferencing it is a bug that usually crashes the program.")}
      </p>
      <p>
        {tx(t, "alMem_arithBody",
          "Adding an integer to a pointer moves it by whole elements, not bytes: if p points to an int, p + 1 is 4 bytes further and p + i is i · 4 bytes further. This is exactly the array formula, and C++ defines indexing in terms of it: a[i] means *(a + i). The name of an array, used as a value, converts to a pointer to its element 0, which is why arrays can be passed to functions as pointers (and why the function then no longer knows the array's length).")}
      </p>
      <CodeBlock lang="cpp" filename="pointers.cpp" t={t}>{`int  x = 42;
int* p = &x;            // p holds the address of x
*p = 43;                // write through p: x is now 43

int a[5] = {10, 20, 30, 40, 50};
int* q = a;             // the array name converts to &a[0]
q = q + 2;              // moves 2 × sizeof(int) = 8 bytes: now q == &a[2]
std::printf("%d %d\\n", *q, q[1]);   // 30 40   (q[1] is *(q + 1), i.e. a[3])

int* none = nullptr;    // points nowhere: *none would be a bug

struct Point { float x, y; };
Point pt{1.5f, 2.0f};
Point* pp = &pt;
pp->y = 3.0f;           // p->field is shorthand for (*p).field`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "alMem_tWrite", "You write"), tx(t, "alMem_tMeans", "It means")]}
        rows={[
          ["&x", tx(t, "alMem_m1", "the address of x")],
          ["T* p", tx(t, "alMem_m2", "p is a variable holding the address of a T")],
          ["*p", tx(t, "alMem_m3", "the T stored at the address in p (read or write it)")],
          ["p + i", tx(t, "alMem_m4", "the address i elements (i · sizeof(T) bytes) after p")],
          ["p[i]", tx(t, "alMem_m5", "*(p + i): element i counting from p")],
          ["p->f", tx(t, "alMem_m6", "(*p).f: field f of the struct p points to")],
          ["nullptr", tx(t, "alMem_m7", "the pointer value that points to nothing")],
        ]}
      />

      <H2>{tx(t, "alMem_structTitle", "Structs, alignment and padding")}</H2>
      <p>
        {tx(t, "alMem_structBody",
          "A struct groups several fields into one block, stored in the order they are declared. There is one twist. Processors read a value fastest (on some processors, only) when its address is a multiple of its size: a 4-byte int at an address divisible by 4, an 8-byte double at one divisible by 8. This requirement is the type's alignment. To honour it, the compiler inserts unused padding bytes before a field when needed, and rounds the size of the whole struct up to a multiple of its largest alignment, so that in an array of structs every element starts aligned too.")}
      </p>
      <p>
        {tx(t, "alMem_structWorked",
          "Worked example: struct S { char a; int b; char c; }. a goes at offset 0 (1 byte). b needs an offset divisible by 4: offset 1 is not, so 3 padding bytes are added and b goes at 4, occupying 4 to 7. c goes at 8. That is 9 bytes, and the largest alignment is 4, so the size rounds up to 12. Reorder the fields as { int b; char a; char c; }: b at 0, a at 4, c at 5, 6 bytes rounded up to 8. Same data, a third less memory. The rule of thumb is to declare fields from largest to smallest. Try all four layouts:")}
      </p>

      <MemoryFigure t={t} initial="struct" />

      <H2>{tx(t, "alMem_stackTitle", "Where memory comes from: the stack and the heap")}</H2>
      <p>
        {tx(t, "alMem_stackBody",
          "A running program gets memory from two main places. The stack holds the local variables of functions. Every call reserves a block for its locals, called a stack frame, on top of the caller's; when the function returns, its frame is released just by moving a pointer back. This is automatic and extremely fast, but the stack is small (typically 1 MB on Windows and 8 MB on Linux for the main thread), and the size of each frame must be known when the program is compiled. The Recursion chapter looks at the stack closely.")}
      </p>
      <p>
        {tx(t, "alMem_heapBody",
          "The heap (C++ calls it the free store) is a large pool from which a program asks for blocks at run time, with new, and gives them back with delete. Its blocks live until you free them, however many functions return in between, and their size can be decided while the program runs. The price is that a general-purpose allocator must search for a suitable free block, which is slower than moving the stack pointer, and that every block must be freed exactly once. Forgetting is a memory leak; freeing twice, or using a block after freeing it, corrupts memory.")}
      </p>
      <CodeBlock lang="cpp" filename="heap.cpp" t={t}>{`#include <cstdio>

int* makeSquares(int n) {
    int* squares = new int[n];          // size known only at run time: heap
    for (int i = 0; i < n; ++i) squares[i] = i * i;
    return squares;                     // the block outlives this function
}

int* broken() {
    int local[4] = {1, 2, 3, 4};        // lives in broken()'s stack frame
    return local;                       // BUG: the frame is released on return
}                                       // (compilers warn about this)

int main() {
    int n = 0;
    if (std::scanf("%d", &n) != 1 || n <= 0) return 1;
    int* sq = makeSquares(n);
    std::printf("%d\\n", sq[n - 1]);
    delete[] sq;                        // new[] pairs with delete[], new with delete
}`}</CodeBlock>
      <LessonTable
        headers={["", tx(t, "alMem_tStack", "Stack"), tx(t, "alMem_tHeap", "Heap")]}
        rows={[
          [tx(t, "alMem_h1", "What goes there"), tx(t, "alMem_h1s", "local variables, function parameters, return addresses"), tx(t, "alMem_h1h", "anything created with new")],
          [tx(t, "alMem_h2", "Lifetime"), tx(t, "alMem_h2s", "until the function returns, automatically"), tx(t, "alMem_h2h", "until delete, which you must call")],
          [tx(t, "alMem_h3", "Size"), tx(t, "alMem_h3s", "fixed at compile time; the whole stack is a few MB"), tx(t, "alMem_h3h", "chosen at run time; up to the machine's memory")],
          [tx(t, "alMem_h4", "Speed"), tx(t, "alMem_h4s", "move one pointer"), tx(t, "alMem_h4h", "the allocator searches for a free block")],
          [tx(t, "alMem_h5", "Typical bugs"), tx(t, "alMem_h5s", "stack overflow; pointers to locals that are gone"), tx(t, "alMem_h5h", "leaks, double delete, use after delete")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "alMem_raiiNote", "In real code you rarely write delete yourself. A class can free its memory in its destructor, which C++ calls automatically when the object goes out of scope; this idiom is called RAII (see the RAII chapter of the Modern C++ track). std::vector<int> v(n) and std::make_unique<int[]>(n) are owners of exactly that kind. In this track we build the containers ourselves, so we will write those destructors by hand, starting with our own vector in the Dynamic Arrays chapter.")}
      </Callout>

      <H2>{tx(t, "alMem_cacheTitle", "The memory hierarchy and the cache")}</H2>
      <p>
        {tx(t, "alMem_cacheBody",
          "Main memory (RAM) is large but slow compared with the processor: fetching a value from it takes on the order of 100 nanoseconds, time in which a modern core could have executed several hundred instructions. To hide this, processors keep copies of recently used memory in small, fast caches. The approximate figures below vary between machines, but their proportions hold everywhere:")}
      </p>
      <LessonTable
        headers={[tx(t, "alMem_tLevel", "Level"), tx(t, "alMem_tSize", "Typical size"), tx(t, "alMem_tTime", "Time to read")]}
        rows={[
          [tx(t, "alMem_l0", "Registers"), tx(t, "alMem_l0s", "a few hundred bytes"), tx(t, "alMem_l0t", "under 1 ns (part of the instruction)")],
          [tx(t, "alMem_l1", "L1 cache"), "32–64 KB", "~1 ns"],
          [tx(t, "alMem_l2", "L2 cache"), "0.5–2 MB", "~4 ns"],
          [tx(t, "alMem_l3", "L3 cache"), "8–64 MB", "~10–20 ns"],
          ["RAM", "8–64 GB", "~80–100 ns"],
          ["SSD", "0.5–4 TB", "~50–100 µs"],
        ]}
      />
      <p>
        {tx(t, "alMem_lineBody",
          "The cache never fetches a single byte. It moves memory in fixed blocks called cache lines, 64 bytes on current processors. When the program reads an address that is not in the cache (a miss), the whole 64-byte line containing it is loaded; reads of any other byte of that line are then hits, served in a nanosecond or so. Two habits of programs make caches work. Spatial locality: after reading one address, a program tends to read the ones right next to it. Temporal locality: what was read recently tends to be read again soon.")}
      </p>

      <MemoryFigure t={t} initial="cache" />

      <p>
        {tx(t, "alMem_loopBody",
          "The two loops below add up the same 4096 × 4096 grid of ints (64 MB, far bigger than any cache). sumRows reads memory in order, so each 64-byte line serves 16 consecutive ints. sumCols reads grid[0][c], grid[1][c], …, each 4096 · 4 = 16 KB after the previous one: every read touches a new line, and by the time the loop comes back for the next column that line has long been evicted. Both do exactly the same number of additions, yet on a typical desktop sumCols is several times slower.")}
      </p>
      <CodeBlock lang="cpp" filename="locality.cpp" t={t}>{`constexpr int N = 4096;
static int grid[N][N];              // 64 MB, stored row after row

long long sumRows() {               // walks memory in address order
    long long s = 0;
    for (int r = 0; r < N; ++r)
        for (int c = 0; c < N; ++c) s += grid[r][c];
    return s;
}

long long sumCols() {               // jumps 16 KB between consecutive reads
    long long s = 0;
    for (int c = 0; c < N; ++c)
        for (int r = 0; r < N; ++r) s += grid[r][c];
    return s;
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "alMem_whyNote", "This is why the layout of a data structure matters as much as its step count. An array is read in address order; a linked structure, whose elements are scattered over the heap and connected by pointers, makes every step a jump to an unpredictable address. The next chapter counts steps; the cache decides how long each step takes. Both come back when we compare arrays with linked lists.")}
      </Callout>

      <H2>{tx(t, "alMem_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alMem_w1",
          "1. An array of structs. struct Point { float x, y; } has size 8 (two 4-byte floats, no padding). An array pts starts at 0x3000. Where is pts[5].y? Element 5 starts at 0x3000 + 5 · 8 = 0x3000 + 40 = 0x3028 (40 = 2 · 16 + 8). Inside a Point, y comes after x, at offset 4. So pts[5].y is at 0x3028 + 4 = 0x302C.")}
      </p>
      <p>
        {tx(t, "alMem_w2",
          "2. How many cache lines does reading an array touch? An array of 1000 ints takes 1000 · 4 = 4000 bytes. With 64-byte lines that is 4000 / 64 = 62.5, so at least 63 lines, or 64 if the array does not start at a multiple of 64 and straddles an extra line at each end. Reading it in order therefore costs about 63 misses for 1000 reads; reading 1000 ints scattered at random costs up to 1000.")}
      </p>
      <p>
        {tx(t, "alMem_w3",
          "3. The size of struct { double d; char c; }. d is at 0 (8 bytes), c at 8 (1 byte): 9 bytes. The largest alignment is 8, so the size rounds up to 16. Seven of the 16 bytes are padding, and reordering cannot help here: the struct needs its size to be a multiple of 8 so that the d of the next array element is aligned.")}
      </p>

      <H2>{tx(t, "alMem_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alMem_tMistake", "Mistake"), tx(t, "alMem_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alMem_e1", "Reading a[n] in an array of n elements"), tx(t, "alMem_e1b", "the last valid index is n − 1; a[n] reads past the end (undefined behaviour). Loops run while i < n, not i <= n")],
          [tx(t, "alMem_e2", "sizeof(a) inside a function that received the array"), tx(t, "alMem_e2b", "the parameter is a pointer, so sizeof gives 8, not the array's size. Pass the length separately, or pass a std::span / std::array")],
          [tx(t, "alMem_e3", "Returning the address of a local variable"), tx(t, "alMem_e3b", "the frame is released on return and the pointer dangles. Return by value, or allocate on the heap and hand over ownership")],
          [tx(t, "alMem_e4", "new without delete, or new[] with delete"), tx(t, "alMem_e4b", "the first leaks, the second is undefined behaviour. Pair new/delete and new[]/delete[], or let an owner (vector, unique_ptr) do it")],
          [tx(t, "alMem_e5", "Using a pointer after delete"), tx(t, "alMem_e5b", "the block may already belong to something else. Set the pointer to nullptr after deleting, or better, do not keep raw owning pointers")],
          [tx(t, "alMem_e6", "An uninitialised pointer"), tx(t, "alMem_e6b", "it holds a garbage address. Initialise every pointer, with nullptr if nothing else")],
          [tx(t, "alMem_e7", "Assuming int is exactly 4 bytes everywhere"), tx(t, "alMem_e7b", "true on desktops, not guaranteed. Use int32_t or int64_t from <cstdint> when the width matters")],
        ]}
      />

      <KeyIdeas t={t} id="alMem" items={[
        "Memory is a row of numbered bytes; an address is a byte's number, and sizeof(T) is how many bytes a T takes.",
        "An array is one gap-free block: element i is at base + i · s, so indexing costs the same for every i, and indices start at 0.",
        "A 2D array is stored row after row: (r, c) is at base + (r · C + c) · s.",
        "A pointer holds an address; *p is the value there, and p + i moves by i elements, so a[i] is *(a + i).",
        "Struct fields are aligned to their size, with padding in between; declare large fields first.",
        "The stack is automatic, fast and small; the heap is flexible and large, but every new needs exactly one delete (or an owner that does it).",
        "Memory moves in 64-byte cache lines: reading in address order is fast, jumping around is slow.",
      ]} />
    </Article>
  );
}
