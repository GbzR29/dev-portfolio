"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// How much of an object survives the fog at distance d — the visibility
// f(d), used as  colour = mix(fogColour, objectColour, f):
//   linear  f = (end − d) / (end − start), clamped
//   exp     f = e^(−ρ·d)                     (uniform medium: Beer–Lambert)
//   exp²    f = e^(−(ρ·d)²)                  (clear near, thick far)
//   height  density ρ(y) = a·e^(−b·y), integrated along a ray with slope s:
//           f = exp(−(a/b)·e^(−b·y₀)·(1 − e^(−b·s·d)) / s)
// Under the plot, a strip per curve paints the result over distance.

const W = 560, PH = 150, PAD = 44, STRIP = 16;
const MODES = [
  { id: "linear", color: "#94a3b8" },
  { id: "exp", color: "#3b82f6" },
  { id: "exp²", color: "#a855f7" },
  { id: "height", color: "#22c55e" },
] as const;

export function FogCurveFigure({ t }: { t?: TrackTranslations }) {
  const [start, setStart] = useState(10);
  const [end, setEnd] = useState(80);
  const [rho, setRho] = useState(0.025);
  const [pitch, setPitch] = useState(4);          // view slope in degrees, for height fog
  const [falloff, setFalloff] = useState(0.15);
  const [on, setOn] = useState<Record<string, boolean>>({ linear: true, exp: true, "exp²": true, height: true });
  const D = 120, camY = 2;

  const vis = (mode: string, d: number) => {
    if (mode === "linear") return Math.max(0, Math.min(1, (end - d) / (end - start)));
    if (mode === "exp") return Math.exp(-rho * d);
    if (mode === "exp²") return Math.exp(-((rho * d) ** 2));
    const s = Math.sin((pitch * Math.PI) / 180), b = falloff, a = rho * 2.2;
    const opt = Math.abs(s) < 1e-4
      ? a * Math.exp(-b * camY) * d                                   // horizontal ray: constant density
      : (a / b) * Math.exp(-b * camY) * (1 - Math.exp(-b * s * d)) / s;
    return Math.exp(-opt);
  };
  const X = (d: number) => PAD + (d / D) * (W - 2 * PAD), Y = (f: number) => 10 + (1 - f) * (PH - 20);
  const obj = [205, 120, 60], fog = [170, 182, 200];
  const H = PH + 12 + MODES.length * (STRIP + 4) + 6;

  const btn = (a: boolean, c: string) => ({ className: `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${a ? "bg-[var(--primary-low)]" : "opacity-50"} border-[var(--border)]`, style: { color: c } });

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figFog_title", "Fog Curves — How Much Survives at Distance d")}
        </span>
        <div className="flex gap-1.5">{MODES.map(m => <button key={m.id} {...btn(on[m.id], m.color)} onClick={() => setOn(o => ({ ...o, [m.id]: !o[m.id] }))}>{m.id}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Fog curves">
          {[0, 0.5, 1].map(v => <line key={v} x1={PAD} y1={Y(v)} x2={W - PAD} y2={Y(v)} stroke="var(--code-line)" />)}
          {[0, 30, 60, 90, 120].map(d => <text key={d} x={X(d)} y={PH + 6} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">{d}</text>)}
          <text x={PAD - 4} y={Y(1) + 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">1</text>
          <text x={PAD - 4} y={Y(0) + 3} textAnchor="end" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">0</text>
          {on.linear && <><line x1={X(start)} y1={10} x2={X(start)} y2={PH - 10} stroke="#94a3b8" strokeDasharray="2 3" opacity={0.6} /><line x1={X(end)} y1={10} x2={X(end)} y2={PH - 10} stroke="#94a3b8" strokeDasharray="2 3" opacity={0.6} /></>}
          {MODES.filter(m => on[m.id]).map(m => (
            <path key={m.id} fill="none" stroke={m.color} strokeWidth={2}
              d={Array.from({ length: 241 }, (_, i) => { const d = (i / 240) * D; return `${i ? "L" : "M"}${X(d).toFixed(1)},${Y(vis(m.id, d)).toFixed(1)}`; }).join(" ")} />
          ))}
          {MODES.map((m, r) => (
            <g key={m.id} transform={`translate(0, ${PH + 12 + r * (STRIP + 4)})`} opacity={on[m.id] ? 1 : 0.25}>
              {Array.from({ length: 96 }, (_, i) => {
                const d = ((i + 0.5) / 96) * D, f = vis(m.id, d);
                const c = obj.map((o, k) => Math.round(fog[k] + (o - fog[k]) * f));
                return <rect key={i} x={X((i / 96) * D)} y={0} width={(W - 2 * PAD) / 96 + 0.5} height={STRIP} fill={`rgb(${c.join(",")})`} />;
              })}
              <text x={PAD - 4} y={STRIP - 4} textAnchor="end" fontSize="8" fontFamily="monospace" fill={m.color}>{m.id}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="p-4 md:p-5 space-y-2">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["linear start", start, setStart, 0, 60, 1], ["linear end", end, setEnd, 20, 120, 1], ["density ρ", rho, setRho, 0.002, 0.08, 0.001], ["height falloff b", falloff, setFalloff, 0.02, 0.6, 0.01], ["view pitch (°)", pitch, setPitch, -10, 30, 1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-28">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-12 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figFog_note", "Linear fog has hard start and end points you can see as a line on the ground. Exponential fog is what a uniform medium really does: each metre absorbs the same fraction. Exp² keeps the foreground crisp and thickens quickly. Height fog is dense near the ground and thin above. Look up (raise the pitch) and the same distance crosses much less fog, which is how valleys fill with mist while mountain tops stay clear.")}
        </p>
      </div>
    </FigureShell>
  );
}
