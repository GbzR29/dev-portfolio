"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Btn, Choice, Row, Readout, C, useFrame, useVisible } from "@/components/lesson/kit/figure";
import { Transport } from "@/components/lesson/kit/Transport";
import { Lab, LabButton, fill, useLab, type Insight, type LabStep } from "@/components/lesson/kit/lab/Lab";
import { degrees, eulerKind, eulerTrail, hasEdge, oddVertices, other, type Graph } from "./graph/graphModel";
import { GraphView, letter } from "./graph/GraphView";
import { PRESETS, type PresetId } from "./graph/presets";

// ── What this figure shows ────────────────────────────────────────────────────
// Walk through a graph by tapping vertices. In "Euler" mode the walk must use
// every edge exactly once (an Euler trail); used edges turn green and get
// their order number, and you are stuck when the vertex you stand on has no
// unused edge left. Odd-degree vertices wear an amber ring: Euler's theorem
// says a trail exists only with 0 or 2 of them, and with 2 it must start at
// one and end at the other. "Draw" adds vertices and edges (parallel edges
// allowed: build a new bridge in Königsberg). Play shows a trail found by
// Hierholzer's method. In "Hamilton" mode the walk must visit every vertex
// once instead, which has no such simple test.

type Mode = "euler" | "hamilton";
type Tool = "walk" | "draw" | "move";
const LIST: [PresetId, string][] = [
  ["konigsberg", "Königsberg"], ["house", "⌂"], ["octahedron", "octa"], ["k5", "K₅"], ["k33", "K₃,₃"], ["petersen", "Petersen"], ["dodecahedron", "dodeca"],
];
const STEP = 0.55;

export function EulerFigure({ t }: { t?: TrackTranslations }) {
  const [g, setGraph] = useState<Graph>(PRESETS.konigsberg);
  const [preset, setPreset] = useState<PresetId>("konigsberg");
  const [mode, setMode] = useState<Mode>("euler");
  const [tool, setTool] = useState<Tool>("walk");
  const [start, setStart] = useState<number | null>(null);
  const [trail, setTrail] = useState<number[]>([]);           // Euler: edge indices in order
  const [hpath, setHpath] = useState<number[]>([]);           // Hamilton: vertices in order
  const [closed, setClosed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [acc, setAcc] = useState(0);
  const [built, setBuilt] = useState(0);                      // edges drawn by the reader since the preset loaded
  const lab = useLab("math-euler");
  const vis = useVisible<HTMLDivElement>();

  const d = degrees(g), odd = oddVertices(g), kind = eulerKind(g), m = g.edges.length, n = g.pts.length;
  const clear = () => { setTrail([]); setHpath([]); setClosed(false); setStart(null); setPlaying(false); };
  const load = (id: PresetId) => { setPreset(id); setGraph(PRESETS[id]()); setBuilt(0); clear(); };
  const setG = (h: Graph) => { if (h.edges.length > g.edges.length) setBuilt(b => b + 1); setGraph(h); clear(); };
  const pickMode = (k: Mode) => { setMode(k); clear(); setTool("walk"); };

  // where the Euler walk stands now
  let here: number | null = start;
  for (const e of trail) here = here === null ? null : other(g, e, here);
  const used = new Set(trail);
  const unusedAt = (v: number) => g.edges.filter((_, i) => !used.has(i)).some(([a, b]) => a === v || b === v);
  const eulerDone = m > 0 && trail.length === m;
  const stuck = mode === "euler" && here !== null && !eulerDone && !unusedAt(here);

  const solution = eulerTrail(g, start !== null && trail.length === 0 && eulerTrail(g, start) ? start : undefined);

  const stepEuler = (v: number) => {
    if (here === null) { setStart(v); return; }
    const e = g.edges.findIndex(([a, b], i) => !used.has(i) && ((a === here && b === v) || (b === here && a === v)));
    if (e >= 0) setTrail(tr => [...tr, e]);
  };
  const stepHamilton = (v: number) => {
    if (closed) return;
    if (!hpath.length) { setHpath([v]); return; }
    const last = hpath[hpath.length - 1];
    if (!hasEdge(g, last, v)) return;
    if (v === hpath[0] && hpath.length === n && n > 2) { setClosed(true); return; }
    if (!hpath.includes(v)) setHpath(p => [...p, v]);
  };
  const onVertex = (v: number) => { setPlaying(false); (mode === "euler" ? stepEuler : stepHamilton)(v); };
  const onEdge = (e: number) => {
    if (mode !== "euler" || here === null) return;
    const [a, b] = g.edges[e];
    if (!used.has(e) && (a === here || b === here)) { setPlaying(false); setTrail(tr => [...tr, e]); }
  };
  const undo = () => {
    setPlaying(false);
    if (mode === "euler") { if (trail.length) setTrail(tr => tr.slice(0, -1)); else setStart(null); }
    else if (closed) setClosed(false); else setHpath(p => p.slice(0, -1));
  };

  // ── play: Hierholzer's trail, one edge at a time
  const playStep = () => {
    if (!solution) return false;
    const done = trail.length >= m;
    if (done) return false;
    if (trail.length === 0 || trail.every((e, i) => e === solution.edges[i])) {
      setStart(solution.verts[0]);
      setTrail(solution.edges.slice(0, trail.length + 1));
      return true;
    }
    setStart(solution.verts[0]);
    setTrail(solution.edges.slice(0, 1));
    return true;
  };
  useFrame(playing && (vis.on || lab.open), dt => {
    const a = acc + dt;
    if (a < STEP) { setAcc(a); return; }
    setAcc(0);
    if (!playStep()) setPlaying(false);
  });

  const hereH = hpath.length ? hpath[hpath.length - 1] : null;
  const hStuck = mode === "hamilton" && hereH !== null && !closed && hpath.length < n &&
    !g.pts.some((_, v) => !hpath.includes(v) && hasEdge(g, hereH, v));

  const order = new Map(trail.map((e, i) => [e, i + 1]));
  const hEdges = new Set<number>();
  for (let i = 0; i + 1 < hpath.length + (closed ? 1 : 0); i++) {
    const a = hpath[i], b = hpath[(i + 1) % hpath.length];
    hEdges.add(g.edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a)));
  }
  const cur = mode === "euler" ? here : hereH;
  const first = mode === "euler" ? start : hpath[0] ?? null;

  const view = (
    <div ref={vis.ref}>
      <GraphView g={g} setG={setG} multi maxV={12}
        tool={tool === "walk" ? "move" : tool === "draw" ? "draw" : "move"}
        onVertex={tool === "walk" ? onVertex : undefined}
        onEdge={tool === "walk" ? onEdge : undefined}
        vColor={i => (i === cur ? C.amber : i === first ? C.purple : mode === "hamilton" && hpath.includes(i) ? C.green : C.sky)}
        vRing={i => (mode === "euler" && d[i] % 2 ? C.amber : undefined)}
        vSub={i => (mode === "euler" ? String(d[i]) : undefined)}
        vText={i => letter(i)}
        eColor={i => (mode === "euler" ? (used.has(i) ? C.green : C.muted) : hEdges.has(i) ? C.green : C.muted)}
        eWidth={i => (mode === "euler" ? (used.has(i) ? 3.4 : 2.2) : hEdges.has(i) ? 3.4 : 1.6)}
        eDash={i => (mode === "hamilton" && !hEdges.has(i) ? "4 4" : undefined)}
        eLabel={i => (mode === "euler" && order.has(i) ? String(order.get(i)) : undefined)} />
      {mode === "euler" && (
        <Transport t={t} playing={playing}
          onPlay={() => { if (eulerDone || !solution) clear(); setAcc(0); setPlaying(v => !v); }}
          playLabel={tx(t, "figEul_play", "show a trail")}
          onStep={() => { setPlaying(false); playStep(); }}
          onBack={undo}
          onReset={clear}
          readout={`${trail.length} / ${m}`} />
      )}
    </div>
  );

  const modeChoice = <Choice value={mode} onChange={pickMode} options={[["euler", tx(t, "figEul_mEuler", "Euler: every edge")], ["hamilton", tx(t, "figEul_mHam", "Hamilton: every vertex")]] as const} />;
  const head = <>{modeChoice}<LabButton lab={lab} t={t} /></>;
  const verdict =
    kind === "circuit" ? tx(t, "figEul_vCircuit", "0 odd vertices: an Euler circuit exists, from any vertex back to itself")
    : kind === "trail" ? fill(tx(t, "figEul_vTrail", "2 odd vertices: an Euler trail exists, from {a} to {b}"), { a: letter(odd[0]), b: letter(odd[1]) })
    : kind === "none" ? fill(tx(t, "figEul_vNone", "{n} odd vertices: no Euler trail"), { n: odd.length })
    : kind === "split" ? tx(t, "figEul_vSplit", "the edges are in more than one piece: no Euler trail")
    : tx(t, "figEul_vEmpty", "no edges yet");
  const status = mode === "euler"
    ? (here === null ? tx(t, "figEul_sStart", "tap a vertex to start")
      : eulerDone ? (here === start ? tx(t, "figEul_sCircuit", "every edge used once, back at the start: an Euler circuit") : tx(t, "figEul_sTrail", "every edge used once: an Euler trail"))
      : stuck ? fill(tx(t, "figEul_sStuck", "stuck at {v}: {k} edges never used"), { v: letter(here), k: m - trail.length })
      : fill(tx(t, "figEul_sAt", "at {v}: tap a neighbour to cross an unused edge"), { v: letter(here) }))
    : (!hpath.length ? tx(t, "figEul_sStart", "tap a vertex to start")
      : closed ? tx(t, "figEul_hCycle", "every vertex once and back home: a Hamilton cycle")
      : hpath.length === n ? tx(t, "figEul_hPath", "every vertex once: a Hamilton path (tap the start to close it, if they are neighbours)")
      : hStuck ? fill(tx(t, "figEul_hStuck", "stuck: {k} vertices never visited"), { k: n - hpath.length })
      : fill(tx(t, "figEul_hAt", "visited {k} of {n}"), { k: hpath.length, n }));
  const ok = mode === "euler" ? eulerDone : closed || hpath.length === n;

  const controls = <>
    <Row>
      {LIST.map(([id, label]) => <Btn key={id} active={preset === id} onClick={() => load(id)}>{label}</Btn>)}
    </Row>
    <Row>
      <Choice value={tool} onChange={setTool} options={[["walk", tx(t, "figEul_walk", "walk")], ["draw", tx(t, "figEul_draw", "draw edges")], ["move", tx(t, "figEul_move", "move")]] as const} />
      <Btn onClick={undo}>{tx(t, "figEul_undo", "undo")}</Btn>
      <Btn onClick={clear}>{tx(t, "figEul_clear", "start again")}</Btn>
    </Row>
    <Row>
      <Readout color={ok ? C.green : stuck || hStuck ? C.red : undefined}>{status}</Readout>
    </Row>
    {mode === "euler" && <Row><Readout color={kind === "circuit" || kind === "trail" ? C.green : C.amber}>{verdict}</Readout></Row>}
  </>;
  const note = mode === "euler"
    ? tx(t, "figEul_note", "Tap a vertex to start, then tap neighbouring vertices to walk; each edge can be crossed only once, and crossed edges turn green with their order. The amber rings mark odd degree. Choose \"draw edges\" and drag between two vertices to add an edge (a new bridge). Play shows a trail found automatically, when one exists.")
    : tx(t, "figEul_noteH", "Now the goal is every vertex exactly once; edges may be skipped. Tap a vertex to start and tap neighbours to move. The dodecahedron is Hamilton's own puzzle from 1857; Petersen's graph has a Hamilton path but no Hamilton cycle.");

  // ── Lab ──
  const labSteps: LabStep[] = [
    {
      title: tx(t, "figEulL1_t", "The seven bridges"),
      body: <>
        <p>{tx(t, "figEulL1_b1", "A and C are the two river banks, B the island in the middle, D the eastern island. Each edge is a bridge.")}</p>
        <p>{tx(t, "figEulL1_b2", "Start anywhere and try to cross every bridge exactly once.")}</p>
      </>,
      goal: { text: tx(t, "figEulL1_g", "Walk until you get stuck."), done: preset === "konigsberg" && stuck },
      hint: tx(t, "figEulL1_h", "Tap a land mass, then tap a neighbour to cross a bridge to it."),
      setup: () => { load("konigsberg"); setMode("euler"); setTool("walk"); },
    },
    {
      title: tx(t, "figEulL2_t", "Quick check"),
      body: <p>{tx(t, "figEulL2_b", "Look at the degrees: the number of bridges at each land mass.")}</p>,
      quiz: {
        q: tx(t, "figEulL2_q", "How many land masses have an odd number of bridges?"),
        options: ["4", "2", "1", "0"],
        answer: 0,
        why: tx(t, "figEulL2_w", "A has 3, B has 5, C has 3, D has 3: all four are odd. A walk passes through a vertex using two edges each time, so only the start and the end can be odd."),
      },
    },
    {
      title: tx(t, "figEulL3_t", "Build one bridge"),
      body: <>
        <p>{tx(t, "figEulL3_b1", "Choose \"draw edges\" and drag between two land masses to add one bridge.")}</p>
        <p>{tx(t, "figEulL3_b2", "Pick two odd ones: both become even, and two odd vertices are left.")}</p>
      </>,
      goal: { text: tx(t, "figEulL3_g", "Eight bridges, exactly two odd land masses."), done: preset === "konigsberg" && m === 8 && odd.length === 2 },
      hint: tx(t, "figEulL3_h", "A bridge from A to C, for instance."),
      setup: () => { load("konigsberg"); setMode("euler"); setTool("draw"); },
    },
    {
      title: tx(t, "figEulL4_t", "Now walk it"),
      body: <p>{tx(t, "figEulL4_b", "Choose \"walk\", start at one of the two odd land masses and cross all eight bridges. If you get stuck, undo, or press play to see one way.")}</p>,
      goal: { text: tx(t, "figEulL4_g", "All eight bridges crossed once."), done: preset === "konigsberg" && m === 8 && eulerDone },
      hint: tx(t, "figEulL4_h", "Start at an amber-ringed vertex: the trail must begin at one odd vertex and end at the other."),
    },
    {
      title: tx(t, "figEulL5_t", "The house in one stroke"),
      body: <p>{tx(t, "figEulL5_b", "Draw this house without lifting the pen: every line once. Two corners have odd degree.")}</p>,
      goal: { text: tx(t, "figEulL5_g", "The house drawn in one stroke."), done: preset === "house" && eulerDone },
      hint: tx(t, "figEulL5_h", "Start at a bottom corner; starting at the roof always gets stuck."),
      setup: () => { load("house"); setMode("euler"); setTool("walk"); },
    },
    {
      title: tx(t, "figEulL6_t", "Quick check"),
      body: <p>{tx(t, "figEulL6_b", "The octahedron has six vertices, each of degree 4.")}</p>,
      quiz: {
        q: tx(t, "figEulL6_q", "Can you cross every edge of the octahedron once and finish where you started?"),
        options: [tx(t, "figEulL6_o1", "Yes, from any vertex"), tx(t, "figEulL6_o2", "Only from some vertices"), tx(t, "figEulL6_o3", "No")],
        answer: 0,
        why: tx(t, "figEulL6_w", "It is connected and every degree is even, so it has an Euler circuit, and a circuit can be started anywhere on it."),
      },
    },
    {
      title: tx(t, "figEulL7_t", "Every vertex instead"),
      body: <p>{tx(t, "figEulL7_b", "Switch to Hamilton mode on the dodecahedron: visit all 20 vertices once and return to the start. There is no degree test here; you have to search.")}</p>,
      goal: { text: tx(t, "figEulL7_g", "A Hamilton cycle on the dodecahedron."), done: preset === "dodecahedron" && mode === "hamilton" && closed },
      hint: tx(t, "figEulL7_h", "Go round the outer pentagon partly, dip into the middle ring, and keep the inner pentagon for a long stretch."),
      setup: () => { load("dodecahedron"); setMode("hamilton"); setTool("walk"); },
    },
  ];

  const insights: Insight[] = [
    {
      id: "stuck", tone: "warn", when: mode === "euler" && stuck && kind === "none",
      title: tx(t, "figEulI1_t", "Not your fault"),
      body: fill(tx(t, "figEulI1_b", "With {n} odd vertices no walk can use every edge once: each time a walk passes through a vertex it uses two of its edges, so every vertex except the start and the end needs an even degree."), { n: odd.length }),
    },
    {
      id: "wrongStart", tone: "info", when: mode === "euler" && kind === "trail" && start !== null && !odd.includes(start),
      title: tx(t, "figEulI2_t", "Start at an odd vertex"),
      body: tx(t, "figEulI2_b", "With exactly two odd vertices, a trail must start at one of them and end at the other. From an even vertex you will always be left with unused edges."),
    },
    {
      id: "built", tone: "ok", when: mode === "euler" && built > 0 && (kind === "trail" || kind === "circuit"),
      title: tx(t, "figEulI3_t", "Solvable now"),
      body: tx(t, "figEulI3_b", "Each new edge changes the degree of both its ends by one, so it can turn two odd vertices even. Adding edges between odd vertices in pairs is how a route that must cover every street is planned."),
    },
    {
      id: "petersen", tone: "info", when: mode === "hamilton" && preset === "petersen",
      title: tx(t, "figEulI4_t", "A famous no"),
      body: tx(t, "figEulI4_b", "Petersen's graph has a Hamilton path but no Hamilton cycle, although every vertex has degree 3. Proving that takes a case-by-case argument; there is no quick test like Euler's."),
    },
  ];

  const title = tx(t, "figEul_title", "One stroke: Euler trails and Hamilton cycles");
  return (
    <>
      <Figure fullscreen={false} title={title} head={head} controls={controls} note={note}>
        {view}
      </Figure>
      <Lab lab={lab} t={t} title={title}
        steps={labSteps} insights={insights} stage={view}
        controls={<><Row>{modeChoice}</Row>{controls}</>}
        recap={[
          tx(t, "figEulR1", "An Euler trail uses every edge once; an Euler circuit also ends where it started."),
          tx(t, "figEulR2", "A connected graph has an Euler circuit when every degree is even, and an Euler trail when exactly two degrees are odd (it runs between them)."),
          tx(t, "figEulR3", "Königsberg has four odd land masses, so no walk crosses each bridge once; one new bridge fixes it."),
          tx(t, "figEulR4", "A Hamilton cycle visits every vertex once; no simple test decides when one exists."),
        ]}
      />
    </>
  );
}
