"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Every pixel here is computed the way the GPU samples a texture:
//   Wrap     — UVs outside [0, 1] and the four wrap modes
//   Magnify  — one texel covers many pixels: NEAREST vs LINEAR (bilinear weights)
//   Minify   — many texels fall in one pixel: aliasing, and how mipmaps fix it

type RGB = [number, number, number];

// ── A small, asymmetric texture (rows listed top to bottom, like an image) ────
const ART = [
  "..........",
  ".RRRRRR...",
  ".RR.......",
  ".RR.......",
  ".RRRRR....",
  ".RR.......",
  ".RR...BBB.",
  ".RR...BBB.",
  ".RR...BBB.",
  "..........",
];
const PAL: Record<string, RGB> = { ".": [236, 228, 208], R: [220, 60, 60], B: [59, 110, 220] };
const TW = ART[0].length, TH = ART.length;
/** texel(i, j) with j = 0 at the BOTTOM row — OpenGL's texture origin. */
const texel = (i: number, j: number): RGB => PAL[ART[TH - 1 - j][i]];
const BORDER: RGB = [168, 85, 247];

type Wrap = "REPEAT" | "MIRRORED_REPEAT" | "CLAMP_TO_EDGE" | "CLAMP_TO_BORDER";

/** Maps a texel index along one axis, or -1 for "use the border colour". */
function wrapIndex(i: number, n: number, mode: Wrap): number {
  if (mode === "REPEAT") return ((i % n) + n) % n;
  if (mode === "MIRRORED_REPEAT") {
    const m = ((i % (2 * n)) + 2 * n) % (2 * n);
    return m < n ? m : 2 * n - 1 - m;
  }
  if (mode === "CLAMP_TO_EDGE") return Math.max(0, Math.min(n - 1, i));
  return i < 0 || i >= n ? -1 : i;
}

function sampleNearest(u: number, v: number, mode: Wrap): RGB {
  const i = wrapIndex(Math.floor(u * TW), TW, mode), j = wrapIndex(Math.floor(v * TH), TH, mode);
  return i < 0 || j < 0 ? BORDER : texel(i, j);
}

/** Bilinear: the four texel centres around (u, v), weighted by distance. */
function bilinear(u: number, v: number, mode: Wrap) {
  const x = u * TW - 0.5, y = v * TH - 0.5;
  const i0 = Math.floor(x), j0 = Math.floor(y), fx = x - i0, fy = y - j0;
  const get = (i: number, j: number): RGB => {
    const a = wrapIndex(i, TW, mode), b = wrapIndex(j, TH, mode);
    return a < 0 || b < 0 ? BORDER : texel(a, b);
  };
  const c00 = get(i0, j0), c10 = get(i0 + 1, j0), c01 = get(i0, j0 + 1), c11 = get(i0 + 1, j0 + 1);
  const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  return { color: mix(mix(c00, c10, fx), mix(c01, c11, fx), fy), i0, j0, fx, fy };
}

function paint(canvas: HTMLCanvasElement | null, w: number, h: number, fn: (x: number, y: number) => RGB) {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = fn(x, y), o = (y * w + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

const btnCls = (active: boolean) =>
  `px-2 py-0.5 text-[10px] font-mono rounded border transition-all ${
    active ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

// ── Wrap ──────────────────────────────────────────────────────────────────────
const WS = 270;                        // canvas size
const UV_MIN = -1, UV_MAX = 2;         // UV range shown

function WrapPanel({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<Wrap>("REPEAT");
  const ref = useRef<HTMLCanvasElement>(null);
  const span = UV_MAX - UV_MIN;

  useEffect(() => {
    paint(ref.current, WS, WS, (x, y) => {
      const u = UV_MIN + ((x + 0.5) / WS) * span;
      const v = UV_MIN + (1 - (y + 0.5) / WS) * span;
      return sampleNearest(u, v, mode);
    });
  }, [mode, span]);

  const at = (uv: number) => ((uv - UV_MIN) / span) * 100;   // % position
  const desc: Record<Wrap, [string, string]> = {
    REPEAT:          ["figTex_repeat", "Only the fractional part is used: the image tiles forever. The default."],
    MIRRORED_REPEAT: ["figTex_mirror", "Tiles, but every other copy is flipped, so edges always match their neighbour."],
    CLAMP_TO_EDGE:   ["figTex_clamp", "Coordinates are clamped to [0, 1]: the edge texels stretch outward. Use it for UI and anything that must not bleed."],
    CLAMP_TO_BORDER: ["figTex_border", "Outside [0, 1] you get a fixed border colour (purple here), set with GL_TEXTURE_BORDER_COLOR."],
  };

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr] items-start">
      <div className="relative mx-auto" style={{ width: "min(270px, 80vw)" }}>
        <canvas ref={ref} width={WS} height={WS} className="w-full h-auto rounded" style={{ imageRendering: "pixelated" }} />
        {/* The [0, 1] square */}
        <div className="absolute border-2 border-white/90 pointer-events-none"
          style={{ left: `${at(0)}%`, width: `${at(1) - at(0)}%`, bottom: `${at(0)}%`, height: `${at(1) - at(0)}%`, boxShadow: "0 0 0 1px rgba(0,0,0,0.5)" }} />
        {[-1, 0, 1, 2].map(k => (
          <span key={`u${k}`} className="absolute -bottom-4 text-[9px] font-mono text-[var(--text-muted)] -translate-x-1/2"
            style={{ left: `${Math.min(97, Math.max(3, at(k)))}%` }}>{k}</span>
        ))}
        <span className="absolute left-[33.3%] bottom-[33.3%] translate-y-full text-[9px] font-mono px-1 rounded bg-black/60 text-white">(0,0)</span>
        <span className="absolute left-[66.6%] bottom-[66.6%] -translate-x-full text-[9px] font-mono px-1 rounded bg-black/60 text-white">(1,1)</span>
      </div>
      <div className="space-y-3 pt-1 min-w-0">
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(desc) as Wrap[]).map(m => (
            <button key={m} className={btnCls(mode === m)} onClick={() => setMode(m)}>GL_{m}</button>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{tx(t, ...desc[mode])}</p>
        <pre className="text-[10px] font-mono rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto leading-relaxed text-[var(--code-text)]">
{`// quad UVs go from ${UV_MIN} to ${UV_MAX} instead of 0 to 1
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_${mode});
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_${mode});`}
        </pre>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figTex_wrapNote", "The white square is the texture's own [0, 1] range. Everything outside it is decided by the wrap mode. Note the F reads upright: V grows upward, because OpenGL's texture origin is the bottom-left.")}
        </p>
      </div>
    </div>
  );
}

// ── Magnify ───────────────────────────────────────────────────────────────────
const MS = 260;

function MagnifyPanel({ t }: { t?: TrackTranslations }) {
  const [linear, setLinear] = useState(false);
  const [probe, setProbe] = useState({ u: 0.34, v: 0.52 });
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    paint(ref.current, MS, MS, (x, y) => {
      const u = (x + 0.5) / MS, v = 1 - (y + 0.5) / MS;
      if (!linear) return sampleNearest(u, v, "CLAMP_TO_EDGE");
      const c = bilinear(u, v, "CLAMP_TO_EDGE").color;
      return [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
    });
  }, [linear]);

  const setFrom = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProbe({
      u: Math.max(0.001, Math.min(0.999, (e.clientX - r.left) / r.width)),
      v: Math.max(0.001, Math.min(0.999, 1 - (e.clientY - r.top) / r.height)),
    });
  };

  const b = bilinear(probe.u, probe.v, "CLAMP_TO_EDGE");
  const nearest = { i: Math.floor(probe.u * TW), j: Math.floor(probe.v * TH) };
  const pct = (texCoord: number, n: number) => (texCoord / n) * 100;
  const weights = [
    { i: b.i0, j: b.j0, w: (1 - b.fx) * (1 - b.fy) },
    { i: b.i0 + 1, j: b.j0, w: b.fx * (1 - b.fy) },
    { i: b.i0, j: b.j0 + 1, w: (1 - b.fx) * b.fy },
    { i: b.i0 + 1, j: b.j0 + 1, w: b.fx * b.fy },
  ];
  const out = linear ? b.color.map(Math.round) : sampleNearest(probe.u, probe.v, "CLAMP_TO_EDGE");

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr] items-start">
      <div className="relative mx-auto cursor-crosshair select-none" style={{ width: "min(260px, 80vw)", touchAction: "none" }}
        onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFrom(e); }}
        onPointerMove={e => { if (dragging.current) setFrom(e); }}
        onPointerUp={() => { dragging.current = false; }}>
        <canvas ref={ref} width={MS} height={MS} className="w-full h-auto rounded" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Texel grid */}
          {Array.from({ length: TW - 1 }, (_, i) => (
            <line key={`c${i}`} x1={pct(i + 1, TW)} y1={0} x2={pct(i + 1, TW)} y2={100} stroke="rgba(0,0,0,0.18)" strokeWidth="0.3" />
          ))}
          {Array.from({ length: TH - 1 }, (_, j) => (
            <line key={`r${j}`} x1={0} y1={pct(j + 1, TH)} x2={100} y2={pct(j + 1, TH)} stroke="rgba(0,0,0,0.18)" strokeWidth="0.3" />
          ))}
          {linear
            ? weights.map((w, k) => {
                const cx = pct(Math.max(0, Math.min(TW - 1, w.i)) + 0.5, TW), cy = 100 - pct(Math.max(0, Math.min(TH - 1, w.j)) + 0.5, TH);
                return (
                  <g key={k}>
                    <line x1={cx} y1={cy} x2={probe.u * 100} y2={100 - probe.v * 100} stroke="#111" strokeWidth={0.3 + w.w * 1.4} opacity={0.7} />
                    <circle cx={cx} cy={cy} r={1.2 + w.w * 2} fill="#111" stroke="white" strokeWidth="0.4" />
                  </g>
                );
              })
            : <rect x={pct(nearest.i, TW)} y={100 - pct(nearest.j + 1, TH)} width={100 / TW} height={100 / TH}
                fill="none" stroke="#111" strokeWidth="0.8" />}
          <circle cx={probe.u * 100} cy={100 - probe.v * 100} r={1.6} fill="#f59e0b" stroke="#111" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="space-y-3 min-w-0">
        <div className="flex gap-1.5">
          <button className={btnCls(!linear)} onClick={() => setLinear(false)}>GL_NEAREST</button>
          <button className={btnCls(linear)} onClick={() => setLinear(true)}>GL_LINEAR</button>
        </div>
        <div className="font-mono text-[10.5px] leading-6 text-[var(--text-main)]">
          <div>uv = ({probe.u.toFixed(3)}, {probe.v.toFixed(3)})</div>
          {linear ? (
            <>
              <div className="text-[var(--text-muted)]">fx = {b.fx.toFixed(2)} · fy = {b.fy.toFixed(2)}</div>
              <div className="grid grid-cols-2 gap-x-3 text-[10px]">
                {weights.map((w, k) => (
                  <span key={k}>texel({w.i},{w.j}) × <b>{w.w.toFixed(2)}</b></span>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[var(--text-muted)]">texel = floor(uv × {TW}) = ({nearest.i}, {nearest.j})</div>
          )}
          <div className="flex items-center gap-2">
            {tx(t, "figTex_result", "result")}
            <span className="w-4 h-4 rounded border border-[var(--border)]" style={{ background: `rgb(${out.join(",")})` }} />
            <span className="text-[var(--text-muted)]">rgb({out.join(", ")})</span>
          </div>
        </div>
        <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
          {linear
            ? tx(t, "figTex_linearNote", "LINEAR blends the four nearest texel centres, weighted by how close the sample is to each (the dot size). Smooth, but blurry up close — wrong for pixel art.")
            : tx(t, "figTex_nearestNote", "NEAREST takes the single texel the sample lands in. Crisp blocks — perfect for pixel art, harsh for photos.")}
        </p>
        <p className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">{tx(t, "figTex_dragHint", "drag the orange sample point")}</p>
      </div>
    </div>
  );
}

// ── Minify (mipmaps) ──────────────────────────────────────────────────────────
const FW = 340, FH = 180;
const CHK = 64;                                 // checker texture size, 8×8 cells

// Mip chain for the checker, box-filtered down to 1×1 (grey levels)
const MIPS: Float32Array[] = (() => {
  const levels: Float32Array[] = [];
  let size = CHK;
  let cur = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
    cur[y * size + x] = ((x >> 3) + (y >> 3)) % 2 ? 0.92 : 0.12;
  levels.push(cur);
  while (size > 1) {
    const n = size / 2, next = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
      next[y * n + x] = (cur[2 * y * size + 2 * x] + cur[2 * y * size + 2 * x + 1] + cur[(2 * y + 1) * size + 2 * x] + cur[(2 * y + 1) * size + 2 * x + 1]) / 4;
    levels.push(next); cur = next; size = n;
  }
  return levels;
})();
const MIP_TINT: RGB[] = [[255, 90, 90], [255, 170, 60], [240, 230, 70], [90, 210, 110], [70, 170, 255], [160, 110, 255], [230, 110, 230]];

function mipSample(level: number, u: number, v: number): number {
  const L = MIPS[Math.max(0, Math.min(MIPS.length - 1, level))];
  const n = Math.sqrt(L.length);
  const x = ((Math.floor(u * n) % n) + n) % n, y = ((Math.floor(v * n) % n) + n) % n;
  return L[y * n + x];
}

/** Bilinear inside one mip level, with GL_REPEAT wrapping. */
function mipBilinear(level: number, u: number, v: number): number {
  const L = MIPS[Math.max(0, Math.min(MIPS.length - 1, level))];
  const n = Math.sqrt(L.length);
  const x = u * n - 0.5, y = v * n - 0.5;
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const at = (i: number, j: number) => L[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
  const bot = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bot * fy;
}

type MinMode = "NEAREST" | "LINEAR_MIPMAP_LINEAR";

function MinifyPanel({ t }: { t?: TrackTranslations }) {
  const [mode, setMode] = useState<MinMode>("NEAREST");
  const [tint, setTint] = useState(false);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const horizon = 34, camH = 1.0, focal = 150, tiles = 1 / 3;   // 1 texture repeat per 3 world units
    // Floor hit for a screen pixel: returns texture UV, or null above the horizon
    const uvAt = (x: number, y: number) => {
      const dy = y - horizon;
      if (dy <= 0.5) return null;
      const z = (camH * focal) / dy;
      const wx = ((x - FW / 2) * z) / focal;
      return { u: wx * tiles, v: z * tiles };
    };
    const sky: RGB = [22, 27, 34];
    paint(ref.current, FW, FH, (x, y) => {
      const c = uvAt(x + 0.5, y + 0.5);
      if (!c) return sky;
      if (mode === "NEAREST") {
        const g = mipSample(0, c.u, c.v) * 255;
        return [g, g, g];
      }
      // Footprint of this pixel in texels picks the mip level (like the GPU's derivatives)
      const cx = uvAt(x + 1.5, y + 0.5), cy = uvAt(x + 0.5, y + 1.5);
      const du = cx ? Math.hypot(cx.u - c.u, cx.v - c.v) : 0;
      const dv = cy ? Math.hypot(cy.u - c.u, cy.v - c.v) : du;
      const lod = Math.max(0, Math.log2(Math.max(du, dv) * CHK));
      const l0 = Math.floor(lod), f = lod - l0;
      // Trilinear: bilinear inside the two nearest levels, then blend between them
      const g = mipBilinear(l0, c.u, c.v) * (1 - f) + mipBilinear(l0 + 1, c.u, c.v) * f;
      if (!tint) return [g * 255, g * 255, g * 255];
      const tc = MIP_TINT[Math.min(MIP_TINT.length - 1, l0)];
      return [tc[0] * (0.35 + g * 0.65), tc[1] * (0.35 + g * 0.65), tc[2] * (0.35 + g * 0.65)];
    });
  }, [mode, tint]);

  return (
    <div className="space-y-3">
      <canvas ref={ref} width={FW} height={FH} className="w-full h-auto rounded border border-[var(--code-border)]" />
      <div className="flex gap-1.5 flex-wrap items-center">
        <button className={btnCls(mode === "NEAREST")} onClick={() => setMode("NEAREST")}>GL_NEAREST</button>
        <button className={btnCls(mode === "LINEAR_MIPMAP_LINEAR")} onClick={() => setMode("LINEAR_MIPMAP_LINEAR")}>GL_LINEAR_MIPMAP_LINEAR</button>
        {mode !== "NEAREST" && (
          <button className={btnCls(tint)} onClick={() => setTint(v => !v)}>{tint ? "✓ " : ""}{tx(t, "figTex_tint", "colour mip levels")}</button>
        )}
      </div>
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
        {mode === "NEAREST"
          ? tx(t, "figTex_minNearest", "Far away, one screen pixel covers many texels but only one is picked: the checkerboard breaks into noise and moiré, and it shimmers as the camera moves.")
          : tint
            ? tx(t, "figTex_minTint", "Each colour is a mip level: red is the full-size texture, then every level is half the size of the one before. Distant pixels read from tiny, pre-averaged levels.")
            : tx(t, "figTex_minMip", "glGenerateMipmap builds half-size copies of the texture, each one pre-averaged. The GPU picks the level whose texels match the pixel size, so the distance fades to smooth grey instead of noise.")}
      </p>
    </div>
  );
}

// ── Figure ────────────────────────────────────────────────────────────────────
type Tab = "wrap" | "mag" | "min";

export function TextureFigure({ t }: { t?: TrackTranslations }) {
  const [tab, setTab] = useState<Tab>("wrap");
  const tabs: [Tab, string, string][] = [
    ["wrap", "figTex_tabWrap", "Wrap modes"],
    ["mag", "figTex_tabMag", "Magnification"],
    ["min", "figTex_tabMin", "Minification & mipmaps"],
  ];
  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figTex_title", "Sampling a Texture")}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(([id, key, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                tab === id ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`}>
              {tx(t, key, label)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-5 pb-6">
        {tab === "wrap" ? <WrapPanel t={t} /> : tab === "mag" ? <MagnifyPanel t={t} /> : <MinifyPanel t={t} />}
      </div>
    </figure>
  );
}
