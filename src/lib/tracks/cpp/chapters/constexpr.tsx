"use client";

// Generic C++ 3: compile-time C++. Starts from a sine table (computed at
// start-up, pasted from a script, or computed by the compiler), then constant
// expressions and where C++ needs them, constexpr functions (figure: who runs
// factorial, the machine code, overflow refused at compile time), what the
// compiler refuses, consteval, a baked lookup table with a Taylor series,
// static_assert as tests, if consteval, constinit and the static
// initialisation order problem, allocation during constant evaluation, what
// C++26 adds, and the build-time cost.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Article, Goals, KeyIdeas, Lead } from "@/components/lesson/Prose";
import { ConstEvalFigure } from "@/components/lesson/figures/cpp/ConstEvalFigure";

export function ConstexprContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "cppCx_intro",
          "A game wants a table of 256 sine values, so it never calls std::sin inside the hot loop. There are three ways to get it. Compute it when the program starts, every single launch. Write a Python script that prints the numbers into a header, and remember to rerun it whenever the size changes. Or ask the compiler to run the loop while it compiles, and put only the finished numbers in the program. C can do the first two; its preprocessor cannot even count. C++ can do the third, with ordinary C++ code, and that is what constexpr is for.")}
      </Lead>

      <Goals t={t} id="cppCx" items={[
        "Say what a constant expression is and where C++ requires one.",
        "Write constexpr functions and predict when they run at compile time and when at run time.",
        "Choose between const, constexpr, consteval and constinit.",
        "Bake a lookup table into the program and test code with static_assert.",
      ]} />

      <H2>{tx(t, "cppCx_constTitle", "Values the compiler knows")}</H2>
      <CodeBlock lang="cpp" filename="constants.cpp" t={t}>{`const int lives = read_int();       // const: cannot change, but known only at run time
constexpr int kMaxEnemies = 64;     // constexpr: known while compiling

std::array<int, kMaxEnemies> hp{};  // ok: the size must be known while compiling
// std::array<int, lives> bad{};    // error: lives is not a constant expression`}</CodeBlock>
      <p>
        {tx(t, "cppCx_constBody",
          "A constant expression is an expression the compiler can evaluate itself, while compiling. 64 is one, kMaxEnemies is one, and kMaxEnemies * 2 is one. const only promises that a variable will not change after it is set, and it may be set from user input. constexpr promises more: the value is computed now, by the compiler. Some places in C++ only accept constant expressions:")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCx_hWhere", "Where"), tx(t, "cppCx_hEx", "Example")]}
        rows={[
          [tx(t, "cppCx_w1", "array sizes and template arguments"), "std::array<int, 64>, StaticArray<float, N>"],
          [tx(t, "cppCx_w2", "case labels in a switch"), "case kAttack:"],
          [tx(t, "cppCx_w3", "static_assert"), "static_assert(sizeof(Vertex) == 32);"],
          [tx(t, "cppCx_w4", "if constexpr"), "if constexpr (N > 16)"],
          [tx(t, "cppCx_w5", "a constexpr variable's initialiser"), "constexpr int k = …;"],
        ]}
      />

      <H2>{tx(t, "cppCx_fnTitle", "constexpr functions")}</H2>
      <CodeBlock lang="cpp" filename="factorial.cpp" t={t}>{`constexpr int factorial(int n) {
    int r = 1;
    for (int i = 2; i <= n; ++i) r *= i;
    return r;
}

constexpr int a = factorial(10);   // the compiler runs the loop: a is 3628800 in the program
int n = read_int();
int b = factorial(n);              // the same function, run by the CPU, like any other`}</CodeBlock>
      <p>
        {tx(t, "cppCx_fnBody",
          "constexpr on a function means it may be run at compile time when its arguments are constants and the result is needed as a constant. It does not mean it must: the same function works at run time too, with no change. Inside, it is ordinary C++: local variables, loops, if, even classes. Try the five lines below and look at the machine code each one produces.")}
      </p>
      <ConstEvalFigure t={t} />
      <H3>{tx(t, "cppCx_refuseTitle", "What the compiler refuses")}</H3>
      <p>
        {tx(t, "cppCx_refuseBody",
          "While evaluating a constant, the compiler acts as a careful interpreter of C++. It checks every step, and it stops on anything it cannot be sure about:")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCx_hRefused", "Refused"), tx(t, "cppCx_hWhy", "Why")]}
        rows={[
          [tx(t, "cppCx_x1k", "undefined behaviour"), tx(t, "cppCx_x1", "Signed overflow, reading past an array, dereferencing nullptr, reading an uninitialised variable. At run time these are silent bugs (the Undefined Behaviour chapter); at compile time they are errors. This alone makes static_assert tests worth writing.")],
          [tx(t, "cppCx_x2k", "calls to non-constexpr functions"), tx(t, "cppCx_x2", "The compiler can only run what it can see and is allowed to run: printing, file access and most of the C library are out. std::sin was not constexpr before C++26.")],
          [tx(t, "cppCx_x3k", "values not known yet"), tx(t, "cppCx_x3", "A variable read from input, a non-const global, a function parameter used as a constant inside the function.")],
          [tx(t, "cppCx_x4k", "too much work"), tx(t, "cppCx_x4", "Compilers cap the number of steps (GCC: -fconstexpr-ops-limit, Clang: -fconstexpr-steps) so a mistake cannot hang the build forever.")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "cppCx_paramNote",
          "A function parameter is never a constant expression inside the function, even in a constexpr function called with a constant: template <int N> can be used as an array size, but int n cannot. The function has to work for run-time calls too, where n is not known.")}
      </Callout>

      <H2>{tx(t, "cppCx_cevalTitle", "consteval: only at compile time")}</H2>
      <CodeBlock lang="cpp" filename="consteval.cpp" t={t}>{`consteval int kib(int n) { return n * 1024; }

constexpr int kBufferSize = kib(64);   // 65536, computed by the compiler
int size = kib(read_int());            // error: call to consteval function is not a constant expression`}</CodeBlock>
      <p>
        {tx(t, "cppCx_cevalAfter",
          "A consteval function (an immediate function) must produce a constant at every call; a call that cannot be evaluated while compiling is an error. Use it for helpers that only make sense for constants, such as unit conversions in table sizes, or checking a format string: std::format uses one to reject std::format(\"{:d}\", \"text\") while compiling.")}
      </p>

      <H2>{tx(t, "cppCx_lutTitle", "Baking a lookup table")}</H2>
      <CodeBlock lang="cpp" filename="sin_table.h" t={t}>{`#include <array>
#include <numbers>

constexpr double sin_approx(double x) {
    constexpr double pi = std::numbers::pi;
    while (x >  pi) x -= 2 * pi;               // bring x into [-π, π]
    while (x < -pi) x += 2 * pi;
    double term = x, sum = x;                  // first term of the series: x
    for (int k = 1; k <= 10; ++k) {
        term *= -x * x / ((2 * k) * (2 * k + 1));   // next term from the previous one
        sum += term;
    }
    return sum;
}

template <std::size_t N>
constexpr std::array<float, N> make_sin_table() {
    std::array<float, N> table{};
    for (std::size_t i = 0; i < N; ++i)
        table[i] = static_cast<float>(sin_approx(2 * std::numbers::pi * i / N));
    return table;
}

constexpr auto kSin = make_sin_table<256>();   // 1 KiB of finished floats in the program`}</CodeBlock>
      <p>
        {tx(t, "cppCx_lutTaylor",
          "sin_approx adds up the Taylor series of the sine: sin x = x − x³/3! + x⁵/5! − x⁷/7! + … Each term is the previous one times −x² / ((2k)(2k + 1)): for k = 1 that turns x into −x³/(2·3), for k = 2 it turns −x³/3! into x⁵/(3!·4·5) = x⁵/5!. The series is most accurate near 0, so x is first moved into [−π, π] by adding or removing whole turns of 2π, which does not change the sine. Ten terms give an error below 3·10⁻⁸ over the whole table, smaller than a float can even show.")}
      </p>
      <LessonTable
        headers={[tx(t, "cppCx_hLine", "Line"), tx(t, "cppCx_hMeans", "What it means")]}
        rows={[
          ["std::numbers::pi", tx(t, "cppCx_l1", "π as a constexpr double, from <numbers> (C++20). No more #define M_PI.")],
          ["2 * pi * i / N", tx(t, "cppCx_l2", "The angle of entry i: N entries cover one full turn, 2π radians.")],
          ["std::array<float, N>", tx(t, "cppCx_l3", "A fixed-size array with no heap, so it can be returned from constant evaluation and stored in the program.")],
          ["constexpr auto kSin = …", tx(t, "cppCx_l4", "Forces the whole loop to run inside the compiler. The program contains the 256 floats as read-only data, and nothing runs at start-up.")],
        ]}
      />

      <H2>{tx(t, "cppCx_saTitle", "static_assert: tests that run while compiling")}</H2>
      <CodeBlock lang="cpp" filename="tests.cpp" t={t}>{`static_assert(factorial(0) == 1);
static_assert(factorial(5) == 120);
static_assert(kSin[64] > 0.9999f && kSin[64] <= 1.0f);    // sin(π/2) = 1
static_assert(sizeof(Vertex) == 32, "Vertex must match the GPU layout");`}</CodeBlock>
      <p>
        {tx(t, "cppCx_saAfter",
          "Each line is checked by every build. If someone breaks factorial, the program does not compile, so a broken binary never exists. And since undefined behaviour is refused at compile time, a static_assert also proves that those calls have none.")}
      </p>

      <H2>{tx(t, "cppCx_ifcTitle", "if consteval: one path for each time")}</H2>
      <CodeBlock lang="cpp" filename="root.cpp" t={t}>{`#include <cmath>

constexpr double root(double x) {
    if consteval {                         // being evaluated by the compiler
        double r = x > 1 ? x : 1.0;
        for (int i = 0; i < 40; ++i) r = 0.5 * (r + x / r);   // Newton's method
        return r;
    } else {                               // running in the program
        return std::sqrt(x);               // one fast instruction, not constexpr before C++26
    }
}

constexpr double kDiag = root(2.0);        // 1.414213562373095`}</CodeBlock>
      <p>
        {tx(t, "cppCx_ifcAfter",
          "if consteval (C++23) chooses a branch by when the call happens. Here the compiler uses Newton's method, which only needs + and /: each step replaces r by the average of r and x / r, and the guess roughly doubles its number of correct digits every step. At run time the CPU's square-root instruction is used instead. The two paths can differ in the last digit, so keep them for cases where that does not matter. Older code calls std::is_constant_evaluated() for the same test.")}
      </p>

      <H2>{tx(t, "cppCx_ciTitle", "constinit: globals set before anything runs")}</H2>
      <p>
        {tx(t, "cppCx_ciBody",
          "Global variables in different .cpp files are initialised in an order the language does not specify. If a global in audio.cpp is built by reading a global from config.cpp, it may read it before it was set: the static initialisation order fiasco. A global initialised with a constant is different: its value is written into the program file, so it is ready before any code runs.")}
      </p>
      <CodeBlock lang="cpp" filename="globals.cpp" t={t}>{`constinit int g_frame = 0;                 // guaranteed set before main, and still changeable
constinit int g_limit = factorial(5);      // ok: 120, computed by the compiler
// constinit int g_seed = read_int();      // error: 'constinit' variable does not have a constant initializer

void tick() { ++g_frame; }                 // unlike constexpr, it can change`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "cppCx_hKw", "Keyword"), tx(t, "cppCx_hOn", "On"), tx(t, "cppCx_hProm", "Promises")]}
        rows={[
          ["const", tx(t, "cppCx_o1", "variable"), tx(t, "cppCx_k1", "Never changes after it is set. It may be set at run time.")],
          ["constexpr", tx(t, "cppCx_o2", "variable"), tx(t, "cppCx_k2", "Computed by the compiler, and const.")],
          ["constexpr", tx(t, "cppCx_o3", "function"), tx(t, "cppCx_k3", "May run at compile time; runs at run time otherwise.")],
          ["consteval", tx(t, "cppCx_o4", "function"), tx(t, "cppCx_k4", "Must run at compile time, at every call.")],
          ["constinit", tx(t, "cppCx_o5", "global or static variable"), tx(t, "cppCx_k5", "Initial value computed by the compiler, but the variable can change later.")],
        ]}
      />

      <H2>{tx(t, "cppCx_allocTitle", "Allocating at compile time")}</H2>
      <CodeBlock lang="cpp" filename="primes.cpp" t={t}>{`constexpr int count_primes(int limit) {
    std::vector<bool> is_prime(limit + 1, true);    // heap memory, inside the compiler
    int count = 0;
    for (int i = 2; i <= limit; ++i) {
        if (!is_prime[i]) continue;
        ++count;
        for (int j = i * i; j <= limit; j += i) is_prime[j] = false;
    }
    return count;                                   // the vector is freed here
}
static_assert(count_primes(100) == 25);

// constexpr std::vector<int> v{1, 2, 3};   // error: refers to a result of 'operator new'`}</CodeBlock>
      <p>
        {tx(t, "cppCx_allocAfter",
          "Since C++20, constant evaluation may use new and delete, so std::vector and std::string work in constexpr functions. The rule is that every allocation must be freed before the evaluation ends: compile-time heap memory cannot survive into the program, because there is no heap yet when the program file is written. So count_primes returns an int, and make_sin_table returns a std::array. The sieve here is the sieve of Eratosthenes: every number still marked prime crosses out its multiples, starting from its square.")}
      </p>

      <H2>{tx(t, "cppCx_26Title", "What C++26 adds")}</H2>
      <LessonTable
        headers={[tx(t, "cppCx_hFeat", "Feature"), tx(t, "cppCx_hGives", "What it gives")]}
        rows={[
          [tx(t, "cppCx_n1k", "exceptions in constant evaluation"), tx(t, "cppCx_n1", "A constexpr function may throw and catch. An exception that escapes becomes a compile error with your message.")],
          [tx(t, "cppCx_n2k", "constexpr <cmath>"), tx(t, "cppCx_n2", "Most of std::sin, std::sqrt, std::pow and friends become usable at compile time, so hand-written series like sin_approx are needed less.")],
          [tx(t, "cppCx_n3k", "static reflection"), tx(t, "cppCx_n3", "Constant evaluation can inspect types: list a struct's members, an enum's names. The What's New in C++26 chapter shows it.")],
        ]}
      />

      <H2>{tx(t, "cppCx_costTitle", "The cost")}</H2>
      <p>
        {tx(t, "cppCx_costBody",
          "Compile-time work is not free; it moves. Instead of every launch, every build pays, and the compiler's interpreter is much slower than the CPU running compiled code. A table of a few kilobytes costs nothing you will notice; a sieve up to ten million will slow the build down badly and may hit the step limit. Clang's -ftime-trace shows where the build time goes.")}
      </p>

      <H2>{tx(t, "cppCx_tryTitle", "Try it yourself")}</H2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "cppCx_try1", "Write constexpr int fib(int n), add static_assert tests for fib(0), fib(1) and fib(10), then find the first n whose static_assert fails to compile because of overflow.")}</li>
        <li>{tx(t, "cppCx_try2", "Compile the sine table with -S and look for kSin in the assembly file. Then change constexpr auto to const auto and compare.")}</li>
        <li>{tx(t, "cppCx_try3", "Write consteval std::uint32_t hash(std::string_view s) using FNV-1a (start at 2166136261, for each byte: xor it in, then multiply by 16777619) and use it as a case label in a switch over strings.")}</li>
        <li>{tx(t, "cppCx_try4", "Read past the end of a std::array inside a constexpr function. Call it once from static_assert and once at run time with -fsanitize=address, and compare what each reports.")}</li>
      </ol>

      <KeyIdeas t={t} id="cppCx" items={[
        "A constant expression is one the compiler evaluates itself; array sizes, template arguments and static_assert require one.",
        "constexpr on a function means it may run at compile time; whether it does depends on the call, not on the function.",
        "A constexpr variable or a consteval function forces compile time; a plain int initialised from a call does not.",
        "At compile time, undefined behaviour is an error, so static_assert tests also prove those calls are free of it.",
        "constinit gives a global a compile-time initial value without making it const, avoiding the initialisation order fiasco.",
        "Compile-time allocations must be freed before evaluation ends; return std::array, not std::vector.",
      ]} />
    </Article>
  );
}
