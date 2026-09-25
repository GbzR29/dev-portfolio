"use client";

import { useEffect, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { CROSS_CELLS, crossCellOf, dirToFace, dot, norm, FACE_NAMES, type Vec3, type TexImage } from "../gl";
import { useSky, SkyPicker, type SkyImages } from "../GLView";

// ── What this figure shows ────────────────────────────────────────────────────
// One sky stored two ways: a 4×3 cross (six cube faces) and a 2:1 panorama.
// Point at either image and the same direction lights up in the other. The
// overlays show what each format does to the sphere: the panorama's lat/long
// grid bent across the cube faces, and the six faces spread over the panorama.

const W = 480;                       // both images are drawn this wide
const CW = W, CH = (W * 3) / 4;      // cross 4×3
const PW = W, PH = W / 2;            // panorama 2:1
const FACE_TINT = ["#ef4444", "#f97316", "#22c55e", "#14b8a6", "#3b82f6", "#a855f7"];

// Direction ↔ image position. Panorama: u = atan2(z, x)/2π + ½, v = ½ − asin(y)/π.
const dirToPano = (d: Vec3) => ({
  x: (Math.atan2(d[2], d[0]) / (2 * Math.PI) + 0.5) * PW,
  y: (0.5 - Math.asin(Math.max(-1, Math.min(1, d[1]))) / Math.PI) * PH,
});
const panoToDir = (x: number, y: number): Vec3 => {
  const phi = (x / PW - 0.5) * 2 * Math.PI, th = (0.5 - y / PH) * Math.PI;
  return [Math.cos(th) * Math.cos(phi), Math.sin(th), Math.cos(th) * Math.sin(phi)];
};
// Cross: the cell looking most along d, then d divided by its forward part
const dirToCross = (d: Vec3) => {
  const c = CROSS_CELLS.reduce((b, k) => (dot(k.fwd, d) > dot(b.fwd, d) ? k : b));
  const f = dot(c.fwd, d), cs = CW / 4;
  return { x: (c.col + (dot(c.right, d) / f + 1) / 2) * cs, y: (c.row + (dot(c.down, d) / f + 1) / 2) * cs, cell: c };
};
const crossToDir = (x: number, y: number): Vec3 | null => {
  const cs = CW / 4, col = Math.floor(x / cs), row = Math.floor(y / cs);
  const c = CROSS_CELLS.find(k => k.col === col && k.row === row);
  if (!c) return null;
  const a = 2 * (x / cs - col) - 1, b = 2 * (y / cs - row) - 1;
  return norm([c.fwd[0] + a * c.right[0] + b * c.down[0], c.fwd[1] + a * c.right[1] + b * c.down[1], c.fwd[2] + a * c.right[2] + b * c.down[2]]);
};

/** Draws the cross: the shipped file when there is one, otherwise assembled from the six faces. */
function paintCross(g: CanvasRenderingContext2D, im: SkyImages) {
  g.fillStyle = "#000"; g.fillRect(0, 0, CW, CH);
  if (im.cross) {
    const img = new Image();
    img.onload = () => g.drawImage(img, 0, 0, CW, CH);
    img.src = im.cross;
    return;
  }
  const px = im.faces.map(f => pixelsOf(f));
  const out = g.createImageData(CW, CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const d = crossToDir(x + 0.5, y + 0.5);
    if (!d) continue;
    const { face, s, t } = dirToFace(d);
    const src = px[face];
    const i = (Math.min(src.height - 1, Math.floor(t * src.height)) * src.width + Math.min(src.width - 1, Math.floor(s * src.width))) * 4;
    const o = (y * CW + x) * 4;
    out.data[o] = src.data[i]; out.data[o + 1] = src.data[i + 1]; out.data[o + 2] = src.data[i + 2]; out.data[o + 3] = 255;
  }
  g.putImageData(out, 0, 0);
}

function pixelsOf(f: TexImage) {
  const c = document.createElement("canvas");
  c.width = f.width; c.height = f.height;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(f, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

/** Lat/long lines every 15°, projected into the cross and split where they change cell. */
function paintGrid(g: CanvasRenderingContext2D) {
  g.clearRect(0, 0, CW, CH);
  g.lineWidth = 1.2;
  const line = (dirAt: (k: number) => Vec3, colour: string) => {
    g.strokeStyle = colour;
    g.beginPath();
    let prev: ReturnType<typeof dirToCross> | null = null;
    for (let k = 0; k <= 360; k++) {
      const p = dirToCross(dirAt(k / 360));
      if (prev && prev.cell === p.cell) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y);
      prev = p;
    }
    g.stroke();
  };
  for (let lon = -180; lon < 180; lon += 15) {
    const phi = (lon * Math.PI) / 180;
    line(k => { const th = (k - 0.5) * Math.PI * 0.999; return [Math.cos(th) * Math.cos(phi), Math.sin(th), Math.cos(th) * Math.sin(phi)]; },
      lon === 0 ? "rgba(250,204,21,0.95)" : "rgba(251,146,60,0.7)");
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const th = (lat * Math.PI) / 180;
    line(k => { const phi = k * 2 * Math.PI; return [Math.cos(th) * Math.cos(phi), Math.sin(th), Math.cos(th) * Math.sin(phi)]; },
      lat === 0 ? "rgba(250,204,21,0.95)" : "rgba(56,189,248,0.7)");
  }
}

/** The six faces over the panorama: a tint per face and a line where the face changes. */
function paintFaces(g: CanvasRenderingContext2D) {
  const out = g.createImageData(PW, PH);
  const faceAt = (x: number, y: number) => dirToFace(panoToDir(x + 0.5, y + 0.5)).face;
  const rgb = FACE_TINT.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const f = faceAt(x, y);
    const edge = f !== faceAt(Math.min(PW - 1, x + 1), y) || f !== faceAt(x, Math.min(PH - 1, y + 1));
    const o = (y * PW + x) * 4;
    out.data[o] = rgb[f][0]; out.data[o + 1] = rgb[f][1]; out.data[o + 2] = rgb[f][2];
    out.data[o + 3] = edge ? 255 : 60;
  }
  g.putImageData(out, 0, 0);
}

export function SkyFormatsFigure({ t }: { t?: TrackTranslations }) {
  const sky = useSky();
  const crossRef = useRef<HTMLCanvasElement>(null), gridRef = useRef<HTMLCanvasElement>(null);
  const panoRef = useRef<HTMLCanvasElement>(null), facesRef = useRef<HTMLCanvasElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [dir, setDir] = useState<Vec3>(norm([0.8, 0.25, 0.55]));

  useEffect(() => {
    const im = sky.images;
    if (!im) return;
    paintCross(crossRef.current!.getContext("2d")!, im);
    panoRef.current!.getContext("2d")!.drawImage(im.equirect, 0, 0, PW, PH);
  }, [sky.images]);
  useEffect(() => {
    paintGrid(gridRef.current!.getContext("2d")!);
    paintFaces(facesRef.current!.getContext("2d")!);
  }, []);

  const pos = (e: React.PointerEvent<HTMLElement>, w: number, h: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
  };
  const onCross = (e: React.PointerEvent<HTMLElement>) => { const p = pos(e, CW, CH); const d = crossToDir(p.x, p.y); if (d) setDir(d); };
  const onPano = (e: React.PointerEvent<HTMLElement>) => { const p = pos(e, PW, PH); setDir(norm(panoToDir(p.x, p.y))); };

  const c = dirToCross(dir), p = dirToPano(dir), hit = dirToFace(dir);
  const lat = (Math.asin(dir[1]) * 180) / Math.PI, lon = (Math.atan2(dir[2], dir[0]) * 180) / Math.PI;
  const face = [0, 1, 2, 3, 4, 5].find(f => crossCellOf(f) === c.cell)!;
  // Solid angle of one texel relative to the best texel of each format
  const sc = 2 * hit.s - 1, tc = 2 * hit.t - 1;
  const cubeDensity = 1 / Math.pow(1 + sc * sc + tc * tc, 1.5);
  const panoDensity = Math.cos((lat * Math.PI) / 180);

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
      ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
      : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  const marker = (x: number, y: number, w: number, h: number) => (
    <span className="absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full bg-amber-500 border-2 border-white shadow pointer-events-none"
      style={{ left: `${(x / w) * 100}%`, top: `${(y / h) * 100}%` }} />
  );

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figSkyF_title", "One Sky, Two Files — Cross and Panorama")}
        </span>
        <SkyPicker sources={sky.sources} value={sky.id} onChange={sky.setId} busy={sky.busy} />
      </div>

      <div className="p-3 md:p-4 grid gap-3 md:grid-cols-2 bg-[var(--code-bg)] border-b border-[var(--border)]">
        <div className="space-y-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figSkyF_cross", "4×3 cross (six faces)")}</p>
          <div className="relative cursor-crosshair touch-none" onPointerMove={onCross} onPointerDown={onCross}>
            <canvas ref={crossRef} width={CW} height={CH} className="w-full h-auto rounded block" />
            <canvas ref={gridRef} width={CW} height={CH} className={`absolute inset-0 w-full h-full ${showGrid ? "" : "hidden"}`} />
            {CROSS_CELLS.map((k, i) => (
              <span key={i} className="absolute text-[9px] font-mono font-bold text-white [text-shadow:0_0_3px_#000] pointer-events-none"
                style={{ left: `${(k.col / 4) * 100 + 1}%`, top: `${(k.row / 3) * 100 + 1}%` }}>
                {FACE_NAMES[[0, 1, 2, 3, 4, 5].find(f => crossCellOf(f) === k)!]}
              </span>
            ))}
            {marker(c.x, c.y, CW, CH)}
          </div>
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figSkyF_pano", "2:1 equirectangular panorama")}</p>
          <div className="relative cursor-crosshair touch-none" onPointerMove={onPano} onPointerDown={onPano}>
            <canvas ref={panoRef} width={PW} height={PH} className="w-full h-auto rounded block" />
            <canvas ref={facesRef} width={PW} height={PH} className={`absolute inset-0 w-full h-full ${showFaces ? "" : "hidden"}`} />
            {marker(p.x, p.y, PW, PH)}
          </div>
          <div className="flex gap-1.5 flex-wrap pt-1">
            <button className={btn(showGrid)} onClick={() => setShowGrid(v => !v)}>{showGrid ? "✓ " : ""}{tx(t, "figSkyF_grid", "15° lat/long on the cross")}</button>
            <button className={btn(showFaces)} onClick={() => setShowFaces(v => !v)}>{showFaces ? "✓ " : ""}{tx(t, "figSkyF_faces", "cube faces on the panorama")}</button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5 grid gap-5 md:grid-cols-2">
        <div className="font-mono text-[11px] leading-6 text-[var(--text-main)] rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 overflow-x-auto">
          <div>dir = ({dir.map(v => v.toFixed(2)).join(", ")})</div>
          <div className="text-[var(--text-muted)]">
            {tx(t, "figSkyF_latlon", "latitude")} {lat.toFixed(1)}° · {tx(t, "figSkyF_lon", "longitude")} {lon.toFixed(1)}°
          </div>
          <div>{tx(t, "figSkyF_panoAt", "panorama")} (u, v) = ({(p.x / PW).toFixed(3)}, {(p.y / PH).toFixed(3)})</div>
          <div>{tx(t, "figSkyF_cubeAt", "cube face")} <b style={{ color: FACE_TINT[face] }}>{FACE_NAMES[face]}</b> · (s, t) = ({hit.s.toFixed(3)}, {hit.t.toFixed(3)})</div>
          <div className="text-[var(--text-muted)] pt-1 border-t border-[var(--code-border)] mt-1">
            {tx(t, "figSkyF_density", "sky covered by one texel (1 = the largest)")}:
          </div>
          <div>{tx(t, "figSkyF_cubeD", "cube")} (1+sc²+tc²)^−3/2 = <b>{cubeDensity.toFixed(2)}</b></div>
          <div>{tx(t, "figSkyF_panoD", "panorama")} cos(lat) = <b>{panoDensity.toFixed(2)}</b></div>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figSkyF_note",
            "Point at either image. The yellow lines are the equator and longitude 0. On the cross the meridians bend as they cross face edges and all meet at the centre of +Y and −Y, which the panorama stretches into its whole top and bottom rows. The last two numbers give how much sky one texel covers here, relative to the largest texel of the same image: a cube map varies at most about 5× (face centre against corner), but a panorama's pixels shrink to nothing at the poles, which is why it wastes memory up there and why they sparkle when minified.")}
        </p>
      </div>
    </figure>
  );
}
