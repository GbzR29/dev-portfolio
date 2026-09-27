"use client";

// Linear Structures 1: the dynamic array — size vs capacity on the heap;
// an IntVector with constructor/destructor and copying disabled; push_back
// with growth by reallocation; amortised O(1) for doubling (copies < 2n, the
// 3-coin accounting argument) against Θ(n²) for +c growth; the growth factor
// trade-off (2 vs 1.5); shrinking at a quarter to avoid thrashing; insert and
// erase in the middle; pointer invalidation; std::vector; worked examples;
// common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { DynArrayFigure } from "@/components/lesson/figures/algo/DynArrayFigure";

const r = String.raw;

export function DynamicArrayContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alDyn_intro",
          "An array is the fastest structure there is for reading element i: one multiplication and one addition give its address (Memory chapter). Its weakness is that its size is fixed when it is created, and most programs do not know in advance how much data they will get. The dynamic array keeps the array's speed and removes that limit. It is the most used data structure in C++ (std::vector), and building it teaches a new kind of cost analysis, the amortised cost, which the rest of the track uses again and again.")}
      </Lead>

      <H2>{tx(t, "alDyn_ideaTitle", "Size and capacity")}</H2>
      <p>
        {tx(t, "alDyn_ideaBody",
          "The idea is to allocate a block on the heap that is larger than needed right now, and to keep two numbers: the size, how many elements are actually stored, and the capacity, how many fit in the block. Elements occupy positions 0 to size − 1; positions size to capacity − 1 are spare room, allocated but unused. Adding an element at the end while there is room is a single write. When the block is full, allocate a bigger one, copy the elements across, free the old block, and continue. The copying is expensive, but, as we will prove, it can be made rare enough that it hardly matters.")}
      </p>
      <LessonTable
        headers={[tx(t, "alDyn_tField", "Field"), tx(t, "alDyn_tMeaning", "Meaning")]}
        rows={[
          ["data", tx(t, "alDyn_f1", "pointer to the first element of the block on the heap (nullptr while nothing is allocated)")],
          ["size", tx(t, "alDyn_f2", "the number of elements stored; the valid indices are 0 to size − 1")],
          ["capacity", tx(t, "alDyn_f3", "the number of elements the block can hold; always size ≤ capacity")],
        ]}
      />

      <H2>{tx(t, "alDyn_codeTitle", "Building it")}</H2>
      <p>
        {tx(t, "alDyn_codeBody",
          "We write it as a struct with member functions, so the three fields always change together. Two C++ details are new in this track. The destructor, ~IntVector(), runs automatically when the object goes out of scope and frees the block, so there is no delete to forget (this is RAII, from the Memory chapter). And copying is switched off with = delete: a default copy would copy the pointer, not the elements, so two vectors would share one block and both would free it. The Modern C++ track's Move Semantics and RAII chapters show how to write a proper copy; here we simply forbid it. The element type is fixed to int to keep the code short; the Templates chapter of that track shows how to make it work for any type.")}
      </p>
      <CodeBlock lang="cpp" filename="int_vector.cpp" t={t}>{`struct IntVector {
    int* data = nullptr;
    int  size = 0;
    int  capacity = 0;

    IntVector() = default;
    ~IntVector() { delete[] data; }                    // frees the block automatically
    IntVector(const IntVector&) = delete;              // no accidental sharing of 'data'
    IntVector& operator=(const IntVector&) = delete;

    int& operator[](int i) { return data[i]; }         // v[i], no bounds check, O(1)

    void reserve(int newCap) {                         // make room for newCap elements
        if (newCap <= capacity) return;
        int* bigger = new int[newCap];
        for (int i = 0; i < size; ++i) bigger[i] = data[i];   // copy: Θ(size)
        delete[] data;
        data = bigger;
        capacity = newCap;
    }

    void push_back(int x) {
        if (size == capacity) reserve(capacity == 0 ? 1 : 2 * capacity);   // full: double
        data[size++] = x;                              // write, then count it
    }

    void pop_back() { --size; }                        // the caller checks size > 0
    bool empty() const { return size == 0; }
};`}</CodeBlock>
      <p>
        {tx(t, "alDyn_opBody",
          "operator[] is operator overloading: it lets us write v[i] instead of v.data[i]. It returns a reference (int&), so v[i] = 5 writes into the block. data[size++] = x writes at index size and then increases size by one. pop_back just forgets the last element by decreasing size; the value stays in memory but is no longer part of the array.")}
      </p>

      <DynArrayFigure t={t} />

      <H2>{tx(t, "alDyn_amortTitle", "Why doubling makes push_back O(1)")}</H2>
      <p>
        {tx(t, "alDyn_amortBody",
          "A single push_back can be very slow: the one that finds the block full copies every element, Θ(n). But that cannot happen often. Starting from an empty vector and doubling, the expensive pushes are the ones that find size = 1, 2, 4, 8, …, and each copies that many elements. For n pushes, the last growth happens at some size 2ᵏ < n, so the total number of copies is 1 + 2 + 4 + … + 2ᵏ = 2ᵏ⁺¹ − 1 < 2 · 2ᵏ < 2n (the geometric series from the Recursion chapter's Hanoi count).")}
      </p>
      <Equation label={tx(t, "alDyn_eqTotal", "Total work of n push_backs with doubling")}
        where={[
          [r`n`, tx(t, "alDyn_wN", "the number of push_backs, each writing one element")],
          [r`2^k`, tx(t, "alDyn_w2k", "the size at the last growth, the largest power of 2 below n")],
          [r`1 + 2 + \dots + 2^k`, tx(t, "alDyn_wSum", "the elements copied by all the growths together")],
        ]}
        note={tx(t, "alDyn_eqTotalNote", "Divide by n: fewer than 3 steps per push_back on average, however large n gets. The average over a whole sequence of operations is called the amortised cost, and here it is O(1).")}>
        {r`\text{work} = \underbrace{n}_{\text{writes}} + \underbrace{(2^{k+1} - 1)}_{\text{copies}} \;<\; n + 2n = 3n`}
      </Equation>
      <p>
        {tx(t, "alDyn_amortMeaning",
          "Amortised is not the same as average over random inputs. It is a guarantee about every sequence of operations: no sequence of n push_backs, however chosen, costs more than 3n. Individual operations may still be slow, which matters in real-time programs (an audio callback cannot afford a sudden copy of a million elements); calling reserve with the final size in advance removes all the copies.")}
      </p>
      <H3>{tx(t, "alDyn_coinTitle", "The same result with coins")}</H3>
      <p>
        {tx(t, "alDyn_coinBody",
          "Another way to see it, the accounting method: charge every push_back 3 coins, one coin per step of work. One coin pays for writing the element. The other two are saved in the element's slot. Just after a growth to capacity 2s, the array holds s elements and no savings. By the time it is full again, s new elements have been pushed, each leaving 2 coins: 2s coins, exactly enough to copy all 2s elements in the next growth. The bank never runs out, so 3 coins per push always suffice.")}
      </p>
      <H3>{tx(t, "alDyn_plusTitle", "Why adding a constant does not work")}</H3>
      <p>
        {tx(t, "alDyn_plusBody",
          "It is tempting to grow by a fixed amount, say 4 more slots each time, to waste less memory. Then a growth happens every 4 pushes, copying 4, 8, 12, … elements. For n pushes that is 4 + 8 + … ≈ 4 · (n/4)²/2 = n²/8 copies: Θ(n²) in total, Θ(n) per push on average. Switch the figure to +4 and fill it: the red bars keep coming and keep growing. What makes doubling work is that the growth is proportional to the size, so the gaps between copies grow as fast as the copies themselves.")}
      </p>
      <LessonTable
        headers={[tx(t, "alDyn_tPushes", "push_backs n"), tx(t, "alDyn_tDouble", "copies, ×2"), tx(t, "alDyn_tHalf", "copies, ×1.5"), tx(t, "alDyn_tPlus", "copies, +4")]}
        rows={[
          ["20", "31", "48", "40"],
          ["1 000", "1 023", "2 119", "124 500"],
        ]}
      />
      <H3>{tx(t, "alDyn_factorTitle", "Which factor?")}</H3>
      <p>
        {tx(t, "alDyn_factorBody",
          "Any factor r > 1 gives amortised O(1). The copies form a geometric series with ratio 1/r, which adds up to less than n · r/(r − 1): 2n for r = 2, 3n for r = 1.5. In exchange, a smaller factor wastes less memory: just after a growth the block is r times the size, so up to (r − 1)/r of it is unused, 50% for 2 and 33% for 1.5. The GCC and Clang standard libraries double; Microsoft's grows by 1.5.")}
      </p>

      <H2>{tx(t, "alDyn_shrinkTitle", "Shrinking without thrashing")}</H2>
      <p>
        {tx(t, "alDyn_shrinkBody",
          "After many pop_backs the block may be mostly empty. The natural idea, halving the capacity when the array becomes half full, has a trap. Take a full array of capacity 2s. One push doubles it to 4s (copying 2s), one pop leaves it half full and halves it back to 2s (copying 2s), and a push-pop-push-pop sequence copies Θ(n) every time. The fix is a gap between the two thresholds: grow when full, but shrink to half only when the array is a quarter full. After any resize the array is half full, so at least a quarter of the capacity's worth of operations must happen before the next one, and those operations pay for it. std::vector never shrinks on its own; shrink_to_fit asks it to.")}
      </p>

      <H2>{tx(t, "alDyn_middleTitle", "Inserting and erasing in the middle")}</H2>
      <p>
        {tx(t, "alDyn_middleBody",
          "The elements must stay contiguous, so inserting at position i means shifting every element from i to the end one place right to open a gap, and erasing means shifting them left to close it. That costs Θ(size − i): fast near the end, Θ(n) near the front. The loop directions matter: to insert, shift from the back so no element is overwritten before it has been moved; to erase, shift from the front.")}
      </p>
      <CodeBlock lang="cpp" filename="insert_erase.cpp" t={t}>{`// Members of IntVector.
void insert(int i, int x) {                     // 0 <= i <= size
    if (size == capacity) reserve(capacity == 0 ? 1 : 2 * capacity);
    for (int j = size; j > i; --j) data[j] = data[j - 1];   // back to front
    data[i] = x;
    ++size;
}

void erase(int i) {                             // 0 <= i < size
    for (int j = i; j + 1 < size; ++j) data[j] = data[j + 1];   // front to back
    --size;
}`}</CodeBlock>
      <Callout type="tip" t={t}>
        {tx(t, "alDyn_swapErase", "When the order of the elements does not matter (a bag of items, a list of active objects), erase in O(1): copy the last element over position i and pop_back. This \"swap and pop\" is one of the most useful small tricks with arrays.")}
      </Callout>

      <H2>{tx(t, "alDyn_invalidTitle", "The trap: pointers into a vector")}</H2>
      <p>
        {tx(t, "alDyn_invalidBody",
          "A growth moves every element to a new block and frees the old one. Any pointer or reference into the old block, such as int* p = &v[0] taken before a push_back, now points to freed memory: a dangling pointer (Memory chapter). Using it is undefined behaviour and may seem to work for a while. The rule: after anything that can change the capacity (push_back, insert, reserve), pointers, references and iterators into the vector are invalid. Keep indices instead of pointers when the vector may grow.")}
      </p>
      <CodeBlock lang="cpp" filename="dangling.cpp" t={t}>{`IntVector v;
v.push_back(10);
int* first = &v[0];      // points into the current block
v.push_back(20);         // block full: reallocated, old block freed
// *first is now a read of freed memory: undefined behaviour
int i = 0;               // an index stays valid: v[i] is still 10`}</CodeBlock>

      <H2>{tx(t, "alDyn_stdTitle", "std::vector")}</H2>
      <p>
        {tx(t, "alDyn_stdBody",
          "std::vector<int> in <vector> is this design, generalised to any type and with proper copying and moving. The names match: size(), capacity(), push_back, pop_back, reserve, insert, erase, operator[] (unchecked) and at(i) (checked: it throws an exception for a bad index). Because the elements are contiguous, walking through a vector reads memory in order, which the cache handles very well; that is why a vector often beats structures with better Big-O on paper, as the next chapter shows.")}
      </p>
      <LessonTable
        headers={[tx(t, "alDyn_tOp", "Operation"), tx(t, "alDyn_tCost", "Cost")]}
        rows={[
          [tx(t, "alDyn_o1", "read or write v[i]"), "O(1)"],
          [tx(t, "alDyn_o2", "push_back, pop_back"), tx(t, "alDyn_o2c", "O(1) amortised (one push may be Θ(n))")],
          [tx(t, "alDyn_o3", "insert / erase at position i"), "Θ(n − i)"],
          [tx(t, "alDyn_o4", "search for a value"), tx(t, "alDyn_o4c", "Θ(n), or Θ(log n) if kept sorted (binary search)")],
          [tx(t, "alDyn_o5", "reserve(c)"), tx(t, "alDyn_o5c", "Θ(size) if it has to reallocate")],
        ]}
      />

      <H2>{tx(t, "alDyn_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alDyn_w1",
          "1. Push 9 elements into an empty IntVector. Capacities: 0 → 1 at the 1st push (nothing to copy), → 2 at the 2nd (copy 1), → 4 at the 3rd (copy 2), → 8 at the 5th (copy 4), → 16 at the 9th (copy 8). Copies: 1 + 2 + 4 + 8 = 15. Total work: 9 writes + 15 copies = 24 < 3 · 9 = 27. Final state: size 9, capacity 16.")}
      </p>
      <p>
        {tx(t, "alDyn_w2",
          "2. Growing by +4 instead, for 1000 pushes: the growths happen at sizes 4, 8, …, 996, copying 4 + 8 + … + 996 = 4 · (1 + 2 + … + 249) = 4 · 249 · 250/2 = 124 500 elements, against 1023 with doubling. About 120 times more copying, and the gap widens linearly with n.")}
      </p>
      <p>
        {tx(t, "alDyn_w3",
          "3. Insert at the front of a vector of 100 000 elements, 1000 times: each insert shifts about 100 000 elements, 10⁸ moves in total. Collecting the 1000 new elements in a separate vector and then building the result in one pass (the new ones in reverse order, then the old ones) costs about 1000 + 101 000 steps, a thousand times less. When you need fast insertion at both ends, the deque of the Queues chapter is the right structure.")}
      </p>

      <H2>{tx(t, "alDyn_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alDyn_tMistake", "Mistake"), tx(t, "alDyn_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alDyn_e1", "Keeping a pointer across push_back"), tx(t, "alDyn_e1b", "it dangles after a reallocation. Keep an index, or reserve enough first")],
          [tx(t, "alDyn_e2", "Growing by a constant"), tx(t, "alDyn_e2b", "Θ(n²) total copying. Grow by a factor (×2 or ×1.5)")],
          [tx(t, "alDyn_e3", "Doubling from capacity 0"), tx(t, "alDyn_e3b", "2 · 0 = 0: the vector never grows and the write goes out of bounds. Start at 1 (or some small number)")],
          [tx(t, "alDyn_e4", "Copying the struct with the default copy"), tx(t, "alDyn_e4b", "two objects free the same block: a double delete. Delete the copy operations or write real ones")],
          [tx(t, "alDyn_e5", "Shifting in the wrong direction on insert"), tx(t, "alDyn_e5b", "front-to-back copying overwrites elements before moving them: every slot gets the same value. Shift from the back")],
          [tx(t, "alDyn_e6", "Shrinking at half full"), tx(t, "alDyn_e6b", "alternating push/pop at the boundary copies Θ(n) every time. Shrink at a quarter")],
        ]}
      />

      <KeyIdeas t={t} id="alDyn" items={[
        "A dynamic array keeps a heap block with size ≤ capacity; push_back writes into spare room and reallocates only when full.",
        "Growing by a factor makes the copies a geometric series: under 2n copies for n pushes with doubling, so push_back is amortised O(1).",
        "Growing by a constant costs Θ(n²) in total.",
        "Amortised cost is a guarantee over every sequence of operations, not an average over random inputs.",
        "Insert and erase in the middle shift elements: Θ(n). Swap-and-pop erases in O(1) when order does not matter.",
        "Reallocation invalidates pointers, references and iterators into the array; indices survive.",
        "std::vector is this structure; its contiguous memory makes it very cache friendly.",
      ]} />
    </Article>
  );
}
