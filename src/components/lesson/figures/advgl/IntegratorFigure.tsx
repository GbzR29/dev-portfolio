"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Three ways to advance x'' = −ω²x (a mass on a spring) by a fixed step dt,
// against the exact answer x = cos(ωt). Left: position over time. Right: the
// phase portrait (x, v/ω), where the exact motion is a circle — energy is the
// squared radius. Explicit Euler spirals outward (gains energy every step),
// semi-implicit Euler and Verlet stay on a closed orbit.

const W = 560, H = 210, LW = 330, RW = 190, GAP = 40, T_END = 12;
const METHODS = [
  { id: "explicit", label: "explicit Euler", color: "#ef4444" },
  { id: "semi", label: "semi-implicit Euler", color: "#22c55e" },
  { id: "verlet", label: "velocity Verlet", color: "#3b82f6" },
] as const;
type Id = (typeof METHODS)[number]["id"];

function simulate(id: Id, dt: number, w: number) {
  const a = (x: number) => -w * w * x;
  let x = 1, v = 0;
  const out: [number, number, number][] = [[0, x, v]];
  for (let t = dt; t <= T_END + 1e-9; t += dt) {
    if (id === "explicit") { const ax = a(x); x += v * dt; v += ax * dt; }           // both from the old state
    else if (id === "semi") { v += a(x) * dt; x += v * dt; }                        // new velocity moves the position
    else { const a0 = a(x); x += v * dt + 0.5 * a0 * dt * dt; v += 0.5 * (a0 + a(x)) * dt; }
    out.push([t, x, v]);
    if (Math.abs(x) > 1e3) break;
  }
  return out;
}

export function IntegratorFigure({ t }: { t?: TrackTranslations }) {
  const [dt, setDt] = useState(0.03);
  const [w, setW] = useState(2);
  const [on, setOn] = useState<Record<Id, boolean>>({ explicit: true, semi: true, verlet: false });

  const runs = METHODS.map(m => ({ ...m, pts: simulate(m.id, dt, w) }));
  const Xt = (tt: number) => 10 + (tt / T_END) * (LW - 20);
  const Yx = (x: number) => H / 2 - Math.max(-50, Math.min(50, x)) * (H / 2 - 12) / 2.6;
  const R0 = LW + GAP + RW / 2, RS = (RW / 2 - 8) / 2.6;
  const Px = (x: number) => R0 + Math.max(-50, Math.min(50, x)) * RS;
  const Pv = (v: number) => H / 2 - Math.max(-50, Math.min(50, v / w)) * RS;
  const exact = Array.from({ length: 400 }, (_, i) => { const tt = (i / 399) * T_END; return `${i ? "L" : "M"} ${Xt(tt).toFixed(1)} ${Yx(Math.cos(w * tt)).toFixed(1)}`; }).join(" ");
  const energy = (x: number, v: number) => 0.5 * v * v + 0.5 * w * w * x * x;
  const E0 = 0.5 * w * w;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figInteg_title", "Integrators — Same Spring, Same dt, Different Futures")}
        </span>
        <div className="flex gap-3 flex-wrap text-[10px] font-mono">
          {METHODS.map(m => (
            <label key={m.id} className="flex items-center gap-1.5" style={{ color: m.color }}>
              <input type="checkbox" checked={on[m.id]} onChange={e => setOn({ ...on, [m.id]: e.target.checked })} className="accent-[var(--primary)]" />{m.label}
            </label>
          ))}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Integrator comparison">
          <defs>
            <clipPath id="integT"><rect x={4} y={4} width={LW - 8} height={H - 8} /></clipPath>
            <clipPath id="integP"><rect x={R0 - RW / 2} y={4} width={RW} height={H - 8} /></clipPath>
          </defs>
          <line x1={10} y1={H / 2} x2={LW - 10} y2={H / 2} stroke="var(--code-line)" />
          <line x1={10} y1={Yx(1)} x2={LW - 10} y2={Yx(1)} stroke="var(--code-line)" strokeDasharray="2 3" />
          <line x1={10} y1={Yx(-1)} x2={LW - 10} y2={Yx(-1)} stroke="var(--code-line)" strokeDasharray="2 3" />
          <path d={exact} fill="none" stroke="var(--code-muted)" strokeWidth={2.4} opacity={0.6} />
          <circle cx={R0} cy={H / 2} r={RS} fill="none" stroke="var(--code-muted)" strokeWidth={2.4} opacity={0.6} />
          <line x1={R0 - RW / 2 + 6} y1={H / 2} x2={R0 + RW / 2 - 6} y2={H / 2} stroke="var(--code-line)" />
          <line x1={R0} y1={10} x2={R0} y2={H - 10} stroke="var(--code-line)" />
          {runs.filter(m => on[m.id]).map(m => (
            <g key={m.id}>
              <g clipPath="url(#integT)">
                <polyline points={m.pts.map(([tt, x]) => `${Xt(tt).toFixed(1)},${Yx(x).toFixed(1)}`).join(" ")} fill="none" stroke={m.color} strokeWidth={1.5} />
                {m.pts.map(([tt, x], i) => i % Math.max(1, Math.round(0.5 / dt)) === 0 && <circle key={i} cx={Xt(tt)} cy={Yx(x)} r={1.6} fill={m.color} />)}
              </g>
              <polyline clipPath="url(#integP)" points={m.pts.map(([, x, v]) => `${Px(x).toFixed(1)},${Pv(v).toFixed(1)}`).join(" ")} fill="none" stroke={m.color} strokeWidth={1.2} opacity={0.9} />
            </g>
          ))}
          <Label x={12} y={18} size={8}>x(t)</Label>
          <Label x={LW - 12} y={H - 6} anchor="end" size={8}>{`t = 0 … ${T_END} s`}</Label>
          <Label x={R0 - RW / 2 + 4} y={18} size={8}>{"phase (x, v/ω)"}</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["dt (s)", dt, setDt, 0.01, 0.6, 0.01], ["ω (rad/s)", w, setW, 0.5, 4, 0.1]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figInteg_note", "Explicit Euler moves the position with the old velocity, so every step overshoots a little outward and the energy grows by a factor (1 + ω²dt²) per step. Swapping two lines (velocity first, then position) gives semi-implicit Euler, which keeps the orbit closed for any stable dt. Past ω·dt = 2 even that explodes: small steps still matter.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div className="text-[var(--code-muted)]">{tx(t, "figInteg_energy", "energy after 12 s")}</div>
          {runs.map(m => {
            const last = m.pts[m.pts.length - 1];
            const e = energy(last[1], last[2]) / E0;
            return <div key={m.id}><span style={{ color: m.color }}>{m.label}</span>: {e > 999 ? "∞" : `${(e * 100).toFixed(0)}%`}</div>;
          })}
          <div className="text-[var(--code-muted)] mt-1">ω·dt = {(w * dt).toFixed(2)}</div>
        </div>
      </div>
    </FigureShell>
  );
}
