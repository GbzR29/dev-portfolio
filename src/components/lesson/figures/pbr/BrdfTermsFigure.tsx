"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// The three factors of the Cook-Torrance specular term, each plotted on its own:
//   D — GGX normal distribution against the angle between n and h, plus the
//       polar lobe, with a numerical check that ∫ D (n·h) dω = 1.
//   G — Schlick-GGX (one direction) against the angle to the view/light, for
//       the direct-lighting and the IBL remapping of k.
//   F — Fresnel-Schlick against the viewing angle for a few real F0 values,
//       with the colour a viewer would see at each angle.

const PW = 440, PH = 210, PL = 36, PB = 26, PT = 10, PR = 12;
const deg = (d: number) => (d * Math.PI) / 180;

export const D_GGX = (NdotH: number, rough: number) => {
  const a2 = rough ** 4, d = NdotH * NdotH * (a2 - 1) + 1;
  return a2 / (Math.PI * d * d);
};
export const G1 = (NdotX: number, k: number) => NdotX / (NdotX * (1 - k) + k);
export const kDirect = (rough: number) => ((rough + 1) ** 2) / 8;
export const kIBL = (rough: number) => (rough * rough) / 2;
export const fresnel = (cosT: number, f0: number) => f0 + (1 - f0) * Math.pow(1 - cosT, 5);

type Rgb = [number, number, number];
const F0S: { name: string; f0: Rgb }[] = [
  { name: "water", f0: [0.02, 0.02, 0.02] },
  { name: "plastic", f0: [0.04, 0.04, 0.04] },
  { name: "diamond", f0: [0.17, 0.17, 0.17] },
  { name: "iron", f0: [0.56, 0.57, 0.58] },
  { name: "copper", f0: [0.95, 0.64, 0.54] },
  { name: "gold", f0: [1.0, 0.71, 0.29] },
];
const toSrgb = (c: number) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, c)), 1 / 2.2));
const css = (c: Rgb) => `rgb(${toSrgb(c[0])},${toSrgb(c[1])},${toSrgb(c[2])})`;

/** ∫ D(h) (n·h) dω over the hemisphere — should be 1 for every roughness. */
function dNormalization(rough: number) {
  let s = 0; const N = 400, dt = (Math.PI / 2) / N;
  for (let i = 0; i < N; i++) { const th = (i + 0.5) * dt; s += D_GGX(Math.cos(th), rough) * Math.cos(th) * Math.sin(th) * dt; }
  return s * 2 * Math.PI;
}

export function BrdfTermsFigure({ t, initial = "D" }: { t?: TrackTranslations; initial?: "D" | "G" | "F" }) {
  const [tab, setTab] = useState<"D" | "G" | "F">(initial);
  const [rough, setRough] = useState(0.4);
  const [mat, setMat] = useState(5);

  const x = (a: number) => PL + (a / 90) * (PW - PL - PR);
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  // Plot helpers
  const curve = (fn: (a: number) => number, yMax: number) => Array.from({ length: 181 }, (_, i) => {
    const a = (i / 180) * 89.5, v = Math.min(yMax * 1.05, fn(a));
    return `${i ? "L" : "M"} ${x(a).toFixed(1)} ${(PT + (1 - v / yMax) * (PH - PT - PB)).toFixed(1)}`;
  }).join(" ");
  const yOf = (v: number, yMax: number) => PT + (1 - v / yMax) * (PH - PT - PB);

  const dMax = Math.max(1, D_GGX(1, Math.max(rough, 0.18)) * 1.1);
  const roughList = [0.1, 0.25, 0.5, 0.75, 1];
  const axisLabel = tab === "D" ? "θₕ = ∠(n, h)" : tab === "G" ? "θ = ∠(n, v) or ∠(n, l)" : "θ = ∠(h, v)";
  const yMax = tab === "D" ? dMax : 1;

  // Polar lobe of D for the D tab
  const lobe = Array.from({ length: 121 }, (_, i) => {
    const a = -90 + (i / 120) * 180, v = D_GGX(Math.cos(deg(a)), rough) / D_GGX(1, rough);
    return `${i ? "L" : "M"} ${(60 + Math.sin(deg(a)) * v * 50).toFixed(1)} ${(70 - Math.cos(deg(a)) * v * 50).toFixed(1)}`;
  }).join(" ");

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBrdf_title", "Cook-Torrance, One Factor at a Time")}
        </span>
        <div className="flex gap-1.5">
          {(["D", "G", "F"] as const).map(k => <button key={k} className={btn(tab === k)} onClick={() => setTab(k)}>{k}</button>)}
        </div>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 grid gap-2 md:grid-cols-[1fr_auto] items-center">
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto select-none" role="img" aria-label={`${tab} term plot`}>
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line x1={PL} y1={yOf(f * yMax, yMax)} x2={PW - PR} y2={yOf(f * yMax, yMax)} stroke="var(--code-line)" strokeWidth={0.7} />
              <text x={PL - 4} y={yOf(f * yMax, yMax) + 3} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">
                {(f * yMax).toFixed(yMax > 40 ? 0 : yMax > 5 ? 1 : 2)}
              </text>
            </g>
          ))}
          {[0, 15, 30, 45, 60, 75, 90].map(a => (
            <text key={a} x={x(a)} y={PH - PB + 12} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="middle">{a}°</text>
          ))}
          <text x={PW - PR} y={PH - 2} fill="var(--code-muted)" fontSize="8" fontFamily="monospace" textAnchor="end">{axisLabel}</text>

          {tab === "D" && roughList.map(r0 => (
            <path key={r0} d={curve(a => D_GGX(Math.cos(deg(a)), r0), yMax)} fill="none" stroke="#a855f7" strokeWidth={0.8} opacity={0.3} />
          ))}
          {tab === "D" && <path d={curve(a => D_GGX(Math.cos(deg(a)), rough), yMax)} fill="none" stroke="#a855f7" strokeWidth={2.4} />}

          {tab === "G" && roughList.map(r0 => (
            <path key={r0} d={curve(a => G1(Math.cos(deg(a)), kDirect(r0)), 1)} fill="none" stroke="#22c55e" strokeWidth={0.8} opacity={0.3} />
          ))}
          {tab === "G" && <>
            <path d={curve(a => G1(Math.cos(deg(a)), kDirect(rough)), 1)} fill="none" stroke="#22c55e" strokeWidth={2.4} />
            <path d={curve(a => G1(Math.cos(deg(a)), kIBL(rough)), 1)} fill="none" stroke="#06b6d4" strokeWidth={1.6} strokeDasharray="5 3" />
          </>}

          {tab === "F" && F0S.map((m, i) => (
            <path key={m.name} d={curve(a => fresnel(Math.cos(deg(a)), (m.f0[0] + m.f0[1] + m.f0[2]) / 3), 1)} fill="none"
              stroke={m.f0[0] === m.f0[2] ? "var(--code-text)" : css(m.f0)} strokeWidth={mat === i ? 2.6 : 1} opacity={mat === i ? 1 : 0.45} />
          ))}
        </svg>

        <div className="flex md:flex-col items-center gap-2 px-2">
          {tab === "D" && (
            <svg viewBox="0 0 120 80" className="w-[140px] h-auto">
              <line x1={4} y1={70} x2={116} y2={70} stroke="var(--code-muted)" />
              <path d={lobe} fill="rgba(168,85,247,0.25)" stroke="#a855f7" strokeWidth={1.4} />
              <line x1={60} y1={70} x2={60} y2={14} stroke="#22c55e" strokeDasharray="2 2" />
              <text x={63} y={16} fill="#22c55e" fontSize="8" fontFamily="monospace">n</text>
            </svg>
          )}
          {tab === "F" && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-[var(--text-muted)]">0° → 90°</span>
              <div className="flex rounded overflow-hidden border border-[var(--code-border)]">
                {Array.from({ length: 12 }, (_, i) => {
                  const a = (i / 11) * 89, f = F0S[mat].f0.map(c => fresnel(Math.cos(deg(a)), c)) as Rgb;
                  return <div key={i} className="w-3.5 h-10" style={{ background: css(f) }} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-2">
        {tab !== "F" ? (
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">roughness</span>
            <input type="range" min={0.05} max={1} step={0.01} value={rough} onChange={e => setRough(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{rough.toFixed(2)}</span>
          </label>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {F0S.map((m, i) => (
              <button key={m.name} className={btn(mat === i)} onClick={() => setMat(i)}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: css(m.f0) }} />{m.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tab === "D" && tx(t, "figBrdf_dNote", "Low roughness: nearly all microfacets face along n, so D is a tall narrow spike — a small, very bright highlight. High roughness: the facets point everywhere and D flattens into a wide lobe. The area under the (projected) curve never changes: the facets always cover the same surface.")}
          {tab === "G" && tx(t, "figBrdf_gNote", "G is 1 when you look straight down and falls toward the horizon, where facets hide each other. Rougher surfaces lose more. The dashed line uses the smaller k for image-based lighting.")}
          {tab === "F" && tx(t, "figBrdf_fNote", "Every material becomes a perfect mirror at grazing angles. Dielectrics start near 4% head-on and shoot up only near 90°; metals start high and keep their tint — the colour of gold is its F0.")}
        </p>
        <div className="font-mono text-[10.5px] text-[var(--code-text)]">
          {tab === "D" && <>D(n·h = 1) = <span className="text-[#a855f7]">{D_GGX(1, rough).toFixed(2)}</span> · ∫ D (n·h) dω = <span className="text-[#a855f7]">{dNormalization(rough).toFixed(3)}</span></>}
          {tab === "G" && <>k<sub>direct</sub> = (r+1)²/8 = <span className="text-[#22c55e]">{kDirect(rough).toFixed(3)}</span> · k<sub>IBL</sub> = r²/2 = <span className="text-[#06b6d4]">{kIBL(rough).toFixed(3)}</span> · G₁(60°) = {G1(0.5, kDirect(rough)).toFixed(3)}</>}
          {tab === "F" && <>F0 = ({F0S[mat].f0.map(c => c.toFixed(2)).join(", ")}) · F(60°) = ({F0S[mat].f0.map(c => fresnel(0.5, c).toFixed(2)).join(", ")}) · F(85°) = ({F0S[mat].f0.map(c => fresnel(Math.cos(deg(85)), c).toFixed(2)).join(", ")})</>}
        </div>
      </div>
    </FigureShell>
  );
}
