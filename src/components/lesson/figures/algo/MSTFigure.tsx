"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";
import { GraphSvg, NODES, EDGES, adjacency, name } from "./graphDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// Two ways to grow a minimum spanning tree of the sample graph.
//   Kruskal  goes through the edges from lightest to heaviest (the list on
//            top) and keeps an edge unless both ends are already in the same
//            piece; vertices are coloured by their piece (union-find set).
//   Prim     grows one tree from A: the sky-blue edges cross from the tree to
//            the rest, and the lightest of them is added each step.
// Both end with the same 7 edges and total weight 25.

type Mode = "kruskal" | "prim";
type Frame = { taken: number[]; rejected: number[]; cur: number; comp: number[]; inTree: boolean[]; msg: string };

const V = NODES.length;
const ADJ = adjacency();
const ORDER = EDGES.map((_, i) => i).sort((a, b) => EDGES[a].w - EDGES[b].w || a - b);
const ew = (e: number) => EDGES[e].w;
const en = (e: number) => `${name(EDGES[e].a)}${name(EDGES[e].b)}`;
const PALETTE = [C.sky, C.purple, C.orange, C.teal, C.pink, C.amber, C.blue, C.red];

function kruskal(t?: TrackTranslations): Frame[] {
  const parent = NODES.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const taken: number[] = [], rejected: number[] = [];
  const frames: Frame[] = [];
  const snap = (cur: number, msg: string) => frames.push({
    taken: taken.slice(), rejected: rejected.slice(), cur, comp: NODES.map((_, i) => find(i)), inTree: [], msg,
  });
  snap(-1, tx(t, "figMst_kStart", "every vertex is its own piece"));
  for (const e of ORDER) {
    if (taken.length === V - 1) break;
    const ra = find(EDGES[e].a), rb = find(EDGES[e].b);
    if (ra === rb) { rejected.push(e); snap(e, `${en(e)} (${ew(e)}): ${tx(t, "figMst_cycle", "same piece, would close a cycle")}`); continue; }
    parent[ra] = rb; taken.push(e);
    snap(e, `${en(e)} (${ew(e)}): ${tx(t, "figMst_join", "joins two pieces, keep")}`);
  }
  return frames;
}

function prim(t?: TrackTranslations): Frame[] {
  const inTree = new Array<boolean>(V).fill(false);
  const taken: number[] = [];
  const frames: Frame[] = [];
  const snap = (cur: number, msg: string) => frames.push({ taken: taken.slice(), rejected: [], cur, comp: [], inTree: inTree.slice(), msg });
  inTree[0] = true;
  snap(-1, tx(t, "figMst_pStart", "the tree is just A"));
  while (taken.length < V - 1) {
    let best = -1;
    for (let u = 0; u < V; ++u) if (inTree[u]) for (const a of ADJ[u])
      if (!inTree[a.to] && (best < 0 || ew(a.e) < ew(best) || (ew(a.e) === ew(best) && a.e < best))) best = a.e;
    const v = inTree[EDGES[best].a] ? EDGES[best].b : EDGES[best].a;
    inTree[v] = true; taken.push(best);
    snap(best, `${en(best)} (${ew(best)}): ${tx(t, "figMst_light", "lightest crossing edge, add")} ${name(v)}`);
  }
  return frames;
}

export function MSTFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("kruskal");
  const frames = useMemo(() => (mode === "kruskal" ? kruskal(t) : prim(t)), [mode, t]);
  const s = useStepper(frames.length - 1, 1100, 300);
  const fr = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const taken = new Set(fr.taken), rejected = new Set(fr.rejected);
  const crossing = (e: number) => mode === "prim" && fr.inTree[EDGES[e].a] !== fr.inTree[EDGES[e].b];
  const total = fr.taken.reduce((sum, e) => sum + ew(e), 0);
  const roots = [...new Set(fr.comp)];

  return (
    <Figure
      title={tx(t, "figMst_title", "Minimum spanning tree: Kruskal and Prim")}
      head={<Choice value={mode} onChange={v => { setMode(v); s.restart(); }} options={[
        ["kruskal", "Kruskal"],
        ["prim", "Prim"],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.green}>{tx(t, "figMst_edges", "tree edges")}: {fr.taken.length} / {V - 1}</Readout>
          <Readout color={C.green}>{tx(t, "figMst_weight", "weight")}: {total}</Readout>
          {mode === "kruskal" && <Readout>{tx(t, "figMst_pieces", "pieces")}: {roots.length}</Readout>}
        </Row>
      </>}
      note={tx(t, "figMst_note", "Kruskal never looks at where an edge is, only at its weight and at whether its ends are already connected; the pieces merge until one is left. Prim always keeps a single tree and asks only which edge leaving it is lightest. Both rules are safe for the same reason, the cut property, and they pick the same 7 edges here.")}
    >
      <GraphSvg
        top={mode === "kruskal" ? 48 : 26}
        // A piece keeps the colour of its first vertex, so colours stay put as pieces merge
        nodeFill={i => (mode === "kruskal" ? PALETTE[fr.comp.indexOf(fr.comp[i])] : fr.inTree[i] ? C.green : undefined)}
        edgeColor={e => (e === fr.cur ? (rejected.has(e) ? C.red : C.amber) : taken.has(e) ? C.green : rejected.has(e) ? C.red : crossing(e) ? C.sky : undefined)}
        edgeWidth={e => (e === fr.cur ? 3.6 : taken.has(e) ? 3 : crossing(e) ? 2.2 : undefined)}
      >
        {mode === "kruskal" && ORDER.map((e, k) => {
          const state = taken.has(e) ? C.green : rejected.has(e) ? C.red : C.muted;
          return (
            <T key={e} x={16 + k * 45} y={-30} size={9.5} color={e === fr.cur ? C.amber : state} bold={e === fr.cur}>
              {`${en(e)}${ew(e)}`}
            </T>
          );
        })}
        <T x={16} y={-8} size={10.5} color={C.fg} bold>{fr.msg}</T>
      </GraphSvg>
    </Figure>
  );
}
