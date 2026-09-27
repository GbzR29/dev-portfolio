"use client";

import { C, T } from "@/components/lesson/kit/figure";

// ── Graphs shared by the graph figures ────────────────────────────────────────
// One small weighted, undirected sample graph (8 vertices A–H, 12 edges, drawn
// without crossings) is used by every figure of the Graphs section, so the
// numbers in the lessons match: Dijkstra from A gives A..H = 0 4 8 15 7 7 11 16
// (with one stale heap entry, (9, C)), the minimum spanning tree weighs 25 and
// Kruskal rejects FG and BC. Adjacency lists are sorted by neighbour,
// which is the order the lessons' hand traces follow.

export type GNode = { id: string; x: number; y: number };
export type GEdge = { a: number; b: number; w: number };
export type Adj = { to: number; w: number; e: number }[][];

export const GW = 560, GH = 250;

export const NODES: GNode[] = [
  { id: "A", x: 60, y: 80 },
  { id: "B", x: 190, y: 45 },
  { id: "C", x: 330, y: 65 },
  { id: "D", x: 480, y: 55 },
  { id: "E", x: 100, y: 205 },
  { id: "F", x: 240, y: 175 },
  { id: "G", x: 380, y: 205 },
  { id: "H", x: 510, y: 195 },
];

const at = (s: string) => NODES.findIndex(n => n.id === s);
const e = (a: string, b: string, w: number): GEdge => ({ a: at(a), b: at(b), w });

export const EDGES: GEdge[] = [
  e("A", "B", 4), e("A", "E", 7), e("B", "C", 5), e("B", "F", 3),
  e("E", "F", 5), e("C", "F", 1), e("C", "D", 7), e("C", "G", 4),
  e("F", "G", 4), e("D", "H", 3), e("G", "H", 5), e("D", "G", 8),
];

/** Adjacency lists (both directions), each sorted by neighbour index. */
export function adjacency(n = NODES.length, edges = EDGES): Adj {
  const adj: Adj = Array.from({ length: n }, () => []);
  edges.forEach((ed, i) => {
    adj[ed.a].push({ to: ed.b, w: ed.w, e: i });
    adj[ed.b].push({ to: ed.a, w: ed.w, e: i });
  });
  adj.forEach(l => l.sort((p, q) => p.to - q.to));
  return adj;
}

export const name = (i: number) => NODES[i].id;

const R = 15;

/**
 * Draws the sample graph. Every visual state comes from callbacks, so each
 * figure keeps its own algorithm and only says how a vertex or edge looks.
 */
export function GraphSvg({
  nodeFill, nodeStroke, nodeNote, edgeColor, edgeWidth, weights = true, onNode, children, top = 0,
}: {
  nodeFill?: (i: number) => string | undefined;
  nodeStroke?: (i: number) => string | undefined;
  /** Small text under a vertex, e.g. its distance. */
  nodeNote?: (i: number) => string | undefined;
  edgeColor?: (e: number) => string | undefined;
  edgeWidth?: (e: number) => number | undefined;
  weights?: boolean;
  onNode?: (i: number) => void;
  children?: React.ReactNode;
  /** Extra room above the drawing (for a message line). */
  top?: number;
}) {
  return (
    <svg viewBox={`0 ${-top} ${GW} ${GH + top}`} className="w-full h-auto" role="img">
      {children}
      {EDGES.map((ed, i) => {
        const p = NODES[ed.a], q = NODES[ed.b];
        const col = edgeColor?.(i) ?? C.axis;
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        return (
          <g key={i}>
            <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={col} strokeWidth={edgeWidth?.(i) ?? 1.5} />
            {weights && <>
              <rect x={mx - 9} y={my - 8} width={18} height={15} rx={3} fill={C.bg} />
              <T x={mx} y={my + 3.5} size={9.5} anchor="middle" color={col === C.axis ? C.muted : col} bold>{ed.w}</T>
            </>}
          </g>
        );
      })}
      {NODES.map((n, i) => {
        const fill = nodeFill?.(i);
        const note = nodeNote?.(i);
        return (
          <g key={i} onClick={onNode ? () => onNode(i) : undefined} style={onNode ? { cursor: "pointer" } : undefined}>
            <circle cx={n.x} cy={n.y} r={R} fill={fill ?? C.bg} fillOpacity={fill ? 0.3 : 1}
              stroke={nodeStroke?.(i) ?? fill ?? C.axis} strokeWidth={nodeStroke?.(i) ? 2.2 : 1.2} />
            <T x={n.x} y={n.y + 4} size={11} anchor="middle" color={C.fg} bold>{n.id}</T>
            {note !== undefined && <T x={n.x} y={n.y + R + 13} size={9.5} anchor="middle" color={C.amber} bold>{note}</T>}
          </g>
        );
      })}
    </svg>
  );
}
