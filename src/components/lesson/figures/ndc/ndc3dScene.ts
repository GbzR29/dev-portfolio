// src/components/lesson/figures/ndc/ndc3dScene.ts
// Camera, projection, palettes and geometry shared by the NDC 3D widget and its draw pass.

// ── Camera ────────────────────────────────────────────────────────────────────
// View space: +X right, +Y up, +Z away from the camera.
// The whole world is pushed CAM_Z units back, the eye sits CAM_D in front of it,
// so the perspective divisor is (CAM_D + CAM_Z + z). It reaches zero at z = -7,
// which is *inside* the reference grid — anything at or past NEAR must be
// clipped before projecting or it wraps around and streaks across the canvas.
export const SIZE      = 340;   // logical canvas size (CSS px)
export const CAM_D     = 5;
export const CAM_Z     = 2;
export const NEAR      = -4.2;  // view-space near plane
export const NEAR_FADE = 2.0;   // units over which geometry fades into the near plane

export const LIMIT     = 1.8;   // how far outside the NDC cube a vertex may go
export const SNAP      = 0.05;  // Alt-drag snap increment
export const FINE      = 0.22;  // Shift-drag multiplier
export const HIT_R     = 13;    // vertex grab radius in logical px
export const AXIS_HIT  = 9;     // gizmo handle grab distance in logical px
export const GIZMO_LEN = 0.42;  // gizmo arm length in world units

export type Vec3 = [number, number, number];
export type View = { x: number; y: number; z: number };
export type Pt   = { x: number; y: number };
export type Axis = 0 | 1 | 2;

// World → view (rotate Y, then X)
export function toView(vx: number, vy: number, vz: number, rotX: number, rotY: number): View {
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const x1 =  vx * cy + vz * sy;
  const z1 = -vx * sy + vz * cy;
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  return { x: x1, y: vy * cx - z1 * sx, z: vy * sx + z1 * cx };
}

// Inverse of the rotation part — turns a view-space direction back into world space.
export function viewDirToWorld(dx: number, dy: number, dz: number, rotX: number, rotY: number): Vec3 {
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const y1 =  dy * cx + dz * sx;
  const z1 = -dy * sx + dz * cx;
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  return [dx * cy - z1 * sy, y1, dx * sy + z1 * cy];
}

export function scaleAt(z: number, zoom: number) {
  const denom = Math.max(0.4, CAM_D + CAM_Z + z);
  return (CAM_D / denom) * SIZE * 0.26 * zoom;
}

export function viewToScreen(v: View, zoom: number, pan: Pt): Pt {
  const s = scaleAt(v.z, zoom);
  return { x: SIZE / 2 + pan.x + v.x * s, y: SIZE / 2 + pan.y - v.y * s };
}

// Clip a view-space segment against the near plane. Null if fully behind it.
export function clipNear(a: View, b: View): [View, View] | null {
  const aIn = a.z >= NEAR, bIn = b.z >= NEAR;
  if (aIn && bIn) return [a, b];
  if (!aIn && !bIn) return null;
  const t = (NEAR - a.z) / (b.z - a.z);
  const p: View = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR };
  return aIn ? [a, p] : [p, b];
}

export const clamp01    = (n: number) => Math.max(0, Math.min(1, n));
export const clampCoord = (n: number) => Math.max(-LIMIT, Math.min(LIMIT, n));
export const snapTo     = (n: number) => Math.round(n / SNAP) * SNAP;

// Normalize view depth → t ∈ [0,1] where 0 = closest, 1 = farthest
export function dt(z: number) { return clamp01((z + 1.9) / 3.8); }

/** Shortest distance from point p to segment a→b, for gizmo hit testing. */
export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = clamp01(((p.x - a.x) * vx + (p.y - a.y) * vy) / len2);
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
}

/** Keeps the point under the cursor fixed while zooming. See the 2D widget. */
export const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - SIZE / 2) * (1 - k) + pan.x * k,
  y: (cursor.y - SIZE / 2) * (1 - k) + pan.y * k,
});

// ── Palettes ──────────────────────────────────────────────────────────────────
// A 2D canvas cannot read CSS variables, so the two palettes live here and the
// draw pass takes `theme` as a dependency — that is what repaints on a toggle.
export type Palette = {
  grid: (a: number) => string;
  cube: (a: number) => string;
  ring: string;
  ringActive: string;
  legend: string;
};

export const PALETTES: Record<"dark" | "light", Palette> = {
  dark: {
    grid:       (a) => `rgba(150,165,215,${a})`,
    cube:       (a) => `rgba(59,130,246,${a})`,
    ring:       "rgba(255,255,255,0.40)",
    ringActive: "rgba(255,255,255,0.85)",
    legend:     "rgba(255,255,255,0.22)",
  },
  light: {
    grid:       (a) => `rgba(55,65,120,${a})`,
    cube:       (a) => `rgba(37,99,235,${a})`,
    ring:       "rgba(0,0,0,0.22)",
    ringActive: "rgba(0,0,0,0.55)",
    legend:     "rgba(0,0,0,0.32)",
  },
};

// Light surfaces have less contrast headroom, so the same alpha reads fainter.
export const GRID_GAIN = { dark: 1, light: 1.35 } as const;

export const AXIS_COLOR = ["#ef4444", "#22c55e", "#3b82f6"] as const;  // X, Y, Z
export const AXIS_NAME  = ["X", "Y", "Z"] as const;
export const AXIS_DIR: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ── Geometry ──────────────────────────────────────────────────────────────────

export const CUBE_V: Vec3[] = [
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
];
export const CUBE_FACES: number[][] = [
  [0,1,2,3],[4,5,6,7],[1,5,6,2],[0,4,7,3],[3,7,6,2],[0,1,5,4],
];
export const CUBE_E: [number,number][] = [
  [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
];

export type ShapeData = {
  label: string; color: string;
  verts: Vec3[];
  faces: number[][];
  edges: [number,number][];
};

export const SHAPES: ShapeData[] = [
  {
    label: "Triangle", color: "#3b82f6",
    verts: [[0,0.7,0],[-0.65,-0.5,0],[0.65,-0.5,0]],
    faces: [[0,1,2]], edges: [[0,1],[1,2],[2,0]],
  },
  {
    label: "Quad", color: "#22c55e",
    verts: [[-0.6,0.6,0],[0.6,0.6,0],[0.6,-0.6,0],[-0.6,-0.6,0]],
    faces: [[0,1,2,3]], edges: [[0,1],[1,2],[2,3],[3,0]],
  },
  {
    label: "Cube", color: "#a855f7",
    verts: [
      [-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5],
      [-0.5,-0.5, 0.5],[0.5,-0.5, 0.5],[0.5,0.5, 0.5],[-0.5,0.5, 0.5],
    ],
    faces: [[0,1,2,3],[4,5,6,7],[1,5,6,2],[0,4,7,3],[3,7,6,2],[0,1,5,4]],
    edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
  },
  {
    label: "Tetra", color: "#ef4444",
    verts: [[0,0.75,0],[-0.65,-0.5,0.4],[0.65,-0.5,0.4],[0,-0.5,-0.65]],
    faces: [[0,1,2],[0,1,3],[0,2,3],[1,2,3]],
    edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],
  },
];

// ── Reference grid ────────────────────────────────────────────────────────────
export const GRID_FAR  = 6;
export const GRID_STEP = 0.5;
export const GRID_Y    = -1.2;
export const GRID_N    = Math.round(GRID_FAR / GRID_STEP);
export const GRID_BASE = { axis: 0.55, unit: 0.22, sub: 0.085 } as const;
export type GridKind = keyof typeof GRID_BASE;

export const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

export const fmt = (n: number) => n.toFixed(2);
