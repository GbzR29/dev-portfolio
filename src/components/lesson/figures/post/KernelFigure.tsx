"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// A 3×3 convolution done by hand on a tiny greyscale image. Pick a pixel on
// the left: its 3×3 neighbourhood is multiplied cell by cell with the kernel
// and summed — that single number is the output pixel on the right. Every
// blur, sharpen and edge filter in the chapter is this, with different weights.

const N = 24, CELL = 9;
type K = number[];
const PRESETS: { name: string; k: K; div?: number; abs?: boolean }[] = [
  { name: "identity", k: [0, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: "box blur", k: [1, 1, 1, 1, 1, 1, 1, 1, 1], div: 9 },
  { name: "gaussian", k: [1, 2, 1, 2, 4, 2, 1, 2, 1], div: 16 },
  { name: "sharpen", k: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  { name: "edges (Laplacian)", k: [1, 1, 1, 1, -8, 1, 1, 1, 1], abs: true },
  { name: "Sobel X", k: [-1, 0, 1, -2, 0, 2, -1, 0, 1], abs: true },
  { name: "emboss", k: [-2, -1, 0, -1, 1, 1, 0, 1, 2] },
];

/** A small test image: a gradient, a disc, a square and a diagonal line. */
function source(): number[] {
  const img: number[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0.12 + (x / N) * 0.18;
    if (Math.hypot(x - 7, y - 8) < 5) v = 0.92;
    if (x >= 13 && x <= 20 && y >= 4 && y <= 11) v = 0.55;
    if (Math.abs(x - y - 2) < 0.8 && y > 13) v = 1;
    if (y >= 17 && y <= 21 && x >= 2 && x <= 9) v = ((x + y) % 2) ? 0.85 : 0.2;    // checker: high frequency
    img.push(v);
  }
  return img;
}
const at = (img: number[], x: number, y: number) => img[Math.min(N - 1, Math.max(0, y)) * N + Math.min(N - 1, Math.max(0, x))];   // clamp-to-edge
const grey = (v: number) => { const c = Math.round(Math.min(1, Math.max(0, v)) * 255); return `rgb(${c},${c},${c})`; };

export function KernelFigure({ t }: { t?: TrackTranslations }) {
  const [k, setK] = useState<K>(PRESETS[2].k);
  const [div, setDiv] = useState(16);
  const [absOut, setAbsOut] = useState(false);
  const [sel, setSel] = useState({ x: 7, y: 4 });
  const img = useMemo(source, []);

  const raw = (x: number, y: number) => {
    let s = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += at(img, x + i, y + j) * k[(j + 1) * 3 + (i + 1)];
    return s;
  };
  const conv = (x: number, y: number) => { const s = raw(x, y) / (div || 1); return absOut ? Math.abs(s) : s; };
  const out = useMemo(() => Array.from({ length: N * N }, (_, i) => conv(i % N, Math.floor(i / N))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [k, div, absOut, img]);

  const W = N * CELL;
  const grid = (data: number[], onPick: boolean) => (
    <svg viewBox={`0 0 ${W} ${W}`} className="w-full h-auto select-none rounded border border-[var(--code-border)]" style={{ imageRendering: "pixelated" }}
      onPointerDown={onPick ? e => pick(e) : undefined} onPointerMove={onPick ? e => { if (e.buttons) pick(e); } : undefined}>
      {data.map((v, i) => <rect key={i} x={(i % N) * CELL} y={Math.floor(i / N) * CELL} width={CELL + 0.3} height={CELL + 0.3} fill={grey(v)} />)}
      <rect x={(sel.x - (onPick ? 1 : 0)) * CELL} y={(sel.y - (onPick ? 1 : 0)) * CELL} width={(onPick ? 3 : 1) * CELL} height={(onPick ? 3 : 1) * CELL}
        fill="none" stroke="#f59e0b" strokeWidth={1.6} />
    </svg>
  );
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSel({ x: Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N))), y: Math.min(N - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * N))) });
  };

  const sum = k.reduce((a, b) => a + b, 0);
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;
  const same = (p: typeof PRESETS[number]) => p.k.every((v, i) => v === k[i]) && (p.div ?? 1) === div;

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figKernel_title", "Convolution by Hand — One 3×3 Kernel, Every Pixel")}
        </span>
      </div>

      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-3 md:p-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] items-center">
        <div>
          <p className="text-[9px] font-mono text-[var(--code-muted)] mb-1">{tx(t, "figKernel_in", "input — click or drag to pick a pixel")}</p>
          {grid(img, true)}
        </div>

        {/* The worked sum at the selected pixel */}
        <div className="flex flex-col items-center gap-2 font-mono text-[10px] text-[var(--code-text)]">
          <div className="grid grid-cols-3 gap-0.5">
            {[-1, 0, 1].flatMap(j => [-1, 0, 1].map(i => {
              const v = at(img, sel.x + i, sel.y + j), w = k[(j + 1) * 3 + (i + 1)];
              return (
                <div key={`${i},${j}`} className="w-[58px] h-[38px] rounded flex flex-col items-center justify-center border border-[var(--code-border)]"
                  style={{ background: grey(v), color: v > 0.55 ? "#111" : "#eee" }}>
                  <span>{v.toFixed(2)}</span>
                  <span className="text-[9px]" style={{ color: w > 0 ? "#16a34a" : w < 0 ? "#dc2626" : "inherit" }}>× {w}</span>
                </div>
              );
            }))}
          </div>
          <div className="text-center leading-relaxed">
            Σ = {raw(sel.x, sel.y).toFixed(3)}
            {div !== 1 && <> / {div}</>}
            <br />
            <span className="text-[#f59e0b]">→ {conv(sel.x, sel.y).toFixed(3)}</span>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-[var(--code-muted)] mb-1">{tx(t, "figKernel_out", "output")}</p>
          {grid(out, false)}
        </div>
      </div>

      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[auto_1fr] items-start">
        <div>
          <p className="text-[9px] font-mono text-[var(--text-muted)] mb-1">{tx(t, "figKernel_kernel", "kernel (edit me)")}</p>
          <div className="grid grid-cols-3 gap-1">
            {k.map((v, i) => (
              <input key={i} type="number" step={1} value={v}
                onChange={e => { const n = [...k]; n[i] = Number(e.target.value) || 0; setK(n); }}
                className="w-14 px-1.5 py-1 text-[11px] font-mono text-center rounded border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-text)]" />
            ))}
          </div>
          <label className="flex items-center gap-2 mt-2 text-[10px] font-mono text-[var(--text-muted)]">
            ÷ <input type="number" min={1} value={div} onChange={e => setDiv(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 px-1.5 py-1 text-[11px] font-mono text-center rounded border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-text)]" />
            <span>(Σk = {sum})</span>
          </label>
          <label className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--text-muted)]">
            <input type="checkbox" checked={absOut} onChange={e => setAbsOut(e.target.checked)} className="accent-[var(--primary)]" /> |result|
          </label>
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.name} className={btn(same(p))} onClick={() => { setK(p.k); setDiv(p.div ?? 1); setAbsOut(!!p.abs); }}>{p.name}</button>
            ))}
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figKernel_note", "Weights that sum to 1 keep the brightness (blurs, sharpen). Weights that sum to 0 erase flat areas and keep only change — edges; take the absolute value so negative edges show too. Try the checker patch at the bottom-left: a blur turns it into flat grey, sharpen makes it harsher.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
