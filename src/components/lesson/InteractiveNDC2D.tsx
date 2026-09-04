"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

// ── Constants ─────────────────────────────────────────────────────────────────
const SZ   = 300;            // SVG viewBox size
const CX   = SZ / 2;
const CY   = SZ / 2;
const HALF = SZ * 0.39;      // px from centre for NDC = 1 at zoom = 1

const MIN_VERTS = 3;
const MAX_VERTS = 12;
const LIMIT     = 2.0;       // how far outside the NDC box a vertex may go
const SNAP      = 0.05;      // Alt-drag snap increment
const FINE      = 0.22;      // Shift-drag movement multiplier
const HIT_R     = 15;        // vertex grab radius, in viewBox units

type Pt = { x: number; y: number };

// ── Coordinate conversions ───────────────────────────────────────────────────
// Screen (viewBox px) = centre + pan + ndc * h, with Y flipped.
const n2s = (ndc: number, axis: "x" | "y", zoom: number, pan: Pt): number => {
  const h = HALF * zoom;
  return axis === "x" ? CX + pan.x + ndc * h : CY + pan.y - ndc * h;
};

const s2n = (px: number, axis: "x" | "y", zoom: number, pan: Pt): number => {
  const h = HALF * zoom;
  return axis === "x" ? (px - CX - pan.x) / h : -(px - CY - pan.y) / h;
};

/**
 * Keeps the world point under the cursor fixed while the zoom changes.
 * From  q = C + pan + p*h  ⇒  pan' = (q - C)(1 - k) + pan*k,  where k = h'/h.
 * The Y flip cancels out, so the same expression works for both axes.
 */
const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - CX) * (1 - k) + pan.x * k,
  y: (cursor.y - CY) * (1 - k) + pan.y * k,
});

// ── Palettes ──────────────────────────────────────────────────────────────────
// The widget sits on --code-bg, which follows the theme, so the ink has to too.
const PALETTES = {
  dark: {
    gridZero: "rgba(255,255,255,0.18)",
    gridOne:  "rgba(255,255,255,0.12)",
    gridSub:  "rgba(255,255,255,0.04)",
    tick:     "rgba(255,255,255,0.28)",
    axis:     "rgba(255,255,255,0.40)",
    bounds:   "rgba(59,130,246,0.35)",
    fill:     "rgba(59,130,246,0.12)",
    stroke:   "rgba(59,130,246,0.50)",
    ring:     "rgba(255,255,255,0.50)",
    halo:     "rgba(255,255,255,0.85)",
  },
  light: {
    gridZero: "rgba(0,0,0,0.30)",
    gridOne:  "rgba(0,0,0,0.18)",
    gridSub:  "rgba(0,0,0,0.07)",
    tick:     "rgba(0,0,0,0.45)",
    axis:     "rgba(0,0,0,0.55)",
    bounds:   "rgba(37,99,235,0.45)",
    fill:     "rgba(37,99,235,0.14)",
    stroke:   "rgba(37,99,235,0.65)",
    ring:     "rgba(0,0,0,0.20)",
    halo:     "rgba(0,0,0,0.55)",
  },
} as const;

// ── Config ────────────────────────────────────────────────────────────────────
// The first five keep the original palette; beyond that, hues are spread by the
// golden angle so any number of vertices stays distinguishable.
const BASE_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"];
const colorFor = (i: number) =>
  i < BASE_COLORS.length ? BASE_COLORS[i] : `hsl(${(210 + i * 137.5) % 360}, 68%, 58%)`;

const DEFAULT: Pt[] = [
  { x:  0.00, y:  0.60 },
  { x: -0.55, y: -0.45 },
  { x:  0.55, y: -0.45 },
];

const fmt    = (n: number) => n.toFixed(2);
const clampN = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
const snapTo = (v: number) => Math.round(v / SNAP) * SNAP;

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveNDC2D() {
  const [verts,    setVerts]    = useState<Pt[]>(DEFAULT.map(v => ({ ...v })));
  const [zoom,     setZoom]     = useState(1.0);
  const [pan,      setPan]      = useState<Pt>({ x: 0, y: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [hover,    setHover]    = useState<number | null>(null);
  const [panning,  setPanning]  = useState(false);
  const [copied,   setCopied]   = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const C = PALETTES[theme];

  // Live copies so pointer handlers never close over stale view state. The
  // helper below writes them synchronously, so several pointer events inside a
  // single frame each see the previous one's result.
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
    const next = Math.max(0.25, Math.min(5, z * factor));
    const base = cursor ? zoomAbout(panRef.current, cursor, next / z) : panRef.current;
    commitView(next, {
      x: base.x + (extraPan?.x ?? 0),
      y: base.y + (extraPan?.y ?? 0),
    });
  }, [commitView]);

  // Active pointers, keyed by pointerId — this is what makes pinch possible.
  const pointers = useRef(new Map<number, Pt>());
  const pinch    = useRef<{ dist: number; mid: Pt } | null>(null);
  const drag     = useRef<{ mode: "vertex" | "pan"; idx: number; last: Pt } | null>(null);

  // ── Client coords → viewBox coords ──────────────────────────────────────
  const toLocal = useCallback((clientX: number, clientY: number): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: ((clientX - r.left) / r.width) * SZ, y: ((clientY - r.top) / r.height) * SZ };
  }, []);

  const hitTest = useCallback((p: Pt): number | null => {
    let best: number | null = null;
    let bestD = HIT_R;
    verts.forEach((v, i) => {
      const d = Math.hypot(n2s(v.x, "x", zoom, pan) - p.x, n2s(v.y, "y", zoom, pan) - p.y);
      if (d <= bestD) { bestD = d; best = i; }
    });
    return best;
  }, [verts, zoom, pan]);

  const pinchState = () => {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      mid:  { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const localScale = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return r && r.width ? SZ / r.width : 1;
  };

  // ── Pointer down ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // The right button used to grab vertices. It now does nothing.
    if (e.pointerType === "mouse" && e.button === 2) return;

    svgRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      drag.current  = null;          // a second finger cancels any in-flight drag
      setPanning(false);
      pinch.current = pinchState();
      return;
    }
    if (pointers.current.size > 2) return;

    const local = toLocal(e.clientX, e.clientY);
    if (!local) return;

    // Middle button pans. Only the left button (or a finger) grabs a vertex.
    const wantsPan = e.pointerType === "mouse" && e.button === 1;
    const idx = wantsPan ? null : hitTest(local);

    if (idx !== null) {
      drag.current = { mode: "vertex", idx, last: { x: e.clientX, y: e.clientY } };
      setSelected(idx);
    } else {
      drag.current = { mode: "pan", idx: -1, last: { x: e.clientX, y: e.clientY } };
      setPanning(true);
      if (!wantsPan) setSelected(null);
    }
    e.preventDefault();
  }, [toLocal, hitTest]);

  // ── Pointer move ─────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
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
      setHover(local ? hitTest(local) : null);
      return;
    }

    // Incremental deltas — this keeps the grab point under the cursor and lets
    // the fine-drag modifier be toggled mid-drag without the vertex jumping.
    const scale = localScale();
    const dx = (e.clientX - d.last.x) * scale;
    const dy = (e.clientY - d.last.y) * scale;
    d.last = { x: e.clientX, y: e.clientY };

    if (d.mode === "pan") {
      commitView(zoomRef.current, { x: panRef.current.x + dx, y: panRef.current.y + dy });
      return;
    }

    const h = HALF * zoomRef.current;
    const k = e.shiftKey ? FINE : 1;
    setVerts(prev => prev.map((v, i) => {
      if (i !== d.idx) return v;
      let nx = v.x + (dx / h) * k;
      let ny = v.y - (dy / h) * k;
      if (e.altKey) { nx = snapTo(nx); ny = snapTo(ny); }
      return { x: clampN(nx), y: clampN(ny) };
    }));
  }, [toLocal, hitTest, applyZoom, commitView]);

  // ── Pointer up / cancel ──────────────────────────────────────────────────
  const endPointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (svgRef.current?.hasPointerCapture?.(e.pointerId))
      svgRef.current.releasePointerCapture(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) { drag.current = null; setPanning(false); }
  }, []);

  // ── Wheel: zoom about the cursor ─────────────────────────────────────────
  const applyZoomRef = useRef(applyZoom); applyZoomRef.current = applyZoom;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cursor = {
        x: ((e.clientX - r.left) / r.width) * SZ,
        y: ((e.clientY - r.top) / r.height) * SZ,
      };
      applyZoomRef.current(e.deltaY > 0 ? 0.91 : 1.1, cursor);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  // ── Keyboard nudge for the selected vertex ───────────────────────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (selected === null) return;
    const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!arrows.includes(e.key)) return;
    e.preventDefault();
    const step = e.shiftKey ? 0.1 : 0.01;
    const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
    const dy = e.key === "ArrowUp"    ? step : e.key === "ArrowDown" ? -step : 0;
    setVerts(prev => prev.map((v, i) =>
      i === selected ? { x: clampN(v.x + dx), y: clampN(v.y + dy) } : v));
  }, [selected]);

  // ── Vertex list operations ───────────────────────────────────────────────
  /** Inserts on the longest edge, so the polygon stays sensible as it grows. */
  const addVertex = () => {
    setVerts(prev => {
      if (prev.length >= MAX_VERTS) return prev;
      let bestI = 0, bestLen = -1;
      for (let i = 0; i < prev.length; i++) {
        const a = prev[i], b = prev[(i + 1) % prev.length];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len > bestLen) { bestLen = len; bestI = i; }
      }
      const a = prev[bestI], b = prev[(bestI + 1) % prev.length];
      const next = [...prev];
      next.splice(bestI + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      return next;
    });
    setSelected(null);
  };

  const removeVertex = () => {
    setVerts(prev => {
      if (prev.length <= MIN_VERTS) return prev;
      const i = selected !== null && selected < prev.length ? selected : prev.length - 1;
      return prev.filter((_, j) => j !== i);
    });
    setSelected(null);
  };

  const reset = () => {
    setVerts(DEFAULT.map(v => ({ ...v })));
    commitView(1, { x: 0, y: 0 });
    setSelected(null);
  };

  // ── Generated code ───────────────────────────────────────────────────────
  const code = `float vertices[] = {\n${
    verts.map(v => `    ${fmt(v.x)}f, ${fmt(v.y)}f, 0.0f`).join(",\n")
  }\n};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  // ── Derived render values ────────────────────────────────────────────────
  const h    = HALF * zoom;
  const boxX = n2s(-1, "x", zoom, pan);
  const boxY = n2s( 1, "y", zoom, pan);
  const axisY = n2s(0, "y", zoom, pan);   // screen Y where the X axis lies
  const axisX = n2s(0, "x", zoom, pan);   // screen X where the Y axis lies

  const polygonPts = verts
    .map(v => `${n2s(v.x, "x", zoom, pan)},${n2s(v.y, "y", zoom, pan)}`)
    .join(" ");

  // Shoelace signed area — works for any vertex count, not just triangles.
  const signedArea = verts.reduce((sum, v, i) => {
    const w = verts[(i + 1) % verts.length];
    return sum + (v.x * w.y - w.x * v.y);
  }, 0) / 2;
  const isCCW = signedArea > 0;

  const centroid = {
    x: verts.reduce((s, v) => s + n2s(v.x, "x", zoom, pan), 0) / verts.length,
    y: verts.reduce((s, v) => s + n2s(v.y, "y", zoom, pan), 0) / verts.length,
  };

  // Grid lines, adapted to zoom and covering the panned viewport
  const step  = zoom < 0.6 ? 1 : zoom > 3 ? 0.1 : 0.5;
  const xFrom = s2n(0, "x", zoom, pan),  xTo = s2n(SZ, "x", zoom, pan);
  const yFrom = s2n(SZ, "y", zoom, pan), yTo = s2n(0, "y", zoom, pan);
  const gridX: number[] = [];
  const gridY: number[] = [];
  for (let v = Math.floor(xFrom / step) * step; v <= xTo + 1e-9; v += step)
    gridX.push(parseFloat(v.toFixed(4)));
  for (let v = Math.floor(yFrom / step) * step; v <= yTo + 1e-9; v += step)
    gridY.push(parseFloat(v.toFixed(4)));

  const gridStroke = (v: number) =>
    Math.abs(v) < 1e-6 ? C.gridZero : Math.abs(Math.abs(v) - 1) < 1e-6 ? C.gridOne : C.gridSub;

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          NDC 2D — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          drag vertices · pan · pinch or scroll to zoom
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── SVG canvas ── */}
        <div className="flex-shrink-0 flex items-center justify-center bg-[var(--code-bg)] md:border-r border-[var(--border)] p-3 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SZ} ${SZ}`}
            tabIndex={0}
            role="application"
            aria-label="Interactive NDC coordinate editor"
            style={{
              width: "min(340px, 88vw)", height: "auto", aspectRatio: "1",
              touchAction: "none", overflow: "hidden", outline: "none",
            }}
            className={`select-none rounded ${
              panning ? "cursor-grabbing" : hover !== null ? "cursor-grab" : "cursor-crosshair"
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={() => { if (!drag.current) setHover(null); }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
            onKeyDown={onKeyDown}
          >
            {/* Grid */}
            {gridX.map(v => {
              const sx = n2s(v, "x", zoom, pan);
              if (sx < 0 || sx > SZ) return null;
              return <line key={`x${v}`} x1={sx} y1={0} x2={sx} y2={SZ}
                stroke={gridStroke(v)} strokeWidth={Math.abs(v) < 1e-6 ? 1 : 0.75} />;
            })}
            {gridY.map(v => {
              const sy = n2s(v, "y", zoom, pan);
              if (sy < 0 || sy > SZ) return null;
              return <line key={`y${v}`} x1={0} y1={sy} x2={SZ} y2={sy}
                stroke={gridStroke(v)} strokeWidth={Math.abs(v) < 1e-6 ? 1 : 0.75} />;
            })}

            {/* NDC ±1 boundary */}
            <rect x={boxX} y={boxY} width={h * 2} height={h * 2}
              fill="none" stroke={C.bounds} strokeWidth="1.2" strokeDasharray="5 3" />

            {/* Axis tick labels */}
            {[1, -1, 0.5, -0.5].map(v => {
              const sx = n2s(v, "x", zoom, pan);
              const sy = n2s(v, "y", zoom, pan);
              return (
                <g key={`lbl-${v}`}>
                  {sx > 8 && sx < SZ - 8 && axisY > 12 && axisY < SZ && (
                    <text x={sx} y={axisY - 5} fill={C.tick} fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      {v % 1 === 0 ? v : v.toFixed(1)}
                    </text>
                  )}
                  {sy > 10 && sy < SZ - 2 && axisX > 0 && axisX < SZ - 16 && (
                    <text x={axisX + 5} y={sy + 3} fill={C.tick} fontSize="7.5" fontFamily="monospace">
                      {v % 1 === 0 ? v : v.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axis letters, pinned inside the viewport */}
            <text x={SZ - 8} y={Math.max(14, Math.min(SZ - 4, axisY - 6))}
              fill={C.axis} fontSize="9" fontFamily="monospace" textAnchor="end">X</text>
            <text x={Math.max(6, Math.min(SZ - 14, axisX + 5))} y={11}
              fill={C.axis} fontSize="9" fontFamily="monospace">Y</text>

            {/* Filled polygon */}
            {verts.length >= 3 && (
              <polygon points={polygonPts} fill={C.fill} stroke={C.stroke} strokeWidth="1.5" />
            )}

            {/* Winding indicator */}
            <text x={centroid.x} y={centroid.y + 4}
              fill={isCCW ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)"}
              fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              {isCCW ? "CCW ✓" : "CW ✗"}
            </text>

            {/* Vertices */}
            {verts.map((v, i) => {
              const sx = n2s(v.x, "x", zoom, pan);
              const sy = n2s(v.y, "y", zoom, pan);
              const color    = colorFor(i);
              const inBounds = Math.abs(v.x) <= 1.0001 && Math.abs(v.y) <= 1.0001;
              const isActive = selected === i || hover === i;
              return (
                <g key={i}>
                  {isActive && (
                    <circle cx={sx} cy={sy} r={12} fill="none" stroke={C.halo}
                      strokeWidth="1" strokeDasharray="2 2" opacity={0.7} />
                  )}
                  <circle cx={sx} cy={sy} r={10} fill={color} fillOpacity={isActive ? 0.22 : 0.12} />
                  <circle cx={sx} cy={sy} r={isActive ? 6.5 : 5.5}
                    fill={inBounds ? color : "#ef4444"}
                    fillOpacity={0.92}
                    stroke={C.ring}
                    strokeWidth="1.5"
                    strokeDasharray={inBounds ? "none" : "3 2"} />
                  <text x={sx + 10} y={sy - 7} fill={inBounds ? color : "#ef4444"}
                    fontSize="9" fontFamily="monospace" fontWeight="bold">
                    v{i}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── Info panel ── */}
        <div className="flex-1 p-5 space-y-4 min-w-0">

          {/* Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Vertex Coordinates (NDC)
              </p>
              <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">
                {verts.length}/{MAX_VERTS}
              </span>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {verts.map((v, i) => {
                const inBounds = Math.abs(v.x) <= 1.0001 && Math.abs(v.y) <= 1.0001;
                const color = inBounds ? colorFor(i) : "#ef4444";
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(selected === i ? null : i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className={`w-full flex items-center gap-2.5 font-mono text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                      selected === i ? "bg-[var(--primary-low)]" : "hover:bg-[var(--primary-low)]/50"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[var(--text-muted)] w-5 text-left">v{i}</span>
                    <span style={{ color }}>({fmt(v.x)}, {fmt(v.y)}, 0.00)</span>
                    {!inBounds && <span className="text-[9px] text-red-400 ml-auto">clipped</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Generated Code
              </p>
              <button onClick={handleCopy}
                className="text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors px-2 py-0.5 rounded border border-transparent hover:border-[var(--border)]">
                {copied ? "✓ copied" : "copy"}
              </button>
            </div>
            <pre className="text-[10px] font-mono bg-[var(--code-bg)] border border-[var(--code-border)] rounded-lg p-3 text-[var(--code-text)] overflow-auto leading-relaxed whitespace-pre max-h-40">
              {code}
            </pre>
          </div>

          {/* Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
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
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={addVertex} disabled={verts.length >= MAX_VERTS}
                className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-all enabled:hover:border-[var(--primary)]/40 enabled:hover:text-[var(--primary)] disabled:opacity-35 disabled:cursor-not-allowed">
                + vertex
              </button>
              <button onClick={removeVertex} disabled={verts.length <= MIN_VERTS}
                className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-all enabled:hover:border-red-500/40 enabled:hover:text-red-400 disabled:opacity-35 disabled:cursor-not-allowed">
                − {selected !== null ? `remove v${selected}` : "remove"}
              </button>
              <button onClick={reset}
                className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all">
                reset
              </button>
            </div>

            <p className="text-[9px] font-mono text-[var(--text-muted)] opacity-70 leading-relaxed">
              <span className="text-[var(--primary)]">shift</span> fine drag ·{" "}
              <span className="text-[var(--primary)]">alt</span> snap {SNAP} ·{" "}
              <span className="text-[var(--primary)]">arrows</span> nudge selected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
