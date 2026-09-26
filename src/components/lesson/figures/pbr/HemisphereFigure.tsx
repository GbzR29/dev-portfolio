"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, pts } from "../../kit/svg";
import { type V3, makeProjector, useOrbit, towardEye, dot, scale } from "../../kit/scene3d";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The hemisphere Ω above a surface point p, the space every reflectance
// integral runs over.
//   "radiance": one incoming direction ωᵢ (θ, φ), the small patch dω of the
//               unit hemisphere it covers, and that patch's shadow on the
//               surface — which is dω·cos θ. That cos θ is why grazing light
//               delivers less energy per unit of area.
//   "samples":  the Riemann sum a shader uses instead of the integral: a grid
//               of directions in (θ, φ), each weighted by cos θ · sin θ. The sum
//               converges to π — the reason Lambert's BRDF is c/π.

const VW = 460, VH = 330, R = 2;
const deg = (d: number) => (d * Math.PI) / 180;
const dirOf = (th: number, ph: number): V3 => [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];

/** Riemann sum of cos θ · sin θ · Δθ · Δφ over the hemisphere. */
function riemann(step: number) {
  let sum = 0, n = 0;
  for (let ph = 0; ph < 2 * Math.PI; ph += step)
    for (let th = 0; th < Math.PI / 2; th += step) { sum += Math.cos(th) * Math.sin(th) * step * step; n++; }
  return { sum, n };
}

export function HemisphereFigure({ t, mode = "radiance" }: { t?: TrackTranslations; mode?: "radiance" | "samples" }) {
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.55, pitch: 0.38, zoom: 1 });
  const [theta, setTheta] = useState(45);
  const [phi, setPhi] = useState(75);
  const [dAng, setDAng] = useState(20);
  const [stepDeg, setStepDeg] = useState(15);

  const P = makeProjector(orbit, VW / 2, VH * 0.66, 62);
  const eye = towardEye(orbit);
  const toward = (p: V3) => dot(p, eye) > -0.05;         // on the near half of the dome

  // Dome wireframe: latitude rings and meridians, back halves faint
  const seg = (a: V3, b: V3, key: string, strong = false) => {
    const pa = P(a), pb = P(b), front = toward(scale([a[0] + b[0], a[1] + b[1], a[2] + b[2]], 0.5));
    return <line key={key} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="var(--code-muted)"
      strokeWidth={strong ? 1.1 : 0.7} opacity={front ? 0.55 : 0.18} />;
  };
  const wire: React.ReactNode[] = [];
  for (const lat of [0, 20, 40, 60, 75]) for (let i = 0; i < 48; i++)
    wire.push(seg(scale(dirOf(deg(90 - lat), (i / 48) * 2 * Math.PI), R), scale(dirOf(deg(90 - lat), ((i + 1) / 48) * 2 * Math.PI), R), `a${lat}-${i}`, lat === 0));
  for (let m = 0; m < 12; m++) for (let i = 0; i < 16; i++) {
    const ph = (m / 12) * 2 * Math.PI;
    wire.push(seg(scale(dirOf(deg((i / 16) * 90), ph), R), scale(dirOf(deg(((i + 1) / 16) * 90), ph), R), `m${m}-${i}`));
  }

  // Surface disk
  const disk = Array.from({ length: 64 }, (_, i) => P(scale([Math.cos((i / 64) * 2 * Math.PI), 0, Math.sin((i / 64) * 2 * Math.PI)], R * 1.25)));
  const O = P([0, 0, 0]);
  const N = P([0, R * 1.18, 0]);

  // ── radiance mode ──
  const th = deg(theta), ph = deg(phi), half = deg(dAng) / 2;
  const w = dirOf(th, ph);
  const patch: V3[] = [];
  const edge = 10;
  for (let i = 0; i <= edge; i++) patch.push(scale(dirOf(Math.max(0, th - half), ph - half + (2 * half * i) / edge), R));
  for (let i = 0; i <= edge; i++) patch.push(scale(dirOf(th - half + (2 * half * i) / edge, ph + half), R));
  for (let i = 0; i <= edge; i++) patch.push(scale(dirOf(Math.min(Math.PI / 2, th + half), ph + half - (2 * half * i) / edge), R));
  for (let i = 0; i <= edge; i++) patch.push(scale(dirOf(th + half - (2 * half * i) / edge, ph - half), R));
  const shadow = patch.map(p => [p[0], 0, p[2]] as V3);
  // Solid angle of the patch, exactly: ∫∫ sin θ dθ dφ
  const t0 = Math.max(0, th - half), t1 = Math.min(Math.PI / 2, th + half);
  const dOmega = (Math.cos(t0) - Math.cos(t1)) * 2 * half;
  const cosT = Math.cos(th);

  // ── samples mode ──
  const step = deg(stepDeg);
  const samples: { d: V3; wgt: number }[] = [];
  for (let sp = 0; sp < 2 * Math.PI - 1e-6; sp += step)
    for (let st = 0; st < Math.PI / 2 - 1e-6; st += step) samples.push({ d: dirOf(st, sp), wgt: Math.cos(st) * Math.sin(st) });
  const { sum, n } = riemann(step);

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {mode === "radiance"
            ? tx(t, "figHemi_title", "The Hemisphere Ω — Radiance Through a Solid Angle")
            : tx(t, "figHemi_samplesTitle", "Integrating Over Ω — a Riemann Sum in θ and φ")}
        </span>
        <button onClick={reset} className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)]">
          {tx(t, "figCam_resetView", "reset view")}
        </button>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg ref={ref} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }} role="img" aria-label="Hemisphere of incoming directions" {...handlers}>
          <polygon points={pts(disk)} fill="var(--code-line)" opacity={0.5} stroke="var(--code-muted)" strokeWidth={0.8} />
          {wire}

          {mode === "radiance" && (
            <g>
              {/* The patch's footprint on the surface: dω · cos θ */}
              <polygon points={pts(shadow.map(P))} fill="rgba(168,85,247,0.28)" stroke="#a855f7" strokeWidth={0.8} strokeDasharray="3 2" />
              {[0, edge + 1, 2 * edge + 2, 3 * edge + 3].map(i => {
                const a = P(patch[i]), b = P(shadow[i]);
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#a855f7" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.7} />;
              })}
              {/* The patch on the unit hemisphere: dω */}
              <polygon points={pts(patch.map(P))} fill="rgba(168,85,247,0.5)" stroke="#a855f7" strokeWidth={1.2} />
              {/* Incoming light along ωᵢ */}
              <Arrow a={P(scale(w, R * 1.75))} b={P(scale(w, 0.06))} color="#f59e0b" w={2.2} />
              <Label x={P(scale(w, R * 1.8)).x + 6} y={P(scale(w, R * 1.8)).y} color="#f59e0b" bold>Lᵢ(p, ωᵢ)</Label>
              {/* θ arc between n and ωᵢ */}
              <path d={Array.from({ length: 21 }, (_, i) => { const q = P(scale(dirOf((th * i) / 20, ph), 0.7)); return `${i ? "L" : "M"} ${q.x} ${q.y}`; }).join(" ")}
                fill="none" stroke="var(--text-main)" strokeWidth={1} />
              <Label x={P(scale(dirOf(th / 2, ph), 0.85)).x + 4} y={P(scale(dirOf(th / 2, ph), 0.85)).y} color="var(--text-main)">θ</Label>
              {/* φ arc on the surface */}
              <path d={Array.from({ length: 21 }, (_, i) => { const q = P(scale([Math.cos((ph * i) / 20), 0, Math.sin((ph * i) / 20)], 0.9)); return `${i ? "L" : "M"} ${q.x} ${q.y}`; }).join(" ")}
                fill="none" stroke="var(--code-muted)" strokeWidth={1} />
              <line x1={O.x} y1={O.y} x2={P([R * 1.25, 0, 0]).x} y2={P([R * 1.25, 0, 0]).y} stroke="var(--code-muted)" strokeDasharray="2 3" />
              <line x1={O.x} y1={O.y} x2={P([Math.cos(ph) * R, 0, Math.sin(ph) * R]).x} y2={P([Math.cos(ph) * R, 0, Math.sin(ph) * R]).y} stroke="var(--code-muted)" strokeDasharray="2 3" />
              <Label x={P([Math.cos(ph / 2), 0, Math.sin(ph / 2)]).x + 4} y={P([Math.cos(ph / 2), 0, Math.sin(ph / 2)]).y + 10}>φ</Label>
              <Label x={P(patch[2 * edge]).x + 8} y={P(patch[2 * edge]).y} color="#a855f7" bold>dω</Label>
            </g>
          )}

          {mode === "samples" && samples.map((s, i) => {
            const a = P(scale(s.d, R)), front = toward(s.d);
            return (
              <g key={i} opacity={front ? 1 : 0.35}>
                <line x1={O.x} y1={O.y} x2={a.x} y2={a.y} stroke="#f59e0b" strokeWidth={0.5} opacity={0.35} />
                <circle cx={a.x} cy={a.y} r={1.2 + s.wgt * 7} fill="#f59e0b" fillOpacity={0.25 + s.wgt * 1.2} stroke="#f59e0b" strokeWidth={0.6} />
              </g>
            );
          })}

          <Arrow a={O} b={N} color="#22c55e" w={2} />
          <Label x={N.x + 6} y={N.y + 4} color="#22c55e" bold>n</Label>
          <circle cx={O.x} cy={O.y} r={3} fill="var(--text-main)" />
          <Label x={O.x - 14} y={O.y + 14} color="var(--text-main)" bold>p</Label>
          <Label x={10} y={VH - 10} size={8}>{tx(t, "figHemi_drag", "drag to orbit · wheel to zoom")}</Label>
        </svg>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {mode === "radiance"
            ? ([["θ", theta, setTheta, 0, 88, 1], ["φ", phi, setPhi, 0, 359, 1], ["dω size", dAng, setDAng, 4, 30, 1]] as const).map(([label, v, set, min, max, stp]) => (
              <label key={label} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
                <input type="range" min={min} max={max} step={stp} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}°</span>
              </label>
            ))
            : (
              <label className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">Δθ = Δφ</span>
                <input type="range" min={3} max={30} step={1} value={stepDeg} onChange={e => setStepDeg(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{stepDeg}°</span>
              </label>
            )}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {mode === "radiance"
              ? tx(t, "figHemi_note", "Tilt the light toward the horizon: the purple patch dω keeps its size on the sphere, but its footprint on the surface shrinks by cos θ. The same radiance spread over a bigger area delivers less energy per square metre — that factor is the n·l of every lighting model.")
              : tx(t, "figHemi_samplesNote", "Each dot is one direction a shader would sample; its size is the weight cos θ · sin θ. sin θ corrects for rings near the pole being smaller than rings near the horizon; cos θ is Lambert's law. Make the step finer and the sum settles on π.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[210px]">
          {mode === "radiance" ? (
            <>
              <div>ωᵢ = ({w.map(c => c.toFixed(2)).join(", ")})</div>
              <div>dω ≈ sin θ·Δθ·Δφ = <span className="text-[#a855f7]">{dOmega.toFixed(4)}</span> sr</div>
              <div>cos θ = n·ωᵢ = <span className="text-[#22c55e]">{cosT.toFixed(3)}</span></div>
              <div>{tx(t, "figHemi_footprint", "footprint")} = dω·cos θ = <span className="text-[#a855f7]">{(dOmega * cosT).toFixed(4)}</span></div>
              <div className="text-[var(--code-muted)]">Ω = 2π ≈ 6.2832 sr</div>
            </>
          ) : (
            <>
              <div>{tx(t, "figHemi_count", "samples")}: {n}</div>
              <div>Σ cos θ sin θ Δθ Δφ = <span className="text-[#f59e0b]">{sum.toFixed(4)}</span></div>
              <div>π = 3.1416</div>
              <div className="text-[var(--code-muted)]">{tx(t, "figHemi_err", "error")}: {(((sum - Math.PI) / Math.PI) * 100).toFixed(2)}%</div>
            </>
          )}
        </div>
      </div>
    </FigureShell>
  );
}
