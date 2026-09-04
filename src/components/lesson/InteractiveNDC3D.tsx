"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

// ── Camera ────────────────────────────────────────────────────────────────────
// View space: +X right, +Y up, +Z away from the camera.
// The whole world is pushed CAM_Z units back, the eye sits CAM_D in front of it,
// so the perspective divisor is (CAM_D + CAM_Z + z). It reaches zero at z = -7,
// which is *inside* the reference grid — anything at or past NEAR must be
// clipped before projecting or it wraps around and streaks across the canvas.
const SIZE      = 340;   // logical canvas size (CSS px)
const CAM_D     = 5;
const CAM_Z     = 2;
const NEAR      = -4.2;  // view-space near plane
const NEAR_FADE = 2.0;   // units over which geometry fades into the near plane

const LIMIT     = 1.8;   // how far outside the NDC cube a vertex may go
const SNAP      = 0.05;  // Alt-drag snap increment
const FINE      = 0.22;  // Shift-drag multiplier
const HIT_R     = 13;    // vertex grab radius in logical px
const AXIS_HIT  = 9;     // gizmo handle grab distance in logical px
const GIZMO_LEN = 0.42;  // gizmo arm length in world units

type Vec3 = [number, number, number];
type View = { x: number; y: number; z: number };
type Pt   = { x: number; y: number };
type Axis = 0 | 1 | 2;

// World → view (rotate Y, then X)
function toView(vx: number, vy: number, vz: number, rotX: number, rotY: number): View {
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const x1 =  vx * cy + vz * sy;
  const z1 = -vx * sy + vz * cy;
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  return { x: x1, y: vy * cx - z1 * sx, z: vy * sx + z1 * cx };
}

// Inverse of the rotation part — turns a view-space direction back into world space.
function viewDirToWorld(dx: number, dy: number, dz: number, rotX: number, rotY: number): Vec3 {
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const y1 =  dy * cx + dz * sx;
  const z1 = -dy * sx + dz * cx;
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  return [dx * cy - z1 * sy, y1, dx * sy + z1 * cy];
}

function scaleAt(z: number, zoom: number) {
  const denom = Math.max(0.4, CAM_D + CAM_Z + z);
  return (CAM_D / denom) * SIZE * 0.26 * zoom;
}

function viewToScreen(v: View, zoom: number, pan: Pt): Pt {
  const s = scaleAt(v.z, zoom);
  return { x: SIZE / 2 + pan.x + v.x * s, y: SIZE / 2 + pan.y - v.y * s };
}

// Clip a view-space segment against the near plane. Null if fully behind it.
function clipNear(a: View, b: View): [View, View] | null {
  const aIn = a.z >= NEAR, bIn = b.z >= NEAR;
  if (aIn && bIn) return [a, b];
  if (!aIn && !bIn) return null;
  const t = (NEAR - a.z) / (b.z - a.z);
  const p: View = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR };
  return aIn ? [a, p] : [p, b];
}

const clamp01    = (n: number) => Math.max(0, Math.min(1, n));
const clampCoord = (n: number) => Math.max(-LIMIT, Math.min(LIMIT, n));
const snapTo     = (n: number) => Math.round(n / SNAP) * SNAP;

// Normalize view depth → t ∈ [0,1] where 0 = closest, 1 = farthest
function dt(z: number) { return clamp01((z + 1.9) / 3.8); }

/** Shortest distance from point p to segment a→b, for gizmo hit testing. */
function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = clamp01(((p.x - a.x) * vx + (p.y - a.y) * vy) / len2);
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
}

/** Keeps the point under the cursor fixed while zooming. See the 2D widget. */
const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - SIZE / 2) * (1 - k) + pan.x * k,
  y: (cursor.y - SIZE / 2) * (1 - k) + pan.y * k,
});

// ── Palettes ──────────────────────────────────────────────────────────────────
// A 2D canvas cannot read CSS variables, so the two palettes live here and the
// draw pass takes `theme` as a dependency — that is what repaints on a toggle.
type Palette = {
  grid: (a: number) => string;
  cube: (a: number) => string;
  ring: string;
  ringActive: string;
  legend: string;
};

const PALETTES: Record<"dark" | "light", Palette> = {
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
const GRID_GAIN = { dark: 1, light: 1.35 } as const;

const AXIS_COLOR = ["#ef4444", "#22c55e", "#3b82f6"] as const;  // X, Y, Z
const AXIS_NAME  = ["X", "Y", "Z"] as const;
const AXIS_DIR: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ── Geometry ──────────────────────────────────────────────────────────────────

const CUBE_V: Vec3[] = [
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
];
const CUBE_FACES: number[][] = [
  [0,1,2,3],[4,5,6,7],[1,5,6,2],[0,4,7,3],[3,7,6,2],[0,1,5,4],
];
const CUBE_E: [number,number][] = [
  [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
];

type ShapeData = {
  label: string; color: string;
  verts: Vec3[];
  faces: number[][];
  edges: [number,number][];
};

const SHAPES: ShapeData[] = [
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
const GRID_FAR  = 6;
const GRID_STEP = 0.5;
const GRID_Y    = -1.2;
const GRID_N    = Math.round(GRID_FAR / GRID_STEP);
const GRID_BASE = { axis: 0.55, unit: 0.22, sub: 0.085 } as const;
type GridKind = keyof typeof GRID_BASE;

const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const fmt = (n: number) => n.toFixed(2);

// ── Component ─────────────────────────────────────────────────────────────────

export function InteractiveNDC3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rot, setRot]           = useState({ x: 0.40, y: 0.70 });
  const [shapeIdx, setShapeIdx] = useState(2);
  const [verts, setVerts]       = useState<Vec3[]>(() => SHAPES[2].verts.map(v => [...v] as Vec3));
  const [zoom, setZoom]         = useState(1.0);
  const [pan, setPan]           = useState<Pt>({ x: 0, y: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover]       = useState<{ vertex: number | null; axis: Axis | null }>(
    { vertex: null, axis: null });
  const [copied, setCopied]     = useState(false);
  // Raw text of the field being typed into, so "-", "" and "0." survive editing.
  const [draft, setDraft]       = useState<{ key: string; text: string } | null>(null);
  const { theme } = useTheme();

  // Latest projected positions (logical canvas px) — used for hit testing.
  const screenVerts = useRef<Pt[]>([]);
  const gizmoArms   = useRef<{ origin: Pt; tips: Pt[] } | null>(null);

  // Each variant carries a literal `mode`, so TypeScript can narrow the union
  // down to the vertex case after the earlier branches return.
  const drag = useRef<
    | { mode: "orbit"; last: Pt }
    | { mode: "pan"; last: Pt }
    | { mode: "vertex"; idx: number; last: Pt }
    | { mode: "axis"; idx: number; axis: Axis; last: Pt }
    | null
  >(null);

  const pointers = useRef(new Map<number, Pt>());
  const pinch    = useRef<{ dist: number; mid: Pt } | null>(null);

  // Live copies so pointer handlers never close over stale state. commitView
  // writes them synchronously, so several pointer events inside a single frame
  // each see the previous one's result.
  const rotRef  = useRef(rot);  rotRef.current  = rot;
  const zoomRef = useRef(zoom); zoomRef.current = zoom;
  const panRef  = useRef(pan);  panRef.current  = pan;

  /**
   * Commits zoom and pan together. Never nest one state setter inside another
   * setter's updater: React invokes updaters twice under StrictMode, which
   * would apply the pan twice.
   */
  const commitView = useCallback((nextZoom: number, nextPan: Pt) => {
    zoomRef.current = nextZoom;
    panRef.current  = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const applyZoom = useCallback((factor: number, cursor: Pt | null, extraPan?: Pt) => {
    const z = zoomRef.current;
    const next = Math.max(0.3, Math.min(4, z * factor));
    const base = cursor ? zoomAbout(panRef.current, cursor, next / z) : panRef.current;
    commitView(next, {
      x: base.x + (extraPan?.x ?? 0),
      y: base.y + (extraPan?.y ?? 0),
    });
  }, [commitView]);
  const applyZoomRef = useRef(applyZoom); applyZoomRef.current = applyZoom;

  const shape = SHAPES[shapeIdx];

  const selectShape = useCallback((i: number) => {
    setShapeIdx(i);
    setVerts(SHAPES[i].verts.map(v => [...v] as Vec3));
    setSelected(null);
    setHover({ vertex: null, axis: null });
    setDraft(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The canvas sits on --code-bg, which follows the theme.
    const C = PALETTES[theme];
    const gridGain = GRID_GAIN[theme];

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px  = Math.round(SIZE * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const view = (x: number, y: number, z: number) => toView(x, y, z, rot.x, rot.y);
    const proj = (x: number, y: number, z: number) => viewToScreen(view(x, y, z), zoom, pan);

    // ── Reference grid at y = GRID_Y ───────────────────────────────────────
    const paths: Record<GridKind, Map<number, Path2D>> = {
      axis: new Map(), unit: new Map(), sub: new Map(),
    };

    const addSeg = (kind: GridKind, x0: number, z0: number, x1: number, z1: number) => {
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const radial = 1 - Math.min(1, Math.hypot(mx, mz) / GRID_FAR) ** 2;
      if (radial <= 0.001) return;

      const seg = clipNear(view(x0, GRID_Y, z0), view(x1, GRID_Y, z1));
      if (!seg) return;

      const nearFade = clamp01((Math.min(seg[0].z, seg[1].z) - NEAR) / NEAR_FADE);
      const alpha = Math.min(1, GRID_BASE[kind] * gridGain * radial * nearFade);
      if (alpha < 0.012) return;

      const bucket = Math.round(alpha * 50) / 50;
      let path = paths[kind].get(bucket);
      if (!path) { path = new Path2D(); paths[kind].set(bucket, path); }
      const a = viewToScreen(seg[0], zoom, pan), b = viewToScreen(seg[1], zoom, pan);
      path.moveTo(a.x, a.y);
      path.lineTo(b.x, b.y);
    };

    const kindOf = (v: number): GridKind =>
      Math.abs(v) < 1e-6 ? "axis" : Math.abs(v - Math.round(v)) < 1e-6 ? "unit" : "sub";

    for (let i = -GRID_N; i <= GRID_N; i++) {
      const v = i * GRID_STEP;
      const kind = kindOf(v);
      for (let j = -GRID_N; j < GRID_N; j++) {
        const a = j * GRID_STEP, b = a + GRID_STEP;
        addSeg(kind, v, a, v, b);
        addSeg(kind, a, v, b, v);
      }
    }

    (["sub", "unit", "axis"] as GridKind[]).forEach(kind => {
      ctx.lineWidth = kind === "axis" ? 1.2 : 0.6;
      paths[kind].forEach((path, alpha) => {
        ctx.strokeStyle = C.grid(alpha);
        ctx.stroke(path);
      });
    });

    // ── NDC cube ──────────────────────────────────────────────────────────
    const cubeP = CUBE_V.map(([x,y,z]) => ({ p: proj(x,y,z), z: view(x,y,z).z }));

    CUBE_FACES
      .map(f => ({ f, depth: f.reduce((s,i) => s + cubeP[i].z, 0) / f.length }))
      .sort((a, b) => b.depth - a.depth)
      .forEach(({ f, depth }) => {
        ctx.beginPath();
        ctx.moveTo(cubeP[f[0]].p.x, cubeP[f[0]].p.y);
        f.slice(1).forEach(i => ctx.lineTo(cubeP[i].p.x, cubeP[i].p.y));
        ctx.closePath();
        ctx.fillStyle = C.cube(0.04 + (1 - dt(depth)) * 0.06);
        ctx.fill();
      });

    CUBE_E
      .map(([a, b]) => ({ a, b, depth: (cubeP[a].z + cubeP[b].z) / 2 }))
      .sort((x, y) => y.depth - x.depth)
      .forEach(({ a, b, depth }) => {
        const t = dt(depth);
        ctx.beginPath();
        ctx.moveTo(cubeP[a].p.x, cubeP[a].p.y);
        ctx.lineTo(cubeP[b].p.x, cubeP[b].p.y);
        ctx.strokeStyle = C.cube(0.07 + (1 - t) * 0.58);
        ctx.lineWidth   = t < 0.4 ? 1.8 : 0.8;
        ctx.setLineDash(t > 0.55 ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

    cubeP.forEach(({ p, z }) => {
      const t = dt(z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, t < 0.4 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = C.cube(0.1 + (1 - t) * 0.6);
      ctx.fill();
    });

    // ── World axes ────────────────────────────────────────────────────────
    const o = proj(0, 0, 0);
    AXIS_DIR.forEach((d, i) => {
      const v = proj(d[0] * 0.85, d[1] * 0.85, d[2] * 0.85);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = AXIS_COLOR[i];
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = AXIS_COLOR[i];
      ctx.font = "bold 11px monospace";
      ctx.fillText(AXIS_NAME[i], v.x + 4, v.y - 3);
    });

    // ── Shape ─────────────────────────────────────────────────────────────
    const { r, g, b } = hexRgb(shape.color);
    const shapeV = verts.map(([x,y,z]) => view(x,y,z));
    const shapeP = shapeV.map(v => viewToScreen(v, zoom, pan));
    screenVerts.current = shapeP;

    shape.faces
      .filter(f => f.every(i => i < shapeP.length))
      .map(f => ({ f, depth: f.reduce((s,i) => s + shapeV[i].z, 0) / f.length }))
      .sort((a, b) => b.depth - a.depth)
      .forEach(({ f, depth }) => {
        const t = dt(depth);
        const pts = f.map(i => shapeP[i]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle   = `rgba(${r},${g},${b},${0.20 + (1-t) * 0.18})`;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.55 + (1-t) * 0.35})`;
        ctx.lineWidth   = 1.6;
        ctx.fill();
        ctx.stroke();
      });

    // Vertex handles
    shapeP.forEach((p, i) => {
      const active   = selected === i || hover.vertex === i;
      const inBounds = verts[i].every(c => Math.abs(c) <= 1.0001);
      const color    = inBounds ? shape.color : "#ef4444";

      if (active) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.18)`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, active ? 6.5 : 5, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.strokeStyle = active ? C.ringActive : C.ring;
      ctx.lineWidth   = 1.5;
      ctx.setLineDash(inBounds ? [] : [3, 2]);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font      = "bold 9px monospace";
      ctx.fillText(`v${i}`, p.x + 8, p.y - 3);
    });

    // ── Gizmo on the selected vertex ──────────────────────────────────────
    if (selected !== null && selected < verts.length) {
      const [vx, vy, vz] = verts[selected];
      const origin = proj(vx, vy, vz);
      const tips = AXIS_DIR.map(d =>
        proj(vx + d[0] * GIZMO_LEN, vy + d[1] * GIZMO_LEN, vz + d[2] * GIZMO_LEN));
      gizmoArms.current = { origin, tips };

      // Draw the arm pointing most away from the camera first
      const order = [0, 1, 2].sort((a, c) => {
        const za = toView(vx + AXIS_DIR[a][0] * GIZMO_LEN, vy + AXIS_DIR[a][1] * GIZMO_LEN,
                          vz + AXIS_DIR[a][2] * GIZMO_LEN, rot.x, rot.y).z;
        const zc = toView(vx + AXIS_DIR[c][0] * GIZMO_LEN, vy + AXIS_DIR[c][1] * GIZMO_LEN,
                          vz + AXIS_DIR[c][2] * GIZMO_LEN, rot.x, rot.y).z;
        return zc - za;
      });

      order.forEach(i => {
        const tip    = tips[i];
        const active = hover.axis === i ||
          (drag.current?.mode === "axis" && drag.current.axis === i);
        const len    = Math.hypot(tip.x - origin.x, tip.y - origin.y);

        // An arm pointing almost straight at the camera cannot be dragged
        const usable = len > 6;

        ctx.globalAlpha = usable ? 1 : 0.25;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(tip.x, tip.y);
        ctx.strokeStyle = AXIS_COLOR[i];
        ctx.lineWidth   = active ? 3.5 : 2;
        ctx.lineCap     = "round";
        ctx.stroke();

        // Arrow head
        if (len > 8) {
          const ux = (tip.x - origin.x) / len, uy = (tip.y - origin.y) / len;
          const size = active ? 7 : 5.5;
          ctx.beginPath();
          ctx.moveTo(tip.x + ux * size, tip.y + uy * size);
          ctx.lineTo(tip.x - uy * size * 0.5, tip.y + ux * size * 0.5);
          ctx.lineTo(tip.x + uy * size * 0.5, tip.y - ux * size * 0.5);
          ctx.closePath();
          ctx.fillStyle = AXIS_COLOR[i];
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = "butt";
      });
    } else {
      gizmoArms.current = null;
    }

    // ── Legend ────────────────────────────────────────────────────────────
    ctx.fillStyle = C.legend;
    ctx.font      = "9px monospace";
    ctx.fillText("NDC cube  [-1, 1]³", 8, 15);
    ctx.fillText(
      selected !== null
        ? `v${selected} selected · drag an arrow to move on one axis`
        : `zoom ${zoom.toFixed(1)}×  ·  click a vertex  ·  drag to orbit`,
      8, SIZE - 7);

  }, [rot, shape, verts, zoom, pan, hover, selected, theme]);

  useEffect(() => { draw(); }, [draw]);

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const toLocal = useCallback((clientX: number, clientY: number): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: ((clientX - r.left) / r.width) * SIZE, y: ((clientY - r.top) / r.height) * SIZE };
  }, []);

  const localScale = () => {
    const r = canvasRef.current?.getBoundingClientRect();
    return r && r.width ? SIZE / r.width : 1;
  };

  /** Gizmo arms take priority over the vertex dot they start from. */
  const pickAxis = useCallback((local: Pt): Axis | null => {
    const gz = gizmoArms.current;
    if (!gz) return null;
    let best: Axis | null = null;
    let bestD = AXIS_HIT;
    ([0, 1, 2] as Axis[]).forEach(i => {
      const tip = gz.tips[i];
      if (Math.hypot(tip.x - gz.origin.x, tip.y - gz.origin.y) <= 6) return; // edge-on
      const d = distToSegment(local, gz.origin, tip);
      // Ignore the few px right at the origin, that is the vertex itself
      if (d <= bestD && Math.hypot(local.x - gz.origin.x, local.y - gz.origin.y) > 7) {
        bestD = d; best = i;
      }
    });
    return best;
  }, []);

  const pickVertex = useCallback((local: Pt): number | null => {
    let best: number | null = null;
    let bestD = HIT_R;
    screenVerts.current.forEach((p, i) => {
      const d = Math.hypot(p.x - local.x, p.y - local.y);
      if (d <= bestD) { bestD = d; best = i; }
    });
    return best;
  }, []);

  const pinchState = () => {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      mid:  { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  // ── Pointer down ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // The right button used to grab vertices and orbit. It now does nothing.
    if (e.pointerType === "mouse" && e.button === 2) return;

    canvasRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      drag.current  = null;
      pinch.current = pinchState();
      return;
    }
    if (pointers.current.size > 2) return;

    const local = toLocal(e.clientX, e.clientY);
    if (!local) return;
    const last = { x: e.clientX, y: e.clientY };

    // Middle button pans, everything else picks or orbits.
    if (e.pointerType === "mouse" && e.button === 1) {
      drag.current = { mode: "pan", last };
      e.preventDefault();
      return;
    }

    const axis = pickAxis(local);
    if (axis !== null && selected !== null) {
      drag.current = { mode: "axis", idx: selected, axis, last };
      setDraft(null);
      e.preventDefault();
      return;
    }

    const idx = pickVertex(local);
    if (idx !== null) {
      drag.current = { mode: "vertex", idx, last };
      setSelected(idx);
      setDraft(null);
    } else {
      drag.current = { mode: "orbit", last };
      setSelected(null);
    }
    e.preventDefault();
  }, [toLocal, pickAxis, pickVertex, selected]);

  // ── Pointer move ──────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointers.current.has(e.pointerId))
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two fingers: pinch to zoom about the midpoint, and drag it to pan.
    if (pointers.current.size >= 2) {
      const now  = pinchState();
      const prev = pinch.current;
      pinch.current = now;
      if (!prev) return;

      const scale    = localScale();
      const midLocal = toLocal(now.mid.x, now.mid.y);
      const ratio    = now.dist / prev.dist;
      const panDx    = (now.mid.x - prev.mid.x) * scale;
      const panDy    = (now.mid.y - prev.mid.y) * scale;

      applyZoom(ratio, midLocal, { x: panDx, y: panDy });
      return;
    }

    const d = drag.current;
    if (!d) {
      const local = toLocal(e.clientX, e.clientY);
      if (!local) return;
      const axis = pickAxis(local);
      setHover({ vertex: axis === null ? pickVertex(local) : null, axis });
      return;
    }

    const scale = localScale();
    const dx = (e.clientX - d.last.x) * scale;
    const dy = (e.clientY - d.last.y) * scale;
    d.last = { x: e.clientX, y: e.clientY };

    const k = e.shiftKey ? FINE : 1;

    if (d.mode === "pan") {
      commitView(zoomRef.current, { x: panRef.current.x + dx, y: panRef.current.y + dy });
      return;
    }

    if (d.mode === "orbit") {
      // Blender convention: drag right → object turns right, drag down → tilts up
      setRot(prev => ({ x: prev.x - dy * 0.009 * k, y: prev.y - dx * 0.009 * k }));
      return;
    }

    if (d.mode === "axis") {
      const { x: rx, y: ry } = rotRef.current;
      const z = zoomRef.current, p = panRef.current;
      const a = AXIS_DIR[d.axis];

      setVerts(prev => prev.map((v, i) => {
        if (i !== d.idx) return v;
        // Screen displacement produced by one world unit along this axis
        const p0 = viewToScreen(toView(v[0], v[1], v[2], rx, ry), z, p);
        const p1 = viewToScreen(toView(v[0] + a[0], v[1] + a[1], v[2] + a[2], rx, ry), z, p);
        const ax = p1.x - p0.x, ay = p1.y - p0.y;
        const len2 = ax * ax + ay * ay;
        if (len2 < 36) return v;                       // axis is edge-on, refuse
        const amount = ((dx * ax + dy * ay) / len2) * k;   // project the drag onto it
        const next = [...v] as Vec3;
        next[d.axis] = clampCoord(
          e.altKey ? snapTo(v[d.axis] + amount) : v[d.axis] + amount);
        return next;
      }));
      return;
    }

    // Free move within the camera plane, keeping depth constant
    setVerts(prev => prev.map((v, i) => {
      if (i !== d.idx) return v;
      const { x: rx, y: ry } = rotRef.current;
      const z = toView(v[0], v[1], v[2], rx, ry).z;
      const s = scaleAt(z, zoomRef.current);
      const [wx, wy, wz] = viewDirToWorld((dx / s) * k, (-dy / s) * k, 0, rx, ry);
      const next: Vec3 = [v[0] + wx, v[1] + wy, v[2] + wz];
      return next.map(c => clampCoord(e.altKey ? snapTo(c) : c)) as Vec3;
    }));
  }, [toLocal, pickAxis, pickVertex, applyZoom, commitView]);

  const endPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (canvasRef.current?.hasPointerCapture?.(e.pointerId))
      canvasRef.current.releasePointerCapture(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }, []);

  // ── Wheel: zoom about the cursor ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cursor = {
        x: ((e.clientX - r.left) / r.width) * SIZE,
        y: ((e.clientY - r.top) / r.height) * SIZE,
      };
      applyZoomRef.current(e.deltaY > 0 ? 0.91 : 1.1, cursor);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // ── Numeric editing ───────────────────────────────────────────────────────
  const setComponent = (vi: number, ci: Axis, raw: string) => {
    setDraft({ key: `${vi}-${ci}`, text: raw });
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return; // partial input like "-" or "" — keep the last value
    setVerts(prev => prev.map((v, i) => {
      if (i !== vi) return v;
      const next = [...v] as Vec3;
      next[ci] = clampCoord(n);
      return next;
    }));
  };

  const code = `float vertices[] = {\n${
    verts.map(([x,y,z]) => `    ${fmt(x)}f, ${fmt(y)}f, ${fmt(z)}f`).join(",\n")
  }\n};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  const reset = () => {
    setVerts(SHAPES[shapeIdx].verts.map(v => [...v] as Vec3));
    commitView(1, { x: 0, y: 0 });
    setRot({ x: 0.40, y: 0.70 });
    setSelected(null);
    setDraft(null);
  };

  const cursor =
    drag.current?.mode === "pan" ? "cursor-grabbing"
    : hover.axis !== null ? "cursor-pointer"
    : hover.vertex !== null ? "cursor-grab"
    : "cursor-grab active:cursor-grabbing";

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          NDC 3D — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          click a vertex for the gizmo · pinch or scroll to zoom
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        <div className="flex-shrink-0 bg-[var(--code-bg)] flex items-center justify-center md:border-r border-[var(--border)] p-2">
          <canvas
            ref={canvasRef}
            width={SIZE} height={SIZE}
            style={{ width: "min(340px, 88vw)", height: "auto", aspectRatio: "1", touchAction: "none" }}
            className={`select-none rounded ${cursor}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={() => { if (!drag.current) setHover({ vertex: null, axis: null }); }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
          />
        </div>

        <div className="flex-1 p-5 space-y-4 min-w-0">

          {/* Shape selector */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">Shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s, i) => (
                <button key={s.label} onClick={() => selectShape(i)}
                  className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                    shapeIdx === i
                      ? "border-transparent text-white"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30"
                  }`}
                  style={shapeIdx === i ? { background: s.color + "cc" } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editable vertices */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {shape.label} Vertices
              </p>
              <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">x · y · z</span>
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {verts.map((v, i) => {
                const inBounds = v.every(c => Math.abs(c) <= 1.0001);
                const color = inBounds ? shape.color : "#ef4444";
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHover({ vertex: i, axis: null })}
                    onMouseLeave={() => setHover({ vertex: null, axis: null })}
                    className={`flex items-center gap-2 font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      selected === i ? "bg-[var(--primary-low)]" : ""
                    }`}
                  >
                    <button
                      onClick={() => setSelected(selected === i ? null : i)}
                      className="flex items-center gap-2 flex-shrink-0"
                      title="Select for the gizmo"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-[var(--text-muted)] w-5 text-left">v{i}</span>
                    </button>
                    {([0,1,2] as Axis[]).map(ci => (
                      <input
                        key={ci}
                        type="number"
                        step={0.05}
                        min={-LIMIT}
                        max={LIMIT}
                        value={draft?.key === `${i}-${ci}` ? draft.text : fmt(v[ci])}
                        onChange={e => setComponent(i, ci, e.target.value)}
                        onFocus={() => setSelected(i)}
                        onBlur={() => setDraft(null)}
                        style={{ color }}
                        className="w-14 bg-transparent border border-[var(--border)] rounded px-1.5 py-0.5 text-right
                          focus:outline-none focus:border-[var(--primary)]/60 transition-colors
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                    {!inBounds && <span className="text-[9px] text-red-400">clipped</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* C++ snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">In C++</p>
              <button onClick={handleCopy}
                className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors px-2 py-0.5 rounded border border-transparent hover:border-[var(--border)]">
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>
            <pre className="text-[9.5px] font-mono bg-[var(--code-bg)] border border-[var(--code-border)] rounded-lg p-3 text-[var(--code-text)] overflow-auto leading-relaxed whitespace-pre max-h-40">
              {code}
            </pre>
          </div>

          {/* Controls */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono text-[var(--text-muted)]">zoom</span>
              <button onClick={() => applyZoom(0.85, null)}
                className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
                −
              </button>
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-center">{zoom.toFixed(1)}×</span>
              <button onClick={() => applyZoom(1.15, null)}
                className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
                +
              </button>
              <button onClick={() => commitView(zoomRef.current, { x: 0, y: 0 })}
                className="px-2 py-1 text-[9px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all">
                center
              </button>
              <button onClick={reset}
                className="px-2 py-1 text-[9px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all">
                reset
              </button>
            </div>

            <p className="text-[9px] font-mono text-[var(--text-muted)] opacity-70 leading-relaxed">
              <span style={{ color: AXIS_COLOR[0] }}>X</span>{" "}
              <span style={{ color: AXIS_COLOR[1] }}>Y</span>{" "}
              <span style={{ color: AXIS_COLOR[2] }}>Z</span> gizmo arms constrain one axis ·{" "}
              <span className="text-[var(--primary)]">shift</span> fine ·{" "}
              <span className="text-[var(--primary)]">alt</span> snap {SNAP} ·{" "}
              <span className="text-[var(--primary)]">middle-drag</span> pans
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
