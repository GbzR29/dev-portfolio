"use client";

// Graphs 4: minimum spanning trees — spanning trees and why the cheapest
// connection is a tree, the cut property (exchange proof) and the cycle
// property, Kruskal (why the sorted order is safe), union-find built up from
// a label array to a forest, union by size (depth ≤ log₂ n) and path
// compression (α(n)), Kruskal code, Prim as Dijkstra with a different key,
// MST vs shortest-path tree, uses (clustering, maze generation, 2-approximate
// tours), a recap of the whole track; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { MSTFigure } from "@/components/lesson/figures/algo/MSTFigure";

const r = String.raw;

export function MstContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alMst_intro",
          "A company must connect eight towns with fibre-optic cable. Any two towns can be joined, at a cost given by the edge weight, and a town counts as connected if it can reach every other one through some chain of cables. Which cables should be laid to connect everything at the lowest total cost? The answer is a minimum spanning tree, and two short greedy algorithms find it: Kruskal's, which needs a new data structure, union-find, and Prim's, which is Dijkstra's algorithm with one line changed. This is the last chapter of the track.")}
      </Lead>

      <Goals t={t} id="alMst" items={[
        "Explain what a minimum spanning tree is and why it has no cycles.",
        "Use the cut property to show an edge belongs in the tree.",
        "Build the tree with Kruskal's algorithm and a union-find.",
        "Build it with Prim's algorithm.",
      ]} />

      <H2>{tx(t, "alMst_defTitle", "Spanning trees")}</H2>
      <p>
        {tx(t, "alMst_defBody",
          "A spanning tree of a connected, undirected graph is a set of its edges that connects all V vertices and contains no cycle. It is a tree (Graphs chapter), so it always has exactly V − 1 edges. Its weight is the sum of its edge weights, and a minimum spanning tree (MST) is one of the smallest weight. Why must the cheapest connection be a tree? If a chosen set of edges contained a cycle, removing any one edge of the cycle would keep everything connected, since the rest of the cycle still joins its two ends, and would lower the cost (or keep it, for weight 0). So cycles are never needed.")}
      </p>
      <p>
        {tx(t, "alMst_countBody",
          "Trying all spanning trees is hopeless: a graph in which every pair of n vertices is joined has nⁿ⁻² different spanning trees (Cayley's formula), already 262,144 for n = 8 and about 2.6 × 10²³ for n = 20. Instead, the tree is built one edge at a time, greedily, and the next section shows which edges are safe to take.")}
      </p>

      <H2>{tx(t, "alMst_cutTitle", "The cut property")}</H2>
      <p>
        {tx(t, "alMst_cutBody",
          "A cut splits the vertices into two non-empty groups, S and the rest. An edge crosses the cut if it has one end in each group. The cut property: for any cut, a lightest edge crossing it belongs to some minimum spanning tree.")}
      </p>
      <p>
        {tx(t, "alMst_cutProof",
          "The proof is an exchange argument (Greedy chapter). Let e = {u, v} be a lightest crossing edge, and T an MST that does not contain e. T connects u and v by a path, and since u and v are on different sides, that path must cross the cut somewhere, along some edge f. Remove f from T: the tree falls into two pieces, one containing u and one containing v. Add e: it joins the two pieces again, so T − f + e is again a spanning tree. Its weight is weight(T) − w(f) + w(e) ≤ weight(T), because e is a lightest crossing edge and f crosses too. So T − f + e is also a minimum spanning tree, and it contains e.")}
      </p>
      <p>
        {tx(t, "alMst_generic",
          "This gives a general recipe. Start with no edges. Repeatedly pick a cut that none of the chosen edges crosses, and add a lightest edge crossing it; by the cut property the chosen edges always stay inside some MST, and after V − 1 additions they are one. Kruskal's and Prim's algorithms are two ways of choosing the cut. A related fact, the cycle property, runs the other way: if an edge is strictly the heaviest on some cycle, no MST contains it. And if all weights are different, the MST is unique.")}
      </p>

      <MSTFigure t={t} />

      <H2>{tx(t, "alMst_kruskalTitle", "Kruskal's algorithm")}</H2>
      <p>
        {tx(t, "alMst_kruskalBody",
          "Joseph Kruskal's algorithm (1956) looks only at edges, from lightest to heaviest. The chosen edges form a forest, a set of separate pieces (at the start, every vertex is its own piece). For each edge in sorted order: if its two ends are in different pieces, take it, which merges the two pieces; if they are already in the same piece, skip it, since it would close a cycle. It is safe by the cut property: when an edge e joins piece P to another piece, take the cut between P and everything else. No chosen edge crosses it, and every lighter edge crossing it would have been considered earlier and taken, since its ends were in different pieces then too. So e is a lightest crossing edge.")}
      </p>
      <p>
        {tx(t, "alMst_needDsu",
          "Kruskal's only question is \"are u and v already in the same piece?\", asked once per edge, while pieces keep merging. A search from u costs O(V) each time, O(E·V) in total. The structure that answers it almost in constant time is union-find.")}
      </p>

      <H2>{tx(t, "alMst_dsuTitle", "Union-find")}</H2>
      <p>
        {tx(t, "alMst_dsuBody",
          "Union-find, also called a disjoint-set union (DSU), keeps elements 0 to n − 1 split into disjoint sets and supports two operations. find(x) returns a representative of x's set, one element that stands for the whole set, so x and y are in the same set exactly when find(x) == find(y). unite(x, y) merges the two sets. The first idea is a label per element, label[x] = the set's name: find is O(1), but unite must relabel every element of one set, O(n).")}
      </p>
      <H3>{tx(t, "alMst_forestTitle", "Sets as trees")}</H3>
      <p>
        {tx(t, "alMst_forestBody",
          "Better: store each set as a tree in which every element only knows its parent, parent[x], and the root, whose parent is itself, is the representative. find(x) follows parents up to the root. unite(x, y) finds both roots and makes one the parent of the other: O(1) after the two finds. The trees are not binary and not searched; only the path up matters. Left alone, they can grow into chains (unite 0 with 1, then 1's root under 2, then under 3, …), and find becomes O(n). Two small rules prevent that.")}
      </p>
      <p>
        {tx(t, "alMst_sizeBody",
          "Union by size: always hang the root of the smaller tree under the root of the bigger one, and keep a size count at each root. An element's depth grows by one only when its tree is hung under a tree at least as big, and then the size of the tree it belongs to at least doubles. Starting from size 1, sizes cannot double more than log₂ n times before exceeding n:")}
      </p>
      <Equation label={tx(t, "alMst_eqDepth", "Depth of any element under union by size")}
        where={[
          [r`d`, tx(t, "alMst_wD", "how many times the element has been pushed one level deeper")],
          [r`2^d`, tx(t, "alMst_wSize", "a lower bound on the size of its tree, since each push at least doubled it")],
          [r`n`, tx(t, "alMst_wN", "the number of elements, the largest a set can be")],
        ]}
        note={tx(t, "alMst_eqDepthNote", "So every find is O(log n), even without the next trick.")}>
        {r`2^d \le n \quad\Longrightarrow\quad d \le \log_2 n`}
      </Equation>
      <p>
        {tx(t, "alMst_compressBody",
          "Path compression: find has to walk from x to the root anyway, so on the way back it points every element it passed directly at the root. The next find on any of them takes one step. With both rules, a long sequence of operations costs O(α(n)) each on average, where α is the inverse Ackermann function, which grows so slowly that α(n) ≤ 4 for any n that could ever fit in a computer (Robert Tarjan proved this bound in 1975). In practice: constant time.")}
      </p>
      <CodeBlock lang="cpp" filename="union_find.cpp" t={t}>{`#include <utility>
#include <vector>

struct DSU {
    std::vector<int> parent, size;

    explicit DSU(int n) : parent(n), size(n, 1) {
        for (int i = 0; i < n; ++i) parent[i] = i;          // every element is its own root
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression: point straight at the root
        return parent[x];
    }
    bool unite(int a, int b) {                             // false if a and b were already together
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (size[a] < size[b]) std::swap(a, b);            // union by size: a is the bigger root
        parent[b] = a;
        size[a] += size[b];
        return true;
    }
};`}</CodeBlock>
      <p>
        {tx(t, "alMst_dsuCode",
          "find is recursive, but thanks to union by size it never goes deeper than log₂ n calls, about 30 for a billion elements, so the stack is no concern. unite returning false is exactly Kruskal's \"same piece\" test.")}
      </p>
      <CodeBlock lang="cpp" filename="kruskal.cpp" t={t}>{`#include <algorithm>
#include <vector>

struct WEdge { int u, v, w; };

// Weight of a minimum spanning tree; its edges go to tree.
// If the graph is not connected, the result is a minimum spanning forest (tree.size() < n - 1).
long long kruskal(int n, std::vector<WEdge> edges, std::vector<WEdge>& tree) {
    std::sort(edges.begin(), edges.end(),
              [](const WEdge& a, const WEdge& b) { return a.w < b.w; });   // lightest first
    DSU dsu(n);
    long long total = 0;
    tree.clear();
    for (const WEdge& e : edges) {
        if (!dsu.unite(e.u, e.v)) continue;            // same piece: it would close a cycle
        tree.push_back(e);
        total += e.w;
        if ((int)tree.size() == n - 1) break;          // everything is connected
    }
    return total;
}`}</CodeBlock>
      <p>
        {tx(t, "alMst_kruskalCost",
          "Sorting costs O(E log E) = O(E log V), and the E union-find operations are nearly O(E): the sort dominates. The edges are taken by value (a copy) so that sorting them does not reorder the caller's array.")}
      </p>

      <H2>{tx(t, "alMst_primTitle", "Prim's algorithm")}</H2>
      <p>
        {tx(t, "alMst_primBody",
          "Prim's algorithm (Jarník 1930, Prim 1957) grows a single tree from any start vertex. The cut is always the tree against the rest of the graph, and each step adds the lightest edge crossing it, together with the vertex at its far end. Implemented with a min-heap, it is Dijkstra's code with one change: the key of a vertex is the weight of the single edge that would connect it to the tree, not the length of a whole path from the start.")}
      </p>
      <CodeBlock lang="cpp" filename="prim.cpp" t={t}>{`#include <functional>
#include <queue>
#include <utility>
#include <vector>

// Weight of a minimum spanning tree of a connected graph, grown from s.
long long prim(const Graph& g, int s) {
    std::vector<bool> inTree(g.n, false);
    using Item = std::pair<int, int>;                  // (weight of the connecting edge, vertex)
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> pq;
    pq.push({0, s});                                   // s joins with no edge
    long long total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (inTree[u]) continue;                       // stale: u already joined by a lighter edge
        inTree[u] = true;
        total += w;
        for (const Edge& e : g.adj[u])
            if (!inTree[e.to]) pq.push({e.w, e.to});   // Dijkstra would push dist[u] + e.w here
    }
    return total;
}`}</CodeBlock>
      <p>
        {tx(t, "alMst_primCost",
          "Like Dijkstra, O((V + E) log V) with a heap. Which one to use? Kruskal is simplest when the edges come as a list, and is the natural choice for sparse graphs; Prim works directly on adjacency lists and, with an array instead of a heap (O(V²)), is the better choice for dense graphs.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "alMst_notSp", "A minimum spanning tree is not a tree of shortest paths. The MST minimises the total weight of all edges together, not the distance from one vertex to another. In the sample graph the path from A to H inside the MST of the figure is A, B, F, C, G, H with weight 17, while the shortest path, A, B, F, G, H, weighs 16 and uses the edge FG, which that MST does not contain.")}
      </Callout>

      <H2>{tx(t, "alMst_usesTitle", "Where spanning trees show up")}</H2>
      <LessonTable
        headers={[tx(t, "alMst_tUse", "Use"), tx(t, "alMst_tHow", "How")]}
        rows={[
          [tx(t, "alMst_u1", "networks: cable, pipes, roads, circuit wiring"), tx(t, "alMst_u1b", "the MST is the cheapest way to connect every point")],
          [tx(t, "alMst_u2", "clustering"), tx(t, "alMst_u2b", "stop Kruskal when k pieces are left (or delete the k − 1 heaviest MST edges): the k groups are as far apart as possible")],
          [tx(t, "alMst_u3", "maze generation in games"), tx(t, "alMst_u3b", "give the walls between grid cells random weights and run Kruskal: the removed walls form a spanning tree, so every cell is reachable by exactly one path")],
          [tx(t, "alMst_u4", "approximate travelling-salesman tours"), tx(t, "alMst_u4b", "walking around the MST and skipping repeated vertices gives a tour at most twice the optimum, when distances obey the triangle inequality")],
        ]}
      />

      <H2>{tx(t, "alMst_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alMst_w1",
          "1. Kruskal on the sample graph. Sorted: CF 1, BF 3, DH 3, AB 4, CG 4, FG 4, BC 5, EF 5, GH 5, AE 7, CD 7, DG 8. Take CF, BF, DH, AB, CG. FG: F and G are both in the piece {A, B, C, F, G}, skip. BC: same piece, skip. Take EF, then GH, which joins {D, H} to the rest. That is 7 = V − 1 edges, so stop: total 1 + 3 + 3 + 4 + 4 + 5 + 5 = 25.")}
      </p>
      <p>
        {tx(t, "alMst_w2",
          "2. Prim from A. Crossing edges AB 4, AE 7: add B. Now BF 3 is lightest: add F. From F, CF 1: add C. Crossing now: AE 7, BC 5 is inside the tree, EF 5, FG 4, CG 4, CD 7: add G by an edge of weight 4 (CG or FG, both give 25). Then EF 5 adds E, GH 5 adds H, and DH 3 adds D. Total 4 + 3 + 1 + 4 + 5 + 5 + 3 = 25, the same as Kruskal, as it must be.")}
      </p>
      <p>
        {tx(t, "alMst_w3",
          "3. Union-find with union by size on 0 … 5. unite(0, 1): roots 0 and 1, same size, 1 goes under 0 (size 2). unite(2, 3): 3 under 2. unite(1, 3): find(1) = 0, find(3) = 2, sizes 2 and 2, so 2 goes under 0 (size 4). find(3) walks 3 → 2 → 0 and compresses: parent[3] = 0. unite(4, 5) and then unite(5, 0): the set {4, 5} has size 2 and is hung under 0. No element is deeper than 2 ≤ log₂ 6 ≈ 2.58.")}
      </p>

      <H2>{tx(t, "alMst_recapTitle", "The whole track in one table")}</H2>
      <p>{tx(t, "alMst_recapIntro", "This chapter closes the Algorithms & Data Structures track. Everything in it was built from scratch, and each part leans on the ones before:")}</p>
      <LessonTable
        headers={[tx(t, "alMst_tSection", "Section"), tx(t, "alMst_tBuilt", "What it gave us")]}
        rows={[
          [tx(t, "alMst_r1", "Foundations"), tx(t, "alMst_r1b", "memory layout, counting steps with Big-O, recursion and the call stack")],
          [tx(t, "alMst_r2", "Searching & Sorting"), tx(t, "alMst_r2b", "binary search, the O(n log n) sorts and the Ω(n log n) limit, linear sorts for special keys")],
          [tx(t, "alMst_r3", "Linear Structures"), tx(t, "alMst_r3b", "dynamic arrays, lists, stacks, queues and hash tables")],
          [tx(t, "alMst_r4", "Trees"), tx(t, "alMst_r4b", "traversals, search trees kept balanced, heaps for priorities, tries for strings")],
          [tx(t, "alMst_r5", "Algorithm Design"), tx(t, "alMst_r5b", "greedy choices proved by exchange, dynamic programming by states and recurrences")],
          [tx(t, "alMst_r6", "Graphs"), tx(t, "alMst_r6b", "BFS and DFS, shortest paths, minimum spanning trees and union-find, combining all of the above")],
        ]}
      />

      <H2>{tx(t, "alMst_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alMst_tMistake", "Mistake"), tx(t, "alMst_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alMst_e1", "Prim with dist[u] + w as the key"), tx(t, "alMst_e1b", "that is Dijkstra, and gives a shortest-path tree, not an MST; the key is the edge weight alone")],
          [tx(t, "alMst_e2", "Linking two elements instead of their roots"), tx(t, "alMst_e2b", "parent[a] = b with a not a root cuts a out of its set and loses its old parent; always unite find(a) and find(b)")],
          [tx(t, "alMst_e3", "Checking \"same piece\" with a search per edge"), tx(t, "alMst_e3b", "O(E·V) instead of nearly O(E); use union-find")],
          [tx(t, "alMst_e4", "Assuming the graph is connected"), tx(t, "alMst_e4b", "Kruskal quietly returns a forest with fewer than V − 1 edges; check tree.size()")],
          [tx(t, "alMst_e5", "Expecting MST paths to be shortest paths"), tx(t, "alMst_e5b", "the MST minimises the total, not each route (A to H: 17 in the MST, 16 shortest); use Dijkstra for routes")],
        ]}
      />

      <KeyIdeas t={t} id="alMst" items={[
        "A minimum spanning tree connects all V vertices with V − 1 edges of the smallest total weight; cycles are never needed.",
        "Cut property: a lightest edge crossing any cut is in some MST (exchange proof). Kruskal and Prim both follow it.",
        "Kruskal sorts the edges and keeps each one that joins two different pieces: O(E log V).",
        "Union-find stores sets as parent-pointer trees; union by size keeps depth ≤ log₂ n, path compression makes operations nearly O(1).",
        "Prim grows one tree with a min-heap keyed by the connecting edge's weight: Dijkstra with a different key.",
        "An MST is not a shortest-path tree; it minimises the total, not each distance.",
      ]} />
    </Article>
  );
}
