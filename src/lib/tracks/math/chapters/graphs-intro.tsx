"use client";

// Discrete Mathematics 1: graphs — vertices and edges, the vocabulary
// (adjacent, degree, simple graph, walk, path, cycle, connected), the
// handshake lemma and its corollary (odd vertices come in pairs), the common
// families (complete, cycle, path, bipartite, regular), which degree lists
// are possible (Havel–Hakimi), isomorphism and invariants, and the adjacency
// matrix (row sums are degrees, A² counts walks of length 2). Theory only; the
// Algorithms track stores and searches graphs in code.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { GraphDegreeFigure } from "@/components/lesson/figures/math/GraphDegreeFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: edges of the complete graph ─────────────────────────────────

function completeNumbers(v: Record<string, number>) {
  const n = v.n, e = (n * (n - 1)) / 2;
  return {
    tex: r`\sum \deg = ${n} \cdot ${n - 1} = ${n * (n - 1)} = 2E \quad\Rightarrow\quad E = \green{${e}}`,
  };
}

export function GraphsIntroContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mGr_intro",
          "A graph is the simplest picture of things and the links between them: dots, and lines joining some pairs of dots. Friends in a group, cities and roads, atoms and bonds, web pages and links are all graphs. Everything else about the dots is thrown away: where they sit, how long the lines are, whether the lines are straight. Only one question is kept: which pairs are joined? This chapter sets up the words of graph theory and proves its first theorem, which turns out to say something surprising about any party where people shake hands.")}
      </Lead>

      <Goals t={t} id="mGr" items={[
        "Use the basic words: vertex, edge, degree, adjacent, path, cycle, connected.",
        "State and prove the handshake lemma, and use it to rule out impossible graphs.",
        "Recognise complete, cycle, path, bipartite and regular graphs and count their edges.",
        "Decide whether two drawings show the same graph, and write a graph as a matrix.",
      ]} />

      <H2>{tx(t, "mGr_whatTitle", "Vertices and edges")}</H2>
      <p>
        {tx(t, "mGr_whatBody",
          "A graph G is made of two sets. V is the set of vertices (the dots; one is a vertex). E is the set of edges (the lines); each edge joins two vertices, called its ends. We write G = (V, E). Take V = {A, B, C, D} and E = {AB, AC, BC, CD}: that is a triangle A, B, C with D hanging off C. The letters n = |V| and m = |E| are the usual names for the number of vertices and of edges (|V| means the size of the set V, as in the sets chapter).")}
      </p>
      <p>
        {tx(t, "mGr_whatBody2",
          "The drawing is not the graph. Move D to the other side of the page, bend the edges, cross them over each other: as long as the same pairs are joined, it is the same graph. In the figure below, switch to \"move\" and drag the vertices around. The numbers do not change, because nothing about the graph did.")}
      </p>

      <H3>{tx(t, "mGr_vocabTitle", "The words")}</H3>
      <LessonTable
        headers={[tx(t, "mGr_tWord", "Word"), tx(t, "mGr_tMeans", "Meaning"), tx(t, "mGr_tEx", "In the example")]}
        rows={[
          [tx(t, "mGr_w1", "adjacent"), tx(t, "mGr_w1m", "two vertices joined by an edge (neighbours)"), tx(t, "mGr_w1e", "C and D are adjacent; A and D are not")],
          [tx(t, "mGr_w2", "incident"), tx(t, "mGr_w2m", "an edge and one of its ends"), tx(t, "mGr_w2e", "the edge CD is incident to C and to D")],
          [tx(t, "mGr_w3", "degree, deg(v)"), tx(t, "mGr_w3m", "the number of edge ends at v"), "deg(C) = 3, deg(D) = 1"],
          [tx(t, "mGr_w4", "loop"), tx(t, "mGr_w4m", "an edge from a vertex to itself; it adds 2 to that degree"), tx(t, "mGr_w4e", "none")],
          [tx(t, "mGr_w5", "parallel edges"), tx(t, "mGr_w5m", "two or more edges joining the same pair"), tx(t, "mGr_w5e", "none")],
          [tx(t, "mGr_w6", "simple graph"), tx(t, "mGr_w6m", "no loops and no parallel edges"), tx(t, "mGr_w6e", "yes")],
          [tx(t, "mGr_w7", "isolated vertex"), tx(t, "mGr_w7m", "a vertex of degree 0"), tx(t, "mGr_w7e", "none")],
          [tx(t, "mGr_w8", "leaf"), tx(t, "mGr_w8m", "a vertex of degree 1"), "D"],
        ]}
      />
      <p>
        {tx(t, "mGr_simpleBody",
          "Unless a chapter says otherwise, \"graph\" means simple graph. The next chapter needs parallel edges (the bridges of Königsberg), and it will say so. A graph whose edges have a direction, drawn as arrows, is a directed graph; there each vertex has an in-degree and an out-degree. This section stays with undirected graphs.")}
      </p>

      <H2>{tx(t, "mGr_hsTitle", "The handshake lemma")}</H2>
      <p>
        {tx(t, "mGr_hsBody",
          "Add up the degrees of all the vertices. In the example: deg(A) + deg(B) + deg(C) + deg(D) = 2 + 2 + 3 + 1 = 8, and there are 4 edges. Twice. That is no accident. The degree of a vertex counts the edge ends sitting at it. So the sum of all degrees counts every edge end in the graph. And every edge has exactly two ends.")}
      </p>
      <Derivation t={t} label={tx(t, "mGr_eqHsDer", "Why the degrees add up to 2m")}
        steps={[
          { full: true, tex: r`\sum_{v \in V} \deg(v) = \text{number of (vertex, edge) pairs where the edge touches the vertex}`, why: tx(t, "mGr_hs1", "count the edge ends vertex by vertex: each vertex contributes its degree") },
          { full: true, tex: r`= \sum_{e \in E} (\text{number of ends of } e)`, why: tx(t, "mGr_hs2", "count the same pairs edge by edge instead: the total cannot depend on the order you count in") },
          { full: true, tex: r`= \sum_{e \in E} 2 = \green{2m}`, why: tx(t, "mGr_hs3", "every edge has two ends (a loop has both ends at the same vertex and adds 2 to it)") },
        ]} />
      <Equation label={tx(t, "mGr_eqHs", "The handshake lemma")}
        where={[
          [r`\deg(v)`, tx(t, "mGr_wDeg", "the degree of the vertex v: how many edge ends touch it")],
          [r`\sum_{v \in V}`, tx(t, "mGr_wSum", "add up over every vertex of the graph (Σ notation from the summation chapter)")],
          [r`m`, tx(t, "mGr_wM", "the number of edges, |E|")],
        ]}
        words={tx(t, "mGr_hsWords", "Add up how many edges each vertex has, and you get twice the number of edges, because you counted each edge once from each of its ends.")}>
        {r`\sum_{v \in V} \deg(v) = 2m`}
      </Equation>
      <p>
        {tx(t, "mGr_hsName",
          "The name comes from a party: if the vertices are people and the edges are handshakes, then adding up how many hands each person shook gives twice the number of handshakes, because each handshake involves two hands.")}
      </p>

      <H3>{tx(t, "mGr_oddTitle", "Odd vertices come in pairs")}</H3>
      <Derivation t={t} label={tx(t, "mGr_eqOddDer", "Every graph has an even number of odd-degree vertices")}
        steps={[
          { full: true, tex: r`\sum_{\deg v \text{ even}} \deg(v) + \sum_{\deg v \text{ odd}} \deg(v) = 2m`, why: tx(t, "mGr_od1", "split the sum of the handshake lemma into the even-degree vertices and the odd-degree ones") },
          { full: true, tex: r`\sum_{\deg v \text{ odd}} \deg(v) = 2m - \text{(a sum of even numbers)} = \text{even}`, why: tx(t, "mGr_od2", "a sum of even numbers is even, and even minus even is even") },
          { full: true, tex: r`\text{a sum of } k \text{ odd numbers is even} \iff k \text{ is even}`, why: tx(t, "mGr_od3", "each odd number is 1 more than an even one, so the sum is even plus k; it is even exactly when k is") },
          { full: true, tex: r`\green{\text{the number of odd-degree vertices is even}}`, why: tx(t, "mGr_od4", "so k, the count of odd vertices, is even") },
        ]} />
      <p>
        {tx(t, "mGr_oddUse",
          "This rules things out with no drawing at all. Can 7 people each shake exactly 3 hands? The degrees would add up to 7 · 3 = 21, which is odd, and the sum must be 2m. So no. Can a graph have degrees 4, 3, 3, 2, 1? Three odd vertices: no. In the figure, try to end up with exactly one amber ring; every edge you add or remove changes the count by 0 or 2.")}
      </p>

      <GraphDegreeFigure t={t} />

      <H2>{tx(t, "mGr_famTitle", "Families of graphs")}</H2>
      <p>
        {tx(t, "mGr_famBody",
          "A few graphs come up so often that they have names. In each one, the handshake lemma gives the number of edges from the degrees.")}
      </p>
      <LessonTable
        headers={[tx(t, "mGr_tName", "Graph"), tx(t, "mGr_tWhat", "What it is"), tx(t, "mGr_tDeg", "Degrees"), tx(t, "mGr_tEdges", "Edges")]}
        rows={[
          [tx(t, "mGr_fK", "complete Kₙ"), tx(t, "mGr_fKw", "every pair of the n vertices joined"), "n − 1", "n(n − 1)/2"],
          [tx(t, "mGr_fC", "cycle Cₙ (n ≥ 3)"), tx(t, "mGr_fCw", "n vertices in a ring"), "2", "n"],
          [tx(t, "mGr_fP", "path Pₙ"), tx(t, "mGr_fPw", "n vertices in a row"), tx(t, "mGr_fPd", "1 at the two ends, 2 inside"), "n − 1"],
          [tx(t, "mGr_fB", "complete bipartite Kₐ,ᵦ"), tx(t, "mGr_fBw", "two groups of a and b vertices; every vertex joined to every vertex of the other group, none inside a group"), tx(t, "mGr_fBd", "b on one side, a on the other"), "ab"],
          [tx(t, "mGr_fR", "k-regular"), tx(t, "mGr_fRw", "every vertex has the same degree k"), "k", "nk/2"],
        ]}
      />
      <p>
        {tx(t, "mGr_kBody",
          "For Kₙ: each of the n vertices has degree n − 1 (it is joined to all the others), so the degrees add up to n(n − 1), and the number of edges is half that. The same count comes from the counting chapter: an edge is a choice of 2 vertices out of n, and C(n, 2) = n(n − 1)/2. For a k-regular graph the lemma gives nk = 2m, so nk must be even: there is no 3-regular graph on 7 vertices.")}
      </p>
      <LiveFormula label={tx(t, "mGr_liveK", "Try it: the complete graph Kₙ")}
        tex={r`E(K_n) = \frac{n(n-1)}{2}`}
        vars={[{ id: "n", label: "n", min: 2, max: 20, step: 1, value: 5, fmt: v => String(v) }]}
        compute={completeNumbers}
        note={tx(t, "mGr_liveKNote", "K₅ has 10 edges, K₁₀ already 45, K₂₀ 190: the edges grow like n², because every new vertex brings an edge to each old one.")} />
      <p>
        {tx(t, "mGr_bipBody",
          "A graph is bipartite when its vertices can be split into two groups so that every edge goes from one group to the other. A path, an even cycle and Kₐ,ᵦ are bipartite. A triangle is not: put A in group 1; B must go in group 2, C must differ from both, and there is no third group. In general a graph is bipartite exactly when it has no cycle of odd length; the planar graphs chapter comes back to this as colouring with two colours.")}
      </p>

      <H2>{tx(t, "mGr_walkTitle", "Walks, paths, cycles and connectedness")}</H2>
      <p>
        {tx(t, "mGr_walkBody",
          "A walk is a sequence of vertices where each one is adjacent to the next, like A, C, B, C, D: you move along edges and may repeat anything. Its length is the number of edges used (here 4). A path is a walk that never repeats a vertex. A cycle is a walk of length at least 3 that returns to its start and repeats no other vertex: A, B, C, A is a cycle of length 3. A graph is connected when any two vertices are joined by some path. A disconnected graph falls into pieces called components, each one connected, with no edge between different pieces. The distance between two vertices is the length of the shortest path between them.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mGr_walkTip", "Any walk from u to v contains a path from u to v: whenever the walk visits a vertex twice, cut out the loop between the two visits. Repeat until no vertex repeats. So \"connected by a walk\" and \"connected by a path\" mean the same.")}
      </Callout>

      <H2>{tx(t, "mGr_seqTitle", "Which degree lists are possible?")}</H2>
      <p>
        {tx(t, "mGr_seqBody",
          "The degree sequence of a graph is the list of its degrees, largest first. The example graph has degree sequence 3, 2, 2, 1. Turn the question around: given a list, is there a simple graph with exactly those degrees? An odd sum rules it out, by the handshake lemma. But an even sum is not enough. Take 3, 3, 1, 1: the sum is 8, even. The two vertices of degree 3 each need 3 neighbours, and there are only 3 other vertices, so each is joined to everyone. Then both of the last two vertices touch both 3s, and their degrees are at least 2, not 1. Impossible.")}
      </p>
      <p>
        {tx(t, "mGr_hhBody",
          "The Havel–Hakimi test settles every case by shrinking the list. Take the largest degree d off the list and join that vertex to the vertices with the next d largest degrees: subtract 1 from each of those d numbers. Sort again and repeat. The original list is possible exactly when you reach a list of zeros; it is impossible if you ever need more vertices than are left or a number goes below 0.")}
      </p>
      <Derivation t={t} label={tx(t, "mGr_eqHH", "Havel–Hakimi on 3, 3, 2, 2, 2")}
        steps={[
          { tex: r`3, 3, 2, 2, 2`, why: tx(t, "mGr_hh1", "the sum is 12, even, so it may be possible") },
          { tex: r`\cancel{3},\ 2, 1, 1, 2 \;\to\; 2, 2, 1, 1`, why: tx(t, "mGr_hh2", "remove a 3, take 1 off the next three numbers, sort") },
          { tex: r`\cancel{2},\ 1, 0, 1 \;\to\; 1, 1, 0`, why: tx(t, "mGr_hh3", "remove a 2, take 1 off the next two, sort") },
          { tex: r`\cancel{1},\ 0, 0 \;\to\; \green{0, 0}`, why: tx(t, "mGr_hh4", "all zeros: a graph exists (with 12 / 2 = 6 edges); undoing the steps builds it") },
        ]} />

      <H2>{tx(t, "mGr_isoTitle", "When are two graphs the same?")}</H2>
      <p>
        {tx(t, "mGr_isoBody",
          "Two graphs are isomorphic (from Greek: \"same shape\") when you can rename the vertices of one to get exactly the other: a one-to-one matching of their vertices such that two vertices are adjacent in the first graph exactly when their partners are adjacent in the second. Isomorphic graphs are the same graph drawn twice. Anything defined only through vertices and edges must then be equal for both; such a quantity is an invariant. The number of vertices, the number of edges, the degree sequence, the number of components and the length of the shortest cycle are all invariants.")}
      </p>
      <p>
        {tx(t, "mGr_isoBody2",
          "Invariants can prove two graphs different: if any invariant differs, they are not isomorphic. They cannot prove two graphs the same. C₆, a ring of six, and two separate triangles both have 6 vertices, 6 edges and every degree equal to 2. Yet one is connected and the other is not. Load both in the figure.")}
      </p>
      <Callout type="warn" t={t}>
        {tx(t, "mGr_isoWarn", "Matching degree sequences do not make two graphs isomorphic. To show they are the same, write down the renaming and check every edge; to show they are different, find one invariant that differs.")}
      </Callout>

      <H2>{tx(t, "mGr_matTitle", "The adjacency matrix")}</H2>
      <p>
        {tx(t, "mGr_matBody",
          "Number the vertices 1 to n. The adjacency matrix A is the n × n table with a 1 in row i, column j when vertices i and j are adjacent, and 0 otherwise. For a simple graph the diagonal is all 0 (no loops) and the table is symmetric: A_ij = A_ji, because an edge joins i to j and j to i. Each row adds up to the degree of its vertex. Open \"adjacency matrix\" in the figure and check it.")}
      </p>
      <Equation label={tx(t, "mGr_eqA2", "Squaring A counts walks of length 2")}
        where={[
          [r`A_{ik}`, tx(t, "mGr_wAik", "1 if i and k are adjacent, else 0")],
          [r`A_{ik}A_{kj}`, tx(t, "mGr_wProd", "1 exactly when i–k–j is a walk of two steps through k, else 0")],
          [r`(A^2)_{ij}`, tx(t, "mGr_wA2", "the entry of the matrix product A·A in row i, column j")],
        ]}
        words={tx(t, "mGr_a2Words", "Going over every possible middle vertex k and adding 1 for each that works counts the two-step walks from i to j.")}>
        {r`(A^2)_{ij} = \sum_{k=1}^{n} A_{ik}A_{kj} = \text{number of walks } i \to k \to j`}
      </Equation>
      <p>
        {tx(t, "mGr_matBody2",
          "In particular (A²)_ii counts the walks i → k → i, one for each neighbour k, so the diagonal of A² is the list of degrees. The same argument with more factors shows that (Aᵏ)_ij counts the walks of length k from i to j. This is the matrix product of the matrices chapter doing counting.")}
      </p>
      <p>
        {tx(t, "mGr_algoLink",
          "Storing a graph in a program, as a matrix or as lists of neighbours, and searching through it are the subject of the Graphs section of the Algorithms track. Here the questions are about what must be true of every graph.")}
      </p>

      <H2>{tx(t, "mGr_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mGr_ex1", "1. A graph has 9 vertices, each of degree 4. Edges: 9 · 4 / 2 = 18.")}</p>
      <p>{tx(t, "mGr_ex2", "2. A graph has 10 edges and every vertex has degree 5. Then 5n = 2 · 10 = 20, so n = 4. But a simple graph on 4 vertices has degree at most 3, so no simple graph does it (one with parallel edges could).")}</p>
      <p>{tx(t, "mGr_ex3", "3. K₃,₄: 3 + 4 = 7 vertices and 3 · 4 = 12 edges. Check: three vertices of degree 4 and four of degree 3 give 12 + 12 = 24 = 2 · 12.")}</p>
      <p>{tx(t, "mGr_ex4", "4. Among any 6 people, an even number of them have shaken an odd number of hands at the party: it is the corollary, with people as vertices.")}</p>

      <MathPracticeFigure t={t} set="graphs" />

      <H2>{tx(t, "mGr_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mGr_tWrong", "Wrong"), tx(t, "mGr_tRight", "Right"), tx(t, "mGr_tWhy", "Why")]}
        rows={[
          [tx(t, "mGr_m1w", "Σ deg = m"), "Σ deg = 2m", tx(t, "mGr_m1", "each edge is counted at both of its ends")],
          [tx(t, "mGr_m2w", "Kₙ has n(n − 1) edges"), "n(n − 1)/2", tx(t, "mGr_m2", "counting from both ends counts each edge twice")],
          [tx(t, "mGr_m3w", "even sum ⇒ the degree list works"), tx(t, "mGr_m3r", "even sum is only necessary"), tx(t, "mGr_m3", "3, 3, 1, 1 has an even sum and no graph; use Havel–Hakimi")],
          [tx(t, "mGr_m4w", "same degrees ⇒ same graph"), tx(t, "mGr_m4r", "invariants only prove difference"), tx(t, "mGr_m4", "C₆ and two triangles")],
          [tx(t, "mGr_m5w", "crossing lines make a new vertex"), tx(t, "mGr_m5r", "vertices are only the dots"), tx(t, "mGr_m5", "where edges cross in a drawing means nothing")],
        ]}
      />

      <KeyIdeas t={t} id="mGr" items={[
        "A graph is a set of vertices and a set of edges joining pairs of them; the drawing does not matter.",
        "The degree of a vertex is the number of edge ends at it; the degrees add up to twice the number of edges.",
        "So every graph has an even number of odd-degree vertices.",
        "Kₙ has n(n − 1)/2 edges, Kₐ,ᵦ has ab, a k-regular graph on n vertices has nk/2.",
        "A path repeats no vertex, a cycle returns to its start; a connected graph has a path between any two vertices.",
        "Isomorphic graphs are the same up to renaming; invariants can show two graphs differ, never that they are equal.",
        "The adjacency matrix has row sums equal to the degrees, and (Aᵏ)ᵢⱼ counts the walks of length k from i to j.",
      ]} />
    </Article>
  );
}
