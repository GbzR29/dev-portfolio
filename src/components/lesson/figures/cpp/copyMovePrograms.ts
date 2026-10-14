// ── Copy and move programs for the C++ lifetime figure ────────────────────────
// Used by the values chapter (when copies happen, shallow vs deep copy) and the
// move chapter (stealing a block, the forgotten nullptr, return by value).
// Code stays in English; explanations are tx keys (figCppLife_…). Noisy is the
// class from the classes chapter, now with a copy constructor ("copy a", and
// the copy is called a') and a copy assignment ("assign a").

import type { LifeProgram } from "./lifeModel";

const copies: LifeProgram = {
  id: "copies",
  code: [
    "void show(Noisy n) {}",
    "void peek(const Noisy& n) {}",
    "int main() {",
    "    Noisy a{\"a\"};",
    "    show(a);",
    "    peek(a);",
    "    Noisy b = a;",
    "    b = a;",
    "}",
  ],
  steps: [
    { line: 2, key: "figCppLife_cw0", en: "main starts.", run: m => m.enter("main()") },
    { line: 3, key: "figCppLife_cw1", en: "a is built: + a.", run: m => m.make("a", "Noisy", { print: "+ a" }) },
    { line: 4, key: "figCppLife_cw2", en: "show takes its parameter by value, so its n must be a Noisy of its own, made from a. That is a copy: the copy constructor runs and prints copy a. The copy is named a', so you can tell it apart.", run: m => { m.enter("show()"); m.make("n", "Noisy", { print: "copy a" }); } },
    { line: 0, key: "figCppLife_cw3", en: "show's body is empty, so it ends at once and its parameter n is destroyed: - a'. The copy was made only to be thrown away.", run: m => m.kill("n", "- a'"), dtor: true },
    { line: 4, key: "figCppLife_cw4", en: "show returns to main.", run: m => m.exit() },
    { line: 5, key: "figCppLife_cw5", en: "peek takes a const reference: inside peek, n is only another name for a. No object is made and nothing is printed.", run: m => m.enter("peek()") },
    { line: 1, key: "figCppLife_cw6", en: "peek returns. There is nothing to destroy: a reference owns nothing.", run: m => m.exit() },
    { line: 6, key: "figCppLife_cw7", en: "Building a new object from an existing one is a copy, even when it is written with =. b did not exist before this line, so this is the copy constructor again, not an assignment.", run: m => m.make("b", "Noisy", { print: "copy a" }) },
    { line: 7, key: "figCppLife_cw8", en: "Now b already exists, so this = is copy assignment, a different function (operator=). It overwrites an object that is already built, instead of building a new one.", run: m => m.touch("b", "assign a") },
    { line: 8, key: "figCppLife_cw9", en: "main ends: b is destroyed…", run: m => m.kill("b", "- a'"), dtor: true },
    { line: 8, key: "figCppLife_cw10", en: "…then a. Count the output: one object you wrote, two copies made, one of them by a function call you might not have noticed.", run: m => m.kill("a", "- a"), dtor: true },
    { line: 8, key: "figCppLife_cw11", en: "main returns.", run: m => m.exit() },
  ],
};

const shallow: LifeProgram = {
  id: "shallow",
  code: [
    "struct Buf {",
    "    int* data;",
    "    Buf(int n) : data(new int[n]{}) {}",
    "    ~Buf() { delete[] data; }",
    "};  // no copy constructor written",
    "int main() {",
    "    Buf a{3};",
    "    Buf b = a;",
    "}",
  ],
  steps: [
    { line: 5, key: "figCppLife_sh0", en: "main starts.", run: m => m.enter("main()") },
    { line: 6, key: "figCppLife_sh1", en: "a's constructor allocates three ints on the heap, set to 0 by the {}. a.data holds the block's address: a owns block #1.", run: m => { m.alloc("#1", "int[3] {0, 0, 0}"); m.make("a", "Buf", { ptr: "#1" }); } },
    { line: 7, key: "figCppLife_sh2", en: "Nobody wrote a copy constructor, so the compiler wrote one: it copies each member as it is. data is a pointer, so b.data gets the same address. One block, two owners. This is a shallow copy.", run: m => m.make("b", "Buf", { ptr: "#1" }) },
    { line: 8, key: "figCppLife_sh3", en: "main ends. b is destroyed first, and its destructor frees block #1. a.data still holds the old address: a now points at freed memory, a dangling pointer.", run: m => { m.kill("b"); m.free("#1"); }, dtor: true },
    { line: 8, key: "figCppLife_sh4", en: "Then a's destructor frees the same block again: a double free. The heap's own bookkeeping is now damaged. The program may crash here, much later, or never, which is the worst case. AddressSanitizer reports it as attempting double-free.", run: m => { m.kill("a"); m.free("#1"); }, dtor: true },
    { line: 8, key: "figCppLife_sh5", en: "main returns. Switch destructors off and the opposite bug appears: nobody frees the block at all.", run: m => m.exit() },
  ],
};

const deep: LifeProgram = {
  id: "deep",
  code: [
    "struct Buf {",
    "    int n; int* data;",
    "    Buf(int n) : n(n), data(new int[n]{}) {}",
    "    Buf(const Buf& o)",
    "        : n(o.n), data(new int[o.n]) {",
    "        std::copy(o.data, o.data + n, data);",
    "    }",
    "    ~Buf() { delete[] data; }",
    "};",
    "int main() {",
    "    Buf a{3};",
    "    Buf b = a;",
    "}",
  ],
  steps: [
    { line: 9, key: "figCppLife_dp0", en: "main starts.", run: m => m.enter("main()") },
    { line: 10, key: "figCppLife_dp1", en: "a allocates block #1, as before.", run: m => { m.alloc("#1", "int[3] {0, 0, 0}"); m.make("a", "Buf", { ptr: "#1" }); } },
    { line: 11, key: "figCppLife_dp2", en: "This time Buf has a copy constructor of its own, and b = a calls it. b starts being built.", run: m => m.make("b", "Buf", { building: true }) },
    { line: 4, key: "figCppLife_dp3", en: "The initialiser list copies the size and asks for a new block of that size: b gets block #2.", run: m => { m.alloc("#2", "int[3] {?, ?, ?}"); m.point("b", "#2"); } },
    { line: 5, key: "figCppLife_dp4", en: "std::copy copies the three ints from a's block into b's. Two objects, two blocks, the same values: a deep copy. Changing b can never change a.", run: m => { m.fill("#2", "int[3] {0, 0, 0}"); m.built("b"); } },
    { line: 12, key: "figCppLife_dp5", en: "main ends. b's destructor frees its own block, #2…", run: m => { m.kill("b"); m.free("#2"); }, dtor: true },
    { line: 12, key: "figCppLife_dp6", en: "…and a's frees #1. Every block freed exactly once.", run: m => { m.kill("a"); m.free("#1"); }, dtor: true },
    { line: 12, key: "figCppLife_dp7", en: "main returns.", run: m => m.exit() },
  ],
};

const move: LifeProgram = {
  id: "move",
  code: [
    "Buf(Buf&& o) noexcept",
    "    : n(o.n), data(o.data) {",
    "    o.n = 0;",
    "    o.data = nullptr;",
    "}",
    "int main() {",
    "    Buf a{3};",
    "    Buf b = std::move(a);",
    "}",
  ],
  steps: [
    { line: 5, key: "figCppLife_mv0", en: "main starts. The first lines are Buf's move constructor; the rest of Buf is the same as in the values chapter.", run: m => m.enter("main()") },
    { line: 6, key: "figCppLife_mv1", en: "a allocates block #1.", run: m => { m.alloc("#1", "int[3] {0, 0, 0}"); m.make("a", "Buf", { ptr: "#1" }); } },
    { line: 7, key: "figCppLife_mv2", en: "std::move(a) marks a as \"may be robbed\". With that mark, the compiler picks the move constructor, Buf(Buf&&), instead of the copy constructor. b starts being built.", run: m => m.make("b", "Buf", { building: true }) },
    { line: 1, key: "figCppLife_mv3", en: "The move constructor copies only the size and the pointer: b.data now holds block #1. No new block, not one element copied. Moving a million ints costs the same as moving three.", run: m => m.point("b", "#1") },
    { line: 3, key: "figCppLife_mv4", en: "Then it empties the source: a.data = nullptr. This is the line that matters. a still exists and will still be destroyed, so it must not keep the address.", run: m => { m.point("a", undefined, "nullptr, n = 0"); m.built("b"); } },
    { line: 8, key: "figCppLife_mv5", en: "main ends. b's destructor frees block #1.", run: m => { m.kill("b"); m.free("#1"); }, dtor: true },
    { line: 8, key: "figCppLife_mv6", en: "a's destructor runs too, and calls delete[] on nullptr, which by definition does nothing. One block, one free.", run: m => m.kill("a"), dtor: true },
    { line: 8, key: "figCppLife_mv7", en: "main returns.", run: m => m.exit() },
  ],
};

const forgot: LifeProgram = {
  id: "forgot",
  code: [
    "Buf(Buf&& o) noexcept",
    "    : n(o.n), data(o.data) {",
    "    // forgot: o.data = nullptr;",
    "}",
    "int main() {",
    "    Buf a{3};",
    "    Buf b = std::move(a);",
    "}",
  ],
  steps: [
    { line: 4, key: "figCppLife_mf0", en: "The same program, with a move constructor that forgets to empty its source.", run: m => m.enter("main()") },
    { line: 5, key: "figCppLife_mf1", en: "a allocates block #1.", run: m => { m.alloc("#1", "int[3] {0, 0, 0}"); m.make("a", "Buf", { ptr: "#1" }); } },
    { line: 1, key: "figCppLife_mf2", en: "b takes the pointer, but a keeps it as well. Two objects own block #1: this is the shallow copy again, under a different name.", run: m => m.make("b", "Buf", { ptr: "#1" }) },
    { line: 7, key: "figCppLife_mf3", en: "b's destructor frees block #1, and a is left dangling…", run: m => { m.kill("b"); m.free("#1"); }, dtor: true },
    { line: 7, key: "figCppLife_mf4", en: "…and a's destructor frees it again: double free. A move must always leave its source in a state its destructor can handle.", run: m => { m.kill("a"); m.free("#1"); }, dtor: true },
    { line: 7, key: "figCppLife_mf5", en: "main returns.", run: m => m.exit() },
  ],
};

const ret: LifeProgram = {
  id: "ret",
  code: [
    "Buf make_buf() {",
    "    Buf r{1000};",
    "    r.data[0] = 42;",
    "    return r;",
    "}",
    "int main() {",
    "    Buf x = make_buf();",
    "}",
  ],
  steps: [
    { line: 5, key: "figCppLife_rv0", en: "main starts. In this program Buf prints + Buf when built, copy or move when copied or moved, and - Buf when destroyed.", run: m => m.enter("main()") },
    { line: 6, key: "figCppLife_rv1", en: "x will hold make_buf's result, so its space is already set aside in main. The compiler quietly passes make_buf the address of that space.", run: m => m.enter("make_buf()") },
    { line: 1, key: "figCppLife_rv2", en: "r is built straight in that space, which is why it is drawn in main's box. This is called the named return value optimisation (NRVO).", run: m => { m.alloc("#1", "int[1000]"); m.make("r", "Buf", { ptr: "#1", scope: 0, print: "+ Buf" }); } },
    { line: 2, key: "figCppLife_rv3", en: "make_buf uses r as usual.", run: m => { m.fill("#1", "int[1000] {42, 0, …}"); m.touch("r"); } },
    { line: 3, key: "figCppLife_rv4", en: "return r: r is already where x must be. Nothing to copy and nothing to move: the output has no copy or move line." },
    { line: 4, key: "figCppLife_rv5", en: "make_buf's scope ends, but r is not destroyed. It simply is x now.", run: m => { m.exit(); m.rename("r", "x"); } },
    { line: 7, key: "figCppLife_rv6", en: "main ends and x is destroyed. One + Buf, one - Buf: the object was built once, in its final place.", run: m => { m.kill("x", "- Buf"); m.free("#1"); }, dtor: true },
    { line: 7, key: "figCppLife_rv7", en: "main returns.", run: m => m.exit() },
  ],
};

const retMove: LifeProgram = {
  id: "retMove",
  code: [
    "Buf make_buf() {",
    "    Buf r{1000};",
    "    r.data[0] = 42;",
    "    return std::move(r);   // \"helping\"",
    "}",
    "int main() {",
    "    Buf x = make_buf();",
    "}",
  ],
  steps: [
    { line: 5, key: "figCppLife_rm0", en: "The same program, with std::move added to the return.", run: m => m.enter("main()") },
    { line: 6, key: "figCppLife_rm1", en: "main calls make_buf.", run: m => m.enter("make_buf()") },
    { line: 1, key: "figCppLife_rm2", en: "std::move(r) is not the name of a local variable, so the compiler may no longer build r in x's place. r is built in make_buf's own frame.", run: m => { m.alloc("#1", "int[1000]"); m.make("r", "Buf", { ptr: "#1", print: "+ Buf" }); } },
    { line: 2, key: "figCppLife_rm3", en: "make_buf uses r.", run: m => { m.fill("#1", "int[1000] {42, 0, …}"); m.touch("r"); } },
    { line: 3, key: "figCppLife_rm4", en: "return std::move(r) builds x from r with the move constructor: cheap, but a step that was not needed before.", run: m => { m.make("x", "Buf", { ptr: "#1", scope: 0, print: "move" }); m.point("r", undefined, "nullptr"); } },
    { line: 4, key: "figCppLife_rm5", en: "Then the emptied r is destroyed at the end of make_buf: one more destructor call.", run: m => m.kill("r", "- Buf"), dtor: true },
    { line: 4, key: "figCppLife_rm6", en: "make_buf returns.", run: m => m.exit() },
    { line: 7, key: "figCppLife_rm7", en: "main ends and x frees the block. Compare the output with return r: one move and one destructor more, for nothing. Compilers warn about it (-Wpessimizing-move).", run: m => { m.kill("x", "- Buf"); m.free("#1"); }, dtor: true },
    { line: 7, key: "figCppLife_rm8", en: "main returns.", run: m => m.exit() },
  ],
};

export const COPY_MOVE_PROGRAMS = { copies, shallow, deep, move, forgot, ret, retMove } as const;
