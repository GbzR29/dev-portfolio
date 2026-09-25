"use client";

// ── Shared SVG primitives for lesson figures ──────────────────────────────────
// Everything here works in screen (viewBox) coordinates and takes colours as
// CSS values, so figures can pass theme variables straight through.

export type P2 = { x: number; y: number };

export function Arrow({ a, b, color, w = 1.6, head = 6, dash, opacity = 1 }: {
  a: P2; b: P2; color: string; w?: number; head?: number; dash?: string; opacity?: number;
}) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 2) return null;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  const h = Math.min(head, len * 0.5);
  return (
    <g opacity={opacity}>
      <line x1={a.x} y1={a.y} x2={b.x - ux * h * 0.7} y2={b.y - uy * h * 0.7}
        stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon fill={color} points={`${b.x},${b.y} ${b.x - ux * h - uy * h * 0.5},${b.y - uy * h + ux * h * 0.5} ${b.x - ux * h + uy * h * 0.5},${b.y - uy * h - ux * h * 0.5}`} />
    </g>
  );
}

/** Text on a small chip, so labels stay legible over grid lines and geometry. */
export function Label({ x, y, children, color = "var(--text-muted)", anchor = "start", size = 8.5, bold = false }: {
  x: number; y: number; children: string; color?: string;
  anchor?: "start" | "middle" | "end"; size?: number; bold?: boolean;
}) {
  const w = children.length * size * 0.61 + 8;
  const rx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return (
    <g pointerEvents="none">
      <rect x={rx} y={y - size - 0.5} width={w} height={size + 5} rx={3} fill="var(--code-bg)" opacity={0.88} />
      <text x={rx + 4} y={y + 0.5} fill={color} fontSize={size} fontFamily="monospace"
        fontWeight={bold ? "bold" : "normal"}>{children}</text>
    </g>
  );
}

export const pts = (ps: P2[]) => ps.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
