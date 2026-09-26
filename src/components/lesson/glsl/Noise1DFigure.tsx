"use client";

import { useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// Noise in one dimension, where every piece is visible:
//   value noise    — a random value at each integer, interpolated between them
//   gradient noise — a random slope at each integer (the curve is 0 there),
//                    each slope's line g·(x − i) blended with the next (Perlin)
//   fBm            — the same noise summed over octaves: frequency × lacunarity,
//                    amplitude × gain per octave
// The interpolation curve decides how smooth the joins are: linear has kinks,
// smoothstep has continuous slope, quintic also continuous curvature.

const W = 560, H = 230, PAD = 18, CELLS = 8;
const hash = (i: number, seed: number) => { let h = (i * 374761393 + seed * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const FADES = {
  linear: (f: number) => f,
  smoothstep: (f: number) => f * f * (3 - 2 * f),
  quintic: (f: number) => f * f * f * (f * (f * 6 - 15) + 10),
};
type Fade = keyof typeof FADES;

function value1(x: number, seed: number, fade: Fade) {
  const i = Math.floor(x), f = x - i, u = FADES[fade](f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;            // in [0, 1]
}
function grad1(x: number, seed: number, fade: Fade) {
  const i = Math.floor(x), f = x - i, u = FADES[fade](f);
  const g0 = hash(i, seed) * 2 - 1, g1 = hash(i + 1, seed) * 2 - 1;
  return (g0 * f * (1 - u) + g1 * (f - 1) * u) * 2;                  // roughly [−1, 1]
}

export function Noise1DFigure({ t }: { t?: TrackTranslations }) {
  const [kind, setKind] = useState<"white" | "value" | "gradient" | "fBm">("value");
  const [fade, setFade] = useState<Fade>("smoothstep");
  const [seed, setSeed] = useState(3);
  const [octaves, setOctaves] = useState(4);
  const [lac, setLac] = useState(2);
  const [gain, setGain] = useState(0.5);

  const X = (x: number) => PAD + (x / CELLS) * (W - 2 * PAD);
  const mid = H / 2 - 4, amp = H / 2 - 30;
  const Y = (v: number) => mid - v * amp;
  const sig = (v: number) => (kind === "value" ? v * 2 - 1 : v);        // show value noise centred like the others
  const N = 480;
  const xs = Array.from({ length: N + 1 }, (_, k) => (k / N) * CELLS);

  const base = (x: number) => (kind === "value" ? value1(x, seed, fade) * 2 - 1 : grad1(x, seed, fade));
  let path = "", layers: string[] = [];
  if (kind === "white") {
    path = xs.map((x, k) => `${k ? "L" : "M"}${X(x).toFixed(1)},${Y(hash(Math.floor(x * 12), seed) * 2 - 1).toFixed(1)}`).join(" ");
  } else if (kind === "fBm") {
    const norm = Array.from({ length: octaves }, (_, o) => gain ** o).reduce((a, b) => a + b, 0);
    layers = Array.from({ length: octaves }, (_, o) => xs.map((x, k) => `${k ? "L" : "M"}${X(x).toFixed(1)},${Y(grad1(x * lac ** o, seed + o * 17, fade) * gain ** o).toFixed(1)}`).join(" "));
    path = xs.map((x, k) => {
      let v = 0;
      for (let o = 0; o < octaves; o++) v += grad1(x * lac ** o, seed + o * 17, fade) * gain ** o;
      return `${k ? "L" : "M"}${X(x).toFixed(1)},${Y(v / norm * 1.4).toFixed(1)}`;
    }).join(" ");
  } else {
    path = xs.map((x, k) => `${k ? "L" : "M"}${X(x).toFixed(1)},${Y(base(x)).toFixed(1)}`).join(" ");
  }

  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figNoise1_title", "Noise in One Dimension — Built Piece by Piece")}
        </span>
        <div className="flex gap-1.5 flex-wrap">{(["white", "value", "gradient", "fBm"] as const).map(k => <button key={k} className={btn(kind === k)} onClick={() => setKind(k)}>{k}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="1D noise">
          {Array.from({ length: CELLS + 1 }, (_, i) => <line key={i} x1={X(i)} y1={14} x2={X(i)} y2={H - 14} stroke="var(--code-line)" />)}
          <line x1={PAD} y1={mid} x2={W - PAD} y2={mid} stroke="var(--code-line)" strokeDasharray="3 3" />
          {layers.map((d, i) => <path key={i} d={d} fill="none" stroke="#a855f7" strokeWidth={1} opacity={0.2 + 0.5 * (1 - i / Math.max(1, layers.length))} />)}
          <path d={path} fill="none" stroke="var(--primary)" strokeWidth={2} />
          {kind === "value" && Array.from({ length: CELLS + 1 }, (_, i) => <circle key={i} cx={X(i)} cy={Y(sig(hash(i, seed)))} r={4} fill="#f59e0b" />)}
          {kind === "gradient" && Array.from({ length: CELLS + 1 }, (_, i) => {
            const g = (hash(i, seed) * 2 - 1) * 2, dx = 0.28;                // slope in value units per cell
            return (
              <g key={i}>
                <line x1={X(i - dx)} y1={Y(-g * dx)} x2={X(i + dx)} y2={Y(g * dx)} stroke="#f59e0b" strokeWidth={2.2} />
                <circle cx={X(i)} cy={Y(0)} r={3.5} fill="#f59e0b" />
              </g>
            );
          })}
          {Array.from({ length: CELLS + 1 }, (_, i) => <text key={i} x={X(i)} y={H - 3} textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--code-muted)">{i}</text>)}
        </svg>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        {kind !== "white" && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{tx(t, "figNoise1_fade", "interpolation")}</span>
            {(Object.keys(FADES) as Fade[]).map(f => <button key={f} className={btn(fade === f)} onClick={() => setFade(f)}>{f}</button>)}
          </div>
        )}
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {([["seed", seed, setSeed, 1, 40, 1], ...(kind === "fBm" ? [["octaves", octaves, setOctaves, 1, 8, 1], ["lacunarity", lac, setLac, 1.2, 3.5, 0.05], ["gain", gain, setGain, 0.2, 0.9, 0.01]] : [])] as [string, number, (v: number) => void, number, number, number][]).map(([label, v, set, min, max, step]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
            </label>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {kind === "white"
            ? tx(t, "figNoise1_whiteNote", "A hash per sample: every value is unrelated to its neighbour. That is useful for dithering and randomness per cell, but it looks like TV static, not like any natural surface.")
            : kind === "value"
              ? tx(t, "figNoise1_valueNote", "One random value per integer (dots), blended in between. With linear interpolation you can see a kink at every dot. Smoothstep has zero slope at the dots, so the joins are smooth, but hills tend to sit on the lattice, and on a 2D grid that shows as blocky, axis-aligned blobs.")
              : kind === "gradient"
                ? tx(t, "figNoise1_gradNote", "Perlin's idea: store a random slope at each integer instead of a value. The curve passes through 0 at every lattice point, and each point's line g·(x − i) is blended into the next. Peaks and valleys now fall between the lattice points and the grid is much harder to see. Quintic fading also keeps the curvature continuous, which matters once you take derivatives for normals.")
                : tx(t, "figNoise1_fbmNote", "Fractal Brownian motion: add octaves of the same noise, each with the frequency multiplied by the lacunarity and the amplitude by the gain (purple: the individual octaves). Gain 0.5 gives the classic 1/f 'natural' look; higher gain is rougher, lower is smoother. Coastlines, clouds and mountains all look like this.")}
        </p>
      </div>
    </FigureShell>
  );
}
