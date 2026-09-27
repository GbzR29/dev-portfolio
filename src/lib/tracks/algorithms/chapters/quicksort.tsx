"use client";

// Searching & Sorting 4: quicksort — partition around a pivot; Lomuto's
// scheme with its three-region invariant; the recursive sort; best case
// 2T(n/2) + n, worst case T(n − 1) + n − 1 = n(n − 1)/2 on sorted input with
// the last element as pivot; random pivots and the "good pivot" depth
// argument; the exact average 2n ln n via indicators; median of three;
// Hoare's scheme; duplicates and three-way partitioning; O(log n) stack by
// recursing on the smaller side; introsort (std::sort); quickselect; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { PartitionFigure } from "@/components/lesson/figures/algo/PartitionFigure";
import { SortFigure } from "@/components/lesson/figures/algo/SortFigure";

const r = String.raw;

export function QuicksortContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alQuick_intro",
          "Quicksort is also divide and conquer, but it puts the work in the other place. Merge sort splits blindly and does its work when combining. Quicksort does its work when splitting: it rearranges the array so that all the small elements come before all the large ones, and after that nothing needs combining at all. It sorts in place, its inner loop is tiny, and on average it is the fastest general-purpose comparison sort in practice. It also has a famous weakness, a quadratic worst case, and this chapter shows exactly when it strikes and how to make it practically impossible.")}
      </Lead>

      <H2>{tx(t, "alQuick_partTitle", "Partitioning")}</H2>
      <p>
        {tx(t, "alQuick_partBody",
          "Pick one element, the pivot, with value p. Partitioning rearranges a[lo..hi] and returns an index q so that the pivot ends at a[q], every element to its left is ≤ p and every element to its right is > p. The two sides are not sorted, but the pivot is now exactly where it will be in the sorted array: everything smaller is before it, everything bigger after. It never has to move again.")}
      </p>
      <p>
        {tx(t, "alQuick_lomutoBody",
          "Lomuto's scheme takes the last element as the pivot and scans the rest from left to right with an index j, keeping an index i such that three regions hold at every moment: a[lo..i − 1] contains elements ≤ p, a[i..j − 1] contains elements > p, and a[j..hi − 1] has not been looked at yet. To look at a[j]: if it is > p, the second region simply grows by one (j moves on). If it is ≤ p, swap it with a[i], the first element of the second region, and move i on: the first region grows, and the big element that was at a[i] moves to the end of the second region. At the end, swap the pivot into position i, between the two regions.")}
      </p>
      <CodeBlock lang="cpp" filename="partition_lomuto.cpp" t={t}>{`// Partitions a[lo..hi] around p = a[hi]. Returns q with
// a[lo..q-1] <= p, a[q] == p, a[q+1..hi] > p.
int partitionLomuto(int* a, int lo, int hi) {
    int p = a[hi];
    int i = lo;                                // a[lo..i-1] <= p
    for (int j = lo; j < hi; ++j) {            // a[i..j-1] > p
        if (a[j] <= p) {
            swapElems(a, i, j);                // small element joins the left region
            ++i;
        }
    }
    swapElems(a, i, hi);                       // pivot between the two regions
    return i;
}`}</CodeBlock>

      <PartitionFigure t={t} />

      <p>
        {tx(t, "alQuick_partCost",
          "Partitioning n elements makes exactly n − 1 comparisons (each non-pivot element is compared with p once) and at most n swaps: Θ(n) time, O(1) extra memory. swapElems is the helper from the Elementary Sorts chapter.")}
      </p>

      <H2>{tx(t, "alQuick_sortTitle", "Quicksort")}</H2>
      <p>
        {tx(t, "alQuick_sortBody",
          "With partition in hand, the sort is three lines: partition, then sort the left side and the right side recursively. The pivot is excluded from both calls, since it is already in place, so each call works on fewer elements and the recursion must end. Ranges of 0 or 1 elements are the base case.")}
      </p>
      <CodeBlock lang="cpp" filename="quicksort.cpp" t={t}>{`void quickSortRange(int* a, int lo, int hi) {
    if (lo >= hi) return;                      // 0 or 1 elements
    int q = partitionLomuto(a, lo, hi);        // a[q] is final
    quickSortRange(a, lo, q - 1);
    quickSortRange(a, q + 1, hi);
}

void quickSort(int* a, int n) { quickSortRange(a, 0, n - 1); }`}</CodeBlock>

      <SortFigure t={t} algos={["quick", "quick-random"]} />

      <H2>{tx(t, "alQuick_costTitle", "Best case and worst case")}</H2>
      <p>
        {tx(t, "alQuick_bestBody",
          "Everything depends on where the pivot lands. In the best case it is the median (the middle value) every time, so each partition splits its range into two halves. That is merge sort's recurrence, T(n) = 2T(n/2) + cn, and the answer is again Θ(n log n): about n log₂ n comparisons.")}
      </p>
      <p>
        {tx(t, "alQuick_worstBody",
          "In the worst case the pivot is the smallest or largest element every time. One side is empty and the other has n − 1 elements, so each partition only removes the pivot. With the last element as pivot this happens on input that is already sorted, a very common input in real programs. Try it in the figure above: choose \"sorted\" with the last-element pivot and compare the comparison counter with n(n − 1)/2.")}
      </p>
      <Equation label={tx(t, "alQuick_eqWorst", "Worst case: one side empty every time")}
        where={[
          [r`C(n)`, tx(t, "alQuick_wC", "comparisons to sort n elements")],
          [r`n-1`, tx(t, "alQuick_wN1", "the partition of n elements")],
          [r`C(n-1)`, tx(t, "alQuick_wCn1", "the one non-empty side")],
        ]}
        note={tx(t, "alQuick_eqWorstNote", "Unrolling: C(n) = (n − 1) + (n − 2) + … + 1 + 0. Quadratic, as slow as selection sort. The recursion is also n levels deep, and for a sorted array of a million elements that overflows the stack.")}>
        {r`C(n) = C(n-1) + (n-1),\quad C(1) = 0 \quad\Longrightarrow\quad C(n) = \frac{n(n-1)}{2}`}
      </Equation>

      <H2>{tx(t, "alQuick_avgTitle", "Random pivots and the average case")}</H2>
      <p>
        {tx(t, "alQuick_randBody",
          "The fix is to stop letting the input choose the pivot. Pick the pivot at a random position in a[lo..hi] and swap it to the end before partitioning. Now no particular input is bad: a sorted array, a reversed array and a random one all behave the same, and the running time depends only on the luck of the random choices. The question becomes: how long does it take on average over those choices?")}
      </p>
      <CodeBlock lang="cpp" filename="quicksort_random.cpp" t={t}>{`#include <random>

std::mt19937 rng(12345);                       // a random number generator (fixed seed)

int randomIndex(int lo, int hi) {              // uniform in [lo, hi]
    return lo + (int)(rng() % (unsigned)(hi - lo + 1));
}

void quickSortRandom(int* a, int lo, int hi) {
    if (lo >= hi) return;
    swapElems(a, randomIndex(lo, hi), hi);     // a random element becomes the pivot
    int q = partitionLomuto(a, lo, hi);
    quickSortRandom(a, lo, q - 1);
    quickSortRandom(a, q + 1, hi);
}`}</CodeBlock>
      <H3>{tx(t, "alQuick_goodTitle", "Why most pivots are good enough")}</H3>
      <p>
        {tx(t, "alQuick_goodBody",
          "A pivot does not need to be the median. Call it good if it lies in the middle half of the values: at least a quarter of the elements are smaller and at least a quarter are bigger. Half of all elements are good pivots, so a random pivot is good with probability 1/2, and on average one in every two pivots is good. After a good pivot both sides have at most 3/4 of the elements. Follow any single element down the recursion: the range containing it can shrink by a factor 3/4 only log base 4/3 of n times before it reaches size 1, about 2.4 · log₂ n times, and with half the pivots good, the expected depth is about twice that. Each level of the recursion partitions disjoint ranges with at most n elements in total, so each level costs O(n), and the expected total is O(n log n).")}
      </p>
      <H3>{tx(t, "alQuick_exactTitle", "The exact average: 2n ln n")}</H3>
      <p>
        {tx(t, "alQuick_exactBody",
          "The Math track's expectation chapter gives an exact answer through indicator variables. Name the elements by their sorted order, z₁ < z₂ < … < zₙ. Two elements are compared at most once, and only when one of them is the pivot. Look at zᵢ and zⱼ (i < j) and the block zᵢ, zᵢ₊₁, …, zⱼ of j − i + 1 values between them. As long as no pivot has been chosen from this block, the whole block stays together on the same side. The first pivot chosen from the block decides: if it is zᵢ or zⱼ, those two get compared; if it is anything in between, zᵢ and zⱼ are sent to different sides and never meet. With random pivots, every element of the block is equally likely to be first, so the probability is 2/(j − i + 1).")}
      </p>
      <Equation label={tx(t, "alQuick_eqAvg", "Expected comparisons with random pivots")}
        where={[
          [r`z_i, z_j`, tx(t, "alQuick_wZ", "the i-th and j-th smallest elements")],
          [r`\tfrac{2}{j-i+1}`, tx(t, "alQuick_wP", "the probability that they are ever compared")],
          [r`k = j - i + 1`, tx(t, "alQuick_wK", "the size of the block from zᵢ to zⱼ")],
          [r`H_n`, tx(t, "alQuick_wH", "the harmonic number 1 + 1/2 + … + 1/n, which grows like ln n (Math track, Series)")],
        ]}
        note={tx(t, "alQuick_eqAvgNote", "By linearity of expectation, the expected number of comparisons is the sum of these probabilities over all pairs. For each i the inner sum is at most 2(1/2 + 1/3 + … + 1/n) < 2 ln n, and there are fewer than n values of i. So the average is below 2n ln n ≈ 1.39 n log₂ n (since ln n = log₂ n · ln 2 ≈ 0.693 log₂ n): only 39% more comparisons than the best case.")}>
        {r`\mathbb{E}[C] = \sum_{i<j} \frac{2}{j-i+1} \;\le\; \sum_{i=1}^{n-1}\,\sum_{k=2}^{n} \frac{2}{k} \;<\; 2n\,(H_n - 1) \;<\; 2n\ln n`}
      </Equation>
      <Callout type="tip" t={t}>
        {tx(t, "alQuick_whyFast", "Quicksort usually makes more comparisons than merge sort (1.39 n log₂ n against at most n log₂ n), yet it is usually faster. Its inner loop is a comparison, an increment and a rare swap on data that is read in order, with no copying into a buffer and back. The work per comparison is smaller, and the cache (Memory chapter) is used very well.")}
      </Callout>
      <p>
        {tx(t, "alQuick_median3",
          "A common alternative to a random pivot is the median of three: look at a[lo], a[mid] and a[hi] and use the middle one of those three values. It costs a couple of comparisons, removes the sorted and reversed worst cases completely, and gives better splits on average. Specially constructed inputs can still defeat it, which is why libraries add the safety net described below.")}
      </p>

      <H2>{tx(t, "alQuick_hoareTitle", "Hoare's partition")}</H2>
      <p>
        {tx(t, "alQuick_hoareBody",
          "Tony Hoare, who invented quicksort in 1959, partitioned differently. Two fingers start at the two ends and move towards each other. i moves right past elements < p, j moves left past elements > p. When both are stuck, a[i] belongs on the right and a[j] on the left, so swapping them fixes both at once. When the fingers cross, the array is split at j: a[lo..j] ≤ p ≤ a[j + 1..hi]. It makes about a third as many swaps as Lomuto on random data, and it handles many equal keys well, because both fingers stop on elements equal to p and swapping them keeps the split balanced. Unlike Lomuto, the pivot is not necessarily at its final place afterwards, so the recursion includes j on the left side.")}
      </p>
      <CodeBlock lang="cpp" filename="partition_hoare.cpp" t={t}>{`// Afterwards a[lo..j] <= p and a[j+1..hi] >= p, with lo <= j < hi.
int partitionHoare(int* a, int lo, int hi) {
    int p = a[lo + (hi - lo) / 2];             // the middle element as pivot
    int i = lo - 1, j = hi + 1;
    while (true) {
        do { ++i; } while (a[i] < p);          // stops at an element >= p
        do { --j; } while (a[j] > p);          // stops at an element <= p
        if (i >= j) return j;                  // the fingers crossed
        swapElems(a, i, j);                    // both were on the wrong side
    }
}

void quickSortHoare(int* a, int lo, int hi) {
    if (lo >= hi) return;
    int j = partitionHoare(a, lo, hi);
    quickSortHoare(a, lo, j);                  // j included: the pivot is not fixed
    quickSortHoare(a, j + 1, hi);
}`}</CodeBlock>
      <p>
        {tx(t, "alQuick_hoareSafe",
          "Why the fingers never run off the ends: in the first round the pivot itself stops both fingers. After every swap, a[i] ≤ p sits to the left of j and a[j] ≥ p to the right of i, and those elements stop the fingers in the next round. Switch the figure above to Hoare to watch it.")}
      </p>

      <H2>{tx(t, "alQuick_dupTitle", "Many equal keys")}</H2>
      <p>
        {tx(t, "alQuick_dupBody",
          "Lomuto's scheme has a nasty case: an array where all elements are equal. Every element is ≤ p, so everything goes to the left side, the pivot lands at the end, and we are back at n(n − 1)/2 comparisons, random pivot or not. Data with only a few distinct values (ages, grades, status codes) is common, so this matters. The cure is to split into three parts, < p, = p and > p, and recurse only on the first and last. This three-way partition, known as the Dutch national flag problem (three colours in bands), is due to Dijkstra.")}
      </p>
      <CodeBlock lang="cpp" filename="quicksort_3way.cpp" t={t}>{`// Afterwards a[lo..lt-1] < p, a[lt..gt] == p, a[gt+1..hi] > p.
void quickSort3(int* a, int lo, int hi) {
    if (lo >= hi) return;
    int p = a[lo];
    int lt = lo, i = lo + 1, gt = hi;
    while (i <= gt) {                           // a[i..gt] not looked at yet
        if      (a[i] < p) swapElems(a, lt++, i++);
        else if (a[i] > p) swapElems(a, i, gt--);   // i stays: the new a[i] is unseen
        else               ++i;
    }
    quickSort3(a, lo, lt - 1);                  // the equal block is done
    quickSort3(a, gt + 1, hi);
}`}</CodeBlock>
      <p>
        {tx(t, "alQuick_dupCost",
          "Now an array of n equal elements takes a single pass, and an array with only k distinct values needs about n log k comparisons rather than n log n. Try \"few distinct\" in the sorting figure with the two-way version to see the waste this avoids. (This version uses a[lo] as pivot for brevity; pick a random one and swap it to lo in real code.)")}
      </p>

      <H2>{tx(t, "alQuick_stackTitle", "Keeping the stack small")}</H2>
      <p>
        {tx(t, "alQuick_stackBody",
          "Even with random pivots, one unlucky run can recurse deeply, and each level costs a stack frame. A simple change bounds the depth for certain: recurse only into the smaller side and handle the larger side with a loop. The smaller side has at most half the elements, so every recursive call at least halves the size, and the depth can never exceed log₂ n. This is the tail-call-to-loop conversion from the Recursion chapter, applied to the larger call.")}
      </p>
      <CodeBlock lang="cpp" filename="quicksort_small_stack.cpp" t={t}>{`void quickSortSmallStack(int* a, int lo, int hi) {
    while (lo < hi) {
        int q = partitionLomuto(a, lo, hi);
        if (q - lo < hi - q) {                     // left side is smaller
            quickSortSmallStack(a, lo, q - 1);     // recurse on it
            lo = q + 1;                            // loop on the right side
        } else {
            quickSortSmallStack(a, q + 1, hi);
            hi = q - 1;
        }
    }
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "alQuick_intro_sort", "std::sort in C++ is introsort (introspective sort): quicksort with a median-of-three pivot, insertion sort for small ranges, and a watchdog. If the recursion gets deeper than about 2 log₂ n, meaning the pivots have been bad, it switches that range to heapsort, which is Θ(n log n) in the worst case (Heaps chapter, later in the track). The result is quicksort's speed with a guaranteed n log n bound. std::sort is not stable; use std::stable_sort when that matters.")}
      </Callout>

      <H2>{tx(t, "alQuick_selectTitle", "Quickselect: the k-th smallest")}</H2>
      <p>
        {tx(t, "alQuick_selectBody",
          "Partitioning also answers a different question: what is the k-th smallest element (the median, for example) without sorting everything? After a partition the pivot is at its final index q. If q == k, it is the answer. If k < q, the answer is on the left, otherwise on the right, and only that side needs further work. With good pivots the sizes go n, n/2, n/4, …, so the work is n + n/2 + n/4 + … < 2n: linear time on average, faster than sorting. C++ offers it as std::nth_element.")}
      </p>
      <CodeBlock lang="cpp" filename="quickselect.cpp" t={t}>{`// Returns the k-th smallest element (k = 0 is the minimum). Rearranges a.
int quickSelect(int* a, int n, int k) {
    int lo = 0, hi = n - 1;
    while (lo < hi) {
        swapElems(a, randomIndex(lo, hi), hi);
        int q = partitionLomuto(a, lo, hi);
        if (q == k) return a[q];
        if (k < q) hi = q - 1;                     // the answer is on the left
        else       lo = q + 1;                     // or on the right
    }
    return a[k];
}`}</CodeBlock>

      <H2>{tx(t, "alQuick_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alQuick_w1",
          "1. Lomuto on [7, 2, 1, 8, 6, 3, 5, 4], pivot p = 4. i = 0. j = 0: 7 > 4, skip. j = 1: 2 ≤ 4, swap a[0] and a[1]: [2, 7, 1, 8, 6, 3, 5, 4], i = 1. j = 2: 1 ≤ 4, swap a[1] and a[2]: [2, 1, 7, 8, 6, 3, 5, 4], i = 2. j = 3, 4: 8 and 6 skip. j = 5: 3 ≤ 4, swap a[2] and a[5]: [2, 1, 3, 8, 6, 7, 5, 4], i = 3. j = 6: 5 skip. Final swap a[3] and a[7]: [2, 1, 3, 4, 6, 7, 5, 8]. The pivot 4 is at index 3, its sorted position; 7 comparisons, 3 swaps plus the final one.")}
      </p>
      <p>
        {tx(t, "alQuick_w2",
          "2. Sorted input [1, 2, …, 10] with the last element as pivot. The first partition compares 9 elements with 10 and leaves [1..9] on the left; then 8 comparisons, and so on: 9 + 8 + … + 1 = 45 = 10 · 9/2 comparisons and a recursion 10 levels deep. With random pivots the expected count is below 2 · 10 · (H₁₀ − 1) ≈ 2 · 10 · 1.93 ≈ 39 (the exact average is about 24; the bound is generous for small n), and for large n the gap becomes enormous: for n = 10⁶, about 5 · 10¹¹ against about 2.8 · 10⁷.")}
      </p>
      <p>
        {tx(t, "alQuick_w3",
          "3. The median of [9, 1, 7, 3, 5] with quickselect, k = 2, taking the last element as pivot for this hand trace: p = 5, partition gives [1, 3, 5, 9, 7] with q = 2 = k. The median is 5, after only 4 comparisons.")}
      </p>

      <H2>{tx(t, "alQuick_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alQuick_tMistake", "Mistake"), tx(t, "alQuick_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alQuick_e1", "Always using the first or last element as pivot"), tx(t, "alQuick_e1b", "sorted or reversed input becomes quadratic and overflows the stack. Use a random pivot or the median of three")],
          [tx(t, "alQuick_e2", "Including the pivot in a Lomuto recursion"), tx(t, "alQuick_e2b", "recursing on [lo, q] can repeat the same range forever. The pivot is final: use q − 1 and q + 1")],
          [tx(t, "alQuick_e3", "Excluding j in a Hoare recursion"), tx(t, "alQuick_e3b", "Hoare's j is not the pivot's final place. Recurse on [lo, j] and [j + 1, hi]")],
          [tx(t, "alQuick_e4", "Ignoring duplicates"), tx(t, "alQuick_e4b", "all-equal data is quadratic with Lomuto. Use Hoare's scheme or a three-way partition")],
          [tx(t, "alQuick_e5", "Expecting stability"), tx(t, "alQuick_e5b", "partitioning swaps over long distances, so equal keys get reordered. Use merge sort (std::stable_sort) when order among equals matters")],
        ]}
      />

      <KeyIdeas t={t} id="alQuick" items={[
        "Partitioning puts the pivot in its final place with smaller elements left and bigger ones right: n − 1 comparisons, in place.",
        "Quicksort: partition, then sort both sides; no combine step.",
        "Balanced splits give Θ(n log n); a pivot that is always the minimum or maximum gives n(n − 1)/2, as on sorted input with the last element as pivot.",
        "With random pivots, two elements are compared with probability 2/(j − i + 1), and the average is below 2n ln n ≈ 1.39 n log₂ n.",
        "Hoare's scheme swaps less and copes with duplicates; a three-way partition makes equal keys free.",
        "Recursing on the smaller side bounds the stack at log₂ n; std::sort adds a heapsort fallback (introsort).",
        "Quickselect finds the k-th smallest in linear time on average.",
      ]} />
    </Article>
  );
}
