"use client";

// Linear Structures 2: linked lists — nodes and next pointers; traversal and
// search (no random access); an IntList with head, tail and size: push_front,
// push_back, pop_front, insert_after, erase_after and the destructor; the
// predecessor problem; in-place reversal; doubly linked lists with a circular
// sentinel; fast and slow pointers (middle, Floyd's cycle detection); merge
// sort on lists without a buffer; arrays vs lists including memory per node
// and the cache; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { LinkedListFigure } from "@/components/lesson/figures/algo/LinkedListFigure";

export function LinkedListContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alList_intro",
          "A dynamic array keeps its elements side by side, which makes reading element i instant but inserting at the front slow: everything has to shift. A linked list makes the opposite trade. Each element lives in its own small block, called a node, anywhere in memory, and each node stores the address of the next one. Inserting or removing next to a node you already hold is then a matter of rewriting one or two pointers, whatever the length of the list. This chapter builds singly and doubly linked lists, shows the classic pointer techniques, and ends with an honest comparison, because in practice the array wins more often than its Big-O suggests.")}
      </Lead>

      <H2>{tx(t, "alList_nodeTitle", "Nodes and pointers")}</H2>
      <p>
        {tx(t, "alList_nodeBody",
          "A node holds a value and a pointer to the next node. The list itself is just a pointer to the first node, called head. The last node's next is nullptr, which marks the end, and an empty list has head == nullptr. Nothing requires the nodes to be next to each other in memory: each one was allocated separately with new, wherever the allocator found room. The pointers are the only thing that turns them into a sequence.")}
      </p>
      <CodeBlock lang="cpp" filename="node.cpp" t={t}>{`struct Node {
    int   value;
    Node* next;          // the following node, or nullptr at the end
};

// Visit every node: follow the pointers until nullptr.
int length(const Node* head) {
    int n = 0;
    for (const Node* p = head; p != nullptr; p = p->next) ++n;
    return n;
}

// Linear search: there is no way to jump to the middle.
Node* find(Node* head, int x) {
    for (Node* p = head; p != nullptr; p = p->next)
        if (p->value == x) return p;
    return nullptr;
}`}</CodeBlock>
      <p>
        {tx(t, "alList_noIndex",
          "p = p->next is the list's version of ++i. Its price shows immediately: to reach the node at position i there is no address arithmetic, you must follow i pointers from the head, Θ(i). So a linked list has no fast v[i], and binary search is useless on it (finding the middle already costs n/2 steps).")}
      </p>

      <H2>{tx(t, "alList_listTitle", "A list with head and tail")}</H2>
      <p>
        {tx(t, "alList_listBody",
          "Keeping only head makes adding at the end slow, since we would have to walk to the last node first. So the list also keeps tail, a pointer to the last node, and its size. Every operation must keep all three correct, including the special cases of an empty list and a list with one node. The destructor walks the list and deletes every node; note that it saves next before deleting, because after delete the node's fields must not be read.")}
      </p>
      <CodeBlock lang="cpp" filename="int_list.cpp" t={t}>{`struct IntList {
    Node* head = nullptr;
    Node* tail = nullptr;
    int   size = 0;

    IntList() = default;
    ~IntList() {
        while (head) {
            Node* next = head->next;      // read before the node is freed
            delete head;
            head = next;
        }
    }
    IntList(const IntList&) = delete;
    IntList& operator=(const IntList&) = delete;

    void push_front(int x) {              // O(1)
        head = new Node{x, head};         // the new node points to the old first
        if (!tail) tail = head;           // the list was empty
        ++size;
    }
    void push_back(int x) {               // O(1) thanks to tail
        Node* n = new Node{x, nullptr};
        if (tail) tail->next = n; else head = n;
        tail = n;
        ++size;
    }
    void pop_front() {                    // O(1); the caller checks size > 0
        Node* old = head;
        head = head->next;
        if (!head) tail = nullptr;        // it was the only node
        delete old;
        --size;
    }
    void insert_after(Node* p, int x) {   // O(1)
        p->next = new Node{x, p->next};
        if (tail == p) tail = p->next;
        ++size;
    }
    void erase_after(Node* p) {           // removes the node after p, O(1)
        Node* victim = p->next;
        p->next = victim->next;           // bypass it
        if (tail == victim) tail = p;
        delete victim;
        --size;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "alList_orderBody",
          "The order of the pointer writes matters. In insert_after, new Node{x, p->next} first makes the new node point to p's old successor, and only then does p->next change to the new node. Doing it the other way round, p->next = new node first, loses the only pointer to the rest of the list: every node after p leaks and is unreachable.")}
      </p>

      <LinkedListFigure t={t} />

      <H3>{tx(t, "alList_predTitle", "The predecessor problem")}</H3>
      <p>
        {tx(t, "alList_predBody",
          "Notice that we have erase_after, not erase. To remove a node, the node before it must be rewired, and a singly linked node does not know its predecessor. Given only a pointer to the node to remove, we must walk from head to find the one before it, Θ(n). The same problem makes pop_back Θ(n) even with a tail pointer: after removing the last node, the new tail is the one before it, which we cannot reach backwards. Try erasing different nodes in the figure and watch the walk count. The doubly linked list below fixes this.")}
      </p>

      <H2>{tx(t, "alList_revTitle", "Reversing a list in place")}</H2>
      <p>
        {tx(t, "alList_revBody",
          "A classic exercise that trains careful pointer handling: reverse the list without allocating anything, by turning every arrow around. Walk with two pointers, prev (the already reversed part, initially empty) and cur (the rest). At each step: save cur->next, because the next line destroys it; point cur back at prev; then advance both. When cur reaches nullptr, prev is the new head. Switch the figure to reverse and step through it.")}
      </p>
      <CodeBlock lang="cpp" filename="reverse_list.cpp" t={t}>{`Node* reverse(Node* head) {
    Node* prev = nullptr;
    Node* cur  = head;
    while (cur) {
        Node* next = cur->next;    // 1. remember the rest
        cur->next  = prev;         // 2. turn this arrow around
        prev = cur;                // 3. move one node on
        cur  = next;
    }
    return prev;                   // the old last node
}
// In IntList: tail = head; head = reverse(head);`}</CodeBlock>

      <H2>{tx(t, "alList_doublyTitle", "Doubly linked lists and the sentinel")}</H2>
      <p>
        {tx(t, "alList_doublyBody",
          "Give every node a second pointer, prev, to the node before it. Now any node can be unlinked in O(1) given only a pointer to it, and the list can be walked in both directions, at the price of one more pointer per node. The code also has many special cases (first node, last node, empty list). A neat trick removes all of them: a sentinel, a dummy node that holds no value and closes the list into a circle. The first real node is sentinel.next, the last is sentinel.prev, and an empty list is the sentinel pointing to itself. Every real node then always has a real prev and next, so insertion and removal need no if statements at all.")}
      </p>
      <CodeBlock lang="cpp" filename="doubly_list.cpp" t={t}>{`struct DNode {
    int    value;
    DNode* prev;
    DNode* next;
};

// A circular doubly linked list with a sentinel.
struct DList {
    DNode sentinel{0, &sentinel, &sentinel};      // empty: points to itself

    DList() = default;
    ~DList() { while (sentinel.next != &sentinel) erase(sentinel.next); }
    DList(const DList&) = delete;                  // the self-pointers must not be copied
    DList& operator=(const DList&) = delete;

    DNode* insert_before(DNode* pos, int x) {      // O(1), no special cases
        DNode* n = new DNode{x, pos->prev, pos};
        pos->prev->next = n;
        pos->prev = n;
        return n;
    }
    void erase(DNode* n) {                         // O(1) given the node itself
        n->prev->next = n->next;
        n->next->prev = n->prev;
        delete n;
    }
    void push_front(int x) { insert_before(sentinel.next, x); }
    void push_back(int x)  { insert_before(&sentinel, x); }
    void pop_back()        { erase(sentinel.prev); }   // O(1) now
};`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "alList_lruNote", "This O(1) \"remove this node wherever it is\" is exactly what an LRU cache needs (least recently used: when full, evict the item unused for longest). Keep the items in a doubly linked list ordered by last use; on every access, unlink the item and move it to the front; evict from the back. Together with the hash table of the last chapter in this section, every operation is O(1). std::list is a doubly linked list.")}
      </Callout>

      <H2>{tx(t, "alList_fastTitle", "Fast and slow pointers")}</H2>
      <p>
        {tx(t, "alList_fastBody",
          "Two pointers walking at different speeds answer questions that seem to need the length. To find the middle node, move slow one step and fast two steps at a time; when fast reaches the end, slow has covered half the distance. To detect a cycle (a bug where some node's next points back to an earlier node, so walking never ends), use the same pair: without a cycle, fast reaches nullptr; with a cycle, both pointers end up going round it, and since fast gains exactly one node on slow at every step, the gap between them shrinks by one each time until they meet, within one lap. This is Floyd's \"tortoise and hare\" algorithm: O(n) time and O(1) memory.")}
      </p>
      <CodeBlock lang="cpp" filename="fast_slow.cpp" t={t}>{`Node* middle(Node* head) {             // for an even length, the second middle
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

bool hasCycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;  // the hare lapped the tortoise
    }
    return false;                       // the hare fell off the end
}`}</CodeBlock>

      <H2>{tx(t, "alList_sortTitle", "Merge sort on a list, without a buffer")}</H2>
      <p>
        {tx(t, "alList_sortBody",
          "The Merge Sort chapter promised that lists need no buffer. Merging two sorted lists does not copy any values: it relinks the existing nodes into one chain, always taking the smaller of the two front nodes. A dummy node at the start avoids a special case for the first link. To split a list in half, use the fast and slow pointers to find the middle and cut the link there. The result is Θ(n log n) time with only the recursion's O(log n) stack, and it is stable. Quicksort, by contrast, needs to walk backwards or jump around, which lists do badly.")}
      </p>
      <CodeBlock lang="cpp" filename="list_merge_sort.cpp" t={t}>{`Node* mergeLists(Node* a, Node* b) {          // both sorted
    Node dummy{0, nullptr};
    Node* tail = &dummy;
    while (a && b) {
        if (a->value <= b->value) { tail->next = a; a = a->next; }   // <= : stable
        else                      { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;                     // attach whatever is left, O(1)
    return dummy.next;
}

Node* sortList(Node* head) {
    if (!head || !head->next) return head;      // 0 or 1 nodes
    Node* slow = head;
    Node* fast = head->next;                    // so slow stops at the END of the first half
    while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }
    Node* right = slow->next;
    slow->next = nullptr;                       // cut the list in two
    return mergeLists(sortList(head), sortList(right));
}`}</CodeBlock>

      <H2>{tx(t, "alList_vsTitle", "Array or list?")}</H2>
      <LessonTable
        headers={[tx(t, "alList_tOp", "Operation"), tx(t, "alList_tArr", "Dynamic array"), tx(t, "alList_tSing", "Singly linked (head + tail)"), tx(t, "alList_tDoub", "Doubly linked")]}
        rows={[
          [tx(t, "alList_v1", "access by position i"), "O(1)", "Θ(i)", "Θ(i)"],
          [tx(t, "alList_v2", "insert / remove at the front"), "Θ(n)", "O(1)", "O(1)"],
          [tx(t, "alList_v3", "insert / remove at the back"), tx(t, "alList_v3a", "O(1) amortised"), tx(t, "alList_v3b", "insert O(1), remove Θ(n)"), "O(1)"],
          [tx(t, "alList_v4", "insert / remove next to a node you hold"), "Θ(n)", tx(t, "alList_v4b", "after it: O(1)"), "O(1)"],
          [tx(t, "alList_v5", "search for a value"), "Θ(n)", "Θ(n)", "Θ(n)"],
          [tx(t, "alList_v6", "extra memory per element (64-bit, int values)"), tx(t, "alList_v6a", "0 to 1× (spare capacity)"), tx(t, "alList_v6b", "12 bytes + allocator overhead"), tx(t, "alList_v6c", "20 bytes + allocator overhead")],
        ]}
      />
      <p>
        {tx(t, "alList_cacheBody",
          "The table hides the most important practical fact. Walking an array reads consecutive addresses, and the processor loads 64 bytes (a cache line, 16 ints) at a time and even fetches ahead. Walking a list jumps to wherever the next node happens to be, and each jump can be a cache miss costing on the order of a hundred times more than a cache hit (Memory chapter). So even a linear search, Θ(n) for both, is often many times faster on an array. Measurements regularly show a vector beating a list even for insertions in the middle, because finding the position dominates. Lists earn their place when elements must not move (other code holds pointers to them), when they are large and expensive to move, when you already hold the node where you insert, or when splicing whole chains together in O(1).")}
      </p>

      <H2>{tx(t, "alList_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alList_w1",
          "1. Memory for a million ints. A vector needs 4 MB, plus at most as much again in spare capacity. A singly linked node is { int value; Node* next; }: 4 bytes, then 4 bytes of padding so the 8-byte pointer is aligned, then 8 bytes, 16 bytes in all (the padding rule from the Memory chapter). Each allocation also carries bookkeeping from the allocator, typically another 16 bytes. So about 32 MB, eight times the vector.")}
      </p>
      <p>
        {tx(t, "alList_w2",
          "2. Reverse 3 → 8 → 1. prev = null, cur = 3. Step 1: next = 8, 3 now points to null, prev = 3, cur = 8. Step 2: next = 1, 8 points to 3, prev = 8, cur = 1. Step 3: next = null, 1 points to 8, prev = 1, cur = null. Return 1: the list is 1 → 8 → 3 → null. Three steps, three pointer writes, no allocation.")}
      </p>
      <p>
        {tx(t, "alList_w3",
          "3. Cycle detection on 1 → 2 → 3 → 4 → 5 → 3 (5 points back to 3, a cycle of length 3). After each step (slow, fast): (2, 3), (3, 5), (4, 4). They meet at node 4 after three steps: a cycle.")}
      </p>

      <H2>{tx(t, "alList_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alList_tMistake", "Mistake"), tx(t, "alList_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alList_e1", "Rewiring in the wrong order"), tx(t, "alList_e1b", "the rest of the list becomes unreachable and leaks. Point the new node at its successor before redirecting the old link")],
          [tx(t, "alList_e2", "Reading a node after delete"), tx(t, "alList_e2b", "delete p; p = p->next; reads freed memory. Save next first")],
          [tx(t, "alList_e3", "Forgetting head or tail in the edge cases"), tx(t, "alList_e3b", "removing the first or last node, or the only one, leaves head or tail dangling. Test with lists of 0, 1 and 2 nodes, or use a sentinel")],
          [tx(t, "alList_e4", "Dereferencing nullptr"), tx(t, "alList_e4b", "fast->next->next when fast->next is null crashes. Check fast && fast->next before stepping twice")],
          [tx(t, "alList_e5", "Choosing a list for speed by reflex"), tx(t, "alList_e5b", "Big-O ignores the cache; measure. A vector is usually the right default")],
        ]}
      />

      <KeyIdeas t={t} id="alList" items={[
        "A linked list is a chain of separately allocated nodes; only the next pointers give the order.",
        "No random access: reaching position i follows i pointers.",
        "Insert and remove next to a node you hold are O(1); a tail pointer makes push_back O(1).",
        "Singly linked nodes cannot find their predecessor; doubly linked lists can remove any node in O(1), and a sentinel removes the special cases.",
        "Reversal: save next, flip the arrow, advance. Fast and slow pointers find the middle and detect cycles in O(1) memory.",
        "Merge sort suits lists: merging relinks nodes, no buffer needed.",
        "Lists cost several times more memory and walk the cache badly; prefer a vector unless elements must stay put.",
      ]} />
    </Article>
  );
}
