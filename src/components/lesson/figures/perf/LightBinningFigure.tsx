"use client";

import { useEffect, useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A model of light culling for many point lights. The camera looks over a
// floor with a few boxes; lights are spheres scattered in the view volume.
//   naive     — every pixel loops over every light
//   tiled     — the screen is cut into tiles; a light goes into a tile's list
//               if its projected sphere overlaps the tile AND its depth range
//               overlaps the tile's [zmin, zmax] from the depth buffer
//   clustered — tiles are also cut in depth, in exponentially growing slices;
//               a pixel only loops over the lights of its own cluster
// Left: the screen, coloured by how many lights each pixel will loop over.
// Right: a view from above (depth → right) with the slice boundaries.

const SW = 320, SH = 180;                 // "screen" resolution of the model
const NEAR = 0.5, FAR = 80, TANX = 0.9, TANY = TANX * (SH / SW), CAMH = 2.2;
type Light = { x: number; y: number; z: number; r: number };

function makeLights(n: number, radius: number): Light[] {
  let s = 7;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: n }, () => {
    const z = 3 + rnd() * 55, x = (rnd() * 2 - 1) * z * TANX, y = -CAMH + 0.3 + rnd() * 2.5;
    return { x, y, z, r: radius * (0.6 + 0.8 * rnd()) };
  });
}

/** View-space depth of the synthetic scene at a screen pixel: a floor, three boxes, sky beyond. */
function sceneDepth(px: number, py: number) {
  const sx = (px / SW) * 2 - 1, sy = 1 - (py / SH) * 2;             // −1..1
  const boxes = [[-0.55, -0.1, 0.25, 0.35, 9], [0.1, -0.25, 0.45, 0.3, 5], [0.45, -0.05, 0.8, 0.12, 22]];
  for (const [x0, y0, x1, y1, z] of boxes) if (sx > x0 && sx < x1 && sy > y0 - 0.5 && sy < y1 - 0.25) return z;
  const vy = sy * TANY;                                             // ray slope downward
  if (vy >= -1e-3) return FAR;                                      // sky
  return Math.min(FAR, CAMH / -vy);                                 // floor at y = −CAMH
}
/** Point on the scene surface for a pixel (view space), to count lights that truly reach it. */
const viewPoint = (px: number, py: number, z: number) => ({ x: ((px / SW) * 2 - 1) * TANX * z, y: (1 - (py / SH) * 2) * TANY * z, z });

const sliceOf = (z: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor((Math.log(z / NEAR) / Math.log(FAR / NEAR)) * n)));
const sliceNear = (k: number, n: number) => NEAR * Math.pow(FAR / NEAR, k / n);

export function LightBinningFigure({ t }: { t?: TrackTranslations }) {
  const [count, setCount] = useState(128);
  const [radius, setRadius] = useState(2.5);
  const [tile, setTile] = useState(20);
  const [slices, setSlices] = useState(16);
  const [mode, setMode] = useState<"naive" | "tiled" | "clustered">("tiled");
  const [zCull, setZCull] = useState(true);
  const [url, setUrl] = useState<string | null>(null);

  const lights = useMemo(() => makeLights(count, radius), [count, radius]);
  const depth = useMemo(() => {
    const d = new Float32Array(SW * SH);
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) d[y * SW + x] = sceneDepth(x + 0.5, y + 0.5);
    return d;
  }, []);

  const stats = useMemo(() => {
    const tx0 = Math.ceil(SW / tile), ty0 = Math.ceil(SH / tile);
    // Projected bounds of each light (in model pixels) and its depth range
    const proj = lights.map(l => {
      const cx = ((l.x / l.z / TANX) * 0.5 + 0.5) * SW, cy = (0.5 - (l.y / l.z / TANY) * 0.5) * SH;
      const rpx = l.z > l.r ? (l.r / Math.sqrt(l.z * l.z - l.r * l.r) / TANX) * 0.5 * SW : 1e6;
      return { cx, cy, rpx, z0: l.z - l.r, z1: l.z + l.r };
    });
    const perPixel = new Uint16Array(SW * SH);
    let sumCulled = 0, sumIdeal = 0;
    for (let ty = 0; ty < ty0; ty++) for (let txi = 0; txi < tx0; txi++) {
      const x0 = txi * tile, y0 = ty * tile, x1 = Math.min(SW, x0 + tile), y1 = Math.min(SH, y0 + tile);
      let zmin = Infinity, zmax = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const z = depth[y * SW + x]; zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
      // 2D overlap: closest point of the tile rectangle to the projected circle
      const inTile = proj.map((p, i) => {
        const qx = Math.max(x0, Math.min(p.cx, x1)), qy = Math.max(y0, Math.min(p.cy, y1));
        if (Math.hypot(qx - p.cx, qy - p.cy) > p.rpx) return -1;
        if (zCull && (p.z1 < zmin || p.z0 > zmax)) return -1;
        return i;
      }).filter(i => i >= 0);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const z = depth[y * SW + x];
        let n: number;
        if (mode === "naive") n = lights.length;
        else if (mode === "tiled") n = inTile.length;
        else {
          const k = sliceOf(z, slices), a = sliceNear(k, slices), b = sliceNear(k + 1, slices);
          n = 0;
          for (const i of inTile) if (proj[i].z1 >= a && proj[i].z0 <= b) n++;
        }
        perPixel[y * SW + x] = n;
        sumCulled += n;
        if ((x & 1) === 0 && (y & 1) === 0 && z < FAR) {          // ideal count on every 4th pixel (it is expensive)
          const p = viewPoint(x + 0.5, y + 0.5, z);
          for (const l of lights) if ((p.x - l.x) ** 2 + (p.y - l.y) ** 2 + (p.z - l.z) ** 2 < l.r * l.r) sumIdeal += 4;
        }
      }
    }
    return { perPixel, avg: sumCulled / (SW * SH), ideal: sumIdeal / (SW * SH), tiles: tx0 * ty0 };
  }, [lights, depth, tile, slices, mode, zCull]);

  // Paint the heatmap once per change
  useEffect(() => {
    const c = document.createElement("canvas"); c.width = SW; c.height = SH;
    const g = c.getContext("2d");
    if (!g) return;
    const img = g.createImageData(SW, SH), maxN = Math.max(8, Math.min(64, count));
    for (let i = 0; i < SW * SH; i++) {
      const v = Math.min(1, stats.perPixel[i] / maxN), shade = 0.25 + 0.75 * (1 - depth[i] / FAR) ;
      const r = Math.min(1, 1.5 - Math.abs(4 * v - 3)), gg = Math.min(1, 1.5 - Math.abs(4 * v - 2)), b = Math.min(1, 1.5 - Math.abs(4 * v - 1));
      img.data.set([Math.max(0, r) * 255 * (0.35 + 0.65 * shade), Math.max(0, gg) * 255 * (0.35 + 0.65 * shade), Math.max(0, b) * 255 * (0.35 + 0.65 * shade), 255], i * 4);
    }
    g.putImageData(img, 0, 0);
    setUrl(c.toDataURL());
  }, [stats, depth, count]);

  // Top view geometry
  const TW = 250, TH = 180, TX0 = 14;
  const TXz = (z: number) => TX0 + (z / FAR) * (TW - 2 * TX0);
  const TYx = (x: number) => TH / 2 - (x / (FAR * TANX)) * (TH / 2 - 8);
  const btn = (on: boolean) => `px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${on
    ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)]"}`;

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figBin_title", "Light Culling — Lights Evaluated per Pixel")}
        </span>
        <div className="flex gap-1.5">{(["naive", "tiled", "clustered"] as const).map(m => <button key={m} className={btn(mode === m)} onClick={() => setMode(m)}>{m}</button>)}</div>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] p-2 grid gap-2 md:grid-cols-[1.35fr_1fr]">
        <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-auto rounded" role="img" aria-label="Lights per pixel heatmap">
          {url && <image href={url} x={0} y={0} width={SW} height={SH} style={{ imageRendering: "pixelated" }} />}
          {mode !== "naive" && Array.from({ length: Math.ceil(SW / tile) + 1 }, (_, i) => <line key={`v${i}`} x1={i * tile} y1={0} x2={i * tile} y2={SH} stroke="white" strokeWidth={0.3} opacity={0.35} />)}
          {mode !== "naive" && Array.from({ length: Math.ceil(SH / tile) + 1 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * tile} x2={SW} y2={i * tile} stroke="white" strokeWidth={0.3} opacity={0.35} />)}
          {lights.slice(0, 256).map((l, i) => {
            const cx = ((l.x / l.z / TANX) * 0.5 + 0.5) * SW, cy = (0.5 - (l.y / l.z / TANY) * 0.5) * SH;
            return <circle key={i} cx={cx} cy={cy} r={1.2} fill="white" opacity={0.8} />;
          })}
        </svg>
        <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full h-auto rounded" role="img" aria-label="Top view with depth slices">
          <polygon points={`${TXz(0)},${TYx(0)} ${TXz(FAR)},${TYx(FAR * TANX)} ${TXz(FAR)},${TYx(-FAR * TANX)}`} fill="var(--code-line)" opacity={0.35} />
          {mode === "clustered" && Array.from({ length: slices + 1 }, (_, k) => {
            const z = sliceNear(k, slices);
            return <line key={k} x1={TXz(z)} y1={TYx(z * TANX)} x2={TXz(z)} y2={TYx(-z * TANX)} stroke="#a855f7" strokeWidth={0.6} opacity={0.8} />;
          })}
          {lights.map((l, i) => <circle key={i} cx={TXz(l.z)} cy={TYx(l.x)} r={(l.r / FAR) * (TW - 2 * TX0)} fill="#f59e0b" fillOpacity={0.12} stroke="#f59e0b" strokeWidth={0.4} />)}
          <circle cx={TXz(0)} cy={TYx(0)} r={3} fill="#3b82f6" />
          <text x={TW - 4} y={TH - 4} textAnchor="end" fontSize="7" fontFamily="monospace" fill="var(--code-muted)">{tx(t, "figBin_depth", "depth →")}</text>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {([["lights", count, setCount, 8, 512, 8], ["light radius", radius, setRadius, 0.5, 8, 0.1], ["tile (px)", tile, setTile, 8, 60, 2], ["depth slices", slices, setSlices, 1, 32, 1]] as const).map(([label, v, set, min, max, step]) => (
              <label key={label} className={`flex items-center gap-2 ${label === "depth slices" && mode !== "clustered" ? "opacity-40" : ""}`}>
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-24">{label}</span>
                <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}</span>
              </label>
            ))}
          </div>
          <label className={`flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] ${mode === "naive" ? "opacity-40" : ""}`}>
            <input type="checkbox" checked={zCull} onChange={e => setZCull(e.target.checked)} className="accent-[var(--primary)]" />{tx(t, "figBin_zcull", "use each tile's depth bounds (zmin, zmax)")}
          </label>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {mode === "naive"
              ? tx(t, "figBin_naiveNote", "Every pixel evaluates every light: the heatmap is uniformly hot and the cost grows linearly with the light count, even though each light reaches only a small part of the screen.")
              : mode === "tiled"
                ? tx(t, "figBin_tiledNote", "Tiles near the horizon are the problem. Their pixels span from nearby floor to far away, so the depth range is huge and many lights that touch only the distant part (or only the near part) still land in the list. Turn off the depth bounds and every light whose circle touches a tile counts, even lights far in front of or behind all the tile's geometry.")
                : tx(t, "figBin_clusterNote", "Clusters cut each tile in depth too (purple lines, exponentially spaced so near slices are thin). A pixel only loops over lights in its own cluster, and depth discontinuities no longer matter. The cost now follows the ideal count closely, and the lists can be built before any depth pre-pass.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[210px]">
          <div>{tx(t, "figBin_avg", "avg lights looped / pixel")}</div>
          <div className="text-[var(--primary)] text-[14px]">{stats.avg.toFixed(1)}</div>
          <div className="mt-1">{tx(t, "figBin_ideal", "lights really reaching it")}: {stats.ideal.toFixed(2)}</div>
          <div>{tx(t, "figBin_naive", "naive")}: {count}</div>
          <div>{mode === "clustered" ? `${stats.tiles * slices} clusters` : mode === "tiled" ? `${stats.tiles} tiles` : "—"}</div>
        </div>
      </div>
    </FigureShell>
  );
}
