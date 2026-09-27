"use client";

// Graphs 1: what a graph is and how to store one — vertices and edges as a
// model (roads, links, dependencies, maps), vocabulary (directed, weighted,
// degree, path, cycle, connected, components, trees, DAGs, sparse/dense),
// the handshake lemma and the maximum number of edges, the sample graph used
// by the whole section, edge list / adjacency matrix / adjacency list with
// code and a cost table, CSR built with counting-sort prefix sums, implicit
// grid graphs; worked examples; common mistakes.

import { CodeBlock, Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead } from "@/components/lesson/Prose";
import { GraphRepFigure } from "@/components/lesson/figures/algo/GraphRepFigure";

const r = String.raw;

export function GraphsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "alGraph_intro",
          "Cities joined by roads, people joined by friendships, web pages joined by links, tasks that must wait for other tasks, the rooms of a game level joined by doors: all of these are things connected to other things. A graph is the mathematical model of exactly that, and nothing more. Once a problem is seen as a graph, a small set of algorithms answers a surprising number of questions about it: can I get from here to there, what is the shortest way, in what order can these tasks run, what is the cheapest way to connect everything. This last section of the track builds those algorithms, starting here with the vocabulary and with how a graph is stored in memory.")}
      </Lead>

      <H2>{tx(t, "alGraph_defTitle", "Vertices and edges")}</H2>
      <p>
        {tx(t, "alGraph_defBody",
          "A graph G = (V, E) is a set V of vertices (also called nodes) and a set E of edges, where each edge connects two vertices. That is the whole definition: a graph says which things are connected, not where they are. The same graph can be drawn in many ways, and the drawing does not matter. The letters V and E are also used for the counts, the number of vertices and the number of edges, and algorithm costs are written with them, like O(V + E).")}
      </p>
      <LessonTable
        headers={[tx(t, "alGraph_tTerm", "Term"), tx(t, "alGraph_tMeaning", "Meaning")]}
        rows={[
          [tx(t, "alGraph_v1", "undirected edge {u, v}"), tx(t, "alGraph_v1b", "a two-way connection: a road you can drive both ways, a friendship")],
          [tx(t, "alGraph_v2", "directed edge (u, v), u → v"), tx(t, "alGraph_v2b", "a one-way connection from u (the tail) to v (the head): a link from one web page to another, \"task u must finish before v\"")],
          [tx(t, "alGraph_v3", "weight w(u, v)"), tx(t, "alGraph_v3b", "a number on an edge: a length, a travel time, a cost. A graph with weights is weighted")],
          [tx(t, "alGraph_v4", "adjacent, neighbour"), tx(t, "alGraph_v4b", "u and v are adjacent (neighbours) if an edge joins them")],
          [tx(t, "alGraph_v5", "degree deg(v)"), tx(t, "alGraph_v5b", "the number of edges touching v. Directed graphs have an out-degree (edges leaving) and an in-degree (edges arriving)")],
          [tx(t, "alGraph_v6", "path"), tx(t, "alGraph_v6b", "a sequence of vertices, each adjacent to the next (following arrows, if directed). Its length is its number of edges, or the sum of their weights. A simple path repeats no vertex")],
          [tx(t, "alGraph_v7", "cycle"), tx(t, "alGraph_v7b", "a path of at least one edge that returns to its first vertex without reusing an edge (and, in an undirected graph, with at least three vertices)")],
          [tx(t, "alGraph_v8", "connected, component"), tx(t, "alGraph_v8b", "an undirected graph is connected if there is a path between every two vertices. Otherwise it falls into connected components: the largest pieces that are connected")],
          [tx(t, "alGraph_v9", "tree, forest"), tx(t, "alGraph_v9b", "a connected graph with no cycle is a tree (the Trees section's trees, without a chosen root); it has exactly V − 1 edges. A graph with no cycle is a forest, a set of trees")],
          [tx(t, "alGraph_v10", "DAG"), tx(t, "alGraph_v10b", "a directed acyclic graph: directed, with no directed cycle. Dependencies between tasks form one")],
          [tx(t, "alGraph_v11", "self-loop, parallel edges"), tx(t, "alGraph_v11b", "an edge from a vertex to itself, or two edges between the same pair. Graphs without either are simple; this section assumes simple graphs unless it says otherwise")],
        ]}
      />

      <H2>{tx(t, "alGraph_countTitle", "Counting degrees and edges")}</H2>
      <p>
        {tx(t, "alGraph_handBody",
          "Add up the degrees of all vertices. Each edge {u, v} is counted exactly twice, once in deg(u) and once in deg(v), so the sum is twice the number of edges. This is called the handshake lemma: at a party, the total number of hands shaken, counted person by person, is twice the number of handshakes.")}
      </p>
      <Equation label={tx(t, "alGraph_eqHand", "The handshake lemma")}
        where={[
          [r`\deg(v)`, tx(t, "alGraph_wDeg", "the number of edges touching v")],
          [r`|E|`, tx(t, "alGraph_wE", "the number of edges")],
        ]}
        note={tx(t, "alGraph_eqHandNote", "Consequence: the number of vertices with odd degree is always even, since the sum is even. In a directed graph every edge adds one to an out-degree and one to an in-degree, so both sums equal |E|.")}>
        {r`\sum_{v \in V} \deg(v) = 2\,|E|`}
      </Equation>
      <p>
        {tx(t, "alGraph_maxBody",
          "A simple undirected graph has at most one edge per pair of vertices, so at most C(V, 2) = V(V − 1)/2 edges (pairs, from the Math track's Counting chapter). A directed graph can have both u → v and v → u, so up to V(V − 1). A graph with close to that many edges is dense; one with E much closer to V than to V² is sparse. Most graphs met in practice are sparse: a road map has a few roads per junction, and a social network with a billion people does not have a billion friends per person. This difference decides how the graph should be stored.")}
      </p>

      <H2>{tx(t, "alGraph_sampleTitle", "The sample graph of this section")}</H2>
      <p>
        {tx(t, "alGraph_sampleBody",
          "Every figure in the Graphs section uses the same small graph, so the numbers can be compared between chapters: 8 vertices A to H and 12 weighted, undirected edges AB 4, AE 7, BC 5, BF 3, EF 5, CF 1, CD 7, CG 4, FG 4, DH 3, GH 5, DG 8. In code the vertices are numbered 0 to V − 1 (A = 0, …, H = 7), so arrays indexed by vertex work directly.")}
      </p>

      <H2>{tx(t, "alGraph_storeTitle", "Three ways to store a graph")}</H2>
      <H3>{tx(t, "alGraph_edgeListTitle", "Edge list")}</H3>
      <p>
        {tx(t, "alGraph_edgeListBody",
          "The plainest representation is an array of the edges, each a triple (u, v, w). It takes O(E) memory and is how graphs usually arrive in a file. It is the right shape for algorithms that look at all edges in some order, like Kruskal's in the Minimum Spanning Trees chapter, but finding the neighbours of one vertex means scanning the whole array.")}
      </p>
      <H3>{tx(t, "alGraph_matrixTitle", "Adjacency matrix")}</H3>
      <p>
        {tx(t, "alGraph_matrixBody",
          "A V × V table where entry [u][v] holds the weight of edge (u, v), or a special value when there is none. Stored row-major in one array (Memory chapter), entry [u][v] lives at index u·V + v. Checking whether an edge exists is one array access, O(1). But the table has V² entries whatever the number of edges, and listing the neighbours of u means reading its whole row, O(V). For an undirected graph the matrix is symmetric: [u][v] = [v][u].")}
      </p>
      <CodeBlock lang="cpp" filename="matrix_graph.cpp" t={t}>{`#include <vector>

struct MatrixGraph {
    int n;                                          // vertices 0 .. n - 1
    std::vector<int> w;                             // n × n, row-major; 0 means "no edge"

    explicit MatrixGraph(int n) : n(n), w(n * n, 0) {}

    int& at(int u, int v) { return w[u * n + v]; }
    void addEdge(int u, int v, int weight) {        // undirected: both directions
        at(u, v) = weight;
        at(v, u) = weight;
    }
    bool hasEdge(int u, int v) { return at(u, v) != 0; }   // O(1)
};`}</CodeBlock>
      <H3>{tx(t, "alGraph_listTitle", "Adjacency list")}</H3>
      <p>
        {tx(t, "alGraph_listBody",
          "For every vertex, a list of the edges leaving it: its neighbours, each with the weight of the edge. An undirected edge {u, v} appears twice, as v in u's list and as u in v's list, so there are 2E entries, and the total memory is O(V + E). Going through the neighbours of u costs O(deg(u)), exactly the work that is useful. Almost every graph algorithm in this section does \"for each neighbour of u\", which makes this the standard representation.")}
      </p>
      <CodeBlock lang="cpp" filename="graph.cpp" t={t}>{`#include <vector>

struct Edge { int to, w; };                         // one entry of an adjacency list

struct Graph {
    int n;                                          // vertices 0 .. n - 1
    std::vector<std::vector<Edge>> adj;             // adj[u]: the edges leaving u

    explicit Graph(int n) : n(n), adj(n) {}

    void addEdge(int u, int v, int w) {             // undirected: store both directions
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }
    void addArc(int u, int v, int w) {              // directed: u -> v only
        adj[u].push_back({v, w});
    }
};

// Visiting the neighbours of u:
//     for (const Edge& e : g.adj[u]) { /* e.to is a neighbour, e.w the weight */ }`}</CodeBlock>
      <p>
        {tx(t, "alGraph_listCode",
          "adj is a std::vector of std::vectors: one growable array (Dynamic Arrays chapter) per vertex. The loop at the end is a range-based for: it runs once for every element of g.adj[u], with e referring to that element; const Edge& reads it in place instead of copying it. Try the three representations in the figure and tap a vertex to see where its edges are stored.")}
      </p>

      <GraphRepFigure t={t} />

      <LessonTable
        headers={[tx(t, "alGraph_tOp", "Operation"), tx(t, "alGraph_tEl", "edge list"), tx(t, "alGraph_tMat", "adjacency matrix"), tx(t, "alGraph_tList", "adjacency list")]}
        rows={[
          [tx(t, "alGraph_o1", "memory"), "O(E)", "O(V²)", "O(V + E)"],
          [tx(t, "alGraph_o2", "is there an edge u–v?"), "O(E)", "O(1)", "O(deg u)"],
          [tx(t, "alGraph_o3", "all neighbours of u"), "O(E)", "O(V)", "O(deg u)"],
          [tx(t, "alGraph_o4", "all edges"), "O(E)", "O(V²)", "O(V + E)"],
          [tx(t, "alGraph_o5", "add an edge"), "O(1)", "O(1)", tx(t, "alGraph_o5b", "O(1) amortised")],
        ]}
      />
      <p>
        {tx(t, "alGraph_choose",
          "Rule of thumb: adjacency lists, unless the graph is small and dense (a few thousand vertices with many edges each) or the algorithm keeps asking \"is u joined to v?\", as the Floyd–Warshall algorithm of the Shortest Paths chapter does. Then the matrix is simpler and fast.")}
      </p>

      <H3>{tx(t, "alGraph_csrTitle", "All lists in one array")}</H3>
      <p>
        {tx(t, "alGraph_csrBody",
          "A vector of vectors makes one heap allocation per vertex, and the lists end up scattered in memory. When the graph does not change after it is built, all lists can be packed back to back in one array, with a second array saying where each list starts. This layout is called compressed sparse row (CSR). It is built exactly like counting sort (Linear Sorts chapter): count each vertex's degree, turn the counts into starting positions with prefix sums, then drop every edge into the next free slot of its vertex.")}
      </p>
      <CodeBlock lang="cpp" filename="csr.cpp" t={t}>{`// The neighbours of u are to[start[u]] .. to[start[u + 1] - 1].
struct CSR {
    std::vector<int> start;                         // n + 1 positions
    std::vector<int> to;                            // 2m neighbours, list after list
};

// Builds an undirected CSR graph from m edges (eu[i], ev[i]).
CSR buildCSR(int n, const int* eu, const int* ev, int m) {
    CSR g;
    g.start.assign(n + 1, 0);
    for (int i = 0; i < m; ++i) { g.start[eu[i] + 1]++; g.start[ev[i] + 1]++; }   // degrees
    for (int u = 0; u < n; ++u) g.start[u + 1] += g.start[u];                     // prefix sums
    g.to.resize(2 * m);
    std::vector<int> next(g.start.begin(), g.start.end() - 1);                    // next free slot of each vertex
    for (int i = 0; i < m; ++i) {
        g.to[next[eu[i]]++] = ev[i];
        g.to[next[ev[i]]++] = eu[i];
    }
    return g;
}`}</CodeBlock>

      <H2>{tx(t, "alGraph_gridTitle", "Graphs that are never stored")}</H2>
      <p>
        {tx(t, "alGraph_gridBody",
          "A tile map of a game, a maze or the pixels of an image is a graph too: each walkable cell is a vertex, joined to the cells up, down, left and right of it (or also the four diagonals). Nobody stores these edges. The neighbours are computed when needed, and the cell in row r and column c gets the number r · cols + c when an array indexed by vertex is wanted. Every algorithm in this section works unchanged on such an implicit graph; only the \"for each neighbour\" loop looks different:")}
      </p>
      <CodeBlock lang="cpp" filename="grid_neighbours.cpp" t={t}>{`const int DR[4] = { -1, 1, 0, 0 };                  // up, down, left, right
const int DC[4] = { 0, 0, -1, 1 };

// grid[r][c] == '#' is a wall. Visits the walkable neighbours of cell (r, c).
for (int k = 0; k < 4; ++k) {
    int nr = r + DR[k], nc = c + DC[k];
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;   // off the map
    if (grid[nr][nc] == '#') continue;                              // a wall
    int v = nr * cols + nc;                                         // the neighbour's vertex number
    // ... use v
}`}</CodeBlock>
      <Callout type="info" t={t}>
        {tx(t, "alGraph_modelTip", "Much of the skill with graphs is in the modelling: deciding what the vertices and edges are. In a puzzle, a vertex can be a whole state of the board and an edge a legal move; then \"fewest moves to solve it\" becomes a shortest-path question. The next chapter answers those.")}
      </Callout>

      <H2>{tx(t, "alGraph_workedTitle", "Worked examples")}</H2>
      <p>
        {tx(t, "alGraph_w1",
          "1. Degrees of the sample graph: A 2 (B, E), B 3 (A, C, F), C 4 (B, D, F, G), D 3 (C, G, H), E 2 (A, F), F 4 (B, C, E, G), G 4 (C, D, F, H), H 2 (D, G). The sum is 24 = 2 × 12 edges, as the handshake lemma says, and the odd degrees (B and D) come in an even number.")}
      </p>
      <p>
        {tx(t, "alGraph_w2",
          "2. A road network with V = 1,000,000 junctions and E = 2,500,000 roads. As a matrix of 4-byte ints: V² = 10¹² entries, 4 TB, almost all of them \"no road\". As adjacency lists: 2E = 5,000,000 entries of 8 bytes (to and w) = 40 MB, plus 24 bytes of vector bookkeeping per vertex, 24 MB: about 64 MB. As CSR with a weight array next to to: (V + 1) · 4 + 2E · 4 + 2E · 4 ≈ 44 MB, in three allocations.")}
      </p>
      <p>
        {tx(t, "alGraph_w3",
          "3. A 3 × 4 grid with no walls. The 4 corner cells have degree 2, the 6 other border cells degree 3, the 2 inner cells degree 4: the sum is 8 + 18 + 8 = 34, so E = 17. Directly: each of the 3 rows has 3 horizontal edges and each of the 4 columns has 2 vertical ones, 9 + 8 = 17. In general an R × C grid has R(C − 1) + C(R − 1) edges, about 2V: very sparse.")}
      </p>

      <H2>{tx(t, "alGraph_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "alGraph_tMistake", "Mistake"), tx(t, "alGraph_tFix", "What happens, and the fix")]}
        rows={[
          [tx(t, "alGraph_e1", "Storing an undirected edge once"), tx(t, "alGraph_e1b", "the edge can be followed from u but not from v, and searches miss half the graph; add both directions")],
          [tx(t, "alGraph_e2", "A matrix for a big sparse graph"), tx(t, "alGraph_e2b", "V² memory runs out long before the edges do; use adjacency lists or CSR")],
          [tx(t, "alGraph_e3", "0 meaning \"no edge\" when weights can be 0"), tx(t, "alGraph_e3b", "a real edge of weight 0 disappears; use a separate bool matrix or a value no weight can take")],
          [tx(t, "alGraph_e4", "Vertices numbered from 1 in the input"), tx(t, "alGraph_e4b", "arrays of size n are indexed 0 .. n − 1; subtract 1 when reading, or allocate n + 1")],
          [tx(t, "alGraph_e5", "Adding edges while looping over a list"), tx(t, "alGraph_e5b", "push_back may reallocate the vector and invalidate the reference being iterated (Dynamic Arrays chapter); collect new edges first, add them after")],
        ]}
      />

      <KeyIdeas t={t} id="alGraph" items={[
        "A graph is a set of vertices and a set of edges between them; edges can be directed and weighted.",
        "Degree, path, cycle, connected component, tree (connected, no cycle, V − 1 edges) and DAG are the basic vocabulary.",
        "Handshake lemma: the degrees add up to 2E. A simple graph has at most V(V − 1)/2 edges; most real graphs are sparse.",
        "Adjacency lists use O(V + E) memory and give a vertex's neighbours in O(deg); they are the default.",
        "An adjacency matrix answers \"is there an edge?\" in O(1) but always costs V² memory.",
        "Grids and puzzle states are implicit graphs: neighbours are computed, never stored.",
      ]} />
    </Article>
  );
}
