"use client";

import { useEffect, useRef, useState } from "react";
import { forwardFrom, norm, cross, type Vec3 } from "./gl";
import { skyboxSets } from "./protoTexture";
import { proceduralFace, proceduralEquirect, crossToFaces, equirectToFaces, facesToEquirect, loadImage, makeCubemap, type TexImage } from "./gl";

// ── A WebGL2 canvas for lesson figures ────────────────────────────────────────
// Owns the context, keeps the drawing buffer matched to its CSS size, redraws
// whenever `frame` changes, and turns pointer input into a yaw/pitch/fov look.

export type Look = { yaw: number; pitch: number; fov: number };
export type Size = { w: number; h: number; aspect: number };

/** Camera basis for a look: forward, right, up (worldUp = +Y). */
export function lookBasis(l: Look) {
  const f = forwardFrom(l.yaw, l.pitch);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  return { f, r, u };
}

/** World direction under a point in normalized device coordinates. */
export function rayDir(l: Look, aspect: number, ndcX: number, ndcY: number): Vec3 {
  const { f, r, u } = lookBasis(l);
  const t = Math.tan(l.fov / 2);
  const x = ndcX * t * aspect, y = ndcY * t;
  return norm([f[0] + r[0] * x + u[0] * y, f[1] + r[1] * x + u[1] * y, f[2] + r[2] * x + u[2] * y]);
}

export function GLView<R>({
  init, draw, frame, look, onLook, onHover, aspect = 16 / 9, className = "", fovRange = [0.6, 1.9], orbit = false, resolution = 1, children,
}: {
  /** Builds GPU resources once. May be async (texture loads). */
  init: (gl: WebGL2RenderingContext) => R | Promise<R>;
  /** Draws a frame. Called when `frame` changes and on resize. */
  draw: (gl: WebGL2RenderingContext, res: R, size: Size) => void;
  frame: unknown;
  look: Look;
  onLook?: (l: Look) => void;
  onHover?: (ndc: { x: number; y: number } | null) => void;
  aspect?: number;
  className?: string;
  fovRange?: [number, number];
  /**
   * Orbit scenes (camera = target − forward·distance) drag like Blender:
   * drag right and the object turns right, drag down and you see its top.
   * Off = first-person look, where the view follows the hand like a mouse-look.
   */
  orbit?: boolean;
  /** Drawing-buffer scale on top of the (capped) device pixel ratio: < 1 for heavy shaders. */
  resolution?: number;
  children?: React.ReactNode;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const res = useRef<R | null>(null);
  const [ready, setReady] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const lookRef = useRef(look); lookRef.current = look;
  const drawRef = useRef(draw); drawRef.current = draw;

  // Context + resources
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = c.getContext("webgl2", { antialias: true, preserveDrawingBuffer: false });
    if (!gl) { setFailed("WebGL2 is not available in this browser."); return; }
    glRef.current = gl;
    let alive = true;
    Promise.resolve()
      .then(() => init(gl))
      .then(r => { if (alive) { res.current = r; setReady(n => n + 1); } })
      .catch(e => { if (alive) setFailed(String(e?.message ?? e)); });
    return () => { alive = false; };
    // init is intentionally run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Match the drawing buffer to the element's size (sharp on HiDPI)
  const [size, setSize] = useState<Size>({ w: 1, h: 1, aspect });
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * resolution;
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      setSize({ w, h, aspect: w / h });
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [resolution]);

  // Draw on demand
  useEffect(() => {
    const gl = glRef.current, r = res.current;
    if (!gl || r === null || failed) return;
    const id = requestAnimationFrame(() => {
      try { drawRef.current(gl, r, size); } catch (e) { setFailed(String((e as Error).message)); }
    });
    return () => cancelAnimationFrame(id);
  }, [frame, size, ready, failed]);

  // Wheel = field of view; middle button must not start autoscroll
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      if (!onLook) return;
      e.preventDefault();
      const l = lookRef.current;
      const fov = Math.max(fovRange[0], Math.min(fovRange[1], l.fov * (e.deltaY > 0 ? 1.06 : 0.94)));
      onLook({ ...l, fov });
    };
    const onDown = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("mousedown", onDown);
    return () => { c.removeEventListener("wheel", onWheel); c.removeEventListener("mousedown", onDown); };
  }, [onLook, fovRange]);

  const ndcOf = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: 1 - ((e.clientY - r.top) / r.height) * 2 };
  };

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: String(aspect) }}>
      <canvas
        ref={canvas}
        className={`absolute inset-0 w-full h-full rounded ${onLook ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ touchAction: "none" }}
        onPointerDown={e => {
          if (!onLook || (e.pointerType === "mouse" && e.button === 2)) return;
          canvas.current?.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={e => {
          onHover?.(ndcOf(e));
          const d = drag.current;
          if (!d || !onLook) return;
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          drag.current = { x: e.clientX, y: e.clientY };
          const l = lookRef.current;
          // First person: "grab the world" (drag right, the view turns left).
          // Orbit: the camera sits behind the look direction, so both signs flip.
          const k = 0.0045 * (l.fov / 1.2) * (orbit ? -1 : 1);
          onLook({ ...l, yaw: l.yaw - dx * k, pitch: Math.max(-1.52, Math.min(1.52, l.pitch + dy * k)) });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onPointerLeave={() => onHover?.(null)}
        onContextMenu={e => e.preventDefault()}
      />
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[11px] font-mono text-red-400 bg-[var(--code-bg)] rounded">
          {failed}
        </div>
      )}
      {children}
    </div>
  );
}

/** Seconds elapsed while `on`, advancing every frame — drives figure animations. */
export function useAnimationTime(on: boolean) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!on) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      setTime(v => v + Math.max(0, now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return time;
}

// ── Sky sources ───────────────────────────────────────────────────────────────
// Every sky under public/textures/skybox (through the asset manifest) plus the
// procedural one. Images load only when a sky is first used, and each sky
// ends up as both six cube faces and a panorama: a shipped cross is cut into
// faces, and whichever format is missing is resampled from the other.

/** A loaded sky: six decoded faces (+X, −X, +Y, −Y, +Z, −Z), a panorama, and the cross it came from. */
export type SkyImages = { faces: TexImage[]; equirect: TexImage; cross: string | null };
export type SkySource = { id: string; label: string; shipped: boolean; load: () => Promise<SkyImages> };

/** Names for the numbered skies that ship in public/textures/skybox. */
const SKY_NAMES: Record<string, string> = {
  sky_01: "Dusk overcast", sky_02: "Golden haze", sky_03: "Hazy sunset", sky_04: "Blue day",
  sky_05: "Blue clouds", sky_06: "Clear blue", sky_07: "Pink clouds", sky_08: "Pale morning",
  sky_09: "Storm light", sky_10: "Grey overcast", sky_11: "Violet night", sky_12: "Moonlit night",
  sky_13: "Sand haze", sky_14: "Green alien", sky_15: "Dark sunset", sky_16: "Blue cirrus",
  sky_17: "Magenta sunset", sky_18: "Teal dusk", sky_19: "Red haze", sky_20: "White fog",
  sky_21: "Orange sunset", sky_22: "Red sunset", sky_23: "Pink streaks", sky_24: "Pale clouds",
  sky_25: "Lavender dusk",
};
/** The sky figures open with, when it ships. */
export const DEFAULT_SKY = "sky_05";

const skyCache = new Map<string, Promise<SkyImages>>();
const once = (key: string, make: () => Promise<SkyImages>) => {
  let p = skyCache.get(key);
  if (!p) { p = make(); skyCache.set(key, p); p.catch(() => skyCache.delete(key)); }
  return p;
};

/**
 * Sky sources: the default shipped sky first, the other shipped skies, the
 * procedural sky last (alone when nothing ships), so [0] is the one to use.
 * Labelled procedural faces print "+X", "px.png"… on each face, which helps
 * when studying orientation; scenes use the plain ones.
 */
export function skySources({ labels = false } = {}): SkySource[] {
  if (typeof document === "undefined") return [];
  const sets = Object.entries(skyboxSets())
    .sort(([a], [b]) => (a === DEFAULT_SKY ? -1 : b === DEFAULT_SKY ? 1 : a.localeCompare(b)));
  const out: SkySource[] = sets.map(([id, set]) => ({
    id, label: SKY_NAMES[id] ?? id.replace(/_/g, " "), shipped: true,
    load: () => once(id, async () => {
      const crossUrl = set.cross ?? null;
      let faces: TexImage[] | null = set.faces ? await Promise.all(set.faces.map(loadImage)) : null;
      if (!faces && crossUrl) faces = crossToFaces(await loadImage(crossUrl));
      if (!faces && set.equirect) faces = equirectToFaces(await loadImage(set.equirect));
      if (!faces) throw new Error(`sky ${id} has no images`);
      const equirect = set.equirect ? await loadImage(set.equirect) : facesToEquirect(faces);
      return { faces, equirect, cross: crossUrl };
    }),
  }));
  out.push({
    id: "procedural", label: "Procedural grid", shipped: false,
    load: () => once(labels ? "procedural+labels" : "procedural", async () => ({
      faces: [0, 1, 2, 3, 4, 5].map(f => proceduralFace(f, 384, labels)),
      equirect: proceduralEquirect(1024),
      cross: null,
    })),
  });
  return out;
}

/** The sky a figure should open with, already loaded. */
export const defaultSky = () => skySources()[0].load();

/** A sky image as something an <img src> can show. */
export const faceHref = (f: TexImage) => (f instanceof HTMLImageElement ? f.src : f.toDataURL());

/**
 * The sky list, the chosen id and its loaded images. Figures upload
 * `images` to the GPU in their draw call when it changes (see skyTexture).
 */
export function useSky({ labels = false, initial, off = false }: { labels?: boolean; initial?: string; off?: boolean } = {}) {
  const [sources, setSources] = useState<SkySource[]>([]);
  const [id, setId] = useState("");
  const [images, setImages] = useState<SkyImages | null>(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    const s = skySources({ labels });
    setSources(s);
    setId(s.find(x => x.id === initial)?.id ?? s[0]?.id ?? "");
  }, [labels, initial]);
  useEffect(() => {
    const src = sources.find(x => x.id === id);
    if (!src || off) return;
    let alive = true;
    setBusy(true);
    src.load()
      .then(im => { if (alive) { setImages(im); setBusy(false); } })
      .catch(() => { if (alive) setBusy(false); });
    return () => { alive = false; };
  }, [sources, id, off]);
  return { sources, id, setId, images, busy, source: sources.find(x => x.id === id) ?? null };
}

/**
 * Keeps a cube map texture in step with the chosen sky: call it from draw.
 * Re-uploads only when `images` changed since the last call on `holder`.
 */
export function skyTexture(gl: WebGL2RenderingContext, holder: { skyTex?: WebGLTexture | null; skyFrom?: SkyImages | null }, images: SkyImages | null) {
  if (images && holder.skyFrom !== images) {
    if (holder.skyTex) gl.deleteTexture(holder.skyTex);
    holder.skyTex = makeCubemap(gl, images.faces);
    holder.skyFrom = images;
  }
  return holder.skyTex ?? null;
}

/** A compact sky chooser for figure toolbars. */
export function SkyPicker({ sources, value, onChange, busy = false }: {
  sources: SkySource[]; value: string; onChange: (id: string) => void; busy?: boolean;
}) {
  if (sources.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">sky</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-[10px] font-mono rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text-main)] px-1.5 py-1 max-w-[11rem] focus:outline-none focus:border-[var(--primary)]/50">
        {sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      {busy && <span className="w-3 h-3 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" aria-label="loading" />}
    </label>
  );
}
