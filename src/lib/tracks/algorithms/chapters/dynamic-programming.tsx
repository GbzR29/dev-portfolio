"use client";

// Algorithm Design 2: dynamic programming — continues Recursion's memo
// preview. Overlapping subproblems vs divide and conquer, top-down memo vs
// bottom-up table (fib, O(1)-space), the recipe (state, recurrence, base,
// order, answer, reconstruction) and cost = states × work, fewest coins for
// any coin set (fixes Greedy's {1, 3, 4}), pseudo-polynomial time, counting
// grid paths (Pascal's rule), 0/1 knapsack (full hand table, reconstruction,
// one row right to left), edit distance, a table of classic problems,
// greedy vs divide and conquer vs DP; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DPTableFigure } from "@/components/lesson/figures/algo/DPTableFigure";

const r = String.raw;

export function DynamicProgrammingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alDp_intro",
          "The Recursion chapter ended with a warning and a fix. Naive recursive Fibonacci makes an exponential number of calls because it solves the same small problems again and again; remembering each answer in a table (memoization) made it linear. Dynamic programming turns that fix into a method. Split a problem into subproblems, solve each subproblem exactly once, store its answer, and build bigger answers out of stored ones. It solves problems that greedy cannot, like change-making with any coins or the 0/1 knapsack, and it is behind spell checkers, file comparison, DNA alignment and many shortest-path algorithms.")}
      </Lead>

      <H2>{tx(t, "alDp_overlapTitle", "Overlapping subproblems")}</H2>
      <p>
        {tx(t, "alDp_overlapBody",
          "Merge sort and fib both split a problem into smaller ones, but there is a difference. Merge sort's two halves never share any work: each subproblem appears once in the whole recursion. This is divide and conquer, and remembering answers would not help it. fib(n) calls fib(n − 1) and fib(n − 2), and fib(n − 1) calls fib(n − 2) again: the same subproblems appear over and over, which is why the calls grow like 2F(n + 1) − 1. There are only n + 1 different subproblems, fib(0) to fib(n), so solving each once is enough. Dynamic programming applies when a problem has both:")}
      </p>
      <LessonTable
        headers={[tx(t, "alDp_tProp", "Property"), tx(t, "alDp_tMeans", "What it means")]}
        rows={[
          [tx(t, "alDp_p1", "optimal substructure"), tx(t, "alDp_p1b", "a best solution is built from best solutions of smaller subproblems (the same property as in the Greedy chapter)")],
          [tx(t, "alDp_p2", "overlapping subproblems"), tx(t, "alDp_p2b", "the recursion keeps meeting the same subproblems, and there are few different ones, so storing their answers saves a lot")],
        ]}
      />
      <p>
        {tx(t, "alDp_vsGreedy",
          "Where greedy commits to one choice and hopes, dynamic programming tries every possible choice for each subproblem and keeps the best. That would be hopeless if every choice led to fresh work, but because the subproblems overlap, each is solved once and afterwards costs one table lookup. The name comes from Richard Bellman in the 1950s; \"programming\" meant planning with tables, as in \"linear programming\", not writing code.")}
      </p>

      <H2>{tx(t, "alDp_twoWaysTitle", "Top-down and bottom-up")}</H2>
      <p>
        {tx(t, "alDp_twoWaysBody",
          "There are two ways to make sure each subproblem is solved once. Top-down is the memoized recursion of the Recursion chapter: write the natural recursive function, and before computing, look the answer up in a table; after computing, store it. Bottom-up drops the recursion: allocate the table and fill it in an order where every entry is computed after the entries it needs. For fib, entry i needs entries i − 1 and i − 2, so filling from small i to large i works:")}
      </p>
      <CodeBlock lang="cpp" filename="fib_table.cpp" t={t}>{`long long fibTable(int n) {
    if (n < 2) return n;
    long long* f = new long long[n + 1];
    f[0] = 0;
    f[1] = 1;
    for (int i = 2; i <= n; ++i)
        f[i] = f[i - 1] + f[i - 2];                // both are already in the table
    long long answer = f[n];
    delete[] f;
    return answer;
}

// Each entry only reads the two before it, so two variables are enough: O(1) memory.
long long fibTwoVars(int n) {
    long long prev = 0, cur = 1;                   // F(0), F(1)
    if (n == 0) return 0;
    for (int i = 2; i <= n; ++i) {
        long long next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}`}</CodeBlock>
      <p>
        {tx(t, "alDp_order",
          "An order that works exists as long as no subproblem depends, directly or through others, on itself; otherwise the recursion would never end either. Choosing between the two styles:")}
      </p>
      <LessonTable
        headers={["", tx(t, "alDp_tTop", "top-down (memo)"), tx(t, "alDp_tBottom", "bottom-up (table)")]}
        rows={[
          [tx(t, "alDp_c1", "writing it"), tx(t, "alDp_c1a", "the recursion is the recurrence, nearly word for word"), tx(t, "alDp_c1b", "you must work out a filling order")],
          [tx(t, "alDp_c2", "what gets computed"), tx(t, "alDp_c2a", "only the subproblems actually reached"), tx(t, "alDp_c2b", "every entry of the table")],
          [tx(t, "alDp_c3", "overhead"), tx(t, "alDp_c3a", "a function call per subproblem, and the call stack can overflow when it gets deep"), tx(t, "alDp_c3b", "plain loops over an array, cache-friendly")],
          [tx(t, "alDp_c4", "saving memory"), tx(t, "alDp_c4a", "hard"), tx(t, "alDp_c4b", "often easy: keep only the rows still needed, like the two variables above")],
        ]}
      />

      <H2>{tx(t, "alDp_recipeTitle", "The recipe")}</H2>
      <p>{tx(t, "alDp_recipeIntro", "Every dynamic-programming solution in this chapter is found with the same six steps:")}</p>
      <ol className="list-decimal pl-6 space-y-2">
        <li>{tx(t, "alDp_r1", "State: say in words what one table entry means, including every parameter it depends on. \"best[v] = the fewest coins that pay exactly v.\" This is the creative step; the rest follows from it.")}</li>
        <li>{tx(t, "alDp_r2", "Recurrence: express an entry through smaller entries, by asking what the last (or first) decision of a solution could be and trying each possibility.")}</li>
        <li>{tx(t, "alDp_r3", "Base cases: the smallest entries, answered directly.")}</li>
        <li>{tx(t, "alDp_r4", "Order: an order of filling in which every entry comes after the ones it reads.")}</li>
        <li>{tx(t, "alDp_r5", "Answer: which entry (or combination of entries) answers the original question.")}</li>
        <li>{tx(t, "alDp_r6", "Reconstruction: if the solution itself is wanted and not just its value, record the winning choice of every entry, or recompute it, and follow the choices back from the answer.")}</li>
      </ol>
      <Equation label={tx(t, "alDp_eqCost", "The running time of a dynamic program")}
        where={[
          [r`\#\text{states}`, tx(t, "alDp_wStates", "how many different table entries there are")],
          [r`\text{work per state}`, tx(t, "alDp_wWork", "how many smaller entries the recurrence looks at for one entry, usually the number of choices tried")],
        ]}
        note={tx(t, "alDp_eqCostNote", "fib: n + 1 states × 1 addition = O(n). The memory is the size of the table, unless rows that are no longer needed are thrown away.")}>
        {r`T = \#\text{states} \times \text{work per state}`}
      </Equation>

      <H2>{tx(t, "alDp_coinsTitle", "Fewest coins, for any coins")}</H2>
      <p>
        {tx(t, "alDp_coinsBody",
          "Back to the coins 1, 3 and 4 that fooled greedy. State: best[v] is the fewest coins that pay exactly v. Recurrence: think of the last coin of a best way to pay v. It is some coin c with c ≤ v, and the coins before it pay v − c. Those must themselves be a best way to pay v − c: if fewer coins could pay v − c, swapping them in would pay v with fewer coins too. We do not know which c is the last coin, so try all of them and keep the best:")}
      </p>
      <Equation label={tx(t, "alDp_eqCoins", "Fewest coins that pay v")}
        where={[
          [r`\text{best}(v)`, tx(t, "alDp_wBest", "the fewest coins that add up to exactly v, or ∞ if no combination does")],
          [r`c`, tx(t, "alDp_wC", "a coin value; the minimum runs over every coin not larger than v")],
          [r`1 +`, tx(t, "alDp_wOne", "the coin c itself")],
        ]}
        note={tx(t, "alDp_eqCoinsNote", "The base case best(0) = 0: nothing to pay, no coins. If no coin fits, the minimum is over nothing and best(v) = ∞, meaning v cannot be paid.")}>
        {r`\text{best}(0) = 0, \qquad \text{best}(v) = 1 + \min_{c \,\le\, v} \text{best}(v - c)`}
      </Equation>
      <p>
        {tx(t, "alDp_coinsOrder",
          "Every entry reads only smaller amounts, so fill v = 1, 2, …, V in order. The figure does it for V = 10: best[10] = 3 (4 + 3 + 3), where greedy would take 4 + 4 + 1 + 1. Switch to the other two tables later in the chapter.")}
      </p>

      <DPTableFigure t={t} />

      <CodeBlock lang="cpp" filename="fewest_coins.cpp" t={t}>{`#include <climits>

// Fewest coins paying exactly V, or -1 if impossible. best and last need V + 1 entries;
// last[v] remembers the coin chosen for v, for reconstruction.
int fewestCoins(const int* coins, int k, int V, int* best, int* last) {
    best[0] = 0;
    for (int v = 1; v <= V; ++v) {
        best[v] = INT_MAX;                             // "cannot be paid", until a coin shows otherwise
        for (int j = 0; j < k; ++j) {
            int c = coins[j];
            if (c <= v && best[v - c] != INT_MAX && best[v - c] + 1 < best[v]) {
                best[v] = best[v - c] + 1;
                last[v] = c;
            }
        }
    }
    return best[V] == INT_MAX ? -1 : best[V];
}

// The coins themselves, following the recorded choices back from V:
//     for (int v = V; v > 0; v -= last[v]) printf("%d ", last[v]);`}</CodeBlock>
      <p>
        {tx(t, "alDp_coinsCost",
          "There are V + 1 states and each tries k coins: O(V·k) time and O(V) memory. The check best[v − c] != INT_MAX matters: INT_MAX + 1 overflows to a negative number, which would look like a wonderful answer. Note what V is: a number in the input, not the length of the input. Paying a billion needs a table of a billion entries even though the number itself is only 30 bits long. Running times like this, polynomial in the values rather than in the input size, are called pseudo-polynomial; they are fast while the numbers stay moderate.")}
      </p>

      <H2>{tx(t, "alDp_countTitle", "Counting instead of optimizing")}</H2>
      <p>
        {tx(t, "alDp_countBody",
          "The same method counts things, with a sum in place of the minimum. A robot on a grid starts at the top-left cell and may only move right or down; some cells are blocked. How many different paths reach cell (r, c)? The last move into (r, c) came either from above, (r − 1, c), or from the left, (r, c − 1). These two kinds of path are different, and every path is one of them, so the counts add:")}
      </p>
      <Equation label={tx(t, "alDp_eqPaths", "Paths to a cell of the grid")}
        where={[
          [r`\text{ways}(r, c)`, tx(t, "alDp_wWays", "the number of right/down paths from (0, 0) to row r, column c")],
          [r`\text{ways}(0, 0) = 1`, tx(t, "alDp_wStart", "one path: standing still at the start")],
        ]}
        note={tx(t, "alDp_eqPathsNote", "A blocked cell has 0 ways, and a cell outside the grid counts as 0. Filling row by row, left to right, puts both inputs before each cell.")}>
        {r`\text{ways}(r, c) = \text{ways}(r-1, c) + \text{ways}(r, c-1)`}
      </Equation>
      <p>
        {tx(t, "alDp_countEx",
          "On a 3 × 3 grid with the centre blocked, the table is below: 2 paths reach the corner, one around each side. Without any blocked cell the numbers are Pascal's triangle turned on its side, and this recurrence is exactly Pascal's rule from the Math track's Counting chapter: an open R × C grid has C(R + C − 2, R − 1) corner paths, 6 for 3 × 3.")}
      </p>
      <LessonTable
        headers={["ways", "c = 0", "c = 1", "c = 2"]}
        rows={[
          ["r = 0", "1", "1", "1"],
          ["r = 1", "1", tx(t, "alDp_blocked", "0 (blocked)"), "1"],
          ["r = 2", "1", "1", "2"],
        ]}
      />

      <H2>{tx(t, "alDp_knapTitle", "The 0/1 knapsack")}</H2>
      <p>
        {tx(t, "alDp_knapBody",
          "The Greedy chapter's bag, with weights in units of 10 kg: capacity W = 5, item 1 weighs 1 and is worth $60, item 2 weighs 2 and is worth $100, item 3 weighs 3 and is worth $120. Each item is taken whole or not at all. The state needs two numbers, because what the remaining items can add depends on how much room is left: best[i][w] is the most value that items 1 to i can give in a bag of capacity w. For item i there are only two choices, skip it or take it:")}
      </p>
      <Equation label={tx(t, "alDp_eqKnap", "The 0/1 knapsack recurrence")}
        where={[
          [r`w_i,\ v_i`, tx(t, "alDp_wWi", "the weight and the value of item i")],
          [r`\text{best}[i-1][w]`, tx(t, "alDp_wSkip", "skip item i: the best that items 1 to i − 1 do with the same room")],
          [r`v_i + \text{best}[i-1][w - w_i]`, tx(t, "alDp_wTake", "take item i: its value, plus the best that the earlier items do with the room it leaves; only allowed when wᵢ ≤ w")],
        ]}
        note={tx(t, "alDp_eqKnapNote", "Base case best[0][w] = 0: with no items, no value. The answer is best[n][W]. Row i reads only row i − 1, so filling row by row works.")}>
        {r`\text{best}[i][w] = \max\big(\text{best}[i-1][w],\;\; v_i + \text{best}[i-1][w - w_i]\big)`}
      </Equation>
      <p>{tx(t, "alDp_knapTable", "The whole table, which the figure's knapsack mode fills cell by cell:")}</p>
      <LessonTable
        headers={["best[i][w]", "w = 0", "1", "2", "3", "4", "5"]}
        rows={[
          [tx(t, "alDp_row0", "i = 0 (no items)"), "0", "0", "0", "0", "0", "0"],
          [tx(t, "alDp_row1", "i = 1 (1, $60)"), "0", "60", "60", "60", "60", "60"],
          [tx(t, "alDp_row2", "i = 2 (2, $100)"), "0", "60", "100", "160", "160", "160"],
          [tx(t, "alDp_row3", "i = 3 (3, $120)"), "0", "60", "100", "160", "180", "220"],
        ]}
      />
      <p>
        {tx(t, "alDp_knapRead",
          "Two entries worked out: best[2][3] = max(best[1][3], 100 + best[1][1]) = max(60, 160) = 160, items 1 and 2. best[3][5] = max(best[2][5], 120 + best[2][2]) = max(160, 220) = 220. To find the items, walk back from best[3][5]. It differs from the entry above it (160), so item 3 was taken; move to row 2 with 5 − 3 = 2 room left. best[2][2] = 100 differs from best[1][2] = 60, so item 2 was taken; room 0 is left, and best[1][0] = best[0][0], so item 1 was not. The best load is items 2 and 3, $220, the answer greedy missed.")}
      </p>
      <CodeBlock lang="cpp" filename="knapsack.cpp" t={t}>{`#include <algorithm>
#include <vector>

int knapsack(const int* weight, const int* value, int n, int W) {
    // best[i][w]: the most value from the first i items with room w. Row 0 (no items) is all 0.
    std::vector<std::vector<int>> best(n + 1, std::vector<int>(W + 1, 0));
    for (int i = 1; i <= n; ++i) {
        int wi = weight[i - 1], vi = value[i - 1];     // item i sits at index i - 1
        for (int w = 0; w <= W; ++w) {
            best[i][w] = best[i - 1][w];                                     // skip item i
            if (wi <= w)
                best[i][w] = std::max(best[i][w], vi + best[i - 1][w - wi]); // or take it
        }
    }
    return best[n][W];
}`}</CodeBlock>
      <H3>{tx(t, "alDp_oneRowTitle", "One row, filled right to left")}</H3>
      <p>
        {tx(t, "alDp_oneRowBody",
          "Each row reads only the row above, so one array can hold both: overwrite it in place, one item at a time. The loop over w must run from right to left. best[w] reads best[w − wᵢ], which lies to its left; going leftwards, that entry has not been overwritten yet and still holds the previous row's value, as the recurrence requires. Going rightwards, it might already include item i, and the item would be taken twice. That wrong version is in fact the right answer to another problem, the unbounded knapsack, where every item may be taken any number of times.")}
      </p>
      <CodeBlock lang="cpp" filename="knapsack_1d.cpp" t={t}>{`int knapsackOneRow(const int* weight, const int* value, int n, int W) {
    std::vector<int> best(W + 1, 0);
    for (int i = 0; i < n; ++i)
        for (int w = W; w >= weight[i]; --w)           // right to left: each item at most once
            best[w] = std::max(best[w], value[i] + best[w - weight[i]]);
    return best[W];
}`}</CodeBlock>
      <p>
        {tx(t, "alDp_knapCost",
          "(n + 1)(W + 1) states, two choices each: O(n·W) time, and O(W) memory for the one-row version (reconstruction then needs the full table or a record of choices). Like the coins, this is pseudo-polynomial: fine for capacities in the thousands or millions, useless for capacities like 10¹⁸. No algorithm is known that solves the 0/1 knapsack in time polynomial in the input length, and finding one would settle the famous P versus NP question.")}
      </p>

      <H2>{tx(t, "alDp_editTitle", "Edit distance")}</H2>
      <p>
        {tx(t, "alDp_editBody",
          "How similar are two words? The edit distance (Levenshtein distance) between a and b is the fewest single-letter edits that turn a into b, where an edit inserts a letter, deletes a letter or substitutes one letter for another. kitten → sitting takes 3: substitute k → s, substitute e → i, insert g at the end. Spell checkers suggest the dictionary words at the smallest distance from what you typed.")}
      </p>
      <p>
        {tx(t, "alDp_editState",
          "State: d[i][j] is the edit distance between the first i letters of a and the first j letters of b. Look at how a best edit sequence treats the last letters, aᵢ and bⱼ. Either aᵢ is deleted, and the rest turns a's first i − 1 letters into b's first j; or bⱼ is inserted at the end, and the rest turns a's first i letters into b's first j − 1; or aᵢ ends up as bⱼ, free if they are already equal and one substitution if not, and the rest turns the first i − 1 into the first j − 1. There is no other possibility, so:")}
      </p>
      <Equation label={tx(t, "alDp_eqEdit", "Edit distance")}
        where={[
          [r`d[i-1][j] + 1`, tx(t, "alDp_wDel", "delete aᵢ")],
          [r`d[i][j-1] + 1`, tx(t, "alDp_wIns", "insert bⱼ")],
          [r`d[i-1][j-1] + [a_i \ne b_j]`, tx(t, "alDp_wSub", "keep aᵢ as bⱼ: cost 0 when they are equal, 1 (a substitution) when they differ. [·] is 1 when the condition holds and 0 otherwise")],
        ]}
        note={tx(t, "alDp_eqEditNote", "Base cases: d[i][0] = i (delete all i letters) and d[0][j] = j (insert all j). The answer is d[n][m], for a of length n and b of length m.")}>
        {r`d[i][j] = \min\big(d[i-1][j] + 1,\;\; d[i][j-1] + 1,\;\; d[i-1][j-1] + [a_i \ne b_j]\big)`}
      </Equation>
      <CodeBlock lang="cpp" filename="edit_distance.cpp" t={t}>{`#include <algorithm>
#include <string>
#include <vector>

int editDistance(const std::string& a, const std::string& b) {
    int n = (int)a.size(), m = (int)b.size();
    std::vector<std::vector<int>> d(n + 1, std::vector<int>(m + 1));
    for (int i = 0; i <= n; ++i) d[i][0] = i;          // delete everything
    for (int j = 0; j <= m; ++j) d[0][j] = j;          // insert everything
    for (int i = 1; i <= n; ++i)
        for (int j = 1; j <= m; ++j) {
            int keep = d[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1);   // letter i is a[i - 1]
            d[i][j] = std::min({ d[i - 1][j] + 1, d[i][j - 1] + 1, keep });
        }
    return d[n][m];
}`}</CodeBlock>
      <p>
        {tx(t, "alDp_editCost",
          "(n + 1)(m + 1) states, three choices each: O(n·m) time. A row reads only the row above and itself, so two rows of m + 1 entries are enough if only the distance is needed. std::min with braces takes a list and returns its smallest element. Following the winning choices back from d[n][m], as the figure's edit mode does in green, lists the edits themselves: a diagonal step is a match or a substitution, a step down deletes, a step right inserts. The diff tool that compares two versions of a file solves the same kind of table, with whole lines instead of letters.")}
      </p>

      <H2>{tx(t, "alDp_classicTitle", "More classic problems")}</H2>
      <p>{tx(t, "alDp_classicIntro", "The recipe covers a long list of well-known problems. A few, each with its state and recurrence:")}</p>
      <LessonTable
        headers={[tx(t, "alDp_tProblem", "Problem"), tx(t, "alDp_tState", "State and recurrence"), tx(t, "alDp_tCost", "Cost")]}
        rows={[
          [tx(t, "alDp_k1", "longest increasing subsequence of a[0..n−1]"), tx(t, "alDp_k1b", "L[i] = length of the longest increasing subsequence ending at a[i] = 1 + the largest L[j] with j < i and a[j] < a[i] (or 1); the answer is the largest L[i]"), "O(n²)"],
          [tx(t, "alDp_k2", "longest common subsequence of a and b"), tx(t, "alDp_k2b", "c[i][j] = c[i−1][j−1] + 1 if aᵢ = bⱼ, else max(c[i−1][j], c[i][j−1]); edit distance with only insertions and deletions"), "O(n·m)"],
          [tx(t, "alDp_k3", "number of ways to pay v, order ignored"), tx(t, "alDp_k3b", "ways[0] = 1; for each coin c (outer loop), for v from c up, ways[v] += ways[v − c]; putting the coins in the outer loop counts each combination once"), "O(V·k)"],
          [tx(t, "alDp_k4", "shortest paths using at most k roads"), tx(t, "alDp_k4b", "dist_k(x) = min(dist_{k−1}(x), dist_{k−1}(y) + length of road y → x); this is Bellman–Ford, in the Graphs section"), "O(V·E)"],
        ]}
      />

      <H2>{tx(t, "alDp_compareTitle", "Greedy, divide and conquer, dynamic programming")}</H2>
      <LessonTable
        headers={["", tx(t, "alDp_tGreedy", "greedy"), tx(t, "alDp_tDac", "divide and conquer"), tx(t, "alDp_tDp", "dynamic programming")]}
        rows={[
          [tx(t, "alDp_q1", "choices"), tx(t, "alDp_q1a", "one, never undone"), tx(t, "alDp_q1b", "no choice: always split the same way"), tx(t, "alDp_q1c", "every possible choice, best one kept")],
          [tx(t, "alDp_q2", "subproblems"), tx(t, "alDp_q2a", "one left after each choice"), tx(t, "alDp_q2b", "several, disjoint"), tx(t, "alDp_q2c", "many, overlapping, each solved once")],
          [tx(t, "alDp_q3", "needs"), tx(t, "alDp_q3a", "greedy choice + optimal substructure"), tx(t, "alDp_q3b", "a way to combine the parts"), tx(t, "alDp_q3c", "optimal substructure + overlap")],
          [tx(t, "alDp_q4", "examples"), tx(t, "alDp_q4a", "interval scheduling, Huffman"), tx(t, "alDp_q4b", "merge sort, quicksort, binary search"), tx(t, "alDp_q4c", "coins, knapsack, edit distance")],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "alDp_stateTip", "When a dynamic program gives wrong answers, the state is usually missing something. Ask: to finish the solution from here, what do I need to know about the choices made so far? That, and nothing more, is the state. The knapsack needs the room left and not just the item number; edit distance needs a position in both words. If the state holds too much, the table explodes; if too little, the recurrence is wrong.")}
      </Callout>

      <H2>{tx(t, "alDp_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alDp_w1",
          "1. Fewest coins for 6 with coins 1, 3, 4. best[0] = 0, best[1] = 1, best[2] = 2, best[3] = 1 + min(best[2], best[0]) = 1, best[4] = 1 + min(best[3], best[1], best[0]) = 1, best[5] = 1 + min(best[4], best[2], best[1]) = 1 + min(1, 2, 1) = 2, best[6] = 1 + min(best[5], best[3], best[2]) = 1 + min(2, 1, 2) = 2, reached through coin 3. Back from 6: coin 3 leaves 3, and best[3] came from coin 3 as well. 6 = 3 + 3, two coins, where greedy used three.")}
      </p>
      <p>
        {tx(t, "alDp_w2",
          "2. Edit distance from \"ab\" to \"ba\". Base: d[0][·] = 0, 1, 2 and d[·][0] = 0, 1, 2. d[1][1]: a ≠ b, min(0 + 1, 1 + 1, 1 + 1) = 1. d[1][2]: a = a, min(d[0][1] + 0, d[0][2] + 1, d[1][1] + 1) = min(1, 3, 2) = 1. d[2][1]: b = b, min(d[1][0] + 0, d[1][1] + 1, d[2][0] + 1) = min(1, 2, 3) = 1. d[2][2]: b ≠ a, min(d[1][1] + 1, d[1][2] + 1, d[2][1] + 1) = 2. Two edits: for example, delete the a at the front and insert an a at the end.")}
      </p>
      <p>
        {tx(t, "alDp_w3",
          "3. Longest increasing subsequence of [3, 1, 4, 1, 5, 9, 2, 6]. L = [1, 1, 2, 1, 3, 4, 2, 4]: for 4, the smaller values before it are 3 and 1, both with L = 1, so L = 2; for 5, the best smaller predecessor is 4 (L = 2), so 3; for 9, it is 5 (L = 3), so 4; for 6, again 5, so 4. The answer is 4, for example 3, 4, 5, 9. The table found it with 28 comparisons, where trying all 2⁸ = 256 subsequences would have checked each one.")}
      </p>

      <H2>{tx(t, "alDp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alDp_tMistake", "Mistake"), tx(t, "alDp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alDp_e1", "Filling in the wrong order"), tx(t, "alDp_e1b", "an entry reads a neighbour that is still 0 or garbage. List what each entry reads and choose the loops so those come first")],
          [tx(t, "alDp_e2", "A table one entry too small"), tx(t, "alDp_e2b", "amounts 0 to V are V + 1 entries, and prefixes of length 0 to n are n + 1; index 0 is the empty case, not the first item")],
          [tx(t, "alDp_e3", "Adding to \"impossible\""), tx(t, "alDp_e3b", "INT_MAX + 1 overflows to a very negative number that wins every min; test for the sentinel before adding")],
          [tx(t, "alDp_e4", "One-row knapsack filled left to right"), tx(t, "alDp_e4b", "the same item is taken several times (the unbounded knapsack); loop w from W down")],
          [tx(t, "alDp_e5", "A memo sentinel that is also a real answer"), tx(t, "alDp_e5b", "if 0 means \"not computed\" and 0 is a possible answer, those entries are recomputed every time; use -1, or a separate bool table")],
          [tx(t, "alDp_e6", "A state that forgets something"), tx(t, "alDp_e6b", "the recurrence silently mixes up different situations; the state must hold everything the rest of the solution depends on")],
        ]}
      />

      <KeyIdeas t={t} id="alDp" items={[
        "Dynamic programming solves each subproblem once, stores the answer, and builds larger answers from stored ones.",
        "It needs optimal substructure and overlapping subproblems; without overlap it is plain divide and conquer.",
        "Top-down memoizes the recursion; bottom-up fills a table in an order where every input comes first.",
        "The recipe: state, recurrence (try every last choice), base cases, order, answer, reconstruction; time = states × work per state.",
        "Fewest coins O(V·k), 0/1 knapsack O(n·W) (one row, right to left), edit distance O(n·m).",
        "Record each winning choice to rebuild the solution itself, not just its value.",
      ]} />
    </Article>
  );
}
