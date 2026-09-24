"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useFigureSpeed, SpeedControl, scaledMs } from "@/components/lesson/figures/Stepper";

// ── What this widget shows ────────────────────────────────────────────────────
// A 2×2 matrix is nothing more than "where î and ĵ land". Its first column is
// the new î, its second column is the new ĵ, and every other point follows:
// M·(x, y) = x·î + y·ĵ. Drag the basis vectors and the whole grid comes along.

const SZ    = 320;             // SVG viewBox size
const CTR   = SZ / 2;
const RANGE = 4;               // world units from the centre to the edge at zoom 1
const U     = SZ / (2 * RANGE);

const LIMIT    = 5;            // how far a handle may be dragged
const HIT_R    = 14;           // handle grab radius, in viewBox units
const SNAP     = 0.1;          // drags land on tenths unless Alt is held
const MAX_LINES = 160;         // cap for the transformed grid on extreme matrices
const NEAR_FLAT = 0.3;         // |det| below this gets the "almost flat" warning

type Pt     = { x: number; y: number };
type Mat    = { a: number; b: number; c: number; d: number };   // [a b; c d]
type Handle = "i" | "j" | "v";
type View   = { zoom: number; pan: Pt };

// ── Math ──────────────────────────────────────────────────────────────────────
const mul  = (m: Mat, p: Pt): Pt => ({ x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y });
const det  = (m: Mat) => m.a * m.d - m.b * m.c;
const inv  = (m: Mat): Mat | null => {
  const D = det(m);
  if (Math.abs(D) < 1e-6) return null;
  return { a: m.d / D, b: -m.b / D, c: -m.c / D, d: m.a / D };
};
const lerp  = (p: number, q: number, t: number) => p + (q - p) * t;
const lerpM = (p: Mat, q: Mat, t: number): Mat =>
  ({ a: lerp(p.a, q.a, t), b: lerp(p.b, q.b, t), c: lerp(p.c, q.c, t), d: lerp(p.d, q.d, t) });
const ease  = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const rotation = (deg: number): Mat => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r), s = Math.sin(r);
  return { a: c, b: -s, c: s, d: c };
};

/** A pure rotation animates by angle; lerping its entries would shrink it midway. */
const rotAngle = (m: Mat): number | null =>
  Math.abs(m.a - m.d) < 1e-6 && Math.abs(m.b + m.c) < 1e-6 && Math.abs(det(m) - 1) < 1e-3
    ? Math.atan2(m.c, m.a) : null;

const clampN = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
const snapTo = (v: number) => Math.round(v / SNAP) * SNAP;
const fmt    = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

// World ↔ screen (viewBox) for a given view. Y is flipped on screen.
const toScreen = (v: View) => (p: Pt): Pt =>
  ({ x: CTR + v.pan.x + p.x * U * v.zoom, y: CTR + v.pan.y - p.y * U * v.zoom });
const toWorld = (v: View) => (p: Pt): Pt =>
  ({ x: (p.x - CTR - v.pan.x) / (U * v.zoom), y: -(p.y - CTR - v.pan.y) / (U * v.zoom) });

/** Keeps the world point under the cursor fixed while zooming. */
const zoomAbout = (pan: Pt, cursor: Pt, k: number): Pt => ({
  x: (cursor.x - CTR) * (1 - k) + pan.x * k,
  y: (cursor.y - CTR) * (1 - k) + pan.y * k,
});

/** Grid spacing that keeps roughly 6–16 lines across the view. */
const gridStep = (zoom: number) => (zoom < 0.45 ? 2 : zoom > 2.2 ? 0.5 : 1);

const IDENTITY: Mat = { a: 1, b: 0, c: 0, d: 1 };

/**
 * Images of the lines x = k and y = k under m, covering the whole viewport.
 * The k range comes from pulling the viewport corners back through m⁻¹, so the
 * grid fills the canvas however much m stretches or shears it.
 */
function transformedGrid(m: Mat, view: View): { p: Pt; q: Pt; axis: boolean }[] {
  const W = toWorld(view);
  const corners = [W({ x: 0, y: 0 }), W({ x: SZ, y: 0 }), W({ x: 0, y: SZ }), W({ x: SZ, y: SZ })];
  const mi = inv(m);
  let lo = -8, hi = 8;
  if (mi) {
    const pre = corners.map(c => mul(mi, c));
    lo = Math.floor(Math.min(...pre.map(p => Math.min(p.x, p.y)))) - 1;
    hi = Math.ceil(Math.max(...pre.map(p => Math.max(p.x, p.y)))) + 1;
  }
  // Extreme shears need many lines; past the cap they would be sub-pixel anyway.
  if (hi - lo > MAX_LINES) { const mid = Math.round((hi + lo) / 2); lo = mid - MAX_LINES / 2; hi = mid + MAX_LINES / 2; }
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);

  const out: { p: Pt; q: Pt; axis: boolean }[] = [];
  for (let k = lo; k <= hi; k++) {
    out.push({ p: mul(m, { x: k, y: lo }), q: mul(m, { x: k, y: hi }), axis: k === 0 });
    out.push({ p: mul(m, { x: lo, y: k }), q: mul(m, { x: hi, y: k }), axis: k === 0 });
  }
  return out;
}

/** Visible values of the untransformed grid for one axis. */
function baseGridValues(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = Math.floor(from / step) * step; v <= to + 1e-9; v += step) out.push(parseFloat(v.toFixed(4)));
  return out;
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS: { id: string; label: string; m: Mat; hint: string }[] = [
  { id: "identity", label: "Identity", m: IDENTITY,
    hint: "î = (1,0), ĵ = (0,1). Nothing moves." },
  { id: "scale",    label: "Scale",    m: { a: 1.5, b: 0, c: 0, d: 0.75 },
    hint: "Only the diagonal changes: î is stretched, ĵ is squashed." },
  { id: "rotate",   label: "Rotate",   m: rotation(45),
    hint: "î and ĵ turn together and keep their length. det stays 1." },
  { id: "shear",    label: "Shear",    m: { a: 1, b: 1, c: 0, d: 1 },
    hint: "î stays put, ĵ leans over. Area is unchanged, det = 1." },
  { id: "reflect",  label: "Reflect",  m: { a: -1, b: 0, c: 0, d: 1 },
    hint: "î flips to the left. det < 0 means the space was mirrored — look at the F." },
  { id: "collapse", label: "det = 0",  m: { a: 1, b: 2, c: 0.5, d: 1 },
    hint: "î and ĵ point the same way. The plane collapses onto a line and cannot be undone." },
];

// ── The "F": asymmetric, so rotations and mirror images are obvious ──────────
const SHAPE: Pt[] = [
  { x: 0.5, y: 0.5 }, { x: 0.5, y: 2.3 }, { x: 1.7, y: 2.3 }, { x: 1.7, y: 1.95 },
  { x: 0.85, y: 1.95 }, { x: 0.85, y: 1.55 }, { x: 1.45, y: 1.55 }, { x: 1.45, y: 1.2 },
  { x: 0.85, y: 1.2 }, { x: 0.85, y: 0.5 },
];

// ── Palettes ──────────────────────────────────────────────────────────────────
const PALETTES = {
  dark: {
    gridBase: "rgba(255,255,255,0.05)",
    axisBase: "rgba(255,255,255,0.16)",
    grid:     "rgba(59,130,246,0.28)",
    gridAxis: "rgba(147,197,253,0.75)",
    shape:    "rgba(168,85,247,0.30)",
    shapeLn:  "rgba(192,132,252,0.90)",
    ghost:    "rgba(255,255,255,0.28)",
    detPos:   "rgba(250,204,21,0.14)",
    detNeg:   "rgba(239,68,68,0.20)",
    text:     "rgba(255,255,255,0.60)",
    chip:     "rgba(13,17,23,0.80)",
    ring:     "rgba(255,255,255,0.85)",
  },
  light: {
    gridBase: "rgba(0,0,0,0.06)",
    axisBase: "rgba(0,0,0,0.22)",
    grid:     "rgba(37,99,235,0.26)",
    gridAxis: "rgba(29,78,216,0.75)",
    shape:    "rgba(147,51,234,0.20)",
    shapeLn:  "rgba(126,34,206,0.85)",
    ghost:    "rgba(0,0,0,0.30)",
    detPos:   "rgba(202,138,4,0.16)",
    detNeg:   "rgba(220,38,38,0.16)",
    text:     "rgba(0,0,0,0.65)",
    chip:     "rgba(255,255,255,0.85)",
    ring:     "rgba(0,0,0,0.55)",
  },
} as const;

const COL_I = "#ef4444";
const COL_J = "#22c55e";
const COL_V = "#f59e0b";

// ── Small SVG helper ──────────────────────────────────────────────────────────
function Arrow({ from, to, S, color, width = 2.6, dash, opacity = 1 }: {
  from: Pt; to: Pt; S: (p: Pt) => Pt; color: string; width?: number; dash?: string; opacity?: number;
}) {
  const a = S(from), b = S(to);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 1) return null;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  const head = Math.min(9, len * 0.45);
  // Stop the shaft at the base of the head so the tip stays sharp
  const sx = b.x - ux * head * 0.8, sy = b.y - uy * head * 0.8;
  return (
    <g opacity={opacity}>
      <line x1={a.x} y1={a.y} x2={dash ? b.x : sx} y2={dash ? b.y : sy} stroke={color} strokeWidth={width}
        strokeLinecap="round" strokeDasharray={dash} />
      {!dash && (
        <polygon fill={color} points={[
          `${b.x},${b.y}`,
          `${b.x - ux * head - uy * head * 0.5},${b.y - uy * head + ux * head * 0.5}`,
          `${b.x - ux * head + uy * head * 0.5},${b.y - uy * head - ux * head * 0.5}`,
        ].join(" ")} />
      )}
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function InteractiveBasis2D() {
  const { theme } = useTheme();
  const P = PALETTES[theme];

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
  const iH = { x: m.a, y: m.c };
  const jH = { x: m.b, y: m.d };
  const Mv = mul(m, vec);
  const xi = { x: iH.x * vec.x, y: iH.y * vec.x };      // x·î
  const D  = det(m);
  const collapsed = Math.abs(D) < 0.02;
  const nearFlat  = !collapsed && Math.abs(D) < NEAR_FLAT;

  const gridLines = transformedGrid(m, view);
  const step = gridStep(view.zoom);
  const tl = W({ x: 0, y: 0 }), br = W({ x: SZ, y: SZ });
  const baseX = baseGridValues(tl.x, br.x, step);
  const baseY = baseGridValues(br.y, tl.y, step);

  const poly = (pts: Pt[]) => pts.map(p => { const s = S(p); return `${s.x},${s.y}`; }).join(" ");
  const unitSquare = [{ x: 0, y: 0 }, iH, { x: iH.x + jH.x, y: iH.y + jH.y }, jH];

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
  const statusText = collapsed ? "det = 0 · the plane collapsed onto a line"
    : nearFlat ? "î and ĵ almost parallel · space nearly flattened" : null;

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
            {/* Original grid, for reference */}
            {baseX.map(v => {
              const s = S({ x: v, y: 0 });
              return <line key={`bx${v}`} x1={s.x} y1={0} x2={s.x} y2={SZ}
                stroke={Math.abs(v) < 1e-6 ? P.axisBase : P.gridBase} strokeWidth="1" />;
            })}
            {baseY.map(v => {
              const s = S({ x: 0, y: v });
              return <line key={`by${v}`} x1={0} y1={s.y} x2={SZ} y2={s.y}
                stroke={Math.abs(v) < 1e-6 ? P.axisBase : P.gridBase} strokeWidth="1" />;
            })}

            {/* Transformed grid */}
            {gridLines.map((l, i) => {
              const a = S(l.p), b = S(l.q);
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={l.axis ? P.gridAxis : P.grid} strokeWidth={l.axis ? 1.5 : 0.9} />;
            })}

            {/* det: the unit square after the transform */}
            {show.area && !collapsed && (
              <polygon points={poly(unitSquare)} fill={D > 0 ? P.detPos : P.detNeg}
                stroke={D > 0 ? P.detPos : P.detNeg} strokeWidth="1" />
            )}

            {/* The F: ghost before, solid after */}
            {show.shape && (
              <>
                <polygon points={poly(SHAPE)} fill="none" stroke={P.ghost} strokeWidth="1" strokeDasharray="3 3" />
                <polygon points={poly(SHAPE.map(p => mul(m, p)))} fill={P.shape} stroke={P.shapeLn}
                  strokeWidth="1.4" strokeLinejoin="round" />
              </>
            )}

            {/* Where î and ĵ started */}
            <Arrow from={{ x: 0, y: 0 }} to={{ x: 1, y: 0 }} S={S} color={COL_I} width={1.4} dash="3 3" opacity={0.55} />
            <Arrow from={{ x: 0, y: 0 }} to={{ x: 0, y: 1 }} S={S} color={COL_J} width={1.4} dash="3 3" opacity={0.55} />

            {/* v = x·î + y·ĵ, drawn as the two legs of the path */}
            {show.v && (
              <>
                <Arrow from={{ x: 0, y: 0 }} to={xi} S={S} color={COL_I} width={1.6} dash="4 3" />
                <Arrow from={xi} to={Mv} S={S} color={COL_J} width={1.6} dash="4 3" />
                <Arrow from={{ x: 0, y: 0 }} to={Mv} S={S} color={COL_V} width={2.4} />
              </>
            )}

            {/* Basis vectors */}
            <Arrow from={{ x: 0, y: 0 }} to={jH} S={S} color={COL_J} width={3} />
            <Arrow from={{ x: 0, y: 0 }} to={iH} S={S} color={COL_I} width={3} />

            {/* Handles */}
            {(["i", "j", "v"] as Handle[]).map(k => {
              if (k === "v" && !show.v) return null;
              const w = k === "i" ? iH : k === "j" ? jH : Mv;
              const s = S(w);
              const color = k === "i" ? COL_I : k === "j" ? COL_J : COL_V;
              const active = hover === k || selected === k;
              const label = k === "i" ? "î" : k === "j" ? "ĵ" : "Mv";
              // Push the label away from the origin so it never sits on the arrow
              const len = Math.hypot(w.x, w.y) || 1;
              const lx = s.x + (w.x / len) * 13, ly = s.y - (w.y / len) * 13;
              return (
                <g key={k}>
                  {active && <circle cx={s.x} cy={s.y} r={10} fill="none" stroke={P.ring}
                    strokeWidth="1" strokeDasharray="2 2" />}
                  <circle cx={s.x} cy={s.y} r={active ? 5.5 : 4.5} fill={color} stroke={P.ring} strokeWidth="1.2" />
                  <text x={lx} y={ly + 3.5} fill={color} fontSize="11" fontFamily="monospace"
                    fontWeight="bold" textAnchor="middle">{label}</text>
                </g>
              );
            })}

            {/* det chip, pinned to the corner so it never covers the arrows */}
            {show.area && (
              <g>
                <rect x={6} y={6} width={74} height={17} rx={4} fill={P.chip} />
                <text x={12} y={18} fill={D < 0 || collapsed ? COL_I : P.text} fontSize="9.5"
                  fontFamily="monospace" fontWeight="bold">
                  det = {fmt(D)}
                </text>
              </g>
            )}

            {statusText && (
              <g>
                <rect x={CTR - 128} y={SZ - 24} width={256} height={17} rx={4} fill={P.chip} />
                <text x={CTR} y={SZ - 12} fill={COL_I} fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {statusText}
                </text>
              </g>
            )}
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
