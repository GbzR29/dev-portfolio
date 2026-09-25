// src/components/lesson/figures/basis/InteractiveBasis2D.tsx
"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useFigureSpeed, SpeedControl, scaledMs } from "@/components/lesson/kit/Stepper";

import {
  SZ, RANGE, LIMIT, HIT_R, SNAP, IDENTITY, PRESETS, SHAPE, COL_I, COL_J, COL_V,
  mul, det, inv, lerpM, ease, rotation, rotAngle, clampN, snapTo, fmt, toScreen, toWorld, zoomAbout,
  type Pt, type Mat, type Handle, type View,
} from "./basisScene";
import { Basis2dPlot } from "./Basis2dPlot";

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveBasis2D() {
  const { theme } = useTheme();

  // `target` is the matrix being edited; `shown` is what is drawn, and trails
  // the target during a preset animation.
  const [target,   setTarget]   = useState<Mat>(IDENTITY);
  const [shown,    setShown]    = useState<Mat>(IDENTITY);
  const [vec,      setVec]      = useState<Pt>({ x: 2, y: 1 });
  const [view,     setView]     = useState<View>({ zoom: 1, pan: { x: 0, y: 0 } });
  const [presetId, setPresetId] = useState<string | null>("identity");
  const [angle,    setAngle]    = useState(45);
  const [selected, setSelected] = useState<Handle | null>(null);
  const [hover,    setHover]    = useState<Handle | null>(null);
  const [panning,  setPanning]  = useState(false);
  const [show,     setShow]     = useState({ v: true, shape: true, area: true });
  const [draft,    setDraft]    = useState<{ key: string; text: string } | null>(null);

  const svgRef   = useRef<SVGSVGElement>(null);
  const shownRef = useRef(shown); shownRef.current = shown;
  const viewRef  = useRef(view);  viewRef.current  = view;
  const anim     = useRef<number | null>(null);
  const drag     = useRef<{ mode: "handle"; k: Handle } | { mode: "pan"; last: Pt } | null>(null);
  const pointers = useRef(new Map<number, Pt>());
  const pinch    = useRef<{ dist: number; mid: Pt } | null>(null);

  const [speed, setSpeed] = useFigureSpeed();
  const speedRef = useRef(speed); speedRef.current = speed;

  const S = toScreen(view);
  const W = toWorld(view);

  const stopAnim = () => {
    if (anim.current !== null) cancelAnimationFrame(anim.current);
    anim.current = null;
  };
  useEffect(() => stopAnim, []);

  /** Sets the matrix instantly (drag, typing). */
  const setNow = useCallback((m: Mat) => {
    stopAnim();
    setTarget(m);
    setShown(m);
  }, []);

  /** Animates from whatever is on screen to `to`. */
  const animateTo = useCallback((to: Mat, from: Mat = shownRef.current, ms = 900) => {
    stopAnim();
    setTarget(to);
    const a0 = rotAngle(from), a1 = rotAngle(to);
    let delta = a0 !== null && a1 !== null ? a1 - a0 : 0;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    const start = performance.now();
    const dur = scaledMs(ms, speedRef.current);
    const step = (now: number) => {
      const t = ease(Math.min(1, (now - start) / dur));
      if (a0 !== null && a1 !== null) {
        const r = a0 + delta * t;
        setShown({ a: Math.cos(r), b: -Math.sin(r), c: Math.sin(r), d: Math.cos(r) });
      } else {
        setShown(lerpM(from, to, t));
      }
      if (t < 1) anim.current = requestAnimationFrame(step);
      else { anim.current = null; setShown(to); }
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  const pickPreset = (p: typeof PRESETS[number]) => {
    setPresetId(p.id);
    setDraft(null);
    if (p.id === "rotate") { setAngle(45); animateTo(rotation(45)); }
    else animateTo(p.m);
  };

  // ── View (zoom / pan) ────────────────────────────────────────────────────
  const applyZoom = useCallback((factor: number, cursor: Pt | null, extraPan?: Pt) => {
    const v = viewRef.current;
    const zoom = Math.max(0.3, Math.min(4, v.zoom * factor));
    const base = cursor ? zoomAbout(v.pan, cursor, zoom / v.zoom) : v.pan;
    const next = { zoom, pan: { x: base.x + (extraPan?.x ?? 0), y: base.y + (extraPan?.y ?? 0) } };
    viewRef.current = next;
    setView(next);
  }, []);
  const applyZoomRef = useRef(applyZoom); applyZoomRef.current = applyZoom;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const cursor = { x: ((e.clientX - r.left) / r.width) * SZ, y: ((e.clientY - r.top) / r.height) * SZ };
      applyZoomRef.current(e.deltaY > 0 ? 0.9 : 1.11, cursor);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  /** Zooms out until î, ĵ, Mv and the F all fit, centred on the origin. */
  const fitView = () => {
    const m = shownRef.current;
    const pts = [{ x: m.a, y: m.c }, { x: m.b, y: m.d }, mul(m, vec), ...SHAPE.map(p => mul(m, p)), { x: 1, y: 1 }];
    const extent = Math.max(...pts.map(p => Math.max(Math.abs(p.x), Math.abs(p.y))));
    const zoom = Math.max(0.3, Math.min(2, (RANGE * 0.85) / Math.max(extent, 0.5)));
    const next = { zoom, pan: { x: 0, y: 0 } };
    viewRef.current = next;
    setView(next);
  };

  // ── Pointer handling ─────────────────────────────────────────────────────
  const toLocal = (clientX: number, clientY: number): Pt | null => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return { x: ((clientX - r.left) / r.width) * SZ, y: ((clientY - r.top) / r.height) * SZ };
  };
  const localScale = () => {
    const r = svgRef.current?.getBoundingClientRect();
    return r && r.width ? SZ / r.width : 1;
  };

  const handles = (m: Mat): Record<Handle, Pt> => ({
    i: { x: m.a, y: m.c },
    j: { x: m.b, y: m.d },
    v: mul(m, vec),
  });

  const hitTest = (p: Pt): Handle | null => {
    const h = handles(shown);
    let best: Handle | null = null, bestD = HIT_R;
    // v is listed first so î/ĵ win when they overlap it
    (["v", "i", "j"] as Handle[]).forEach(k => {
      if (k === "v" && !show.v) return;
      const s = S(h[k]);
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d <= bestD) { bestD = d; best = k; }
    });
    return best;
  };

  /** Moves a handle to world point w. */
  const moveHandle = (k: Handle, w: Pt, free: boolean) => {
    const q = (n: number) => clampN(free ? n : snapTo(n));
    const m = shownRef.current;
    setPresetId(null);
    setDraft(null);
    if (k === "i") setNow({ ...m, a: q(w.x), c: q(w.y) });
    else if (k === "j") setNow({ ...m, b: q(w.x), d: q(w.y) });
    else {
      // v is stored before the transform, so undo M to find it
      const mi = inv(m);
      if (!mi || Math.abs(det(m)) < 0.05) return;
      const pre = mul(mi, w);
      setVec({ x: q(pre.x), y: q(pre.y) });
    }
  };

  const pinchState = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType === "mouse" && e.button === 2) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) { drag.current = null; setPanning(false); pinch.current = pinchState(); return; }
    if (pointers.current.size > 2) return;

    const p = toLocal(e.clientX, e.clientY);
    if (!p) return;
    const wantsPan = e.pointerType === "mouse" && e.button === 1;
    const k = wantsPan ? null : hitTest(p);
    if (k) {
      drag.current = { mode: "handle", k };
      setSelected(k);
      stopAnim();
      setTarget(shownRef.current);
    } else {
      drag.current = { mode: "pan", last: { x: e.clientX, y: e.clientY } };
      setPanning(true);
      if (!wantsPan) setSelected(null);
    }
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const now = pinchState(), prev = pinch.current;
      pinch.current = now;
      if (!prev) return;
      const s = localScale();
      applyZoom(now.dist / prev.dist, toLocal(now.mid.x, now.mid.y),
        { x: (now.mid.x - prev.mid.x) * s, y: (now.mid.y - prev.mid.y) * s });
      return;
    }

    const p = toLocal(e.clientX, e.clientY);
    if (!p) return;
    const d = drag.current;
    if (!d) { setHover(hitTest(p)); return; }
    if (d.mode === "pan") {
      const s = localScale();
      const v = viewRef.current;
      const next = { zoom: v.zoom, pan: { x: v.pan.x + (e.clientX - d.last.x) * s, y: v.pan.y + (e.clientY - d.last.y) * s } };
      d.last = { x: e.clientX, y: e.clientY };
      viewRef.current = next;
      setView(next);
      return;
    }
    moveHandle(d.k, W(p), e.altKey);
  };

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (svgRef.current?.hasPointerCapture?.(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) { drag.current = null; setPanning(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    if (e.key === "Escape") { setSelected(null); return; }
    const step = e.shiftKey ? 0.5 : 0.1;
    const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
    const dy = e.key === "ArrowUp"    ? step : e.key === "ArrowDown" ? -step : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    const h = handles(shownRef.current)[selected];
    moveHandle(selected, { x: h.x + dx, y: h.y + dy }, false);
  };

  // ── Numeric editing ──────────────────────────────────────────────────────
  const setEntry = (key: keyof Mat, raw: string) => {
    setDraft({ key, text: raw });
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return;
    setPresetId(null);
    setNow({ ...shownRef.current, [key]: clampN(n) });
  };

  const setVecEntry = (key: "x" | "y", raw: string) => {
    setDraft({ key: `v${key}`, text: raw });
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return;
    setVec(v => ({ ...v, [key]: clampN(n) }));
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const m  = shown;
  const Mv = mul(m, vec);
  const D  = det(m);
  const collapsed = Math.abs(D) < 0.02;

  const inputCls = `w-14 bg-transparent border rounded px-1.5 py-0.5 text-right font-mono text-[11px]
    focus:outline-none transition-colors
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  const entry = (key: keyof Mat, color: string) => (
    <input
      type="number" step={0.1} min={-LIMIT} max={LIMIT}
      aria-label={`matrix ${key}`}
      value={draft?.key === key ? draft.text : fmt(target[key])}
      onChange={e => setEntry(key, e.target.value)}
      onFocus={() => setSelected(key === "a" || key === "c" ? "i" : "j")}
      onBlur={() => setDraft(null)}
      style={{ color, borderColor: `${color}55` }}
      className={inputCls}
    />
  );

  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
      active
        ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"
    }`;
  const smallBtn = "h-6 min-w-6 px-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 text-[10px] font-mono flex items-center justify-center transition-all";

  const hint = PRESETS.find(p => p.id === presetId)?.hint;

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Matrix = Basis Vectors — Interactive
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono text-right">
          drag î, ĵ or v · drag empty space to pan · scroll to zoom
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── Canvas ── */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 bg-[var(--code-bg)] md:border-r border-[var(--border)] p-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SZ} ${SZ}`}
            tabIndex={0}
            role="application"
            aria-label="Matrix as basis vectors"
            style={{ width: "min(400px, 88vw)", height: "auto", aspectRatio: "1", touchAction: "none", outline: "none" }}
            className={`select-none rounded ${panning ? "cursor-grabbing" : hover ? "cursor-grab" : "cursor-move"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={() => { if (!drag.current) setHover(null); }}
            onContextMenu={e => e.preventDefault()}
            onMouseDown={e => { if (e.button === 1) e.preventDefault(); }}
            onKeyDown={onKeyDown}
          >
            <Basis2dPlot shown={shown} vec={vec} view={view} show={show}
              hover={hover} selected={selected} theme={theme} />
          </svg>

          {/* View controls */}
          <div className="flex items-center gap-1.5">
            <button className={smallBtn} onClick={() => applyZoom(0.85, null)} aria-label="Zoom out">−</button>
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-center">{view.zoom.toFixed(1)}×</span>
            <button className={smallBtn} onClick={() => applyZoom(1.18, null)} aria-label="Zoom in">+</button>
            <button className={smallBtn} onClick={fitView}>fit</button>
            <button className={smallBtn} onClick={() => { const v = { zoom: 1, pan: { x: 0, y: 0 } }; viewRef.current = v; setView(v); }}>
              reset view
            </button>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="flex-1 p-5 space-y-4 min-w-0">

          {/* Presets */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Preset</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => pickPreset(p)} className={btn(presetId === p.id)}>
                  {p.label}
                </button>
              ))}
              <button onClick={() => animateTo(target, IDENTITY, 1200)} className={btn(false)}
                title="Replay the transform starting from the identity">
                ▶ replay
              </button>
            </div>
            {presetId === "rotate" && (
              <label className="flex items-center gap-2 mt-2.5">
                <span className="text-[9px] font-mono text-[var(--text-muted)] w-6">θ</span>
                <input type="range" min={-180} max={180} step={1} value={angle}
                  onChange={e => { const a = Number(e.target.value); setAngle(a); setNow(rotation(a)); }}
                  className="flex-1 accent-[var(--primary)]" />
                <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{angle}°</span>
              </label>
            )}
            {hint && <p className="mt-2 text-[11px] text-[var(--text-muted)] leading-relaxed">{hint}</p>}
            <div className="mt-2.5"><SpeedControl speed={speed} setSpeed={setSpeed} /></div>
          </div>

          {/* Matrix */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Matrix M — each column is a basis vector
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-stretch">
                <span className="w-1.5 border-l-2 border-y-2 border-[var(--text-muted)] rounded-l opacity-60" />
                <div className="grid grid-cols-2 gap-1.5 px-1.5 py-1">
                  {entry("a", COL_I)}{entry("b", COL_J)}
                  {entry("c", COL_I)}{entry("d", COL_J)}
                </div>
                <span className="w-1.5 border-r-2 border-y-2 border-[var(--text-muted)] rounded-r opacity-60" />
              </div>
              <div className="font-mono text-[10px] leading-5">
                <div><span style={{ color: COL_I }}>î</span> = ({fmt(target.a)}, {fmt(target.c)})</div>
                <div><span style={{ color: COL_J }}>ĵ</span> = ({fmt(target.b)}, {fmt(target.d)})</div>
              </div>
            </div>
          </div>

          {/* M · v */}
          {show.v && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                M · v = x·î + y·ĵ
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                <span style={{ color: COL_V }}>v</span> = (
                {(["x", "y"] as const).map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    <input
                      type="number" step={0.5} min={-LIMIT} max={LIMIT} aria-label={`v ${k}`}
                      value={draft?.key === `v${k}` ? draft.text : fmt(vec[k])}
                      onChange={e => setVecEntry(k, e.target.value)}
                      onFocus={() => setSelected("v")}
                      onBlur={() => setDraft(null)}
                      style={{ color: COL_V, borderColor: `${COL_V}55` }}
                      className={inputCls}
                    />
                    {i === 0 && ","}
                  </span>
                ))}
                )
              </div>
              <p className="mt-2 font-mono text-[10.5px] text-[var(--text-main)] leading-relaxed">
                {fmt(vec.x)}·<span style={{ color: COL_I }}>({fmt(m.a)}, {fmt(m.c)})</span>
                {" + "}
                {fmt(vec.y)}·<span style={{ color: COL_J }}>({fmt(m.b)}, {fmt(m.d)})</span>
                {" = "}
                <span style={{ color: COL_V }} className="font-bold">({fmt(Mv.x)}, {fmt(Mv.y)})</span>
              </p>
            </div>
          )}

          {/* Determinant */}
          <div className="font-mono text-[10.5px] leading-relaxed">
            <span className="text-[var(--text-muted)]">det(M) = ad − bc = </span>
            <span className="font-bold" style={{ color: collapsed || D < 0 ? COL_I : "var(--text-main)" }}>
              {fmt(D)}
            </span>
            <span className="text-[var(--text-muted)]">
              {collapsed ? " → collapsed, no inverse"
                : D < 0 ? ` → areas ×${fmt(Math.abs(D))}, mirrored`
                : ` → areas ×${fmt(D)}`}
            </span>
          </div>

          {/* GLM */}
          <pre className="text-[9.5px] font-mono bg-[var(--code-bg)] border border-[var(--code-border)] rounded-lg p-3 text-[var(--code-text)] overflow-auto leading-relaxed whitespace-pre">
{`// GLM is column-major: the constructor takes columns
glm::mat2 M(
    ${fmt(target.a)}f, ${fmt(target.c)}f,   // column 0 → î
    ${fmt(target.b)}f, ${fmt(target.d)}f    // column 1 → ĵ
);
glm::vec2 r = M * glm::vec2(${fmt(vec.x)}f, ${fmt(vec.y)}f);
// r = (${fmt(Mv.x)}, ${fmt(Mv.y)})`}
          </pre>

          {/* Toggles + help */}
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setShow(s => ({ ...s, v: !s.v }))} className={btn(show.v)}>vector v</button>
              <button onClick={() => setShow(s => ({ ...s, shape: !s.shape }))} className={btn(show.shape)}>shape F</button>
              <button onClick={() => setShow(s => ({ ...s, area: !s.area }))} className={btn(show.area)}>det area</button>
            </div>
            <p className="text-[9px] font-mono text-[var(--text-muted)] opacity-70 leading-relaxed">
              drags snap to {SNAP} · <span className="text-[var(--primary)]">alt</span> free ·{" "}
              <span className="text-[var(--primary)]">arrows</span> nudge selected ·{" "}
              <span className="text-[var(--primary)]">shift</span> bigger step · dashed arrows = where î and ĵ started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
