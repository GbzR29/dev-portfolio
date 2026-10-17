"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { components, degrees, type Graph } from "./graph/graphModel";
import { GraphView, letter, type Tool } from "./graph/GraphView";
import { PRESETS, type PresetId } from "./graph/presets";

// ── What this figure shows ────────────────────────────────────────────────────
// A graph you build yourself: tap empty space for a vertex, drag from one
// vertex to another for an edge, erase with the eraser. Beside each vertex is
// its degree (the number of edge ends touching it); vertices of odd degree
// get an amber ring. The readouts add the degrees up: the sum is always twice
// the number of edges (each edge has two ends), so the odd vertices always
// come in pairs, whatever you draw. The adjacency matrix shows the same graph
// as a table of 0s and 1s whose row sums are the degrees.

const LIST: [PresetId, string][] = [
  ["empty", "5 × •"], ["path5", "P₅"], ["c6", "C₆"], ["twoTriangles", "C₃ + C₃"], ["k4", "K₄"], ["k33", "K₃,₃"], ["petersen", "Petersen"],
];

function Matrix({ g }: { g: Graph }) {
  const n = g.pts.length, d = degrees(g);
  const has = (i: number, j: number) => g.edges.filter(([a, b]) => (a === i && b === j) || (a === j && b === i)).length;
  if (n > 10) return null;
  return (
    <div className="px-3 pb-3 overflow-x-auto">
      <table className="mx-auto text-[11px] font-mono border-collapse">
        <thead>
          <tr>
            <th />
            {g.pts.map((_, j) => <th key={j} className="px-1.5 text-[var(--text-muted)] font-bold">{letter(j)}</th>)}
            <th className="pl-3 text-[#f59e0b]">Σ</th>
          </tr>
        </thead>
        <tbody>
          {g.pts.map((_, i) => (
            <tr key={i}>
              <th className="pr-1.5 text-[var(--text-muted)]">{letter(i)}</th>
              {g.pts.map((_, j) => {
                const v = has(i, j);
                return <td key={j} className="px-1.5 text-center" style={{ color: v ? C.sky : "var(--text-muted)", opacity: v ? 1 : 0.45, fontWeight: v ? 700 : 400 }}>{v}</td>;
              })}
              <td className="pl-3 text-center font-bold" style={{ color: d[i] % 2 ? C.amber : C.green }}>{d[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GraphDegreeFigure({ t }: { t?: TrackTranslations }) {
  const [g, setG] = useState<Graph>(PRESETS.k4);
  const [tool, setTool] = useState<Tool>("draw");
  const [matrix, setMatrix] = useState(false);
  const [preset, setPreset] = useState<PresetId>("k4");
  const lab = useLab("math-graphs");

  const d = degrees(g), E = g.edges.length, S = d.reduce((a, b) => a + b, 0);
  const odd = d.filter(k => k % 2).length, comps = components(g).count;
  const load = (id: PresetId) => { setPreset(id); setG(PRESETS[id]()); };

  const view = (
    <div>
      <GraphView g={g} setG={setG} tool={tool} maxV={10}
        vColor={() => C.sky}
        vRing={i => (d[i] % 2 ? C.amber : undefined)}
        vSub={i => String(d[i])} />
      {matrix && <Matrix g={g} />}
    </div>
  );
  const toolChoice = <Choice value={tool} onChange={setTool} options={[
    ["draw", tx(t, "figGrE_draw", "draw")], ["move", tx(t, "figGrE_move", "move")], ["erase", tx(t, "figGrE_erase", "erase")],
  ] as const} />;
  const controls = <>
    <Row>
      {LIST.map(([id, label]) => <Btn key={id} active={preset === id} onClick={() => load(id)}>{label}</Btn>)}
    </Row>
    <Row>
      <Btn active={matrix} onClick={() => setMatrix(v => !v)}>{tx(t, "figGrE_matrix", "adjacency matrix")}</Btn>
    </Row>
    <Row>
      <Readout>{`V = ${g.pts.length},  E = ${E}`}</Readout>
      <Readout color={C.green}>{`Σ deg = ${d.length ? d.join(" + ") : "0"} = ${S} = 2 · ${E}`}</Readout>
    </Row>
    <Row>
      <Readout color={C.amber}>{fill(tx(t, "figGrE_odd", "odd-degree vertices: {n}"), { n: odd })}</Readout>
      <Readout>{fill(tx(t, "figGrE_comps", "pieces (components): {n}"), { n: comps })}</Readout>
      <Readout>{fill(tx(t, "figGrE_seq", "degree sequence: {s}"), { s: [...d].sort((a, b) => b - a).join(", ") || "—" })}</Readout>
    </Row>
  </>;
  const note = tx(t, "figGrE_note", "Draw: tap empty space to add a vertex, drag from one vertex to another to add an edge. Move: drag vertices around; the graph does not change, only its picture. The number beside each vertex is its degree, and an amber ring marks an odd degree. Whatever you do, the sum of the degrees is twice the number of edges, and the amber rings come in pairs.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figGrEL1_t", "One edge, two ends"),
      body: <>
        <p>{tx(t, "figGrEL1_b1", "These five vertices have no edges, so every degree is 0.")}</p>
        <p>{tx(t, "figGrEL1_b2", "Drag from one vertex to another to draw an edge. Watch which numbers change.")}</p>
      </>,
      goal: { text: tx(t, "figGrEL1_g", "One edge: two degrees went up by 1, the sum by 2."), done: E >= 1 },
      hint: tx(t, "figGrEL1_h", "Press on a vertex, slide to another one, let go."),
      setup: () => { load("empty"); setTool("draw"); },
    },
    {
      title: tx(t, "figGrEL2_t", "The sum is twice the edges"),
      body: <p>{tx(t, "figGrEL2_b", "Keep drawing edges, anywhere you like, and keep an eye on the green readout.")}</p>,
      goal: { text: tx(t, "figGrEL2_g", "Five edges: the degrees add up to 10."), done: E >= 5 },
    },
    {
      title: tx(t, "figGrEL3_t", "Quick check"),
      body: <p>{tx(t, "figGrEL3_b", "You do not need the picture to count edges: the degrees are enough.")}</p>,
      quiz: {
        q: tx(t, "figGrEL3_q", "A graph has degrees 3, 3, 2, 2, 2. How many edges does it have?"),
        options: ["6", "12", "5", "3"],
        answer: 0,
        why: tx(t, "figGrEL3_w", "3 + 3 + 2 + 2 + 2 = 12 edge ends, and every edge has two: 12 / 2 = 6."),
      },
    },
    {
      title: tx(t, "figGrEL4_t", "Odd vertices come in pairs"),
      body: <>
        <p>{tx(t, "figGrEL4_b1", "This path has two odd vertices, its ends. Add edges until no vertex is odd.")}</p>
        <p>{tx(t, "figGrEL4_b2", "Notice that every new edge changes the number of amber rings by 0 or 2, never by 1.")}</p>
      </>,
      goal: { text: tx(t, "figGrEL4_g", "Every degree even."), done: preset === "path5" && E > 4 && odd === 0 },
      hint: tx(t, "figGrEL4_h", "Join the two ends of the path."),
      setup: () => { load("path5"); setTool("draw"); },
    },
    {
      title: tx(t, "figGrEL5_t", "Quick check"),
      body: <p>{tx(t, "figGrEL5_b", "Seven people meet, and each shakes hands with exactly three of the others.")}</p>,
      quiz: {
        q: tx(t, "figGrEL5_q", "Is that possible?"),
        options: [tx(t, "figGrEL5_o1", "No"), tx(t, "figGrEL5_o2", "Yes"), tx(t, "figGrEL5_o3", "Only if someone shakes hands twice")],
        answer: 0,
        why: tx(t, "figGrEL5_w", "The degrees would add up to 7 · 3 = 21, an odd number, but the sum must be twice the number of handshakes."),
      },
    },
    {
      title: tx(t, "figGrEL6_t", "Same degrees, different graphs"),
      body: <>
        <p>{tx(t, "figGrEL6_b1", "C₆ is a ring of six vertices: every degree is 2. Now load C₃ + C₃, two triangles: every degree is 2 again.")}</p>
        <p>{tx(t, "figGrEL6_b2", "Same number of vertices, same edges, same degrees, yet one is in one piece and the other in two.")}</p>
      </>,
      goal: { text: tx(t, "figGrEL6_g", "Two triangles loaded: 2 components."), done: preset === "twoTriangles" && comps === 2 },
      setup: () => { load("c6"); setTool("move"); },
    },
    {
      title: tx(t, "figGrEL7_t", "The graph as a table"),
      body: <p>{tx(t, "figGrEL7_b", "Load K₄ and open the adjacency matrix: a 1 in row A, column B means A and B are joined. Every row adds up to that vertex's degree, and the table is symmetric.")}</p>,
      goal: { text: tx(t, "figGrEL7_g", "K₄ with its matrix: every row sums to 3."), done: preset === "k4" && matrix },
      setup: () => { load("c6"); setMatrix(false); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "pairs", tone: "info", when: E > 0 && odd > 0,
      title: tx(t, "figGrEI1_t", "An even number of odd vertices"),
      body: fill(tx(t, "figGrEI1_b", "{n} vertices have odd degree. The even degrees add up to an even number, so the odd ones must too, and a sum of odd numbers is even only when there is an even count of them."), { n: odd }),
    },
    {
      id: "complete", tone: "ok", when: g.pts.length > 2 && E === (g.pts.length * (g.pts.length - 1)) / 2 && d.every(k => k === g.pts.length - 1),
      title: tx(t, "figGrEI2_t", "A complete graph"),
      body: fill(tx(t, "figGrEI2_b", "Every pair is joined: n = {n} vertices of degree n − 1, so the sum is n(n − 1) and there are n(n − 1)/2 = {e} edges."), { n: g.pts.length, e: E }),
    },
    {
      id: "split", tone: "info", when: comps > 1 && E > 0,
      title: tx(t, "figGrEI3_t", "More than one piece"),
      body: tx(t, "figGrEI3_b", "Some vertices cannot reach others along edges. Each piece is a component; the handshake count holds in each one separately."),
    },
  ];

  const title = tx(t, "figGrE_title", "Build a graph, add up the degrees");
  return (
    <>
      <Figure fullscreen={false} title={title}
        head={<>{toolChoice}<LabButton lab={lab} t={t} /></>}
        controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{toolChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figGrER1", "The degree of a vertex is the number of edge ends at it."),
          tx(t, "figGrER2", "Handshake lemma: the degrees add up to twice the number of edges."),
          tx(t, "figGrER3", "So the number of odd-degree vertices is always even."),
          tx(t, "figGrER4", "Equal degrees do not make two graphs the same: C₆ and two triangles differ."),
        ]}
      />
    </>
  );
}
