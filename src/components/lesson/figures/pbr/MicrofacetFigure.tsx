"use client";

import { useMemo, useState } from "react";
import { tx } from "@/lib/tracks/tx";
import type { TrackTranslations } from "@/lib/tracks/types";
import { Arrow, Label } from "../../kit/svg";
import { FigureShell } from "@/components/lesson/kit/FigureShell";

// ── What this figure shows ────────────────────────────────────────────────────
// A cross-section of a surface under a microscope: tiny perfect mirrors
// (microfacets) tilted at random, more tilted the rougher the surface.
// Parallel rays arrive from the light and each one mirrors off the facet it
// hits. On a smooth surface they leave together (a sharp highlight); on a rough
// one they fan out (a blurry one). Facets whose normal equals the halfway
// vector h are the only ones that send light into the eye — counting them is
// the job of D. Rays blocked on the way in or out are what G accounts for.

const W = 460, H = 250, BASE = 170, X0 = 20, X1 = W - 20, FACETS = 42;
type P = { x: number; y: number };

/** Deterministic noise so the surface does not jump between renders. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function surface(roughness: number): P[] {
  const r = rng(7);
  const out: P[] = [{ x: X0, y: BASE }];
  const dx = (X1 - X0) / FACETS;
  let y = BASE;
  for (let i = 1; i <= FACETS; i++) {
    const slope = (r() * 2 - 1) * roughness * 1.8;
    y = Math.max(BASE - 26, Math.min(BASE + 26, y + slope * dx));
    if (i === FACETS) y = BASE;
    out.push({ x: X0 + i * dx, y });
  }
  return out;
}

/** First hit of the ray o + t·d with the polyline, t > eps. */
function hit(o: P, d: P, poly: P[], skip = -1): { t: number; i: number } | null {
  let best: { t: number; i: number } | null = null;
  for (let i = 0; i < poly.length - 1; i++) {
    if (i === skip) continue;
    const a = poly[i], b = poly[i + 1];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = d.x * ey - d.y * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.x - o.x) * ey - (a.y - o.y) * ex) / den;
    const u = ((a.x - o.x) * d.y - (a.y - o.y) * d.x) / den;
    if (t > 1e-4 && u >= 0 && u <= 1 && (!best || t < best.t)) best = { t, i };
  }
  return best;
}

/** Outward (upward, screen y down) unit normal of segment i. */
const facetNormal = (poly: P[], i: number): P => {
  const a = poly[i], b = poly[i + 1];
  const ex = b.x - a.x, ey = b.y - a.y, l = Math.hypot(ex, ey);
  return { x: ey / l, y: -ex / l };
};

export function MicrofacetFigure({ t }: { t?: TrackTranslations }) {
  const [rough, setRough] = useState(0.35);
  const [lightDeg, setLightDeg] = useState(-40);
  const [viewDeg, setViewDeg] = useState(22);

  const poly = useMemo(() => surface(rough), [rough]);
  // Directions toward the light / eye (angles from the vertical, screen space)
  const toDir = (dg: number): P => ({ x: Math.sin((dg * Math.PI) / 180), y: -Math.cos((dg * Math.PI) / 180) });
  const L = toDir(lightDeg), V = toDir(viewDeg);
  const Hn = { x: L.x + V.x, y: L.y + V.y }, hl = Math.hypot(Hn.x, Hn.y) || 1;
  const Hd = { x: Hn.x / hl, y: Hn.y / hl };

  const rays = useMemo(() => {
    const out: { from: P; at: P; to: P; blocked: boolean }[] = [];
    const RAYS = 22;
    for (let k = 0; k < RAYS; k++) {
      // Start far along L, spread perpendicular to it
      const target = { x: X0 + 30 + (k / (RAYS - 1)) * (X1 - X0 - 60), y: BASE };
      const o = { x: target.x + L.x * 400, y: target.y + L.y * 400 };
      const d = { x: -L.x, y: -L.y };
      const h = hit(o, d, poly);
      if (!h) continue;
      const at = { x: o.x + d.x * h.t, y: o.y + d.y * h.t };
      const n = facetNormal(poly, h.i);
      const dn = d.x * n.x + d.y * n.y;
      if (dn > 0) continue;                                       // hit a back face
      const r = { x: d.x - 2 * dn * n.x, y: d.y - 2 * dn * n.y };
      const again = hit(at, r, poly, h.i);
      const len = again ? again.t : 70;
      out.push({ from: { x: at.x - d.x * 60, y: at.y - d.y * 60 }, at, to: { x: at.x + r.x * len, y: at.y + r.y * len }, blocked: !!again });
    }
    return out;
  }, [poly, L.x, L.y]);

  // Facets aligned with h (within 6°) reflect straight into the eye
  const aligned = poly.slice(0, -1).map((_, i) => {
    const n = facetNormal(poly, i);
    return n.x * Hd.x + n.y * Hd.y > Math.cos((6 * Math.PI) / 180);
  });
  const alignedShare = aligned.filter(Boolean).length / aligned.length;
  const blockedShare = rays.length ? rays.filter(r => r.blocked).length / rays.length : 0;

  const ground = `M ${X0} ${H} ` + poly.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${X1} ${H} Z`;
  const eyeP = { x: W / 2 + V.x * 120, y: BASE - 10 + V.y * 120 };
  const sunP = { x: W / 2 + L.x * 140, y: BASE - 10 + L.y * 140 };

  return (
    <FigureShell>
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tx(t, "figMicro_title", "Microfacets — Roughness Is Many Tiny Mirrors")}
        </span>
      </div>
      <div className="bg-[var(--code-bg)] border-b border-[var(--border)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Microfacet surface">
          {rays.map((r, i) => (
            <g key={i}>
              <line x1={r.from.x} y1={r.from.y} x2={r.at.x} y2={r.at.y} stroke="#f59e0b" strokeWidth={1} opacity={0.75} />
              <line x1={r.at.x} y1={r.at.y} x2={r.to.x} y2={r.to.y} stroke={r.blocked ? "#ef4444" : "#fbbf24"}
                strokeWidth={1} opacity={0.9} strokeDasharray={r.blocked ? "3 2" : undefined} />
              {r.blocked && <circle cx={r.to.x} cy={r.to.y} r={2} fill="#ef4444" />}
            </g>
          ))}
          <path d={ground} fill="var(--code-line)" opacity={0.85} />
          {poly.slice(0, -1).map((p, i) => (
            <line key={i} x1={p.x} y1={p.y} x2={poly[i + 1].x} y2={poly[i + 1].y}
              stroke={aligned[i] ? "#a855f7" : "var(--code-muted)"} strokeWidth={aligned[i] ? 3.2 : 1.4} strokeLinecap="round" />
          ))}
          {/* Macro normal, light, eye and h */}
          <Arrow a={{ x: W / 2, y: BASE - 8 }} b={{ x: W / 2, y: BASE - 78 }} color="#22c55e" w={1.6} />
          <Label x={W / 2 - 6} y={BASE - 80} color="#22c55e" anchor="end" bold>n</Label>
          <Arrow a={{ x: W / 2, y: BASE - 8 }} b={{ x: W / 2 + Hd.x * 62, y: BASE - 8 + Hd.y * 62 }} color="#a855f7" w={1.6} dash="4 2" />
          <Label x={W / 2 + Hd.x * 66 + 4} y={BASE - 8 + Hd.y * 66} color="#a855f7" bold>h</Label>
          <circle cx={sunP.x} cy={sunP.y} r={9} fill="#f59e0b" />
          <Label x={sunP.x + 12} y={sunP.y + 3} color="#f59e0b" bold>{tx(t, "figMicro_light", "light")}</Label>
          <g transform={`translate(${eyeP.x} ${eyeP.y})`}>
            <ellipse rx={11} ry={6.5} fill="var(--code-bg)" stroke="#3b82f6" strokeWidth={1.6} />
            <circle r={3.2} fill="#3b82f6" />
          </g>
          <Label x={eyeP.x + 14} y={eyeP.y + 3} color="#3b82f6" bold>{tx(t, "figMicro_eye", "eye")}</Label>
        </svg>
      </div>
      <div className="p-4 md:p-5 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="space-y-2 min-w-0">
          {([["roughness", rough, setRough, 0, 1, 0.01, ""], ["light", lightDeg, setLightDeg, -75, 75, 1, "°"], ["eye", viewDeg, setViewDeg, -75, 75, 1, "°"]] as const).map(([label, v, set, min, max, step, unit]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{label}</span>
              <input type="range" min={min} max={max} step={step} value={v} onChange={e => set(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-[10px] font-mono text-[var(--primary)] w-10 text-right">{v}{unit}</span>
            </label>
          ))}
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {tx(t, "figMicro_note", "Purple facets have their normal equal to h, so they mirror the light straight into the eye. Smooth surface: almost every facet agrees, the reflection is a tight bright spot. Rough surface: few facets agree, the same energy spreads over a wide dim lobe. Red dashed rays hit a neighbouring facet — light lost to shadowing and masking.")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--code-border)] bg-[var(--code-bg)] p-3 font-mono text-[10.5px] leading-relaxed text-[var(--code-text)] min-w-[200px]">
          <div><span className="text-[#a855f7]">{tx(t, "figMicro_alignedLbl", "facets ∥ h")}</span> ≈ {(alignedShare * 100).toFixed(0)}% <span className="text-[var(--code-muted)]">→ D</span></div>
          <div><span className="text-[#ef4444]">{tx(t, "figMicro_blockedLbl", "rays blocked")}</span> ≈ {(blockedShare * 100).toFixed(0)}% <span className="text-[var(--code-muted)]">→ G</span></div>
          <div className="text-[var(--code-muted)]">{tx(t, "figMicro_fLbl", "how much each mirror reflects")} → F</div>
        </div>
      </div>
    </FigureShell>
  );
}
