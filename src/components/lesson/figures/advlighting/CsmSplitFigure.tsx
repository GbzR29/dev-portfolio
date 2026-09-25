"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Label } from "../../kit/svg";

// ── What this figure shows ────────────────────────────────────────────────────
// The camera frustum seen from above (the sun straight overhead), cut into
// cascades by the practical split scheme
//     z_i = λ · n (f/n)^(i/N) + (1 − λ) · (n + (f − n) i/N)
// with each cascade's shadow map drawn as the square that covers its slice.
// Below, on the same distance axis: how many screen pixels one shadow texel
// covers at each distance. Above the line the shadow looks sharp; below it,
// a texel is smeared over several pixels and the edges turn blocky.

const W = 540, PX = 36, PW = 480, TOP_H = 250, CH = 120, CY0 = TOP_H + 26;
const HALF = Math.tan((36 / 2) * Math.PI / 180);            // horizontal half-angle tangent
const SCREEN_H = 1080;
const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b"];

export function splits(n: number, f: number, count: number, lambda: number) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const log = n * Math.pow(f / n, i / count), uni = n + ((f - n) * i) / count;
    return lambda * log + (1 - lambda) * uni;
  });
}

/** The 2D slice [zn, zf] of the frustum (top view): its bounding square or bounding circle. */
function fit(zn: number, zf: number, sphere: boolean) {
  const hn = zn * HALF, hf = zf * HALF;
  if (!sphere) return { cx: (zn + zf) / 2, size: Math.max(zf - zn, 2 * hf) };
  // Circle through the near and far corners, centre on the axis (clamped to the far plane)
  let c = (zf * zf + hf * hf - zn * zn - hn * hn) / (2 * (zf - zn));
  c = Math.min(zf, Math.max(zn, c));
  const rad = Math.max(Math.hypot(c - zn, hn), Math.hypot(zf - c, hf));
  return { cx: c, size: 2 * rad };
}

export function CsmSplitFigure({ t }: { t?: TrackTranslations }) {
  const [count, setCount] = useState(4);
  const [lambda, setLambda] = useState(0.75);
  const [far, setFar] = useState(150);
  const [near, setNear] = useState(0.5);
  const [sphere, setSphere] = useState(true);
  const [mapSize, setMapSize] = useState(2048);

  const z = splits(near, far, count, lambda);
  const X = (d: number) => PX + (d / far) * PW;
  const k = PW / far;                                        // svg units per world unit
  const cy = TOP_H / 2 + 4;
  const fits = z.slice(0, -1).map((zn, i) => fit(zn, z[i + 1], sphere));
  const single = fit(near, far, sphere);

  // Texel density: screen pixels per shadow texel, log2
  const pxWorld = (d: number) => (2 * d * HALF) / SCREEN_H;
  const ratio = (d: number, size: number) => Math.log2(pxWorld(d) / (size / mapSize));
  const cascadeOf = (d: number) => { for (let i = 0; i < count; i++) if (d <= z[i + 1]) return i; return count - 1; };
  const CYmid = CY0 + CH / 2, CYs = CH / 10;                // chart y: log2 in [-5, 5]
  const Yc = (v: number) => CYmid - Math.max(-5, Math.min(5, v)) * CYs;
  const samples = Array.from({ length: 241 }, (_, i) => near + ((far - near) * i) / 240);
  const curve = samples.map((d, i) => `${i ? "L" : "M"} ${X(d).toFixed(1)} ${Yc(ratio(d, fits[cascadeOf(d)].size)).toFixed(1)}`).join(" ");
  const curveSingle = samples.map((d, i) => `${i ? "L" : "M"} ${X(d).toFixed(1)} ${Yc(ratio(d, single.size)).toFixed(1)}`).join(" ");

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figCsmSplit_title", "Splitting the Frustum — and What Each Texel Buys")}
        </span>
        <div className="flex gap-1.5">
          <button className={btn(!sphere)} onClick={() => setSphere(false)}>tight box</button>
          <button className={btn(sphere)} onClick={() => setSphere(true)}>bounding sphere</button>
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${CY0 + CH + 22}`} className="w-full h-auto select-none" role="img" aria-label="Cascade splits">
          <defs><clipPath id="csmTop"><rect x={0} y={0} width={W} height={TOP_H} /></clipPath></defs>
          <g clipPath="url(#csmTop)">
            {/* Cascade slices */}
            {z.slice(0, -1).map((zn, i) => {
              const zf = z[i + 1];
              return <polygon key={i} points={`${X(zn)},${cy - zn * HALF * k} ${X(zf)},${cy - zf * HALF * k} ${X(zf)},${cy + zf * HALF * k} ${X(zn)},${cy + zn * HALF * k}`}
                fill={COLORS[i]} fillOpacity={0.22} stroke={COLORS[i]} strokeWidth={0.8} />;
            })}
            {/* Shadow-map footprints */}
            {fits.map((f, i) => sphere
              ? <circle key={i} cx={X(f.cx)} cy={cy} r={(f.size / 2) * k} fill="none" stroke={COLORS[i]} strokeWidth={1.2} strokeDasharray="4 3" />
              : <rect key={i} x={X(f.cx) - (f.size / 2) * k} y={cy - (f.size / 2) * k} width={f.size * k} height={f.size * k} fill="none" stroke={COLORS[i]} strokeWidth={1.2} strokeDasharray="4 3" />)}
            <line x1={PX} y1={cy} x2={X(far)} y2={cy - far * HALF * k} stroke="var(--code-muted)" strokeWidth={1} />
            <line x1={PX} y1={cy} x2={X(far)} y2={cy + far * HALF * k} stroke="var(--code-muted)" strokeWidth={1} />
          </g>
          <circle cx={PX} cy={cy} r={5} fill="#3b82f6" />
          <Label x={PX - 4} y={cy + 18} size={8}>camera</Label>
          {z.map((d, i) => (
            <g key={i}>
              <line x1={X(d)} y1={TOP_H - 12} x2={X(d)} y2={TOP_H - 4} stroke="var(--code-text)" />
              {(i === 0 || i === z.length - 1 || X(d) - X(z[i - 1]) > 26) && <Label x={X(d)} y={TOP_H + 8} anchor="middle" size={7.5}>{d < 10 ? d.toFixed(1) : d.toFixed(0)}</Label>}
            </g>
          ))}

          {/* Texel density chart */}
          <rect x={PX} y={CY0} width={PW} height={CH} fill="var(--code-line)" opacity={0.35} />
          <rect x={PX} y={CY0} width={PW} height={CH / 2} fill="#22c55e" opacity={0.06} />
          <rect x={PX} y={CYmid} width={PW} height={CH / 2} fill="#ef4444" opacity={0.07} />
          <line x1={PX} y1={CYmid} x2={PX + PW} y2={CYmid} stroke="var(--code-muted)" strokeDasharray="3 3" />
          {[-4, -2, 2, 4].map(v => <text key={v} x={PX - 4} y={Yc(v) + 3} textAnchor="end" fontSize="7.5" fontFamily="monospace" fill="var(--code-muted)">{v > 0 ? `${2 ** v}` : `1/${2 ** -v}`}</text>)}
          <text x={PX - 4} y={CYmid + 3} textAnchor="end" fontSize="7.5" fontFamily="monospace" fill="var(--code-text)">1</text>
          <path d={curveSingle} fill="none" stroke="var(--code-muted)" strokeWidth={1.4} strokeDasharray="5 3" />
          <path d={curve} fill="none" stroke="var(--primary)" strokeWidth={2} />
          <Label x={PX + 6} y={CY0 + 12} size={7.5} color="#22c55e">{tx(t, "figCsmSplit_sharp", "texel smaller than a pixel: sharp")}</Label>
          <Label x={PX + 6} y={CY0 + CH - 4} size={7.5} color="#ef4444">{tx(t, "figCsmSplit_blocky", "one texel smeared over many pixels: blocky")}</Label>
          <Label x={PX + PW - 4} y={CY0 + 12} anchor="end" size={7.5}>{tx(t, "figCsmSplit_single", "- - one map for everything")}</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["cascades", count, setCount, 1, 4, 1], ["λ (log ↔ uniform)", lambda, setLambda, 0, 1, 0.05], ["near n", near, setNear, 0.1, 3, 0.1], ["far f", far, setFar, 20, 400, 5]] as const).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-28">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-28">{tx(t, "figCsmSplit_map", "map size")}</span>
          {[1024, 2048, 4096].map(s => <button key={s} className={btn(mapSize === s)} onClick={() => setMapSize(s)}>{s}²</button>)}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figCsmSplit_note", "A single map (dashed) must stretch its texels over the whole view, so near the camera one texel covers many pixels. Each cascade restarts the curve with a smaller footprint, lifting the near range back toward 1. λ = 0 splits evenly (the first cascade is wasted on a huge range); λ = 1 splits logarithmically (near slices become tiny). Most engines use λ ≈ 0.5–0.9. The sphere fit is a little larger than the tight box but keeps the same size as the camera turns, which matters for stability.")}
        </p>
      </div>
    </figure>
  );
}
