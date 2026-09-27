"use client";

// Searching & Sorting 1: searching — linear search and its best/worst/average
// cost; why order helps; binary search with an inclusive range, the loop
// invariant, why mid = lo + (hi − lo)/2, the ⌊log₂ n⌋ + 1 bound; correctness
// and termination; lower_bound/upper_bound on a half-open range and counting
// equal keys; binary search on the answer (integer square root); the
// recursive form and its recurrence; when sorting first pays off; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { BinarySearchFigure } from "@/components/lesson/figures/algo/BinarySearchFigure";

const r = String.raw;

export function SearchingContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alSrch_intro",
          "Finding something is the most common thing programs do: a name in a contact list, a word in a dictionary, a record by its ID. This chapter starts with the obvious method, looking at everything, and then shows how keeping the data sorted lets you find any item among a billion in 30 steps. Binary search is short, but it is famous for being easy to get subtly wrong, so we will write it carefully, prove it correct and list its traps.")}
      </Lead>

      <H2>{tx(t, "alSrch_linearTitle", "Linear search: look at everything")}</H2>
      <p>
        {tx(t, "alSrch_linearBody",
          "The problem: given an array a of n values and a target value x, return an index i with a[i] == x, or report that there is none (by convention, return −1, which can never be a valid index). With no knowledge about how the values are arranged, the only safe method is to check them one at a time from the left. This is linear search, also called sequential search.")}
      </p>
      <CodeBlock lang="cpp" filename="linear_search.cpp" t={t}>{`// Returns the first index i with a[i] == x, or -1 if x is not in a[0..n-1].
int linearSearch(const int* a, int n, int x) {
    for (int i = 0; i < n; ++i)
        if (a[i] == x) return i;      // found: stop at once
    return -1;                        // looked at all n values
}`}</CodeBlock>
      <p>
        {tx(t, "alSrch_linearCost",
          "Count comparisons of a[i] with x, the operation that repeats. Best case: x is at index 0, one comparison. Worst case: x is last or missing, n comparisons. Average case, if x is present and equally likely to be at any of the n positions: finding it at index i costs i + 1 comparisons, so the average is (1 + 2 + … + n)/n = (n + 1)/2. In Big-O terms linear search is Θ(n) in the worst and average case: a list twice as long takes twice as long.")}
      </p>
      <Equation label={tx(t, "alSrch_eqAvg", "Average comparisons of a successful linear search")}
        where={[
          [r`n`, tx(t, "alSrch_wN", "the number of elements")],
          [r`i + 1`, tx(t, "alSrch_wI1", "comparisons needed when x sits at index i (indices start at 0)")],
          [r`\tfrac{1}{n}`, tx(t, "alSrch_wProb", "the probability of each position, all equally likely")],
        ]}
        note={tx(t, "alSrch_eqAvgNote", "The sum 1 + 2 + … + n = n(n + 1)/2 is Gauss's formula from the Math track's sequences chapter. For n = 1000: 500.5 comparisons on average, 1000 at worst.")}>
        {r`\sum_{i=0}^{n-1} \frac{1}{n}\,(i+1) = \frac{1}{n}\cdot\frac{n(n+1)}{2} = \frac{n+1}{2}`}
      </Equation>
      <p>
        {tx(t, "alSrch_linearWhen",
          "Linear search is not a bad algorithm. It needs no preparation, works on any data (sorted or not, arrays or linked lists), and for small arrays, up to a few dozen elements, it is often the fastest option in practice because it reads memory in order, which the cache handles very well (see the Memory chapter).")}
      </p>

      <H2>{tx(t, "alSrch_orderTitle", "What order buys you")}</H2>
      <p>
        {tx(t, "alSrch_orderBody",
          "Think of looking up a word in a paper dictionary. Nobody starts at page 1. You open somewhere in the middle, see that your word comes later alphabetically, and from then on ignore the whole first half. One look eliminated half of the book. This works only because the words are in order: a single comparison tells you on which side the word must be. The same idea on a sorted array is binary search.")}
      </p>
      <p>
        {tx(t, "alSrch_sortedDef",
          "Precisely: an array is sorted (in non-decreasing order) when a[0] ≤ a[1] ≤ … ≤ a[n − 1]. Non-decreasing rather than increasing, because equal values next to each other are allowed. Everything below assumes this; binary search on unsorted data returns nonsense without any warning.")}
      </p>

      <H2>{tx(t, "alSrch_binaryTitle", "Binary search")}</H2>
      <p>
        {tx(t, "alSrch_binaryBody",
          "Keep two indices, lo and hi, that mark the part of the array where x can still be: the range a[lo..hi], both ends included. At the start that is the whole array, lo = 0 and hi = n − 1. Repeat: look at the middle index mid of the range. If a[mid] == x, done. If a[mid] < x, then x cannot be at mid or anywhere to its left, because everything there is ≤ a[mid] < x; so move lo to mid + 1. If a[mid] > x, by the same argument move hi to mid − 1. If the range becomes empty (lo > hi), x is not in the array.")}
      </p>
      <CodeBlock lang="cpp" filename="binary_search.cpp" t={t}>{`// a[0..n-1] must be sorted in non-decreasing order.
// Returns an index i with a[i] == x, or -1 if x is not present.
int binarySearch(const int* a, int n, int x) {
    int lo = 0, hi = n - 1;               // search the range a[lo..hi], ends included
    while (lo <= hi) {                    // the range is not empty
        int mid = lo + (hi - lo) / 2;     // middle index, rounded down
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;     // x can only be to the right of mid
        else            hi = mid - 1;     // x can only be to the left of mid
    }
    return -1;                            // lo > hi: the range is empty
}`}</CodeBlock>

      <BinarySearchFigure t={t} />

      <H3>{tx(t, "alSrch_midTitle", "Why mid = lo + (hi − lo) / 2")}</H3>
      <p>
        {tx(t, "alSrch_midBody",
          "The obvious (lo + hi) / 2 gives the same number in ordinary arithmetic, but an int holds at most 2³¹ − 1 = 2 147 483 647. With an array of 1.5 billion elements, lo and hi can both be above a billion, and their sum overflows into a negative number (the Memory chapter shows why), giving a negative index. hi − lo never exceeds the array size, so lo + (hi − lo) / 2 always stays in range. This exact bug sat in the Java standard library's binary search for about nine years before anyone noticed. Integer division rounds down, so when the range has an even number of elements, mid is the left one of the two middle elements.")}
      </p>

      <H3>{tx(t, "alSrch_costTitle", "How many comparisons?")}</H3>
      <p>
        {tx(t, "alSrch_costBody",
          "Each round that does not find x throws away mid and everything on one side of it, so the range of size s shrinks to at most ⌊s/2⌋ elements (⌊·⌋, the floor, means round down). Starting from n, after one round at most n/2 are left, after two n/4, after k rounds n/2ᵏ. The search must stop once fewer than one element remains, which takes about log₂ n rounds. Counting exactly: the largest number of rounds is ⌊log₂ n⌋ + 1.")}
      </p>
      <Equation label={tx(t, "alSrch_eqBound", "Worst case of binary search")}
        where={[
          [r`n`, tx(t, "alSrch_wN2", "the number of elements in the sorted array")],
          [r`\log_2 n`, tx(t, "alSrch_wLog", "the power of 2 that gives n: how many times n can be halved before reaching 1")],
          [r`\lfloor\cdot\rfloor`, tx(t, "alSrch_wFloor", "rounding down to a whole number")],
          [r`+1`, tx(t, "alSrch_wPlus1", "the last round, which looks at a range of a single element")],
        ]}
        note={tx(t, "alSrch_eqBoundNote", "Check with n = 16: ⌊log₂ 16⌋ + 1 = 4 + 1 = 5, which is what the figure shows when you search for 99 or 100.")}>
        {r`\text{rounds} \;\le\; \lfloor \log_2 n \rfloor + 1`}
      </Equation>
      <LessonTable
        headers={[tx(t, "alSrch_tN", "n"), tx(t, "alSrch_tLin", "linear search, worst case"), tx(t, "alSrch_tBin", "binary search, worst case")]}
        rows={[
          ["16", "16", "5"],
          ["1 000", "1 000", "10"],
          ["1 000 000", "1 000 000", "20"],
          ["1 000 000 000", "1 000 000 000", "30"],
        ]}
      />
      <p>
        {tx(t, "alSrch_logFeel",
          "This is the practical meaning of Θ(log n): multiplying the data by 1000 adds only about 10 steps, because 2¹⁰ = 1024 ≈ 1000. The Recursion chapter found the same cost from the other direction: the recurrence T(n) = T(n/2) + c unrolls to c · log₂ n.")}
      </p>

      <H2>{tx(t, "alSrch_proofTitle", "Why it is correct")}</H2>
      <p>
        {tx(t, "alSrch_proofBody",
          "Loops are proved correct with a loop invariant: a statement that is true before the loop starts and that each round keeps true. For binary search the invariant is: if x is anywhere in the array, it is in a[lo..hi]. Check the three parts. Start: lo = 0, hi = n − 1 is the whole array, so it holds. Each round: we only discard indices whose values are all < x (everything up to mid when a[mid] < x, because the array is sorted) or all > x, and such indices cannot hold x; so it still holds. End: if we return mid, a[mid] == x, correct. Otherwise the loop stopped because lo > hi, the range is empty, and by the invariant x is nowhere, so −1 is correct.")}
      </p>
      <p>
        {tx(t, "alSrch_termBody",
          "It must also stop. The size of the range is hi − lo + 1. Every round that continues sets lo to mid + 1 or hi to mid − 1, and lo ≤ mid ≤ hi, so the size shrinks by at least 1 (in fact it halves). A non-negative whole number cannot shrink forever. Both parts matter: the + 1 and − 1 are what guarantee progress. Writing lo = mid instead can leave the range unchanged forever, the classic infinite loop.")}
      </p>

      <H2>{tx(t, "alSrch_boundsTitle", "Finding boundaries: lower_bound and upper_bound")}</H2>
      <p>
        {tx(t, "alSrch_boundsBody",
          "When the array has repeated values, \"an index with a[i] == x\" may not be enough: you might want the first one, the last one, or how many there are. And when x is missing you often want the position where it would go to keep the array sorted. Both questions are answered by lower_bound(x), the first index i with a[i] ≥ x (or n if every value is smaller), and upper_bound(x), the first index with a[i] > x. The number of copies of x is upper_bound(x) − lower_bound(x).")}
      </p>
      <p>
        {tx(t, "alSrch_halfOpen",
          "These are cleanest with a half-open range [lo, hi): lo included, hi excluded, starting at lo = 0, hi = n. The invariant now reads: every index below lo has a[i] < x, and every index from hi on has a[i] ≥ x. The answer is the boundary between the two zones, so the loop runs while lo < hi and ends with lo == hi pointing at it. The C++ standard library has both functions in <algorithm> as std::lower_bound and std::upper_bound; here is how they work inside.")}
      </p>
      <CodeBlock lang="cpp" filename="bounds.cpp" t={t}>{`// First index i in [0, n] with a[i] >= x (n if there is none). a must be sorted.
int lowerBound(const int* a, int n, int x) {
    int lo = 0, hi = n;                   // half-open range [lo, hi)
    while (lo < hi) {                     // at least one candidate left
        int mid = lo + (hi - lo) / 2;     // lo <= mid < hi, so a[mid] is valid
        if (a[mid] < x) lo = mid + 1;     // mid and everything left of it are too small
        else            hi = mid;         // a[mid] >= x: mid may be the answer, keep it
    }
    return lo;                            // lo == hi: the boundary
}

// First index i in [0, n] with a[i] > x.
int upperBound(const int* a, int n, int x) {
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= x) lo = mid + 1;    // the only change: <= instead of <
        else             hi = mid;
    }
    return lo;
}

int countEqual(const int* a, int n, int x) {
    return upperBound(a, n, x) - lowerBound(a, n, x);
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "alSrch_hiMid", "Here hi = mid, not mid − 1, is correct: in a half-open range hi is already excluded, and a[mid] ≥ x means mid might be the answer, so it must stay just outside the range as the new boundary. Progress is still guaranteed, because mid < hi always, so hi = mid shrinks the range, and lo = mid + 1 shrinks it too.")}
      </Callout>

      <H2>{tx(t, "alSrch_answerTitle", "Binary search on the answer")}</H2>
      <p>
        {tx(t, "alSrch_answerBody",
          "Binary search does not need an array at all. It needs a yes/no question about whole numbers whose answer switches only once, from yes to no (or the other way round) as the number grows; such a question is called monotone. Then the switching point can be found by halving an interval of candidates. Example: the integer square root of n, the largest r with r · r ≤ n. The question \"is r · r ≤ n?\" is yes for r = 0, 1, 2, … up to the answer and no from then on. The Math track's limits chapter used the same halving idea on real numbers under the name bisection.")}
      </p>
      <CodeBlock lang="cpp" filename="isqrt.cpp" t={t}>{`// Largest r with r * r <= n, for n >= 0.
long long isqrt(long long n) {
    long long lo = 0, hi = n;             // the answer is somewhere in [lo, hi]
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;   // round UP, see below
        if (mid <= n / mid) lo = mid;     // mid * mid <= n, written so it cannot overflow
        else                hi = mid - 1;
    }
    return lo;
}`}</CodeBlock>
      <p>
        {tx(t, "alSrch_roundUp",
          "Two details. Because the yes-branch keeps mid (lo = mid), mid must be rounded up: with lo = 3 and hi = 4, rounding down would give mid = 3, lo = 3 again, and the loop would never end. Rounding up gives mid = 4, and either branch shrinks the range. And mid * mid can overflow for large n, so the test is written as mid ≤ n / mid, which means the same for whole numbers (mid ≥ 1 here, since mid is rounded up from lo ≥ 0 with lo < hi).")}
      </p>

      <H2>{tx(t, "alSrch_recTitle", "The recursive version")}</H2>
      <p>
        {tx(t, "alSrch_recBody",
          "Binary search is also a textbook recursion: search the range; if it is empty, fail; otherwise compare with the middle and search one half. The recurrence is T(n) = T(n/2) + c, the second one solved in the Recursion chapter, which gives Θ(log n) time. The call is a tail call, so the loop version is the same algorithm without the Θ(log n) stack frames; that is why the loop is the usual form.")}
      </p>
      <CodeBlock lang="cpp" filename="binary_search_rec.cpp" t={t}>{`int binarySearchRec(const int* a, int lo, int hi, int x) {
    if (lo > hi) return -1;                          // empty range
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == x) return mid;
    if (a[mid] < x) return binarySearchRec(a, mid + 1, hi, x);
    return binarySearchRec(a, lo, mid - 1, x);
}`}</CodeBlock>

      <H2>{tx(t, "alSrch_payTitle", "Is sorting first worth it?")}</H2>
      <p>
        {tx(t, "alSrch_payBody",
          "Binary search needs sorted data, and sorting costs time: the next chapters show that a good sort needs about n log₂ n comparisons. If you search only once, a linear search (n comparisons) is cheaper than sorting. With k searches the comparison is k · n for linear search against n log₂ n + k log₂ n for sort-then-binary-search. For n = 1 000 000 (log₂ n ≈ 20): sorting costs about 20 million comparisons, each linear search up to 1 million. From about 20 searches on, sorting has paid for itself, and after 1000 searches it is roughly 50 times faster.")}
      </p>

      <H2>{tx(t, "alSrch_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alSrch_w1",
          "1. Search for 23 in a = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 72, 78, 84, 91, 95, 99] (n = 16). lo = 0, hi = 15, mid = 0 + 15/2 = 7: a[7] = 45 > 23, so hi = 6. mid = 0 + 6/2 = 3: a[3] = 12 < 23, so lo = 4. mid = 4 + 2/2 = 5: a[5] = 23, found at index 5 after 3 comparisons.")}
      </p>
      <p>
        {tx(t, "alSrch_w2",
          "2. Search the same array for 50, which is missing. mid = 7: 45 < 50, lo = 8. mid = 8 + 7/2 = 11: 78 > 50, hi = 10. mid = 8 + 2/2 = 9: 67 > 50, hi = 8. mid = 8: 56 > 50, hi = 7. Now lo = 8 > hi = 7: not found, 4 comparisons. Note that lo = 8 is exactly where 50 would be inserted: after 45, before 56.")}
      </p>
      <p>
        {tx(t, "alSrch_w3",
          "3. a = [1, 3, 3, 7, 7, 7, 9], lower_bound(7). lo = 0, hi = 7. mid = 3: a[3] = 7 is not < 7, so hi = 3. mid = 1: a[1] = 3 < 7, lo = 2. mid = 2: a[2] = 3 < 7, lo = 3. lo == hi = 3: the first 7 is at index 3. upper_bound(7) finds 6, the index of 9, so there are 6 − 3 = 3 sevens.")}
      </p>
      <p>
        {tx(t, "alSrch_w4",
          "4. isqrt(50). lo = 0, hi = 50. mid = 0 + 51/2 = 25: 25² = 625 > 50, hi = 24. mid = 12: 144 > 50, hi = 11. mid = 6: 36 ≤ 50, lo = 6. mid = 6 + 6/2 = 9: 81 > 50, hi = 8. mid = 6 + 3/2 = 7: 49 ≤ 50, lo = 7. mid = 7 + 2/2 = 8: 64 > 50, hi = 7. lo == hi = 7. Answer 7 after 6 rounds, and indeed 7² = 49 ≤ 50 < 64 = 8².")}
      </p>

      <H2>{tx(t, "alSrch_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alSrch_tMistake", "Mistake"), tx(t, "alSrch_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alSrch_e1", "Binary search on unsorted data"), tx(t, "alSrch_e1b", "no error, just wrong answers. Sort first, or keep the data sorted as you insert")],
          [tx(t, "alSrch_e2", "Mixing range conventions"), tx(t, "alSrch_e2b", "hi = n with while (lo <= hi) reads a[n], past the end; hi = n − 1 with while (lo < hi) never checks the last candidate. Pick inclusive [lo, hi] or half-open [lo, hi) and follow it everywhere")],
          [tx(t, "alSrch_e3", "lo = mid or hi = mid in the wrong place"), tx(t, "alSrch_e3b", "the range can stop shrinking: an infinite loop. With lo = mid, round mid up; check a range of two elements by hand")],
          [tx(t, "alSrch_e4", "mid = (lo + hi) / 2 on huge arrays"), tx(t, "alSrch_e4b", "the sum overflows int. Write lo + (hi − lo) / 2")],
          [tx(t, "alSrch_e5", "Expecting the first copy of a repeated value"), tx(t, "alSrch_e5b", "plain binary search returns any matching index. Use lower_bound")],
          [tx(t, "alSrch_e6", "Sorting before a single search"), tx(t, "alSrch_e6b", "n log n work to save n. Sorting pays only for many searches")],
        ]}
      />

      <KeyIdeas t={t} id="alSrch" items={[
        "Linear search works on any data: Θ(n) worst case, (n + 1)/2 comparisons on average when the target is present.",
        "On sorted data, one comparison with the middle discards half of the candidates: binary search needs at most ⌊log₂ n⌋ + 1 rounds.",
        "Its invariant: if x is present, it lies in a[lo..hi]. Every round must shrink the range, or the loop never ends.",
        "Write mid = lo + (hi − lo) / 2 to avoid overflow.",
        "lower_bound and upper_bound, on a half-open range, find the first ≥ x and the first > x; their difference counts copies of x.",
        "Binary search works on any monotone yes/no question, such as \"is r² ≤ n?\".",
        "Sorting costs about n log₂ n, so it pays for itself only when you search many times.",
      ]} />
    </Article>
  );
}
