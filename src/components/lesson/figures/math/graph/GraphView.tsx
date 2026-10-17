"use client";

import { useRef, useState, type ReactNode } from "react";
import { C, svgPoint, clamp } from "@/components/lesson/kit/figure";
import type { Graph, Pt } from "./graphModel";

// ── What this component is ────────────────────────────────────────────────────
// The drawing shared by the Discrete Mathematics widgets: a graph on an svg,
// with its own pointer handling (each copy owns it, since a widget is mounted
// twice while its lab is open). Tools:
//   move  — drag vertices; a tap on a vertex or an edge reports it
//   draw  — tap empty space for a new vertex, drag from one vertex to another for an edge
//   erase — tap a vertex or an edge to delete it
// Parallel edges (Königsberg's bridges) are drawn as arcs that fan out.

export type Tool = "move" | "draw" | "erase";

export const VR = 11;                       // vertex radius, viewBox units
export const letter = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `v${i + 1}`);

/** For each edge: its end points and, for a parallel edge, the control point of its arc. */
export function edgeShapes(g: Graph) {
  const groups = new Map<string, number[]>();
  g.edges.forEach(([a, b], i) => {
    const k = a < b ? `${a},${b}` : `${b},${a}`;
    groups.set(k, [...(groups.get(k) ?? []), i]);
  });
  return g.edges.map(([a, b], i) => {
    const p = g.pts[a], q = g.pts[b];
    const k = a < b ? `${a},${b}` : `${b},${a}`, grp = groups.get(k)!;
    const j = grp.indexOf(i), off = (j - (grp.length - 1) / 2) * 30 * (a < b ? 1 : -1);
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, L = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const c = off ? { x: mx - ((q.y - p.y) / L) * off, y: my + ((q.x - p.x) / L) * off } : null;
    // label spot: a bit before the middle, so two crossing diagonals do not stack their labels
    const mid = c ? { x: (p.x + 2 * c.x + q.x) / 4, y: (p.y + 2 * c.y + q.y) / 4 } : { x: p.x + (q.x - p.x) * 0.4, y: p.y + (q.y - p.y) * 0.4 };
    const d = c ? `M${p.x},${p.y} Q${c.x},${c.y} ${q.x},${q.y}` : `M${p.x},${p.y} L${q.x},${q.y}`;
    return { p, q, c, mid, d };
  });
}

function distToSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2, 0, 1);
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

type Hit = { kind: "v"; i: number } | { kind: "e"; i: number } | { kind: "bg" };

export function GraphView({
  g, setG, tool = "move", multi = false, W = 560, H = 300, maxV = 14,
  vColor, vRing, vText, vSub, eColor, eWidth, eDash, eLabel, onVertex, onEdge, under, over, dim,
}: {
  g: Graph;
  setG?: (g: Graph) => void;
  tool?: Tool;
  /** Drawing an edge between two already joined vertices adds a parallel edge. */
  multi?: boolean;
  W?: number; H?: number;
  maxV?: number;
  vColor?: (i: number) => string;
  /** A coloured ring around the vertex (amber for odd degree, …). */
  vRing?: (i: number) => string | undefined;
  vText?: (i: number) => string;
  /** Small text beside the vertex. */
  vSub?: (i: number) => string | undefined;
  eColor?: (i: number) => string;
  eWidth?: (i: number) => number;
  eDash?: (i: number) => string | undefined;
  eLabel?: (i: number) => string | undefined;
  onVertex?: (i: number) => void;
  onEdge?: (i: number) => void;
  /** Drawn under the edges (face shading) and over everything (labels). */
  under?: ReactNode;
  over?: ReactNode;
  /** Vertices drawn faded. */
  dim?: (i: number) => boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const press = useRef<{ hit: Hit; p0: Pt; moved: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ from: number; to: Pt } | null>(null);
  const shapes = edgeShapes(g);

  const hitAt = (p: Pt): Hit => {
    let best = -1, bd = VR + 6;
    g.pts.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) return { kind: "v", i: best };
    let be = -1, ed = 9;
    shapes.forEach((s, i) => {
      let d: number;
      if (!s.c) d = distToSeg(p, s.p, s.q);
      else {
        d = Infinity;
        let prev = s.p;
        for (let k = 1; k <= 12; k++) {
          const t = k / 12, u = 1 - t;
          const cur = { x: u * u * s.p.x + 2 * u * t * s.c.x + t * t * s.q.x, y: u * u * s.p.y + 2 * u * t * s.c.y + t * t * s.q.y };
          d = Math.min(d, distToSeg(p, prev, cur));
          prev = cur;
        }
      }
      if (d < ed) { ed = d; be = i; }
    });
    return be >= 0 ? { kind: "e", i: be } : { kind: "bg" };
  };

  const removeVertex = (v: number): Graph => ({
    pts: g.pts.filter((_, i) => i !== v),
    edges: g.edges.filter(([a, b]) => a !== v && b !== v).map(([a, b]) => [a > v ? a - 1 : a, b > v ? b - 1 : b]),
  });

  const handlers = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (!ref.current) return;
      const p = svgPoint(ref.current, e), hit = hitAt(p);
      if (tool === "move" && hit.kind === "bg") return;
      e.preventDefault();
      ref.current.setPointerCapture(e.pointerId);
      press.current = { hit, p0: p, moved: false };
      if (tool === "draw" && hit.kind === "v") setGhost({ from: hit.i, to: p });
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      const pr = press.current;
      if (!pr || !ref.current) return;
      const p = svgPoint(ref.current, e);
      if (Math.hypot(p.x - pr.p0.x, p.y - pr.p0.y) > 4) pr.moved = true;
      if (tool === "move" && pr.hit.kind === "v" && setG && pr.moved) {
        const i = pr.hit.i, pts = g.pts.map((q, k) => (k === i ? { x: clamp(p.x, VR + 2, W - VR - 2), y: clamp(p.y, VR + 2, H - VR - 2) } : q));
        setG({ pts, edges: g.edges });
      }
      if (tool === "draw" && pr.hit.kind === "v") setGhost({ from: pr.hit.i, to: p });
    },
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => {
      const pr = press.current;
      press.current = null;
      setGhost(null);
      if (!pr || !ref.current) return;
      const p = svgPoint(ref.current, e), hit = pr.hit;
      if (tool === "move" && !pr.moved) {
        if (hit.kind === "v") onVertex?.(hit.i);
        if (hit.kind === "e") onEdge?.(hit.i);
      }
      if (tool === "draw" && setG) {
        if (hit.kind === "bg" && !pr.moved && g.pts.length < maxV) setG({ pts: [...g.pts, { x: clamp(p.x, VR + 2, W - VR - 2), y: clamp(p.y, VR + 2, H - VR - 2) }], edges: g.edges });
        if (hit.kind === "v") {
          const end = hitAt(p);
          if (end.kind === "v" && end.i !== hit.i) {
            const a = hit.i, b = end.i;
            const dup = g.edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
            if (!dup || multi) setG({ pts: g.pts, edges: [...g.edges, [a, b]] });
          } else if (!pr.moved) onVertex?.(hit.i);
        }
        if (hit.kind === "e" && !pr.moved) onEdge?.(hit.i);
      }
      if (tool === "erase" && setG && !pr.moved) {
        if (hit.kind === "v") setG(removeVertex(hit.i));
        if (hit.kind === "e") setG({ pts: g.pts, edges: g.edges.filter((_, k) => k !== hit.i) });
      }
    },
    onPointerCancel: () => { press.current = null; setGhost(null); },
    style: { touchAction: tool === "move" && !setG ? ("pan-y" as const) : ("none" as const) },
  };

  return (
    <svg ref={ref} {...handlers} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {under}
      {shapes.map((s, i) => (
        <path key={i} d={s.d} fill="none" stroke={eColor?.(i) ?? C.muted} strokeWidth={eWidth?.(i) ?? 2.2}
          strokeDasharray={eDash?.(i)} strokeLinecap="round" />
      ))}
      {eLabel && shapes.map((s, i) => {
        const l = eLabel(i);
        return l ? (
          <g key={`l${i}`}>
            <circle cx={s.mid.x} cy={s.mid.y} r={7.5} fill={C.bg} stroke={eColor?.(i) ?? C.muted} strokeWidth={1.2} />
            <text x={s.mid.x} y={s.mid.y + 3} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={eColor?.(i) ?? C.muted}>{l}</text>
          </g>
        ) : null;
      })}
      {ghost && <line x1={g.pts[ghost.from].x} y1={g.pts[ghost.from].y} x2={ghost.to.x} y2={ghost.to.y} stroke={C.amber} strokeWidth={2} strokeDasharray="4 4" />}
      {g.pts.map((p, i) => {
        const ring = vRing?.(i), sub = vSub?.(i);
        return (
          <g key={i} opacity={dim?.(i) ? 0.35 : 1}>
            {ring && <circle cx={p.x} cy={p.y} r={VR + 4} fill="none" stroke={ring} strokeWidth={2.4} />}
            <circle cx={p.x} cy={p.y} r={VR} fill={vColor?.(i) ?? C.sky} stroke={C.bg} strokeWidth={2} />
            <text x={p.x} y={p.y + 3.4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">{vText?.(i) ?? letter(i)}</text>
            {sub && <text x={p.x + VR + 4} y={p.y - VR + 1} fontSize={9} fontWeight={700} fill={ring ?? C.muted}>{sub}</text>}
          </g>
        );
      })}
      {over}
    </svg>
  );
}
