"use client";

// Trees 3: balanced search trees — what "balanced" should mean (h = O(log n),
// not perfection), rotations (three pointers, in-order kept), AVL trees:
// balance factor, the minimum-size recurrence N(h) = 1 + N(h−1) + N(h−2),
// the easy bound h < 2 log₂ n and the sharp 1.44 log₂ n via Fibonacci, the
// four insertion cases (LL, RR, LR, RL) and why one repair suffices, deletion;
// red-black trees: the five rules, black-height ⇒ h ≤ 2 log₂(n + 1), the
// insertion repair in words, the link to 2-3-4 trees; AVL vs red-black and
// std::map; B-trees for disks; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { AVLFigure } from "@/components/lesson/figures/algo/AVLFigure";

const r = String.raw;

export function BalancedTreesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alBal_intro",
          "A binary search tree is only as fast as it is short, and a plain one can grow into a chain when keys arrive in sorted order. A balanced search tree does a little extra work on every insertion and deletion to keep its height O(log n) for every possible input. This chapter builds the one tool they all use, the rotation, then the AVL tree in full, and then explains the red-black tree that sits inside std::map. After this chapter, \"a search tree\" means O(log n) per operation, guaranteed.")}
      </Lead>

      <H2>{tx(t, "alBal_whatTitle", "What balanced should mean")}</H2>
      <p>
        {tx(t, "alBal_whatBody",
          "The ideal would be a tree that is always as compact as possible, say complete (every level full except the last, filled from the left). That is too strict: take the complete tree holding 1 to 7, with 4 at the root, and insert 8. The only complete shape with 8 nodes has the 5th smallest key at the root, and checking slot by slot, every one of the seven old keys has to move to a different node: Θ(n) work for one insertion. So balanced trees relax the goal. They allow the height to be a constant factor above the minimum, h ≤ c · log₂ n for some fixed c, in exchange for repairs that only touch the nodes on the insertion path. A constant factor keeps every operation O(log n), which is all we need.")}
      </p>

      <H2>{tx(t, "alBal_rotTitle", "Rotations")}</H2>
      <p>
        {tx(t, "alBal_rotBody",
          "A rotation changes the shape of a small part of a tree while keeping it a valid search tree. Take a node y whose left child is x. Call x's subtrees A (left) and B (right), and y's right subtree C. In sorted order everything reads A, x, B, y, C: A is below x, B is between x and y (it is in x's right subtree and y's left subtree), C is above y. A right rotation at y makes x the top of this part: y becomes x's right child, and B, which must stay between x and y, becomes y's left subtree. The in-order sequence is still A x B y C, so every search-tree rule still holds. A left rotation at x is the exact reverse.")}
      </p>
      <CodeBlock lang="cpp" filename="rotations.cpp" t={t}>{`// Returns the new top of this part of the tree; the caller stores it where y was.
Node* rotateRight(Node* y) {
    Node* x = y->left;
    y->left  = x->right;              // B moves from x to y
    x->right = y;                     // y goes down to the right
    return x;
}

Node* rotateLeft(Node* x) {
    Node* y = x->right;
    x->right = y->left;               // B moves from y to x
    y->left  = x;
    return y;
}

// Usage: parent->left = rotateRight(parent->left);   or   root = rotateRight(root);`}</CodeBlock>

      <AVLFigure t={t} />

      <p>
        {tx(t, "alBal_rotEffect",
          "Only three pointers change (y->left, x->right, and the pointer from above), so a rotation is O(1). Its effect on heights is what makes it useful: a right rotation lifts x and its left subtree A by one level and pushes y and C down by one; B stays at the same depth. If A was the too-deep part, one rotation fixes it. If B was the deep part, a single rotation just moves the problem to the other side, and two rotations are needed, as the AVL cases below show.")}
      </p>

      <H2>{tx(t, "alBal_avlTitle", "AVL trees")}</H2>
      <p>
        {tx(t, "alBal_avlBody",
          "The AVL tree, named after its inventors Adelson-Velsky and Landis (1962), was the first balanced search tree. Its rule: at every node, the heights of the left and right subtrees differ by at most 1. The difference is the node's balance factor, bf = height(left) − height(right), which must be −1, 0 or +1. A positive balance factor means left-heavy, negative means right-heavy. The rule is local, one number per node, yet it forces the whole tree to be short.")}
      </p>
      <H3>{tx(t, "alBal_boundTitle", "Why the rule keeps the height logarithmic")}</H3>
      <p>
        {tx(t, "alBal_boundBody",
          "Ask the question backwards: what is the fewest nodes an AVL tree of height h can have? Call it N(h). A single node has height 0, so N(0) = 1; height 1 needs a root and one child, N(1) = 2. For height h ≥ 2, the root has one subtree of height h − 1 (otherwise the height would not be h), and to use as few nodes as possible the other subtree should be as short as the rule allows, height h − 2. Both subtrees are themselves AVL trees and should be minimal too. So:")}
      </p>
      <Equation label={tx(t, "alBal_eqN", "The smallest AVL tree of height h")}
        where={[
          [r`N(h)`, tx(t, "alBal_wN", "the fewest nodes in any AVL tree of height h")],
          [r`1`, tx(t, "alBal_wRoot", "the root")],
          [r`N(h-1),\ N(h-2)`, tx(t, "alBal_wSubs", "the two subtrees: one must have height h − 1, the other may be one shorter")],
        ]}
        note={tx(t, "alBal_eqNNote", "N(0) = 1, N(1) = 2. The values 1, 2, 4, 7, 12, 20, 33, 54, 88 are each one less than a Fibonacci number: N(h) = F(h + 3) − 1.")}>
        {r`N(h) \;=\; 1 + N(h-1) + N(h-2)`}
      </Equation>
      <p>
        {tx(t, "alBal_boundEasy",
          "An easy bound first. N is increasing, so N(h − 1) > N(h − 2), and therefore N(h) > 2 N(h − 2): going up two levels at least doubles the minimum size. Starting from N(0) = 1 and doubling h/2 times gives N(h) > 2^(h/2). Any AVL tree with n nodes and height h has n ≥ N(h) > 2^(h/2), so h < 2 log₂ n. The height is at most twice the ideal, whatever the input.")}
      </p>
      <p>
        {tx(t, "alBal_boundSharp",
          "The Fibonacci connection gives the exact constant. F(k) grows like φᵏ/√5, with the golden ratio φ ≈ 1.618 (Math track, Eigenvalues, derived this formula). So n ≥ N(h) ≈ φʰ⁺³/√5, and solving for h gives h ≈ log_φ n = log₂ n / log₂ φ ≈ 1.44 log₂ n. An AVL tree is never more than 44% taller than a perfect one; a million keys give height at most 28, instead of the minimum 19.")}
      </p>
      <LessonTable
        headers={[tx(t, "alBal_tH", "height h"), "0", "1", "2", "3", "4", "5", "6", "7", "8"]}
        rows={[
          [tx(t, "alBal_tMin", "fewest nodes N(h)"), "1", "2", "4", "7", "12", "20", "33", "54", "88"],
          [tx(t, "alBal_tMax", "most nodes 2ʰ⁺¹ − 1"), "1", "3", "7", "15", "31", "63", "127", "255", "511"],
        ]}
      />

      <H3>{tx(t, "alBal_insTitle", "Insertion and the four repair cases")}</H3>
      <p>
        {tx(t, "alBal_insBody",
          "Each node stores its height, so balance factors are cheap to compute. Insert exactly as in a plain BST. Only the nodes on the path from the root to the new leaf can change height, so on the way back up from the recursion, update each node's height and check its balance factor. The first node found with bf = +2 or −2 is repaired, and there are four shapes, named after the path from that node z down toward the new key:")}
      </p>
      <LessonTable
        headers={[tx(t, "alBal_tCase", "Case"), tx(t, "alBal_tShape", "Shape at z"), tx(t, "alBal_tFix", "Repair")]}
        rows={[
          ["LL", tx(t, "alBal_ll", "z is left-heavy (+2) and its left child is left-heavy or even"), tx(t, "alBal_llb", "one right rotation at z")],
          ["RR", tx(t, "alBal_rr", "z is right-heavy (−2) and its right child is right-heavy or even"), tx(t, "alBal_rrb", "one left rotation at z")],
          ["LR", tx(t, "alBal_lr", "z is left-heavy, its left child is right-heavy"), tx(t, "alBal_lrb", "left rotation at the left child (turning it into LL), then right rotation at z")],
          ["RL", tx(t, "alBal_rl", "z is right-heavy, its right child is left-heavy"), tx(t, "alBal_rlb", "right rotation at the right child (turning it into RR), then left rotation at z")],
        ]}
      />
      <p>
        {tx(t, "alBal_whyOnce",
          "Why the double rotation in the zig-zag cases? In LR the extra height is in the middle subtree B of the earlier picture, and a single right rotation keeps B at the same depth, so the tree would just become right-heavy by 2 instead. The first rotation moves the deep part to the outside, where the second one can lift it. After an insertion, one repair (single or double) is always enough: it brings z's subtree back to exactly the height it had before the insertion, so no ancestor sees any change.")}
      </p>
      <CodeBlock lang="cpp" filename="avl.cpp" t={t}>{`struct AvlNode {
    int      key;
    int      height = 0;                         // a new node is a leaf: height 0
    AvlNode* left  = nullptr;
    AvlNode* right = nullptr;
    AvlNode(int k) : key(k) {}
};

int  h(const AvlNode* n)    { return n ? n->height : -1; }     // empty subtree: -1
void update(AvlNode* n)     { int a = h(n->left), b = h(n->right); n->height = 1 + (a > b ? a : b); }
int  balance(const AvlNode* n) { return h(n->left) - h(n->right); }

AvlNode* rotateRight(AvlNode* y) {
    AvlNode* x = y->left;
    y->left = x->right;
    x->right = y;
    update(y);                                   // y is now below x: update it first
    update(x);
    return x;
}
AvlNode* rotateLeft(AvlNode* x) {
    AvlNode* y = x->right;
    x->right = y->left;
    y->left = x;
    update(x);
    update(y);
    return y;
}

AvlNode* rebalance(AvlNode* n) {
    update(n);
    int b = balance(n);
    if (b > 1) {                                             // left side two taller
        if (balance(n->left) < 0) n->left = rotateLeft(n->left);    // LR: first make it LL
        return rotateRight(n);
    }
    if (b < -1) {                                            // right side two taller
        if (balance(n->right) > 0) n->right = rotateRight(n->right); // RL: first make it RR
        return rotateLeft(n);
    }
    return n;                                                // already within -1..+1
}

AvlNode* insert(AvlNode* n, int x) {
    if (n == nullptr) return new AvlNode(x);
    if (x < n->key)      n->left  = insert(n->left, x);
    else if (x > n->key) n->right = insert(n->right, x);
    else return n;                                           // already present
    return rebalance(n);                                     // on the way back up
}`}</CodeBlock>
      <p>
        {tx(t, "alBal_insCost",
          "The descent is O(log n) because the height is; on the way back up each node costs O(1) (one height update, one comparison, at most two rotations in total). Insertion is O(log n) in the worst case. Search, min, floor and range queries are the BST versions unchanged, now with a guaranteed O(log n).")}
      </p>
      <H3>{tx(t, "alBal_delTitle", "Deletion")}</H3>
      <p>
        {tx(t, "alBal_delBody",
          "Delete as in a plain BST (including the successor trick), then call rebalance on every node on the way back up, exactly as for insertion. The difference: a repair after a deletion can leave the subtree one shorter than before, so an ancestor may become unbalanced in turn, and repairs can happen at several levels, up to one per level. That is still O(log n) rotations, each O(1), so deletion is O(log n) too. The same erase function from the BST chapter works with return rebalance(n) in place of return n.")}
      </p>

      <H2>{tx(t, "alBal_rbTitle", "Red-black trees")}</H2>
      <p>
        {tx(t, "alBal_rbBody",
          "A red-black tree reaches the same goal with a looser rule that needs fewer rotations. Each node carries one extra bit, its colour, and the tree must satisfy:")}
      </p>
      <LessonTable
        headers={["#", tx(t, "alBal_tRule", "Rule")]}
        rows={[
          ["1", tx(t, "alBal_rb1", "every node is red or black")],
          ["2", tx(t, "alBal_rb2", "the root is black")],
          ["3", tx(t, "alBal_rb3", "the empty subtrees (the nullptr children) count as black")],
          ["4", tx(t, "alBal_rb4", "a red node has black children: no two reds in a row on any path")],
          ["5", tx(t, "alBal_rb5", "from any node, every path down to an empty subtree passes through the same number of black nodes")],
        ]}
      />
      <p>
        {tx(t, "alBal_rbBound",
          "Call that number of black nodes below a node (not counting itself) its black-height b. A subtree whose root has black-height b contains at least 2ᵇ − 1 nodes: by induction, each child has black-height at least b − 1 and so at least 2ᵇ⁻¹ − 1 nodes, and the two children plus the root give at least 2(2ᵇ⁻¹ − 1) + 1 = 2ᵇ − 1. Rule 4 says reds never follow reds, so at least half the nodes on any root-to-leaf path are black: b ≥ h/2 for the root. Putting it together, n ≥ 2^(h/2) − 1, so h ≤ 2 log₂(n + 1).")}
      </p>
      <p>
        {tx(t, "alBal_rbInsert",
          "Insertion adds the new node as red, which keeps rule 5 (no black counts change) but may break rule 4 if its parent is red too. The repair looks at the uncle (the parent's sibling). If the uncle is red, recolour: parent and uncle become black, grandparent red, and continue checking from the grandparent, two levels up. If the uncle is black, one or two rotations exactly like AVL's LL/LR cases plus two recolourings finish the job. Recolouring is cheap, so an insertion does at most 2 rotations and a deletion at most 3, while an AVL deletion may rotate at every level. The full code is long, mostly symmetric cases, and follows these rules directly.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "alBal_234", "Where do the odd rules come from? Merge every red node into its black parent and you get a tree whose nodes hold 1, 2 or 3 keys with 2, 3 or 4 children, a 2-3-4 tree, in which all leaves are at exactly the same depth (that is rule 5). A red-black tree is a way of storing that perfectly balanced multi-key tree as a binary tree.")}
      </Callout>

      <H2>{tx(t, "alBal_whichTitle", "Which one to use")}</H2>
      <LessonTable
        headers={[tx(t, "alBal_tTree", "Tree"), tx(t, "alBal_tHeight", "height at most"), tx(t, "alBal_tRot", "rotations per update"), tx(t, "alBal_tGood", "best when")]}
        rows={[
          ["AVL", "≈ 1.44 log₂ n", tx(t, "alBal_avlRot", "≤ 2 insert, O(log n) delete"), tx(t, "alBal_avlGood", "lookups dominate: shorter tree, fewer comparisons")],
          [tx(t, "alBal_rb", "red-black"), "2 log₂(n + 1)", tx(t, "alBal_rbRot", "≤ 2 insert, ≤ 3 delete"), tx(t, "alBal_rbGood", "many insertions and deletions; the usual library choice")],
          [tx(t, "alBal_bt", "B-tree"), tx(t, "alBal_btH", "log_B n, B = keys per node"), tx(t, "alBal_btRot", "splits and merges of nodes"), tx(t, "alBal_btGood", "data on disk or when cache misses dominate: databases, file systems")],
        ]}
      />
      <p>
        {tx(t, "alBal_stdBody",
          "std::set, std::map, std::multiset and std::multimap in C++ are balanced search trees; the major standard libraries implement them as red-black trees. They keep keys sorted, give O(log n) insert, erase and find, and offer lower_bound (the first key ≥ x) and upper_bound (the first key > x), which are the floor and successor queries of the BST chapter. A B-tree packs many keys into each node so that one node fills a disk block or a few cache lines; with 100 keys per node, a billion keys fit in 5 levels, and a lookup reads 5 blocks.")}
      </p>

      <H2>{tx(t, "alBal_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alBal_w1",
          "1. Insert 1 to 7 in order into an AVL tree. 1, then 2 (right of 1). 3 makes 1 right-heavy by 2 with a right-heavy child: RR, left rotation at 1, giving 2(1, 3). 4 goes right of 3. 5 makes 3 right-heavy by 2: left rotation at 3, giving 2(1, 4(3, 5)). 6 makes 2 right-heavy by 2 (left height 0, right height 2): left rotation at 2, giving 4(2(1, 3), 5(—, 6)). 7 makes 5 right-heavy by 2: left rotation at 5. Final tree 4(2(1, 3), 6(5, 7)), perfect, height 2. The plain BST would be a chain of height 6.")}
      </p>
      <p>
        {tx(t, "alBal_w2",
          "2. Insert 10, 20, 15. After 20, 10 has bf −1. 15 goes left of 20, and 10 now has bf −2 while its right child 20 has bf +1: the RL case. Right rotation at 20 gives 10(—, 15(—, 20)), an RR shape; left rotation at 10 gives 15(10, 20). A single left rotation at 10 would have produced 20(10(—, 15), —), still unbalanced.")}
      </p>
      <p>
        {tx(t, "alBal_w3",
          "3. How tall can an AVL tree with 50 nodes be? The table shows N(6) = 33 ≤ 50 < N(7) = 54, so height 7 is impossible and the answer is at most 6, while the minimum possible height is ⌊log₂ 50⌋ = 5. A red-black tree with 50 nodes is guaranteed only h ≤ 2 log₂ 51 ≈ 11.3, so at most 11.")}
      </p>

      <H2>{tx(t, "alBal_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alBal_tMistake", "Mistake"), tx(t, "alBal_tFix2", "What happens, and the fix")]}
        rows={[
          [tx(t, "alBal_e1", "Updating heights in the wrong order after a rotation"), tx(t, "alBal_e1b", "the node that went down must be updated first, because the new top's height depends on it")],
          [tx(t, "alBal_e2", "Using a single rotation for a zig-zag"), tx(t, "alBal_e2b", "LR and RL need the double rotation; a single one just mirrors the imbalance")],
          [tx(t, "alBal_e3", "Forgetting to store the rotation's result"), tx(t, "alBal_e3b", "rotateRight returns the new top; the parent's pointer (or root) must be set to it")],
          [tx(t, "alBal_e4", "Stopping after one repair when deleting"), tx(t, "alBal_e4b", "deletions can unbalance several ancestors; rebalance every node on the way up")],
          [tx(t, "alBal_e5", "Thinking balanced means perfect"), tx(t, "alBal_e5b", "AVL and red-black trees allow some slack (1.44× and 2× the minimum) so repairs stay local and O(log n)")],
        ]}
      />

      <KeyIdeas t={t} id="alBal" items={[
        "Balanced trees keep h ≤ c · log₂ n with repairs along the update path only.",
        "A rotation changes three pointers, keeps the in-order sequence, and moves one side up a level.",
        "AVL: every balance factor in −1..+1; the smallest tree of height h follows Fibonacci, so h ≈ 1.44 log₂ n at most.",
        "AVL insertion: LL/RR need one rotation, LR/RL two; one repair per insertion suffices.",
        "Red-black: colour rules give h ≤ 2 log₂(n + 1) with at most 2–3 rotations per update; std::map uses them.",
        "B-trees put many keys in a node for disks and caches.",
      ]} />
    </Article>
  );
}
