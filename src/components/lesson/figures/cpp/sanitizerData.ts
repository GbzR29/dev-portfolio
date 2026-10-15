// ── Sanitizer data ────────────────────────────────────────────────────────────
// Five small programs with one bug each, built five ways, for SanitizerFigure.
// Every output here is real: each program was compiled and run with x86-64
// gcc 14.2 on Linux through Compiler Explorer (2026-10-14). Reports are trimmed
// to their main lines ("…" marks a cut), long library paths are shortened,
// and colour codes are removed. ThreadSanitizer could not start for the two
// programs marked "na" in that environment, and it does not look for those
// bugs anyway, so no output is shown for them.

export type BugId = "overflow" | "dangle" | "signed" | "race" | "uninit";
export type ToolId = "plain" | "warn" | "asan" | "ubsan" | "tsan";
export type Verdict = "caught" | "silent" | "na";

export const TOOLS: { id: ToolId; flags: string }[] = [
  { id: "plain", flags: "g++ -O0" },
  { id: "warn", flags: "g++ -O2 -Wall -Wextra" },
  { id: "asan", flags: "g++ -g -fsanitize=address" },
  { id: "ubsan", flags: "g++ -g -fsanitize=undefined" },
  { id: "tsan", flags: "g++ -g -fsanitize=thread" },
];

export const BUGS: { id: BugId; name: string; code: string[] }[] = [
  { id: "overflow", name: "read past the end", code: [
    "#include <cstdio>",
    "int main() {",
    "    int* hp = new int[4]{10, 20, 30, 40};",
    "    int sum = 0;",
    "    for (int i = 0; i <= 4; ++i) sum += hp[i];   // i = 4 reads past the end",
    "    std::printf(\"%d\\n\", sum);",
    "    delete[] hp;",
    "}",
  ] },
  { id: "dangle", name: "reference into a vector", code: [
    "#include <cstdio>",
    "#include <vector>",
    "int main() {",
    "    std::vector<int> v{1, 2, 3};",
    "    int& first = v[0];",
    "    v.push_back(4);                  // grows: the elements move to new memory",
    "    std::printf(\"%d\\n\", first);",
    "}",
  ] },
  { id: "signed", name: "signed overflow", code: [
    "#include <climits>",
    "#include <cstdio>",
    "int main(int argc, char**) {",
    "    int score = INT_MAX - 1 + argc;  // INT_MAX when run with no arguments",
    "    score += 1;",
    "    std::printf(\"%d\\n\", score);",
    "}",
  ] },
  { id: "race", name: "data race", code: [
    "#include <cstdio>",
    "#include <thread>",
    "int counter = 0;",
    "void work() { for (int i = 0; i < 100000; ++i) ++counter; }",
    "int main() {",
    "    std::thread a{work}, b{work};",
    "    a.join(); b.join();",
    "    std::printf(\"%d\\n\", counter);",
    "}",
  ] },
  { id: "uninit", name: "uninitialised read", code: [
    "#include <cstdio>",
    "int main(int argc, char**) {",
    "    int lives;",
    "    if (argc > 1) lives = 3;",
    "    std::printf(\"%d\\n\", lives);",
    "}",
  ] },
];

export type Cell = { verdict: Verdict; out?: string; exit?: number; report?: string[]; line?: number };

const LIB = "…/c++/14.2.0/bits";

export const RESULTS: Record<BugId, Record<ToolId, Cell>> = {
  overflow: {
    plain: { verdict: "silent", out: "100", exit: 0 },
    warn: { verdict: "silent", out: "100", exit: 0, report: ["(no warnings)"] },
    asan: { verdict: "caught", exit: 1, line: 4, report: [
      "==2==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x502000000020 at pc 0x000000401322 bp 0x7ffc1b737560 sp 0x7ffc1b737558",
      "READ of size 4 at 0x502000000020 thread T0",
      "    #0 0x401321 in main /app/example.cpp:5",
      "…",
      "0x502000000020 is located 0 bytes after 16-byte region [0x502000000010,0x502000000020)",
      "allocated by thread T0 here:",
      "    #0 0x75518567c458 in operator new[](unsigned long) (libasan.so.8+0xfd458)",
      "    #1 0x4011b7 in main /app/example.cpp:3",
      "…",
      "SUMMARY: AddressSanitizer: heap-buffer-overflow /app/example.cpp:5 in main",
      "==2==ABORTING",
    ] },
    ubsan: { verdict: "silent", out: "100", exit: 0 },
    tsan: { verdict: "na" },
  },
  dangle: {
    plain: { verdict: "silent", out: "234112", exit: 0 },
    warn: { verdict: "silent", out: "17331", exit: 0, report: ["(no warnings)"] },
    asan: { verdict: "caught", exit: 1, line: 6, report: [
      "==2==ERROR: AddressSanitizer: heap-use-after-free on address 0x502000000010 at pc 0x00000040141f bp 0x7fff78625570 sp 0x7fff78625568",
      "READ of size 4 at 0x502000000010 thread T0",
      "    #0 0x40141e in main /app/example.cpp:7",
      "…",
      "0x502000000010 is located 0 bytes inside of 12-byte region [0x502000000010,0x50200000001c)",
      "freed by thread T0 here:",
      "    #0 0x733f8fd281f8 in operator delete(void*, unsigned long) (libasan.so.8+0xfe1f8)",
      `    #1 0x403826 in std::__new_allocator<int>::deallocate(int*, unsigned long) ${LIB}/new_allocator.h:172`,
      "…",
      `    #7 0x40225d in std::vector<int, std::allocator<int> >::push_back(int&&) ${LIB}/stl_vector.h:1301`,
      "    #8 0x4013d3 in main /app/example.cpp:6",
      "…",
      "previously allocated by thread T0 here:",
      "…",
      "    #7 0x40134f in main /app/example.cpp:4",
      "…",
      "SUMMARY: AddressSanitizer: heap-use-after-free /app/example.cpp:7 in main",
    ] },
    ubsan: { verdict: "silent", out: "203133", exit: 0 },
    tsan: { verdict: "caught", out: "1", exit: 66, line: 6, report: [
      "WARNING: ThreadSanitizer: heap-use-after-free (pid=2)",
      "  Read of size 4 at 0x720400000000 by main thread:",
      "    #0 main /app/example.cpp:7",
      "",
      "  Previous write of size 8 at 0x720400000000 by main thread:",
      "    #0 operator delete(void*, unsigned long) (libtsan.so.2+0xa49eb)",
      "…",
      "    #8 main /app/example.cpp:6",
      "",
      "SUMMARY: ThreadSanitizer: heap-use-after-free /app/example.cpp:7 in main",
    ] },
  },
  signed: {
    plain: { verdict: "silent", out: "-2147483648", exit: 0 },
    warn: { verdict: "silent", out: "-2147483648", exit: 0, report: ["(no warnings)"] },
    asan: { verdict: "silent", out: "-2147483648", exit: 0 },
    ubsan: { verdict: "caught", out: "-2147483648", exit: 0, line: 4, report: [
      "/app/example.cpp:5:11: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'",
    ] },
    tsan: { verdict: "na" },
  },
  race: {
    plain: { verdict: "silent", out: "198548", exit: 0 },
    warn: { verdict: "silent", out: "200000", exit: 0, report: ["(no warnings)"] },
    asan: { verdict: "silent", out: "162472", exit: 0 },
    ubsan: { verdict: "silent", out: "200000", exit: 0 },
    tsan: { verdict: "caught", out: "200000", exit: 66, line: 3, report: [
      "WARNING: ThreadSanitizer: data race (pid=2)",
      "  Read of size 4 at 0x00000040409c by thread T2:",
      "    #0 work() /app/example.cpp:4",
      "…",
      "  Previous write of size 4 at 0x00000040409c by thread T1:",
      "    #0 work() /app/example.cpp:4",
      "…",
      "  Location is global 'counter' of size 4 at 0x00000040409c",
      "",
      "  Thread T2 (tid=5, running) created by main thread at:",
      "    #0 pthread_create (libtsan.so.2+0x5f4a6)",
      "…",
      "    #2 main /app/example.cpp:6",
      "…",
      "SUMMARY: ThreadSanitizer: data race /app/example.cpp:4 in work()",
      "ThreadSanitizer: reported 1 warnings",
    ] },
  },
  uninit: {
    plain: { verdict: "silent", out: "32767", exit: 0 },
    warn: { verdict: "silent", out: "3", exit: 0, report: ["(no warnings)"] },
    asan: { verdict: "silent", out: "32766", exit: 0 },
    ubsan: { verdict: "silent", out: "32765", exit: 0 },
    tsan: { verdict: "silent", out: "0", exit: 0 },
  },
};

/** What to notice in each cell, in English (translated through tx). */
export const NOTES: Partial<Record<`${BugId}.${ToolId}`, string>> = {
  "overflow.plain": "It prints 100 and exits normally. hp[4] happened to hold 0, so the sum even looks right.",
  "overflow.warn": "No warning: the compiler cannot know, in general, how big a block from new is.",
  "overflow.asan": "AddressSanitizer stops at the first bad read and names the line, the size of the block (16 bytes), where it was allocated, and how far past its end the read was (0 bytes after).",
  "overflow.ubsan": "UBSan checks arithmetic and similar rules, not memory bounds of heap blocks.",
  "overflow.tsan": "ThreadSanitizer only looks at memory shared between threads and at freed memory; it does not check bounds.",
  "dangle.plain": "A different garbage number on every build: first refers to memory the vector already freed.",
  "dangle.warn": "No warning, and a different wrong number again.",
  "dangle.asan": "heap-use-after-free, with three stacks: where the read happened (line 7), where the memory was freed (inside push_back, line 6), and where it was allocated (line 4).",
  "dangle.ubsan": "Silent: this is a memory bug, not an arithmetic one.",
  "dangle.tsan": "ThreadSanitizer also tracks frees, so it catches this one too, even with a single thread.",
  "signed.plain": "INT_MAX + 1 wrapped around to the most negative int. Undefined behaviour that happens to look like wrapping.",
  "signed.warn": "No warning: the value depends on argc, known only at run time.",
  "signed.asan": "AddressSanitizer checks memory, not arithmetic.",
  "signed.ubsan": "UndefinedBehaviorSanitizer reports the exact line and column, the values and the type. By default it reports and continues, so the wrong number is still printed.",
  "signed.tsan": "One thread and no freed memory: nothing for ThreadSanitizer to look at.",
  "race.plain": "198548 instead of 200000: increments lost to the race, a different number on each run.",
  "race.warn": "200000, apparently correct: -O2 turned each loop into one addition, shrinking the race window. The bug is still there.",
  "race.asan": "162472: lost updates, and no report. AddressSanitizer does not look for races.",
  "race.ubsan": "Silent: a race is not an arithmetic error.",
  "race.tsan": "ThreadSanitizer sees the two threads touch counter with nothing ordering them, names both accesses, the variable and where each thread was created, and the program still prints its number.",
  "uninit.plain": "Whatever was on the stack: 32767 here.",
  "uninit.warn": "3, with no warning. The optimiser assumed the uninitialised read cannot happen, so lives must have been set to 3.",
  "uninit.asan": "Every tool prints a different number and none reports anything. Uninitialised reads need MemorySanitizer, which only Clang has, or Valgrind.",
  "uninit.ubsan": "Silent as well.",
  "uninit.tsan": "Silent as well: 0 this time.",
};
