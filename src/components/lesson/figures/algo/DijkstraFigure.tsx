"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";
import { GraphSvg, NODES, adjacency, name } from "./graphDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// Dijkstra's algorithm from A on the sample graph, with a min-heap and lazy
// deletion. One step = pop the smallest (distance, vertex) from the heap; if
// the vertex is already finished the entry is stale and skipped, otherwise the
// vertex is finished (green) and every edge out of it is relaxed (amber):
// a shorter distance to a neighbour replaces the old one and is pushed.
// Numbers under the vertices are the current distances; green edges are the
// best known way into each vertex. Tap a vertex to trace its path from A.

type Entry = [number, number];                 // (distance, vertex)
type Frame = { cur: number; dist: number[]; done: boolean[]; parent: number[]; relaxed: number[]; heap: Entry[]; msg: string };

const ADJ = adjacency();
const V = NODES.length;
const SRC = 0;

function dijkstra(t?: TrackTranslations): Frame[] {
  const dist = new Array<number>(V).fill(Infinity);
  const done = new Array<boolean>(V).fill(false);
  const parent = new Array<number>(V).fill(-1);          // edge index into the vertex
  let heap: Entry[] = [[0, SRC]];
  dist[SRC] = 0;
  const frames: Frame[] = [];
  const snap = (cur: number, relaxed: number[], msg: string) =>
    frames.push({ cur, dist: dist.slice(), done: done.slice(), parent: parent.slice(), relaxed, heap: heap.slice(), msg });
  snap(-1, [], `dist(A) = 0, ${tx(t, "figDij_heap", "heap")} = [(0, A)]`);
  while (heap.length) {
    heap.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const [d, u] = heap.shift()!;
    if (done[u]) { snap(u, [], `(${d}, ${name(u)}): ${tx(t, "figDij_stale", "stale entry, skip")}`); continue; }
    done[u] = true;
    const relaxed: number[] = [], changes: string[] = [];
    for (const a of ADJ[u]) {
      if (done[a.to]) continue;
      if (d + a.w < dist[a.to]) {
        changes.push(`${name(a.to)}: ${dist[a.to] === Infinity ? "∞" : dist[a.to]} → ${d + a.w}`);
        dist[a.to] = d + a.w; parent[a.to] = a.e; relaxed.push(a.e);
        heap.push([dist[a.to], a.to]);
      }
    }
    heap = heap.slice();
    snap(u, relaxed, `${tx(t, "figDij_finish", "finish")} ${name(u)} = ${d}${changes.length ? `; ${changes.join(", ")}` : ""}`);
  }
  return frames;
}

/** The edges of the best known path from A to v, following parent edges back. */
function pathTo(parent: number[], v: number) {
  const path = new Set<number>();
  for (let guard = 0; parent[v] >= 0 && guard < V; ++guard) {
    const e = parent[v];
    path.add(e);
    v = ADJ[v].find(a => a.e === e)!.to;
  }
  return path;
}

export function DijkstraFigure({ t }: { t?: TrackTranslations }) {
  const frames = useMemo(() => dijkstra(t), [t]);
  const [target, setTarget] = useState(7);
  const s = useStepper(frames.length - 1, 1300, 300);
  const fr = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];

  const path = pathTo(fr.parent, target);
  const tree = new Set(fr.parent.filter(e => e >= 0));
  const relaxed = new Set(fr.relaxed);
  const sorted = fr.heap.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);

  return (
    <Figure
      title={tx(t, "figDij_title", "Dijkstra's algorithm from A")}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.sky}>{tx(t, "figDij_heap", "heap")}: {sorted.map(([d, v]) => `(${d}, ${name(v)})${fr.done[v] ? "✗" : ""}`).join(" ") || "—"}</Readout>
          <Readout color={C.pink}>A → {name(target)}: {fr.dist[target] === Infinity ? "∞" : fr.dist[target]}</Readout>
        </Row>
      </>}
      note={tx(t, "figDij_note", "Tap a vertex to follow its best known path from A (pink). A vertex's number can only go down, and once the vertex turns green it never changes again. An entry marked ✗ in the heap belongs to a vertex that is already finished: it was pushed before a shorter distance was found, and is simply skipped when it reaches the top.")}
    >
      <GraphSvg
        top={26}
        onNode={setTarget}
        nodeFill={i => (fr.done[i] ? C.green : fr.dist[i] < Infinity ? C.sky : undefined)}
        nodeStroke={i => (i === fr.cur ? C.amber : i === target ? C.pink : undefined)}
        nodeNote={i => (fr.dist[i] === Infinity ? "∞" : String(fr.dist[i]))}
        edgeColor={e => (relaxed.has(e) ? C.amber : path.has(e) ? C.pink : tree.has(e) ? C.green : undefined)}
        edgeWidth={e => (relaxed.has(e) || path.has(e) ? 3.2 : tree.has(e) ? 2.4 : undefined)}
      >
        <T x={16} y={-8} size={10.5} color={C.fg} bold>{fr.msg}</T>
      </GraphSvg>
    </Figure>
  );
}
