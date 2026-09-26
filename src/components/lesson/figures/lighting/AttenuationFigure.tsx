"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Point-light falloff F(d) = 1 / (Kc + Kl·d + Kq·d²), with the classic
// range table (from the Ogre3D wiki, as used by LearnOpenGL). The physically
// correct 1/d² is drawn for comparison, and the marker shows where the light
// drops below 5/256 — the last value an 8-bit channel can still show.

const TABLE: [number, number, number][] = [   // distance, linear, quadratic (constant = 1)
  [7, 0.7, 1.8], [13, 0.35, 0.44], [20, 0.22, 0.2], [32, 0.14, 0.07], [50, 0.09, 0.032],
  [65, 0.07, 0.017], [100, 0.045, 0.0075], [160, 0.027, 0.0028], [200, 0.022, 0.0019],
  [325, 0.014, 0.0007], [600, 0.007, 0.0002], [3250, 0.0014, 0.000007],
];
const CUTOFF = 5 / 256;

const W = 420, H = 200, PL = 38, PR = 12, PT = 14, PB = 30;

export function AttenuationFigure({ t }: { t?: TrackTranslations }) {
  const [row, setRow] = useState(3);                 // 32 units
  const [kl, setKl] = useState(TABLE[3][1]);
  const [kq, setKq] = useState(TABLE[3][2]);
  const [showPhys, setShowPhys] = useState(true);
  const kc = 1;
  const range = TABLE[row][0];
  const maxD = range * 1.25;

  const F = (d: number) => 1 / (kc + kl * d + kq * d * d);
  // Physical inverse square, scaled to match F at d = 1 so the shapes compare
  const Fp = (d: number) => Math.min(1, F(1) / Math.max(d * d, 1e-6));

  const x = (d: number) => PL + (d / maxD) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v) * (H - PT - PB);
  const path = (f: (d: number) => number) =>
    Array.from({ length: 121 }, (_, i) => { const d = (i / 120) * maxD; return `${i ? "L" : "M"} ${x(d).toFixed(1)} ${y(f(d)).toFixed(1)}`; }).join(" ");

  // Where F drops under 5/256 (solve Kq d² + Kl d + Kc − 256/5 = 0)
  const disc = kl * kl - 4 * kq * (kc - 1 / CUTOFF);
  const reach = kq > 0 ? (-kl + Math.sqrt(disc)) / (2 * kq) : kl > 0 ? (1 / CUTOFF - kc) / kl : Infinity;

  const pick = (i: number) => { setRow(i); setKl(TABLE[i][1]); setKq(TABLE[i][2]); };

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figAtt_title", "Attenuation — How a Point Light Fades")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Attenuation curve">
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <g key={v}>
              <line x1={PL} y1={y(v)} x2={W - PR} y2={y(v)} stroke="var(--code-line)" />
              <text x={PL - 5} y={y(v) + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">{v}</text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map(k => (
            <text key={k} x={x(k * maxD)} y={H - 12} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">
              {Math.round(k * maxD)}
            </text>
          ))}
          <text x={W - PR} y={H - 2} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">distance d</text>

          {showPhys && <path d={path(Fp)} fill="none" stroke="var(--code-muted)" strokeWidth="1.3" strokeDasharray="4 3" />}
          <path d={path(F)} fill="none" stroke="#f59e0b" strokeWidth="2.2" />

          {/* 8-bit cutoff and where the light stops mattering */}
          <line x1={PL} y1={y(CUTOFF)} x2={W - PR} y2={y(CUTOFF)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2 3" />
          {reach < maxD && (
            <g>
              <line x1={x(reach)} y1={PT} x2={x(reach)} y2={H - PB} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
              <text x={x(reach) + 4} y={PT + 10} fill="#ef4444" fontSize="8.5" fontFamily="monospace">
                {`< 5/256 after d ≈ ${reach.toFixed(1)}`}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2.5 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {tx(t, "figAtt_range", "Presets by range (Kc = 1)")}
          </p>
          <div className="flex gap-1 flex-wrap">
            {TABLE.map(([d], i) => (
              <button key={d} onClick={() => pick(i)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-md border transition-all ${row === i && kl === TABLE[i][1] && kq === TABLE[i][2]
                  ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>{d}</button>
            ))}
          </div>
          {([["Kl", kl, setKl, 0, 1], ["Kq", kq, setKq, 0, 2]] as const).map(([label, v, set, min, max]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-6">{label}</span>
              <input type="range" min={min} max={max} step={0.0001} value={v}
                onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right">{v.toFixed(4)}</span>
            </label>
          ))}
          <button onClick={() => setShowPhys(v => !v)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${showPhys
              ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
              : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            {showPhys ? "✓ " : ""}{tx(t, "figAtt_phys", "compare with physical 1/d²")}
          </button>
        </div>
        <div className="space-y-2 min-w-0">
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`light.constant  = 1.0;
light.linear    = ${kl.toFixed(4)};
light.quadratic = ${kq.toFixed(4)};
// F(${Math.round(range / 2)}) = ${F(range / 2).toFixed(3)}   F(${range}) = ${F(range).toFixed(3)}`}
          </pre>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figAtt_note", "Real light falls off as 1/d², which gets infinite at d = 0 and never quite reaches zero. The three constants tame both ends: Kc keeps F ≤ 1 up close, Kl dominates the middle, Kq takes over far away. Pick the row whose distance matches how far the light should reach — the red line shows where it stops making any visible difference.")}
          </p>
        </div>
      </div>
    </FigureShell>
  );
}
