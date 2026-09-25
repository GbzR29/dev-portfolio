"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// A phase function p(θ) says how much of the light a particle scatters into
// each direction, θ being the angle between the light's direction of travel
// and the scattered direction. Plotted in polar form around the particle:
// light arrives from the left; distance from the centre = p(θ).
//   Rayleigh (molecules, λ ≫ size): symmetric, as much forward as back
//   Henyey–Greenstein with g: g > 0 forward (haze, fog, clouds), g < 0 back

const W = 520, H = 260, CX = 250, CY = 130;
const rayleigh = (mu: number) => (3 / (16 * Math.PI)) * (1 + mu * mu);
const hg = (mu: number, g: number) => (1 - g * g) / (4 * Math.PI * Math.pow(1 + g * g - 2 * g * mu, 1.5));

export function PhaseFigure({ t }: { t?: TrackTranslations }) {
  const [g, setG] = useState(0.6);
  const [scale, setScale] = useState(1.2);
  const plot = (f: (mu: number) => number) => {
    const pts = Array.from({ length: 361 }, (_, i) => {
      const th = (i / 360) * Math.PI * 2, rr = Math.min(Math.log1p(f(Math.cos(th)) * 40) * 42 * scale, 240);   // log-compressed radius
      return `${(CX + Math.cos(th) * rr).toFixed(1)},${(CY - Math.sin(th) * rr).toFixed(1)}`;
    });
    return pts.join(" ");
  };
  const fwd = hg(1, g), back = hg(-1, g);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPhase_title", "Phase Functions — Where Scattered Light Goes")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Phase functions">
          <line x1={20} y1={CY} x2={W - 20} y2={CY} stroke="var(--code-line)" />
          <Arrow a={{ x: 30, y: CY }} b={{ x: CX - 12, y: CY }} color="#f59e0b" w={2.2} />
          <Label x={32} y={CY - 10} size={8} color="#f59e0b">{tx(t, "figPhase_in", "incoming light")}</Label>
          <polygon points={plot(rayleigh)} fill="#3b82f6" fillOpacity={0.12} stroke="#3b82f6" strokeWidth={1.6} />
          <polygon points={plot(mu => hg(mu, g))} fill="#22c55e" fillOpacity={0.12} stroke="#22c55e" strokeWidth={1.8} />
          <circle cx={CX} cy={CY} r={4} fill="white" />
          <Label x={W - 30} y={CY - 8} anchor="end" size={8}>{tx(t, "figPhase_fwd", "forward (θ = 0)")}</Label>
          <Label x={24} y={CY + 18} size={8}>{tx(t, "figPhase_back", "back (θ = 180°)")}</Label>
          <Label x={W - 30} y={24} anchor="end" size={8} color="#3b82f6">Rayleigh</Label>
          <Label x={W - 30} y={40} anchor="end" size={8} color="#22c55e">{`Henyey–Greenstein, g = ${g}`}</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["anisotropy g", g, setG, -0.9, 0.95, 0.01], ["plot scale", scale, setScale, 0.5, 2, 0.05]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figPhase_note", "Air molecules scatter symmetrically, which is why the whole sky glows evenly blue. Water droplets and dust are comparable in size to the light's wavelength and scatter strongly forward (g ≈ 0.7–0.9), which is why fog glows around the sun and light shafts brighten dramatically when you look toward the light. The radius is drawn on a logarithmic scale; the real forward peak is far taller.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div>HG forward p(0°) = {fwd.toFixed(3)}</div>
          <div>HG back p(180°) = {back.toFixed(3)}</div>
          <div className="text-[var(--primary)]">{tx(t, "figPhase_ratio", "forward/back")} = {(fwd / back).toFixed(1)}×</div>
          <div className="text-[var(--code-muted)] mt-1">Rayleigh: 1×</div>
        </div>
      </div>
    </figure>
  );
}
