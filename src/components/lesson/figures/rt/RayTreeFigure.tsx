"use client";

import { useMemo, useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";

// ── What this figure shows ────────────────────────────────────────────────────
// Whitted's recursion in 2D. One ray leaves the eye; every hit asks the light
// (shadow ray), and mirror/glass hits spawn reflected and refracted rays. The
// tree is traced exactly (circles and a floor line) and listed beside it.

type V = { x: number; y: number };
type Circle = { c: V; r: number; mat: "matte" | "mirror" | "glass"; colour: string };
type Seg = { a: V; b: V; kind: "primary" | "reflect" | "refract" | "shadow" | "blocked" | "miss"; depth: number };

const W = 520, H = 300, FLOOR = 262;
const CIRCLES: Circle[] = [
  { c: { x: 300, y: 190 }, r: 46, mat: "glass", colour: "#7dd3fc" },
  { c: { x: 420, y: 120 }, r: 38, mat: "mirror", colour: "#cbd5e1" },
  { c: { x: 180, y: 110 }, r: 30, mat: "matte", colour: "#f87171" },
];
const LIGHT: V = { x: 470, y: 30 };
const add = (a: V, b: V) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V, b: V) => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: V, k: number) => ({ x: a.x * k, y: a.y * k });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const nrm = (a: V) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; };

function hit(o: V, d: V): { t: number; n: V; obj: Circle | "floor" } | null {
  let best: { t: number; n: V; obj: Circle | "floor" } | null = null;
  if (d.y > 1e-6) {
    const t = (FLOOR - o.y) / d.y;
    if (t > 1e-3) best = { t, n: { x: 0, y: -1 }, obj: "floor" };
  }
  for (const c of CIRCLES) {
    const oc = sub(o, c.c), b = dot(oc, d), cc = dot(oc, oc) - c.r * c.r, h = b * b - cc;
    if (h < 0) continue;
    let t = -b - Math.sqrt(h);
    if (t < 1e-3) t = -b + Math.sqrt(h);
    if (t > 1e-3 && (!best || t < best.t)) best = { t, n: nrm(sub(add(o, mul(d, t)), c.c)), obj: c };
  }
  return best;
}
function refract(d: V, n: V, eta: number): V | null {
  const ci = -dot(n, d), k = 1 - eta * eta * (1 - ci * ci);
  return k < 0 ? null : add(mul(d, eta), mul(n, eta * ci - Math.sqrt(k)));
}

function traceTree(eye: V, dir: V, maxDepth: number, ior: number) {
  const segs: Seg[] = [];
  const log: string[] = [];
  const go = (o: V, d: V, depth: number, kind: Seg["kind"], weight: number) => {
    const h = hit(o, d);
    const pad = "  ".repeat(depth);
    if (!h) { segs.push({ a: o, b: add(o, mul(d, 700)), kind: kind === "primary" ? "primary" : kind, depth }); log.push(`${pad}${kind} → sky (w ${weight.toFixed(2)})`); return; }
    const p = add(o, mul(d, h.t));
    segs.push({ a: o, b: p, kind, depth });
    const name = h.obj === "floor" ? "floor" : h.obj.mat;
    log.push(`${pad}${kind} → ${name} (w ${weight.toFixed(2)})`);
    // shadow ray: is the light visible from here?
    const toL = sub(LIGHT, p), dist = Math.hypot(toL.x, toL.y), Ld = mul(toL, 1 / dist);
    const s = hit(add(p, mul(h.n, 0.5)), Ld);
    const blocked = !!s && s.t < dist;
    segs.push({ a: p, b: blocked ? add(p, mul(Ld, s!.t)) : LIGHT, kind: blocked ? "blocked" : "shadow", depth });
    if (depth >= maxDepth || h.obj === "floor") return;
    if (h.obj.mat === "mirror") go(add(p, mul(h.n, 0.5)), sub(d, mul(h.n, 2 * dot(d, h.n))), depth + 1, "reflect", weight * 0.9);
    if (h.obj.mat === "glass") {
      const inside = dot(d, h.n) > 0, n = inside ? mul(h.n, -1) : h.n;
      const eta = inside ? ior : 1 / ior;
      const r0 = ((1 - ior) / (1 + ior)) ** 2, F = r0 + (1 - r0) * (1 - Math.min(1, -dot(d, n))) ** 5;
      const T = refract(d, n, eta);
      go(add(p, mul(n, 0.5)), sub(d, mul(n, 2 * dot(d, n))), depth + 1, "reflect", weight * (T ? F : 1));
      if (T) go(sub(p, mul(n, 0.5)), nrm(T), depth + 1, "refract", weight * (1 - F));
    }
  };
  go(eye, dir, 0, "primary", 1);
  return { segs, log };
}

const COLOURS: Record<Seg["kind"], string> = {
  primary: "#e2e8f0", reflect: "#f59e0b", refract: "#38bdf8", shadow: "#facc15", blocked: "#ef4444", miss: "#64748b",
};

export function RayTreeFigure({ t }: { t?: TrackTranslations }) {
  const [eye, setEye] = useState<V>({ x: 40, y: 150 });
  const [angle, setAngle] = useState(8);
  const [depth, setDepth] = useState(3);
  const [ior, setIor] = useState(1.5);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const dir = nrm({ x: Math.cos((angle * Math.PI) / 180), y: Math.sin((angle * Math.PI) / 180) });
  const { segs, log } = useMemo(() => traceTree(eye, dir, depth, ior), [eye, dir.x, dir.y, depth, ior]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const r = svg.current!.getBoundingClientRect();
    setEye({ x: Math.max(8, Math.min(W - 8, ((e.clientX - r.left) / r.width) * W)), y: Math.max(8, Math.min(FLOOR - 8, ((e.clientY - r.top) / r.height) * H)) });
  };
  const counts = segs.reduce((m, s) => ({ ...m, [s.kind]: (m[s.kind] ?? 0) + 1 }), {} as Record<string, number>);

  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{tx(t, "figTree_title", "The Ray Tree — One Pixel, Traced")}</span>
        <span className="text-[9px] text-[var(--text-muted)] font-mono">{tx(t, "figTree_hint", "drag the eye · aim with the slider")}</span>
      </div>
      <div className="grid md:grid-cols-[1fr_220px] border-b border-[var(--border)]">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-[var(--code-bg)] select-none touch-none"
          onPointerMove={move} onPointerUp={() => { dragging.current = false; }} onPointerLeave={() => { dragging.current = false; }}>
          <line x1={0} y1={FLOOR} x2={W} y2={FLOOR} stroke="#94a3b8" strokeWidth={2} />
          <text x={8} y={FLOOR + 16} fontSize={10} fill="#94a3b8" fontFamily="monospace">matte floor</text>
          {CIRCLES.map((c, i) => (
            <g key={i}>
              <circle cx={c.c.x} cy={c.c.y} r={c.r} fill={c.colour} fillOpacity={c.mat === "glass" ? 0.18 : 0.35} stroke={c.colour} strokeWidth={1.5} />
              <text x={c.c.x} y={c.c.y + 4} fontSize={10} textAnchor="middle" fill={c.colour} fontFamily="monospace">{c.mat}</text>
            </g>
          ))}
          {segs.map((s, i) => (
            <line key={i} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={COLOURS[s.kind]}
              strokeWidth={s.kind === "shadow" || s.kind === "blocked" ? 1 : 2.2 - s.depth * 0.3}
              strokeDasharray={s.kind === "shadow" || s.kind === "blocked" ? "4 3" : undefined} opacity={s.kind === "shadow" || s.kind === "blocked" ? 0.8 : 1} />
          ))}
          <circle cx={LIGHT.x} cy={LIGHT.y} r={9} fill="#fde047" />
          <text x={LIGHT.x - 14} y={LIGHT.y + 4} fontSize={10} textAnchor="end" fill="#fde047" fontFamily="monospace">light</text>
          <g className="cursor-grab" onPointerDown={e => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); }}>
            <circle cx={eye.x} cy={eye.y} r={11} fill="#e2e8f0" />
            <circle cx={eye.x + dir.x * 4} cy={eye.y + dir.y * 4} r={4} fill="#0f172a" />
          </g>
        </svg>
        <pre className="text-[10px] font-mono p-3 leading-relaxed text-[var(--code-text)] bg-[var(--code-bg)] overflow-auto max-h-[300px] border-t md:border-t-0 md:border-l border-[var(--border)]">{log.join("\n")}</pre>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {([["aim", angle, setAngle, -60, 60, 0.5, "°"], ["max depth", depth, setDepth, 0, 6, 1, ""], ["glass IOR", ior, setIor, 1, 2.4, 0.01, ""]] as const).map(([label, v, fn, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => fn(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}{unit}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3 flex-wrap text-[10px] font-mono">
          {(["primary", "reflect", "refract", "shadow", "blocked"] as const).map(k => (
            <span key={k} className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5" style={{ background: COLOURS[k] }} />{k} {counts[k] ?? 0}</span>
          ))}
        </div>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figTree_note", "Aim the ray at the glass ball and raise the depth: every glass hit splits into a reflected and a refracted ray, so the tree doubles at each level. Rays that stay inside the ball past the critical angle can only reflect (total internal reflection). The listing shows each ray's weight: the Fresnel share it passes on to the pixel. Branches with tiny weights are where a real renderer stops early.")}
        </p>
      </div>
    </figure>
  );
}
