"use client";

// Searching & Sorting 5: linear-time sorts — the Ω(n log n) lower bound for
// comparison sorts (decision trees, n! leaves, log₂ n! ≥ (n/2) log₂(n/2),
// small cases); counting sort with counts, running totals and a stable
// right-to-left placement, Θ(n + k); LSD radix sort and why stability makes it
// work, base 10 by hand and base 256 in code, d(n + b); bucket sort for
// uniform values with E[nᵢ²] = 2 − 1/n; a summary of the whole section and
// choosing a sort; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { CountingSortFigure } from "@/components/lesson/figures/algo/CountingSortFigure";

const r = String.raw;

export function LinearSortsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alLin_intro",
          "Merge sort and quicksort both need about n log n comparisons. Is that just the best anyone has found so far, or a law? This chapter proves it is a law: no algorithm that learns about the data only by comparing elements can do better. Then it breaks the law's assumption. When the keys are small whole numbers, or digits, or spread evenly over a range, an algorithm can use the key values themselves as positions, and sort in linear time.")}
      </Lead>

      <Goals t={t} id="alLin" items={[
        "Explain why no sort that only compares elements can beat n log n.",
        "Sort small integer keys with counting sort.",
        "Sort longer keys one digit at a time with radix sort.",
        "Choose the right sort for a given kind of data.",
      ]} />

      <H2>{tx(t, "alLin_boundTitle", "Why comparison sorts need n log n")}</H2>
      <p>
        {tx(t, "alLin_boundBody",
          "A comparison sort is any algorithm whose only way of learning about the elements is to ask whether a[i] < a[j] (or ≤, >, ≥). All the sorts so far are comparison sorts. Its behaviour on n distinct elements can be drawn as a decision tree: each inner node is a comparison, its two branches are the two answers, and each leaf is a finished run of the algorithm, ending with one particular rearrangement of the input. Running the algorithm on an input means walking from the root to a leaf, and the number of comparisons is the length of that path.")}
      </p>
      <p>
        {tx(t, "alLin_boundArg",
          "Two facts finish the argument. First, the n elements can arrive in n! different orders (Math track, Counting), and each order needs a different rearrangement to become sorted, so the tree needs at least n! leaves. Second, a binary tree of height h (its longest root-to-leaf path) has at most 2ʰ leaves, because each level can at most double the number of branches. So 2ʰ ≥ n!, which means h ≥ log₂(n!): in the worst case the algorithm makes at least log₂(n!) comparisons.")}
      </p>
      <Equation label={tx(t, "alLin_eqBound", "The lower bound for comparison sorting")}
        where={[
          [r`h`, tx(t, "alLin_wH", "the height of the decision tree: the worst-case number of comparisons")],
          [r`n!`, tx(t, "alLin_wFact", "the number of possible input orders, each needing its own leaf")],
          [r`(n/2)^{n/2}`, tx(t, "alLin_wHalf", "a lower estimate of n!: its largest n/2 factors are each at least n/2")],
        ]}
        note={tx(t, "alLin_eqBoundNote", "So h ≥ (n/2) log₂(n/2) = Ω(n log n). A sharper estimate (Stirling's formula) gives log₂ n! ≈ n log₂ n − 1.44 n, very close to what merge sort achieves. The bound also holds on average, not just in the worst case.")}>
        {r`2^h \ge n! \;\Longrightarrow\; h \ge \log_2 n! \;\ge\; \log_2\!\left(\tfrac{n}{2}\right)^{n/2} = \tfrac{n}{2}\log_2\tfrac{n}{2}`}
      </Equation>
      <LessonTable
        headers={[tx(t, "alLin_tN", "n"), tx(t, "alLin_tOrders", "orders n!"), tx(t, "alLin_tLog", "log₂ n!"), tx(t, "alLin_tMin", "comparisons needed in the worst case, at least")]}
        rows={[
          ["3", "6", "2.58", "3"],
          ["4", "24", "4.58", "5"],
          ["5", "120", "6.91", "7"],
          ["10", "3 628 800", "21.79", "22"],
        ]}
      />
      <p>
        {tx(t, "alLin_boundSmall",
          "Check n = 3 by hand: two comparisons have only 2² = 4 possible outcomes, but there are 6 orders, so some two orders would get the same answers and one of them would come out wrong. Three comparisons are necessary, and insertion sort indeed uses 3 in its worst case. For 5 elements, 7 comparisons are enough, but only with a carefully designed sequence of comparisons.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alLin_escape", "The bound is about comparisons, and that is the way out. If an algorithm can look at a key and compute something from it, such as using it as an array index, the decision-tree argument does not apply, because one step can then have many outcomes instead of two.")}
      </Callout>

      <H2>{tx(t, "alLin_countTitle", "Counting sort")}</H2>
      <p>
        {tx(t, "alLin_countBody",
          "Suppose every key is a whole number from 0 to k − 1, with k not much larger than n: exam grades from 0 to 100, ages, the day of the month. Then we can count. Pass 1: make an array count of k zeros and, for each element, add 1 to count[key]. Pass 2: replace each count by a running total, count[v] += count[v − 1], so that count[v] becomes the number of keys ≤ v. That number is exactly one past the last position the keys equal to v should occupy in the output. Pass 3: walk the input from right to left, and put each element at position count[key] − 1, decreasing count[key] first.")}
      </p>
      <CodeBlock lang="cpp" filename="counting_sort.cpp" t={t}>{`// Stable sort of a[0..n-1] into out[0..n-1]; every key is in 0..k-1.
void countingSort(const int* a, int* out, int n, int k) {
    int* count = new int[k];
    for (int v = 0; v < k; ++v) count[v] = 0;
    for (int i = 0; i < n; ++i) count[a[i]]++;                // pass 1: how many of each
    for (int v = 1; v < k; ++v) count[v] += count[v - 1];     // pass 2: how many <= v
    for (int i = n - 1; i >= 0; --i)                          // pass 3: right to left
        out[--count[a[i]]] = a[i];                            // last free slot for a[i]
    delete[] count;
}`}</CodeBlock>

      <CountingSortFigure t={t} />

      <p>
        {tx(t, "alLin_countWhy",
          "Why right to left? The last element with key v should go to the last slot of v's block, which is where count[v] − 1 points; the element with key v before it goes one slot earlier, and so on. So equal keys keep their input order: counting sort is stable. That matters little when sorting bare numbers, but a great deal when the keys belong to records, and radix sort below depends on it completely.")}
      </p>
      <Equation label={tx(t, "alLin_eqCount", "Cost of counting sort")}
        where={[
          [r`n`, tx(t, "alLin_wN", "the number of elements: passes 1 and 3 touch each once")],
          [r`k`, tx(t, "alLin_wK", "the number of possible key values: clearing count and pass 2 touch each once")],
        ]}
        note={tx(t, "alLin_eqCountNote", "No comparisons at all. Memory: the output array (n) and the count array (k). Linear when k = O(n); useless when k is huge: sorting 10 numbers that can be anywhere from 0 to 2³² − 1 would need a count array of 4 billion entries.")}>
        {r`T(n, k) = \Theta(n + k), \qquad \text{extra memory } \Theta(n + k)`}
      </Equation>

      <H2>{tx(t, "alLin_radixTitle", "Radix sort: one digit at a time")}</H2>
      <p>
        {tx(t, "alLin_radixBody",
          "What about large keys? Write each key in some base b (the Math track's Number Bases chapter) with d digits, and sort by one digit at a time using counting sort with k = b. The surprising part is the order: start with the least significant digit (the ones) and finish with the most significant. This is LSD radix sort (least significant digit first), the method used by the punched-card sorting machines of the early twentieth century, which sorted a deck by one column per pass.")}
      </p>
      <p>
        {tx(t, "alLin_radixWhy",
          "Why it works: claim that after sorting by the last p digits, the list is sorted by the number formed by those p digits. Take two keys x and y and look at the next pass, on digit p + 1. If their digits there differ, that pass puts them in the right order by itself. If those digits are equal, the pass is stable, so it keeps x and y in the order they already had, which by the claim is correct for the last p digits, and therefore for the last p + 1 digits too. After all d passes the list is sorted by the whole key. Without stability the argument collapses: an unstable pass could undo the work of the passes before it.")}
      </p>
      <LessonTable
        headers={[tx(t, "alLin_tInput", "input"), tx(t, "alLin_tOnes", "after the ones pass"), tx(t, "alLin_tTens", "after the tens pass"), tx(t, "alLin_tHund", "after the hundreds pass")]}
        rows={[
          ["170, 045, 075, 090, 802, 024, 002, 066", "170, 090, 802, 002, 024, 045, 075, 066", "802, 002, 024, 045, 066, 170, 075, 090", "002, 024, 045, 066, 075, 090, 170, 802"]]}
      />
      <p>
        {tx(t, "alLin_radixTrace",
          "Follow 802 and 002 in the table. The ones pass puts 802 before 002 because it came first in the input and both end in 2. The tens pass sees 0 and 0, a tie, so stability keeps 802 before 002. Only the hundreds pass, 8 against 0, finally puts 002 first. Meanwhile 170 and 075: the tens pass puts 170 (tens digit 7) and 075 (tens digit 7) in their current order, 170 then 075, and the hundreds pass moves 075 before 170.")}
      </p>
      <H3>{tx(t, "alLin_radixCodeTitle", "Radix sort for 32-bit numbers")}</H3>
      <p>
        {tx(t, "alLin_radixCodeBody",
          "Computers work best in base 256: a 32-bit unsigned number is exactly 4 digits in base 256, its 4 bytes (Memory chapter). Digit p (p = 0 for the least significant) is (x / 256ᵖ) mod 256. In C++ this is written (x >> 8p) & 255: shifting right by 8p bits divides by 256ᵖ and throws away the remainder, and & 255 keeps the lowest 8 bits, which is the remainder mod 256. Four stable counting-sort passes with k = 256 sort the whole array. This version places elements from left to right, computing where each digit's block starts; that is just as stable as the right-to-left version.")}
      </p>
      <CodeBlock lang="cpp" filename="radix_sort.cpp" t={t}>{`// Sorts n unsigned 32-bit values: 4 stable passes, one per byte.
void radixSort(unsigned* a, int n) {
    unsigned* buf = new unsigned[n];
    for (int shift = 0; shift < 32; shift += 8) {         // byte 0, 1, 2, 3
        int start[257] = {0};
        for (int i = 0; i < n; ++i)
            start[((a[i] >> shift) & 255) + 1]++;         // count each digit, shifted by one
        for (int d = 0; d < 256; ++d)
            start[d + 1] += start[d];                     // start[d] = first slot of digit d
        for (int i = 0; i < n; ++i)                       // left to right: stable
            buf[start[(a[i] >> shift) & 255]++] = a[i];
        for (int i = 0; i < n; ++i) a[i] = buf[i];
    }
    delete[] buf;
}`}</CodeBlock>
      <Equation label={tx(t, "alLin_eqRadix", "Cost of radix sort")}
        where={[
          [r`d`, tx(t, "alLin_wD", "the number of digits per key (passes)")],
          [r`b`, tx(t, "alLin_wB", "the base: the size of each pass's count array")],
          [r`n + b`, tx(t, "alLin_wNB", "the cost of one counting-sort pass")],
        ]}
        note={tx(t, "alLin_eqRadixNote", "For a million 32-bit keys in base 256: 4 passes of about 1 000 256 steps each, some 4 million steps against n log₂ n ≈ 20 million comparisons. For signed numbers, add 2³¹ to every key first (so the most negative becomes 0), sort, and subtract it again.")}>
        {r`T = \Theta\big(d\,(n + b)\big)`}
      </Equation>

      <H2>{tx(t, "alLin_bucketTitle", "Bucket sort")}</H2>
      <p>
        {tx(t, "alLin_bucketBody",
          "When the keys are real numbers spread evenly over a range, say [0, 1), divide the range into n equal buckets, drop each element into bucket ⌊n · x⌋, sort each bucket with insertion sort, and read the buckets in order. If the values really are uniform, each bucket gets about one element, and the insertion sorts cost almost nothing.")}
      </p>
      <p>
        {tx(t, "alLin_bucketMath",
          "The Math track's distributions chapter makes \"about one\" exact. The number of elements nᵢ landing in bucket i is binomial: n independent tries, each with probability 1/n. Insertion sort on nᵢ elements costs at most about nᵢ² steps, so the expected cost of a bucket is governed by E[nᵢ²] = Var(nᵢ) + E[nᵢ]² = n · (1/n)(1 − 1/n) + 1² = 2 − 1/n. That is less than 2 for every bucket, so all n buckets together cost less than 2n on average, and bucket sort runs in Θ(n) expected time. If the data is not uniform, many elements may pile into one bucket and it degrades to insertion sort's Θ(n²).")}
      </p>
      <Equation label={tx(t, "alLin_eqBucket", "Expected work in one bucket")}
        where={[
          [r`n_i`, tx(t, "alLin_wNi", "how many of the n values land in bucket i; Binomial(n, 1/n)")],
          [r`\operatorname{Var}(n_i)`, tx(t, "alLin_wVar", "n p (1 − p) with p = 1/n")],
          [r`\mathbb{E}[n_i]`, tx(t, "alLin_wMean", "n p = 1")],
        ]}>
        {r`\mathbb{E}[n_i^2] = \operatorname{Var}(n_i) + \mathbb{E}[n_i]^2 = \left(1 - \tfrac{1}{n}\right) + 1 = 2 - \tfrac{1}{n}`}
      </Equation>

      <H2>{tx(t, "alLin_summaryTitle", "The whole section at a glance")}</H2>
      <LessonTable
        headers={[tx(t, "alLin_tAlgo", "Algorithm"), tx(t, "alLin_tBest", "Best"), tx(t, "alLin_tAvg", "Average"), tx(t, "alLin_tWorst", "Worst"), tx(t, "alLin_tMem", "Extra memory"), tx(t, "alLin_tStable", "Stable")]}
        rows={[
          [tx(t, "alLin_s1", "selection"), "n²", "n²", "n²", "O(1)", tx(t, "alLin_no", "no")],
          [tx(t, "alLin_s2", "insertion"), "n", "n²", "n²", "O(1)", tx(t, "alLin_yes", "yes")],
          [tx(t, "alLin_s3", "merge sort"), "n log n", "n log n", "n log n", "n", tx(t, "alLin_yes", "yes")],
          [tx(t, "alLin_s4", "quicksort (random pivot)"), "n log n", "n log n", tx(t, "alLin_s4w", "n² (very unlikely)"), "log n", tx(t, "alLin_no", "no")],
          [tx(t, "alLin_s5", "counting sort"), "n + k", "n + k", "n + k", "n + k", tx(t, "alLin_yes", "yes")],
          [tx(t, "alLin_s6", "radix sort"), "d(n + b)", "d(n + b)", "d(n + b)", "n + b", tx(t, "alLin_yes", "yes")],
          [tx(t, "alLin_s7", "bucket sort (uniform data)"), "n", "n", "n²", "n", tx(t, "alLin_yes", "yes")],
        ]}
      />
      <p>
        {tx(t, "alLin_choose",
          "Choosing in practice. For general data, call std::sort (introsort, previous chapter). When equal keys must keep their order, std::stable_sort (merge sort). For a few dozen elements, or data that is nearly sorted, insertion sort. When the keys are small integers, counting sort; for many fixed-size integer keys, radix sort can beat everything. Only the linear sorts need to know something about the keys; the comparison sorts work on anything that can be compared.")}
      </p>

      <H2>{tx(t, "alLin_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alLin_w1",
          "1. Counting sort of [2, 5, 3, 0, 2, 3, 0, 3] with k = 6 (this is the figure's example). Pass 1, counts for keys 0 to 5: [2, 0, 2, 3, 0, 1]. Pass 2, running totals: [2, 2, 4, 7, 7, 8]. Pass 3 from the right: a[7] = 3 goes to slot 7 − 1 = 6 (count[3] becomes 6); a[6] = 0 to slot 1; a[5] = 3 to slot 5; a[4] = 2 to slot 3; a[3] = 0 to slot 0; a[2] = 3 to slot 4; a[1] = 5 to slot 7; a[0] = 2 to slot 2. Output [0, 0, 2, 2, 3, 3, 3, 5].")}
      </p>
      <p>
        {tx(t, "alLin_w2",
          "2. Which is better for sorting 1000 exam grades from 0 to 100? Counting sort costs about n + k = 1101 steps; a comparison sort needs at least log₂(1000!) ≈ 8530 comparisons. Counting sort wins. For 1000 values between 0 and 10⁹ it would need a billion counters: use a comparison sort, or radix sort with base 1000 (3 passes of 1000 + 1000 steps).")}
      </p>
      <p>
        {tx(t, "alLin_w3",
          "3. The bound for 4 elements: 4! = 24 orders, 2⁴ = 16 < 24 ≤ 32 = 2⁵, so at least 5 comparisons in the worst case. Merge sort on 4 elements: two merges of single pairs (1 comparison each) and a final merge of 2 + 2 (at most 3): 5 at worst. It is optimal for n = 4.")}
      </p>

      <H2>{tx(t, "alLin_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alLin_tMistake", "Mistake"), tx(t, "alLin_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alLin_e1", "Filling left to right with end positions"), tx(t, "alLin_e1b", "counting sort with running totals must place from the right, or equal keys come out reversed, and radix sort breaks. Either go right to left, or compute start positions")],
          [tx(t, "alLin_e2", "Radix sort from the most significant digit"), tx(t, "alLin_e2b", "a later pass on a less significant digit scrambles the order of the earlier ones. LSD order: least significant first")],
          [tx(t, "alLin_e3", "Keys outside 0..k − 1"), tx(t, "alLin_e3b", "count[key] writes outside the array. Check the range, or subtract the minimum first")],
          [tx(t, "alLin_e4", "Counting sort with a huge key range"), tx(t, "alLin_e4b", "the count array dwarfs the data. Use radix sort or a comparison sort")],
          [tx(t, "alLin_e5", "Thinking the n log n bound applies to every sort"), tx(t, "alLin_e5b", "it applies only to comparison sorts; key-based sorts can be linear")],
        ]}
      />

      <KeyIdeas t={t} id="alLin" items={[
        "A comparison sort is a decision tree with at least n! leaves, so it needs at least log₂ n! = Ω(n log n) comparisons.",
        "Counting sort uses keys as indices: count, running totals, place from the right. Θ(n + k), stable, no comparisons.",
        "LSD radix sort applies a stable sort to each digit, least significant first: Θ(d(n + b)).",
        "Stability is what makes radix sort correct: ties on the current digit keep the order of the earlier digits.",
        "Bucket sort is linear on average for uniform data, because E[nᵢ²] = 2 − 1/n.",
        "Linear sorts need to know something about the keys; comparison sorts work on anything that can be compared.",
      ]} />
    </Article>
  );
}
