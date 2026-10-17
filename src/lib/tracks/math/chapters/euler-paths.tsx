"use client";

// Discrete Mathematics 2: Euler and Hamilton — the bridges of Königsberg as a
// multigraph; trails and circuits; Euler's theorem (necessity from "in and
// out", sufficiency by Hierholzer's splicing); drawing figures in one stroke;
// adding edges to make a route possible (the route-inspection idea); then
// Hamilton paths and cycles: the dodecahedron puzzle, counting the cycles of
// Kₙ, Dirac's sufficient condition, Petersen's graph, and the contrast
// between the two questions.

import { Callout, H2, H3, LessonTable } from "@/components/lesson/LessonComponents";
import { Equation } from "@/components/lesson/Tex";
import { Derivation } from "@/components/lesson/Derivation";
import { LiveFormula } from "@/components/lesson/LiveFormula";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { KeyIdeas, Article, Lead, Goals } from "@/components/lesson/Prose";
import { EulerFigure } from "@/components/lesson/figures/math/EulerFigure";
import { MathPracticeFigure } from "@/components/lesson/figures/math/MathPracticeFigure";

const r = String.raw;

// ── Live formula: Hamilton cycles in Kₙ ───────────────────────────────────────

function hamNumbers(v: Record<string, number>) {
  const n = v.n;
  let f = 1;
  for (let i = 2; i <= n - 1; i++) f *= i;
  const big = (x: number) => x.toLocaleString("en-US").replace(/,/g, r`\,`);
  return {
    tex: r`\frac{(${n}-1)!}{2} = \frac{${big(f)}}{2} = \green{${big(f / 2)}}`,
  };
}

export function EulerPathsContent({ t }: { t: TrackTranslations }) {
  return (
    <Article>
      <Lead>
        {tx(t, "mEul_intro",
          "In the 1730s the city of Königsberg had seven bridges joining two river banks and two islands, and its people wondered whether a walk could cross every bridge exactly once. Nobody found one, and nobody could prove there was none, until Leonhard Euler did in 1736. His argument ignored the map, the distances and the shape of the land, and kept only which land touched which bridge: it was the first theorem of graph theory. This chapter proves it, uses it to draw figures in one stroke, and then asks the question that sounds almost the same and is much harder: a walk through every vertex once.")}
      </Lead>

      <Goals t={t} id="mEul" items={[
        "Model a route problem as a graph and say what a trail and a circuit are.",
        "State Euler's theorem and prove why the degrees decide it.",
        "Find an Euler trail by hand, starting at the right vertex.",
        "Tell Euler's question from Hamilton's, and use the sufficient condition of Dirac.",
      ]} />

      <H2>{tx(t, "mEul_kbTitle", "The bridges of Königsberg")}</H2>
      <p>
        {tx(t, "mEul_kbBody",
          "Make each piece of land a vertex: A the north bank, C the south bank, B the island between them, D the island to the east. Make each bridge an edge between the two pieces of land it joins. A and B are joined by two bridges, B and C by two, and A, B and C each by one bridge to D: seven edges. Two vertices joined by more than one edge are parallel edges, so this is a multigraph, a graph that allows them. The degrees are deg A = 3, deg B = 5, deg C = 3, deg D = 3. Check with the handshake lemma: 3 + 5 + 3 + 3 = 14 = 2 · 7.")}
      </p>
      <LessonTable
        headers={[tx(t, "mEul_tWord", "Word"), tx(t, "mEul_tMeans", "Meaning")]}
        rows={[
          [tx(t, "mEul_w1", "trail"), tx(t, "mEul_w1m", "a walk that never uses the same edge twice (vertices may repeat)")],
          [tx(t, "mEul_w2", "circuit"), tx(t, "mEul_w2m", "a trail that ends at the vertex where it started")],
          [tx(t, "mEul_w3", "Euler trail"), tx(t, "mEul_w3m", "a trail that uses every edge of the graph exactly once")],
          [tx(t, "mEul_w4", "Euler circuit"), tx(t, "mEul_w4m", "an Euler trail that is also a circuit")],
        ]}
      />

      <H2>{tx(t, "mEul_whyTitle", "Why the degrees decide")}</H2>
      <p>
        {tx(t, "mEul_whyBody",
          "Follow an Euler trail and watch one vertex v that is neither its start nor its end. Every time the trail arrives at v along one edge, it must leave along another edge, and it never reuses an edge. So the edges at v are used up in pairs: one in, one out. Since the trail uses all of them, deg v is even. The start is different: the trail leaves it once without arriving first. The end is also different: the trail arrives once without leaving. If start and end are the same vertex, those two unpaired edges pair up with each other.")}
      </p>
      <Derivation t={t} label={tx(t, "mEul_eqNec", "What an Euler trail forces on the degrees")}
        steps={[
          { full: true, tex: r`\deg v = 2 \times (\text{number of times the trail passes through } v)`, why: tx(t, "mEul_n1", "for a vertex in the middle of the trail: each pass uses one edge in and one edge out") },
          { full: true, tex: r`\deg(\text{start}) = 1 + 2(\ldots), \qquad \deg(\text{end}) = 2(\ldots) + 1`, why: tx(t, "mEul_n2", "the start has one extra edge out, the end one extra edge in: both odd, if they differ") },
          { full: true, tex: r`\text{start} = \text{end} \;\Rightarrow\; \deg = 1 + 2(\ldots) + 1 = \text{even}`, why: tx(t, "mEul_n3", "for a circuit the two extra edges belong to the same vertex") },
          { full: true, tex: r`\green{\text{circuit: no odd vertex} \qquad \text{trail: exactly 2 odd vertices, its two ends}}`, why: tx(t, "mEul_n4", "so the number of odd vertices must be 0 or 2") },
        ]} />
      <p>
        {tx(t, "mEul_kbNo",
          "Königsberg has four odd vertices. So no walk crosses every bridge exactly once, wherever it starts. That was Euler's answer, and the argument works for every graph at once, which is what made it mathematics rather than a puzzle.")}
      </p>

      <H2>{tx(t, "mEul_thmTitle", "Euler's theorem")}</H2>
      <p>
        {tx(t, "mEul_thmBody",
          "The condition on the degrees is also enough, as long as the graph is connected (ignoring vertices with no edges, which a trail never needs to visit). Euler stated this; Carl Hierholzer published the first full proof in 1873.")}
      </p>
      <Equation label={tx(t, "mEul_eqThm", "Euler's theorem")}
        where={[
          [r`G`, tx(t, "mEul_wG", "a connected graph or multigraph (every edge can be reached from every other)")],
          [r`\text{odd}(G)`, tx(t, "mEul_wOdd", "the number of vertices of odd degree; by the handshake lemma it is always even")],
        ]}
        words={tx(t, "mEul_thmWords", "If no vertex is odd you can go round every edge and come home; if exactly two are odd you can cover every edge going from one to the other; with more odd vertices it cannot be done.")}>
        {r`\begin{aligned} \text{Euler circuit} &\iff \text{odd}(G) = 0 \\ \text{Euler trail, not closed} &\iff \text{odd}(G) = 2 \end{aligned}`}
      </Equation>
      <H3>{tx(t, "mEul_hierTitle", "Why even degrees are enough: Hierholzer's splicing")}</H3>
      <p>
        {tx(t, "mEul_hierBody",
          "Suppose every degree is even. Start at any vertex s and walk along unused edges, anywhere, until you cannot continue. Where can you get stuck? Not at a vertex v other than s: each time you entered v you used one of its edges, each time you left you used another, so when you arrive there you have used an odd number of its edges, and an even degree leaves at least one unused. So you get stuck only at s: you have walked a circuit. If it used every edge, done. If not, some vertex u on the circuit still has unused edges, because the graph is connected. The unused edges also have even degrees at every vertex (each vertex lost an even number to the circuit), so walk again from u until you are stuck back at u: a second circuit. Splice it into the first one at u. Repeat until nothing is left. With exactly two odd vertices, add one imaginary edge between them, find the circuit, and remove the imaginary edge: what is left is a trail from one odd vertex to the other.")}
      </p>
      <Callout type="info" t={t}>
        {tx(t, "mEul_hierTip", "The play button in the figure below runs exactly this method. It starts at an odd vertex when there are two.")}
      </Callout>

      <EulerFigure t={t} />

      <H2>{tx(t, "mEul_strokeTitle", "Drawing in one stroke")}</H2>
      <p>
        {tx(t, "mEul_strokeBody",
          "\"Draw this figure without lifting the pen and without going over a line twice\" is the same question. The corners and crossing points are vertices, the lines are edges. The \"house\" (a square with both diagonals and a roof) has two corners of degree 3, the bottom ones, and every other degree even. So it can be drawn, and only by starting at one bottom corner and finishing at the other. Starting at the roof is doomed, however clever the rest of the drawing.")}
      </p>
      <Derivation t={t} label={tx(t, "mEul_eqHouse", "The house: where to start")}
        steps={[
          { tex: r`\deg = (3, 3, 4, 4, 2)`, why: tx(t, "mEul_h1", "the two bottom corners, the two top corners of the square, the roof tip") },
          { tex: r`\text{odd}(G) = 2`, why: tx(t, "mEul_h2", "only the bottom corners are odd") },
          { tex: r`\green{\text{start at one bottom corner, end at the other}}`, why: tx(t, "mEul_h3", "Euler's theorem: a trail exists, and its ends are the odd vertices") },
        ]} />

      <H3>{tx(t, "mEul_fixTitle", "Making a route possible")}</H3>
      <p>
        {tx(t, "mEul_fixBody",
          "When there are more than two odd vertices, some edges must be covered twice. Covering an edge twice is like adding a parallel copy of it. A new edge changes the degree of both of its ends by 1, so it can make two odd vertices even. With 2k odd vertices you need at least k extra edges, and k − 1 if you only need a trail, which may keep two odd ends. For Königsberg: four odd vertices, so one new bridge gives a trail and two give a circuit. Try it in the figure with \"draw edges\". Planning a route that covers every street (a postman, a snow plough) is this question with lengths attached, and is called the route inspection problem.")}
      </p>

      <H2>{tx(t, "mEul_hamTitle", "Hamilton: every vertex once")}</H2>
      <p>
        {tx(t, "mEul_hamBody",
          "Change one word: instead of every edge once, visit every vertex once. A Hamilton path is a path through all the vertices; a Hamilton cycle is a cycle through all of them, coming back to the start. The name comes from William Rowan Hamilton, who sold a puzzle in 1857 asking for such a cycle along the edges of a dodecahedron, the solid with 12 pentagon faces, 20 corners and 30 edges. It is in the figure: switch to Hamilton mode.")}
      </p>
      <p>
        {tx(t, "mEul_hamBody2",
          "The two questions sound alike and behave nothing alike. For Euler there is a quick test, counting odd degrees, and a quick method, Hierholzer's. For Hamilton nobody knows any quick test that works for every graph. Deciding it for a large graph seems to need trying very many routes, and finding a fast method, or proving there is none, is one of the great open problems of mathematics.")}
      </p>
      <LessonTable
        headers={["", tx(t, "mEul_tEuler", "Euler"), tx(t, "mEul_tHam", "Hamilton")]}
        rows={[
          [tx(t, "mEul_r1", "uses every"), tx(t, "mEul_r1e", "edge once"), tx(t, "mEul_r1h", "vertex once")],
          [tx(t, "mEul_r2", "may repeat"), tx(t, "mEul_r2e", "vertices"), tx(t, "mEul_r2h", "nothing (edges may be skipped)")],
          [tx(t, "mEul_r3", "exists when"), tx(t, "mEul_r3e", "connected, and 0 or 2 odd degrees"), tx(t, "mEul_r3h", "no simple test known")],
          [tx(t, "mEul_r4", "found by"), tx(t, "mEul_r4e", "Hierholzer's splicing, quickly"), tx(t, "mEul_r4h", "search, slowly in general")],
        ]}
      />

      <H3>{tx(t, "mEul_knTitle", "Counting Hamilton cycles in Kₙ")}</H3>
      <p>
        {tx(t, "mEul_knBody",
          "In the complete graph Kₙ every order of the vertices is a Hamilton cycle, since every pair is joined. Count them. Fix the starting vertex (a cycle has no real start, so choosing one does not lose anything): the other n − 1 vertices can follow in (n − 1)! orders. Each cycle is then counted twice, once in each direction round it. So Kₙ has (n − 1)!/2 Hamilton cycles. That number explodes, which is why \"try every order\" fails beyond small graphs.")}
      </p>
      <LiveFormula label={tx(t, "mEul_liveK", "Try it: Hamilton cycles in Kₙ")}
        tex={r`H(K_n) = \frac{(n-1)!}{2}`}
        vars={[{ id: "n", label: "n", min: 3, max: 16, step: 1, value: 5, fmt: v => String(v) }]}
        compute={hamNumbers}
        note={tx(t, "mEul_liveKNote", "K₃ has 1 (the triangle), K₄ has 3, K₅ has 12; K₁₀ already has 181 440 and K₁₆ more than 650 billion.")} />

      <H3>{tx(t, "mEul_diracTitle", "A sufficient condition: Dirac's theorem")}</H3>
      <p>
        {tx(t, "mEul_diracBody",
          "There are tests that work in one direction: they guarantee a Hamilton cycle when they hold, and say nothing when they fail. The best known is Dirac's (1952). The idea: when every vertex has many neighbours, there is no way to trap a walk.")}
      </p>
      <Equation label={tx(t, "mEul_eqDirac", "Dirac's theorem")}
        where={[
          [r`n`, tx(t, "mEul_wN", "the number of vertices; at least 3")],
          [r`\deg v \ge n/2`, tx(t, "mEul_wHalf", "every vertex is joined to at least half of the vertices")],
        ]}
        words={tx(t, "mEul_diracWords", "If every vertex is joined to at least half the others, a cycle through all of them exists.")}
        note={tx(t, "mEul_diracNote", "Only one direction: a cycle Cₙ is itself a Hamilton cycle with every degree 2, far below n/2.")}>
        {r`n \ge 3 \ \text{and}\ \deg v \ge \tfrac{n}{2} \text{ for every } v \;\Longrightarrow\; G \text{ has a Hamilton cycle}`}
      </Equation>
      <p>
        {tx(t, "mEul_petBody",
          "Petersen's graph shows how subtle the question is. It has 10 vertices, all of degree 3, and it looks very symmetric, yet it has a Hamilton path and no Hamilton cycle. Dirac's test does not apply (3 is less than 10/2), and indeed the cycle does not exist.")}
      </p>

      <H2>{tx(t, "mEul_exTitle", "Worked examples")}</H2>
      <p>{tx(t, "mEul_ex1", "1. K₅: every degree is 4, even, and it is connected, so it has an Euler circuit through all 10 edges. K₄: every degree is 3, four odd vertices, so no Euler trail at all.")}</p>
      <p>{tx(t, "mEul_ex2", "2. K₂,₄: the two vertices on the small side have degree 4, the four on the other side degree 2. All even: an Euler circuit. K₃,₃: all six degrees are 3: no trail.")}</p>
      <p>{tx(t, "mEul_ex3", "3. A connected graph has degrees 2, 2, 3, 3, 3, 3, 4. Four odd vertices: no trail; adding 2 edges (between the odd ones, in pairs) gives a circuit.")}</p>
      <p>{tx(t, "mEul_ex4", "4. A 6 × 6 chessboard of squares: the knight's tour (visit every square once with knight moves) is a Hamilton question on the graph whose vertices are the squares and whose edges are knight moves.")}</p>

      <MathPracticeFigure t={t} set="euler" />

      <H2>{tx(t, "mEul_mistakesTitle", "Common mistakes")}</H2>
      <LessonTable
        headers={[tx(t, "mEul_tWrong", "Wrong"), tx(t, "mEul_tRight", "Right"), tx(t, "mEul_tWhy", "Why")]}
        rows={[
          [tx(t, "mEul_m1w", "all degrees even ⇒ Euler circuit"), tx(t, "mEul_m1r", "also needs connected"), tx(t, "mEul_m1", "two separate triangles have even degrees and no circuit")],
          [tx(t, "mEul_m2w", "2 odd vertices: start anywhere"), tx(t, "mEul_m2r", "start at an odd vertex"), tx(t, "mEul_m2", "the trail's two ends are exactly the odd vertices")],
          [tx(t, "mEul_m3w", "Euler and Hamilton are the same"), tx(t, "mEul_m3r", "edges once vs vertices once"), tx(t, "mEul_m3", "K₄ has a Hamilton cycle and no Euler trail")],
          [tx(t, "mEul_m4w", "Dirac fails ⇒ no Hamilton cycle"), tx(t, "mEul_m4r", "Dirac only guarantees"), tx(t, "mEul_m4", "Cₙ is Hamiltonian with degrees 2")],
          [tx(t, "mEul_m5w", "Kₙ has (n − 1)! Hamilton cycles"), "(n − 1)!/2", tx(t, "mEul_m5", "each cycle is counted once in each direction")],
        ]}
      />

      <KeyIdeas t={t} id="mEul" items={[
        "An Euler trail uses every edge exactly once; an Euler circuit also returns to its start.",
        "Passing through a vertex uses two of its edges, so only the two ends of a trail can have odd degree.",
        "A connected graph has an Euler circuit iff no degree is odd, and an Euler trail iff exactly two are odd, starting at one of them.",
        "Hierholzer: walk until stuck (you are back at the start), then splice in circuits through the unused edges.",
        "Königsberg has four odd land masses: no walk crosses every bridge once.",
        "A Hamilton cycle visits every vertex once; no simple test is known. Kₙ has (n − 1)!/2 of them.",
        "Dirac: n ≥ 3 and every degree ≥ n/2 guarantee a Hamilton cycle, but not the other way round.",
      ]} />
    </Article>
  );
}
