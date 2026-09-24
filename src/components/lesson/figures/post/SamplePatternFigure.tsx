"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Rasterisation up close. Each square is one pixel; the dots are the points
// where the GPU tests "is this inside the triangle?".
//   1 sample   — one test at the centre: a pixel is all-in or all-out (jaggies)
//   MSAA 4×    — four coverage tests, but the fragment shader runs ONCE per
//                pixel; its colour is stored in every covered sample
//   SSAA 4×    — four tests AND four shader runs: the image rendered at 2×2
//                resolution and averaged
//   16×        — a finer ordered grid, for reference
// Turn on the striped texture to see what MSAA does not fix: detail *inside*
// the triangle is still shaded once per pixel.

const COLS = 12, ROWS = 8, PX = 36, W = COLS * PX, H = ROWS * PX;
type P = { x: number; y: number };
const PATTERNS: Record<string, { pts: P[]; perSampleShading: boolean }> = {
  "1 sample": { pts: [{ x: 0.5, y: 0.5 }], perSampleShading: false },
  "MSAA 4×": { pts: [{ x: 0.375, y: 0.125 }, { x: 0.875, y: 0.375 }, { x: 0.125, y: 0.625 }, { x: 0.625, y: 0.875 }], perSampleShading: false },
  "SSAA 4×": { pts: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.75 }, { x: 0.75, y: 0.75 }], perSampleShading: true },
  "16×": { pts: Array.from({ length: 16 }, (_, i) => ({ x: ((i % 4) + 0.5) / 4, y: (Math.floor(i / 4) + 0.5) / 4 })), perSampleShading: true },
};

const edge = (a: P, b: P, p: P) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
function inside(tri: P[], p: P) {
  const e0 = edge(tri[0], tri[1], p), e1 = edge(tri[1], tri[2], p), e2 = edge(tri[2], tri[0], p);
  return (e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0);
}

const BG: [number, number, number] = [0.1, 0.12, 0.16];
export function SamplePatternFigure({ t }: { t?: TrackTranslations }) {
  const [tri, setTri] = useState<P[]>([{ x: 1.3, y: 6.8 }, { x: 10.6, y: 1.2 }, { x: 8.4, y: 7.4 }]);
  const [pat, setPat] = useState("MSAA 4×");
  const [stripes, setStripes] = useState(false);
  const [showSamples, setShowSamples] = useState(true);
  const drag = useRef<number | null>(null);

  // The "fragment shader": orange, or thin stripes (high-frequency texture)
  const shade = (p: P): [number, number, number] => {
    if (!stripes) return [0.96, 0.6, 0.12];
    const s = Math.sin((p.x + p.y * 0.3) * Math.PI * 2.6) > 0 ? 1 : 0;
    return s ? [0.98, 0.9, 0.7] : [0.55, 0.2, 0.05];
  };

  const { pts, perSampleShading } = PATTERNS[pat];
  let shaderRuns = 0, touched = 0;
  const pixels = Array.from({ length: COLS * ROWS }, (_, i) => {
    const cx = i % COLS, cy = Math.floor(i / COLS);
    const samples = pts.map(s => ({ x: cx + s.x, y: cy + s.y }));
    const cov = samples.map(s => inside(tri, s));
    const n = cov.filter(Boolean).length;
    if (n) touched++;
    let col: [number, number, number] = [0, 0, 0];
    if (perSampleShading) {
      samples.forEach((s, k) => { const c = cov[k] ? shade(s) : BG; col = [col[0] + c[0], col[1] + c[1], col[2] + c[2]]; });
      shaderRuns += n;
      col = col.map(v => v / samples.length) as typeof col;
    } else {
      // One shader run per touched pixel, evaluated at the pixel centre
      const c = n ? shade({ x: cx + 0.5, y: cy + 0.5 }) : BG;
      if (n) shaderRuns++;
      const k = n / samples.length;
      col = [BG[0] + (c[0] - BG[0]) * k, BG[1] + (c[1] - BG[1]) * k, BG[2] + (c[2] - BG[2]) * k];
    }
    return { cx, cy, col, samples, cov };
  });

  const toGrid = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * COLS, y: ((e.clientY - r.top) / r.height) * ROWS };
  };
  const rgb = (c: number[]) => `rgb(${c.map(v => Math.round(Math.min(1, v) * 255)).join(",")})`;
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSamples_title", "Sample Patterns — Coverage vs Shading")}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figSamples_hint", "drag the white corners")}</span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none touch-none" role="img" aria-label="Pixel sample coverage"
          onPointerDown={e => {
            const g = toGrid(e);
            const i = tri.findIndex(v => Math.hypot(v.x - g.x, v.y - g.y) < 0.6);
            if (i >= 0) { drag.current = i; e.currentTarget.setPointerCapture(e.pointerId); }
          }}
          onPointerMove={e => {
            if (drag.current === null) return;
            const g = toGrid(e);
            setTri(tr => tr.map((v, k) => k === drag.current ? { x: Math.min(COLS, Math.max(0, g.x)), y: Math.min(ROWS, Math.max(0, g.y)) } : v));
          }}
          onPointerUp={() => { drag.current = null; }}>
          {pixels.map(p => (
            <rect key={`${p.cx},${p.cy}`} x={p.cx * PX} y={p.cy * PX} width={PX} height={PX} fill={rgb(p.col)} stroke="rgba(148,163,184,0.25)" strokeWidth={0.6} />
          ))}
          <polygon points={tri.map(v => `${v.x * PX},${v.y * PX}`).join(" ")} fill="none" stroke="#fff" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
          {showSamples && pixels.flatMap(p => p.samples.map((s, k) => (
            <circle key={`${p.cx},${p.cy},${k}`} cx={s.x * PX} cy={s.y * PX} r={pts.length > 4 ? 1.6 : 2.6}
              fill={p.cov[k] ? "#22c55e" : "none"} stroke={p.cov[k] ? "#14532d" : "rgba(148,163,184,0.6)"} strokeWidth={0.7} />
          )))}
          {!perSampleShading && showSamples && pixels.filter(p => p.cov.some(Boolean)).map(p => (
            <path key={`c${p.cx},${p.cy}`} d={`M ${(p.cx + 0.5) * PX - 3} ${(p.cy + 0.5) * PX} h 6 M ${(p.cx + 0.5) * PX} ${(p.cy + 0.5) * PX - 3} v 6`} stroke="#3b82f6" strokeWidth={1.2} />
          ))}
          {tri.map((v, i) => <circle key={i} cx={v.x * PX} cy={v.y * PX} r={6} fill="#fff" stroke="#111" strokeWidth={1.2} className="cursor-grab" />)}
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {Object.keys(PATTERNS).map(k => <button key={k} className={btn(pat === k)} onClick={() => setPat(k)}>{k}</button>)}
            <span className="w-px h-5 bg-[var(--border)] mx-1" />
            <button className={btn(stripes)} onClick={() => setStripes(v => !v)}>{tx(t, "figSamples_stripes", "striped texture")}</button>
            <button className={btn(showSamples)} onClick={() => setShowSamples(v => !v)}>{tx(t, "figSamples_dots", "show samples")}</button>
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {perSampleShading
              ? tx(t, "figSamples_ssNote", "Supersampling shades every covered sample and averages them: edges and the texture inside are both smooth — at the cost of one shader run per sample.")
              : pat === "1 sample"
                ? tx(t, "figSamples_oneNote", "One sample per pixel: a pixel is either fully in or fully out. Drag a corner slowly and watch whole pixels pop on and off — the stair-steps of aliasing.")
                : tx(t, "figSamples_msNote", "MSAA tests coverage at 4 points but runs the fragment shader once per pixel (the blue cross); the colour is weighted by how many samples were covered. Edges get smooth at nearly the cost of no AA. Turn on the stripes: the inside still aliases, because the shader was only run once.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div>{tx(t, "figSamples_spp", "samples / pixel")}: {pts.length}</div>
          <div>{tx(t, "figSamples_touched", "pixels touched")}: {touched}</div>
          <div>{tx(t, "figSamples_runs", "fragment shader runs")}: <span className="text-[var(--primary)]">{shaderRuns}</span></div>
          <div className="text-[var(--code-muted)]">{tx(t, "figSamples_mem", "colour memory")}: {pts.length}× </div>
        </div>
      </div>
    </figure>
  );
}
