"use client";

// Foundations 2: complexity — what an algorithm is; counting steps in the RAM
// model (findMax line by line, best and worst case); why growth matters more
// than constants; Big-O, Big-Ω and Big-Θ with c and n₀ worked by hand; the
// simplification rules and the growth hierarchy; analysing loops (nested,
// triangular, halving, geometric); best/worst/average case of linear search;
// space complexity; amortised cost (preview); the doubling experiment;
// worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { GrowthFigure } from "@/components/lesson/figures/algo/GrowthFigure";
import { LoopCountFigure } from "@/components/lesson/figures/algo/LoopCountFigure";

const r = String.raw;

export function ComplexityContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alCx_intro",
          "Two programs can give the same answer and still differ enormously: one finishes in a millisecond, the other would need longer than the age of the universe. The difference is rarely the programming language or the machine; it is how the amount of work grows as the input grows. This chapter builds the tool used to talk about that growth, Big-O notation, from the ground up: first counting the steps of a small algorithm by hand, then seeing why only the fastest-growing part of the count matters, then the formal definition, the rules for applying it to loops, and a way to check an analysis with a stopwatch.")}
      </Lead>

      <H2>{tx(t, "alCx_algoTitle", "What an algorithm is")}</H2>
      <p>
        {tx(t, "alCx_algoBody",
          "An algorithm is a finite list of precise steps that takes an input and produces the correct output, and always stops. Each word matters. Precise: every step is unambiguous, so a machine (or a patient person) can follow it without judgement. Correct: it gives the right answer for every valid input, not only for the examples you tried. Stops: it finishes after a finite number of steps. A recipe that says \"add salt to taste\" is not an algorithm; \"look at each number in turn and remember the largest seen so far\" is.")}
      </p>
      <CodeBlock lang="cpp" filename="find_max.cpp" t={t}>{`// The largest of the n numbers a[0], …, a[n − 1]. Requires n ≥ 1.
int findMax(const int* a, int n) {
    int best = a[0];                 // the largest seen so far
    for (int i = 1; i < n; ++i)
        if (a[i] > best)
            best = a[i];
    return best;
}`}</CodeBlock>
      <p>
        {tx(t, "alCx_correctBody",
          "Why is it correct? Because of a statement that stays true at the start of every pass of the loop: best is the largest of a[0] … a[i − 1]. Before the first pass (i = 1) it holds, since best = a[0]. Each pass compares a[i] with best and keeps the larger, so after it best is the largest of a[0] … a[i], and the statement holds again for the next i. When the loop ends, i = n and best is the largest of all n numbers. A statement like this is called a loop invariant; it is the standard way to convince yourself that a loop does what it should.")}
      </p>

      <H2>{tx(t, "alCx_countTitle", "Counting steps instead of seconds")}</H2>
      <p>
        {tx(t, "alCx_countBody",
          "Timing a program with a stopwatch tells you about that program on that machine with that input, on that day. To compare algorithms themselves we count steps instead. The usual model, called the RAM model, charges one unit for each basic operation: reading or writing a variable, reading an array element (constant cost, as the previous chapter showed), one arithmetic operation, one comparison, one jump. Let us count findMax, line by line, for an array of n numbers.")}
      </p>
      <LessonTable
        headers={[tx(t, "alCx_tLine", "Line"), tx(t, "alCx_tTimes", "How many times it runs"), tx(t, "alCx_tWhy", "Why")]}
        rows={[
          ["best = a[0]", "1", tx(t, "alCx_c1", "once, before the loop")],
          ["i = 1", "1", tx(t, "alCx_c2", "the loop's initialisation runs once")],
          ["i < n", "n", tx(t, "alCx_c3", "tested for i = 1, 2, …, n − 1 (true) and once more for i = n (false): n − 1 + 1 = n")],
          ["++i", "n − 1", tx(t, "alCx_c4", "once at the end of each of the n − 1 passes")],
          ["a[i] > best", "n − 1", tx(t, "alCx_c5", "once per pass")],
          ["best = a[i]", tx(t, "alCx_c6n", "0 to n − 1"), tx(t, "alCx_c6", "only when a new largest value appears")],
          ["return best", "1", tx(t, "alCx_c7", "once")],
        ]}
      />
      <p>
        {tx(t, "alCx_countSum",
          "Adding the always-run lines: 1 + 1 + n + (n − 1) + (n − 1) + 1 = 3n + 1. The assignment best = a[i] adds between 0 and n − 1 more. The best case is an array whose first element is the largest: no assignment in the loop, T(n) = 3n + 1. The worst case is an increasing array, where every element is a new maximum: T(n) = 3n + 1 + (n − 1) = 4n. Notice two things. The exact numbers depend on details we chose (should the comparison and the jump that follows it count as one step or two?). But whatever we choose, the count is some constant times n plus a constant: doubling the input doubles the work. That proportionality is what survives every change of detail, and it is what Big-O captures.")}
      </p>

      <H2>{tx(t, "alCx_growthTitle", "Growth matters more than constants")}</H2>
      <p>
        {tx(t, "alCx_growthBody",
          "Here are the counts that appear again and again in this track, for three input sizes. log n means log₂ n, the number of times n can be halved before reaching 1 (see the Exponents & Logarithms chapter of the Math track).")}
      </p>
      <LessonTable
        headers={["n", "log n", "n", "n log n", "n²", "2ⁿ"]}
        rows={[
          ["10", "3.3", "10", "33", "100", "1 024"],
          ["1 000", "10", "1 000", "10 000", "1 000 000", "≈ 10³⁰¹"],
          ["1 000 000", "20", "1 000 000", "2 · 10⁷", "10¹²", "≈ 10³⁰¹ ⁰³⁰"],
        ]}
      />
      <p>
        {tx(t, "alCx_growthTime",
          "At a billion steps per second, n = 1 000 000 takes 20 nanoseconds with a logarithmic algorithm, 1 millisecond with a linear one, 20 milliseconds with n log n, and 10¹² / 10⁹ = 1000 seconds, about 17 minutes, with a quadratic one. The exponential one never finishes. Compare this with buying a faster computer. A machine 1000 times faster runs a quadratic algorithm on inputs only √1000 ≈ 32 times larger in the same time, because (32n)² ≈ 1000 n². A better algorithm beats better hardware as soon as the input is large.")}
      </p>

      <GrowthFigure t={t} />

      <H2>{tx(t, "alCx_bigOTitle", "Big-O: the formal definition")}</H2>
      <p>
        {tx(t, "alCx_bigOBody",
          "We want to say \"f grows no faster than g\" while ignoring constant factors and small inputs. Big-O says exactly that, and nothing more.")}
      </p>
      <Equation label={tx(t, "alCx_eqO", "Big-O (upper bound)")}
        where={[
          [r`f(n)`, tx(t, "alCx_wF", "the function we are describing, usually a step count such as 3n + 1")],
          [r`g(n)`, tx(t, "alCx_wG", "a simple comparison function such as n, n² or log n")],
          [r`c`, tx(t, "alCx_wC", "a positive constant we are allowed to multiply g by; it absorbs constant factors")],
          [r`n_0`, tx(t, "alCx_wN0", "a threshold: the inequality only has to hold from this input size on, so small inputs do not count")],
          [r`\exists`, tx(t, "alCx_wExists", "\"there exist\": it is enough to find one pair c, n₀ that works")],
        ]}
        note={tx(t, "alCx_eqONote", "Read f(n) = O(g(n)) as \"f is at most a constant times g, for large enough n\". The = sign is a tradition, not an equation: it means \"belongs to the family of functions bounded by g\".")}>
        {r`f(n) = O(g(n)) \iff \exists\, c > 0,\ n_0 \ \text{such that}\ 0 \le f(n) \le c\, g(n) \ \text{for all}\ n \ge n_0`}
      </Equation>
      <p>
        {tx(t, "alCx_bigOWorked",
          "Worked example: show that f(n) = 3n² + 5n + 2 is O(n²). We need c and n₀. Try c = 4: we want 3n² + 5n + 2 ≤ 4n², that is n² − 5n − 2 ≥ 0. The roots of n² − 5n − 2 are (5 ± √33)/2, about −0.37 and 5.37, and the parabola is positive outside them, so the inequality holds for every n ≥ 6. Check at n = 6: 3 · 36 + 30 + 2 = 140 ≤ 4 · 36 = 144. So c = 4, n₀ = 6 works. A lazier choice also works: for n ≥ 1 we have 5n ≤ 5n² and 2 ≤ 2n², so 3n² + 5n + 2 ≤ 3n² + 5n² + 2n² = 10n², giving c = 10, n₀ = 1. Any valid pair proves the claim; they need not be the smallest.")}
      </p>
      <p>
        {tx(t, "alCx_notOBody",
          "And a negative example: n² is not O(n). Suppose it were: then n² ≤ c · n for all n ≥ n₀. Dividing both sides by n (positive) gives n ≤ c for all n ≥ n₀, which fails as soon as n is bigger than both c and n₀. No constant can hold a faster-growing function down.")}
      </p>
      <H3>{tx(t, "alCx_thetaTitle", "Lower bounds and tight bounds: Ω and Θ")}</H3>
      <p>
        {tx(t, "alCx_thetaBody",
          "Big-O is only an upper bound: findMax is O(n), but it is also O(n²) and O(2ⁿ), since those are larger still. Two companion notations complete the picture. Big-Omega flips the inequality: f(n) = Ω(g(n)) if f(n) ≥ c · g(n) for some c > 0 and all n ≥ n₀, so f grows at least as fast as g. Big-Theta means both at once: f(n) = Θ(g(n)) if there are constants c₁, c₂ > 0 with c₁ g(n) ≤ f(n) ≤ c₂ g(n) for all n ≥ n₀, so f grows exactly like g, up to constant factors.")}
      </p>
      <Equation label={tx(t, "alCx_eqTheta", "Big-Θ (tight bound)")}
        where={[
          [r`c_1, c_2`, tx(t, "alCx_wC12", "two positive constants: g scaled by c₁ stays below f, g scaled by c₂ stays above it")],
          [r`n_0`, tx(t, "alCx_wN0b", "the input size from which both inequalities hold")],
        ]}
        note={tx(t, "alCx_eqThetaNote", "findMax does 3n + 1 to 4n steps. For n ≥ 1, 3n ≤ 3n + 1 and 4n ≤ 4n, so 3 · n ≤ T(n) ≤ 4 · n: T(n) = Θ(n) with c₁ = 3, c₂ = 4, n₀ = 1. In everyday speech people say \"O(n)\" when they mean Θ(n); this track does the same when the tight bound is obvious.")}>
        {r`f(n) = \Theta(g(n)) \iff \exists\, c_1, c_2 > 0,\ n_0 \ \text{such that}\ c_1\, g(n) \le f(n) \le c_2\, g(n) \ \text{for all}\ n \ge n_0`}
      </Equation>
      <LessonTable
        headers={[tx(t, "alCx_tNot", "Notation"), tx(t, "alCx_tRead", "Read as"), tx(t, "alCx_tLike", "Like")]}
        rows={[
          ["f = O(g)", tx(t, "alCx_n1", "f grows no faster than g"), "≤"],
          ["f = Ω(g)", tx(t, "alCx_n2", "f grows at least as fast as g"), "≥"],
          ["f = Θ(g)", tx(t, "alCx_n3", "f grows like g"), "="],
        ]}
      />

      <H2>{tx(t, "alCx_rulesTitle", "The rules that make Big-O quick")}</H2>
      <p>
        {tx(t, "alCx_rulesBody",
          "Nobody proves c and n₀ every time. The definition gives a handful of rules, each easy to check with it, and those rules are what you actually use:")}
      </p>
      <LessonTable
        headers={[tx(t, "alCx_tRule", "Rule"), tx(t, "alCx_tExample", "Example"), tx(t, "alCx_tReason", "Reason")]}
        rows={[
          [tx(t, "alCx_r1", "Drop constant factors"), "5n → O(n)", tx(t, "alCx_r1b", "c absorbs the 5")],
          [tx(t, "alCx_r2", "Keep only the fastest-growing term"), "n² + 100n + 7 → O(n²)", tx(t, "alCx_r2b", "for n ≥ 1 the smaller terms are at most a constant times n²")],
          [tx(t, "alCx_r3", "Sequence: add, then keep the larger"), tx(t, "alCx_r3e", "O(n) loop then O(n²) loop → O(n²)"), "f + g ≤ 2 · max(f, g)"],
          [tx(t, "alCx_r4", "Nesting: multiply"), tx(t, "alCx_r4e", "n passes of O(log n) work → O(n log n)"), tx(t, "alCx_r4b", "each of the outer passes pays the inner cost")],
          [tx(t, "alCx_r5", "The base of a logarithm does not matter"), "log₁₀ n = O(log₂ n)", tx(t, "alCx_r5b", "log_a n = log_b n / log_b a, a constant factor")],
          [tx(t, "alCx_r6", "Separate inputs keep separate letters"), tx(t, "alCx_r6e", "loop over n items inside a loop over m items → O(n · m)"), tx(t, "alCx_r6b", "n and m can be unrelated; writing O(n²) would be wrong")],
        ]}
      />
      <p>
        {tx(t, "alCx_hierBody",
          "Every common cost fits somewhere in this chain, where each function eventually leaves the one before it behind by any constant factor you like:")}
      </p>
      <Equation label={tx(t, "alCx_eqHier", "The growth hierarchy")}
        where={[
          [r`1`, tx(t, "alCx_h1", "constant: the same work whatever n is (array indexing)")],
          [r`\log n`, tx(t, "alCx_h2", "logarithmic: repeated halving (binary search, balanced trees)")],
          [r`n`, tx(t, "alCx_h3", "linear: look at each item a fixed number of times")],
          [r`n \log n`, tx(t, "alCx_h4", "linearithmic: the best general sorting algorithms")],
          [r`n^2,\ n^3`, tx(t, "alCx_h5", "polynomial: every pair, every triple")],
          [r`2^n,\ n!`, tx(t, "alCx_h6", "exponential and factorial: every subset, every ordering (counting chapter of the Math track)")],
        ]}>
        {r`1 \;<\; \log n \;<\; \sqrt{n} \;<\; n \;<\; n \log n \;<\; n^2 \;<\; n^3 \;<\; 2^n \;<\; n!`}
      </Equation>

      <H2>{tx(t, "alCx_loopsTitle", "Analysing loops")}</H2>
      <p>
        {tx(t, "alCx_loopsBody",
          "Most of the work of an algorithm happens in loops, so most analysis is counting how often the innermost line runs. The figure shows five common shapes as grids of cells, one cell per run of the loop body.")}
      </p>

      <LoopCountFigure t={t} />

      <H3>{tx(t, "alCx_triTitle", "The triangle: every pair once")}</H3>
      <p>
        {tx(t, "alCx_triBody",
          "When the inner loop starts at j = i + 1, pass i of the outer loop runs the inner body n − 1 − i times. Over all passes that is (n − 1) + (n − 2) + … + 1 + 0. Write the sum forwards and backwards and add the two copies term by term: every column adds to n − 1, and there are n columns, so twice the sum is n(n − 1). The sum is n(n − 1)/2 (the arithmetic series of the Sequences & Series chapter in the Math track). For n = 1000 that is 499 500 pairs. It is about half of n², and still Θ(n²).")}
      </p>
      <Equation label={tx(t, "alCx_eqTri", "Pairs counted by a triangular loop")}
        where={[
          [r`i`, tx(t, "alCx_wTi", "the outer loop's counter, from 0 to n − 1")],
          [r`n - 1 - i`, tx(t, "alCx_wTj", "how many j satisfy i + 1 ≤ j ≤ n − 1")],
        ]}>
        {r`\sum_{i=0}^{n-1} (n - 1 - i) = (n-1) + (n-2) + \dots + 0 = \frac{n(n-1)}{2}`}
      </Equation>
      <H3>{tx(t, "alCx_halveTitle", "Halving: the logarithm")}</H3>
      <p>
        {tx(t, "alCx_halveBody",
          "A loop that starts at n and halves its counter each pass sees n, n/2, n/4, …, n/2ᵏ after k passes. It stops once n/2ᵏ ≤ 1, that is 2ᵏ ≥ n, that is k ≥ log₂ n. So it makes about log₂ n passes. For n = 1 000 000: 2²⁰ = 1 048 576 is the first power of two above a million, so 20 passes. Doubling n adds a single pass. Whenever an algorithm throws away a constant fraction of the remaining work at each step, a logarithm appears.")}
      </p>
      <H3>{tx(t, "alCx_hiddenTitle", "Hidden loops")}</H3>
      <p>
        {tx(t, "alCx_hiddenBody",
          "A line of code is not always one step. A function call costs whatever that function does. In the example below, strlen walks the whole string to find its end, and the loop condition calls it on every pass: n passes times n characters is O(n²) for what looks like a simple loop. Computing the length once before the loop makes it O(n). Removing the first element of an array has the same trap: every remaining element must shift one place left, which is O(n), so doing it inside a loop is quadratic.")}
      </p>
      <CodeBlock lang="cpp" filename="hidden.cpp" t={t}>{`#include <cstring>

int countSpacesSlow(const char* s) {           // O(n²)
    int spaces = 0;
    for (size_t i = 0; i < std::strlen(s); ++i) // strlen is itself a loop over s
        if (s[i] == ' ') ++spaces;
    return spaces;
}

int countSpaces(const char* s) {               // O(n)
    int spaces = 0;
    const size_t n = std::strlen(s);           // once
    for (size_t i = 0; i < n; ++i)
        if (s[i] == ' ') ++spaces;
    return spaces;
}`}</CodeBlock>

      <H2>{tx(t, "alCx_casesTitle", "Best, worst and average case")}</H2>
      <p>
        {tx(t, "alCx_casesBody",
          "The same algorithm can take different numbers of steps on inputs of the same size. Linear search looks for a value by checking each element in turn:")}
      </p>
      <CodeBlock lang="cpp" filename="linear_search.cpp" t={t}>{`// Index of the first element equal to x, or −1 if there is none.
int linearSearch(const int* a, int n, int x) {
    for (int i = 0; i < n; ++i)
        if (a[i] == x) return i;
    return -1;
}`}</CodeBlock>
      <p>
        {tx(t, "alCx_casesCount",
          "Count the comparisons a[i] == x. Best case: x is the first element, 1 comparison. Worst case: x is last or absent, n comparisons. Average case: suppose x is present and equally likely to be at each of the n positions. Finding it at position k (counting from 1) costs k comparisons, so the average is (1 + 2 + … + n)/n = (n(n + 1)/2)/n = (n + 1)/2. This is an expected value (see the Expectation & Variance chapter of the Math track), and it depends on an assumption about the inputs. The worst case needs no assumption: it is a promise that holds for every input, which is why it is the one usually quoted. Linear search is Θ(n) in the worst and average case, Θ(1) in the best.")}
      </p>

      <H2>{tx(t, "alCx_spaceTitle", "Space complexity")}</H2>
      <p>
        {tx(t, "alCx_spaceBody",
          "The same notation measures memory. Space complexity usually counts the extra memory an algorithm needs beyond its input. findMax needs one variable whatever n is: O(1) extra space. Building a reversed copy of the array needs n new elements: O(n). Algorithms that work inside the input's own memory with O(1) extra are called in place. The next chapter adds a subtle case: a recursive function uses stack space for every call that is still waiting, so its depth counts as space too.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alCx_amortNote", "Some operations are usually cheap and occasionally very expensive. Adding to the end of a growable array is one step most of the time, but now and then the array is full and everything must be copied to a bigger block. Averaged over a long sequence of operations the cost per operation can still be constant; this is called amortised cost. The Dynamic Arrays chapter proves it for our own vector.")}
      </Callout>

      <H2>{tx(t, "alCx_measureTitle", "Checking with a stopwatch: the doubling experiment")}</H2>
      <p>
        {tx(t, "alCx_measureBody",
          "Theory and measurement should agree, and there is a simple way to check. If the running time is roughly T(n) ≈ a · nᵏ, then T(2n)/T(n) = a(2n)ᵏ / (a nᵏ) = 2ᵏ: the constant a cancels. So run the program for n, 2n, 4n, … and look at the ratio of consecutive times. About 2 means linear (k = 1), about 4 quadratic, about 8 cubic, and a little over 2 suggests n log n.")}
      </p>
      <CodeBlock lang="cpp" filename="doubling.cpp" t={t}>{`#include <chrono>
#include <cstdio>
#include <vector>

// Counts pairs (i, j), i < j, whose values add up to 0: the triangular loop, O(n²).
long long zeroPairs(const std::vector<int>& v) {
    long long pairs = 0;
    for (size_t i = 0; i < v.size(); ++i)
        for (size_t j = i + 1; j < v.size(); ++j)
            if (v[i] + v[j] == 0) ++pairs;
    return pairs;
}

int main() {
    double previous = 0;
    for (int n = 2000; n <= 32000; n *= 2) {
        std::vector<int> v(n);                       // used here only as a sized array
        for (int i = 0; i < n; ++i) v[i] = (i * 7919) % 2001 - 1000;   // values in [−1000, 1000]

        auto start = std::chrono::steady_clock::now();
        long long p = zeroPairs(v);
        auto stop = std::chrono::steady_clock::now();
        double ms = std::chrono::duration<double, std::milli>(stop - start).count();

        // Printing p stops the compiler from deleting the work as unused.
        std::printf("n = %6d  pairs = %9lld  %9.2f ms  ratio %.2f\\n",
                    n, p, ms, previous > 0 ? ms / previous : 0.0);
        previous = ms;
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alCx_measureWorked",
          "Worked example with made-up but typical timings: 12 ms for n = 8000 and 49 ms for n = 16 000. The ratio is 49 / 12 ≈ 4.1, close to 4 = 2², so the algorithm behaves quadratically, as the analysis said. That also lets us predict: n = 160 000 is 10 times 16 000, so the time should grow by about 10² = 100, to roughly 4.9 seconds. Always compile with optimisation on (-O2) when measuring, repeat each measurement a few times, and use inputs large enough that each run takes at least several milliseconds.")}
      </p>
      <Callout type="tip" t={t}>
        {tx(t, "alCx_constNote", "Big-O describes large inputs. For small ones the hidden constants and the cache (previous chapter) can reverse the order: a simple quadratic method often beats a clever n log n one on 10 or 20 elements, which is why real sorting libraries switch to a simple sort for short ranges. Use Big-O to choose the family of algorithm, and measurement to settle close calls.")}
      </Callout>

      <H2>{tx(t, "alCx_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alCx_w1",
          "1. An outer loop over n items with an inner loop for (int j = 0; j < 3; ++j). The inner loop runs 3 times whatever n is, so the body runs 3n times: O(n). Nested loops are only quadratic when both bounds grow with n.")}
      </p>
      <p>
        {tx(t, "alCx_w2",
          "2. for (int i = 1; i < n; i *= 2) for (int j = 0; j < i; ++j) body(); The outer loop takes i = 1, 2, 4, …, up to the largest power of two below n; the inner loop runs i times for each. Total 1 + 2 + 4 + … + 2ᵏ = 2ᵏ⁺¹ − 1 (a geometric series), and since 2ᵏ < n this is less than 2n. The whole thing is O(n), not O(n log n): most of the work is in the last pass, and every earlier pass together does less than it.")}
      </p>
      <p>
        {tx(t, "alCx_w3",
          "3. Prove 5n + 3 = Θ(n). Upper: 5n + 3 ≤ 6n exactly when 3 ≤ n, so c₂ = 6 with n₀ = 3. Lower: 5n ≤ 5n + 3 always, so c₁ = 5. Both hold for n ≥ 3, hence Θ(n).")}
      </p>
      <p>
        {tx(t, "alCx_w4",
          "4. Which grows faster eventually, n¹⁰⁰ or 1.01ⁿ? Compare logarithms, which keep the order of positive numbers: log(n¹⁰⁰) = 100 · log n, while log(1.01ⁿ) = n · log 1.01 ≈ 0.0043 n (in base 10). A linear function of n beats 100 times a logarithm once n is large enough, so 1.01ⁿ wins. Any exponential with base above 1 eventually beats any polynomial, even though for n = 1000 the polynomial is still astronomically bigger.")}
      </p>

      <H2>{tx(t, "alCx_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alCx_tMistake", "Mistake"), tx(t, "alCx_tFix", "Why it is wrong")]}
        rows={[
          [tx(t, "alCx_e1", "Writing O(2n) or O(n² + n)"), tx(t, "alCx_e1b", "constants and smaller terms are dropped: O(n), O(n²)")],
          [tx(t, "alCx_e2", "\"Two nested loops, so O(n²)\""), tx(t, "alCx_e2b", "count the inner loop: a constant bound gives O(n), a halving one O(n log n), a geometric one O(n) in total")],
          [tx(t, "alCx_e3", "Treating a function call as one step"), tx(t, "alCx_e3b", "strlen, erase, find and copies are loops; multiply by their cost")],
          [tx(t, "alCx_e4", "Reading O as \"exactly\""), tx(t, "alCx_e4b", "O is an upper bound; the tight bound is Θ")],
          [tx(t, "alCx_e5", "Using one letter for two inputs"), tx(t, "alCx_e5b", "a loop over n names inside one over m files is O(n · m)")],
          [tx(t, "alCx_e6", "Deciding by Big-O on tiny inputs"), tx(t, "alCx_e6b", "for small n constants dominate; measure")],
          [tx(t, "alCx_e7", "Quoting the average case as a guarantee"), tx(t, "alCx_e7b", "the average assumes a distribution of inputs; an adversary may send the worst case")],
        ]}
      />

      <KeyIdeas t={t} id="alCx" items={[
        "An algorithm is a finite, precise, correct procedure that always stops; loop invariants show why it is correct.",
        "Count basic steps, not seconds: findMax takes between 3n + 1 and 4n steps, which is Θ(n).",
        "f = O(g) means f ≤ c · g for all n ≥ n₀; Ω is the lower bound and Θ the tight one.",
        "Drop constants and lower-order terms; add costs in sequence, multiply when nested; log bases do not matter.",
        "A triangular loop is n(n − 1)/2 = Θ(n²); halving until 1 is about log₂ n steps.",
        "The worst case is a guarantee; the average case depends on assumptions about the input.",
        "The doubling experiment checks an analysis: T(2n)/T(n) ≈ 2ᵏ for an nᵏ algorithm.",
      ]} />
    </Article>
  );
}
