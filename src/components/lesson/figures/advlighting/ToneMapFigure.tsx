"use client";

import { useEffect, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Tone mapping operators side by side. Left: each curve's response to grey,
// from 6 stops below middle exposure to 8 stops above (log scale, so equal
// steps are equal ratios of light). Right: every hue at full saturation,
// brighter and brighter going up. A good operator keeps the hue and gradually
// desaturates toward white as the light gets extreme ("path to white"), like
// film and like our eyes. Per-channel curves bend hues (bright blue → purple,
// bright red → orange); clamping just saturates to flat, blown-out patches.

type V3 = [number, number, number];
const luma = (c: V3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const mul = (m: number[], c: V3): V3 => [m[0] * c[0] + m[1] * c[1] + m[2] * c[2], m[3] * c[0] + m[4] * c[1] + m[5] * c[2], m[6] * c[0] + m[7] * c[1] + m[8] * c[2]];
const hableF = (x: number) => { const A = 0.15, B = 0.5, C = 0.1, D = 0.2, E = 0.02, F = 0.3; return (x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F) - E / F; };
// Stephen Hill's ACES fit (rows): sRGB → ACES AP1-ish input, RRT+ODT curve, back to sRGB
const ACES_IN = [0.59719, 0.35458, 0.04823, 0.076, 0.90834, 0.01566, 0.0284, 0.13383, 0.83777];
const ACES_OUT = [1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602];
const rrtOdt = (v: number) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
// Minimal AgX (Troy Sobotka's AgX, fitted by Benjamin Wrensch), matrices as rows
const AGX_IN = [0.842479062253094, 0.0784335999999992, 0.0792237451477643, 0.0423282422610123, 0.878468636469772, 0.0791661274605434, 0.0423756549057051, 0.0784336, 0.879142973793104];
const AGX_OUT = [1.19687900512017, -0.0980208811401368, -0.0990297440797205, -0.0528968517574562, 1.15190312990417, -0.0989611768448433, -0.0529716355144438, -0.0980434501171241, 1.15107367264116];
const agxCurve = (x: number) => { const x2 = x * x, x4 = x2 * x2; return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; };

/** Each operator maps linear scene RGB to display RGB; `encoded` says whether the result is already sRGB-encoded. */
const OPS: Record<string, { f: (c: V3) => V3; encoded?: boolean; color: string }> = {
  clamp: { f: c => c.map(v => Math.min(1, v)) as V3, color: "#94a3b8" },
  "Reinhard (per channel)": { f: c => c.map(v => v / (1 + v)) as V3, color: "#3b82f6" },
  "Reinhard (luminance)": { f: c => { const L = luma(c), k = L > 0 ? 1 / (1 + L) : 1; return c.map(v => v * k) as V3; }, color: "#06b6d4" },
  "Hable (Uncharted 2)": { f: c => c.map(v => hableF(v * 2) / hableF(11.2)) as V3, color: "#22c55e" },
  "ACES (Narkowicz)": { f: c => c.map(v => { const x = v * 0.6; return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); }) as V3, color: "#f59e0b" },
  "ACES (Hill fit)": { f: c => mul(ACES_OUT, mul(ACES_IN, c).map(rrtOdt) as V3), color: "#ef4444" },
  AgX: {
    f: c => {
      const lo = -12.47393, hi = 4.026069;
      const v = mul(AGX_IN, c).map(x => agxCurve((Math.min(hi, Math.max(lo, Math.log2(Math.max(x, 1e-10)))) - lo) / (hi - lo))) as V3;
      return mul(AGX_OUT, v);
    }, encoded: true, color: "#a855f7",
  },
};
type OpKey = keyof typeof OPS;
const GW = 240, GH = 150, EV0 = -3, EV1 = 8;           // hue grid size and exposure range (stops)
const enc = (v: number) => { v = Math.max(0, Math.min(1, v)); return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; };
const display = (op: OpKey, c: V3) => { const o = OPS[op].f(c); return OPS[op].encoded ? o.map(v => Math.max(0, Math.min(1, v))) : o.map(enc); };

export function ToneMapFigure({ t }: { t?: TrackTranslations }) {
  const [op, setOp] = useState<OpKey>("ACES (Hill fit)");
  const [sat, setSat] = useState(1);
  const [grid, setGrid] = useState<string | null>(null);

  useEffect(() => {
    const c = document.createElement("canvas"); c.width = GW; c.height = GH;
    const g = c.getContext("2d");
    if (!g) return;
    const im = g.createImageData(GW, GH);
    for (let y = 0; y < GH; y++) {
      const ev = EV1 - (y / (GH - 1)) * (EV1 - EV0), k = 0.36 * Math.pow(2, ev);   // 2× middle grey at 0 EV: saturated hues are darker
      for (let x = 0; x < GW; x++) {
        const h = x / GW;
        const rgb = [0, 2 / 3, 1 / 3].map(o => Math.min(1, Math.max(0, Math.abs(((h + o) % 1) * 6 - 3) - 1))) as V3;
        const col = rgb.map(v => (1 - sat + sat * v) * k) as V3;                   // the hue, scaled by exposure
        const d = display(op, col);
        im.data.set([d[0] * 255, d[1] * 255, d[2] * 255, 255], (y * GW + x) * 4);
      }
    }
    g.putImageData(im, 0, 0);
    setGrid(c.toDataURL());
  }, [op, sat]);

  const PW = 300, PH = 190, P0 = 26;
  const Xs = (ev: number) => P0 + ((ev + 6) / 14) * (PW - P0 - 8), Ys = (v: number) => PH - 20 - v * (PH - 34);
  const curve = (k: OpKey) => Array.from({ length: 141 }, (_, i) => {
    const ev = -6 + i / 10, v = 0.18 * Math.pow(2, ev), d = display(k, [v, v, v])[1];
    return `${i ? "L" : "M"}${Xs(ev).toFixed(1)},${Ys(d).toFixed(1)}`;
  }).join(" ");
  const btn = (on: boolean) => `px-2 py-1 text-[9.5px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figTone_title", "Tone Mappers — Curves, Hue Shifts and the Path to White")}
        </span>
      </div>
      <div className="grid md:grid-cols-[1fr_1fr] gap-2 bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto" role="img" aria-label="Tone curves">
          {[0, 0.5, 1].map(v => <line key={v} x1={P0} y1={Ys(v)} x2={PW - 8} y2={Ys(v)} stroke="var(--code-line)" />)}
          {[-6, -3, 0, 3, 6].map(ev => <text key={ev} x={Xs(ev)} y={PH - 6} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="var(--code-muted)">{ev > 0 ? `+${ev}` : ev}</text>)}
          <line x1={Xs(0)} y1={Ys(0)} x2={Xs(0)} y2={Ys(1)} stroke="var(--code-muted)" strokeDasharray="2 3" />
          <text x={Xs(0) + 3} y={Ys(1) + 8} fontSize="7" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figTone_mid", "18% grey")}</text>
          {(Object.keys(OPS) as OpKey[]).map(k => (
            <path key={k} d={curve(k)} fill="none" stroke={OPS[k].color} strokeWidth={k === op ? 2.6 : 1} opacity={k === op ? 1 : 0.45} />
          ))}
          <text x={P0} y={10} fontSize="7.5" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figTone_yAxis", "display value (sRGB)")}</text>
          <text x={PW - 8} y={PH - 14} textAnchor="end" fontSize="7" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figTone_xAxis", "stops from middle grey")}</text>
        </svg>
        <div className="relative">
          <svg viewBox={`0 0 ${GW} ${GH}`} className="w-full h-auto rounded" role="img" aria-label="Hue by exposure">{grid && <image href={grid} x={0} y={0} width={GW} height={GH} />}</svg>
          <span className="absolute left-1 top-1 font-mono text-[9px] text-white/80 bg-black/40 px-1 rounded">+{EV1} EV</span>
          <span className="absolute left-1 bottom-1 font-mono text-[9px] text-white/80 bg-black/40 px-1 rounded">{EV0} EV</span>
          <span className="absolute right-1 bottom-1 font-mono text-[9px] text-white/80 bg-black/40 px-1 rounded">{tx(t, "figTone_hue", "hue →")}</span>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(OPS) as OpKey[]).map(k => (
            <button key={k} className={btn(op === k)} onClick={() => setOp(k)}><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: OPS[k].color }} />{k}</button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{tx(t, "figTone_sat", "input saturation")}</span>
          <input type="range" min={0} max={1} step={0.01} value={sat} onChange={e => setSat(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
          <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{sat}</span>
        </label>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {op === "clamp"
            ? tx(t, "figTone_clampNote", "No tone mapping: everything above 1 is cut off. Past about +2 EV each hue becomes a flat block of its brightest channel pair, and yellow, cyan and magenta bands appear where one channel clips before the others.")
            : op === "Reinhard (luminance)"
              ? tx(t, "figTone_lumNote", "Scaling by luminance keeps every hue and ratio intact, but bright saturated colours never reach white. They stay fully saturated and clip channel by channel. Real film and real eyes desaturate very bright light, which this cannot do.")
              : op === "AgX"
                ? tx(t, "figTone_agxNote", "AgX (Blender 4's default) first nudges the primaries inward, then applies a log-encoded sigmoid per channel and nudges back. Bright colours travel smoothly to white with little hue skew. Compare the blue column with ACES: blue stays blue instead of drifting to purple.")
                : tx(t, "figTone_note", "Applied per channel, a curve compresses the brightest channel more than the others, so saturated colours desaturate toward white as they brighten. That is the path to white, and it reads as \"very bright\". The side effect is hue skew: bright pure blue drifts purple, red drifts orange, green yellow. Look at the upper rows. The ACES fits have a pronounced shoulder and contrast; Hable is softer.")}
        </p>
      </div>
    </figure>
  );
}
