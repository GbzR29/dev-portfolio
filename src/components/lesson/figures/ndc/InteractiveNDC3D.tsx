// src/components/lesson/figures/ndc/InteractiveNDC3D.tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  SIZE, LIMIT, SNAP, FINE, HIT_R, AXIS_HIT, AXIS_COLOR, AXIS_DIR, SHAPES,
  toView, viewDirToWorld, scaleAt, viewToScreen, clampCoord, snapTo, distToSegment, zoomAbout, fmt,
  type Vec3, type Pt, type Axis,
} from "./ndc3dScene";
import { drawNdc3d } from "./ndc3dDraw";

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
    const dragAxis = drag.current?.mode === "axis" ? drag.current.axis : null;
    const out = drawNdc3d(canvas, ctx, { theme, rot, zoom, pan, shape, verts, selected, hover, dragAxis });
    screenVerts.current = out.screenVerts;
    gizmoArms.current   = out.gizmo;
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
            style={{ width: "min(400px, 88vw)", height: "auto", aspectRatio: "1", touchAction: "none" }}
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
