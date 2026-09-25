"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Everything that happens at ONE pixel covered by four transparent surfaces.
// Each layer has a colour, an opacity α and a view depth z. The correct answer
// composites them back to front with the "over" operator. The same operator
// in the order the draws were submitted gives a different colour. Weighted
// blended OIT (McGuire & Bavoil 2013) never sorts: it takes a weighted
// average of the layers' colours and multiplies the background by Π(1 − αᵢ).

type Layer = { name: string; c: [number, number, number]; a: number; z: number };
const INIT: Layer[] = [
  { name: "red glass", c: [0.95, 0.2, 0.2], a: 0.55, z: 3 },
  { name: "green glass", c: [0.2, 0.9, 0.3], a: 0.5, z: 6 },
  { name: "blue glass", c: [0.25, 0.45, 1.0], a: 0.6, z: 9 },
  { name: "smoke", c: [0.9, 0.9, 0.9], a: 0.25, z: 1.5 },
];
const BG: [number, number, number] = [0.12, 0.12, 0.14];
const WEIGHTS = {
  "eq. 7": (a: number, z: number) => a * Math.max(1e-2, Math.min(3e3, 10 / (1e-5 + (z / 5) ** 2 + (z / 200) ** 6))),
  "eq. 9": (a: number, z: number) => a * Math.max(1e-2, Math.min(3e3, 0.03 / (1e-5 + (z / 200) ** 4))),
  "no weight": (a: number) => a,
} as const;
type WKey = keyof typeof WEIGHTS;

const over = (layers: Layer[]) => {                  // back to front: C = αᵢCᵢ + (1 − αᵢ)C
  let c = [...BG];
  for (const l of layers) c = c.map((v, k) => l.a * l.c[k] + (1 - l.a) * v);
  return c as [number, number, number];
};
const hex = (c: number[]) => `rgb(${c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(",")})`;
const err = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function OitLayersFigure({ t }: { t?: TrackTranslations }) {
  const [layers, setLayers] = useState(INIT);
  const [order, setOrder] = useState<number[]>([0, 1, 2, 3]);   // submission order
  const [wkey, setWkey] = useState<WKey>("eq. 7");

  const sorted = [...layers].sort((a, b) => b.z - a.z);           // far → near
  const truth = over(sorted);
  const submitted = over(order.map(i => layers[i]));
  const W = WEIGHTS[wkey];
  let acc = [0, 0, 0], accA = 0, reveal = 1;
  for (const l of layers) {
    const w = W(l.a, l.z);
    acc = acc.map((v, k) => v + l.c[k] * l.a * w); accA += l.a * w; reveal *= 1 - l.a;
  }
  const avg = acc.map(v => v / Math.max(accA, 1e-5));
  const wboit = avg.map((v, k) => v * (1 - reveal) + BG[k] * reveal);
  const additive = layers.reduce((c, l) => c.map((v, k) => v + l.c[k] * l.a), [...BG]);

  const set = (i: number, patch: Partial<Layer>) => setLayers(ls => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const results: [string, number[], string][] = [
    [tx(t, "figOitL_truth", "over, sorted (correct)"), truth, ""],
    [tx(t, "figOitL_sub", "over, submission order"), submitted, `Δ ${err(submitted, truth).toFixed(3)}`],
    [`WBOIT (${wkey})`, wboit, `Δ ${err(wboit, truth).toFixed(3)}`],
    [tx(t, "figOitL_add", "additive"), additive, `Δ ${err(additive, truth).toFixed(3)}`],
  ];

  // Side view: depth to the right, eye on the left
  const SW = 300, SHh = 150;
  const Xz = (z: number) => 30 + (z / 11) * (SW - 50);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figOitL_title", "One Pixel, Four Transparent Layers")}
        </span>
        <div className="flex gap-1.5">{(Object.keys(WEIGHTS) as WKey[]).map(k => <button key={k} className={btn(wkey === k)} onClick={() => setWkey(k)}>{k}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-3 grid gap-3 md:grid-cols-[1fr_1fr] items-center">
        <svg viewBox={`0 0 ${SW} ${SHh}`} className="w-full h-auto" role="img" aria-label="Layers along the view ray">
          <line x1={14} y1={SHh / 2} x2={SW - 6} y2={SHh / 2} stroke="var(--code-muted)" strokeDasharray="3 3" />
          <circle cx={14} cy={SHh / 2} r={6} fill="#3b82f6" />
          <text x={14} y={SHh / 2 + 18} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">eye</text>
          <rect x={SW - 14} y={20} width={10} height={SHh - 40} fill={hex(BG)} stroke="var(--code-muted)" />
          {layers.map((l, i) => (
            <g key={i}>
              <rect x={Xz(l.z) - 4} y={24 + i * 6} width={8} height={SHh - 48 - i * 12} fill={hex(l.c)} fillOpacity={0.25 + 0.7 * l.a} stroke={hex(l.c)} />
              <text x={Xz(l.z)} y={16} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--code-text)">{order.indexOf(i) + 1}</text>
            </g>
          ))}
          <text x={SW / 2} y={SHh - 4} textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figOitL_axis", "depth → (numbers = draw order)")}</text>
        </svg>
        <div className="grid grid-cols-2 gap-2">
          {results.map(([name, c, d]) => (
            <div key={name} className="rounded-lg border border-[var(--code-border)] overflow-hidden">
              <div className="h-12" style={{ background: hex(c) }} />
              <div className="px-2 py-1 font-mono text-[9.5px] text-[var(--code-text)] leading-tight">{name}<div className="text-[var(--code-muted)]">{d || "reference"}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {layers.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: hex(l.c) }} />
              <span className="w-20 truncate">{l.name}</span>
              α<input type="range" min={0} max={1} step={0.01} value={l.a} onChange={e => set(i, { a: Number(e.target.value) })} className="w-20 accent-[var(--primary)]" />
              z<input type="range" min={0.5} max={10.5} step={0.1} value={l.z} onChange={e => set(i, { z: Number(e.target.value) })} className="w-20 accent-[var(--primary)]" />
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">{tx(t, "figOitL_orderLbl", "draw order")}</span>
          <button className={btn(false)} onClick={() => setOrder(o => [...o].reverse())}>reverse</button>
          <button className={btn(false)} onClick={() => setOrder(o => [...o.slice(1), o[0]])}>rotate</button>
          <button className={btn(false)} onClick={() => setOrder([...layers.keys()].sort((a, b) => layers[b].z - layers[a].z))}>sort back→front</button>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figOitL_note", "\"Over\" is not commutative: the last layer drawn covers the others by its α, so the draw order changes the colour unless it matches depth. WBOIT gets the total coverage exactly right (the background always shows through by Π(1 − αᵢ)) and only approximates how the layers' colours mix: a depth-weighted average in which nearer layers count more. With similar colours it is nearly perfect; with three strongly different glasses you can see its error. Additive never sorts either, but only suits light: fire, sparks, holograms.")}
        </p>
      </div>
    </figure>
  );
}
