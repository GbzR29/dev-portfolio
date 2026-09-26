"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";
import { qAxis, toDual, dqBlendApply, qRotate, type V3 } from "./dq";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A 2D arm: two bones (upper arm from the shoulder, forearm from the elbow) and
// a skin mesh built in the rest ("bind") pose. Each vertex has a weight for
// each bone, painted by its distance along the arm: blue follows the upper
// arm, orange the forearm, the blend in between.
//   rigid  — each vertex follows only its strongest bone: the skin tears
//   LBS    — v' = Σ wᵢ Sᵢ v : averaging matrices shrinks the elbow ("collapse")
//   DQS    — dual quaternions blend the rigid motions themselves: no collapse
// The readout compares the deformed area with the rest area.

const W = 560, H = 330, SC = 58, OX = 150, OY = 190;
const L = 2;                              // bone length (world units)
const COLS = 44, ROWS = 7, X0 = -0.25, X1 = 2 * L + 0.25, HALF = 0.42;
const MODES = ["rigid", "LBS", "DQS"] as const;

type Mode = (typeof MODES)[number];

/** Poses the bones, skins every grid vertex, and measures the deformed area. */
function skinArm(shoulder: number, elbow: number, blend: number, mode: Mode) {
  const a0 = (shoulder * Math.PI) / 180, a1 = (elbow * Math.PI) / 180;
  const Z: V3 = [0, 0, 1];
  // Bone 0: rotate a0 about the shoulder (origin). Bone 1: world = R(a0)·(elbow_rest + R(a1)·(x − elbow_rest))
  const q0 = qAxis(Z, a0), q1 = qAxis(Z, a0 + a1);
  const elbowWorld = qRotate(q0, [L, 0, 0]);
  const t1: V3 = [elbowWorld[0] - qRotate(q1, [L, 0, 0])[0], elbowWorld[1] - qRotate(q1, [L, 0, 0])[1], 0];
  const dq = [toDual(q0, [0, 0, 0]), toDual(q1, t1)];
  const S = (i: number, p: V3): V3 => { const r = qRotate(i ? q1 : q0, p); return i ? [r[0] + t1[0], r[1] + t1[1], 0] : r; };

  const weight1 = (x: number) => {
    if (blend < 1e-3) return x < L ? 0 : 1;
    const u = Math.max(0, Math.min(1, (x - (L - blend / 2)) / blend));
    return u * u * (3 - 2 * u);                                   // smoothstep across the elbow
  };

  const deform = (x: number, y: number): V3 => {
    const w1 = weight1(x), w0 = 1 - w1, p: V3 = [x, y, 0];
    if (mode === "rigid") return S(w1 >= 0.5 ? 1 : 0, p);
    if (mode === "LBS") { const a = S(0, p), b = S(1, p); return [a[0] * w0 + b[0] * w1, a[1] * w0 + b[1] * w1, 0]; }
    return dqBlendApply(dq, [w0, w1], p);
  };

  const grid: { p: V3; w: number }[][] = [];
  for (let j = 0; j <= ROWS; j++) {
    const row: { p: V3; w: number }[] = [];
    for (let i = 0; i <= COLS; i++) {
      const x = X0 + ((X1 - X0) * i) / COLS, y = -HALF + (2 * HALF * j) / ROWS;
      row.push({ p: deform(x, y), w: weight1(x) });
    }
    grid.push(row);
  }
  const X = (p: V3) => OX + p[0] * SC, Y = (p: V3) => OY - p[1] * SC;
  let area = 0;
  const cells: { pts: string; w: number; torn: boolean }[] = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
    const cellArea = 0.5 * Math.abs((c.p[0] - a.p[0]) * (d.p[1] - b.p[1]) - (d.p[0] - b.p[0]) * (c.p[1] - a.p[1]));
    area += cellArea;
    cells.push({ pts: [a, b, c, d].map(v => `${X(v.p).toFixed(1)},${Y(v.p).toFixed(1)}`).join(" "), w: (a.w + b.w + c.w + d.w) / 4, torn: mode === "rigid" && (a.w >= 0.5) !== (b.w >= 0.5) });
  }
  const rest = (X1 - X0) * 2 * HALF;
  const wrist = S(1, [2 * L, 0, 0]);
  return { cells, area, rest, elbowWorld, wrist, X, Y };
}

export function SkinningArmFigure({ t }: { t?: TrackTranslations }) {
  const [shoulder, setShoulder] = useState(10);
  const [elbow, setElbow] = useState(110);
  const [blend, setBlend] = useState(0.6);
  const [mode, setMode] = useState<Mode>("LBS");
  const [showW, setShowW] = useState(true);

  const { cells, area, rest, elbowWorld, wrist, X, Y } = skinArm(shoulder, elbow, blend, mode);
  const col = (w: number) => `rgb(${Math.round(59 + (245 - 59) * w)},${Math.round(130 + (158 - 130) * w)},${Math.round(246 + (11 - 246) * w)})`;

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSkinArm_title", "Skinning an Elbow — Rigid, Linear Blend, Dual Quaternion")}
        </span>
        <div className="flex gap-1.5">{MODES.map(m => <button key={m} className={btn(mode === m)} onClick={() => setMode(m)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Skinning an elbow">
          {/* rest pose, faint */}
          <rect x={OX + X0 * SC} y={OY - HALF * SC} width={(X1 - X0) * SC} height={2 * HALF * SC} fill="none" stroke="var(--code-muted)" strokeDasharray="3 4" opacity={0.4} />
          {cells.map((c, i) => (
            <polygon key={i} points={c.pts} fill={showW ? col(c.w) : "#94a3b8"} fillOpacity={c.torn ? 0 : 0.55}
              stroke={showW ? col(c.w) : "#cbd5e1"} strokeWidth={0.5} strokeOpacity={0.9} />
          ))}
          {/* bones */}
          <line x1={X([0, 0, 0])} y1={Y([0, 0, 0])} x2={X(elbowWorld)} y2={Y(elbowWorld)} stroke="white" strokeWidth={3} strokeLinecap="round" />
          <line x1={X(elbowWorld)} y1={Y(elbowWorld)} x2={X(wrist)} y2={Y(wrist)} stroke="white" strokeWidth={3} strokeLinecap="round" />
          {[[0, 0, 0] as V3, elbowWorld, wrist].map((p, i) => <circle key={i} cx={X(p)} cy={Y(p)} r={5} fill="#0f172a" stroke="white" strokeWidth={2} />)}
          <Label x={X([0, 0, 0]) - 8} y={Y([0, 0, 0]) + 22} anchor="end" size={8}>shoulder</Label>
          <Label x={X(elbowWorld) + 8} y={Y(elbowWorld) + 18} size={8}>elbow</Label>
          {showW && <>
            <Label x={14} y={H - 26} size={8} color="#3b82f6">w = 1 → upper arm</Label>
            <Label x={14} y={H - 10} size={8} color="#f59e0b">w = 1 → forearm</Label>
          </>}
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["shoulder °", shoulder, setShoulder, -60, 80, 1], ["elbow °", elbow, setElbow, -160, 160, 1], ["blend width", blend, setBlend, 0, 2, 0.05]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={showW} onChange={e => setShowW(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figSkinArm_weights", "paint the weights")}
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {mode === "rigid"
              ? tx(t, "figSkinArm_rigidNote", "Each vertex belongs to exactly one bone. Bend the elbow and the skin splits open on the outside and folds over itself on the inside. That was 1990s games: separate rigid pieces per limb.")
              : mode === "LBS"
                ? tx(t, "figSkinArm_lbsNote", "Linear blend skinning averages the positions each bone would give the vertex. Two points on different circles, averaged, land inside both circles, so near the elbow the skin is pulled toward the joint and the limb gets thinner as it bends. Push the elbow past ±120° and watch the area drop.")
                : tx(t, "figSkinArm_dqsNote", "Dual quaternion skinning blends the two rigid motions (rotation and translation together) and then applies one rigid motion to the vertex. A rigid motion never changes distances, so the elbow keeps its thickness. The area stays close to 100% even at extreme angles.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[190px]">
          <div>{tx(t, "figSkinArm_area", "skin area")} = <span className={area / rest < 0.9 ? "text-red-400" : "text-[#22c55e]"}>{((area / rest) * 100).toFixed(1)}%</span></div>
          <div className="text-[var(--code-muted)]">{tx(t, "figSkinArm_ofRest", "of the rest pose")}</div>
          <div className="mt-1">elbow = {elbow}°</div>
        </div>
      </div>
    </FigureShell>
  );
}
