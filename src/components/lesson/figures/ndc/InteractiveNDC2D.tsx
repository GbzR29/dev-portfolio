// src/components/lesson/figures/ndc/InteractiveNDC2D.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

import {
  SZ, HALF, MIN_VERTS, MAX_VERTS, LIMIT, SNAP, FINE, HIT_R, AXIS_HIT, GIZMO_IN, GIZMO_OUT,
  AXIS_COLOR, AXIS_NAME, AXIS_SCREEN, DEFAULT, n2s, zoomAbout, colorFor, fmt, clampN, snapTo, distToSegment,
  type Pt, type Axis,
} from "./ndc2dScene";
import { Ndc2dPlot } from "./Ndc2dPlot";

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveNDC2D() {
  const [verts,    setVerts]    = useState<Pt[]>(DEFAULT.map(v => ({ ...v })));
  const [zoom,     setZoom]     = useState(1.0);
  const [pan,      setPan]      = useState<Pt>({ x: 0, y: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [hover,    setHover]    = useState<{ vertex: number | null; axis: Axis | null }>(
    { vertex: null, axis: null });
  const [panning,  setPanning]  = useState(false);
  const [copied,   setCopied]   = useState(false);
  // Raw text of the field being typed into, so "-", "" and "0." survive editing.
  const [draft,    setDraft]    = useState<{ key: string; text: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

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
  const drag     = useRef<
    | { mode: "pan"; last: Pt }
    | { mode: "vertex"; idx: number; last: Pt }
    | { mode: "axis"; idx: number; axis: Axis; last: Pt }
    | null
  >(null);

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

  /** Gizmo arms of the selected vertex take priority over the vertex dots. */
  const pickAxis = useCallback((p: Pt): Axis | null => {
    if (selected === null || selected >= verts.length) return null;
    const o = {
      x: n2s(verts[selected].x, "x", zoom, pan),
      y: n2s(verts[selected].y, "y", zoom, pan),
    };
    let best: Axis | null = null;
    let bestD = AXIS_HIT;
    ([0, 1] as Axis[]).forEach(a => {
      const d = AXIS_SCREEN[a];
      const from = { x: o.x + d.x * GIZMO_IN,        y: o.y + d.y * GIZMO_IN };
      const to   = { x: o.x + d.x * (GIZMO_OUT + 6), y: o.y + d.y * (GIZMO_OUT + 6) };
      const dist = distToSegment(p, from, to);
      if (dist <= bestD) { bestD = dist; best = a; }
    });
    return best;
  }, [selected, verts, zoom, pan]);

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

    const last = { x: e.clientX, y: e.clientY };

    // Middle button pans. Only the left button (or a finger) grabs a vertex.
    const wantsPan = e.pointerType === "mouse" && e.button === 1;
    const axis = wantsPan ? null : pickAxis(local);

    if (axis !== null && selected !== null) {
      drag.current = { mode: "axis", idx: selected, axis, last };
      setDraft(null);
      e.preventDefault();
      return;
    }

    const idx = wantsPan ? null : hitTest(local);

    if (idx !== null) {
      drag.current = { mode: "vertex", idx, last };
      setSelected(idx);
      setDraft(null);
    } else {
      drag.current = { mode: "pan", last };
      setPanning(true);
      if (!wantsPan) setSelected(null);
    }
    e.preventDefault();
  }, [toLocal, hitTest, pickAxis, selected]);

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
      if (!local) { setHover({ vertex: null, axis: null }); return; }
      const axis = pickAxis(local);
      setHover({ vertex: axis === null ? hitTest(local) : null, axis });
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

    if (d.mode === "axis") {
      // Only the dragged component moves; the other one stays locked.
      setVerts(prev => prev.map((v, i) => {
        if (i !== d.idx) return v;
        if (d.axis === 0) {
          const nx = v.x + (dx / h) * k;
          return { ...v, x: clampN(e.altKey ? snapTo(nx) : nx) };
        }
        const ny = v.y - (dy / h) * k;
        return { ...v, y: clampN(e.altKey ? snapTo(ny) : ny) };
      }));
      return;
    }

    setVerts(prev => prev.map((v, i) => {
      if (i !== d.idx) return v;
      let nx = v.x + (dx / h) * k;
      let ny = v.y - (dy / h) * k;
      if (e.altKey) { nx = snapTo(nx); ny = snapTo(ny); }
      return { x: clampN(nx), y: clampN(ny) };
    }));
  }, [toLocal, hitTest, pickAxis, applyZoom, commitView]);

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

  // ── Keyboard: nudge, remove or deselect the selected vertex ─────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (selected === null) return;
    if (e.key === "Escape") { setSelected(null); return; }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      setVerts(prev => prev.length <= MIN_VERTS ? prev : prev.filter((_, j) => j !== selected));
      setSelected(null);
      return;
    }
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
    setDraft(null);
  };

  // ── Numeric editing ──────────────────────────────────────────────────────
  const setComponent = (vi: number, axis: Axis, raw: string) => {
    setDraft({ key: `${vi}-${axis}`, text: raw });
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return; // partial input like "-" or "" — keep the last value
    setVerts(prev => prev.map((v, i) =>
      i !== vi ? v : axis === 0 ? { ...v, x: clampN(n) } : { ...v, y: clampN(n) }));
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

  const dragAxis = drag.current?.mode === "axis" ? drag.current.axis : null;

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          NDC 2D — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          click a vertex for the gizmo · pinch or scroll to zoom
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
              width: "min(400px, 88vw)", height: "auto", aspectRatio: "1",
              touchAction: "none", overflow: "hidden", outline: "none",
            }}
            className={`select-none rounded ${
              panning ? "cursor-grabbing"
              : hover.axis !== null ? "cursor-pointer"
              : hover.vertex !== null ? "cursor-grab"
              : "cursor-crosshair"
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={() => { if (!drag.current) setHover({ vertex: null, axis: null }); }}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
            onKeyDown={onKeyDown}
          >
            <Ndc2dPlot verts={verts} zoom={zoom} pan={pan} selected={selected}
              hover={hover} dragAxis={dragAxis} theme={theme} />
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
                x · y · z &nbsp;·&nbsp; {verts.length}/{MAX_VERTS}
              </span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {verts.map((v, i) => {
                const inBounds = Math.abs(v.x) <= 1.0001 && Math.abs(v.y) <= 1.0001;
                const color = inBounds ? colorFor(i) : "#ef4444";
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
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-[var(--text-muted)] w-5 text-left">v{i}</span>
                    </button>
                    {([0, 1] as Axis[]).map(a => (
                      <input
                        key={a}
                        type="number"
                        step={0.05}
                        min={-LIMIT}
                        max={LIMIT}
                        aria-label={`v${i} ${AXIS_NAME[a]}`}
                        value={draft?.key === `${i}-${a}` ? draft.text : fmt(a === 0 ? v.x : v.y)}
                        onChange={e => setComponent(i, a, e.target.value)}
                        onFocus={() => setSelected(i)}
                        onBlur={() => setDraft(null)}
                        style={{ color }}
                        className="w-14 bg-transparent border border-[var(--border)] rounded px-1.5 py-0.5 text-right
                          focus:outline-none focus:border-[var(--primary)]/60 transition-colors
                          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                    <span className="w-8 text-right text-[var(--text-muted)] opacity-50" title="z is always 0 in 2D">
                      0.00
                    </span>
                    {!inBounds && <span className="text-[9px] text-red-400">clipped</span>}
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
              <span style={{ color: AXIS_COLOR[0] }}>X</span>{" "}
              <span style={{ color: AXIS_COLOR[1] }}>Y</span> gizmo arms constrain one axis ·{" "}
              <span className="text-[var(--primary)]">shift</span> fine ·{" "}
              <span className="text-[var(--primary)]">alt</span> snap {SNAP} ·{" "}
              <span className="text-[var(--primary)]">arrows</span> nudge ·{" "}
              <span className="text-[var(--primary)]">del</span> remove ·{" "}
              <span className="text-[var(--primary)]">esc</span> deselect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
