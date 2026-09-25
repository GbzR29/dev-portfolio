"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// Where each row of the yaw/pitch direction vector comes from, in two flat
// views of the same unit vector d:
//   side view — pitch tilts d up: its height is y = sin(pitch), and what is
//               left for the horizontal plane is h = cos(pitch)
//   top view  — yaw turns that horizontal part around Y: it splits into
//               x = h·cos(yaw) and z = h·sin(yaw)
// So y is on its own (sin pitch) and x, z both carry the cos(pitch) factor.

const W = 570, H = 250, R = 88;
const RED = "#ef4444", GREEN = "#22c55e", BLUE = "#3b82f6", AMBER = "#f59e0b";
const rad = (d: number) => (d * Math.PI) / 180;

export function YawPitchFigure({ t }: { t?: TrackTranslations }) {
  const [yaw, setYaw] = useState(-60);
  const [pitch, setPitch] = useState(30);

  const y = Math.sin(rad(pitch)), h = Math.cos(rad(pitch));
  const x = h * Math.cos(rad(yaw)), z = h * Math.sin(rad(yaw));

  // Side view: origin, horizontal axis = the direction d points to on the ground
  const S = { x: 70, y: 150 };
  const sTip = { x: S.x + h * R, y: S.y - y * R };
  // Top view: looking down −Y; +X to the right, +Z toward the viewer = down the page
  const T = { x: 385, y: 125 };
  const tTip = { x: T.x + x * R, y: T.y + z * R };

  const arc = (c: { x: number; y: number }, r: number, a0: number, a1: number, flipY: number) =>
    Array.from({ length: 25 }, (_, i) => {
      const a = rad(a0 + ((a1 - a0) * i) / 24);
      return `${i ? "L" : "M"} ${(c.x + Math.cos(a) * r).toFixed(1)} ${(c.y + flipY * Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figYP_title", "Building d — Pitch From the Side, Yaw From Above")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Yaw and pitch decomposition">
          {/* ── Side view ── */}
          <text x={S.x - 40} y={22} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" fontWeight="bold">
            {tx(t, "figYP_side", "1 · SIDE VIEW (pitch)")}
          </text>
          <path d={arc(S, R, -90, 90, -1)} fill="none" stroke="var(--code-line)" strokeDasharray="3 3" />
          <line x1={S.x - 20} y1={S.y} x2={S.x + R + 30} y2={S.y} stroke="var(--code-muted)" />
          <line x1={S.x} y1={S.y + R + 5} x2={S.x} y2={S.y - R - 15} stroke="var(--code-muted)" />
          <text x={S.x + R + 32} y={S.y + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace">{tx(t, "figYP_ground", "ground")}</text>
          <text x={S.x + 4} y={S.y - R - 8} fill={GREEN} fontSize="8" fontFamily="monospace">+Y</text>
          {/* legs */}
          <line x1={S.x} y1={S.y} x2={sTip.x} y2={S.y} stroke={AMBER} strokeWidth={3} />
          <line x1={sTip.x} y1={S.y} x2={sTip.x} y2={sTip.y} stroke={GREEN} strokeWidth={3} />
          <path d={arc(S, 26, 0, pitch, -1)} fill="none" stroke="var(--text-main)" />
          <Arrow a={S} b={sTip} color="var(--text-main)" w={2} />
          <Label x={sTip.x + 6} y={sTip.y - 4} color="var(--text-main)" bold>d</Label>
          <Label x={sTip.x + 6} y={(S.y + sTip.y) / 2 + 3} color={GREEN} bold>{`y = sin(pitch) = ${y.toFixed(2)}`}</Label>
          <Label x={S.x + 4} y={S.y + (y >= 0 ? 16 : -8)} color={AMBER} bold>{`h = cos(pitch) = ${h.toFixed(2)}`}</Label>
          <Label x={S.x + 30} y={S.y - 8 * Math.sign(pitch || 1)} color="var(--text-main)">{`${pitch}°`}</Label>

          {/* ── Top view ── */}
          <text x={T.x - 110} y={22} fill="var(--code-muted)" fontSize="9" fontFamily="monospace" fontWeight="bold">
            {tx(t, "figYP_top", "2 · TOP VIEW (yaw)")}
          </text>
          <circle cx={T.x} cy={T.y} r={R} fill="none" stroke="var(--code-line)" strokeDasharray="3 3" />
          <circle cx={T.x} cy={T.y} r={h * R} fill="none" stroke={AMBER} strokeOpacity={0.5} />
          <line x1={T.x - R - 10} y1={T.y} x2={T.x + R + 14} y2={T.y} stroke="var(--code-muted)" />
          <line x1={T.x} y1={T.y - R - 10} x2={T.x} y2={T.y + R + 14} stroke="var(--code-muted)" />
          <text x={T.x + R + 4} y={T.y - 4} fill={RED} fontSize="8" fontFamily="monospace">+X</text>
          <text x={T.x + 4} y={T.y + R + 12} fill={BLUE} fontSize="8" fontFamily="monospace">+Z</text>
          <text x={T.x + 4} y={T.y - R - 2} fill={BLUE} fontSize="8" fontFamily="monospace">−Z</text>
          <line x1={T.x} y1={T.y} x2={tTip.x} y2={T.y} stroke={RED} strokeWidth={3} />
          <line x1={tTip.x} y1={T.y} x2={tTip.x} y2={tTip.y} stroke={BLUE} strokeWidth={3} />
          <path d={arc(T, 22, 0, yaw, 1)} fill="none" stroke="var(--text-main)" />
          <Arrow a={T} b={tTip} color={AMBER} w={2} />
          <Label x={T.x + (x >= 0 ? 4 : -4)} y={T.y + (z >= 0 ? -6 : 14)} color={RED} anchor={x >= 0 ? "start" : "end"} bold>{`x = h·cos(yaw) = ${x.toFixed(2)}`}</Label>
          <Label x={tTip.x + (x >= 0 ? 6 : -6)} y={(T.y + tTip.y) / 2 + 3} color={BLUE} anchor={x >= 0 ? "start" : "end"} bold>{`z = h·sin(yaw) = ${z.toFixed(2)}`}</Label>
          <Label x={T.x + 26} y={T.y + (yaw < 0 ? -6 : 16)} color="var(--text-main)">{`${yaw}°`}</Label>
          <text x={T.x - R - 10} y={H - 8} fill="var(--code-muted)" fontSize="7.5" fontFamily="monospace">
            {tx(t, "figYP_topNote", "amber ring: radius h — the circle d walks on")}
          </text>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["pitch", pitch, setPitch, -89, 89], ["yaw", yaw, setYaw, -180, 180]] as const).map(([label, v, set, min, max]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-12">{label}</span>
              <input type="range" min={min} max={max} step={1} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}°</span>
            </label>
          ))}
          <div className="flex gap-1.5 flex-wrap">
            {([["yaw −90° → −Z", -90, 0], ["yaw 0° → +X", 0, 0], ["pitch 89° → straight up", -90, 89]] as const).map(([l, yw, pt]) => (
              <button key={l} onClick={() => { setYaw(yw); setPitch(pt); }}
                className="px-2.5 py-1 text-[10px] font-mono rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all">{l}</button>
            ))}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figYP_note", "Raise the pitch: y grows, and the amber ring on the right shrinks — there is less length left for x and z. At 89° the ring is almost a point: looking straight up, yaw barely matters. That shared cos(pitch) is why it appears in the x and z rows but not in y.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--code-text)] min-w-[190px]">
          <div><span style={{ color: RED }}>x</span> = {x.toFixed(3)}</div>
          <div><span style={{ color: GREEN }}>y</span> = {y.toFixed(3)}</div>
          <div><span style={{ color: BLUE }}>z</span> = {z.toFixed(3)}</div>
          <div className="text-[var(--code-muted)] mt-1">|d| = {Math.hypot(x, y, z).toFixed(3)}</div>
        </div>
      </div>
    </figure>
  );
}
