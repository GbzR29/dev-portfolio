"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Figure, Choice, Row, Readout, C, T } from "@/components/lesson/kit/figure";
import { GraphSvg, NODES, EDGES, adjacency, name } from "./graphDraw";

// ── What this figure shows ────────────────────────────────────────────────────
// The sample graph and three ways of storing it. Tap a vertex: its edges light
// up in the drawing and in the storage. The adjacency matrix spends a cell on
// every pair (V² = 64), most of them empty; the adjacency list stores each
// edge twice, once in each endpoint's list (2E = 24 entries); the edge list
// stores each edge once but has to be scanned whole to find a vertex's edges.

type Mode = "matrix" | "list" | "edges";
const ADJ = adjacency();
const V = NODES.length;
const W = 560;

export function GraphRepFigure({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Mode>("list");
  const [sel, setSel] = useState(2);
  const touches = (e: number) => EDGES[e].a === sel || EDGES[e].b === sel;
  const deg = ADJ[sel].length;

  const CS = 24, MX = 180, MY = 22;          // matrix cell size and origin
  const H = mode === "matrix" ? MY + (V + 1) * CS + 8 : mode === "list" ? V * 26 + 16 : 4 * 26 + 16;

  return (
    <Figure
      title={tx(t, "figGrep_title", "Storing a graph")}
      head={<Choice value={mode} onChange={setMode} options={[
        ["list", tx(t, "figGrep_list", "adjacency list")],
        ["matrix", tx(t, "figGrep_matrix", "adjacency matrix")],
        ["edges", tx(t, "figGrep_edges", "edge list")],
      ] as const} />}
      controls={<Row>
        <Readout color={C.amber}>deg({name(sel)}) = {deg}</Readout>
        <Readout>{mode === "matrix" ? `${tx(t, "figGrep_cells", "cells")}: V² = ${V * V}` : mode === "list" ? `${tx(t, "figGrep_entries", "entries")}: 2E = ${2 * EDGES.length}` : `${tx(t, "figGrep_entries", "entries")}: E = ${EDGES.length}`}</Readout>
        <Readout>{mode === "matrix" ? tx(t, "figGrep_costM", "edge test O(1), neighbours O(V)") : mode === "list" ? tx(t, "figGrep_costL", "neighbours O(deg), edge test O(deg)") : tx(t, "figGrep_costE", "neighbours O(E)")}</Readout>
      </Row>}
      note={tx(t, "figGrep_note", "Tap a vertex to select it. In the matrix, row and column of the selected vertex hold the same numbers because the graph is undirected: the matrix is symmetric. In the list, every edge appears twice, once from each end. The sum of all degrees is 24, twice the 12 edges.")}
    >
      <GraphSvg
        onNode={setSel}
        nodeFill={i => (i === sel ? C.amber : ADJ[sel].some(a => a.to === i) ? C.sky : undefined)}
        edgeColor={e => (touches(e) ? C.amber : undefined)}
        edgeWidth={e => (touches(e) ? 3 : undefined)}
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto border-t border-[var(--border)]" role="img">
        {mode === "matrix" && <>
          {NODES.map((n, j) => <T key={j} x={MX + (j + 1) * CS + CS / 2} y={MY + CS / 2 + 4} size={10} anchor="middle" color={j === sel ? C.amber : C.sky} bold>{n.id}</T>)}
          {NODES.map((n, i) => (
            <g key={i}>
              <T x={MX + CS / 2} y={MY + (i + 1) * CS + CS / 2 + 4} size={10} anchor="middle" color={i === sel ? C.amber : C.sky} bold>{n.id}</T>
              {NODES.map((_, j) => {
                const edge = ADJ[i].find(a => a.to === j);
                const hot = i === sel || j === sel;
                return (
                  <g key={j}>
                    <rect x={MX + (j + 1) * CS + 1} y={MY + (i + 1) * CS + 1} width={CS - 2} height={CS - 2} rx={2}
                      fill={edge && hot ? C.amber : C.bg} fillOpacity={edge && hot ? 0.3 : 1} stroke={C.axis} strokeWidth={0.8} />
                    <T x={MX + (j + 1) * CS + CS / 2} y={MY + (i + 1) * CS + CS / 2 + 4} size={9.5} anchor="middle"
                      color={edge ? C.fg : C.muted}>{edge ? edge.w : "·"}</T>
                  </g>
                );
              })}
            </g>
          ))}
        </>}
        {mode === "list" && NODES.map((n, i) => (
          <g key={i} opacity={i === sel ? 1 : 0.75}>
            <T x={24} y={22 + i * 26} size={10.5} color={i === sel ? C.amber : C.sky} bold>{n.id}</T>
            <T x={40} y={22 + i * 26} size={10} color={C.muted}>→</T>
            {ADJ[i].map((a, k) => {
              const hot = i === sel || a.to === sel;
              return (
                <g key={k}>
                  <rect x={60 + k * 74} y={8 + i * 26} width={68} height={20} rx={4}
                    fill={hot ? C.amber : C.bg} fillOpacity={hot ? 0.28 : 1} stroke={C.axis} strokeWidth={0.8} />
                  <T x={60 + k * 74 + 34} y={22 + i * 26} size={9.5} anchor="middle" color={C.fg}>{`${name(a.to)}, w=${a.w}`}</T>
                </g>
              );
            })}
          </g>
        ))}
        {mode === "edges" && EDGES.map((ed, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const hot = touches(i);
          return (
            <g key={i}>
              <rect x={24 + col * 176} y={8 + row * 26} width={166} height={20} rx={4}
                fill={hot ? C.amber : C.bg} fillOpacity={hot ? 0.28 : 1} stroke={C.axis} strokeWidth={0.8} />
              <T x={24 + col * 176 + 83} y={22 + row * 26} size={9.5} anchor="middle" color={C.fg}>{`${i}: (${name(ed.a)}, ${name(ed.b)}, w=${ed.w})`}</T>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
