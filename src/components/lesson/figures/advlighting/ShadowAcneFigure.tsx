"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Shadow acne, in the light's own 2D view. The horizontal axis runs across the
// shadow map, the vertical axis is depth from the light. A sloped surface has
// a depth that changes inside every texel, but each texel stores just ONE
// value (sampled at its centre). Fragments deeper than that stored value fail
// the test and shadow themselves: stripes. A bias pushes the test back.

const W = 440, H = 220, X0 = 20, X1 = W - 20, TOP = 26, BOT = H - 30;

export function ShadowAcneFigure({ t }: { t?: TrackTranslations }) {
  const [texels, setTexels] = useState(8);
  const [slope, setSlope] = useState(0.45);
  const [bias, setBias] = useState(0);

  // Surface depth (0 near the light, 1 far) along the map
  const depthAt = (u: number) => 0.3 + slope * u;
  const y = (d: number) => TOP + d * (BOT - TOP);
  const x = (u: number) => X0 + u * (X1 - X0);
  const tw = 1 / texels;

  // Stored depth per texel (at its centre), and the lit/shadow state of fragments
  const steps = Array.from({ length: texels }, (_, i) => ({ u0: i * tw, u1: (i + 1) * tw, d: depthAt((i + 0.5) * tw) }));
  const SAMPLES = 220;
  const frags = Array.from({ length: SAMPLES }, (_, i) => {
    const u = (i + 0.5) / SAMPLES;
    const stored = steps[Math.min(texels - 1, Math.floor(u / tw))].d;
    const shadow = depthAt(u) - bias > stored;
    return { u, shadow };
  });
  const acnePct = Math.round((frags.filter(f => f.shadow).length / SAMPLES) * 100);
  const maxNeeded = (slope * tw) / 2;           // half a texel's worth of slope

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figAcne_title", "Shadow Acne — Seen From the Light")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Shadow acne diagram">
          {/* The light is above: depth grows downward */}
          <text x={X0} y={14} fill="var(--code-muted)" fontSize="9" fontFamily="monospace">☀ light — depth grows downward ↓</text>

          {/* Texel columns */}
          {steps.map((s, i) => (
            <rect key={i} x={x(s.u0)} y={TOP} width={x(s.u1) - x(s.u0)} height={BOT - TOP}
              fill={i % 2 ? "rgba(148,163,184,0.05)" : "transparent"} stroke="var(--code-line)" strokeWidth="0.5" />
          ))}

          {/* Stored depths: one flat step per texel (with the bias applied to the test) */}
          {steps.map((s, i) => (
            <g key={i}>
              <line x1={x(s.u0)} y1={y(s.d)} x2={x(s.u1)} y2={y(s.d)} stroke="#a855f7" strokeWidth="2" />
              {bias > 0 && <line x1={x(s.u0)} y1={y(s.d + bias)} x2={x(s.u1)} y2={y(s.d + bias)} stroke="#a855f7" strokeWidth="1" strokeDasharray="3 2" opacity={0.7} />}
            </g>
          ))}

          {/* The real surface, coloured by the outcome of the test */}
          {frags.map((f, i) => {
            const u2 = f.u + 1 / SAMPLES;
            return <line key={i} x1={x(f.u - 0.5 / SAMPLES)} y1={y(depthAt(f.u - 0.5 / SAMPLES))} x2={x(u2 - 0.5 / SAMPLES)} y2={y(depthAt(u2 - 0.5 / SAMPLES))}
              stroke={f.shadow ? "#ef4444" : "#fbbf24"} strokeWidth="3.5" strokeLinecap="butt" />;
          })}
          <text x={X1} y={H - 10} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" textAnchor="end">shadow-map texels →</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          {([["texels", texels, setTexels, 3, 24, 1], ["slope", slope, setSlope, 0, 0.7, 0.01], ["bias", bias, setBias, 0, 0.08, 0.001]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-12">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{Number(v).toFixed(label === "texels" ? 0 : 3)}</span>
            </label>
          ))}
          <p className="font-mono text-[11px] text-[var(--text-main)] pt-1">
            <span className="text-red-400">■</span> self-shadowed: <b>{acnePct}%</b>
            <span className="text-[var(--text-muted)]"> · bias needed ≥ {maxNeeded.toFixed(3)}</span>
          </p>
        </div>
        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figAcne_note", "Yellow is lit, red failed the shadow test. Without bias, half of every texel is red — the stripes you see as acne. The steeper the surface, or the bigger the texels, the more bias it takes: half a texel's worth of slope. That is why the chapter's bias grows with 1 − n·l.")}
        </p>
      </div>
    </figure>
  );
}
