"use client";

// Searching & Sorting 2: elementary sorts — what sorting means (order, keys
// and records, in place, stable, cost measured in comparisons and moves);
// selection sort with its exact n(n − 1)/2 comparisons; bubble sort and the
// early exit; inversions: adjacent swaps remove exactly one, the maximum
// n(n − 1)/2 and the average n(n − 1)/4 by linearity of expectation; insertion
// sort as Θ(n + I); stability with a two-key example; comparison table; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { SortFigure } from "@/components/lesson/figures/algo/SortFigure";

const r = String.raw;

export function ElementarySortsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alElem_intro",
          "Sorting puts data in order, and the previous chapter showed what that buys: binary search, duplicates next to each other, the smallest and largest at the ends. This chapter builds the three simplest sorting algorithms, selection, bubble and insertion sort. They are all slow on large inputs, and the reason they are slow, the idea of inversions, explains exactly what the faster algorithms of the next chapters must do differently. Insertion sort, the best of the three, is also still used inside every fast sort for small pieces of data.")}
      </Lead>

      <H2>{tx(t, "alElem_defTitle", "What sorting means")}</H2>
      <p>
        {tx(t, "alElem_defBody",
          "Sorting an array a of n elements means rearranging its elements so that a[0] ≤ a[1] ≤ … ≤ a[n − 1]. The result must contain exactly the same elements, only in a different order (a permutation of the input). The value used for ordering is the key. Often the elements are records with several fields, such as a student with a name and a grade, and only one field is the key.")}
      </p>
      <LessonTable
        headers={[tx(t, "alElem_tTerm", "Term"), tx(t, "alElem_tMeaning", "Meaning")]}
        rows={[
          [tx(t, "alElem_term1", "comparison"), tx(t, "alElem_term1b", "asking whether one key is smaller than another. The algorithms in this chapter learn about the data only through comparisons, so counting them measures their work")],
          [tx(t, "alElem_term2", "swap / move"), tx(t, "alElem_term2b", "exchanging two elements, or copying one to a new position. Moving large records is expensive, so this is counted separately")],
          [tx(t, "alElem_term3", "in place"), tx(t, "alElem_term3b", "the algorithm needs only O(1) extra memory besides the array itself: a few variables, no second array")],
          [tx(t, "alElem_term4", "stable"), tx(t, "alElem_term4b", "elements with equal keys keep the order they had in the input")],
        ]}
      />
      <p>
        {tx(t, "alElem_swapBody",
          "Every algorithm below uses the same helper to exchange two elements. It needs a temporary variable, because after a[i] = a[j] the old value of a[i] would be lost.")}
      </p>
      <CodeBlock lang="cpp" filename="swap.cpp" t={t}>{`void swapElems(int* a, int i, int j) {
    int tmp = a[i];      // keep a[i] before it is overwritten
    a[i] = a[j];
    a[j] = tmp;
}`}</CodeBlock>

      <H2>{tx(t, "alElem_selTitle", "Selection sort")}</H2>
      <p>
        {tx(t, "alElem_selBody",
          "The most direct idea: find the smallest element and put it first; then find the smallest of the rest and put it second; and so on. After round i, the positions 0 to i hold the i + 1 smallest elements in order, and they never move again. Finding the minimum of the unsorted part a[i..n − 1] is a linear scan, remembering the index of the smallest value seen so far.")}
      </p>
      <CodeBlock lang="cpp" filename="selection_sort.cpp" t={t}>{`void selectionSort(int* a, int n) {
    for (int i = 0; i + 1 < n; ++i) {            // a[0..i-1] is sorted and final
        int m = i;                                // index of the smallest so far
        for (int j = i + 1; j < n; ++j)
            if (a[j] < a[m]) m = j;
        if (m != i) swapElems(a, i, m);           // the minimum goes to position i
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alElem_selTrace",
          "Trace on [5, 2, 4, 6, 1, 3]. Round 0: the minimum of all six is 1 (index 4); swap it with a[0]: [1, 2, 4, 6, 5, 3]. Round 1: the minimum of a[1..5] is 2, already in place. Round 2: the minimum of a[2..5] is 3; swap with a[2]: [1, 2, 3, 6, 5, 4]. Round 3: minimum 4, swap with a[3]: [1, 2, 3, 4, 5, 6]. Round 4: 5 is already in place. The last element needs no round: once the other n − 1 are in place, it is too.")}
      </p>
      <Equation label={tx(t, "alElem_eqSel", "Comparisons made by selection sort")}
        where={[
          [r`n - 1 - i`, tx(t, "alElem_wSelI", "comparisons in round i: j runs from i + 1 to n − 1")],
          [r`\tfrac{n(n-1)}{2}`, tx(t, "alElem_wSelSum", "Gauss's sum 1 + 2 + … + (n − 1)")],
        ]}
        note={tx(t, "alElem_eqSelNote", "Always exactly this many, whatever the input: selection sort cannot know the rest is sorted without looking. n = 10 gives 45 comparisons, n = 1000 gives 499 500. At most n − 1 swaps, which is its one strength.")}>
        {r`(n-1) + (n-2) + \dots + 1 = \sum_{i=0}^{n-2} (n-1-i) = \frac{n(n-1)}{2} = \Theta(n^2)`}
      </Equation>

      <SortFigure t={t} algos={["selection", "bubble", "insertion"]} />

      <H2>{tx(t, "alElem_bubTitle", "Bubble sort")}</H2>
      <p>
        {tx(t, "alElem_bubBody",
          "Bubble sort only ever compares neighbours. Walk through the array comparing a[j] with a[j + 1] and swap them when they are in the wrong order. After one full pass the largest element has been carried all the way to the end, like a bubble rising, because every comparison it takes part in moves it one step right. So the pass after that can stop one position earlier, and after n − 1 passes everything is in place. If a whole pass makes no swap, every neighbouring pair is in order, which means the array is sorted, and we can stop early.")}
      </p>
      <CodeBlock lang="cpp" filename="bubble_sort.cpp" t={t}>{`void bubbleSort(int* a, int n) {
    for (int pass = 0; pass + 1 < n; ++pass) {        // a[n-pass..n-1] is final
        bool swapped = false;
        for (int j = 0; j + 1 < n - pass; ++j) {
            if (a[j] > a[j + 1]) {                     // neighbours out of order
                swapElems(a, j, j + 1);
                swapped = true;
            }
        }
        if (!swapped) return;                          // no swap: already sorted
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alElem_bubCost",
          "Without the early exit the passes make (n − 1) + (n − 2) + … + 1 = n(n − 1)/2 comparisons, like selection sort. With it, an already sorted array costs one pass, n − 1 comparisons. On [5, 2, 4, 6, 1, 3] it makes five passes, 5 + 4 + 3 + 2 + 1 = 15 comparisons and 9 swaps; the fifth pass finds nothing to swap. Bubble sort swaps far more than selection sort, and in practice it is the slowest of the three. It is taught because its swaps lead straight to the key idea of this chapter.")}
      </p>

      <H2>{tx(t, "alElem_invTitle", "Inversions: measuring disorder")}</H2>
      <p>
        {tx(t, "alElem_invBody",
          "An inversion is a pair of positions i < j whose elements are in the wrong order: a[i] > a[j]. A sorted array has 0 inversions. [3, 1, 2] has 2: the pairs (3, 1) and (3, 2). [5, 2, 4, 6, 1, 3] has 9: 5 is bigger than the four elements 2, 4, 1, 3 after it, 2 than 1, 4 than 1 and 3, 6 than 1 and 3, giving 4 + 1 + 2 + 2 = 9. The number of inversions, written I, measures how far an array is from sorted.")}
      </p>
      <p>
        {tx(t, "alElem_invKey",
          "Now the key fact. Swapping two neighbours that are out of order removes exactly one inversion: that pair itself. Every other pair keeps its relative order, since an element outside the two sees both of them on the same side as before. So an algorithm that only swaps neighbours needs exactly I swaps, no more and no fewer. Bubble sort made 9 swaps on an array with 9 inversions; that was not a coincidence.")}
      </p>
      <Equation label={tx(t, "alElem_eqInv", "How many inversions")}
        where={[
          [r`I`, tx(t, "alElem_wI", "the number of pairs i < j with a[i] > a[j]")],
          [r`\binom{n}{2}`, tx(t, "alElem_wPairs", "the number of pairs of positions, n(n − 1)/2 (Math track, Counting)")],
          [r`\mathbb{E}[I]`, tx(t, "alElem_wE", "the expected (average) number when all orders of n distinct values are equally likely")],
        ]}
        note={tx(t, "alElem_eqInvNote", "Maximum: a reversed array, where every pair is inverted. Average: each pair is inverted in exactly half of the orders (swap the two values to go from one to the other), so by linearity of expectation (Math track, Expectation) the average is half the number of pairs.")}>
        {r`0 \;\le\; I \;\le\; \binom{n}{2} = \frac{n(n-1)}{2}, \qquad \mathbb{E}[I] = \frac{1}{2}\binom{n}{2} = \frac{n(n-1)}{4}`}
      </Equation>
      <Callout type="info" t={t}>
        {tx(t, "alElem_invBound", "The consequence: any algorithm that only swaps neighbours needs n(n − 1)/4 swaps on average, which is Θ(n²). No clever trick can fix bubble sort or insertion sort. To be faster, an algorithm must move elements over long distances, so that one move can fix many inversions at once. Merge sort and quicksort, the next two chapters, do exactly that.")}
      </Callout>

      <H2>{tx(t, "alElem_insTitle", "Insertion sort")}</H2>
      <p>
        {tx(t, "alElem_insBody",
          "This is how most people sort a hand of cards: pick up the cards one by one and slide each into its place among the ones already held. In an array: a[0..i − 1] is already sorted (not final, just sorted among itself). Take the key a[i], and while the element to its left is bigger, shift that element one position right; when the left neighbour is ≤ key, or there is none, drop the key into the gap. Shifting instead of swapping copies each element once instead of three times.")}
      </p>
      <CodeBlock lang="cpp" filename="insertion_sort.cpp" t={t}>{`void insertionSort(int* a, int n) {
    for (int i = 1; i < n; ++i) {                // a[0..i-1] is sorted
        int key = a[i];
        int j = i;
        while (j > 0 && a[j - 1] > key) {        // bigger neighbour: make room
            a[j] = a[j - 1];                     // shift it one step right
            --j;
        }
        a[j] = key;                              // the gap is where key belongs
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alElem_insTrace",
          "Trace on [5, 2, 4, 6, 1, 3]. Insert 2: 5 shifts right, [2, 5, 4, 6, 1, 3]. Insert 4: 5 shifts, 2 stays, [2, 4, 5, 6, 1, 3]. Insert 6: 5 ≤ 6, nothing moves. Insert 1: 6, 5, 4, 2 all shift, [1, 2, 4, 5, 6, 3]. Insert 3: 6, 5, 4 shift, [1, 2, 3, 4, 5, 6]. Shifts: 1 + 1 + 0 + 4 + 3 = 9, the number of inversions again, since each shift is a neighbour swap in disguise.")}
      </p>
      <H3>{tx(t, "alElem_insCostTitle", "Its cost depends on the input")}</H3>
      <p>
        {tx(t, "alElem_insCost",
          "Each shift fixes one inversion, so there are exactly I shifts. Each comparison either causes a shift or stops the inner loop, and the inner loop stops at most once per key, so the comparisons number between I and I + (n − 1): 12 in the trace above (9 shifts, plus one stopping comparison for each of the 5 keys, minus 2 for the keys 2 and 1, which reached the front and stopped without one). Therefore insertion sort takes Θ(n + I) time.")}
      </p>
      <LessonTable
        headers={[tx(t, "alElem_tInput", "Input"), tx(t, "alElem_tInv", "Inversions I"), tx(t, "alElem_tInsCost", "Insertion sort")]}
        rows={[
          [tx(t, "alElem_in1", "already sorted"), "0", tx(t, "alElem_in1b", "n − 1 comparisons, no shifts: Θ(n)")],
          [tx(t, "alElem_in2", "nearly sorted (each element at most k places from its spot)"), tx(t, "alElem_in2b", "at most k · n"), "Θ(k n)"],
          [tx(t, "alElem_in3", "random order"), "≈ n²/4", "Θ(n²)"],
          [tx(t, "alElem_in4", "reversed"), "n(n − 1)/2", tx(t, "alElem_in4b", "Θ(n²), the worst case")],
        ]}
      />
      <p>
        {tx(t, "alElem_insUse",
          "This adaptivity is why insertion sort survives. Data that is almost in order (a list that was sorted and then had a few items added at the end, values re-sorted after each changed only a little) sorts in nearly linear time. And for tiny arrays of up to about 16 elements, its simple inner loop beats the faster algorithms, which is why the library sorts of C++ switch to insertion sort once the pieces they work on are small enough.")}
      </p>

      <H2>{tx(t, "alElem_stableTitle", "Stability")}</H2>
      <p>
        {tx(t, "alElem_stableBody",
          "Stability only matters when records have more than one field. Suppose a class list is already sorted by name, and you now sort it by grade. With a stable sort, students with the same grade stay in name order, so the result is sorted by grade and, within each grade, by name. With an unstable sort, students with equal grades come out in some arbitrary order. Sorting by the secondary key first and then stably by the primary key is a standard technique; radix sort, two chapters from now, is built on it.")}
      </p>
      <p>
        {tx(t, "alElem_stableWhich",
          "Insertion sort is stable: a key stops as soon as its left neighbour is ≤ key, so it never jumps over an equal element. Bubble sort is stable for the same reason (it swaps only when a[j] > a[j + 1], strictly). Selection sort is not: on [2a, 2b, 1] (two records with key 2, labelled a and b), round 0 swaps 1 with the first element, giving [1, 2b, 2a]. The long-distance swap jumped 2a over 2b.")}
      </p>
      <LessonTable
        headers={[tx(t, "alElem_tAlgo", "Algorithm"), tx(t, "alElem_tCmp", "Comparisons"), tx(t, "alElem_tMoves", "Swaps / shifts"), tx(t, "alElem_tBest", "Best case"), tx(t, "alElem_tStable", "Stable"), tx(t, "alElem_tPlace", "In place")]}
        rows={[
          [tx(t, "alElem_a1", "selection"), tx(t, "alElem_a1c", "n(n − 1)/2 always"), tx(t, "alElem_a1m", "≤ n − 1 swaps"), "Θ(n²)", tx(t, "alElem_no", "no"), tx(t, "alElem_yes", "yes")],
          [tx(t, "alElem_a2", "bubble (early exit)"), tx(t, "alElem_a2c", "n − 1 to n(n − 1)/2"), tx(t, "alElem_a2m", "I swaps"), "Θ(n)", tx(t, "alElem_yes", "yes"), tx(t, "alElem_yes", "yes")],
          [tx(t, "alElem_a3", "insertion"), tx(t, "alElem_a3c", "I to I + n − 1"), tx(t, "alElem_a3m", "I shifts"), "Θ(n)", tx(t, "alElem_yes", "yes"), tx(t, "alElem_yes", "yes")],
        ]}
      />

      <H2>{tx(t, "alElem_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alElem_w1",
          "1. Count the inversions of [4, 3, 2, 1]. Every one of the C(4, 2) = 6 pairs is inverted, so I = 6 = 4 · 3/2, the maximum. Insertion sort on it: inserting 3 shifts 1 element, 2 shifts 2, 1 shifts 3; total 6 shifts and 6 comparisons (every key reaches the front, so there are no stopping comparisons).")}
      </p>
      <p>
        {tx(t, "alElem_w2",
          "2. How long for n = 100 000 random values? Insertion sort does about n²/4 = 2.5 · 10⁹ shifts. At roughly 10⁹ simple steps per second that is a few seconds, while the n log n sorts of the next chapters need about 1.7 million comparisons, a few milliseconds. For n = 1000 the quadratic sort needs 250 000 shifts, under a millisecond: fine.")}
      </p>
      <p>
        {tx(t, "alElem_w3",
          "3. Selection sort on [3, 1, 2]: round 0 finds 1 (2 comparisons), swaps: [1, 3, 2]; round 1 finds 2 (1 comparison), swaps: [1, 2, 3]. 3 comparisons = 3 · 2/2, and 2 swaps even though the array had 2 inversions; with other inputs the swap count and the inversion count differ, because selection sort's swaps are not between neighbours.")}
      </p>

      <H2>{tx(t, "alElem_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alElem_tMistake", "Mistake"), tx(t, "alElem_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alElem_e1", "Inner loop bound j < n in bubble sort"), tx(t, "alElem_e1b", "reads a[j + 1] = a[n], past the end. The last pair is (n − 2, n − 1): loop while j + 1 < n − pass")],
          [tx(t, "alElem_e2", "Testing a[j − 1] > key before j > 0"), tx(t, "alElem_e2b", "reads a[−1] when the key reaches the front. Keep j > 0 first: && stops at the first false")],
          [tx(t, "alElem_e3", "Using ≥ instead of >"), tx(t, "alElem_e3b", "equal elements get swapped or shifted past each other: extra work, and the sort is no longer stable")],
          [tx(t, "alElem_e4", "Swapping without a temporary"), tx(t, "alElem_e4b", "a[i] = a[j]; a[j] = a[i]; leaves both equal to the old a[j]. Save a[i] first")],
          [tx(t, "alElem_e5", "Using a quadratic sort on large inputs"), tx(t, "alElem_e5b", "fine for a thousand elements, hopeless for a million. Use them for small or nearly sorted data")],
        ]}
      />

      <KeyIdeas t={t} id="alElem" items={[
        "Sorting rearranges the elements into non-decreasing order of their key; its cost is counted in comparisons and moves.",
        "Selection sort always makes n(n − 1)/2 comparisons but at most n − 1 swaps; it is not stable.",
        "An inversion is a pair in the wrong order; a neighbour swap removes exactly one.",
        "There are at most n(n − 1)/2 inversions and n(n − 1)/4 on average, so any neighbour-swapping sort is Θ(n²) on average.",
        "Insertion sort takes Θ(n + I): linear on sorted or nearly sorted input, and the fastest choice for tiny arrays.",
        "A stable sort keeps equal keys in input order, which lets you sort by several keys one after the other.",
      ]} />
    </Article>
  );
}
