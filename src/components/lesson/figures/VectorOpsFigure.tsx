"use client";

import { useRef, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label, pts, type P2 } from "./svg";
import { type V3, add, cross, len, makeProjector, useOrbit } from "./scene3d";

// ── What this figure shows ────────────────────────────────────────────────────
// Dot: drag a and b; the projection of b onto a is the "shadow" whose signed
// length is a·b / |a|. Cross: a and b span a parallelogram; a × b stands
// perpendicular to it with a length equal to its area.

const COL_A = "#ef4444";
const COL_B = "#3b82f6";
const COL_P = "#22c55e";
const COL_N = "#f59e0b";

const f2 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);

// ── Dot product (2D) ──────────────────────────────────────────────────────────
const DW = 360, DH = 260, DU = 60;           // viewBox and px per unit
const DO = { x: DW / 2 - 60, y: DH / 2 + 55 };
const d2s = (v: P2): P2 => ({ x: DO.x + v.x * DU, y: DO.y - v.y * DU });
const s2d = (p: P2): P2 => ({ x: (p.x - DO.x) / DU, y: -(p.y - DO.y) / DU });

function DotPanel({ t }: { t?: TrackTranslations }) {
  const [a, setA] = useState<P2>({ x: 2.4, y: 0.4 });
  const [b, setB] = useState<P2>({ x: 1.2, y: 1.8 });
  const [unit, setUnit] = useState(false);
  const drag = useRef<"a" | "b" | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const nrm = (v: P2) => { const l = Math.hypot(v.x, v.y) || 1; return { x: v.x / l, y: v.y / l }; };
  const A = unit ? nrm(a) : a, B = unit ? nrm(b) : b;
  const la = Math.hypot(A.x, A.y), lb = Math.hypot(B.x, B.y);
  const dotv = A.x * B.x + A.y * B.y;
  const cos = dotv / (la * lb || 1);
  const theta = Math.acos(Math.max(-1, Math.min(1, cos)));
  const ah = { x: A.x / la, y: A.y / la };
  const projLen = dotv / la;                                   // signed length of b's shadow on a
  const foot = { x: ah.x * projLen, y: ah.y * projLen };

  const toLocal = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return s2d({ x: ((e.clientX - r.left) / r.width) * DW, y: ((e.clientY - r.top) / r.height) * DH });
  };
  const clampV = (v: P2): P2 => {
    const l = Math.hypot(v.x, v.y);
    const k = l > 3 ? 3 / l : l < 0.3 ? 0.3 / (l || 1) : 1;
    return { x: Math.round(v.x * k * 10) / 10, y: Math.round(v.y * k * 10) / 10 };
  };
  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const w = toLocal(e);
    const da = Math.hypot(w.x - A.x, w.y - A.y), db = Math.hypot(w.x - B.x, w.y - B.y);
    if (Math.min(da, db) > 0.45) return;
    drag.current = da < db ? "a" : "b";
    svg.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const v = clampV(toLocal(e));
    (drag.current === "a" ? setA : setB)(v);
  };
  const onUp = () => { drag.current = null; };

  // Angle arc from a to b
  const angA = Math.atan2(A.y, A.x), angB = Math.atan2(B.y, B.x);
  let dAng = angB - angA;
  while (dAng > Math.PI) dAng -= 2 * Math.PI;
  while (dAng < -Math.PI) dAng += 2 * Math.PI;
  const arcR = 0.55;
  const arcP0 = d2s({ x: Math.cos(angA) * arcR, y: Math.sin(angA) * arcR });
  const arcP1 = d2s({ x: Math.cos(angA + dAng) * arcR, y: Math.sin(angA + dAng) * arcR });
  const arcMid = d2s({ x: Math.cos(angA + dAng / 2) * (arcR + 0.28), y: Math.sin(angA + dAng / 2) * (arcR + 0.28) });

  const O = d2s({ x: 0, y: 0 });
  const lineFar = d2s({ x: ah.x * 3.6, y: ah.y * 3.6 }), lineNear = d2s({ x: -ah.x * 3.6, y: -ah.y * 3.6 });
  const meaning = cos > 0.985 ? tx(t, "figVec_same", "same direction")
    : Math.abs(cos) < 0.02 ? tx(t, "figVec_perp", "perpendicular")
    : cos < -0.985 ? tx(t, "figVec_opp", "opposite")
    : cos > 0 ? tx(t, "figVec_acute", "less than 90° apart")
    : tx(t, "figVec_obtuse", "more than 90° apart");

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] items-start">
      <svg ref={svg} viewBox={`0 0 ${DW} ${DH}`}
        className="w-full h-auto rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] select-none cursor-crosshair"
        style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        role="img" aria-label="Dot product as a projection">
        {/* Grid */}
        {Array.from({ length: 13 }, (_, i) => i - 6).map(k => (
          <g key={k}>
            <line x1={d2s({ x: k, y: 0 }).x} y1={0} x2={d2s({ x: k, y: 0 }).x} y2={DH} stroke="var(--code-line)" />
            <line x1={0} y1={d2s({ x: 0, y: k }).y} x2={DW} y2={d2s({ x: 0, y: k }).y} stroke="var(--code-line)" />
          </g>
        ))}
        {/* Line through a, for the shadow */}
        <line x1={lineNear.x} y1={lineNear.y} x2={lineFar.x} y2={lineFar.y} stroke={COL_A} strokeOpacity={0.25} strokeDasharray="4 4" />
        {/* The shadow of b on a */}
        <line x1={d2s(B).x} y1={d2s(B).y} x2={d2s(foot).x} y2={d2s(foot).y} stroke="var(--code-muted)" strokeDasharray="3 3" />
        <line x1={O.x} y1={O.y} x2={d2s(foot).x} y2={d2s(foot).y} stroke={dotv >= 0 ? COL_P : COL_A} strokeWidth="5" strokeLinecap="round" opacity={0.55} />
        {/* Angle */}
        <path d={`M ${arcP0.x} ${arcP0.y} A ${arcR * DU} ${arcR * DU} 0 0 ${dAng > 0 ? 0 : 1} ${arcP1.x} ${arcP1.y}`}
          fill="none" stroke={COL_N} strokeWidth="1.5" />
        <Label x={arcMid.x} y={arcMid.y + 3} anchor="middle" color={COL_N}>{`θ ${(theta * 180 / Math.PI).toFixed(0)}°`}</Label>
        {/* Vectors */}
        <Arrow a={O} b={d2s(A)} color={COL_A} w={2.6} head={9} />
        <Arrow a={O} b={d2s(B)} color={COL_B} w={2.6} head={9} />
        <circle cx={d2s(A).x} cy={d2s(A).y} r={6} fill={COL_A} fillOpacity={0.25} />
        <circle cx={d2s(B).x} cy={d2s(B).y} r={6} fill={COL_B} fillOpacity={0.25} />
        <Label x={d2s(A).x + 8} y={d2s(A).y + 4} color={COL_A} bold>a</Label>
        <Label x={d2s(B).x + 8} y={d2s(B).y + 4} color={COL_B} bold>b</Label>
        <Label x={d2s(foot).x + 6} y={d2s(foot).y + 16} color={dotv >= 0 ? COL_P : COL_A}>
          {`shadow ${f2(projLen)}`}
        </Label>
      </svg>

      <div className="space-y-3 font-mono text-[11px]">
        <div className="leading-6">
          <div><span style={{ color: COL_A }}>a</span> = ({f2(A.x)}, {f2(A.y)}) <span className="text-[var(--text-muted)]">|a| = {f2(la)}</span></div>
          <div><span style={{ color: COL_B }}>b</span> = ({f2(B.x)}, {f2(B.y)}) <span className="text-[var(--text-muted)]">|b| = {f2(lb)}</span></div>
        </div>
        <div className="rounded-lg bg-[var(--code-bg)] border border-[var(--code-border)] p-3 leading-6 text-[var(--code-text)]">
          <div>a·b = {f2(A.x)}·{f2(B.x)} + {f2(A.y)}·{f2(B.y)}</div>
          <div className="pl-7">= <span className="font-bold" style={{ color: dotv >= 0 ? COL_P : COL_A }}>{f2(dotv)}</span></div>
          <div className="text-[var(--code-muted)]">= |a|·|b|·cos θ = {f2(la)}·{f2(lb)}·{f2(cos)}</div>
        </div>
        <p className="font-sans text-[12px] text-[var(--text-muted)] leading-relaxed">
          <span className="font-bold" style={{ color: dotv >= 0 ? COL_P : COL_A }}>
            {dotv > 0.005 ? tx(t, "figVec_pos", "Positive") : dotv < -0.005 ? tx(t, "figVec_neg", "Negative") : tx(t, "figVec_zero", "Zero")}
          </span>
          {" — "}{meaning}.{" "}
          {tx(t, "figVec_dotLight", "Normalize both and the dot is just cos θ: that is exactly how diffuse lighting measures how directly a surface faces the light.")}
        </p>
        <button onClick={() => setUnit(u => !u)}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
            unit ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`}>
          {unit ? "✓ " : ""}normalize(a), normalize(b)
        </button>
      </div>
    </div>
  );
}

// ── Cross product (3D) ────────────────────────────────────────────────────────
const CW = 360, CH = 260;

function CrossPanel({ t }: { t?: TrackTranslations }) {
  const [angle, setAngle] = useState(70);
  const [la, setLa] = useState(1.6);
  const [lb, setLb] = useState(1.3);
  const [swap, setSwap] = useState(false);
  const { orbit, handlers, ref, reset } = useOrbit({ yaw: -0.55, pitch: 0.45, zoom: 1 });
  const P = makeProjector(orbit, CW / 2, CH / 2 + 30, 58, 10);

  const r = (angle * Math.PI) / 180;
  const a: V3 = [la, 0, 0];
  const b: V3 = [lb * Math.cos(r), 0, -lb * Math.sin(r)];
  const [first, second] = swap ? [b, a] : [a, b];
  const n = cross(first, second);
  const area = len(n);

  const O = P([0, 0, 0]);
  const para = [[0, 0, 0], a, add(a, b), b].map(q => P(q as V3));
  const nTip = P(n);

  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] items-start">
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${CW} ${CH}`}
          className="w-full h-auto rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }} role="img" aria-label="Cross product and parallelogram" {...handlers}>
          {/* Floor grid */}
          {Array.from({ length: 7 }, (_, i) => i - 3).map(k => {
            const g1a = P([k, 0, -3]), g1b = P([k, 0, 3]), g2a = P([-3, 0, k]), g2b = P([3, 0, k]);
            return (
              <g key={k}>
                <line x1={g1a.x} y1={g1a.y} x2={g1b.x} y2={g1b.y} stroke="var(--code-line)" />
                <line x1={g2a.x} y1={g2a.y} x2={g2b.x} y2={g2b.y} stroke="var(--code-line)" />
              </g>
            );
          })}
          <polygon points={pts(para)} fill="rgba(245,158,11,0.18)" stroke={COL_N} strokeWidth="1" strokeDasharray="4 3" />
          <Label x={(para[0].x + para[2].x) / 2} y={(para[0].y + para[2].y) / 2 + 4} anchor="middle" color={COL_N}>
            {`area ${f2(area)}`}
          </Label>
          <Arrow a={O} b={P(a)} color={COL_A} w={2.6} head={9} />
          <Arrow a={O} b={P(b)} color={COL_B} w={2.6} head={9} />
          <Arrow a={O} b={nTip} color={COL_P} w={2.8} head={10} />
          <Label x={P(a).x + 6} y={P(a).y + 12} color={COL_A} bold>a</Label>
          <Label x={P(b).x + 6} y={P(b).y + 12} color={COL_B} bold>b</Label>
          <Label x={nTip.x + 8} y={nTip.y + 4} color={COL_P} bold>{swap ? "b × a" : "a × b"}</Label>
        </svg>
        <button onClick={reset}
          className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--primary)]">
          {tx(t, "figCam_resetView", "reset view")}
        </button>
      </div>

      <div className="space-y-3">
        <div className="font-mono text-[11px] leading-6">
          <div><span style={{ color: COL_A }}>a</span> = ({a.map(f2).join(", ")})</div>
          <div><span style={{ color: COL_B }}>b</span> = ({b.map(f2).join(", ")})</div>
          <div><span style={{ color: COL_P }}>{swap ? "b × a" : "a × b"}</span> = ({n.map(f2).join(", ")})</div>
          <div className="text-[var(--text-muted)]">|{swap ? "b × a" : "a × b"}| = |a|·|b|·sin θ = {f2(area)}</div>
        </div>
        {([
          ["θ", angle, setAngle, 0, 180, 1, "°"],
          ["|a|", la, setLa, 0.3, 2.2, 0.1, ""],
          ["|b|", lb, setLb, 0.3, 2.2, 0.1, ""],
        ] as const).map(([label, value, set, min, max, step, u]) => (
          <label key={label} className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] w-7">{label}</span>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{value}{u}</span>
          </label>
        ))}
        <button onClick={() => setSwap(s => !s)}
          className="px-2.5 py-1 text-[10px] font-semibold rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40 transition-all">
          ⇄ {swap ? "cross(a, b)" : "cross(b, a)"}
        </button>
        <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
          {tx(t, "figVec_crossNote",
            "Swapping the order flips the result — that is the right-hand rule. At θ = 0° or 180° the area is zero and so is the cross product; at 90° it is largest. For a triangle, cross(B − A, C − A) is its face normal.")}
        </p>
      </div>
    </div>
  );
}

// ── Figure ────────────────────────────────────────────────────────────────────
export function VectorOpsFigure({ t }: { t?: TrackTranslations }) {
  const [tab, setTab] = useState<"dot" | "cross">("dot");
  const btn = (active: boolean) =>
    `px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${
      active ? "border-[var(--primary)]/50 text-[var(--primary)] bg-[var(--primary-low)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/40"}`;
  return (
    <figure className="my-6 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figVec_title", "Dot & Cross — What They Measure")}
        </span>
        <div className="flex gap-1.5">
          <button className={btn(tab === "dot")} onClick={() => setTab("dot")}>dot(a, b)</button>
          <button className={btn(tab === "cross")} onClick={() => setTab("cross")}>cross(a, b)</button>
        </div>
      </div>
      <div className="p-4 md:p-5">
        {tab === "dot" ? <DotPanel t={t} /> : <CrossPanel t={t} />}
        <p className="mt-3 text-[10px] font-mono text-[var(--text-muted)] opacity-80">
          {tab === "dot"
            ? tx(t, "figVec_dotHint", "drag the tips of a and b")
            : tx(t, "figCam_hint", "drag the figure to look around · scroll to zoom")}
        </p>
      </div>
    </figure>
  );
}
