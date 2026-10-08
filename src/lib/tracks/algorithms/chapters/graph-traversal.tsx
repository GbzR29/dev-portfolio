"use client";

// Graphs 2: graph traversal — why searches need visited marks, BFS with a
// queue (mark on push, dist/parent, path rebuilding, the level-order proof of
// shortest edge counts, O(V + E)), BFS on grids, DFS by recursion (colours,
// discovery/finish times, parenthesis structure, edge kinds, back edge ⇔
// cycle), iterative search and deep recursion, connected components,
// bipartite check, topological order (DFS finish order + Kahn's algorithm);
// worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GraphSearchFigure } from "@/components/lesson/figures/algo/GraphSearchFigure";

export function GraphTraversalContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alGtr_intro",
          "Most questions about a graph start the same way: begin at one vertex and systematically visit everything that can be reached from it. There are two fundamental orders for doing that. Breadth-first search (BFS) spreads out like a ripple, all vertices one edge away, then all two edges away, and so on, and so it finds shortest paths counted in edges. Depth-first search (DFS) follows one path as deep as it can before backing up, like exploring a maze with one hand on the wall, and the structure it leaves behind detects cycles and orders tasks. Both run in O(V + E), which is as fast as reading the graph at all.")}
      </Lead>

      <Goals t={t} id="alGtr" items={[
        "Run breadth-first search and get the fewest-edge path to every vertex.",
        "Run depth-first search, recursively and with a stack.",
        "Use the searches to find components, detect cycles and order tasks.",
      ]} />

      <H2>{tx(t, "alGtr_visitTitle", "Searching needs a memory")}</H2>
      <p>
        {tx(t, "alGtr_visitBody",
          "Trees have no cycles, so the traversals of the Trees chapter could simply follow child pointers. A graph can lead back to where it started: from A to B to F to E and back to A. A search that follows edges blindly would go round that cycle forever. So every search keeps a mark per vertex, \"already seen\", and never enters a marked vertex again. Each vertex is then processed at most once, and each edge is looked at at most twice (once from each end), which is where the O(V + E) comes from.")}
      </p>

      <H2>{tx(t, "alGtr_bfsTitle", "Breadth-first search")}</H2>
      <p>
        {tx(t, "alGtr_bfsBody",
          "BFS from a start vertex s uses a queue (Queues chapter), whose first-in, first-out order is exactly what produces the rings. Put s in the queue with distance 0. Then repeat: take the vertex u at the front, and for each neighbour v that has not been seen yet, record dist[v] = dist[u] + 1 and parent[v] = u, mark it, and put it at the back. The parent array records, for every vertex, the vertex it was discovered from; those edges form the BFS tree.")}
      </p>
      <CodeBlock lang="cpp" filename="bfs.cpp" t={t}>{`#include <algorithm>
#include <queue>
#include <vector>

// dist[v]: the fewest edges from s to v, or -1 if v cannot be reached.
// parent[v]: the vertex before v on such a path (-1 for s and unreached vertices).
void bfs(const Graph& g, int s, std::vector<int>& dist, std::vector<int>& parent) {
    dist.assign(g.n, -1);                          // -1 doubles as "not seen yet"
    parent.assign(g.n, -1);
    std::queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (const Edge& e : g.adj[u]) {
            if (dist[e.to] != -1) continue;        // seen before
            dist[e.to] = dist[u] + 1;              // mark it now, when it is pushed
            parent[e.to] = u;
            q.push(e.to);
        }
    }
}

// The path s -> ... -> t, read back through the parents. Check dist[t] != -1 first.
std::vector<int> pathTo(const std::vector<int>& parent, int t) {
    std::vector<int> path;
    for (int v = t; v != -1; v = parent[v]) path.push_back(v);
    std::reverse(path.begin(), path.end());        // collected from t back to s
    return path;
}`}</CodeBlock>
      <p>
        {tx(t, "alGtr_bfsCode",
          "std::queue in <queue> is the library's version of the Queues chapter's ring buffer: push adds at the back, front reads the first element, pop removes it. The mark is set when a vertex is pushed, not when it is popped. Otherwise a vertex with several already-seen neighbours would be pushed once by each of them, and the queue could grow to O(E) entries instead of V.")}
      </p>

      <GraphSearchFigure t={t} />

      <H3>{tx(t, "alGtr_whyTitle", "Why BFS finds shortest paths")}</H3>
      <p>
        {tx(t, "alGtr_whyBody1",
          "Write δ(v) for the true fewest number of edges from s to v. First, dist[v] ≥ δ(v) always, because dist[v] is the length of an actual path, the one through the parents. Second, the queue is always ordered by dist, and its values differ by at most one: it looks like k, k, …, k, k + 1, …, k + 1. This holds at the start (just s, with 0), and every step keeps it: popping a vertex with value k removes from the front, and the new vertices get k + 1 at the back. So vertices leave the queue in order of dist, all the 0s, then all the 1s, then all the 2s.")}
      </p>
      <p>
        {tx(t, "alGtr_whyBody2",
          "Now suppose some vertex got dist[v] > δ(v) = k, and take the one with the smallest δ. On a shortest path to v, the vertex u just before it has δ(u) = k − 1 and, being closer, was labelled correctly: dist[u] = k − 1. When u was popped, v was either unseen, and got dist[u] + 1 = k, or already seen, which means it was discovered by a vertex popped no later than u, whose dist is at most k − 1, so dist[v] ≤ k. Both contradict dist[v] > k. So dist[v] = δ(v) for every vertex.")}
      </p>
      <p>
        {tx(t, "alGtr_bfsCost",
          "Cost: each vertex is pushed and popped at most once, O(V). Each vertex's adjacency list is scanned once, when it is popped, and the lists have 2E entries in total (handshake lemma), O(E). Together O(V + E). On a grid, the same code with the four-neighbour loop from the Graphs chapter gives the fewest moves through a maze from one cell to every other; flood fill in a paint program is the same search, with the \"distance\" ignored.")}
      </p>

      <H2>{tx(t, "alGtr_dfsTitle", "Depth-first search")}</H2>
      <p>
        {tx(t, "alGtr_dfsBody",
          "DFS is recursion: to visit u, mark it, and for each neighbour that has not been seen, visit it. The call stack (Recursion chapter) remembers the path back, so the search runs down one route until it reaches a vertex whose neighbours are all seen, then returns one level and tries the next neighbour there. It is useful to give each vertex one of three colours: white, not seen yet; grey, discovered, its visit still running (it is on the call stack); black, finished, everything reachable from it has been explored. A clock counts discoveries and finishes, giving each vertex a discovery time d and a finish time f.")}
      </p>
      <CodeBlock lang="cpp" filename="dfs.cpp" t={t}>{`#include <vector>

enum Color { WHITE, GREY, BLACK };                 // unseen, in progress, finished

struct DFS {
    const Graph& g;
    std::vector<Color> color;
    std::vector<int> d, f;                         // discovery and finish times
    int time = 0;

    explicit DFS(const Graph& g) : g(g), color(g.n, WHITE), d(g.n), f(g.n) {}

    void visit(int u) {
        color[u] = GREY;
        d[u] = ++time;
        for (const Edge& e : g.adj[u])
            if (color[e.to] == WHITE) visit(e.to);
        color[u] = BLACK;
        f[u] = ++time;
    }
    void visitAll() {                              // restarts from every unseen vertex
        for (int u = 0; u < g.n; ++u)
            if (color[u] == WHITE) visit(u);
    }
};`}</CodeBlock>
      <p>
        {tx(t, "alGtr_paren",
          "The times nest like parentheses. If v is discovered while u is grey, v is a descendant of u, and v finishes before u does: d[u] < d[v] < f[v] < f[u]. Otherwise the two intervals [d, f] do not overlap at all. In the figure's DFS mode, each vertex shows d/f; check that the interval of every vertex lies inside the interval of the vertex it was discovered from.")}
      </p>
      <H3>{tx(t, "alGtr_edgesTitle", "What an edge meets, and cycles")}</H3>
      <p>
        {tx(t, "alGtr_edgesBody",
          "In a directed graph, when DFS at u looks along an arc u → v, the colour of v says what kind of arc it is. White: v is discovered through it, a tree arc. Grey: v is an ancestor of u, still on the call stack, a back arc. Black: v is already finished, a forward or cross arc. A directed graph has a cycle exactly when DFS finds a back arc. If it finds u → v with v grey, the tree path from v down to u plus that arc is a cycle. Conversely, if there is a cycle, let v be its first vertex to be discovered; the rest of the cycle is still white and reachable from v, so it all gets discovered during v's visit, including the vertex u whose arc returns to v, and that arc is examined while v is still grey.")}
      </p>
      <p>
        {tx(t, "alGtr_undirected",
          "In an undirected graph every edge is seen from both ends, so the edge back to the vertex we came from must not count. There, a cycle exists exactly when the search meets an already-seen neighbour that is not the parent of the current vertex.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "alGtr_depthWarn", "Recursive DFS is as deep as the longest path it follows. On a path of a million vertices, or a 1000 × 1000 grid, that is up to a million stack frames, more than the default stack of 1 to 8 MB holds, and the program crashes with a stack overflow. For big graphs use an explicit stack (a std::vector with push_back and pop_back) instead of recursion. When only the set of reached vertices matters, as for components, any order is fine and the loop is short; see below.")}
      </Callout>

      <H2>{tx(t, "alGtr_appsTitle", "What searches are used for")}</H2>
      <H3>{tx(t, "alGtr_compTitle", "Connected components")}</H3>
      <p>
        {tx(t, "alGtr_compBody",
          "To split an undirected graph into its components, start a search from every vertex that has no label yet and give everything it reaches the same new label. Every vertex and edge is handled once over all the searches: O(V + E) in total.")}
      </p>
      <CodeBlock lang="cpp" filename="components.cpp" t={t}>{`// comp[v] = the number of v's component (0, 1, 2, ...). Returns how many there are.
int components(const Graph& g, std::vector<int>& comp) {
    comp.assign(g.n, -1);
    int count = 0;
    std::vector<int> stack;                        // an explicit stack: no recursion depth limit
    for (int s = 0; s < g.n; ++s) {
        if (comp[s] != -1) continue;               // already in a component
        comp[s] = count;
        stack.push_back(s);
        while (!stack.empty()) {
            int u = stack.back();
            stack.pop_back();
            for (const Edge& e : g.adj[u])
                if (comp[e.to] == -1) { comp[e.to] = count; stack.push_back(e.to); }
        }
        ++count;
    }
    return count;
}`}</CodeBlock>
      <H3>{tx(t, "alGtr_bipTitle", "Two-colouring")}</H3>
      <p>
        {tx(t, "alGtr_bipBody",
          "A graph is bipartite if its vertices can be split into two groups with every edge going between the groups: students and courses, or a schedule of two shifts where people who clash must be in different shifts. Test it with BFS: colour s red, its neighbours blue, their neighbours red, and so on, alternating with the distance. If some edge joins two vertices of the same colour, the graph is not bipartite. That happens exactly when the graph contains a cycle of odd length, since going round a cycle flips the colour at every step and must return to the start's colour.")}
      </p>
      <H3>{tx(t, "alGtr_topoTitle", "Topological order")}</H3>
      <p>
        {tx(t, "alGtr_topoBody",
          "Tasks with prerequisites form a DAG: an arc u → v means u must be done before v. A topological order lists all vertices so that every arc points forward in the list. It exists exactly when there is no directed cycle, since in a cycle each task would have to come before itself. DFS gives one for free: list the vertices by decreasing finish time. For any arc u → v, v finishes before u. If v is white when the arc is examined, it is visited and finished inside u's visit; if it is black, it has finished already; it cannot be grey, since that would be a back arc and a cycle.")}
      </p>
      <p>
        {tx(t, "alGtr_kahnBody",
          "Kahn's algorithm does the same without recursion, and is how a build system or a spreadsheet decides what to compute first. Count each vertex's in-degree, the number of prerequisites it still waits for. Every vertex with in-degree 0 is ready. Repeatedly output a ready vertex and remove its arcs; a vertex whose count drops to 0 becomes ready. If vertices remain that never became ready, they lie on or behind a cycle.")}
      </p>
      <CodeBlock lang="cpp" filename="topo_order.cpp" t={t}>{`// An order where every arc u -> v has u before v, or an empty vector if there is a cycle.
std::vector<int> topoOrder(const Graph& g) {
    std::vector<int> indeg(g.n, 0), order;
    for (int u = 0; u < g.n; ++u)
        for (const Edge& e : g.adj[u]) indeg[e.to]++;
    std::queue<int> ready;                         // nothing left to wait for
    for (int u = 0; u < g.n; ++u)
        if (indeg[u] == 0) ready.push(u);
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        order.push_back(u);
        for (const Edge& e : g.adj[u])
            if (--indeg[e.to] == 0) ready.push(e.to);   // its last prerequisite is done
    }
    if ((int)order.size() < g.n) order.clear();    // some vertices never became ready: a cycle
    return order;
}`}</CodeBlock>
      <LessonTable
        headers={[tx(t, "alGtr_tQuestion", "Question"), tx(t, "alGtr_tSearch", "Search"), tx(t, "alGtr_tCost", "Cost")]}
        rows={[
          [tx(t, "alGtr_q1", "fewest edges from s to every vertex"), "BFS", "O(V + E)"],
          [tx(t, "alGtr_q2", "can t be reached from s?"), tx(t, "alGtr_q2b", "BFS or DFS"), "O(V + E)"],
          [tx(t, "alGtr_q3", "connected components"), tx(t, "alGtr_q3b", "any search from every unlabelled vertex"), "O(V + E)"],
          [tx(t, "alGtr_q4", "is there a cycle?"), tx(t, "alGtr_q4b", "DFS: a back arc (directed) or a seen non-parent neighbour (undirected)"), "O(V + E)"],
          [tx(t, "alGtr_q5", "bipartite?"), tx(t, "alGtr_q5b", "BFS with alternating colours"), "O(V + E)"],
          [tx(t, "alGtr_q6", "an order that respects dependencies"), tx(t, "alGtr_q6b", "DFS by decreasing finish time, or Kahn"), "O(V + E)"],
        ]}
      />

      <H2>{tx(t, "alGtr_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alGtr_w1",
          "1. BFS from A on the sample graph, neighbours in alphabetical order. Queue [A]. Pop A: B and E get distance 1. Pop B: C and F get 2 (A is seen). Pop E: A and F are seen. Pop C: D and G get 3. Pop F: all seen. Pop D: H gets 4. Pop G, pop H: nothing new. Distances A 0, B 1, E 1, C 2, F 2, D 3, G 3, H 4; the path to H read from the parents is A, B, C, D, H.")}
      </p>
      <p>
        {tx(t, "alGtr_w2",
          "2. DFS from A, same order. A (d = 1) → B (2) → C (3) → D (4) → G (5) → F (6) → E (7). E's neighbours A and F are both grey: E finishes at 8, then F at 9. Back in G, H is still white: H (10), finishes at 11. Then G 12, D 13, C 14, B 15, A 16. Discovery order A B C D G F E H, very different from BFS: DFS went all the way to E through six edges, where BFS reached it in one.")}
      </p>
      <p>
        {tx(t, "alGtr_w3",
          "3. Kahn on five courses: Math → Physics, Math → Algorithms, Programming → Algorithms, Algorithms → Graphics, Physics → Graphics. In-degrees: Math 0, Programming 0, Physics 1, Algorithms 2, Graphics 2. Ready: Math, Programming. Output Math: Physics drops to 0 (ready), Algorithms to 1. Output Programming: Algorithms drops to 0. Output Physics: Graphics to 1. Output Algorithms: Graphics to 0. Output Graphics. Order: Math, Programming, Physics, Algorithms, Graphics.")}
      </p>

      <H2>{tx(t, "alGtr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alGtr_tMistake", "Mistake"), tx(t, "alGtr_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alGtr_e1", "Marking a vertex when it is popped"), tx(t, "alGtr_e1b", "it is pushed once per seen neighbour, and the queue grows to O(E); mark when pushing")],
          [tx(t, "alGtr_e2", "DFS for shortest paths"), tx(t, "alGtr_e2b", "the first path DFS finds is often long (A to E above took six edges instead of one); use BFS")],
          [tx(t, "alGtr_e3", "Deep recursion on a big graph"), tx(t, "alGtr_e3b", "stack overflow; use an explicit stack")],
          [tx(t, "alGtr_e4", "Not resetting the marks between searches"), tx(t, "alGtr_e4b", "a second search sees everything as visited and does nothing; reinitialise, or use a new label per search")],
          [tx(t, "alGtr_e5", "Counting the edge back to the parent as a cycle"), tx(t, "alGtr_e5b", "every undirected graph with an edge looks cyclic; skip the parent (for parallel edges, skip the edge, not the vertex)")],
          [tx(t, "alGtr_e6", "Topological order of a graph with a cycle"), tx(t, "alGtr_e6b", "there is none; Kahn outputs fewer than V vertices, which is the signal to check")],
        ]}
      />

      <KeyIdeas t={t} id="alGtr" items={[
        "Every graph search keeps visited marks, so each vertex is handled once: O(V + E).",
        "BFS uses a queue, visits vertices in order of distance, and gives the fewest edges to every vertex; parents rebuild the paths.",
        "Mark a vertex when it enters the queue, not when it leaves.",
        "DFS uses recursion (or a stack); white/grey/black and discovery/finish times record its structure.",
        "A directed graph has a cycle exactly when DFS finds an arc to a grey vertex.",
        "Components, two-colouring and topological order (DFS finish times or Kahn's in-degrees) are all one search.",
      ]} />
    </Article>
  );
}
