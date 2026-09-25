"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { P2 } from "./svg";
import { add, sub, scale, dot, cross, len, norm, lerp3, rotY, rotX, type Vec3 } from "./vec3";

// ── Vector math (kit/vec3, re-exported for the figures) ──────────────────────
export { add, sub, scale, dot, cross, len, norm, lerp3, rotY, rotX };
export type V3 = Vec3;

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

/** Unit vector from the scene toward the diagram's eye, for an orbit. */
export const towardEye = (o: Orbit): V3 =>
  [Math.sin(o.yaw) * Math.cos(o.pitch), Math.sin(o.pitch), Math.cos(o.yaw) * Math.cos(o.pitch)];

/** An oriented box: centre, half extents and unit axes (same shape as boxFaces takes). */
export type Box = { c: V3; half: V3; ax: [V3, V3, V3] };

/** Slab test: does the ray p + t·dir (t > 0) pass through the box? */
function rayHitsBox(p: V3, dir: V3, b: Box): boolean {
  let t0 = 1e-6, t1 = Infinity;
  const d = sub(p, b.c);
  for (let i = 0; i < 3; i++) {
    const o = dot(d, b.ax[i]), v = dot(dir, b.ax[i]), h = b.half[i];
    if (Math.abs(v) < 1e-9) { if (Math.abs(o) > h) return false; continue; }
    let ta = (-h - o) / v, tb = (h - o) / v;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

const insideBox = (p: V3, b: Box) => {
  const d = sub(p, b.c);
  return [0, 1, 2].every(i => Math.abs(dot(d, b.ax[i])) <= b.half[i] + 1e-9);
};

/**
 * The stretches of segment a→b that are NOT hidden by any box, seen from the
 * `toward` direction. Lines are drawn before the solid geometry (so hidden
 * parts get covered); these runs are then drawn again on top.
 */
export function visibleRuns(a: V3, b: V3, boxes: Box[], toward: V3, samples = 40): [V3, V3][] {
  const runs: [V3, V3][] = [];
  let start: V3 | null = null, last: V3 | null = null;
  for (let i = 0; i <= samples; i++) {
    const p = lerp3(a, b, i / samples);
    const seen = boxes.every(bx => !insideBox(p, bx) && !rayHitsBox(p, toward, bx));
    if (seen) { if (!start) start = p; last = p; }
    else if (start && last) { runs.push([start, last]); start = last = null; }
  }
  if (start && last) runs.push([start, last]);
  return runs;
}

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

/**
 * An oriented box: centre, half extents along the given (unit) axes.
 * Faces come out counter-clockwise seen from outside even when the axes are
 * left-handed (a camera's right, up, forward: r × u = −f), since frontFacing
 * relies on that winding.
 */
export function boxFaces(c: V3, half: V3, ax: [V3, V3, V3] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]): Face[] {
  const corner = (sx: number, sy: number, sz: number): V3 =>
    add(c, add(scale(ax[0], half[0] * sx), add(scale(ax[1], half[1] * sy), scale(ax[2], half[2] * sz))));
  const leftHanded = dot(cross(ax[0], ax[1]), ax[2]) < 0;
  const F = (n: V3, q: V3[]): Face => ({ pts: leftHanded ? [...q].reverse() : q, normal: n });
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

/**
 * A closed cylinder as faces: `sides` quads around the axis plus two caps.
 * `axis` is its unit direction; u × v must equal axis so the winding stays
 * counter-clockwise from outside, like boxFaces.
 */
export function cylinderFaces(c: V3, axis: V3, u: V3, v: V3, radius: number, halfLen: number, sides = 14): Face[] {
  const ring = (h: number) => Array.from({ length: sides }, (_, k) => {
    const a = (k / sides) * Math.PI * 2;
    return add(add(c, scale(axis, h)), add(scale(u, Math.cos(a) * radius), scale(v, Math.sin(a) * radius)));
  });
  const bot = ring(-halfLen), top = ring(halfLen);
  const faces: Face[] = [];
  for (let k = 0; k < sides; k++) {
    const k1 = (k + 1) % sides, mid = ((k + 0.5) / sides) * Math.PI * 2;
    faces.push({ pts: [bot[k], bot[k1], top[k1], top[k]], normal: add(scale(u, Math.cos(mid)), scale(v, Math.sin(mid))) });
  }
  faces.push({ pts: top, normal: axis });
  faces.push({ pts: [...bot].reverse(), normal: scale(axis, -1) });
  return faces;
}

/** How much the key light hits a face with normal n (0..1). */
export const lightAmount = (n: V3) => Math.max(0, dot(norm(n), LIGHT));

/** Grey level for a face: a soft key light plus ambient, like a clay render. */
export const shade = (n: V3, base = 0.55) => {
  const k = Math.max(0, dot(norm(n), LIGHT));
  const v = Math.round((base * 0.55 + k * base * 0.75) * 255);
  return `rgb(${v},${v},${Math.min(255, v + 6)})`;
};
