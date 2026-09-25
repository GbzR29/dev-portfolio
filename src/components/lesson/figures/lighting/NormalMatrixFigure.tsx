"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, type P2 } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// A circle squashed by a non-uniform scale. Its tangents follow the model
// matrix M, so if the normals did too they would stop being perpendicular.
// Transforming normals by (M⁻¹)ᵀ keeps them at 90° to the surface.

const W = 400, H = 240, C: P2 = { x: 200, y: 120 };
const R = 70, SAMPLES = 10;

export function NormalMatrixFigure({ t }: { t?: TrackTranslations }) {
  const [sx, setSx] = useState(2.2);
  const [showWrong, setShowWrong] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const sy = 1;

  const pts = Array.from({ length: SAMPLES }, (_, i) => {
    const a = (i / SAMPLES) * Math.PI * 2 + 0.3;
    const p = { x: Math.cos(a), y: Math.sin(a) };                 // point on the unit circle
    const n = { x: Math.cos(a), y: Math.sin(a) };                 // its normal
    const tangent = { x: -Math.sin(a) * sx, y: Math.cos(a) * sy }; // tangent × M
    const wrong = { x: n.x * sx, y: n.y * sy };                     // M · n
    const right = { x: n.x / sx, y: n.y / sy };                     // (M⁻¹)ᵀ · n (M is diagonal)
    const unit = (v: P2) => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
    const tU = unit(tangent);
    const ang = (v: P2) => Math.abs((Math.acos(Math.max(-1, Math.min(1, v.x * tU.x + v.y * tU.y))) * 180) / Math.PI);
    return { p: { x: p.x * sx, y: p.y * sy }, wrong: unit(wrong), right: unit(right), angW: ang(unit(wrong)), angR: ang(unit(right)) };
  });
  const s = (v: P2): P2 => ({ x: C.x + v.x * R, y: C.y - v.y * R });
  const worst = Math.max(...pts.map(q => Math.abs(90 - q.angW)));

  const btn = (on: boolean, color: string) =>
    `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on ? "" : "opacity-50"}`
    + (color ? "" : "");

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figNormalM_title", "Why Normals Need Their Own Matrix")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Normals under non-uniform scale">
          {/* The unit circle it started as, and the squashed shape */}
          <ellipse cx={C.x} cy={C.y} rx={R} ry={R} fill="none" stroke="var(--code-muted)" strokeDasharray="3 3" />
          <ellipse cx={C.x} cy={C.y} rx={R * sx} ry={R * sy} fill="rgba(59,130,246,0.14)" stroke="var(--primary)" strokeWidth="1.6" />
          {pts.map((q, i) => (
            <g key={i}>
              {showWrong && <Arrow a={s(q.p)} b={s({ x: q.p.x + q.wrong.x * 0.45, y: q.p.y + q.wrong.y * 0.45 })} color="#ef4444" w={1.8} head={6} />}
              {showRight && <Arrow a={s(q.p)} b={s({ x: q.p.x + q.right.x * 0.45, y: q.p.y + q.right.y * 0.45 })} color="#22c55e" w={1.8} head={6} />}
              <circle cx={s(q.p).x} cy={s(q.p).y} r={2} fill="var(--text-main)" />
            </g>
          ))}
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2.5">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">scale x</span>
            <input type="range" min={0.4} max={3} step={0.05} value={sx}
              onChange={e => setSx(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{sx.toFixed(2)}</span>
          </label>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setShowWrong(v => !v)} className={`${btn(showWrong, "r")} border-red-500/50 text-red-400`}>
              {showWrong ? "✓" : "○"} M · n
            </button>
            <button onClick={() => setShowRight(v => !v)} className={`${btn(showRight, "g")} border-emerald-500/50 text-emerald-400`}>
              {showRight ? "✓" : "○"} (M⁻¹)ᵀ · n
            </button>
          </div>
          <p className="font-mono text-[11px] text-[var(--text-main)]">
            {tx(t, "figNormalM_worst", "worst angle with M · n:")}{" "}
            <b className={worst > 1 ? "text-red-400" : "text-emerald-400"}>{(90 - worst).toFixed(1)}°</b>
            <span className="text-[var(--text-muted)]"> {tx(t, "figNormalM_should", "(should be 90°)")}</span>
          </p>
        </div>
        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figNormalM_note", "Stretch the circle sideways. The red normals, multiplied by the model matrix, lean toward the stretch and stop being perpendicular — lighting computed with them is simply wrong. The green ones use the inverse-transpose and stay at 90° at every point. With a uniform scale (x = 1) both agree, which is why the bug often hides until a model gets squashed.")}
        </p>
      </div>
    </figure>
  );
}
