"use client";

// Searching & Sorting 3: merge sort — divide and conquer (divide, conquer,
// combine); merging two sorted runs with ≤ n − 1 comparisons and ≤ keeping
// it stable; the recursive sort with one shared buffer; the recurrence
// T(n) = 2T(n/2) + cn solved by the recursion tree and by unrolling, the
// n⌈log₂ n⌉ comparison bound; Θ(n) extra space; bottom-up merge sort; two
// practical improvements; counting inversions while merging; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MergeFigure } from "@/components/lesson/figures/algo/MergeFigure";
import { SortFigure } from "@/components/lesson/figures/algo/SortFigure";

const r = String.raw;

export function MergeSortContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alMerge_intro",
          "The previous chapter ended with a limit: sorting by swapping neighbours costs Θ(n²) on average, because each swap fixes only one inversion. Merge sort gets around it with a different strategy: cut the array in half, sort each half, and then merge the two sorted halves in a single pass. The result is Θ(n log n) comparisons in every case, which for a million elements means about 20 million steps instead of 250 billion.")}
      </Lead>

      <Goals t={t} id="alMerge" items={[
        "Merge two sorted runs in one pass.",
        "Sort with merge sort, top-down and bottom-up.",
        "Explain why merge sort takes n log n steps in every case.",
        "Count inversions with a small change to merge sort.",
      ]} />

      <H2>{tx(t, "alMerge_dcTitle", "Divide and conquer")}</H2>
      <p>
        {tx(t, "alMerge_dcBody",
          "Divide and conquer is a way of designing recursive algorithms in three steps. Divide: split the problem into smaller problems of the same kind. Conquer: solve them recursively (a small enough problem is solved directly, the base case). Combine: build the answer to the whole problem from the answers to the parts. For merge sort: divide the array into a left half and a right half; conquer by sorting each half recursively (an array of 0 or 1 elements is already sorted); combine by merging the two sorted halves into one. The dividing is trivial; all the real work happens in the merge.")}
      </p>

      <H2>{tx(t, "alMerge_mergeTitle", "Merging two sorted runs")}</H2>
      <p>
        {tx(t, "alMerge_mergeBody",
          "A run is a stretch of the array that is already sorted. Given two sorted runs L and R, the smallest element of all is the front of L or the front of R, because each front is the smallest of its own run. So compare the two fronts, copy the smaller to the output and move past it; the next smallest is again one of the two fronts. When one run is used up, the rest of the other is copied as it is. It is like merging two sorted piles of exam papers into one: you only ever look at the top sheet of each pile.")}
      </p>

      <MergeFigure t={t} />

      <p>
        {tx(t, "alMerge_mergeCost",
          "The cost is easy to count exactly. Every comparison sends one element to the output, and the last element always goes out without a comparison (the other run is empty by then), so merging n elements in total needs at most n − 1 comparisons. It may need fewer: if every element of L is smaller than every element of R, it takes only |L| comparisons (|L| is the number of elements of L) and then copies R. Either way it writes each of the n elements once: Θ(n) time.")}
      </p>
      <p>
        {tx(t, "alMerge_stable",
          "On a tie, the element from L goes first: the test is L[i] ≤ R[j], not <. Every element of L came before every element of R in the input, so taking from the left on ties keeps equal keys in their original order. That one character makes merge sort stable.")}
      </p>

      <H2>{tx(t, "alMerge_codeTitle", "The algorithm")}</H2>
      <p>
        {tx(t, "alMerge_codeBody",
          "Merging needs somewhere to put the output; it cannot happen inside the same positions without overwriting elements that are still needed. The usual solution copies the range into a buffer and merges from the buffer back into the array. The buffer is allocated once, as large as the whole array, and shared by all the recursive calls, instead of a new allocation in every call.")}
      </p>
      <CodeBlock lang="cpp" filename="merge_sort.cpp" t={t}>{`// Merges the sorted runs a[lo..mid] and a[mid+1..hi]; aux has room for all of a.
void merge(int* a, int* aux, int lo, int mid, int hi) {
    for (int k = lo; k <= hi; ++k) aux[k] = a[k];     // copy the two runs out
    int i = lo, j = mid + 1;                          // fronts of the left and right runs
    for (int k = lo; k <= hi; ++k) {
        if      (i > mid)          a[k] = aux[j++];   // left run used up
        else if (j > hi)           a[k] = aux[i++];   // right run used up
        else if (aux[i] <= aux[j]) a[k] = aux[i++];   // <= : ties go left (stable)
        else                       a[k] = aux[j++];
    }
}

void sortRange(int* a, int* aux, int lo, int hi) {    // sorts a[lo..hi]
    if (lo >= hi) return;                             // 0 or 1 elements: sorted
    int mid = lo + (hi - lo) / 2;
    sortRange(a, aux, lo, mid);                       // conquer the left half
    sortRange(a, aux, mid + 1, hi);                   // conquer the right half
    merge(a, aux, lo, mid, hi);                       // combine
}

void mergeSort(int* a, int n) {
    int* aux = new int[n];                            // one buffer for every merge
    sortRange(a, aux, 0, n - 1);
    delete[] aux;
}`}</CodeBlock>
      <p>
        {tx(t, "alMerge_traceBody",
          "Trace on [38, 27, 43, 3, 9, 82, 10]. mid = 3 splits it into [38, 27, 43, 3] and [9, 82, 10]. The left half splits into [38, 27] and [43, 3], and those into single elements, which merge back as [27, 38] and [3, 43], and then as [3, 27, 38, 43]. The right half becomes [9, 82] and [10], merged into [9, 10, 82]. The final merge gives [3, 9, 10, 27, 38, 43, 82]. Watch the same pattern in the figure below: the shaded band is the range being merged, and the merges get longer as the recursion climbs back up.")}
      </p>

      <SortFigure t={t} algos={["merge", "insertion"]} />

      <H2>{tx(t, "alMerge_costTitle", "Why it is n log n")}</H2>
      <p>
        {tx(t, "alMerge_costBody",
          "Let T(n) be the time to sort n elements. A call does two recursive calls on n/2 elements each, plus a merge costing at most c · n for some constant c (the copy, the comparisons, the writes). This is the recurrence previewed at the end of the Recursion chapter.")}
      </p>
      <Equation label={tx(t, "alMerge_eqRec", "The merge sort recurrence")}
        where={[
          [r`T(n)`, tx(t, "alMerge_wT", "the time to sort n elements")],
          [r`2\,T(n/2)`, tx(t, "alMerge_wT2", "sorting the two halves")],
          [r`c\,n`, tx(t, "alMerge_wCn", "merging them: a constant amount of work per element")],
          [r`T(1) = c`, tx(t, "alMerge_wT1", "a single element: constant work, nothing to do")],
        ]}>
        {r`T(n) = 2\,T(n/2) + c\,n`}
      </Equation>
      <H3>{tx(t, "alMerge_treeTitle", "Reading it from the recursion tree")}</H3>
      <p>
        {tx(t, "alMerge_treeBody",
          "Draw every call as a node. The top call works on n elements and does c · n merging work of its own. Its two children each work on n/2 elements and do c · n/2 each: c · n together. The four grandchildren do c · n/4 each: again c · n. At every level the pieces together cover the whole array once, so every level costs c · n. The sizes halve from level to level, so they reach 1 after log₂ n levels. Total: c · n per level times log₂ n levels, plus the base cases, c · n log₂ n + c · n.")}
      </p>
      <Equation label={tx(t, "alMerge_eqUnroll", "The same result by unrolling")}
        where={[
          [r`k`, tx(t, "alMerge_wK", "the number of times the recurrence has been substituted into itself")],
          [r`2^k\,T(n/2^k)`, tx(t, "alMerge_w2k", "2ᵏ subproblems of size n/2ᵏ each")],
          [r`k\,c\,n`, tx(t, "alMerge_wKcn", "k levels of merging, c · n each")],
          [r`k = \log_2 n`, tx(t, "alMerge_wStop", "the size reaches 1 when 2ᵏ = n")],
        ]}
        note={tx(t, "alMerge_eqUnrollNote", "With n = 2ᵏ: T(n) = n · T(1) + c n log₂ n = c n log₂ n + c n = Θ(n log n). For sizes that are not powers of 2, the halves differ by at most one element and the same bound holds.")}>
        {r`T(n) = 2T(n/2) + cn = 4T(n/4) + 2cn = 8T(n/8) + 3cn = \dots = 2^k\,T(n/2^k) + k\,c\,n`}
      </Equation>
      <p>
        {tx(t, "alMerge_cmpBound",
          "Counting comparisons alone, each level of merges makes fewer than n (at most n − 1 per merge, summed over merges that share the n elements), and there are ⌈log₂ n⌉ levels (⌈·⌉, the ceiling, rounds up). So merge sort never makes more than n⌈log₂ n⌉ comparisons, in the best case, the worst case and everything between. It does not care whether the input is sorted, reversed or random.")}
      </p>
      <LessonTable
        headers={[tx(t, "alMerge_tN", "n"), tx(t, "alMerge_tQuad", "n(n − 1)/2 (quadratic sorts, worst)"), tx(t, "alMerge_tLog", "n log₂ n (merge sort)")]}
        rows={[
          ["100", "4 950", "≈ 664"],
          ["1 000", "499 500", "≈ 9 966"],
          ["1 000 000", "≈ 5 · 10¹¹", "≈ 2 · 10⁷"],
        ]}
      />

      <H2>{tx(t, "alMerge_spaceTitle", "The price: extra memory")}</H2>
      <p>
        {tx(t, "alMerge_spaceBody",
          "Merge sort is not in place. The buffer holds n elements, so it uses Θ(n) extra memory, plus the recursion stack, which is only about log₂ n frames deep. For an array of 100 million ints (400 MB) the buffer is another 400 MB. That is the main reason the default sort in most libraries is quicksort (next chapter), which works in place, while merge sort is chosen when stability is needed: C++'s std::stable_sort is a merge sort.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alMerge_where", "Merge sort also shines where quicksort cannot go. It reads its runs strictly from front to back, which suits linked lists (next section of the track; there the merge needs no buffer at all) and data too large for memory: files are sorted in chunks that fit, and the sorted chunks are merged from disk. This is called external sorting.")}
      </Callout>

      <H2>{tx(t, "alMerge_bottomTitle", "Bottom-up merge sort")}</H2>
      <p>
        {tx(t, "alMerge_bottomBody",
          "The recursion only decides which ranges get merged, and the answer is simple: first all neighbouring pairs of single elements, then pairs of runs of length 2, then 4, and so on. A loop can do the same without any recursion. Runs of width w are merged in pairs to form runs of width 2w; the last run may be shorter, which the min() handles.")}
      </p>
      <CodeBlock lang="cpp" filename="merge_sort_bottom_up.cpp" t={t}>{`int minInt(int x, int y) { return x < y ? x : y; }

void mergeSortBottomUp(int* a, int n) {
    int* aux = new int[n];
    for (int w = 1; w < n; w *= 2)                        // run width: 1, 2, 4, 8, ...
        for (int lo = 0; lo + w < n; lo += 2 * w)         // a right run exists
            merge(a, aux, lo, lo + w - 1, minInt(lo + 2 * w - 1, n - 1));
    delete[] aux;
}`}</CodeBlock>

      <H2>{tx(t, "alMerge_practTitle", "Two practical improvements")}</H2>
      <p>
        {tx(t, "alMerge_practBody",
          "First, for tiny ranges the recursion costs more than it saves: sorting ranges of up to about 16 elements with insertion sort (the previous chapter) and merging from there is noticeably faster. Second, before merging, check whether a[mid] ≤ a[mid + 1]. If so, every element on the left is ≤ every element on the right, the range is already sorted, and the merge can be skipped. With this test an already sorted input costs only n − 1 comparisons in total.")}
      </p>
      <CodeBlock lang="cpp" filename="merge_sort_tuned.cpp" t={t}>{`void insertionSortRange(int* a, int lo, int hi) {
    for (int i = lo + 1; i <= hi; ++i) {
        int key = a[i], j = i;
        while (j > lo && a[j - 1] > key) { a[j] = a[j - 1]; --j; }
        a[j] = key;
    }
}

void sortRangeTuned(int* a, int* aux, int lo, int hi) {
    if (hi - lo < 16) { insertionSortRange(a, lo, hi); return; }   // small: insertion
    int mid = lo + (hi - lo) / 2;
    sortRangeTuned(a, aux, lo, mid);
    sortRangeTuned(a, aux, mid + 1, hi);
    if (a[mid] <= a[mid + 1]) return;                               // already in order
    merge(a, aux, lo, mid, hi);
}`}</CodeBlock>

      <H2>{tx(t, "alMerge_invTitle", "Bonus: counting inversions")}</H2>
      <p>
        {tx(t, "alMerge_invBody",
          "Counting inversions pair by pair takes Θ(n²). The merge can count them for free. An inversion is either inside the left half, inside the right half (both counted by the recursive calls), or split: one element in each half with the left one bigger. During the merge, when an element R[j] is taken before the remaining elements of L, it is smaller than all of them, and each of those pairs is a split inversion. So add the number of elements still left in L, mid − i + 1. This measures how different two rankings are, for example how much two people's orderings of the same list of films disagree.")}
      </p>
      <CodeBlock lang="cpp" filename="count_inversions.cpp" t={t}>{`long long mergeCount(int* a, int* aux, int lo, int mid, int hi) {
    for (int k = lo; k <= hi; ++k) aux[k] = a[k];
    long long inv = 0;
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; ++k) {
        if      (i > mid)          a[k] = aux[j++];
        else if (j > hi)           a[k] = aux[i++];
        else if (aux[i] <= aux[j]) a[k] = aux[i++];
        else { inv += mid - i + 1; a[k] = aux[j++]; }   // aux[j] beats every aux[i..mid]
    }
    return inv;
}

long long countInversions(int* a, int* aux, int lo, int hi) {   // sorts a[lo..hi] too
    if (lo >= hi) return 0;
    int mid = lo + (hi - lo) / 2;
    return countInversions(a, aux, lo, mid)
         + countInversions(a, aux, mid + 1, hi)
         + mergeCount(a, aux, lo, mid, hi);
}`}</CodeBlock>

      <H2>{tx(t, "alMerge_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alMerge_w1",
          "1. Merge L = [1, 4, 9] and R = [2, 3, 10]. 1 vs 2: take 1. 4 vs 2: take 2. 4 vs 3: take 3. 4 vs 10: take 4. 9 vs 10: take 9. L is empty: copy 10. Result [1, 2, 3, 4, 9, 10] with 5 = n − 1 comparisons.")}
      </p>
      <p>
        {tx(t, "alMerge_w2",
          "2. Comparisons for [38, 27, 43, 3, 9, 82, 10]. The merges cost: [38] + [27]: 1. [43] + [3]: 1. [27, 38] + [3, 43]: 3 (3 vs 27, 27 vs 43, 38 vs 43, then 43 is copied). [9] + [82]: 1. [9, 82] + [10]: 2. [3, 27, 38, 43] + [9, 10, 82]: 6. Total 14, below the bound n⌈log₂ n⌉ = 7 · 3 = 21.")}
      </p>
      <p>
        {tx(t, "alMerge_w3",
          "3. Split inversions in the last merge of [5, 2, 4, 6, 1, 3]: the halves sort to [2, 4, 5] and [1, 3, 6]. 1 is taken first while 2, 4, 5 remain: +3. Then 2 is taken, then 3 while 4, 5 remain: +2. Then 4, 5, 6. Split inversions: 5. Inside the halves: [5, 2, 4] has 2, [6, 1, 3] has 2. Total 5 + 2 + 2 = 9, as counted by hand in the previous chapter.")}
      </p>
      <p>
        {tx(t, "alMerge_w4",
          "4. Memory for sorting 10 million 8-byte values: the array is 80 MB, the buffer another 80 MB, and the stack about log₂ 10⁷ ≈ 24 frames of a few dozen bytes each, which is negligible.")}
      </p>

      <H2>{tx(t, "alMerge_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alMerge_tMistake", "Mistake"), tx(t, "alMerge_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alMerge_e1", "Allocating a new buffer in every call"), tx(t, "alMerge_e1b", "millions of small allocations dominate the running time. Allocate once and pass it down")],
          [tx(t, "alMerge_e2", "Using < instead of <= when merging"), tx(t, "alMerge_e2b", "ties go right: still sorted, but no longer stable")],
          [tx(t, "alMerge_e3", "Splitting at mid − 1 or mid + 1 inconsistently"), tx(t, "alMerge_e3b", "an element is lost or sorted twice, or a range of 2 recurses on itself forever. The halves must be exactly [lo..mid] and [mid + 1..hi]")],
          [tx(t, "alMerge_e4", "Forgetting the leftovers"), tx(t, "alMerge_e4b", "stopping when one run is empty drops the rest of the other. Copy what remains")],
          [tx(t, "alMerge_e5", "Assuming n log n means \"always fastest\""), tx(t, "alMerge_e5b", "for small arrays insertion sort wins; switch to it below about 16 elements")],
        ]}
      />

      <KeyIdeas t={t} id="alMerge" items={[
        "Divide and conquer: divide into subproblems, conquer them recursively, combine the answers.",
        "Merging two sorted runs compares only their fronts: at most n − 1 comparisons, n writes.",
        "Merge sort: sort each half, merge them. T(n) = 2T(n/2) + cn gives Θ(n log n) in every case, at most n⌈log₂ n⌉ comparisons.",
        "Taking from the left on ties makes it stable.",
        "It needs Θ(n) extra memory for the buffer; allocate it once.",
        "In practice: insertion sort for small ranges, and skip the merge when a[mid] ≤ a[mid + 1].",
        "The merge can count inversions in Θ(n log n) at the same time.",
      ]} />
    </Article>
  );
}
