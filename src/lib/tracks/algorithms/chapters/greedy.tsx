"use client";

// Algorithm Design 1: greedy algorithms — the idea (take the best-looking
// piece, never undo), making change and the {1, 3, 4} counterexample,
// interval scheduling (three tempting rules, earliest finish, exchange
// proof, code with std::sort and a lambda), the two ingredients (greedy
// choice + optimal substructure), interval partitioning with a min-heap and
// the depth lower bound, fractional vs 0/1 knapsack, Huffman codes (prefix
// codes as binary tries, the merge algorithm, the swap argument, code);
// worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { IntervalFigure } from "@/components/lesson/figures/algo/IntervalFigure";
import { HuffmanFigure } from "@/components/lesson/figures/algo/HuffmanFigure";

const r = String.raw;

export function GreedyContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alGrd_intro",
          "The chapters so far built data structures. This section is about strategies: general ways of designing an algorithm for a problem nobody has solved for you. The simplest strategy is to be greedy. Build the answer one piece at a time, and at every step take the piece that looks best right now, without ever going back on a choice. Greedy algorithms are short and fast, usually a sort followed by one pass. The catch is that for many problems the locally best choice leads to a bad overall answer. This chapter shows problems where greedy is provably right, one where it is wrong, and the argument that tells them apart.")}
      </Lead>

      <Goals t={t} id="alGrd" items={[
        "Solve scheduling problems with a greedy choice.",
        "Prove that a greedy choice is safe with an exchange argument, or find a counterexample.",
        "Tell the fractional knapsack, where greedy works, from the 0/1 knapsack, where it does not.",
        "Build a Huffman code.",
      ]} />

      <H2>{tx(t, "alGrd_changeTitle", "Making change")}</H2>
      <p>
        {tx(t, "alGrd_changeBody",
          "A cashier must pay 63 cents with coins of 25, 10, 5 and 1 cents, using as few coins as possible. The natural method is greedy: take the largest coin that does not exceed what is still owed, subtract it, repeat. 25 (38 left), 25 (13 left), 10 (3 left), 1, 1, 1: six coins, and no combination does better. For these coin values greedy always gives the fewest coins. That is a property of the values, not of the method.")}
      </p>
      <p>
        {tx(t, "alGrd_changeFail",
          "Change the coins to 1, 3 and 4 and pay 6. Greedy takes 4 (2 left), then 1 and 1: three coins. But 3 + 3 is two coins. The first choice, 4, looked best, and it made the rest expensive, and a greedy algorithm never reconsiders. So \"take what looks best\" is not an algorithm you can trust on sight; it needs a proof for the problem at hand. The next chapter solves change-making for any coins with dynamic programming.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "alGrd_proofWarn", "A greedy algorithm that works on every example you try can still be wrong. Before trusting one, either prove it or search hard for a counterexample: small cases, a brute-force solver that tries every possibility, and comparison on thousands of random inputs. The {1, 3, 4} coins fail only for some amounts, so a few lucky tests would miss it.")}
      </Callout>

      <H2>{tx(t, "alGrd_schedTitle", "Interval scheduling")}</H2>
      <p>
        {tx(t, "alGrd_schedBody",
          "One room, many requests to use it. Request i wants the room from time sᵢ (start) to time eᵢ (end). Two requests are compatible if they do not overlap. Choose as many compatible requests as possible. We use half-open intervals [s, e): the interval includes s but not e, so a request ending at 5 and one starting at 5 are compatible, the way a meeting until 5 o'clock and one from 5 o'clock do not clash. With half-open intervals, a and b overlap exactly when a.start < b.end and b.start < a.end.")}
      </p>
      <p>
        {tx(t, "alGrd_schedRules",
          "Every greedy algorithm for this problem has the same shape: put the requests in some order, go through them, and take each one that is compatible with everything taken so far. The only question is the order. Three orders suggest themselves. Earliest start: whoever asked for the earliest time goes first. Shortest: short requests use up little of the room. Earliest finish: whatever frees the room soonest. Try all three in the figure.")}
      </p>

      <IntervalFigure t={t} />

      <p>
        {tx(t, "alGrd_schedWhich",
          "Earliest start fails when one long request starts first and blocks all the others. Shortest fails when a short request straddles two longer ones that could both have been taken. Only earliest finish survives, and here is why it always gives the maximum.")}
      </p>

      <H3>{tx(t, "alGrd_exchangeTitle", "The exchange argument")}</H3>
      <p>
        {tx(t, "alGrd_exchangeBody",
          "Let g be the request that ends first. Take any best possible schedule O (one with the maximum number of requests) and list its requests in time order, o₁, o₂, … Because g ends first of all requests, g ends no later than o₁. Now exchange: remove o₁ from O and put g in its place. g cannot overlap o₂, because o₂ starts after o₁ ends, which is not before g ends. And g cannot overlap anything later either. So the new schedule is valid and has just as many requests: it is also a best schedule, and it starts with g. In words: choosing g is never a mistake.")}
      </p>
      <p>
        {tx(t, "alGrd_exchangeRest",
          "After taking g, the remaining task is the same problem on a smaller input: the requests that start at or after g's end (every other request overlaps g). A best schedule for that smaller problem, with g added in front, is a best schedule overall, since any schedule starting with g is g plus a schedule of those later requests. Greedy then takes the earliest-ending of the later requests, which by the same argument is again a safe choice, and so on. By induction on the number of requests, greedy's schedule has the maximum size.")}
      </p>
      <CodeBlock lang="cpp" filename="interval_schedule.cpp" t={t}>{`#include <algorithm>
#include <climits>

struct Interval { int start, end; };               // half-open [start, end)

// Chooses a largest set of non-overlapping intervals; writes them to out and returns how many.
int schedule(Interval* a, int n, Interval* out) {
    std::sort(a, a + n, [](const Interval& x, const Interval& y) {
        return x.end < y.end;                      // earliest finish first
    });
    int count = 0;
    int freeFrom = INT_MIN;                        // the room is free from this time on
    for (int i = 0; i < n; ++i) {
        if (a[i].start >= freeFrom) {              // compatible with everything taken
            out[count++] = a[i];
            freeFrom = a[i].end;
        }
    }
    return count;
}`}</CodeBlock>
      <p>
        {tx(t, "alGrd_schedCode",
          "Two details. std::sort from <algorithm> is the introsort of the Quicksort chapter; now that we have written sorting ourselves, we use the library's. Its third argument says what \"comes first\" means: a lambda, a small unnamed function written in place, that receives two intervals and returns true when x must come before y. Second, the loop compares each request with the last one taken only, not with all of them. That is enough because requests are taken in order of end time, so the last one taken has the latest end, freeFrom, and a request starting at or after freeFrom is after all of them. The cost is O(n log n) for the sort plus O(n) for the pass.")}
      </p>

      <H2>{tx(t, "alGrd_ingrTitle", "When does greedy work?")}</H2>
      <p>
        {tx(t, "alGrd_ingrBody",
          "The proof above has two parts, and every correct greedy algorithm needs both:")}
      </p>
      <LessonTable
        headers={[tx(t, "alGrd_tProp", "Property"), tx(t, "alGrd_tMeans", "What it means"), tx(t, "alGrd_tSched", "In interval scheduling")]}
        rows={[
          [tx(t, "alGrd_p1", "greedy choice"), tx(t, "alGrd_p1b", "some best solution contains the choice greedy makes first; usually shown by exchanging a piece of a best solution for the greedy piece"), tx(t, "alGrd_p1c", "some best schedule contains the earliest-ending request")],
          [tx(t, "alGrd_p2", "optimal substructure"), tx(t, "alGrd_p2b", "after that choice, what is left is a smaller instance of the same problem, and a best solution of it plus the choice is a best solution of the whole"), tx(t, "alGrd_p2c", "the rest is scheduling the requests that start after it ends")],
        ]}
      />
      <p>
        {tx(t, "alGrd_ingrCoins",
          "The {1, 3, 4} coins have optimal substructure (after paying one coin, the rest is paying a smaller amount), but not the greedy-choice property: no best way to pay 6 contains the coin 4. The next chapter shows that optimal substructure alone is enough for dynamic programming, which tries every first choice instead of committing to one.")}
      </p>

      <H2>{tx(t, "alGrd_roomsTitle", "Interval partitioning: how many rooms?")}</H2>
      <p>
        {tx(t, "alGrd_roomsBody",
          "Now every lecture must take place, and the question is how many rooms that needs. Go through the lectures in order of start time. For each one, if some room is already free (its last lecture ended at or before this start), use it; otherwise open a new room. To find a free room quickly, keep the end time of each room's last lecture in a min-heap (Heaps chapter): the root is the room that frees up earliest, and if even that one is busy, all of them are.")}
      </p>
      <CodeBlock lang="cpp" filename="rooms.cpp" t={t}>{`#include <algorithm>
#include <queue>
#include <vector>

int roomsNeeded(Interval* a, int n) {
    std::sort(a, a + n, [](const Interval& x, const Interval& y) {
        return x.start < y.start;                  // this time by start
    });
    // min-heap: for every room, when its last lecture ends
    std::priority_queue<int, std::vector<int>, std::greater<int>> freeAt;
    for (int i = 0; i < n; ++i) {
        if (!freeAt.empty() && freeAt.top() <= a[i].start)
            freeAt.pop();                          // the earliest-free room is free: reuse it
        freeAt.push(a[i].end);                     // that room (or a new one) is busy until a[i].end
    }
    return (int)freeAt.size();                     // rooms only ever get added, never closed
}`}</CodeBlock>
      <p>
        {tx(t, "alGrd_roomsProof",
          "Why is this the minimum? Call the depth d the largest number of lectures in progress at the same moment. Any plan needs at least d rooms, since those d lectures need different rooms. Greedy opens a new room only when every existing room is busy at the new lecture's start time s: each of those k rooms holds a lecture that started no later than s (lectures come in order of start) and ends after s. Together with the new lecture, k + 1 lectures are in progress at time s, so k + 1 ≤ d. Greedy therefore never goes above d rooms, and nobody can use fewer. Cost: O(n log n) for the sort and n heap operations.")}
      </p>

      <H2>{tx(t, "alGrd_knapTitle", "Knapsacks: fractional and 0/1")}</H2>
      <p>
        {tx(t, "alGrd_knapBody",
          "A bag holds at most 50 kg. There are three goods: A weighs 10 kg and is worth $60, B weighs 20 kg and is worth $100, C weighs 30 kg and is worth $120. What is the most value that fits? The answer depends on one word in the question: can you take part of a good, or only all or nothing?")}
      </p>
      <p>
        {tx(t, "alGrd_fracBody",
          "In the fractional knapsack you can take any part of a good, like sugar or gold dust, and a part is worth its share of the value. The key number is the value per kilogram, the density: A is worth 60/10 = 6 $/kg, B 100/20 = 5, C 120/30 = 4. Greedy fills the bag with the densest good first: all of A (10 kg, $60), all of B (20 kg, $100), and the remaining 20 kg with C, worth 20/30 × 120 = $80. Total $240. It is correct by exchange: if a solution had room taken by a less dense good while some denser good was left out, swapping a kilogram of the first for a kilogram of the second would not lower the value, so there is always a best solution that follows the density order.")}
      </p>
      <CodeBlock lang="cpp" filename="fractional_knapsack.cpp" t={t}>{`struct Item { double weight, value; };

double fractionalKnapsack(Item* items, int n, double capacity) {
    std::sort(items, items + n, [](const Item& x, const Item& y) {
        return x.value / x.weight > y.value / y.weight;   // densest first
    });
    double total = 0;
    for (int i = 0; i < n && capacity > 0; ++i) {
        double take = std::min(items[i].weight, capacity); // all of it, or what still fits
        total += items[i].value * (take / items[i].weight);
        capacity -= take;
    }
    return total;
}`}</CodeBlock>
      <p>
        {tx(t, "alGrd_zeroOne",
          "In the 0/1 knapsack each good is taken whole or not at all, like a laptop or a camera. The same greedy rule takes A and B (30 kg, $160) and then C does not fit in the 20 kg left: $160. But B and C together weigh exactly 50 kg and are worth $220. The densest-first choice of A was a mistake that could not be undone, because the part of the bag it left empty is useless. Greedy by value (most valuable first) happens to find $220 here, but fails on other inputs: with a 10 kg bag, one 10 kg item worth $10 and two 5 kg items worth $9 each, it takes the $10 item, while the two small ones give $18. No greedy rule is known that solves the 0/1 knapsack; the next chapter solves it with a table.")}
      </p>

      <H2>{tx(t, "alGrd_huffTitle", "Huffman codes")}</H2>
      <p>
        {tx(t, "alGrd_huffBody",
          "A file uses six letters, a to f, and in every 100 letters a appears 45 times, b 13, c 12, d 16, e 9 and f 5. A fixed-length code gives every letter the same number of bits; six letters need 3 bits each (2 bits only give 2² = 4 patterns), so 100 letters take 300 bits. A variable-length code gives frequent letters short codes and rare ones long codes, and can do better. The danger is ambiguity: if a = 0 and b = 01, does 01 mean b, or a followed by something starting with 1?")}
      </p>
      <p>
        {tx(t, "alGrd_prefixBody",
          "The fix is a prefix code: no code is the beginning (prefix) of another. Then a decoder reads bits until they spell a complete code, outputs that letter and starts again, and there is never a choice. A prefix code is exactly a binary trie (Tries chapter) with the letters at the leaves: going left writes 0, going right writes 1, and a letter's code is the path from the root to its leaf. A letter cannot sit at an inner node, because its code would be a prefix of the codes below it. The cost of the code is the total number of bits:")}
      </p>
      <Equation label={tx(t, "alGrd_eqCost", "Bits used by a prefix code")}
        where={[
          [r`f(x)`, tx(t, "alGrd_wF", "how many times the letter x appears in the file (its count)")],
          [r`d(x)`, tx(t, "alGrd_wD", "the depth of x's leaf in the tree, which is the length of its code in bits")],
        ]}
        note={tx(t, "alGrd_eqCostNote", "The best tree makes this sum as small as possible: frequent letters high up, rare letters deep.")}>
        {r`B = \sum_{x} f(x)\, d(x)`}
      </Equation>
      <p>
        {tx(t, "alGrd_huffAlgo",
          "Huffman's algorithm (1952) builds the best tree from the bottom up. Start with one single-node tree per letter, weighted by its count. Repeatedly take the two trees of smallest weight, make them the two children of a new node whose weight is the sum, and put the new tree back. After n − 1 merges one tree remains. On our counts: f + e = 14; c + b = 25; 14 + d = 30; 25 + 30 = 55; a + 55 = 100. The codes come out as a = 0, c = 100, b = 101, d = 111, f = 1100, e = 1101, and the file takes 45·1 + (13 + 12 + 16)·3 + (9 + 5)·4 = 224 bits instead of 300, a quarter less.")}
      </p>

      <HuffmanFigure t={t} />

      <H3>{tx(t, "alGrd_huffWhyTitle", "Why merging the two rarest is safe")}</H3>
      <p>
        {tx(t, "alGrd_huffWhy1",
          "First, in a best tree every inner node has two children: an inner node with one child could be removed, moving its whole subtree up a level and shortening every code in it. So the deepest level holds at least two leaves that are siblings. Second, the two rarest letters x and y can be put there. Take a best tree and swap x with a letter b on the deepest level. x had depth d(x), b had depth d(b) ≥ d(x), and b is at least as common, f(b) ≥ f(x). The change in the total is:")}
      </p>
      <Equation label={tx(t, "alGrd_eqSwap", "Swapping a rare letter deeper never costs bits")}
        where={[
          [r`d(b) - d(x) \ge 0`, tx(t, "alGrd_wDd", "b was at least as deep as x, since b is on the deepest level")],
          [r`f(x) - f(b) \le 0`, tx(t, "alGrd_wFf", "x is the rarest letter, so b is at least as common")],
        ]}
        note={tx(t, "alGrd_eqSwapNote", "A non-positive number times a non-negative one is ≤ 0: the swap keeps the tree best. Do the same with y and the other deepest sibling.")}>
        {r`\big[f(x)\,d(b) + f(b)\,d(x)\big] - \big[f(x)\,d(x) + f(b)\,d(b)\big] = \big(f(x) - f(b)\big)\big(d(b) - d(x)\big)`}
      </Equation>
      <p>
        {tx(t, "alGrd_huffWhy2",
          "That is the greedy choice. For optimal substructure, merge x and y into one new letter z with f(z) = f(x) + f(y). Any tree for the smaller alphabet becomes a tree for the full one by hanging x and y under z's leaf, which puts them one level below z and adds exactly f(x) + f(y) bits. Since that amount is the same whatever the tree, the best tree for the smaller alphabet gives the best tree for the full one, and by induction Huffman's repeated merging is optimal.")}
      </p>
      <CodeBlock lang="cpp" filename="huffman.cpp" t={t}>{`#include <queue>
#include <string>
#include <utility>
#include <vector>

struct HNode { int count; char letter; int left, right; };   // children are indices; -1 means a leaf

// Builds the tree in nodes and returns the root's index. Needs n >= 1.
int buildHuffman(const char* letters, const int* counts, int n, std::vector<HNode>& nodes) {
    using Entry = std::pair<int, int>;                         // (weight, node index)
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;   // lightest on top
    for (int i = 0; i < n; ++i) {
        nodes.push_back({counts[i], letters[i], -1, -1});
        pq.push({counts[i], i});
    }
    while (pq.size() > 1) {
        Entry a = pq.top(); pq.pop();                          // the lightest tree
        Entry b = pq.top(); pq.pop();                          // the second lightest
        nodes.push_back({a.first + b.first, 0, a.second, b.second});
        pq.push({a.first + b.first, (int)nodes.size() - 1});
    }
    return pq.top().second;
}

// Left adds '0', right adds '1'; the path to a leaf is that letter's code.
void assignCodes(const std::vector<HNode>& nodes, int i, std::string& path, std::string* code) {
    if (nodes[i].left < 0) {                                   // a leaf
        code[(unsigned char)nodes[i].letter] = path.empty() ? "0" : path;   // a one-letter file still needs 1 bit
        return;
    }
    path.push_back('0'); assignCodes(nodes, nodes[i].left,  path, code); path.pop_back();
    path.push_back('1'); assignCodes(nodes, nodes[i].right, path, code); path.pop_back();
}`}</CodeBlock>
      <p>
        {tx(t, "alGrd_huffCode",
          "Nodes live in a std::vector and refer to each other by index, which avoids a new for every node. A std::pair compares by its first member and then its second, and std::greater turns the priority queue into a min-heap, so the top is always the lightest tree (ties go to the smaller index). code is an array of 256 strings, one per possible char value. There are n − 1 merges with a few heap operations each, O(n log n) in total. Real compressors such as DEFLATE (zip, PNG) use Huffman codes for their final step; the file must also store the tree, or enough to rebuild it, so the decoder can read it.")}
      </p>

      <H2>{tx(t, "alGrd_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alGrd_w1",
          "1. Rooms for the lectures [9, 10), [9, 12), [10, 11), [11, 12). In start order: [9, 10) opens room 1, heap {10}. [9, 12): the top 10 is later than 9, so open room 2, heap {10, 12}. [10, 11): the top 10 ≤ 10, reuse that room, heap {11, 12}. [11, 12): the top 11 ≤ 11, reuse, heap {12, 12}. Two rooms, and two is the depth: at 9:30, two lectures are running.")}
      </p>
      <p>
        {tx(t, "alGrd_w2",
          "2. Decode 01110101 with the Huffman codes above. Read bits until they form a code: 0 = a. Then 1, 11, 111 = d. Then 0 = a. Then 1, 10, 101 = b. The text is \"adab\": 8 bits, where the fixed 3-bit code needs 12. A word full of rare letters, like \"fe\" (8 bits against 6), comes out longer; Huffman wins on average, weighted by the counts it was built from.")}
      </p>
      <p>
        {tx(t, "alGrd_w3",
          "3. Fractional knapsack, capacity 7 kg, goods P (4 kg, $20), Q (3 kg, $18), R (2 kg, $6). Densities: P 5, Q 6, R 3 $/kg. Take all of Q (3 kg, $18), then P fits exactly in the 4 kg left (4 kg, $20): $38, and R stays out. As a 0/1 knapsack the answer is the same here, since nothing had to be split; greedy is only guaranteed for the fractional version.")}
      </p>

      <H2>{tx(t, "alGrd_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alGrd_tMistake", "Mistake"), tx(t, "alGrd_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alGrd_e1", "Trusting a greedy rule because it seems obvious"), tx(t, "alGrd_e1b", "shortest-first and earliest-start both look sensible and are wrong. Prove the greedy choice by exchange, or compare with a brute-force solver on many small random inputs")],
          [tx(t, "alGrd_e2", "Greedy on the 0/1 knapsack or on arbitrary coins"), tx(t, "alGrd_e2b", "it can miss the best answer by a lot; use dynamic programming (next chapter)")],
          [tx(t, "alGrd_e3", "Mixing closed and half-open intervals"), tx(t, "alGrd_e3b", "with closed [1, 5] and [5, 8] the two share the moment 5. Decide once, and use ≥ or > in the compatibility test to match")],
          [tx(t, "alGrd_e4", "Comparing densities with integer division"), tx(t, "alGrd_e4b", "7 / 2 is 3 in int arithmetic, so different densities compare equal; use double, or cross-multiply: x.value · y.weight > y.value · x.weight")],
          [tx(t, "alGrd_e5", "Taking the two heaviest in Huffman"), tx(t, "alGrd_e5b", "the rarest letters must be merged first, so they end up deepest; the heap must be a min-heap")],
        ]}
      />

      <KeyIdeas t={t} id="alGrd" items={[
        "A greedy algorithm builds the answer one choice at a time, always taking the best-looking piece, and never undoes a choice.",
        "It is correct only when the problem has the greedy-choice property and optimal substructure; prove the first with an exchange argument.",
        "Interval scheduling: earliest finish first is optimal; earliest start and shortest first are not.",
        "Interval partitioning: in start order, reuse the earliest-free room from a min-heap; the number of rooms equals the maximum overlap.",
        "Fractional knapsack: densest first is optimal. For the 0/1 knapsack and for arbitrary coins, greedy fails.",
        "Huffman merges the two lightest trees n − 1 times and produces the shortest prefix code, in O(n log n).",
      ]} />
    </Article>
  );
}
