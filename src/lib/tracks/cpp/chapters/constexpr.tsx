"use client";

// C++ track — "Compile-Time C++".

import { CodeBlock, Callout, H2, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

export function ConstexprContent({ t }: { t: TrackTranslations }) {
  return (
    <article className="space-y-5 text-[var(--text-muted)] leading-relaxed text-base">

      <p className="text-lg text-[var(--text-main)]">
        {tx(t, "cpp07_intro",
          "Every cycle you spend at compile time is a cycle you do not spend at 16.6 milliseconds per frame. Modern constexpr is close to a full interpreter for C++ running inside the compiler: loops, allocations, containers, and in C++26 even exceptions."
        )}
      </p>

      <H2>{tx(t, "cpp07_keywordsTitle", "constexpr, consteval, constinit")}</H2>
      <LessonTable
        headers={[tx(t, "cpp07_h0", "Keyword"), tx(t, "cpp07_h1", "Guarantees")]}
        rows={[
          ["constexpr", tx(t, "cpp07_r1", "MAY run at compile time. Falls back to runtime if the arguments are not constant.")],
          ["consteval", tx(t, "cpp07_r2", "MUST run at compile time. Calling it with a runtime value is a compile error.")],
          ["constinit", tx(t, "cpp07_r3", "Initialized at compile time, but mutable afterwards. Kills the static init order fiasco.")],
          ["if consteval", tx(t, "cpp07_r4", "Branch on whether this call is currently being evaluated at compile time (C++23).")],
        ]}
      />

      <CodeBlock lang="cpp" filename="constexpr.cpp" t={t}>{`constexpr int factorial(int n) {
    int r = 1;
    for (int i = 2; i <= n; ++i) r *= i;   // loops are fine
    return r;
}

constexpr int a = factorial(10);   // computed by the compiler, baked into the binary
int n = readInput();
int b = factorial(n);              // same function, runs at runtime

consteval int mustBeCompileTime(int x) { return x * 2; }
constexpr int c = mustBeCompileTime(21);   // ok
// int d = mustBeCompileTime(n);            // ERROR — n is not a constant`}</CodeBlock>

      <H2>{tx(t, "cpp07_tablesTitle", "Baking lookup tables into the binary")}</H2>
      <p>
        {tx(t, "cpp07_tablesBody",
          "This is the pattern that pays off in graphics code: generate the table with real C++ instead of a Python script that writes a header, and the result is a plain array of constants in the read-only data section."
        )}
      </p>

      <CodeBlock lang="cpp" filename="lut.cpp" t={t}>{`consteval std::array<float, 256> makeSinTable() {
    std::array<float, 256> table{};
    for (std::size_t i = 0; i < table.size(); ++i) {
        // std::sin is not constexpr — a Taylor series or CORDIC is
        table[i] = approxSin(2.0f * std::numbers::pi_v<float> * float(i) / 256.0f);
    }
    return table;
}

constexpr auto SIN_LUT = makeSinTable();   // zero runtime cost, zero build script

// C++20 lets you allocate during constant evaluation, as long as nothing escapes
constexpr std::size_t countPrimes(int limit) {
    std::vector<bool> sieve(limit + 1, true);     // heap alloc at compile time
    std::size_t count = 0;
    for (int i = 2; i <= limit; ++i)
        if (sieve[i]) { ++count; for (int j = i * i; j <= limit; j += i) sieve[j] = false; }
    return count;
}
static_assert(countPrimes(100) == 25);`}</CodeBlock>

      <Callout type="warn" t={t}>
        {tx(t, "cpp07_allocWarn",
          "Memory allocated during constant evaluation must be freed during constant evaluation — you cannot return a constexpr std::vector into runtime. That is why the sieve above returns a count and the LUT returns a std::array, which has no allocation."
        )}
      </Callout>

      <H2>{tx(t, "cpp07_26Title", "What C++26 adds")}</H2>
      <p>
        {tx(t, "cpp07_26Body",
          "Two changes make constexpr code look much more like ordinary code: exceptions can now be thrown and caught during constant evaluation, and static_assert can build its message at compile time instead of requiring a string literal."
        )}
      </p>

      <CodeBlock lang="cpp" filename="cpp26_constexpr.cpp" t={t}>{`// C++26: throwing inside constant evaluation is allowed
constexpr int checkedDiv(int a, int b) {
    if (b == 0) throw std::logic_error("division by zero");
    return a / b;
}
constexpr int ok = checkedDiv(10, 2);
// constexpr int bad = checkedDiv(10, 0);  // compile error, with your message

// C++26: static_assert messages can be computed
template <typename T>
struct Check {
    static_assert(sizeof(T) <= 64,
        std::format("{} is {} bytes — too large for the component pool",
                    typeName<T>(), sizeof(T)));
};`}</CodeBlock>

      <Callout type="tip" t={t}>
        {tx(t, "cpp07_costTip",
          "Compile-time work is not free — it is paid by every build instead of every frame. A constexpr sieve to a million will make your build noticeably slower. Use it for tables measured in kilobytes, not megabytes, and check the impact with -ftime-trace on Clang."
        )}
      </Callout>

    </article>
  );
}
