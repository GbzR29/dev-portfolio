"use client";

// Trees 4: heaps and priority queues — the priority-queue operations and
// three naive versions, the heap property (partial order, not sorted), the
// complete tree stored in an array with parent (i − 1)/2 and children 2i + 1,
// 2i + 2 derived, sift-up/push, sift-down/pop, height ⌊log₂ n⌋, bottom-up
// build in O(n) via Σ k/2^k = 2, heapsort (fulfils Quicksort's introsort
// promise), min-heaps and std::priority_queue, top-k in O(n log k), k-way
// merge, running median with two heaps; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { HeapFigure } from "@/components/lesson/figures/algo/HeapFigure";

const r = String.raw;

export function HeapsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alHeap_intro",
          "A queue serves the oldest element first. Often that is not what we want: a hospital treats the most urgent patient first, an operating system runs the most important task, a game processes the event with the earliest time stamp, and the shortest-path algorithm of the Graphs section always extends the closest unfinished place. A priority queue serves the element with the highest priority first. The binary heap implements it in a plain array with no pointers at all, O(log n) per change and O(1) to look at the top, and as a bonus gives a sorting algorithm that never needs extra memory.")}
      </Lead>

      <H2>{tx(t, "alHeap_pqTitle", "The priority queue")}</H2>
      <p>
        {tx(t, "alHeap_pqBody",
          "A priority queue holds elements with a key (the priority) and offers three main operations: push(x) adds an element, top() returns the one with the largest key, and pop() removes it. This is a max priority queue; a min priority queue serves the smallest key instead, which is the same thing with the comparisons flipped. The structures we already know can all do it, but each is slow at something:")}
      </p>
      <LessonTable
        headers={[tx(t, "alHeap_tImpl", "Implementation"), "push", "top", "pop"]}
        rows={[
          [tx(t, "alHeap_i1", "unsorted array"), tx(t, "alHeap_i1a", "O(1) amortised"), "O(n)", tx(t, "alHeap_i1c", "O(n): find the max, swap-and-pop")],
          [tx(t, "alHeap_i2", "sorted array"), tx(t, "alHeap_i2a", "O(n): shift to make room"), "O(1)", tx(t, "alHeap_i2c", "O(1): the last element")],
          [tx(t, "alHeap_i3", "balanced search tree"), "O(log n)", "O(log n)", "O(log n)"],
          [tx(t, "alHeap_i4", "binary heap"), "O(log n)", "O(1)", "O(log n)"],
        ]}
      />
      <p>
        {tx(t, "alHeap_pqWhy",
          "A balanced search tree works but does more than needed: it keeps all keys in full sorted order, with pointers and rebalancing. A priority queue only ever needs to know the maximum. The heap keeps just enough order to find it, and that weaker order is much cheaper to maintain.")}
      </p>

      <H2>{tx(t, "alHeap_propTitle", "The heap property")}</H2>
      <p>
        {tx(t, "alHeap_propBody",
          "A binary max-heap is a binary tree with two properties. Order: every node's key is greater than or equal to the keys of its children. Following any path down from the root, keys never increase, so the root holds the maximum (if something bigger were anywhere, the path from the root to it would have to increase somewhere). Shape: the tree is complete, every level full except possibly the last, which is filled from the left. Unlike a search tree, the heap says nothing about left versus right: siblings can be in either order, and the keys are far from sorted. That freedom is what makes it cheap.")}
      </p>
      <H3>{tx(t, "alHeap_arrayTitle", "A complete tree fits in an array")}</H3>
      <p>
        {tx(t, "alHeap_arrayBody",
          "Number the nodes level by level, left to right: the root is 0, its children 1 and 2, the next level 3 to 6, and so on, and store node i in a[i]. A complete tree has no gaps in this numbering, so n nodes occupy exactly a[0] to a[n − 1]. No pointers are stored, because parent and children can be computed. The children of nodes 0, 1, …, i − 1 fill positions 1 to 2i (two each, in order; position 0 is the root, which is nobody's child). The children of node i come right after them:")}
      </p>
      <Equation label={tx(t, "alHeap_eqIdx", "Moving around a heap stored in an array")}
        where={[
          [r`i`, tx(t, "alHeap_wI", "the index of a node, counting from 0 level by level")],
          [r`\lfloor\,\cdot\,\rfloor`, tx(t, "alHeap_wFloor", "rounding down, which integer division (i − 1) / 2 does in C++ for i ≥ 1")],
        ]}
        note={tx(t, "alHeap_eqIdxNote", "Check: node 4's children are 9 and 10, and both have parent ⌊8/2⌋ = ⌊9/2⌋ = 4. A child index 2i + 1 ≥ n means the node has no such child.")}>
        {r`\text{left}(i) = 2i+1,\qquad \text{right}(i) = 2i+2,\qquad \text{parent}(i) = \left\lfloor \tfrac{i-1}{2} \right\rfloor`}
      </Equation>
      <p>
        {tx(t, "alHeap_heightBody",
          "Because the tree is complete, its height is always ⌊log₂ n⌋, the smallest possible (Trees chapter). No rebalancing is ever needed: the shape is fixed by n alone, and all the work goes into moving keys up or down within that shape.")}
      </p>

      <H2>{tx(t, "alHeap_pushTitle", "push: add at the end, sift up")}</H2>
      <p>
        {tx(t, "alHeap_pushBody",
          "The only place a new node can go without breaking the shape is the next free slot, a[n]. That may break the order if the new key is bigger than its parent. Fix it by sifting up: while the key is bigger than its parent's, swap the two and continue from the parent's position. Each swap is safe, because the parent that moves down is bigger than its other child already (it was the parent before), and the new key moving up is bigger than the old parent. The key stops when its parent is at least as big or it reaches the root: at most ⌊log₂ n⌋ swaps.")}
      </p>
      <CodeBlock lang="cpp" filename="max_heap.cpp" t={t}>{`struct MaxHeap {
    IntVector a;                                   // from the Dynamic Array chapter; a[0] is the max

    int  size() const  { return a.size; }
    bool empty() const { return a.size == 0; }
    int  top()         { return a[0]; }            // caller checks !empty()

    void push(int x) {
        a.push_back(x);
        siftUp(a.size - 1);
    }
    void pop() {                                   // caller checks !empty()
        a[0] = a[a.size - 1];                      // the last element fills the root
        a.pop_back();
        if (!empty()) siftDown(0);
    }

    void siftUp(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (a[p] >= a[i]) break;               // the parent is bigger: order holds
            swapElems(a.data, i, p);               // from Elementary Sorts
            i = p;
        }
    }
    void siftDown(int i) {
        int n = a.size;
        while (true) {
            int l = 2 * i + 1, r = l + 1, big = i;
            if (l < n && a[l] > a[big]) big = l;   // the biggest of the node and its children
            if (r < n && a[r] > a[big]) big = r;
            if (big == i) break;                   // already bigger than both children
            swapElems(a.data, i, big);
            i = big;
        }
    }
};`}</CodeBlock>

      <H2>{tx(t, "alHeap_popTitle", "pop: move the last to the root, sift down")}</H2>
      <p>
        {tx(t, "alHeap_popBody",
          "Removing the root leaves a hole at the top, but the shape only allows removing the last slot. So move the last element into the root and shrink the array by one. The new root is probably too small. Sift it down: compare it with its children, and if either child is bigger, swap it with the bigger child. It must be the bigger one: that child becomes the parent of the other, so it has to be at least as big as it. Continue from the child's position until the key is at least as big as both children or has no children. Again at most ⌊log₂ n⌋ swaps, each with two comparisons.")}
      </p>

      <HeapFigure t={t} />

      <H2>{tx(t, "alHeap_buildTitle", "Building a heap in linear time")}</H2>
      <p>
        {tx(t, "alHeap_buildBody",
          "To turn an arbitrary array into a heap, n pushes would cost O(n log n). There is a faster way. The leaves (the second half of the array, indices n/2 and up) are already tiny heaps of one node. Go backwards from the last node that has a child, index n/2 − 1, down to 0, and sift each node down. When node i is sifted down, both of its subtrees are already heaps (they were handled earlier, having larger indices), so after sifting, the subtree at i is a heap too. At the end the whole array is one.")}
      </p>
      <CodeBlock lang="cpp" filename="build_heap.cpp" t={t}>{`// Sifts a[i] down within the first n elements of a (a free-standing version of MaxHeap::siftDown).
void siftDown(int* a, int n, int i) {
    while (true) {
        int l = 2 * i + 1, r = l + 1, big = i;
        if (l < n && a[l] > a[big]) big = l;
        if (r < n && a[r] > a[big]) big = r;
        if (big == i) return;
        swapElems(a, i, big);
        i = big;
    }
}

void buildHeap(int* a, int n) {
    for (int i = n / 2 - 1; i >= 0; --i)           // every node that has a child, bottom-up
        siftDown(a, n, i);
}`}</CodeBlock>
      <p>
        {tx(t, "alHeap_buildWhy",
          "Why is this O(n) and not O(n log n)? A node sifts down at most as many levels as its height, and most nodes are near the bottom where the height is small. Half the nodes are leaves (height 0, no work), a quarter have height 1 (at most one swap), an eighth have height 2, and so on. In general at most n/2ᵏ⁺¹ nodes have height k. Adding up:")}
      </p>
      <Equation label={tx(t, "alHeap_eqBuild", "The total work of buildHeap")}
        where={[
          [r`k`, tx(t, "alHeap_wK", "a height: the most levels a node at that height can sift down")],
          [r`n/2^{k+1}`, tx(t, "alHeap_wCount", "the most nodes of height k in a heap of n nodes")],
          [r`\sum k/2^k = 2`, tx(t, "alHeap_wSum", "S = 1/2 + 2/4 + 3/8 + … = 2: subtracting S/2 = 1/4 + 2/8 + … term by term leaves 1/2 + 1/4 + 1/8 + … = 1, so S/2 = 1")],
        ]}
        note={tx(t, "alHeap_eqBuildNote", "So buildHeap does at most n swaps (and 2n comparisons), whatever the input. The expensive sift-downs, from near the root, are few; the many cheap ones are near the bottom.")}>
        {r`\sum_{k \ge 0} \frac{n}{2^{k+1}}\cdot k \;=\; \frac{n}{2}\sum_{k\ge 0}\frac{k}{2^k} \;=\; \frac{n}{2}\cdot 2 \;=\; n`}
      </Equation>

      <H2>{tx(t, "alHeap_sortTitle", "Heapsort")}</H2>
      <p>
        {tx(t, "alHeap_sortBody",
          "A max-heap gives a sorting algorithm almost for free. Build a heap in the array. The maximum is a[0], and it belongs at the very end: swap it with a[n − 1]. Now treat the heap as one element shorter, so the last position is finished and never touched again, and sift the new root down within the first n − 1 elements. The next maximum is then at a[0]; swap it into position n − 2, and so on. The array ends sorted in increasing order, with the sorted part growing from the right while the heap shrinks on the left.")}
      </p>
      <CodeBlock lang="cpp" filename="heapsort.cpp" t={t}>{`void heapSort(int* a, int n) {
    buildHeap(a, n);                               // O(n)
    for (int end = n - 1; end > 0; --end) {
        swapElems(a, 0, end);                      // the max goes to its final place
        siftDown(a, end, 0);                       // repair the heap of the first 'end' elements
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alHeap_sortCost",
          "The loop runs n − 1 times with one sift-down each, O(log n), so heapsort is O(n log n) in every case, with only O(1) extra memory. That is the combination the Quicksort chapter wanted for introsort's fallback: when quicksort's recursion gets too deep, std::sort finishes that range with heapsort. Heapsort is not the default because it is slower in practice than quicksort: sifting jumps between i and 2i + 1, far apart in memory for large arrays, so it misses the cache much more. It is also not stable: the first swap alone can carry an element past equal ones.")}
      </p>

      <H2>{tx(t, "alHeap_usesTitle", "Min-heaps and everyday uses")}</H2>
      <p>
        {tx(t, "alHeap_minBody",
          "A min-heap reverses every comparison, so the root is the minimum. In C++, std::priority_queue<int> in <queue> is a max-heap on top of a std::vector with push, top and pop, and std::priority_queue<int, std::vector<int>, std::greater<int>> is a min-heap. The functions std::make_heap, std::push_heap and std::pop_heap in <algorithm> do the same on a plain range.")}
      </p>
      <LessonTable
        headers={[tx(t, "alHeap_tTask", "Task"), tx(t, "alHeap_tHow", "How a heap solves it"), tx(t, "alHeap_tCost", "Cost")]}
        rows={[
          [tx(t, "alHeap_u1", "the k largest of n values"), tx(t, "alHeap_u1b", "keep a min-heap of the best k so far; a new value bigger than its root replaces the root"), "O(n log k)"],
          [tx(t, "alHeap_u2", "merge k sorted lists, N elements in total"), tx(t, "alHeap_u2b", "a min-heap holds the current front of each list; pop the smallest, push the next from the same list"), "O(N log k)"],
          [tx(t, "alHeap_u3", "the running median of a stream"), tx(t, "alHeap_u3b", "a max-heap for the smaller half, a min-heap for the larger half, sizes kept within one; the median is at a root"), tx(t, "alHeap_u3c", "O(log n) per value")],
          [tx(t, "alHeap_u4", "event simulation, timers"), tx(t, "alHeap_u4b", "a min-heap of events by time; always process the earliest"), tx(t, "alHeap_u4c", "O(log n) per event")],
          [tx(t, "alHeap_u5", "shortest paths, A*"), tx(t, "alHeap_u5b", "a min-heap of places by distance (Graphs section)"), "O((V + E) log V)"],
        ]}
      />
      <Callout type="tip" t={t}>
        {tx(t, "alHeap_topkTip", "The top-k trick uses the opposite kind of heap on purpose. To keep the k largest you need to know the smallest of them quickly, because that is the one to throw out when something better arrives, so the heap is a min-heap. It never holds more than k elements, so each step is O(log k), and for k = 10 out of a billion values that is about 3 comparisons per value.")}
      </Callout>

      <H2>{tx(t, "alHeap_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alHeap_w1",
          "1. push 80 into the heap [90, 72, 65, 40, 58, 30, 12, 8, 25] (the figure's start). 80 goes to index 9. Its parent is (9 − 1)/2 = 4, holding 58: 80 is bigger, swap. Now at index 4, parent (4 − 1)/2 = 1 holds 72: swap. At index 1, parent 0 holds 90: stop. Result [90, 80, 65, 40, 72, 30, 12, 8, 25, 58], after 2 swaps and 3 comparisons.")}
      </p>
      <p>
        {tx(t, "alHeap_w2",
          "2. pop from the original heap. The max 90 is removed; the last element 25 moves to the root: [25, 72, 65, 40, 58, 30, 12, 8]. Children 72 and 65: the bigger is 72, swap: [72, 25, 65, 40, 58, 30, 12, 8]. At index 1, children at 3 and 4 are 40 and 58: swap with 58. At index 4, children would be 9 and 10, beyond n = 8: stop. Result [72, 58, 65, 40, 25, 30, 12, 8].")}
      </p>
      <p>
        {tx(t, "alHeap_w3",
          "3. buildHeap on [3, 9, 2, 1, 4, 5], n = 6. Start at n/2 − 1 = 2: 2 has one child, 5 at index 5, swap: [3, 9, 5, 1, 4, 2]. Index 1: 9 is bigger than 1 and 4, nothing to do. Index 0: 3 against 9 and 5, swap with 9: [9, 3, 5, 1, 4, 2]; continue at index 1: 3 against 1 and 4, swap with 4: [9, 4, 5, 1, 3, 2]. Done, 3 swaps, and every parent is at least its children.")}
      </p>

      <H2>{tx(t, "alHeap_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alHeap_tMistake", "Mistake"), tx(t, "alHeap_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alHeap_e1", "Swapping with the smaller child when sifting down"), tx(t, "alHeap_e1b", "the smaller child becomes parent of the bigger one and the order breaks. Always pick the biggest of node, left, right")],
          [tx(t, "alHeap_e2", "1-based formulas on a 0-based array"), tx(t, "alHeap_e2b", "children 2i and 2i + 1 are for arrays starting at index 1; from 0 they are 2i + 1 and 2i + 2")],
          [tx(t, "alHeap_e3", "Checking only the left child's bound"), tx(t, "alHeap_e3b", "a node can have a left child but no right one; test l < n and r < n separately")],
          [tx(t, "alHeap_e4", "Expecting a heap to be sorted"), tx(t, "alHeap_e4b", "only the root is known; iterating over the array does not give sorted order")],
          [tx(t, "alHeap_e5", "Building with n pushes"), tx(t, "alHeap_e5b", "works but costs O(n log n); bottom-up buildHeap is O(n)")],
        ]}
      />

      <KeyIdeas t={t} id="alHeap" items={[
        "A priority queue serves the highest-priority element first: push, top, pop.",
        "A max-heap is a complete binary tree where every parent is ≥ its children; the root is the maximum.",
        "Stored level by level in an array: children 2i + 1 and 2i + 2, parent (i − 1)/2; the height is ⌊log₂ n⌋.",
        "push appends and sifts up; pop moves the last element to the root and sifts down: O(log n) each.",
        "Bottom-up buildHeap is O(n), because most nodes are near the bottom.",
        "Heapsort: build, then swap the root to the end n − 1 times — O(n log n) worst case, in place, not stable.",
      ]} />
    </Article>
  );
}
