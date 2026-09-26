"use client";

// ── Figure kit ────────────────────────────────────────────────────────────────
// Shared building blocks for the Game Dev and Math tracks' interactive figures:
// the frame every figure sits in, buttons and sliders, a 2D plot mapping
// (world units ↔ SVG viewBox units), draggable handles and an animation loop.
// Neutral colours are theme variables so every figure reads in light and dark;
// accent colours are fixed hues that have enough contrast on both.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { FigureShell } from "./FigureShell";

export const C = {
  red: "#ef4444",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  green: "#22c55e",
  amber: "#f59e0b",
  purple: "#a855f7",
  pink: "#ec4899",
  teal: "#14b8a6",
  orange: "#f97316",
  fg: "var(--text-main)",
  muted: "var(--text-muted)",
  grid: "var(--code-line)",
  axis: "var(--code-gutter)",
  bg: "var(--code-bg)",
} as const;

export const f2 = (n: number, d = 2) => (Math.abs(n) < 0.5 * 10 ** -d ? 0 : n).toFixed(d);
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Frame ─────────────────────────────────────────────────────────────────────

export function Figure({ title, head, children, controls, note }: {
  title: string;
  /** Right side of the title bar: mode buttons and the like. */
  head?: ReactNode;
  /** The drawing area. */
  children: ReactNode;
  /** Sliders, buttons and readouts under the drawing. */
  controls?: ReactNode;
  /** What to look at, in prose. */
  note?: ReactNode;
}) {
  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
        {head && <div className="flex gap-1.5 flex-wrap">{head}</div>}
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)] select-none">{children}</div>
      {(controls || note) && (
        <div className="p-4 md:p-5 space-y-3">
          {controls}
          {note && <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{note}</p>}
        </div>
      )}
    </FigureShell>
  );
}

export function Btn({ active = false, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: ReactNode; title?: string;
}) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${active
        ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`}>
      {children}
    </button>
  );
}

/** A row of mutually exclusive buttons. */
export function Choice<T extends string>({ value, options, onChange }: {
  value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void;
}) {
  return <>{options.map(([k, label]) => <Btn key={k} active={value === k} onClick={() => onChange(k)}>{label}</Btn>)}</>;
}

export function Slider({ label, value, min, max, step = 0.01, onChange, fmt, width = "w-24" }: {
  label: ReactNode; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; fmt?: (v: number) => string; width?: string;
}) {
  return (
    <label className="flex items-center gap-2 min-w-0">
      <span className={`text-[10px] font-mono text-[var(--text-muted)] ${width} flex-shrink-0`}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--primary)]" />
      <span className="text-[10px] font-mono text-[var(--primary)] w-14 text-right flex-shrink-0">{fmt ? fmt(value) : f2(value)}</span>
    </label>
  );
}

/** Grid of sliders that collapses to one column on phones. */
export const Sliders = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">{children}</div>
);

export const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-1.5 flex-wrap items-center">{children}</div>
);

/** A small monospace value, e.g. "a·b = 3.20". */
export function Readout({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)]"
      style={{ color: color ?? "var(--text-main)" }}>{children}</span>
  );
}

// ── 2D plot mapping ───────────────────────────────────────────────────────────

export type View = { W: number; H: number; x0: number; x1: number; y0: number; y1: number };
export type Pt = { x: number; y: number };

/** World ↔ viewBox mapping for a plot with y up. */
export function plot(v: View) {
  const sx = v.W / (v.x1 - v.x0), sy = v.H / (v.y1 - v.y0);
  return {
    ...v,
    X: (x: number) => (x - v.x0) * sx,
    Y: (y: number) => v.H - (y - v.y0) * sy,
    /** viewBox → world */
    inv: (p: Pt): Pt => ({ x: p.x / sx + v.x0, y: (v.H - p.y) / sy + v.y0 }),
    sx, sy,
  };
}
export type Plot = ReturnType<typeof plot>;

/** Grid lines every `step` world units, axes through the origin, optional tick labels. */
export function Grid({ p, step = 1, labels = true, major }: { p: Plot; step?: number; labels?: boolean; major?: number }) {
  const xs: number[] = [], ys: number[] = [];
  for (let x = Math.ceil(p.x0 / step) * step; x <= p.x1 + 1e-9; x += step) xs.push(+x.toFixed(6));
  for (let y = Math.ceil(p.y0 / step) * step; y <= p.y1 + 1e-9; y += step) ys.push(+y.toFixed(6));
  const isMajor = (v: number) => major !== undefined && Math.abs(v / major - Math.round(v / major)) < 1e-6;
  return (
    <g pointerEvents="none">
      {xs.map(x => <line key={`x${x}`} x1={p.X(x)} x2={p.X(x)} y1={0} y2={p.H} stroke={C.grid} strokeWidth={isMajor(x) ? 1 : 0.6} />)}
      {ys.map(y => <line key={`y${y}`} y1={p.Y(y)} y2={p.Y(y)} x1={0} x2={p.W} stroke={C.grid} strokeWidth={isMajor(y) ? 1 : 0.6} />)}
      {p.x0 <= 0 && p.x1 >= 0 && <line x1={p.X(0)} x2={p.X(0)} y1={0} y2={p.H} stroke={C.axis} strokeWidth={1.2} />}
      {p.y0 <= 0 && p.y1 >= 0 && <line y1={p.Y(0)} y2={p.Y(0)} x1={0} x2={p.W} stroke={C.axis} strokeWidth={1.2} />}
      {labels && xs.filter(x => x !== 0 && (major === undefined || isMajor(x))).map(x =>
        <text key={`lx${x}`} x={p.X(x)} y={clamp(p.Y(0) + 11, 10, p.H - 3)} fontSize={8.5} fill={C.axis} textAnchor="middle" fontFamily="monospace">{+x.toFixed(3)}</text>)}
      {labels && ys.filter(y => y !== 0 && (major === undefined || isMajor(y))).map(y =>
        <text key={`ly${y}`} x={clamp(p.X(0) - 4, 16, p.W - 3)} y={p.Y(y) + 3} fontSize={8.5} fill={C.axis} textAnchor="end" fontFamily="monospace">{+y.toFixed(3)}</text>)}
    </g>
  );
}

/** "M x y L x y …" for a function sampled over [a, b], split where it leaves the plot. */
export function fnPath(p: Plot, f: (x: number) => number, a = p.x0, b = p.x1, n = 240) {
  let d = "", pen = false;
  const lim = (p.y1 - p.y0) * 4;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n, y = f(x);
    if (!Number.isFinite(y) || y > p.y1 + lim || y < p.y0 - lim) { pen = false; continue; }
    d += `${pen ? "L" : "M"}${p.X(x).toFixed(2)},${p.Y(y).toFixed(2)}`;
    pen = true;
  }
  return d;
}

// ── Dragging ──────────────────────────────────────────────────────────────────

/** Client coordinates → viewBox coordinates of an SVG. */
export function svgPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Pt {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.width, y: vb.y + ((e.clientY - r.top) / r.height) * vb.height };
}

/**
 * Pointer handling for draggable handles. `pick` gets the pointer in viewBox
 * units and returns the id of the handle under it (or null); `move` receives
 * that id and the new pointer position, in viewBox units, while dragging.
 */
export function useDrag<K>(pick: (p: Pt) => K | null, move: (id: K, p: Pt, start: { p0: Pt; p: Pt }) => void) {
  const ref = useRef<SVGSVGElement>(null);
  const active = useRef<{ id: K; p0: Pt } | null>(null);
  const [dragging, setDragging] = useState<K | null>(null);
  const pickRef = useRef(pick), moveRef = useRef(move);
  pickRef.current = pick; moveRef.current = move;

  const handlers = {
    onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => {
      if (!ref.current) return;
      const p = svgPoint(ref.current, e);
      const id = pickRef.current(p);
      if (id === null) return;
      e.preventDefault();
      ref.current.setPointerCapture(e.pointerId);
      active.current = { id, p0: p };
      setDragging(id);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => {
      if (!active.current || !ref.current) return;
      const p = svgPoint(ref.current, e);
      moveRef.current(active.current.id, p, { p0: active.current.p0, p });
    },
    onPointerUp: () => { active.current = null; setDragging(null); },
    onPointerCancel: () => { active.current = null; setDragging(null); },
    style: { touchAction: "none" as const },
  };
  return { ref, handlers, dragging };
}

/** Nearest of several points within `r` viewBox units, or null. */
export function nearest<K>(p: Pt, cands: [K, Pt][], r = 14): K | null {
  let best: K | null = null, bd = r;
  for (const [k, q] of cands) {
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

/** A draggable handle: a filled dot with a soft halo so it reads as grabbable. */
export function Handle({ x, y, color, r = 5.5, active = false }: { x: number; y: number; color: string; r?: number; active?: boolean }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r + 5} fill={color} opacity={active ? 0.3 : 0.14} />
      <circle cx={x} cy={y} r={r} fill={color} stroke="var(--code-bg)" strokeWidth={1.5} />
    </g>
  );
}

/** Plain text in a figure, monospace, theme colour by default. */
export function T({ x, y, children, color = C.muted, size = 9.5, anchor = "start", bold = false }: {
  x: number; y: number; children: ReactNode; color?: string; size?: number; anchor?: "start" | "middle" | "end"; bold?: boolean;
}) {
  return <text x={x} y={y} fill={color} fontSize={size} textAnchor={anchor} fontFamily="monospace" fontWeight={bold ? 700 : 400} pointerEvents="none">{children}</text>;
}

/** Arrow from a to b in viewBox units. */
export function Vec({ a, b, color, w = 2, head = 7, dash, opacity = 1 }: {
  a: Pt; b: Pt; color: string; w?: number; head?: number; dash?: string; opacity?: number;
}) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 0.5) return null;
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  const h = Math.min(head, len * 0.6);
  return (
    <g opacity={opacity} pointerEvents="none">
      <line x1={a.x} y1={a.y} x2={b.x - ux * h * 0.8} y2={b.y - uy * h * 0.8} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />
      <polygon fill={color} points={`${b.x},${b.y} ${b.x - ux * h - uy * h * 0.45},${b.y - uy * h + ux * h * 0.45} ${b.x - ux * h + uy * h * 0.45},${b.y - uy * h - ux * h * 0.45}`} />
    </g>
  );
}

// ── Animation ─────────────────────────────────────────────────────────────────

/**
 * Calls `tick(dt, time)` every animation frame while `on` is true and the
 * figure is on screen. dt is in seconds and capped at 0.1 s so a background
 * tab does not produce one enormous step when it comes back.
 */
export function useRaf(on: boolean, tick: (dt: number, time: number) => void) {
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const visible = useVisible();
  const ref = visible.ref;
  useEffect(() => {
    if (!on || !visible.on) return;
    let raf = 0, last = performance.now(), t = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now; t += dt;
      tickRef.current(dt, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on, visible.on]);
  return ref;
}

/** True while the element is (nearly) on screen. */
export function useVisible<E extends Element = HTMLDivElement>() {
  const ref = useRef<E>(null);
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}

/** Forces a re-render; handy when the simulation state lives in a ref. */
export function useRerender() {
  const [, set] = useState(0);
  return useCallback(() => set(n => (n + 1) & 0xffff), []);
}

// ── Randomness ────────────────────────────────────────────────────────────────

/** mulberry32: a tiny, good-enough seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer hash → [0, 1), stateless: the same inputs always give the same output. */
export function hash2(x: number, y: number, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
