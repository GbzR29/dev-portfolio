"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { useStepper, StepperControls } from "@/components/lesson/kit/Stepper";
import { GraphSvg, NODES, adjacency, name } from "./graphDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// Breadth-first and depth-first search on the sample graph (weights ignored),
// neighbours taken in alphabetical order. Tap a vertex to start there.
//   BFS  one step = take the vertex at the front of the queue and put its
//        unseen neighbours at the back. The number under a vertex is its
//        distance in edges; green edges form the BFS tree of shortest paths.
//   DFS  one step = the recursion discovers a vertex (grey, pushed on the call
//        stack) or finishes one (black, popped). Numbers are discovery/finish
//        times; green edges form the DFS tree.

type Mode = "bfs" | "dfs";
type Frame = {
  cur: number;                 // the vertex acted on, −1 before the first step
  front: number[];             // queue (front first) or call stack (bottom first)
  state: number[];             // 0 unseen, 1 seen / on the stack, 2 done
  note: (string | undefined)[];
  tree: number[];              // edge indices of the search tree so far
  order: number[];             // BFS: dequeue order; DFS: discovery order
  msg: string;
};

const ADJ = adjacency();
const V = NODES.length;

function bfs(s: number): Frame[] {
  const dist = new Array<number>(V).fill(-1);
  const state = new Array<number>(V).fill(0);
  const tree: number[] = [], order: number[] = [];
  const q = [s];
  dist[s] = 0; state[s] = 1;
  const snap = (cur: number, msg: string): Frame =>
    ({ cur, front: q.slice(), state: state.slice(), note: dist.map(d => (d < 0 ? undefined : String(d))), tree: tree.slice(), order: order.slice(), msg });
  const frames = [snap(-1, `queue = [${name(s)}], dist(${name(s)}) = 0`)];
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    const found: string[] = [];
    for (const a of ADJ[u]) {
      if (dist[a.to] >= 0) continue;
      dist[a.to] = dist[u] + 1; state[a.to] = 1;
      tree.push(a.e); q.push(a.to); found.push(name(a.to));
    }
    state[u] = 2;
    frames.push(snap(u, found.length
      ? `${name(u)}: ${found.join(", ")} → dist ${dist[u] + 1}`
      : `${name(u)}: —`));
  }
  return frames;
}

function dfs(s: number, t?: TrackTranslations): Frame[] {
  const state = new Array<number>(V).fill(0);
  const d = new Array<number>(V).fill(0), f = new Array<number>(V).fill(0);
  const tree: number[] = [], order: number[] = [], stack: number[] = [];
  let time = 0;
  const frames: Frame[] = [];
  const snap = (cur: number, msg: string) => frames.push({
    cur, front: stack.slice(), state: state.slice(),
    note: state.map((st, i) => (st === 0 ? undefined : st === 1 ? `${d[i]}/` : `${d[i]}/${f[i]}`)),
    tree: tree.slice(), order: order.slice(), msg,
  });
  snap(-1, `dfs(${name(s)})`);
  const visit = (u: number) => {
    state[u] = 1; d[u] = ++time; stack.push(u); order.push(u);
    snap(u, `${tx(t, "figGs_discover", "discover")} ${name(u)} (d = ${d[u]})`);
    for (const a of ADJ[u]) if (state[a.to] === 0) { tree.push(a.e); visit(a.to); }
    state[u] = 2; f[u] = ++time; stack.pop();
    snap(u, `${tx(t, "figGs_finish", "finish")} ${name(u)} (f = ${f[u]})`);
  };
  visit(s);
  return frames;
}

export function GraphSearchFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("bfs");
  const [start, setStart] = useState(0);
  const frames = useMemo(() => (mode === "bfs" ? bfs(start) : dfs(start, t)), [mode, start, t]);
  const s = useStepper(frames.length - 1, mode === "bfs" ? 1200 : 800, 250);
  const fr = frames[Math.min(frames.length - 1, Math.floor(s.raw + 1e-9))];
  const tree = new Set(fr.tree);

  return (
    <Figure
      title={tx(t, "figGs_title", "Breadth-first and depth-first search")}
      head={<Choice value={mode} onChange={v => { setMode(v); s.restart(); }} options={[
        ["bfs", tx(t, "figGs_bfs", "BFS (queue)")],
        ["dfs", tx(t, "figGs_dfs", "DFS (recursion)")],
      ] as const} />}
      controls={<>
        <StepperControls s={s} />
        <Row>
          <Readout color={C.sky}>{mode === "bfs" ? tx(t, "figGs_queue", "queue") : tx(t, "figGs_stack", "call stack")}: [{fr.front.map(name).join(", ")}]</Readout>
          <Readout>{mode === "bfs" ? tx(t, "figGs_orderB", "dequeued") : tx(t, "figGs_orderD", "discovered")}: {fr.order.map(name).join(" ") || "—"}</Readout>
        </Row>
      </>}
      note={tx(t, "figGs_note", "Tap a vertex to start the search there. BFS spreads out in rings: every vertex at distance 1 before any at distance 2, so the green tree holds shortest paths in edges. DFS runs down one path as far as it can and backs up only when stuck; a vertex finishes after everything reachable from it has finished.")}
    >
      <GraphSvg
        top={26}
        weights={false}
        onNode={i => { setStart(i); s.restart(); }}
        nodeFill={i => (fr.state[i] === 2 ? C.green : fr.state[i] === 1 ? C.sky : undefined)}
        nodeStroke={i => (i === fr.cur ? C.amber : i === start && fr.cur < 0 ? C.amber : undefined)}
        nodeNote={i => fr.note[i]}
        edgeColor={e => (tree.has(e) ? C.green : undefined)}
        edgeWidth={e => (tree.has(e) ? 3 : undefined)}
      >
        <T x={16} y={-8} size={10.5} color={C.fg} bold>{fr.msg}</T>
      </GraphSvg>
    </Figure>
  );
}
