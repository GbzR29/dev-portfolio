"use client";

// Trees 1: trees and traversals — the vocabulary (root, parent, child, leaf,
// subtree, depth, height), n nodes ⇒ n − 1 edges, binary trees and their
// shapes (full, perfect, complete), the 2^(h+1) − 1 bound and the minimum
// height ⌊log₂ n⌋, nodes in C++ (two pointers; first-child/next-sibling for
// general trees), recursive size/height/free, the four traversals (pre, in,
// post, level with a queue), an explicit-stack pre-order, expression trees and
// postfix, rebuilding a tree from a pre-order with null markers; worked
// examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { TraversalFigure } from "@/components/lesson/figures/algo/TraversalFigure";

const r = String.raw;

export function TreesContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alTree_intro",
          "Every structure so far has been a line: each element has at most one element after it. Many things are not lines. A folder holds files and other folders, a web page nests elements inside elements, a company has a boss with several managers who each have their own teams, and an arithmetic expression has operations inside operations. All of these are trees, the branching structure this section is about. This chapter builds the vocabulary, counts what a tree can hold, and shows the four standard ways to visit all of its nodes. The next chapters use trees to search, to keep data sorted and to find the maximum quickly.")}
      </Lead>

      <Goals t={t} id="alTree" items={[
        "Use the words root, leaf, depth and height correctly.",
        "Write recursive functions that follow a tree's shape.",
        "Visit every node in pre-order, in-order, post-order and level order.",
        "Evaluate an expression tree, and save a tree to text and read it back.",
      ]} />

      <H2>{tx(t, "alTree_vocabTitle", "Nodes, edges and family words")}</H2>
      <p>
        {tx(t, "alTree_vocabBody",
          "A tree is a set of nodes connected by edges, drawn upside down: the root at the top, the branches growing downwards. Each node except the root is connected to exactly one node above it, its parent, and the nodes directly below a node are its children. Children of the same parent are siblings. A node with no children is a leaf; a node with at least one child is an internal node. Going up repeatedly from a node reaches its ancestors (up to the root); going down reaches its descendants. A node together with all its descendants forms a subtree, which is itself a tree with that node as its root.")}
      </p>
      <p>
        {tx(t, "alTree_recDef",
          "That last fact gives the most useful definition of all, a recursive one: a tree is either empty, or a root node together with zero or more subtrees, each of which is a tree. Almost every algorithm on trees follows this definition: solve the problem for the subtrees (recursively), then combine their answers at the root, exactly as in the Recursion chapter. The base case is the empty tree.")}
      </p>
      <LessonTable
        headers={[tx(t, "alTree_tTerm", "Term"), tx(t, "alTree_tMeaning", "Meaning")]}
        rows={[
          [tx(t, "alTree_v1", "path"), tx(t, "alTree_v1b", "a sequence of nodes, each connected to the next by an edge; its length is the number of edges")],
          [tx(t, "alTree_v2", "depth of a node"), tx(t, "alTree_v2b", "the length of the path from the root to it; the root has depth 0")],
          [tx(t, "alTree_v3", "level d"), tx(t, "alTree_v3b", "all the nodes of depth d")],
          [tx(t, "alTree_v4", "height of a node"), tx(t, "alTree_v4b", "the length of the longest path from it down to a leaf; a leaf has height 0")],
          [tx(t, "alTree_v5", "height of a tree"), tx(t, "alTree_v5b", "the height of its root, which equals the largest depth; by convention the empty tree has height −1")],
          [tx(t, "alTree_v6", "degree of a node"), tx(t, "alTree_v6b", "its number of children")],
        ]}
      />
      <Callout type="info" t={t}>
        {tx(t, "alTree_heightConv", "Some books count height in nodes instead of edges, so that a single node has height 1. Both are fine as long as you stay consistent. This track counts edges everywhere, as in the decision-tree argument of the Linear Sorts chapter.")}
      </Callout>
      <H3>{tx(t, "alTree_edgesTitle", "n nodes, n − 1 edges")}</H3>
      <p>
        {tx(t, "alTree_edgesBody",
          "A tree with n nodes always has exactly n − 1 edges. Reason: every node except the root has exactly one edge going up to its parent, and every edge is the upward edge of exactly one node (its lower end). So edges and non-root nodes pair up one to one, and there are n − 1 of them. A tree also has exactly one path between any two nodes: go up from both to their lowest common ancestor and join the two halves. Adding any extra edge would create a second path, a cycle, and the result would no longer be a tree; that distinction becomes important in the Graphs section.")}
      </p>

      <H2>{tx(t, "alTree_binTitle", "Binary trees")}</H2>
      <p>
        {tx(t, "alTree_binBody",
          "In a binary tree every node has at most two children, and they are distinguished: a left child and a right child. A node with only a right child is different from one with only a left child. Binary trees are by far the most common kind in algorithms because two choices match a comparison: smaller goes left, bigger goes right. Three special shapes have names:")}
      </p>
      <LessonTable
        headers={[tx(t, "alTree_tShape", "Shape"), tx(t, "alTree_tRule", "Rule")]}
        rows={[
          [tx(t, "alTree_s1", "full"), tx(t, "alTree_s1b", "every node has 0 or 2 children, never exactly 1")],
          [tx(t, "alTree_s2", "perfect"), tx(t, "alTree_s2b", "full, and all leaves are at the same depth: every level is completely filled")],
          [tx(t, "alTree_s3", "complete"), tx(t, "alTree_s3b", "every level is full except possibly the last, which is filled from the left with no gaps (the shape of a heap)")],
          [tx(t, "alTree_s4", "degenerate"), tx(t, "alTree_s4b", "every internal node has one child: the tree is really a linked list, with height n − 1")],
        ]}
      />
      <H3>{tx(t, "alTree_countTitle", "How much a tree of height h can hold")}</H3>
      <p>
        {tx(t, "alTree_countBody",
          "Level 0 has one node, the root. Each node has at most two children, so each level can hold at most twice as many nodes as the level above: at most 1, 2, 4, 8, … nodes, which is 2ᵈ at level d. A binary tree of height h has levels 0 to h, so it holds at most the sum of those, a geometric series (Math track, Sequences):")}
      </p>
      <Equation label={tx(t, "alTree_eqMax", "Most nodes in a binary tree of height h")}
        where={[
          [r`h`, tx(t, "alTree_wH", "the height: the number of edges on the longest root-to-leaf path")],
          [r`2^d`, tx(t, "alTree_wLevel", "the most nodes that fit on level d (depth d)")],
          [r`n`, tx(t, "alTree_wN", "the number of nodes")],
        ]}
        note={tx(t, "alTree_eqMaxNote", "The sum is found by the usual trick: call it S; then 2S − S = 2ʰ⁺¹ − 1, because every other term cancels. Only a perfect tree reaches the bound.")}>
        {r`n \;\le\; 1 + 2 + 4 + \dots + 2^h \;=\; 2^{h+1} - 1`}
      </Equation>
      <p>
        {tx(t, "alTree_minHeight",
          "Read the other way round, this is the most important fact about trees. To hold n nodes, a binary tree needs 2ʰ⁺¹ − 1 ≥ n, so h ≥ log₂(n + 1) − 1, and since h is a whole number, h ≥ ⌊log₂ n⌋. A tree that is kept bushy has height about log₂ n: a million nodes fit in height 19, a billion in height 29. Anything that walks one path from the root to a leaf is then logarithmic. At the other extreme a degenerate tree has height n − 1, and the same walk is linear. Much of this section is about keeping trees bushy.")}
      </p>
      <LessonTable
        headers={[tx(t, "alTree_tH", "height h"), tx(t, "alTree_tMaxN", "most nodes 2ʰ⁺¹ − 1"), tx(t, "alTree_tLeaves", "most leaves 2ʰ")]}
        rows={[["0", "1", "1"], ["1", "3", "2"], ["2", "7", "4"], ["3", "15", "8"], ["9", "1 023", "512"], ["19", "1 048 575", "524 288"]]}
      />
      <p>
        {tx(t, "alTree_leavesBody",
          "One more count, useful later: in a full binary tree the number of leaves is one more than the number of internal nodes. Count edges twice. Each internal node has two children, so there are 2i edges if i is the number of internal nodes; and there are n − 1 = i + L − 1 edges, where L is the number of leaves. So 2i = i + L − 1, which gives L = i + 1. In the perfect tree of height 3, 8 leaves and 7 internal nodes.")}
      </p>

      <H2>{tx(t, "alTree_codeTitle", "Trees in C++")}</H2>
      <p>
        {tx(t, "alTree_codeBody",
          "A binary tree node is a linked-list node with two next pointers instead of one. The tree itself is just a pointer to its root; an empty tree is nullptr. As with lists, nodes are allocated one by one on the heap and can be anywhere in memory; the pointers are the only thing that holds the shape together.")}
      </p>
      <CodeBlock lang="cpp" filename="tree_node.cpp" t={t}>{`struct Node {
    int   key;
    Node* left  = nullptr;           // the left subtree (nullptr if empty)
    Node* right = nullptr;           // the right subtree
    Node(int k) : key(k) {}
};

//      8
//     / \\
//    3   10
//   / \\
//  1   6
Node* example() {
    Node* root = new Node(8);
    root->left = new Node(3);
    root->right = new Node(10);
    root->left->left = new Node(1);
    root->left->right = new Node(6);
    return root;
}`}</CodeBlock>
      <p>
        {tx(t, "alTree_generalBody",
          "A node of a general tree can have any number of children. One option is an array of child pointers in each node. A neat alternative stores just two pointers per node: first child and next sibling. The children of a node then form a linked list, and the structure is again a binary tree in memory, just read differently. Some algorithms also need to go up, and add a parent pointer to every node. Complete binary trees need no pointers at all: they can be stored level by level in an array, which is how heaps work two chapters from now.")}
      </p>

      <H2>{tx(t, "alTree_recTitle", "Recursive algorithms follow the definition")}</H2>
      <p>
        {tx(t, "alTree_recBody",
          "The recursive definition turns straight into code. The number of nodes of a tree is 0 for the empty tree, and otherwise 1 (the root) plus the sizes of the two subtrees. The height is −1 for the empty tree, and otherwise 1 plus the larger height of the two subtrees: the longest path from the root goes down one edge into whichever subtree is taller.")}
      </p>
      <CodeBlock lang="cpp" filename="tree_recursive.cpp" t={t}>{`int size(const Node* n) {
    if (n == nullptr) return 0;                          // base case: empty tree
    return 1 + size(n->left) + size(n->right);
}

int height(const Node* n) {
    if (n == nullptr) return -1;                         // so that a leaf gets 1 + max(-1, -1) = 0
    int hl = height(n->left), hr = height(n->right);
    return 1 + (hl > hr ? hl : hr);
}

void destroy(Node* n) {                                  // free every node
    if (n == nullptr) return;
    destroy(n->left);                                    // children first...
    destroy(n->right);
    delete n;                                            // ...then the node itself
}`}</CodeBlock>
      <p>
        {tx(t, "alTree_recCost",
          "Each of these makes exactly one call per node plus one per empty subtree (there are n + 1 nullptr children in a binary tree with n nodes: 2n child slots, n − 1 of them used by edges). Each call does constant work besides its recursive calls, so all three are Θ(n). The recursion depth is the height plus one, which is small for a bushy tree but can reach n for a degenerate one; a million-node chain would overflow the call stack.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "alTree_destroyWarn", "destroy must free the children before the node. Deleting n first and then reading n->left reads freed memory, which is undefined behaviour. The order \"children, then the node\" has a name: post-order.")}
      </Callout>

      <H2>{tx(t, "alTree_travTitle", "Traversals: visiting every node")}</H2>
      <p>
        {tx(t, "alTree_travBody",
          "Many tasks need every node once: print them, copy the tree, add up the keys. A traversal is an order for doing that. Three orders come from the recursion itself: in each call you visit the node and recurse into the left and right subtrees, and the only question is when the visit happens. Pre-order visits the node before both subtrees, in-order between them, post-order after them. The left subtree is always done before the right.")}
      </p>
      <CodeBlock lang="cpp" filename="traversals.cpp" t={t}>{`void visit(const Node* n) { printf("%d ", n->key); }

void preorder(const Node* n) {
    if (!n) return;
    visit(n);                        // node first
    preorder(n->left);
    preorder(n->right);
}

void inorder(const Node* n) {
    if (!n) return;
    inorder(n->left);
    visit(n);                        // node between its subtrees
    inorder(n->right);
}

void postorder(const Node* n) {
    if (!n) return;
    postorder(n->left);
    postorder(n->right);
    visit(n);                        // node last
}`}</CodeBlock>

      <TraversalFigure t={t} />

      <p>
        {tx(t, "alTree_travUses",
          "Each order has natural uses. Pre-order sees a parent before its children, which suits copying a tree or printing a folder listing with indentation. Post-order sees the children before the parent, which suits anything that needs the subtrees' results first: freeing memory, computing sizes, evaluating an expression. In-order is the special one for search trees: in the next chapter it produces the keys in sorted order.")}
      </p>
      <H3>{tx(t, "alTree_levelTitle", "Level-order needs a queue")}</H3>
      <p>
        {tx(t, "alTree_levelBody",
          "Level-order (also called breadth-first order) visits the root, then all nodes of depth 1 from left to right, then depth 2, and so on. Recursion cannot do that, because it goes deep before it goes wide. A queue can: start with the root in the queue; repeatedly take the front node, visit it and add its children at the back. Children are added after everything already waiting, which includes the rest of the current level, so levels come out in order. The queue is the ring buffer from the Queues chapter storing Node* instead of int. The same idea, on graphs, is breadth-first search.")}
      </p>
      <CodeBlock lang="cpp" filename="level_order.cpp" t={t}>{`void levelOrder(Node* root) {
    if (!root) return;
    PtrQueue q;                                  // the Queues chapter's ring buffer, holding Node*
    q.push(root);
    while (!q.empty()) {
        Node* n = q.front(); q.pop();
        visit(n);
        if (n->left)  q.push(n->left);           // the next level waits behind this one
        if (n->right) q.push(n->right);
    }
}`}</CodeBlock>
      <H3>{tx(t, "alTree_iterTitle", "Pre-order without recursion")}</H3>
      <p>
        {tx(t, "alTree_iterBody",
          "Replace the queue by a stack and you get depth-first order instead. Pop a node, visit it, then push its right child and then its left child. The left child is pushed last, so it is on top and is handled next, together with its whole subtree, before the right child comes back up. This visits the nodes in exactly pre-order, with an explicit stack in place of the call stack, as the Stacks chapter promised is always possible.")}
      </p>
      <CodeBlock lang="cpp" filename="preorder_iterative.cpp" t={t}>{`void preorderIterative(Node* root) {
    PtrStack st;                                 // the Stacks chapter's stack, holding Node*
    if (root) st.push(root);
    while (!st.empty()) {
        Node* n = st.top(); st.pop();
        visit(n);
        if (n->right) st.push(n->right);         // pushed first, handled later
        if (n->left)  st.push(n->left);          // on top: handled next
    }
}`}</CodeBlock>

      <H2>{tx(t, "alTree_exprTitle", "Expression trees")}</H2>
      <p>
        {tx(t, "alTree_exprBody",
          "An arithmetic expression is a tree: every operator is an internal node whose two children are its operands, and the numbers are the leaves (Math track, Order of Operations, drew exactly these). (3 + 4) · (5 − 2) has · at the root, with the subtrees 3 + 4 and 5 − 2. No brackets are needed, because the shape already says what is computed first. The traversals give the three notations: in-order gives the infix 3 + 4 · 5 − 2 (which needs brackets added back to mean the right thing), pre-order gives the prefix · + 3 4 − 5 2, and post-order gives the postfix 3 4 + 5 2 − ·, which is exactly what the Stacks chapter evaluated with a stack.")}
      </p>
      <CodeBlock lang="cpp" filename="expr_tree.cpp" t={t}>{`struct Expr {
    char  op;                       // '+', '-', '*', '/', or 0 for a number
    int   value;                    // used when op == 0
    Expr* left  = nullptr;
    Expr* right = nullptr;
};

int eval(const Expr* e) {           // post-order: both operands before the operator
    if (e->op == 0) return e->value;
    int a = eval(e->left), b = eval(e->right);
    switch (e->op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        default:  return a / b;
    }
}`}</CodeBlock>

      <H2>{tx(t, "alTree_serialTitle", "Writing a tree down and reading it back")}</H2>
      <p>
        {tx(t, "alTree_serialBody",
          "To save a tree to a file you need a flat sequence that determines the shape. A pre-order listing alone does not: 1 2 could mean 2 is the left child of 1 or the right child. Adding a marker # for every empty subtree fixes it. The tree 8(3(1, 6), 10) becomes 8 3 1 # # 6 # # 10 # #. Reading it back mirrors the writing: read a token; if it is #, the subtree is empty; otherwise make a node, then read its left subtree, then its right subtree. Each token is read once, so both directions are Θ(n).")}
      </p>
      <CodeBlock lang="cpp" filename="serialize.cpp" t={t}>{`// tokens: keys in pre-order with -1 standing for "#"; pos walks through them
Node* readTree(const int* tokens, int& pos) {
    int tok = tokens[pos++];
    if (tok == -1) return nullptr;               // an empty subtree
    Node* n = new Node(tok);
    n->left  = readTree(tokens, pos);            // the left subtree comes next...
    n->right = readTree(tokens, pos);            // ...then the right one
    return n;
}`}</CodeBlock>

      <H2>{tx(t, "alTree_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alTree_w1",
          "1. In the figure's tree: the root F has depth 0; B and G depth 1; A, D, I depth 2; C, E, H depth 3. The height is 3. The leaves are A, C, E, H; the internal nodes F, B, D, G, I. There are 9 nodes and 8 edges. G has one child, so the tree is not full.")}
      </p>
      <p>
        {tx(t, "alTree_w2",
          "2. Its traversals: pre-order F B A D C E G I H; in-order A B C D E F G H I (alphabetical, because this tree happens to be a search tree on the letters); post-order A C E D B H I G F; level-order F B G A D I C E H. Notice that the root is first in pre-order and last in post-order.")}
      </p>
      <p>
        {tx(t, "alTree_w3",
          "3. What is the smallest height of a binary tree with 100 nodes? We need 2ʰ⁺¹ − 1 ≥ 100, so 2ʰ⁺¹ ≥ 101. 2⁶ = 64 is too small, 2⁷ = 128 is enough, so h + 1 = 7 and h = 6, which matches ⌊log₂ 100⌋ = 6. The largest height is 99, a chain.")}
      </p>
      <p>
        {tx(t, "alTree_w4",
          "4. Evaluate (3 + 4) · (5 − 2) by post-order: eval(·) first evaluates the left subtree, where eval(+) gets 3 and 4 and returns 7; then the right subtree, where eval(−) returns 3; then applies · to get 21. The order in which operators finished, + then − then ·, is the postfix order 3 4 + 5 2 − ·.")}
      </p>

      <H2>{tx(t, "alTree_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alTree_tMistake", "Mistake"), tx(t, "alTree_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alTree_e1", "Forgetting the empty-tree base case"), tx(t, "alTree_e1b", "n->left on nullptr crashes. Every recursive tree function starts with if (!n)")],
          [tx(t, "alTree_e2", "Height of the empty tree = 0"), tx(t, "alTree_e2b", "then a leaf gets height 1 and every formula is off by one. Use −1 (edges) or count nodes consistently")],
          [tx(t, "alTree_e3", "Freeing the parent before the children"), tx(t, "alTree_e3b", "reads freed memory. Free in post-order")],
          [tx(t, "alTree_e4", "Assuming recursion depth is log n"), tx(t, "alTree_e4b", "only for bushy trees. A degenerate tree has depth n − 1; use an explicit stack or keep the tree balanced")],
          [tx(t, "alTree_e5", "Level-order with recursion or a stack"), tx(t, "alTree_e5b", "gives depth-first order. Level by level needs a queue")],
        ]}
      />

      <KeyIdeas t={t} id="alTree" items={[
        "A tree is empty, or a root with subtrees; recursive algorithms follow that definition.",
        "Depth counts edges from the root; height counts edges down to the deepest leaf. n nodes have n − 1 edges.",
        "A binary tree of height h holds at most 2ʰ⁺¹ − 1 nodes, so n nodes need height at least ⌊log₂ n⌋; a chain has height n − 1.",
        "Size, height and freeing are Θ(n) recursions; free in post-order.",
        "Pre-, in- and post-order differ only in when the node is visited; level-order uses a queue.",
        "An expression tree's post-order is its postfix form.",
      ]} />
    </Article>
  );
}
