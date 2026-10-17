"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Row, Readout, C } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { components, pathIn, unionFind, type Graph } from "./graph/graphModel";
import { GraphView } from "./graph/GraphView";
import { PRESETS } from "./graph/presets";
import { spanningCount } from "./graph/treeModel";

// ── What this figure shows ────────────────────────────────────────────────────
// Choose edges of a graph, one tap at a time, to build a spanning tree: a
// set of edges that reaches every vertex and contains no cycle. Vertices are
// coloured by the piece (component) they belong to among the chosen edges, so
// each good edge visibly merges two colours into one. An edge whose ends are
// already in the same piece would close a cycle: it is refused, and the cycle
// it would make lights up in red. "Break it" lets such edges in, and the
// count shows that a tree on V vertices can never have more than V − 1
// edges. The total number of spanning trees comes from Kirchhoff's
// matrix-tree theorem; the figure counts the different ones you have found.

const PALETTE = [C.sky, C.amber, C.purple, C.pink, C.teal, C.orange, C.blue, C.red, "#84cc16", "#64748b"];
const grid = (): Graph => {
  const pts = Array.from({ length: 9 }, (_, i) => ({ x: 170 + (i % 3) * 110, y: 50 + Math.floor(i / 3) * 100 }));
  const edges: [number, number][] = [];
  for (let i = 0; i < 9; i++) { if (i % 3 < 2) edges.push([i, i + 1]); if (i < 6) edges.push([i, i + 3]); }
  return { pts, edges };
};
const LIST = { k4: PRESETS.k4, house: PRESETS.house, grid, octahedron: PRESETS.octahedron, petersen: PRESETS.petersen } as const;
type Id = keyof typeof LIST;
const NAMES: Record<Id, string> = { k4: "K₄", house: "⌂", grid: "3 × 3", octahedron: "octa", petersen: "Petersen" };

export function SpanningTreeFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<Id>("k4");
  const [g, setG] = useState<Graph>(LIST.k4);
  const [chosen, setChosen] = useState<number[]>([]);
  const [blocked, setBlocked] = useState<{ e: number; path: number[] } | null>(null);
  const [allow, setAllow] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const lab = useLab("math-trees");

  const V = g.pts.length, k = chosen.length;
  const sub: Graph = { pts: g.pts, edges: chosen.map(e => g.edges[e]) };
  const { comp, count } = components(sub);
  const cycles = k - V + count;                       // independent cycles among the chosen edges
  const isTree = count === 1 && k === V - 1;
  const total = spanningCount(g);
  const deg = g.pts.map((_, v) => chosen.filter(e => g.edges[e][0] === v || g.edges[e][1] === v).length);
  const leaves = deg.filter(d => d === 1).length;
  const key = (es: number[]) => [...es].sort((a, b) => a - b).join(",");

  const record = (es: number[]) => {
    const s: Graph = { pts: g.pts, edges: es.map(e => g.edges[e]) };
    if (es.length === V - 1 && components(s).count === 1) setFound(f => (f.includes(key(es)) ? f : [...f, key(es)]));
  };
  const load = (k2: Id) => { setId(k2); setG(LIST[k2]()); setChosen([]); setBlocked(null); setFound([]); };
  const tap = (e: number) => {
    setBlocked(null);
    if (chosen.includes(e)) { setChosen(c => c.filter(x => x !== e)); return; }
    const [a, b] = g.edges[e];
    const path = pathIn(g, chosen, a, b);
    if (path && !allow) { setBlocked({ e, path }); return; }
    const next = [...chosen, e];
    setChosen(next);
    record(next);
  };
  const random = () => {
    const order = g.edges.map((_, i) => i).sort(() => Math.random() - 0.5);
    const uf = unionFind(V), es: number[] = [];
    for (const e of order) if (uf.join(g.edges[e][0], g.edges[e][1])) es.push(e);
    setBlocked(null); setChosen(es); record(es);
  };

  const red = new Set(blocked ? [blocked.e, ...blocked.path] : []);
  const view = (
    <GraphView g={g} setG={h => setG(h)} tool="move" onEdge={tap}
      vColor={i => PALETTE[comp[i] % PALETTE.length]}
      vSub={i => (k ? String(deg[i]) : undefined)}
      eColor={i => (red.has(i) ? C.red : chosen.includes(i) ? C.green : C.muted)}
      eWidth={i => (chosen.includes(i) || red.has(i) ? 3.6 : 1.6)}
      eDash={i => (chosen.includes(i) || red.has(i) ? undefined : "5 4")} />
  );
  const controls = <>
    <Row>
      {(Object.keys(LIST) as Id[]).map(k2 => <Btn key={k2} active={id === k2} onClick={() => load(k2)}>{NAMES[k2]}</Btn>)}
    </Row>
    <Row>
      <Btn onClick={random}>{tx(t, "figSpan_random", "random tree")}</Btn>
      <Btn onClick={() => { setChosen([]); setBlocked(null); }}>{tx(t, "figSpan_clear", "clear")}</Btn>
      <Btn active={allow} onClick={() => { setAllow(v => !v); setBlocked(null); }}>{tx(t, "figSpan_break", "break it: allow cycles")}</Btn>
    </Row>
    <Row>
      <Readout color={isTree ? C.green : undefined}>{fill(tx(t, "figSpan_edges", "chosen edges: {k}  (V − 1 = {v})"), { k, v: V - 1 })}</Readout>
      <Readout>{fill(tx(t, "figSpan_pieces", "pieces: {c}"), { c: count })}</Readout>
      {cycles > 0 && <Readout color={C.red}>{fill(tx(t, "figSpan_cycles", "cycles closed: {c}"), { c: cycles })}</Readout>}
    </Row>
    <Row>
      <Readout color={isTree ? C.green : C.muted}>{isTree
        ? fill(tx(t, "figSpan_tree", "a spanning tree, with {l} leaves"), { l: leaves })
        : blocked ? tx(t, "figSpan_refused", "refused: its ends are already connected, so it would close the red cycle")
        : tx(t, "figSpan_building", "tap edges to choose them")}</Readout>
      <Readout color={C.purple}>{fill(tx(t, "figSpan_found", "different trees found: {f} of {n}"), { f: found.length, n: total })}</Readout>
    </Row>
  </>;
  const note = tx(t, "figSpan_note", "Tap an edge to choose it (green) and tap again to drop it. Each colour is one piece of the chosen edges; a good edge joins two pieces into one. An edge between two vertices of the same colour would close a cycle, so it is refused and the cycle shows in red. You can drag the vertices. The purple readout counts the different spanning trees you have built against the total that the graph has.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figSpanL1_t", "Join the pieces"),
      body: <>
        <p>{tx(t, "figSpanL1_b1", "Each vertex starts as its own piece, in its own colour. Tap an edge: two colours become one.")}</p>
        <p>{tx(t, "figSpanL1_b2", "Keep going until everything is one colour.")}</p>
      </>,
      goal: { text: tx(t, "figSpanL1_g", "A spanning tree of K₄."), done: id === "k4" && isTree },
      setup: () => { load("k4"); setAllow(false); },
    },
    {
      title: tx(t, "figSpanL2_t", "Quick check"),
      body: <p>{tx(t, "figSpanL2_b", "Each chosen edge merged two pieces, starting from 4 pieces and ending with 1.")}</p>,
      quiz: {
        q: tx(t, "figSpanL2_q", "How many edges does a spanning tree of a graph with 9 vertices have?"),
        options: ["8", "9", "12", tx(t, "figSpanL2_o4", "it depends on the graph")],
        answer: 0,
        why: tx(t, "figSpanL2_w", "Every edge of a tree joins two pieces, so going from 9 pieces to 1 takes exactly 8 edges, whatever the graph."),
      },
    },
    {
      title: tx(t, "figSpanL3_t", "A refused edge"),
      body: <p>{tx(t, "figSpanL3_b", "Now tap an edge whose two ends already have the same colour.")}</p>,
      goal: { text: tx(t, "figSpanL3_g", "A cycle shown in red."), done: blocked !== null },
      hint: tx(t, "figSpanL3_h", "Any edge not yet chosen will do once the tree is complete."),
    },
    {
      title: tx(t, "figSpanL4_t", "Many trees"),
      body: <p>{tx(t, "figSpanL4_b", "K₄ has 16 spanning trees. Build three different ones: drop edges and choose others.")}</p>,
      goal: { text: tx(t, "figSpanL4_g", "Three different spanning trees of K₄."), done: id === "k4" && found.length >= 3 },
      hint: tx(t, "figSpanL4_h", "\"random tree\" also counts. A star (one centre joined to all) and a path are two kinds."),
    },
    {
      title: tx(t, "figSpanL5_t", "Break it"),
      body: <p>{tx(t, "figSpanL5_b", "Turn on \"allow cycles\" and add one more edge to a finished tree.")}</p>,
      goal: { text: tx(t, "figSpanL5_g", "V edges: exactly one cycle appears."), done: allow && count === 1 && k === V && cycles === 1 },
    },
    {
      title: tx(t, "figSpanL6_t", "Leaves"),
      body: <p>{tx(t, "figSpanL6_b", "Load the 3 × 3 grid, turn cycles off, and build a spanning tree that is one long path.")}</p>,
      goal: { text: tx(t, "figSpanL6_g", "A spanning tree of the grid with exactly 2 leaves."), done: id === "grid" && isTree && leaves === 2 },
      hint: tx(t, "figSpanL6_h", "Snake along the rows: left to right, down, right to left, down, …"),
      setup: () => { load("grid"); setAllow(false); },
    },
    {
      title: tx(t, "figSpanL7_t", "Quick check"),
      body: <p>{tx(t, "figSpanL7_b", "Every tree with at least 2 vertices has at least 2 leaves.")}</p>,
      quiz: {
        q: tx(t, "figSpanL7_q", "A tree has 7 vertices: one of degree 4 and the others of degree 1 or 2. How many leaves?"),
        options: ["4", "2", "3", "6"],
        answer: 0,
        why: tx(t, "figSpanL7_w", "The degrees add up to 2 · 6 = 12. With L leaves: 4 + L + 2(6 − L) = 12, so L = 4."),
      },
    },
  ];

  const insights: Insight[] = [
    {
      id: "tree", tone: "ok", when: isTree,
      title: tx(t, "figSpanI1_t", "V − 1 edges, one piece, no cycle"),
      body: tx(t, "figSpanI1_b", "Any two of these three facts force the third. Removing any green edge splits the tree in two; adding any other edge closes exactly one cycle."),
    },
    {
      id: "cycle", tone: "warn", when: cycles > 0,
      title: tx(t, "figSpanI2_t", "No longer a tree"),
      body: fill(tx(t, "figSpanI2_b", "{k} edges on {v} vertices in {c} piece(s): each edge beyond V − (pieces) closes one more cycle."), { k, v: V, c: count }),
    },
    {
      id: "count", tone: "info", when: id === "k4",
      title: tx(t, "figSpanI3_t", "Cayley's count"),
      body: tx(t, "figSpanI3_b", "K₄ has 4² = 16 spanning trees. In general Kₙ has nⁿ⁻² of them: Cayley's formula, proved later in the chapter with Prüfer codes."),
    },
  ];

  const title = tx(t, "figSpan_title", "Build a spanning tree");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<LabButton lab={lab} t={t} />} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view} controls={controls}
        recap={[
          tx(t, "figSpanR1", "A tree is connected and has no cycle; a spanning tree of a graph uses all its vertices."),
          tx(t, "figSpanR2", "Every edge of a tree joins two separate pieces, so a tree on V vertices has exactly V − 1 edges."),
          tx(t, "figSpanR3", "One more edge always closes exactly one cycle; removing any edge disconnects it."),
          tx(t, "figSpanR4", "A graph can have many spanning trees: Kₙ has nⁿ⁻²."),
        ]}
      />
    </>
  );
}
