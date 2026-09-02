"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── Camera ────────────────────────────────────────────────────────────────────
// View space: +X right, +Y up, +Z away from the camera.
// The whole world is pushed CAM_Z units back, the eye sits CAM_D in front of it,
// so the perspective divisor is (CAM_D + CAM_Z + z). It reaches zero at z = -7,
// which is *inside* the reference grid — anything at or past NEAR must be
// clipped before projecting or it wraps around and streaks across the canvas.
const SIZE   = 300;   // logical canvas size (CSS px)
const CAM_D  = 5;
const CAM_Z  = 2;
const NEAR   = -4.2;  // view-space near plane
const NEAR_FADE = 2.0; // units over which geometry fades out into the near plane

type Vec3 = [number, number, number];
type View = { x: number; y: number; z: number };
type Pt   = { x: number; y: number };

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

function viewToScreen(v: View, zoom: number): Pt {
  const s = scaleAt(v.z, zoom);
  return { x: SIZE / 2 + v.x * s, y: SIZE / 2 - v.y * s };
}

// Clip a view-space segment against the near plane. Returns null if fully behind it.
function clipNear(a: View, b: View): [View, View] | null {
  const aIn = a.z >= NEAR, bIn = b.z >= NEAR;
  if (aIn && bIn) return [a, b];
  if (!aIn && !bIn) return null;
  const t = (NEAR - a.z) / (b.z - a.z);
  const p: View = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: NEAR };
  return aIn ? [a, p] : [p, b];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Normalize view depth → t ∈ [0,1] where 0 = closest, 1 = farthest (NDC cube range)
function dt(z: number) { return clamp01((z + 1.9) / 3.8); }

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
const GRID_FAR  = 6;    // extends ±6 NDC units from the origin
const GRID_STEP = 0.5;  // half-unit cells
const GRID_Y    = -1.2; // slightly below the NDC cube's bottom face
const GRID_N    = Math.round(GRID_FAR / GRID_STEP);
const GRID_BASE = { axis: 0.55, unit: 0.22, sub: 0.085 } as const;
type GridKind = keyof typeof GRID_BASE;

const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const fmt = (n: number) => n.toFixed(2);
const clampCoord = (n: number) => Math.max(-1.8, Math.min(1.8, n));

// ── Component ─────────────────────────────────────────────────────────────────

export function InteractiveNDC3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rot, setRot]           = useState({ x: 0.40, y: 0.70 });
  const [shapeIdx, setShapeIdx] = useState(2);
  const [verts, setVerts]       = useState<Vec3[]>(() => SHAPES[2].verts.map(v => [...v] as Vec3));
  const [zoom, setZoom]         = useState(1.0);
  const [hover, setHover]       = useState<number | null>(null);
  const [copied, setCopied]     = useState(false);
  // Raw text of the field being typed into, so "-", "" and "0." survive editing.
  const [draft, setDraft]       = useState<{ key: string; text: string } | null>(null);

  // Latest projected vertex positions (logical canvas px) — used for hit testing.
  const screenVerts = useRef<Pt[]>([]);
  const drag        = useRef<{ mode: "orbit" | "vertex"; idx: number } | null>(null);
  const lastMouse   = useRef({ x: 0, y: 0 });
  // Live copies so the window-level listeners never read stale state.
  const rotRef      = useRef(rot);
  const zoomRef     = useRef(zoom);
  rotRef.current    = rot;
  zoomRef.current   = zoom;

  const shape = SHAPES[shapeIdx];

  const selectShape = useCallback((i: number) => {
    setShapeIdx(i);
    setVerts(SHAPES[i].verts.map(v => [...v] as Vec3));
    setHover(null);
    setDraft(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The canvas always sits on --code-bg (#0d1117), dark in both themes.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px  = Math.round(SIZE * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    const view = (x: number, y: number, z: number) => toView(x, y, z, rot.x, rot.y);
    const proj = (x: number, y: number, z: number) => viewToScreen(view(x, y, z), zoom);

    // ── Infinite-looking reference grid at y = GRID_Y ──────────────────────
    // Every cell edge is its own segment so the radial fade varies along a line
    // instead of being flat over its whole length.
    const paths: Record<GridKind, Map<number, Path2D>> = {
      axis: new Map(), unit: new Map(), sub: new Map(),
    };

    const addSeg = (kind: GridKind, x0: number, z0: number, x1: number, z1: number) => {
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const radial = 1 - Math.min(1, Math.hypot(mx, mz) / GRID_FAR) ** 2;
      if (radial <= 0.001) return;

      const seg = clipNear(view(x0, GRID_Y, z0), view(x1, GRID_Y, z1));
      if (!seg) return;

      // Fade into the near plane so the clip edge is never visible as a hard cut.
      const nearFade = clamp01((Math.min(seg[0].z, seg[1].z) - NEAR) / NEAR_FADE);
      const alpha = GRID_BASE[kind] * radial * nearFade;
      if (alpha < 0.012) return;

      const bucket = Math.round(alpha * 50) / 50;
      let path = paths[kind].get(bucket);
      if (!path) { path = new Path2D(); paths[kind].set(bucket, path); }
      const a = viewToScreen(seg[0], zoom), b = viewToScreen(seg[1], zoom);
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
        addSeg(kind, v, a, v, b);  // line along Z at x = v
        addSeg(kind, a, v, b, v);  // line along X at z = v
      }
    }

    // Grid lines are coplanar, so no depth sort is needed — draw faint to strong.
    (["sub", "unit", "axis"] as GridKind[]).forEach(kind => {
      ctx.lineWidth = kind === "axis" ? 1.2 : 0.6;
      paths[kind].forEach((path, alpha) => {
        ctx.strokeStyle = `rgba(150,165,215,${alpha})`;
        ctx.stroke(path);
      });
    });

    // ── NDC cube ──────────────────────────────────────────────────────────
    const cubeP = CUBE_V.map(([x,y,z]) => ({ p: proj(x,y,z), z: view(x,y,z).z }));

    // Painter's algorithm: farthest first, so nearer faces overdraw them.
    CUBE_FACES
      .map(f => ({ f, depth: f.reduce((s,i) => s + cubeP[i].z, 0) / f.length }))
      .sort((a, b) => b.depth - a.depth)
      .forEach(({ f, depth }) => {
        const alpha = 0.04 + (1 - dt(depth)) * 0.06;
        ctx.beginPath();
        ctx.moveTo(cubeP[f[0]].p.x, cubeP[f[0]].p.y);
        f.slice(1).forEach(i => ctx.lineTo(cubeP[i].p.x, cubeP[i].p.y));
        ctx.closePath();
        ctx.fillStyle = `rgba(59,130,246,${alpha})`;
        ctx.fill();
      });

    // Back edges dashed + faint, front edges solid + opaque
    CUBE_E
      .map(([a, b]) => ({ a, b, depth: (cubeP[a].z + cubeP[b].z) / 2 }))
      .sort((x, y) => y.depth - x.depth)
      .forEach(({ a, b, depth }) => {
        const t = dt(depth);
        ctx.beginPath();
        ctx.moveTo(cubeP[a].p.x, cubeP[a].p.y);
        ctx.lineTo(cubeP[b].p.x, cubeP[b].p.y);
        ctx.strokeStyle = `rgba(59,130,246,${0.07 + (1 - t) * 0.58})`;
        ctx.lineWidth   = t < 0.4 ? 1.8 : 0.8;
        ctx.setLineDash(t > 0.55 ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      });

    cubeP.forEach(({ p, z }) => {
      const t = dt(z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, t < 0.4 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59,130,246,${0.1 + (1 - t) * 0.6})`;
      ctx.fill();
    });

    // ── Axes ──────────────────────────────────────────────────────────────
    const o = proj(0, 0, 0);
    [
      { v: proj(0.85,0,0), color:"#ef4444", label:"X" },
      { v: proj(0,0.85,0), color:"#22c55e", label:"Y" },
      { v: proj(0,0,0.85), color:"#3b82f6", label:"Z" },
    ].forEach(({ v, color, label }) => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(v.x, v.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "bold 11px monospace";
      ctx.fillText(label, v.x + 4, v.y - 3);
    });

    // ── Shape ─────────────────────────────────────────────────────────────
    const { r, g, b } = hexRgb(shape.color);
    const shapeV = verts.map(([x,y,z]) => view(x,y,z));
    const shapeP = shapeV.map(v => viewToScreen(v, zoom));
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

    // Vertex handles + labels
    shapeP.forEach((p, i) => {
      const active   = hover === i || drag.current?.idx === i;
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
      ctx.strokeStyle = active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash(inBounds ? [] : [3, 2]);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = color;
      ctx.font      = "bold 9px monospace";
      ctx.fillText(`v${i}`, p.x + 8, p.y - 3);
    });

    // ── Legend ────────────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.font      = "9px monospace";
    ctx.fillText("NDC cube  [-1, 1]³", 8, 15);
    ctx.fillText(`zoom ${zoom.toFixed(1)}×  ·  drag vertex or orbit  ·  scroll`, 8, SIZE - 7);

  }, [rot, shape, verts, zoom, hover]);

  useEffect(() => { draw(); }, [draw]);

  // ── Pointer helpers ───────────────────────────────────────────────────────
  const clientOf = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      const t = e.touches[0] ?? (e as TouchEvent).changedTouches?.[0];
      return t ? { x: t.clientX, y: t.clientY } : null;
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  // Client coords → logical canvas px
  const toLocal = (cx: number, cy: number): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((cx - rect.left) / rect.width)  * SIZE,
      y: ((cy - rect.top)  / rect.height) * SIZE,
    };
  };

  const hitTest = (local: Pt): number | null => {
    let best: number | null = null, bestD = 13;
    screenVerts.current.forEach((p, i) => {
      const d = Math.hypot(p.x - local.x, p.y - local.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  // ── Interaction ───────────────────────────────────────────────────────────
  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const c = clientOf(e);
    if (!c) return;
    const local = toLocal(c.x, c.y);
    const idx   = local ? hitTest(local) : null;
    drag.current   = idx !== null ? { mode: "vertex", idx } : { mode: "orbit", idx: -1 };
    lastMouse.current = c;
    if (idx !== null) { setHover(idx); setDraft(null); }
    e.preventDefault();
  }, []);

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    const d = drag.current;
    if (!d) return;
    const c = clientOf(e);
    if (!c) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? SIZE / rect.width : 1;
    const dx = (c.x - lastMouse.current.x) * scale;
    const dy = (c.y - lastMouse.current.y) * scale;
    lastMouse.current = c;

    if (d.mode === "orbit") {
      // Blender convention: drag right → object turns right, drag down → tilts up
      setRot(prev => ({ x: prev.x - dy * 0.009, y: prev.y - dx * 0.009 }));
      return;
    }

    // Move the vertex within the camera plane, keeping its depth constant.
    setVerts(prev => prev.map((v, i) => {
      if (i !== d.idx) return v;
      const { x: rx, y: ry } = rotRef.current;
      const z = toView(v[0], v[1], v[2], rx, ry).z;
      const s = scaleAt(z, zoomRef.current);
      const [wx, wy, wz] = viewDirToWorld(dx / s, -dy / s, 0, rx, ry);
      return [
        clampCoord(v[0] + wx),
        clampCoord(v[1] + wy),
        clampCoord(v[2] + wz),
      ] as Vec3;
    }));
  }, []);

  const onUp = useCallback(() => { drag.current = null; }, []);

  const onHover = useCallback((e: React.MouseEvent) => {
    if (drag.current) return;
    const local = toLocal(e.clientX, e.clientY);
    setHover(local ? hitTest(local) : null);
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.91 : 1.10;
    setZoom(prev => Math.max(0.3, Math.min(4.0, prev * factor)));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchend",  onUp);
    const c = canvasRef.current;
    if (c) c.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchend",  onUp);
      if (c) c.removeEventListener("wheel", onWheel);
    };
  }, [onMove, onUp, onWheel]);

  // ── Numeric editing ───────────────────────────────────────────────────────
  const setComponent = (vi: number, ci: 0 | 1 | 2, raw: string) => {
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
    setZoom(1);
    setRot({ x: 0.40, y: 0.70 });
    setDraft(null);
  };

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">NDC 3D — Interactive</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">drag vertices · orbit · scroll to zoom</span>
      </div>

      <div className="flex flex-col md:flex-row">

        <div className="flex-shrink-0 bg-[var(--code-bg)] flex items-center justify-center md:border-r border-[var(--border)] p-2">
          <canvas
            ref={canvasRef}
            width={SIZE} height={SIZE}
            style={{ width:"min(300px,90vw)", height:"auto", aspectRatio:"1", touchAction:"none" }}
            className={`select-none ${hover !== null ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
            onMouseDown={onDown}
            onTouchStart={onDown}
            onMouseMove={onHover}
            onMouseLeave={() => { if (!drag.current) setHover(null); }}
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
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {verts.map((v, i) => {
                const inBounds = v.every(c => Math.abs(c) <= 1.0001);
                const color = inBounds ? shape.color : "#ef4444";
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 font-mono text-[10px]"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[var(--text-muted)] w-5">v{i}</span>
                    {([0,1,2] as const).map(ci => (
                      <input
                        key={ci}
                        type="number"
                        step={0.05}
                        min={-1.8}
                        max={1.8}
                        value={draft?.key === `${i}-${ci}` ? draft.text : fmt(v[ci])}
                        onChange={e => setComponent(i, ci, e.target.value)}
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
            <pre className="text-[9.5px] font-mono bg-[var(--code-bg)] rounded-lg p-3 text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre">
              {code}
            </pre>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[9px] font-mono text-[var(--text-muted)]">zoom</span>
            <button onClick={() => setZoom(p => Math.max(0.3, p * 0.85))}
              className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
              −
            </button>
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-center">
              {zoom.toFixed(1)}×
            </span>
            <button onClick={() => setZoom(p => Math.min(4, p * 1.15))}
              className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
              +
            </button>
            <button onClick={reset}
              className="px-2 py-1 text-[9px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all">
              reset
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
