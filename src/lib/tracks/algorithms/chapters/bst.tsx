"use client";

// Trees 2: binary search trees — the ordering property (whole subtrees, not
// just children), search, min/max, in-order = sorted (by induction), insert,
// the three deletion cases with the in-order successor, floor/successor
// without parent pointers, range queries in O(h + k), how the insertion order
// decides the height (sorted ⇒ chain; random ⇒ ≈ 1.39 log₂ n average depth,
// the same comparisons as quicksort), tree sort, duplicates, size-augmented
// nodes for k-th smallest, a comparison with sorted arrays and hash tables;
// worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { BSTFigure } from "@/components/lesson/figures/algo/BSTFigure";

const r = String.raw;

export function BstContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alBst_intro",
          "A sorted array finds any key in O(log n) with binary search, but inserting or deleting a key means shifting everything after it: O(n). A linked list inserts in O(1) once you are at the right place, but finding that place is O(n). A binary search tree combines the good halves: it stores the keys in a binary tree arranged so that a search can throw away one whole subtree at every step, just as binary search throws away half the array, and so that inserting and deleting only change a few pointers. When the tree stays bushy, all three operations are O(log n).")}
      </Lead>

      <Goals t={t} id="alBst" items={[
        "Search, insert and delete keys in a binary search tree.",
        "List the keys in sorted order with an in-order walk.",
        "Answer ordered questions: smallest, next larger, everything in a range.",
        "Predict how the insertion order shapes the tree.",
      ]} />

      <H2>{tx(t, "alBst_propTitle", "The search-tree property")}</H2>
      <p>
        {tx(t, "alBst_propBody",
          "A binary search tree (BST) is a binary tree whose nodes hold keys, with one rule at every node: all the keys in its left subtree are smaller than its own key, and all the keys in its right subtree are bigger. For now assume all keys are distinct; duplicates come later. The rule is about entire subtrees, not just the two children. A tree where every left child is smaller than its parent and every right child bigger can still break the rule, for example 10 with left child 5 whose right child is 12: 12 is in 10's left subtree but is bigger than 10.")}
      </p>
      <CodeBlock lang="cpp" filename="bst_node.cpp" t={t}>{`struct Node {                    // the same node as in the Trees chapter
    int   key;
    Node* left  = nullptr;
    Node* right = nullptr;
    Node(int k) : key(k) {}
};`}</CodeBlock>

      <H2>{tx(t, "alBst_searchTitle", "Searching")}</H2>
      <p>
        {tx(t, "alBst_searchBody",
          "To look for a key x, start at the root and compare. If x equals the node's key, it is found. If x is smaller, it can only be in the left subtree, because everything in the right subtree is bigger than this node and therefore bigger than x; so go left. If x is bigger, go right. If you step onto nullptr, x is not in the tree. Each comparison moves one level down, so the number of comparisons is at most h + 1, where h is the height: O(h).")}
      </p>
      <CodeBlock lang="cpp" filename="bst_search.cpp" t={t}>{`Node* find(Node* n, int x) {
    while (n != nullptr && n->key != x)
        n = x < n->key ? n->left : n->right;     // the other subtree cannot contain x
    return n;                                    // the node, or nullptr if x is absent
}

Node* minNode(Node* n) {                         // the smallest key: keep going left
    while (n->left) n = n->left;                 // n must not be nullptr
    return n;
}
Node* maxNode(Node* n) {                         // the biggest key: keep going right
    while (n->right) n = n->right;
    return n;
}`}</CodeBlock>
      <p>
        {tx(t, "alBst_minBody",
          "The minimum is the leftmost node. Going left always moves to smaller keys, and the node where the left pointer is nullptr has nothing smaller below it; everything above it on the path is bigger. By the mirror argument the maximum is the rightmost node. Both walks are O(h).")}
      </p>

      <H2>{tx(t, "alBst_sortedTitle", "In-order visits the keys in sorted order")}</H2>
      <p>
        {tx(t, "alBst_sortedBody",
          "In-order traversal (Trees chapter) prints the left subtree, then the node, then the right subtree. On a BST that prints the keys in increasing order. Proof by induction on the size of the tree: the empty tree prints nothing, which is sorted. For a non-empty tree, assume it works for smaller trees, so the left subtree prints its keys sorted, and so does the right one. Every key printed first (the left subtree) is smaller than the root, the root comes next, and every key printed last (the right subtree) is bigger. So the whole output is sorted. This gives tree sort: insert all keys into a BST, then walk it in order.")}
      </p>

      <H2>{tx(t, "alBst_insertTitle", "Inserting")}</H2>
      <p>
        {tx(t, "alBst_insertBody",
          "A new key goes exactly where an unsuccessful search for it ends. Search for x; if the search reaches nullptr, that empty spot is the only place where x keeps every node's rule true, so a new leaf is hung there. The recursive version is short: insert into the correct subtree and store the returned pointer back, because inserting into an empty subtree returns a brand-new node that its parent must point to. Only one pointer changes, and the cost is the search: O(h).")}
      </p>
      <CodeBlock lang="cpp" filename="bst_insert.cpp" t={t}>{`// Returns the root of the subtree after inserting x (unchanged if x was already there).
Node* insert(Node* n, int x) {
    if (n == nullptr) return new Node(x);        // the empty spot the search reached
    if (x < n->key)      n->left  = insert(n->left, x);
    else if (x > n->key) n->right = insert(n->right, x);
    return n;                                    // equal: already present, nothing to do
}

// Usage: root = insert(root, 42);`}</CodeBlock>

      <BSTFigure t={t} />

      <H2>{tx(t, "alBst_deleteTitle", "Deleting")}</H2>
      <p>
        {tx(t, "alBst_deleteBody",
          "Deleting is the one operation with some thought in it. Find the node z holding the key, then look at how many children it has:")}
      </p>
      <LessonTable
        headers={[tx(t, "alBst_tCase", "Case"), tx(t, "alBst_tWhat", "What to do")]}
        rows={[
          [tx(t, "alBst_d1", "z is a leaf"), tx(t, "alBst_d1b", "remove it: its parent's pointer becomes nullptr")],
          [tx(t, "alBst_d2", "z has one child"), tx(t, "alBst_d2b", "the child's whole subtree moves up into z's place. It was entirely on one side of z's parent, and still is")],
          [tx(t, "alBst_d3", "z has two children"), tx(t, "alBst_d3b", "copy the key of z's successor (the smallest key in its right subtree) into z, then delete the successor from the right subtree")],
        ]}
      />
      <p>
        {tx(t, "alBst_succWhy",
          "Why the successor in the third case? It is the next key in sorted order, so putting it where z was keeps the rule: it is bigger than everything in z's left subtree (it came from the right subtree) and smaller than everything else in the right subtree (it was the minimum there). And deleting it from the right subtree is easy, because the minimum of a subtree has no left child: it falls into case 1 or 2. The predecessor (the maximum of the left subtree) works equally well.")}
      </p>
      <CodeBlock lang="cpp" filename="bst_erase.cpp" t={t}>{`// Returns the root of the subtree after removing x (unchanged if x is absent).
Node* erase(Node* n, int x) {
    if (n == nullptr) return nullptr;                    // not found
    if (x < n->key) { n->left  = erase(n->left, x);  return n; }
    if (x > n->key) { n->right = erase(n->right, x); return n; }

    // n holds x
    if (n->left == nullptr || n->right == nullptr) {     // cases 1 and 2
        Node* child = n->left ? n->left : n->right;      // nullptr for a leaf
        delete n;
        return child;                                    // the parent now points to it
    }
    Node* s = minNode(n->right);                         // case 3: the successor
    n->key = s->key;
    n->right = erase(n->right, s->key);                  // s has no left child: case 1 or 2
    return n;
}`}</CodeBlock>
      <p>
        {tx(t, "alBst_deleteCost",
          "The work is one walk down to z and, in case 3, a further walk down to the successor, both on the same root-to-leaf path: O(h). Copying the key is fine for plain int keys; for large records you would instead relink the successor node into z's place so that no data is copied and pointers to it stay valid.")}
      </p>

      <H2>{tx(t, "alBst_queriesTitle", "Ordered queries")}</H2>
      <p>
        {tx(t, "alBst_queriesBody",
          "A hash table can only answer \"is x there?\". A search tree also knows the order, so it answers questions like: what is the largest key ≤ x (the floor of x)? What comes after x? Which keys lie between lo and hi? The floor is found in one walk: at each node, if its key is ≤ x it is a candidate, so remember it and go right looking for a bigger one that is still ≤ x; otherwise go left. The last candidate remembered is the answer. The successor of x (the smallest key > x) is the mirror image.")}
      </p>
      <CodeBlock lang="cpp" filename="bst_queries.cpp" t={t}>{`// The largest key <= x; sets found to false if there is none.
int floorKey(Node* n, int x, bool& found) {
    found = false;
    int best = 0;
    while (n) {
        if (n->key == x) { found = true; return x; }
        if (n->key < x) { best = n->key; found = true; n = n->right; }   // a candidate; try bigger
        else            { n = n->left; }                                  // too big
    }
    return best;
}

// Visits the keys in [lo, hi] in sorted order: an in-order walk that skips useless subtrees.
void range(Node* n, int lo, int hi) {
    if (!n) return;
    if (lo < n->key) range(n->left, lo, hi);     // the left side can hold keys >= lo
    if (lo <= n->key && n->key <= hi) visit(n);
    if (n->key < hi) range(n->right, lo, hi);    // the right side can hold keys <= hi
}`}</CodeBlock>
      <p>
        {tx(t, "alBst_rangeCost",
          "The range walk costs O(h + k), where k is the number of keys reported: it goes down the two boundary paths (toward lo and toward hi), which is O(h), and every other node it enters lies between them and is reported. Printing 10 keys out of a million costs about 20 + 10 steps, not a million.")}
      </p>
      <H3>{tx(t, "alBst_rankTitle", "The k-th smallest key")}</H3>
      <p>
        {tx(t, "alBst_rankBody",
          "Store in every node the size of its subtree (updated on each insert and delete along the path). Then the k-th smallest key (counting from 1) is found in one walk: let L be the size of the left subtree. If k ≤ L, the answer is in the left subtree, still the k-th there. If k = L + 1, it is this node. Otherwise it is the (k − L − 1)-th smallest in the right subtree, because L + 1 smaller keys were skipped. Adding extra information to nodes like this is called augmenting a tree.")}
      </p>

      <H2>{tx(t, "alBst_shapeTitle", "The insertion order decides the shape")}</H2>
      <p>
        {tx(t, "alBst_shapeBody",
          "Every operation costs O(h), so everything depends on the height, and the height depends on the order in which keys arrived. The first key becomes the root forever (unless deleted), and each later key descends to a spot decided by all the earlier ones. Insert 10, 20, 30, …, 70 in increasing order and each new key is bigger than everything before it, so it always goes right: the tree is a chain with h = n − 1, a sorted linked list with extra pointers. Searching it is Θ(n), and building it costs 0 + 1 + 2 + … + (n − 1) = n(n − 1)/2 comparisons: Θ(n²). Sorted and nearly sorted input is common in practice, so this is not a rare accident.")}
      </p>
      <p>
        {tx(t, "alBst_randomBody",
          "If the keys arrive in random order the picture is much better, and the reason is an old friend. The first key splits the rest into those that go left and those that go right, exactly as a quicksort pivot splits an array; then each side is split by its own first key. Building a BST by insertion makes exactly the same comparisons as quicksort using the first element of each range as the pivot. The Quicksort chapter found that this is on average about 2n ln n comparisons in total. Dividing by n gives the average depth of a node:")}
      </p>
      <Equation label={tx(t, "alBst_eqDepth", "Average node depth in a randomly built BST")}
        where={[
          [r`n`, tx(t, "alBst_wN", "the number of keys, inserted in a uniformly random order")],
          [r`2\ln n`, tx(t, "alBst_wQuick", "quicksort's average comparisons per element, from the Quicksort chapter")],
          [r`1.39`, tx(t, "alBst_wConst", "2 ln 2 ≈ 1.386, because ln n = ln 2 · log₂ n")],
        ]}
        note={tx(t, "alBst_eqDepthNote", "The comparisons made while inserting a key equal its final depth, so total comparisons / n = average depth. The height (the deepest node) is larger, about 4.3 ln n ≈ 3 log₂ n on average, but still logarithmic.")}>
        {r`\text{average depth} \;\approx\; 2\ln n \;=\; 2\ln 2\cdot\log_2 n \;\approx\; 1.39\,\log_2 n`}
      </Equation>
      <p>
        {tx(t, "alBst_randomCaveat",
          "So a random insertion order gives searches only about 39% longer than a perfect tree. But you rarely control the order of your data, and deletions slowly make trees lopsided too. The next chapter fixes this for good with trees that rebalance themselves and guarantee O(log n) whatever the input.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alBst_dupNote", "Duplicates. If equal keys can occur, either store a count in each node (insert of an existing key does ++count, erase does --count and removes the node only at zero), or make the rule \"left ≤ node < right\" and send equal keys left. The count is usually simpler and keeps the tree smaller. std::multiset and std::multimap allow duplicates; std::set and std::map do not.")}
      </Callout>

      <H2>{tx(t, "alBst_compareTitle", "Where a BST fits")}</H2>
      <LessonTable
        headers={[tx(t, "alBst_tStruct", "Structure"), tx(t, "alBst_tFind", "find"), tx(t, "alBst_tIns", "insert / erase"), tx(t, "alBst_tOrder", "ordered queries (min, floor, range)")]}
        rows={[
          [tx(t, "alBst_c1", "sorted array"), "O(log n)", "O(n)", tx(t, "alBst_c1b", "yes, O(log n)")],
          [tx(t, "alBst_c2", "hash table"), tx(t, "alBst_c2b", "O(1) average"), tx(t, "alBst_c2b", "O(1) average"), tx(t, "alBst_c2c", "no: min alone is O(n)")],
          [tx(t, "alBst_c3", "plain BST"), "O(h)", "O(h)", "O(h)"],
          [tx(t, "alBst_c4", "balanced BST (next chapter)"), "O(log n)", "O(log n)", "O(log n)"],
        ]}
      />

      <H2>{tx(t, "alBst_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alBst_w1",
          "1. Insert 50, 30, 70, 20, 40, 60, 80, 35, 65 (the figure's starting tree). 50 is the root. 30 < 50: left. 70: right. 20: left of 30. 40: right of 30. 60: left of 70. 80: right of 70. 35: < 50, > 30, < 40, so it becomes 40's left child. 65: > 50, < 70, > 60, so 60's right child. Height 3, nine nodes; a perfect tree of height 3 would hold 15.")}
      </p>
      <p>
        {tx(t, "alBst_w2",
          "2. Search for 35: 50 (go left), 30 (go right), 40 (go left), 35 (found): 4 comparisons. Search for 67: 50, 70, 60, 65, then 65's right pointer is nullptr: not found after 4 comparisons, and 67 would be inserted as 65's right child.")}
      </p>
      <p>
        {tx(t, "alBst_w3",
          "3. Delete 30, which has two children. Its successor is the minimum of its right subtree {40, 35}: go to 40, then left to 35, which has no left child. Copy 35 into the node that held 30, then delete 35 from the right subtree, a leaf. The new tree has 35 where 30 was, with children 20 and 40; the in-order sequence is 20 35 40 50 60 65 70 80, still sorted.")}
      </p>
      <p>
        {tx(t, "alBst_w4",
          "4. The floor of 62 in the same tree: 50 ≤ 62, candidate 50, go right; 70 > 62, go left; 60 ≤ 62, candidate 60, go right; 65 > 62, go left: nullptr. The answer is 60.")}
      </p>

      <H2>{tx(t, "alBst_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alBst_tMistake", "Mistake"), tx(t, "alBst_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alBst_e1", "Checking the rule only against the children"), tx(t, "alBst_e1b", "a key deep in the left subtree can still be too big. To validate, pass down the allowed range (lo, hi) and check every node against it")],
          [tx(t, "alBst_e2", "Not storing the result of insert/erase"), tx(t, "alBst_e2b", "writing insert(root, x) instead of root = insert(root, x) loses the first node, and the parent never learns about its new child")],
          [tx(t, "alBst_e3", "Using the successor's key but forgetting to delete it"), tx(t, "alBst_e3b", "the key now appears twice. Case 3 always continues with erase(n->right, successor)")],
          [tx(t, "alBst_e4", "Assuming O(log n) for a plain BST"), tx(t, "alBst_e4b", "sorted input makes a chain: Θ(n) per operation. Use a balanced tree when the order is not random")],
          [tx(t, "alBst_e5", "Recursing on a possibly degenerate tree"), tx(t, "alBst_e5b", "depth n can overflow the call stack; the iterative find above has no such risk")],
        ]}
      />

      <KeyIdeas t={t} id="alBst" items={[
        "BST rule: everything in the left subtree is smaller, everything in the right subtree bigger — whole subtrees, not just children.",
        "Search, insert, delete, min, floor and successor each walk one path: O(h).",
        "In-order traversal lists the keys sorted; range queries cost O(h + k).",
        "Deleting a node with two children replaces it by its successor, the minimum of its right subtree.",
        "Sorted input builds a chain (h = n − 1); random input gives average depth ≈ 1.39 log₂ n, the quicksort connection.",
        "Balanced trees (next chapter) guarantee h = O(log n) for any input.",
      ]} />
    </Article>
  );
}
