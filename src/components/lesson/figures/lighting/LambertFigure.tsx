"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../svg";
import { Tex } from "../../Tex";

// ── What this figure shows ────────────────────────────────────────────────────
// Why diffuse light is proportional to cos θ. A beam of fixed width carries a
// fixed amount of light. Tilt it away from the normal and the same rays land
// spread over a longer stretch of surface — w / cos θ — so each bit of surface
// receives less: brightness ∝ cos θ = n̂ · l̂.

const W = 420, H = 250;
const P = { x: 210, y: 196 };           // centre of the lit patch
const BEAM = 90;                         // beam width, px
const RAYS = 9;

export function LambertFigure({ t }: { t?: TrackTranslations }) {
  const [deg, setDeg] = useState(40);
  const th = (deg * Math.PI) / 180;
  const cos = Math.cos(th);
  // Direction the light travels (toward the surface) and its perpendicular
  const d = { x: Math.sin(th), y: Math.cos(th) };          // screen: +y is down
  const perp = { x: Math.cos(th), y: -Math.sin(th) };
  const spread = BEAM / Math.max(cos, 0.05);               // lit length on the floor
  const shown = Math.min(spread, W - 40);

  const rays = Array.from({ length: RAYS }, (_, i) => {
    const s = (i / (RAYS - 1) - 0.5) * BEAM;
    // Where this ray lands on the floor (y = P.y)
    const hitX = P.x + s / Math.max(cos, 0.05);
    const start = { x: hitX - d.x * 200, y: P.y - d.y * 200 };
    return { start, hit: { x: hitX, y: P.y }, s };
  });

  // Beam cross-section, drawn where the beam is still "in the air"
  const c0 = { x: P.x - d.x * 150 - perp.x * BEAM / 2, y: P.y - d.y * 150 - perp.y * BEAM / 2 };
  const c1 = { x: P.x - d.x * 150 + perp.x * BEAM / 2, y: P.y - d.y * 150 + perp.y * BEAM / 2 };
  const lightTo = { x: P.x - d.x * 70, y: P.y - d.y * 70 };

  const bright = Math.round(40 + cos * 215);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figLambert_title", "Lambert's Cosine Law — Same Light, Bigger Area")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Light beam spreading over a surface">
          <defs>
            <clipPath id="lambert-sky"><rect x={0} y={0} width={W} height={P.y} /></clipPath>
          </defs>

          {/* Floor, lit patch brightness = cos θ */}
          <rect x={10} y={P.y} width={W - 20} height={H - P.y - 12} fill="rgba(90,140,255,0.10)" />
          <line x1={10} y1={P.y} x2={W - 10} y2={P.y} stroke="var(--code-muted)" strokeWidth="1.4" />
          <rect x={P.x - shown / 2} y={P.y} width={shown} height={10}
            fill={`rgb(${bright},${Math.round(bright * 0.86)},${Math.round(bright * 0.45)})`} />

          {/* Rays */}
          <g clipPath="url(#lambert-sky)">
            {rays.map((r, i) => (
              <line key={i} x1={r.start.x} y1={r.start.y} x2={r.hit.x} y2={r.hit.y}
                stroke="#f59e0b" strokeWidth="1.3" opacity={0.85} />
            ))}
          </g>
          {rays.map((r, i) => r.hit.x > 12 && r.hit.x < W - 12 && (
            <circle key={i} cx={r.hit.x} cy={r.hit.y} r={2.2} fill="#f59e0b" />
          ))}

          {/* Beam width, measured across the beam */}
          <line x1={c0.x} y1={c0.y} x2={c1.x} y2={c1.y} stroke="var(--text-main)" strokeWidth="1.2" />
          <Label x={(c0.x + c1.x) / 2 + 8} y={(c0.y + c1.y) / 2 - 8} color="var(--text-main)">w</Label>

          {/* Spread on the floor */}
          <line x1={P.x - shown / 2} y1={P.y + 18} x2={P.x + shown / 2} y2={P.y + 18} stroke="#f59e0b" strokeWidth="1.2" />
          <Label x={P.x} y={P.y + 34} anchor="middle" color="#f59e0b">
            {cos < 0.05 ? "w / cos θ → ∞" : `w / cos θ = ${(1 / cos).toFixed(2)} w`}
          </Label>

          {/* Normal and light direction with the angle */}
          <Arrow a={P} b={{ x: P.x, y: P.y - 80 }} color="#22c55e" w={2.2} head={8} />
          <Arrow a={P} b={lightTo} color="#f59e0b" w={2.2} head={8} />
          <path d={`M ${P.x} ${P.y - 34} A 34 34 0 0 ${deg > 0 ? 0 : 1} ${P.x - d.x * 34} ${P.y - d.y * 34}`}
            fill="none" stroke="var(--text-main)" strokeWidth="1" />
          <Label x={P.x + 6} y={P.y - 78} color="#22c55e" bold>n̂</Label>
          <Label x={lightTo.x - 18} y={lightTo.y + 4} color="#f59e0b" bold>l̂</Label>
          <Label x={P.x - d.x * 50 + 6} y={P.y - d.y * 50 - 2} color="var(--text-main)">θ</Label>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-6">θ</span>
            <input type="range" min={0} max={88} step={1} value={deg}
              onChange={e => setDeg(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{deg}°</span>
          </label>
          <div className="font-mono text-[11px] leading-6 text-[var(--text-main)]">
            <div>cos θ = <b>{cos.toFixed(3)}</b></div>
            <div className="text-[var(--text-muted)]">{tx(t, "figLambert_per", "light per unit of surface")} ∝ cos θ</div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{tx(t, "figLambert_bright", "brightness")}</span>
              <span className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <span className="block h-full bg-amber-500" style={{ width: `${cos * 100}%` }} />
              </span>
            </div>
          </div>
        </div>
        <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figLambert_note", "The beam carries the same light at every angle — count the rays. What changes is how much floor it has to cover. At θ = 60° it covers twice the length, so every point gets half. That ratio is exactly ")}
          <Tex>{String.raw`\cos\theta = \vN\cdot\vL`}</Tex>
          {tx(t, "figLambert_note2", " when both vectors have length 1.")}
        </p>
      </div>
    </figure>
  );
}
