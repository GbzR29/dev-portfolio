"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { useAnimationTime } from "../kit/gl/GLView";
import { useVisible } from "../kit/figure";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A slice through a water surface. A sine wave only moves points up and down.
// A Gerstner (trochoidal) wave also moves them back and forth, so each surface
// point runs around a small orbit — which is what water particles actually do.
// Points bunch up at the crests (sharp) and spread out in the troughs (flat).
//   x = x₀ + Q·A·cos(θ),  y = A·sin(θ),  θ = k·x₀ − ω·t,  ω = √(g·k)
// At Q·A·k = 1 the crest becomes a cusp; above it the surface loops over itself.

const W = 560, H = 220, PAD = 10;
const G = 9.81;

export function GerstnerFigure({ t }: { t?: TrackTranslations }) {
  const [wl, setWl] = useState(4);          // wavelength (m)
  const [A, setA] = useState(0.35);          // amplitude (m)
  const [q, setQ] = useState(0.8);           // steepness as a fraction of the cusp limit
  const [multi, setMulti] = useState(false);
  const [orbits, setOrbits] = useState(true);
  const [playing, setPlaying] = useState(true);
  const vis = useVisible<HTMLElement>();
  const time = useAnimationTime(playing && vis.on);

  const waves = multi
    ? [{ wl, A, dir: 1, ph: 0 }, { wl: wl * 0.55, A: A * 0.45, dir: 1, ph: 1.3 }, { wl: wl * 0.3, A: A * 0.2, dir: -1, ph: 2.1 }]
    : [{ wl, A, dir: 1, ph: 0 }];
  const span = 12;                           // metres shown
  const X = (x: number) => PAD + (x / span) * (W - 2 * PAD);
  const Y = (y: number) => H / 2 + 10 - y * 110;

  const point = (x0: number, Qf: number) => {
    let x = x0, y = 0;
    for (const w of waves) {
      const k = (2 * Math.PI) / w.wl, om = Math.sqrt(G * k);
      const Q = Qf / (k * w.A * waves.length);                    // share of the cusp limit, split between waves
      const th = w.dir * k * x0 - om * time + w.ph;
      x += Q * w.A * Math.cos(th) * w.dir;
      y += w.A * Math.sin(th);
    }
    return [x, y] as const;
  };
  const N = 600;
  const surf = (Qf: number) => Array.from({ length: N + 1 }, (_, i) => point(-2 + (i / N) * (span + 4), Qf));
  const pathOf = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
  const gerst = surf(q), sine = surf(0);
  const k0 = (2 * Math.PI) / wl;
  const markers = Array.from({ length: 13 }, (_, i) => (i * wl) / 4 - wl);

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell ref={vis.ref}>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figGerst_title", "Sine vs Gerstner — Points Move in Circles")}
        </span>
        <div className="flex gap-1.5">
          <button className={btn(multi)} onClick={() => setMulti(m => !m)}>{multi ? "3 waves" : "1 wave"}</button>
          <button className={btn(false)} onClick={() => setPlaying(p => !p)}>{playing ? "❚❚" : "▶"}</button>
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gerstner wave cross-section">
          <defs><clipPath id="gerstClip"><rect x={PAD} y={0} width={W - 2 * PAD} height={H} /></clipPath></defs>
          <g clipPath="url(#gerstClip)">
            <path d={`${pathOf(gerst)} L${X(span + 2)},${H} L${X(-2)},${H} Z`} fill="#0ea5e9" opacity={0.22} />
            <path d={pathOf(sine)} fill="none" stroke="var(--code-muted)" strokeWidth={1.2} strokeDasharray="4 3" />
            <path d={pathOf(gerst)} fill="none" stroke="#38bdf8" strokeWidth={2.2} />
            {orbits && markers.map((x0, i) => {
              if (multi) return null;
              const Q = q / (k0 * A);
              const [px, py] = point(x0, q);
              return (
                <g key={i}>
                  <ellipse cx={X(x0)} cy={Y(0)} rx={(Q * A / span) * (W - 2 * PAD)} ry={A * 110} fill="none" stroke="#f59e0b" strokeWidth={0.7} opacity={0.55} />
                  <line x1={X(x0)} y1={Y(0)} x2={X(px)} y2={Y(py)} stroke="#f59e0b" strokeWidth={0.7} opacity={0.55} />
                  <circle cx={X(px)} cy={Y(py)} r={3} fill="#f59e0b" />
                </g>
              );
            })}
          </g>
          <text x={W - PAD - 4} y={16} textAnchor="end" fontSize="8.5" fontFamily="monospace" fill="var(--code-muted)">- - {tx(t, "figGerst_sine", "sine, same A and λ")}</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["wavelength λ", wl, setWl, 1.5, 8, 0.1, "m"], ["amplitude A", A, setA, 0.05, 0.8, 0.01, "m"], ["steepness Q·A·k", q, setQ, 0, 1.3, 0.01, ""]] as const).map(([label, v, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-28">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className={`text-[10px] font-mono w-12 text-right ${label.startsWith("steep") && v > 1 ? "text-red-400" : "text-[var(--primary)]"}`}>{v}{unit}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={orbits} onChange={e => setOrbits(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figGerst_orbits", "show particle orbits")}
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {q > 1
              ? tx(t, "figGerst_loopNote", "Past Q·A·k = 1 the crest folds over itself and the surface self-intersects. In a shader this shows up as inverted triangles and black creases. Clamp the steepness, and when you sum waves, split it between them.")
              : tx(t, "figGerst_note", "Each amber point circles around its rest position while the wave passes. That is the whole trick: moving points horizontally toward the crest makes crests sharp and troughs wide, like real deep-water waves, which a sine can never do. Longer waves travel faster (ω = √(g·k)), so a sum of wavelengths never repeats exactly.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div>k = 2π/λ = {k0.toFixed(2)} rad/m</div>
          <div>ω = √(g·k) = {Math.sqrt(G * k0).toFixed(2)} rad/s</div>
          <div>{tx(t, "figGerst_speed", "speed")} c = ω/k = {(Math.sqrt(G * k0) / k0).toFixed(2)} m/s</div>
          <div>{tx(t, "figGerst_period", "period")} T = {(2 * Math.PI / Math.sqrt(G * k0)).toFixed(2)} s</div>
        </div>
      </div>
    </FigureShell>
  );
}
