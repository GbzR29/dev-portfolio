"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pts, type P2 } from "./svg";
import assets from "@/lib/generated/assets.json";
import { lerp3, type Vec3 } from "./vec3";

// ── Prototype textures for figure geometry ────────────────────────────────────
// A texture dropped in public/textures/prototype/<name>.png (or .jpg) is used
// when it is listed in the generated asset manifest (scripts/gen-assets-
// manifest.mjs, run before dev and build). Anything missing falls back to a
// procedural grid in the same colour — without requesting a file that 404s.

const MANIFEST = assets as {
  prototype: Record<string, string>;
  icons: Record<string, string>;
  maps?: Record<string, string>;
  skybox: Record<string, { faces?: string[]; equirect?: string; cross?: string }>;
};

export const PROTO = {
  dark:   "#3b3f46",
  light:  "#d8d8d8",
  red:    "#e5334b",
  orange: "#f59a1b",
  purple: "#8b3fe6",
  green:  "#2fbf62",
  blue:   "#3b82f6",
} as const;
export type ProtoName = keyof typeof PROTO;

const NAMES = Object.keys(PROTO) as ProtoName[];
const resolved = new Map<ProtoName, string>();
const listeners = new Set<() => void>();
let started = false;

/** A 128px tile: base colour, a fine 8×8 grid, a bold 2×2 grid and a corner tag. */
function procedural(name: ProtoName): string {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (!g) return "";
  g.fillStyle = PROTO[name];
  g.fillRect(0, 0, 128, 128);
  const ink = name === "light" ? "0,0,0" : "255,255,255";
  g.strokeStyle = `rgba(${ink},0.10)`;
  g.lineWidth = 1;
  for (let i = 0; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i + 0.5, 0); g.lineTo(i + 0.5, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i + 0.5); g.lineTo(128, i + 0.5); g.stroke();
  }
  g.strokeStyle = `rgba(${ink},0.28)`;
  g.lineWidth = 2;
  g.strokeRect(1, 1, 126, 126);
  g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke();
  g.fillStyle = `rgba(${ink},0.35)`;
  g.font = "bold 9px monospace";
  g.fillText("1m", 5, 13);
  return c.toDataURL();
}

function startLoading() {
  if (started) return;
  started = true;
  for (const name of NAMES) {
    resolved.set(name, procedural(name));
    const file = MANIFEST.prototype[name];
    if (!file) continue;                   // not shipped: keep the procedural tile
    const img = new Image();
    img.onload = () => { resolved.set(name, file); listeners.forEach(f => f()); };
    img.src = file;
  }
  listeners.forEach(f => f());
}

/** Texture URLs by name, or null during the server render / first paint. */
export function useProtoTextures(): Record<ProtoName, string> | null {
  const [, bump] = useState(0);
  useEffect(() => {
    const f = () => bump(n => n + 1);
    listeners.add(f);
    startLoading();
    f();
    return () => { listeners.delete(f); };
  }, []);
  if (resolved.size === 0) return null;
  return Object.fromEntries(NAMES.map(n => [n, resolved.get(n) ?? ""])) as Record<ProtoName, string>;
}

type V3 = Vec3;

/** Point at (s, t) on the quad: s runs corner 0 → 1, t runs corner 0 → 3. */
const bilinear = (q: V3[], s: number, t: number): V3 => lerp3(lerp3(q[0], q[1], s), lerp3(q[3], q[2], s), t);

/**
 * The same quad with its corners shifted so the image stands upright: its top
 * edge faces +Y, or −Z on a horizontal face. A cyclic shift keeps the winding,
 * so the image is only ever rotated, never mirrored.
 */
function upright(q: V3[]): V3[] {
  let best = 0, bestScore = -Infinity;
  for (let r = 0; r < 4; r++) {
    // The image's "up" runs from corner 1 back to corner 0 (its y goes 0 → 1)
    const a = q[r], b = q[(r + 1) % 4];
    const score = (a[1] - b[1]) - 0.01 * (a[2] - b[2]);
    if (score > bestScore + 1e-9) { bestScore = score; best = r; }
  }
  return [0, 1, 2, 3].map(k => q[(k + best) % 4]);
}

/** Pushes a polygon out from its centre by `px`, so neighbouring cells overlap instead of leaving hairline gaps. */
const grow = (p: P2[], px: number): P2[] => {
  const cx = p.reduce((a, q) => a + q.x, 0) / p.length, cy = p.reduce((a, q) => a + q.y, 0) / p.length;
  return p.map(q => { const dx = q.x - cx, dy = q.y - cy, l = Math.hypot(dx, dy) || 1; return { x: q.x + (dx / l) * px, y: q.y + (dy / l) * px }; });
};

/**
 * One textured quad, given in 3D plus the projection that puts it on screen.
 *
 * SVG can only map an image affinely, which ignores perspective. So the quad
 * is cut into an n×n grid in 3D (n grows with its size on screen), each cell is
 * projected on its own and gets the matching slice of the texture: piecewise
 * affine, which follows perspective closely. The corners are first shifted by
 * `upright`; then the texture's x runs along corner 0 → 3 and its y along
 * 0 → 1, which keeps the map orientation-preserving on front faces — the image
 * is upright and never shows up mirrored.
 * `light` (0..1) darkens the face for a simple clay-style shading.
 */
export function TexturedFace({ id, quad, project, name, tex, light, stroke = "rgba(0,0,0,0.35)", opacity = 1 }: {
  id: string; quad: V3[]; project: (q: V3) => P2; name: ProtoName; tex: string | undefined; light: number;
  stroke?: string; opacity?: number;
}) {
  const sp = quad.map(project);
  const outline = pts(sp);
  const size = Math.max(Math.hypot(sp[2].x - sp[0].x, sp[2].y - sp[0].y), Math.hypot(sp[3].x - sp[1].x, sp[3].y - sp[1].y));
  const n = size > 220 ? 4 : size > 110 ? 3 : size > 45 ? 2 : 1;
  const shadow = 0.62 * (1 - (0.3 + 0.7 * Math.max(0, Math.min(1, light))));

  const cells: { key: string; clip: string; m: string }[] = [];
  if (tex) {
    const q = upright(quad);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const s0 = i / n, s1 = (i + 1) / n, t0 = j / n, t1 = (j + 1) / n;
      const a = project(bilinear(q, s0, t0)), b = project(bilinear(q, s1, t0));
      const c = project(bilinear(q, s1, t1)), d = project(bilinear(q, s0, t1));
      // Image x ∈ [t0, t1] goes along a → d, image y ∈ [s0, s1] along a → b
      const ux = (d.x - a.x) * n, uy = (d.y - a.y) * n, vx = (b.x - a.x) * n, vy = (b.y - a.y) * n;
      const e = a.x - t0 * ux - s0 * vx, f = a.y - t0 * uy - s0 * vy;
      cells.push({ key: `${i}-${j}`, clip: pts(grow([a, b, c, d], n > 1 ? 0.35 : 0)), m: `matrix(${ux} ${uy} ${vx} ${vy} ${e} ${f})` });
    }
  }

  return (
    <g opacity={opacity}>
      <polygon points={outline} fill={PROTO[name]} />
      <clipPath id={id}><polygon points={outline} /></clipPath>
      <g clipPath={`url(#${id})`}>
        {cells.map(cell => (
          <g key={cell.key}>
            <clipPath id={`${id}-${cell.key}`}><polygon points={cell.clip} /></clipPath>
            <g clipPath={`url(#${id}-${cell.key})`}>
              <image href={tex} x={0} y={0} width={1} height={1} preserveAspectRatio="none" transform={cell.m} />
            </g>
          </g>
        ))}
      </g>
      <polygon points={outline} fill={`rgba(0,0,0,${shadow.toFixed(3)})`} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  );
}

// ── Figure icons ──────────────────────────────────────────────────────────────
// public/textures/icons/<name>.png|svg|webp replaces a figure's drawn icon.

/** URL of an icon image if one ships with the site, else null. */
export const iconUrl = (name: string): string | null => MANIFEST.icons[name.toLowerCase()] ?? null;

/**
 * Draws the icon image centred on (x, y) when public/textures/icons/<name>.*
 * exists, otherwise renders `children` — the figure's own vector drawing.
 */
export function FigureIcon({ name, x, y, size, children, opacity = 1 }: {
  name: string; x: number; y: number; size: number; children: ReactNode; opacity?: number;
}) {
  const url = iconUrl(name);
  if (!url) return <>{children}</>;
  return <image href={url} x={x - size / 2} y={y - size / 2} width={size} height={size} opacity={opacity}
    preserveAspectRatio="xMidYMid meet" />;
}

/** A lighting map shipped in public/textures/maps, or null. */
export const mapUrl = (name: string): string | null => MANIFEST.maps?.[name.toLowerCase()] ?? null;

/** Skybox sets that ship with the site (see the manifest script). */
export const skyboxSets = () => MANIFEST.skybox;
