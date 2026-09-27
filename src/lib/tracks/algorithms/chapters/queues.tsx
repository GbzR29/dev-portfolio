"use client";

// Linear Structures 4: queues and deques — FIFO; why the front of an array is
// the wrong place to remove from; the circular buffer with head + size and
// modulo wrap-around, telling full from empty; a growable IntQueue that
// copies oldest first; the deque (push_front with (head − 1 + cap) % cap);
// a queue on a linked list; a queue from two stacks with amortised O(1);
// the sliding-window maximum with a monotonic deque; uses (buffers, BFS,
// simulation); std::queue/deque; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { RingBufferFigure } from "@/components/lesson/figures/algo/RingBufferFigure";

export function QueuesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alQueue_intro",
          "A queue is the stack's opposite twin: elements leave in the order they arrived, like people in a line at a counter. It is how computers hand out work fairly: keystrokes waiting to be processed, documents waiting for the printer, network packets waiting to be sent, and, later in this track, the nodes waiting to be explored by breadth-first search. The interesting part is not the idea but the storage: done naively, removing from the front is slow. The circular buffer fixes that with nothing more than the remainder operation.")}
      </Lead>

      <H2>{tx(t, "alQueue_defTitle", "First in, first out")}</H2>
      <p>
        {tx(t, "alQueue_defBody",
          "A queue has two ends. Elements are added at the back (also called the tail) and removed from the front (the head), so the element removed is always the one that has waited longest. This rule is FIFO, first in, first out. Its operations, all expected to be O(1):")}
      </p>
      <LessonTable
        headers={[tx(t, "alQueue_tOp", "Operation"), tx(t, "alQueue_tDoes", "What it does")]}
        rows={[
          [tx(t, "alQueue_op1", "push(x) (enqueue)"), tx(t, "alQueue_op1b", "adds x at the back")],
          [tx(t, "alQueue_op2", "pop() (dequeue)"), tx(t, "alQueue_op2b", "removes the front element (the queue must not be empty)")],
          ["front()", tx(t, "alQueue_op3", "returns the front element without removing it")],
          ["empty()", tx(t, "alQueue_op4", "tells whether the queue has no elements")],
        ]}
      />

      <H2>{tx(t, "alQueue_naiveTitle", "Why not just an array?")}</H2>
      <p>
        {tx(t, "alQueue_naiveBody",
          "Pushing at the back of a dynamic array is O(1), but removing the front element means shifting every other element one place left: Θ(n) per pop. A second idea is to leave the elements where they are and keep an index head of the current front, increasing it on every pop. Now pop is O(1), but the used part of the array drifts to the right forever: after a million pushes and pops the queue may hold three elements yet occupy slots 999 997 to 999 999, with all the space in front wasted. The fix is to let the indices wrap around to the start of the array, as if its two ends were glued together.")}
      </p>

      <H2>{tx(t, "alQueue_ringTitle", "The circular buffer")}</H2>
      <p>
        {tx(t, "alQueue_ringBody",
          "Keep a block of capacity slots, the index head of the front element, and the number of elements size. The elements occupy the slots head, head + 1, …, wrapping past the last slot back to slot 0. Wrapping is the remainder operation from the Math track's clock arithmetic: the slot after i is (i + 1) mod capacity. The back, where the next element goes, is tail = (head + size) mod capacity. push writes at tail and increases size; pop increases head (wrapping) and decreases size. Nothing ever moves.")}
      </p>

      <RingBufferFigure t={t} />

      <H3>{tx(t, "alQueue_fullTitle", "Full or empty?")}</H3>
      <p>
        {tx(t, "alQueue_fullBody",
          "Why keep size instead of a tail index? With only head and tail, an empty queue has head == tail, and a full queue also has head == tail (the tail has gone all the way round), so the two cannot be told apart. Keeping size solves it: empty is size == 0, full is size == capacity. The other common solution stores head and tail and never lets the buffer get completely full, sacrificing one slot.")}
      </p>
      <CodeBlock lang="cpp" filename="int_queue.cpp" t={t}>{`struct IntQueue {
    int* data = nullptr;
    int  capacity = 0;
    int  head = 0;                     // slot of the front element
    int  size = 0;                     // the back is at (head + size) % capacity

    IntQueue() = default;
    ~IntQueue() { delete[] data; }
    IntQueue(const IntQueue&) = delete;
    IntQueue& operator=(const IntQueue&) = delete;

    bool empty() const { return size == 0; }
    int  front() const { return data[head]; }              // caller checks !empty()

    void push(int x) {                                      // O(1) amortised
        if (size == capacity) grow();
        data[(head + size) % capacity] = x;
        ++size;
    }
    void pop() {                                            // O(1); caller checks !empty()
        head = (head + 1) % capacity;
        --size;
    }

    void grow() {                                           // unwrap into a block twice as big
        int newCap = capacity == 0 ? 4 : 2 * capacity;
        int* bigger = new int[newCap];
        for (int i = 0; i < size; ++i)
            bigger[i] = data[(head + i) % capacity];        // oldest first
        delete[] data;
        data = bigger;
        capacity = newCap;
        head = 0;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "alQueue_growBody",
          "Growing is the dynamic array's doubling with one twist: the elements may wrap around the end of the old block, so they cannot be copied in slot order. The loop copies them in queue order, front first, into slots 0 to size − 1 of the new block and resets head to 0. As in the Dynamic Array chapter, doubling makes push amortised O(1). Many real-time systems use a fixed capacity instead and reject or overwrite when full, so that no push ever pays for a copy.")}
      </p>

      <H2>{tx(t, "alQueue_dequeTitle", "The deque: both ends")}</H2>
      <p>
        {tx(t, "alQueue_dequeBody",
          "A deque (double-ended queue, pronounced \"deck\") allows push and pop at both ends. The circular buffer already supports it: the back is (head + size − 1) mod capacity, and to push at the front, step head back one slot. Stepping back needs care in C++, because the % operator keeps the sign of the left operand: (0 − 1) % 8 is −1, not 7. Adding capacity first keeps the number non-negative: (head − 1 + capacity) % capacity.")}
      </p>
      <CodeBlock lang="cpp" filename="deque_ops.cpp" t={t}>{`// Extra members for IntQueue, making it a deque.
void push_front(int x) {
    if (size == capacity) grow();
    head = (head - 1 + capacity) % capacity;   // one slot back, wrapping 0 -> capacity-1
    data[head] = x;
    ++size;
}
int  back() const { return data[(head + size - 1) % capacity]; }
void pop_back()   { --size; }                   // the back slot is simply forgotten`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "alQueue_stdNote", "In C++, std::deque stores its elements in fixed-size blocks with a small table of block pointers, so that growing never moves existing elements, and std::queue and std::stack are adapters that sit on a std::deque by default. A queue that serves the most important element first rather than the oldest is a priority queue; it needs a different structure, the heap, in the Trees section.")}
      </Callout>

      <H2>{tx(t, "alQueue_otherTitle", "Two other ways to build a queue")}</H2>
      <p>
        {tx(t, "alQueue_listBody",
          "A linked list with head and tail pointers is a queue as it stands: push_back at the tail and pop_front at the head are both O(1) (Linked Lists chapter). It never needs to copy, at the price of one allocation per element and poor cache behaviour.")}
      </p>
      <p>
        {tx(t, "alQueue_twoBody",
          "A classic puzzle: build a queue from two stacks. Push onto the stack in. To pop, take from the stack out; if out is empty, first move every element of in onto out, one pop and push at a time. The move reverses their order, so the oldest element, which was at the bottom of in, ends at the top of out. A single pop may move n elements, but every element is moved from in to out exactly once in its life, so n operations cost O(n) in total: amortised O(1), the same accounting as the monotonic stack.")}
      </p>
      <CodeBlock lang="cpp" filename="two_stack_queue.cpp" t={t}>{`struct TwoStackQueue {
    IntStack in, out;                             // from the Stacks chapter

    void push(int x) { in.push(x); }
    int  front()     { refill(); return out.top(); }
    void pop()       { refill(); out.pop(); }
    bool empty() const { return in.empty() && out.empty(); }

    void refill() {                               // only when out has run dry
        if (!out.empty()) return;
        while (!in.empty()) { out.push(in.top()); in.pop(); }   // reverses the order
    }
};`}</CodeBlock>

      <H2>{tx(t, "alQueue_windowTitle", "A deque trick: the sliding-window maximum")}</H2>
      <p>
        {tx(t, "alQueue_windowBody",
          "Given an array and a window width k, report the maximum of every window of k consecutive elements (the highest price in each 3-day period, say). Scanning each window costs Θ(n · k). A deque of indices does it in Θ(n). The deque holds candidates for the maximum of the current window, with values decreasing from front to back. When a new element arrives, every candidate at the back that is ≤ it can never be a maximum again (the new one is at least as big and stays in the window longer), so pop them; then push the new index at the back. If the front index has slid out of the window, pop it from the front. The front is then the maximum. Each index enters once and leaves once: Θ(n). Because there are at most n pushes in total, a plain array with two indices is enough as the deque here.")}
      </p>
      <CodeBlock lang="cpp" filename="window_max.cpp" t={t}>{`// out[i] = max of a[i..i+k-1], for i = 0 .. n-k.
void windowMax(const int* a, int n, int k, int* out) {
    int* dq = new int[n];                        // indices; dq[front..back-1] is the deque
    int front = 0, back = 0;
    for (int i = 0; i < n; ++i) {
        while (back > front && a[dq[back - 1]] <= a[i]) --back;   // beaten for good
        dq[back++] = i;
        if (dq[front] <= i - k) ++front;         // slid out of the window
        if (i >= k - 1) out[i - k + 1] = a[dq[front]];
    }
    delete[] dq;
}`}</CodeBlock>

      <H2>{tx(t, "alQueue_usesTitle", "Where queues appear")}</H2>
      <LessonTable
        headers={[tx(t, "alQueue_tUse", "Use"), tx(t, "alQueue_tWhy", "Why a queue")]}
        rows={[
          [tx(t, "alQueue_u1", "input and I/O buffers"), tx(t, "alQueue_u1b", "the producer (keyboard, network card) and the consumer (the program) run at different speeds; a ring buffer between them keeps the order")],
          [tx(t, "alQueue_u2", "task and job queues"), tx(t, "alQueue_u2b", "work is served in arrival order, so no job waits forever")],
          [tx(t, "alQueue_u3", "breadth-first search"), tx(t, "alQueue_u3b", "exploring a graph level by level: nodes found first are expanded first (Graph Traversal chapter)")],
          [tx(t, "alQueue_u4", "simulation"), tx(t, "alQueue_u4b", "customers at a counter, cars at a traffic light: arrivals join the back, service takes the front")],
        ]}
      />

      <H2>{tx(t, "alQueue_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alQueue_w1",
          "1. A circular buffer of capacity 4. push 1, 2, 3: slots [1, 2, 3, _], head 0, size 3. pop returns 1: head 1, size 2. push 4 goes to (1 + 2) mod 4 = 3. push 5 goes to (1 + 3) mod 4 = 0, wrapping to the start: slots [5, 2, 3, 4], head 1, size 4, full. push 6 grows: the copy reads slots 1, 2, 3, 0, giving [2, 3, 4, 5, _, _, _, _] with head 0, and 6 goes to slot 4.")}
      </p>
      <p>
        {tx(t, "alQueue_w2",
          "2. Two-stack queue: push 1, 2, 3, so in = [1, 2, 3] (top 3). pop: out is empty, so move all three: out = [3, 2, 1] with 1 on top; pop 1. push 4: in = [4]. front: out still holds 2 on top, so 2, with no moving. Each element crosses from in to out once.")}
      </p>
      <p>
        {tx(t, "alQueue_w3",
          "3. Window maxima of [1, 3, −1, −3, 5, 3, 6, 7] with k = 3: the windows [1, 3, −1], [3, −1, −3], [−1, −3, 5], [−3, 5, 3], [5, 3, 6], [3, 6, 7] have maxima 3, 3, 5, 5, 6, 7. When 5 arrives at index 4, the deque holds the indices of 3, −1 and −3; 5 pops all three from the back (none of them can ever be a maximum again) and becomes the only candidate.")}
      </p>

      <H2>{tx(t, "alQueue_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alQueue_tMistake", "Mistake"), tx(t, "alQueue_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alQueue_e1", "Removing from the front of an array by shifting"), tx(t, "alQueue_e1b", "Θ(n) per pop. Use a circular buffer or std::deque")],
          [tx(t, "alQueue_e2", "(head − 1) % capacity"), tx(t, "alQueue_e2b", "is −1 when head is 0: a negative index. Add capacity before taking the remainder")],
          [tx(t, "alQueue_e3", "Telling full from empty with head == tail"), tx(t, "alQueue_e3b", "both look the same. Keep a size, or leave one slot unused")],
          [tx(t, "alQueue_e4", "Growing by copying slots 0 to size − 1"), tx(t, "alQueue_e4b", "a wrapped queue comes out in the wrong order. Copy in queue order from head")],
          [tx(t, "alQueue_e5", "Using a stack where fairness matters"), tx(t, "alQueue_e5b", "LIFO serves the newest first and can starve old work; FIFO serves in arrival order")],
        ]}
      />

      <KeyIdeas t={t} id="alQueue" items={[
        "A queue is FIFO: push at the back, pop from the front, both O(1).",
        "A circular buffer stores it in an array whose indices wrap with mod capacity; nothing ever moves.",
        "Keep head and size: tail = (head + size) mod capacity, and full and empty are easy to tell apart.",
        "Growing copies the elements in queue order, oldest first; doubling keeps push amortised O(1).",
        "A deque adds push and pop at the front: head = (head − 1 + capacity) mod capacity.",
        "Two stacks make a queue with amortised O(1); a monotonic deque gives every window's maximum in Θ(n).",
      ]} />
    </Article>
  );
}
