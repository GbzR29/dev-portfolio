"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../svg";
import { tessQuad, tessTri, effective, type Spacing } from "./tessellator";

// ── What this figure shows ────────────────────────────────────────────────────
// The fixed-function tessellator on its own: the abstract domain (a unit quad
// or a barycentric triangle), the tessellation levels the TCS writes, and the
// pattern of gl_TessCoord points and triangles that the TES will be run on.
// Levels move in steps of 0.1, so fractional spacing can be watched sliding.

const W = 300, PAD = 34, S = W - 2 * PAD;
const SPACINGS: Spacing[] = ["equal_spacing", "fractional_odd_spacing", "fractional_even_spacing"];

export function TessDomainFigure({ t }: { t?: TrackTranslations }) {
  const [domain, setDomain] = useState<"quads" | "triangles">("quads");
  const [spacing, setSpacing] = useState<Spacing>("equal_spacing");
  const [inner, setInner] = useState<[number, number]>([4, 4]);
  const [outer, setOuter] = useState<[number, number, number, number]>([2, 5, 3, 8]);
  const [linked, setLinked] = useState(false);

  const quad = domain === "quads";
  const res = quad ? tessQuad(inner, outer, spacing) : tessTri(inner[0], [outer[0], outer[1], outer[2]], spacing);

  // Domain → SVG. Quad: u right, v up. Triangle: corners (1,0,0) bottom-left, (0,1,0) bottom-right, (0,0,1) top.
  const tri = [{ x: PAD, y: PAD + S * 0.9 }, { x: PAD + S, y: PAD + S * 0.9 }, { x: PAD + S / 2, y: PAD + S * 0.9 - S * 0.866 }];
  const toXY = (p: number[]) => quad
    ? { x: PAD + p[0] * S, y: PAD + (1 - p[1]) * S }
    : { x: p[0] * tri[0].x + p[1] * tri[1].x + p[2] * tri[2].x, y: p[0] * tri[0].y + p[1] * tri[1].y + p[2] * tri[2].y };

  const verts = new Map<string, { x: number; y: number }>();
  res.tris.forEach(tr => tr.forEach(p => { const q = toXY(p); verts.set(`${q.x.toFixed(2)},${q.y.toFixed(2)}`, q); }));

  const setAll = (v: number) => { setInner([v, v]); setOuter([v, v, v, v]); };
  const sliders: [string, number, (v: number) => void][] = linked
    ? [["all levels", inner[0], setAll]]
    : [
      ...(quad
        ? [["inner[0]  (u)", inner[0], (v: number) => setInner([v, inner[1]])], ["inner[1]  (v)", inner[1], (v: number) => setInner([inner[0], v])]] as [string, number, (v: number) => void][]
        : [["inner[0]", inner[0], (v: number) => setInner([v, v])]] as [string, number, (v: number) => void][]),
      ...[0, 1, 2, 3].slice(0, quad ? 4 : 3).map(i => [`outer[${i}]`, outer[i], (v: number) => { const o: [number, number, number, number] = [...outer]; o[i] = v; setOuter(o); }] as [string, number, (v: number) => void]),
    ];

  // Where each outer level lives
  const edgeLabels = quad
    ? [{ x: PAD - 6, y: PAD + S / 2, a: "end" as const, s: "outer[0]  u=0" }, { x: PAD + S / 2, y: PAD + S + 18, a: "middle" as const, s: "outer[1]  v=0" },
      { x: PAD + S + 6, y: PAD + S / 2, a: "start" as const, s: "outer[2]  u=1" }, { x: PAD + S / 2, y: PAD - 10, a: "middle" as const, s: "outer[3]  v=1" }]
    : [{ x: (tri[1].x + tri[2].x) / 2 + 8, y: (tri[1].y + tri[2].y) / 2, a: "start" as const, s: "outer[0]  u=0" },
      { x: (tri[2].x + tri[0].x) / 2 - 8, y: (tri[2].y + tri[0].y) / 2, a: "end" as const, s: "outer[1]  v=0" },
      { x: (tri[0].x + tri[1].x) / 2, y: tri[0].y + 18, a: "middle" as const, s: "outer[2]  w=0" }];

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const segInfo = (l: number) => { const e = effective(l, spacing); return e.count; };

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figTessDom_title", "The Tessellator — Levels In, gl_TessCoord Out")}
        </span>
        <div className="flex gap-1.5">{(["quads", "triangles"] as const).map(d => <button key={d} className={btn(domain === d)} onClick={() => setDomain(d)}>{d}</button>)}</div>
      </div>
      <div className="grid md:grid-cols-[1fr_1fr] bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`-60 -8 ${W + 120} ${W + 10}`} className="w-full h-auto select-none" role="img" aria-label="Tessellation domain">
          {res.tris.map((tr, i) => {
            const [a, b, c] = tr.map(toXY);
            return <polygon key={i} points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`} fill={i % 2 ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.24)"} stroke="#3b82f6" strokeWidth={0.8} strokeLinejoin="round" />;
          })}
          {[...verts.values()].map((v, i) => <circle key={i} cx={v.x} cy={v.y} r={1.8} fill="var(--code-text)" />)}
          {edgeLabels.map(l => <Label key={l.s} x={l.x} y={l.y} anchor={l.a} color="#f59e0b" size={8}>{l.s}</Label>)}
          {quad
            ? <><Label x={PAD - 4} y={PAD + S + 14} anchor="end" size={7.5}>(0,0)</Label><Label x={PAD + S + 4} y={PAD - 4} size={7.5}>(1,1)</Label></>
            : <><Label x={tri[0].x - 4} y={tri[0].y + 4} anchor="end" size={7.5}>(1,0,0)</Label><Label x={tri[1].x + 4} y={tri[1].y + 4} size={7.5}>(0,1,0)</Label><Label x={tri[2].x + 6} y={tri[2].y} size={7.5}>(0,0,1)</Label></>}
        </svg>
        <div className="p-3 border-t md:border-t-0 md:border-l border-[var(--code-border)] font-mono text-[10.5px] leading-relaxed text-[var(--code-text)]">
          <div className="text-[var(--code-muted)]">{"// tessellation control shader"}</div>
          {quad ? (
            <>
              <div>gl_TessLevelInner[0] = <span className="text-[var(--primary)]">{inner[0].toFixed(1)}</span>; <span className="text-[var(--code-muted)]">{`// ${segInfo(inner[0])} seg`}</span></div>
              <div>gl_TessLevelInner[1] = <span className="text-[var(--primary)]">{inner[1].toFixed(1)}</span>; <span className="text-[var(--code-muted)]">{`// ${segInfo(inner[1])} seg`}</span></div>
            </>
          ) : <div>gl_TessLevelInner[0] = <span className="text-[var(--primary)]">{inner[0].toFixed(1)}</span>; <span className="text-[var(--code-muted)]">{`// ${segInfo(inner[0])} seg`}</span></div>}
          {outer.slice(0, quad ? 4 : 3).map((o, i) => (
            <div key={i}>gl_TessLevelOuter[{i}] = <span className="text-[#f59e0b]">{o.toFixed(1)}</span>; <span className="text-[var(--code-muted)]">{`// ${segInfo(o)} seg`}</span></div>
          ))}
          <div className="mt-3 text-[var(--code-muted)]">{"// tessellation evaluation shader"}</div>
          <div>layout ({domain}, {spacing}, ccw) in;</div>
          <div className="mt-3 text-[var(--code-muted)]">{verts.size} {tx(t, "figTessDom_verts", "TES invocations (vertices)")}</div>
          <div className="text-[var(--code-muted)]">{res.tris.length} {tx(t, "figTessDom_tris", "triangles")}</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {SPACINGS.map(s => <button key={s} className={btn(spacing === s)} onClick={() => setSpacing(s)}>{s.replace("_spacing", "")}</button>)}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ml-2">
            <input type="checkbox" checked={linked} onChange={e => { setLinked(e.target.checked); if (e.target.checked) setAll(inner[0]); }} className="accent-[var(--primary)]" />
            {tx(t, "figTessDom_link", "one slider for all levels")}
          </label>
        </div>
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {sliders.map(([label, v, set]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24 whitespace-pre">{label}</span>
              <input type="range" min={1} max={16} step={0.1} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-8 text-right">{v.toFixed(1)}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {spacing === "equal_spacing"
            ? tx(t, "figTessDom_equalNote", "Equal spacing rounds each level up to an integer and splits the edge evenly. Drag a level slowly: nothing happens until it crosses an integer, then vertices pop in all at once. On a mesh that pop is visible as the camera moves. Outer levels only control their own edge; the inner levels fill the middle with rings.")
            : tx(t, "figTessDom_fracNote", "Fractional spacing uses the real value. The edge gets n − 2 segments of length 1/level plus two shorter ones that grow smoothly from zero. Drag a level slowly and watch a new vertex pair slide out of a point instead of popping in. odd always has an odd segment count, even an even one.")}
        </p>
      </div>
    </figure>
  );
}
