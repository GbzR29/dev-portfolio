"use client";

// Foundations 3: recursion — base case and recursive case; factorial traced
// by hand; the call stack, frames, depth as space, stack overflow; thinking
// recursively (sum, reverse, gcd, fast power); recurrences solved by
// unrolling (T(n−1) + c, T(n/2) + c, 2T(n−1) + 1, Fibonacci's call count and
// a preview of 2T(n/2) + n); the Towers of Hanoi; generating all subsets;
// memoization as a preview; recursion vs loops and tail calls; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { CallStackFigure } from "@/components/lesson/figures/algo/CallStackFigure";
import { HanoiFigure } from "@/components/lesson/figures/algo/HanoiFigure";

const r = String.raw;

export function RecursionContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alRec_intro",
          "A recursive function solves a problem by calling itself on a smaller version of the same problem. It sounds circular, and at first it feels like cheating, yet it is one of the most useful ideas in this whole track: sorting by merging, searching trees, exploring graphs and dynamic programming are all most naturally written this way. This chapter explains what happens inside the machine when a function calls itself, how to design recursive functions without getting lost, and how to work out what they cost.")}
      </Lead>

      <H2>{tx(t, "alRec_ideaTitle", "The two parts of every recursion")}</H2>
      <p>
        {tx(t, "alRec_ideaBody",
          "Take the factorial from the Counting chapter of the Math track: n! = n · (n − 1) · … · 2 · 1. Look at it again: everything after the first factor is (n − 1)!. So n! = n · (n − 1)!, a definition of the factorial in terms of a smaller factorial. On its own that would go on forever (3! needs 2!, which needs 1!, which needs 0!, which needs (−1)!…), so we add a case that is answered directly: 0! = 1 (and 1! = 1).")}
      </p>
      <Equation label={tx(t, "alRec_eqFact", "Factorial, defined recursively")}
        where={[
          [r`n`, tx(t, "alRec_wN", "a whole number, n ≥ 0")],
          [r`n \le 1`, tx(t, "alRec_wBase", "the base case: small enough to answer without recursion")],
          [r`n \cdot (n-1)!`, tx(t, "alRec_wRec", "the recursive case: one multiplication plus the answer to a smaller problem")],
        ]}>
        {r`n! = \begin{cases} 1 & \text{if } n \le 1 \\ n \cdot (n-1)! & \text{if } n > 1 \end{cases}`}
      </Equation>
      <p>
        {tx(t, "alRec_partsBody",
          "Every correct recursive function has the same two parts. A base case, which returns an answer without calling itself. And a recursive case, which calls the function on an input that is strictly closer to a base case. The second condition, making progress, is what guarantees the recursion stops: here n goes down by 1 each time and must reach 1.")}
      </p>
      <CodeBlock lang="cpp" filename="factorial.cpp" t={t}>{`long long factorial(int n) {
    if (n <= 1) return 1;              // base case
    return n * factorial(n - 1);       // recursive case: a smaller n
}`}</CodeBlock>
      <H3>{tx(t, "alRec_traceTitle", "Tracing it by hand")}</H3>
      <p>
        {tx(t, "alRec_traceBody",
          "factorial(4) cannot finish until it knows factorial(3), which needs factorial(2), which needs factorial(1). Writing each step out: factorial(4) = 4 · factorial(3) = 4 · (3 · factorial(2)) = 4 · (3 · (2 · factorial(1))) = 4 · (3 · (2 · 1)). Only now, at the base case, does a value come back, and the multiplications happen on the way out: 2 · 1 = 2, then 3 · 2 = 6, then 4 · 6 = 24. Recursion has two phases: a descent, where calls wait for answers, and an ascent, where answers are combined.")}
      </p>

      <H2>{tx(t, "alRec_stackTitle", "What the machine does: the call stack")}</H2>
      <p>
        {tx(t, "alRec_stackBody",
          "How can four copies of factorial each have their own n at the same time? The Memory chapter introduced the stack: every function call gets a fresh stack frame holding its parameters, its local variables and the return address (where to continue in the caller once it finishes). A recursive call is no different from any other call. It pushes a new frame with its own n on top of the caller's, and the caller's frame simply waits underneath. When a call returns, its frame is popped and the caller resumes exactly where it stopped, with its own n intact. Step through the figure and watch both views at once: the tree of calls on the left and the stack of frames on the right.")}
      </p>

      <CallStackFigure t={t} />

      <p>
        {tx(t, "alRec_depthBody",
          "The height of the stack at its tallest is the recursion depth. factorial(n) reaches depth n, so it uses Θ(n) stack space even though it has no arrays: recursion depth counts in the space complexity. Each frame is small (a few dozen bytes for factorial), but the stack is too: 1 MB on Windows, 8 MB typically on Linux. A recursion tens or hundreds of thousands of calls deep can exhaust it. This is a stack overflow, and in C++ it simply crashes the program, usually without a helpful message.")}
      </p>

      <H2>{tx(t, "alRec_thinkTitle", "Thinking recursively")}</H2>
      <p>
        {tx(t, "alRec_thinkBody",
          "Tracing every call works for factorial(4), but not for a sort of a million elements. The practical way to write recursion is to trust it: assume the recursive call already works for every smaller input, and only check that your function works for this one. Mathematicians call the same reasoning induction. In practice it comes down to three questions. What is the smallest input, and what is its answer? How do I make the input smaller? How do I build my answer from the answer for the smaller input?")}
      </p>
      <LessonTable
        headers={[tx(t, "alRec_tProblem", "Problem"), tx(t, "alRec_tBase", "Base case"), tx(t, "alRec_tShrink", "Smaller input"), tx(t, "alRec_tBuild", "Build the answer")]}
        rows={[
          [tx(t, "alRec_p1", "sum of a[0..n−1]"), tx(t, "alRec_p1a", "n = 0: the empty sum is 0"), tx(t, "alRec_p1b", "the first n − 1 elements"), tx(t, "alRec_p1c", "their sum + a[n − 1]")],
          [tx(t, "alRec_p2", "reverse s[lo..hi]"), tx(t, "alRec_p2a", "lo ≥ hi: 0 or 1 characters, nothing to do"), tx(t, "alRec_p2b", "s[lo+1..hi−1]"), tx(t, "alRec_p2c", "swap the two ends first, then reverse the middle")],
          [tx(t, "alRec_p3", "gcd(a, b)"), tx(t, "alRec_p3a", "b = 0: the answer is a"), tx(t, "alRec_p3b", "gcd(b, a mod b)"), tx(t, "alRec_p3c", "the same answer (Euclid's algorithm)")],
          [tx(t, "alRec_p4", "xⁿ"), tx(t, "alRec_p4a", "n = 0: the answer is 1"), tx(t, "alRec_p4b", "x^⌊n/2⌋"), tx(t, "alRec_p4c", "square it, and multiply by x once more if n is odd")],
        ]}
      />
      <CodeBlock lang="cpp" filename="recursive_basics.cpp" t={t}>{`long long sum(const int* a, int n) {          // a[0] + … + a[n − 1]
    if (n == 0) return 0;                     // the empty sum
    return sum(a, n - 1) + a[n - 1];
}

void reverse(char* s, int lo, int hi) {       // reverses s[lo..hi] in place
    if (lo >= hi) return;                     // 0 or 1 characters
    char tmp = s[lo]; s[lo] = s[hi]; s[hi] = tmp;
    reverse(s, lo + 1, hi - 1);
}

int gcd(int a, int b) {                       // a, b ≥ 0, not both 0
    if (b == 0) return a;
    return gcd(b, a % b);                     // a % b < b: the second argument shrinks
}

long long power(long long x, int n) {         // xⁿ for n ≥ 0
    if (n == 0) return 1;
    long long half = power(x, n / 2);         // ONE call, n halved
    return (n % 2 == 0) ? half * half : x * half * half;
}`}</CodeBlock>
      <p>
        {tx(t, "alRec_gcdBody",
          "Euclid's algorithm is the Math track's divisibility chapter written as recursion: any number that divides both a and b also divides a mod b (the remainder is a minus a multiple of b), and the other way round, so the pair (b, a mod b) has the same common divisors as (a, b), with smaller numbers. The fast power is the Math track's repeated squaring. Note the single call power(x, n / 2) stored in half: writing power(x, n / 2) * power(x, n / 2) would compute the same thing twice at every level and throw away the whole advantage.")}
      </p>

      <H2>{tx(t, "alRec_costTitle", "What recursion costs: recurrences")}</H2>
      <p>
        {tx(t, "alRec_costBody",
          "The cost of a recursive function is described by an equation that refers to itself, a recurrence. Write T(n) for the number of steps on input n. factorial does a constant amount of work c (a comparison, a multiplication, a call) plus whatever factorial(n − 1) does, so T(n) = T(n − 1) + c. The standard way to solve such an equation is to unroll it: substitute the equation into itself until a pattern shows, then jump to the base case.")}
      </p>
      <Equation label={tx(t, "alRec_eqLinear", "Unrolling T(n) = T(n − 1) + c")}
        where={[
          [r`c`, tx(t, "alRec_wC", "the constant work done by one call, apart from its recursive call")],
          [r`k`, tx(t, "alRec_wK", "the number of unrolling steps; it reaches the base case when n − k = 1, that is k = n − 1")],
        ]}
        note={tx(t, "alRec_eqLinearNote", "With T(1) = c: T(n) = c · n = Θ(n). The same shape describes sum and reverse.")}>
        {r`T(n) = T(n-1) + c = T(n-2) + 2c = \dots = T(n-k) + k\,c = T(1) + (n-1)\,c`}
      </Equation>
      <Equation label={tx(t, "alRec_eqHalf", "Unrolling T(n) = T(n/2) + c")}
        where={[
          [r`n / 2^k`, tx(t, "alRec_wHalf", "the input after k halvings; it reaches 1 when 2ᵏ = n, that is k = log₂ n")],
        ]}
        note={tx(t, "alRec_eqHalfNote", "Θ(log n): fast power computes x¹⁰⁰⁰⁰⁰⁰ with about 20 levels of calls instead of a million multiplications.")}>
        {r`T(n) = T(n/2) + c = T(n/4) + 2c = \dots = T(n/2^k) + k\,c = T(1) + c\log_2 n`}
      </Equation>
      <H3>{tx(t, "alRec_fibTitle", "When recursion explodes: Fibonacci")}</H3>
      <p>
        {tx(t, "alRec_fibBody",
          "The Fibonacci numbers are 0, 1, 1, 2, 3, 5, 8, 13, …: each is the sum of the two before it, F(n) = F(n − 1) + F(n − 2) with F(0) = 0 and F(1) = 1. The direct translation into C++ is correct but disastrously slow. Each call makes two calls, and they overlap: fib(5) calls fib(4) and fib(3), but fib(4) calls fib(3) again. Switch the figure above to fibonacci and count: fib(5) makes 15 calls, and fib(2) alone is computed 3 times.")}
      </p>
      <CodeBlock lang="cpp" filename="fib_naive.cpp" t={t}>{`long long fib(int n) {                  // correct, but exponential time
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}`}</CodeBlock>
      <p>
        {tx(t, "alRec_fibCount",
          "Let C(n) be the number of calls fib(n) makes, itself included. It makes itself plus all the calls of fib(n − 1) plus all those of fib(n − 2): C(n) = C(n − 1) + C(n − 2) + 1, with C(0) = C(1) = 1. Tabulating: C(2) = 3, C(3) = 5, C(4) = 9, C(5) = 15, C(6) = 25. Adding 1 to each gives 2, 4, 6, 10, 16, 26: twice the Fibonacci numbers. So C(n) = 2F(n + 1) − 1; check n = 5: 2 · 8 − 1 = 15. The call count grows like the Fibonacci numbers themselves, which grow by a factor of about φ = (1 + √5)/2 ≈ 1.618 per step. fib(40) makes 2 · 165 580 141 − 1 = 331 160 281 calls to compute a number that a loop finds in 40 additions.")}
      </p>
      <p>
        {tx(t, "alRec_memoBody",
          "The fix is to remember. Keep a table of answers already computed and look there before recursing. Now each fib(k) is computed once, every later request is a table lookup, and the cost drops from exponential to Θ(n). This technique, memoization, is the doorway to dynamic programming, which has its own chapter later in the track.")}
      </p>
      <CodeBlock lang="cpp" filename="fib_memo.cpp" t={t}>{`// memo[k] == -1 means "not computed yet". Needs memo to have n + 1 entries.
long long fibMemo(int n, long long* memo) {
    if (n < 2) return n;
    if (memo[n] != -1) return memo[n];                 // already known: O(1)
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}

long long fibFast(int n) {
    long long* memo = new long long[n + 1];
    for (int i = 0; i <= n; ++i) memo[i] = -1;
    long long answer = fibMemo(n, memo);
    delete[] memo;
    return answer;
}`}</CodeBlock>

      <H2>{tx(t, "alRec_hanoiTitle", "The Towers of Hanoi")}</H2>
      <p>
        {tx(t, "alRec_hanoiBody",
          "A classic puzzle where recursion is not just convenient but the natural way to see the answer. There are three pegs, A, B and C, and n disks of different sizes stacked on A, largest at the bottom. Move the whole tower to C, one disk at a time, never placing a disk on a smaller one. Play a few rounds yourself before reading on.")}
      </p>

      <HanoiFigure t={t} />

      <p>
        {tx(t, "alRec_hanoiSolve",
          "The key observation: at some moment the largest disk must move from A to C. At that moment nothing may be on top of it, and C must be empty (anything on C would be smaller). So all the other n − 1 disks must be on B. That splits the problem into three parts: move n − 1 disks from A to B (using C as the spare), move the largest disk from A to C, then move the n − 1 disks from B to C (using A as the spare). The first and third parts are the same puzzle with one disk fewer, and the base case is n = 0: nothing to do.")}
      </p>
      <CodeBlock lang="cpp" filename="hanoi.cpp" t={t}>{`#include <cstdio>

void hanoi(int n, char from, char to, char via) {
    if (n == 0) return;                          // no disks: nothing to move
    hanoi(n - 1, from, via, to);                 // clear the way onto the spare peg
    std::printf("move disk %d: %c -> %c\\n", n, from, to);
    hanoi(n - 1, via, to, from);                 // put them back on top
}

int main() { hanoi(3, 'A', 'C', 'B'); }          // prints 7 moves`}</CodeBlock>
      <Equation label={tx(t, "alRec_eqHanoi", "Moves needed for n disks")}
        where={[
          [r`M(n)`, tx(t, "alRec_wM", "the number of moves the recursion makes for n disks")],
          [r`2M(n-1)`, tx(t, "alRec_wM2", "the two transfers of the smaller tower")],
          [r`+1`, tx(t, "alRec_wM1", "the single move of the largest disk")],
        ]}
        note={tx(t, "alRec_eqHanoiNote", "Unrolling: M(n) = 2M(n − 1) + 1 = 4M(n − 2) + 2 + 1 = 8M(n − 3) + 4 + 2 + 1 = … = 2ⁿ⁻¹ M(1) + 2ⁿ⁻² + … + 2 + 1. With M(1) = 1 that is 1 + 2 + 4 + … + 2ⁿ⁻¹ = 2ⁿ − 1 (a geometric series). Check: 3 disks, 7 moves. The argument above also shows no solution can do better, since the largest disk forces two full transfers of the rest.")}>
        {r`M(n) = 2\,M(n-1) + 1,\quad M(1) = 1 \quad\Longrightarrow\quad M(n) = 2^n - 1`}
      </Equation>
      <p>
        {tx(t, "alRec_legendBody",
          "The legend says monks are moving 64 golden disks and the world ends when they finish. 2⁶⁴ − 1 ≈ 1.8 · 10¹⁹ moves at one per second is about 585 billion years, some forty times the age of the universe. The recursion depth, on the other hand, is only 64: exponential time, linear space.")}
      </p>

      <H2>{tx(t, "alRec_subsetsTitle", "Exploring every choice")}</H2>
      <p>
        {tx(t, "alRec_subsetsBody",
          "Recursion is also the natural way to go through every combination of choices. To list every subset of a set of n items, look at the first item: every subset either leaves it out or takes it. For each of those two options, list every subset of the remaining items. Two calls per item, n levels: 2ⁿ subsets, as the Counting chapter predicts. This pattern, choosing, recursing and moving on to the next choice, is called backtracking, and it solves puzzles such as sudoku and the eight queens.")}
      </p>
      <CodeBlock lang="cpp" filename="subsets.cpp" t={t}>{`#include <cstdio>

// chosen[0..k-1] holds the items picked so far; decide about items[i..n-1].
void subsets(const char* items, int n, int i, char* chosen, int k) {
    if (i == n) {                                   // every item decided
        std::printf("{%.*s}\\n", k, chosen);
        return;
    }
    subsets(items, n, i + 1, chosen, k);            // leave items[i] out
    chosen[k] = items[i];
    subsets(items, n, i + 1, chosen, k + 1);        // take items[i]
}

int main() {
    char buffer[3];
    subsets("abc", 3, 0, buffer, 0);   // {} {c} {b} {bc} {a} {ac} {ab} {abc}
}`}</CodeBlock>

      <H2>{tx(t, "alRec_loopTitle", "Recursion or a loop?")}</H2>
      <p>
        {tx(t, "alRec_loopBody",
          "Anything written recursively can be written with loops, and the other way round. When the recursive call is the very last thing the function does and its result is returned unchanged (as in gcd), the recursion is a tail call and is really a loop in disguise: nothing waits in the frame, so the frame could be reused. Many compilers do exactly that when optimising, but the C++ standard does not require it, so do not rely on it for deep recursion. factorial is not a tail call, because the multiplication happens after the call returns. When a function makes several calls (Hanoi, subsets, and later tree traversals and merge sort), a loop version needs its own explicit stack, and the recursive version is usually far clearer.")}
      </p>
      <CodeBlock lang="cpp" filename="iterative.cpp" t={t}>{`long long factorialLoop(int n) {
    long long result = 1;
    for (int k = 2; k <= n; ++k) result *= k;
    return result;
}

int gcdLoop(int a, int b) {           // the tail call turned into a loop
    while (b != 0) {
        int r = a % b;
        a = b;
        b = r;
    }
    return a;
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "alRec_whenNote", "A good rule: recurse when the depth is small (about log n, as in balanced trees and divide and conquer) or the problem branches, and loop when the recursion would be a long chain proportional to n over large inputs, such as walking a list of a million elements.")}
      </Callout>

      <H2>{tx(t, "alRec_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alRec_w1",
          "1. gcd(84, 36). 84 mod 36 = 12 (84 = 2 · 36 + 12), so gcd(84, 36) = gcd(36, 12). 36 mod 12 = 0, so gcd(36, 12) = gcd(12, 0) = 12. Three calls, answer 12. Check: 84 = 12 · 7 and 36 = 12 · 3, and 7 and 3 share no factor.")}
      </p>
      <p>
        {tx(t, "alRec_w2",
          "2. power(3, 13). 13 is odd, so the answer is 3 · h² with h = power(3, 6). 6 is even: power(3, 6) = h² with h = power(3, 3). 3 is odd: power(3, 3) = 3 · h² with h = power(3, 1). power(3, 1) = 3 · power(3, 0)² = 3 · 1 = 3. Climbing back: power(3, 3) = 3 · 9 = 27; power(3, 6) = 27² = 729; power(3, 13) = 3 · 729² = 3 · 531 441 = 1 594 323. Five calls and 7 multiplications (2 at each odd level, 1 at the even one) instead of the 12 of multiplying 3 by itself step by step.")}
      </p>
      <p>
        {tx(t, "alRec_w3",
          "3. A preview of divide and conquer: T(n) = 2T(n/2) + n, with T(1) = 1. Picture the tree of calls. The top call does n work of its own. Its two children each do n/2: n together. Their four children each do n/4: again n together. Every level adds up to n, and halving n reaches 1 after log₂ n levels, so the total is about n log₂ n. Merge sort, two chapters from now, has exactly this recurrence.")}
      </p>

      <H2>{tx(t, "alRec_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alRec_tMistake", "Mistake"), tx(t, "alRec_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alRec_e1", "No base case, or one that is never reached"), tx(t, "alRec_e1b", "infinite recursion until the stack overflows. factorial(−1) with a base case n == 1 never stops: test n <= 1")],
          [tx(t, "alRec_e2", "The recursive call does not make progress"), tx(t, "alRec_e2b", "calling f(n) inside f(n), or recursing on n − 2 with the base case n == 0: an odd n jumps over 0 into the negatives. Check the smallest inputs by hand")],
          [tx(t, "alRec_e3", "Ignoring the returned value"), tx(t, "alRec_e3b", "writing sum(a, n − 1); and then return a[n − 1]; drops the partial answer. Use it: return sum(a, n − 1) + a[n − 1]")],
          [tx(t, "alRec_e4", "The same call computed twice"), tx(t, "alRec_e4b", "power(x, n/2) * power(x, n/2) turns log n into n; overlapping calls make Fibonacci exponential. Store the result, or memoize")],
          [tx(t, "alRec_e5", "Deep recursion over large inputs"), tx(t, "alRec_e5b", "a chain of a million calls overflows the stack. Use a loop, or an explicit stack on the heap")],
          [tx(t, "alRec_e6", "Forgetting the stack in the space cost"), tx(t, "alRec_e6b", "depth d costs Θ(d) memory even with no arrays")],
        ]}
      />

      <KeyIdeas t={t} id="alRec" items={[
        "A recursive function has a base case answered directly and a recursive case on a strictly smaller input.",
        "Each call gets its own stack frame; the depth of the recursion is also its extra space.",
        "Design by trust: assume the smaller call works, then build your answer from its answer.",
        "Costs follow recurrences, solved by unrolling: T(n − 1) + c is Θ(n), T(n/2) + c is Θ(log n), 2T(n − 1) + 1 is 2ⁿ − 1.",
        "Overlapping calls explode (naive Fibonacci makes 2F(n + 1) − 1 calls); memoization computes each one once.",
        "Hanoi: move n − 1 away, move the largest, move n − 1 back: 2ⁿ − 1 moves, and no fewer.",
        "Loops suit long chains; recursion suits branching and shallow depth.",
      ]} />
    </Article>
  );
}
