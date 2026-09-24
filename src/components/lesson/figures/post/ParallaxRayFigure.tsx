"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../svg";

// ── What this figure shows ────────────────────────────────────────────────────
// A slice through a parallax-mapped surface. The polygon is the flat line at
// the top; the depth map describes where the "real" surface would be below
// it. The view ray enters the polygon at A. Where does it really hit?
//   parallax  — one guess: step along the ray by the depth read at A
//   steep     — march in equal depth layers until the ray is below the map
//   POM       — steep, then interpolate linearly between the last two layers
// The marker on the right of each method is the texture coordinate it returns.

const W = 480, H = 260, X0 = 30, X1 = 450, TOP = 78, UNIT = X1 - X0;
const METHODS = ["parallax", "steep", "POM"] as const;

/** Depth map along u: bricks with bevelled edges, deep mortar, and a dent. */
function depth(u: number) {
  const w = 0.22, m = 0.035, bev = 0.025;
  const f = ((u % w) + w) % w;
  const e = Math.min(f, w - f);
  if (e < m / 2) return 0.95;
  const d = Math.min(1, (e - m / 2) / bev);
  let v = 0.95 - 0.9 * d;                                // bevel up to the brick face (0.05)
  v += 0.25 * Math.exp(-((u - 0.52) ** 2) / 0.0012);     // a chipped dent in one brick
  return Math.min(1, v);
}

/** Runs the three estimators for a ray entering at uA; `along(d)` is the ray's u at normalised depth d. */
function march(uA: number, along: (d: number) => number, layers: number) {
  // True hit: fine march
  let uTrue = uA;
  for (let d = 0; d <= 1; d += 0.0005) { const u = along(d); if (d >= depth(u)) { uTrue = u; break; } uTrue = u; }

  // Plain parallax: one offset from the depth at A
  const uPar = along(depth(uA));

  // Steep parallax + POM
  const steps: { u: number; d: number }[] = [];
  const dl = 1 / layers;
  let cur = 0, u = uA;
  steps.push({ u, d: cur });
  while (cur < depth(u) && cur < 1) { u = along(cur + dl); cur += dl; steps.push({ u, d: cur }); }
  const uSteep = u;
  const prev = steps[Math.max(0, steps.length - 2)];
  const after = depth(u) - cur, before = depth(prev.u) - prev.d;
  const wgt = after - before !== 0 ? after / (after - before) : 0;
  const uPom = prev.u * wgt + u * (1 - wgt);

  return { uTrue, uPar, steps, uSteep, prev, uPom, u };
}

export function ParallaxRayFigure({ t }: { t?: TrackTranslations }) {
  const [uA, setUA] = useState(0.7);
  const [angle, setAngle] = useState(55);
  const [scale, setScale] = useState(0.3);
  const [layers, setLayers] = useState(8);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("steep");

  const tanT = Math.tan((angle * Math.PI) / 180);
  const X = (u: number) => X0 + u * UNIT;
  const Y = (d: number) => TOP + d * scale * UNIT;           // d normalised, scaled into u units
  const along = (dNorm: number) => uA - dNorm * scale * tanT; // u where the ray is at depth dNorm

  const { uTrue, uPar, steps, uSteep, prev, uPom, u } = march(uA, along, layers);

  const uOut = method === "parallax" ? uPar : method === "steep" ? uSteep : uPom;
  const err = Math.abs(uOut - uTrue);

  const profile = Array.from({ length: 481 }, (_, i) => { const uu = i / 480; return `${i ? "L" : "M"} ${X(uu).toFixed(1)} ${Y(depth(uu)).toFixed(1)}`; }).join(" ");
  const eyeDist = Math.min(150, (TOP - 14) / Math.max(0.05, Math.cos((angle * Math.PI) / 180)));
  const eye = { x: X(uA) + Math.sin((angle * Math.PI) / 180) * eyeDist, y: TOP - Math.cos((angle * Math.PI) / 180) * eyeDist };
  const rayEnd = along(1.05);

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figParRay_title", "Parallax in a Slice — Finding Where the View Ray Hits the Depth Map")}
        </span>
        <div className="flex gap-1.5">{METHODS.map(m => <button key={m} className={btn(method === m)} onClick={() => setMethod(m)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none cursor-crosshair" role="img" aria-label="Parallax ray march"
          onPointerDown={e => { const r = e.currentTarget.getBoundingClientRect(); setUA(Math.min(0.98, Math.max(0.1, (((e.clientX - r.left) / r.width) * W - X0) / UNIT))); }}
          onPointerMove={e => { if (!e.buttons) return; const r = e.currentTarget.getBoundingClientRect(); setUA(Math.min(0.98, Math.max(0.1, (((e.clientX - r.left) / r.width) * W - X0) / UNIT))); }}>
          {/* "Real" surface described by the depth map */}
          <path d={`${profile} L ${X1} ${H} L ${X0} ${H} Z`} fill="var(--code-line)" opacity={0.85} />
          <path d={profile} fill="none" stroke="var(--code-muted)" strokeWidth={1.4} />
          {/* The actual polygon */}
          <line x1={X0} y1={TOP} x2={X1} y2={TOP} stroke="#22c55e" strokeWidth={2} />
          <text x={X0} y={TOP - 6} fill="#22c55e" fontSize="8.5" fontFamily="monospace">{tx(t, "figParRay_poly", "the polygon (depth 0)")}</text>
          <text x={X1} y={Y(1) + 12} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">depth 1 × scale</text>
          <line x1={X0} y1={Y(1)} x2={X1} y2={Y(1)} stroke="var(--code-muted)" strokeDasharray="2 4" opacity={0.5} />

          {/* Layers */}
          {method !== "parallax" && Array.from({ length: layers + 1 }, (_, i) => (
            <line key={i} x1={X0} y1={Y(i / layers)} x2={X1} y2={Y(i / layers)} stroke="#3b82f6" strokeWidth={0.5} opacity={0.3} />
          ))}

          {/* View ray */}
          <line x1={eye.x} y1={eye.y} x2={X(rayEnd)} y2={Y(1.05)} stroke="#f59e0b" strokeWidth={1.4} strokeDasharray="5 3" />
          <circle cx={eye.x} cy={eye.y} r={6} fill="#3b82f6" />
          <Label x={eye.x + 8} y={eye.y + 3} color="#3b82f6" bold>eye</Label>
          <circle cx={X(uA)} cy={TOP} r={3.5} fill="#f59e0b" />
          <Label x={X(uA) + 5} y={TOP - 6} color="#f59e0b" bold>A</Label>

          {method === "parallax" && (
            <g>
              <line x1={X(uA)} y1={TOP} x2={X(uA)} y2={Y(depth(uA))} stroke="#a855f7" strokeDasharray="3 2" />
              <circle cx={X(uA)} cy={Y(depth(uA))} r={3} fill="#a855f7" />
              <line x1={X(uA)} y1={Y(depth(uA))} x2={X(uPar)} y2={Y(depth(uA))} stroke="#a855f7" strokeDasharray="3 2" />
              <Label x={X(uA) + 5} y={Y(depth(uA)) + 14} color="#a855f7">{`depth(A) = ${depth(uA).toFixed(2)}`}</Label>
            </g>
          )}
          {method !== "parallax" && steps.map((s, i) => (
            <circle key={i} cx={X(s.u)} cy={Y(s.d)} r={2.6} fill={i === steps.length - 1 ? "#ef4444" : "#3b82f6"} />
          ))}
          {method === "POM" && steps.length > 1 && (
            <line x1={X(prev.u)} y1={Y(depth(prev.u))} x2={X(u)} y2={Y(depth(u))} stroke="#a855f7" strokeWidth={1.4} />
          )}

          {/* Results on the polygon line */}
          <line x1={X(uTrue)} y1={TOP} x2={X(uTrue)} y2={Y(depth(uTrue))} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="2 2" />
          <circle cx={X(uTrue)} cy={Y(depth(uTrue))} r={4} fill="none" stroke="#22c55e" strokeWidth={1.8} />
          <path d={`M ${X(uOut)} ${TOP - 2} l -5 -9 l 10 0 z`} fill="#ef4444" />
          <Label x={X(uOut) - 5} y={TOP - 16} color="#ef4444" anchor="end" bold>{`${method} uv`}</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["view angle", angle, setAngle, 0, 82, 1, "°"], ["height scale", scale, setScale, 0.05, 0.4, 0.01, ""], ...(method !== "parallax" ? [["layers", layers, setLayers, 2, 48, 1, ""] as const] : [])] as const).map(([label, v, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}{unit}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {method === "parallax"
              ? tx(t, "figParRay_parNote", "Plain parallax trusts the depth at A for the whole trip. Over a flat region it lands close; next to a sharp step (drag A near the mortar) or at a grazing angle it misses badly — the source of the swimming, smeared look.")
              : method === "steep"
                ? tx(t, "figParRay_steepNote", "Steep parallax walks down in equal layers and stops at the first layer below the depth map (red). The answer snaps to layer boundaries — with few layers you see stair-stepping; more layers cost more texture reads.")
                : tx(t, "figParRay_pomNote", "POM takes the last two steps (one above, one below the map) and intersects their segment linearly — nearly exact with the same number of layers as steep.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[190px]">
          <div>u(A) = {uA.toFixed(3)}</div>
          <div><span className="text-[#22c55e]">u true</span> = {uTrue.toFixed(3)}</div>
          <div><span className="text-[#ef4444]">u {method}</span> = {uOut.toFixed(3)}</div>
          <div>{tx(t, "figParRay_err", "error")} = <span className={err > 0.02 ? "text-red-400" : "text-[#22c55e]"}>{err.toFixed(4)}</span></div>
          {method !== "parallax" && <div className="text-[var(--code-muted)]">{tx(t, "figParRay_reads", "depth reads")}: {steps.length}</div>}
        </div>
      </div>
    </figure>
  );
}
