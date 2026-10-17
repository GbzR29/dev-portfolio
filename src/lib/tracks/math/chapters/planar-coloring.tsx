"use client";

// Discrete Mathematics 4: planar graphs and colouring — planar drawings and
// faces; Euler's formula V − E + F = 2 by induction on the edges; the
// polyhedra and why there are only five regular ones; E ≤ 3V − 6, so K₅ and
// K₃,₃ are not planar (Kuratowski); a vertex of degree ≤ 5 always exists;
// vertex colouring and the chromatic number; bipartite = 2-colourable = no
// odd cycle; greedy colouring uses at most Δ + 1 colours; maps become graphs;
// the six colour theorem proved, and the story of the four colour theorem.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { PlanarFigure } from "@/components/lesson/figures/math/PlanarFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: can Kₙ be planar? ───────────────────────────────────────────

const boundNumbers = (t: TrackTranslations) => (v: Record<string, number>) => {
  const n = v.n, e = (n * (n - 1)) / 2, b = 3 * n - 6, ok = e <= b;
  return {
    tex: r`E(K_{${n}}) = ${e} \;${ok ? r`\le` : ">"}\; 3 \cdot ${n} - 6 = ${b} \qquad ${ok
      ? r`\green{\text{${tx(t, "mPlan_liveOk", "allowed")}}}`
      : r`\red{\text{${tx(t, "mPlan_liveNo", "not planar")}}}`}`,
  };
};

export function PlanarColoringContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mPlan_intro",
          "Some graphs can be drawn on paper with no two edges crossing, and some cannot, however you try. Which is which turns out to depend on a single equation that Euler found for polyhedra: corners minus edges plus faces is always 2. The same equation then answers an old question about maps: how many colours are needed so that countries sharing a border never get the same colour? The answer, four, took 124 years and a computer to prove. This chapter proves Euler's formula, uses it to show that two famous graphs are not planar, and proves that six colours are always enough.")}
      </Lead>

      <Goals t={t} id="mPlan" items={[
        "Say what a planar graph and its faces are, and prove V − E + F = 2.",
        "Use E ≤ 3V − 6 to prove that K₅ and K₃,₃ are not planar.",
        "Colour the vertices of a graph and find its chromatic number in simple cases.",
        "Prove that every planar graph can be coloured with six colours, and know the four colour theorem.",
      ]} />

      <H2>{tx(t, "mPlan_defTitle", "Planar graphs and faces")}</H2>
      <p>
        {tx(t, "mPlan_defBody",
          "A graph is planar if it can be drawn in the plane with no two edges crossing (edges may only meet at the vertices they share). Such a crossing-free drawing is a plane drawing. Being planar is about the graph, not about one picture: K₄ drawn as a square with both diagonals has a crossing, but moving one corner into the middle of the triangle formed by the other three removes it, so K₄ is planar.")}
      </p>
      <p>
        {tx(t, "mPlan_faceBody",
          "A plane drawing cuts the paper into regions called faces. One of them is unbounded: the outer face, everything around the drawing. It counts as a face. A tree has only that one face; a cycle has two, inside and outside. In the figure, untangle the cube: its flat drawing has 6 faces, five shaded inside plus the outside, just as the solid cube has 6 sides.")}
      </p>

      <H2>{tx(t, "mPlan_eulTitle", "Euler's formula")}</H2>
      <Equation label={tx(t, "mPlan_eqEuler", "Euler's formula for plane graphs")}
        where={[
          [r`V`, tx(t, "mPlan_wV", "the number of vertices")],
          [r`E`, tx(t, "mPlan_wE", "the number of edges")],
          [r`F`, tx(t, "mPlan_wF", "the number of faces of a plane drawing, the outer face included")],
        ]}
        note={tx(t, "mPlan_eulNote", "For a connected graph. A plane drawing with c pieces has V − E + F = 1 + c, because the pieces share one outer face.")}
        words={tx(t, "mPlan_eulWords", "In any crossing-free drawing of a connected graph, the vertices minus the edges plus the faces always come to 2, however it is drawn.")}>
        {r`V - E + F = 2`}
      </Equation>
      <Derivation t={t} label={tx(t, "mPlan_eqEulDer", "Why V − E + F = 2: build the drawing edge by edge")}
        steps={[
          { full: true, tex: r`\text{spanning tree: } E = V - 1,\ F = 1 \;\Rightarrow\; V - (V - 1) + 1 = 2`, why: tx(t, "mPlan_e1", "start with a spanning tree of the drawing (trees chapter): V − 1 edges and only the outer face") },
          { full: true, tex: r`\text{add an edge } uv \text{ of the graph that is not in the tree}`, why: tx(t, "mPlan_e2", "u and v are already joined in the tree, so the new edge closes a cycle") },
          { full: true, tex: r`E \to E + 1, \qquad F \to F + 1`, why: tx(t, "mPlan_e3", "a closed loop in the plane splits the face it runs through into two: inside and outside of the cycle") },
          { full: true, tex: r`V - (E + 1) + (F + 1) = V - E + F = \green{2}`, why: tx(t, "mPlan_e4", "the two changes cancel, so the value 2 survives every added edge, until the whole graph is drawn") },
        ]} />
      <p>
        {tx(t, "mPlan_eulBody",
          "The second step uses a fact that is obvious to the eye and hard to prove carefully: a closed curve without self-crossings splits the plane into an inside and an outside (the Jordan curve theorem). We take it as given. Since every convex polyhedron can be flattened into a plane drawing (look through one face and see the rest of it inside), the formula holds for polyhedra too: corners − edges + faces = 2.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPlan_tSolid", "Solid"), "V", "E", "F", "V − E + F"]}
        rows={[
          [tx(t, "mPlan_tet", "tetrahedron"), "4", "6", "4", "2"],
          [tx(t, "mPlan_cube", "cube"), "8", "12", "6", "2"],
          [tx(t, "mPlan_oct", "octahedron"), "6", "12", "8", "2"],
          [tx(t, "mPlan_dod", "dodecahedron"), "20", "30", "12", "2"],
          [tx(t, "mPlan_ico", "icosahedron"), "12", "30", "20", "2"],
          [tx(t, "mPlan_prism", "triangular prism"), "6", "9", "5", "2"],
        ]}
      />

      <PlanarFigure t={t} />

      <H3>{tx(t, "mPlan_platoTitle", "Why there are only five regular solids")}</H3>
      <p>
        {tx(t, "mPlan_platoBody",
          "A regular solid has the same regular polygon, with p sides, for every face, and the same number q of faces meeting at every corner, with p ≥ 3 and q ≥ 3. Count edges twice: every face has p edges and every edge borders 2 faces, so pF = 2E; every corner has q edges and every edge has 2 corners, so qV = 2E. Put V = 2E/q and F = 2E/p into Euler's formula.")}
      </p>
      <Derivation t={t} label={tx(t, "mPlan_eqPlato", "The five Platonic solids")}
        steps={[
          { tex: r`\frac{2E}{q} - E + \frac{2E}{p} = 2`, why: tx(t, "mPlan_p1", "Euler's formula with V and F written through E") },
          { tex: r`\frac{1}{q} + \frac{1}{p} = \frac12 + \frac1E > \frac12`, why: tx(t, "mPlan_p2", "divide by 2E and rearrange; 1/E is positive") },
          { tex: r`(p, q) \in \{(3,3), (3,4), (4,3), (3,5), (5,3)\}`, why: tx(t, "mPlan_p3", "with p, q ≥ 3 only these pairs pass: (3, 6) or (4, 4) give exactly 1/2, larger ones less") },
          { tex: r`\green{\text{tetrahedron, octahedron, cube, icosahedron, dodecahedron}}`, why: tx(t, "mPlan_p4", "one solid for each pair: triangles 3, 4 or 5 at a corner, squares 3 at a corner, pentagons 3 at a corner") },
        ]} />

      <H2>{tx(t, "mPlan_boundTitle", "Too many edges: K₅ and K₃,₃")}</H2>
      <p>
        {tx(t, "mPlan_boundBody",
          "Euler's formula limits how many edges a planar graph can have. In a simple graph with at least 3 vertices, every face of a plane drawing is bordered by at least 3 edges (a face bounded by 2 edges would need parallel edges, by 1 a loop). Every edge borders at most 2 faces.")}
      </p>
      <Derivation t={t} label={tx(t, "mPlan_eqBound", "A simple planar graph has E ≤ 3V − 6")}
        steps={[
          { full: true, tex: r`3F \le \sum_{\text{faces}} (\text{edges around the face}) \le 2E`, why: tx(t, "mPlan_b1", "count (face, edge) pairs: at least 3 per face, at most 2 per edge") },
          { full: true, tex: r`F \le \tfrac{2}{3}E`, why: tx(t, "mPlan_b2", "divide by 3") },
          { full: true, tex: r`2 = V - E + F \le V - E + \tfrac23 E = V - \tfrac13 E`, why: tx(t, "mPlan_b3", "put the bound into Euler's formula (connected case; extra pieces only make it easier)") },
          { full: true, tex: r`\green{E \le 3V - 6}`, why: tx(t, "mPlan_b4", "multiply by 3 and rearrange") },
        ]} />
      <p>
        {tx(t, "mPlan_k5Body",
          "K₅ has V = 5 and E = 10, but 3 · 5 − 6 = 9. Too many edges: K₅ is not planar. K₃,₃ has V = 6 and E = 9 ≤ 12, so the bound allows it, but K₃,₃ has no triangles (it is bipartite: any cycle alternates sides, so it has even length). Then every face has at least 4 edges, the same argument gives 4F ≤ 2E and E ≤ 2V − 4 = 8 < 9. Not planar either. This is the old puzzle of joining three houses to water, gas and electricity without any pipes crossing: impossible.")}
      </p>
      <LiveFormula label={tx(t, "mPlan_liveK", "Try it: which complete graphs pass the test?")}
        tex={r`E(K_n) = \frac{n(n-1)}{2} \;\le\; 3n - 6\ ?`}
        vars={[{ id: "n", label: "n", min: 3, max: 10, step: 1, value: 5, fmt: v => String(v) }]}
        compute={boundNumbers(t)}
        note={tx(t, "mPlan_liveKNote", "K₃ and K₄ pass (and are planar); from K₅ on, the edges grow like n² and the bound only like 3n.")} />
      <Callout type="info" t={t}>
        {tx(t, "mPlan_kurTip", "Kuratowski's theorem (1930) says these two are the only obstacles: a graph is planar exactly when it does not contain a copy of K₅ or K₃,₃, allowing their edges to be subdivided by extra vertices along them. Petersen's graph is not planar because it hides a subdivided K₃,₃.")}
      </Callout>
      <p>
        {tx(t, "mPlan_deg5Body",
          "One more consequence will be needed below. The average degree of a planar graph is 2E/V ≤ 2(3V − 6)/V = 6 − 12/V, which is less than 6. An average below 6 means some vertex is below 6: every planar graph has a vertex of degree at most 5.")}
      </p>

      <H2>{tx(t, "mPlan_colTitle", "Colouring the vertices")}</H2>
      <p>
        {tx(t, "mPlan_colBody",
          "A colouring gives each vertex a colour so that the two ends of every edge get different colours. The chromatic number χ(G) (χ is the Greek letter chi) is the fewest colours that a colouring of G can use. To show χ(G) = k you need two things: a colouring with k colours, and a reason why k − 1 cannot work.")}
      </p>
      <LessonTable
        headers={[tx(t, "mPlan_tGraph", "Graph"), "χ", tx(t, "mPlan_tReason", "Reason")]}
        rows={[
          [tx(t, "mPlan_c1", "no edges"), "1", tx(t, "mPlan_c1r", "nothing to keep apart")],
          [tx(t, "mPlan_c2", "tree, even cycle, Kₐ,ᵦ"), "2", tx(t, "mPlan_c2r", "bipartite: one colour per side")],
          [tx(t, "mPlan_c3", "odd cycle C₅, C₇, …"), "3", tx(t, "mPlan_c3r", "alternating two colours round an odd ring fails at the last vertex")],
          [tx(t, "mPlan_c4", "wheel W₅ (C₅ plus a hub)"), "4", tx(t, "mPlan_c4r", "the hub touches all five, which need 3 among themselves")],
          [tx(t, "mPlan_c5", "complete graph Kₙ"), "n", tx(t, "mPlan_c5r", "every pair touches, so all colours differ")],
          [tx(t, "mPlan_c6", "Petersen's graph"), "3", tx(t, "mPlan_c6r", "it contains a 5-cycle; a 3-colouring exists")],
        ]}
      />
      <p>
        {tx(t, "mPlan_bipBody",
          "Two colours suffice exactly when the graph is bipartite, and that happens exactly when it has no cycle of odd length. One direction is the odd cycle row of the table. For the other, in each piece pick a vertex and colour every vertex by whether its distance from it is even or odd. If an edge joined two vertices of the same parity, the two shortest paths to them plus that edge would contain an odd cycle.")}
      </p>
      <H3>{tx(t, "mPlan_greedyTitle", "Greedy colouring")}</H3>
      <p>
        {tx(t, "mPlan_greedyBody",
          "Go through the vertices in some order and give each one the first colour not already used by its coloured neighbours. If no vertex has more than Δ neighbours (Δ, delta, is the largest degree), at most Δ colours are blocked at each step, so one of the first Δ + 1 colours is always free: χ(G) ≤ Δ + 1. Greedy colouring is fast but not always best: the order matters, and a bad order can use many more colours than χ. Try \"greedy\" in the figure on different graphs.")}
      </p>

      <H2>{tx(t, "mPlan_mapTitle", "From maps to graphs")}</H2>
      <p>
        {tx(t, "mPlan_mapBody",
          "Colour a map so that countries sharing a border (more than a single point) get different colours. Put a vertex inside each country and join two vertices by an edge, drawn across their common border, when the countries are neighbours. The result is a planar graph, and colouring the map is the same as colouring this graph's vertices. So the map question becomes: how many colours does a planar graph need?")}
      </p>
      <Derivation t={t} label={tx(t, "mPlan_eqSix", "Every planar graph can be coloured with 6 colours")}
        steps={[
          { full: true, tex: r`V \le 6: \text{ one colour per vertex}`, why: tx(t, "mPlan_s1", "base case of an induction on the number of vertices") },
          { full: true, tex: r`G \text{ planar} \;\Rightarrow\; \exists\, v: \deg v \le 5`, why: tx(t, "mPlan_s2", "the consequence of E ≤ 3V − 6 above") },
          { full: true, tex: r`G - v \text{ is planar with } V - 1 \text{ vertices: 6-colour it}`, why: tx(t, "mPlan_s3", "removing a vertex keeps the drawing crossing-free; use the inductive hypothesis") },
          { full: true, tex: r`\green{v \text{ has at most 5 neighbours, so a 6th colour is free for it}}`, why: tx(t, "mPlan_s4", "put v back with a colour none of its neighbours uses") },
        ]} />
      <p>
        {tx(t, "mPlan_fourBody",
          "With more care the same idea gives five colours (Heawood, 1890). Four is harder. Francis Guthrie conjectured in 1852, while colouring the counties of England, that four colours always suffice. Many false proofs followed. In 1976 Kenneth Appel and Wolfgang Haken proved it by reducing it to 1 936 special configurations and checking each one by computer, the first major theorem proved that way. In 2005 Georges Gonthier checked the whole proof with a proof assistant, a program that verifies every logical step. Four cannot be lowered: the wheel W₅ and K₄ are planar and need four.")}
      </p>
      <Equation label={tx(t, "mPlan_eqFour", "The four colour theorem")}
        where={[
          [r`\chi(G)`, tx(t, "mPlan_wChi", "the chromatic number: the fewest colours with no edge joining two of the same colour")],
          [r`G \text{ planar}`, tx(t, "mPlan_wPlanar", "G can be drawn with no crossings, such as the graph of a map")],
        ]}
        words={tx(t, "mPlan_fourWords", "Four colours are always enough to colour any map so that neighbouring countries differ.")}>
        {r`G \text{ planar} \;\Longrightarrow\; \chi(G) \le 4`}
      </Equation>

      <H2>{tx(t, "mPlan_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mPlan_ex1", "1. A connected plane graph has 12 vertices, all of degree 3. Edges: 12 · 3 / 2 = 18. Faces: F = 2 − 12 + 18 = 8.")}</p>
      <p>{tx(t, "mPlan_ex2", "2. A simple planar graph has 9 vertices. At most 3 · 9 − 6 = 21 edges. If it has no triangles, at most 2 · 9 − 4 = 14.")}</p>
      <p>{tx(t, "mPlan_ex3", "3. A soccer ball has 12 pentagons and 20 hexagons: F = 32. Edges: (12 · 5 + 20 · 6)/2 = 90. Corners: V = 2 + E − F = 60.")}</p>
      <p>{tx(t, "mPlan_ex4", "4. χ(C₇) = 3, χ(K₃,₅) = 2, χ(K₆) = 6; K₆ is not planar (15 > 12), so it does not contradict the four colour theorem.")}</p>

      <MathPracticeFigure t={t} set="planar" />

      <H2>{tx(t, "mPlan_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mPlan_tWrong", "Wrong"), tx(t, "mPlan_tRight", "Right"), tx(t, "mPlan_tWhy", "Why")]}
        rows={[
          [tx(t, "mPlan_m1w", "forgetting the outer face"), "F = 2 − V + E", tx(t, "mPlan_m1", "the unbounded region counts; a tree has F = 1")],
          [tx(t, "mPlan_m2w", "E ≤ 3V − 6 ⇒ planar"), tx(t, "mPlan_m2r", "only non-planar when it fails"), tx(t, "mPlan_m2", "K₃,₃ passes the bound and is not planar")],
          [tx(t, "mPlan_m3w", "a crossing in one drawing ⇒ not planar"), tx(t, "mPlan_m3r", "some drawing may avoid it"), tx(t, "mPlan_m3", "K₄ as a square with diagonals")],
          [tx(t, "mPlan_m4w", "greedy gives χ"), tx(t, "mPlan_m4r", "greedy gives an upper bound"), tx(t, "mPlan_m4", "a bad order uses more colours than needed")],
          [tx(t, "mPlan_m5w", "planar ⇒ 3 colours"), tx(t, "mPlan_m5r", "4 may be needed"), tx(t, "mPlan_m5", "K₄ and W₅ are planar with χ = 4")],
        ]}
      />

      <KeyIdeas t={t} id="mPlan" items={[
        "A planar graph can be drawn without crossings; its drawing cuts the plane into faces, the outer one included.",
        "Euler's formula: V − E + F = 2 for every connected plane drawing (adding an edge to a tree adds one face).",
        "It gives E ≤ 3V − 6 for simple planar graphs, E ≤ 2V − 4 without triangles: K₅ and K₃,₃ are not planar.",
        "Only five regular solids exist, because 1/p + 1/q > 1/2 has only five solutions with p, q ≥ 3.",
        "χ(G) is the fewest colours keeping neighbours different; χ ≤ 2 exactly when there is no odd cycle; greedy gives χ ≤ Δ + 1.",
        "Every planar graph has a vertex of degree ≤ 5, which proves six colours suffice; four suffice (Appel and Haken, 1976).",
      ]} />
    </Article>
  );
}
