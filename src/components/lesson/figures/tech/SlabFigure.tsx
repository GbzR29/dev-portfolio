"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// The slab test for ray vs axis-aligned box, in 2D. A box is the overlap of two
// slabs: the band between its left and right sides (x) and the band between
// its bottom and top (y). The ray crosses each slab over an interval of t:
//   t = (plane − origin) / direction
// Blue is the x interval, green the y interval. The ray is inside the box
// exactly where both hold: from the latest entry to the earliest exit.

const W = 560, H = 300;
type P = { x: number; y: number };
const BOX = { x0: 250, x1: 400, y0: 90, y1: 200 };

export function SlabFigure({ t }: { t?: TrackTranslations }) {
  const [o, setO] = useState<P>({ x: 60, y: 250 });
  const [aim, setAim] = useState<P>({ x: 470, y: 60 });
  const [drag, setDrag] = useState<"o" | "aim" | null>(null);

  const len = Math.hypot(aim.x - o.x, aim.y - o.y) || 1;
  const d = { x: (aim.x - o.x) / len, y: (aim.y - o.y) / len };
  const inv = { x: 1 / d.x, y: 1 / d.y };                           // ±Infinity when parallel: still works
  const tx0 = (BOX.x0 - o.x) * inv.x, tx1 = (BOX.x1 - o.x) * inv.x;
  const ty0 = (BOX.y0 - o.y) * inv.y, ty1 = (BOX.y1 - o.y) * inv.y;
  const [xin, xout] = [Math.min(tx0, tx1), Math.max(tx0, tx1)];
  const [yin, yout] = [Math.min(ty0, ty1), Math.max(ty0, ty1)];
  const tEnter = Math.max(xin, yin), tExit = Math.min(xout, yout);
  const hit = tEnter <= tExit && tExit >= 0;
  const at = (tt: number): P => ({ x: o.x + d.x * tt, y: o.y + d.y * tt });
  const clampT = (tt: number) => Math.max(-2000, Math.min(2000, tt));
  const seg = (a: number, b: number, col: string, off: number, w = 5) => {
    const A = at(clampT(a)), B = at(clampT(b));
    return <line x1={A.x + d.y * off} y1={A.y - d.x * off} x2={B.x + d.y * off} y2={B.y - d.x * off} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={0.85} />;
  };

  const toP = (e: React.PointerEvent<SVGSVGElement>): P => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.max(4, Math.min(W - 4, ((e.clientX - r.left) / r.width) * W)), y: Math.max(4, Math.min(H - 4, ((e.clientY - r.top) / r.height) * H)) };
  };
  const f = (v: number) => (Math.abs(v) > 1e4 ? (v > 0 ? "+∞" : "−∞") : v.toFixed(0));

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSlab_title", "Ray vs Box — the Slab Test")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figSlab_hint", "drag the origin (blue) and the aim point (amber)")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none" role="img" aria-label="Slab test"
          onPointerDown={e => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); const p = toP(e); setDrag(Math.hypot(p.x - o.x, p.y - o.y) < Math.hypot(p.x - aim.x, p.y - aim.y) ? "o" : "aim"); }}
          onPointerMove={e => { if (!drag) return; const p = toP(e); if (drag === "o") setO(p); else setAim(p); }}
          onPointerUp={() => setDrag(null)}>
          {/* slabs */}
          <rect x={BOX.x0} y={0} width={BOX.x1 - BOX.x0} height={H} fill="#3b82f6" opacity={0.08} />
          <rect x={0} y={BOX.y0} width={W} height={BOX.y1 - BOX.y0} fill="#22c55e" opacity={0.08} />
          {[BOX.x0, BOX.x1].map(x => <line key={x} x1={x} y1={0} x2={x} y2={H} stroke="#3b82f6" strokeDasharray="3 4" opacity={0.6} />)}
          {[BOX.y0, BOX.y1].map(y => <line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#22c55e" strokeDasharray="3 4" opacity={0.6} />)}
          <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} fill={hit ? "#f59e0b" : "var(--code-line)"} fillOpacity={hit ? 0.18 : 0.5} stroke={hit ? "#f59e0b" : "var(--code-muted)"} strokeWidth={1.6} />
          {/* ray */}
          <line x1={o.x} y1={o.y} x2={o.x + d.x * 1200} y2={o.y + d.y * 1200} stroke="var(--code-muted)" strokeWidth={1.2} />
          {seg(xin, xout, "#3b82f6", 7)}
          {seg(yin, yout, "#22c55e", -7)}
          {hit && seg(Math.max(tEnter, 0), tExit, "#f59e0b", 0, 4)}
          {[[xin, "#3b82f6"], [xout, "#3b82f6"], [yin, "#22c55e"], [yout, "#22c55e"]].map(([tt, c], i) => Math.abs(tt as number) < 2000 && (
            <circle key={i} cx={at(tt as number).x} cy={at(tt as number).y} r={3.5} fill={c as string} />
          ))}
          <circle cx={o.x} cy={o.y} r={8} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
          <circle cx={aim.x} cy={aim.y} r={6} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
          <Label x={o.x + 10} y={o.y + 16} size={8} color="#3b82f6" bold>origin</Label>
          <Label x={BOX.x0 + 4} y={BOX.y1 - 6} size={8}>box</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figSlab_note", "Each pair of parallel planes gives an entry and an exit parameter. The ray is inside the box only while it is inside both slabs, so the entry into the box is the later of the two entries and the exit the earlier of the two exits. If the latest entry comes after the earliest exit, the intervals do not overlap: miss. Aim the ray so it passes beside the box and watch the blue and green intervals slide apart. In 3D there is one more slab (z) and nothing else changes: six subtractions, six multiplications, a few min/max, no branches.")}
        </p>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[210px]">
          <div><span className="text-[#3b82f6]">x slab</span>: t ∈ [{f(xin)}, {f(xout)}]</div>
          <div><span className="text-[#22c55e]">y slab</span>: t ∈ [{f(yin)}, {f(yout)}]</div>
          <div>t_enter = max = {f(tEnter)}</div>
          <div>t_exit = min = {f(tExit)}</div>
          <div className="mt-1">{hit ? <span className="text-amber-400">hit at t = {f(Math.max(tEnter, 0))}</span> : <span className="text-red-400">miss</span>}</div>
        </div>
      </div>
    </figure>
  );
}
