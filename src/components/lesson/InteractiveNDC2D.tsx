"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const SZ = 300;              // SVG viewBox size
const CX = SZ / 2;           // center x
const CY = SZ / 2;           // center y
const HALF = SZ * 0.39;      // half-size for NDC=1 at zoom=1  (px from center)

// ── Zoom-aware coordinate conversions ────────────────────────────────────────
// NDC (0,0) = SVG center. zoom=1 → NDC ±1 = ±HALF px from center.
function n2s(ndc: number, axis: "x"|"y", zoom: number): number {
  const h = HALF * zoom;
  return axis === "x" ? CX + ndc * h : CY - ndc * h;
}

function s2n(px: number, axis: "x"|"y", zoom: number): number {
  const h = HALF * zoom;
  return axis === "x" ? (px - CX) / h : -(px - CY) / h;
}

// ── Config ────────────────────────────────────────────────────────────────────
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7"];
const LABELS = ["v0","v1","v2","v3","v4"];
const DEFAULT: { x: number; y: number }[] = [
  { x:  0.00, y:  0.60 },
  { x: -0.55, y: -0.45 },
  { x:  0.55, y: -0.45 },
];
function fmt(n: number) { return n.toFixed(2); }

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveNDC2D() {
  const [verts,    setVerts]    = useState(DEFAULT.map(v => ({ ...v })));
  const [dragging, setDragging] = useState<number|null>(null);
  const [zoom,     setZoom]     = useState(1.0);
  const [copied,   setCopied]   = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Clamp to visible SVG area in NDC ─────────────────────────────────────
  const clampNdc = useCallback((v: number): number => {
    const limit = (SZ / 2 / (HALF * zoom)) * 0.97; // ~edge of canvas
    return Math.max(-limit, Math.min(limit, v));
  }, [zoom]);

  // ── SVG pointer → NDC ────────────────────────────────────────────────────
  const getSvgPt = (e: MouseEvent | TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width)  * SZ,
      y: ((cy - rect.top)  / rect.height) * SZ,
    };
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (dragging === null) return;
    const pt = getSvgPt(e);
    if (!pt) return;
    setVerts(prev => prev.map((v, i) =>
      i === dragging
        ? { x: clampNdc(s2n(pt.x, "x", zoom)), y: clampNdc(s2n(pt.y, "y", zoom)) }
        : v
    ));
  }, [dragging, zoom, clampNdc]);

  const onUp   = useCallback(() => setDragging(null), []);

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.91 : 1.10;
    setZoom(prev => Math.max(0.25, Math.min(5.0, prev * factor)));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    const svg = svgRef.current;
    if (svg) svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      if (svg) svg.removeEventListener("wheel", onWheel);
    };
  }, [onMove, onUp, onWheel]);

  // ── Copy code ─────────────────────────────────────────────────────────────
  const code = `float vertices[] = {\n${verts.map(v => `    ${fmt(v.x)}f, ${fmt(v.y)}f, 0.0f`).join(",\n")}\n};`;
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    });
  };

  // ── Derived SVG values ────────────────────────────────────────────────────
  const h    = HALF * zoom;                    // half-size in SVG px for NDC ±1
  const clipX = CX - h, clipY = CY - h;        // top-left of NDC ±1 rect

  const polygonPts = verts
    .map(v => `${n2s(v.x,"x",zoom)},${n2s(v.y,"y",zoom)}`)
    .join(" ");

  // CCW/CW from signed area (SVG Y flipped)
  const isCCW = verts.length >= 3 && (() => {
    const [a, b, c] = verts.map(v => ({ x: n2s(v.x,"x",zoom), y: n2s(v.y,"y",zoom) }));
    return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x) < 0;
  })();

  // Visible NDC range for axis labels
  const axisMax = parseFloat(fmt(SZ / 2 / h));

  // Grid lines in NDC: 0.5 steps but adapt to zoom
  const step = zoom < 0.6 ? 1 : zoom > 3 ? 0.1 : 0.5;
  const gridRange: number[] = [];
  for (let v = -Math.ceil(axisMax / step) * step; v <= axisMax; v += step) {
    gridRange.push(parseFloat(v.toFixed(4)));
  }

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          NDC 2D — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">drag vertices · scroll to zoom</span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── SVG Canvas ── */}
        <div className="flex-shrink-0 flex items-center justify-center bg-[var(--code-bg)] md:border-r border-[var(--border)] p-3 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SZ} ${SZ}`}
            style={{ width:"min(300px,90vw)", height:"auto", aspectRatio:"1", touchAction:"none", overflow:"visible" }}
            className="select-none"
          >
            {/* Grid lines */}
            {gridRange.map(v => {
              const sx = n2s(v, "x", zoom);
              const sy = n2s(v, "y", zoom);
              if (sx < 0 || sx > SZ || sy < 0 || sy > SZ) return null;
              const isZero = Math.abs(v) < 0.001;
              const isOne  = Math.abs(Math.abs(v) - 1) < 0.001;
              return (
                <g key={v}>
                  <line x1={sx} y1={0} x2={sx} y2={SZ}
                    stroke={isZero ? "rgba(255,255,255,0.18)" : isOne ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
                    strokeWidth={isZero ? 1 : 0.75} />
                  <line x1={0} y1={sy} x2={SZ} y2={sy}
                    stroke={isZero ? "rgba(255,255,255,0.18)" : isOne ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
                    strokeWidth={isZero ? 1 : 0.75} />
                </g>
              );
            })}

            {/* NDC ±1 boundary rect */}
            {h < SZ && (
              <rect
                x={clipX} y={clipY} width={h*2} height={h*2}
                fill="none"
                stroke="rgba(59,130,246,0.35)"
                strokeWidth="1.2"
                strokeDasharray="5 3"
              />
            )}

            {/* Axis numeric labels */}
            {[1, -1, 0.5, -0.5].map(v => {
              const sx = n2s(v, "x", zoom);
              const sy = n2s(v, "y", zoom);
              if (sx < 5 || sx > SZ-5) return null;
              if (sy < 8 || sy > SZ-2) return null;
              return (
                <g key={`lbl-${v}`}>
                  {sx > 0 && sx < SZ && (
                    <text x={sx} y={CY - 5} fill="rgba(255,255,255,0.28)" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      {v % 1 === 0 ? v : v.toFixed(1)}
                    </text>
                  )}
                  {sy > 8 && sy < SZ && Math.abs(v) > 0.01 && (
                    <text x={CX + 5} y={sy + 3} fill="rgba(255,255,255,0.28)" fontSize="7.5" fontFamily="monospace">
                      {v % 1 === 0 ? v : v.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axis labels X / Y */}
            <text x={SZ-8} y={CY-6} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" textAnchor="end">X</text>
            <text x={CX+5} y={10}   fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">Y</text>

            {/* Filled shape */}
            {verts.length >= 3 && (
              <polygon
                points={polygonPts}
                fill="rgba(59,130,246,0.12)"
                stroke="rgba(59,130,246,0.5)"
                strokeWidth="1.5"
              />
            )}

            {/* CCW / CW label */}
            {verts.length === 3 && (() => {
              const [a,b,c] = verts.map(v => ({ x:n2s(v.x,"x",zoom), y:n2s(v.y,"y",zoom) }));
              const mx = (a.x+b.x+c.x)/3, my = (a.y+b.y+c.y)/3;
              return (
                <text x={mx} y={my+4} fill={isCCW ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)"}
                  fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                  {isCCW ? "CCW ✓" : "CW ✗"}
                </text>
              );
            })()}

            {/* Vertex dots (draggable) */}
            {verts.map((v, i) => {
              const sx = n2s(v.x, "x", zoom);
              const sy = n2s(v.y, "y", zoom);
              const color = COLORS[i % COLORS.length];
              const inBounds = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r={14} fill="transparent"
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={e => { e.preventDefault(); setDragging(i); }}
                    onTouchStart={e => { e.preventDefault(); setDragging(i); }}
                  />
                  <circle cx={sx} cy={sy} r={10} fill={color} fillOpacity={0.12} />
                  <circle cx={sx} cy={sy} r={6}
                    fill={inBounds ? color : "#ef4444"}
                    fillOpacity={0.9}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1.5"
                    strokeDasharray={inBounds ? "none" : "3 2"}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={e => { e.preventDefault(); setDragging(i); }}
                    onTouchStart={e => { e.preventDefault(); setDragging(i); }}
                  />
                  <text x={sx+10} y={sy-6} fill={inBounds ? color : "#ef4444"}
                    fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {LABELS[i]}
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
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Vertex Coordinates (NDC)
            </p>
            <div className="space-y-1.5">
              {verts.map((v, i) => {
                const inBounds = Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
                return (
                  <div key={i} className="flex items-center gap-2.5 font-mono text-[11px]">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: inBounds ? COLORS[i%COLORS.length] : "#ef4444" }} />
                    <span className="text-[var(--text-muted)] w-5">{LABELS[i]}</span>
                    <span style={{ color: inBounds ? COLORS[i%COLORS.length] : "#ef4444" }}>
                      ({fmt(v.x)}, {fmt(v.y)}, 0.00)
                    </span>
                    {!inBounds && <span className="text-[9px] text-red-400 font-mono">clipped</span>}
                  </div>
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
            <pre className="text-[10px] font-mono bg-[var(--code-bg)] rounded-lg p-3 text-[#e6edf3] overflow-x-auto leading-relaxed whitespace-pre">
              {code}
            </pre>
          </div>

          {/* Zoom + vertex controls */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[var(--text-muted)]">zoom</span>
              <button onClick={() => setZoom(p => Math.max(0.25, p * 0.85))}
                className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
                −
              </button>
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-center">
                {zoom.toFixed(1)}×
              </span>
              <button onClick={() => setZoom(p => Math.min(5, p * 1.15))}
                className="w-6 h-6 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 font-bold flex items-center justify-center transition-all text-sm">
                +
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {verts.length < 5 && (
                <button
                  onClick={() => setVerts(prev => [
                    ...prev,
                    { x: (Math.random()-0.5)*1.2, y: (Math.random()-0.5)*1.2 }
                  ])}
                  className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all">
                  + vertex
                </button>
              )}
              {verts.length > 3 && (
                <button
                  onClick={() => setVerts(prev => prev.slice(0,-1))}
                  className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-red-500/40 hover:text-red-400 transition-all">
                  − remove
                </button>
              )}
              <button
                onClick={() => { setVerts(DEFAULT.map(v => ({...v}))); setZoom(1); }}
                className="px-3 py-1.5 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)] transition-all">
                reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
