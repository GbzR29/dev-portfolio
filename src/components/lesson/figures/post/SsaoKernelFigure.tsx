"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// SSAO in a 2D slice. The camera looks straight down, so the depth buffer is
// just the visible height of the scene at each x. Around the chosen point p we
// scatter samples in a hemisphere oriented by the normal; a sample counts as
// occluded when it lies below the stored depth at its own x. The fraction of
// free samples is the ambient-occlusion factor.
//   • Without the range check, a floor point next to a tall box is darkened by
//     samples "under" the box top — the classic dark halo.
//   • Sphere sampling (the original Crytek approach) sees half of its samples
//     under any flat floor, so flat surfaces come out 50% grey.

const W = 480, H = 250, BASE = 190;
type P = { x: number; y: number };

/** Visible height (the "depth buffer") at x — a groove, a floor and a tall box. */
const height = (x: number) => {
  if (x > 110 && x < 190) return -38 * (1 - Math.abs(x - 150) / 40);    // V-groove
  if (x >= 300 && x <= 380) return 110;                                  // box top
  return 0;
};
const normalAt = (x: number): P => {
  const d = (height(x + 1) - height(x - 1)) / 2;
  const l = Math.hypot(d, 1);
  return { x: -d / l, y: 1 / l };
};
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function SsaoKernelFigure({ t }: { t?: TrackTranslations }) {
  const [px, setPx] = useState(150);
  const [radius, setRadius] = useState(55);
  const [count, setCount] = useState(24);
  const [range, setRange] = useState(true);
  const [hemi, setHemi] = useState(true);
  const [accel, setAccel] = useState(true);
  const [seed, setSeed] = useState(3);

  const p: P = { x: px, y: height(px) + 0.5 };
  const n = normalAt(px);
  const samples = useMemo(() => {
    const r = rng(seed * 7919 + 17);
    const rot = r() * Math.PI * 2;                     // the per-pixel random rotation
    const out: { s: P; occ: number; rejected: boolean }[] = [];
    for (let i = 0; i < count; i++) {
      // Direction: hemisphere around n, or the full circle
      const a = hemi ? (Math.atan2(n.y, n.x) + (r() - 0.5) * Math.PI * 0.98) : rot + r() * Math.PI * 2;
      let len = r();
      if (accel) { const k = i / count; len *= 0.1 + 0.9 * k * k; }   // more samples close to p
      const s = { x: p.x + Math.cos(a) * len * radius, y: p.y + Math.sin(a) * len * radius };
      const depth = height(s.x);
      const below = s.y < depth - 0.5;
      // Range check: occluders far away in depth should not count
      const w = range ? Math.min(1, Math.max(0, radius / Math.max(1e-3, Math.abs(p.y - depth)))) ** 2 : 1;
      out.push({ s, occ: below ? w : 0, rejected: below && w < 0.5 });
    }
    return out;
  }, [p.x, p.y, n.x, n.y, radius, count, range, hemi, accel, seed]);

  const ao = 1 - samples.reduce((a, s) => a + s.occ, 0) / samples.length;
  const sx = (x: number) => x, sy = (y: number) => BASE - y;

  const ground = [`M 0 ${H}`, ...Array.from({ length: W + 1 }, (_, x) => `L ${x} ${sy(height(x))}`), `L ${W} ${H} Z`].join(" ");

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSsaoK_title", "SSAO in a Slice — Samples Tested Against the Depth Buffer")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none cursor-crosshair" role="img" aria-label="SSAO sample kernel"
          onPointerDown={e => { const r = e.currentTarget.getBoundingClientRect(); setPx(Math.round(Math.min(W - 8, Math.max(8, ((e.clientX - r.left) / r.width) * W)))); }}
          onPointerMove={e => { if (!e.buttons) return; const r = e.currentTarget.getBoundingClientRect(); setPx(Math.round(Math.min(W - 8, Math.max(8, ((e.clientX - r.left) / r.width) * W)))); }}>
          {/* camera */}
          <text x={W / 2} y={16} fill="var(--code-muted)" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
            {tx(t, "figSsaoK_cam", "camera ↓ (the depth buffer stores the top surface)")}
          </text>
          <path d={ground} fill="var(--code-line)" opacity={0.9} />
          <path d={Array.from({ length: W + 1 }, (_, x) => `${x ? "L" : "M"} ${x} ${sy(height(x))}`).join(" ")} fill="none" stroke="var(--code-muted)" strokeWidth={1.5} />
          {/* the hidden space under the box top is "solid" as far as the depth buffer knows */}
          <rect x={300} y={sy(110)} width={80} height={110} fill="rgba(148,163,184,0.25)" />
          <text x={340} y={sy(55)} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">box</text>

          <circle cx={sx(p.x)} cy={sy(p.y)} r={radius} fill="none" stroke="var(--code-muted)" strokeDasharray="3 3" opacity={0.6} />
          {samples.map((s, i) => (
            <g key={i}>
              <line x1={sx(p.x)} y1={sy(p.y)} x2={sx(s.s.x)} y2={sy(s.s.y)} stroke={s.rejected ? "#f59e0b" : s.occ > 0 ? "#ef4444" : "#22c55e"} strokeWidth={0.5} opacity={0.35} />
              <circle cx={sx(s.s.x)} cy={sy(s.s.y)} r={2.6} fill={s.rejected ? "#f59e0b" : s.occ > 0 ? "#ef4444" : "#22c55e"} opacity={0.9} />
            </g>
          ))}
          <Arrow a={{ x: sx(p.x), y: sy(p.y) }} b={{ x: sx(p.x + n.x * 34), y: sy(p.y + n.y * 34) }} color="#3b82f6" w={1.8} />
          <circle cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill="var(--text-main)" />
          <Label x={sx(p.x) + 6} y={sy(p.y) + 14} color="var(--text-main)" bold>p</Label>
          {/* result swatch */}
          <rect x={W - 70} y={26} width={56} height={30} rx={4} fill={`rgb(${Math.round(ao * 230)},${Math.round(ao * 230)},${Math.round(ao * 230)})`} stroke="var(--code-border)" />
          <text x={W - 42} y={70} fill="var(--code-text)" fontSize="9" fontFamily="monospace" textAnchor="middle">AO = {ao.toFixed(2)}</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["radius", radius, setRadius, 10, 90, 1], ["samples", count, setCount, 4, 64, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <div className="flex gap-3 flex-wrap text-[10px] font-mono text-[var(--text-muted)]">
            {([["range check", range, setRange], ["hemisphere (vs sphere)", hemi, setHemi], ["more samples near p", accel, setAccel]] as const).map(([l, v, s]) => (
              <label key={l} className="flex items-center gap-1.5"><input type="checkbox" checked={v} onChange={e => s(e.target.checked)} className="accent-[var(--primary)]" />{l}</label>
            ))}
            <button onClick={() => setSeed(s => s + 1)} className="px-2 py-0.5 rounded border border-[var(--border)] hover:text-[var(--primary)]">
              {tx(t, "figSsaoK_reroll", "new random rotation")}
            </button>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figSsaoK_note", "Click or drag to move p. In the groove, many samples fall under the surface — a crease is darker. On the box top, almost none do. Put p on the floor just left of the box and switch the range check off: the samples under the box top count as blockers even though the box is far above — the dark halo that the range check removes.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[190px]">
          <div><span className="text-[#22c55e]">●</span> {tx(t, "figSsaoK_free", "free")}: {samples.filter(s => s.occ === 0 && !s.rejected).length}</div>
          <div><span className="text-[#ef4444]">●</span> {tx(t, "figSsaoK_occ", "occluded")}: {samples.filter(s => s.occ > 0 && !s.rejected).length}</div>
          <div><span className="text-[#f59e0b]">●</span> {tx(t, "figSsaoK_rej", "rejected by range")}: {samples.filter(s => s.rejected).length}</div>
          <div className="mt-1">AO = 1 − Σ occ / N = <span className="text-[var(--primary)]">{ao.toFixed(3)}</span></div>
        </div>
      </div>
    </figure>
  );
}
