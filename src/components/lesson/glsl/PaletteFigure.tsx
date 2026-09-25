"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Íñigo Quílez's cosine palette: color(t) = a + b · cos(2π (c·t + d)).
// Each channel is one cosine wave: a is its centre, b its amplitude, c how
// many times it oscillates over t ∈ [0, 1], d where it starts (phase). The
// three curves are drawn with the resulting gradient under them; the GLSL
// line is ready to paste.

type V3 = [number, number, number];
type Pal = { a: V3; b: V3; c: V3; d: V3 };
const PRESETS: { name: string; p: Pal }[] = [
  { name: "rainbow", p: { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 1], d: [0, 0.33, 0.67] } },
  { name: "sunset", p: { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 1, 0.5], d: [0.8, 0.9, 0.3] } },
  { name: "ocean", p: { a: [0.0, 0.5, 0.5], b: [0.0, 0.5, 0.5], c: [0, 0.5, 0.33], d: [0, 0.5, 0.67] } },
  { name: "fire", p: { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [1, 0.7, 0.4], d: [0, 0.15, 0.2] } },
  { name: "neon", p: { a: [0.5, 0.5, 0.5], b: [0.5, 0.5, 0.5], c: [2, 1, 0], d: [0.5, 0.2, 0.25] } },
  { name: "earth", p: { a: [0.8, 0.5, 0.4], b: [0.2, 0.4, 0.2], c: [2, 1, 1], d: [0, 0.25, 0.25] } },
];
const CH = ["#ef4444", "#22c55e", "#3b82f6"];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function PaletteFigure({ t }: { t?: TrackTranslations }) {
  const [p, setP] = useState<Pal>(PRESETS[0].p);
  const col = (tt: number): V3 => [0, 1, 2].map(i => p.a[i] + p.b[i] * Math.cos(2 * Math.PI * (p.c[i] * tt + p.d[i]))) as V3;
  const W = 520, H = 170, PAD = 14;
  const X = (tt: number) => PAD + tt * (W - 2 * PAD), Y = (v: number) => PAD + (1 - v) * (H - 2 * PAD - 34);
  const set = (k: keyof Pal, i: number, v: number) => setP(q => ({ ...q, [k]: q[k].map((x, j) => (j === i ? v : x)) as V3 }));
  const f = (v: number) => v.toFixed(2);
  const glsl = `vec3 palette(float t) {
    vec3 a = vec3(${p.a.map(f).join(", ")});
    vec3 b = vec3(${p.b.map(f).join(", ")});
    vec3 c = vec3(${p.c.map(f).join(", ")});
    vec3 d = vec3(${p.d.map(f).join(", ")});
    return a + b * cos(6.28318 * (c * t + d));
}`;
  const btn = "px-2.5 py-1 text-[10px] font-mono rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]";
  const labels: Record<keyof Pal, string> = { a: "a · centre", b: "b · amplitude", c: "c · frequency", d: "d · phase" };

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figPal_title", "Cosine Palettes — Four vec3s, Endless Gradients")}
        </span>
        <div className="flex gap-1.5 flex-wrap">{PRESETS.map(x => <button key={x.name} className={btn} onClick={() => setP(x.p)}>{x.name}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Cosine palette">
          <line x1={PAD} y1={Y(0)} x2={W - PAD} y2={Y(0)} stroke="var(--code-line)" />
          <line x1={PAD} y1={Y(1)} x2={W - PAD} y2={Y(1)} stroke="var(--code-line)" strokeDasharray="3 3" />
          {[0, 1, 2].map(i => (
            <path key={i} fill="none" stroke={CH[i]} strokeWidth={1.8}
              d={Array.from({ length: 121 }, (_, k) => { const tt = k / 120; return `${k ? "L" : "M"}${X(tt).toFixed(1)},${Y(clamp01(col(tt)[i])).toFixed(1)}`; }).join(" ")} />
          ))}
          {Array.from({ length: 120 }, (_, k) => {
            const c = col((k + 0.5) / 120).map(v => Math.round(clamp01(v) * 255));
            return <rect key={k} x={X(k / 120)} y={H - 30} width={(W - 2 * PAD) / 120 + 0.6} height={22} fill={`rgb(${c.join(",")})`} />;
          })}
          <text x={PAD} y={H - 34} fontSize="8" fontFamily="monospace" fill="var(--code-muted)">t = 0</text>
          <text x={W - PAD} y={H - 34} fontSize="8" fontFamily="monospace" fill="var(--code-muted)" textAnchor="end">t = 1</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2 min-w-0">
          {(["a", "b", "c", "d"] as const).map(k => (
            <div key={k} className="grid grid-cols-[92px_1fr_1fr_1fr] gap-2 items-center">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{labels[k]}</span>
              {[0, 1, 2].map(i => (
                <input key={i} type="range" min={k === "c" ? 0 : k === "d" ? 0 : -0.5} max={k === "c" ? 3 : 1} step={0.01} value={p[k][i]}
                  onChange={e => set(k, i, Number(e.target.value))} style={{ accentColor: CH[i] }} className="w-full" aria-label={`${k}.${"rgb"[i]}`} />
              ))}
            </div>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figPal_note", "Each channel is a cosine wave over t. Keep a = b = 0.5 and the channel spans exactly [0, 1]. Different frequencies c make hues cycle at different speeds, and phases d that are offset by thirds give a full rainbow. Twelve numbers describe the whole gradient, with no texture lookup and no branching.")}
          </p>
        </div>
        <pre className="m-0 rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] overflow-x-auto">{glsl}</pre>
      </div>
    </figure>
  );
}
