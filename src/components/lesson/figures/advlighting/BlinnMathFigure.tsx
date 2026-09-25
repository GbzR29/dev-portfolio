"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, type P2 } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// When l̂, n̂ and v̂ lie in one plane, the angle between n̂ and the halfway
// vector ĥ is exactly half the angle between r̂ and v̂. So Blinn's cos β is
// always larger than Phong's cos α — a wider highlight — and Phong's term
// is cut to zero as soon as α passes 90°, which Blinn never is.

const W = 300, H = 210, O: P2 = { x: 150, y: 170 }, LEN = 110;
const COL = { n: "#22c55e", l: "#f59e0b", v: "#3b82f6", r: "#ef4444", h: "#a855f7" };
const rad = (d: number) => (d * Math.PI) / 180;
const dirAt = (deg: number): P2 => ({ x: Math.sin(rad(deg)), y: Math.cos(rad(deg)) });   // 0° = along n̂
const tip = (d: P2, l = LEN): P2 => ({ x: O.x + d.x * l, y: O.y - d.y * l });

export function BlinnMathFigure({ t }: { t?: TrackTranslations }) {
  const [lDeg, setL] = useState(-50);      // light, measured from the normal
  const [vDeg, setV] = useState(20);       // eye
  const [n, setN] = useState(16);

  const rDeg = -lDeg;                                   // mirror of l̂ about n̂
  const hDeg = (lDeg + vDeg) / 2;                       // halfway between l̂ and v̂
  const alpha = Math.abs(vDeg - rDeg), beta = Math.abs(hDeg);
  const phong = alpha < 90 ? Math.pow(Math.cos(rad(alpha)), n) : 0;
  const blinn = Math.pow(Math.cos(rad(beta)), n);
  const blinn4 = Math.pow(Math.cos(rad(beta)), 4 * n);

  // Plot of the three lobes against α
  const PW = 330, PH = 180, pl = 30, pr = 10, pt = 12, pb = 26;
  const px = (a: number) => pl + (a / 180) * (PW - pl - pr);
  const py = (v: number) => pt + (1 - v) * (PH - pt - pb);
  const curve = (f: (a: number) => number) =>
    Array.from({ length: 181 }, (_, a) => `${a ? "L" : "M"} ${px(a).toFixed(1)} ${py(f(a)).toFixed(1)}`).join(" ");
  const fPhong = (a: number) => (a < 90 ? Math.pow(Math.cos(rad(a)), n) : 0);
  const fBlinn = (a: number) => Math.pow(Math.cos(rad(a / 2)), n);
  const fBlinn4 = (a: number) => Math.pow(Math.cos(rad(a / 2)), 4 * n);

  const slider = (label: string, v: number, set: (x: number) => void, min: number, max: number, color: string) => (
    <label className="flex items-center gap-2">
      <span className="text-[10px] font-mono w-16" style={{ color }}>{label}</span>
      <input type="range" min={min} max={max} step={1} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}{label === "shininess" ? "" : "°"}</span>
    </label>
  );

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBlinnM_title", "Halfway Vector — Why Blinn Needs a Bigger Exponent")}
        </span>
      </div>

      <div className="grid md:grid-cols-2 bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Phong and Blinn vectors">
          <rect x={10} y={O.y} width={W - 20} height={H - O.y - 10} fill="rgba(90,140,255,0.10)" />
          <line x1={10} y1={O.y} x2={W - 10} y2={O.y} stroke="var(--code-muted)" strokeWidth="1.3" />
          <Arrow a={O} b={tip(dirAt(0), 90)} color={COL.n} w={2} head={7} />
          <Arrow a={O} b={tip(dirAt(lDeg))} color={COL.l} w={2.2} head={8} />
          <Arrow a={O} b={tip(dirAt(vDeg))} color={COL.v} w={2.2} head={8} />
          <Arrow a={O} b={tip(dirAt(rDeg))} color={COL.r} w={1.6} head={7} dash="4 3" />
          <Arrow a={O} b={tip(dirAt(hDeg), 80)} color={COL.h} w={2.2} head={8} />
          <Label x={tip(dirAt(0), 90).x + 5} y={tip(dirAt(0), 90).y} color={COL.n} bold>n̂</Label>
          <Label x={tip(dirAt(lDeg)).x - 4} y={tip(dirAt(lDeg)).y - 2} anchor="end" color={COL.l} bold>l̂</Label>
          <Label x={tip(dirAt(vDeg)).x + 5} y={tip(dirAt(vDeg)).y} color={COL.v} bold>v̂</Label>
          <Label x={tip(dirAt(rDeg)).x + 5} y={tip(dirAt(rDeg)).y + 10} color={COL.r} bold>r̂</Label>
          <Label x={tip(dirAt(hDeg), 80).x + 5} y={tip(dirAt(hDeg), 80).y - 4} color={COL.h} bold>ĥ</Label>
          <Label x={12} y={20} color="var(--text-main)">{`α (r̂, v̂) = ${alpha.toFixed(0)}°`}</Label>
          <Label x={12} y={36} color="var(--text-main)">{`β (n̂, ĥ) = ${beta.toFixed(1)}° = α / 2`}</Label>
        </svg>
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto md:border-l border-[var(--border)]" role="img" aria-label="Specular lobes">
          {[0, 0.5, 1].map(v => (
            <g key={v}>
              <line x1={pl} y1={py(v)} x2={PW - pr} y2={py(v)} stroke="var(--code-line)" />
              <text x={pl - 4} y={py(v) + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">{v}</text>
            </g>
          ))}
          {[0, 45, 90, 135, 180].map(a => (
            <text key={a} x={px(a)} y={PH - 12} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">{a}°</text>
          ))}
          <text x={PW - pr} y={PH - 2} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">α between r̂ and v̂</text>
          <line x1={px(90)} y1={pt} x2={px(90)} y2={py(0)} stroke={COL.r} strokeDasharray="2 3" opacity={0.6} />
          <path d={curve(fBlinn)} fill="none" stroke={COL.h} strokeWidth="1.4" strokeDasharray="4 3" />
          <path d={curve(fBlinn4)} fill="none" stroke={COL.h} strokeWidth="2.2" />
          <path d={curve(fPhong)} fill="none" stroke={COL.r} strokeWidth="2.2" />
          <line x1={px(alpha)} y1={pt} x2={px(alpha)} y2={py(0)} stroke="var(--text-main)" strokeWidth="1" />
          <text x={pl + 6} y={pt + 12} fill={COL.r} fontSize="9" fontFamily="monospace">Phong cos^n α</text>
          <text x={pl + 6} y={pt + 24} fill={COL.h} fontSize="9" fontFamily="monospace">Blinn cos^4n (α/2)</text>
          <text x={pl + 6} y={pt + 36} fill={COL.h} fontSize="9" fontFamily="monospace" opacity={0.7}>Blinn cos^n (α/2) — same n</text>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          {slider("light", lDeg, setL, -85, 85, COL.l)}
          {slider("eye", vDeg, setV, -85, 85, COL.v)}
          {slider("shininess", n, setN, 1, 128, "var(--text-muted)")}
        </div>
        <div className="font-mono text-[11px] leading-6 text-[var(--text-main)]">
          <div><span style={{ color: COL.r }}>Phong</span> cos^{n}(α) = <b>{phong.toFixed(3)}</b>{alpha >= 90 && <span className="text-red-400"> ← cut: α &gt; 90°</span>}</div>
          <div><span style={{ color: COL.h }}>Blinn</span> cos^{n}(β) = <b>{blinn.toFixed(3)}</b></div>
          <div><span style={{ color: COL.h }}>Blinn</span> cos^{4 * n}(β) = <b>{blinn4.toFixed(3)}</b> <span className="text-[var(--text-muted)]">≈ Phong</span></div>
          <p className="font-sans text-[12px] text-[var(--text-muted)] leading-relaxed pt-1">
            {tx(t, "figBlinnM_note", "Move the eye past the mirror direction: Phong drops to exactly zero at 90° while Blinn fades smoothly. And since β is half of α, Blinn needs about four times the exponent to make a highlight of the same size — the thick purple curve.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
