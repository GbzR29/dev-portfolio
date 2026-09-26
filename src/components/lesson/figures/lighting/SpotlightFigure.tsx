"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A spotlight seen from the side, lighting the floor. Inside the inner cone
// the intensity is 1, outside the outer cone it is 0, and in between it fades
// with I = clamp((cos θ − cos γ) / (cos φ − cos γ), 0, 1). Everything is
// compared as cosines — the shader never calls acos.

const W = 420, H = 230, S = { x: 210, y: 26 }, FLOOR = 200;
const deg = (d: number) => (d * Math.PI) / 180;

export function SpotlightFigure({ t }: { t?: TrackTranslations }) {
  const [inner, setInner] = useState(18);
  const [outer, setOuter] = useState(28);
  const phi = Math.min(inner, outer - 0.5), gamma = outer;
  const cPhi = Math.cos(deg(phi)), cGam = Math.cos(deg(gamma));
  const intensity = (thDeg: number) => {
    const c = Math.cos(deg(thDeg));
    return Math.max(0, Math.min(1, (c - cGam) / (cPhi - cGam)));
  };

  // Floor strip: sample x across the floor, angle from the spot's axis (straight down)
  const h = FLOOR - S.y;
  const cells = Array.from({ length: 140 }, (_, i) => {
    const x0 = 10 + (i / 140) * (W - 20), w = (W - 20) / 140;
    const th = (Math.atan2(Math.abs(x0 + w / 2 - S.x), h) * 180) / Math.PI;
    return { x0, w, I: intensity(th) };
  });
  const edge = (a: number, sign: number) => ({ x: S.x + sign * Math.tan(deg(a)) * h, y: FLOOR });

  // Plot of I(θ)
  const PW = 200, PH = 90;
  const px = (th: number) => 24 + (th / 45) * (PW - 32);
  const py = (v: number) => 8 + (1 - v) * (PH - 24);
  const curve = Array.from({ length: 91 }, (_, i) => { const th = (i / 90) * 45; return `${i ? "L" : "M"} ${px(th)} ${py(intensity(th))}`; }).join(" ");

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSpot_title", "Spotlight — Inner Cone, Outer Cone, Soft Edge")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Spotlight cones">
          {/* Light pool on the floor */}
          {cells.map((c, i) => (
            <rect key={i} x={c.x0} y={FLOOR} width={c.w + 0.5} height={12}
              fill={`rgba(255,${200 + Math.round(c.I * 40)},${120 + Math.round(c.I * 80)},${0.06 + c.I * 0.9})`} />
          ))}
          <line x1={10} y1={FLOOR} x2={W - 10} y2={FLOOR} stroke="var(--code-muted)" strokeWidth="1.2" />

          {/* Cones */}
          <polygon points={`${S.x},${S.y} ${edge(gamma, -1).x},${FLOOR} ${edge(gamma, 1).x},${FLOOR}`} fill="rgba(245,158,11,0.08)" />
          <polygon points={`${S.x},${S.y} ${edge(phi, -1).x},${FLOOR} ${edge(phi, 1).x},${FLOOR}`} fill="rgba(245,158,11,0.14)" />
          {[-1, 1].map(sg => (
            <g key={sg}>
              <line x1={S.x} y1={S.y} x2={edge(gamma, sg).x} y2={FLOOR} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4 3" />
              <line x1={S.x} y1={S.y} x2={edge(phi, sg).x} y2={FLOOR} stroke="#f59e0b" strokeWidth="1.4" />
            </g>
          ))}
          <line x1={S.x} y1={S.y} x2={S.x} y2={FLOOR} stroke="var(--code-muted)" strokeDasharray="2 3" />

          {/* The spotlight itself */}
          <rect x={S.x - 12} y={S.y - 16} width={24} height={16} rx={3} fill="var(--text-main)" />
          <Label x={edge(phi, 1).x + 6} y={FLOOR - 70} color="#f59e0b">{`φ inner ${phi.toFixed(0)}°`}</Label>
          <Label x={edge(gamma, 1).x + 6} y={FLOOR - 40} color="#ef4444">{`γ outer ${gamma.toFixed(0)}°`}</Label>
          <Label x={S.x + 18} y={S.y - 4} color="var(--text-main)">spotDir</Label>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[auto_1fr] items-start">
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full max-w-[240px] h-auto">
          <line x1={24} y1={py(0)} x2={PW - 6} y2={py(0)} stroke="var(--code-line)" />
          <line x1={24} y1={py(1)} x2={PW - 6} y2={py(1)} stroke="var(--code-line)" />
          <text x={20} y={py(1) + 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">1</text>
          <text x={20} y={py(0) + 3} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">0</text>
          <line x1={px(phi)} y1={py(1)} x2={px(phi)} y2={py(0)} stroke="#f59e0b" strokeDasharray="2 2" />
          <line x1={px(gamma)} y1={py(1)} x2={px(gamma)} y2={py(0)} stroke="#ef4444" strokeDasharray="2 2" />
          <path d={curve} fill="none" stroke="var(--primary)" strokeWidth="2" />
          <text x={PW - 6} y={PH - 2} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace" textAnchor="end">θ (0–45°)</text>
        </svg>
        <div className="space-y-2 min-w-0">
          {([["inner φ", inner, setInner, "#f59e0b"], ["outer γ", outer, setOuter, "#ef4444"]] as const).map(([label, v, set, col]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-14" style={{ color: col }}>{label}</span>
              <input type="range" min={2} max={44} step={0.5} value={v}
                onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}°</span>
            </label>
          ))}
          <button onClick={() => setOuter(inner + 0.5)}
            className="px-2.5 py-1 text-[10px] font-mono rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">
            {tx(t, "figSpot_hard", "hard edge (γ ≈ φ)")}
          </button>
          <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`light.cutOff      = cos(radians(${phi.toFixed(1)}));  // ${cPhi.toFixed(4)}
light.outerCutOff = cos(radians(${gamma.toFixed(1)}));  // ${cGam.toFixed(4)}
float theta = dot(lightDir, normalize(-light.direction));
float I = clamp((theta - outerCutOff) / (cutOff - outerCutOff), 0.0, 1.0);`}
          </pre>
        </div>
      </div>
    </FigureShell>
  );
}
