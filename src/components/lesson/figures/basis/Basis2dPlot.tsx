// src/components/lesson/figures/basis/Basis2dPlot.tsx
// The SVG contents of the basis widget: both grids, det area, the F, arrows, handles, chips.
// Pure presentation — the parent <svg> owns the pointer and keyboard handling.
"use client";

import {
  SZ, CTR, NEAR_FLAT, SHAPE, PALETTES, COL_I, COL_J, COL_V,
  mul, det, fmt, toScreen, toWorld, gridStep, transformedGrid, baseGridValues,
  type Pt, type Mat, type Handle, type View,
} from "./basisScene";

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

export function Basis2dPlot({ shown, vec, view, show, hover, selected, theme }: {
  shown: Mat;
  vec: Pt;
  view: View;
  show: { v: boolean; shape: boolean; area: boolean };
  hover: Handle | null;
  selected: Handle | null;
  theme: keyof typeof PALETTES;
}) {
  const P = PALETTES[theme];
  const S = toScreen(view);
  const W = toWorld(view);

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

  const statusText = collapsed ? "det = 0 · the plane collapsed onto a line"
    : nearFlat ? "î and ĵ almost parallel · space nearly flattened" : null;

  return (
    <>
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
    </>
  );
}
