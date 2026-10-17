"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C } from "@/components/lesson/kit/figure";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { chromatic, clashes, complete, components, crossings, cycle, faces, greedy, ring, type Graph } from "./graph/graphModel";
import { GraphView } from "./graph/GraphView";
import { PRESETS } from "./graph/presets";

// ── What this figure shows ────────────────────────────────────────────────────
// Two questions about one graph. Untangle: drag the vertices until no two
// edges cross (crossing edges are red). Once the drawing is planar, its faces
// are found by walking round them and shaded, and the count checks Euler's
// formula V − E + F = 2. K₅ and K₃,₃ can never get below one crossing.
// Colour: tap a vertex to give it the next colour; an edge whose ends share a
// colour turns red. "Greedy" colours in order with the smallest free colour;
// χ is the fewest colours that work. "Break it: only 3 colours" shows the
// wheel with five spokes needs a fourth.

type Mode = "untangle" | "colour";
const W = 560, H = 300, CX = W / 2, CY = H / 2;
const COLOURS = [C.sky, C.amber, C.green, C.pink];
const FACE = [C.sky, C.amber, C.green, C.purple, C.pink, C.teal, C.orange, C.blue];

/** Place vertex i at ring position order[i]: a tangled drawing of a planar graph. */
const tangled = (edges: [number, number][], order: number[], r = 120): Graph => {
  const spots = ring(order.length, CX, CY, r);
  return { pts: order.map(k => spots[k]), edges };
};
const CUBE: [number, number][] = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
const wheel = (k: number): Graph => ({
  pts: [...ring(k, CX, CY, 120), { x: CX, y: CY }],
  edges: [...cycle(k), ...Array.from({ length: k }, (_, i) => [i, k] as [number, number])],
});

const LIST = {
  k4: (): Graph => ({ pts: ring(4, CX, CY, 110, Math.PI / 4), edges: complete(4) }),
  cube: (): Graph => tangled(CUBE, [0, 2, 1, 3, 5, 4, 6, 7]),
  octahedron: (): Graph => tangled(PRESETS.octahedron().edges, [0, 3, 1, 4, 2, 5], 125),
  k5: PRESETS.k5,
  k33: PRESETS.k33,
  wheel5: () => wheel(5),
  petersen: PRESETS.petersen,
} as const;
type Id = keyof typeof LIST;
const NAMES: Record<Id, string> = { k4: "K₄", cube: "cube", octahedron: "octa", k5: "K₅", k33: "K₃,₃", wheel5: "W₅", petersen: "Petersen" };

export function PlanarFigure({ t }: { t?: TrackTranslations }) {
  const [id, setId] = useState<Id>("cube");
  const [g, setG] = useState<Graph>(LIST.cube);
  const [mode, setMode] = useState<Mode>("untangle");
  const [col, setCol] = useState<number[]>(() => LIST.cube().pts.map(() => -1));
  const [three, setThree] = useState(false);
  const [showChi, setShowChi] = useState(false);
  const lab = useLab("math-planar");

  const V = g.pts.length, E = g.edges.length;
  const cr = crossings(g), connected = components(g).count === 1;
  const planarNow = cr.pairs === 0 && connected;
  const fc = planarNow ? faces(g) : null;
  const F = fc ? fc.cycles.length : 0;
  const bad = new Set(mode === "colour" ? clashes(g, col) : []);
  const used = new Set(col.filter(c => c >= 0)).size;
  const allColoured = col.every(c => c >= 0);
  const proper = allColoured && bad.size === 0;
  const chi = chromatic(g);

  const load = (k: Id) => { setId(k); const h = LIST[k](); setG(h); setCol(h.pts.map(() => -1)); setShowChi(false); };
  const pickMode = (m: Mode) => { setMode(m); };
  const tapVertex = (v: number) => {
    if (mode !== "colour") return;
    const max = three ? 3 : 4;
    setCol(cs => cs.map((c, i) => (i === v ? (c + 1 >= max ? -1 : c + 1) : c)));
  };

  const under = fc ? fc.cycles.map((cyc, i) => fc.outer.includes(i) ? null : (
    <polygon key={i} points={cyc.map(v => `${g.pts[v].x},${g.pts[v].y}`).join(" ")} fill={FACE[i % FACE.length]} opacity={0.13} />
  )) : null;

  const view = (
    <GraphView g={g} setG={setG} tool="move" onVertex={tapVertex}
      under={mode === "untangle" ? under : null}
      vColor={i => (mode === "colour" ? (col[i] >= 0 ? COLOURS[col[i]] : C.muted) : C.sky)}
      vText={() => ""}
      eColor={i => (mode === "untangle" ? (cr.bad.has(i) ? C.red : C.fg) : bad.has(i) ? C.red : C.muted)}
      eWidth={i => ((mode === "untangle" && cr.bad.has(i)) || bad.has(i) ? 2.8 : 1.8)} />
  );
  const modeChoice = <Choice value={mode} onChange={pickMode} options={[["untangle", tx(t, "figPlan_mUntangle", "untangle")], ["colour", tx(t, "figPlan_mColour", "colour")]] as const} />;
  const controls = <>
    <Row>
      {(Object.keys(LIST) as Id[]).map(k => <Btn key={k} active={id === k} onClick={() => load(k)}>{NAMES[k]}</Btn>)}
    </Row>
    {mode === "untangle" ? <>
      <Row>
        <Readout color={cr.pairs ? C.red : C.green}>{fill(tx(t, "figPlan_cross", "crossings: {c}"), { c: cr.pairs })}</Readout>
        <Readout>{`V = ${V},  E = ${E}`}</Readout>
        {planarNow && <Readout color={C.green}>{`F = ${F}:  V − E + F = ${V} − ${E} + ${F} = ${V - E + F}`}</Readout>}
      </Row>
      <Row>
        <Readout color={E > 3 * V - 6 ? C.red : C.muted}>{fill(tx(t, "figPlan_bound", "planar needs E ≤ 3V − 6 = {b}"), { b: 3 * V - 6 })}</Readout>
      </Row>
    </> : <>
      <Row>
        <Btn onClick={() => setCol(greedy(g))}>{tx(t, "figPlan_greedy", "greedy")}</Btn>
        <Btn onClick={() => setCol(g.pts.map(() => -1))}>{tx(t, "figPlan_clear", "clear")}</Btn>
        <Btn active={three} onClick={() => { setThree(v => !v); setCol(cs => cs.map(c => (c === 3 ? -1 : c))); }}>{tx(t, "figPlan_three", "break it: only 3 colours")}</Btn>
        <Btn active={showChi} onClick={() => setShowChi(v => !v)}>{tx(t, "figPlan_chi", "show χ")}</Btn>
      </Row>
      <Row>
        <Readout color={proper ? C.green : bad.size ? C.red : undefined}>{proper
          ? fill(tx(t, "figPlan_proper", "a proper colouring with {k} colours"), { k: used })
          : bad.size ? fill(tx(t, "figPlan_clash", "{k} edges join two vertices of the same colour"), { k: bad.size })
          : fill(tx(t, "figPlan_left", "{k} vertices still uncoloured"), { k: col.filter(c => c < 0).length })}</Readout>
        {showChi && <Readout color={C.purple}>{`χ = ${chi}`}</Readout>}
      </Row>
    </>}
  </>;
  const note = mode === "untangle"
    ? tx(t, "figPlan_note", "Drag the vertices until no edges cross; crossing edges are red. When the drawing is planar, the regions it cuts the plane into (the faces) are shaded, plus the outside region, which counts too. Try the cube and the octahedron, then try K₅ and K₃,₃: some crossing always remains.")
    : tx(t, "figPlan_noteC", "Tap a vertex to give it a colour (tap again for the next one). Neighbours must get different colours; a clash shows in red. \"Greedy\" colours the vertices in order, each with the first colour its neighbours do not use. χ, the chromatic number, is the fewest colours that work.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figPlanL1_t", "One crossing"),
      body: <p>{tx(t, "figPlanL1_b", "K₄ is drawn as a square with both diagonals, which cross. Move one vertex so that nothing crosses.")}</p>,
      goal: { text: tx(t, "figPlanL1_g", "K₄ with no crossing."), done: id === "k4" && mode === "untangle" && cr.pairs === 0 },
      hint: tx(t, "figPlanL1_h", "Drag one corner into the middle of the triangle formed by the other three."),
      setup: () => { load("k4"); setMode("untangle"); },
    },
    {
      title: tx(t, "figPlanL2_t", "Untangle the cube"),
      body: <p>{tx(t, "figPlanL2_b", "This tangle is the graph of a cube: 8 corners, 12 edges. Drag until no edge is red.")}</p>,
      goal: { text: tx(t, "figPlanL2_g", "The cube drawn flat: 6 faces, and 8 − 12 + 6 = 2."), done: id === "cube" && mode === "untangle" && planarNow },
      hint: tx(t, "figPlanL2_h", "Aim for a square inside a square, corners joined to corners."),
      setup: () => { load("cube"); setMode("untangle"); },
    },
    {
      title: tx(t, "figPlanL3_t", "Quick check"),
      body: <p>{tx(t, "figPlanL3_b", "Euler's formula holds for every connected planar drawing.")}</p>,
      quiz: {
        q: tx(t, "figPlanL3_q", "A connected planar graph has 10 vertices and 15 edges. How many faces does a planar drawing have?"),
        options: ["7", "5", "25", "3"],
        answer: 0,
        why: tx(t, "figPlanL3_w", "V − E + F = 2 gives F = 2 − 10 + 15 = 7, counting the outside face."),
      },
    },
    {
      title: tx(t, "figPlanL4_t", "K₅ will not untangle"),
      body: <p>{tx(t, "figPlanL4_b", "Five vertices, all joined. Get the crossings down as far as you can.")}</p>,
      goal: { text: tx(t, "figPlanL4_g", "K₅ with a single crossing left."), done: id === "k5" && mode === "untangle" && cr.pairs === 1 },
      hint: tx(t, "figPlanL4_h", "Start from the K₄ trick (one vertex inside a triangle) and place the fifth vertex where it crosses only one edge."),
      setup: () => { load("k5"); setMode("untangle"); },
    },
    {
      title: tx(t, "figPlanL5_t", "Quick check"),
      body: <p>{tx(t, "figPlanL5_b", "The red readout gives the reason, with no drawing needed.")}</p>,
      quiz: {
        q: tx(t, "figPlanL5_q", "Why can K₅ never be drawn without crossings?"),
        options: [tx(t, "figPlanL5_o1", "It has 10 edges, more than 3V − 6 = 9"), tx(t, "figPlanL5_o2", "It has an odd number of vertices"), tx(t, "figPlanL5_o3", "Every vertex has even degree")],
        answer: 0,
        why: tx(t, "figPlanL5_w", "In a planar drawing every face has at least 3 edges and every edge borders at most 2 faces, which forces E ≤ 3V − 6."),
      },
    },
    {
      title: tx(t, "figPlanL6_t", "Colour the wheel"),
      body: <>
        <p>{tx(t, "figPlanL6_b1", "Switch to colour mode. The wheel W₅ is a ring of five with a hub joined to all of them.")}</p>
        <p>{tx(t, "figPlanL6_b2", "Turn on \"only 3 colours\" and try first. Then turn it off.")}</p>
      </>,
      goal: { text: tx(t, "figPlanL6_g", "The wheel properly coloured."), done: id === "wheel5" && mode === "colour" && proper },
      hint: tx(t, "figPlanL6_h", "The hub touches everything, so it needs a colour of its own; the ring of five is an odd cycle, which needs three more."),
      setup: () => { load("wheel5"); setMode("colour"); setThree(false); },
    },
    {
      title: tx(t, "figPlanL7_t", "Petersen in three"),
      body: <p>{tx(t, "figPlanL7_b", "Petersen's graph is not planar, but it still needs only 3 colours. Find a proper colouring with 3.")}</p>,
      goal: { text: tx(t, "figPlanL7_g", "Petersen coloured with 3 colours."), done: id === "petersen" && mode === "colour" && proper && used <= 3 },
      hint: tx(t, "figPlanL7_h", "Colour the outer pentagon with 3 colours (an odd cycle needs them), then each inner vertex avoids its two pentagram neighbours and its spoke."),
      setup: () => { load("petersen"); setMode("colour"); setThree(true); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "euler", tone: "ok", when: mode === "untangle" && planarNow && E > 0,
      title: tx(t, "figPlanI1_t", "Euler's formula"),
      body: fill(tx(t, "figPlanI1_b", "{v} − {e} + {f} = 2. Move the vertices anywhere you like without creating a crossing: the faces change shape, never their number."), { v: V, e: E, f: F }),
    },
    {
      id: "dense", tone: "warn", when: mode === "untangle" && E > 3 * V - 6,
      title: tx(t, "figPlanI2_t", "Too many edges to be planar"),
      body: fill(tx(t, "figPlanI2_b", "{e} edges but a planar graph on {v} vertices has at most 3·{v} − 6 = {b}. Some crossing must remain."), { e: E, v: V, b: 3 * V - 6 }),
    },
    {
      id: "k33", tone: "warn", when: mode === "untangle" && id === "k33",
      title: tx(t, "figPlanI3_t", "The utilities puzzle"),
      body: tx(t, "figPlanI3_b", "Three houses, each joined to water, gas and electricity: K₃,₃. It has no triangles, so each face would need 4 edges, giving E ≤ 2V − 4 = 8 < 9. It is not planar either."),
    },
    {
      id: "three", tone: "warn", when: mode === "colour" && three && chi > 3,
      title: tx(t, "figPlanI4_t", "Three is not enough here"),
      body: fill(tx(t, "figPlanI4_b", "This graph needs {k} colours. With only three, some edge will always be red."), { k: chi }),
    },
  ];

  const title = tx(t, "figPlan_title", "Untangle a graph, then colour it");
  return (
    <>
      <Figure fullscreen={false} title={title} head={<>{modeChoice}<LabButton lab={lab} t={t} /></>} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figPlanR1", "A planar drawing has no crossings; with V vertices, E edges and F faces (outside included), V − E + F = 2."),
          tx(t, "figPlanR2", "So a simple planar graph has E ≤ 3V − 6: K₅ is not planar, and K₃,₃ (no triangles, E ≤ 2V − 4) is not either."),
          tx(t, "figPlanR3", "Neighbours get different colours; χ is the fewest colours needed. Odd cycles need 3, the wheel W₅ needs 4."),
          tx(t, "figPlanR4", "Every planar graph can be coloured with 4 colours: the four colour theorem."),
        ]}
      />
    </>
  );
}
