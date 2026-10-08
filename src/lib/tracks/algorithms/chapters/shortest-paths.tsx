"use client";

// Graphs 3: shortest paths — weighted distance δ, fewer edges ≠ shorter,
// relaxation and the triangle inequality, optimal substructure, Dijkstra
// (greedy choice, proof with nonnegative weights, min-heap with lazy
// deletion, O((V + E) log V), O(V²) array version), negative weights break
// it, Bellman–Ford as DP over edge counts (fulfils the DP chapter's promise)
// with negative-cycle detection and currency arbitrage, DAGs in topological
// order, Floyd–Warshall for all pairs, A* with an admissible heuristic,
// summary table; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { DijkstraFigure } from "@/components/lesson/figures/algo/DijkstraFigure";

const r = String.raw;

export function ShortestPathsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alSp_intro",
          "A navigation app does not want the route with the fewest roads; it wants the one that takes the least time. When edges have weights, the length of a path is the sum of its weights, and the shortest path can use many edges. BFS counts edges, so it no longer answers the question. This chapter builds the algorithms that do: Dijkstra's for nonnegative weights, the one inside every route planner and the basis of A* in games; Bellman–Ford, slower but able to handle negative weights and to detect when \"shortest\" stops making sense; and Floyd–Warshall, which computes the distance between every pair of vertices at once.")}
      </Lead>

      <Goals t={t} id="alSp" items={[
        "Relax an edge and explain why every shortest-path algorithm is built on it.",
        "Run Dijkstra's algorithm by hand.",
        "Handle negative weights with Bellman–Ford, and find all pairs with Floyd–Warshall.",
        "Aim the search at a target with A*.",
      ]} />

      <H2>{tx(t, "alSp_defTitle", "Distance in a weighted graph")}</H2>
      <p>
        {tx(t, "alSp_defBody",
          "The weight of a path is the sum of the weights of its edges. The distance δ(s, v), or just δ(v) when the start s is fixed, is the smallest weight of any path from s to v, and ∞ if there is no path. A shortest path is one that achieves it. In the sample graph, the path A, B, C has two edges and weight 4 + 5 = 9, while A, B, F, C has three edges and weight 4 + 3 + 1 = 8: more edges, shorter path. That is why BFS, which minimises edges, gives wrong answers here.")}
      </p>
      <p>
        {tx(t, "alSp_subBody",
          "Shortest paths have optimal substructure: every part of a shortest path is itself a shortest path between its ends. If the part from x to y could be replaced by something lighter, the whole path would get lighter, contradicting that it was shortest. So a shortest path to v is a shortest path to the vertex u before it, plus the edge u → v. This is what all the algorithms below build on.")}
      </p>

      <H2>{tx(t, "alSp_relaxTitle", "Relaxation")}</H2>
      <p>
        {tx(t, "alSp_relaxBody",
          "Every algorithm in this chapter keeps an estimate dist[v] for each vertex, which is always the weight of some real path from s to v, so never below δ(v). It starts at 0 for s and ∞ for everyone else. The only operation that changes estimates is relaxing an edge u → v with weight w: if going through u is better than the best way to v known so far, use it.")}
      </p>
      <Equation label={tx(t, "alSp_eqRelax", "Relaxing the edge u → v")}
        where={[
          [r`\text{dist}[v]`, tx(t, "alSp_wDist", "the weight of the best path to v found so far (∞ if none)")],
          [r`w(u, v)`, tx(t, "alSp_wW", "the weight of the edge from u to v")],
          [r`\text{parent}[v] \leftarrow u`, tx(t, "alSp_wParent", "remember that the best path to v now arrives from u, to rebuild it later")],
        ]}
        note={tx(t, "alSp_eqRelaxNote", "When every estimate is exact, no edge can be relaxed any more: δ(v) ≤ δ(u) + w(u, v) holds for every edge, the triangle inequality of shortest paths. The algorithms differ only in which edges they relax, and in what order.")}>
        {r`\text{if } \text{dist}[u] + w(u, v) < \text{dist}[v]: \quad \text{dist}[v] \leftarrow \text{dist}[u] + w(u, v),\;\; \text{parent}[v] \leftarrow u`}
      </Equation>

      <H2>{tx(t, "alSp_dijTitle", "Dijkstra's algorithm")}</H2>
      <p>
        {tx(t, "alSp_dijBody",
          "Edsger Dijkstra's algorithm (1956) is greedy (Greedy chapter). It grows a set of finished vertices, whose distances are known for certain. At each step it takes the unfinished vertex with the smallest estimate, declares it finished, and relaxes every edge leaving it. With all weights ≥ 0 that choice is always right. Step through it in the figure: the heap readout under the drawing holds the candidates, and a vertex turns green when it is finished.")}
      </p>

      <DijkstraFigure t={t} />

      <H3>{tx(t, "alSp_proofTitle", "Why the smallest estimate is final")}</H3>
      <p>
        {tx(t, "alSp_proofBody",
          "Suppose the finished vertices all have exact distances, and u is the unfinished vertex with the smallest dist. Take a true shortest path P from s to u. It starts inside the finished set and ends outside it (at u), so it leaves the set somewhere: let y be the first unfinished vertex on P and x the finished vertex just before it. When x was finished, the edge x → y was relaxed, so dist[y] ≤ δ(x) + w(x, y) = δ(y), the last step because the part of P up to y is a shortest path to y. Now chain the facts:")}
      </p>
      <Equation label={tx(t, "alSp_eqProof", "The chain in Dijkstra's proof")}
        where={[
          [r`\text{dist}[u] \le \text{dist}[y]`, tx(t, "alSp_wP1", "u was chosen as the unfinished vertex with the smallest estimate, and y is unfinished too")],
          [r`\text{dist}[y] \le \delta(y)`, tx(t, "alSp_wP2", "shown above, from relaxing x → y")],
          [r`\delta(y) \le \delta(u)`, tx(t, "alSp_wP3", "y lies on a shortest path to u, and the rest of that path has weight ≥ 0: this is where nonnegative weights are needed")],
          [r`\delta(u) \le \text{dist}[u]`, tx(t, "alSp_wP4", "an estimate is always the weight of a real path, so never below the distance")],
        ]}
        note={tx(t, "alSp_eqProofNote", "The chain starts and ends at dist[u], so every ≤ is an equality: dist[u] = δ(u). Finishing u keeps the assumption true, and by induction every vertex is finished with its exact distance.")}>
        {r`\text{dist}[u] \;\le\; \text{dist}[y] \;\le\; \delta(y) \;\le\; \delta(u) \;\le\; \text{dist}[u]`}
      </Equation>
      <H3>{tx(t, "alSp_implTitle", "With a heap")}</H3>
      <p>
        {tx(t, "alSp_implBody",
          "Finding the smallest estimate is the job of a min-heap (Heaps chapter). A problem: when an estimate improves, the vertex's old entry is somewhere inside the heap, and std::priority_queue cannot change it. The usual fix is lazy deletion: push a new entry with the better estimate and leave the old one. When an entry reaches the top, compare it with dist: if it is bigger, the vertex has already been finished with a smaller value, and the entry is stale and skipped.")}
      </p>
      <CodeBlock lang="cpp" filename="dijkstra.cpp" t={t}>{`#include <climits>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

const long long INF = LLONG_MAX;

// Shortest distances from s. Every weight must be >= 0.
// parent[v] is the vertex before v on a shortest path (rebuild with pathTo from Graph Traversal).
void dijkstra(const Graph& g, int s, std::vector<long long>& dist, std::vector<int>& parent) {
    dist.assign(g.n, INF);
    parent.assign(g.n, -1);
    using Item = std::pair<long long, int>;                    // (estimate, vertex)
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> pq;   // smallest on top
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;                             // stale entry: u is already finished
        for (const Edge& e : g.adj[u]) {
            if (dist[u] + e.w < dist[e.to]) {                  // relax u -> e.to
                dist[e.to] = dist[u] + e.w;
                parent[e.to] = u;
                pq.push({dist[e.to], e.to});
            }
        }
    }
}`}</CodeBlock>
      <p>
        {tx(t, "alSp_implCode",
          "auto [d, u] = pq.top() unpacks the pair into two named variables (a structured binding). Distances are long long because a path's weight can exceed the int range even when every edge fits. Cost: each successful relaxation pushes one entry, at most one per adjacency-list entry, so at most 2E pushes and as many pops, each O(log E). Since E ≤ V², log E ≤ 2 log V, and the total is O((V + E) log V). For a dense graph, with E close to V², a version without a heap is better: find the smallest unfinished dist by scanning an array, O(V) per step, O(V²) in total.")}
      </p>

      <H2>{tx(t, "alSp_negTitle", "Negative weights")}</H2>
      <p>
        {tx(t, "alSp_negBody",
          "Weights can be negative: a road with a toll refund, a transaction that earns money, energy regained going downhill. Then Dijkstra can fail. Take arcs A → B weight 2, A → C weight 3 and C → B weight −2. Dijkstra finishes B first with 2, then C with 3, and only then finds A → C → B with weight 1, too late: B was declared final and anything computed from it is wrong. The proof breaks at δ(y) ≤ δ(u): with a negative edge, a path can get lighter after leaving the finished set.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "alSp_shiftWarn", "Adding the same constant to every weight to make them all nonnegative does not work. A path with k edges gets k times the constant added, so paths with many edges are punished more, and the shortest path can change. In the example, adding 2 gives A → B 4, A → C 5, C → B 0: now A → B (4) beats A → C → B (5), although originally it was the other way round.")}
      </Callout>
      <p>
        {tx(t, "alSp_cycleBody",
          "Worse, a cycle whose total weight is negative makes shortest paths meaningless: going round it once more always lowers the weight, so there is no minimum. A shortest-path algorithm for negative weights must therefore also detect negative cycles.")}
      </p>

      <H2>{tx(t, "alSp_bfTitle", "Bellman–Ford")}</H2>
      <p>
        {tx(t, "alSp_bfBody",
          "Bellman–Ford is the dynamic program promised in the Dynamic Programming chapter. Let dist_k(v) be the smallest weight of a path from s to v with at most k edges. A best such path either has at most k − 1 edges, or it ends with some edge u → v after a best path to u with at most k − 1 edges:")}
      </p>
      <Equation label={tx(t, "alSp_eqBf", "Shortest paths by number of edges")}
        where={[
          [r`\text{dist}_k(v)`, tx(t, "alSp_wDk", "the lightest path from s to v using at most k edges; dist₀(s) = 0 and dist₀(v) = ∞ for every other v")],
          [r`u \to v`, tx(t, "alSp_wUv", "the minimum runs over every arc arriving at v")],
        ]}
        note={tx(t, "alSp_eqBfNote", "Without negative cycles, some shortest path is simple (removing a cycle of weight ≥ 0 never makes it heavier), and a simple path has at most V − 1 edges. So dist_{V−1} is the answer.")}>
        {r`\text{dist}_k(v) = \min\Big(\text{dist}_{k-1}(v),\;\; \min_{u \to v}\big(\text{dist}_{k-1}(u) + w(u, v)\big)\Big)`}
      </Equation>
      <p>
        {tx(t, "alSp_bfImpl",
          "In practice one array is enough: relax every edge, V − 1 rounds in a row. Updating in place can only make estimates better sooner, never below a real path's weight. Then run one more round. If any edge can still be relaxed, the estimates would keep dropping forever: some negative cycle can be reached from s.")}
      </p>
      <CodeBlock lang="cpp" filename="bellman_ford.cpp" t={t}>{`struct Arc { int u, v; long long w; };

// Shortest distances from s with any weights. Returns false if a negative cycle
// can be reached from s; then shortest paths do not exist.
bool bellmanFord(int n, const std::vector<Arc>& arcs, int s, std::vector<long long>& dist) {
    dist.assign(n, INF);
    dist[s] = 0;
    for (int round = 1; round <= n - 1; ++round) {
        bool changed = false;
        for (const Arc& a : arcs)
            if (dist[a.u] != INF && dist[a.u] + a.w < dist[a.v]) {
                dist[a.v] = dist[a.u] + a.w;
                changed = true;
            }
        if (!changed) return true;                     // a quiet round: everything is final
    }
    for (const Arc& a : arcs)                          // round V: any improvement means a negative cycle
        if (dist[a.u] != INF && dist[a.u] + a.w < dist[a.v]) return false;
    return true;
}`}</CodeBlock>
      <p>
        {tx(t, "alSp_bfCost",
          "V − 1 rounds of E relaxations: O(V·E), much slower than Dijkstra, but it accepts any weights. The test dist[a.u] != INF prevents INF + a negative weight from looking like a real path.")}
      </p>

      <H2>{tx(t, "alSp_dagTitle", "Shortest paths in a DAG")}</H2>
      <p>
        {tx(t, "alSp_dagBody",
          "If the graph has no directed cycle, there is a faster way that also allows negative weights. Go through the vertices in topological order (Graph Traversal chapter) and relax the arcs leaving each one. When a vertex's turn comes, every arc into it has already been relaxed, since all those arcs come from earlier vertices, so its estimate is final. One pass: O(V + E). Negating the weights turns it into longest paths in a DAG, which is how project planning finds the critical path, the chain of tasks that decides the total duration.")}
      </p>

      <H2>{tx(t, "alSp_fwTitle", "All pairs: Floyd–Warshall")}</H2>
      <p>
        {tx(t, "alSp_fwBody",
          "To know the distance between every pair of vertices, one could run Dijkstra from every vertex. Floyd–Warshall does it with three nested loops over an adjacency matrix, and it allows negative weights. Number the vertices 0 to n − 1 and let dₖ[i][j] be the shortest path from i to j whose intermediate stops all lie in {0, …, k − 1}. Adding vertex k as an allowed stop either does not help, or the best path goes through k exactly once, as a best path from i to k followed by a best path from k to j:")}
      </p>
      <Equation label={tx(t, "alSp_eqFw", "Allowing one more intermediate vertex")}
        where={[
          [r`d_k[i][j]`, tx(t, "alSp_wFw", "the shortest path from i to j using only vertices 0 … k − 1 in between; d₀ is the arc weight (0 on the diagonal, ∞ if no arc)")],
          [r`d_k[i][k] + d_k[k][j]`, tx(t, "alSp_wFwK", "go to k and continue from there, each part using only the earlier vertices")],
        ]}
        note={tx(t, "alSp_eqFwNote", "After all n vertices are allowed, dₙ[i][j] = δ(i, j). A negative number on the diagonal, dₙ[i][i] < 0, reveals a negative cycle through i.")}>
        {r`d_{k+1}[i][j] = \min\big(d_k[i][j],\;\; d_k[i][k] + d_k[k][j]\big)`}
      </Equation>
      <CodeBlock lang="cpp" filename="floyd_warshall.cpp" t={t}>{`// d is n × n: d[i][j] = weight of arc i -> j, 0 on the diagonal, INF if there is no arc.
// Afterwards d[i][j] is the distance from i to j.
void floydWarshall(std::vector<std::vector<long long>>& d) {
    int n = (int)d.size();
    for (int k = 0; k < n; ++k)                        // allow k as a stop in between
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                if (d[i][k] != INF && d[k][j] != INF && d[i][k] + d[k][j] < d[i][j])
                    d[i][j] = d[i][k] + d[k][j];
}`}</CodeBlock>
      <p>
        {tx(t, "alSp_fwCode",
          "The loop over k must be the outer one, because round k needs the complete table of round k − 1. One table is enough: during round k the entries d[i][k] and d[k][j] do not change (they would only change through d[k][k], which is 0), so updating in place reads the right values. Cost O(V³) time and O(V²) memory: fine for a few hundred vertices, and simpler than anything else for them.")}
      </p>

      <H2>{tx(t, "alSp_astarTitle", "A*: aiming at the target")}</H2>
      <p>
        {tx(t, "alSp_astarBody",
          "Dijkstra spreads out in all directions, as the ripple of BFS does, even when only one target matters. A* (\"A star\") pulls the search toward the target. It adds to each vertex a guess h(v) of the remaining distance to the target, and takes vertices from the heap in order of dist[v] + h(v), the estimated length of the whole trip through v, instead of dist[v]. On a map, h can be the straight-line distance. The guess must never overestimate the true remaining distance (h is admissible), and for the simple version above it should also satisfy h(u) ≤ w(u, v) + h(v) for every edge (h is consistent); the straight-line distance has both properties, because no road is shorter than a straight line. Then A* returns the same shortest path as Dijkstra, usually after finishing far fewer vertices. With h = 0 it is exactly Dijkstra. The Game Dev track uses it for pathfinding on grids.")}
      </p>

      <LessonTable
        headers={[tx(t, "alSp_tAlgo", "Algorithm"), tx(t, "alSp_tWeights", "Weights"), tx(t, "alSp_tQuestion", "Answers"), tx(t, "alSp_tCost", "Cost")]}
        rows={[
          ["BFS", tx(t, "alSp_s1", "none (edges count 1)"), tx(t, "alSp_s1b", "from one vertex"), "O(V + E)"],
          ["Dijkstra", "≥ 0", tx(t, "alSp_s1b", "from one vertex"), "O((V + E) log V)"],
          ["A*", "≥ 0", tx(t, "alSp_s3b", "from one vertex to one target"), tx(t, "alSp_s3c", "≤ Dijkstra, usually far less")],
          [tx(t, "alSp_s4", "DAG in topological order"), tx(t, "alSp_s4a", "any, no cycles"), tx(t, "alSp_s1b", "from one vertex"), "O(V + E)"],
          ["Bellman–Ford", tx(t, "alSp_s5a", "any; finds negative cycles"), tx(t, "alSp_s1b", "from one vertex"), "O(V·E)"],
          ["Floyd–Warshall", tx(t, "alSp_s5a", "any; finds negative cycles"), tx(t, "alSp_s6b", "every pair"), "O(V³)"],
        ]}
      />

      <H2>{tx(t, "alSp_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alSp_w1",
          "1. Dijkstra from A on the sample graph, ties broken by letter. Pop (0, A): B = 4, E = 7. Pop (4, B): C = 9 through BC, F = 7 through BF. Pop (7, E): F through E would be 12, no change. Pop (7, F): C improves to 7 + 1 = 8 and is pushed again, G = 11. Pop (8, C): D = 15; G through C would be 12, no. Pop (9, C): stale, skipped. Pop (11, G): H = 16; D through G would be 19. Pop (15, D): H through D would be 18. Pop (16, H). Distances A 0, B 4, C 8, D 15, E 7, F 7, G 11, H 16, which the figure shows at the end.")}
      </p>
      <p>
        {tx(t, "alSp_w2",
          "2. Bellman–Ford on the negative example, arcs in the order A → B (2), A → C (3), C → B (−2). Round 1: B = 2, C = 3, then B = 3 − 2 = 1. Round 2 changes nothing and the algorithm stops early: B = 1, C = 3, the correct answer that Dijkstra missed. Add an arc B → C of weight 0: now C → B → C weighs −2, a negative cycle, and the check after V − 1 = 2 rounds still finds improvements and returns false.")}
      </p>
      <p>
        {tx(t, "alSp_w3",
          "3. Currency arbitrage. 1 dollar buys 0.9 euros, 1 euro buys 0.9 pounds, 1 pound buys 1.25 dollars. Going round: 0.9 × 0.9 × 1.25 = 1.0125, a 1.25% profit from nothing. Turn it into a graph with weights w = −ln(rate): a product of rates bigger than 1 becomes a sum of weights below 0, since ln turns products into sums (Math track, Exponents & Logarithms). Here −ln 0.9 − ln 0.9 − ln 1.25 ≈ 0.105 + 0.105 − 0.223 = −0.012 < 0, a negative cycle, which Bellman–Ford detects.")}
      </p>

      <H2>{tx(t, "alSp_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alSp_tMistake", "Mistake"), tx(t, "alSp_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alSp_e1", "Dijkstra with negative weights"), tx(t, "alSp_e1b", "vertices are finished too early with wrong distances; use Bellman–Ford, or a DAG pass if there are no cycles")],
          [tx(t, "alSp_e2", "Forgetting the stale-entry check"), tx(t, "alSp_e2b", "a finished vertex is expanded again from an old, larger estimate; with nonnegative weights it wastes time, and in variations it gives wrong answers")],
          [tx(t, "alSp_e3", "INF + w overflowing"), tx(t, "alSp_e3b", "INT_MAX + 1 wraps to a negative number that looks like a great path; test for INF before adding, and use long long for sums")],
          [tx(t, "alSp_e4", "Floyd–Warshall with k as an inner loop"), tx(t, "alSp_e4b", "entries are combined before they are final and the result is wrong; k is always the outermost loop")],
          [tx(t, "alSp_e5", "An A* heuristic that overestimates"), tx(t, "alSp_e5b", "the search can finish a path that is not the shortest; h must never exceed the true remaining distance")],
        ]}
      />

      <KeyIdeas t={t} id="alSp" items={[
        "The length of a path is the sum of its weights; with weights, the path with fewest edges is not necessarily the shortest.",
        "Every algorithm keeps upper bounds dist[v] and improves them by relaxing edges: dist[v] = min(dist[v], dist[u] + w).",
        "Dijkstra finishes the unfinished vertex with the smallest estimate; with weights ≥ 0 that estimate is exact. With a heap: O((V + E) log V).",
        "Negative weights break Dijkstra; Bellman–Ford relaxes every edge V − 1 times, O(V·E), and a V-th improving round reveals a negative cycle.",
        "A DAG is solved in one pass in topological order; Floyd–Warshall gives all pairs in O(V³) with k as the outer loop.",
        "A* orders the heap by dist + h with an admissible, consistent heuristic and reaches one target much faster.",
      ]} />
    </Article>
  );
}
