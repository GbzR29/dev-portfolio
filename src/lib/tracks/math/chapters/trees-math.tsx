"use client";

// Discrete Mathematics 3: trees — definition (connected, no cycle), leaves
// (every tree has two), E = V − 1 by induction on removing a leaf, the six
// equivalent definitions, forests (E = V − c), counting leaves from the
// degrees, spanning trees (every connected graph has one; Kirchhoff counts
// them), rooted and binary trees (levels, at most 2ʰ leaves), and Cayley's
// formula nⁿ⁻² proved with the Prüfer code.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { SpanningTreeFigure } from "@/components/lesson/figures/math/SpanningTreeFigure";
import { PruferFigure } from "@/components/lesson/figures/math/PruferFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: Cayley's count ──────────────────────────────────────────────

function cayleyNumbers(v: Record<string, number>) {
  const n = v.n, c = n ** (n - 2);
  return { tex: r`${n}^{${n - 2}} = \green{${c.toLocaleString("en-US").replace(/,/g, r`\,`)}}` };
}

export function TreesMathContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mTree_intro",
          "A family tree, the folders on a computer, the branches of a river, the moves of a game: all are graphs that branch out and never loop back. Graph theory calls them trees. They are the simplest connected graphs, with the fewest edges that can hold the vertices together, and that one fact makes them easy to count and to reason about. This chapter proves the basic facts about trees, finds a tree inside every connected graph, and ends with a beautiful count: how many different trees can be drawn on n labelled vertices.")}
      </Lead>

      <Goals t={t} id="mTree" items={[
        "Define a tree and prove that a tree on n vertices has n − 1 edges.",
        "Use the equivalent definitions of a tree, and count leaves from the degrees.",
        "Find spanning trees, and know how many Kₙ has.",
        "Encode and decode a labelled tree with its Prüfer code, and use it to prove Cayley's formula.",
      ]} />

      <H2>{tx(t, "mTree_defTitle", "What a tree is")}</H2>
      <p>
        {tx(t, "mTree_defBody",
          "A tree is a connected graph with no cycle. Connected means every vertex can reach every other along edges; no cycle means there is no way to walk round and come back without retracing an edge. A graph with no cycle that may be in several pieces is a forest: each of its pieces is a tree. A leaf is a vertex of degree 1, the end of a branch.")}
      </p>
      <H3>{tx(t, "mTree_leafTitle", "Every tree has at least two leaves")}</H3>
      <p>
        {tx(t, "mTree_leafBody",
          "Take a tree with at least 2 vertices and look at a longest path in it, from u to w. Suppose u had a second neighbour x besides the next vertex on the path. If x were on the path, the edge ux would close a cycle, impossible in a tree. If x were not on the path, then x, u, … , w would be a longer path, against the choice of the longest one. So u has degree 1. The same holds for w. A tree with at least 2 vertices has at least two leaves.")}
      </p>

      <H2>{tx(t, "mTree_edgeTitle", "A tree on n vertices has n − 1 edges")}</H2>
      <p>
        {tx(t, "mTree_edgeBody",
          "Removing a leaf and its one edge from a tree leaves a tree: still connected (no path between other vertices went through a vertex of degree 1) and still without cycles (nothing was added). That gives a proof by induction, the method of the induction chapter.")}
      </p>
      <Derivation t={t} label={tx(t, "mTree_eqInd", "Every tree on n vertices has exactly n − 1 edges")}
        steps={[
          { full: true, tex: r`n = 1: \quad 0 \text{ edges} = 1 - 1`, why: tx(t, "mTree_i1", "base case: a single vertex, no edge") },
          { full: true, tex: r`\text{assume every tree on } k \text{ vertices has } k - 1 \text{ edges}`, why: tx(t, "mTree_i2", "inductive hypothesis, for some k ≥ 1") },
          { full: true, tex: r`T \text{ on } k + 1 \text{ vertices} \;\to\; T - \text{leaf: a tree on } k \text{ vertices}`, why: tx(t, "mTree_i3", "T has a leaf (it has at least 2 vertices); remove it with its edge") },
          { full: true, tex: r`E(T) = (k - 1) + 1 = \green{k = (k + 1) - 1}`, why: tx(t, "mTree_i4", "the smaller tree has k − 1 edges by the hypothesis, and one edge was removed") },
        ]} />
      <p>
        {tx(t, "mTree_edgeBody2",
          "Another way to see it, which is the one the figure below uses: start with the n vertices and no edges, n separate pieces. Add the edges of the tree one at a time. An edge whose two ends lie in different pieces joins those two into one, and the number of pieces drops by 1. An edge whose ends are already in the same piece would close a cycle, which a tree does not have. So every edge of the tree merges two pieces, and going from n pieces to 1 takes exactly n − 1 of them.")}
      </p>

      <SpanningTreeFigure t={t} />

      <H3>{tx(t, "mTree_eqvTitle", "Six ways to say \"tree\"")}</H3>
      <p>
        {tx(t, "mTree_eqvBody",
          "For a graph G with n vertices, the following statements are all equivalent: if one is true, all are.")}
      </p>
      <LessonTable
        headers={["", tx(t, "mTree_tStatement", "Statement"), tx(t, "mTree_tWhy", "Why it is the same")]}
        rows={[
          ["1", tx(t, "mTree_e1", "G is connected and has no cycle"), tx(t, "mTree_e1w", "the definition")],
          ["2", tx(t, "mTree_e2", "G is connected and has n − 1 edges"), tx(t, "mTree_e2w", "connecting n pieces needs n − 1 merging edges; any more would close a cycle")],
          ["3", tx(t, "mTree_e3", "G has no cycle and has n − 1 edges"), tx(t, "mTree_e3w", "n − 1 merging edges leave exactly one piece")],
          ["4", tx(t, "mTree_e4", "between any two vertices there is exactly one path"), tx(t, "mTree_e4w", "two different paths between the same vertices would contain a cycle")],
          ["5", tx(t, "mTree_e5", "G is connected, and removing any edge disconnects it"), tx(t, "mTree_e5w", "an edge on a cycle could be removed safely; trees have none")],
          ["6", tx(t, "mTree_e6", "G has no cycle, and adding any edge creates exactly one"), tx(t, "mTree_e6w", "the new edge plus the unique path between its ends")],
        ]}
      />
      <p>
        {tx(t, "mTree_forestBody",
          "The same piece-counting gives forests: a forest with n vertices and c pieces has n − c edges, since each edge merged two pieces and n pieces became c. In general a graph with n vertices, m edges and c pieces contains m − n + c independent cycles; turn on \"break it\" in the figure and watch that count.")}
      </p>

      <H2>{tx(t, "mTree_leavesTitle", "Counting leaves from the degrees")}</H2>
      <p>
        {tx(t, "mTree_leavesBody",
          "The handshake lemma plus m = n − 1 tells how many leaves a tree must have. Write n_d for the number of vertices of degree d. Then n = n₁ + n₂ + n₃ + …, and the degrees add up to 2m = 2(n − 1).")}
      </p>
      <Derivation t={t} label={tx(t, "mTree_eqLeaves", "The number of leaves of a tree")}
        steps={[
          { full: true, tex: r`\sum_d d\,n_d = 2(n - 1) = 2\sum_d n_d - 2`, why: tx(t, "mTree_l1", "handshake lemma with m = n − 1, and n written as the sum of all the n_d") },
          { full: true, tex: r`\sum_d (d - 2)\,n_d = -2`, why: tx(t, "mTree_l2", "move everything to the left: d·n_d − 2n_d for each d") },
          { full: true, tex: r`-n_1 + 0 \cdot n_2 + n_3 + 2n_4 + 3n_5 + \dots = -2`, why: tx(t, "mTree_l3", "write the terms out: degree 1 gives −1, degree 2 gives 0") },
          { full: true, tex: r`\green{n_1 = 2 + n_3 + 2n_4 + 3n_5 + \dots}`, why: tx(t, "mTree_l4", "solve for the leaves") },
        ]} />
      <p>
        {tx(t, "mTree_leavesUse",
          "Vertices of degree 2 do not change the count: a path, with only degrees 1 and 2, has exactly 2 leaves. Each vertex of degree 3 adds one leaf, each of degree 4 adds two. A tree with one vertex of degree 4, two of degree 3 and the rest of degree 1 or 2 has 2 + 2 + 2 = 6 leaves, however it is drawn.")}
      </p>

      <H2>{tx(t, "mTree_spanTitle", "Spanning trees")}</H2>
      <p>
        {tx(t, "mTree_spanBody",
          "A spanning tree of a connected graph G is a tree that uses all the vertices of G and some of its edges. Every connected graph has one: while there is a cycle, remove one of its edges; the graph stays connected, because the rest of the cycle still joins the two ends of the removed edge. When no cycle is left, what remains is a tree containing every vertex. Or build up instead, as in the figure: add edges that join different pieces, skip edges that would close a cycle.")}
      </p>
      <p>
        {tx(t, "mTree_kirchBody",
          "How many spanning trees does a graph have? Gustav Kirchhoff found the answer in 1847 while studying electrical networks: write the Laplacian matrix (degrees on the diagonal, −1 for each edge off it), delete one row and the same column, and take the determinant. For K₄ that gives 16, for the 3 × 3 grid 192, for Petersen's graph 2000. The figure computes it this way.")}
      </p>

      <H2>{tx(t, "mTree_rootTitle", "Rooted and binary trees")}</H2>
      <p>
        {tx(t, "mTree_rootBody",
          "Choosing one vertex as the root turns a tree into a hierarchy. Each vertex then has a level: its distance from the root. Its parent is its neighbour one level up; its children are its neighbours one level down. The height of the tree is the largest level. A binary tree is a rooted tree where each vertex has at most two children; it is full when every vertex has either 0 or 2 children.")}
      </p>
      <Equation label={tx(t, "mTree_eqBin", "Leaves of binary trees")}
        where={[
          [r`h`, tx(t, "mTree_wH", "the height: the number of levels below the root")],
          [r`L`, tx(t, "mTree_wL", "the number of leaves (vertices with no children)")],
          [r`i`, tx(t, "mTree_wI", "the number of internal vertices (those with children)")],
        ]}
        words={tx(t, "mTree_binWords", "Each level can at most double, so a binary tree of height h has at most 2ʰ leaves; in a full binary tree there is always one more leaf than inner vertex.")}>
        {r`L \le 2^h \qquad\qquad \text{full binary tree: } L = i + 1`}
      </Equation>
      <p>
        {tx(t, "mTree_binWhy",
          "The second fact comes from counting edges two ways. Every vertex except the root has exactly one edge up to its parent, so there are (i + L) − 1 edges. Every internal vertex of a full tree has exactly two edges down, so there are 2i. Then 2i = i + L − 1, that is L = i + 1. A knockout tournament with 16 players is a full binary tree with 16 leaves, so it has 15 matches. The Algorithms track uses these facts for search trees and heaps.")}
      </p>

      <H2>{tx(t, "mTree_cayTitle", "Cayley's formula: nⁿ⁻² labelled trees")}</H2>
      <p>
        {tx(t, "mTree_cayBody",
          "Label the vertices 1, 2, …, n. Two trees count as different when some pair is joined in one and not in the other, even if they have the same shape. For n = 3 there are 3 labelled trees (the path with 1, 2 or 3 in the middle). For n = 4 there are 16: 12 paths and 4 stars. Arthur Cayley noticed in 1889 that the counts 1, 3, 16, 125, … are nⁿ⁻². The cleanest proof, by Heinz Prüfer in 1918, matches every labelled tree with a list of n − 2 labels, one to one.")}
      </p>
      <LessonTable
        headers={["n", tx(t, "mTree_tShapes", "shapes"), tx(t, "mTree_tLabelled", "labelled trees"), "nⁿ⁻²"]}
        rows={[
          ["2", "1", "1", "2⁰ = 1"],
          ["3", tx(t, "mTree_s3", "path"), "3", "3¹ = 3"],
          ["4", tx(t, "mTree_s4", "path, star"), "12 + 4 = 16", "4² = 16"],
          ["5", tx(t, "mTree_s5", "path, star, and a T-shape"), "60 + 5 + 60 = 125", "5³ = 125"],
        ]}
      />
      <H3>{tx(t, "mTree_pruTitle", "The Prüfer code")}</H3>
      <p>
        {tx(t, "mTree_pruBody",
          "Encoding: find the leaf with the smallest label, write down the label of its neighbour, and remove the leaf. Repeat until only two vertices are left. The n − 2 labels written down are the code. Decoding uses only the code: at each step, take the smallest label that has not been removed yet and does not appear anywhere in the rest of the code. That vertex was the leaf removed at that step, so join it to the current number of the code, and mark it removed. At the end two labels are left; join them.")}
      </p>
      <Derivation t={t} label={tx(t, "mTree_eqDec", "Decode (4, 4, 2) with n = 5")}
        steps={[
          { tex: r`\text{labels } 1,2,3,4,5; \quad \text{code } (4, 4, 2)`, why: tx(t, "mTree_d1", "the smallest label not in the code is 1") },
          { tex: r`1 - 4, \quad \text{rest } (4, 2)`, why: tx(t, "mTree_d2", "1 was the first leaf removed, and its neighbour was 4") },
          { tex: r`3 - 4, \quad \text{rest } (2)`, why: tx(t, "mTree_d3", "now the smallest unused label not in (4, 2) is 3 (2 is still in the code)") },
          { tex: r`4 - 2, \quad \text{rest } ()`, why: tx(t, "mTree_d4", "4 no longer appears later, so 4 is the leaf; its neighbour is 2") },
          { tex: r`\green{2 - 5}`, why: tx(t, "mTree_d5", "the two labels left, 2 and 5, are joined: 4 edges, a tree on 5 vertices") },
        ]} />
      <p>
        {tx(t, "mTree_pruWhy",
          "Two facts make this a perfect matching. A vertex appears in the code exactly (degree − 1) times: each time one of its neighbours is removed as a leaf it is written once, and that happens for all its neighbours but one. So the leaves are exactly the labels missing from the code, and the decoder can always tell which vertex was removed. Every tree gives one code, every list of n − 2 labels decodes to one tree, and decoding undoes encoding. Each of the n − 2 places in the list can hold any of n labels, so there are n · n ⋯ n = nⁿ⁻² lists, and as many trees.")}
      </p>
      <Equation label={tx(t, "mTree_eqCay", "Cayley's formula")}
        where={[
          [r`n`, tx(t, "mTree_wN", "the number of labelled vertices, n ≥ 2")],
          [r`n^{n-2}`, tx(t, "mTree_wCount", "the number of lists of length n − 2 from n labels: the Prüfer codes")],
        ]}
        words={tx(t, "mTree_cayWords", "There are exactly as many trees on n labelled vertices as there are codes of n − 2 labels, and that is n to the power n − 2. These are also the spanning trees of Kₙ.")}>
        {r`\#\{\text{trees on } 1, \dots, n\} = n^{\,n-2}`}
      </Equation>
      <LiveFormula label={tx(t, "mTree_liveCay", "Try it: labelled trees")}
        tex={r`T(n) = n^{\,n-2}`}
        vars={[{ id: "n", label: "n", min: 2, max: 12, step: 1, value: 5, fmt: v => String(v) }]}
        compute={cayleyNumbers}
        note={tx(t, "mTree_liveCayNote", "Already 10⁸ = 100 000 000 trees on 10 labelled vertices.")} />

      <PruferFigure t={t} />

      <Callout type="info" t={t}>
        {tx(t, "mTree_pruTip", "The code also tells you the degrees at a glance: deg v = (number of times v appears) + 1. In (4, 4, 2), vertex 4 appears twice, so it has degree 3; 2 appears once, degree 2; 1, 3 and 5 are leaves.")}
      </Callout>

      <H2>{tx(t, "mTree_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mTree_ex1", "1. A forest has 20 vertices and 16 edges. It has 20 − 16 = 4 trees.")}</p>
      <p>{tx(t, "mTree_ex2", "2. A tree has 3 vertices of degree 3, 1 of degree 4, and the rest leaves. Leaves: 2 + 3 + 2 = 7. Check: n = 3 + 1 + 7 = 11, edges 10, degree sum 9 + 4 + 7 = 20 = 2 · 10.")}</p>
      <p>{tx(t, "mTree_ex3", "3. The Prüfer code (3, 3, 3, 3) on 6 labels is the star with centre 3: 3 appears 4 times, so its degree is 5, and every other vertex is a leaf.")}</p>
      <p>{tx(t, "mTree_ex4", "4. A graph is connected with 12 vertices and 11 edges. By statement 2 of the table it is a tree, without looking at the picture.")}</p>

      <MathPracticeFigure t={t} set="trees" />

      <H2>{tx(t, "mTree_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mTree_tWrong", "Wrong"), tx(t, "mTree_tRight", "Right"), tx(t, "mTree_tWhy2", "Why")]}
        rows={[
          [tx(t, "mTree_m1w", "n − 1 edges ⇒ tree"), tx(t, "mTree_m1r", "n − 1 edges and connected (or acyclic)"), tx(t, "mTree_m1", "a triangle plus an isolated vertex has 3 = 4 − 1 edges and is no tree")],
          [tx(t, "mTree_m2w", "a tree has n edges"), "n − 1", tx(t, "mTree_m2", "every edge merges two of the n starting pieces")],
          [tx(t, "mTree_m3w", "trees on n labels: nⁿ"), "nⁿ⁻²", tx(t, "mTree_m3", "the Prüfer code has n − 2 places")],
          [tx(t, "mTree_m4w", "Prüfer: write down the leaf"), tx(t, "mTree_m4r", "write down its neighbour"), tx(t, "mTree_m4", "the leaves are the labels that never appear")],
          [tx(t, "mTree_m5w", "degree-2 vertices add leaves"), tx(t, "mTree_m5r", "they add none"), tx(t, "mTree_m5", "their term (d − 2)n_d is 0")],
        ]}
      />

      <KeyIdeas t={t} id="mTree" items={[
        "A tree is a connected graph with no cycle; every tree with 2 or more vertices has at least two leaves.",
        "A tree on n vertices has exactly n − 1 edges; a forest with c trees has n − c.",
        "Connected + no cycle, connected + n − 1 edges, no cycle + n − 1 edges, unique paths: all mean tree.",
        "Leaves: n₁ = 2 + n₃ + 2n₄ + 3n₅ + …; degree-2 vertices do not matter.",
        "Every connected graph has a spanning tree; Kirchhoff's determinant counts them.",
        "A full binary tree has one more leaf than internal vertex; height h allows at most 2ʰ leaves.",
        "Cayley: nⁿ⁻² labelled trees, because the Prüfer code matches them one to one with lists of n − 2 labels.",
      ]} />
    </Article>
  );
}
