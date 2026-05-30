"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ── Projection ────────────────────────────────────────────────────────────────
// z2 convention: smaller (negative) = closer to camera, larger (positive) = farther

function project(
  vx: number, vy: number, vz: number,
  rotX: number, rotY: number,
  W: number, H: number,
  zoom: number
) {
  // Rotate Y
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const x1 =  vx * cy + vz * sy;
  const z1 = -vx * sy + vz * cy;
  // Rotate X
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const y2 = vy * cx - z1 * sx;
  const z2 = vy * sx + z1 * cx;
  // Perspective — larger z2 → farther → smaller on screen
  const d   = 5;
  const fov = d / (d + z2 + 2);
  const sz  = Math.min(W, H) * 0.26 * zoom;
  return { x: W / 2 + x1 * fov * sz, y: H / 2 - y2 * fov * sz, z: z2 };
}

// Normalize z2 → t ∈ [0,1] where 0 = closest, 1 = farthest
function dt(z: number) { return Math.max(0, Math.min(1, (z + 1.9) / 3.8)); }

// ── Geometry ──────────────────────────────────────────────────────────────────

const CUBE_V: [number,number,number][] = [
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
  verts: [number,number,number][];
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

// ── Hex color → rgb parts ─────────────────────────────────────────────────────
function hexRgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InteractiveNDC3D() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [rot, setRot]         = useState({ x: 0.40, y: 0.70 });
  const [shapeIdx, setShapeIdx] = useState(2);
  const [zoom, setZoom]       = useState(1.0);
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });

  // ── Render ───────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const dark = document.documentElement.classList.contains("dark");

    const proj = (x: number, y: number, z: number) =>
      project(x, y, z, rot.x, rot.y, W, H, zoom);

    // ── Infinite-looking reference grid at y = -1.2 (below NDC cube) ────
    const GRID_FAR  = 7;    // extends ±7 NDC units from origin
    const GRID_STEP = 0.5;  // half-unit grid cells
    const GRID_Y    = -1.2; // slightly below the NDC cube bottom face

    type GSeg = { a: { x: number; y: number; z: number }; b: { x: number; y: number; z: number }; alpha: number; lw: number; depth: number };
    const gridSegs: GSeg[] = [];

    const pushSeg = (x0: number, z0: number, x1: number, z1: number) => {
      // Radial fade: uses distance of LINE CENTER from world origin on the XZ plane
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const dist = Math.sqrt(cx * cx + cz * cz) / GRID_FAR;
      const fade = Math.max(0, 1 - dist * dist); // quadratic → sharp at center, gentle at edge

      // Distinguish axis, unit, and sub-unit lines
      const isXAxis = Math.abs(z0) < 0.01 && Math.abs(z1) < 0.01;
      const isZAxis = Math.abs(x0) < 0.01 && Math.abs(x1) < 0.01;
      const isUnitX = !isZAxis && Math.abs(x0 - Math.round(x0)) < 0.01;
      const isUnitZ = !isXAxis && Math.abs(z0 - Math.round(z0)) < 0.01;
      const isAxis  = isXAxis || isZAxis;
      const isUnit  = isUnitX || isUnitZ;

      const baseAlpha = isAxis ? 0.55 : isUnit ? 0.22 : 0.09;
      const alpha = baseAlpha * fade;
      const lw    = isAxis ? 1.2 : 0.5;

      if (alpha < 0.005) return;
      const a = proj(x0, GRID_Y, z0), b = proj(x1, GRID_Y, z1);
      gridSegs.push({ a, b, alpha, lw, depth: (a.z + b.z) / 2 });
    };

    // Lines along Z (fixed X values)
    for (let x = -GRID_FAR; x <= GRID_FAR + 0.001; x += GRID_STEP) {
      pushSeg(x, -GRID_FAR, x, GRID_FAR);
    }
    // Lines along X (fixed Z values)
    for (let z = -GRID_FAR; z <= GRID_FAR + 0.001; z += GRID_STEP) {
      pushSeg(-GRID_FAR, z, GRID_FAR, z);
    }

    // Painter's: farthest first
    gridSegs.sort((a, b) => b.depth - a.depth).forEach(({ a, b, alpha, lw }) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = dark
        ? `rgba(160,170,220,${alpha})`
        : `rgba(60,60,180,${alpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    });

    // ── NDC cube ─────────────────────────────────────────────────────────
    const cubeP = CUBE_V.map(([x,y,z]) => proj(x,y,z));

    // Painter's algorithm: sort faces farthest-first (largest z2 first → draw first → overdrawn by closer)
    const facesSorted = CUBE_FACES
      .map(f => ({ f, depth: f.reduce((s,i) => s + cubeP[i].z, 0) / f.length }))
      .sort((a, b) => b.depth - a.depth);

    // Draw faces with very faint fill (glass-box depth cue)
    facesSorted.forEach(({ f, depth }) => {
      const t = dt(depth);
      // Far faces slightly lighter fill, close faces lighter (both very faint)
      const alpha = dark ? 0.04 + (1 - t) * 0.06 : 0.03 + (1 - t) * 0.04;
      ctx.beginPath();
      ctx.moveTo(cubeP[f[0]].x, cubeP[f[0]].y);
      f.slice(1).forEach(i => ctx.lineTo(cubeP[i].x, cubeP[i].y));
      ctx.closePath();
      ctx.fillStyle = dark ? `rgba(59,130,246,${alpha})` : `rgba(37,99,235,${alpha})`;
      ctx.fill();
    });

    // Draw edges: back edges dashed + faint, front edges solid + opaque
    const edgesSorted = CUBE_E
      .map(([a, b]) => ({ a, b, depth: (cubeP[a].z + cubeP[b].z) / 2 }))
      .sort((x, y) => y.depth - x.depth); // farthest first

    edgesSorted.forEach(({ a, b, depth }) => {
      const t = dt(depth);
      // t=0 (close): alpha~0.65, lineWidth=2, solid
      // t=1 (far):   alpha~0.07, lineWidth=0.6, dashed
      const alpha = dark
        ? 0.07 + (1 - t) * 0.58
        : 0.10 + (1 - t) * 0.52;
      ctx.beginPath();
      ctx.moveTo(cubeP[a].x, cubeP[a].y);
      ctx.lineTo(cubeP[b].x, cubeP[b].y);
      ctx.strokeStyle = dark ? `rgba(59,130,246,${alpha})` : `rgba(37,99,235,${alpha})`;
      ctx.lineWidth   = t < 0.4 ? 1.8 : 0.8;
      ctx.setLineDash(t > 0.55 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Cube corner dots (depth-based opacity)
    cubeP.forEach(p => {
      const t = dt(p.z);
      const alpha = dark ? 0.1 + (1-t)*0.6 : 0.15 + (1-t)*0.55;
      ctx.beginPath();
      ctx.arc(p.x, p.y, t < 0.4 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `rgba(59,130,246,${alpha})` : `rgba(37,99,235,${alpha})`;
      ctx.fill();
    });

    // ── Axes ─────────────────────────────────────────────────────────────
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
    const shape = SHAPES[shapeIdx];
    const { r, g, b } = hexRgb(shape.color);
    const shapeP = shape.verts.map(([x,y,z]) => proj(x,y,z));

    // Faces: farthest first (painter's algorithm)
    const shapeFacesSorted = shape.faces
      .map(f => ({ f, depth: f.reduce((s,i) => s + shapeP[i].z, 0) / f.length }))
      .sort((a, b) => b.depth - a.depth);

    shapeFacesSorted.forEach(({ f, depth }) => {
      const t = dt(depth);
      const fillAlpha  = 0.20 + (1-t) * 0.18;
      const strokeAlpha= 0.55 + (1-t) * 0.35;
      const pts = f.map(i => shapeP[i]);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle   = `rgba(${r},${g},${b},${fillAlpha})`;
      ctx.strokeStyle = `rgba(${r},${g},${b},${strokeAlpha})`;
      ctx.lineWidth   = 1.6;
      ctx.fill();
      ctx.stroke();
    });

    // Vertex dots + labels
    shapeP.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle   = shape.color;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = shape.color;
      ctx.font      = "bold 9px monospace";
      ctx.fillText(`v${i}`, p.x + 7, p.y - 2);
    });

    // ── Legend ────────────────────────────────────────────────────────────
    const tc = dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.30)";
    ctx.fillStyle = tc;
    ctx.font      = "9px monospace";
    ctx.fillText("NDC cube  [-1, 1]³", 8, 15);
    ctx.fillText(`zoom ${zoom.toFixed(1)}×  ·  drag  ·  scroll`, 8, H - 7);

  }, [rot, shapeIdx, zoom]);

  useEffect(() => { draw(); }, [draw]);

  // ── Interaction ───────────────────────────────────────────────────────────
  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const cl = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ct = "touches" in e ? e.touches[0].clientY : e.clientY;
    lastMouse.current = { x: cl, y: ct };
    e.preventDefault();
  }, []);

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    const cl = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ct = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = cl - lastMouse.current.x;
    const dy = ct - lastMouse.current.y;
    lastMouse.current = { x: cl, y: ct };
    // Blender convention: drag right→object turns right, drag down→object tilts up
    setRot(prev => ({ x: prev.x - dy * 0.009, y: prev.y - dx * 0.009 }));
  }, []);

  const onUp   = useCallback(() => { isDragging.current = false; }, []);

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

  const shape = SHAPES[shapeIdx];

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">NDC 3D — Interactive</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">drag · scroll to zoom</span>
      </div>

      <div className="flex flex-col md:flex-row">

        <div className="flex-shrink-0 bg-[var(--code-bg)] flex items-center justify-center md:border-r border-[var(--border)] p-2">
          <canvas
            ref={canvasRef}
            width={300} height={300}
            style={{ width:"min(300px,90vw)", height:"auto", aspectRatio:"1", touchAction:"none" }}
            className="cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onDown}
            onTouchStart={onDown}
          />
        </div>

        <div className="flex-1 p-5 space-y-4 min-w-0">

          {/* Shape selector */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2.5">Shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map((s, i) => (
                <button key={s.label} onClick={() => setShapeIdx(i)}
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

          {/* Vertices */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              {shape.label} Vertices
            </p>
            <div className="space-y-1">
              {shape.verts.map(([x,y,z], i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: shape.color }} />
                  <span className="text-[var(--text-muted)] w-5">v{i}</span>
                  <span style={{ color: shape.color }}>
                    ({x.toFixed(2)}f,&nbsp;{y.toFixed(2)}f,&nbsp;{z.toFixed(2)}f)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* C++ snippet */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">In C++</p>
            <pre className="text-[9.5px] font-mono bg-[var(--code-bg)] rounded-lg p-3 text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre">
{`float vertices[] = {\n${
  shape.verts.map(([x,y,z]) =>
    `    ${x.toFixed(2)}f, ${y.toFixed(2)}f, ${z.toFixed(2)}f`
  ).join(",\n")
}\n};`}
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
            <button onClick={() => { setZoom(1); setRot({ x: 0.40, y: 0.70 }); }}
              className="px-2 py-1 text-[9px] font-mono rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all">
              reset
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
