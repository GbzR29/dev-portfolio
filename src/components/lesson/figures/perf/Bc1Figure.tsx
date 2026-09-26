"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import assets from "@/lib/generated/assets.json";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// BC1 (DXT1) block compression, encoded here in the browser. Every 4×4 block
// of pixels is stored in 64 bits: two endpoint colours in RGB565 (16 bits
// each) and a 2-bit index per pixel choosing one of four palette colours:
// the two endpoints and two colours on the line between them. The whole
// block is therefore a straight segment through colour space. Click a block
// in the original to see its endpoints, palette, indices and error.

const N = 256;
type RGB = [number, number, number];
type Block = { c0: RGB; c1: RGB; palette: RGB[]; idx: number[]; raw: number };

const q565 = (c: RGB): RGB => [Math.round((c[0] / 255) * 31) * (255 / 31), Math.round((c[1] / 255) * 63) * (255 / 63), Math.round((c[2] / 255) * 31) * (255 / 31)];
const pack565 = (c: RGB) => (Math.round((c[0] / 255) * 31) << 11) | (Math.round((c[1] / 255) * 63) << 5) | Math.round((c[2] / 255) * 31);
const d2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Encodes one block. "pca": endpoints at the extremes along the principal axis; "box": per-channel min/max. */
function encodeBlock(px: RGB[], method: "pca" | "box"): Block {
  const mean = [0, 1, 2].map(k => px.reduce((s, p) => s + p[k], 0) / 16) as RGB;
  let a: RGB, b: RGB;
  if (method === "box") {
    a = [0, 1, 2].map(k => Math.min(...px.map(p => p[k]))) as RGB;
    b = [0, 1, 2].map(k => Math.max(...px.map(p => p[k]))) as RGB;
  } else {
    // Covariance, then power iteration for the dominant eigenvector (the colour line that fits best)
    const C = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const p of px) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j] += (p[i] - mean[i]) * (p[j] - mean[j]);
    let v: RGB = [1, 1, 1];
    for (let it = 0; it < 8; it++) {
      const w = [0, 1, 2].map(i => C[i * 3] * v[0] + C[i * 3 + 1] * v[1] + C[i * 3 + 2] * v[2]) as RGB;
      const l = Math.hypot(...w) || 1;
      v = w.map(x => x / l) as RGB;
    }
    const proj = px.map(p => (p[0] - mean[0]) * v[0] + (p[1] - mean[1]) * v[1] + (p[2] - mean[2]) * v[2]);
    const lo = Math.min(...proj), hi = Math.max(...proj);
    a = mean.map((m, k) => Math.max(0, Math.min(255, m + v[k] * lo))) as RGB;
    b = mean.map((m, k) => Math.max(0, Math.min(255, m + v[k] * hi))) as RGB;
  }
  let c0 = q565(b), c1 = q565(a);
  if (pack565(c0) < pack565(c1)) [c0, c1] = [c1, c0];     // c0 > c1 selects the 4-colour mode
  const palette: RGB[] = [c0, c1, c0.map((v, k) => (2 * v + c1[k]) / 3) as RGB, c0.map((v, k) => (v + 2 * c1[k]) / 3) as RGB];
  const idx = px.map(p => { let best = 0; for (let i = 1; i < 4; i++) if (d2(p, palette[i]) < d2(p, palette[best])) best = i; return best; });
  return { c0, c1, palette, idx, raw: 0 };
}

const MATS = (assets as unknown as { materials?: Record<string, { albedo: string }> }).materials ?? {};
const SOURCES = Object.entries(MATS).map(([id, m]) => ({ id, url: m.albedo }));

export function Bc1Figure({ t }: { t?: TrackTranslations }) {
  const [src, setSrc] = useState(SOURCES.find(s => s.id.includes("aqua"))?.id ?? SOURCES[0]?.id ?? "procedural");
  const [method, setMethod] = useState<"pca" | "box">("pca");
  const [pixels, setPixels] = useState<Uint8ClampedArray | null>(null);
  const [sel, setSel] = useState<[number, number]>([20, 24]);
  const origRef = useRef<HTMLCanvasElement>(null), decRef = useRef<HTMLCanvasElement>(null);

  // Load the source image into 256×256 pixels
  useEffect(() => {
    const c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    const url = SOURCES.find(s => s.id === src)?.url;
    const finish = () => setPixels(g.getImageData(0, 0, N, N).data);
    if (!url) {                                             // procedural fallback: gradients and hard edges
      const gr = g.createLinearGradient(0, 0, N, N); gr.addColorStop(0, "#e04a2a"); gr.addColorStop(0.5, "#f5d547"); gr.addColorStop(1, "#2a7de0");
      g.fillStyle = gr; g.fillRect(0, 0, N, N);
      for (let i = 0; i < 12; i++) { g.fillStyle = `hsl(${i * 30},70%,50%)`; g.beginPath(); g.arc(30 + (i % 4) * 65, 40 + Math.floor(i / 4) * 80, 22, 0, 7); g.fill(); }
      finish(); return;
    }
    const im = new Image();
    im.onload = () => { g.drawImage(im, 0, 0, N, N); finish(); };
    im.src = url;
  }, [src]);

  const encoded = useMemo(() => {
    if (!pixels) return null;
    const blocks: Block[] = [];
    const out = new Uint8ClampedArray(N * N * 4);
    let se = 0;
    for (let by = 0; by < N / 4; by++) for (let bx = 0; bx < N / 4; bx++) {
      const px: RGB[] = [];
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const o = ((by * 4 + y) * N + bx * 4 + x) * 4; px.push([pixels[o], pixels[o + 1], pixels[o + 2]]); }
      const b = encodeBlock(px, method);
      blocks.push(b);
      b.idx.forEach((ix, i) => {
        const o = ((by * 4 + (i >> 2)) * N + bx * 4 + (i & 3)) * 4, c = b.palette[ix];
        out.set([c[0], c[1], c[2], 255], o);
        se += d2(px[i], c);
      });
    }
    const mse = se / (N * N * 3);
    return { blocks, out, psnr: 10 * Math.log10((255 * 255) / Math.max(mse, 1e-9)) };
  }, [pixels, method]);

  useEffect(() => {
    if (!pixels || !encoded) return;
    const draw = (cv: HTMLCanvasElement | null, data: Uint8ClampedArray) => {
      if (!cv) return;
      const g = cv.getContext("2d")!;
      g.putImageData(new ImageData(new Uint8ClampedArray(data), N, N), 0, 0);
      g.strokeStyle = "#ff3"; g.lineWidth = 1;
      g.strokeRect(sel[0] * 4 - 0.5, sel[1] * 4 - 0.5, 5, 5);
    };
    draw(origRef.current, pixels);
    draw(decRef.current, encoded.out);
  }, [pixels, encoded, sel]);

  const block = encoded?.blocks[sel[1] * (N / 4) + sel[0]];
  const blockPx: RGB[] = [];
  if (pixels) for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const o = ((sel[1] * 4 + y) * N + sel[0] * 4 + x) * 4; blockPx.push([pixels[o], pixels[o + 1], pixels[o + 2]]); }
  const blockErr = block ? Math.sqrt(blockPx.reduce((s, p, i) => s + d2(p, block.palette[block.idx[i]]), 0) / 48) : 0;
  const rgb = (c: RGB) => `rgb(${c.map(Math.round).join(",")})`;
  const hex16 = (c: RGB) => "0x" + pack565(c).toString(16).padStart(4, "0");
  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSel([Math.min(63, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 64))), Math.min(63, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 64)))]);
  };
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBc1_title", "BC1 Block Compression — 64 Bits per 4×4 Pixels")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {SOURCES.map(s => <button key={s.id} className={btn(src === s.id)} onClick={() => setSrc(s.id)}>{s.id.split("-")[0].slice(0, 14)}</button>)}
          {!SOURCES.length && <span className="text-[10px] font-mono text-[var(--text-muted)]">procedural</span>}
        </div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] items-start">
        {[["original (RGB8, 192 KB)", origRef], ["BC1 (32 KB)", decRef]].map(([label, ref]) => (
          <div key={label as string}>
            <div className="text-[9.5px] font-mono text-[var(--code-muted)] mb-1">{label as string}</div>
            <canvas ref={ref as React.RefObject<HTMLCanvasElement>} width={N} height={N} onClick={pick} className="w-full rounded cursor-crosshair" style={{ imageRendering: "pixelated" }} />
          </div>
        ))}
        {block && (
          <div className="font-mono text-[10px] text-[var(--code-text)] space-y-2 min-w-[170px]">
            <div className="text-[var(--code-muted)]">block ({sel[0]}, {sel[1]})</div>
            <div className="grid grid-cols-4 gap-0.5 w-[136px]">
              {blockPx.map((p, i) => <div key={i} className="h-8 rounded-sm" style={{ background: rgb(p) }} />)}
            </div>
            <div className="grid grid-cols-4 gap-0.5 w-[136px]">
              {block.idx.map((ix, i) => <div key={i} className="h-8 rounded-sm flex items-center justify-center text-[9px] text-white/90" style={{ background: rgb(block.palette[ix]), textShadow: "0 0 2px black" }}>{ix}</div>)}
            </div>
            <div className="flex gap-1">{block.palette.map((c, i) => <div key={i} className="w-8 h-5 rounded-sm text-[8px] text-center text-white/90" style={{ background: rgb(c), textShadow: "0 0 2px black" }}>{i}</div>)}</div>
            <div>c0 = {hex16(block.c0)} · c1 = {hex16(block.c1)}</div>
            <div>{tx(t, "figBc1_blockRmse", "block RMSE")} = {blockErr.toFixed(1)}</div>
          </div>
        )}
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-20">endpoints</span>
          <button className={btn(method === "pca")} onClick={() => setMethod("pca")}>principal axis</button>
          <button className={btn(method === "box")} onClick={() => setMethod("box")}>bounding box</button>
          {encoded && <span className="text-[10px] font-mono text-[var(--primary)] ml-3">PSNR {encoded.psnr.toFixed(1)} dB</span>}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figBc1_note", "Top grid: the 16 original pixels. Bottom: what BC1 stores, each pixel replaced by one of four palette colours (numbers = 2-bit index). A block that really is a gradient between two colours survives almost perfectly. A block with three distinct hues, a tile edge between blue and white grout with a red accent, has to squeeze them onto one line, and loses one. Bounding-box endpoints are faster to find, but a diagonal of the RGB cube wastes palette entries on colours that are not in the block. The principal axis fits the actual spread. 6× smaller than RGB8, and GPUs decode it on the fly at full speed.")}
        </p>
      </div>
    </FigureShell>
  );
}
