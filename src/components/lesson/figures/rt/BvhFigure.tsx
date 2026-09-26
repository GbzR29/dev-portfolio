"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A bounding volume hierarchy over 64 small boxes, built top-down by splitting
// each node's primitives at the median of its longest axis. A ray (drag its
// ends) is traversed: a node is opened only if the ray hits its box. The
// counters compare box + primitive tests against testing every primitive.

type Box = { x0: number; y0: number; x1: number; y1: number };
type Node = { box: Box; left?: Node; right?: Node; prims?: number[]; depth: number };
const W = 520, H = 300, N = 64, LEAF = 2;

function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
function makePrims(): Box[] {
  const r = rng(11), out: Box[] = [];
  for (let i = 0; i < N; i++) {
    // clustered, like real scenes: three groups plus scattered ones
    const g = i % 4, cx = g === 0 ? 120 : g === 1 ? 360 : g === 2 ? 250 : 40 + r() * 440, cy = g === 0 ? 90 : g === 1 ? 200 : g === 2 ? 70 : 40 + r() * 220;
    const w = 6 + r() * 14, h = 6 + r() * 14;
    const x = Math.max(8, Math.min(W - w - 8, cx + (r() - 0.5) * 140)), y = Math.max(8, Math.min(H - h - 8, cy + (r() - 0.5) * 110));
    out.push({ x0: x, y0: y, x1: x + w, y1: y + h });
  }
  return out;
}
const union = (a: Box, b: Box): Box => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });
function build(prims: Box[], ids: number[], depth: number): Node {
  const box = ids.map(i => prims[i]).reduce(union);
  if (ids.length <= LEAF) return { box, prims: ids, depth };
  const axis = box.x1 - box.x0 > box.y1 - box.y0 ? "x" : "y";
  const c = (i: number) => (axis === "x" ? prims[i].x0 + prims[i].x1 : prims[i].y0 + prims[i].y1);
  const sorted = [...ids].sort((a, b) => c(a) - c(b));
  const mid = sorted.length >> 1;
  return { box, depth, left: build(prims, sorted.slice(0, mid), depth + 1), right: build(prims, sorted.slice(mid), depth + 1) };
}
// Slab test: the ray is inside the box between the entry and exit parameters on both axes
function rayBox(o: { x: number; y: number }, d: { x: number; y: number }, b: Box, tMax: number) {
  const inv = { x: 1 / d.x, y: 1 / d.y };
  let t0 = (b.x0 - o.x) * inv.x, t1 = (b.x1 - o.x) * inv.x;
  if (t0 > t1) [t0, t1] = [t1, t0];
  let u0 = (b.y0 - o.y) * inv.y, u1 = (b.y1 - o.y) * inv.y;
  if (u0 > u1) [u0, u1] = [u1, u0];
  const enter = Math.max(t0, u0, 0), exit = Math.min(t1, u1, tMax);
  return enter <= exit;
}

export function BvhFigure({ t }: { t?: TrackTranslations }) {
  const prims = useMemo(makePrims, []);
  const root = useMemo(() => build(prims, prims.map((_, i) => i), 0), [prims]);
  const [a, setA] = useState({ x: 20, y: 280 });
  const [b, setB] = useState({ x: 500, y: 40 });
  const [showDepth, setShowDepth] = useState(3);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<"a" | "b" | null>(null);

  const d = { x: b.x - a.x, y: b.y - a.y };
  const visited: Node[] = [];
  const hitPrims = new Set<number>();
  let boxTests = 0, primTests = 0;
  const walk = (n: Node) => {
    boxTests++;
    if (!rayBox(a, d, n.box, 1)) return;
    visited.push(n);
    if (n.prims) { for (const i of n.prims) { primTests++; if (rayBox(a, d, prims[i], 1)) hitPrims.add(i); } return; }
    walk(n.left!); walk(n.right!);
  };
  walk(root);
  const byDepth: Node[] = [];
  const collect = (n: Node) => { if (n.depth === showDepth || n.prims) { if (n.depth <= showDepth) byDepth.push(n); if (n.depth === showDepth) return; } if (n.left) collect(n.left); if (n.right) collect(n.right); };
  collect(root);

  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = svg.current!.getBoundingClientRect();
    const p = { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    (drag.current === "a" ? setA : setB)(p);
  };
  const hues = ["#f59e0b", "#22c55e", "#38bdf8", "#a855f7", "#ec4899", "#eab308", "#14b8a6"];

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figBvh_title", "A Bounding Volume Hierarchy")}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figBvh_hint", "drag the ray's two ends")}</span>
      </div>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-[var(--code-bg)] border-b border-[var(--border)] select-none touch-none"
        onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
        {byDepth.map((n, i) => (
          <rect key={`d${i}`} x={n.box.x0 - 1} y={n.box.y0 - 1} width={n.box.x1 - n.box.x0 + 2} height={n.box.y1 - n.box.y0 + 2}
            fill="none" stroke={hues[n.depth % hues.length]} strokeWidth={1} strokeOpacity={0.55} />
        ))}
        {visited.map((n, i) => (
          <rect key={`v${i}`} x={n.box.x0 - 1} y={n.box.y0 - 1} width={n.box.x1 - n.box.x0 + 2} height={n.box.y1 - n.box.y0 + 2}
            fill="#f8fafc" fillOpacity={0.04} stroke="#f8fafc" strokeWidth={n.prims ? 1.2 : 0.6} strokeOpacity={0.35} />
        ))}
        {prims.map((p, i) => (
          <rect key={i} x={p.x0} y={p.y0} width={p.x1 - p.x0} height={p.y1 - p.y0}
            fill={hitPrims.has(i) ? "#ef4444" : "#64748b"} fillOpacity={hitPrims.has(i) ? 0.9 : 0.55} />
        ))}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fde047" strokeWidth={2} />
        {([["a", a], ["b", b]] as const).map(([k, p]) => (
          <circle key={k} cx={p.x} cy={p.y} r={8} fill="#fde047" className="cursor-grab"
            onPointerDown={e => { drag.current = k; (e.target as Element).setPointerCapture?.(e.pointerId); }} />
        ))}
      </svg>
      <div className="p-4 md:p-5 space-y-3">
        <label className="flex items-center gap-2 max-w-sm">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">show level</span>
          <input type="range" min={0} max={6} step={1} value={showDepth} onChange={e => setShowDepth(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-6 text-right">{showDepth}</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 text-[var(--text-main)]">
            <div>BVH: {boxTests} {tx(t, "figBvh_box", "box tests")} + {primTests} {tx(t, "figBvh_prim", "primitive tests")}</div>
            <div className="text-[var(--primary)]">= {boxTests + primTests} {tx(t, "figBvh_total", "tests")}</div>
          </div>
          <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 text-[var(--text-main)]">
            <div>{tx(t, "figBvh_brute", "brute force")}: {N} {tx(t, "figBvh_prim", "primitive tests")}</div>
            <div className="text-[var(--text-muted)]">{tx(t, "figBvh_hits", "hits")}: {hitPrims.size}</div>
          </div>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figBvh_note", "The coloured outlines are the node boxes at the chosen level: the root holds everything, each level splits a node's boxes in two halves along its longest side. White boxes are the nodes the ray actually opened. A ray that misses a node's box skips its whole subtree at once, so the cost grows like log N instead of N. With 64 primitives the saving is modest. With a million triangles it is the difference between a frame and an hour.")}
        </p>
      </div>
    </FigureShell>
  );
}
