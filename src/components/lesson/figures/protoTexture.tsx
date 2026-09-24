"use client";

import { useEffect, useState } from "react";
import { pts, type P2 } from "./svg";

// ── Prototype textures for figure geometry ────────────────────────────────────
// Each name loads /textures/prototype/<name>.png from /public. Until that file
// exists (or if it fails to load) a procedural grid in the same colour is used,
// so figures always have a texture and pick up real PNGs as soon as they land.

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
    const img = new Image();
    img.onload = () => { resolved.set(name, img.src); listeners.forEach(f => f()); };
    img.src = `/textures/prototype/${name}.png`;
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

/**
 * One textured quad. The texture is mapped with the affine transform that
 * takes the unit square onto corners 0, 1 and 3, then clipped to the real
 * outline; the base colour underneath covers any sliver the affine map misses.
 * `light` (0..1) darkens the face for a simple clay-style shading.
 */
export function TexturedFace({ id, sp, name, tex, light, stroke = "rgba(0,0,0,0.35)", opacity = 1 }: {
  id: string; sp: P2[]; name: ProtoName; tex: string | undefined; light: number;
  stroke?: string; opacity?: number;
}) {
  const [A, B, , D] = sp;
  const m = `matrix(${B.x - A.x} ${B.y - A.y} ${D.x - A.x} ${D.y - A.y} ${A.x} ${A.y})`;
  const shadow = 0.62 * (1 - (0.3 + 0.7 * Math.max(0, Math.min(1, light))));
  const outline = pts(sp);
  return (
    <g opacity={opacity}>
      <clipPath id={id}><polygon points={outline} /></clipPath>
      <polygon points={outline} fill={PROTO[name]} />
      {tex && (
        <g clipPath={`url(#${id})`}>
          <image href={tex} x={0} y={0} width={1} height={1} preserveAspectRatio="none" transform={m} />
        </g>
      )}
      <polygon points={outline} fill={`rgba(0,0,0,${shadow.toFixed(3)})`} stroke={stroke} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  );
}
