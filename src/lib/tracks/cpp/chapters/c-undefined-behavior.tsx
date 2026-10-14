"use client";

// C Foundations 6: undefined behaviour — defined, implementation-defined,
// unspecified and undefined; why C has UB; signed overflow vs unsigned
// wrap-around (two's complement, the wheel), overflow checks that work and
// ones the optimiser deletes, ckd_add; out-of-bounds writes; a catalogue of
// common UB; how optimisers exploit it (the deleted NULL check); defences:
// warnings, UBSan/ASan, -fwrapv, tests.

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { MemoryBoxFigure } from "@/components/lesson/figures/c/MemoryBoxFigure";
import { IntWheelFigure } from "@/components/lesson/figures/c/IntWheelFigure";

export function CUndefinedBehaviorContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cUb_intro",
          "The C standard is a contract between you and the compiler. You promise never to do certain things: read past the end of an array, overflow a signed integer, use freed memory. In return the compiler produces fast code without checking for them. If you break the promise, the standard says nothing at all about what happens next. That is undefined behaviour, often shortened to UB. It is not a crash or an error message. It is the absence of any rule, and modern optimisers use that absence in ways that surprise even experienced programmers.")}
      </Lead>

      <Goals t={t} id="cUb" items={[
        "Tell undefined behaviour from implementation-defined and unspecified behaviour.",
        "Explain why signed overflow is undefined and unsigned overflow is not, and check for overflow correctly.",
        "Recognise the common kinds of UB in code.",
        "Explain how an optimiser can delete code because of UB.",
        "Catch UB with warnings and the sanitizers.",
      ]} />

      <H2>{tx(t, "cUb_kindsTitle", "Four levels of \"it depends\"")}</H2>
      <LessonTable
        headers={[tx(t, "cUb_hKind", "Kind"), tx(t, "cUb_hMeans", "Meaning"), tx(t, "cUb_hEx", "Example")]}
        rows={[
          [tx(t, "cUb_k1", "Defined"), tx(t, "cUb_k1m", "the standard says exactly what happens"), tx(t, "cUb_k1e", "unsigned arithmetic wraps modulo 2ⁿ")],
          [tx(t, "cUb_k2", "Implementation-defined"), tx(t, "cUb_k2m", "each compiler chooses, and must document its choice"), tx(t, "cUb_k2e", "the size of int; whether char is signed")],
          [tx(t, "cUb_k3", "Unspecified"), tx(t, "cUb_k3m", "one of a few outcomes, not documented, may change"), tx(t, "cUb_k3e", "the order in which f(a(), b()) calls a and b")],
          [tx(t, "cUb_k4", "Undefined"), tx(t, "cUb_k4m", "no requirement at all, for the whole program"), tx(t, "cUb_k4e", "signed overflow, out-of-bounds access, use after free")],
        ]}
      />
      <p>
        {tx(t, "cUb_whyBody",
          "Why would a language leave holes like these? For speed and portability, the two goals C was built for. Checking every array index costs time. Machines in the 1970s disagreed on what an overflowing addition should do, so the standard refused to pick one. And because the compiler may assume UB never happens, it can reason that a loop counter never wraps around, or that a pointer that was just dereferenced is not NULL, and generate tighter code from that.")}
      </p>

      <H2>{tx(t, "cUb_intTitle", "Integer overflow")}</H2>
      <p>
        {tx(t, "cUb_intBody",
          "An int holds 32 bits, so it has a largest value, INT_MAX = 2 147 483 647. Negative numbers are stored in two's complement: the top bit counts as a large negative weight, which makes the same adding circuit work for both signs. The wheel below shrinks this to 8 bits. Turn it until you cross the end of the range, first unsigned, then signed.")}
      </p>
      <IntWheelFigure t={t} />
      <p>
        {tx(t, "cUb_optBody",
          "The rule for signed types has a surprising consequence. An overflow check that relies on the overflow happening asks the compiler about something it may assume is impossible, so it may answer \"never\" and delete the check. Test before the operation instead, or use the checked arithmetic of C23.")}
      </p>
      <CodeBlock lang="c" filename="overflow.c" t={t}>{`#include <limits.h>
#include <stdckdint.h>          // C23

int will_overflow_bad(int x) {
    return x + 1 < x;           // gcc -O2 compiles this to "return 0"
}

int will_overflow_ok(int x) {
    return x == INT_MAX;        // test BEFORE adding: no overflow happens
}

int add_checked(int a, int b, int *out) {
    return ckd_add(out, a, b);  // C23: true if the exact sum did not fit
}

unsigned hash = 2166136261u;
hash = (hash ^ 'a') * 16777619u;   // unsigned: wrapping is defined, and wanted here`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "cUb_otherIntNote",
          "Other integer traps of the same family: dividing by zero, INT_MIN / -1 (the answer does not fit), and shifting by a negative amount or by at least the width of the type (1 << 32 for a 32-bit int). All are undefined.")}
      </Callout>

      <H2>{tx(t, "cUb_oobTitle", "Out of bounds")}</H2>
      <p>
        {tx(t, "cUb_oobBody",
          "C does not check array indices. An index one too far simply computes an address, and whatever lives there gets read or overwritten. Step through this off-by-one loop: the test i <= 3 should have been i < 3.")}
      </p>
      <MemoryBoxFigure t={t} programs={["overflow"]} />

      <H2>{tx(t, "cUb_listTitle", "The usual suspects")}</H2>
      <LessonTable
        headers={[tx(t, "cUb_hUb", "Undefined behaviour"), tx(t, "cUb_hLooks", "What it looks like")]}
        rows={[
          [tx(t, "cUb_u1", "reading an uninitialised local"), "int x; printf(\"%d\", x);"],
          [tx(t, "cUb_u2", "dereferencing NULL or a dangling pointer"), "free(p); p->hp = 0;"],
          [tx(t, "cUb_u3", "index out of bounds"), "int a[3]; a[3] = 0;"],
          [tx(t, "cUb_u4", "signed overflow, division by zero, bad shifts"), "INT_MAX + 1;  x / 0;  1 << 40;"],
          [tx(t, "cUb_u5", "modifying a string literal"), "char *s = \"hi\"; s[0] = 'H';"],
          [tx(t, "cUb_u6", "changing a variable twice without a sequence point"), "i = i++ + 1;"],
          [tx(t, "cUb_u7", "reading memory through a pointer of an unrelated type"), "float f = 1; int bits = *(int *)&f;"],
          [tx(t, "cUb_u8", "using the result of a function that fell off its end"), "int f(void) { }   …   x = f();"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "cUb_punTip",
          "To look at the bits of a float, copy them instead of casting the pointer: memcpy(&bits, &f, sizeof bits); is defined, and compilers turn it into a single instruction.")}
      </Callout>

      <H2>{tx(t, "cUb_exploitTitle", "When the optimiser takes you at your word")}</H2>
      <p>
        {tx(t, "cUb_exploitBody",
          "Here is the pattern that turned a bug into a security hole in the Linux kernel in 2009. The function reads through p before it checks p. Reading through NULL is undefined, so the compiler concludes that p cannot be NULL at the check, and removes the check as dead code. The program you wrote had a safety net; the program you run does not.")}
      </p>
      <CodeBlock lang="c" filename="nullcheck.c" t={t}>{`int first_hp(Player *p) {
    int hp = p->hp;          // reads through p: UB if p is NULL...
    if (p == NULL)           // ...so the compiler may assume p != NULL here
        return -1;           // and delete these two lines
    return hp;
}

// Fixed: check first, then use
int first_hp_ok(Player *p) {
    if (p == NULL) return -1;
    return p->hp;
}`}</CodeBlock>

      <H2>{tx(t, "cUb_defTitle", "Defences")}</H2>
      <p>
        {tx(t, "cUb_defBody",
          "You cannot see UB by testing alone: the program may behave perfectly until a new compiler version or a new optimisation level. What works is to let tools look for it on every run.")}
      </p>
      <LessonTable
        headers={[tx(t, "cUb_hTool", "Tool"), tx(t, "cUb_hFinds", "What it finds")]}
        rows={[
          ["-Wall -Wextra", tx(t, "cUb_t1", "uninitialised variables, missing returns, suspicious conversions, wrong printf formats: the cases visible while compiling")],
          ["-fsanitize=undefined", tx(t, "cUb_t2", "UBSan: signed overflow, bad shifts, division by zero, misaligned or NULL access, at run time, with the line number")],
          ["-fsanitize=address", tx(t, "cUb_t3", "ASan: out-of-bounds, use after free, double free, leaks")],
          ["-fwrapv", tx(t, "cUb_t4", "makes signed overflow wrap like unsigned: removes one class of UB, at a small cost in optimisation")],
          [tx(t, "cUb_t5n", "static analysers"), tx(t, "cUb_t5", "clang --analyze, cppcheck: follow paths through the code without running it")],
        ]}
      />
      <CodeBlock lang="bash" filename="ubsan.sh" t={t}>{`gcc -g -fsanitize=address,undefined overflow.c -o overflow && ./overflow
# overflow.c:7:14: runtime error: signed integer overflow:
#   2147483647 + 1 cannot be represented in type 'int'`}</CodeBlock>
      <Callout type="warn" t={t}>
        {tx(t, "cUb_ruleWarn",
          "\"It works on my machine\" proves nothing for code with UB. Build every debug and test configuration with -fsanitize=address,undefined; the Tooling chapter shows how to put that in CMake and in continuous integration.")}
      </Callout>

      <H2>{tx(t, "cUb_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cUb_try1", "Compile will_overflow_bad with -O0 and with -O2 on Compiler Explorer and compare the assembly.")}</li>
        <li>{tx(t, "cUb_try2", "Write a loop with i <= n over an array of n elements. Run it with and without -fsanitize=address.")}</li>
        <li>{tx(t, "cUb_try3", "Write int safe_mul(int a, int b, int *out) that returns 0 instead of overflowing, first with comparisons against INT_MAX, then with ckd_mul.")}</li>
      </ol>

      <KeyIdeas t={t} id="cUb" items={[
        "Undefined behaviour means the standard sets no rule at all, for the whole program, not just one line.",
        "C has UB for speed: no run-time checks, and freedom for the optimiser.",
        "Unsigned arithmetic wraps by definition; signed overflow is undefined. Check before the operation, or use ckd_add.",
        "The compiler may assume UB never happens, and delete checks that only make sense if it did.",
        "Build and test with -Wall -Wextra and -fsanitize=address,undefined; passing tests alone prove nothing.",
      ]} />
    </Article>
  );
}
