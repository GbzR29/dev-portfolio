"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { P2 } from "./svg";

// ── Vector math ───────────────────────────────────────────────────────────────
export type V3 = [number, number, number];

export const add   = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub   = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot   = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len   = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm  = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, scale(sub(b, a), t));

export const rotY = (p: V3, r: number): V3 => {
  const c = Math.cos(r), s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
export const rotX = (p: V3, r: number): V3 => {
  const c = Math.cos(r), s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

export const fmtV = (v: V3, d = 2) => `(${v.map(n => (Math.abs(n) < 0.005 ? 0 : n).toFixed(d)).join(", ")})`;

// ── Diagram projection ────────────────────────────────────────────────────────
// The figure's own "eye": orbits the scene by yaw/pitch with a mild
// perspective, so depth reads without the distortion of a real camera.
export type Orbit = { yaw: number; pitch: number; zoom: number; pan?: P2 };
export type Projected = P2 & { depth: number };

export function makeProjector(o: Orbit, cx: number, cy: number, unit: number, dist = 9) {
  const cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw);
  const cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
  const px = cx + (o.pan?.x ?? 0), py = cy + (o.pan?.y ?? 0);
  return (p: V3): Projected => {
    const x1 = p[0] * cyw - p[2] * syw;
    const z1 = p[0] * syw + p[2] * cyw;
    const y2 = p[1] * cp - z1 * sp;
    const toward = p[1] * sp + z1 * cp;           // + means closer to the eye
    const depth = dist - toward;
    const k = (dist / Math.max(0.5, depth)) * unit * o.zoom;
    return { x: px + x1 * k, y: py - y2 * k, depth };
  };
}
export type Projector = ReturnType<typeof makeProjector>;

/**
 * True when a projected polygon faces the viewer. Faces are wound
 * counter-clockwise seen from outside (see boxFaces); screen y grows downward,
 * so a visible face has a negative signed area here.
 */
export function frontFacing(sp: P2[]): boolean {
  let a = 0;
  for (let i = 0; i < sp.length; i++) {
    const p = sp[i], q = sp[(i + 1) % sp.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a < 0;
}

/**
 * Orbit controls for an <svg> figure, matching the NDC 3D widget:
 *   left drag — orbit (drag right turns the scene right)
 *   middle drag or Shift + left drag — pan
 *   wheel or two-finger pinch — zoom
 */
export function useOrbit(initial: Orbit) {
  const [orbit, setOrbit] = useState<Orbit>({ pan: { x: 0, y: 0 }, ...initial });
  const ref      = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, P2>());
  const mode     = useRef<"orbit" | "pan" | null>(null);
  const pinch    = useRef<number | null>(null);

  const clampZoom = (z: number) => Math.max(0.5, Math.min(3, z));
  /** Client px → viewBox units, so panning tracks the cursor at any size. */
  const unitScale = () => {
    const el = ref.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return r.width ? el.viewBox.baseVal.width / r.width : 1;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setOrbit(o => ({ ...o, zoom: clampZoom(o.zoom * (e.deltaY > 0 ? 0.92 : 1.09)) }));
    };
    // Pressing the wheel would otherwise start the browser's autoscroll
    const onMouseDown = (e: MouseEvent) => { if (e.button === 1) e.preventDefault(); };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button === 2) return;
    ref.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
      mode.current = null;
      return;
    }
    mode.current = (e.pointerType === "mouse" && e.button === 1) || e.shiftKey ? "pan" : "orbit";
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const last = pointers.current.get(e.pointerId);
    if (!last) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current) { const k = d / pinch.current; setOrbit(o => ({ ...o, zoom: clampZoom(o.zoom * k) })); }
      pinch.current = d;
      return;
    }
    if (mode.current === "pan") {
      const s = unitScale();
      setOrbit(o => ({ ...o, pan: { x: (o.pan?.x ?? 0) + dx * s, y: (o.pan?.y ?? 0) + dy * s } }));
    } else if (mode.current === "orbit") {
      setOrbit(o => ({
        ...o,
        yaw: o.yaw - dx * 0.01,
        pitch: Math.max(-0.2, Math.min(1.45, o.pitch + dy * 0.01)),
      }));
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) mode.current = null;
  }, []);

  const reset = () => setOrbit({ pan: { x: 0, y: 0 }, ...initial });

  return {
    orbit, reset, ref,
    handlers: {
      onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}

// ── Cameras ───────────────────────────────────────────────────────────────────
export type CamBasis = { pos: V3; f: V3; r: V3; u: V3; degenerate: boolean };

/** glm::lookAt's basis: forward toward the target, right = f × up, up = r × f. */
export function lookAtBasis(pos: V3, target: V3, worldUp: V3 = [0, 1, 0]): CamBasis {
  const f = norm(sub(target, pos));
  const rc = cross(f, worldUp);
  const degenerate = len(rc) < 0.09;
  const r = norm(rc);
  return { pos, f, r, u: cross(r, f), degenerate };
}

/**
 * The view transform, applied partway (a in 0..1). First half: translate by
 * -pos, so the camera reaches the origin. Second half: yaw, then pitch, until
 * forward points down -Z. At a = 1 this equals glm::lookAt (no roll).
 */
export function viewTransform(b: CamBasis, a: number) {
  const a1 = Math.min(1, a * 2), a2 = Math.max(0, a * 2 - 1);
  const yaw = Math.atan2(b.f[0], -b.f[2]);
  const pitch = Math.asin(Math.max(-1, Math.min(1, b.f[1])));
  const point = (p: V3): V3 => rotX(rotY(sub(p, scale(b.pos, a1)), yaw * a2), -pitch * a2);
  const dir   = (d: V3): V3 => rotX(rotY(d, yaw * a2), -pitch * a2);
  return { point, dir };
}

// ── Shaded boxes ──────────────────────────────────────────────────────────────
export type Face = { pts: V3[]; normal: V3; fill?: string };

/** An oriented box: centre, half extents along the given (unit) axes. */
export function boxFaces(c: V3, half: V3, ax: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]): Face[] {
  const corner = (sx: number, sy: number, sz: number): V3 =>
    add(c, add(scale(ax[0], half[0] * sx), add(scale(ax[1], half[1] * sy), scale(ax[2], half[2] * sz))));
  const F = (n: V3, q: V3[]): Face => ({ pts: q, normal: n });
  return [
    F(ax[0],            [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)]),
    F(scale(ax[0], -1), [corner(-1, -1, -1), corner(-1, -1, 1), corner(-1, 1, 1), corner(-1, 1, -1)]),
    F(ax[1],            [corner(-1, 1, -1), corner(-1, 1, 1), corner(1, 1, 1), corner(1, 1, -1)]),
    F(scale(ax[1], -1), [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)]),
    F(ax[2],            [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)]),
    F(scale(ax[2], -1), [corner(-1, -1, -1), corner(-1, 1, -1), corner(1, 1, -1), corner(1, -1, -1)]),
  ];
}

const LIGHT = norm([0.5, 0.9, 0.7]);

/** How much the key light hits a face with normal n (0..1). */
export const lightAmount = (n: V3) => Math.max(0, dot(norm(n), LIGHT));

/** Grey level for a face: a soft key light plus ambient, like a clay render. */
export const shade = (n: V3, base = 0.55) => {
  const k = Math.max(0, dot(norm(n), LIGHT));
  const v = Math.round((base * 0.55 + k * base * 0.75) * 255);
  return `rgb(${v},${v},${Math.min(255, v + 6)})`;
};
