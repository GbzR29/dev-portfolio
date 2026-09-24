"use client";

import { useEffect, useRef, useState } from "react";
import { forwardFrom, norm, cross, type Vec3 } from "./gl";
import { skyboxSets } from "./protoTexture";
import { proceduralFace, proceduralEquirect } from "./gl";

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
  init, draw, frame, look, onLook, onHover, aspect = 16 / 9, className = "", fovRange = [0.6, 1.9], children,
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      setSize({ w, h, aspect: w / h });
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

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
          // "Grab the world": drag right and the view turns left
          const k = 0.0045 * (l.fov / 1.2);
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

// ── Sky sources ───────────────────────────────────────────────────────────────
// "procedural" is always there; any set under public/textures/skybox/<name>/
// shows up next to it (faces and/or equirect), through the asset manifest.

export type SkySource = { id: string; label: string; faces: (string | HTMLCanvasElement)[]; equirect: string | HTMLCanvasElement };

const procFaces: Partial<Record<"labelled" | "plain", HTMLCanvasElement[]>> = {};
let procEquirect: HTMLCanvasElement | null = null;

/**
 * Sky sources: sets shipped in public/textures/skybox first, the procedural
 * sky last (and alone when nothing ships), so [0] is always the one to use.
 * Labelled procedural faces print "+X", "px.png"… on each face, which helps
 * when studying orientation; scenes use the plain ones.
 */
export function skySources({ labels = false } = {}): SkySource[] {
  if (typeof document === "undefined") return [];
  const key = labels ? "labelled" : "plain";
  const faces = (procFaces[key] ??= [0, 1, 2, 3, 4, 5].map(f => proceduralFace(f, 384, labels)));
  procEquirect ??= proceduralEquirect(1024);
  const out: SkySource[] = Object.entries(skyboxSets()).map(([name, set]) =>
    ({ id: name, label: name, faces: set.faces ?? faces, equirect: set.equirect ?? procEquirect! }));
  out.push({ id: "procedural", label: "procedural", faces, equirect: procEquirect });
  return out;
}

/** A face image as something an <image href> can show. */
export const faceHref = (f: string | HTMLCanvasElement) => (typeof f === "string" ? f : f.toDataURL());
